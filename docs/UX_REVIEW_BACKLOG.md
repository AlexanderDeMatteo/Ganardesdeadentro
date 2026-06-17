# Backlog de revisión UX — FitTrack

Ítems detectados en pruebas manuales o QA. No implementar sin decisión de diseño.

---

## UX-001 — Navegación redundante en panel Admin

| Campo | Valor |
|-------|--------|
| **Fecha** | 2026-06-13 |
| **Reportado por** | QA manual (usuario admin) |
| **Ruta afectada** | `/admin` y subrutas (`/admin/*`) |
| **Severidad sugerida** | 🟡 Media (UX / claridad) |
| **Estado** | ✅ Implementado (2026-06-13) — Opción A: navbar minimal en `/admin/*` |

### Problema

En el panel de administración coexisten **dos sistemas de navegación** a la vez:

1. **Navbar global** (arriba): enlaces de atleta + enlace "Admin"
2. **Sidebar lateral** (izquierda): navegación específica del panel admin

Esto genera redundancia y confusión sobre qué menú usar.

**Evidencia:** sesión manual en `/admin` — navbar con Dashboard, Rutinas, Métricas, Nutrición, Membresías, Admin; sidebar con Dashboard, Atletas, Entrenadores, Rutinas, Asignaciones, Membresías.

### Comportamiento actual

#### Navbar (`components/layout/navbar.tsx`)

Para rol `admin`, muestra la **nav de atleta**:

| Enlace navbar | Destino |
|---------------|---------|
| Dashboard | `/dashboard` |
| Rutinas | `/routines` |
| Métricas | `/metrics` |
| Nutrición | `/nutrition` |
| Membresías | `/memberships` |
| Admin | `/admin` |

#### Sidebar (`components/layout/role-panel-shell.tsx` + `ADMIN_NAV_ITEMS`)

| Enlace sidebar | Destino |
|----------------|---------|
| Dashboard | `/admin` |
| Atletas | `/admin/athletes` |
| Entrenadores | `/admin/trainers` |
| Rutinas | `/admin/routines` |
| Asignaciones | `/admin/assignments` |
| Membresías | `/admin/memberships` |

#### Solapamientos confusos

| Etiqueta | Navbar → | Sidebar → | Nota |
|----------|----------|-----------|------|
| Dashboard | `/dashboard` | `/admin` | Misma etiqueta, rutas distintas |
| Rutinas | `/routines` | `/admin/routines` | Vista atleta vs gestión admin |
| Membresías | `/memberships` | `/admin/memberships` | Vista atleta vs gestión admin |
| Admin | `/admin` | — | Redundante estando ya en `/admin` |

Además, el admin **puede** acceder a rutas de atleta por diseño (`getAllowedRoutePrefixesForRole` en `lib/auth/role-routes.ts`), pero en el panel admin esa doble nav no aporta y desorienta.

### Causa técnica

- `app/admin/layout.tsx` usa `AdminPanelLayout` → `RolePanelShell`.
- `RolePanelShell` **siempre** monta `<Navbar />` y además el sidebar con `navItems` del rol.
- El navbar **no adapta** sus ítems cuando el usuario está en `/admin/*`; sigue mostrando `ATHLETE_NAV_ITEMS` + link Admin.
- Existe `components/admin/admin-sidebar.tsx` (legacy) que **ya no se usa**; la nav real está en `RolePanelShell`.

**Archivos relevantes:**

- `components/layout/role-panel-shell.tsx`
- `components/layout/navbar.tsx`
- `components/layout/admin-panel-layout.tsx`
- `lib/auth/role-routes.ts`

### Impacto UX

- Dos menús compitiendo por atención.
- Etiquetas iguales que llevan a pantallas diferentes.
- Ocupa espacio vertical (`pt-20` en sidebar por el navbar encima).
- En mobile hay además **bottom nav** (primeros 4 ítems del sidebar) + hamburger del navbar → triple navegación.

### Opciones de solución (para decidir en revisión)

#### Opción A — Navbar contextual en `/admin/*` (recomendada)

En rutas admin, navbar minimalista: logo + usuario (perfil/logout). Toda la nav de sección en el sidebar.

#### Opción B — Solo navbar, sin sidebar en desktop

Unificar en navbar horizontal con `ADMIN_NAV_ITEMS`. Implica rediseño del layout admin.

#### Opción C — Mantener ambos pero diferenciar labels

Ej.: navbar "Vista atleta" vs sidebar "Gestión admin". Sigue siendo redundante; solo mitiga confusión.

#### Opción D — Ocultar nav atleta en admin salvo acción explícita

Un único enlace "Vista atleta" / "Salir del panel" en lugar de 5 enlaces duplicados.

### Alcance relacionado

- **Trainer:** menos grave — navbar muestra solo "Panel Entrenador" (`navbar.tsx` rama `isTrainer`), sidebar tiene el detalle.
- **Admin:** caso más evidente; priorizar corrección aquí.

### Criterios de aceptación (propuesta)

- [ ] En `/admin/*` no hay dos menús con ítems solapados sin propósito claro.
- [ ] "Dashboard" / "Rutinas" / "Membresías" no ambiguos entre vista atleta y admin.
- [ ] Mobile: una sola navegación principal por contexto (admin).
- [ ] Accesibilidad: un `<nav>` principal por vista; labels únicos.
- [ ] Verificar que logout y perfil sigan accesibles.

### Notas de la sesión manual

- Login: `admin@fittrack.qa`
- Overview cargó correctamente; el hallazgo es solo de navegación.

---

## UX-002 — Modal "Asignar entrenador": lista cortada sin scroll

| Campo | Valor |
|-------|--------|
| **Fecha** | 2026-06-13 |
| **Reportado por** | QA manual (usuario admin) |
| **Ruta afectada** | `/admin/athletes` → acción "Asignar entrenador" |
| **Severidad sugerida** | 🟠 Alta (bloquea seleccionar entrenadores no visibles) |
| **Estado** | ✅ Implementado (2026-06-13) — `ScrollableModal` + refactor `trainer-assignment-modal` |

### Problema

Al asignar un atleta a un entrenador, el modal **"Asignar Entrenador"** muestra la lista de entrenadores disponibles, pero el contenido **se corta** en la parte inferior (p. ej. `Entrenador6 QA` parcialmente visible) y **no aparece barra de scroll**, impidiendo ver ni seleccionar entrenadores más abajo en la lista.

**Evidencia:** captura en `/admin/athletes` con dataset QA (10+ entrenadores); la lista termina abruptamente sin scroll.

### Comportamiento actual

- Modal en `components/admin/trainer-assignment-modal.tsx`.
- Contenedor del modal: `max-w-2xl` sin `max-h` ni `overflow`.
- La sección "Entrenadores Disponibles" usa `<div className="space-y-3">` con un `.map()` de todos los trainers **sin límite de altura ni `overflow-y-auto`**.
- Con muchos entrenadores (seed QA: 10; producción puede crecer), el modal supera el viewport y el overflow queda oculto (`overflow: hidden` implícito en el layout del modal centrado).

### Causa técnica

**Archivo:** `components/admin/trainer-assignment-modal.tsx`

Estructura actual:

```tsx
<div className="fixed inset-0 ... flex items-center justify-center ...">
  <div className="w-full max-w-2xl ...">  {/* sin max-height */}
    <div className="... header ..." />
    <div className="px-8 py-8 space-y-6">  {/* cuerpo sin scroll */}
      ...
      <div className="space-y-3">  {/* lista de trainers sin overflow */}
        {trainers.map(...)}
      </div>
    </div>
    <div className="... footer botones ..." />
  </div>
</div>
```

### Impacto UX

- No se pueden asignar entrenadores que quedan fuera del viewport.
- Empeora con pantallas bajas o zoom del navegador.
- Afecta directamente flujo admin D4 (`/admin/athletes` → asignar/reasignar trainer).

### Solución sugerida

1. Modal con altura máxima: `max-h-[min(90vh,…)]` y layout flex column.
2. Zona central scrollable: `flex-1 overflow-y-auto` en el cuerpo o solo en la lista de entrenadores (`max-h-64` / `max-h-[50vh]` + `overflow-y-auto`).
3. Mantener header y footer (Cancelar / Asignar) **fijos** mientras scrolla la lista.
4. Verificar contraste visible de la scrollbar en tema oscuro (`scrollbar` utilities o `overflow-y-scroll`).

**Referencia similar a revisar:** `components/admin/deactivate-trainer-modal.tsx` (select de reasignación con lista de atletas/entrenadores) por el mismo patrón de overflow.

### Criterios de aceptación (propuesta)

- [ ] Con 10+ entrenadores, todos son accesibles vía scroll dentro del modal.
- [ ] Botones Cancelar / Asignar Entrenador siempre visibles (footer sticky).
- [ ] Funciona en viewport ~768px de alto y en mobile.
- [ ] Scroll usable con teclado (Tab + flechas) y no queda atrapado el foco.

### Notas de la sesión manual

- Contexto: dataset QA con `trainer1..10@fittrack.qa`.
- Entrenadores visibles hasta ~5–6; el resto inaccesible.

---

## UX-003 — Modal detalle de atleta: tamaño y contenido sin ajustar

| Campo | Valor |
|-------|--------|
| **Fecha** | 2026-06-13 |
| **Reportado por** | QA manual (usuario admin) |
| **Ruta afectada** | `/admin/athletes` → ver detalle de atleta (modal) |
| **Severidad sugerida** | 🟡 Media (layout + datos vacíos confusos) |
| **Estado** | ✅ Implementado (2026-06-13) — `ScrollableModal` + empty states en `athlete-detail-modal` |

### Problema

El modal de **información del atleta** (detalle al abrir un usuario desde la tabla admin) **no ajusta bien su tamaño** al viewport: ocupa mucho alto fijo, puede quedar cortado en pantallas bajas y **no tiene scroll** en el cuerpo (mismo patrón que UX-002). Además, varios campos se muestran con valores vacíos o poco útiles.

**Evidencia:** captura del modal "Test User" — secciones Información Personal, Medidas Físicas, Última medición, Membresía; footer con Nutrición / Cerrar.

### Comportamiento observado

| Campo | Valor mostrado | Problema |
|-------|----------------|----------|
| Edad | solo "años" (sin número) | `athlete.age` undefined/null → `{athlete.age} años` renderiza mal |
| Peso inicial (perfil) | `0 kg` | Perfil sin datos o no mapeado desde API |
| Altura | `0 cm` | Idem |
| Última medición | "Sin métricas registradas" | OK como empty state, pero junto a 0 kg/0 cm resulta confuso |
| Género | "Femenino" / "Masculino" | Layout del bloque género desalineado vs resto de la grid |
| Membresía | "Basic" | OK |

### Comportamiento actual (técnico)

**Archivo:** `components/admin/athlete-detail-modal.tsx`

- Modal `max-w-2xl` **sin `max-h`** ni scroll en el cuerpo (`px-8 py-8 space-y-8` con 4 bloques apilados).
- Header y footer fijos en estructura plana; en viewports bajos el contenido central puede quedar **inaccesible** o comprimido.
- Reutilizable desde admin y trainer vía prop `nutritionBasePath`.
- Métricas: hook `useAthleteMetrics` + fallback `latestMetric` / `athlete.metrics`.
- Edad y medidas del perfil vienen del objeto `AthleteProfile` sin validación de empty state.

Estructura similar a UX-002:

```tsx
<div className="fixed inset-0 ... flex items-center justify-center ...">
  <div className="w-full max-w-2xl ...">  {/* sin max-height */}
    <div>header</div>
    <div className="px-8 py-8 space-y-8">  {/* 4 secciones, sin overflow */}
      {/* Personal, Medidas, Métricas, Membresía */}
    </div>
    <div>footer Nutrición / Cerrar</div>
  </div>
</div>
```

### Impacto UX

- En pantallas pequeñas o con zoom, no se ve todo el detalle ni los botones inferiores.
- Datos `0` / vacíos parecen errores de la app, no "sin registrar".
- Caso D5 del checklist QA (`/admin/athletes` → modal detalle) queda débil visualmente.

### Solución sugerida

**Layout (prioridad — alinear con UX-002):**

1. `max-h-[min(90vh,…)]`, `flex flex-col` en el contenedor del modal.
2. Cuerpo con `flex-1 overflow-y-auto` (scroll interno).
3. Footer sticky con botones Nutrición / Cerrar siempre visibles.
4. Revisar padding/spacing en mobile (`px-4` vs `px-8`).

**Contenido / empty states (secundario):**

1. Edad: mostrar "—" o "No indicada" si `!athlete.age`.
2. Peso/altura perfil: "Sin registrar" en lugar de `0 kg` / `0 cm`.
3. Unificar estilo del campo Género con el resto de la grid (icono + label + valor).
4. Verificar mapeo API → `AthleteProfile` cuando `DATA_SOURCE=api` (datos reales vs seed local).

### Alcance relacionado

- Mismo patrón de modal en admin: UX-002 (`trainer-assignment-modal.tsx`).
- Considerar componente base `ScrollableModal` compartido para admin modals.

### Criterios de aceptación (propuesta)

- [ ] Modal scrollable en viewport ≤768px de alto; footer siempre accesible.
- [ ] Campos sin dato muestran copy claro (no "años" suelto ni `0 kg`).
- [ ] Atleta con métricas en API muestra última medición; sin métricas, empty state coherente.
- [ ] Grid legible en mobile (1 columna si hace falta).

### Notas de la sesión manual

- Ejemplo visto: `athlete@example.com` / "Test User" (posible mezcla datos local + API).
- Referencia checklist: **D5** modal detalle atleta.

---

## UX-004 — Nutrición coach (admin): errores al editar plan de `athlete1@fittrack.qa`

| Campo | Valor |
|-------|--------|
| **Fecha** | 2026-06-13 |
| **Reportado por** | QA manual (usuario admin) |
| **Ruta afectada** | `/admin/athletes/[athleteId]/nutrition` |
| **Atleta probado** | `athlete1@fittrack.qa` (Atleta1 QA) |
| **Severidad sugerida** | 🔴 Alta (flujo core de nutrición coach roto o confuso) |
| **Estado** | ✅ Implementado (2026-06-13) — activityLevel unificado, publish macros sin plan, `quantityG` en plantillas |

### Contexto

- Admin consulta nutrición del atleta **`athlete1@fittrack.qa`**.
- En esta pantalla **sí** aparecen datos corporales correctos (p. ej. 76 kg · 178 cm · 28 años · Hombre) y última métrica — a diferencia del modal detalle (UX-003 con otro usuario).
- Pestañas: Metabolismo · Macros · Plan · Diario · Vista previa.

**Archivos relevantes:**

- `components/nutrition/nutrition-coach-editor.tsx`
- `components/nutrition/metabolism-panel.tsx`
- `components/nutrition/macro-calculator.tsx`
- `components/nutrition/meal-plan-editor.tsx`
- `components/nutrition/weekly-shopping-list.tsx`
- `hooks/use-coach-nutrition.ts`
- `lib/nutrition/meal-plan.ts` (plantillas)
- `lib/nutrition/shopping-list.ts` (lista de compra)
- API: `PUT /api/nutrition/coach-draft`, `publishMealPlan` (si `NEXT_PUBLIC_DATA_SOURCE_NUTRITION=api`)

---

### Error 1 — Metabolismo: fallo al cambiar nivel de actividad

**Síntoma:** toast rojo **"No se pudo guardar el borrador nutricional"** al cambiar el select **Nivel de actividad** (p. ej. a "Muy intenso").

**Pasos:**

1. `/admin/athletes` → Nutrición de `athlete1@fittrack.qa`
2. Pestaña **Metabolismo**
3. Cambiar **Nivel de actividad**

**Esperado:** borrador guardado (auto-save silencioso o confirmación).

**Actual:** error toast; el cambio puede no persistir tras F5.

**Causa probable:**

- `MetabolismPanel` → `saveSettings()` → `updateDraft()` → `saveCoachNutritionDraft()` en `hooks/use-coach-nutrition.ts` (líneas 77–81, 110–121).
- Fallo en persistencia (localStorage o `PUT /api/nutrition/coach-draft` según `NEXT_PUBLIC_DATA_SOURCE_NUTRITION`).
- Revisar en DevTools → Network: status HTTP y body al cambiar actividad.
- Posible validación backend (`CoachDraftSchema` en `nutrition_service.py`) rechazando el payload.

---

### Error 2 — Macros: borrador OK, fallo en "Guardar macros para el atleta"

**Síntoma:**

- **"Guardar objetivo en borrador"** → ✅ funciona (toast verde).
- **"Guardar macros para el atleta"** → ❌ toast rojo: **"Macros guardados en borrador. Crea o selecciona un plan para publicarlo al atleta."**

**Pasos:**

1. Pestaña **Macros**
2. Elegir preset (p. ej. Keto aprox.)
3. Clic en **Guardar objetivo en borrador** → OK
4. Clic en **Guardar macros para el atleta** → error

**Esperado:** macros publicados al atleta (o mensaje claro de pasos previos).

**Actual:** mensaje de error aunque los macros ya están en borrador.

**Causa probable (`components/nutrition/macro-calculator.tsx`, `handleSaveForAthlete`):**

1. El botón llama a `publish({ macroTargets })`, que exige **plan de alimentación activo** (`state.mealPlans` + `activeMealPlanId`).
2. Si no hay plan creado/seleccionado en pestaña **Plan**, muestra `toast.error` con texto que mezcla éxito parcial ("guardados en borrador") con fallo — **UX confusa**.
3. Posible race: `setMacroTargets(preview)` es async vía `updateDraft`; la comprobación `hasActivePlan` usa `state` sincrónico inmediatamente después.
4. `applyTemplate()` en `meal-plan-editor.tsx` no llama explícitamente a `setActiveMealPlan()` (solo confía en `upsertMealPlan` → `activeMealPlanId ?? plan.id`).

**Fix sugerido:**

- Separar acciones: "Guardar borrador" vs "Publicar al atleta" con prerequisitos visibles.
- Si falta plan, usar `toast.warning` / inline hint, no `toast.error` con mensaje ambiguo.
- Deshabilitar "Guardar macros para el atleta" hasta que exista plan activo.
- Tras aplicar plantilla, asegurar `setActiveMealPlan(newPlanId)`.

---

### Error 3 — Plan: plantillas rápidas sin gramos → lista de compra "Pendiente de cantidad"

**Síntoma:** al usar plantillas rápidas (p. ej. **Definición 1800**), los ítems muestran solo **kcal** (320, 450, 380, 180). En **Lista de compra (semana)** todos los alimentos aparecen como **"Pendiente de cantidad"**.

**Pasos:**

1. Pestaña **Plan**
2. Aplicar plantilla **Definición 1800** (u otras excepto parcialmente Mantenimiento 2200)
3. Revisar lista de compra inferior

**Esperado:** cantidades en gramos (o unidades) agregadas por semana.

**Actual:** badge ámbar **"Pendiente de cantidad"** en todos los ítems.

**Causa técnica:**

- Plantillas en `lib/nutrition/meal-plan.ts`: **Mantenimiento 2200** incluye `quantityG` en sus ítems; **Definición 1800**, **Volumen 2800**, **Alto rendimiento 3000**, **Vegetariano 2100** solo definen `calories`, `proteinG`, `carbsG`, `fatG` **sin `quantityG`**.
- `buildWeeklyShoppingList()` en `lib/nutrition/shopping-list.ts` marca `gramsPending: true` cuando `item.quantityG` es null/undefined.
- `WeeklyShoppingList` renderiza "Pendiente de cantidad" (`components/nutrition/weekly-shopping-list.tsx`).

**Fix sugerido:**

1. Añadir `quantityG` realista a **todas** las plantillas en `getBasicMealTemplates()` / `getProMealTemplates()`.
2. O derivar gramos estimados desde kcal/macros al aplicar plantilla.
3. En UI del plan, mostrar kcal **y** gramos; avisar si falta cantidad antes de publicar.

---

### Criterios de aceptación (propuesta)

- [ ] Cambiar nivel de actividad / objetivo calórico persiste sin error toast.
- [ ] "Guardar macros para el atleta" publica correctamente cuando hay plan + macros, o guía clara si falta un paso.
- [ ] Plantillas rápidas generan lista de compra con gramos totales, no "Pendiente de cantidad".
- [ ] Flujo completo admin: metabolismo → macros → plan → publicar → atleta ve nutrición en `/nutrition`.

### Notas DevTools

- Verificar `PUT /api/nutrition/coach-draft` y endpoint de publicación al reproducir errores 1 y 2.
- Confirmar `NEXT_PUBLIC_DATA_SOURCE_NUTRITION` en `.env.local` (local vs api).

---

## UX-005 — Asignaciones admin: modal "Reasignar" sin scroll (mismo componente que UX-002)

| Campo | Valor |
|-------|--------|
| **Fecha** | 2026-06-13 |
| **Reportado por** | QA manual (usuario admin) |
| **Ruta afectada** | `/admin/assignments` → botón **Reasignar** (y también **Asignar entrenador** en pendientes) |
| **Severidad sugerida** | 🟠 Alta (misma que UX-002) |
| **Estado** | ✅ Implementado (2026-06-13) — resuelto con el mismo `ScrollableModal` (UX-002) |
| **Relacionado** | **UX-002** (mismo modal, distinto punto de entrada) |

### Problema

En la pestaña **Asignaciones** del panel admin, al pulsar **Reasignar** sobre un atleta ya asignado se abre el modal **"Asignar Entrenador"**. La lista de entrenadores disponibles **se corta** en la parte inferior y **no tiene barra de scroll**, impidiendo seleccionar entrenadores que quedan fuera del viewport (p. ej. `Entrenador6 QA` en adelante).

**Evidencia:** captura desde `/admin/assignments` — lista visible hasta ~Entrenador5; Entrenador6 parcialmente cortado.

### Comportamiento actual

- Ruta: `app/admin/assignments/page-client.tsx`
- Botón **Reasignar** → `openAssignModal(athlete)` → `<TrainerAssignmentModal />` (líneas 237–241, 303–317).
- Botón **Asignar entrenador** (atletas sin asignar) usa el **mismo modal**.
- Componente afectado: `components/admin/trainer-assignment-modal.tsx` (sin `max-h`, sin `overflow-y-auto` en la lista).

### Solución sugerida

**Unificar fix con UX-002** en `TrainerAssignmentModal`:

1. `max-h-[min(90vh,…)]` + layout flex column.
2. Lista de entrenadores con `overflow-y-auto` y altura máxima.
3. Header y footer (Cancelar / Asignar) fijos.

Opcional: extraer layout reutilizable `ScrollableModal` para UX-002, UX-003 y este caso.

### Criterios de aceptación (propuesta)

- [ ] Desde `/admin/assignments`, Reasignar permite elegir cualquier entrenador activo (10+ en dataset QA).
- [ ] Desde la misma página, Asignar entrenador (pendientes) también scrolla correctamente.
- [ ] Fix en `TrainerAssignmentModal` corrige **ambas** rutas: `/admin/athletes` (UX-002) y `/admin/assignments` (este ítem).

### Notas

- No es un modal distinto: es el mismo `TrainerAssignmentModal` compartido entre Atletas y Asignaciones.

---

## UX-006 — Membresías admin: "Crear Plan" limitado a 3 nombres fijos

| Campo | Valor |
|-------|--------|
| **Fecha** | 2026-06-13 |
| **Reportado por** | QA manual (usuario admin) |
| **Ruta afectada** | `/admin/memberships` → botón **Crear Plan** → modal **Crear Nuevo Plan** |
| **Severidad sugerida** | 🟡 Media (limitación funcional / producto) |
| **Estado** | ✅ Implementado (2026-06-13) — nombre libre + campo `functionalTier` (migración 007) |

### Problema

Al crear un plan de membresía, el campo **Nombre** es un `<select>` con solo tres opciones fijas:

- Básica
- Premium
- Pro

**No se puede escribir un nombre nuevo** (p. ej. "Estudiante", "Corporate", "Trial 14 días"). El admin debería poder definir nombres personalizados al crear planes.

**Evidencia:** captura del modal "Crear Nuevo Plan" — dropdown de Nombre con únicamente las 3 opciones.

### Comportamiento actual

**Archivo:** `app/admin/memberships/page-client.tsx` (líneas 195–204)

```tsx
<select value={formData.name} onChange={...}>
  <option>Básica</option>
  <option>Premium</option>
  <option>Pro</option>
</select>
```

- Valor por defecto al crear: `name: 'Básica'` en `DEFAULT_FORM`.
- Tipo TypeScript en `hooks/use-memberships.ts`: `name: 'Básica' | 'Premium' | 'Pro'` — también restringe en compile-time.
- El backend/API (`createMembershipPlan`) acepta `name` como string libre; tests usan nombres como `'Premium'` custom en payloads.
- `_membership_level_from_name()` en `backend/app/schemas/serializers.py` infiere `basic` / `premium` / `pro` por substring en el nombre — nombres custom afectarían gates (Titan, etc.) según esa heurística.

### Impacto UX / producto

- Imposible diferenciar planes comerciales más allá de los 3 tiers del seed QA.
- Confusión si ya existen planes "Básica", "Premium", "Pro" y se intenta crear otro con el mismo nombre.
- Editar plan existente también queda limitado al mismo select (mismo modal en modo edición).

### Solución sugerida

1. Reemplazar `<select>` por `<Input type="text">` con validación (requerido, longitud máx., unicidad opcional).
2. Ampliar tipo `MembershipPlan.name` a `string`.
3. Definir reglas para **nivel funcional** (basic/premium/pro) si afecta Titan y permisos:
   - Campo separado "Tier" (select) + "Nombre comercial" (texto libre), o
   - Documentar heurística actual y permitir override explícito.
4. Validar duplicados en backend al crear plan.

### Criterios de aceptación (propuesta)

- [ ] Admin puede crear un plan con nombre libre (p. ej. "Plan Verano 2026").
- [ ] Nombre visible en tarjetas de `/admin/memberships` y en UI del atleta.
- [ ] Comportamiento de features Premium/Pro (Titan nutrición, etc.) documentado para nombres custom.
- [ ] Editar plan permite cambiar nombre (con validación de unicidad si aplica).

### Notas

- Seed QA (`seed_qa_dataset.py`) crea justamente Básica / Premium / Pro — la UI refleja ese dataset, no un requisito de negocio permanente.

---

*Añadir nuevos ítems como UX-007, UX-008… con la misma estructura.*
