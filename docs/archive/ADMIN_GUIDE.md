# Guía del Panel de Administración - FitTrack

## Descripción General

El panel de administración de FitTrack es una herramienta completa para gestionar todos los aspectos de tu plataforma de fitness. Desde aquí puedes administrar atletas, entrenadores, crear rutinas de entrenamiento y visualizar asignaciones.

## Acceso al Panel

### Credenciales de Administrador
- **Email:** `admin@example.com`
- **Contraseña:** `password123`

### Cómo Acceder
1. Haz clic en el enlace "Panel Admin" en el dashboard después de iniciar sesión
2. O navega directamente a `/admin`

**Nota:** Solo los usuarios con rol de administrador pueden acceder al panel.

---

## Secciones del Panel

### 1. Dashboard (/admin)

El dashboard principal muestra un resumen ejecutivo de tu plataforma.

**Funcionalidades:**
- Estadísticas clave (Total atletas, Sin entrenador, Entrenadores, Rutinas)
- Lista de atletas que necesitan asignación
- Resumen rápido de membresías

**Tarjetas Disponibles:**
- **Atletas Total:** Número total de usuarios registrados
- **Sin Entrenador:** Atletas que aún no tienen entrenador asignado
- **Entrenadores:** Número de entrenadores en el sistema
- **Rutinas:** Total de rutinas de entrenamiento disponibles

---

### 2. Gestión de Atletas (/admin/athletes)

Administra todos los perfiles de atletas y asigna entrenadores.

#### Tabla de Atletas
La tabla principal muestra:
- **Nombre:** Nombre completo del atleta
- **Email:** Correo electrónico de registro
- **Edad:** Edad actual
- **Peso:** Peso corporal en kg
- **Membresía:** Tipo de plan (Básica, Premium, Pro)
- **Entrenador:** Estado de asignación

#### Acciones

**Ver Detalles:**
- Haz clic en el ícono de ojo (👁️)
- Visualiza información completa del atleta:
  - Datos personales (email, edad, género, fecha de registro)
  - Medidas físicas (peso, altura)
  - Métricas actuales (peso, grasa corporal, masa muscular)
  - Tipo de membresía

**Asignar Entrenador:**
- Haz clic en el ícono de cadena (🔗)
- Selecciona un entrenador disponible de la lista
- Visualiza detalles del entrenador:
  - Especialización
  - Número de atletas asignados
  - Rating/Puntuación
- Confirma la asignación

**Búsqueda:**
- Utiliza la barra de búsqueda para filtrar por nombre o email
- Los resultados se actualizan en tiempo real

---

### 3. Gestión de Entrenadores (/admin/trainers)

Visualiza y gestiona el equipo de entrenadores.

#### Información Mostrada
Para cada entrenador se muestra:
- **Nombre:** Nombre completo del entrenador
- **Especialización:** Área de expertise
- **Atletas Asignados:** Número actual de atletas
- **Rating:** Puntuación promedio
- **Email de contacto:** Para comunicación

#### Estadísticas
- **Total Entrenadores:** Número de entrenadores activos
- **Rating Promedio:** Puntuación combinada de todos
- **Atletas Asignados:** Total de atletas bajo supervisión

---

### 4. Gestión de Rutinas (/admin/routines)

Crea, modifica y gestiona rutinas de entrenamiento.

#### Crear Nueva Rutina
Haz clic en el botón "Crear Nueva Rutina" para abrir el constructor.

**Información Básica:**
- **Nombre:** Nombre descriptivo (ej: "Upper Body A")
- **Descripción:** Objetivos y detalles de la rutina
- **Dificultad:** Principiante, Intermedio, Experto
- **Duración:** Tiempo estimado en minutos

**Agregar Ejercicios:**
1. Selecciona un ejercicio del menú desplegable
2. Define parámetros:
   - **Series:** Número de series (1-10)
   - **Repeticiones:** Reps por serie (1-50)
   - **Descanso:** Segundos entre series
3. Haz clic "Agregar Ejercicio"

**Vista Previa:**
- Los ejercicios aparecen en una lista antes de guardar
- Puedes remover ejercicios haciendo clic en la X

**Guardar:**
- La rutina se creará con fecha automática
- Aparecerá en la lista principal

#### Gestionar Rutinas Existentes
En la lista se muestra:
- Nombre y descripción
- Duración y número de ejercicios
- Dificultad con color identificador
- Vista previa de ejercicios incluidos
- Botones para editar o eliminar

---

### 5. Asignaciones de Entrenadores (/admin/assignments)

Visualiza la carga de trabajo y distribución de atletas entre entrenadores.

#### Estadísticas Generales
- **Atletas Totales:** Total registrados
- **Asignados:** Con entrenador
- **Sin Asignar:** Pendientes de asignación

#### Carga de Trabajo por Entrenador
Cada entrenador muestra:
- **Nombre y Especialización**
- **Atletas Asignados:** x de 10
- **Barra de Progreso:** Visualiza capacidad (colores):
  - Verde: < 60% (buena disponibilidad)
  - Amarillo: 60-80% (cerca de capacidad)
  - Rojo: > 80% (casi lleno)
- **Lista de Atletas:** Todos los asignados

#### Atletas Pendientes
Sección especial mostrando:
- Nombre y email
- Tipo de membresía
- Estado "Sin entrenador"

---

## Características Destacadas

### Sistema de Colores
- **Primario (Morado/Azul):** Acciones principales y entrenadores
- **Secundario (Púrpura):** Asignaciones y entrenamientos
- **Verde:** Estados positivos, atletas asignados
- **Naranja:** Avisos, atletas sin asignar
- **Rojo:** Crítico, capacidad máxima

### Búsqueda y Filtros
- Búsqueda en tiempo real en tabla de atletas
- Filtros automáticos según estado

### Modales
Todos los modales incluyen:
- Información estructurada
- Acciones principales
- Opción de cerrar/cancelar

---

## Casos de Uso Comunes

### Asignar Nuevo Atleta a Entrenador
1. Ve a Gestión de Atletas
2. Encuentra al atleta en la tabla
3. Haz clic en el ícono de cadena
4. Selecciona el entrenador preferido
5. Confirma la asignación

### Crear Nueva Rutina
1. Ve a Gestión de Rutinas
2. Haz clic "Crear Nueva Rutina"
3. Rellena información básica
4. Agrega ejercicios uno por uno
5. Haz clic "Crear Rutina"

### Ver Detalles de un Atleta
1. Ve a Gestión de Atletas
2. Busca el atleta por nombre/email
3. Haz clic en ícono de ojo
4. Visualiza toda la información personal y de métricas

### Analizar Carga de Trabajo
1. Ve a Asignaciones de Entrenadores
2. Revisa la barra de progreso de cada entrenador
3. Identifica entrenadores con capacidad disponible
4. Distribuye nuevos atletas según necesidad

---

## Tips y Mejores Prácticas

1. **Mantén Balance:** Distribuye atletas equitativamente entre entrenadores
2. **Revisa Métricas:** Consulta métricas de atletas antes de crear rutinas personalizadas
3. **Especialización:** Asigna atletas a entrenadores según su especialización
4. **Monitoreo:** Revisa regularmente el dashboard para identificar atletas sin entrenador
5. **Rutinas:** Crea rutinas de dificultad progresiva

---

## Próximas Funcionalidades

(Futuras implementaciones)
- Editar perfiles de atletas
- Crear/editar entrenadores
- Asignar rutinas a atletas específicos
- Reportes avanzados
- Sistema de notificaciones
- Exportación de datos

---

## Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.
