const fs = require('fs');
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

// Define subcategory rules based on product name patterns
const subcategoryRules = [
  // Optické siete
  { category: 'Optické siete', pattern: /adapt[eé]r/i, subcategory: 'Optické adaptéry' },
  { category: 'Optické siete', pattern: /pigtail/i, subcategory: 'Pigtaily' },
  { category: 'Optické siete', pattern: /patchcord/i, subcategory: 'Patchcordy' },
  { category: 'Optické siete', pattern: /spojka|fodc/i, subcategory: 'Pasívne prvky' },
  { category: 'Optické siete', pattern: /kotva|ri.df|ri.dd|pa.1700/i, subcategory: 'Výstavba siete' },
  { category: 'Optické siete', pattern: /ochrana|primarn/i, subcategory: 'Príslušenstvo pre káble' },
  { category: 'Optické siete', pattern: /drag|fish/i, subcategory: 'Náradie a prístroje' },
  { category: 'Optické siete', pattern: /ds.8/i, subcategory: 'Pasívne prvky' },

  // Metalické siete
  { category: 'Metalické siete', pattern: /patch.k[aá]bel|prepojovac/i, subcategory: 'Prepojovacie káble' },
  { category: 'Metalické siete', pattern: /patchcord/i, subcategory: 'Prepojovacie káble' },
  { category: 'Metalické siete', pattern: /konektor/i, subcategory: 'Konektory' },
  { category: 'Metalické siete', pattern: /ochrana.*konekt|100ks.ochrana/i, subcategory: 'Konektory' },
  { category: 'Metalické siete', pattern: /spojka/i, subcategory: 'Spojky' },
  { category: 'Metalické siete', pattern: /keyston/i, subcategory: 'Keystony' },
  { category: 'Metalické siete', pattern: /panel/i, subcategory: 'Patch panely' },

  // Rozvádzače
  { category: 'Rozvádzače', pattern: /rozvadzac|rozv[aá]dza[cč]/i, subcategory: 'Rozvádzače 19"' },
  { category: 'Rozvádzače', pattern: /polic[ae]/i, subcategory: 'Police' },
  { category: 'Rozvádzače', pattern: /pdu|napajac|prepat/i, subcategory: 'PDU a napájanie' },
  { category: 'Rozvádzače', pattern: /panel|vyvazovac|instalacn/i, subcategory: 'Príslušenstvo' },
  { category: 'Rozvádzače', pattern: /keystone|modul/i, subcategory: 'Príslušenstvo' },
  { category: 'Rozvádzače', pattern: /sada/i, subcategory: 'Príslušenstvo' },

  // Montážne príslušenstvo
  { category: 'Montážne príslušenstvo', pattern: /krimpo|narazac|orezavac|odizolov|nastroj|noze|tester|network/i, subcategory: 'Náradie' },
  { category: 'Montážne príslušenstvo', pattern: /pask[ay]|spona|napinac|aql|mbt|s.200|s.100/i, subcategory: 'Napínacie pásky a spony' },
  { category: 'Montážne príslušenstvo', pattern: /zlab|roh|zaslepk|kanál/i, subcategory: 'Káblové žľaby' },
  { category: 'Montážne príslušenstvo', pattern: /zasuvk|uw|hmozdink/i, subcategory: 'Inštalačný materiál' },
  { category: 'Montážne príslušenstvo', pattern: /kotv/i, subcategory: 'Kotvy a uchytenie' },
];

// Categorize each product
products.forEach(p => {
  const name = p.name.toLowerCase();
  const rule = subcategoryRules.find(r => r.category === p.category && r.pattern.test(name));
  p.subcategory = rule ? rule.subcategory : 'Ostatné';
});

// Summary
const summary = {};
products.forEach(p => {
  const key = `${p.category} > ${p.subcategory}`;
  summary[key] = (summary[key] || 0) + 1;
});
console.log('Subcategory distribution:');
Object.entries(summary).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}`));
console.log(`\nTotal: ${products.length} products`);

fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
console.log('Saved updated products.json with subcategories');
