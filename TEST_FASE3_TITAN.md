# Guía de Prueba — Fase 3: Seguridad capa IA Titan

Valida autenticación real, gating de membresía/rol y rate limiting en las rutas Next de Titan:
`/api/coach/titan`, `/api/coach/session-review`, `/api/nutrition/titan`.

> Contexto: [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) · Plan: [docs/plan-actual.md](docs/plan-actual.md) (Fase 3).

---

## Requisitos previos

- Backend Flask en `http://localhost:5000` con usuarios sembrados (admin, trainer, atleta Básica, atleta Premium/Pro).
- Frontend Next.js en `http://localhost:3000`.
- Ollama opcional (`ollama serve`); si está apagado, las rutas deben responder con `source: 'fallback'`.

### Variables de entorno (frontend)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_AUTH_SOURCE=api
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS=api

# Solo servidor Next (no NEXT_PUBLIC_*)
OLLAMA_BASE_URL=http://localhost:11434
# Opcional prod: TITAN_RATELIMIT_REDIS_URL=redis://localhost:6379
```

---

## Caso 1 — Sin token (`401`)

1. En terminal o REST client, envía `POST http://localhost:3000/api/coach/titan` **sin** cabecera `Authorization`.
2. Repite con `/api/coach/session-review` y `/api/nutrition/titan`.

**Esperado:** `401` con `{ "error": "Sesión requerida" }`.

---

## Caso 2 — Bearer inválido o usuario inactivo (`401`)

1. `POST /api/coach/titan` con `Authorization: Bearer token-invalido`.
2. Inicia sesión, desactiva el usuario en BD (`is_active=false`) y reutiliza su JWT.

**Esperado:** `401` con `{ "error": "Sesión inválida" }` (introspección contra Flask `/api/auth/me`).

---

## Caso 3 — Nutrición Titan: atleta Básica (`403`)

1. Inicia sesión como atleta con plan **Básica** (sin Premium/Pro).
2. Abre DevTools → Network.
3. Envía un mensaje al asistente nutricional Titan (o `POST /api/nutrition/titan` con body válido y Bearer).

**Esperado:** `403` — `{ "error": "Acceso restringido a membresías Premium o Pro" }`.
El body **no** debe incluir `membershipTier`/`userRole` (gating server-side desde `/api/auth/me`).

---

## Caso 4 — Nutrición Titan: Premium/Pro o admin (`200`)

1. Atleta Premium o Pro autenticado → asistente nutricional responde (`200`, `source: 'ollama'` o `'fallback'`).
2. Admin autenticado → mismo endpoint responde `200` aunque no tenga membresía.

**Esperado:** UI muestra asistente; Network confirma que `/api/auth/me` incluye `membership.name` tras login.

---

## Caso 5 — Motivación y session-review autenticados (`200`)

1. Atleta autenticado (cualquier plan) → dashboard carga frase Titan o fallback.
2. Completa/abandona sesión → session-review responde `200`.

**Esperado:** `403` solo si el rol verificado no es `user`, `trainer` o `admin`.

---

## Caso 6 — Rate limit (`429`)

1. Con el mismo usuario, envía >30 solicitudes/minuto a `/api/coach/titan` (script o bucle).
2. Clave de límite: `userId` verificado (no IP).

**Esperado:** `429` — `{ "error": "Demasiadas solicitudes..." }`.

---

## Caso 7 — Ollama caído (`200` fallback)

1. Detén Ollama (`ollama stop` o apaga el servicio).
2. `POST /api/coach/titan` autenticado.

**Esperado:** `200` con `{ frase, source: 'fallback' }` (no `503`).

---

## Validación automatizada

```powershell
cd backend
python -m pytest -q

cd ..
pnpm install
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

> Usar **pnpm** (lockfile `pnpm-lock.yaml`). Si `pnpm build` falla por Google Fonts sin red, reintenta con conectividad a `fonts.googleapis.com` (error preexistente del proyecto, no de Fase 3).
