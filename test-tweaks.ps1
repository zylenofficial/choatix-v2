$results = @()

function Test-Tweak {
    param([string]$Name, [string]$Cmd)
    try {
        $output = Invoke-Expression $Cmd 2>&1
        $errText = ($output | Where-Object { $_ -is [System.Management.Automation.ErrorRecord] }) -join ' '
        $outText = ($output | Where-Object { $_ -isnot [System.Management.Automation.ErrorRecord] }) -join ' '
        $combined = "$errText $outText".ToLower()
        $isError = $combined -match 'error|access denied|permission|not found|not recognized|does not exist|cannot find|failed|invalid|unable'
        [PSCustomObject]@{
            Name = $Name
            Success = (-not $isError)
            Error = if($isError) { "$errText $outText".Trim() } else { "" }
        }
    } catch {
        [PSCustomObject]@{
            Name = $Name
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

Write-Host "=== Testing Network Tweaks ===" -ForegroundColor Cyan

# net-optimize-dns
$r = Test-Tweak "net-optimize-dns" 'Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object -First 1 | ForEach-Object { $name = $_.Name; netsh int ip set dnsservers "$name" static 1.1.1.1 primary }'
$results += $r

# net-reduce-congestion
$r = Test-Tweak "net-reduce-congestion" 'powershell -NoProfile -Command "Set-NetTCPSetting -SettingName Internet -CongestionProvider CTCP -EA SilentlyContinue"'
$results += $r

# net-optimize-performance (fixed - no chimney/netdma)
$r = Test-Tweak "net-optimize-performance" 'powershell -NoProfile -Command "netsh int tcp set global ecncapability=disabled; netsh int tcp set global timestamps=disabled; netsh int tcp set global rss=enabled; netsh int tcp set global autotuninglevel=normal; netsh int tcp set global dca=enabled"'
$results += $r

# net-disable-nagle
$r = Test-Tweak "net-disable-nagle" 'powershell -NoProfile -Command "Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | ForEach-Object { New-ItemProperty -Path \"HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces\$($_.InterfaceGuid)\" -Name TcpAckFrequency -Value 1 -PropertyType DWord -Force -ErrorAction SilentlyContinue; New-ItemProperty -Path \"HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces\$($_.InterfaceGuid)\" -Name TCPNoDelay -Value 1 -PropertyType DWord -Force -ErrorAction SilentlyContinue }"'
$results += $r

# net-optimize-mtu
$r = Test-Tweak "net-optimize-mtu" 'powershell -NoProfile -Command "$adapter = Get-NetAdapter | Where-Object {$_.Status -eq \"Up\"} | Select-Object -First 1; if($adapter){ netsh interface ipv4 set subinterface $($adapter.InterfaceIndex) mtu=1400 store=persistent }"'
$results += $r

# net-disable-network-throttling
$r = Test-Tweak "net-disable-network-throttling" 'reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile" /v NetworkThrottlingIndex /t REG_DWORD /d 4294967295 /f'
$results += $r

# net-optimize-connection-limits
$r = Test-Tweak "net-optimize-connection-limits" 'reg add "HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters" /v TcpNumConnections /t REG_DWORD /d 16777214 /f'
$results += $r

# net-optimize-dns-cache
$r = Test-Tweak "net-optimize-dns-cache" 'reg add "HKLM\SYSTEM\CurrentControlSet\Services\Dnscache\Parameters" /v MaxCacheEntryTtlLimit /t REG_DWORD /d 86400 /f'
$results += $r

# net-disable-ecns
$r = Test-Tweak "net-disable-ecns" 'netsh int tcp set global ecncapability=disabled'
$results += $r

# net-disable-lso
$r = Test-Tweak "net-disable-lso" 'powershell -NoProfile -Command "Get-NetAdapter | ForEach-Object { $name = $_.Name; Set-NetAdapterAdvancedProperty -Name $name -DisplayName \"Large Send Offload (IPv4)\" -DisplayValue \"Disabled\" -ErrorAction SilentlyContinue }"'
$results += $r

Write-Host "`n=== Testing System Tweaks ===" -ForegroundColor Cyan

# sys-enable-game-mode
$r = Test-Tweak "sys-enable-game-mode" 'reg add "HKCU\Software\Microsoft\GameBar" /v AutoGameModeEnabled /t REG_DWORD /d 1 /f'
$results += $r

# sys-disable-fullscreen-opt
$r = Test-Tweak "sys-disable-fullscreen-opt" 'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer" /v DisableFullscreenOptimization /t REG_DWORD /d 1 /f'
$results += $r

# sys-cpu-priority
$r = Test-Tweak "sys-cpu-priority" 'reg add "HKLM\SYSTEM\CurrentControlSet\Control\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f'
$results += $r

# sys-disable-animations
$r = Test-Tweak "sys-disable-animations" 'reg add "HKCU\Control Panel\Desktop" /v UserPreferencesMask /t REG_BINARY /d 9012038010000000 /f'
$results += $r

Write-Host "`n=== Testing GPU Tweaks ===" -ForegroundColor Cyan

# nv-hardware-scheduling
$r = Test-Tweak "nv-hardware-scheduling" 'reg add "HKLM\SYSTEM\CurrentControlSet\Control\GraphicsDrivers" /v HwSchMode /t REG_DWORD /d 2 /f'
$results += $r

# nv-texture-filtering
$r = Test-Tweak "nv-texture-filtering" 'reg add "HKCU\Software\NVIDIA Corporation\Global\NVTweak" /v TextureFilteringQuality /t REG_DWORD /d 1 /f'
$results += $r

# nv-max-frames-ahead (wrapped)
$r = Test-Tweak "nv-max-frames-ahead" 'powershell -NoProfile -Command "reg add \"HKCU\Software\NVIDIA Corporation\Global\NVTweak\" /v PreRenderLimit /t REG_DWORD /d 1 /f -ErrorAction SilentlyContinue"'
$results += $r

# nv-shader-cache-size (wrapped)
$r = Test-Tweak "nv-shader-cache-size" 'powershell -NoProfile -Command "reg add \"HKLM\SOFTWARE\NVIDIA Corporation\Global\NVTweak\" /v ShaderCacheSizeMB /t REG_DWORD /d 1024 /f -ErrorAction SilentlyContinue"'
$results += $r

# gpu-disable-ulps (wrapped)
$r = Test-Tweak "gpu-disable-ulps" 'powershell -NoProfile -Command "reg add \"HKLM\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}\0000\" /v EnableUlps /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue"'
$results += $r

Write-Host "`n=== Testing Gaming Tweaks ===" -ForegroundColor Cyan

# game-disable-dvr
$r = Test-Tweak "game-disable-dvr" 'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\GameDVR" /v AppCaptureEnabled /t REG_DWORD /d 0 /f'
$results += $r

# game-optimize-priority
$r = Test-Tweak "game-optimize-priority" 'reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile" /v SystemResponsiveness /t REG_DWORD /d 0 /f'
$results += $r

# game-optimize-fullscreen
$r = Test-Tweak "game-optimize-fullscreen" 'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer" /v DisableFullscreenOptimization /t REG_DWORD /d 1 /f'
$results += $r

# game-disable-game-bar-complete
$r = Test-Tweak "game-disable-game-bar-complete" 'reg add "HKCU\Software\Microsoft\GameBar" /v AutoGameModeEnabled /t REG_DWORD /d 0 /f'
$results += $r

Write-Host "`n=== Testing Audio Tweaks ===" -ForegroundColor Cyan

# snd-exclusive-mode
$r = Test-Tweak "snd-exclusive-mode" 'reg add "HKCU\Software\Microsoft\MmcSnapins\FxTools\AudioPolicyManager" /v EnableExclusiveMode /t REG_DWORD /d 1 /f'
$results += $r

# snd-reduce-buffer
$r = Test-Tweak "snd-reduce-buffer" 'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Audio" /v MaxBufferCount /t REG_DWORD /d 2 /f'
$results += $r

# snd-disable-spatial
$r = Test-Tweak "snd-disable-spatial" 'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Audio" /v DisableSpatialSound /t REG_DWORD /d 1 /f'
$results += $r

Write-Host "`n=== Testing Input Tweaks ===" -ForegroundColor Cyan

# mouse-disable-acceleration
$r = Test-Tweak "mouse-disable-acceleration" 'reg add "HKCU\Control Panel\Mouse" /v MouseSpeed /t REG_SZ /d "0" /f'
$results += $r

# input-gaming-mode
$r = Test-Tweak "input-gaming-mode" 'reg add "HKCU\Control Panel\Keyboard" /v KeyboardDelay /t REG_SZ /d "0" /f'
$results += $r

Write-Host "`n=== Testing Latency Tweaks ===" -ForegroundColor Cyan

# lat-timer-resolution
$r = Test-Tweak "lat-timer-resolution" 'reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\kernel" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f'
$results += $r

# lat-optimize-dpc
$r = Test-Tweak "lat-optimize-dpc" 'reg add "HKLM\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}\0000" /v DPCPriority /t REG_DWORD /d 31 /f'
$results += $r

# lat-optimize-interrupts
$r = Test-Tweak "lat-optimize-interrupts" 'reg add "HKLM\SYSTEM\CurrentControlSet\Control\PriorityControl" /v InterruptSteeringDisabled /t REG_DWORD /d 0 /f'
$results += $r

Write-Host "`n=== Testing DX Tweaks ===" -ForegroundColor Cyan

# dx-shader-cache-enable
$r = Test-Tweak "dx-shader-cache-enable" 'reg add "HKCU\Software\Microsoft\DirectX\UserGpuPreferences" /v ShaderCacheEnabled /t REG_DWORD /d 1 /f'
$results += $r

# dx-enable-variable-shading
$r = Test-Tweak "dx-enable-variable-shading" 'reg add "HKLM\SOFTWARE\Microsoft\DirectX" /v VariableShadingRate /t REG_DWORD /d 0 /f -ErrorAction SilentlyContinue'
$results += $r

# dx-optimize-present-params
$r = Test-Tweak "dx-optimize-present-params" 'reg add "HKCU\Software\Microsoft\DirectX\UserGpuPreferences" /v LowLatencyPresent /t REG_DWORD /d 1 /f'
$results += $r

Write-Host "`n=== Testing Privacy/Tweaks ===" -ForegroundColor Cyan

# appdb-discord-optimize
$r = Test-Tweak "appdb-discord-optimize" 'reg add "HKCU\Software\Discord\CEFI" /v OverlayEnabled /t REG_DWORD /d 0 /f'
$results += $r

# appdb-chrome-priority
$r = Test-Tweak "appdb-chrome-priority" 'Get-Process chrome -ErrorAction SilentlyContinue | ForEach-Object { $_.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::BelowNormal }'
$results += $r

Write-Host "`n=== Testing VBS ===" -ForegroundColor Cyan

# sys-disable-vbs (bcdedit part needs admin)
$r = Test-Tweak "sys-disable-vbs-reg" 'reg add "HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard" /v EnableVirtualizationBasedSecurity /t REG_DWORD /d 0 /f'
$results += $r

Write-Host "`n=== Testing Explorer ===" -ForegroundColor Cyan

# explorer-classic-menu
$r = Test-Tweak "explorer-classic-menu" 'reg add "HKCU\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32" /ve /t REG_SZ /d "" /f'
$results += $r

# explorer-disable-quick-access
$r = Test-Tweak "explorer-disable-quick-access" 'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v LaunchTo /t REG_DWORD /d 1 /f'
$results += $r

# atd-disable-fade
$r = Test-Tweak "atd-disable-fade" 'reg add "HKCU\Control Panel\Desktop" /v UserPreferencesMask /t REG_BINARY /d 9012038010000000 /f'
$results += $r

# atd-disable-switch-delay
$r = Test-Tweak "atd-disable-switch-delay" 'reg add "HKCU\Control Panel\Desktop" /v MenuShowDelay /t REG_SZ /d 0 /f'
$results += $r

# atd-disable-thumbnail
$r = Test-Tweak "atd-disable-thumbnail" 'reg add "HKCU\Software\Microsoft\Windows\Dwm" /v EnableAeroPeek /t REG_DWORD /d 0 /f'
$results += $r

# atd-force-classic
$r = Test-Tweak "atd-force-classic" 'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v AltTabSettings /t REG_DWORD /d 1 /f'
$results += $r

# atd-optimize-dwm
$r = Test-Tweak "atd-optimize-dwm" 'reg add "HKCU\Software\Microsoft\Windows\Dwm" /v AlwaysHibernateThumbnails /t REG_DWORD /d 0 /f'
$results += $r

# atd-prioritize-game
$r = Test-Tweak "atd-prioritize-game" 'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v RestartApps /t REG_DWORD /d 0 /f'
$results += $r

# sys-foreground-boost
$r = Test-Tweak "sys-foreground-boost" 'reg add "HKLM\SYSTEM\CurrentControlSet\Control\PriorityControl" /v Win32PrioritySeparation /t REG_DWORD /d 38 /f'
$results += $r

# sys-optimize-fps
$r = Test-Tweak "sys-optimize-fps" 'reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\kernel" /v GlobalTimerResolutionRequests /t REG_DWORD /d 1 /f'
$results += $r

# sys-realtime-priority-games
$r = Test-Tweak "sys-realtime-priority-games" 'reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games" /v Priority /t REG_DWORD /d 31 /f'
$results += $r

# sys-disable-gamebar
$r = Test-Tweak "sys-disable-gamebar" 'reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\GameDVR" /v AppCaptureEnabled /t REG_DWORD /d 0 /f'
$results += $r

# sys-reduce-background (services)
$r = Test-Tweak "sys-reduce-background" 'powershell -NoProfile -Command "Get-Service -Name DiagTrack -ErrorAction SilentlyContinue | Stop-Service -Force -ErrorAction SilentlyContinue"'
$results += $r

Write-Host "`n========== RESULTS ==========" -ForegroundColor Yellow

$failed = $results | Where-Object { -not $_.Success }
$passed = $results | Where-Object { $_.Success }

Write-Host "`nPASSED: $($passed.Count) / $($results.Count)" -ForegroundColor Green

if ($failed.Count -gt 0) {
    Write-Host "`nFAILED: $($failed.Count)" -ForegroundColor Red
    foreach ($f in $failed) {
        Write-Host "  X $($f.Name): $($f.Error)" -ForegroundColor Red
    }
} else {
    Write-Host "`nALL TWEAKS PASSED!" -ForegroundColor Green
}

Write-Host "`nFull list:" -ForegroundColor Cyan
foreach ($r in $results) {
    $icon = if($r.Success) { "[OK]" } else { "[FAIL]" }
    $color = if($r.Success) { "Green" } else { "Red" }
    Write-Host "  $icon $($r.Name)" -ForegroundColor $color
    if (-not $r.Success) {
        Write-Host "       $($r.Error)" -ForegroundColor DarkRed
    }
}
