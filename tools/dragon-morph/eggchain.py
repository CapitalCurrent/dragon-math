"""Egg STATE CHAIN (Ryan 9/5 13:30): the model authors the egg's deterioration as a chain of whole
states - S0 solid crust, S1 first fractures, S2 crumbling/slumping, S3 burst - each generated from
the previous one, plus a pile of shell REMNANTS for the cave floor after the hatch. Transitions
between states are computed later (a propagation reveal), never generated.

  python eggchain.py --dragon ember --seeds 4242,4243,4244      # candidates -> work/<dragon>-eggchain/
  python eggchain.py --dragon ember --pick 4243                  # promote one chain to states/
"""
import argparse, os, sys, types
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import morph as M
from PIL import Image

NEG = ("dragon, creature, hatchling, animal, translucent, glass, hollow, see-through, stained glass, lantern, "
       "text, watermark, blurry, low quality, two eggs, multiple eggs")
NEG_OPEN = ("translucent, glass, hollow, see-through, stained glass, lantern, text, watermark, blurry, "
            "low quality, two eggs, multiple eggs, whole dragon, full body")
EGG = "a single dragon egg sitting upright, clean plain white background, centered, the whole egg in frame, highly detailed, cinematic lighting"
STATES = [
    # (name, denoise, prompt, negative)
    ("s0", 0.70, f"{EGG}, (solid cooled lava crust:1.5): dark matte basalt crust fused into one solid shell, seams "
                 "nearly closed, only faint dull red hairlines of heat between the crust plates, one small warm glowing "
                 "spot, glossy specular highlights and warm rim light on the crust", NEG),
    ("s1", 0.55, f"{EGG}, the same lava-crust egg BEGINNING TO CRACK: (a jagged fracture splitting the crust, one crust "
                 "plate lifting and tilting:1.4), bright molten light showing in the fracture, small chips of crust "
                 "flaking off, the rest of the shell still intact", NEG),
    ("s2", 0.60, f"{EGG}, the same egg BREAKING APART: (the fracture widened, the crust crumbling away in a patch, a "
                 "section of crust sagging and melting:1.4), molten magma exposed in the gap, loose glowing fragments "
                 "falling, the shell still mostly whole", NEG),
    ("s3", 0.65, f"{EGG}, the same egg BURST OPEN: (a large section of the crust melted and fallen away, a wide molten "
                 "opening:1.4), blazing magma light pouring out, (a glimpse of small glowing orange dragon scales and a "
                 "closed eye inside the opening:1.3), broken crust pieces at the base", NEG_OPEN),
]
REMNANTS = ("(a pile of broken dark lava-crust eggshell fragments lying on the ground:1.5), cracked shell halves and "
            "cooled crust pieces heaped together, faint orange glow in the seams, no whole egg, no creature, "
            "clean plain white background, centered, highly detailed, cinematic lighting")
NEG_REM = "whole egg, intact egg, dragon, creature, animal, text, watermark, blurry, low quality"


def work(dragon):
    return os.path.join(M.HERE, "work", f"{dragon}-eggchain")


def region_mask(changed, egg_alpha, grow_frac, w):
    """The paintable region for the next state: the damage so far, grown outward (fraction of the
    egg's width), clipped to the shell. Everything outside stays pixel-identical."""
    from scipy import ndimage as ndi
    m = ndi.binary_dilation(changed, iterations=max(1, int(grow_frac * w))) & egg_alpha
    return Image.fromarray((m * 255).astype("uint8"), "L")


def candidates(dragon, seeds, s0_seed=None):
    """S0 once (solid crust, best of seeds unless --s0 fixes it); then per seed a CONTAINED chain:
    each state is an inpaint of the previous one inside the damage-so-far grown by a margin, so the
    model authors the fracture but cannot re-style the rest of the egg (chained full passes
    posterised S2/S3 into stained glass, 9/5). Remnants: their own generation with S0 as reference."""
    import numpy as np
    t = M.cc().TIERS["daily"]
    W = work(dragon)
    os.makedirs(W, exist_ok=True)
    egg = Image.open(os.path.join(M.ART, f"egg-{dragon}.webp")).convert("RGBA")
    plate, _ = M.place_on_canvas(egg, M.EGG_GEN_H)
    plate_path = M.save_png(plate, os.path.join(W, "plate.png"))
    s0_seed = s0_seed or seeds[0]
    s0_png = os.path.join(W, f"s0_{s0_seed}.png")
    if not os.path.exists(s0_png):
        name, dn, prompt, neg = STATES[0]
        out = M.generate(M.cc().build_img2img(t, prompt, neg, M.stage(plate_path), dn, s0_seed, f"dm_egg_s0_{s0_seed}"), f"s0 seed {s0_seed}")
        M.copy_out(out, s0_png)
        M.save_png(M.rembg_rgba(s0_png), os.path.join(W, f"s0_{s0_seed}_rgba.png"))
    s0_rgba = Image.open(os.path.join(W, f"s0_{s0_seed}_rgba.png")).convert("RGBA")
    egg_alpha = np.asarray(s0_rgba)[:, :, 3] > 128
    x0, y0, x1, y1 = M.alpha_bbox(s0_rgba)
    w, h = x1 - x0, y1 - y0
    rows = []
    for seed in seeds:
        row = [os.path.join(W, f"s0_{s0_seed}_rgba.png")]
        prev_png = s0_png
        for k, (name, dn, prompt, neg) in enumerate(STATES[1:], start=1):
            if k == 1:
                # the first fracture starts in a patch on the upper front of the shell
                changed = np.zeros_like(egg_alpha)
                changed[int(y0 + h * 0.12):int(y0 + h * 0.55), int(x0 + w * 0.30):int(x0 + w * 0.68)] = True
                changed &= egg_alpha
                mask = region_mask(changed, egg_alpha, 0.0, w)
            else:
                changed = M.crack_pixels(prev_png, s0_png) & egg_alpha
                mask = region_mask(changed, egg_alpha, {2: 0.10, 3: 0.16}[k], w)
            mpath = M.save_png(mask, os.path.join(W, f"{name}_{seed}_mask.png"))
            strength = {1: 0.80, 2: 0.80, 3: 0.85}[k]
            out = M.generate(M.cc().build_sdxl_inpaint(t, prompt, neg, M.stage(prev_png), M.stage(mpath), strength, seed,
                                                       f"dm_egg_{name}_{seed}", grow=6), f"{name} seed {seed}")
            dest = M.copy_out(out, os.path.join(W, f"{name}_{seed}.png"))
            M.save_png(M.rembg_rgba(dest), os.path.join(W, f"{name}_{seed}_rgba.png"))
            row.append(os.path.join(W, f"{name}_{seed}_rgba.png"))
            prev_png = dest
        # remnants: txt2img with S0 as the identity reference (img2img of the egg made a chicken egg)
        wf = M.cc().build_ipadapter(t, REMNANTS, NEG_REM, M.stage(s0_png), 0.55, 1024, 768, seed, f"dm_egg_rem_{seed}")
        wf["22"]["inputs"]["start_at"] = 0.2
        out = M.generate(wf, f"remnants seed {seed}")
        dest = M.copy_out(out, os.path.join(W, f"rem_{seed}.png"))
        M.save_png(M.rembg_rgba(dest), os.path.join(W, f"rem_{seed}_rgba.png"))
        row.append(os.path.join(W, f"rem_{seed}_rgba.png"))
        rows.append(row)
    pl = M.Pipeline(types.SimpleNamespace(dragon=dragon, seed_bump=0, neg="", only=[], resume=True, dry_run=False,
                                          style="painterly", variant="eggchain"))
    pl.contact([p for row in rows for p in row], os.path.join(W, "contact.png"), cols=5, cell=300,
               labels=[f"seed {s} {n}" for s in seeds for n in ("S0", "S1", "S2", "S3", "remnants")])


def pick(dragon, files):
    """files: dict state -> candidate stem (e.g. {'s0': 's0_4243', 's1': 's1x_4246', ...}) -> states/"""
    import shutil
    W = work(dragon)
    S = os.path.join(W, "states")
    os.makedirs(S, exist_ok=True)
    for name, stem in files.items():
        shutil.copyfile(os.path.join(W, f"{stem}_rgba.png"), os.path.join(S, f"{name}_rgba.png"))
        if os.path.exists(os.path.join(W, f"{stem}.png")):
            shutil.copyfile(os.path.join(W, f"{stem}.png"), os.path.join(S, f"{name}.png"))
    print(f"picked {files} -> {S}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dragon", default="ember")
    ap.add_argument("--seeds", default="4242,4243,4244")
    ap.add_argument("--pick", type=int, default=0)
    ap.add_argument("--s0", type=int, default=0, help="seed of the S0 to build every chain on")
    a = ap.parse_args()
    if a.pick:
        pick(a.dragon, a.pick)
    else:
        candidates(a.dragon, [int(s) for s in a.seeds.split(",")], s0_seed=a.s0 or None)
