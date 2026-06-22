# API Contracts — FitTrack

Fuente de verdad que mapea cada función del cliente frontend (`lib/data/client.ts`, `lib/auth/auth-client.ts`) al endpoint Flask futuro. Tipos TypeScript en `lib/api/contracts/`.

**Estado backend (jun 2026):** blueprints implementados en `/api/auth`, `/api/users`, `/api/routines`, `/api/memberships`, `/api/metrics`, `/api/sessions`, `/api/nutrition`, `/api/admin`, `/api/exercises`, `/api/payments`, `/api/exchange-rates`, `/api/notifications`, `/api/support`. Tests: `cd backend && python -m pytest` (168 tests). CI: `.github/workflows/ci.yml`.

**Estado adaptador remoto (Fase 1):** `lib/data/client.remote.ts` cableado a Flask para overview admin, CRUD de planes, `updateAthlete`, `assignTrainerToAthlete`, métricas, rutinas, sesiones, nutrición y usuarios (ver tablas por dominio). `membershipLevelToPlanId` / `membershipNameToPlanId` usan mapeo síncrono local (sin endpoint `plan-map`). Validación manual: [TEST_FASE1_API.md](../TEST_FASE1_API.md).

**Convención IDs:** el frontend usa `string`; el ORM Flask usa `number`. El adaptador remoto debe convertir explícitamente (`String(id)` / `Number(id)`).

**Jerarquía de roles:** `admin` → `trainer` → `user` (atleta).

---

## Auth (`/api/auth`) — Implementado

| Función frontend | Método | Path | Auth | Estado |
|------------------|--------|------|------|--------|
| `getAuthClient().login` | POST | `/api/auth/login` | — | ✅ |
| `getAuthClient().register` | POST | `/api/auth/register` | — | ✅ |
| `getAuthClient().refreshSession` | GET | `/api/auth/me` | Bearer JWT | ✅ |
| `getAuthClient().logout` | POST | `/api/auth/logout` | Bearer JWT | ✅ |
| `getAuthClient().validateInviteToken` | GET | `/api/auth/invite/:token` | — | ✅ |
| `getAuthClient().acceptInvite` | POST | `/api/auth/accept-invite` | — | ✅ |

### auth-login {#auth-login}

- **Request:** `{ email: string, password: string }` — ver `LoginRequest`
- **200:** `{ access_token, user: { id, email, first_name, last_name, role } }`
- **401:** credenciales inválidas
- **Nota:** el registro **nunca** envía `role`; el backend fuerza `role='user'`.

### auth-register {#auth-register}

- **Request:** `{ email, password, first_name, last_name }` — ver `RegisterRequest`
- **201:** igual que login
- **400:** email duplicado, campos faltantes, contraseña débil

### auth-me {#auth-me}

- **200:** `{ user: AuthUserResponse }`
- **401:** token inválido o expirado

### auth-invite {#auth-invite}

- **GET `/api/auth/invite/:token`:** `{ email, firstName, expiresAt }` — rate limited
- **POST `/api/auth/accept-invite`:** `{ token, password }` → `{ message }` — activa cuenta entrenador
- **400:** enlace inválido o expirado (mensaje genérico)

Tipos: `lib/api/contracts/auth.ts`

---

## Rutinas y asignaciones (`/api/routines`) — Implementado

| Función frontend | Método | Path | Auth mínima |
|------------------|--------|------|-------------|
| `getMyRoutine` | GET | `/api/routines/my?athleteId=` | owner \| trainer \| admin |
| `getRoutineById` | GET | `/api/routines/:id` | trainer \| admin |
| `createRoutine` | POST | `/api/routines` | trainer \| admin |
| `updateRoutine` | PATCH | `/api/routines/:id` | owner trainer \| admin |
| `deleteRoutine` | DELETE | `/api/routines/:id` | trainer \| admin |
| `assignRoutine` | POST | `/api/routines/assignments` | trainer \| admin |
| `unassignRoutine` | DELETE | `/api/routines/assignments/:id` | trainer \| admin |
| `getWeeklyPlan` | GET | `/api/routines/weekly-plan?athleteId=` | owner \| trainer \| admin |
| `assignWeeklyPlan` | PUT | `/api/routines/weekly-plan` | trainer \| admin |

### routines-my {#routines-my}

- **Query:** `athleteId: string`
- **200:** `{ routine: Routine, assignment: RoutineAssignment } | null`
- **403:** atleta no asignado al solicitante
- **ORM:** `Routine`, `RoutineAssignment` ↔ `lib/data/types.ts`

Tipos: `lib/api/contracts/routines.ts`

---

## Métricas (`/api/metrics`) — Implementado

| Función frontend | Método | Path | Auth mínima |
|------------------|--------|------|-------------|
| `getAthleteMetrics` | GET | `/api/metrics?athleteId=` | owner \| trainer \| admin |
| `addMetric` | POST | `/api/metrics` | owner \| trainer \| admin |
| `updateMetric` | PATCH | `/api/metrics/:id` | owner \| trainer \| admin |
| `removeMetric` | DELETE | `/api/metrics/:id` | owner \| trainer \| admin |

### metrics-list {#metrics-list}

- **Query:** `athleteId: string`
- **200:** `Metric[]`
- **404:** atleta no encontrado

Tipos: `lib/api/contracts/metrics.ts`

---

## Membresías (`/api/memberships`) — Implementado

| Función frontend | Método | Path | Auth mínima |
|------------------|--------|------|-------------|
| `getMembership` | GET | `/api/memberships/active?athleteId=` | owner \| admin |
| `listMembershipPlans` | GET | `/api/memberships/plans` | cualquier autenticado |
| `createMembershipPlan` | POST | `/api/memberships/plans` | admin |
| `updateMembershipPlan` | PATCH | `/api/memberships/plans/:id` | admin |
| `deleteMembershipPlan` | DELETE | `/api/memberships/plans/:id` | admin |
| `subscribeMembership` | POST | `/api/memberships/subscribe` | atleta (`role=user`) |

### memberships-plans-list {#memberships-plans-list}

- **200:** `{ "plans": MembershipPlan[] }` — lectura pública para atletas (catálogo en `/memberships`); mutaciones solo admin.

### memberships-plans-create {#memberships-plans-create}

- **Body:** `Omit<MembershipPlan, 'id' | 'createdAt'>`
- **201:** plan creado

### memberships-plans-update {#memberships-plans-update}

- **Body:** parcial del plan
- **200:** plan actualizado \| **404**

### memberships-plans-delete {#memberships-plans-delete}

- **200:** `{ "message": "Plan eliminado" }` (soft-delete: `is_active=false`) \| **404**

Tipos: `lib/api/contracts/memberships.ts`

---

## Usuarios / trainers (`/api/users`) — Implementado

| Función frontend | Método | Path | Auth mínima |
|------------------|--------|------|-------------|
| `getTrainerAthletes` | GET | `/api/users/trainer-athletes?trainerId=` | trainer \| admin |
| `getAthleteById` | GET | `/api/users/athletes/:id` | trainer \| admin |
| `getTrainerById` | GET | `/api/users/trainers/:id` | cualquier autenticado |
| `updateAthlete` | PATCH | `/api/users/athletes/:id` | admin |
| `assignTrainerToAthlete` | PUT | `/api/users/athletes/:id/trainer` | admin |
| `getMyTrainer` | GET | `/api/users/my-trainer?athleteId=` | owner |
| `updateTrainerProfile` | PATCH | `/api/users/trainers/:id` | owner trainer \| admin |
| `getBodyProfile` | GET | `/api/users/me/body-profile` | atleta (`user`) |
| `updateBodyProfile` | PATCH | `/api/users/me/body-profile` | atleta (`user`) |

### users-body-profile {#users-body-profile}

- **GET 200:** `{ bodyProfile: { heightCm?, age?, sex? } }` — persiste en `user_profiles` (`initial_height`, `age`, `gender`).
- **PATCH body:** `{ heightCm?: 50–260, age?: 18–120, sex?: 'male' \| 'female' }` — al menos un campo.
- **403:** trainer o admin (solo el atleta autenticado).
- Tipos: `lib/api/contracts/body-profile.ts`

---

## Sesiones / progreso (`/api/sessions`) — Implementado

| Función frontend | Método | Path | Auth mínima |
|------------------|--------|------|-------------|
| `markSessionComplete` | POST | `/api/sessions/complete` | owner |
| `getAthleteSessionLogs` | GET | `/api/sessions?athleteId=` | owner \| trainer \| admin |
| `getSessionLogsForWeek` | GET | `/api/sessions/week?athleteId=&weekStart=` | owner \| trainer \| admin |
| `getExerciseProgress` | GET | `/api/sessions/progress?athleteId=&exerciseId=` | owner \| trainer \| admin |

Alineado con modelos de sesión en `backend/app/models.py` (extensión futura).

---

## Nutrición (`/api/nutrition`) — Implementado

| Función frontend | Método | Path | Auth mínima |
|------------------|--------|------|-------------|
| `getMealPlan` | GET | `/api/nutrition/plan?athleteId=` | owner \| trainer \| admin |
| `publishMealPlan` | PUT | `/api/nutrition/plan` | trainer \| admin |
| `getCoachNutritionDraft` | GET | `/api/nutrition/coach-draft?athleteId=` | trainer \| admin |
| `saveCoachNutritionDraft` | PUT | `/api/nutrition/coach-draft` | trainer \| admin |
| `getDiary` | GET | `/api/nutrition/diary?athleteId=&date=` | owner \| trainer \| admin |
| `putDiary` | PUT | `/api/nutrition/diary` | owner \| admin |
| `addDiaryEntry` | POST | `/api/nutrition/diary/entries` | owner \| admin |
| `deleteDiaryEntry` | DELETE | `/api/nutrition/diary/entries/:entryId?athleteId=&date=` | owner \| admin |
| `patchDiaryWater` | PATCH | `/api/nutrition/diary/water` | owner \| admin |

### nutrition-plan-get {#nutrition-plan-get}

- **200:** `AssignedNutritionPlan | null`

### nutrition-publish {#nutrition-publish}

- **Body:** `AssignedNutritionPlan`
- **200:** plan publicado

### nutrition-coach-draft {#nutrition-coach-draft}

- **200:** `CoachNutritionDraft`

### nutrition-coach-draft-save {#nutrition-coach-draft-save}

- **Body:** `{ athleteId, draft: CoachNutritionDraft }`
- **200:** borrador guardado

Tipos: `lib/api/contracts/nutrition.ts`, `lib/api/contracts/nutrition-diary.ts`

---

## Ejercicios (`/api/exercises`) — Catálogo híbrido + custom

| Función frontend | Método | Path | Auth mínima |
|------------------|--------|------|-------------|
| `listExercises` / `listExercisesPaginated` | GET | `/api/exercises/cached?muscle=&page=&per_page=&custom_only=&source=&q=` | autenticado |
| `listExercisesByMuscle` | GET | `/api/exercises/by-muscle/:muscle?limit=` | pública |
| `searchExercises` | GET | `/api/exercises/search?q=` | autenticado |
| `getExerciseById` | GET | `/api/exercises/:exerciseId` | pública |
| `listExerciseMuscles` | GET | `/api/exercises/muscles?source=` | pública |
| `syncExerciseCatalog` | POST | `/api/exercises/sync-catalog` | admin |
| `createExercise` | POST | `/api/exercises` | admin, trainer |
| `updateExercise` | PATCH | `/api/exercises/:exerciseId` | admin (cualquier custom), trainer (solo propios) |
| `deleteExercise` | DELETE | `/api/exercises/:exerciseId` | admin (cualquier custom), trainer (solo propios) |
| `matchExerciseAnimation` | POST | `/api/exercises/:exerciseId/match-animation` | admin, trainer (solo propios) |
| `uploadExerciseMedia` | POST | `/api/exercises/:exerciseId/media` (multipart `file`) | admin, trainer (solo propios) |
| — | GET | `/api/exercises/media/:filename` | pública |

Query `source`: `all` (default), `catalog` (solo `is_cached`), `custom` (solo `is_custom`). Trainers que listan `custom` solo ven ejercicios con `created_by_id` propio.

`GET /api/exercises/muscles?source=catalog` devuelve músculos distintos (`target_muscle`) con al menos un ejercicio de catálogo en caché local. `source=api` (default) lista todos los músculos publicados por ExerciseDB OSS (`/api/v1/muscles`). La UI del catálogo debe usar `source=catalog` para no mostrar grupos vacíos.

El adaptador mapea `exercise_db_id` → `Exercise.id` para rutinas. Respuestas incluyen `animation_url`, `animation_type`, `animation_source`, `is_custom`, `created_by_id`.

`POST /api/exercises` crea ejercicio custom (`exercise_db_id` con prefijo `custom-`) e intenta match automático en ExerciseDB. Si no hay GIF, se puede subir media manualmente.

`POST /api/exercises/sync-catalog` recorre músculos de [ExerciseDB V1 OSS](https://oss.exercisedb.dev) (`https://oss.exercisedb.dev/api/v1/...`) y persiste ejercicios con `gifUrl` en caché local. No requiere API key por defecto.

---

## Admin (`/api/admin`) — Implementado

| Función frontend | Método | Path | Auth mínima |
|------------------|--------|------|-------------|
| `getAdminOverview` | GET | `/api/admin/overview` | admin |
| `listAdminAthletes` | GET | `/api/admin/athletes` | admin |
| `listAdminTrainers` | GET | `/api/admin/trainers?includeInactive=` | admin |
| `createAdminTrainer` | POST | `/api/admin/trainers` | admin |
| `deactivateAdminTrainer` | DELETE | `/api/admin/trainers/:id` | admin |
| `resendTrainerInvite` | POST | `/api/admin/trainers/:id/resend-invite` | admin |
| `assignTrainerToAthlete` | PUT | `/api/users/athletes/:id/trainer` | admin |
| `unassignTrainerFromAthlete` | PUT | `/api/users/athletes/:id/trainer` (`trainerId: null`) | admin |

### admin-trainers {#admin-trainers}

- **POST body:** `{ email, firstName, lastName, specialization? }` — crea entrenador inactivo + envía invitación (Resend)
- **DELETE body:** `{ athleteActions: [{ athleteId, action: 'reassign'|'unassign', newTrainerId? }] }` — soft delete (`is_active=false`)
- **Listado:** por defecto activos + pendientes de activación; `includeInactive=true` incluye desactivados

Tipos: `lib/api/contracts/admin.ts`

---

## Health

| Función | Método | Path | Auth |
|---------|--------|------|------|
| `checkApiHealth` | GET | `/api/health` | — |

**200:** `{ "status": "ok" }`

---

## Códigos de error comunes

| Código | Significado |
|--------|-------------|
| 400 | Validación / campos faltantes |
| 401 | No autenticado |
| 403 | Rol insuficiente |
| 404 | Recurso no encontrado |
| 422 | Entidad no procesable |
| 501 | Endpoint no disponible (adaptador remoto frontend stub) |

Cuerpo típico: `{ "error": "mensaje" }` — ver `ApiErrorBody` en `lib/api/contracts/common.ts`.

---

## Adaptadores frontend

| Variable | Valores | Default | Módulo |
|----------|---------|---------|--------|
| `NEXT_PUBLIC_AUTH_SOURCE` | `local` \| `api` | `local` | `lib/auth/auth-client.ts` |
| `NEXT_PUBLIC_DATA_SOURCE` | `local` \| `api` | `local` | `lib/data/client.ts` (global; p. ej. `getAdminOverview`) |
| `NEXT_PUBLIC_DATA_SOURCE_*` | `local` \| `api` | hereda `DATA_SOURCE` | Overrides por dominio: `METRICS`, `ROUTINES`, `USERS`, `NUTRITION`, `MEMBERSHIPS` |
| `NEXT_PUBLIC_API_BASE_URL` | URL Flask | `http://localhost:5000` | `lib/api/http-client.ts` |

Con `DATA_SOURCE=api` (y overrides en `api`), el facade en `lib/data/client.ts` resuelve contra `client.remote.ts`, que llama a Flask vía `httpRequest` + Bearer. **Fase 4:** listados admin, `subscribeMembership`, catálogo de ejercicios y diario nutricional cableados en el remoto. El modo **local** (default) sigue usando seeds/`localStorage` donde aplique.

`getStateSnapshot()` solo disponible con `DATA_SOURCE=local` y `NODE_ENV !== 'production'`.
