const AUTH = {
  user: null,
  session: null,

  async init() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      this.session = session;
      this.user = session.user;
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
      this.session = session;
      this.user = session?.user || null;
      this.updateUI();
    });

    this.updateUI();
    return this.user;
  },

  getDiscordUsername() {
    if (!this.user) return null;
    const meta = this.user.user_metadata;
    return meta?.custom_claims?.global_name
      || meta?.full_name
      || meta?.name
      || meta?.preferred_username
      || meta?.user_name
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
        redirectTo: window.location.href
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
    const container = document.getElementById('auth-nav');
    if (!container) return;

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
      if (this.isLoggedIn()) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });

    document.querySelectorAll('[data-auth-hide]').forEach(el => {
      if (this.isLoggedIn()) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    });
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
