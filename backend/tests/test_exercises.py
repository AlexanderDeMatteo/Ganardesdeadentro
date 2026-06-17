from io import BytesIO
from unittest.mock import MagicMock, patch

from tests.conftest import seed_cached_exercise


class TestExercisesRoutes:
    def test_get_muscles_returns_list(self, client):
        with patch('app.services.exercise_api_service.requests.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                'success': True,
                'data': [{'name': 'chest'}, {'name': 'legs'}],
            }
            mock_get.return_value = mock_response

            response = client.get('/api/exercises/muscles')

        assert response.status_code == 200
        data = response.get_json()
        assert 'muscles' in data
        assert data['count'] == 2
        assert data['source'] == 'api'

    def test_get_muscles_catalog_from_cache(self, client):
        seed_cached_exercise(exercise_db_id='pec-1', name='Bench Press', target_muscle='pectorals')
        seed_cached_exercise(exercise_db_id='pec-2', name='Fly', target_muscle='pectorals')
        seed_cached_exercise(exercise_db_id='lat-1', name='Pull Up', target_muscle='lats')

        response = client.get('/api/exercises/muscles?source=catalog')

        assert response.status_code == 200
        data = response.get_json()
        assert data['source'] == 'catalog'
        assert data['muscles'] == ['lats', 'pectorals']
        assert data['count'] == 2

    def test_get_muscles_rejects_invalid_source(self, client):
        response = client.get('/api/exercises/muscles?source=invalid')
        assert response.status_code == 400

    def test_get_exercises_by_muscle_from_cache(self, client):
        seed_cached_exercise(name='Incline Bench Press', target_muscle='chest')

        response = client.get('/api/exercises/by-muscle/chest')

        assert response.status_code == 200
        data = response.get_json()
        assert data['muscle'] == 'chest'
        assert data['count'] >= 1
        assert data['exercises'][0]['name'] == 'Incline Bench Press'

    def test_search_requires_jwt(self, client):
        response = client.get('/api/exercises/search?q=bench')
        assert response.status_code == 401

    def test_search_rejects_short_query(self, client, athlete_headers):
        response = client.get('/api/exercises/search?q=a', headers=athlete_headers)
        assert response.status_code == 400

    def test_search_finds_cached_exercise(self, client, athlete_headers):
        seed_cached_exercise(name='Barbell Bench Press', target_muscle='chest')

        response = client.get('/api/exercises/search?q=Barbell', headers=athlete_headers)

        assert response.status_code == 200
        data = response.get_json()
        assert data['count'] >= 1
        assert any('Barbell' in item['name'] for item in data['exercises'])

    def test_cached_exercises_requires_jwt(self, client):
        response = client.get('/api/exercises/cached')
        assert response.status_code == 401

    def test_cached_exercises_paginated(self, client, athlete_headers):
        seed_cached_exercise(exercise_db_id='cached-1', name='Cached Squat', target_muscle='legs')
        seed_cached_exercise(exercise_db_id='cached-2', name='Cached Lunge', target_muscle='legs')

        response = client.get('/api/exercises/cached?per_page=10', headers=athlete_headers)

        assert response.status_code == 200
        data = response.get_json()
        assert 'exercises' in data
        assert 'pagination' in data
        assert data['pagination']['total'] >= 2

    def test_clear_cache_admin_only(self, client, admin_headers, trainer_headers, athlete_headers):
        seed_cached_exercise(exercise_db_id='to-clear', name='Temp Row', target_muscle='back')

        assert client.post('/api/exercises/clear-cache', headers=admin_headers).status_code == 200
        assert client.post('/api/exercises/clear-cache', headers=trainer_headers).status_code == 403
        assert client.post('/api/exercises/clear-cache', headers=athlete_headers).status_code == 403

    def test_cached_exercises_source_catalog_excludes_custom(self, client, admin_headers, athlete_headers):
        seed_cached_exercise(exercise_db_id='catalog-only', name='Catalog Bench', target_muscle='chest')
        with patch('app.services.custom_exercise_service.ExerciseAPIService.search_exercises') as mock_search:
            mock_search.return_value = ([], '')
            client.post(
                '/api/exercises',
                headers=admin_headers,
                json={
                    'name': 'Custom only item',
                    'target_muscle': 'chest',
                    'equipment': 'barbell',
                    'difficulty': 'beginner',
                },
            )

        response = client.get('/api/exercises/cached?source=catalog', headers=athlete_headers)
        assert response.status_code == 200
        data = response.get_json()
        names = [item['name'] for item in data['exercises']]
        assert 'Catalog Bench' in names
        assert 'Custom only item' not in names

    def test_sync_catalog_admin_only(self, client, admin_headers, trainer_headers):
        with patch('app.services.exercise_api_service.ExerciseAPIService.get_all_muscles') as mock_muscles:
            mock_muscles.return_value = (['chest'], '')
            with patch(
                'app.services.exercise_api_service.ExerciseAPIService.get_exercises_by_muscle',
            ) as mock_by_muscle:
                mock_by_muscle.return_value = ([], '')
                assert client.post('/api/exercises/sync-catalog', headers=admin_headers).status_code == 200
                assert client.post('/api/exercises/sync-catalog', headers=trainer_headers).status_code == 403


class TestCustomExercises:
    def _create_payload(self, name='Sentadilla custom'):
        return {
            'name': name,
            'target_muscle': 'legs',
            'equipment': 'barbell',
            'difficulty': 'intermediate',
            'description': 'Variante personalizada',
        }

    def test_admin_creates_custom_exercise(self, client, admin_headers):
        with patch('app.services.custom_exercise_service.ExerciseAPIService.search_exercises') as mock_search:
            mock_search.return_value = ([], '')
            response = client.post(
                '/api/exercises',
                headers=admin_headers,
                json=self._create_payload(),
            )

        assert response.status_code == 201
        exercise = response.get_json()['exercise']
        assert exercise['is_custom'] is True
        assert exercise['exercise_db_id'].startswith('custom-')
        assert exercise['name'] == 'Sentadilla custom'

    def test_trainer_creates_custom_exercise(self, client, trainer_headers):
        with patch('app.services.custom_exercise_service.ExerciseAPIService.search_exercises') as mock_search:
            mock_search.return_value = ([], '')
            response = client.post(
                '/api/exercises',
                headers=trainer_headers,
                json=self._create_payload('Trainer custom squat'),
            )
        assert response.status_code == 201
        exercise = response.get_json()['exercise']
        assert exercise['is_custom'] is True

    def test_trainer_cannot_edit_foreign_custom_exercise(self, client, admin_headers, trainer_headers):
        with patch('app.services.custom_exercise_service.ExerciseAPIService.search_exercises') as mock_search:
            mock_search.return_value = ([], '')
            create = client.post(
                '/api/exercises',
                headers=admin_headers,
                json=self._create_payload('Admin only custom'),
            )
        assert create.status_code == 201
        exercise_id = create.get_json()['exercise']['exercise_db_id']

        response = client.patch(
            f'/api/exercises/{exercise_id}',
            headers=trainer_headers,
            json={'name': 'Trainer rename attempt'},
        )
        assert response.status_code == 403

    def test_match_animation_sets_gif_from_exercisedb(self, client, admin_headers):
        with patch('app.services.custom_exercise_service.ExerciseAPIService.search_exercises') as mock_search:
            mock_search.return_value = ([], '')
            create = client.post(
                '/api/exercises',
                headers=admin_headers,
                json=self._create_payload('Sentadilla'),
            )
        exercise_id = create.get_json()['exercise']['exercise_db_id']

        with patch('app.services.custom_exercise_service.ExerciseAPIService.search_exercises') as mock_search:
            mock_search.return_value = (
                [
                    {
                        'exerciseId': 'squat-001',
                        'exercise_db_id': 'squat-001',
                        'name': 'barbell squat',
                        'gifUrl': 'https://example.com/squat.gif',
                        'gif_url': 'https://example.com/squat.gif',
                    }
                ],
                '',
            )
            response = client.post(
                f'/api/exercises/{exercise_id}/match-animation',
                headers=admin_headers,
            )

        assert response.status_code == 200
        exercise = response.get_json()['exercise']
        assert exercise['animation_type'] == 'gif'
        assert exercise['animation_source'] == 'exercisedb'
        assert exercise['animation_url'] == 'https://example.com/squat.gif'

    def test_upload_rejects_invalid_mime(self, client, admin_headers):
        with patch('app.services.custom_exercise_service.ExerciseAPIService.search_exercises') as mock_search:
            mock_search.return_value = ([], '')
            create = client.post(
                '/api/exercises',
                headers=admin_headers,
                json=self._create_payload('Upload test'),
            )
        exercise_id = create.get_json()['exercise']['exercise_db_id']

        response = client.post(
            f'/api/exercises/{exercise_id}/media',
            headers={k: v for k, v in admin_headers.items() if k.lower() != 'content-type'},
            data={'file': (b'%PDF-1.4', 'bad.pdf')},
        )
        assert response.status_code == 400

    def test_upload_accepts_gif(self, client, admin_headers):
        with patch('app.services.custom_exercise_service.ExerciseAPIService.search_exercises') as mock_search:
            mock_search.return_value = ([], '')
            create = client.post(
                '/api/exercises',
                headers=admin_headers,
                json=self._create_payload('GIF upload'),
            )
        exercise_id = create.get_json()['exercise']['exercise_db_id']

        response = client.post(
            f'/api/exercises/{exercise_id}/media',
            headers={k: v for k, v in admin_headers.items() if k.lower() != 'content-type'},
            data={'file': (BytesIO(b'GIF89a'), 'move.gif')},
        )
        assert response.status_code == 200
        exercise = response.get_json()['exercise']
        assert exercise['animation_source'] == 'upload'
        assert exercise['animation_type'] == 'gif'
        assert exercise['animation_url'].startswith('/api/exercises/media/')

    def test_get_exercise_returns_animation_fields(self, client, admin_headers):
        with patch('app.services.custom_exercise_service.ExerciseAPIService.search_exercises') as mock_search:
            mock_search.return_value = ([], '')
            create = client.post(
                '/api/exercises',
                headers=admin_headers,
                json=self._create_payload('Lookup test'),
            )
        exercise_id = create.get_json()['exercise']['exercise_db_id']

        response = client.get(f'/api/exercises/{exercise_id}')
        assert response.status_code == 200
        exercise = response.get_json()['exercise']
        assert 'animation_type' in exercise
        assert exercise['is_custom'] is True

    def test_delete_soft_when_used_in_routine(self, client, admin_headers):
        with patch('app.services.custom_exercise_service.ExerciseAPIService.search_exercises') as mock_search:
            mock_search.return_value = ([], '')
            create = client.post(
                '/api/exercises',
                headers=admin_headers,
                json=self._create_payload('Used in routine'),
            )
        exercise = create.get_json()['exercise']

        routine = client.post(
            '/api/routines/',
            headers=admin_headers,
            json={
                'name': 'Routine with custom',
                'exercises': [
                    {
                        'exerciseId': exercise['exercise_db_id'],
                        'exerciseName': exercise['name'],
                        'sets': 3,
                        'reps': 10,
                        'rest': 60,
                    }
                ],
            },
        )
        assert routine.status_code == 201

        delete = client.delete(
            f"/api/exercises/{exercise['exercise_db_id']}",
            headers=admin_headers,
        )
        assert delete.status_code == 200
        assert 'desactivado' in delete.get_json()['message'].lower()

        get_after = client.get(f"/api/exercises/{exercise['exercise_db_id']}")
        assert get_after.status_code == 404
