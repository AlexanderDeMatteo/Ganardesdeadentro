from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.pool import StaticPool
from contextlib import contextmanager
from app.models import Base
from app.config import get_config

config = get_config()


def _build_engine():
    engine_kwargs = {
        'echo': config.SQLALCHEMY_ECHO,
        'pool_pre_ping': True,
    }

    if config.TESTING and ':memory:' in config.SQLALCHEMY_DATABASE_URI:
        engine_kwargs['connect_args'] = {'check_same_thread': False}
        engine_kwargs['poolclass'] = StaticPool
    else:
        engine_kwargs['pool_size'] = 10
        engine_kwargs['max_overflow'] = 20
        engine_kwargs['pool_recycle'] = 3600

    return create_engine(config.SQLALCHEMY_DATABASE_URI, **engine_kwargs)


engine = _build_engine()
SessionLocal = scoped_session(sessionmaker(bind=engine, expire_on_commit=False))


def init_db():
    """Inicializa la base de datos creando todas las tablas."""
    Base.metadata.create_all(bind=engine)


def drop_db():
    """Elimina todas las tablas (solo para testing/desarrollo)."""
    Base.metadata.drop_all(bind=engine)


@contextmanager
def get_db_session():
    """Context manager para obtener una sesión de la BD."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_session():
    """Retorna una sesión de la BD. Debe ser cerrada manualmente."""
    return SessionLocal()


def close_session():
    """Cierra la sesión."""
    SessionLocal.remove()
