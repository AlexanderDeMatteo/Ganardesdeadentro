# Guía de Prueba — Autenticación API (Flask JWT)

Valida el flujo de autenticación contra `/api/auth/*` con `NEXT_PUBLIC_AUTH_SOURCE=api`.

> Tests automatizados: [`backend/tests/test_auth.py`](backend/tests/test_auth.py) · Plan: [docs/plan-actual.md](docs/plan-actual.md) (Fase 6).

---

## Requisitos previos

- Backend Flask en `http://localhost:5000`
- Frontend en `http://localhost:3000` con:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_AUTH_SOURCE=api
```

---

## Register

1. `POST /api/auth/register` con `{ email, password, first_name, last_name }` → **201**
2. Respuesta incluye `access_token` y `user.role === 'user'`
3. Enviar `role: 'admin'` en body → ignorado (sigue `user`)

**Negativo:** email duplicado → **400**; email inválido → **400**; password corta → **400**

---

## Login

1. `POST /api/auth/login` con credenciales válidas → **200** + `access_token`
2. Credenciales incorrectas → **401**
3. Usuario `is_active=false` en BD → **401**

---

## Sesión (`/api/auth/me`)

1. `GET /api/auth/me` sin Bearer → **401**
2. Con JWT válido → **200** + `user` (+ `membership` si hay plan activo)
3. JWT de usuario desactivado tras emisión → **401**

---

## Logout

1. `POST /api/auth/logout` sin token → **401**
2. Con JWT válido → **200** `{ message: 'Sesión cerrada' }`
3. Frontend: borrar token local y redirigir a `/login`

---

## Change password

1. `POST /api/auth/change-password` con `old_password` + `new_password` → **200**
2. Login con nueva contraseña funciona
3. `old_password` incorrecta → **400**

---

## Validación automatizada

```powershell
cd backend
python -m pytest tests/test_auth.py -q
```
