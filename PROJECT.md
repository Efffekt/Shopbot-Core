# Preik – AI som snakker ditt språk

## Overview

Preik is a multi-tenant AI chatbot SaaS platform built for small and medium businesses in the Nordics. Businesses get a branded, intelligent customer service assistant embedded on their website — trained on their own content, speaking their language.

**Core value proposition:** We give SMBs an AI assistant that knows their products, speaks Norwegian, and scales with their business.

## Business Model

**Credit-based monthly subscription**, manually invoiced during MVP phase.

### How Credits Work

Each **user message** sent to a chatbot costs **1 credit**. This is the simplest model for customers to understand and for us to track. Only end-user messages count — system messages, greetings, and error responses do not consume credits.

| Plan         | Credits/month | Target Customer              | Price |
|--------------|---------------|------------------------------|-------|
| Starter      | 1,000         | Small shops, low traffic     | TBD   |
| Growth       | 5,000         | Growing businesses           | TBD   |
| Business     | 15,000        | Established, multi-page sites| TBD   |
| Custom       | Negotiated    | High-volume / enterprise     | TBD   |

> **Cost basis:** Gemini 2.0 Flash is very cheap per token. At ~1,500 tokens per conversation turn (input + output), 1,000 credits costs roughly $0.01–0.05 in API fees. The main costs are embedding generation (OpenAI), Supabase hosting, and Vercel compute. Pricing should account for infrastructure overhead + margin.

When a customer approaches their credit limit (80% usage), they receive an automatic email notification. At 100%, the chatbot shows a friendly fallback message directing visitors to contact the business directly.

### Customer Onboarding Flow (MVP)

1. Customer signs up / is invoiced manually
2. We create their tenant profile and Supabase auth account
3. We perform the initial website scrape and content ingestion (scraping is costly, we control this)
4. Customer receives login credentials via email, changes their password
5. Customer can manage their content (add/edit/remove documents), customize their chatbot prompt, and view analytics from their dashboard
6. Customer gets an embed snippet (`<script>`) to drop into their website

## Tech Stack

| Layer         | Technology                                      |
|---------------|------------------------------------------------|
| Frontend      | Next.js 16 (App Router), React 19, TypeScript  |
| Styling       | Tailwind CSS 4                                  |
| Backend       | Next.js API Routes (serverless on Vercel)       |
| Database      | Supabase (PostgreSQL + Auth + RLS)              |
| Primary LLM   | Google Vertex AI – Gemini 2.0 Flash            |
| Fallback LLM  | OpenAI (via Vercel AI SDK)                     |
| Embeddings    | OpenAI text-embedding                           |
| Scraping      | Firecrawl                                       |
| Email         | Resend (planned)                                |
| Monitoring    | Sentry (planned)                                |
| Hosting       | Vercel                                          |
| Widget        | Custom zero-dependency JS (~15KB), esbuild      |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    VERCEL (Hosting)                  │
│                                                     │
│  ┌──────────────┐  ┌────────────────────────────┐   │
│  │ Public Site   │  │ Dashboard (/dashboard)     │   │
│  │ - Landing     │  │ - Content management       │   │
│  │ - Docs        │  │ - Prompt editor            │   │
│  │ - Login       │  │ - Analytics                │   │
│  │ - Contact     │  │ - Integration / embed code │   │
│  └──────────────┘  │ - Settings                  │   │
│                     └────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐    │
│  │ API Routes                                    │    │
│  │ - /api/chat         (streaming AI responses)  │    │
│  │ - /api/widget       (serve embed JS)          │    │
│  │ - /api/tenant/*     (CRUD, prompts, stats)    │    │
│  │ - /api/admin/*      (global management)       │    │
│  │ - /api/scrape/*     (content discovery)       │    │
│  │ - /api/ingest       (content ingestion)       │    │
│  │ - /api/contact      (contact form)            │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
          │                        │
          ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│   Supabase       │    │   External APIs  │
│ - PostgreSQL     │    │ - Vertex AI      │
│ - Auth           │    │ - OpenAI         │
│ - RLS policies   │    │ - Firecrawl      │
│ - Edge Functions │    │ - Resend (soon)  │
└──────────────────┘    └──────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│   Embeddable Widget (widget.js)      │
│ - Loaded on customer websites        │
│ - Communicates with /api/chat        │
│ - Streaming + fallback support       │
│ - Configurable theme/position/lang   │
└──────────────────────────────────────┘
```

## Multi-Tenant Model

Each customer (tenant) gets:
- Isolated content store (documents + embeddings)
- Custom system prompt with domain-specific instructions
- Allowed domains list (widget only works on their sites)
- Per-tenant analytics and conversation history
- Role-based dashboard access (admin / viewer)
- Credit usage tracking and limits

## Current Tenants

| Tenant ID           | Status       | Description                          |
|---------------------|-------------|--------------------------------------|
| baatpleiebutikken   | Real client | Boat maintenance shop – first customer |
| preik-demo          | Demo        | Internal demo tenant                 |
| docs-site           | Demo        | Documentation site demo              |
| rk-designsystem-docs | Demo      | Design system docs demo              |

## Key Directories

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # Backend API routes
│   ├── dashboard/[tenantId]/ # Authenticated tenant dashboards
│   ├── admin/              # Admin panel
│   └── (public pages)     # Landing, login, docs, legal
├── components/             # Reusable React components
└── lib/                    # Business logic & utilities
    ├── widget/             # Embeddable chat widget source
    ├── supabase/           # Supabase client setup
    ├── tenants.ts          # Tenant configurations
    └── ratelimit.ts        # Rate limiting
supabase/
└── migrations/             # Database schema migrations
scripts/
└── build-widget.mjs        # Widget bundler (esbuild)
```

## Security Model

- **Admin routes**: Basic Auth (username/password)
- **Dashboard**: Supabase Auth (email/password) with RLS
- **Chat API**: Domain validation (origin/referer checked against tenant allowlist)
- **Rate limiting**: Per-session/IP limits (in-memory, single instance)
- **Data isolation**: Row-Level Security policies in Supabase
