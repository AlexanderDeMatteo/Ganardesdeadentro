import logging
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import MetricsHistory
from app.schemas.serializers import serialize_metric

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'


class MetricsService:
    @staticmethod
    def _apply_metric_fields(metric: MetricsHistory, data: dict):
        field_map = {
            'weight': 'weight',
            'bodyFat': 'body_fat_percentage',
            'bodyFatSource': 'body_fat_source',
            'muscleMass': 'muscle_mass',
            'muscleMassSource': 'muscle_mass_source',
            'bicepsLeft': 'biceps_left',
            'bicepsRight': 'biceps_right',
            'chest': 'chest',
            'waist': 'waist',
            'hips': 'hips',
            'thighLeft': 'thigh_left',
            'thighRight': 'thigh_right',
            'calfLeft': 'calf_left',
            'calfRight': 'calf_right',
            'notes': 'notes',
        }
        for source, target in field_map.items():
            if source in data:
                setattr(metric, target, data[source])
        if 'date' in data and data['date']:
            metric.measurement_date = datetime.fromisoformat(str(data['date']).replace('Z', '+00:00'))

    @staticmethod
    def list_metrics(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            metrics = (
                session.query(MetricsHistory)
                .filter_by(user_id=athlete_id)
                .order_by(MetricsHistory.measurement_date.asc())
                .all()
            )
            return [serialize_metric(item) for item in metrics], ''
        except Exception:
            logger.exception('Error listing metrics')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def add_metric(athlete_id: int, data: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            metric = MetricsHistory(user_id=athlete_id)
            MetricsService._apply_metric_fields(metric, data)
            session.add(metric)
            session.commit()
            session.refresh(metric)
            return serialize_metric(metric), ''
        except Exception:
            session.rollback()
            logger.exception('Error adding metric')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def update_metric(metric_id: int, patch: dict, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            metric = session.query(MetricsHistory).filter_by(id=metric_id).first()
            if not metric:
                return None, 'Métrica no encontrada'
            MetricsService._apply_metric_fields(metric, patch)
            session.commit()
            session.refresh(metric)
            return serialize_metric(metric), ''
        except Exception:
            session.rollback()
            logger.exception('Error updating metric')
            return None, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def delete_metric(metric_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            metric = session.query(MetricsHistory).filter_by(id=metric_id).first()
            if not metric:
                return False, 'Métrica no encontrada'
            session.delete(metric)
            session.commit()
            return True, ''
        except Exception:
            session.rollback()
            logger.exception('Error deleting metric')
            return False, GENERIC_ERROR
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_metric(metric_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            metric = session.query(MetricsHistory).filter_by(id=metric_id).first()
            return metric
        finally:
            if close_session:
                session.close()
