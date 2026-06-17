from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.validation import ACTIVITY_LEVELS, NUTRITION_GOALS, SESSION_OUTCOMES, SET_RESULTS


class MacroTargetsSchema(BaseModel):
    model_config = ConfigDict(extra='allow')

    calories: int | None = Field(default=None, ge=0)
    proteinG: float | None = Field(default=None, ge=0)
    carbsG: float | None = Field(default=None, ge=0)
    fatG: float | None = Field(default=None, ge=0)


class PublishPlanSchema(BaseModel):
    athleteId: int
    macroTargets: MacroTargetsSchema | dict = Field(default_factory=dict)
    mealPlan: dict = Field(default_factory=dict)
    slotTimes: dict = Field(default_factory=dict)
    activityLevel: str = 'moderate'
    goal: str = 'maintain'
    calorieAdjustment: int = 0
    publishedBy: str = 'coach'

    @field_validator('activityLevel')
    @classmethod
    def validate_activity_level(cls, value: str) -> str:
        if value not in ACTIVITY_LEVELS:
            raise ValueError('activityLevel inválido')
        return value

    @field_validator('goal')
    @classmethod
    def validate_goal(cls, value: str) -> str:
        if value not in NUTRITION_GOALS:
            raise ValueError('goal inválido')
        return value


class CoachDraftSchema(BaseModel):
    model_config = ConfigDict(extra='allow')

    activityLevel: str = 'moderate'
    goal: str = 'maintain'
    calorieAdjustment: int = 0
    macroTargets: dict | None = None
    mealPlans: list = Field(default_factory=list)
    activeMealPlanId: str | None = None
    slotTimes: dict = Field(default_factory=dict)
    updatedAt: str | None = None

    @field_validator('activityLevel')
    @classmethod
    def validate_activity_level(cls, value: str) -> str:
        if value not in ACTIVITY_LEVELS:
            raise ValueError('activityLevel inválido')
        return value

    @field_validator('goal')
    @classmethod
    def validate_goal(cls, value: str) -> str:
        if value not in NUTRITION_GOALS:
            raise ValueError('goal inválido')
        return value


class WeeklyPlanDaySchema(BaseModel):
    dayIndex: int = Field(ge=0, le=6)
    label: str = ''
    routineId: int | str | None = None
    focus: str = ''


class WeeklyPlanSchema(BaseModel):
    athleteId: int
    weekStartDate: str
    days: list[WeeklyPlanDaySchema] = Field(default_factory=list)

    @field_validator('weekStartDate')
    @classmethod
    def validate_week_start(cls, value: str) -> str:
        from datetime import datetime

        if not value or len(value) != 10:
            raise ValueError('weekStartDate inválida')
        try:
            datetime.strptime(value, '%Y-%m-%d')
        except ValueError as exc:
            raise ValueError('weekStartDate inválida') from exc
        return value


class SetLogSchema(BaseModel):
    model_config = ConfigDict(extra='ignore')

    exerciseId: str
    exerciseName: str = ''
    setNumber: int = Field(ge=1)
    repsTarget: str = ''
    repsLogged: str | None = None
    weightKg: float | None = Field(default=None, ge=0)
    suggestedWeightKg: float | None = Field(default=None, ge=0)
    result: str = 'completed'

    @field_validator('result')
    @classmethod
    def validate_result(cls, value: str) -> str:
        if value not in SET_RESULTS:
            raise ValueError('result inválido en setLogs')
        return value


class CompleteSessionSchema(BaseModel):
    athleteId: int | None = None
    routineId: int
    assignmentId: int | None = None
    weekPlanId: int | None = None
    scheduledDate: str | None = None
    date: str | None = None
    setLogs: list[SetLogSchema] = Field(default_factory=list)
    completed: bool = True
    completedSets: int = Field(default=0, ge=0)
    failedSets: int = Field(default=0, ge=0)
    totalSets: int | None = Field(default=None, ge=0)
    sessionOutcome: str = 'completed'

    @field_validator('sessionOutcome')
    @classmethod
    def validate_outcome(cls, value: str) -> str:
        if value not in SESSION_OUTCOMES:
            raise ValueError('sessionOutcome inválido')
        return value

    @field_validator('scheduledDate')
    @classmethod
    def validate_scheduled_date(cls, value: str | None) -> str | None:
        if value is None:
            return value
        from datetime import datetime

        try:
            datetime.strptime(value, '%Y-%m-%d')
        except ValueError as exc:
            raise ValueError('scheduledDate inválida') from exc
        return value


class MealItemSchema(BaseModel):
    model_config = ConfigDict(extra='forbid')

    id: str | None = None
    name: str = Field(min_length=1, max_length=120)
    calories: int | None = Field(default=None, ge=0, le=10000)
    proteinG: float | None = Field(default=None, ge=0, le=10000)
    carbsG: float | None = Field(default=None, ge=0, le=10000)
    fatG: float | None = Field(default=None, ge=0, le=10000)
    quantityG: float | None = Field(default=None, ge=0, le=10000)
    scheduledTime: str | None = Field(default=None, max_length=20)
    notes: str | None = Field(default=None, max_length=220)


class FoodLogEntrySchema(BaseModel):
    date: str = Field(min_length=8, max_length=30)
    items: list[MealItemSchema] = Field(default_factory=list, max_length=200)


class DiaryPutSchema(BaseModel):
    athleteId: int
    foodLog: list[FoodLogEntrySchema] = Field(default_factory=list)
    waterByDate: dict[str, int] = Field(default_factory=dict)
    waterGoalMl: int = Field(default=2500, ge=0, le=20000)


class DiaryEntryPostSchema(BaseModel):
    athleteId: int
    date: str = Field(min_length=8, max_length=30)
    item: MealItemSchema


class DiaryWaterPatchSchema(BaseModel):
    athleteId: int
    date: str = Field(min_length=8, max_length=30)
    ml: int | None = Field(default=None, ge=0, le=20000)
    mlDelta: int | None = Field(default=None, ge=-20000, le=20000)
    goalMl: int | None = Field(default=None, ge=0, le=20000)


class BodyProfilePatchSchema(BaseModel):
    heightCm: float | None = Field(default=None, ge=50, le=260)
    age: int | None = Field(default=None, ge=18, le=120)
    sex: str | None = None

    @field_validator('sex')
    @classmethod
    def validate_sex(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if value not in ('male', 'female'):
            raise ValueError('sex debe ser male o female')
        return value


class CreateTrainerInviteSchema(BaseModel):
    email: str = Field(min_length=3, max_length=120)
    firstName: str = Field(min_length=1, max_length=120)
    lastName: str = Field(min_length=1, max_length=120)
    specialization: str | None = Field(default=None, max_length=160)


class AthleteTrainerActionSchema(BaseModel):
    athleteId: int
    action: str
    newTrainerId: int | None = None

    @field_validator('action')
    @classmethod
    def validate_action(cls, value: str) -> str:
        if value not in ('reassign', 'unassign'):
            raise ValueError('action debe ser reassign o unassign')
        return value


class DeactivateTrainerSchema(BaseModel):
    athleteActions: list[AthleteTrainerActionSchema] = Field(default_factory=list)


class UpdateMeProfileSchema(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)


class ReactivateTrainerSchema(BaseModel):
    isActive: bool | None = None
    maxAthletes: int | None = Field(default=None, ge=1, le=100)

    @field_validator('isActive')
    @classmethod
    def validate_is_active(cls, value: bool | None) -> bool | None:
        if value is not None and value is not True:
            raise ValueError('isActive debe ser true para reactivar')
        return value


class AcceptInviteSchema(BaseModel):
    token: str = Field(min_length=10)
    password: str = Field(min_length=8, max_length=128)


class CreateCustomExerciseSchema(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    target_muscle: str = Field(min_length=2, max_length=120)
    equipment: str = Field(default='body weight', max_length=120)
    difficulty: str = Field(default='beginner')
    description: str | None = Field(default=None, max_length=2000)

    @field_validator('name', 'target_muscle', 'equipment')
    @classmethod
    def strip_required(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError('Campo requerido')
        return cleaned

    @field_validator('difficulty')
    @classmethod
    def validate_difficulty(cls, value: str) -> str:
        normalized = value.lower().strip()
        if normalized not in {'beginner', 'intermediate', 'expert'}:
            raise ValueError('difficulty debe ser beginner, intermediate o expert')
        return normalized


class UpdateCustomExerciseSchema(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    target_muscle: str | None = Field(default=None, min_length=2, max_length=120)
    equipment: str | None = Field(default=None, max_length=120)
    difficulty: str | None = None
    description: str | None = Field(default=None, max_length=2000)

    @field_validator('name', 'target_muscle', 'equipment')
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError('No puede estar vacío')
        return cleaned

    @field_validator('difficulty')
    @classmethod
    def validate_difficulty(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.lower().strip()
        if normalized not in {'beginner', 'intermediate', 'expert'}:
            raise ValueError('difficulty debe ser beginner, intermediate o expert')
        return normalized


def parse_schema(schema_cls, data: dict):
    try:
        return schema_cls.model_validate(data), None
    except Exception as exc:
        from pydantic import ValidationError

        if isinstance(exc, ValidationError):
            for error in exc.errors():
                if error.get('type') == 'value_error':
                    ctx = error.get('ctx') or {}
                    if 'error' in ctx:
                        return None, str(ctx['error'])
                msg = error.get('msg', '')
                if msg and 'pydantic.dev' not in msg and 'value_error' not in msg:
                    return None, msg
            return None, 'Datos inválidos'
        message = str(exc)
        if 'pydantic.dev' in message:
            return None, 'Datos inválidos'
        return None, message or 'Datos inválidos'
