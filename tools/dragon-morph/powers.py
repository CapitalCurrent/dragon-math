"""POWERS = effect-only layers from LTX clips (Ryan 9/5): the dragon frame is placed on BLACK, a short
clip of it performing the power is generated, and ONLY what brightened in front of the mouth is kept
(feathered from the mouth anchor outward, so the flame starts at the teeth). The app shows the
open-mouth twin and screen-blends these frames over the scene; the clip's own dragon is never shown.

  python powers.py --variant graphic-novel --style graphic-novel [--only fire_breath] [--frame 12]
Writes work/<dragon>-<variant>/powers/<power>/f{i:02d}_{k}_rgba.png (k = 0..N-1) for the export.
"""
import argparse, os, sys, types, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
import morph as M
import ltx

FX_N = 16            # effect frames kept per power (from a 33-frame clip: the ignition, the jet, the fade)
CLIP_FRAMES = 33
CW, CH = 768, 512

# power id -> (unlock progress, the frame index that performs it, motion prompt template)
# {elem} words come from the dragon's element; the body is told to stay still.
POWERS = {
    "spark":        (0.20, 0,  "it opens its jaws and sputters a small burst of {elem_sparks} from its mouth, a few glowing motes drifting"),
    "puff":         (0.40, 4,  "it opens its jaws and puffs a big glowing cloud of {elem_puff} lit from inside from its mouth, rolling forward to the right and thinning out"),
    "breath":       (0.60, 8,  "it opens its jaws wide and breathes a long roaring jet of {elem_jet} to the right, billowing and flickering"),
    "shield":       (0.80, 12, "a {elem_shield} bursts up from the ground and circles around the dragon at its feet and flanks, spinning and glowing brightly, then dies down"),
    "blast":        (1.00, 16, "it rears its head, opens its jaws wide and unleashes an enormous blast of {elem_blast} to the right, filling the air with light"),
}
ELEMENTS = {
    "ember":   {"elem_sparks": "orange sparks and embers", "elem_puff": "dark smoke with embers", "elem_jet": "bright orange fire",
                "elem_shield": "ring of flame", "elem_blast": "white-hot fire and embers"},
    "frost":   {"elem_sparks": "glittering snowflakes", "elem_puff": "freezing white mist", "elem_jet": "icy blue frost breath with ice crystals",
                "elem_shield": "ring of ice crystals", "elem_blast": "blizzard of ice and snow"},
    "stone":   {"elem_sparks": "pebbles and dust", "elem_puff": "brown dust cloud", "elem_jet": "stream of glowing molten rock",
                "elem_shield": "ring of floating stones", "elem_blast": "eruption of rock and dust"},
    "shadow":  {"elem_sparks": "violet sparks", "elem_puff": "purple smoke", "elem_jet": "beam of crackling violet lightning",
                "elem_shield": "swirling shadow and purple lightning", "elem_blast": "storm of violet lightning and darkness"},
    "glimmer": {"elem_sparks": "golden sparkles", "elem_puff": "glittering golden light", "elem_jet": "beam of brilliant golden light",
                "elem_shield": "halo of golden light", "elem_blast": "explosion of radiant golden light"},
    "storm":   {"elem_sparks": "small electric sparks", "elem_puff": "swirl of wind and rain", "elem_jet": "bolt of blue-white lightning",
                "elem_shield": "swirling wind and lightning", "elem_blast": "massive lightning strike and thunderclouds"},
}
KIND = {"newborn baby dragon": 0.2, "young dragon": 0.6}


def scene_on_black(rgba):
    """The EXPORTED (right-facing) frame on black, dragon in the left part with room to the right."""
    x0, y0, x1, y1 = M.alpha_bbox(rgba)
    sub = rgba.crop((x0, y0, x1, y1))
    s = min((CH * 0.72) / sub.height, (CW * 0.5) / sub.width)
    sc = sub.resize((max(1, round(sub.width * s)), max(1, round(sub.height * s))), Image.LANCZOS)
    px, py = int(CW * 0.28) - sc.width // 2, int(CH * 0.9) - sc.height
    scene = Image.new("RGB", (CW, CH), (0, 0, 0)); scene.paste(sc, (px, py), sc)
    return scene, (x0, y0, x1, y1), s, (px, py), sc.size


def extract(frame_path, base_rgb, mouth_px, feather_px, whole=False, body_mask=None):
    """What brightened vs the still scene, feathered outward from the mouth to the RIGHT (the
    exported facing), as an RGBA layer for screen blending. `whole` keeps everything but the body."""
    f = np.asarray(Image.open(frame_path).convert("RGB")).astype(float)
    d = np.clip(f - base_rgb, 0, 255)
    alpha = np.clip((d.max(axis=2) - 24) / 110, 0, 1)
    yy, xx = np.mgrid[0:CH, 0:CW]
    if not whole:
        gate = np.clip((xx - (mouth_px[0] - feather_px)) / feather_px, 0, 1)
        alpha *= gate
    elif body_mask is not None:
        # a shield lives AROUND the dragon: nothing on its own silhouette (Ryan 9/5: the first one
        # sat on the back of its head and tinted the body)
        alpha *= (1 - body_mask)
    # nothing may show the clip's own canvas border: feather to zero within EDGE of every edge
    EDGE = 0.07
    ex = np.minimum(xx / (CW * EDGE), (CW - 1 - xx) / (CW * EDGE))
    ey = np.minimum(yy / (CH * EDGE), (CH - 1 - yy) / (CH * EDGE))
    alpha *= np.clip(np.minimum(ex, ey), 0, 1)
    alpha = ndi.gaussian_filter(alpha, 1.2)
    rgb = np.clip(d * 1.2, 0, 255)
    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")


def energy(path):
    return float(np.asarray(Image.open(path).convert("RGBA"))[:, :, 3].mean())


def run(pl, dragon, powers, frame_override, seed):
    """Works in EXPORT space: the exported frame (src/assets/art/morph/<dragon>/<style>/fNN.webp) is
    the still, and the effect frames are written at the exported frame's size so the app overlays
    them 1:1 (no mirror, no crop)."""
    out_root = pl.p("powers")
    elems = ELEMENTS[dragon]
    export_dir = os.path.join(M.ART, "morph", dragon, pl.a.style)
    import importlib.util
    manifest = open(os.path.join(export_dir, "index.js"), encoding="utf-8").read()
    for name, (unlock, fidx, tpl) in POWERS.items():
        if powers and name not in powers:
            continue
        i = frame_override if frame_override is not None else fidx
        src = os.path.join(export_dir, f"f{i:02d}.webp")
        if not os.path.exists(src):
            print(f"  {name}: exported frame {i} missing (export the set first)"); continue
        out_dir = os.path.join(out_root, name)
        os.makedirs(out_dir, exist_ok=True)
        if pl.a.resume and not pl.a.reextract and os.path.exists(os.path.join(out_dir, f"f{i:02d}_{FX_N-1}_rgba.png")):
            print(f"  {name}: exists (resume)"); continue
        rgba = Image.open(src).convert("RGBA")
        EW, EH = rgba.size
        scene, bbox, s, (px, py), (sw, sh) = scene_on_black(rgba)
        scene_path = M.save_png(scene, os.path.join(out_dir, f"f{i:02d}_scene.png"))
        # the dragon's silhouette in scene space, grown a little, for the shield's exclusion
        body = np.zeros((CH, CW), dtype=bool)
        sub_a = np.asarray(rgba.crop(bbox).resize((sw, sh), Image.LANCZOS))[:, :, 3] > 64
        body[py:py + sh, px:px + sw] = sub_a
        body = ndi.binary_dilation(body, iterations=6).astype(float)
        m = M.maturity(M.GROWTH_P[i])
        kind = "newborn baby dragon" if m < 0.2 else "young dragon" if m < 0.6 else "large adult dragon"
        motion = tpl.format(**elems)
        prompt = (f"A {kind} stands perfectly still on a pure black background, body and wings motionless, "
                  f"{motion}, the effect is large, bright and vivid against the black, static camera, cinematic")
        # the mouth in scene pixels from the manifest's mouth fraction for this frame
        import re
        mm = re.search(rf"closed: f{i:02d},.*?mouth: \{{ x: ([0-9.]+), y: ([0-9.]+) \}}", manifest)
        fx_, fy_ = (float(mm.group(1)), float(mm.group(2))) if mm else (0.6, 0.35)
        x0, y0, x1, y1 = bbox
        mx = (fx_ * EW - x0) * s + px
        my = (fy_ * EH - y0) * s + py
        best, best_e = None, -1
        prior = M.load_json(os.path.join(out_dir, "meta.json"), {})
        if pl.a.reextract and prior.get("seed") is not None and os.path.isdir(os.path.join(out_dir, f"clip_{i:02d}_{prior['seed']}")):
            cdir = os.path.join(out_dir, f"clip_{i:02d}_{prior['seed']}")
            nfr = len([f for f in os.listdir(cdir) if f.startswith("f") and f.endswith(".png")])
            best, best_e = (prior["seed"], nfr), 1.0
            print(f"  {name}: re-extracting from the existing clip (seed {prior['seed']}, {nfr} frames)")
        for sd in ([] if best else (seed, seed + 1)):
            args = types.SimpleNamespace(start=scene_path, end="", end_strength=1.0, prompt=prompt,
                                         out=os.path.join(out_dir, f"clip_{i:02d}_{sd}"), frames=CLIP_FRAMES, fps=24,
                                         width=CW, height=CH, seed=sd, steps=8, timeout=600)
            M.GEN_TIMEOUT = 600
            n = ltx.run(args)
            if n < FX_N:
                continue
            base = np.asarray(scene).astype(float)
            mid = extract(os.path.join(out_dir, f"clip_{i:02d}_{sd}", f"f{n//2:03d}.png"), base, (mx, my),
                          feather_px=max(12, sw * 0.08), whole=(name == "shield"), body_mask=body)
            e = float(np.asarray(mid)[:, :, 3].mean())
            print(f"  {name} seed {sd}: effect energy {e:.2f}")
            if e > best_e:
                best, best_e = (sd, n), e
        if not best:
            print(f"  {name}: no usable clip"); continue
        sd, n = best
        base = np.asarray(scene).astype(float)
        picks = [round(k * (n - 1) / (FX_N - 1)) for k in range(FX_N)]
        for k, fi in enumerate(picks):
            layer = extract(os.path.join(out_dir, f"clip_{i:02d}_{sd}", f"f{fi:03d}.png"), base, (mx, my),
                            feather_px=max(12, sw * 0.08), whole=(name == "shield"), body_mask=body)
            # back to the exported frame's pixel space: inverse of the scene placement
            back = Image.new("RGBA", (EW, EH), (0, 0, 0, 0))
            lay = layer.resize((round(CW / s), round(CH / s)), Image.LANCZOS)
            back.alpha_composite(lay, (int(x0 - px / s), int(y0 - py / s)))
            M.save_png(back, os.path.join(out_dir, f"f{i:02d}_{k}_rgba.png"))
        # PLACEMENT CHECK (measured, not eyeballed): over the middle frames the effect's centre of mass
        # must sit in front of the mouth (mouth powers) and its overlap with the dragon's own silhouette
        # must be small; a failing power is written but flagged in meta for the review.
        flags = []
        body_export = np.asarray(rgba)[:, :, 3] > 64
        mouth_ex = (fx_ * EW, fy_ * EH)
        # the ignition sits ON the head by definition: ignore a disc around the mouth for the overlap
        yy0, xx0 = np.mgrid[0:EH, 0:EW]
        body_export = body_export & (((xx0 - mouth_ex[0]) ** 2 + (yy0 - mouth_ex[1]) ** 2) > (EW * 0.12) ** 2)
        for k in (FX_N // 3, FX_N // 2, 2 * FX_N // 3):
            a = np.asarray(Image.open(os.path.join(out_dir, f"f{i:02d}_{k}_rgba.png")).convert("RGBA"))[:, :, 3].astype(float) / 255
            if a.sum() < 50:
                flags.append(f"k{k}:no-effect"); continue
            yy, xx = np.mgrid[0:EH, 0:EW]
            cx = float((a * xx).sum() / a.sum()); cy = float((a * yy).sum() / a.sum())
            overlap = float((a * body_export).sum() / a.sum())
            if name != "shield" and cx < mouth_ex[0] - EW * 0.02:
                flags.append(f"k{k}:centre-behind-mouth({cx/EW:.2f}<{mouth_ex[0]/EW:.2f})")
            if overlap > (0.25 if name == "shield" else 0.35):
                flags.append(f"k{k}:on-body({overlap*100:.0f}%)")
        M.save_json(os.path.join(out_dir, "meta.json"), {"frame": i, "unlock": unlock, "n": FX_N, "seed": sd, "space": "export",
                                                          "flags": flags})
        print(f"  {name}: {FX_N} effect frames from frame {i} (seed {sd}) {'FLAGS ' + ' '.join(flags) if flags else 'placement ok'}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dragon", default="ember")
    ap.add_argument("--variant", required=True)
    ap.add_argument("--style", required=True)
    ap.add_argument("--only", default="")
    ap.add_argument("--frame", type=int, default=None)
    ap.add_argument("--seed", type=int, default=2)
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--reextract", action="store_true", help="recompute frames from the clip already on disk")
    a = ap.parse_args()
    pl = M.Pipeline(types.SimpleNamespace(dragon=a.dragon, seed_bump=0, neg="", only=[], resume=a.resume, dry_run=False,
                                          style=a.style, variant=a.variant, reextract=a.reextract))
    run(pl, a.dragon, [p for p in a.only.split(",") if p], a.frame, a.seed)
