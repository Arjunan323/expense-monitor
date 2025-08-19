# CutTheSpend

Data-driven personal & small-business financial intelligence: upload multi-bank PDF statements, extract & normalize transactions with AI, enforce plan limits, stream processing progress, and visualize spending & cashflow across accounts.

## Current Capability Snapshot
Core
- PDF statement ingestion (multi-file, password-protected support, size & plan validation)
- Async extraction pipeline with background job tracking (SSE + resilient polling fallback)
- GPT / OCR hybrid parsing (Python lambda) -> normalized transactions
- Multi-bank aggregation, per-bank toggles, category rollups, recent activity & usage stats
- Transaction de-duplication (backend ingestion + dashboard in-memory guard for overlapping statements)

User & Access
- JWT auth (immediate login on registration) with hardened security filters & JSON error responses
- Role/plan aware usage policy (statement count, page limits, combined bank selection limits)
- Stripe subscription integration (FREE / PRO / PREMIUM tiers, expired plan gating)

Experience
- Frontend (React + Vite + TypeScript) with persistent upload job store & SSE reconnect guards
- Mobile (React Native / Expo) mirroring auth & async job progress (SSE or fallback polling)
- Local storage & in-memory job rehydration so progress bars survive navigation
- Date range & multi-bank filters (portal-based picker to avoid z-index collisions)

Reliability & Quality
- Global exception handling with structured ErrorResponse codes
- Streaming endpoints protected & sanitized (logging aspect avoids deep entity recursion)
- Connection / pool safety: async processing off main transaction, emitter cleanup to prevent leaks

## High-Level Architecture
1. Upload: Frontend posts multipart PDF (optional password) -> backend validates plan, stores temp file & creates async job (StatementJob).
2. Async Processing: Background processor extracts pages, routes to Python extraction service (OCR + GPT), parses transactions, persists unique rows, updates progress.
3. Streaming Updates: Client subscribes via /statement-jobs/{id}/stream (SSE). Progress/state events broadcast until COMPLETED/FAILED. Fallback polling with exponential backoff if SSE unavailable.
4. Analytics: Dashboard aggregates per-bank balances (latest balance per bank), income/expense totals, category top N, recent transactions, applying optional date & bank filters with dedupe.
5. Usage Enforcement: Monthly counters (statements, pages) + bank selection caps bound to plan; password-required flow pauses queue until user supplies password.

## Tech Stack
- Frontend: React, TypeScript, Tailwind-like utility styles, Recharts
- Mobile: React Native (Expo) + SecureStore abstraction
- Backend: Spring Boot, Spring Security 6, JPA/Hibernate, Flyway, HikariCP, OpenAPI
- Extraction: Python (pdfplumber, pytesseract) + OpenAI model
- Database: PostgreSQL (assumed; configured via Spring), Flyway migrations (bank names, plans, txn hash, etc.)
- Observability: Structured request/response logging (correlationId), Prometheus readiness (actuator endpoints)

## Key Domain Concepts
| Concept | Purpose |
|---------|---------|
| StatementJob | Tracks async extraction lifecycle & progress |
| UsageStats | Per-user counters & plan-derived limits |
| Plan Types | FREE (restricted), PRO, PREMIUM (higher or unlimited limits) |
| Job Streaming | SSE endpoint emitting job-update events |

## File / Folder Highlights
- `backend/src/main/java/.../service/statement/AsyncStatementProcessor` – asynchronous pipeline executor
- `backend/src/main/java/.../controller/StatementJobStreamController` – SSE endpoint
- `backend/src/main/java/.../config/RequestResponseLoggingAspect` – safe structured logging
- `backend/src/main/java/.../config/SecurityConfig` + `JwtFilter` – security & JWT injection
- `backend/src/main/java/.../exception/GlobalExceptionHandler` – unified error shaping
- `frontend/src/components/PdfUpload.tsx` – upload UI, password flow, SSE management, persistence
- `frontend/src/components/Dashboard.tsx` – filtering, multi-bank analytics aggregation
- `mobile/src/.../UploadScreen` (analogous) – mobile job progress & auth flow

## Business Value / Use Cases
- Rapid onboarding: upload historical statements for multi-bank unified view
- Expense intelligence: category concentration, monthly deltas, anomaly surfacing (future)
- Subscription monetization: tiered limits & per-bank analytics gated by plan
- Accountant / advisor productivity: bulk ingestion & consistent normalization

## Operational Safeguards
- Streaming guard rails: SSE suppressed post-completion; client prevents duplicate streams
- Token validation hardened (invalid tokens do not partially commit responses)
- Password-protected PDF retry loop without losing progress

## Running Locally (Summary)
Frontend
1. cd frontend
2. npm install
3. npm run dev

Backend
1. cd backend
2. mvn clean spring-boot:run

Mobile (Expo)
1. cd mobile
2. npm install
3. npx expo start

Python Extraction (if run locally)
1. cd extraction_lambda
2. pip install -r requirements.txt
3. python extraction_lambda.py (adapt for async invocation / service mode)

Environment Keys
- OPENAI_API_KEY (extraction)
- STRIPE_SECRET / STRIPE_WEBHOOK (payments)
- JWT secret (backend) – relocate from hard-coded constant for production

## Security & Privacy
- JWT-based stateless auth; custom entry point & access denied JSON handlers
- Correlation IDs injected for traceability
- Sensitive secrets to be externalized (env vars / vault) in production
- Stripe handles card data (PCI scope minimized)

## Current Limitations / Known Follow-Ups
- Hard-coded JWT secret (needs externalization & rotation policy)
- Basic anomaly detection & forecasting not yet implemented
- Extraction Python script not containerized in repo (future: microservice + queue)
- No explicit rate limiting at gateway (recommend adding if public exposure increases)
- Mobile tests & e2e coverage pending

## Roadmap (Next Candidates)
1. Forecasting & cashflow projections (ARIMA / ML lightweight models)
2. Category reclassification UI & rules engine
3. Tagging & search improvements (full-text index)
4. Budget goals & variance alerts (email / push)
5. Automated bank format learning feedback loop
6. Multi-user org workspaces (teams / roles)
7. Export enhancements (Excel, JSON API tokens)
8. Infrastructure hardening: containerization, CI, staging env, SLO dashboards

## Contribution Guidelines (Lightweight)
- Keep controllers thin; move logic to services & DTOs
- Favor immutable DTOs at API boundaries; avoid leaking JPA entities
- Add or adjust tests when changing business rules (dedupe, limits)
- Log correlationId for cross-service trace continuity

## Support / Contact
Open an issue for bugs or feature requests. For partnerships or enterprise inquiries, contact the repository owner via GitHub profile.

---
This document reflects the active architecture & feature set (updated: 2025-08-16). For technical onboarding, also review code-level READMEs inside `backend/` & `frontend/`.
