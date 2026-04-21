#!/usr/bin/env node
// Translation validation. Always exits 0 — only reports issues.
// Usage: node check-translations.mjs [--products] [--html] [--langs] [--embed]
//        No flags = run all.

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const runAll = args.length === 0;
const run = {
  products: runAll || args.includes('--products'),
  html:     runAll || args.includes('--html'),
  langs:    runAll || args.includes('--langs'),
  embed:    runAll || args.includes('--embed'),
};

const EN_FIELDS = ['name_en', 'category_en', 'subcategory_en', 'description_en', 'descriptionHtml_en', 'specs_en'];
// Must match CATEGORY_MAP in i18n.js
const VALID_EN_CATEGORIES = ['Copper Networks', 'Optical Networks', 'Cabinets', 'Installation Accessories', 'Other'];

// Case-insensitive Slovak words that should never appear in EN fields.
const SLOVAK_WORDS = [
  'rozvádzač','rozvadzac','kábel','kabel','záruka','zaruka','mesiacov',
  'dĺžka','dlzka','šírka','sirka','výška','vyska','hmotnosť','hmotnost',
  'priemer','čierny','cierny','šedý','sedy','zelený','zeleny','červený','cerveny',
  'modrý','modry','žltý','zlty','oranžový','oranzovy','fialový','fialovy','bielym','biely',
  'plášť','plast','prevedenie','použitie','pouzitie','konektory','farba',
  'tienenie','hĺbka','hlbka','balenie','nehorľavosť','nehorlavost',
  'napájanie','napajanie','vnútorné','vnutorne','vonkajšie','vonkajsie',
  'sieťový','sietovy','sklenené','sklenene','odnímateľné','odnimatelne',
  'bočnice','bocnice','náradie','naradie','rozvody','rozvádzače','rozvadzace'
];

// Pre-compile regex (word boundary handled by surrounding non-letter chars).
// Build one combined regex for efficiency.
const slovakWordRegex = new RegExp(
  '(^|[^a-zA-Záčďéíľňóôŕšťúýž])(' + SLOVAK_WORDS.join('|') + ')([^a-zA-Záčďéíľňóôŕšťúýž]|$)',
  'i'
);
// Slovak-only diacritics that shouldn't appear in EN text (except specific allowlist).
const slovakDiacriticRegex = /[čďľňŕšťžČĎĽŇŔŠŤŽ]/;

// ---------- helpers ----------
function header(title) {
  return `\n${title}\n${'─'.repeat(title.length)}`;
}

const report = { products: [], langs: [], html: [], embed: [] };
const known = { legalBlocks: [] };

function addIssue(section, msg, severity = 'error') {
  report[section].push({ msg, severity });
}

// ---------- A. Products ----------
function checkProducts() {
  let products;
  try {
    products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
  } catch (e) {
    addIssue('products', `Cannot read products.json: ${e.message}`);
    return;
  }

  products.forEach(p => {
    const id = p.code || p.slug || '?';

    // 1. Missing EN fields
    EN_FIELDS.forEach(f => {
      const skField = f.replace('_en', '');
      // descriptionHtml_en only required if descriptionHtml exists
      if (f === 'descriptionHtml_en' && !p.descriptionHtml) return;
      // specs_en only required if specs exists
      if (f === 'specs_en' && !p.specs) return;
      if (!p[f]) addIssue('products', `${id}: missing ${f}`);
    });

    // 2. Slovak words in EN fields
    const checkStr = (val, label) => {
      if (!val || typeof val !== 'string') return;
      const m = val.match(slovakWordRegex);
      if (m) addIssue('products', `${id}: ${label} contains Slovak word "${m[2]}"`);
    };
    checkStr(p.name_en, 'name_en');
    checkStr(p.description_en, 'description_en');
    // descriptionHtml_en: only check inside text nodes (strip tags first)
    if (p.descriptionHtml_en) {
      const textOnly = p.descriptionHtml_en.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
      const m = textOnly.match(slovakWordRegex);
      if (m) addIssue('products', `${id}: descriptionHtml_en contains Slovak word "${m[2]}"`);
    }

    // 3. specs_en keys and values
    if (p.specs_en && typeof p.specs_en === 'object') {
      Object.entries(p.specs_en).forEach(([k, v]) => {
        const km = k.match(slovakWordRegex);
        if (km) addIssue('products', `${id}: specs_en has Slovak key "${km[2]}" (in "${k}")`);
        if (typeof v === 'string') {
          const vm = v.match(slovakWordRegex);
          if (vm) addIssue('products', `${id}: specs_en[${JSON.stringify(k)}] has Slovak word "${vm[2]}"`);
        }
      });
    }

    // 4. warrantyMonths type
    if (p.warranty && typeof p.warranty === 'string' && /mesiacov/i.test(p.warranty)) {
      addIssue('products', `${id}: legacy "warranty" field with "mesiacov" — should be warrantyMonths (number)`);
    }
    if (p.warrantyMonths != null && typeof p.warrantyMonths !== 'number') {
      addIssue('products', `${id}: warrantyMonths must be number, got ${typeof p.warrantyMonths}`);
    }

    // 5. category_en whitelist
    if (p.category_en && !VALID_EN_CATEGORIES.includes(p.category_en)) {
      addIssue('products', `${id}: category_en "${p.category_en}" not in allowed list`);
    }
  });

  report.products.total = products.length;
}

// ---------- B. Language files ----------
function checkLangs() {
  let sk, en;
  try {
    sk = JSON.parse(fs.readFileSync('lang/sk.json', 'utf8'));
    en = JSON.parse(fs.readFileSync('lang/en.json', 'utf8'));
  } catch (e) {
    addIssue('langs', `Cannot read lang files: ${e.message}`);
    return;
  }

  const skKeys = new Set(Object.keys(sk));
  const enKeys = new Set(Object.keys(en));

  skKeys.forEach(k => { if (!enKeys.has(k)) addIssue('langs', `Key "${k}" in sk.json but missing from en.json`); });
  enKeys.forEach(k => { if (!skKeys.has(k)) addIssue('langs', `Key "${k}" in en.json but missing from sk.json`); });

  Object.entries(sk).forEach(([k, v]) => { if (v == null || v === '') addIssue('langs', `sk.json: empty value for "${k}"`); });
  Object.entries(en).forEach(([k, v]) => {
    if (v == null || v === '') addIssue('langs', `en.json: empty value for "${k}"`);
    else if (typeof v === 'string' && slovakDiacriticRegex.test(v)) {
      addIssue('langs', `en.json "${k}": contains Slovak diacritic — value: "${v}"`);
    }
  });

  report.langs.total = skKeys.size;
}

// ---------- C. HTML files ----------
function listHtmlFiles() {
  return fs.readdirSync('.')
    .filter(f => f.endsWith('.html') && !f.startsWith('scrape-'));
}

function extractI18nKeysFromHtml(html) {
  const keys = new Set();
  const attrs = ['data-i18n', 'data-i18n-html', 'data-i18n-placeholder', 'data-i18n-aria'];
  attrs.forEach(a => {
    const re = new RegExp(`${a}="([^"]+)"`, 'g');
    let m;
    while ((m = re.exec(html)) !== null) keys.add(m[1]);
  });
  return keys;
}

// Strip ignored regions so we don't false-positive on Slovak in scripts/comments/embedded data.
function stripIgnoredRegions(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
}

// Extract visible text nodes NOT inside an element that has any data-i18n* attribute.
// Heuristic: we split by HTML tags, track open elements with data-i18n* by a simple depth counter,
// and only collect text from non-i18n regions.
function findHardcodedSlovakText(html) {
  const stripped = stripIgnoredRegions(html);
  const issues = [];
  // Simple tokenizer
  const tokens = stripped.split(/(<[^>]+>)/);
  let i18nDepth = 0;
  let openTagsWithI18n = [];
  for (const tok of tokens) {
    if (tok.startsWith('<')) {
      const isClose = tok.startsWith('</');
      const tagMatch = tok.match(/^<\/?([a-zA-Z0-9-]+)/);
      if (!tagMatch) continue;
      const tagName = tagMatch[1].toLowerCase();
      const isSelfClose = tok.endsWith('/>') || ['br','img','input','meta','link','hr'].includes(tagName);
      if (isClose) {
        // pop matching
        if (openTagsWithI18n.length && openTagsWithI18n[openTagsWithI18n.length - 1] === tagName) {
          openTagsWithI18n.pop();
          i18nDepth = Math.max(0, i18nDepth - 1);
        }
      } else if (!isSelfClose) {
        if (/\sdata-i18n(?:-html|-placeholder|-aria)?=/.test(tok)) {
          openTagsWithI18n.push(tagName);
          i18nDepth++;
        } else {
          // push placeholder so close-tag balance works
          openTagsWithI18n.push('__NO_I18N__' + tagName);
        }
      }
    } else if (i18nDepth === 0) {
      // Text node outside any i18n-wrapped element
      const trimmed = tok.trim();
      if (!trimmed) continue;
      // Clean HTML entities
      const cleaned = trimmed.replace(/&[a-z]+;/gi, ' ').replace(/&#\d+;/g, ' ');
      if (slovakDiacriticRegex.test(cleaned)) {
        // Extract just a short snippet for the report
        const snippet = cleaned.replace(/\s+/g, ' ').slice(0, 80);
        issues.push(snippet);
      }
    }
  }
  return issues;
}

// Files where long Slovak legal text is known and currently allowed.
const LEGAL_ALLOWLIST = new Set(['cookies.html', 'ochrana-osobnych-udajov.html']);

function checkHtml() {
  let skKeys, enKeys;
  try {
    skKeys = new Set(Object.keys(JSON.parse(fs.readFileSync('lang/sk.json', 'utf8'))));
    enKeys = new Set(Object.keys(JSON.parse(fs.readFileSync('lang/en.json', 'utf8'))));
  } catch {
    skKeys = new Set(); enKeys = new Set();
  }

  const files = listHtmlFiles();
  files.forEach(file => {
    const html = fs.readFileSync(file, 'utf8');
    const keys = extractI18nKeysFromHtml(html);
    keys.forEach(k => {
      if (!skKeys.has(k)) addIssue('html', `${file}: data-i18n key "${k}" missing in sk.json`);
      if (!enKeys.has(k)) addIssue('html', `${file}: data-i18n key "${k}" missing in en.json`);
    });

    const hardcoded = findHardcodedSlovakText(html);
    if (hardcoded.length) {
      if (LEGAL_ALLOWLIST.has(file)) {
        known.legalBlocks.push({ file, count: hardcoded.length });
      } else {
        // Deduplicate & limit
        const unique = [...new Set(hardcoded)].slice(0, 5);
        unique.forEach(s => addIssue('html', `${file}: hardcoded Slovak — "${s}"`));
        if (hardcoded.length > unique.length) {
          addIssue('html', `${file}: ${hardcoded.length - unique.length} more similar hardcoded Slovak texts`);
        }
      }
    }
  });

  report.html.fileCount = files.length;
}

// ---------- D. Embedded data integrity ----------
function extractEmbeddedProductCodes(html) {
  const marker = 'const PRODUCTS = ';
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const dataStart = start + marker.length;
  let i = dataStart, depth = 0, inStr = false;
  while (i < html.length) {
    const c = html.charAt(i);
    if (inStr) {
      if (c === '\\') { i += 2; continue; }
      if (c === '"') inStr = false;
      i++; continue;
    }
    if (c === '"') { inStr = true; i++; continue; }
    if (c === '[' || c === '{') depth++;
    if (c === ']' || c === '}') {
      depth--;
      if (depth === 0) {
        const json = html.substring(dataStart, i + 1);
        try {
          const arr = JSON.parse(json);
          return arr.map(p => p.code);
        } catch { return null; }
      }
    }
    i++;
  }
  return null;
}

function checkEmbed() {
  let products;
  try {
    products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
  } catch {
    addIssue('embed', 'Cannot read products.json');
    return;
  }
  const liveCodes = products.map(p => p.code).filter(Boolean);
  const liveCount = products.length;
  const liveSet = new Set(liveCodes);

  ['produkty.html', 'produkt.html'].forEach(file => {
    if (!fs.existsSync(file)) return;
    const html = fs.readFileSync(file, 'utf8');
    const embedded = extractEmbeddedProductCodes(html);
    if (embedded === null) {
      addIssue('embed', `${file}: could not parse embedded PRODUCTS`);
      return;
    }
    if (embedded.length !== liveCount) {
      addIssue('embed', `${file}: embedded has ${embedded.length} products, products.json has ${liveCount}`);
    }
    const embeddedSet = new Set(embedded);
    const extra = [...embeddedSet].filter(c => !liveSet.has(c));
    const missing = [...liveSet].filter(c => !embeddedSet.has(c));
    if (extra.length) addIssue('embed', `${file}: has ${extra.length} codes not in products.json (${extra.slice(0,3).join(', ')}${extra.length>3?'…':''})`);
    if (missing.length) addIssue('embed', `${file}: missing ${missing.length} codes from products.json (${missing.slice(0,3).join(', ')}${missing.length>3?'…':''})`);
  });

  // products-search.json count
  try {
    const search = JSON.parse(fs.readFileSync('products-search.json', 'utf8'));
    if (search.length !== liveCount) {
      addIssue('embed', `products-search.json has ${search.length} products, products.json has ${liveCount}`);
    }
  } catch {
    addIssue('embed', 'Cannot read products-search.json');
  }
}

// ---------- Print ----------
function printSection(title, issues, totalLabel, totalValue, extraInfo) {
  console.log(header(title));
  if (totalValue != null) console.log(`  ${totalLabel}: ${totalValue}`);
  if (issues.length === 0) {
    console.log(`  \u2713 OK`);
  } else {
    console.log(`  \u2717 ${issues.length} issue(s)`);
    // Show up to 15; summarize the rest
    issues.slice(0, 15).forEach(i => console.log(`    - ${i.msg}`));
    if (issues.length > 15) console.log(`    … and ${issues.length - 15} more`);
  }
  if (extraInfo) extraInfo.forEach(l => console.log(`  ${l}`));
}

function main() {
  if (run.products) checkProducts();
  if (run.langs)    checkLangs();
  if (run.html)     checkHtml();
  if (run.embed)    checkEmbed();

  console.log('\n' + '━'.repeat(55));
  console.log('Translation Check');
  console.log('━'.repeat(55));

  if (run.products) printSection('Products (products.json)', report.products, 'Total', report.products.total);
  if (run.langs)    printSection('Language files (lang/*.json)', report.langs, 'Keys', report.langs.total);
  if (run.html) {
    const extra = [];
    if (known.legalBlocks.length) {
      extra.push('⚠ Known untranslated legal blocks (allowlisted):');
      known.legalBlocks.forEach(b => extra.push(`    - ${b.file} (${b.count} Slovak text blocks)`));
    }
    printSection('HTML files', report.html, 'Files scanned', report.html.fileCount, extra);
  }
  if (run.embed) printSection('Embedded data', report.embed);

  const total = (run.products?report.products.length:0) + (run.langs?report.langs.length:0) + (run.html?report.html.length:0) + (run.embed?report.embed.length:0);

  console.log('\n' + '━'.repeat(55));
  if (total === 0) {
    console.log('All checks passed. ✓');
  } else {
    console.log(`Fix commands:`);
    if (run.products && report.products.length) {
      console.log('  → node translate-descriptions.mjs   (missing _en fields; needs ANTHROPIC_API_KEY)');
    }
    if (run.embed && report.embed.length) {
      console.log('  → node embed-products.js            (re-embed products.json into HTML)');
    }
    if (run.html && report.html.length) {
      console.log('  → manually wrap hardcoded Slovak text with data-i18n + add keys to lang/*.json');
    }
  }
  console.log('━'.repeat(55));

  // Always exit 0 (informational only)
  process.exit(0);
}

main();
