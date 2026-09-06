"""Realistic mouths (Iona 9/6: "the mouth opening looked odd / a double image"): the open twin must differ
from the closed frame ONLY at the jaw. The old chomp boxed the whole head on small frames, so the model
repainted a second head and the crossfade ghosted (measured: 5-13% of the dragon changed on frames 0-5).

Per frame: the snout is the front-most point of the head band of the SILHOUETTE (no model guessing), the
jaw box hangs off it, the inpaint runs at a lower denoise, only the box is kept, and a GATE measures the
change outside the box: > 3% of the dragon = rejected, next seed. No pass in N tries = no chomp on that
frame (a closed mouth beats a glitch).

  python jawfix.py --variant painterly --style painterly [--frames 0-16] [--tries 3]
"""
import os, sys, argparse, shutil, types
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import morph as M

OUTSIDE_MAX = 0.03      # of dragon pixels
INSIDE_MIN = 0.10       # of box pixels - the mouth actually opened


def jaw_box(closed_rgba, facing_left, fallback, eye=None):
    """The jaw box, anchored on the EYE when one was located (the silhouette's front-most point is the
    wing tip in a wings-forward pose - 9/6, a mouth got painted on a wing). No eye: the lower-front
    quarter of the recorded mouth box (the old whole-head box shrunk to the jaw)."""
    bx0, by0, bx1, by1 = M.alpha_bbox(closed_rgba); bw, bh = bx1 - bx0, by1 - by0
    if eye and (eye[2] - eye[0]) < 0.35 * bw:
        ex0, ey0, ex1, ey1 = eye; ew, eh = max(ex1 - ex0, 16), max(ey1 - ey0, 16)
        if facing_left:
            box = (ex0 - 2.4 * ew, ey1 + 0.2 * eh, ex1 - 0.2 * ew, ey1 + 1.7 * eh)
        else:
            box = (ex0 + 0.2 * ew, ey1 + 0.2 * eh, ex1 + 2.4 * ew, ey1 + 1.7 * eh)
        how = "from the eye"
    elif fallback and fallback[2] > fallback[0]:
        mx0, my0, mx1, my1 = fallback; mw, mh = mx1 - mx0, my1 - my0
        box = (mx0, my0 + 0.45 * mh, mx0 + 0.5 * mw, my1) if facing_left else (mx1 - 0.5 * mw, my0 + 0.45 * mh, mx1, my1)
        how = "lower-front of the recorded box"
    else:
        return fallback, "fallback"
    box = (max(0, box[0]), max(0, box[1]), min(M.W, box[2]), min(M.H, box[3]))
    return box, how


def register(closed, open_rgba, box, feather=6):
    m = Image.new("L", (M.W, M.H), 0)
    x0, y0, x1, y1 = [int(v) for v in box]
    ImageDraw.Draw(m).rectangle((x0 - feather, y0 - feather, x1 + feather, y1 + feather), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(feather / 2))
    return Image.composite(open_rgba, closed, m)


def gate(closed, cand, box):
    C = np.asarray(closed).astype(float); O = np.asarray(cand).astype(float)
    al = (C[:, :, 3] > 32) | (O[:, :, 3] > 32)
    d = (np.abs(C[:, :, :3] - O[:, :, :3]).mean(axis=2) > 28) & al
    x0, y0, x1, y1 = [int(v) for v in box]
    b = np.zeros_like(al); b[max(0, y0 - 8):y1 + 8, max(0, x0 - 8):x1 + 8] = True
    outside = float((d & ~b).sum() / max(1, al.sum()))
    inside = float((d & b).sum() / max(1, b.sum()))
    return outside, inside


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dragon", default="ember"); ap.add_argument("--variant", required=True); ap.add_argument("--style", required=True)
    ap.add_argument("--frames", default="0-16"); ap.add_argument("--tries", type=int, default=3); ap.add_argument("--denoise", type=float, default=0.78); ap.add_argument("--tier", default="")
    a = ap.parse_args()
    lo, hi = [int(v) for v in a.frames.split("-")]
    pl = M.Pipeline(types.SimpleNamespace(dragon=a.dragon, seed_bump=0, neg="", only=[], resume=True, dry_run=False, style=a.style, variant=a.variant))
    M.TIER_NAME = a.tier or ("photoreal" if a.style == "realistic" else "daily")
    t = M.tier()
    mouths = M.load_json(pl.p("chomp", "mouth.json"), {})
    votes = [m.get("facing") for m in mouths.values() if m.get("facing") in ("left", "right")]
    facing_left = votes.count("right") <= votes.count("left")
    report = M.load_json(pl.p("chomp", "jawfix.json"), {})
    M.GEN_TIMEOUT = 300
    for i in range(lo, hi + 1):
        p = M.GROWTH_P[i]
        closed = Image.open(pl.p("morph", f"f{i:02d}_rgba.png")).convert("RGBA")
        src = pl.p("morph", f"f{i:02d}.png")
        fb = tuple(mouths.get(str(i), {}).get("mouth", (0, 0, 0, 0)))
        box, how = jaw_box(closed, facing_left, fb, mouths.get(str(i), {}).get("eye"))
        mask = Image.new("L", (M.W, M.H), 0); ImageDraw.Draw(mask).rectangle(box, fill=255)
        mname = M.stage(M.save_png(mask, pl.p("chomp", f"f{i:02d}_jawmask.png")))
        name = M.stage(src)
        prompt = f"(mouth WIDE open, roaring, gaping jaws, lower jaw dropped far down, rows of sharp teeth, tongue:1.5), the same dragon head, {M.stage_prompt(pl.d, M.maturity(p))}"
        neg = pl.neg + ", closed mouth, smile with closed lips, second head, extra eye, extra head, deformed"
        # the jaw is painted on a HI-RES CROP of the head (a hatchling's jaw box is ~70x30 px on the
        # canvas - too small for the model to draw a mouth), then scaled back into the frame
        cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        side = int(max(3.2 * (box[2] - box[0]), 4.5 * (box[3] - box[1]), 192))
        crop = (int(max(0, min(M.W - side, cx - side / 2))), int(max(0, min(M.H - side, cy - side / 2))))
        crop = (crop[0], crop[1], crop[0] + side, crop[1] + side)
        GEN = 1024
        crop_img = Image.open(src).convert("RGB").crop(crop).resize((GEN, GEN), Image.LANCZOS)
        cname = M.stage(M.save_png(crop_img, pl.p("chomp", f"f{i:02d}_jawcrop.png")))
        sc = GEN / side
        cbox = tuple((v - crop[j % 2]) * sc for j, v in enumerate(box))
        cmask = Image.new("L", (GEN, GEN), 0); ImageDraw.Draw(cmask).rectangle(cbox, fill=255)
        cmname = M.stage(M.save_png(cmask, pl.p("chomp", f"f{i:02d}_jawcropmask.png")))
        best = None
        for k in range(a.tries):
            seed = pl.seed + 101 * (k + 1)
            out = M.generate(M.cc().build_sdxl_inpaint(t, prompt, neg, cname, cmname, a.denoise, seed, f"dm_jaw_{i:02d}_{k}", grow=10), f"jaw {i:02d} try {k}")
            dest = M.copy_out(out, pl.p("chomp", f"f{i:02d}_jaw_{k}.png"))
            if not dest:
                continue
            patch = M.rembg_rgba(dest).resize((side, side), Image.LANCZOS)
            full = closed.copy(); full.paste(patch, (crop[0], crop[1]))
            cand = register(closed, full, box)
            outside, inside = gate(closed, cand, box)
            M.log(f"  {i:02d} try {k}: outside {100*outside:.1f}% inside {100*inside:.0f}% ({how})")
            if outside <= OUTSIDE_MAX and inside >= INSIDE_MIN:
                if best is None or inside > best[1]:
                    best = (cand, inside, k, outside)
                if inside >= 0.25:
                    break
        dst = pl.p("chomp", f"f{i:02d}_open_rgba.png")
        if os.path.exists(dst) and not os.path.exists(dst.replace("_open_", "_openprev_")):
            shutil.copyfile(dst, dst.replace("_open_", "_openprev_"))
        if best is None:
            M.log(f"  {i:02d}: NO PASS in {a.tries} tries -> closed mouth stands in for the open twin")
            M.save_png(closed, dst); report[str(i)] = {"pass": False, "box": [round(v) for v in box], "how": how}
        else:
            M.save_png(best[0], dst)
            report[str(i)] = {"pass": True, "try": best[2], "inside": round(best[1], 3), "outside": round(best[3], 4), "box": [round(v) for v in box], "how": how}
            mi = mouths.setdefault(str(i), {})
            mi["mouth"] = [round(v) for v in box]
            mi["cx"] = round((box[0] + box[2]) / 2 / M.W, 4); mi["cy"] = round((box[1] + box[3]) / 2 / M.H, 4)
            mi.setdefault("facing", "left" if facing_left else "right")
        M.save_json(pl.p("chomp", "mouth.json"), mouths); M.save_json(pl.p("chomp", "jawfix.json"), report)
    passed = sum(1 for v in report.values() if v.get("pass")); M.log(f"jawfix {a.variant}: {passed}/{len(report)} frames passed the gate")


if __name__ == "__main__":
    main()
