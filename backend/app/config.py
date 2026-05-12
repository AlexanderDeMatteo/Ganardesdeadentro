import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuración base de la aplicación."""
    
    # Base de datos
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///fitness_platform.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv('SQL_ECHO', 'False') == 'True'
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-super-secret-key-change-in-production')
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
    
class TestingConfig(Config):
    """Configuración para testing."""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_COOKIE_SECURE = False

# Seleccionar config según el ambiente
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Retorna la configuración según el ambiente."""
    env = os.getenv('ENVIRONMENT', 'development')
    return config.get(env, config['default'])
