"""Egg REVEAL frames: turn the model-authored states (S0 solid, S2 chunk letting go, S3 burst) into the
egg frame sequence the app plays. Nothing here is generated - every frame is S(prev) with part of
S(next) revealed, in PROPAGATION order (distance along the changed region from an origin), with a
feathered front. So the damage can only grow, and it grows the way a fracture runs.

  python eggreveal.py --dragon ember --states s0_4243,s2_4243,s3_4243 --remnants remy_4246
Writes work/<dragon>-eggchain/frames/egg_{i}[.png|_gen_rgba.png|_rgba.png] for i in 0..N-1 (N = 3
rumbles x FRAMES_PER_RUMBLE + 1) and remnants_rgba.png, then `--install <variant,...>` copies them into
the sets' eggs/ folders.
"""
import argparse, os, sys, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
import morph as M
import eggchain as E

FRAMES_PER_RUMBLE = int(os.environ.get("EGG_PER_RUMBLE", 4))          # frames revealed per answer (the app flips through them on the shake)
FEATHER = 0.12                 # width of the advancing front, as a fraction of the propagation range
DIFF_THR = 26


def changed_region(a_rgba, b_rgba):
    a = np.asarray(a_rgba.convert("RGB")).astype(float)
    b = np.asarray(b_rgba.convert("RGB")).astype(float)
    alpha = (np.asarray(a_rgba)[:, :, 3] > 64) | (np.asarray(b_rgba)[:, :, 3] > 64)
    d = (np.abs(a - b).mean(axis=2) > DIFF_THR) & alpha
    d = ndi.binary_opening(d, iterations=2)
    d = ndi.binary_closing(d, iterations=6)
    d = ndi.binary_fill_holes(d)
    return d


def propagation_order(region, origin):
    """0..1 over the region: geodesic distance from the origin, computed by repeated dilation
    inside the region (a BFS). Pixels of the region the front never reaches get 1.0."""
    order = np.full(region.shape, np.inf)
    front = np.zeros_like(region)
    front[origin] = True
    front &= region
    if not front.any():
        # origin outside the region: start from the region pixel nearest to it
        ys, xs = np.where(region)
        k = np.argmin((ys - origin[0]) ** 2 + (xs - origin[1]) ** 2)
        front[ys[k], xs[k]] = True
    reached = front.copy()
    step = 0
    order[front] = 0
    while True:
        step += 1
        nxt = ndi.binary_dilation(reached, iterations=1) & region & ~reached
        if not nxt.any():
            break
        order[nxt] = step
        reached |= nxt
        if step > 4000:
            break
    o = order[region]
    mx = o[np.isfinite(o)].max() if np.isfinite(o).any() else 1
    out = np.ones(region.shape)
    out[region] = np.where(np.isfinite(o), o / max(mx, 1), 1.0)
    return out


def reveal(prev_rgba, next_rgba, order, region, t):
    """prev with next revealed where order <= t, feathered over FEATHER."""
    w = np.clip((t - order) / FEATHER + 1.0, 0, 1)
    w[~region] = 0
    # soften the front a touch more so it never looks cut
    w = ndi.gaussian_filter(w, 1.2)
    w = w[:, :, None]
    a = np.asarray(prev_rgba).astype(float)
    b = np.asarray(next_rgba).astype(float)
    out = a * (1 - w) + b * w
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def shatter(egg_rgba, pieces=22, seed=7):
    """The remnants pile made FROM THE EGG ITSELF (generated piles came out as chicken eggs or chips):
    the solid crust egg is cut into Voronoi shards, each shard is dropped into a heap on the floor
    line with a random tilt and a darkened broken edge, biggest shards at the bottom."""
    import random
    from PIL import ImageDraw
    rnd = random.Random(seed)
    x0, y0, x1, y1 = M.alpha_bbox(egg_rgba)
    w, h = x1 - x0, y1 - y0
    seeds = [(rnd.uniform(x0, x1), rnd.uniform(y0, y1)) for _ in range(pieces)]
    yy, xx = np.mgrid[0:egg_rgba.height, 0:egg_rgba.width]
    d = np.stack([(xx - sx) ** 2 + (yy - sy) ** 2 for sx, sy in seeds])
    cell = d.argmin(axis=0)
    alpha = np.asarray(egg_rgba)[:, :, 3] > 64
    out = Image.new("RGBA", egg_rgba.size, (0, 0, 0, 0))
    floor_y = y1
    cx = (x0 + x1) / 2
    shards = []
    for i in range(pieces):
        m = (cell == i) & alpha
        if m.sum() < 200:
            continue
        ys, xs = np.where(m)
        bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        shard = Image.new("RGBA", (bx1 - bx0, by1 - by0), (0, 0, 0, 0))
        src = egg_rgba.crop((bx0, by0, bx1, by1))
        mask = Image.fromarray((m[by0:by1, bx0:bx1] * 255).astype(np.uint8), "L")
        shard.paste(src, (0, 0), mask)
        # broken edge: darken a 3px rim inside the shard
        rim = ndi.binary_dilation(~m[by0:by1, bx0:bx1], iterations=3) & m[by0:by1, bx0:bx1]
        arr = np.asarray(shard).astype(float)
        arr[rim, :3] *= 0.45
        shard = Image.fromarray(arr.astype(np.uint8), "RGBA")
        sc = rnd.uniform(0.45, 0.7)
        shard = shard.resize((max(2, int(shard.width * sc)), max(2, int(shard.height * sc))), Image.LANCZOS)
        shard = shard.rotate(rnd.uniform(-90, 90), expand=True, resample=Image.BICUBIC)
        shards.append((m.sum(), shard))
    shards.sort(key=lambda s: -s[0])            # biggest first = bottom of the heap
    spread = w * 0.75
    for k, (_, shard) in enumerate(shards):
        px = int(cx + rnd.uniform(-spread / 2, spread / 2) - shard.width / 2)
        lift = int(k * h * 0.006 + rnd.uniform(0, h * 0.02))      # later shards sit a little higher
        py = int(floor_y - shard.height - lift)
        out.alpha_composite(shard, (max(0, px), max(0, py)))
    return out


def build(dragon, states, remnants):
    W = E.work(dragon)
    F = os.path.join(W, "frames")
    os.makedirs(F, exist_ok=True)
    imgs = [Image.open(os.path.join(W, f"{s}_rgba.png")).convert("RGBA") for s in states]
    # transitions: S0 -> S2 spans TWO rumbles (the chunk letting go is the long event), S2 -> S3 one
    plan = [(0, 1, 2 * FRAMES_PER_RUMBLE), (1, 2, FRAMES_PER_RUMBLE)]
    frames = [imgs[0]]
    for a, b, n in plan:
        region = changed_region(imgs[a], imgs[b])
        ys, xs = np.where(region)
        if len(xs) == 0:
            frames += [imgs[b]] * n
            continue
        if a == 0:
            origin = (int(ys.min()), int(xs[ys.argmin()]))            # the fracture starts at the top of the damage
        else:
            cy, cx = int(ys.mean()), int(xs.mean())                  # the burst grows out from the opening's centre
            origin = (cy, cx)
        order = propagation_order(region, origin)
        for k in range(1, n + 1):
            t = k / n
            # Iona 9/5: LINEAR pacing, so answer 1 shows only the fracture and answer 2 the chunk
            te = t if os.environ.get("EGG_LINEAR") else 1 - (1 - t) ** 1.6
            fr = reveal(imgs[a], imgs[b], order, region, te) if k < n else imgs[b]
            frames.append(fr)
    for i, fr in enumerate(frames):
        # brightness ramp so the whole egg warms as it opens
        from PIL import ImageEnhance
        ramp = 1.0 + 0.16 * i / max(1, len(frames) - 1)
        rgb = ImageEnhance.Brightness(fr.convert("RGB")).enhance(ramp)
        fr2 = Image.merge("RGBA", (*rgb.split(), fr.split()[3]))
        M.save_png(fr2, os.path.join(F, f"egg_{i}_gen_rgba.png"))
        bg = Image.new("RGB", (M.W, M.H), (255, 255, 255)); bg.paste(fr2, (0, 0), fr2)
        M.save_png(bg, os.path.join(F, f"egg_{i}.png"))
        M.save_png(M.place_on_canvas(fr2, M.H_EGG)[1], os.path.join(F, f"egg_{i}_rgba.png"))
    rem = shatter(imgs[0]) if remnants == "shatter" else Image.open(os.path.join(W, f"{remnants}_rgba.png")).convert("RGBA")
    M.save_png(rem, os.path.join(F, "remnants_gen_rgba.png"))
    M.save_png(M.place_on_canvas(rem, M.H_EGG * 0.55)[1], os.path.join(F, "remnants_rgba.png"))
    print(f"{len(frames)} egg frames + remnants -> {F}")
    return len(frames)


def install(dragon, variants, n):
    W = E.work(dragon)
    F = os.path.join(W, "frames")
    for v in variants:
        dst = os.path.join(M.HERE, "work", f"{dragon}-{v}", "eggs")
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(F, dst)
        print("installed ->", dst)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dragon", default="ember")
    ap.add_argument("--states", default="s0_4243,s2_4243,s3_4243")
    ap.add_argument("--remnants", default="remy_4246")
    ap.add_argument("--install", default="", help="comma list of variants to copy the frames into")
    a = ap.parse_args()
    n = build(a.dragon, a.states.split(","), a.remnants)
    if a.install:
        install(a.dragon, a.install.split(","), n)
