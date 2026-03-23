import fs from 'fs';

// ============================================================
// Apply i18n attributes to all HTML files
// ============================================================

const sk = JSON.parse(fs.readFileSync('lang/sk.json', 'utf8'));

// Build replacement map: Slovak text → i18n key
const textToKey = {};
for (const [key, value] of Object.entries(sk)) {
  textToKey[value] = key;
}

function addI18nToFile(filename) {
  let html = fs.readFileSync(filename, 'utf8');
  let changes = 0;

  // 1. Add i18n.js script before </body>
  if (!html.includes('i18n.js')) {
    html = html.replace('</body>', '  <script src="i18n.js"></script>\n</body>');
    changes++;
  }

  // 2. Add language switcher to header (before CTA button)
  const langSwitcherHTML = `
          <!-- Language Switcher -->
          <div class="flex items-center border border-brand-gray-100 rounded-lg overflow-hidden text-xs">
            <button class="lang-switch-btn px-2 py-1.5 transition-colors" data-lang="sk" onclick="i18n.setLang('sk')">SK</button>
            <button class="lang-switch-btn px-2 py-1.5 transition-colors" data-lang="en" onclick="i18n.setLang('en')">EN</button>
          </div>`;

  if (!html.includes('lang-switch-btn')) {
    // Insert before the CTA div
    html = html.replace(
      /(<div class="flex items-center gap-4">)/,
      '$1' + langSwitcherHTML
    );
    changes++;
  }

  // 3. Add data-i18n attributes to specific elements

  // -- Title tag --
  for (const [key, skText] of Object.entries(sk)) {
    if (key.startsWith('page.') && key.endsWith('.title')) {
      const titleRegex = new RegExp(`<title>${escapeRegex(skText)}</title>`);
      if (titleRegex.test(html)) {
        html = html.replace(titleRegex, `<title data-i18n="${key}">${skText}</title>`);
        changes++;
      }
    }
  }

  // -- Meta description --
  for (const [key, skText] of Object.entries(sk)) {
    if (key.startsWith('page.') && key.endsWith('.description')) {
      const metaRegex = new RegExp(`<meta name="description" content="${escapeRegex(skText)}">`);
      if (metaRegex.test(html)) {
        html = html.replace(metaRegex, `<meta name="description" content="${skText}" data-i18n="${key}">`);
        changes++;
      }
    }
  }

  // -- Nav aria-label --
  html = html.replace(
    /aria-label="Hlavná navigácia"/g,
    'aria-label="Hlavná navigácia" data-i18n-aria="nav.main.label"'
  );

  // -- Navigation category links (desktop) --
  const navReplacements = [
    ['Optické siete', 'nav.category.optical'],
    ['Metalické siete', 'nav.category.copper'],
    ['Rozvádzače', 'nav.category.cabinets'],
    ['Montážne príslušenstvo', 'nav.category.accessories'],
  ];

  for (const [text, key] of navReplacements) {
    // Desktop nav links
    const navLinkRegex = new RegExp(
      `(class="nav-link[^"]*"[^>]*>)${escapeRegex(text)}(</a>)`, 'g'
    );
    html = html.replace(navLinkRegex, `$1<span data-i18n="${key}">${text}</span>$2`);

    // Mobile menu links
    const mobileLinkRegex = new RegExp(
      `(class="block text-base[^"]*"[^>]*>)${escapeRegex(text)}(</a>)`, 'g'
    );
    html = html.replace(mobileLinkRegex, `$1<span data-i18n="${key}">${text}</span>$2`);
  }

  // -- "Produkty" nav link --
  html = html.replace(
    /(class="nav-link[^"]*"[^>]*>)Produkty(<\/a>)/g,
    '$1<span data-i18n="nav.products">Produkty</span>$2'
  );
  // Mobile
  html = html.replace(
    /(class="block text-base[^"]*"[^>]*>)Produkty(<\/a>)/g,
    '$1<span data-i18n="nav.products">Produkty</span>$2'
  );

  // -- "Kontakt" nav link --
  html = html.replace(
    /(class="nav-link[^"]*"[^>]*>)Kontakt(<\/a>)/g,
    '$1<span data-i18n="nav.contact">Kontakt</span>$2'
  );
  html = html.replace(
    /(class="block text-base[^"]*"[^>]*>)Kontakt(<\/a>)/g,
    '$1<span data-i18n="nav.contact">Kontakt</span>$2'
  );

  // -- "Domov" nav link --
  html = html.replace(
    /(class="nav-link[^"]*"[^>]*>)Domov(<\/a>)/g,
    '$1<span data-i18n="nav.home">Domov</span>$2'
  );
  html = html.replace(
    /(class="block text-base[^"]*"[^>]*>)Domov(<\/a>)/g,
    '$1<span data-i18n="nav.home">Domov</span>$2'
  );

  // -- CTA buttons: "Kontaktujte nás" --
  html = html.replace(
    /(<[^>]*btn-primary[^>]*>)\s*Kontaktujte nás\s*(<\/a>|<\/button>)/g,
    (match, before, after) => {
      if (match.includes('data-i18n')) return match;
      return `${before}<span data-i18n="button.contact_us">Kontaktujte nás</span>${after}`;
    }
  );

  // -- Menu toggle aria-label --
  html = html.replace(
    /aria-label="Otvoriť menu"/g,
    'aria-label="Otvoriť menu" data-i18n-aria="button.open_menu"'
  );
  html = html.replace(
    /aria-label="Menu"/g,
    'aria-label="Menu" data-i18n-aria="button.open_menu"'
  );

  // -- Simple text element replacements using the full SK text --
  const elementReplacements = [
    // Hero
    ['Sieťová infraštruktúra', 'hero.tagline'],
    ['Špičkové riešenia pre vašu', 'hero.title'],
    ['sieťovú infraštruktúru', 'hero.title2'],
    ['Naše produkty', 'button.our_products'],

    // Why DATAWAY section
    ['Prečo DATAWAY?', 'section.why_dataway.title'],
    ['Vysoká kvalita', 'card.high_quality.title'],
    ['Odborný prístup', 'card.expert_approach.title'],
    ['Inovačné riešenia', 'card.innovative_solutions.title'],

    // Products section
    ['Objavte naše produkty', 'section.products.heading'],
    ['Zobraziť všetky produkty', 'button.view_all_products'],

    // Latest products
    ['Najnovšie produkty', 'section.latest_products.title'],

    // Why choose
    ['Prečo si vybrať DATAWAY?', 'section.why_choose.title'],
    ['Optické káble', 'benefit.optical_cables.title'],
    ['Metalické káble', 'benefit.metallic_cables.title'],
    ['Efektívne distribučné riešenia', 'benefit.distribution_solutions.title'],

    // Contact
    ['Kontaktujte nás', 'section.contact.heading'],
    ['Odoslať', 'button.submit'],

    // Distributors
    ['Naši distribútori', 'section.distributors.heading'],

    // Products page
    ['Katalóg produktov', 'page.products.heading'],
    ['Filtre', 'button.filters'],
    ['Zobraziť viac produktov', 'button.load_more'],
    ['Žiadne produkty', 'message.no_products_heading'],
    ['Kategórie', 'sidebar.categories_heading'],

    // Product detail
    ['Technické parametre', 'product.specifications_heading'],
    ['Dopytovať produkt', 'button.inquiry_product'],
    ['Späť na produkty', 'button.back_to_products'],

    // Distributor page
    ['Autorizovaný distribútor produktov DATAWAY', 'distributor.badge_text'],
    ['Späť na distribútorov', 'button.back_to_distributors'],
    ['Distribútor nebol nájdený', 'error.distributor_not_found_heading'],

    // Footer
    ['Kategórie', 'footer.categories_heading'],

    // Breadcrumbs
    ['Distribútori', 'breadcrumb.distributors'],
  ];

  for (const [text, key] of elementReplacements) {
    // Match text inside heading tags, span, p, button, etc.
    // But only if not already tagged with data-i18n
    const regex = new RegExp(`(>)\\s*${escapeRegex(text)}\\s*(</)`, 'g');
    html = html.replace(regex, (match, before, after) => {
      // Skip if already has data-i18n nearby
      return `${before}<span data-i18n="${key}">${text}</span>${after}`;
    });
  }

  // -- Longer paragraph texts (add data-i18n to the element itself) --
  const longTexts = [
    [sk['card.high_quality.description'], 'card.high_quality.description'],
    [sk['card.expert_approach.description'], 'card.expert_approach.description'],
    [sk['card.innovative_solutions.description'], 'card.innovative_solutions.description'],
    [sk['section.products.description'], 'section.products.description'],
    [sk['section.latest_products.description'], 'section.latest_products.description'],
    [sk['section.why_choose.description'], 'section.why_choose.description'],
    [sk['benefit.optical_cables.description'], 'benefit.optical_cables.description'],
    [sk['benefit.metallic_cables.description'], 'benefit.metallic_cables.description'],
    [sk['benefit.distribution_solutions.description'], 'benefit.distribution_solutions.description'],
    [sk['section.contact.description'], 'section.contact.description'],
    [sk['section.distributors.description'], 'section.distributors.description'],
    [sk['page.products.subheading'], 'page.products.subheading'],
    [sk['hero.description'], 'hero.description'],
    [sk['footer.description'], 'footer.description'],
    [sk['footer.copyright'], 'footer.copyright'],
    [sk['message.no_products_description'], 'message.no_products_description'],
    [sk['error.distributor_not_found_description'], 'error.distributor_not_found_description'],
  ];

  for (const [text, key] of longTexts) {
    if (!text) continue;
    // Find the text content and add data-i18n to the parent element
    const escaped = escapeRegex(text);
    const regex = new RegExp(`(<(?:p|span|small|div)[^>]*)(>)\\s*${escaped}\\s*(</)`, 'g');
    html = html.replace(regex, (match, tag, gt, close) => {
      if (tag.includes('data-i18n')) return match;
      return `${tag} data-i18n="${key}"${gt}${text}${close}`;
    });
  }

  // -- Placeholders --
  html = html.replace(
    /placeholder="Meno a priezvisko"/g,
    'placeholder="Meno a priezvisko" data-i18n-placeholder="form.field.name"'
  );
  html = html.replace(
    /placeholder="Email"/g,
    'placeholder="Email" data-i18n-placeholder="form.field.email"'
  );
  html = html.replace(
    /placeholder="Správa"/g,
    'placeholder="Správa" data-i18n-placeholder="form.field.message"'
  );
  html = html.replace(
    /placeholder="Hľadať produkt\.\.\."/g,
    'placeholder="Hľadať produkt..." data-i18n-placeholder="search.placeholder"'
  );

  // -- Form labels --
  html = html.replace(
    />Meno a priezvisko<\/label>/g,
    ' data-i18n="form.field.name">Meno a priezvisko</label>'
  );
  html = html.replace(
    />Email<\/label>/g,
    ' data-i18n="form.field.email">Email</label>'
  );
  html = html.replace(
    />Správa<\/label>/g,
    ' data-i18n="form.field.message">Správa</label>'
  );

  // -- Footer category links --
  for (const [text, key] of navReplacements) {
    const footerRegex = new RegExp(
      `(class="[^"]*footer[^"]*"[^>]*>)\\s*${escapeRegex(text)}\\s*(</)`, 'g'
    );
    html = html.replace(footerRegex, `$1<span data-i18n="${key}">${text}</span>$2`);
  }

  // Clean up double data-i18n-aria (from repeated runs)
  html = html.replace(/data-i18n-aria="[^"]*"\s*data-i18n-aria="[^"]*"/g, (match) => {
    return match.split(/\s+/)[0]; // keep first
  });

  fs.writeFileSync(filename, html, 'utf8');
  console.log(`${filename}: updated`);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Apply to all pages
['index.html', 'produkty.html', 'produkt.html', 'distributor.html'].forEach(f => {
  addI18nToFile(f);
});
