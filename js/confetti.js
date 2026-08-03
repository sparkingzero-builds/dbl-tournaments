const ConfettiFX = (() => {
  const COLORS = ['#00e5ff', '#ff2d78', '#ffd740', '#a55eea'];
  const PARTICLE_COUNT = 150;
  const DURATION = 4000;

  let canvas, ctx, particles, animId, startTime;

  function init() {
    if (canvas) canvas.remove();
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    return {
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      gravity: 0.12 + Math.random() * 0.08,
      opacity: 1,
      decay: 0.003 + Math.random() * 0.005
    };
  }

  function draw(time) {
    if (!startTime) startTime = time;
    const elapsed = time - startTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let alive = false;
    for (const p of particles) {
      if (p.opacity <= 0) continue;
      alive = true;

      p.x += p.vx;
      p.vy += p.gravity;
      p.y += p.vy;
      p.vx *= 0.99;
      p.rotation += p.rotSpeed;

      if (elapsed > DURATION * 0.5) {
        p.opacity -= p.decay * 2;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (alive && elapsed < DURATION) {
      animId = requestAnimationFrame(draw);
    } else {
      cleanup();
    }
  }

  function cleanup() {
    if (animId) cancelAnimationFrame(animId);
    if (canvas) {
      canvas.remove();
      canvas = null;
    }
    window.removeEventListener('resize', resize);
    particles = null;
    startTime = null;
  }

  function fire() {
    init();
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
    startTime = null;
    animId = requestAnimationFrame(draw);
  }

  return { fire };
})();
