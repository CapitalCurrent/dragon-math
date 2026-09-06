"""The egg that only cracks (Ryan 9/6): dark scale crust, warmth = the glowing plate edges, NO plates lost,
no interior shown. A crack lights up along the seam network from one point, spreads and widens over the three
answers, and the whole shell is glowing-hot when it hatches. Deterministic - no model, nothing invented.

  python eggcrack.py --install realistic,graphic-novel,painterly
"""
import os, sys, argparse, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
import morph as M, eggchain as E

PER_RUMBLE = 12
DARK = 0.28          # plate centres keep this much of their brightness
RIM_PX = 5           # the edge-lit rim inside each plate, from its seam


def seams_by_thinness(lum, alpha):
    """thin bright structures = the seams; a plate's glowing centre is bright but WIDE, so it stays a plate"""
    th = lum - ndi.grey_opening(lum, size=(9, 9))
    return (th > 28) & alpha


def dark_crust(a, alpha):
    lum = a[:, :, :3].max(axis=2)
    seam = seams_by_thinness(lum, alpha)
    plates = alpha & ~seam
    med = ndi.median_filter(a[:, :, :3], size=(7, 7, 1))
    a = a.copy(); a[:, :, :3] = np.where(plates[:, :, None], a[:, :, :3] * 0.35 + med * 0.65, a[:, :, :3])
    dist = ndi.distance_transform_edt(plates)
    d = np.clip(dist / RIM_PX, 0, 1)                       # 0 at the seam edge -> 1 inside the plate
    k = np.where(plates, 1 - (1 - DARK) * d, 1.0)
    out = a.copy(); out[:, :, :3] *= k[:, :, None]
    # plate interiors read WARM and dark: no green/blue speckle from the old highlights
    r = out[:, :, 0]
    out[:, :, 1] = np.where(plates, np.minimum(out[:, :, 1], r * 0.55), out[:, :, 1])
    out[:, :, 2] = np.where(plates, np.minimum(out[:, :, 2], r * 0.30), out[:, :, 2])
    # a soft gloss on every plate, upper-left
    gloss = ndi.gaussian_filter(plates.astype(float), 2) * np.clip(1 - dist / 3.5, 0, 1) * 18
    out[:, :, :3] = np.clip(out[:, :, :3] + gloss[:, :, None] * np.array([1, 0.65, 0.4]), 0, 255)
    return out, seam


def geodesic_order(mask, origin):
    order = np.full(mask.shape, np.inf); front = np.zeros_like(mask); front[origin] = True
    if not (front & mask).any():
        ys, xs = np.where(mask); k = np.argmin((ys - origin[0]) ** 2 + (xs - origin[1]) ** 2)
        front[:] = False; front[ys[k], xs[k]] = True
    reached = front.copy(); order[front] = 0; step = 0
    while True:
        step += 1
        nxt = ndi.binary_dilation(reached, iterations=1) & mask & ~reached
        if not nxt.any(): break
        order[nxt] = step; reached |= nxt
        if step > 6000: break
    return order


def build(dragon):
    W = E.work(dragon); F = os.path.join(W, "frames"); os.makedirs(F, exist_ok=True)
    egg = Image.open(os.path.join(M.ART, f"egg-{dragon}.webp")).convert("RGBA")
    placed = M.place_on_canvas(egg, M.EGG_GEN_H)[1].convert("RGBA")
    a = np.asarray(placed).astype(float); alpha = a[:, :, 3] > 64
    base, seam = dark_crust(a, alpha)
    # the crack runs along the seams (crust splits between scales), from a point on the upper front
    x0, y0, x1, y1 = M.alpha_bbox(placed); w, h = x1 - x0, y1 - y0
    seam_net = ndi.binary_dilation(seam, iterations=1) & alpha
    # the crack TRAVELS on a well-connected version of the network (seams as drawn are fragmented) but
    # only the thin seams light up
    travel = ndi.binary_dilation(seam, iterations=4) & alpha
    order = geodesic_order(travel, (int(y0 + h * 0.22), int(x0 + w * 0.46)))
    ends = [(0.55, 0.20), (0.62, 0.78), (0.86, 0.40), (0.80, 0.66), (0.40, 0.30), (0.95, 0.56)]
    path = np.zeros_like(alpha)
    fin0 = np.isfinite(order)
    for fy, fx in ends:
        ty, tx = int(y0 + h * fy), int(x0 + w * fx)
        ys, xs = np.where(fin0); k = np.argmin((ys - ty) ** 2 + (xs - tx) ** 2); y, x = int(ys[k]), int(xs[k])
        for _ in range(20000):                       # walk downhill on the geodesic order back to the origin
            path[y, x] = True
            if order[y, x] == 0: break
            best = None
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < order.shape[0] and 0 <= xx < order.shape[1] and order[yy, xx] < order[y, x]:
                        if best is None or order[yy, xx] < order[best]: best = (yy, xx)
            if best is None: break
            y, x = best
    path = ndi.binary_dilation(path, iterations=1) & alpha
    order[~path] = np.inf
    fin = np.isfinite(order); reach = order[fin]
    print(f"  crack path {int(path.sum())} px, {len(ends)} branches")
    total = 3 * PER_RUMBLE
    # each answer lights an equal THIRD of the network (by pixels reached), not equal steps
    qs = np.quantile(reach, np.linspace(0, 1, total + 1)[1:])
    frames = [base]
    for k, q in enumerate(qs):
        t = (k + 1) / total
        hot = fin & (order <= q)
        age = np.zeros(order.shape); age[hot] = np.clip((q - order[hot]) / max(q, 1), 0, 1)
        # the crack widens as it ages: up to +3 px, and glows brighter
        wide = hot.copy()
        for i in range(1, 3):
            wide |= ndi.binary_dilation(hot & (age > i / 2.5), iterations=i)
        wide &= alpha
        soft = ndi.gaussian_filter(wide.astype(float), 0.8)
        f = base.copy()
        hotcol = np.array([255, 235, 150]) if t < 0.67 else np.array([255, 245, 190])
        f[:, :, :3] = f[:, :, :3] * (1 - soft[:, :, None]) + hotcol * soft[:, :, None]
        bloom = ndi.gaussian_filter(wide.astype(float), 5 + 4 * t) * (0.9 + 0.7 * t)
        f[:, :, :3] = np.clip(f[:, :, :3] + bloom[:, :, None] * np.array([255, 120, 30]), 0, 255)
        # the whole shell warms as it nears the hatch
        f[:, :, :3] = np.clip(f[:, :, :3] * (1 + 0.10 * t), 0, 255)
        frames.append(f)
    for i, fr in enumerate(frames):
        im = Image.fromarray(np.clip(fr, 0, 255).astype(np.uint8), "RGBA")
        M.save_png(im, os.path.join(F, f"egg_{i}_gen_rgba.png"))
        bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, (0, 0), im.split()[3]); M.save_png(bg, os.path.join(F, f"egg_{i}.png"))
        M.save_png(M.place_on_canvas(im, M.H_EGG)[1], os.path.join(F, f"egg_{i}_rgba.png"))
    # strip for the vet
    ks = [0, 6, 12, 18, 24, 30, 36]; cell = 230; sheet = Image.new("RGB", (cell * len(ks), cell), (70, 70, 80))
    for j, k in enumerate(ks):
        im = Image.open(os.path.join(F, f"egg_{k}_gen_rgba.png")).convert("RGBA"); im = im.crop(M.alpha_bbox(im)); im.thumbnail((cell, cell))
        sheet.paste(im, (j * cell + (cell - im.width) // 2, cell - im.height), im)
    sheet.save(os.path.join(W, "crack_strip.png"))
    print(f"{len(frames)} egg frames -> {F}  (remnants kept: {os.path.exists(os.path.join(F, 'remnants_rgba.png'))})")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--dragon", default="ember"); ap.add_argument("--install", default="")
    a = ap.parse_args(); build(a.dragon)
    for v in [x for x in a.install.split(",") if x]:
        dst = os.path.join(M.HERE, "work", f"{a.dragon}-{v}", "eggs")
        if os.path.exists(dst): shutil.rmtree(dst)
        shutil.copytree(os.path.join(E.work(a.dragon), "frames"), dst); print("installed ->", dst)
