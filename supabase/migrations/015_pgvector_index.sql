-- Add ivfflat index for vector similarity search on documents table.
-- Changes search from O(n) full scan to O(log n) approximate nearest neighbor.
-- Uses cosine distance operator (vector_cosine_ops) to match match_site_content function.
-- lists = 100 is suitable for tables up to ~1M rows; rebuild with more lists if table grows significantly.

CREATE INDEX IF NOT EXISTS idx_documents_embedding_cosine
  ON documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
