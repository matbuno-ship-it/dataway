// Tracks which Slovak source text each EN translation was made from.
//
// Every product carries `_enSource`: { name: <fp>, description: <fp>, ... } — a fingerprint
// of the SK field at the moment its `_en` counterpart was translated. When TES Shop later
// changes the SK text, the fingerprint no longer matches and the EN field is stale.
//
// CLI (run only after the EN fields were actually checked/translated):
//   node translation-sync.js stamp CODE [CODE...]   stamp given products
//   node translation-sync.js stamp --all            stamp every product (baseline)
//   node translation-sync.js status                 list stale / unstamped products

const crypto = require('crypto');
const fs = require('fs');

// SK field -> EN field. category_en is derived from CATEGORY_MAP, so it is not tracked.
const TRACKED = {
  name: 'name_en',
  description: 'description_en',
  descriptionHtml: 'descriptionHtml_en',
  specs: 'specs_en',
  subcategory: 'subcategory_en',
};

// Image tags are ignored: download-images.js rewrites their src (remote -> local) and
// strips dead ones in SK and EN HTML alike, which is not a text change. Stripping leaves
// empty <p><br /></p> wrappers behind, so empty paragraphs are ignored too.
function normalize(field, value) {
  if (value == null) return '';
  if (field === 'specs') {
    if (typeof value !== 'object') return '';
    return JSON.stringify(Object.keys(value).sort().map(k => [k, value[k]]));
  }
  let s = String(value);
  if (field === 'descriptionHtml') {
    s = s.replace(/<img\b[^>]*>/gi, '')
      .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
  }
  return s.replace(/\r/g, '').replace(/\s+/g, ' ').trim();
}

function fingerprint(field, value) {
  return crypto.createHash('sha1').update(normalize(field, value)).digest('hex').slice(0, 12);
}

function stamp(p) {
  p._enSource = {};
  for (const f of Object.keys(TRACKED)) p._enSource[f] = fingerprint(f, p[f]);
  return p;
}

// EN fields whose SK source changed since stamping; null if the product was never stamped.
function staleFields(p) {
  if (!p._enSource) return null;
  return Object.entries(TRACKED)
    .filter(([sk]) => p._enSource[sk] !== fingerprint(sk, p[sk]))
    .map(([, en]) => en);
}

// EN fields that are empty although their SK source has content.
function missingFields(p) {
  const out = [];
  if (!p.name_en) out.push('name_en');
  if (!p.category_en) out.push('category_en');
  if (!p.subcategory_en) out.push('subcategory_en');
  if (!p.description_en) out.push('description_en');
  if (p.descriptionHtml && !p.descriptionHtml_en) out.push('descriptionHtml_en');
  if (p.specs && Object.keys(p.specs).length && !(p.specs_en && Object.keys(p.specs_en).length)) out.push('specs_en');
  return out;
}

function needsTranslation(p) {
  return missingFields(p).length > 0 || (staleFields(p) || []).length > 0;
}

module.exports = { TRACKED, fingerprint, stamp, staleFields, missingFields, needsTranslation };

if (require.main === module) {
  const [cmd, ...args] = process.argv.slice(2);
  const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
  if (cmd === 'stamp') {
    const all = args.includes('--all');
    const codes = new Set(args.filter(a => a !== '--all'));
    if (!all && !codes.size) { console.error('Usage: node translation-sync.js stamp CODE [CODE...] | --all'); process.exit(1); }
    let n = 0;
    for (const p of products) {
      if (!all && !codes.has(p.code)) continue;
      codes.delete(p.code);
      const missing = missingFields(p);
      if (missing.length) { console.warn(`skip ${p.code}: missing ${missing.join(', ')}`); continue; }
      stamp(p); n++;
    }
    if (codes.size) console.warn('Unknown codes: ' + [...codes].join(', '));
    fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
    console.log(`Stamped ${n} product(s)`);
  } else if (cmd === 'status') {
    let stale = 0, unstamped = 0;
    for (const p of products) {
      const s = staleFields(p);
      if (s === null) { unstamped++; console.log(`${p.code}: not stamped`); }
      else if (s.length) { stale++; console.log(`${p.code}: stale ${s.join(', ')}`); }
    }
    console.log(`${products.length} products, ${stale} stale, ${unstamped} not stamped`);
  } else {
    console.error('Usage: node translation-sync.js stamp CODE [CODE...] | stamp --all | status');
    process.exit(1);
  }
}
