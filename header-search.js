(function() {
  let products = null;
  let dropdownEl = null;
  let debounceTimer = null;

  function getLang() {
    return localStorage.getItem('dataway_lang') || 'sk';
  }

  function pName(p) {
    return getLang() === 'en' ? (p.name_en || p.name) : p.name;
  }

  function pCategory(p) {
    return getLang() === 'en' ? (p.category_en || p.category) : p.category;
  }

  async function loadProducts() {
    if (products) return products;
    // Use inline PRODUCTS if available (produkty.html, produkt.html)
    if (window.PRODUCTS) {
      products = window.PRODUCTS;
      return products;
    }
    // Otherwise fetch products.json
    try {
      const res = await fetch('products.json');
      products = await res.json();
      return products;
    } catch(e) {
      console.error('Failed to load products for search:', e);
      return [];
    }
  }

  function search(query, allProducts) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    return allProducts.filter(function(p) {
      var haystack = [
        p.name, p.name_en, p.category, p.category_en,
        p.subcategory, p.subcategory_en,
        p.code, p.partNumber
      ].filter(Boolean).join(' ').toLowerCase();
      return words.every(function(w) { return haystack.includes(w); });
    });
  }

  function createDropdown(form) {
    if (dropdownEl) return dropdownEl;
    dropdownEl = document.createElement('div');
    dropdownEl.id = 'header-search-dropdown';
    dropdownEl.style.cssText = 'position:absolute;top:100%;left:0;right:0;margin-top:4px;background:white;border-radius:12px;box-shadow:0 4px 24px rgba(8,28,126,0.15),0 0 0 1px rgba(58,89,241,0.08);z-index:100;overflow:hidden;display:none;min-width:320px;max-height:420px;overflow-y:auto;';
    form.style.position = 'relative';
    form.appendChild(dropdownEl);
    return dropdownEl;
  }

  function showResults(results, query, form, input) {
    var dd = createDropdown(form);
    var lang = getLang();
    var maxShow = 6;
    var shown = results.slice(0, maxShow);

    if (shown.length === 0) {
      var noResultsText = lang === 'en' ? 'No products found' : 'Žiadne produkty';
      dd.innerHTML = '<div style="padding:16px 20px;color:#8e95a9;font-size:13px;text-align:center;">' + noResultsText + '</div>';
      dd.style.display = 'block';
      return;
    }

    var html = '';
    shown.forEach(function(p) {
      var name = pName(p);
      var cat = pCategory(p);
      var img = p.image || 'Brand/Loga-na-sirku-450-x-120-px-11.webp';
      html += '<a href="produkt.html?slug=' + p.slug + '" style="display:flex;align-items:center;gap:12px;padding:10px 16px;text-decoration:none;transition:background 0.15s;border-bottom:1px solid #f0f1f5;" onmouseover="this.style.background=\'#f8f9fc\'" onmouseout="this.style.background=\'transparent\'">';
      html += '<div style="width:44px;height:44px;flex-shrink:0;background:#f8f9fc;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;">';
      html += '<img src="' + img + '" alt="" style="max-width:100%;max-height:100%;object-fit:contain;mix-blend-mode:multiply;" onerror="this.src=\'Brand/Loga-na-sirku-450-x-120-px-11.webp\';this.style.opacity=\'0.3\'">';
      html += '</div>';
      html += '<div style="flex:1;min-width:0;">';
      html += '<div style="font-size:13px;font-weight:600;color:#0f1b3d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + name + '</div>';
      html += '<div style="font-size:11px;color:#8e95a9;">' + cat + '</div>';
      html += '</div>';
      html += '</a>';
    });

    if (results.length > maxShow) {
      var allText = lang === 'en'
        ? 'View all results (' + results.length + ')'
        : 'Zobraziť všetky výsledky (' + results.length + ')';
      html += '<a href="produkty.html?search=' + encodeURIComponent(query) + '" style="display:block;padding:12px 16px;text-align:center;font-size:13px;font-weight:600;color:#3a59f1;text-decoration:none;transition:background 0.15s;" onmouseover="this.style.background=\'#f8f9fc\'" onmouseout="this.style.background=\'transparent\'">' + allText + '</a>';
    }

    dd.innerHTML = html;
    dd.style.display = 'block';
  }

  function hideDropdown() {
    if (dropdownEl) dropdownEl.style.display = 'none';
  }

  function init() {
    // Find header search forms on the page
    var forms = document.querySelectorAll('form[id="header-search-form"]');
    if (forms.length === 0) return;

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
          showResults(results, q, form, input);
        }, 200);
      });

      input.addEventListener('focus', function() {
        var q = input.value.trim();
        if (q.length >= 2 && dropdownEl && dropdownEl.innerHTML) {
          dropdownEl.style.display = 'block';
        }
      });

      // Handle Enter — on produkty.html use existing search, elsewhere redirect
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var q = input.value.trim();
        if (!q) return;
        hideDropdown();

        // If on produkty.html, use the page's handleSearch function
        if (typeof window.handleSearch === 'function') {
          window.handleSearch(q);
          return;
        }
        // Otherwise redirect to produkty.html
        window.location.href = 'produkty.html?search=' + encodeURIComponent(q);
      });
    });

    // Close dropdown on click outside
    document.addEventListener('click', function(e) {
      var isInside = false;
      forms.forEach(function(form) {
        if (form.contains(e.target)) isInside = true;
      });
      if (!isInside) hideDropdown();
    });

    // Close on ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') hideDropdown();
    });

    // Re-render on language change
    window.addEventListener('languageChanged', function() {
      if (dropdownEl && dropdownEl.style.display !== 'none') {
        forms.forEach(function(form) {
          var input = form.querySelector('input[type="text"]');
          if (input && input.value.trim().length >= 2) {
            input.dispatchEvent(new Event('input'));
          }
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
