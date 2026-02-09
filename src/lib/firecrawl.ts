import Firecrawl from "@mendable/firecrawl-js";
import { createLogger } from "@/lib/logger";

const log = createLogger("firecrawl");

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

if (!firecrawlApiKey) {
  log.warn("FIRECRAWL_API_KEY is not set — scraping features will not work");
}

export const firecrawl: Firecrawl | null = firecrawlApiKey
  ? new Firecrawl({ apiKey: firecrawlApiKey })
  : null;
