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
    "puff":         (0.40, 4,  "it opens its jaws and puffs a thick cloud of {elem_puff} from its mouth that rolls forward and thins out"),
    "breath":       (0.60, 8,  "it opens its jaws wide and breathes a long roaring jet of {elem_jet} to the right, billowing and flickering"),
    "shield":       (0.80, 12, "a swirling {elem_shield} rises around its body and shimmers, then fades"),
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
    x0, y0, x1, y1 = M.alpha_bbox(rgba)
    sub = rgba.crop((x0, y0, x1, y1))
    # the dragon sits in the left 55% so there is room to the right for the effect
    s = min((CH * 0.72) / sub.height, (CW * 0.52) / sub.width)
    sc = sub.resize((max(1, round(sub.width * s)), max(1, round(sub.height * s))), Image.LANCZOS)
    px, py = int(CW * 0.30) - sc.width // 2, int(CH * 0.9) - sc.height
    scene = Image.new("RGB", (CW, CH), (0, 0, 0)); scene.paste(sc, (px, py), sc)
    return scene, (x0, y0, x1, y1), s, (px, py), sc.size


def extract(frame_path, base_rgb, mouth_px, feather_px, whole=False, direction=-1):
    """What brightened vs the still scene, as an RGBA layer for screen blending. Gated from the
    mouth outward in `direction` (-1 = the jet goes LEFT, our canvas facing; the export mirrors it),
    feathered over feather_px so the flame is born at the teeth and nothing appears mid-air.
    `whole` (a shield) keeps everything that brightened."""
    f = np.asarray(Image.open(frame_path).convert("RGB")).astype(float)
    d = np.clip(f - base_rgb, 0, 255)
    alpha = np.clip((d.max(axis=2) - 22) / 110, 0, 1)
    if not whole:
        yy, xx = np.mgrid[0:CH, 0:CW]
        if direction < 0:
            gate = np.clip(((mouth_px[0] + feather_px) - xx) / feather_px, 0, 1)
        else:
            gate = np.clip((xx - (mouth_px[0] - feather_px)) / feather_px, 0, 1)
        alpha *= gate
    alpha = ndi.gaussian_filter(alpha, 1.2)
    rgb = np.clip(d * 1.2, 0, 255)
    return Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")


def run(pl, dragon, powers, frame_override, seed):
    out_root = pl.p("powers")
    mouths = M.load_json(pl.p("chomp", "mouth.json"), {})
    elems = ELEMENTS[dragon]
    for name, (unlock, fidx, tpl) in POWERS.items():
        if powers and name not in powers:
            continue
        i = frame_override if frame_override is not None else fidx
        src = pl.p("morph", f"f{i:02d}_rgba.png")
        if not os.path.exists(src):
            print(f"  {name}: frame {i} missing"); continue
        out_dir = os.path.join(out_root, name)
        os.makedirs(out_dir, exist_ok=True)
        if pl.a.resume and os.path.exists(os.path.join(out_dir, f"f{i:02d}_{FX_N-1}_rgba.png")):
            print(f"  {name}: exists (resume)"); continue
        rgba = Image.open(src).convert("RGBA")
        # the clip's dragon faces LEFT (our canvas), effect goes left; the export mirrors everything.
        scene, bbox, s, (px, py), (sw, sh) = scene_on_black(rgba)
        scene_path = M.save_png(scene, os.path.join(out_dir, f"f{i:02d}_scene.png"))
        m = M.maturity(M.GROWTH_P[i])
        kind = "newborn baby dragon" if m < 0.2 else "young dragon" if m < 0.6 else "large adult dragon"
        motion = tpl.format(**elems).replace("to the right", "to the left")
        prompt = (f"A {kind} stands perfectly still on a pure black background, body and wings motionless, "
                  f"{motion}, static camera, cinematic, the effect is bright against the black")
        args = types.SimpleNamespace(start=scene_path, end="", end_strength=1.0, prompt=prompt,
                                     out=os.path.join(out_dir, f"clip_{i:02d}"), frames=CLIP_FRAMES, fps=24,
                                     width=CW, height=CH, seed=seed, steps=8, timeout=600)
        M.GEN_TIMEOUT = 600
        n = ltx.run(args)
        if n < FX_N:
            print(f"  {name}: clip too short ({n})"); continue
        base = np.asarray(scene).astype(float)
        # mouth anchor in scene pixels (from chomp's canvas-fraction record)
        mi = mouths.get(str(i))
        x0, y0, x1, y1 = bbox
        if mi:
            mx = (mi["cx"] * M.W - x0) * s + px
            my = (mi["cy"] * M.H - y0) * s + py
        else:
            mx, my = px + sw * 0.15, py + sh * 0.35
        picks = [round(k * (n - 1) / (FX_N - 1)) for k in range(FX_N)]
        for k, fi in enumerate(picks):
            layer = extract(os.path.join(out_dir, f"clip_{i:02d}", f"f{fi:03d}.png"), base, (mx, my),
                            feather_px=max(12, sw * 0.08), whole=(name == "shield"), direction=-1)
            # back to the growth frame's canvas by the inverse of the scene placement
            back = Image.new("RGBA", (M.W, M.H), (0, 0, 0, 0))
            lay = layer.resize((round(CW / s), round(CH / s)), Image.LANCZOS)
            back.alpha_composite(lay, (int(x0 - px / s), int(y0 - py / s)))
            M.save_png(back, os.path.join(out_dir, f"f{i:02d}_{k}_rgba.png"))
        M.save_json(os.path.join(out_dir, "meta.json"), {"frame": i, "unlock": unlock, "n": FX_N})
        print(f"  {name}: {FX_N} effect frames from frame {i}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dragon", default="ember")
    ap.add_argument("--variant", required=True)
    ap.add_argument("--style", required=True)
    ap.add_argument("--only", default="")
    ap.add_argument("--frame", type=int, default=None)
    ap.add_argument("--seed", type=int, default=2)
    ap.add_argument("--resume", action="store_true")
    a = ap.parse_args()
    pl = M.Pipeline(types.SimpleNamespace(dragon=a.dragon, seed_bump=0, neg="", only=[], resume=a.resume, dry_run=False,
                                          style=a.style, variant=a.variant))
    run(pl, a.dragon, [p for p in a.only.split(",") if p], a.frame, a.seed)
