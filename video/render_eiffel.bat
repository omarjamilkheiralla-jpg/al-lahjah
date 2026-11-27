cd /d "%~dp0"
npx remotion render src/index.ts Eiffel out\eiffel_v1.mp4 --gl=angle --concurrency=2 --crf=17 --image-format=jpeg --jpeg-quality=92 --timeout=300000
