import logging
from datetime import datetime

from app.database import SessionLocal
from app.models import MetricsHistory
from app.schemas.serializers import serialize_metric

logger = logging.getLogger(__name__)
GENERIC_ERROR = 'No se pudo completar la operación'

VALIDATION_ERRORS = frozenset({
    'Fecha inválida',
    'Peso debe ser mayor que 0',
    'Grasa corporal debe estar entre 0 y 100',
})


class MetricsService:
    @staticmethod
    def _parse_date(value) -> datetime | None:
        try:
            return datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _validate_numeric_fields(data: dict) -> str | None:
        if 'weight' in data and data['weight'] is not None:
            try:
                weight = float(data['weight'])
            except (TypeError, ValueError):
                return 'Peso debe ser mayor que 0'
            if weight <= 0:
                return 'Peso debe ser mayor que 0'

        if 'bodyFat' in data and data['bodyFat'] is not None:
            try:
                body_fat = float(data['bodyFat'])
            except (TypeError, ValueError):
                return 'Grasa corporal debe estar entre 0 y 100'
            if body_fat < 0 or body_fat > 100:
                return 'Grasa corporal debe estar entre 0 y 100'

        return None

    @staticmethod
    def _apply_metric_fields(metric: MetricsHistory, data: dict) -> str | None:
        validation_error = MetricsService._validate_numeric_fields(data)
        if validation_error:
            return validation_error

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
            parsed = MetricsService._parse_date(data['date'])
            if parsed is None:
                return 'Fecha inválida'
            metric.measurement_date = parsed
        return None

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
            field_error = MetricsService._apply_metric_fields(metric, data)
            if field_error:
                return None, field_error
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
            field_error = MetricsService._apply_metric_fields(metric, patch)
            if field_error:
                return None, field_error
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

    @staticmethod
    def get_latest_metric(athlete_id: int, session=None):
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            metric = (
                session.query(MetricsHistory)
                .filter_by(user_id=athlete_id)
                .order_by(MetricsHistory.measurement_date.desc(), MetricsHistory.id.desc())
                .first()
            )
            return metric
        finally:
            if close_session:
                session.close()

    @staticmethod
    def get_latest_metrics_for_users(user_ids: list[int], session=None) -> dict[int, MetricsHistory]:
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        try:
            if not user_ids:
                return {}
            metrics = (
                session.query(MetricsHistory)
                .filter(MetricsHistory.user_id.in_(user_ids))
                .order_by(
                    MetricsHistory.user_id.asc(),
                    MetricsHistory.measurement_date.desc(),
                    MetricsHistory.id.desc(),
                )
                .all()
            )
            result: dict[int, MetricsHistory] = {}
            for metric in metrics:
                if metric.user_id not in result:
                    result[metric.user_id] = metric
            return result
        finally:
            if close_session:
                session.close()
