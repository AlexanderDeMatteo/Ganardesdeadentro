# Pruebas manuales — Panel Entrenador (MVP mock)

## Credenciales

| Rol | Email | Contraseña | Trainer ID | Atletas visibles |
|-----|-------|------------|------------|------------------|
| Entrenador 1 | trainer@example.com | password123 | 1 | Juan Pérez, María García |
| Atleta | test@example.com | password123 | — | — |
| Admin | admin@example.com | password123 | — | — |

## Checklist

### Acceso y redirecciones

- [ ] Login con `trainer@example.com` redirige a `/trainer`
- [ ] El navbar no muestra Dashboard, Rutinas, Métricas, Nutrición ni Membresías
- [ ] El navbar muestra enlace "Panel Entrenador"
- [ ] Intentar `/dashboard` como entrenador redirige a `/trainer`
- [ ] Login con `test@example.com` y navegar a `/trainer` redirige a `/dashboard`
- [ ] Login con `admin@example.com` y navegar a `/trainer` redirige a `/admin`

### Aislamiento de datos

- [ ] Dashboard de `trainer@example.com` muestra **2** atletas
- [ ] `/trainer/athletes` lista solo atletas del entrenador logueado

### Rutinas y asignaciones

- [ ] Crear rutina en `/trainer/routines` y verificar que aparece en el listado
- [ ] Asignar rutina a un atleta en `/trainer/assignments`
- [ ] Recargar la página: la asignación persiste (`localStorage` → `trainer_data`)
- [ ] Desasignar rutina y verificar que desaparece

### Progreso y perfil

- [ ] `/trainer/progress` muestra métricas de atletas asignados
- [ ] Tabla comparativa lista todos los atletas del entrenador
- [ ] Editar especialización y bio en `/trainer/profile` y verificar persistencia tras refresh

### Sidebar

- [ ] Las 6 pestañas navegan correctamente: Dashboard, Mis atletas, Rutinas, Asignaciones, Progreso, Perfil

## Validación automatizada

```bash
npm run lint
```

Resultado esperado: sin errores nuevos en archivos del panel entrenador.
