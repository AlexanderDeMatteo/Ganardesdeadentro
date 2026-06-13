# Guía de Prueba — Fase 1: Cableado frontend ↔ backend (modo API)

Valida que el adaptador remoto (`lib/data/client.remote.ts`) consume correctamente los endpoints Flask conectados en la Fase 1:
admin overview, CRUD de planes de membresía, actualización de atleta y asignación de entrenador.

> Contexto técnico: [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) · Plan: [docs/plan-actual.md](docs/plan-actual.md) (Fase 1).

---

## Requisitos previos

- Backend Flask levantado en `http://localhost:5000` con base de datos sembrada (admin, trainer y atleta existentes).
- Frontend Next.js en `http://localhost:3000`.
- Archivo `.env.local` (o variables de entorno) en modo **API** para los dominios de la Fase 1.

### Variables de entorno (frontend)

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_AUTH_SOURCE=api
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS=api
NEXT_PUBLIC_DATA_SOURCE_USERS=api
```

> `getAdminOverview` se resuelve con el cliente global, por lo que requiere `NEXT_PUBLIC_DATA_SOURCE=api`.
> El CRUD de planes sigue `NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS`; `assignTrainerToAthlete`/`updateAthlete` siguen `NEXT_PUBLIC_DATA_SOURCE_USERS`.

### Arranque

```powershell
# Backend
cd backend
python run.py

# Frontend (otra terminal, desde la raíz)
npm run dev
```

Alternativa Docker (piloto híbrido ya configurado):

```powershell
docker compose -p fittrack up --build -d
```

---

## Caso 1 — KPIs reales del panel admin (`getAdminOverview`)

1. Inicia sesión con un usuario **admin**.
2. Navega a `/admin`.
3. Verifica que las tarjetas KPI muestran datos del backend:
   - **Atletas Total** = `athleteCount`.
   - **Sin Entrenador** = `athletesWithoutTrainer`.
   - **Entrenadores** = `trainerCount`.
   - Cuarta tarjeta = **Asignaciones Activas** (`assignmentCount`) cuando hay overview.
4. En "Resumen Rápido" debe aparecer **Entrenadores sin atletas** (`trainersWithoutAthletes`).
5. Abre DevTools → Network y confirma una llamada **`GET /api/admin/overview`** con `200` y cabecera `Authorization: Bearer ...`.

**Resultado esperado:** los números coinciden con la base de datos (no con los seeds locales). Mientras carga, se muestra "Cargando panel de administración…".

**Caso negativo:** inicia sesión con un atleta y entra a `/api/admin/overview` (o navega a `/admin`); el backend responde `403`.

---

## Caso 2 — Listado de planes visible para atleta (`GET /api/memberships/plans`)

1. Inicia sesión con un usuario **atleta** (rol `user`).
2. Navega a `/memberships`.
3. Verifica que se listan los planes (Básica/Premium/Pro u otros existentes en BD) **sin error 403**.
4. En Network confirma **`GET /api/memberships/plans`** con `200`.
5. Si el atleta tiene membresía, comprueba que la tarjeta de su plan se marca como **"Plan Actual"**.

**Resultado esperado:** el atleta ve el catálogo. Antes de la Fase 1 este endpoint era solo-admin y devolvía `403`.

---

## Caso 3 — CRUD de planes (solo admin)

Inicia sesión como **admin** y ve a `/admin/memberships`.

### 3.1 Crear (`POST /api/memberships/plans`)
1. Crea un plan nuevo (nombre, precio, descripción, features, duración, color).
2. Network: `POST /api/memberships/plans` → `201`.
3. El plan aparece en la lista tras el refetch.

### 3.2 Editar (`PATCH /api/memberships/plans/:id`)
1. Edita el plan creado (p. ej. cambia el precio).
2. Network: `PATCH /api/memberships/plans/:id` → `200`.
3. El cambio se refleja en la lista.

### 3.3 Eliminar (`DELETE /api/memberships/plans/:id`)
1. Elimina el plan.
2. Network: `DELETE /api/memberships/plans/:id` → `200`.
3. El plan desaparece de la lista (soft-delete: `is_active=False` en backend).

**Caso negativo (autorización):** ya cubierto por tests automatizados (`test_user_cannot_create_plan`, `test_user_cannot_update_plan`, `test_user_cannot_delete_plan`). Opcional: con sesión de atleta, un `POST/PATCH/DELETE` a `/api/memberships/plans` debe devolver `403`.

---

## Caso 4 — Asignar entrenador a atleta (`assignTrainerToAthlete`)

1. Inicia sesión como **admin** y ve a `/admin/athletes`.
2. En un atleta **sin entrenador**, pulsa **Asignar Entrenador** y selecciona uno.
3. Verifica:
   - Network: **`PUT /api/users/athletes/:id/trainer`** con body `{ "trainerId": "<id>" }` → `200`.
   - Aparece el toast **"Entrenador asignado correctamente"**.
   - El modal no se cierra hasta completar la operación (estado `isAssigning`).
4. Vuelve a `/admin`: el KPI **Sin Entrenador** debe **disminuir** (se llamó `refreshOverview`).

**Caso negativo (error de red/permiso):** detén el backend y reintenta la asignación; debe mostrarse el toast **"No se pudo asignar el entrenador"** y la UI no debe quedar bloqueada.

---

## Caso 5 — Actualizar atleta (`updateAthlete`) [contrato]

> No hay UI que invoque `updateAthlete` todavía (se implementó por completitud de contrato). Validación opcional vía consola o REST client.

1. Como admin, ejecuta un `PATCH /api/users/athletes/:id` con `{ "name": "Nuevo Nombre" }`.
2. Esperado: `200` y `{ athlete: {...} }` con el nombre actualizado.
3. **Limitación conocida (Fase 2.3):** enviar `membershipLevel` **no** persiste todavía (el backend lo ignora). No lo consideres un fallo de la Fase 1.

---

## Validación automatizada complementaria

```powershell
# Backend (46 tests, incluye los nuevos de memberships)
cd backend
python -m pytest

# Frontend
npm run lint
npm run typecheck
npm run build   # requiere acceso de red para Google Fonts
```

---

## Checklist de cierre de Fase 1

- [ ] Caso 1: `/admin` muestra KPIs reales del backend (admin) y `403` para atleta.
- [ ] Caso 2: atleta lista planes en `/memberships` sin `403`.
- [ ] Caso 3: admin crea / edita / elimina planes (201 / 200 / 200).
- [ ] Caso 4: asignación de entrenador funciona, refresca KPIs y maneja error con toast.
- [ ] Caso 5 (opcional): `PATCH` de atleta responde `200`; `membershipLevel` no persiste (esperado).
- [ ] `pytest`, `lint`, `typecheck` en verde; `build` en verde con red disponible.

> Notas: las tablas de atletas/entrenadores del panel admin siguen leyendo seeds hasta la Fase 4.3.
> Eliminar `localStorage.setItem('user')` en la compra de membresía queda para la Fase 4.2.
