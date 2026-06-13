#!/usr/bin/env python
"""Smoke QA automatizado: S1-S4 y G1-G4 (API + rutas Next Titan)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field

API_BASE = 'http://localhost:5000/api'
WEB_BASE = 'http://localhost:3000'
PASSWORD = 'password123'


@dataclass
class CaseResult:
    case_id: str
    status: str  # pass | fail | known | skip
    notes: str = ''


@dataclass
class RunReport:
    results: list[CaseResult] = field(default_factory=list)

    def add(self, case_id: str, ok: bool, notes: str = '', known: bool = False) -> None:
        if known:
            status = 'known'
        elif ok:
            status = 'pass'
        else:
            status = 'fail'
        self.results.append(CaseResult(case_id, status, notes))

    def symbol(self, status: str) -> str:
        return {
            'pass': '✅',
            'fail': '❌',
            'known': '⚠️',
            'skip': '⏭️',
        }[status]

    def summary(self) -> dict[str, int]:
        counts = {'pass': 0, 'fail': 0, 'known': 0, 'skip': 0}
        for r in self.results:
            counts[r.status] = counts.get(r.status, 0) + 1
        return counts


def request_json(
    method: str,
    url: str,
    *,
    body: dict | None = None,
    token: str | None = None,
    expect_status: int | tuple[int, ...] | None = None,
) -> tuple[int, dict | list | str | None]:
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    data = json.dumps(body).encode('utf-8') if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            status = resp.status
            raw = resp.read().decode('utf-8')
            parsed = json.loads(raw) if raw else None
            if expect_status is not None and status not in (
                (expect_status,) if isinstance(expect_status, int) else expect_status
            ):
                return status, parsed
            return status, parsed
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode('utf-8')
        try:
            parsed = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            parsed = raw
        return exc.code, parsed


def login(email: str) -> tuple[str | None, dict | None, str]:
    status, data = request_json(
        'POST',
        f'{API_BASE}/auth/login',
        body={'email': email, 'password': PASSWORD},
    )
    if status != 200 or not isinstance(data, dict):
        return None, None, f'login {status}'
    token = data.get('access_token')
    user = data.get('user')
    if not token or not user:
        return None, None, 'sin token/user'
    return token, user, ''


def run_smoke(report: RunReport) -> None:
    status, data = request_json('GET', f'{API_BASE}/health')
    report.add('S1', status == 200 and isinstance(data, dict) and data.get('status') == 'ok', f'HTTP {status}')

    try:
        req = urllib.request.Request(f'{WEB_BASE}/', method='GET')
        with urllib.request.urlopen(req, timeout=20) as resp:
            report.add('S2', resp.status == 200, f'HTTP {resp.status}')
    except Exception as exc:  # noqa: BLE001
        report.add('S2', False, str(exc))

    token, user, err = login('admin@fittrack.qa')
    report.add(
        'S3',
        token is not None and user.get('role') == 'admin',
        err or f"rol={user.get('role')}",
    )

    report.add(
        'S4',
        True,
        'No automatizable (consola navegador); S2 sin error HTTP',
        known=False,
    )
    report.results[-1].status = 'skip'
    report.results[-1].notes = 'Requiere DevTools manual; frontend HTTP OK vía S2'


def run_g1(report: RunReport) -> None:
    token, user, err = login('admin@fittrack.qa')
    if not token:
        report.add('G1', False, f'login falló: {err}')
        return

    status, overview = request_json('GET', f'{API_BASE}/admin/overview', token=token)
    if status != 200:
        report.add('G1', False, f'overview HTTP {status}')
        return

    status, athletes_payload = request_json('GET', f'{API_BASE}/admin/athletes', token=token)
    athletes = athletes_payload.get('athletes', []) if isinstance(athletes_payload, dict) else []
    found = [a for a in athletes if 'athlete25@fittrack.qa' in (a.get('email') or '')]
    if not found:
        report.add('G1', False, 'athlete25 no encontrado en listado')
        return

    invite_email = 'trainer-invite-qa@fittrack.qa'
    status, invite = request_json(
        'POST',
        f'{API_BASE}/admin/trainers',
        token=token,
        body={
            'email': invite_email,
            'firstName': 'Invite',
            'lastName': 'QA',
            'specialization': 'Smoke',
        },
    )
    invite_ok = status in (200, 201) or (
        status == 400 and isinstance(invite, dict) and 'registrado' in str(invite.get('error', '')).lower()
    )
    athlete_count = overview.get('athleteCount') if isinstance(overview, dict) else '?'
    report.add(
        'G1',
        invite_ok,
        f"overview athleteCount={athlete_count}; búsqueda athlete25 OK; invite HTTP {status}",
    )


def run_g2(report: RunReport) -> None:
    token, user, err = login('trainer1@fittrack.qa')
    if not token:
        report.add('G2', False, f'login falló: {err}')
        return

    status, routine_payload = request_json(
        'POST',
        f'{API_BASE}/routines/',
        token=token,
        body={'name': 'QA Smoke Routine', 'description': 'auto', 'difficulty': 'beginner', 'exercises': []},
    )
    if status != 201 or not isinstance(routine_payload, dict):
        report.add('G2', False, f'crear rutina HTTP {status}')
        return
    routine_id = routine_payload.get('routine', {}).get('id')

    status, athletes_payload = request_json('GET', f'{API_BASE}/users/trainer-athletes', token=token)
    athletes = athletes_payload.get('athletes', []) if isinstance(athletes_payload, dict) else []
    if not athletes:
        report.add('G2', False, 'sin atletas asignados')
        return
    athlete_id = athletes[0]['id']

    status, assign_payload = request_json(
        'POST',
        f'{API_BASE}/routines/assignments',
        token=token,
        body={'athleteId': athlete_id, 'routineId': routine_id},
    )
    if status != 201:
        report.add('G2', False, f'asignar rutina HTTP {status}')
        return

    status, plan_payload = request_json(
        'PUT',
        f'{API_BASE}/nutrition/plan',
        token=token,
        body={
            'athleteId': athlete_id,
            'macroTargets': {'calories': 2200, 'proteinG': 150, 'carbsG': 220, 'fatG': 70},
            'mealPlan': {'breakfast': 'Avena QA'},
            'slotTimes': {},
            'activityLevel': 'moderate',
            'goal': 'maintain',
        },
    )
    report.add(
        'G2',
        status == 200,
        f'rutina id={routine_id}; asignación 201; plan nutrición HTTP {status}',
    )


def run_g3(report: RunReport) -> None:
    token, user, err = login('athlete1@fittrack.qa')
    if not token:
        report.add('G3', False, f'login falló: {err}')
        return
    athlete_id = user['id']

    status, metric_payload = request_json(
        'POST',
        f'{API_BASE}/metrics/',
        token=token,
        body={
            'athleteId': athlete_id,
            'weight': 75.5,
            'date': '2026-06-10T12:00:00Z',
            'notes': 'QA smoke',
        },
    )
    metric_ok = status == 201
    metric_status = status

    status, diary_payload = request_json(
        'POST',
        f'{API_BASE}/nutrition/diary/entries',
        token=token,
        body={
            'athleteId': athlete_id,
            'date': '2026-06-10',
            'item': {'name': 'Pollo QA', 'calories': 420},
        },
    )
    diary_ok = status == 200

    me_status, me_data = request_json('GET', f'{API_BASE}/auth/me', token=token)
    membership = me_data.get('membership', {}).get('name') if isinstance(me_data, dict) else None
    membership_ok = me_status == 200 and membership == 'Básica'

    coach_status, coach_data = request_json(
        'POST',
        f'{WEB_BASE}/api/coach/titan',
        token=token,
        body={'userName': 'Atleta1', 'context': 'smoke qa'},
    )
    coach_ok = coach_status == 200 and isinstance(coach_data, dict) and (
        'phrase' in coach_data or 'message' in coach_data or 'source' in coach_data
    )
    coach_docker_skip = coach_status == 503

    nutri_status, nutri_data = request_json(
        'POST',
        f'{WEB_BASE}/api/nutrition/titan',
        token=token,
        body={
            'messages': [{'role': 'user', 'content': '200g pechuga'}],
        },
    )
    nutri_blocked = nutri_status == 403
    nutri_docker_skip = nutri_status == 503

    if coach_docker_skip or nutri_docker_skip:
        core_ok = metric_ok and diary_ok and membership_ok
        report.add(
            'G3',
            core_ok,
            (
                f'métrica {metric_status}; diario {diary_ok}; membresía={membership}; '
                f'Titan coach {coach_status}, nutrición {nutri_status} — '
                '503 en Docker: Next no alcanza backend (localhost:5000 desde contenedor). '
                'Validar Titan con `pnpm dev` local o Fase 7.'
            ),
            known=core_ok,
        )
        return

    report.add(
        'G3',
        metric_ok and diary_ok and membership_ok and coach_ok and nutri_blocked,
        (
            f'métrica {metric_status}; diario {diary_ok}; membresía={membership}; '
            f'coach Titan {coach_status}; nutrición Titan {nutri_status} (esperado 403)'
        ),
    )


def run_g4(report: RunReport) -> None:
    token, user, err = login('athlete31@fittrack.qa')
    if not token:
        report.add('G4', False, f'login falló: {err}')
        return

    me_status, me_data = request_json('GET', f'{API_BASE}/auth/me', token=token)
    membership = me_data.get('membership', {}).get('name') if isinstance(me_data, dict) else None
    membership_ok = me_status == 200 and membership == 'Premium'

    status, data = request_json(
        'POST',
        f'{WEB_BASE}/api/nutrition/titan',
        token=token,
        body={
            'messages': [{'role': 'user', 'content': 'ensalada con atún'}],
        },
    )
    if status == 503:
        report.add(
            'G4',
            membership_ok,
            f'membresía={membership}; Titan HTTP 503 (Docker: ver nota G3)',
            known=membership_ok,
        )
        return

    ok = status == 200 and isinstance(data, dict)
    source = data.get('source') if isinstance(data, dict) else None
    report.add('G4', ok and membership_ok, f'membresía={membership}; Titan HTTP {status}; source={source}')


def main() -> int:
    report = RunReport()
    run_smoke(report)
    run_g1(report)
    run_g2(report)
    run_g3(report)
    run_g4(report)

    print(json.dumps({'summary': report.summary(), 'results': [r.__dict__ for r in report.results]}, indent=2))
    fails = report.summary().get('fail', 0)
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
