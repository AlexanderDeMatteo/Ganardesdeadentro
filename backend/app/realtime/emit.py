from app.extensions import socketio


def emit_to_user(user_id: int, event: str, payload: dict) -> None:
    socketio.emit(event, payload, room=f'user:{user_id}')


def emit_to_admins(event: str, payload: dict) -> None:
    socketio.emit(event, payload, room='role:admin')


def emit_to_support_thread(athlete_id: int, event: str, payload: dict) -> None:
    socketio.emit(event, payload, room=f'support:{athlete_id}')
