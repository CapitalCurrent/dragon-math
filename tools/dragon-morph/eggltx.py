"""Egg frames FROM LTX CLIPS (Ryan 9/5 go): the two generated transitions (S0->S2, S2->S3, on white)
become the rumble frames. Every selected frame is cut out and placed with ONE fixed transform
(taken from clip 1's first frame) so the egg never rescales or shifts between frames.

  python eggltx.py --clip1 work/ltx/egg-white-s0s2 --clip2 work/ltx/egg-white-s2s3-6 --install realistic,graphic-novel,painterly
"""
import argparse, os, sys, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
import morph as M
import eggchain as E

PER_RUMBLE = 12


def pick_indices(n_frames, kind):
    last = n_frames - 1
    if kind == "even":
        return [round(i * last / (PER_RUMBLE - 1)) for i in range(PER_RUMBLE)]
    # 'front-loaded': the change happens early in the clip, then it settles
    idx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 14, last]
    return [min(i, last) for i in idx]


def cut(path):
    return M.rembg_rgba(path)


def build(clip1, clip2, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    n1 = len([f for f in os.listdir(clip1) if f.startswith("f") and f.endswith(".png") and "nobg" not in f])
    n2 = len([f for f in os.listdir(clip2) if f.startswith("f") and f.endswith(".png") and "nobg" not in f])
    half = n1 // 2
    # rumble 1: clip1 first half; rumble 2: clip1 second half; rumble 3: clip2 (front-loaded)
    sel = [(clip1, 0)]
    sel += [(clip1, round(1 + i * (half - 1) / (PER_RUMBLE - 1))) for i in range(PER_RUMBLE)]
    sel += [(clip1, round(half + 1 + i * (n1 - 2 - half) / (PER_RUMBLE - 1))) for i in range(PER_RUMBLE)]
    sel += [(clip2, i) for i in pick_indices(n2, "front")[1:]] + [(clip2, n2 - 1)]
    sel = sel[: 1 + 3 * PER_RUMBLE]
    # the fixed transform from clip1 frame 0
    first = cut(os.path.join(clip1, "f000.png"))
    x0, y0, x1, y1 = M.alpha_bbox(first)
    s = (M.H_EGG * M.H) / (y1 - y0)
    ox = M.W / 2 - (x0 + x1) / 2 * s
    oy = M.FLOOR * M.H - y1 * s
    frames = []
    for k, (clip, i) in enumerate(sel):
        rgba = cut(os.path.join(clip, f"f{i:03d}.png"))
        gen = rgba
        w, h = rgba.size
        placed = rgba.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
        layer = Image.new("RGBA", (M.W, M.H), (0, 0, 0, 0))
        layer.alpha_composite(placed, (int(ox), int(oy)))
        M.save_png(gen, os.path.join(out_dir, f"egg_{k}_gen_rgba.png"))
        bg = Image.new("RGB", gen.size, (255, 255, 255)); bg.paste(gen, (0, 0), gen)
        M.save_png(bg, os.path.join(out_dir, f"egg_{k}.png"))
        M.save_png(layer, os.path.join(out_dir, f"egg_{k}_rgba.png"))
        frames.append(os.path.join(out_dir, f"egg_{k}_gen_rgba.png"))
    print(f"{len(frames)} egg frames -> {out_dir} (clip1 {n1} frames, clip2 {n2} frames)")
    return frames


def install(out_dir, variants, remnants_from):
    for v in variants:
        dst = os.path.join(M.HERE, "work", f"{M.DRAGONS and 'ember'}-{v}", "eggs")
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(out_dir, dst)
        for name in ("remnants_rgba.png", "remnants_gen_rgba.png"):
            shutil.copyfile(os.path.join(remnants_from, name), os.path.join(dst, name))
        print("installed ->", dst)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--clip1", required=True)
    ap.add_argument("--clip2", required=True)
    ap.add_argument("--out", default=os.path.join(E.work("ember"), "frames_ltx"))
    ap.add_argument("--remnants-from", default=os.path.join(E.work("ember"), "frames"))
    ap.add_argument("--install", default="")
    a = ap.parse_args()
    frames = build(a.clip1, a.clip2, a.out)
    if a.install:
        install(a.out, a.install.split(","), a.remnants_from)
