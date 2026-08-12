# Test de l'API backend
Start-Process -FilePath "npx" -ArgumentList "tsx", "src/server.ts" -NoNewWindow -PassThru

# Attendre 5 secondes
Start-Sleep -Seconds 5

# Tester l'API
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/me" -Method GET
    Write-Host "✅ Backend répond : $($response.StatusCode)"
    Write-Host "Réponse : $($response.Content)"
} catch {
    Write-Host "❌ Erreur backend : $_"
}

# Tester la connexion
try {
    $loginData = @{
        email = "dr.dupont@doclinic.com"
        password = "password123"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ Login réussi : $($response.StatusCode)"
    Write-Host "Réponse : $($response.Content)"
} catch {
    Write-Host "❌ Erreur login : $_"
}
