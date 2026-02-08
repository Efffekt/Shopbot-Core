import Firecrawl from "@mendable/firecrawl-js";

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

if (!firecrawlApiKey) {
  console.warn("FIRECRAWL_API_KEY is not set — scraping features will not work");
}

export const firecrawl = new Firecrawl({ apiKey: firecrawlApiKey || "" });
