@echo off
cd /d "%~dp0"
call npm install
if not exist out mkdir out
call npx remotion render src/index.ts Emu out\emu_war.mp4 --gl=angle --concurrency=4 --image-format=jpeg --jpeg-quality=92 --crf=17 --timeout=300000
pause
