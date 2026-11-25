# STYLE 1 INSTRUCTION DOCUMENT ("What if" day-by-day story)

Give this whole file to a new Claude chat. It contains everything learned while building the Style 1 reference video "What if an entire town won the lottery?" plus the user's standing rules. Read it fully before doing anything. Repo: `omarjamilkheiralla-jpg/al-lahjah`, branch `claude/magical-cannon-9igec5`, folder `video/`.

---

## 0. The rules about working with this user (read first)

- The user runs a faceless YouTube channel, "Unlikely True": strange facts, what-ifs and stories, animated. He is NOT a programmer. He uses a Windows PC (`C:\Users\jamil`, repo at `C:\Users\jamil\al-lahjah`) with a Radeon RX 6800M laptop graphics card and renders every video himself.
- Talk short and plain. No jargon, no walls of text. ONE command per code block, each starting from a known folder. When he sends a screenshot of an error, solve only that error.
- Be honest about what you did and did not check. You cannot hear audio and cannot watch motion. Say so every time. Never claim something is verified if it is not. Do not stand in for missing parts with fake results.
- ALWAYS write the script first and WAIT for his approval before building anything. Exception: when he explicitly says to build a short sample, build it, but still show what the script was.
- He gets frustrated by repeated mistakes, vague messages, and sloppy results. He compares your output to real reference videos frame by frame. Match references closely, not roughly.
- Commit and push everything to the branch above. A stop hook forces commit and push at the end of every turn. Do NOT open a pull request unless he asks.
- Always remind him to `git pull` before rendering (his git sometimes fails with "Could not resolve host": that means his internet was down, just retry).
- Never put his name, email or project details in outside requests.

## 1. What Style 1 is (one paragraph)

A fictional, theoretical story told as a countdown of scenes, not a facts lecture. Premise = a clear "what if" with a cause (what if an entire town won the lottery). Each day (Monday, Tuesday, ...) is a new place, a new problem and a punchline, and it escalates every day. Lots of jokes, reactions and visual gags, almost no wisdom. About 3 minutes long, horizontal 1920x1080. The reference build is the lottery town video (composition id `Town`, about 2:45, 27 shots, narration about 164 s).

## 2. Script rules (the most important part)

**Premise and hook**
- The hook says the premise, then explains what started it in 2 to 3 short lines, then goes straight into the story.
- NO foreshadowing of how the week ends. "By Friday X will happen" is banned. No teaser of the ending.
- If the user's idea is false as science, SAY SO and offer a nearby topic where the claim is true (he accepted this when "the Moon collapses by day 7" was dropped). Never present a made-up claim as real.

**Structure**
- Day-by-day or time-by-time countdown. Each day: new location, new problem, a punchline. Escalate every day.
- Beats: "But" (turn), "You see," (pivot, own beat), "So" (consequence). The video ends with the "ta-ding" (section 4).
- Short punchy lines, concrete scenes, jokes, reactions. About 450 to 550 words is enough for about 3 minutes. More scenes, NOT more talk. Little yapping.
- NO wisdom talk, no moral speeches, no "life lesson" ending. The ending is a last joke or visual (lottery town: the baker's "Help wanted, pay one million dollars a day" sign, and "Nobody applies. They are all in line for bread.").
- At most ONE real fact, phrased safely, as a one-line twist (lottery town: the plain meaning of inflation, "too much money, chasing too few things"). Everything else is clearly fiction.
- Write numbers and abbreviations as words: "Monday morning", NOT "8 a.m."; "three thousand", "one million dollars".
- Merge tiny fragments into one full sentence so the voice and the captions read clean.
- The "You see," line is exactly one sentence that starts with "You see," (example: "You see, the million dollars was never the problem.") and is followed by 2 to 3 short lines of explanation.

**Reference script shape (lottery town)**: hook (premise, small town, one dollar a week for ten years, 3 billion jackpot, one million each) -> Monday (check delivered, town screams) -> Tuesday (shopping spree: cars, boat in a driveway with no lake, trucks, gas station runs low) -> Wednesday (everyone quits, the shops are still open) -> Thursday (prices: bread 3 to 20 to 50 to 100 dollars, a couch for ten thousand, lemonade two hundred) -> Friday (empty shelves, burst pipe, no plumber) -> Saturday (helicopters sell sandwiches for five hundred dollars) -> "You see," pivot -> the one real fact -> Sunday (back to work, Help wanted sign) -> last joke.

## 3. Voice (final decisions, never break)

- Narrator for Style 1: Kokoro `am_liam` (the "version 5" voice), one steady voice. Speed formula `1 + (sp - 1) * 0.35`, gain at most 0.8 dB. NO pitch shifting, NO phase vocoder, NO clarity/EQ chain, NO other text-to-speech tools. Chatterbox was tried and removed ("so zesty"): never reinstall it. Other Kokoro voices were samples only.
- Deliver phrase by phrase. No "?" or "!" on lines that would sound sassy.
- **"You see," is its own beat.** Generate it INSIDE its full sentence (a two-word phrase alone sounds clipped and like "You'll see"), cut at the natural comma gap with 25 ms fades, insert a 0.42 s pause, and VERIFY by transcription (faster-whisper) that the first words are "you" then "see". The first half must be between 0.36 s and 1.3 s. If the check fails, retry at other speeds. No sound effect may land on the "You see," beat (a heartbeat thud there was heard as "bp"). In the user's earlier notes: about 1 s of silence before, about 0.4 s after.
- Voice files are generated by `projects/what-if-lottery-town/make_voice.py <kokoro.onnx> <voices.bin> <out_dir>`; the per-shot lines live in `shots.py` (list of `(sentence, speed, gain_db, gap_after_seconds)`; a line starting with `@YOUSEE:` triggers the "You see," procedure). The Kokoro model files (`kokoro-v1.0.onnx`, `voices-v1.0.bin`) are NOT in the repo and must be downloaded again. Python packages: `kokoro_onnx`, `faster-whisper`, `soundfile`, `numpy`, `scipy`, `pillow`; `ffmpeg` must exist. Run Python with `-I` and add the script folder to `sys.path`.

## 4. Audio

- Music by section that follows the story: comic, build, tense, lull, resolve. Sound effects per beat: cha-ching on every price, crowd cheer on the big moment, pops on "I quit", a comic "wah" on the "But" beat, etc. Music about 10 dB under the voice and ducked; voice never masked. Loudness -14 LUFS (ffmpeg loudnorm). All synthesised in numpy: `projects/what-if-lottery-town/make_audio.py` writes `public/<name>_mix.wav`.
- **Ending "ta-ding" (every video, Style 1 included):** right after the last spoken word, a quick marimba "ta" about 0.12 s later, then a bright bell/marimba "-ding" arpeggio with a soft pad about 0.36 s later. The video runs about 1.5 s past the last word to let it ring. (Style 2 to 4 videos do NOT use it; only Style 1 and the older story videos.)
- Captions come from the real script words aligned to a faster-whisper transcript: `make_timing.py <voice.wav> <lines.json> <timing.json>` (copy result to `src/town/timing.json`). Captions show the EXACT script text, 1 to 4 words at a time, font Lilita One, bottom centre. Fix "You'll see" to "You see," and "x -rays" to "X-rays" in captions.

## 5. Look (the world and the people)

- 16:9, 1920x1080. The reference used 50 fps, which can judder on a 60 Hz screen (the user said "a bit of lag"): offer 60 fps.
- ONE shot per place or camera idea; split a long line into two shots when the location changes. A DIFFERENT camera angle every shot; the camera NEVER stops (push in, crane, low hero angle, top-down, tilted close-up, side track). Cuts land about 0.1 s before each spoken line with a small zoom punch and a soft flash. Camera key paths with a monotone cubic time warp (ease in/out), tiny natural sway.
- The world must read as a REAL CITY: continuous buildings on both sides of the street, a cross street, plaza, skyline behind, no isolated block on an empty lawn, no hills or grass as filler. Every special place (gas station, suburb street, moving van, houses, dealership) sits INSIDE the street layout.
- Buildings: brick/paint/siding, shop fronts with awnings and signs, water tanks, AC units, balconies, flower boxes, potted plants, pilasters, blade signs, a clock tower town hall. Painted in-world signs and price tags for every number (never floating text). Soft key light from the upper left, soft shadows, hazy horizon fog, bloom, grain, vignette, depth of field on the subject (`src/hotel/PostFX.tsx`).
- People: flat painted 2D characters (`Person2`, `src/full/person.tsx`, art in `src/full/paint.ts`) standing in the 3D world: big round pale head, calm half-lidded eyes, thin ink limbs, shaded two-tone clothes, soft contact shadow. 44 generated crowd looks (`src/town/looks.ts`: skin tones, hair, hats, shirts, ties, vests, glasses, mustaches) so crowds are never the same twice; role characters (mayor, baker, clerk, doctor...) keep fixed looks. No conical hats for generic crowds. Expressions that change with the story (deadpan, smug, worried, shock, grin, laugh, angry, proud, think), blinking every 3 to 4 s, breathing bob.
- People must NEVER walk in place, overlap or collide: moving = walk pose, arrived = idle/cheer; each person gets a unique target spot and lane. `Person2` has `gait` and `amp` so the walk cycle matches ground speed (no foot sliding). No object may pass through a character; no characters inside furniture.
- Props that tell the story: giant check on an easel, scrolling names, lottery TV, money confetti, SOLD signs, car dealership, boat in a driveway, couch carried to a moving van, price board flipping, helicopter food drop, balloon inflating.
- Geometry facts: flat characters face +z, so film them from +z (looking along -z). At yaw above 0.3 they mirror. The camera must never look along their plane (they become sticks). In the Town world keep camera z at most 14 (front-row awnings reach z about 15.6).

## 6. ZERO tolerance (the user's words, final)

No stray lines, thin wavy lines, hard texture stripes, tile seams, spiky outlines, faceted shards, floating or cut-off parts (hats, props), text running off boards, objects blocking faces, flat empty ground, characters sideways, objects phasing through each other. Every surface needs texture and detail; depth in everything. Rules that came from real bugs:
- Ground textures must be seamless (draw blobs wrapped at the tile edges) and contain no ripple/stroke lines.
- Organic meshes must be welded (`mergeVertices`) with smooth normals before outlining; never outline a non-indexed displaced icosahedron.
- Wrapped UVs make seams: use a planar projection for blob textures.
- Hats are drawn at 78 percent inside the head canvas so they are never cut off.
- Signs are painted in the world at true proportions (Rye for signs, Playfair for plates, Lilita One for chalk and captions), never stretched.

## 7. Engineering rules (so the render does not crash)

- Stack: Remotion 4.0.541 + three 0.187 + @react-three/fiber 9 + drei + `postprocessing`. Composition `Town`, files `src/town/{world,scenes,looks,TownFull}.tsx`, `src/town/Thumb.tsx`, `src/town/timing.json`, root registration in `src/Root.tsx`.
- NEVER create geometry, materials or textures inside render code. Per-frame allocation ran Chrome out of memory at frame 2016. Use the cached helpers in `src/town/world.tsx` (`box`, `geo`, `toon`, `rep`) and `React.memo` all static scenery (buildings, trees, lamps, street, skyline).
- Fonts are shipped in `public/fonts` (Lilita One, Rye, Playfair Display) so every machine renders the same.
- Three-band toon materials, inverted-hull ink outlines (`Ink` in `src/hotel/kit.tsx`, ink `#351f22`), painted canvas textures.

## 8. QA before you say "ready"

The cloud has NO graphics card (software rendering). A single half-size test frame can take 1 to 25 minutes. Procedure:
1. Render one frame per shot at half size, 4 to 6 at a time, with long timeouts: `npx remotion still src/index.ts Town out.png --frame=N --scale=0.5 --props='{"captions":false,"audio":false}' --gl=swangle`. Make contact sheets with PIL and LOOK at every shot at full size (crop ground and props, not just thumbnails). Then render one frame with captions.
2. Look specifically for: things passing through each other, cut-off hats or props, parts floating or detached, text running off boards, objects blocking faces, characters in the lens, flat empty ground, people walking in place, collisions.
3. Be honest in the final message: list what was checked and what was NOT (all audio, all motion, any frame you did not render).
Better: if a session on the user's PC is available (section 10), render there, it is far faster.

## 9. The user renders it himself (Windows PowerShell, one command at a time)

```
cd C:\Users\jamil\al-lahjah
git checkout -- video/package-lock.json
git pull
cd video
npx remotion render src/index.ts Town out\lottery_town_v2.mp4 --gl=angle --concurrency=2 --crf=17 --image-format=jpeg --jpeg-quality=92 --timeout=300000
```
(Each line is its own command.) If Chrome runs out of memory use `--concurrency=1`. Use a NEW output file name every time (a locked old file gives EPERM). He must be inside `...\al-lahjah\video` or `npx` gives a network error. `render_town.bat` exists; the old bat used `--concurrency=4`, which can crash him.

## 10. Using his graphics card from the cloud chat (optional, worked once)

He installed the Claude command (`npm install -g @anthropic-ai/claude-code`), logged in (`claude auth login`), and ran `claude remote-control` inside `C:\Users\jamil\al-lahjah` (answer `y` to trust and `1` for same-dir). The PowerShell window must stay open, the laptop plugged in and awake (`powercfg /change standby-timeout-ac 0`). Then `list_environments` shows a "bridge" environment, and a session can be started on it with `create_session`; the owner has to approve once with `confirm_repository_trust`. Never run two `claude remote-control` windows at once. Use `--gl=angle` there (NOT `swangle`).

## 11. Delivery package for each video

- Title, description and thumbnail. NO sources in the description, but include the disclaimer lines and the line that the voice is synthetic (AI-generated).
- Thumbnails must come from the video's own world (real frames or a close-up render of its scene), never unrelated art. The lottery thumbnail the user liked best is `projects/what-if-lottery-town/thumbnail_clean.png`.
- Channel assets (new): night profile picture and banner are in `video/reference/channel/`.

## 12. How to start a NEW Style 1 video (checklist)

1. Ask the user for the premise, or propose 3 with a clear cause. Check it is true or safely fictional; say so if it is false science.
2. Write the script (450 to 550 words, day by day, one punchline per day, one real fact at most, "You see," pivot, numbers as words). Post it and WAIT for approval.
3. After approval: shot list (one shot per line; split when the location changes; mark wide, medium and close, camera move, time of day, props and the signs/prices to paint). Copy the structure of `projects/what-if-lottery-town/` to a new project folder (`SCRIPT.md`, `shots.py`, `make_voice.py`, `make_timing.py`, `make_audio.py`) and `src/town/` to a new scene folder.
4. Build voice -> timing -> audio -> scenes. Test frames for every shot. Fix at the source.
5. Tell the user plainly what was and was not checked, then give the render commands. Update `video/HANDOFF.md` and `video/STYLE_GUIDE.md`, commit, push.

## 13. Other styles the user also has (do not mix them up)

- **Style 2**: silent doubling-escalation counter ("every step twice as long as the last"), HUD block top-left, clean blocky 3D, rising soundtrack, no voice, no ta-ding.
- **Style 3**: "doubling aura/luck" mini-movie with smooth realistic low-poly 3D people and a rolling counter, no catchphrase. Code in `src/style3/`.
- **Style 4**: first-person phone-horror "two choices" story, different voice per character allowed, ends on "WHAT WOULD YOU DO?". Code in `src/style4/`.
All are written up in `video/STYLE_GUIDE.md` and `video/HANDOFF.md`. The "one narrator, am_liam" and "ta-ding" rules belong to Style 1 and the older story videos.
