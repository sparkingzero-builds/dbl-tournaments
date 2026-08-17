const SoundFX = (() => {
  let ctx;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function play(type) {
    const c = getCtx();
    const now = c.currentTime;

    switch (type) {
      case 'signup': {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }

      case 'match': {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'ko': {
        [0, 0.08, 0.16].forEach((delay, i) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.connect(gain);
          gain.connect(c.destination);
          osc.type = 'square';
          osc.frequency.setValueAtTime(300 - i * 80, now + delay);
          gain.gain.setValueAtTime(0.12, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);
          osc.start(now + delay);
          osc.stop(now + delay + 0.15);
        });
        break;
      }

      case 'winner': {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.connect(gain);
          gain.connect(c.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
          gain.gain.setValueAtTime(0.15, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.3);
        });
        break;
      }

      case 'click': {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case 'error': {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'reveal': {
        const osc = c.createOscillator();
        const noise = c.createOscillator();
        const gain = c.createGain();
        const nGain = c.createGain();
        osc.connect(gain);
        noise.connect(nGain);
        gain.connect(c.destination);
        nGain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(100, now);
        noise.frequency.linearRampToValueAtTime(50, now + 0.2);
        nGain.gain.setValueAtTime(0.03, now);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.25);
        noise.start(now);
        noise.stop(now + 0.2);
        break;
      }

      case 'notification': {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }

      case 'purchase': {
        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.connect(gain); gain.connect(c.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.15, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
          osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.2);
        });
        break;
      }

      case 'levelup': {
        const notes = [330, 440, 554, 659, 880];
        notes.forEach((freq, i) => {
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.connect(gain); gain.connect(c.destination);
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.1, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.15);
          osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.15);
        });
        break;
      }

      case 'claim': {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.1);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.25);
        break;
      }

      case 'equip': {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      }

      case 'hype': {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now); osc.stop(now + 0.12);
        break;
      }

      case 'vote': {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.setValueAtTime(700, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
        break;
      }

      case 'powerup': {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        for (let i = 1; i <= 8; i++) osc.frequency.setValueAtTime(220 + i*80, now + i*0.06);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
        osc.start(now); osc.stop(now + 0.55);
        break;
      }

      case 'dragonball': {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.05);
        osc.frequency.setValueAtTime(880, now + 0.1);
        osc.frequency.setValueAtTime(1320, now + 0.15);
        osc.frequency.setValueAtTime(1100, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
        break;
      }
    }
  }

  return { play };
})();

function playSound(type) {
  try { SoundFX.play(type); } catch (e) {}
}
