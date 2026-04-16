const fs = require('fs');

const xml = fs.readFileSync('tesshop-api-response.xml', 'utf8');

// Subcategory rules
const subcategoryRules = [
  { category: 'Optické siete', pattern: /adaptér|adapter/i, subcategory: 'Optické adaptéry' },
  { category: 'Optické siete', pattern: /pigtail/i, subcategory: 'Pigtaily' },
  { category: 'Optické siete', pattern: /patchcord/i, subcategory: 'Patchcordy' },
  { category: 'Optické siete', pattern: /spojka|fodc|box|splitter|FTTH|fttx/i, subcategory: 'Pasívne prvky' },
  { category: 'Optické siete', pattern: /kotva|ri-df|ri-dd|pa-1700|pa-500|PA-/i, subcategory: 'Výstavba siete' },
  { category: 'Optické siete', pattern: /ochrana|primárn|ochranná|chránička/i, subcategory: 'Príslušenstvo pre káble' },
  { category: 'Optické siete', pattern: /drag|fish|nástroj|nôž|stripper|meter|tester|kliešte|rezač/i, subcategory: 'Náradie a prístroje' },
  { category: 'Optické siete', pattern: /panel|kazeta|organizér/i, subcategory: 'Patch panely' },
  { category: 'Optické siete', pattern: /kábel|cable|vlákn|DROP|ADSS|FLAT/i, subcategory: 'Optické káble' },
  { category: 'Optické siete', pattern: /zásuvk|zasuvk|roseta/i, subcategory: 'Pasívne prvky' },
  { category: 'Metalické siete', pattern: /patch kábel|prepojovac/i, subcategory: 'Prepojovacie káble' },
  { category: 'Metalické siete', pattern: /konektor/i, subcategory: 'Konektory' },
  { category: 'Metalické siete', pattern: /ochrana/i, subcategory: 'Konektory' },
  { category: 'Metalické siete', pattern: /spojka/i, subcategory: 'Spojky' },
  { category: 'Metalické siete', pattern: /keyston/i, subcategory: 'Keystony' },
  { category: 'Metalické siete', pattern: /panel/i, subcategory: 'Patch panely' },
  { category: 'Metalické siete', pattern: /kábel|cable|lank/i, subcategory: 'Metalická kabeláž' },
  { category: 'Rozvádzače', pattern: /rozvádzač.*10"|rozvadzac.*10"/i, subcategory: 'Rozvádzače 10"' },
  { category: 'Rozvádzače', pattern: /rozvádzač|rozvadzac/i, subcategory: 'Rozvádzače 19"' },
  { category: 'Rozvádzače', pattern: /polic/i, subcategory: 'Police' },
  { category: 'Rozvádzače', pattern: /pdu|napájac|prepäť/i, subcategory: 'PDU a napájanie' },
  { category: 'Rozvádzače', pattern: /panel|vyväzovac|inštalačn|sada|keystone|modul/i, subcategory: 'Príslušenstvo' },
  { category: 'Montážne príslušenstvo', pattern: /krimpo|nárazac|orezávač|odizolov|nástroj|nôž|tester|network/i, subcategory: 'Náradie' },
  { category: 'Montážne príslušenstvo', pattern: /pásk|spona|napínac|AQL|MBT|S-200|S-100/i, subcategory: 'Napínacie pásky a spony' },
  { category: 'Montážne príslušenstvo', pattern: /žľab|roh|záslepk|kanál/i, subcategory: 'Káblové žľaby' },
  { category: 'Montážne príslušenstvo', pattern: /zásuvk|UW|hmožd/i, subcategory: 'Inštalačný materiál' },
  { category: 'Montážne príslušenstvo', pattern: /kotv/i, subcategory: 'Kotvy a uchytenie' },
];

function getMainCategory(categories) {
  for (const cat of categories) {
    if (cat.includes('Optické siete') || cat.includes('Optick')) return 'Optické siete';
    if (cat.includes('Metalické siete') || cat.includes('Metalick')) return 'Metalické siete';
    if (cat.includes('Rozvádzač')) return 'Rozvádzače';
    if (cat.includes('Montážne') || cat.includes('Montáž')) return 'Montážne príslušenstvo';
  }
  return 'Ostatné';
}

function getSubcategory(name, category) {
  const rule = subcategoryRules.find(r => r.category === category && r.pattern.test(name));
  return rule ? rule.subcategory : 'Ostatné';
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[áà]/g, 'a').replace(/[čć]/g, 'c').replace(/[ďđ]/g, 'd').replace(/[éěè]/g, 'e')
    .replace(/[íì]/g, 'i').replace(/[ĺľ]/g, 'l').replace(/[ňñ]/g, 'n').replace(/[óôò]/g, 'o')
    .replace(/[ŕř]/g, 'r').replace(/[šś]/g, 's').replace(/[ťț]/g, 't').replace(/[úůù]/g, 'u')
    .replace(/[ýÿ]/g, 'y').replace(/[žź]/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function parseAllProducts(xml) {
  const products = [];
  const itemRegex = /<SHOPITEM[^>]*>([\s\S]*?)<\/SHOPITEM>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const get = (tag) => {
      const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>'));
      return m ? m[1].trim() : null;
    };

    const name = get('NAME');
    if (!name) continue;

    // Images
    const images = [];
    const imgRegex = /<IMAGE>([^<]+)<\/IMAGE>/g;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(block)) !== null) {
      images.push(imgMatch[1].trim());
    }

    // Specs
    const specs = {};
    const propRegex = /<TEXT_PROPERTY>\s*<NAME>([^<]*)<\/NAME>\s*<VALUE>([\s\S]*?)<\/VALUE>\s*<\/TEXT_PROPERTY>/g;
    let propMatch;
    while ((propMatch = propRegex.exec(block)) !== null) {
      const key = propMatch[1].trim();
      const val = propMatch[2].trim();
      if (key && val) specs[key] = val;
    }

    // Related files (datasheets, test reports, etc.)
    const files = [];
    const fileRegex = /<RELATED_FILE>\s*<TEXT>([^<]*)<\/TEXT>\s*<URL>([^<]*)<\/URL>\s*<\/RELATED_FILE>/g;
    let fileMatch;
    while ((fileMatch = fileRegex.exec(block)) !== null) {
      const text = fileMatch[1].trim();
      const url = fileMatch[2].trim();
      if (text && url) files.push({ text, url });
    }

    // Categories
    const categories = [];
    const catRegex = /<CATEGORY[^>]*>([^<]+)<\/CATEGORY>/g;
    let catMatch;
    while ((catMatch = catRegex.exec(block)) !== null) {
      categories.push(catMatch[1].trim());
    }

    // Description HTML
    let descHtml = get('DESCRIPTION') || '';
    descHtml = descHtml
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ').replace(/&deg;/g, '°').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
      .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'").replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"')
      .replace(/&hellip;/g, '...');
    descHtml = descHtml.replace(/\s*style="[^"]*"/gi, '');
    descHtml = descHtml.replace(/<p>\s*\s*<\/p>/gi, '').replace(/<p>\s*<\/p>/gi, '');
    descHtml = descHtml.replace(/<(script|iframe|form|input|textarea|select|button|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '');
    descHtml = descHtml.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    const shortDesc = get('SHORT_DESCRIPTION') || '';
    const code = get('CODE');
    const partNumber = get('PART_NUMBER');
    const warranty = get('WARRANTY');
    const category = getMainCategory(categories);
    const slug = slugify(name);

    products.push({
      name,
      slug,
      code,
      partNumber,
      warranty: warranty ? warranty + ' mesiacov' : null,
      category,
      subcategory: getSubcategory(name, category),
      description: shortDesc,
      descriptionHtml: descHtml || null,
      specs: Object.keys(specs).length > 0 ? specs : null,
      image: images[0] || null,
      images: images.length > 0 ? images : null,
      files: files.length > 0 ? files : null,
    });
  }

  return products;
}

const products = parseAllProducts(xml);

// Deduplicate by slug (keep first)
const seen = new Set();
const unique = products.filter(p => {
  if (seen.has(p.slug)) return false;
  seen.add(p.slug);
  return true;
});

// Preserve existing EN translations from previous products.json
const EN_FIELDS = ['name_en', 'category_en', 'subcategory_en', 'description_en', 'descriptionHtml_en', 'specs_en'];
try {
  const prev = JSON.parse(fs.readFileSync('products.json', 'utf8'));
  const prevByCode = {};
  prev.forEach(p => { if (p.code) prevByCode[p.code] = p; });
  let restored = 0;
  unique.forEach(p => {
    const old = prevByCode[p.code];
    if (!old) return;
    EN_FIELDS.forEach(f => {
      if (old[f] && !p[f]) {
        p[f] = old[f];
      }
    });
    restored++;
  });
  const withEn = unique.filter(p => p.name_en).length;
  console.log('Restored EN translations for', withEn, 'products (matched', restored, 'by code)');
} catch (e) {
  console.log('No previous products.json found, skipping EN restore');
}

console.log('Parsed from API:', products.length);
console.log('Unique by slug:', unique.length);

// Stats
const byCat = {};
unique.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
console.log('\nBy category:', byCat);

const withDesc = unique.filter(p => p.descriptionHtml).length;
const withSpecs = unique.filter(p => p.specs).length;
const withImages = unique.filter(p => p.images && p.images.length > 0).length;
const withBullets = unique.filter(p => p.descriptionHtml && p.descriptionHtml.includes('<ul')).length;
const withFiles = unique.filter(p => p.files).length;
const totalFiles = unique.reduce((sum, p) => sum + (p.files ? p.files.length : 0), 0);
console.log('\nDescriptions:', withDesc);
console.log('Specs:', withSpecs);
console.log('Images:', withImages);
console.log('With bullet lists:', withBullets);
console.log('With files/datasheets:', withFiles, '(' + totalFiles + ' files total)');

fs.writeFileSync('products.json', JSON.stringify(unique, null, 2), 'utf8');
console.log('\nSaved products.json with', unique.length, 'products');
