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

## STYLE 3: "Doubling aura" mini-movie (learned by studying the user's reference video "Are we DOOMed?" by @verpaxen, 44.8 s, 720x1280, 30 fps, 1341 frames)
Use this whenever the user says "style 3". Studied from the real file: one frame per second (all 45 viewed), cut times, HUD crops at full size, and loudness over time. NOT heard: I cannot hear speech or music, so voice/music details are marked *(not heard)*.

**Idea / format**
- Premise on screen as the title in the first 3 s: "What if your aura doubled every minute?" (italic serif, white, "aura" in gold).
- It is a STORY with a counter, not a list of characters. A normal street cafe scene: a punk with sunglasses and a red mohawk sits at a table; a guy (the hero) walks by with a coffee, gets coffee on his shirt, and everything keeps going wrong for the punk and right for the hero. Every minute the hero's aura doubles and the world reacts more:
  1. Minute 1: 100 aura. Coffee spilled on his shirt. Hero calm. (caption "Coffee on his shirt.")
  2. Minute 2: 200 then 400. "The wind only blows on him." Dog on a leash looks up. The punk loses his entire aura ("-400 AURA", label "SIDE CHARACTER") and asks "Who... that guy?" The hero is tagged "MAIN CHARACTER" at 629.
  3. Minute 3: 800, "AN ACTION HERO". Waiter drops a tray of cups, he catches them without looking. ("Minute 3: 800 aura. He didn't even look.")
  4. Minute 4: 1,600, "A MOVIE POSTER". A car explodes behind him, he walks away without looking back.
  5. Minute 5: 3,200, "VISIBLE FROM SPACE". News studio parody ("BREAKING NEWS: Local man's aura visible from space", LIVE badge, ticker), then top-down night city with a beam of light.
  6. Minute 6: 6,400 then 10,068, "TOO MUCH FOR ONE MAN". Night street, cracks in the road, ground lights up. ("His shadow isn't his.")
  7. Minute 7: 12,800, "A VILLAIN ORIGIN STORY". Hero is stuck, face lit gold with green cracks, "I CAN'T MOVE...". Progress bar "MINUTE 8 IS LOADING".
  8. Cut to black, then an inverted/thermal "SWITCH!" flash, then the villain Doctor Doom appears (green). Counter glitches (25,600 then "???") because the counter cannot hold him. The punk comes back with a STOP sign and tries to hit Doom, "...BOMBOCLAT." (Doom stops him with a hand).
  9. Minute 8: HUD becomes an infinity symbol, "DOCTOR DOOM", green "DOOM" tag. Then a hard title card: huge red serif "HELL" (then "HELL ANSWERS" small caps under it), and slow push-ins to Doom's mask. Ends on his face, no outro, no ta-ding, loop-friendly.
- Pattern: ONE stat doubles, the same hero escalates through film genres (coffee gag, action hero, movie poster, news report, villain origin), each with a visual gag and a punchline caption; the last step is a twist character that breaks the counter (infinity). A recurring side gag character (the punk) and a meme word ("BOMBOCLAT") returns 4 times as a bold shouted caption.
- Last step is a twist: the thing that finally beats the hero is a bigger power, not a moral.

**On-screen text**
- Title (first 3 s): serif italic, centred top, 3 lines, white, one gold word.
- HUD top-left (same family as Style 2): "AURA" tiny spaced caps; big light serif number (counts up between steps, digits tick; "12,800", "25,600"); small caps tier name ("AN ACTION HERO", "A MOVIE POSTER", "VISIBLE FROM SPACE", "TOO MUCH FOR ONE MAN", "A VILLAIN ORIGIN STORY"); "MINUTE n"; red pill "x2 EVERY MINUTE"; white/yellow/orange/green pill that names the role ("SIDE CHARACTER" white, "MAIN CHARACTER" and "FINAL BOSS" amber, "DOOM" green, "???" grey). Bottom of HUD: a thin loading bar "MINUTE 8 IS LOADING".
- Glitch/chromatic split on the HUD at the twist (RGB offset, scrambled letters).
- Captions: a short serif italic sentence lower-left ("Coffee on his shirt.") for narration jokes; and big bold sans caps, centred, 1-3 words, white with one gold word ("WHO THAT GUY?", "LOOK BACK.", "BOMBOCLAT!", "SWITCH!", "I CAN'T MOVE...") for shouted dialogue. Never boxed.

**Animation / camera (seen)**
- Cuts about every 0.7 to 2 s (about 60 cut points in 45 s; the finale cuts faster, 0.1 to 0.5 s). Every shot has a new camera: low hero angle looking up at the character (very common), over-the-dog close-up, top-down city, behind-the-character walk-away, extreme close-up of face, feet/boots close-up, wide with explosions, slow push-in on the final mask.
- Characters are fully 3D modelled low-poly people (faceted planes, soft toon-ish skin shading, big expressive faces with eyebrows, mouths and cheeks), with light-gold rim outline on the hero. They ACT: sip, spill, catch, wobble, point, shake with strain, glow. Dog is a rounded 3D corgi.
- Style = low-poly stylised 3D, warm saturated daytime (orange awnings, pink brick, green trees, blue sky) that gets darker with each minute: day, explosion orange, blue news set, night, black, then green monochrome for Doom. Colour change = escalation.
- Effects: flying debris, sparks, sun flares, cracks glowing on the ground, shockwave ring, volumetric light beam, fire, fog, green aura rings and lightning, glitch/RGB split, a white/inverted flash on the swap, black frames between big steps.
- Doom is a higher-detail realistic render (dark metal mask, hood fabric with folds, armour plates, chain, glowing eyes), lit from below in green, deliberately less cartoon than the rest.

**Audio**
- Measured: loudness rises steadily from about -25 dB RMS at 0 s to about -16 dB at the end (no silence, always climbing). Stereo AAC.
- Voice, spoken lines and the exact music: *(not heard)*. The shouted captions suggest voiced reactions; ask the user how it sounds before copying it.

**How to replicate with our pipeline**
- Remotion + three at 1080x1920, 60 fps (or 30). Story script first (8 to 9 minute-steps, each with: number, tier name, role tag, the gag, one serif caption, one shouted caption, camera, effect, palette). Doubling math must be consistent (100, 200, 400, 800, 1,600, 3,200, 6,400, 12,800, then the twist).
- Characters: our flat painted `Person2` will NOT match. This style needs real low-poly 3D humans (rigged boxes/planes with faces). Build a new `src/style3/` character kit: faceted body, head with eyes/brows/mouth morphs, simple walk, catch, stumble, strain poses. Honest warning: this is the biggest build so far; tell the user the cost and offer a simpler first sample (3 steps) before the full video.
- Keep: monotone camera time warp, HUD as HTML overlay from a data table, deterministic particles, cut flash/punch zoom.
- Rights: Doctor Doom is Marvel's. Original villain or a parody design is safer for monetisation; ask the user.

**Ask before scripting**: which stat and hero (aura again or new), which twist character at the end (original or famous), length (about 45 s), recurring side gag character, whether to use the "bomboclat" meme word or a new one, music/voice choice.

**Build notes for Style 3 (learned the hard way):** people must have realistic proportions (head about 1/7.5 of height), a sculpted faceted head with eye sockets, brow ridge, nose and thin lips, small half-lidded eyes (wide round eyes look silly), scalp-fitted hair made of overlapping plates (never a ball or cone wig), real sneakers lofted from cross-sections (not boxes), tapered torso with deltoids, per-triangle colour variance for the faceted look, a thin gold rim outline on the hero, front-facing 3/4 camera angles, strong depth of field, warm light that darkens toward the explosion. Fonts: Lora (title, caption, italic), Inter 600 to 900 (HUD, pills, shouts), Playfair for the big number. HUD sits close to the top-left corner. Code: `video/src/style3/`.

**Style 3 character pipeline (current):** `rig.ts` builds bodies from signed-distance fields with surface nets, skins them to a skeleton (so joints bend smoothly and clothes fit as separate offset shells), paints per-triangle colour, and adds flat decal eyes and lips on the real head surface, a sculpted hair shell and lofted sneakers. Use symmetric grids (grid lines through x=0), laplacian smoothing of 1 to 2 passes, double-sided cloth, no outline hull on the head (it makes rings in the eye sockets). Faces: narrow head, small half-lidded eyes, brows, nose, thin lips; never big round bulging eyes. Captions describe the gag in plain words ("Coffee on his shirt."), the HUD number rolls up at every cut, and the character gets a luck nickname (UNLUCKY, LUCKY, VERY LUCKY), never unrelated labels like MAIN CHARACTER.

## STYLE 4: "Two choices" first-person phone-horror story (learned from two reference reels, 720x1280, 30 fps, 68 s and 122 s)
Use this whenever the user says "style 4". References: "A cop knocked at midnight... but 911 never sent anyone" and a school-lockdown story, both from the "Two Choices | Animated Stories" kind of channel. Studied by sampling a frame every 2 s (all viewed). Voices/music NOT heard.

**Format**
- Interactive cliffhanger story told in FIRST PERSON: we see through the hero's eyes (their hands holding a phone at the bottom of the frame) and cut to close-ups of the hero's face reacting. One new shot about every 2 s, 30 to 60 shots per video.
- Opens on a timestamp HUD top-left ("TUESDAY · 12:04 AM", small yellow second line "Home alone" / "Room 214 · Biology final"), then straight into an ordinary moment that goes wrong.
- App screens are the storytelling device: doorbell camera (red LIVE dot, "Front Door", clock, corner brackets, TALK and LOCK buttons, rain, night-vision green mode), a 911 call screen with a live sound wave, a chat app with message bubbles, a "Back Door: Motion detected" banner, a "Call failed" screen.
- Dialogue by several characters, short lines. Captions: bold white sans (Inter 800 to 900) with a dark outline, centred at about 70 percent of the frame height, 1 to 5 words; the hero's lines in yellow, other speakers in white (or another colour per speaker).
- Ending: the story stops on the scariest beat, darkens, and asks the viewer: "WHAT WOULD YOU DO?" then two pill buttons (for example blue OPEN THE FRONT DOOR, red RUN AND HIDE, or green OPEN THE DOOR and red KEEP IT LOCKED), "OR" between them, and "Comment for Part 2". The comments decide Part 2. No ta-ding.
- Lighting tells the story: warm lamp and blue TV at home, cold blue night outside, blue-green night vision, near black at the end.

**Look**
- Simple cartoon people: big round head, big white eyes with black pupils and a highlight, tiny nose, small mouth, simple hair, plain clothes (red hoodie, police uniform, yellow cardigan). Smooth soft shading, not faceted. Detail comes from texture and lighting: wood floor, wallpaper, knit fabric, rain on windows, glowing screens, depth of field, bloom, vignette.
- Hands are chunky cartoon hands with simple fingers, sleeves in the hero's clothes colour.
- Camera is almost always moving slowly (push in, slow sway); POV shots have a gentle handheld sway.

**Voices (user decision):** the one-narrator rule does NOT apply to this style. Use a different Kokoro voice for each character. The voice model files are not in the repo (kokoro-v1.0.onnx and voices-v1.0.bin); on the cloud the voice model host may be blocked, so the user's PC may need to generate the voices.

**Risk note:** school-lockdown or violence-adjacent stories can be demonetised or age-restricted; prefer home-invasion, strange-visitor and mystery premises.
