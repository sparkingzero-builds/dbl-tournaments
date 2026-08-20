const TitleManager = {
  TITLES: {
    // ── Earned Titles ──
    rookie:          { id: 'rookie',          name: 'Rookie',            description: 'Default title for new players',               color: '#9ca3af', source: 'earned', price: 0 },
    rising_star:     { id: 'rising_star',     name: 'Rising Star',       description: 'Win 3 tournament matches',                    color: '#00e5ff', source: 'earned', price: 0 },
    veteran:         { id: 'veteran',         name: 'Veteran',           description: 'Play in 5+ tournaments',                      color: '#a855f7', source: 'earned', price: 0 },
    the_unbreakable: { id: 'the_unbreakable', name: 'The Unbreakable',   description: '5+ win streak in bounties',                   color: '#ff4500', source: 'earned', price: 0 },
    bounty_hunter:   { id: 'bounty_hunter',   name: 'Bounty Hunter',     description: 'Claim 3+ bounties',                           color: '#f59e0b', source: 'earned', price: 0 },
    dragon_slayer:   { id: 'dragon_slayer',   name: 'Dragon Slayer',     description: 'Beat a player with 200+ higher ELO',          color: '#ef4444', source: 'earned', price: 0 },
    champion:        { id: 'champion',        name: 'Champion',          description: 'Win a tournament',                            color: '#ffd700', source: 'earned', price: 0 },
    legend:          { id: 'legend',          name: 'Legend',            description: 'Win 3+ tournaments',                          color: '#ff2d78', source: 'earned', price: 0 },
    whale:           { id: 'whale',           name: 'Whale',             description: 'Spend 5000+ total currency',                  color: '#3b82f6', source: 'earned', price: 0 },
    gambler:         { id: 'gambler',         name: 'Gambler',           description: 'Win 10+ bets',                                color: '#22c55e', source: 'earned', price: 0 },

    // ── Purchasable Titles ──
    the_chosen_one:      { id: 'the_chosen_one',      name: 'The Chosen One',      description: 'A title of destiny',                   color: '#00e5ff', source: 'shop', price: 500 },
    shadow_monarch:      { id: 'shadow_monarch',      name: 'Shadow Monarch',      description: 'Ruler of the shadows',                 color: '#7c3aed', source: 'shop', price: 750 },
    ultra_instinct:      { id: 'ultra_instinct',      name: 'Ultra Instinct',      description: 'Transcend your limits',                color: '#c0c0ff', source: 'shop', price: 1000 },
    god_of_destruction:  { id: 'god_of_destruction',  name: 'God of Destruction',  description: 'Destroyer of worlds',                  color: '#a855f7', source: 'shop', price: 1500 },
    the_notorious:       { id: 'the_notorious',       name: 'The Notorious',       description: 'Infamous across the land',              color: '#ff8c00', source: 'shop', price: 800 },
  },

  // Check and auto-award earned titles based on player stats
  async checkEarnedTitles(username) {
    if (!username) return;
    try {
      const earned = [];

      // Always award Rookie
      earned.push('rookie');

      // Rising Star: win 3 tournament matches
      try {
        const signups = await db.getPlayerStats(username);
        const signupIds = signups.map(s => s.id);
        const matches = await db.getPlayerMatches(username);
        const wins = matches.filter(m => m.winner_id && signupIds.includes(m.winner_id)).length;
        if (wins >= 3) earned.push('rising_star');

        // Champion: win a tournament
        const tournamentIds = [...new Set(signups.map(s => s.tournament_id))];
        let tourneyWins = 0;
        for (const tid of tournamentIds) {
          try {
            const tMatches = await db.getMatches(tid);
            if (!tMatches.length) continue;
            const maxRound = Math.max(...tMatches.map(m => m.round));
            const finalMatch = tMatches.find(m => m.round === maxRound && m.winner_id);
            const playerSignup = signups.find(s => s.tournament_id === tid);
            if (finalMatch && playerSignup && finalMatch.winner_id === playerSignup.id) {
              tourneyWins++;
            }
          } catch (_) {}
        }
        if (tourneyWins >= 1) earned.push('champion');
        if (tourneyWins >= 3) earned.push('legend');

        // Veteran: 5+ tournaments
        if (tournamentIds.length >= 5) earned.push('veteran');

        // Dragon Slayer: beat a player with 200+ higher ELO
        try {
          const playerElo = await db.getPlayerElo(username);
          if (playerElo) {
            for (const m of matches) {
              if (!m.winner_id || !signupIds.includes(m.winner_id)) continue;
              const isP1 = signupIds.includes(m.player1_id);
              const opponent = isP1 ? m.player2 : m.player1;
              if (opponent) {
                try {
                  const oppElo = await db.getPlayerElo(opponent.discord_username);
                  if (oppElo && oppElo.elo >= playerElo.elo + 200) {
                    earned.push('dragon_slayer');
                    break;
                  }
                } catch (_) {}
              }
            }
          }
        } catch (_) {}
      } catch (_) {}

      // The Unbreakable: 5+ win streak in bounties
      try {
        const { data: bountyData } = await supabaseClient
          .from('bounties')
          .select('streak')
          .eq('discord_username', username)
          .limit(1);
        if (bountyData?.[0]?.streak >= 5) earned.push('the_unbreakable');
      } catch (_) {}

      // Bounty Hunter: claim 3+ bounties
      try {
        const { count } = await supabaseClient
          .from('bounty_challenges')
          .select('id', { count: 'exact', head: true })
          .eq('winner', username);
        if (count >= 3) earned.push('bounty_hunter');
      } catch (_) {}

      // Whale: spend 5000+ total currency
      try {
        const { data: spendRows } = await supabaseClient
          .from('point_transactions')
          .select('amount')
          .eq('discord_username', username)
          .eq('type', 'spend');
        if (spendRows) {
          const totalSpent = spendRows.reduce((s, r) => s + Math.abs(r.amount || 0), 0);
          if (totalSpent >= 5000) earned.push('whale');
        }
      } catch (_) {
        // Try alternative: check lifetime from player_points
        try {
          const pts = await db.getPoints(username);
          const totalSpent = (pts.lifetime_earned || 0) - (pts.balance || 0);
          if (totalSpent >= 5000) earned.push('whale');
        } catch (_) {}
      }

      // Gambler: win 10+ bets
      try {
        const { count } = await supabaseClient
          .from('bets')
          .select('id', { count: 'exact', head: true })
          .eq('discord_username', username)
          .eq('result', 'won');
        if (count >= 10) earned.push('gambler');
      } catch (_) {
        // Betting table may not exist, skip gracefully
      }

      // Award all earned titles that player doesn't have yet
      for (const titleId of earned) {
        try {
          await supabaseClient
            .from('player_titles')
            .upsert({
              discord_username: username,
              title_id: titleId,
            }, { onConflict: 'discord_username,title_id', ignoreDuplicates: true });
        } catch (_) {}
      }
    } catch (e) {
      console.error('Title check error:', e);
    }
  },

  // Get the currently equipped title for a player
  async getEquippedTitle(username) {
    if (!username) return this.TITLES.rookie;
    try {
      const { data } = await supabaseClient
        .from('player_titles')
        .select('title_id')
        .eq('discord_username', username)
        .eq('equipped', true)
        .limit(1);
      if (data?.length && this.TITLES[data[0].title_id]) {
        return this.TITLES[data[0].title_id];
      }
    } catch (_) {}
    return this.TITLES.rookie;
  },

  // Equip a title (unequip all others first)
  async equipTitle(username, titleId) {
    if (!username || !titleId) return;
    try {
      // Unequip all
      await supabaseClient
        .from('player_titles')
        .update({ equipped: false })
        .eq('discord_username', username);
      // Equip the selected one
      await supabaseClient
        .from('player_titles')
        .update({ equipped: true })
        .eq('discord_username', username)
        .eq('title_id', titleId);
    } catch (e) {
      console.error('Equip title error:', e);
      throw e;
    }
  },

  // Get all titles a player owns
  async getPlayerTitles(username) {
    if (!username) return [];
    try {
      const { data } = await supabaseClient
        .from('player_titles')
        .select('*')
        .eq('discord_username', username)
        .order('earned_at', { ascending: true });
      return data || [];
    } catch (_) {
      return [];
    }
  },

  // Purchase a title from the shop
  async purchaseTitle(username, titleId) {
    const title = this.TITLES[titleId];
    if (!title || title.source !== 'shop') throw new Error('Invalid title');

    // Check if already owned
    const owned = await this.getPlayerTitles(username);
    if (owned.find(t => t.title_id === titleId)) throw new Error('Already owned');

    // Check balance
    const points = await db.getPoints(username);
    if (points.balance < title.price) throw new Error('Insufficient funds');

    // Deduct points
    const { data: rows, error: deductError } = await supabaseClient
      .from('player_points')
      .update({
        balance: points.balance - title.price,
        updated_at: new Date().toISOString()
      })
      .eq('discord_username', username)
      .gte('balance', title.price)
      .select();
    if (deductError) throw deductError;
    if (!rows || rows.length === 0) throw new Error('Insufficient funds');

    // Log transaction
    await supabaseClient
      .from('point_transactions')
      .insert({
        discord_username: username,
        amount: -title.price,
        reason: 'title_purchase',
        reference_id: titleId
      });

    // Grant title
    const { error: titleError } = await supabaseClient
      .from('player_titles')
      .insert({
        discord_username: username,
        title_id: titleId
      });
    if (titleError) throw titleError;

    return title;
  }
};

// Auto-check earned titles on page load if logged in
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (typeof AUTH !== 'undefined' && AUTH.isLoggedIn()) {
      const username = AUTH.getDiscordUsername();
      if (username) {
        TitleManager.checkEarnedTitles(username).catch(() => {});
      }
    }
  }, 1500);
});
