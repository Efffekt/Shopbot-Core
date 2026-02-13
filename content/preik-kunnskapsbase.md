# Preik – Kunnskapsbase

## Om Preik

Preik er en norsk leverandør av AI-baserte chatbot-løsninger for bedrifter. Vi lager skreddersydde AI-assistenter som forstår bedriften din og svarer kundene dine – på ordentlig norsk.

Nettside: https://www.preik.ai
E-post: hei@preik.no

---

## Slik fungerer det

Fra nettside til AI-assistent på under 48 timer. Tre enkle steg:

### Steg 1: Vi henter innholdet ditt
Vi samler inn innhold fra nettsiden din — produkter, FAQ og dokumentasjon.

### Steg 2: AI-en settes opp
Innholdet blir prosessert slik at AI-en forstår bedriften din og kan svare kundene dine.

### Steg 3: Legg til på din side
Du får en enkel kode-snippet som legges inn på nettsiden. Ferdig på minutter.

---

## Funksjoner

### Lynraske svar
Kundene får svar på sekunder, ikke timer. Tilgjengelig 24/7.

### Alltid på merkevaren
Svarene høres ut som deg, ikke en robot. Tilpasset din tone og stil.

### Trent på dine data
Vi lærer opp AI-en på nettsiden din, produkter og FAQ. Månedlige oppdateringer inkludert.

### Tilpasset utseende
Farger, fonter og tone tilpasses din merkevare så det ser ut som en naturlig del av nettsiden din.

### Flerspråklig
Chatboten forstår og svarer på norsk som standard, men kan også håndtere andre språk. Kontakt oss for flerspråklig konfigurasjon.

### GDPR-compliant
Vi er GDPR-compliant og lagrer kun data som er nødvendig for å gi gode svar. Data behandles av godkjente underleverandører under strenge databehandleravtaler.

---

## Priser

Veiledende priser — vi skreddersyr en pakke som passer din bedrift. Alle priser er veiledende.

### Starter (Anbefalt)
- Pris: Fra 299 kr/mnd
- Volum: 1 000 meldinger/mnd
- Beskrivelse: Alt du trenger for å komme i gang
- Inkluderer:
  - Skreddersydd widget og merkevare
  - Opplæring og nettside-skraping
  - Avansert innsikt og statistikk
  - Flerspråklig (norsk + engelsk)
  - Norsk support
  - GDPR-compliant

### Vekst
- Pris: Fra 899 kr/mnd
- Volum: 5 000 meldinger/mnd
- Beskrivelse: For bedrifter med høyere volum
- Inkluderer:
  - Alt i Starter
  - 5x meldingsvolum
  - Prioritert support

### Bedrift
- Pris: Tilpasset
- Volum: Tilpasset etter behov
- Beskrivelse: For etablerte bedrifter med egne behov
- Inkluderer:
  - Alt i Vekst
  - Tilpasset meldingsvolum
  - Dedikert kontaktperson

---

## Ofte stilte spørsmål (FAQ)

### Hvor lang tid tar det å sette opp?
De fleste kunder er oppe og kjører innen 24-48 timer. Vi henter innhold fra nettsiden din, setter opp AI-en, og gir deg en kode-snippet du legger inn på siden din.

### Fungerer det på norsk?
Ja! Preik er bygget for norske bedrifter. AI-en forstår og svarer på norsk, og tilpasses din tone og merkevare.

### Hva skjer når innholdet på nettsiden endres?
Vi kjører en månedlig oppdatering basert på innholdsendringer på nettsiden din. Trenger du å legge til noe kritisk mellom oppdateringene? Ta kontakt, så ordner vi det raskt.

### Er dataene mine trygge?
Ja. Vi er GDPR-compliant og lagrer kun data som er nødvendig for å gi gode svar. Data behandles av godkjente underleverandører (Google Cloud, OpenAI) under strenge databehandleravtaler.

### Kan jeg tilpasse utseendet på chatten?
Absolutt. Farger, fonter og tone tilpasses din merkevare så det ser ut som en naturlig del av nettsiden din.

### Hvor raskt kan jeg komme i gang?
De fleste kunder er oppe og kjører innen 24-48 timer. Når du har fått tilgang, tar det bare noen minutter å legge til embed-koden på nettsiden din.

### Trenger jeg teknisk kompetanse?
Nei, det holder å kunne lime inn en kodesnutt på nettsiden din. Vi har guider for alle populære plattformer som WordPress, Shopify, Wix og flere.

### Kan jeg teste chatboten før den går live?
Ja! I dashbordet kan du teste chatboten i sanntid før du publiserer den på nettsiden din. Du kan også bruke demoen på forsiden vår.

### Støtter widgeten flere språk?
Ja, chatboten forstår og svarer på norsk som standard, men kan også håndtere andre språk. Kontakt oss for flerspråklig konfigurasjon.

---

## Integrasjon og teknisk dokumentasjon

### Kom i gang

Å legge til Preik på nettsiden din tar bare noen minutter. Du trenger kun å legge til en enkel script-tag i HTML-koden din.

1. Logg inn på dashbordet
2. Gå til "Integrasjon"-fanen for å finne din unike embed-kode. Her kan du også tilpasse utseendet visuelt.
3. Lim inn koden rett før `</body>` taggen på alle sider der du vil vise chatboten.

### Embed-kode

Grunnleggende embed-kode:
```html
<script
  src="https://preik.no/widget.js"
  data-store-id="din-butikk-id"
  async
></script>
```

### Widget-tilpasning

Tilgjengelige data-attributter:

- **data-store-id** – Din unike butikk-ID (påkrevd)
- **data-accent-color** – Hovedfarge for knapper og bruker-meldinger (standard: #F97316)
- **data-text-color** – Tekstfarge (overstyrer tema)
- **data-bg-color** – Bakgrunnsfarge for widget
- **data-surface-color** – Farge for header, input-område og meldingsbobler
- **data-theme** – Fargetema: auto, light, eller dark (standard: auto)
- **data-position** – Plassering: bottom-right eller bottom-left (standard: bottom-right)
- **data-greeting** – Velkomstmelding som vises når chatten er tom
- **data-placeholder** – Plassholder-tekst i input-feltet
- **data-brand-name** – Navn som vises i header (standard: Assistent)
- **data-font-body** – Font for brødtekst
- **data-font-brand** – Font for merkenavn i header
- **data-brand-style** – Stil for merkenavn: normal eller italic

### Tema og farger

Widgeten støtter lys og mørk modus. Med "auto" følger den brukerens systeminnstillinger. For mørk modus kan du tilpasse bakgrunns- og overflatefargene.

### Fonter

Widgeten bruker systemfonter som standard for optimal ytelse. Du kan overstyre dette med egne fonter, men du må laste inn fontene selv (f.eks. via Google Fonts).

### Posisjon og layout

Widgeten vises som en flytende knapp i hjørnet av skjermen. På mobil åpnes chatten i fullskjerm for bedre brukeropplevelse. Desktop: 400px bredde, 500px høyde. Mobil: fullskjerm med 16px margin.

---

## Plattform-guider

### WordPress
Alternativ 1 (plugin): Installer "Insert Headers and Footers" eller "WPCode" plugin, gå til plugin-innstillingene, lim inn embed-koden i "Footer"-seksjonen, lagre.

Alternativ 2 (tema-fil): Gå til Utseende → Tema-filredigerer, åpne footer.php, lim inn koden rett før `</body>`, lagre.

### Shopify
Gå til Online Store → Themes → "Edit code". Finn theme.liquid under Layout, finn `</body>` taggen, lim inn embed-koden rett før, klikk "Save".

### Wix
Gå til Settings → Custom Code → "+ Add Code". Lim inn embed-koden, velg "Body - end" som plassering, velg sider, klikk "Apply".

### Squarespace
Gå til Settings → Advanced → Code Injection. Lim inn embed-koden i "Footer"-feltet, klikk "Save".

### Webflow
Gå til Project Settings → Custom Code → "Footer Code", lim inn embed-koden, publiser på nytt.

### React / Next.js
Bruk Next.js Script-komponenten med strategy="lazyOnload".

---

## Feilsøking

### Widgeten vises ikke
- Sjekk at script-taggen er plassert før `</body>`
- Verifiser at data-store-id er riktig
- Åpne nettleserens Developer Tools (F12) og sjekk Console for feilmeldinger
- Tøm nettleserens cache og prøv igjen

### Chatboten svarer ikke
- Sjekk at butikk-ID-en er korrekt og aktiv
- Verifiser at du har en gyldig abonnementsplan
- Sjekk Network-fanen for API-feil
- Kontakt support hvis problemet vedvarer

### Styling/utseende-problemer
- Widgeten bruker Shadow DOM og bør ikke påvirkes av nettsiden din
- Hvis du bruker egne fonter, sjekk at de er lastet inn på siden
- Prøv å sette tema eksplisitt med data-theme="light"

---

## API-referanse

For avanserte integrasjoner kan du kommunisere direkte med chat-API-et.

Endepunkt: POST https://preik.no/api/chat

Request body:
```json
{
  "messages": [{ "role": "user", "content": "Hva er åpningstidene?" }],
  "storeId": "din-butikk-id",
  "noStream": false
}
```

Parametere:
- messages – Array med samtalehistorikk
- storeId – Din butikk-ID
- noStream – Sett til true for å få hele svaret på en gang (standard: false for streaming)

---

## Kontakt

Interessert i å se hvordan Preik kan hjelpe bedriften din? Ta kontakt, så svarer vi innen 24 timer.

- E-post: hei@preik.no
- Nettside: https://www.preik.ai

---

## Personvern

Preik er behandlingsansvarlig for personopplysninger som samles inn gjennom våre tjenester.

Vi samler inn:
- Kontaktinformasjon (navn, e-post) ved kontakt eller kontoopprettelse
- Brukerdata inkludert chat-logger
- Teknisk informasjon (IP, nettleser, enhet)

Vi behandler data for å levere og forbedre tjenesten, kommunisere med deg, analysere bruksmønstre, og overholde juridiske forpliktelser. Alle underleverandører er bundet av databehandleravtaler.

Du har rett til innsyn, retting, sletting og dataportabilitet. Kontakt hei@preik.no for å utøve dine rettigheter.

---

## Informasjonskapsler (cookies)

Preik bruker kun strengt nødvendige informasjonskapsler for autentisering av innloggede brukere i dashbordet. Vi bruker ingen sporings-, analyse- eller markedsføringscookies.

Chat-widgeten som installeres på kundenes nettsider bruker ikke informasjonskapsler. Samtale-sesjoner håndteres via sesjons-ID i forespørselen.

Vi bruker ingen tredjepartscookies eller analyseverktøy som Google Analytics.

---

## Vilkår for bruk

Ved å bruke Preik sine tjenester aksepterer du vilkårene. Preik tilbyr AI-baserte chatbot-løsninger som kan integreres på kundens nettsider, inkludert opplæring av AI-modeller på kundens innhold, hosting av chat-widget, og tilgang til administrasjonspanel.

Viktige punkter:
- Preik garanterer ikke at AI-assistenten alltid gir korrekte svar
- Kunden er ansvarlig for å verifisere informasjonen som gis til sluttbrukere
- Kunden må informere sluttbrukere om at de kommuniserer med en AI
- Fakturaer forfaller innen 14 dager
- 30 dagers oppsigelsesvarsel
- Underlagt norsk lov med Oslo tingrett som verneting

For fullstendige vilkår, se https://www.preik.ai/vilkar
