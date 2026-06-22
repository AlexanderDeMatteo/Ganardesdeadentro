from app.services.auth_service import AuthService
from app.services.notification_service import NotificationService
from app.services.support_service import SupportService
from tests.conftest import create_user


class TestNotificationService:
    def test_create_and_list_notifications(self, client):
        athlete = create_user('notify-athlete@example.com', role='user')
        created, error = NotificationService.create(
            athlete.id,
            'payment.approved',
            'Membresía activada',
            'Tu pago fue aprobado.',
            {'requestId': '1'},
        )
        assert not error
        assert created['type'] == 'payment.approved'
        assert created['title'] == 'Membresía activada'

        notifications, list_error = NotificationService.list_for_user(athlete.id)
        assert not list_error
        assert len(notifications) == 1
        assert notifications[0]['id'] == created['id']

        count, count_error = NotificationService.unread_count(athlete.id)
        assert not count_error
        assert count == 1

        marked, mark_error = NotificationService.mark_read(int(created['id']), athlete.id)
        assert not mark_error
        assert marked['readAt'] is not None

        count_after, _ = NotificationService.unread_count(athlete.id)
        assert count_after == 0


class TestSupportService:
    def test_athlete_thread_not_created_until_first_message(self, client):
        from app.database import SessionLocal
        from app.models import SupportThread

        athlete = create_user('empty-thread@example.com', role='user')
        thread, messages, error = SupportService.get_thread_for_athlete(athlete.id)
        assert not error
        assert thread is None
        assert messages == []

        session = SessionLocal()
        try:
            row = session.query(SupportThread).filter_by(athlete_id=athlete.id).first()
            assert row is None
        finally:
            session.close()

    def test_list_threads_excludes_empty_threads(self, client):
        from app.database import SessionLocal
        from app.models import SupportThread

        athlete = create_user('inbox-filter@example.com', role='user')
        session = SessionLocal()
        try:
            session.add(SupportThread(athlete_id=athlete.id))
            session.commit()
        finally:
            session.close()

        threads, error = SupportService.list_threads_for_admin()
        assert not error
        assert not any(item['athleteId'] == str(athlete.id) for item in threads)

        SupportService.send_message(athlete.id, athlete, 'Hola desde el atleta')
        threads, _ = SupportService.list_threads_for_admin()
        assert any(item['athleteId'] == str(athlete.id) for item in threads)

    def test_athlete_can_send_and_admin_can_reply(self, client, admin_user):
        athlete = create_user('support-athlete@example.com', role='user')

        message, error = SupportService.send_message(athlete.id, athlete, 'Hola, tengo un problema con mi pago')
        assert not error
        assert message['body'].startswith('Hola')

        thread, messages, thread_error = SupportService.get_thread_for_athlete(athlete.id)
        assert not thread_error
        assert thread is not None
        assert len(messages) == 1

        admin_reply, reply_error = SupportService.send_message(
            athlete.id,
            admin_user,
            'Hola, revisamos tu caso y te avisamos.',
        )
        assert not reply_error
        assert admin_reply['senderRole'] == 'admin'

        threads, inbox_error = SupportService.list_threads_for_admin()
        assert not inbox_error
        assert any(item['athleteId'] == str(athlete.id) for item in threads)

        marked, mark_error = SupportService.mark_thread_read(athlete.id, 'user')
        assert not mark_error
        assert marked['updated'] is True


class TestSupportApiPermissions:
    def test_athlete_cannot_access_other_thread(self, client, athlete_headers, admin_user):
        other = create_user('other-athlete@example.com', role='user')
        SupportService.send_message(other.id, other, 'Mensaje privado')

        response = client.get(
            f'/api/support/threads/{other.id}',
            headers=athlete_headers,
        )
        assert response.status_code == 403

    def test_admin_can_access_support_thread(self, client, admin_headers):
        athlete = create_user('support-api-athlete@example.com', role='user')
        SupportService.send_message(athlete.id, athlete, 'Necesito ayuda')

        response = client.get(
            f'/api/support/threads/{athlete.id}',
            headers=admin_headers,
        )
        assert response.status_code == 200
        payload = response.get_json()
        assert payload['thread']['athleteId'] == str(athlete.id)
        assert len(payload['messages']) == 1

    def test_admin_get_missing_thread_returns_404(self, client, admin_headers):
        athlete = create_user('no-thread@example.com', role='user')
        response = client.get(
            f'/api/support/threads/{athlete.id}',
            headers=admin_headers,
        )
        assert response.status_code == 404

    def test_athlete_get_thread_before_first_message(self, client, athlete_user, athlete_headers):
        response = client.get('/api/support/thread', headers=athlete_headers)
        assert response.status_code == 200
        payload = response.get_json()
        assert payload['thread'] is None
        assert payload['messages'] == []

    def test_athlete_can_get_own_thread(self, client, athlete_user, athlete_headers):
        SupportService.send_message(athlete_user.id, athlete_user, 'Consulta de prueba')

        response = client.get('/api/support/thread', headers=athlete_headers)
        assert response.status_code == 200
        payload = response.get_json()
        assert payload['thread']['athleteId'] == str(athlete_user.id)
        assert len(payload['messages']) == 1


class TestNotificationsApi:
    def test_list_and_mark_notifications(self, client, athlete_user, athlete_headers):
        NotificationService.create(
            athlete_user.id,
            'support.reply',
            'Respuesta de soporte',
            'Te respondimos en el chat.',
        )

        response = client.get('/api/notifications/unread-count', headers=athlete_headers)
        assert response.status_code == 200
        assert response.get_json()['count'] == 1

        list_response = client.get('/api/notifications/', headers=athlete_headers)
        assert list_response.status_code == 200
        notifications = list_response.get_json()['notifications']
        assert len(notifications) == 1

        mark_response = client.post(
            f"/api/notifications/{notifications[0]['id']}/read",
            headers=athlete_headers,
        )
        assert mark_response.status_code == 200

        unread_response = client.get('/api/notifications/unread-count', headers=athlete_headers)
        assert unread_response.get_json()['count'] == 0


class TestSupportSocketJoin:
    def test_admin_can_join_support_thread_without_jwt_context(self, client):
        from app.database import SessionLocal
        from app.realtime.events import _can_join_support_thread

        admin = create_user('socket-admin@example.com', role='admin')
        athlete = create_user('socket-athlete@example.com', role='user')
        session = SessionLocal()
        try:
            assert _can_join_support_thread(admin.id, 'admin', athlete.id, session)
        finally:
            session.close()

    def test_athlete_cannot_join_other_support_thread(self, client):
        from app.database import SessionLocal
        from app.realtime.events import _can_join_support_thread

        athlete = create_user('socket-athlete-a@example.com', role='user')
        other = create_user('socket-athlete-b@example.com', role='user')
        session = SessionLocal()
        try:
            assert _can_join_support_thread(athlete.id, 'user', athlete.id, session)
            assert not _can_join_support_thread(athlete.id, 'user', other.id, session)
        finally:
            session.close()
