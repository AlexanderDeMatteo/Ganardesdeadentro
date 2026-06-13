import json
from datetime import datetime, timezone


def _dt_iso(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _json_loads(value, default=None):
    if not value:
        return default if default is not None else {}
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return default if default is not None else {}


def _membership_level_from_name(name: str | None) -> str:
    if not name:
        return 'basic'
    lowered = name.lower()
    if 'pro' in lowered:
        return 'pro'
    if 'premium' in lowered:
        return 'premium'
    return 'basic'


def serialize_athlete(user, profile=None, active_membership=None, latest_metric=None):
    profile = profile or user.profile
    level = 'basic'
    membership_id = None
    if active_membership and active_membership.membership:
        level = _membership_level_from_name(active_membership.membership.name)
        membership_id = str(active_membership.membership_id)

    payload = {
        'id': str(user.id),
        'userId': str(user.id),
        'name': f'{user.first_name} {user.last_name}'.strip(),
        'email': user.email,
        'age': profile.age if profile else 0,
        'gender': profile.gender if profile and profile.gender else 'unknown',
        'weight': profile.initial_weight if profile and profile.initial_weight else 0,
        'height': profile.initial_height if profile and profile.initial_height else 0,
        'joinDate': _dt_iso(user.created_at),
        'trainerId': str(user.trainer_id) if user.trainer_id else None,
        'membershipLevel': level,
        'membershipId': membership_id,
    }
    if latest_metric is not None:
        payload['latestMetric'] = serialize_latest_metric(latest_metric)
    return payload


def serialize_latest_metric(metric):
    if metric is None:
        return None
    return {
        'weight': metric.weight,
        'bodyFat': metric.body_fat_percentage,
        'muscleMass': metric.muscle_mass,
        'date': _dt_iso(metric.measurement_date),
    }


def serialize_trainer(user, profile=None, athlete_count=0, invite_pending: bool | None = None):
    profile = profile or user.profile
    is_active = bool(user.is_active)
    pending = invite_pending if invite_pending is not None else (not is_active)
    return {
        'id': str(user.id),
        'name': f'{user.first_name} {user.last_name}'.strip(),
        'email': user.email,
        'specialization': profile.specialization if profile and profile.specialization else 'General',
        'bio': profile.bio if profile else None,
        'athletes': athlete_count,
        'rating': profile.rating if profile and profile.rating is not None else 0,
        'joinDate': _dt_iso(user.created_at),
        'isActive': is_active,
        'invitePending': pending,
        'maxAthletes': profile.max_athletes if profile and profile.max_athletes is not None else 10,
    }


def serialize_routine_exercise(rex):
    exercise = rex.exercise
    suggested = _json_loads(rex.suggested_weights, default=[])
    return {
        'exerciseId': exercise.exercise_db_id if exercise else str(rex.exercise_id),
        'exerciseName': exercise.name if exercise else 'Exercise',
        'sets': rex.sets,
        'reps': rex.reps,
        'rest': rex.rest_seconds,
        'suggestedWeightsKg': suggested if isinstance(suggested, list) else [],
        'technique': rex.technique,
    }


def serialize_routine(routine):
    exercises = sorted(routine.exercises, key=lambda item: item.order)
    return {
        'id': str(routine.id),
        'name': routine.name,
        'description': routine.description or '',
        'difficulty': routine.difficulty.value if routine.difficulty else 'beginner',
        'duration': routine.duration_minutes or 0,
        'exercises': [serialize_routine_exercise(rex) for rex in exercises],
        'createdDate': _dt_iso(routine.created_at),
        'trainerId': str(routine.trainer_id) if routine.trainer_id else None,
    }


def serialize_assignment(assignment):
    return {
        'id': str(assignment.id),
        'athleteId': str(assignment.user_id),
        'routineId': str(assignment.routine_id),
        'trainerId': str(assignment.trainer_id) if assignment.trainer_id else '',
        'assignedDate': _dt_iso(assignment.assigned_date),
        'isActive': bool(assignment.is_active),
    }


def serialize_metric(metric):
    return {
        'id': str(metric.id),
        'athleteId': str(metric.user_id),
        'date': _dt_iso(metric.measurement_date),
        'weight': metric.weight,
        'bodyFat': metric.body_fat_percentage,
        'bodyFatSource': metric.body_fat_source,
        'muscleMass': metric.muscle_mass,
        'muscleMassSource': metric.muscle_mass_source,
        'bicepsLeft': metric.biceps_left,
        'bicepsRight': metric.biceps_right,
        'chest': metric.chest,
        'waist': metric.waist,
        'hips': metric.hips,
        'thighLeft': metric.thigh_left,
        'thighRight': metric.thigh_right,
        'calfLeft': metric.calf_left,
        'calfRight': metric.calf_right,
        'notes': metric.notes,
    }


def serialize_membership_plan(membership):
    features = _json_loads(membership.features, default=[])
    return {
        'id': str(membership.id),
        'name': membership.name,
        'price': membership.price or 0,
        'description': membership.description or '',
        'features': features if isinstance(features, list) else [],
        'durationDays': membership.duration_days or 30,
        'color': membership.color or 'blue',
        'createdAt': _dt_iso(membership.created_at),
    }


def serialize_active_membership(user_membership):
    if not user_membership or not user_membership.membership:
        return None
    membership = user_membership.membership
    end_date = user_membership.end_date
    days_remaining = 0
    if end_date:
        days_remaining = max(0, (end_date.date() - datetime.now(timezone.utc).date()).days)
    return {
        'level': _membership_level_from_name(membership.name),
        'planId': str(membership.id),
        'daysRemaining': days_remaining,
    }


def serialize_me_membership(user_membership):
    """Membresía activa para GET /api/auth/me (incluye nombre del plan)."""
    if not user_membership or not user_membership.membership:
        return None
    membership = user_membership.membership
    end_date = user_membership.end_date
    start_date = user_membership.start_date
    days_remaining = 0
    if end_date:
        days_remaining = max(0, (end_date.date() - datetime.now(timezone.utc).date()).days)
    features = _json_loads(membership.features, default=[])
    return {
        'planId': str(membership.id),
        'name': membership.name,
        'daysRemaining': days_remaining,
        'features': features if isinstance(features, list) else [],
        'startDate': _dt_iso(start_date) or '',
        'endDate': _dt_iso(end_date) or '',
        'price': membership.price or 0,
        'durationDays': membership.duration_days or 30,
    }


def serialize_session(session):
    return {
        'id': str(session.id),
        'athleteId': str(session.user_id),
        'routineId': str(session.routine_id),
        'assignmentId': str(session.assignment_id) if session.assignment_id else None,
        'weekPlanId': str(session.week_plan_id) if session.week_plan_id else None,
        'scheduledDate': session.scheduled_date,
        'date': _dt_iso(session.date),
        'setLogs': _json_loads(session.set_logs, default=[]),
        'completed': bool(session.completed),
        'completedSets': session.completed_sets or 0,
        'failedSets': session.failed_sets or 0,
        'totalSets': session.total_sets or 0,
        'sessionOutcome': session.session_outcome or 'completed',
    }


def serialize_weekly_plan(plan):
    return {
        'id': str(plan.id),
        'athleteId': str(plan.user_id),
        'trainerId': str(plan.trainer_id),
        'weekStartDate': plan.week_start_date,
        'days': _json_loads(plan.days, default=[]),
        'createdAt': _dt_iso(plan.created_at),
        'isActive': bool(plan.is_active),
    }


def serialize_nutrition_plan(plan):
    return {
        'athleteId': str(plan.user_id),
        'macroTargets': _json_loads(plan.macro_targets, default={}),
        'mealPlan': _json_loads(plan.meal_plan, default={}),
        'slotTimes': _json_loads(plan.slot_times, default={}),
        'activityLevel': plan.activity_level,
        'goal': plan.goal,
        'calorieAdjustment': plan.calorie_adjustment or 0,
        'publishedAt': _dt_iso(plan.published_at),
        'publishedBy': plan.published_by,
    }


def default_coach_draft():
    now = datetime.now(timezone.utc).isoformat()
    return {
        'activityLevel': 'moderate',
        'goal': 'maintain',
        'calorieAdjustment': 0,
        'macroTargets': None,
        'mealPlans': [],
        'activeMealPlanId': None,
        'slotTimes': {
            'breakfast': '08:00',
            'lunch': '13:00',
            'dinner': '20:00',
            'snack': '16:00',
        },
        'updatedAt': now,
    }


def serialize_coach_draft(draft_row):
    if not draft_row:
        return default_coach_draft()
    data = _json_loads(draft_row.draft, default=default_coach_draft())
    if 'updatedAt' not in data:
        data['updatedAt'] = _dt_iso(draft_row.updated_at)
    return data


def default_nutrition_diary():
    return {
        'foodLog': [],
        'waterByDate': {},
        'waterGoalMl': 2500,
        'updatedAt': datetime.now(timezone.utc).isoformat(),
    }


def serialize_nutrition_diary(diary_row, date: str | None = None):
    if not diary_row:
        return default_nutrition_diary()
    food_log = _json_loads(diary_row.food_log, default=[])
    water_by_date = _json_loads(diary_row.water_by_date, default={})
    if not isinstance(food_log, list):
        food_log = []
    if not isinstance(water_by_date, dict):
        water_by_date = {}
    if date:
        food_log = [entry for entry in food_log if isinstance(entry, dict) and entry.get('date') == date]
    return {
        'foodLog': food_log,
        'waterByDate': water_by_date,
        'waterGoalMl': diary_row.water_goal_ml or 2500,
        'updatedAt': _dt_iso(diary_row.updated_at),
    }
