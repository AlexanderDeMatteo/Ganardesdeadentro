from flask_limiter import Limiter
from flask import current_app
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO


def _global_default_limits():
    configured = current_app.config.get('GLOBAL_RATE_LIMIT')
    if not configured:
        return None
    return str(configured)


limiter = Limiter(key_func=get_remote_address, default_limits=[_global_default_limits])
socketio = SocketIO(async_mode='threading', cors_allowed_origins='*')
