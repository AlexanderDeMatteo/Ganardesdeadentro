#!/usr/bin/env python
"""QA extendido: secciones A–E vía API (+ rutas Next). F se ejecuta aparte."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path

API_BASE = 'http://localhost:5000/api'
WEB_BASE = 'http://localhost:3000'
PASSWORD = 'password123'
DOMAIN = 'fittrack.qa'


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


def http_status(url: str) -> int:
    try:
        req = urllib.request.Request(url, method='GET')
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except Exception:
        return 0


def login(email: str, password: str = PASSWORD):
    status, data = request_json('POST', f'{API_BASE}/auth/login', body={'email': email, 'password': password})
    if status != 200 or not isinstance(data, dict):
        return None, None, f'HTTP {status}'
    return data.get('access_token'), data.get('user'), ''


@dataclass
class TokenBox:
    store: dict = field(default_factory=dict)

    def get(self, email: str) -> tuple[str | None, dict | None, str]:
        if email not in self.store:
            self.store[email] = login(email)
        return self.store[email]

    def token(self, email: str) -> str | None:
        return self.get(email)[0]

    def user(self, email: str) -> dict | None:
        return self.get(email)[1]


def prefetch_tokens() -> TokenBox:
    box = TokenBox()
    for email in (
        f'admin@{DOMAIN}',
        f'trainer1@{DOMAIN}',
        f'trainer2@{DOMAIN}',
        f'athlete1@{DOMAIN}',
        f'athlete2@{DOMAIN}',
        f'athlete31@{DOMAIN}',
        f'athlete6@{DOMAIN}',
        f'athlete51@{DOMAIN}',
    ):
        box.get(email)
    return box


def run_section_a(report: RunReport, tokens: TokenBox) -> None:
    home = http_status(f'{WEB_BASE}/')
    login_page = http_status(f'{WEB_BASE}/login')
    register_page = http_status(f'{WEB_BASE}/register')
    report.add('A1', home == 200 and login_page == 200 and register_page == 200, f'home={home} login={login_page} register={register_page}')

    reg_email = f'athlete51@{DOMAIN}'
    status, reg = request_json(
        'POST',
        f'{API_BASE}/auth/register',
        body={
            'email': reg_email,
            'password': PASSWORD,
            'first_name': 'Atleta51',
            'last_name': 'QA',
        },
    )
    reg_ok = status in (200, 201) or (status == 400 and isinstance(reg, dict) and 'registrado' in str(reg.get('error', '')).lower())
    if status in (200, 201) and isinstance(reg, dict):
        reg_ok = reg.get('user', {}).get('role') == 'user'
    tok, _, _ = login(reg_email)
    report.add('A2', reg_ok and tok is not None, f'register {status}; login OK={tok is not None}')

    status, elev = request_json(
        'POST',
        f'{API_BASE}/auth/register',
        body={
            'email': f'elevated-{reg_email}',
            'password': PASSWORD,
            'first_name': 'X',
            'last_name': 'Y',
            'role': 'admin',
        },
    )
    role_ok = isinstance(elev, dict) and elev.get('user', {}).get('role') == 'user' if status in (200, 201) else False
    report.add('A3', role_ok or status == 400, f'HTTP {status}; role={elev.get("user", {}).get("role") if isinstance(elev, dict) else "?"}')

    roles_ok = True
    role_notes = []
    for email, expected in (
        (f'admin@{DOMAIN}', 'admin'),
        (f'trainer1@{DOMAIN}', 'trainer'),
        (f'athlete1@{DOMAIN}', 'user'),
    ):
        tok, user, err = tokens.get(email)
        ok = tok and user and user.get('role') == expected
        roles_ok = roles_ok and ok
        role_notes.append(f'{expected}={ok}')
    report.add('A4', roles_ok, '; '.join(role_notes) + ' (redirect UI manual)')

    status, _ = request_json('POST', f'{API_BASE}/auth/login', body={'email': 'athlete1@fittrack.qa', 'password': 'wrong-pass'})
    report.add('A5', status == 401, f'HTTP {status}')

    inactive_email = f'inactive-qa@{DOMAIN}'
    request_json(
        'POST',
        f'{API_BASE}/auth/register',
        body={'email': inactive_email, 'password': PASSWORD, 'first_name': 'In', 'last_name': 'Active'},
    )
    deactivate_script = (
        'from app.database import SessionLocal; from app.models import User; '
        f's=SessionLocal(); u=s.query(User).filter_by(email="{inactive_email}").first(); '
        'u.is_active=False if u else None; s.commit() if u else None; s.close()'
    )
    import subprocess

    subprocess.run(
        ['docker', 'compose', '-p', 'fittrack', 'exec', '-T', 'fittrack-backend', 'python', '-c', deactivate_script],
        capture_output=True,
        text=True,
        timeout=30,
    )
    status, _ = request_json('POST', f'{API_BASE}/auth/login', body={'email': inactive_email, 'password': PASSWORD})
    report.add('A6', status == 401, f'HTTP {status} tras is_active=false')

    tok, _, _ = tokens.get(f'athlete1@{DOMAIN}')
    status, _ = request_json('POST', f'{API_BASE}/auth/logout', token=tok)
    report.add('A7', status == 200, f'logout HTTP {status} (redirect UI manual)')

    status, _ = request_json('GET', f'{API_BASE}/auth/me')
    report.add('A8a', status == 401, f'sin token HTTP {status}')
    admin_tok = tokens.token(f'admin@{DOMAIN}')
    status, me = request_json('GET', f'{API_BASE}/auth/me', token=admin_tok)
    report.add('A8', status == 200 and isinstance(me, dict) and me.get('user'), f'con token HTTP {status}')

    invite_email = f'trainer-activate-qa@{DOMAIN}'
    status, invite = request_json(
        'POST',
        f'{API_BASE}/admin/trainers',
        token=admin_tok,
        body={'email': invite_email, 'firstName': 'Act', 'lastName': 'IV', 'specialization': 'QA'},
    )
    invite_ok = status in (200, 201) or (status == 400 and 'registrado' in str(invite.get('error', '')).lower() if isinstance(invite, dict) else False)
    report.add('A9', invite_ok, f'invite HTTP {status}; flujo /activate UI manual')

    athlete_pages = http_status(f'{WEB_BASE}/admin') == 200 and http_status(f'{WEB_BASE}/trainer') == 200
    report.add('A10', athlete_pages, 'páginas cargan HTTP 200; redirect por rol = UI manual')


def run_section_b(report: RunReport, tokens: TokenBox) -> None:
    pages = ['/dashboard', '/routines', '/metrics', '/profile', '/nutrition', '/memberships']
    codes = [http_status(f'{WEB_BASE}{p}') for p in pages]
    report.add('B1', all(c == 200 for c in codes), f'HTTP {dict(zip(pages, codes))}')

    tok = tokens.token(f'athlete1@{DOMAIN}')
    user = tokens.user(f'athlete1@{DOMAIN}')
    if not tok or not user:
        for case in ('B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B9', 'B10', 'B11', 'B12', 'B13'):
            report.add(case, False, 'login athlete1 falló (¿429 rate limit?)')
        report.add('B8', False, '', known=True)
        if settings_link_removed():
            report.add('B14', True, 'enlace /settings eliminado del menú (FIX-17)')
        else:
            report.add('B14', False, 'fitness-dashboard-view.tsx aún enlaza a /settings', known=True)
        return
    athlete_id = user['id']
    status, my = request_json('GET', f'{API_BASE}/routines/my?athleteId={athlete_id}', token=tok)
    report.add('B2', status == 200, f'my routine HTTP {status}')

    status, metrics = request_json('GET', f'{API_BASE}/metrics/?athleteId={athlete_id}', token=tok)
    metrics_list = metrics.get('metrics', []) if isinstance(metrics, dict) else None
    report.add('B3', status == 200 and isinstance(metrics_list, list), f'count={len(metrics_list) if metrics_list else "?"} (no auto-seed verificado por API)')

    status, _ = request_json(
        'POST',
        f'{API_BASE}/metrics/',
        token=tok,
        body={'athleteId': athlete_id, 'weight': 76.0, 'date': '2026-06-11T10:00:00Z'},
    )
    status2, metrics2 = request_json('GET', f'{API_BASE}/metrics/?athleteId={athlete_id}', token=tok)
    count2 = len(metrics2.get('metrics', [])) if isinstance(metrics2, dict) else 0
    report.add('B4', status == 201 and count2 >= 1, f'POST {status}; GET count={count2}')

    status, _ = request_json(
        'PATCH',
        f'{API_BASE}/users/me/body-profile',
        token=tok,
        body={'heightCm': 178, 'age': 28, 'sex': 'male'},
    )
    status2, bp = request_json('GET', f'{API_BASE}/users/me/body-profile', token=tok)
    report.add('B5', status == 200 and status2 == 200, f'PATCH {status}; GET {status2}')

    report.add('B6', status2 == 200, 'perfil corporal listo para estimación (UI manual en /metrics)')

    status, _ = request_json(
        'POST',
        f'{API_BASE}/nutrition/diary/entries',
        token=tok,
        body={'athleteId': athlete_id, 'date': '2026-06-11', 'item': {'name': 'QA diary', 'calories': 300}},
    )
    status2, diary = request_json('GET', f'{API_BASE}/nutrition/diary?athleteId={athlete_id}', token=tok)
    report.add('B7', status == 200 and status2 == 200, f'POST {status}; GET {status2}')

    report.add('B8', False, 'toast en fallo API no verificable por script', known=True)

    _, me = request_json('GET', f'{API_BASE}/auth/me', token=tok)
    mem = me.get('membership', {}).get('name') if isinstance(me, dict) else None
    report.add('B9', mem == 'Básica', f'membership={mem}')

    tok31 = tokens.token(f'athlete31@{DOMAIN}')
    _, me31 = request_json('GET', f'{API_BASE}/auth/me', token=tok31)
    already_premium = isinstance(me31, dict) and me31.get('membership', {}).get('name') == 'Premium'
    if already_premium:
        report.add('B10', True, 'ya Premium en sesión')
    else:
        plans_status, plans_payload = request_json('GET', f'{API_BASE}/memberships/plans', token=tok31)
        plans = plans_payload.get('plans', plans_payload) if isinstance(plans_payload, dict) else plans_payload
        premium = next((p for p in (plans or []) if isinstance(p, dict) and p.get('name') == 'Premium'), None)
        if premium:
            status, _ = request_json('POST', f'{API_BASE}/memberships/subscribe', token=tok31, body={'planId': premium['id']})
            me_status, me2 = request_json('GET', f'{API_BASE}/auth/me', token=tok31)
            name = me2.get('membership', {}).get('name') if isinstance(me2, dict) else None
            report.add('B10', status == 200 and name == 'Premium', f'subscribe {status}; me={name}')
        else:
            report.add('B10', False, 'plan Premium no encontrado')

    coach_s, coach = request_json('POST', f'{WEB_BASE}/api/coach/titan', token=tok, body={'userName': 'A1', 'context': 'qa'})
    report.add('B11', coach_s == 200, f'HTTP {coach_s}; source={coach.get("source") if isinstance(coach, dict) else "?"}')

    nutri_s, _ = request_json('POST', f'{WEB_BASE}/api/nutrition/titan', token=tok, body={'messages': [{'role': 'user', 'content': 'test'}]})
    report.add('B12', nutri_s == 403, f'HTTP {nutri_s}')

    nutri31_s, nutri31 = request_json('POST', f'{WEB_BASE}/api/nutrition/titan', token=tok31, body={'messages': [{'role': 'user', 'content': 'test'}]})
    report.add('B13', nutri31_s == 200, f'HTTP {nutri31_s}; source={nutri31.get("source") if isinstance(nutri31, dict) else "?"}')

    if settings_link_removed():
        report.add('B14', True, 'enlace /settings eliminado del menú (FIX-17)')
    else:
        settings_status = http_status(f'{WEB_BASE}/settings')
        report.add(
            'B14',
            settings_status == 404,
            f'/settings HTTP {settings_status}; enlace roto en fitness-dashboard-view.tsx',
            known=True,
        )


def run_section_c(report: RunReport, tokens: TokenBox) -> None:
    tok, trainer_user, err = tokens.get(f'trainer1@{DOMAIN}')
    if not tok:
        for case in ('C1', 'C2', 'C3', 'C4', 'C7', 'C9', 'C11'):
            report.add(case, False, f'login trainer falló: {err}')
        for case in ('C5', 'C6', 'C10'):
            report.add(case, False, '', known=True)
        report.add('C8', False, '', known=True)
        report.add('C12', False, '', skip=True)
        return
    status, payload = request_json('GET', f'{API_BASE}/users/trainer-athletes', token=tok)
    athletes = payload.get('athletes', []) if isinstance(payload, dict) else []
    qa_athletes = [a for a in athletes if str(a.get('email', '')).endswith(f'@{DOMAIN}')]
    if not qa_athletes:
        qa_athletes = athletes[:5]
    report.add('C1', status == 200 and len(athletes) == 5, f'atletas={len(athletes)}')

    tok2 = tokens.token(f'trainer2@{DOMAIN}')
    _, payload2 = request_json('GET', f'{API_BASE}/users/trainer-athletes', token=tok2)
    a2 = payload2.get('athletes', []) if isinstance(payload2, dict) else []
    overlap = set(a.get('id') for a in qa_athletes) & set(a.get('id') for a in a2)
    report.add('C2', len(overlap) == 0, f'solapamiento IDs={len(overlap)}')

    status, routine = request_json(
        'POST',
        f'{API_BASE}/routines/',
        token=tok,
        body={'name': 'QA Full Routine', 'difficulty': 'beginner', 'exercises': []},
    )
    rid = routine.get('routine', {}).get('id') if isinstance(routine, dict) else None
    status2, listed = request_json('GET', f'{API_BASE}/routines/', token=tok)
    ids = [r.get('id') for r in (listed.get('routines', []) if isinstance(listed, dict) else [])]
    report.add('C3', status == 201 and rid in ids, f'create {status}; in list={rid in ids}')

    athlete_id = qa_athletes[0]['id'] if qa_athletes else None
    if not athlete_id or not rid:
        report.add('C4', False, 'sin atleta o rutina')
        report.add('C7', False, 'sin atleta')
    else:
        status3, _ = request_json(
            'POST',
            f'{API_BASE}/routines/assignments',
            token=tok,
            body={'athleteId': int(athlete_id), 'routineId': int(rid)},
        )
        status4, assigns = request_json('GET', f'{API_BASE}/routines/assignments?athleteId={athlete_id}', token=tok)
        count = len(assigns.get('assignments', [])) if isinstance(assigns, dict) else 0
        report.add('C4', status3 == 201 and status4 == 200 and count >= 1, f'assign {status3}; list count={count}')

        status5, _ = request_json(
            'PUT',
            f'{API_BASE}/nutrition/plan',
            token=tok,
            body={
                'athleteId': int(athlete_id),
                'macroTargets': {'calories': 2100},
                'mealPlan': {'lunch': 'QA coach plan'},
                'activityLevel': 'moderate',
                'goal': 'maintain',
            },
        )
        tok_a = tokens.token(f'athlete1@{DOMAIN}')
        status6, _ = request_json('GET', f'{API_BASE}/nutrition/plan?athleteId={athlete_id}', token=tok_a)
        report.add('C7', status5 == 200 and status6 == 200, f'PUT {status5}; atleta GET {status6}')

        status7, metrics = request_json('GET', f'{API_BASE}/metrics/?athleteId={athlete_id}', token=tok)
        mcount = len(metrics.get('metrics', [])) if isinstance(metrics, dict) else 0
        report.add('C8', status7 == 200 and mcount >= 1, f'API métricas={mcount}; /trainer/progress UI (12.1)', known=True)

    report.add('C5', False, 'isCompleted vs isActive en UI (10.2)', known=True)
    report.add('C6', False, 'weekly-plan no precarga en editor (10.1)', known=True)

    trainer_id = int(trainer_user['id']) if trainer_user else 0
    status8, _ = request_json(
        'PATCH',
        f'{API_BASE}/users/trainers/{trainer_id}',
        token=tok,
        body={'bio': 'Bio QA full', 'specialization': 'Fuerza QA'},
    )
    report.add('C9', status8 == 200, f'PATCH trainer profile HTTP {status8}')

    report.add('C10', False, 'botón Editar rutina sin acción (11.2)', known=True)

    other_id = a2[0]['id'] if a2 else None
    status9, _ = request_json('GET', f'{API_BASE}/users/athletes/{other_id}', token=tok)
    report.add('C11', status9 in (403, 404), f'atleta ajeno HTTP {status9}')

    report.add('C12', False, 'navbar trainer vs atleta = UI manual', skip=True)


def user_id_from_token(token: str) -> int | None:
    status, data = request_json('GET', f'{API_BASE}/auth/me', token=token)
    if status == 200 and isinstance(data, dict) and data.get('user'):
        return int(data['user']['id'])
    return None


def run_rate_limit_e7(report: RunReport) -> None:
    fails = 0
    last_status = 0
    for i in range(15):
        last_status, _ = request_json(
            'POST',
            f'{API_BASE}/auth/login',
            body={'email': f'ratelimit-final-{i}@example.com', 'password': 'wrong'},
        )
        if last_status == 429:
            break
        fails += 1
    for r in report.results:
        if r.case_id == 'E7':
            r.status = 'pass' if last_status == 429 else 'fail'
            r.notes = f'último HTTP {last_status} tras {fails}+ intentos'
            return
    report.add('E7', last_status == 429, f'último HTTP {last_status} tras {fails}+ intentos')


def run_section_d(report: RunReport, tokens: TokenBox) -> None:
    tok = tokens.token(f'admin@{DOMAIN}')
    status, overview = request_json('GET', f'{API_BASE}/admin/overview', token=tok)
    _, athletes_payload = request_json('GET', f'{API_BASE}/admin/athletes', token=tok)
    _, trainers_payload = request_json('GET', f'{API_BASE}/admin/trainers', token=tok)
    qa_a = len([a for a in athletes_payload.get('athletes', []) if '@fittrack.qa' in (a.get('email') or '')]) if isinstance(athletes_payload, dict) else 0
    qa_t = len([t for t in trainers_payload.get('trainers', []) if '@fittrack.qa' in (t.get('email') or '')]) if isinstance(trainers_payload, dict) else 0
    report.add('D1', status == 200 and qa_a >= 50 and qa_t >= 10, f'QA atletas={qa_a} trainers={qa_t}; overview={overview}')

    report.add('D2', False, 'tarjeta asignaciones mezcla tipos (10.7)', known=True)

    found = any('athlete25@fittrack.qa' == a.get('email') for a in athletes_payload.get('athletes', [])) if isinstance(athletes_payload, dict) else False
    report.add('D3', found, 'athlete25 en listado API (filtro UI manual)')

    athletes_list = athletes_payload.get('athletes', []) if isinstance(athletes_payload, dict) else []
    trainers_list = trainers_payload.get('trainers', []) if isinstance(trainers_payload, dict) else []
    athlete = next((a for a in athletes_list if a.get('email') == 'athlete50@fittrack.qa'), None)
    if not athlete and athletes_list:
        athlete = next((a for a in athletes_list if '@fittrack.qa' in (a.get('email') or '')), None)
    trainer = next((t for t in trainers_list if t.get('email') == 'trainer10@fittrack.qa'), None)
    if not trainer and trainers_list:
        trainer = next((t for t in trainers_list if '@fittrack.qa' in (t.get('email') or '')), None)
    if athlete and trainer:
        status2, _ = request_json(
            'PUT',
            f'{API_BASE}/users/athletes/{athlete["id"]}/trainer',
            token=tok,
            body={'trainerId': trainer['id']},
        )
        report.add('D4', status2 == 200, f'PUT trainer HTTP {status2}')
    else:
        report.add('D4', False, 'atleta50 o trainer10 no encontrado')

    detail = athlete
    has_metrics = bool(detail and detail.get('metrics')) if detail else False
    report.add('D5', detail is not None and not has_metrics, f'detalle OK; metrics embebidas={has_metrics} (12.2)', known=True)

    report.add('D6', qa_t >= 10, f'trainers QA={qa_t}')

    report.add('D7', True, 'invite probado en A9/G1; reenviar token = UI manual', skip=True)
    report.add('D8', True, 'desactivar trainer = UI manual (API DELETE existe)', skip=True)
    report.add('D9', False, 'sin UI/API reactivar trainer (11.5)', known=True)

    report.add('D10', qa_t >= 10 and qa_a >= 50, f'{qa_t} trainers × ~5 atletas QA')

    admin_r_status, admin_r = request_json(
        'POST',
        f'{API_BASE}/routines/',
        token=tok,
        body={'name': 'QA Admin Routine', 'difficulty': 'beginner', 'exercises': []},
    )
    admin_rid = admin_r.get('routine', {}).get('id') if isinstance(admin_r, dict) else None
    list_status, routines = request_json('GET', f'{API_BASE}/routines/', token=tok)
    all_ids = [r.get('id') for r in routines.get('routines', [])] if isinstance(routines, dict) else []
    visible = admin_rid in all_ids if admin_rid else False
    report.add('D11', admin_r_status == 201 and visible, f'creada id={admin_rid}; visible en list admin={visible} (10.3)', known=not visible)

    status_p, plans = request_json('GET', f'{API_BASE}/memberships/plans', token=tok)
    can_create = status_p == 200
    report.add('D12', can_create, f'GET plans {status_p}; edit UI puede faltar (11.4)', known=True)

    if athlete:
        status_n, _ = request_json(
            'PUT',
            f'{API_BASE}/nutrition/plan',
            token=tok,
            body={
                'athleteId': athlete['id'],
                'macroTargets': {'calories': 2000},
                'mealPlan': {'dinner': 'Admin plan'},
                'activityLevel': 'moderate',
                'goal': 'maintain',
            },
        )
        report.add('D13', status_n == 200, f'admin plan HTTP {status_n}')

    tok_tr = tokens.token(f'trainer1@{DOMAIN}')
    status_f, _ = request_json('GET', f'{API_BASE}/admin/overview', token=tok_tr)
    report.add('D14', status_f == 403, f'trainer → admin HTTP {status_f}')


def run_section_e(report: RunReport, tokens: TokenBox) -> None:
    status, _ = request_json('POST', f'{WEB_BASE}/api/coach/titan', body={'userName': 'x'})
    report.add('E1', status == 401, f'coach titan sin token HTTP {status}')
    status_n, _ = request_json('POST', f'{WEB_BASE}/api/nutrition/titan', body={'messages': [{'role': 'user', 'content': 'x'}]})
    report.add('E1n', status_n == 401, f'nutrition titan sin token HTTP {status_n}')

    status, _ = request_json('POST', f'{WEB_BASE}/api/coach/titan', token='invalid-token-qa', body={'userName': 'x'})
    report.add('E2', status == 401, f'HTTP {status} (FIX-18: JWT inválido → 401)')

    if has_global_401_interceptor():
        report.add('E3', True, 'interceptor 401 en http-client.ts (FIX-16)')
    else:
        report.add('E3', False, 'sin interceptor global 401 en frontend (13.1)', known=True)

    tok1, u1, err1 = tokens.get(f'athlete1@{DOMAIN}')
    tok2, u2, err2 = tokens.get(f'athlete2@{DOMAIN}')
    if tok1 and u2:
        _, assigns = request_json('GET', f'{API_BASE}/routines/assignments?athleteId={u2["id"]}', token=tok2 or tok1)
        routine_id = None
        if isinstance(assigns, dict) and assigns.get('assignments'):
            routine_id = assigns['assignments'][0].get('routineId')
        if routine_id and tok1:
            status, _ = request_json('GET', f'{API_BASE}/routines/{routine_id}', token=tok1)
            report.add('E4', status in (403, 404), f'atleta1 → rutina athlete2 HTTP {status}')
        else:
            report.add('E4', True, 'sin rutina B asignada; IDOR no reproducido', skip=True)
    else:
        report.add('E4', False, f'tokens atletas: {err1}/{err2}', skip=True)

    tok_tr1 = tokens.token(f'trainer1@{DOMAIN}')
    u6 = tokens.user(f'athlete6@{DOMAIN}')
    if tok_tr1 and u6:
        status, _ = request_json('GET', f'{API_BASE}/metrics/?athleteId={u6["id"]}', token=tok_tr1)
        report.add('E5', status == 403, f'trainer1 → métricas athlete6 (trainer2) HTTP {status}')
    else:
        report.add('E5', False, 'tokens athlete6/trainer1 no disponibles', skip=True)

    tok_tr2 = tokens.token(f'trainer2@{DOMAIN}')
    if tok_tr2 and u1:
        status, _ = request_json(
            'POST',
            f'{API_BASE}/nutrition/diary/entries',
            token=tok_tr2,
            body={'athleteId': int(u1['id']), 'date': '2026-06-11', 'item': {'name': 'hack', 'calories': 1}},
        )
        report.add('E6', status == 403, f'trainer2 escribe diario athlete1 HTTP {status}')
    else:
        report.add('E6', False, 'login falló', skip=True)

    report.add('E7', True, 'ejecutar con: docker restart + python run_qa_full.py --e7-only', skip=True)

    tok = tokens.token(f'athlete51@{DOMAIN}')
    if tok:
        status, _ = request_json(
            'POST',
            f'{API_BASE}/auth/change-password',
            token=tok,
            body={'old_password': PASSWORD, 'new_password': 'password1234'},
        )
        request_json('POST', f'{API_BASE}/auth/change-password', token=tok, body={'old_password': 'password1234', 'new_password': PASSWORD})
        report.add('E8', status == 200, f'API change-password HTTP {status}; UI perfil puede faltar (11.1)', known=status != 200)
    else:
        report.add('E8', False, 'athlete51 no disponible', skip=True)


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == '--e7-only':
        report = RunReport()
        run_rate_limit_e7(report)
        print(json.dumps({'summary': report.summary(), 'results': [r.__dict__ for r in report.results]}, indent=2))
        return 0 if report.summary().get('fail', 0) == 0 else 1

    report = RunReport()
    tokens = prefetch_tokens()
    run_section_a(report, tokens)
    run_section_b(report, tokens)
    run_section_c(report, tokens)
    run_section_d(report, tokens)
    run_section_e(report, tokens)
    print(json.dumps({'summary': report.summary(), 'results': [r.__dict__ for r in report.results]}, indent=2))
    return 1 if report.summary().get('fail', 0) else 0


if __name__ == '__main__':
    sys.exit(main())
