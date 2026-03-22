const https = require('https');
const fs = require('fs');

const categories = [
  { slug: 'opticke-siete', name: 'Optické siete' },
  { slug: 'metalicke-siete', name: 'Metalické siete' },
  { slug: 'rozvadzace', name: 'Rozvádzače' },
  { slug: 'montazne-prislusenstvo', name: 'Montážne príslušenstvo' }
];

function fetchPage(slug, page) {
  return new Promise((resolve, reject) => {
    const path = page === 1
      ? `/kategorie/${slug}/`
      : `/kategorie/${slug}/page/${page}/`;

    https.get(`https://dataway.eu${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractProducts(html, categoryName) {
  const products = [];

  // Extract product URLs and names from links
  const linkRegex = /href="(https:\/\/dataway\.eu\/produkty\/[^"]+)"/g;
  const urls = new Set();
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    if (match[1] !== 'https://dataway.eu/produkty/') {
      urls.add(match[1]);
    }
  }

  // Extract image URLs associated with products
  const imgRegex = /src="(https:\/\/dataway\.eu\/wp-content\/uploads\/[^"]+)"/g;
  const images = [];
  while ((match = imgRegex.exec(html)) !== null) {
    images.push(match[1]);
  }

  // Extract product names from title attributes or alt text
  const titleRegex = /(?:alt|title)="(DATAWAY[^"]*)"/gi;
  const names = [];
  while ((match = titleRegex.exec(html)) !== null) {
    if (!names.includes(match[1])) {
      names.push(match[1]);
    }
  }

  // Build product list from URLs (most reliable)
  let imgIdx = 0;
  urls.forEach(url => {
    // Extract name from URL slug
    const slug = url.split('/produkty/')[1]?.replace(/\/$/, '') || '';
    const nameFromSlug = slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/^Dataway /, 'DATAWAY ');

    // Try to find matching name from alt/title
    const matchingName = names.find(n =>
      n.toLowerCase().replace(/[^a-z0-9]/g, '').includes(
        slug.replace(/dataway-/, '').replace(/-/g, '').substring(0, 20)
      )
    ) || nameFromSlug;

    products.push({
      name: matchingName,
      url: url,
      slug: slug,
      image: images[imgIdx] || null,
      category: categoryName
    });
    imgIdx++;
  });

  return products;
}

function getMaxPage(html) {
  const pageNums = [];
  const pageRegex = /\/page\/(\d+)\//g;
  let match;
  while ((match = pageRegex.exec(html)) !== null) {
    pageNums.push(parseInt(match[1]));
  }
  return pageNums.length > 0 ? Math.max(...pageNums) : 1;
}

async function scrapeAll() {
  const allProducts = [];

  for (const cat of categories) {
    console.log(`\nScraping: ${cat.name}...`);

    // Fetch page 1
    const html1 = await fetchPage(cat.slug, 1);
    const maxPage = getMaxPage(html1);
    console.log(`  Pages: ${maxPage}`);

    let products = extractProducts(html1, cat.name);
    console.log(`  Page 1: ${products.length} products`);
    allProducts.push(...products);

    // Fetch remaining pages
    for (let p = 2; p <= maxPage; p++) {
      const html = await fetchPage(cat.slug, p);
      const pageProducts = extractProducts(html, cat.name);
      console.log(`  Page ${p}: ${pageProducts.length} products`);
      allProducts.push(...pageProducts);
    }
  }

  // Deduplicate by URL
  const unique = [...new Map(allProducts.map(p => [p.url, p])).values()];

  console.log(`\nTotal unique products: ${unique.length}`);

  // Save products
  fs.writeFileSync('products.json', JSON.stringify(unique, null, 2), 'utf8');
  console.log('Saved to products.json');

  // Print summary
  const byCat = {};
  unique.forEach(p => { byCat[p.category] = (byCat[p.category] || 0) + 1; });
  console.log('\nBy category:', byCat);
}

scrapeAll().catch(console.error);
