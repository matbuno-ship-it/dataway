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

async function fixNames() {
  const batchSize = 5;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    await Promise.all(batch.map(async (p) => {
      try {
        const html = await fetchPage(p.url);
        // Extract from og:title or title tag
        const ogTitle = html.match(/property="og:title"\s*content="([^"]+)"/i);
        if (ogTitle) {
          p.name = ogTitle[1].replace(/\s*-\s*DataWay$/i, '').trim();
        } else {
          const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch) {
            p.name = titleMatch[1].replace(/\s*-\s*DataWay$/i, '').trim();
          }
        }
        // Fix HTML entities in description
        if (p.description) {
          p.description = p.description
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&deg;/g, '°')
            .replace(/&hellip;/g, '...')
            .replace(/&#8211;/g, '–')
            .replace(/&#8217;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
        }
        process.stdout.write('.');
      } catch (e) {
        console.error(`\nError: ${p.slug}`, e.message);
      }
    }));
  }

  console.log('\n\nSample names:');
  products.slice(0, 5).forEach(p => console.log(' ', p.name));

  fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
  console.log('Saved.');
}

fixNames();
