"""Egg redo, take 2 (9/5). Unguided LTX invented a claw reaching in from above (take 1), so:
S0 = HER egg darkened -> the CHAIN builds S1/S2/S3 from it by contained inpaint (same egg, only the
damage changes) -> two GUIDED LTX clips (S0->S2, then clip1's last frame->S3), egg filling the frame so
nothing can intrude -> the 37 app frames picked by damage INSIDE the egg, intruder frames rejected."""
import os, sys, types, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
import morph as M, eggchain as E, ltx
from eggredo import crust_darken, dark_frac, have, PER_RUMBLE

SIZE, FRAC = 704, 0.86
S0_SEED, SEED = 9000, 9001


def on_white(rgba, out):
    im = rgba.copy(); s = (SIZE * FRAC) / im.height
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    c = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
    c.paste(im, ((SIZE - im.width) // 2, int(SIZE * 0.95) - im.height), im)
    c.save(out); return out


def build(dragon="ember"):
    W = E.work(dragon); F = os.path.join(W, "frames_redo2"); os.makedirs(F, exist_ok=True)
    # S0 = her egg, darkened, in the chain's canvas placement
    s0_png = os.path.join(W, f"s0_{S0_SEED}.png")
    if not os.path.exists(s0_png):
        egg = Image.open(os.path.join(M.ART, f"egg-{dragon}.webp")).convert("RGBA")
        d = crust_darken(egg)
        plate, _ = M.place_on_canvas(d, M.EGG_GEN_H)
        plate = plate.convert("RGBA")
        bg = Image.new("RGB", plate.size, (255, 255, 255)); bg.paste(plate, (0, 0), plate.split()[3])
        M.save_png(bg, s0_png); M.save_png(plate, os.path.join(W, f"s0_{S0_SEED}_rgba.png"))
        print(f"S0 = her egg, dark {100*dark_frac(egg):.0f}% -> {100*dark_frac(d):.0f}%")
    if not os.path.exists(os.path.join(W, f"s3_{SEED}_rgba.png")):
        E.candidates(dragon, [SEED], s0_seed=S0_SEED)
    st = {k: Image.open(os.path.join(W, f"{k}_{SEED if k != 's0' else S0_SEED}_rgba.png")).convert("RGBA") for k in ("s0", "s2", "s3")}
    scene = {k: on_white(v, os.path.join(W, f"redo2_{k}_white.png")) for k, v in st.items()}

    M.GEN_TIMEOUT = 600
    P1 = ("Close-up of a dragon egg with a black cooled lava crust on a plain white background. The egg trembles, "
          "cracks split across the crust and a patch of shell crumbles away, glowing magma showing in the gap, "
          "the rest of the egg unchanged, static camera, cinematic")
    a1 = types.SimpleNamespace(start=scene["s0"], end=scene["s2"], end_strength=1.0, prompt=P1, out=os.path.join(W, "redo2_c1"),
                               frames=33, fps=24, width=SIZE, height=SIZE, seed=3, steps=8, timeout=600)
    n1 = have(a1.out) or ltx.run(a1)
    last1 = os.path.join(W, "redo2_c1", f"f{n1-1:03d}.png")
    P2 = ("Close-up of a cracked dragon egg with a black lava crust on a plain white background. More crust breaks "
          "away and the opening widens, revealing a tiny living baby dragon curled up inside the glowing molten lava, "
          "warm light pouring out, the rest of the egg unchanged, static camera, cinematic")
    a2 = types.SimpleNamespace(start=last1, end=scene["s3"], end_strength=1.0, prompt=P2, out=os.path.join(W, "redo2_c2"),
                               frames=33, fps=24, width=SIZE, height=SIZE, seed=5, steps=8, timeout=600)
    n2 = have(a2.out) or ltx.run(a2)

    cuts, dmg, ok = [], [], []
    base = M.rembg_rgba(scene["s0"])
    egg_m = np.asarray(base)[:, :, 3] > 64
    ys, xs = np.where(egg_m); top, left, right = ys.min(), xs.min(), xs.max()
    m = int(0.04 * SIZE)
    barr = np.asarray(base.convert("RGB")).astype(float)
    for clip, n in (("redo2_c1", n1), ("redo2_c2", n2)):
        for i in range(n):
            c = M.rembg_rgba(os.path.join(W, clip, f"f{i:03d}.png"))
            al = np.asarray(c)[:, :, 3] > 64
            intruder = al[: max(0, top - m), :].any() or al[:, : max(0, left - m)].any() or al[:, right + m:].any()
            a = np.asarray(c.convert("RGB")).astype(float)
            dm = float(((np.abs(a - barr).mean(axis=2) > 26) & al & egg_m).sum())
            cuts.append(c); dmg.append(dm); ok.append(not intruder)
    dmg = np.array(dmg); ok = np.array(ok)
    print(f"  {len(cuts)} clip frames, {int((~ok).sum())} intruder frames rejected, damage {dmg.min():.0f}..{dmg.max():.0f}")
    idx = np.where(ok)[0]
    d = np.maximum.accumulate(dmg[idx])
    total = 3 * PER_RUMBLE
    picks = [int(idx[0])] + [int(idx[min(int(np.searchsorted(d, d.max() * (k + 1) / total)), len(idx) - 1)]) for k in range(total)]
    print(f"  picks {picks[:5]}...{picks[-4:]}")

    x0, y0, x1, y1 = M.alpha_bbox(cuts[picks[0]])
    s = (M.H_EGG * M.H) / (y1 - y0); ox = M.W / 2 - (x0 + x1) / 2 * s; oy = M.FLOOR * M.H - y1 * s
    for k, pi in enumerate(picks):
        gen = cuts[pi]
        placed = gen.resize((max(1, round(gen.width * s)), max(1, round(gen.height * s))), Image.LANCZOS)
        layer = Image.new("RGBA", (M.W, M.H), (0, 0, 0, 0)); layer.alpha_composite(placed, (int(ox), int(oy)))
        M.save_png(gen, os.path.join(F, f"egg_{k}_gen_rgba.png"))
        bg = Image.new("RGB", gen.size, (255, 255, 255)); bg.paste(gen, (0, 0), gen); M.save_png(bg, os.path.join(F, f"egg_{k}.png"))
        M.save_png(layer, os.path.join(F, f"egg_{k}_rgba.png"))
    for nm in ("remnants_rgba.png", "remnants_gen_rgba.png"):
        p = os.path.join(W, "frames", nm)
        if os.path.exists(p): shutil.copyfile(p, os.path.join(F, nm))
    ks = [0, 6, 12, 18, 24, 30, 36]; cell = 230
    sheet = Image.new("RGB", (cell * len(ks), cell), (70, 70, 80))
    for i, k in enumerate(ks):
        im = cuts[picks[k]].copy(); im.thumbnail((cell, cell)); sheet.paste(im, (i * cell + (cell - im.width) // 2, cell - im.height), im)
    sheet.save(os.path.join(W, "redo2_strip.png"))
    print(f"  {len(picks)} egg frames -> {F}")
    return F


if __name__ == "__main__":
    F = build()
    if "--install" in sys.argv:
        for v in ("realistic", "graphic-novel", "painterly"):
            dst = os.path.join(M.HERE, "work", f"ember-{v}", "eggs")
            if os.path.exists(dst): shutil.rmtree(dst)
            shutil.copytree(F, dst); print("installed ->", dst)
