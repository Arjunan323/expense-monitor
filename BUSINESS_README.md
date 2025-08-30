
# Expense Monitor

Unified expense intelligence for individuals and businesses: upload multi-bank PDF statements, extract and normalize transactions with AI, enforce plan and feature limits, stream processing progress, visualize spending, cashflow, and tax benefits, and securely store original statements in Oracle Object Storage.


## Feature Highlights (2025)
**Core**
- PDF statement ingestion (multi-file, password-protected, plan-based validation)
- Secure storage of original statements in Oracle Object Storage (with pre-signed download URLs)
- Async extraction pipeline with job tracking (SSE + polling fallback)
- AI-powered parsing (GPT/OCR hybrid Python lambda) for normalized transactions
- Multi-bank aggregation, category rollups, recent activity, usage stats
- Transaction de-duplication (backend + dashboard in-memory guard)

**User & Access**
- JWT authentication (secure login, registration)
- Role/plan-aware usage policy (statement count, page limits, analytics gating)
- Stripe subscription integration (FREE / PRO / PREMIUM tiers, plan gating for analytics/features)



**Analytics & Intelligence**
- Dashboard: unified view of balances, income/expense, category top N, recent transactions
- Monthly Trends: Visualize your spending patterns month-over-month, spot seasonal changes, and identify areas for optimization.
- Budget Tracking: Set budgets for categories, monitor your progress, and receive alerts when you approach or exceed limits.
- Tax Benefit Tracker: Identify and organize deductible transactions, upload receipts, and prepare for tax season with confidence.
- Spending Alerts: Get notified instantly when your spending exceeds set thresholds, helping you stay on track and avoid surprises.
- Goal Tracking: Define financial goals (e.g., saving for a trip), track your progress, and celebrate milestones as you achieve them.
- Cash Flow Forecast: Predict future cash flow based on historical transactions and upcoming bills, enabling proactive financial planning.
- Plan-based gating for analytics screens and APIs (frontend, backend, mobile)

### Tax Benefit Tracker
The Tax Benefit Tracker helps users identify and organize transactions that may qualify for tax deductions or credits. It automatically scans uploaded statements for common deductible categories (such as charitable donations, business expenses, medical payments, and more), flags eligible transactions, and allows users to upload and link receipts for compliance and audit purposes. This feature streamlines year-end tax preparation, maximizes potential savings, and provides a centralized view of deductible spending. Advanced users can customize categories and export records for their accountant or tax software.

**Experience**
- Frontend: React + Vite + TypeScript, persistent upload job store, SSE reconnect guards
- Mobile: React Native / Expo, full feature parity for auth, analytics, and plan gating
- Local storage & in-memory job rehydration for progress bars
- Date range & multi-bank filters

**Reliability & Quality**
- Global exception handling, structured error codes
- Streaming endpoints protected & sanitized
- Connection/pool safety: async processing off main transaction, emitter cleanup
- Scheduled cleanup job for expired storage URLs (PARs)

**Migration & Infrastructure**
- Oracle DB migration scripts (Flyway) for new columns, indexes, and storage keys
- Backend refactored for Oracle compatibility and reliability


## High-Level Architecture
1. **Upload & Storage**: Frontend posts multipart PDF (with password if needed) → backend validates plan, stores file in Oracle Object Storage, creates async job (StatementJob).
2. **Async Extraction**: Background processor extracts pages, routes to Python extraction service (OCR + GPT), parses transactions, persists unique rows, updates progress.
3. **Streaming Updates**: Client subscribes via /statement-jobs/{id}/stream (SSE). Progress/state events broadcast until COMPLETED/FAILED. Fallback polling if SSE unavailable.
4. **Analytics**: Dashboard aggregates per-bank balances, income/expense totals, category top N, recent transactions, with date & bank filters and dedupe.
5. **Usage Enforcement**: Monthly counters (statements, pages), bank selection caps, analytics gating, password-required flow pauses queue until user supplies password.
6. **Mobile Parity**: All analytics and plan gating features available on mobile (React Native/Expo).


## Tech Stack
- Frontend: React, TypeScript, Tailwind-like utility styles, Recharts
- Mobile: React Native (Expo) + SecureStore abstraction
- Backend: Spring Boot, Spring Security 6, JPA/Hibernate, Flyway, HikariCP, OpenAPI
- Extraction: Python (pdfplumber, pytesseract) + OpenAI model
- Database: Oracle DB (primary), Flyway migrations (bank names, plans, txn hash, storage keys, etc.)
- Object Storage: Oracle Cloud (OCI) for original statement files
- Observability: Structured request/response logging (correlationId), Prometheus readiness (actuator endpoints)


## Key Domain Concepts
| Concept         | Purpose                                              |
|----------------|------------------------------------------------------|
| StatementJob   | Tracks async extraction lifecycle & progress         |
| UsageStats     | Per-user counters & plan-derived limits              |
| Plan Types     | FREE (restricted), PRO, PREMIUM (higher/unlimited)   |
| Job Streaming  | SSE endpoint emitting job-update events              |
| StorageKey     | Unique key for each statement in Oracle Object Storage |
| PlanGate       | UI/API gating for analytics/features by plan tier    |


## File / Folder Highlights
- `backend/src/main/java/.../service/statement/AsyncStatementProcessor` – async pipeline executor
- `backend/src/main/java/.../service/statement/RawStatementPersister` – statement storage and key management
- `backend/src/main/java/.../controller/StatementController` – statement upload/download endpoints
- `backend/src/main/java/.../controller/StatementJobStreamController` – SSE endpoint
- `backend/src/main/java/.../config/RequestResponseLoggingAspect` – structured logging
- `backend/src/main/java/.../config/SecurityConfig` + `JwtFilter` – security & JWT injection
- `backend/src/main/java/.../exception/GlobalExceptionHandler` – unified error shaping
- `frontend/src/components/PdfUpload.tsx` – upload UI, password flow, SSE management, persistence
- `frontend/src/components/Dashboard.tsx` – filtering, multi-bank analytics aggregation
- `frontend/src/components/analytics/` – analytics screens (BudgetTracking, TaxTracker, etc.)
- `frontend/src/components/Analytics.tsx` – plan gating for analytics
- `mobile/src/.../UploadScreen` – mobile job progress & auth flow
- `mobile/src/screens/AnalyticsScreen.tsx` – mobile analytics with plan gating


## Business Value / Use Cases
- Rapid onboarding: upload historical statements for multi-bank unified view
- Secure storage and retrieval of original statements (compliance, audit, download)
- Expense intelligence: category concentration, monthly deltas, anomaly surfacing (future)
- Subscription monetization: tiered limits & analytics gated by plan
- Accountant/advisor productivity: bulk ingestion & consistent normalization


## Operational Safeguards
- Streaming guard rails: SSE suppressed post-completion; client prevents duplicate streams
- Token validation hardened (invalid tokens do not partially commit responses)
- Password-protected PDF retry loop without losing progress
- Scheduled cleanup of expired storage URLs (PARs)


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
- Sensitive secrets externalized (env vars / vault) in production
- Stripe handles card data (PCI scope minimized)
- Oracle Object Storage: secure, time-limited access to statement files


## Current Limitations / Known Follow-Ups
- Hard-coded JWT secret (needs externalization & rotation policy)
- Basic anomaly detection & forecasting not yet implemented
- Extraction Python script not containerized in repo (future: microservice + queue)
- No explicit rate limiting at gateway (recommend adding if public exposure increases)
- Mobile tests & e2e coverage pending


## Roadmap (Next Candidates)
1. Forecasting & cashflow projections (ML models)
2. Category reclassification UI & rules engine
3. Tagging & search improvements (full-text index)
4. Budget goals & variance alerts (email/push)
5. Automated bank format learning feedback loop
6. Multi-user org workspaces (teams/roles)
7. Export enhancements (Excel, JSON API tokens)
8. Infrastructure hardening: containerization, CI, staging env, SLO dashboards
9. Advanced anomaly detection and predictive analytics
10. Enhanced mobile experience and offline support


## Contribution Guidelines (Lightweight)
- Keep controllers thin; move logic to services & DTOs
- Favor immutable DTOs at API boundaries; avoid leaking JPA entities
- Add or adjust tests when changing business rules (dedupe, limits, plan gating)
- Log correlationId for cross-service trace continuity


## Support / Contact
Open an issue for bugs or feature requests. For partnerships or enterprise inquiries, contact the repository owner via GitHub profile.


---
This document reflects the active architecture & feature set (updated: 2025-08-30). For technical onboarding, also review code-level READMEs inside `backend/` & `frontend/`.
