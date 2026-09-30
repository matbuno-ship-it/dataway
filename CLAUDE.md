# Dataway — Claude Workflow Rules

## Translation validation

This is a bilingual site (SK/EN) with two translation layers:
- **Static UI**: i18n keys in `lang/sk.json` + `lang/en.json`, used via `data-i18n*` attributes
- **Product data**: 454 products in `products.json`, each with `_en` fields (`name_en`, `description_en`, `descriptionHtml_en`, `specs_en`, `category_en`, `subcategory_en`)

### When to run the check

Run `node check-translations.mjs` in these situations:

| Trigger | Command |
|---|---|
| After manual edits to `products.json` | `node check-translations.mjs --products` |
| After edits to any `*.html` or `lang/*.json` | `node check-translations.mjs --html --langs` |
| After `node rebuild-from-api.js` | runs automatically at end |
| After `node embed-products.js` | runs automatically at end |
| Before `git commit` touching translations/HTML/products | `node check-translations.mjs` (all checks) |

The check always exits 0 — it **reports** problems, never blocks.

### How to react to reported issues

- **Missing `_en` fields on products** → translate them inline (small batches) or run `translate-descriptions.mjs` (needs `ANTHROPIC_API_KEY`)
- **`X_en is stale — SK text changed`** / **`EN translation not stamped`** → see *Stale translation tracking* below
- **Slovak words in `_en` fields** → fix the specific field manually
- **`category_en` not in allowed list** → must match `i18n.js` CATEGORY_MAP: `Copper Networks`, `Optical Networks`, `Cabinets`, `Installation Accessories`, `Other`
- **Hardcoded Slovak text in HTML** (outside `data-i18n`) → wrap with `data-i18n="key"` and add the key to **both** `lang/sk.json` and `lang/en.json`
- **Missing i18n key in `lang/*.json`** → add it to both files
- **Embedded data out of sync** → run `node embed-products.js`
- **Legal block warnings** (`cookies.html`, `ochrana-osobnych-udajov.html`) → allowlisted; don't auto-translate without explicit user approval

### Category translations (canonical)

`i18n.js` CATEGORY_MAP is authoritative:
```
Metalické siete       → Copper Networks
Optické siete         → Optical Networks
Rozvádzače            → Cabinets
Montážne príslušenstvo → Installation Accessories
```

Never introduce other variants (e.g. "Fiber Optics", "Cabinets & Racks") — the check will flag them.

### Stale translation tracking

Each product has `_enSource` — a fingerprint of the SK fields (`name`, `description`, `descriptionHtml`, `specs`, `subcategory`) at the time the `_en` fields were translated (`translation-sync.js`). Image tags and empty paragraphs are ignored, so localizing/stripping images never counts as a text change.

- `rebuild-from-api.js` restores an EN field only if its SK source is unchanged; otherwise it drops it and logs `SK text changed -> stale EN dropped`. The check then reports it as missing.
- `translate-descriptions.mjs` picks up missing **and** stale products and stamps them after translating.
- **After translating by hand**, stamp the products: `node translation-sync.js stamp CODE [CODE...]`. Only stamp after the EN text really matches the current SK text — stamping is what marks a translation as up to date.
- `node translation-sync.js status` lists stale/unstamped products. Never use `stamp --all` to silence the check; it is only for a verified baseline.
- `_`-prefixed fields are internal and are not embedded into the HTML pages.

## Data pipeline

| Script | Purpose |
|---|---|
| `rebuild-from-api.js` | Fetch XML from TES Shop → products.json (preserves `_en` via `EN_FIELDS`). Fetches fresh XML when `TESSHOP_USER`/`TESSHOP_PASS` env vars are set, else parses the local `tesshop-api-response.xml`. Runs `download-images.js` + translation check automatically at end. |
| `download-images.js` | Localize ALL tesshop assets, because remote `tesshop.sk` URLs rot over time (attids rotate → 404): (1) gallery images (`image`/`images`) → `images/`; (2) inline `<img>` in `descriptionHtml`/`descriptionHtml_en` → `images/` (imgs that 404 on tesshop itself are stripped from the HTML); (3) datasheets (`files[].url`) → `files/` with extension from content-type. A ref is rewritten only when the local file actually exists; failed downloads keep the remote URL. YouTube links in `files` stay remote. |
| `translate-descriptions.mjs` | Translate SK → EN for products missing `_en` fields (needs `ANTHROPIC_API_KEY`). `category_en` is always forced to the canonical CATEGORY_MAP, model output is not trusted for it. |
| `embed-products.js` | Embed products.json into produkty.html/produkt.html + generate products-search.json |
| `check-translations.mjs` | Validate everything |
| `translation-sync.js` | SK-source fingerprints for EN fields (`stamp CODE…`, `status`) — detects stale translations |

**Product update flow:** `rebuild-from-api.js` → `translate-descriptions.mjs` (if new products) → `embed-products.js`. Afterwards verify products.json contains **zero** `tesshop.sk` occurrences (dead-photo/dead-datasheet risk) — only YouTube links may stay remote.

TES Shop API credentials and URL encoding are documented in the memory reference `reference_tesshop_api.md`.
