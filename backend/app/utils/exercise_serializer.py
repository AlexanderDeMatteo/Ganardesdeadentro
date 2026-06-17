from app.models import Exercise


def _difficulty_value(difficulty) -> str:
    if difficulty is None:
        return 'beginner'
    return difficulty.value if hasattr(difficulty, 'value') else str(difficulty)


def resolve_animation_fields(exercise: Exercise) -> tuple[str, str, str | None]:
    animation_type = exercise.animation_type or 'none'
    animation_source = exercise.animation_source or 'none'
    animation_url = exercise.animation_url

    if not animation_url and exercise.gif_url:
        animation_url = exercise.gif_url
        if animation_type == 'none':
            animation_type = 'gif'
        if animation_source == 'none':
            animation_source = 'exercisedb'

    return animation_type, animation_source, animation_url


def serialize_exercise(exercise: Exercise) -> dict:
    animation_type, animation_source, animation_url = resolve_animation_fields(exercise)
    return {
        'id': exercise.id,
        'exercise_db_id': exercise.exercise_db_id,
        'name': exercise.name,
        'target_muscle': exercise.target_muscle,
        'equipment': exercise.equipment,
        'gif_url': exercise.gif_url,
        'description': exercise.description,
        'difficulty': _difficulty_value(exercise.difficulty),
        'is_custom': bool(exercise.is_custom),
        'is_active': bool(exercise.is_active),
        'created_by_id': exercise.created_by_id,
        'animation_type': animation_type,
        'animation_source': animation_source,
        'animation_url': animation_url,
    }
