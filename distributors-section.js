// Inserts the distributors section before the page footer.
// Skipped if a #distributori element already exists (e.g. on index.html).
(function () {
  if (document.getElementById('distributori')) return;

  const footer = document.querySelector('footer');
  if (!footer) return;

  const section = document.createElement('section');
  section.id = 'distributori';
  section.className = 'py-16 md:py-24 bg-white';
  section.innerHTML = `
    <div class="max-w-7xl mx-auto px-5 md:px-6">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold tracking-[-0.02em] mb-4" data-i18n-html="section.distributors.title">Naši <span class="gradient-text">distribútori</span></h2>
        <p class="text-brand-gray-700 text-lg" data-i18n="section.distributors.description">Spoľahliví partneri pre distribúciu našich produktov.</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
        <a href="distributor.html?slug=tes" class="dist-logo flex items-center justify-center h-20 bg-brand-gray-50 rounded-xl px-4" title="TES – SLOVAKIA, s.r.o.">
          <img src="Brand/distributors/tes.png" alt="TES" class="max-h-11 max-w-full object-contain">
        </a>
        <a href="distributor.html?slug=aircom" class="dist-logo flex items-center justify-center h-20 bg-brand-gray-50 rounded-xl px-4" title="AIRCOM Praha s.r.o.">
          <img src="Brand/distributors/aircom.png" alt="AIRCOM" class="max-h-11 max-w-full object-contain">
        </a>
        <a href="distributor.html?slug=daxa-it" class="dist-logo flex items-center justify-center h-20 bg-brand-gray-50 rounded-xl px-4" title="Daxa IT s. r. o.">
          <img src="Brand/distributors/daxa-it.png" alt="DAXA-IT" class="max-h-11 max-w-full object-contain">
        </a>
        <a href="distributor.html?slug=axilogi" class="dist-logo flex items-center justify-center h-20 bg-brand-gray-50 rounded-xl px-4" title="Axilogi s.r.o.">
          <img src="Brand/distributors/axilogi.png" alt="AXILOGI s.r.o." class="max-h-11 max-w-full object-contain">
        </a>
        <a href="distributor.html?slug=hacom" class="dist-logo flex items-center justify-center h-20 bg-brand-gray-50 rounded-xl px-4" title="Hacom">
          <img src="Brand/distributors/hacom.png" alt="HACOM" class="max-h-11 max-w-full object-contain">
        </a>
        <a href="distributor.html?slug=ab-com" class="dist-logo flex items-center justify-center h-20 bg-brand-gray-50 rounded-xl px-4" title="AB-COM">
          <img src="Brand/distributors/ab-com.png" alt="AB-COM" class="max-h-11 max-w-full object-contain">
        </a>
      </div>
    </div>
  `;

  footer.parentNode.insertBefore(section, footer);

  // Re-apply i18n translations to the freshly added subtree
  if (window.i18n && window.i18n.ready) {
    window.i18n.setLang(window.i18n.lang);
  }
})();
