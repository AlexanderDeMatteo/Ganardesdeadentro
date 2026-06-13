from tests.conftest import login_user, register_user


class TestPatchMe:
    def test_patch_me_success(self, client):
        register_response = register_user(client, email='patchme@example.com')
        token = register_response.get_json()['access_token']
        response = client.patch(
            '/api/users/me',
            headers={'Authorization': f'Bearer {token}'},
            json={'first_name': 'Nuevo', 'last_name': 'Nombre'},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['user']['first_name'] == 'Nuevo'
        assert data['user']['last_name'] == 'Nombre'

    def test_patch_me_requires_auth(self, client):
        response = client.patch('/api/users/me', json={'first_name': 'X'})
        assert response.status_code == 401

    def test_patch_me_empty_payload(self, client):
        register_response = register_user(client, email='patchempty@example.com')
        token = register_response.get_json()['access_token']
        response = client.patch(
            '/api/users/me',
            headers={'Authorization': f'Bearer {token}'},
            json={},
        )
        assert response.status_code == 400
