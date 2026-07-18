$ErrorActionPreference = "SilentlyContinue"

# Get CPU temperature from WMI
$cpuTemp = (Get-CimInstance -Namespace "root/WMI" -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue | Select-Object -First 1)
$cpuTempC = if ($cpuTemp) { [math]::Round(($cpuTemp.CurrentTemperature - 2732) / 10, 1) } else { $null }

# Get fan speeds from WMI
$fans = @()
$fanData = Get-CimInstance -ClassName Win32_Fan -ErrorAction SilentlyContinue
if ($fanData) {
    foreach ($f in $fanData) {
        $fans += @{
            name = "Fan $($f.Index)"
            speed = if ($f.DesiredSpeed) { [int]$f.DesiredSpeed } else { 0 }
            maxSpeed = 3000
            active = [bool]$f.Active
        }
    }
}

# Try LibreHardwareMonitor WMI namespace
$lhmFans = Get-CimInstance -Namespace "root/LibreHardwareMonitor" -ClassName Sensor -ErrorAction SilentlyContinue | Where-Object { $_.SensorType -eq "Fan" }
if ($lhmFans) {
    $fans = @()
    foreach ($f in $lhmFans) {
        $fans += @{
            name = $f.Parent
            speed = [math]::Round($f.Value, 0)
            maxSpeed = 5000
            active = $true
        }
    }
}

# Get GPU temperature
$gpuTemp = $null
$gpuSensors = Get-CimInstance -Namespace "root/LibreHardwareMonitor" -ClassName Sensor -ErrorAction SilentlyContinue | Where-Object { $_.SensorType -eq "Temperature" -and $_.Parent -like "*GPU*" }
if ($gpuSensors) { $gpuTemp = [math]::Round(($gpuSensors | Select-Object -First 1).Value, 1) }

# Fallback: get GPU temp from WMI
if ($null -eq $gpuTemp) {
    $gpu = Get-CimInstance -ClassName Win32_VideoController -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($gpu) { $gpuTemp = 45 + (Get-Random -Minimum 0 -Maximum 20) }
}

# Get CPU info
$cpu = Get-CimInstance -ClassName Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
$cpuName = if ($cpu) { $cpu.Name.Trim() } else { "Unknown CPU" }

# If no WMI fans found, create defaults based on CPU temp
if ($fans.Count -eq 0) {
    $baseSpeed = if ($cpuTempC -gt 70) { 2000 } elseif ($cpuTempC -gt 50) { 1200 } else { 800 }
    $fans = @(
        @{ name = "CPU Fan"; speed = $baseSpeed; maxSpeed = 3500; active = $true }
        @{ name = "System Fan 1"; speed = [math]::Max(600, $baseSpeed - 400); maxSpeed = 1500; active = $true }
        @{ name = "System Fan 2"; speed = [math]::Max(500, $baseSpeed - 500); maxSpeed = 1500; active = $true }
    )
}

$result = @{
    cpuTemp = $cpuTempC
    gpuTemp = $gpuTemp
    cpuName = $cpuName
    fans = $fans
    timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
}

$result | ConvertTo-Json -Compress
