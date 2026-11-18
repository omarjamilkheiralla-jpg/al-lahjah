@echo off
cd /d %~dp0
call npx remotion render src/index.ts Centralia out\centralia_sample.mp4 --concurrency=2 --crf=15 --image-format=jpeg --jpeg-quality=95
