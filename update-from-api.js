const fs = require('fs');

const xml = fs.readFileSync('tesshop-api-response.xml', 'utf8');
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

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
    const propRegex = /<TEXT_PROPERTY>\s*<NAME>([^<]*)<\/NAME>\s*<VALUE>([\s\S]*?)<\/VALUE>\s*<\/TEXT_PROPERTY>/g;
    let propMatch;
    while ((propMatch = propRegex.exec(block)) !== null) {
      const key = propMatch[1].trim();
      const val = propMatch[2].trim();
      if (key && val) specs[key] = val;
    }

    // Get DESCRIPTION - keep HTML formatting but sanitize
    let rawDesc = get('DESCRIPTION') || '';
    // Decode HTML entities
    rawDesc = rawDesc
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;nbsp;/g, ' ').replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ').replace(/&deg;/g, '°').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
      .replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'").replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"')
      .replace(/&hellip;/g, '...');

    // Sanitize HTML: only allow safe tags
    // Remove style attributes but keep the tags
    rawDesc = rawDesc.replace(/\s*style="[^"]*"/gi, '');
    // Remove empty paragraphs
    rawDesc = rawDesc.replace(/<p>\s*\s*<\/p>/gi, '');
    rawDesc = rawDesc.replace(/<p>\s*<\/p>/gi, '');
    // Remove script/iframe/form tags completely
    rawDesc = rawDesc.replace(/<(script|iframe|form|input|textarea|select|button|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '');
    rawDesc = rawDesc.replace(/<(script|iframe|form|input|textarea|select|button|object|embed)[^>]*\/?>/gi, '');
    // Clean up whitespace
    rawDesc = rawDesc.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    const shortDesc = get('SHORT_DESCRIPTION') || '';

    items.push({
      code: get('CODE'),
      partNumber: get('PART_NUMBER'),
      name: get('NAME'),
      shortDescription: shortDesc,
      descriptionHtml: rawDesc || null,
      description: shortDesc, // plain text fallback
      warranty: get('WARRANTY'),
      images: images,
      specs: specs,
    });
  }

  return items;
}

const apiItems = parseShopItems(xml);
console.log('API items parsed:', apiItems.length);

let matched = 0, unmatched = 0, imageUpdated = 0, descUpdated = 0;

products.forEach(prod => {
  let apiItem = apiItems.find(a => a.partNumber && prod.partNumber && a.partNumber === prod.partNumber);
  if (!apiItem) apiItem = apiItems.find(a => a.code && prod.code && a.code === prod.code);
  if (!apiItem) apiItem = apiItems.find(a => a.name && prod.name && a.name.toLowerCase() === prod.name.toLowerCase());

  if (apiItem) {
    matched++;

    // Update images
    if (apiItem.images && apiItem.images.length > 0) {
      const oldImage = prod.image;
      prod.images = apiItem.images;
      prod.image = apiItem.images[0];
      if (oldImage !== prod.image) imageUpdated++;
    }

    // Update description with HTML version
    if (apiItem.descriptionHtml) {
      prod.descriptionHtml = apiItem.descriptionHtml;
      descUpdated++;
    }

    // Update plain description
    if (apiItem.shortDescription) {
      prod.description = apiItem.shortDescription;
    }

    // Update specs
    if (Object.keys(apiItem.specs).length > 0) {
      prod.specs = apiItem.specs;
    }

    // Update warranty
    if (apiItem.warranty) {
      prod.warranty = apiItem.warranty + ' mesiacov';
    }

    // Update name from API (most accurate)
    if (apiItem.name) {
      prod.name = apiItem.name;
    }
  } else {
    unmatched++;
  }
});

console.log('Matched:', matched);
console.log('Unmatched:', unmatched);
console.log('Images updated:', imageUpdated);
console.log('Descriptions with HTML:', descUpdated);

// Stats on HTML content
const withUl = products.filter(p => p.descriptionHtml && p.descriptionHtml.includes('<ul')).length;
const withStrong = products.filter(p => p.descriptionHtml && p.descriptionHtml.includes('<strong')).length;
const withP = products.filter(p => p.descriptionHtml && p.descriptionHtml.includes('<p>')).length;
console.log('\nFormatting stats:');
console.log('  With paragraphs:', withP);
console.log('  With bold text:', withStrong);
console.log('  With bullet lists:', withUl);

fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
console.log('\nSaved products.json');
