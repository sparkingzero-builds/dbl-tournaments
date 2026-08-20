const NotificationSystem = (() => {
  let container;

  function init() {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column-reverse;
      gap: 8px;
      max-width: 340px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  function show(message, type = 'info', duration = 5000) {
    if (!container) init();

    const colors = {
      info: { border: '#5f7cff', icon: 'i' },
      success: { border: '#2ed573', icon: '?' },
      warning: { border: '#ffd740', icon: '!' },
      error: { border: '#ff4757', icon: '?' },
      match: { border: '#00e5ff', icon: '?' },
      signup: { border: '#2ed573', icon: '+' },
      ko: { border: '#ff2d78', icon: '?' },
    };

    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: #1a1535;
      border: 1px solid #2e2755;
      border-left: 3px solid ${c.border};
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      pointer-events: all;
      position: relative;
      overflow: hidden;
    `;
    toast.classList.add('slide-in-right');

    toast.innerHTML = `
      <span style="font-family:'Exo 2',sans-serif;font-size:13px;font-weight:800;color:${c.border};flex-shrink:0;width:18px;text-align:center;">${c.icon}</span>
      <div style="flex:1;font-size:13px;font-weight:600;color:#e8e4f8;">${message}</div>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#9088b8;cursor:pointer;font-size:14px;flex-shrink:0;padding:0;">&times;</button>
      <div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:${c.border};animation:shrinkBar ${duration}ms linear forwards;"></div>
    `;

    const soundMap = { match: 'match', ko: 'ko', signup: 'signup', success: 'signup', error: 'error', warning: 'error', info: 'notification' };
    if (typeof playSound === 'function') playSound(soundMap[type] || 'notification');

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('slide-in-right');
      toast.classList.add('slide-out-right');
      setTimeout(() => toast.remove(), 200);
    }, duration);

    return toast;
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes shrinkBar {
      from { transform: scaleX(1); transform-origin: left; }
      to { transform: scaleX(0); transform-origin: left; }
    }
  `;
  document.head.appendChild(style);

  return { show, init };
})();
