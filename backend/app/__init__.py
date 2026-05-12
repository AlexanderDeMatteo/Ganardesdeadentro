from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import get_config
from app.database import init_db, SessionLocal

def create_app(config=None):
    """Factory para crear la aplicación Flask."""
    
    app = Flask(__name__)
    
    # Cargar configuración
    if config is None:
        config = get_config()
    
    app.config.from_object(config)
    
    # Inicializar extensiones
    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    JWTManager(app)
    
    # Inicializar base de datos
    init_db()
    
    # Registrar blueprints (rutas)
    from app.routes import auth_bp, users_bp, exercises_bp, routines_bp, memberships_bp, metrics_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(exercises_bp, url_prefix='/api/exercises')
    app.register_blueprint(routines_bp, url_prefix='/api/routines')
    app.register_blueprint(memberships_bp, url_prefix='/api/memberships')
    app.register_blueprint(metrics_bp, url_prefix='/api/metrics')
    
    # Health check
    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Recurso no encontrado'}, 404
    
    @app.errorhandler(500)
    def server_error(error):
        return {'error': 'Error interno del servidor'}, 500
    
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        """Cierra la sesión de BD al terminar la request."""
        SessionLocal.remove()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
