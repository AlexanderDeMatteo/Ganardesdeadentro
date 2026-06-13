# Prueba manual — Gestión de entrenadores e invitaciones

Requisitos: backend Flask en `:5000`, frontend Next en `:3000`, `.env.local` con `NEXT_PUBLIC_DATA_SOURCE_USERS=api` (o modo API completo). Opcional: `RESEND_API_KEY` en `backend/.env` para correo real.

## 1. Invitar entrenador (admin)

1. Inicia sesión como admin.
2. Ve a `/admin/trainers`.
3. Pulsa **Invitar entrenador** y completa email, nombre, apellido y especialización.
4. Esperado: toast de éxito; tarjeta con badge **Pendiente activación**.
5. Sin `RESEND_API_KEY`: revisa logs del backend (envío simulado). Con Resend: revisa bandeja o dashboard de Resend.

**Entrenadores demo (desarrollo):** al arrancar el backend con `SEED_DEMO_TRAINERS=true` (default en development) se crean 3 entrenadores activos si no existen:

| Email | Contraseña | Especialización |
|-------|------------|-----------------|
| `trainer1@fittrack.demo` | `password123` | Fuerza |
| `trainer2@fittrack.demo` | `password123` | Cardio |
| `trainer3@fittrack.demo` | `password123` | HIIT |

Reinicia el contenedor backend (`docker compose -p fittrack restart fittrack-backend`) para ejecutar el seed en una BD ya existente solo si aún no están esos emails.

## 2. Activar cuenta del entrenador

1. Abre el enlace del correo (`/activate?token=...`) o usa el token desde prueba automatizada.
2. Define contraseña (mín. 8 caracteres) y confirma.
3. Esperado: redirección a `/login`; login con el email invitado funciona con rol `trainer`.

## 3. Reenviar invitación

1. Con un entrenador pendiente, pulsa **Reenviar invitación**.
2. Esperado: toast de éxito; el enlace anterior deja de ser válido.

## 4. Asignar atletas

1. Ve a `/admin/assignments` o `/admin/athletes`.
2. Asigna un atleta sin entrenador desde **Asignar entrenador**.
3. Reasigna otro atleta con **Reasignar** o quítalo con **Quitar**.
4. Esperado: contadores y listas se actualizan; el entrenador ve al atleta en `/trainer`.

## 5. Eliminar entrenador activo

1. En `/admin/trainers`, pulsa **Eliminar** en un entrenador con atletas.
2. Para cada atleta elige **Reasignar** o **Dejar sin entrenador**.
3. Confirma la baja.
4. Esperado: entrenador desaparece de asignaciones activas (`is_active=false`); atletas según la decisión del modal.

## Validación automatizada

```bash
cd backend && python -m pytest tests/test_trainer_invitations.py -q
cd .. && pnpm lint && pnpm typecheck && pnpm test
```
