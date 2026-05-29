import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

_DEV_JWT_FALLBACK = 'your-super-secret-key-change-in-production'


class Config:
    """Configuración base de la aplicación."""

    # Base de datos
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///fitness_platform.db',
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv('SQL_ECHO', 'False') == 'True'

    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', _DEV_JWT_FALLBACK)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv('JWT_EXPIRATION_HOURS', 24)))
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_COOKIE_SECURE = os.getenv('JWT_COOKIE_SECURE', 'False') == 'True'
    JWT_COOKIE_CSRF_PROTECT = os.getenv('JWT_COOKIE_CSRF_PROTECT', 'True') == 'True'
    JWT_COOKIE_SAMESITE = 'Strict'
    JWT_COOKIE_HTTPONLY = True

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5000').split(',')

    # ExerciseDB API
    EXERCISEDB_API_URL = 'https://exercisedb.p.rapidapi.com'
    EXERCISEDB_API_KEY = os.getenv('EXERCISEDB_API_KEY', '')
    EXERCISEDB_API_HOST = 'exercisedb.p.rapidapi.com'

    # Aplicación
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    DEBUG = ENVIRONMENT == 'development'


class DevelopmentConfig(Config):
    """Configuración para desarrollo."""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Configuración para producción."""
    DEBUG = False
    TESTING = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', '')


class TestingConfig(Config):
    """Configuración para testing."""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_COOKIE_SECURE = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'test-secret-key-for-pytest-only')


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig,
}


def get_config():
    """Retorna la configuración según el ambiente."""
    env = os.getenv('ENVIRONMENT', 'development')
    return config.get(env, config['default'])


def validate_critical_config(app_config) -> None:
    """
    Valida variables críticas al arranque.
    En producción aborta si faltan secretos obligatorios.
    """
    env = getattr(app_config, 'ENVIRONMENT', os.getenv('ENVIRONMENT', 'development'))
    jwt_secret = getattr(app_config, 'JWT_SECRET_KEY', '')

    if env == 'production':
        if not jwt_secret or jwt_secret == _DEV_JWT_FALLBACK:
            raise RuntimeError(
                'JWT_SECRET_KEY debe definirse con un valor seguro en producción',
            )
        return

    if env == 'development' and jwt_secret == _DEV_JWT_FALLBACK:
        import warnings
        warnings.warn(
            'Usando JWT_SECRET_KEY de desarrollo. No usar en producción.',
            stacklevel=2,
        )
