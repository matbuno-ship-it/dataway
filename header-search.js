(function() {
  let products = null;
  let dropdownEl = null;
  let debounceTimer = null;
  let mobileOverlay = null;

  function getLang() {
    return localStorage.getItem('dataway_lang') || 'sk';
  }

  function pName(p) {
    return getLang() === 'en' ? (p.ne || p.n) : p.n;
  }

  function pCategory(p) {
    return getLang() === 'en' ? (p.ce || p.c) : p.c;
  }

  async function loadProducts() {
    if (products) return products;
    // Use inline PRODUCTS if available (produkty.html, produkt.html)
    if (window.PRODUCTS) {
      products = window.PRODUCTS.map(function(p) {
        return { s: p.slug, n: p.name, ne: p.name_en, c: p.category, ce: p.category_en, sc: p.subcategory, sce: p.subcategory_en, co: p.code, pn: p.partNumber, i: p.image };
      });
      return products;
    }
    // Fetch lightweight search index (~155KB vs 2MB)
    try {
      var res = await fetch('products-search.json');
      products = await res.json();
      return products;
    } catch(e) {
      return [];
    }
  }

  function search(query, allProducts) {
    var words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    return allProducts.filter(function(p) {
      var haystack = [
        p.n, p.ne, p.c, p.ce, p.sc, p.sce, p.co, p.pn
      ].filter(Boolean).join(' ').toLowerCase();
      return words.every(function(w) { return haystack.includes(w); });
    });
  }

  function buildResultsHTML(results, query) {
    var lang = getLang();
    var maxShow = 6;
    var shown = results.slice(0, maxShow);

    if (shown.length === 0) {
      var noText = lang === 'en' ? 'No products found' : 'Žiadne produkty';
      return '<div style="padding:16px 20px;color:#8e95a9;font-size:13px;text-align:center;">' + noText + '</div>';
    }

    var html = '';
    shown.forEach(function(p) {
      var name = pName(p);
      var cat = pCategory(p);
      var img = p.i || 'Brand/Loga-na-sirku-450-x-120-px-11.webp';
      html += '<a href="produkt.html?slug=' + p.s + '" class="ms-result" style="display:flex;align-items:center;gap:14px;padding:12px 16px;text-decoration:none;border-bottom:1px solid #f0f1f5;" onmouseover="this.style.background=\'#f8f9fc\'" onmouseout="this.style.background=\'transparent\'">';
      html += '<div style="width:48px;height:48px;flex-shrink:0;background:#f8f9fc;border-radius:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;">';
      html += '<img src="' + img + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain;mix-blend-mode:multiply;" onerror="this.src=\'Brand/Loga-na-sirku-450-x-120-px-11.webp\';this.style.opacity=\'0.3\'">';
      html += '</div>';
      html += '<div style="flex:1;min-width:0;">';
      html += '<div style="font-size:14px;font-weight:600;color:#0f1b3d;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">' + name + '</div>';
      html += '<div style="font-size:12px;color:#8e95a9;margin-top:2px;">' + cat + '</div>';
      html += '</div>';
      html += '<svg style="width:16px;height:16px;color:#c8cdd8;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';
      html += '</a>';
    });

    if (results.length > maxShow) {
      var allText = lang === 'en'
        ? 'View all results (' + results.length + ')'
        : 'Zobraziť všetky výsledky (' + results.length + ')';
      html += '<a href="produkty.html?search=' + encodeURIComponent(query) + '" style="display:block;padding:12px 16px;text-align:center;font-size:13px;font-weight:600;color:#3a59f1;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background=\'#f8f9fc\'" onmouseout="this.style.background=\'transparent\'">' + allText + '</a>';
    }

    return html;
  }

  // ---- DESKTOP DROPDOWN ----
  function createDropdown(form) {
    if (dropdownEl) return dropdownEl;
    dropdownEl = document.createElement('div');
    dropdownEl.id = 'header-search-dropdown';
    dropdownEl.style.cssText = 'position:absolute;top:100%;left:0;right:0;margin-top:4px;background:white;border-radius:12px;box-shadow:0 4px 24px rgba(8,28,126,0.15),0 0 0 1px rgba(58,89,241,0.08);z-index:100;overflow:hidden;display:none;min-width:320px;max-height:420px;overflow-y:auto;';
    form.style.position = 'relative';
    form.appendChild(dropdownEl);
    return dropdownEl;
  }

  function showDesktopResults(results, query, form) {
    var dd = createDropdown(form);
    dd.innerHTML = buildResultsHTML(results, query);
    dd.style.display = 'block';
  }

  function hideDropdown() {
    if (dropdownEl) dropdownEl.style.display = 'none';
  }

  // ---- MOBILE SEARCH OVERLAY ----
  function createMobileOverlay() {
    if (mobileOverlay) return;

    // Search trigger button (magnifying glass in header)
    var header = document.querySelector('header');
    if (!header) return;
    var menuToggle = header.querySelector('#menu-toggle');
    if (!menuToggle) return;

    var searchBtn = document.createElement('button');
    searchBtn.id = 'mobile-search-toggle';
    searchBtn.setAttribute('aria-label', 'Search');
    searchBtn.style.cssText = 'padding:8px;color:#3d4663;display:none;';
    searchBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>';
    menuToggle.parentNode.insertBefore(searchBtn, menuToggle);

    // Show only on mobile (md breakpoint = 768px)
    function updateVisibility() {
      searchBtn.style.display = window.innerWidth < 768 ? 'block' : 'none';
    }
    updateVisibility();
    window.addEventListener('resize', updateVisibility);

    // Inject CSS for mobile overlay animations
    var style = document.createElement('style');
    style.textContent = '' +
      '#mobile-search-overlay { opacity:0; transition:opacity 0.25s ease; }' +
      '#mobile-search-overlay.open { opacity:1; }' +
      '#mobile-search-overlay .ms-panel { transform:translateY(-100%); transition:transform 0.3s cubic-bezier(0.32,0.72,0,1); }' +
      '#mobile-search-overlay.open .ms-panel { transform:translateY(0); }' +
      '#mobile-search-overlay .ms-input { transition:border-color 0.2s,box-shadow 0.2s; }' +
      '#mobile-search-overlay .ms-input:focus { border-color:#3a59f1; box-shadow:0 0 0 3px rgba(58,89,241,0.12); }' +
      '#mobile-search-overlay .ms-result { transition:background 0.15s; }' +
      '#mobile-search-overlay .ms-result:active { background:#eef1f6; }';
    document.head.appendChild(style);

    // Overlay
    mobileOverlay = document.createElement('div');
    mobileOverlay.id = 'mobile-search-overlay';
    mobileOverlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9998;background:rgba(8,28,126,0.3);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:none;';
    mobileOverlay.innerHTML = '' +
      '<div class="ms-panel" style="background:white;padding:20px 16px 0;box-shadow:0 8px 32px rgba(8,28,126,0.12);border-bottom-left-radius:20px;border-bottom-right-radius:20px;">' +
        '<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">' +
          '<form id="mobile-search-form" style="flex:1;position:relative;display:flex;align-items:center;">' +
            '<svg style="position:absolute;left:14px;width:18px;height:18px;color:#8e95a9;pointer-events:none;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>' +
            '<input type="text" id="mobile-search-input" class="ms-input" placeholder="' + (getLang() === 'en' ? 'Search product...' : 'Hľadať produkt...') + '" style="width:100%;padding:14px 16px 14px 44px;font-size:16px;border:2px solid #eef1f6;border-radius:14px;background:#f8f9fc;outline:none;color:#0f1b3d;font-family:inherit;" autocomplete="off">' +
          '</form>' +
          '<button id="mobile-search-close" type="button" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:#8e95a9;flex-shrink:0;border-radius:12px;background:#f8f9fc;border:none;cursor:pointer;">' +
            '<svg style="width:18px;height:18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' +
          '</button>' +
        '</div>' +
        '<div id="mobile-search-results" style="max-height:calc(100vh - 100px);overflow-y:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;"></div>' +
      '</div>';

    document.body.appendChild(mobileOverlay);

    var mobileInput = document.getElementById('mobile-search-input');
    var mobileResults = document.getElementById('mobile-search-results');
    var mobileForm = document.getElementById('mobile-search-form');

    // Open overlay with animation
    searchBtn.addEventListener('click', function() {
      mobileOverlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          mobileOverlay.classList.add('open');
        });
      });
      setTimeout(function() { mobileInput.focus(); }, 300);
    });

    // Close overlay with animation
    function closeMobileSearch() {
      mobileOverlay.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function() {
        mobileOverlay.style.display = 'none';
        mobileInput.value = '';
        mobileResults.innerHTML = '';
      }, 280);
    }

    document.getElementById('mobile-search-close').addEventListener('click', closeMobileSearch);
    mobileOverlay.addEventListener('click', function(e) {
      if (e.target === mobileOverlay) closeMobileSearch();
    });

    // Search input
    mobileInput.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      var q = mobileInput.value.trim();
      if (q.length < 2) {
        mobileResults.innerHTML = '';
        return;
      }
      debounceTimer = setTimeout(async function() {
        var allProducts = await loadProducts();
        var results = search(q, allProducts);
        mobileResults.innerHTML = buildResultsHTML(results, q);
      }, 200);
    });

    // Enter
    mobileForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var q = mobileInput.value.trim();
      if (!q) return;
      closeMobileSearch();
      if (typeof window.handleSearch === 'function') {
        window.handleSearch(q);
      } else {
        window.location.href = 'produkty.html?search=' + encodeURIComponent(q);
      }
    });

    // ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobileOverlay.style.display !== 'none') {
        closeMobileSearch();
      }
    });
  }

  // ---- INIT ----
  function init() {
    // Desktop search
    var forms = document.querySelectorAll('form[id="header-search-form"]');

    forms.forEach(function(form) {
      var input = form.querySelector('input[type="text"]');
      if (!input) return;

      input.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        var q = input.value.trim();
        if (q.length < 2) {
          hideDropdown();
          return;
        }
        debounceTimer = setTimeout(async function() {
          var allProducts = await loadProducts();
          var results = search(q, allProducts);
          showDesktopResults(results, q, form);
        }, 200);
      });

      input.addEventListener('focus', function() {
        var q = input.value.trim();
        if (q.length >= 2 && dropdownEl && dropdownEl.innerHTML) {
          dropdownEl.style.display = 'block';
        }
      });

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var q = input.value.trim();
        if (!q) return;
        hideDropdown();
        if (typeof window.handleSearch === 'function') {
          window.handleSearch(q);
        } else {
          window.location.href = 'produkty.html?search=' + encodeURIComponent(q);
        }
      });
    });

    // Close desktop dropdown on click outside
    document.addEventListener('click', function(e) {
      var isInside = false;
      forms.forEach(function(form) {
        if (form.contains(e.target)) isInside = true;
      });
      if (!isInside) hideDropdown();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') hideDropdown();
    });

    // Language change
    window.addEventListener('languageChanged', function() {
      // Update mobile placeholder
      var mInput = document.getElementById('mobile-search-input');
      if (mInput) {
        mInput.placeholder = getLang() === 'en' ? 'Search product...' : 'Hľadať produkt...';
      }
      // Re-render if dropdown open
      if (dropdownEl && dropdownEl.style.display !== 'none') {
        forms.forEach(function(form) {
          var input = form.querySelector('input[type="text"]');
          if (input && input.value.trim().length >= 2) {
            input.dispatchEvent(new Event('input'));
          }
        });
      }
    });

    // Mobile search
    createMobileOverlay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
