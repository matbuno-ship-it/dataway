(function() {
  const COOKIE_KEY = 'dataway_cookie_consent';
  const consent = localStorage.getItem(COOKIE_KEY);

  function t(key, fallback) {
    if (window.i18n && window.i18n.t) return window.i18n.t(key, fallback);
    return fallback;
  }

  function getLang() {
    return localStorage.getItem('dataway_lang') || 'sk';
  }

  const texts = {
    sk: {
      message: 'Táto webová stránka používa cookies na zabezpečenie správneho fungovania a na analýzu návštevnosti.',
      accept: 'Prijať všetky',
      reject: 'Len nevyhnutné',
      policy: 'Zásady cookies',
      privacy: 'Ochrana osobných údajov'
    },
    en: {
      message: 'This website uses cookies to ensure proper functionality and to analyze traffic.',
      accept: 'Accept All',
      reject: 'Essential Only',
      policy: 'Cookie Policy',
      privacy: 'Privacy Policy'
    }
  };

  function showBanner() {
    if (consent) return;

    const lang = getLang();
    const tx = texts[lang] || texts.sk;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <div style="position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#0a1a4a;border-top:1px solid rgba(58,89,241,0.3);padding:16px 20px;box-shadow:0 -4px 20px rgba(0,0,0,0.15);">
        <div style="max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:16px;justify-content:space-between;">
          <div style="flex:1;min-width:280px;">
            <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;line-height:1.5;">
              ${tx.message}
              <a href="cookies.html" style="color:#7ea7f1;text-decoration:underline;margin-left:4px;">${tx.policy}</a>
              ·
              <a href="ochrana-osobnych-udajov.html" style="color:#7ea7f1;text-decoration:underline;">${tx.privacy}</a>
            </p>
          </div>
          <div style="display:flex;gap:10px;flex-shrink:0;">
            <button id="cookie-reject" style="padding:8px 20px;font-size:13px;font-weight:500;border:1px solid rgba(255,255,255,0.3);background:transparent;color:white;border-radius:8px;cursor:pointer;transition:all 0.2s;">${tx.reject}</button>
            <button id="cookie-accept" style="padding:8px 20px;font-size:13px;font-weight:600;border:none;background:#3a59f1;color:white;border-radius:8px;cursor:pointer;transition:all 0.2s;">${tx.accept}</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('cookie-accept').addEventListener('click', function() {
      localStorage.setItem(COOKIE_KEY, 'all');
      banner.remove();
      loadAnalytics();
    });

    document.getElementById('cookie-reject').addEventListener('click', function() {
      localStorage.setItem(COOKIE_KEY, 'essential');
      banner.remove();
    });
  }

  function loadAnalytics() {
    // Placeholder for Google Analytics or similar
    // Uncomment and add your GA ID when ready:
    // var s = document.createElement('script');
    // s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX';
    // s.async = true;
    // document.head.appendChild(s);
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){dataLayer.push(arguments);}
    // gtag('js', new Date());
    // gtag('config', 'G-XXXXXXX');
  }

  // If already consented to all, load analytics
  if (consent === 'all') {
    loadAnalytics();
  }

  // Show banner on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }

  // Re-render on language change
  window.addEventListener('languageChanged', function() {
    var existing = document.getElementById('cookie-banner');
    if (existing) {
      existing.remove();
      showBanner();
    }
  });
})();
