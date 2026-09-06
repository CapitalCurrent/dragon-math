"""The ghost gate (Ryan 9/6: "did you check the whole series?"): every open/blink twin is measured against
its closed frame; a twin that changes > 3% of the dragon OUTSIDE its box is a second head, and the
closed frame stands in for it (no glitch beats a wrong twin). Runs over every style, prints the ledger."""
import os, sys, json, shutil, types
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
import morph as M
from jawfix import jaw_box

MAX_OUT = 0.03

def outside_change(closed, twin, box, pad=14):
    C = np.asarray(closed).astype(float); O = np.asarray(twin).astype(float)
    al = (C[:, :, 3] > 32) | (O[:, :, 3] > 32)
    d = (np.abs(C[:, :, :3] - O[:, :, :3]).mean(axis=2) > 28) & al
    b = np.zeros_like(al)
    if box:
        x0, y0, x1, y1 = [int(v) for v in box]; b[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad] = True
    return float((d & ~b).sum() / max(1, al.sum()))

for st in sys.argv[1].split(","):
    pl = M.Pipeline(types.SimpleNamespace(dragon="ember", seed_bump=0, neg="", only=[], resume=True, dry_run=False, style=st, variant=st))
    mouths = M.load_json(pl.p("chomp", "mouth.json"), {})
    for f in os.listdir(pl.p("chomp")):
        if "_openprev_" in f: shutil.copyfile(pl.p("chomp", f), pl.p("chomp", f.replace("_openprev_", "_open_")))
    for f in os.listdir(pl.p("blink")) if os.path.isdir(pl.p("blink")) else []:
        if "_blinkprev_" in f: shutil.copyfile(pl.p("blink", f), pl.p("blink", f.replace("_blinkprev_", "_blink_")))
    ledger = {}
    votes = [m.get("facing") for m in mouths.values() if m.get("facing") in ("left", "right")]
    facing_left = votes.count("right") <= votes.count("left")
    for i in range(len(M.GROWTH_P)):
        closed = Image.open(pl.p("morph", f"f{i:02d}_rgba.png")).convert("RGBA")
        mi = mouths.get(str(i), {})
        # the OPEN twin is judged against the JAW box from the silhouette - the recorded mouth box on
        # small frames is the whole head, which is exactly how the second heads slipped through
        jb, _ = jaw_box(closed, facing_left, tuple(mi.get("mouth", (0, 0, 0, 0))), mi.get("eye"))
        for kind, sub, box in (("open", "chomp", jb), ("blink", "blink", mi.get("eye"))):
            p = pl.p(sub, f"f{i:02d}_{kind}_rgba.png")
            if not os.path.exists(p): continue
            tw = Image.open(p).convert("RGBA")
            oc = outside_change(closed, tw, box)
            ok = oc <= MAX_OUT
            ledger[f"{i:02d}_{kind}"] = {"outside": round(oc, 4), "ok": ok}
            if not ok:
                prev = p.replace(f"_{kind}_", f"_{kind}prev_")
                if not os.path.exists(prev): shutil.copyfile(p, prev)
                M.save_png(closed, p)
    bad = [k for k, v in ledger.items() if not v["ok"]]
    print(f"{st}: {len(ledger)} twins measured, {len(bad)} ghosts replaced by the closed frame: {bad}")
    M.save_json(pl.p("chomp", "ghostgate.json"), ledger)
