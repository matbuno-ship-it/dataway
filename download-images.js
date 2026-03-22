const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const imgDir = path.join(__dirname, 'images');
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

// Collect all unique images
const allImages = new Set();
products.forEach(p => {
  if (p.image) allImages.add(p.image);
  if (p.images) p.images.forEach(i => allImages.add(i));
});

const imageList = [...allImages];
console.log('Total images to download:', imageList.length);

function getLocalName(url) {
  // Extract attid from tesshop URL
  const attidMatch = url.match(/attid=(\d+)/);
  if (attidMatch) return attidMatch[1] + '.jpg';
  // For other URLs, use filename
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
}

function download(url, filepath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 500) {
      resolve('exists');
      return;
    }
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        resolve('skip-' + res.statusCode);
        return;
      }
      const ws = fs.createWriteStream(filepath);
      res.pipe(ws);
      ws.on('finish', () => { ws.close(); resolve('ok'); });
      ws.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

async function downloadAll() {
  const batchSize = 10;
  let done = 0, ok = 0, skip = 0, err = 0;

  for (let i = 0; i < imageList.length; i += batchSize) {
    const batch = imageList.slice(i, i + batchSize);
    await Promise.all(batch.map(async (url) => {
      const localName = getLocalName(url);
      const filepath = path.join(imgDir, localName);
      try {
        const result = await download(url, filepath);
        if (result === 'ok' || result === 'exists') ok++;
        else skip++;
      } catch (e) {
        err++;
      }
      done++;
    }));
    process.stdout.write(`\r${done}/${imageList.length} (ok:${ok} skip:${skip} err:${err})`);
  }

  console.log(`\n\nDone: ${ok} downloaded, ${skip} skipped, ${err} errors`);

  // Update products.json with local paths
  products.forEach(p => {
    if (p.image) {
      const local = 'images/' + getLocalName(p.image);
      p.image = local;
    }
    if (p.images) {
      p.images = p.images.map(url => 'images/' + getLocalName(url));
    }
  });

  fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
  console.log('Updated products.json with local image paths');
}

downloadAll();
