const https = require('https');
const fs = require('fs');

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

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

  // Extract metadata labels and info using the actual HTML structure
  // Pattern: metadata-label">LABEL</h3> ... metadata-info">VALUE</div>
  const labels = [];
  const values = [];

  const labelRegex = /metadata-label"[^>]*>([^<]*)<\/h3>/gi;
  const infoRegex = /metadata-info"[^>]*>([^<]*)<\/div>/gi;

  let m;
  while ((m = labelRegex.exec(html)) !== null) {
    labels.push(m[1].replace(/:$/, '').trim());
  }
  while ((m = infoRegex.exec(html)) !== null) {
    values.push(m[1].trim());
  }

  // Build specs object and extract code/partNumber/warranty
  const specs = {};
  const meta = {};
  for (let i = 0; i < labels.length && i < values.length; i++) {
    const label = labels[i];
    const value = values[i];
    if (!label || !value) continue;

    if (label.toLowerCase() === 'kód') {
      meta.code = value;
    } else if (label.toLowerCase().startsWith('part')) {
      meta.partNumber = value;
    } else if (label.toLowerCase() === 'záruka') {
      meta.warranty = value;
    } else {
      specs[label] = value;
    }
  }

  // Description - look for brxe-text-basic paragraphs or general <p> content
  const descMatches = [];
  // Find text in the product content area
  const textBlockRegex = /brxe-text-basic[^>]*single-portfolio[^>]*>\s*<p>([\s\S]*?)<\/p>/gi;
  while ((m = textBlockRegex.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (text.length > 20) descMatches.push(text);
  }

  // Also try generic paragraph content within the main content area
  if (descMatches.length === 0) {
    const pRegex = /brxe-text[^>]*>\s*(?:<p>)?([\s\S]*?)(?:<\/p>)?\s*<\/div>/gi;
    while ((m = pRegex.exec(html)) !== null) {
      const text = m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      if (text.length > 40 && text.length < 2000 && !text.includes('{') && !text.includes('jQuery')) {
        descMatches.push(text);
      }
    }
  }

  // Extract all product images
  const images = [];
  const imgRegex = /src="(https:\/\/dataway\.eu\/wp-content\/uploads\/[^"]+)"/g;
  while ((m = imgRegex.exec(html)) !== null) {
    if (!images.includes(m[1]) && !m[1].includes('logo') && !m[1].includes('Logo')) {
      images.push(m[1]);
    }
  }

  // Extract bullet point features from list items
  const features = [];
  const featureArea = html.match(/brxe-list[\s\S]*?<\/ul>/i);
  if (featureArea) {
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    while ((m = liRegex.exec(featureArea[0])) !== null) {
      const text = m[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 3 && text.length < 200) features.push(text);
    }
  }

  // Extract full name from h1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);

  return {
    fullName: h1Match ? h1Match[1].trim() : null,
    code: meta.code || null,
    partNumber: meta.partNumber || null,
    warranty: meta.warranty || null,
    description: descMatches.length > 0 ? descMatches.join('\n\n') : null,
    specs: Object.keys(specs).length > 0 ? specs : null,
    features: features.length > 0 ? features : null,
    images: images.length > 0 ? images : undefined,
  };
}

async function scrapeAll() {
  const batchSize = 5;
  let updated = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const promises = batch.map(async (p) => {
      try {
        const html = await fetchPage(p.url);
        const detail = extractDetail(html);

        // Update product with detail data
        if (detail.fullName) p.name = detail.fullName;
        if (detail.code) p.code = detail.code;
        if (detail.partNumber) p.partNumber = detail.partNumber;
        if (detail.warranty) p.warranty = detail.warranty;
        if (detail.description) p.description = detail.description;
        if (detail.specs) p.specs = detail.specs;
        if (detail.features) p.features = detail.features;
        if (detail.images) p.images = detail.images;

        if (detail.description || detail.specs) updated++;
        process.stdout.write('.');
      } catch (err) {
        console.error(`\nError for ${p.slug}:`, err.message);
      }
    });
    await Promise.all(promises);
  }

  console.log(`\n\nUpdated ${updated}/${products.length} products with details`);

  const withDesc = products.filter(p => p.description).length;
  const withSpecs = products.filter(p => p.specs).length;
  const withCode = products.filter(p => p.code).length;
  const withPartNum = products.filter(p => p.partNumber).length;
  const withFullName = products.filter(p => p.fullName || (p.name && p.name.includes('DATAWAY'))).length;
  console.log(`Descriptions: ${withDesc}, Specs: ${withSpecs}, Codes: ${withCode}, PartNumbers: ${withPartNum}, FullNames: ${withFullName}`);

  fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
  console.log('Saved updated products.json');
}

scrapeAll();
