# API Contracts — FitTrack

Fuente de verdad que mapea cada función del cliente frontend (`lib/data/client.ts`, `lib/auth/auth-client.ts`) al endpoint Flask futuro. Tipos TypeScript en `lib/api/contracts/`.

**Estado backend (mayo 2026):** auth implementado; `users`, `routines`, `memberships`, `metrics` son placeholders; nutrición, sesiones y admin overview están **propuestos** (sin blueprint aún).

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
| `listMembershipPlans` | GET | `/api/memberships/plans` | admin |
| `createMembershipPlan` | POST | `/api/memberships/plans` | admin |
| `updateMembershipPlan` | PATCH | `/api/memberships/plans/:id` | admin |
| `deleteMembershipPlan` | DELETE | `/api/memberships/plans/:id` | admin |

### memberships-plans-list {#memberships-plans-list}

- **200:** `MembershipPlan[]`

### memberships-plans-create {#memberships-plans-create}

- **Body:** `Omit<MembershipPlan, 'id' | 'createdAt'>`
- **201:** plan creado

### memberships-plans-update {#memberships-plans-update}

- **Body:** parcial del plan
- **200:** plan actualizado \| **404**

### memberships-plans-delete {#memberships-plans-delete}

- **204** \| **404**

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

Tipos: `lib/api/contracts/nutrition.ts`

---

## Admin (`/api/admin`) — Implementado

| Función frontend | Método | Path | Auth mínima |
|------------------|--------|------|-------------|
| `getAdminOverview` | GET | `/api/admin/overview` | admin |

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
| `NEXT_PUBLIC_DATA_SOURCE` | `local` \| `api` | `local` | `lib/data/client.ts` |
| `NEXT_PUBLIC_API_BASE_URL` | URL Flask | `http://localhost:5000` | `lib/api/http-client.ts` |

Con `DATA_SOURCE=api`, las funciones de datos lanzan `ApiNotImplementedError` hasta que existan blueprints reales. Con `AUTH_SOURCE=api`, login/register/me usan Flask.

`getStateSnapshot()` solo disponible con `DATA_SOURCE=local` y `NODE_ENV !== 'production'`.
