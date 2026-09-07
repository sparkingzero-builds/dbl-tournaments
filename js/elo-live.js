// Live ELO change notifications
(function() {
  let channel = null;
  let currentUsername = '';

  function init() {
    if (typeof AUTH === 'undefined' || !AUTH.isLoggedIn()) return;
    if (typeof subscribeToEloChanges !== 'function') return;
    currentUsername = AUTH.getDiscordUsername();
    if (!currentUsername) return;

    channel = subscribeToEloChanges(handleEloChange);
  }

  function handleEloChange(payload) {
    const data = payload.new;
    if (!data || !data.discord_username) return;
    const changedUser = data.discord_username;
    const oldData = payload.old;
    const isMe = changedUser.toLowerCase() === currentUsername.toLowerCase();

    if (isMe && oldData && oldData.elo != null && data.elo != null) {
      const delta = data.elo - oldData.elo;
      if (delta === 0) return;
      const isUp = delta > 0;
      if (typeof NotificationSystem !== 'undefined') {
        NotificationSystem.show(
          `Your ELO ${isUp ? 'increased' : 'decreased'} by ${isUp ? '+' : ''}${delta} → ${data.elo}${data.elo >= (data.peak_elo || 0) ? ' (New Peak!)' : ''}`,
          isUp ? 'success' : 'warning'
        );
      }
      // Trigger inbox refresh
      if (typeof NotifInbox !== 'undefined' && NotifInbox.refresh) NotifInbox.refresh();
    }

    // Dispatch event for rankings pages to update live
    window.dispatchEvent(new CustomEvent('elo-updated', { detail: { username: changedUser, elo: data.elo, old_elo: oldData?.elo, data } }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
  } else {
    setTimeout(init, 1000);
  }
})();
