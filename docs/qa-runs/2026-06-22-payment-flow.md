# QA Run — 2026-06-22 — Payment flow sprint

## Cabecera

| Campo | Valor |
|-------|-------|
| **Fecha** | 2026-06-22 |
| **Tester** | Agent (automatizado + checklist) |
| **Rama / commit** | working tree post-QA sprint |
| **Entorno** | local pytest |
| **Seed ejecutado** | Sí (fixtures pytest) |
| **`.env.local` API** | Documentado en TEST_PAYMENT_FLOW.md |

## Resumen

| Métrica | Count |
|---------|-------|
| ✅ Pass | 5 |
| ❌ Fail nuevo | 0 |
| ⚠️ Fail conocido | 0 |
| ⏭️ N/A | 2 (UI browser manual) |
| 🔄 Retest | 0 |

**Bloqueadores release:** ninguno en suite automatizada de pagos.

---

## Resultados automatizados

| ID | Caso | Resultado | Notas |
|----|------|-----------|-------|
| P1 | `test_payment_flow_approve_assigns_membership` | ✅ | Aprobación activa plan |
| P2 | `test_athlete_without_membership_blocked_on_routines` | ✅ | 403 `membership_required` |
| P3 | `test_admin_crud_payment_methods` | ✅ | CRUD métodos |
| P4 | `test_exchange_rates_crud` | ✅ | Tasas USD→VES |
| P5 | `test_payment_request_stores_conversion_snapshot` | ✅ | Snapshot conversión |

## Resultados manuales UI (pendiente humano)

| ID | Caso | Resultado | Notas |
|----|------|-----------|-------|
| M1 | Checkout atleta con comprobante en navegador | ⏭️ | Ver TEST_PAYMENT_FLOW.md casos 2–4 |
| M2 | Admin UI `/admin-v2/payments` approve/reject | ⏭️ | Requiere Docker + browser |

---

## Comandos ejecutados

```text
cd backend && python -m pytest tests/test_api_domains.py::TestPaymentFlow -q
npm test
npm run typecheck
```

## Notas de sesión

- Gating membresía confirmado intencional (frontend `lib/membership/access.ts` + backend `require_active_membership`).
- Fix `mapMeMembership` para planes con nombre custom y `functionalTier` desde `/api/auth/me`.
- Modal admin **Asignar plan** en `/admin-v2/athletes`.
