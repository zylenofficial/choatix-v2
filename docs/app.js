// ════════════════════════════════════════════════════════════════
// PHANTOM V2 — Complete App
// Single file: data + state + router + components + pages + effects
// ════════════════════════════════════════════════════════════════

// ── DATA LAYER ──

const API = 'https://choatix-v2.onrender.com';
const DISCORD_INVITE = 'https://discord.gg/AhEK85REhG';

const PRODUCTS = {
  basic:     { id: 'basic',     name: 'Basic Tweaks',         price: null,  tier: 'pro',     subtitle: 'Essential',  desc: 'Windows debloat, essential settings, GPU, network, and power optimization.', tweaks: 220, badge: 'Coming Soon', color: 'soon' },
  pro:       { id: 'pro',       name: 'Pro Tweaks',           price: null,  tier: 'pro',     subtitle: 'Advanced',   desc: 'Everything in Basic plus BCD boot tweaks, RAM optimization, USB tuning, and deep cleanup.', tweaks: 291, badge: 'Coming Soon', color: 'soon' },
  extreme:   { id: 'extreme',   name: 'Extreme Tweaks',       price: null,  tier: 'premium', subtitle: 'Maximum',    desc: 'Full debloat, buffer bloat fix, DirectX optimization, registry tuning, and process optimization.', tweaks: 283, badge: 'Coming Soon', color: 'soon' },
  full:      { id: 'full',      name: 'Full Optimization',    price: null,  tier: 'premium', subtitle: 'Everything', desc: 'All 461 tweaks combined — the complete optimization suite with every category included.', tweaks: 461, badge: 'Coming Soon', color: 'soon' },
  precision: { id: 'precision', name: 'Precision Pack',       price: null,  tier: 'pro',     subtitle: 'Input',      desc: 'Input lag fix, mouse/keyboard optimization, GPU low latency, and network tweaks for competitive FPS.', tweaks: 128, badge: 'Coming Soon', color: 'soon' },
  vibrance:  { id: 'vibrance',  name: 'Vibrance Controller',  price: null,  tier: null,      subtitle: 'Display',    desc: 'Digital vibrance control with per-game profiles and auto-detection.', tweaks: 0, badge: 'Coming Soon', color: 'soon' }
};

const DOWNLOADS = {
  full:      { name: 'Phantom Full Optimization',   url: null, comingSoon: true },
  basic:     { name: 'Phantom Basic Tweaks',        url: null, comingSoon: true },
  pro:       { name: 'Phantom Pro Tweaks',          url: null, comingSoon: true },
  extreme:   { name: 'Phantom Extreme Tweaks',      url: null, comingSoon: true },
  precision: { name: 'Phantom Precision Pack',      url: null, comingSoon: true },
  vibrance:  { name: 'Phantom Vibrance Controller', url: null, comingSoon: true }
};

const TWEAK_CATEGORIES = [
  { id: 'deep-clean', icon: '&#128465;',  name: 'Deep Clean', count: 14, items: [
    { name: 'Disk Cleanup', impact: 'low' }, { name: 'DNS Cache Flush', impact: 'low' }, { name: 'Windows Store Cache', impact: 'low' },
    { name: 'Thumbnail Cache', impact: 'low' }, { name: 'Icon Cache', impact: 'low' }, { name: 'Windows Update Cache', impact: 'low' },
    { name: 'Font Cache', impact: 'low' }, { name: 'Prefetch Cleanup', impact: 'low' }, { name: 'Windows Error Reports', impact: 'low' },
    { name: 'Old Windows Install', impact: 'low' }, { name: 'Windows Temp Files', impact: 'low' }, { name: 'User Temp Files', impact: 'low' },
    { name: 'Crash Dumps', impact: 'low' }, { name: 'Software Distribution', impact: 'low' }
  ]},
  { id: 'network', icon: '&#127760;', name: 'Network', count: 6, items: [
    { name: 'Network Throttling', impact: 'high' }, { name: 'TCP Auto-Tuning', impact: 'medium' },
    { name: 'Nagle Algorithm', impact: 'medium' }, { name: 'DNS Optimization', impact: 'medium' },
    { name: 'Network Priority', impact: 'medium' }, { name: 'RSS', impact: 'low' }
  ]},
  { id: 'power', icon: '&#9889;', name: 'Power', count: 4, items: [
    { name: 'High Performance Plan', impact: 'high' }, { name: 'Disable Power Throttling', impact: 'high' },
    { name: 'Disable Core Parking', impact: 'medium' }, { name: 'Processor Performance Boost', impact: 'high' }
  ]},
  { id: 'browser', icon: '&#127760;', name: 'Browser', count: 4, items: [
    { name: 'Hardware Acceleration', impact: 'medium' }, { name: 'Browser Pre-rendering', impact: 'low' },
    { name: 'DNS Prefetch', impact: 'low' }, { name: 'Disable Telemetry', impact: 'low' }
  ]},
  { id: 'gpu', icon: '&#127918;', name: 'GPU', count: 3, items: [
    { name: 'NVIDIA Low Latency', impact: 'high' }, { name: 'GPU Power Management', impact: 'high' }, { name: 'Shader Cache', impact: 'medium' }
  ]},
  { id: 'timer', icon: '&#9201;', name: 'Timer', count: 2, items: [
    { name: 'Timer Resolution', impact: 'high' }, { name: 'TSC Sync', impact: 'medium' }
  ]},
  { id: 'storage', icon: '&#128190;', name: 'Storage', count: 4, items: [
    { name: 'AHCI Link Power', impact: 'medium' }, { name: 'TRIM Optimization', impact: 'medium' },
    { name: 'Write Caching', impact: 'medium' }, { name: 'NVMe Optimization', impact: 'high' }
  ]},
  { id: 'privacy', icon: '&#128274;', name: 'Privacy', count: 3, items: [
    { name: 'Telemetry Disable', impact: 'low' }, { name: 'Cortana Disable', impact: 'low' }, { name: 'Activity History', impact: 'low' }
  ]},
  { id: 'audio', icon: '&#127925;', name: 'Audio', count: 2, items: [
    { name: 'Audio Latency', impact: 'low' }, { name: 'Exclusive Mode', impact: 'low' }
  ]},
  { id: 'windows', icon: '&#128187;', name: 'Windows', count: 3, items: [
    { name: 'Game Mode', impact: 'medium' }, { name: 'Fullscreen Optimizations', impact: 'medium' }, { name: 'Visual Effects', impact: 'medium' }
  ]},
  { id: 'gaming', icon: '&#127918;', name: 'Gaming', count: 3, items: [
    { name: 'Game Bar Disable', impact: 'medium' }, { name: 'Game DVR', impact: 'high' }, { name: 'Xbox Services', impact: 'medium' }
  ]},
  { id: 'core', icon: '&#9881;', name: 'Core Tweaks', count: 413, items: [
    { name: 'CPU Priority Optimization', impact: 'high' }, { name: 'VBS / Hyper-V', impact: 'high' },
    { name: 'Mitigations', impact: 'high' }, { name: 'MSI Mode', impact: 'high' },
    { name: 'Device Affinities', impact: 'medium' }, { name: 'Memory Management', impact: 'medium' },
    { name: 'Background Services', impact: 'medium' }, { name: 'Scheduled Tasks', impact: 'low' },
    { name: 'Registry Optimizations', impact: 'high' }, { name: 'Power Plan Tweaks', impact: 'high' },
    { name: 'Input Optimization', impact: 'medium' }, { name: 'USB Optimization', impact: 'low' }
  ]}
];

const TOTAL_TWEAKS = TWEAK_CATEGORIES.reduce((s, c) => s + c.count, 0);

const TEAM = [
  { id: '1014494449809772544', name: 'zylen',   role: 'Developer',    level: 'owner' },
  { id: '1032970883192606780', name: 'domi',    role: 'Server Owner', level: 'admin' },
  { id: '398137085430726656',  name: 'nedis',   role: 'Admin',        level: 'admin' },
  { id: '1322475983386837006', name: 'donce',   role: 'Admin',        level: 'admin' },
  { id: '1402203036914290764', name: 'lukutis', role: 'Ticket Support', level: 'support' }
];

const FAQ = [
  { q: 'Is Phantom V2 safe to use?', a: 'Yes. Every tweak is reversible with one click. Phantom never modifies critical system files and all changes can be rolled back from the Settings page.' },
  { q: 'How much FPS will I gain?', a: 'Results vary by hardware and game. Most users see 15-60% FPS improvement. Check the FPS Comparison section for average gains across popular games.' },
  { q: 'What\'s the difference between the products?', a: '<strong>Full Optimization (&euro;24.99)</strong> — 461 tweaks: Everything combined. <strong>Basic (&euro;4.99)</strong> — 220 tweaks: Windows debloat, essential settings, GPU/network/power. <strong>Pro (&euro;9.99)</strong> — 291 tweaks: Basic + BCD, RAM, USB, deep cleanup. <strong>Extreme (&euro;14.99)</strong> — 283 tweaks: Full debloat, DirectX, buffer bloat, registry. <strong>Precision (&euro;5.99)</strong> — 128 tweaks: Input lag, mouse/keyboard, GPU latency for FPS games.' },
  { q: 'Do I need to restart my PC after optimizing?', a: 'Some tweaks take effect immediately, others require a restart. Phantom will notify you when a restart is needed. Quick Boost works instantly without restart.' },
  { q: 'How do I buy a product?', a: 'Go to the Products page, add items to cart, and checkout via PayPal. After payment, you\'ll be redirected to a download page with your .exe installer.' },
  { q: 'Does it work on Windows 11?', a: 'Yes. Phantom V2 supports Windows 10 and Windows 11. All tweaks are compatible with the latest updates.' },
  { q: 'Do I need to run as Administrator?', a: 'Yes. System-level tweaks (registry HKLM, services, power plans, bcdedit) require Administrator privileges. The app will warn you if not running as admin.' },
  { q: 'Can I revert changes?', a: 'Yes. Every tweak has a revert command. Use "Revert All" or click the checkmark next to any category to undo everything safely.' },
  { q: 'What if I lose my download link?', a: 'Your purchase is tied to your Discord username. Contact support in our Discord server with your username and we\'ll resend the download link.' },
  { q: 'What is your refund policy?', a: '<strong>No refunds.</strong> All sales are final. You receive a digital product that cannot be returned. If the app doesn\'t work, contact support on Discord.' }
];

const REFUND_POLICY = `
  <h2>Digital Products</h2>
  <p>Our products are digital downloads that provide immediate access upon purchase. Once accessed, they cannot be returned.</p>
  <h3>1. General Policy</h3>
  <p>Phantom V2 operates on a strict no-refund policy. All purchases of our digital products and services are final and non-refundable.</p>
  <h3>2. Why No Refunds?</h3>
  <ul>
    <li><strong>Digital Nature:</strong> Our products are digital downloads that provide immediate access and cannot be physically returned.</li>
    <li><strong>Immediate Access:</strong> Once purchased, you gain instant access to our optimization tools and cannot "unuse" them.</li>
    <li><strong>Intellectual Property:</strong> Our software contains proprietary technology that cannot be returned.</li>
  </ul>
  <h3>3. What This Means</h3>
  <ul>
    <li><strong>No Refunds:</strong> We will not process refunds for any reason, including dissatisfaction, change of mind, or technical issues.</li>
    <li><strong>No Chargebacks:</strong> Attempting to file a chargeback may result in account suspension and legal action.</li>
    <li><strong>No Exchanges:</strong> We do not offer exchanges for different products or services.</li>
  </ul>
  <h3>4. Before You Purchase</h3>
  <p>We strongly encourage all customers to thoroughly research our products before making a purchase.</p>
  <h3>5. Technical Support</h3>
  <p>While we don't offer refunds, we provide comprehensive technical support. If you experience any issues:</p>
  <div class="refund-support-grid">
    <div class="refund-support-card discord">
      <div class="refund-support-icon">&#128172;</div>
      <div class="refund-support-title">Discord Support</div>
      <div class="refund-support-desc">Join our Discord server for instant help</div>
      <a href="${DISCORD_INVITE}" target="_blank" class="btn btn-discord">Join Discord</a>
    </div>
    <div class="refund-support-card">
      <div class="refund-support-icon">&#9993;</div>
      <div class="refund-support-title">Email Support</div>
      <div class="refund-support-desc">Send us a detailed email for complex issues</div>
      <a href="mailto:choatixtweaks@gmail.com" class="btn btn-secondary">Send Email</a>
    </div>
  </div>
  <h3>6. Exceptions</h3>
  <p>The only exception is if we are unable to deliver the purchased product due to technical issues on our end.</p>
  <h3>7. Contact</h3>
  <p>Questions? Contact us at <a href="mailto:choatixtweaks@gmail.com">choatixtweaks@gmail.com</a> or join our <a href="${DISCORD_INVITE}" target="_blank">Discord server</a>.</p>
  <div class="refund-warning"><p><strong>By completing a purchase, you agree to this policy.</strong></p></div>
`;

const FPS_DATA = [
  { name: 'Fortnite', before: 110, after: 170, pct: 55 },
  { name: 'Valorant', before: 200, after: 320, pct: 60 },
  { name: 'CS2', before: 180, after: 300, pct: 67 },
  { name: 'Apex Legends', before: 100, after: 160, pct: 60 },
  { name: 'Minecraft', before: 120, after: 260, pct: 117 },
  { name: 'GTA V', before: 85, after: 125, pct: 47 }
];

const FEATURES = [
  { icon: '&#128293;', title: 'System Optimizer', desc: 'Apply 220-461 tweaks per tier. CPU, GPU, RAM, network, power — all optimized.' },
  { icon: '&#127918;', title: 'Game Optimizer', desc: 'Per-game profiles for Fortnite, Valorant, CS2, Apex, Minecraft and more.' },
  { icon: '&#128640;', title: 'Quick Boost', desc: 'Instant performance boost. Free up RAM, kill bloat, boost GPU priority.' },
  { icon: '&#9201;',   title: 'Zero Delay', desc: 'Reduce input lag. Optimize timer resolution, mouse latency, render pipeline.' },
  { icon: '&#128202;', title: 'FPS Compare', desc: 'Test before and after. See exact FPS improvement with side-by-side bars.' },
  { icon: '&#127942;', title: 'Benchmark Leaderboard', desc: 'Submit your score, compete globally, climb the ranks.' },
  { icon: '&#128260;', title: 'Safe Rollback', desc: 'Every change is reversible. One click to restore original Windows settings.' },
  { icon: '&#129529;', title: 'Deep Clean', desc: 'Clean 14 system caches in one click. Temp files, DNS, Windows Store cache.' },
  { icon: '&#128190;', title: 'Game Settings Backup', desc: 'Backup and restore game settings for Fortnite, Valorant, CS2, Apex.' },
  { icon: '&#9000;&#65039;', title: 'Keyboard Shortcuts', desc: 'Navigate pages instantly with number keys 1-9. Built for power users.' },
  { icon: '&#128279;', title: 'Discord Bot', desc: 'License management, giveaway system, daily quests, coins shop, admin tools.' }
];

// ── STATE ──

const CART_KEY = 'choatix_cart';
const DISCOUNT_KEY = 'choatix_discount';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
let appliedDiscount = JSON.parse(localStorage.getItem(DISCOUNT_KEY) || 'null');
let user = null;

// ── AUTH ──

function initAuth() {
  const params = new URLSearchParams(location.search);
  if (params.get('discord_id')) {
    localStorage.setItem('discord_id', params.get('discord_id'));
    localStorage.setItem('username', params.get('username'));
    localStorage.setItem('avatar', params.get('avatar') || '');
    history.replaceState({}, '', location.pathname);
  }
  if (params.get('checkout') === 'success') {
    const user = params.get('user') || '';
    const token = params.get('token') || '';
    const products = params.get('products') || '';
    history.replaceState({}, '', location.pathname);
    location.href = '#download?token=' + encodeURIComponent(token) + '&user=' + encodeURIComponent(user) + '&products=' + encodeURIComponent(products);
  }
  const id = localStorage.getItem('discord_id');
  const name = localStorage.getItem('username');
  const av = localStorage.getItem('avatar');
  if (id && name) {
    user = { id, name, avatar: av };
    fetch(`${API}/api/license/${id}`).then(r => r.json()).then(d => {
      if (d.tier) user.tier = d.tier;
      renderNav();
    }).catch(() => {});
  }
}

function login() { location.href = `${API}/api/auth/discord`; }
function logout(e) {
  e.preventDefault();
  ['discord_id', 'username', 'avatar'].forEach(k => localStorage.removeItem(k));
  user = null;
  renderNav();
}

// ── CART ──

function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function getCartTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function updateBadge() {
  const b = document.getElementById('cartBadge');
  if (!b) return;
  const n = cart.reduce((s, i) => s + i.qty, 0);
  b.textContent = n;
  b.classList.toggle('show', n > 0);
}
function addToCart(id, name, price) {
  const item = cart.find(i => i.id === id);
  if (item) item.qty++;
  else cart.push({ id, name, price, qty: 1 });
  saveCart();
  updateBadge();
  openCart();
}
function changeQty(id, d) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += d;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
  updateBadge();
}
function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
  updateBadge();
}
function renderCart() {
  const el = document.getElementById('cartItems');
  const total = document.getElementById('cartTotal');
  const btn = document.getElementById('cartCheckout');
  const foot = document.querySelector('.cart-foot');
  if (!el) return;
  if (cart.length === 0) {
    el.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">&#128722;</div>Your cart is empty</div>';
    if (total) total.textContent = '\u20AC0.00';
    if (btn) btn.disabled = true;
  } else {
    el.innerHTML = cart.map(i => `
      <div class="cart-item">
        <div class="cart-item-icon">&#9733;</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${i.name}</div>
          <div class="cart-item-price">&euro;${i.price.toFixed(2)}</div>
        </div>
        <div class="cart-item-qty">
          <button onclick="changeQty('${i.id}',-1)">&#8722;</button>
          <span>${i.qty}</span>
          <button onclick="changeQty('${i.id}',1)">+</button>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${i.id}')">&#10005;</button>
      </div>`).join('');
    if (btn) btn.disabled = false;
  }
  if (foot && !foot.querySelector('.cart-discount')) {
    const dc = document.createElement('div');
    dc.className = 'cart-discount';
    foot.insertBefore(dc, foot.querySelector('.cart-total'));
  }
  const dcEl = foot?.querySelector('.cart-discount');
  if (dcEl) {
    dcEl.innerHTML = appliedDiscount
      ? `<div class="cart-discount-applied"><span class="cart-discount-tag">&#10003; ${appliedDiscount.code} (-${appliedDiscount.percent}%)</span><button class="cart-discount-remove" onclick="removeDiscount()">&#10005;</button></div>`
      : '<div class="cart-discount-input"><input type="text" id="discountInput" placeholder="Discount code" maxlength="20"><button onclick="applyDiscount()">Apply</button></div>';
  }
  const sub = getCartTotal();
  const disc = appliedDiscount ? sub * (appliedDiscount.percent / 100) : 0;
  if (total) {
    total.innerHTML = appliedDiscount
      ? `<span style="text-decoration:line-through;opacity:0.5;margin-right:6px;font-size:0.8em">&euro;${sub.toFixed(2)}</span>&euro;${(sub - disc).toFixed(2)}`
      : '\u20AC' + sub.toFixed(2);
  }
  if (foot && !foot.querySelector('.no-refund')) {
    const n = document.createElement('div');
    n.className = 'no-refund';
    n.innerHTML = '<span style="color:#ff5252;font-size:0.65rem;font-weight:700">&#9888; All sales final &mdash; no refunds.</span>';
    foot.insertBefore(n, btn);
  }
}
async function applyDiscount() {
  const input = document.getElementById('discountInput');
  if (!input?.value.trim()) return;
  const code = input.value.trim().toUpperCase();
  try {
    const r = await fetch(`${API}/api/discount/${code}`);
    const d = await r.json();
    if (d.valid) {
      appliedDiscount = { code: d.code, percent: d.discount };
      localStorage.setItem(DISCOUNT_KEY, JSON.stringify(appliedDiscount));
      renderCart();
    } else { alert(d.error || 'Invalid discount code'); }
  } catch { alert('Failed to verify discount code'); }
}
function removeDiscount() {
  appliedDiscount = null;
  localStorage.removeItem(DISCOUNT_KEY);
  renderCart();
}
function openCart() {
  document.getElementById('cartOverlay')?.classList.add('open');
  document.getElementById('cartSidebar')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.body.style.overflow = '';
}
async function checkout() {
  if (!cart.length) return;
  let username = localStorage.getItem('username');
  if (!username) {
    username = prompt('Enter your Discord username (for delivery):');
    if (!username) return;
    localStorage.setItem('username', username);
  }
  const btn = document.getElementById('cartCheckout');
  if (btn) { btn.textContent = 'Redirecting to PayPal...'; btn.disabled = true; }
  try {
    const items = cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));
    const r = await fetch(`${API}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, discordUsername: username, discountCode: appliedDiscount?.code || null })
    });
    const data = await r.json();
    if (data.url) {
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(DISCOUNT_KEY);
      appliedDiscount = null;
      if (data.downloadToken) localStorage.setItem('choatix_download_token', data.downloadToken);
      location.href = data.url;
      return;
    }
  } catch {}
  if (btn) { btn.textContent = 'Checkout via PayPal'; btn.disabled = false; }
  alert('Checkout failed. Try again or contact support on Discord.');
}

// ── NAVIGATION ──

const ROUTES = [
  { path: '',              label: 'Home' },
  { path: 'features',     label: 'Features' },
  { path: 'tweaks',       label: 'Tweaks' },
  { path: 'products',     label: 'Products' },
  { path: 'pricing',      label: 'Pricing' },
  { path: 'faq',          label: 'FAQ' },
  { path: 'refund',       label: 'Refund Policy' },
  { path: 'affiliate',    label: 'Affiliates', cls: 'nav-affiliate' },
  { path: 'team',         label: 'Team' }
];

function renderNav() {
  const hash = location.hash.slice(1).split('?')[0].split('/')[0];
  const navLinks = ROUTES.map(r => {
    const active = r.path === hash ? ' class="active"' : r.cls ? ` class="${r.cls}"` : '';
    return `<a href="#${r.path || ''}"${active}>${r.label}</a>`;
  }).join('');

  const avatarHTML = user
    ? (() => {
        const av = user.avatar;
        const isUrl = av && av.startsWith('http');
        const src = isUrl ? av : (av ? `https://cdn.discordapp.com/avatars/${user.id}/${av}.${av.startsWith('a_') ? 'gif' : 'webp'}?size=128` : '');
        return `<img class="user-avatar" id="userAvatar" src="${src}" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="user-avatar-fallback" id="userAvatarFallback" style="${av ? 'display:none' : ''}">${user.name?.charAt(0)?.toUpperCase() || '?'}</div>`;
      })()
    : '';

  const tierHTML = user?.tier
    ? `<span class="user-tier ${user.tier.toLowerCase()}">${user.tier}</span>`
    : '';

  document.getElementById('app-nav').innerHTML = `
    <a href="#" class="nav-brand" onclick="navigate('');return false">phantom<span>.</span></a>
    <button class="hamburger" onclick="document.querySelector('.nav-links').classList.toggle('open')">&#9776;</button>
    <div class="nav-links">
      ${navLinks}
      <a href="${DISCORD_INVITE}" target="_blank">Discord</a>
      <button class="cart-btn" onclick="openCart()" id="cartBtn">&#128722;<span class="cart-badge" id="cartBadge">0</span></button>
      ${user ? `
        <div class="user-menu" id="userMenu">
          <a href="#" class="user-btn" onclick="toggleDropdown(event)">
            ${avatarHTML}
            <span class="user-name" id="userName">${user.name}</span>
            ${tierHTML}
          </a>
          <div class="user-dropdown">
            <a class="dropdown-item" href="#download"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Download App</a>
            <a class="dropdown-item" href="${DISCORD_INVITE}" target="_blank"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>Join Discord</a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item danger" href="#" onclick="logout(event)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>Logout</a>
          </div>
        </div>` : ''}
      <a href="#" class="btn btn-secondary" id="loginBtn" onclick="login();return false" ${user ? 'style="display:none"' : ''}>Login</a>
    </div>`;
}

function renderCartSidebar() {
  document.getElementById('app-cart').innerHTML = `
    <div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
    <div class="cart-sidebar" id="cartSidebar">
      <div class="cart-head"><h3>Shopping Cart</h3><button class="cart-close" onclick="closeCart()">&#10005;</button></div>
      <div class="cart-items" id="cartItems"></div>
      <div class="cart-foot">
        <div class="cart-total"><span class="cart-total-label">Total</span><span class="cart-total-price" id="cartTotal">&euro;0.00</span></div>
        <button class="cart-checkout" id="cartCheckout" onclick="checkout()" disabled>Checkout via PayPal</button>
      </div>
    </div>`;
}

function renderFooter() {
  document.getElementById('app-footer').innerHTML = `
    <footer>
      <div class="footer-links">
        <a href="#features">Features</a>
        <a href="#tweaks">Tweaks</a>
        <a href="#products">Products</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
        <a href="#refund">Refund Policy</a>
        <a href="#affiliate" class="footer-affiliate">Affiliates</a>
        <a href="#team">Team</a>
        <a href="${DISCORD_INVITE}" target="_blank">Discord</a>
      </div>
      <p>&copy; 2026 Phantom V2. Built by zylenofficial.</p>
    </footer>`;
}

function toggleDropdown(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('userMenu')?.classList.toggle('open');
}

function navigate(path) {
  location.hash = path;
}

// ── ROUTER ──

function getPage() {
  const hash = location.hash.slice(1).split('?')[0].split('/')[0];
  return hash || '';
}

function router() {
  const page = getPage();
  const main = document.getElementById('app-content');
  const PRODUCT_IDS = ['basic','pro','extreme','full','precision','vibrance'];
  const pages = {
    '':         renderHome,
    'features': renderFeatures,
    'tweaks':   renderTweaks,
    'products': renderProducts,
    'pricing':  renderPricing,
    'faq':      renderFAQ,
    'refund':   renderRefund,
    'affiliate':renderAffiliate,
    'team':     renderTeam,
    'download': renderDownload
  };
  const render = PRODUCT_IDS.includes(page) ? () => renderProductDetail(page) : (pages[page] || render404);
  main.innerHTML = render();
  renderNav();
  renderCart();
  updateBadge();
  initPageEffects();
  window.scrollTo(0, 0);
}

// ── PAGE: HOME ──

function renderHome() {
  const statsHTML = [
    { num: TOTAL_TWEAKS, label: 'System Tweaks' },
    { num: 20, label: 'Game Presets' },
    { num: 9, label: 'Optimization Tools' },
    { num: 100, suffix: '%', label: 'Free to Use' }
  ].map(s => `<div class="stat-cell"><div class="stat-num" data-count="${s.num}"${s.suffix ? ` data-suffix="${s.suffix}"` : ''}>0</div><div class="stat-txt">${s.label}</div></div>`).join('');

  const stepsHTML = [
    { icon: '&#128229;', num: 'Step 01', title: 'Download & Install', desc: 'Install takes 10 seconds. No bloatware, no ads, no data collection.' },
    { icon: '&#128269;', num: 'Step 02', title: 'Scan Your PC', desc: 'Analyze your hardware, OS, and settings to find optimization opportunities.' },
    { icon: '&#9889;',   num: 'Step 03', title: 'One-Click Optimize', desc: 'Apply all tweaks instantly. Every change is reversible. FPS jumps in seconds.' }
  ].map((s, i) => `
    <div class="step-item reveal reveal-d${i + 1}">
      <div class="step-icon">${s.icon}</div>
      <div class="step-num">${s.num}</div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </div>
    ${i < 2 ? '<div class="step-line"></div>' : ''}`).join('');

  const fpsHTML = FPS_DATA.map(f => `
    <div class="fps-row">
      <div class="fps-name">${f.name}</div>
      <div class="fps-bars">
        <div class="fps-bar before" data-w="${Math.round(f.before / 320 * 100)}%"><span>${f.before} FPS</span></div>
        <div class="fps-bar after" data-w="${Math.round(f.after / 320 * 100)}%"><span>${f.after} FPS</span></div>
      </div>
      <div class="fps-delta">+${f.pct}%</div>
    </div>`).join('');

  return `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge"><span class="dot"></span>v2.3.0 &bull; ${TOTAL_TWEAKS} System Tweaks</div>
        <h1><span class="line1">Maximize Your</span><span class="line2">FPS</span></h1>
        <p class="hero-desc">Optimize your PC for maximum gaming performance. One click. Zero delay. Pure performance.</p>
        <div class="hero-buttons">
          <a href="#products" class="btn btn-primary">Download Free</a>
          <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord</a>
        </div>
      </div>
      <div class="hero-scroll"><div class="hero-scroll-line"></div><div class="hero-scroll-text">Scroll</div></div>
    </section>
    <div class="trust-banner reveal">
      <div class="trust-item"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><strong>100% Safe</strong> Every tweak reversible</div>
      <div class="trust-item"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><strong>No Malware</strong> Open processes</div>
      <div class="trust-item"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><strong>Instant</strong> Download after purchase</div>
    </div>
    <div class="stats-row reveal">${statsHTML}</div>
    <section id="how-it-works">
      <div class="section-header reveal"><div class="section-label">How It Works</div><h2>Three steps to peak performance</h2></div>
      <div class="steps-row">${stepsHTML}</div>
    </section>
    <section id="fps-compare">
      <div class="section-header reveal"><div class="section-label">Performance</div><h2>Real FPS Gains</h2><p>Average improvements measured across 6 popular games</p></div>
      <div class="fps-grid" id="fpsGrid">${fpsHTML}</div>
      <div class="fps-legend reveal">
        <div class="fps-legend-item"><span class="fps-dot before"></span> Before</div>
        <div class="fps-legend-item"><span class="fps-dot after"></span> After Phantom V2</div>
      </div>
    </section>
    <section class="cta-section">
      <h2 class="reveal">Ready to <span>Boost Your FPS</span>?</h2>
      <p class="reveal">Join 50,000+ gamers optimizing their PCs with Phantom V2</p>
      <div class="cta-buttons reveal">
        <a href="#products" class="btn btn-primary">Download Free</a>
        <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord</a>
      </div>
    </section>`;
}

// ── PAGE: FEATURES ──

function renderFeatures() {
  const cardsHTML = FEATURES.map((f, i) => `
    <div class="feature-card reveal reveal-d${(i % 4) + 1}">
      <div class="feature-icon">${f.icon}</div>
      <h3>${f.title}</h3>
      <p>${f.desc}</p>
    </div>`).join('');

  const lineupHTML = [
    { id: 'basic',     badge: '&euro;4.99', cls: '' },
    { id: 'pro',       badge: '&euro;9.99', cls: '' },
    { id: 'extreme',   badge: '&euro;14.99', cls: 'featured' },
    { id: 'precision', badge: '&euro;5.99', cls: 'aim' },
    { id: 'full',      badge: '&euro;24.99', cls: 'save' }
  ].map(p => {
    const prod = PRODUCTS[p.id];
    return `
      <div class="lineup-card ${p.cls}">
        <div class="lineup-badge ${p.cls}">${p.badge}</div>
        <h3>${prod.name}</h3>
        <p>${prod.tweaks} tweaks &middot; ${prod.desc}</p>
        <a href="#${p.id === 'full' ? 'products' : p.id}" class="btn ${p.cls === 'featured' ? 'btn-primary' : 'btn-secondary'}">View Details</a>
      </div>`;
  }).join('');

  return `
    <section class="page-hero">
      <h1><span class="line1">Everything You</span><span class="line2">Need</span></h1>
      <p>Complete PC optimization suite built for gamers</p>
    </section>
    <section id="features-grid">
      <div class="features-grid">${cardsHTML}</div>
    </section>
    <section class="product-lineup-section">
      <div class="section-header reveal"><div class="section-label">Product Lineup</div><h2>Choose Your Tier</h2><p>Each product is a standalone app with its own tweak set</p></div>
      <div class="product-lineup-grid reveal">${lineupHTML}</div>
    </section>
    <section class="cta-section">
      <h2 class="reveal">Ready to Boost<br>Your FPS?</h2>
      <p class="reveal">Join gamers optimizing their PCs with Phantom V2</p>
      <div class="cta-buttons reveal">
        <a href="#products" class="btn btn-primary">Download Free</a>
        <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord</a>
      </div>
    </section>`;
}

// ── PAGE: TWEAKS ──

function renderTweaks() {
  const cardsHTML = TWEAK_CATEGORIES.map(c => `
    <div class="tweak-card ${c.id === 'core' ? 'tweak-card-core' : ''}" onclick="openTweakModal('${c.id}')">
      <div class="tweak-card-icon">${c.icon}</div>
      <h3>${c.name}</h3>
      <p>${c.count} tweaks</p>
    </div>`).join('');

  return `
    <section class="page-hero">
      <div class="hero-content">
        <div class="hero-badge"><span class="dot"></span>v2.3.0</div>
        <h1>${TOTAL_TWEAKS} System Tweaks</h1>
        <p class="hero-desc">Organized into ${TWEAK_CATEGORIES.length} categories for maximum control</p>
      </div>
    </section>
    <section class="tweaks-section">
      <div class="tweaks-grid">${cardsHTML}</div>
    </section>
    <div class="tweaks-modal-overlay" id="tweaksModal">
      <div class="tweaks-modal">
        <div class="tweaks-modal-header"><h2 id="tweaksModalTitle">Category</h2><button class="tweaks-modal-close" onclick="closeTweakModal()">&#10005;</button></div>
        <div class="tweaks-modal-body" id="tweaksModalBody"></div>
      </div>
    </div>`;
}

function openTweakModal(id) {
  const cat = TWEAK_CATEGORIES.find(c => c.id === id);
  if (!cat) return;
  document.getElementById('tweaksModalTitle').textContent = cat.name;
  document.getElementById('tweaksModalBody').innerHTML = '<div class="tweaks-modal-items">' +
    cat.items.map(i => `<div class="tweak-item"><span class="tweak-item-name">${i.name}</span><span class="tweak-item-impact impact-${i.impact}">${i.impact}</span></div>`).join('') + '</div>';
  document.getElementById('tweaksModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeTweakModal() {
  document.getElementById('tweaksModal').style.display = 'none';
  document.body.style.overflow = '';
}

// ── PAGE: PRODUCTS ──

function renderProducts() {
  const order = ['full', 'basic', 'pro', 'extreme', 'precision', 'vibrance'];
  const cardsHTML = order.map(id => {
    const p = PRODUCTS[id];
    const featured = p.id === 'full' ? 'featured' : '';
    const badgeClass = p.color ? `badge-${p.color}` : '';
    const isFree = p.price === null;
    const boxLines = p.name.split(' ');
    const boxName = boxLines.length > 1 ? boxLines.slice(0, -1).join(' ') + '<br>' + boxLines.slice(-1) : p.name;

    return `
      <div class="product-card ${featured} ${badgeClass}">
        ${p.badge ? `<div class="product-badge ${p.color ? 'badge-' + p.color + '-tag' : ''}">${p.badge}</div>` : ''}
        <div class="product-box">
          <div class="product-box-brand">Phantom</div>
          <div class="product-box-name">${boxName}</div>
          <div class="product-box-sub">${p.subtitle}</div>
        </div>
        <div class="product-brand">Phantom</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">${isFree ? 'Coming Soon' : '&euro;' + p.price.toFixed(2)}</div>
        <div class="product-actions">
          <a href="#${p.id}" class="product-link">View Details</a>
          ${isFree
            ? `<a href="${DISCORD_INVITE}" target="_blank" class="product-link">Join Discord</a>`
            : `<button class="product-link add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>`}
        </div>
      </div>`;
  }).join('');

  return `
    <section class="page-hero">
      <h1>Our <em>Products</em></h1>
      <p>Premium optimization packs for every need</p>
    </section>
    <div class="trust-banner reveal">
      <div class="trust-item"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><strong>Instant Download</strong></div>
      <div class="trust-item"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><strong>100% Reversible</strong></div>
      <div class="trust-item"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><strong>Windows 10/11</strong></div>
    </div>
    <section>
      <div class="products-grid">${cardsHTML}</div>
    </section>`;
}

// ── PAGE: PRODUCT DETAIL ──

function renderProductDetail(id) {
  const p = PRODUCTS[id];
  if (!p) return render404();
  const boxLines = p.name.split(' ');
  const boxName = boxLines.length > 1 ? boxLines.slice(0, -1).join(' ') + '<br>' + boxLines.slice(-1) : p.name;
  const isFree = p.price === null;

  const tweakGroups = id === 'basic' ? ['deep-clean','network','power','gpu','gaming','windows']
    : id === 'pro' ? ['deep-clean','network','power','gpu','gaming','windows','storage','audio']
    : id === 'extreme' ? ['deep-clean','network','power','gpu','gaming','windows','browser','privacy']
    : id === 'precision' ? ['gpu','timer','network','core']
    : id === 'full' ? TWEAK_CATEGORIES.map(c => c.id)
    : [];

  const tweaksHTML = tweakGroups.map(gid => {
    const cat = TWEAK_CATEGORIES.find(c => c.id === gid);
    if (!cat) return '';
    return `<div class="pd-tweak-group"><div class="pd-tweak-icon">${cat.icon}</div><div class="pd-tweak-info"><h3>${cat.name}</h3><p>${cat.items.map(i => i.name).join(', ')}</p></div><div class="pd-tweak-count">${cat.count}</div></div>`;
  }).join('');

  const featuresHTML = id === 'full' ? [
    { icon: '&#128293;', title: '461 System Tweaks', desc: 'Every optimization category included' },
    { icon: '&#127918;', title: 'Game Presets', desc: 'Per-game optimization for 20+ titles' },
    { icon: '&#128640;', title: 'Quick Boost', desc: 'Instant RAM, process, and GPU boost' },
    { icon: '&#128260;', title: 'Safe Rollback', desc: 'Every change is reversible' }
  ] : id === 'precision' ? [
    { icon: '&#9201;', title: 'Timer Resolution', desc: 'Fix timer for lower input lag' },
    { icon: '&#127918;', title: 'GPU Low Latency', desc: 'NVIDIA Reflex and low latency mode' },
    { icon: '&#128187;', title: 'Input Optimization', desc: 'Mouse polling, keyboard repeat rate' },
    { icon: '&#127760;', title: 'Network for FPS', desc: 'Optimized for competitive online play' }
  ] : [
    { icon: '&#128465;', title: 'System Cleanup', desc: 'Remove bloat and temp files' },
    { icon: '&#127918;', title: 'GPU Optimization', desc: 'NVIDIA settings and power management' },
    { icon: '&#127760;', title: 'Network Tuning', desc: 'Reduce latency and packet loss' },
    { icon: '&#9889;', title: 'Power Plan', desc: 'High performance power settings' }
  ];

  const featCardsHTML = featuresHTML.map(f => `
    <div class="pd-feature">
      <div class="pd-feature-icon">${f.icon}</div>
      <h3>${f.title}</h3>
      <p>${f.desc}</p>
    </div>`).join('');

  return `
    <section class="pd-hero">
      <div class="pd-box ${id === 'vibrance' ? 'pd-vibrance' : ''}">
        <div class="pd-box-brand">Phantom</div>
        <div class="pd-box-name">${boxName}</div>
        <div class="pd-box-sub">${p.subtitle}</div>
      </div>
      <div class="pd-info">
        ${p.badge ? `<div class="product-badge ${p.color ? 'badge-' + p.color : ''}">${p.badge}</div>` : ''}
        <h1>${p.name}</h1>
        <div class="pd-price">${isFree ? 'Coming Soon' : '&euro;' + p.price.toFixed(2)}</div>
        <p>${p.desc}</p>
        <div class="pd-actions">
          ${isFree
            ? `<a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord for Updates</a>`
            : `<button class="btn btn-primary add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>
               <a href="#products" class="btn btn-secondary">Back to Products</a>`}
        </div>
      </div>
    </section>
    <section class="pd-section">
      <h2>What's Included</h2>
      <div class="pd-features">${featCardsHTML}</div>
    </section>
    <section class="pd-section">
      <h2>Tweak Categories</h2>
      <div class="pd-tweak-list">${tweaksHTML}</div>
    </section>
    <section class="pd-section">
      <div class="pd-cta">
        <h3>Ready to optimize?</h3>
        <p>${isFree ? 'Join our Discord to get notified when this product launches.' : 'Add to cart and checkout via PayPal. Instant download after purchase.'}</p>
        ${isFree
          ? `<a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord</a>`
          : `<button class="btn btn-primary add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>`}
      </div>
    </section>`;
}

// ── PAGE: PRICING ──

function renderPricing() {
  const tiers = [
    { name: 'Free', price: '0', period: 'Forever', features: ['System Health Overview', 'Scan PC', 'Quick Boost', 'System Info', 'Process Manager', 'Community Support'], cta: 'Download Free', href: '#products', cls: '' },
    { name: 'Full', price: 'Coming Soon', period: '', popular: true, features: ['Everything below', TOTAL_TWEAKS + ' System Tweaks', '20 Game Presets', 'Game Library (auto-detect)', 'VBS/HVCI, C-States, Hyper-V', 'NVIDIA Telemetry, Drive Optim', 'Auto Restore Points', 'TrustedInstaller Elevation', 'Everything in Free'], cta: 'Coming Soon', href: '#products', cls: 'popular' },
    { name: 'Pro', price: 'Coming Soon', period: '', features: ['Everything in Free', '291 System Tweaks', 'Game Presets', 'Deep Clean', 'FPS Compare'], cta: 'Coming Soon', href: '#products', cls: '' }
  ];

  const pricingCards = tiers.map((t, i) => `
    <div class="price-card ${t.popular ? 'featured' : ''} reveal reveal-d${i + 1}">
      ${t.popular ? '<div class="price-popular">BEST VALUE</div>' : ''}
      <div class="price-tier">${t.name}</div>
      <div class="price-amount">${t.price === '0' ? '&euro;0' : t.price === 'Coming Soon' ? 'Coming Soon' : '&euro;' + t.price}</div>
      <div class="price-period">${t.period ? t.period + ' payment' : ''}</div>
      <ul class="price-features">${t.features.map(f => `<li><span class="price-check"><svg viewBox="0 0 12 12"><path d="M2 6l3 3 5-5"/></svg></span>${f}</li>`).join('')}</ul>
      <a href="${t.href}" class="btn ${t.popular ? 'btn-primary' : 'btn-secondary'} price-btn">${t.cta}</a>
    </div>`).join('');

  const productsHTML = ['full', 'basic', 'pro', 'extreme', 'precision', 'vibrance'].map(id => {
    const p = PRODUCTS[id];
    const featured = id === 'full' ? 'featured' : '';
    const badgeClass = p.color ? `badge-${p.color}` : '';
    const boxLines = p.name.split(' ');
    const boxName = boxLines.length > 1 ? boxLines.slice(0, -1).join(' ') + '<br>' + boxLines.slice(-1) : p.name;
    return `
      <div class="product-card ${featured} ${badgeClass}">
        ${p.badge ? `<div class="product-badge ${p.color ? 'badge-' + p.color + '-tag' : ''}">${p.badge}</div>` : ''}
        <div class="product-box">
          <div class="product-box-brand">Phantom</div>
          <div class="product-box-name">${boxName}</div>
          <div class="product-box-sub">${p.subtitle}</div>
        </div>
        <div class="product-brand">Phantom</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">${p.price === null ? 'Coming Soon' : '&euro;' + p.price.toFixed(2)}</div>
        <div class="product-actions">
          <a href="#${p.id}" class="product-link">View Details</a>
          ${p.price ? `<button class="product-link add-to-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">Add to Cart</button>` : ''}
        </div>
      </div>`;
  }).join('');

  const compareFeatures = [
    { cat: 'Dashboard', features: ['System Health Overview', 'CPU / RAM / GPU Monitor', 'Ping & Network Stats', 'Optimization Counter & Rollback'] },
    { cat: 'Scan PC', features: ['Hardware Analysis', 'OS & Settings Scan', 'Optimization Recommendations'] },
    { cat: 'Optimize', features: ['Basic System Tweaks', TOTAL_TWEAKS + ' System Tweaks', 'CPU / GPU / RAM Optimizer', 'Network Optimizer', 'One-Click Apply All'] },
    { cat: 'Quick Boost', features: ['Free Up RAM', 'Kill Bloat Processes', 'Boost GPU Priority'] },
    { cat: '0 Delay', features: ['Timer Resolution Fix', 'Mouse Latency Reduction', 'Input Lag Optimizer', 'Sensitivity Calculator'] },
    { cat: 'Games', features: ['Game Profiles (12 Games)', 'Per-Game Optimization', 'Game Settings Backup & Restore'] },
    { cat: 'Leaderboard', features: ['Run Benchmark', 'Global Scores', 'Submit Score & Rank Up'] },
    { cat: 'System', features: ['System Info', 'Process Manager', 'Power Plan Manager', 'Network Speed Test'] },
    { cat: 'Extras', features: ['Deep Clean (14 Caches)', 'FPS Compare (Before / After)', 'Priority Support', 'Early Access Features'] }
  ];

  // free=0, pro=1, premium=2
  const availability = {
    'Dashboard': [['System Health Overview',1,1,1], ['CPU / RAM / GPU Monitor',1,1,1], ['Ping & Network Stats',1,1,1], ['Optimization Counter & Rollback',1,1,1]],
    'Scan PC': [['Hardware Analysis',1,1,1], ['OS & Settings Scan',1,1,1], ['Optimization Recommendations',0,1,1]],
    'Optimize': [['Basic System Tweaks',1,1,1], [TOTAL_TWEAKS + ' System Tweaks',0,1,1], ['CPU / GPU / RAM Optimizer',0,1,1], ['Network Optimizer',0,1,1], ['One-Click Apply All',0,1,1]],
    'Quick Boost': [['Free Up RAM',1,1,1], ['Kill Bloat Processes',1,1,1], ['Boost GPU Priority',0,1,1]],
    '0 Delay': [['Timer Resolution Fix',0,1,1], ['Mouse Latency Reduction',0,1,1], ['Input Lag Optimizer',0,1,1], ['Sensitivity Calculator',0,1,1]],
    'Games': [['Game Profiles (12 Games)',0,1,1], ['Per-Game Optimization',0,1,1], ['Game Settings Backup & Restore',0,0,1]],
    'Leaderboard': [['Run Benchmark',0,1,1], ['Global Scores',0,1,1], ['Submit Score & Rank Up',0,1,1]],
    'System': [['System Info',1,1,1], ['Process Manager',1,1,1], ['Power Plan Manager',0,0,1], ['Network Speed Test',0,0,1]],
    'Extras': [['Deep Clean (14 Caches)',0,1,1], ['FPS Compare',0,1,1], ['Priority Support',0,0,1], ['Early Access Features',0,0,1]]
  };

  let tableRows = '';
  for (const [cat, items] of Object.entries(availability)) {
    tableRows += `<tr class="cat-row"><td colspan="4">${cat}</td></tr>`;
    for (const [name, free, pro, prem] of items) {
      tableRows += `<tr><td>${name}</td><td class="${free ? 'check' : 'cross'}">${free ? '&#10003;' : '&#8212;'}</td><td class="${pro ? 'check' : 'cross'}">${pro ? '&#10003;' : '&#8212;'}</td><td class="${prem ? 'check' : 'cross'}">${prem ? '&#10003;' : '&#8212;'}</td></tr>`;
    }
  }

  return `
    <section class="page-hero">
      <h1 class="reveal">Simple Pricing</h1>
      <p class="hero-desc reveal">Start free. Upgrade when you need more.</p>
    </section>
    <section class="pricing-section">
      <div class="pricing-grid">${pricingCards}</div>
    </section>
    <section>
      <div class="section-header reveal"><div class="section-label">Individual Products</div><h2>Pick Only What You Need</h2><p>Buy specific tweak packs instead of the full app</p></div>
      <div class="products-grid">${productsHTML}</div>
    </section>
    <section class="section-compare">
      <div class="section-header reveal"><div class="section-label">Compare</div><h2>Feature Breakdown</h2><p>Every tool in the app, mapped to each plan</p></div>
      <table class="compare-table reveal">
        <thead><tr><th>Feature</th><th>Free</th><th>Pro <span class="compare-badge pop">Popular</span></th><th>Premium</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="pricing-note reveal"><p>All plans include the full desktop app. Upgrade via Discord with <code>/redeem</code> or buy directly from the <a href="#products">Products</a> page.</p></div>
    </section>
    <section class="cta-section">
      <h2 class="reveal">Ready to Boost<br>Your FPS?</h2>
      <p class="reveal">Download free. Upgrade anytime.</p>
      <div class="cta-buttons reveal">
        <a href="#products" class="btn btn-primary">Download Free</a>
        <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord</a>
      </div>
    </section>`;
}

// ── PAGE: FAQ ──

function renderFAQ() {
  const faqHTML = FAQ.map(f => `
    <div class="faq-item">
      <button class="faq-q" onclick="this.parentElement.classList.toggle('open')">
        <span>${f.q}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="faq-a"><p>${f.a}</p></div>
    </div>`).join('');

  return `
    <section class="page-hero">
      <h1>Frequently Asked <em>Questions</em></h1>
      <p>Everything you need to know about Phantom V2</p>
    </section>
    <section>
      <div class="faq-list reveal">${faqHTML}</div>
    </section>
    <section class="cta-section">
      <h2 class="reveal">Still Have Questions?</h2>
      <p class="reveal">Join our Discord and ask the community</p>
      <div class="cta-buttons reveal">
        <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord</a>
      </div>
    </section>`;
}

// ── PAGE: REFUND ──

function renderRefund() {
  return `
    <section class="page-hero">
      <h1>Refund <em>Policy</em></h1>
      <p>Digital products — all sales final</p>
    </section>
    <section>
      <div class="refund-content">
        <div class="refund-card">${REFUND_POLICY}</div>
        <div class="refund-actions">
          <a href="#products" class="btn btn-primary">Back to Products</a>
          <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Contact Support</a>
        </div>
      </div>
    </section>`;
}

// ── PAGE: AFFILIATE ──

function renderAffiliate() {
  return `
    <section class="page-hero">
      <h1>Affiliate <em>Program</em></h1>
      <p>Promote Phantom and earn commission on every sale</p>
    </section>
    <section style="text-align:center;padding:4rem 2rem">
      <div style="max-width:500px;margin:0 auto;background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:4rem 3rem">
        <div style="font-size:3rem;margin-bottom:1.5rem">&#128640;</div>
        <h2 style="font-size:1.8rem;font-weight:900;margin-bottom:0.75rem">Coming Soon</h2>
        <p style="color:var(--text-dim);font-size:0.95rem;line-height:1.7;margin-bottom:2rem">The affiliate program is currently under development. We're building something great — earn commission on every sale when it launches.</p>
        <div style="display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
          <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord for Updates</a>
          <a href="#products" class="btn btn-secondary">View Products</a>
        </div>
      </div>
    </section>`;
}

let aff = null;

async function registerAffiliate() {
  const di = document.getElementById('regDiscordId')?.value.trim();
  const dn = document.getElementById('regDisplayName')?.value.trim();
  const pp = document.getElementById('regPaypal')?.value.trim();
  const cc = document.getElementById('regCustomCode')?.value.trim();
  const err = document.getElementById('regError');
  if (!di || !dn || !pp) { if (err) { err.textContent = 'All fields are required'; err.style.display = 'block'; } return; }
  try {
    const body = { discordId: di, displayName: dn, paypalEmail: pp };
    if (cc) body.customCode = cc;
    const r = await fetch(`${API}/api/affiliate/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.success) { user = { id: di, name: dn }; checkAffiliate(); }
    else { if (err) { err.textContent = d.error || 'Failed'; err.style.display = 'block'; } }
  } catch { if (err) { err.textContent = 'Network error'; err.style.display = 'block'; } }
}

async function checkAffiliate() {
  if (!user) return;
  try {
    const r = await fetch(`${API}/api/affiliate/${user.id}`);
    const d = await r.json();
    if (d.affiliate) { aff = d; showDash(); }
  } catch {}
}

function showDash() {
  document.getElementById('publicPage').style.display = 'none';
  document.getElementById('dashPage').style.display = 'block';
  document.getElementById('registerSection').style.display = 'none';
  document.getElementById('dashWelcome').textContent = 'Welcome, ' + (aff?.affiliate?.display_name || user.name);
  loadStats();
}

async function loadStats() {
  if (!user) return;
  try {
    const r = await fetch(`${API}/api/affiliate/${user.id}/stats`);
    const d = await r.json();
    document.getElementById('sEarned').textContent = '\u20AC' + (d.totalCommission || 0).toFixed(2);
    document.getElementById('sPending').textContent = '\u20AC' + (d.pendingCommission || 0).toFixed(2);
    document.getElementById('sClicks').textContent = d.clicks || 0;
    document.getElementById('sConv').textContent = d.conversions || 0;
    const lp = document.getElementById('panel-links');
    if (aff?.links?.length > 0) {
      lp.innerHTML = aff.links.map(l => `<div class="link-card"><div class="link-card-head"><span class="link-card-code">${l.code}</span><span class="link-card-stats">${l.clicks || 0} clicks · ${l.conversions || 0} sales</span></div><div class="link-card-url"><input type="text" value="${API}/api/track/${l.code}" readonly id="lk-${l.code}"><button onclick="copyLk('${l.code}')">Copy</button></div></div>`).join('');
    } else { lp.innerHTML = '<div class="empty-state"><p>No links yet. Click "+ New Link" to get started.</p></div>'; }
    const sp = document.getElementById('panel-sales');
    if (d.recentSales?.length > 0) {
      sp.innerHTML = d.recentSales.map(s => `<div class="sale-row"><div class="sale-date">${new Date(s.created_at).toLocaleDateString()}</div><div class="sale-product">${s.product_id}</div><div class="sale-amount">&euro;${parseFloat(s.sale_amount).toFixed(2)}</div><div class="sale-commission">&euro;${parseFloat(s.commission).toFixed(2)}</div><div class="sale-status"><span class="status-badge status-${s.status}">${s.status}</span></div></div>`).join('');
    } else { sp.innerHTML = '<div class="empty-state"><p>No sales yet. Share your link to start earning!</p></div>'; }
    const pp = document.getElementById('panel-payouts');
    if (d.payouts?.length > 0) {
      pp.innerHTML = d.payouts.map(p => `<div class="sale-row"><div class="sale-date">${new Date(p.created_at).toLocaleDateString()}</div><div class="sale-product">PayPal: ${p.paypal_email}</div><div class="sale-amount"></div><div class="sale-commission">&euro;${parseFloat(p.amount).toFixed(2)}</div><div class="sale-status"><span class="status-badge status-${p.status}">${p.status}</span></div></div>`).join('');
    } else { pp.innerHTML = '<div class="empty-state"><p>No payouts yet. Earn at least &euro;5 to request one.</p></div>'; }
  } catch {}
}

function copyLk(code) {
  const el = document.getElementById('lk-' + code);
  if (el) { navigator.clipboard.writeText(el.value); const b = el.nextElementSibling; b.textContent = 'Copied!'; setTimeout(() => b.textContent = 'Copy', 2000); }
}

async function generateLink() {
  if (!user) return;
  try { await fetch(`${API}/api/affiliate/${user.id}/links`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }); const r = await fetch(`${API}/api/affiliate/${user.id}`); aff = await r.json(); loadStats(); } catch {}
}

async function requestPayout() {
  if (!user) return;
  try { const r = await fetch(`${API}/api/affiliate/${user.id}/payout`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }); const d = await r.json(); if (d.success) { alert('Payout of \u20AC' + d.amount.toFixed(2) + ' requested!'); loadStats(); } else { alert(d.error || 'Failed'); } } catch { alert('Network error'); }
}

function switchTab(btn, tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-' + tab)?.classList.add('active');
}

// ── PAGE: TEAM ──

function renderTeam() {
  const teamHTML = TEAM.map(m => `
    <div class="team-card">
      <img class="team-avatar" id="avatar-${m.id}" src="" alt="${m.name}">
      <div class="team-name">${m.name}</div>
      <div class="team-role ${m.level}">${m.role}</div>
    </div>`).join('');

  return `
    <section class="page-hero">
      <h1>Meet the <em>Crew</em></h1>
      <p>The people behind Phantom V2</p>
    </section>
    <section>
      <div class="team-grid reveal">${teamHTML}</div>
    </section>
    <section class="cta-section">
      <h2 class="reveal">Want to Join the Team?</h2>
      <p class="reveal">Apply in our Discord server</p>
      <div class="cta-buttons reveal">
        <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord</a>
      </div>
    </section>`;
}

// ── PAGE: DOWNLOAD ──

function renderDownload() {
  const params = new URLSearchParams(location.hash.split('?')[1]);
  const token = params.get('token');
  const userName = params.get('user');
  const products = params.get('products');

  if (!token || !userName || !products) {
    return `
      <div class="dl-empty" id="dlEmpty">
        <div class="dl-box">
          <h2>No purchases found</h2>
          <p>You haven't completed a purchase yet.</p>
          <a href="#products">Browse Products</a>
        </div>
      </div>`;
  }

  const ids = products.split(',');
  const listHTML = ids.map(id => {
    const info = DOWNLOADS[id];
    if (!info) return '';
    if (info.comingSoon) {
      return `<div class="dl-item"><div class="dl-item-info"><div class="dl-item-name">${info.name}</div><div class="dl-item-id">${id}</div></div><span style="color:#ffaa00;font-size:0.8rem;font-weight:600;">Coming Soon</span></div>`;
    }
    return `<div class="dl-item"><div class="dl-item-info"><div class="dl-item-name">${info.name}</div><div class="dl-item-id">${id}</div></div><a href="${info.url}" target="_blank"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Download</a></div>`;
  }).join('');

  return `
    <div class="dl-page" id="dlPage">
      <div class="dl-box">
        <div class="dl-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
        <h1>Payment Received!</h1>
        <p>Thank you for your purchase, ${userName}. Your downloads are ready.</p>
        <div class="dl-list" id="dlList">${listHTML}</div>
        <div class="dl-alt">Need help? <a href="${DISCORD_INVITE}" target="_blank">Join our Discord</a></div>
      </div>
    </div>`;
}

// ── PAGE: 404 ──

function render404() {
  return `
    <section class="page-hero">
      <h1>404</h1>
      <p>Page not found</p>
    </section>
    <section class="cta-section">
      <p>You seem lost. Let's get you back.</p>
      <div class="cta-buttons" style="margin-top:2rem">
        <a href="#" class="btn btn-primary">Go Home</a>
        <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord</a>
      </div>
    </section>`;
}

// ── EFFECTS ──


function initScrollEffects() {
  const nav = document.getElementById('app-nav');
  const scrollBar = document.getElementById('scrollBar');
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', scrollY > 50);
    if (scrollBar) scrollBar.style.width = (scrollY / (document.documentElement.scrollHeight - innerHeight) * 100) + '%';
  });

  const obs = new IntersectionObserver(e => e.forEach(x => { if (x.isIntersecting) x.target.classList.add('visible'); }), { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  const counterObs = new IntersectionObserver(e => e.forEach(x => {
    if (x.isIntersecting) {
      x.target.querySelectorAll('.stat-num[data-count]').forEach(el => {
        if (el.dataset.animated) return;
        el.dataset.animated = '1';
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const dur = 1600;
        const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }
  }), { threshold: 0.3 });
  const statsRow = document.querySelector('.stats-row');
  if (statsRow) counterObs.observe(statsRow);

  const fpsObs = new IntersectionObserver(e => e.forEach(x => {
    if (x.isIntersecting) {
      x.target.querySelectorAll('.fps-bar').forEach(b => b.style.width = b.dataset.w);
      x.target.querySelectorAll('.fps-row').forEach(r => r.classList.add('animated'));
    }
  }), { threshold: 0.3 });
  const fpsGrid = document.getElementById('fpsGrid');
  if (fpsGrid) fpsObs.observe(fpsGrid);

  document.querySelectorAll('.feature-card, .product-card').forEach(c => {
    c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%'); c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%'); });
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelector('.nav-links')?.classList.remove('open');
    });
  });

  TEAM.forEach(m => {
    const img = document.getElementById('avatar-' + m.id);
    if (img) fetch(`${API}/api/team/${m.id}`).then(r => r.json()).then(d => { if (d.avatar) img.src = d.avatar; }).catch(() => {});
  });
}

function initPageEffects() {
  setTimeout(() => initScrollEffects(), 10);
}

// ── INIT ──

function init() {
  initAuth();
  renderCartSidebar();
  renderFooter();
  router();

  addEventListener('hashchange', router);

  addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeTweakModal(); closeCart(); }
  });

  addEventListener('click', e => {
    if (!e.target.closest('.user-menu')) document.getElementById('userMenu')?.classList.remove('open');
    const btn = e.target.closest('.add-to-cart');
    if (btn) {
      e.preventDefault();
      addToCart(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.price));
    }
  });

  // Escape closes tweak modal
  document.getElementById('tweaksModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeTweakModal();
  });
}

document.addEventListener('DOMContentLoaded', init);

// ════════════════════════════════════════════════════════════════
// CHATBOT — Conversational Purchase Advisor
// ════════════════════════════════════════════════════════════════

const CHATBOT_FAB_KEY = 'choatix_chatbot_seen';

const CHAT_PRODUCTS = {
  basic:     { name: 'Basic Tweaks',      price: null,  tweaks: 220, desc: 'Windows debloat, essential settings, GPU, network, power', best: 'Budget-friendly all-rounder' },
  pro:       { name: 'Pro Tweaks',        price: null,  tweaks: 291, desc: 'Basic + BCD boot tweaks, RAM optimization, USB tuning, deep cleanup', best: 'Best value for most gamers' },
  extreme:   { name: 'Extreme Tweaks',    price: null, tweaks: 283, desc: 'Full debloat, DirectX, buffer bloat, registry tuning', best: 'Best Seller' },
  precision: { name: 'Precision Pack',    price: null,  tweaks: 128, desc: 'Input lag, mouse/keyboard optimization, GPU low latency, network', best: 'Competitive FPS players' },
  full:      { name: 'Full Optimization', price: null, tweaks: 461, desc: 'Everything combined — the complete optimization suite', best: 'Maximum performance' }
};

let chatbotOpen = false;
let chatbotMsgCount = 0;
let chatbotBadgeShown = false;
let chatContext = { topic: null, lastProduct: null };

function toggleChatbot() {
  chatbotOpen = !chatbotOpen;
  const win = document.getElementById('chatbotWindow');
  const fab = document.getElementById('chatbotFab');
  const badge = document.getElementById('chatbotBadge');

  if (chatbotOpen) {
    win.classList.add('open');
    fab.classList.add('open');
    badge.classList.remove('show');
    chatbotBadgeShown = true;
    localStorage.setItem(CHATBOT_FAB_KEY, '1');

    if (chatbotMsgCount === 0) {
      setTimeout(() => {
        botSay("Hey! I'm the Phantom assistant. I can help you pick the right optimization pack, answer questions about our products, or compare options. What can I help with?");
        showSuggestions(["What should I buy?", "Compare products", "How much FPS will I gain?", "Is it safe?"]);
      }, 400);
    }
    setTimeout(() => document.getElementById('chatbotInput')?.focus(), 400);
  } else {
    win.classList.remove('open');
    fab.classList.remove('open');
  }
}

function showChatbotBadge() {
  if (chatbotOpen || chatbotBadgeShown || localStorage.getItem(CHATBOT_FAB_KEY)) return;
  const badge = document.getElementById('chatbotBadge');
  if (badge) { badge.classList.add('show'); chatbotBadgeShown = true; }
}

function botSay(html, product) {
  const el = document.getElementById('chatbotMessages');
  if (!el) return;

  let productTag = '';
  if (product) {
    const p = CHAT_PRODUCTS[product];
    if (p) {
      const tagClass = product === 'extreme' ? 'best' : 'recommended';
      productTag = `<div class="chat-product-tag ${tagClass}">${p.name} — Coming Soon</div>`;
    }
  }

  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg bot';
  msgEl.innerHTML = `<div class="chat-msg-avatar">&#128161;</div><div class="chat-msg-bubble">${html}${productTag}</div>`;
  el.appendChild(msgEl);
  el.scrollTop = el.scrollHeight;
  chatbotMsgCount++;
}

function userSay(text) {
  const el = document.getElementById('chatbotMessages');
  if (!el) return;
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg user';
  msgEl.innerHTML = `<div class="chat-msg-avatar">Y</div><div class="chat-msg-bubble">${escapeHTML(text)}</div>`;
  el.appendChild(msgEl);
  el.scrollTop = el.scrollHeight;
}

function showSuggestions(labels) {
  const el = document.getElementById('chatbotQuickReplies');
  if (!el) return;
  el.innerHTML = labels.map((label, i) => {
    const isProduct = Object.keys(CHAT_PRODUCTS).some(k => label.toLowerCase().includes(k));
    return `<button class="chat-quick-btn${isProduct ? ' primary' : ''}" onclick="handleSuggestion('${escapeHTML(label)}')">${label}</button>`;
  }).join('');
}

function clearSuggestions() {
  const el = document.getElementById('chatbotQuickReplies');
  if (el) el.innerHTML = '';
}

function handleSuggestion(label) {
  userSay(label);
  clearSuggestions();
  setTimeout(() => processInput(label), 300);
}

function sendChatUserMessage() {
  const input = document.getElementById('chatbotInput');
  if (!input || !input.value.trim()) return;
  const text = input.value.trim();
  input.value = '';
  userSay(text);
  clearSuggestions();
  setTimeout(() => processInput(text), 400);
}

function processInput(text) {
  const lower = text.toLowerCase().trim();

  // ── Greetings ──
  if (lower.match(/^(hi|hello|hey|yo|sup|hola|howdy|good\s*(morning|afternoon|evening))/)) {
    botSay("Hey! Welcome to Phantom. What brings you here \u2014 looking to optimize your PC?");
    showSuggestions(["Yes, help me choose", "Just browsing", "What is Phantom?"]);
    return;
  }

  // ── What is Phantom ──
  if (lower.match(/what is|what's|tell me about|how does it work|what do you/)) {
    if (lower.match(/phantom|product|you|your/)) {
      botSay("Phantom V2 is a Windows PC optimization tool. We apply 220\u2013461 system tweaks (depending on the pack) to boost your FPS, reduce input lag, and clean up Windows. Every change is reversible with one click.");
      showSuggestions(["What should I buy?", "How much FPS?", "Is it safe?", "Compare products"]);
      return;
    }
  }

  // ── Safety / reversibility ──
  if (lower.match(/safe|security|virus|malware|revert|undo|rollback|reverse|restore/)) {
    botSay("Absolutely safe. Every single tweak has a revert command \u2014 you can undo any change instantly from the app. We never modify critical system files, and nothing we do can brick your PC. If anything feels off, just hit Revert All.");
    showSuggestions(["What should I buy?", "Compare products", "What games does it support?"]);
    return;
  }

  // ── FPS gains ──
  if (lower.match(/fps|frame|performance|boost|gain|improve/)) {
    botSay("Most users see <strong>15\u201360% FPS improvement</strong> depending on hardware and game. Here are some real averages:");
    setTimeout(() => {
      botSay("\u2022 <strong>Fortnite:</strong> 110 \u2192 170 FPS (+55%)<br>\u2022 <strong>Valorant:</strong> 200 \u2192 320 FPS (+60%)<br>\u2022 <strong>CS2:</strong> 180 \u2192 300 FPS (+67%)<br>\u2022 <strong>Apex:</strong> 100 \u2192 160 FPS (+60%)<br>\u2022 <strong>Minecraft:</strong> 120 \u2192 260 FPS (+117%)");
      showSuggestions(["Which pack gives the most FPS?", "What about input lag?", "Compare products"]);
    }, 600);
    return;
  }

  // ── Input lag / latency ──
  if (lower.match(/input lag|latency|delay|response time|mouse.*lag|stutter|frame time/)) {
    botSay("For input lag, our <strong>Precision Pack</strong> (\u20ac5.99) is specifically designed for that \u2014 it optimizes timer resolution, mouse polling, keyboard repeat rate, and GPU low latency mode. If you also want general system optimization, <strong>Extreme</strong> or <strong>Pro</strong> include those tweaks too.");
    chatContext.lastProduct = 'precision';
    showSuggestions(["Tell me about Precision", "Precision vs Extreme", "Add Precision to cart"]);
    return;
  }

  // ── Games support ──
  if (lower.match(/game|fortnite|valorant|cs2|apex|minecraft|gta|pubg|overwatch|warzone/)) {
    botSay("Phantom works with <strong>all games</strong> \u2014 it optimizes your system-level settings, not individual games. But we have specific FPS benchmarks for Fortnite, Valorant, CS2, Apex Legends, Minecraft, and GTA V. The tweaks affect GPU priority, CPU scheduling, network latency, and memory management which benefit every game.");
    showSuggestions(["How much FPS in [game]?", "What should I buy?", "Is it safe?"]);
    return;
  }

  // ── Compare products ──
  if (lower.match(/compar|difference|versus|vs|which.*better|what.*choose|which.*one/)) {
    botSay("Here's a quick breakdown:");
    setTimeout(() => {
      botSay("\u2022 <strong>Basic</strong> (\u20ac4.99) \u2014 220 tweaks. Essential Windows + GPU + network<br>\u2022 <strong>Pro</strong> (\u20ac9.99) \u2014 291 tweaks. Basic + BCD + RAM + USB<br>\u2022 <strong>Extreme</strong> (\u20ac14.99) \u2014 283 tweaks. Full debloat + DirectX + registry<br>\u2022 <strong>Precision</strong> (\u20ac5.99) \u2014 128 tweaks. Input lag + mouse + latency<br>\u2022 <strong>Full</strong> (\u20ac24.99) \u2014 461 tweaks. Everything combined");
      showSuggestions(["I play competitive FPS", "I want best value", "I want everything", "I'm on a budget"]);
    }, 500);
    return;
  }

  // ── Budget / price ──
  if (lower.match(/budget|cheap|afford|price|cost|expensive|worth|money|pay/)) {
    botSay("We've got options for every budget:");
    setTimeout(() => {
      botSay("\u2022 <strong>Cheapest:</strong> Basic at \u20ac4.99 (220 tweaks)<br>\u2022 <strong>Best value:</strong> Pro at \u20ac9.99 (291 tweaks)<br>\u2022 <strong>Most popular:</strong> Extreme at \u20ac14.99 (283 tweaks)<br>\u2022 <strong>Everything:</strong> Full at \u20ac24.99 (461 tweaks)");
      showSuggestions(["Under \u20ac10 options", "Under \u20ac15 options", "Full details"]);
    }, 500);
    return;
  }

  // ── Recommendations based on context ──
  if (lower.match(/recommend|suggest|should i|what.*buy|which.*get|which.*pack|which.*product/)) {
    if (lower.match(/fps|competitive|aim|shoot/)) {
      recommendProduct('precision');
    } else if (lower.match(/everything|all|complete|max|ultimate/)) {
      recommendProduct('full');
    } else if (lower.match(/cheap|budget|broke|afford/)) {
      recommendProduct('basic');
    } else if (lower.match(/best|popular|most/)) {
      recommendProduct('extreme');
    } else {
      botSay("To give you the best recommendation, tell me a bit about yourself:");
      showSuggestions(["I play competitive FPS", "I want best value", "I want everything", "I'm on a budget"]);
    }
    return;
  }

  // ── Specific product questions ──
  if (lower.match(/basic/)) {
    if (lower.match(/add|cart|buy|purchase/)) { botSay("<strong>Basic Tweaks</strong> is Coming Soon! Join our Discord for launch updates."); showSuggestions(["Join Discord", "Compare other options"]); return; }
    if (lower.match(/include|contain|what|feature|tweak/)) { showProductDetails('basic'); return; }
    recommendProduct('basic');
    return;
  }

  if (lower.match(/pro/)) {
    if (lower.match(/add|cart|buy|purchase/)) { botSay("<strong>Pro Tweaks</strong> is Coming Soon! Join our Discord for launch updates."); showSuggestions(["Join Discord", "Compare other options"]); return; }
    if (lower.match(/include|contain|what|feature|tweak/)) { showProductDetails('pro'); return; }
    recommendProduct('pro');
    return;
  }

  if (lower.match(/extreme/)) {
    if (lower.match(/add|cart|buy|purchase/)) { botSay("<strong>Extreme Tweaks</strong> is Coming Soon! Join our Discord for launch updates."); showSuggestions(["Join Discord", "Compare other options"]); return; }
    if (lower.match(/include|contain|what|feature|tweak/)) { showProductDetails('extreme'); return; }
    recommendProduct('extreme');
    return;
  }

  if (lower.match(/precision/)) {
    if (lower.match(/add|cart|buy|purchase/)) { botSay("<strong>Precision Pack</strong> is Coming Soon! Join our Discord for launch updates."); showSuggestions(["Join Discord", "Compare other options"]); return; }
    if (lower.match(/include|contain|what|feature|tweak/)) { showProductDetails('precision'); return; }
    recommendProduct('precision');
    return;
  }

  if (lower.match(/full|everything|all.*tweak|complete/)) {
    if (lower.match(/add|cart|buy|purchase/)) { botSay("<strong>Full Optimization</strong> is Coming Soon! Join our Discord for launch updates."); showSuggestions(["Join Discord", "Compare other options"]); return; }
    if (lower.match(/include|contain|what|feature|tweak/)) { showProductDetails('full'); return; }
    recommendProduct('full');
    return;
  }

  // ── Cart / checkout ──
  if (lower.match(/cart|checkout|pay|purchase/)) {
    botSay("All products are Coming Soon! Join our Discord for launch updates.");
    showSuggestions(["What should I buy?", "Compare products", "I'm on a budget"]);
    return;
  }

  // ── Refund ──
  if (lower.match(/refund|return|money back/)) {
    botSay("All sales are final \u2014 no refunds. Our products are digital downloads that provide immediate access. However, every tweak is fully reversible, and we offer free support on Discord if anything doesn't work as expected.");
    showSuggestions(["Is it safe?", "What should I buy?", "Join Discord"]);
    return;
  }

  // ── Windows version ──
  if (lower.match(/windows (10|11)|win(10|11)/)) {
    botSay("Yes! Phantom V2 fully supports both <strong>Windows 10</strong> and <strong>Windows 11</strong>. All tweaks are compatible with the latest updates on both versions.");
    showSuggestions(["What should I buy?", "Is it safe?", "How much FPS?"]);
    return;
  }

  // ── Discord / support ──
  if (lower.match(/discord|support|help|contact|join/)) {
    botSay("Join our Discord for support, updates, and community: <a href='https://discord.gg/AhEK85REhG' target='_blank' style='color:var(--green)'>discord.gg/AhEK85REhG</a>");
    showSuggestions(["What should I buy?", "Compare products"]);
    return;
  }

  // ── Thank you / bye ──
  if (lower.match(/thank|thanks|bye|goodbye|see you|that's all|done|great|awesome|perfect/)) {
    botSay("Glad I could help! If you need anything else, just open this chat again. Happy fragging!");
    showSuggestions(["Start over"]);
    return;
  }

  // ── Competitive / FPS player ──
  if (lower.match(/competitive|fps|valorant|cs2|apex|shoot|aim|pro.*player|esport/)) {
    botSay("For competitive FPS, you want low input lag and maximum frame rates. Here's what I'd suggest:");
    setTimeout(() => {
      botSay("\u2022 <strong>Precision Pack</strong> (\u20ac5.99) \u2014 pure input lag focus<br>\u2022 <strong>Extreme</strong> (\u20ac14.99) \u2014 input lag + full system optimization<br>\u2022 <strong>Full</strong> (\u20ac24.99) \u2014 everything combined");
      showSuggestions(["Precision (\u20ac5.99)", "Extreme (\u20ac14.99)", "Full (\u20ac24.99)", "Compare Precision vs Extreme"]);
    }, 500);
    return;
  }

  // ── Under 10 / under 15 ──
  if (lower.match(/under.*10|less than.*10|below.*10/)) {
    botSay("Under \u20ac10 you have two solid options:");
    setTimeout(() => {
      botSay("\u2022 <strong>Basic</strong> (\u20ac4.99) \u2014 220 tweaks, essential optimization<br>\u2022 <strong>Precision</strong> (\u20ac5.99) \u2014 128 tweaks, input lag focus");
      showSuggestions(["Basic (\u20ac4.99)", "Precision (\u20ac5.99)", "Which one for me?"]);
    }, 500);
    return;
  }

  if (lower.match(/under.*15|less than.*15|below.*15/)) {
    botSay("Under \u20ac15, <strong>Extreme</strong> (\u20ac14.99) is the sweet spot \u2014 283 tweaks including full debloat and DirectX optimization. It's our Best Seller.");
    showSuggestions(["Extreme (\u20ac14.99)", "Add to cart", "Show me cheaper options"]);
    return;
  }

  // ── Admin / admin area ──
  if (lower.match(/admin|panel|dashboard/)) {
    botSay("Sorry, I can't help with admin stuff. Talk to zylen on Discord for that!");
    showSuggestions(["Join Discord", "What should I buy?"]);
    return;
  }

  // ── Default: try to be helpful ──
  const responses = [
    "I'm not sure I understood that. Could you rephrase? I can help with product recommendations, pricing, features, or safety questions.",
    "Hmm, I didn't quite get that. Try asking about our products, pricing, or which pack is best for you.",
    "I'm not sure what you mean. Try asking something like \"What should I buy?\" or \"How much FPS will I gain?\""
  ];
  botSay(responses[Math.floor(Math.random() * responses.length)]);
  showSuggestions(["What should I buy?", "Compare products", "How much FPS?", "Is it safe?"]);
}

function recommendProduct(id) {
  const p = CHAT_PRODUCTS[id];
  if (!p) return;
  chatContext.lastProduct = id;
  botSay(`Based on what you've told me, I'd recommend <strong>${p.name}</strong> (Coming Soon).<br><br>${p.desc}.<br><em>${p.best}.</em>`, id);
  showSuggestions(["Tell me more", "Compare with other options"]);
}

function showProductDetails(id) {
  const p = CHAT_PRODUCTS[id];
  if (!p) return;
  chatContext.lastProduct = id;
  const detailMap = {
    basic: "\u2022 Windows debloat<br>\u2022 GPU optimization<br>\u2022 Network tuning<br>\u2022 Power plan<br>\u2022 Deep clean (14 caches)<br>\u2022 Gaming settings",
    pro: "Everything in Basic plus:<br>\u2022 BCD boot tweaks<br>\u2022 RAM optimization<br>\u2022 USB tuning<br>\u2022 Storage optimization<br>\u2022 Audio tweaks",
    extreme: "\u2022 Full Windows debloat<br>\u2022 DirectX optimization<br>\u2022 Buffer bloat fix<br>\u2022 Registry tuning<br>\u2022 Browser optimization<br>\u2022 Privacy tweaks",
    precision: "\u2022 Timer resolution fix<br>\u2022 Mouse polling optimization<br>\u2022 Keyboard repeat rate<br>\u2022 GPU low latency mode<br>\u2022 Network for competitive",
    full: "Everything in all packs combined:<br>\u2022 461 system tweaks<br>\u2022 Every optimization category<br>\u2022 Game presets for 20+ titles<br>\u2022 Quick Boost<br>\u2022 Safe rollback"
  };
  botSay(`<strong>${p.name}</strong> (Coming Soon) — ${p.tweaks} tweaks:<br><br>${detailMap[id]}`, id);
  showSuggestions(["Compare with others", "What should I buy?"]);
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

setTimeout(() => showChatbotBadge(), 5000);
