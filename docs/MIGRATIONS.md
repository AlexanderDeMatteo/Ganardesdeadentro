# Estrategia de migraciones de base de datos

## Estado actual

- Modelos ORM en `backend/app/models.py` (users, memberships, routines, metrics, exercises, sessions, nutrition, weekly plans).
- **Alembic** configurado en `backend/alembic/` con `alembic.ini`.
- Desarrollo local: `init_db()` sigue creando tablas al arrancar Flask; Alembic versiona el esquema para despliegues.

## Comandos

Desde `backend/`:

```bash
# Aplicar migraciones
alembic upgrade head

# Crear revisión autogenerada tras cambiar models.py
alembic revision --autogenerate -m "descripcion"

# Ver historial
alembic history
```

Variables: `DATABASE_URL` / `ENVIRONMENT` (ver `backend/.env.example`).

## Flujo recomendado

1. Modificar `backend/app/models.py`.
2. `alembic revision --autogenerate -m "..."`.
3. Revisar la revisión generada en `alembic/versions/`.
4. `alembic upgrade head` en local y CI antes de arrancar el backend.

## Alternativa temporal (solo desarrollo)

- Borrar/recrear SQLite local: `drop_db()` + `init_db()` o eliminar el archivo `.db`.
- **No usar** en producción ni con datos reales de usuarios.

## Notas

- La revisión `001_initial` documenta el baseline; instalaciones nuevas pueden usar `create_all` o `alembic upgrade head`.
- El frontend en modo `local` no migra datos mock a Flask; la integración `DATA_SOURCE=api` es independiente.
