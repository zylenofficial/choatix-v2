// ── Nav Scroll ──
const nav = document.getElementById('nav');
const scrollBar = document.getElementById('scrollBar');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    if (scrollBar) scrollBar.style.width = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100) + '%';
  });
}

// ── Particles ──
const canvas = document.getElementById('particles');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let W, H; const particles = []; const COUNT = 50; const DIST = 130;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  class P {
    constructor() { this.x = Math.random() * W; this.y = Math.random() * H; this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3; this.r = Math.random() * 1.5 + 0.5; }
    update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > W) this.vx *= -1; if (this.y < 0 || this.y > H) this.vy *= -1; }
    draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(); }
  }
  for (let i = 0; i < COUNT; i++) particles.push(new P());
  function anim() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.025 * (1 - d / DIST)) + ')'; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }
    }
    requestAnimationFrame(anim);
  }
  anim();
}

// ── Reveal ──
const obs = new IntersectionObserver(e => e.forEach(x => { if (x.isIntersecting) x.target.classList.add('visible'); }), { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// ── Animated counters ──
const counterObs = new IntersectionObserver(e => e.forEach(x => {
  if (x.isIntersecting) {
    x.target.querySelectorAll('.stat-num[data-count]').forEach(el => {
      if (el.dataset.animated) return;
      el.dataset.animated = '1';
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const start = performance.now();
      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
}), { threshold: 0.3 });
const statsRow = document.querySelector('.stats-row');
if (statsRow) counterObs.observe(statsRow);

// ── FPS bars ──
const fpsObs = new IntersectionObserver(e => e.forEach(x => {
  if (x.isIntersecting) {
    x.target.querySelectorAll('.fps-bar').forEach(b => b.style.width = b.dataset.w);
    x.target.querySelectorAll('.fps-row').forEach(r => r.classList.add('animated'));
  }
}), { threshold: 0.3 });
const fpsGrid = document.getElementById('fpsGrid');
if (fpsGrid) fpsObs.observe(fpsGrid);

// ── Feature card mouse ──
document.querySelectorAll('.feature-card').forEach(c => {
  c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%'); c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%'); });
});

// ── Parallax ──
window.addEventListener('scroll', () => {
  const s = window.scrollY;
  document.querySelectorAll('.mesh-blob').forEach((b, i) => b.style.transform = 'translateY(' + (s * (0.08 + i * 0.04)) + 'px)');
});

// ── Shopping Cart ──
const CART_KEY = 'choatix_cart';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); }

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = cart.reduce((a, i) => a + i.qty, 0);
  badge.textContent = count;
  badge.classList.toggle('show', count > 0);
}

function addToCart(id, name, price) {
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty++; } else { cart.push({ id, name, price, qty: 1 }); }
  saveCart(); renderCart(); openCart();
}

function removeFromCart(id) { cart = cart.filter(i => i.id !== id); saveCart(); renderCart(); }

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  saveCart(); renderCart();
}

function getCartTotal() { return cart.reduce((a, i) => a + (i.price * i.qty), 0); }

function renderCart() {
  const el = document.getElementById('cartItems');
  const total = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('cartCheckout');
  if (!el) return;
  if (cart.length === 0) {
    el.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">&#128722;</div>Your cart is empty</div>';
    if (total) total.innerHTML = '\u20AC0.00';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }
  el.innerHTML = cart.map(i => '<div class="cart-item"><div class="cart-item-icon">&#9733;</div><div class="cart-item-info"><div class="cart-item-name">' + i.name + '</div><div class="cart-item-price">&euro;' + i.price.toFixed(2) + '</div></div><div class="cart-item-qty"><button onclick="changeQty(\'' + i.id + '\',-1)">&#8722;</button><span>' + i.qty + '</span><button onclick="changeQty(\'' + i.id + '\',1)">+</button></div><button class="cart-item-remove" onclick="removeFromCart(\'' + i.id + '\')">&#10005;</button></div>').join('');
  if (total) total.innerHTML = '\u20AC' + getCartTotal().toFixed(2);
  if (checkoutBtn) checkoutBtn.disabled = false;
}

function openCart() {
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartSidebar').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartSidebar').classList.remove('open');
  document.body.style.overflow = '';
}

async function checkout() {
  if (cart.length === 0) return;
  let username = localStorage.getItem('username');
  if (!username) {
    username = prompt('Enter your Discord username (for delivery):');
    if (!username) return;
    localStorage.setItem('username', username);
  }
  localStorage.setItem('choatix_pending_purchase', JSON.stringify(cart.map(i => ({ id: i.id, name: i.name }))));
  const btn = document.getElementById('cartCheckout');
  btn.textContent = 'Redirecting to PayPal...';
  btn.disabled = true;
  try {
    const items = cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));
    const r = await fetch('https://choatix-v2.onrender.com/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, discordUsername: username })
    });
    const data = await r.json();
    if (data.url) {
      localStorage.removeItem(CART_KEY);
      if (data.downloadToken) localStorage.setItem('choatix_download_token', data.downloadToken);
      window.location.href = data.url;
      return;
    }
  } catch (e) {}
  btn.textContent = 'Checkout via PayPal';
  btn.disabled = false;
  alert('Checkout failed. Try again or contact support on Discord.');
}

updateCartBadge();
renderCart();

// ── PayPal success ──
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('checkout') === 'success') {
  window.history.replaceState({}, '', window.location.pathname);
  window.location.href = 'download.html';
}

// ── Discord Login ──
const params = new URLSearchParams(window.location.search);
const discordId = params.get('discord_id');
const username = params.get('username');
const avatar = params.get('avatar');
if (discordId) {
  localStorage.setItem('discord_id', discordId);
  localStorage.setItem('username', username);
  localStorage.setItem('avatar', avatar || '');
  window.history.replaceState({}, '', window.location.pathname);
}

const savedId = localStorage.getItem('discord_id');
const savedUser = localStorage.getItem('username');
const savedAvatar = localStorage.getItem('avatar');
const loginBtn = document.getElementById('loginBtn');
const userMenu = document.getElementById('userMenu');

if (savedId && savedUser) {
  if (loginBtn) loginBtn.style.display = 'none';
  if (userMenu) {
    userMenu.style.display = 'block';
    document.getElementById('userName').textContent = savedUser;
    document.getElementById('userAvatarFallback').textContent = savedUser.charAt(0).toUpperCase();
    if (savedAvatar) {
      const img = document.getElementById('userAvatar');
      img.src = savedAvatar;
      img.onload = function() { img.style.display = 'block'; document.getElementById('userAvatarFallback').style.display = 'none'; };
    }
    fetch('https://choatix-v2.onrender.com/api/license/' + savedId).then(r => r.json()).then(d => {
      if (d.tier) {
        const tierEl = document.getElementById('userTier');
        tierEl.textContent = d.tier;
        tierEl.className = 'user-tier ' + d.tier.toLowerCase();
      }
    }).catch(() => {});
  }
} else {
  if (loginBtn) loginBtn.style.display = '';
  if (userMenu) userMenu.style.display = 'none';
}

function handleLogin(e) { e.preventDefault(); window.location.href = 'https://choatix-v2.onrender.com/api/auth/discord'; }
function handleLogout(e) { e.preventDefault(); localStorage.clear(); window.location.reload(); }
function toggleDropdown(e) { e.preventDefault(); document.getElementById('userMenu').classList.toggle('open'); }
document.addEventListener('click', (e) => { if (!e.target.closest('.user-menu')) { const m = document.getElementById('userMenu'); if (m) m.classList.remove('open'); } });

// ── Team avatars ──
const TEAM_IDS = ['1014494449809772544','1032970883192606780','398137085430726656','1322475983386837006','1402203036914290764'];
const API = 'https://choatix-v2.onrender.com/api/team/';
TEAM_IDS.forEach(async id => {
  try {
    const r = await fetch(API + id);
    const d = await r.json();
    const img = document.getElementById('avatar-' + id);
    if (img && d.avatar) { img.src = d.avatar; }
  } catch {}
});

// ── Fetch ratings ──
fetch('https://choatix-v2.onrender.com/api/ratings')
  .then(r => r.json())
  .then(data => {
    document.querySelectorAll('.product-card[data-product]').forEach(card => {
      const pid = card.dataset.product;
      const info = data.products && data.products[pid];
      if (!info) return;
      const avg = parseFloat(info.avg) || 0;
      const count = parseInt(info.count) || 0;
      const starsEl = card.querySelector('.stars');
      const countEl = card.querySelector('.count');
      if (starsEl) {
        const full = Math.floor(avg);
        let s = '';
        for (let i = 0; i < 5; i++) { s += i < full ? '\u2605' : '\u2606'; }
        starsEl.innerHTML = s;
      }
      if (countEl) countEl.textContent = '(' + count + ')';
    });
  })
  .catch(() => {});

// ── Escape key ──
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeCart(); } });
function closeModal() { const m = document.getElementById('modal'); if (m) m.classList.remove('active'); document.body.style.overflow = ''; }
