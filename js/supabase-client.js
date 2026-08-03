const SUPABASE_URL = 'https://egbcfgwdcvokptughqct.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dn8ctzhr9lUT4AfW7NYyDw_qiUHgCvY';

let supabaseClient;

function initSupabase() {
  if (typeof window.supabase !== 'undefined') {
    const options = {};
    const adminKey = new URLSearchParams(window.location.search).get('key')
      || sessionStorage.getItem('admin_key');
    if (adminKey) {
      sessionStorage.setItem('admin_key', adminKey);
      options.global = { headers: { 'x-admin-key': adminKey } };
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
  } else {
    console.error('Supabase SDK not loaded');
  }
  return supabaseClient;
}

initSupabase();

function getAdminKey() {
  let key = sessionStorage.getItem('admin_key');
  if (!key) {
    const params = new URLSearchParams(window.location.search);
    key = params.get('key');
    if (key) {
      sessionStorage.setItem('admin_key', key);
    }
  }
  return key;
}

function isAdmin() {
  return !!getAdminKey();
}

function adminHeaders() {
  const key = getAdminKey();
  return key ? { 'x-admin-key': key } : {};
}

// Database helpers
const db = {
  // Tournaments
  async getActiveTournament() {
    const { data, error } = await supabaseClient
      .from('tournaments')
      .select('*')
      .in('status', ['signup', 'banning', 'active'])
      .limit(1)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  },

  async getTournament(id) {
    const { data, error } = await supabaseClient
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getAllTournaments() {
    const { data, error } = await supabaseClient
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createTournament(tournament) {
    const { data, error } = await supabaseClient
      .from('tournaments')
      .insert(tournament)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTournament(id, updates) {
    const { data, error } = await supabaseClient
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Signups
  async getSignups(tournamentId) {
    const { data, error } = await supabaseClient
      .from('signups')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async signup(tournamentId, discordUsername, team) {
    const { data, error } = await supabaseClient
      .from('signups')
      .insert({
        tournament_id: tournamentId,
        discord_username: discordUsername,
        team: team
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeSignup(id) {
    const { error } = await supabaseClient
      .from('signups')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Matches
  async getMatches(tournamentId) {
    const { data, error } = await supabaseClient
      .from('matches')
      .select('*, player1:signups!matches_player1_id_fkey(*), player2:signups!matches_player2_id_fkey(*)')
      .eq('tournament_id', tournamentId)
      .order('round', { ascending: true })
      .order('match_number', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createMatches(matches) {
    const { data, error } = await supabaseClient
      .from('matches')
      .insert(matches)
      .select();
    if (error) throw error;
    return data;
  },

  async updateMatch(id, updates) {
    const { data, error } = await supabaseClient
      .from('matches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTournament(id) {
    const { error } = await supabaseClient
      .from('tournaments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteMatches(tournamentId) {
    const { error } = await supabaseClient
      .from('matches')
      .delete()
      .eq('tournament_id', tournamentId);
    if (error) throw error;
  },

  async getCompletedTournaments() {
    const { data, error } = await supabaseClient
      .from('tournaments')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getPlayerStats(discordUsername) {
    const { data, error } = await supabaseClient
      .from('signups')
      .select('*')
      .ilike('discord_username', discordUsername);
    if (error) throw error;
    return data || [];
  },

  // Match Reports
  async submitMatchReport(report) {
    const { data, error } = await supabaseClient
      .from('match_reports')
      .insert(report)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMatchReports(tournamentId) {
    const { data, error } = await supabaseClient
      .from('match_reports')
      .select('*, match:matches!match_reports_match_id_fkey(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).filter(r => r.match?.tournament_id === tournamentId);
  },

  async updateMatchReport(id, updates) {
    const { data, error } = await supabaseClient
      .from('match_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Spectators
  async trackSpectator(tournamentId, page) {
    const sessionId = sessionStorage.getItem('spectator_id') || crypto.randomUUID();
    sessionStorage.setItem('spectator_id', sessionId);
    const { error } = await supabaseClient
      .from('spectators')
      .upsert({
        tournament_id: tournamentId,
        session_id: sessionId,
        page: page,
        last_seen: new Date().toISOString()
      }, { onConflict: 'tournament_id,session_id' });
    if (error) throw error;
  },

  async getSpectatorCount(tournamentId) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data, error } = await supabaseClient
      .from('spectators')
      .select('id')
      .eq('tournament_id', tournamentId)
      .gte('last_seen', fiveMinAgo);
    if (error) throw error;
    return data?.length || 0;
  },

  async updateSignupBans(signupId, bans) {
    const { data, error } = await supabaseClient
      .from('signups')
      .update({ bans })
      .eq('id', signupId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getPlayerMatches(discordUsername) {
    // First get all signup IDs for this player
    const signups = await this.getPlayerStats(discordUsername);
    if (!signups.length) return [];
    const signupIds = signups.map(s => s.id);

    // Query matches where player is either player1 or player2
    const { data: p1Matches, error: e1 } = await supabaseClient
      .from('matches')
      .select('*, player1:signups!matches_player1_id_fkey(*), player2:signups!matches_player2_id_fkey(*)')
      .in('player1_id', signupIds);
    if (e1) throw e1;

    const { data: p2Matches, error: e2 } = await supabaseClient
      .from('matches')
      .select('*, player1:signups!matches_player1_id_fkey(*), player2:signups!matches_player2_id_fkey(*)')
      .in('player2_id', signupIds);
    if (e2) throw e2;

    // Deduplicate by match id
    const all = [...(p1Matches || []), ...(p2Matches || [])];
    const seen = new Set();
    return all.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }
};

// Realtime
function subscribeToChanges(tournamentId, handlers = {}) {
  const channel = supabaseClient.channel(`tournament-${tournamentId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'signups', filter: `tournament_id=eq.${tournamentId}` },
      (payload) => handlers.onSignup?.(payload)
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` },
      (payload) => handlers.onMatch?.(payload)
    )
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` },
      (payload) => handlers.onTournament?.(payload)
    )
    .subscribe();
  return channel;
}

document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
});
