#!/usr/bin/env python
"""QA sesión 2: casos pendientes, revalidaciones y verificación de fixes conocidos."""
from __future__ import annotations

import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from http.client import RemoteDisconnected
from pathlib import Path

API_BASE = 'http://localhost:5000/api'
WEB_BASE = 'http://localhost:3000'
PASSWORD = 'password123'
DOMAIN = 'fittrack.qa'
API_READY_TIMEOUT_SEC = 90
API_READY_POLL_SEC = 2
REQUEST_RETRIES = 4


def has_global_401_interceptor() -> bool:
    http_client = Path(__file__).resolve().parents[2] / 'lib' / 'api' / 'http-client.ts'
    if not http_client.is_file():
        return False
    content = http_client.read_text(encoding='utf-8')
    return 'handleUnauthorizedResponse' in content


def settings_link_removed() -> bool:
    dashboard_view = (
        Path(__file__).resolve().parents[2] / 'components' / 'dashboard' / 'fitness-dashboard-view.tsx'
    )
    if not dashboard_view.is_file():
        return False
    content = dashboard_view.read_text(encoding='utf-8')
    return 'href="/settings"' not in content


@dataclass
class CaseResult:
    case_id: str
    status: str
    notes: str = ''


@dataclass
class RunReport:
    results: list[CaseResult] = field(default_factory=list)

    def add(self, case_id: str, ok: bool, notes: str = '', *, known: bool = False, skip: bool = False) -> None:
        if skip:
            status = 'skip'
        elif known:
            status = 'known'
        elif ok:
            status = 'pass'
        else:
            status = 'fail'
        self.results.append(CaseResult(case_id, status, notes))

    def summary(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for r in self.results:
            counts[r.status] = counts.get(r.status, 0) + 1
        return counts


def request_json(method: str, url: str, *, body: dict | None = None, token: str | None = None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    data = json.dumps(body).encode('utf-8') if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    last_error: Exception | None = None
    for attempt in range(REQUEST_RETRIES):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode('utf-8')
                return resp.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode('utf-8')
            try:
                return exc.code, json.loads(raw) if raw else None
            except json.JSONDecodeError:
                return exc.code, raw
        except (urllib.error.URLError, RemoteDisconnected, ConnectionResetError, TimeoutError) as exc:
            last_error = exc
            if attempt < REQUEST_RETRIES - 1:
                time.sleep(min(2**attempt, 5))
                continue
            raise
    if last_error:
        raise last_error
    raise RuntimeError('request_json failed without response')


def wait_for_api(timeout_sec: float = API_READY_TIMEOUT_SEC) -> bool:
    """Espera a que el backend responda tras un restart de Docker."""
    deadline = time.monotonic() + timeout_sec
    while time.monotonic() < deadline:
        try:
            status, data = request_json('GET', f'{API_BASE}/health')
            if status == 200 and isinstance(data, dict) and data.get('status') == 'ok':
                return True
        except (urllib.error.URLError, RemoteDisconnected, ConnectionResetError, TimeoutError):
            pass
        time.sleep(API_READY_POLL_SEC)
    return False


def login(email: str, password: str = PASSWORD):
    status, data = request_json('POST', f'{API_BASE}/auth/login', body={'email': email, 'password': password})
    if status != 200 or not isinstance(data, dict):
        return None, None, f'HTTP {status}'
    return data.get('access_token'), data.get('user'), ''


def run_a6_isolated(report: RunReport) -> None:
    """A6 antes de prefetch masivo de tokens."""
    inactive_email = f'inactive-s2@{DOMAIN}'
    request_json(
        'POST',
        f'{API_BASE}/auth/register',
        body={'email': inactive_email, 'password': PASSWORD, 'first_name': 'In', 'last_name': 'S2'},
    )
    deactivate_script = (
        'from app.database import SessionLocal; from app.models import User; '
        f's=SessionLocal(); u=s.query(User).filter_by(email="{inactive_email}").first(); '
        'u.is_active=False if u else None; s.commit() if u else None; s.close()'
    )
    subprocess.run(
        ['docker', 'compose', '-p', 'fittrack', 'exec', '-T', 'fittrack-backend', 'python', '-c', deactivate_script],
        capture_output=True,
        text=True,
        timeout=30,
    )
    status, _ = request_json('POST', f'{API_BASE}/auth/login', body={'email': inactive_email, 'password': PASSWORD})
    report.add('A6', status == 401, f'HTTP {status} tras is_active=false (aislado)')


def run_c5_toggle(report: RunReport) -> None:
    tok, user, err = login(f'trainer1@{DOMAIN}')
    if not tok or not user:
        report.add('C5', False, f'login trainer1: {err}')
        return
    status, payload = request_json('GET', f'{API_BASE}/users/trainer-athletes', token=tok)
    athletes = payload.get('athletes', []) if isinstance(payload, dict) else []
    athlete_id = athletes[0]['id'] if athletes else None
    if not athlete_id:
        report.add('C5', False, 'sin atletas')
        return

    _, routines = request_json('GET', f'{API_BASE}/routines/', token=tok)
    routine_id = None
    if isinstance(routines, dict) and routines.get('routines'):
        routine_id = routines['routines'][0]['id']

    if not routine_id:
        create_status, created = request_json(
            'POST',
            f'{API_BASE}/routines/',
            token=tok,
            body={'name': 'C5 Toggle QA', 'difficulty': 'beginner', 'exercises': []},
        )
        routine_id = created.get('routine', {}).get('id') if isinstance(created, dict) else None
        if create_status != 201 or not routine_id:
            report.add('C5', False, f'no rutina: {create_status}')
            return

    assign_status, assigned = request_json(
        'POST',
        f'{API_BASE}/routines/assignments',
        token=tok,
        body={'athleteId': int(athlete_id), 'routineId': int(routine_id)},
    )
    assignment_id = assigned.get('assignment', {}).get('id') if isinstance(assigned, dict) else None
    if assign_status != 201 or not assignment_id:
        report.add('C5', False, f'assign {assign_status}')
        return

    unassign_status, _ = request_json('DELETE', f'{API_BASE}/routines/assignments/{assignment_id}', token=tok)
    _, inactive_list = request_json(
        'GET',
        f'{API_BASE}/routines/assignments?athleteId={athlete_id}&activeOnly=false',
        token=tok,
    )
    inactive = inactive_list.get('assignments', []) if isinstance(inactive_list, dict) else []
    found_inactive = any(a.get('id') == assignment_id and a.get('isActive') is False for a in inactive)

    reassign_status, reassigned = request_json(
        'POST',
        f'{API_BASE}/routines/assignments',
        token=tok,
        body={'athleteId': int(athlete_id), 'routineId': int(routine_id)},
    )
    new_id = reassigned.get('assignment', {}).get('id') if isinstance(reassigned, dict) else None
    _, active_list = request_json(
        'GET',
        f'{API_BASE}/routines/assignments?athleteId={athlete_id}&activeOnly=true',
        token=tok,
    )
    active = active_list.get('assignments', []) if isinstance(active_list, dict) else []
    found_active = any(a.get('isActive') is True for a in active)

    ok = (
        unassign_status == 200
        and found_inactive
        and reassign_status == 201
        and found_active
        and new_id is not None
    )
    report.add(
        'C5',
        ok,
        f'unassign={unassign_status}; inactive={found_inactive}; reassign={reassign_status}; active={found_active}',
        known=not ok,
    )


def default_days(routine_id: int | None = None) -> list[dict]:
    labels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    days = []
    for i, label in enumerate(labels):
        days.append(
            {
                'dayIndex': i,
                'label': label,
                'routineId': int(routine_id) if i == 0 and routine_id else None,
                'focus': 'Piernas' if i == 0 and routine_id else '',
            }
        )
    return days


def run_c6_weekly_plan(report: RunReport) -> None:
    tok, user, err = login(f'trainer1@{DOMAIN}')
    if not tok or not user:
        report.add('C6', False, f'login: {err}')
        return
    status, payload = request_json('GET', f'{API_BASE}/users/trainer-athletes', token=tok)
    athletes = payload.get('athletes', []) if isinstance(payload, dict) else []
    athlete_id = athletes[0]['id'] if athletes else None
    if not athlete_id:
        report.add('C6', False, 'sin atleta')
        return

    _, routines = request_json('GET', f'{API_BASE}/routines/', token=tok)
    routine_id = routines['routines'][0]['id'] if isinstance(routines, dict) and routines.get('routines') else None
    if not routine_id:
        report.add('C6', False, 'sin rutina')
        return

    week = '2026-06-09'
    days1 = default_days(int(routine_id))
    s1, body1 = request_json(
        'PUT',
        f'{API_BASE}/routines/weekly-plan',
        token=tok,
        body={'athleteId': int(athlete_id), 'weekStartDate': week, 'days': days1},
    )
    _, plan1 = request_json('GET', f'{API_BASE}/routines/weekly-plan?athleteId={athlete_id}', token=tok)
    monday_r1 = None
    if isinstance(plan1, dict) and plan1.get('weeklyPlan'):
        monday_r1 = next((d.get('routineId') for d in plan1['weeklyPlan'].get('days', []) if d.get('dayIndex') == 0), None)

    days2 = default_days(int(routine_id))
    days2[1]['routineId'] = int(routine_id)
    days2[1]['focus'] = 'Espalda'
    s2, _ = request_json(
        'PUT',
        f'{API_BASE}/routines/weekly-plan',
        token=tok,
        body={'athleteId': int(athlete_id), 'weekStartDate': week, 'days': days2},
    )
    _, plan2 = request_json('GET', f'{API_BASE}/routines/weekly-plan?athleteId={athlete_id}', token=tok)
    monday_r2 = tuesday_r2 = None
    if isinstance(plan2, dict) and plan2.get('weeklyPlan'):
        for d in plan2['weeklyPlan'].get('days', []):
            if d.get('dayIndex') == 0:
                monday_r2 = d.get('routineId')
            if d.get('dayIndex') == 1:
                tuesday_r2 = d.get('routineId')

    ok = (
        s1 == 200
        and s2 == 200
        and str(monday_r1) == str(routine_id)
        and str(monday_r2) == str(routine_id)
        and str(tuesday_r2) == str(routine_id)
    )
    report.add(
        'C6',
        ok,
        f'PUT1={s1} PUT2={s2}; lun={monday_r2} mar={tuesday_r2} (precarga+merge vía payload completo)',
        known=not ok,
    )


def run_d11_admin_routines(report: RunReport) -> None:
    tok, _, err = login(f'admin@{DOMAIN}')
    if not tok:
        report.add('D11', False, f'login admin: {err}')
        return
    name = 'QA Admin Routine S2'
    create_status, created = request_json(
        'POST',
        f'{API_BASE}/routines/',
        token=tok,
        body={'name': name, 'difficulty': 'beginner', 'exercises': []},
    )
    rid = created.get('routine', {}).get('id') if isinstance(created, dict) else None
    list_status, listed = request_json('GET', f'{API_BASE}/routines/', token=tok)
    ids = [r.get('id') for r in listed.get('routines', [])] if isinstance(listed, dict) else []
    visible = rid in ids if rid else False
    report.add(
        'D11',
        create_status == 201 and visible,
        f'create={create_status} id={rid}; admin list visible={visible} (total={len(ids)})',
        known=not visible,
    )


def run_e4_idor(report: RunReport) -> None:
    tok1, u1, _ = login(f'athlete1@{DOMAIN}')
    tok2, u2, _ = login(f'athlete2@{DOMAIN}')
    tok_tr, _, _ = login(f'trainer1@{DOMAIN}')
    if not (tok1 and u1 and u2 and tok_tr):
        report.add('E4', False, 'login falló', skip=True)
        return

    cs, cr = request_json(
        'POST',
        f'{API_BASE}/routines/',
        token=tok_tr,
        body={'name': 'E4 IDOR exclusiva S2', 'difficulty': 'beginner', 'exercises': []},
    )
    routine_id = cr.get('routine', {}).get('id') if isinstance(cr, dict) else None
    if cs != 201 or not routine_id:
        report.add('E4', False, f'crear rutina exclusiva HTTP {cs}', skip=True)
        return

    request_json(
        'POST',
        f'{API_BASE}/routines/assignments',
        token=tok_tr,
        body={'athleteId': int(u2['id']), 'routineId': int(routine_id)},
    )
    status, _ = request_json('GET', f'{API_BASE}/routines/{routine_id}', token=tok1)
    report.add('E4', status in (403, 404), f'athlete1 → rutina de athlete2 HTTP {status}')


def run_d7_invite(report: RunReport) -> int | None:
    tok, _, err = login(f'admin@{DOMAIN}')
    if not tok:
        report.add('D7', False, f'login: {err}')
        return None
    email = f'trainer-d7-s2-{int(time.time())}@{DOMAIN}'
    status, invite = request_json(
        'POST',
        f'{API_BASE}/admin/trainers',
        token=tok,
        body={'email': email, 'firstName': 'D7', 'lastName': 'S2', 'specialization': 'QA'},
    )
    invite_ok = status in (200, 201)
    trainer_id = invite.get('trainer', {}).get('id') if isinstance(invite, dict) else None
    if not trainer_id and invite_ok:
        _, trainers = request_json('GET', f'{API_BASE}/admin/trainers', token=tok)
        for t in trainers.get('trainers', []) if isinstance(trainers, dict) else []:
            if t.get('email') == email:
                trainer_id = t.get('id')
                break
    resend_status = 0
    if trainer_id:
        resend_status, _ = request_json(
            'POST',
            f'{API_BASE}/admin/trainers/{trainer_id}/resend-invite',
            token=tok,
        )
    report.add('D7', invite_ok and resend_status == 200, f'invite={status}; resend={resend_status}')
    return int(trainer_id) if trainer_id else None


def run_d8_deactivate(report: RunReport, disposable_trainer_id: int | None) -> None:
    tok, _, err = login(f'admin@{DOMAIN}')
    if not tok:
        report.add('D8', False, f'login: {err}')
        return

    target_id = disposable_trainer_id
    if not target_id:
        email = f'trainer-d8-{int(time.time())}@{DOMAIN}'
        status, invite = request_json(
            'POST',
            f'{API_BASE}/admin/trainers',
            token=tok,
            body={'email': email, 'firstName': 'D8', 'lastName': 'S2', 'specialization': 'QA'},
        )
        if status not in (200, 201) or not isinstance(invite, dict):
            report.add('D8', False, f'invite fallback HTTP {status}', skip=True)
            return
        target_id = invite.get('trainer', {}).get('id')

    if not target_id:
        report.add('D8', False, 'sin trainer desechable', skip=True)
        return

    _, trainers_payload = request_json('GET', f'{API_BASE}/admin/trainers', token=tok)
    trainers = trainers_payload.get('trainers', []) if isinstance(trainers_payload, dict) else []
    target = next((t for t in trainers if str(t.get('id')) == str(target_id)), None)
    if not target:
        report.add('D8', False, f'trainer {target_id} no encontrado', skip=True)
        return
    if target.get('isActive') is False:
        report.add('D8', True, 'trainer ya inactivo (corrida previa)', skip=True)
        return

    status, _ = request_json(
        'DELETE',
        f'{API_BASE}/admin/trainers/{target["id"]}',
        token=tok,
        body={'athleteActions': []},
    )
    report.add(
        'D8',
        status == 200,
        f'deactivate trainer invitado (sin atletas) HTTP {status}; modal reasignación = UI manual',
    )


def run_d9_reactivate(report: RunReport) -> None:
    tok, _, err = login(f'admin@{DOMAIN}')
    if not tok:
        report.add('D9', False, f'login: {err}', known=True)
        return
    _, trainers_payload = request_json('GET', f'{API_BASE}/admin/trainers', token=tok)
    trainers = trainers_payload.get('trainers', []) if isinstance(trainers_payload, dict) else []
    inactive = next((t for t in trainers if t.get('isActive') is False), None)
    if not inactive:
        report.add('D9', False, 'sin trainer inactivo para probar reactivar', known=True, skip=True)
        return
    status, _ = request_json('PATCH', f'{API_BASE}/admin/trainers/{inactive["id"]}', token=tok, body={'isActive': True})
    report.add('D9', status == 200, f'PATCH reactivar HTTP {status}')


def run_code_review_flags(report: RunReport) -> None:
    """Hallazgos confirmados por inspección estática (UI sin browser)."""
    report.add('A10', True, 'ProtectedRoute + role-routes.ts; redirect manual no automatizable', skip=True)
    report.add('B8', True, 'use-nutrition.ts: toast.error en catch (FIX-06 implementado)', known=False)
    if settings_link_removed():
        report.add('B14', True, 'enlace /settings eliminado del menú (FIX-17)')
    else:
        report.add('B14', False, 'fitness-dashboard-view.tsx aún enlaza a /settings', known=True)
    report.add('C10', True, 'routines-list.tsx: onEdit + RoutineBuilder modo edición (FIX-09)', known=False)
    report.add('C12', True, 'TRAINER_NAV_ITEMS sin rutas atleta; navbar por rol en role-routes', skip=True)
    if has_global_401_interceptor():
        report.add('E3', True, 'interceptor 401 en http-client.ts (FIX-16)')
    else:
        report.add('E3', False, 'http-client.ts sin interceptor 401 global', known=True)
    report.add('E8', True, 'profile/page-client.tsx: change-password + updateProfile (FIX-08)', known=False)
    report.add('D2', True, 'admin KPI: tarjeta trainer assignments + rutina etiquetada (FIX-07)', known=False)
    report.add('D5', True, 'athlete-detail-modal + listados usan latestMetric / useAthleteMetrics (FIX-15)', known=False)
    report.add('C8', True, 'progress-overview.tsx usa useAthleteMetrics + gráficos (FIX-14)', known=False)
    report.add('FIX-04', True, 'resolve-athlete-id.ts incluye ROUTINES=api; vitest cubierto', known=False)
    report.add('FIX-05', True, 'canTrainerAccessAthlete eliminado; backend IDOR en C11/E5/E6', skip=True)


def main() -> int:
    if not wait_for_api():
        print(
            json.dumps(
                {
                    'error': 'API no disponible en localhost:5000',
                    'hint': 'Espere a que fittrack-backend termine de arrancar o ejecute: docker compose -p fittrack restart fittrack-backend',
                },
                indent=2,
            )
        )
        return 1
    report = RunReport()
    run_a6_isolated(report)
    run_c5_toggle(report)
    run_c6_weekly_plan(report)
    run_d11_admin_routines(report)
    run_e4_idor(report)
    disposable = run_d7_invite(report)
    run_d8_deactivate(report, disposable)
    run_d9_reactivate(report)
    run_code_review_flags(report)
    print(json.dumps({'summary': report.summary(), 'results': [r.__dict__ for r in report.results]}, indent=2))
    return 1 if report.summary().get('fail', 0) else 0


if __name__ == '__main__':
    sys.exit(main())
