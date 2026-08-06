const { exec, spawn } = require('child_process');

const tweaks = {
  // Game profile tweaks - Fortnite pro tier
  'sys-enable-game-mode': 'reg add "HKCU\\Software\\Microsoft\\GameBar" /v AutoGameModeEnabled /t REG_DWORD /d 1 /f',
  'sys-disable-fullscreen-opt': 'reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer" /v DisableFullscreenOptimization /t REG_DWORD /d 1 /f',
  'sys-disable-gamebar': "powershell -NoProfile -Command 'Set-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" -Name \"AppCaptureEnabled\" -Value 0 -Force; Set-ItemProperty -Path \"HKCU:\\System\\GameConfigStore\" -Name \"GameDVR_Enabled\" -Value 0 -Force'",
  'sys-reduce-background': "powershell -NoProfile -Command 'Get-Service -Name DiagTrack -ErrorAction SilentlyContinue | Stop-Service -Force -ErrorAction SilentlyContinue'",
  'sys-disable-vbs': "powershell -NoProfile -Command 'bcdedit /set hypervisorlaunchtype off 2>&1 | Out-Null; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\" /v EnableVirtualizationBasedSecurity /t REG_DWORD /d 0 /f'",
  'nv-hardware-scheduling': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v HwSchMode /t REG_DWORD /d 2 /f',
  'nv-texture-filtering': 'reg add "HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak" /v TextureFilteringQuality /t REG_DWORD /d 1 /f',
  'mouse-disable-acceleration': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSpeed /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold1 /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold2 /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseTrails /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSensitivity /t REG_SZ /d \"10\" /f'",
  'net-optimize-dns': "powershell -NoProfile -Command '$adapter = Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | Select-Object -First 1; if($adapter){ $name = $adapter.Name; netsh int ip set dnsservers \"$name\" static 1.1.1.1 primary; netsh int ip set dnsservers \"$name\" static 1.0.0.1 secondary } else { netsh int ip set dnsservers \"Ethernet\" static 1.1.1.1 primary }'",
  'net-optimize-performance': 'powershell -NoProfile -Command "netsh int tcp set global ecncapability=disabled; netsh int tcp set global timestamps=disabled; netsh int tcp set global rss=enabled; netsh int tcp set global autotuninglevel=normal; netsh int tcp set global dca=enabled"',
  'game-disable-dvr': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" /v AppCaptureEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR\" /v AllowGameDVR /t REG_DWORD /d 0 /f'",
  'game-disable-game-bar-complete': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v AutoGameModeEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v AllowAutoGameMode /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\GameBar\" /v ShowStartupPanel /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR\" /v AppCaptureEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\System\\GameConfigStore\" /v GameDVR_Enabled /t REG_DWORD /d 0 /f'",
  'game-optimize-priority': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v SystemResponsiveness /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v \"GPU Priority\" /t REG_DWORD /d 8 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Priority /t REG_DWORD /d 6 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v \"Scheduling Category\" /t REG_SZ /d High /f'",
  'game-optimize-fullscreen': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\" /v DisableFullscreenOptimization /t REG_DWORD /d 1 /f'",
  'net-disable-nagle': "powershell -NoProfile -Command 'Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { $adapter = $_.InterfaceDescription; New-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TcpAckFrequency -Value 1 -PropertyType DWord -Force -ErrorAction SilentlyContinue; New-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TCPNoDelay -Value 1 -PropertyType DWord -Force -ErrorAction SilentlyContinue; New-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$($_.InterfaceGuid)\" -Name TcpDelAckTicks -Value 0 -PropertyType DWord -Force -ErrorAction SilentlyContinue }'",
  'input-gaming-mode': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardDelay /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Keyboard\" /v KeyboardSpeed /t REG_SZ /d \"31\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSpeed /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold1 /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseThreshold2 /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseTrails /t REG_SZ /d \"0\" /f; reg add \"HKCU\\Control Panel\\Mouse\" /v MouseSensitivity /t REG_SZ /d \"10\" /f; reg add \"HKCU\\Accessibility\\StickyKeys\" /v Flags /t REG_SZ /d \"506\" /f; reg add \"HKCU\\Accessibility\\ToggleKeys\" /v Flags /t REG_SZ /d \"58\" /f; reg add \"HKCU\\Accessibility\\Keyboard Response\" /v Flags /t REG_SZ /d \"122\" /f'",
  'snd-exclusive-mode': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\MmcSnapins\\FxTools\\AudioPolicyManager\" /v EnableExclusiveMode /t REG_DWORD /d 1 /f'",
  'snd-reduce-buffer': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v MaxBufferCount /t REG_DWORD /d 2 /f'",
  'bcd-optimize-boot': "powershell -NoProfile -Command 'bcdedit /set bootmenupolicy standard 2>&1 | Out-Null'",
  'nv-max-frames-ahead': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\NVIDIA Corporation\\Global\\NVTweak\" /v PreRenderLimit /t REG_DWORD /d 1 /f'",
  'nv-shader-cache-size': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\NVIDIA Corporation\\Global\\NVTweak\" /v ShaderCacheSizeMB /t REG_DWORD /d 1024 /f'",
  'nv-rm-gpu-accl': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v HwSchMode /t REG_DWORD /d 2 /f'",
  'lat-hpet-enable': "powershell -NoProfile -Command 'bcdedit /set useplatformclock true 2>&1 | Out-Null'",
  'lat-optimize-interrupts': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v InterruptSteeringDisabled /t REG_DWORD /d 0 /f'",
  'appdb-discord-optimize': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Discord\\CEFI\" /v OverlayEnabled /t REG_DWORD /d 0 /f; reg add \"HKCU\\Software\\Discord\\CEFI\" /v NoiseSuppression /t REG_SZ /d none /f'",
  'appdb-chrome-priority': "powershell -NoProfile -Command 'Get-Process chrome -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal }'",
  'dx-shader-cache-enable': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences\" /v ShaderCacheEnabled /t REG_DWORD /d 1 /f'",
  // Premium tier
  'sys-disable-mitigations': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v FeatureSettingsOverride /t REG_DWORD /d 3 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v FeatureSettingsOverrideMask /t REG_DWORD /d 3 /f'",
  'sys-optimize-fps': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management\" /v LargeSystemCache /t REG_DWORD /d 0 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f'",
  'sys-realtime-priority-games': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v Priority /t REG_DWORD /d 31 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games\" /v \"GPU Priority\" /t REG_DWORD /d 31 /f'",
  'sys-foreground-boost': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl\" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f'",
  'gpu-disable-ulps': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v EnableUlps /t REG_DWORD /d 0 /f; reg add \"HKLM\\SOFTWARE\\AMD\\DPP\" /v DisableULPS /t REG_DWORD /d 1 /f'",
  'snd-mmcss-audio': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\" /v \"NoLazyMode\" /t REG_DWORD /d 1 /f; reg add \"HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Audio\" /v \"SFNO\" /t REG_SZ /d \"{3B0470-3-4D3D-4444-9C00-000000000000}\" /f'",
  'snd-optimize-audio-thread': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Services\\Audiosrv\" /v DependOnService /t REG_MULTI_SZ /d \"\\0\\0\" /f'",
  'bcd-timer-resolution': "powershell -NoProfile -Command 'bcdedit /set useplatformclock true 2>&1 | Out-Null'",
  'bcd-disable-dynamic-tick': "powershell -NoProfile -Command 'bcdedit /set disabledynamictick yes 2>&1 | Out-Null'",
  'bcd-use-platform-clock': "powershell -NoProfile -Command 'bcdedit /set useplatformtick yes 2>&1 | Out-Null'",
  'nv-disable-gpu-preemption': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers\" /v DisablePreemption /t REG_DWORD /d 1 /f'",
  'nv-max-power-management': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PowerMizerEnable /t REG_DWORD /d 1 /f; reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v PowerMizerLevel /t REG_DWORD /d 1 /f'",
  'lat-timer-resolution': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\kernel\" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f'",
  'lat-optimize-dpc': "powershell -NoProfile -Command 'reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\0000\" /v DPCPriority /t REG_DWORD /d 31 /f'",
  'dx-enable-variable-shading': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Microsoft\\DirectX\" /v VariableShadingRate /t REG_DWORD /d 0 /f'",
  'dx-optimize-present-params': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences\" /v LowLatencyPresent /t REG_DWORD /d 1 /f'",
  // More pro tier
  'sys-disable-animations': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v UserPreferencesMask /t REG_BINARY /d 9012038010000000 /f; reg add \"HKCU\\Control Panel\\Desktop\\WindowMetrics\" /v MinAnimate /t REG_SZ /d 0 /f; reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v ListviewShadow /t REG_DWORD /d 0 /f'",
  'snd-disable-spatial': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Audio\" /v DisableSpatialSound /t REG_DWORD /d 1 /f'",
  'atd-disable-fade': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v UserPreferencesMask /t REG_BINARY /d 9012038010000000 /f'",
  'atd-disable-switch-delay': "powershell -NoProfile -Command 'reg add \"HKCU\\Control Panel\\Desktop\" /v MenuShowDelay /t REG_SZ /d 0 /f'",
  'atd-disable-thumbnail': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\Dwm\" /v EnableAeroPeek /t REG_DWORD /d 0 /f'",
  'atd-force-classic': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v AltTabSettings /t REG_DWORD /d 1 /f'",
  'appdb-discord-disable-hw': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Discord\\CEFI\" /v HardwareAcceleration /t REG_DWORD /d 0 /f'",
  'appdb-steam-disable-hw': "reg add \"HKCU\\Software\\Valve\\Steam\" /v DisableHWAcceleration /t REG_DWORD /d 1 /f",
  'appdb-epic-disable-hw': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Epic Games\\EpicGamesLauncher\" /v HardwareAcceleration /t REG_DWORD /d 0 /f'",
  'appdb-chrome-disable-hw': "powershell -NoProfile -Command 'reg add \"HKLM\\SOFTWARE\\Policies\\Google\\Chrome\" /v HardwareAccelerationModeEnabled /t REG_DWORD /d 0 /f'",
  'explorer-classic-menu': "reg add \"HKCU\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32\" /ve /t REG_SZ /d \"\" /f",
  'explorer-disable-quick-access': "reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v LaunchTo /t REG_DWORD /d 1 /f",
  'atd-optimize-dwm': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\Dwm\" /v AlwaysHibernateThumbnails /t REG_DWORD /d 0 /f'",
  'atd-prioritize-game': "powershell -NoProfile -Command 'reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\" /v RestartApps /t REG_DWORD /d 0 /f'",
  'bcd-optimize-boot2': "powershell -NoProfile -Command 'bcdedit /set bootmenupolicy standard 2>&1 | Out-Null'",
  'sys-cpu-priority': 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f',
};

function runTweakCommand(cmd, timeout = 15000) {
  return new Promise((resolve) => {
    const handleResult = (stdout, stderr) => {
      const errMsg = stderr?.trim() || '';
      const outMsg = stdout?.trim() || '';
      const combined = (errMsg + ' ' + outMsg).toLowerCase();
      const isRealError = combined.length > 0 && (
        combined.includes('error') ||
        combined.includes('access denied') ||
        combined.includes('permission') ||
        combined.includes('not found') ||
        combined.includes('not recognized') ||
        combined.includes('does not exist') ||
        combined.includes('cannot find') ||
        combined.includes('failed') ||
        combined.includes('invalid') ||
        combined.includes('unable')
      );
      if (isRealError) {
        resolve({ success: false, error: errMsg || outMsg });
      } else {
        resolve({ success: true });
      }
    };

    const trimmed = cmd.trim();
    const isPowerShell = trimmed.toLowerCase().startsWith('powershell');

    if (isPowerShell) {
      const cmdMatch = trimmed.match(/-Command\s+(['"])([\s\S]*)\1\s*$/);
      if (cmdMatch) {
        const script = cmdMatch[2];
        try {
          const child = spawn('powershell.exe', ['-NoProfile', '-Command', script], {
            timeout,
            windowsHide: true,
            shell: false,
            stdio: ['pipe', 'pipe', 'pipe']
          });
          let stdout = '';
          let stderr = '';
          child.stdout.on('data', (d) => { stdout += d; });
          child.stderr.on('data', (d) => { stderr += d; });
          child.on('close', () => handleResult(stdout, stderr));
          child.on('error', (e) => {
            if (e.killed) resolve({ success: false, error: 'Command timed out' });
            else resolve({ success: false, error: e.message });
          });
          return;
        } catch (_) {}
      }
    }

    const child = exec(cmd, { timeout, windowsHide: true }, (error, stdout, stderr) => {
      handleResult(stdout, stderr);
    });
    child.on('error', (e) => {
      if (e.killed) resolve({ success: false, error: 'Command timed out' });
      else resolve({ success: false, error: e.message });
    });
  });
}

async function main() {
  const ids = Object.keys(tweaks);
  console.log(`Testing ${ids.length} tweaks...\n`);

  const results = [];
  for (const id of ids) {
    const r = await runTweakCommand(tweaks[id], 10000);
    results.push({ id, ...r });
    const icon = r.success ? 'OK' : 'FAIL';
    const color = r.success ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}[${icon}]\x1b[0m ${id}` + (r.error ? ` => ${r.error}` : ''));
  }

  const failed = results.filter(r => !r.success);
  const passed = results.filter(r => r.success);
  console.log(`\n${passed.length}/${results.length} passed`);
  if (failed.length > 0) {
    console.log(`\nFAILED TWEAKS:`);
    failed.forEach(f => console.log(`  - ${f.id}: ${f.error}`));
  } else {
    console.log('\nALL PASSED!');
  }
}

main();
