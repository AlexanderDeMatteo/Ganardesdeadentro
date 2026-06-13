# QA Release Closure — 2026-06-13

## Cabecera

| Campo | Valor |
|-------|-------|
| **Fecha** | 2026-06-13 |
| **Alcance** | Sprints 1–5 · FIX-01…FIX-24 (FIX-05 obsoleto) |
| **Entorno** | Docker local (`fittrack-backend`, `fittrack-frontend`) |
| **Decisión** | **QA RELEASE OK** |

---

## CI / checks automatizados (F1–F5)

| Check | Comando | Resultado |
|-------|---------|-----------|
| F1 | `pytest` (backend) | ✅ 130 passed |
| F2 | `pnpm lint` | ✅ OK |
| F3 | `pnpm typecheck` | ✅ OK |
| F4 | `pnpm test` (Vitest) | ✅ 33 passed |
| F5 | `pnpm build` | ✅ OK (Next.js 16.2.4) |

---

## Scripts QA (post-restart)

| Script | Resultado | Notas |
|--------|-----------|-------|
| `run_qa_session2.py` | ✅ 16 pass · 4 skip · 0 fail | D7 corregido (email único por corrida) |
| `run_qa_full.py` | ⚠️ 45 pass · 1 fail · 9 known · 5 skip | **A6 → HTTP 429** por rate-limit tras logins previos en el mismo script; A6 validado en session2 (aislado) |
| `run_qa_smoke.py` | ✅ 7 pass · 1 skip (S4 DevTools) | Ejecutar **después** de `restart fittrack-backend` si sigue a `full` |

**Procedimiento recomendado:** `docker compose -p fittrack restart fittrack-backend` entre `session2` → `full` → `smoke`.

---

## Fixes Sprint 4–5 verificados en esta corrida

| FIX | Verificación |
|-----|--------------|
| FIX-16 (E3) | Interceptor 401 en `http-client.ts` |
| FIX-18 (E2) | Titan guard JWT inválido → 401 |
| FIX-17 (B14) | Sin enlace `/settings` en menú atleta |
| FIX-19 | Macros P/C/G en diario (API + UI) |
| FIX-23 | Sparkline PROGRESO con datos reales |
| FIX-24 | Sin rutas `dashboard-2/3`; redirect a `/dashboard` |

---

## Reservas (no bloquean release)

1. **A6 en `run_qa_full`:** falso negativo por rate-limit; usar session2 o restart + ejecutar A6 aislado.
2. **S4 / A10 / D8 modal:** verificación manual en browser (DevTools, guards UI).
3. **Casos `known` en full:** hallazgos documentados pre-fix o UI-only; no hay FIX pendiente en Sprints 1–5.

---

## Manual opcional (5 min)

- [ ] Login atleta → menú usuario sin “Configuración”
- [ ] `/nutrition` → añadir comida con P/C/G y recargar
- [ ] `/dashboard` → sparkline PROGRESO con entradas de peso
- [ ] Token expirado / 401 → redirección a `/login` (DevTools)

---

*Cierre formal alineado con [`QA_DIAGNOSTICO_Y_PLAN.md`](../QA_DIAGNOSTICO_Y_PLAN.md) §7.*
