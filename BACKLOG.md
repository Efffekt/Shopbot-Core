# Preik – Backlog & Production Readiness

> Last updated: 2026-02-06

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
- [x] Admin panel with basic auth protection

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
- [x] Basic Auth for admin, scrape, and ingest routes
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

#### Documentation
- [x] Write setup guide (how to get the project running locally)
- [x] Document all environment variables and where to get them
- [x] Write deployment guide for Vercel
- [x] Document tenant onboarding process (step-by-step for admin)
- [x] Document the scraping + ingestion workflow

### P1 – Important (Should have for solid launch)

#### Testing
- [ ] Set up Vitest (or Jest) with test config
- [ ] Unit tests for rate limiting logic
- [ ] Unit tests for credit tracking logic
- [ ] Integration tests for chat API (mock LLM responses)
- [ ] Integration tests for auth middleware
- [ ] Integration tests for content CRUD operations
- [ ] Test credit limit enforcement (80%, 100% thresholds)
- [ ] Test domain validation logic

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
- [ ] Add Open Graph meta tags (title, description, image)
- [ ] Add Twitter Card meta tags
- [ ] Create sitemap.xml
- [ ] Create robots.txt
- [ ] Add JSON-LD structured data for organization

---

## Post-MVP Backlog – After Launch

### P2 – Nice to Have (Next iteration)

#### Payment Integration
- [ ] Stripe integration for subscription billing
- [ ] Plan selection UI in dashboard settings
- [ ] Automatic invoicing based on plan
- [ ] Plan upgrade/downgrade flow
- [ ] Usage overage handling (auto-upgrade or block)

#### Advanced Analytics
- [ ] Google Analytics or Mixpanel integration
- [ ] Conversation funnel tracking (widget open → message sent → resolved)
- [ ] Customer satisfaction scoring
- [ ] Export analytics data (CSV/PDF)
- [ ] Comparative analytics (this month vs. last month)

#### Multi-Language Support
- [ ] Norwegian/English toggle on public site
- [ ] i18n framework for dashboard UI
- [ ] Per-tenant language configuration in dashboard
- [ ] Auto-detect user language in widget

#### Advanced AI Features
- [ ] Conversation memory across sessions (returning visitors)
- [ ] Product recommendation engine
- [ ] Lead capture (collect email/phone from widget conversations)
- [ ] Handoff to human support (email or live chat)
- [ ] Suggested questions / quick replies in widget
- [ ] AI-generated content summaries for dashboard

#### Content Management v2
- [ ] Bulk content upload (CSV/JSON)
- [ ] Content scheduling (publish/unpublish dates)
- [ ] Content quality scoring (how often it's used in responses)
- [ ] Automatic content refresh (re-scrape on schedule)
- [ ] PDF/document upload and parsing

#### Platform Growth
- [ ] Self-service tenant signup (without admin involvement)
- [ ] Onboarding wizard for new tenants
- [ ] API key system for programmatic access
- [ ] Webhook notifications (new conversation, credit warning)
- [ ] White-label option (remove Preik branding)
- [ ] Multiple chatbot personalities per tenant

#### Monitoring
- [ ] Integrate Sentry for error tracking (frontend + API routes)
- [ ] Set up Sentry alerts for critical errors (chat failures, auth failures)
- [ ] Set up uptime monitoring (e.g., BetterUptime, UptimeRobot, or Vercel's built-in)

#### Infrastructure
- [ ] Redis caching layer (Upstash) for embeddings and frequent queries
- [ ] CDN for widget delivery
- [ ] Database connection pooling
- [ ] Horizontal scaling preparation
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
| Tenant configs partially hardcoded | Medium | `/src/lib/tenants.ts` | 4 tenants hardcoded with DB fallback |
| baatpleiebutikken allowed_domains empty in DB | Low | Supabase `tenants` table | Hardcoded config covers it, but DB should match |
| ~~No .env.example file~~ | ~~Medium~~ | ~~Project root~~ | Created `.env.example` with all required variables |
| Admin password stored as plaintext | High | `.env.local` / Basic Auth | Consider hashing or switching to Supabase Auth for admin |
| Widget has no versioning | Low | `/api/widget/route.ts` | Breaking changes affect all embedded widgets instantly |
| No database backup configuration | High | Supabase | Data loss risk |
| ~~Password reset flow likely non-functional~~ | ~~High~~ | ~~Auth pages~~ | Fixed: Supabase SMTP configured via Resend |
| `nul` file in git working directory | Low | Project root | Stray file, should be deleted/gitignored |

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
