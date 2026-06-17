# Pruebas manuales — Panel Entrenador (MVP mock)

## Credenciales

| Rol | Email | Contraseña | Trainer ID | Atletas visibles |
|-----|-------|------------|------------|------------------|
| Entrenador 1 | trainer@example.com | password123 | 1 | Juan Pérez, María García |
| Atleta | test@example.com | password123 | — | — |
| Admin | admin@example.com | password123 | — | — |

## Checklist — `/trainer-v2` (Gainer Prime)

### Acceso y redirecciones

- [ ] Login con `trainer@example.com` redirige a `/trainer-v2`
- [ ] El navbar global está oculto en rutas `/trainer-v2/*` (shell Prime propio)
- [ ] `/trainer` redirige permanentemente a `/trainer-v2`
- [ ] Intentar `/dashboard` como entrenador redirige a `/trainer-v2`
- [ ] Login con `test@example.com` y navegar a `/trainer-v2` redirige a `/dashboard`
- [ ] Login con `admin@example.com` y navegar a `/trainer-v2` redirige a `/admin-v2`
- [ ] Enlace "Vista clásica" en topbar Prime lleva a `/trainer` (redirect a v2)
- [ ] En legacy `/trainer` (si accesible), enlace "Probar Gainer Prime" lleva a `/trainer-v2`

### Aislamiento de datos

- [ ] Dashboard de `trainer@example.com` muestra **2** atletas
- [ ] `/trainer-v2/athletes` lista solo atletas del entrenador logueado

### Rutinas y asignaciones

- [ ] Crear rutina en `/trainer-v2/routines` y verificar que aparece en el listado
- [ ] Asignar rutina a un atleta en `/trainer-v2/assignments`
- [ ] Recargar la página: la asignación persiste (`localStorage` → `trainer_data`)
- [ ] Desasignar rutina y verificar que desaparece
- [ ] Plan semanal se guarda y persiste tras refresh

### Ejercicios, progreso y perfil

- [ ] `/trainer-v2/exercises` renderiza biblioteca con estilos Prime (gp-*)
- [ ] `/trainer-v2/progress` muestra métricas y gráficos con tooltips oscuros
- [ ] Tabla comparativa lista todos los atletas del entrenador
- [ ] Editar especialización y bio en `/trainer-v2/profile` y verificar persistencia tras refresh

### Nutrición

- [ ] Desde atletas, enlace nutrición abre `/trainer-v2/athletes/{id}/nutrition`
- [ ] Guard de acceso bloquea atletas no asignados

### Sidebar y navegación móvil

- [ ] Las 7 pestañas navegan correctamente: Dashboard, Mis atletas, Rutinas, Ejercicios, Asignaciones, Progreso, Perfil
- [ ] CTA sidebar "ASIGNAR RUTINAS" lleva a asignaciones
- [ ] Bottom nav móvil muestra los 7 ítems

## Validación automatizada

```bash
pnpm lint
pnpm test lib/auth/role-routes.test.ts lib/trainer-v2/trainer-redirect-map.test.ts
pnpm build
```

Resultado esperado: sin errores nuevos en archivos del panel entrenador v2.
