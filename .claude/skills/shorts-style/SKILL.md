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
