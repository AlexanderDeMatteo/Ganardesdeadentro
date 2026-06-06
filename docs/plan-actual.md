# Plan Actual — FitTrack

> Documento de ejecución. Estado real del repo tras auditoría archivo por archivo
> (backend Flask, capa IA Titan, frontend, tests, Docker, seguridad).
> Complementa y CORRIGE `docs/PROJECT_CONTEXT.md`, `docs/API_CONTRACTS.md` y `docs/planOpus.md`,
> que están parcialmente desfasados.

## Leyenda de prioridad
- 🔴 Crítico (seguridad / bloquea producción)
- 🟠 Alto (impacto funcional grande)
- 🟡 Medio (calidad / deuda)
- 🟢 Bajo (limpieza)

---

## Diagnóstico de partida

- **Backend:** ~completo. 49 endpoints + `/api/health`, 10 blueprints, sin placeholders vacíos. 61 tests (Fase 2 añadió `test_authz.py`).
- **Frontend:** funcional; por defecto en `local` (seeds + `localStorage`). Adaptador remoto cableado en **Fase 1** (overview admin, CRUD planes, usuarios admin); resto de dominios según flags `NEXT_PUBLIC_DATA_SOURCE_*`.
- **Seguridad:** backend endurecido en **Fase 2** (ownership rutinas, revalidación JWT vs BD, membresías reales, rate limiting, validación Pydantic, sin leakage). Pendiente: capa IA "Titan" (Fase 3).
- **Docs:** alineadas tras Fase 1 y Fase 2 (`API_CONTRACTS.md`, `PROJECT_CONTEXT.md` §5); ver Fase 0 pendiente (0.3/0.4 parciales).

---

## Fase 0 — Saneamiento base 🔴🟢

Objetivo: dejar el repo limpio y la documentación veraz antes de tocar funcionalidad.

- [ ] **0.1** 🔴 Endurecer `.gitignore`: añadir `.env` (raíz) y `backend/fitness_platform.db`.
      Hoy `.gitignore` solo ignora `.env*.local`; el git status muestra `.env` y la `.db` como untracked (riesgo de commit de secretos / DB local).
- [ ] **0.2** 🔴 Verificar que `.env` raíz y `backend/.env` NO estén ya trackeados; si lo están, `git rm --cached`.
- [ ] **0.3** 🟢 Resolver duplicado Windows `backend/Dockerfile` vs `backend\Dockerfile` y `docker-entrypoint.sh` (artefacto de barra invertida en git status).
- [ ] **0.4** 🟡 Actualizar `docs/PROJECT_CONTEXT.md` — **parcial (jun 2026):** typecheck, register, adaptadores, Titan, §11; pendiente revisión completa de §5.
- [x] **0.5** 🟡 Actualizar `docs/API_CONTRACTS.md` — **hecho (jun 2026):** estado backend, auth de `GET /plans`, adaptadores sin `ApiNotImplementedError` global.
- [x] **0.6** 🟢 Marcar `docs/planOpus.md` como histórico/parcial.

**Validación:** `git status` limpio de secretos; revisión visual de docs.

---

## Fase 1 — Cableado frontend ↔ backend 🟠 ✅ (culminada jun 2026)

Objetivo: conectar el adaptador remoto a endpoints que YA existen en Flask.
Archivo principal: `lib/data/client.remote.ts`. Facade: `lib/data/client.ts`.
Validación manual: [TEST_FASE1_API.md](../TEST_FASE1_API.md).

- [x] **1.1** Implementar `getAdminOverview` → `GET /api/admin/overview`.
- [x] **1.2** Implementar `updateAthlete` → `PATCH /api/users/athletes/:id` (`Promise<Athlete | null>`).
- [x] **1.3** Implementar `assignTrainerToAthlete` → `PUT /api/users/athletes/:id/trainer`.
- [x] **1.4** Implementar CRUD planes → `/api/memberships/plans` GET/POST/PATCH/DELETE.
- [x] **1.5** `membershipLevelToPlanId` / `membershipNameToPlanId`: switch síncrono (Opción A).
- [x] **1.6** Facade: planes → `membershipsClient`; `updateAthlete`/`assignTrainerToAthlete`/`getTrainerAthletes` → `usersClient`.
- [x] **1.7** Dashboard admin consume `overview`; asignación de entrenador con `await` + toast + `refreshOverview`.
- [x] **Extra:** `GET /api/memberships/plans` relajado a cualquier autenticado (catálogo atleta).

**Validación:** pytest 46 passed; lint + typecheck OK; guía manual `TEST_FASE1_API.md`.

---

## Fase 2 — Endurecimiento de seguridad backend 🔴 ✅ (culminada jun 2026)

Objetivo: cerrar brechas de autorización antes de exponer modo `api`.
Helpers nuevos: `backend/app/utils/authorization.py` (ownership + revalidación BD).
Validación/esquemas: `backend/app/schemas/request_schemas.py` (Pydantic v2).
Rate limiting: `backend/app/extensions.py` (Flask-Limiter). Tests: `backend/tests/test_authz.py`.

- [x] **2.1** 🔴 Ownership en rutinas: `can_manage_routine`/`can_read_routine`/`require_routine_*`/`require_assignment_manage` aplicados en GET/PATCH/DELETE `/:id`, `DELETE /assignments/:id`, `POST /assignments` (assign de rutina ajena) y validación de `routineId` en weekly-plan.
- [x] **2.2** 🔴 Revalidar usuario en BD (rol + `is_active`): `@jwt.user_lookup_loader` en `__init__.py`, `role_required` lee rol real de BD vía `get_verified_user()`, y `/api/auth/me` rechaza cuenta desactivada (401).
- [x] **2.3** 🟠 Membresía completa: `assign_membership` / `assign_membership_by_level` / `revoke_membership` en `membership_service.py`; `membershipLevel` PATCH conectado en `user_service.py`; endpoint admin `PUT /api/memberships/users/:id`.
- [x] **2.4** 🟠 Sin filtrado de `str(e)`: genérico + logging servidor en `exercises.py`, `exercise_api_service.py` y `routine_service.create_routine`.
- [x] **2.5** 🟡 Validación de esquema (Pydantic): nutrición (`macroTargets`/`mealPlan`/`slotTimes`/`goal`/`activityLevel`), weekly-plan (`days[].dayIndex/routineId`, `weekStartDate`), `setLogs` de sesiones; `complete_session` valida que la rutina exista y esté asignada al atleta.
- [x] **2.6** 🟡 Rate limiting (Flask-Limiter) en `login` / `register` / `change-password`; storage configurable (`RATELIMIT_STORAGE_URI`, `memory://` dev / Redis prod).
- [x] **2.7** 🟡 Validación de email (formato + unicidad en PATCH), `publish_plan` valida que el atleta exista y tenga rol `user`, y `clear-cache` migrado a `@role_required('admin')`.
- [x] **2.8** 🟢 Nullable endurecido en `models.py`: `User.is_active`/`Routine.is_active` `nullable=False`; CHECK `ck_routine_owner_present` (admin_id o trainer_id presente). Migración `003_security_nullable_constraints.py`.
- [x] **2.9** 🟡 `ProductionConfig` fuerza `JWT_COOKIE_SECURE=True`; `validate_critical_config` aborta en prod si es false; documentado en `backend/.env.example`.

**Validación:** `cd backend && python -m pytest -q` → **61 passed**. Casos negativos: trainer ajeno → 403, usuario inactivo → 401, `publish_plan` a atleta inexistente → 404 / no-atleta → 400, email inválido/duplicado → 400, rate limit → 429, sin leakage de `str(e)`.

**Pendientes de infra (no bloquean Fase 2):** aplicar `alembic upgrade head` en Postgres y storage Redis para rate limit → Fase 7. Fijar versiones exactas en `requirements.txt` (hoy `pydantic>=2.10.3`, `Flask-Limiter==3.8.0`) al definir intérprete de prod.

---

## Fase 3 — Seguridad capa IA "Titan" 🔴

Objetivo: que las rutas Next IA no sean un agujero de autenticación/abuso.
Archivos: `app/api/coach/titan/route.ts`, `app/api/coach/session-review/route.ts`, `app/api/nutrition/titan/route.ts`, `lib/api/titan-route-guard.ts`.

- [ ] **3.1** 🔴 Verificar JWT real en servidor Next. Hoy `requireSession` (`titan-route-guard.ts:69–84`) en modo `api` acepta CUALQUIER `Bearer` no vacío. Opciones: validar firma con secret compartido o introspección contra Flask `/api/auth/me`.
- [ ] **3.2** 🔴 Quitar `membershipTier`/`userRole` del body (spoofeable). `requireTitanNutritionAccess` (L95–111) confía en JSON enviado por el cliente (`lib/api/titan-client-headers.ts:22–34`). Derivar de claims verificados.
- [ ] **3.3** 🔴 Sincronizar `membership` en `auth-client.remote.ts` (L86–100) desde `/api/auth/me`. Hoy NO se carga → en modo API el gating Premium/Pro queda roto (siempre false salvo parchear localStorage).
- [ ] **3.4** 🟠 Gating de rol también en motivación y session-review (hoy `hasTitanMotivationAccess` = solo autenticado).
- [ ] **3.5** 🟡 Rate limiting persistente (Redis) por `userId`, no solo IP en memoria (hoy `Map` por proceso, IP falsificable vía `x-forwarded-for`).
- [ ] **3.6** 🟡 Evaluar `middleware.ts` para barrera edge en `/api/*` y rutas sensibles (no existe hoy).
- [ ] **3.7** 🟢 Considerar fallback servidor cuando Ollama cae (hoy solo cliente tiene fallbacks en `coach-context.tsx`).

**Validación:** tests de rutas Titan — 401 sin token, 403 tier básico, 429 rate limit, 503 Ollama caído.

---

## Fase 4 — Completar dominios sin backend 🟠

Objetivo: eliminar la persistencia exclusiva en `localStorage` donde haga falta.

- [ ] **4.1** 🟠 Diario de nutrición / hidratación / adherencia (hoy 100% `localStorage`, `lib/nutrition/diary-storage.ts`, `adherence.ts`). Crear endpoints:
      ```
      GET/PUT  /api/nutrition/diary?athleteId=&date=
      POST     /api/nutrition/diary/entries
      DELETE   /api/nutrition/diary/entries/:id
      PATCH    /api/nutrition/diary/water
      ```
      Refactor `use-nutrition.ts` (L114–120) para usar API en lugar de `saveDiaryState`.
- [ ] **4.2** 🟠 Compra/suscripción de membresía: `app/memberships/page-client.tsx:39–40` escribe directo a `localStorage.user`. Crear endpoint de suscripción y enriquecer `/api/auth/me` con membership.
- [ ] **4.3** 🟠 Listados admin: no hay `GET /api/admin/athletes` ni `GET /api/admin/trainers`. El panel admin lee `state.athletes`/`state.trainers` del store (seeds). Crear endpoints + refactor hooks.
- [ ] **4.4** 🟡 Catálogo de ejercicios: `/api/exercises/*` no está conectado al frontend de rutinas (siempre usa `state.exercises` de seeds).

**Validación:** persistencia real cross-device del diario; admin ve datos reales; rutinas usan catálogo backend.

---

## Fase 5 — Migración modo `local` → `api` 🟠

Objetivo: activar dominios progresivamente y retirar mocks.
Archivo de flags: `lib/api/config.ts`. Defaults: `.env.local.example` (todo `local`).

- [ ] **5.1** Activar dominio por dominio (`METRICS` → `ROUTINES` → `USERS` → `NUTRITION` → `MEMBERSHIPS`), validando cada uno.
- [ ] **5.2** Refactor hooks que leen seeds/store directo: `use-admin.ts`, `use-trainer.ts`, `use-coach-nutrition.ts`, `lib/nutrition/resolve-athlete-id.ts`.
- [ ] **5.3** Eliminar inyección de datos demo: seed automático de métricas (`use-metrics.ts:70–127`), `MOCK_VOLUME_SPARK`/`MOCK_PRS` en `metrics-option-one-design-replica.tsx`.
- [ ] **5.4** Quitar re-exports `MOCK_*` legacy (`use-admin.ts:20–25`, `use-trainer.ts:25`).
- [ ] **5.5** `use-body-profile.ts`: hoy solo `localStorage`; decidir si se persiste en backend.

**Validación:** flujo completo en modo `api` por rol (atleta, trainer, admin); coherencia jerárquica (asignar rutina/plan se refleja en el atleta).

---

## Fase 6 — Tests y calidad 🟠

- [ ] **6.1** 🟠 Frontend: NO hay tests automatizados ni script `test`. Montar Vitest + Testing Library (o Playwright para e2e).
- [ ] **6.2** 🟠 Backend — cubrir huecos:
      - `exercises` (0% cobertura, dominio completo sin tests).
      - `sessions` GET (`/`, `/week`, `/progress`), `memberships` CRUD (GET/PATCH/DELETE), `/api/auth/logout`, `/api/health`.
      - Autorización negativa en nutrition y rutinas (ownership).
- [ ] **6.3** 🟡 Eliminar duplicación de fixtures: `test_auth.py:14–28` redefine `app`/`client` ya presentes en `conftest.py`.
- [ ] **6.4** 🟡 CI: no existe `.github/workflows/`. Añadir pipeline (lint + typecheck + pytest + build).
- [ ] **6.5** 🟢 Crear guías manuales faltantes o actualizar las desfasadas (`TEST_*.md` asumen mock; añadir `TEST_DOCKER.md` / `TEST_AUTH_API.md`).

**Validación:** `pytest` verde con cobertura ampliada; suite frontend mínima corriendo en CI.

---

## Fase 7 — Docker / infraestructura / producción 🟡

- [ ] **7.1** 🟡 Añadir `healthcheck` a ambos servicios en `docker-compose.yml` y `depends_on: condition: service_healthy`.
- [ ] **7.2** 🟡 Decidir cómo se expone Ollama (no está en compose; Titan lo necesita vía `OLLAMA_BASE_URL`). Documentar Ollama externo o añadir servicio.
- [ ] **7.3** 🟠 Build de producción: `Dockerfile.frontend` usa `next dev`; `backend/Dockerfile` arranca `python run.py` en vez de `gunicorn` (ya está en `requirements.txt`). Crear targets de prod (multi-stage `next build`+`next start`, gunicorn).
- [ ] **7.4** 🟡 Unificar migraciones: hoy conviven `alembic upgrade head` (entrypoint) + `create_all()`/`_sync_missing_columns` en `init_db()`. Riesgo de divergencia en Postgres. Crear migración explícita para tablas post-001 (`weekly_plans`, `workout_sessions`, `nutrition_plans`, `coach_nutrition_drafts`) y retirar `create_all` en prod.
- [ ] **7.5** 🟢 Actualizar `init_db.py` standalone (desactualizado, no importa modelos nuevos).
- [ ] **7.6** 🟢 Definir `restart` policies y red explícita.

**Validación:** `docker compose -p fittrack up --build` con healthchecks verdes; arranque limpio de migraciones.

---

## Fase 8 — Limpieza y deuda menor 🟢

- [ ] **8.1** Eliminar `app/dashboard-2/*` y `app/dashboard-3/*` (redirigen a `/dashboard`): `page-client.tsx` con `mockRoutines`/`mockStats`, layouts, y CSS huérfano en `globals.css:216–261`.
- [ ] **8.2** Arreglar nav obsoleta en `components/dashboard/dashboard-shell.tsx:33,157` (enlaza a `/dashboard-2`); evaluar si el shell brutalist está abandonado.
- [ ] **8.3** Limpiar `lib/data/migration.ts` y `lib/nutrition/storage.ts` (solo migración de claves legacy) cuando el modo local se deprecie.
- [ ] **8.4** Revisar `eslint.config.mjs:13–15` (3 reglas de `react-hooks` desactivadas por React Compiler) — reactivar cuando los patrones lo permitan.

---

## Orden de ejecución y dependencias

```
Fase 0 ──► Fase 1 ──► Fase 2 ──► Fase 3
                 └──► Fase 4 ──► Fase 5
Fases 6, 7, 8 en paralelo desde el final de Fase 1
```

- **Fase 0** es prerrequisito (docs veraces + secretos protegidos).
- **Fases 2 y 3 (seguridad)** son bloqueantes para exponer modo `api` en cualquier entorno real.
- **Fase 5** depende de tener Fases 1–4 estables.

---

## Checklist de cierre por tarea (regla del repo)
1. ¿Toca roles/permisos/datos sensibles? → casos positivo y negativo.
2. `npm run lint` + `npm run typecheck` + `npm run build` sin errores nuevos.
3. Backend: `cd backend && python -m pytest` verde.
4. Prueba manual del flujo afectado (carga/vacío/error/permiso) documentada.
5. ¿La jerarquía Admin → Entrenador → Atleta se respeta?
6. Reutilización de `components/ui` verificada.

---

## Referencias de auditoría (trazabilidad)
- Backend: 49 endpoints; ownership de rutinas resuelto (Fase 2), `membershipLevel` operativo, revalidación JWT vs BD; doble mecanismo de migración aún pendiente (Fase 7.4).
- Titan/seguridad: `requireSession` no valida JWT en modo `api`; gating por body spoofeable; sin `middleware.ts` (Fase 3, pendiente).
- Frontend: Fase 1 remoto cableada (overview, planes, usuarios admin); tablas admin aún en seeds (Fase 4.3); diario nutrición 100% localStorage; `dashboard-2/3` muertos.
- Tests: 46 backend (exercises 0%), 0 frontend, sin CI.
- Infra: sin healthchecks, sin Ollama en compose, dev-only.
