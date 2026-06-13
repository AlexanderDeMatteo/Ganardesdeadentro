class TestBodyProfile:
    def test_athlete_gets_empty_body_profile(self, client, athlete_user, athlete_headers):
        response = client.get('/api/users/me/body-profile', headers=athlete_headers)
        assert response.status_code == 200
        assert response.get_json()['bodyProfile'] == {}

    def test_athlete_updates_body_profile(self, client, athlete_user, athlete_headers):
        patch = client.patch(
            '/api/users/me/body-profile',
            headers=athlete_headers,
            json={'heightCm': 175, 'age': 28, 'sex': 'male'},
        )
        assert patch.status_code == 200
        body = patch.get_json()['bodyProfile']
        assert body['heightCm'] == 175
        assert body['age'] == 28
        assert body['sex'] == 'male'

        get_resp = client.get('/api/users/me/body-profile', headers=athlete_headers)
        assert get_resp.status_code == 200
        assert get_resp.get_json()['bodyProfile'] == body

    def test_trainer_cannot_patch_body_profile(self, client, trainer_headers):
        response = client.patch(
            '/api/users/me/body-profile',
            headers=trainer_headers,
            json={'heightCm': 180},
        )
        assert response.status_code == 403

    def test_admin_cannot_patch_body_profile(self, client, admin_headers):
        response = client.patch(
            '/api/users/me/body-profile',
            headers=admin_headers,
            json={'heightCm': 180},
        )
        assert response.status_code == 403

    def test_invalid_body_profile_rejected(self, client, athlete_headers):
        response = client.patch(
            '/api/users/me/body-profile',
            headers=athlete_headers,
            json={'heightCm': 10, 'sex': 'other'},
        )
        assert response.status_code == 400
