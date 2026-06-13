import logging
import os
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import RoleEnum, User
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

DEMO_TRAINERS = (
    {
        'email': 'trainer1@fittrack.demo',
        'first_name': 'Ana',
        'last_name': 'López',
        'specialization': 'Fuerza',
    },
    {
        'email': 'trainer2@fittrack.demo',
        'first_name': 'Luis',
        'last_name': 'García',
        'specialization': 'Cardio',
    },
    {
        'email': 'trainer3@fittrack.demo',
        'first_name': 'María',
        'last_name': 'Ruiz',
        'specialization': 'HIIT',
    },
)


def seed_demo_trainers() -> None:
    """Crea entrenadores activos de demo si no existen (solo desarrollo)."""
    env = os.getenv('ENVIRONMENT', 'development')
    if env in ('production', 'testing'):
        return
    if os.getenv('SEED_DEMO_TRAINERS', 'true').lower() not in ('1', 'true', 'yes'):
        return

    created = 0
    for spec in DEMO_TRAINERS:
        email = spec['email'].strip().lower()
        session = SessionLocal()
        try:
            existing = session.query(User).filter_by(email=email).first()
            if existing:
                if existing.role == RoleEnum.TRAINER and not existing.is_active:
                    existing.is_active = True
                    existing.updated_at = datetime.now(timezone.utc)
                    if existing.profile:
                        existing.profile.specialization = spec['specialization']
                    session.commit()
                continue
        finally:
            session.close()

        user, error = AuthService.create_user(
            email=email,
            password='password123',
            first_name=spec['first_name'],
            last_name=spec['last_name'],
            role='trainer',
        )
        if error:
            logger.warning('No se pudo crear entrenador demo %s: %s', email, error)
            continue

        session = SessionLocal()
        try:
            db_user = session.query(User).filter_by(id=user.id).first()
            if db_user and db_user.profile:
                db_user.profile.specialization = spec['specialization']
                session.commit()
            created += 1
        finally:
            session.close()

    if created:
        logger.info('Seed demo: %s entrenador(es) creado(s)', created)
