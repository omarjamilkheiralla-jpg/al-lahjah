---
name: shorts-style
description: Rule book for making the user's "explain-it-with-a-story" 3D-animated vertical Shorts (cartoon stick-figure characters, word-by-word captions, hook-first narration, ends on a payoff/explosion). Use whenever the user asks to write, script, storyboard, build, or replicate one of these Shorts or analyse a hook.
---

Read `video/STYLE_GUIDE.md` in full before doing any work on these videos, and follow it:
hook formulas (§2), 7-beat story structure (§3), narration rules (§4), visual and camera rules (§5),
caption style (§6), audio targets (§7), spec (§8), checklist (§9), don'ts (§10).

Reference transcripts and measurements: `video/reference/transcripts.md`.
Build with the Remotion + Three.js project in `video/` (see `video/README.md`).

IMPORTANT: also follow the section "APPROVED HOUSE STYLE v2: Painted 3D world" at the end of `video/STYLE_GUIDE.md`.
It is the look the user approved ("very nice, remember this style"): long receding streets with shopfronts on both sides,
foreground/midground/background depth, painted characters with soft shadows, a travelling camera in every shot,
a steady `am_eric` narrator (no pitch shifting), and a full-video frame QA before reporting.
Reference build: `video/src/rats/`. Reuse `StreetCanyon`, `MarketStall`, `Bunting`, `Scatter`, `SkyDome`, `Horizon`, `Person2`, `Rat`.

## STYLE 1: "What if" day-by-day story (saved by the user; reference build = "What if a town won the lottery")
Use this whenever the user says "style 1". It is a fictional/theoretical story told as scenes, not a facts lecture.

**Script rules**
- Topic = a clear what-if premise with a cause. Hook = say the premise, then explain what started it in 2-3 short lines, then go straight into the story. NO foreshadowing of how the week ends ("by Friday X will happen" is banned).
- Structure: a day-by-day (or time-by-time) countdown: Monday, Tuesday, ... each day is a new place, a new problem and a punchline. Escalate every day.
- Short punchy lines, concrete scenes, jokes and reactions. NO wisdom talk, no moral speeches, no "life lesson" ending. Little yapping: about 450-550 words is enough (about 3 minutes); more scenes, not more talk.
- At most ONE real fact (a one-line twist such as the plain meaning of inflation), phrased safely. Everything else is clearly fiction. Never present a made-up claim as real; if the user's idea is false as science, say so and switch topic.
- Beats: "But" (turn), "You see," (pivot, own beat with a stop before and after), "So" (consequence), ends with the ta-ding.
- Write numbers and abbreviations as words ("Monday morning", not "8 a.m."). Merge tiny fragments into one full sentence so the TTS and the captions read clean.

**Voice and audio**
- Kokoro `am_liam`, version-5 rules (steady, no pitch tricks). "You see," is generated inside its sentence, cut at the comma gap with 25 ms fades, pause inserted, verified by transcription. No sound effect may land on the "You see," beat (a heartbeat thud there was heard as a "bp").
- Captions: the real script words aligned to a whisper transcript (`make_timing.py`), 1-4 words, Lilita One, bottom centre.
- Music by section (comic, build, tense, lull, resolve) + SFX per beat (cha-ching on every price, crowd cheer on the big moment, pops on "I quit", ta-ding at the end); `make_audio.py`, loudnorm -14 LUFS.

**Look**
- 16:9, 1920x1080, 50 fps (note: 50 fps can judder on 60 Hz screens; offer 60). One shot per place/camera idea; split a long line into two shots when the location changes. A different camera angle every shot, camera never still.
- The world must read as a REAL CITY: continuous buildings on both sides of the street, cross street, plaza, skyline behind, no isolated block on an empty lawn, and every special place (gas station, suburb street, van, houses) sits inside the street layout. No hills/grass as filler.
- Buildings: brick/paint/siding, shop fronts with awnings and signs, water tanks, AC units, balconies, flower boxes, potted plants, pilasters, blade signs, clock tower town hall. Painted in-world signs and price tags for every number (never floating text).
- People: 44 generated looks (skin tones, hair, hats, shirts, ties, vests, glasses, mustaches) so crowds are never the same twice; role characters (mayor, baker, clerk, doctor...) keep fixed looks. No conical hats for generic crowds.
- People must never walk in place, overlap or collide: moving = walk pose, arrived = idle/cheer; each person gets a unique target spot and lane.
- Props that tell the story: giant check on an easel, names scroll, lottery TV, money confetti, SOLD signs, car dealership, boat in a driveway, couch carried to a moving van, price board flipping, helicopter food drop, balloon inflating.

**Engineering lessons (so the render does not crash)**
- Never create geometry/materials/textures inside render code: cache boxes, cylinders, materials and cloned textures at module level (`box`, `geo`, `toon` cache, `rep` cache). Per-frame allocations ran Chrome out of memory at frame 2016.
- `React.memo` all static scenery (buildings, trees, lamps, street, skyline).
- Tell the user to render with `--concurrency=2` (1 if it still crashes) and to `git pull` first.

**QA**: one frame per shot at 50% scale, 4-6 at a time (about 8 min per batch in the cloud), look at every shot for blocking objects, characters in the lens, floating props, collisions, then a captions frame. Be honest that audio and motion were not heard/seen.

**Files**: `video/projects/what-if-lottery-town/{SCRIPT.md,shots.py,make_voice.py,make_timing.py,make_audio.py}`, `video/src/town/{world,scenes,looks,TownFull}.tsx`, `video/render_town.bat`, composition id `Town`.

## STYLE 2: "Doubling escalation" what-if (learned from the user's reference "What if every burp was twice as loud as the last?")
Use this whenever the user says "style 2". Reference file: 720x1280, 30 fps, 100 s, NO narration, only rising music/SFX (loudness grows from near silence to very loud across the video).

**Idea / format**
- A what-if with ONE rule that doubles/escalates each step ("every burp is twice as loud as the last", "every step is twice as long as the last"). The video is a counter that climbs through real, checkable scales: ~35 steps in 100 s (about 2.8 s per step), constant rhythm.
- Scale ladder = the story: human/street level -> city -> region -> whole planet from space -> planet breaks apart -> ONE joke ending ("You survived. So did your soda."). Each step compares the number to a real thing (a blender, a jet engine, Krakatoa, a Hiroshima bomb, Chelyabinsk, Tunguska, a lightning bolt, the dinosaur asteroid, a second of the Sun, the energy holding Earth together). Every comparison must be verified; round honestly; skip steps that have no good comparison (the reference skips numbers, e.g. #1, #3, #4, #5, #7, #8, #9, #11...).
- First frame = the title as an italic serif question centred over the opening scene ("What if every burp was twice as loud as the last?"), then straight into step 1. Last card = a question to the viewer ("Which burp would you survive? Comment the number.").
- Hashtags/title are keywords: science, physics, whatif.

**On-screen text (HUD, top-left, stays all video, only the numbers change)**
1. small spaced caps label: "BURP #6"
2. huge light serif number: "109 dB"
3. small spaced caps line: the comparison ("ALMOST THE WORLD-RECORD BURP (112 dB)")
4. small spaced caps line: "ENERGY ≈ 300 MICROGRAMS OF TNT"
5. red rounded pill: "TWICE AS LOUD EVERY BURP" (the rule, always visible)
6. below, one italic serif caption sentence, 4-9 words, with a dry joke or the consequence ("Grandma clutches her handbag.", "Nobody is clapping.", "Weather forecast: 100% chance of burp.")
- A small "YOU" tag with a thin leader line follows the hero when seen from above. Text is white on the scene, no boxes, a soft dark shadow only when needed.

**Look**
- Clean low-poly / blocky 3D world, flat shading, soft shadows, grey fog sky; NOT painted. The hero is a blocky figure in bright colours (yellow shirt, green shorts, blue cap); everybody else is plain grey mannequins so the hero reads instantly.
- Cameras follow the ladder: eye-level in front of the walking hero -> higher angle -> top-down city -> continent -> globe from space (moon in the corner) -> debris field with the hero floating. Camera always moves; the pull-back is the escalation.
- Effects grow with the numbers: sound rings, dust rings, debris and paper flying, cracked windows, collapsing blocks, a glowing red ground, a planet that glows, cracks and breaks into plates.
- Audio: no voice. Ambient bed that gets louder every step, a hit per step, a bass swell, silence for the final joke.

**How to build it with our pipeline**: Remotion + three; HUD as an HTML overlay (numbers from a data table, one step per row: n, value, comparison, energy, caption, camera key, effect); same camera key system with monotone warp; 9:16 1080x1920; 30 or 60 fps; deterministic particles driven by the frame number; QA one frame per step. Facts table must be verified before building and the energy/dB/TNT arithmetic double-checked.

## STYLE 3: "Doubling aura / power-scale meme counter" (learned from the user's reference reel "Are we DOOMed?" by @verpaxen, Instagram, posted 2026-11-13)
Use this whenever the user says "style 3".

**HONESTY NOTE: what this is based on.** Cloud could not download the video. Verified from the page: caption "Are we DOOMed?", about 140K likes and 891 comments in 2 days, audio "Original audio", and ONE thumbnail frame (seen). Everything marked *(inferred)* comes from that frame, the comments and the format's logic, NOT from watching or hearing the reel. Replace the inferred parts when the user supplies the file or screenshots.

**What the one frame shows (seen)**
- Vertical 9:16, near-black frame with a dark green glow (green light strip at the top and bottom edge, green rim light).
- Subject = a realistic-looking 3D Doctor Doom (dark hood, metal mask, glowing eyes), big in the frame, centred, face in the middle third. Not cartoon or flat: cinematic, moody, one-colour palette.
- HUD text block top-left, small and clean: tiny spaced-caps label "AURA", then a big white infinity symbol, then "DOCTOR DOOM", then "MINUTE 8", then two pills: red "x2 EVERY MINUTE" (the rule, always visible) and green "DOOM" (the character/tier tag, colour matches the scene glow).
- So it is the Style 2 HUD pattern (label, big number, name, rule pill) applied to a power-scaling meme: a value doubles each step and the character on screen changes. At minute 8 the number is already infinity (Doom's aura beats the counter).

**Idea / format (inferred)**
- A power-scaling "what if" counter: "What if your aura doubled every minute?" The video steps through minutes (or levels); each step swaps in a stronger fictional character, each with a name tag and a number. The number overflows into infinity for the top-tier character, which is the joke/payoff.
- Content = pop-culture characters (games, anime, Marvel, JoJo; comments mention Doom and Jotaro), compared on one fake stat ("aura"). No facts to verify, but the ranking must feel fair and funny so comments argue about it (comments are the engine: "poly doom before gta 6", "Jotaro was moving", meme words like "bomboclat").
- Caption is one short question to the viewer ("Are we DOOMed?"). Hook = a question plus the first character on screen at frame 0.
- Probably no narration, short (about 20 to 40 s) and loop-friendly *(inferred)*. Audio is "Original audio": likely a trending or hype track with hits per step *(inferred, not heard)*.

**Look rules to follow**
- One strong colour per character (the scene glow, HUD tag pill and rim light all match). Dark background, high contrast, centred bust or full figure, slow push-in or orbit, never a still frame.
- Characters should look like real 3D renders (lit, textured), not flat paper cut-outs. In our pipeline: toon is NOT enough for this style; use PBR-ish materials, strong rim light, volumetric glow, bloom, grain, DOF.
- HUD copied from Style 2 (same block, new tags); only the step number, name and tier tag change.

**Copyright note.** Doctor Doom, Jotaro and similar are other people's characters. Original characters or clearly parody designs are safer for monetisation. Say so to the user before building and let him decide.

**Open questions to ask the user before scripting a Style 3 video**
1. Which characters / what ladder (original or famous)? 2. What is the stat (aura, power, cool, danger)? 3. Length (20 s, 40 s, 60 s)? 4. Music: trending track, or our own synth score?
