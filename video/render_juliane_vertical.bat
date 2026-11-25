cd /d "%~dp0"
call npx remotion render src/index.ts JulianeVertical out\juliane_vertical.mp4 --gl=angle --concurrency=2 --crf=17 --image-format=jpeg --jpeg-quality=92 --timeout=300000
pause
