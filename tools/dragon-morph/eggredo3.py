"""Egg redo, take 3 (Ryan 9/5: the crust egg's middle reads as MISSING shell; darkening cannot fix a
wrong start). S0 = her ORIGINAL egg, untouched. S1/S2/S3 = inpaints whose pixels are kept ONLY inside
nested masks and composited over the previous state (take 2's chain leaked outside its mask and the
next mask grew from the leak -> a grey egg). Damage only ever grows; the crust outside it never changes."""
import os, sys, types
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import morph as M, eggchain as E

EMBRYO = ("the same dragon egg BURST OPEN: (a large section of the crust broken away, a wide opening:1.4), "
          "(a tiny living baby dragon embryo curled up asleep inside, submerged in glowing molten lava:1.5), small "
          "orange scales, closed eye, tiny curled tail, warm orange light pouring out, broken crust pieces at the base, "
          "clean plain white background, highly detailed, cinematic lighting")
NEG3 = "dead, skull, bones, empty hole, text, watermark, blurry, low quality, second egg, whole egg, intact egg"


def feather(mask, px):
    return ndi.gaussian_filter(mask.astype(float), px)


def composite(prev_rgba, gen_png, mask, px=5):
    w = feather(mask, px)[:, :, None]
    a = np.asarray(prev_rgba).astype(float)
    g = np.asarray(Image.open(gen_png).convert("RGB")).astype(float)
    out = a.copy(); out[:, :, :3] = a[:, :, :3] * (1 - w) + g * w
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def white_png(rgba, path):
    bg = Image.new("RGB", rgba.size, (255, 255, 255)); bg.paste(rgba, (0, 0), rgba.split()[3]); return M.save_png(bg, path)


def build(dragon="ember", seed=21, s3_seeds=(11, 12)):
    t = M.cc().TIERS["daily"]; W = E.work(dragon); M.GEN_TIMEOUT = 300
    egg = Image.open(os.path.join(M.ART, f"egg-{dragon}.webp")).convert("RGBA")
    s0, _ = M.place_on_canvas(egg, M.EGG_GEN_H); s0 = s0.convert("RGBA")
    M.save_png(s0, os.path.join(W, "her_s0_rgba.png")); s0_png = white_png(s0, os.path.join(W, "her_s0.png"))
    alpha = np.asarray(s0)[:, :, 3] > 128
    x0, y0, x1, y1 = M.alpha_bbox(s0); w, h = x1 - x0, y1 - y0
    m1 = np.zeros_like(alpha); m1[int(y0 + h * 0.10):int(y0 + h * 0.52), int(x0 + w * 0.30):int(x0 + w * 0.70)] = True
    m1 &= alpha
    m2 = ndi.binary_dilation(m1, iterations=int(w * 0.10)) & alpha
    m3 = ndi.binary_dilation(m2, iterations=int(w * 0.14)) & alpha
    masks = {1: m1, 2: m2, 3: m3}
    outs = ["her_s0"]
    prev, prev_png = s0, s0_png
    for k in (1, 2):
        name, dn, prompt, neg = E.STATES[k]
        mp = M.save_png(Image.fromarray((masks[k] * 255).astype(np.uint8), "L"), os.path.join(W, f"her_m{k}.png"))
        out = M.generate(M.cc().build_sdxl_inpaint(t, prompt, neg, M.stage(prev_png), M.stage(mp), {1: 0.80, 2: 0.80}[k], seed,
                                                   f"dm_her_s{k}_{seed}", grow=4), f"her S{k}")
        gen = M.copy_out(out, os.path.join(W, f"her_s{k}_gen.png"))
        cur = composite(prev, gen, masks[k])
        M.save_png(cur, os.path.join(W, f"her_s{k}_rgba.png")); prev_png = white_png(cur, os.path.join(W, f"her_s{k}.png"))
        prev = cur; outs.append(f"her_s{k}")
    mp = M.save_png(Image.fromarray((m3 * 255).astype(np.uint8), "L"), os.path.join(W, "her_m3.png"))
    for sd in s3_seeds:
        out = M.generate(M.cc().build_sdxl_inpaint(t, EMBRYO, NEG3, M.stage(prev_png), M.stage(mp), 0.85, sd, f"dm_her_s3_{sd}", grow=4), f"her S3 {sd}")
        gen = M.copy_out(out, os.path.join(W, f"her_s3_{sd}_gen.png"))
        cur = composite(prev, gen, m3)
        M.save_png(cur, os.path.join(W, f"her_s3_{sd}_rgba.png")); white_png(cur, os.path.join(W, f"her_s3_{sd}.png"))
        outs.append(f"her_s3_{sd}")
    pl = M.Pipeline(types.SimpleNamespace(dragon=dragon, seed_bump=0, neg="", only=[], resume=True, dry_run=False, style="painterly", variant="eggchain"))
    pl.contact([os.path.join(W, f"{o}_rgba.png") for o in outs], os.path.join(W, "contact_her.png"), cols=len(outs), cell=300, labels=outs)


if __name__ == "__main__":
    build()
