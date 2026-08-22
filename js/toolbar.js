// Mobile nav: make "More" dropdown toggle on click instead of always open
document.addEventListener('DOMContentLoaded', () => {
  const dropdown = document.querySelector('.nav-dropdown > a');
  if (dropdown) {
    dropdown.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        e.stopPropagation();
        const menu = dropdown.parentElement.querySelector('.nav-dropdown-menu');
        if (menu) menu.classList.toggle('open');
      }
    });
  }
  // Close nav when a link is tapped on mobile
  document.querySelectorAll('.navbar-links a:not(.nav-dropdown > a)').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        document.querySelector('.navbar-links')?.classList.remove('open');
      }
    });
  });
});

const Toolbar = (() => {
  let soundMuted = localStorage.getItem('dbl_sound_muted') === 'true';
  let currentTheme = localStorage.getItem('dbl_theme') || 'cyberpunk';

  if (soundMuted) {
    const origPlay = window.playSound;
    window.playSound = function() {};
    window._origPlaySound = origPlay;
  }

  if (currentTheme !== 'cyberpunk') {
    ThemeManager.apply(currentTheme);
  }

  function toggleSound() {
    soundMuted = !soundMuted;
    localStorage.setItem('dbl_sound_muted', soundMuted);
    if (soundMuted) {
      window._origPlaySound = window._origPlaySound || window.playSound;
      window.playSound = function() {};
    } else {
      if (window._origPlaySound) window.playSound = window._origPlaySound;
      playSound('click');
    }
    updateSettingsPanel();
  }

  function setTheme(name) {
    currentTheme = name;
    localStorage.setItem('dbl_theme', currentTheme);
    ThemeManager.apply(currentTheme);
    updateSettingsPanel();
    if (!soundMuted && window.playSound) playSound('click');
  }

  function updateSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    if (!panel || panel.style.display === 'none') return;
    const soundToggle = panel.querySelector('.sound-toggle');
    if (soundToggle) soundToggle.textContent = soundMuted ? '\u{1F507} Sound: OFF' : '\u{1F50A} Sound: ON';
    panel.querySelectorAll('.theme-option').forEach(el => {
      el.classList.toggle('active', el.dataset.theme === currentTheme);
    });
  }

  function openSettings() {
    let overlay = document.getElementById('settings-overlay');
    if (overlay) { overlay.style.display = 'flex'; updateSettingsPanel(); return; }

    overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';

    const themes = ThemeManager.getAll();
    const themeGrid = Object.entries(themes).map(([key, t]) =>
      `<div class="theme-option${key === currentTheme ? ' active' : ''}" data-theme="${key}" onclick="Toolbar.setTheme('${key}')">
        <span class="theme-icon">${t.icon}</span>
        <span class="theme-label">${t.name}</span>
      </div>`
    ).join('');

    overlay.innerHTML = `
      <div id="settings-panel" style="background:var(--panel,#1a1535);border:1px solid var(--line,#2e2755);border-radius:12px;padding:28px;width:90%;max-width:420px;color:var(--text,#e8e4f8);font-family:'Exo 2',sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h2 style="margin:0;font-size:20px;color:var(--cyan,#00e5ff);text-transform:uppercase;letter-spacing:0.06em;">\u{2699}️ Settings</h2>
          <button onclick="Toolbar.closeSettings()" style="background:none;border:none;color:var(--muted,#9088b8);font-size:24px;cursor:pointer;padding:0;line-height:1;">&times;</button>
        </div>

        <div style="margin-bottom:24px;">
          <h3 style="font-size:13px;color:var(--muted,#9088b8);text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">\u{1F3A8} Theme</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;">
            ${themeGrid}
          </div>
        </div>

        <div style="margin-bottom:24px;">
          <h3 style="font-size:13px;color:var(--muted,#9088b8);text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">\u{1F50A} Audio</h3>
          <button class="sound-toggle" onclick="Toolbar.toggleSound()" style="width:100%;padding:12px;background:var(--bg,#0d0a1a);border:1px solid var(--line,#2e2755);border-radius:8px;color:var(--text,#e8e4f8);font-family:'Chakra Petch',sans-serif;font-size:14px;cursor:pointer;transition:border-color 0.2s;">
            ${soundMuted ? '\u{1F507} Sound: OFF' : '\u{1F50A} Sound: ON'}
          </button>
        </div>

        <div style="font-size:11px;color:var(--muted,#9088b8);text-align:center;opacity:0.6;">Settings are saved locally</div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .theme-option {
        display:flex;flex-direction:column;align-items:center;gap:4px;
        padding:10px 8px;background:var(--bg,#0d0a1a);border:2px solid var(--line,#2e2755);
        border-radius:8px;cursor:pointer;transition:all 0.2s;
      }
      .theme-option:hover { border-color:var(--muted,#9088b8); }
      .theme-option.active { border-color:var(--cyan,#00e5ff);box-shadow:0 0 10px rgba(0,229,255,0.2); }
      .theme-icon { font-size:22px; }
      .theme-label { font-size:11px;color:var(--muted,#9088b8);font-family:'Chakra Petch',sans-serif; }
      .theme-option.active .theme-label { color:var(--cyan,#00e5ff); }
      .sound-toggle:hover { border-color:var(--cyan,#00e5ff)!important; }
    `;
    overlay.appendChild(style);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) Toolbar.closeSettings();
    });

    document.body.appendChild(overlay);
  }

  function closeSettings() {
    const overlay = document.getElementById('settings-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function openPlayerSearch() {
    let overlay = document.getElementById('player-search-overlay');
    if (overlay) { overlay.style.display = 'flex'; return; }

    overlay = document.createElement('div');
    overlay.id = 'player-search-overlay';
    overlay.innerHTML = `
      <div class="ps-modal">
        <div class="ps-header">
          <h3>Find Player</h3>
          <button class="ps-close" onclick="Toolbar.closeSearch()">&times;</button>
        </div>
        <input type="search" id="ps-input" class="input" placeholder="Enter player name..." autofocus />
        <div id="ps-results" class="ps-results"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) Toolbar.closeSearch();
    });

    const input = document.getElementById('ps-input');
    input.addEventListener('input', debounce(searchPlayers, 300));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') Toolbar.closeSearch();
    });
    setTimeout(() => input.focus(), 50);
  }

  function closeSearch() {
    const overlay = document.getElementById('player-search-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  async function searchPlayers() {
    const query = document.getElementById('ps-input').value.trim();
    const results = document.getElementById('ps-results');
    if (!query || query.length < 2) {
      results.innerHTML = '<div class="ps-empty">Type at least 2 characters...</div>';
      return;
    }

    results.innerHTML = '<div class="ps-empty">Searching...</div>';

    try {
      const { data } = await supabaseClient
        .from('player_points')
        .select('discord_username, balance, lifetime_earned')
        .ilike('discord_username', `%${query}%`)
        .order('lifetime_earned', { ascending: false })
        .limit(10);

      if (!data || data.length === 0) {
        results.innerHTML = '<div class="ps-empty">No players found</div>';
        return;
      }

      results.innerHTML = data.map(p => `
        <a href="${window.location.pathname.includes('/admin/') ? '../' : ''}profile.html?player=${encodeURIComponent(p.discord_username)}" class="ps-result">
          <span class="ps-name">${p.discord_username}</span>
          <span class="ps-stats">${p.lifetime_earned || 0} pts earned</span>
        </a>
      `).join('');
    } catch (e) {
      results.innerHTML = '<div class="ps-empty">Error searching</div>';
    }
  }

  function debounce(fn, ms) {
    let t;
    return function() {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function init() {
    const bar = document.createElement('div');
    bar.className = 'site-toolbar';
    bar.innerHTML = `
      <button id="tb-search" class="tb-btn" onclick="Toolbar.openSearch()" title="Find Player">\u{1F50D}</button>
      <button id="tb-settings" class="tb-btn" onclick="Toolbar.openSettings()" title="Settings">\u{2699}️</button>
    `;
    document.body.appendChild(bar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { toggleSound, setTheme, openSearch: openPlayerSearch, closeSearch, openSettings, closeSettings };
})();
