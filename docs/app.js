// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PHANTOM V2 â€” Complete App
// Single file: data + state + router + components + pages + effects
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€ DATA LAYER â”€â”€

const API = 'https://choatix-license-system.onrender.com';
const SITE_API = 'https://choatix-v2.onrender.com';
const DISCORD_INVITE = 'https://discord.gg/AhEK85REhG';

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
  { id: '1014494449809772544', name: 'rei1z',   role: 'Developer',    level: 'owner' },
  { id: '1032970883192606780', name: 'domi',    role: 'Server Owner', level: 'admin' },
  { id: '398137085430726656',  name: 'nedis',   role: 'Admin',        level: 'admin' },
  { id: '1322475983386837006', name: 'donce',   role: 'Admin',        level: 'admin' },
  { id: '1402203036914290764', name: 'lukutis', role: 'Ticket Support', level: 'support' }
];

const FAQ = [
  { q: 'Is Phantom V2 safe to use?', a: 'Yes. Every tweak is reversible with one click. Phantom never modifies critical system files and all changes can be rolled back from the Settings page.' },
  { q: 'How much FPS will I gain?', a: 'Results vary by hardware and game. Most users see 15-60% FPS improvement. Check the FPS Comparison section for average gains across popular games.' },
  { q: 'What\'s the difference between the products?', a: '<strong>Full Optimization (&euro;24.99)</strong> â€” 461 tweaks: Everything combined. <strong>Basic (&euro;4.99)</strong> â€” 220 tweaks: Windows debloat, essential settings, GPU/network/power. <strong>Pro (&euro;9.99)</strong> â€” 291 tweaks: Basic + BCD, RAM, USB, deep cleanup. <strong>Extreme (&euro;14.99)</strong> â€” 283 tweaks: Full debloat, DirectX, buffer bloat, registry. <strong>Precision (&euro;5.99)</strong> â€” 128 tweaks: Input lag, mouse/keyboard, GPU latency for FPS games.' },
  { q: 'Do I need to restart my PC after optimizing?', a: 'Some tweaks take effect immediately, others require a restart. Phantom will notify you when a restart is needed. Quick Boost works instantly without restart.' },
  { q: 'How do I buy a product?', a: 'Go to the Pricing page, choose a plan (Free, Pro, or Phantom), and checkout via PayPal. After payment, you\'ll receive a license key. Paste it in the Phantom app under Settings to activate.' },
  { q: 'Does it work on Windows 11?', a: 'Yes. Phantom V2 supports Windows 10 and Windows 11. All tweaks are compatible with the latest updates.' },
  { q: 'Do I need to run as Administrator?', a: 'Yes. System-level tweaks (registry HKLM, services, power plans, bcdedit) require Administrator privileges. The app will warn you if not running as admin.' },
  { q: 'Can I revert changes?', a: 'Yes. Every tweak has a revert command. Use "Revert All" or click the checkmark next to any category to undo everything safely.' },
  { q: 'What if I lose my license key?', a: 'Your purchase is tied to your Discord account. Contact support in our Discord server with your Discord ID and we\'ll resend your license key.' },
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
      <a href="mailto:phantomtweaks@gmail.com" class="btn btn-secondary">Send Email</a>
    </div>
  </div>
  <h3>6. Exceptions</h3>
  <p>The only exception is if we are unable to deliver the purchased product due to technical issues on our end.</p>
  <h3>7. Contact</h3>
  <p>Questions? Contact us at <a href="mailto:phantomtweaks@gmail.com">phantomtweaks@gmail.com</a> or join our <a href="${DISCORD_INVITE}" target="_blank">Discord server</a>.</p>
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
  { icon: '&#128293;', title: 'System Optimizer', desc: 'Apply 220-461 tweaks per tier. CPU, GPU, RAM, network, power â€” all optimized.' },
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

// â”€â”€ STATE â”€â”€

const CART_KEY = 'phantom_cart';
const DISCOUNT_KEY = 'phantom_discount';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
let appliedDiscount = JSON.parse(localStorage.getItem(DISCOUNT_KEY) || 'null');
let user = null;

// â”€â”€ AUTH â”€â”€

function initAuth() {
  const params = new URLSearchParams(location.search);
  if (params.get('discord_id')) {
    localStorage.setItem('discord_id', params.get('discord_id'));
    localStorage.setItem('username', params.get('username'));
    localStorage.setItem('avatar', params.get('avatar') || '');
    history.replaceState({}, '', location.pathname);
  }
  if (params.get('checkout') === 'success') {
    const token = params.get('token') || '';
    const products = params.get('products') || '';
    history.replaceState({}, '', location.pathname);
    if (token) {
      location.href = '#license?key=' + encodeURIComponent(token) + '&plan=' + (localStorage.getItem('phantom_checkout_plan') || 'pro');
      localStorage.removeItem('phantom_checkout_plan');
    }
  }
  const id = localStorage.getItem('discord_id');
  const name = localStorage.getItem('username');
  const av = localStorage.getItem('avatar');
  if (id && name) {
    user = { id, name, avatar: av };
    fetch(`${API}/api/license/discord/${id}`).then(r => r.json()).then(d => {
      if (d.plan) user.tier = d.plan;
      else if (d.tier) user.tier = d.tier;
      renderNav();
    }).catch(() => {});
  }
}

function login() { location.href = `${SITE_API}/api/auth/discord`; }
function logout(e) {
  e.preventDefault();
  ['discord_id', 'username', 'avatar'].forEach(k => localStorage.removeItem(k));
  user = null;
  renderNav();
}

// â”€â”€ CART â”€â”€

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
    const r = await fetch(`${SITE_API}/api/discount/${code}`);
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

  let discordId = localStorage.getItem('discord_id');
  let username = localStorage.getItem('username');
  if (!discordId && !username) {
    username = prompt('Enter your Discord username (optional, for license linking):');
    if (username) localStorage.setItem('username', username);
  }

  const btn = document.getElementById('cartCheckout');
  if (btn) { btn.textContent = 'Redirecting to PayPal...'; btn.disabled = true; }

  try {
    const highestTier = cart.reduce((t, i) => {
      if (i.id === 'phantom') return 'phantom';
      if (i.id === 'pro' && t !== 'phantom') return 'pro';
      return t;
    }, 'pro');

    const total = getCartTotal();
    const disc = appliedDiscount ? total * (appliedDiscount.percent / 100) : 0;
    const amount = (total - disc).toFixed(2);

    const body = {
      plan: highestTier,
      amount: amount,
      discordId: discordId || null,
      email: null,
      return_url: API + '/success/return.html',
      cancel_url: location.origin + location.pathname + '#pricing'
    };

    const r = await fetch(`${API}/api/license/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();

    if (data.approvalUrl) {
      localStorage.setItem('phantom_checkout_plan', highestTier);
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(DISCOUNT_KEY);
      appliedDiscount = null;
      location.href = data.approvalUrl;
      return;
    } else if (data.licenseKey) {
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem(DISCOUNT_KEY);
      appliedDiscount = null;
      location.href = '#license?key=' + encodeURIComponent(data.licenseKey) + '&plan=' + highestTier;
      return;
    }
  } catch (e) {
    console.error('Checkout error:', e);
    if (btn) { btn.textContent = 'Checkout via PayPal'; btn.disabled = false; }
    alert('Could not reach the payment server. It may be waking up - please wait 30 seconds and try again.');
  }
}

async function requestFreeLicense() {
  let discordId = localStorage.getItem('discord_id');
  if (!discordId) {
    const input = prompt('Enter your Discord ID (right-click your name in Discord > Copy User ID):');
    if (!input) return;
    discordId = input.trim();
    localStorage.setItem('discord_id', discordId);
  }
  try {
    const r = await fetch(`${API}/api/license/free`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId })
    });
    const data = await r.json();
    if (data.licenseKey) {
      location.href = '#license?key=' + encodeURIComponent(data.licenseKey) + '&plan=free';
    } else {
      alert(data.error || 'Failed to get free license. Please wait 30 seconds and try again.');
    }
  } catch (e) {
    console.error('Free license error:', e);
    alert('Could not reach the license server. It may be waking up - please wait 30 seconds and try again.');
  }
}

async function startCheckout(plan) {
  let discordId = localStorage.getItem('discord_id');
  let username = localStorage.getItem('username');
  if (!discordId && !username) {
    username = prompt('Enter your Discord username (optional, for license linking):');
    if (username) localStorage.setItem('username', username);
  }

  try {
    const body = {
      plan: plan,
      amount: plan === 'pro' ? '5.99' : '9.99',
      discordId: discordId || null,
      email: null,
      return_url: API + '/success/return.html',
      cancel_url: location.origin + location.pathname + '#pricing'
    };

    const r = await fetch(`${API}/api/license/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();

    if (data.approvalUrl) {
      localStorage.setItem('phantom_checkout_plan', plan);
      location.href = data.approvalUrl;
    } else if (data.licenseKey) {
      location.href = '#license?key=' + encodeURIComponent(data.licenseKey) + '&plan=' + plan;
    } else {
      alert(data.error || 'Checkout failed. Please wait 30 seconds and try again.');
    }
  } catch (e) {
    console.error('Checkout error:', e);
    alert('Could not reach the payment server. It may be waking up - please wait 30 seconds and try again.');
  }
}

// â”€â”€ NAVIGATION â”€â”€

const ROUTES = [
  { path: '',              label: 'Home' },
  { path: 'features',     label: 'Features' },
  { path: 'tweaks',       label: 'Tweaks' },
  { path: 'pricing',      label: 'Pricing' },
  { path: 'faq',          label: 'FAQ' },
  { path: 'refund',       label: 'Refund Policy' },
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
    </div>
    <div class="nav-actions">
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
        <a href="#pricing">Products</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
        <a href="#refund">Refund Policy</a>
        <a href="#team">Team</a>
        <a href="${DISCORD_INVITE}" target="_blank">Discord</a>
      </div>
      <p>&copy; 2026 Phantom V2. Built by re1z.</p>
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

// â”€â”€ ROUTER â”€â”€

function getPage() {
  const hash = location.hash.slice(1).split('?')[0].split('/')[0];
  return hash || '';
}

function router() {
  const page = getPage();
  const main = document.getElementById('app-content');
  const pages = {
    '':         renderHome,
    'features': renderFeatures,
    'tweaks':   renderTweaks,
    'pricing':  renderPricing,
    'faq':      renderFAQ,
    'refund':   renderRefund,
    'team':     renderTeam,
    'license':  renderLicense
  };
  const render = pages[page] || render404;
  main.innerHTML = render();
  renderNav();
  renderCart();
  updateBadge();
  initPageEffects();
  window.scrollTo(0, 0);
}

// â”€â”€ PAGE: HOME â”€â”€

function renderHome() {
  const statsHTML = [
    { num: TOTAL_TWEAKS, label: 'System Tweaks' },
    { num: 20, label: 'Game Presets' },
    { num: 9, label: 'Optimization Tools' },
    { num: 100, suffix: '%', label: 'Free to Use' }
  ].map(s => `<div class="stat-cell"><div class="stat-num" data-count="${s.num}"${s.suffix ? ` data-suffix="${s.suffix}"` : ''}>0</div><div class="stat-txt">${s.label}</div></div>`).join('');

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
        <div class="hero-buttons">
          <a href="#pricing" class="btn btn-primary">Download Free</a>
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
      <p class="reveal">Join gamers optimizing their PCs with Phantom V2</p>
      <div class="cta-buttons reveal">
        <a href="#pricing" class="btn btn-primary">Download Free</a>
        <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord</a>
      </div>
    </section>`;
}

// â”€â”€ PAGE: FEATURES â”€â”€

function renderFeatures() {
  const cardsHTML = FEATURES.map((f, i) => `
    <div class="feature-card reveal reveal-d${(i % 4) + 1}">
      <div class="feature-icon">${f.icon}</div>
      <h3>${f.title}</h3>
      <p>${f.desc}</p>
    </div>`).join('');

  return `
    <section class="page-hero">
      <h1><span class="line1">Everything You</span><span class="line2">Need</span></h1>
      <p>Complete PC optimization suite built for gamers</p>
    </section>
    <section id="features-grid">
      <div class="features-grid">${cardsHTML}</div>
    </section>
    <section class="cta-section">
      <h2 class="reveal">Ready to Boost<br>Your FPS?</h2>
      <p class="reveal">Join gamers optimizing their PCs with Phantom V2</p>
      <div class="cta-buttons reveal">
        <a href="#pricing" class="btn btn-primary">Download Free</a>
        <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord</a>
      </div>
    </section>`;
}

// â”€â”€ PAGE: TWEAKS â”€â”€

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

// â”€â”€ PAGE: PRICING â”€â”€

function renderPricing() {
  const tiers = [
    { name: 'Free', price: '0', period: 'Forever', features: ['System Health Overview', 'Scan PC', 'Quick Boost', 'System Info', 'Process Manager', '114 Free Tweaks', 'Community Support'], cta: 'Get Free License', action: 'getFree', cls: '' },
    { name: 'Pro', price: '5.99', period: 'One-time', popular: true, features: ['Everything in Free', '220+ System Tweaks', 'Game Presets', 'Deep Clean', 'FPS Compare', 'GPU / Network Optimizer', 'Priority Support'], cta: 'Get Pro', action: 'getPro', cls: 'popular' },
    { name: 'Phantom', price: '9.99', period: 'One-time', features: ['Everything in Pro', '346 System Tweaks', 'All Categories', 'VBS / Hyper-V', 'Registry Tuning', 'Full Debloat', 'TrustedInstaller Elevation', 'Auto Restore Points'], cta: 'Get Phantom', action: 'getPhantom', cls: '' }
  ];

  const pricingCards = tiers.map((t, i) => {
    const btnHTML = t.action === 'getFree'
      ? `<button class="btn ${t.popular ? 'btn-primary' : 'btn-secondary'} price-btn" onclick="requestFreeLicense()">${t.cta}</button>`
      : `<button class="btn ${t.popular ? 'btn-primary' : 'btn-secondary'} price-btn" onclick="startCheckout('${t.action === 'getPro' ? 'pro' : 'phantom'}')">${t.cta}</button>`;
    return `
    <div class="price-card ${t.popular ? 'featured' : ''} reveal reveal-d${i + 1}">
      ${t.popular ? '<div class="price-popular">BEST VALUE</div>' : ''}
      <div class="price-tier">${t.name}</div>
      <div class="price-amount">${t.price === '0' ? '&euro;0' : '&euro;' + t.price}</div>
      <div class="price-period">${t.period ? t.period + ' payment' : ''}</div>
      <ul class="price-features">${t.features.map(f => `<li><span class="price-check"><svg viewBox="0 0 12 12"><path d="M2 6l3 3 5-5"/></svg></span>${f}</li>`).join('')}</ul>
      ${btnHTML}
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
    <section class="section-compare">
      <div class="section-header reveal"><div class="section-label">Compare</div><h2>Feature Breakdown</h2><p>Every tool in the app, mapped to each plan</p></div>
      <table class="compare-table reveal">
        <thead><tr><th>Feature</th><th>Free</th><th>Pro <span class="compare-badge pop">Popular</span></th><th>Premium</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="pricing-note reveal"><p>All plans include the full desktop app. After purchase, you'll receive a license key. Enter it in the Phantom app under Settings to activate your tier.</p></div>
    </section>
    <section class="cta-section">
      <h2 class="reveal">Ready to Boost<br>Your FPS?</h2>
      <p class="reveal">Download free. Upgrade anytime.</p>
      <div class="cta-buttons reveal">
        <a href="#pricing" class="btn btn-primary">Download Free</a>
        <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Join Discord</a>
      </div>
    </section>`;
}

// â”€â”€ PAGE: FAQ â”€â”€

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

// â”€â”€ PAGE: REFUND â”€â”€

function renderRefund() {
  return `
    <section class="page-hero">
      <h1>Refund <em>Policy</em></h1>
      <p>Digital products â€” all sales final</p>
    </section>
    <section>
      <div class="refund-content">
        <div class="refund-card">${REFUND_POLICY}</div>
        <div class="refund-actions">
          <a href="#pricing" class="btn btn-primary">Back to Pricing</a>
          <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Contact Support</a>
        </div>
      </div>
    </section>`;
}

// â”€â”€ PAGE: TEAM â”€â”€

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

// â”€â”€ PAGE: 404 â”€â”€

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

// â”€â”€ PAGE: LICENSE KEY â”€â”€

function renderLicense() {
  const params = new URLSearchParams(location.hash.split('?')[1]);
  const sessionID = params.get('session_id');
  const key = params.get('key');
  const plan = params.get('plan');

  // Coming back from a Stripe Checkout redirect: exchange session_id for a license key
  if (!key && sessionID) {
    setTimeout(() => fetchLicenseFromSession(sessionID), 0);
    return `
      <div class="dl-page" id="dlPage">
        <div class="dl-box">
          <h2>Processing your payment&#8230;</h2>
          <p>Retrieving your license key, please wait&#8230;</p>
        </div>
      </div>`;
  }

  if (!key) {
    return `
      <div class="dl-page" id="dlPage">
        <div class="dl-box">
          <h2>No License Key Found</h2>
          <p>Enter your license key in the Phantom app Settings page to activate.</p>
          <div style="margin-top:1.5rem;display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
            <a href="#pricing" class="btn btn-primary">Get a License</a>
            <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Need Help?</a>
          </div>
        </div>
      </div>`;
  }

  const planLabel = plan === 'phantom' ? 'Phantom' : plan === 'pro' ? 'Pro' : 'Free';
  const planColor = plan === 'phantom' ? '#a855f7' : plan === 'pro' ? '#a855f7' : '#6b7280';

  return `
    <div class="dl-page" id="dlPage">
      <div class="dl-box" style="max-width:560px">
        <div class="dl-check"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
        <h1>License Key</h1>
        <p>Copy this key and paste it in the Phantom app under <strong>Settings > License Key</strong>.</p>
        <div style="margin:1.5rem 0;padding:1rem 1.5rem;background:var(--bg);border:1px solid var(--border);border-radius:12px;display:flex;align-items:center;gap:1rem">
          <div style="flex:1;font-family:'JetBrains Mono',monospace;font-size:1.1rem;font-weight:600;letter-spacing:0.05em;word-break:break-all;color:var(--text)" id="licenseKeyValue">${key}</div>
          <button onclick="copyLicenseKey()" id="copyKeyBtn" style="padding:0.5rem 1rem;background:var(--green);color:#000;border:none;border-radius:8px;font-weight:700;font-size:0.8rem;cursor:pointer;white-space:nowrap">Copy Key</button>
        </div>
        <div style="margin:1.5rem 0;padding:1rem 1.25rem;background:rgba(88,101,242,0.08);border:1px solid #5865f2;border-radius:12px;text-align:left">
          <div style="font-weight:800;font-size:0.9rem;color:#5865f2;margin-bottom:0.5rem;letter-spacing:0.03em">&#9889; ACTIVATE YOUR LICENSE ON DISCORD</div>
          <ol style="text-align:left;font-size:0.85rem;color:var(--text-dim);line-height:2;padding-left:1.25rem;margin:0">
            <li>Join our <a href="${DISCORD_INVITE}" target="_blank" style="color:#5865f2;font-weight:700">Discord server</a></li>
            <li>Open the <strong style="color:var(--text)">&#7547;&#7511;&#638;&#115;</strong> channel</li>
            <li>Create a <strong style="color:var(--text)">ticket</strong></li>
            <li>Type <code style="background:var(--bg);padding:0.15rem 0.5rem;border-radius:6px;font-family:'JetBrains Mono',monospace;color:var(--text)">/redeem</code> and paste your license key above</li>
          </ol>
        </div>
        <div style="margin-bottom:1rem;padding:0.75rem 1rem;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-size:0.85rem">
          <span style="opacity:0.6">Plan:</span> <strong style="color:${planColor}">${planLabel}</strong>
          <span style="margin-left:1rem;opacity:0.6">Status:</span> <strong style="color:var(--green)">Active</strong>
        </div>
        <div style="margin-top:1.5rem">
          <h3 style="font-size:1rem;margin-bottom:0.75rem">How to Activate</h3>
          <ol style="text-align:left;font-size:0.85rem;color:var(--text-dim);line-height:2;padding-left:1.5rem">
            <li>Download and install the Phantom app</li>
            <li>Open Phantom and go to <strong>Settings</strong></li>
            <li>Paste your license key in the <strong>License Key</strong> field</li>
            <li>Click <strong>Activate</strong> â€” you're done!</li>
          </ol>
        </div>
        <div class="dl-alt" style="margin-top:1.5rem">
          Need help? <a href="${DISCORD_INVITE}" target="_blank">Join our Discord</a>
        </div>
        <div style="margin-top:1rem">
          <a href="#" class="btn btn-secondary" style="font-size:0.8rem">Back to Home</a>
        </div>
      </div>
    </div>`;
}

function fetchLicenseFromSession(sessionID) {
  fetch('https://choatix-license-system.onrender.com/api/checkout/capture-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionID: sessionID })
  })
    .then(r => r.json())
    .then(d => {
      if (d && d.licenseKey) {
        // Swap the hash to key= form so the page renders the license (and refreshes don't re-capture)
        location.hash = '#license?key=' + encodeURIComponent(d.licenseKey) + '&plan=' + encodeURIComponent(d.plan || '');
      } else {
        const box = document.querySelector('#dlPage .dl-box');
        if (box) {
          box.innerHTML = `
            <h2>Payment not confirmed yet</h2>
            <p>Your payment is still processing. If you paid successfully, your license key will be available shortly \u2014 try refreshing this page in a moment.</p>
            <div style="margin-top:1.5rem;display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
              <a href="javascript:location.reload()" class="btn btn-primary">Retry</a>
              <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Need Help?</a>
            </div>`;
        }
      }
    })
    .catch(() => {
      const box = document.querySelector('#dlPage .dl-box');
      if (box) {
        box.innerHTML = `
          <h2>Something went wrong</h2>
          <p>We couldn't retrieve your license key. Please try again or contact support.</p>
          <div style="margin-top:1.5rem;display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap">
            <a href="javascript:location.reload()" class="btn btn-primary">Retry</a>
            <a href="${DISCORD_INVITE}" class="btn btn-discord" target="_blank">Need Help?</a>
          </div>`;
      }
    });
}

function copyLicenseKey() {
  const el = document.getElementById('licenseKeyValue');
  const btn = document.getElementById('copyKeyBtn');
  if (el) {
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy Key', 2000); }
    }).catch(() => {});
  }
}

// â”€â”€ EFFECTS â”€â”€


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
    if (img) fetch(`${SITE_API}/api/team/${m.id}`).then(r => r.json()).then(d => { if (d.avatar) img.src = d.avatar; }).catch(() => {});
  });
}

function initPageEffects() {
  setTimeout(() => initScrollEffects(), 10);
}

// â”€â”€ INIT â”€â”€

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

