# Records of Processing Activities (GDPR Art. 30)

**Organization:** Preik
**Contact:** hei@preik.ai
**Last updated:** 2026-03-12

---

## 1. Processing as Data Controller (preik.ai website)

| # | Activity | Purpose | Legal Basis | Categories of Data | Categories of Data Subjects | Retention | Recipients |
|---|----------|---------|-------------|--------------------|-----------------------------|-----------|------------|
| 1 | User accounts | Service delivery | Art. 6(1)(b) Contract | Email, hashed password | B2B customers | Until account deletion | Supabase (DB), Vercel (hosting) |
| 2 | Contact form | Business inquiries | Art. 6(1)(f) Legitimate interest | Name, email, company, message | Website visitors | 180 days (auto-delete) | Supabase (DB), Resend (email) |
| 3 | Marketing cookies | Measure ad effectiveness | Art. 6(1)(a) Consent | Cookie IDs, page views, conversions | Website visitors (consented) | 90 days | Google Ads |
| 4 | Audit logs | Security & compliance | Art. 6(1)(f) Legitimate interest | Admin email, action, timestamp | Employees/admins | 365 days (auto-delete) | Supabase (DB) |

## 2. Processing as Data Processor (chatbot service for tenants)

| # | Activity | Purpose | Legal Basis | Categories of Data | Categories of Data Subjects | Retention | Sub-processors |
|---|----------|---------|-------------|--------------------|-----------------------------|-----------|----------------|
| 1 | Chat message processing | AI-powered customer support | Determined by tenant (controller) | User messages, AI responses, anonymous session ID | Tenant's website visitors | 90 days (auto-delete) | OpenAI, Google Vertex AI, Supabase, Vercel |
| 2 | Rate limiting | Prevent abuse | Determined by tenant (controller) | Anonymized session ID, IP address | Tenant's website visitors | In-memory / minutes | Upstash |
| 3 | Content ingestion | Build knowledge base | Determined by tenant (controller) | URLs, page content (no personal data expected) | N/A | Until replaced or tenant deleted | Firecrawl, OpenAI (embeddings), Supabase |
| 4 | Credit tracking | Billing & usage metering | Art. 6(1)(b) Contract | Tenant ID, usage count, timestamp | B2B customers | 365 days (auto-delete) | Supabase |
| 5 | Email notifications | Service alerts | Art. 6(1)(b) Contract | Tenant contact email, credit status | B2B customers | Transient (not stored) | Resend |

## 3. Sub-processors

| Sub-processor | Purpose | Location | Transfer Mechanism | DPA in Place |
|---------------|---------|----------|-------------------|--------------|
| OpenAI | AI model (GPT-4o-mini) + embeddings | USA | EU-US DPF + SCCs | Yes |
| Google Cloud (Vertex AI) | Fallback AI model (Gemini) | EU | EU-based | Yes |
| Supabase | PostgreSQL database + Auth | EU (Frankfurt) | EU-based | Yes |
| Vercel | Hosting, serverless, edge middleware | Global | SCCs | Yes |
| Resend | Transactional email delivery | USA | SCCs | Yes |
| Upstash | Redis rate limiting | EU (Frankfurt) | EU-based | Yes |
| Firecrawl | Web scraping for content import | USA | SCCs | Yes |
| Google Ads | Conversion tracking (controller only) | USA/EU | EU-US DPF + SCCs | Yes |

## 4. Technical & Organizational Measures (Art. 32)

### Encryption
- TLS 1.2+ for all data in transit
- AES-256 encryption at rest (Supabase managed)
- Secrets stored in environment variables, never in source code

### Access Control
- Row-Level Security (RLS) on all database tables
- Role-based access: Super Admin, Admin, Tenant Admin, Tenant Viewer
- Service role key used server-side only, never exposed to clients

### Monitoring & Logging
- Structured JSON logging on all API endpoints
- Audit trail for all admin actions
- Rate limiting on all public and admin endpoints

### Data Minimization
- Chat sessions use anonymous IDs (not linked to identity)
- Automatic data deletion: 90 days (chats), 180 days (contacts), 365 days (logs)
- pg_cron job runs daily at 03:00 UTC

### Security Headers
- Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options
- CORS tiered: wildcard (widget), reflected (chat), none (internal)

### Input Validation
- Zod schema validation on all API inputs
- SSRF protection on all URL inputs
- Content-Type and Content-Length validation
