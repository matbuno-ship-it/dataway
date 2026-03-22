const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'images');
const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'));

console.log('Images to optimize:', files.length);

async function optimize() {
  let done = 0, saved = 0;

  for (const file of files) {
    const filepath = path.join(imgDir, file);
    const stat = fs.statSync(filepath);
    const originalSize = stat.size;

    try {
      const buffer = await sharp(filepath)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();

      if (buffer.length < originalSize) {
        fs.writeFileSync(filepath, buffer);
        saved += (originalSize - buffer.length);
      }
    } catch (e) {
      // Skip files that can't be processed
    }

    done++;
    if (done % 100 === 0) process.stdout.write(`\r${done}/${files.length}`);
  }

  console.log(`\n\nDone. Saved ${(saved / 1024 / 1024).toFixed(1)} MB`);

  // Check new total size
  let total = 0;
  fs.readdirSync(imgDir).forEach(f => {
    total += fs.statSync(path.join(imgDir, f)).size;
  });
  console.log('New total size:', (total / 1024 / 1024).toFixed(1), 'MB');
}

optimize();
