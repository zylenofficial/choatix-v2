// ════════════════════════════════════════════════════════════════
// PHANTOM V2 — Particle System & Visual Effects
// ════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // ── PARTICLE CANVAS ──
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: -1000, y: -1000 };
  let animationId;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.4 + 0.05;
      this.hue = Math.random() > 0.7 ? 145 : 210;
      this.pulseSpeed = Math.random() * 0.02 + 0.005;
      this.pulseOffset = Math.random() * Math.PI * 2;
    }

    update(time) {
      this.x += this.speedX;
      this.y += this.speedY;

      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        this.x -= (dx / dist) * force * 1.2;
        this.y -= (dy / dist) * force * 1.2;
      }

      if (this.x < -10 || this.x > canvas.width + 10 ||
          this.y < -10 || this.y > canvas.height + 10) {
        this.reset();
        this.x = Math.random() > 0.5 ? -5 : canvas.width + 5;
        this.y = Math.random() * canvas.height;
      }

      this.currentOpacity = this.opacity * (0.6 + 0.4 * Math.sin(time * this.pulseSpeed + this.pulseOffset));
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 80%, 65%, ${this.currentOpacity})`;
      ctx.fill();
    }
  }

  function initParticles() {
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 100);
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections(time) {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const opacity = (1 - dist / 140) * 0.08 * (0.5 + 0.5 * Math.sin(time * 0.001));
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 230, 118, ${opacity})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        }
      }
    }
  }

  function animateParticles(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawConnections(time);
    particles.forEach(p => {
      p.update(time);
      p.draw();
    });
    animationId = requestAnimationFrame(animateParticles);
  }

  resizeCanvas();
  initParticles();
  animateParticles(0);

  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
  });

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    const glow = document.getElementById('cursorGlow');
    const ring = document.getElementById('cursorRing');
    if (glow) {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }
    if (ring) {
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
    }
  });

  // ── AURORA EFFECT ──
  const aurora = document.getElementById('aurora');
  if (aurora) {
    let auroraAngle = 0;
    function animateAurora() {
      auroraAngle += 0.002;
      const x1 = 30 + Math.sin(auroraAngle) * 20;
      const y1 = 20 + Math.cos(auroraAngle * 0.7) * 15;
      const x2 = 70 + Math.sin(auroraAngle * 1.3) * 25;
      const y2 = 80 + Math.cos(auroraAngle * 0.5) * 20;
      aurora.style.background = `
        radial-gradient(ellipse 600px 400px at ${x1}% ${y1}%, rgba(0, 230, 118, 0.06) 0%, transparent 70%),
        radial-gradient(ellipse 500px 350px at ${x2}% ${y2}%, rgba(41, 121, 255, 0.04) 0%, transparent 70%),
        radial-gradient(ellipse 400px 300px at 50% 50%, rgba(124, 77, 255, 0.03) 0%, transparent 60%)
      `;
      requestAnimationFrame(animateAurora);
    }
    animateAurora();
  }

  // ── SCROLL PROGRESS ──
  const scrollBar = document.getElementById('scrollBar');
  window.addEventListener('scroll', () => {
    const scroll = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (scroll / max) * 100 : 0;
    if (scrollBar) scrollBar.style.width = pct + '%';

    const nav = document.querySelector('nav');
    if (nav) {
      nav.classList.toggle('scrolled', scroll > 50);
    }
  });

  // ── REVEAL ON SCROLL ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  function initReveals() {
    document.querySelectorAll('.reveal').forEach(el => {
      revealObserver.observe(el);
    });
  }

  // Re-init reveals after route changes
  const mainEl = document.getElementById('app-content');
  if (mainEl) {
    const mainObserver = new MutationObserver(() => {
      setTimeout(initReveals, 100);
    });
    mainObserver.observe(mainEl, { childList: true });
  }

  // ── FPS BAR ANIMATION ──
  const fpsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const row = entry.target;
        const beforeBar = row.querySelector('.fps-bar.before');
        const afterBar = row.querySelector('.fps-bar.after');
        if (beforeBar) beforeBar.style.width = beforeBar.dataset.w;
        if (afterBar) afterBar.style.width = afterBar.dataset.w;
        setTimeout(() => row.classList.add('animated'), 800);
      }
    });
  }, { threshold: 0.3 });

  function initFpsBars() {
    document.querySelectorAll('.fps-row').forEach(el => fpsObserver.observe(el));
  }

  // ── STAT COUNTER ANIMATION ──
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        let current = 0;
        const step = Math.max(1, Math.floor(target / 40));
        const interval = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(interval);
          }
          el.textContent = current + suffix;
        }, 30);
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  function initStatCounters() {
    document.querySelectorAll('.stat-num[data-count]').forEach(el => statObserver.observe(el));
  }

  // ── MAGNETIC HOVER ON FEATURE CARDS ──
  document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.feature-card, .product-card').forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
      }
    });
  });

  // ── COUNTER ANIMATION FOR HERO BADGE ──
  function animateBadge() {
    const badge = document.querySelector('.hero-badge');
    if (badge) {
      badge.style.opacity = '0';
      badge.style.transform = 'translateY(10px)';
      setTimeout(() => {
        badge.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        badge.style.opacity = '1';
        badge.style.transform = 'translateY(0)';
      }, 200);
    }
  }

  // ── INIT ──
  window.addEventListener('load', () => {
    initReveals();
    initFpsBars();
    initStatCounters();
    animateBadge();
  });

  // Expose for router re-init
  window.phantomEffects = {
    initReveals,
    initFpsBars,
    initStatCounters,
    animateBadge
  };
})();
