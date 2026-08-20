(async function() {
  if (window.location.pathname.includes('/admin/')) return;
  try {
    const { data } = await supabaseClient
      .from('site_settings')
      .select('key, value')
      .in('key', ['maintenance_mode', 'maintenance_message']);
    if (!data || !data.length) return;
    const settings = {};
    data.forEach(r => settings[r.key] = r.value);
    if (settings.maintenance_mode !== 'true' && settings.maintenance_mode !== true) return;
    const msg = settings.maintenance_message || 'Site is currently under maintenance. Some features may be unavailable.';
    const banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#ff4757,#ff2d78);color:#fff;text-align:center;padding:10px 16px;font-family:"Exo 2",sans-serif;font-size:13px;font-weight:700;letter-spacing:0.05em;box-shadow:0 2px 12px rgba(255,45,120,0.3);';
    banner.textContent = msg;
    document.body.prepend(banner);
    document.body.style.paddingTop = (banner.offsetHeight) + 'px';
  } catch(e) {}
})();
