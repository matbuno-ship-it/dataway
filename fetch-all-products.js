const https = require('https');
const fs = require('fs');

const categories = [
  { slug: 'opticke-siete', name: 'Optické siete', pages: 7 },
  { slug: 'metalicke-siete', name: 'Metalické siete', pages: 12 },
  { slug: 'rozvadzace', name: 'Rozvádzače', pages: 1 },
  { slug: 'montazne-prislusenstvo', name: 'Montážne príslušenstvo', pages: 2 }
];

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractProducts(html, categoryName) {
  const products = [];
  const urls = new Set();

  // Extract product URLs
  const linkRegex = /href="(https:\/\/dataway\.eu\/produkty\/dataway-[^"]+)"/g;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    if (!urls.has(url) && url !== 'https://dataway.eu/produkty/') {
      urls.add(url);
    }
  }

  // Extract images
  const imgRegex = /src="(https:\/\/dataway\.eu\/wp-content\/uploads\/[^"]+)"/g;
  const images = [];
  while ((match = imgRegex.exec(html)) !== null) {
    images.push(match[1]);
  }

  let imgIdx = 0;
  urls.forEach(url => {
    const slug = url.split('/produkty/')[1]?.replace(/\/$/, '') || '';
    products.push({
      url,
      slug,
      image: images[imgIdx] || null,
      category: categoryName
    });
    imgIdx++;
  });

  return products;
}

async function scrapeAll() {
  const allProducts = [];

  for (const cat of categories) {
    console.log(`\n${cat.name} (${cat.pages} pages):`);

    for (let page = 1; page <= cat.pages; page++) {
      const path = page === 1
        ? `https://dataway.eu/kategorie/${cat.slug}/`
        : `https://dataway.eu/kategorie/${cat.slug}/page/${page}/`;

      try {
        const html = await fetchPage(path);
        const products = extractProducts(html, cat.name);
        allProducts.push(...products);
        process.stdout.write(`  p${page}:${products.length} `);
      } catch (e) {
        console.error(`  p${page}: ERROR ${e.message}`);
      }
    }
  }

  // Deduplicate by URL
  const unique = [...new Map(allProducts.map(p => [p.url, p])).values()];
  console.log(`\n\nTotal scraped: ${allProducts.length}, Unique: ${unique.length}`);

  const byCat = {};
  unique.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
  console.log('By category:', byCat);

  fs.writeFileSync('products-all.json', JSON.stringify(unique, null, 2), 'utf8');
  console.log('Saved to products-all.json');
}

scrapeAll();
