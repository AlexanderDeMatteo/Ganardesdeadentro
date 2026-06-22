import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

_DEV_JWT_FALLBACK = 'your-super-secret-key-change-in-production'


class Config:
    """Configuración base de la aplicación."""

    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///fitness_platform.db',
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv('SQL_ECHO', 'False') == 'True'

    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', _DEV_JWT_FALLBACK)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.getenv('JWT_EXPIRATION_HOURS', 24)))
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_COOKIE_SECURE = os.getenv('JWT_COOKIE_SECURE', 'False') == 'True'
    JWT_COOKIE_CSRF_PROTECT = os.getenv('JWT_COOKIE_CSRF_PROTECT', 'True') == 'True'
    JWT_COOKIE_SAMESITE = 'Strict'
    JWT_COOKIE_HTTPONLY = True

    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5000').split(',')

    EXERCISEDB_API_URL = os.getenv('EXERCISEDB_API_URL', 'https://oss.exercisedb.dev')
    EXERCISEDB_API_KEY = os.getenv('EXERCISEDB_API_KEY', '')
    EXERCISEDB_API_HOST = os.getenv('EXERCISEDB_API_HOST', '')
    EXERCISEDB_SSL_VERIFY = os.getenv('EXERCISEDB_SSL_VERIFY', 'true').lower() == 'true'

    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    DEBUG = ENVIRONMENT == 'development'

    AUTH_RATE_LIMIT = os.getenv('AUTH_RATE_LIMIT', '10 per minute')
    RATELIMIT_ENABLED = os.getenv('RATELIMIT_ENABLED', 'True') == 'True'
    RATELIMIT_STORAGE_URI = os.getenv('RATELIMIT_STORAGE_URI', 'memory://')

    RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
    EMAIL_FROM = os.getenv('EMAIL_FROM', 'FitTrack <onboarding@fittrack.local>')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    INVITATION_EXPIRY_HOURS = int(os.getenv('INVITATION_EXPIRY_HOURS', '72'))

    EXERCISE_MEDIA_UPLOAD_DIR = os.getenv('EXERCISE_MEDIA_UPLOAD_DIR', '/data/exercise_media')
    EXERCISE_MEDIA_MAX_BYTES = int(os.getenv('EXERCISE_MEDIA_MAX_BYTES', '10485760'))
    EXERCISE_MEDIA_ALLOWED_MIME = os.getenv(
        'EXERCISE_MEDIA_ALLOWED_MIME',
        'image/gif,video/mp4,image/webp',
    )

    PAYMENT_RECEIPT_UPLOAD_DIR = os.getenv('PAYMENT_RECEIPT_UPLOAD_DIR', '/data/payment_receipts')
    PAYMENT_RECEIPT_MAX_BYTES = int(os.getenv('PAYMENT_RECEIPT_MAX_BYTES', '5242880'))
    PAYMENT_RECEIPT_ALLOWED_MIME = os.getenv(
        'PAYMENT_RECEIPT_ALLOWED_MIME',
        'image/jpeg,image/png,image/gif,application/pdf',
    )


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', '')
    JWT_COOKIE_SECURE = True
    RATELIMIT_STORAGE_URI = os.getenv('RATELIMIT_STORAGE_URI', 'memory://')


class TestingConfig(Config):
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_COOKIE_SECURE = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'test-secret-key-for-pytest-only')
    RATELIMIT_ENABLED = False
    AUTH_RATE_LIMIT = '1000 per minute'
    EXERCISE_MEDIA_UPLOAD_DIR = os.getenv('EXERCISE_MEDIA_UPLOAD_DIR', 'exercise_media_test')
    PAYMENT_RECEIPT_UPLOAD_DIR = os.getenv('PAYMENT_RECEIPT_UPLOAD_DIR', 'payment_receipts_test')


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig,
}


def get_config():
    env = os.getenv('ENVIRONMENT', 'development')
    return config.get(env, config['default'])


def validate_critical_config(app_config) -> None:
    """
    Valida variables críticas al arranque.
    En producción aborta si faltan secretos obligatorios.
    """
    env = getattr(app_config, 'ENVIRONMENT', os.getenv('ENVIRONMENT', 'development'))
    jwt_secret = getattr(app_config, 'JWT_SECRET_KEY', '')
    jwt_cookie_secure = getattr(app_config, 'JWT_COOKIE_SECURE', False)

    if env == 'production':
        if not jwt_secret or jwt_secret == _DEV_JWT_FALLBACK:
            raise RuntimeError(
                'JWT_SECRET_KEY debe definirse con un valor seguro en producción',
            )
        if not jwt_cookie_secure:
            raise RuntimeError(
                'JWT_COOKIE_SECURE debe ser True en producción',
            )
        return

    if env == 'development' and jwt_secret == _DEV_JWT_FALLBACK:
        import warnings
        warnings.warn(
            'Usando JWT_SECRET_KEY de desarrollo. No usar en producción.',
            stacklevel=2,
        )
