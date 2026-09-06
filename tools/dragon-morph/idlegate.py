"""The idle gate (9/6): idle frames come from LTX clips and can DRIFT the head -> a doubled dragon during the
breathing ping-pong (Ryan's realistic hatchling screenshot). Every idle frame is measured against its closed
frame over the whole dragon; > IDLE_MAX changed = drift, dropped; survivors are renumbered so export's
consecutive scan still works. Fewer than 2 survivors = no idle life on that frame (still beats a ghost)."""
import os, sys, shutil, types
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
import morph as M

IDLE_MAX = 0.08

def change(closed, twin, head):
    """DRIFT, not colour: LTX re-encodes every pixel (a raw diff flags 50-70% of the dragon on a calm frame),
    so the measure is how much the SILHOUETTE moved inside the head box: 1 - IoU of the alpha there."""
    C = np.asarray(closed)[:, :, 3] > 64; O = np.asarray(twin)[:, :, 3] > 64
    if head:
        x0, y0, x1, y1 = [int(v) for v in head]; pad = int(0.3 * max(x1 - x0, y1 - y0))
        C = C[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]; O = O[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad]
    inter = float((C & O).sum()); union = float((C | O).sum())
    return 1 - inter / max(1, union)


for st in sys.argv[1].split(","):
    pl = M.Pipeline(types.SimpleNamespace(dragon="ember", seed_bump=0, neg="", only=[], resume=True, dry_run=False, style=st, variant=st))
    prev = pl.p("idle", "prev"); os.makedirs(prev, exist_ok=True)
    mouths = M.load_json(pl.p("chomp", "mouth.json"), {})
    ledger = {}; dropped = 0; total = 0
    for i in range(len(M.GROWTH_P)):
        fid = f"f{i:02d}"
        # restore from prev first so the gate is re-runnable
        for f in os.listdir(prev):
            if f.startswith(fid + "_"): shutil.copyfile(os.path.join(prev, f), pl.p("idle", f))
        names = []
        k = 0
        while os.path.exists(pl.p("idle", f"{fid}_{k}_rgba.png")):
            names.append(f"{fid}_{k}_rgba.png"); k += 1
        if not names: continue
        closed = Image.open(pl.p("morph", f"{fid}_rgba.png")).convert("RGBA")
        keep = []
        for nm in names:
            total += 1
            c = change(closed, Image.open(pl.p("idle", nm)).convert("RGBA"), mouths.get(fid[1:], {}).get("head"))
            ledger[nm] = round(c, 4)
            if c <= IDLE_MAX: keep.append(nm)
            else: dropped += 1
            if not os.path.exists(os.path.join(prev, nm)): shutil.copyfile(pl.p("idle", nm), os.path.join(prev, nm))
        for nm in names: os.remove(pl.p("idle", nm))
        if len(keep) >= 2:
            for j, nm in enumerate(keep): shutil.copyfile(os.path.join(prev, nm), pl.p("idle", f"{fid}_{j}_rgba.png"))
    M.save_json(pl.p("idle", "idlegate.json"), ledger)
    worst = sorted(ledger.items(), key=lambda kv: -kv[1])[:3]
    print(f"{st}: {total} idle frames, {dropped} dropped for drift; worst {worst}")
