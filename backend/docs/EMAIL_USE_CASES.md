# Email Functionality Roadmap

## Core Service (Implemented)
- Dependency: spring-boot-starter-mail
- Configurable SMTP properties via environment overrides.
- Service supports: plain text, HTML, simple token replacement templates, attachments.

## Immediate Next Steps
1. Verification & Onboarding
   - Send email verification link with signed token (JWT) on signup/change.
   - Welcome email post-verification summarizing key features.
2. Password / Account Security
   - Password reset link (JWT / one-time token, 15–30 min TTL).
   - New device / unusual login notification.
3. Spending & Budget
   - Category threshold breach alert (triggered by spending alerts module).
   - Daily / Weekly digest: total spend, top 3 categories, upcoming recurring debits.
4. Goals
   - Goal milestone (25/50/75/100%) progress emails.
   - Inactivity nudge (no contribution in X days).
5. Cash Flow / Forecast
   - Low projected balance warning (custom threshold).
6. Tax & Compliance
   - Missing receipt reminders (weekly until resolved).
   - Year-end tax summary (PDF attachment) and mid-year optimization tips.
7. Receipts & Documents
   - Receipt upload confirmation (optional user toggle).
8. Billing / Subscription
   - Payment success / failure, upcoming renewal, trial ending.
9. Analytics Insights
   - Monthly insights: anomalies, largest transaction, saving rate.
10. Support / Communication
   - Support ticket updates, closure notifications.

## Cross-Cutting Concerns
- Global user notification preferences (per category opt-in/out).
- Rate limiting (e.g., max N alerts per category per day).
- Idempotency / de-duplication for burst events.
- Template internationalization & currency formatting.
- Observability: log mail id + correlation id.
- Queueing & Retry (later: move to async via @Async or message queue/SNS/SQS).

## Data Model Additions (Planned)
- user_notification_preferences table (email_enabled flags per type).
- email_audit table (id, user_id, type, subject, sent_at, status, correlation_id, metadata JSON).

## Security
- Signed tokens for links (verification, reset).
- Do not leak whether an email exists (generic response on reset request).

## Failure Handling
- Fallback to plain text if HTML template fails to resolve.
- Circuit breaker around SMTP (optional).

## Future Enhancements
- Template engine integration (Thymeleaf/Freemarker) replacing simple replacement.
- Dark mode / accessible templates.
- Multi-language support.
- Batch digest aggregator job (scheduled). 
- DKIM / SPF guidance for production deliverability.

---
This roadmap guides incremental rollout while keeping current implementation lightweight and testable.
