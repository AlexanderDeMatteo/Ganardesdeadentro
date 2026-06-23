#!/usr/bin/env python
"""Seed manual: 1 admin, 1 trainer, 5 atletas (Básica/Premium/Pro) con datos completos."""
from __future__ import annotations

import os
import sys
from datetime import date, datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('ENVIRONMENT', 'development')
os.environ['SEED_DEMO_TRAINERS'] = 'false'

from app import create_app
from app.database import SessionLocal, drop_db, init_db
from app.models import Membership, RoleEnum, User, UserMembership, UserProfile
from app.services.auth_service import AuthService
from app.services.membership_service import MembershipService
from app.services.metrics_service import MetricsService
from app.services.nutrition_diary_service import NutritionDiaryService
from app.services.nutrition_service import NutritionService
from app.services.routine_service import RoutineService
from app.services.session_service import SessionService
from app.services.user_service import UserService

PASSWORD = 'password123'
DOMAIN = 'fittrack.qa'

PLANS = (
    {
        'name': 'Básica',
        'functionalTier': 'basic',
        'description': 'Plan básico manual',
        'price': 0,
        'color': 'gray',
        'features': ['Rutinas básicas'],
    },
    {
        'name': 'Premium',
        'functionalTier': 'premium',
        'description': 'Plan premium manual',
        'price': 19.99,
        'color': 'blue',
        'features': ['Titan nutrición', 'Métricas avanzadas'],
    },
    {
        'name': 'Pro',
        'functionalTier': 'pro',
        'description': 'Plan pro manual',
        'price': 29.99,
        'color': 'purple',
        'features': ['Todo Premium', 'Soporte prioritario'],
    },
)

ATHLETES = (
    {
        'email': f'athlete1@{DOMAIN}',
        'first_name': 'Carlos',
        'last_name': 'Méndez',
        'plan': 'Básica',
        'age': 25,
        'gender': 'male',
        'weight': 82.0,
        'height': 178.0,
        'body_fat': 18.5,
        'phone': '+58 412-1110001',
        'country': 'Venezuela',
        'bio': 'Atleta básico — objetivo recomposición.',
        'goal': 'lose',
        'activity': 'moderate',
        'calories': 2100,
    },
    {
        'email': f'athlete2@{DOMAIN}',
        'first_name': 'Laura',
        'last_name': 'Fernández',
        'plan': 'Básica',
        'age': 30,
        'gender': 'female',
        'weight': 65.0,
        'height': 165.0,
        'body_fat': 24.0,
        'phone': '+58 414-1110002',
        'country': 'Venezuela',
        'bio': 'Atleta básica — mantenimiento.',
        'goal': 'maintain',
        'activity': 'light',
        'calories': 1900,
    },
    {
        'email': f'athlete3@{DOMAIN}',
        'first_name': 'Diego',
        'last_name': 'Rojas',
        'plan': 'Premium',
        'age': 28,
        'gender': 'male',
        'weight': 78.0,
        'height': 180.0,
        'body_fat': 14.0,
        'phone': '+58 424-1110003',
        'country': 'Venezuela',
        'bio': 'Atleta premium — volumen muscular.',
        'goal': 'gain',
        'activity': 'active',
        'calories': 2800,
    },
    {
        'email': f'athlete4@{DOMAIN}',
        'first_name': 'Valentina',
        'last_name': 'Torres',
        'plan': 'Premium',
        'age': 35,
        'gender': 'female',
        'weight': 58.0,
        'height': 162.0,
        'body_fat': 22.0,
        'phone': '+58 416-1110004',
        'country': 'Venezuela',
        'bio': 'Atleta premium — definición.',
        'goal': 'lose',
        'activity': 'moderate',
        'calories': 1750,
    },
    {
        'email': f'athlete5@{DOMAIN}',
        'first_name': 'Andrés',
        'last_name': 'Silva',
        'plan': 'Pro',
        'age': 22,
        'gender': 'male',
        'weight': 88.0,
        'height': 185.0,
        'body_fat': 12.0,
        'phone': '+58 426-1110005',
        'country': 'Venezuela',
        'bio': 'Atleta pro — competición.',
        'goal': 'gain',
        'activity': 'very_active',
        'calories': 3200,
    },
)

ROUTINE_EXERCISES = [
    {'exerciseId': 'bench-press', 'exerciseName': 'Bench Press', 'sets': 4, 'reps': 8, 'rest': 90},
    {'exerciseId': 'squat', 'exerciseName': 'Squat', 'sets': 4, 'reps': 6, 'rest': 120},
    {'exerciseId': 'deadlift', 'exerciseName': 'Deadlift', 'sets': 3, 'reps': 5, 'rest': 150},
]

ROUTINE_TEMPLATES = (
    {'name': 'Fuerza superior', 'description': 'Pecho, hombros y tríceps', 'difficulty': 'intermediate', 'duration': 55},
    {'name': 'Piernas y core', 'description': 'Tren inferior completo', 'difficulty': 'intermediate', 'duration': 60},
    {'name': 'Full body', 'description': 'Rutina de cuerpo completo', 'difficulty': 'beginner', 'duration': 45},
)


def create_user(email: str, first_name: str, last_name: str, role: str, trainer_id: int | None = None) -> User:
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
    return user


def ensure_membership_plans() -> None:
    session = SessionLocal()
    try:
        by_name = {plan.name: plan for plan in session.query(Membership).filter_by(is_active=True).all()}
        for spec in PLANS:
            existing = by_name.get(spec['name'])
            if existing is None:
                _, err = MembershipService.create_plan(spec, session=session)
                if err:
                    raise RuntimeError(err)
                continue
            expected_tier = spec['functionalTier'].lower()
            current_tier = (existing.functional_tier or 'basic').lower()
            if current_tier != expected_tier:
                _, err = MembershipService.update_plan(
                    existing.id,
                    {'functionalTier': expected_tier},
                    session=session,
                )
                if err:
                    raise RuntimeError(err)
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


def fill_athlete_profile(athlete_id: int, spec: dict) -> None:
    _, err = UserService.update_athlete(
        athlete_id,
        {
            'age': spec['age'],
            'gender': spec['gender'],
            'weight': spec['weight'],
            'height': spec['height'],
        },
    )
    if err:
        raise RuntimeError(err)

    sex = 'male' if spec['gender'] == 'male' else 'female'
    _, err = UserService.update_body_profile(
        athlete_id,
        {'heightCm': spec['height'], 'age': spec['age'], 'sex': sex},
    )
    if err:
        raise RuntimeError(err)

    session = SessionLocal()
    try:
        user = session.query(User).filter_by(id=athlete_id).first()
        if user and user.profile:
            user.profile.initial_body_fat_percentage = spec['body_fat']
            user.profile.phone = spec['phone']
            user.profile.country = spec['country']
            user.profile.bio = spec['bio']
            session.commit()
    finally:
        session.close()


def seed_metrics(athlete_id: int, base_weight: float, base_body_fat: float) -> None:
    today = date.today()
    for weeks_ago in (8, 6, 4, 2, 0):
        measurement_date = (today - timedelta(weeks=weeks_ago)).isoformat()
        weight = round(base_weight - weeks_ago * 0.3, 1)
        body_fat = round(base_body_fat - weeks_ago * 0.15, 1)
        _, err = MetricsService.add_metric(
            athlete_id,
            {
                'date': measurement_date,
                'weight': weight,
                'bodyFat': max(body_fat, 8.0),
                'bodyFatSource': 'manual',
                'chest': 95 + weeks_ago * 0.2,
                'waist': 78 - weeks_ago * 0.1,
                'hips': 98,
                'notes': f'Medición semana -{weeks_ago}',
            },
        )
        if err:
            raise RuntimeError(err)


def nutrition_plan_payload(athlete_id: int, spec: dict, published_by: str) -> dict:
    protein = round(spec['calories'] * 0.3 / 4)
    carbs = round(spec['calories'] * 0.45 / 4)
    fat = round(spec['calories'] * 0.25 / 9)
    return {
        'athleteId': athlete_id,
        'macroTargets': {
            'calories': spec['calories'],
            'proteinG': protein,
            'carbsG': carbs,
            'fatG': fat,
            'splitLabel': 'Balanced',
        },
        'mealPlan': {
            'id': f'plan-{athlete_id}',
            'name': f'Plan {spec["first_name"]}',
            'days': [
                {
                    'day': 0,
                    'meals': {
                        'breakfast': [
                            {'id': f'meal-{athlete_id}-breakfast', 'name': 'Avena con frutas', 'calories': 400},
                        ],
                        'lunch': [
                            {'id': f'meal-{athlete_id}-lunch', 'name': 'Pollo con arroz', 'calories': 650},
                        ],
                        'dinner': [
                            {'id': f'meal-{athlete_id}-dinner', 'name': 'Pescado con verduras', 'calories': 550},
                        ],
                        'snack': [],
                    },
                }
            ],
            'createdAt': datetime.now(timezone.utc).isoformat(),
        },
        'slotTimes': {
            'breakfast': '07:30',
            'lunch': '13:00',
            'dinner': '20:00',
            'snack': '16:00',
        },
        'activityLevel': spec['activity'],
        'goal': spec['goal'],
        'calorieAdjustment': 0,
        'publishedBy': published_by,
    }


def seed_nutrition(athlete_id: int, spec: dict, trainer_email: str) -> None:
    _, err = NutritionService.publish_plan(
        nutrition_plan_payload(athlete_id, spec, published_by=trainer_email),
    )
    if err:
        raise RuntimeError(err)

    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    _, err = NutritionDiaryService.upsert_diary(
        {
            'athleteId': athlete_id,
            'foodLog': [
                {
                    'date': today,
                    'items': [
                        {'id': f'food-{athlete_id}-1', 'name': 'Desayuno: avena', 'calories': 380, 'proteinG': 15},
                        {'id': f'food-{athlete_id}-2', 'name': 'Almuerzo: pollo', 'calories': 620, 'proteinG': 45},
                    ],
                },
                {
                    'date': yesterday,
                    'items': [
                        {'id': f'food-{athlete_id}-3', 'name': 'Cena: ensalada', 'calories': 420, 'proteinG': 28},
                    ],
                },
            ],
            'waterByDate': {today: 1800, yesterday: 2200},
            'waterGoalMl': 2500,
        },
    )
    if err:
        raise RuntimeError(err)


def seed_routines_and_sessions(
    trainer_id: int,
    athlete_id: int,
    routine_index: int,
) -> None:
    template = ROUTINE_TEMPLATES[routine_index % len(ROUTINE_TEMPLATES)]
    routine_data = {
        **template,
        'exercises': ROUTINE_EXERCISES,
    }
    routine, err = RoutineService.create_routine(routine_data, trainer_id, 'trainer')
    if err:
        raise RuntimeError(err)

    _, err = RoutineService.assign_routine(athlete_id, routine['id'], trainer_id)
    if err:
        raise RuntimeError(err)

    week_start = date.today().isoformat()
    days = [
        {'dayIndex': 0, 'label': 'Lun', 'routineId': routine['id'], 'focus': template['name']},
        {'dayIndex': 2, 'label': 'Mié', 'routineId': routine['id'], 'focus': template['name']},
        {'dayIndex': 4, 'label': 'Vie', 'routineId': routine['id'], 'focus': template['name']},
    ]
    _, err = RoutineService.assign_weekly_plan(athlete_id, trainer_id, days, week_start)
    if err:
        raise RuntimeError(err)

    last_week = (date.today() - timedelta(days=7)).isoformat()
    _, err = SessionService.mark_complete(
        athlete_id,
        {
            'athleteId': athlete_id,
            'routineId': routine['id'],
            'scheduledDate': last_week,
            'setLogs': [
                {
                    'exerciseId': 'squat',
                    'exerciseName': 'Squat',
                    'setNumber': 1,
                    'weightKg': 80,
                    'repsLogged': '8',
                    'result': 'completed',
                },
                {
                    'exerciseId': 'bench-press',
                    'exerciseName': 'Bench Press',
                    'setNumber': 1,
                    'weightKg': 60,
                    'repsLogged': '10',
                    'result': 'completed',
                },
            ],
            'completedSets': 2,
            'totalSets': 2,
            'completed': True,
            'sessionOutcome': 'completed',
        },
    )
    if err:
        raise RuntimeError(err)


def fill_trainer_profile(trainer_id: int) -> None:
    ok, err = UserService.update_trainer_profile(
        trainer_id,
        {
            'specialization': 'Fuerza y acondicionamiento',
            'bio': 'Entrenador certificado con 8 años de experiencia en hipertrofia y rendimiento.',
        },
    )
    if not ok:
        raise RuntimeError(err or 'Error actualizando perfil del entrenador')

    session = SessionLocal()
    try:
        trainer = session.query(User).filter_by(id=trainer_id).first()
        if trainer and trainer.profile:
            trainer.profile.phone = '+58 412-9990000'
            trainer.profile.country = 'Venezuela'
            trainer.profile.rating = 4.8
            trainer.profile.max_athletes = 20
            session.commit()
    finally:
        session.close()


def fill_admin_profile(admin_id: int) -> None:
    session = SessionLocal()
    try:
        admin = session.query(User).filter_by(id=admin_id).first()
        if admin:
            profile = admin.profile or UserProfile(user_id=admin.id)
            if admin.profile is None:
                session.add(profile)
            profile.phone = '+58 212-0000000'
            profile.country = 'Venezuela'
            profile.bio = 'Administrador de la plataforma FitTrack.'
            session.commit()
    finally:
        session.close()


def print_summary() -> None:
    session = SessionLocal()
    try:
        total = session.query(User).count()
        admins = session.query(User).filter_by(role=RoleEnum.ADMIN).count()
        trainers = session.query(User).filter_by(role=RoleEnum.TRAINER).count()
        athletes = session.query(User).filter_by(role=RoleEnum.USER).count()
        print(f'Total usuarios: {total} (admin: {admins}, trainers: {trainers}, atletas: {athletes})')
        for spec in ATHLETES:
            athlete = session.query(User).filter_by(email=spec['email']).first()
            if not athlete:
                continue
            active = (
                session.query(UserMembership)
                .filter_by(user_id=athlete.id, is_active=True)
                .first()
            )
            plan_name = active.membership.name if active and active.membership else 'sin plan'
            print(f'  {spec["email"]} → {plan_name}')
    finally:
        session.close()


def main() -> None:
    app = create_app()
    with app.app_context():
        print('Eliminando tablas existentes…')
        drop_db()
        print('Recreando esquema…')
        init_db()
        ensure_membership_plans()

        admin = create_user(f'admin@{DOMAIN}', 'Admin', 'Manual', 'admin')
        fill_admin_profile(admin.id)

        trainer = create_user(f'trainer1@{DOMAIN}', 'Marco', 'Vega', 'trainer')
        fill_trainer_profile(trainer.id)

        athlete_users: list[tuple[User, dict]] = []
        for index, spec in enumerate(ATHLETES):
            athlete = create_user(
                spec['email'],
                spec['first_name'],
                spec['last_name'],
                'user',
                trainer_id=trainer.id,
            )
            assign_plan_to_athlete(athlete.id, spec['plan'])
            fill_athlete_profile(athlete.id, spec)
            seed_metrics(athlete.id, spec['weight'], spec['body_fat'])
            seed_nutrition(athlete.id, spec, f'trainer1@{DOMAIN}')
            seed_routines_and_sessions(trainer.id, athlete.id, index)
            athlete_users.append((athlete, spec))

        print('=== Seed manual completado ===')
        print(f'Contraseña común: {PASSWORD}')
        print(f'Admin:    admin@{DOMAIN}')
        print(f'Trainer:  trainer1@{DOMAIN}')
        for spec in ATHLETES:
            print(f'Atleta ({spec["plan"]:7}): {spec["email"]}')
        print_summary()


if __name__ == '__main__':
    main()
