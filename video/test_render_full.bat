@echo off
cd /d "%~dp0"
call npm install
if not exist out mkdir out
call npx remotion render src/index.ts Full out\full_test.mp4 --frames=0-89 --gl=angle --concurrency=4 --image-format=jpeg --timeout=300000
pause
