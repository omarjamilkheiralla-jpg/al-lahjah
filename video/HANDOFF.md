# HANDOFF: read this first in a new session

Work branch: `claude/magical-cannon-9igec5` (everything below is pushed there). Start the new session on THIS branch, not main.
The user renders every video on their own Windows PC (never render full videos in the cloud). Commands they use (one at a time, in PowerShell):
`cd C:\Users\jamil\al-lahjah` -> `git checkout -- video/package-lock.json` -> `git pull` -> `cd video` -> `npx remotion render src/index.ts <Composition> out\<name>.mp4 --gl=angle --concurrency=2 --crf=17`
If Chrome runs out of memory use `--concurrency=1`. Always `git pull` first.

## Rule book (read these)
- `video/STYLE_GUIDE.md`  house style, voice rule (Kokoro `am_liam`, no pitch tricks), "You see," beat, ta-ding ending, zero tolerance for stray lines/seams, QA procedure.
  - **STYLE 1** = "What if" day-by-day story (reference build: lottery town).
  - **STYLE 2** = silent doubling-escalation counter (learned from the user's burp reference; sample = "every step twice as long").
- `.claude/skills/shorts-style/SKILL.md` (same rules) and `.claude/skills/stop-slop/` (writing-style skill, MIT, vetted).

## Videos built (composition id -> files)
- `Full` Chicago hotel, `Rats` Hanoi rats, `Anti` Antikythera (Shorts, 1080x1920 60 fps) - done and uploaded.
- `Emu` Emu War (Shorts) - built, user rendered it and sent glitch fixes (fixed, pushed). Files `src/emu/*`, `projects/emu-war/*`.
- `Town` "What if a whole town won the lottery" (long, 1920x1080, 50 fps, ~2:45). Files `src/town/{world,scenes,looks,TownFull,Thumb}.tsx`, `projects/what-if-lottery-town/*` (script, shots.py, make_voice/timing/audio). Thumbnails: `projects/what-if-lottery-town/thumbnail_clean.png` (latest, user wanted clean + depth + clear idea).
- `Style2Sample` "What if every step you took was twice as long as the last?" (20 s sample, 1080x1920, 60 fps). `src/style2/Style2Sample.tsx`, audio `projects/style2-steps-sample/make_audio.py`. User asked for more depth/details/funny gags; v3 (characters facing camera, BONK gag, pigeons, props) is pushed but the user has not yet reported on it. Space steps (20/25/30) were not checked in rendered frames.
- Unbuilt scripts for approval: `projects/what-if-moon`, `what-if-no-lies`, `what-if-truth-serum` (user rejected tone/topic; moon video on hold).

## Known facts / gotchas
- Flat painted characters (`Person2`) face +z: always film them from +z (never along the street), keep cameras at z <= 14 in the Town world (front-row awnings reach z ~15.6).
- Never create geometry/materials/textures inside render code (memory leak crashed Chrome at frame 2016); use the cached helpers in `src/town/world.tsx` and `React.memo` static scenery.
- Kokoro voice model files are NOT in the repo. They lived in the old session's scratchpad (`kokoro-v1.0.onnx`, `voices-v1.0.bin` from the kokoro-onnx releases) and `kokoro_onnx`, `faster-whisper`, `soundfile`, `scipy` must be pip-installed again before regenerating any narration. `ffmpeg` is available.
- Voice text rules: write numbers/abbreviations as words ("Monday morning", not "8 a.m."), merge tiny fragments, verify by transcription; I cannot hear audio, say so honestly.
- User preferences: no wisdom/moral talk, little yapping, no foreshadowing hooks, real city (not isolated buildings), varied characters, thumbnails clean and clear, descriptions without sources but with the disclaimer + synthetic-voice lines, be honest about what was not checked.
- Stop hook: commit and push all changes before ending a turn.
