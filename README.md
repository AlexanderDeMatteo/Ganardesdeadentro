# FitTrack - Plataforma de Entrenadores Personales

Una plataforma moderna y hermosa para gestionar entrenamientos personalizados, seguir el progreso fitness y conectar con entrenadores profesionales.

**Contexto técnico:** [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) · **Plan de trabajo:** [docs/plan-actual.md](docs/plan-actual.md) · **Go-live:** [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md) · **Despliegue prod:** [docs/DEPLOY_MAC_MINI.md](docs/DEPLOY_MAC_MINI.md)

## Características

✨ **Diseño Moderno y Responsivo**
- Interfaz hermosa con gradientes y animaciones suaves
- Totalmente responsiva para móvil, tablet y desktop
- Dark/Light mode compatible

💪 **Funcionalidades Principales**
- Autenticación JWT real (modo API en Docker y prod) o mock local (solo desarrollo UI sin backend)
- Dashboard personalizado con resumen, membresía y métricas
- Gestión de rutinas de entrenamiento y biblioteca de ejercicios (ExerciseDB)
- Seguimiento de métricas y composición corporal (peso, grasa, músculo, medidas)
- Gráficos interactivos de progreso
- Módulo de nutrición: cálculo de metabolismo (BMR/TDEE), macros objetivo,
  plan de comidas asignado por el entrenador, diario de alimentos, control de
  agua y adherencia semanal
- Titan: coach con IA (vía Ollama) que motiva, analiza tus sesiones de
  entrenamiento y estima calorías/macros de comidas de forma conversacional
- Planes de membresía (Básica, Premium, Pro) que desbloquean funciones
- Perfil de usuario con estadísticas

🎨 **Sistema de Diseño**
- Paleta de colores moderna (Azul oscuro, púrpura, verde)
- Componentes UI reutilizables con shadcn/ui
- Animaciones suaves y transiciones
- Tokens de diseño personalizados

## Cómo correr el proyecto

Hay **tres modos** de levantar FitTrack:

| Modo | Compose / comando | Datos | Uso |
|------|-------------------|-------|-----|
| **A — Docker dev** | `docker compose -p fittrack up -d` | API Flask (JWT real) | Desarrollo diario recomendado |
| **B — Docker prod** | `docker compose -p fittrack -f docker-compose.prod.yml up -d` | API + Redis + `next start` | Piloto / hosting — ver [DEPLOY_MAC_MINI.md](docs/DEPLOY_MAC_MINI.md) |
| **C — Local sin Docker** | `pnpm dev` + opcional `python run.py` | Mock (`local`) o API (`.env.local.api.example`) | Solo UI o backend aislado |

**Docker dev** es la opción recomendada para trabajo con datos reales.

### Opción A — Docker (recomendado)

Stack completo: Next.js en el puerto **3000** y Flask en el **5000**, con modo API activado en el frontend.

#### Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución
- Archivo `backend/.env` (copia la plantilla si no existe):

```powershell
Copy-Item backend\.env.example backend\.env
```

Edita `backend/.env` solo si necesitas claves externas (por ejemplo `EXERCISEDB_API_KEY`). Para desarrollo local, los valores por defecto suelen bastar.

#### Arrancar

Desde la raíz del repositorio:

```powershell
# Primera vez o tras cambios en Dockerfile / dependencias
docker compose -p fittrack up --build -d

# Arranques posteriores (sin reconstruir imágenes)
docker compose -p fittrack up -d
```

#### URLs

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend (health) | http://localhost:5000/api/health |

#### Comandos útiles

```powershell
# Estado de contenedores
docker compose -p fittrack ps

# Logs en vivo (todos los servicios)
docker compose -p fittrack logs -f

# Logs de un servicio
docker compose -p fittrack logs -f fittrack-frontend
docker compose -p fittrack logs -f fittrack-backend

# Detener
docker compose -p fittrack down

# Detener y borrar datos del backend (SQLite en volumen)
docker compose -p fittrack down -v
```

#### Modo API en Docker

`docker-compose.yml` configura el frontend en **modo API completo** (`AUTH_SOURCE=api`, `DATA_SOURCE=api` y overrides en `api`). Los datos vienen del backend Flask, no del mock en memoria.

- Registra usuarios en http://localhost:3000/register, o usa cuentas ya creadas en el volumen de la base de datos.
- Guía de smoke tests: [TEST_DOCKER.md](TEST_DOCKER.md)

#### Problemas frecuentes (Docker)

| Síntoma | Qué hacer |
|---------|-----------|
| `lookup registry-1.docker.io: no such host` al usar `--build` | Problema de DNS/red. Prueba `docker compose -p fittrack up -d` sin `--build` si las imágenes ya existen. Reinicia Docker Desktop. |
| Frontend responde 500 por fuentes Google | Suele ser DNS dentro del contenedor. El compose ya incluye DNS (`8.8.8.8`, `8.8.4.4`); recrea con `docker compose -p fittrack up -d --force-recreate`. |
| Puerto 5000 u ocupado | Detén el otro proceso/contenedor o cambia el mapeo de puertos en `docker-compose.yml`. |

---

### Opción B — Solo frontend (desarrollo local)

Útil para trabajar en UI con datos mock, sin levantar Flask.

#### Requisitos

- Node.js 18+ (recomendado 22)
- pnpm (o npm/yarn)

#### Pasos

```bash
# Clonar e instalar
git clone <repo>
cd database-schema-and-structure
pnpm install

# Variables de entorno (modo demo local)
Copy-Item .env.local.example .env.local   # PowerShell
# cp .env.local.example .env.local        # bash

pnpm dev
```

Abre http://localhost:3000.

Para conectar el frontend local al backend Flask (sin Docker en el frontend), copia [.env.local.api.example](.env.local.api.example) a `.env.local`.

#### Verificación

```bash
pnpm run lint      # ESLint
pnpm run typecheck # TypeScript (si está configurado)
pnpm run build     # Build de producción
```

---

### Opción C — Backend Flask en local (sin Docker)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python run.py
```

API en http://localhost:5000. Combínalo con la **Opción B** y `.env.local.api.example` en el frontend.

---

## Inicio Rápido (resumen)

| Objetivo | Comando |
|----------|---------|
| Stack completo con API | `docker compose -p fittrack up -d` |
| Reconstruir imágenes | `docker compose -p fittrack up --build -d` |
| Solo UI (mock) | `pnpm install && pnpm dev` |
| Backend local | `cd backend && python run.py` |

Documentación adicional: [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) · [TEST_DOCKER.md](TEST_DOCKER.md) · [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md)

> `SETUP.md`, `QUICKSTART.md` y `SETUP_INSTRUCTIONS.md` son documentos históricos; usar este README.

## Credenciales de Prueba

Depende del modo en que corras la app:

| Modo | Cómo entrar |
|------|-------------|
| **Frontend local** (`.env.local` con fuentes `local`) | Email: `test@example.com` · Contraseña: `password123` (usuarios mock) |
| **Docker / API** (`AUTH_SOURCE=api`) | Registra una cuenta en `/register`, o usa usuarios ya existentes en la BD del volumen Docker |

Usuarios de referencia en guías de prueba (si existen en tu BD): `admin@example.com`, `trainer@example.com`, `test@example.com` — contraseña `password123`. Ver [TEST_TRAINER.md](TEST_TRAINER.md) y [TEST_DOCKER.md](TEST_DOCKER.md).

## Variables de entorno (frontend)

Copia `.env.local.example` (modo demo) o `.env.local.api.example` (modo API) a `.env.local`.

| Variable | Valores | Notas |
|----------|---------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | URL del backend | Ej. `http://localhost:5000` |
| `NEXT_PUBLIC_AUTH_SOURCE` | `local` \| `api` | Con `api`, login contra Flask JWT |
| `NEXT_PUBLIC_DATA_SOURCE` | `local` \| `api` | Fuente por defecto de rutinas, sesiones, etc. |
| `NEXT_PUBLIC_DATA_SOURCE_METRICS` | `local` \| `api` | Override solo para métricas |
| `NEXT_PUBLIC_DATA_SOURCE_ROUTINES` | `local` \| `api` | Override para rutinas/sesiones |
| `NEXT_PUBLIC_DATA_SOURCE_USERS` | `local` \| `api` | Override para entrenador/atletas |
| `NEXT_PUBLIC_DATA_SOURCE_NUTRITION` | `local` \| `api` | Override para plan nutricional |
| `NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS` | `local` \| `api` | Override para membresía activa |

**Convención de IDs:** con `AUTH_SOURCE=api`, el `athleteId` debe ser el `user.id` del JWT (no IDs del seed demo local).

## Estructura del Proyecto

```
app/
├── page.tsx              # Landing page
├── login/page.tsx        # Página de inicio de sesión
├── register/page.tsx     # Página de registro
├── dashboard/page.tsx    # Dashboard principal
├── routines/page.tsx     # Gestión de rutinas
├── metrics/page.tsx      # Seguimiento de métricas
├── profile/page.tsx      # Perfil de usuario
├── context/
│   └── auth-context.tsx  # Contexto de autenticación
└── globals.css           # Estilos globales y tokens de diseño

components/
├── auth/
│   ├── login-form.tsx    # Formulario de login
│   ├── register-form.tsx # Formulario de registro
│   └── protected-route.tsx # Componente para rutas protegidas
└── layout/
    └── navbar.tsx        # Barra de navegación
```

## Paleta de Colores

- **Primario**: Azul oscuro (Púrpura azulado)
- **Secundario**: Púrpura
- **Acento**: Azul claro
- **Fondo**: Blanco/Gris muy claro (light), Oscuro (dark)
- **Texto**: Gris oscuro/Blanco

## Componentes Disponibles

La aplicación utiliza componentes de `shadcn/ui`:
- Button
- Input
- Card
- Dropdown Menu
- Alert
- Y más...

## Personalización

### Cambiar Colores

Edita `/app/globals.css` para cambiar los tokens de diseño:

```css
:root {
  --primary: oklch(0.35 0.18 275);
  --secondary: oklch(0.5 0.22 280);
  /* ... más variables ... */
}
```

### Agregar Páginas

1. Crea una carpeta en `/app`
2. Agrega `page.tsx` con tu contenido
3. Next.js creará automáticamente la ruta

## Stack Tecnológico

- **Framework**: Next.js 16
- **Estilización**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Autenticación**: JWT Flask (`AUTH_SOURCE=api`) o mock local (`AUTH_SOURCE=local`)
- **IA (coach Titan)**: Ollama (modelo `granite4.1:3b`) vía rutas Next API
- **Iconos**: Lucide React
- **Lenguaje**: TypeScript

## Estado y producción

- Modo API completo en Docker dev y prod compose.
- Pagos con comprobante, tasas de cambio, invitaciones trainer (Resend), notificaciones Socket.IO implementados.
- **¿Listo para producción?** Ver [docs/PRODUCTION_READINESS.md](docs/PRODUCTION_READINESS.md) — veredicto actual: piloto cerrado posible con reservas; producción abierta no aún.

## Próximas mejoras (infra / prod)

- [ ] Runtime backend de producción (Gunicorn)
- [ ] PostgreSQL opcional en prod
- [ ] Healthchecks Docker, observabilidad (Sentry)
- [ ] JWT en cookies httpOnly
- [ ] Páginas legales (`/terms`, privacidad)

## Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT.

## Soporte

Si encuentras problemas o tienes sugerencias, abre un issue en GitHub.

---

Hecho con 💜 para transformar vidas a través del fitness
