# Guía de Prueba — Docker Compose

Valida el stack local y de producción. Plan: [docs/plan-actual.md](docs/plan-actual.md). Go-live: [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md).

---

## Dos composes

| Archivo | Uso | Frontend | Backend |
|---------|-----|----------|---------|
| [`docker-compose.yml`](docker-compose.yml) | **Desarrollo diario** | `next dev` + bind mounts | Flask dev, SQLite en volumen |
| [`docker-compose.prod.yml`](docker-compose.prod.yml) | **Piloto / hosting** | `next build` + `next start` | Flask + Redis, `ENVIRONMENT=production` |

Ambos usan modo API completo en el frontend (`AUTH_SOURCE=api`, todos los `DATA_SOURCE_*=api`).

---

## Desarrollo (`docker-compose.yml`)

### Arranque

```powershell
docker compose -p fittrack up --build -d
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |

Requiere `backend/.env` (copiar desde `backend/.env.example`).

### Smoke checks

1. `GET http://localhost:5000/api/health` → `{ "status": "ok" }`
2. Frontend carga sin error de conexión al backend
3. Login/registro con usuarios en la BD del volumen

### Flujo E2E mínimo

1. **Admin:** login → `/admin-v2` → overview con conteos reales
2. **Trainer:** crear/editar rutina → asignar a atleta
3. **Atleta:** ver rutina → registrar métrica → nutrición

Guías adicionales: [TEST_AUTH_API.md](TEST_AUTH_API.md), [TEST_PAYMENT_FLOW.md](TEST_PAYMENT_FLOW.md), [TEST_ADMIN_TRAINERS.md](TEST_ADMIN_TRAINERS.md).

### Pytest dentro del contenedor

```powershell
docker compose -p fittrack run --rm -e ENVIRONMENT=testing fittrack-backend python -m pytest tests/ -q
```

---

## Producción (`docker-compose.prod.yml`)

Ver guía completa: [docs/DEPLOY_MAC_MINI.md](docs/DEPLOY_MAC_MINI.md).

### Preparar variables

```powershell
Copy-Item .env.hosting.example .env.hosting
Copy-Item backend\.env.hosting.example backend\.env
# Editar JWT_SECRET_KEY, CORS_ORIGINS, FRONTEND_URL, RESEND_API_KEY
```

### Validar y levantar

```powershell
docker compose -p fittrack -f docker-compose.prod.yml config
docker compose -p fittrack -f docker-compose.prod.yml up --build -d
```

El primer arranque puede tardar varios minutos (`next build` dentro del contenedor).

### Smoke prod

1. `curl http://127.0.0.1:5000/api/health`
2. http://127.0.0.1:3000 — login con cuenta real
3. Checklist bloqueantes en [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md)

---

## Limitaciones conocidas

- Sin healthchecks en compose (Fase 7.1)
- Ollama no incluido en compose; Titan usa fallback si no hay `OLLAMA_BASE_URL` en el host
- Backend prod usa `socketio.run` + Werkzeug (Gunicorn pendiente, Fase 7.3)
- Sin `RESEND_API_KEY`: invitaciones trainer simuladas (éxito falso en UI)
- Migraciones: `alembic upgrade head` en entrypoint + `init_db()` al arrancar (Fase 7.4)

---

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) — pytest + lint + typecheck + Vitest + build en push/PR a `main`.

**Última corrida local documentada (25 jun 2026):** pytest 195/197 passed; lint OK; typecheck OK; Vitest 95 passed; build OK; `docker-compose.prod.yml config` OK.
