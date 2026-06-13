#!/usr/bin/env python
"""Seed QA: 1 admin, 10 trainers, 50 athletes. Idempotente por email."""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('ENVIRONMENT', 'development')

from app import create_app
from app.database import SessionLocal, init_db
from app.models import Membership, RoleEnum, User
from app.services.auth_service import AuthService
from app.services.membership_service import MembershipService

PASSWORD = 'password123'
DOMAIN = 'fittrack.qa'

SPECIALIZATIONS = (
    'Fuerza',
    'Cardio',
    'HIIT',
    'Funcional',
    'Powerlifting',
    'Movilidad',
    'CrossFit',
    'Rehab',
    'Nutrición deportiva',
    'Triatlón',
)

PLANS = (
    {
        'name': 'Básica',
        'description': 'Plan básico QA',
        'price': 0,
        'color': 'gray',
        'features': ['Rutinas básicas'],
    },
    {
        'name': 'Premium',
        'description': 'Plan premium QA',
        'price': 19.99,
        'color': 'blue',
        'features': ['Titan nutrición', 'Métricas avanzadas'],
    },
    {
        'name': 'Pro',
        'description': 'Plan pro QA',
        'price': 29.99,
        'color': 'purple',
        'features': ['Todo Premium', 'Soporte prioritario'],
    },
)


def get_or_create_user(email: str, first_name: str, last_name: str, role: str, trainer_id: int | None = None):
    session = SessionLocal()
    try:
        existing = session.query(User).filter_by(email=email).first()
        if existing:
            if trainer_id is not None and existing.role == RoleEnum.USER:
                existing.trainer_id = trainer_id
                session.commit()
            return existing, False
    finally:
        session.close()

    user, error = AuthService.create_user(
        email=email,
        password=PASSWORD,
        first_name=first_name,
        last_name=last_name,
        role=role,
    )
    if error:
        raise RuntimeError(f'No se pudo crear {email}: {error}')

    if trainer_id is not None:
        session = SessionLocal()
        try:
            db_user = session.query(User).filter_by(id=user.id).first()
            if db_user:
                db_user.trainer_id = trainer_id
                session.commit()
        finally:
            session.close()

    return user, True


def set_trainer_specialization(trainer_id: int, specialization: str) -> None:
    session = SessionLocal()
    try:
        trainer = session.query(User).filter_by(id=trainer_id).first()
        if trainer and trainer.profile:
            trainer.profile.specialization = specialization
            session.commit()
    finally:
        session.close()


def ensure_membership_plans() -> list[str]:
    session = SessionLocal()
    try:
        by_name = {plan.name: plan for plan in session.query(Membership).filter_by(is_active=True).all()}
        created: list[str] = []
        for spec in PLANS:
            if spec['name'] in by_name:
                continue
            plan, err = MembershipService.create_plan(spec, session=session)
            if err:
                raise RuntimeError(err)
            created.append(plan['name'])
        return created
    finally:
        session.close()


def assign_plan_to_athlete(athlete_id: int, plan_name: str) -> None:
    session = SessionLocal()
    try:
        plan = session.query(Membership).filter_by(name=plan_name, is_active=True).first()
        if not plan:
            raise RuntimeError(f'Plan {plan_name} no encontrado')
        _, err = MembershipService.assign_membership(athlete_id, plan.id, session=session)
        if err:
            raise RuntimeError(err)
    finally:
        session.close()


def print_summary() -> None:
    session = SessionLocal()
    try:
        admins = session.query(User).filter_by(role=RoleEnum.ADMIN, is_active=True).count()
        trainers = session.query(User).filter_by(role=RoleEnum.TRAINER, is_active=True).count()
        athletes = session.query(User).filter_by(role=RoleEnum.USER, is_active=True).count()
        qa_users = (
            session.query(User)
            .filter(User.email.like(f'%@{DOMAIN}'))
            .count()
        )
        unassigned = (
            session.query(User)
            .filter_by(role=RoleEnum.USER, is_active=True, trainer_id=None)
            .count()
        )
        print(f'Usuarios @{DOMAIN}: {qa_users}')
        print(f'Activos — admin: {admins}, trainers: {trainers}, atletas: {athletes}')
        print(f'Atletas sin entrenador: {unassigned}')
    finally:
        session.close()


def main() -> None:
    app = create_app()
    with app.app_context():
        init_db()

        _, admin_new = get_or_create_user(f'admin@{DOMAIN}', 'Admin', 'QA', 'admin')

        trainers: list[User] = []
        trainers_new = 0
        for i in range(1, 11):
            trainer, created = get_or_create_user(
                f'trainer{i}@{DOMAIN}',
                f'Entrenador{i}',
                'QA',
                'trainer',
            )
            set_trainer_specialization(trainer.id, SPECIALIZATIONS[i - 1])
            trainers.append(trainer)
            if created:
                trainers_new += 1

        athletes_new = 0
        for i in range(1, 51):
            trainer = trainers[(i - 1) // 5]
            _, created = get_or_create_user(
                f'athlete{i}@{DOMAIN}',
                f'Atleta{i}',
                'QA',
                'user',
                trainer_id=trainer.id,
            )
            if created:
                athletes_new += 1

        new_plans = ensure_membership_plans()

        for i in range(1, 51):
            session = SessionLocal()
            try:
                athlete = session.query(User).filter_by(email=f'athlete{i}@{DOMAIN}').first()
                if not athlete:
                    raise RuntimeError(f'athlete{i}@{DOMAIN} no encontrado')
                athlete_id = athlete.id
            finally:
                session.close()

            if i <= 30:
                plan = 'Básica'
            elif i <= 40:
                plan = 'Premium'
            else:
                plan = 'Pro'
            assign_plan_to_athlete(athlete_id, plan)

        print('=== Seed QA completado ===')
        print(f'Admin: admin@{DOMAIN} / {PASSWORD} (nuevo: {admin_new})')
        print(f'Trainers: trainer1..10@{DOMAIN} / {PASSWORD} (nuevos: {trainers_new})')
        print(f'Athletes: athlete1..50@{DOMAIN} / {PASSWORD} (nuevos: {athletes_new})')
        if new_plans:
            print(f'Planes creados: {", ".join(new_plans)}')
        print_summary()


if __name__ == '__main__':
    main()
