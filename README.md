# FitTrack - Plataforma de Entrenadores Personales

Una plataforma moderna y hermosa para gestionar entrenamientos personalizados, seguir el progreso fitness y conectar con entrenadores profesionales.

**Contexto técnico (arquitectura, estado mock vs API, Docker, reglas):** [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)

## Características

✨ **Diseño Moderno y Responsivo**
- Interfaz hermosa con gradientes y animaciones suaves
- Totalmente responsiva para móvil, tablet y desktop
- Dark/Light mode compatible

💪 **Funcionalidades Principales**
- Autenticación mock para pruebas sin backend
- Dashboard personalizado con estadísticas
- Gestión de rutinas de entrenamiento
- Seguimiento de métricas y progreso
- Perfil de usuario con estadísticas

🎨 **Sistema de Diseño**
- Paleta de colores moderna (Azul oscuro, púrpura, verde)
- Componentes UI reutilizables con shadcn/ui
- Animaciones suaves y transiciones
- Tokens de diseño personalizados

## Inicio Rápido

### Requisitos
- Node.js 18+
- npm, yarn o pnpm

### Instalación

```bash
# Clonar el repositorio
git clone <repo>
cd v0-project

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Verificación local

Si es la primera vez que trabajas en el proyecto o no existe `node_modules`, instala dependencias:

```bash
pnpm install
```

Para verificar el código frontend con ESLint:

```bash
pnpm run lint
```

La configuración está en `eslint.config.mjs` (ESLint 9 y `eslint-config-next` alineado con Next.js 16).

Para verificar que la app levanta correctamente en Docker:

```powershell
docker compose -p fittrack up --build -d
docker compose -p fittrack ps
```

Luego revisa:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

## Levantar con Docker localmente

### Requisitos

- Docker Desktop instalado y en ejecución.
- Docker Compose disponible desde la terminal.
- Archivo `backend/.env` creado a partir de `backend/.env.example` si no existe.

### Iniciar el proyecto

Desde la carpeta raíz del proyecto, ejecuta:

```powershell
cd "C:\Users\aldml\OneDrive\Escritorio\database-schema-and-structure"
docker compose -p fittrack up --build -d
```

Este comando construye las imágenes y levanta dos contenedores agrupados en Docker Desktop bajo el proyecto `fittrack`:

- `fittrack-frontend-1`: aplicación Next.js.
- `fittrack-backend-1`: API Flask.

### URLs locales

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Verificar contenedores

```powershell
docker compose -p fittrack ps
```

También puedes verlos en Docker Desktop en la sección **Containers**, dentro del grupo `fittrack`.

### Ver logs

```powershell
docker compose -p fittrack logs -f
```

Para ver solo un servicio:

```powershell
docker compose -p fittrack logs -f frontend
docker compose -p fittrack logs -f backend
```

### Detener el proyecto

```powershell
docker compose -p fittrack down
```

Si quieres eliminar también los datos persistidos del backend:

```powershell
docker compose -p fittrack down -v
```

## Credenciales de Prueba

Para acceder a la aplicación, utiliza las siguientes credenciales:

- **Email**: `test@example.com`
- **Contraseña**: `password123`

O crea una nueva cuenta registrándote directamente.

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
- **Autenticación**: Mock (localStorage)
- **Iconos**: Lucide React
- **Lenguaje**: TypeScript

## Próximas Características

- [ ] Integración con backend Flask
- [ ] Conexión con base de datos PostgreSQL
- [ ] Sistema de pagos con Stripe
- [ ] Integración con ExerciseDB API
- [ ] Gráficos interactivos de progreso
- [ ] Notificaciones en tiempo real
- [ ] Panel de administración completo
- [ ] Comunidad y desafíos

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
