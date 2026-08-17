// ── Nav Scroll ──
const nav = document.getElementById('nav');
const scrollBar = document.getElementById('scrollBar');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    if (scrollBar) scrollBar.style.width = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100) + '%';
  });
}

// ── Matrix Rain Background ──
const matrixCanvas = document.getElementById('matrix-rain');
if (matrixCanvas) {
  const ctx = matrixCanvas.getContext('2d');
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ΣΩλπφψ'.split('');
  const FONT_SIZE = 14;
  const CHAR_SPACING = 18;
  let W, H, cols = [];

  function initMatrix() {
    const dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    matrixCanvas.width = W * dpr;
    matrixCanvas.height = H * dpr;
    matrixCanvas.style.width = W + 'px';
    matrixCanvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cols = [];
    const numCols = Math.floor(W / CHAR_SPACING);
    for (let i = 0; i < numCols; i++) {
      const centerX = W / 2;
      const dist = Math.abs(i * CHAR_SPACING - centerX) / (W / 2);
      const chance = dist < 0.3 ? 0.9 : dist < 0.6 ? 0.5 : 0.15;
      if (Math.random() > chance) continue;

      const speed = 1.2 + Math.random() * 2.5;
      const trailLen = 8 + Math.floor(Math.random() * 14);
      const chars = [];
      for (let j = 0; j < trailLen; j++) {
        chars.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
      }
      cols.push({
        x: i * CHAR_SPACING + CHAR_SPACING / 2,
        y: Math.random() * H * 1.5 - H * 0.5,
        speed, chars,
        flickerTimer: 0,
        flickerRate: 3 + Math.floor(Math.random() * 5)
      });
    }
  }

  initMatrix();
  window.addEventListener('resize', initMatrix);

  function drawMatrix() {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = FONT_SIZE + 'px Consolas, "SF Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (const col of cols) {
      col.y += col.speed;
      col.flickerTimer++;
      if (col.flickerTimer >= col.flickerRate) {
        col.flickerTimer = 0;
        const idx = Math.floor(Math.random() * col.chars.length);
        col.chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
      }

      for (let j = 0; j < col.chars.length; j++) {
        const cy = col.y - j * CHAR_SPACING;
        if (cy < -FONT_SIZE || cy > H + FONT_SIZE) continue;

        let alpha;
        if (j === 0) alpha = 0.95;
        else if (j < 3) alpha = 0.6 - j * 0.1;
        else alpha = Math.max(0.02, 0.45 * Math.pow(0.82, j - 2));

        if (cy < 80) alpha *= cy / 80;
        if (cy > H - 60) alpha *= (H - cy) / 60;
        alpha = Math.max(0, Math.min(1, alpha));

        if (j === 0) { ctx.shadowColor = 'rgba(255,255,255,0.4)'; ctx.shadowBlur = 6; }
        else ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
        ctx.fillText(col.chars[j], col.x, cy);
      }
      ctx.shadowBlur = 0;

      if (col.y - col.chars.length * CHAR_SPACING > H) {
        col.y = -CHAR_SPACING * 2;
        col.speed = 1.2 + Math.random() * 2.5;
        col.chars = [];
        const trailLen = 8 + Math.floor(Math.random() * 14);
        for (let j = 0; j < trailLen; j++) {
          col.chars.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
        }
      }
    }
    requestAnimationFrame(drawMatrix);
  }
  drawMatrix();
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

// ── Parallax (removed — matrix rain is the background) ──

// ── Shopping Cart ──
const CART_KEY = 'choatix_cart';
const DISCOUNT_KEY = 'choatix_discount';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
let appliedDiscount = JSON.parse(localStorage.getItem(DISCOUNT_KEY) || 'null');

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
  const foot = document.querySelector('.cart-foot');
  if (!el) return;
  if (cart.length === 0) {
    el.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">&#128722;</div>Your cart is empty</div>';
    if (total) total.innerHTML = '\u20AC0.00';
    if (checkoutBtn) checkoutBtn.disabled = true;
  } else {
    el.innerHTML = cart.map(i => '<div class="cart-item"><div class="cart-item-icon">&#9733;</div><div class="cart-item-info"><div class="cart-item-name">' + i.name + '</div><div class="cart-item-price">&euro;' + i.price.toFixed(2) + '</div></div><div class="cart-item-qty"><button onclick="changeQty(\'' + i.id + '\',-1)">&#8722;</button><span>' + i.qty + '</span><button onclick="changeQty(\'' + i.id + '\',1)">+</button></div><button class="cart-item-remove" onclick="removeFromCart(\'' + i.id + '\')">&#10005;</button></div>').join('');
    if (checkoutBtn) checkoutBtn.disabled = false;
  }

  // Discount code in footer
  if (foot && !foot.querySelector('.cart-discount')) {
    const dc = document.createElement('div');
    dc.className = 'cart-discount';
    foot.insertBefore(dc, foot.querySelector('.cart-total'));
  }
  const dcEl = foot?.querySelector('.cart-discount');
  if (dcEl) {
    if (appliedDiscount) {
      dcEl.innerHTML = '<div class="cart-discount-applied"><span class="cart-discount-tag">&#10003; ' + appliedDiscount.code + ' (-' + appliedDiscount.percent + '%)</span><button class="cart-discount-remove" onclick="removeDiscount()">&#10005;</button></div>';
    } else {
      dcEl.innerHTML = '<div class="cart-discount-input"><input type="text" id="discountInput" placeholder="Discount code" maxlength="20"><button onclick="applyDiscount()">Apply</button></div>';
    }
  }

  // Calculate totals
  const subtotal = getCartTotal();
  const discountAmt = appliedDiscount ? subtotal * (appliedDiscount.percent / 100) : 0;
  const finalTotal = subtotal - discountAmt;

  if (total) {
    if (appliedDiscount) {
      total.innerHTML = '<span style="text-decoration:line-through;opacity:0.5;margin-right:6px;font-size:0.8em">&euro;' + subtotal.toFixed(2) + '</span>&euro;' + finalTotal.toFixed(2);
    } else {
      total.innerHTML = '\u20AC' + subtotal.toFixed(2);
    }
  }

  // Add no-refund notice
  if (foot && !foot.querySelector('.no-refund')) {
    const notice = document.createElement('div');
    notice.className = 'no-refund';
    notice.innerHTML = '<span style="color:#ff5252;font-size:0.65rem;font-weight:700">&#9888; All sales final &mdash; no refunds. Digital products delivered instantly.</span>';
    foot.insertBefore(notice, checkoutBtn);
  }
}

async function applyDiscount() {
  const input = document.getElementById('discountInput');
  if (!input || !input.value.trim()) return;
  const code = input.value.trim().toUpperCase();
  try {
    const r = await fetch('https://choatix-v2.onrender.com/api/discount/' + code);
    const data = await r.json();
    if (data.valid) {
      appliedDiscount = { code: data.code, percent: data.discount };
      localStorage.setItem(DISCOUNT_KEY, JSON.stringify(appliedDiscount));
      renderCart();
    } else {
      alert(data.error || 'Invalid discount code');
    }
  } catch (e) {
    alert('Failed to verify discount code');
  }
}

function removeDiscount() {
  appliedDiscount = null;
  localStorage.removeItem(DISCOUNT_KEY);
  renderCart();
}

function openCart() {
  var o = document.getElementById('cartOverlay');
  var s = document.getElementById('cartSidebar');
  if (o) o.classList.add('open');
  if (s) s.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  var o = document.getElementById('cartOverlay');
  var s = document.getElementById('cartSidebar');
  if (o) o.classList.remove('open');
  if (s) s.classList.remove('open');
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
  var btn = document.getElementById('cartCheckout');
  if (btn) { btn.textContent = 'Redirecting to PayPal...'; btn.disabled = true; }
  try {
    const items = cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));
    const r = await fetch('https://choatix-v2.onrender.com/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, discordUsername: username, discountCode: appliedDiscount ? appliedDiscount.code : null })
    });
    const data = await r.json();
    if (data.url) {
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(DISCOUNT_KEY);
      appliedDiscount = null;
      if (data.downloadToken) localStorage.setItem('choatix_download_token', data.downloadToken);
      window.location.href = data.url;
      return;
    }
  } catch (e) {}
  if (btn) { btn.textContent = 'Checkout via PayPal'; btn.disabled = false; }
  alert('Checkout failed. Try again or contact support on Discord.');
}

updateCartBadge();
renderCart();

// ── PayPal success ──
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('checkout') === 'success') {
  const user = urlParams.get('user') || '';
  const token = urlParams.get('token') || '';
  const products = urlParams.get('products') || '';
  window.history.replaceState({}, '', window.location.pathname);
  window.location.href = 'download.html?token=' + encodeURIComponent(token) + '&user=' + encodeURIComponent(user) + '&products=' + encodeURIComponent(products);
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
    var un = document.getElementById('userName');
    if (un) un.textContent = savedUser;
    var uaf = document.getElementById('userAvatarFallback');
    if (uaf) uaf.textContent = savedUser.charAt(0).toUpperCase();
    if (savedAvatar) {
      var img = document.getElementById('userAvatar');
      if (img) {
        img.src = savedAvatar;
        img.onload = function() { img.style.display = 'block'; var fb = document.getElementById('userAvatarFallback'); if (fb) fb.style.display = 'none'; };
      }
    }
    fetch('https://choatix-v2.onrender.com/api/license/' + savedId).then(r => r.json()).then(d => {
      if (d.tier) {
        var tierEl = document.getElementById('userTier');
        if (tierEl) { tierEl.textContent = d.tier; tierEl.className = 'user-tier ' + d.tier.toLowerCase(); }
      }
    }).catch(() => {});
  }
} else {
  if (loginBtn) loginBtn.style.display = '';
  if (userMenu) userMenu.style.display = 'none';
}

function handleLogin(e) { e.preventDefault(); window.location.href = 'https://choatix-v2.onrender.com/api/auth/discord'; }
function handleLogout(e) { e.preventDefault(); localStorage.clear(); window.location.reload(); }
function toggleDropdown(e) { e.preventDefault(); var m = document.getElementById('userMenu'); if (m) m.classList.toggle('open'); }
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

// ── Add to Cart handlers ──
document.addEventListener('click', e => {
  const btn = e.target.closest('.add-to-cart');
  if (!btn) return;
  e.preventDefault();
  const id = btn.dataset.id;
  const name = btn.dataset.name;
  const price = parseFloat(btn.dataset.price);
  if (id && name && price) {
    addToCart(id, name, price);
    openCart();
  }
});
