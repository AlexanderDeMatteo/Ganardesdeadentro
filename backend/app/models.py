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
    nutrition_diary = relationship('NutritionDiary', back_populates='user', uselist=False, cascade='all, delete-orphan')

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
    phone = Column(String(40))
    country = Column(String(80))
    seller_code = Column(String(80))
    specialization = Column(String(160))
    rating = Column(Float, default=0.0)
    max_athletes = Column(Integer, default=10)
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
    functional_tier = Column(String(20), nullable=False, default='basic', server_default='basic')
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
    payment_requests = relationship('MembershipPaymentRequest', back_populates='membership', cascade='all, delete-orphan')


class ExchangeRate(Base):
    __tablename__ = 'exchange_rates'

    id = Column(Integer, primary_key=True)
    from_currency = Column(String(3), nullable=False, default='USD')
    to_currency = Column(String(3), nullable=False, default='VES')
    rate = Column(Float, nullable=False, default=1)
    label = Column(String(80))
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    payment_methods = relationship('PaymentMethod', back_populates='exchange_rate')

    __table_args__ = (
        Index('idx_exchange_rate_pair_active', 'from_currency', 'to_currency', 'is_active'),
    )


class PaymentMethod(Base):
    __tablename__ = 'payment_methods'

    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    category = Column(String(120), nullable=False, default='')
    method_type = Column(String(20), nullable=False, default='digital')
    exchange_rate_id = Column(Integer, ForeignKey('exchange_rates.id'), nullable=True, index=True)
    details = Column(Text, nullable=False, default='[]')
    instructions = Column(Text, nullable=False, default='')
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    payment_requests = relationship('MembershipPaymentRequest', back_populates='payment_method')
    exchange_rate = relationship('ExchangeRate', back_populates='payment_methods')


class MembershipPaymentRequest(Base):
    __tablename__ = 'membership_payment_requests'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    membership_id = Column(Integer, ForeignKey('memberships.id'), nullable=False, index=True)
    payment_method_id = Column(Integer, ForeignKey('payment_methods.id'), nullable=False, index=True)
    full_name = Column(String(200), nullable=False)
    phone = Column(String(40), nullable=False)
    country = Column(String(80), nullable=False)
    seller_code = Column(String(80))
    email = Column(String(120), nullable=False)
    amount = Column(Float, nullable=False, default=0)
    amount_usd = Column(Float, nullable=False, default=0)
    amount_converted = Column(Float)
    converted_currency = Column(String(3))
    exchange_rate_snapshot = Column(Float)
    receipt_path = Column(String(512), nullable=False)
    receipt_mime = Column(String(80), nullable=False)
    receipt_size = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default='pending', index=True)
    reviewed_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship('User', back_populates='payment_requests', foreign_keys=[user_id])
    membership = relationship('Membership', back_populates='payment_requests')
    payment_method = relationship('PaymentMethod', back_populates='payment_requests')
    reviewer = relationship('User', foreign_keys=[reviewed_by])

    __table_args__ = (
        Index('idx_payment_request_status_created', 'status', 'created_at'),
        Index('idx_payment_request_user_status', 'user_id', 'status'),
    )


User.payment_requests = relationship(
    'MembershipPaymentRequest',
    back_populates='user',
    foreign_keys=[MembershipPaymentRequest.user_id],
    cascade='all, delete-orphan',
)


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
    is_custom = Column(Boolean, default=False, nullable=False, server_default='0')
    is_active = Column(Boolean, default=True, nullable=False, server_default='1')
    created_by_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    animation_type = Column(String(20), default='none', nullable=False, server_default='none')
    animation_source = Column(String(20), default='none', nullable=False, server_default='none')
    animation_url = Column(String(512))
    synced_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    routine_exercises = relationship('RoutineExercise', back_populates='exercise', cascade='all, delete-orphan')
    created_by = relationship('User', foreign_keys=[created_by_id])

    __table_args__ = (
        Index('idx_exercise_muscle', 'target_muscle'),
        Index('idx_exercise_equipment', 'equipment'),
        Index('idx_exercise_custom_active', 'is_custom', 'is_active', 'name'),
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
    structure_type = Column(String(32), nullable=False, default='standard', server_default='standard')
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
    block_config = Column(Text)
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


class SessionExecutionMedia(Base):
    __tablename__ = 'session_execution_media'

    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False, unique=True, index=True)
    athlete_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    uploaded_by_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    athlete = relationship('User', foreign_keys=[athlete_id])
    uploaded_by = relationship('User', foreign_keys=[uploaded_by_id])

    __table_args__ = (
        Index('idx_session_media_athlete_created', 'athlete_id', 'created_at'),
    )


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


class NutritionDiary(Base):
    __tablename__ = 'nutrition_diaries'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False, index=True)
    food_log = Column(Text, nullable=False, default='[]')
    water_by_date = Column(Text, nullable=False, default='{}')
    water_goal_ml = Column(Integer, default=2500, nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship('User', back_populates='nutrition_diary')


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


class InvitationToken(Base):
    __tablename__ = 'invitation_tokens'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, unique=True)
    purpose = Column(String(32), nullable=False, default='trainer_invite')
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship('User', backref='invitation_tokens')

    __table_args__ = (
        Index('idx_invitation_user_purpose', 'user_id', 'purpose'),
    )


class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    type = Column(String(64), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False, default='')
    data = Column(Text, nullable=False, default='{}')
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship('User', backref='notifications')

    __table_args__ = (
        Index('idx_notification_user_read', 'user_id', 'read_at'),
        Index('idx_notification_user_created', 'user_id', 'created_at'),
    )


class SupportThread(Base):
    __tablename__ = 'support_threads'

    id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False, index=True)
    last_message_at = Column(DateTime, nullable=True)
    last_message_preview = Column(String(200), nullable=False, default='')
    unread_for_admin = Column(Integer, nullable=False, default=0)
    unread_for_athlete = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    athlete = relationship('User', foreign_keys=[athlete_id], backref='support_thread')


class SupportMessage(Base):
    __tablename__ = 'support_messages'

    id = Column(Integer, primary_key=True)
    athlete_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    sender_role = Column(String(20), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    read_at = Column(DateTime, nullable=True)

    athlete = relationship('User', foreign_keys=[athlete_id])
    sender = relationship('User', foreign_keys=[sender_id])

    __table_args__ = (
        Index('idx_support_message_athlete_created', 'athlete_id', 'created_at'),
    )
