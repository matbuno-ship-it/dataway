const fs = require('fs');

// Parse the XML API response
const xml = fs.readFileSync('tesshop-api-response.xml', 'utf8');
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

// Extract all SHOPITEMs from XML
function parseShopItems(xml) {
  const items = [];
  const itemRegex = /<SHOPITEM[^>]*>([\s\S]*?)<\/SHOPITEM>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];

    const get = (tag) => {
      const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>'));
      return m ? m[1].trim() : null;
    };

    // Get all images
    const images = [];
    const imgRegex = /<IMAGE>([^<]+)<\/IMAGE>/g;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(block)) !== null) {
      images.push(imgMatch[1].trim());
    }

    // Get text properties (specs)
    const specs = {};
    const propRegex = /<TEXT_PROPERTY>\s*<NAME>([^<]*)<\/NAME>\s*<VALUE>([^<]*)<\/VALUE>\s*<\/TEXT_PROPERTY>/g;
    let propMatch;
    while ((propMatch = propRegex.exec(block)) !== null) {
      const key = propMatch[1].trim();
      const val = propMatch[2].trim();
      if (key && val) specs[key] = val;
    }

    // Get categories
    const categories = [];
    const catRegex = /<CATEGORY[^>]*>([^<]+)<\/CATEGORY>/g;
    let catMatch;
    while ((catMatch = catRegex.exec(block)) !== null) {
      categories.push(catMatch[1].trim());
    }

    // Decode HTML entities in description
    let desc = get('DESCRIPTION') || '';
    desc = desc
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const shortDesc = get('SHORT_DESCRIPTION') || '';

    items.push({
      code: get('CODE'),
      ean: get('EAN'),
      partNumber: get('PART_NUMBER'),
      name: get('NAME'),
      shortDescription: shortDesc,
      description: desc || shortDesc,
      warranty: get('WARRANTY'),
      images: images,
      specs: specs,
      categories: categories,
      isNew: get('NEW') === '1',
    });
  }

  return items;
}

const apiItems = parseShopItems(xml);
console.log('API items parsed:', apiItems.length);

// Match API items to our products by partNumber or code
let matched = 0;
let unmatched = 0;
let imageUpdated = 0;

products.forEach(prod => {
  // Try matching by partNumber first, then by code
  let apiItem = apiItems.find(a => a.partNumber && prod.partNumber && a.partNumber === prod.partNumber);
  if (!apiItem) {
    apiItem = apiItems.find(a => a.code && prod.code && a.code === prod.code);
  }
  if (!apiItem) {
    // Try matching by name similarity
    apiItem = apiItems.find(a => a.name && prod.name && a.name.toLowerCase() === prod.name.toLowerCase());
  }

  if (apiItem) {
    matched++;

    // Update images from API (tesshop has the latest)
    if (apiItem.images && apiItem.images.length > 0) {
      const oldImage = prod.image;
      prod.images = apiItem.images;
      prod.image = apiItem.images[0];
      if (oldImage !== prod.image) imageUpdated++;
    }

    // Update specs from API if available
    if (Object.keys(apiItem.specs).length > 0) {
      prod.specs = apiItem.specs;
    }

    // Update description from API
    if (apiItem.description) {
      prod.description = apiItem.description;
    }

    // Update warranty
    if (apiItem.warranty) {
      prod.warranty = apiItem.warranty + ' mesiacov';
    }
  } else {
    unmatched++;
  }
});

console.log('Matched:', matched);
console.log('Unmatched:', unmatched);
console.log('Images updated:', imageUpdated);

// Show unmatched products
if (unmatched > 0) {
  const unmatchedProds = products.filter(p => {
    return !apiItems.find(a =>
      (a.partNumber && p.partNumber && a.partNumber === p.partNumber) ||
      (a.code && p.code && a.code === p.code) ||
      (a.name && p.name && a.name.toLowerCase() === p.name.toLowerCase())
    );
  });
  console.log('\nUnmatched products (first 10):');
  unmatchedProds.slice(0, 10).forEach(p => console.log('  ', p.code, '-', p.name));
}

// Check the specific product the client complained about
const fodc = products.find(p => p.slug === 'dataway-fodc-144-opticka-spojka-144-s-vybavou-6x-kazeta');
if (fodc) {
  console.log('\nFODC-144 product:');
  console.log('  Images:', fodc.images);
}

fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
console.log('\nSaved updated products.json');
