#!/usr/bin/powershell
Write-Host "Démarrage du serveur backend..."
$server = Start-Process -FilePath "node" -ArgumentList "-e", "require('child_process').execSync('npx tsx src/server.ts', {stdio: 'inherit'})" -NoNewWindow -PassThru

Start-Sleep -Seconds 5

Write-Host "Test de l'API..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/me" -Method GET -ErrorAction SilentlyContinue
    if ($response) {
        Write-Host "✅ Backend répond : $($response.StatusCode)"
        Write-Host "Contenu : $($response.Content)"
    }
} catch {
    Write-Host "❌ Backend ne répond pas : $_"
}

try {
    $login = @{email="dr.dupont@doclinic.com";password="password123"} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $login -ContentType "application/json" -ErrorAction SilentlyContinue
    if ($response) {
        Write-Host "✅ Login fonctionne : $($response.StatusCode)"
        Write-Host "Contenu : $($response.Content)"
    }
} catch {
    Write-Host "❌ Login échoué : $_"
}

$server | Stop-Process -Force
