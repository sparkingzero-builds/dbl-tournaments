const ActivityAlerts = (() => {
  const LAST_CHECK_KEY = 'dbl_last_alert_check';

  async function check() {
    if (typeof AUTH === 'undefined' || !AUTH.isLoggedIn()) return;
    const username = AUTH.getDiscordUsername();
    if (!username) return;

    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const now = Date.now();
    // Only check once every 5 minutes to avoid hammering the DB on every page load
    if (lastCheck && (now - parseInt(lastCheck)) < 300000) return;
    const since = lastCheck ? new Date(parseInt(lastCheck)) : new Date(now - 86400000);
    localStorage.setItem(LAST_CHECK_KEY, now.toString());

    try {
      await Promise.all([
        checkBountyChallenges(username, since),
        checkBountyResults(username, since),
        checkShopPurchases(username, since),
        checkEloChanges(username)
      ]);
    } catch (e) {
      console.error('Activity alerts error:', e);
    }
  }

  async function checkBountyChallenges(username, since) {
    try {
      const { data } = await supabaseClient
        .from('bounty_challenges')
        .select('challenger, target, status, created_at')
        .eq('target', username)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data?.length) {
        data.forEach(c => {
          NotificationSystem.show(
            `${c.challenger} challenged you to a bounty match!`,
            'match', 8000
          );
        });
      }
    } catch (_) {}
  }

  async function checkBountyResults(username, since) {
    try {
      const { data } = await supabaseClient
        .from('bounty_challenges')
        .select('challenger, target, winner, currency_reward, resolved_at')
        .eq('status', 'completed')
        .or(`challenger.eq.${username},target.eq.${username}`)
        .gt('resolved_at', since.toISOString())
        .order('resolved_at', { ascending: false })
        .limit(5);

      if (data?.length) {
        data.forEach(c => {
          if (c.winner === username) {
            const opponent = c.challenger === username ? c.target : c.challenger;
            NotificationSystem.show(
              `You defeated ${opponent} in a bounty match!${c.currency_reward ? ' +' + c.currency_reward + ' pts' : ''}`,
              'success', 8000
            );
          } else {
            NotificationSystem.show(
              `${c.winner} claimed your bounty!`,
              'error', 8000
            );
          }
        });
      }
    } catch (_) {}
  }

  async function checkShopPurchases(username, since) {
    try {
      const { data } = await supabaseClient
        .from('point_transactions')
        .select('amount, reason, created_at')
        .ilike('discord_username', username)
        .gt('amount', 0)
        .gt('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (data?.length) {
        const total = data.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        if (total > 0) {
          NotificationSystem.show(
            `You earned ${total} points since your last visit!`,
            'info', 6000
          );
        }
      }
    } catch (_) {}
  }

  async function checkEloChanges(username) {
    try {
      const stored = localStorage.getItem('dbl_last_elo_' + username);
      const { data } = await supabaseClient
        .from('elo_ratings')
        .select('elo, peak_elo')
        .ilike('discord_username', username)
        .limit(1);

      const current = data?.[0];
      if (current && stored) {
        const oldElo = parseInt(stored);
        const diff = current.elo - oldElo;
        if (diff > 0) {
          NotificationSystem.show(`Your ELO increased by +${diff} ? ${current.elo}`, 'success', 6000);
        } else if (diff < 0) {
          NotificationSystem.show(`Your ELO dropped by ${diff} ? ${current.elo}`, 'warning', 6000);
        }
        if (current.elo === current.peak_elo && diff > 0) {
          NotificationSystem.show(`New peak ELO: ${current.peak_elo}!`, 'ko', 8000);
        }
      }
      if (current) {
        localStorage.setItem('dbl_last_elo_' + username, current.elo.toString());
      }
    } catch (_) {}
  }

  return { check };
})();

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    ActivityAlerts.check();
  }, 1500);
});
