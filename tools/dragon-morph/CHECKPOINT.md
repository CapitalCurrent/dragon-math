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

## STATE (2026-09-04, night)
- Phase: **BUILT, NOT YET RUN.** No generation has happened; the GPU is under the hub's timing hold.
- Code: `morph.py` (pipeline, 6 dragons), `vet.py`, `export.py`, `run.py` (unattended runner + review
  gate), app side `DragonSprite.js` MorphSprite + placeholder manifests under `src/assets/art/morph/*`.
  All dry-run + node-validated; JS parses. **Not yet exercised against a live ComfyUI.**
- Knobs: defaults (photoreal tier, denoise 0.5, latent init, ipa 0.45) — untuned until the probe runs.
- Next: (1) hub says done → `morph.py --stage probe` → look at `work/ember/probe/contact.png`, pick
  knobs, run `run.py --denoise X --init Y --ipa Z --dragons ember` (settings persist) → review packet →
  approve → then `--dragons all`. (2) Light app check of the MorphSprite once a manifest exists
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
