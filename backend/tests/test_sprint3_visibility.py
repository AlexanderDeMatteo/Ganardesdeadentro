from tests.conftest import create_user


class TestAthleteLatestMetric:
    def test_admin_list_includes_latest_metric(self, client, admin_headers, athlete_user):
        add = client.post(
            '/api/metrics/',
            headers=admin_headers,
            json={
                'athleteId': athlete_user.id,
                'weight': 81.5,
                'bodyFat': 17.2,
                'muscleMass': 42.0,
                'date': '2026-06-01T10:00:00Z',
            },
        )
        assert add.status_code == 201

        response = client.get('/api/admin/athletes', headers=admin_headers)
        assert response.status_code == 200
        athletes = response.get_json()['athletes']
        target = next(a for a in athletes if a['id'] == str(athlete_user.id))
        assert target['latestMetric'] is not None
        assert target['latestMetric']['weight'] == 81.5
        assert target['latestMetric']['bodyFat'] == 17.2

    def test_trainer_list_includes_latest_metric(self, client, trainer_headers, athlete_user, trainer_user):
        client.post(
            '/api/metrics/',
            headers=trainer_headers,
            json={
                'athleteId': athlete_user.id,
                'weight': 70.0,
                'bodyFat': 20.0,
                'muscleMass': 30.0,
                'date': '2026-06-02T10:00:00Z',
            },
        )
        response = client.get(
            f'/api/users/trainer-athletes?trainerId={trainer_user.id}',
            headers=trainer_headers,
        )
        assert response.status_code == 200
        athletes = response.get_json()['athletes']
        target = next(a for a in athletes if a['id'] == str(athlete_user.id))
        assert target['latestMetric']['weight'] == 70.0


class TestAthleteBodyProfileAccess:
    def test_trainer_reads_assigned_athlete_body_profile(self, client, trainer_headers, athlete_user):
        response = client.get(
            f'/api/users/athletes/{athlete_user.id}/body-profile',
            headers=trainer_headers,
        )
        assert response.status_code == 200
        assert 'bodyProfile' in response.get_json()

    def test_trainer_denied_other_athlete_body_profile(self, client, trainer_headers):
        other = create_user('other-athlete@example.com', role='user')
        response = client.get(
            f'/api/users/athletes/{other.id}/body-profile',
            headers=trainer_headers,
        )
        assert response.status_code == 403

    def test_admin_reads_athlete_body_profile(self, client, admin_headers, athlete_user):
        response = client.get(
            f'/api/users/athletes/{athlete_user.id}/body-profile',
            headers=admin_headers,
        )
        assert response.status_code == 200


class TestTrainerCapacity:
    def test_admin_updates_trainer_max_athletes(self, client, admin_headers, trainer_user):
        response = client.patch(
            f'/api/admin/trainers/{trainer_user.id}',
            headers=admin_headers,
            json={'maxAthletes': 15},
        )
        assert response.status_code == 200

        list_response = client.get('/api/admin/trainers?includeInactive=true', headers=admin_headers)
        trainers = list_response.get_json()['trainers']
        target = next(t for t in trainers if t['id'] == str(trainer_user.id))
        assert target['maxAthletes'] == 15

    def test_trainer_cannot_update_capacity(self, client, trainer_headers, trainer_user):
        response = client.patch(
            f'/api/admin/trainers/{trainer_user.id}',
            headers=trainer_headers,
            json={'maxAthletes': 20},
        )
        assert response.status_code == 403
