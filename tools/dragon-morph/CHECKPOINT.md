# Dragon morph — SESSION CHECKPOINT (read this first in a new session)

**Boot line for a fresh Claude session** (paste it):
> Resume the Dragon Math morph art work. Read `F:\Software Builds\math-facts\tools\dragon-morph\CHECKPOINT.md`
> then `README.md` in the same folder, run `run.py --status`, and continue from the STATE block.
> The inventory app's hub session may be running on :3000/:3100 with its GPU/CPU timing hold — ask before
> any generation; never touch the inventory repo, its memory folder, or its webpack cache.

Claude updates the STATE block and appends to the LOG at every milestone (and commits the math-facts
repo, never the inventory repo). The pipeline's own checkpoints are `work/checkpoint.json`
(dragon + stage the runner was in), `work/settings.json` (tuned knobs), and each
`work/<dragon>/review/status.json`; re-running `run.py --dragons all` resumes from the files on disk.

## STATE (2026-09-05 ~02:45, LIVE RUN IN PROGRESS - ember)
- Hub cleared the GPU 9/5 ~02:15 (holds: 3100 free, never kill others' node/chrome, no inventory repo/memory).
- Runner: detached python (`work/runner.pid`), log `work/ember-run.out`; relaunch =
  `Start-Process python run.py --dragons ember [--stop-after keys]` from PowerShell (a Bash background
  call is capped at 10 min and kills it).
- SWEEP DONE: winner denoise 0.55 · latent · ipa 0.5 (score 1.81), persisted in `work/settings.json`.
- KEYS: adult/drake/hatch APPROVED by Claude (seed 4100, all fit first try, all face LEFT in side view;
  export mirrors via the chomp-stage facing vote). WHELP rejected (giant head sail-fin) → rerolling
  whelp only with `--seed-bump 1` + head-fin negatives. Next: `run.py --dragons ember` resumes past keys
  → eggs → morph → chomp → vet → packet → Claude review → `--approve ember`.
- LIVE LESSONS (already coded): (1) the de-age img2img chain is DEAD on Juggernaut (2nd pass posterizes,
  composition lock) → every key is its own txt2img at the shared seed; (2) THE SAME-SIZE RULE: both
  bracketing keys are placed at the frame's own height before blending, else the bigger one ghosts;
  (3) negatives now exclude jewelry/pendant/harness (seed 4100 hung a pendant off the adult's chin);
  (4) BiRefNet lift onto the cave is clean (8.7% soft edge = the fire glow) → vet `fringe` flag at 18%.
- **RYAN'S REDESIGN (9/5 ~02:45): TWO ANCHORS ONLY.** Four independent keys read as four different
  animals. Now: adult txt2img (seed 4100) + newborn txt2img WITH the adult as IPAdapter reference
  (weight 0.45, start_at 0.3 so it doesn't copy the wingspan and crop) → run.py `subdivide`: the
  midpoint frame is morphed (best of 3 seeds by ghost score) and promoted to a key, then the quarter
  points, then the rest. Denoise rises toward a segment's middle (`--mid-boost` 0.15 → 0.70 at f=0.5)
  because a 50/50 blend of unlike silhouettes ghosted at 0.55. Both anchors APPROVED by Claude.
- **ORIENTATION RULE (Ryan 9/5 10:17):** dragons must make sense with the game interface on every
  format: the dragon sits LEFT, questions come from the cave mouth RIGHT → every exported set faces
  RIGHT (export mirrors left-facing sets + flips mouth anchors); the app is landscape-only; the wide
  canvas scales by column width on landscape phones - verify on a real phone after the first export.
- Ryan's standing asks tonight: only Ember (dragon + egg) tonight, he judges in the morning; keep
  Claude usage low (one contact-sheet review, not per-frame reads); every feature must develop
  as one feature (horn families, snout, eyes, tail, legs, ridges in the templates); newborn frail and
  ~1/10 the adult's area (H_HATCH 0.30).
- GPU WEDGE (03:24, again 03:34): the studio kept answering HTTP while one prompt sat "running" → morph.py
  has its own loud `generate()` (150 s timeout → SystemExit → the runner restarts the studio) and a
  `/free` flush after every frame.
- **THE SUICIDE BUG (03:34 → found 08:56):** Restart-ComfyUI.bat kills EVERY process on the studio's
  portable python - the runner runs on it too, so the runner killed itself on its first restart and sat
  dead 5 h while the monitor watched for log lines (silence looked like progress). Fixes: run.py restarts
  the studio by stopping ONLY the `ComfyUI\main.py` process by PID; a STALL WATCHDOG monitor reports
  when the log is quiet > 8 min or the runner PID is gone. **Protocol: never call Restart-ComfyUI.bat
  while a runner is alive; always pair a run with the stall watchdog.**
- **10:10 REALISTIC EMBER SET COMPLETE + CLAUDE-APPROVED → archived at `work/ember-realistic/`
  (packet: review/packet.md; viewer: viewer-morph.html with chomp toggle). Mouth localizer is now
  Florence "eye" grounding (tight on 0-12) → mouth in front of/below the eye; adult preset fallback
  (MOUTH_PRESET) where the eye is lost on the big frames. NOT exported to the app yet (Ryan judges).
  Graphic-novel batch launched 10:11 into a fresh `work/ember/` (eggs copied over).**
- **10:50 GRAPHIC-NOVEL EMBER SET COMPLETE → `work/ember-graphic-novel/` (DreamShaper tier; Ryan:
  "this series looks great"). Lessons: Juggernaut ignores style tokens (gn must run on `--tier daily`);
  DreamShaper draws big frames with open jaws → `chomp --swap-closed` (base = open twin, inpaint a
  closed frame); eye grounding fails on the biggest frames → `--mouth-frac` manual box; vet hue is now
  a circular mean; floor/growth tolerances 0.035/0.04; H_ADULT 0.93. Eggs: Iona likes the realistic
  eggs → every style set reuses the same egg frames (copied), never restyled. Next: painterly batch
  with `--adult-ref src/assets/art/ember-adult2.webp --tier daily`; then `blink` stage on all three
  sets (built, app idle life built: blink twin, sway, glow pulse, stretch); then Ryan judges.**
- **11:30 PAINTERLY batch (`work/ember-painterly/`, `--variant painterly --adult-ref ember-adult2.webp
  --tier daily`) REBUILDING after its adult anchor came out facing RIGHT (newborn faces left) → adult
  key mirrored before the tree (same fix as gn). Lessons: style sets get their own work folder via
  `--variant`; vet blueeye now checks ONLY the located eye box (Ember's navy chest false-flagged every
  frame); the painterly adult-ref drifted the body to silver-lilac scales with orange wings (Iona's
  original is orange-red) - flag for Ryan's judgment. After it: `blink` on all three sets, viewers,
  report. Ryan's rule 11:20: flipping a whole set is fine (export does it); a mid-sequence head turn
  must be fixed at the anchor.**
- **11:55 ALL THREE EMBER SETS COMPLETE + Claude-reviewed, none exported (Ryan judges):
  `work/ember-realistic/` (Juggernaut) · `work/ember-graphic-novel/` (DreamShaper; = `work/ember/`
  too) · `work/ember-painterly/` (DreamShaper + original adult as reference, adult anchor mirrored).
  Each has vet/contact.png, vet/pairs.png, vet/eggs.png, viewer-morph.html (chomp toggle).
  Blink passes running as a detached chain (`work/blink.out`). Then: Ryan's verdict → `run.py
  --approve ember --variant <v> --style <s>` exports that set to `src/assets/art/morph/ember/<style>/`
  → app check on a phone (orientation: export mirrors to face right) → the other five dragons.**
- **12:50 EGG REDESIGN (Ryan): frame 0 = COOLED LAVA CRUST skinned over magma (img2img of her egg at
  EGG_CRUST_DENOISE 0.65, egg seed 4242, generated at EGG_GEN_H 0.80 then placed at H_EGG); SIX crack
  steps = two per answer (EGG_P has 7 entries), the crack GEOMETRY is DRAWN (`draw_crack`: jagged path
  extends/widens per step, branches, magma-gradient wedge from step 5) and only BLENDED by the model
  inside its own mask (EGG_BLEND_DENOISE ~0.5; 0.62 erased it, 0.45 looked drawn); burst prompt asks for
  a glimpse of scales + a closed eye; brightness ramp per step. Test set: `work/ember-eggtest/eggs/`.
  Eggs are style-independent → copy the approved eggs into all three sets before export.**
- **APP (built, parses): art-style picker on the select screen (`src/utils/artStyle.js`, localStorage,
  shown only when ≥2 styles exported), `morphSetFor(dragon)` picks the style's manifest under
  `src/assets/art/morph/ember/<style>/`; egg RUMBLE on each answer stepping through two crack frames;
  blink twins + idle life. Blink passes DONE for all three sets (17/17/17). NEXT: approve eggs →
  copy into sets → export ×3 → phone check → bump version + deploy so Iona can pick styles.**
- **12:40 DEPLOYED v2.8.0 (gh-pages "Published"): all three Ember style sets exported
  (`src/assets/art/morph/ember/{realistic,graphic-novel,painterly}/`, ~4 MB each, mirrored to face
  right, mouth + blink twins, crust-egg portrait) + the select-screen ART STYLE picker + egg rumble.
  Iona tests in the live app. NEXT (Ryan's asks): per-dragon custom CAVE (Ember first: lava cave, nest
  ledge on the left third at the floor line, mouth on the right - same layout contract as cave-bg);
  then his verdict on the styles; then the other five dragons.**
- **12:55 EMBER CAVE approved (seed 4014, daily tier, 1344×768; prompt in `work/cave-ember/`):
  warm ember glow on the left ledge, open floor, moonlit mouth right. LAYOUT CONTRACT for every
  dragon's cave: nest ledge left third at floor y≈0.86, x≈0.30; wingspan headroom; mouth/light on the
  right; no lava/water under the nest. Exported `src/assets/art/cave-ember.webp`; per-dragon cave map
  in GameScreen's CaveBackground with cave-bg fallback. Other five caves: same recipe, one batch.**
- **16:10 v2.8.3 DEPLOYED. LTX-VIDEO IS IN THE STACK** (`ltx.py`; checkpoint ltxv-2b-0.9.8-distilled +
  the T5 GGUF via CLIPLoaderGGUF type ltxv; 6-16 s per 33-49-frame clip on the Arc; OpenRAIL-M). Proven:
  egg transitions between our states with first+last-frame guidance (`eggltx.py` → 37 egg frames,
  EGG_P has 37 entries, 12 per rumble, ONE fixed transform so the egg never rescales); subtle idle
  breathing clips (33 frames, cutouts clean); powers = EFFECT-ONLY extraction (clip on black, lift what
  brightened in front of the mouth, screen-blend over our still frame + open-mouth twin; chroma green
  spilled into the fire and the clip's dragon drifts, so never show the clip's dragon). Big motion
  smears the 2B distilled model: keep clips short/subtle. Powers rule (Ryan): auto-perform at unlock,
  one tap replay each, no recharge; retire the skill bar.
  NEXT: realistic rebuild (5th leg inpaint on the realistic adult; newborn with wing nubs; blink only
  where the eye is found - coded) → idle loops per growth frame (8-frame ping-pong from LTX) → powers.**
- **16:52 v2.8.4 DEPLOYED: realistic set REBUILT (adult 5th leg inpainted, newborn 4101 mirrored with
  wings, blink only where the eye is located, frames 3/4 rerolled for a pale tail tip). All three
  sets carry the LTX egg (37 frames) + remnants. NOW: step 3 idle loops (`idle.py` → idle/ frames →
  export `idle: [...]` per frame → app plays them back and forth at rest, replacing the fake breathing);
  test on comic 0/8/16 first, then all 51. THEN step 4 powers (effect-only LTX clips on black, mouth-
  anchored feathered mask, screen blend; auto-perform at unlock + one tap replay; retire SkillBar).**
- **17:10 idle chain running detached (`work/idle.out`, 3 sets × 17 LTX clips → idle/ frames; export
  writes `idle: [...]`; app plays back and forth at 190 ms). `powers.py` written (effect-only clips on
  black, mouth-gated extraction, direction left on canvas → mirrored at export; export writes
  `powers: {name: {unlock, frame, fx: [...]}}`). App powers system being wired: PLAY_POWER /
  CLEAR_ACTIVE_POWER in GameContext, PowerBar replaces SkillBar for morph sets (auto-perform at
  unlock, one replay each), MorphSprite plays fx frames anchored by the mouth delta. Power ids by
  unlock order: spark, puff, breath, shield, blast (map from dragons.js skills[0..4]).**
- **18:30 idle frames DONE for all 3 sets (51 clips; the slowness was rembg reloading its model per
  call → cached session in `rembg_rgba`, 25 s/frame now). Export chain (comic + painterly + deploy
  v2.8.5 + commit) running detached (`work/export.out`); realistic already exported with idle.
  Powers chain for the comic set running detached (`work/powers.out` → work/ember-graphic-novel/powers/).
  App powers system is coded (PLAY_POWER/CLEAR_ACTIVE_POWER, PowerBar, MorphSprite fx playback,
  GameScreen auto-perform at unlock) and inert until a set's manifest has `powers`.
  NEXT: review the 5 comic effect strips → export comic with powers → deploy → Iona tests powers.
  Export webp method is 4 now (method 6 blew the 10-min cap with 136 idle files per set).**
- **19:05 v2.8.5 LIVE (idle life in all 3 sets; badge still says 2.8.4 - bumped in package.json for the
  next deploy). Powers v2 (`powers.py`): works in EXPORT space on the right-facing exported frames,
  effect gated to the RIGHT of the mouth, two seeds per power (higher effect energy wins), shield
  excludes the dragon's own silhouette, and a MEASURED placement check writes `flags` into meta.json
  (effect centre must be in front of the mouth; overlap with the body < 35 % / 25 % for the shield).
  Ryan 19:00: "are you catching these without my feedback?" - honest answer: measurable yes, judgment
  no (5 legs ×2, shield on the head). README checklist now demands explicit answers: legs = 4, wings = 2
  on the shoulders, features attached, effect at the mouth and off the body. Chain running:
  `work/powers.out` → then regenerate shield (delete powers/shield first) → strip → export comic
  (powers) → deploy → commit.**
- **19:30 POWERS for the comic set: spark / puff / breath / blast = LTX effect layers in export space
  (edge-feathered so no clip border shows; overlap check ignores a disc around the mouth); SHIELD =
  app-drawn aura (LTX put a fireball behind the head twice - dropped). Export+deploy chain running
  (`work/export.out`) → v2.8.5 with powers live for Comic. Realistic/painterly powers: run
  `powers.py --variant <v> --style <v>` (needs the set exported first), then approve/export.**
- 09:45 status (superseded): realistic Ember growth frames VET-CLEAN and reviewed by Claude (0-16 one creature;
  weakest step 11→12 = pose turn 3/4→profile from the anchors' poses). Eggs good. Mouth twins being
  REGENERATED: Florence "dragon head" grounding returned the WHOLE BODY on every frame → the inpaint
  repainted the lower body (dark second dragon on 12-16) → head box now validated (>50% body width =
  rejected) with a front-third fallback (default left). Then: packet → archive `work/ember` →
  `work/ember-realistic` → graphic-novel batch (`run.py --dragons ember --style graphic-novel`, copy
  the eggs dir over first) → painterly batch with `--adult-ref src/assets/art/ember-adult2.webp
  --tier daily`. Ryan judges all three; then maybe a settings option per style (export already writes
  `morph/<dragon>/<style>/`).**
- Morning fixes (all coded): studio launched by run.py itself (`launch_comfy`, keeps the studio's
  `--disable-smart-memory` - resident models overflow 12 GB and crawl at 20 s/step - plus
  `--disable-auto-launch`); DEVICE_LOST detected from the studio log within seconds; `/free` flush
  REMOVED (it forced reloads = more device losses); CHUNK=3 frames per studio session; vet distance is
  now per-subject-pixel (raw canvas diff grows with size and flagged every big frame); egg jump ratio
  3.0; mouth-leak check ignores the 32 px registration band; `fixopen` stage re-registers twins;
  promote() float tolerance; wings-rooted-at-shoulders + no head fins in prompts (Ryan 09:10).
- Phase before this run: BUILT under the hub's hold (9/4 night), checkpoints 1-4.
- Code: `morph.py` (pipeline, 6 dragons), `vet.py`, `export.py`, `run.py` (unattended runner + review
  gate), app side `DragonSprite.js` MorphSprite + placeholder manifests under `src/assets/art/morph/*`.
  All dry-run + node-validated; JS parses. **Not yet exercised against a live ComfyUI.**
- Knobs: defaults (photoreal tier, denoise 0.5, latent init, ipa 0.45) — untuned until the probe runs.
- Next: (1) hub says done → `run.py --sweep --dragons ember` (the sweep auto-tunes the knobs on an
  8-combo grid and persists the winner; then ember end-to-end with auto reroll + keyframe promotion)
  → Claude reads `work/ember/review/packet.md` sheets → `run.py --approve ember` → `run.py --dragons all`.
  The manual probe (`morph.py --stage probe`) remains for eyeballing a single combo. (2) Light app check of the MorphSprite once a manifest exists
  (dev server on a port ≥ 3200 only). (3) Version bump + deploy is a later, separate step.
- Brief (Ryan, 9/3): realistic, serious dragons; softness only in the hatchling; the eggs stay as they
  are; every frame a new generation; Claude vets before Ryan sees pictures.
- **THE GRADUAL LAW (Ryan, 9/5): no sudden change of the egg or the dragon anywhere except the hatch
  itself; every change gradual and organic.** Enforced by: chained low-denoise crack frames (the crack
  pattern is inherited and grows), vet `jump` (1.8× median step) + `detour` flags on growth AND egg
  steps, and in the app a 0.6 s crossfade with a 2 % swell per advance; the hatch alone gets the pop.
- **CRACK PERSISTENCE (Ryan, 9/5): a crack can never vanish or move.** By construction: crack frames
  1-3 are INPAINTS of the previous frame whose paintable region is the existing crack (diff vs the
  intact frame 0) grown by 44/70 px, clipped to the egg; the first crack is seeded in a fixed
  upper-shell patch. Outside the mask every pixel is byte-identical. Vet: `crack:lost` if < 85 % of
  frame i's crack pixels survive in i+1, `crack:nogrowth` if the area doesn't grow ≥ 5 %. Mask logic
  and the metric were proven offline on synthetic cracks (100 % kept / moved crack → 0 % kept).
- Open risks to watch on the first live run: LatentBlend ghosting at mid-f (raise denoise or switch to
  pixel init); the hybrid hatchling graph once crashed the XPU (runner restarts and resumes);
  Florence "dragon head" grounding may return the whole body (fallback = alpha top third);
  rembg on Shadow's smoke edges may trip the `edge` flag.

## LOG
- 2026-09-04 night — design + full build under the hub's hold (no GPU/CPU-heavy work). Checkpoint 1 committed.
- 2026-09-05 — the gradual law folded in (chained cracks, jump/detour vet, slow crossfade + hatch pop). Checkpoint 2.
- 2026-09-05 — crack persistence by construction (masked inpaint growth) + vet metric, proven offline. Checkpoint 3.
- 2026-09-05 — the fix ladder automated: `sweep` stage (auto-tune, writes settings), `promote` stage +
  runner's segment rule (2+ flags in a keyframe gap → promote the clean middle frame, re-morph the halves
  before any seed reroll). Promote/candidate logic proven offline on fake frames. Checkpoint 4.
