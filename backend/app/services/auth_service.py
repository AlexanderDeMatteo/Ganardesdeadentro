import bcrypt
from datetime import datetime, timezone
from app.models import User, UserProfile
from app.database import SessionLocal

class AuthService:
    """Servicio de autenticación."""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Genera un hash seguro de la contraseña."""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(12)).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verifica una contraseña contra su hash."""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    @staticmethod
    def create_user(email: str, password: str, first_name: str, last_name: str, 
                   role: str = 'user', session=None) -> tuple[User | None, str]:
        """
        Crea un nuevo usuario.
        
        Returns:
            tuple: (usuario creado, mensaje de error o vacio)
        """
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        
        try:
            # Validar que el email no exista
            existing_user = session.query(User).filter_by(email=email).first()
            if existing_user:
                return None, "El email ya está registrado"
            
            # Validar campos requeridos
            if not email or not password or not first_name or not last_name:
                return None, "Faltan campos requeridos"
            
            if len(password) < 8:
                return None, "La contraseña debe tener al menos 8 caracteres"
            
            # Crear usuario
            user = User(
                email=email.lower(),
                password_hash=AuthService.hash_password(password),
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                role=role,
                is_active=True
            )
            
            session.add(user)
            session.flush()  # Obtener el ID sin hacer commit
            
            # Crear perfil de usuario por defecto
            profile = UserProfile(
                user_id=user.id,
                created_at=datetime.now(timezone.utc)
            )
            session.add(profile)
            session.commit()
            
            return user, ""
        
        except Exception as e:
            session.rollback()
            return None, f"Error al crear usuario: {str(e)}"
        
        finally:
            if close_session:
                session.close()
    
    @staticmethod
    def authenticate_user(email: str, password: str, session=None) -> tuple[User | None, str]:
        """
        Autentica un usuario verificando email y contraseña.
        
        Returns:
            tuple: (usuario autenticado, mensaje de error o vacio)
        """
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        
        try:
            user = session.query(User).filter_by(email=email.lower()).first()
            
            if not user:
                return None, "Email o contraseña incorrectos"
            
            if not user.is_active:
                return None, "La cuenta ha sido desactivada"
            
            if not AuthService.verify_password(password, user.password_hash):
                return None, "Email o contraseña incorrectos"
            
            return user, ""
        
        except Exception as e:
            return None, f"Error al autenticar: {str(e)}"
        
        finally:
            if close_session:
                session.close()
    
    @staticmethod
    def get_user_by_id(user_id: int, session=None) -> User | None:
        """Obtiene un usuario por ID."""
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        
        try:
            return session.query(User).filter_by(id=user_id).first()
        finally:
            if close_session:
                session.close()
    
    @staticmethod
    def get_user_by_email(email: str, session=None) -> User | None:
        """Obtiene un usuario por email."""
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        
        try:
            return session.query(User).filter_by(email=email.lower()).first()
        finally:
            if close_session:
                session.close()
    
    @staticmethod
    def change_password(user_id: int, old_password: str, new_password: str, session=None) -> tuple[bool, str]:
        """
        Cambia la contraseña del usuario.
        
        Returns:
            tuple: (éxito, mensaje de error o vacio)
        """
        close_session = False
        if session is None:
            session = SessionLocal()
            close_session = True
        
        try:
            user = session.query(User).filter_by(id=user_id).first()
            
            if not user:
                return False, "Usuario no encontrado"
            
            if not AuthService.verify_password(old_password, user.password_hash):
                return False, "Contraseña actual incorrecta"
            
            if len(new_password) < 8:
                return False, "La nueva contraseña debe tener al menos 8 caracteres"
            
            user.password_hash = AuthService.hash_password(new_password)
            user.updated_at = datetime.now(timezone.utc)
            session.commit()
            
            return True, ""
        
        except Exception as e:
            session.rollback()
            return False, f"Error al cambiar contraseña: {str(e)}"
        
        finally:
            if close_session:
                session.close()
