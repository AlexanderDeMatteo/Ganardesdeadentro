# App Mobile Plan (inventario de vistas + fetch)

Documento base para planificar la app mobile a partir de la web actual.
Incluye todas las vistas por rol y sus necesidades de `fetch` (datos/API) para priorizar implementación en mobile.

## 1) Alcance y criterio

- Fuente de rutas: `app/**/page.tsx` + `app/**/page-client.tsx`.
- Rutas oficiales actuales:
  - atleta: `/(athlete-prime)/*`
  - trainer: `/trainer-v2/*`
  - admin: `/admin-v2/*`
- Rutas legacy (aún en árbol): `/admin/*`, `/trainer/*`, `admin-v3/*`.
- Contratos API: `docs/API_CONTRACTS.md`.

## 2) Vistas públicas (sin rol autenticado)

| Vista web | Ruta | Necesidad mobile | Fetch principal |
|---|---|---|---|
| Landing | `/` | Onboarding/marketing mobile | Sin API crítica (contenido estático + assets) |
| Login | `/login` | Inicio de sesión | `POST /api/auth/login` |
| Registro | `/register` | Alta de atleta | `POST /api/auth/register` |
| Activación invitación | `/activate` | Activar trainer invitado | `GET /api/auth/invite/:token`, `POST /api/auth/accept-invite` |

## 3) Vistas atleta (rol `user`) — oficiales

| Vista web | Ruta | Necesidad mobile | Fetch principal |
|---|---|---|---|
| Dashboard | `/dashboard` | Home atleta (resumen) | `GET /api/auth/me`, `GET /api/memberships/active`, notificaciones/resumen remoto |
| Rutinas | `/routines` | Ver rutina asignada, detalle diario, completar sesión | `GET /api/routines/my`, `GET /api/routines/:id`, `POST /api/sessions/complete`, `GET /api/sessions*` |
| Métricas | `/metrics` | Historial y CRUD de métricas | `GET/POST/PATCH/DELETE /api/metrics` |
| Nutrición | `/nutrition` | Plan nutricional, diario, hidratación, Titan nutrición | `GET /api/nutrition/plan`, `GET/PUT /api/nutrition/diary`, `POST/DELETE entries`, `PATCH water`, `POST /api/nutrition/titan` |
| Membresías | `/memberships` | Catálogo, suscripción, estado de plan | `GET /api/memberships/plans`, `POST /api/memberships/subscribe`, `GET /api/memberships/active`, pagos/métodos (`/api/payments`, `/api/memberships/payment-requests`) |
| Perfil | `/profile` | Editar perfil y contraseña, body profile | `PATCH /api/users/athletes/:id`, `POST /api/auth/change-password`, `GET/PATCH /api/users/me/body-profile` |
| Soporte | `/support` | Chat/soporte atleta | `GET/POST /api/support/*`, `GET /api/notifications/*` (si aplica) |

### Nota de negocio atleta

- Gating de membresía activa: sin plan, solo debe acceder a dashboard/memberships/profile/support.

## 4) Vistas trainer (rol `trainer`) — oficiales

| Vista web | Ruta | Necesidad mobile | Fetch principal |
|---|---|---|---|
| Home trainer | `/trainer-v2` | Resumen operativo del coach | `GET /api/auth/me`, atletas asignados y KPIs |
| Atletas | `/trainer-v2/athletes` | Lista y detalle de atletas | `GET /api/users/trainer-athletes`, `GET /api/users/athletes/:id` |
| Nutrición por atleta | `/trainer-v2/athletes/[athleteId]/nutrition` | Editar/publicar plan + ver diario | `GET/PUT /api/nutrition/plan`, `GET/PUT /api/nutrition/coach-draft`, `GET /api/nutrition/diary` |
| Rutinas | `/trainer-v2/routines` | CRUD de rutinas trainer | `GET/POST/PATCH/DELETE /api/routines` |
| Ejercicios | `/trainer-v2/exercises` | Catálogo, custom, media, match animation | `GET /api/exercises/cached`, `GET /api/exercises/search`, `POST/PATCH/DELETE /api/exercises`, `POST /api/exercises/:id/media`, `POST /api/exercises/:id/match-animation` |
| Asignaciones | `/trainer-v2/assignments` | Asignar rutinas y plan semanal | `POST/DELETE /api/routines/assignments`, `GET/PUT /api/routines/weekly-plan` |
| Progreso | `/trainer-v2/progress` | Seguimiento de métricas/sesiones por atleta | `GET /api/metrics`, `GET /api/sessions`, `GET /api/sessions/progress` |
| Perfil trainer | `/trainer-v2/profile` | Editar perfil entrenador | `PATCH /api/users/trainers/:id`, `GET /api/users/trainers/:id` |

## 5) Vistas admin (rol `admin`) — oficiales

| Vista web | Ruta | Necesidad mobile | Fetch principal |
|---|---|---|---|
| Home admin | `/admin-v2` | Dashboard ejecutivo/operativo | `GET /api/admin/overview`, métricas dashboard admin |
| Atletas | `/admin-v2/athletes` | Listar, editar, asignar trainer/membresía | `GET /api/admin/athletes`, `PATCH /api/users/athletes/:id`, `PUT /api/users/athletes/:id/trainer`, `PUT /api/memberships/users/:id` |
| Nutrición por atleta | `/admin-v2/athletes/[athleteId]/nutrition` | Supervisión nutricional | `GET/PUT /api/nutrition/plan`, `GET /api/nutrition/diary` |
| Trainers | `/admin-v2/trainers` | Alta/baja/reactivación + invitaciones | `GET /api/admin/trainers`, `POST/DELETE/PATCH /api/admin/trainers*`, `POST /api/admin/trainers/:id/resend-invite` |
| Rutinas | `/admin-v2/routines` | CRUD de rutinas admin | `GET/POST/PATCH/DELETE /api/routines` |
| Ejercicios | `/admin-v2/exercises` | Sync catálogo + CRUD custom + media | `POST /api/exercises/sync-catalog`, `GET /api/exercises/cached/search`, `POST/PATCH/DELETE /api/exercises`, media/match endpoints |
| Asignaciones | `/admin-v2/assignments` | Asignación masiva y control de carga | `GET /api/routines/assignments`, `POST/DELETE /api/routines/assignments`, `GET/PUT /api/routines/weekly-plan` |
| Membresías | `/admin-v2/memberships` | CRUD de planes y asignaciones | `GET/POST/PATCH/DELETE /api/memberships/plans`, `PUT /api/memberships/users/:id` |
| Pagos | `/admin-v2/payments` | Revisar solicitudes y aprobar/rechazar | `GET /api/memberships/payment-requests`, `POST /api/memberships/payment-requests/:id/approve`, `POST /api/memberships/payment-requests/:id/reject` |
| Métodos de pago | `/admin-v2/payment-methods` | CRUD de métodos de pago | `GET/POST/PATCH/DELETE /api/payments/methods` |
| Tasas de cambio | `/admin-v2/exchange-rates` | CRUD de tasas | `GET/POST/PATCH/DELETE /api/exchange-rates` |
| Soporte | `/admin-v2/support` | Gestión de tickets/chat soporte | `GET/POST /api/support/*`, notificaciones |

## 6) Rutas API internas (Next) que mobile puede consumir vía backend web

| Ruta | Uso | Fetch dependiente |
|---|---|---|
| `/api/coach/titan` | Motivación Titan | Valida JWT con `/api/auth/me` + Ollama |
| `/api/coach/session-review` | Reseña de sesión | Igual: introspección JWT + Ollama |
| `/api/nutrition/titan` | Asistente nutricional | Gating membresía + Ollama |

## 7) Vistas legacy / no prioritarias para mobile (pero existentes)

| Grupo | Rutas |
|---|---|
| Admin legacy | `/admin`, `/admin/athletes`, `/admin/trainers`, `/admin/routines`, `/admin/assignments`, `/admin/memberships`, `/admin/athletes/[athleteId]/nutrition` |
| Trainer legacy | `/trainer`, `/trainer/athletes`, `/trainer/routines`, `/trainer/exercises`, `/trainer/assignments`, `/trainer/progress`, `/trainer/profile`, `/trainer/athletes/[athleteId]/nutrition` |
| Admin v3 (experimental) | `/admin-v3`, `/admin-v3/athletes`, `/admin-v3/routines`, `/admin-v3/assignments`, `/admin-v3/memberships` |
| Lab | `/lab/biomech` |

Recomendación mobile: no iniciar por estas rutas; tomar como fuente de verdad solo `athlete-prime`, `trainer-v2`, `admin-v2`.

## 8) Prioridad sugerida para arrancar app mobile (MVP)

1. Público/auth: `/login`, `/register`, `/activate`.
2. Atleta core: `/dashboard`, `/routines`, `/metrics`, `/nutrition`, `/memberships`, `/profile`.
3. Trainer core: `/trainer-v2/athletes`, `/trainer-v2/routines`, `/trainer-v2/assignments`, `/trainer-v2/progress`.
4. Admin core: `/admin-v2/athletes`, `/admin-v2/trainers`, `/admin-v2/payments`, `/admin-v2/memberships`.
5. Módulos avanzados: ejercicios custom/media, soporte en tiempo real, Titan completo.

## 9) Requisitos de fetch transversales para mobile

- Autenticación:
  - `POST /api/auth/login`
  - `GET /api/auth/me` al boot de app
  - `POST /api/auth/logout`
- Manejo global de errores:
  - redirigir a login en `401`
  - respetar `403` por rol y `membership_required`
- Subidas multipart:
  - comprobantes de pago
  - media de ejercicios/sesiones
- Tiempo real:
  - notificaciones/socket para soporte y eventos operativos (fase posterior del mobile).

## 10) Versión 2 — Estimación por pantalla (S/M/L)

Convención rápida:

- `S`: 0.5–1.5 días
- `M`: 2–4 días
- `L`: 5–8 días

### Público / Auth

| Pantalla | Tamaño | Dependencia backend | Riesgo principal |
|---|---:|---|---|
| Landing | S | No crítica | contenido/branding consistente |
| Login | S | auth estable (`/api/auth/login`) | manejo de sesión/token |
| Registro | S | auth estable (`/api/auth/register`) | validaciones y errores UX |
| Activate invite | M | invitaciones Resend (`/api/auth/invite`, `/accept-invite`) | operación real de email |

### Atleta (MVP mobile recomendado)

| Pantalla | Tamaño | Dependencia backend | Riesgo principal |
|---|---:|---|---|
| Dashboard | M | `auth/me`, membresía activa | estados vacíos/loading |
| Rutinas | L | `routines` + `sessions` | complejidad de flujo sesión |
| Métricas | M | `metrics` CRUD | gráficos y performance |
| Nutrición | L | `nutrition plan/diary` + Titan | alto volumen de estado |
| Membresías | M | `plans`, `active`, pagos | pagos multipart y estados |
| Perfil | M | `users` + `change-password` + `body-profile` | seguridad y validación |
| Soporte | M | `support` + notificaciones | realtime diferido |

### Trainer

| Pantalla | Tamaño | Dependencia backend | Riesgo principal |
|---|---:|---|---|
| Home trainer | M | resumen + atletas | agregación de datos |
| Atletas | M | `trainer-athletes` | filtros/búsqueda |
| Nutrición atleta | L | `nutrition plan/draft/diary` | editor complejo |
| Rutinas | L | CRUD routines | builder de rutina |
| Ejercicios | L | catálogo + custom + media | uploads y cache catálogo |
| Asignaciones | L | assignments + weekly plan | reglas de negocio |
| Progreso | M | metrics + sessions/progress | consistencia de series |
| Perfil trainer | S | `users/trainers/:id` | bajo riesgo |

### Admin

| Pantalla | Tamaño | Dependencia backend | Riesgo principal |
|---|---:|---|---|
| Home admin | M | `admin/overview` | KPIs y agregaciones |
| Atletas | L | admin athletes + assign trainer + memberships | operaciones encadenadas |
| Nutrición atleta | M | nutrition plan/diary | coherencia coach/admin |
| Trainers | L | invitaciones + estado trainer | dependiente de Resend |
| Rutinas | L | CRUD routines | complejidad builder |
| Ejercicios | L | sync + CRUD + media | heavy media/ops |
| Asignaciones | L | assignments/weekly plan | conflictos de asignación |
| Membresías | M | plans CRUD + assign | validación negocio |
| Pagos | M | payment requests approve/reject | trazabilidad decisiones |
| Métodos de pago | M | methods CRUD | validación data financiera |
| Tasas de cambio | S | exchange-rates CRUD | bajo riesgo |
| Soporte | M | support + notificaciones | operación en tiempo real |

## 11) Dependencias backend críticas antes del desarrollo mobile

1. Estrategia de sesión (refresh/cookies/token lifecycle) cerrada.
2. Operación real de invitaciones trainer (`RESEND_API_KEY` + flujo probado).
3. Errores API estables (códigos + shape uniforme).
4. Confirmar checklist de producción/piloto (secretos, CORS, backup, smoke end-to-end).

## 12) Plan por sprints mobile (propuesta)

### Sprint 0 — Fundaciones (1 semana)

- Setup app (navegación, theming, cliente HTTP, manejo global 401/403).
- Session bootstrap (`/api/auth/me`) + storage seguro.
- Infra de formularios, errores y componentes base.

### Sprint 1 — Atleta MVP (2 semanas)

- Login, register, dashboard, rutinas (lectura + completar sesión), métricas (list + create).
- Perfil básico + body profile.
- QA móvil en Android/iOS (happy path + errores).

### Sprint 2 — Atleta completo + pagos (2 semanas)

- Nutrición (plan + diario + agua), membresías, flujo de pago/request.
- Titan nutrición (si backend/Ollama operativo).
- Hardening de estados vacíos/retry/offline básico.

### Sprint 3 — Trainer core (2 semanas)

- Atletas, rutinas, asignaciones, progreso.
- Nutrición por atleta (lectura primero; editor en fase 2 del sprint).

### Sprint 4 — Admin operativo (2 semanas)

- Atletas, trainers, membresías, pagos.
- Exchange rates y payment methods.
- Ejercicios/sync y soporte quedan para sprint 5 (si prioridad de negocio lo pide).

## 13) Criterio de “listo para construir” por pantalla

- Endpoint confirmado en `API_CONTRACTS.md` + permisos claros.
- Mock de diseño mobile aprobado.
- Casos vacío/error definidos.
- Contrato de IDs (`string` en cliente, cast desde `number` backend) validado.
- Caso de prueba manual mínimo documentado.

## 14) Matriz de prioridad de negocio (v1)

Escala:

- Impacto: 1–5 (5 = impacto directo en uso diario/ingreso)
- Urgencia: 1–5 (5 = necesario para salir a mercado)
- Riesgo: 1–5 (5 = alto riesgo si no se implementa)
- Esfuerzo: 1–5 (5 = más costoso)
- **Score** = `(Impacto + Urgencia + Riesgo) - Esfuerzo`

| Módulo mobile | Impacto | Urgencia | Riesgo | Esfuerzo | Score | Decisión |
|---|---:|---:|---:|---:|---:|---|
| Auth (login/register/session bootstrap) | 5 | 5 | 5 | 2 | 13 | MVP v1 |
| Dashboard atleta | 4 | 4 | 3 | 3 | 8 | MVP v1 |
| Rutinas atleta + completar sesión | 5 | 5 | 4 | 5 | 9 | MVP v1 |
| Métricas atleta | 4 | 4 | 3 | 3 | 8 | MVP v1 |
| Perfil atleta + cambio contraseña + body profile | 4 | 4 | 4 | 3 | 9 | MVP v1 |
| Membresías + estado de plan | 5 | 5 | 4 | 4 | 10 | MVP v1 |
| Flujo de pago (request + comprobante) | 5 | 5 | 5 | 4 | 11 | MVP v1 |
| Nutrición atleta (plan + diario + agua) | 4 | 4 | 3 | 5 | 6 | v1.1 |
| Titan nutrición/motivación | 3 | 2 | 2 | 4 | 3 | v1.1 |
| Trainer: atletas + asignaciones + progreso | 4 | 3 | 3 | 5 | 5 | v1.1 |
| Admin: atletas + trainers + memberships + pagos | 5 | 4 | 4 | 5 | 8 | v1.1 (fase admin) |
| Ejercicios custom/media (admin/trainer) | 3 | 2 | 2 | 5 | 2 | v1.2 |
| Soporte realtime + notificaciones live | 3 | 2 | 3 | 4 | 4 | v1.2 |

### Corte recomendado por release

- **MVP v1 (salida rápida y monetizable):**
  - Auth
  - Dashboard/Rutinas/Métricas/Perfil atleta
  - Membresías y flujo de pago
- **v1.1 (operación extendida):**
  - Nutrición completa
  - Titan
  - Módulos trainer
  - Admin core
- **v1.2 (optimización):**
  - Ejercicios avanzados custom/media
  - Soporte realtime completo

## 15) Dependencias para aprobar el corte MVP v1

1. Flujo de sesión definido para mobile (token lifecycle y refresh).
2. Endpoints de pagos/membresías validados en entorno operativo.
3. Manejo uniforme de errores (`401`, `403`, `membership_required`) en todas las pantallas v1.
4. Checklist QA mínimo de MVP:
   - login/logout
   - completar sesión
   - registrar métrica
   - solicitar pago de membresía
   - ver cambio de estado de membresía

## 16) Backlog ejecutable (tickets por sprint)

Formato: `ID · Historia · Resultado esperado · Dependencias · Validación`.

### Sprint 0 — Fundaciones mobile

1. **MOB-001 · Bootstrap de app y navegación base**
   - Resultado esperado: estructura de navegación autenticada/no autenticada operativa.
   - Dependencias: ninguna.
   - Validación: abrir app, navegar entre login y home placeholder sin errores.

2. **MOB-002 · Cliente HTTP + interceptor global de errores**
   - Resultado esperado: cliente único para API con manejo estándar de `401/403/5xx`.
   - Dependencias: MOB-001.
   - Validación: simular `401` y confirmar redirección a login; `403` muestra mensaje de permisos.

3. **MOB-003 · Gestión de sesión segura**
   - Resultado esperado: persistencia de sesión mobile (storage seguro) + `GET /api/auth/me` al iniciar.
   - Dependencias: MOB-002.
   - Validación: cerrar/reabrir app y mantener sesión válida; token inválido limpia sesión.

4. **MOB-004 · Kit de UI base (inputs, estados vacíos, errores, loading)**
   - Resultado esperado: componentes reutilizables para formularios y feedback.
   - Dependencias: MOB-001.
   - Validación: todos los estados (loading/empty/error/success) visibles en sandbox interno.

### Sprint 1 — MVP v1 (Atleta Core I)

5. **MOB-101 · Login/Register/Logout**
   - Resultado esperado: flujo auth completo estable.
   - Dependencias: MOB-002, MOB-003.
   - Validación: login correcto, rechazo credenciales inválidas, logout limpia sesión.

6. **MOB-102 · Dashboard atleta**
   - Resultado esperado: home con resumen y estado de membresía.
   - Dependencias: MOB-101.
   - Validación: usuario con y sin membresía ve estados correctos.

7. **MOB-103 · Rutinas atleta (lectura + detalle)**
   - Resultado esperado: ver rutina actual, ejercicios y día activo.
   - Dependencias: MOB-101.
   - Validación: carga `GET /api/routines/my` y detalle sin inconsistencias.

8. **MOB-104 · Completar sesión**
   - Resultado esperado: registro de sesión enviado con éxito.
   - Dependencias: MOB-103.
   - Validación: `POST /api/sessions/complete` exitoso y reflejado en historial.

9. **MOB-105 · Métricas atleta (listar + crear)**
   - Resultado esperado: historial visible y alta de métrica funcional.
   - Dependencias: MOB-101.
   - Validación: crear métrica y verla inmediatamente en listado.

10. **MOB-106 · Perfil atleta (editar + contraseña + body profile)**
    - Resultado esperado: perfil actualizado y cambio de contraseña operativo.
    - Dependencias: MOB-101.
    - Validación: `PATCH /api/users/athletes/:id`, `POST /api/auth/change-password`, `GET/PATCH /api/users/me/body-profile`.

### Sprint 2 — MVP v1 (Monetización)

11. **MOB-201 · Catálogo de membresías + estado activo**
    - Resultado esperado: usuario puede ver planes y su estado.
    - Dependencias: MOB-101.
    - Validación: `GET /api/memberships/plans` y `GET /api/memberships/active` correctos.

12. **MOB-202 · Solicitud de pago de membresía (comprobante multipart)**
    - Resultado esperado: envío completo de solicitud de pago desde mobile.
    - Dependencias: MOB-201.
    - Validación: request creada con archivo adjunto y estado `pending`.

13. **MOB-203 · Gestión de errores de negocio de membresía**
    - Resultado esperado: UX clara para `membership_required`, pagos pendientes y rechazos.
    - Dependencias: MOB-201, MOB-202.
    - Validación: casos negativos cubiertos y mensajes accionables.

### Sprint 3 — v1.1 (Atleta extendido)

14. **MOB-301 · Nutrición atleta (plan + diario + agua)**
    - Resultado esperado: módulo nutrición funcional sin Titan.
    - Dependencias: MOB-101.
    - Validación: CRUD de diario + hidratación persistido correctamente.

15. **MOB-302 · Titan nutrición/motivación**
    - Resultado esperado: integración con rutas Next Titan.
    - Dependencias: MOB-301.
    - Validación: respuesta normal y fallback controlado si IA no disponible.

16. **MOB-303 · Hardening offline/retry básico**
    - Resultado esperado: reintentos automáticos en fallos de red no fatales.
    - Dependencias: MOB-301.
    - Validación: modo avión intermitente no rompe estado local UI.

### Sprint 4 — v1.1 (Trainer Core)

17. **MOB-401 · Lista y detalle de atletas (trainer)**
    - Resultado esperado: entrenador navega atletas asignados.
    - Dependencias: MOB-101.
    - Validación: `GET /api/users/trainer-athletes` + detalle por atleta.

18. **MOB-402 · Rutinas trainer (list/create/update)**
    - Resultado esperado: gestión principal de rutinas desde mobile.
    - Dependencias: MOB-401.
    - Validación: CRUD básico estable y coherente con web.

19. **MOB-403 · Asignaciones + plan semanal**
    - Resultado esperado: trainer asigna rutinas y plan semanal.
    - Dependencias: MOB-402.
    - Validación: `POST/DELETE assignments`, `GET/PUT weekly-plan`.

20. **MOB-404 · Progreso de atletas**
    - Resultado esperado: vista de progreso (métricas/sesiones).
    - Dependencias: MOB-401.
    - Validación: datos comparativos renderizados sin degradación.

### Sprint 5 — v1.1/v1.2 (Admin Core)

21. **MOB-501 · Admin atletas/trainers/membresías**
    - Resultado esperado: operaciones admin críticas desde mobile.
    - Dependencias: MOB-101.
    - Validación: edición atleta, asignación trainer, cambios de membresía.

22. **MOB-502 · Admin pagos (aprobar/rechazar)**
    - Resultado esperado: ciclo de revisión de pagos completo.
    - Dependencias: MOB-501.
    - Validación: acciones de aprobación/rechazo reflejadas en estado final.

23. **MOB-503 · Métodos de pago y tasas**
    - Resultado esperado: CRUD operativo para configuración financiera.
    - Dependencias: MOB-501.
    - Validación: cambios aplicados y visibles en flujo de pagos.

### Sprint 6 — v1.2 (Avanzado)

24. **MOB-601 · Ejercicios custom/media (trainer/admin)**
    - Resultado esperado: crear/editar ejercicios y subir media.
    - Dependencias: MOB-402 o MOB-501.
    - Validación: upload media + visualización correcta.

25. **MOB-602 · Soporte realtime + notificaciones**
    - Resultado esperado: chat soporte y eventos en tiempo real.
    - Dependencias: MOB-004, MOB-501.
    - Validación: recepción de notificación en foreground/background.

## 17) Definición de listo por ticket (DoD)

- PR con tests o evidencia manual reproducible.
- Sin errores de lint/typecheck en app mobile.
- Manejo explícito de estados loading/empty/error.
- Errores de backend mapeados a UX entendible.
- Seguridad: sin exponer tokens/PII en logs.

## 18) Tablero de ejecución (Kanban inicial)

Estado inicial sugerido:

- `To Do`: todo lo no iniciado
- `In Progress`: máximo 2 tickets simultáneos por desarrollador
- `Done`: ticket cerrado con DoD completo

### Sprint 0 — Fundaciones

| Ticket | Estado | Owner | Notas |
|---|---|---|---|
| MOB-001 Bootstrap de app y navegación base | To Do | TBD | Base del proyecto mobile |
| MOB-002 Cliente HTTP + interceptor global | To Do | TBD | Requiere definición de errores |
| MOB-003 Gestión de sesión segura | To Do | TBD | Depende de estrategia auth final |
| MOB-004 Kit UI base (loading/error/empty) | To Do | TBD | Reutilizable en todos los sprints |

### Sprint 1 — MVP v1 (Atleta Core I)

| Ticket | Estado | Owner | Notas |
|---|---|---|---|
| MOB-101 Login/Register/Logout | To Do | TBD | Validar casos negativos de auth |
| MOB-102 Dashboard atleta | To Do | TBD | Incluye estado de membresía |
| MOB-103 Rutinas atleta (lectura + detalle) | To Do | TBD | Previo a completar sesión |
| MOB-104 Completar sesión | To Do | TBD | Depende de MOB-103 |
| MOB-105 Métricas atleta (listar + crear) | To Do | TBD | Primer CRUD mobile |
| MOB-106 Perfil atleta + contraseña + body profile | To Do | TBD | Seguridad importante |

### Sprint 2 — MVP v1 (Monetización)

| Ticket | Estado | Owner | Notas |
|---|---|---|---|
| MOB-201 Catálogo de membresías + estado activo | To Do | TBD | Base de monetización |
| MOB-202 Solicitud de pago + comprobante | To Do | TBD | Multipart y validación UX |
| MOB-203 Errores de negocio de membresía | To Do | TBD | Manejo de `membership_required` |

### Sprint 3 — v1.1 (Atleta extendido)

| Ticket | Estado | Owner | Notas |
|---|---|---|---|
| MOB-301 Nutrición atleta (plan/diario/agua) | To Do | TBD | Módulo complejo de estado |
| MOB-302 Titan nutrición/motivación | To Do | TBD | Depende de operación IA backend |
| MOB-303 Hardening offline/retry básico | To Do | TBD | Mejora de resiliencia |

### Sprint 4 — v1.1 (Trainer Core)

| Ticket | Estado | Owner | Notas |
|---|---|---|---|
| MOB-401 Lista y detalle de atletas (trainer) | To Do | TBD | Entrada al módulo coach |
| MOB-402 Rutinas trainer (list/create/update) | To Do | TBD | Depende de 401 |
| MOB-403 Asignaciones + plan semanal | To Do | TBD | Reglas de negocio |
| MOB-404 Progreso de atletas | To Do | TBD | Datos cruzados |

### Sprint 5 — v1.1/v1.2 (Admin Core)

| Ticket | Estado | Owner | Notas |
|---|---|---|---|
| MOB-501 Admin atletas/trainers/membresías | To Do | TBD | Operación crítica |
| MOB-502 Admin pagos (aprobar/rechazar) | To Do | TBD | Impacta monetización |
| MOB-503 Métodos de pago y tasas | To Do | TBD | Configuración financiera |

### Sprint 6 — v1.2 (Avanzado)

| Ticket | Estado | Owner | Notas |
|---|---|---|---|
| MOB-601 Ejercicios custom/media | To Do | TBD | Alto esfuerzo |
| MOB-602 Soporte realtime + notificaciones | To Do | TBD | Requiere estrategia push/live |

## 19) Reunión semanal de control (plantilla)

### a) Compromiso de sprint

- Tickets comprometidos:
- Riesgos conocidos:
- Dependencias externas:

### b) Estado actual

- Done esta semana:
- In Progress:
- Bloqueados:

### c) Decisiones

- Cambios de alcance:
- Tickets movidos a siguiente sprint:
- Fecha objetivo de release:


