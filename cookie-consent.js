(function() {
  const COOKIE_KEY = 'dataway_cookie_consent';
  const consent = localStorage.getItem(COOKIE_KEY);

  function getLang() {
    return localStorage.getItem('dataway_lang') || 'sk';
  }

  const texts = {
    sk: {
      message: 'Táto webová stránka používa cookies na zabezpečenie správneho fungovania a na analýzu návštevnosti.',
      accept: 'Prijať všetky',
      reject: 'Len nevyhnutné',
      settings: 'Nastavenia',
      save: 'Uložiť nastavenia',
      policy: 'Zásady cookies',
      privacy: 'Ochrana osobných údajov',
      essential_title: 'Nevyhnutné cookies',
      essential_desc: 'Potrebné na správne fungovanie stránky. Nedajú sa vypnúť.',
      analytics_title: 'Analytické cookies',
      analytics_desc: 'Pomáhajú nám pochopiť, ako návštevníci používajú stránku.',
      marketing_title: 'Marketingové cookies',
      marketing_desc: 'Používajú sa na zobrazovanie relevantných reklám a sledovanie kampaní.',
      always_on: 'Vždy aktívne'
    },
    en: {
      message: 'This website uses cookies to ensure proper functionality and to analyze traffic.',
      accept: 'Accept All',
      reject: 'Essential Only',
      settings: 'Settings',
      save: 'Save Settings',
      policy: 'Cookie Policy',
      privacy: 'Privacy Policy',
      essential_title: 'Essential Cookies',
      essential_desc: 'Necessary for the website to function properly. Cannot be disabled.',
      analytics_title: 'Analytical Cookies',
      analytics_desc: 'Help us understand how visitors use the website.',
      marketing_title: 'Marketing Cookies',
      marketing_desc: 'Used to display relevant ads and track campaigns.',
      always_on: 'Always active'
    }
  };

  function showBanner() {
    if (consent) return;

    const lang = getLang();
    const tx = texts[lang] || texts.sk;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <div style="position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#0a1a4a;border-top:1px solid rgba(58,89,241,0.3);box-shadow:0 -4px 20px rgba(0,0,0,0.15);">
        <div style="max-width:1200px;margin:0 auto;padding:16px 20px;">
          <!-- Main bar -->
          <div id="cookie-main" style="display:flex;flex-wrap:wrap;align-items:center;gap:16px;justify-content:space-between;">
            <div style="flex:1;min-width:280px;">
              <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:0;line-height:1.5;">
                ${tx.message}
                <a href="cookies.html" style="color:#7ea7f1;text-decoration:underline;margin-left:4px;">${tx.policy}</a>
              </p>
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap;">
              <button id="cookie-settings-btn" style="padding:8px 16px;font-size:13px;font-weight:500;border:1px solid rgba(255,255,255,0.3);background:transparent;color:white;border-radius:8px;cursor:pointer;">${tx.settings}</button>
              <button id="cookie-reject" style="padding:8px 16px;font-size:13px;font-weight:500;border:1px solid rgba(255,255,255,0.3);background:transparent;color:white;border-radius:8px;cursor:pointer;">${tx.reject}</button>
              <button id="cookie-accept" style="padding:8px 20px;font-size:13px;font-weight:600;border:none;background:#3a59f1;color:white;border-radius:8px;cursor:pointer;">${tx.accept}</button>
            </div>
          </div>
          <!-- Settings panel (hidden by default) -->
          <div id="cookie-details" style="display:none;margin-top:16px;border-top:1px solid rgba(255,255,255,0.1);padding-top:16px;">
            <div style="display:grid;gap:12px;max-width:700px;">
              <!-- Essential -->
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:12px 16px;background:rgba(255,255,255,0.05);border-radius:8px;">
                <div>
                  <div style="color:white;font-size:14px;font-weight:600;margin-bottom:2px;">${tx.essential_title}</div>
                  <div style="color:rgba(255,255,255,0.5);font-size:12px;">${tx.essential_desc}</div>
                </div>
                <span style="color:rgba(255,255,255,0.4);font-size:12px;white-space:nowrap;padding-top:2px;">${tx.always_on}</span>
              </div>
              <!-- Analytics -->
              <label style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:12px 16px;background:rgba(255,255,255,0.05);border-radius:8px;cursor:pointer;">
                <div>
                  <div style="color:white;font-size:14px;font-weight:600;margin-bottom:2px;">${tx.analytics_title}</div>
                  <div style="color:rgba(255,255,255,0.5);font-size:12px;">${tx.analytics_desc}</div>
                </div>
                <div style="position:relative;flex-shrink:0;margin-top:2px;">
                  <input type="checkbox" id="cookie-analytics" checked style="position:absolute;opacity:0;width:0;height:0;">
                  <div class="cookie-toggle" style="width:44px;height:24px;background:#3a59f1;border-radius:12px;transition:background 0.2s;cursor:pointer;">
                    <div style="width:20px;height:20px;background:white;border-radius:50%;position:absolute;top:2px;left:22px;transition:left 0.2s;"></div>
                  </div>
                </div>
              </label>
              <!-- Marketing -->
              <label style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:12px 16px;background:rgba(255,255,255,0.05);border-radius:8px;cursor:pointer;">
                <div>
                  <div style="color:white;font-size:14px;font-weight:600;margin-bottom:2px;">${tx.marketing_title}</div>
                  <div style="color:rgba(255,255,255,0.5);font-size:12px;">${tx.marketing_desc}</div>
                </div>
                <div style="position:relative;flex-shrink:0;margin-top:2px;">
                  <input type="checkbox" id="cookie-marketing" checked style="position:absolute;opacity:0;width:0;height:0;">
                  <div class="cookie-toggle" style="width:44px;height:24px;background:#3a59f1;border-radius:12px;transition:background 0.2s;cursor:pointer;">
                    <div style="width:20px;height:20px;background:white;border-radius:50%;position:absolute;top:2px;left:22px;transition:left 0.2s;"></div>
                  </div>
                </div>
              </label>
            </div>
            <div style="margin-top:16px;display:flex;gap:8px;">
              <button id="cookie-save" style="padding:8px 24px;font-size:13px;font-weight:600;border:none;background:#3a59f1;color:white;border-radius:8px;cursor:pointer;">${tx.save}</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    // Toggle styling for checkboxes
    function updateToggles() {
      banner.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
        var toggle = cb.nextElementSibling;
        var knob = toggle.querySelector('div');
        if (cb.checked) {
          toggle.style.background = '#3a59f1';
          knob.style.left = '22px';
        } else {
          toggle.style.background = 'rgba(255,255,255,0.2)';
          knob.style.left = '2px';
        }
      });
    }

    banner.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
      cb.addEventListener('change', updateToggles);
    });

    // Settings toggle
    document.getElementById('cookie-settings-btn').addEventListener('click', function() {
      var details = document.getElementById('cookie-details');
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    });

    // Accept all
    document.getElementById('cookie-accept').addEventListener('click', function() {
      saveConsent({ essential: true, analytics: true, marketing: true });
      banner.remove();
    });

    // Reject (essential only)
    document.getElementById('cookie-reject').addEventListener('click', function() {
      saveConsent({ essential: true, analytics: false, marketing: false });
      banner.remove();
    });

    // Save custom settings
    document.getElementById('cookie-save').addEventListener('click', function() {
      saveConsent({
        essential: true,
        analytics: document.getElementById('cookie-analytics').checked,
        marketing: document.getElementById('cookie-marketing').checked
      });
      banner.remove();
    });
  }

  function saveConsent(prefs) {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs));
    if (prefs.analytics) loadAnalytics();
    if (prefs.marketing) loadMarketing();
  }

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(COOKIE_KEY)); }
    catch(e) { return null; }
  }

  function loadAnalytics() {
    // Placeholder for Google Analytics
    // Uncomment and add your GA ID:
    // var s = document.createElement('script');
    // s.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX';
    // s.async = true;
    // document.head.appendChild(s);
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){dataLayer.push(arguments);}
    // gtag('js', new Date());
    // gtag('config', 'G-XXXXXXX');
  }

  function loadMarketing() {
    // Placeholder for marketing scripts (Facebook Pixel, etc.)
  }

  // If already consented, load scripts
  var saved = getConsent();
  if (saved) {
    if (saved.analytics) loadAnalytics();
    if (saved.marketing) loadMarketing();
  }
  // Legacy support (old string format)
  if (consent === 'all') loadAnalytics();

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
