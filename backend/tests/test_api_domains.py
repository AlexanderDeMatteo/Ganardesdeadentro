from datetime import date

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

    def test_trainer_updates_own_profile(self, client, trainer_user, trainer_headers):
        patch = client.patch(
            f'/api/users/trainers/{trainer_user.id}',
            headers=trainer_headers,
            json={'specialization': 'Fuerza', 'bio': 'Entrenador de prueba'},
        )
        assert patch.status_code == 200

        get_trainer = client.get(
            f'/api/users/trainers/{trainer_user.id}',
            headers=trainer_headers,
        )
        assert get_trainer.status_code == 200
        trainer = get_trainer.get_json()['trainer']
        assert trainer['specialization'] == 'Fuerza'
        assert trainer['bio'] == 'Entrenador de prueba'

    def test_athlete_cannot_patch_trainer_profile(
        self, client, trainer_user, athlete_headers
    ):
        response = client.patch(
            f'/api/users/trainers/{trainer_user.id}',
            headers=athlete_headers,
            json={'bio': 'hack'},
        )
        assert response.status_code == 403


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

    def test_trainer_lists_own_routines(self, client, trainer_user, trainer_headers):
        client.post(
            '/api/routines/',
            headers=trainer_headers,
            json={'name': 'Leg Day', 'exercises': []},
        )
        response = client.get('/api/routines/', headers=trainer_headers)
        assert response.status_code == 200
        routines = response.get_json()['routines']
        assert any(item['name'] == 'Leg Day' for item in routines)

    def test_trainer_lists_assignments_after_assign(
        self, client, trainer_user, athlete_user, trainer_headers, athlete_headers
    ):
        create = client.post(
            '/api/routines/',
            headers=trainer_headers,
            json={'name': 'Pull Day', 'exercises': []},
        )
        routine_id = create.get_json()['routine']['id']
        client.post(
            '/api/routines/assignments',
            headers=trainer_headers,
            json={'athleteId': athlete_user.id, 'routineId': routine_id},
        )
        response = client.get('/api/routines/assignments', headers=trainer_headers)
        assert response.status_code == 200
        assignments = response.get_json()['assignments']
        assert any(
            item['athleteId'] == str(athlete_user.id) and item['routineId'] == routine_id
            for item in assignments
        )

    def test_athlete_cannot_list_routines(self, client, athlete_user, athlete_headers):
        response = client.get('/api/routines/', headers=athlete_headers)
        assert response.status_code == 403

    def test_trainer_creates_routine_with_numeric_exercise_ids(self, client, trainer_headers):
        response = client.post(
            '/api/routines/',
            headers=trainer_headers,
            json={
                'name': 'Leg Day API',
                'description': 'From builder shape',
                'difficulty': 'intermediate',
                'duration': 60,
                'exercises': [
                    {
                        'exerciseId': '1',
                        'exerciseName': 'Sentadilla',
                        'sets': 3,
                        'reps': 10,
                        'rest': 60,
                        'suggestedWeightsKg': [20, 22.5, 25],
                    }
                ],
            },
        )
        assert response.status_code == 201
        body = response.get_json()
        assert body['routine']['name'] == 'Leg Day API'
        assert len(body['routine']['exercises']) == 1
        assert body['routine']['exercises'][0]['exerciseId'] == '1'

    def test_trainer_updates_own_routine(self, client, trainer_headers):
        create = client.post(
            '/api/routines/',
            headers=trainer_headers,
            json={'name': 'Original', 'exercises': []},
        )
        assert create.status_code == 201
        routine_id = create.get_json()['routine']['id']

        update = client.patch(
            f'/api/routines/{routine_id}',
            headers=trainer_headers,
            json={'name': 'Updated Name'},
        )
        assert update.status_code == 200
        assert update.get_json()['routine']['name'] == 'Updated Name'

    def test_trainer_deletes_routine(self, client, trainer_headers):
        create = client.post(
            '/api/routines/',
            headers=trainer_headers,
            json={'name': 'To Delete', 'exercises': []},
        )
        routine_id = create.get_json()['routine']['id']

        delete = client.delete(f'/api/routines/{routine_id}', headers=trainer_headers)
        assert delete.status_code == 200

        get_routine = client.get(f'/api/routines/{routine_id}', headers=trainer_headers)
        assert get_routine.status_code == 404

    def test_trainer_assigns_and_reads_weekly_plan(
        self, client, trainer_user, athlete_user, trainer_headers, athlete_headers
    ):
        create = client.post(
            '/api/routines/',
            headers=trainer_headers,
            json={'name': 'Week Plan Routine', 'exercises': []},
        )
        routine_id = create.get_json()['routine']['id']
        days = [
            {'dayIndex': 0, 'label': 'Lunes', 'routineId': routine_id, 'focus': 'Upper'},
            {'dayIndex': 1, 'label': 'Martes', 'routineId': None, 'focus': 'Rest'},
        ]

        assign = client.put(
            '/api/routines/weekly-plan',
            headers=trainer_headers,
            json={
                'athleteId': athlete_user.id,
                'weekStartDate': '2026-06-02',
                'days': days,
            },
        )
        assert assign.status_code == 200
        weekly = assign.get_json()['weeklyPlan']
        assert weekly['athleteId'] == str(athlete_user.id)
        assert len(weekly['days']) == 2

        get_plan = client.get(
            f'/api/routines/weekly-plan?athleteId={athlete_user.id}',
            headers=athlete_headers,
        )
        assert get_plan.status_code == 200
        assert get_plan.get_json()['weeklyPlan']['days'][0]['routineId'] == routine_id

    def test_athlete_reads_routine_from_weekly_plan(
        self, client, trainer_user, athlete_user, trainer_headers, athlete_headers
    ):
        create = client.post(
            '/api/routines/',
            headers=trainer_headers,
            json={'name': 'Athlete Visible Routine', 'exercises': []},
        )
        routine_id = create.get_json()['routine']['id']
        client.put(
            '/api/routines/weekly-plan',
            headers=trainer_headers,
            json={
                'athleteId': athlete_user.id,
                'weekStartDate': '2026-06-02',
                'days': [
                    {'dayIndex': 0, 'label': 'Lun', 'routineId': routine_id, 'focus': 'Push'},
                ],
            },
        )
        get_routine = client.get(f'/api/routines/{routine_id}', headers=athlete_headers)
        assert get_routine.status_code == 200
        assert get_routine.get_json()['routine']['name'] == 'Athlete Visible Routine'


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

    def test_athlete_lists_own_metrics(self, client, athlete_user, athlete_headers):
        client.post(
            '/api/metrics/',
            headers=athlete_headers,
            json={'athleteId': athlete_user.id, 'weight': 82},
        )
        response = client.get(f'/api/metrics/?athleteId={athlete_user.id}', headers=athlete_headers)
        assert response.status_code == 200
        assert len(response.get_json()['metrics']) >= 1

    def test_athlete_cannot_read_foreign_metrics(self, client, athlete_user, athlete_headers):
        other = create_user('other@example.com', role='user')
        client.post(
            '/api/metrics/',
            headers=auth_headers(other),
            json={'athleteId': other.id, 'weight': 70},
        )
        response = client.get(f'/api/metrics/?athleteId={other.id}', headers=athlete_headers)
        assert response.status_code == 403

    def test_athlete_updates_own_metric(self, client, athlete_user, athlete_headers):
        create = client.post(
            '/api/metrics/',
            headers=athlete_headers,
            json={'athleteId': athlete_user.id, 'weight': 80},
        )
        metric_id = create.get_json()['metric']['id']
        response = client.patch(
            f'/api/metrics/{metric_id}',
            headers=athlete_headers,
            json={'weight': 78},
        )
        assert response.status_code == 200
        assert response.get_json()['metric']['weight'] == 78

    def test_athlete_deletes_own_metric(self, client, athlete_user, athlete_headers):
        create = client.post(
            '/api/metrics/',
            headers=athlete_headers,
            json={'athleteId': athlete_user.id, 'weight': 80},
        )
        metric_id = create.get_json()['metric']['id']
        response = client.delete(f'/api/metrics/{metric_id}', headers=athlete_headers)
        assert response.status_code == 200
        listed = client.get(f'/api/metrics/?athleteId={athlete_user.id}', headers=athlete_headers)
        assert all(m['id'] != metric_id for m in listed.get_json()['metrics'])

    def test_invalid_date_returns_400(self, client, athlete_user, athlete_headers):
        response = client.post(
            '/api/metrics/',
            headers=athlete_headers,
            json={'athleteId': athlete_user.id, 'weight': 80, 'date': 'not-a-date'},
        )
        assert response.status_code == 400
        assert response.get_json()['error'] == 'Fecha inválida'

    def test_invalid_weight_returns_400(self, client, athlete_user, athlete_headers):
        response = client.post(
            '/api/metrics/',
            headers=athlete_headers,
            json={'athleteId': athlete_user.id, 'weight': -5},
        )
        assert response.status_code == 400
        assert 'Peso' in response.get_json()['error']

    def test_invalid_body_fat_returns_400(self, client, athlete_user, athlete_headers):
        response = client.post(
            '/api/metrics/',
            headers=athlete_headers,
            json={'athleteId': athlete_user.id, 'bodyFat': 150},
        )
        assert response.status_code == 400
        assert 'Grasa corporal' in response.get_json()['error']


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

    def test_user_can_list_plans(self, client, admin_headers, athlete_headers):
        client.post(
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
        response = client.get('/api/memberships/plans', headers=athlete_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'plans' in data
        assert len(data['plans']) >= 1

    def test_user_cannot_create_plan(self, client, athlete_headers):
        response = client.post(
            '/api/memberships/plans',
            headers=athlete_headers,
            json={'name': 'Hack', 'price': 1},
        )
        assert response.status_code == 403

    def test_user_cannot_update_plan(self, client, admin_headers, athlete_headers):
        create_response = client.post(
            '/api/memberships/plans',
            headers=admin_headers,
            json={
                'name': 'Basic',
                'price': 9.99,
                'description': 'Basic plan',
                'features': ['Routines'],
                'durationDays': 30,
                'color': 'blue',
            },
        )
        plan_id = create_response.get_json()['plan']['id']
        response = client.patch(
            f'/api/memberships/plans/{plan_id}',
            headers=athlete_headers,
            json={'price': 0.01},
        )
        assert response.status_code == 403

    def test_user_cannot_delete_plan(self, client, admin_headers, athlete_headers):
        create_response = client.post(
            '/api/memberships/plans',
            headers=admin_headers,
            json={
                'name': 'Pro',
                'price': 59.99,
                'description': 'Pro plan',
                'features': ['All'],
                'durationDays': 30,
                'color': 'amber',
            },
        )
        plan_id = create_response.get_json()['plan']['id']
        response = client.delete(
            f'/api/memberships/plans/{plan_id}',
            headers=athlete_headers,
        )
        assert response.status_code == 403

    def test_athlete_subscribe_plan(self, client, admin_headers, athlete_headers):
        create_response = client.post(
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
        plan_id = create_response.get_json()['plan']['id']
        response = client.post(
            '/api/memberships/subscribe',
            headers=athlete_headers,
            json={'planId': plan_id},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['membership']['planId'] == plan_id
        assert data['membership']['level'] == 'premium'

    def test_trainer_cannot_subscribe(self, client, admin_headers, trainer_headers):
        create_response = client.post(
            '/api/memberships/plans',
            headers=admin_headers,
            json={
                'name': 'Basic',
                'price': 9.99,
                'description': 'Basic plan',
                'features': ['Routines'],
                'durationDays': 30,
                'color': 'blue',
            },
        )
        plan_id = create_response.get_json()['plan']['id']
        response = client.post(
            '/api/memberships/subscribe',
            headers=trainer_headers,
            json={'planId': plan_id},
        )
        assert response.status_code == 403

    def test_subscribe_invalid_plan(self, client, athlete_headers):
        response = client.post(
            '/api/memberships/subscribe',
            headers=athlete_headers,
            json={'planId': 99999},
        )
        assert response.status_code == 404


class TestSessionsRoutes:
    def _complete_session_fixture(self, client, trainer_user, athlete_user, trainer_headers, athlete_headers):
        scheduled = date.today().isoformat()
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
                'scheduledDate': scheduled,
                'setLogs': [
                    {
                        'exerciseId': 'squat',
                        'exerciseName': 'Squat',
                        'setNumber': 1,
                        'weightKg': 100,
                        'repsLogged': '5',
                        'result': 'completed',
                    }
                ],
                'completedSets': 1,
                'totalSets': 1,
                'completed': True,
                'sessionOutcome': 'completed',
            },
        )
        assert response.status_code == 201
        return athlete_user, scheduled, response.get_json()['session']

    def test_complete_session(self, client, trainer_user, athlete_user, trainer_headers, athlete_headers):
        self._complete_session_fixture(
            client, trainer_user, athlete_user, trainer_headers, athlete_headers
        )

    def test_list_sessions_after_complete(
        self, client, trainer_user, athlete_user, trainer_headers, athlete_headers
    ):
        athlete_user, _, session = self._complete_session_fixture(
            client, trainer_user, athlete_user, trainer_headers, athlete_headers
        )
        response = client.get(
            f'/api/sessions/?athleteId={athlete_user.id}',
            headers=athlete_headers,
        )
        assert response.status_code == 200
        sessions = response.get_json()['sessions']
        assert any(item['id'] == session['id'] for item in sessions)

    def test_week_sessions_after_complete(
        self, client, trainer_user, athlete_user, trainer_headers, athlete_headers
    ):
        athlete_user, scheduled, _ = self._complete_session_fixture(
            client, trainer_user, athlete_user, trainer_headers, athlete_headers
        )
        response = client.get(
            f'/api/sessions/week?athleteId={athlete_user.id}&weekStart={scheduled}',
            headers=athlete_headers,
        )
        assert response.status_code == 200
        assert len(response.get_json()['sessions']) >= 1

    def test_exercise_progress_after_complete(
        self, client, trainer_user, athlete_user, trainer_headers, athlete_headers
    ):
        athlete_user, _, _ = self._complete_session_fixture(
            client, trainer_user, athlete_user, trainer_headers, athlete_headers
        )
        response = client.get(
            f'/api/sessions/progress?athleteId={athlete_user.id}&exerciseId=squat',
            headers=athlete_headers,
        )
        assert response.status_code == 200
        progress = response.get_json()['progress']
        assert len(progress) >= 1
        assert progress[0]['maxWeightKg'] == 100

    def test_athlete_cannot_list_foreign_sessions(self, client, athlete_user, athlete_headers):
        other = create_user('other-athlete-sessions@example.com', role='user')
        response = client.get(
            f'/api/sessions/?athleteId={other.id}',
            headers=athlete_headers,
        )
        assert response.status_code == 403


class TestNutritionRoutes:
    def _nutrition_plan_payload(self, athlete_id, published_by='trainer-1'):
        return {
            'athleteId': athlete_id,
            'macroTargets': {
                'calories': 2200,
                'proteinG': 160,
                'carbsG': 220,
                'fatG': 70,
                'splitLabel': 'Balanced',
            },
            'mealPlan': {'id': '1', 'name': 'Plan A', 'days': [], 'createdAt': '2026-01-01'},
            'slotTimes': {
                'breakfast': '08:00',
                'lunch': '13:00',
                'dinner': '20:00',
                'snack': '16:00',
            },
            'activityLevel': 'moderate',
            'goal': 'maintain',
            'calorieAdjustment': 0,
            'publishedBy': published_by,
        }

    def test_trainer_publishes_plan(self, client, athlete_user, trainer_headers, athlete_headers):
        response = client.put(
            '/api/nutrition/plan',
            headers=trainer_headers,
            json=self._nutrition_plan_payload(athlete_user.id),
        )
        assert response.status_code == 200
        get_plan = client.get(f'/api/nutrition/plan?athleteId={athlete_user.id}', headers=athlete_headers)
        assert get_plan.status_code == 200
        assert get_plan.get_json()['plan'] is not None

    def test_coach_draft_round_trip(self, client, athlete_user, trainer_headers):
        draft = {
            'activityLevel': 'active',
            'goal': 'lose',
            'calorieAdjustment': -200,
            'macroTargets': None,
            'mealPlans': [],
            'activeMealPlanId': None,
            'slotTimes': {
                'breakfast': '07:30',
                'lunch': '12:30',
                'dinner': '19:30',
                'snack': '16:00',
            },
            'updatedAt': '2026-06-01T12:00:00Z',
        }
        save = client.put(
            '/api/nutrition/coach-draft',
            headers=trainer_headers,
            json={'athleteId': athlete_user.id, 'draft': draft},
        )
        assert save.status_code == 200

        get_draft = client.get(
            f'/api/nutrition/coach-draft?athleteId={athlete_user.id}',
            headers=trainer_headers,
        )
        assert get_draft.status_code == 200
        loaded = get_draft.get_json()['draft']
        assert loaded['activityLevel'] == 'active'
        assert loaded['goal'] == 'lose'
        assert loaded['calorieAdjustment'] == -200

    def test_publish_plan_visible_to_athlete(self, client, athlete_user, trainer_headers, athlete_headers):
        client.put(
            '/api/nutrition/plan',
            headers=trainer_headers,
            json=self._nutrition_plan_payload(athlete_user.id, published_by='coach-test'),
        )
        get_plan = client.get(f'/api/nutrition/plan?athleteId={athlete_user.id}', headers=athlete_headers)
        assert get_plan.status_code == 200
        plan = get_plan.get_json()['plan']
        assert plan is not None
        assert plan['publishedBy'] == 'coach-test'
        assert plan['macroTargets']['calories'] == 2200


class TestAdminRoutes:
    def test_admin_overview(self, client, admin_headers):
        response = client.get('/api/admin/overview', headers=admin_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'trainerCount' in data

    def test_trainer_denied_admin_overview(self, client, trainer_headers):
        response = client.get('/api/admin/overview', headers=trainer_headers)
        assert response.status_code == 403

    def test_admin_list_athletes(self, client, admin_headers, athlete_user):
        response = client.get('/api/admin/athletes', headers=admin_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'athletes' in data
        assert any(a['email'] == athlete_user.email for a in data['athletes'])

    def test_admin_list_trainers(self, client, admin_headers, trainer_user):
        response = client.get('/api/admin/trainers', headers=admin_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'trainers' in data
        assert any(t['email'] == trainer_user.email for t in data['trainers'])

    def test_trainer_denied_admin_athletes(self, client, trainer_headers):
        response = client.get('/api/admin/athletes', headers=trainer_headers)
        assert response.status_code == 403

    def test_athlete_denied_admin_trainers(self, client, athlete_headers):
        response = client.get('/api/admin/trainers', headers=athlete_headers)
        assert response.status_code == 403

    def test_admin_lists_require_auth(self, client):
        assert client.get('/api/admin/athletes').status_code == 401
        assert client.get('/api/admin/trainers').status_code == 401


class TestInfrastructure:
    def test_health_ok(self, client):
        response = client.get('/api/health')
        assert response.status_code == 200
        assert response.get_json()['status'] == 'ok'

    def test_logout_requires_token(self, client):
        response = client.post('/api/auth/logout')
        assert response.status_code == 401

    def test_logout_with_valid_token(self, client, athlete_headers):
        response = client.post('/api/auth/logout', headers=athlete_headers)
        assert response.status_code == 200
        assert 'message' in response.get_json()
