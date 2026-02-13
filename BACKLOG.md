# Preik – Backlog & Production Readiness

> Last updated: 2026-02-09

## Status Legend

- [x] Done
- [~] Partially done / needs improvement
- [ ] Not started

---

## What's Been Done

### Core Platform
- [x] Next.js 16 App Router setup with TypeScript strict mode
- [x] Multi-tenant architecture with per-tenant config, prompts, and content isolation
- [x] Supabase integration (PostgreSQL, Auth, Row-Level Security)
- [x] Landing page, login, docs page, legal pages
- [x] Tenant dashboard with sidebar navigation
- [x] Admin panel with Supabase Auth protection (super admin email check)

### AI & Chat
- [x] Streaming chat API with Gemini 2.0 Flash (Vertex AI)
- [x] OpenAI fallback when Vertex AI fails (automatic retry, up to 2 retries)
- [x] Vercel AI SDK integration for unified LLM interface
- [x] RAG pipeline: embeddings → vector search → context-augmented responses
- [x] Intent detection (product_query, support, general, unknown)
- [x] Response quality tracking (handled vs. referred to email)
- [x] Short greeting fast-path (skips embedding/search for "hei", "hello", etc.)
- [x] WebView/in-app browser detection with non-streaming fallback
- [x] Zod schema validation on all API routes

### Content Management
- [x] Web scraping with Firecrawl (discover pages + extract content)
- [x] Content ingestion pipeline (chunk, embed, store)
- [x] Manual content ingestion endpoint
- [x] Dashboard content page for tenants to view their documents
- [x] Content add/edit/remove from dashboard (grouped source view with edit/delete-by-source)

### Widget
- [x] Custom zero-dependency JavaScript widget (~15KB)
- [x] esbuild bundler with minification and tree shaking
- [x] Served at `/widget.js` with aggressive caching (1 day + 7 day stale)
- [x] Configurable: theme (light/dark/auto), position, greeting, placeholder, brand name
- [x] Automatic session management
- [x] CORS enabled for cross-origin embedding

### Analytics
- [x] Conversation logging with metadata (intent, handled status, session)
- [x] Dashboard analytics: daily volume, top search terms, unanswered queries, handled rate
- [x] Admin global analytics endpoint
- [x] PostgreSQL helper functions for efficient aggregation

### Authentication & Security
- [x] Supabase Auth for dashboard users (email/password)
- [x] Supabase Auth for admin, scrape, and ingest routes (super admin only)
- [x] Middleware-level auth checks
- [x] Domain validation on chat API (origin/referer vs. tenant allowlist)
- [x] Row-Level Security policies on database tables
- [x] Role-based access (admin / viewer per tenant)
- [x] Settings page, password reset page (UI)

### Database
- [x] Migration 001: tenant_prompts, tenant_user_access tables with RLS
- [x] Migration 002: conversations table with indexes and helper functions
- [x] documents table (created via Supabase, not in migrations)

### UI/UX
- [x] Responsive dashboard layout with sidebar
- [x] Error pages (404, 500) with user-friendly design
- [x] Settings page (placeholder for subscription info)
- [x] Integration page with embed code copy
- [x] Prompt editor with live preview

---

## MVP Backlog – Must-Have for Launch

### P0 – Critical (Launch Blockers)

#### Email System (Resend)
- [x] Set up Resend account and API integration
- [x] Password reset email flow (functional via Supabase SMTP)
- [x] Welcome email on tenant onboarding
- [x] Credit limit warning email (at 80% usage)
- [x] Credit limit reached email (at 100% usage)
- [x] Contact form submission notification to admin
- [x] Email templates in Norwegian with Preik branding

#### Credit / Usage System
- [x] Add `credit_limit` and `credits_used` columns to tenants table
- [x] Increment credit counter on each user message in chat API
- [x] Reset credits monthly (cron job or Supabase scheduled function)
- [x] Block chat responses when credits exhausted (show friendly fallback message)
- [x] Credit usage display in tenant dashboard
- [x] Credit usage display in admin panel per tenant
- [x] Trigger email notifications at 80% and 100% thresholds

#### Monitoring & Error Tracking
- [x] Remove excessive console.log statements from production code (especially /api/chat – currently ~75 console.logs)
- [x] Add structured logging (log level, timestamp, tenant context)
- [x] Add health check endpoint (`/api/health`)

#### Content Management Improvements
- [x] Improve document editing flow – handle re-chunking when content changes
- [x] Allow tenants to add custom text content (not just scraped pages)
- [x] Allow tenants to remove specific documents/URLs from their knowledge base
- [x] Show chunk count and content preview per document
- [x] Prevent duplicate content ingestion for same URL

#### Security Hardening
- [x] Restrict CORS – tiered CORS: wildcard for widget/health, reflected origin for chat/contact, no CORS for internal routes
- [x] Add request size limits on chat API input (32KB body, 4K/message, 50 messages max)
- [x] Sanitize AI responses before rendering in dashboard (XSS prevention) — verified: dashboard uses React text rendering (auto-escaped), widget escapes HTML before markdown transforms
- [x] Add rate limiting to contact form (IP-based, 5/hour per IP)
- [x] Add email format validation to contact form (Zod schema with `.email()` + length limits)
- [x] Move rate limiter from in-memory to persistent store (Upstash Redis) — resets on deploy, doesn't work across instances
- [x] Create `.env.example` with all required variables (no real values)
- [ ] Rotate all credentials (keys were visible during development)
- [x] Replace admin Basic Auth with Supabase Auth — use the existing `/login` screen, detect super admin on login and redirect to `/admin`. Remove `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars and Basic Auth middleware for admin routes

#### Documentation
- [x] Write setup guide (how to get the project running locally)
- [x] Document all environment variables and where to get them
- [x] Write deployment guide for Vercel
- [x] Document tenant onboarding process (step-by-step for admin)
- [x] Document the scraping + ingestion workflow

### P1 – Important (Should have for solid launch)

#### Onboarding Flow (Lead Qualification Wizard)
- [ ] Create OnboardingWizard component with adaptive 5–6 step flow
- [ ] Create /kom-i-gang page and route
- [ ] Create /api/onboarding endpoint with Zod validation and rate limiting
- [ ] Add onboarding_submissions DB table (migration)
- [ ] Add sendOnboardingNotification email template (enriched admin notification)
- [ ] Update hero and pricing CTAs to link to /kom-i-gang
- [ ] Write Vitest tests for /api/onboarding route

#### Testing
- [~] Set up Vitest with test config (done: 22 test files, 153 tests)
- [~] Unit tests for rate limiting logic (done)
- [~] Unit tests for credit tracking logic (done)
- [ ] Integration tests for chat API (mock LLM responses)
- [ ] Integration tests for auth middleware
- [ ] Integration tests for content CRUD operations
- [ ] Test credit limit enforcement (80%, 100% thresholds)
- [~] Test domain validation logic (done in tenants.test.ts)

#### CI/CD Pipeline
- [ ] GitHub Actions workflow: lint on PR
- [ ] GitHub Actions workflow: run tests on PR
- [ ] GitHub Actions workflow: type-check on PR
- [ ] Vercel preview deployments on PR (automatic with Vercel GitHub integration)
- [ ] Vercel production deployment on merge to main

#### Rate Limiting Improvements
- [x] Move from in-memory to persistent rate limiting (Upstash Redis recommended for Vercel)
- [ ] Rate limit per tenant (not just per IP) to prevent abuse across sessions
- [ ] Add rate limit headers to responses (X-RateLimit-Remaining, X-RateLimit-Reset)

#### Database
- [ ] Add documents table schema to migrations (currently only created via API/Supabase UI)
- [ ] Add credits tracking table or columns to tenants table in migrations
- [ ] Add migration for email notification logs
- [ ] Set up Supabase automated daily backups
- [ ] Document database restore procedure

#### Widget Improvements
- [ ] Add widget version tracking (version header in response)
- [ ] Show fallback message when credits exhausted
- [ ] Add "Powered by Preik" link in widget footer
- [ ] Widget loading state / skeleton

#### SEO & Marketing Site
- [~] Add Open Graph meta tags (title, description, image) — partial: landing page has OG, blog posts missing
- [ ] Add Twitter Card meta tags
- [x] Create sitemap.xml
- [x] Create robots.txt
- [x] Add JSON-LD structured data for organization

---

## Post-MVP Backlog – After Launch

### P2 – Security & Reliability

#### Security Fixes (from Feb 2026 audit)
- [ ] Remove test domains from production whitelist (`shopbot-test.vercel.app`, `shopbot-core.vercel.app` in `tenants.ts:252-253`) or gate behind `NODE_ENV`
- [ ] Add CSRF token validation to all state-changing POST/PUT/DELETE endpoints
- [ ] Migrate CSP from `unsafe-inline` to nonce-based policy (`middleware.ts:30-42`)
- [ ] Use timing-safe comparison for `CRON_SECRET` + fail if env var is undefined (`cron/reset-credits/route.ts:11`)
- [ ] Fix SSRF mitigation: handle DNS rebinding, IPv6 loopback, `127.1` shortcuts (`url-safety.ts:37-46`)
- [ ] Add Zod validation for blog metadata fields (`meta_title`, `meta_description`, `author_name`) in `admin/blog/route.ts:58-95`
- [ ] Add max length constraint to blog slug validation (`admin/blog/route.ts:74-79`)
- [ ] Sanitize EXIF/metadata on uploaded images (`admin/blog/upload/route.ts`)
- [ ] Add widget session expiry (localStorage `preik_session_id` currently lives forever)
- [ ] Add server-side session validation with TTL for widget sessions
- [ ] Add `FOR UPDATE` row lock or `SERIALIZABLE` isolation to `increment_credits` to prevent race condition under extreme load

#### Error Tracking & Monitoring
- [ ] Integrate Sentry for error tracking (frontend + API routes)
- [ ] Set up Sentry alerts for critical errors (chat failures, auth failures)
- [ ] Set up uptime monitoring (e.g., BetterUptime, UptimeRobot, or Vercel's built-in)
- [ ] Add Vercel Analytics for frontend performance (LCP, FID, CLS)
- [ ] Add database query monitoring / slow query detection

#### GDPR & Compliance
- [ ] Add GDPR data export endpoint (Right to Access — export all tenant/user data)
- [ ] Add GDPR data deletion endpoint (Right to Erasure — cascading delete from tenants table)
- [ ] Add cookie consent banner (localStorage used without disclosure)
- [ ] Add DPA (Data Processing Agreement) template for B2B customers

### P3 – Code Quality & Developer Experience

#### Code Duplication Reduction
- [ ] Create `withAdminAuth(handler)` / `withSuperAdmin(handler)` wrapper to eliminate auth boilerplate in 15+ admin routes
- [ ] Create `validateRequest(req, { maxBytes })` utility to replace duplicated content-type + body size + JSON parse pattern in 8+ routes
- [ ] Import `getClientIp()` from `ratelimit.ts` everywhere instead of duplicating IP extraction in 4+ routes
- [ ] Create `corsHeaders(origin, method)` builder to replace duplicated CORS header logic in chat, contact, widget-config routes
- [ ] Standardize API response format to `{ success, error?, data? }` across all 32 routes

#### Error Handling Improvements
- [ ] Add type guard for tenant data in `email.ts:91-94` before accessing properties after DB fetch
- [ ] Add Zod validation for all RPC response shapes in `credits.ts` and `chat/route.ts` before unpacking `.data`
- [ ] Indicate to user when vector search fails in chat API (currently silently continues without context, `chat/route.ts:460`)
- [ ] Fix inconsistent HTTP status codes: standardize 401 (not authenticated) vs 403 (authenticated but forbidden) across routes
- [ ] Add proper error type narrowing in catch blocks (replace `error as Error` casts with `instanceof` checks)

#### Performance Optimizations
- [ ] Add in-memory TTL cache for `getTenantSystemPrompt()` — currently hits DB on every chat message (`tenants.ts:428-457`)
- [ ] Use `GROUP BY metadata->>source` in SQL instead of loading all documents and grouping in JS (`tenant/[tenantId]/content/route.ts:106-120`)
- [ ] Add embedding batch limit to content edit route to match ingest route pattern (100 at a time, `tenant/[tenantId]/content/route.ts:224-231`)
- [ ] Make vector search `match_count` configurable per tenant instead of hardcoded 12 (`chat/route.ts:453`)
- [ ] Add semantic query caching — cache embeddings by query hash with 1hr TTL in Redis to avoid re-embedding identical questions
- [ ] Add `ivfflat` pgvector index: `CREATE INDEX ... USING ivfflat (embedding vector_cosine_ops)` for O(log n) vs O(n) search

#### Database Schema Improvements
- [ ] Add composite index for conversation filtering: `(store_id, was_handled, detected_intent, created_at DESC)`
- [ ] Add index for documents: `(store_id, created_at DESC)` for paginated listing
- [ ] Add index for tenant_prompts: `(tenant_id, version DESC)` for version history queries
- [ ] Add `updated_at` column to `tenants`, `conversations`, and `documents` tables
- [ ] Enforce schema on `documents.metadata` JSONB (require `source`, `url`, `title` fields)
- [ ] Consider partitioning `conversations` table by date for tables > 10M rows

#### Hardcoded Values Cleanup
- [ ] Move all tenant configs from `tenants.ts:1-305` to database as primary source (keep hardcoded as fallback only)
- [ ] Move hardcoded email addresses (`hei@preik.ai`, `noreply@preik.ai`) in `email.ts:7-8` to env vars
- [ ] Move hardcoded dashboard URL in `email.ts:135` to env var
- [ ] Extract magic numbers to named constants: 20-char fast-path threshold, 12 vector results, 1000-entry memory cleanup trigger
- [ ] Make credit warning thresholds (80%, 100%) configurable via env vars or tenant config

#### Developer Experience
- [ ] Create database seed script for local development (demo tenant, sample conversations, test user)
- [ ] Create env validation script (`scripts/validate-env.js`) that checks all required vars before `npm run dev`
- [ ] Rewrite README from generic boilerplate to project-specific setup guide
- [ ] Add rate limiting circuit breaker pattern (fail-closed when Redis is down instead of falling back to per-instance in-memory)

### P4 – Test Coverage Expansion

#### Critical Path Tests (Tier 1)
- [ ] Tests for `POST /api/chat` — streaming, non-streaming, rate limiting, credit checks, model fallback (Gemini → GPT-4o), vector search, conversation logging, request validation (706 lines, zero tests)
- [ ] Tests for `src/middleware.ts` — auth redirects, CORS tiers, security headers, CSP, OPTIONS preflight (140 lines, zero tests)
- [ ] Tests for admin stats routes (`/api/admin/stats`, `/api/tenant/[tenantId]/stats`) — query aggregation, filters, parallel execution

#### Admin Route Tests (Tier 2)
- [ ] Tests for `POST /api/admin/tenants` — tenant creation, ID validation, duplicate detection
- [ ] Tests for admin user management (`/api/admin/users`, `/api/admin/users/[userId]/access`)
- [ ] Tests for admin blog CRUD (`/api/admin/blog`, `/api/admin/blog/[postId]`, `/api/admin/blog/upload`)
- [ ] Tests for admin conversation/audit/credit-log browsers
- [ ] Tests for admin export endpoint (`/api/admin/export/[tenantId]`)
- [ ] Tests for admin settings endpoints (`/api/admin/settings`)
- [ ] Tests for admin manual-ingest endpoint

#### Tenant & Auth Route Tests (Tier 3)
- [ ] Tests for tenant content CRUD (`/api/tenant/[tenantId]/content`)
- [ ] Tests for tenant prompt endpoints (`/api/tenant/[tenantId]/prompt`)
- [ ] Tests for tenant widget-config and credits endpoints
- [ ] Tests for auth routes (`/api/auth/post-login`, `/api/auth/signout`)
- [ ] Tests for scrape endpoints (`/api/scrape/discover`, `/api/scrape/execute`)
- [ ] Tests for blog public endpoints (`/api/blog`, `/api/blog/[slug]`)
- [ ] Tests for widget serving endpoint (`/api/widget`)

#### Integration & E2E Tests (Tier 4)
- [ ] Integration tests: chat → conversation logging → credit increment flow
- [ ] Integration tests: ingest → chunking → embedding → vector search flow
- [ ] Integration tests: multi-tenant isolation (one tenant can't access another's data)
- [ ] E2E tests with Playwright for critical user flows (login → dashboard → chat)
- [ ] Update vitest.config.ts to include API routes and middleware in coverage reports
- [ ] Add code coverage reporting to CI (Codecov or similar)

### P5 – Features (Revenue & Growth)

#### Payment Integration (Stripe)
- [ ] Stripe integration for subscription billing
- [ ] `stripe_customers` and `stripe_webhook_events` DB tables
- [ ] Plan selection UI in dashboard settings
- [ ] Automatic invoicing based on plan
- [ ] Plan upgrade/downgrade flow
- [ ] Usage overage handling (auto-upgrade or block)
- [ ] Billing portal for self-service invoice management

#### Self-Service Signup & Onboarding
- [ ] Public signup endpoint (`/api/auth/signup`) — creates auth user + tenant + access row + welcome email
- [ ] Onboarding wizard for new tenants (content ingestion → prompt customization → widget installation)
- [ ] Tenant creation from dashboard (not just admin panel)
- [ ] Tenant templates for common use cases (e-commerce, support, docs)

#### API Key Management
- [ ] `tenant_api_keys` DB table (id, tenant_id, key_hash, name, last_used_at, expires_at)
- [ ] API key generation/revocation UI in tenant dashboard
- [ ] API key authentication on chat endpoint (`Authorization: Bearer <key>`)
- [ ] Per-key access control (read-only, write, etc.)
- [ ] Key usage audit trail

#### Feedback System
- [ ] `message_feedback` DB table (conversation_id, message_id, feedback thumbs up/down, reason)
- [ ] Thumbs up/down buttons on AI responses in widget
- [ ] `POST /api/feedback` endpoint
- [ ] Feedback analytics in tenant dashboard (response quality over time)
- [ ] Use feedback data to identify weak areas in knowledge base

#### Webhook Support
- [ ] `webhooks` and `webhook_events` DB tables
- [ ] Webhook management UI in tenant dashboard (create, test, disable)
- [ ] Supported events: `conversation.created`, `message.sent`, `message.feedback`, `credit.warning`, `credit.limit_reached`
- [ ] HMAC signature on webhook payloads for security
- [ ] Retry logic with exponential backoff for failed deliveries

#### Conversation Export
- [ ] Export conversations as CSV/JSON from tenant dashboard
- [ ] Export conversations as CSV from admin panel
- [ ] Date range and filter support for exports
- [ ] `export_jobs` DB table for async large exports
- [ ] GDPR-compliant full data export per tenant

#### Widget Analytics
- [ ] `widget_analytics` DB table (tenant_id, event_type, session_id, user_agent, referrer)
- [ ] Track: impression, open, message_sent, close events
- [ ] Widget analytics dashboard (open rate, engagement rate, geographic distribution)
- [ ] ROI metrics for customers (conversations resolved vs. cost)

#### Custom Training Data Upload
- [ ] `training_data_sources` DB table (tenant_id, source_type, file_path, status, document_count)
- [ ] PDF upload + text extraction + chunking + embedding
- [ ] CSV upload + row-based content ingestion
- [ ] File type validation (MIME + magic bytes) and virus scanning
- [ ] Upload progress tracking in dashboard

#### Advanced Analytics
- [ ] Google Analytics or Mixpanel integration
- [ ] Conversation funnel tracking (widget open → message sent → resolved)
- [ ] Customer satisfaction scoring
- [ ] Comparative analytics (this month vs. last month)

#### Multi-Language Support
- [ ] Norwegian/English toggle on public site
- [ ] i18n framework for dashboard UI
- [ ] Per-tenant language configuration in dashboard
- [ ] Auto-detect user language in widget
- [ ] Multi-language response support (detect user lang, respond in same lang)

#### Advanced AI Features
- [ ] Conversation memory across sessions (returning visitors)
- [ ] Product recommendation engine
- [ ] Lead capture (collect email/phone from widget conversations)
- [ ] Handoff to human support (email or live chat)
- [ ] Suggested questions / quick replies in widget
- [ ] AI-generated content summaries for dashboard
- [ ] A/B testing for prompts (split traffic, measure quality)
- [ ] Prompt injection mitigation (separate system prompt from user context more strictly)

#### Content Management v2
- [ ] Bulk content upload (CSV/JSON)
- [ ] Content scheduling (publish/unpublish dates)
- [ ] Content quality scoring (how often it's used in responses)
- [ ] Automatic content refresh (re-scrape on schedule)

#### Platform Growth
- [ ] White-label option (remove Preik branding)
- [ ] Multiple chatbot personalities per tenant
- [ ] Custom domain support for widget serving

#### Widget UX Improvements
- [ ] Add widget version tracking (version header in response)
- [ ] Add "Powered by Preik" link in widget footer
- [ ] Widget loading state / skeleton
- [ ] Dark mode toggle button in widget (persist preference)
- [ ] Mobile gesture support (swipe to close)
- [ ] Offline indicator + message queue for network failures
- [ ] Previous conversation badge (show returning user their history)

#### Widget Accessibility
- [ ] Add `role="log"` and `aria-live="polite"` to message container for screen readers
- [ ] Add `role="article"` and `aria-label` to individual message bubbles
- [ ] Add keyboard focus indicators on links within messages
- [ ] Test and fix color contrast ratios (WCAG AA compliance)
- [ ] Add alt text for bot avatar icon

#### SEO & Marketing
- [ ] Add Open Graph and Twitter Card meta tags to blog posts
- [ ] Add canonical URLs to all blog posts
- [ ] Add BlogPosting structured data (JSON-LD) to blog posts
- [ ] Create English blog track (translate top Norwegian posts + new English content)
- [ ] Create comparison landing pages ("Preik vs. ChatGPT for business", "Preik vs. Intercom")
- [ ] Create use-case landing pages (e-commerce chatbot, support automation, docs assistant)
- [ ] Improve homepage SEO (H1 with target keyword, above-fold value prop, social proof)

#### Infrastructure
- [ ] Redis caching layer (Upstash) for embeddings and frequent queries
- [ ] CDN for widget delivery
- [ ] Database connection pooling (`pool_mode: 'transaction'` in Supabase)
- [ ] Date-based partitioning for conversations table (when > 10M rows)
- [ ] Disaster recovery plan and testing

---

## Bugs

| Issue | Location | Notes |
|-------|----------|-------|
| Daglig samtalevolum chart not displaying correctly | Analytics dashboard (`TenantAnalyticsDashboard.tsx`) | Needs investigation |
| Password change fields are too wide | Settings page (`innstillinger/page.tsx`, `AccountSettings.tsx`) | Reduce input width for a cleaner layout |

---

## Known Issues & Tech Debt

| Issue | Severity | Location | Notes |
|-------|----------|----------|-------|
| ~~75 console.log statements in chat route~~ | ~~Medium~~ | ~~`/src/app/api/chat/route.ts`~~ | Replaced with structured JSON logger (`src/lib/logger.ts`) |
| ~~CORS allows all origins (`*`)~~ | ~~High~~ | ~~All API routes~~ | Tiered CORS: wildcard for widget/health, reflected origin for chat/contact, no CORS for internal |
| ~~Rate limiting is in-memory only~~ | ~~Medium~~ | ~~`/src/lib/ratelimit.ts`~~ | Migrated to Upstash Redis (with in-memory fallback for dev) |
| Documents table not in migrations | Low | Supabase | Add to version-controlled migrations |
| Tenant configs partially hardcoded | Medium | `/src/lib/tenants.ts` | 4 tenants hardcoded with DB fallback — should be fully DB-driven |
| baatpleiebutikken allowed_domains empty in DB | Low | Supabase `tenants` table | Hardcoded config covers it, but DB should match |
| ~~No .env.example file~~ | ~~Medium~~ | ~~Project root~~ | Created `.env.example` with all required variables |
| ~~Admin password stored as plaintext~~ | ~~High~~ | ~~`.env.local` / Basic Auth~~ | Migrated to Supabase Auth with super admin email check |
| Widget has no versioning | Low | `/api/widget/route.ts` | Breaking changes affect all embedded widgets instantly |
| No database backup configuration | High | Supabase | Data loss risk |
| ~~Password reset flow likely non-functional~~ | ~~High~~ | ~~Auth pages~~ | Fixed: Supabase SMTP configured via Resend |
| `nul` file in git working directory | Low | Project root | Stray file, should be deleted/gitignored |
| Test domains in production whitelist | High | `tenants.ts:252-253` | `shopbot-test.vercel.app` + `shopbot-core.vercel.app` should be removed or gated |
| No CSRF protection on state-changing endpoints | High | All POST/PUT/DELETE routes | Relies solely on SameSite cookies |
| CSP uses `unsafe-inline` for scripts | Medium | `middleware.ts:30-42` | Should migrate to nonce-based CSP |
| CRON_SECRET undefined = silent bypass | Medium | `cron/reset-credits/route.ts:11` | Comparison becomes `Bearer undefined` if env var missing |
| Auth duplication across 15+ admin routes | Medium | `src/app/api/admin/*/route.ts` | Needs shared `withAdminAuth()` wrapper |
| Inconsistent API response formats | Medium | All 32 API routes | Mix of `{error}`, `{success}`, `{data}` shapes |
| 84% of API routes have zero tests | High | `src/app/api/` | Only 6 of 37 routes tested — chat API (core product) untested |
| No pgvector ivfflat index | High | Supabase documents table | Vector search does O(n) full scan instead of O(log n) |
| Prompt fetched from DB on every chat message | Medium | `tenants.ts:428-457` | No caching — unnecessary DB load |
| Widget session never expires | Low | `widget.ts` localStorage | `preik_session_id` lives forever with no server validation |

---

## Launch Checklist

Before going live with the first paying customer:

- [ ] All P0 items completed
- [ ] Credentials rotated (Supabase, OpenAI, Vertex AI, Firecrawl, admin password)
- [x] `.env.example` created and verified
- [ ] Sentry integrated and alerting
- [x] Structured logging implemented (JSON logger + health check)
- [ ] Uptime monitor active
- [ ] Email system functional (password reset, credit warnings)
- [ ] Credit system enforced (tracking + limits + notifications)
- [ ] Baatpleiebutikken tenant fully configured and tested
- [ ] Widget tested on baatpleiebutikken's actual website
- [ ] Content management tested (add, edit, remove documents)
- [ ] Dashboard analytics verified with real data
- [x] CORS locked down to tenant domains
- [ ] Rate limiting tested under load
- [ ] Database backup enabled
- [ ] Basic test suite passing in CI
- [ ] Production deployment on Vercel verified
- [ ] Onboarding documentation written (for admin use)
- [ ] Test domains removed from production whitelist
- [ ] pgvector index created for vector search performance
- [ ] CSRF protection added to state-changing endpoints
- [ ] Chat API has test coverage
- [ ] Stripe billing integration live
