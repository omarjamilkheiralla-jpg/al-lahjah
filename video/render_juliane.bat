cd /d "%~dp0"
call npx remotion render src/index.ts Juliane out\juliane_16x9.mp4 --gl=angle --concurrency=2 --crf=17 --image-format=jpeg --jpeg-quality=92 --timeout=300000
pause
