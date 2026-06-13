# Guía de Prueba — Docker Compose (piloto API)

Valida el stack local con [`docker-compose.yml`](docker-compose.yml): frontend Next + backend Flask con flags API.

> Plan: [docs/plan-actual.md](docs/plan-actual.md) (Fase 6). Healthchecks formales → Fase 7.

---

## Arranque

```powershell
docker compose -p fittrack up --build
```

Servicios esperados:

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |

---

## Smoke checks

1. `GET http://localhost:5000/api/health` → `{ "status": "ok" }`
2. Frontend carga sin error de conexión al backend
3. Login admin/trainer/atleta con usuarios sembrados en BD

Variables del compose (frontend):

- `NEXT_PUBLIC_AUTH_SOURCE=api`
- `NEXT_PUBLIC_DATA_SOURCE=api`
- Overrides por dominio en `api`

---

## Flujo E2E mínimo

1. **Admin:** login → `/admin` → overview con conteos reales
2. **Trainer:** crear rutina → asignar a atleta
3. **Atleta:** ver rutina asignada → registrar métrica

---

## Pytest dentro del contenedor backend

```powershell
docker compose -p fittrack run --rm -e ENVIRONMENT=testing fittrack-backend python -m pytest tests/ -q
```

(Ver también [`SETUP_INSTRUCTIONS.md`](SETUP_INSTRUCTIONS.md).)

---

## Limitaciones conocidas

- Sin healthchecks en compose (Fase 7)
- Ollama no incluido; rutas Titan usan fallback servidor
- Migraciones: verificar `alembic upgrade head` en despliegues persistentes (Fase 7.4)

---

## CI

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) ejecuta pytest y `pnpm lint/typecheck/test/build` en cada push/PR a `main`.
