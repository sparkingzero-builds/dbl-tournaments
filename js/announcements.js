const Announcements = (() => {
  let loaded = false;

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  const TYPE_COLORS = { info: 'var(--cyan)', warning: 'var(--gold)', success: 'var(--green)', event: 'var(--pink)' };
  const TYPE_ICONS = { info: 'ℹ️', warning: '⚠️', success: '✅', event: '🎉' };
  const DISMISSED_KEY = 'dbl_ann_dismissed';

  function getDismissed() {
    try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); } catch { return []; }
  }

  function dismiss(id) {
    const d = getDismissed();
    if (!d.includes(id)) { d.push(id); localStorage.setItem(DISMISSED_KEY, JSON.stringify(d)); }
    const el = document.getElementById('ann-' + id);
    if (el) el.remove();
    const bar = document.getElementById('announcements-bar');
    if (bar && !bar.querySelector('.ann-public-item')) bar.remove();
  }

  async function load() {
    if (loaded) return;
    loaded = true;
    if (typeof supabaseClient === 'undefined') return;

    let anns = [];
    try {
      const { data, error } = await supabaseClient
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) anns = data;
    } catch (e) {}

    const now = new Date();
    anns = anns.filter(a => !a.expires_at || new Date(a.expires_at) > now);

    const dismissed = getDismissed();
    anns = anns.filter(a => !dismissed.includes(String(a.id)));

    if (!anns.length) return;

    const bar = document.createElement('div');
    bar.id = 'announcements-bar';
    bar.innerHTML = anns.map(a => {
      const color = TYPE_COLORS[a.type] || 'var(--cyan)';
      const icon = TYPE_ICONS[a.type] || '';
      return '<div class="ann-public-item" id="ann-' + esc(String(a.id)) + '" style="border-left:3px solid ' + color + ';">' +
        '<div class="ann-public-content">' +
          '<span class="ann-public-icon">' + icon + '</span>' +
          '<strong style="color:' + color + ';">' + esc(a.title) + '</strong>' +
          '<span class="ann-public-sep">—</span>' +
          '<span>' + esc(a.body) + '</span>' +
        '</div>' +
        '<button class="ann-dismiss" onclick="Announcements.dismiss(\'' + esc(String(a.id)) + '\')" title="Dismiss">&times;</button>' +
      '</div>';
    }).join('');

    document.body.appendChild(bar);
    const main = document.querySelector('main');
    if (main) {
      const barHeight = anns.length * 48 + 16;
      main.style.paddingTop = (parseInt(getComputedStyle(main).paddingTop) + barHeight) + 'px';
    }

    if (!document.getElementById('ann-public-styles')) {
      const style = document.createElement('style');
      style.id = 'ann-public-styles';
      style.textContent =
        '#announcements-bar{position:fixed;top:58px;left:0;right:0;z-index:999;width:100%;max-width:1200px;margin:0 auto;padding:8px 16px;}' +
        '.ann-public-item{display:flex;align-items:center;justify-content:space-between;background:var(--panel,#1a1535);border-radius:6px;padding:10px 14px;margin-bottom:6px;gap:12px;animation:annSlide .4s ease-out;}' +
        '.ann-public-content{display:flex;align-items:center;gap:8px;flex:1;min-width:0;font-size:14px;color:var(--text,#e8e4f8);}' +
        '.ann-public-icon{font-size:16px;flex-shrink:0;}' +
        '.ann-public-sep{color:var(--muted,#9088b8);margin:0 2px;}' +
        '.ann-public-content span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
        '.ann-dismiss{background:none;border:none;color:var(--muted,#9088b8);font-size:20px;cursor:pointer;padding:0 4px;line-height:1;transition:color .2s;}' +
        '.ann-dismiss:hover{color:var(--red,#ff4757);}' +
        '@keyframes annSlide{from{opacity:0;transform:translateY(-10px);}to{opacity:1;transform:translateY(0);}}' +
        '@media(max-width:600px){.ann-public-content{font-size:12px;}.ann-public-sep{display:none;}.ann-public-content{flex-wrap:wrap;}}';
      document.head.appendChild(style);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(load, 200));
  } else {
    setTimeout(load, 200);
  }

  return { load, dismiss };
})();
