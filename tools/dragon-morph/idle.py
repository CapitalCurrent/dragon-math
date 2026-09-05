"""IDLE LIFE from LTX: one short subtle clip per growth frame (breathing, a ripple in the wings, a
tail twitch), cut out and thinned to IDLE_N frames the app plays back and forth at rest. Every idle
frame is placed with the SAME transform as its growth frame, so it drops in exactly on top of it.

  python idle.py --variant realistic --style realistic [--only 0,8,16] [--seed 1]
Writes work/<dragon>-<variant>/idle/f{i:02d}_{k}_rgba.png (k = 0..IDLE_N-1) for the export.
"""
import argparse, os, sys, types
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
import morph as M
import ltx

IDLE_N = 8
CLIP_FRAMES = 33
PROMPT = ("A {kind} stands still on a plain white background, feet planted firmly and not moving, breathing "
          "slowly with its chest rising and falling, wings held steady with only a slight ripple in the "
          "membranes, tail tip twitching gently, head almost still, static camera, subtle motion, cinematic")


def run(pl, indices, seed):
    out_dir = pl.p("idle")
    os.makedirs(out_dir, exist_ok=True)
    M.GEN_TIMEOUT = 600
    for i in indices:
        src = pl.p("morph", f"f{i:02d}_rgba.png")
        if not os.path.exists(src):
            print(f"  {i:02d}: no growth frame"); continue
        if os.path.exists(pl.p("idle", f"f{i:02d}_{IDLE_N-1}_rgba.png")) and pl.a.resume:
            print(f"  {i:02d}: idle exists (resume)"); continue
        rgba = Image.open(src).convert("RGBA")
        x0, y0, x1, y1 = M.alpha_bbox(rgba)
        sub = rgba.crop((x0, y0, x1, y1))
        # scene for LTX: the subject filling ~78% of a 768x512 canvas, on white
        CW, CH = 768, 512
        s = min((CH * 0.78) / sub.height, (CW * 0.9) / sub.width)
        sc = sub.resize((max(1, round(sub.width * s)), max(1, round(sub.height * s))), Image.LANCZOS)
        px, py = (CW - sc.width) // 2, int(CH * 0.9) - sc.height
        scene = Image.new("RGB", (CW, CH), (255, 255, 255)); scene.paste(sc, (px, py), sc)
        scene_path = M.save_png(scene, pl.p("idle", f"f{i:02d}_scene.png"))
        m = M.maturity(M.GROWTH_P[i])
        kind = "newborn baby dragon" if m < 0.2 else "young dragon" if m < 0.6 else "large adult dragon"
        args = types.SimpleNamespace(start=scene_path, end="", end_strength=1.0, prompt=PROMPT.format(kind=kind),
                                     out=pl.p("idle", f"clip_{i:02d}"), frames=CLIP_FRAMES, fps=24, width=CW, height=CH,
                                     seed=seed + i, steps=8, timeout=600)
        n = ltx.run(args)
        if n < IDLE_N:
            print(f"  {i:02d}: clip too short ({n})"); continue
        picks = [round(k * (int(n * 0.6) - 1) / (IDLE_N - 1)) for k in range(IDLE_N)]   # the calm first 60% of the clip
        for k, fi in enumerate(picks):
            cut = M.rembg_rgba(pl.p("idle", f"clip_{i:02d}", f"f{fi:03d}.png"))
            # back into the growth frame's canvas coordinates: undo the scene placement + scale
            back = Image.new("RGBA", (M.W, M.H), (0, 0, 0, 0))
            piece = cut.crop((px, py, px + sc.width, py + sc.height))
            piece = piece.resize((x1 - x0, y1 - y0), Image.LANCZOS)
            back.alpha_composite(piece, (x0, y0))
            M.save_png(back, pl.p("idle", f"f{i:02d}_{k}_rgba.png"))
        print(f"  {i:02d}: {IDLE_N} idle frames")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dragon", default="ember")
    ap.add_argument("--variant", required=True)
    ap.add_argument("--style", required=True)
    ap.add_argument("--only", default="")
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--resume", action="store_true")
    a = ap.parse_args()
    pl = M.Pipeline(types.SimpleNamespace(dragon=a.dragon, seed_bump=0, neg="", only=[], resume=a.resume, dry_run=False,
                                          style=a.style, variant=a.variant))
    idx = [int(x) for x in a.only.split(",")] if a.only else list(range(len(M.GROWTH_P)))
    run(pl, idx, a.seed)
