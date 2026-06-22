import os

os.environ.setdefault('ENVIRONMENT', 'testing')

import pytest


class TestNutritionDiaryRoutes:
    @pytest.fixture(autouse=True)
    def _athlete_has_membership(self, athlete_membership):
        return athlete_membership

    def test_owner_add_and_get_diary(self, client, athlete_user, athlete_headers):
        response = client.post(
            '/api/nutrition/diary/entries',
            headers=athlete_headers,
            json={
                'athleteId': athlete_user.id,
                'date': '2026-06-06',
                'item': {'name': 'Avena', 'calories': 300},
            },
        )
        assert response.status_code == 200
        diary = response.get_json()['diary']
        assert len(diary['foodLog']) == 1
        entry_id = diary['foodLog'][0]['items'][0]['id']

        get_response = client.get(
            f'/api/nutrition/diary?athleteId={athlete_user.id}',
            headers=athlete_headers,
        )
        assert get_response.status_code == 200
        assert get_response.get_json()['diary']['foodLog'][0]['items'][0]['id'] == entry_id

    def test_trainer_can_read_diary(self, client, athlete_user, athlete_headers, trainer_headers):
        client.post(
            '/api/nutrition/diary/entries',
            headers=athlete_headers,
            json={
                'athleteId': athlete_user.id,
                'date': '2026-06-07',
                'item': {'name': 'Ensalada', 'calories': 180},
            },
        )
        response = client.get(
            f'/api/nutrition/diary?athleteId={athlete_user.id}',
            headers=trainer_headers,
        )
        assert response.status_code == 200
        assert len(response.get_json()['diary']['foodLog']) >= 1

    def test_trainer_cannot_write_diary(self, client, athlete_user, trainer_headers):
        response = client.post(
            '/api/nutrition/diary/entries',
            headers=trainer_headers,
            json={
                'athleteId': athlete_user.id,
                'date': '2026-06-06',
                'item': {'name': 'Hack', 'calories': 100},
            },
        )
        assert response.status_code == 403

    def test_other_athlete_denied(self, client, athlete_user, trainer_user):
        other = client.post(
            '/api/auth/register',
            json={
                'email': 'other@example.com',
                'password': 'password123',
                'first_name': 'Other',
                'last_name': 'Athlete',
            },
        ).get_json()
        other_headers = {
            'Authorization': f'Bearer {other["access_token"]}',
            'Content-Type': 'application/json',
        }
        response = client.get(
            f'/api/nutrition/diary?athleteId={athlete_user.id}',
            headers=other_headers,
        )
        assert response.status_code == 403

    def test_delete_entry(self, client, athlete_user, athlete_headers):
        create = client.post(
            '/api/nutrition/diary/entries',
            headers=athlete_headers,
            json={
                'athleteId': athlete_user.id,
                'date': '2026-06-06',
                'item': {'name': 'Yogur', 'calories': 120},
            },
        )
        entry_id = create.get_json()['diary']['foodLog'][0]['items'][0]['id']
        delete = client.delete(
            f'/api/nutrition/diary/entries/{entry_id}?athleteId={athlete_user.id}&date=2026-06-06',
            headers=athlete_headers,
        )
        assert delete.status_code == 200
        assert delete.get_json()['diary']['foodLog'] == []

    def test_patch_water(self, client, athlete_user, athlete_headers):
        response = client.patch(
            '/api/nutrition/diary/water',
            headers=athlete_headers,
            json={
                'athleteId': athlete_user.id,
                'date': '2026-06-06',
                'mlDelta': 500,
                'goalMl': 3000,
            },
        )
        assert response.status_code == 200
        diary = response.get_json()['diary']
        assert diary['waterByDate']['2026-06-06'] == 500
        assert diary['waterGoalMl'] == 3000

    def test_invalid_calories_rejected(self, client, athlete_user, athlete_headers):
        response = client.post(
            '/api/nutrition/diary/entries',
            headers=athlete_headers,
            json={
                'athleteId': athlete_user.id,
                'date': '2026-06-06',
                'item': {'name': 'Bad', 'calories': -5},
            },
        )
        assert response.status_code == 400
