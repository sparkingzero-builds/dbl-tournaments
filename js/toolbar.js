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
    updateIcons();
  }

  function cycleTheme() {
    const themeKeys = Object.keys(ThemeManager.getAll());
    const idx = themeKeys.indexOf(currentTheme);
    currentTheme = themeKeys[(idx + 1) % themeKeys.length];
    localStorage.setItem('dbl_theme', currentTheme);
    ThemeManager.apply(currentTheme);
    updateIcons();
    if (!soundMuted) playSound('click');
  }

  function updateIcons() {
    const soundBtn = document.getElementById('tb-sound');
    const themeBtn = document.getElementById('tb-theme');
    if (soundBtn) soundBtn.textContent = soundMuted ? '??' : '??';
    if (themeBtn) {
      const all = ThemeManager.getAll();
      themeBtn.textContent = all[currentTheme]?.icon || '??';
      themeBtn.title = 'Theme: ' + (all[currentTheme]?.name || 'Cyberpunk');
    }
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
      <button id="tb-search" class="tb-btn" onclick="Toolbar.openSearch()" title="Find Player">??</button>
      <button id="tb-theme" class="tb-btn" onclick="Toolbar.cycleTheme()" title="Cycle Theme">??</button>
      <button id="tb-sound" class="tb-btn" onclick="Toolbar.toggleSound()" title="Toggle Sound">??</button>
    `;
    document.body.appendChild(bar);
    updateIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { toggleSound, cycleTheme, openSearch: openPlayerSearch, closeSearch };
})();
