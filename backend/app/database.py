from sqlalchemy import create_engine, inspect, text
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


def _sync_missing_columns() -> None:
    """Agrega columnas del modelo que falten en tablas existentes (SQLite/dev)."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    for table_name, table in Base.metadata.tables.items():
        if table_name not in existing_tables:
            continue

        existing_columns = {column['name'] for column in inspector.get_columns(table_name)}
        for column in table.columns:
            if column.name in existing_columns:
                continue
            if not column.nullable and column.server_default is None and column.default is None:
                continue

            column_type = column.type.compile(dialect=engine.dialect)
            alter_sql = f'ALTER TABLE {table_name} ADD COLUMN {column.name} {column_type}'
            with engine.begin() as connection:
                connection.execute(text(alter_sql))


def init_db():
    """Inicializa la base de datos creando tablas y sincronizando columnas faltantes."""
    Base.metadata.create_all(bind=engine)
    _sync_missing_columns()
    from app.services.dev_seed_service import seed_demo_trainers

    seed_demo_trainers()


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
