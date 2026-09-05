"""Vet stage: measure every generated frame and flag the ones that need a reroll.

Checks (all on the RGBA outputs under work/<dragon>/):
  edge      subject alpha touches the canvas edge            -> CROPPED (the exact bug from v2.7)
  floor     subject's feet drift off the shared floor line   -> the dragon would hop between answers
  centre    horizontal centre drifts                          -> ditto, sideways
  growth    height is not monotonic across the growth frames -> a frame that shrinks reads as a glitch
  jump      visual distance to the neighbours is an outlier  -> the morph pass produced something else
  colour    masked hue/saturation far from the adult's       -> identity drift (orange -> brown/blue)
  blueeye   blue pixels inside the head box                  -> the golden-eye -> blue drift
  mouth     open frame differs from closed OUTSIDE the mouth box, or not INSIDE it -> bad inpaint
  caption   Florence-2 caption lacks "dragon" or mentions people / several dragons (needs ComfyUI up)
Outputs: work/<dragon>/vet/report.md, contact.png (flags under each frame), reroll.json (indices).
"""
import json, os, time, uuid
import numpy as np
from PIL import Image

import morph as M

THUMB = 160
JUMP_RATIO = 1.8      # a step this many times the median step is a jump (was 2.2 before the gradual law)
DETOUR_RATIO = 1.15   # frame b is a detour when a->b and b->c both exceed a->c by this factor
EGG_JUMP = 3.0        # only 3 egg steps: a ratio on their median is noisy; crack persistence is the real check
FRINGE_MAX = 0.18     # soft-edge px / opaque px above this = smudgy cutout (a clean lift measured 8.7%)
CRACK_KEEP = 0.85     # share of frame i's crack pixels that must still be crack in frame i+1
CRACK_GROW = 1.05     # frame i+1's crack area must be at least this times frame i's
BANNED = ("person", "people", "man ", "woman", "child", "human", "two dragons", "three dragons", "dragons ",
          "figure", "toy", "statue")


def masked_hsv(rgba):
    a = np.asarray(rgba.convert("RGBA"))
    hsv = np.asarray(rgba.convert("RGB").convert("HSV")).astype(float)
    m = a[:, :, 3] > 128
    if m.sum() == 0:
        return 0.0, 0.0
    # circular mean of hue: red (~0) mixed with purple shading (~290) must NOT average to green
    h = hsv[:, :, 0][m] * (2 * np.pi / 255)
    ang = np.degrees(np.arctan2(np.sin(h).mean(), np.cos(h).mean())) % 360
    return float(ang), float(hsv[:, :, 1][m].mean()) / 255


def blue_fraction(rgba, box):
    x0, y0, x1, y1 = [int(v) for v in box]
    crop = rgba.crop((x0, y0, x1, y1))
    a = np.asarray(crop.convert("RGBA"))[:, :, 3] > 128
    hsv = np.asarray(crop.convert("RGB").convert("HSV")).astype(float)
    h = hsv[:, :, 0] * 360 / 255
    blue = (h > 190) & (h < 250) & (hsv[:, :, 1] > 90) & (hsv[:, :, 2] > 70) & a
    return float(blue.sum()) / max(1, a.sum())


def thumb(rgba):
    """(grey image, alpha mask) at thumbnail size."""
    im = rgba.convert("RGBA").resize((THUMB, int(THUMB * M.H / M.W)), Image.BILINEAR)
    bg = Image.new("RGBA", im.size, (128, 128, 128, 255))
    bg.alpha_composite(im)
    return np.asarray(bg.convert("L")).astype(float), np.asarray(im)[:, :, 3] > 64


def step_distance(ta, tb):
    """Mean abs difference PER SUBJECT PIXEL (over the union of both alphas), so a big dragon and a
    tiny newborn are judged by the same yardstick - on the whole canvas the raw difference simply
    grows with the subject's area (1.7 at the newborn -> 12 at the adult on 9/5, all flagged 'jump')."""
    (ga, ma), (gb, mb) = ta, tb
    union = ma | mb
    if not union.any():
        return 0.0
    return float(np.abs(ga - gb)[union].mean())


def region_diff(closed, opened, box):
    """Mean abs diff (0..255) inside and outside the mouth box between the closed and open frame."""
    c = np.asarray(closed.convert("RGBA")).astype(float)
    o = np.asarray(opened.convert("RGBA")).astype(float)
    d = np.abs(c[:, :, :3] - o[:, :, :3]).mean(axis=2)
    alpha = np.maximum(c[:, :, 3], o[:, :, 3]) > 64
    # 'inside' includes the registration feather band around the box (chomp's register_open uses
    # 14 px + blur), so 'outside' only measures pixels that must be byte-identical
    inside = np.zeros_like(alpha)
    x0, y0, x1, y1 = [int(v) for v in box]
    pad = 32
    inside[max(0, y0 - pad):y1 + pad, max(0, x0 - pad):x1 + pad] = True
    din = d[inside & alpha].mean() if (inside & alpha).any() else 0.0
    dout = d[~inside & alpha].mean() if (~inside & alpha).any() else 0.0
    return float(din), float(dout)


def caption(pl, png):
    """Florence-2 detailed caption via the studio (returns '' when ComfyUI is not up)."""
    cc = M.cc()
    try:
        cc.get("/system_stats")
    except Exception:
        return ""
    name = cc.stage_image(png)
    wf = cc.build_florence_caption(name, task="detailed_caption", seed=uuid.uuid4().int % (2 ** 31))
    pid = cc.post("/prompt", {"prompt": wf})["prompt_id"]
    t0 = time.time()
    while time.time() - t0 < 300:
        time.sleep(1.5)
        h = cc.get(f"/history/{pid}")
        if pid in h and h[pid].get("outputs"):
            try:
                return h[pid]["outputs"]["4"]["text"][0]
            except (KeyError, IndexError):
                return ""
        if pid in h and h[pid].get("status", {}).get("status_str") == "error":
            return ""
    return ""


def vet_dragon(pl):
    out_dir = pl.p("vet")
    os.makedirs(out_dir, exist_ok=True)
    mouths = M.load_json(pl.p("chomp", "mouth.json"), {})
    rows, flags_by_idx, thumbs = [], {}, {}

    growth = [(i, pl.p("morph", f"f{i:02d}_rgba.png")) for i in range(len(M.GROWTH_P))]
    growth = [(i, p) for i, p in growth if os.path.exists(p)]
    if not growth:
        M.log("  nothing to vet: run --stage morph first")
        return
    imgs = {i: Image.open(p).convert("RGBA") for i, p in growth}
    adult_h, adult_s = masked_hsv(imgs[growth[-1][0]])

    # per-frame geometry + colour
    prev_h = 0
    for i, p in growth:
        im = imgs[i]
        flags = []
        bb = M.alpha_bbox(im)
        x0, y0, x1, y1 = bb
        hfrac = (y1 - y0) / M.H
        bottom = y1 / M.H
        cx = (x0 + x1) / 2 / M.W
        # growth frames were placed by the pipeline (keys passed the 2% gate at txt2img time), so only
        # REAL clipping counts here: alpha within 0.5% of the canvas edge
        bb_x0, bb_y0, bb_x1, bb_y1 = bb
        touch = [s for s, hit in (("left", bb_x0 < M.W * 0.005), ("top", bb_y0 < M.H * 0.005),
                                  ("right", bb_x1 > M.W * 0.995), ("bottom", bb_y1 > M.H * 0.995)) if hit]
        if touch:
            flags.append(f"edge:{'/'.join(touch)}")
        if abs(bottom - M.FLOOR) > 0.035:          # redrawn legs land a little under the placed floor
            flags.append(f"floor:{bottom:.2f}")
        if abs(cx - 0.5) > 0.05:
            flags.append(f"centre:{cx:.2f}")
        if hfrac + 0.04 < prev_h:                  # bbox height also swings with the wing pose
            flags.append(f"growth:{hfrac:.2f}<{prev_h:.2f}")
        prev_h = max(prev_h, hfrac)
        hue, sat = masked_hsv(im)
        dh = min(abs(hue - adult_h), 360 - abs(hue - adult_h))
        if dh > 18 or sat < adult_s * 0.6:
            flags.append(f"colour:h{hue:.0f}/s{sat:.2f}")
        # fringe: too much semi-transparent edge = a smudgy cutout (shadow or halo) on the cave
        al = np.asarray(im)[:, :, 3]
        soft = float(((al > 20) & (al <= 230)).sum()) / max(1, (al > 230).sum())
        if soft > FRINGE_MAX:
            flags.append(f"fringe:{soft*100:.0f}%")
        mi = mouths.get(str(i))
        if mi and mi.get("eye"):
            # only where the eye itself was located: head/chest boxes read Ember's navy chest as
            # "blue eyes" on every painterly frame 9/5
            bf = blue_fraction(im, mi["eye"])
            if bf > 0.08:
                flags.append(f"blueeye:{bf*100:.1f}%")
            open_p = pl.p("chomp", f"f{i:02d}_open_rgba.png")
            if os.path.exists(open_p):
                din, dout = region_diff(im, Image.open(open_p).convert("RGBA"), mi["mouth"])
                if din < 10:
                    flags.append(f"mouth:unchanged({din:.0f})")
                if dout > 6:
                    flags.append(f"mouth:leak({dout:.0f})")
            else:
                flags.append("mouth:missing")
        thumbs[i] = thumb(im)
        rows.append({"i": i, "p": M.GROWTH_P[i], "h": round(hfrac, 3), "bottom": round(bottom, 3), "cx": round(cx, 3),
                     "hue": round(hue), "sat": round(sat, 2), "flags": flags})
        flags_by_idx[i] = flags

    # THE GRADUAL LAW (Ryan 9/5): no sudden change anywhere except the hatch. Two checks on the
    # neighbour distances: a JUMP (one step much larger than the typical step) and a DETOUR (frame
    # i+1 is far from BOTH its neighbours while they are close to each other = a frame that wandered
    # off and came back - the morph pass produced something else for one step).
    idx = [i for i, _ in growth]
    dists = {}
    for a, b in zip(idx, idx[1:]):
        dists[(a, b)] = step_distance(thumbs[a], thumbs[b])
    if dists:
        med = float(np.median(list(dists.values())))
        for (a, b), d in dists.items():
            if med > 0 and d > JUMP_RATIO * med:
                for k in (a, b):
                    flags_by_idx[k].append(f"jump:{d:.1f}vs{med:.1f}")
        for a, b, c in zip(idx, idx[1:], idx[2:]):
            skip2 = step_distance(thumbs[a], thumbs[c])
            if dists[(a, b)] > DETOUR_RATIO * skip2 and dists[(b, c)] > DETOUR_RATIO * skip2:
                flags_by_idx[b].append(f"detour:{dists[(a, b)]:.1f}/{dists[(b, c)]:.1f}vs{skip2:.1f}")
    for r in rows:
        r["flags"] = flags_by_idx[r["i"]]

    # captions (optional: needs ComfyUI up; skipped silently otherwise)
    caps = {}
    if not getattr(pl.a, "no_caption", False):
        for i, p in growth:
            src = pl.p("morph", f"f{i:02d}.png")
            c = caption(pl, src) if os.path.exists(src) else ""
            if c:
                caps[i] = c
                low = c.lower()
                if "dragon" not in low:
                    flags_by_idx[i].append("caption:no-dragon")
                for w in BANNED:
                    if w in low:
                        flags_by_idx[i].append(f"caption:{w.strip()}")
                        break

    # eggs: geometry + the gradual law on the crack steps + crack persistence
    egg_rows, egg_thumbs, egg_crack_notes = [], {}, []
    for i in range(len(M.EGG_P)):
        p = pl.p("eggs", f"egg_{i}_rgba.png")
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert("RGBA")
        bb = M.alpha_bbox(im)
        f = []
        if M.edge_contact(im):
            f.append("edge")
        if abs(bb[3] / M.H - M.FLOOR) > 0.03:
            f.append(f"floor:{bb[3]/M.H:.2f}")
        egg_thumbs[i] = thumb(im)
        egg_rows.append({"i": i, "flags": f})
    # crack persistence: frame i's crack pixels must still differ from the intact egg in frame i+1
    # (>= CRACK_KEEP of them), and the crack must GROW (area up by >= CRACK_GROW)
    intact = pl.p("eggs", "egg_0.png")
    cracks = {}
    for i in range(1, len(M.EGG_P)):
        p = pl.p("eggs", f"egg_{i}.png")
        if os.path.exists(p) and os.path.exists(intact):
            cracks[i] = M.crack_pixels(p, intact)
    for i in sorted(cracks):
        j = i + 1
        if j not in cracks:
            continue
        ci, cj = cracks[i], cracks[j]
        keep = float((ci & cj).sum()) / max(1, ci.sum())
        growth_ratio = float(cj.sum()) / max(1, ci.sum())
        for r in egg_rows:
            if r["i"] == j:
                if keep < CRACK_KEEP:
                    r["flags"].append(f"crack:lost({keep*100:.0f}%kept)")
                if growth_ratio < CRACK_GROW:
                    r["flags"].append(f"crack:nogrowth(x{growth_ratio:.2f})")
        egg_rows_note = f"egg {i}->{j}: {keep*100:.0f}% of the crack kept, area x{growth_ratio:.2f}"
        egg_crack_notes.append(egg_rows_note)
    egg_d = {(a, b): step_distance(egg_thumbs[a], egg_thumbs[b])
             for a, b in zip(sorted(egg_thumbs), sorted(egg_thumbs)[1:])}
    if len(egg_d) >= 2:
        emed = float(np.median(list(egg_d.values())))
        for (a, b), d in egg_d.items():
            if emed > 0 and d > EGG_JUMP * emed:
                for r in egg_rows:
                    if r["i"] == b:
                        r["flags"].append(f"jump:{d:.1f}vs{emed:.1f}")

    reroll = sorted(i for i, f in flags_by_idx.items() if any(not x.startswith("caption") for x in f))
    M.save_json(os.path.join(out_dir, "reroll.json"), {"growth": reroll,
                                                       "eggs": [r["i"] for r in egg_rows if r["flags"]]})
    with open(os.path.join(out_dir, "report.md"), "w", encoding="utf-8") as f:
        f.write(f"# Vet report - {pl.name}\n\nadult hue {adult_h:.0f} sat {adult_s:.2f}; "
                f"neighbour distance median {np.median(list(dists.values())) if dists else 0:.1f}\n\n")
        f.write("| # | p | height | bottom | cx | hue | sat | flags |\n|---|---|---|---|---|---|---|---|\n")
        for r in rows:
            f.write(f"| {r['i']:02d} | {r['p']} | {r['h']} | {r['bottom']} | {r['cx']} | {r['hue']} | {r['sat']} | "
                    f"{' '.join(r['flags']) or 'ok'} |\n")
        f.write("\n## neighbour distances\n")
        for (a, b), d in dists.items():
            f.write(f"- {a:02d}->{b:02d}: {d:.1f}\n")
        if egg_rows:
            f.write("\n## eggs\n")
            for r in egg_rows:
                f.write(f"- egg {r['i']}: {' '.join(r['flags']) or 'ok'}\n")
            for (a, b), d in egg_d.items():
                f.write(f"- egg {a}->{b}: {d:.1f}\n")
            for n in egg_crack_notes:
                f.write(f"- {n}\n")
        if caps:
            f.write("\n## captions\n")
            for i, c in caps.items():
                f.write(f"- {i:02d}: {c}\n")
        f.write(f"\n## reroll\n`--stage morph --only {','.join(str(i) for i in reroll) or '(none)'} --seed-bump 1`\n")
    labels = [" ".join(flags_by_idx[i]) or "ok" for i, _ in growth]
    pl.contact([p for _, p in growth], os.path.join(out_dir, "contact.png"), labels=labels)
    # closed / open pairs (3 pairs per row) and the egg -> hatchling handover strip
    pairs, plabels = [], []
    for i, p in growth:
        o = pl.p("chomp", f"f{i:02d}_open_rgba.png")
        if os.path.exists(o):
            pairs += [p, o]
            plabels += ["closed", "OPEN"]
    if pairs:
        pl.contact(pairs, os.path.join(out_dir, "pairs.png"), labels=plabels)
    eggs = [pl.p("eggs", f"egg_{i}_rgba.png") for i in range(len(M.EGG_P))]
    strip = [e for e in eggs if os.path.exists(e)] + [p for _, p in growth[:3]]
    if strip:
        pl.contact(strip, os.path.join(out_dir, "eggs.png"), cols=7, cell=260)
    M.log(f"  report -> {os.path.relpath(os.path.join(out_dir, 'report.md'), M.HERE)}")
    M.log(f"  flagged growth frames: {reroll or 'none'}")
