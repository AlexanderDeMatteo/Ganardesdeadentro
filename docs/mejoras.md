# Mejoras pendientes — FitTrack

> Registro de hallazgos, bugs y mejoras identificadas durante revisión.
> Estado: **en curso** (hasta indicar "terminado").

---

## 1. Vista previa de nutrición (panel entrenador) — crash

**Fecha:** 2026-06-23  
**Severidad:** Alta (bloquea funcionalidad)  
**Área:** Frontend nutrición + datos en backend / seed

### Síntoma

Al abrir la pestaña **Vista previa** en Nutrición (entrenador → atleta), la consola muestra:

```
Uncaught TypeError: r.meals[e] is not iterable
```

La pantalla deja de renderizar correctamente.

### Causa raíz

Desajuste de esquema entre lo que guarda el backend/seed y lo que espera el frontend.

**Frontend espera** (`lib/nutrition/types.ts`):

```ts
mealPlan: {
  id: string,
  name: string,
  days: [{
    day: number,  // 0–6
    meals: {
      breakfast: MealItem[],
      lunch: MealItem[],
      dinner: MealItem[],
      snack: MealItem[],
    }
  }]
}
```

**Seed manual guarda** (`backend/scripts/seed_manual_dataset.py`):

- `dayIndex` en lugar de `day`
- `meals` como **array** `[{ slot, name, calories }, ...]` en lugar de objeto por slot
- Scripts QA usan formatos aún más inválidos: `{ breakfast: 'Avena QA' }`

El backend acepta `mealPlan: dict` sin validar estructura (`PublishPlanSchema`).  
El cliente API no normaliza al cargar (`mapApiNutritionPlan` en `lib/data/client.remote.ts`).

Componentes que fallan al iterar:

- `components/nutrition/plan-day-meals.tsx` → `dayPlan.meals[slot].map(...)`
- `lib/nutrition/shopping-list.ts` → `for (const item of day.meals[slot])`

### Errores de consola no relacionados

| Error | Impacto |
|-------|---------|
| `/_vercel/insights/script.js` 404 | Bajo — Vercel Analytics no configurado en el deploy |
| WebSocket `Invalid frame header` (Cloudflare) | Medio — túnel / Socket.io; no causa el crash de vista previa |

### Cómo reproducir / confirmar

1. Login como trainer → Nutrición de un atleta con plan publicado por seed.
2. Pestaña **Vista previa** → crash.
3. DevTools → Network → `GET /api/nutrition/plan?athleteId=...` → revisar `mealPlan.days[0].meals`.

### Soluciones propuestas

**Corto plazo (manual):**

- Crear/editar plan en pestaña **Plan** y **Guardar plan** para sobrescribir JSON inválido.

**Medio plazo (código):**

1. Helper `normalizeMealPlan()` al cargar desde API (`mapApiNutritionPlan`).
2. Corregir `nutrition_plan_payload` en `seed_manual_dataset.py`.
3. Defensiva en UI: `Array.isArray(day.meals[slot]) ? ... : []`.
4. Validación opcional en backend del shape de `mealPlan` al publicar.

### Archivos implicados

- `components/nutrition/nutrition-coach-editor.tsx`
- `components/nutrition/assigned-meal-plan-view.tsx`
- `components/nutrition/plan-day-meals.tsx`
- `lib/nutrition/shopping-list.ts`
- `lib/data/client.remote.ts`
- `backend/scripts/seed_manual_dataset.py`
- `backend/app/schemas/request_schemas.py`

---

## 2. Crear rutina — filtrar ejercicios por músculo y ver los del admin

**Fecha:** 2026-06-23  
**Severidad:** Media (UX / productividad del entrenador)  
**Área:** Frontend rutinas · catálogo de ejercicios · backend ejercicios custom

### Síntoma / petición

Al **Crear rutina** (panel entrenador o admin), en **Agregar ejercicios** aparece un único desplegable con todos los ejercicios mezclados (`nombre (músculo)`). No hay forma de:

1. **Filtrar por músculo** antes de elegir (como en la pantalla de Ejercicios).
2. **Ver los ejercicios custom creados por el admin** (solo plataforma), separados de los propios del entrenador.

Comportamiento esperado:

- Pestañas u origen claro: **Catálogo** | **Del admin** | **Mis ejercicios**.
- En catálogo: selector de **músculo** + búsqueda (mín. 2 caracteres), igual que `ExerciseLibraryView`.
- En «Del admin»: listar custom con `created_by` rol admin.
- En «Mis ejercicios»: custom del entrenador logueado.

### Estado actual del código

| Pieza | Comportamiento |
|-------|----------------|
| `components/admin/routine-builder.tsx` | Mezcla `exercises` + búsqueda en un solo `<select>` sin filtro por músculo |
| `hooks/use-trainer-data.ts` | Carga `listExercises({ perPage: 100, source: 'all' })` — máx. 100, sin filtro |
| `components/exercises/exercise-library-view.tsx` | Ya tiene filtro por músculo + tabs Catálogo / Mis custom |
| `components/exercises/exercise-muscle-filter.tsx` | Componente reutilizable existente |
| `GET /api/exercises/cached` | Soporta `source`, `muscle`, `q`; en `source=custom` el trainer solo ve los suyos (`created_by_id == requester`) |

El backend **no expone** hoy un scope para custom del admin (`custom_scope=platform`) en la ruta cached.

### Solución propuesta

**Frontend**

1. Extraer panel de selección (p. ej. `ExercisePickerPanel`) con tabs Catálogo / Del admin / Mis ejercicios.
2. Reutilizar `ExerciseMuscleFilter` + `listExercisesPaginated` / `searchExercises` en `RoutineBuilder`.
3. Sustituir el `<select>` plano por carga paginada según tab y músculo activo.

**Backend**

1. Añadir query param `custom_scope` en `/api/exercises/cached`: `mine` | `platform` | `all`.
2. `platform`: custom donde `created_by.role == admin`.
3. Para trainer + `custom_scope=mine`: comportamiento actual.

**Referencia de implementación parcial** (si se retoma en Agent mode):

- `backend/app/services/custom_exercise_service.py` — `_apply_custom_scope`
- `backend/app/routes/exercises.py` — pasar `custom_scope`
- `lib/data/client.remote.ts` — `ExerciseCustomScope`
- `components/exercises/exercise-picker-panel.tsx` — panel nuevo (borrador)

### Archivos implicados

- `components/admin/routine-builder.tsx`
- `components/exercises/exercise-picker-panel.tsx` (nuevo)
- `components/exercises/exercise-muscle-filter.tsx`
- `components/exercises/exercise-library-view.tsx` (referencia)
- `hooks/use-trainer-data.ts`
- `lib/data/client.remote.ts`
- `backend/app/services/custom_exercise_service.py`
- `backend/app/routes/exercises.py`

---

## 3. Entrenamientos del periodo — aspecto visual semanal y mensual

**Fecha:** 2026-06-23  
**Severidad:** Media (UX / legibilidad)  
**Área:** Modal desempeño atleta · heatmap de actividad

### Síntoma / petición

En el modal **Desempeño — {atleta}**, la sección **Entrenamientos del periodo** usa el mismo heatmap tipo GitHub para las tres ventanas (semanal, mensual, anual). En **semanal** y **mensual** se ve mal:

| Vista | Problema observado |
|-------|-------------------|
| **Semanal** | Una sola columna de celdas estirada a todo el ancho; aspecto de bloque vacío; etiquetas de mes/día poco legibles |
| **Mensual** | Grid muy comprimido (celdas ~12px); mucho espacio vacío; difícil de interpretar con pocos entrenamientos |
| **Anual** | Funciona razonablemente (diseño pensado para muchas columnas) |

Subtítulo actual: `N entrenamiento(s) · semanal|mensual|anual`.

### Causa raíz

`WorkoutActivityHeatmap` reutiliza la misma cuadrícula (`gridTemplateColumns: 2.5rem repeat(N, minmax(0, 1fr))`) para todos los periodos. Con `period=week`, `N=1` y cada celda ocupa el 100% del ancho. Con `period=month`, las celdas son minúsculas (`min-h-[12px] min-w-[12px]`).

Componentes implicados:

- `components/admin-v2/prime-athlete-performance-modal.tsx` — sección «Entrenamientos del periodo»
- `components/routines/workout-activity-heatmap.tsx` — render del grid
- `lib/workout/activity-heatmap.ts` — `buildActivityHeatmap()` según `PerformancePeriod`

### Solución propuesta

**Semanal**

- Layout alternativo: fila de 7 días (Lun–Dom) con celdas grandes, número de día y estado claro.
- O lista/tarjetas por día con sesión vs descanso.
- Evitar heatmap de una sola columna.

**Mensual**

- Celdas más grandes (p. ej. mín. 20–24px) o calendario mensual clásico (7 columnas × ~5 filas).
- Etiquetas de día del mes en hover o dentro de la celda activa.
- Mejor contraste celdas vacías vs con actividad.

**Compartido**

- Variante de componente por periodo: `WeekActivityView`, `MonthActivityView`, `YearActivityHeatmap`.
- Mantener leyenda de volumen solo donde aplique (anual/mensual denso).
- Empty state más claro cuando `scopedSessions.length === 0` (ya existe mensaje de texto; reforzar visualmente).

### Archivos implicados

- `components/admin-v2/prime-athlete-performance-modal.tsx`
- `components/routines/workout-activity-heatmap.tsx`
- `lib/workout/activity-heatmap.ts`
- `lib/admin-v2/athlete-performance.ts` (`PerformancePeriod`, `filterSessionsByPeriod`)

---

## 4. Nutrición atleta — pestaña Plan rompe la página

**Fecha:** 2026-06-23  
**Severidad:** Alta (bloquea funcionalidad)  
**Área:** Frontend nutrición · vista atleta (`/nutrition`)  
**Relacionado con:** [§1 — Vista previa nutrición entrenador](#1-vista-previa-de-nutrición-panel-entrenador--crash) (misma causa raíz)

### Síntoma

En el panel del **atleta** (`/nutrition`), las pestañas **Macros** y **Diario** cargan bien, pero al abrir **Plan** la ruta entera falla y muestra la pantalla genérica:

> **This page couldn't load**  
> Reload to try again, or go back.

Observado en deploy (Cloudflare tunnel), p. ej. `…trycloudflare.com/nutrition`.

El atleta sí tiene plan asignado (macros visibles en pestaña Macros: kcal, proteína, carbos, grasas).

### Causa raíz (probable)

Al activar la pestaña **Plan**, se renderiza `AssignedMealPlanView` → `PlanDayMeals` + `WeeklyShoppingList`, que iteran `dayPlan.meals[slot]` asumiendo **arrays por slot**.

Si el plan publicado en BD tiene formato incorrecto (seed manual, QA u otro JSON legacy), se lanza en cliente:

```
Uncaught TypeError: … meals[…] is not iterable
```

Eso tumba el segmento de la página (error boundary / fallo de hidratación) y el usuario ve la pantalla de error completa en lugar del plan de comidas.

Flujo atleta:

- `app/(athlete-prime)/nutrition/page-client.tsx` → `NutritionPageContent`
- Pestaña `plan` → `AssignedMealPlanView` (`components/nutrition/nutrition-page-content.tsx`)
- Datos vía `useNutrition` → `GET /api/nutrition/plan?athleteId=…`

### Cómo reproducir / confirmar

1. Login como atleta con plan nutricional publicado (p. ej. tras `seed_manual_dataset.py`).
2. Ir a **Nutrición** → pestaña **Macros** (OK).
3. Clic en **Plan** → pantalla de error.
4. DevTools → consola: `meals[e] is not iterable`.
5. Network → revisar shape de `mealPlan` en la respuesta del plan.

### Solución propuesta

Aplicar las mismas correcciones del **§1**:

1. `normalizeMealPlan()` al cargar desde API (atleta y entrenador).
2. Corregir seed / datos legacy en BD.
3. Defensiva en `PlanDayMeals` y `buildWeeklyShoppingList` (`Array.isArray` + fallback).
4. Error boundary local en pestaña Plan (mensaje amigable en lugar de tumbar `/nutrition` entero).

### Archivos implicados

- `components/nutrition/nutrition-page-content.tsx`
- `components/nutrition/assigned-meal-plan-view.tsx`
- `components/nutrition/plan-day-meals.tsx`
- `lib/nutrition/shopping-list.ts`
- `hooks/use-nutrition.ts` / `hooks/use-assigned-nutrition.ts`
- `lib/data/client.remote.ts`
- `backend/scripts/seed_manual_dataset.py`

---

## 5. Soporte — mensajería no se actualiza en tiempo real

**Fecha:** 2026-06-23  
**Severidad:** Alta (UX / operación del admin)  
**Área:** Chat de soporte · Socket.io · notificaciones

### Síntoma

- **Atleta** envía mensajes en `/support` (p. ej. Carlos: «hola», «que tal la pagina») y los ve en su chat.
- **Admin** recibe **notificaciones** en la campana («Nuevo mensaje de soporte») casi al instante.
- Pero la **bandeja de soporte** (`/admin-v2/support`) **no muestra** la conversación nueva ni actualiza el hilo activo sin recargar.
- El chat abierto tampoco refleja mensajes entrantes si no se refresca manualmente.
- En consola del deploy (Cloudflare tunnel) aparece a veces: `WebSocket … failed: Invalid frame header`.

### Causa raíz (probable)

Arquitectura de realtime **desacoplada** entre notificaciones y chat:

| Canal | Room Socket.io | Quién lo recibe |
|-------|----------------|-----------------|
| Notificación admin | `user:{adminId}` (vía `NotificationService.create`) | Admin en campana ✓ |
| Mensaje soporte | `support:{athleteId}` (vía `emit_to_support_thread`) | Solo quien hizo `support:join` a ese hilo |

El admin **solo entra** al room `support:{athleteId}` cuando tiene abierto el chat de ese atleta (`joinSupportThread` en `useSupportChat`). Si está en la bandeja con otro hilo seleccionado (p. ej. Ivette Loyo), **no recibe** `support:message` de Carlos.

La bandeja (`page-client.tsx`) escucha `support:message` y llama `loadThreads()`, pero ese evento **nunca llega** al admin para hilos no abiertos.

Además, si el WebSocket falla detrás de Cloudflare y no hay **fallback por polling**, todo el realtime queda roto aunque las notificaciones hayan llegado antes por otra conexión.

### Comportamiento esperado

- Nuevo mensaje de atleta → bandeja actualizada al instante (nuevo hilo o preview + badge unread).
- Chat activo → mensaje entrante sin recargar.
- Atleta → respuesta del admin en tiempo real en `/support`.
- Indicador de conexión / reintento si el socket cae.

### Solución propuesta

**Backend**

1. Al enviar mensaje, emitir también a `role:admin`: `emit_to_admins('support:message', serialized)` (o evento `support:thread_updated`).
2. Opcional: emitir al atleta vía `user:{athleteId}` además del room del hilo.

**Frontend admin**

1. En `AdminSupportPage`, suscribirse también a `notification` con `type === 'support.message'` y llamar `loadThreads()`.
2. Fallback: polling cada N segundos si `!isConnected` (desde `useRealtime`).
3. Al recibir mensaje de hilo no seleccionado, insertar/actualizar thread en estado local sin refetch completo.

**Frontend atleta**

1. Mostrar estado «Reconectando…» cuando `!isConnected`.
2. Polling de respaldo en `useSupportChat` si no hay socket.

**Infra**

1. Revisar proxy Cloudflare / `docker-compose` para WebSocket (headers Upgrade, sticky sessions, path Socket.io).
2. Validar `CORS_ORIGINS` y URL del socket (`getApiBaseUrl()`).

### Archivos implicados

- `backend/app/services/support_service.py` — `emit_to_support_thread` tras enviar mensaje
- `backend/app/realtime/emit.py` — `emit_to_admins`
- `backend/app/realtime/events.py` — rooms `role:admin`, `support:join`
- `app/context/realtime-context.tsx`
- `lib/realtime/socket.ts`
- `app/admin-v2/support/page-client.tsx`
- `components/support/support-chat.tsx` — `useSupportChat`
- `hooks/use-notifications.ts`

---

## 6. Entrenamiento en vivo — video por serie para evaluación de ejecución

**Fecha:** 2026-06-23  
**Severidad:** Media (nueva funcionalidad / valor coaching)  
**Área:** Flujo atleta · registro de sesión · revisión por entrenador

### Petición

Cuando el **atleta culmina cada serie** durante el entrenamiento, debe **habilitarse la opción de subir un video** (cámara o galería) para que el entrenador evalúe la **técnica / ejecución**. El video debe **guardarse en el registro del día** (sesión de ese entrenamiento), asociado a la serie concreta (ejercicio + número de serie + fecha programada).

Comportamiento deseado:

1. Atleta marca serie como completada o fallida (`ActiveWorkoutPanel`).
2. Aparece acción opcional: **«Subir video de ejecución»** (solo tras registrar la serie, no antes).
3. Tras subir, el video queda ligado a esa entrada del log.
4. En el **registro del día** (historial / detalle de sesión / vista entrenador) se puede reproducir el clip por serie.
5. El entrenador puede revisar técnica sin depender solo de reps/peso.

### Estado actual del código

| Pieza | Situación |
|-------|-----------|
| `components/routines/active-workout-panel.tsx` | Registra series en `SetLogEntry` y guarda sesión al final con `markSessionComplete` |
| `lib/data/types.ts` → `SetLogEntry` | Campos: reps, peso, result — **sin** `videoUrl` / media |
| `backend/app/models.py` → `WorkoutSession` | `set_logs` JSON en texto; sin soporte de media por serie |
| `backend/app/services/session_service.py` | Persiste `setLogs` tal cual |
| `components/routines/athlete-session-day-detail.tsx` | Muestra series del día; sin video |
| Subida de media existente | Patrón en ejercicios custom (`uploadExerciseMedia`, `EXERCISE_MEDIA_UPLOAD_DIR`) — reutilizable como referencia |

Hoy el atleta solo registra datos numéricos; no hay captura ni almacenamiento de video por serie.

### Solución propuesta

**Modelo / API**

1. Extender `SetLogEntry` con campos opcionales, p. ej. `executionVideoUrl`, `executionVideoUploadedAt`.
2. Endpoint `POST /api/sessions/{sessionId}/sets/{setKey}/video` o subida junto al completar serie si la sesión ya existe en borrador.
3. Alternativa: subida inmediata al completar serie → PATCH sesión borrador en local + sync al cerrar entrenamiento.
4. Almacenamiento en directorio dedicado (p. ej. `SESSION_EXECUTION_MEDIA_DIR`), validación MIME/tamaño, sin exponer rutas internas.
5. Migración Alembic si se normaliza en tabla aparte (`set_execution_videos`).

**Frontend atleta**

1. Tras `recordSet()` exitoso, mostrar CTA «Subir video» (opcional, no bloqueante).
2. Componente de captura/subida (mp4/webm, límite de duración/tamaño).
3. Indicador visual en series que ya tienen video adjunto.
4. Incluir URLs en payload final de `markSessionComplete` o subir en caliente por serie.

**Frontend entrenador / admin**

1. Reproductor en detalle de sesión del día (`athlete-session-day-detail`, modal desempeño).
2. Acceso desde ficha del atleta al historial con filtros por fecha.

**Seguridad**

- Solo el atleta dueño (o su entrenador asignado / admin) puede ver/subir.
- No loguear URLs con tokens; servir media con auth o URLs firmadas de corta duración.

### Archivos implicados (estimado)

- `components/routines/active-workout-panel.tsx`
- `lib/data/types.ts`
- `lib/workout/session-utils.ts`
- `lib/data/client.remote.ts`
- `backend/app/schemas/request_schemas.py` (`SetLogSchema`)
- `backend/app/services/session_service.py`
- `backend/app/routes/sessions.py`
- `components/routines/athlete-session-day-detail.tsx`
- `components/routines/session-history-list.tsx`
- Referencia: `backend/app/services/custom_exercise_service.py` (upload media)

---

## 7. Crear rutina — reformulación con 3 tipos de estructura

**Fecha:** 2026-06-23  
**Severidad:** Media (nueva funcionalidad / producto)  
**Área:** Constructor de rutinas · modelo de datos · flujo atleta

### Petición

Reformular el modal **Crear rutina** (`RoutineBuilder`) para soportar **3 categorías / modos de construcción**:

| Modo | Descripción resumida |
|------|----------------------|
| **1. Formulario base** | El actual: ejercicios en secuencia lineal, cada uno con series, reps, descanso, progresión de peso y técnica opcional. |
| **2. Series Pull** | Rangos de movimiento consecutivos dentro de **una sola serie** (ver definición abajo). |
| **3. Super series** | Dos subtipos (progresiva / regresiva) con escalado de peso-reps en **una sola serie total** (ver definición abajo). |

El entrenador elige el **tipo de estructura** al crear/editar la rutina; el formulario de «Agregar ejercicios» y la vista del atleta deben adaptarse al modo seleccionado.

---

### Contexto de producto — Tipo 2: Series Pull (Rangos de movimiento)

Se ejecutan **múltiples rangos de movimiento de forma consecutiva** dentro de **una sola serie** (no son series separadas con descanso entre ellas).

**Estructura interna — 3 rangos por serie:**

1. Del **punto 1 al punto 2** (rango parcial corto).
2. Del **punto 2 al punto 3** (rango parcial medio).
3. Del **punto 1 al punto 3** (rango completo).

**Volumen:**

- Entre **5 y 10 repeticiones en cada rango** antes de dar por terminada la serie.
- El valor concreto (5–10) debe ser **personalizable** por el entrenador al armar la rutina.

**Implicaciones para el formulario:**

- Definir/visualizar los 3 puntos o rangos (labels + reps por rango).
- El atleta registra una serie compuesta por 3 fases ROM consecutivas.
- Descanso estándar **entre series completas** (no entre rangos internos).

---

### Contexto de producto — Tipo 3: Super series (2 subtipos)

Las superseries se dividen en **dos subtipos independientes**. Ambos comparten la **regla de oro**:

- Descanso **máximo de 30 segundos** entre cambios de peso.
- Todo el bloque se **contabiliza como una sola serie total**.

#### Subtipo A: Superserie progresiva (ascendente en peso)

Aumentar la carga de forma escalonada mientras **disminuyen las repeticiones**, y cerrar con un **remate metabólico**.

**Flujo de trabajo (ejemplo):**

| Paso | Reps | Peso |
|------|------|------|
| Inicio | 20 | 5 kg (liviano) |
| Progreso | 15 → 8 → 6 → 4 | 10 kg → 15 kg → 20 kg → 25 kg |
| Cierre | Fallo en repeticiones pesadas | — |
| Remate final | 20 (alto volumen) | 5 kg o sin peso (vuelta al inicial) |

#### Subtipo B: Superserie regresiva (descendente en peso / drop sets)

Inverso a la progresiva: se empieza con **carga máxima** (bajo volumen) y se **reduce el peso** en escalones manteniendo estímulo hasta el fallo.

**Flujo de trabajo (ejemplo):**

| Paso | Reps | Peso |
|------|------|------|
| Inicio | 4–6 | Peso máximo |
| Regresión | Al fallo, bajar peso y continuar | Escalones decrecientes |
| Cierre | Máximo bombeo / fallo | Peso más liviano |

**Implicaciones para el formulario:**

- Selector: **Progresiva** vs **Regresiva**.
- Editor de **escalones** (peso + reps objetivo por escalón); máx. 30 s entre escalones (timer en app atleta).
- N escalones configurables; remate final obligatorio en progresiva.
- Una entrada en la rutina = **1 serie total** (no N series).

---

### Estado actual del código

Un solo modelo **lineal** sin tipos ni agrupaciones:

- `components/admin/routine-builder.tsx` — un ejercicio = `{ sets, reps, rest, suggestedWeightsKg, technique }`
- `lib/data/types.ts` → `RoutineExercise` / `Routine.exercises[]` — lista plana ordenada
- `backend/app/models.py` → `RoutineExercise` — `order`, `sets`, `reps`, `rest_seconds`; sin `block_type`, ROM ni escalones
- `lib/data/routine-ui-adapter.ts` → `UiRoutine.tasks[]` — tareas secuenciales para `ActiveWorkoutPanel`

No existe soporte para rangos ROM, escalones progresivos/regresivos ni conteo de «una serie compuesta».

### Comportamiento esperado (implementación)

**Formulario base (actual)**

- Sin cambios funcionales salvo selector de modo al inicio.

**Series Pull**

- Por ejercicio/serie: configurar 3 rangos (P1→P2, P2→P3, P1→P3) y reps por rango (5–10, editable).
- UI atleta: guía paso a paso por rango antes de marcar la serie completa.

**Super series**

- Elegir subtipo: `progressive` | `regressive`.
- Definir lista ordenada de escalones `{ weightKg, repsTarget }` + remate final (progresiva).
- Timer ≤ 30 s entre escalones; al finalizar escalones = 1 serie registrada.
- UI atleta: flujo guiado escalón a escalón con cronómetro de transición.

**Compartido**

- Información básica (nombre, descripción, dificultad, duración) común a los 3 modos.
- Migración: rutinas existentes = `structureType: 'standard'` por defecto.

### Solución propuesta

**Modelo**

1. `Routine.structureType`: `'standard' | 'series_pull' | 'superset'`.
2. `RoutineExercise` (o JSON embebido) ampliado según tipo:
   - **standard:** campos actuales.
   - **series_pull:** `romRanges: [{ from, to, repsMin, repsMax }]`, 3 entradas fijas.
   - **superset:** `supersetSubtype: 'progressive' | 'regressive'`, `steps: [{ weightKg, repsTarget }]`, `finisher?: { weightKg, repsTarget }`, `maxTransitionRestSec: 30`.
3. Extender API create/update rutina y serializers backend.

**Frontend**

1. Selector de modo (tabs o pills) en `RoutineBuilder`.
2. Subformularios: `StandardExerciseForm`, `SeriesPullEditor`, `SupersetStepEditor` (con subtipo A/B).
3. Actualizar `storeRoutineToUi` y `ActiveWorkoutPanel` para flujos compuestos por serie.

**Validación**

- Series pull: 3 rangos definidos; reps en rango 5–10 (o límites configurables).
- Superserie: ≥ 2 escalones; transición ≤ 30 s; progresiva con remate final definido.
- Base: al menos 1 ejercicio (como hoy).

### Archivos implicados (estimado)

- `components/admin/routine-builder.tsx`
- `lib/data/types.ts`
- `lib/data/routine-ui-adapter.ts`
- `components/routines/active-workout-panel.tsx`
- `components/admin-v2/prime-routines-grid.tsx`
- `backend/app/models.py` (`Routine`, `RoutineExercise` o metadata JSON)
- `backend/app/services/routine_service.py`
- `lib/data/client.remote.ts`

---

## 8. Titan — no debe mostrarse sin login

**Fecha:** 2026-06-23  
**Severidad:** Media (UX / privacidad / expectativa de producto)  
**Área:** Coach visual · `CoachMascot` · contexto Titan

### Petición

**Titan** (coach flotante / asistente con mensajes dinámicos) **no debería verse** hasta que el usuario **haya iniciado sesión**. Visitantes en landing, login o rutas públicas no deberían ver el widget interactivo del coach.

### Estado actual del código

| Pieza | Comportamiento |
|-------|----------------|
| `app/layout.tsx` | Monta `<CoachMascot />` globalmente para toda la app |
| `components/coach/coach-mascot.tsx` | Solo oculta en `/login`, `/register`, `/activate` y preview admin (`isPublicAuthPath`, `isAdminPreviewPath`) |
| **Landing `/` y otras rutas públicas** | El **globo flotante del coach** sigue visible sin sesión |
| `app/context/coach-context.tsx` | `showTitanUi = hasTitanMotivationAccess(isAuthenticated)` → `false` sin login, pero el **avatar + tips estáticos** siguen renderizándose |
| `lib/auth/titan.ts` | Motivación Titan = autenticado; nutrición Titan = Premium/Pro/admin |
| `components/landing/v4/coach-titan-visual-v4.tsx` | Visual **promocional** de Titan en la landing (sección marketing, no widget) |

Hoy un visitante sin cuenta puede ver el coach flotante (minimizable) con mensajes genéricos por ruta; la UI typewriter «Titan» no se activa, pero la **presencia del coach** puede confundirse con Titan ya disponible.

### Comportamiento esperado

1. **Sin sesión:** no renderizar `CoachMascot` (ni FAB minimizado).
2. **Con sesión:** mostrar coach según rol y permisos Titan existentes.
3. **Landing marketing:** decidir si la sección estática «El Titan» (`LandingCoachV4`) permanece como promoción pública o también se restringe (recomendación: **mantener solo en landing** como branding; **ocultar widget interactivo**).
4. APIs `/api/coach/titan` y `/api/nutrition/titan` ya exigen JWT vía `verifyTitanSession` — coherente con no exponer UI sin login.

### Solución propuesta

**Frontend**

1. En `CoachMascot`: `if (!isAuthenticated) return null` (usar `useAuth()`).
2. Alternativa: condicionar en `app/layout.tsx` `{isAuthenticated && <CoachMascot />}` dentro del árbol de auth.
3. No disparar `requestTitanPhrase` / fetches Titan en `CoachProvider` cuando `!isAuthenticated` (revisar efectos residuales).
4. Documentar excepción explícita si la landing mantiene ilustración estática.

**Validación manual**

- Abrir `/` sin login → no aparece burbuja flotante del coach.
- Tras login atleta/trainer/admin → coach visible según corresponda.
- `/login` y `/register` → sin coach (como hoy).

### Archivos implicados

- `components/coach/coach-mascot.tsx`
- `app/layout.tsx`
- `app/context/coach-context.tsx`
- `lib/auth/titan.ts`
- `lib/auth/role-routes.ts` (`isPublicAuthPath` — ampliar si hace falta lista de rutas públicas)

---

## 9. Admin mobile — sin icono de menú / navegación

**Fecha:** 2026-06-23  
**Severidad:** Alta (UX móvil — bloquea navegación)  
**Área:** Panel admin v2 · shell · sidebar

### Síntoma

En **viewport móvil**, el panel admin (`/admin-v2/*`, p. ej. Asignaciones) **no muestra icono de menú** ni otra forma clara de abrir la navegación lateral. El usuario solo ve la top bar (notificaciones, historial, perfil) y el contenido de la página, **sin acceso a Rutinas, Atletas, Soporte**, etc.

### Causa raíz

El shell admin oculta el sidebar en móvil y **no incluye alternativa móvil**:

```tsx
// components/admin-v2/prime-sidebar.tsx
className="... hidden ... md:flex"  // sidebar solo ≥ md

// components/admin-v2/prime-shell.tsx
// Sin bottom nav ni drawer móvil
```

Comparación en el mismo proyecto:

| Shell | Mobile |
|-------|--------|
| `AthletePrimeShell` | Bottom nav fijo (`md:hidden`) con iconos |
| `TrainerPrimeShell` | Bottom nav fijo (`md:hidden`) |
| **`PrimeShell` (admin)** | **Nada** — sidebar oculto, sin menú hamburguesa |

`PrimeTopBar` tampoco tiene botón `Menu` / `Sheet` para abrir el sidebar en pantallas pequeñas.

### Comportamiento esperado

- En `< md`: icono **hamburguesa** (o barra inferior) para acceder a todos los ítems de `PrimeSidebar`.
- Drawer/Sheet con la misma navegación que desktop (logo, links, cerrar sesión).
- Opcional: reutilizar patrón del atleta/trainer (bottom tab bar con rutas admin más usadas + «Más» para el resto).

### Solución propuesta

**Opción A — Drawer (recomendada para paridad desktop)**

1. Estado `mobileNavOpen` en `PrimeShell` o `PrimeTopBar`.
2. Botón `Menu` visible solo `md:hidden` en la top bar (izquierda).
3. `Sheet` / drawer con contenido de `PrimeSidebar` (extraer nav a componente compartido `PrimeSidebarNav`).

**Opción B — Bottom nav**

1. Barra inferior como `AthletePrimeShell`, mapeando `ADMIN_V2_NAV_ITEMS` + iconos en `admin-v2-nav-icons.ts`.
2. Limitar a 4–5 ítems principales; overflow en «Más».

**Accesibilidad**

- `aria-label="Abrir menú de navegación"`, foco trap en drawer, cierre con Escape.

### Archivos implicados

- `components/admin-v2/prime-shell.tsx`
- `components/admin-v2/prime-sidebar.tsx`
- `components/admin-v2/prime-top-bar.tsx`
- `lib/admin-v2/admin-v2-nav-icons.ts` (si bottom nav)
- `lib/auth/role-routes.ts` (ítems admin v2)
- Referencia: `components/athlete-prime/athlete-prime-shell.tsx`, `components/trainer-v2/trainer-prime-shell.tsx`

### Validación manual

1. DevTools → iPhone / 375px → `/admin-v2/assignments`.
2. Confirmar menú visible y navegación a `/admin-v2/support`, `/admin-v2/athletes`, etc.
3. Desktop (`≥ md`): sidebar fijo sin regresiones.

---

## 10. Admin — listado de atletas apretado en mobile (responsive)

**Fecha:** 2026-06-23  
**Severidad:** Media (UX móvil / legibilidad)  
**Área:** `/admin-v2/athletes` · tabla `REGISTRO_ATLETAS`

### Síntoma

En **mobile**, el módulo **REGISTRO_ATLETAS** se ve **muy apretado**:

- Columnas **Membresía** y **Entrenador** se **superponen** o colisionan visualmente.
- Nombres **truncados** en exceso (`Carlos N…`, `Laura…`).
- Badges (Basic / Premium / Pro) compiten por espacio con el nombre del entrenador.
- Columna **Acciones** (4 iconos: nutrición, ver, rutina, asignar) fuerza ancho mínimo y empeora el hacinamiento.
- Headers «MEMBRESÍA» y «ENTRENADOR» difíciles de leer en pantallas estrechas.

Observado en `/admin-v2/athletes` (375px).

### Causa raíz

`PrimeAthletesTable` usa **tabla HTML de ancho fijo** (`table-fixed`) con demasiadas columnas visibles en móvil:

| Columna | Mobile |
|---------|--------|
| Nombre | Visible (~26%) |
| Email | Oculto `< md` ✓ |
| Membresía | Visible (~16%) |
| Entrenador | Visible (~22%) |
| Acciones | Visible (`w-[8.5rem]`, 3–4 botones) |

En ~375px siguen **4 columnas + acciones**, insuficiente para badges y texto. El `overflow-x-auto` ayuda poco porque los anchos fijos comprimen celdas en lugar de permitir scroll cómodo.

Layout página: grid `xl:grid-cols-[…]` — en mobile tabla + inspector apilados; el inspector vacío ocupa espacio pero el problema principal es la **tabla**.

### Comportamiento esperado

**Mobile (`< md` o `< lg`):**

- **Opción A — Cards:** cada atleta como tarjeta (nombre, email, badge, entrenador, acciones en fila inferior).
- **Opción B — Tabla simplificada:** solo Nombre + chevron; detalle en sheet/modal al tocar (inspector o bottom sheet).
- **Opción C — Scroll horizontal claro:** `min-w-[640px]` en tabla + hint «Desliza →»; ocultar columna Entrenador en `< sm`, mover a card expandida.

**Tablet/desktop:** mantener tabla actual.

Acciones: agrupar en menú «⋯» en mobile para reducir ancho.

### Solución propuesta

1. Breakpoint en `PrimeAthletesTable`: `PrimeAthletesMobileList` vs tabla desktop.
2. Reutilizar datos y callbacks existentes (`onSelectRow`, `onViewPerformance`, etc.).
3. Inspector lateral: en mobile abrir como **Sheet** al seleccionar fila en lugar de bloque debajo vacío.
4. Ajustar `PrimeMembershipBadge` para tamaño compacto en cards.
5. Revisar misma tabla en modo **trainer** (`mode="trainer"`, columna «Rutina activa»).

### Archivos implicados

- `components/admin-v2/prime-athletes-table.tsx`
- `components/admin-v2/prime-athlete-inspector.tsx`
- `app/admin-v2/athletes/page-client.tsx`
- `components/admin-v2/prime-table-row-action.tsx`
- `components/admin-v2/prime-membership-badge.tsx`
- Referencia responsive: otras grids admin v2 con cards en mobile

### Validación manual

1. DevTools 375px → `/admin-v2/athletes`.
2. Sin solapamiento texto/badge; acciones usables (touch target ≥ 44px).
3. ≥ `xl`: tabla + inspector lateral sin regresión.

---

## 11. (próximas entradas)

_Se irán añadiendo hallazgos aquí._
