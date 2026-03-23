// ============================================================
// DATAWAY i18n — Lightweight translation engine
// ============================================================

(function () {
  'use strict';

  const SUPPORTED_LANGS = ['sk', 'en'];
  const DEFAULT_LANG = 'sk';
  const STORAGE_KEY = 'dataway_lang';

  let translations = {};
  let currentLang = DEFAULT_LANG;

  // Category translation maps (used by product rendering)
  const CATEGORY_MAP = {
    'Optické siete': 'Optical Networks',
    'Metalické siete': 'Copper Networks',
    'Rozvádzače': 'Cabinets',
    'Montážne príslušenstvo': 'Installation Accessories',
  };
  const CATEGORY_MAP_REVERSE = Object.fromEntries(
    Object.entries(CATEGORY_MAP).map(([k, v]) => [v, k])
  );

  // Expose globally
  window.i18n = {
    get lang() { return currentLang; },
    t,
    setLang,
    translateCategory,
    translateCategoryReverse,
    CATEGORY_MAP,
  };

  // ---- Init ----
  async function init() {
    // Detect language from localStorage or browser
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) {
      currentLang = stored;
    }

    // Load both translation files
    const [sk, en] = await Promise.all([
      fetch('lang/sk.json').then(r => r.json()),
      fetch('lang/en.json').then(r => r.json()),
    ]);
    translations = { sk, en };

    // Apply translations
    applyTranslations();
    updateSwitcher();

    // Dispatch event for JS-rendered content
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
  }

  // ---- Translate function ----
  function t(key) {
    const dict = translations[currentLang] || translations[DEFAULT_LANG] || {};
    return dict[key] || key;
  }

  // ---- Category helpers ----
  function translateCategory(skName) {
    if (currentLang === 'en') return CATEGORY_MAP[skName] || skName;
    return skName;
  }

  function translateCategoryReverse(enName) {
    return CATEGORY_MAP_REVERSE[enName] || enName;
  }

  // ---- Set language ----
  function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Update page title
    const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
    if (titleKey) document.title = t(titleKey);

    // Apply translations to DOM
    applyTranslations();
    updateSwitcher();

    // Notify JS-rendered components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  // ---- Apply translations to DOM ----
  function applyTranslations() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        if (el.tagName === 'TITLE') {
          document.title = t(key);
        } else if (el.tagName === 'META') {
          el.setAttribute('content', t(key));
        } else {
          el.textContent = t(key);
        }
      }
    });

    // innerHTML (for keys that contain HTML)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = t(key);
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.placeholder = t(key);
    });

    // aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key));
    });
  }

  // ---- Language switcher UI ----
  function updateSwitcher() {
    document.querySelectorAll('.lang-switch-btn').forEach(btn => {
      const lang = btn.getAttribute('data-lang');
      btn.classList.toggle('active', lang === currentLang);
      btn.classList.toggle('text-brand-navy', lang === currentLang);
      btn.classList.toggle('font-semibold', lang === currentLang);
      btn.classList.toggle('text-brand-gray-400', lang !== currentLang);
    });
  }

  // ---- Start ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
