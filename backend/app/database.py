from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from contextlib import contextmanager
from app.models import Base
from app.config import get_config

config = get_config()

# Crear engine con parámetros optimizados
engine = create_engine(
    config.SQLALCHEMY_DATABASE_URI,
    echo=config.SQLALCHEMY_ECHO,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verifica la conexión antes de usarla
    pool_recycle=3600,   # Recicla conexiones cada hora
)

# Session factory
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
