import requests
from datetime import datetime, timezone
from app.models import Exercise
from app.database import SessionLocal
from app.config import get_config

config = get_config()

class ExerciseAPIService:
    """Servicio para integrar con ExerciseDB API."""
    
    BASE_URL = config.EXERCISEDB_API_URL
    API_KEY = config.EXERCISEDB_API_KEY
    API_HOST = config.EXERCISEDB_API_HOST
    
    @classmethod
    def get_headers(cls) -> dict:
        """Retorna los headers necesarios para la API."""
        return {
            'x-rapidapi-key': cls.API_KEY,
            'x-rapidapi-host': cls.API_HOST
        }
    
    @classmethod
    def get_exercises_by_muscle(cls, muscle: str, limit: int = 50) -> tuple[list[dict], str]:
        """
        Obtiene ejercicios por grupo muscular desde ExerciseDB API.
        
        Args:
            muscle: Grupo muscular (ej: 'chest', 'back', 'legs')
            limit: Cantidad máxima de resultados
            
        Returns:
            tuple: (lista de ejercicios, mensaje de error o vacio)
        """
        try:
            # Primero buscar en caché local
            session = SessionLocal()
            cached_exercises = session.query(Exercise).filter_by(
                target_muscle=muscle.lower(),
                is_cached=True
            ).limit(limit).all()
            
            if cached_exercises:
                session.close()
                return [
                    {
                        'id': ex.id,
                        'exercise_db_id': ex.exercise_db_id,
                        'name': ex.name,
                        'target_muscle': ex.target_muscle,
                        'equipment': ex.equipment,
                        'gif_url': ex.gif_url,
                        'difficulty': ex.difficulty,
                    }
                    for ex in cached_exercises
                ], ""
            
            session.close()
            
            # Si no hay en caché, hacer request a la API
            url = f"{cls.BASE_URL}/exercises/targetMuscle/{muscle}"
            response = requests.get(url, headers=cls.get_headers(), timeout=10)
            
            if response.status_code != 200:
                return [], f"Error en ExerciseDB API: {response.status_code}"
            
            exercises = response.json()
            
            # Guardar en BD local
            session = SessionLocal()
            for exercise_data in exercises[:limit]:
                existing = session.query(Exercise).filter_by(
                    exercise_db_id=exercise_data.get('id')
                ).first()
                
                if not existing:
                    exercise = Exercise(
                        exercise_db_id=exercise_data.get('id'),
                        name=exercise_data.get('name', ''),
                        target_muscle=exercise_data.get('target', muscle).lower(),
                        equipment=exercise_data.get('equipment', ''),
                        gif_url=exercise_data.get('gifUrl', ''),
                        difficulty='beginner',
                        is_cached=True,
                        synced_at=datetime.now(timezone.utc)
                    )
                    session.add(exercise)
            
            session.commit()
            session.close()
            
            return exercises[:limit], ""
        
        except requests.exceptions.RequestException as e:
            return [], f"Error de conexión: {str(e)}"
        except Exception as e:
            return [], f"Error: {str(e)}"
    
    @classmethod
    def search_exercises(cls, query: str, limit: int = 20) -> tuple[list[dict], str]:
        """
        Busca ejercicios por nombre o características.
        
        Args:
            query: Término de búsqueda
            limit: Cantidad máxima de resultados
            
        Returns:
            tuple: (lista de ejercicios, mensaje de error o vacio)
        """
        try:
            # Primero buscar en caché local
            session = SessionLocal()
            cached_exercises = session.query(Exercise).filter(
                Exercise.name.ilike(f"%{query}%")
            ).limit(limit).all()
            
            if cached_exercises:
                session.close()
                return [
                    {
                        'id': ex.id,
                        'exercise_db_id': ex.exercise_db_id,
                        'name': ex.name,
                        'target_muscle': ex.target_muscle,
                        'equipment': ex.equipment,
                        'gif_url': ex.gif_url,
                        'difficulty': ex.difficulty,
                    }
                    for ex in cached_exercises
                ], ""
            
            session.close()
            
            # Si no hay muchos en caché, hacer request a la API
            url = f"{cls.BASE_URL}/exercises/name/{query}"
            response = requests.get(url, headers=cls.get_headers(), timeout=10)
            
            if response.status_code != 200:
                return [], f"Error en ExerciseDB API: {response.status_code}"
            
            exercises = response.json()
            
            # Guardar en BD local
            session = SessionLocal()
            for exercise_data in exercises[:limit]:
                existing = session.query(Exercise).filter_by(
                    exercise_db_id=exercise_data.get('id')
                ).first()
                
                if not existing:
                    exercise = Exercise(
                        exercise_db_id=exercise_data.get('id'),
                        name=exercise_data.get('name', ''),
                        target_muscle=exercise_data.get('target', '').lower(),
                        equipment=exercise_data.get('equipment', ''),
                        gif_url=exercise_data.get('gifUrl', ''),
                        difficulty='beginner',
                        is_cached=True,
                        synced_at=datetime.now(timezone.utc)
                    )
                    session.add(exercise)
            
            session.commit()
            session.close()
            
            return exercises[:limit], ""
        
        except requests.exceptions.RequestException as e:
            return [], f"Error de conexión: {str(e)}"
        except Exception as e:
            return [], f"Error: {str(e)}"
    
    @classmethod
    def get_all_muscles(cls) -> tuple[list[str], str]:
        """
        Obtiene todos los grupos musculares disponibles.
        
        Returns:
            tuple: (lista de músculos, mensaje de error o vacio)
        """
        try:
            url = f"{cls.BASE_URL}/exercises/targetList"
            response = requests.get(url, headers=cls.get_headers(), timeout=10)
            
            if response.status_code != 200:
                return [], f"Error en ExerciseDB API: {response.status_code}"
            
            muscles = response.json()
            return sorted(muscles), ""
        
        except requests.exceptions.RequestException as e:
            return [], f"Error de conexión: {str(e)}"
        except Exception as e:
            return [], f"Error: {str(e)}"
    
    @classmethod
    def get_exercise_by_id(cls, exercise_id: str) -> tuple[dict | None, str]:
        """
        Obtiene un ejercicio específico por su ID.
        
        Returns:
            tuple: (ejercicio, mensaje de error o vacio)
        """
        try:
            # Buscar en caché
            session = SessionLocal()
            exercise = session.query(Exercise).filter_by(exercise_db_id=exercise_id).first()
            
            if exercise:
                result = {
                    'id': exercise.id,
                    'exercise_db_id': exercise.exercise_db_id,
                    'name': exercise.name,
                    'target_muscle': exercise.target_muscle,
                    'equipment': exercise.equipment,
                    'gif_url': exercise.gif_url,
                    'difficulty': exercise.difficulty,
                }
                session.close()
                return result, ""
            
            session.close()
            
            # Si no está en caché, hacer request a la API
            url = f"{cls.BASE_URL}/exercises/exercise/{exercise_id}"
            response = requests.get(url, headers=cls.get_headers(), timeout=10)
            
            if response.status_code != 200:
                return None, f"Ejercicio no encontrado"
            
            exercise_data = response.json()
            
            # Guardar en BD
            session = SessionLocal()
            exercise = Exercise(
                exercise_db_id=exercise_data.get('id'),
                name=exercise_data.get('name', ''),
                target_muscle=exercise_data.get('target', '').lower(),
                equipment=exercise_data.get('equipment', ''),
                gif_url=exercise_data.get('gifUrl', ''),
                difficulty='beginner',
                is_cached=True,
                synced_at=datetime.now(timezone.utc)
            )
            session.add(exercise)
            session.commit()
            session.close()
            
            return exercise_data, ""
        
        except Exception as e:
            return None, f"Error: {str(e)}"
