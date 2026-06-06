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
    exerciseId: str
    setNumber: int = Field(ge=1)
    weightKg: float | None = Field(default=None, ge=0)
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


def parse_schema(schema_cls, data: dict):
    try:
        return schema_cls.model_validate(data), None
    except Exception as exc:
        message = str(exc)
        if 'validation error' in message.lower():
            first_line = message.split('\n')[-1].strip()
            return None, first_line or 'Datos inválidos'
        return None, message or 'Datos inválidos'
