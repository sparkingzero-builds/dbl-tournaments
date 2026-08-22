/**
 * Clan Tag Utility
 * Fetches and caches clan membership, provides getClanTag(username)
 */
const ClanTag = {
  _cache: {},

  async _fetchMembership(username) {
    if (!username) return null;
    const cached = sessionStorage.getItem('clan_tag_' + username);
    if (cached) return JSON.parse(cached);

    try {
      const { data } = await supabaseClient
        .from('clan_members')
        .select('clan_id, role, clans(tag, logo_emoji, color, name)')
        .ilike('discord_username', username)
        .single();

      if (data) {
        const info = {
          tag: data.clans.tag,
          emoji: data.clans.logo_emoji,
          color: data.clans.color,
          name: data.clans.name,
          role: data.role,
          clan_id: data.clan_id
        };
        sessionStorage.setItem('clan_tag_' + username, JSON.stringify(info));
        return info;
      }
    } catch (e) { /* no membership */ }

    sessionStorage.setItem('clan_tag_' + username, 'null');
    return null;
  },

  async getClanTag(username) {
    if (this._cache[username] !== undefined) return this._cache[username];
    const info = await this._fetchMembership(username);
    this._cache[username] = info;
    return info;
  },

  getClanTagHTML(info) {
    if (!info) return '';
    return `<span class="clan-tag" style="color:${info.color};border-color:${info.color}">[${info.tag}]</span>`;
  },

  clearCache(username) {
    delete this._cache[username];
    if (username) sessionStorage.removeItem('clan_tag_' + username);
  }
};
