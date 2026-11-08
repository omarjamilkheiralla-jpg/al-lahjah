@echo off
cd /d "%~dp0"
call npm install
if not exist out mkdir out
call npx remotion render src/index.ts Full out\how_chicago_lifted_itself.mp4 --gl=angle --concurrency=4 --image-format=jpeg --jpeg-quality=92 --crf=17 --timeout=300000
pause
