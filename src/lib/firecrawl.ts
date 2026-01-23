import Firecrawl from "@mendable/firecrawl-js";

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY!;

export const firecrawl = new Firecrawl({ apiKey: firecrawlApiKey });
