#!/usr/bin/env python
"""Dragon Math - egg -> adult MORPH frame pipeline (local ComfyUI on the Arc B580).

Every frame is a NEW generation, but no frame is chained from the previous one, so drift
cannot accumulate. Four keyframes (hatchling / whelp / drake / adult) are generated with the
proven Ember recipe, placed on ONE shared canvas at their true relative sizes on a common
floor line, and every in-between growth frame is diffused from a latent blend of its two
bracketing keyframes (prompt averaged + IPAdapter identity weighted the same way, fixed seed).
The mouth-open variant is an INPAINT of only the mouth box Florence-2 locates, so it
registers pixel-perfect with the closed frame (no union crop, no jump).

Run with the studio's portable python:
  "F:/Software Builds/ComfyUI_Windows_portable/python_standalone/python.exe" morph.py --stage probe
Stages (all resumable, outputs under work/<dragon>/):
  probe   morph test on the EXISTING whelp2/drake sprites (5 frames)  <- run FIRST
  keys    4 keyframes (adult txt2img -> drake -> whelp de-age chain, hatchling hybrid) + fit gate
  plates  rembg + place keyframes on the shared canvas
  eggs    egg plate + 3 crack frames (from the select-screen egg)
  morph   the 17 growth frames (p = 0.20 .. 1.00)
  chomp   Florence head box -> mouth mask -> inpaint "mouth wide open" per frame
  vet     geometry / continuity / colour / mouth checks + contact sheet + report + reroll list
  export  union-crop, webp, src/assets/art/morph/<dragon>/index.js manifest, viewer.html
  all     keys plates eggs morph chomp vet export
Flags: --dry-run (write workflow JSON only, no server) --validate (static node check)
       --only 3,7 (frames to (re)generate) --seed-bump N --denoise 0.5 --init latent|pixel
       --tier photoreal|daily (Juggernaut XL realistic vs DreamShaper Turbo stylised)
"""
import argparse, importlib.util, json, math, os, random, re, shutil, sys, time
import numpy as np
from PIL import Image, ImageDraw

STUDIO = r"F:\Software Builds\ComfyUI_Windows_portable"
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
ART = os.path.join(REPO, "src", "assets", "art")
sys.path.insert(0, HERE)

# ---- the shared canvas ----------------------------------------------------------------
W, H = 1216, 832          # SDXL-native landscape (multiples of 64); wide enough for spread wings
FLOOR = 0.94              # bottom of the subject's alpha sits at 94% of canvas height
EDGE_MARGIN = 0.02        # a keyframe whose alpha touches within 2% of an edge is CROPPED -> reroll
H_HATCH, H_ADULT = 0.30, 0.93   # subject height fractions at maturity 0 and 1 (newborn ~1/10 the adult's area)
H_EGG = 0.36
KEY_M = [0.0, 1.0]              # TWO anchors only (Ryan 9/5): the adult, and the newborn generated AS ITS BABY.
                                # Every other frame is a morph descendant of those two (run.py subdivides:
                                # the midpoint is morphed and promoted to a key, then the quarter points).
GROWTH_P = [round(0.20 + 0.05 * i, 2) for i in range(17)]   # progress values that show a dragon
EGG_P = [round(i * 0.15 / 36, 5) for i in range(37)]      # solid + 36 LTX clip frames (twelve per answer, played on the
                                                       # rumble; the app lands on every 4th = each answer's state)

# The daughter's brief (9/3): REALISTIC, serious-looking dragons - not cute-and-cartoony. A little
# softness is allowed in the hatchling and it drains away with age. The eggs she already likes stay.
# Guard rails learned the hard way: a bare "fierce dragon" prompt drifts demonic / humanoid, so the
# anatomy tokens ("natural quadruped dragon anatomy", "noble") and the negatives below stay in.
FRAMING = ("wings rooted on the back at the shoulder blades behind the front legs, "     # Ryan 9/5 09:10
           "clean plain white background, full body, the entire dragon fully inside the frame with generous "
           "empty space around it, centered, facing the viewer at a three-quarter angle")
STYLES = {
    # Ryan 9/5 03:30: "drawn in somewhat of a graphic novel style" - realistic anatomy and detail, but
    # rendered as inked comic art. (The 'realistic' preset is the photoreal look of the first run.)
    "graphic-novel": ("graphic novel illustration, bold confident ink linework, cel shaded with rich painted "
                      "colour, dramatic comic-book lighting and deep shadows, realistic dragon anatomy, "
                      "natural quadruped dragon anatomy, detailed scales, serious mature comic art style, "
                      + FRAMING),
    "realistic": ("realistic fantasy creature concept art, film-quality creature design, natural quadruped "
                  "dragon anatomy, highly detailed scales, cinematic soft lighting, " + FRAMING),
    # The v2.7 adult Iona liked (ember-adult2.webp): DreamShaper's painterly game-illustration look, the
    # original recipe's tokens verbatim + realistic anatomy. Use with --tier daily.
    "painterly": ("children's storybook fantasy game art, painterly, semi-realistic digital painting, "
                  "collectible card splash art, soft brushwork, glowing rim light, natural quadruped dragon "
                  "anatomy, detailed scales, " + FRAMING),
}
STYLE_NEG = {
    "graphic-novel": "photograph, photorealistic, 3d render, blurry soft painting, chibi, plush toy, sketch, unfinished lines",
    "realistic": "cartoon, chibi, plush toy",
    "painterly": "photograph, 3d render, chibi, plush toy, flat vector",
}
STYLE = STYLES["realistic"]
# The crack frames are low-denoise img2img of the egg she already likes, so the style tokens stay
# neutral: the egg's own look (the frost egg is near-photoreal glass) must survive.
EGG_STYLE = ("highly detailed realistic render, same style as the source, clean plain white background, "
             "centered, the whole egg fully inside the frame")
NEG_BASE = ("cropped, cut off, out of frame, wings cut off by the edge, close-up, text, watermark, "
            "signature, deformed, extra limbs, multiple dragons, two heads, human, humanoid, "
            "person, demonic, gore, background scenery, cave, landscape, "
            "ground shadow, head fin, head sail, ear flaps, fins on the head, jewelry, earring, pendant, necklace, chain, collar, saddle, harness, accessories, "
            "rider")

# Stage templates shared by every dragon: the cuteness drains out as maturity rises, and every
# feature is the SAME feature growing (Ryan 9/5: the baby's horns must become the adult's horns;
# babies are plump, adults sleek and slender). {horns_*} come from each dragon's horn family.
# Every feature is described as ONE feature at four ages (Ryan 9/5: snout, eyes, tail, legs, ridges,
# ears, teeth - all of it must develop the way a real animal's would, never be reinvented per stage).
STAGE_TEMPLATES = {
    1.0: "(mighty adult {adult}:1.3), sleek slender powerful body, lean muscle, long elegant neck, "
         "long tapered snout with a strong jaw and visible fangs, proportionate narrow eyes, long tail, "
         "long powerful legs, tall sharp back ridges, {wings_adult}, "
         "{horns_adult}, serious menacing stare, noble and dangerous, hard weathered scales",
    2/3: "adolescent {drake}, lean body losing its baby fat, longer neck, lengthening snout with small "
         "fangs, eyes a little large for the head, tail growing long, legs lengthening, back ridges "
         "sharpening, {wings_drake}, {horns_drake}, serious alert expression, "
         "slightly oversized head, firming scales",
    1/3: "juvenile {whelp}, chubby round body, plump belly, short neck, short rounded snout, big eyes, "
         "short thick tail, short sturdy legs, small soft back ridges, {wings_whelp}, "
         "{horns_whelp}, big head, curious watchful expression, soft young scales",
    0.0: "(newborn {hatch}:1.3), tiny, (frail weak wobbly newborn:1.2), skinny spindly little legs, soft "
         "round belly, oversized head on a thin neck, short blunt button snout with no teeth, huge round "
         "eyes, thin stubby little tail, soft tiny bumps where the back ridges will grow, "
         "(tiny underdeveloped wing nubs:1.3), {horns_hatch}, sitting unsteadily, still wet from the egg, "
         "wide-eyed and curious, soft translucent young scales",
}
WINGS = {   # wing phrasing per stage; "stubby" dragons never get spread wings
    "full":   ("huge fully grown wings spread wide", "large developing wings", "medium wings"),
    "stubby": ("small stubby wings held close to the body", "small stubby wings", "tiny stubby wings"),
}
# Horn families: (adult, drake, whelp, hatchling) - one shape, four sizes, never a different horn.
HORNS = {
    "ram":     ("large fully curved ram horns", "curving ram horns still growing", "short thick ram horn stubs "
                "just beginning to curve", "two tiny rounded horn buds where ram horns will grow"),
    "antler":  ("tall branching ice antlers", "branching antlers with their first tines", "short forked antler "
                "stubs", "two tiny antler buds"),
    "blunt":   ("short thick blunt stone horns", "short blunt horns", "small blunt horn stubs", "two tiny "
                "blunt horn bumps"),
    "sharp":   ("long thin sharp straight horns", "thin straight horns still growing", "short thin straight "
                "horn spikes", "two tiny needle-like horn points"),
    "spiral":  ("elegant long spiral horns", "spiral horns with their first twist", "short spiral horn stubs",
                "two tiny smooth horn buds"),
    "zigzag":  ("jagged zigzag lightning horns", "zigzag horns with their first jag", "short jagged horn stubs",
                "two tiny jagged horn buds"),
}

# Per-dragon identity, straight from src/data/dragons.js (colours + physiology + stage names).
DRAGONS = {
    "ember": {
        "seed": 4100,
        "anchor": ("Ember the fire dragon, orange and red scales with lava-cracked texture, expressive "
                   "golden eyes, flame-shaped back ridges, fiery glowing tail tip, pointed bat-like wings"),
        "names": ("inferno dragon", "fire drake", "flame whelp", "spark hatchling dragon"),
        "wings": "full", "horns": "ram",
        "shell": "(dark red and orange cooled-lava crust egg shell with thin glowing seams:1.3)",
        "neg": "blue eyes, green",
    },
    "frost": {
        "seed": 4200,
        "anchor": ("Frost the ice dragon, pale icy blue and white crystalline scales, silver-white eyes, "
                   "fin-like ear frills, broad translucent frosted wings, thin whip tail with an ice shard tip, "
                   "frost mist"),
        "names": ("glacial dragon", "blizzard drake", "frost whelp", "snow hatchling dragon"),
        "wings": "full", "horns": "antler",
        "shell": "(deep blue glassy egg shell with silver frost and snowflake patterns:1.3)",
        "neg": "orange, red, fire, warm colours",
    },
    "stone": {
        "seed": 4300,
        "anchor": ("Stone the earth dragon, mossy green and grey stone-textured scales, amber eyes, jagged "
                   "rock plates along the back, thick club tail with a boulder tip, thick trunk-like legs, "
                   "moss and vine patches"),
        "names": ("titan stone dragon", "mountain drake", "boulder whelp", "sprout hatchling dragon"),
        "wings": "stubby", "horns": "blunt",
        "shell": "(grey stone egg shell covered in soft green moss:1.3)",
        "neg": "fire, orange, blue",
    },
    "shadow": {
        "seed": 4400,
        "anchor": ("Shadow the night dragon, deep purple and black scales with edges dissolving into wisps "
                   "of smoke, glowing violet eyes, sinuous serpentine build, narrow head with long fangs, "
                   "tall pointed ears, tall narrow bat wings, extra-long whip tail"),
        "names": ("void dragon", "phantom drake", "night whelp", "shade hatchling dragon"),
        "wings": "full", "horns": "sharp",
        "shell": "(dark purple egg shell with glowing violet vein patterns and wisps of smoke:1.3)",
        "neg": "bright colours, orange, fire, red eyes",
    },
    "glimmer": {
        "seed": 4500,
        "anchor": ("Glimmer the light dragon, luminous golden and white scales, radiant amber-gold eyes, "
                   "feathered angel-like wings, a feather crest along the spine, long flowing ear frills, "
                   "long flowing tail with a plume, graceful build, soft sparkles"),
        "names": ("celestial light dragon", "solar drake", "radiant whelp", "sparkle hatchling dragon"),
        "wings": "full", "horns": "spiral",
        "shell": "(glowing golden egg shell radiating warm light:1.3)",
        "neg": "dark, black, fire, red",
    },
    "storm": {
        "seed": 4600,
        "anchor": ("Storm the lightning dragon, electric blue and cyan scales with a crackling energy "
                   "texture, bright yellow eyes, lightning-bolt shaped spines, jagged storm wings, forked "
                   "lightning tail, aerodynamic swept frills, small electric sparks"),
        "names": ("hurricane storm dragon", "tempest drake", "gale whelp", "breeze hatchling dragon"),
        "wings": "full", "horns": "zigzag",
        "shell": "(stormy blue-grey egg shell crackling with static lightning:1.3)",
        "neg": "fire, orange, red",
    },
}

def _expand(d):
    """Fill the per-maturity descriptors from the templates (once, at import)."""
    adult, drake, whelp, hatch = d["names"]
    wa, wd, ww = WINGS[d["wings"]]
    ha, hd, hw, hh = HORNS[d["horns"]]
    d["m"] = {m: tpl.format(adult=adult, drake=drake, whelp=whelp, hatch=hatch,
                            wings_adult=wa, wings_drake=wd, wings_whelp=ww,
                            horns_adult=ha, horns_drake=hd, horns_whelp=hw, horns_hatch=hh)
              for m, tpl in STAGE_TEMPLATES.items()}
    return d

for _d in DRAGONS.values():
    _expand(_d)

# ---- studio glue -------------------------------------------------------------------------
ccgen = None
def cc():
    global ccgen
    if ccgen is None:
        spec = importlib.util.spec_from_file_location("ccgen", os.path.join(STUDIO, "cc-gen.py"))
        ccgen = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(ccgen)
    return ccgen

TIER_NAME = "photoreal"
def tier():
    return cc().TIERS[TIER_NAME]

def log(*a):
    print(*a, flush=True)

# ---- prompt helpers ----------------------------------------------------------------------
def stage_prompt(d, m):
    """Stage descriptor at maturity m = the nearest keyframe descriptor. Blending between two
    descriptors is done in conditioning space (ConditioningAverage), never by string mixing."""
    k = min(d["m"], key=lambda km: abs(km - m))
    return f"{d['m'][k]}, {d['anchor']}, {STYLE}"

def set_style(name):
    global STYLE
    STYLE = STYLES[name]

def bracket(m, keys=None):
    """Bracketing keyframe maturities (a <= m <= b) and the fraction f toward b."""
    keys = keys or KEY_M
    for a, b in zip(keys, keys[1:]):
        if a - 1e-9 <= m <= b + 1e-9:
            return a, b, 0.0 if b == a else (m - a) / (b - a)
    return keys[-2], keys[-1], 1.0

KEY_TAGS = {0.0: "hatch", 1/3: "whelp", 2/3: "drake", 1.0: "adult"}
def key_tag(m):
    """File tag for a keyframe maturity; promoted mid-keys are k0500 style."""
    for k, tag in KEY_TAGS.items():
        if abs(k - m) < 1e-6:
            return tag
    return f"k{round(m * 1000):04d}"

def maturity(p):
    return (p - GROWTH_P[0]) / (GROWTH_P[-1] - GROWTH_P[0])

# ---- workflow builders (ComfyUI API graphs) ---------------------------------------------
def build_hybrid(t, prompt, neg, image_name, ref_name, denoise, ipa_w, seed, prefix):
    """img2img (proportions from the init) + IPAdapter (identity from the ref) - the hatchling recipe."""
    return {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": t["ckpt"]}},
        "10": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "11": {"class_type": "VAEEncode", "inputs": {"pixels": ["10", 0], "vae": ["4", 2]}},
        "20": {"class_type": "IPAdapterUnifiedLoader", "inputs": {"model": ["4", 0], "preset": "PLUS (high strength)"}},
        "21": {"class_type": "LoadImage", "inputs": {"image": ref_name}},
        "22": {"class_type": "IPAdapter", "inputs": {"model": ["20", 0], "ipadapter": ["20", 1], "image": ["21", 0],
               "weight": ipa_w, "start_at": 0.0, "end_at": 1.0, "weight_type": "standard"}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["4", 1]}},
        "3": {"class_type": "KSampler", "inputs": {"seed": seed, "steps": t["steps"], "cfg": t["cfg"],
              "sampler_name": t["sampler"], "scheduler": t["sched"], "denoise": denoise,
              "model": ["22", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["11", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["8", 0]}},
    }


def build_morph(t, prompt_a, prompt_b, f, neg, plate_a, plate_b, denoise, seed, prefix,
                ipa_w=0.45, init="latent"):
    """One in-between frame: init = blend of the two bracketing keyframe plates (latent or pixel),
    prompt = ConditioningAverage(A, B, f), identity = IPAdapter(A, w*(1-f)) -> IPAdapter(B, w*f)."""
    wf = {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": t["ckpt"]}},
        "10": {"class_type": "LoadImage", "inputs": {"image": plate_a}},
        "11": {"class_type": "LoadImage", "inputs": {"image": plate_b}},
        "6a": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_a, "clip": ["4", 1]}},
        "6b": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_b, "clip": ["4", 1]}},
        # out = to * strength + from * (1 - strength)  -> to=B, strength=f
        "6": {"class_type": "ConditioningAverage", "inputs": {"conditioning_to": ["6b", 0],
              "conditioning_from": ["6a", 0], "conditioning_to_strength": round(f, 4)}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["4", 1]}},
        "20": {"class_type": "IPAdapterUnifiedLoader", "inputs": {"model": ["4", 0], "preset": "PLUS (high strength)"}},
        "22": {"class_type": "IPAdapter", "inputs": {"model": ["20", 0], "ipadapter": ["20", 1], "image": ["10", 0],
               "weight": round(ipa_w * (1 - f), 4), "start_at": 0.0, "end_at": 1.0, "weight_type": "standard"}},
        "23": {"class_type": "IPAdapter", "inputs": {"model": ["22", 0], "ipadapter": ["20", 1], "image": ["11", 0],
               "weight": round(ipa_w * f, 4), "start_at": 0.0, "end_at": 1.0, "weight_type": "standard"}},
        "3": {"class_type": "KSampler", "inputs": {"seed": seed, "steps": t["steps"], "cfg": t["cfg"],
              "sampler_name": t["sampler"], "scheduler": t["sched"], "denoise": denoise,
              "model": ["23", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["14", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["8", 0]}},
    }
    if init == "pixel":
        # blended = image1 * (1 - bf) + image2 * bf  -> bf = f
        wf["15"] = {"class_type": "ImageBlend", "inputs": {"image1": ["10", 0], "image2": ["11", 0],
                    "blend_factor": round(f, 4), "blend_mode": "normal"}}
        wf["14"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["15", 0], "vae": ["4", 2]}}
    else:
        wf["12"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["10", 0], "vae": ["4", 2]}}
        wf["13"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["11", 0], "vae": ["4", 2]}}
        # out = samples1 * bf + samples2 * (1 - bf)  -> samples1=A, bf = 1-f
        wf["14"] = {"class_type": "LatentBlend", "inputs": {"samples1": ["12", 0], "samples2": ["13", 0],
                    "blend_factor": round(1 - f, 4)}}
    return wf


def build_head_box(image_name, prefix, phrase="dragon head"):
    """Florence-2 phrase grounding -> filled bbox mask -> saved as an image we read back locally."""
    return {
        "1": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "2": {"class_type": "DownloadAndLoadFlorence2Model",
              "inputs": {"model": "microsoft/Florence-2-base", "precision": "fp16"}},
        "3": {"class_type": "Florence2Run",
              "inputs": {"image": ["1", 0], "florence2_model": ["2", 0], "text_input": phrase,
                         "task": "caption_to_phrase_grounding", "fill_mask": True, "keep_model_loaded": True,
                         "max_new_tokens": 256, "num_beams": 3, "do_sample": False,
                         "seed": random.randint(1, 2**31)}},
        "4": {"class_type": "MaskToImage", "inputs": {"mask": ["3", 1]}},
        "5": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["4", 0]}},
    }

# ---- image helpers -------------------------------------------------------------------------
def alpha_bbox(rgba):
    a = np.asarray(rgba.convert("RGBA"))[:, :, 3]
    ys, xs = np.where(a > 24)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1

def edge_contact(rgba):
    """Sides whose alpha comes within EDGE_MARGIN of the image edge = the subject is cropped."""
    bb = alpha_bbox(rgba)
    if bb is None:
        return ["empty"]
    w, h = rgba.size
    x0, y0, x1, y1 = bb
    out = []
    if x0 < w * EDGE_MARGIN: out.append("left")
    if y0 < h * EDGE_MARGIN: out.append("top")
    if x1 > w * (1 - EDGE_MARGIN): out.append("right")
    if y1 > h * (1 - EDGE_MARGIN): out.append("bottom")
    return out

def place_on_canvas(rgba, height_frac, floor=FLOOR, bg=(255, 255, 255)):
    """Alpha-crop the subject, scale it to height_frac of the canvas, stand it on the floor line,
    centre it. Returns (white-bg RGB plate, RGBA layer), both W x H."""
    bb = alpha_bbox(rgba)
    sub = rgba.convert("RGBA").crop(bb)
    s = height_frac * H / sub.height
    if sub.width * s > W * 0.92:            # width-limited (spread wings); 0.92 keeps clear of the 2% edge gate
        s = W * 0.92 / sub.width
    sub = sub.resize((max(1, round(sub.width * s)), max(1, round(sub.height * s))), Image.LANCZOS)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x = (W - sub.width) // 2
    y = round(floor * H) - sub.height
    layer.paste(sub, (x, y), sub)
    plate = Image.new("RGB", (W, H), bg)
    plate.paste(sub, (x, y), sub)
    return plate, layer

def height_for(m):
    return H_HATCH + (H_ADULT - H_HATCH) * m

# Mouth presets as fractions of the body's alpha bbox (facing LEFT), used when no eye is found.
# Verified on Ember 9/5: 'adult' lands on the low-carried head of the profile adult; 'young' on the
# whelp's muzzle. (Poses with the head carried high need the eye path.)
MOUTH_PRESET = {"young": (0.02, 0.26, 0.32, 0.48), "adult": (0.30, 0.58, 0.47, 0.74)}

EGG_GEN_H = 0.80           # egg frames are GENERATED at this height, then placed at H_EGG for the game
EGG_BLEND_DENOISE = 0.52   # crack steps: the drawn crack is blended into the crust inside its own mask
EGG_CRUST_DENOISE = 0.65  # frame 0: re-materialise the egg's plates as cooled crust (0.4/0.5 barely changed it 9/5)
EGG_BRIGHTNESS = (1.0, 1.02, 1.05, 1.08, 1.12, 1.17, 1.22)   # the whole egg brightens a notch per crack step

CRACK_THR = 28          # mean |RGB diff| vs the intact egg above this = crack (or its glow)
CRACK_SEED = (0.40, 0.16, 0.60, 0.50)   # first crack's seed patch, fractions of the egg's alpha bbox

def crack_pixels(frame_path, intact_path):
    """Boolean map of where a crack frame differs from the intact egg (frame 0)."""
    a = np.asarray(Image.open(frame_path).convert("RGB")).astype(float)
    b = np.asarray(Image.open(intact_path).convert("RGB")).astype(float)
    return np.abs(a - b).mean(axis=2) > CRACK_THR

def draw_crack(rgba, step, seed=4242):
    """Crack geometry FROM THE EGG'S OWN STRUCTURE (Ryan 9/5 13:10: a line drawn across the plates is
    not realistic - the crust is thin at the seams). Seams (bright) and plates (dark) are segmented by
    colour; a corridor from the top of the shell widens per step; inside it the seams are pushed to
    white-hot and widened (the crust splitting where it is thinnest), the plate edges beside them
    darken (lifting), and from step 5 one or two plates inside the corridor fall out and become the
    hole with a magma core and a drip. Returns (rgba with the crack applied, L mask for blending)."""
    import random
    from PIL import ImageFilter
    from scipy import ndimage as ndi
    rnd = random.Random(seed)
    im = rgba.convert("RGBA").copy()
    arr = np.asarray(im).astype(float)
    alpha = arr[:, :, 3] > 128
    x0, y0, x1, y1 = alpha_bbox(im)
    w, h = x1 - x0, y1 - y0
    hsv = np.asarray(im.convert("RGB").convert("HSV")).astype(float)
    seam = alpha & (hsv[:, :, 2] > 150) & (hsv[:, :, 1] > 90)          # bright orange/yellow = thin seam
    plate = alpha & ~seam
    # the corridor: a jagged path from the top of the shell down the front, widening with the step
    pts = [(0.48, 0.10)]
    for _ in range(7):
        px, py = pts[-1]
        pts.append((min(0.85, max(0.15, px + rnd.uniform(-0.10, 0.10))), min(0.92, py + rnd.uniform(0.08, 0.12))))
    n_pts = {1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8}[min(step, 6)]
    corridor_w = {1: 0.05, 2: 0.07, 3: 0.09, 4: 0.11, 5: 0.13, 6: 0.15}[min(step, 6)] * w
    cor = Image.new("L", im.size, 0)
    ImageDraw.Draw(cor).line([(x0 + p[0] * w, y0 + p[1] * h) for p in pts[:n_pts]], fill=255,
                             width=int(corridor_w), joint="curve")
    cor = np.asarray(cor) > 0
    active = seam & cor
    # widen the active seams as the crack grows (the crust splitting)
    grow_px = {1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5}[min(step, 6)]
    if grow_px:
        active = ndi.binary_dilation(active, iterations=grow_px) & alpha
    out = arr.copy()
    # white-hot core along the active seams, hotter with each step
    heat = {1: 0.35, 2: 0.5, 3: 0.65, 4: 0.8, 5: 0.9, 6: 1.0}[min(step, 6)]
    core = np.array([255, 245, 200, 255], dtype=float)
    out[active] = out[active] * (1 - heat) + core * heat
    # the plate edges beside the active seams darken and lift (a rim 3-6 px into the plates)
    rim = ndi.binary_dilation(active, iterations=3 + step) & plate
    out[rim, :3] *= 0.55
    hole = np.zeros_like(alpha)
    if step >= 5:
        # one (step 5) or two (step 6) plates inside the corridor fall out: pick the largest plate
        # components that touch the corridor around the middle of the path
        lbl, n = ndi.label(plate & ~rim)
        sizes = ndi.sum(plate, lbl, index=range(1, n + 1))
        mid_y = y0 + pts[min(4, n_pts - 1)][1] * h
        cands = []
        for i in range(1, n + 1):
            ys, xs = np.where(lbl == i)
            if len(xs) == 0 or not (cor[ys, xs].any()):
                continue
            cands.append((abs(ys.mean() - mid_y), -sizes[i - 1], i))
        cands.sort()
        for _, _, i in cands[: (1 if step == 5 else 2)]:
            hole |= (lbl == i)
        hole = ndi.binary_dilation(hole, iterations=2) & alpha
        # magma gradient inside the hole: dark rim -> orange -> white-hot centre (by distance from the edge)
        dist = ndi.distance_transform_edt(hole)
        if dist.max() > 0:
            t = np.clip(dist / dist.max(), 0, 1)
            stops = [(0.0, (35, 12, 5)), (0.25, (200, 60, 10)), (0.55, (255, 140, 30)), (0.8, (255, 210, 90)), (1.0, (255, 245, 200))]
            for c in range(3):
                col = np.interp(t[hole], [s[0] for s in stops], [s[1][c] for s in stops])
                out[:, :, c][hole] = col
    out = np.clip(out, 0, 255).astype(np.uint8)
    im2 = Image.fromarray(out, "RGBA")
    # glow around the hot seams / hole
    glow_src = Image.fromarray(((active | hole) * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(6 + step * 2))
    glow = Image.new("RGBA", im.size, (255, 140, 30, 0)); glow.putalpha(glow_src.point(lambda v: int(v * 0.6)))
    im2.alpha_composite(glow)
    if step >= 5 and hole.any():
        d = ImageDraw.Draw(im2)
        ys, xs = np.where(hole)
        low = (float(xs[ys.argmax()]), float(ys.max()))
        for k in range(1 if step == 5 else 2):
            dx = (k * 2 - 1) * w * 0.05 if step == 6 else 0
            length = h * (0.08 if k == 0 else 0.055)
            path = [(low[0] + dx, low[1]), (low[0] + dx + w * 0.02, low[1] + length * 0.5), (low[0] + dx, low[1] + length)]
            dw = max(3, int(w * 0.02))
            d.line(path, fill=(230, 80, 15, 255), width=dw + 2, joint="curve")
            d.line(path, fill=(255, 215, 110, 255), width=max(1, dw // 2), joint="curve")
            d.ellipse((path[-1][0] - dw, path[-1][1] - dw * 0.4, path[-1][0] + dw, path[-1][1] + dw * 1.2),
                      fill=(255, 230, 150, 255), outline=(230, 80, 15, 255), width=1)
    im2.putalpha(rgba.split()[3])
    region = Image.fromarray(((ndi.binary_dilation(active | rim | hole, iterations=6)) * 255).astype(np.uint8), "L")
    return im2, region


def crack_mask(prev_path, intact_path, grow):
    """Paintable region for the next crack frame: the existing crack grown by `grow` px - or, when
    there is no crack yet (grow == 0 / nothing differs), a fixed seed patch on the upper shell.
    Always clipped to the egg's own alpha so the background never gets painted."""
    from PIL import ImageFilter
    egg_alpha = np.asarray(Image.open(os.path.splitext(intact_path)[0] + "_rgba.png").convert("RGBA"))[:, :, 3] > 128
    changed = crack_pixels(prev_path, intact_path) & egg_alpha if grow else np.zeros_like(egg_alpha)
    if changed.sum() < 200:
        ys, xs = np.where(egg_alpha)
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max(), ys.max()
        sx0, sy0, sx1, sy1 = CRACK_SEED
        changed = np.zeros_like(egg_alpha)
        changed[int(y0 + (y1 - y0) * sy0):int(y0 + (y1 - y0) * sy1),
                int(x0 + (x1 - x0) * sx0):int(x0 + (x1 - x0) * sx1)] = True
        changed &= egg_alpha
        grow = 6
    m = Image.fromarray((changed * 255).astype(np.uint8), "L")
    if grow:
        m = m.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    m = Image.fromarray(((np.asarray(m) > 0) & egg_alpha).astype(np.uint8) * 255, "L")
    return m

def rembg_rgba(png, model="birefnet-general"):
    return Image.open(cc().remove_bg(png, model)).convert("RGBA")

def save_png(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path)
    return path

def stage(path):
    return cc().stage_image(path)

GEN_TIMEOUT = 150   # s; a photoreal frame takes 12-40 s. Past this the GPU has wedged (seen 9/5 twice: the
                    # server kept answering HTTP while one prompt sat "running" for 30 min).

def free_vram():
    """ComfyUI POST /free after every frame: the studio's health ladder found the Arc's allocator
    fragments over a run; a 1 s flush between frames keeps it from wedging. Empty response body."""
    try:
        import urllib.request
        req = urllib.request.Request(cc().SERVER + "/free", data=json.dumps({"free_memory": True}).encode(),
                                     headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=15).read()
    except Exception as e:
        log(f"  (free_vram skipped: {e})")

def generate(wf, label):
    """Queue one workflow and wait for its images. FAILS LOUDLY (SystemExit 3) on error or timeout so
    the runner restarts the studio - cc-gen's own generate() waits 30 min and returns [] silently."""
    c = cc()
    comfy_log = os.path.join(STUDIO, "ComfyUI", "user", "comfyui.log")
    log_pos = os.path.getsize(comfy_log) if os.path.exists(comfy_log) else 0
    pid = c.post("/prompt", {"prompt": wf})["prompt_id"]
    log(f"  queued {label} (prompt {pid[:8]})...")
    t0 = time.time()
    while time.time() - t0 < GEN_TIMEOUT:
        time.sleep(2)
        # the Arc's device loss leaves the executor hung with the prompt still "running": the only
        # prompt signal is the studio's own log line - watch the bytes written since we queued
        try:
            with open(comfy_log, "rb") as lf:
                lf.seek(log_pos)
                fresh = lf.read().decode("utf-8", "ignore")
            if "DEVICE_LOST" in fresh or "Exception during processing" in fresh:
                raise SystemExit(f"generation DEVICE LOST (studio log): {label}")
        except (OSError, ValueError):
            pass
        h = c.get(f"/history/{pid}")
        if pid in h and h[pid].get("outputs"):
            imgs = [os.path.join(c.OUTPUT_DIR, im.get("subfolder", ""), im["filename"])
                    for node in h[pid]["outputs"].values() for im in node.get("images", [])]
            log(f"  done in {time.time()-t0:.0f}s -> {imgs[0] if imgs else '?'}")
            if not imgs:
                raise SystemExit(f"generation produced no image: {label}")
            # NO /free flush here: unloading every model per frame forces a full reload each prompt,
            # and UR_RESULT_ERROR_DEVICE_LOST hits exactly during those loads (studio log 9/5 09:03).
            return imgs
        if pid in h and h[pid].get("status", {}).get("status_str") == "error":
            raise SystemExit(f"generation ERROR: {label}: {json.dumps(h[pid]['status'])[:300]}")
        if time.time() - t0 > 8 and pid not in h:
            # a prompt that is in neither history nor the queue died without a record (device loss)
            try:
                q = c.get("/queue")
                live = [x[1] for x in q.get("queue_running", []) + q.get("queue_pending", [])]
                if pid not in live:
                    raise SystemExit(f"generation VANISHED (device lost?): {label}")
            except SystemExit:
                raise
            except Exception:
                pass
    try:
        c.post("/interrupt", {})
    except Exception:
        pass
    raise SystemExit(f"generation TIMEOUT after {GEN_TIMEOUT}s (GPU wedged?): {label}")


def run(wf, label, dry, dry_dir):
    """Queue one workflow (or, in --dry-run, write its JSON). Returns the output image paths."""
    if dry:
        os.makedirs(dry_dir, exist_ok=True)
        p = os.path.join(dry_dir, re.sub(r"[^\w.-]+", "_", label) + ".json")
        with open(p, "w") as f:
            json.dump(wf, f, indent=1)
        log(f"  [dry] wrote {os.path.relpath(p, HERE)}")
        return []
    return generate(wf, label)

def copy_out(paths, dest):
    if not paths:
        return None
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copyfile(paths[0], dest)
    return dest

def load_json(path, default):
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return default

def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=1)

# ---- the pipeline --------------------------------------------------------------------------
class Pipeline:
    def __init__(self, args):
        self.a = args
        self.d = DRAGONS[args.dragon]
        self.name = args.dragon
        variant = getattr(args, "variant", "") or ""
        self.work = os.path.join(HERE, "work", self.name + (f"-{variant}" if variant else ""))
        self.dry_dir = os.path.join(self.work, "dry")
        self.seed = self.d["seed"] + args.seed_bump
        self.egg_seed = self.d.get("egg_seed", 4242) + args.seed_bump   # the eggs' own seed (v2.5 recipe: 4242)
        os.makedirs(self.work, exist_ok=True)
        self.neg = NEG_BASE + ", " + STYLE_NEG[args.style] + ", " + self.d["neg"] + (", " + args.neg if args.neg else "")
        # every frame except the mouth inpaint is the CLOSED-mouth frame (the gn adult came out roaring 9/5)
        self.closed_neg = self.neg + ", open mouth, roaring, bared teeth, gaping jaws"
        # keyframe maturities: the four fixed ones plus any promoted mid-keys (keys/keys.json)
        self.key_ms = sorted(set(KEY_M) | set(load_json(self.p("keys", "keys.json"), [])))

    def p(self, *parts):
        return os.path.join(self.work, *parts)

    def only(self, idx):
        return (not self.a.only) or idx in self.a.only

    def skip(self, idx, *outputs):
        """--resume: skip a frame whose outputs already exist (unless it was named in --only)."""
        if self.a.only:
            return idx not in self.a.only
        return self.a.resume and all(os.path.exists(o) for o in outputs)

    def pair_plates(self, rgba_a, rgba_b, m, tag):
        """THE SAME-SIZE RULE: both bracketing keyframes are placed at THIS frame's target height
        before they are blended, so their silhouettes overlap and the sampler resolves ONE dragon
        (a blend of two different-sized plates leaves the bigger one as an unresolved ghost - seen
        live 9/5). Size growth is therefore an exact per-frame curve, height_for(m), not something
        the blend has to invent. Returns the two staged input names."""
        pa, _ = place_on_canvas(rgba_a, height_for(m))
        pb, _ = place_on_canvas(rgba_b, height_for(m))
        pa_path = save_png(pa, self.p("pairs", f"{tag}_a.png"))
        pb_path = save_png(pb, self.p("pairs", f"{tag}_b.png"))
        if self.a.dry_run:
            return f"{tag}_a.png", f"{tag}_b.png", pa_path, pb_path
        return stage(pa_path), stage(pb_path), pa_path, pb_path

    def key_rgba(self, m):
        return Image.open(self.p("keys", f"{key_tag(m)}_rgba.png")).convert("RGBA")

    # -- stage: probe (uses the EXISTING sprites, proves the morph pass before any keyframe work)
    def probe(self):
        log("== probe: morph pass between the existing whelp2 and drake sprites")
        a = Image.open(os.path.join(ART, "ember-whelp2.webp")).convert("RGBA")
        b = Image.open(os.path.join(ART, "ember-drake.webp")).convert("RGBA")
        pa_path = save_png(place_on_canvas(a, height_for(1/3))[0], self.p("probe", "plate_a.png"))
        pb_path = save_png(place_on_canvas(b, height_for(2/3))[0], self.p("probe", "plate_b.png"))
        pra, prb = stage_prompt(self.d, 1/3), stage_prompt(self.d, 2/3)
        outs = []
        for f in (0.0, 0.25, 0.5, 0.75, 1.0):
            na, nb, _, _ = self.pair_plates(a, b, 1/3 + f/3, f"probe_{int(f*100):03d}")
            wf = build_morph(tier(), pra, prb, f, self.closed_neg, na, nb, self.a.denoise, self.seed,
                             f"dm_probe_{int(f*100):03d}", ipa_w=self.a.ipa, init=self.a.init)
            out = run(wf, f"probe f={f}", self.a.dry_run, self.dry_dir)
            dest = copy_out(out, self.p("probe", f"morph_{int(f*100):03d}.png"))
            if dest:
                outs.append(save_png(rembg_rgba(dest), self.p("probe", f"morph_{int(f*100):03d}_rgba.png")))
        if outs:
            self.contact([pa_path] + outs + [pb_path], self.p("probe", "contact.png"))
            log("  -> open work/ember/probe/contact.png: plate A, five morph frames (f=0..1), plate B.")
            log("     Tune --denoise (0.45..0.6), --init latent|pixel, --ipa (0.3..0.6) until in-betweens are clean.")

    # -- stage: keys
    def keys(self):
        log("== keys: 4 keyframes with the fit-in-frame gate")
        t = tier()
        if self.a.resume and all(os.path.exists(self.p("keys", f"{key_tag(m)}_rgba.png")) for m in KEY_M):
            log("  all four keyframes exist - resume, skipping")
            return
        # EVERY keyframe is its own txt2img at the SHARED seed with the same anchor tokens - that alone
        # gives one pose, one lighting, one facing (seen live 9/5: the hatchling init matched the adult's
        # side view exactly). The old de-age img2img chain is DEAD on Juggernaut: a second img2img pass
        # degenerates into a posterized ink outline, and the composition lock never made it younger.
        paths = {}
        for m in KEY_M[::-1]:            # the adult first: the newborn is generated as ITS baby
            done = self.p("keys", f"{key_tag(m)}.png")
            if self.a.resume and os.path.exists(done) and os.path.exists(self.p("keys", f"{key_tag(m)}_rgba.png")):
                log(f"  {key_tag(m)}: kept (resume)")
                paths[m] = done
                continue
            if m < 1.0:
                paths[m] = self.gated_txt2img(stage_prompt(self.d, m), key_tag(m), ref=paths.get(1.0))
            else:
                # --adult-ref: an existing picture (e.g. the v2.7 adult Iona liked) is the adult's identity
                # reference - the new adult is THAT dragon, regenerated whole on our canvas
                paths[m] = self.gated_txt2img(stage_prompt(self.d, m), "adult", ref=self.a.adult_ref or None,
                                              ipa_w=self.a.adult_ipa, start_at=0.15)
        if self.a.dry_run:
            return
        for m, path in paths.items():
            tag = key_tag(m)
            rgba = rembg_rgba(path)
            save_png(rgba, self.p("keys", f"{tag}_rgba.png"))
            log(f"  {tag}: alpha bbox {alpha_bbox(rgba)} edge-contact {edge_contact(rgba) or 'none'}")
        self.contact([self.p("keys", f"{key_tag(m)}_rgba.png") for m in self.key_ms
                      if os.path.exists(self.p("keys", f"{key_tag(m)}_rgba.png"))],
                     self.p("keys", "contact.png"), cols=4)

    def gated_txt2img(self, prompt, tag, tries=8, ref=None, ipa_w=None, start_at=0.3):
        """txt2img on the shared canvas; reroll the seed until the subject is fully inside the frame.
        With `ref`, the image is generated WITH that picture as an IPAdapter identity reference (the
        adult for the newborn; an existing favourite for the adult itself)."""
        t = tier()
        for i in range(tries):
            seed = self.seed + i
            if ref:
                if not self.a.dry_run:
                    rpath = ref
                    if not ref.lower().endswith(".png"):       # LoadImage wants png; flatten webp on white
                        rpath = self.p("keys", f"ref_{tag}.png")
                        im = Image.open(ref).convert("RGBA")
                        bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
                        bg.alpha_composite(im)
                        save_png(bg.convert("RGB"), rpath)
                    rname = stage(rpath)
                else:
                    rname = "ref.png"
                # start_at: the first steps (composition, size, pose) are prompt-only; the reference
                # only shapes the look after that - at 0.0 it copies the wingspan and gets cropped
                wf = cc().build_ipadapter(t, prompt, self.closed_neg, rname, ipa_w or self.a.key_ipa, W, H, seed,
                                          f"dm_key_{tag}")
                wf["22"]["inputs"]["start_at"] = start_at
            else:
                wf = cc().build_sdxl(t, prompt, self.closed_neg, W, H, seed, f"dm_key_{tag}")
            out = run(wf, f"key {tag} seed={seed}" + (f" ipa(adult)={self.a.key_ipa}" if ref else ""),
                      self.a.dry_run, self.dry_dir)
            if self.a.dry_run:
                return None
            raw = copy_out(out, self.p("keys", f"{tag}_try{i}.png"))
            touch = edge_contact(rembg_rgba(raw))
            if not touch:
                log(f"  {tag}: fits (seed {seed})")
                final = self.p("keys", f"{tag}.png")
                shutil.copyfile(raw, final)
                return final
            log(f"  {tag}: cropped at {touch} -> reroll")
        raise SystemExit(f"{tag}: no seed in {tries} tries kept the whole dragon in frame - strengthen the margin tokens")

    # -- stage: plates
    def plates(self):
        log("== plates: keyframes onto the shared canvas")
        for m in self.key_ms:
            tag = key_tag(m)
            if m not in KEY_M and os.path.exists(self.p("plates", f"{tag}.png")):
                continue        # a promoted mid-key is already a plate (it came from a canvas frame)
            if not os.path.exists(self.p("keys", f"{tag}_rgba.png")):
                log(f"  {tag}: no keyframe yet (run --stage keys){' - dry run, skipping' if self.a.dry_run else ''}")
                if self.a.dry_run:
                    continue
                raise SystemExit(f"missing keyframe {tag}")
            rgba = Image.open(self.p("keys", f"{tag}_rgba.png")).convert("RGBA")
            plate, layer = place_on_canvas(rgba, height_for(m))
            save_png(plate, self.p("plates", f"{tag}.png"))
            save_png(layer, self.p("plates", f"{tag}_rgba.png"))
            log(f"  {tag}: height {height_for(m):.2f}H, bbox {alpha_bbox(layer)}")

    # -- stage: eggs
    def eggs(self):
        log("== eggs: the picked egg on the canvas + 3 crack frames (daily tier = the recipe that made it)")
        t = cc().TIERS["daily"]          # the eggs she likes came from DreamShaper; keep their look
        egg = Image.open(os.path.join(ART, f"egg-{self.name}.webp")).convert("RGBA")
        # generate LARGE (the crust/crack detail needs the pixels - at the game's 0.36H the crust pass
        # produced a molten blob 9/5), then place the results at the game's egg size below
        plate, _ = place_on_canvas(egg, EGG_GEN_H)
        plate_path = save_png(plate, self.p("eggs", "egg_plate.png"))
        name = "egg_plate.png" if self.a.dry_run else stage(plate_path)
        base = f"{self.d['shell']}, a single dragon egg sitting upright, {EGG_STYLE}"
        # A CRACK CAN ONLY GROW WHERE IT ALREADY IS (Ryan 9/5: "you can't have a crack start to form
        # and in the next image that crack is gone and somewhere else"). Frame 0 is one whole-egg pass.
        # Every later frame is an INPAINT of the previous frame whose paintable region is the existing
        # crack (pixels that differ from frame 0) grown outward by a margin - everything outside that
        # region is byte-identical to the previous frame, so a crack cannot vanish or move; it can only
        # extend at its edges. The first crack is seeded in a fixed patch on the upper shell.
        # Ryan 9/5 12:10: frame 0 must read SOLID - a cooled lava crust skinned over the magma (the
        # original's translucent plates looked hollow) - and the cracks are the crust FAILING, not more
        # glowing veins: a dark fissure with a lifted edge, a chip falling, white-hot magma through the
        # gap, and at the burst a glimpse of the hatchling's scaled skin inside.
        neg = self.neg + ", dragon, creature, hatchling, animal, translucent, glass, hollow, see-through, stained glass, lantern"
        crust = ("(cooled lava crust:1.4): dark matte basalt crust plates skinned over molten magma, smooth polished "
                 "plate faces, thin glowing orange seams between the crust plates, magma glowing faintly through the "
                 "thin dark crust, (glossy specular highlights, bright rim light catching the plate edges:1.4), "
                 "cinematic lighting, highly detailed")
        egg_only = f"a single dragon egg, {crust}, clean plain white background, centered, the whole egg in frame"
        # SIX crack steps = two per answer (Ryan 9/5 12:40: the egg rumbles and cracks cumulatively with each
        # question): hairline -> hairline widening, branch -> chip lifting, gap -> burst with a glimpse inside.
        # High in-mask strength: at 0.7 the small patch just repainted the crust texture (9/5).
        steps = [
            (EGG_CRUST_DENOISE, None, egg_only),
            (0.40, 0,   f"{egg_only}, (a thin dark hairline fissure splitting the crust plate:1.5), white-hot light along the split"),
            (0.44, 30,  f"{egg_only}, (the hairline fissure widening into a dark crack:1.5), white-hot magma glowing in the crack"),
            (0.50, 44,  f"{egg_only}, (the crack branching across neighbouring plates:1.5), a plate edge lifting, magma glow"),
            (0.52, 56,  f"{egg_only}, (a chip of crust broken loose, a small dark gap in the shell:1.5), white-hot magma through the gap"),
            (0.52, 70,  f"{egg_only}, (a wide jagged opening in the crust, shell pieces breaking away, a drip of molten lava running down from the crack:1.5), blazing magma light pouring out"),
            (0.55, 84,  f"{egg_only}, (the crust bursting open, large shell pieces falling away, drips of molten lava running down the shell:1.5), blazing magma light, "
                        "(a glimpse of small glowing orange dragon scales and a closed eye inside the molten gap:1.3)"),
        ]
        neg_burst = self.neg + ", translucent, glass, hollow, see-through"   # the burst MAY show the hatchling
        prev_path, prev = plate_path, name
        for i, (dn, grow, prompt) in enumerate(steps):
            dest = self.p("eggs", f"egg_{i}.png")
            if self.skip(i, self.p("eggs", f"egg_{i}_rgba.png")):
                prev_path, prev = dest, (f"egg_{i}.png" if self.a.dry_run else stage(dest))
                continue
            if grow is None:
                wf = cc().build_img2img(t, prompt, neg, prev, dn, self.egg_seed, f"dm_egg_{i}")
            else:
                # draw the crack for THIS step onto the crust egg (frame 0's cutout, so the geometry is
                # cumulative by construction), then let the model blend it in inside a tight mask
                mask_path = self.p("eggs", f"egg_{i}_mask.png")
                drawn_path = self.p("eggs", f"egg_{i}_drawn.png")
                if not self.a.dry_run:
                    crust_rgba = Image.open(self.p("eggs", "egg_0_gen_rgba.png")).convert("RGBA")
                    drawn, region = draw_crack(crust_rgba, i, seed=self.egg_seed)
                    bg = Image.new("RGB", (W, H), (255, 255, 255))
                    bg.paste(drawn, (0, 0), drawn)
                    save_png(bg, drawn_path)
                    save_png(region, mask_path)
                    prev, mname = stage(drawn_path), stage(mask_path)
                else:
                    mname = f"egg_{i}_mask.png"
                wf = cc().build_sdxl_inpaint(t, prompt, neg_burst if i == len(steps) - 1 else neg, prev, mname,
                                             dn, self.egg_seed, f"dm_egg_{i}", grow=2)
            out = run(wf, f"egg {i} d={dn} <- {prev}" + (f" mask grow {grow}" if grow is not None else ""),
                      self.a.dry_run, self.dry_dir)
            got = copy_out(out, dest)
            if got:
                rgba = rembg_rgba(got)
                save_png(rgba, self.p("eggs", f"egg_{i}_gen_rgba.png"))      # generation-size cutout
                if EGG_BRIGHTNESS[i] != 1.0:     # the brightness ramp: crust -> glow, applied to the alpha only
                    from PIL import ImageEnhance
                    rgb = ImageEnhance.Brightness(rgba.convert("RGB")).enhance(EGG_BRIGHTNESS[i])
                    rgba = Image.merge("RGBA", (*rgb.split(), rgba.split()[3]))
                # the game-size frame: the same egg placed at H_EGG on the shared floor line
                save_png(place_on_canvas(rgba, H_EGG)[1], self.p("eggs", f"egg_{i}_rgba.png"))
                prev_path, prev = got, stage(got)
            else:
                prev_path, prev = dest, f"egg_{i}.png"

    # -- stage: morph
    def morph(self):
        log(f"== morph: {len(GROWTH_P)} growth frames (denoise {self.a.denoise}, init {self.a.init}, ipa {self.a.ipa})")
        t = tier()
        rgbas = {} if self.a.dry_run else {m: self.key_rgba(m) for m in self.key_ms}
        blank = Image.new("RGBA", (64, 64), (255, 0, 0, 255))
        made = 0
        for i, p in enumerate(GROWTH_P):
            if self.skip(i, self.p("morph", f"f{i:02d}_rgba.png")):
                continue
            if self.a.chunk and made >= self.a.chunk:
                log(f"  chunk of {self.a.chunk} done - exiting so the runner can restart the studio")
                return
            made += 1
            m = maturity(p)
            a, b, f = bracket(m, self.key_ms)
            na, nb, _, _ = self.pair_plates(rgbas.get(a, blank), rgbas.get(b, blank), m, f"f{i:02d}")
            # the further a frame sits from both its keys, the less its blend resolves on its own
            # (seen live 9/5: ghost wings + doubled legs at f=0.5) -> denoise rises toward the middle
            dn = round(min(0.85, self.a.denoise + self.a.mid_boost * 4 * f * (1 - f)), 3)
            wf = build_morph(t, stage_prompt(self.d, a), stage_prompt(self.d, b), f, self.closed_neg, na, nb,
                             dn, self.seed, f"dm_morph_{i:02d}", ipa_w=self.a.ipa, init=self.a.init)
            out = run(wf, f"morph {i:02d} p={p} m={m:.3f} [{key_tag(a)}->{key_tag(b)} f={f:.2f} d={dn}]",
                      self.a.dry_run, self.dry_dir)
            dest = copy_out(out, self.p("morph", f"f{i:02d}.png"))
            if dest:
                save_png(rembg_rgba(dest), self.p("morph", f"f{i:02d}_rgba.png"))
        if not self.a.dry_run:
            frames = [self.p("morph", f"f{i:02d}_rgba.png") for i in range(len(GROWTH_P))]
            self.contact([f for f in frames if os.path.exists(f)], self.p("morph", "contact.png"))
            from export import write_viewer
            write_viewer(self, stage_only=True)

    # -- stage: chomp
    def chomp(self):
        log("== chomp: Florence head box -> mouth mask -> inpaint per frame")
        t = tier()
        mouths = load_json(self.p("chomp", "mouth.json"), {})
        made = 0
        for i, p in enumerate(GROWTH_P):
            if self.skip(i, self.p("chomp", f"f{i:02d}_open_rgba.png")):
                continue
            if self.a.chunk and made >= self.a.chunk:
                log(f"  chunk of {self.a.chunk} done - exiting so the runner can restart the studio")
                return
            made += 1
            src = self.p("morph", f"f{i:02d}.png")
            name = f"f{i:02d}.png" if self.a.dry_run else stage(src)
            box_out = run(build_head_box(name, f"dm_head_{i:02d}", phrase="eye"), f"eye box {i:02d}",
                          self.a.dry_run, self.dry_dir)
            if self.a.dry_run:
                run(cc().build_sdxl_inpaint(t, "prompt", self.neg, name, "mask.png", 0.72, self.seed, f"dm_open_{i:02d}", grow=10),
                    f"open {i:02d}", True, self.dry_dir)
                log("  [dry] chomp graphs emitted for frame 00 only")
                break
            # Florence-2 grounds "eye" tightly on all but the biggest frames (9/5: 0-12 ok, 13-16 =
            # whole body); every head/mouth/face phrase returns the whole dragon. So: the mouth sits in
            # front of and below the EYE; when the eye is not found, a pose preset by maturity.
            eye = self.head_bbox(box_out)
            bx0, by0, bx1, by1 = alpha_bbox(Image.open(self.p("morph", f"f{i:02d}_rgba.png")))
            bw, bh = bx1 - bx0, by1 - by0
            votes = [m.get("facing") for m in mouths.values() if m.get("facing") in ("left", "right")]
            left = votes.count("right") <= votes.count("left")
            if self.a.mouth_frac:
                fr = [float(v) for v in self.a.mouth_frac.split(",")]
                mouth = (bx0 + fr[0] * bw, by0 + fr[1] * bh, bx0 + fr[2] * bw, by0 + fr[3] * bh)
                head = (mouth[0], mouth[1] - bh * 0.1, mouth[2], mouth[3])
                log(f"  {i:02d}: mouth box from --mouth-frac, facing {'left' if left else 'right'}")
            elif eye is not None and (eye[2] - eye[0]) < 0.35 * bw and (eye[3] - eye[1]) < 0.3 * bh:
                ex0, ey0, ex1, ey1 = eye
                ew, eh = max(ex1 - ex0, 24), max(ey1 - ey0, 24)
                left = (ex0 + ex1) / 2 < (bx0 + bx1) / 2
                if left:
                    mouth = (ex0 - 2.6 * ew, ey0 + 0.6 * eh, ex1 + 0.5 * ew, ey1 + 2.2 * eh)
                else:
                    mouth = (ex0 - 0.5 * ew, ey0 + 0.6 * eh, ex1 + 2.6 * ew, ey1 + 2.2 * eh)
                head = (min(mouth[0], ex0), ey0 - eh, max(mouth[2], ex1), mouth[3])
                log(f"  {i:02d}: eye found ({100*ew/bw:.0f}% of body width) -> mouth from the eye, facing {'left' if left else 'right'}")
            else:
                fr = MOUTH_PRESET["adult" if maturity(p) >= 0.8 else "young"]
                if not left:
                    fr = (1 - fr[2], fr[1], 1 - fr[0], fr[3])
                mouth = (bx0 + fr[0] * bw, by0 + fr[1] * bh, bx0 + fr[2] * bw, by0 + fr[3] * bh)
                head = (mouth[0], mouth[1] - bh * 0.1, mouth[2], mouth[3])
                log(f"  {i:02d}: no usable eye box -> {'adult' if maturity(p) >= 0.8 else 'young'} pose preset, facing {'left' if left else 'right'}")
            mouth = (max(0, mouth[0]), max(0, mouth[1]), min(W, mouth[2]), min(H, mouth[3]))
            mask = Image.new("L", (W, H), 0)
            ImageDraw.Draw(mask).rectangle(mouth, fill=255)
            mname = stage(save_png(mask, self.p("chomp", f"f{i:02d}_mask.png")))
            if self.a.swap_closed:
                # the base frame ALREADY has its jaws open (DreamShaper ignored the closed-mouth negatives
                # on the big frames 9/5): the base becomes the OPEN twin and a "mouth closed" inpaint of
                # the same box becomes the closed growth frame
                base_rgba = self.p("morph", f"f{i:02d}_rgba.png")
                keep = self.p("morph", f"f{i:02d}_openbase_rgba.png")
                if not os.path.exists(keep):
                    shutil.copyfile(base_rgba, keep)
                shutil.copyfile(keep, self.p("chomp", f"f{i:02d}_open_rgba.png"))
                prompt = f"(mouth closed, jaws shut, lips sealed, calm expression:1.4), {stage_prompt(self.d, maturity(p))}"
                neg = self.neg + ", open mouth, roaring, teeth, fangs, tongue, gaping jaws"
                out = generate(cc().build_sdxl_inpaint(t, prompt, neg, name, mname, self.a.open_denoise, self.seed,
                                    f"dm_closed_{i:02d}", grow=10), f"closed {i:02d}")
                dest = copy_out(out, self.p("chomp", f"f{i:02d}_closed.png"))
                if dest:
                    # register against the ORIGINAL base so the closed frame differs only inside the box
                    shutil.copyfile(keep, base_rgba)
                    closed = self.register_open(i, rembg_rgba(dest), mouth)
                    save_png(closed, base_rgba)
            else:
                prompt = f"(mouth wide open, roaring happily, open jaws, visible teeth:1.4), {stage_prompt(self.d, maturity(p))}"
                neg = self.neg + ", closed mouth, smile with closed lips"
                out = generate(cc().build_sdxl_inpaint(t, prompt, neg, name, mname, self.a.open_denoise, self.seed,
                                    f"dm_open_{i:02d}", grow=10), f"open {i:02d}")
                dest = copy_out(out, self.p("chomp", f"f{i:02d}_open.png"))
                if dest:
                    save_png(self.register_open(i, rembg_rgba(dest), mouth), self.p("chomp", f"f{i:02d}_open_rgba.png"))
            if dest:
                # facing: the head sits left or right of the body's centre -> export mirrors a
                # left-facing dragon so it looks toward the questions on the right of the screen
                bx0, _, bx1, _ = alpha_bbox(Image.open(self.p("morph", f"f{i:02d}_rgba.png")))
                head_cx, body_cx = (head[0] + head[2]) / 2, (bx0 + bx1) / 2
                facing = "left" if head_cx < body_cx - (bx1 - bx0) * 0.04 else \
                         "right" if head_cx > body_cx + (bx1 - bx0) * 0.04 else "front"
                mouths[str(i)] = {"head": [round(v) for v in head], "mouth": [round(v) for v in mouth],
                                  "cx": round((mouth[0] + mouth[2]) / 2 / W, 4),
                                  "cy": round((mouth[1] + mouth[3]) / 2 / H, 4), "facing": facing,
                                  "eye": [round(v) for v in eye] if (eye is not None and not self.a.mouth_frac
                                          and (eye[2] - eye[0]) < 0.35 * bw) else None}
                save_json(self.p("chomp", "mouth.json"), mouths)

    @staticmethod
    def head_bbox(box_out):
        if not box_out:
            return None
        mask = np.asarray(Image.open(box_out[0]).convert("L"))
        ys, xs = np.where(mask > 128)
        if len(xs) == 0:
            return None
        sy, sx = H / mask.shape[0], W / mask.shape[1]     # guard against a resized mask
        return (xs.min() * sx, ys.min() * sy, (xs.max() + 1) * sx, (ys.max() + 1) * sy)

    def register_open(self, i, open_rgba, mouth, feather=14):
        """The open twin differs from the closed frame ONLY inside the mouth box, by construction:
        the inpaint's VAE round-trip shifts every pixel a little (vet saw 7-19 levels outside the
        box), so everything outside a feathered mouth mask is copied back from the closed frame."""
        from PIL import ImageFilter
        closed = Image.open(self.p("morph", f"f{i:02d}_rgba.png")).convert("RGBA")
        m = Image.new("L", (W, H), 0)
        x0, y0, x1, y1 = [int(v) for v in mouth]
        ImageDraw.Draw(m).rectangle((x0 - feather, y0 - feather, x1 + feather, y1 + feather), fill=255)
        m = m.filter(ImageFilter.GaussianBlur(feather / 2))
        return Image.composite(open_rgba, closed, m)

    # -- stage: blink (eyes-closed twin, registered like the mouth twin; reuses chomp's eye/head box)
    def blink(self):
        log("== blink: eyes-closed twin per frame (inpaint of the eye box only)")
        t = tier()
        mouths = load_json(self.p("chomp", "mouth.json"), {})
        made = 0
        for i, p in enumerate(GROWTH_P):
            if self.skip(i, self.p("blink", f"f{i:02d}_blink_rgba.png")):
                continue
            if self.a.chunk and made >= self.a.chunk:
                log(f"  chunk of {self.a.chunk} done - exiting so the runner can restart the studio")
                return
            mi = mouths.get(str(i))
            src = self.p("morph", f"f{i:02d}.png")
            if not mi or not os.path.exists(src):
                log(f"  {i:02d}: no chomp record yet (run chomp first) - skipping")
                continue
            made += 1
            hx0, hy0, hx1, hy1 = mi["head"]
            mx0, my0, mx1, my1 = mi["mouth"]
            # the eye band: the head box above the mouth, trimmed to its front two thirds
            eye = (hx0 + (hx1 - hx0) * (0.0 if mi.get("facing") != "right" else 0.33), hy0,
                   hx0 + (hx1 - hx0) * (0.67 if mi.get("facing") != "right" else 1.0), my0 + (my1 - my0) * 0.15)
            mask = Image.new("L", (W, H), 0)
            ImageDraw.Draw(mask).rectangle(eye, fill=255)
            name = f"f{i:02d}.png" if self.a.dry_run else stage(src)
            mname = f"f{i:02d}_blinkmask.png" if self.a.dry_run else stage(save_png(mask, self.p("blink", f"f{i:02d}_mask.png")))
            prompt = f"(eyes closed, eyelids shut, blinking:1.4), {stage_prompt(self.d, maturity(p))}"
            neg = self.closed_neg + ", open eyes, glowing eyes, wide eyes"
            out = run(cc().build_sdxl_inpaint(t, prompt, neg, name, mname, 0.6, self.seed, f"dm_blink_{i:02d}", grow=6),
                      f"blink {i:02d}", self.a.dry_run, self.dry_dir)
            dest = copy_out(out, self.p("blink", f"f{i:02d}_blink.png"))
            if dest:
                save_png(self.register_open(i, rembg_rgba(dest), eye, feather=10), self.p("blink", f"f{i:02d}_blink_rgba.png"))

    def fixopen(self):
        """Apply register_open to the open twins that already exist (no GPU)."""
        mouths = load_json(self.p("chomp", "mouth.json"), {})
        n = 0
        for i in range(len(GROWTH_P)):
            raw, mi = self.p("chomp", f"f{i:02d}_open.png"), mouths.get(str(i))
            if os.path.exists(raw) and mi and os.path.exists(self.p("morph", f"f{i:02d}_rgba.png")):
                rgba_raw = self.p("chomp", f"f{i:02d}_open_raw_rgba.png")
                if not os.path.exists(rgba_raw):
                    save_png(rembg_rgba(raw), rgba_raw)
                save_png(self.register_open(i, Image.open(rgba_raw).convert("RGBA"), mi["mouth"]),
                         self.p("chomp", f"f{i:02d}_open_rgba.png"))
                n += 1
        log(f"  re-registered {n} open twins against their closed frames")

    @staticmethod
    def mouth_rect(head):
        """The mouth lives in the lower ~half of the head box; pad so the jaw can drop."""
        x0, y0, x1, y1 = head
        hw, hh = x1 - x0, y1 - y0
        return (max(0, x0 - hw * 0.08), y0 + hh * 0.48, min(W, x1 + hw * 0.08), min(H, y1 + hh * 0.22))

    # -- stage: promote (a clean growth frame becomes a keyframe; its two half-segments re-morph)
    def promote(self):
        """--only <i>: the growth frame i becomes a mid-keyframe, halving the two morph gaps around it.
        The frames strictly between the new key's neighbours are deleted so --resume regenerates them."""
        if len(self.a.only) != 1:
            raise SystemExit("promote needs exactly one frame index: --only <i>")
        i = self.a.only[0]
        m = round(maturity(GROWTH_P[i]), 4)
        src = self.p("morph", f"f{i:02d}")
        if not os.path.exists(src + "_rgba.png"):
            raise SystemExit(f"frame {i} has no morph output to promote")
        tag = key_tag(m)
        shutil.copyfile(src + "_rgba.png", self.p("keys", f"{tag}_rgba.png"))
        shutil.copyfile(src + ".png", self.p("plates", f"{tag}.png"))
        shutil.copyfile(src + "_rgba.png", self.p("plates", f"{tag}_rgba.png"))
        extra = sorted(set(load_json(self.p("keys", "keys.json"), [])) | {m})
        save_json(self.p("keys", "keys.json"), extra)
        self.key_ms = sorted(set(KEY_M) | set(extra))
        lo = max(k for k in self.key_ms if k < m)
        hi = min(k for k in self.key_ms if k > m)
        redo = [j for j, p in enumerate(GROWTH_P) if lo + 1e-6 < maturity(p) < hi - 1e-6 and j != i]
        for j in redo:
            for f in (self.p("morph", f"f{j:02d}.png"), self.p("morph", f"f{j:02d}_rgba.png"),
                      self.p("chomp", f"f{j:02d}_open.png"), self.p("chomp", f"f{j:02d}_open_rgba.png")):
                if os.path.exists(f):
                    os.remove(f)
        log(f"  frame {i} (m={m}) promoted to keyframe '{tag}'; keys now {self.key_ms}")
        log(f"  frames {redo} cleared - `--stage morph --resume` then `--stage chomp --resume` rebuild them")
        save_json(self.p("keys", "promoted.json"), {"last": {"frame": i, "m": m, "redo": redo}})

    # -- stage: sweep (auto-tune the morph knobs on 3 in-betweens per combo; writes the winner)
    def sweep(self):
        """Grid over denoise x init x ipa between two plates (the real whelp/drake plates when they
        exist, else the probe plates from the old sprites). Score = how EVEN the four steps
        A->f25->f50->f75->B are (low spread) with a penalty for identity drift (hue vs A/B).
        The winner is written to work/settings.json so run.py picks it up."""
        from vet import masked_hsv, thumb, step_distance
        if all(os.path.exists(self.p("keys", f"{key_tag(m)}_rgba.png")) for m in (1/3, 2/3)):
            a, b = self.key_rgba(1/3), self.key_rgba(2/3)
            log("== sweep on the REAL whelp/drake keyframes")
        else:
            a = Image.open(os.path.join(ART, "ember-whelp2.webp")).convert("RGBA")
            b = Image.open(os.path.join(ART, "ember-drake.webp")).convert("RGBA")
            log("== sweep on the OLD sprites (no keyframes yet)")
        pa_path = save_png(place_on_canvas(a, height_for(1/3))[1], self.p("sweep", "end_a_rgba.png"))
        pb_path = save_png(place_on_canvas(b, height_for(2/3))[1], self.p("sweep", "end_b_rgba.png"))
        pra, prb = stage_prompt(self.d, 1/3), stage_prompt(self.d, 2/3)
        grid = [(dn, init, ipa) for dn in (0.45, 0.55) for init in ("latent", "pixel") for ipa in (0.35, 0.5)]
        results = []
        ta, tb = (thumb(Image.open(p).convert("RGBA")) for p in (pa_path, pb_path))
        ha, hb = masked_hsv(Image.open(pa_path).convert("RGBA"))[0], masked_hsv(Image.open(pb_path).convert("RGBA"))[0]
        area_a, area_b = (int((np.asarray(Image.open(p).convert("RGBA"))[:, :, 3] > 128).sum()) for p in (pa_path, pb_path))
        for dn, init, ipa in grid:
            tag = f"d{int(dn*100)}_{init}_i{int(ipa*100)}"
            frames = []
            for f in (0.25, 0.5, 0.75):
                na, nb, _, _ = self.pair_plates(a, b, 1/3 + f/3, f"sweep_{tag}_{int(f*100)}")
                wf = build_morph(tier(), pra, prb, f, self.closed_neg, na, nb, dn, self.seed, f"dm_sweep_{tag}_{int(f*100)}",
                                 ipa_w=ipa, init=init)
                out = run(wf, f"sweep {tag} f={f}", self.a.dry_run, self.dry_dir)
                dest = copy_out(out, self.p("sweep", f"{tag}_{int(f*100)}.png"))
                if dest:
                    frames.append(save_png(rembg_rgba(dest), self.p("sweep", f"{tag}_{int(f*100)}_rgba.png")))
            if len(frames) < 3:
                continue
            th = [ta] + [thumb(Image.open(p).convert("RGBA")) for p in frames] + [tb]
            steps = [step_distance(x, y) for x, y in zip(th, th[1:])]
            spread = max(steps) / max(1e-6, min(steps))
            hues = [masked_hsv(Image.open(p).convert("RGBA"))[0] for p in frames]
            drift = max(min(abs(h - ha), abs(h - hb)) for h in hues)
            # silhouette sanity: the in-betweens' alpha areas must climb from A's toward B's (a ghost
            # of the other plate, or a collapsed frame, breaks this)
            areas = [area_a] + [int((np.asarray(Image.open(p).convert("RGBA"))[:, :, 3] > 128).sum()) for p in frames] + [area_b]
            lo, hi = min(area_a, area_b) * 0.85, max(area_a, area_b) * 1.15
            area_bad = sum(1 for x in areas[1:-1] if not (lo <= x <= hi)) + \
                sum(1 for x, y in zip(areas, areas[1:]) if (y - x) * (area_b - area_a) < -0.03 * abs(area_b - area_a))
            score = spread + drift / 10.0 + area_bad * 1.5
            results.append({"denoise": dn, "init": init, "ipa": ipa, "steps": [round(s, 1) for s in steps],
                            "spread": round(spread, 2), "hue_drift": round(drift, 1), "areas": areas,
                            "area_bad": area_bad, "score": round(score, 2)})
            self.contact([pa_path] + frames + [pb_path], self.p("sweep", f"{tag}.png"), cols=5, cell=240)
            log(f"  {tag}: steps {[round(s,1) for s in steps]} spread {spread:.2f} drift {drift:.0f} -> score {score:.2f}")
        if not results:
            return
        results.sort(key=lambda r: r["score"])
        save_json(self.p("sweep", "sweep.json"), results)
        best = results[0]
        settings_path = os.path.join(HERE, "work", "settings.json")
        s = load_json(settings_path, {})
        s.update({"denoise": best["denoise"], "init": best["init"], "ipa": best["ipa"]})
        save_json(settings_path, s)
        log(f"  WINNER denoise {best['denoise']} init {best['init']} ipa {best['ipa']} (score {best['score']}) -> work/settings.json")

    # -- stage: vet / export live in their own modules
    def vet(self):
        from vet import vet_dragon
        vet_dragon(self)

    def export(self):
        from export import export_dragon
        export_dragon(self)

    def contact(self, paths, out, cols=6, cell=300, labels=None):
        """Contact sheet: every frame composited on mid-grey with its index (and an optional label)."""
        if not paths:
            return
        rows = math.ceil(len(paths) / cols)
        sheet = Image.new("RGB", (cols * cell, rows * (cell + 24)), (70, 70, 74))
        dr = ImageDraw.Draw(sheet)
        for k, pth in enumerate(paths):
            im = Image.open(pth).convert("RGBA")
            im.thumbnail((cell, cell))
            bg = Image.new("RGBA", im.size, (110, 110, 116, 255))
            bg.alpha_composite(im)
            x, y = (k % cols) * cell, (k // cols) * (cell + 24)
            sheet.paste(bg.convert("RGB"), (x + (cell - im.width) // 2, y + (cell - im.height)))
            text = f"{k:02d} {os.path.basename(pth)}" + (f"  {labels[k]}" if labels else "")
            dr.text((x + 6, y + cell + 4), text, fill=(255, 255, 255))
        save_png(sheet, out)
        log(f"  contact sheet -> {os.path.relpath(out, HERE)}")

# ---- static validation (no server): every class_type must exist in the node sources ------------
NODE_SOURCES = [
    os.path.join(STUDIO, "ComfyUI", "nodes.py"),
    os.path.join(STUDIO, "ComfyUI", "comfy_extras"),
    os.path.join(STUDIO, "ComfyUI", "custom_nodes", "ComfyUI_IPAdapter_plus"),
    os.path.join(STUDIO, "ComfyUI", "custom_nodes", "ComfyUI-Florence2"),
    os.path.join(STUDIO, "ComfyUI", "custom_nodes", "ComfyUI-Custom-Scripts"),
]

def validate(dry_dir):
    corpus = ""
    for src in NODE_SOURCES:
        files = [src] if os.path.isfile(src) else \
            [os.path.join(r, f) for r, _, fs in os.walk(src) for f in fs if f.endswith(".py")]
        for fp in files:
            try:
                with open(fp, encoding="utf-8", errors="ignore") as f:
                    corpus += f.read()
            except OSError:
                pass
    classes = set()
    for fn in os.listdir(dry_dir):
        if fn.endswith(".json"):
            with open(os.path.join(dry_dir, fn)) as f:
                for node in json.load(f).values():
                    classes.add(node["class_type"])
    bad = []
    for c in sorted(classes):
        base = c.split("|")[0]
        ok = re.search(rf'class {re.escape(base)}\b', corpus) or re.search(rf'["\']{re.escape(c)}["\']', corpus)
        log(f"  {'ok     ' if ok else 'MISSING'} {c}")
        if not ok:
            bad.append(c)
    return bad


def main():
    global TIER_NAME
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dragon", default="ember", choices=list(DRAGONS))
    ap.add_argument("--show-prompts", action="store_true", help="print every stage prompt for the dragon and exit")
    ap.add_argument("--variant", default="", help="work folder suffix: work/<dragon>-<variant> (one per style set)")
    ap.add_argument("--stage", default="probe",
                    choices=["probe", "sweep", "keys", "plates", "eggs", "morph", "chomp", "blink", "fixopen", "promote", "vet", "export", "all"])
    ap.add_argument("--tier", default="photoreal", choices=["photoreal", "daily"])
    ap.add_argument("--style", default="realistic", choices=list(STYLES))
    ap.add_argument("--dry-run", action="store_true", help="write workflow JSON only; never talks to ComfyUI")
    ap.add_argument("--validate", action="store_true", help="after a dry run, check every node class exists")
    ap.add_argument("--only", default="", help="comma list of frame indices to (re)generate")
    ap.add_argument("--seed-bump", type=int, default=0)
    ap.add_argument("--denoise", type=float, default=0.5, help="morph pass denoise (0.45 subtle .. 0.6 bolder)")
    ap.add_argument("--mid-boost", type=float, default=0.15, help="extra denoise at a segment's midpoint (4f(1-f) shaped)")
    ap.add_argument("--open-denoise", type=float, default=0.72, help="mouth inpaint denoise")
    ap.add_argument("--init", default="latent", choices=["latent", "pixel"])
    ap.add_argument("--ipa", type=float, default=0.45, help="total IPAdapter identity weight in the morph pass")
    ap.add_argument("--neg", default="")
    ap.add_argument("--no-caption", action="store_true", help="vet: skip the Florence-2 caption pass")
    ap.add_argument("--resume", action="store_true", help="skip frames whose outputs already exist")
    ap.add_argument("--chunk", type=int, default=0, help="morph/chomp: stop after N frames (the runner restarts the studio between chunks)")
    ap.add_argument("--key-ipa", type=float, default=0.45,
                    help="keys: IPAdapter weight of the adult reference when generating the newborn")
    ap.add_argument("--adult-ref", default="", help="keys: an existing image used as the ADULT's identity reference")
    ap.add_argument("--mouth-frac", default="", help="chomp: force the mouth box as x0,y0,x1,y1 fractions of the body bbox (use with --only)")
    ap.add_argument("--swap-closed", action="store_true",
                    help="chomp: the base frame's jaws are already open -> base becomes the open twin, inpaint a closed frame")
    ap.add_argument("--adult-ipa", type=float, default=0.6, help="keys: IPAdapter weight for --adult-ref")
    args = ap.parse_args()
    TIER_NAME = args.tier
    set_style(args.style)
    args.only = [int(x) for x in args.only.split(",") if x.strip()] if args.only else []
    pl = Pipeline(args)
    if args.show_prompts:
        for m in KEY_M:
            log(f"[{key_tag(m)}] {stage_prompt(pl.d, m)}\n")
        log(f"[neg] {pl.neg}")
        return
    stages = ["keys", "plates", "eggs", "morph", "chomp", "vet", "export"] if args.stage == "all" else [args.stage]
    for s in stages:
        getattr(pl, s)()
    if args.validate:
        log("== validate")
        bad = validate(pl.dry_dir)
        log("  ALL NODE CLASSES FOUND" if not bad else f"  MISSING: {bad}")


if __name__ == "__main__":
    main()
