// Daily Login Rewards System
const DailyRewards = (() => {
  const REWARDS = [50, 75, 100, 125, 150, 200, 500];
  const LOCAL_KEY = 'dbl_daily_reward_shown';

  function injectStyles() {
    if (document.getElementById('daily-reward-styles')) return;
    const style = document.createElement('style');
    style.id = 'daily-reward-styles';
    style.textContent = `
      .dr-overlay {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        animation: drFadeIn 0.3s ease;
      }
      .dr-modal {
        background: var(--panel, #1a1535);
        border: 1px solid var(--line, #2e2755);
        border-radius: 16px; padding: 32px 28px; width: 360px; max-width: 92vw;
        text-align: center; position: relative;
        animation: drScaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        box-shadow: 0 0 40px rgba(255, 215, 64, 0.15), 0 8px 32px rgba(0,0,0,0.5);
      }
      .dr-close {
        position: absolute; top: 12px; right: 16px;
        background: none; border: none; color: var(--muted, #9088b8);
        font-size: 20px; cursor: pointer; line-height: 1;
      }
      .dr-close:hover { color: var(--text, #e8e4f8); }
      .dr-title {
        font-family: 'Chakra Petch', sans-serif; font-size: 24px; font-weight: 700;
        color: var(--gold, #ffd740); text-transform: uppercase; letter-spacing: 2px;
        margin-bottom: 4px;
      }
      .dr-streak {
        font-family: 'Exo 2', sans-serif; font-size: 14px;
        color: var(--cyan, #00e5ff); margin-bottom: 16px;
      }
      .dr-streak.dr-fire::before { content: ''; }
      .dr-amount {
        font-family: 'Chakra Petch', sans-serif; font-size: 40px; font-weight: 700;
        color: var(--gold, #ffd740); margin: 8px 0;
        text-shadow: 0 0 16px rgba(255,215,64,0.4);
      }
      .dr-amount-label {
        font-family: 'Exo 2', sans-serif; font-size: 12px;
        color: var(--muted, #9088b8); text-transform: uppercase; letter-spacing: 1px;
        margin-bottom: 20px;
      }
      .dr-days {
        display: flex; justify-content: center; gap: 8px; margin-bottom: 16px;
      }
      .dr-day {
        width: 36px; height: 36px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Exo 2', sans-serif; font-size: 12px; font-weight: 700;
        border: 2px solid var(--line, #2e2755); color: var(--muted, #9088b8);
        transition: all 0.3s;
      }
      .dr-day.completed {
        background: rgba(0,200,83,0.2); border-color: #00c853; color: #00c853;
      }
      .dr-day.current {
        background: rgba(0,229,255,0.2); border-color: var(--cyan, #00e5ff);
        color: var(--cyan, #00e5ff); box-shadow: 0 0 12px rgba(0,229,255,0.3);
        animation: drPulse 1.5s ease infinite;
      }
      .dr-day.weekly {
        border-style: dashed;
      }
      .dr-day.weekly.current, .dr-day.weekly.completed {
        border-style: solid;
      }
      .dr-bonus {
        font-family: 'Exo 2', sans-serif; font-size: 11px;
        color: var(--pink, #ff2d78); margin-top: 4px;
      }
      .dr-claim-btn {
        margin-top: 16px; padding: 10px 32px;
        background: linear-gradient(135deg, var(--gold, #ffd740), #ffab00);
        color: #0d0a1a; border: none; border-radius: 8px;
        font-family: 'Chakra Petch', sans-serif; font-size: 14px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 1px; cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .dr-claim-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(255,215,64,0.4);
      }
      @keyframes drFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes drScaleIn { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
      @keyframes drPulse { 0%,100% { box-shadow: 0 0 12px rgba(0,229,255,0.3); } 50% { box-shadow: 0 0 20px rgba(0,229,255,0.6); } }
    `;
    document.head.appendChild(style);
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  async function check() {
    if (typeof AUTH === 'undefined' || !AUTH.isLoggedIn()) return;
    const username = AUTH.getDiscordUsername();
    if (!username) return;

    // Don't show more than once per calendar day
    const shownToday = localStorage.getItem(LOCAL_KEY);
    if (shownToday === todayStr()) return;

    try {
      // Fetch current login record
      const { data: record } = await supabaseClient
        .from('daily_logins')
        .select('*')
        .eq('discord_username', username)
        .single();

      const today = todayStr();

      if (record && record.last_login === today) {
        // Already claimed today
        localStorage.setItem(LOCAL_KEY, today);
        return;
      }

      let newStreak = 1;
      if (record) {
        const lastDate = new Date(record.last_login + 'T00:00:00');
        const todayDate = new Date(today + 'T00:00:00');
        const diffDays = Math.round((todayDate - lastDate) / 86400000);

        if (diffDays === 1) {
          // Consecutive day
          newStreak = (record.streak % 7) + 1;
        }
        // diffDays > 1 means streak resets to 1
      }

      const reward = REWARDS[newStreak - 1];
      const totalLogins = (record ? record.total_logins : 0) + 1;

      // Fetch current balance and add reward
      const { data: pointsData } = await supabaseClient
        .from('player_points')
        .select('balance')
        .eq('discord_username', username)
        .single();

      const currentBalance = pointsData ? pointsData.balance : 0;
      const newBalance = currentBalance + reward;

      // Update balance
      await supabaseClient.from('player_points').upsert({
        discord_username: username,
        balance: newBalance,
        updated_at: new Date().toISOString()
      });

      // Log transaction
      try {
        await supabaseClient.from('point_transactions').insert({
          player_name: username,
          amount: reward,
          type: 'daily_login',
          description: `Daily login reward (Day ${newStreak})`,
          created_at: new Date().toISOString()
        });
      } catch (e) { /* non-critical */ }

      // Update daily_logins record
      await supabaseClient.from('daily_logins').upsert({
        discord_username: username,
        last_login: today,
        streak: newStreak,
        total_logins: totalLogins
      });

      localStorage.setItem(LOCAL_KEY, today);

      // Show reward popup
      showRewardModal(newStreak, reward);

    } catch (e) {
      console.error('Daily rewards error:', e);
    }
  }

  function showRewardModal(streak, amount) {
    injectStyles();

    const isWeekly = streak === 7;
    const fireClass = streak >= 3 ? ' dr-fire' : '';

    let daysHTML = '';
    for (let i = 1; i <= 7; i++) {
      let cls = 'dr-day';
      if (i < streak) cls += ' completed';
      else if (i === streak) cls += ' current';
      if (i === 7) cls += ' weekly';
      daysHTML += `<div class="${cls}">${i === 7 ? '?' : i}</div>`;
    }

    const bonusHTML = isWeekly ? '<div class="dr-bonus">WEEKLY BONUS! Chance at a random cosmetic!</div>' : '';

    const overlay = document.createElement('div');
    overlay.className = 'dr-overlay';
    overlay.innerHTML = `
      <div class="dr-modal">
        <button class="dr-close">&times;</button>
        <div class="dr-title">${streak >= 3 ? '?? ' : ''}Daily Reward!</div>
        <div class="dr-streak${fireClass}">Day ${streak} Streak</div>
        <div class="dr-days">${daysHTML}</div>
        <div class="dr-amount">+${amount}</div>
        <div class="dr-amount-label">Currency Earned</div>
        ${bonusHTML}
        <button class="dr-claim-btn">Awesome!</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.dr-close').addEventListener('click', close);
    overlay.querySelector('.dr-claim-btn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // Also notify
    if (typeof NotificationSystem !== 'undefined') {
      NotificationSystem.show(`Daily reward claimed! +${amount} currency (Day ${streak} streak)`, 'success');
    }
  }

  // Auto-check after auth is ready
  setTimeout(() => { check(); }, 1500);

  return { check };
})();
