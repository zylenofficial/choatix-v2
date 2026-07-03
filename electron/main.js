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

ipcMain.handle("start-autopilot", async (_event, games) => {
  return { success: true, message: "Use detect-games + apply-game-tweaks instead" };
});

ipcMain.handle("stop-autopilot", async () => {
  return { success: true };
});

ipcMain.handle("get-autopilot-status", async () => {
  return { active: false, currentGame: null, games: [] };
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
  'gpu-disable-ulps': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v EnableUlps /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'gpu-set-power-limit-max': "powershell -NoProfile -Command 'nvidia-smi -pl 400 -ErrorAction SilentlyContinue'",
  'gpu-disable-power-gating': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v DisableDynamicPstate /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'gpu-enable-hw-scheduler': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v HwSchMode /t REG_DWORD /d 2 /f'",
  'gpu-optimize-shader-cache': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v ShaderCacheEnabled /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'gpu-disable-preemption': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v RMDisablePreemption /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'gpu-optimize-render-schedule': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v EnableMidGfxPreemptionVGPU /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
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
  'net-optimize-rss': "powershell -NoProfile -Command 'netsh int tcp set global rss=enabled'",
  'net-disable-ecnc': "powershell -NoProfile -Command 'netsh int tcp set global ecncapability=disabled'",
  'net-disable-task-offload': "powershell -NoProfile -Command 'netsh int ip set global taskoffload=disabled'",
  'net-optimize-tcp-window': "powershell -NoProfile -Command 'netsh int tcp set global autotuninglevel=normal'",
  'net-disable-netbios': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\NetBT\\Parameters\\Interfaces\\Tcpip_*\" /v NetbiosOptions /t REG_DWORD /d 2 /f -ErrorAction SilentlyContinue'",
  'net-disable-llmnr': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\DNSClient\" /v EnableMulticast /t REG_DWORD /d 0 /f'",
  'net-disable-wsd': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\NetCache\" /v Enabled /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'net-optimize-adapter': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v DefaultTTL /t REG_DWORD /d 64 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v Tcp1323Opts /t REG_DWORD /d 3 /f'",
  'net-disable-flow-control': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v EnableDca /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",

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

  // ── DEEP DEBLOAT ── (restore)
  'debloat-remove-edge': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Edge\" /v AllowMicrosoftEdgeUpdate /f -ErrorAction SilentlyContinue'",
  'debloat-remove-teams': "powershell -NoProfile -Command 'Set-Service -Name TeamsMachineInstaller -StartupType Automatic -ErrorAction SilentlyContinue'",
  'debloat-disable-copilot': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ShowCopilotButton /t REG_DWORD /d 1 /f; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Copilot\" /v TurnOffWindowsCopilot /f -ErrorAction SilentlyContinue'",
  'debloat-remove-widgets-deep': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Feeds\" /v ShellFeedsEnabled /t REG_DWORD /d 1 /f; reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Feeds\" /v EnableFeeds /f -ErrorAction SilentlyContinue'",

  // ── WINDOWS UPDATE ── (restore)
  'sys-pause-updates': "powershell -NoProfile -Command 'Remove-ItemProperty -Path \"HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU\" -Name AUOptions -Force -ErrorAction SilentlyContinue; Remove-ItemProperty -Path \"HKLM:\\SOFTWARE\\Microsoft\\Windows\\WindowsUpdate\\UX\\Settings\" -Name FlightSettingsMaxPauseDays -Force -ErrorAction SilentlyContinue'",
  'sys-block-update-restart': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\\AU\" /v NoAutoRebootWithLoggedOnUsers /f -ErrorAction SilentlyContinue'",
  'sys-defer-feature-updates': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\WindowsUpdate\" /v DeferFeatureUpdatesPeriodInDays /f -ErrorAction SilentlyContinue'",

  // ── TELEMETRY FIREWALL ── (restore)
  'net-block-telemetry-firewall': "powershell -NoProfile -Command 'Remove-NetFirewallRule -DisplayName \"Block MS Telemetry\" -ErrorAction SilentlyContinue'",
  'net-block-edge-firewall': "powershell -NoProfile -Command 'Remove-NetFirewallRule -DisplayName \"Block Edge Telemetry\" -ErrorAction SilentlyContinue'",

  // ── CPU POWER ── (restore)
  'cpu-disable-idle-states': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Processor\" /v DisableIdleState /f -ErrorAction SilentlyContinue; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Power\" /v CsEnabled /t REG_DWORD /d 1 /f'",
  'cpu-max-performance-bios': 'echo "BIOS settings must be reverted manually in BIOS setup"',

  // ── GPU POWER ── (restore)
  'gpu-disable-ulps': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v EnableUlps /f -ErrorAction SilentlyContinue; reg delete \"HKLM\\SOFTWARE\\AMD\\DPP\" /v DisableULPS /f -ErrorAction SilentlyContinue'",
  'gpu-set-power-limit-max': "powershell -NoProfile -Command 'reg delete \"HKLM\\SOFTWARE\\NVIDIA Corporation\\Global\\NVTweak\" /v PowerMizerEnable /f -ErrorAction SilentlyContinue'",

  // ── PROCESS PRIORITY ── (restore)
  'sys-realtime-priority-games': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Priority /t REG_DWORD /d 2 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v \"GPU Priority\" /t REG_DWORD /d 8 /f'",
  'sys-foreground-boost': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v Win32PrioritySeparation /t REG_DWORD /d 2 /f'",

  // ── GAME CONFIG ── (restore)
  'game-fortnite-ini-optimize': "powershell -NoProfile -Command 'attrib -r \"$env:LOCALAPPDATA\\FortniteGame\\Saved\\Config\\WindowsClient\\GameUserSettings.ini\" -ErrorAction SilentlyContinue'",
  'game-valorant-cfg-optimize': "powershell -NoProfile -Command 'echo \"Valorant config: reset to default in-game settings\"'",
  'game-cs2-cfg-optimize': "powershell -NoProfile -Command 'echo \"CS2 config: delete autoexec.cfg to reset to defaults\"'",
  'game-apex-cfg-optimize': "powershell -NoProfile -Command 'echo \"Apex config: delete autoexec.cfg to reset to defaults\"'",
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
  'gpu-disable-power-gating': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v DisableDynamicPstate /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'gpu-enable-hw-scheduler': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v HwSchMode /t REG_DWORD /d 1 /f'",
  'gpu-optimize-shader-cache': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v ShaderCacheEnabled /f -ErrorAction SilentlyContinue'",
  'gpu-disable-preemption': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v RMDisablePreemption /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'",
  'gpu-optimize-render-schedule': "powershell -NoProfile -Command 'reg delete \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v EnableMidGfxPreemptionVGPU /f -ErrorAction SilentlyContinue'",
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
  'net-optimize-tcp-window': "powershell -NoProfile -Command 'netsh int tcp set global autotuninglevel=normal'",
  'net-disable-netbios': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\NetBT\\Parameters\\Interfaces\\Tcpip_*\" /v NetbiosOptions /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'net-disable-llmnr': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\DNSClient\" /v EnableMulticast /t REG_DWORD /d 1 /f'",
  'net-disable-wsd': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\NetCache\" /v Enabled /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
  'net-optimize-adapter': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v DefaultTTL /t REG_DWORD /d 128 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v Tcp1323Opts /t REG_DWORD /d 1 /f'",
  'net-disable-flow-control': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\" /v EnableDca /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue'",
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
    var colorMap = { bug: 0xED4245, feature: 0x5865F2, general: 0x57F287 };
    var emojiMap = { bug: "\ud83d\udc1b", feature: "\ud83d\udca1", general: "\ud83d\udcac" };
    var labelMap = { bug: "Bug Report", feature: "Feature Request", general: "General Feedback" };

    var cpuInfo = os.cpus();
    var totalMemGB = (os.totalmem() / 1073741824).toFixed(1);
    var memUsedGB = ((os.totalmem() - os.freemem()) / 1073741824).toFixed(1);
    var memPct = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
    var cpuModel = (cpuInfo[0]?.model || "Unknown").replace(/\s+/g, " ").trim();

    var description = "";
    if (feedback.rating) {
      var stars = "\u2b50".repeat(feedback.rating) + "\u2606".repeat(5 - feedback.rating);
      description += stars + "\n\n";
    }
    description += feedback.message.substring(0, 2000);

    var fields = [
      { name: "Type", value: (emojiMap[feedback.type] || "") + " " + (labelMap[feedback.type] || "Feedback"), inline: true },
      { name: "Version", value: "v" + CURRENT_VERSION, inline: true },
    ];

    if (feedback.discordId) {
      fields.push({ name: "User", value: "<@" + feedback.discordId + ">", inline: true });
    }

    fields.push(
      { name: "\u200b", value: "\u200b", inline: false },
      { name: "System", value:
        "**OS** " + os.platform() + " " + os.release() + "\n" +
        "**CPU** " + cpuModel.substring(0, 40) + "\n" +
        "**RAM** " + memUsedGB + " / " + totalMemGB + " GB (" + memPct + "%)\n" +
        "**Cores** " + cpuInfo.length, inline: false }
    );

    var payload = JSON.stringify({
      username: "Choatix",
      avatar_url: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
      embeds: [{
        color: colorMap[feedback.type] || 0x57F287,
        title: feedback.subject,
        description: description,
        fields: fields,
        timestamp: new Date().toISOString(),
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
