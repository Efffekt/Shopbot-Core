# Scraping & Content Ingestion Workflow

## Overview

The platform supports three ingestion methods:

1. **Selective scrape** — Discover pages, choose which to scrape (recommended)
2. **Full crawl** — Crawl an entire website in one go
3. **Manual input** — Paste text content directly

All methods follow the same pipeline: **Text > Chunk > Embed > Store**.

## Pipeline Details

### Chunking

Text is split into chunks of ~1000 characters at paragraph boundaries. Long paragraphs are split at word boundaries. The chunking logic is in `src/lib/chunking.ts`.

### Embedding

Each chunk is embedded using OpenAI's `text-embedding-3-small` model (1536 dimensions). Embeddings are generated in batches of up to 100 chunks.

### Storage

Chunks are stored in the `documents` table with:
- `content` — The text chunk
- `embedding` — Vector embedding (1536-dim)
- `store_id` — The tenant ID
- `metadata` — JSON with `source` (URL), `title`, `manual` flag
- `checksum` — Content hash for change detection (scrape only)

## Method 1: Selective Scrape

### Step 1: Discover Pages

```
POST /api/scrape/discover
Authorization: Basic <admin credentials>

{
  "url": "https://example.com",
  "storeId": "my-tenant"
}
```

Returns a list of discovered URLs from the website's sitemap and internal links.

### Step 2: Execute Scrape

```
POST /api/scrape/execute
Authorization: Basic <admin credentials>

{
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "storeId": "my-tenant"
}
```

This endpoint returns a Server-Sent Events (SSE) stream with progress updates. It:
- Scrapes each URL with Firecrawl (waits for JS rendering)
- Computes a checksum to detect content changes
- Skips URLs whose content hasn't changed since last scrape
- Deletes old chunks and replaces with new ones for updated URLs
- Processes URLs in batches of 5

### Re-scraping

Run the same execute command again. The checksum comparison ensures only changed pages are re-processed — unchanged pages are skipped.

## Method 2: Full Crawl

```
POST /api/ingest
Authorization: Basic <admin credentials>

{
  "url": "https://example.com",
  "storeId": "my-tenant"
}
```

This deletes ALL existing documents for the tenant and re-crawls the entire site (up to 500 pages). Use with caution — it replaces everything.

## Method 3: Manual Input

### Via Dashboard

1. Go to Dashboard > **Innhold** > **Legg til innhold**
2. Enter title, optional source URL, and paste the content
3. The system chunks, embeds, and stores automatically

### Via API

```
POST /api/tenant/{tenantId}/content
Authorization: Supabase Auth (admin role)

{
  "text": "Your content here...",
  "title": "Product Guide",
  "url": "https://example.com/guide"
}
```

If a URL is provided and content already exists for that URL, the API returns `409 Conflict` with a message to use the edit function instead.

### Editing Content

```
PATCH /api/tenant/{tenantId}/content
Authorization: Supabase Auth (admin role)

{
  "source": "https://example.com/guide",
  "text": "Updated content...",
  "title": "Updated Product Guide"
}
```

This deletes old chunks for the source, re-chunks, re-embeds, and inserts new chunks.

### Deleting Content

Delete all chunks for a source:

```
DELETE /api/tenant/{tenantId}/content?source=https://example.com/guide
```

Or delete a single chunk by ID (legacy):

```
DELETE /api/tenant/{tenantId}/content?id=<uuid>
```

## How Search Works (RAG)

When a user sends a chat message:

1. The message is embedded using the same `text-embedding-3-small` model
2. A vector similarity search finds the top-k most relevant chunks from the tenant's documents
3. These chunks are injected into the LLM prompt as context
4. The LLM generates a response grounded in the retrieved content

## Firecrawl Configuration

The scraper uses Firecrawl with SPA/React support:
- `waitFor: 5000` — Waits 5 seconds for JS rendering
- `timeout: 60000` — 60-second max timeout
- Extra 3-second wait action for slow SPAs
- Output format: Markdown
