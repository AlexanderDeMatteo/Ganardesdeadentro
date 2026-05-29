from tests.conftest import auth_headers, create_user


class TestUsersRoutes:
    def test_trainer_lists_own_athletes(self, client, trainer_user, athlete_user, trainer_headers):
        response = client.get('/api/users/trainer-athletes', headers=trainer_headers)
        assert response.status_code == 200
        athletes = response.get_json()['athletes']
        assert any(item['id'] == str(athlete_user.id) for item in athletes)

    def test_trainer_cannot_access_foreign_athlete(self, client, athlete_user, trainer_headers):
        other = create_user('other@example.com', role='user')
        response = client.get(f'/api/users/athletes/{other.id}', headers=trainer_headers)
        assert response.status_code == 403

    def test_admin_assigns_trainer(self, client, athlete_user, trainer_user, admin_headers):
        response = client.put(
            f'/api/users/athletes/{athlete_user.id}/trainer',
            headers=admin_headers,
            json={'trainerId': trainer_user.id},
        )
        assert response.status_code == 200


class TestRoutinesHierarchy:
    def test_trainer_assigns_routine_visible_to_athlete(self, client, trainer_user, athlete_user, trainer_headers, athlete_headers):
        create = client.post(
            '/api/routines/',
            headers=trainer_headers,
            json={
                'name': 'Push Day',
                'description': 'Chest focus',
                'difficulty': 'beginner',
                'duration': 45,
                'exercises': [
                    {
                        'exerciseId': 'bench-press',
                        'exerciseName': 'Bench Press',
                        'sets': 3,
                        'reps': 10,
                        'rest': 60,
                    }
                ],
            },
        )
        assert create.status_code == 201
        routine_id = create.get_json()['routine']['id']

        assign = client.post(
            '/api/routines/assignments',
            headers=trainer_headers,
            json={'athleteId': athlete_user.id, 'routineId': routine_id},
        )
        assert assign.status_code == 201

        my_routine = client.get(
            f'/api/routines/my?athleteId={athlete_user.id}',
            headers=athlete_headers,
        )
        assert my_routine.status_code == 200
        payload = my_routine.get_json()
        assert payload['routine']['name'] == 'Push Day'
        assert payload['assignment']['isActive'] is True


class TestMetricsRoutes:
    def test_athlete_creates_metric(self, client, athlete_user, athlete_headers):
        response = client.post(
            '/api/metrics/',
            headers=athlete_headers,
            json={'athleteId': athlete_user.id, 'weight': 80, 'bodyFat': 15},
        )
        assert response.status_code == 201
        assert response.get_json()['metric']['weight'] == 80

    def test_trainer_reads_athlete_metrics(self, client, athlete_user, trainer_headers, athlete_headers):
        client.post(
            '/api/metrics/',
            headers=athlete_headers,
            json={'athleteId': athlete_user.id, 'weight': 75},
        )
        response = client.get(f'/api/metrics/?athleteId={athlete_user.id}', headers=trainer_headers)
        assert response.status_code == 200
        assert len(response.get_json()['metrics']) >= 1


class TestMembershipsRoutes:
    def test_admin_creates_plan(self, client, admin_headers):
        response = client.post(
            '/api/memberships/plans',
            headers=admin_headers,
            json={
                'name': 'Premium',
                'price': 29.99,
                'description': 'Premium plan',
                'features': ['Metrics'],
                'durationDays': 30,
                'color': 'purple',
            },
        )
        assert response.status_code == 201

    def test_user_cannot_create_plan(self, client, athlete_headers):
        response = client.post(
            '/api/memberships/plans',
            headers=athlete_headers,
            json={'name': 'Hack', 'price': 1},
        )
        assert response.status_code == 403


class TestSessionsRoutes:
    def test_complete_session(self, client, trainer_user, athlete_user, trainer_headers, athlete_headers):
        routine = client.post(
            '/api/routines/',
            headers=trainer_headers,
            json={'name': 'Legs', 'exercises': []},
        ).get_json()['routine']
        client.post(
            '/api/routines/assignments',
            headers=trainer_headers,
            json={'athleteId': athlete_user.id, 'routineId': routine['id']},
        )
        response = client.post(
            '/api/sessions/complete',
            headers=athlete_headers,
            json={
                'athleteId': athlete_user.id,
                'routineId': routine['id'],
                'setLogs': [{'exerciseId': 'squat', 'setNumber': 1, 'weightKg': 100, 'result': 'completed'}],
                'completedSets': 1,
                'totalSets': 1,
            },
        )
        assert response.status_code == 201


class TestNutritionRoutes:
    def test_trainer_publishes_plan(self, client, athlete_user, trainer_headers, athlete_headers):
        response = client.put(
            '/api/nutrition/plan',
            headers=trainer_headers,
            json={
                'athleteId': athlete_user.id,
                'macroTargets': {'calories': 2200, 'proteinG': 160, 'carbsG': 220, 'fatG': 70, 'splitLabel': 'Balanced'},
                'mealPlan': {'id': '1', 'name': 'Plan A', 'days': [], 'createdAt': '2026-01-01'},
                'slotTimes': {'breakfast': '08:00', 'lunch': '13:00', 'dinner': '20:00', 'snack': '16:00'},
                'activityLevel': 'moderate',
                'goal': 'maintain',
                'calorieAdjustment': 0,
                'publishedBy': 'trainer-1',
            },
        )
        assert response.status_code == 200
        get_plan = client.get(f'/api/nutrition/plan?athleteId={athlete_user.id}', headers=athlete_headers)
        assert get_plan.status_code == 200
        assert get_plan.get_json()['plan'] is not None


class TestAdminRoutes:
    def test_admin_overview(self, client, admin_headers):
        response = client.get('/api/admin/overview', headers=admin_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'trainerCount' in data

    def test_trainer_denied_admin_overview(self, client, trainer_headers):
        response = client.get('/api/admin/overview', headers=trainer_headers)
        assert response.status_code == 403
