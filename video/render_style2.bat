@echo off
cd /d "%~dp0"
call npm install
if not exist out mkdir out
call npx remotion render src/index.ts Style2Sample out\style2_sample.mp4 --gl=angle --concurrency=2 --crf=17
pause
