# Chicago hotel: 5-second hook sample

**Narration (15 words, ~4.5 s at the rulebook pace):**
"A Chicago hotel was lifted six feet into the air with every guest still inside."

**Facts used:** the Tremont House in Chicago was raised about six feet with guests still inside it.
**Left out on purpose:** the year. Sources disagree (1857/58, 1859 and 1861 all appear), so it is not shown or spoken until verified.

## Camera plan (one continuous move, ease in/out, no cuts)
| Time | Words | Camera | What it shows |
|---|---|---|---|
| 0.0 s | "A Chicago hotel" | wide, low, slow push | hotel, crew on the jackscrews, blurred planks/barrels in the foreground |
| 1.15 s | "was lifted" | push in to the jacks | cranks turning, timber cribs being stacked |
| 2.0 s | "six feet" | pull back + rise | measuring pole, "6 FT" board pops in on the word |
| 3.86 s | "guest" | crane up the facade | the hotel clearly raised, awning high above the street |
| 5.0 s | "inside." | close, rests | sleeping guest in the top window |

Depth in every shot: blurred foreground (planks, barrels, crates), sharp mid-ground (crew, rig), softly blurred background (neighbours, skyline).

## Files
- `src/hotel/kit.tsx`: painted textures, 3-band toon material, constant-width ink outlines (#351f22)
- `src/hotel/chars.tsx`: flat 2D characters with wobbly ink bands, blinking, cranking, sleeping guest
- `src/hotel/scene.tsx`: hotel, jackscrew rig, street, props, lights
- `src/hotel/PostFX.tsx`: depth of field + vignette
- `src/hotel/HotelHook.tsx`: camera path, captions, timing (edit `WORDS` once the real voice-over exists)

## Not done yet
- No voice-over or sound effects (silent sample). Timing of words is estimated at 3.35 words/s.
- Checked on stills and a half-resolution preview only. Full 1080x1920 render is for your PC (`render_hook.bat`).
