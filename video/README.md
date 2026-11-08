# 3D video studio (Remotion + Three.js)

Separate from the static site in the repo root. Run everything from this `video/` folder.

```bash
npm install
npm run dev        # Remotion Studio: live preview + timeline
npm run render     # -> out/video.mp4 (1920x1080, 30fps, H.264 + AAC)
npm run still      # -> out/still.png
npm run transcribe -- public/narration.mp3 en   # auto-captions (whisper.cpp) -> public/captions.json
```

## Layout
- `src/Root.tsx`: composition size, fps, duration
- `src/Scene3D.tsx`: Three.js scene (react-three-fiber via `@remotion/three`)
- `src/Captions.tsx`: word-highlighted captions from `public/captions.json`
- `src/Main.tsx`: stacks 3D + captions + audio (`public/audio.wav` is a placeholder tone)

## Rules
- Animate only from `useCurrentFrame()`. Never use `useFrame` or `requestAnimationFrame` in 3D scenes, or renders will be wrong.
- All `remotion` and `@remotion/*` packages must stay on the same exact version (`npm run upgrade`).
- `remotion.config.ts` uses your GPU (`angle`) by default. On a machine without a GPU run with `REMOTION_GL=swangle`. On Windows laptops with two GPUs, force the fast one: Settings > System > Display > Graphics > add `node.exe` and the Remotion `chrome-headless-shell.exe` (in `video/node_modules/.remotion/`) and set High performance.
- Arabic captions: `npm run transcribe -- file.mp3 ar`, and use an Arabic font (`@remotion/google-fonts`, e.g. Cairo) in `Captions.tsx`.

## The full video: "How Chicago Lifted Itself" (about 52 s)
- Composition id `Full` (`src/full/`). Script, shot table, facts and sources: `projects/chicago-hotel/SCRIPT.md`.
- `render_full.bat` renders the final 1080x1920 video with your GPU; `test_render_full.bat` renders the first 3 seconds.
- Voice: `projects/chicago-hotel/make_voice.py` (Kokoro). Music + SFX + mix: `make_audio_full.py`. Word timings: `src/full/timing.json`.
- Fonts in `public/fonts` are SIL Open Font License (Lilita One, Rye, Playfair Display).

## "Cut Every Tail" (Hanoi rat bounty, about 52 s)
- Composition id `Rats` (`src/rats/`). Script, shot table, facts and sources: `projects/hanoi-rats/SCRIPT.md`.
- `render_rats.bat` renders the final video; `test_render_rats.bat` renders the first 3 seconds.
- Voice: `projects/hanoi-rats/make_voice.py` (Kokoro). Score + SFX + mix: `projects/hanoi-rats/make_audio.py`. Timings: `src/rats/timing.json`.
