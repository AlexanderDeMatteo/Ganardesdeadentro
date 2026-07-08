# Production Readiness — Be a Gainer / FitTrack

Documento único de decisión de go-live. **El veredicto vive aquí**, no en conversaciones ni en `plan-actual.md`.

**Última revisión:** 25 jun 2026  
**Revisor:** sprint de sincronización documental + verificaciones locales

---

## Decisión actual

| Escenario | Veredicto | Notas |
|-----------|-----------|-------|
| **Piloto cerrado** (pocos usuarios, Mac Mini + tunnel) | **Posible con reservas** | Completar bloqueantes operativos (JWT, Resend, URLs/CORS, backup) |
| **Producción abierta** (internet, pagos, invitaciones) | **No aún** | Faltan runtime backend prod, healthchecks, legales, observabilidad y endurecimiento de sesión |

---

## Evidencia ejecutada (25 jun 2026)

Entorno: Windows, Python 3.14, Node 20, pnpm.

| Check | Comando | Resultado |
|-------|---------|-----------|
| Backend tests | `cd backend && python -m pytest -q` | **195 passed, 2 failed** (~197 tests) |
| Lint | `pnpm lint` | **OK** (0 errores, 6 warnings) |
| Typecheck | `pnpm typecheck` | **OK** |
| Vitest | `pnpm test` | **95 passed** (23 archivos) |
| Build | `pnpm build` | **OK** |
| Compose prod config | `docker compose -p fittrack -f docker-compose.prod.yml config` | **OK** |
| Compose prod up | `docker compose -p fittrack -f docker-compose.prod.yml up --build -d` | **No ejecutado** en esta corrida (build largo; validar manualmente antes de go-live) |

### Fallos conocidos en pytest

Los 2 fallos son en `tests/test_trainer_invitations.py` (`test_admin_creates_trainer_invitation`, `test_admin_resend_invite`) cuando `RESEND_API_KEY` está definida en `backend/.env` y el entorno no puede resolver `api.resend.com`. No indican regresión de lógica de invitaciones; indican **aislamiento de tests vs variables reales de entorno**. CI usa `ENVIRONMENT=testing` sin clave Resend real.

### Evidencia histórica (no sustituye la corrida anterior)

- QA release closure: [qa-runs/2026-06-13-qa-release-closure.md](./qa-runs/2026-06-13-qa-release-closure.md) — **QA RELEASE OK** para Docker dev/API (13 jun 2026).
- CI en `main`: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — pytest + lint + typecheck + Vitest + build.

---

## Criterios bloqueantes (todos deben ser ✅ antes de piloto)

| # | Criterio | Estado | Acción |
|---|----------|--------|--------|
| B1 | `JWT_SECRET_KEY` seguro en `backend/.env` (no valor de desarrollo) | ⬜ Verificar en hosting | `openssl rand -hex 32` — ver [DEPLOY_MAC_MINI.md](./DEPLOY_MAC_MINI.md) |
| B2 | `RESEND_API_KEY` configurada y flujo invitación trainer probado de punta a punta | ⬜ Operativo | Ver Fase 9.2 en [plan-actual.md](./plan-actual.md) |
| B3 | URLs públicas alineadas: `CORS_ORIGINS`, `FRONTEND_URL`, `NEXT_PUBLIC_API_BASE_URL` | ⬜ En tunnel/prod | Sin barra final; deben coincidir exactamente |
| B4 | Backup del volumen `fittrack_backend_data` programado | ⬜ Operativo | [deploy/backup-data.sh.example](../deploy/backup-data.sh.example) |
| B5 | Smoke manual de flujos críticos en modo API | ⬜ Manual | [TEST_DOCKER.md](../TEST_DOCKER.md), [TEST_PAYMENT_FLOW.md](../TEST_PAYMENT_FLOW.md), [TEST_ADMIN_TRAINERS.md](../TEST_ADMIN_TRAINERS.md) |
| B6 | Dry run `docker-compose.prod.yml` completo (`up` + health + login) | ⬜ Pendiente | Primera vez tarda varios minutos (`next build` en contenedor) |

---

## Criterios recomendados (producción abierta)

| # | Criterio | Estado | Referencia |
|---|----------|--------|------------|
| R1 | Runtime backend de producción (Gunicorn + worker WebSocket) | ✅ Implementado | [backend/docker-entrypoint.sh](../backend/docker-entrypoint.sh), [backend/run.py](../backend/run.py) |
| R2 | Healthchecks en Docker Compose | ✅ Implementado | [docker-compose.yml](../docker-compose.yml), [docker-compose.prod.yml](../docker-compose.prod.yml) |
| R3 | Rate limit Titan en Redis (fallback a `Map` local) | ✅ Implementado | [lib/api/titan-route-guard.ts](../lib/api/titan-route-guard.ts), Fase 7.7 |
| R4 | Páginas legales (`/terms` enlazado desde checkout; privacidad) | ❌ | Checkout referencia `/terms` sin ruta en `app/` |
| R5 | Observabilidad (Sentry o similar; alertas si `/api/health` falla) | ❌ | — |
| R6 | `error.tsx` / `not-found.tsx` personalizados | ❌ | — |
| R7 | JWT fuera de `localStorage` (cookies httpOnly + CSRF) | ❌ | Fase 13.3, [lib/auth/session-store.ts](../lib/auth/session-store.ts) |
| R8 | Estrategia de refresh token o TTL documentado | ❌ | Fase 13.2 |
| R9 | Tests de invitaciones aislados de `RESEND_API_KEY` real | ❌ | 2 fallos locales documentados arriba |
| R10 | Eliminar código muerto `app/admin/*` y `app/trainer/*` (redirects a v2) | ❌ | [next.config.mjs](../next.config.mjs) |

---

## Riesgos aceptados (piloto single-node)

| Riesgo | Mitigación |
|--------|------------|
| SQLite en un solo nodo | Backups frecuentes; no escalar horizontalmente sin migrar a PostgreSQL |
| JWT en `localStorage` | Piloto de confianza; planificar Fase 13.3 antes de escala |
| Ollama opcional en host | Titan responde con `source: fallback` si Ollama no está disponible |
| Email simulado sin Resend | **No aceptable** si se invitan trainers — bloqueante B2 |
| `init_db()` + Alembic al arrancar | Doble mecanismo de esquema; vigilar Fase 7.4 |

---

## Qué está listo (base sólida)

- Backend API completo: auth, users, routines, sessions, metrics, nutrition, memberships, payments, exchange-rates, notifications, support, admin, exercises.
- Frontend modo API completo en Docker dev y prod compose.
- Autorización backend endurecida (ownership, revalidación JWT vs BD, rate limit auth con Redis en prod).
- Backend prod con Gunicorn + WebSocket worker en entrypoint.
- Healthchecks de frontend/backend/redis en compose dev y prod.
- Titan con introspección JWT server-side y fallbacks.
- Titan rate limit distribuido en Redis cuando `TITAN_RATELIMIT_REDIS_URL` está definido.
- Interceptor global 401 en frontend.
- 12 migraciones Alembic (001–012).
- CI en `main`: pytest + lint + typecheck + Vitest + build.
- Guía de despliegue: [DEPLOY_MAC_MINI.md](./DEPLOY_MAC_MINI.md).

---

## Flujos críticos a validar manualmente (checklist 30 min)

- [ ] Registro/login atleta, trainer, admin
- [ ] Solicitud de pago con comprobante → aprobación admin → membresía activa
- [ ] Invitación trainer → correo → `/activate?token=...` → login
- [ ] Trainer: crear/editar rutina → asignar → atleta completa sesión
- [ ] Nutrición: plan coach + diario atleta + pestaña Diario en vista coach
- [ ] Token expirado / 401 → redirección a `/login`
- [ ] Titan: motivación y fallback si Ollama caído

---

## Mantenimiento de este documento

Actualizar cuando:

- Se complete un dry run prod exitoso.
- Se configure Resend, dominio y tunnel.
- Cambien criterios de go-live o se cierre un ítem de Fase 7/9.2/13.
- CI o conteos de tests cambien de forma significativa.

Enlaces desde: [README.md](../README.md), [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md), [plan-actual.md](./plan-actual.md).
