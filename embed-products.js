const fs = require('fs');
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const json = JSON.stringify(products);

function embedInFile(filename) {
  const html = fs.readFileSync(filename, 'utf8');
  const marker = 'const PRODUCTS = ';
  const markerPos = html.indexOf(marker);
  if (markerPos === -1) {
    console.log(filename + ': marker not found');
    return;
  }

  const before = html.substring(0, markerPos + marker.length);

  // Find end: skip past the current value to the next line starting with whitespace
  // The pattern after the JSON array is: ;\n\n    // ----
  const dataStart = markerPos + marker.length;

  // Walk through the string character by character
  let i = dataStart;
  let depth = 0;
  let inStr = false;
  let prevChar = '';

  while (i < html.length) {
    const c = html.charAt(i);

    if (inStr) {
      if (c === '\\') {
        i += 2; // skip escaped char
        continue;
      }
      if (c === '"') {
        inStr = false;
      }
      i++;
      continue;
    }

    if (c === '"') {
      inStr = true;
      i++;
      continue;
    }

    if (c === '[' || c === '{') depth++;
    if (c === ']' || c === '}') depth--;

    if (depth === 0 && (c === ']' || c === '}')) {
      // Found the end of the data structure
      // Skip past the semicolon
      let endPos = i + 1;
      while (endPos < html.length && html.charAt(endPos) !== ';') endPos++;
      endPos++; // include semicolon

      const after = html.substring(endPos);
      const result = before + json + ';' + after;
      fs.writeFileSync(filename, result, 'utf8');
      console.log(filename + ': embedded ' + products.length + ' products');

      // Verify
      const check = result.indexOf('&ndash;');
      console.log('  ndash check:', check === -1 ? 'clean' : 'STILL HAS IT at ' + check);
      return;
    }

    i++;
  }

  console.log(filename + ': could not find end');
}

embedInFile('produkty.html');
embedInFile('produkt.html');

// Generate lightweight search index
const mini = products.map(p => ({
  s: p.slug, n: p.name, ne: p.name_en, c: p.category, ce: p.category_en,
  sc: p.subcategory, sce: p.subcategory_en, co: p.code, pn: p.partNumber, i: p.image
}));
fs.writeFileSync('products-search.json', JSON.stringify(mini));
console.log('products-search.json: ' + (JSON.stringify(mini).length / 1024).toFixed(0) + 'KB (' + mini.length + ' products)');
