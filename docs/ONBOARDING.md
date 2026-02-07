# Tenant Onboarding Guide

Step-by-step process for setting up a new tenant (customer) on the platform.

## 1. Create the Tenant

In the admin panel (`/admin`), create a new tenant:

**API call:**
```
POST /api/admin/tenants
Authorization: Basic <admin credentials>
Content-Type: application/json

{
  "id": "my-company",
  "name": "My Company AS",
  "allowed_domains": ["mycompany.no", "www.mycompany.no"],
  "language": "no",
  "persona": "Helpful customer service assistant for My Company",
  "contact_email": "contact@mycompany.no"
}
```

Notes:
- `id` must be lowercase alphanumeric with hyphens (e.g., `my-company`)
- `allowed_domains` controls which websites can embed the widget
- `contact_email` receives credit warnings and the welcome email
- A welcome email is automatically sent if `contact_email` is provided

## 2. Create a Dashboard User

1. The tenant admin registers at `/login` (Supabase Auth signup)
2. Grant them access by inserting into `tenant_user_access`:

```sql
INSERT INTO tenant_user_access (user_id, tenant_id, role)
VALUES ('<supabase-user-id>', 'my-company', 'admin');
```

The user can now access the dashboard at `/dashboard/my-company`.

## 3. Add Content to Knowledge Base

There are three ways to populate the tenant's knowledge base:

### Option A: Web Scraping (recommended for existing websites)

1. Go to the admin panel > tenant's scrape section
2. Or use the API:

```
POST /api/scrape/discover
{ "url": "https://mycompany.no", "storeId": "my-company" }
```

This discovers all pages. Then execute the scrape:

```
POST /api/scrape/execute
{ "urls": ["https://mycompany.no/page1", ...], "storeId": "my-company" }
```

### Option B: Manual Content (from dashboard)

1. Log into the dashboard as the tenant admin
2. Go to **Innhold** (Content)
3. Click **Legg til innhold** (Add content)
4. Paste text, optionally add a title and source URL

### Option C: Full Site Crawl (admin API)

```
POST /api/ingest
{ "url": "https://mycompany.no", "storeId": "my-company" }
```

This crawls the entire site (up to 500 pages), chunks, embeds, and stores everything.

## 4. Configure the System Prompt

1. In the dashboard, go to **Prompt**
2. Write a system prompt that defines the chatbot's personality, rules, and formatting
3. The prompt is stored in `tenant_prompts` table and takes priority over hardcoded defaults

## 5. Set Credit Limits

Update the tenant's credit limit in the admin panel or via API:

```
PATCH /api/admin/tenants/my-company
{ "credit_limit": 1000 }
```

Credits reset monthly via the cron job. Each chat message uses 1 credit.

## 6. Embed the Widget

The tenant copies the embed code from **Integrasjon** (Integration) page in the dashboard:

```html
<script
  src="https://preik.ai/api/widget?id=my-company"
  defer
></script>
```

Configuration options (via `data-*` attributes):
- `data-theme="light|dark|auto"` — Widget color theme
- `data-position="right|left"` — Widget position on page
- `data-greeting="Hei! Hvordan kan jeg hjelpe?"` — Initial greeting
- `data-brand="My Company"` — Brand name shown in header

## 7. Verify

1. Visit the tenant's website and check the widget appears
2. Send a test message and verify it gets relevant answers
3. Check the dashboard analytics to confirm conversations are logged
4. Verify credit usage is incrementing
