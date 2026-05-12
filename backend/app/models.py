from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table, Boolean, Text, Enum as SQLEnum, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()

# ==================== ENUMS ====================

class RoleEnum(str, enum.Enum):
    """Roles de usuario."""
    USER = 'user'
    ADMIN = 'admin'

class DifficultyEnum(str, enum.Enum):
    """Niveles de dificultad."""
    BEGINNER = 'beginner'
    INTERMEDIATE = 'intermediate'
    EXPERT = 'expert'

# ==================== USUARIOS ====================

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(120), nullable=False)
    last_name = Column(String(120), nullable=False)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relaciones
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    metrics_history = relationship("MetricsHistory", back_populates="user", cascade="all, delete-orphan")
    assigned_routines = relationship("UserRoutineAssignment", back_populates="user", cascade="all, delete-orphan")
    managed_routines = relationship("Routine", back_populates="created_by_admin", foreign_keys="Routine.admin_id")
    memberships = relationship("UserMembership", back_populates="user", cascade="all, delete-orphan")
    
    # Índices compuestos para búsquedas frecuentes
    __table_args__ = (
        Index('idx_user_email_active', 'email', 'is_active'),
        Index('idx_user_role_active', 'role', 'is_active'),
    )

class UserProfile(Base):
    __tablename__ = 'user_profiles'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False, index=True)
    age = Column(Integer)
    gender = Column(String(20))
    initial_weight = Column(Float)  # kg
    initial_height = Column(Float)  # cm
    initial_body_fat_percentage = Column(Float)
    profile_picture_url = Column(String(255))
    bio = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relación
    user = relationship("User", back_populates="profile")

# ==================== MEMBRESÍAS ====================

class Membership(Base):
    __tablename__ = 'memberships'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(120), unique=True, nullable=False, index=True)
    description = Column(Text)
    price = Column(Float)  # precio mensual en USD
    routines_per_week = Column(Integer, default=0)
    exercise_video_access = Column(Boolean, default=True)
    metrics_tracking = Column(Boolean, default=True)
    support_priority = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relación
    user_memberships = relationship("UserMembership", back_populates="membership", cascade="all, delete-orphan")

class UserMembership(Base):
    __tablename__ = 'user_memberships'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    membership_id = Column(Integer, ForeignKey('memberships.id'), nullable=False)
    start_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    end_date = Column(DateTime)  # NULL si es vigente
    is_active = Column(Boolean, default=True)
    auto_renew = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relaciones
    user = relationship("User", back_populates="memberships")
    membership = relationship("Membership", back_populates="user_memberships")
    
    # Índices
    __table_args__ = (
        Index('idx_user_membership_active', 'user_id', 'is_active'),
        Index('idx_membership_dates', 'start_date', 'end_date'),
    )

# ==================== EJERCICIOS ====================

class Exercise(Base):
    __tablename__ = 'exercises'
    
    id = Column(Integer, primary_key=True)
    exercise_db_id = Column(String(120), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    target_muscle = Column(String(120), nullable=False)  # ej: "chest", "back"
    equipment = Column(String(120))
    gif_url = Column(String(255))
    description = Column(Text)
    difficulty = Column(SQLEnum(DifficultyEnum), default=DifficultyEnum.BEGINNER)
    is_cached = Column(Boolean, default=True)
    synced_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relación
    routine_exercises = relationship("RoutineExercise", back_populates="exercise", cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_exercise_muscle', 'target_muscle'),
        Index('idx_exercise_equipment', 'equipment'),
    )

# ==================== RUTINAS ====================

class Routine(Base):
    __tablename__ = 'routines'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    admin_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    target_muscle_group = Column(String(120))
    difficulty = Column(SQLEnum(DifficultyEnum), default=DifficultyEnum.BEGINNER)
    duration_minutes = Column(Integer)
    required_membership_level = Column(Integer, ForeignKey('memberships.id'))
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relaciones
    exercises = relationship("RoutineExercise", back_populates="routine", cascade="all, delete-orphan")
    user_assignments = relationship("UserRoutineAssignment", back_populates="routine", cascade="all, delete-orphan")
    created_by_admin = relationship("User", back_populates="managed_routines", foreign_keys=[admin_id])
    
    # Índices
    __table_args__ = (
        Index('idx_routine_admin', 'admin_id', 'is_active'),
        Index('idx_routine_difficulty', 'difficulty'),
    )

class RoutineExercise(Base):
    __tablename__ = 'routine_exercises'
    
    id = Column(Integer, primary_key=True)
    routine_id = Column(Integer, ForeignKey('routines.id'), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey('exercises.id'), nullable=False, index=True)
    order = Column(Integer, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    rest_seconds = Column(Integer, default=60)
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relaciones
    routine = relationship("Routine", back_populates="exercises")
    exercise = relationship("Exercise", back_populates="routine_exercises")

# ==================== ASIGNACIÓN DE RUTINAS ====================

class UserRoutineAssignment(Base):
    __tablename__ = 'user_routine_assignments'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    routine_id = Column(Integer, ForeignKey('routines.id'), nullable=False, index=True)
    assigned_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relaciones
    user = relationship("User", back_populates="assigned_routines")
    routine = relationship("Routine", back_populates="user_assignments")
    
    # Índices
    __table_args__ = (
        Index('idx_user_routine_dates', 'user_id', 'start_date', 'end_date'),
        Index('idx_routine_assignment_active', 'user_id', 'is_completed'),
    )

# ==================== MÉTRICAS ====================

class MetricsHistory(Base):
    __tablename__ = 'metrics_history'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    measurement_date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    weight = Column(Float)  # kg
    body_fat_percentage = Column(Float)
    biceps = Column(Float)  # cm
    chest = Column(Float)  # cm
    waist = Column(Float)  # cm
    hips = Column(Float)  # cm
    thighs = Column(Float)  # cm
    calves = Column(Float)  # cm
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relación
    user = relationship("User", back_populates="metrics_history")
    
    # Índices
    __table_args__ = (
        Index('idx_metrics_user_date', 'user_id', 'measurement_date'),
    )
