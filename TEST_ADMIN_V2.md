# Guía de Pruebas — Admin Phosphor V2 (`/admin-v2`)

Plantilla admin oficial. Las rutas legacy `/admin/*` redirigen permanentemente a `/admin-v2/*`.

Ver también: [`docs/PHOSPHOR_REACTOR_CONTEXT.md`](docs/PHOSPHOR_REACTOR_CONTEXT.md) (checklist §19).

## Credenciales

- **Email:** `admin@example.com`
- **Contraseña:** `password123`

## Requisitos de entorno (API)

- Backend en `http://localhost:5000`
- `NEXT_PUBLIC_DATA_SOURCE_ROUTINES=api` (y resto de dominios API según `docker-compose.yml`)
- Sesión JWT activa como admin

---

## Checklist de revisión

### 1. Acceso y cutover

- [ ] Login como admin → redirección a `/admin-v2` (no `/admin`)
- [ ] Navegar a `/admin` → redirige a `/admin-v2`
- [ ] Navegar a `/admin/routines` → redirige a `/admin-v2/routines`
- [ ] Sidebar sin enlace «Admin legacy»
- [ ] Navbar/dashboard enlazan a `/admin-v2`

### 2. Dashboard (`/admin-v2`)

- [ ] KPI 1–2: Atletas y Entrenadores activos coherentes con API
- [ ] KPI 3: Membresías activas + footer MRR estimado (verde)
- [ ] KPI 4: «Sin Entrenador» abre modal crítico (sin duplicar en MOD-03)
- [ ] MOD-07 `SATURACIÓN_OPERATIVA`: % carga, capacidad/carga actual, tendencia 7d
- [ ] MOD-03 `ALERTA_RETENCIÓN`: badges expiring (ámbar) / inactive 7d (rojo) + Contactar
- [ ] MOD-05 `COLA_DE_OPERACIONES`: tabla compacta + Asignar abre modal entrenador
- [ ] MOD-09 `TELEMETRÍA_ENTRENAMIENTOS`: entrenamientos semana + métricas hoy + barras
- [ ] Botón refresh recarga métricas (`/api/admin/dashboard/metrics`)

### 2b. Top bar global (todas las rutas `/admin-v2`)

- [ ] Campana MOD-66: badge con contador; críticas persisten tras marcar leído
- [ ] Al abrir campana: avisos warning/info se marcan leídos; críticas siguen en badge
- [ ] Historial MOD-67: bitácora con filtros Todo / Actividad / Operaciones
- [ ] Comando MOD-68: clic en «Buscar comando...» abre paleta; `Ctrl+K` / `Cmd+K` abre y cierra
- [ ] MOD-68: navegación a rutas admin, acciones rápidas y búsqueda de atleta por nombre/email
- [ ] Al volver a la pestaña o tras ~5 min, datos se refrescan (sin recargar página)

### 3. Atletas (`/admin-v2/athletes`)

- [ ] MOD-13 filtros funcionan
- [ ] MOD-11 tabla + MOD-12 inspector lateral
- [ ] MOD-11: máximo 15 filas por página; footer Anterior/Siguiente visible
- [ ] MOD-11: filtro MOD-13 o búsqueda resetean a página 1
- [ ] Command palette / `?athlete=` salta a la página donde está el atleta seleccionado
- [ ] Nutrición atleta abre en `/admin-v2/athletes/:id/nutrition`

### 4. Entrenadores (`/admin-v2/trainers`)

- [ ] MOD-21 grid + MOD-22 inspector
- [ ] Invitar / desactivar entrenador

### 5. Rutinas (`/admin-v2/routines`)

- [ ] MOD-31 inventario con búsqueda
- [ ] MOD-32 builder (`RoutineBuilder` prime) crea/edita rutinas
- [ ] Catálogo remoto de ejercicios en builder

### 6. Ejercicios (`/admin-v2/exercises`)

- [ ] MOD-61 sync catálogo (solo admin)
- [ ] MOD-62 tabs + filtro músculos (`source=catalog`, solo categorías con caché)
- [ ] MOD-63 grilla catálogo con GIFs
- [ ] MOD-64 custom: crear, editar, subir media, eliminar
- [ ] MOD-65 formulario prime
- [ ] KPI «Catálogo» muestra total global en caché

### 7. Asignaciones (`/admin-v2/assignments`)

- [ ] MOD-41 matriz, MOD-42 pendientes, MOD-43 carga por trainer

### 8. Membresías (`/admin-v2/memberships`)

- [ ] MOD-51 planes + MOD-52 formulario CRUD

### 9. Responsive (deuda conocida)

- [ ] Documentar: sidebar oculta en &lt;768px (nav móvil pendiente UX-P1)

---

## Validación automatizada

```bash
npx tsc --noEmit
npm run lint
npm run test
cd backend && python -m pytest tests/test_api_domains.py::TestAdminRoutes::test_admin_dashboard_metrics -q
npm run test -- --run lib/admin-v2/admin-ops-feed.test.ts
npm run build
```

## Trainer (`/trainer/exercises`)

Comparte `ExerciseLibraryView` sin shell Prime; validar catálogo y custom con rol trainer.
