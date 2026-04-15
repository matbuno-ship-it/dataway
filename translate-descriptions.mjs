import fs from 'fs';
import https from 'https';

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-haiku-4-5-20251001';
const BATCH_SIZE = 10; // products per API call

const SYSTEM_PROMPT = `You are a professional translator specializing in network infrastructure and telecommunications equipment. Translate product descriptions from Slovak to English.

RULES:
- DO NOT translate technical designations: CAT5E, CAT6, CAT6A, UTP, FTP, STP, SC/APC, SC/PC, LC, SC, FC, ST, LSOH, AWG, RJ45, IP68, RAL codes, PoE, GPON, FTTH, FTTx, OS2, OM1-OM5, SM, MM, etc.
- DO NOT translate "DATAWAY" — always keep as DATAWAY
- DO NOT translate units: mm, m, µm, dB, kg, kN, °C, MHz, GHz, W, A, V
- DO NOT translate model numbers, part numbers, product codes
- PRESERVE all HTML formatting exactly (<p>, <strong>, <br>, <ul>, <li>, <h3>, etc.)
- Translate naturally and professionally — not word-by-word
- Use standard English telecommunications terminology:
  - optický adaptér → fiber optic adapter
  - optická spojka → fiber optic closure
  - patch kábel → patch cable
  - rozvádzač → cabinet/rack
  - štruktúrovaná kabeláž → structured cabling
  - pigtail → pigtail
  - patchcord → patch cord
  - keystone → keystone jack
  - záslepka → blank cover/plate
  - žľab → cable tray
  - brúsenie → polish (as in APC/UPC polish)
  - spätný odraz → return loss
  - útlm → insertion loss
  - záruka → warranty
  - zvary → splices
  - kazeta → splice tray

Respond with ONLY a JSON array of translations, in the same order as the input. Each element should be an object with:
- "idx" (index)
- "name_en" (translated product name)
- "description_en" (plain text translation)
- "descriptionHtml_en" (HTML translation)
- "specs_en" (object with translated spec keys and values — translate keys like "Farba" → "Color", "Dĺžka (m)" → "Length (m)", but keep technical values as-is)
- "category_en" (translated category)
- "subcategory_en" (translated subcategory)

Category translations to use consistently:
- "Metalické siete" → "Copper Networks"
- "Optické siete" → "Fiber Optics"
- "Rozvádzače" → "Cabinets & Racks"
- "Montážne príslušenstvo" → "Installation Accessories"
- "Ostatné" → "Other"

If any input field is empty, return an empty string/object for that field.`;

function callAPI(messages) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages
    });

    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API error ${res.statusCode}: ${body}`));
          return;
        }
        try {
          const parsed = JSON.parse(body);
          resolve(parsed.content[0].text);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function translateBatch(products, startIdx) {
  const input = products.map((p, i) => ({
    idx: startIdx + i,
    name: p.name,
    description: p.description || '',
    descriptionHtml: p.descriptionHtml || '',
    specs: p.specs || {},
    category: p.category || '',
    subcategory: p.subcategory || ''
  }));

  const userMessage = JSON.stringify(input);

  const response = await callAPI([
    { role: 'user', content: `Translate these ${input.length} product descriptions from Slovak to English. Return a JSON array:\n\n${userMessage}` }
  ]);

  // Extract JSON from response
  let jsonStr = response;
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (jsonMatch) jsonStr = jsonMatch[0];

  return JSON.parse(jsonStr);
}

async function main() {
  const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

  // Find products that need translation (missing any _en field)
  const needsTranslation = [];
  products.forEach((p, i) => {
    if (!p.name_en || !p.description_en || !p.specs_en || !p.category_en || !p.subcategory_en) {
      needsTranslation.push({ product: p, index: i });
    }
  });

  console.log(`Total products: ${products.length}`);
  console.log(`Need translation: ${needsTranslation.length}`);

  // Process in batches
  let translated = 0;
  let errors = 0;

  for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
    const batch = needsTranslation.slice(i, i + BATCH_SIZE);
    const batchProducts = batch.map(b => b.product);

    try {
      const results = await translateBatch(batchProducts, i);

      // Apply translations
      results.forEach((result, j) => {
        const targetIdx = batch[j].index;
        const fields = ['name_en', 'description_en', 'descriptionHtml_en', 'specs_en', 'category_en', 'subcategory_en'];
        fields.forEach(f => {
          if (result[f]) {
            products[targetIdx][f] = result[f];
          }
        });
      });

      translated += batch.length;
      console.log(`Translated ${translated}/${needsTranslation.length} (batch ${Math.floor(i/BATCH_SIZE) + 1})`);

      // Save progress after each batch
      fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Error in batch starting at ${i}: ${err.message}`);
      errors++;
      // Try smaller batches on error
      if (BATCH_SIZE > 1) {
        for (const item of batch) {
          try {
            const results = await translateBatch([item.product], 0);
            const fields = ['name_en', 'description_en', 'descriptionHtml_en', 'specs_en', 'category_en', 'subcategory_en'];
            fields.forEach(f => {
              if (results[0]?.[f]) {
                products[item.index][f] = results[0][f];
              }
            });
            translated++;
            console.log(`  Recovered: ${item.product.name.substring(0, 50)}`);
            fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
            await new Promise(r => setTimeout(r, 300));
          } catch (e2) {
            console.error(`  Failed: ${item.product.name.substring(0, 50)}: ${e2.message}`);
            errors++;
          }
        }
      }
    }
  }

  // Final save
  fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');

  // Stats
  const withEn = products.filter(p => p.description_en && p.description_en !== p.description).length;
  console.log(`\nDone! Translated: ${translated}, Errors: ${errors}`);
  console.log(`Products with EN description: ${withEn}/${products.length}`);
}

main().catch(console.error);
