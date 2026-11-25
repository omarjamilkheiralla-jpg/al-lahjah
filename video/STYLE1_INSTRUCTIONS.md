# STYLE 1 INSTRUCTION DOCUMENT ("Explain-it-with-a-story" short)

Give this whole file to a new Claude chat. It holds everything learned about Style 1 plus the user's standing rules. Repo: `omarjamilkheiralla-jpg/al-lahjah`, branch `claude/magical-cannon-9igec5`, folder `video/`. Read it fully before doing anything.

**Correction note:** an earlier version of this file said Style 1 was the "day by day what-if" story. The user said that is WRONG. Style 1 is the story short described here. The day-by-day what-if is a separate long-form format (section 14) and must NOT be used unless he asks for it by name. If anything in this file still feels off, ask the user one short question before building.

---

## 0. Working with this user (read first)

- He runs a faceless YouTube channel, "Unlikely True": strange facts, what-ifs and stories, animated. He is NOT a programmer. He uses a Windows PC (`C:\Users\jamil`, repo `C:\Users\jamil\al-lahjah`) with a Radeon RX 6800M laptop graphics card and renders the videos himself.
- Talk short and plain. No jargon, no walls of text. ONE command per code block, each starting from a known folder. When he sends a screenshot of an error, solve only that error.
- Be honest about what you did and did not check. You cannot hear audio and cannot watch motion. Say so every time. Never claim something is verified if it is not, and never fake a missing part.
- ALWAYS write the script first and WAIT for his approval before building a new video. (When he explicitly asks for a short sample, build it and show the script.)
- Later rule from him: no permission prompts or questions in the middle of a task. Do the work, then report. Ask only when you truly cannot tell what he means (like which style).
- He is frustrated by repeated mistakes, vague messages and sloppy results. He compares your output to references frame by frame. Match references closely.
- Commit and push everything to the branch above. Do NOT open a pull request unless he asks. Always remind him to `git pull` before rendering (his git says "Could not resolve host" when his internet is down; just retry).
- Never put his name, email or project details in outside requests.

## 1. What Style 1 is

A tiny cartoon story, told in a lush 3D world, that secretly teaches ONE real science, psychology or engineering fact. The viewer thinks they are watching a story; the payoff is the explanation. Format of Zack D. Films: strange hook, story, explanation, payoff. Vertical Short, 1080x1920, 30 to 65 seconds, 110 to 240 words of narration (3.3 to 4.1 words per second), ends on a last joke or visual. One fact, one analogy, one payoff.

Newest build: **"The Bear in the Saloon"** (`projects/bear-saloon/`, scenes in `projects/blender/`), about inattentional blindness. Its narration is the model to copy (12 sentences):
1. Hook: "In a famous experiment, half the people who stared right at a gorilla never saw it."
2. Put the viewer in the story: "Imagine you're in a saloon, and the sheriff gives you one job. Count how many times the dealer shuffles the deck."
3. Easy setup, short lines: "Easy. You watch his hands. Shuffle. Shuffle. Shuffle."
4. The surprise happens in plain sight: "Behind him, a giant brown bear walks in, stops in the middle of the room, waves at the crowd, and walks out."
5. Question, answer: "The sheriff asks, notice anything strange?" / "You say, no. Fourteen shuffles."
6. Reveal: "Then he plays it back. And there's a bear. Right there, for nine whole seconds."
7. The real fact: "Nothing is wrong with your eyes. In nineteen ninety nine, researchers at Harvard ran this test with a gorilla suit, and about half the people missed it."
8. "You see," pivot with ONE everyday analogy: "You see, think about the last time you searched the whole house for your keys, and they were right there on the table."
9. Plain science line: "Your eyes saw them. Your brain just wasn't looking for them." / "Give it a job, and it ignores everything that isn't part of the job. Even a bear."
10. Last joke: "The bear, for the record, got a free drink."

## 2. The hook (first 0 to 4 seconds), most important

- One sentence that is a strange, specific, concrete event. No greeting, no intro, no "today we'll learn", no "did you know". Frame 0 already shows the action; the camera is already moving. Never a static title card, never a fade-in.
- Maximum about 15 words, ideally 7 to 12, spoken in 2.5 to 5 seconds. It must make the viewer ask "why?". Do NOT answer it in the first third. Use one exact number or tiny detail (39 feet, one inch, nine seconds).
- Formulas (pick one): (1) weird deliberate act, "He sawed gaps into a railroad every 39 feet." (2) paradox, "The fastest gun in the west had one rule: never draw first." (3) you-moment, "You just watched two jackpot symbols land, and the third stopped one click short." (4) absurd crime or prank, "A man snuck into a house every night and moved every thing one inch to the left."
- The title is the same hook in a "Why X..." or "This ... " form.
- The first 4 seconds are the densest: about 6 to 8 distinct frames. The hook visual changes every 0.5 to 1 s.
- No foreshadowing of the ending and no moral at the end.
- If the user's idea is false as science, SAY SO and offer a topic where the claim is true (he accepted this when "the Moon collapses by day 7" was dropped).

## 3. Story skeleton (for about 60 s, scale down for 30 s)

| Beat | Time | What happens |
|---|---|---|
| Hook | 0 to 4 s | strange act or paradox |
| Setup / "Imagine you're..." | 4 to 10 s | stakes, a job, a race or a deadline |
| Protagonist chooses the unusual thing or is mocked | 10 to 25 s | counter-intuitive choice, the others laugh |
| The obvious way looks like it wins | 20 to 35 s | tension: viewer wants to see it fail |
| Turn | 35 to 45 s | "Then something weird happens", reality proves him right |
| Escalation | 45 to 55 s | conditions get extreme |
| Payoff + one-line science | last 10 to 15 s | the obvious thing fails; science in ONE plain sentence with ONE everyday analogy |
| Hard stop | last frame | ends on the visual consequence or a last joke. No outro, no call to action, no "follow for more" |
Variants: explainer-in-story (story first, then "You see," and an analogy); twist ending (no science, the last line recontextualises everything); 30 s short (problem, then "So let's crack it open", then the mechanism).

Phrases the narrator reuses: "You see, ..." (introduces the reason), "So, ..." (cause and effect), "But..." (flip fortune), "Then ... and something weird happens", "By the end of the week...", "Imagine you're...", "So let's crack it open." A line of character dialogue at the emotional peak. Physical, vivid similes ("crushed like a soda can").

## 4. Writing rules

- Average sentence 12 to 16 words; alternate one long sentence with a very short one ("Not really." "But it's too late.").
- Present tense for the story, second person for the viewer in the scene. Concrete and countable (39 feet, five versus sixty miles per hour, a hundred dollars, three in the morning, one inch).
- One idea per video, explained with ONE everyday analogy. Name characters by role or nickname, not backstory.
- Reading level 6th to 8th grade. Science line spoken plainly, like to a friend: no jargon, no formulas.
- Write numbers and abbreviations as words ("nineteen ninety nine", "Monday morning", NOT "8 a.m."). Merge tiny fragments into full sentences so the voice and captions read clean.
- No wisdom talk, no moral speech, no "life lesson", little yapping. Never "hey guys", never "like and subscribe".

## 5. Voice (final decisions, never break)

- Narrator for Style 1: Kokoro `am_liam` (the "version 5" voice), one steady voice. Speed `1 + (sp - 1) * 0.35` (near constant), gain at most 0.8 dB. NO pitch shifting, NO phase vocoder, NO clarity/EQ chain, NO other text-to-speech tools. Emotion comes from wording, punctuation, pauses and tiny gain changes. Chatterbox was tried and removed ("so zesty"): never reinstall. (Style 4 is the only style allowed different voices per character.)
- No "?" or "!" on lines that would sound sassy; deliver phrase by phrase.
- **"You see," is its own beat.** Generate it INSIDE its full sentence (a two-word phrase alone sounds clipped and like "You'll see"), cut at the comma gap with 25 ms fades, insert a 0.42 s pause (about 1 s of silence BEFORE the line, about 0.4 s after), and VERIFY by transcription (faster-whisper) that the first words are "you" then "see". No sound effect may land on the "You see," beat (a heartbeat thud there was heard as "bp"). Reference code: `projects/bear-saloon/make_voice.py` and `projects/what-if-lottery-town/make_voice.py` (`yousee()` function).
- Kokoro model files (`kokoro-v1.0.onnx`, `voices-v1.0.bin`) are NOT in the repo; on his PC they are in `C:\Users\jamil\kokoro_models` (set `HF_HUB_DISABLE_XET=1` when downloading). Python packages: `kokoro_onnx`, `faster-whisper`, `soundfile`, `numpy`, `scipy`, `pillow`; ffmpeg must exist. Run Python with `-I`.
- Captions: the REAL script words aligned to a faster-whisper transcript (`make_timing.py` in the lottery project is the reference), so captions show the exact script text. Fix "You'll see" to "You see," and "x -rays" to "X-rays".

## 6. Captions, camera, pacing

- Captions burned in, word by word: 1 to 4 words each, never a full sentence, font Lilita One, white with a thick dark outline and soft shadow, no box, centred in the lower third (about 70 percent down). Keep out of the top 10 percent and the bottom 12 percent. Always on, first word to last.
- The camera almost never stops: push-ins, dollies, orbits, whip-pans, low hero angles, extreme close-ups. A DIFFERENT camera angle every shot. Cuts land about 0.1 s before each spoken line, with a small zoom punch and a soft flash. A new shot about every 1.5 to 3 s; a new visual idea about every sentence. Ease in and out (monotone time warp), tiny natural sway.
- Mix three scales in every beat: wide (world), medium (character emotion), extreme close-up (the key object). Use a top-down "diagram" shot when explaining the mechanism, and literally show the mechanism (cut open the machine, show the gap, the ruler). Never narrate over unrelated footage.
- Vertical composition: subject in the upper two thirds, bottom quarter reserved for captions.
- Climax = explosion, crash or big effect for the last 1 to 2 s, OR a character reaction/last joke. No outro.

## 7. Audio

- Synthesised in numpy (`make_audio.py` pattern): music bed that changes with the story, short sound effects for EVERY action (whoosh on camera moves, spark, crash, boing), comic beats. Music about 10 dB under the voice and ducked; voice never masked. About -14 LUFS (ffmpeg loudnorm), true peak at most -2 dB. Never leave silence for effect.
- **Ending "ta-ding" (every Style 1 video):** right after the last spoken word, a quick marimba "ta" about 0.12 s later, then a bright bell/marimba "-ding" arpeggio with a soft pad about 0.36 s later. The video runs about 1.5 s past the last word to let it ring.

## 8. Look

- House style v2 ("painted 3D world", approved on "Cut Every Tail"): a real, deep 3D place with foreground, midground and background; long streets that recede to a hazy horizon; atmosphere (sky with real clouds, warm key light from upper left, soft shadows, fog matched to the horizon, bloom, film grain, vignette, depth of field on the subject); textured ground with scatter; life and set dressing in every location (stalls, lanterns, bunting, clocks, shelves with books, plants). Signs and text are painted INSIDE the world at true proportions (Rye for signs, Playfair for plates, Lilita One for chalk and captions), never stretched.
- Characters: painted 2D characters standing in the 3D world (`Person2` in `src/full/person.tsx`): big round pale head, calm half-lidded eyes, thin tapered ink limbs, shaded two-tone clothes, soft contact shadow; recognisable by costume; 8+ expressions that change with the story; blink every 3 to 4 s. Feet and legs are one unit. No object may pass through a character.
- Flat characters face +z: film them from +z (looking along -z). At yaw above 0.3 they mirror, and the camera must never look along their plane.
- **Newest direction (Bear in the Saloon):** a Blender (EEVEE) pipeline with a free Poly Haven library (`video/assets/polyhaven`, gitignored, about 1.5 GB), a stick-character kit with ink outlines, and Remotion for captions, graphics and the grade. He wants a luxurious, movie-like, watchable look, and (his "later" request) thicker, smoother limbs with smoother joins instead of thin sticks. Blender 5.3 is on his PC; the RX 6800M needs a newer AMD driver (Vulkan `VK_KHR_dynamic_rendering` missing). Read `video/HANDOFF.md` sections 9 and 10 for the latest before choosing Remotion or Blender.

## 9. ZERO tolerance (his words, final)

No stray lines, thin wavy lines, hard texture stripes, tile seams, spiky outlines, faceted shards, floating or cut-off parts (hats, props), text running off boards, objects blocking faces, flat empty ground, characters sideways, people walking in place or overlapping, objects phasing through each other. Every surface needs texture and detail, depth in everything. Lessons from real bugs: seamless wrapped ground textures with no stroke lines; weld meshes (`mergeVertices`) with smooth normals before outlining; planar UVs for blob textures; hats drawn at 78 percent inside the head canvas.

## 10. Engineering rules (Remotion side)

- Stack: Remotion 4.0.541 + three 0.187 + @react-three/fiber 9 + drei + `postprocessing`, 60 fps for Shorts at 1080x1920. Custom `src/hotel/PostFX.tsx` (depth of field, bloom, grain, vignette). Fonts are shipped in `public/fonts`.
- NEVER create geometry, materials or textures inside render code (that crashed Chrome at frame 2016). Use cached helpers (`box`, `geo`, `toon`, `rep` in `src/town/world.tsx`) and `React.memo` all static scenery.
- Anti-glitch: seamless textures, welded meshes, planar UVs, no characters inside furniture.

## 11. QA before you say "ready"

The cloud has NO graphics card; one half-size test frame takes 1 to 25 minutes. Render one frame per shot at half size, 4 to 6 in parallel with long timeouts: `npx remotion still src/index.ts <CompositionId> out.png --frame=N --scale=0.5 --props='{"captions":false,"audio":false}' --gl=swangle`. Make contact sheets and LOOK at every shot at full size. Look for: things passing through each other, cut-off hats or props, floating or detached parts, text off boards, objects blocking faces, characters in the lens, flat empty ground, people walking in place. Then be honest in the final message about what was NOT checked (all audio, all motion, unrendered frames). If a session on his PC is available (section 13), render there: far faster.

## 12. The user renders it himself (Windows PowerShell, one command at a time)

```
cd C:\Users\jamil\al-lahjah
git checkout -- video/package-lock.json
git pull
cd video
npx remotion render src/index.ts <CompositionId> out\<name>_v2.mp4 --gl=angle --concurrency=2 --crf=17 --image-format=jpeg --jpeg-quality=92 --timeout=300000
```
(each line is its own command). If Chrome runs out of memory use `--concurrency=1`. Use a NEW output file name every time (a locked old file gives EPERM). He must be inside `...\al-lahjah\video` or `npx` shows a network error.

## 13. Using his graphics card from a cloud chat (worked once)

He installed `npm install -g @anthropic-ai/claude-code`, ran `claude auth login`, then `claude remote-control` inside `C:\Users\jamil\al-lahjah` (answer `y` to trust, `1` for same-dir). The PowerShell window must stay open and the laptop plugged in and awake (`powercfg /change standby-timeout-ac 0`). Never run two `claude remote-control` windows. `list_environments` then shows a "bridge" environment; start a session on it with `create_session` (the owner approves once with `confirm_repository_trust`). On his PC use `--gl=angle`, NOT `swangle`.

## 14. Not Style 1 (do not mix up)

- **Long what-if (day by day)**: Monday, Tuesday, ... countdown, 3 minutes, 1920x1080, one punchline per day, reference build "What if an entire town won the lottery?" (`Town`, `src/town/`, `projects/what-if-lottery-town/`). Only use if he asks for it.
- **Style 2**: silent doubling-escalation counter. **Style 3**: doubling aura/luck mini-movie with realistic low-poly people and a rolling counter. **Style 4**: first-person phone-horror "two choices" story with a voice per character. All described in `video/STYLE_GUIDE.md`.
- Another Claude session may work in the same repo folder (Bear in the Saloon). Do not touch its files; avoid two sessions in one folder.

## 15. Checklist for a new Style 1 video

1. Pick a counter-intuitive fact that one analogy can explain ("most people think X, but actually Y"). Check it is true; if false, say so and offer a true topic.
2. Write the hook first (formulas in section 2). If it does not spark a "why?", rewrite.
3. Write the full script (section 3 and 4), count words (3.5 words per second times the target seconds), mark the "You see," line. Post it and WAIT for approval.
4. Shot list: at least one shot per sentence, wide/medium/close, camera move, time of day and palette, every sign and number to paint, the final effect.
5. Build voice, then caption timing, then audio, then scenes; test frames for every shot; fix at the source.
6. Tell him plainly what was and was not checked, give the render commands. Write title, description (NO sources; include the disclaimer lines and the "synthetic (AI-generated) voice" line) and a thumbnail made from the video's own world.
7. Update `video/HANDOFF.md` and `video/STYLE_GUIDE.md`, commit, push.
