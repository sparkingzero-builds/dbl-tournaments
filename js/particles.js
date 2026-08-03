function initParticles(container) {
  const count = 25;
  const colors = ['#00e5ff', '#ff2d78', '#a55eea'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (10 + Math.random() * 15) + 's';
    p.style.animationDelay = (Math.random() * 12) + 's';
    const size = (1.5 + Math.random() * 2.5) + 'px';
    p.style.width = size;
    p.style.height = size;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    container.appendChild(p);
  }
}
