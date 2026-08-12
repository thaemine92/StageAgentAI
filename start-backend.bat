@echo off
cd /d "%~dp0"
echo Démarrage du serveur backend...
npx tsx watch src/server.ts
