# MercFlow — Product Requirements Document

**Version:** 0.2 (Batch 2)
**Status:** Draft
**Owner:** Nicklas / MercFlow
**Forudsætter:** Batch 1 completed (UI redesign, content-felter, i18n-flow)

---

## 1. Batch 2 — Formål

Batch 1 løste admin-laget: UI, navigation, og native content-felter. Batch 2 bygger oven på det og løser to nye domæner:

1. **SEO-infrastruktur** — de operationelle SEO-værktøjer der mangler i Medusa out of the box: redirect-håndtering, sitemap-kontrol, structured data, shopping feeds og korrekt slug-generering for nordiske tegn.

2. **Inventory & Purchase Orders** — et komplet flow til indkøb, lageropfyldning og ordrebehandling der giver Guapo og andre nordiske shops et operationelt overblik de ikke kan få i standard Medusa.

Batch 2 introducerer for første gang **storefront-berøringer** — JSON-LD, Open Graph og sitemap er teknisk set storefront-output, men styres fra admin. Al konfiguration sker i admin; storefront-laget konsumerer data via API.

---

## 2. Problemstilling

| Problem | Konsekvens |
|---|---|
| Ingen 301 redirect-håndtering ved URL-ændringer | Dead links, tabt SEO link juice |
| Ingen sitemap-kontrol i admin | Manuelt vedligehold, fejlagtige sitemaps |
| Ingen structured data (JSON-LD) auto-generering | Misser Google rich results på produktsider |
| ø/æ/å håndteres forkert i URL-slugs | Ødelagte URLs, dårligt SEO |
| Ingen produkt-feed til Google/Meta/TikTok Shopping | Manuelt feed-arbejde, risiko for fejl |
| Ingen Purchase Order-flow | Ingen historik på indkøb, manuel lageropfyldning |
| Inventory-overblik er fragmenteret i Medusa admin | Svært at overskue lager, reservationer og mangler |
| Ordrebehandling er spredt og ueffektiv | Langsommere fulfillment, højere fejlrate |

---

## 3. Scope — Batch 2

### 3.1 301 Redirect Manager

**Mål:** Ingen URL-ændringer på produkter eller kategorier må resultere i dead links eller tabt SEO-værdi.

**Funktionalitet:**
- Når en URL-slug ændres på et produkt eller en kategori, registreres den gamle URL automatisk og der oprettes en 301 redirect til den nye
- Admin-oversigt over alle aktive redirects: kilde-URL, destination-URL, oprettelsesdato, type (auto/manuel)
- Manuel oprettelse af redirects — fx ved migration fra andet system
- Bulk-import af redirects via CSV
- Søgning og filtrering i redirect-oversigten
- Sletning af forældede redirects
- Redirect-chain detection — advarsel hvis en redirect peger på en URL der selv har en redirect

**Teknisk:**
- Redirects gemmes i en ny `mercflow_redirect` tabel
- Medusa middleware intercepter requests og tjekker mod redirect-tabellen
- Auto-redirect oprettes via subscriber der lytter på `product.updated` og `product_category.updated` events

**Ikke i scope:** Wildcard redirects, regex-baserede redirects.

---

### 3.2 Sitemap Manager

**Mål:** Fuld kontrol over `sitemap.xml` direkte fra admin — uden at røre kode.

**Funktionalitet:**
- Auto-genereret sitemap baseret på Medusas produkt- og kategorikatalog
- Admin-kontrol over:
  - Hvilke sider der inkluderes/ekskluderes
  - `priority` og `changefreq` pr. sidetype (produkter, kategorier, statiske sider)
  - Ekskluder specifikke produkter eller kategorier fra sitemap
- Manuel "regenerer sitemap"-knap
- Sitemap-preview i admin — se det færdige XML
- Sidst opdateret timestamp synligt i admin
- Automatisk regenerering ved produktoprettelse/-opdatering/-sletning

**Teknisk:**
- Sitemap serveres dynamisk via en Medusa API-route: `GET /sitemap.xml`
- Sitemap-konfiguration gemmes i en `mercflow_sitemap_config` tabel
- Caching af genereret sitemap med invalidering ved katalogændringer

**Ikke i scope:** Sitemap-index med multiple sitemaps, billedsitemap, nyhedssitemap.

---

### 3.3 Robots.txt Editor

**Mål:** Administrer `robots.txt` fra admin uden at røre serverfiler.

**Funktionalitet:**
- Struktureret editor i admin med UI-kontroller for de mest almindelige regler:
  - Tillad/bloker crawling pr. path
  - Tillad/bloker specifikke bots (Googlebot, Bingbot, GPTBot osv.)
  - Sitemap-reference (auto-indsat)
- Fritekst-tilstand for avancerede brugere
- Preview af den færdige `robots.txt`
- Ændringshistorik — se hvad der blev ændret og hvornår

**Teknisk:**
- `robots.txt` serveres dynamisk via Medusa API-route: `GET /robots.txt`
- Konfiguration gemmes i `mercflow_robots_config` tabel

---

### 3.4 Structured Data / JSON-LD

**Mål:** Automatisk generering af korrekte structured data på produktsider og kategorisider — giver Google rich results uden manuel indsats.

**Scope på produktsider:**

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "{{ product.title }}",
  "description": "{{ product.seo_description }}",
  "image": ["{{ product.media_gallery }}"],
  "sku": "{{ variant.sku }}",
  "offers": {
    "@type": "Offer",
    "price": "{{ variant.price }}",
    "priceCurrency": "{{ region.currency_code }}",
    "availability": "{{ inventory_status }}"
  }
}
```

**Scope på kategorisider:**
- `BreadcrumbList` schema auto-genereret fra kategori-hierarki

**Scope globalt:**
- `Organization` schema på alle sider (navn, logo, URL, sociale profiler)
- `WebSite` schema med `SearchAction` (sitelinks searchbox)

**Admin-kontrol:**
- Toggle til at aktivere/deaktivere structured data pr. sidetype
- `Organization`-felter redigerbare i Settings (navn, logo, sociale URLs)
- Ingen manuel JSON-redigering — alt genereres fra eksisterende data

**Teknisk:**
- JSON-LD genereres server-side og injiceres i `<head>` via storefront API-respons
- Trækker data fra Medusa core + content-felter fra Batch 1

---

### 3.5 Open Graph & Social Meta

**Mål:** Korrekte OG-tags på alle sider der trækker automatisk fra Batch 1's SEO-felter.

**Scope:**
- `og:title`, `og:description`, `og:image` auto-populeret fra `seo_title`, `seo_description`, `seo_og_image`
- Twitter/X Card meta tags
- Fallback-logik: hvis SEO-felt er tomt bruges produkttitel / kategorinavn
- Preview-komponent i admin viser hvordan et link vil se ud ved deling på sociale medier

**Ikke i scope:** Pinterest Rich Pins, LinkedIn-specifikke tags.

---

### 3.6 Canonical URL-håndtering

**Mål:** Forhindre duplicate content-problemer når samme produkt er tilgængeligt via flere URL-stier.

**Funktionalitet:**
- Automatisk canonical tag sat til produktets primære URL
- Manuel override pr. produkt og kategori i Content-tabben (fra Batch 1)
- Advarsel i admin hvis et produkt mangler canonical eller har en potentiel conflict

**Teknisk:**
- Canonical URL beregnes automatisk baseret på produkt-slug og aktiv region/locale
- Override gemmes i `product_content` / `category_content` tabellerne fra Batch 1

---

### 3.7 Nordisk Slug-generering

**Mål:** URLs der indeholder ø, æ, å håndteres konsistent og korrekt på tværs af hele MercFlow.

**Regler:**

| Tegn | Output |
|---|---|
| ø / Ø | oe |
| æ / Æ | ae |
| å / Å | aa |
| é, è, ê | e |
| ü, ö, ä (tysk) | ue, oe, ae |
| Mellemrum | - (bindestreg) |
| Specialtegn | fjernes |

**Konfiguration i admin:**
- Settings-side med valg af slug-strategi: "Nordisk (ø→oe)" eller "Udelad (ø→o)"
- Live preview — skriv et produktnavn og se den genererede slug
- Bulk-regenerering af eksisterende slugs (med automatisk 301 redirect oprettelse)

**Teknisk:**
- Slug-utility i `packages/content-module` erstatter Medusas default slug-generering
- Køres automatisk ved produkt- og kategori-oprettelse
- Eksisterende slugs påvirkes ikke medmindre bulk-regenerering køres eksplicit

---

### 3.8 Universelt Shopping Feed

**Mål:** Ét auto-genereret produkt-feed der er kompatibelt med Google Shopping, Meta Commerce Manager og TikTok Shopping — opdateret automatisk ved katalogændringer.

**Feed-format:** Google Shopping XML (bruges af alle tre platforme)

**Felter der eksporteres:**

| Feed-felt | Kilde |
|---|---|
| `id` | `variant.sku` |
| `title` | `product.title` (locale-aware) |
| `description` | `product.seo_description` → fallback `product.description` |
| `link` | Storefront URL + produkt-slug |
| `image_link` | Første billede i `media_gallery` → fallback thumbnail |
| `additional_image_link` | Øvrige billeder i `media_gallery` |
| `price` | `variant.price` med valuta |
| `availability` | Beregnet fra inventory |
| `brand` | Custom felt (redigerbart pr. produkt i Content-tab) |
| `gtin` / `mpn` | Custom felter på variant |
| `condition` | `new` (default, konfigurerbar) |
| `custom_label_0–4` | Custom felter til segmentering i Google Ads |

**Admin-funktionalitet:**
- Feed-oversigt: antal produkter, sidst opdateret, valideringsstatus
- Mulighed for at ekskludere specifikke produkter eller kategorier fra feed
- Feed-URL til brug i Google Merchant Center / Meta / TikTok
- Valideringsrapport — markerer produkter med manglende påkrævede felter

**Teknisk:**
- Feed serveres via `GET /feed/google-shopping.xml`
- Caching med invalidering ved katalogændringer (webhooks)
- Feed-konfiguration i `mercflow_feed_config` tabel

**Ikke i scope:** Amazon feed, Pricerunner feed, betalt feed-management.

---

### 3.9 Purchase Orders Modul

**Mål:** Et komplet flow til indkøb fra leverandør — fra bestilling til lageropfyldning — med fuld historik.

**Konceptet:**
En Purchase Order (PO) er en intern bestilling du laver mod en leverandør (fx Qogita). Du registrerer hvad du har bestilt, hvornår du forventer levering, og når varen ankommer registrerer du modtagelsen — lageret opdateres automatisk.

**Funktionalitet:**

*Opret PO:*
- Vælg leverandør (fra leverandør-register, se nedenfor)
- Tilføj produktvarianter med forventet antal og indkøbspris
- Sæt forventet leveringsdato
- Tilknyt reference/ordrenummer fra leverandøren
- Tilføj noter (fx "fragtet med GLS Erhverv")
- Status: `draft` → `ordered` → `partially_received` → `received` → `cancelled`

*Modtag PO:*
- Registrer modtaget antal pr. variant (kan afvige fra bestilt antal)
- Afvigelser markeres tydeligt (bestilte 100, fik 94)
- Lager opdateres automatisk ved bekræftet modtagelse
- Mulighed for delvis modtagelse — PO forbliver åben til restordren ankommer

*PO-oversigt:*
- Liste over alle POs med status, leverandør, forventet dato, antal linjer
- Filtrering på status og leverandør
- Søgning på PO-reference eller leverandørnavn

*Leverandør-register:*
- Simpel database over leverandører: navn, kontaktperson, email, land, valuta
- Bruges på POs og i inventory-historik

**Database (nye tabeller):**

| Tabel | Formål |
|---|---|
| `mercflow_supplier` | Leverandør-register |
| `mercflow_purchase_order` | PO-hoved (leverandør, dato, status, reference) |
| `mercflow_purchase_order_line` | PO-linjer (variant, bestilt antal, indkøbspris) |
| `mercflow_purchase_order_receipt` | Modtagelsesregistreringer pr. linje |

**Ikke i scope:** Automatisk bestilling baseret på low stock, EDI-integration, fakturamatching.

---

### 3.10 Inventory Dashboard

**Mål:** Et samlet, overskueligt lager-overblik der viser det reelle disponible antal — ikke blot det rå lagerantal.

**Funktionalitet:**

*Inventory-oversigt:*
- Tabel over alle varianter med:
  - `Stocked` — det totale lagerantal
  - `Reserved` — reserveret til åbne ordrer (Medusa håndterer dette automatisk)
  - `Available` — `stocked - reserved` = hvad der faktisk kan sælges
  - `Incoming` — antal på åbne Purchase Orders
- Filtrering: vis kun produkter med lavt lager, vis kun udsolgte
- Sortering på alle kolonner
- Søgning på produktnavn eller SKU

*Low stock alerts:*
- Konfigurerbar tærskel pr. variant (default: 5 stk.)
- Oversigt over alle varianter under tærsklen
- Email-notifikation ved low stock (konfigurerbar i Settings)

*Lagerbevægelseshistorik pr. variant:*
- Kronologisk log over alle bevægelser: salg, returnering, PO-modtagelse, manuel justering
- Tydeligt kilde-label pr. bevægelse (ordre-ID, PO-reference, "Manuel justering")

**Teknisk:**
- `Available`-beregning er altid live — aldrig cachet
- Historik bygges på Medusas eksisterende inventory events + PO-modtagelses-events fra 3.9
- Low stock tærskel gemmes i `mercflow_inventory_config` tabel

---

### 3.11 Forbedret Ordreflow

**Mål:** Hurtigere og mere overskuelig ordrebehandling i admin.

**Funktionalitet:**

*Ordreoversigt:*
- Forbedret tabelvisning med status-badges, kunde, beløb, dato og antal items
- Filtrering: status, dato-interval, betalingsstatus, fulfillment-status
- Bulk-actions: marker multiple ordrer som fulfillment-klar
- Hurtig søgning på ordrenummer, email, kundenavn

*Ordreside:*
- Samlet view uden modal-navigation (Batch 1 princip anvendt på ordrer)
- Ordrenotater — intern kommunikation der ikke sendes til kunden
- Timeline-view: hvornår er ordren placeret, betalt, fulfillment oprettet, afsendt

*Pickliste:*
- Generer en pickliste for dagens ordrer klar til afsendelse
- Sorteret efter lokation (hvis multi-location bruges)
- Print-venligt layout

**Ikke i scope:** GLS/DAO label-generering (Batch 3), automatisk track & trace emails.

---

## 4. Teknisk Arkitektur — Batch 2 tilføjelser

### 4.1 Nye pakker

```
mercflow/
├── packages/
│   ├── admin-ui/              ← (Batch 1) — udvides med nye sider
│   ├── content-module/        ← (Batch 1) — udvides med canonical + brand felt
│   ├── design-tokens/         ← (Batch 1) — uændret
│   ├── seo-module/            ← NY: redirects, sitemap, robots, structured data
│   ├── feed-module/           ← NY: shopping feed generering
│   └── inventory-module/      ← NY: purchase orders, inventory dashboard, low stock
├── apps/
│   └── backend/               ← Registrerer nye moduler
```

### 4.2 Nye Medusa moduler

| Modul | Ansvar |
|---|---|
| `seo-module` | Redirects, sitemap-config, robots-config, slug-utility |
| `feed-module` | Feed-generering, feed-config, feed-validering |
| `inventory-module` | Purchase orders, leverandør-register, inventory dashboard data, low stock config |

### 4.3 Nye database-tabeller

| Tabel | Modul |
|---|---|
| `mercflow_redirect` | seo-module |
| `mercflow_sitemap_config` | seo-module |
| `mercflow_robots_config` | seo-module |
| `mercflow_feed_config` | feed-module |
| `mercflow_supplier` | inventory-module |
| `mercflow_purchase_order` | inventory-module |
| `mercflow_purchase_order_line` | inventory-module |
| `mercflow_purchase_order_receipt` | inventory-module |
| `mercflow_inventory_config` | inventory-module |

### 4.4 Nye API-routes

| Route | Modul | Formål |
|---|---|---|
| `GET /sitemap.xml` | seo-module | Dynamisk sitemap |
| `GET /robots.txt` | seo-module | Dynamisk robots.txt |
| `GET /feed/google-shopping.xml` | feed-module | Shopping feed |
| `GET /admin/redirects` | seo-module | Admin: list redirects |
| `POST /admin/redirects` | seo-module | Admin: opret redirect |
| `GET /admin/purchase-orders` | inventory-module | Admin: list POs |
| `POST /admin/purchase-orders` | inventory-module | Admin: opret PO |
| `POST /admin/purchase-orders/:id/receive` | inventory-module | Admin: modtag PO |
| `GET /admin/inventory-overview` | inventory-module | Admin: dashboard data |

---

## 5. Batch 2 — Rækkefølge

Arbejdet køres i denne rækkefølge:

```
1. Slug-utility (blocker for redirects og feed)
2. SEO-modul foundation (database + service)
3. 301 Redirect Manager (backend + admin UI)
4. Sitemap Manager (backend + admin UI)
5. Robots.txt Editor (backend + admin UI)
6. Structured Data / JSON-LD (storefront integration)
7. Open Graph & Canonical (storefront integration)
8. Shopping Feed (backend + admin UI)
9. Leverandør-register (simpel CRUD)
10. Purchase Orders modul (backend + admin UI)
11. Inventory Dashboard (admin UI — trækker på Medusa + PO data)
12. Forbedret ordreflow + pickliste
```

---

## 6. Ikke i Batch 2

Følgende er identificeret men udskydes:

- Nordiske payment-moduler (MobilePay, Klarna) → Batch 3
- GLS/DAO fragtlabel-integration → Batch 3
- Blog / page builder → Batch 3
- Dark mode → Batch 3
- Automatisk low stock-bestilling → Batch 3
- EDI / leverandør-integration → Batch 3
- Amazon / Pricerunner feeds → Batch 3
- Open source / public release → TBD
