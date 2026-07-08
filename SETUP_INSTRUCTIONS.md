> **Documento histórico** — ver [README.md](README.md) para instrucciones actuales.

# 🚀 Instrucciones de Instalación - FitTrack

## Paso 1: Iniciar el Frontend (Next.js)

```bash
# Desde la raíz del proyecto
pnpm install
pnpm dev
```

El frontend estará disponible en: **http://localhost:3000**

## Paso 2: Acceder a la Aplicación

### Opción A: Usar Credenciales de Prueba

1. Abre http://localhost:3000 en tu navegador
2. Haz clic en **"Iniciar sesión"**
3. Usa estas credenciales:
   - **Email**: `test@example.com`
   - **Contraseña**: `password123`

### Opción B: Crear una Nueva Cuenta

1. Haz clic en **"Regístrate"**
2. Completa el formulario con tus datos
3. ¡Listo! Se te redirigirá al dashboard

## Paso 3: Navegar por la Aplicación

Una vez autenticado, tendrás acceso a:

### 📊 Dashboard
- Vista general con estadísticas
- Rutinas activas
- Próximo entrenamiento
- Estadísticas de la semana

### 💪 Rutinas
- Lista de entrenamientos disponibles
- Detalles de cada rutina (duración, ejercicios, dificultad)
- Botón para iniciar entrenamiento

### 📈 Métricas
- Seguimiento de peso
- Masa muscular
- Porcentaje de grasa corporal
- Gráficos de progreso (próximamente)

### 👤 Perfil
- Información personal
- Estadísticas de usuario
- Opciones para editar perfil

## 🎨 Explorar el Diseño

La plataforma cuenta con:

- **Hermosa paleta de colores** con gradientes y transiciones suaves
- **Iconos animados** de Lucide React
- **Componentes responsivos** para todos los dispositivos
- **Modo oscuro/claro** compatible (según tu sistema)
- **Animaciones suaves** en todas las interacciones

## 📱 Características Completadas

✅ Autenticación (mock/localStorage)
✅ Dashboard con estadísticas
✅ Gestión de rutinas
✅ Seguimiento de métricas
✅ Perfil de usuario
✅ Navegación responsiva
✅ Diseño hermoso y moderno
✅ Rutas protegidas
✅ Landing page atractiva

## 🔄 Backend (Opcional)

Si deseas trabajar con el backend Flask:

```bash
# En la carpeta /backend
cd backend
pip install -r requirements.txt
python run.py
```

El backend estará en: **http://localhost:5000**

> **Nota**: El frontend actualmente usa datos mock (localStorage), por lo que funciona sin backend.

## 🐛 Solución de Problemas

### "No puedo acceder al dashboard"
- Asegúrate de estar autenticado
- Intenta cerrar sesión y volver a iniciar
- Limpia el localStorage: `localStorage.clear()` en la consola

### "Formulario no funciona"
- Los datos se guardan en localStorage (no en servidor)
- Abre la consola para ver si hay errores
- Intenta recargar la página (F5)

### "Estilos no se cargan correctamente"
- Ejecuta `pnpm install` nuevamente
- Limpia la caché: `pnpm install --frozen-lockfile`
- Reinicia el servidor de desarrollo

## 📚 Documentación

- **README.md** - Descripción general del proyecto
- **app/globals.css** - Tokens de diseño y colores
- **components/** - Componentes reutilizables
- **app/context/auth-context.tsx** - Lógica de autenticación

## 🎯 Próximos Pasos

Para mejorar la aplicación:

1. **Conectar con backend Flask**
   - Cambiar auth mock por JWT real
   - Guardar datos en base de datos

2. **Agregar más funcionalidades**
   - Gráficos interactivos con Recharts
   - Historial completo de entrenamientos
   - Sistema de notificaciones

3. **Mejorar UX**
   - Animaciones más suaves
   - Transiciones entre páginas
   - Confirmaciones de acciones

## 💡 Tips

- Usa **Dark Mode** haciendo clic en el ícono en la navbar (próximamente)
- Todos los datos de prueba están en el código
- Prueba diferentes resoluciones para ver el responsive design
- Los componentes de UI están en `/components/ui`

## 🧪 Tests backend (pytest)

Desde `backend/` con Python 3.12+:

```powershell
pip install -r requirements.txt
$env:ENVIRONMENT='testing'
python -m pytest tests/ -v
```

Con Docker (si el daemon está activo):

```powershell
docker compose -p fittrack run --rm -e ENVIRONMENT=testing backend python -m pytest tests/ -v
```

## ✨ Disfruta la aplicación!

Esta es una plataforma moderna y hermosa construida con Next.js 16, Tailwind CSS v4 y shadcn/ui. Perfecta para comenzar a transformar vidas a través del fitness. 💪

---

¿Preguntas? Revisa el código o abre un issue en GitHub.
