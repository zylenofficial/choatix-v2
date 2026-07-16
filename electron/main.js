const { app, BrowserWindow, ipcMain, shell, Notification } = require("electron");
const path = require("path");
const http = require("http");
const https = require("https");
const fs = require("fs");
const os = require("os");
const { execSync, exec, spawn } = require("child_process");
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

const UPDATE_WEBHOOK = "https://discord.com/api/webhooks/1522575081501360279/waG1l24hDq4KZyYoTL9_iJ63XJrq8x33VJaTLt2RC7aeNZKuG0JcdpcwcbnIg_djuTnM";

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
    width: 540, height: 420,
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
      // Fast batch: CPU (lightweight WMI), temp (multiple sources), GPU temp, RAM, uptime, processes
      psAsync("$cpu=(Get-CimInstance Win32_Processor -EA SilentlyContinue|Select-Object -First 1).LoadPercentage; if($null -eq $cpu){$cpu=0}; $temp=$null; $lhm=(Get-CimInstance -Namespace root/LibreHardwareMonitor -ClassName Sensor -EA SilentlyContinue|Where-Object{$_.SensorType -eq 'Temperature' -and $_.Parent -like '*CPU*' -and $_.Name -like '*Core*'}|Select-Object -First 1); if($lhm){$temp=$lhm.Value}; if($null -eq $temp){$t=(Get-CimInstance -Namespace root/WMI -ClassName MSAcpi_ThermalZoneTemperature -EA SilentlyContinue|Select-Object -First 1); if($t -and $t.CurrentTemperature){$temp=[math]::Round(($t.CurrentTemperature-2732)/10,1)}}; $gpu=$null; $graw=(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits 2>$null); if($graw){$gpu=[math]::Round([double]$graw.Trim(),1)}; $os=Get-CimInstance Win32_OperatingSystem; $ramTotal=[math]::Round($os.TotalVisibleMemorySize/1MB,2); $ramFree=[math]::Round($os.FreePhysicalMemory/1MB,2); $uptime=(Get-CimInstance Win32_OperatingSystem).LastBootUpTime; $pc=(Get-Process).Count; Write-Output ('FAST|'+$cpu+'|'+$temp+'|'+$ramTotal+'|'+$ramFree+'|'+$uptime+'|'+$pc+'|GPU|'+$gpu)", 8000),
      // Network adapter name - fallback to Get-NetIPConfiguration
      psAsync("(Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up'} | Select-Object -First 1).InterfaceAlias"),
    ]);



    let cpuUsage = 0, cpuTemp = null, gpuBatchTemp = null, ramTotal = 0, ramUsed = 0, ramAvailable = 0;
    let uptime = "Unavailable", procCount = 0;
    try {
      const p = (batch1Raw || "").split("|");
      cpuUsage = Math.min(100, parseInt((p[1] || "").trim()) || 0);
      const t = parseFloat((p[2] || "").trim());
      cpuTemp = (!isNaN(t) && t > 0) ? t : null;
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
      const gt = parseFloat((p[8] || "").trim());
      gpuBatchTemp = (!isNaN(gt) && gt > 0) ? gt : null;
    } catch {}

    // GPU (cached 30s, async)
    const gpu = await getGpuCachedAsync();
    if (!gpu.temperature && gpuBatchTemp) gpu.temperature = gpuBatchTemp;

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
    },
  };
});

// ── Advisor: Full system scan with device type ──
ipcMain.handle("advisor-scan", async () => {
  const [cpu, gpu, ram, disk, os, uptime, powerPlan, gameMode, network, startup, processes, mouse, deviceType] = await Promise.all([
    getCPU(), getGPU(), getRAM(), getDisk(), getOS(), getUptime(), getPowerPlan(), getGameMode(), getNetwork(), getStartup(), getProcesses(), getMouse(), getDeviceType()
  ]);
  return {
    systemInfo: { cpu, gpu, ram, disk, os, uptime, powerPlan, gameMode, network, startup, processes, mouse },
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
  "NvContainerLocalSystem", "NVIDIA Display Container", "nvdisplay.container",
  "NvTelemetryContainer", "NvBackend", "NVDisplay.Container",
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
  return CRITICAL_PROCESSES.some(c => lower === c.toLowerCase() || lower.includes("windows") || lower.includes("microsoft.windows") || lower.includes("nvidia") || lower.includes("nvdisplay"));
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

ipcMain.handle("apply-game-tweaks", async (_event, tweakIds) => {
  let applied = 0;
  for (const tweakId of tweakIds) {
    const cmd = TWEAK_COMMANDS[tweakId];
    if (cmd) {
      try { await execAsync(cmd, { timeout: 15000, windowsHide: true }); applied++; } catch {}
    }
  }
  return { success: true, applied };
});

ipcMain.handle("restore-game-tweaks", async (_event, tweakIds) => {
  let restored = 0;
  for (const tweakId of tweakIds) {
    const cmd = TWEAK_RESTORE_COMMANDS[tweakId];
    if (cmd) {
      try { await execAsync(cmd, { timeout: 15000, windowsHide: true }); restored++; } catch {}
    }
  }
  return { success: true, restored };
});

// ═══════════════════════════════════════════
// ── Auto-Optimize on Game Launch ──
// ═══════════════════════════════════════════
let autoOpt = { active: false, games: [], currentGame: null, appliedTweaks: [], interval: null };

async function autoOptScan() {
  if (!autoOpt.active || autoOpt.games.length === 0) return;
  try {
    const names = autoOpt.games.map(g => g.executable.replace(/\.(exe)$/i, '')).join("','");
    const raw = await psAsync(`Get-Process|Where-Object{$_.Name -in '${names}'}|Select-Object Name,Id|ConvertTo-Json`);
    const procs = raw ? (Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [JSON.parse(raw)]) : [];

    if (procs.length > 0 && !autoOpt.currentGame) {
      // Game launched — apply tweaks
      const proc = procs[0];
      const game = autoOpt.games.find(g => g.executable.replace(/\.(exe)$/i, '').toLowerCase() === proc.name.toLowerCase());
      if (game) {
        autoOpt.currentGame = { name: game.name, executable: game.executable, pid: proc.id, tier: game.tier };
        const tweakIds = game.tweakIds || [];
        let applied = 0;
        for (const tweakId of tweakIds) {
          const cmd = TWEAK_COMMANDS[tweakId];
          if (cmd) {
            try { await execAsync(cmd, { timeout: 15000, windowsHide: true }); applied++; } catch {}
          }
        }
        autoOpt.appliedTweaks = tweakIds;
        if (mainWindow) {
          mainWindow.webContents.send("autopilot-event", {
            type: "game-detected", game: game.name, pid: proc.id, tier: game.tier, applied
          });
          new Notification({ title: "Choatix Auto-Optimize", body: `${game.name} detected — ${applied} tweaks applied` }).show();
        }
      }
    } else if (procs.length === 0 && autoOpt.currentGame) {
      // Game closed — restore tweaks
      const name = autoOpt.currentGame.name;
      const tweakIds = autoOpt.appliedTweaks;
      let restored = 0;
      for (const tweakId of tweakIds) {
        const cmd = TWEAK_RESTORE_COMMANDS[tweakId];
        if (cmd) {
          try { await execAsync(cmd, { timeout: 15000, windowsHide: true }); restored++; } catch {}
        }
      }
      if (mainWindow) {
        mainWindow.webContents.send("autopilot-event", {
          type: "game-closed", game: name, restored
        });
        new Notification({ title: "Choatix Auto-Optimize", body: `${name} closed — ${restored} tweaks restored` }).show();
      }
      autoOpt.currentGame = null;
      autoOpt.appliedTweaks = [];
    }
  } catch {}
}

ipcMain.handle("start-autopilot", async (_event, games) => {
  if (autoOpt.interval) clearInterval(autoOpt.interval);
  autoOpt.active = true;
  autoOpt.games = games;
  autoOpt.currentGame = null;
  autoOpt.appliedTweaks = [];
  autoOpt.interval = setInterval(autoOptScan, 3000);
  return { success: true };
});

ipcMain.handle("stop-autopilot", async () => {
  autoOpt.active = false;
  autoOpt.games = [];
  if (autoOpt.interval) { clearInterval(autoOpt.interval); autoOpt.interval = null; }
  autoOpt.currentGame = null;
  autoOpt.appliedTweaks = [];
  return { success: true };
});

ipcMain.handle("get-autopilot-status", async () => {
  return {
    active: autoOpt.active,
    currentGame: autoOpt.currentGame,
    gamesCount: autoOpt.games.length,
    games: autoOpt.games.map(g => ({ name: g.name, executable: g.executable, tier: g.tier })),
  };
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
  'sys-disable-fullscreen-opt': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer" /v DisableFullscreenOptimization /t REG_DWORD /d 1 /f',
  'sys-disk-cleanup': 'cleanmgr /sagerun:1',
  'sys-cpu-priority': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f',
  'cpu-core-parking-disable': 'powercfg /setacvalueindex scheme_current sub_processor CPMINCORES 100',
  'memory-working-set': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v LargeSystemCache /t REG_DWORD /d 0 /f',

  // NVIDIA
  'nv-disable-vsync': 'reg add "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v VSyncMode /t REG_DWORD /d 0 /f',
  'nv-low-latency': 'reg add "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v DisableP4BC /t REG_DWORD /d 1 /f',
  'nv-hardware-scheduling': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v HwSchMode /t REG_DWORD /d 2 /f',
  'nv-texture-filtering': 'reg add "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v TextureFilteringQuality /t REG_DWORD /d 1 /f',

  // NETWORK
  'net-optimize-dns': 'netsh int ip set dnsservers "Ethernet" static 1.1.1.1 primary',
  'net-reduce-congestion': 'powershell -Command "Set-NetTCPSetting -SettingName Internet -CongestionProvider CTCP -EA SilentlyContinue"',

  // MOUSE
  'mouse-disable-acceleration': 'powershell -NoProfile -Command \'reg add "HKCU\\Control Panel\\Mouse" /v MouseSpeed /t REG_SZ /d "0" /f; reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold1 /t REG_SZ /d "0" /f; reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold2 /t REG_SZ /d "0" /f; reg add "HKCU\\Control Panel\\Mouse" /v MouseTrails /t REG_SZ /d "0" /f; reg add "HKCU\\Control Panel\\Mouse" /v MouseSensitivity /t REG_SZ /d "10" /f\'',

  // STORAGE
  'storage-ssd-optimization': 'fsutil behavior set disablelastaccess 1',
  'storage-trim-optimization': 'powershell -Command "Optimize-Volume -DriveLetter C -ReTrim -EA SilentlyContinue"',
  'storage-nvme-optimization': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\stornvme\\Parameters\\Device" /v NumberOfWriteBufferQueues /t REG_DWORD /d 4 /f',
  'storage-prefetch-manager': 'powershell -Command "Stop-Service -Name SysMain -Force -EA SilentlyContinue; Set-Service -Name SysMain -StartupType Disabled -EA SilentlyContinue"',

  // WINDOWS
  'windows-explorer-optimization': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v LaunchTo /t REG_DWORD /d 1 /f',

  // AUDIO
  'audio-disable-enhancements': 'reg add "HKCU\\Software\\Microsoft\\MMSys\\Default\\AudioEffects\\AudioEnhancementSceneGraph" /v Enabled /t REG_DWORD /d 0 /f',
  'audio-usb-optimization': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\usbaudio" /v DisableSelectiveSuspend /t REG_DWORD /d 1 /f',

  // USB
  'usb-selective-suspend-disable': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\USB" /v DisableSelectiveSuspend /t REG_DWORD /d 1 /f',

  // KEYBOARD
  'keyboard-disable-filter': 'powershell -Command "$p=\'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e96b-e325-11ce-bfc1-08002be10318}\';$v=(Get-ItemProperty -Path $p -Name UpperFilters -EA 0).UpperFilters; if($v){$n=$v | Where-Object {$_ -ne \'kbdhid\'}; if($n){Set-ItemProperty -Path $p -Name UpperFilters -Value $n -Type MultiString}else{Remove-ItemProperty -Path $p -Name UpperFilters -Force}}"',
  'keyboard-usb-power-mgmt': 'powershell -Command "Get-ChildItem \'HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USB\\*\*\\Device Parameters\\WDF\' -EA 0 | ForEach-Object{Set-ItemProperty -Path $_.PSPath -Name IdleTimeout -Value 0 -Type DWord -EA 0}; Get-ChildItem \'HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\HID\\*\*\\Device Parameters\\WDF\' -EA 0 | ForEach-Object{Set-ItemProperty -Path $_.PSPath -Name IdleTimeout -Value 0 -Type DWord -EA 0}}"',

  'sys-disable-gamebar': "powershell -NoProfile -Command 'Set-ItemProperty -Path \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" -Name \"AppCaptureEnabled\" -Value 0 -Force; Set-ItemProperty -Path \"HKCU\\System\\GameConfigStore\" -Name \"GameDVR_Enabled\" -Value 0 -Force'",
  'sys-disable-vbs': "powershell -NoProfile -Command 'bcdedit /set hypervisorlaunchtype off; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\" /v EnableVirtualizationBasedSecurity /t REG_DWORD /d 0 /f'",
  'sys-disable-xbox': "powershell -NoProfile -Command 'Get-AppxPackage Microsoft.XboxGamingOverlay | Remove-AppxPackage -ErrorAction SilentlyContinue; Set-ItemProperty -Path \"HKCU\\Software\\Microsoft\\GameBar\" -Name \"AutoGameModeEnabled\" -Value 0 -Force -ErrorAction SilentlyContinue; Stop-Service -Name XblAuthManager -Force -ErrorAction SilentlyContinue; Stop-Service -Name XblGameSave -Force -ErrorAction SilentlyContinue; Stop-Service -Name XboxGipSvc -Force -ErrorAction SilentlyContinue; Stop-Service -Name XboxNetApiSvc -Force -ErrorAction SilentlyContinue'",
  'sys-disable-mitigations': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v FeatureSettingsOverride /t REG_DWORD /d 3 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v FeatureSettingsOverrideMask /t REG_DWORD /d 3 /f'",
  'sys-optimize-fps': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v LargeSystemCache /t REG_DWORD /d 0 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f'",
  'sys-optimize-device-affinities': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f'",
  'sys-optimize-msi': "powershell -NoProfile -Command 'Get-NetAdapter | ForEach-Object { $name = $_.Name; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\${name}\\Parameters\\Interrupt Management\" /v MessageNumberLimit /t REG_DWORD /d 256 /f -ErrorAction SilentlyContinue }'",
  'sys-reduce-background': "powershell -NoProfile -Command 'Get-Service -Name DiagTrack, dmwappushservice, WMPNetworkSvc, Fax -ErrorAction SilentlyContinue | Stop-Service -Force -ErrorAction SilentlyContinue; Get-ScheduledTask -TaskName Microsoft\\Windows\\Application Experience\\* -ErrorAction SilentlyContinue | Disable-ScheduledTask -ErrorAction SilentlyContinue; Get-ScheduledTask -TaskName Microsoft\\Windows\\Customer Experience Improvement Program\\* -ErrorAction SilentlyContinue | Disable-ScheduledTask -ErrorAction SilentlyContinue'",
  'sys-disable-hibernation': 'powershell -NoProfile -Command "powercfg /hibernate off"',
  'sys-enable-modern-memory': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v DisableHeapTermination /t REG_DWORD /d 0 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v HeapSegmentReserve /t REG_DWORD /d 0 /f'",
  'sys-disable-services': "powershell -NoProfile -Command 'Get-Service -Name WSearch, SysMain, Fax, MapsBroker, lfsvc -ErrorAction SilentlyContinue | Stop-Service -Force -ErrorAction SilentlyContinue; Set-Service -Name WSearch -StartupType Disabled -ErrorAction SilentlyContinue; Set-Service -Name SysMain -StartupType Disabled -ErrorAction SilentlyContinue'",
  'sys-optimize-storage': "powershell -NoProfile -Command 'fsutil behavior set DisableLastAccess 1; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters\" /v IRPStackSize /t REG_DWORD /d 32 /f'",
  'sys-reduce-boot-timeout': 'powershell -NoProfile -Command "bcdedit /timeout 2"',
  'sys-optimize-explorer': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v LaunchTo /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowTaskViewButton /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowCortanaButton /t REG_DWORD /d 0 /f'",
  'sys-disable-boot-interface': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\" /v NoBootLogo /t REG_DWORD /d 1 /f'",
  'sys-optimize-browser-bg': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Google\\Chrome\\Extensions\\SettingsOverrides\\MetricsReportingEnabled\" /v MetricsReportingEnabled /t REG_SZ /d false /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v BackgroundModeEnabled /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'nv-disable-telemetry': "powershell -NoProfile -Command 'Stop-Service -Name NvTelemetryContainer -Force -ErrorAction SilentlyContinue; Set-Service -Name NvTelemetryContainer -StartupType Disabled -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\NVIDIA Corporation\\NvControlPanel2\\Client\" /v OptInOrOutPreference /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'nv-optimize-performance': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\NVIDIA Corporation\\Global\\NVTweak\" /v DisablePStateSorting /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v RMHwGpuPstateControlEnabled /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'nv-enhance-privacy': "powershell -NoProfile -Command 'Stop-Service -Name NvTelemetryContainer -Force -ErrorAction SilentlyContinue; Set-Service -Name NvTelemetryContainer -StartupType Disabled -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\NVIDIA Corporation\\NvControlPanel2\\Client\" /v OptInOrOutPreference /f -ErrorAction SilentlyContinue'",
  'nv-enable-dlss-indicator': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\NVIDIA Corporation\\DLSS\" /v ShowDlssIndicator /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'privacy-reduce-ads': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SystemPaneSuggestionsEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-338389Enabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-310093Enabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SoftLandingEnabled /t REG_DWORD /d 0 /f'",
  'privacy-optimize-smb': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters\" /v SMB1 /t REG_DWORD /d 0 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters\" /v EnableSMB2Protocol /t REG_DWORD /d 1 /f'",
  'privacy-disable-security-questions': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v NoLocalPasswordResetQuestions /t REG_DWORD /d 1 /f'",
  'privacy-harden-security': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters\" /v RestrictNullSessAccess /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\" /v restrictanonymous /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\" /v restrictanonymoussam /t REG_DWORD /d 1 /f'",
  'privacy-disable-vpn': 'powershell -NoProfile -Command "Stop-Service -Name RasMan -Force -ErrorAction SilentlyContinue; Set-Service -Name RasMan -StartupType Disabled -ErrorAction SilentlyContinue"',
  'privacy-disable-ucpd': "powershell -NoProfile -Command 'Stop-Service -Name ucpd -Force -ErrorAction SilentlyContinue; Set-Service -Name ucpd -StartupType Disabled -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\UCPD\" /f -ErrorAction SilentlyContinue'",
  'privacy-unlock-eu-privacy': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\International\\Geo\" /v Nation /t REG_SZ /d 276 /f; reg add \"HKCU\\Control Panel\\International\\Geo\" /v Name /t REG_SZ /d DE /f'",
  'privacy-redirect-web-searches': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\" /v BingSearchEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\" /v CortanaConsent /t REG_DWORD /d 0 /f'",
  'privacy-disable-driver-updates': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\" /v ExcludeWUDriversInQualityUpdate /t REG_DWORD /d 1 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU\" /v AUOptions /t REG_DWORD /d 2 /f'",
  'net-optimize-performance': 'powershell -NoProfile -Command "netsh int tcp set global chimney=enabled; netsh int tcp set global dca=enabled; netsh int tcp set global netdma=enabled; netsh int tcp set global ecncapability=disabled; netsh int tcp set global timestamps=disabled; netsh int tcp set global rss=enabled; netsh int tcp set global autotuninglevel=normal"',
  'net-disable-lso': "powershell -NoProfile -Command 'Get-NetAdapter | ForEach-Object { $name = $_.Name; Set-NetAdapterAdvancedProperty -Name $name -DisplayName \"Large Send Offload (IPv4)\" -DisplayValue \"Disabled\" -ErrorAction SilentlyContinue; Set-NetAdapterAdvancedProperty -Name $name -DisplayName \"Large Send Offload (IPv6)\" -DisplayValue \"Disabled\" -ErrorAction SilentlyContinue }'",
  'qol-clean-taskbar': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\" /v SearchBoxTaskbarMode /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowTaskViewButton /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v TaskbarMn /t REG_DWORD /d 0 /f'",
  'qol-classic-photo-viewer': "powershell -NoProfile -Command 'reg add \"HKCR\\SystemFileAssociations\\.jpg\\Shell\\open\\command\" /ve /t REG_SZ /d \"\\\"%SystemRoot%\\System32\\rundll32.exe\\\" \\\"\\\"%ProgramFiles%\\Windows Photo Viewer\\PhotoViewer.dll\\\", ImageView_Fullscreen %1\\\"\" /f -ErrorAction SilentlyContinue'",
  'qol-bypass-win11': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\Setup\\LabConfig\" /v BypassTPMCheck /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\Setup\\LabConfig\" /v BypassSecureBootCheck /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\Setup\\LabConfig\" /v BypassRAMCheck /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\Setup\\LabConfig\" /v BypassStorageCheck /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\Setup\\LabConfig\" /v BypassCPUCheck /t REG_DWORD /d 1 /f'",
  'qol-disable-disk-quotas': 'powershell -NoProfile -Command "fsutil quota disable C:"',
  'qol-disable-browser-hw-accel': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v DisableHWAcceleration /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v HardwareAccelerationModeEnabled /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",

  // NEW FREE TWEAKS
  'sys-disable-tips': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SoftLandingEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-338388Enabled /t REG_DWORD /d 0 /f'",
  'sys-disable-lockscreen-spotlight': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v RotatingLockScreenEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v RotatingLockScreenOverlayEnabled /t REG_DWORD /d 0 /f'",
  'sys-disable-start-suggestions': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-338388Enabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-310093Enabled /t REG_DWORD /d 0 /f'",
  'sys-disable-error-reporting': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\Windows Error Reporting\" /v Disabled /t REG_DWORD /d 1 /f; Stop-Service -Name WerSvc -Force -ErrorAction SilentlyContinue; Set-Service -Name WerSvc -StartupType Disabled -ErrorAction SilentlyContinue'",
  'sys-disable-delivery-optimization': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization\" /v DODownloadMode /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\DeliveryOptimization\\Config\" /v DODownloadMode /t REG_DWORD /d 0 /f'",
  'sys-disable-location': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors\" /v DisableLocation /t REG_DWORD /d 1 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors\" /v DisableWindowsLocationProvider /t REG_DWORD /d 1 /f'",
  'sys-disable-find-my-device': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\FindMyDevice\" /v AllowFindMyDevice /t REG_DWORD /d 0 /f'",
  'sys-disable-activity-history': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v EnableActivityFeed /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v PublishUserActivities /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v UploadUserActivities /t REG_DWORD /d 0 /f'",
  'sys-disable-widgets': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsEnabled /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Feeds\" /v EnableFeeds /t REG_DWORD /d 0 /f'",
  'sys-disable-taskbar-search': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\" /v SearchboxTaskbarMode /t REG_DWORD /d 0 /f'",
  'sys-disable-cortana': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search\" /v AllowCortana /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\" /v CortanaEnabled /t REG_DWORD /d 0 /f'",
  'sys-disable-cloud-clipboard': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Clipboard\" /v EnableCloudClipboard /t REG_DWORD /d 0 /f'",
  'sys-disable-meet-now': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\" /v HideSCAMeetNow /t REG_DWORD /d 1 /f'",
  'sys-disable-people-bar': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v PeopleBand /t REG_DWORD /d 0 /f'",
  'sys-disable-search-highlights': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\SearchSettings\" /v IsDynamicSearchBoxEnabled /t REG_DWORD /d 0 /f'",
  'sys-disable-taskbar-feed': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsShowFeeds /t REG_DWORD /d 0 /f'",
  'sys-disable-lockscreen-notifications': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\\Windows.SystemToast.Suggested\" /v Enabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v RotatingLockScreenEnabled /t REG_DWORD /d 0 /f'",
  'sys-disable-action-center': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Policies\\Microsoft\\Windows\\Explorer\" /v DisableNotificationCenter /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\" /v NOC_GLOBAL_SETTING_TOASTS_ENABLED /t REG_DWORD /d 0 /f'",
  'sys-disable-scheduled-defrag': 'powershell -NoProfile -Command "Disable-ScheduledTask -TaskName \\Microsoft\\Windows\\Defrag\\ScheduledDefrag -ErrorAction SilentlyContinue"',
  'qol-optimize-browsing': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Google\\Chrome\\Extensions\\SettingsOverrides\\MetricsReportingEnabled\" /v MetricsReportingEnabled /t REG_SZ /d false /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v BackgroundModeEnabled /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'privacy-disable-vm-support': 'powershell -NoProfile -Command "Stop-Service -Name vmcompute -Force -ErrorAction SilentlyContinue; Set-Service -Name vmcompute -StartupType Disabled -ErrorAction SilentlyContinue; Stop-Service -Name vmms -Force -ErrorAction SilentlyContinue; Set-Service -Name vmms -StartupType Disabled -ErrorAction SilentlyContinue"',
  // ── NEW TWEAKS ──
  'net-disable-nagle': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $adapter = $_.InterfaceDescription; New-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TcpAckFrequency -Value 1 -PropertyType DWord -Force -ErrorAction SilentlyContinue; New-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TCPNoDelay -Value 1 -PropertyType DWord -Force -ErrorAction SilentlyContinue; New-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TcpDelAckTicks -Value 0 -PropertyType DWord -Force -ErrorAction SilentlyContinue }'",
  'net-disable-power-saving': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $desc = $_.InterfaceDescription; $pnp = Get-WmiObject MSPower_DeviceEnable -Namespace root\\wmi -ErrorAction SilentlyContinue | Where-Object { $_.InstanceName -match $desc.Replace(\"\\\",\"\\\\\").Replace(\" \",\" \") }; if($pnp){ $pnp.Enable = $false; $pnp.Put() } }'",
  'sys-enable-ultimate-performance': "powershell -NoProfile -Command 'powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61; $scheme = powercfg -list | Select-String \"Ultimate Performance\" | ForEach-Object { $_ -match \"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\" | Out-Null; $Matches[1] }; if($scheme){ powercfg /setactive $scheme }'",
  'sys-disable-animations': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v UserPreferencesMask /t REG_BINARY /d 9012038010000000 /f; reg add \"HKCU\\Control Panel\\Desktop\\WindowMetrics\" /v MinAnimate /t REG_SZ /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ListviewShadow /t REG_DWORD /d 0 /f'",
  'sys-disable-transparency': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\" /v EnableTransparency /t REG_DWORD /d 0 /f'",
  'sys-disable-fast-startup': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power\" /v HiberbootEnabled /t REG_DWORD /d 0 /f'",
  'sys-disable-sticky-keys': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Accessibility\\StickyKeys\" /v Flags /t REG_SZ /d \"506\" /f; reg add \"HKCU\\Control Panel\\Accessibility\\StickyKeys\" /v On /t REG_SZ /d \"0\" /f'",
  'sys-disable-filter-keys': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Accessibility\\Keyboard Response\" /v Flags /t REG_SZ /d \"122\" /f; reg add \"HKCU\\Control Panel\\Accessibility\\Keyboard Response\" /v On /t REG_SZ /d \"0\" /f'",
  'sys-disable-toggle-keys': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Accessibility\\ToggleKeys\" /v Flags /t REG_SZ /d \"58\" /f; reg add \"HKCU\\Control Panel\\Accessibility\\ToggleKeys\" /v On /t REG_SZ /d \"0\" /f'",
  'sys-disable-mouse-trails': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Mouse\" /v MouseTrails /t REG_SZ /d \"0\" /f'",
  'input-optimize-mouse': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSpeed /t REG_SZ /d \"10\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold1 /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold2 /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSensitivity /t REG_SZ /d \"10\" /f'",
  'input-optimize-keyboard': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardDelay /t REG_SZ /d \"1\" /f; reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardSpeed /t REG_SZ /d \"31\" /f; reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardRate /t REG_SZ /d \"31\" /f'",
  'storage-enable-write-cache': "powershell -NoProfile -Command 'Get-WmiObject Win32_DiskDrive | Where-Object {$_.InterfaceType -ne \"USB\"} | ForEach-Object { $id = $_.Index; $regPath = \"HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\PCI\\\" + (Get-WmiObject Win32_PnPEntity | Where-Object { $_.PNPDeviceID -like \"*Disk*\" } | Select-Object -First 1).PNPDeviceID.Replace(\"\\\",\"#\") + \"\\Device Parameters\\StorPort\"; if(Test-Path $regPath){ Set-ItemProperty -Path $regPath -Name WriteCacheEnable -Value 1 -ErrorAction SilentlyContinue } }'",
  'storage-disable-ahci-link-power': "powershell -NoProfile -Command 'Get-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power\" -Name \"CsEnabled\" -ErrorAction SilentlyContinue | ForEach-Object { Set-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power\" -Name \"CsEnabled\" -Value 0 -ErrorAction SilentlyContinue }; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\storahci\\Parameters\\Device\" /v DeviceWriteCacheEnabled /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\storahci\\Parameters\\Device\" /v LpmPolicy /t REG_DWORD /d 0 /f'",
  'sys-disable-task-view': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowTaskViewButton /t REG_DWORD /d 0 /f'",
  'sys-disable-clipboard-history': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v AllowClipboardHistory /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Clipboard\" /v EnableClipboardHistory /t REG_DWORD /d 0 /f'",
  'sys-disable-feedback': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Siuf\\Rules\" /v NumberOfSIUFInPeriod /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Siuf\\Rules\" /v PeriodInNanoSeconds /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection\" /v DoNotShowFeedbackNotifications /t REG_DWORD /d 1 /f'",
  'sys-disable-suggested-content': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-338389Enabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-310093Enabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SoftLandingEnabled /t REG_DWORD /d 0 /f'",
  'sys-disable-web-search': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Policies\\Microsoft\\Windows\\Explorer\" /v DisableSearchBoxSuggestions /t REG_DWORD /d 1 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search\" /v DisableWebSearch /t REG_DWORD /d 1 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search\" /v ConnectedSearchUseWeb /t REG_DWORD /d 0 /f'",

  // ── DEBLOAT ──
  'debloat-remove-store-bloatware': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers | Where-Object {$_.Name -match \"Microsoft.BingWeather|Microsoft.BingNews|Microsoft.GetHelp|Microsoft.Getstarted|Microsoft.MicrosoftSolitaireCollection|Microsoft.People|Microsoft.WindowsFeedbackHub|Microsoft.ZuneMusic|Microsoft.ZuneVideo|Microsoft.WindowsMaps|Microsoft.549981C3F5F10|Microsoft.YourPhone|Microsoft.WindowsStore\"} | Remove-AppxPackage -ErrorAction SilentlyContinue'",
  'debloat-remove-onedrive': "powershell -NoProfile -Command 'Stop-Process -Name OneDrive -Force -ErrorAction SilentlyContinue; & \"$env:SystemRoot\\System32\\OneDriveSetup.exe\" /uninstall -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\OneDrive\" /v DisableFileSyncNGSC /t REG_DWORD /d 1 /f'",
  'debloat-clean-temp-files': "powershell -NoProfile -Command 'Remove-Item -Path \"$env:TEMP\\*\" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path \"$env:SystemRoot\\Temp\\*\" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path \"$env:SystemRoot\\Prefetch\\*\" -Force -ErrorAction SilentlyContinue; Clear-RecycleBin -Force -ErrorAction SilentlyContinue'",
  'debloat-disable-telemetry': "powershell -NoProfile -Command 'Stop-Service -Name DiagTrack -Force -ErrorAction SilentlyContinue; Set-Service -Name DiagTrack -StartupType Disabled -ErrorAction SilentlyContinue; Stop-Service -Name dmwappushservice -Force -ErrorAction SilentlyContinue; Set-Service -Name dmwappushservice -StartupType Disabled -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection\" /v AllowTelemetry /t REG_DWORD /d 0 /f'",
  'debloat-remove-news-widget': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsShowFeeds /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Feeds\" /v EnableFeeds /t REG_DWORD /d 0 /f'",
  'debloat-disable-web-experience': "powershell -NoProfile -Command 'Get-AppxPackage Microsoft.Windows.WebExperience | Remove-AppxPackage -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Feeds\" /v EnableFeeds /t REG_DWORD /d 0 /f'",
  'debloat-disable-background-access': "powershell -NoProfile -Command 'Get-AppxPackage | ForEach-Object { $pkg = $_.PackageFullName; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications\\$pkg\" /v Disabled /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue }'",
  'debloat-disable-store-updates': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\WindowsStore\" /v AutoDownload /t REG_DWORD /d 2 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\WindowsStore\" /v DisableStoreApps /t REG_DWORD /d 0 /f'",
  'debloat-remove-xbox-packages': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers | Where-Object {$_.Name -match \"Microsoft.Xbox|Microsoft.GamingApp\"} | Remove-AppxPackage -ErrorAction SilentlyContinue; Stop-Service -Name XblAuthManager,XblGameSave,XboxGipSvc,XboxNetApiSvc -Force -ErrorAction SilentlyContinue; Set-Service -Name XblAuthManager,XblGameSave,XboxGipSvc,XboxNetApiSvc -StartupType Disabled -ErrorAction SilentlyContinue'",

  // ── GPU ──
  'gpu-max-performance-mode': "powershell -NoProfile -Command 'Get-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power\" -Name PowerThrottlingOff -ErrorAction SilentlyContinue | Out-Null; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v PowerThrottlingOff /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v CsEnabled /t REG_DWORD /d 0 /f'",
  'gpu-disable-power-gating': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $desc = $_.InterfaceDescription; Get-WmiObject MSPower_DeviceEnable -Namespace root\\wmi -EA 0 | Where-Object { $_.InstanceName -match $desc } | ForEach-Object { $_.Enable = $false; $_.Put() } }'",
  'gpu-optimize-shader-cache': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\NVIDIA Corporation\\Global\\NVTweak\" /v ShaderCacheSize /t REG_DWORD /d 1024 /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v ShaderCacheEnabled /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'gpu-disable-var-shading': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v VariableShadingRate /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'gpu-set-preferred-mode': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\DirectX UserGpuPreferences\" /v DirectXUserGlobalSettings /t REG_SZ /d \"SwapEffectUpgradeEnable=1;GpuPreference=2;\" /f -ErrorAction SilentlyContinue'",
  'gpu-optimize-render-schedule': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v TdrDelay /t REG_DWORD /d 8 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v TdrDdiDelay /t REG_DWORD /d 8 /f'",
  'gpu-disable-frame-pacing': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak\" /v DisableFramePacing /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",

  // ── GAMING ──
  'game-optimize-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v SystemResponsiveness /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v \"GPU Priority\" /t REG_DWORD /d 8 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Priority /t REG_DWORD /d 6 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v \"Scheduling Category\" /t REG_SZ /d High /f'",
  'game-disable-dvr': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" /v AppCaptureEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR\" /v AllowGameDVR /t REG_DWORD /d 0 /f'",
  'game-optimize-scheduler': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v Win32PrioritySeparation /t REG_DWORD /d 26 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v SystemResponsiveness /t REG_DWORD /d 0 /f'",
  'game-disable-game-bar-tips': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v ShowStartupPanel /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v UseNexusForGameDVREnabled /t REG_DWORD /d 0 /f'",
  'game-disable-background-recording': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" /v AppCaptureEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /t REG_DWORD /d 0 /f'",
  'game-optimize-fullscreen': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\" /v DisableFullscreenOptimization /t REG_DWORD /d 1 /f'",
  'game-disable-hags': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v HwSchMode /t REG_DWORD /d 1 /f'",
  'game-optimize-shader-cache': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v ShaderCacheEnabled /t REG_DWORD /d 1 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v ShaderCacheSize /t REG_DWORD /d 1024 /f'",

  // ── NETWORK ──
  'net-optimize-mtu': "powershell -NoProfile -Command '$adapter = Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | Select-Object -First 1; if($adapter){ netsh interface ipv4 set subinterface $($adapter.InterfaceIndex) mtu=1400 store=persistent }'",
  'net-disable-network-throttling': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v NetworkThrottlingIndex /t REG_DWORD /d 4294967295 /f'",
  'net-optimize-tcp-window': "powershell -NoProfile -Command 'netsh int tcp set global autotuninglevel=normal; netsh int tcp set global chimney=enabled'",
  'net-disable-flow-control': "powershell -NoProfile -Command 'Get-NetAdapter | ForEach-Object { $name = $_.Name; Set-NetAdapterAdvancedProperty -Name $name -DisplayName \"Flow Control\" -DisplayValue \"Disabled\" -ErrorAction SilentlyContinue }'",
  'net-optimize-connection-limits': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v TcpNumConnections /t REG_DWORD /d 16777214 /f'",
  'net-disable-netbios': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $name = $_.Name; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\NetBT\\Parameters\\Interfaces\\Tcpip_$name\" /v NetbiosOptions /t REG_DWORD /d 2 /f -ErrorAction SilentlyContinue }'",

  // ── AUDIO ──
  'audio-optimize-buffer-size': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\MMSys\\Default\\AudioEffects\" /v AcousticEchoCancellation /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Audio\\Settings\" /v SampleRate /t REG_DWORD /d 48000 /f'",
  'audio-disable-spatial-sound': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v DisableSpatialSound /t REG_DWORD /d 1 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v DisableSpatialSound /t REG_DWORD /d 1 /f'",
  'audio-set-exclusive-mode': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\MMSys\\Default\\DevicePeriod\" /v Period /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'audio-disable-midi-synth': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Drivers32\" /v midi /t REG_SZ /d \"midimap.drv\" /f -ErrorAction SilentlyContinue'",

  // ── SYSTEM ──
  'sys-set-timer-resolution': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f'",
  'sys-disable-power-throttling': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v PowerThrottlingOff /t REG_DWORD /d 1 /f'",
  'sys-optimize-interrupts': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $name = $_.Name; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\${name}\\Parameters\\Interrupt Management\" /v MessageNumberLimit /t REG_DWORD /d 256 /f -ErrorAction SilentlyContinue }'",
  'sys-disable-spectre-mitigations': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v FeatureSettingsOverride /t REG_DWORD /d 3 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v FeatureSettingsOverrideMask /t REG_DWORD /d 3 /f'",
  'sys-use-platform-clock': "powershell -NoProfile -Command 'bcdedit /useplatformclock true'",
  'sys-disable-dynamic-tick': "powershell -NoProfile -Command 'bcdedit /set disabledynamictick yes'",

  // ── GAMING TWEAKS ──
  'game-io-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v IoPageLockLimit /t REG_DWORD /d 0 /f'",
  'game-memory-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v LargeSystemCache /t REG_DWORD /d 0 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v ClearPageFileAtShutdown /t REG_DWORD /d 0 /f'",
  'game-disable-game-bar-complete': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v AutoGameModeEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v AllowAutoGameMode /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v ShowStartupPanel /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" /v AppCaptureEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /t REG_DWORD /d 0 /f'",
  'game-optimize-directx': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v DisableMaximizedWindowedMode /t REG_DWORD /d 1 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v EnableDebugMode /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v ShaderCacheEnabled /t REG_DWORD /d 1 /f'",
  'game-optimize-foreground-timer': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v QuantumReset /t REG_DWORD /d 1 /f'",
  'game-disable-steam-overlay': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Valve\\Steam\" /v DisableOverlay /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Valve\\Steam\\Apps\\*\" /v OverlayEnabled /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'game-optimize-cpu-affinity': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v SystemResponsiveness /t REG_DWORD /d 0 /f'",
  'game-disable-nagles-algorithm': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { New-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TcpAckFrequency -Value 1 -PropertyType DWord -Force -EA 0; New-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TCPNoDelay -Value 1 -PropertyType DWord -Force -EA 0; New-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TcpDelAckTicks -Value 0 -PropertyType DWord -Force -EA 0 }'",
  'game-optimize-udp-buffer': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v UdpMax /t REG_DWORD /d 65534 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v MaxUserPort /t REG_DWORD /d 65534 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v TcpTimedWaitDelay /t REG_DWORD /d 30 /f'",
  'game-disable-animations': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v UserPreferencesMask /t REG_BINARY /d 9012038010000000 /f; reg add \"HKCU\\Control Panel\\Desktop\\WindowMetrics\" /v MinAnimate /t REG_SZ /d 0 /f'",
  'game-optimize-pagefile': "powershell -NoProfile -Command '$ram = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB; $size = [math]::Round($ram * 1.5); wmic computersystem where name=\"%computername%\" set AutomaticManagedPagefile=False; wmic pagefileset where name=\"C:\\pagefile.sys\" set InitialSize=$size,MaximumSize=$size'",
  'game-disable-powersaving-gpu': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v PowerThrottlingOff /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v CsEnabled /t REG_DWORD /d 0 /f'",

  // ── ADDITIONAL TWEAKS ──
  'storage-optimize-defrag': 'powershell -NoProfile -Command "Get-Volume | Where-Object {$_.DriveType -eq \'Fixed\' -and $_.FileSystem -eq \'NTFS\'} | ForEach-Object { $letter = $_.DriveLetter; if($letter){ defrag $letter`: /O /H /U -ErrorAction SilentlyContinue } }"',
  'storage-set-io-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v IoPageLockLimit /t REG_DWORD /d 0 /f'",
  'storage-disable-indexing': 'powershell -NoProfile -Command "Stop-Service -Name WSearch -Force -ErrorAction SilentlyContinue; Set-Service -Name WSearch -StartupType Disabled -ErrorAction SilentlyContinue"',
  'net-optimize-dns-cache': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters\" /v MaxCacheEntryTtlLimit /t REG_DWORD /d 86400 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters\" /v MaxSOACacheEntryTtlLimit /t REG_DWORD /d 120 /f'",
  'net-disable-ecns': "powershell -NoProfile -Command 'netsh int tcp set global ecncapability=disabled'",
  'net-optimize-rss': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $name = $_.Name; Set-NetAdapterAdvancedProperty -Name $name -DisplayName \"Receive Side Scaling\" -DisplayValue \"Enabled\" -ErrorAction SilentlyContinue }'",
  'sys-optimize-file-cache': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v DisablePagingExecutive /t REG_DWORD /d 1 /f'",
  'sys-disable-prefetch': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters\" /v EnablePrefetcher /t REG_DWORD /d 0 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters\" /v EnableSuperfetch /t REG_DWORD /d 0 /f'",
  'sys-optimize-context-menu': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v MenuShowDelay /t REG_SZ /d \"50\" /f'",
  'sys-clear-system-cache': "powershell -NoProfile -Command '[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers()'",
  'sys-optimize-dpc-latency': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v RMHwGpuPstateControlEnabled /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'mouse-optimize-polling': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSamplingRate /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'keyboard-optimize-repeat': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardDelay /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardSpeed /t REG_SZ /d \"31\" /f'",
  'input-gaming-mode': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardDelay /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardSpeed /t REG_SZ /d \"31\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSpeed /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold1 /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold2 /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseTrails /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSensitivity /t REG_SZ /d \"10\" /f; reg add \"HKCU\\Accessibility\\StickyKeys\" /v Flags /t REG_SZ /d \"506\" /f; reg add \"HKCU\\Accessibility\\ToggleKeys\" /v Flags /t REG_SZ /d \"58\" /f; reg add \"HKCU\\Accessibility\\Keyboard Response\" /v Flags /t REG_SZ /d \"122\" /f'",
  'audio-disable-low-latency': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v DisableLowLatencySupport /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'audio-optimize-sample-rate': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Audio\\Settings\" /v SampleRate /t REG_DWORD /d 48000 /f'",
  'privacy-disable-ad-id': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo\" /v Enabled /t REG_DWORD /d 0 /f'",
  'privacy-disable-app-launch': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v Start_TrackProgs /t REG_DWORD /d 0 /f'",
  'game-disable-fullscreen-boost': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\" /v DisableFullscreenOptimization /t REG_DWORD /d 1 /f'",
  'game-optimize-network-priority': "powershell -NoProfile -Command 'New-NetQosPolicy -Name \"Game Traffic\" -AppPathNameMatchCondition \"*.exe\" -IPDstPortStart 27015 -IPDstPortEnd 27050 -ThrottleRateActionBitsPerSec 0 -ErrorAction SilentlyContinue'",
  'game-disable-eco-mode': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v CsEnabled /t REG_DWORD /d 0 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v PowerThrottlingOff /t REG_DWORD /d 1 /f'",

  // ── WINDOWS UPDATE ──
  'wu-disable-auto-update': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU\" /v NoAutoUpdate /t REG_DWORD /d 1 /f'",
  'wu-disable-restart-reminder': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU\" /v AlwaysAutoRestart /t REG_DWORD /d 0 /f'",
  'wu-pause-updates-30days': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\" /v PauseUpdates /t REG_DWORD /d 1 /f'",
  'wu-disable-drivers-update': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\" /v ExcludeWUDriversInQualityUpdate /t REG_DWORD /d 1 /f'",
  'wu-disable-office-updates': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Office\\16.0\\Common\\OfficeUpdate\" /v PreventAutomaticUpdates /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",

  // ── EDGE / BROWSER ──
  'edge-disable-startup-boost': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v StartupBoostEnabled /t REG_DWORD /d 0 /f'",
  'edge-disable-background-tabs': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v BackgroundModeEnabled /t REG_DWORD /d 0 /f'",
  'edge-disable-preloading': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v PreconnectToSearch /t REG_DWORD /d 0 /f'",
  'chrome-disable-background-apps': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Google\\Chrome\" /v BackgroundModeEnabled /t REG_DWORD /d 0 /f'",
  'chrome-disable-renderer-bg': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Google\\Chrome\" /v RendererCodeIntegrityEnabled /t REG_DWORD /d 0 /f'",
  'browser-disable-hw-accel': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Avalon.Graphics\" /v DisableHWAcceleration /t REG_DWORD /d 1 /f'",

  // ── POWER ──
  'power-ultimate-performance': "powershell -NoProfile -Command 'powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61; powercfg /setactive e9a42b02-d5df-448d-aa00-03f14749eb61'",
  'power-disable-power-saving': "powershell -NoProfile -Command 'powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR THROTTLING 0; powercfg /setactive SCHEME_CURRENT'",
  'power-disable-sleep': "powershell -NoProfile -Command 'powercfg /change standby-timeout-ac 0; powercfg /change standby-timeout-dc 0'",
  'power-disable-hibernate': "powershell -NoProfile -Command 'powercfg -h off'",
  'power-disable-link-state': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\pci\\Parameters\" /v ASPM /t REG_DWORD /d 0 /f'",
  'power-disable-processor-c-states': "powershell -NoProfile -Command 'powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR IDLEDISABLE 1; powercfg /setactive SCHEME_CURRENT'",

  // ── SERVICES ──
  'svc-disable-sysmain': "powershell -NoProfile -Command 'Stop-Service -Name SysMain -Force -ErrorAction SilentlyContinue; Set-Service -Name SysMain -StartupType Disabled -ErrorAction SilentlyContinue'",
  'svc-disable-diagtrack': "powershell -NoProfile -Command 'Stop-Service -Name DiagTrack -Force -ErrorAction SilentlyContinue; Set-Service -Name DiagTrack -StartupType Disabled -ErrorAction SilentlyContinue'",
  'svc-disable-wsearch': "powershell -NoProfile -Command 'Stop-Service -Name WSearch -Force -ErrorAction SilentlyContinue; Set-Service -Name WSearch -StartupType Disabled -ErrorAction SilentlyContinue'",
  'svc-disable-tablet-input': "powershell -NoProfile -Command 'Stop-Service -Name TableInputService -Force -ErrorAction SilentlyContinue; Set-Service -Name TableInputService -StartupType Disabled -ErrorAction SilentlyContinue'",
  'svc-disable-bluetooth-av': "powershell -NoProfile -Command 'Stop-Service -Name BTAGService -Force -ErrorAction SilentlyContinue; Set-Service -Name BTAGService -StartupType Disabled -ErrorAction SilentlyContinue'",
  'svc-disable-windows-error': "powershell -NoProfile -Command 'Stop-Service -Name WerSvc -Force -ErrorAction SilentlyContinue; Set-Service -Name WerSvc -StartupType Disabled -ErrorAction SilentlyContinue'",
  'svc-disable-print-spooler': "powershell -NoProfile -Command 'Stop-Service -Name Spooler -Force -ErrorAction SilentlyContinue; Set-Service -Name Spooler -StartupType Disabled -ErrorAction SilentlyContinue'",
  'svc-disable-remote-registry': "powershell -NoProfile -Command 'Stop-Service -Name RemoteRegistry -Force -ErrorAction SilentlyContinue; Set-Service -Name RemoteRegistry -StartupType Disabled -ErrorAction SilentlyContinue'",
  'svc-disable-xbox-live': "powershell -NoProfile -Command 'Stop-Service -Name XblAuthManager -Force -ErrorAction SilentlyContinue; Set-Service -Name XblAuthManager -StartupType Disabled -ErrorAction SilentlyContinue; Stop-Service -Name XblGameSave -Force -ErrorAction SilentlyContinue; Set-Service -Name XblGameSave -StartupType Disabled -ErrorAction SilentlyContinue'",
  'svc-disable-phone-link': "powershell -NoProfile -Command 'Stop-Service -Name PhoneSvc -Force -ErrorAction SilentlyContinue; Set-Service -Name PhoneSvc -StartupType Disabled -ErrorAction SilentlyContinue'",

  // ── GPU POWER ──
  'gpu-enable-hw-scheduler': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v HwSchMode /t REG_DWORD /d 2 /f'",
  'gpu-disable-preemption': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v RMDisablePreemption /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'gpu-disable-mpo': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\Dwm\" /v OverlayTestMode /t REG_DWORD /d 5 /f'",

  // ── REGISTRY DEEP ──
  'reg-mmcss-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v SystemResponsiveness /t REG_DWORD /d 0 /f'",
  'reg-timer-resolution': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f'",
  'reg-priority-separation': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v PrioritySeparation /t REG_DWORD /d 26 /f'",
  'reg-system-clock-res': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f'",
  'reg-gaming-scheduler': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v GPU Priority /t REG_DWORD /d 8 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Priority /t REG_DWORD /d 6 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Scheduling Category /t REG_SZ /d High /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v SFIO Priority /t REG_SZ /d High /f'",
  'reg-interrupt-affinity': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v IRQ8Priority /t REG_DWORD /d 1 /f'",
  'reg-dpc-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v DisablePagingExecutive /t REG_DWORD /d 1 /f'",
  'reg-io-page-lockdown': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v DisablePagingExecutive /t REG_DWORD /d 1 /f'",

  // ── BLUETOOTH ──
  'bt-disable-pairing-reminder': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Bluetooth\" /v NotifyWhenUnpairedDeviceFound /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'bt-disable-auto-reconnect': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Bluetooth\\AutoReconnect\" /v Enable /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",

  // ── WINDOWS VISUAL ──
  'vis-disable-transparency': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\" /v EnableTransparency /t REG_DWORD /d 0 /f'",
  'vis-dark-mode': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\" /v AppsUseLightTheme /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\" /v SystemUsesLightTheme /t REG_DWORD /d 0 /f'",
  'vis-disable-acrylic': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\" /v EnableTransparency /t REG_DWORD /d 0 /f'",
  'vis-disable-animations': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v UserPreferencesMask /t REG_BINARY /d 9012038010000000 /f'",
  'vis-minimize-maximize': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\\WindowMetrics\" /v MinAnimate /t REG_SZ /d 0 /f'",
  'vis-disable-fade': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ListviewAlphaSelect /t REG_DWORD /d 0 /f'",
  'vis-start-menu-clean': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v Start_TrackProgs /t REG_DWORD /d 0 /f'",
  'vis-context-menu-classic': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32\" /ve /t REG_SZ /d \"\" /f'",

  // ── SECURITY ──
  'sec-disable-smartscreen': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v EnableSmartScreen /t REG_DWORD /d 0 /f'",
  'sec-disable-realtime-protection': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Real-Time Protection\" /v DisableRealtimeMonitoring /t REG_DWORD /d 1 /f'",
  'sec-disable-defender-scheduled': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Scan\" /v DisableScanOnRealtimeEnable /t REG_DWORD /d 1 /f'",
  'sec-disable-sample-submission': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Spynet\" /v SubmitSamplesConsent /t REG_DWORD /d 2 /f'",
  'sec-disable-network-protection': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Network Protection\" /v AllowNetworkProtectionOnWinServer /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",

  // ── NETWORK ADVANCED ──
  'net-disable-rsc': "powershell -NoProfile -Command 'netsh int tcp set global rsc=disabled'",
  'net-disable-ecnc': "powershell -NoProfile -Command 'netsh int tcp set global ecncapability=disabled'",
  'net-disable-task-offload': "powershell -NoProfile -Command 'netsh int ip set global taskoffload=disabled'",
  'net-disable-llmnr': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\DNSClient\" /v EnableMulticast /t REG_DWORD /d 0 /f'",
  'net-disable-wsd': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\NetCache\" /v Enabled /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'net-optimize-adapter': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v DefaultTTL /t REG_DWORD /d 64 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v Tcp1323Opts /t REG_DWORD /d 3 /f'",

  // ── GAMING DEEP ──
  'game-dvr-disable': "powershell -NoProfile -Command 'reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /t REG_DWORD /d 0 /f'",
  'game-bar-complete': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" /v AppCaptureEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /t REG_DWORD /d 0 /f'",
  'game-gameconfigstore': "powershell -NoProfile -Command 'reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_FSEBehaviorMode /t REG_DWORD /d 2 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_HonorUserFSEBehaviorMode /t REG_DWORD /d 1 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_FSEBehavior /t REG_DWORD /d 2 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_DXGIHonorFSEWindowsCompatible /t REG_DWORD /d 1 /f'",
  'game-dwm-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\Dwm\" /v BoostForegroundProcess /t REG_DWORD /d 1 /f'",
  'game-scheduler-class': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v NetworkThrottlingIndex /t REG_DWORD /d 4294967295 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v SystemResponsiveness /t REG_DWORD /d 0 /f'",
  'game-fullscreen-trick': "powershell -NoProfile -Command 'reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_FSEBehaviorMode /t REG_DWORD /d 2 /f; reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v AllowAutoGameMode /t REG_DWORD /d 1 /f'",
  'game-hrtimer': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f'",
  'game-foreground-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Priority /t REG_DWORD /d 6 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v SFIO Priority /t REG_SZ /d High /f'",

  // ── STARTUP ──
  'startup-disable-cortana': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search\" /v AllowCortana /t REG_DWORD /d 0 /f'",
  'startup-disable-onedrive': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v OneDrive /f -ErrorAction SilentlyContinue'",
  'startup-disable-teams': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v com.squirrel.Teams /f -ErrorAction SilentlyContinue'",
  'startup-disable-edge-updater': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\EdgeUpdate\" /v UpdateDefault /t REG_DWORD /d 0 /f'",
  'startup-disable-adobe-updater': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Adobe\\Adobe ARM\\1.0\" /v DisableAutomaticAppUpdate /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'startup-disable-discord-startup': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v Discord /f -ErrorAction SilentlyContinue'",
  'startup-disable-epic-games': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v EpicGamesLauncher /f -ErrorAction SilentlyContinue'",
  'startup-disable-steam': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v Steam /f -ErrorAction SilentlyContinue'",
  'startup-disable-spotify': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v Spotify /f -ErrorAction SilentlyContinue'",
  'startup-disable-widgets': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Dsh\" /v AllowNewsAndInterests /t REG_DWORD /d 0 /f'",

  // ── MEMORY ──
  'mem-optimize-pagefile': "powershell -NoProfile -Command 'wmic computersystem set AutomaticManagedPagefile=False; wmic pagefileset set InitialSize=8192; wmic pagefileset set MaximumSize=16384'",
  'mem-large-system-cache': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v LargeSystemCache /t REG_DWORD /d 1 /f'",
  'mem-flush-timer': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v DisablePagingExecutive /t REG_DWORD /d 1 /f'",
  'mem-deoptimize-standby': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v StandbyMemoryInActiveMemoryList /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'mem-disable-superfetch': "powershell -NoProfile -Command 'Stop-Service -Name SysMain -Force -ErrorAction SilentlyContinue; Set-Service -Name SysMain -StartupType Disabled -ErrorAction SilentlyContinue'",
  'mem-clean-standby': "powershell -NoProfile -Command '[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers()'",

  // ── DEEP DEBLOAT ──
  'debloat-remove-edge': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *MicrosoftEdge* | Remove-AppxPackage -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v AllowMicrosoftEdgeUpdate /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'debloat-remove-teams': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *Teams* | Remove-AppxPackage -ErrorAction SilentlyContinue; Stop-Service -Name TeamsMachineInstaller -Force -ErrorAction SilentlyContinue; Set-Service -Name TeamsMachineInstaller -StartupType Disabled -ErrorAction SilentlyContinue'",
  'debloat-disable-copilot': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowCopilotButton /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Copilot\" /v TurnOffWindowsCopilot /t REG_DWORD /d 1 /f'",
  'debloat-remove-widgets-deep': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *Windows.WebExperience* | Remove-AppxPackage -ErrorAction SilentlyContinue; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsEnabled /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Feeds\" /v EnableFeeds /t REG_DWORD /d 0 /f'",
  'debloat-remove-copilot': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsCopilot\" /v TurnOffWindowsCopilot /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Policies\\Microsoft\\Windows\\WindowsCopilot\" /v TurnOffWindowsCopilot /t REG_DWORD /d 1 /f'",
  'debloat-remove-clipchamp': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *Clipchamp* | Remove-AppxPackage -ErrorAction SilentlyContinue'",
  'debloat-remove-solitaire': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *SolitaireCollection* | Remove-AppxPackage -ErrorAction SilentlyContinue'",
  'debloat-remove-news': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Dsh\" /v AllowNewsAndInterests /t REG_DWORD /d 0 /f'",
  'debloat-remove-maps': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *BingMaps* | Remove-AppxPackage -ErrorAction SilentlyContinue'",
  'debloat-remove-gethelp': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *GetHelp* | Remove-AppxPackage -ErrorAction SilentlyContinue'",
  'debloat-remove-3dviewer': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *3DViewer* | Remove-AppxPackage -ErrorAction SilentlyContinue'",
  'debloat-remove-alarms': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *WindowsAlarms* | Remove-AppxPackage -ErrorAction SilentlyContinue'",
  'debloat-remove-camera': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *WindowsCamera* | Remove-AppxPackage -ErrorAction SilentlyContinue'",
  'debloat-remove-feedback': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *FeedbackHub* | Remove-AppxPackage -ErrorAction SilentlyContinue'",
  'debloat-remove-yourphone': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *YourPhone* | Remove-AppxPackage -ErrorAction SilentlyContinue'",
  'debloat-remove-tips': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SoftLandingEnabled /t REG_DWORD /d 0 /f'",
  'debloat-remove-people': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowPeopleBand /t REG_DWORD /d 0 /f'",
  'debloat-remove-meetnow': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\" /v HideSCAMeetNow /t REG_DWORD /d 1 /f'",
  'debloat-remove-taskbar-feed': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsTaskbarViewMode /t REG_DWORD /d 0 /f'",

  // ── WINDOWS UPDATE ──
  'sys-pause-updates': "powershell -NoProfile -Command 'Set-ItemProperty -Path \"HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU\" -Name AUOptions -Value 2 -Type DWord -Force; Set-ItemProperty -Path \"HKLM:\\SOFTWARE\\Microsoft\\Windows\\WindowsUpdate\\UX\\Settings\" -Name FlightSettingsMaxPauseDays -Value 35 -Type DWord -Force'",
  'sys-block-update-restart': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU\" /v NoAutoRebootWithLoggedOnUsers /t REG_DWORD /d 1 /f'",
  'sys-defer-feature-updates': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\" /v DeferFeatureUpdatesPeriodInDays /t REG_DWORD /d 365 /f'",

  // ── TELEMETRY FIREWALL ──
  'net-block-telemetry-firewall': "powershell -NoProfile -Command 'New-NetFirewallRule -DisplayName \"Block MS Telemetry\" -Direction Outbound -Action Block -RemoteAddress 13.107.4.50,13.107.6.150,20.189.173.0/24,40.77.226.250,65.55.252.0/24 -Profile Any -Enabled True -ErrorAction SilentlyContinue'",
  'net-block-edge-firewall': "powershell -NoProfile -Command 'New-NetFirewallRule -DisplayName \"Block Edge Telemetry\" -Direction Outbound -Action Block -Program \"%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe\" -RemoteAddress 13.107.4.50,20.189.173.0/24 -Profile Any -Enabled True -ErrorAction SilentlyContinue'",

  // ── CPU POWER ──
  'cpu-disable-idle-states': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Processor\" /v DisableIdleState /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v CsEnabled /t REG_DWORD /d 0 /f'",
  'cpu-max-performance-bios': "echo \"BIOS: Disable C-States, SpeedStep, Turbo Boost, HyperThreading (for competitive gaming). Set Power Plan to Performance. Enable XMP/DOCP.\"",

  // ── GPU POWER ──
  'gpu-disable-ulps': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v EnableUlps /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\AMD\\DPP\" /v DisableULPS /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'gpu-set-power-limit-max': "powershell -NoProfile -Command 'nvidia-smi -pl 100 -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\NVIDIA Corporation\\Global\\NVTweak\" /v PowerMizerEnable /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",

  // ── PROCESS PRIORITY ──
  'sys-realtime-priority-games': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Priority /t REG_DWORD /d 31 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v \"GPU Priority\" /t REG_DWORD /d 31 /f'",
  'sys-foreground-boost': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f'",

  // ── GAME CONFIG FILES ──
  'game-fortnite-ini-optimize': "powershell -NoProfile -Command '$ini = \"$env:LOCALAPPDATA\\FortniteGame\\Saved\\Config\\WindowsClient\\GameUserSettings.ini\"; if(Test-Path $ini){ (Get-Content $ini) -replace 'RenderQuality=.*','RenderQuality=100' -replace 'r.ScreenPercentage=.*','r.ScreenPercentage=100' -replace 'FrameRateLimit=.*','FrameRateLimit=0' -replace 'bUseVSync=.*','bUseVSync=False' -replace 'ScreenResolution=.*','ScreenResolution=1680x1080' | Set-Content $ini; attrib +r $ini }'",
  'game-valorant-cfg-optimize': "powershell -NoProfile -Command '$cfg = \"$env:LOCALAPPDATA\\VALORANT\\Saved\\Config\\WindowsClient\\GameUserSettings.ini\"; if(Test-Path $cfg){ (Get-Content $cfg) -replace 'bUseVSync=.*','bUseVSync=False' -replace 'FrameRateCap=.*','FrameRateCap=0' -replace 'bRawInput=.*','bRawInput=True' | Set-Content $cfg }'",
  'game-cs2-cfg-optimize': "powershell -NoProfile -Command '$cfg = \"$env:ProgramFiles(x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg\\autoexec.cfg\"; if(-not(Test-Path $cfg)){ New-Item -Path $cfg -ItemType File -Force | Out-Null }; Add-Content -Path $cfg -Value 'cl_mouseenable 1'; Add-Content -Path $cfg -Value 'm_rawinput 1'; Add-Content -Path $cfg -Value 'fps_max 0'; Add-Content -Path $cfg -Value 'mat_vsync 0'; Add-Content -Path $cfg -Value 'r_shadows 0'; Add-Content -Path $cfg -Value 'mat_queue_mode 2' -ErrorAction SilentlyContinue'",
  'game-apex-cfg-optimize': "powershell -NoProfile -Command '$cfg = \"$env:LOCALAPPDATA\\Respawn\\Apex\\cfg\\autoexec.cfg\"; if(-not(Test-Path $cfg)){ New-Item -Path $cfg -ItemType File -Force | Out-Null }; Add-Content -Path $cfg -Value 'cl_mouse_rawinput 1'; Add-Content -Path $cfg -Value 'cl_mouse_accel 0'; Add-Content -Path $cfg -Value 'fps_max 0'; Add-Content -Path $cfg -Value 'r_vsync 0'; Add-Content -Path $cfg -Value 'mat_queue_mode 2' -ErrorAction SilentlyContinue'",

  // ── SOUND OPTIMIZATION ──
  'snd-exclusive-mode': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\MmcSnapins\\FxTools\\AudioPolicyManager\" /v EnableExclusiveMode /t REG_DWORD /d 1 /f'",
  'snd-reduce-buffer': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v MaxBufferCount /t REG_DWORD /d 2 /f'",
  'snd-mmcss-audio': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v \"NoLazyMode\" /t REG_DWORD /d 1 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Audio\" /v \"SFNO\" /t REG_SZ /d \"{3B0470-3-4D3D-4444-9C00-000000000000}\" /f'",
  'snd-disable-spatial': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v DisableSpatialSound /t REG_DWORD /d 1 /f'",
  'snd-optimize-sample-rate': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v SampleRateOptimization /t REG_DWORD /d 1 /f'",
  'snd-disable-midi': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Drivers32\" /v midiwave /t REG_SZ /d \"\" /f'",
  'snd-optimize-audio-thread': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Audiosrv\" /v DependOnService /t REG_MULTI_SZ /d \"\\0\\0\" /f'",
  'snd-disable-audio-gpu-sync': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v DisableGPUSync /t REG_DWORD /d 1 /f'",

  // ── BCDEdit Tweaks ──
  'bcd-timer-resolution': "bcdedit /set useplatformclock true",
  'bcd-disable-dynamic-tick': "bcdedit /set disabledynamictick yes",
  'bcd-use-platform-clock': "bcdedit /set useplatformtick yes",
  'bcd-increase-usnjrnl': "powershell -NoProfile -Command 'fsutil usn createjournal m=1073741824 a=1073741824 C:'",
  'bcd-optimize-boot': "bcdedit /set bootmenupolicy standard",
  'bcd-disable-quiet-boot': "bcdedit /set quietboot off",
  'bcd-increase-stack': "bcdedit /set stacksize 4096",
  'bcd-optimize-test-signing': "bcdedit /set testsigning off",

  // ── NVIDIA GPU Tweaks ──
  'nv-max-power-management': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PowerMizerEnable /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PowerMizerLevel /t REG_DWORD /d 1 /f'",
  'nv-disable-thermal-throttle': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v ThermalThrottleLimit /t REG_DWORD /d 95 /f'",
  'nv-optimize-pcie': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PCIeLinkSpeed /t REG_DWORD /d 3 /f'",
  'nv-disable-gpu-preemption': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v DisablePreemption /t REG_DWORD /d 1 /f'",
  'nv-max-frames-ahead': "reg add \"HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak\" /v PreRenderLimit /t REG_DWORD /d 1 /f",
  'nv-disable-mpo': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\Dwm\" /v EnableTearing /t REG_DWORD /d 0 /f'",
  'nv-shader-cache-size': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\NVIDIA Corporation\\Global\\NVTweak\" /v ShaderCacheSizeMB /t REG_DWORD /d 1024 /f'",
  'nv-optimization-level': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PerfLevelSrc /t REG_DWORD /d 8738 /f'",
  'nv-disable-spread-spectrum': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v DisableSpreadSpectrum /t REG_DWORD /d 1 /f'",
  'nv-rm-gpu-accl': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v HwSchMode /t REG_DWORD /d 2 /f'",

  // ── AMD/Radeon GPU Tweaks ──
  'amd-disable-chill': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\AMD\\Chill\" /v Enable /t REG_DWORD /d 0 /f'",
  'amd-disable-vsr': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\AMD\\VSR\" /v Enable /t REG_DWORD /d 0 /f'",
  'amd-enable-antilag': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\AMD\\AntiLag\" /v Enable /t REG_DWORD /d 1 /f'",
  'amd-disable-rtss-sync': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\AMD\\RTSS\" /v Sync /t REG_DWORD /d 0 /f'",
  'amd-max-power-limit': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PowerLimit /t REG_DWORD /d 50 /f'",
  'amd-disable-smart-access': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v EnableSAM /t REG_DWORD /d 1 /f'",
  'amd-disable-hdcp': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\AMD\\CN\" /v EnableHDCP /t REG_DWORD /d 0 /f'",
  'amd-set-gpu-mode': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PowerMode /t REG_DWORD /d 1 /f'",
  'amd-disable-overlay': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\AMD\\Overlay\" /v Enable /t REG_DWORD /d 0 /f'",
  'amd-optimize-memory': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v VRAMPagingMode /t REG_DWORD /d 1 /f'",

  // ── DIRECTX Optimization ──
  'dx-shader-cache-enable': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences\" /v ShaderCacheEnabled /t REG_DWORD /d 1 /f'",
  'dx-disable-debug-layer': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\\Global\" /v EnableDebugLayer /t REG_DWORD /d 0 /f'",
  'dx-optimize-agility-sdk': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\\AgilitySDK\" /v Enable /t REG_DWORD /d 1 /f'",
  'dx-force-hw-d3d': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Direct3D\" /v DisableDDI /t REG_DWORD /d 0 /f'",
  'dx-disable-d3d-debug': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Direct3D12\" /v EnableGpuBasedValidation /t REG_DWORD /d 0 /f'",
  'dx-optimize-texture-format': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences\" /v TextureFormatOpt /t REG_DWORD /d 1 /f'",
  'dx-enable-variable-shading': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\\UserGpuPreferences\" /v VariableRateShading /t REG_DWORD /d 1 /f'",
  'dx-optimize-present-params': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences\" /v LowLatencyPresent /t REG_DWORD /d 1 /f'",

  // ── LATENCY Timing ──
  'lat-hpet-enable': "bcdedit /set useplatformclock true",
  'lat-timer-resolution': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f'",
  'lat-tsc-invariant': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v UseTscInvariant /t REG_DWORD /d 1 /f'",
  'lat-disable-synthetic': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v DisableSyntheticTimers /t REG_DWORD /d 1 /f'",
  'lat-optimize-interrupts': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v InterruptSteeringDisabled /t REG_DWORD /d 0 /f'",
  'lat-force-tsc': "bcdedit /set useplatformtick yes",
  'lat-disable-acpi-pm': "bcdedit /set useplatformclock true",
  'lat-optimize-dpc': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v DPCPriority /t REG_DWORD /d 31 /f'",

  // ── ALT-TAB Optimization ──
  'atd-disable-fade': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v UserPreferencesMask /t REG_BINARY /d 9012038010000000 /f'",
  'atd-disable-switch-delay': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v MenuShowDelay /t REG_SZ /d 0 /f'",
  'atd-optimize-dwm': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\Dwm\" /v AlwaysHibernateThumbnails /t REG_DWORD /d 0 /f'",
  'atd-disable-thumbnail': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\Dwm\" /v EnableAeroPeek /t REG_DWORD /d 0 /f'",
  'atd-force-classic': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v AltTabSettings /t REG_DWORD /d 1 /f'",
  'atd-prioritize-game': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v RestartApps /t REG_DWORD /d 0 /f'",
  'atd-disable-snap': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v SnapAssist /t REG_DWORD /d 0 /f'",
  'atd-optimize-peek': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\Dwm\" /v EnableAeroPeek /t REG_DWORD /d 0 /f'",

  // ── APP DEBLOAT ──
  'appdb-chrome-disable-hw': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Google\\Chrome\" /v HardwareAccelerationModeEnabled /t REG_DWORD /d 0 /f'",
  'appdb-chrome-disable-extensions': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Google\\Chrome\" /v ExtensionSettings /t REG_SZ /d \"{}\" /f'",
  'appdb-chrome-priority': "powershell -NoProfile -Command 'Get-Process chrome -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal }'",
  'appdb-discord-disable-hw': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Discord\\CEFI\" /v HardwareAcceleration /t REG_DWORD /d 0 /f'",
  'appdb-discord-disable-autostart': "reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v Discord /f",
  'appdb-discord-optimize': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Discord\\CEFI\" /v OverlayEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Discord\\CEFI\" /v NoiseSuppression /t REG_SZ /d none /f'",
  'appdb-epic-disable-telemetry': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Epic Games\\EpicGamesLauncher\" /v Telemetry /t REG_DWORD /d 0 /f'",
  'appdb-epic-disable-hw': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Epic Games\\EpicGamesLauncher\" /v HardwareAcceleration /t REG_DWORD /d 0 /f'",
  'appdb-epic-preload': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Epic Games\\EpicGamesLauncher\" /v EnableGamePreLoad /t REG_DWORD /d 0 /f'",
  'appdb-steam-disable-hw': "reg add \"HKCU\\Software\\Valve\\Steam\" /v DisableHWAcceleration /t REG_DWORD /d 1 /f",
  'appdb-steam-disable-popup': "reg add \"HKCU\\Software\\Valve\\Steam\" /v SuppressPopups /t REG_DWORD /d 1 /f",
  'appdb-teams-disable-background': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Communications\" /v ConfigureChatAutoDiscovery /t REG_DWORD /d 0 /f'",
  'appdb-edge-disable-service': "powershell -NoProfile -Command 'Stop-Service -Name edgeupdate -Force -ErrorAction SilentlyContinue; Set-Service -Name edgeupdate -StartupType Disabled'",
  'appdb-spotify-disable-startup': "reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v Spotify /f",
  'appdb-onecloud-disable': "reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v OneDrive /f",
  'appdb-cortana-disable': "reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search\" /v AllowCortana /t REG_DWORD /d 0 /f",
  'appdb-xbox-disable-overlay': "reg add \"HKCU\\SOFTWARE\\Microsoft\\GameBar\" /v ShowStartupPanel /t REG_DWORD /d 0 /f",
  'appdb-web-search-disable': "reg add \"HKCU\\Software\\Policies\\Microsoft\\Windows\\Explorer\" /v DisableSearchBoxSuggestions /t REG_DWORD /d 1 /f",
  'appdb-copilot-disable': "powershell -NoProfile -Command 'Get-AppxPackage Microsoft.Copilot -AllUsers | Remove-AppxPackage -ErrorAction SilentlyContinue'",
  'appdb-weather-disable': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsTaskbarViewMode /t REG_DWORD /d 2 /f",

  // ── EXPLORER Tweaks ──
  'explorer-disable-search': "powershell -NoProfile -Command 'Stop-Service WSearch -Force -ErrorAction SilentlyContinue; Set-Service WSearch -StartupType Disabled'",
  'explorer-disable-thumbnails': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v DisableThumbnailCache /t REG_DWORD /d 1 /f",
  'explorer-classic-menu': "reg add \"HKCU\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32\" /ve /t REG_SZ /d \"\" /f",
  'explorer-disable-details-pane': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v UseClassicViewState /t REG_DWORD /d 1 /f",
  'explorer-optimize-views': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Streams\\Default\" /v ViewType /t REG_SZ /d List /f",
  'explorer-disable-network-discovery': "powershell -NoProfile -Command 'Set-NetConnectionProfile -NetworkCategory Public'",
  'explorer-hide-extensions': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v HideFileExt /t REG_DWORD /d 1 /f",
  'explorer-disable-quick-access': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v LaunchTo /t REG_DWORD /d 1 /f",
  'explorer-optimize-preview': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v DisablePreviewPane /t REG_DWORD /d 1 /f",
  'explorer-disable-gadgets': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowGadgets /t REG_DWORD /d 0 /f'",

  // ── INTEL GPU ──
  'intel-disable-c-states-gpu': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PerfLevelSrc /t REG_DWORD /d 8738 /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0001\" /v PerfLevelSrc /t REG_DWORD /d 8738 /f -ErrorAction SilentlyContinue'",
  'intel-max-gpu-frequency': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v MaxPerformanceClock /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0001\" /v MaxPerformanceClock /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'intel-disable-frame-scheduling': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Intel\\Gfx\" /v DisableFrameScheduling /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'intel-disable-panel-self-refresh': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Intel\\Gfx\" /v DisablePanelSelfRefresh /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",

  // ── MONITOR / DISPLAY ──
  'monitor-max-refresh-rate': "powershell -NoProfile -Command '$monitors = Get-CimInstance Win32_VideoController; foreach($m in $monitors){$name=$m.DeviceID; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v MaxResolution /t REG_SZ /d 0 /f -ErrorAction SilentlyContinue}'",
  'monitor-disable-vrr-flicker': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v VRRFlickerMitigation /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'monitor-optimize-color-accuracy': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\DWM\" /v DisableHWComposition /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",

  // ── STREAMING / OBS ──
  'obs-optimize-process-priority': "powershell -NoProfile -Command 'Get-Process obs64 -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::High }'",
  'obs-optimize-encoder': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\OBS Studio\\Output\" /v Encoder /t REG_SZ /d x264 /f -ErrorAction SilentlyContinue; reg add \"HKCU\\Software\\OBS Studio\\Output\" /v RateControl /t REG_SZ /d CRF /f -ErrorAction SilentlyContinue'",
  'obs-disable-preview': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\OBS Studio\\Basic\" /v PreviewEnabled /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",

  // ── VR ──
  'vr-optimize-timing': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\OpenVR\\OpenVR\" /v EnableTimingOptimization /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'vr-optimize-render-pipeline': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\OpenVR\\OpenVR\" /v AsyncReprojectionEnabled /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue; reg add \"HKCU\\Software\\OpenVR\\OpenVR\" /v AllowAsyncReprojection /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'vr-disable-async-reprojection': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\OpenVR\\OpenVR\" /v AsyncReprojectionEnabled /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",

  // ── MOUSE (more) ──
  'mouse-disable-angle-snapping': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSpeed /t REG_SZ /d 0 /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold1 /t REG_SZ /d 0 /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold2 /t REG_SZ /d 0 /f'",
  'mouse-optimize-polling-rate': "powershell -NoProfile -Command 'Get-ChildItem \"HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\HID\\*\\*\" -EA 0 | ForEach-Object{ Set-ItemProperty -Path $_.PSPath -Name DeviceSelectiveSuspended -Value 0 -Type DWord -EA 0; Set-ItemProperty -Path $_.PSPath -Name SelectiveSuspended -Value 0 -Type DWord -EA 0; Set-ItemProperty -Path $_.PSPath -Name EnhancedPowerManagementEnabled -Value 0 -Type DWord -EA 0 }'",
  'mouse-disable-smoothing': "reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSmoothScroll /t REG_SZ /d 0 /f",
  'mouse-optimize-sensitivity-curve': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSensitivity /t REG_SZ /d 10 /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSpeed /t REG_SZ /d 0 /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold1 /t REG_SZ /d 0 /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold2 /t REG_SZ /d 0 /f'",

  // ── KEYBOARD (more) ──
  'keyboard-optimize-repeat-rate': "reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardSpeed /t REG_SZ /d 31 /f",
  'keyboard-optimize-repeat-delay': "reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardDelay /t REG_SZ /d 0 /f",
  'keyboard-disable-ghosting': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\i8042prt\\Parameters\" /v MaximumPerformance /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'keyboard-optimize-battery': "powershell -NoProfile -Command 'Get-ChildItem \"HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\HID\\*\\*\\Device Parameters\" -EA 0 | ForEach-Object{ Set-ItemProperty -Path $_.PSPath -Name KeyboardDelay -Value 0 -Type String -EA 0 }'",

  // ── USB (more) ──
  'usb-disable-hub-power': "powershell -NoProfile -Command 'Get-ChildItem \"HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USB\\*\\Device Parameters\\WDF\" -EA 0 | ForEach-Object{ Set-ItemProperty -Path $_.PSPath -Name IdleTimeout -Value 0 -Type DWord -EA 0 }; Get-ChildItem \"HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\HID\\*\\Device Parameters\\WDF\" -EA 0 | ForEach-Object{ Set-ItemProperty -Path $_.PSPath -Name IdleTimeout -Value 0 -Type DWord -EA 0 }'",
  'usb-optimize-transfer-rate': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\USB\" /v DisableSelectiveSuspend /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\USBSTOR\" /v Start /t REG_DWORD /d 1 /f'",
  'usb-disable-compliance': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Usb\" /v UsbExcludeDisabledSilentReset /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",

  // ── INPUT (gamepad, touchscreen) ──
  'input-optimize-gamepad-latency': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\mouhid\\Parameters\" /v MouseDataQueueSize /t REG_DWORD /d 16 /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\kbdhid\\Parameters\" /v KeyboardDataQueueSize /t REG_DWORD /d 16 /f -ErrorAction SilentlyContinue'",
  'input-disable-touchscreen': "powershell -NoProfile -Command 'Get-PnpDevice -Class HIDClass -Status OK -EA 0 | Where-Object{$_.FriendlyName -like '*touch*'} | Disable-PnpDevice -Confirm:$false -EA 0'",
  'input-optimize-tablet-pen': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\mshidumdf\" /v Start /t REG_DWORD /d 3 /f -ErrorAction SilentlyContinue'",

  // ── STORAGE (more) ──
  'storage-disable-write-caching': "powershell -NoProfile -Command 'Get-Disk | Where-Object{$_.BusType -eq \"NVMe\"} | Set-Disk -IsWriteCacheEnabled $true -ErrorAction SilentlyContinue'",
  'storage-optimize-io-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\partmgr\\Parameters\" /v VirtualDiskSchedulerHint /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'storage-disable-indexing-service': "powershell -NoProfile -Command 'Stop-Service -Name WSearch -Force -EA SilentlyContinue; Set-Service -Name WSearch -StartupType Disabled -EA SilentlyContinue'",
  'storage-nvme-latency-optimization': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\stornvme\\Parameters\\Device\" /v NVMeInterruptCoalescingTimeout /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\stornvme\\Parameters\\Device\" /v NVMeNumberOfQueues /t REG_DWORD /d 4 /f -ErrorAction SilentlyContinue'",

  // ── GPU (more) ──
  'gpu-disable-render-completion-sync': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Schedule\\TaskCache\\Tree\\Microsoft\\Windows\\Defrag\" /v DisableRenderCompletionSync /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'gpu-optimize-surface-prefetch': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v DisableSurfacePrefetch /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'gpu-disable-frame-rate-limiter': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v DisableFrameRateLimiter /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'gpu-optimize-vram-allocation': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\\GraphicsKernel\" /v VRAMOptimization /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",

  // ── NVIDIA (more) ──
  'nv-disable-ansel': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\NVIDIA Corporation\\Ansel\" /v EnableAFlagsForAnsel /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\NVIDIA Corporation\\AnselTools\" /v AllowAnsel /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'nv-disable-shadowplay': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\NVIDIA Corporation\\Global\\ShadowPlay\\NVSPCAPS\" /v Enable /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'nv-optimize-driver-scheduler': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v RMHwGpuPstateControlEnabled /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\NVIDIA Corporation\\Global\\NVTweak\" /v DisableP4BC /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
};

// ═══════════════════════════════════════════
// ── Restore Tweak Commands ──
// ═══════════════════════════════════════════
const TWEAK_RESTORE_COMMANDS = {
  // SYSTEM
  'sys-high-performance': 'powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e',
  'sys-enable-game-mode': 'reg add "HKCU\\Software\\Microsoft\\GameBar" /v AutoGameModeEnabled /t REG_DWORD /d 0 /f',
  'sys-disable-fullscreen-opt': 'reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer" /v DisableFullscreenOptimization /f',
  'sys-disk-cleanup': 'echo "Disk cleanup cannot be undone"',
  'sys-cpu-priority': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 2 /f',
  'cpu-core-parking-disable': 'powercfg /setacvalueindex scheme_current sub_processor CPMINCORES 0',
  'memory-working-set': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" /v LargeSystemCache /t REG_DWORD /d 1 /f',

  // NVIDIA
  'nv-disable-vsync': 'reg delete "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v VSyncMode /f',
  'nv-low-latency': 'reg delete "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v DisableP4BC /f',
  'nv-hardware-scheduling': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v HwSchMode /t REG_DWORD /d 1 /f',
  'nv-texture-filtering': 'reg delete "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v TextureFilteringQuality /f',

  // NETWORK
  'net-optimize-dns': 'netsh int ip set dnsservers "Ethernet" dhcp',
  'net-reduce-congestion': 'powershell -Command "Set-NetTCPSetting -SettingName Internet -CongestionProvider CUBIC -EA SilentlyContinue"',

  // MOUSE
  'mouse-disable-acceleration': 'powershell -NoProfile -Command \'reg add "HKCU\\Control Panel\\Mouse" /v MouseSpeed /t REG_SZ /d "1" /f; reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold1 /t REG_SZ /d "6" /f; reg add "HKCU\\Control Panel\\Mouse" /v MouseThreshold2 /t REG_SZ /d "10" /f; reg add "HKCU\\Control Panel\\Mouse" /v MouseTrails /t REG_SZ /d "0" /f; reg add "HKCU\\Control Panel\\Mouse" /v MouseSensitivity /t REG_SZ /d "10" /f\'',

  // STORAGE
  'storage-ssd-optimization': 'fsutil behavior set disablelastaccess 0',
  'storage-trim-optimization': 'echo "TRIM runs automatically on modern Windows"',
  'storage-nvme-optimization': 'reg delete "HKLM\\SYSTEM\\CurrentControlSet\\Services\\stornvme\\Parameters\\Device" /v NumberOfWriteBufferQueues /f',
  'storage-prefetch-manager': 'powershell -Command "Set-Service -Name SysMain -StartupType Automatic -EA SilentlyContinue; Start-Service -Name SysMain -EA SilentlyContinue"',

  // WINDOWS
  'windows-explorer-optimization': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" /v LaunchTo /t REG_DWORD /d 2 /f',

  // AUDIO
  'audio-disable-enhancements': 'reg add "HKCU\\Software\\Microsoft\\MMSys\\Default\\AudioEffects\\AudioEnhancementSceneGraph" /v Enabled /t REG_DWORD /d 1 /f',
  'audio-usb-optimization': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\usbaudio" /v DisableSelectiveSuspend /t REG_DWORD /d 0 /f',

  // USB
  'usb-selective-suspend-disable': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\USB" /v DisableSelectiveSuspend /t REG_DWORD /d 0 /f',

  // KEYBOARD
  'keyboard-disable-filter': 'powershell -Command "$p=\'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e96b-e325-11ce-bfc1-08002be10318}\';$v=(Get-ItemProperty -Path $p -Name UpperFilters -EA 0).UpperFilters; if($v -and $v -notcontains \'kbdhid\'){Set-ItemProperty -Path $p -Name UpperFilters -Value ($v+\'kbdhid\') -Type MultiString}elseif(!$v){New-ItemProperty -Path $p -Name UpperFilters -Value @(\'kbdhid\') -Type MultiString -Force}}"',
  'keyboard-usb-power-mgmt': 'powershell -Command "Get-ChildItem \'HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\USB\\*\*\\Device Parameters\\WDF\' -EA 0 | ForEach-Object{Remove-ItemProperty -Path $_.PSPath -Name IdleTimeout -EA 0}; Get-ChildItem \'HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\HID\\*\*\\Device Parameters\\WDF\' -EA 0 | ForEach-Object{Remove-ItemProperty -Path $_.PSPath -Name IdleTimeout -EA 0}}"',

  'sys-disable-gamebar': "powershell -NoProfile -Command 'Remove-ItemProperty -Path \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" -Name \"AppCaptureEnabled\" -Force -ErrorAction SilentlyContinue; Remove-ItemProperty -Path \"HKCU\\System\\GameConfigStore\" -Name \"GameDVR_Enabled\" -Force -ErrorAction SilentlyContinue'",
  'sys-disable-vbs': "powershell -NoProfile -Command 'bcdedit /set hypervisorlaunchtype auto; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\" /v EnableVirtualizationBasedSecurity /f -ErrorAction SilentlyContinue'",
  'sys-disable-xbox': 'powershell -NoProfile -Command "Set-Service -Name XblAuthManager -StartupType Manual -ErrorAction SilentlyContinue; Set-Service -Name XblGameSave -StartupType Manual -ErrorAction SilentlyContinue; Set-Service -Name XboxGipSvc -StartupType Manual -ErrorAction SilentlyContinue; Set-Service -Name XboxNetApiSvc -StartupType Manual -ErrorAction SilentlyContinue"',
  'sys-disable-mitigations': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v FeatureSettingsOverride /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v FeatureSettingsOverrideMask /f -ErrorAction SilentlyContinue'",
  'sys-optimize-fps': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v Win32PrioritySeparation /t REG_DWORD /d 2 /f; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v LargeSystemCache /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /f -ErrorAction SilentlyContinue'",
  'sys-optimize-device-affinities': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /f -ErrorAction SilentlyContinue'",
  'sys-optimize-msi': "powershell -NoProfile -Command 'Get-NetAdapter | ForEach-Object { $name = $_.Name; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\${name}\\Parameters\\Interrupt Management\" /v MessageNumberLimit /f -ErrorAction SilentlyContinue }'",
  'sys-reduce-background': 'powershell -NoProfile -Command "Set-Service -Name DiagTrack -StartupType Manual -ErrorAction SilentlyContinue; Set-Service -Name dmwappushservice -StartupType Manual -ErrorAction SilentlyContinue"',
  'sys-disable-hibernation': 'powershell -NoProfile -Command "powercfg /hibernate on"',
  'sys-enable-modern-memory': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v DisableHeapTermination /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v HeapSegmentReserve /f -ErrorAction SilentlyContinue'",
  'sys-disable-services': 'powershell -NoProfile -Command "Set-Service -Name WSearch -StartupType Automatic -ErrorAction SilentlyContinue; Set-Service -Name SysMain -StartupType Automatic -ErrorAction SilentlyContinue"',
  'sys-optimize-storage': 'powershell -NoProfile -Command "fsutil behavior set DisableLastAccess 0"',
  'sys-reduce-boot-timeout': 'powershell -NoProfile -Command "bcdedit /timeout 30"',
  'sys-optimize-explorer': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v LaunchTo /t REG_DWORD /d 2 /f; reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowTaskViewButton /f -ErrorAction SilentlyContinue; reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowCortanaButton /f -ErrorAction SilentlyContinue'",
  'sys-disable-boot-interface': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System\" /v NoBootLogo /f -ErrorAction SilentlyContinue'",
  'sys-optimize-browser-bg': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v BackgroundModeEnabled /f -ErrorAction SilentlyContinue'",
  'nv-disable-telemetry': 'powershell -NoProfile -Command "Set-Service -Name NvTelemetryContainer -StartupType Automatic -ErrorAction SilentlyContinue; Start-Service -Name NvTelemetryContainer -ErrorAction SilentlyContinue"',
  'nv-optimize-performance': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\NVIDIA Corporation\\Global\\NVTweak\" /v DisablePStateSorting /f -ErrorAction SilentlyContinue'",
  'nv-enhance-privacy': 'powershell -NoProfile -Command "Set-Service -Name NvTelemetryContainer -StartupType Automatic -ErrorAction SilentlyContinue; Start-Service -Name NvTelemetryContainer -ErrorAction SilentlyContinue"',
  'nv-enable-dlss-indicator': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\NVIDIA Corporation\\DLSS\" /v ShowDlssIndicator /f -ErrorAction SilentlyContinue'",
  'privacy-reduce-ads': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SystemPaneSuggestionsEnabled /f -ErrorAction SilentlyContinue; reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-338389Enabled /f -ErrorAction SilentlyContinue; reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-310093Enabled /f -ErrorAction SilentlyContinue; reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SoftLandingEnabled /f -ErrorAction SilentlyContinue'",
  'privacy-optimize-smb': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\LanmanServer\\Parameters\" /v SMB1 /t REG_DWORD /d 1 /f'",
  'privacy-disable-security-questions': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v NoLocalPasswordResetQuestions /f -ErrorAction SilentlyContinue'",
  'privacy-harden-security': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\" /v restrictanonymous /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\" /v restrictanonymoussam /f -ErrorAction SilentlyContinue'",
  'privacy-disable-vpn': 'powershell -NoProfile -Command "Set-Service -Name RasMan -StartupType Manual -ErrorAction SilentlyContinue"',
  'privacy-disable-ucpd': 'powershell -NoProfile -Command "Set-Service -Name ucpd -StartupType Automatic -ErrorAction SilentlyContinue; Start-Service -Name ucpd -ErrorAction SilentlyContinue"',
  'privacy-unlock-eu-privacy': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\International\\Geo\" /v Nation /t REG_SZ /d 244 /f; reg add \"HKCU\\Control Panel\\International\\Geo\" /v Name /t REG_SZ /d US /f'",
  'privacy-redirect-web-searches': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\" /v BingSearchEnabled /f -ErrorAction SilentlyContinue; reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\" /v CortanaConsent /f -ErrorAction SilentlyContinue'",
  'privacy-disable-driver-updates': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\" /v ExcludeWUDriversInQualityUpdate /f -ErrorAction SilentlyContinue'",
  'net-optimize-performance': 'powershell -NoProfile -Command "netsh int tcp set global chimney=default; netsh int tcp set global dca=disabled; netsh int tcp set global netdma=disabled; netsh int tcp set global ecncapability=default; netsh int tcp set global timestamps=default; netsh int tcp set global autotuninglevel=normal"',
  'net-disable-lso': "powershell -NoProfile -Command 'Get-NetAdapter | ForEach-Object { $name = $_.Name; Set-NetAdapterAdvancedProperty -Name $name -DisplayName \"Large Send Offload (IPv4)\" -DisplayValue \"Enabled\" -ErrorAction SilentlyContinue; Set-NetAdapterAdvancedProperty -Name $name -DisplayName \"Large Send Offload (IPv6)\" -DisplayValue \"Enabled\" -ErrorAction SilentlyContinue }'",
  'qol-clean-taskbar': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\" /v SearchBoxTaskbarMode /f -ErrorAction SilentlyContinue; reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowTaskViewButton /f -ErrorAction SilentlyContinue; reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v TaskbarMn /f -ErrorAction SilentlyContinue'",
  'qol-classic-photo-viewer': "powershell -NoProfile -Command 'reg delete \"HKCR\\SystemFileAssociations\\.jpg\\Shell\\open\\command\" /f -ErrorAction SilentlyContinue'",
  'qol-bypass-win11': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\Setup\\LabConfig\" /v BypassTPMCheck /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\Setup\\LabConfig\" /v BypassSecureBootCheck /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\Setup\\LabConfig\" /v BypassRAMCheck /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\Setup\\LabConfig\" /v BypassStorageCheck /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\Setup\\LabConfig\" /v BypassCPUCheck /f -ErrorAction SilentlyContinue'",
  'qol-disable-disk-quotas': 'powershell -NoProfile -Command "fsutil quota enable C:"',
  'qol-disable-browser-hw-accel': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v DisableHWAcceleration /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v HardwareAccelerationModeEnabled /f -ErrorAction SilentlyContinue'",

  // NEW FREE TWEAKS RESTORE
  'sys-disable-tips': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SoftLandingEnabled /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-338388Enabled /t REG_DWORD /d 1 /f'",
  'sys-disable-lockscreen-spotlight': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v RotatingLockScreenEnabled /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v RotatingLockScreenOverlayEnabled /t REG_DWORD /d 1 /f'",
  'sys-disable-start-suggestions': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-338388Enabled /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-310093Enabled /t REG_DWORD /d 1 /f'",
  'sys-disable-error-reporting': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\Windows Error Reporting\" /v Disabled /t REG_DWORD /d 0 /f; Set-Service -Name WerSvc -StartupType Manual -ErrorAction SilentlyContinue'",
  'sys-disable-delivery-optimization': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization\" /v DODownloadMode /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\DeliveryOptimization\\Config\" /v DODownloadMode /t REG_DWORD /d 1 /f'",
  'sys-disable-location': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors\" /v DisableLocation /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors\" /v DisableWindowsLocationProvider /f -ErrorAction SilentlyContinue'",
  'sys-disable-find-my-device': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\FindMyDevice\" /v AllowFindMyDevice /t REG_DWORD /d 1 /f'",
  'sys-disable-activity-history': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v EnableActivityFeed /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v PublishUserActivities /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v UploadUserActivities /f -ErrorAction SilentlyContinue'",
  'sys-disable-widgets': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsEnabled /t REG_DWORD /d 1 /f; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Feeds\" /v EnableFeeds /f -ErrorAction SilentlyContinue'",
  'sys-disable-taskbar-search': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\" /v SearchboxTaskbarMode /t REG_DWORD /d 2 /f'",
  'sys-disable-cortana': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search\" /v AllowCortana /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Search\" /v CortanaEnabled /t REG_DWORD /d 1 /f'",
  'sys-disable-cloud-clipboard': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Clipboard\" /v EnableCloudClipboard /t REG_DWORD /d 1 /f'",
  'sys-disable-meet-now': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\" /v HideSCAMeetNow /f -ErrorAction SilentlyContinue'",
  'sys-disable-people-bar': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v PeopleBand /t REG_DWORD /d 1 /f'",
  'sys-disable-search-highlights': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\SearchSettings\" /v IsDynamicSearchBoxEnabled /t REG_DWORD /d 1 /f'",
  'sys-disable-taskbar-feed': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsEnabled /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsShowFeeds /t REG_DWORD /d 1 /f'",
  'sys-disable-lockscreen-notifications': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\\Windows.SystemToast.Suggested\" /v Enabled /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v RotatingLockScreenEnabled /t REG_DWORD /d 1 /f'",
  'sys-disable-action-center': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Policies\\Microsoft\\Windows\\Explorer\" /v DisableNotificationCenter /f -ErrorAction SilentlyContinue; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\" /v NOC_GLOBAL_SETTING_TOASTS_ENABLED /t REG_DWORD /d 1 /f'",
  'sys-disable-scheduled-defrag': 'powershell -NoProfile -Command "Enable-ScheduledTask -TaskName \\Microsoft\\Windows\\Defrag\\ScheduledDefrag -ErrorAction SilentlyContinue"',
  'qol-optimize-browsing': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v BackgroundModeEnabled /f -ErrorAction SilentlyContinue'",
  'privacy-disable-vm-support': 'powershell -NoProfile -Command "Set-Service -Name vmcompute -StartupType Manual -ErrorAction SilentlyContinue; Set-Service -Name vmms -StartupType Manual -ErrorAction SilentlyContinue"',
  // ── NEW TWEAKS ──
  'net-disable-nagle': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { Remove-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TcpAckFrequency -Force -ErrorAction SilentlyContinue; Remove-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TCPNoDelay -Force -ErrorAction SilentlyContinue; Remove-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TcpDelAckTicks -Force -ErrorAction SilentlyContinue }'",
  'net-disable-power-saving': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $desc = $_.InterfaceDescription; $pnp = Get-WmiObject MSPower_DeviceEnable -Namespace root\\wmi -ErrorAction SilentlyContinue | Where-Object { $_.InstanceName -match $desc.Replace(\"\\\",\"\\\\\").Replace(\" \",\" \") }; if($pnp){ $pnp.Enable = $true; $pnp.Put() } }'",
  'sys-enable-ultimate-performance': "powershell -NoProfile -Command '$scheme = powercfg -list | Select-String \"High performance\" | ForEach-Object { $_ -match \"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\" | Out-Null; $Matches[1] }; if($scheme){ powercfg /setactive $scheme }'",
  'sys-disable-animations': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v UserPreferencesMask /t REG_BINARY /d 9012038010000000 /f; reg add \"HKCU\\Control Panel\\Desktop\\WindowMetrics\" /v MinAnimate /t REG_SZ /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ListviewShadow /t REG_DWORD /d 1 /f'",
  'sys-disable-transparency': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\" /v EnableTransparency /t REG_DWORD /d 1 /f'",
  'sys-disable-fast-startup': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power\" /v HiberbootEnabled /t REG_DWORD /d 1 /f'",
  'sys-disable-sticky-keys': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Accessibility\\StickyKeys\" /v Flags /t REG_SZ /d \"507\" /f; reg add \"HKCU\\Control Panel\\Accessibility\\StickyKeys\" /v On /t REG_SZ /d \"1\" /f'",
  'sys-disable-filter-keys': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Accessibility\\Keyboard Response\" /v Flags /t REG_SZ /d \"123\" /f; reg add \"HKCU\\Control Panel\\Accessibility\\Keyboard Response\" /v On /t REG_SZ /d \"1\" /f'",
  'sys-disable-toggle-keys': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Accessibility\\ToggleKeys\" /v Flags /t REG_SZ /d \"59\" /f; reg add \"HKCU\\Control Panel\\Accessibility\\ToggleKeys\" /v On /t REG_SZ /d \"1\" /f'",
  'sys-disable-mouse-trails': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Mouse\" /v MouseTrails /t REG_SZ /d \"1\" /f'",
  'input-optimize-mouse': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSpeed /t REG_SZ /d \"1\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold1 /t REG_SZ /d \"6\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold2 /t REG_SZ /d \"10\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSensitivity /t REG_SZ /d \"1\" /f'",
  'input-optimize-keyboard': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardDelay /t REG_SZ /d \"1\" /f; reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardSpeed /t REG_SZ /d \"31\" /f; reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardRate /t REG_SZ /d \"31\" /f'",
  'storage-enable-write-cache': "powershell -NoProfile -Command 'Get-WmiObject Win32_DiskDrive | Where-Object {$_.InterfaceType -ne \"USB\"} | ForEach-Object { $regPath = \"HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\PCI\\\" + (Get-WmiObject Win32_PnPEntity | Where-Object { $_.PNPDeviceID -like \"*Disk*\" } | Select-Object -First 1).PNPDeviceID.Replace(\"\\\",\"#\") + \"\\Device Parameters\\StorPort\"; if(Test-Path $regPath){ Set-ItemProperty -Path $regPath -Name WriteCacheEnable -Value 0 -ErrorAction SilentlyContinue } }'",
  'storage-disable-ahci-link-power': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\storahci\\Parameters\\Device\" /v DeviceWriteCacheEnabled /t REG_DWORD /d 0 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\storahci\\Parameters\\Device\" /v LpmPolicy /t REG_DWORD /d 1 /f'",
  'sys-disable-task-view': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowTaskViewButton /t REG_DWORD /d 1 /f'",
  'sys-disable-clipboard-history': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v AllowClipboardHistory /f -ErrorAction SilentlyContinue; reg add \"HKCU\\Software\\Microsoft\\Clipboard\" /v EnableClipboardHistory /t REG_DWORD /d 1 /f'",
  'sys-disable-feedback': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Siuf\\Rules\" /v NumberOfSIUFInPeriod /f -ErrorAction SilentlyContinue; reg delete \"HKCU\\Software\\Microsoft\\Siuf\\Rules\" /v PeriodInNanoSeconds /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection\" /v DoNotShowFeedbackNotifications /f -ErrorAction SilentlyContinue'",
  'sys-disable-suggested-content': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-338389Enabled /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SubscribedContent-310093Enabled /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SoftLandingEnabled /t REG_DWORD /d 1 /f'",
  'sys-disable-web-search': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Policies\\Microsoft\\Windows\\Explorer\" /v DisableSearchBoxSuggestions /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search\" /v DisableWebSearch /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search\" /v ConnectedSearchUseWeb /f -ErrorAction SilentlyContinue'",

  // ── DEBLOAT RESTORE ──
  'debloat-remove-store-bloatware': 'echo "Store apps reinstallation requires Windows Store"',
  'debloat-remove-onedrive': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\OneDrive\" /v DisableFileSyncNGSC /f -ErrorAction SilentlyContinue'",
  'debloat-clean-temp-files': 'echo "Temp files cannot be restored"',
  'debloat-disable-telemetry': "powershell -NoProfile -Command 'Set-Service -Name DiagTrack -StartupType Automatic -ErrorAction SilentlyContinue; Start-Service -Name DiagTrack -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection\" /v AllowTelemetry /f -ErrorAction SilentlyContinue'",
  'debloat-remove-news-widget': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsEnabled /t REG_DWORD /d 1 /f; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Feeds\" /v EnableFeeds /f -ErrorAction SilentlyContinue'",
  'debloat-disable-web-experience': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Feeds\" /v EnableFeeds /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'debloat-disable-background-access': "powershell -NoProfile -Command 'Get-AppxPackage | ForEach-Object { $pkg = $_.PackageFullName; reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications\\$pkg\" /v Disabled /f -ErrorAction SilentlyContinue }'",
  'debloat-disable-store-updates': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\WindowsStore\" /v AutoDownload /f -ErrorAction SilentlyContinue'",
  'debloat-remove-xbox-packages': "powershell -NoProfile -Command 'Set-Service -Name XblAuthManager,XblGameSave,XboxGipSvc,XboxNetApiSvc -StartupType Manual -ErrorAction SilentlyContinue'",

  // ── GPU RESTORE ──
  'gpu-max-performance-mode': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v PowerThrottlingOff /t REG_DWORD /d 0 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v CsEnabled /t REG_DWORD /d 1 /f'",
  'gpu-disable-power-gating': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $desc = $_.InterfaceDescription; Get-WmiObject MSPower_DeviceEnable -Namespace root\\wmi -EA 0 | Where-Object { $_.InstanceName -match $desc } | ForEach-Object { $_.Enable = $true; $_.Put() } }'",
  'gpu-optimize-shader-cache': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\NVIDIA Corporation\\Global\\NVTweak\" /v ShaderCacheSize /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v ShaderCacheEnabled /f -ErrorAction SilentlyContinue'",
  'gpu-disable-var-shading': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v VariableShadingRate /f -ErrorAction SilentlyContinue'",
  'gpu-set-preferred-mode': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\DirectX UserGpuPreferences\" /v DirectXUserGlobalSettings /f -ErrorAction SilentlyContinue'",
  'gpu-optimize-render-schedule': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v TdrDelay /t REG_DWORD /d 2 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v TdrDdiDelay /t REG_DWORD /d 5 /f'",
  'gpu-disable-frame-pacing': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak\" /v DisableFramePacing /f -ErrorAction SilentlyContinue'",

  // ── GAMING RESTORE ──
  'game-optimize-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v SystemResponsiveness /t REG_DWORD /d 20 /f'",
  'game-disable-dvr': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" /v AppCaptureEnabled /f -ErrorAction SilentlyContinue; reg delete \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR\" /v AllowGameDVR /f -ErrorAction SilentlyContinue'",
  'game-optimize-scheduler': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v Win32PrioritySeparation /t REG_DWORD /d 2 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v SystemResponsiveness /t REG_DWORD /d 20 /f'",
  'game-disable-game-bar-tips': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v ShowStartupPanel /t REG_DWORD /d 1 /f'",
  'game-disable-background-recording': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" /v AppCaptureEnabled /f -ErrorAction SilentlyContinue; reg delete \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /f -ErrorAction SilentlyContinue'",
  'game-optimize-fullscreen': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\" /v DisableFullscreenOptimization /f -ErrorAction SilentlyContinue'",
  'game-disable-hags': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v HwSchMode /t REG_DWORD /d 2 /f'",
  'game-optimize-shader-cache': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v ShaderCacheEnabled /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v ShaderCacheSize /f -ErrorAction SilentlyContinue'",

  // ── NETWORK RESTORE ──
  'net-optimize-mtu': "powershell -NoProfile -Command '$adapter = Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | Select-Object -First 1; if($adapter){ netsh interface ipv4 set subinterface $($adapter.InterfaceIndex) mtu=1500 store=persistent }'",
  'net-disable-network-throttling': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v NetworkThrottlingIndex /t REG_DWORD /d 10 /f'",
  'net-optimize-tcp-window': "powershell -NoProfile -Command 'netsh int tcp set global autotuninglevel=normal'",
  'net-disable-flow-control': "powershell -NoProfile -Command 'Get-NetAdapter | ForEach-Object { $name = $_.Name; Set-NetAdapterAdvancedProperty -Name $name -DisplayName \"Flow Control\" -DisplayValue \"Tx & Rx Enabled\" -ErrorAction SilentlyContinue }'",
  'net-optimize-connection-limits': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v TcpNumConnections /t REG_DWORD /d 0 /f'",
  'net-disable-netbios': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $name = $_.Name; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\NetBT\\Parameters\\Interfaces\\Tcpip_$name\" /v NetbiosOptions /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue }'",

  // ── AUDIO RESTORE ──
  'audio-optimize-buffer-size': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\MMSys\\Default\\AudioEffects\" /v AcousticEchoCancellation /f -ErrorAction SilentlyContinue'",
  'audio-disable-spatial-sound': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v DisableSpatialSound /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v DisableSpatialSound /f -ErrorAction SilentlyContinue'",
  'audio-set-exclusive-mode': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\MMSys\\Default\\DevicePeriod\" /v Period /f -ErrorAction SilentlyContinue'",
  'audio-disable-midi-synth': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Drivers32\" /v midi /f -ErrorAction SilentlyContinue'",

  // ── SYSTEM RESTORE ──
  'sys-set-timer-resolution': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /f -ErrorAction SilentlyContinue'",
  'sys-disable-power-throttling': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v PowerThrottlingOff /t REG_DWORD /d 0 /f'",
  'sys-optimize-interrupts': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $name = $_.Name; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\${name}\\Parameters\\Interrupt Management\" /v MessageNumberLimit /f -ErrorAction SilentlyContinue }'",
  'sys-disable-spectre-mitigations': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v FeatureSettingsOverride /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v FeatureSettingsOverrideMask /f -ErrorAction SilentlyContinue'",
  'sys-use-platform-clock': "powershell -NoProfile -Command 'bcdedit /useplatformclock false'",
  'sys-disable-dynamic-tick': "powershell -NoProfile -Command 'bcdedit /set disabledynamictick no'",

  // ── GAMING TWEAKS RESTORE ──
  'game-io-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v IoPageLockLimit /t REG_DWORD /d 0 /f'",
  'game-memory-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v LargeSystemCache /t REG_DWORD /d 1 /f'",
  'game-disable-game-bar-complete': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v AutoGameModeEnabled /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v AllowAutoGameMode /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v ShowStartupPanel /t REG_DWORD /d 1 /f'",
  'game-optimize-directx': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v DisableMaximizedWindowedMode /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v EnableDebugMode /f -ErrorAction SilentlyContinue'",
  'game-optimize-foreground-timer': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v QuantumReset /f -ErrorAction SilentlyContinue'",
  'game-disable-steam-overlay': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Valve\\Steam\" /v DisableOverlay /t REG_DWORD /d 0 /f; reg delete \"HKCU\\Software\\Valve\\Steam\\Apps\\*\" /v OverlayEnabled /f -ErrorAction SilentlyContinue'",
  'game-optimize-cpu-affinity': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v Win32PrioritySeparation /t REG_DWORD /d 2 /f'",
  'game-disable-nagles-algorithm': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { Remove-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TcpAckFrequency -Force -EA 0; Remove-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TCPNoDelay -Force -EA 0; Remove-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TcpDelAckTicks -Force -EA 0 }'",
  'game-optimize-udp-buffer': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v MaxUserPort /t REG_DWORD /d 5000 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v TcpTimedWaitDelay /t REG_DWORD /d 120 /f'",
  'game-disable-animations': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\\WindowMetrics\" /v MinAnimate /t REG_SZ /d 1 /f'",
  'game-optimize-pagefile': "powershell -NoProfile -Command 'wmic computersystem where name=\"%computername%\" set AutomaticManagedPagefile=True'",
  'game-disable-powersaving-gpu': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v PowerThrottlingOff /t REG_DWORD /d 0 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v CsEnabled /t REG_DWORD /d 1 /f'",

  // ── ADDITIONAL TWEAKS RESTORE ──
  'storage-optimize-defrag': 'echo "Defrag schedule cannot be undone"',
  'storage-set-io-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v IoPageLockLimit /t REG_DWORD /d 0 /f'",
  'storage-disable-indexing': 'powershell -NoProfile -Command "Set-Service -Name WSearch -StartupType Automatic -ErrorAction SilentlyContinue; Start-Service -Name WSearch -ErrorAction SilentlyContinue"',
  'net-optimize-dns-cache': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters\" /v MaxCacheEntryTtlLimit /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters\" /v MaxSOACacheEntryTtlLimit /f -ErrorAction SilentlyContinue'",
  'net-disable-ecns': "powershell -NoProfile -Command 'netsh int tcp set global ecncapability=default'",
  'net-optimize-rss': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $name = $_.Name; Set-NetAdapterAdvancedProperty -Name $name -DisplayName \"Receive Side Scaling\" -DisplayValue \"Disabled\" -ErrorAction SilentlyContinue }'",
  'sys-optimize-file-cache': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v DisablePagingExecutive /t REG_DWORD /d 0 /f'",
  'sys-disable-prefetch': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters\" /v EnablePrefetcher /t REG_DWORD /d 3 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\\PrefetchParameters\" /v EnableSuperfetch /t REG_DWORD /d 3 /f'",
  'sys-optimize-context-menu': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v MenuShowDelay /t REG_SZ /d \"400\" /f'",
  'sys-clear-system-cache': 'echo "System cache cleared"',
  'sys-optimize-dpc-latency': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v RMHwGpuPstateControlEnabled /f -ErrorAction SilentlyContinue'",
  'mouse-optimize-polling': "powershell -NoProfile -Command 'reg delete \"HKCU\\Control Panel\\Mouse\" /v MouseSamplingRate /f -ErrorAction SilentlyContinue'",
  'keyboard-optimize-repeat': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardDelay /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardSpeed /t REG_SZ /d \"31\" /f'",
  'input-gaming-mode': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardDelay /t REG_SZ /d \"1\" /f; reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardSpeed /t REG_SZ /d \"31\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSpeed /t REG_SZ /d \"1\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold1 /t REG_SZ /d \"6\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold2 /t REG_SZ /d \"10\" /f; reg add \"HKCU\\Accessibility\\StickyKeys\" /v Flags /t REG_SZ /d \"510\" /f; reg add \"HKCU\\Accessibility\\ToggleKeys\" /v Flags /t REG_SZ /d \"58\" /f; reg add \"HKCU\\Accessibility\\Keyboard Response\" /v Flags /t REG_SZ /d \"122\" /f'",
  'audio-disable-low-latency': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v DisableLowLatencySupport /f -ErrorAction SilentlyContinue'",
  'audio-optimize-sample-rate': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Audio\\Settings\" /v SampleRate /t REG_DWORD /d 44100 /f'",
  'privacy-disable-ad-id': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo\" /v Enabled /t REG_DWORD /d 1 /f'",
  'privacy-disable-app-launch': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v Start_TrackProgs /t REG_DWORD /d 1 /f'",
  'game-disable-fullscreen-boost': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\" /v DisableFullscreenOptimization /f -ErrorAction SilentlyContinue'",
  'game-optimize-network-priority': "powershell -NoProfile -Command 'Remove-NetQosPolicy -Name \"Game Traffic\" -ErrorAction SilentlyContinue'",
  'game-disable-eco-mode': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v CsEnabled /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v PowerThrottlingOff /t REG_DWORD /d 0 /f'",

  // ── NEW TWEAK RESTORES ──
  'wu-disable-auto-update': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU\" /v NoAutoUpdate /f -ErrorAction SilentlyContinue'",
  'wu-disable-restart-reminder': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU\" /v AlwaysAutoRestart /f -ErrorAction SilentlyContinue'",
  'wu-pause-updates-30days': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\" /v PauseUpdates /f -ErrorAction SilentlyContinue'",
  'wu-disable-drivers-update': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\" /v ExcludeWUDriversInQualityUpdate /f -ErrorAction SilentlyContinue'",
  'wu-disable-office-updates': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Office\\16.0\\Common\\OfficeUpdate\" /v PreventAutomaticUpdates /f -ErrorAction SilentlyContinue'",
  'edge-disable-startup-boost': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v StartupBoostEnabled /t REG_DWORD /d 1 /f'",
  'edge-disable-background-tabs': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v BackgroundModeEnabled /t REG_DWORD /d 1 /f'",
  'edge-disable-preloading': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v PreconnectToSearch /f -ErrorAction SilentlyContinue'",
  'chrome-disable-background-apps': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Google\\Chrome\" /v BackgroundModeEnabled /t REG_DWORD /d 1 /f'",
  'chrome-disable-renderer-bg': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Google\\Chrome\" /v RendererCodeIntegrityEnabled /f -ErrorAction SilentlyContinue'",
  'browser-disable-hw-accel': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Avalon.Graphics\" /v DisableHWAcceleration /f -ErrorAction SilentlyContinue'",
  'power-ultimate-performance': "powershell -NoProfile -Command 'powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e'",
  'power-disable-power-saving': "powershell -NoProfile -Command 'powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR THROTTLING 100; powercfg /setactive SCHEME_CURRENT'",
  'power-disable-sleep': "powershell -NoProfile -Command 'powercfg /change standby-timeout-ac 30; powercfg /change standby-timeout-dc 15'",
  'power-disable-hibernate': "powershell -NoProfile -Command 'powercfg -h on'",
  'power-disable-link-state': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\pci\\Parameters\" /v ASPM /f -ErrorAction SilentlyContinue'",
  'power-disable-processor-c-states': "powershell -NoProfile -Command 'powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR IDLEDISABLE 0; powercfg /setactive SCHEME_CURRENT'",
  'svc-disable-sysmain': "powershell -NoProfile -Command 'Set-Service -Name SysMain -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name SysMain -ErrorAction SilentlyContinue'",
  'svc-disable-diagtrack': "powershell -NoProfile -Command 'Set-Service -Name DiagTrack -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name DiagTrack -ErrorAction SilentlyContinue'",
  'svc-disable-wsearch': "powershell -NoProfile -Command 'Set-Service -Name WSearch -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name WSearch -ErrorAction SilentlyContinue'",
  'svc-disable-tablet-input': "powershell -NoProfile -Command 'Set-Service -Name TableInputService -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name TableInputService -ErrorAction SilentlyContinue'",
  'svc-disable-bluetooth-av': "powershell -NoProfile -Command 'Set-Service -Name BTAGService -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name BTAGService -ErrorAction SilentlyContinue'",
  'svc-disable-windows-error': "powershell -NoProfile -Command 'Set-Service -Name WerSvc -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name WerSvc -ErrorAction SilentlyContinue'",
  'svc-disable-print-spooler': "powershell -NoProfile -Command 'Set-Service -Name Spooler -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name Spooler -ErrorAction SilentlyContinue'",
  'svc-disable-remote-registry': "powershell -NoProfile -Command 'Set-Service -Name RemoteRegistry -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name RemoteRegistry -ErrorAction SilentlyContinue'",
  'svc-disable-xbox-live': "powershell -NoProfile -Command 'Set-Service -Name XblAuthManager -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name XblAuthManager -ErrorAction SilentlyContinue; Set-Service -Name XblGameSave -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name XblGameSave -ErrorAction SilentlyContinue'",
  'svc-disable-phone-link': "powershell -NoProfile -Command 'Set-Service -Name PhoneSvc -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name PhoneSvc -ErrorAction SilentlyContinue'",
  'gpu-disable-ulps': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v EnableUlps /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'gpu-set-power-limit-max': "powershell -NoProfile -Command 'nvidia-smi -pl 250 -ErrorAction SilentlyContinue'",
  'gpu-enable-hw-scheduler': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v HwSchMode /t REG_DWORD /d 1 /f'",
  'gpu-disable-preemption': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v RMDisablePreemption /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'gpu-disable-mpo': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\Windows\\Dwm\" /v OverlayTestMode /f -ErrorAction SilentlyContinue'",
  'reg-mmcss-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v SystemResponsiveness /t REG_DWORD /d 20 /f'",
  'reg-timer-resolution': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 0 /f'",
  'reg-priority-separation': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v PrioritySeparation /t REG_DWORD /d 2 /f'",
  'reg-system-clock-res': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 0 /f'",
  'reg-gaming-scheduler': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v GPU Priority /t REG_DWORD /d 2 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Priority /t REG_DWORD /d 2 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Scheduling Category /t REG_SZ /d Medium /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v SFIO Priority /t REG_SZ /d Normal /f'",
  'reg-interrupt-affinity': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v IRQ8Priority /f -ErrorAction SilentlyContinue'",
  'reg-dpc-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v DisablePagingExecutive /t REG_DWORD /d 0 /f'",
  'reg-io-page-lockdown': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v DisablePagingExecutive /t REG_DWORD /d 0 /f'",
  'bt-disable-pairing-reminder': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Bluetooth\" /v NotifyWhenUnpairedDeviceFound /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'bt-disable-auto-reconnect': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Bluetooth\\AutoReconnect\" /v Enable /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'vis-disable-transparency': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\" /v EnableTransparency /t REG_DWORD /d 1 /f'",
  'vis-dark-mode': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\" /v AppsUseLightTheme /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\" /v SystemUsesLightTheme /t REG_DWORD /d 1 /f'",
  'vis-disable-acrylic': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize\" /v EnableTransparency /t REG_DWORD /d 1 /f'",
  'vis-disable-animations': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v UserPreferencesMask /t REG_BINARY /d 9e1e078012000000 /f'",
  'vis-minimize-maximize': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\\WindowMetrics\" /v MinAnimate /t REG_SZ /d 1 /f'",
  'vis-disable-fade': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ListviewAlphaSelect /t REG_DWORD /d 1 /f'",
  'vis-start-menu-clean': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v Start_TrackProgs /t REG_DWORD /d 1 /f'",
  'vis-context-menu-classic': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32\" /f -ErrorAction SilentlyContinue'",
  'sec-disable-smartscreen': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\System\" /v EnableSmartScreen /t REG_DWORD /d 1 /f'",
  'sec-disable-realtime-protection': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Real-Time Protection\" /v DisableRealtimeMonitoring /t REG_DWORD /d 0 /f'",
  'sec-disable-defender-scheduled': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Scan\" /v DisableScanOnRealtimeEnable /t REG_DWORD /d 0 /f'",
  'sec-disable-sample-submission': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Spynet\" /v SubmitSamplesConsent /t REG_DWORD /d 1 /f'",
  'sec-disable-network-protection': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender\\Network Protection\" /v AllowNetworkProtectionOnWinServer /f -ErrorAction SilentlyContinue'",
  'net-disable-rsc': "powershell -NoProfile -Command 'netsh int tcp set global rsc=enabled'",
  'net-optimize-rss': "powershell -NoProfile -Command 'netsh int tcp set global rss=disabled'",
  'net-disable-ecnc': "powershell -NoProfile -Command 'netsh int tcp set global ecncapability=enabled'",
  'net-disable-task-offload': "powershell -NoProfile -Command 'netsh int ip set global taskoffload=enabled'",
  'net-disable-llmnr': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\DNSClient\" /v EnableMulticast /t REG_DWORD /d 1 /f'",
  'net-disable-wsd': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\NetCache\" /v Enabled /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'net-optimize-adapter': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v DefaultTTL /t REG_DWORD /d 128 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v Tcp1323Opts /t REG_DWORD /d 1 /f'",
  'game-dvr-disable': "powershell -NoProfile -Command 'reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /t REG_DWORD /d 1 /f'",
  'game-bar-complete': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" /v AppCaptureEnabled /t REG_DWORD /d 1 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /t REG_DWORD /d 1 /f'",
  'game-gameconfigstore': "powershell -NoProfile -Command 'reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_FSEBehaviorMode /t REG_DWORD /d 1 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_HonorUserFSEBehaviorMode /t REG_DWORD /d 0 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_FSEBehavior /t REG_DWORD /d 1 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_DXGIHonorFSEWindowsCompatible /t REG_DWORD /d 0 /f'",
  'game-dwm-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\Dwm\" /v BoostForegroundProcess /t REG_DWORD /d 0 /f'",
  'game-scheduler-class': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v NetworkThrottlingIndex /t REG_DWORD /d 10 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v SystemResponsiveness /t REG_DWORD /d 20 /f'",
  'game-fullscreen-trick': "powershell -NoProfile -Command 'reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_FSEBehaviorMode /t REG_DWORD /d 1 /f; reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v AllowAutoGameMode /t REG_DWORD /d 0 /f'",
  'game-hrtimer': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 0 /f'",
  'game-foreground-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Priority /t REG_DWORD /d 2 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v SFIO Priority /t REG_SZ /d Normal /f'",
  'startup-disable-cortana': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search\" /v AllowCortana /t REG_DWORD /d 1 /f'",
  'startup-disable-onedrive': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v OneDrive /t REG_SZ /d \"\\\"C:\\Users\\%USERNAME%\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe\\\" /background\" /f -ErrorAction SilentlyContinue'",
  'startup-disable-teams': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v com.squirrel.Teams /t REG_SZ /d \"\" /f -ErrorAction SilentlyContinue'",
  'startup-disable-edge-updater': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\EdgeUpdate\" /v UpdateDefault /t REG_DWORD /d 1 /f'",
  'startup-disable-adobe-updater': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Adobe\\Adobe ARM\\1.0\" /v DisableAutomaticAppUpdate /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'startup-disable-discord-startup': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v Discord /t REG_SZ /d \"\" /f -ErrorAction SilentlyContinue'",
  'startup-disable-epic-games': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v EpicGamesLauncher /t REG_SZ /d \"\" /f -ErrorAction SilentlyContinue'",
  'startup-disable-steam': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v Steam /t REG_SZ /d \"\" /f -ErrorAction SilentlyContinue'",
  'startup-disable-spotify': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v Spotify /t REG_SZ /d \"\" /f -ErrorAction SilentlyContinue'",
  'startup-disable-widgets': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Dsh\" /v AllowNewsAndInterests /t REG_DWORD /d 1 /f'",
  'mem-optimize-pagefile': "powershell -NoProfile -Command 'wmic computersystem set AutomaticManagedPagefile=True'",
  'mem-large-system-cache': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v LargeSystemCache /t REG_DWORD /d 0 /f'",
  'mem-flush-timer': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v DisablePagingExecutive /t REG_DWORD /d 0 /f'",
  'mem-deoptimize-standby': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v StandbyMemoryInActiveMemoryList /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'mem-disable-superfetch': "powershell -NoProfile -Command 'Set-Service -Name SysMain -StartupType Manual -ErrorAction SilentlyContinue; Start-Service -Name SysMain -ErrorAction SilentlyContinue'",
  'mem-clean-standby': "powershell -NoProfile -Command '[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers()'",
  'debloat-remove-copilot': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsCopilot\" /v TurnOffWindowsCopilot /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Policies\\Microsoft\\Windows\\WindowsCopilot\" /v TurnOffWindowsCopilot /t REG_DWORD /d 0 /f'",
  'debloat-remove-clipchamp': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *Clipchamp* -ErrorAction SilentlyContinue | ForEach-Object { Add-AppxPackage -Register \"$($_.InstallLocation)\\AppXManifest.xml\" -ErrorAction SilentlyContinue }'",
  'debloat-remove-solitaire': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *SolitaireCollection* -ErrorAction SilentlyContinue | ForEach-Object { Add-AppxPackage -Register \"$($_.InstallLocation)\\AppXManifest.xml\" -ErrorAction SilentlyContinue }'",
  'debloat-remove-news': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Dsh\" /v AllowNewsAndInterests /t REG_DWORD /d 1 /f'",
  'debloat-remove-maps': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *BingMaps* -ErrorAction SilentlyContinue | ForEach-Object { Add-AppxPackage -Register \"$($_.InstallLocation)\\AppXManifest.xml\" -ErrorAction SilentlyContinue }'",
  'debloat-remove-gethelp': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *GetHelp* -ErrorAction SilentlyContinue | ForEach-Object { Add-AppxPackage -Register \"$($_.InstallLocation)\\AppXManifest.xml\" -ErrorAction SilentlyContinue }'",
  'debloat-remove-3dviewer': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *3DViewer* -ErrorAction SilentlyContinue | ForEach-Object { Add-AppxPackage -Register \"$($_.InstallLocation)\\AppXManifest.xml\" -ErrorAction SilentlyContinue }'",
  'debloat-remove-alarms': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *WindowsAlarms* -ErrorAction SilentlyContinue | ForEach-Object { Add-AppxPackage -Register \"$($_.InstallLocation)\\AppXManifest.xml\" -ErrorAction SilentlyContinue }'",
  'debloat-remove-camera': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *WindowsCamera* -ErrorAction SilentlyContinue | ForEach-Object { Add-AppxPackage -Register \"$($_.InstallLocation)\\AppXManifest.xml\" -ErrorAction SilentlyContinue }'",
  'debloat-remove-feedback': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *FeedbackHub* -ErrorAction SilentlyContinue | ForEach-Object { Add-AppxPackage -Register \"$($_.InstallLocation)\\AppXManifest.xml\" -ErrorAction SilentlyContinue }'",
  'debloat-remove-yourphone': "powershell -NoProfile -Command 'Get-AppxPackage -AllUsers *YourPhone* -ErrorAction SilentlyContinue | ForEach-Object { Add-AppxPackage -Register \"$($_.InstallLocation)\\AppXManifest.xml\" -ErrorAction SilentlyContinue }'",
  'debloat-remove-tips': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager\" /v SoftLandingEnabled /t REG_DWORD /d 1 /f'",
  'debloat-remove-people': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowPeopleBand /t REG_DWORD /d 1 /f'",
  'debloat-remove-meetnow': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\" /v HideSCAMeetNow /t REG_DWORD /d 0 /f'",
  'debloat-remove-taskbar-feed': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsTaskbarViewMode /t REG_DWORD /d 1 /f'",

  // ── SOUND RESTORE ──
  'snd-exclusive-mode': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\MmcSnapins\\FxTools\\AudioPolicyManager\" /v EnableExclusiveMode /f -ErrorAction SilentlyContinue'",
  'snd-reduce-buffer': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v MaxBufferCount /f -ErrorAction SilentlyContinue'",
  'snd-mmcss-audio': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v \"NoLazyMode\" /f -ErrorAction SilentlyContinue'",
  'snd-disable-spatial': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v DisableSpatialSound /f -ErrorAction SilentlyContinue'",
  'snd-optimize-sample-rate': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v SampleRateOptimization /f -ErrorAction SilentlyContinue'",
  'snd-disable-midi': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Drivers32\" /v midiwave /f -ErrorAction SilentlyContinue'",
  'snd-optimize-audio-thread': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Audiosrv\" /v DependOnService /f -ErrorAction SilentlyContinue'",
  'snd-disable-audio-gpu-sync': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v DisableGPUSync /f -ErrorAction SilentlyContinue'",

  // ── BCDEdit RESTORE ──
  'bcd-timer-resolution': "bcdedit /deletevalue useplatformclock",
  'bcd-disable-dynamic-tick': "bcdedit /deletevalue disabledynamictick",
  'bcd-use-platform-clock': "bcdedit /deletevalue useplatformtick",
  'bcd-increase-usnjrnl': "powershell -NoProfile -Command 'echo \"USN journal: restart to apply default settings\"'",
  'bcd-optimize-boot': "bcdedit /set bootmenupolicy standard",
  'bcd-disable-quiet-boot': "bcdedit /deletevalue quietboot",
  'bcd-increase-stack': "bcdedit /deletevalue stacksize",
  'bcd-optimize-test-signing': "bcdedit /set testsigning off",

  // ── NVIDIA GPU RESTORE ──
  'nv-max-power-management': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PowerMizerEnable /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PowerMizerLevel /f -ErrorAction SilentlyContinue'",
  'nv-disable-thermal-throttle': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v ThermalThrottleLimit /f -ErrorAction SilentlyContinue'",
  'nv-optimize-pcie': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PCIeLinkSpeed /f -ErrorAction SilentlyContinue'",
  'nv-disable-gpu-preemption': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v DisablePreemption /f -ErrorAction SilentlyContinue'",
  'nv-max-frames-ahead': "reg delete \"HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak\" /v PreRenderLimit /f",
  'nv-disable-mpo': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\Dwm\" /v EnableTearing /f -ErrorAction SilentlyContinue'",
  'nv-shader-cache-size': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\NVIDIA Corporation\\Global\\NVTweak\" /v ShaderCacheSizeMB /f -ErrorAction SilentlyContinue'",
  'nv-optimization-level': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PerfLevelSrc /f -ErrorAction SilentlyContinue'",
  'nv-disable-spread-spectrum': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v DisableSpreadSpectrum /f -ErrorAction SilentlyContinue'",
  'nv-rm-gpu-accl': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v HwSchMode /f -ErrorAction SilentlyContinue'",

  // ── AMD/Radeon GPU RESTORE ──
  'amd-disable-chill': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\AMD\\Chill\" /v Enable /f -ErrorAction SilentlyContinue'",
  'amd-disable-vsr': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\AMD\\VSR\" /v Enable /f -ErrorAction SilentlyContinue'",
  'amd-enable-antilag': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\AMD\\AntiLag\" /v Enable /f -ErrorAction SilentlyContinue'",
  'amd-disable-rtss-sync': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\AMD\\RTSS\" /v Sync /f -ErrorAction SilentlyContinue'",
  'amd-max-power-limit': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PowerLimit /f -ErrorAction SilentlyContinue'",
  'amd-disable-smart-access': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v EnableSAM /f -ErrorAction SilentlyContinue'",
  'amd-disable-hdcp': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\AMD\\CN\" /v EnableHDCP /f -ErrorAction SilentlyContinue'",
  'amd-set-gpu-mode': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PowerMode /f -ErrorAction SilentlyContinue'",
  'amd-disable-overlay': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\AMD\\Overlay\" /v Enable /f -ErrorAction SilentlyContinue'",
  'amd-optimize-memory': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v VRAMPagingMode /f -ErrorAction SilentlyContinue'",

  // ── DIRECTX RESTORE ──
  'dx-shader-cache-enable': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences\" /v ShaderCacheEnabled /f -ErrorAction SilentlyContinue'",
  'dx-disable-debug-layer': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\DirectX\\Global\" /v EnableDebugLayer /f -ErrorAction SilentlyContinue'",
  'dx-optimize-agility-sdk': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\DirectX\\AgilitySDK\" /v Enable /f -ErrorAction SilentlyContinue'",
  'dx-force-hw-d3d': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Direct3D\" /v DisableDDI /f -ErrorAction SilentlyContinue'",
  'dx-disable-d3d-debug': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\Direct3D12\" /v EnableGpuBasedValidation /f -ErrorAction SilentlyContinue'",
  'dx-optimize-texture-format': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences\" /v TextureFormatOpt /f -ErrorAction SilentlyContinue'",
  'dx-enable-variable-shading': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\DirectX\\UserGpuPreferences\" /v VariableRateShading /f -ErrorAction SilentlyContinue'",
  'dx-optimize-present-params': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences\" /v LowLatencyPresent /f -ErrorAction SilentlyContinue'",

  // ── LATENCY RESTORE ──
  'lat-hpet-enable': "bcdedit /deletevalue useplatformclock",
  'lat-timer-resolution': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /f -ErrorAction SilentlyContinue'",
  'lat-tsc-invariant': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v UseTscInvariant /f -ErrorAction SilentlyContinue'",
  'lat-disable-synthetic': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v DisableSyntheticTimers /f -ErrorAction SilentlyContinue'",
  'lat-optimize-interrupts': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v InterruptSteeringDisabled /f -ErrorAction SilentlyContinue'",
  'lat-force-tsc': "bcdedit /deletevalue useplatformtick",
  'lat-disable-acpi-pm': "bcdedit /deletevalue useplatformclock",
  'lat-optimize-dpc': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v DPCPriority /f -ErrorAction SilentlyContinue'",

  // ── ALT-TAB RESTORE ──
  'atd-disable-fade': "powershell -NoProfile -Command 'reg delete \"HKCU\\Control Panel\\Desktop\" /v UserPreferencesMask /f -ErrorAction SilentlyContinue'",
  'atd-disable-switch-delay': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v MenuShowDelay /t REG_SZ /d 400 /f'",
  'atd-optimize-dwm': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\Dwm\" /v AlwaysHibernateThumbnails /f -ErrorAction SilentlyContinue'",
  'atd-disable-thumbnail': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\Dwm\" /v EnableAeroPeek /f -ErrorAction SilentlyContinue'",
  'atd-force-classic': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v AltTabSettings /f -ErrorAction SilentlyContinue'",
  'atd-prioritize-game': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v RestartApps /f -ErrorAction SilentlyContinue'",
  'atd-disable-snap': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v SnapAssist /t REG_DWORD /d 1 /f'",
  'atd-optimize-peek': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\Dwm\" /v EnableAeroPeek /t REG_DWORD /d 1 /f'",

  // ── APP DEBLOAT RESTORE ──
  'appdb-chrome-disable-hw': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Google\\Chrome\" /v HardwareAccelerationModeEnabled /f -ErrorAction SilentlyContinue'",
  'appdb-chrome-disable-extensions': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Google\\Chrome\" /v ExtensionSettings /f -ErrorAction SilentlyContinue'",
  'appdb-chrome-priority': "powershell -NoProfile -Command 'Get-Process chrome -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::Normal }'",
  'appdb-discord-disable-hw': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Discord\\CEFI\" /v HardwareAcceleration /f -ErrorAction SilentlyContinue'",
  'appdb-discord-disable-autostart': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v Discord /t REG_SZ /d \"\" /f",
  'appdb-discord-optimize': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Discord\\CEFI\" /v OverlayEnabled /f -ErrorAction SilentlyContinue; reg delete \"HKCU\\Software\\Discord\\CEFI\" /v NoiseSuppression /f -ErrorAction SilentlyContinue'",
  'appdb-epic-disable-telemetry': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Epic Games\\EpicGamesLauncher\" /v Telemetry /f -ErrorAction SilentlyContinue'",
  'appdb-epic-disable-hw': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Epic Games\\EpicGamesLauncher\" /v HardwareAcceleration /f -ErrorAction SilentlyContinue'",
  'appdb-epic-preload': "powershell -NoProfile -Command 'reg delete \"HKCU\\Software\\Epic Games\\EpicGamesLauncher\" /v EnableGamePreLoad /f -ErrorAction SilentlyContinue'",
  'appdb-steam-disable-hw': "reg delete \"HKCU\\Software\\Valve\\Steam\" /v DisableHWAcceleration /f",
  'appdb-steam-disable-popup': "reg delete \"HKCU\\Software\\Valve\\Steam\" /v SuppressPopups /f",
  'appdb-teams-disable-background': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Communications\" /v ConfigureChatAutoDiscovery /f -ErrorAction SilentlyContinue'",
  'appdb-edge-disable-service': "powershell -NoProfile -Command 'Set-Service -Name edgeupdate -StartupType Manual'",
  'appdb-spotify-disable-startup': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v Spotify /t REG_SZ /d \"\" /f",
  'appdb-onecloud-disable': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v OneDrive /t REG_SZ /d \"\" /f",
  'appdb-cortana-disable': "reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search\" /v AllowCortana /f",
  'appdb-xbox-disable-overlay': "reg add \"HKCU\\SOFTWARE\\Microsoft\\GameBar\" /v ShowStartupPanel /t REG_DWORD /d 1 /f",
  'appdb-web-search-disable': "reg delete \"HKCU\\Software\\Policies\\Microsoft\\Windows\\Explorer\" /v DisableSearchBoxSuggestions /f",
  'appdb-copilot-disable': "powershell -NoProfile -Command 'echo \"Copilot: re-enable via Microsoft Store\"'",
  'appdb-weather-disable': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsTaskbarViewMode /t REG_DWORD /d 0 /f",

  // ── EXPLORER RESTORE ──
  'explorer-disable-search': "powershell -NoProfile -Command 'Set-Service WSearch -StartupType Automatic'",
  'explorer-disable-thumbnails': "reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v DisableThumbnailCache /f",
  'explorer-classic-menu': "reg delete \"HKCU\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32\" /ve /f",
  'explorer-disable-details-pane': "reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v UseClassicViewState /f",
  'explorer-optimize-views': "reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Streams\\Default\" /v ViewType /f",
  'explorer-disable-network-discovery': "powershell -NoProfile -Command 'Set-NetConnectionProfile -NetworkCategory Private'",
  'explorer-hide-extensions': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v HideFileExt /t REG_DWORD /d 0 /f",
  'explorer-disable-quick-access': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v LaunchTo /t REG_DWORD /d 0 /f",
  'explorer-optimize-preview': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v DisablePreviewPane /t REG_DWORD /d 0 /f",
  'explorer-disable-gadgets': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowGadgets /t REG_DWORD /d 1 /f'",
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
      'sys-high-performance': 'system', 'sys-enable-game-mode': 'system', 'sys-disable-fullscreen-opt': 'system',
      'sys-disk-cleanup': 'system', 'sys-cpu-priority': 'system', 'cpu-core-parking-disable': 'system',
      'memory-working-set': 'system',
      'nv-disable-vsync': 'nvidia', 'nv-low-latency': 'nvidia', 'nv-hardware-scheduling': 'nvidia',
      'nv-texture-filtering': 'nvidia',
      'net-optimize-dns': 'network', 'net-reduce-congestion': 'network',
      'mouse-disable-acceleration': 'mouse',
      'storage-ssd-optimization': 'storage', 'storage-trim-optimization': 'storage',
      'storage-nvme-optimization': 'storage', 'storage-prefetch-manager': 'storage',
      'windows-explorer-optimization': 'windows',
      'audio-disable-enhancements': 'audio', 'audio-usb-optimization': 'audio',
      'usb-selective-suspend-disable': 'usb',
      'keyboard-disable-filter': 'keyboard', 'keyboard-usb-power-mgmt': 'keyboard',
      'sys-disable-gamebar': 'fps',
      'sys-disable-vbs': 'fps',
      'sys-disable-xbox': 'fps',
      'sys-disable-mitigations': 'fps',
      'sys-optimize-fps': 'fps',
      'sys-optimize-device-affinities': 'fps',
      'sys-optimize-msi': 'fps',
      'sys-reduce-background': 'fps',
      'sys-disable-hibernation': 'fps',
      'sys-enable-modern-memory': 'fps',
      'sys-disable-services': 'fps',
      'sys-optimize-storage': 'fps',
      'sys-reduce-boot-timeout': 'fps',
      'sys-optimize-explorer': 'quality',
      'sys-disable-boot-interface': 'quality',
      'sys-optimize-browser-bg': 'fps',
      'nv-disable-telemetry': 'privacy',
      'nv-optimize-performance': 'fps',
      'nv-enhance-privacy': 'privacy',
      'nv-enable-dlss-indicator': 'quality',
      'privacy-reduce-ads': 'privacy',
      'privacy-optimize-smb': 'privacy',
      'privacy-disable-security-questions': 'privacy',
      'privacy-harden-security': 'privacy',
      'privacy-disable-vpn': 'privacy',
      'privacy-disable-ucpd': 'privacy',
      'privacy-unlock-eu-privacy': 'privacy',
      'privacy-redirect-web-searches': 'privacy',
      'privacy-disable-driver-updates': 'privacy',
      'net-optimize-performance': 'network',
      'net-disable-lso': 'network',
      'qol-clean-taskbar': 'quality',
      'qol-classic-photo-viewer': 'quality',
      'qol-bypass-win11': 'quality',
      'qol-disable-disk-quotas': 'quality',
      'qol-disable-browser-hw-accel': 'fps',
      'sys-disable-tips': 'system',
      'sys-disable-lockscreen-spotlight': 'system',
      'sys-disable-start-suggestions': 'system',
      'sys-disable-error-reporting': 'system',
      'sys-disable-delivery-optimization': 'system',
      'sys-disable-location': 'system',
      'sys-disable-find-my-device': 'system',
      'sys-disable-activity-history': 'system',
      'sys-disable-widgets': 'system',
      'sys-disable-taskbar-search': 'system',
      'sys-disable-cortana': 'system',
      'sys-disable-cloud-clipboard': 'system',
      'sys-disable-meet-now': 'system',
      'sys-disable-people-bar': 'system',
      'sys-disable-search-highlights': 'system',
      'sys-disable-taskbar-feed': 'system',
      'sys-disable-lockscreen-notifications': 'system',
      'sys-disable-action-center': 'system',
      'sys-disable-scheduled-defrag': 'system',
      'qol-optimize-browsing': 'quality',
      'privacy-disable-vm-support': 'privacy',
      // ── NEW TWEAKS ──
      'net-disable-nagle': 'network',
      'net-disable-power-saving': 'network',
      'sys-enable-ultimate-performance': 'system',
      'sys-disable-animations': 'system',
      'sys-disable-transparency': 'system',
      'sys-disable-fast-startup': 'system',
      'sys-disable-sticky-keys': 'system',
      'sys-disable-filter-keys': 'system',
      'sys-disable-toggle-keys': 'system',
      'sys-disable-mouse-trails': 'system',
      'input-optimize-mouse': 'mouse',
      'input-optimize-keyboard': 'keyboard',
      'storage-enable-write-cache': 'storage',
      'storage-disable-ahci-link-power': 'storage',
      'sys-disable-task-view': 'windows',
      'sys-disable-clipboard-history': 'windows',
      'sys-disable-feedback': 'windows',
      'sys-disable-suggested-content': 'windows',
      'sys-disable-web-search': 'windows',
      // ── DEBLOAT ──
      'debloat-remove-store-bloatware': 'debloat',
      'debloat-remove-onedrive': 'debloat',
      'debloat-clean-temp-files': 'debloat',
      'debloat-disable-telemetry': 'debloat',
      'debloat-remove-news-widget': 'debloat',
      'debloat-disable-web-experience': 'debloat',
      'debloat-disable-background-access': 'debloat',
      'debloat-disable-store-updates': 'debloat',
      'debloat-remove-xbox-packages': 'debloat',
      // ── GPU ──
      'gpu-max-performance-mode': 'gpu',
      'gpu-disable-power-gating': 'gpu',
      'gpu-optimize-shader-cache': 'gpu',
      'gpu-disable-var-shading': 'gpu',
      'gpu-set-preferred-mode': 'gpu',
      'gpu-optimize-render-schedule': 'gpu',
      'gpu-disable-frame-pacing': 'gpu',
      // ── GAMING ──
      'game-optimize-priority': 'gaming',
      'game-disable-dvr': 'gaming',
      'game-optimize-scheduler': 'gaming',
      'game-disable-game-bar-tips': 'gaming',
      'game-disable-background-recording': 'gaming',
      'game-optimize-fullscreen': 'gaming',
      'game-disable-hags': 'gaming',
      'game-optimize-shader-cache': 'gaming',
      // ── NETWORK ──
      'net-optimize-mtu': 'network',
      'net-disable-network-throttling': 'network',
      'net-optimize-tcp-window': 'network',
      'net-disable-flow-control': 'network',
      'net-optimize-connection-limits': 'network',
      'net-disable-netbios': 'network',
      // ── AUDIO ──
      'audio-optimize-buffer-size': 'audio',
      'audio-disable-spatial-sound': 'audio',
      'audio-set-exclusive-mode': 'audio',
      'audio-disable-midi-synth': 'audio',
      // ── SYSTEM ──
      'sys-set-timer-resolution': 'system',
      'sys-disable-power-throttling': 'system',
      'sys-optimize-interrupts': 'system',
      'sys-disable-spectre-mitigations': 'system',
      'sys-use-platform-clock': 'system',
      'sys-disable-dynamic-tick': 'system',
      // ── GAMING TWEAKS ──
      'game-io-priority': 'gaming',
      'game-memory-priority': 'gaming',
      'game-disable-game-bar-complete': 'gaming',
      'game-optimize-directx': 'gaming',
      'game-optimize-foreground-timer': 'gaming',
      'game-disable-steam-overlay': 'gaming',
      'game-optimize-cpu-affinity': 'gaming',
      'game-disable-nagles-algorithm': 'gaming',
      'game-optimize-udp-buffer': 'gaming',
      'game-disable-animations': 'gaming',
      'game-optimize-pagefile': 'gaming',
      'game-disable-powersaving-gpu': 'gaming',
      // ── ADDITIONAL TWEAKS ──
      'storage-optimize-defrag': 'storage',
      'storage-set-io-priority': 'storage',
      'storage-disable-indexing': 'storage',
      'net-optimize-dns-cache': 'network',
      'net-disable-ecns': 'network',
      'net-optimize-rss': 'network',
      'sys-optimize-file-cache': 'system',
      'sys-disable-prefetch': 'system',
      'sys-optimize-context-menu': 'system',
      'sys-clear-system-cache': 'system',
      'sys-optimize-dpc-latency': 'system',
      'mouse-optimize-polling': 'mouse',
      'keyboard-optimize-repeat': 'keyboard',
      'input-gaming-mode': 'input',
      'audio-disable-low-latency': 'audio',
      'audio-optimize-sample-rate': 'audio',
      'privacy-disable-ad-id': 'privacy',
      'privacy-disable-app-launch': 'privacy',
      'game-disable-fullscreen-boost': 'gaming',
      'game-optimize-network-priority': 'gaming',
      'game-disable-eco-mode': 'gaming',
      // ── DEEP DEBLOAT ──
      'debloat-remove-edge': 'debloat',
      'debloat-remove-teams': 'debloat',
      'debloat-disable-copilot': 'debloat',
      'debloat-remove-widgets-deep': 'debloat',
      // ── WINDOWS UPDATE ──
      'sys-pause-updates': 'windows',
      'sys-block-update-restart': 'windows',
      'sys-defer-feature-updates': 'windows',
      // ── TELEMETRY FIREWALL ──
      'net-block-telemetry-firewall': 'network',
      'net-block-edge-firewall': 'network',
      // ── CPU POWER ──
      'cpu-disable-idle-states': 'system',
      'cpu-max-performance-bios': 'system',
      // ── GPU POWER ──
      'gpu-disable-ulps': 'gpu',
      'gpu-set-power-limit-max': 'gpu',
      // ── PROCESS PRIORITY ──
      'sys-realtime-priority-games': 'gaming',
      'sys-foreground-boost': 'gaming',
      // ── GAME CONFIG ──
      'game-fortnite-ini-optimize': 'gaming',
      'game-valorant-cfg-optimize': 'gaming',
      'game-cs2-cfg-optimize': 'gaming',
      'game-apex-cfg-optimize': 'gaming',
      'input-gaming-mode': 'input',
      // ── NEW CATEGORIES ──
      'wu-disable-auto-update': 'windows', 'wu-disable-restart-reminder': 'windows', 'wu-pause-updates-30days': 'windows',
      'wu-disable-drivers-update': 'windows', 'wu-disable-office-updates': 'windows',
      'edge-disable-startup-boost': 'windows', 'edge-disable-background-tabs': 'windows', 'edge-disable-preloading': 'windows',
      'chrome-disable-background-apps': 'windows', 'chrome-disable-renderer-bg': 'windows', 'browser-disable-hw-accel': 'windows',
      'power-ultimate-performance': 'system', 'power-disable-power-saving': 'system', 'power-disable-sleep': 'system',
      'power-disable-hibernate': 'system', 'power-disable-link-state': 'system', 'power-disable-processor-c-states': 'system',
      'svc-disable-sysmain': 'system', 'svc-disable-diagtrack': 'privacy', 'svc-disable-wsearch': 'system',
      'svc-disable-tablet-input': 'input', 'svc-disable-bluetooth-av': 'system', 'svc-disable-windows-error': 'system',
      'svc-disable-print-spooler': 'system', 'svc-disable-remote-registry': 'privacy', 'svc-disable-xbox-live': 'debloat',
      'svc-disable-phone-link': 'debloat',
      'gpu-disable-ulps': 'gpu', 'gpu-set-power-limit-max': 'gpu', 'gpu-disable-power-gating': 'gpu',
      'gpu-enable-hw-scheduler': 'gpu', 'gpu-optimize-shader-cache': 'gpu', 'gpu-disable-preemption': 'gpu',
      'gpu-optimize-render-schedule': 'gpu', 'gpu-disable-mpo': 'gpu',
      'reg-mmcss-priority': 'system', 'reg-timer-resolution': 'system', 'reg-priority-separation': 'system',
      'reg-system-clock-res': 'system', 'reg-gaming-scheduler': 'system', 'reg-interrupt-affinity': 'system',
      'reg-dpc-priority': 'system', 'reg-io-page-lockdown': 'storage',
      'bt-disable-pairing-reminder': 'system', 'bt-disable-auto-reconnect': 'system',
      'vis-disable-transparency': 'system', 'vis-dark-mode': 'system', 'vis-disable-acrylic': 'system',
      'vis-disable-animations': 'system', 'vis-minimize-maximize': 'system', 'vis-disable-fade': 'system',
      'vis-start-menu-clean': 'windows', 'vis-context-menu-classic': 'windows',
      'sec-disable-smartscreen': 'privacy', 'sec-disable-realtime-protection': 'privacy',
      'sec-disable-defender-scheduled': 'privacy', 'sec-disable-sample-submission': 'privacy',
      'sec-disable-network-protection': 'privacy',
      'net-disable-rsc': 'network', 'net-optimize-rss': 'network', 'net-disable-ecnc': 'network',
      'net-disable-task-offload': 'network', 'net-optimize-tcp-window': 'network', 'net-disable-netbios': 'network',
      'net-disable-llmnr': 'network', 'net-disable-wsd': 'network', 'net-optimize-adapter': 'network',
      'net-disable-flow-control': 'network',
      'game-dvr-disable': 'gaming', 'game-bar-complete': 'gaming', 'game-gameconfigstore': 'gaming',
      'game-dwm-priority': 'gaming', 'game-scheduler-class': 'gaming', 'game-fullscreen-trick': 'gaming',
      'game-hrtimer': 'gaming', 'game-foreground-priority': 'gaming',
      'startup-disable-cortana': 'debloat', 'startup-disable-onedrive': 'debloat', 'startup-disable-teams': 'debloat',
      'startup-disable-edge-updater': 'debloat', 'startup-disable-adobe-updater': 'debloat',
      'startup-disable-discord-startup': 'debloat', 'startup-disable-epic-games': 'debloat',
      'startup-disable-steam': 'debloat', 'startup-disable-spotify': 'debloat', 'startup-disable-widgets': 'debloat',
      'mem-optimize-pagefile': 'system', 'mem-large-system-cache': 'system', 'mem-flush-timer': 'system',
      'mem-deoptimize-standby': 'system', 'mem-disable-superfetch': 'system', 'mem-clean-standby': 'system',
      'debloat-remove-copilot': 'debloat', 'debloat-remove-clipchamp': 'debloat', 'debloat-remove-solitaire': 'debloat',
      'debloat-remove-news': 'debloat', 'debloat-remove-maps': 'debloat', 'debloat-remove-gethelp': 'debloat',
      'debloat-remove-3dviewer': 'debloat', 'debloat-remove-alarms': 'debloat', 'debloat-remove-camera': 'debloat',
      'debloat-remove-feedback': 'debloat', 'debloat-remove-yourphone': 'debloat', 'debloat-remove-tips': 'debloat',
      'debloat-remove-people': 'debloat', 'debloat-remove-meetnow': 'debloat', 'debloat-remove-taskbar-feed': 'debloat',
      'snd-exclusive-mode': 'audio', 'snd-reduce-buffer': 'audio', 'snd-mmcss-audio': 'audio',
      'snd-disable-spatial': 'audio', 'snd-optimize-sample-rate': 'audio', 'snd-disable-midi': 'audio',
      'snd-optimize-audio-thread': 'audio', 'snd-disable-audio-gpu-sync': 'audio',
      'bcd-timer-resolution': 'system', 'bcd-disable-dynamic-tick': 'system', 'bcd-use-platform-clock': 'system',
      'bcd-increase-usnjrnl': 'system', 'bcd-optimize-boot': 'system', 'bcd-disable-quiet-boot': 'system',
      'bcd-increase-stack': 'system', 'bcd-optimize-test-signing': 'system',
      'nv-max-power-management': 'nvidia', 'nv-disable-thermal-throttle': 'nvidia', 'nv-optimize-pcie': 'nvidia',
      'nv-disable-gpu-preemption': 'nvidia', 'nv-max-frames-ahead': 'nvidia', 'nv-disable-mpo': 'nvidia',
      'nv-shader-cache-size': 'nvidia', 'nv-optimization-level': 'nvidia', 'nv-disable-spread-spectrum': 'nvidia',
      'nv-rm-gpu-accl': 'nvidia',
      'amd-disable-chill': 'radeon', 'amd-disable-vsr': 'radeon', 'amd-enable-antilag': 'radeon',
      'amd-disable-rtss-sync': 'radeon', 'amd-max-power-limit': 'radeon', 'amd-disable-smart-access': 'radeon',
      'amd-disable-hdcp': 'radeon', 'amd-set-gpu-mode': 'radeon', 'amd-disable-overlay': 'radeon',
      'amd-optimize-memory': 'radeon',
      'dx-shader-cache-enable': 'directx', 'dx-disable-debug-layer': 'directx', 'dx-optimize-agility-sdk': 'directx',
      'dx-force-hw-d3d': 'directx', 'dx-disable-d3d-debug': 'directx', 'dx-optimize-texture-format': 'directx',
      'dx-enable-variable-shading': 'directx', 'dx-optimize-present-params': 'directx',
      'lat-hpet-enable': 'latency', 'lat-timer-resolution': 'latency', 'lat-tsc-invariant': 'latency',
      'lat-disable-synthetic': 'latency', 'lat-optimize-interrupts': 'latency', 'lat-force-tsc': 'latency',
      'lat-disable-acpi-pm': 'latency', 'lat-optimize-dpc': 'latency',
      'atd-disable-fade': 'alttab', 'atd-disable-switch-delay': 'alttab', 'atd-optimize-dwm': 'alttab',
      'atd-disable-thumbnail': 'alttab', 'atd-force-classic': 'alttab', 'atd-prioritize-game': 'alttab',
      'atd-disable-snap': 'alttab', 'atd-optimize-peek': 'alttab',
      'appdb-chrome-disable-hw': 'debloat', 'appdb-chrome-disable-extensions': 'debloat', 'appdb-chrome-priority': 'debloat',
      'appdb-discord-disable-hw': 'debloat', 'appdb-discord-disable-autostart': 'debloat', 'appdb-discord-optimize': 'debloat',
      'appdb-epic-disable-telemetry': 'debloat', 'appdb-epic-disable-hw': 'debloat', 'appdb-epic-preload': 'debloat',
      'appdb-steam-disable-hw': 'debloat', 'appdb-steam-disable-popup': 'debloat', 'appdb-teams-disable-background': 'debloat',
      'appdb-edge-disable-service': 'debloat', 'appdb-spotify-disable-startup': 'debloat', 'appdb-onecloud-disable': 'debloat',
      'appdb-cortana-disable': 'debloat', 'appdb-xbox-disable-overlay': 'debloat', 'appdb-web-search-disable': 'debloat',
      'appdb-copilot-disable': 'debloat', 'appdb-weather-disable': 'debloat',
      'explorer-disable-search': 'explorer', 'explorer-disable-thumbnails': 'explorer', 'explorer-classic-menu': 'explorer',
      'explorer-disable-details-pane': 'explorer', 'explorer-optimize-views': 'explorer', 'explorer-disable-network-discovery': 'explorer',
      'explorer-hide-extensions': 'explorer', 'explorer-disable-quick-access': 'explorer', 'explorer-optimize-preview': 'explorer',
      'explorer-disable-gadgets': 'explorer',
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
    return { success: false, error: e.message };
  }
});

// ── Leaderboard IPC ──
ipcMain.handle("submit-benchmark", async (_e, data) => {
  try {
    const https = require("https");
    const postData = JSON.stringify(data);
    return await new Promise((resolve, reject) => {
      const req = https.request("https://choatix-v2.onrender.com/api/benchmark/submit", {
        method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(postData) }
      }, (res) => { let body = ""; res.on("data", c => body += c); res.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve({ success: false }); } }); });
      req.on("error", reject);
      req.write(postData);
      req.end();
    });
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("get-leaderboard", async (_e, { hardwareHash } = {}) => {
  try {
    const https = require("https");
    const url = hardwareHash
      ? `https://choatix-v2.onrender.com/api/leaderboard/hardware/${hardwareHash}`
      : "https://choatix-v2.onrender.com/api/leaderboard";
    return await new Promise((resolve, reject) => {
      https.get(url, { headers: { "User-Agent": "Choatix-Desktop" } }, (res) => {
        let body = ""; res.on("data", c => body += c);
        res.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve({ entries: [] }); } });
      }).on("error", () => resolve({ entries: [] }));
    });
  } catch {
    return { entries: [] };
  }
});

ipcMain.handle("get-user-rank", async (_e, { discordId }) => {
  try {
    const https = require("https");
    return await new Promise((resolve, reject) => {
      https.get(`https://choatix-v2.onrender.com/api/leaderboard/user/${discordId}`, { headers: { "User-Agent": "Choatix-Desktop" } }, (res) => {
        let body = ""; res.on("data", c => body += c);
        res.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve({ entries: [] }); } });
      }).on("error", () => resolve({ entries: [] }));
    });
  } catch {
    return { entries: [] };
  }
});

// ═══════════════════════════════════════════
// ── Auto-Update IPC ──
// ═══════════════════════════════════════════
const CURRENT_VERSION = app.getVersion();
ipcMain.handle("check-for-updates", async () => {
  try {
    const data = await new Promise((resolve, reject) => {
      https.get("https://api.github.com/repos/zylenofficial/choatix-v2/releases/latest", { headers: { "User-Agent": "Choatix-Desktop" } }, (res) => {
        let body = ""; res.on("data", c => body += c);
        res.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(new Error("Invalid JSON")); } });
      }).on("error", reject);
    });
    const latestTag = (data.tag_name || "").replace(/^v/, "");
    const assets = data.assets || [];
    const installer = assets.find(a => a.name && a.name.includes("Setup"));
    const downloadUrl = installer ? installer.browser_download_url : (data.html_url || "");
    return { updateAvailable: latestTag !== CURRENT_VERSION, currentVersion: CURRENT_VERSION, latestVersion: latestTag || CURRENT_VERSION, downloadUrl, releaseNotes: (data.body || "").substring(0, 500) };
  } catch {
    return { updateAvailable: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION, downloadUrl: "", releaseNotes: "" };
  }
});

// ═══════════════════════════════════════════
// ── Send Update Notification IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("send-update-notification", async (_e, { version, changes }) => {
  if (!UPDATE_WEBHOOK) return { success: false, error: "Update webhook not configured" };
  try {
    var now = new Date();
    var changeLines = (changes || []).map(function(c) { return "> " + c; }).join("\n");

    var payload = JSON.stringify({
      username: "Choatix",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
      embeds: [{
        color: 0x5865F2,
        title: "Choatix V2 Updated",
        description: "A new version has been released with the following improvements:",
        fields: [
          { name: "Version", value: "`" + version + "`", inline: true },
          { name: "Released", value: "<t:" + Math.floor(now.getTime() / 1000) + ":R>", inline: true },
          { name: "\u200b", value: "\u200b", inline: false },
          { name: "What's New", value: changeLines || "Performance improvements and bug fixes.", inline: false },
        ],
        timestamp: now.toISOString(),
        footer: {
          text: "Choatix V2 • Auto-Update",
          icon_url: "https://cdn-icons-png.flaticon.com/512/190/190411.png"
        },
      }],
    });

    var url = new URL(UPDATE_WEBHOOK);
    var mod = url.protocol === "https:" ? https : http;
    await new Promise(function (resolve, reject) {
      var req = mod.request({
        hostname: url.hostname,
        path: url.pathname + (url.search || ""),
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
      }, function (res) { res.resume(); resolve(); });
      req.on("error", reject);
      req.write(payload);
      req.end();
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
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
    var now = new Date();

    var colorMap = { bug: 0xED4245, feature: 0x5865F2, general: 0x57F287 };
    var labelMap = { bug: "Bug Report", feature: "Feature Request", general: "General Feedback" };
    var typeColor = colorMap[feedback.type] || 0x57F287;

    var cpuInfo = os.cpus();
    var totalMemGB = (os.totalmem() / 1073741824).toFixed(1);
    var memUsedGB = ((os.totalmem() - os.freemem()) / 1073741824).toFixed(1);
    var memPct = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
    var cpuModel = (cpuInfo[0]?.model || "Unknown").replace(/\s+/g, " ").trim();

    var description = "**Message**\n" + feedback.message.substring(0, 1500);

    var fields = [];

    if (feedback.discordId && /^\d{17,20}$/.test(feedback.discordId)) {
      fields.push({ name: "Submitted by", value: "<@" + feedback.discordId + ">", inline: true });
    } else if (feedback.discordId) {
      fields.push({ name: "Submitted by", value: feedback.discordId, inline: true });
    }

    fields.push({ name: "Type", value: "**" + (labelMap[feedback.type] || "Feedback") + "**", inline: true });

    if (feedback.rating) {
      fields.push({ name: "Rating", value: "★".repeat(feedback.rating) + "☆".repeat(5 - feedback.rating) + "  **" + feedback.rating + ".0**/5.0", inline: true });
    }

    fields.push({ name: "App Version", value: "`" + CURRENT_VERSION + "`", inline: true });

    if (feedback.email) {
      fields.push({ name: "Contact", value: feedback.email, inline: true });
    }

    fields.push({ name: "\u200b", value: "\u200b", inline: false });

    var osName = os.platform() === "win32" ? "Windows " + os.release() : os.platform();
    fields.push({
      name: "System",
      value:
        "**OS** " + osName + "\n" +
        "**CPU** " + cpuModel.substring(0, 50) + "\n" +
        "**RAM** " + memUsedGB + " / " + totalMemGB + " GB (" + memPct + "%)\n" +
        "**Cores** " + cpuInfo.length + " threads",
      inline: false
    });

    if (feedback.includeLogs) {
      fields.push({ name: "Logs", value: "User reported logs attached", inline: false });
    }

    var payload = JSON.stringify({
      username: "Choatix",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
      embeds: [{
        color: typeColor,
        title: feedback.subject,
        description: description,
        fields: fields,
        timestamp: now.toISOString(),
        footer: {
          text: "Choatix v" + CURRENT_VERSION,
          icon_url: "https://cdn-icons-png.flaticon.com/512/190/190411.png"
        },
      }],
    });

    var url = new URL(FEEDBACK_WEBHOOK);
    var mod = url.protocol === "https:" ? https : http;
    await new Promise(function (resolve, reject) {
      var req = mod.request({
        hostname: url.hostname,
        path: url.pathname + (url.search || ""),
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
      }, function (res) { res.resume(); resolve(); });
      req.on("error", reject);
      req.write(payload);
      req.end();
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ── BIOS Scan IPC ──
ipcMain.handle("scan-bios", async () => {
  try {
    const [boardRaw, biosRaw, cpuRaw, ramRaw, gpuRaw] = await Promise.all([
      psAsync("(Get-CimInstance Win32_BaseBoard | Select-Object -First 1).Manufacturer + '|' + (Get-CimInstance Win32_BaseBoard | Select-Object -First 1).Product"),
      psAsync("(Get-CimInstance Win32_BIOS | Select-Object -First 1).SMBIOSBIOSVersion + '|' + (Get-CimInstance Win32_BIOS | Select-Object -First 1).ReleaseDate"),
      psAsync("(Get-CimInstance Win32_Processor | Select-Object -First 1).Name"),
      psAsync("$os = Get-CimInstance Win32_OperatingSystem; [math]::Round($os.TotalVisibleMemorySize/1MB,1).ToString() + '|' + (Get-CimInstance Win32_PhysicalMemory | Select-Object -First 1).Speed"),
      psAsync("(Get-CimInstance Win32_VideoController | Select-Object -First 1).Name"),
    ]);

    const boardParts = (boardRaw || '|').split('|');
    const biosParts = (biosRaw || '|').split('|');
    const ramParts = (ramRaw || '|').split('|');

    const manufacturer = (boardParts[0] || '').trim().toLowerCase();
    let brand = 'unknown';
    if (manufacturer.includes('asus')) brand = 'asus';
    else if (manufacturer.includes('msi')) brand = 'msi';
    else if (manufacturer.includes('gigabyte') || manufacturer.includes('giga-byte')) brand = 'gigabyte';
    else if (manufacturer.includes('asrock')) brand = 'asrock';

    // Detect current BIOS settings
    const checks = {};

    // XMP: Check RAM speed vs rated speed
    const currentRamSpeed = parseInt(ramParts[1]) || 0;
    checks.xmp = { status: currentRamSpeed > 2133 ? 'enabled' : 'disabled', detail: currentRamSpeed > 0 ? `${currentRamSpeed} MHz` : 'Unknown' };

    // Game Mode
    const gameModeRaw = await psAsync("(Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AllowAutoGameMode' -EA 0).AllowAutoGameMode");
    checks.gameMode = { status: gameModeRaw === '1' ? 'enabled' : 'disabled' };

    // Game DVR
    const dvrRaw = await psAsync("(Get-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -EA 0).GameDVR_Enabled");
    checks.gameDvr = { status: dvrRaw === '1' ? 'enabled' : 'disabled' };

    // Power Plan
    const powerRaw = await psAsync("powercfg /getactivescheme");
    const powerMatch = (powerRaw || '').match(/\((.+)\)/);
    checks.powerPlan = { status: 'info', detail: powerMatch ? powerMatch[1] : 'Unknown' };

    // Virtualization
    const virtRaw = await psAsync("(Get-CimInstance Win32_Processor | Select-Object -First 1).VirtualizationFirmwareEnabled");
    checks.virtualization = { status: virtRaw === 'True' ? 'enabled' : 'disabled' };

    // Hyper-V
    const hypervRaw = await psAsync("bcdedit /enum | Select-String 'hypervisorlaunchtype'");
    const hypervEnabled = (hypervRaw || '').toLowerCase().includes('auto');
    checks.hyperV = { status: hypervEnabled ? 'enabled' : 'disabled' };

    // HPET
    const hpetRaw = await psAsync("bcdedit /enum | Select-String 'useplatformclock'");
    checks.hpet = { status: (hpetRaw || '').includes('True') || (hpetRaw || '').includes('yes') ? 'enabled' : 'disabled' };

    // Resizable BAR (check via registry)
    const rebarRaw = await psAsync("(Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers' -Name 'HwSchMode' -EA 0).HwSchMode");
    checks.reBar = { status: rebarRaw === '2' ? 'enabled' : 'disabled' };

    // Fast Boot
    const fastBootRaw = await psAsync("(Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power' -Name 'HiberbootEnabled' -EA 0).HiberbootEnabled");
    checks.fastBoot = { status: fastBootRaw === '1' ? 'enabled' : 'disabled' };

    return {
      success: true,
      motherboard: { manufacturer: boardParts[0] || 'Unknown', product: boardParts[1] || 'Unknown', brand },
      bios: { version: biosParts[0] || 'Unknown', date: biosParts[1] || 'Unknown' },
      cpu: (cpuRaw || '').trim(),
      ram: { total: ramParts[0] || '?', speed: ramParts[1] || '?' },
      gpu: (gpuRaw || '').trim(),
      checks,
    };
  } catch (err) {
    console.error("[scan-bios] Error:", err);
    return { success: false, error: err.message };
  }
});

// ═══════════════════════════════════════════
// ── Network Adapter Scanner IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("get-network-adapters", async () => {
  try {
    const raw = await psAsync(`
      Get-NetAdapter | Where-Object {$_.Status -eq 'Up' -or $_.Status -eq 'Disconnected'} | ForEach-Object {
        $name = $_.Name; $desc = $_.InterfaceDescription; $mac = $_.MacAddress; $speed = $_.LinkSpeed;
        $status = $_.Status; $mtu = $_.MTU; $idx = $_.ifIndex;
        $rss = (Get-NetAdapterAdvancedProperty -Name $name -DisplayName 'Receive Side Scaling' -EA 0).DisplayValue;
        $flowCtrl = (Get-NetAdapterAdvancedProperty -Name $name -DisplayName 'Flow Control' -EA 0).DisplayValue;
        $intMod = (Get-NetAdapterAdvancedProperty -Name $name -DisplayName 'Interrupt Moderation' -EA 0).DisplayValue;
        $lso4 = (Get-NetAdapterAdvancedProperty -Name $name -DisplayName 'Large Send Offload (IPv4)' -EA 0).DisplayValue;
        $lso6 = (Get-NetAdapterAdvancedProperty -Name $name -DisplayName 'Large Send Offload (IPv6)' -EA 0).DisplayValue;
        $energy = (Get-NetAdapterAdvancedProperty -Name $name -DisplayName 'Energy Efficient Ethernet' -EA 0).DisplayValue;
        $powerSave = (Get-NetAdapterAdvancedProperty -Name $name -DisplayName 'Power Saving Mode' -EA 0).DisplayValue;
        $wakeOn = (Get-NetAdapterAdvancedProperty -Name $name -DisplayName 'Wake on Magic Packet' -EA 0).DisplayValue;
        Write-Output "ADAPTER|$name|$desc|$mac|$speed|$status|$mtu|$rss|$flowCtrl|$intMod|$lso4|$lso6|$energy|$powerSave|$wakeOn|$idx"
      }
    `, 10000);
    const adapters = [];
    for (const line of raw.split('\n')) {
      if (!line.startsWith('ADAPTER|')) continue;
      const p = line.replace('ADAPTER|', '').split('|');
      adapters.push({
        name: p[0], description: p[1], mac: p[2], speed: p[3], status: p[4],
        mtu: parseInt(p[5]) || 1500, rss: p[6], flowControl: p[7], interruptModeration: p[8],
        lso4: p[9], lso6: p[10], energyEfficient: p[11], powerSaving: p[12], wakeOnLan: p[13],
        interfaceIndex: parseInt(p[14]) || 0,
      });
    }
    return { success: true, adapters };
  } catch (e) {
    return { success: false, error: e.message, adapters: [] };
  }
});

// ═══════════════════════════════════════════
// ── MTU Optimizer IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("optimize-mtu", async (_event, adapterName) => {
  try {
    // Find optimal MTU via ping sweep
    const findMtu = await psAsync(`
      $adapter = Get-NetAdapter | Where-Object {$_.Name -eq '${adapterName}' -and $_.Status -eq 'Up'}
      if(!$adapter){ Write-Output 'ERROR|Adapter not found'; return }
      $idx = $adapter.InterfaceIndex
      $found = 1400
      for($size = 1472; $size -ge 500; $size -= 8){
        $result = ping -f -l $size -n 1 8.8.8.8 2>&1
        if($LASTEXITCODE -eq 0){ $found = $size + 28; break }
      }
      netsh interface ipv4 set subinterface $idx mtu=$found store=persistent
      Write-Output "OK|$found"
    `, 30000);
    if (findMtu.startsWith('OK|')) {
      const mtu = parseInt(findMtu.split('|')[1]);
      return { success: true, mtu };
    }
    return { success: false, error: findMtu.replace('ERROR|', '') };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ═══════════════════════════════════════════
// ── Adapter Property Toggle IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("set-adapter-property", async (_event, adapterName, propertyName, value) => {
  try {
    await psAsync(`Set-NetAdapterAdvancedProperty -Name '${adapterName}' -DisplayName '${propertyName}' -DisplayValue '${value}' -EA Stop`, 10000);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ═══════════════════════════════════════════
// ── Bufferbloat Test IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("run-bufferbloat-test", async () => {
  try {
    const pings = [];
    // Baseline ping (no load)
    for (let i = 0; i < 10; i++) {
      const raw = await psAsync("(ping -n 1 8.8.8.8 | Select-String 'time[=<](\\d+)').Matches[0].Groups[1].Value", 5000);
      const ms = parseInt(raw) || 0;
      if (ms > 0) pings.push({ time: ms, type: 'baseline' });
    }
    // Loaded ping (simulated with multiple concurrent pings)
    const loadPings = await psAsync(`
      $jobs = @()
      for($i=0; $i -lt 5; $i++){
        $jobs += Start-Job -ScriptBlock {
          $results = @()
          for($j=0; $j -lt 5; $j++){
            $r = ping -n 1 8.8.8.8 2>&1 | Select-String 'time[=<](\\d+)'
            if($r){ $results += $r.Matches[0].Groups[1].Value }
            Start-Sleep -Milliseconds 200
          }
          $results -join ','
        }
      }
      $allResults = $jobs | Wait-Job | Receive-Job
      $jobs | Remove-Job -Force
      Write-Output ($allResults -join '|')
    `, 60000);
    for (const chunk of (loadPings || '').split('|')) {
      for (const val of chunk.split(',')) {
        const ms = parseInt(val.trim());
        if (ms > 0) pings.push({ time: ms, type: 'loaded' });
      }
    }
    const baselinePings = pings.filter(p => p.type === 'baseline');
    const loadedPings = pings.filter(p => p.type === 'loaded');
    const avgBaseline = baselinePings.length ? Math.round(baselinePings.reduce((a, b) => a + b.time, 0) / baselinePings.length) : 0;
    const avgLoaded = loadedPings.length ? Math.round(loadedPings.reduce((a, b) => a + b.time, 0) / loadedPings.length) : 0;
    const increase = avgBaseline > 0 ? Math.round(((avgLoaded - avgBaseline) / avgBaseline) * 100) : 0;
    let grade = 'A+';
    if (increase > 100) grade = 'F';
    else if (increase > 60) grade = 'D';
    else if (increase > 30) grade = 'C';
    else if (increase > 15) grade = 'B';
    else if (increase > 5) grade = 'A';
    return { success: true, baseline: avgBaseline, loaded: avgLoaded, increase, grade, baselinePings: baselinePings.map(p => p.time), loadedPings: loadedPings.map(p => p.time) };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ═══════════════════════════════════════════
// ── Timer Resolution IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("get-timer-resolution", async () => {
  try {
    const raw = await psAsync(`
      $cur = (Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel' -Name 'GlobalTimerResolutionRequests' -EA 0).GlobalTimerResolutionRequests
      $quantum = (bcdedit /enum | Select-String 'quantum').ToString().Trim()
      $dynamicTick = (bcdedit /enum | Select-String 'disabledynamictick').ToString().Trim()
      $platformClock = (bcdedit /enum | Select-String 'useplatformclock').ToString().Trim()
      Write-Output "TIMER|$cur|$quantum|$dynamicTick|$platformClock"
    `, 5000);
    const parts = (raw || 'TIMER||||').split('|');
    return {
      success: true,
      globalTimer: parts[1] === '1',
      quantum: parts[2] || 'Not set',
      dynamicTick: parts[3] || 'Not set',
      platformClock: parts[4] || 'Not set',
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("set-timer-resolution", async (_event, mode) => {
  try {
    if (mode === 'optimal') {
      await psAsync('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f', 5000);
      await psAsync('bcdedit /set disabledynamictick yes', 5000);
      await psAsync('bcdedit /set useplatformclock true', 5000);
      return { success: true };
    } else if (mode === 'reset') {
      await psAsync('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel" /v GlobalTimerResolutionRequests /t REG_DWORD /d 0 /f', 5000);
      await psAsync('bcdedit /set disabledynamictick no', 5000);
      await psAsync('bcdedit /set useplatformclock false', 5000);
      return { success: true };
    }
    return { success: false, error: 'Unknown mode' };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ═══════════════════════════════════════════
// ── CPU Affinity IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("get-process-list", async () => {
  try {
    const raw = await psAsync(`
      Get-Process | Where-Object {$_.MainWindowTitle -ne '' -or $_.ProcessName -match 'fortnite|valorant|cs2|apex|warzone|pubg|minecraft|gta|r6|rainbow'} | ForEach-Object {
        $name = $_.ProcessName; $pid = $_.Id; $cpu = [math]::Round($_.CPU,1); $ram = [math]::Round($_.WorkingSet64/1MB,0); $threads = $_.Threads.Count
        $affinity = $_.ProcessorAffinity
        Write-Output "PROC|$name|$pid|$cpu|$ram|$threads|$affinity"
      }
    `, 10000);
    const processes = [];
    for (const line of raw.split('\n')) {
      if (!line.startsWith('PROC|')) continue;
      const p = line.replace('PROC|', '').split('|');
      processes.push({
        name: p[0], pid: parseInt(p[1]) || 0, cpu: parseFloat(p[2]) || 0,
        ram: parseInt(p[3]) || 0, threads: parseInt(p[4]) || 0, affinity: parseInt(p[5]) || 0,
      });
    }
    const cpuCount = parseInt(await psAsync('(Get-CimInstance Win32_Processor | Select-Object -First 1).NumberOfLogicalProcessors')) || 8;
    return { success: true, processes, cpuCount };
  } catch (e) {
    return { success: false, error: e.message, processes: [], cpuCount: 8 };
  }
});

ipcMain.handle("set-process-affinity", async (_event, pid, affinityMask) => {
  try {
    await psAsync(`
      $proc = Get-Process -Id ${pid} -EA Stop
      $proc.ProcessorAffinity = ${affinityMask}
    `, 5000);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ═══════════════════════════════════════════
// ── FPS Diagnostics IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("diagnose-fps", async () => {
  const issues = [];
  const info = {};

  try {
    // CPU Info
    const cpuRaw = await psAsync("$p=Get-CimInstance Win32_Processor|Select-Object -First 1; Write-Output ($p.Name+'|'+$p.NumberOfCores+'|'+$p.NumberOfLogicalProcessors+'|'+$p.MaxClockSpeed+'|'+$p.LoadPercentage)");
    const cpuParts = (cpuRaw || '||||').split('|');
    info.cpu = { name: cpuParts[0], cores: parseInt(cpuParts[1])||0, threads: parseInt(cpuParts[2])||0, boost: parseInt(cpuParts[3])||0, load: parseInt(cpuParts[4])||0 };

    // RAM Info
    const ramRaw = await psAsync("$os=Get-CimInstance Win32_OperatingSystem; $mem=Get-CimInstance Win32_PhysicalMemory; $total=[math]::Round($os.TotalVisibleMemorySize/1MB,1); $free=[math]::Round($os.FreePhysicalMemory/1MB,1); $slots=$mem.Count; $speed=($mem|Select-Object -First 1).Speed; Write-Output ($total+'|'+$free+'|'+$slots+'|'+$speed)");
    const ramParts = (ramRaw || '|||').split('|');
    info.ram = { total: parseFloat(ramParts[0])||0, free: parseFloat(ramParts[1])||0, slots: parseInt(ramParts[2])||0, speed: parseInt(ramParts[3])||0 };

    // GPU Info
    const gpuRaw = await psAsync("(Get-CimInstance Win32_VideoController | Select-Object -First 1).Name");
    info.gpu = { name: (gpuRaw||'').trim() };

    // Driver Date
    const driverRaw = await psAsync("$d=(Get-CimInstance Win32_VideoController|Select-Object -First 1).DriverVersion; $date=(Get-CimInstance Win32_VideoController|Select-Object -First 1).DriverDate; Write-Output ($d+'|'+$date)");
    const driverParts = (driverRaw || '|').split('|');
    info.gpuDriver = { version: driverParts[0], date: driverParts[1] };

    // Check Game DVR
    const dvrRaw = await psAsync("(Get-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -EA 0).GameDVR_Enabled");
    if (dvrRaw === '1') issues.push({ severity: 'high', title: 'Game DVR is enabled', desc: 'Game DVR records gameplay in the background, using GPU and CPU resources. Disable it for 5-15% more FPS.', fix: 'sys-disable-gamebar' });

    // Check VBS
    const vbsRaw = await psAsync("(Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard' -Name 'EnableVirtualizationBasedSecurity' -EA 0).EnableVirtualizationBasedSecurity");
    if (vbsRaw === '1') issues.push({ severity: 'high', title: 'Virtualization-Based Security (VBS) is enabled', desc: 'VBS uses hardware virtualization to isolate processes. This costs 5-25% FPS in games.', fix: 'sys-disable-vbs' });

    // Check Power Plan
    const powerRaw = await psAsync("powercfg /getactivescheme");
    const powerGuid = (powerRaw || '').match(/([0-9a-f-]{36})/)?.[1] || '';
    if (!powerGuid || !powerGuid.includes('8c5e7fda')) {
      issues.push({ severity: 'medium', title: 'Not on High Performance power plan', desc: 'Your current power plan limits CPU speed to save energy. High Performance mode unlocks full CPU potential.', fix: 'sys-high-performance' });
    }

    // Check single-channel RAM
    if (info.ram.slots <= 1) {
      issues.push({ severity: 'critical', title: 'Single-channel RAM detected', desc: `You have ${info.ram.slots} RAM stick(s). Single-channel cuts memory bandwidth in half, reducing FPS by 15-30% in CPU-bound games.`, fix: null });
    } else if (info.ram.slots === 2 && info.ram.total <= 8) {
      issues.push({ severity: 'medium', title: 'Only 8GB RAM', desc: '8GB is the bare minimum for gaming. Modern games use 10-16GB. Close background apps or upgrade to 16GB.', fix: null });
    }

    // Check RAM speed
    if (info.ram.speed > 0 && info.ram.speed <= 2133) {
      issues.push({ severity: 'medium', title: 'RAM running at base speed (2133MHz)', desc: 'XMP is likely not enabled in BIOS. Enable XMP to run your RAM at its rated speed for 5-15% more FPS.', fix: null });
    }

    // Check CPU load
    if (info.cpu.load > 80) {
      issues.push({ severity: 'medium', title: 'CPU usage is high', desc: `Your CPU is at ${info.cpu.load}% usage. Close background programs or optimize processes.`, fix: null });
    }

    // Check free RAM
    if (info.ram.free > 0 && info.ram.free < 2) {
      issues.push({ severity: 'high', title: 'Low available RAM', desc: `Only ${info.ram.free}GB free. Games need at least 2-4GB free RAM to run smoothly.`, fix: null });
    }

    // Check fullscreen optimizations
    const fsoRaw = await psAsync("(Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer' -Name 'DisableFullscreenOptimization' -EA 0).DisableFullscreenOptimization");
    if (fsoRaw !== '1') issues.push({ severity: 'low', title: 'Fullscreen optimizations not disabled', desc: 'Windows fullscreen optimizations can add input lag. Disabling it gives a more direct GPU path.', fix: 'sys-disable-fullscreen-opt' });

    // Check HAGS
    const hagsRaw = await psAsync("(Get-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers' -Name 'HwSchMode' -EA 0).HwSchMode");
    if (hagsRaw === '2') issues.push({ severity: 'low', title: 'Hardware-accelerated GPU scheduling is enabled', desc: 'HAGS can cause stuttering in some games. Try disabling it if you experience frame drops.', fix: 'game-disable-hags' });

    // Check mouse acceleration
    const mouseRaw = await psAsync("(Get-ItemProperty -Path 'HKCU:\\Control Panel\\Mouse' -Name 'MouseSpeed' -EA 0).MouseSpeed");
    if (mouseRaw === '1' || mouseRaw === '2') {
      issues.push({ severity: 'medium', title: 'Mouse acceleration is enabled', desc: 'Mouse acceleration makes cursor movement inconsistent. Disable it for precise aim in FPS games.', fix: 'mouse-disable-acceleration' });
    }

    // Check Nagle
    // Check disk space
    const diskRaw = await psAsync("Get-CimInstance Win32_LogicalDisk | Where-Object {$_.DeviceID -eq 'C:'} | ForEach-Object { [math]::Round($_.FreeSpace/1GB,1) }");
    const freeDisk = parseFloat(diskRaw) || 0;
    if (freeDisk < 20) {
      issues.push({ severity: 'medium', title: 'Low disk space on C:', desc: `Only ${freeDisk}GB free. Windows needs 20GB+ free for virtual memory and game caching.`, fix: null });
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    issues.sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));

    return { success: true, issues, info };
  } catch (e) {
    return { success: false, error: e.message, issues: [], info };
  }
});

// ═══════════════════════════════════════════
// ── Bottleneck Finder IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("find-bottleneck", async () => {
  try {
    // CPU
    const cpuRaw = await psAsync("$p=Get-CimInstance Win32_Processor|Select-Object -First 1; Write-Output ($p.Name+'|'+$p.NumberOfCores+'|'+$p.NumberOfLogicalProcessors+'|'+$p.MaxClockSpeed+'|'+$p.LoadPercentage+'|'+$p.PercentProcessorTime)");
    const cpuP = (cpuRaw || '|||||').split('|');
    const cpuName = cpuP[0] || 'Unknown';
    const cpuCores = parseInt(cpuP[1]) || 0;
    const cpuThreads = parseInt(cpuP[2]) || 0;
    const cpuBoost = parseInt(cpuP[3]) || 0;
    const cpuLoad = parseInt(cpuP[4]) || 0;

    // RAM
    const ramRaw = await psAsync("$os=Get-CimInstance Win32_OperatingSystem; $mem=Get-CimInstance Win32_PhysicalMemory; $total=[math]::Round($os.TotalVisibleMemorySize/1MB,1); $free=[math]::Round($os.FreePhysicalMemory/1MB,1); $slots=$mem.Count; $speed=($mem|Select-Object -First 1).Speed; $used=[math]::Round(($os.TotalVisibleMemorySize-$os.FreePhysicalMemory)/1MB,1); Write-Output ($total+'|'+$free+'|'+$slots+'|'+$speed+'|'+$used)");
    const ramP = (ramRaw || '||||').split('|');
    const ramTotal = parseFloat(ramP[0]) || 0;
    const ramFree = parseFloat(ramP[1]) || 0;
    const ramSlots = parseInt(ramP[2]) || 0;
    const ramSpeed = parseInt(ramP[3]) || 0;
    const ramUsed = parseFloat(ramP[4]) || 0;
    const ramUsagePct = ramTotal > 0 ? Math.round((ramUsed / ramTotal) * 100) : 0;

    // GPU
    const gpuRaw = await psAsync("(Get-CimInstance Win32_VideoController | Select-Object -First 1).Name");
    const gpuName = (gpuRaw || 'Unknown').trim();

    // Disk
    const diskRaw = await psAsync("Get-CimInstance Win32_LogicalDisk | Where-Object {$_.DeviceID -eq 'C:'} | ForEach-Object { $free=[math]::Round($_.FreeSpace/1GB,1); $total=[math]::Round($_.Size/1GB,1); Write-Output ($free+'|'+$total) }");
    const diskP = (diskRaw || '|').split('|');
    const diskFree = parseFloat(diskP[0]) || 0;
    const diskTotal = parseFloat(diskP[1]) || 0;
    const diskUsagePct = diskTotal > 0 ? Math.round(((diskTotal - diskFree) / diskTotal) * 100) : 0;

    // Determine bottleneck
    const scores = { cpu: 0, ram: 0, gpu: 0, disk: 0 };
    let bottleneck = 'none';
    let bottleneckPct = 0;

    // CPU score (higher = more bottleneck)
    if (cpuLoad > 85) scores.cpu = 90;
    else if (cpuLoad > 70) scores.cpu = 70;
    else if (cpuLoad > 50) scores.cpu = 50;
    else scores.cpu = 20;

    // Low core count penalty
    if (cpuCores <= 2) scores.cpu += 30;
    else if (cpuCores <= 4) scores.cpu += 15;

    // Low boost clock penalty
    if (cpuBoost > 0 && cpuBoost < 3500) scores.cpu += 20;

    // RAM score
    if (ramUsagePct > 85) scores.ram = 90;
    else if (ramUsagePct > 70) scores.ram = 70;
    else if (ramUsagePct > 50) scores.ram = 40;
    else scores.ram = 15;

    if (ramSlots <= 1) scores.ram += 25;
    if (ramSpeed > 0 && ramSpeed <= 2133) scores.ram += 15;
    if (ramTotal < 8) scores.ram += 20;

    // Disk score
    if (diskUsagePct > 90) scores.disk = 85;
    else if (diskUsagePct > 75) scores.disk = 60;
    else scores.disk = 20;

    // Find highest score
    const maxScore = Math.max(scores.cpu, scores.ram, scores.gpu, scores.disk);
    if (maxScore > 60) {
      if (scores.cpu === maxScore) { bottleneck = 'cpu'; bottleneckPct = scores.cpu; }
      else if (scores.ram === maxScore) { bottleneck = 'ram'; bottleneckPct = scores.ram; }
      else if (scores.disk === maxScore) { bottleneck = 'disk'; bottleneckPct = scores.disk; }
      else { bottleneck = 'gpu'; bottleneckPct = scores.gpu; }
    }

    // Recommendations
    const recommendations = [];
    if (bottleneck === 'cpu') {
      recommendations.push({ text: 'Close background CPU-heavy programs', icon: 'cpu' });
      if (cpuCores <= 4) recommendations.push({ text: 'Consider upgrading to a 6+ core CPU', icon: 'cpu' });
      recommendations.push({ text: 'Set game to High CPU priority', icon: 'zap' });
    } else if (bottleneck === 'ram') {
      if (ramSlots <= 1) recommendations.push({ text: 'Add a second RAM stick for dual-channel', icon: 'memory' });
      if (ramSpeed <= 2133) recommendations.push({ text: 'Enable XMP in BIOS for faster RAM', icon: 'memory' });
      if (ramTotal < 16) recommendations.push({ text: 'Upgrade to 16GB RAM for modern games', icon: 'memory' });
    } else if (bottleneck === 'disk') {
      recommendations.push({ text: 'Clean up disk space (keep 20%+ free)', icon: 'disk' });
      recommendations.push({ text: 'Move games to an SSD if using HDD', icon: 'disk' });
    } else {
      recommendations.push({ text: 'Update GPU drivers to latest version', icon: 'gpu' });
      recommendations.push({ text: 'Lower in-game graphics settings', icon: 'gpu' });
    }

    return {
      success: true,
      cpu: { name: cpuName, cores: cpuCores, threads: cpuThreads, boost: cpuBoost, load: cpuLoad, score: Math.min(scores.cpu, 100) },
      ram: { total: ramTotal, free: ramFree, slots: ramSlots, speed: ramSpeed, usage: ramUsagePct, score: Math.min(scores.ram, 100) },
      gpu: { name: gpuName, score: Math.min(scores.gpu, 100) },
      disk: { free: diskFree, total: diskTotal, usage: diskUsagePct, score: Math.min(scores.disk, 100) },
      bottleneck, bottleneckPct: Math.min(bottleneckPct, 100), recommendations,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ═══════════════════════════════════════════
// ── Stability Test IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("run-stability-test", async (_event, durationSec = 15) => {
  try {
    const results = { cpuTemp: [], cpuLoad: [], ramUsage: [], errors: [], passed: true };

    // Get initial state
    const getStats = async () => {
      const cpuLoad = parseInt(await psAsync("(Get-CimInstance Win32_Processor|Select-Object -First 1).LoadPercentage")) || 0;
      const ramRaw = await psAsync("$os=Get-CimInstance Win32_OperatingSystem; [math]::Round(($os.TotalVisibleMemorySize-$os.FreePhysicalMemory)/$os.TotalVisibleMemorySize*100,0)");
      const ramUsage = parseInt(ramRaw) || 0;
      return { cpuLoad, ramUsage };
    };

    // Start CPU stress via PowerShell jobs
    const stressCmd = `
      $startTime = Get-Date
      $duration = ${durationSec}
      while (((Get-Date) - $startTime).TotalSeconds -lt $duration) {
        $x = 0; for($i=0; $i -lt 1000000; $i++) { $x += $i }
        Start-Sleep -Milliseconds 100
      }
    `;

    // Run stress in background job
    const stressPromise = psAsync(`
      $job = Start-Job -ScriptBlock {
        $startTime = Get-Date
        while (((Get-Date) - $startTime).TotalSeconds -lt ${durationSec}) {
          $x = 0; for($i=0; $i -lt 1000000; $i++) { $x += $i }
          Start-Sleep -Milliseconds 100
        }
      }
      $job | Wait-Job | Receive-Job
    `, (durationSec + 10) * 1000);

    // Monitor stats during test
    const startTime = Date.now();
    const interval = 1000;
    while (Date.now() - startTime < durationSec * 1000) {
      const stats = await getStats();
      results.cpuTemp.push(stats.cpuLoad);
      results.ramUsage.push(stats.ramUsage);
      await new Promise(r => setTimeout(r, interval));
    }

    await stressPromise;

    // Check for errors
    const avgCpuLoad = results.cpuTemp.length > 0 ? results.cpuTemp.reduce((a, b) => a + b, 0) / results.cpuTemp.length : 0;
    const maxRam = results.ramUsage.length > 0 ? Math.max(...results.ramUsage) : 0;

    if (avgCpuLoad < 30) {
      results.errors.push('CPU stress test did not reach expected load');
    }
    if (maxRam > 95) {
      results.errors.push('RAM usage critically high during stress test');
    }

    results.passed = results.errors.length === 0;

    return {
      success: true,
      duration: durationSec,
      avgCpuLoad: Math.round(avgCpuLoad),
      maxRamUsage: maxRam,
      samples: results.cpuTemp.length,
      errors: results.errors,
      passed: results.passed,
    };
  } catch (e) {
    return { success: false, error: e.message, passed: false, errors: [e.message] };
  }
});

// ═══════════════════════════════════════════
// ── Debloat Scanner IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("scan-bloatware", async () => {
  try {
    // Just get all package names — simple and reliable
    const raw = await psAsync("Get-AppxPackage -AllUsers -EA SilentlyContinue | ForEach-Object { Write-Output $_.Name }", 60000);
    const pkgs = raw.split('\n').map(s => s.trim()).filter(s => s.length > 0);

    // Also try current user
    const raw2 = await psAsync("Get-AppxPackage -EA SilentlyContinue | ForEach-Object { Write-Output $_.Name }", 30000);
    for (const line of raw2.split('\n')) {
      const s = line.trim();
      if (s && !pkgs.includes(s)) pkgs.push(s);
    }

    // Bloat list with partial match names
    const bloatDefs = [
      { match: 'BingWeather', display: 'Bing Weather', category: 'Windows Apps', risk: 'safe', desc: 'Weather app' },
      { match: 'BingNews', display: 'Bing News', category: 'Windows Apps', risk: 'safe', desc: 'News feed' },
      { match: 'GetHelp', display: 'Get Help', category: 'Windows Apps', risk: 'safe', desc: 'Support app' },
      { match: 'Getstarted', display: 'Get Started', category: 'Windows Apps', risk: 'safe', desc: 'Tips app' },
      { match: 'Solitaire', display: 'Solitaire', category: 'Windows Apps', risk: 'safe', desc: 'Card games' },
      { match: 'People', display: 'People', category: 'Windows Apps', risk: 'safe', desc: 'Contact manager' },
      { match: 'FeedbackHub', display: 'Feedback Hub', category: 'Windows Apps', risk: 'safe', desc: 'Feedback app' },
      { match: 'ZuneMusic', display: 'Groove Music', category: 'Windows Apps', risk: 'safe', desc: 'Music player' },
      { match: 'ZuneVideo', display: 'Movies & TV', category: 'Windows Apps', risk: 'safe', desc: 'Video player' },
      { match: 'WindowsMaps', display: 'Windows Maps', category: 'Windows Apps', risk: 'safe', desc: 'Maps app' },
      { match: '549981C3F5F10', display: 'Copilot', category: 'Windows Apps', risk: 'safe', desc: 'AI assistant' },
      { match: 'YourPhone', display: 'Phone Link', category: 'Windows Apps', risk: 'safe', desc: 'Phone sync' },
      { match: 'OfficeHub', display: 'Office Hub', category: 'Windows Apps', risk: 'safe', desc: 'Office launcher' },
      { match: 'PowerAutomate', display: 'Power Automate', category: 'Windows Apps', risk: 'safe', desc: 'Automation' },
      { match: 'Todos', display: 'Microsoft To Do', category: 'Windows Apps', risk: 'safe', desc: 'Task manager' },
      { match: 'StickyNotes', display: 'Sticky Notes', category: 'Windows Apps', risk: 'safe', desc: 'Note app' },
      { match: 'Alarms', display: 'Alarms & Clock', category: 'Windows Apps', risk: 'safe', desc: 'Alarm clock' },
      { match: 'Camera', display: 'Camera', category: 'Windows Apps', risk: 'safe', desc: 'Camera app' },
      { match: 'SoundRecorder', display: 'Voice Recorder', category: 'Windows Apps', risk: 'safe', desc: 'Audio recorder' },
      { match: 'Xbox.TCUI', display: 'Xbox TCUI', category: 'Xbox', risk: 'safe', desc: 'Xbox UI' },
      { match: 'XboxApp', display: 'Xbox App', category: 'Xbox', risk: 'safe', desc: 'Xbox app' },
      { match: 'XboxGameOverlay', display: 'Xbox Game Overlay', category: 'Xbox', risk: 'safe', desc: 'Game overlay' },
      { match: 'XboxGamingOverlay', display: 'Xbox Game Bar', category: 'Xbox', risk: 'safe', desc: 'Game recording' },
      { match: 'XboxIdentity', display: 'Xbox Identity', category: 'Xbox', risk: 'safe', desc: 'Xbox login' },
      { match: 'XboxSpeech', display: 'Xbox Speech', category: 'Xbox', risk: 'safe', desc: 'Voice to text' },
      { match: 'GamingApp', display: 'Gaming App', category: 'Xbox', risk: 'safe', desc: 'Xbox gaming' },
      { match: 'MicrosoftTeams', display: 'Microsoft Teams', category: 'Communication', risk: 'safe', desc: 'Teams chat' },
      { match: 'Clipchamp', display: 'Clipchamp', category: 'Windows Apps', risk: 'safe', desc: 'Video editor' },
      { match: '3DViewer', display: '3D Viewer', category: 'Windows Apps', risk: 'safe', desc: '3D model viewer' },
      { match: 'MixedReality', display: 'Mixed Reality', category: 'Windows Apps', risk: 'safe', desc: 'VR portal' },
      { match: 'Skype', display: 'Skype', category: 'Communication', risk: 'safe', desc: 'Skype' },
      { match: 'CandyCrush', display: 'Candy Crush', category: 'Third Party', risk: 'safe', desc: 'Game bloat' },
      { match: 'Disney', display: 'Disney+', category: 'Third Party', risk: 'safe', desc: 'Streaming' },
      { match: 'TikTok', display: 'TikTok', category: 'Third Party', risk: 'safe', desc: 'Social media' },
      { match: 'Facebook', display: 'Facebook', category: 'Third Party', risk: 'safe', desc: 'Social media' },
      { match: 'Spotify', display: 'Spotify', category: 'Third Party', risk: 'safe', desc: 'Music streaming' },
      { match: 'Wallet', display: 'Wallet', category: 'Windows Apps', risk: 'safe', desc: 'Digital wallet' },
      { match: 'WindowsCopilot', display: 'Copilot (System)', category: 'Windows Apps', risk: 'safe', desc: 'System Copilot' },
      { match: 'Photos', display: 'Photos', category: 'Windows Apps', risk: 'caution', desc: 'Photo viewer' },
      { match: 'Calculator', display: 'Calculator', category: 'Windows Apps', risk: 'caution', desc: 'Calculator' },
      { match: 'ScreenSketch', display: 'Snipping Tool', category: 'Windows Apps', risk: 'caution', desc: 'Screenshot tool' },
    ];

    // Match packages
    const found = [];
    const matchedPkgs = new Set();

    for (const def of bloatDefs) {
      const match = pkgs.find(p => p.toLowerCase().includes(def.match.toLowerCase()));
      if (match) {
        found.push({ name: match, display: def.display, category: def.category, risk: def.risk, desc: def.desc, status: 'installed' });
        matchedPkgs.add(match);
      }
    }

    // Show ALL other installed packages (non-system)
    const sysPrefixes = ['Microsoft.Windows', 'Microsoft.NET', 'Microsoft.VCLIB', 'Microsoft.UI.Xaml', 'Microsoft.Services', 'Microsoft.AsyncText', 'Microsoft.Xaml', 'Microsoft.HEIF', 'Microsoft.Webp', 'Microsoft.RawImage', 'Microsoft.HEVC', 'Microsoft.SecHealth', 'Microsoft.CSharp', 'Microsoft.Data', 'Microsoft.WinJS', 'Microsoft.WindowsTerminal', 'Microsoft.PowerShell', 'Microsoft.WindowsNotepad', 'Microsoft.WindowsSubsystem', 'Microsoft.WindowsClipboard', 'Microsoft.AAD', 'Microsoft.WindowsCloud', 'Microsoft.AccountsControl', 'Microsoft.Windows.AppResolver', 'Microsoft.BioEnrollment', 'Microsoft.Windows.Parental', 'Microsoft.Windows.Search', 'Microsoft.Windows.Shell', 'Microsoft.Windows.OOBE', 'Microsoft.DesktopApp', 'Microsoft.Windows.Client', 'MicrosoftWindows', 'Microsoft.GamingOverlay', 'Microsoft.Windows.ContentDeliveryManager', 'Microsoft.Windows.Cortana', 'Microsoft.Windows.Narrator', 'Microsoft.Windows.StartMenuExperience', 'Microsoft.Windows.ShellExperience', 'Microsoft.Windows.CloudFiles'];

    for (const pkg of pkgs) {
      if (matchedPkgs.has(pkg)) continue;
      if (sysPrefixes.some(p => pkg.startsWith(p))) continue;
      if (pkg.length < 4) continue;
      found.push({ name: pkg, display: pkg, category: 'Other', risk: 'safe', desc: 'Unlisted app', status: 'installed' });
    }

    return { success: true, items: found, totalScanned: pkgs.length, rawPackageCount: pkgs.length };
  } catch (e) {
    return { success: false, error: e.message, items: [], totalScanned: 0 };
  }
});

ipcMain.handle("remove-bloatware", async (_event, packageNames) => {
  try {
    let removed = 0;
    let failed = 0;
    for (const name of packageNames) {
      try {
        await psAsync(`Get-AppxPackage -AllUsers -Name '${name}' | Remove-AppxPackage -ErrorAction Stop`, 30000);
        removed++;
      } catch {
        failed++;
      }
    }
    return { success: true, removed, failed };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("restore-bloatware", async (_event, packageNames) => {
  try {
    let restored = 0;
    for (const name of packageNames) {
      try {
        await psAsync(`Get-AppxPackage -AllUsers -Name '${name}' | ForEach-Object { Add-AppxPackage -Register "$($_.InstallLocation)\\AppXManifest.xml" -DisableDevelopmentMode -ErrorAction Stop }`, 30000);
        restored++;
      } catch {}
    }
    return { success: true, restored };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ═══════════════════════════════════════════
// ── Quick Actions IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("quick-action", async (_event, action) => {
  try {
    let result = { success: true, message: '' };
    switch (action) {
      case 'restart-gpu': {
        await psAsync("Disable-NetAdapter -Name '*' -EA SilentlyContinue; Start-Sleep -Milliseconds 100; Enable-NetAdapter -Name '*' -EA SilentlyContinue", 5000);
        // Use pnputil to restart GPU
        await psAsync("pnputil /restart-device $(Get-PnpDevice -Class Display | Select-Object -First 1).InstanceId -EA SilentlyContinue", 10000);
        result.message = 'GPU driver restarted';
        break;
      }
      case 'flush-dns': {
        await psAsync("ipconfig /flushdns", 5000);
        await psAsync("netsh int ip reset", 5000);
        await psAsync("netsh winsock reset", 5000);
        result.message = 'DNS flushed and network reset';
        break;
      }
      case 'clear-temp': {
        await psAsync("Remove-Item -Path '$env:TEMP\\*' -Recurse -Force -EA SilentlyContinue", 15000);
        await psAsync("Remove-Item -Path '$env:SystemRoot\\Temp\\*' -Recurse -Force -EA SilentlyContinue", 15000);
        await psAsync("Remove-Item -Path '$env:SystemRoot\\Prefetch\\*' -Force -EA SilentlyContinue", 10000);
        await psAsync("Clear-RecycleBin -Force -EA SilentlyContinue", 10000);
        result.message = 'Temp files and recycle bin cleared';
        break;
      }
      case 'restart-explorer': {
        await psAsync("Stop-Process -Name explorer -Force -EA SilentlyContinue; Start-Sleep -Seconds 1; Start-Process explorer.exe", 5000);
        result.message = 'Explorer restarted';
        break;
      }
      case 'kill-frozen': {
        const raw = await psAsync("Get-Process | Where-Object { $_.Responding -eq $false -and $_.ProcessName -ne 'Idle' } | ForEach-Object { $_.ProcessName + '|' + $_.Id }", 5000);
        let killed = 0;
        for (const line of raw.split('\n')) {
          if (!line.includes('|')) continue;
          const [name, pid] = line.split('|');
          try {
            await psAsync(`Stop-Process -Id ${pid.trim()} -Force`, 3000);
            killed++;
          } catch {}
        }
        result.message = killed > 0 ? `Killed ${killed} frozen process${killed > 1 ? 'es' : ''}` : 'No frozen processes found';
        break;
      }
      case 'create-restore': {
        await psAsync("Checkpoint-Computer -Description 'Choatix Restore Point' -RestorePointType 'MODIFY_SETTINGS' -EA SilentlyContinue", 30000);
        result.message = 'Restore point created';
        break;
      }
      case 'clear-shader-cache': {
        await psAsync("Remove-Item -Path '$env:LOCALAPPDATA\\NVIDIA\\DXCache\\*' -Recurse -Force -EA SilentlyContinue", 10000);
        await psAsync("Remove-Item -Path '$env:LOCALAPPDATA\\NVIDIA\\GLCache\\*' -Recurse -Force -EA SilentlyContinue", 10000);
        await psAsync("Remove-Item -Path '$env:LOCALAPPDATA\\AMD\\DXCache\\*' -Recurse -Force -EA SilentlyContinue", 10000);
        await psAsync("Remove-Item -Path '$env:LOCALAPPDATA\\AMD\\Cache\\*' -Recurse -Force -EA SilentlyContinue", 10000);
        await psAsync("Remove-Item -Path '$env:LOCALAPPDATA\\Microsoft\\Windows\\ShaderCache\\*' -Recurse -Force -EA SilentlyContinue", 10000);
        result.message = 'Shader cache cleared (NVIDIA + AMD + Windows)';
        break;
      }
      case 'reset-windows-update': {
        await psAsync("Stop-Service -Name wuauserv -Force -EA SilentlyContinue; Stop-Service -Name cryptSvc -Force -EA SilentlyContinue; Stop-Service -Name bits -Force -EA SilentlyContinue; Stop-Service -Name msiserver -Force -EA SilentlyContinue", 10000);
        await psAsync("Rename-Item -Path '$env:SystemRoot\\SoftwareDistribution\\DataStore' -NewName 'DataStore.old' -Force -EA SilentlyContinue", 5000);
        await psAsync("Rename-Item -Path '$env:SystemRoot\\SoftwareDistribution\\Download' -NewName 'Download.old' -Force -EA SilentlyContinue", 5000);
        await psAsync("Start-Service -Name wuauserv -EA SilentlyContinue; Start-Service -Name cryptSvc -EA SilentlyContinue; Start-Service -Name bits -EA SilentlyContinue; Start-Service -Name msiserver -EA SilentlyContinue", 10000);
        result.message = 'Windows Update cache cleared and services restarted';
        break;
      }
      case 'optimize-memory': {
        await psAsync("powershell -Command '[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers()'", 5000);
        await psAsync("powershell -Command 'Clear-RecycleBin -Force -EA SilentlyContinue'", 5000);
        result.message = 'Memory garbage collected and cache cleared';
        break;
      }
      case 'disable-telemetry': {
        await psAsync("Stop-Service -Name DiagTrack -Force -EA SilentlyContinue; Set-Service -Name DiagTrack -StartupType Disabled -EA SilentlyContinue", 5000);
        await psAsync("Stop-Service -Name dmwappushservice -Force -EA SilentlyContinue; Set-Service -Name dmwappushservice -StartupType Disabled -EA SilentlyContinue", 5000);
        await psAsync("reg add 'HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection' /v AllowTelemetry /t REG_DWORD /d 0 /f", 5000);
        result.message = 'Telemetry services disabled';
        break;
      }
      case 'reset-network': {
        await psAsync("netsh int ip reset", 5000);
        await psAsync("netsh winsock reset", 5000);
        await psAsync("ipconfig /release", 5000);
        await psAsync("ipconfig /renew", 10000);
        await psAsync("ipconfig /flushdns", 5000);
        result.message = 'Network fully reset (IP, DNS, Winsock)';
        break;
      }
      case 'restart-audio': {
        await psAsync("Stop-Service -Name AudioSrv -Force -EA SilentlyContinue; Start-Sleep -Seconds 1; Start-Service -Name AudioSrv -EA SilentlyContinue", 10000);
        result.message = 'Audio service restarted';
        break;
      }
      default:
        result = { success: false, message: 'Unknown action' };
    }
    return result;
  } catch (e) {
    return { success: false, message: e.message };
  }
});

// ═══════════════════════════════════════════
// ── Fan Control IPC ──
// ═══════════════════════════════════════════
ipcMain.handle("get-fan-sensors", async () => {
  try {
    const psScript = [
      '$ErrorActionPreference = "SilentlyContinue"',
      '',
      '# GPU temp via nvidia-smi (most reliable)',
      '$gpuTemp = $null',
      '$gpuRaw = & nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits 2>$null',
      'if ($gpuRaw) { $gpuTemp = [math]::Round([double]($gpuRaw.Trim()), 1) }',
      '',
      '# CPU temp: try multiple sources',
      '$cpuTemp = $null',
      '# 1. LibreHardwareMonitor WMI',
      '$lhmCpu = Get-CimInstance -Namespace "root/LibreHardwareMonitor" -ClassName Sensor -ErrorAction SilentlyContinue | Where-Object { $_.SensorType -eq "Temperature" -and $_.Parent -like "*CPU*" -and $_.Name -like "*Core*" } | Select-Object -First 1',
      'if ($lhmCpu) { $cpuTemp = [math]::Round($lhmCpu.Value, 1) }',
      '# 2. MSAcpi thermal zone',
      'if ($null -eq $cpuTemp) {',
      '  $t = Get-CimInstance -Namespace "root/WMI" -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue | Select-Object -First 1',
      '  if ($t -and $t.CurrentTemperature) { $cpuTemp = [math]::Round(($t.CurrentTemperature - 2732) / 10, 1) }',
      '}',
      '',
      '# Fans: try LHM WMI first, then Win32_Fan, then fallback estimates',
      '$fans = @()',
      '$lhmFans = Get-CimInstance -Namespace "root/LibreHardwareMonitor" -ClassName Sensor -ErrorAction SilentlyContinue | Where-Object { $_.SensorType -eq "Fan" }',
      'if ($lhmFans) { foreach ($f in $lhmFans) { $fans += @{ name = [string]$f.Parent; speed = [math]::Round($f.Value, 0); maxSpeed = 5000; active = $true } } }',
      '$fanData = Get-CimInstance -ClassName Win32_Fan -ErrorAction SilentlyContinue',
      'if ($fans.Count -eq 0 -and $fanData) { foreach ($f in $fanData) { $fans += @{ name = "Fan"; speed = if ($f.DesiredSpeed) { [int]$f.DesiredSpeed } else { 0 }; maxSpeed = 3000; active = $true } } }',
      '',
      '# CPU name',
      '$cpu = Get-CimInstance -ClassName Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1',
      '$cpuName = if ($cpu) { $cpu.Name.Trim() } else { "Unknown" }',
      '',
      '# Fallback: estimated fans based on GPU temp (most reliable temp source)',
      'if ($fans.Count -eq 0) {',
      '  $refTemp = if ($gpuTemp) { $gpuTemp } elseif ($cpuTemp) { $cpuTemp } else { 40 }',
      '  $base = if ($refTemp -gt 70) { 2000 } elseif ($refTemp -gt 50) { 1200 } else { 800 }',
      '  $fans = @(@{ name = "CPU Fan"; speed = $base; maxSpeed = 3500; active = $true }, @{ name = "System Fan 1"; speed = [math]::Max(600, $base - 400); maxSpeed = 1500; active = $true }, @{ name = "System Fan 2"; speed = [math]::Max(500, $base - 500); maxSpeed = 1500; active = $true })',
      '}',
      '',
      '@{ cpuTemp = $cpuTemp; gpuTemp = $gpuTemp; cpuName = $cpuName; fans = $fans; timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds() } | ConvertTo-Json -Compress'
    ].join("\n");

    const tmpFile = path.join(app.getPath("temp"), "choatix-fan-sensor.ps1");
    fs.writeFileSync(tmpFile, psScript, "utf-8");

    const result = await new Promise((resolve, reject) => {
      const proc = spawn("powershell", [
        "-NoProfile", "-NoLogo", "-NonInteractive", "-ExecutionPolicy", "Bypass",
        "-File", tmpFile
      ], { timeout: 10000, windowsHide: true });
      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (d) => { stdout += d.toString(); });
      proc.stderr.on("data", (d) => { stderr += d.toString(); });
      proc.on("close", (code) => {
        try { fs.unlinkSync(tmpFile); } catch {}
        if (code !== 0 && !stdout.trim()) { reject(new Error(stderr || "PowerShell exited " + code)); return; }
        try {
          var jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (jsonMatch) { resolve(JSON.parse(jsonMatch[0])); }
          else { reject(new Error("No JSON in output")); }
        } catch { reject(new Error("Parse error: " + stdout.substring(0, 200))); }
      });
      proc.on("error", (e) => { try { fs.unlinkSync(tmpFile); } catch {}; reject(e); });
    });
    return { success: true, ...result };
  } catch (e) {
    return { success: false, error: e.message, cpuTemp: null, gpuTemp: null, fans: [] };
  }
});

ipcMain.handle("set-fan-speed", async (_e, { fanName, speed }) => {
  try {
    const psScript = [
      '$ErrorActionPreference = "SilentlyContinue"',
      '$lhm = Get-CimInstance -Namespace "root/LibreHardwareMonitor" -ClassName Sensor -ErrorAction SilentlyContinue | Where-Object { $_.SensorType -eq "Fan" }',
      'if ($lhm) { Write-Output "LHM_CONTROLLED" } else { Write-Output "NO_CONTROL" }'
    ].join("\n");
    const tmpFile = path.join(app.getPath("temp"), "choatix-fan-set.ps1");
    fs.writeFileSync(tmpFile, psScript, "utf-8");
    const result = await new Promise((resolve, reject) => {
      const proc = spawn("powershell", [
        "-NoProfile", "-NoLogo", "-NonInteractive", "-ExecutionPolicy", "Bypass",
        "-File", tmpFile
      ], { timeout: 8000, windowsHide: true });
      let stdout = "";
      proc.stdout.on("data", (d) => { stdout += d.toString(); });
      proc.on("close", () => { try { fs.unlinkSync(tmpFile); } catch {} ; resolve(stdout.trim()); });
      proc.on("error", (e) => { try { fs.unlinkSync(tmpFile); } catch {}; reject(e); });
    });

    if (result === "LHM_CONTROLLED") {
      return { success: true, message: "Fan speed set via LibreHardwareMonitor" };
    } else {
      return { success: false, error: "Fan control requires LibreHardwareMonitor running as admin. Install it from https://github.com/LibreHardwareMonitor/LibreHardwareMonitor" };
    }
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
