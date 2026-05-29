# planOpus — Ruta para culminar el frontend de FitTrack

> Documento de ejecución. Complementa `docs/PROJECT_CONTEXT.md` (estado real del repo).
> Alcance: **frontend** (vistas Atleta, Entrenador y Admin) bajo la jerarquía de supervisión
> **Admin → Entrenador → Atleta**. No cubre implementar el backend, pero deja los contratos listos.

---

## 0. Principios rectores

1. **Una sola fuente de verdad de datos en el cliente.** Eliminar los silos (`admin_data`, `trainer_data`, datos sueltos del atleta) y centralizar en una capa de datos única y coherente, de modo que un cambio de un rol se refleje en los demás (rutina asignada por entrenador → visible para atleta → auditable por admin).
2. **La jerarquía manda.** Cada rol solo ve y actúa sobre lo que supervisa:
   - Atleta: sus propios datos.
   - Entrenador: solo *sus* atletas asignados.
   - Admin: todos los entrenadores y, a través de ellos, todos los atletas.
3. **Contrato antes que implementación.** Definir tipos/“API client” con la forma final esperada del backend; hoy la implementación lee de la capa local, mañana solo se cambia el adaptador.
4. **Estados completos siempre.** Toda vista cubre: carga, vacío, error, sin permiso. (Regla `task-validation-and-testing.mdc`.)
5. **Reutilizar `components/ui`** y patrones existentes (`brand-card`, sidebars, navbar). No duplicar estilos.
6. **Cerrar cada tarea con validación** (`npm run lint` + prueba manual del flujo). Documentar resultado.

---

## 1. Diagnóstico de partida (resumen)

- Auth, métricas, membresías, admin y trainer son **mock/`localStorage`**.
- Rutinas asignadas por el entrenador NO llegan al atleta (silos de datos).
- El entrenador ve asignaciones pero no métricas/nutrición/adherencia reales del atleta.
- El admin solo ve conteos; no hay drill-down `admin → entrenador → atletas del entrenador`.
- Protección de rutas y gating de Titan: solo cliente.
- `next.config.mjs` con `ignoreBuildErrors: true` (deuda de typecheck).

---

## 2. Fase 0 — Fundamentos compartidos (PRE-REQUISITO de todo)

Objetivo: una capa de datos unificada y coherente con la jerarquía.

- [ ] **2.1 Modelo de dominio único** (`lib/data/types.ts`): `User/Athlete`, `Trainer`, `Routine`, `RoutineAssignment`, `Metric`, `MealPlan`, `Membership`, con relaciones explícitas: `athlete.trainerId`, `trainer.adminId` (o admin global), `assignment.athleteId/routineId/trainerId`.
- [ ] **2.2 Store central** (`lib/data/store.ts` + provider): reemplaza la lectura dispersa de `localStorage`. Una sola clave versionada (`fittrack_state_v1`) con `athletes`, `trainers`, `routines`, `assignments`, `metrics`, `mealPlans`. Migración desde las claves viejas (`admin_data`, `trainer_data`) al primer arranque.
- [ ] **2.3 Selectores por rol** (hooks derivados): `useAthleteData()`, `useTrainerData()` (filtra por `trainerId`), `useAdminData()` (todo). Refactor de `use-admin` / `use-trainer` para consumir el store, no mocks sueltos.
- [ ] **2.4 Capa de acceso “API-ready”** (`lib/data/client.ts`): funciones async (`getMyRoutines`, `assignRoutine`, `getAthleteMetrics`, …) que hoy resuelven contra el store local y mañana contra Flask. Todo el frontend consume SOLO esta capa.
- [ ] **2.5 Helpers de autorización en cliente** (`lib/auth/guards.ts`): `canTrainerAccessAthlete(trainer, athleteId)`, `canAdminAccessTrainer(...)`. Úsalos en cada vista de detalle (UX; la barrera real será backend).

**Validación Fase 0:** lint + prueba manual de migración (datos viejos se conservan) y de que asignar rutina como entrenador la vuelve visible como atleta.

---

## 3. Fase 1 — Vista Atleta (rol `user`)

Rutas: `/dashboard`, `/routines`, `/metrics`, `/nutrition`, `/memberships`, `/profile`.

- [ ] **3.1 Dashboard**: consumir store central. KPIs reales: rutina activa asignada por su entrenador, adherencia nutricional, última métrica, días de membresía. Estados vacío/carga.
- [ ] **3.2 Rutinas (`/routines`)**: mostrar **la rutina asignada por su entrenador** (vínculo Fase 0), con ejercicios, sets/reps/descanso. Permitir marcar sesión/ejercicio como completado → alimenta progreso del entrenador.
- [ ] **3.3 Métricas (`/metrics`)**: registro y edición de peso/grasa/músculo; histórico y gráficos (`lib/metrics-chart-utils.ts`). Estos datos deben ser legibles por el entrenador.
- [ ] **3.4 Nutrición (`/nutrition`)**: consolidar plan asignado (`hooks/use-assigned-nutrition`), diario, hidratación, adherencia. Respetar gating Titan (Premium/Pro) en UI.
- [ ] **3.5 Membresías y Perfil**: mostrar nivel real, días restantes, features; edición de perfil/datos corporales (`use-body-profile`).
- [ ] **3.6 “Mi entrenador”**: pequeña tarjeta con el entrenador asignado (nombre, especialidad, contacto) — hace visible la relación de supervisión desde abajo.

**Validación:** navegación completa del atleta, estados de carga/vacío/error, y verificación de que lo que ve el atleta coincide con lo asignado por el entrenador.

---

## 4. Fase 2 — Vista Entrenador (rol `trainer`, supervisa atletas)

Rutas: `/trainer`, `/trainer/athletes`, `/trainer/athletes/[athleteId]/nutrition`, `/trainer/routines`, `/trainer/assignments`, `/trainer/progress`, `/trainer/profile`.

- [ ] **4.1 Solo sus atletas**: confirmar que todas las vistas filtran por `trainerId` y bloquean (UX) el acceso a atletas no asignados (`canTrainerAccessAthlete`).
- [ ] **4.2 Detalle de atleta** (`/trainer/athletes/[athleteId]`): vista 360° por atleta — métricas reales (Fase 1.3), adherencia nutricional, rutina activa, progreso de sesiones completadas. **Esta es la pieza de supervisión clave que hoy falta.**
- [ ] **4.3 Rutinas (`/trainer/routines`)**: CRUD de rutinas usando catálogo de ejercicios; vincular al store central para que sean asignables.
- [ ] **4.4 Asignaciones (`/trainer/assignments`)**: asignar/quitar rutina a atleta; al asignar, debe reflejarse en `/routines` del atleta (cierre del bucle Fase 0).
- [ ] **4.5 Progreso (`/trainer/progress`)**: agregados por atleta y globales del entrenador (cobertura de rutinas, sesiones completadas, evolución de métricas). Gráficos reutilizando utilidades existentes.
- [ ] **4.6 Nutrición asignada (`/trainer/athletes/[athleteId]/nutrition`)**: definir/ajustar plan de comidas del atleta; debe propagarse a la vista del atleta.
- [ ] **4.7 Perfil del entrenador**: especialización/bio editable (ya existe base en `use-trainer`).
- [ ] **4.8 Revisión IA de sesión (opcional)**: integrar `session-review` de Titan en el detalle del atleta como apoyo al entrenador.

**Validación:** casos positivo (atleta propio) y negativo (atleta ajeno → bloqueado). Verificar que asignar rutina/plan impacta la vista del atleta.

---

## 5. Fase 3 — Vista Admin (rol `admin`, supervisa entrenadores)

Rutas: `/admin`, `/admin/trainers`, `/admin/athletes`, `/admin/athletes/[athleteId]/nutrition`, `/admin/routines`, `/admin/assignments`, `/admin/memberships`.

- [ ] **5.1 Dashboard admin**: KPIs reales de plataforma (entrenadores, atletas, % asignación, distribución de membresías, atletas sin entrenador, entrenadores sin atletas).
- [ ] **5.2 Detalle de entrenador** (`/admin/trainers/[trainerId]`): **drill-down de supervisión** — ver los atletas de ESE entrenador, su cobertura de rutinas, rating, actividad. Hoy solo hay conteos; esta es la pieza que falta para “admin supervisa al entrenador”.
- [ ] **5.3 Gestión de entrenadores**: alta/edición/baja, especialización, asignar/reasignar atletas entre entrenadores (refleja en Fase 2 y 1).
- [ ] **5.4 Gestión de atletas**: asignar entrenador, ver/editar membresía, acceso de solo lectura a su 360° (reusar componentes de la Fase 4.2).
- [ ] **5.5 Rutinas y asignaciones globales**: auditoría de todas las rutinas y asignaciones (quién asignó qué a quién).
- [ ] **5.6 Membresías (`/admin/memberships`)**: gestión de planes y niveles; impacta gating Titan del atleta.
- [ ] **5.7 Coherencia jerárquica**: al reasignar un atleta a otro entrenador, validar que rutinas/planes/permisos se actualicen sin dejar datos huérfanos.

**Validación:** desde admin, entrar a un entrenador y verificar que se ven exactamente sus atletas; reasignar un atleta y comprobar propagación a entrenador y atleta.

---

## 6. Fase 4 — Transversales (calidad y consistencia)

- [ ] **6.1 Navegación y guards** unificados: matriz rol→ruta en `lib/auth/role-routes.ts`; redirecciones coherentes; sidebars/`navbar` por rol.
- [ ] **6.2 Gating Titan** centralizado (Premium/Pro) reutilizable en atleta y entrenador.
- [ ] **6.3 Estados UI** estandarizados: skeletons de carga, vacíos, toasts de error (`use-toast`), confirmaciones de acciones destructivas.
- [ ] **6.4 Accesibilidad** (`accessibility-frontend.mdc`): foco, labels, roles ARIA en formularios y tablas.
- [ ] **6.5 SEO/GEO** (`seo-next.mdc`, `geo-ai-optimization.mdc`) en páginas públicas (`/`, `/login`, `/register`): metadata, headings descriptivos, datos estructurados.
- [ ] **6.6 Responsive**: revisar sidebars fijas (`ml-64`) en móvil; usar `use-mobile`.
- [ ] **6.7 Limpieza**: resolver `/dashboard-2` y `/dashboard-3` (redirigen a `/dashboard`); eliminar duplicados.

---

## 7. Fase 5 — Preparación para backend real (sin implementarlo)

- [ ] **7.1 Contratos**: documentar en cada función de `lib/data/client.ts` el endpoint, método, payload y respuesta esperada (alinear con blueprints placeholder de Flask).
- [ ] **7.2 Auth real**: dejar `auth-context` preparado para JWT real (no elevación de rol desde cliente; tokens fuera de `localStorage` cuando se integre).
- [ ] **7.3 Eliminar deuda de typecheck**: plan para quitar `ignoreBuildErrors` tras estabilizar tipos del modelo único.

---

## 8. Orden de ejecución y dependencias

```
Fase 0 (fundamentos)  ──►  Fase 1 (atleta)  ──►  Fase 2 (entrenador)  ──►  Fase 3 (admin)
                                   └───────────────► Fase 4 (transversal, en paralelo)
                                                                  └──► Fase 5 (pre-backend)
```

- **Fase 0 es bloqueante**: sin la capa de datos unificada, las fases 1–3 seguirían en silos.
- Fase 4 se puede avanzar en paralelo desde el final de Fase 1.
- Fase 5 se documenta a medida que se construye cada cliente de datos.

---

## 9. Checklist de cierre por tarea (regla del repo)

1. ¿Toca roles/permisos/datos sensibles? → casos positivo y negativo.
2. `npm run lint` sin errores nuevos.
3. Prueba manual del flujo afectado (carga/vacío/error/permiso) documentada.
4. ¿La jerarquía se respeta? (cambio de un rol se refleja correctamente en los otros).
5. Reutilización de `components/ui` verificada.
