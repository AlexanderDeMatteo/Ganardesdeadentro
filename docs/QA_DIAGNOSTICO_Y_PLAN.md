# Diagnóstico QA y plan de corrección — FitTrack

> Documento maestro para cerrar hallazgos tras la corrida QA del **2026-06-10**.  
> Complementa [`plan-actual.md`](plan-actual.md) con evidencia de pruebas.  
> Corrida detallada: [`qa-runs/2026-06-10.md`](qa-runs/2026-06-10.md) · Session 2: [`qa-runs/2026-06-10-session2.md`](qa-runs/2026-06-10-session2.md) · Checklist: [`QA_CHECKLIST.md`](QA_CHECKLIST.md)

---

## 0. Estado del diagnóstico

| Campo | Valor |
|-------|-------|
| **Diagnóstico QA** | ✅ **CERRADO** (2026-06-10, session 2) |
| **Script session 2** | `backend/scripts/run_qa_session2.py` |
| **Pendiente implementación** | — (Sprints 1–5 cerrados) |
| **Sprint 5** | 5/5 ✅ (FIX-17, FIX-19, FIX-23, FIX-24, 8.7–8.8 cerrado 2026-06-13) |
| **Release QA** | ✅ **QA RELEASE OK** (2026-06-13) — ver [`qa-runs/2026-06-13-qa-release-closure.md`](qa-runs/2026-06-13-qa-release-closure.md) |
| **Sprint 4** | 2/2 ✅ (FIX-16, FIX-18 cerrado 2026-06-13) |
| **Sprint 3** | 5/5 ✅ (FIX-14…FIX-22 cerrado 2026-06-10) |
| **Sprint 1** | 7/7 ✅ (FIX-07 cerrado 2026-06-10) |
| **Sprint 2** | 7/7 ✅ (FIX-08…FIX-13 cerrado 2026-06-10) |

**Orden de trabajo a partir de aquí:** implementar fixes → marcar checkboxes → re-ejecutar QA scripts.

---

## 1. Resumen ejecutivo

### Qué se probó

| Ámbito | Herramienta | Resultado |
|--------|-------------|-----------|
| Session 2 (pendientes) | `backend/scripts/run_qa_session2.py` | 8 ✅ · 8 ⚠️ · 4 ⏭️ |
| Smoke S + E2E G | `backend/scripts/run_qa_smoke.py` | 7/7 ✅ (post-restart) |
| Auth, roles, API, Titan | `backend/scripts/run_qa_full.py` | 36 ✅ · 12 ⚠️ · 7 ⏭️ · 5 ❌* |
| CI F1–F5 | pytest, lint, typecheck, vitest, build | Todo ✅ |

\* Los **5 ❌** en full aparecen al encadenar scripts sin restart (429 / athlete51 ya existe). **A6 ✅** en session2 aislado. **E4 ✅** con rutina exclusiva.

### Entorno de prueba

- Docker Compose (`fittrack`) · modo API completo
- Dataset: `admin@fittrack.qa`, `trainer1–10@fittrack.qa`, `athlete1–50@fittrack.qa` · contraseña `password123`
- Seed: `docker compose exec fittrack-backend python scripts/seed_qa_dataset.py`
- Ollama: `granite4.1:3b` · Titan Premium con `source: ollama` ✅

### Ya corregido durante QA (no requiere tarea)

| Hallazgo | Fix aplicado |
|----------|--------------|
| Titan 503 en Docker (Flask inalcanzable) | `API_INTERNAL_URL` + `getServerApiBaseUrl()` |
| Ollama `fallback` en Docker | `extra_hosts: host.docker.internal:host-gateway` + `OLLAMA_BASE_URL` |

Archivos: `docker-compose.yml`, `lib/api/config.ts`, `lib/api/http-server.ts`.

---

## 2. Matriz de hallazgos

Leyenda prioridad: 🔴 Crítico · 🟠 Alto · 🟡 Medio · 🟢 Bajo  
Estado: ⬜ Pendiente · 🔄 En curso · ✅ Corregido · ⚠️ Conocido aceptado

| ID | QA | Sev. | Estado | Fase plan | Problema | Archivos / área | Validación al cerrar |
|----|-----|------|--------|-----------|----------|-----------------|----------------------|
| **FIX-01** | C6 | 🔴 | ✅ | 10.1 | Plan semanal sobrescribía al guardar | `components/trainer/weekly-plan-editor.tsx` | C6 session2 ✅; precarga GET + payload completo |
| **FIX-02** | C5 | 🟠 | ✅ | 10.2 | Toggle asignaciones / `isActive` | `assignment-board.tsx`, `use-trainer.ts` | C5 session2 ✅ |
| **FIX-03** | D11 | 🟠 | ✅ | 10.3 | Rutinas admin “invisibles” | `use-admin-data.ts` | D11 session2 ✅; API admin list OK |
| **FIX-04** | — | 🟠 | ✅ | 10.4 | `resolveAthleteId` + `ROUTINES=api` | `lib/nutrition/resolve-athlete-id.ts` | Vitest ✅ |
| **FIX-05** | — | 🟠 | ⏭️ | 10.5 | `canTrainerAccessAthlete` localStorage | — | Obsoleto: helper eliminado; IDOR backend OK |
| **FIX-06** | B8 | 🟠 | ✅ | 10.6 | Diario revertido sin aviso | `hooks/use-nutrition.ts` | `toast.error` en catch ✅ |
| **FIX-07** | D2 | 🟡 | ✅ | 10.7 | KPI asignaciones sin enlace coherente | `app/admin/page-client.tsx` | Tarjeta trainer + etiqueta rutina |
| **FIX-08** | E8 | 🟠 | ✅ | 11.1 | Perfil: sin UI change-password | `app/profile/page-client.tsx` | PATCH /users/me + modal contraseña |
| **FIX-09** | C10 | 🟠 | ✅ | 11.2 | Botón Editar rutina sin acción | `components/admin/routines-list.tsx` | RoutineBuilder modo edición |
| **FIX-10** | — | 🟠 | ✅ | 11.3 | Admin editar atleta + membresía | `app/admin/athletes/*` | Modal + assignUserMembership |
| **FIX-11** | D12 | 🟡 | ✅ | 11.4 | Admin membresías sin editar | `app/admin/memberships/*` | PATCH desde UI |
| **FIX-12** | D9 | 🟡 | ✅ | 11.5 | No reactivar trainer | `backend/app/routes/admin.py` | PATCH + UI Reactivar |
| **FIX-13** | — | 🟠 | ✅ | 11.6 | Membresía incompleta en sesión | `lib/auth/auth-client.remote.ts` | Dashboard plan real |
| **FIX-14** | C8 | 🟠 | ✅ | 12.1 | Progreso trainer sin API métricas | `progress-overview.tsx` | useAthleteMetrics + gráficos |
| **FIX-15** | D5 | 🟠 | ✅ | 12.2 | Modal atleta sin métricas | serializers + modal | latestMetric + hook |
| **FIX-16** | E3 | 🟠 | ✅ | 13.1 | Sin interceptor 401 global | `lib/api/http-client.ts` | Logout + `/login` |
| **FIX-17** | B14 | 🟡 | ✅ | 8.5 | Enlace `/settings` roto | `fitness-dashboard-view.tsx` | Enlace eliminado |
| **FIX-18** | E2 | 🟡 | ✅ | 13.4 | Titan JWT inválido → 503 | `lib/api/titan-route-guard.ts` | → 401 |
| **FIX-19** | — | 🟢 | ✅ | 11.7 | Diario sin macros opcionales | `components/nutrition/food-diary` | P/C/G opcionales |
| **FIX-20** | — | 🟡 | ✅ | 12.3 | Coach no ve diario atleta | nutrición trainer/admin | Vista lectura |
| **FIX-21** | — | 🟡 | ✅ | 12.4 | Metabolismo coach sin body-profile | nutrición coach | GET body-profile atleta |
| **FIX-22** | — | 🟢 | ✅ | 12.5 | Capacidad trainer hardcodeada | `admin/assignments/page-client.tsx` | max_athletes en BD |
| **FIX-23** | — | 🟢 | ✅ | 8.6 | Dashboard datos decorativos | `fitness-dashboard-view.tsx` | Spark real + sin badge fijo |
| **FIX-24** | — | 🟢 | ✅ | 8.1–8.2 | Rutas `dashboard-2/3` | `app/dashboard-2/*` | Eliminadas + redirect en `next.config.mjs` |

---

## 3. Plan de corrección (orden recomendado)

Ejecutar en **sprints**; marcar `[x]` al cerrar cada ítem. Tras cada sprint, correr:

```powershell
docker compose -p fittrack restart fittrack-backend
python backend/scripts/run_qa_session2.py   # pendientes + revalidación Sprint 1
docker compose -p fittrack restart fittrack-backend
python backend/scripts/run_qa_full.py
python backend/scripts/run_qa_smoke.py
cd backend && python -m pytest -q
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

### Sprint 1 — Pérdida de datos y estado falso 🔴🟠 (Fase 10)

Objetivo: nada que haga creer al usuario que guardó cuando no guardó.

- [x] **FIX-01** Plan semanal precarga `GET /weekly-plan` — verificado session2
- [x] **FIX-02** Unificar `isActive` en assignment board — verificado session2
- [x] **FIX-06** Toast/error en fallo diario nutrición — verificado session2
- [x] **FIX-03** Listado rutinas admin — verificado session2 (API OK)
- [x] **FIX-04** `resolveAthleteId` + test Vitest
- [x] **FIX-05** Guard trainer en modo API — obsoleto (backend IDOR)
- [x] **FIX-07** KPI asignaciones admin — tarjeta trainer + etiqueta rutina

**Criterio de cierre Sprint 1:** casos QA **C5, C6, B8, D11, D2** → ✅ (o ⚠️ documentado).

---

### Sprint 2 — UI cableada a backend existente 🟠 (Fase 11)

Objetivo: botones muertos funcionando sin cambiar esquema BD.

- [x] **FIX-08** Perfil: contraseña + identidad
- [x] **FIX-09** Editar rutina trainer/admin
- [x] **FIX-10** Admin editar atleta + membresía
- [x] **FIX-11** Admin editar plan membresía
- [x] **FIX-12** Reactivar trainer (API + UI)
- [x] **FIX-13** Membresía completa en `/auth/me` y dashboard

**Criterio de cierre Sprint 2:** **C10, D9, D12, E8 (UI), B14** parcial si solo perfil. ✅ Re-QA 2026-06-10.

---

### Sprint 3 — Visibilidad trainer/admin 🟠 (Fase 12)

Objetivo: datos reales en pantallas de seguimiento.

- [x] **FIX-14** Progreso trainer con API métricas
- [x] **FIX-15** Métricas en modal/listado atletas
- [x] **FIX-20** Diario nutricional lectura coach/admin
- [x] **FIX-21** Body-profile atleta para coach
- [x] **FIX-22** Capacidad trainer configurable (BD)

**Criterio de cierre Sprint 3:** **C8, D5** → ✅ Re-QA 2026-06-10.

---

### Sprint 4 — Sesión y robustez HTTP 🟠 (Fase 13 + QA)

Objetivo: comportamiento predecible ante auth fallida.

- [x] **FIX-16** Interceptor global 401
- [x] **FIX-18** Titan guard: 401 vs 503 en JWT inválido
- [x] Revisar **13.2–13.4** según [`plan-actual.md`](plan-actual.md) (refresh, cookies, catch silenciosos) — documentado en [`qa-runs/2026-06-13-sprint4.md`](qa-runs/2026-06-13-sprint4.md)

**Criterio de cierre Sprint 4:** **E3, E2** → ✅ Re-QA 2026-06-13.

---

### Sprint 5 — Limpieza y polish 🟢 (Fase 8)

Objetivo: deuda visual y rutas rotas.

- [x] **FIX-17** Enlace `/settings` eliminado del menú
- [x] **FIX-23** Dashboard sin spark/badge hardcodeados
- [x] **FIX-24** Rutas `dashboard-2/3` eliminadas; redirect permanente en `next.config.mjs`
- [x] **FIX-19** Macros opcionales P/C/G en diario manual
- [x] **8.7–8.8** Maqueta métricas acotada + `PROJECT_CONTEXT.md` actualizado

**Criterio de cierre Sprint 5:** **B14** → ✅ Re-QA 2026-06-13. Corrida: [`qa-runs/2026-06-13-sprint5.md`](qa-runs/2026-06-13-sprint5.md).

---

## 4. Registro de progreso

Actualizar esta tabla al cerrar cada FIX.

| FIX | Sprint | Responsable | Fecha cierre | PR / commit | Re-QA |
|-----|--------|-------------|--------------|-------------|-------|
| FIX-01 | 1 | QA session2 | 2026-06-10 | (ya en código) | ✅ |
| FIX-02 | 1 | QA session2 | 2026-06-10 | (ya en código) | ✅ |
| FIX-03 | 1 | QA session2 | 2026-06-10 | no reproducido | ✅ |
| FIX-04 | 1 | QA session2 | 2026-06-10 | (ya en código) | ✅ |
| FIX-05 | 1 | — | 2026-06-10 | obsoleto | ⏭️ |
| FIX-06 | 1 | QA session2 | 2026-06-10 | (ya en código) | ✅ |
| FIX-07 | 1 | Sprint 2 | 2026-06-10 | FIX-07 admin KPI | ✅ |
| FIX-08 | 2 | Sprint 2 | 2026-06-10 | PATCH /users/me + perfil UI | ✅ |
| FIX-09 | 2 | Sprint 2 | 2026-06-10 | RoutineBuilder edición | ✅ |
| FIX-10 | 2 | Sprint 2 | 2026-06-10 | edit-athlete-modal | ✅ |
| FIX-11 | 2 | Sprint 2 | 2026-06-10 | memberships edit UI | ✅ |
| FIX-12 | 2 | Sprint 2 | 2026-06-10 | PATCH reactivar trainer | ✅ |
| FIX-13 | 2 | Sprint 2 | 2026-06-10 | serialize_me_membership | ✅ |
| FIX-14 | 3 | Sprint 3 | 2026-06-10 | progress-overview + metrics API | ✅ |
| FIX-15 | 3 | Sprint 3 | 2026-06-10 | latestMetric + modal | ✅ |
| FIX-20 | 3 | Sprint 3 | 2026-06-10 | coach-diary-view | ✅ |
| FIX-21 | 3 | Sprint 3 | 2026-06-10 | athlete body-profile endpoint | ✅ |
| FIX-22 | 3 | Sprint 3 | 2026-06-10 | max_athletes migration | ✅ |
| FIX-16 | 4 | Sprint 4 | 2026-06-13 | unauthorized-handler + http-client interceptor | ✅ |
| FIX-18 | 4 | Sprint 4 | 2026-06-13 | titan-route-guard auth mapping | ✅ |
| FIX-17 | 5 | Sprint 5 | 2026-06-13 | quitar enlace /settings | ✅ |
| FIX-19 | 5 | Sprint 5 | 2026-06-13 | food-diary P/C/G opcionales | ✅ |
| FIX-23 | 5 | Sprint 5 | 2026-06-13 | progressWeightSpark + sin badge fijo | ✅ |
| FIX-24 | 5 | Sprint 5 | 2026-06-13 | delete dashboard-2/3 + dashboard-shell | ✅ |

---

## 5. Qué NO es bug de producto

| Item | Acción |
|------|--------|
| **A6** 429 en `run_qa_full` encadenado | Ejecutar `run_qa_session2.py` (A6 aislado) o restart antes de full |
| **A2** athlete51 ya registrado | Esperado 400; tratar como pass en script |
| **E4** en full sin fixture | Cubierto en `run_qa_session2.py` con rutina exclusiva |
| **D7** reenviar token | API ✅ session2; modal UI opcional |
| **D8** desactivar con atletas | API probada; modal reasignación = UI manual |
| **C12, A10** redirect guards | Código OK; validación browser opcional |
| Rate limit **E7** | `--e7-only` tras restart |
| Encadenar scripts sin restart | Provoca 429 en smoke/full — **reiniciar backend entre fases** |

---

## 6. Referencias cruzadas

| Documento | Uso |
|-----------|-----|
| [`QA_CHECKLIST.md`](QA_CHECKLIST.md) | Catálogo de casos A–G |
| [`QA_GUIDE.md`](QA_GUIDE.md) | Cómo registrar corridas |
| [`qa-runs/2026-06-10.md`](qa-runs/2026-06-10.md) | Corrida automatizada inicial |
| [`qa-runs/2026-06-10-session2.md`](qa-runs/2026-06-10-session2.md) | Cierre diagnóstico + pendientes |
| [`plan-actual.md`](plan-actual.md) | Fases 8–13 detalladas con líneas de código |
| [`API_CONTRACTS.md`](API_CONTRACTS.md) | Contratos al tocar endpoints |

---

## 7. Definición de “QA cerrado” para release

1. Diagnóstico QA **cerrado** (session 2) ✅  
2. **Sprint 1–5** implementados y re-QA ✅  
3. `run_qa_session2.py` + `run_qa_smoke.py` + CI F1–F5 verdes ✅ (2026-06-13)  
4. `run_qa_full.py`: 45 pass; A6 puede fallar por **429** al encadenar logins — no bloqueante si session2 pasa A6 aislado ✅  
5. Corrida manual opcional: guards UI (A10), DevTools (S4), modal D8  
6. Evidencia release: [`qa-runs/2026-06-13-qa-release-closure.md`](qa-runs/2026-06-13-qa-release-closure.md)

**Estado:** **QA RELEASE OK** — listo para commit/tag de release tras revisión de cambios en working tree.

---

*Generado a partir de la corrida QA 2026-06-10. Actualizar este documento al cerrar cada sprint.*
