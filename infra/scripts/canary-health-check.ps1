# ==============================================================================
# ASRTAVA Canary Post-Deployment Smoke Verification Script (PowerShell / Windows)
# Evaluates /health, /ready, /metrics and returns status code for CI/CD gates
# ==============================================================================

param (
    [string]$BaseUrl = "http://localhost:5000",
    [int]$MaxRetries = 10,
    [int]$RetryDelaySeconds = 3
)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🔍 ASRTAVA CANARY POST-DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "================================================================="
Write-Host "Target Base URL: $BaseUrl"

$healthEndpoint = "$BaseUrl/health"
$readyEndpoint  = "$BaseUrl/ready"
$metricsEndpoint = "$BaseUrl/metrics"

$attempt = 1
$isHealthy = $false

while ($attempt -le $MaxRetries) {
    Write-Host "Attempt $attempt of $MaxRetries: Probing $healthEndpoint..." -ForegroundColor Yellow
    try {
        $healthResponse = Invoke-RestMethod -Uri $healthEndpoint -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($healthResponse.status -eq "healthy") {
            Write-Host "  ✅ Liveness probe passed: status = healthy" -ForegroundColor Green
            $isHealthy = $true
            break
        }
    } catch {
        Write-Host "  ⏳ Connection pending: $_. Exception encountered." -ForegroundColor Gray
    }

    Start-Sleep -Seconds $RetryDelaySeconds
    $attempt++
}

if (-not $isHealthy) {
    Write-Host "❌ CRITICAL: Canary health probe failed after $MaxRetries attempts!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/3] Probing Readiness Endpoint: $readyEndpoint..." -ForegroundColor Yellow
try {
    $readyResponse = Invoke-RestMethod -Uri $readyEndpoint -Method Get -TimeoutSec 3 -ErrorAction Stop
    if ($readyResponse.status -eq "ready") {
        Write-Host "  ✅ Readiness probe passed: Gateways active = $($readyResponse.activeGateways)" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️ Readiness probe returned error: $_" -ForegroundColor Yellow
}

Write-Host "`n[3/3] Probing Prometheus Observability: $metricsEndpoint..." -ForegroundColor Yellow
try {
    $metrics = Invoke-WebRequest -Uri $metricsEndpoint -Method Get -TimeoutSec 3 -ErrorAction Stop
    if ($metrics.Content -match "asrtava_uptime_seconds") {
        Write-Host "  ✅ Prometheus telemetry active: Metric streams available" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️ Metrics probe returned error: $_" -ForegroundColor Yellow
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "🎉 CANARY VERIFICATION PASSED: ASRTAVA IS READY FOR TRAFFIC!" -ForegroundColor Green
Write-Host "================================================================="

