import os
from datetime import datetime, timedelta, timezone

os.environ.setdefault('ENVIRONMENT', 'testing')

import pytest
from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingConfig
from app.database import SessionLocal, drop_db, init_db
from app.models import DifficultyEnum, Exercise, Membership, RoleEnum, User, UserMembership
from app.services.auth_service import AuthService


@pytest.fixture
def app():
    application = create_app(TestingConfig)
    application.config.update({'TESTING': True})
    return application


@pytest.fixture
def client(app):
    with app.test_client() as test_client:
        with app.app_context():
            drop_db()
            init_db()
            yield test_client
            SessionLocal.remove()


def create_user(email, password='password123', role='user', trainer_id=None):
    user, error = AuthService.create_user(
        email=email,
        password=password,
        first_name='Test',
        last_name='User',
        role=role,
    )
    assert not error, error
    if trainer_id is not None:
        session = SessionLocal()
        try:
            db_user = session.query(User).filter_by(id=user.id).first()
            db_user.trainer_id = trainer_id
            session.commit()
        finally:
            session.close()
    return user


def register_user(client, email='user@example.com', password='password123', role=None):
    payload = {
        'email': email,
        'password': password,
        'first_name': 'Test',
        'last_name': 'User',
    }
    if role is not None:
        payload['role'] = role
    return client.post('/api/auth/register', json=payload)


def login_user(client, email='user@example.com', password='password123'):
    return client.post('/api/auth/login', json={'email': email, 'password': password})


def seed_cached_exercise(
    *,
    exercise_db_id='bench-press-001',
    name='Bench Press',
    target_muscle='chest',
    equipment='barbell',
):
    session = SessionLocal()
    try:
        existing = session.query(Exercise).filter_by(exercise_db_id=exercise_db_id).first()
        if existing:
            return existing
        exercise = Exercise(
            exercise_db_id=exercise_db_id,
            name=name,
            target_muscle=target_muscle,
            equipment=equipment,
            difficulty=DifficultyEnum.BEGINNER,
            is_cached=True,
        )
        session.add(exercise)
        session.commit()
        session.refresh(exercise)
        return exercise
    finally:
        session.close()


def grant_active_membership(user_id, *, days=30, plan_name='QA Active Plan'):
    """Sembrar una membresía activa válida para un atleta de prueba.

    El backend gatea métricas, rutinas, sesiones y nutrición tras una membresía
    activa (rol ``user``). Las pruebas de funcionalidad del atleta asumen un
    socio al día, así que replican el estado real de un atleta con plan vigente.
    """
    session = SessionLocal()
    try:
        plan = session.query(Membership).filter_by(name=plan_name).first()
        if plan is None:
            plan = Membership(
                name=plan_name,
                functional_tier='premium',
                duration_days=days,
                is_active=True,
            )
            session.add(plan)
            session.commit()
            session.refresh(plan)

        now = datetime.now(timezone.utc)
        session.query(UserMembership).filter_by(user_id=user_id, is_active=True).update(
            {'is_active': False}
        )
        membership = UserMembership(
            user_id=user_id,
            membership_id=plan.id,
            start_date=now,
            end_date=now + timedelta(days=days),
            is_active=True,
            auto_renew=False,
        )
        session.add(membership)
        session.commit()
        session.refresh(membership)
        return membership
    finally:
        session.close()


def auth_headers(user, *, json_content: bool = True):
    token = create_access_token(
        identity=str(user.id),
        additional_claims={'email': user.email, 'role': user.role.value if hasattr(user.role, 'value') else user.role},
    )
    headers = {'Authorization': f'Bearer {token}'}
    if json_content:
        headers['Content-Type'] = 'application/json'
    return headers


@pytest.fixture
def admin_user(client):
    return create_user('admin@example.com', role='admin')


@pytest.fixture
def trainer_user(client):
    return create_user('trainer@example.com', role='trainer')


@pytest.fixture
def athlete_user(client, trainer_user):
    return create_user('athlete@example.com', role='user', trainer_id=trainer_user.id)


@pytest.fixture
def athlete_membership(athlete_user):
    """Otorga membresía activa al atleta de prueba (socio al día)."""
    grant_active_membership(athlete_user.id)
    return athlete_user


@pytest.fixture
def admin_headers(admin_user):
    return auth_headers(admin_user)


@pytest.fixture
def trainer_headers(trainer_user):
    return auth_headers(trainer_user)


@pytest.fixture
def athlete_headers(athlete_user):
    return auth_headers(athlete_user)
