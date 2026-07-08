# Plan de seguridad web — Be a Gainer

Documento de implementación derivado del estudio de seguridad (jun 2026). Alineado con [plan-actual.md](./plan-actual.md) (Fases 7 y 13) y [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md).

**Última revisión:** 25 jun 2026  
**Estado:** pendiente de ejecución por sprints

---

## Resumen

Plan de endurecimiento en **4 sprints**: rate limiting global, headers HTTP, corrección de IDOR, validación de uploads, infraestructura de producción y controles avanzados.

**Fuera de este plan (fase posterior):** migración JWT de `localStorage` a cookies HttpOnly + CSRF ([Fase 13.3](./plan-actual.md)).

---

## Checklist de sprints

| ID | Sprint | Tarea | Estado |
|----|--------|-------|--------|
| S1.1 | 1 | Rate limit global Flask + límites por endpoint | ⬜ |
| S1.2 | 1 | IDOR execution-media + migración ownership | ⬜ |
| S1.3 | 1 | Headers de seguridad básicos en Next | ⬜ |
| S1.4 | 1 | Rate limit en media pública de ejercicios | ⬜ |
| S2.1 | 2 | Sanitización texto libre (`bleach`) | ⬜ |
| S2.2 | 2 | Validación magic bytes en uploads | ⬜ |
| S2.3 | 2 | CSP básica en Next | ⬜ |
| S2.4 | 2 | Schemas Pydantic en auth | ⬜ |
| S2.5 | 2 | Endurecer política de contraseñas | ⬜ |
| S3.1 | 3 | Gunicorn + Socket.IO | ✅ |
| S3.2 | 3 | Healthchecks Docker | ✅ |
| S3.3 | 3 | Redis rate limit Flask (dev + prod) | ✅ |
| S3.4 | 3 | Redis rate limit Titan | ✅ |
| S3.5 | 3 | Headers HSTS/CSP en reverse proxy (doc) | ✅ |
| S4.1 | 4 | CAPTCHA en registro | ⬜ |
| S4.2 | 4 | Log de auditoría acciones sensibles | ⬜ |
| S4.3 | 4 | Estrategia refresh token (diseño/doc) | ⬜ |
| S4.4 | 4 | Escaneo dependencias en CI | ⬜ |
| S4.5 | 4 | Actualizar PRODUCTION_READINESS | ⬜ |
| D1 | Diferido | Fase 13.3 — cookies HttpOnly + CSRF | ⬜ |

---

## Contexto y decisiones

- **Alcance:** plan completo (4 sprints), alineado con Fases 7 y 13 de [plan-actual.md](./plan-actual.md).
- **Diferido:** migración JWT de [`lib/auth/session-store.ts`](../lib/auth/session-store.ts) a cookies HttpOnly + CSRF (Fase 13.3).
- **Estado base:** auth con rate limit parcial ([`backend/app/routes/auth.py`](../backend/app/routes/auth.py)), Titan con rate limit en memoria ([`lib/api/titan-route-guard.ts`](../lib/api/titan-route-guard.ts)), autorización sólida ([`backend/app/utils/authorization.py`](../backend/app/utils/authorization.py)), Redis en [`docker-compose.prod.yml`](../docker-compose.prod.yml).

```mermaid
flowchart LR
  subgraph sprint1 [Sprint 1]
    GlobalRL[Rate limit global Flask]
    PublicRL[Rate limit endpoints publicos]
    Headers[Headers HTTP Next]
    IDOR[Fix IDOR execution-media]
  end
  subgraph sprint2 [Sprint 2]
    Sanitize[Sanitizacion texto libre]
    UploadVal[Validacion magic bytes]
    CSP[CSP basica]
    AuthSchemas[Pydantic en auth]
  end
  subgraph sprint3 [Sprint 3]
    Gunicorn[Gunicorn backend]
    Health[Healthchecks Docker]
    RedisTitan[Redis rate limit Titan]
    RedisFlask[Redis rate limit Flask dev/prod]
  end
  subgraph sprint4 [Sprint 4]
    CAPTCHA[CAPTCHA register]
    Audit[Log auditoria]
    CI[Scans dependencias CI]
    RefreshDoc[Estrategia refresh token]
  end
  sprint1 --> sprint2 --> sprint3 --> sprint4
  sprint4 -.->|diferido| JWT[Fase 13.3 cookies HttpOnly]
```

---

## Sprint 1 — Rate limiting y quick wins (prioridad inmediata)

Objetivo: evitar sobrecarga y abuso en toda la API, cerrar el IDOR más claro, y añadir headers básicos.

### 1.1 Rate limit global en Flask

**Archivos:** [`backend/app/extensions.py`](../backend/app/extensions.py), [`backend/app/config.py`](../backend/app/config.py), [`backend/.env.example`](../backend/.env.example), [`backend/.env.hosting.example`](../backend/.env.hosting.example)

Hoy el limiter tiene `default_limits=[]`:

```python
limiter = Limiter(key_func=get_remote_address, default_limits=[])
```

**Cambios propuestos:**

| Variable | Valor sugerido | Aplica a |
|----------|----------------|----------|
| `GLOBAL_RATE_LIMIT` | `120 per minute` | Todas las rutas Flask (por IP) |
| `AUTH_RATE_LIMIT` | `10 per minute` | Ya existe; mantener |
| `PUBLIC_API_RATE_LIMIT` | `60 per minute` | Endpoints públicos de ejercicios |
| `UPLOAD_RATE_LIMIT` | `10 per minute` | Uploads multipart (por usuario JWT) |

Implementación:

- Pasar `default_limits` desde config al crear `Limiter` (Flask-Limiter lee `RATELIMIT_STORAGE_URI` y `RATELIMIT_ENABLED` vía `limiter.init_app(app)`).
- Decoradores adicionales en rutas sensibles:
  - [`backend/app/routes/exercises.py`](../backend/app/routes/exercises.py): `GET /muscles`, `GET /by-muscle/<muscle>`, `GET /media/<filename>` → límite público por IP.
  - [`backend/app/routes/sessions.py`](../backend/app/routes/sessions.py), POST media en exercises, POST payment con receipt en memberships → límite por usuario con `key_func` basado en `get_jwt_identity()`.
- Extender patrón de [`backend/tests/test_authz.py`](../backend/tests/test_authz.py) (`TestRateLimiting`) con test de 429 en endpoint no-auth.
- Documentar que scripts QA deben reiniciar backend entre suites (ver [qa-runs/2026-06-10-session2.md](./qa-runs/2026-06-10-session2.md)).

### 1.2 Corregir IDOR en videos de sesión

**Archivos:** [`backend/app/services/session_execution_media_service.py`](../backend/app/services/session_execution_media_service.py), [`backend/app/routes/sessions.py`](../backend/app/routes/sessions.py), nueva migración Alembic, [`backend/app/models.py`](../backend/app/models.py)

Problema: `GET /api/sessions/execution-media/<filename>` exige JWT pero no valida ownership.

**Solución mínima:**

- Tabla o columna que asocie `filename → athlete_id` (y opcionalmente `uploaded_by_id`) al subir.
- En GET: resolver filename, comprobar `require_athlete_access(athlete_id)` antes de `send_file`.
- Tests en [`backend/tests/test_session_execution_media.py`](../backend/tests/test_session_execution_media.py): atleta A no puede leer media de atleta B.

### 1.3 Headers de seguridad en Next.js

**Archivo:** [`next.config.mjs`](../next.config.mjs)

Añadir `async headers()` con:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictiva (camera, microphone, geolocation desactivados)

CSP completa se deja para Sprint 2.

### 1.4 Proteger media de ejercicios

**Archivo:** [`backend/app/routes/exercises.py`](../backend/app/routes/exercises.py)

- **Mínimo:** rate limit estricto (`PUBLIC_API_RATE_LIMIT`) en `GET /media/<filename>`.
- **Opcional (piloto):** exigir `@jwt_required()` o URLs firmadas; evaluar impacto en `<img src>`.

**Validación Sprint 1:**

- `cd backend && python -m pytest -q`
- `pnpm lint && pnpm typecheck`
- Manual: 121 requests a `/api/health` en 1 min → 429; atleta B recibe 403 al pedir media de A

---

## Sprint 2 — XSS en profundidad, uploads y validación unificada

Objetivo: defensa en profundidad contra inyección de scripts y archivos maliciosos, sin tocar sesión JWT aún.

### 2.1 Sanitización backend en campos de texto libre

**Archivos:** nuevo `backend/app/utils/sanitize.py`, [`backend/app/services/support_service.py`](../backend/app/services/support_service.py), [`backend/app/services/auth_service.py`](../backend/app/services/auth_service.py)

- Añadir `bleach` en [`backend/requirements.txt`](../backend/requirements.txt).
- Función `sanitize_plain_text(value, max_len)` que elimine tags HTML y normalice whitespace.
- Aplicar en mensajes de soporte, nombres de usuario, notas libres en rutinas/ejercicios.

### 2.2 Validación de uploads por contenido real

**Archivos:** [`backend/app/services/payment_service.py`](../backend/app/services/payment_service.py), [`backend/app/services/custom_exercise_service.py`](../backend/app/services/custom_exercise_service.py), [`backend/app/services/session_execution_media_service.py`](../backend/app/services/session_execution_media_service.py)

- Añadir `filetype` (portable en Windows/Docker).
- Leer magic bytes y comparar con allowlist (no confiar solo en `file.mimetype`).
- Tests: subir archivo con MIME falso → 400.

### 2.3 CSP básica en Next

**Archivo:** [`next.config.mjs`](../next.config.mjs)

- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (ajustar según build Next/Tailwind)
- `connect-src 'self'` + API + Ollama interno
- `img-src 'self' data: blob:` + dominio API para media

Documentar excepciones en [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

### 2.4 Unificar validación auth con Pydantic

**Archivos:** [`backend/app/schemas/request_schemas.py`](../backend/app/schemas/request_schemas.py), [`backend/app/routes/auth.py`](../backend/app/routes/auth.py)

- Schemas `RegisterSchema`, `LoginSchema`, `ChangePasswordSchema`.
- Sustituir checks manuales en register/login/change-password.

### 2.5 Endurecer contraseñas

- Rechazo de contraseñas triviales en `AuthService`.
- Documentar política en [`components/auth/register-form.tsx`](../components/auth/register-form.tsx).

**Validación Sprint 2:**

- pytest sanitize + upload rejection
- Manual: `<script>alert(1)</script>` en soporte → texto plano, no ejecuta

---

## Sprint 3 — Infraestructura de producción (Fase 7)

Objetivo: runtime seguro, rate limits distribuidos, observabilidad mínima. Ítems 7.1, 7.3, 7.7 de [plan-actual.md](./plan-actual.md).

### 3.1 Gunicorn + Socket.IO

**Archivos:** [`backend/run.py`](../backend/run.py), entrypoint/Dockerfile, [`docker-compose.prod.yml`](../docker-compose.prod.yml)

- Reemplazar `socketio.run(..., allow_unsafe_werkzeug=True)` por Gunicorn con worker compatible (`eventlet` o `gevent`).
- Forzar `DEBUG=False` en producción.
- Documentar en [DEPLOY_MAC_MINI.md](./DEPLOY_MAC_MINI.md).

### 3.2 Healthchecks Docker

**Archivos:** [`docker-compose.yml`](../docker-compose.yml), [`docker-compose.prod.yml`](../docker-compose.prod.yml)

- Backend: `GET /api/health`
- Frontend: curl a `:3000`
- Redis: `redis-cli ping`

### 3.3 Redis rate limit Flask (dev + prod)

- Añadir `fittrack-redis` en compose dev.
- `RATELIMIT_STORAGE_URI=redis://fittrack-redis:6379` en dev y prod.

### 3.4 Redis rate limit Titan (Fase 7.7)

**Archivos:** [`lib/api/titan-route-guard.ts`](../lib/api/titan-route-guard.ts), [`package.json`](../package.json)

- Añadir `ioredis`; usar Redis cuando `TITAN_RATELIMIT_REDIS_URL` esté definido; fallback `Map` en local.
- Tests en [`lib/api/titan-route-guard.test.ts`](../lib/api/titan-route-guard.test.ts).

### 3.5 Headers en reverse proxy

- Documentar HSTS y CSP adicionales para Cloudflare/nginx en [DEPLOY_MAC_MINI.md](./DEPLOY_MAC_MINI.md).

**Validación Sprint 3:**

- `docker compose -f docker-compose.prod.yml config` OK
- Dry run: healthchecks verdes, rate limit Titan persistente tras reinicio

---

## Sprint 4 — Controles avanzados y go-live

### 4.1 CAPTCHA en registro

- Cloudflare Turnstile (recomendado).
- `TURNSTILE_SECRET_KEY` (backend), `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (frontend).

### 4.2 Log de auditoría

- Modelo `AuditLog`, migración, `backend/app/utils/audit.py`.
- Registrar: login fallido, cambio password, pagos, trainers, membresías (sin tokens ni PII innecesaria).

### 4.3 Estrategia refresh token (Fase 13.2)

- Documentar refresh rotativo vs TTL 24h + re-login.
- Opcional: `/api/auth/refresh`, blacklist en logout.
- **No incluye** cookies HttpOnly (13.3).

### 4.4 Escaneo dependencias en CI

- `pip-audit` (backend), `pnpm audit` (frontend) en [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

### 4.5 Actualizar go-live

- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md), [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

---

## Diferido — Fase 13.3 (sesión HttpOnly)

Ejecutar **después** de Sprint 4:

| Cambio | Archivos clave |
|--------|----------------|
| JWT en cookie HttpOnly desde Flask | [`backend/app/routes/auth.py`](../backend/app/routes/auth.py) |
| CSRF double-submit | Flask-JWT-Extended |
| Frontend sin `localStorage` | [`lib/auth/session-store.ts`](../lib/auth/session-store.ts), [`lib/api/http-client.ts`](../lib/api/http-client.ts) |
| Middleware Titan | [`middleware.ts`](../middleware.ts), [`lib/api/titan-route-guard.ts`](../lib/api/titan-route-guard.ts) |
| Socket.IO | [`app/context/realtime-context.tsx`](../app/context/realtime-context.tsx) |

Impacto alto en CORS, pruebas E2E y scripts QA.

---

## Orden de ejecución recomendado

1. **Sprint 1** — rate limit + IDOR + headers
2. **Sprint 3** — antes de piloto en internet (Gunicorn + Redis + healthchecks)
3. **Sprint 2** — XSS/uploads
4. **Sprint 4** — CAPTCHA, auditoría, CI
5. **Fase 13.3** — producción abierta a usuarios no confiables

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Tests QA fallan con 429 | Límites altos en `ENVIRONMENT=testing`; reiniciar backend entre suites |
| CSP rompe UI | CSP report-only primero o iterar excepciones |
| Media ejercicios con JWT rompe `<img>` | Proxy autenticado o URLs firmadas |
| Gunicorn + Socket.IO | Probar en compose dev antes de prod |

---

## Enlaces relacionados

- [plan-actual.md](./plan-actual.md) — Fases 2, 3, 7, 13
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) — criterios go-live
- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) — arquitectura y riesgos conocidos
- Reglas Cursor: `.cursor/rules/security-core.mdc`, `python-backend-security.mdc`, `frontend-security.mdc`
