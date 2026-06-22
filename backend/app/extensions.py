from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO

limiter = Limiter(key_func=get_remote_address, default_limits=[])
socketio = SocketIO(async_mode='threading', cors_allowed_origins='*')
