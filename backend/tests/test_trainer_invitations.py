import hashlib
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models import InvitationToken, RoleEnum, User
from app.services.invitation_service import InvitationService, TRAINER_INVITE_PURPOSE

from tests.conftest import create_user, login_user


def _create_invited_trainer(email='invite-trainer@example.com'):
    trainer, error, raw_token = InvitationService.create_trainer_invitation(
        email=email,
        first_name='Invited',
        last_name='Trainer',
        specialization='Fuerza',
    )
    assert not error, error
    assert raw_token
    return trainer, raw_token


class TestTrainerInvitations:
    def test_admin_creates_trainer_invitation(self, client, admin_headers):
        response = client.post(
            '/api/admin/trainers',
            headers=admin_headers,
            json={
                'email': 'new-trainer@example.com',
                'firstName': 'Nuevo',
                'lastName': 'Entrenador',
                'specialization': 'Cardio',
            },
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data['trainer']['email'] == 'new-trainer@example.com'
        assert data['trainer']['invitePending'] is True
        assert data['trainer']['isActive'] is False

        session = SessionLocal()
        try:
            user = session.query(User).filter_by(email='new-trainer@example.com').first()
            assert user is not None
            assert user.role == RoleEnum.TRAINER
            assert user.is_active is False
        finally:
            session.close()

    def test_trainer_cannot_create_invitation(self, client, trainer_headers):
        response = client.post(
            '/api/admin/trainers',
            headers=trainer_headers,
            json={
                'email': 'blocked@example.com',
                'firstName': 'X',
                'lastName': 'Y',
            },
        )
        assert response.status_code == 403

    def test_accept_invite_and_login(self, client):
        _, raw_token = _create_invited_trainer('accept@example.com')

        validate = client.get(f'/api/auth/invite/{raw_token}')
        assert validate.status_code == 200
        assert validate.get_json()['email'] == 'accept@example.com'

        accept = client.post(
            '/api/auth/accept-invite',
            json={'token': raw_token, 'password': 'newpassword99'},
        )
        assert accept.status_code == 200

        login = login_user(client, email='accept@example.com', password='newpassword99')
        assert login.status_code == 200
        assert login.get_json()['user']['role'] == 'trainer'

    def test_accept_invite_invalid_token(self, client):
        response = client.post(
            '/api/auth/accept-invite',
            json={'token': 'invalid-token-value', 'password': 'newpassword99'},
        )
        assert response.status_code == 400
        assert 'inválido' in response.get_json()['error'].lower() or 'expirado' in response.get_json()['error'].lower()

    def test_accept_invite_expired_token(self, client):
        _, raw_token = _create_invited_trainer('expired@example.com')
        session = SessionLocal()
        try:
            token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
            record = session.query(InvitationToken).filter_by(token_hash=token_hash).first()
            record.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
            session.commit()
        finally:
            session.close()

        response = client.post(
            '/api/auth/accept-invite',
            json={'token': raw_token, 'password': 'newpassword99'},
        )
        assert response.status_code == 400

    def test_admin_resend_invite(self, client, admin_headers):
        trainer, first_token = _create_invited_trainer('resend@example.com')
        trainer_id = trainer['id']

        response = client.post(
            f'/api/admin/trainers/{trainer_id}/resend-invite',
            headers=admin_headers,
        )
        assert response.status_code == 200

        session = SessionLocal()
        try:
            tokens = (
                session.query(InvitationToken)
                .filter_by(user_id=int(trainer_id), purpose=TRAINER_INVITE_PURPOSE)
                .all()
            )
            assert len(tokens) >= 2
            used_count = sum(1 for t in tokens if t.used_at is not None)
            assert used_count >= 1
        finally:
            session.close()

        assert client.get(f'/api/auth/invite/{first_token}').status_code == 400

    def test_admin_deactivate_trainer_with_reassign(
        self, client, admin_headers, athlete_user, trainer_user
    ):
        other_trainer = create_user('other-active@example.com', role='trainer')
        response = client.delete(
            f'/api/admin/trainers/{trainer_user.id}',
            headers=admin_headers,
            json={
                'athleteActions': [
                    {
                        'athleteId': athlete_user.id,
                        'action': 'reassign',
                        'newTrainerId': other_trainer.id,
                    },
                ],
            },
        )
        assert response.status_code == 200

        session = SessionLocal()
        try:
            athlete = session.query(User).filter_by(id=athlete_user.id).first()
            old_trainer = session.query(User).filter_by(id=trainer_user.id).first()
            assert athlete.trainer_id == other_trainer.id
            assert old_trainer.is_active is False
        finally:
            session.close()

    def test_admin_deactivate_trainer_with_unassign(self, client, admin_headers, athlete_user, trainer_user):
        response = client.delete(
            f'/api/admin/trainers/{trainer_user.id}',
            headers=admin_headers,
            json={
                'athleteActions': [
                    {'athleteId': athlete_user.id, 'action': 'unassign'},
                ],
            },
        )
        assert response.status_code == 200

        session = SessionLocal()
        try:
            athlete = session.query(User).filter_by(id=athlete_user.id).first()
            assert athlete.trainer_id is None
        finally:
            session.close()

    def test_admin_deactivate_requires_actions_for_all_athletes(
        self, client, admin_headers, athlete_user, trainer_user
    ):
        response = client.delete(
            f'/api/admin/trainers/{trainer_user.id}',
            headers=admin_headers,
            json={'athleteActions': []},
        )
        assert response.status_code == 400

    def test_admin_unassign_trainer_from_athlete(self, client, admin_headers, athlete_user, trainer_user):
        response = client.put(
            f'/api/users/athletes/{athlete_user.id}/trainer',
            headers=admin_headers,
            json={'trainerId': None},
        )
        assert response.status_code == 200

        session = SessionLocal()
        try:
            athlete = session.query(User).filter_by(id=athlete_user.id).first()
            assert athlete.trainer_id is None
        finally:
            session.close()

    def test_list_trainers_includes_invite_pending(self, client, admin_headers):
        _create_invited_trainer('listed-pending@example.com')
        response = client.get('/api/admin/trainers?includeInactive=true', headers=admin_headers)
        assert response.status_code == 200
        trainers = response.get_json()['trainers']
        pending = next(t for t in trainers if t['email'] == 'listed-pending@example.com')
        assert pending['invitePending'] is True

    def test_athlete_denied_create_trainer(self, client, athlete_headers):
        response = client.post(
            '/api/admin/trainers',
            headers=athlete_headers,
            json={
                'email': 'denied@example.com',
                'firstName': 'A',
                'lastName': 'B',
            },
        )
        assert response.status_code == 403

    def test_admin_reactivate_trainer(self, client, admin_headers, athlete_user, trainer_user):
        client.delete(
            f'/api/admin/trainers/{trainer_user.id}',
            headers=admin_headers,
            json={
                'athleteActions': [
                    {'athleteId': athlete_user.id, 'action': 'unassign'},
                ],
            },
        )

        session = SessionLocal()
        try:
            trainer = session.query(User).filter_by(id=trainer_user.id).first()
            assert trainer.is_active is False
        finally:
            session.close()

        response = client.patch(
            f'/api/admin/trainers/{trainer_user.id}',
            headers=admin_headers,
            json={'isActive': True},
        )
        assert response.status_code == 200

        session = SessionLocal()
        try:
            trainer = session.query(User).filter_by(id=trainer_user.id).first()
            assert trainer.is_active is True
        finally:
            session.close()

    def test_trainer_cannot_reactivate(self, client, trainer_headers, trainer_user):
        response = client.patch(
            f'/api/admin/trainers/{trainer_user.id}',
            headers=trainer_headers,
            json={'isActive': True},
        )
        assert response.status_code == 403
