# Guía de Prueba — Flujo de pagos y membresía

Valida el gating de membresía activa, solicitudes de pago con comprobante, aprobación admin y desbloqueo de rutinas/métricas/nutrición.

> Contexto: [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) · Contratos: [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md)

---

## Requisitos previos

- Backend Flask en `http://localhost:5000`
- Frontend Next.js en `http://localhost:3000`
- Variables en modo API (ver [`.env.local.api.example`](.env.local.api.example)):

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_AUTH_SOURCE=api
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS=api
NEXT_PUBLIC_DATA_SOURCE_ROUTINES=api
NEXT_PUBLIC_DATA_SOURCE_METRICS=api
NEXT_PUBLIC_DATA_SOURCE_NUTRITION=api
```

Docker:

```powershell
docker compose -p fittrack up --build -d
```

---

## Caso 1 — Atleta sin membresía bloqueado

1. Registra o inicia sesión como atleta **sin** membresía activa.
2. Navega a `/metrics` o `/routines`.
3. **Esperado:** redirección o bloqueo UX; API devuelve `403` con `code: membership_required`.
4. Navega a `/dashboard`, `/memberships`, `/profile`, `/support` — deben ser accesibles.

---

## Caso 2 — Solicitud de pago

1. Como atleta, ve a `/memberships`.
2. Elige un plan y completa el checkout (método de pago + comprobante JPG/PNG/PDF).
3. **Esperado:** solicitud en estado `pending`.
4. Network: `POST /api/memberships/payment-requests` → `201`.

---

## Caso 3 — Aprobación admin

1. Inicia sesión como **admin**.
2. Ve a `/admin-v2/payments`.
3. Aprueba la solicitud pendiente.
4. **Esperado:** membresía activa con `daysRemaining >= 29`.
5. Network: `GET /api/memberships/active?athleteId=` → `200` con plan asignado.

---

## Caso 4 — Desbloqueo post-aprobación

1. Como atleta (tras aprobación), refresca sesión (`/api/auth/me` o re-login).
2. Accede a `/metrics` y `/routines`.
3. **Esperado:** acceso permitido; nav completo visible.

---

## Caso 5 — Rechazo admin

1. Admin rechaza otra solicitud con motivo opcional.
2. **Esperado:** atleta sigue sin membresía; rutas premium bloqueadas.

---

## Caso 6 — Métodos y tasas (admin)

1. `/admin-v2/payment-methods` — crear/editar método.
2. `/admin-v2/exchange-rates` — CRUD tasa USD→VES.
3. **Esperado:** persistencia y listado público de métodos activos.

---

## Caso 7 — Comprobante (autorización)

1. Atleta dueño puede ver su comprobante (`GET .../receipt`).
2. Otro atleta recibe `403`.
3. Admin puede ver cualquier comprobante.

---

## Caso 8 — Asignación directa admin

1. Admin en `/admin-v2/athletes` → inspector → **Asignar plan**.
2. Selecciona plan y confirma.
3. **Esperado:** `PUT /api/memberships/users/:id` activa membresía sin pasar por pago.

---

## Automatizado (pytest)

```powershell
cd backend
python -m pytest tests/test_api_domains.py::TestPaymentFlow -q
```

Cubre: flujo approve, bloqueo sin membresía, CRUD métodos/tasas, snapshot de conversión.

---

## Registro QA

Documentar resultados en [`docs/qa-runs/2026-06-22-payment-flow.md`](docs/qa-runs/2026-06-22-payment-flow.md).
