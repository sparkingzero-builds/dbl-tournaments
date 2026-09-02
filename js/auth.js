const AUTH = {
  user: null,
  session: null,

  async init() {
    // If URL has auth hash fragment, let Supabase exchange it first
    if (window.location.hash && window.location.hash.includes('access_token')) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          const { data, error } = await supabaseClient.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (data?.session) {
            this.session = data.session;
            this.user = data.session.user;
          }
          // Clean the hash from URL
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      } catch (e) {
        console.error('Auth hash processing error:', e);
      }
    }

    // Fallback: check existing session
    if (!this.user) {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
          this.session = session;
          this.user = session.user;
        }
      } catch (e) {
        console.error('Get session error:', e);
      }
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
      this.session = session;
      this.user = session?.user || null;
      this.updateUI();
      if (session?.user) this.syncPlayerIdentity();
    });

    this.updateUI();
    if (this.user) this.syncPlayerIdentity();
    return this.user;
  },

  getDiscordUsername() {
    if (!this.user) return null;
    const meta = this.user.user_metadata;
    const username = meta?.full_name
      || meta?.preferred_username
      || meta?.user_name
      || meta?.custom_claims?.global_name
      || meta?.name
      || null;
    return username;
  },

  getDiscordId() {
    if (!this.user) return null;
    return this.user.user_metadata?.provider_id
      || this.user.user_metadata?.sub
      || null;
  },

  getDiscordAvatar() {
    if (!this.user) return null;
    const meta = this.user.user_metadata;
    return meta?.avatar_url || null;
  },

  isLoggedIn() {
    return !!this.user;
  },

  async login() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  },

  async logout() {
    await supabaseClient.auth.signOut();
    this.user = null;
    this.session = null;
    this.updateUI();
    window.location.reload();
  },

  updateUI() {
    let container = document.getElementById('auth-nav');
    if (!container) {
      const nav = document.querySelector('.navbar .container');
      if (!nav) return;
      container = document.createElement('div');
      container.id = 'auth-nav';
      container.style.cssText = 'margin-left:auto;display:flex;align-items:center;';
      nav.appendChild(container);
    }

    if (this.isLoggedIn()) {
      const name = this.getDiscordUsername() || 'User';
      const avatar = this.getDiscordAvatar();
      container.innerHTML = `
        <div class="auth-user">
          ${avatar ? `<img src="${avatar}" class="auth-avatar" alt="" />` : ''}
          <span class="auth-name">${name}</span>
          <button class="auth-logout" onclick="AUTH.logout()">Logout</button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button class="auth-login-btn" onclick="AUTH.login()">
          <svg width="18" height="14" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:6px;">
            <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.8 40.8 0 00-1.8 3.7 54 54 0 00-16.2 0A37.4 37.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.2a58.9 58.9 0 0017.7 9a.2.2 0 00.3-.1 42.1 42.1 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.7.2.2 0 01 0-.4l1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.7.2.2 0 00-.1.3 47.3 47.3 0 003.6 5.9.2.2 0 00.3.1A58.7 58.7 0 0070.4 45.7v-.2c1.4-15-2.3-28.4-9.8-40.1a.2.2 0 00-.1-.1zM23.7 37.3c-3.5 0-6.3-3.2-6.3-7.1s2.8-7.1 6.3-7.1 6.4 3.2 6.3 7.1c0 3.9-2.8 7.1-6.3 7.1zm23.2 0c-3.5 0-6.3-3.2-6.3-7.1s2.8-7.1 6.3-7.1 6.4 3.2 6.3 7.1c0 3.9-2.7 7.1-6.3 7.1z" fill="currentColor"/>
          </svg>
          Login with Discord
        </button>
      `;
    }

    document.querySelectorAll('[data-auth-required]').forEach(el => {
      el.style.display = this.isLoggedIn() ? '' : 'none';
    });

    document.querySelectorAll('[data-auth-hide]').forEach(el => {
      el.style.display = this.isLoggedIn() ? 'none' : '';
    });
  },

  async syncPlayerIdentity() {
    try {
      const discordId = this.getDiscordId();
      const username = this.getDiscordUsername();
      if (!discordId || !username) return;

      const tables = ['player_points', 'elo_ratings', 'bounties'];
      for (const table of tables) {
        const { data } = await supabaseClient
          .from(table)
          .select('discord_username, discord_id')
          .eq('discord_id', discordId)
          .limit(1)
          .maybeSingle();

        if (data && data.discord_username !== username) {
          await supabaseClient
            .from(table)
            .update({ discord_username: username })
            .eq('discord_id', discordId);
        } else if (!data) {
          const { data: byName } = await supabaseClient
            .from(table)
            .select('discord_username, discord_id')
            .ilike('discord_username', username)
            .limit(1)
            .maybeSingle();
          if (byName && !byName.discord_id) {
            await supabaseClient
              .from(table)
              .update({ discord_id: discordId })
              .ilike('discord_username', username);
          }
        }
      }
    } catch (e) {
      // Non-critical — don't block login
    }
  },

  requireLogin(action) {
    if (this.isLoggedIn()) return true;
    if (confirm('You need to login with Discord to ' + action + '. Login now?')) {
      this.login();
    }
    return false;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof supabaseClient !== 'undefined') {
    AUTH.init();
  }
});
