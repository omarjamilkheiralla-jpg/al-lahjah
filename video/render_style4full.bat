@echo off
cd /d %~dp0
call npx remotion render src/index.ts Style4Full out\style4_full_v1.mp4 --gl=angle --concurrency=2 --crf=17 --image-format=jpeg --jpeg-quality=92 --timeout=300000
