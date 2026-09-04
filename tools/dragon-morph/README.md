# Dragon morph pipeline (v2.8 art)

Every growth step in the game shows a **new painted frame**: egg → 3 crack frames → hatchling →
16 more growth frames → adult, plus a mouth-open twin for every dragon frame. Nothing is rescaled
in the app; the pipeline exports all frames from ONE shared canvas crop so a crossfade between
neighbours reads as the dragon actually growing.

Brief (9/3): realistic, serious-looking dragons (not cute-and-cartoony); a little softness in the
hatchling that drains away with age; the existing eggs stay (she likes them).

## Why this design
| v2.7 problem | v2.8 answer |
|---|---|
| Wings sliced flat at the image edge | 1216×832 landscape canvas + a **fit gate**: any keyframe whose alpha touches within 2 % of an edge is rerolled (new seed) |
| 4 stills scaled up between stages | 17 growth frames, each a real diffusion pass, on a fixed floor line |
| Chained img2img drifts (colour, eyes) | No chaining. Each in-between depends only on its two bracketing keyframes: latent blend init + ConditioningAverage prompt + IPAdapter identity weighted the same way, one seed for all |
| Open-mouth twin needs a union crop | Inpaint only the mouth box that Florence-2 locates → pixel-registered with the closed frame |
| Nobody checked the frames | `vet` stage measures every frame and writes a contact sheet + reroll list; Claude reviews the sheet before export |

## The automated flow (all six dragons, Claude vets before anyone sees pictures)
```
cd "F:\Software Builds\math-facts\tools\dragon-morph"
set PY="F:\Software Builds\ComfyUI_Windows_portable\python_standalone\python.exe"
%PY% morph.py --stage probe                 REM once, ~2 min: proves the morph pass on the OLD whelp/drake
                                            REM   sprites; tune --denoise / --init / --ipa from probe\contact.png
%PY% run.py --dragons all                   REM unattended: starts ComfyUI if needed, runs every stage per
                                            REM   dragon, rerolls what vet flags (3 rounds), restarts the studio
                                            REM   after a crash, writes work\<dragon>\review\packet.md
REM  -> Claude reads each packet (contact sheets + report), decides approve / reroll / redo keys
%PY% run.py --approve ember                 REM ONLY then: export into src\assets\art\morph\ember
```
Budget: roughly 15 GPU minutes per dragon on the photoreal tier, so about 90 minutes for all six plus
rerolls. `run.py` passes the tuned `--denoise/--init/--ipa` through to every stage.

Manual stage-by-stage is still there (`morph.py --stage keys|plates|eggs|morph|chomp|vet|export`, with
`--resume`, `--only i,j`, `--seed-bump n`), and `--dry-run --validate` runs every stage without the server
(writes the graphs under `work/<dragon>/dry/` and checks every node class against the installed sources).
`morph.py --dragon frost --show-prompts` prints a dragon's four stage prompts and its negative.

## Claude's review checklist (per packet, in this order)
1. `keys/contact.png`: one identity across hatch → adult; realistic and serious (softness only in the
   hatchling); every frame's whole body inside the canvas; the right element (no fire on Frost).
2. `vet/contact.png`: read left to right like a flip-book. Each step grows a LITTLE. No frame looks like a
   different dragon, none shrinks, feet stay on one line, no blue-eye or colour drift. Flags under each frame.
3. `vet/pairs.png`: in every pair the mouth is open in the second and nothing else moved.
4. `vet/eggs.png`: cracks escalate 0 → 3, the egg keeps the look she likes, the hatchling stands where the egg was.
5. `viewer-morph.html`: play it. If it reads as one creature growing, approve.
Verdicts: approve → `run.py --approve <dragon>` · a few bad frames → `morph.py --stage morph --only i,j
--seed-bump n`, then `--stage chomp --only i,j`, then `--stage vet` · wrong identity → delete
`work/<dragon>/keys` and re-run `run.py --dragons <dragon>`.

## Knobs
- `--tier photoreal` (Juggernaut XL, realistic, ~14 s/frame) is the default; `daily` (DreamShaper Turbo, ~10 s) is the stylised fallback.
- `--denoise` morph pass (0.5): lower keeps the blend's ghosting, higher lets the frame wander from its neighbours.
- `--init latent|pixel`: LatentBlend of the two plates vs. a pixel crossfade encoded once. Try both in `probe`.
- `--ipa` identity weight split across the two keyframes (0.45).
- Canvas constants in `morph.py`: `W,H`, `FLOOR`, `H_HATCH..H_ADULT` (subject height 38 % → 95 %), `KEY_M`.

## Vet flags → what to do
`edge` reroll keyframe · `floor`/`centre` the morph pass moved the body: raise `--ipa`, lower `--denoise` ·
`growth` a frame shrank: reroll it · `jump` outlier vs neighbours: reroll · `colour`/`blueeye` identity drift:
reroll with `--seed-bump`, add the colour to `--neg` · `mouth:unchanged` raise `--open-denoise` (0.8) ·
`mouth:leak` the inpaint changed pixels outside the box: lower `grow`/denoise · `caption:*` look at it.

## App side (already wired, inert until export runs)
`src/assets/art/morph/ember/index.js` is a placeholder (`null`). Once exported it becomes the manifest
`{ aspect, width, height, frames:[{p, kind, closed, open, mouth:{x,y}}] }` and `DragonSprite` switches to
`MorphSprite`: fixed-aspect box (never clipped, width-capped by the column), crossfade between frames,
a 3.5 % pulse on each advance, the mouth marker per frame, egg wobble/dragon breathe kept.

## Stack notes
Nothing new is required for the first run. Two optional upgrades if the probe shows weakness:
1. **RIFE/FILM frame interpolation** (node installed, no weights) as an alternative in-between init —
   handles big shape changes better than a latent blend. ~100 MB, MIT/Apache.
2. **An SDXL LoRA of Ember** trained on the 4 vetted keyframes — the strongest identity lock if IPAdapter
   still lets colour/eyes wander. Training on the Arc is a separate afternoon.
Plan B for shape control: ControlNet (union-promax, installed) driven by the procedural `DragonSVG`
silhouette at each maturity — continuous geometry, painted by diffusion.
