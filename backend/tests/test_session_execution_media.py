import io

from tests.conftest import auth_headers, create_user, grant_active_membership


def test_upload_execution_media_success(client, athlete_membership, athlete_headers):
    data = {
        'file': (io.BytesIO(b'fake-mp4-content'), 'clip.mp4'),
        'athleteId': str(athlete_membership.id),
    }
    response = client.post(
        '/api/sessions/execution-media',
        data=data,
        headers={k: v for k, v in athlete_headers.items() if k != 'Content-Type'},
        content_type='multipart/form-data',
    )
    assert response.status_code == 201
    body = response.get_json()
    assert body['url'].startswith('/api/sessions/execution-media/exec-')
    assert body['url'].endswith('.mp4')

    filename = body['url'].rsplit('/', 1)[-1]
    get_response = client.get(
        f'/api/sessions/execution-media/{filename}',
        headers=athlete_headers,
    )
    assert get_response.status_code == 200


def test_upload_execution_media_rejects_invalid_type(client, athlete_membership, athlete_headers):
    data = {
        'file': (io.BytesIO(b'not-a-video'), 'notes.txt'),
        'athleteId': str(athlete_membership.id),
    }
    response = client.post(
        '/api/sessions/execution-media',
        data=data,
        headers={k: v for k, v in athlete_headers.items() if k != 'Content-Type'},
        content_type='multipart/form-data',
    )
    assert response.status_code == 400
    assert 'no permitido' in response.get_json()['error'].lower()


def test_upload_execution_media_requires_auth(client, athlete_membership):
    data = {
        'file': (io.BytesIO(b'fake-mp4-content'), 'clip.mp4'),
        'athleteId': str(athlete_membership.id),
    }
    response = client.post(
        '/api/sessions/execution-media',
        data=data,
        content_type='multipart/form-data',
    )
    assert response.status_code == 401


def test_get_execution_media_requires_auth(client, athlete_membership, athlete_headers):
    data = {
        'file': (io.BytesIO(b'fake-mp4-content'), 'clip.mp4'),
        'athleteId': str(athlete_membership.id),
    }
    upload = client.post(
        '/api/sessions/execution-media',
        data=data,
        headers={k: v for k, v in athlete_headers.items() if k != 'Content-Type'},
        content_type='multipart/form-data',
    )
    filename = upload.get_json()['url'].rsplit('/', 1)[-1]

    unauth = client.get(f'/api/sessions/execution-media/{filename}')
    assert unauth.status_code == 401

    authed = client.get(
        f'/api/sessions/execution-media/{filename}',
        headers=athlete_headers,
    )
    assert authed.status_code == 200


def test_trainer_can_get_execution_media(client, athlete_membership, athlete_headers, trainer_headers):
    data = {
        'file': (io.BytesIO(b'fake-mp4-content'), 'clip.mp4'),
        'athleteId': str(athlete_membership.id),
    }
    upload = client.post(
        '/api/sessions/execution-media',
        data=data,
        headers={k: v for k, v in athlete_headers.items() if k != 'Content-Type'},
        content_type='multipart/form-data',
    )
    filename = upload.get_json()['url'].rsplit('/', 1)[-1]

    response = client.get(
        f'/api/sessions/execution-media/{filename}',
        headers=trainer_headers,
    )
    assert response.status_code == 200


def test_athlete_cannot_get_foreign_execution_media(client, athlete_membership, athlete_headers):
    other_athlete = create_user('other-athlete-media@example.com', role='user')
    grant_active_membership(other_athlete.id)
    other_headers = auth_headers(other_athlete)

    data = {
        'file': (io.BytesIO(b'fake-mp4-content'), 'clip.mp4'),
        'athleteId': str(other_athlete.id),
    }
    upload = client.post(
        '/api/sessions/execution-media',
        data=data,
        headers={k: v for k, v in other_headers.items() if k != 'Content-Type'},
        content_type='multipart/form-data',
    )
    assert upload.status_code == 201
    filename = upload.get_json()['url'].rsplit('/', 1)[-1]

    denied = client.get(
        f'/api/sessions/execution-media/{filename}',
        headers=athlete_headers,
    )
    assert denied.status_code == 403
