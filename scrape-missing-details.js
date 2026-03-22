const https = require('https');
const fs = require('fs');

const products = JSON.parse(fs.readFileSync('products-merged.json', 'utf8'));
const needDetails = products.filter(p => !p.description);
console.log(`Scraping details for ${needDetails.length} products...`);

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractDetail(html) {
  const detail = {};

  // Name from og:title
  const ogTitle = html.match(/property="og:title"\s*content="([^"]+)"/i);
  if (ogTitle) detail.name = ogTitle[1].replace(/\s*-\s*DataWay$/i, '').trim();

  // Metadata labels and info
  const labels = [];
  const values = [];
  const labelRegex = /metadata-label"[^>]*>([^<]*)<\/h3>/gi;
  const infoRegex = /metadata-info"[^>]*>([^<]*)<\/div>/gi;
  let m;
  while ((m = labelRegex.exec(html)) !== null) labels.push(m[1].replace(/:$/, '').trim());
  while ((m = infoRegex.exec(html)) !== null) values.push(m[1].trim());

  const specs = {};
  for (let i = 0; i < labels.length && i < values.length; i++) {
    const label = labels[i], value = values[i];
    if (!label || !value) continue;
    if (label.toLowerCase() === 'kód') detail.code = value;
    else if (label.toLowerCase().startsWith('part')) detail.partNumber = value;
    else if (label.toLowerCase() === 'záruka') detail.warranty = value;
    else specs[label] = value;
  }
  if (Object.keys(specs).length > 0) detail.specs = specs;

  // Description from brxe-text-basic
  const descMatches = [];
  const textBlockRegex = /brxe-text-basic[^>]*>\s*<p>([\s\S]*?)<\/p>/gi;
  while ((m = textBlockRegex.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&deg;/g, '°').replace(/&hellip;/g, '...').replace(/\s+/g, ' ').trim();
    if (text.length > 20) descMatches.push(text);
  }
  if (descMatches.length === 0) {
    const pRegex = /brxe-text[^>]*>\s*(?:<p>)?([\s\S]*?)(?:<\/p>)?\s*<\/div>/gi;
    while ((m = pRegex.exec(html)) !== null) {
      const text = m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&deg;/g, '°').replace(/\s+/g, ' ').trim();
      if (text.length > 40 && text.length < 2000 && !text.includes('{') && !text.includes('jQuery')) descMatches.push(text);
    }
  }
  if (descMatches.length > 0) detail.description = descMatches.join('\n\n');

  // Images
  const images = [];
  const imgRegex = /src="(https:\/\/dataway\.eu\/wp-content\/uploads\/[^"]+)"/g;
  while ((m = imgRegex.exec(html)) !== null) {
    if (!images.includes(m[1]) && !m[1].toLowerCase().includes('logo')) images.push(m[1]);
  }
  if (images.length > 0) detail.images = images;

  return detail;
}

// Subcategory rules
const subcategoryRules = [
  { category: 'Optické siete', pattern: /adapt[eé]r/i, subcategory: 'Optické adaptéry' },
  { category: 'Optické siete', pattern: /pigtail/i, subcategory: 'Pigtaily' },
  { category: 'Optické siete', pattern: /patchcord/i, subcategory: 'Patchcordy' },
  { category: 'Optické siete', pattern: /spojka|fodc|box|splitter/i, subcategory: 'Pasívne prvky' },
  { category: 'Optické siete', pattern: /kotva|ri.df|ri.dd|pa.1700|pa.500/i, subcategory: 'Výstavba siete' },
  { category: 'Optické siete', pattern: /ochrana|primarn|ochrann/i, subcategory: 'Príslušenstvo pre káble' },
  { category: 'Optické siete', pattern: /drag|fish|nastroj|noz|stripper|meter|tester/i, subcategory: 'Náradie a prístroje' },
  { category: 'Optické siete', pattern: /panel|kazeta|organizér/i, subcategory: 'Patch panely' },
  { category: 'Optické siete', pattern: /kabel|kábel|cable|vlákn/i, subcategory: 'Optické káble' },
  { category: 'Optické siete', pattern: /ds.8|zásuvk|zasuvk|roseta/i, subcategory: 'Pasívne prvky' },
  { category: 'Metalické siete', pattern: /patch.k[aá]bel|prepojovac/i, subcategory: 'Prepojovacie káble' },
  { category: 'Metalické siete', pattern: /patchcord/i, subcategory: 'Prepojovacie káble' },
  { category: 'Metalické siete', pattern: /konektor/i, subcategory: 'Konektory' },
  { category: 'Metalické siete', pattern: /ochrana.*konekt|100ks.ochrana/i, subcategory: 'Konektory' },
  { category: 'Metalické siete', pattern: /spojka/i, subcategory: 'Spojky' },
  { category: 'Metalické siete', pattern: /keyston/i, subcategory: 'Keystony' },
  { category: 'Metalické siete', pattern: /panel/i, subcategory: 'Patch panely' },
  { category: 'Metalické siete', pattern: /kabel|kábel|cable|lank/i, subcategory: 'Metalická kabeláž' },
  { category: 'Rozvádzače', pattern: /rozvadzac|rozv[aá]dza[cč]/i, subcategory: 'Rozvádzače 19"' },
  { category: 'Rozvádzače', pattern: /polic[ae]/i, subcategory: 'Police' },
  { category: 'Rozvádzače', pattern: /pdu|napajac|prepat/i, subcategory: 'PDU a napájanie' },
  { category: 'Rozvádzače', pattern: /panel|vyvazovac|instalacn|sada|keystone|modul/i, subcategory: 'Príslušenstvo' },
  { category: 'Montážne príslušenstvo', pattern: /krimpo|narazac|orezavac|odizolov|nastroj|noze|tester|network/i, subcategory: 'Náradie' },
  { category: 'Montážne príslušenstvo', pattern: /pask[ay]|spona|napinac|aql|mbt|s.200|s.100/i, subcategory: 'Napínacie pásky a spony' },
  { category: 'Montážne príslušenstvo', pattern: /zlab|roh|zaslepk|kanál/i, subcategory: 'Káblové žľaby' },
  { category: 'Montážne príslušenstvo', pattern: /zasuvk|uw|hmozdink/i, subcategory: 'Inštalačný materiál' },
  { category: 'Montážne príslušenstvo', pattern: /kotv/i, subcategory: 'Kotvy a uchytenie' },
];

async function scrapeAll() {
  const batchSize = 5;
  let done = 0;

  for (let i = 0; i < needDetails.length; i += batchSize) {
    const batch = needDetails.slice(i, i + batchSize);
    await Promise.all(batch.map(async (p) => {
      try {
        const html = await fetchPage(p.url);
        const detail = extractDetail(html);
        if (detail.name) p.name = detail.name;
        if (detail.code) p.code = detail.code;
        if (detail.partNumber) p.partNumber = detail.partNumber;
        if (detail.warranty) p.warranty = detail.warranty;
        if (detail.description) p.description = detail.description;
        if (detail.specs) p.specs = detail.specs;
        if (detail.images) p.images = detail.images;
        done++;
      } catch (e) {}
    }));
    process.stdout.write(`\r${done}/${needDetails.length}`);
  }

  // Assign subcategories
  products.forEach(p => {
    if (!p.subcategory) {
      const name = (p.name || p.slug).toLowerCase();
      const rule = subcategoryRules.find(r => r.category === p.category && r.pattern.test(name));
      p.subcategory = rule ? rule.subcategory : 'Ostatné';
    }
  });

  console.log('\n\nStats:');
  const withDesc = products.filter(p => p.description).length;
  const withCode = products.filter(p => p.code).length;
  console.log(`Descriptions: ${withDesc}/${products.length}, Codes: ${withCode}/${products.length}`);

  const byCat = {};
  products.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
  console.log('By category:', byCat);

  fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
  console.log('Saved products.json with', products.length, 'products');
}

scrapeAll();
