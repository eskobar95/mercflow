# MercFlow — Product Requirements Document

**Version:** 0.1 (Initial)
**Status:** Draft
**Owner:** Nicklas / MercFlow

---

## 1. Vision

MercFlow er en opinionated Medusa-distribution — en fork af Medusa v2 der løser de problemer, som enhver seriøs nordisk webshop løber ind i: et knapt og uintuitivt admin-UI, manglende native content-støtte, og et i18n-flow der ikke fungerer i praksis.

Projektet bygges med Guapo (guapo.store) som first use case, men designes fra dag ét til at kunne bruges af andre Medusa-shops.

**Kerneprincippet:** Shopify-agtig brugervenlighed og luft — men med Medusas fleksibilitet og self-hosted frihed.

---

## 2. Problemstilling

Medusa v2 er en stærk commerce-motor, men admin-panelet har en række fundamentale problemer:

| Problem | Konsekvens |
|---|---|
| Tæt, mørkt UI med minimal luft | Lavere produktivitet, stejlere onboarding |
| Modal-tung navigation | Konteksttab, dårlig UX ved komplekse flows |
| Ingen native rich text/SEO-felter på Product/Category | Kræver eksternt CMS (Payload, Sanity etc.) |
| i18n-felter mangler ordentligt redigeringsflow | Sværere at vedligeholde flersprogede kataloger |
| Låste list-views i admin | Kan ikke tilpasses til specifikke butiksbehov |

---

## 3. Scope — Batch 1

Første batch fokuserer udelukkende på **admin-laget**. Ingen storefront-ændringer i denne iteration.

### 3.1 UI/UX Redesign

**Mål:** Shopify-inspireret admin — lyst, clean, spacious. Mere luft, bedre hierarki, lavere kognitiv belastning.

**Scope:**
- Gennemgang og audit af alle eksisterende Medusa admin UI-komponenter og CSS-variabler
- Nyt design token-system (farver, spacing, typografi, radius, shadows)
- Redesign af global layout: sidebar, topbar, content-area, card-komponenter
- Lyst tema som primær; dark mode som option (ikke Batch 1)
- Forbedrede list-views: bedre tabel-layout, filtrering, sortering, bulk-actions

**Design direction:**
- Primær baggrund: hvid / very light gray
- Accent: subtil, ikke aggressiv
- Typography: tydelig hierarki, god læsbarhed
- Spacing: generøst — mere luft end Medusa default

### 3.2 Navigation — Modal → Page Transitions

**Mål:** Erstatte Medusas modal-tunge navigationsmønster med page-baseret navigation og smooth transitions.

**Scope:**
- Identificer alle steder i admin hvor modaler bruges til primær navigation (ikke confirmation dialogs)
- Konverter disse flows til dedikerede sider med URL-routing
- Implementer page transitions (fade/slide) ved navigation
- Bevar modaler udelukkende til: bekræftelsesdialogues, korte formularer, destructive actions

**Ikke i scope:** Confirmation/destructive action modaler erstattes ikke.

### 3.3 Native Content-felter på Product

**Mål:** Producenter skal kunne redigere rigt indhold direkte i Medusa admin — uden eksternt CMS.

**Nye felter på `Product` entity:**

| Felt | Type | Beskrivelse |
|---|---|---|
| `description_rich` | Rich Text (JSON/HTML) | Erstatter/supplerer plain text description |
| `seo_title` | String | `<title>`-tag override |
| `seo_description` | String (max 160) | Meta description |
| `seo_og_image` | Media | Open Graph billede |
| `media_gallery` | Media[] | Ekstra billeder udover thumbnail |

**Admin UI:**
- Dedicated "Content"-tab på produktsiden
- Rich text editor (TipTap eller Lexical)
- SEO-preview komponent (viser hvordan det ser ud i Google)
- Media gallery manager med drag-and-drop sortering

### 3.4 Native Content-felter på Category

**Mål:** Samme content-lag som Product, men på kategoriniveau.

**Nye felter på `Product Category` entity:**

| Felt | Type | Beskrivelse |
|---|---|---|
| `description_rich` | Rich Text | Kategoribeskrivelse til storefront |
| `seo_title` | String | SEO title override |
| `seo_description` | String (max 160) | Meta description |
| `seo_og_image` | Media | OG-billede |
| `banner_image` | Media | Hero/banner billede til kategoriside |

### 3.5 i18n Content-flow

**Mål:** Et intuitivt flow til at redigere sprogspecifikke felter (titel, description, SEO) direkte i admin — side om side eller via sprog-switcher.

**Scope:**
- Sprog-switcher i admin toolbar på produkt- og kategorisider
- Alle content-felter (title, description_rich, seo_title, seo_description) vises i den valgte sprogversion
- Visuelt tydeligt hvilken sprogversion der redigeres
- Ingen ændring af Medusas underliggende region/language setup — kun UI-laget

**Ikke i scope:** Automatisk oversættelse, translation memory, CMS-import/export.

---

## 4. Teknisk Arkitektur

### 4.1 Repository-struktur

```
mercflow/
├── packages/
│   ├── admin-ui/          ← Redesignet admin (fork af @medusajs/admin-ui)
│   ├── content-module/    ← Native content-felter (Medusa modul)
│   └── design-tokens/     ← Delt token-system
├── apps/
│   └── backend/           ← Medusa backend med MercFlow-moduler
├── docs/
│   ├── PRD.md             ← Dette dokument
│   └── ARCHITECTURE.md
└── .cursor/
    ├── rules/
    └── agents/
```

### 4.2 Tech Stack

Arves fra Medusa v2:
- **Backend:** Node.js, Medusa v2, PostgreSQL
- **Admin:** React, Vite, Radix UI (basiskomponenter)
- **Styling:** Tailwind CSS (med MercFlow design tokens)
- **Rich text:** TipTap v2
- **Language:** TypeScript throughout

### 4.3 Principper

- **Minimal divergens fra Medusa core** — vi forker admin UI, ikke hele backend-kerneen. Medusa-opgraderinger skal kunne merges ind med minimal konflikt.
- **Modulær content-layer** — content-felterne implementeres som et Medusa-modul, ikke som direkte entity-mutationer.
- **Token-drevet UI** — alle visuelle beslutninger (farver, spacing, radius) lever i design tokens, ikke hardcodet i komponenter.

---

## 5. Cursor Agent Setup

### 5.1 Rules

```
.cursor/rules/
├── project.mdc         ← Global project context
├── admin-ui.mdc        ← Regler for admin-komponenter
├── content-module.mdc  ← Regler for content-modulet
└── conventions.mdc     ← Kode- og commit-konventioner
```

**`project.mdc` (global):**
- Hvad MercFlow er
- Repo-struktur
- Hvilke pakker der findes og hvad de gør
- Hvad agenten ALDRIG må gøre (røre ved Guapo prod, ændre Medusa core direkte)

**`admin-ui.mdc`:**
- Design token-referencer
- Komponent-mønstre (hvordan vi bygger på Radix)
- Tailwind-klasse-konventioner
- Accessibility-krav

**`content-module.mdc`:**
- Medusa modul-arkitektur
- Database migration-mønstre
- Felt-definitioner (single source of truth)

### 5.2 Sub-agents (Batch 1)

```
.cursor/agents/
├── BATCH_01.md            ← Overordnet batch-definition
├── design-tokens.md       ← Agent: Byg token-system
├── admin-layout.md        ← Agent: Redesign global layout
├── list-views.md          ← Agent: Forbedrede list-views
├── modal-to-pages.md      ← Agent: Modal → page transition
├── product-content.md     ← Agent: Content-felter på Product
├── category-content.md    ← Agent: Content-felter på Category
└── i18n-flow.md           ← Agent: Sprog-switcher UI
```

Hver agent-fil indeholder:
- **Mål** — hvad skal være done
- **Kontekst** — hvilke filer/komponenter er relevante
- **Acceptkriterier** — hvornår er tasken færdig
- **Begrænsninger** — hvad må agenten ikke røre

### 5.3 Skills (Cursor)

Relevante skills at have aktiveret/konfigureret:
- **TypeScript** — strict mode, Medusa type-definitioner
- **React/Radix** — komponent-patterns, accessibility
- **TipTap** — rich text editor integration
- **Tailwind** — token-baseret utility styling
- **Medusa v2 modules** — modul-arkitektur og lifecycle hooks
- **PostgreSQL migrations** — Mikro-ORM migration patterns

---

## 6. Batch 1 — Rækkefølge

Arbejdet køres i denne rækkefølge for at undgå afhængighedskonflikter:

```
1. Repo setup + Medusa clone/fork
2. Design tokens (blocker for alt UI-arbejde)
3. Admin global layout redesign
4. List-views forbedring
5. Modal → page transitions
6. Content-modul: database + migrations
7. Product content-felter + admin UI
8. Category content-felter + admin UI
9. i18n sprog-switcher
```

---

## 7. Ikke i Batch 1

Følgende er identificeret men udskydes:

- Nordiske payment-moduler (MobilePay, Klarna)
- Nordiske fragt-moduler (GLS, DAO)
- Page builder / blog
- Dark mode
- Storefront-integrationer
- Open source / public release
