"""Egg redo (Iona 9/5: the first egg must read mostly BLACK crust, the 2nd answer must not already
show a hole, the 3rd answer must visibly change).

S0  = HER egg (src/assets/art/egg-<dragon>.webp) with the crust darkened numerically, so the egg she
      picked is the egg that hatches and it starts solid.
clip1 = LTX from S0: first fractures -> a chunk breaks away.
clip2 = LTX from clip1's LAST frame: the opening widens, magma, shell pieces fall.
frames = picked by DAMAGE (difference from S0), not by time, so the three answers show an even
      progression instead of everything happening in the first clip's first half.
"""
import os, sys, types
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
import morph as M, eggchain as E, ltx

PER_RUMBLE = 12
SIZE = 704


def dark_frac(im):
    a = np.asarray(im.convert("RGBA")); m = a[:, :, 3] > 128
    return float((a[:, :, :3].max(axis=2)[m] < 90).sum()) / max(1, m.sum())


def crust_darken(im, keep=0.05, floor=0.16):
    a = np.asarray(im.convert("RGBA")).astype(float)
    alpha = a[:, :, 3] > 64
    lum = a[:, :, :3].max(axis=2)
    thr = np.quantile(lum[alpha], 1 - keep)
    t = np.clip((lum - thr * 0.6) / (thr * 0.4 + 1e-6), 0, 1)
    a[:, :, :3] *= (floor + (1 - floor) * t)[:, :, None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")


def on_white(rgba, out, frac=0.62):
    im = rgba.copy(); s = (SIZE * frac) / im.height
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    c = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
    c.paste(im, ((SIZE - im.width) // 2, int(SIZE * 0.88) - im.height), im)
    c.save(out); return out


def damage(cut, base_arr):
    a = np.asarray(cut.convert("RGB")).astype(float)
    al = np.asarray(cut)[:, :, 3] > 64
    return float(((np.abs(a - base_arr).mean(axis=2) > 26) & al).sum())


def have(out):
    """resume: a clip whose frames already exist is not regenerated (the studio would only hand back a
    cached result in 0.01 s and the runner would wait forever for new files)"""
    n = len([f for f in os.listdir(out) if f.startswith("f") and f.endswith(".png")]) if os.path.isdir(out) else 0
    return n if n >= 9 else 0


def build(dragon="ember", seed1=3, seed2=5):
    W = E.work(dragon)
    F = os.path.join(W, "frames_redo")
    os.makedirs(F, exist_ok=True)
    egg = Image.open(os.path.join(M.ART, f"egg-{dragon}.webp")).convert("RGBA")
    s0 = crust_darken(egg)
    M.save_png(s0, os.path.join(W, "redo_s0_rgba.png"))
    print(f"S0 from her egg: dark {100*dark_frac(egg):.0f}% -> {100*dark_frac(s0):.0f}%")
    start = on_white(s0, os.path.join(W, "redo_s0_white.png"))

    M.GEN_TIMEOUT = 600
    P1 = ("Close-up of a dragon egg with a black cooled lava crust on a plain white background. The egg "
          "trembles, then dark cracks split across the black crust and a chunk of the shell breaks loose "
          "and falls away, glowing magma showing in the gap, static camera, cinematic")
    a1 = types.SimpleNamespace(start=start, end="", end_strength=1.0, prompt=P1, out=os.path.join(W, "redo_c1"),
                               frames=33, fps=24, width=SIZE, height=SIZE, seed=seed1, steps=8, timeout=600)
    n1 = have(a1.out) or ltx.run(a1)
    last1 = os.path.join(W, "redo_c1", f"f{n1-1:03d}.png")
    # Iona 9/5: it must look like a LIVING embryo in molten lava, not like the egg is being killed
    P2 = ("Close-up of a cracked dragon egg with a black lava crust on a plain white background. The opening "
          "widens as more crust breaks away, revealing (a tiny living baby dragon embryo curled up inside the "
          "glowing molten lava:1.4), its small orange scales and closed eye visible, breathing gently, warm "
          "light pouring out of the opening, static camera, cinematic")
    a2 = types.SimpleNamespace(start=last1, end="", end_strength=1.0, prompt=P2, out=os.path.join(W, "redo_c2"),
                               frames=33, fps=24, width=SIZE, height=SIZE, seed=seed2, steps=8, timeout=600)
    n2 = have(a2.out) or ltx.run(a2)

    # cut every clip frame once, measure damage vs S0's cutout
    cuts, dmg = [], []
    base = None
    for clip, n in (("redo_c1", n1), ("redo_c2", n2)):
        for i in range(n):
            c = M.rembg_rgba(os.path.join(W, clip, f"f{i:03d}.png"))
            if base is None:
                base = np.asarray(c.convert("RGB")).astype(float)
            cuts.append(c); dmg.append(damage(c, base))
    dmg = np.array(dmg)
    dmg = np.maximum.accumulate(dmg)          # damage may only grow
    total = 3 * PER_RUMBLE
    targets = [dmg.max() * (k + 1) / total for k in range(total)]
    picks = [0] + [int(np.searchsorted(dmg, t)) for t in targets]
    picks = [min(p, len(cuts) - 1) for p in picks]
    print(f"  {len(cuts)} clip frames, damage {dmg.min():.0f}..{dmg.max():.0f}; picks {picks[:6]}...{picks[-3:]}")

    # ONE fixed transform from the first cut
    x0, y0, x1, y1 = M.alpha_bbox(cuts[0])
    s = (M.H_EGG * M.H) / (y1 - y0)
    ox = M.W / 2 - (x0 + x1) / 2 * s
    oy = M.FLOOR * M.H - y1 * s
    for k, pi in enumerate(picks):
        gen = cuts[pi]
        placed = gen.resize((max(1, round(gen.width * s)), max(1, round(gen.height * s))), Image.LANCZOS)
        layer = Image.new("RGBA", (M.W, M.H), (0, 0, 0, 0))
        layer.alpha_composite(placed, (int(ox), int(oy)))
        M.save_png(gen, os.path.join(F, f"egg_{k}_gen_rgba.png"))
        bg = Image.new("RGB", gen.size, (255, 255, 255)); bg.paste(gen, (0, 0), gen)
        M.save_png(bg, os.path.join(F, f"egg_{k}.png"))
        M.save_png(layer, os.path.join(F, f"egg_{k}_rgba.png"))
    # remnants: keep whatever the sets already use
    src_rem = os.path.join(W, "frames", "remnants_rgba.png")
    for nm in ("remnants_rgba.png", "remnants_gen_rgba.png"):
        p = os.path.join(W, "frames", nm)
        if os.path.exists(p):
            import shutil; shutil.copyfile(p, os.path.join(F, nm))
    print(f"  {len(picks)} egg frames -> {F}")
    return F


if __name__ == "__main__":
    import shutil
    F = build()
    for v in ("realistic", "graphic-novel", "painterly"):
        dst = os.path.join(M.HERE, "work", f"ember-{v}", "eggs")
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(F, dst)
        print("installed ->", dst)
