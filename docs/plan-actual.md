# Plan Actual — FitTrack

> Documento de ejecución. Estado real del repo tras auditoría archivo por archivo
> (backend Flask, capa IA Titan, frontend, tests, Docker, seguridad).
> Complementa y CORRIGE `docs/PROJECT_CONTEXT.md`, `docs/API_CONTRACTS.md` y `docs/planOpus.md`,
> que están parcialmente desfasados.
>
> **Última revisión:** 9 jun 2026 — auditoría completa por rol (atleta/trainer/admin) y capa de peticiones.
> Fases 0–6 y 9.1 cerradas. Nuevas Fases 10–13 con los gaps detectados, ordenadas por prioridad.

## Leyenda de prioridad
- 🔴 Crítico (seguridad / bloquea producción)
- 🟠 Alto (impacto funcional grande)
- 🟡 Medio (calidad / deuda)
- 🟢 Bajo (limpieza)

---

## Diagnóstico de partida

- **Backend:** ~completo. ~66 endpoints + `/api/health`, 10 blueprints. **114 tests** (`test_exercises.py`, `test_authz.py`, `test_api_domains.py`, `test_trainer_invitations.py`, etc.).
- **Frontend:** modo API completo (Fase 5). Vitest ampliado (config, resolve-athlete-id, body-profile/composition, Titan guard).
- **Seguridad:** Fase 2 (backend) + Fase 3 (Titan) cerradas. Redis rate limit Titan → Fase 7.
- **CI:** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — pytest + lint + typecheck + test + build en `main`.
- **Docs:** guías `TEST_FASE1/3/4/5_API.md`, `TEST_AUTH_API.md`, `TEST_DOCKER.md`. Pendiente: `PROJECT_CONTEXT.md` §5/§6 (0.4).

### Auditoría 9 jun 2026 (por rol + capa de peticiones)

Hallazgos que originan las Fases 10–13 (detalle de archivo y línea en cada fase):

- **Atleta:** perfil sin editar identidad ni contraseña (backend listo); membresía API llega sin `features`/fechas; errores del diario se revierten en silencio; link a `/settings` inexistente; datos decorativos en dashboard.
- **Trainer:** página Progreso inútil en modo API (depende de `athlete.metrics` de seeds); plan semanal nunca lee `GET /weekly-plan` y pisa el plan existente; bug `isCompleted` vs `isActive` en asignaciones; botón Editar rutina muerto.
- **Admin:** rutinas creadas por admin invisibles en listado API; sin UI para editar atleta/membresía/plan; sin reactivar trainer; capacidad 10 hardcodeada; tarjeta de asignaciones mezcla tipos.
- **Peticiones:** adaptador remoto cubre ~59/66 endpoints. Huérfanos: `change-password`, `PUT /api/memberships/users/:id`, 4 de exercises, `sessions/progress`. Sin manejo global de 401; JWT en `localStorage`; `resolveAthleteId` ignora `ROUTINES=api`; `canTrainerAccessAthlete` consulta store local en modo API.

---

## Fase 0 — Saneamiento base 🔴🟢 ✅ (casi cerrada jun 2026)

Objetivo: dejar el repo limpio y la documentación veraz antes de tocar funcionalidad.

- [x] **0.1** 🔴 Endurecer `.gitignore`: añadir `.env` (raíz) y `backend/fitness_platform.db`.
      **Hecho:** `.gitignore` ignora `.env`, `.env*.local`, `backend/.env` y `backend/fitness_platform.db`.
- [x] **0.2** 🔴 Verificar que `.env` raíz y `backend/.env` NO estén ya trackeados.
      **Hecho:** no aparecen en `git ls-files`.
- [x] **0.3** 🟢 Resolver duplicado Windows `backend/Dockerfile` vs `backend\Dockerfile`.
      **Hecho:** solo `backend/Dockerfile` trackeado.
- [ ] **0.4** 🟡 Actualizar `docs/PROJECT_CONTEXT.md` — **parcial:** Fases 3–5 no reflejadas aún en §5/§6.
- [x] **0.5** 🟡 Actualizar `docs/API_CONTRACTS.md` — **hecho (jun 2026):** Fases 4–5 (admin lists, subscribe, exercises, diary, body-profile).
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

- [x] **2.1** 🔴 Ownership en rutinas.
- [x] **2.2** 🔴 Revalidar usuario en BD (rol + `is_active`).
- [x] **2.3** 🟠 Membresía completa + `PUT /api/memberships/users/:id`.
- [x] **2.4** 🟠 Sin filtrado de `str(e)`.
- [x] **2.5** 🟡 Validación Pydantic (nutrición, weekly-plan, setLogs).
- [x] **2.6** 🟡 Rate limiting Flask-Limiter en auth sensible.
- [x] **2.7** 🟡 Email, publish_plan, clear-cache admin.
- [x] **2.8** 🟢 Nullable endurecido + migración `003_security_nullable_constraints.py`.
- [x] **2.9** 🟡 `ProductionConfig` JWT_COOKIE_SECURE.

**Validación:** `cd backend && python -m pytest -q` → **61 passed** (base Fase 2).

**Pendientes de infra (no bloquean Fase 2):** Redis rate limit backend → Fase 7.

---

## Fase 3 — Seguridad capa IA "Titan" 🔴 ✅ (culminada jun 2026; 3.5 → Fase 7)

Objetivo: que las rutas Next IA no sean un agujero de autenticación/abuso.
Validación manual: [TEST_FASE3_TITAN.md](../TEST_FASE3_TITAN.md).

- [x] **3.1** 🔴 JWT real vía `verifyTitanSession` → introspección Flask `GET /api/auth/me` (caché 30s).
- [x] **3.2** 🔴 Sin `membershipTier`/`userRole` en body; gating desde sesión verificada.
- [x] **3.3** 🔴 `auth-client.remote.ts`: `refreshSession` carga `membership` desde `/api/auth/me`.
- [x] **3.4** 🟠 `requireTitanMotivationAccess` en `/api/coach/titan` y `/api/coach/session-review`.
- [ ] **3.5** 🟡 Rate limit Redis por `userId` — **diferido a Fase 7** (hoy `Map` en proceso por userId).
- [x] **3.6** 🟡 `middleware.ts` básico en `/api/coach/*` y `/api/nutrition/titan` (Bearer requerido).
- [x] **3.7** 🟢 Fallback servidor Ollama (`200` + `source: 'fallback'`) en las 3 rutas Titan.

**Validación:** `lib/api/titan-route-guard.test.ts` (Vitest); guía `TEST_FASE3_TITAN.md`.

---

## Fase 4 — Completar dominios sin backend 🟠 ✅ (culminada jun 2026)

Objetivo: eliminar la persistencia exclusiva en `localStorage` donde haga falta.
Validación manual: [TEST_FASE4_API.md](../TEST_FASE4_API.md).

- [x] **4.1** 🟠 Diario nutrición / hidratación / adherencia.
      **Hecho:** modelo `NutritionDiary`, migración `004_nutrition_diary.py`, `NutritionDiaryService`, rutas `/api/nutrition/diary/*`, Pydantic schemas, `can_modify_athlete_diary`, adaptador `getDiary`/`putDiary`/`addDiaryEntry`/`deleteDiaryEntry`/`patchDiaryWater`, refactor `use-nutrition.ts` con migración one-shot desde `localStorage`. Tests: `test_nutrition_diary.py`.
- [x] **4.2** 🟠 Autosuscripción membresía.
      **Hecho:** `POST /api/memberships/subscribe` (solo atleta, `planId` del body, userId del JWT), `subscribeMembership` en adaptador, `memberships/page-client.tsx` con `refreshSession` en modo API. `/api/auth/me` ya devolvía `membership`.
- [x] **4.3** 🟠 Listados admin.
      **Hecho:** `GET /api/admin/athletes`, `GET /api/admin/trainers`, `listAdminAthletes`/`listAdminTrainers`, `use-admin-data.ts` carga con `USERS=api`. Tests authz en `test_api_domains.py`.
- [x] **4.4** 🟡 Catálogo de ejercicios.
      **Hecho:** `listExercises`/`searchExercises` → `/api/exercises/cached` y `/search` (JWT requerido), `use-admin-data.ts` y `use-trainer-data.ts` con `ROUTINES=api`, mapeo `exercise_db_id` → `Exercise.id`, fallback `SEED_EXERCISES` si caché vacío.

**Validación:** `pytest` **78 passed**; `pnpm lint` + `typecheck` + `test` + `build` OK.

---

## Fase 5 — Migración modo `local` → `api` 🟠 ✅ (culminada jun 2026)

Objetivo: activar dominios progresivamente y retirar mocks.
Validación manual: [TEST_FASE5_API.md](../TEST_FASE5_API.md). Plantilla: `.env.local.api.example`.

- [x] **5.1** Activar dominio por dominio (`METRICS` → `ROUTINES` → `USERS` → `NUTRITION` → `MEMBERSHIPS`).
      **Hecho:** `isFullApiMode()`, facade `adminClient` para overview, hooks API-first, docker `DATA_SOURCE=api`.
- [x] **5.2** Refactor hooks: `use-admin-data` (routines/assignments API), `use-admin`, `use-trainer`, `use-athlete-data`, `use-coach-nutrition`, `resolve-athlete-id.ts`, `migration.ts` sin seeds en API completo.
- [x] **5.3** Eliminar demo: auto-seed métricas; volumen/PRs desde sesiones reales o empty state en metrics UI.
- [x] **5.4** Quitar re-exports `MOCK_*` de `use-admin.ts` y `use-trainer.ts`.
- [x] **5.5** Body profile en backend: `GET/PATCH /api/users/me/body-profile` (`UserProfile`), adaptador + `use-body-profile` con migración one-shot desde localStorage.

**Validación:** `pytest` **83 passed** (`test_body_profile.py`); `pnpm lint` + `typecheck` + `test` (6 Vitest) OK; `pnpm build` requiere red a Google Fonts (fallo ambiental en sandbox sin internet, no de código); guía [TEST_FASE5_API.md](../TEST_FASE5_API.md).

---

## Fase 6 — Tests y calidad 🟠 ✅ (culminada jun 2026)

- [x] **6.1** Frontend Vitest ampliado.
      **Hecho:** `config.test.ts`, `resolve-athlete-id.test.ts`, `body-profile.test.ts`, `body-composition.test.ts` + `titan-route-guard.test.ts`; script `test:watch`. Rutas Next Titan siguen en guía manual (`TEST_FASE3_TITAN.md`).
- [x] **6.2** Backend huecos cubiertos.
      **Hecho:** `test_exercises.py`; sessions GET/week/progress + 403; `TestInfrastructure` (health, logout); authz nutrición/rutinas en `test_authz.py`.
- [x] **6.3** Helpers consolidados en [`backend/tests/conftest.py`](backend/tests/conftest.py): `register_user`, `login_user`, `seed_cached_exercise`.
- [x] **6.4** CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (jobs `backend` + `frontend`).
- [x] **6.5** Guías: [`TEST_AUTH_API.md`](../TEST_AUTH_API.md), [`TEST_DOCKER.md`](../TEST_DOCKER.md).

**Validación:** `pytest` **102 passed**; `pnpm test` **22** Vitest; CI en push/PR a `main`.

---

## Fase 7 — Docker / infraestructura / producción 🟡

- [ ] **7.1** 🟡 Healthchecks en `docker-compose.yml`.
- [ ] **7.2** 🟡 Ollama en compose o documentación externa.
- [ ] **7.3** 🟠 Targets de producción (`next build`+`start`, gunicorn).
- [ ] **7.4** 🟡 Unificar migraciones Alembic vs `create_all()` en prod.
- [ ] **7.5** 🟢 Actualizar `init_db.py` standalone.
- [ ] **7.6** 🟢 `restart` policies y red explícita.
- [ ] **7.7** 🟡 Rate limit Titan con Redis (`TITAN_RATELIMIT_REDIS_URL`) — diferido desde Fase 3.5.
- [ ] **7.8** 🟠 **Resend — invitaciones entrenador** (ver Fase 9.2). Sin esto, el backend simula el envío y no llega correo real.

**Validación:** `docker compose -p fittrack up --build` con healthchecks verdes; migración `005_invitation_tokens` aplicada.

---

## Fase 9 — Admin entrenadores e invitaciones 🟠 (código ✅; operación pendiente)

Objetivo: alta/baja de entrenadores por admin, invitación por email, activación `/activate`, asignaciones en UI.
Validación manual: [TEST_ADMIN_TRAINERS.md](../TEST_ADMIN_TRAINERS.md). Contratos: `docs/API_CONTRACTS.md` (admin-trainers, auth-invite).

### 9.1 Implementación (cerrada en código jun 2026)

- [x] **9.1.1** Modelo `InvitationToken`, migración `005_invitation_tokens.py`, `InvitationService`, `EmailService` (Resend).
- [x] **9.1.2** Endpoints: `POST/DELETE /api/admin/trainers`, `POST .../resend-invite`, `GET/POST /api/auth/invite|accept-invite`.
- [x] **9.1.3** UI: `/admin/trainers` (invitar/eliminar/reenviar), `/activate`, `/admin/assignments` (asignar/reasignar/quitar).
- [x] **9.1.4** Tests: `backend/tests/test_trainer_invitations.py` (**114** pytest totales tras merge).

### 9.2 Pendiente operativo — no olvidar (Resend / correo real)

> **Importante:** si `RESEND_API_KEY` está vacía en `backend/.env`, la app muestra éxito pero **no envía email** (solo log: invitación simulada). Ver `backend/app/services/email_service.py`.

- [ ] **9.2.1** 🟠 Crear cuenta en [Resend](https://resend.com) (plan **Free**: 3.000 emails/mes, 100/día; sin tarjeta).
- [ ] **9.2.2** 🟠 Verificar **dominio de envío** en Resend (o email de prueba verificado en sandbox).
- [ ] **9.2.3** 🟠 Configurar en `backend/.env` (usado por Docker vía `env_file` en `docker-compose.yml`):
      `RESEND_API_KEY`, `EMAIL_FROM` (dominio verificado), `FRONTEND_URL=http://localhost:3000`.
- [ ] **9.2.4** 🟡 Reiniciar backend tras cambios: `docker compose -p fittrack restart fittrack-backend`.
- [ ] **9.2.5** 🟡 Probar flujo completo: invitar → correo → `/activate?token=...` → login trainer → reenviar invitación si hace falta.
- [ ] **9.2.6** 🟢 (Opcional) Modo dev: log seguro del enlace de activación cuando no hay API key, para no depender del correo en local.
- [ ] **9.2.7** 🟢 Documentar Resend en `README.md` / `TEST_DOCKER.md` (variables y límites del plan free).

**Validación:** correo recibido (o evento *delivered* en dashboard Resend); entrenador activa cuenta y aparece activo en `/admin/trainers`.

---

## Fase 10 — Bugs funcionales (auditoría jun 2026) 🔴🟠

Objetivo: corregir comportamientos rotos o que pierden datos en modo `api`. **Es la fase de mayor prioridad.**

- [x] **10.1** 🔴 **Plan semanal del trainer pisa el plan existente.** Resuelto: `weekly-plan-editor.tsx` y `prime-trainer-weekly-plan.tsx` cargan `GET /api/routines/weekly-plan` al cambiar atleta.
- [x] **10.2** 🟠 **Bug de campo en asignaciones del trainer.** Resuelto: `assignment-board.tsx` usa `isActive` alineado con la API.
- [x] **10.3** 🟠 **Rutinas creadas por admin invisibles en modo API.** Resuelto: backend admin sin `trainerId` lista todas (`test_authz.py`); `use-admin-data.ts` usa `listRoutines()` global.
- [x] **10.4** 🟠 **`resolveAthleteId` ignora `ROUTINES=api`.** Resuelto: `resolve-athlete-id.ts` incluye `isApiRoutinesSource()`.
- [x] **10.5** 🟠 **Guard de trainer consulta store local en modo API.** Resuelto: `useAthleteForCoach` + `isApiRoutinesSource`; `findAthleteInStore` documentado como local-only.
- [x] **10.6** 🟠 **Errores de guardado del diario silenciados.** Resuelto: `use-nutrition.ts` muestra toast y revierte estado optimista.
- [x] **10.7** 🟡 **Dashboard admin mezcla tipos de asignación.** Resuelto: enlace a `/admin-v2/assignments` con etiqueta de rutina.

**Validación:** Vitest para 10.4; prueba manual trainer en modo API (plan semanal: editar sin perder días previos; asignaciones: completar/reactivar refleja estado); pytest si se toca `routines.py` (10.3) con casos admin/trainer.

---

## Fase 11 — UI pendiente con backend ya listo 🟠

Objetivo: cablear pantallas/botones muertos a endpoints que ya existen. Sin cambios de esquema.

- [ ] **11.1** 🟠 **Perfil atleta: editar identidad y contraseña.** Botones sin `onClick` en `app/profile/page-client.tsx` (~L244-249). Backend listo: `POST /api/auth/change-password` (sin cliente: añadir a `lib/auth/auth-client.remote.ts` + contrato ya en `lib/api/contracts/auth.ts`) y `PATCH /api/users/athletes/:id` para nombre/apellido.
- [ ] **11.2** 🟠 **Editar rutina (trainer y admin).** Botón "Editar" sin acción en `components/admin/routines-list.tsx` (L65-72); `updateRoutine` ya existe en hook, facade, remoto y backend (`PATCH /api/routines/:id`). Abrir `RoutineBuilder` en modo edición.
- [x] **11.3** 🟠 **Admin: editar atleta y asignar membresía.** Modal **Asignar plan** en `/admin-v2/athletes`; `assignUserMembership` en remoto.
- [ ] **11.4** 🟡 **Admin: editar plan de membresía.** `updateMembershipPlan`/`updatePlan` existen en hook y backend (`PATCH /api/memberships/plans/:id`) pero `/admin/memberships` solo crea/elimina. Añadir edición + estados de carga/error (el hook ya expone `isLoading`).
- [ ] **11.5** 🟡 **Admin: reactivar entrenador inactivo.** Hoy solo se desactiva (`DELETE /api/admin/trainers/:id`). Requiere endpoint nuevo (p. ej. `PATCH /api/admin/trainers/:id` con `isActive: true`) + botón en `components/admin/trainers-list.tsx`.
- [x] **11.6** 🟠 **Membresía completa en sesión API.** `serialize_me_membership` + `functionalTier`; `mapMeMembership` acepta nombres custom y `daysRemaining`.
- [ ] **11.7** 🟢 **Diario: macros en registro manual.** El formulario de `components/nutrition/food-diary` solo pide nombre+kcal; añadir P/C/G opcionales (el modelo y la API ya los soportan).

**Validación:** lint + typecheck + build; prueba manual por flujo (cambiar contraseña con caso negativo, editar rutina, asignar membresía); casos authz positivo/negativo en pytest para 11.5.

---

## Fase 12 — Visibilidad de datos para trainer/admin en modo API 🟠

Objetivo: que trainer y admin vean datos reales del atleta (hoy dependen de `athlete.metrics` embebido en seeds, vacío en API).

- [x] **12.1** 🟠 **Página Progreso del trainer.** `progress-overview.tsx` usa `useAthleteMetrics` + carga comparativa vía API cuando `METRICS=api`.
- [x] **12.2** 🟠 **Métricas en listados/modales de atletas.** `athlete-detail-modal` y `prime-athlete-inspector` cargan métricas bajo demanda con `useAthleteMetrics`.
- [ ] **12.3** 🟡 **Coach/admin ven el diario nutricional del atleta.** Endpoints `/api/nutrition/diary/*` + `can_modify_athlete_diary` ya existen; añadir vista de solo lectura en `/trainer|admin/athletes/[id]/nutrition`.
- [ ] **12.4** 🟡 **Metabolismo del coach desde body-profile real.** `metabolismInputFromAthlete` usa peso/talla/edad del listado, no `GET /api/users/me/body-profile` del atleta. Requiere endpoint para que coach lea el body-profile de su atleta (hoy solo `me`).
- [ ] **12.5** 🟢 **Capacidad de atletas por trainer.** `capacity = 10` hardcodeado en `app/admin/assignments/page-client.tsx` (~L124). Mover a config o campo del trainer.

**Validación:** prueba manual trainer/admin en modo API completo (Docker); pytest para endpoints nuevos (12.4) con casos de autorización.

---

## Fase 13 — Robustez de peticiones y sesión 🟠🟡

Objetivo: endurecer la capa HTTP/auth del frontend para uso real sostenido.

- [x] **13.1** 🟠 **Manejo global de 401.** `lib/api/http-client.ts` + `lib/api/unauthorized-handler.ts`: ante 401 con `auth: true`, limpiar sesión y redirigir a `/login`.
- [ ] **13.2** 🟡 **Estrategia de expiración/refresh.** No hay refresh token; `refreshSession()` re-llama `/api/auth/me` con el mismo JWT. Decidir: refresh tokens en Flask-JWT-Extended o TTL largo documentado + re-login.
- [ ] **13.3** 🟡 **Token fuera de `localStorage` (XSS).** Migrar a cookies httpOnly (preparado en `lib/auth/session-store.ts` según docs); implica CORS con credenciales y CSRF en Flask. Coordinar con `middleware.ts` (hoy lee header Bearer).
- [ ] **13.4** 🟡 **Errores silenciados restantes.** Revisar `catch {}` en logout remoto y `refreshSession` (`lib/auth/auth-client.remote.ts`), quota de localStorage, y fallback de body-profile — registrar o notificar según caso (sin loguear tokens/PII, regla `security-core`).
- [ ] **13.5** 🟢 **Endpoints huérfanos: decidir.** `GET /api/exercises/muscles|/by-muscle/:m|/:id`, `POST /clear-cache` (sin UI admin), `GET /api/health` (helper sin uso). Consumir o documentar como API pública/interna.

**Validación:** Vitest para interceptor 401; prueba manual con token expirado/manipulado (caso negativo); revisión de logs sin datos sensibles.

---

## Fase 8 — Limpieza y deuda menor 🟢

- [x] **8.1** Eliminar `app/dashboard-2/*` y `app/dashboard-3/*` (redirect permanente en `next.config.mjs`).
- [x] **8.2** Nav obsoleta eliminada con `dashboard-shell.tsx` y rutas legacy.
- [ ] **8.3** Limpiar `lib/data/migration.ts` y `lib/nutrition/storage.ts` cuando local se deprecie.
      **Parcial Fase 5:** `isFullApiMode()` retorna store vacío; modo `local` sigue activo por defecto en `.env.local.example`.
- [ ] **8.4** Revisar reglas `react-hooks` desactivadas en `eslint.config.mjs`.
- [x] **8.5** Quitar enlace `/settings` del menú del dashboard (`fitness-dashboard-view.tsx`); perfil en `/profile`.
- [x] **8.6** Datos decorativos en dashboard atleta: sparkline PROGRESO desde métricas reales; badge "mejorando" fijo eliminado.
- [x] **8.7** Restos de maqueta en métricas: fechas/footer de demo acotados en `metrics-option-one-design-replica.tsx`.
- [x] **8.8** Actualizar `docs/PROJECT_CONTEXT.md`: diario nutricional persiste en API con `NEXT_PUBLIC_DATA_SOURCE_NUTRITION=api`.

---

## Orden de ejecución y dependencias

```
[CERRADAS] Fase 0 ──► 1 ──► 2 ──► 3 ──► 4 ──► 5 ──► 6 ──► 9.1

[PENDIENTES]
Fase 10 (bugs) ──► Fase 11 (UI con backend listo) ──► Fase 12 (visibilidad trainer/admin)
Fase 13 (robustez HTTP/sesión) ── tras 10; en paralelo con 11–12
Fase 7 (infra/prod) y 9.2 (Resend) ── independientes, en paralelo
Fase 8 (limpieza) ── al final o intercalada en huecos
```

- **Fases 0–6:** cerradas en código (0.4 docs parcial → ahora 8.8; 3.5/7.7 Redis pendiente).
- **Fase 9.1:** gestión entrenadores en código ✅; **9.2 Resend** pendiente operativo (correos reales).
- **Fase 10** es la nueva prioridad: bugs que pierden datos o muestran estado falso en modo API.
- **Fases 11–12** completan la paridad funcional entre UI y backend ya implementado.
- **Fase 13** endurece la sesión antes de cualquier despliegue real (junto con Fase 7).

---

## Checklist de cierre por tarea (regla del repo)
1. ¿Toca roles/permisos/datos sensibles? → casos positivo y negativo.
2. `npm run lint` + `npm run typecheck` + `npm run build` sin errores nuevos.
3. Backend: `cd backend && python -m pytest` verde.
4. Prueba manual del flujo afectado documentada.
5. ¿La jerarquía Admin → Entrenador → Atleta se respeta?
6. Reutilización de `components/ui` verificada.

---

## Referencias de auditoría (trazabilidad)
- Backend: ownership rutinas (Fase 2), diary + subscribe + admin lists (Fase 4), body-profile en `user_profiles` (Fase 5), migración `005_invitation_tokens` + invitaciones entrenador (Fase 9); doble mecanismo migración pendiente (Fase 7.4).
- Titan/seguridad: introspección JWT, gating server-side, rate limit por `userId` en memoria, `middleware.ts` básico, fallbacks servidor (Fase 3 ✅; Redis → 7.7).
- Frontend: `adminClient` para overview; admin trainers/assignments con invitación y activación; sin auto-seed métricas ni `MOCK_*` en hooks; body profile API + migración localStorage; plantilla `.env.local.api.example`; docker `DATA_SOURCE=api`.
- Tests: **168 backend**; **83 Vitest**; CI en `.github/workflows/ci.yml`.
- Infra: sin healthchecks, sin Ollama en compose, dev-only (`next dev`); **Resend sin configurar en prod/local Docker** → invitaciones simuladas (Fase 9.2).
- Auditoría 9 jun 2026 (origen de Fases 10–13): revisión por pestaña de los 3 roles + cruce frontend↔backend de los ~66 endpoints. Cobertura remota ~59/66; huérfanos y UI muerta detallados en cada fase.
