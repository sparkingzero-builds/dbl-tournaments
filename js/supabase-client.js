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

  async updateSignupBans(signupId, bans, team) {
    const updates = { bans };
    if (team) updates.team = team;
    const { data, error } = await supabaseClient
      .from('signups')
      .update(updates)
      .eq('id', signupId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Match Chat
  async getMatchChat(matchId) {
    const { data, error } = await supabaseClient
      .from('match_chat')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async sendChatMessage(matchId, username, message) {
    const { data, error } = await supabaseClient
      .from('match_chat')
      .insert({ match_id: matchId, username, message })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ELO Rankings
  async getLeaderboard() {
    const { data, error } = await supabaseClient
      .from('elo_ratings')
      .select('*')
      .order('elo', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getPlayerElo(discordUsername) {
    const { data, error } = await supabaseClient
      .from('elo_ratings')
      .select('*')
      .eq('discord_username', discordUsername)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  },

  async updateElo(discordUsername, eloChange, isWin) {
    // Check if player exists
    const existing = await this.getPlayerElo(discordUsername);

    if (existing) {
      const newElo = existing.elo + eloChange;
      const updates = {
        elo: newElo,
        wins: isWin ? existing.wins + 1 : existing.wins,
        losses: isWin ? existing.losses : existing.losses + 1,
        peak_elo: Math.max(existing.peak_elo || existing.elo, newElo),
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabaseClient
        .from('elo_ratings')
        .update(updates)
        .eq('discord_username', discordUsername)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const newElo = 1000 + eloChange;
      const { data, error } = await supabaseClient
        .from('elo_ratings')
        .insert({
          discord_username: discordUsername,
          elo: newElo,
          wins: isWin ? 1 : 0,
          losses: isWin ? 0 : 1,
          peak_elo: Math.max(1000, newElo),
          tournaments_played: 0
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Blacklist
  async getBlacklist() {
    const { data, error } = await supabaseClient
      .from('blacklist')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addToBlacklist(discordUsername, reason) {
    const { data, error } = await supabaseClient
      .from('blacklist')
      .insert({ discord_username: discordUsername, reason })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeFromBlacklist(id) {
    const { error } = await supabaseClient
      .from('blacklist')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async isBlacklisted(discordUsername) {
    const { data, error } = await supabaseClient
      .from('blacklist')
      .select('id')
      .ilike('discord_username', discordUsername)
      .limit(1);
    if (error) throw error;
    return data && data.length > 0;
  },

  // Predictions
  async submitPrediction(matchId, sessionId, predictedWinnerId) {
    const { data, error } = await supabaseClient
      .from('predictions')
      .upsert({
        match_id: matchId,
        session_id: sessionId,
        predicted_winner_id: predictedWinnerId
      }, { onConflict: 'match_id,session_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getPredictions(tournamentId, sessionId) {
    const { data, error } = await supabaseClient
      .from('predictions')
      .select('*, match:matches!predictions_match_id_fkey(tournament_id)')
      .eq('session_id', sessionId);
    if (error) throw error;
    return (data || []).filter(p => p.match?.tournament_id === tournamentId);
  },

  async getAllPredictions(tournamentId) {
    const { data, error } = await supabaseClient
      .from('predictions')
      .select('*, match:matches!predictions_match_id_fkey(tournament_id)');
    if (error) throw error;
    return (data || []).filter(p => p.match?.tournament_id === tournamentId);
  },

  // Points
  async getPoints(username) {
    const { data, error } = await supabaseClient
      .from('player_points')
      .select('*')
      .eq('discord_username', username)
      .single();
    if (error && error.code === 'PGRST116') return { balance: 0, lifetime_earned: 0 };
    if (error) throw error;
    return data;
  },

  async awardPoints(username, amount, reason, referenceId) {
    const existing = await this.getPoints(username);
    const hasRecord = existing.id !== undefined;

    if (hasRecord) {
      const updates = {
        balance: existing.balance + amount,
        lifetime_earned: amount > 0 ? existing.lifetime_earned + amount : existing.lifetime_earned,
        updated_at: new Date().toISOString()
      };
      const { error } = await supabaseClient
        .from('player_points')
        .update(updates)
        .eq('discord_username', username);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from('player_points')
        .insert({
          discord_username: username,
          balance: amount,
          lifetime_earned: Math.max(amount, 0)
        });
      if (error) throw error;
    }

    const transaction = {
      discord_username: username,
      amount,
      reason: reason || 'manual',
      reference_id: referenceId || null
    };
    const { error: txError } = await supabaseClient
      .from('point_transactions')
      .insert(transaction);
    if (txError) throw txError;
  },

  async getPointTransactions(username) {
    const { data, error } = await supabaseClient
      .from('point_transactions')
      .select('*')
      .eq('discord_username', username)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  },

  async getPointsLeaderboard() {
    const { data, error } = await supabaseClient
      .from('player_points')
      .select('*')
      .order('lifetime_earned', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Shop
  async getShopItems() {
    const { data, error } = await supabaseClient
      .from('shop_items')
      .select('*')
      .eq('active', true)
      .order('cost', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createShopItem(item) {
    const { data, error } = await supabaseClient
      .from('shop_items')
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateShopItem(id, updates) {
    const { data, error } = await supabaseClient
      .from('shop_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteShopItem(id) {
    const { error } = await supabaseClient
      .from('shop_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getInventory(username) {
    const { data, error } = await supabaseClient
      .from('player_inventory')
      .select('*, item:shop_items(*)')
      .eq('discord_username', username);
    if (error) throw error;
    return data || [];
  },

  async purchaseItem(username, itemId, cost) {
    const points = await this.getPoints(username);
    if (points.balance < cost) {
      throw new Error('Insufficient funds');
    }

    const { error: deductError } = await supabaseClient
      .from('player_points')
      .update({
        balance: points.balance - cost,
        updated_at: new Date().toISOString()
      })
      .eq('discord_username', username);
    if (deductError) throw deductError;

    const { error: txError } = await supabaseClient
      .from('point_transactions')
      .insert({
        discord_username: username,
        amount: -cost,
        reason: 'purchase',
        reference_id: String(itemId)
      });
    if (txError) throw txError;

    const { data, error: invError } = await supabaseClient
      .from('player_inventory')
      .insert({
        discord_username: username,
        item_id: itemId
      })
      .select()
      .single();
    if (invError) throw invError;
    return data;
  },

  async equipItem(username, inventoryId) {
    const { data, error } = await supabaseClient
      .from('player_inventory')
      .update({ equipped: true })
      .eq('id', inventoryId)
      .eq('discord_username', username)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async unequipItem(username, inventoryId) {
    const { data, error } = await supabaseClient
      .from('player_inventory')
      .update({ equipped: false })
      .eq('id', inventoryId)
      .eq('discord_username', username)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getEquippedItems(username) {
    const { data, error } = await supabaseClient
      .from('player_inventory')
      .select('*, item:shop_items(*)')
      .eq('discord_username', username)
      .eq('equipped', true);
    if (error) throw error;
    return data || [];
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
