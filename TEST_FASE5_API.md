# Guía de Prueba — Fase 5: Migración `local` → `api`

Valida activación completa del modo API, hooks sin seeds/mocks, y persistencia de body profile en backend.

> Plan: [docs/plan-actual.md](docs/plan-actual.md) (Fase 5) · Plantilla env: [.env.local.api.example](.env.local.api.example)

---

## Requisitos previos

- Backend Flask en `http://localhost:5000` con usuarios sembrados.
- Migraciones: `cd backend && alembic upgrade head`
- Frontend Next.js en `http://localhost:3000`.

### Variables de entorno (modo API completo)

Copia `.env.local.api.example` → `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_AUTH_SOURCE=api
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_DATA_SOURCE_METRICS=api
NEXT_PUBLIC_DATA_SOURCE_ROUTINES=api
NEXT_PUBLIC_DATA_SOURCE_USERS=api
NEXT_PUBLIC_DATA_SOURCE_NUTRITION=api
NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS=api
```

### Arranque

```powershell
cd backend; python run.py
# otra terminal
pnpm dev
```

Alternativa Docker (piloto con `DATA_SOURCE=api`):

```powershell
docker compose -p fittrack up --build
```

---

## Checkpoint A — METRICS

1. Login como **atleta**.
2. Visita `/metrics` sin entradas previas.
3. **Esperado:** lista vacía; no se crean 3 métricas demo automáticamente.
4. Añade una métrica manual → `POST /api/metrics` → **201**.
5. Card "Volumen total" y "Personal records" muestran `—` o empty state si no hay sesiones.

---

## Checkpoint B — ROUTINES

1. Login como **trainer**.
2. Crea rutina en `/trainer/routines` → `POST /api/routines` → **201**.
3. Asigna a atleta en `/trainer/assignments` → `POST /api/routines/assignments` → **201**.
4. Login como **atleta** → `/routines` muestra la rutina asignada.
5. Login como **admin** → `/admin/routines` lista rutinas agregadas de todos los trainers.
6. Dashboard admin: `routineCount` coherente con listado.

**Toggle asignación (API):** desactivar asignación llama `DELETE /api/routines/assignments/:id`.

---

## Checkpoint C — USERS

1. Login como **admin** → `/admin/athletes`.
2. Asigna entrenador a un atleta → `PUT /api/users/athletes/:id/trainer` → **200**.
3. Sin recargar página: `/admin/assignments` refleja el cambio.
4. `GET /api/admin/overview` devuelve conteos reales (no del store local).

**Negativo:** atleta con `AUTH_SOURCE=api` usa `user.id` como `athleteId` (no mapa email demo).

---

## Checkpoint D — NUTRITION

1. Login como **trainer** → nutrición de un atleta asignado.
2. Publica plan → `PUT /api/nutrition/plan` → **200**.
3. Login como **atleta** → plan visible; diary persiste vía `/api/nutrition/diary/*`.

---

## Checkpoint E — MEMBERSHIPS

1. Login como **atleta** → `/memberships` → subscribe Premium.
2. `POST /api/memberships/subscribe` → **200**; sesión actualizada (`refreshSession`).
3. Login como **admin** → CRUD planes en `/admin/memberships`.

---

## Checkpoint F — Body profile (5.5)

1. Login como **atleta** → `/profile`.
2. Guarda altura, edad y sexo → `PATCH /api/users/me/body-profile` → **200**.
3. Recarga página → datos persisten (`GET /api/users/me/body-profile`).
4. En `/metrics`, estimación de grasa corporal usa perfil guardado.

**Negativo:** trainer o admin en `PATCH /api/users/me/body-profile` → **403**.

---

## Flujo E2E por rol

| Rol | Flujo mínimo |
|-----|----------------|
| Atleta | login → métricas → rutina → nutrición → perfil corporal |
| Trainer | login → crear rutina → asignar → publicar plan nutrición |
| Admin | login → overview → listas → asignar trainer → ver rutinas globales |

---

## Validación automatizada

```powershell
cd backend; python -m pytest -q
pnpm lint; pnpm typecheck; pnpm test; pnpm build
```
