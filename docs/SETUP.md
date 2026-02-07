# Local Development Setup

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- A Supabase project (free tier works)
- API keys for: OpenAI, Google Cloud (Vertex AI), Firecrawl, Resend

## 1. Clone and Install

```bash
git clone https://github.com/Efffekt/Shopbot-Core.git
cd Shopbot-Core
npm install
```

## 2. Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

See [ENVIRONMENT.md](./ENVIRONMENT.md) for details on each variable.

## 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy your project URL, anon key, and service role key
3. Run the database migrations in order:

```bash
# In the Supabase SQL Editor, run each file:
supabase/migrations/001_tenant_access_and_prompts.sql
supabase/migrations/002_conversations.sql
supabase/migrations/003_credits.sql
supabase/migrations/004_email_system.sql
```

Alternatively, if using the Supabase CLI:

```bash
npx supabase db push
```

4. The `documents` table is created via the API/Supabase UI (not yet in migrations). Create it manually:

```sql
create table documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(1536),
  store_id text not null,
  metadata jsonb default '{}',
  checksum text,
  created_at timestamptz default now()
);

create index on documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on documents (store_id);
```

## 4. Run Development Server

```bash
npm run dev
```

The app starts at `http://localhost:3000`.

## 5. Build and Test

```bash
npm run build    # builds widget + Next.js app
npm run start    # runs production build locally
npm run lint     # eslint
```

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
    api/            # API endpoints
    dashboard/      # Tenant dashboard (Supabase Auth)
    admin/          # Admin panel (Basic Auth)
  components/       # React components
  lib/              # Shared utilities (supabase, email, credits, etc.)
docs/               # Documentation (you are here)
supabase/
  migrations/       # Database migration SQL files
scripts/            # Build scripts (widget bundler)
```
