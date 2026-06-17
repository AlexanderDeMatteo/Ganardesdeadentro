# Phosphor Reactor Deck ? Contexto y gu�a de implementaci�n

Documento de referencia para mantener coherencia visual, t�cnica y de **experiencia de usuario** en **`/admin-v2`** (Gainer Prime Protocol).  
Complementa [`docs/PROJECT_CONTEXT.md`](./PROJECT_CONTEXT.md), [`docs/UX_REVIEW_BACKLOG.md`](./UX_REVIEW_BACKLOG.md) y las reglas en `.cursor/rules/`.

**�ltima actualizaci�n:** 14 jun 2026  
**Ruta objetivo:** `/admin-v2/*` (plantilla admin oficial; `/admin/*` redirige aqu�)  
**Rutas paralelas (no mezclar estilos):** `/admin` (legacy redirect-only), `/admin-v3` (COMANDO HUD)

---

## 1. Objetivo de la reforma

Transformar el panel admin V2 de un layout plano a un **centro de comando inmersivo** (?Phosphor Reactor Deck?):

- Protagonista visual: **Reactor central** (anillo de segmentos + sparkline de asignaci�n).
- Shell t�ctico: sidebar con power rail, topbar terminal, canvas con textura.
- M�dulos con identidad `MOD-XX // T�TULO`.
- Paleta y luminiscencia alineadas con la marca **BE A GAINER LIFE**.

**Referencias de dise�o:**

- Stitch (hist�rico, no versionado en repo): luminiscencia, chamfer, pulse ? **fuente de verdad actual:** este doc + `styles/gainer-prime-theme.css`.
- Logo oficial (PNG sin fondo): `public/brand/be-a-gainer-logo.png`.

---

## 2. Alcance actual vs. pendiente

### ? Implementado (dashboard + shell)

| �rea | Estado | Archivos clave |
|------|--------|----------------|
| Tema CSS Phosphor | ? | `styles/gainer-prime-theme.css` |
| Layout + fuentes | ? | `app/admin-v2/layout.tsx`, `lib/fonts/gainer-fonts.ts` |
| Shell (canvas, vignette, scanline) | ? | `components/admin-v2/prime-shell.tsx` |
| Sidebar desktop (logo, power rail, CTA chamfer) | ? | `prime-sidebar.tsx`, `prime-power-rail.tsx` |
| Topbar (search terminal, t�tulo met�lico) | ? | `prime-top-bar.tsx` |
| Dashboard grid (3 sat�lites + 1 cr�tica + reactor) | ? | `app/admin-v2/page-client.tsx` |
| Reactor + sparkline + tooltip oscuro | ? | `prime-reactor-core.tsx` |
| M�dulos t�cticos MOD-XX | ? | `prime-module.tsx` |
| Anillo de segmentos | ? | `prime-segment-ring.tsx` |
| KPIs satellite / critical | ? | `prime-kpi-card.tsx` |
| M�tricas compartidas | ? | `hooks/use-admin-dashboard-metrics.ts` (`sparklineSeries` estimada) |
| Logo marca (PNG transparente) | ? | `public/brand/be-a-gainer-logo.png` |
| Sin navbar global duplicado | ? | `PrimeRoot` monta solo `PrimeShell` (evita UX-001 en V2) |

### ?? Parcial / fuera del pase inicial

| �rea | Estado | Notas |
|------|--------|-------|
| Atletas `/admin-v2/athletes` | ? | MOD-11/12/13: tabla, inspector lateral, filtros; modales con `prime` |
| Entrenadores `/admin-v2/trainers` | ? | MOD-21/22: grid, inspector, invitar/desactivar con `prime` |
| Asignaciones `/admin-v2/assignments` | ? | MOD-41/42/43: matriz carga, pendientes, capacidad trainer |
| Rutinas `/admin-v2/routines` | ? | MOD-31/32: inventario + `RoutineBuilder` con skin Prime |
| Membres�as `/admin-v2/memberships` | ? | MOD-51/52: CRUD planes v�a `useMemberships` |
| Ejercicios `/admin-v2/exercises` | ? | MOD-61..65: sync cat�logo, filtros, inventario cat�logo/custom, formulario |
| Sparkline 7d | ?? | Datos **estimados** desde `assignmentRate`; falta serie temporal real en API |
| Logo SVG vectorial | ?? | Solo PNG; el `.svg` en `public/brand/` es placeholder hist�rico |
| **Nav m�vil** | ?? | Sidebar `hidden md:flex`; sin drawer ni bottom nav ? **bloqueante en &lt;768px** |
| **Controles shell** | Parcial | MOD-66/67/68 operativos; refresh dashboard y perfil sin comportamiento real |
| **Tokens en TSX** | ?? | Muchos `text-[#?]` / `bg-[#?]` pese a Regla 5 ? deuda t�cnica visual |
| **Empty states V2** | ?? | Inspector atleta con avisos biometr�a; revisar copy en otras secciones |

### ? Fuera de alcance (no tocar en esta reforma)

- `app/admin-v3/*` (HUD glass ? sistema visual distinto)
- Backend / contratos API (salvo consumir serie temporal cuando exista)

**Nota:** `app/admin/*` permanece solo como rutas con redirect permanente a `/admin-v2/*` (ver `next.config.mjs` y `lib/admin-v2/admin-redirect-map.ts`).

### Alcance atleta (app usuario)

Las rutas `/dashboard`, `/routines`, `/metrics`, `/nutrition`, `/memberships` y `/profile` usan el **mismo tema** `gainer-prime-theme.css` bajo `app/(athlete-prime)/` y `components/athlete-prime/*`. Reutilizan primitivos `admin-v2/prime-*` (mismo criterio de tokens `gp-*`). No mezclar `brand-shell` ni `dashboard-v3-*` en esas rutas.

---

## 3. Las 6 reglas de oro (obligatorias)

Aplican a **CSS, componentes React y data viz**. No negociables.

### Regla 1 ? Glow con profundidad �ptica

Nunca un solo `box-shadow`. Usar clases:

- `.gp-phosphor-glow` ? acento verde
- `.gp-phosphor-glow-critical` ? acento rojo (`#ffb4ab` / `#ff8a7a`)

Tres capas apiladas: n�cleo inset + bloom 4px + halo `--gp-glow-spread` + dispersi�n `--gp-glow-spread-wide`.

**No abusar:** glow solo en hero, KPI cr�tica, hover de sat�lite y CTAs primarios.

### Regla 2 ? Data viz inmersivo (Recharts)

En el reactor (`prime-reactor-core.tsx`):

- `CustomTooltip` con fondo `#151d19`, borde `.gp-module-corner`, tipograf�a mono.
- **Prohibido** el tooltip blanco por defecto de Recharts.
- `isAnimationActive={false}` en tooltip y series.
- Badge o copy **?Estimado?** mientras `sparklineSeries` no venga de API real.

### Regla 3 ? Estabilidad monospace en n�meros

- Clase **`.gp-metric`**: mono + `font-variant-numeric: tabular-nums`.
- Aplicar a KPIs, fechas, porcentajes, ratios, celdas num�ricas de tablas.
- **`.gp-display`** (Anybody): solo t�tulos est�ticos (?Dashboard General?, ?REACTOR?).
- El layout no debe ?temblar? al actualizar datos.

### Regla 4 ? Textura de canvas correcta

- Ruido SVG en `.gp-canvas::before` con `mix-blend-mode: overlay` (o `soft-light` en sidebar header).
- No simular grano solo con `opacity` plana sobre el fondo.

### Regla 5 ? Variables CSS en la ra�z

Todas bajo `.gainer-prime-root` en `gainer-prime-theme.css`. Iterar ah�, no hardcodear en componentes.

**Clases sem�nticas preferidas** (usar en TSX en lugar de hex literals):

| Clase | Token |
|-------|-------|
| `.gp-text-primary` | `--gp-on-surface` |
| `.gp-text-muted` | `--gp-on-surface-variant` |
| `.gp-text-dim` | tono terciario `#899483` |
| `.gp-text-phosphor` | `--gp-phosphor-bright` |
| `.gp-text-critical` | `--gp-error` |
| `.gp-bg-surface` | `--gp-surface` |
| `.gp-bg-surface-high` | `--gp-surface-high` |
| `.gp-bg-surface-variant` | `--gp-surface-variant` |
| `.gp-border-outline` | `--gp-outline-variant` |

En PRs nuevas: **0 hex literals nuevos** en `app/admin-v2/*` y `components/admin-v2/*` salvo excepci�n documentada.

### Regla 6 ? Affordance honesta (controles del shell)

No montar controles que parezcan activos sin comportamiento:

| Permitido | Prohibido |
|-----------|-----------|
| Bot�n con `onClick` / `href` real | Input b�squeda sin handler |
| Icono `disabled` + `aria-disabled` + estilo atenuado | Campana con LED si no hay panel |
| Badge ?Pr�ximamente? en topbar | Refresh sin acci�n de recarga |
| Omitir el control hasta implementarlo | Avatar sin men� perfil/logout |

Si un KPI enlaza a una ruta `PrimeComingSoon`, mostrar indicador **?En migraci�n?** en el card o deshabilitar el link hasta que la secci�n exista.

---

## 4. Estrategia de adopci�n (V2 / legacy / V3)

Hoy coexisten **tres** paneles admin. Este doc gobierna solo V2; la migraci�n debe ser expl�cita para no frustrar al usuario.

| Ruta | Rol | Estado producto |
|------|-----|-----------------|
| `/admin` | Legacy operativo | **Home por defecto** (`getHomeRouteForRole('admin')`) |
| `/admin-v2` | Gainer Prime (Phosphor) | Preview / beta ? dashboard + atletas parcial |
| `/admin-v3` | COMANDO HUD (glass) | Experimento visual paralelo |

### Fases recomendadas

```
Fase A ? Preview opt-in (actual)
  Admin entra por /admin; enlace ?Probar Gainer Prime? ? /admin-v2
  Stubs PrimeComingSoon con fallback a legacy

Fase B ? V2 por defecto
  getHomeRouteForRole('admin') ? /admin-v2
  Banner ?Vista cl�sica? ? /admin hasta retirar legacy

Fase C ? Retiro legacy
  /admin redirige a /admin-v2
  Eliminar duplicaci�n de page-client entre admin y admin-v2
```

### Decisiones de dise�o

1. **No enlazar KPIs a stubs** sin aviso visual (Regla 6).
2. **Mismos datos** que `/admin` en todo momento (`useAdmin`, `useAdminDashboardMetrics`).
3. **Reutilizar fixes UX legacy** al migrar: `ScrollableModal`, empty states (ver �17).
4. **V3 no compite con V2** en adopci�n; es l�nea visual alternativa, no sustituto operativo.

---

## 5. Principios UX de producto

1. **Una acci�n primaria por vista** ? Dashboard: asignar atletas sin entrenador (CTA sidebar + m�dulo MOD-03).
2. **No dead-ends** ? Si la secci�n no est� migrada, el usuario debe saberlo antes de navegar (KPI, nav item o stub con copy claro).
3. **Datos honestos** ? Sparkline estimada lleva disclaimer; no presentar como hist�rico real.
4. **Coherencia operativa** ? Flujos cr�ticos (asignar trainer, membres�as, nutrici�n coach) deben funcionar igual o mejor que legacy antes de Fase B.
5. **Jerarqu�a visual = jerarqu�a de negocio** ? Cr�tico (rojo) ? pendientes ? reactor (salud global) ? comunidad (contexto).
6. **Acciones siempre alcanzables** ? Botones de fila visibles con `:focus-visible`, no solo `:hover` (teclado y touch).

---

## 6. Voice & tone

**Modelo:** espa�ol de producto + nomenclatura t�ctica en ingl�s **solo** donde aporta identidad (IDs MOD, siglas de estado).

| Contexto | Idioma | Ejemplo correcto | Evitar |
|----------|--------|------------------|--------|
| T�tulos de p�gina | ES | ?Dashboard General?, ?Atletas? | ?Command Center? |
| Labels UI / tablas | ES | ?Sin entrenador?, ?Ver todos? | ?Keep pushing? |
| IDs de m�dulo | EN uppercase | `MOD-07 // COBERTURA_ASIGNACI�N` | Mezclar ES en el slug |
| Status operativo | ES (mono) | ?Estado: ? Requiere acci�n? | ?System Status: Action required? |
| Placeholders | ES | ?Buscar atletas?? | ?Search Command?? |
| Prioridades en tabla | ES | `ALTA` / `MEDIA` / `BAJA` | `HIGH` / `MED` / `LOW` |
| Marca | Como logo | ?BE A GAINER LIFE? (met�lico en topbar) | Repetir bajo logo PNG |

**Tono:** directo, operativo, sin jerga sci-fi que no ayude a completar tareas. La est�tica es t�ctica; el copy es utilitario.

---

## 7. Mapa MOD-XX (inventario oficial)

Reservar ID en PR antes de crear m�dulos nuevos. No reutilizar IDs entre pantallas.

### Dashboard (`/admin-v2`)

| MOD | T�tulo | Componente | Notas |
|-----|--------|------------|-------|
| 03 | `PENDIENTES_ASIGNACI�N` | Lista r�pida + link atletas | variant `critical` |
| 05 | `ASIGNACIONES_PENDIENTES` | Tabla pendientes | 2/3 grid inferior |
| 07 | `COBERTURA_ASIGNACI�N` | `PrimeReactorCore` | variant `reactor` |
| 09 | `ESTADO_COMUNIDAD` | Ring + meta 100% | widget contextual |

### Atletas (`/admin-v2/athletes`) ? reservados

| MOD | T�tulo | Uso propuesto |
|-----|--------|---------------|
| 11 | `REGISTRO_ATLETAS` | Tabla principal |
| 12 | `INSPECTOR_ATLETA` | Panel lateral detalle |
| 13 | `FILTROS_OPERATIVOS` | `PrimeFilterPills` + b�squeda |

### Entrenadores (`/admin-v2/trainers`)

| MOD | T�tulo | Componente |
|-----|--------|------------|
| 21 | `PLANTILLA_ENTRENADORES` | `PrimeTrainersGrid` |
| 22 | `INSPECTOR_ENTRENADOR` | `PrimeTrainerInspector` |

### Rutinas (`/admin-v2/routines`)

| MOD | T�tulo | Componente |
|-----|--------|------------|
| 31 | `INVENTARIO_RUTINAS` | `PrimeRoutinesGrid` |
| 32 | `BUILDER_RUTINA` | `RoutineBuilder` con `prime` |

### Asignaciones (`/admin-v2/assignments`)

| MOD | T�tulo | Componente |
|-----|--------|------------|
| 41 | `MATRIZ_ASIGNACI�N` | `PrimeAssignmentMatrix` |
| 42 | `PENDIENTES_ASIGNACI�N` | `PrimePendingAssignments` (variant `critical`) |
| 43 | `CARGA_TRAINER` | `PrimeTrainerWorkloadBlock` (por entrenador) |

### Membres�as (`/admin-v2/memberships`)

| MOD | T�tulo | Componente |
|-----|--------|------------|
| 51 | `PLANES_MEMBRES�A` | `PrimeMembershipPlansGrid` |
| 52 | `FORMULARIO_PLAN` | `PrimeMembershipPlanForm` (modal) |

### Ejercicios (`/admin-v2/exercises`)

| MOD | T�tulo | Componente |
|-----|--------|------------|
| 61 | `SYNC_EXERCISEDB` | `ExerciseSyncBanner` (solo admin) |
| 62 | `FILTROS_CAT�LOGO` | `ExerciseCatalogTabs` + `ExerciseMuscleFilter` |
| 63 | `INVENTARIO_CAT�LOGO` | `PrimeExerciseCatalogGrid` (modo cat�logo) |
| 64 | `INVENTARIO_CUSTOM` | `PrimeExerciseCatalogGrid` (modo custom) |
| 65 | `FORMULARIO_EJERCICIO` | `ExerciseFormModal` (`prime`) |

### Otras secciones ? hist�rico

| MOD | Secci�n | T�tulo |
|-----|---------|--------|
| 21 | Entrenadores | `PLANTILLA_ENTRENADORES` |
| 31 | Rutinas | `INVENTARIO_RUTINAS` |
| 41 | Asignaciones | `MATRIZ_ASIGNACI�N` |
| 51 | Membres�as | `PLANES_MEMBRES�A` |

---

## 8. Par�metros de dise�o (tokens)

### Colores

| Token | Valor | Uso |
|-------|-------|-----|
| `--gp-background` | `#0d1511` | Fondo base, canvas |
| `--gp-surface` | `#19211d` | M�dulos, cards |
| `--gp-surface-high` | `#242c27` | Inputs, chips |
| `--gp-surface-variant` | `#2e3732` | Hover filas, fondos secundarios |
| `--gp-phosphor` | `#68ca62` | Acento principal |
| `--gp-phosphor-bright` | `#83e77b` | Nav activo, highlights |
| `--gp-phosphor-core` | `#95fa8b` | Glow intenso, power rail |
| `--gp-hex-border` | `#255831` | Bordes m�dulos |
| `--gp-on-surface` | `#dce5de` | Texto principal |
| `--gp-on-surface-variant` | `#becab8` | Labels, mono secundario |
| `--gp-outline-variant` | `#3f4a3c` | Divisores, bordes suaves |
| `--gp-error` | `#ffb4ab` | KPI cr�tica, alertas |
| `--gp-error-core` | `#ff8a7a` | Glow cr�tico |

### Glow y motion

| Token | Valor | Uso |
|-------|-------|-----|
| `--gp-glow-spread` | `24px` | Halo medio |
| `--gp-glow-spread-wide` | `48px` | Dispersi�n ambiental |
| `--gp-glow-core-alpha` | `0.55` | Bloom cercano |
| `--gp-glow-mid-alpha` | `0.28` | Halo |
| `--gp-glow-ambient-alpha` | `0.12` | Ambient |
| `--gp-animation-speed` | `8s` | Scanline |
| `--gp-animation-speed-fast` | `2s` | Pulse LED |
| `--gp-animation-speed-halo` | `3s` | Logo halo |
| `--gp-enter-duration` | `400ms` | Entrada stagger |
| `--gp-module-radius` | `6px` | M�dulos |
| `--gp-chamfer-size` | `12px` | CTAs chamfer |

### Tipograf�a

Definida en `lib/fonts/gainer-fonts.ts`, aplicada en `app/admin-v2/layout.tsx`:

| Clase CSS | Fuente | Uso |
|-----------|--------|-----|
| `.gp-display` | Anybody 700/800 | T�tulos est�ticos |
| `.gp-mono` | JetBrains Mono | Labels UI, IDs MOD-XX |
| `.gp-metric` | JetBrains Mono + tabular-nums | **N�meros mutables** |
| `.gp-label` | Hanken Grotesk 600 | Labels uppercase peque�os |

---

## 9. Arquitectura de capas (shell)

```
.gainer-prime-root
??? PrimeSidebar (280px desktop; drawer <md ? pendiente)
??? columna principal
    ??? PrimeTopBar (fixed, backdrop-blur)
    ??? .gp-canvas-wrap
        ??? main.gp-canvas.gp-vignette
            ??? .gp-scanline (decorativo)
            ??? .gp-canvas-content (contenido de p�gina)
```

**Sidebar header:** logo `130px` + `.gp-logo-halo`, sin texto duplicado bajo el logo (el PNG ya incluye ?BE A GAINER LIFE?).

**V2 no monta `Navbar` global** ? toda la navegaci�n de secci�n vive en sidebar (desktop) o nav m�vil (pendiente).

---

## 10. Patrones responsive y nav m�vil

### Breakpoints de validaci�n obligatoria

| Viewport | Objetivo |
|----------|----------|
| **1440px** | Grid dashboard completo; sidebar fijo |
| **768px** | KPIs 2�2; reactor full width; **nav usable** |
| **390px** | Una columna; tablas con scroll horizontal; CTA primario visible |

### Estado actual (gap)

- `PrimeSidebar`: `hidden md:flex` ? en m�vil **no hay men�**.
- `prime-shell.tsx`: `pb-24` en m�vil sugiere bottom nav planificado pero no implementado.

### Especificaci�n: `PrimeMobileNav` (pendiente)

```
???????????????????????????????????????????????
? [?]  BE A GAINER LIFE          [??]        ?  ? topbar compacta (hamburger + marca + perfil)
???????????????????????????????????????????????
?                                             ?
?              (contenido p�gina)             ?
?                                             ?
???????????????????????????????????????????????
? Dashboard? Atletas  ? Asignar  ? M�s        ?  ? bottom dock fijo (4 �tems)
???????????????????????????????????????????????
```

**Comportamiento:**

1. **Hamburger** abre drawer overlay con `ADMIN_V2_NAV_ITEMS` completo + power rail.
2. **Bottom dock:** Dashboard, Atletas, CTA central ?Asignar? (`/admin-v2/athletes`), ?M�s? (resto).
3. **CTA chamfer** del sidebar desktop se replica como bot�n central elevado en dock.
4. `z-index`: dock `z-50`, drawer `z-60`, backdrop `bg-[#0d1511]/90`.
5. `prefers-reduced-motion`: drawer sin slide animado (aparici�n instant�nea).

**Archivos a tocar:** `prime-shell.tsx`, nuevo `prime-mobile-nav.tsx`, `prime-sidebar.tsx` (extraer �tems compartidos).

---

## 11. Grid del dashboard (referencia)

```
???????????????????????????????????????????????????????????????
? Header status + fecha + refresh m�tricas                    ?
???????????????????????????????????????????????????????????????
? KPI sat  ? KPI sat  ? KPI sat  ? KPI CR�TICA (modal)        ?
? Atletas  ? Trainers ? Membres�as? Sin entrenador            ?
?????????????????????????????????????????????????????????????
? MOD-07 SATURACI�N (2/3)      ? MOD-03 RETENCI�N (1/3)       ?
?????????????????????????????????????????????????????????????
? MOD-05 COLA_OPS (2/3)        ? MOD-09 TELEMETR�A (1/3)      ?
???????????????????????????????????????????????????????????????
```

**KPIs:** `layout="satellite"` (compacta) o `layout="critical"` (glow rojo, valor 5xl, `onClick` sin `href` para alertas).  
**Entrada:** `.gp-enter` con `--gp-delay` escalonado (60ms, 120ms, ?).

**Datos:** `GET /api/admin/dashboard/metrics` ? membres?as/MRR, capacidad, retenci?n, telemetr?a, cola operaciones.

---

## 12. Inventario de componentes `admin-v2`

### Implementados

| Componente | Cu�ndo usar |
|------------|-------------|
| `PrimeModule` | Bloques con cabecera `MOD-XX // T�TULO`; variants: `default`, `critical`, `reactor` |
| `PrimeKpiCard` | M�tricas superiores; `layout="satellite" \| "critical"`; `onClick` para KPI accionable |
| `PrimeCapacityReactor` | MOD-07 saturaci�n operativa; `loadPercent`, capacidad/carga, tendencia 7d |
| `PrimeRetentionPanel` | MOD-03 alerta retenci�n (expiring/inactive + mailto) |
| `PrimePlatformTelemetry` | MOD-09 telemetr�a entrenamientos (stats + barras semanales) |
| `PrimeOperationsQueue` | MOD-05 cola operaciones con asignaci�n inline |
| `PrimeUnassignedAlertModal` | Modal cr�tico desde KPI �Sin Entrenador� |
| `PrimeAlertsPanel` | MOD-66 dropdown campana ? alertas accionables globales |
| `PrimeActivityLogPanel` | MOD-67 dropdown historial ? bit�cora operativa |
| `PrimeCommandPalette` | MOD-68 paleta de comandos — navegacion, acciones y entidades (`Ctrl+K`) |
| `PrimeCommandTrigger` | Trigger terminal en top bar; placeholder `Buscar comando...` |
| `PrimeReactorCore` | Legacy asignaci�n (deprecado en dashboard; usar `PrimeCapacityReactor`) |
| `PrimeSegmentRing` | Anillo SVG 16 segmentos; reactor y widget comunidad |
| `PrimePowerRail` | Solo dentro del sidebar; sincronizado con `ADMIN_V2_NAV_ITEMS` |
| `PrimeFilterPills` | Filtros en listados (atletas, entrenadores) |
| `PrimeAthleteInspector` | Panel lateral inspector atleta (MOD-12) |
| `PrimeTrainerInspector` | Panel lateral inspector entrenador (MOD-22) |
| `PrimePageHeader` | Cabecera de p�gina con t�tulo + CTA chamfer |
| `PrimeSearchInput` | Buscador terminal reutilizable |
| `PrimeKpiStrip` | Fila de KPIs satellite/critical |
| `PrimeInspectorCta` | CTAs en inspectores y footers de m�dulos |
| `PrimeChamferButton` | CTA primario `.gp-chamfer` |
| `PrimeScrollableModal` | Modal scrollable con skin Prime |
| `PrimeComingSoon` | Stubs legacy (ya no usado en rutas operativas V2) |
| `PrimeProgressSegments` | Barra de capacidad en asignaciones |

### Pendientes de especificar / implementar

| Componente | Responsabilidad | Referencia legacy |
|------------|-----------------|-------------------|
| `PrimeMobileNav` | Drawer + bottom dock &lt;md | �10 |
| `PrimeDataTable` | Tabla dentro de `PrimeModule`; thead mono, row hover, acciones siempre focusables | Tablas en `page-client.tsx` |
| `PrimeSelect` / `PrimeInput` | Forms estilo terminal; borde inferior o `gp-bg-surface-high` | Reemplazar shadcn crudo en atletas |
| `PrimeModal` | Wrapper Prime sobre `ScrollableModal` | `components/ui/scrollable-modal.tsx` |
| `PrimeEmptyState` | Copy ?Sin registrar?, ???, ?No indicada? | UX-003 en `athlete-detail-modal.tsx` |
| `PrimeUserMenu` | Perfil + logout en topbar | Navbar legacy minimal |

**Datos:** siempre v�a `useAdmin()` / `useAdminDashboardMetrics()` ? mismos n�meros que `/admin`.

---

## 13. Gram�tica visual ? tablas, forms, modales

### Tablas (`PrimeDataTable` o patr�n manual)

```tsx
<PrimeModule modId="11" title="REGISTRO_ATLETAS">
  <div className="overflow-x-auto">
    <table>
      <thead> {/* gp-mono, uppercase, bg surface-variant */} </thead>
      <tbody className="gp-mono text-sm">
        <tr className="hover:bg-surface-variant/20 focus-within:bg-surface-variant/20">
          <td className="gp-metric">?</td>  {/* solo columnas num�ricas */}
        </tr>
      </tbody>
    </table>
  </div>
</PrimeModule>
```

- Acciones: icono + `aria-label` en espa�ol; **visibles con `focus-visible`**, no solo hover.
- Prioridad: badges `ALTA` / `MEDIA` / `BAJA` (ES).
- Empty: fila centrada `gp-mono` ?Sin registros?.

### Forms

- Inputs: clase `gp-search-terminal` o variante con fondo `gp-bg-surface-high`.
- Labels: `.gp-label` o `.gp-mono text-xs uppercase`.
- Selects: mismo borde que terminal; no usar estilo shadcn blanco por defecto.
- CTAs primarios: `.gp-chamfer` + phosphor; secundarios: borde `outline-variant`.

### Modales

- Base: `ScrollableModal` (header/footer fijos, cuerpo scroll).
- Skin: fondo `#19211d`, header con `gp-module-id` opcional, bordes `gp-hex-border`.
- Listas largas (entrenadores, atletas): zona central `flex-1 overflow-y-auto` ? **obligatorio** (UX-002/005).

### Empty states (contenido)

| Dato faltante | Mostrar | No mostrar |
|---------------|---------|------------|
| Edad null | ?No indicada? | `a�os` suelto |
| Peso/altura 0 o null | ?Sin registrar? | `0 kg` / `0 cm` |
| Sin entrenador | ?Sin asignar? | celda vac�a |
| Sin m�tricas | ?Sin m�tricas registradas? | mezclar con ceros de perfil |

Helper sugerido: `formatPrimeField(value, unit?)` en `lib/` o inline en panel.

---

## 14. Accesibilidad (criterios medibles)

### Contraste m�nimo (WCAG 2.1 AA)

| Par | Ratio objetivo | Uso |
|-----|----------------|-----|
| `#dce5de` sobre `#19211d` | ? 4.5:1 | Texto principal |
| `#becab8` sobre `#19211d` | ? 4.5:1 | Labels mono |
| `#899483` sobre `#19211d` | ? 4.5:1 | Texto terciario (validar; puede requerir aclarar) |
| `#83e77b` sobre `#0d1511` | ? 3:1 | Acentos grandes / iconos activos |

### Focus

- Todos los interactivos: `focus-visible:ring-2 focus-visible:ring-[#68ca62]` (o `ring-[var(--gp-phosphor)]`).
- Un `<nav aria-label="Navegaci�n admin">` principal por vista.
- Orden de tab l�gico: sidebar/drawer ? topbar ? contenido ? dock m�vil.

### Gr�ficos y visualizaciones

- `PrimeSegmentRing`: `aria-label` con valor porcentual (ya en reactor).
- Sparkline: no depender solo del color; tooltip con valor num�rico.
- KPI cr�tica: no solo rojo ? incluir texto ?Requiere acci�n? / icono `AlertTriangle`.

### Motion

- `prefers-reduced-motion: reduce` desactiva scanline, halo, pulse, enter (implementado en tema).
- No autoplay de animaciones > 5s sin pausa.

---

## 15. Clases CSS m�s usadas

| Clase | Prop�sito |
|-------|-----------|
| `.gp-module` | Contenedor t�ctico `#19211d`, borde hex |
| `.gp-module-header` + `.gp-module-id` | Cabecera MOD-XX |
| `.gp-module-corner` | Tri�ngulo phosphor esquina superior derecha |
| `.gp-phosphor-glow` / `-critical` | Glow multicapa (Regla 1) |
| `.gp-chamfer` | CTA con clip-path |
| `.gp-search-terminal` | Input b�squeda topbar (solo border-bottom) |
| `.gp-title-metallic` | Gradiente t�tulo ?BE A GAINER LIFE? |
| `.gp-reactor-tooltip` | Tooltip Recharts oscuro |
| `.gp-kpi-satellite` | Hover glow en KPIs sat�lite (via CSS en tema) |
| `.gp-power-bar-active` | Item nav activo |
| `.gp-logo-halo` | Animaci�n respiraci�n en logo |
| `.gp-text-*` / `.gp-bg-*` | Tokens sem�nticos (Regla 5) |

---

## 16. Marca y assets

| Archivo | Rol |
|---------|-----|
| `public/brand/be-a-gainer-logo.png` | **Logo oficial** (PNG sin fondo) ? sidebar V2 |
| `public/brand/be-a-gainer-logo.jpg` | Copia JPEG con fondo (respaldo, no usar en sidebar) |
| `public/brand/be-a-gainer-logo.svg` | Placeholder vectorial antiguo ? **no usar** |
| `public/brand/be-a-gainer-shield.svg` | Placeholder; usado en `/admin-v3` watermark |

Al sustituir el logo: mantener `width` ~130px, `object-contain`, `.gp-logo-halo`.

---

## 17. Coherencia con `UX_REVIEW_BACKLOG.md`

Al migrar flujos de legacy a V2, **no reintroducir** bugs ya cerrados:

| �tem | Aprendizaje | Aplicaci�n en V2 |
|------|-------------|------------------|
| UX-001 | Nav redundante confunde | V2 correcto sin navbar; mantener al a�adir mobile nav |
| UX-002 / UX-005 | Modal lista sin scroll | Usar `ScrollableModal` en asignaci�n trainer V2 |
| UX-003 | Empty states y modal scroll | `PrimeAthleteDetailPanel` + `PrimeModal` |
| UX-004 | Flujos nutrici�n coach | Nutrici�n desde V2 debe enlazar a ruta existente hasta migrar UI |
| UX-006 | Forms de membres�a | Al migrar MOD-51, nombre libre + `functionalTier` |

---

## 18. Backlog de la reforma (pr�ximos pasos)

Orden sugerido para continuar el plan sin romper coherencia:

### Prioridad bloqueante

1. **UX-P1 ? Nav m�vil** ? `PrimeMobileNav` (drawer + bottom dock); desbloquea &lt;768px.
2. **UX-P2 ? Regla 6 en shell** ? Implementar o deshabilitar b�squeda, notificaciones, refresh, men� usuario.

### Migraci�n de pantallas

3. **Atletas V2** ? ? MOD-11/12/13 completos.
4. **Entrenadores** ? ? MOD-21/22.
5. **Rutinas / Asignaciones / Membres�as / Ejercicios** ? ? MOD-31/32, MOD-41/42/43, MOD-51/52, MOD-61..65.
6. **Cutover admin oficial** ? ? Login y nav apuntan a `/admin-v2`; `/admin/*` redirige.
7. **API sparkline** ? Serie real 7d; mantener badge ?Estimado? hasta entonces.

### Calidad y deuda

7. **UX-P7 ? Tokens sem�nticos** ? Migrar hex literals en componentes existentes a clases `.gp-text-*` / `.gp-bg-*`.
8. **Accesibilidad pass** ? Validar contrastes �14; prioridades ES en tablas.
9. **Voice & tone sweep** ? Sustituir copy EN residual en dashboard/topbar (�6).
10. **Limpieza** ? Placeholders SVG/JPEG en `public/` cuando ya no se referencien.
11. **Fase A?B** ? Enlace ?Probar Gainer Prime? desde `/admin` + pol�tica KPIs?stubs.

---

## 19. Checklist de validaci�n por tarea

Antes de dar por cerrada cualquier cambio en `/admin-v2`:

### Build y datos

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm build` (ruta `/admin-v2` compila)
- [ ] Datos: KPIs coherentes con `/admin`

### Reglas de oro

- [ ] Regla 1: glow multicapa solo en hero/cr�ticos/hover
- [ ] Regla 2: tooltips Recharts oscuros; badge si datos estimados
- [ ] Regla 3: n�meros en `.gp-metric`, t�tulos en `.gp-display`
- [ ] Regla 4: textura canvas/noise con blend
- [ ] Regla 5: sin hex literals nuevos; tokens `--gp-*` o clases `.gp-text-*`
- [ ] Regla 6: sin controles decorativos que parezcan activos

### UX y responsive

- [ ] Visual: **1440px, 768px y 390px**
- [ ] Nav usable en m�vil (drawer o bottom dock)
- [ ] Acciones de tabla accesibles con teclado (`focus-visible`)
- [ ] Empty states: no `0 kg` ni campos vac�os confusos
- [ ] Modales con listas largas: scroll interno (UX-002)

### Accesibilidad y motion

- [ ] `prefers-reduced-motion`: sin scanline/halo/pulse/enter
- [ ] Focus ring phosphor en interactivos nuevos
- [ ] `aria-label` en iconos de acci�n (ES)

### Opcional

- [ ] Docker: `docker compose up -d --build fittrack-frontend`

---

## 20. Stack permitido

- Tailwind v4 + CSS custom (`gainer-prime-theme.css`)
- Recharts (ya en proyecto) + `components/ui/chart.tsx` si aplica
- Fuentes: `lib/fonts/gainer-fonts.ts`
- Modales: `components/ui/scrollable-modal.tsx`
- **Sin librer�as UI nuevas** (HeroUI fue retirado de V2)

---

## 21. Convenciones al extender

1. Scope CSS bajo `.gainer-prime-root` ? no contaminar `/admin` ni `/admin-v3`.
2. Nuevos bloques de p�gina ? `PrimeModule` con `modId` del �7 documentado en la PR.
3. N�meros din�micos ? `.gp-metric`; nunca Anybody en contadores.
4. Estados loading ? skeletons `gp-bg-surface-high`, respetando el grid de la pantalla.
5. Enlaces y CTAs ? `focus-visible:ring-2 focus-visible:ring-[var(--gp-phosphor)]`.
6. Controles del shell ? Regla 6 (affordance honesta).
7. Copy ? �6 Voice & tone (ES producto, EN solo en MOD IDs).
8. Modales y listas ? `ScrollableModal` + gram�tica �13.
9. Leer este doc + `docs/PROJECT_CONTEXT.md` antes de tocar auth, roles o datos sensibles.

---

## 22. Referencia r�pida de archivos

```
styles/gainer-prime-theme.css          # Sistema visual (fuente de verdad tokens)
lib/fonts/gainer-fonts.ts              # Anybody, Hanken, JetBrains
app/admin-v2/layout.tsx                # Import tema + PrimeRoot
app/admin-v2/page-client.tsx           # Dashboard Phosphor
app/admin-v2/athletes/page-client.tsx  # Atletas MOD-11/12/13
app/admin-v2/trainers/page-client.tsx  # Entrenadores MOD-21/22
app/admin-v2/assignments/page-client.tsx
app/admin-v2/routines/page-client.tsx
app/admin-v2/memberships/page-client.tsx
hooks/use-admin-dashboard-metrics.ts   # M�tricas + sparklineSeries
components/admin-v2/
  prime-root.tsx                       # ProtectedRoute + shell (sin Navbar)
  prime-shell.tsx
  prime-sidebar.tsx                    # Desktop only hoy
  prime-top-bar.tsx
  prime-module.tsx
  prime-kpi-card.tsx
  prime-reactor-core.tsx
  prime-segment-ring.tsx
  prime-power-rail.tsx
  prime-athlete-inspector.tsx
  prime-trainers-grid.tsx
  prime-trainer-inspector.tsx
  prime-assignment-matrix.tsx
  prime-pending-assignments.tsx
  prime-routines-grid.tsx
  prime-membership-plan-card.tsx
  prime-membership-plan-form.tsx
  prime-page-header.tsx
  prime-search-input.tsx
  prime-kpi-strip.tsx
  prime-inspector-cta.tsx
  prime-scrollable-modal.tsx
  prime-coming-soon.tsx
components/ui/scrollable-modal.tsx     # Base modales scroll (legacy + V2)
docs/UX_REVIEW_BACKLOG.md              # Hallazgos QA a no reintroducir
public/brand/be-a-gainer-logo.png      # Logo sidebar
```
