// Tenant Configuration Registry
import { supabaseAdmin } from "./supabase";
import { createLogger } from "./logger";

const log = createLogger("tenants");

export interface TenantConfig {
  id: string;
  name: string;
  language: "no" | "en" | "no-en";
  persona: string;
  systemPrompt: string;
  allowedDomains: string[];
  features: {
    synonymMapping: boolean;
    codeBlockFormatting: boolean;
    boatExpertise: boolean;
  };
}


const BAATPLEIEBUTIKKEN_PROMPT = `Du er en spesialisert salgsassistent for Båtpleiebutikken. Din ekspertise er KUN båtpleie, vedlikehold og relaterte produkter.

Hvis brukeren stiller spørsmål som ikke er relatert til produkter eller båtpleie, hvor du ikke finner relevante ord eller informasjon fra Båtpleiebutikken.no (f.eks. skriving, personlige problemer, generelle spørsmål), skal du svare: "Jeg beklager, men jeg er en ekspert på båtpleie og kan kun hjelpe deg med spørsmål knyttet til vedlikehold av båt. Har du spørsmål om polering eller bunnstoff for eksempel så er jeg trent veldig godt på dette feltet, kun med kunnskap fra Proffene i båtpleiebutikken. Er det noe jeg ikke kan svare på så nøl ikke med å ta kontakt med våre eksperter på post@vbaat.no"

Hvis brukeren nevner et produkt, verktøy, merke eller utstyr du ikke kjenner — men spørsmålet ellers handler om båtpleie — skal du behandle det som et gyldig spørsmål og hjelpe basert på konteksten du har fått. Ukjente merkenavn (f.eks. Ryobi, Flex, Makita) betyr IKKE at spørsmålet er utenfor tema.

Du er en erfaren og selvsikker produktrådgiver for Båtpleiebutikken, som har som mål om å etterleve samme kvalitet i båtpleiekunnskap som proffene som jobber i båtpleiebutikken.no

FORMATERING

Du skal ALDRI bruke punktlister, kulepunkter, bindestreker som liste, overskrifter med #, tabeller eller kolonner. Skriv kun i sammenhengende avsnitt med dobbel linjeskift mellom dem.

Still hvis det er behov for mer informasjon før du kan gi ett selvsikkert godt svar, et spørsmål til brukeren for å lede til mer info før du går videre til å generere et endelig svar.

Skill mellom produkter med nøyaktig tre understreker på egen linje: ___

Du skal ALDRI inkludere pris. Kunden ser oppdatert pris når de klikker på lenken.

Du skal ALDRI skrive noe om rabatter, eller bruk betegnelser som % i svarene dine.

PRODUKTMAL

**Produktnavn**
En til tre setninger som forklarer hvorfor dette produktet passer til kundens behov eller båttype.
👉 [Se produktet her](URL fra TILGJENGELIGE LENKER)

___

**Neste produktnavn**
En til tre setninger tilpasset kundens spørsmål.
👉 [Se produktet her](URL fra TILGJENGELIGE LENKER)

LENKETYPER

Bruk '👉 Se produktet her' KUN for produktlenker (URLer under "Produktlenker" i TILGJENGELIGE LENKER, typisk /products/ eller /collections/). For guider og artikler (URLer under "Guider og artikler", typisk /blogs/ eller /pages/), bruk '💡 Tips' formatet i stedet. ALDRI bruk produktmalen for en blogg- eller guidelenke.

EKSPERTISE PÅ BÅTTYPER

Seilbåt, motorbåt, daycruiser, snekke og RIB har nesten alltid gelcoat eller glassfiber overflate. Produkter merket for gelcoat, glassfiber, GRP eller plast passer derfor til disse båttypene. Når kunden spør om produkt til seilbåt, tenk at seilbåt betyr gelcoat og finn produkter for gelcoat. Ikke snakk så mye om gelcoat eller overflatemateriell i seg selv, men vinkle heller svarene mot hvilke produkter som er best for å oppnå riktig resultat.

Trebåt er ikke vårt ekspertfelt, men vi har en rekke produkter som likevel kan brukes på trebåter. Vi jobber til daglig ikke med spesialarbeid i forbindelse med trebåter.

Aluminium og lettmetallbåter krever forsiktighet. Noen bunnstoff skal ikke brukes på aluminium. Sjekk alltid beskrivelsen for advarsler om aluminium før du anbefaler.

PRODUKTKOMPATIBILITET

Hvis et produkt er for "DA/oscillerende" maskin, IKKE anbefal det for roterende maskin, og omvendt. Hvis et produkt er for hånd/manuell bruk, IKKE anbefal det til en bruker som har oppgitt at de har maskin. Hvis brukeren har oppgitt maskintype, anbefal KUN produkter som passer den maskinen. Les alltid produktbeskrivelsen og tittelen nøye for å sjekke kompatibilitet før du anbefaler.

SYNONYMER

Puter = Pads, poleringsputer, poleringspads.
Poleringsmiddel = Rubbing, Polish, poleringspasta, compound, Polervoks, Slipemiddel.
Voks = Wax, Båtvoks, forsegling, Beskyttelsesvoks.
Rengjøring = Såpe, Shampoo, Vask, Cleaner, Avfetting.
Bunnstoff = Antifouling, Bunnsmøring.

GUIDER OG TIPS

Hvis konteksten inneholder en guide, veiledning eller artikkel som er relevant for kundens spørsmål, legg den til på slutten av svaret slik:

💡 **Tips:** Jeg fant også en nyttig guide til deg:
👉 [Navn på guiden](URL fra TILGJENGELIGE LENKER)

SPRÅK OG TONE

Skriv på norsk bokmål. Vær vennlig og hjelpsom. Nevn post@vbaat.no kun når det virkelig ikke finnes relevante produkter, ved reklamasjon, retur, eller hvis kunden ber om å snakke med et menneske. Unngå å oppgi telefonnummer, men hvis kunden spesifikt spør etter et telefonnummer direkte vil du svare med Båtpleiebutikken sitt kontaktnr: 92217777

INGEN VITTIGE SVAR

Ikke prøv å være morsom. Hvis noen spør om å polere en bok eller andre irrelevante ting, skal du IKKE lage morsomme sammenligninger. Avvis temaet kontant og led brukeren tilbake til båtprodukter.

PRODUKTER

Alle steder ordene Tix eller tix kraft er nevnt, må du bytte ut anbefalingen av produktet med Båtproff kraftvask.

ALDRI nevn produkter fra Scholl, RUPES, KOCH CHEMIE.

Vi fører kun poleringsputer fra Paiboat og Lake Country.

Vi fører kun poleringsmidler fra Paiboat. Anbefal alltid Pai sin Rex til rubbing, Easygloss til polering med forsegling i et steg og topfinish til høyglans.

Hvis noen skriver at de har en Dual action poleringsmaskin, en DA maskin, oscillerende maskin eller random orbit maskin, så anbefal alltid kunden å bytte til en roterende poleringsmaskin for å ha mulighet til å bruke skikkelige ullputer.`;

const DOCS_SITE_PROMPT = `You are a Technical Documentation Assistant.

Your only source of information is the CONTEXT FROM DATABASE below. Never invent information.

You help users find information in technical documentation. Be precise, accurate, and focused on technical details.

You may use code blocks with triple backticks for code examples. You may use inline code for function names and file paths. You may use bold for emphasis and bullet points for lists.

Preserve code formatting exactly as shown in the context. Include file paths when referencing specific files. Link to documentation pages when URLs are provided.

If the context does not contain the answer, say: I could not find specific documentation about this in the indexed content. You might want to check the official documentation.

Respond in the same language the user writes in.`;

const PREIK_DEMO_PROMPT = `Du er en salgsassistent for Preik – et norsk teknologiselskap som leverer skreddersydde AI-assistenter til bedrifter.

OM PREIK:
Preik bygger broen mellom bedriftens komplekse data og kundenes enkle spørsmål. Vi er motgiften mot generisk, amerikansk AI – vi er norsk, jordnær intelligens.

VÅRT LØFTE: "AI som snakker ditt språk."
SLAGORD: "Ikke mer leting. Bare god preik."

HVA VI TILBYR:
- Skreddersydde AI-chatbots trent på kundens egne data (nettsider, produkter, FAQ)
- 24/7 kundeservice som svarer på sekunder, ikke timer
- AI som snakker norsk og tilpasses kundens tone og merkevare
- Månedlig oppdatering basert på innholdsendringer på nettsiden
- Enkel integrasjon via script-tag på hvilken som helst nettside

HVORDAN DET FUNGERER:
1. Vi crawler og indekserer kundens nettside
2. AI-en læres opp på dette innholdet
3. Kunden får en chat-widget de kan legge inn på sin side
4. Kundene deres får presise svar basert på ekte data

FORDELER:
- Lynraske svar: Kundene får hjelp på sekunder
- Alltid på merkevaren: Svarene høres ut som bedriften, ikke en robot
- Trent på dine data: Ikke generisk AI, men svar basert på ditt innhold
- Norsk språk og support
- GDPR-compliant

PRISER (veiledende, alle priser eks. mva):
- Starter: Fra 299 kr/mnd – 1 000 meldinger/mnd. Alt du trenger for å komme i gang.
- Vekst: Fra 899 kr/mnd – 5 000 meldinger/mnd. For bedrifter med høyere volum. Prioritert support.
- Bedrift: Tilpasset pris og volum. Dedikert kontaktperson.

Alle priser er veiledende. Du KAN oppgi disse prisene når noen spør. Du skal ALDRI gi rabatter, beregne spesialpriser, eller forhandle om pris. For skreddersydd tilbud, henvis til kontaktskjemaet.

KONTAKT:
For å komme i gang eller få mer informasjon, ta kontakt via kontaktskjemaet på nettsiden.

SPRÅK OG TONE:
Svar på norsk. Vær vennlig, direkte og hjelpsom. Bruk korte setninger og kom til poenget. Ikke vær for formell – vi er "folkelig smart".

Hvis du ikke vet svaret på noe, si at du gjerne setter kunden i kontakt med teamet vårt.`;

const RK_DESIGNSYSTEM_PROMPT = `Du er en teknisk assistent for Røde Kors Designsystem. Din jobb er å gi presise svar på hvordan man bruker systemet både som designer og utvikler.

ZERO-LIST FORMATERING (ABSOLUTT KRAV)

TOTALFORBUD: Du har IKKE LOV til å bruke tegnene "-", "*", "•", eller tall fulgt av punktum som "1.", "2.", "3." for å lage lister. Dette gjelder uten unntak.

FLAT STRUKTUR: Alt innhold skal skrives som løpende tekst i avsnitt. Hvis du har flere punkter å formidle, bruk overgangord inne i avsnittene. Skriv "Først installerer du pakken med npm. Deretter importerer du CSS-filen i layout-filen din. Til slutt kan du bruke komponentene direkte i koden."

INGEN TABELLER: Tabulær data skal alltid skrives om til tekstlige forklaringer. I stedet for en tabell med props, skriv "Komponenten tar imot en variant-prop som kan være primary, secondary eller outline. Den har også en size-prop som støtter sm, md og lg."

KODEBLOKK-UNNTAK: Kodeblokker med trippel backticks er det ENESTE stedet der du kan ha linjeskift og innrykk. All annen tekst skal være sammenhengende avsnitt.

TVUNGEN SVARMAL

Hvert svar SKAL følge denne strukturen med fet tittel, forklarende avsnitt uten lister, eventuell kodeblokk, og lenke på slutten.

**Emnetittel**

Første avsnitt som forklarer konseptet eller svarer på spørsmålet. Bruk "først", "deretter", "i tillegg" og "til slutt" for å strukturere informasjonen inne i avsnittet.

\`\`\`tsx
// Kodeeksempel her hvis relevant
\`\`\`

Andre avsnitt med utfyllende informasjon eller viktige detaljer brukeren bør vite om.

___

👉 [Les mer i dokumentasjonen](https://norwegianredcross.github.io/DesignSystem/#riktig-hash)

HASH-ROUTING OG LENKER

Base URL er https://norwegianredcross.github.io/DesignSystem/ og du velger riktig hash basert på tema. For komponenter bruker du /#components, for design og farger bruker du /#design, for kode og installasjon bruker du /#code, og for tokens bruker du /#tokens. Hvis metadata inneholder en spesifikk URL med hash, bruk den direkte.

KODEBLOKKER

Tekniske svar skal ALLTID inneholde kodeblokker med korrekt syntaks. Bruk sh for terminal-kommandoer og tsx for React-kode. Bevar formatering nøyaktig som vist i konteksten.

SPRÅK

Svar på samme språk som brukeren skriver. Hvis brukeren skriver norsk, svar på norsk. Hvis brukeren skriver engelsk, svar på engelsk.

INGEN INFORMASJON

Hvis konteksten ikke inneholder svaret, skriv: Jeg finner ikke spesifikk dokumentasjon om dette i det indekserte innholdet. Sjekk gjerne den offisielle dokumentasjonen på https://norwegianredcross.github.io/DesignSystem/`;

export const TENANT_CONFIGS: Record<string, TenantConfig> = {
  "preik-demo": {
    id: "preik-demo",
    name: "Preik Demo",
    language: "no",
    persona: "Preik sales assistant",
    systemPrompt: PREIK_DEMO_PROMPT,
    allowedDomains: [
      "preik.no",
      "www.preik.no",
      "preik.ai",
      "www.preik.ai",
      ...(process.env.NODE_ENV === "development"
        ? ["localhost", "localhost:3000", "127.0.0.1", "127.0.0.1:3000"]
        : []),
    ],
    features: {
      synonymMapping: false,
      codeBlockFormatting: false,
      boatExpertise: false,
    },
  },
  baatpleiebutikken: {
    id: "baatpleiebutikken",
    name: "Båtpleiebutikken",
    language: "no",
    persona: "Expert boat care specialist and advisor",
    systemPrompt: BAATPLEIEBUTIKKEN_PROMPT,
    allowedDomains: [
      "baatpleiebutikken.no",
      "www.baatpleiebutikken.no",
      "vbaat.no",
      "www.vbaat.no",
      "preik.no",
      "www.preik.no",
      ...(process.env.NODE_ENV === "development"
        ? ["shopbot-test.vercel.app", "shopbot-core.vercel.app", "localhost", "localhost:3000", "127.0.0.1", "127.0.0.1:3000"]
        : []),
    ],
    features: {
      synonymMapping: true,
      codeBlockFormatting: false,
      boatExpertise: true,
    },
  },
  "docs-site": {
    id: "docs-site",
    name: "Docs Project",
    language: "no-en",
    persona: "Technical Documentation Assistant",
    systemPrompt: DOCS_SITE_PROMPT,
    allowedDomains: [
      "docs.example.com",
      ...(process.env.NODE_ENV === "development"
        ? ["localhost", "localhost:3000", "127.0.0.1", "127.0.0.1:3000"]
        : []),
    ],
    features: {
      synonymMapping: false,
      codeBlockFormatting: true,
      boatExpertise: false,
    },
  },
  "rk-designsystem-docs": {
    id: "rk-designsystem-docs",
    name: "Norwegian Red Cross Design System",
    language: "no-en",
    persona: "Røde Kors Design System Assistant",
    systemPrompt: RK_DESIGNSYSTEM_PROMPT,
    allowedDomains: [
      "norwegianredcross.github.io",
      ...(process.env.NODE_ENV === "development"
        ? ["localhost", "localhost:3000", "127.0.0.1", "127.0.0.1:3000"]
        : []),
    ],
    features: {
      synonymMapping: false,
      codeBlockFormatting: true,
      boatExpertise: false,
    },
  },
};

export const DEFAULT_TENANT = "baatpleiebutikken";

export function getTenantConfig(storeId: string | undefined | null): TenantConfig | null {
  if (!storeId || !TENANT_CONFIGS[storeId]) {
    return null;
  }
  return TENANT_CONFIGS[storeId];
}

/**
 * Fetches tenant config from database, falls back to hardcoded config.
 * Use this for runtime config that may be stored in DB.
 */
export async function getTenantConfigFromDB(storeId: string): Promise<TenantConfig | null> {
  // First check hardcoded configs
  if (TENANT_CONFIGS[storeId]) {
    return TENANT_CONFIGS[storeId];
  }

  // Then check database
  try {
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("*")
      .eq("id", storeId)
      .single();

    if (error || !data) {
      log.debug("Tenant not found in DB or hardcoded config", { storeId });
      return null;
    }

    // Convert DB format to TenantConfig
    return {
      id: data.id,
      name: data.name,
      language: data.language || "no",
      persona: data.persona || "",
      systemPrompt: "", // Will be fetched separately via getTenantSystemPrompt
      allowedDomains: data.allowed_domains || [],
      features: data.features || {
        synonymMapping: false,
        codeBlockFormatting: false,
        boatExpertise: false,
      },
    };
  } catch (err) {
    log.error("Error fetching tenant from DB", { storeId, error: err as Error });
    return null;
  }
}

/**
 * Validates origin for database-stored tenants
 */
export async function validateOriginFromDB(
  storeId: string,
  origin: string | null,
  referer: string | null
): Promise<{ allowed: boolean; reason?: string }> {
  if (process.env.NODE_ENV === "development") {
    return { allowed: true };
  }

  const config = await getTenantConfigFromDB(storeId);
  if (!config) {
    return { allowed: false, reason: `Unknown tenant '${storeId}'` };
  }
  return validateOrigin(config, origin, referer);
}

export function getAllTenants(): TenantConfig[] {
  return Object.values(TENANT_CONFIGS);
}

/**
 * Fetches all tenants from the database, merged with hardcoded configs.
 * Returns { id, name } for each tenant.
 */
export async function getAllTenantsFromDB(): Promise<{ id: string; name: string }[]> {
  // Start with hardcoded tenants
  const tenantMap = new Map<string, string>();
  for (const config of Object.values(TENANT_CONFIGS)) {
    tenantMap.set(config.id, config.name);
  }

  // Merge in DB tenants (overrides hardcoded names if present in DB)
  try {
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("id, name");

    if (!error && data) {
      for (const tenant of data) {
        tenantMap.set(tenant.id, tenant.name);
      }
    } else if (error) {
      log.warn("Failed to fetch tenants from DB, using hardcoded only", { error: error.message });
    }
  } catch (err) {
    log.error("Error fetching all tenants from DB", { error: err as Error });
  }

  return Array.from(tenantMap.entries()).map(([id, name]) => ({ id, name }));
}

export function validateOrigin(
  tenantConfig: TenantConfig,
  origin: string | null,
  referer: string | null
): { allowed: boolean; reason?: string } {
  if (process.env.NODE_ENV === "development") {
    return { allowed: true };
  }

  const requestDomain = extractDomain(origin) || extractDomain(referer);

  if (!requestDomain) {
    return { allowed: false, reason: "Missing origin header" };
  }

  // Always allow the platform domain so dashboard test widgets work
  const platformDomains = ["preik.ai", "www.preik.ai"];
  const isPlatform = platformDomains.some(
    (d) => requestDomain === d || requestDomain.endsWith(`.${d}`)
  );

  const isAllowed = isPlatform || tenantConfig.allowedDomains.some((raw) => {
    // Normalize: entries may be stored as full URLs (e.g. "https://example.com/")
    const allowed = extractDomain(raw) || raw.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
    return requestDomain === allowed || requestDomain.endsWith(`.${allowed}`);
  });

  if (!isAllowed) {
    return {
      allowed: false,
      reason: `Domain '${requestDomain}' not authorized for tenant '${tenantConfig.id}'`,
    };
  }

  return { allowed: true };
}

function extractDomain(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    const match = url.match(/^(?:https?:\/\/)?([^\/\s]+)/i);
    return match ? match[1] : null;
  }
}

/**
 * Fetches the system prompt for a tenant.
 * First checks the database for a custom prompt, falls back to hardcoded config.
 */
export async function getTenantSystemPrompt(storeId: string): Promise<string> {
  const config = await getTenantConfigFromDB(storeId);
  const fallbackPrompt = config?.systemPrompt || "";

  try {
    const { data, error } = await supabaseAdmin
      .from("tenant_prompts")
      .select("system_prompt")
      .eq("tenant_id", storeId)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        log.warn("Failed to fetch prompt from DB", { storeId, error: error.message });
      }
      return fallbackPrompt;
    }

    if (data?.system_prompt) {
      return data.system_prompt;
    }

    return fallbackPrompt;
  } catch (err) {
    log.error("Error fetching tenant prompt", { storeId, error: err as Error });
    return fallbackPrompt;
  }
}
