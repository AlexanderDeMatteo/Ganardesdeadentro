# Guía de Pruebas - Panel de Administración

## Credenciales de Prueba

Para acceder al panel de administración, usa:
- **Email:** `admin@example.com`
- **Contraseña:** `password123`

---

## Flujos de Prueba Recomendados

### 1. Acceso al Panel

**Pasos:**
1. Navega a `http://localhost:3000`
2. Haz clic en "Iniciar sesión"
3. Ingresa las credenciales de admin
4. Verás el dashboard con enlace "Admin" en navbar (visible solo para admin)

**Resultado esperado:**
- Acceso denegado si no eres admin
- Dashboard visible si eres admin
- Navbar muestra "Admin" como opción

---

### 2. Dashboard (/admin)

**Pruebas:**

a) **Verificar Estadísticas**
   - Total Atletas: Debe mostrar 5
   - Sin Entrenador: Debe mostrar 2 (Ana y Roberto)
   - Entrenadores: Debe mostrar 3
   - Rutinas: Debe mostrar 2

b) **Sección "Atletas Sin Entrenador"**
   - Muestra Ana Martínez y Roberto Sánchez
   - Botón "Asignar Entrenadores" lleva a /admin/athletes

c) **Resumen Rápido**
   - Atletas Activos: 5
   - Membresías Premium: 3
   - Tasa de Asignación: 60% (3 de 5)

**Resultado esperado:**
- Todas las estadísticas coinciden
- Enlaces funcionales
- Modales no se abren accidentalmente

---

### 3. Gestión de Atletas (/admin/athletes)

**Pruebas:**

a) **Tabla de Atletas**
   ```
   Verificar presencia de:
   - Juan Pérez (asignado a Diego)
   - María García (asignada a Diego)
   - Carlos López (asignado a Sandra)
   - Ana Martínez (sin asignar)
   - Roberto Sánchez (sin asignar)
   ```

b) **Búsqueda**
   - Escribe "Juan" → Muestra solo Juan Pérez
   - Escribe "maria@" → Muestra María García
   - Borra búsqueda → Muestra todos

c) **Ver Detalles**
   - Haz clic ojo en Juan Pérez
   - Modal abierto muestra:
     - Nombre: Juan Pérez
     - Email: juan@example.com
     - Edad: 28
     - Peso: 85.5 kg
     - Altura: 180 cm
     - Métricas: 85.5 kg, 18.5%, 45 kg
     - Membresía: Pro

d) **Asignar Entrenador**
   - Haz clic enlace en Ana Martínez
   - Modal con 3 entrenadores disponibles
   - Selecciona "Diego Rodríguez"
   - Confirma asignación
   - Verifica en tabla que Ana ahora tiene "Asignado"

**Resultado esperado:**
- Tabla se carga correctamente
- Búsqueda funciona en tiempo real
- Modales se abren/cierran sin errores
- Asignación se refleja inmediatamente
- Datos persisten al recargar

---

### 4. Gestión de Entrenadores (/admin/trainers)

**Pruebas:**

a) **Estadísticas**
   - Total Entrenadores: 3
   - Atletas Asignados: 3 (2 a Diego, 1 a Sandra, 0 a Miguel)
   - Rating Promedio: ~4.77

b) **Tarjetas de Entrenadores**
   
   Para Diego Rodríguez:
   - Rating: 4.8 ⭐
   - Especialización: Fuerza y Musculatura
   - 2 atletas asignados
   
   Para Sandra López:
   - Rating: 4.6 ⭐
   - Especialización: Cardio y Resistencia
   - 1 atleta asignado
   
   Para Miguel Fernández:
   - Rating: 4.9 ⭐
   - Especialización: Pérdida de Peso
   - 0 atletas asignados

**Resultado esperado:**
- Todas las tarjetas se muestran correctamente
- Información coincide con datos mock
- Design responsivo en móvil

---

### 5. Gestión de Rutinas (/admin/routines)

**Pruebas:**

a) **Estadísticas Iniciales**
   - Total Rutinas: 2
   - Total Ejercicios: 8
   - Ejercicios Usados: 5

b) **Ver Rutinas Existentes**
   
   Upper Body A:
   - Duración: 60 min
   - Ejercicios: 3
   - Dificultad: Intermedio
   - Incluye: Press de Banca, Dominadas, Press de Hombros
   
   Lower Body A:
   - Duración: 50 min
   - Ejercicios: 2
   - Dificultad: Intermedio
   - Incluye: Sentadilla, Peso Muerto

c) **Crear Nueva Rutina**
   
   1. Haz clic "Crear Nueva Rutina"
   
   2. Rellena Información Básica:
      - Nombre: "Full Body C"
      - Descripción: "Rutina completa tres veces por semana"
      - Dificultad: Principiante
      - Duración: 45
   
   3. Agrega Ejercicios:
      - Ejercicio 1: Flexiones (4 series, 12 reps, 60s)
      - Ejercicio 2: Sentadilla (3 series, 15 reps, 90s)
      - Ejercicio 3: Curl de Bíceps (3 series, 12 reps, 60s)
   
   4. Haz clic "Crear Rutina"
   
   5. Verifica que aparezca en la lista:
      - "Full Body C" debe estar en la lista
      - Total Rutinas debe ser 3

d) **Eliminar Rutina**
   - Haz clic X en la rutina que creaste
   - Se elimina de la lista
   - Total Rutinas vuelve a 2

**Resultado esperado:**
- Constructor valida información
- Ejercicios se agregan/remueven correctamente
- Rutina aparece inmediatamente en lista
- Eliminación funciona
- localStorage actualizado

---

### 6. Asignaciones de Entrenadores (/admin/assignments)

**Pruebas:**

a) **Estadísticas Generales**
   - Atletas Totales: 5
   - Asignados: 3
   - Sin Asignar: 2

b) **Carga por Entrenador**
   
   Diego Rodríguez:
   - 2/10 atletas (20%)
   - Barra verde (capacidad disponible)
   - Muestra: Juan Pérez, María García
   
   Sandra López:
   - 1/10 atletas (10%)
   - Barra verde
   - Muestra: Carlos López
   
   Miguel Fernández:
   - 0/10 atletas (0%)
   - Barra verde
   - Sin atletas asignados

c) **Atletas Pendientes**
   - Sección naranja con:
     - Ana Martínez (Premium, Sin entrenador)
     - Roberto Sánchez (Pro, Sin entrenador)

**Resultado esperado:**
- Cálculos correctos
- Colores de barra apropiados
- Lista de atletas coincide
- Información persiste

---

## Pruebas de Integración

### Flujo Completo de Asignación

1. Ve a Dashboard
   - Verifica Ana y Roberto en sección de sin entrenador

2. Ve a Atletas
   - Busca Ana por email
   - Abre detalles (verifica info)
   - Asigna a Miguel Fernández

3. Ve a Dashboard
   - Ana debería desaparecer de sin entrenador
   - Solo Roberto debería aparecer

4. Ve a Asignaciones
   - Miguel debería tener 1 atleta
   - Ana debería desaparecer de pendientes

5. Ve a Entrenadores
   - Miguel debería mostrar 1 atleta

**Resultado esperado:**
- Cambios reflejados en todas las secciones
- No hay inconsistencias

---

### Persistencia de Datos

1. Crea una nueva rutina con nombre único
2. Recarga la página (F5)
3. Ve a Rutinas
4. Verifica que la rutina sigue ahí

**Resultado esperado:**
- Datos persisten en localStorage
- Sin pérdida de información

---

## Pruebas de Responsividad

### Desktop (1920x1080)
- Sidebar fijo visible
- Tabla con todas las columnas
- Grid de 3-4 columnas

### Tablet (768x1024)
- Sidebar colapsable (si implementado)
- Tabla con scroll horizontal
- Grid de 2 columnas

### Mobile (375x667)
- Sidebar oculta/modal
- Tabla scroll horizontal
- Grid de 1 columna
- Modales fullscreen

---

## Pruebas de Seguridad

### Acceso sin Autenticación
1. Intenta acceder a `/admin` sin iniciar sesión
2. **Resultado:** Redirección a login

### Acceso con Rol Incorrecto
1. Inicia sesión con `test@example.com` (user)
2. Intenta acceder a `/admin`
3. **Resultado:** Acceso denegado

### Token Expirado
(Si se implementa)
1. Cierra sesión mientras estés en `/admin`
2. **Resultado:** Redirección a login

---

## Checklist de Validación

- [ ] Dashboard carga correctamente
- [ ] Tabla de atletas muestra 5 registros
- [ ] Búsqueda funciona en tiempo real
- [ ] Modal de detalles abre/cierra
- [ ] Modal de asignación funciona
- [ ] Asignación se refleja inmediatamente
- [ ] Constructor de rutinas abre
- [ ] Se puede agregar ejercicios
- [ ] Se puede crear rutina
- [ ] Rutina aparece en lista
- [ ] Se puede eliminar rutina
- [ ] Estadísticas son precisas
- [ ] Datos persisten al recargar
- [ ] No hay errores en consola
- [ ] Diseño responsivo en móvil

---

## Errores Comunes y Soluciones

**Error: "Acceso denegado"**
- Solución: Asegúrate de estar con usuario admin

**Error: "Tabla vacía"**
- Solución: Limpia localStorage y recarga
- `localStorage.clear()` en consola

**Error: "Modales no cierran"**
- Solución: Verifica que los botones tengan onClick correcto

**Error: "Datos no persisten"**
- Solución: Verifica que localStorage está habilitado

---

## Notas Finales

- Todos los datos son mock y se almacenan localmente
- No hay conexión a base de datos
- Los cambios se pierden si limpias localStorage
- El sistema es completamente funcional para demostración

Para reportar bugs, documenta:
1. Pasos para reproducir
2. Resultado esperado
3. Resultado actual
4. Screenshots si aplica
