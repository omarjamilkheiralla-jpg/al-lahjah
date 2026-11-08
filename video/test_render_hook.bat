@echo off
cd /d "%~dp0"
call npm install
if not exist out mkdir out
call npx remotion render src/index.ts HotelHook out\hotel_hook_test.mp4 --frames=0-29 --gl=angle --concurrency=4 --image-format=jpeg
pause
