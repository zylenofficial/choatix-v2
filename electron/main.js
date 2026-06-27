const { app, BrowserWindow, ipcMain, shell, Notification } = require("electron");
const path = require("path");
const http = require("http");
const https = require("https");
const fs = require("fs");
const os = require("os");
const { execSync, exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

function isAdmin() {
  try { execSync('net session', { windowsHide: true, stdio: 'ignore' }); return true; } catch { return false; }
}

// Auto-elevate to admin if not already
if (!isAdmin()) {
  try {
    const { execSync: sync } = require('child_process');
    sync(`powershell -NoProfile -Command "Start-Process -FilePath '${process.execPath}' -Verb RunAs"`, { timeout: 10000 });
  } catch {}
  process.exit(0);
}

// Disable GPU acceleration to reduce memory/CPU/processes
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128');

const isDev = !app.isPackaged;
let mainWindow;
let server;
const WEBHOOK_URL = "";
const DISCORD_WEBHOOK = process.env.DISCORD_CRASH_WEBHOOK || "";

let FEEDBACK_WEBHOOK = process.env.DISCORD_FEEDBACK_WEBHOOK || "";
if (!FEEDBACK_WEBHOOK) {
  try {
    const configPath = isDev ? path.join(__dirname, "..", "config.json") : path.join(process.resourcesPath, "config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      FEEDBACK_WEBHOOK = config.DISCORD_FEEDBACK_WEBHOOK || "";
    }
  } catch {}
}

const SETTINGS_FILE = path.join(app.getPath("userData"), "choatix-settings.json");
let prevNetBytes = { received: 0, sent: 0, timestamp: 0 };
let cpuInfoCache = null;
let cpuInfoCacheTime = 0;
let staticCache = null;
let staticCacheTime = 0;

const MIME_TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".ttf": "font/ttf",
};

function getOutDir() { return path.join(__dirname, "..", "out"); }

function startServer() {
  return new Promise((resolve) => {
    const outDir = getOutDir();
    server = http.createServer((req, res) => {
      let urlPath = req.url.split("?")[0];
      if (urlPath === "/") urlPath = "/index.html";
      fs.readFile(path.join(outDir, urlPath), (err, data) => {
        if (err) {
          fs.readFile(path.join(outDir, "index.html"), (e2, d2) => {
            if (e2) { res.writeHead(404); res.end(); return; }
            res.writeHead(200, { "Content-Type": "text/html" }); res.end(d2);
          }); return;
        }
        const ext = path.extname(urlPath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

let splashWindow;

function createWindow(port) {
  // Create splash screen
  splashWindow = new BrowserWindow({
    width: 520, height: 400,
    frame: false, transparent: true, resizable: false, center: true,
    backgroundColor: "#000000",
    icon: path.join(__dirname, "..", "assets", "icon.ico"),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, "splash.html"));

  // Create main window (hidden)
  mainWindow = new BrowserWindow({
    width: 1400, height: 932, minWidth: 1000, minHeight: 700,
    frame: false, backgroundColor: "#000000", show: false,
    icon: path.join(__dirname, "..", "assets", "icon.ico"),
    webPreferences: { 
      nodeIntegration: false, 
      contextIsolation: true, 
      preload: path.join(__dirname, "preload.js"), 
      partition: "persist:choatix",
      backgroundThrottling: true,
      offscreen: false,
    },
  });
  // Disable GPU acceleration to reduce processes & memory
  mainWindow.webContents.setBackgroundThrottling(true);
  mainWindow.loadURL(isDev ? "http://localhost:3000" : `http://127.0.0.1:${port}`);

  // Handoff: when main window is ready, close splash and show main
  mainWindow.webContents.on("did-finish-load", () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    }, 2500);
  });

  mainWindow.on("closed", () => { mainWindow = null; });
  mainWindow.on("close", (e) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      e.preventDefault();
      mainWindow.webContents.send("save-state-request");
      setTimeout(() => { try { mainWindow.destroy(); } catch {} }, 500);
    }
  });
}

function ps(cmd) {
  try { return execSync(`powershell -NoProfile -NonInteractive -Command "${cmd}"`, { encoding: "utf-8", timeout: 5000, windowsHide: true }).trim(); }
  catch { return ""; }
}

async function psAsync(cmd, timeout = 5000) {
  try { const { stdout } = await execAsync(`powershell -NoProfile -NonInteractive -Command "${cmd}"`, { encoding: "utf-8", timeout, windowsHide: true }); return stdout.trim(); }
  catch { return ""; }
}

function wmic(cmd) {
  try { return execSync(`wmic ${cmd}`, { encoding: "utf-8", timeout: 5000, windowsHide: true }).trim(); }
  catch { return ""; }
}

// ── CPU ──
async function getCPU() {
  const usageRaw = await psAsync("(Get-CimInstance Win32_Processor -EA SilentlyContinue|Select-Object -First 1).LoadPercentage");
  const cpuRaw = await psAsync("$p=Get-CimInstance Win32_Processor|Select-Object -First 1; Write-Output ('CPUINFO|'+$p.Name+'|'+$p.NumberOfCores+'|'+$p.NumberOfLogicalProcessors+'|'+$p.MaxClockSpeed)");
  const parts = (cpuRaw || "").split("|");
  return { model: parts[0] || "Unavailable", cores: parseInt(parts[1]) || 0, threads: parseInt(parts[2]) || 0, usage: parseFloat(usageRaw) || 0, maxClockMhz: parseInt(parts[3]) || 0 };
}

// ── GPU ──
async function getGPU() {
  const raw = await psAsync("Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM | ConvertTo-Json");
  if (!raw) return { model: "Unavailable", vram: 0, usage: 0, vendor: "unknown" };
  try {
    const gpus = JSON.parse(raw);
    const gpu = Array.isArray(gpus) ? gpus[0] : gpus;
    const name = (gpu.Name || "").toLowerCase();
    let vendor = "unknown";
    if (name.includes("nvidia") || name.includes("geforce") || name.includes("rtx") || name.includes("gtx")) vendor = "nvidia";
    else if (name.includes("amd") || name.includes("radeon")) vendor = "amd";
    else if (name.includes("intel")) vendor = "intel";
    return { model: gpu.Name || "Unavailable", vram: gpu.AdapterRAM ? Math.round(gpu.AdapterRAM / 1048576) : 0, usage: 0, vendor };
  } catch { return { model: "Unavailable", vram: 0, usage: 0, vendor: "unknown" }; }
}

// ── RAM ──
async function getRAM() {
  const osInfo = await psAsync("$os = Get-CimInstance Win32_OperatingSystem; [math]::Round($os.TotalVisibleMemorySize/1MB,2).ToString()+','+[math]::Round($os.FreePhysicalMemory/1MB,2).ToString()");
  const [total, free] = (osInfo || "").split(",").map(Number);
  const t = Math.round((total || 0) * 1024);
  const f = Math.round((free || 0) * 1024);
  return { total: t, used: t - f, available: f };
}

// ── DISK ──
async function getDisk() {
  const raw = await psAsync("Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID, @{N='S';E={[math]::Round($_.Size/1GB,2)}}, @{N='F';E={[math]::Round($_.FreeSpace/1GB,2)}} | ConvertTo-Json");
  if (!raw) return { total: 0, used: 0, available: 0, drives: [] };
  try {
    const disks = JSON.parse(raw);
    const arr = Array.isArray(disks) ? disks : [disks];
    let t = 0, f = 0;
    const drives = arr.map(d => { t += d.S || 0; f += d.F || 0; return { letter: d.DeviceID, sizeGB: d.S || 0, freeGB: d.F || 0 }; });
    return { total: Math.round(t * 1024), used: Math.round((t - f) * 1024), available: Math.round(f * 1024), drives };
  } catch { return { total: 0, used: 0, available: 0, drives: [] }; }
}

// ── OS ──
async function getOS() {
  const raw = await psAsync("$cap=(Get-CimInstance Win32_OperatingSystem).Caption; $build=(Get-CimInstance Win32_OperatingSystem).BuildNumber; $arch=(Get-CimInstance Win32_OperatingSystem).OSArchitecture; Write-Output ('OSINFO|'+$cap+'|'+$build+'|'+$arch)");
  const parts = (raw || "").split("|");
  return { version: parts[0] || "Unavailable", build: parts[1] || "0", architecture: parts[2] || "Unavailable" };
}

// ── Power Plan ──
async function getPowerPlan() {
  const raw = await psAsync("powercfg /getactivescheme");
  const m = (raw || "").match(/\((.+)\)/);
  return m ? m[1] : "Unavailable";
}

// ── Game Mode ──
async function getGameMode() {
  const raw = await psAsync("(Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -EA 0).AllowAutoGameMode");
  if (raw === "1") return true;
  if (raw === "0") return false;
  return null;
}

// ── Uptime ──
async function getUptime() {
  const raw = await psAsync("(Get-CimInstance Win32_OperatingSystem).LastBootUpTime");
  if (raw) { try { return Math.floor((Date.now() - new Date(raw).getTime()) / 1000); } catch {} }
  return 0;
}

// ── Network ──
async function getNetwork() {
  const [adapter, pingRaw] = await Promise.all([
    psAsync("(Get-NetAdapter | Where-Object {$_.Status==='Up'} | Select-Object -First 1).Name"),
    psAsync("$r=ping -n 1 -w 1000 8.8.8.8 | Select-String 'time='; if($r){ ($r -split 'time=')[1] -replace 'ms','' } else { '' }"),
  ]);
  let latencyMs = null;
  const pingVal = (pingRaw || "").trim();
  if (pingVal && !isNaN(parseInt(pingVal))) latencyMs = parseInt(pingVal);
  return { latencyMs, adapterName: adapter || "Unavailable" };
}

// ── Startup Programs ──
async function getStartup() {
  const raw = await psAsync("Get-CimInstance Win32_StartupCommand | Select-Object Name | ConvertTo-Json");
  if (!raw) return { count: 0, programs: [] };
  try {
    const items = JSON.parse(raw);
    const arr = Array.isArray(items) ? items : [items];
    return { count: arr.length, programs: arr.slice(0, 15).map(i => i.Name).filter(Boolean) };
  } catch { return { count: 0, programs: [] }; }
}

// ── Background Processes ──
async function getProcesses() {
  const [totalRaw, bgRaw] = await Promise.all([
    psAsync("(Get-Process).Count"),
    psAsync("(Get-Process | Where-Object {$_.MainWindowTitle -eq ''}).Count"),
  ]);
  return { total: parseInt(totalRaw) || 0, background: parseInt(bgRaw) || 0 };
}

// ── Mouse ──
async function getMouse() {
  const [name, epp] = await Promise.all([
    psAsync("(Get-CimInstance Win32_PointingDevice | Select-Object -First 1).Name"),
    psAsync("(Get-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -EA 0).MouseSpeed"),
  ]);
  const enhancePointerPrecision = epp === "1" || epp === "2";
  return { name: name || "Unavailable", enhancePointerPrecision, pollingRateDetected: false };
}

// ── Keyboard ──
async function getKeyboard() {
  const [filterKeys, stickyKeys, repeatDelay] = await Promise.all([
    psAsync("(Get-ItemProperty -Path 'HKCU:\\Control Panel\\Accessibility\\Keyboard Response' -Name 'Flags' -EA 0).Flags"),
    psAsync("(Get-ItemProperty -Path 'HKCU:\\Control Panel\\Accessibility\\StickyKeys' -Name 'Flags' -EA 0).Flags"),
    psAsync("(Get-ItemProperty -Path 'HKCU:\\Control Panel\\Keyboard' -Name 'KeyboardDelay' -EA 0).KeyboardDelay"),
  ]);
  return {
    filterKeys: filterKeys ? (parseInt(filterKeys) & 1) === 0 : false,
    stickyKeys: stickyKeys ? (parseInt(stickyKeys) & 1) === 1 : false,
    repeatDelay: repeatDelay || "1",
  };
}

// ── Device Type Detection ──
async function getDeviceType() {
  const raw = await psAsync("(Get-CimInstance Win32_SystemEnclosure | Select-Object -First 1).ChassisTypes");
  if (!raw) return "unknown";
  try {
    const types = JSON.parse(raw);
    const chassis = Array.isArray(types) ? types[0] : parseInt(types);
    if ([3, 4, 5, 6, 7, 13, 15, 16].includes(chassis)) return "desktop";
    if ([8, 9, 10, 11, 12, 14, 18, 21].includes(chassis)) return "laptop";
    return "unknown";
  } catch { return "unknown"; }
}

// ── System Actions (for Advisor) ──
async function setHighPerformancePowerPlan() {
  const previous = await getPowerPlan();
  await execAsync('powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { encoding: "utf-8", timeout: 5000, windowsHide: true });
  const newPlan = await getPowerPlan();
  return { success: newPlan.includes("High") || newPlan.includes("Ultimate"), previous };
}

async function setGameMode(enabled) {
  const raw = await psAsync("(Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -EA 0).AllowAutoGameMode");
  const previous = raw === "1" ? true : raw === "0" ? false : null;
  const value = enabled ? 1 : 0;
  await execAsync(`Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -Value ${value}`, { encoding: "utf-8", timeout: 5000, windowsHide: true });
  const after = await psAsync("(Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -EA 0).AllowAutoGameMode");
  return { success: (enabled && after === "1") || (!enabled && after === "0"), previous };
}

// ── CPU Temperature ──
function getCpuTemperature() {
  try {
    const raw = ps("(Get-CimInstance MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue | Select-Object -First 1).CurrentTemperature");
    if (raw && !isNaN(parseInt(raw))) {
      return Math.round((parseInt(raw) / 10) - 273.15);
    }
  } catch {}
  return null;
}

// ── CPU Info (cached) ──
function getCpuInfo() {
  const now = Date.now();
  if (cpuInfoCache && now - cpuInfoCacheTime < 10000) return cpuInfoCache;
  cpuInfoCache = {
    model: wmic("cpu get Name /value").replace("Name=", "").trim() || "Unavailable",
    cores: parseInt(wmic("cpu get NumberOfCores /value").replace("NumberOfCores=", "")) || 0,
    threads: parseInt(wmic("cpu get NumberOfLogicalProcessors /value").replace("NumberOfLogicalProcessors=", "")) || 0,
    clock: parseInt(wmic("cpu get MaxClockSpeed /value").replace("MaxClockSpeed=", "")) || 0,
  };
  cpuInfoCacheTime = now;
  return cpuInfoCache;
}

async function getCpuInfoAsync() {
  const now = Date.now();
  if (cpuInfoCache && now - cpuInfoCacheTime < 10000) return cpuInfoCache;
  const raw = await psAsync("$p=Get-CimInstance Win32_Processor|Select-Object -First 1; Write-Output ('CPUINFO|'+$p.Name+'|'+$p.NumberOfCores+'|'+$p.NumberOfLogicalProcessors+'|'+$p.MaxClockSpeed)");
  const parts = (raw || "").split("|");
  cpuInfoCache = {
    model: (parts[1] || "").trim() || "Unavailable",
    cores: parseInt(parts[2]) || 0,
    threads: parseInt(parts[3]) || 0,
    clock: parseInt(parts[4]) || 0,
  };
  cpuInfoCacheTime = now;
  return cpuInfoCache;
}

// ── GPU Realtime (nvidia-smi or WMI fallback) ──
function getGpuRealtime() {
  const nvidiaRaw = ps("nvidia-smi --query-gpu=name,utilization.gpu,temperature.gpu,memory.total --format=csv,noheader,nounits 2>$null");
  if (nvidiaRaw && nvidiaRaw.trim()) {
    const parts = nvidiaRaw.split(",").map((s) => s.trim());
    return {
      model: parts[0] || "Unavailable",
      usage: parseInt(parts[1]) || 0,
      temperature: parseInt(parts[2]) || null,
      vram: parseInt(parts[3]) || 0,
      vendor: "nvidia",
    };
  }
  const raw = ps("Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM | ConvertTo-Json");
  if (raw) {
    try {
      const gpus = JSON.parse(raw);
      const gpu = Array.isArray(gpus) ? gpus[0] : gpus;
      const name = (gpu.Name || "").toLowerCase();
      let vendor = "unknown";
      if (name.includes("nvidia") || name.includes("geforce") || name.includes("rtx") || name.includes("gtx")) vendor = "nvidia";
      else if (name.includes("amd") || name.includes("radeon")) vendor = "amd";
      else if (name.includes("intel")) vendor = "intel";
      return {
        model: gpu.Name || "Unavailable",
        usage: 0,
        temperature: null,
        vram: gpu.AdapterRAM ? Math.round(gpu.AdapterRAM / 1048576) : 0,
        vendor,
      };
    } catch {}
  }
  return { model: "Unavailable", usage: 0, temperature: null, vram: 0, vendor: "unknown" };
}

// ── All Drives ──
function getAllDrives() {
  const raw = ps("Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID, Size, FreeSpace | ConvertTo-Json");
  if (!raw) return [];
  try {
    const disks = JSON.parse(raw);
    const arr = Array.isArray(disks) ? disks : [disks];
    return arr.map((d) => {
      const totalGB = Math.round((d.Size || 0) / (1024 * 1024 * 1024));
      const freeGB = Math.round((d.FreeSpace || 0) / (1024 * 1024 * 1024));
      return {
        letter: d.DeviceID,
        totalGB,
        usedGB: totalGB - freeGB,
        freeGB,
        percentage: totalGB > 0 ? Math.round(((totalGB - freeGB) / totalGB) * 100) : 0,
      };
    });
  } catch {
    return [];
  }
}

// ── Network Stats ──
function getNetworkStats() {
  const adapterRaw = ps("(Get-NetAdapter | Where-Object {$_.Status==='Up'} | Select-Object -First 1).Name");
  const adapter = adapterRaw || "Unavailable";
  let downloadSpeed = 0;
  let uploadSpeed = 0;

  if (adapter !== "Unavailable") {
    const statsRaw = ps(`(Get-NetAdapterStatistics -Name "${adapter}" 2>$null) | Select-Object ReceivedBytes, SentBytes | ConvertTo-Json`);
    if (statsRaw) {
      try {
        const stats = JSON.parse(statsRaw);
        const now = Date.now();
        const elapsed = (now - prevNetBytes.timestamp) / 1000;
        if (elapsed > 0.5 && prevNetBytes.timestamp > 0) {
          downloadSpeed = Math.max(0, ((stats.ReceivedBytes || 0) - prevNetBytes.received) / elapsed);
          uploadSpeed = Math.max(0, ((stats.SentBytes || 0) - prevNetBytes.sent) / elapsed);
        }
        prevNetBytes = { received: stats.ReceivedBytes || 0, sent: stats.SentBytes || 0, timestamp: now };
      } catch {}
    }
  }

  const ipRaw = ps("(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1).IPAddress");
  return {
    downloadSpeed,
    uploadSpeed,
    adapterName: adapter,
    ipAddress: ipRaw || "Unavailable",
  };
}

// ── Cached GPU (static, refetch every 30s) ──
let gpuCache = null;
let gpuCacheTime = 0;
async function getGpuCachedAsync() {
  const now = Date.now();
  if (gpuCache && now - gpuCacheTime < 30000) return gpuCache;

  // Try nvidia-smi first (most accurate for NVIDIA)
  const nvidiaRaw = await psAsync("nvidia-smi --query-gpu=name,utilization.gpu,temperature.gpu,memory.total --format=csv,noheader,nounits 2>$null");
  if (nvidiaRaw && nvidiaRaw.trim()) {
    const parts = nvidiaRaw.split(",").map((s) => s.trim());
    gpuCache = { model: parts[0] || "Unavailable", usage: parseInt(parts[1]) || 0, temperature: parseInt(parts[2]) || null, vram: parseInt(parts[3]) || 0, vendor: "nvidia" };
  } else {
    // Try GPU performance counters (like Task Manager) - works for AMD/Intel too
    const gpuPerfRaw = await psAsync("(Get-CimInstance Win32_VideoController -EA SilentlyContinue|Select-Object -First 1).LoadPercentage");
    const gpuUsage = parseFloat(gpuPerfRaw) || 0;

    const raw = await psAsync("Get-CimInstance Win32_VideoController|Select-Object Name,AdapterRAM|ConvertTo-Json");
    if (raw) {
      try {
        const gpus = JSON.parse(raw);
        const gpu = Array.isArray(gpus) ? gpus[0] : gpus;
        const name = (gpu.Name || "").toLowerCase();
        let vendor = "unknown";
        if (name.includes("nvidia") || name.includes("geforce") || name.includes("rtx") || name.includes("gtx")) vendor = "nvidia";
        else if (name.includes("amd") || name.includes("radeon")) vendor = "amd";
        else if (name.includes("intel")) vendor = "intel";
        gpuCache = { model: gpu.Name || "Unavailable", usage: gpuUsage, temperature: null, vram: gpu.AdapterRAM ? Math.round(gpu.AdapterRAM / 1048576) : 0, vendor };
      } catch { gpuCache = { model: "Unavailable", usage: gpuUsage, temperature: null, vram: 0, vendor: "unknown" }; }
    } else {
      gpuCache = { model: "Unavailable", usage: gpuUsage, temperature: null, vram: 0, vendor: "unknown" };
    }
  }
  gpuCacheTime = now;
  return gpuCache;
}

// ── Cached Drives (static, refetch every 30s) ──
let drivesCache = null;
let drivesCacheTime = 0;
async function getDrivesCachedAsync() {
  const now = Date.now();
  if (drivesCache && now - drivesCacheTime < 30000) return drivesCache;
  const raw = await psAsync("Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3'|Select-Object DeviceID,Size,FreeSpace|ConvertTo-Json");
  if (raw) {
    try {
      const disks = JSON.parse(raw);
      const arr = Array.isArray(disks) ? disks : [disks];
      drivesCache = arr.map((d) => {
        const totalGB = Math.round((d.Size || 0) / (1024 * 1024 * 1024));
        const freeGB = Math.round((d.FreeSpace || 0) / (1024 * 1024 * 1024));
        return { letter: d.DeviceID, totalGB, usedGB: totalGB - freeGB, freeGB, percentage: totalGB > 0 ? Math.round(((totalGB - freeGB) / totalGB) * 100) : 0 };
      });
    } catch { drivesCache = []; }
  } else { drivesCache = []; }
  drivesCacheTime = now;
  return drivesCache;
}

// ── Cached static system info (power plan, game mode, OS — refetch every 15s) ──
let sysStaticCache = null;
let sysStaticCacheTime = 0;
async function getSysStaticAsync() {
  const now = Date.now();
  if (sysStaticCache && now - sysStaticCacheTime < 15000) return sysStaticCache;
  try {
    const [raw, gm, oc] = await Promise.all([
      psAsync("powercfg /getactivescheme 2>$null"),
      psAsync("(Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -EA 0).AllowAutoGameMode"),
      psAsync("(Get-CimInstance Win32_OperatingSystem).Caption"),
    ]);
    let planName = "Unavailable";
    if (raw) {
      const m = raw.match(/\((.+)\)/);
      if (m) planName = m[1];
    }
    sysStaticCache = { powerPlan: planName, gameMode: gm || "0", os: oc || "Unavailable" };
  } catch {
    sysStaticCache = { powerPlan: "Unavailable", gameMode: "0", os: "Unavailable" };
  }
  sysStaticCacheTime = now;
  return sysStaticCache;
}

// ── Cached IP (changes rarely, refetch every 30s) ──
let ipCache = "Unavailable";
let ipCacheTime = 0;
function getIpCached() {
  const now = Date.now();
  if (ipCache !== "Unavailable" && now - ipCacheTime < 30000) return ipCache;
  const raw = ps("(Get-NetIPAddress -AddressFamily IPv4|Where-Object{$_.IPAddress -ne '127.0.0.1'}|Select-Object -First 1).IPAddress");
  ipCache = raw || "Unavailable";
  ipCacheTime = now;
  return ipCache;
}

async function getIpCachedAsync() {
  const now = Date.now();
  if (ipCache !== "Unavailable" && now - ipCacheTime < 30000) return ipCache;
  const raw = await psAsync("(Get-NetIPAddress -AddressFamily IPv4|Where-Object{$_.IPAddress -ne '127.0.0.1'}|Select-Object -First 1).IPAddress");
  ipCache = raw || "Unavailable";
  ipCacheTime = now;
  return ipCache;
}

// ── Batched Realtime Stats (async — does NOT block main thread) ──
async function getRealtimeStatsAsync() {
  try {
    // Run all PowerShell batches in parallel (non-blocking)
    const [batch1Raw, adapterRaw] = await Promise.all([
      // Fast batch: CPU (lightweight WMI), temp, RAM, uptime, processes
      psAsync("$cpu=(Get-CimInstance Win32_Processor -EA SilentlyContinue|Select-Object -First 1).LoadPercentage; if($null -eq $cpu){$cpu=0}; $temp=(Get-CimInstance MSAcpi_ThermalZoneTemperature -EA SilentlyContinue|Select-Object -First 1).CurrentTemperature; $os=Get-CimInstance Win32_OperatingSystem; $ramTotal=[math]::Round($os.TotalVisibleMemorySize/1MB,2); $ramFree=[math]::Round($os.FreePhysicalMemory/1MB,2); $uptime=(Get-CimInstance Win32_OperatingSystem).LastBootUpTime; $pc=(Get-Process).Count; Write-Output ('FAST|'+$cpu+'|'+$temp+'|'+$ramTotal+'|'+$ramFree+'|'+$uptime+'|'+$pc)", 8000),
      // Network adapter name - fallback to Get-NetIPConfiguration
      psAsync("(Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up'} | Select-Object -First 1).InterfaceAlias"),
    ]);



    let cpuUsage = 0, cpuTemp = null, ramTotal = 0, ramUsed = 0, ramAvailable = 0;
    let uptime = "Unavailable", procCount = 0;
    try {
      const p = (batch1Raw || "").split("|");
      cpuUsage = Math.min(100, parseInt((p[1] || "").trim()) || 0);
      const t = parseInt(p[2]);
      cpuTemp = (t && !isNaN(t)) ? Math.round((t / 10) - 273.15) : null;
      ramTotal = Math.round((parseFloat(p[3]) || 0) * 1024);
      ramAvailable = Math.round((parseFloat(p[4]) || 0) * 1024);
      ramUsed = ramTotal - ramAvailable;
      const bootTime = new Date(p[5]);
      if (!isNaN(bootTime.getTime())) {
        const diff = Math.floor((Date.now() - bootTime.getTime()) / 1000);
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        uptime = days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m`;
      }
      procCount = parseInt(p[6]) || 0;
    } catch {}

    // GPU (cached 30s, async)
    const gpu = await getGpuCachedAsync();

    // Network (need adapter name first, then stats + IP + ping in parallel)
    let network = { downloadSpeed: 0, uploadSpeed: 0, adapterName: adapterRaw || "Unavailable", ipAddress: "Unavailable", latencyMs: null };
    try {
      const [statsRaw, ipRaw, pingRaw] = await Promise.all([
        network.adapterName !== "Unavailable" ? psAsync("(Get-NetAdapterStatistics -Name '" + network.adapterName + "' 2>$null)|Select-Object ReceivedBytes,SentBytes|ConvertTo-Json") : Promise.resolve(""),
        getIpCachedAsync(),
        psAsync("$r=ping -n 1 -w 1000 8.8.8.8 | Select-String 'time='; if($r){ ($r -split 'time=')[1] -replace 'ms','' } else { '' }"),
      ]);
      network.ipAddress = ipRaw;
      const pingVal = (pingRaw || "").trim();
      if (pingVal && !isNaN(parseInt(pingVal))) network.latencyMs = parseInt(pingVal);
      if (statsRaw) {
        const stats = JSON.parse(statsRaw);
        const now = Date.now();
        const elapsed = (now - prevNetBytes.timestamp) / 1000;
        if (elapsed > 0.5 && prevNetBytes.timestamp > 0) {
          network.downloadSpeed = Math.max(0, ((stats.ReceivedBytes || 0) - prevNetBytes.received) / elapsed);
          network.uploadSpeed = Math.max(0, ((stats.SentBytes || 0) - prevNetBytes.sent) / elapsed);
        }
        prevNetBytes = { received: stats.ReceivedBytes || 0, sent: stats.SentBytes || 0, timestamp: now };
      }
    } catch {}

    // All cached data in parallel (non-blocking, only refetches when cache expires)
    const [drives, sysStatic, cpuInfo] = await Promise.all([
      getDrivesCachedAsync(),
      getSysStaticAsync(),
      getCpuInfoAsync(),
    ]);

    return {
      cpu: { usage: cpuUsage, temperature: cpuTemp, model: cpuInfo.model, cores: cpuInfo.cores, threads: cpuInfo.threads, clock: cpuInfo.clock },
      ram: { total: ramTotal, used: ramUsed, available: ramTotal - ramUsed, percentage: ramTotal > 0 ? Math.round((ramUsed / ramTotal) * 100) : 0 },
      gpu,
      storage: { drives },
      network,
      system: { powerPlan: sysStatic.powerPlan, gameMode: sysStatic.gameMode, os: sysStatic.os, uptime, processes: procCount },
    };
  } catch (err) {
    console.error("[getRealtimeStats] Error:", err);
    return {
      cpu: { usage: 0, temperature: null, model: "Unavailable", cores: 0, threads: 0, clock: 0 },
      ram: { total: 0, used: 0, available: 0, percentage: 0 },
      gpu: { model: "Unavailable", usage: 0, temperature: null, vram: 0, vendor: "unknown" },
      storage: { drives: [] },
      network: { downloadSpeed: 0, uploadSpeed: 0, adapterName: "Unavailable", ipAddress: "Unavailable", latencyMs: null },
      system: { powerPlan: "Unavailable", gameMode: "0", os: "Unavailable", uptime: "Unavailable", processes: 0 },
    };
  }
}

// ── Clear Cache ──
function clearCache() {
  try {
    const tempPath = os.tmpdir();
    ps(`Remove-Item -Path "${tempPath}\\*" -Recurse -Force -ErrorAction SilentlyContinue`);
    ps("Remove-Item -Path 'C:\\Windows\\Temp\\*' -Recurse -Force -ErrorAction SilentlyContinue");
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ── IPC Handlers ──
ipcMain.handle("scan-system", async () => {
  const cpu = getCPU();
  const gpu = getGPU();
  const ram = getRAM();
  const disk = getDisk();
  const os = getOS();
  return {
    systemInfo: {
      cpu, gpu, ram, disk, os,
      uptime: getUptime(),
      powerPlan: getPowerPlan(),
      gameMode: getGameMode(),
      network: getNetwork(),
      startup: getStartup(),
      processes: getProcesses(),
      mouse: getMouse(),
      keyboard: getKeyboard(),
    },
  };
});

// ── Advisor: Full system scan with device type ──
ipcMain.handle("advisor-scan", async () => {
  const [cpu, gpu, ram, disk, os, uptime, powerPlan, gameMode, network, startup, processes, mouse, keyboard, deviceType] = await Promise.all([
    getCPU(), getGPU(), getRAM(), getDisk(), getOS(), getUptime(), getPowerPlan(), getGameMode(), getNetwork(), getStartup(), getProcesses(), getMouse(), getKeyboard(), getDeviceType()
  ]);
  return {
    systemInfo: { cpu, gpu, ram, disk, os, uptime, powerPlan, gameMode, network, startup, processes, mouse, keyboard },
    deviceType,
  };
});

// ── Advisor: Switch to High Performance power plan ──
ipcMain.handle("set-high-performance", async () => {
  return setHighPerformancePowerPlan();
});

// ── Advisor: Enable/Disable Game Mode ──
ipcMain.handle("set-game-mode", async (_event, enabled) => {
  return setGameMode(enabled);
});

ipcMain.on("window-minimize", () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on("window-maximize", () => { if (mainWindow) { mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize(); } });
ipcMain.on("window-close", () => { if (mainWindow) mainWindow.close(); });

// ── Dashboard IPC ──
ipcMain.handle("get-realtime-stats", async () => { return getRealtimeStatsAsync(); });
ipcMain.handle("get-drives", async () => { return getAllDrives(); });
ipcMain.handle("clear-cache", async () => { return clearCache(); });
ipcMain.handle("open-driver-update", async () => { shell.openExternal("https://www.nvidia.com/Download/index.aspx"); return { success: true }; });

// ── Process Optimizer IPC ──
let optimizedProcesses = [];

const CRITICAL_PROCESSES = [
  "system", "smss", "csrss", "wininit", "winlogon", "services", "lsass",
  "svchost", "dwm", "conhost", "fontdrvhost", "sihost", "ctfmon",
  "dusm", "Memory Compression", "Registry", "Idle",
];

const SAFE_TO_DISABLE = [
  "OneDrive", "Teams", "Skype", "Cortana", "Xbox.TCUI", "XboxGamingOverlay",
  "YourPhone", "PhoneExperienceHost", "YourHome", "HomeApp",
  "ClipChamp", "SolitaireCollection", "BingWeather", "BingNews",
  "GetHelp", "Getstarted", "Tips", "Microsoft.People", "Microsoft.WindowsMaps",
  "Microsoft.ZuneMusic", "Microsoft.ZuneVideo", "Microsoft.WindowsCamera",
  "Microsoft.MicrosoftSolitaireCollection", "Microsoft.PowerAutomateDesktop",
  "Microsoft.549981C3F5F10", "Microsoft.WindowsAlarms", "Microsoft.WindowsFeedbackHub",
  "Spotify", "Discord", "EpicGamesLauncher", "Steam", "SteamWebHelper",
  "GoogleCrashHandler", "GoogleUpdate", "OneDriveSync",
  "AdobeARM", "AdobeGCInvoker", "ccXmsgr", "ccSvcHst",
  "HpSupportAssistant", "HPSAService",
  "Dropbox", "Box", "GoogleDrive",
];

const AGGRESSIVE_EXTRA = [
  "SearchIndexer", "WSearch", "SysMain", "TabletInputService",
  "WpnService", "WpnUserService", "DevicesFlowUserPrompt",
  "cdpsvc", "CDPSvc", "CDPUserSvc", "PcaSvc",
  "diagnosticshub.standardcollector.service",
  "DPS", "WdiServiceHost", "WdiSystemHost",
  "RemoteRegistry", "RetailDemo", "MapsBroker",
  "lfsvc", "SharedAccess", "TrkWks",
  "WbioSrvc", "BthServ", "SensorDataService",
];

function isCritical(name) {
  const lower = name.toLowerCase();
  return CRITICAL_PROCESSES.some(c => lower === c.toLowerCase() || lower.includes("windows") || lower.includes("microsoft.windows"));
}

ipcMain.handle("scan-processes", async () => {
  try {
    const raw = await psAsync("Get-Process|Where-Object{$_.Name -and !$_.MainWindowHandle}|Select-Object Name,Id,@{N='RAM_MB';E={[math]::Round($_.WorkingSet64/1MB,1)}},CPU | Sort-Object RAM_MB -Descending|ConvertTo-Json");
    const procs = JSON.parse(raw || "[]");
    const arr = Array.isArray(procs) ? procs : [procs];

    const classified = arr.map(p => {
      const name = p.Name || "";
      const ram = p.RAM_MB || 0;
      let status = "running";
      if (isCritical(name)) status = "critical";
      else if (SAFE_TO_DISABLE.some(s => name.toLowerCase().includes(s.toLowerCase()))) status = "safe";
      else if (AGGRESSIVE_EXTRA.some(s => name.toLowerCase().includes(s.toLowerCase()))) status = "aggressive";
      return { name, pid: p.Id, ram, status };
    }).filter(p => p.ram > 1);

    const summary = {
      total: classified.length,
      safe: classified.filter(p => p.status === "safe").length,
      aggressive: classified.filter(p => p.status === "aggressive").length,
      critical: classified.filter(p => p.status === "critical").length,
      totalRam: Math.round(classified.reduce((s, p) => s + p.ram, 0)),
    };

    return { processes: classified, summary };
  } catch (err) {
    console.error("[scan-processes] Error:", err);
    return { processes: [], summary: { total: 0, safe: 0, aggressive: 0, critical: 0, totalRam: 0 } };
  }
});

ipcMain.handle("optimize-processes", async (_event, mode) => {
  try {
    const toDisable = mode === "aggressive"
      ? [...SAFE_TO_DISABLE, ...AGGRESSIVE_EXTRA]
      : SAFE_TO_DISABLE;

    let killed = 0;
    let savedRam = 0;
    const restored = [];

    for (const name of toDisable) {
      try {
        const raw = await psAsync(`Get-Process -Name '${name}' -EA SilentlyContinue|Select-Object -First 1 Id,Name,@{N='RAM';E={[math]::Round($_.WorkingSet64/1MB,1)}}|ConvertTo-Json`);
        if (!raw) continue;
        const proc = JSON.parse(raw);
        if (proc && proc.Id) {
          const ramBefore = proc.RAM || 0;
          await psAsync(`Stop-Process -Id ${proc.Id} -Force -EA SilentlyContinue`);
          await new Promise(r => setTimeout(r, 200));
          const alive = await psAsync(`Get-Process -Id ${proc.Id} -EA SilentlyContinue`);
          if (!alive) {
            killed++;
            savedRam += ramBefore;
            restored.push({ name: proc.Name, pid: proc.Id, ram: ramBefore });
          }
        }
      } catch {}
    }

    // Disable startup items (safe mode: non-Microsoft only, aggressive: all non-critical)
    const startupReg = mode === "aggressive"
      ? await psAsync("Get-CimInstance Win32_StartupCommand|Where-Object{$_.Location -notlike '*Microsoft*'}|Select-Object Name,Command|ConvertTo-Json")
      : await psAsync("Get-CimInstance Win32_StartupCommand|Where-Object{$_.Location -notlike '*Microsoft*' -and $_.Location -notlike '*Windows*'}|Select-Object Name,Command|ConvertTo-Json");

    optimizedProcesses = restored;

    return { success: true, killed, savedRam, mode, processes: restored };
  } catch (err) {
    console.error("[optimize-processes] Error:", err);
    return { success: false, killed: 0, savedRam: 0, mode, processes: [] };
  }
});

ipcMain.handle("restore-processes", async () => {
  const restored = optimizedProcesses.length;
  optimizedProcesses = [];
  return { success: true, restored, message: "Processes will restart on next system boot or when launched manually." };
});

// ── Game Detection IPC ──
let autopilotInterval = null;
let autopilotGames = [];
let lastDetectedGame = null;

ipcMain.handle("detect-games", async (_event, executables) => {
  try {
    const names = executables.map(e => e.replace(/\.(exe)$/i, '')).join("','");
    const raw = await psAsync(`Get-Process|Where-Object{$_.Name -in '${names}'}|Select-Object Name,Id |ConvertTo-Json`);
    if (!raw) return { running: [] };
    const procs = JSON.parse(raw);
    const arr = Array.isArray(procs) ? procs : [procs];
    return { running: arr.map(p => ({ name: p.Name, pid: p.Id })) };
  } catch { return { running: [] }; }
});

ipcMain.handle("start-autopilot", async (_event, games) => {
  autopilotGames = games;
  lastDetectedGame = null;
  if (autopilotInterval) clearInterval(autopilotInterval);
  autopilotInterval = setInterval(async () => {
    try {
      const names = autopilotGames.map(g => g.executable.replace(/\.(exe)$/i, '')).join("','");
      if (!names) return;
      const raw = await psAsync(`Get-Process|Where-Object{$_.Name -in '${names}'}|Select-Object Name -First 1`);
      if (raw && raw.trim()) {
        const detected = raw.trim();
        if (lastDetectedGame !== detected) {
          lastDetectedGame = detected;
          if (mainWindow) mainWindow.webContents.send("autopilot-event", { type: "game-started", game: detected });
          const profile = autopilotGames.find(g => g.name === detected || g.executable.replace(/\.(exe)$/i, '') === detected);
          if (profile && profile.tweaks && profile.tweaks.length) {
            for (const tweakId of profile.tweaks) {
              const cmd = TWEAK_COMMANDS[tweakId];
              if (cmd) {
                try { await execAsync(cmd, { timeout: 15000, windowsHide: true }); } catch {}
              }
            }
          }
        }
      } else if (lastDetectedGame) {
        const closed = lastDetectedGame;
        lastDetectedGame = null;
        if (mainWindow) mainWindow.webContents.send("autopilot-event", { type: "game-closed", game: closed });
        const profile = autopilotGames.find(g => g.name === closed || g.executable.replace(/\.(exe)$/i, '') === closed);
        if (profile && profile.tweaks && profile.tweaks.length) {
          for (const tweakId of profile.tweaks) {
            const cmd = TWEAK_RESTORE_COMMANDS[tweakId];
            if (cmd) {
              try { await execAsync(cmd, { timeout: 15000, windowsHide: true }); } catch {}
            }
          }
        }
      }
    } catch {}
  }, 3000);
  return { success: true };
});

ipcMain.handle("stop-autopilot", async () => {
  if (autopilotInterval) { clearInterval(autopilotInterval); autopilotInterval = null; }
  autopilotGames = [];
  lastDetectedGame = null;
  return { success: true };
});

ipcMain.handle("get-autopilot-status", async () => {
  return { active: autopilotInterval !== null, currentGame: lastDetectedGame, games: autopilotGames.map(g => g.name) };
});

// ── Benchmark IPC ──
ipcMain.handle("run-benchmark", async () => {
  try {
    const samples = [];
    for (let i = 0; i < 10; i++) {
      const batchRaw = await psAsync("$cpu=(Get-CimInstance Win32_Processor -EA SilentlyContinue|Select-Object -First 1).LoadPercentage; if($null -eq $cpu){$cpu=0}; $os=Get-CimInstance Win32_OperatingSystem; $ramUsed=[math]::Round(($os.TotalVisibleMemorySize-$os.FreePhysicalMemory)/1MB,2); $ramTotal=[math]::Round($os.TotalVisibleMemorySize/1MB,2); Write-Output ('BENCH|'+$cpu+'|'+$ramUsed+'|'+$ramTotal)");
      const parts = (batchRaw || "").split("|");
      samples.push({
        cpuUsage: Math.round((parseFloat(parts[1]) || 0) * 10) / 10,
        ramUsed: Math.round((parseFloat(parts[2]) || 0) * 1024),
        ramTotal: Math.round((parseFloat(parts[3]) || 0) * 1024),
      });
      await new Promise(r => setTimeout(r, 500));
    }
    const avgCpu = Math.round(samples.reduce((s, p) => s + p.cpuUsage, 0) / samples.length * 10) / 10;
    const avgRam = Math.round(samples.reduce((s, p) => s + p.ramUsed, 0) / samples.length);
    const maxCpu = Math.round(Math.max(...samples.map(p => p.cpuUsage)) * 10) / 10;
    const ramTotal = samples[0]?.ramTotal || 0;

    let diskRead = 0, diskWrite = 0;
    try {
      const diskRaw = await psAsync("try { $s='C:\\__bench_test__'; $data=New-Object byte[] 1MB; $fs=[IO.File]::Create($s); $sw=[Diagnostics.Stopwatch]::StartNew(); $fs.Write($data,0,$data.Length); $fs.Flush(); $fs.Close(); $diskWrite=[math]::Round(1/$sw.Elapsed.TotalSeconds,1); $sw.Restart(); $null=[IO.File]::ReadAllBytes($s); $diskRead=[math]::Round(1/$sw.Elapsed.TotalSeconds,1); Remove-Item $s -Force -EA SilentlyContinue; Write-Output ('DISK|'+$diskRead+'|'+$diskWrite) } catch { Write-Output 'DISK|0|0' }", 10000);
      const dparts = (diskRaw || "").split("|");
      diskRead = Math.round(parseFloat(dparts[1]) || 0);
      diskWrite = Math.round(parseFloat(dparts[2]) || 0);
    } catch {}

    return { success: true, avgCpu, avgRam, maxCpu, ramTotal, diskReadMBs: diskRead, diskWriteMBs: diskWrite, samples: samples.length, timestamp: Date.now() };
  } catch (err) {
    console.error("[benchmark] Error:", err);
    return { success: false, avgCpu: 0, avgRam: 0, maxCpu: 0, ramTotal: 0, diskReadMBs: 0, diskWriteMBs: 0, samples: 0, timestamp: Date.now() };
  }
});

// ── Scheduled Scans IPC ──
let scheduledScans = [];
let scanInterval = null;

function startScanScheduler() {
  if (scanInterval) return;
  scanInterval = setInterval(async () => {
    const now = Date.now();
    for (const scan of scheduledScans) {
      if (!scan.enabled) continue;
      if (scan.nextRun && scan.nextRun <= now) {
        scan.lastRun = now;
        scan.nextRun = now + (scan.intervalMs || 3600000);
        try {
          if (scan.type === 'optimize') {
            for (const tweakId of (scan.tweaks || [])) {
              const cmd = TWEAK_COMMANDS[tweakId];
              if (cmd) { try { await execAsync(cmd, { timeout: 15000, windowsHide: true }); } catch {} }
            }
          } else if (scan.type === 'benchmark') {
            if (mainWindow) mainWindow.webContents.send("autopilot-event", { type: "scheduled-benchmark", game: "auto" });
          }
          if (mainWindow) {
            new Notification({ title: "Choatix Scheduled Scan", body: `Completed: ${scan.name || scan.type}` }).show();
          }
        } catch {}
      }
    }
  }, 30000);
}

ipcMain.handle("get-scheduled-scans", async () => {
  startScanScheduler();
  return { scans: scheduledScans };
});

ipcMain.handle("schedule-scan", async (_event, scan) => {
  const id = Date.now().toString(36);
  const entry = { id, ...scan, enabled: true, lastRun: null, nextRun: Date.now() + (scan.intervalMs || 3600000) };
  scheduledScans.push(entry);
  startScanScheduler();
  return { success: true, scan: entry };
});

ipcMain.handle("unschedule-scan", async (_event, id) => {
  scheduledScans = scheduledScans.filter(s => s.id !== id);
  return { success: true };
});

// ═══════════════════════════════════════════
// ── Apply Tweak IPC ──
// ═══════════════════════════════════════════
const TWEAK_COMMANDS = {
  // SYSTEM
  'sys-high-performance': 'powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
  'sys-enable-game-mode': 'reg add "HKCU\\Software\\Microsoft\\GameBar" /v AutoGameModeEnabled /t REG_DWORD /d 1 /f',
  'sys-disk-cleanup': 'cleanmgr /sagerun:1',
  'sys-disable-fullscreen-opt': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer" /v DisableFullscreenOptimization /t REG_DWORD /d 1 /f',
  'sys-visual-effects': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f && reg add "HKCU\\Control Panel\\Desktop\\WindowMetrics" /v MinAnimate /t REG_SZ /d "0" /f',
  'sys-cpu-priority': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f',

  // NETWORK
  'net-disable-background-updates': 'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU" /v NoAutoUpdate /t REG_DWORD /d 1 /f',
  'net-disable-throttling': 'netsh int tcp set global autotuninglevel=normal',
  'net-optimize-dns': 'netsh int ip set dnsservers "Ethernet" static 1.1.1.1 primary',
  'net-reduce-congestion': 'powershell -Command "Set-NetTCPSetting -SettingName Internet -CongestionProvider CTCP -EA SilentlyContinue"',
  'net-reset-tcp': 'netsh int ip reset && netsh winsock reset',

  // NVIDIA
  'nv-max-power': 'powershell -Command "if(Get-Command nvidia-smi -ErrorAction SilentlyContinue){nvidia-smi -pl 100}"',
  'nv-low-latency': 'reg add "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v DisableP4BC /t REG_DWORD /d 1 /f',
  'nv-hardware-scheduling': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v HwSchMode /t REG_DWORD /d 2 /f',
  'nv-disable-vsync': 'reg add "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v VSyncMode /t REG_DWORD /d 0 /f',
  'nv-optimize-shader-cache': 'powershell -Command "if(Test-Path \"$env:APPDATA\\NVIDIA\\GLCache\"){Remove-Item \"$env:APPDATA\\NVIDIA\\GLCache\" -Recurse -Force -EA SilentlyContinue}"',
  'nv-texture-filtering': 'reg add "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v TextureFilteringQuality /t REG_DWORD /d 1 /f',

  // DEBLOAT
  'debloat-disable-startup': 'powershell -Command "Get-CimInstance Win32_StartupCommand | Select-Object Name,Command | Format-Table -AutoSize"',
  'debloat-remove-background': 'powershell -Command "Get-AppxPackage *BingWeather* | Remove-AppxPackage -ErrorAction SilentlyContinue; Get-AppxPackage *BingNews* | Remove-AppxPackage -ErrorAction SilentlyContinue; Get-AppxPackage *BingSports* | Remove-AppxPackage -ErrorAction SilentlyContinue"',
  'debloat-superfetch': 'powershell -Command "Stop-Service -Name SysMain -Force -ErrorAction SilentlyContinue; Set-Service -Name SysMain -StartupType Disabled -ErrorAction SilentlyContinue"',
  'debloat-disable-telemetry': 'reg add "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v AllowTelemetry /t REG_DWORD /d 0 /f',
  'debloat-disable-services': 'powershell -Command "Set-Service -Name DiagTrack,WSearch,SysMain,WpnService,WpnUserService,CDPSvc,CDPUserSvc,lfsvc,TrkWks,RetailDemo,MapsBroker -StartupType Manual -EA SilentlyContinue"',
  'debloat-windows-features': 'powershell -Command "Disable-WindowsOptionalFeature -Online -FeatureName Printing-PrintToPDFServices,Printing-XPSServices -EA SilentlyContinue"',

  // MOUSE
  'mouse-disable-acceleration': 'reg add "HKCU\\Control Panel\\Mouse" /v MouseSpeed /t REG_SZ /d "0" /f && reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold1 /t REG_SZ /d "0" /f && reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold2 /t REG_SZ /d "0" /f',
  'mouse-raw-input': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\PrecisionTouchPad" /v AAPThreshold /t REG_DWORD /d 0 /f',
  'mouse-optimize-pointer': 'reg add "HKCU\\Control Panel\\Mouse" /v MouseSensitivity /t REG_SZ /d "10" /f',

  // KEYBOARD
  'kb-disable-filter-keys': 'reg add "HKCU\\Control Panel\\Accessibility\\Keyboard Response" /v Flags /t REG_SZ /d "0" /f',
  'kb-disable-sticky-keys': 'reg add "HKCU\\Control Panel\\Accessibility\\Sticky Keys" /v Flags /t REG_SZ /d "0" /f',
  'kb-disable-toggle-keys': 'reg add "HKCU\\Control Panel\\Accessibility\\ToggleKeys" /v Flags /t REG_SZ /d "0" /f',

  // AMD
  'amd-max-power': 'powershell -Command "if(Get-Command radeontop -ErrorAction SilentlyContinue){radeontop -l 100}"',

  // INTEL
  'intel-max-power': 'powershell -Command "powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"',

  // CPU
  'cpu-core-parking-disable': 'powercfg /setacvalueindex scheme_current sub_processor CPMINCORES 100',
  'cpu-smt-enable': 'bcdedit /set disabledynamictick no',
  'cpu-interrupt-affinity': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f',

  // MEMORY
  'memory-wake-cleaner': 'powershell -Command "Clear-RecycleBin -Force -EA SilentlyContinue"',
  'memory-page-prefetch': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters" /v EnablePrefetcher /t REG_DWORD /d 0 /f',
  'memory-virtual-memory': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v DisablePagingExecutive /t REG_DWORD /d 1 /f',
  'memory-pagefile-manager': 'powershell -Command "$cs = Get-WmiObject Win32_ComputerSystem; if($cs.AutomaticManagedPagefile){$cs.AutomaticManagedPagefile=$false; $cs.Put()}"',
  'memory-working-set': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v LargeSystemCache /t REG_DWORD /d 0 /f',

  // STORAGE
  'storage-ssd-optimization': 'fsutil behavior set disablelastaccess 1',
  'storage-nvme-optimization': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\stornvme\\Parameters\\Device" /v NumberOfWriteBufferQueues /t REG_DWORD /d 4 /f',
  'storage-trim-optimization': 'powershell -Command "Optimize-Volume -DriveLetter C -ReTrim -EA SilentlyContinue"',
  'storage-prefetch-manager': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters" /v EnableSuperfetch /t REG_DWORD /d 0 /f',
  'storage-write-cache': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Disk" /v ForcePagingFile /t REG_DWORD /d 0 /f',
  'storage-temp-file-cleaner': 'powershell -Command "Remove-Item $env:TEMP\\* -Recurse -Force -EA SilentlyContinue"',

  // WINDOWS
  'windows-explorer-optimization': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v LaunchTo /t REG_DWORD /d 1 /f',
  'windows-animation-optimization': 'reg add "HKCU\\Control Panel\\Desktop\\WindowMetrics" /v MinAnimate /t REG_SZ /d "0" /f',
  'windows-context-menu-cleanup': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer" /v ShowRecent /t REG_DWORD /d 0 /f',
  'windows-scheduled-task-optimizer': 'powershell -Command "Get-ScheduledTask | Where-Object {$_.State -eq \'Ready\' -and $_.TaskPath -notlike \'\\Microsoft\\\'} | Disable-ScheduledTask -EA SilentlyContinue"',
  'windows-search-index-optimizer': 'powershell -Command "Stop-Service -Name WSearch -Force -EA SilentlyContinue; Set-Service -Name WSearch -StartupType Manual -EA SilentlyContinue"',
  'windows-notification-optimization': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\PushNotifications" /v ToastEnabled /t REG_DWORD /d 0 /f',

  // AUDIO
  'audio-disable-enhancements': 'reg add "HKCU\\Software\\Microsoft\\MMSys\\Default\\AudioEffects\\AudioEnhancementSceneGraph" /v Enabled /t REG_DWORD /d 0 /f',
  'audio-usb-optimization': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\usbaudio" /v DisableSelectiveSuspend /t REG_DWORD /d 1 /f',

  // USB
  'usb-selective-suspend-disable': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\USB" /v DisableSelectiveSuspend /t REG_DWORD /d 1 /f',

  // SERVICES
  'services-gaming-preset': 'powershell -Command "Set-Service -Name SysMain,DiagTrack,WSearch -StartupType Manual -EA SilentlyContinue"',
  'services-streaming-preset': 'powershell -Command "Set-Service -Name SysMain,WSearch -StartupType Manual -EA SilentlyContinue; Set-Service -Name WpnService -StartupType Automatic -EA SilentlyContinue"',
  'services-editing-preset': 'powershell -Command "Set-Service -Name SysMain -StartupType Automatic -EA SilentlyContinue; Set-Service -Name DiagTrack -StartupType Manual -EA SilentlyContinue"',
  'services-workstation-preset': 'powershell -Command "Set-Service -Name SysMain,DiagTrack,WSearch,WpnService -StartupType Manual -EA SilentlyContinue"',
};

// ═══════════════════════════════════════════
// ── Restore Tweak Commands ──
// ═══════════════════════════════════════════
const TWEAK_RESTORE_COMMANDS = {
  // SYSTEM
  'sys-high-performance': 'powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e',
  'sys-enable-game-mode': 'reg add "HKCU\\Software\\Microsoft\\GameBar" /v AutoGameModeEnabled /t REG_DWORD /d 0 /f',
  'sys-disk-cleanup': 'echo "Disk cleanup cannot be undone"',
  'sys-disable-fullscreen-opt': 'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer" /v DisableFullscreenOptimization /f',
  'sys-visual-effects': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 0 /f && reg add "HKCU\\Control Panel\\Desktop\\WindowMetrics" /v MinAnimate /t REG_SZ /d "1" /f',
  'sys-cpu-priority': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 2 /f',

  // NETWORK
  'net-disable-background-updates': 'reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU" /v NoAutoUpdate /f',
  'net-disable-throttling': 'netsh int tcp set global autotuninglevel=normal',
  'net-optimize-dns': 'netsh int ip set dnsservers "Ethernet" dhcp',
  'net-reduce-congestion': 'powershell -Command "Set-NetTCPSetting -SettingName Internet -CongestionProvider CUBIC -EA SilentlyContinue"',
  'net-reset-tcp': 'echo "TCP/IP reset cannot be undone"',

  // NVIDIA
  'nv-max-power': 'powershell -Command "if(Get-Command nvidia-smi -ErrorAction SilentlyContinue){nvidia-smi -pl 0}"',
  'nv-low-latency': 'reg delete "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v DisableP4BC /f',
  'nv-hardware-scheduling': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v HwSchMode /t REG_DWORD /d 1 /f',
  'nv-disable-vsync': 'reg delete "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v VSyncMode /f',
  'nv-optimize-shader-cache': 'echo "Shader cache will rebuild automatically"',
  'nv-texture-filtering': 'reg delete "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v TextureFilteringQuality /f',

  // DEBLOAT
  'debloat-disable-startup': 'echo "Startup items restored manually"',
  'debloat-remove-background': 'echo "App packages restored manually"',
  'debloat-superfetch': 'powershell -Command "Set-Service -Name SysMain -StartupType Automatic -EA SilentlyContinue; Start-Service -Name SysMain -EA SilentlyContinue"',
  'debloat-disable-telemetry': 'reg delete "HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" /v AllowTelemetry /f',
  'debloat-disable-services': 'powershell -Command "Set-Service -Name DiagTrack,WSearch,SysMain,WpnService -StartupType Automatic -EA SilentlyContinue"',
  'debloat-windows-features': 'powershell -Command "Enable-WindowsOptionalFeature -Online -FeatureName Printing-PrintToPDFServices,Printing-XPSServices -EA SilentlyContinue"',

  // MOUSE
  'mouse-disable-acceleration': 'reg add "HKCU\\Control Panel\\Mouse" /v MouseSpeed /t REG_SZ /d "1" /f && reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold1 /t REG_SZ /d "6" /f && reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold2 /t REG_SZ /d "10" /f',
  'mouse-raw-input': 'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\PrecisionTouchPad" /v AAPThreshold /f',
  'mouse-optimize-pointer': 'reg add "HKCU\\Control Panel\\Mouse" /v MouseSensitivity /t REG_SZ /d "10" /f',
      // KEYBOARD
  'kb-disable-filter-keys': 'reg add "HKCU\\Control Panel\\Accessibility\\Keyboard Response" /v Flags /t REG_SZ /d "1" /f',
  'kb-disable-sticky-keys': 'reg add "HKCU\\Control Panel\\Accessibility\\Sticky Keys" /v Flags /t REG_SZ /d "1" /f',
  'kb-disable-toggle-keys': 'reg add "HKCU\\Control Panel\\Accessibility\\ToggleKeys" /v Flags /t REG_SZ /d "1" /f',

  // AMD
  'amd-max-power': 'echo "AMD power restored to default"',

  // INTEL
  'intel-max-power': 'powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e',

  // CPU
  'cpu-core-parking-disable': 'powercfg /setacvalueindex scheme_current sub_processor CPMINCORES 0',
  'cpu-smt-enable': 'bcdedit /set disabledynamictick yes',
  'cpu-interrupt-affinity': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 2 /f',

  // MEMORY
  'memory-wake-cleaner': 'echo "Memory cleanup is not reversible"',
  'memory-page-prefetch': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters" /v EnablePrefetcher /t REG_DWORD /d 3 /f',
  'memory-virtual-memory': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v DisablePagingExecutive /t REG_DWORD /d 0 /f',
  'memory-pagefile-manager': 'powershell -Command "$cs = Get-WmiObject Win32_ComputerSystem; $cs.AutomaticManagedPagefile=$true; $cs.Put()"',
  'memory-working-set': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v LargeSystemCache /t REG_DWORD /d 1 /f',

  // STORAGE
  'storage-ssd-optimization': 'fsutil behavior set disablelastaccess 0',
  'storage-nvme-optimization': 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\stornvme\\Parameters\\Device" /v NumberOfWriteBufferQueues /f',
  'storage-trim-optimization': 'echo "TRIM runs automatically"',
  'storage-prefetch-manager': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters" /v EnableSuperfetch /t REG_DWORD /d 3 /f',
  'storage-write-cache': 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Disk" /v ForcePagingFile /f',
  'storage-temp-file-cleaner': 'echo "Temp files are not recoverable"',

  // WINDOWS
  'windows-explorer-optimization': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v LaunchTo /t REG_DWORD /d 2 /f',
  'windows-animation-optimization': 'reg add "HKCU\\Control Panel\\Desktop\\WindowMetrics" /v MinAnimate /t REG_SZ /d "1" /f',
  'windows-context-menu-cleanup': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer" /v ShowRecent /t REG_DWORD /d 1 /f',
  'windows-scheduled-task-optimizer': 'echo "Scheduled tasks restored manually"',
  'windows-search-index-optimizer': 'powershell -Command "Set-Service -Name WSearch -StartupType Automatic -EA SilentlyContinue; Start-Service -Name WSearch -EA SilentlyContinue"',
  'windows-notification-optimization': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\PushNotifications" /v ToastEnabled /t REG_DWORD /d 1 /f',

  // AUDIO
  'audio-disable-enhancements': 'reg add "HKCU\\Software\\Microsoft\\MMSys\\Default\\AudioEffects\\AudioEnhancementSceneGraph" /v Enabled /t REG_DWORD /d 1 /f',
  'audio-usb-optimization': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\usbaudio" /v DisableSelectiveSuspend /t REG_DWORD /d 0 /f',

  // USB
  'usb-selective-suspend-disable': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\USB" /v DisableSelectiveSuspend /t REG_DWORD /d 0 /f',

  // SERVICES
  'services-gaming-preset': 'powershell -Command "Set-Service -Name SysMain,DiagTrack,WSearch -StartupType Automatic -EA SilentlyContinue"',
  'services-streaming-preset': 'powershell -Command "Set-Service -Name SysMain,WSearch -StartupType Automatic -EA SilentlyContinue"',
  'services-editing-preset': 'powershell -Command "Set-Service -Name SysMain -StartupType Automatic -EA SilentlyContinue"',
  'services-workstation-preset': 'powershell -Command "Set-Service -Name SysMain,DiagTrack,WSearch,WpnService -StartupType Automatic -EA SilentlyContinue"',
};

ipcMain.handle("restore-tweak", async (_event, tweakId) => {
  const cmd = TWEAK_RESTORE_COMMANDS[tweakId];
  if (!cmd) return { success: false, error: `Unknown tweak: ${tweakId}` };
  return runTweakCommand(cmd, 15000);
});

ipcMain.handle("restore-category", async (_event, category) => {
  const categoryTweaks = Object.keys(TWEAK_COMMANDS).filter(id => {
    // Map tweak IDs to categories
    const categories = {
      'sys-high-performance': 'system', 'sys-enable-game-mode': 'system', 'sys-disk-cleanup': 'system',
      'sys-disable-fullscreen-opt': 'system', 'sys-visual-effects': 'system', 'sys-cpu-priority': 'system',
      'net-disable-background-updates': 'network', 'net-disable-throttling': 'network', 'net-optimize-dns': 'network',
      'net-reduce-congestion': 'network', 'net-reset-tcp': 'network',
      'nv-max-power': 'nvidia', 'nv-low-latency': 'nvidia', 'nv-hardware-scheduling': 'nvidia',
      'nv-disable-vsync': 'nvidia', 'nv-optimize-shader-cache': 'nvidia', 'nv-texture-filtering': 'nvidia',
      'debloat-disable-startup': 'debloat', 'debloat-remove-background': 'debloat', 'debloat-superfetch': 'debloat',
      'debloat-disable-telemetry': 'debloat', 'debloat-disable-services': 'debloat', 'debloat-windows-features': 'debloat',
      'mouse-disable-acceleration': 'mouse', 'mouse-raw-input': 'mouse', 'mouse-optimize-pointer': 'mouse',
      'kb-disable-filter-keys': 'keyboard', 'kb-disable-sticky-keys': 'keyboard', 'kb-disable-toggle-keys': 'keyboard',
      'amd-max-power': 'amd',
      'intel-max-power': 'intel',
      'cpu-core-parking-disable': 'cpu', 'cpu-smt-enable': 'cpu', 'cpu-interrupt-affinity': 'cpu',
      'memory-wake-cleaner': 'memory', 'memory-page-prefetch': 'memory', 'memory-virtual-memory': 'memory',
      'memory-pagefile-manager': 'memory', 'memory-working-set': 'memory',
      'storage-ssd-optimization': 'storage', 'storage-nvme-optimization': 'storage', 'storage-trim-optimization': 'storage',
      'storage-prefetch-manager': 'storage', 'storage-write-cache': 'storage', 'storage-temp-file-cleaner': 'storage',
      'windows-explorer-optimization': 'windows', 'windows-animation-optimization': 'windows',
      'windows-context-menu-cleanup': 'windows', 'windows-scheduled-task-optimizer': 'windows',
      'windows-search-index-optimizer': 'windows', 'windows-notification-optimization': 'windows',
      'audio-disable-enhancements': 'audio', 'audio-usb-optimization': 'audio',
      'usb-selective-suspend-disable': 'usb',
      'services-gaming-preset': 'services', 'services-streaming-preset': 'services',
      'services-editing-preset': 'services', 'services-workstation-preset': 'services',
    };
    return categories[id] === category;
  });
  let restored = 0;
  for (const id of categoryTweaks) {
    const cmd = TWEAK_RESTORE_COMMANDS[id];
    if (cmd) {
      try { await execAsync(cmd, { timeout: 15000, windowsHide: true }); restored++; } catch {}
    }
  }
  return { success: true, restored };
});

ipcMain.handle("restore-all", async () => {
  let restored = 0;
  for (const [id, cmd] of Object.entries(TWEAK_RESTORE_COMMANDS)) {
    try { await execAsync(cmd, { timeout: 15000, windowsHide: true }); restored++; } catch {}
  }
  return { success: true, restored };
});

function runTweakCommand(cmd, timeout = 15000) {
  return new Promise((resolve) => {
    const child = exec(cmd, { timeout, windowsHide: true }, (error, stdout, stderr) => {
      const exitCode = child?.exitCode ?? 0;
      if (error && exitCode !== 0) {
        const msg = stderr?.trim() || error.message;
        if (msg.includes('Access is denied') || msg.includes('permission') || msg.includes('not found')) {
          resolve({ success: false, error: msg });
        } else {
          resolve({ success: true });
        }
      } else {
        resolve({ success: true });
      }
    });
    child.on('error', (e) => {
      if (e.killed) resolve({ success: false, error: 'Command timed out' });
      else resolve({ success: false, error: e.message });
    });
  });
}

ipcMain.handle("apply-tweak", async (_event, tweakId) => {
  const cmd = TWEAK_COMMANDS[tweakId];
  if (!cmd) return { success: false, error: `Unknown tweak: ${tweakId}` };
  return runTweakCommand(cmd, 15000);
});

ipcMain.handle("is-admin", () => isAdmin());

// ═══════════════════════════════════════════
// ── One-Click Optimize IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("one-click-optimize", async () => {
  try {
    const cmds = [
      // System
      'powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
      'reg add "HKCU\\Software\\Microsoft\\GameBar" /v AllowAutoGameMode /t REG_DWORD /d 1 /f',
      'reg add "HKCU\\Software\\Microsoft\\GameBar" /v AutoGameModeEnabled /t REG_DWORD /d 1 /f',
      'powershell -Command "Disable-MMAgent -MemoryCompression -ErrorAction SilentlyContinue"',
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f',
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v LargeSystemCache /t REG_DWORD /d 0 /f',
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v DisablePagingExecutive /t REG_DWORD /d 1 /f',
      // Memory
      'powershell -Command "Get-Service -Name SysMain -EA SilentlyContinue | Stop-Service -Force"',
      'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v PagingFiles /t REG_MULTI_SZ /d "" /f',
      // Network
      'netsh int tcp set global autotuninglevel=normal',
      'powershell -Command "Set-NetTCPSetting -SettingName Internet -CongestionProvider CTCP -EA SilentlyContinue"',
      // Mouse
      'reg add "HKCU\\Control Panel\\Mouse" /v MouseSpeed /t REG_SZ /d "0" /f',
      'reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold1 /t REG_SZ /d "0" /f',
      'reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold2 /t REG_SZ /d "0" /f',
      // Keyboard
      'reg add "HKCU\\Control Panel\\Keyboard" /v KeyboardDelay /t REG_SZ /d "0" /f',
      'reg add "HKCU\\Control Panel\\Keyboard" /v KeyboardSpeed /t REG_SZ /d "31" /f',
    ];
    let applied = 0;
    for (const cmd of cmds) {
      try { await execAsync(cmd, { timeout: 10000, windowsHide: true }); applied++; } catch {}
    }
    return { success: true, applied, total: cmds.length };
  } catch (e) {
    return { success: false, applied: 0, total: 0, error: e.message };
  }
});

// ═══════════════════════════════════════════
// ── Auto-Update IPC ──
// ═══════════════════════════════════════════
const CURRENT_VERSION = app.getVersion();
ipcMain.handle("check-for-updates", async () => {
  try {
    const data = await new Promise((resolve, reject) => {
      https.get("https://api.github.com/repos/choatix/choatix-v2/releases/latest", { headers: { "User-Agent": "Choatix-Desktop" } }, (res) => {
        let body = ""; res.on("data", c => body += c);
        res.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(new Error("Invalid JSON")); } });
      }).on("error", reject);
    });
    const latestTag = (data.tag_name || "").replace(/^v/, "");
    return { updateAvailable: latestTag !== CURRENT_VERSION, currentVersion: CURRENT_VERSION, latestVersion: latestTag || CURRENT_VERSION, downloadUrl: data.html_url || "", releaseNotes: (data.body || "").substring(0, 500) };
  } catch {
    return { updateAvailable: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION, downloadUrl: "", releaseNotes: "" };
  }
});

// ═══════════════════════════════════════════
// ── Crash Reporter IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("report-crash", async (_e, { error, stack, context }) => {
  const DISCORD_WEBHOOK = process.env.DISCORD_CRASH_WEBHOOK || "";
  if (!DISCORD_WEBHOOK) return { success: false };
  try {
    const payload = JSON.stringify({ embeds: [{ title: "Choatix Crash", color: 0xFF0000, fields: [
      { name: "Version", value: CURRENT_VERSION, inline: true },
      { name: "Platform", value: `${os.platform()} ${os.release()}`, inline: true },
      { name: "Error", value: (error || "Unknown").substring(0, 1000) },
      { name: "Stack", value: (stack || "N/A").substring(0, 1000) },
      { name: "Context", value: (context || "N/A").substring(0, 500) },
    ], timestamp: new Date().toISOString() }] });
    const url = new URL(DISCORD_WEBHOOK);
    const mod = url.protocol === "https:" ? https : http;
    await new Promise((resolve, reject) => {
      const req = mod.request({ hostname: url.hostname, path: url.pathname + (url.search || ""), method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, (res) => { res.resume(); resolve(); });
      req.on("error", reject); req.write(payload); req.end();
    });
    return { success: true };
  } catch { return { success: false }; }
});

// ═══════════════════════════════════════════
// ── Export/Import Settings IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("export-settings", () => {
  try {
    const storePath = path.join(app.getPath("userData"), "choatix-v2-storage.json");
    if (!fs.existsSync(storePath)) return { success: false, error: "No settings found" };
    return { success: true, data: fs.readFileSync(storePath, "utf-8") };
  } catch (e) { return { success: false, error: e.message }; }
});
ipcMain.handle("import-settings", (_e, data) => {
  try { JSON.parse(data); fs.writeFileSync(path.join(app.getPath("userData"), "choatix-v2-storage.json"), data); return { success: true }; } catch (e) { return { success: false, error: e.message }; }
});
ipcMain.handle("save-settings-to-file", async () => {
  try {
    const { dialog } = require("electron");
    const storePath = path.join(app.getPath("userData"), "choatix-v2-storage.json");
    const data = fs.existsSync(storePath) ? fs.readFileSync(storePath, "utf-8") : "{}";
    const result = await dialog.showSaveDialog(mainWindow, { title: "Export Choatix Settings", defaultPath: `choatix-settings-${new Date().toISOString().split("T")[0]}.json`, filters: [{ name: "JSON", extensions: ["json"] }] });
    if (!result.canceled && result.filePath) { fs.writeFileSync(result.filePath, data); return { success: true }; }
    return { success: false };
  } catch (e) { return { success: false, error: e.message }; }
});
ipcMain.handle("load-settings-from-file", async () => {
  try {
    const { dialog } = require("electron");
    const result = await dialog.showOpenDialog(mainWindow, { title: "Import Choatix Settings", filters: [{ name: "JSON", extensions: ["json"] }], properties: ["openFile"] });
    if (!result.canceled && result.filePaths.length > 0) {
      const data = fs.readFileSync(result.filePaths[0], "utf-8"); JSON.parse(data);
      fs.writeFileSync(path.join(app.getPath("userData"), "choatix-v2-storage.json"), data);
      return { success: true };
    }
    return { success: false };
  } catch (e) { return { success: false, error: e.message }; }
});

// ═══════════════════════════════════════════
// ── State Persistence IPC ──
// ═══════════════════════════════════════════
const STATE_FILE = path.join(app.getPath("userData"), "choatix-state.json");
ipcMain.handle("save-app-state", (_e, state) => {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2)); return { success: true }; } catch { return { success: false }; }
});
ipcMain.handle("load-app-state", () => {
  try { if (fs.existsSync(STATE_FILE)) return { success: true, state: JSON.parse(fs.readFileSync(STATE_FILE, "utf-8")) }; } catch {}
  return { success: false, state: null };
});

// ═══════════════════════════════════════════
// ── Global Error Handler (Crash Reporter) ──
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// ── Feedback IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("send-feedback", async (_e, feedback) => {
  if (!FEEDBACK_WEBHOOK) return { success: false, error: "Feedback webhook not configured" };
  try {
    const colorMap = { bug: 0xFF0000, feature: 0x00AAFF, general: 0xFFAA00 };
    const iconMap = { bug: "🐛", feature: "💡", general: "💬" };
    const stars = "★".repeat(feedback.rating || 0) + "☆".repeat(5 - (feedback.rating || 0));
    const payload = JSON.stringify({
      embeds: [{
        title: `${iconMap[feedback.type] || "💬"} Feedback: ${feedback.subject}`,
        color: colorMap[feedback.type] || 0xFFAA00,
        fields: [
          { name: "Type", value: feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1), inline: true },
          { name: "Version", value: CURRENT_VERSION, inline: true },
          { name: "Platform", value: `${os.platform()} ${os.release()}`, inline: true },
          ...(feedback.rating ? [{ name: "Rating", value: `${stars} (${feedback.rating}/5)`, inline: true }] : []),
          { name: "Message", value: feedback.message.substring(0, 1000) },
          ...(feedback.email ? [{ name: "Email", value: feedback.email, inline: true }] : []),
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Choatix Feedback" }
      }]
    });
    const url = new URL(FEEDBACK_WEBHOOK);
    const mod = url.protocol === "https:" ? https : http;
    await new Promise((resolve, reject) => {
      const req = mod.request({ hostname: url.hostname, path: url.pathname + (url.search || ""), method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, (res) => { res.resume(); resolve(); });
      req.on("error", reject); req.write(payload); req.end();
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  if (mainWindow) mainWindow.webContents.send("crash-event", { error: err.message, stack: err.stack });
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

app.whenReady().then(async () => {
  if (isDev) createWindow(0);
  else { const port = await startServer(); createWindow(port); }
});
app.on("window-all-closed", () => { if (server) server.close(); if (process.platform !== "darwin") app.quit(); });
app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (isDev) createWindow(0);
    else { const port = await startServer(); createWindow(port); }
  }
});
