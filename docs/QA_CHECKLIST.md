# Checklist maestro QA — FitTrack

> **No edites los resultados aquí por sesión.** Usa [`qa-runs/`](qa-runs/) según [`QA_GUIDE.md`](QA_GUIDE.md).

## Credenciales (dataset QA)

Contraseña común: `password123`

| Rol | Cuenta ejemplo | Notas |
|-----|----------------|-------|
| Admin | `admin@fittrack.qa` | Panel `/admin` |
| Trainer | `trainer1@fittrack.qa` … `trainer10@fittrack.qa` | 5 atletas cada uno |
| Atleta Básica | `athlete1@fittrack.qa` | Titan nutrición → 403 |
| Atleta Premium | `athlete31@fittrack.qa` | Titan nutrición → 200 |
| Atleta Pro | `athlete41@fittrack.qa` | Membresía Pro |

**Seed:** `docker compose -p fittrack exec fittrack-backend python scripts/seed_qa_dataset.py`

**Entorno:** `.env.local` desde `.env.local.api.example` · Frontend `http://localhost:3000` · Backend `http://localhost:5000`

---

## S — Smoke

| ID | Área | Pasos | Esperado | Ref. conocido |
|----|------|-------|----------|---------------|
| S1 | Health | `GET /api/health` | `{ "status": "ok" }` | |
| S2 | Frontend | Abrir `/` sin login | Carga sin error de red | |
| S3 | Login admin | `admin@fittrack.qa` | Redirige a `/admin` | |
| S4 | Consola | DevTools al cargar dashboard | Sin errores críticos | |

---

## A — Público y autenticación

| ID | Área | Pasos | Esperado | Ref. conocido |
|----|------|-------|----------|---------------|
| A1 | Home | `/` sin login | Landing; enlaces login/register | |
| A2 | Register | Registrar `athlete51@fittrack.qa` | 201; rol `user`; login OK | |
| A3 | Register API | `POST /register` con `role: admin` | Ignorado; sigue `user` | |
| A4 | Login roles | admin / trainer1 / athlete1 | `/admin`, `/trainer`, `/dashboard` | |
| A5 | Login negativo | Password incorrecta | Error visible; no entra | |
| A6 | Inactivo | `is_active=false` en BD; login | 401 | |
| A7 | Logout | Cerrar sesión | Token borrado; rutas protegidas redirigen | |
| A8 | `/auth/me` | Con/sin Bearer | 200 + user / 401 | |
| A9 | Activate | Invitar trainer; `/activate?token=` | Set password; login trainer | TEST_ADMIN_TRAINERS |
| A10 | Guards UI | Atleta en `/admin` o `/trainer` | Redirige según rol | |

---

## B — Atleta

| ID | Ruta | Pasos | Esperado | Ref. conocido |
|----|------|-------|----------|---------------|
| B1 | `/dashboard` | Login `athlete1` | KPIs cargan | |
| B2 | `/routines` | Ver rutina asignada | Rutina o empty state claro | |
| B3 | `/metrics` | Sin datos previos | Lista vacía (no auto-seed) | |
| B4 | `/metrics` | Agregar medición | Persiste tras F5 | |
| B5 | `/profile` | Guardar body profile | PATCH body-profile 200 | |
| B6 | `/metrics` | Estimar % grasa | Usa perfil; guarda | |
| B7 | `/nutrition` | Comida + agua | Persiste tras F5 | |
| B8 | `/nutrition` | Fallo API al guardar diario | Toast/error visible | **10.6** |
| B9 | `/memberships` | Atleta Básica | UI coherente con plan | |
| B10 | `/memberships` | Suscribir Premium (`athlete31`) | subscribe 200; me actualizado | |
| B11 | Titan coach | Mensaje motivacional | 200 o fallback | TEST_FASE3_TITAN |
| B12 | Titan nutrición | `athlete1` (Básica) | 403 | TEST_FASE3_TITAN |
| B13 | Titan nutrición | `athlete31` (Premium) | 200 | TEST_FASE3_TITAN |
| B14 | Menú | Link `/settings` | Ruta existe o enlace oculto | **8.5** |

---

## C — Entrenador

| ID | Ruta | Pasos | Esperado | Ref. conocido |
|----|------|-------|----------|---------------|
| C1 | `/trainer` | Login `trainer1` | 5 atletas asignados | |
| C2 | `/trainer/athletes` | Listar | Solo atletas de trainer1 | |
| C3 | `/trainer/routines` | Crear rutina | Persiste en listado | |
| C4 | `/trainer/assignments` | Asignar rutina | Persiste tras F5 | |
| C5 | `/trainer/assignments` | Completar/reactivar | Refleja `isActive` real | **10.2** |
| C6 | Plan semanal | Editar atleta con plan existente | No pisa días previos | **10.1** |
| C7 | Nutrición atleta | Publicar plan | Atleta lo ve | |
| C8 | `/trainer/progress` | Atleta con métricas en API | Muestra datos reales | **12.1** |
| C9 | `/trainer/profile` | Editar bio/especialización | Persiste tras F5 | |
| C10 | Rutinas | Botón Editar | Abre editor | **11.2** |
| C11 | IDOR | URL atleta de otro trainer | 403 o sin datos | |
| C12 | Navbar | Rutas de atleta | No visibles | |

---

## D — Admin

| ID | Ruta | Pasos | Esperado | Ref. conocido |
|----|------|-------|----------|---------------|
| D1 | `/admin` | Overview | ~50 atletas, ~10 trainers | |
| D2 | `/admin` | Tarjeta asignaciones | Métrica coherente con enlace | **10.7** |
| D3 | `/admin/athletes` | Buscar `athlete25` | Filtra correctamente | |
| D4 | `/admin/athletes` | Asignar/reasignar trainer | PUT trainer 200 | |
| D5 | `/admin/athletes` | Modal detalle | Datos visibles | **12.2** métricas |
| D6 | `/admin/trainers` | Listar | 10 trainers activos | |
| D7 | `/admin/trainers` | Invitar + reenviar | Pendiente; token anterior invalida | |
| D8 | `/admin/trainers` | Desactivar con atletas | Modal reasignación | |
| D9 | `/admin/trainers` | Reactivar inactivo | UI + API | **11.5** |
| D10 | `/admin/assignments` | Vista global | 10×5 asignaciones | |
| D11 | `/admin/routines` | Rutinas creadas por admin | Visibles en listado | **10.3** |
| D12 | `/admin/memberships` | CRUD planes | Crear/eliminar; editar si aplica | **11.4** |
| D13 | Nutrición atleta | Coach admin publica plan | Atleta lo ve | |
| D14 | Authz API | Trainer → `/api/admin/*` | 403 | |

---

## E — Seguridad y API

| ID | Prueba | Esperado | Ref. conocido |
|----|--------|----------|---------------|
| E1 | Titan sin token | 401 | |
| E2 | Token inválido | 401 | |
| E3 | JWT expirado en uso | Redirect login o error claro | **13.1** |
| E4 | IDOR rutinas | Atleta A no lee rutina de B | 403/404 |
| E5 | IDOR métricas | Trainer ajeno | 403 |
| E6 | IDOR diario | Trainer ajeno escribe | 403 |
| E7 | Rate limit auth | 10+ fallos/min | 429 |
| E8 | Change password UI | Cambio desde perfil | 200 | **11.1** |

---

## F — Regresión automatizada

| ID | Comando | Esperado |
|----|---------|----------|
| F1 | `cd backend && python -m pytest -q` | Verde |
| F2 | `pnpm lint` | Sin errores nuevos |
| F3 | `pnpm typecheck` | Sin errores |
| F4 | `pnpm test` | Vitest verde |
| F5 | `pnpm build` | Build OK |

---

## G — E2E mínimo (smoke diario)

| ID | Rol | Flujo (~5 min) |
|----|-----|----------------|
| G1 | Admin | login → overview → buscar atleta → invitar trainer |
| G2 | Trainer | login → crear rutina → asignar → nutrición |
| G3 | Atleta Básica | login → métrica → diario → Titan coach OK / nutrición 403 |
| G4 | Atleta Premium | login → Titan nutrición 200 |

---

## Referencias

- [`QA_GUIDE.md`](QA_GUIDE.md) — cómo registrar corridas
- [`QA_DIAGNOSTICO_Y_PLAN.md`](QA_DIAGNOSTICO_Y_PLAN.md) — diagnóstico + plan de corrección (FIX-01…)
- [`plan-actual.md`](plan-actual.md) — bugs conocidos Fases 10–13
- `TEST_*.md` en raíz — guías por dominio
