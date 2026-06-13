from unittest.mock import MagicMock, patch

from tests.conftest import seed_cached_exercise


class TestExercisesRoutes:
    def test_get_muscles_returns_list(self, client):
        with patch('app.services.exercise_api_service.requests.get') as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = ['chest', 'legs']
            mock_get.return_value = mock_response

            response = client.get('/api/exercises/muscles')

        assert response.status_code == 200
        data = response.get_json()
        assert 'muscles' in data
        assert data['count'] == 2

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
