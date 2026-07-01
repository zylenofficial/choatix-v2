const { BrowserWindow } = require('electron');
const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://choatix-v2.onrender.com';
const REDIRECT_URI = 'http://localhost:3001/api/auth/discord/callback';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.licenseCache = null;
    this.cacheExpiry = 0;
    this.CACHE_TTL = 5 * 60 * 1000;
  }

  async login(mainWindow) {
    try {
      const urlRes = await this._apiGet('/api/auth/discord/url');
      if (!urlRes.url) throw new Error('Failed to get Discord auth URL');

      const authWindow = new BrowserWindow({
        width: 500,
        height: 700,
        parent: mainWindow,
        modal: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
        title: 'Login with Discord',
        autoHideMenuBar: true,
      });

      return new Promise((resolve, reject) => {
        let resolved = false;

        authWindow.webContents.on('will-navigate', (event, url) => {
          if (url.startsWith(REDIRECT_URI) || url.includes('auth=success')) {
            resolved = true;
            authWindow.close();
            const parsed = new URL(url);
            const discordId = parsed.searchParams.get('discordId');
            const username = parsed.searchParams.get('username');
            if (discordId) {
              this._fetchLicense(discordId).then(license => {
                this.currentUser = { discordId, username };
                this.licenseCache = license;
                this.cacheExpiry = Date.now() + this.CACHE_TTL;
                resolve({ success: true, discordId, username, license });
              }).catch(err => {
                resolve({ success: true, discordId, username, license: { tier: 'FREE', expires: null, active: true } });
              });
            } else {
              reject(new Error('No Discord ID in callback'));
            }
          }
        });

        authWindow.webContents.on('did-navigate', (event, url) => {
          if (resolved) return;
          if (url.startsWith(REDIRECT_URI) || url.includes('auth=success')) {
            resolved = true;
            authWindow.close();
            const parsed = new URL(url);
            const discordId = parsed.searchParams.get('discordId');
            const username = parsed.searchParams.get('username');
            if (discordId) {
              this._fetchLicense(discordId).then(license => {
                this.currentUser = { discordId, username };
                this.licenseCache = license;
                this.cacheExpiry = Date.now() + this.CACHE_TTL;
                resolve({ success: true, discordId, username, license });
              }).catch(err => {
                resolve({ success: true, discordId, username, license: { tier: 'FREE', expires: null, active: true } });
              });
            } else {
              reject(new Error('No Discord ID in callback'));
            }
          }
        });

        authWindow.on('closed', () => {
          if (!resolved) reject(new Error('Auth window closed'));
        });

        authWindow.loadURL(urlRes.url);
      });
    } catch (err) {
      console.error('[Auth] Login failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  async logout(discordId) {
    try {
      await this._apiPost('/api/auth/discord/logout', { discordId });
    } catch {}
    this.currentUser = null;
    this.licenseCache = null;
    this.cacheExpiry = 0;
    return { success: true };
  }

  async getLicense(discordId, forceRefresh = false) {
    if (!forceRefresh && this.licenseCache && this.currentUser?.discordId === discordId && Date.now() < this.cacheExpiry) {
      return this.licenseCache;
    }
    try {
      const license = await this._fetchLicense(discordId);
      this.licenseCache = license;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      return license;
    } catch {
      return this.licenseCache || { tier: 'FREE', expires: null, active: true };
    }
  }

  async _fetchLicense(discordId) {
    const data = await this._apiGet(`/api/license/${discordId}`);
    return {
      tier: data.plan || data.tier || 'FREE',
      expires: data.expires || null,
      active: data.active !== false,
    };
  }

  _apiGet(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BACKEND_URL);
      const lib = url.protocol === 'https:' ? https : http;
      const req = lib.get(url.href, (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid JSON')); }
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
  }

  _apiPost(path, body) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BACKEND_URL);
      const lib = url.protocol === 'https:' ? https : http;
      const payload = JSON.stringify(body);
      const req = lib.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      }, (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { reject(new Error('Invalid JSON')); }
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
      req.write(payload);
      req.end();
    });
  }
}

module.exports = new AuthService();
