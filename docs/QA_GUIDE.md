# Guía de seguimiento QA — FitTrack

Cómo ejecutar y registrar las pruebas manuales de forma ordenada y repetible.

---

## Archivos del sistema QA

| Archivo | Uso |
|---------|-----|
| [`QA_CHECKLIST.md`](QA_CHECKLIST.md) | Catálogo maestro de casos (no borrar filas; solo actualizar si cambia el producto) |
| [`qa-runs/`](qa-runs/) | Un archivo por sesión de QA con resultados |
| [`QA_BUG_TEMPLATE.md`](QA_BUG_TEMPLATE.md) | Plantilla para reportar fallos |
| [`../backend/scripts/seed_qa_dataset.py`](../backend/scripts/seed_qa_dataset.py) | Datos de prueba: 1 admin + 10 trainers + 50 atletas |

---

## Flujo recomendado (por sesión)

### 1. Preparar entorno

```powershell
# Docker (recomendado)
docker compose -p fittrack up --build -d
docker compose -p fittrack exec fittrack-backend python scripts/seed_qa_dataset.py

# Frontend modo API: copiar .env.local.api.example → .env.local
```

Credenciales QA: ver sección **Credenciales** en [`QA_CHECKLIST.md`](QA_CHECKLIST.md).

### 2. Abrir una nueva corrida

1. Duplica [`qa-runs/_TEMPLATE.md`](qa-runs/_TEMPLATE.md) → `qa-runs/YYYY-MM-DD-iniciales.md`
2. Rellena cabecera: fecha, tester, commit/rama, entorno (Docker/local)
3. Ejecuta primero **Smoke (S1–S4)** y **E2E mínimo (G1–G4)**

### 3. Marcar resultados

Usa estos símbolos en la columna **Resultado** de tu archivo de corrida:

| Símbolo | Significado |
|---------|-------------|
| ⬜ | Pendiente |
| ✅ | Pass |
| ❌ | Fail (nuevo) |
| ⚠️ | Fail conocido (ya en `plan-actual.md`) |
| ⏭️ | N/A en este entorno |
| 🔄 | Retest tras fix |

**No marques el checklist maestro** con pass/fail de cada sesión. El maestro es la especificación; cada corrida vive en `qa-runs/`.

### 4. Registrar bugs

Por cada ❌, crea una entrada con [`QA_BUG_TEMPLATE.md`](QA_BUG_TEMPLATE.md) dentro del mismo archivo de corrida (sección **Bugs encontrados**) o abre un issue en GitHub con etiquetas `qa` + `bug`.

Campos mínimos: ID del caso, severidad, pasos, esperado vs actual, captura o status HTTP.

### 5. Cerrar la sesión

Al final del archivo de corrida:

- Resumen: total ✅ / ❌ / ⚠️ / ⏭️
- Bloqueadores para release
- Comandos de regresión ejecutados (`pytest`, `pnpm test`, etc.)

### Smoke automatizado (opcional)

Antes de la pasada manual, puedes ejecutar S1–S4 y G1–G4 vía API:

```powershell
python backend/scripts/run_qa_session2.py   # pendientes + cierre diagnóstico
python backend/scripts/run_qa_smoke.py
python backend/scripts/run_qa_full.py
# Rate limit aislado (después de restart backend):
docker compose -p fittrack restart fittrack-backend
python backend/scripts/run_qa_full.py --e7-only
```

**Importante:** reinicia el backend entre `session2`, `smoke` y `full` para evitar 429 en login.

Copia el JSON de salida a la sección **Comandos ejecutados** de tu corrida.

**Plan de corrección:** tras el diagnóstico, usar [`QA_DIAGNOSTICO_Y_PLAN.md`](QA_DIAGNOSTICO_Y_PLAN.md) (matriz FIX-01…FIX-24 + sprints).

**Docker:** el compose define `API_INTERNAL_URL=http://fittrack-backend:5000` para Titan → Flask, y `extra_hosts: host.docker.internal:host-gateway` para Ollama en el host (`OLLAMA_BASE_URL=http://host.docker.internal:11434`). Sin `extra_hosts`, Titan responde `source: fallback` aunque Ollama esté activo en Windows.

---

## Estrategia por prioridad

Orden sugerido cuando el tiempo es limitado:

1. **Smoke + E2E por rol** (15–20 min)
2. **Sección A** (auth) + **E** (seguridad API)
3. **B, C, D** por rol según el área que cambió en el PR
4. **F** (CI local) antes de merge

Si un caso tiene referencia **Fase 10–13** en el maestro, un ⚠️ no bloquea la sesión salvo que el objetivo sea validar ese fix.

---

## Herramientas opcionales

- **VS Code / Cursor:** vista previa Markdown + checkboxes en el archivo de corrida
- **GitHub Issues / Projects:** tablero Kanban `QA → In progress → Done`
- **Hoja de cálculo:** exportar tabla de `qa-runs` para métricas (% pass por área)
- **DevTools → Network:** guardar HAR en fallos de API

---

## Re-seed de datos

El script es **idempotente** (no duplica emails). Para BD limpia en Docker:

```powershell
docker compose -p fittrack down
docker volume rm fittrack_backend_data
docker compose -p fittrack up --build -d
docker compose -p fittrack exec fittrack-backend python scripts/seed_qa_dataset.py
```
