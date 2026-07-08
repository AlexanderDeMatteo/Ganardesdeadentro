> **Documento histórico** — ver [README.md](README.md) para instrucciones actuales.

# Quick Start Guide - Personal Trainers Platform

## Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 12+ (o SQLite para desarrollo)

## Setup Rápido

### 1. Backend Setup (Python + Flask)

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Linux/Mac:
source venv/bin/activate
# En Windows:
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env
cp .env.example .env

# Editar .env y configurar las variables:
# - DATABASE_URL (por defecto usa SQLite para desarrollo)
# - SECRET_KEY (generar una clave segura)
# - JWT_SECRET_KEY

# Inicializar base de datos
python init_db.py

# Ejecutar servidor Flask
python run.py
```

El backend estará disponible en: `http://localhost:5000`

### 2. Frontend Setup (Next.js + React)

En otra terminal:

```bash
# En la raíz del proyecto
pnpm install

# El archivo .env.local ya está configurado con:
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Ejecutar servidor de desarrollo
pnpm dev
```

El frontend estará disponible en: `http://localhost:3000`

## Endpoints API Disponibles

### Authentication
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual (requiere token)
- `POST /api/auth/change-password` - Cambiar contraseña (requiere token)
- `POST /api/auth/logout` - Cerrar sesión

### Exercises
- `GET /api/exercises/search?query=biceps` - Buscar ejercicios
- `GET /api/exercises/cache` - Ver ejercicios cacheados
- `POST /api/exercises/sync` - Sincronizar desde ExerciseDB API

### Health Check
- `GET /api/health` - Verificar que el backend está activo

## Troubleshooting

### Error: "Unexpected token '<', "<!DOCTYPE"..."

**Causa**: El frontend no puede conectar con el backend.

**Soluciones**:
1. Verifica que ambos servidores estén corriendo:
   - Backend: `http://localhost:5000/api/health`
   - Frontend: `http://localhost:3000`

2. Verifica que `.env.local` tenga `NEXT_PUBLIC_API_URL=http://localhost:5000`

3. Verifica que el backend no tenga errores en la consola

4. Comprueba que no hay otro proceso usando el puerto 5000:
   ```bash
   # En Linux/Mac:
   lsof -i :5000
   
   # En Windows:
   netstat -ano | findstr :5000
   ```

### Error: "Database connection error"

**Causa**: El archivo de base de datos no existe o la ruta es incorrecta.

**Soluciones**:
1. Ejecuta `python init_db.py` en la carpeta backend
2. Verifica que tienes permisos de escritura en la carpeta backend
3. Si usas PostgreSQL, verifica que el servidor está corriendo y la URL en `.env` es correcta

### Error: "ModuleNotFoundError: No module named 'flask'"

**Causa**: Las dependencias no están instaladas.

**Soluciones**:
1. Asegúrate de estar en el entorno virtual (`source venv/bin/activate`)
2. Ejecuta `pip install -r requirements.txt`

## Estructura del Proyecto

```
.
├── backend/                 # Flask + SQLAlchemy
│   ├── app/
│   │   ├── models.py       # Modelos de BD
│   │   ├── routes/         # Endpoints API
│   │   ├── services/       # Lógica de negocio
│   │   └── config.py       # Configuración
│   ├── requirements.txt     # Dependencias Python
│   ├── run.py             # Script de inicio
│   └── init_db.py         # Inicializador de BD
│
├── app/                     # Next.js App Directory
│   ├── context/            # Auth Context
│   ├── (auth)/             # Login/Register pages
│   ├── dashboard/          # Dashboard page
│   └── layout.tsx          # Root layout
│
├── components/              # React components
│   ├── auth/              # Auth components
│   └── layout/            # Layout components
│
├── .env.local             # Variables de entorno (frontend)
├── SETUP.md              # Documentación detallada
└── QUICKSTART.md         # Este archivo
```

## Próximos Pasos

1. **Crear rutinas**: Implementar panel de admin para crear rutinas
2. **Métrica tracking**: Agregar sistema de métricas y gráficos
3. **Membresías**: Implementar sistema de membresías pagadas (Stripe)
4. **Notificaciones**: Sistema de notificaciones para entrenamientos
5. **Mobile App**: React Native para app móvil

## Notas Importantes

- **Autenticación**: Usa JWT tokens almacenados en localStorage
- **Base de datos**: Por defecto usa SQLite en `backend/fitness_platform.db`
- **CORS**: El backend permite requests desde `http://localhost:3000`
- **Timezone**: Todos los timestamps están en UTC

¡Listo! Ahora puedes empezar a usar la plataforma.
