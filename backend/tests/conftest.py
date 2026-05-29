import os

os.environ.setdefault('ENVIRONMENT', 'testing')

import pytest
from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingConfig
from app.database import SessionLocal, drop_db, init_db
from app.models import RoleEnum, User
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


def auth_headers(user):
    token = create_access_token(
        identity=str(user.id),
        additional_claims={'email': user.email, 'role': user.role.value if hasattr(user.role, 'value') else user.role},
    )
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}


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
def admin_headers(admin_user):
    return auth_headers(admin_user)


@pytest.fixture
def trainer_headers(trainer_user):
    return auth_headers(trainer_user)


@pytest.fixture
def athlete_headers(athlete_user):
    return auth_headers(athlete_user)
