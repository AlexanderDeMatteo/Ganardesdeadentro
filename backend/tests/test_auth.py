import os

os.environ.setdefault('ENVIRONMENT', 'testing')

from app.database import SessionLocal
from app.models import User
from app.services.auth_service import AuthService
from app.services.membership_service import MembershipService
from tests.conftest import login_user, register_user


class TestRegister:
    def test_register_success(self, client):
        response = register_user(client)
        assert response.status_code == 201
        data = response.get_json()
        assert data['user']['role'] == 'user'
        assert 'access_token' in data

    def test_register_ignores_role_elevation(self, client):
        response = register_user(client, email='admin-attempt@example.com', role='admin')
        assert response.status_code == 201
        data = response.get_json()
        assert data['user']['role'] == 'user'

    def test_register_duplicate_email(self, client):
        register_user(client)
        response = register_user(client)
        assert response.status_code == 400
        assert 'email' in response.get_json()['error'].lower()

    def test_register_invalid_email(self, client):
        response = register_user(client, email='not-an-email')
        assert response.status_code == 400
        assert 'email' in response.get_json()['error'].lower()

    def test_register_short_password(self, client):
        response = register_user(client, email='short@example.com', password='short')
        assert response.status_code == 400

    def test_register_missing_fields(self, client):
        response = client.post('/api/auth/register', json={'email': 'incomplete@example.com'})
        assert response.status_code == 400


class TestLogin:
    def test_login_success(self, client):
        register_user(client)
        response = login_user(client)
        assert response.status_code == 200
        assert 'access_token' in response.get_json()

    def test_login_invalid_credentials(self, client):
        register_user(client)
        response = login_user(client, password='wrongpassword')
        assert response.status_code == 401

    def test_login_inactive_user(self, client):
        register_user(client, email='inactive@example.com')
        user = AuthService.get_user_by_email('inactive@example.com')
        assert user is not None
        session = SessionLocal()
        try:
            db_user = session.query(User).filter_by(id=user.id).first()
            db_user.is_active = False
            session.commit()
        finally:
            session.close()

        response = login_user(client, email='inactive@example.com')
        assert response.status_code == 401


class TestProtectedRoutes:
    def test_me_requires_token(self, client):
        response = client.get('/api/auth/me')
        assert response.status_code == 401

    def test_me_with_valid_token(self, client):
        register_response = register_user(client, email='me@example.com')
        token = register_response.get_json()['access_token']
        response = client.get(
            '/api/auth/me',
            headers={'Authorization': f'Bearer {token}'},
        )
        assert response.status_code == 200
        assert response.get_json()['user']['email'] == 'me@example.com'

    def test_me_rejects_inactive_user(self, client):
        register_response = register_user(client, email='inactive-me@example.com')
        token = register_response.get_json()['access_token']
        session = SessionLocal()
        try:
            user = session.query(User).filter_by(email='inactive-me@example.com').first()
            user.is_active = False
            session.commit()
        finally:
            session.close()

        response = client.get(
            '/api/auth/me',
            headers={'Authorization': f'Bearer {token}'},
        )
        assert response.status_code == 401


class TestMeMembership:
    def test_me_membership_null_without_plan(self, client):
        register_response = register_user(client, email='nome@example.com')
        token = register_response.get_json()['access_token']
        response = client.get(
            '/api/auth/me',
            headers={'Authorization': f'Bearer {token}'},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['membership'] is None

    def test_me_includes_membership_when_active(self, client):
        register_response = register_user(client, email='premium@example.com')
        token = register_response.get_json()['access_token']
        user_id = int(register_response.get_json()['user']['id'])

        plan, plan_error = MembershipService.create_plan(
            {
                'name': 'Premium',
                'price': 29.99,
                'description': 'Premium plan',
                'features': ['Titan'],
                'durationDays': 30,
                'color': 'purple',
            },
        )
        assert not plan_error, plan_error
        _, assign_error = MembershipService.assign_membership(user_id, int(plan['id']))
        assert not assign_error, assign_error

        response = client.get(
            '/api/auth/me',
            headers={'Authorization': f'Bearer {token}'},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['membership']['name'] == 'Premium'
        assert data['membership']['planId'] == plan['id']
        assert isinstance(data['membership']['daysRemaining'], int)


class TestChangePassword:
    def test_change_password_success(self, client):
        register_response = register_user(client, email='changepw@example.com')
        token = register_response.get_json()['access_token']
        response = client.post(
            '/api/auth/change-password',
            headers={'Authorization': f'Bearer {token}'},
            json={'old_password': 'password123', 'new_password': 'newpassword99'},
        )
        assert response.status_code == 200
        assert login_user(client, email='changepw@example.com', password='newpassword99').status_code == 200

    def test_change_password_wrong_old_password(self, client):
        register_response = register_user(client, email='wrongold@example.com')
        token = register_response.get_json()['access_token']
        response = client.post(
            '/api/auth/change-password',
            headers={'Authorization': f'Bearer {token}'},
            json={'old_password': 'badoldpassword', 'new_password': 'newpassword99'},
        )
        assert response.status_code == 400
