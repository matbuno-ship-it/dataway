import fs from 'fs';

// ============================================================
// TRANSLATION DICTIONARIES
// ============================================================

const CATEGORY_EN = {
  'Metalické siete': 'Copper Networks',
  'Optické siete': 'Optical Networks',
  'Rozvádzače': 'Cabinets',
  'Montážne príslušenstvo': 'Installation Accessories',
};

const SUBCATEGORY_EN = {
  'Prepojovacie káble': 'Patch Cables',
  'Patch panely': 'Patch Panels',
  'Keystony': 'Keystones',
  'Spojky': 'Couplers',
  'Metalická kabeláž': 'Copper Cabling',
  'Optické káble': 'Fiber Optic Cables',
  'Rozvádzače 19"': '19" Cabinets',
  'Patchcordy': 'Fiber Patch Cords',
  'Optické adaptéry': 'Fiber Optic Adapters',
  'Výstavba siete': 'Network Infrastructure',
  'Náradie a prístroje': 'Tools & Instruments',
  'Ostatné': 'Other',
  'Pasívne prvky': 'Passive Components',
  'Pigtaily': 'Pigtails',
  'Konektory': 'Connectors',
  'Príslušenstvo': 'Accessories',
  'Police': 'Shelves',
  'Inštalačný materiál': 'Installation Materials',
  'Príslušenstvo pre káble': 'Cable Accessories',
  'PDU a napájanie': 'PDU & Power',
  'Káblové žľaby': 'Cable Trays',
};

const SPEC_KEY_EN = {
  'Balenie': 'Packaging',
  'Celkový počet vlákien': 'Total Fiber Count',
  'Certifikáty': 'Certifications',
  'Crush (Long Term) (N)': 'Crush (Long Term) (N)',
  'Crush (Short Term) (N)': 'Crush (Short Term) (N)',
  'Dvere': 'Door',
  'Dĺžka (m)': 'Length (m)',
  'Farba': 'Color',
  'Farba plášťa': 'Jacket Color',
  'Frekvenčné pásmo': 'Frequency Band',
  'Hmotnosť (kg)': 'Weight (kg)',
  'Hmotnosť (kg/km)': 'Weight (kg/km)',
  'Hrúbka (mm)': 'Thickness (mm)',
  'Hĺbka (mm)': 'Depth (mm)',
  'Inštalačná teplota  (°C)': 'Installation Temperature (°C)',
  'Kategória': 'Category',
  'Kompatibilné kategórie': 'Compatible Categories',
  'Kompatibilné káble': 'Compatible Cables',
  'Kompatibilné zariadenia': 'Compatible Devices',
  'Konektory': 'Connectors',
  'Konštrukcia': 'Construction',
  'Krytie': 'Protection Rating',
  'Materiál': 'Material',
  'Materiál plášťa': 'Jacket Material',
  'Materiál pláš\u0165a': 'Jacket Material',
  'Max. allowed tension': 'Max. Allowed Tension',
  'Max. pevnosť v ťahu (N)': 'Max. Tensile Strength (N)',
  'Max. počet kaziet': 'Max. Splice Tray Count',
  'Max. počet osadených adaptérov': 'Max. Installed Adapters',
  'Max. počet zvarov': 'Max. Splice Count',
  'Max. tlaková odolnosť (N)': 'Max. Crush Resistance (N)',
  'Max. vzdialenosť': 'Max. Distance',
  'Max. výkon (W)': 'Max. Power (W)',
  'Max. zaťaženie (kN)': 'Max. Load (kN)',
  'Menovité výstupné napätie (V)': 'Rated Output Voltage (V)',
  'Menovitý prúd (A)': 'Rated Current (A)',
  'Množstvo vlákien': 'Fiber Count',
  'NVP (%)': 'NVP (%)',
  'Napájanie': 'Power Supply',
  'Nehorlavosť': 'Flame Retardancy',
  'Nosnosť': 'Load Capacity',
  'Oneskorenie signálu (ns/100 m)': 'Signal Delay (ns/100 m)',
  'Oneskorenie signálu - rozdielové (ns/100 m)': 'Signal Delay - Differential (ns/100 m)',
  'Plášť': 'Jacket',
  'PoE': 'PoE',
  'Podporované protokoly': 'Supported Protocols',
  'Podporované štandardy': 'Supported Standards',
  'Použitie': 'Application',
  'Počet portov': 'Port Count',
  'Počet zásuviek': 'Outlet Count',
  'Pracovná teplota': 'Operating Temperature',
  'Prevedenie': 'Design',
  'Prevádzková teplota (°C)': 'Operating Temperature (°C)',
  'Priemer jadra (µm)': 'Core Diameter (µm)',
  'Priemer kábla (mm)': 'Cable Diameter (mm)',
  'Priemer plášťa': 'Jacket Diameter',
  'Priemer vodiča s izoláciou (mm)': 'Insulated Conductor Diameter (mm)',
  'Prierez kábla': 'Cable Cross-Section',
  'Rozhranie': 'Interface',
  'Rozhranie FIBER': 'FIBER Interface',
  'Rozhranie USB': 'USB Interface',
  'Rozmery': 'Dimensions',
  'Rozmery (mm)': 'Dimensions (mm)',
  'Rýchlosť LAN': 'LAN Speed',
  'Skladovacia teplota (°C)': 'Storage Temperature (°C)',
  'Stupeň ochrany': 'Protection Class',
  'Svorkovnica': 'Terminal Block',
  'Tensile strength (N)': 'Tensile Strength (N)',
  'Tension (Long Term) (N)': 'Tension (Long Term) (N)',
  'Tension (Short Term) (N)': 'Tension (Short Term) (N)',
  'Teplota pri inštalácii': 'Installation Temperature',
  'Tienenie': 'Shielding',
  'Tlačidlá': 'Buttons',
  'Trieda reakcie na oheň': 'Fire Reaction Class',
  'Typ brúsenia': 'Polish Type',
  'Typ káblu': 'Cable Type',
  'Typ vlákien': 'Fiber Type',
  'Typ zariadenia': 'Device Type',
  'Typy vlákien': 'Fiber Types',
  'UV odolnosť plášťa': 'Jacket UV Resistance',
  'Uloženie vlákien': 'Fiber Arrangement',
  'Vlnová dĺžka - Tx/Rx [nm]': 'Wavelength - Tx/Rx [nm]',
  'Vodič': 'Conductor',
  'Výstupný prúd (A)': 'Output Current (A)',
  'Výška (mm)': 'Height (mm)',
  'Výška U': 'Height U',
  'hrúbka pásoviny (mm)': 'Strip Thickness (mm)',
  'Šírka (mm)': 'Width (mm)',
  'Šírka pásma (MHz)': 'Bandwidth (MHz)',
  'Životnosť': 'Lifespan',
};

// Spec VALUES that should be translated
const SPEC_VALUE_EN = {
  // Colors
  'čierna': 'Black',
  'biela': 'White',
  'biely': 'White',
  'šedá': 'Gray',
  'šedý': 'Gray',
  'sivá': 'Gray',
  'zelená': 'Green',
  'zelený': 'Green',
  'modrá': 'Blue',
  'modrý': 'Blue',
  'žltá': 'Yellow',
  'žltý': 'Yellow',
  'červená': 'Red',
  'červený': 'Red',
  'oranžová': 'Orange',
  'oranžový': 'Orange',
  'fialová': 'Purple',
  'fialový': 'Purple',
  'ružová': 'Pink',
  'ružový': 'Pink',
  'tyrkysová': 'Aqua',
  'béžová': 'Beige',
  // Yes/No
  'áno': 'Yes',
  'nie': 'No',
  // Application
  'vnútorné': 'Indoor',
  'vonkajšie': 'Outdoor',
  'vnútorné / vonkajšie': 'Indoor / Outdoor',
  'vnútorné/vonkajšie': 'Indoor/Outdoor',
  // Design
  'simplex': 'Simplex',
  'duplex': 'Duplex',
  'S prírubou': 'Flanged',
  'Bez príruby': 'Without Flange',
  // Door types
  'sklenené': 'Glass',
  'perforované': 'Perforated',
  'plné': 'Solid',
  // General
  'skladem': 'In Stock',
};

// ============================================================
// NAME TRANSLATION RULES
// ============================================================

// Slovak product name terms → English
const NAME_TRANSLATIONS = [
  // Product types
  [/patch kábel/gi, 'Patch Cable'],
  [/optický adaptér/gi, 'Fiber Optic Adapter'],
  [/optická spojka/gi, 'Fiber Optic Closure'],
  [/optický kábel/gi, 'Fiber Optic Cable'],
  [/optický rozvádzač/gi, 'Fiber Optic Cabinet'],
  [/optický pigtail/gi, 'Fiber Optic Pigtail'],
  [/optický konektor/gi, 'Fiber Optic Connector'],
  [/optický patchcord/gi, 'Fiber Optic Patch Cord'],
  [/patchcord/gi, 'Patch Cord'],
  [/Rozvádzač/g, 'Cabinet'],
  [/rozvádzač/g, 'Cabinet'],
  [/patch panel/gi, 'Patch Panel'],
  [/keystone/gi, 'Keystone'],
  [/spojka/g, 'Coupler'],
  [/Spojka/g, 'Coupler'],
  [/adaptér/gi, 'Adapter'],
  [/pigtail/gi, 'Pigtail'],
  [/konektor/gi, 'Connector'],
  [/konektorov/gi, 'Connectors'],
  [/kazeta/g, 'Splice Tray'],
  [/kazetami/g, 'Splice Trays'],
  [/kaziet/g, 'Splice Trays'],
  [/kazetou/g, 'Splice Tray'],

  // Cable types
  [/inštalačný kábel/gi, 'Installation Cable'],
  [/Inštalačný kábel/g, 'Installation Cable'],
  [/kábel/g, 'Cable'],
  [/Kábel/g, 'Cable'],
  [/káble/g, 'Cables'],
  [/kabeláž/gi, 'Cabling'],

  // Accessories & parts
  [/Polica pevná/g, 'Fixed Shelf'],
  [/polica pevná/g, 'Fixed Shelf'],
  [/Polica/g, 'Shelf'],
  [/polica/g, 'Shelf'],
  [/Montážna sada/g, 'Mounting Kit'],
  [/montážna sada/g, 'Mounting Kit'],
  [/Napájacia jednotka/g, 'Power Distribution Unit'],
  [/napájacia jednotka/g, 'Power Distribution Unit'],
  [/Zásuvka/g, 'Outlet'],
  [/zásuvka/g, 'Outlet'],
  [/Záslepka/g, 'Blank Cover'],
  [/záslepka/g, 'Blank Cover'],
  [/Vonkajší roh/g, 'External Corner'],
  [/vonkajší roh/g, 'External Corner'],
  [/Vnútorný roh/g, 'Internal Corner'],
  [/vnútorný roh/g, 'Internal Corner'],
  [/Odbočný diel/g, 'Branch Piece'],
  [/odbočný diel/g, 'Branch Piece'],
  [/Kabelový žľab perforovaný/g, 'Perforated Cable Tray'],
  [/kabelový žľab perforovaný/g, 'Perforated Cable Tray'],
  [/Kabelový žľab/g, 'Cable Tray'],
  [/kabelový žľab/g, 'Cable Tray'],
  [/žľab/g, 'Tray'],
  [/Kryt žľabu/g, 'Tray Cover'],
  [/kryt žľabu/g, 'Tray Cover'],
  [/Kryt/g, 'Cover'],
  [/kryt/g, 'Cover'],
  [/Nosník/g, 'Bracket'],
  [/nosník/g, 'Bracket'],
  [/Držiak/g, 'Holder'],
  [/držiak/g, 'Holder'],
  [/Podpera/g, 'Support'],
  [/podpera/g, 'Support'],
  [/Svorka/g, 'Clamp'],
  [/svorka/g, 'Clamp'],
  [/Príchytka/g, 'Clip'],
  [/príchytka/g, 'Clip'],

  // Materials & properties
  [/sklenené dvere/gi, 'Glass Door'],
  [/odímateľné bočnice/gi, 'Removable Side Panels'],
  [/bodové uchytenie/gi, 'Point Mounting'],
  [/s výbavou/gi, 'with Accessories'],
  [/bez výbavy/gi, 'without Accessories'],

  // Colors in names
  [/čierny/gi, 'Black'],
  [/čierna/gi, 'Black'],
  [/biely/gi, 'White'],
  [/biela/gi, 'White'],
  [/šedý/gi, 'Gray'],
  [/šedá/gi, 'Gray'],
  [/zelený/gi, 'Green'],
  [/zelená/gi, 'Green'],
  [/modrý/gi, 'Blue'],
  [/modrá/gi, 'Blue'],
  [/žltý/gi, 'Yellow'],
  [/žltá/gi, 'Yellow'],
  [/červený/gi, 'Red'],
  [/červená/gi, 'Red'],
  [/oranžový/gi, 'Orange'],
  [/oranžová/gi, 'Orange'],
  [/fialový/gi, 'Purple'],
  [/fialová/gi, 'Purple'],
  [/ružový/gi, 'Pink'],
  [/ružová/gi, 'Pink'],
  [/tyrkysový/gi, 'Aqua'],
  [/tyrkysová/gi, 'Aqua'],
];

function translateName(name) {
  let result = name;
  for (const [pattern, replacement] of NAME_TRANSLATIONS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ============================================================
// DESCRIPTION TRANSLATION
// ============================================================

// Common Slovak phrases → English (for descriptions)
const DESC_TRANSLATIONS = [
  // Product intros
  [/Patch kábel(.*?)farby v dĺžke/gi, 'Patch cable$1color, length'],
  [/zelenej farby/gi, 'green color'],
  [/šedej farby/gi, 'gray color'],
  [/modrej farby/gi, 'blue color'],
  [/žltej farby/gi, 'yellow color'],
  [/červenej farby/gi, 'red color'],
  [/oranžovej farby/gi, 'orange color'],
  [/čiernej farby/gi, 'black color'],
  [/bielej farby/gi, 'white color'],
  [/fialovej farby/gi, 'purple color'],
  [/ružovej farby/gi, 'pink color'],
  [/tyrkysovej farby/gi, 'aqua color'],

  [/prevedenie/gi, 'type'],
  [/kategória/gi, 'Category'],
  [/Prierez vodičov je/gi, 'Conductor cross-section is'],
  [/Kontakty konektorov sú kryté tenkou vrstvou zlata/gi, 'Connector contacts are coated with a thin layer of gold'],
  [/Kontakty konektorov sú kryté 50u vrstvou zlata/gi, 'Connector contacts are coated with 50µ gold plating'],

  [/Patch káble DATAWAY sú súčasťou komplexného systému produktov pre štruktúrovanú kabeláž/gi,
   'DATAWAY patch cables are part of a comprehensive structured cabling product system'],
  [/Na výber je z niekoľkých bežných dĺžok patch káblov/gi,
   'Several standard patch cable lengths are available'],
  [/Všetky káble sú certifikované podľa medzinárodne uznávaných noriem/gi,
   'All cables are certified according to internationally recognized standards'],
  [/Vďaka použitiu kvalitného materiálu sa vyznačujú skvelými prenosovými parametrami a dlhou životnosťou/gi,
   'Thanks to the use of high-quality materials, they feature excellent transmission parameters and long service life'],
  [/Liata ochrana konektorov minimalizuje možnosť presluchov a bez problému je možné káble použiť v akomkoľvek aktívnom i pasívnom prvku/gi,
   'The molded connector protection minimizes the possibility of crosstalk and the cables can be used without issues in any active or passive network element'],
  [/Na všetky káble DATAWAY poskytujeme predĺženú záruku\s*5 rokov/gi,
   'We provide an extended 5-year warranty on all DATAWAY cables'],
  [/Na všetky káble DATAWAY poskytujeme predĺženú/gi,
   'We provide an extended warranty on all DATAWAY cables —'],
  [/záruku\s*5 rokov/gi, '5-year warranty'],
  [/záruku až na 5 rokov/gi, 'warranty up to 5 years'],
  [/predĺženú záruku/gi, 'extended warranty'],

  // Common technical phrases
  [/je určený na/gi, 'is designed for'],
  [/je určená na/gi, 'is designed for'],
  [/je vyrobený z/gi, 'is made of'],
  [/je vyrobená z/gi, 'is made of'],
  [/je vhodný na/gi, 'is suitable for'],
  [/je vhodná na/gi, 'is suitable for'],
  [/je vhodné na/gi, 'is suitable for'],
  [/je navrhnutý tak/gi, 'is designed so'],
  [/je navrhnutá tak/gi, 'is designed so'],
  [/vďaka čomu/gi, 'making it'],
  [/Vďaka/gi, 'Thanks to'],
  [/vďaka/gi, 'thanks to'],

  [/optických sieťach/gi, 'optical networks'],
  [/optických káblov/gi, 'optical cables'],
  [/optických vlákien/gi, 'optical fibers'],
  [/optické vlákna/gi, 'optical fibers'],
  [/optické vlákno/gi, 'optical fiber'],
  [/singlemode/gi, 'singlemode'],
  [/multimode/gi, 'multimode'],

  [/vysoká kvalita/gi, 'high quality'],
  [/vysoko kvalitného/gi, 'high-quality'],
  [/kvalitného/gi, 'quality'],
  [/odolného voči/gi, 'resistant to'],
  [/odolný voči/gi, 'resistant to'],

  [/nízky spätný odraz/gi, 'low return loss'],
  [/nízky útlm/gi, 'low insertion loss'],
  [/spätný odraz/gi, 'return loss'],

  [/zabezpečuje/gi, 'ensures'],
  [/umožňuje/gi, 'enables'],
  [/obsahuje/gi, 'contains'],
  [/poskytuje/gi, 'provides'],
  [/minimalizuje/gi, 'minimizes'],

  [/štruktúrovanú kabeláž/gi, 'structured cabling'],
  [/sieťovú infraštruktúru/gi, 'network infrastructure'],
  [/dátových centrách/gi, 'data centers'],
  [/serverovniach/gi, 'server rooms'],

  [/profesionálne/gi, 'professional'],
  [/robustné/gi, 'robust'],
  [/spoľahlivé/gi, 'reliable'],
  [/presné/gi, 'precise'],
];

function translateDescription(text) {
  if (!text) return '';
  let result = text;
  for (const [pattern, replacement] of DESC_TRANSLATIONS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function translateSpecs(specs) {
  if (!specs) return {};
  const result = {};
  for (const [key, value] of Object.entries(specs)) {
    const enKey = SPEC_KEY_EN[key] || key;
    // Try exact value match first, otherwise keep original
    let enValue = value;
    // Check for exact match
    if (SPEC_VALUE_EN[value.toLowerCase().trim()]) {
      enValue = SPEC_VALUE_EN[value.toLowerCase().trim()];
    } else {
      // Try to translate color values within compound strings (e.g., "čierna RAL9005")
      for (const [sk, en] of Object.entries(SPEC_VALUE_EN)) {
        if (value.toLowerCase().includes(sk)) {
          enValue = value.replace(new RegExp(sk, 'gi'), en);
        }
      }
    }
    result[enKey] = enValue;
  }
  return result;
}

// ============================================================
// MAIN
// ============================================================

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

console.log(`Translating ${products.length} products...`);

let translated = 0;
for (const p of products) {
  // Category & subcategory
  p.category_en = CATEGORY_EN[p.category] || p.category;
  p.subcategory_en = SUBCATEGORY_EN[p.subcategory] || p.subcategory || '';

  // Name
  p.name_en = translateName(p.name);

  // Specs
  if (p.specs) {
    p.specs_en = translateSpecs(p.specs);
  }

  // Description (plain text)
  if (p.description) {
    p.description_en = translateDescription(p.description);
  }

  // Description HTML
  if (p.descriptionHtml) {
    p.descriptionHtml_en = translateDescription(p.descriptionHtml);
  }

  translated++;
  if (translated % 50 === 0) {
    console.log(`  ...translated ${translated}/${products.length}`);
  }
}

fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf8');
console.log(`Done! Translated ${translated} products. Saved to products.json`);

// Show some samples
const samples = ['dataway-patch-kabel-cat5e-utp-lsoh-1m-zeleny', 'dataway-fodc-144-opticka-spojka-144-6x-kazeta-s-vybavou', 'dataway-rozvadzac-4u-19-600x450mm-sklenene-dvere-odimatelne-bocnice-cierny'];
for (const slug of samples) {
  const p = products.find(x => x.slug && x.slug.includes(slug.substring(8, 30)));
  if (p) {
    console.log('\n--- ' + p.slug + ' ---');
    console.log('SK:', p.name);
    console.log('EN:', p.name_en);
    console.log('Cat:', p.category, '→', p.category_en);
    console.log('Sub:', p.subcategory, '→', p.subcategory_en);
    if (p.specs_en) {
      const entries = Object.entries(p.specs_en).slice(0, 4);
      console.log('Specs EN:', entries.map(([k,v]) => k + ': ' + v).join(' | '));
    }
    if (p.description_en) {
      console.log('Desc EN:', p.description_en.substring(0, 150));
    }
  }
}
