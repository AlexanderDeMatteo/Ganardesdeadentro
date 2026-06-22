from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import get_config, validate_critical_config
from app.database import SessionLocal, init_db
from app.extensions import limiter, socketio
from app.models import User


def create_app(config=None):
    """Factory para crear la aplicación Flask."""

    app = Flask(__name__)
    app.url_map.strict_slashes = False

    if config is None:
        config = get_config()

    validate_critical_config(config)
    app.config.from_object(config)

    CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
    jwt = JWTManager(app)
    limiter.init_app(app)
    socketio.init_app(app, cors_allowed_origins=app.config['CORS_ORIGINS'])

    @jwt.user_lookup_loader
    def load_user(_jwt_header, jwt_data):
        session = SessionLocal()
        try:
            user_id = int(jwt_data['sub'])
            user = session.query(User).filter_by(id=user_id).first()
            if user is None or not user.is_active:
                return None
            return user
        finally:
            session.close()

    @jwt.user_lookup_error_loader
    def invalid_user(_jwt_header, jwt_data):
        return {'error': 'La cuenta ha sido desactivada o no existe'}, 401

    init_db()

    from app.routes import (
        admin_bp,
        auth_bp,
        exchange_rates_bp,
        exercises_bp,
        memberships_bp,
        metrics_bp,
        notifications_bp,
        nutrition_bp,
        payments_bp,
        routines_bp,
        sessions_bp,
        support_bp,
        users_bp,
    )
    from app.realtime.events import register_socket_events

    register_socket_events()

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(exchange_rates_bp, url_prefix='/api/exchange-rates')
    app.register_blueprint(exercises_bp, url_prefix='/api/exercises')
    app.register_blueprint(routines_bp, url_prefix='/api/routines')
    app.register_blueprint(memberships_bp, url_prefix='/api/memberships')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(metrics_bp, url_prefix='/api/metrics')
    app.register_blueprint(sessions_bp, url_prefix='/api/sessions')
    app.register_blueprint(nutrition_bp, url_prefix='/api/nutrition')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(support_bp, url_prefix='/api/support')

    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200

    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Recurso no encontrado'}, 404

    @app.errorhandler(500)
    def server_error(error):
        return {'error': 'Error interno del servidor'}, 500

    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        return {'error': 'Demasiadas solicitudes. Intenta más tarde.'}, 429

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        """Cierra la sesión de BD al terminar la request."""
        SessionLocal.remove()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
