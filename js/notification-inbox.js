const NotifInbox = (() => {
  let isOpen = false;
  let notifications = [];
  let username = '';
  let bellEl = null;
  let panelEl = null;
  let pollInterval = null;
  let initialized = false;
  let fetching = false;
  const isAdmin = window.location.pathname.includes('/admin/');
  const pathPrefix = isAdmin ? '../' : '';

  function getReadKey() { return 'dbl_notif_read_' + username; }
  function getReadIds() {
    try { return JSON.parse(localStorage.getItem(getReadKey()) || '[]'); } catch { return []; }
  }
  function markRead(id) {
    const read = getReadIds();
    if (!read.includes(id)) {
      read.push(id);
      try { localStorage.setItem(getReadKey(), JSON.stringify(read.slice(-200))); } catch {}
    }
  }
  function markAllRead() {
    const ids = notifications.map(n => n.id);
    const read = getReadIds();
    ids.forEach(id => { if (!read.includes(id)) read.push(id); });
    try { localStorage.setItem(getReadKey(), JSON.stringify(read.slice(-200))); } catch {}
    updateBadge();
    renderList();
  }

  function init() {
    if (initialized) return;
    if (typeof AUTH === 'undefined' || !AUTH.isLoggedIn()) return;
    username = AUTH.getDiscordUsername();
    if (!username) return;

    initialized = true;
    createUI();
    fetchAll();
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(fetchAll, 60000);
  }

  function createUI() {
    if (bellEl) return;

    bellEl = document.createElement('div');
    bellEl.className = 'notif-bell';
    bellEl.innerHTML = `
      <button class="notif-bell-btn" aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span class="notif-badge" style="display:none;">0</span>
      </button>
    `;

    panelEl = document.createElement('div');
    panelEl.className = 'notif-panel';
    panelEl.style.display = 'none';
    panelEl.innerHTML = `
      <div class="notif-panel-header">
        <span class="notif-panel-title">Notifications</span>
        <button class="notif-mark-all">Mark all read</button>
      </div>
      <div class="notif-panel-list">
        <div class="notif-empty">No notifications</div>
      </div>
    `;

    panelEl.querySelector('.notif-mark-all').addEventListener('click', () => markAllRead());

    bellEl.querySelector('.notif-bell-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });

    document.addEventListener('click', (e) => {
      if (isOpen && !panelEl.contains(e.target) && !bellEl.contains(e.target)) close();
    });

    const navbar = document.querySelector('.navbar .container');
    if (navbar) {
      const wrapper = document.createElement('div');
      wrapper.className = 'notif-wrapper';
      wrapper.appendChild(bellEl);
      wrapper.appendChild(panelEl);

      const navLinks = navbar.querySelector('.navbar-links');
      if (navLinks) navbar.insertBefore(wrapper, navLinks);
      else navbar.appendChild(wrapper);
    }

    injectStyles();
  }

  function toggle() { isOpen ? close() : open(); }
  function open() {
    isOpen = true;
    panelEl.style.display = '';
    panelEl.classList.add('notif-panel-enter');
    setTimeout(() => panelEl.classList.remove('notif-panel-enter'), 300);
  }
  function close() {
    isOpen = false;
    panelEl.style.display = 'none';
  }

  async function fetchAll() {
    if (!username || fetching) return;
    fetching = true;
    const items = [];

    try {
      const { data: pending, error } = await supabaseClient
        .from('bounty_challenges')
        .select('id, challenger, target, created_at, bounty_at_stake')
        .ilike('target', username)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) console.warn('NotifInbox: pending challenges query failed', error.message);

      if (pending) pending.forEach(c => {
        items.push({
          id: 'bc_pending_' + c.id,
          type: 'bounty_challenge',
          icon: '&#x1F525;',
          title: 'Bounty Challenge!',
          body: `<strong>${esc(c.challenger)}</strong> challenged you! Stake: <span style="color:var(--gold);">${(c.bounty_at_stake || 0).toLocaleString()}</span>`,
          time: c.created_at,
          action: pathPrefix + 'bounty.html',
          priority: 3
        });
      });
    } catch (e) { console.warn('NotifInbox: pending challenges error', e); }

    // Accepted challenges — use two separate queries to avoid .or() injection
    try {
      const [r1, r2] = await Promise.all([
        supabaseClient.from('bounty_challenges').select('id, challenger, target, created_at')
          .ilike('challenger', username).eq('status', 'accepted').order('created_at', { ascending: false }).limit(10),
        supabaseClient.from('bounty_challenges').select('id, challenger, target, created_at')
          .ilike('target', username).eq('status', 'accepted').order('created_at', { ascending: false }).limit(10)
      ]);
      if (r1.error) console.warn('NotifInbox: accepted q1 failed', r1.error.message);
      if (r2.error) console.warn('NotifInbox: accepted q2 failed', r2.error.message);

      const accepted = [...(r1.data || []), ...(r2.data || [])];
      const seen = new Set();
      accepted.forEach(c => {
        if (seen.has(c.id)) return;
        seen.add(c.id);
        const opponent = c.challenger.toLowerCase() === username.toLowerCase() ? c.target : c.challenger;
        items.push({
          id: 'bc_accepted_' + c.id,
          type: 'bounty_match',
          icon: '&#x2694;&#xFE0F;',
          title: 'Match Awaiting',
          body: `Your bounty match vs <strong>${esc(opponent)}</strong> is active! Report the result.`,
          time: c.created_at,
          action: pathPrefix + 'bounty.html',
          priority: 2
        });
      });
    } catch (e) { console.warn('NotifInbox: accepted challenges error', e); }

    // Completed challenges — same approach, two queries
    try {
      const [r1, r2] = await Promise.all([
        supabaseClient.from('bounty_challenges').select('id, challenger, target, winner, resolved_at')
          .ilike('challenger', username).eq('status', 'completed').order('resolved_at', { ascending: false }).limit(5),
        supabaseClient.from('bounty_challenges').select('id, challenger, target, winner, resolved_at')
          .ilike('target', username).eq('status', 'completed').order('resolved_at', { ascending: false }).limit(5)
      ]);

      const completed = [...(r1.data || []), ...(r2.data || [])];
      const seen = new Set();
      completed.forEach(c => {
        if (seen.has(c.id)) return;
        seen.add(c.id);
        const won = c.winner && c.winner.toLowerCase() === username.toLowerCase();
        const opponent = c.challenger.toLowerCase() === username.toLowerCase() ? c.target : c.challenger;
        items.push({
          id: 'bc_done_' + c.id,
          type: won ? 'bounty_win' : 'bounty_loss',
          icon: won ? '&#x1F3C6;' : '&#x1F4A5;',
          title: won ? 'Bounty Victory!' : 'Bounty Defeat',
          body: won
            ? `You defeated <strong>${esc(opponent)}</strong> and claimed their bounty!`
            : `<strong>${esc(opponent)}</strong> claimed your bounty.`,
          time: c.resolved_at,
          action: pathPrefix + 'bounty.html',
          priority: 1
        });
      });
    } catch (e) { console.warn('NotifInbox: completed challenges error', e); }

    try {
      const { data: tournaments, error } = await supabaseClient
        .from('tournaments')
        .select('id, name, status, start_date, created_at')
        .in('status', ['open', 'active'])
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) console.warn('NotifInbox: tournaments query failed', error.message);

      if (tournaments) {
        const now = Date.now();
        const in24h = now + 86400000;
        tournaments.forEach(t => {
          if (t.status === 'open') {
            items.push({
              id: 'tourney_open_' + t.id,
              type: 'tournament_open',
              icon: '&#x1F3AF;',
              title: 'Tournament Open!',
              body: `<strong>${esc(t.name)}</strong> is now accepting sign-ups!`,
              time: t.created_at,
              action: pathPrefix + 'tournament.html',
              priority: 3
            });
            // Check if starting within 24 hours
            if (t.start_date) {
              const startTime = new Date(t.start_date).getTime();
              if (startTime > now && startTime <= in24h) {
                items.push({
                  id: 'tourney_soon_' + t.id,
                  type: 'tournament_soon',
                  icon: '&#x23F0;',
                  title: 'Tournament Starting Soon!',
                  body: `<strong>${esc(t.name)}</strong> starts in less than 24 hours!`,
                  time: t.created_at,
                  action: pathPrefix + 'tournament.html',
                  priority: 3
                });
              }
            }
          } else if (t.status === 'active') {
            items.push({
              id: 'tourney_active_' + t.id,
              type: 'tournament_active',
              icon: '&#x26A1;',
              title: 'Tournament Live!',
              body: `<strong>${esc(t.name)}</strong> is underway!`,
              time: t.created_at,
              action: pathPrefix + 'bracket.html',
              priority: 2
            });
          }
        });
      }
    } catch (e) { console.warn('NotifInbox: tournaments error', e); }

    try {
      const { data: signups } = await supabaseClient
        .from('signups')
        .select('id, tournament_id')
        .ilike('discord_username', username);

      if (signups?.length) {
        const tids = signups.map(s => s.tournament_id);
        const sids = signups.map(s => s.id);

        const { data: recentMatches, error } = await supabaseClient
          .from('matches')
          .select('id, player1_id, player2_id, winner_id, round, created_at, tournament_id')
          .in('tournament_id', tids)
          .in('player1_id', sids)
          .order('created_at', { ascending: false })
          .limit(5);

        const { data: recentMatches2 } = await supabaseClient
          .from('matches')
          .select('id, player1_id, player2_id, winner_id, round, created_at, tournament_id')
          .in('tournament_id', tids)
          .in('player2_id', sids)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) console.warn('NotifInbox: matches query failed', error.message);

        const allMatches = [...(recentMatches || []), ...(recentMatches2 || [])];
        const seenM = new Set();
        allMatches.forEach(m => {
          if (seenM.has(m.id)) return;
          seenM.add(m.id);
          if (!m.winner_id) {
            items.push({
              id: 'match_sched_' + m.id,
              type: 'match_scheduled',
              icon: '&#x1F3AE;',
              title: 'Match Scheduled',
              body: `Round ${m.round} match is waiting to be played!`,
              time: m.created_at,
              action: pathPrefix + 'bracket.html',
              priority: 2
            });
          } else {
            const won = sids.includes(m.winner_id);
            items.push({
              id: 'match_result_' + m.id,
              type: won ? 'match_win' : 'match_loss',
              icon: won ? '&#x2705;' : '&#x274C;',
              title: won ? 'Match Won!' : 'Match Lost',
              body: `Round ${m.round} result recorded.`,
              time: m.created_at,
              action: pathPrefix + 'bracket.html',
              priority: 1
            });
          }
        });
      }
    } catch (e) { console.warn('NotifInbox: matches error', e); }

    // New titles unlocked
    try {
      const { data: playerTitles } = await supabaseClient
        .from('player_titles')
        .select('id, title_id, created_at')
        .ilike('discord_username', username)
        .order('created_at', { ascending: false })
        .limit(10);

      if (playerTitles) {
        const seenKey = 'dbl_notif_seen_titles_' + username;
        let seenTitles = [];
        try { seenTitles = JSON.parse(localStorage.getItem(seenKey) || '[]'); } catch {}

        playerTitles.forEach(t => {
          if (!seenTitles.includes(t.title_id)) {
            const titleName = (typeof TitleSystem !== 'undefined' && TitleSystem.TITLES?.[t.title_id]?.name) || t.title_id;
            items.push({
              id: 'title_new_' + t.title_id,
              type: 'title_unlock',
              icon: '&#x1F451;',
              title: 'New Title Unlocked!',
              body: `You earned the <strong>${esc(titleName)}</strong> title!`,
              time: t.created_at,
              action: pathPrefix + 'profile.html',
              priority: 2
            });
          }
        });

        // Mark all current titles as seen once the user opens the panel
        if (playerTitles.length) {
          const allTitleIds = playerTitles.map(t => t.title_id);
          const handler = () => {
            try { localStorage.setItem(seenKey, JSON.stringify(allTitleIds)); } catch {}
          };
          if (bellEl) bellEl.querySelector('.notif-bell-btn')?.addEventListener('click', handler, { once: true });
        }
      }
    } catch (e) { console.warn('NotifInbox: titles error', e); }

    // Recent point transactions (last 24 hours)
    try {
      const oneDayAgoISO = new Date(Date.now() - 86400000).toISOString();
      const { data: ptxns } = await supabaseClient
        .from('point_transactions')
        .select('id, amount, reason, created_at')
        .ilike('discord_username', username)
        .gt('created_at', oneDayAgoISO)
        .gt('amount', 0)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ptxns) ptxns.forEach(tx => {
        items.push({
          id: 'pts_' + tx.id,
          type: 'points_earned',
          icon: '&#x1F4B0;',
          title: 'Points Earned!',
          body: `You earned <span style="color:var(--gold);">${(tx.amount || 0).toLocaleString()}</span> points${tx.reason ? ' (' + esc(tx.reason) + ')' : ''}!`,
          time: tx.created_at,
          action: pathPrefix + 'profile.html',
          priority: 1
        });
      });
    } catch (e) { console.warn('NotifInbox: points error', e); }

    try {
      const { data: shopItems, error } = await supabaseClient
        .from('shop_items')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) console.warn('NotifInbox: shop query failed', error.message);

      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      if (shopItems) shopItems.forEach(item => {
        if (item.created_at > oneDayAgo) {
          items.push({
            id: 'shop_new_' + item.id,
            type: 'shop_new',
            icon: '&#x1F6CD;&#xFE0F;',
            title: 'New in Shop!',
            body: `<strong>${esc(item.name)}</strong> just dropped!`,
            time: item.created_at,
            action: pathPrefix + 'shop.html',
            priority: 1
          });
        }
      });
    } catch (e) { console.warn('NotifInbox: shop error', e); }

    items.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(b.time) - new Date(a.time);
    });

    notifications = items;
    updateBadge();
    renderList();
    fetching = false;
  }

  function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days < 7) return days + 'd ago';
    return Math.floor(days / 7) + 'w ago';
  }

  function updateBadge() {
    const read = getReadIds();
    const unread = notifications.filter(n => !read.includes(n.id)).length;
    const badge = bellEl?.querySelector('.notif-badge');
    if (!badge) return;
    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : unread;
      badge.style.display = '';
      bellEl.querySelector('.notif-bell-btn').classList.add('has-unread');
    } else {
      badge.style.display = 'none';
      bellEl.querySelector('.notif-bell-btn').classList.remove('has-unread');
    }
  }

  function renderList() {
    const list = panelEl?.querySelector('.notif-panel-list');
    if (!list) return;
    const read = getReadIds();

    if (!notifications.length) {
      list.innerHTML = '<div class="notif-empty">All quiet. No notifications right now.</div>';
      return;
    }

    list.innerHTML = notifications.slice(0, 20).map(n => {
      const isRead = read.includes(n.id);
      const priorityClass = n.priority >= 3 ? 'notif-urgent' : n.priority >= 2 ? 'notif-important' : '';
      const safeId = esc(n.id);
      return `
        <a href="${n.action}" class="notif-item ${isRead ? 'read' : 'unread'} ${priorityClass}" data-notif-id="${safeId}">
          <div class="notif-item-icon">${n.icon}</div>
          <div class="notif-item-content">
            <div class="notif-item-title">${n.title}</div>
            <div class="notif-item-body">${n.body}</div>
            <div class="notif-item-time">${timeAgo(n.time)}</div>
          </div>
          ${!isRead ? '<div class="notif-unread-dot"></div>' : ''}
        </a>
      `;
    }).join('');

    list.querySelectorAll('.notif-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.notifId;
        if (id) { markRead(id); updateBadge(); }
      });
    });
  }

  function injectStyles() {
    if (document.getElementById('notif-inbox-styles')) return;
    const style = document.createElement('style');
    style.id = 'notif-inbox-styles';
    style.textContent = `
      .notif-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        margin-right: 8px;
        z-index: 1001;
      }
      .notif-bell-btn {
        position: relative;
        background: none;
        border: 1px solid var(--line);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--muted);
        transition: all 0.2s;
      }
      .notif-bell-btn:hover {
        color: var(--cyan);
        border-color: var(--cyan);
        background: rgba(0,229,255,0.05);
      }
      .notif-bell-btn.has-unread {
        color: var(--gold);
        border-color: var(--gold);
        animation: bellPulse 2s ease-in-out infinite;
      }
      @keyframes bellPulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(255,215,64,0); }
        50% { box-shadow: 0 0 12px 2px rgba(255,215,64,0.3); }
      }
      .notif-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        background: var(--red);
        color: #fff;
        font-family: 'Exo 2', sans-serif;
        font-size: 10px;
        font-weight: 900;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        box-shadow: 0 2px 8px rgba(255,71,87,0.4);
      }

      .notif-panel {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 380px;
        max-width: 92vw;
        max-height: 500px;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 12px;
        box-shadow: 0 16px 48px rgba(0,0,0,0.5);
        overflow: hidden;
        z-index: 1002;
      }
      .notif-panel-enter {
        animation: notifSlideIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes notifSlideIn {
        from { opacity: 0; transform: translateY(-8px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .notif-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid var(--line);
        background: rgba(0,0,0,0.15);
      }
      .notif-panel-title {
        font-family: 'Chakra Petch', sans-serif;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text);
      }
      .notif-mark-all {
        background: none;
        border: none;
        color: var(--cyan);
        font-family: 'Exo 2', sans-serif;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background 0.2s;
      }
      .notif-mark-all:hover { background: rgba(0,229,255,0.1); }

      .notif-panel-list {
        overflow-y: auto;
        max-height: 440px;
        scrollbar-width: thin;
        scrollbar-color: var(--line) transparent;
      }
      .notif-empty {
        padding: 40px 20px;
        text-align: center;
        color: var(--muted);
        font-size: 13px;
        font-style: italic;
      }

      .notif-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(46,39,85,0.5);
        text-decoration: none;
        transition: background 0.15s;
        position: relative;
        cursor: pointer;
      }
      .notif-item:hover { background: rgba(0,229,255,0.03); }
      .notif-item.unread { background: rgba(255,215,64,0.03); }
      .notif-item.unread:hover { background: rgba(255,215,64,0.06); }
      .notif-item.notif-urgent { border-left: 3px solid var(--red); }
      .notif-item.notif-important { border-left: 3px solid var(--gold); }

      .notif-item-icon {
        font-size: 20px;
        min-width: 28px;
        text-align: center;
        padding-top: 2px;
      }
      .notif-item-content { flex: 1; min-width: 0; }
      .notif-item-title {
        font-family: 'Chakra Petch', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: var(--text);
        margin-bottom: 3px;
      }
      .notif-item.read .notif-item-title { color: var(--muted); }
      .notif-item-body {
        font-size: 12px;
        color: var(--muted);
        line-height: 1.4;
      }
      .notif-item-body strong { color: var(--text); font-weight: 700; }
      .notif-item.read .notif-item-body strong { color: var(--muted); }
      .notif-item-time {
        font-size: 10px;
        color: var(--muted);
        margin-top: 4px;
        font-family: 'Exo 2', sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .notif-unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--cyan);
        box-shadow: 0 0 6px rgba(0,229,255,0.5);
        flex-shrink: 0;
        margin-top: 6px;
      }

      @media (max-width: 768px) {
        .notif-panel {
          position: fixed;
          top: 60px;
          right: 8px;
          left: 8px;
          width: auto;
          max-height: 70vh;
        }
        .notif-wrapper {
          position: static;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => init(), 400);

  return { init, markAllRead, refresh: fetchAll };
})();

// Alias for backward compatibility — NotificationCenter.init() delegates to NotifInbox
const NotificationCenter = NotifInbox;
