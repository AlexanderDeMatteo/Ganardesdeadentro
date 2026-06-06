from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class RoleEnum(str, enum.Enum):
    USER = 'user'
    ADMIN = 'admin'
    TRAINER = 'trainer'


class DifficultyEnum(str, enum.Enum):
    BEGINNER = 'beginner'
    INTERMEDIATE = 'intermediate'
    EXPERT = 'expert'


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(120), nullable=False)
    last_name = Column(String(120), nullable=False)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.USER, nullable=False)
    trainer_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    profile = relationship('UserProfile', back_populates='user', uselist=False, cascade='all, delete-orphan')
    metrics_history = relationship('MetricsHistory', back_populates='user', cascade='all, delete-orphan')
    assigned_routines = relationship(
        'UserRoutineAssignment',
        back_populates='user',
        foreign_keys='UserRoutineAssignment.user_id',
        cascade='all, delete-orphan',
    )
    managed_routines = relationship('Routine', back_populates='created_by_admin', foreign_keys='Routine.admin_id')
    trainer_routines = relationship('Routine', back_populates='trainer', foreign_keys='Routine.trainer_id')
    memberships = relationship('UserMembership', back_populates='user', cascade='all, delete-orphan')
    trainer = relationship('User', remote_side=[id], backref='athletes', foreign_keys=[trainer_id])
    weekly_plans = relationship(
        'WeeklyPlan',
        back_populates='user',
        foreign_keys='WeeklyPlan.user_id',
        cascade='all, delete-orphan',
    )
    workout_sessions = relationship('WorkoutSession', back_populates='user', cascade='all, delete-orphan')
    nutrition_plan = relationship('NutritionPlan', back_populates='user', uselist=False, cascade='all, delete-orphan')
    nutrition_draft = relationship('CoachNutritionDraft', back_populates='user', uselist=False, cascade='all, delete-orphan')

    __table_args__ = (
        Index('idx_user_email_active', 'email', 'is_active'),
        Index('idx_user_role_active', 'role', 'is_active'),
        Index('idx_user_trainer', 'trainer_id'),
    )


class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False, index=True)
    age = Column(Integer)
    gender = Column(String(20))
    initial_weight = Column(Float)
    initial_height = Column(Float)
    initial_body_fat_percentage = Column(Float)
    profile_picture_url = Column(String(255))
    bio = Column(Text)
    specialization = Column(String(160))
    rating = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship('User', back_populates='profile')


class Membership(Base):
    __tablename__ = 'memberships'

    id = Column(Integer, primary_key=True)
    name = Column(String(120), unique=True, nullable=False, index=True)
    description = Column(Text)
    price = Column(Float)
    features = Column(Text)
    color = Column(String(20), default='blue')
    duration_days = Column(Integer, default=30)
    routines_per_week = Column(Integer, default=0)
    exercise_video_access = Column(Boolean, default=True)
    metrics_tracking = Column(Boolean, default=True)
    support_priority = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user_memberships = relationship('UserMembership', back_populates='membership', cascade='all, delete-orphan')


class UserMembership(Base):
    __tablename__ = 'user_memberships'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    membership_id = Column(Integer, ForeignKey('memberships.id'), nullable=False)
    start_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    end_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    auto_renew = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship('User', back_populates='memberships')
    membership = relationship('Membership', back_populates='user_memberships')

    __table_args__ = (
        Index('idx_user_membership_active', 'user_id', 'is_active'),
        Index('idx_membership_dates', 'start_date', 'end_date'),
    )


class Exercise(Base):
    __tablename__ = 'exercises'

    id = Column(Integer, primary_key=True)
    exercise_db_id = Column(String(120), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    target_muscle = Column(String(120), nullable=False)
    equipment = Column(String(120))
    gif_url = Column(String(255))
    description = Column(Text)
    difficulty = Column(SQLEnum(DifficultyEnum), default=DifficultyEnum.BEGINNER)
    is_cached = Column(Boolean, default=True)
    synced_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    routine_exercises = relationship('RoutineExercise', back_populates='exercise', cascade='all, delete-orphan')

    __table_args__ = (
        Index('idx_exercise_muscle', 'target_muscle'),
        Index('idx_exercise_equipment', 'equipment'),
    )


class Routine(Base):
    __tablename__ = 'routines'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    admin_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    trainer_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    target_muscle_group = Column(String(120))
    difficulty = Column(SQLEnum(DifficultyEnum), default=DifficultyEnum.BEGINNER)
    duration_minutes = Column(Integer)
    required_membership_level = Column(Integer, ForeignKey('memberships.id'))
    is_active = Column(Boolean, default=True, nullable=False)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    exercises = relationship('RoutineExercise', back_populates='routine', cascade='all, delete-orphan')
    user_assignments = relationship('UserRoutineAssignment', back_populates='routine', cascade='all, delete-orphan')
    created_by_admin = relationship('User', back_populates='managed_routines', foreign_keys=[admin_id])
    trainer = relationship('User', back_populates='trainer_routines', foreign_keys=[trainer_id])

    __table_args__ = (
        Index('idx_routine_admin', 'admin_id', 'is_active'),
        Index('idx_routine_trainer', 'trainer_id', 'is_active'),
        Index('idx_routine_difficulty', 'difficulty'),
        CheckConstraint('admin_id IS NOT NULL OR trainer_id IS NOT NULL', name='ck_routine_owner_present'),
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
    suggested_weights = Column(Text)
    technique = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    routine = relationship('Routine', back_populates='exercises')
    exercise = relationship('Exercise', back_populates='routine_exercises')


class UserRoutineAssignment(Base):
    __tablename__ = 'user_routine_assignments'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    routine_id = Column(Integer, ForeignKey('routines.id'), nullable=False, index=True)
    trainer_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    assigned_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    is_active = Column(Boolean, default=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship('User', back_populates='assigned_routines', foreign_keys=[user_id])
    assigning_trainer = relationship('User', foreign_keys=[trainer_id])
    routine = relationship('Routine', back_populates='user_assignments')

    __table_args__ = (
        Index('idx_user_routine_dates', 'user_id', 'start_date', 'end_date'),
        Index('idx_routine_assignment_active', 'user_id', 'is_active'),
    )


class MetricsHistory(Base):
    __tablename__ = 'metrics_history'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    measurement_date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    weight = Column(Float)
    body_fat_percentage = Column(Float)
    muscle_mass = Column(Float)
    body_fat_source = Column(String(20))
    muscle_mass_source = Column(String(20))
    biceps_left = Column(Float)
    biceps_right = Column(Float)
    biceps = Column(Float)
    chest = Column(Float)
    waist = Column(Float)
    hips = Column(Float)
    thigh_left = Column(Float)
    thigh_right = Column(Float)
    thighs = Column(Float)
    calf_left = Column(Float)
    calf_right = Column(Float)
    calves = Column(Float)
    notes = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship('User', back_populates='metrics_history')

    __table_args__ = (
        Index('idx_metrics_user_date', 'user_id', 'measurement_date'),
    )


class WeeklyPlan(Base):
    __tablename__ = 'weekly_plans'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    trainer_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    week_start_date = Column(String(10), nullable=False)
    days = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship('User', back_populates='weekly_plans', foreign_keys=[user_id])
    trainer = relationship('User', foreign_keys=[trainer_id])


class WorkoutSession(Base):
    __tablename__ = 'workout_sessions'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    routine_id = Column(Integer, ForeignKey('routines.id'), nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey('user_routine_assignments.id'), nullable=True)
    week_plan_id = Column(Integer, ForeignKey('weekly_plans.id'), nullable=True)
    scheduled_date = Column(String(10), nullable=False)
    date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    set_logs = Column(Text, nullable=False, default='[]')
    completed = Column(Boolean, default=True)
    completed_sets = Column(Integer, default=0)
    failed_sets = Column(Integer, default=0)
    total_sets = Column(Integer, default=0)
    session_outcome = Column(String(20), default='completed')
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship('User', back_populates='workout_sessions')


class NutritionPlan(Base):
    __tablename__ = 'nutrition_plans'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False, index=True)
    macro_targets = Column(Text, nullable=False)
    meal_plan = Column(Text, nullable=False)
    slot_times = Column(Text, nullable=False)
    activity_level = Column(String(32), nullable=False)
    goal = Column(String(32), nullable=False)
    calorie_adjustment = Column(Integer, default=0)
    published_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    published_by = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship('User', back_populates='nutrition_plan')


class CoachNutritionDraft(Base):
    __tablename__ = 'coach_nutrition_drafts'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False, index=True)
    draft = Column(Text, nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship('User', back_populates='nutrition_draft')
