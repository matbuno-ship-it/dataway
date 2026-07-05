const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const imgDir = path.join(__dirname, 'images');
const filesDir = path.join(__dirname, 'files');
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);
if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir);

const isRemote = (u) => /^https?:\/\//.test(u);
const isTesshop = (u) => /^https?:\/\/(www\.)?tesshop\.sk\//.test(u);

function getLocalName(url) {
  // Extract attid from tesshop URL
  const attidMatch = url.match(/attid=(\d+)/);
  if (attidMatch) return attidMatch[1] + '.jpg';
  // Some tesshop images use stiid= instead of attid= — must not collapse to "img.asp"
  const stiidMatch = url.match(/stiid=(\d+)/);
  if (stiidMatch) return 'sti' + stiidMatch[1] + '.jpg';
  // For other URLs, use filename
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
}

const EXT_BY_TYPE = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/zip': '.zip',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
};

// Datasheets are named <attid>.<ext-from-content-type>; extension is unknown until
// downloaded, so look up any existing file with that attid prefix.
function findLocalDatasheet(url) {
  const m = url.match(/attid=(\d+)/);
  if (!m) return null;
  const hit = fs.readdirSync(filesDir).find(f => f.startsWith(m[1] + '.'));
  if (!hit) return null;
  const full = path.join(filesDir, hit);
  return fs.statSync(full).size > 500 ? 'files/' + hit : null;
}

function download(url, filepath, requireImage) {
  return new Promise((resolve, reject) => {
    if (filepath && fs.existsSync(filepath) && fs.statSync(filepath).size > 500) {
      resolve({ status: 'exists', path: filepath });
      return;
    }
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 20000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, filepath, requireImage).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        resolve({ status: 'skip-' + res.statusCode });
        return;
      }
      const ct = (res.headers['content-type'] || '').split(';')[0].trim();
      // Guard against HTML error pages served with status 200
      if (ct === 'text/html' || (requireImage && !ct.startsWith('image/'))) {
        res.resume();
        resolve({ status: 'skip-' + (ct || 'no-content-type') });
        return;
      }
      // Datasheets: filepath passed without extension → derive it from content-type
      let target = filepath;
      if (!path.extname(target)) target += EXT_BY_TYPE[ct] || '.bin';
      const ws = fs.createWriteStream(target);
      res.pipe(ws);
      ws.on('finish', () => { ws.close(); resolve({ status: 'ok', path: target }); });
      ws.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

async function runBatch(name, jobs) {
  // jobs: [{url, run: () => Promise<result>}]
  const batchSize = 10;
  let done = 0, ok = 0, skip = 0, err = 0;
  const failed = [];
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    await Promise.all(batch.map(async (job) => {
      try {
        const result = await job.run();
        if (result.status === 'ok' || result.status === 'exists') ok++;
        else { skip++; failed.push(job.url + ' (' + result.status + ')'); }
      } catch (e) {
        err++;
        failed.push(job.url + ' (' + e.message + ')');
      }
      done++;
    }));
    process.stdout.write(`\r[${name}] ${done}/${jobs.length} (ok:${ok} skip:${skip} err:${err})`);
  }
  if (jobs.length) console.log('');
  if (failed.length > 0) {
    console.log(`[${name}] Not downloadable (remote URL kept for these):`);
    failed.forEach(f => console.log('  ' + f));
  }
  return { ok, skip, err };
}

async function main() {
  // ---- 1) Product gallery images (image / images fields) ----
  const galleryUrls = new Set();
  products.forEach(p => {
    if (p.image && isRemote(p.image)) galleryUrls.add(p.image);
    if (p.images) p.images.forEach(i => { if (isRemote(i)) galleryUrls.add(i); });
  });
  console.log('Gallery images to download:', galleryUrls.size);
  await runBatch('gallery', [...galleryUrls].map(url => ({
    url,
    run: () => download(url, path.join(imgDir, getLocalName(url)), true),
  })));

  const hasLocalImage = (url) => {
    const fp = path.join(imgDir, getLocalName(url));
    return fs.existsSync(fp) && fs.statSync(fp).size > 500;
  };

  let galleryRewritten = 0, galleryKept = 0;
  const localizeGallery = (url) => {
    if (!isRemote(url)) return url; // already local
    if (hasLocalImage(url)) { galleryRewritten++; return 'images/' + getLocalName(url); }
    galleryKept++;
    return url;
  };
  products.forEach(p => {
    if (p.image) p.image = localizeGallery(p.image);
    if (p.images) p.images = p.images.map(localizeGallery);
  });
  console.log(`Gallery refs: ${galleryRewritten} localized, ${galleryKept} kept remote`);

  // ---- 2) Inline images in description HTML (SK + EN) ----
  const inlineUrls = new Set();
  const DESC_FIELDS = ['descriptionHtml', 'descriptionHtml_en'];
  products.forEach(p => {
    DESC_FIELDS.forEach(f => {
      if (!p[f]) return;
      (p[f].match(/<img[^>]+src="([^"]+)"/g) || []).forEach(tag => {
        const u = tag.match(/src="([^"]+)"/)[1];
        if (isTesshop(u)) inlineUrls.add(u);
      });
    });
  });
  console.log('Inline description images to download:', inlineUrls.size);
  await runBatch('inline', [...inlineUrls].map(url => ({
    url,
    run: () => download(url, path.join(imgDir, getLocalName(url)), true),
  })));

  let inlineRewritten = 0, inlineStripped = 0;
  products.forEach(p => {
    DESC_FIELDS.forEach(f => {
      if (!p[f]) return;
      p[f] = p[f].replace(/<img[^>]+src="([^"]+)"[^>]*\/?>/g, (m, u) => {
        if (!isTesshop(u)) return m;
        if (hasLocalImage(u)) { inlineRewritten++; return m.replace(u, 'images/' + getLocalName(u)); }
        // Image is gone from tesshop too (404) — a broken <img> icon is worse than nothing
        inlineStripped++;
        return '';
      });
      // Clean up paragraphs left empty by stripped images
      p[f] = p[f].replace(/<p>[\s ]*(<br\s*\/?>)*[\s ]*<\/p>/gi, '').trim();
    });
  });
  console.log(`Inline refs: ${inlineRewritten} localized, ${inlineStripped} dead imgs stripped`);

  // ---- 3) Datasheets / related files ----
  const fileUrls = new Set();
  products.forEach(p => {
    (p.files || []).forEach(f => { if (isTesshop(f.url)) fileUrls.add(f.url); });
  });
  console.log('Datasheets to download:', fileUrls.size);
  await runBatch('files', [...fileUrls].map(url => {
    const m = url.match(/attid=(\d+)/);
    return {
      url,
      run: () => {
        if (!m) return Promise.resolve({ status: 'skip-no-attid' });
        const existing = findLocalDatasheet(url);
        if (existing) return Promise.resolve({ status: 'exists', path: existing });
        return download(url, path.join(filesDir, m[1]), false);
      },
    };
  }));

  let filesRewritten = 0, filesKept = 0;
  products.forEach(p => {
    (p.files || []).forEach(f => {
      if (!isTesshop(f.url)) return; // YouTube links etc. stay as-is
      const local = findLocalDatasheet(f.url);
      if (local) { filesRewritten++; f.url = local; }
      else filesKept++;
    });
  });
  console.log(`Datasheet refs: ${filesRewritten} localized, ${filesKept} kept remote`);

  fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
  console.log('Saved products.json');
}

main().catch(e => { console.error(e); process.exit(1); });
