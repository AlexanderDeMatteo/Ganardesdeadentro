from app.database import SessionLocal
from app.models import User
from tests.conftest import auth_headers, create_user


def _create_trainer_routine(client, headers, name='Shared Routine'):
    response = client.post(
        '/api/routines/',
        headers=headers,
        json={'name': name, 'exercises': []},
    )
    assert response.status_code == 201
    return response.get_json()['routine']['id']


class TestRoutineAuthorization:
    def test_trainer_cannot_read_foreign_routine(self, client, trainer_user, trainer_headers):
        other_trainer = create_user('other-trainer@example.com', role='trainer')
        other_headers = auth_headers(other_trainer)
        routine_id = _create_trainer_routine(client, other_headers, name='Private Routine')

        response = client.get(f'/api/routines/{routine_id}', headers=trainer_headers)
        assert response.status_code == 403

    def test_trainer_cannot_update_foreign_routine(self, client, trainer_headers):
        other_trainer = create_user('other-trainer@example.com', role='trainer')
        other_headers = auth_headers(other_trainer)
        routine_id = _create_trainer_routine(client, other_headers)

        response = client.patch(
            f'/api/routines/{routine_id}',
            headers=trainer_headers,
            json={'name': 'Hacked'},
        )
        assert response.status_code == 403

    def test_trainer_cannot_delete_foreign_routine(self, client, trainer_headers):
        other_trainer = create_user('other-trainer@example.com', role='trainer')
        other_headers = auth_headers(other_trainer)
        routine_id = _create_trainer_routine(client, other_headers)

        response = client.delete(f'/api/routines/{routine_id}', headers=trainer_headers)
        assert response.status_code == 403

    def test_trainer_cannot_assign_foreign_routine(
        self, client, trainer_user, athlete_user, trainer_headers
    ):
        other_trainer = create_user('other-trainer@example.com', role='trainer')
        other_headers = auth_headers(other_trainer)
        routine_id = _create_trainer_routine(client, other_headers)

        response = client.post(
            '/api/routines/assignments',
            headers=trainer_headers,
            json={'athleteId': athlete_user.id, 'routineId': routine_id},
        )
        assert response.status_code == 403

    def test_trainer_cannot_unassign_foreign_assignment(
        self, client, trainer_user, trainer_headers
    ):
        other_trainer = create_user('other-trainer@example.com', role='trainer')
        other_athlete = create_user('other-athlete@example.com', role='user', trainer_id=other_trainer.id)
        other_headers = auth_headers(other_trainer)
        routine_id = _create_trainer_routine(client, other_headers)
        assign = client.post(
            '/api/routines/assignments',
            headers=other_headers,
            json={'athleteId': other_athlete.id, 'routineId': routine_id},
        )
        assert assign.status_code == 201
        assignment_id = assign.get_json()['assignment']['id']

        response = client.delete(
            f'/api/routines/assignments/{assignment_id}',
            headers=trainer_headers,
        )
        assert response.status_code == 403

    def test_athlete_cannot_read_unassigned_routine(self, client, trainer_headers, athlete_headers):
        routine_id = _create_trainer_routine(client, trainer_headers)
        response = client.get(f'/api/routines/{routine_id}', headers=athlete_headers)
        assert response.status_code == 403


class TestInactiveUserAccess:
    def test_inactive_user_rejected_on_protected_route(self, client, athlete_user, athlete_headers):
        session = SessionLocal()
        try:
            user = session.query(User).filter_by(id=athlete_user.id).first()
            user.is_active = False
            session.commit()
        finally:
            session.close()

        response = client.get(
            f'/api/metrics/?athleteId={athlete_user.id}',
            headers=athlete_headers,
        )
        assert response.status_code == 401


class TestNutritionAuthorization:
    def test_publish_plan_missing_athlete_returns_404(self, client, trainer_headers):
        response = client.put(
            '/api/nutrition/plan',
            headers=trainer_headers,
            json={
                'athleteId': 999999,
                'macroTargets': {'calories': 2000},
                'mealPlan': {},
                'slotTimes': {},
            },
        )
        assert response.status_code == 404

    def test_publish_plan_non_athlete_returns_400(self, client, trainer_user, admin_headers):
        response = client.put(
            '/api/nutrition/plan',
            headers=admin_headers,
            json={
                'athleteId': trainer_user.id,
                'macroTargets': {'calories': 2000},
                'mealPlan': {},
                'slotTimes': {},
            },
        )
        assert response.status_code == 400


class TestUserPatchValidation:
    def test_patch_athlete_invalid_email(self, client, athlete_user, admin_headers):
        response = client.patch(
            f'/api/users/athletes/{athlete_user.id}',
            headers=admin_headers,
            json={'email': 'invalid-email'},
        )
        assert response.status_code == 400

    def test_patch_athlete_duplicate_email(self, client, athlete_user, admin_headers):
        other = create_user('duplicate-target@example.com', role='user')
        response = client.patch(
            f'/api/users/athletes/{athlete_user.id}',
            headers=admin_headers,
            json={'email': other.email},
        )
        assert response.status_code == 400


class TestRateLimiting:
    def test_login_rate_limit(self):
        from app import create_app
        from app.config import TestingConfig
        from app.database import SessionLocal, drop_db, init_db

        class RateLimitConfig(TestingConfig):
            RATELIMIT_ENABLED = True
            AUTH_RATE_LIMIT = '2 per minute'

        app = create_app(RateLimitConfig)
        with app.app_context():
            drop_db()
            init_db()
        try:
            with app.test_client() as client:
                for _ in range(2):
                    response = client.post(
                        '/api/auth/login',
                        json={'email': 'missing@example.com', 'password': 'password123'},
                    )
                    assert response.status_code in (401, 400)

                response = client.post(
                    '/api/auth/login',
                    json={'email': 'missing@example.com', 'password': 'password123'},
                )
                assert response.status_code == 429
        finally:
            SessionLocal.remove()


class TestErrorSanitization:
    def test_exercise_service_does_not_leak_internal_errors(self):
        from app.services.exercise_api_service import ExerciseAPIService

        exercises, error = ExerciseAPIService.get_exercises_by_muscle('__invalid__muscle__')
        if error:
            assert 'Traceback' not in error
            assert 'Exception' not in error
