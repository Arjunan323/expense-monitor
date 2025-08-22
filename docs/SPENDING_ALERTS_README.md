# Spending Alerts Module

## 1. Executive / Business Overview
Spending Alerts provide proactive, real‑time visibility into unusual or risky user spending patterns so users can take corrective action early, avoid overspending, and build better financial discipline. The feature clusters multiple anomaly types into a unified experience and enables quick acknowledgement, dismissal, tuning, and learning.

### 1.1 Key User Value
- Early detection of large, unexpected or runaway expenses.
- Surfacing new merchants to raise fraud / subscription awareness.
- Identifying category spikes that threaten budgets before month end.
- Detecting unusually frequent transactions (e.g. impulse micro‑spends, repeats, split bills).
- Personalized recommendations to set caps or mute noise.

### 1.2 Core Personas
| Persona | Needs | How Feature Helps |
| ------- | ----- | ----------------- |
| Budget Conscious User | Stay on track mid‑month | Alerts + recommendations on high‑risk categories |
| Power User | Fine‑tune signal vs noise | Whitelist + mute + severity thresholds |
| New User | Confidence & trust | Clear explanations + low friction acknowledgement |
| Risk / Fraud Sensitive | Spot abnormal merchants | New merchant & frequency rules |

### 1.3 Success Metrics (Sample KPIs)
- % of alerts acknowledged within 24h
- Reduction in month‑end overspend vs control cohort
- User configured at least one custom threshold (adoption)
- Recommendation conversion (suggested limit applied)
- Dismissed / generated ratio (signal quality)

### 1.4 Feature Scope Summary
| Area | Included | Notes |
| ---- | -------- | ----- |
| Detection Rules | Large Transaction, Frequency, Category Spike, New Merchant | Pluggable registry |
| Real‑time Delivery | SSE stream | Events: alert.new / updated / acknowledged / dismissed |
| User Actions | Acknowledge, Dismiss (soft), Bulk ops | Audit trail preserved |
| Configuration | Multipliers, min amounts, critical overrides | Persisted per user |
| Noise Controls | Merchant whitelist, Category mute (with optional expiry) | Applied during detection |
| Recommendations | Suggested limits (+ future tips) | Regenerated daily + on demand |
| Backfill & Recompute | Manual + scheduled | Non‑destructive for acknowledged/dismissed |
| Observability | Audit events, generation stats | lastGeneratedAt + count |
| Metadata | Parsed rule metrics exposed | Frontend expandable details |

### 1.5 Roadmap (Next Opportunities)
- Rule-specific precision metrics & auto‑tuning
- ML scoring (anomaly probability) overlay
- User feedback loop ("not useful" training signal)
- Multi‑device push notification integration
- WebSocket fallback / reconnection analytics

---

## 2. Technical Architecture

### 2.1 High Level Flow
1. Transactions persist as usual (outside module scope).
2. Recompute job (scheduled hourly + manual trigger) loads month transactions.
3. Rule Registry executes each rule (stateless) -> candidate `SpendingAlert` objects.
4. Existing unacknowledged & undismissed alerts for month are replaced; acknowledged/dismissed retained.
5. De‑duplicated alerts saved; SSE events emitted; audit entries recorded.
6. Recommendations job (daily) analyzes category spend history and stores suggested limit records.
7. Frontend consumes combined list wrapper + SSE for incremental updates.

### 2.2 Backend Components
| Layer | Artifact | Purpose |
| ----- | -------- | ------- |
| Entity | `SpendingAlert` | Persisted anomaly w/ metadata JSON |
| Entity | `SpendingAlertSettings` | Per‑user thresholds + generation stats |
| Entity | `SpendingAlertWhitelist`, `SpendingAlertMutedCategory` | Noise control records |
| Entity | `SpendingAlertRecommendation`, `SpendingAlertAudit` | Guidance + action lineage |
| DTO | `SpendingAlertDto` | Includes parsedMetadata map |
| Service | `SpendingAlertService` | Orchestration, rule registry, SSE publishing |
| Rules | `LargeTransactionRule`, `FrequencyRule`, `CategorySpikeRule`, `NewMerchantRule` | Pluggable detection strategies |
| Stream | `SpendingAlertStreamPublisher` | Manages per‑user SSE emitters |
| Controller | `SpendingAlertController` | REST + streaming endpoints |
| Migration | `V18+` series | Schema evolution (alerts, settings, metadata, generation stats) |

### 2.3 Detection Rule Contract
```
interface SpendingAlertRule {
  String key();
  List<SpendingAlert> detect(User user,
                             List<Transaction> monthTransactions,
                             SpendingAlertSettings settings,
                             Map<String, BigDecimal> baselineCategoryAverages,
                             Set<String> whitelist,
                             Set<String> mutedCategories,
                             LocalDate from,
                             LocalDate to);
}
```
Rules return minimally populated `SpendingAlert` objects; service stamps severity, title, description, reason (Rule: key) if absent.

### 2.4 Severity Determination
Hybrid approach combining:
- Configured critical absolute / multiplier overrides (stored in settings)
- Rule-specific contextual metadata (e.g., threshold, count)
- Default fallback: moderate

### 2.5 Idempotency & Non-Destructive Recompute
- Acknowledged OR dismissed alerts preserved (never regenerated).
- Only transient (unacted) alerts are purged/replaced during recompute.
- Signature-based dedupe: `type|merchant|category|txnIdOrDate`.

### 2.6 Recommendations Generation
- Aggregates last 3 months category spend (negative amounts) and suggests 0.9 * average caps for top spend categories.
- Stored separately; grouped for UI into `tips[]` and `suggestedLimits[]`.

### 2.7 Merchant Normalization
Utility normalizes raw merchant strings before rule evaluation (batch endpoint + scheduled potential extension) to enhance consistency in grouping.

### 2.8 Streaming (SSE)
- Endpoint: `GET /analytics/spending-alerts/stream`
- Events published as unified JSON: `{ type:"alert.new", payload: <SpendingAlertDto> }`
- Provided event types enumerated via `/analytics/spending-alerts/meta` (`streamEvents`).
- Reconnect logic handled client-side with exponential backoff.

### 2.9 Summary & Stats
- Combined list API returns wrapper: `content`, `summary`, `page`.
- Summary fields: `criticalOpen`, `moderateOpen`, `acknowledged`, `total`, `generated`, `lastGeneratedAt`.
- Generation stats updated on recompute.

### 2.10 Database Schema (Key Tables)
Simplified (platform neutral):
```
spending_alerts (
  id PK, user_id FK, type, severity, title, description, amount DECIMAL,
  merchant, category, txn_date, reason, txn_id, metadata CLOB,
  acknowledged BOOLEAN, acknowledged_at, dismissed BOOLEAN, dismissed_at,
  created_at, updated_at
)
spending_alert_settings (
  id PK, user_id FK UNIQUE,
  large_multiplier, large_min_amount,
  freq_window_hours, freq_max_txn, freq_min_amount,
  cat_spike_multiplier, cat_spike_lookback_months, cat_spike_min_amount,
  new_merchant_min_amount,
  critical_large_absolute, critical_category_spike_multiplier,
  critical_frequency_count, critical_new_merchant_absolute,
  last_generated_at, last_generated_count,
  created_at, updated_at
)
spending_alert_whitelist (id PK, user_id FK, merchant)
spending_alert_muted_category (id PK, user_id FK, category, mute_until)
spending_alert_recommendation (id PK, user_id FK, month, type, ...)
spending_alert_audit (id PK, alert_id FK, user_id FK, action, at)
```

### 2.11 Performance Considerations
- Batched delete + insert on recompute; retained alerts bypass writes.
- In-memory aggregation for current month (bounded set) acceptable; consider windowed SQL if volume scales.
- Indexes (added in prior migrations) on user_id, type, severity, created_at, txn_date for listing queries.

### 2.12 Extensibility
Add a new rule:
1. Implement `SpendingAlertRule`.
2. Add to `rules` list in `SpendingAlertService`.
3. (Optional) Extend severity logic if special handling needed.
4. Add metadata description to `/meta` if new type.

### 2.13 Error Handling & Audit
- User access validated per alert ID.
- Each user action (acknowledge / dismiss / creation) persisted in audit.
- Rule failures swallowed per rule to avoid aborting full recompute (can enhance with logging & metrics).

### 2.14 Security & Privacy
- Multi-tenant isolation via user scoping on all queries.
- Metadata JSON restricted to rule metrics—avoid storing full PII beyond merchant/category fields already present.

### 2.15 Known Gaps / Future Enhancements
| Area | Gap | Mitigation |
| ---- | --- | ---------- |
| Rule Precision | Static thresholds only | Introduce adaptive/ML scoring |
| Push Notifications | SSE only | Add mobile/web push broker |
| UI Filtering | Limited severity filter | Extend query & UI control |
| Duplicate Merchant Norm | Batch manual trigger | Schedule + incremental hashing |
| Recommendation Diversity | Only suggested limits | Add behavioral tips engine |

---

## 3. API Reference (Condensed)
Base path: `/analytics/spending-alerts`

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/` | GET | List (wrapper with content, summary, page) |
| `/{id}` | GET | Get single alert |
| `/{id}/acknowledge` | POST | Acknowledge alert |
| `/{id}` | DELETE | Dismiss (soft) |
| `/acknowledge` | POST | Bulk acknowledge |
| `/dismiss` | POST | Bulk dismiss |
| `/summary` | GET | Summary only |
| `/settings` | GET/PUT | Get/update thresholds & overrides |
| `/whitelist` | GET/POST | List/add merchant whitelist |
| `/whitelist/{merchant}` | DELETE | Remove merchant |
| `/mute-category` | GET | List muted categories |
| `/mute-category` | POST | Mute category (optional until) |
| `/mute-category/{category}` | DELETE | Unmute category |
| `/recommendations` | GET | Grouped tips & suggested limits |
| `/recompute` | POST | Manual recompute (month optional) |
| `/backfill` | POST | Recompute historical months |
| `/stream` | GET (SSE) | Real-time alert events |
| `/{id}/audit` | GET | Audit trail for alert |
| `/meta` | GET | Types, severities, stream events |
| `/normalize-merchants` | POST | Merchant normalization batch |

---

## 4. Frontend Integration Notes
- Uses combined list and avoids double summary fetch.
- SSE with exponential backoff; events merged into state.
- Parsed metadata displayed via collapsible details panel.
- Settings form includes critical overrides; undefined treated as removal.
- Dynamic filter pills built from `/meta` types.
- Recommended limits and tips rendered separately.

### 4.1 State Shape Simplification
```
alerts: SpendingAlertDto[]
summary: SpendingAlertSummaryDto
settings: SpendingAlertSettingsDto
whitelist: string[]
mutedCats: {id:number; category:string; muteUntil?:string|null}[]
recommendations: { tips: RecommendationDto[]; suggestedLimits: [...] }
meta: { types:[...]; severities:[...]; streamEvents:[...] }
```

### 4.2 SSE Payload Contract
```
{ "type": "alert.new"|"alert.updated"|"alert.acknowledged"|"alert.dismissed", "payload": SpendingAlertDto }
```

---

## 5. Operational Runbooks
| Scenario | Action |
| -------- | ------ |
| Rule tweak needed | Adjust settings multipliers or implement new rule class and register |
| Flood of noisy alerts | Add merchants to whitelist OR mute category; recompute |
| Generation stuck / zero alerts | Trigger `/recompute` with month param and inspect logs |
| Missing severity escalation | Verify critical overrides populated in settings |
| Migration failure (V24) | Roll back, add columns manually, re-run Flyway |

---

## 6. Testing Strategy (Outline)
- Unit: Each rule with synthetic transactions (edge thresholds, negative amounts, whitelist, mute).
- Service: Recompute retention logic (ack/dismiss preserved) & dedupe signatures.
- Integration: SSE event emission sequence (new -> acknowledge -> dismiss).
- UI: Snapshot + interaction tests for pagination & settings form.

---

## 7. Glossary
| Term | Definition |
| ---- | ---------- |
| Recompute | Regeneration of alerts for a month replacing unacted alerts |
| Backfill | Multi-month sequential recompute (reverse chronological) |
| Parsed Metadata | JSON-derived key metrics displayed for transparency |
| Suggested Limit | Recommendation to cap average spend minus 10% |

---

## 8. Change Log (Key Milestones)
- V18: Initial alert tables
- V20: Settings / whitelist / audit schema
- V21–22: Merchant + index optimizations
- V23: Severity override thresholds
- V24: Generation stats columns + combined response & grouped recommendations

---

## 9. Quick Start (Local)
1. Apply migrations (Flyway auto on Spring Boot start).
2. Start backend (Oracle or Postgres configured) & frontend (Vite dev server).
3. Open Spending Alerts UI — alerts load + SSE connect.
4. Trigger manual recompute: POST `/analytics/spending-alerts/recompute`.
5. Observe new alerts appear in UI (alert.new events).

---

## 10. Future Hardening Ideas
- Circuit breaker around rule execution (per rule timer + fallback)
- Structured logging of rule evaluation metrics
- Prometheus counters: alerts_generated_total{type}, rule_duration_seconds
- Multi-language i18n of alert titles/descriptions
- Access policy for admin-only operations (normalize merchants, backfill)

---

© 2025 Expense Monitor – Spending Alerts Module
