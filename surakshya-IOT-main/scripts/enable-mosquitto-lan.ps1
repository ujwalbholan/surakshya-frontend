# Run as Administrator: right-click PowerShell -> Run as administrator, then:
#   Set-ExecutionPolicy -Scope Process Bypass
#   & "D:\SurakshyaWatch\IoT\scripts\enable-mosquitto-lan.ps1"

$ErrorActionPreference = "Stop"

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (-not $isAdmin) {
    Write-Host "This script must run as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell -> Run as administrator, then run this script again."
    exit 1
}

$mosquittoDir = "C:\Program Files\mosquitto"
$confDir = Join-Path $mosquittoDir "conf.d"
$sourceConf = Join-Path $PSScriptRoot "..\config\mosquitto-local-network.conf"
$targetConf = Join-Path $confDir "local-network.conf"
$mainConf = Join-Path $mosquittoDir "mosquitto.conf"

if (-not (Test-Path $sourceConf)) {
    throw "Missing config file: $sourceConf"
}

New-Item -ItemType Directory -Path $confDir -Force | Out-Null
Copy-Item -Path $sourceConf -Destination $targetConf -Force

$includeLine = "include_dir $confDir"
$mainText = Get-Content $mainConf -Raw
if ($mainText -notmatch [regex]::Escape($includeLine)) {
    Add-Content -Path $mainConf -Value "`n$includeLine"
}

$firewallRuleName = "Mosquitto MQTT 1883 (SurakshyaWatch)"
$existingRule = Get-NetFirewallRule -DisplayName $firewallRuleName -ErrorAction SilentlyContinue
if (-not $existingRule) {
    New-NetFirewallRule -DisplayName $firewallRuleName -Direction Inbound -Protocol TCP -LocalPort 1883 -Action Allow | Out-Null
    Write-Host "Added firewall rule: $firewallRuleName"
}

Restart-Service mosquitto
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Mosquitto listeners on port 1883:"
netstat -an | findstr ":1883"

Write-Host ""
Write-Host "Done. ESP32 should connect to broker at your PC Wi-Fi IP (e.g. 192.168.18.24)."
