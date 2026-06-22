# Plan de pruebas manuales — FitTrack (post-sprint pagos)

**Commit base:** `9fb06da` (+ `46f32f2` sprint Post-QA)  
**Duración estimada:** 60–90 min  
**Guía detallada por caso:** [`TEST_PAYMENT_FLOW.md`](../../TEST_PAYMENT_FLOW.md)

---

## 1. Preparación del entorno

### 1.1 Levantar stack

```powershell
docker compose -p fittrack up --build -d
```

Verificar:

- [ ] Backend responde en `http://localhost:5000/health` (o equivalente)
- [ ] Frontend en `http://localhost:3000`
- [ ] Migraciones aplicadas (009, 010, 011) sin error en logs del contenedor backend

### 1.2 Variables frontend (modo API)

Copiar [`.env.local.api.example`](../../.env.local.api.example) → `.env.local` y confirmar:

| Variable | Valor esperado |
|----------|----------------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5000` |
| `NEXT_PUBLIC_AUTH_SOURCE` | `api` |
| `NEXT_PUBLIC_DATA_SOURCE` | `api` |
| `NEXT_PUBLIC_DATA_SOURCE_MEMBERSHIPS` | `api` |
| `NEXT_PUBLIC_DATA_SOURCE_ROUTINES` | `api` |
| `NEXT_PUBLIC_DATA_SOURCE_METRICS` | `api` |
| `NEXT_PUBLIC_DATA_SOURCE_NUTRITION` | `api` |

Reiniciar `pnpm dev` tras cambiar `.env.local`.

### 1.3 Cuentas de prueba

| Rol | Uso | Estado inicial |
|-----|-----|----------------|
| **Atleta A** | Flujo checkout y gating | Sin membresía activa |
| **Atleta B** | Caso negativo comprobante | Sin membresía (opcional) |
| **Admin** | Aprobar/rechazar pagos, CRUD métodos/tasas, asignar plan | — |
| **Trainer** | Regresión progreso y rutinas | Con atleta asignado (si existe seed) |

> Si no hay seed: registrar Atleta A y Admin desde `/register` y elevar rol admin vía DB/seed según [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md).

### 1.4 Herramientas

- [ ] DevTools → pestaña **Network** (filtrar `api/`)
- [ ] Consola sin errores críticos en cada pantalla
- [ ] Archivo de comprobante de prueba: JPG/PNG/PDF &lt; límite configurado

---

## 2. Orden de ejecución (recomendado)

Ejecutar en este orden para no invalidar estados:

```
Fase A → Gating sin membresía
Fase B → Admin configura métodos y tasas
Fase C → Atleta solicita pago (checkout)
Fase D → Admin aprueba → desbloqueo
Fase E → Casos negativos (rechazo, comprobante ajeno)
Fase F → Asignación directa admin
Fase G → Notificaciones y soporte
Fase H → Regresiones trainer/admin
```

---

## 3. Checklist por fase

### Fase A — Gating sin membresía (Atleta A)

| ID | Paso | Esperado | ✅/❌ | Notas |
|----|------|----------|-------|-------|
| A1 | Login como Atleta A sin membresía | Sesión OK, nav limitado | | |
| A2 | Ir a `/metrics` | Bloqueo UX o redirect; API `403` `membership_required` | | |
| A3 | Ir a `/routines`, `/nutrition` | Mismo bloqueo | | |
| A4 | Ir a `/dashboard`, `/memberships`, `/profile`, `/support` | Accesibles | | |

**Referencia:** TEST_PAYMENT_FLOW caso 1.

---

### Fase B — Config admin (métodos y tasas)

| ID | Paso | Esperado | ✅/❌ | Notas |
|----|------|----------|-------|-------|
| B1 | Login admin → `/admin-v2/payment-methods` | Listado carga | | |
| B2 | Crear método (ej. transferencia, activo) | Persiste y aparece en lista | | |
| B3 | Editar método | Cambios guardados | | |
| B4 | `/admin-v2/exchange-rates` → crear tasa USD→VES | CRUD OK | | |
| B5 | Como atleta (sin login admin), checkout muestra métodos activos | Métodos visibles en `/memberships` | | |

**Referencia:** TEST_PAYMENT_FLOW caso 6.

---

### Fase C — Checkout atleta (solicitud de pago)

| ID | Paso | Esperado | ✅/❌ | Notas |
|----|------|----------|-------|-------|
| C1 | Atleta A → `/memberships` | Planes públicos visibles | | |
| C2 | Elegir plan, método, subir comprobante | Formulario válido | | |
| C3 | Enviar solicitud | Estado `pending`; `POST .../payment-requests` → `201` | | |
| C4 | Reintentar mismo plan (si aplica) | Comportamiento documentado (error o nueva solicitud) | | |

**Referencia:** TEST_PAYMENT_FLOW caso 2 · **QA run M1**.

---

### Fase D — Aprobación y desbloqueo

| ID | Paso | Esperado | ✅/❌ | Notas |
|----|------|----------|-------|-------|
| D1 | Admin → `/admin-v2/payments` | Solicitud de A1 en `pending` | | |
| D2 | Aprobar solicitud | Éxito; membresía activa | | |
| D3 | Network: `GET /api/memberships/active` | `200`, `daysRemaining >= 29` | | |
| D4 | Atleta A: refresh o re-login | Sesión con membresía activa | | |
| D5 | Atleta A → `/metrics`, `/routines` | Acceso permitido; nav completo | | |

**Referencia:** TEST_PAYMENT_FLOW casos 3–4 · **QA run M2**.

---

### Fase E — Casos negativos

| ID | Paso | Esperado | ✅/❌ | Notas |
|----|------|----------|-------|-------|
| E1 | Nueva solicitud pendiente (Atleta B o segundo plan) | `pending` | | |
| E2 | Admin rechaza con motivo | Atleta sigue sin membresía premium | | |
| E3 | Atleta dueño: ver comprobante (`GET .../receipt`) | `200` | | |
| E4 | Otro atleta mismo receipt URL | `403` | | |
| E5 | Admin ve comprobante ajeno | `200` | | |

**Referencia:** TEST_PAYMENT_FLOW casos 5 y 7.

---

### Fase F — Asignación directa admin

| ID | Paso | Esperado | ✅/❌ | Notas |
|----|------|----------|-------|-------|
| F1 | Atleta sin membresía (nuevo o tras expirar) | Gating activo | | |
| F2 | Admin `/admin-v2/athletes` → inspector → **Asignar plan** | Modal abre | | |
| F3 | Confirmar plan | `PUT /api/memberships/users/:id` → membresía activa | | |
| F4 | Atleta accede a rutinas/métricas | Desbloqueado sin pasar por pago | | |

**Referencia:** TEST_PAYMENT_FLOW caso 8.

---

### Fase G — Notificaciones y soporte

| ID | Paso | Esperado | ✅/❌ | Notas |
|----|------|----------|-------|-------|
| G1 | Tras aprobar pago: campana de notificaciones (atleta) | Notificación de membresía/pago | | |
| G2 | Atleta → `/support` | Chat/ticket carga | | |
| G3 | Enviar mensaje soporte | Persiste; admin lo ve en `/admin-v2/support` | | |
| G4 | Admin responde | Atleta recibe actualización (poll o realtime) | | |

---

### Fase H — Regresiones (sprint Post-QA)

| ID | Área | Paso | Esperado | ✅/❌ | Notas |
|----|------|------|----------|-------|-------|
| H1 | Trainer | Progreso de equipo con `METRICS=api` | Gráficos cargan vía API | | |
| H2 | Trainer | Detalle atleta / métricas bajo demanda | Última métrica visible | | |
| H3 | Admin | Inspector atleta en `/admin-v2/athletes` | Métricas + asignar plan | | |
| H4 | Admin | `/admin-v2/routines` listado global | Rutinas de todos los atletas | | |
| H5 | Admin legacy | `/admin` card asignaciones | Link a `/admin-v2/assignments` | | |
| H6 | Sesión | Plan con nombre custom en `/api/auth/me` | `functionalTier` correcto; no falso activo si `daysRemaining <= 0` | | |

---

## 4. Criterios de salida

**Release candidato manual** si:

- [ ] Fases A–F: todos los casos críticos ✅ (A, C, D, F obligatorios)
- [ ] Fase E: al menos E2 y E4 ✅
- [ ] Sin errores 500 en Network durante flujos felices
- [ ] Sin regresión bloqueante en Fase H

**Bloqueadores conocidos a documentar** (no bloquean si ya están en backlog):

- SSL corporate en `pnpm install` → `NODE_OPTIONS=--use-system-ca`
- Tests automatizados ya verdes: pytest 168, vitest 86

---

## 5. Registro de resultados

1. Actualizar [`2026-06-22-payment-flow.md`](./2026-06-22-payment-flow.md):
   - Cambiar M1/M2 de ⏭️ a ✅ o ❌
   - Añadir filas M3–M8 para fases G y H si aplica
2. Anotar commit probado: `9fb06da`
3. Capturas opcionales: checkout pending, admin approve, nav desbloqueado

### Plantilla resumen (copiar al final del QA run)

```markdown
## Manual — sesión [fecha]

| Fase | Pass | Fail | N/A |
|------|------|------|-----|
| A Gating | | | |
| B Admin config | | | |
| C Checkout | | | |
| D Aprobación | | | |
| E Negativos | | | |
| F Asignación directa | | | |
| G Notif/soporte | | | |
| H Regresión | | | |

**Tester:** ___________
**Bloqueadores:** ___________
```

---

## 6. Automatizado (smoke previo al manual)

Ejecutar antes de abrir el navegador:

```powershell
cd backend
python -m pytest tests/test_api_domains.py::TestPaymentFlow -q

cd ..
npm run typecheck
npm test
```

Si alguno falla, corregir antes de la sesión manual.
