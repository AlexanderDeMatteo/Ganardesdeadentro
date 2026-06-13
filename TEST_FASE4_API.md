# Guía de Prueba — Fase 4: Dominios sin backend

Valida listados admin, autosuscripción de membresía, catálogo de ejercicios y diario nutricional en modo API.

> Plan: [docs/plan-actual.md](docs/plan-actual.md) (Fase 4) · Contratos: [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md)

---

## Requisitos previos

- Backend Flask en `http://localhost:5000` con usuarios sembrados (admin, trainer, atleta).
- Frontend Next.js en `http://localhost:3000`.
- Migración aplicada: `cd backend && alembic upgrade head` (tabla `nutrition_diaries`).

### Variables de entorno (frontend)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_AUTH_SOURCE=api
NEXT_PUBLIC_DATA_SOURCE_USERS=api
NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS=api
NEXT_PUBLIC_DATA_SOURCE_ROUTINES=api
NEXT_PUBLIC_DATA_SOURCE_NUTRITION=api
```

---

## 4.3 — Listados admin

1. Login como **admin**.
2. Visita `/admin/athletes` y `/admin/trainers`.
3. Network: `GET /api/admin/athletes` y `GET /api/admin/trainers` → **200**.

**Esperado:** tablas muestran usuarios reales de BD (emails del seed/backend), no IDs demo del store local.

**Negativo:** login trainer → `GET /api/admin/athletes` → **403**.

---

## 4.2 — Autosuscripción membresía

1. Login como atleta (plan Básica o sin plan).
2. Ve a `/memberships` y selecciona **Premium**.
3. Network: `POST /api/memberships/subscribe` con `{ planId }` → **200**.
4. `GET /api/auth/me` tras `refreshSession` → `membership.name: "Premium"`.

**Negativo:** trainer intenta `POST /api/memberships/subscribe` → **403**.

---

## 4.4 — Catálogo de ejercicios

1. Login admin o trainer con `ROUTINES=api`.
2. Ve a `/admin/routines` o `/trainer/routines` → Crear rutina.
3. Network: `GET /api/exercises/cached` (con Bearer) al abrir el builder.

**Esperado:** selector lista ejercicios del caché backend (`exercise_db_id` como id). Si caché vacío, fallback a seeds en dev.

---

## 4.1 — Diario nutrición

1. Login atleta con `NUTRITION=api`.
2. Ve a `/nutrition` → registra comida y agua.
3. Network:
   - `POST /api/nutrition/diary/entries` al loguear comida.
   - `PATCH /api/nutrition/diary/water` al registrar agua.
4. Refresca la página → datos persisten.

**Migración local:** si había datos en `localStorage` y API vacía, primer load hace `PUT /api/nutrition/diary` y limpia clave local.

**Negativo:**
- Trainer lee diario del atleta asignado → **200** (GET).
- Trainer escribe → **403**.
- Atleta ajeno → **403**.

---

## Validación automatizada

```powershell
cd backend
python -m pytest -q

cd ..
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

**Resultado esperado (jun 2026):** 78 tests backend; lint/typecheck/build frontend verdes.
