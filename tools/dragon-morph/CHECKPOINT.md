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
- Open risks to watch on the first live run: LatentBlend ghosting at mid-f (raise denoise or switch to
  pixel init); the hybrid hatchling graph once crashed the XPU (runner restarts and resumes);
  Florence "dragon head" grounding may return the whole body (fallback = alpha top third);
  rembg on Shadow's smoke edges may trip the `edge` flag.

## LOG
- 2026-09-04 night — design + full build under the hub's hold (no GPU/CPU-heavy work). Checkpoint 1 committed.
