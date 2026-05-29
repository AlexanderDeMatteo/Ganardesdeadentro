from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import get_config, validate_critical_config
from app.database import init_db, SessionLocal


def create_app(config=None):
    """Factory para crear la aplicación Flask."""

    app = Flask(__name__)

    if config is None:
        config = get_config()

    validate_critical_config(config)
    app.config.from_object(config)

    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    JWTManager(app)

    init_db()

    from app.routes import (
        admin_bp,
        auth_bp,
        exercises_bp,
        memberships_bp,
        metrics_bp,
        nutrition_bp,
        routines_bp,
        sessions_bp,
        users_bp,
    )

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(exercises_bp, url_prefix='/api/exercises')
    app.register_blueprint(routines_bp, url_prefix='/api/routines')
    app.register_blueprint(memberships_bp, url_prefix='/api/memberships')
    app.register_blueprint(metrics_bp, url_prefix='/api/metrics')
    app.register_blueprint(sessions_bp, url_prefix='/api/sessions')
    app.register_blueprint(nutrition_bp, url_prefix='/api/nutrition')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200

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
