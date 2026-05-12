from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.exercise_api_service import ExerciseAPIService
from app.database import SessionLocal
from app.models import Exercise

exercises_bp = Blueprint('exercises', __name__)

@exercises_bp.route('/muscles', methods=['GET'])
def get_all_muscles():
    """Obtiene todos los grupos musculares disponibles."""
    muscles, error = ExerciseAPIService.get_all_muscles()
    
    if error:
        return {'error': error}, 500
    
    return {
        'muscles': muscles,
        'count': len(muscles)
    }, 200

@exercises_bp.route('/by-muscle/<muscle>', methods=['GET'])
def get_exercises_by_muscle(muscle):
    """Obtiene ejercicios por grupo muscular."""
    limit = request.args.get('limit', 50, type=int)
    
    if limit > 100:
        limit = 100
    
    exercises, error = ExerciseAPIService.get_exercises_by_muscle(muscle, limit=limit)
    
    if error:
        return {'error': error}, 500
    
    return {
        'muscle': muscle,
        'exercises': exercises,
        'count': len(exercises)
    }, 200

@exercises_bp.route('/search', methods=['GET'])
def search_exercises():
    """Busca ejercicios por nombre."""
    query = request.args.get('q', '', type=str).strip()
    limit = request.args.get('limit', 20, type=int)
    
    if not query or len(query) < 2:
        return {'error': 'Query debe tener al menos 2 caracteres'}, 400
    
    if limit > 100:
        limit = 100
    
    exercises, error = ExerciseAPIService.search_exercises(query, limit=limit)
    
    if error:
        return {'error': error}, 500
    
    return {
        'query': query,
        'exercises': exercises,
        'count': len(exercises)
    }, 200

@exercises_bp.route('/<exercise_id>', methods=['GET'])
def get_exercise(exercise_id):
    """Obtiene un ejercicio específico."""
    exercise, error = ExerciseAPIService.get_exercise_by_id(exercise_id)
    
    if error:
        return {'error': error}, 404
    
    return {'exercise': exercise}, 200

@exercises_bp.route('/cached', methods=['GET'])
def get_cached_exercises():
    """Obtiene los ejercicios almacenados en caché local."""
    session = SessionLocal()
    
    try:
        muscle = request.args.get('muscle', None, type=str)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        if per_page > 100:
            per_page = 100
        
        # Construir query
        query = session.query(Exercise).filter_by(is_cached=True)
        
        if muscle:
            query = query.filter_by(target_muscle=muscle.lower())
        
        # Paginar
        total = query.count()
        exercises = query.limit(per_page).offset((page - 1) * per_page).all()
        
        return {
            'exercises': [
                {
                    'id': ex.id,
                    'exercise_db_id': ex.exercise_db_id,
                    'name': ex.name,
                    'target_muscle': ex.target_muscle,
                    'equipment': ex.equipment,
                    'gif_url': ex.gif_url,
                    'difficulty': ex.difficulty,
                }
                for ex in exercises
            ],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }, 200
    
    finally:
        session.close()

@exercises_bp.route('/clear-cache', methods=['POST'])
@jwt_required()
def clear_exercise_cache():
    """Limpia el caché de ejercicios (solo admin)."""
    from flask_jwt_extended import get_jwt
    
    claims = get_jwt()
    if claims['role'] != 'admin':
        return {'error': 'No tienes permisos para esta acción'}, 403
    
    session = SessionLocal()
    
    try:
        # Eliminar todos los ejercicios en caché
        deleted = session.query(Exercise).filter_by(is_cached=True).delete()
        session.commit()
        
        return {'message': f'{deleted} ejercicios eliminados del caché'}, 200
    
    except Exception as e:
        session.rollback()
        return {'error': str(e)}, 500
    
    finally:
        session.close()
