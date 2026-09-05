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
H_HATCH, H_ADULT = 0.38, 0.95   # subject height fractions at maturity 0 and 1
H_EGG = 0.36
KEY_M = [0.0, 1/3, 2/3, 1.0]    # keyframe maturities
GROWTH_P = [round(0.20 + 0.05 * i, 2) for i in range(17)]   # progress values that show a dragon
EGG_P = [0.0, 0.05, 0.10, 0.15]

# The daughter's brief (9/3): REALISTIC, serious-looking dragons - not cute-and-cartoony. A little
# softness is allowed in the hatchling and it drains away with age. The eggs she already likes stay.
# Guard rails learned the hard way: a bare "fierce dragon" prompt drifts demonic / humanoid, so the
# anatomy tokens ("natural quadruped dragon anatomy", "noble") and the negatives below stay in.
STYLE = ("realistic fantasy creature concept art, film-quality creature design, natural quadruped dragon "
         "anatomy, highly detailed scales, cinematic soft lighting, clean plain white background, full body, "
         "the entire dragon fully inside the frame with generous empty space around it, centered, "
         "facing the viewer at a three-quarter angle")
# The crack frames are low-denoise img2img of the egg she already likes, so the style tokens stay
# neutral: the egg's own look (the frost egg is near-photoreal glass) must survive.
EGG_STYLE = ("highly detailed realistic render, same style as the source, clean plain white background, "
             "centered, the whole egg fully inside the frame")
NEG_BASE = ("cropped, cut off, out of frame, wings cut off by the edge, close-up, text, watermark, "
            "signature, blurry, deformed, extra limbs, multiple dragons, two heads, human, humanoid, "
            "person, demonic, gore, cartoon, chibi, plush toy, background scenery, cave, landscape, "
            "ground shadow")

# Stage templates shared by every dragon: the cuteness drains out as maturity rises.
STAGE_TEMPLATES = {
    1.0: "(mighty adult {adult}:1.3), massive muscular body, {wings_adult}, long powerful neck, "
         "serious menacing stare, noble and dangerous, weathered scales",
    2/3: "adolescent {drake}, lean athletic body, {wings_drake}, serious alert expression, "
         "slightly oversized head",
    1/3: "juvenile {whelp}, compact rounded body, {wings_whelp}, big head, curious watchful expression, "
         "soft young scales",
    0.0: "(newborn {hatch}:1.3), tiny, very big round head, large round eyes, stubby legs, "
         "(tiny underdeveloped wing nubs:1.3), sitting, still wet from the egg, wide-eyed and curious",
}
WINGS = {   # wing phrasing per stage; "stubby" dragons never get spread wings
    "full":   ("huge fully grown wings spread wide", "large developing wings", "medium wings"),
    "stubby": ("small stubby wings held close to the body", "small stubby wings", "tiny stubby wings"),
}

# Per-dragon identity, straight from src/data/dragons.js (colours + physiology + stage names).
DRAGONS = {
    "ember": {
        "seed": 4100,
        "anchor": ("Ember the fire dragon, orange and red scales with lava-cracked texture, expressive "
                   "golden eyes, curved ram-like horns, flame-shaped back ridges, fiery glowing tail tip, "
                   "pointed bat-like wings"),
        "names": ("inferno dragon", "fire drake", "flame whelp", "spark hatchling dragon"),
        "wings": "full",
        "shell": "(dark red and orange lava egg shell with glowing cracks:1.3)",
        "neg": "blue eyes, green",
    },
    "frost": {
        "seed": 4200,
        "anchor": ("Frost the ice dragon, pale icy blue and white crystalline scales, silver-white eyes, "
                   "branching ice antler horns, fin-like ear frills, broad translucent frosted wings, "
                   "thin whip tail with an ice shard tip, sleek streamlined body, frost mist"),
        "names": ("glacial dragon", "blizzard drake", "frost whelp", "snow hatchling dragon"),
        "wings": "full",
        "shell": "(deep blue glassy egg shell with silver frost and snowflake patterns:1.3)",
        "neg": "orange, red, fire, warm colours",
    },
    "stone": {
        "seed": 4300,
        "anchor": ("Stone the earth dragon, mossy green and grey stone-textured scales, amber eyes, jagged "
                   "rock plates along the back, short blunt horns, thick club tail with a boulder tip, "
                   "thick trunk-like legs, wide stocky body, moss and vine patches"),
        "names": ("titan stone dragon", "mountain drake", "boulder whelp", "sprout hatchling dragon"),
        "wings": "stubby",
        "shell": "(grey stone egg shell covered in soft green moss:1.3)",
        "neg": "fire, orange, blue",
    },
    "shadow": {
        "seed": 4400,
        "anchor": ("Shadow the night dragon, deep purple and black scales with edges dissolving into wisps "
                   "of smoke, glowing violet eyes, long sinuous serpentine body, narrow head with long fangs, "
                   "tall pointed ears, thin sharp straight horns, tall narrow bat wings, extra-long whip tail"),
        "names": ("void dragon", "phantom drake", "night whelp", "shade hatchling dragon"),
        "wings": "full",
        "shell": "(dark purple egg shell with glowing violet vein patterns and wisps of smoke:1.3)",
        "neg": "bright colours, orange, fire, red eyes",
    },
    "glimmer": {
        "seed": 4500,
        "anchor": ("Glimmer the light dragon, luminous golden and white scales, radiant amber-gold eyes, "
                   "feathered angel-like wings, a feather crest along the spine, elegant spiral horns, "
                   "long flowing ear frills, long flowing tail with a plume, slim graceful body, soft sparkles"),
        "names": ("celestial light dragon", "solar drake", "radiant whelp", "sparkle hatchling dragon"),
        "wings": "full",
        "shell": "(glowing golden egg shell radiating warm light:1.3)",
        "neg": "dark, black, fire, red",
    },
    "storm": {
        "seed": 4600,
        "anchor": ("Storm the lightning dragon, electric blue and cyan scales with a crackling energy "
                   "texture, bright yellow eyes, lightning-bolt shaped spines, jagged storm wings, forked "
                   "lightning tail, zigzag lightning horns, aerodynamic swept frills, muscular athletic build, "
                   "small electric sparks"),
        "names": ("hurricane storm dragon", "tempest drake", "gale whelp", "breeze hatchling dragon"),
        "wings": "full",
        "shell": "(stormy blue-grey egg shell crackling with static lightning:1.3)",
        "neg": "fire, orange, red",
    },
}

def _expand(d):
    """Fill the per-maturity descriptors from the templates (once, at import)."""
    adult, drake, whelp, hatch = d["names"]
    wa, wd, ww = WINGS[d["wings"]]
    d["m"] = {m: tpl.format(adult=adult, drake=drake, whelp=whelp, hatch=hatch,
                            wings_adult=wa, wings_drake=wd, wings_whelp=ww)
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

def bracket(m):
    """Bracketing keyframe maturities (a <= m <= b) and the fraction f toward b."""
    for a, b in zip(KEY_M, KEY_M[1:]):
        if a - 1e-9 <= m <= b + 1e-9:
            return a, b, 0.0 if b == a else (m - a) / (b - a)
    return KEY_M[-2], KEY_M[-1], 1.0

def key_tag(m):
    return {0.0: "hatch", 1/3: "whelp", 2/3: "drake", 1.0: "adult"}[m]

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
    if sub.width * s > W * 0.96:            # width-limited (spread wings)
        s = W * 0.96 / sub.width
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

def rembg_rgba(png, model="birefnet-general"):
    return Image.open(cc().remove_bg(png, model)).convert("RGBA")

def save_png(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path)
    return path

def stage(path):
    return cc().stage_image(path)

def run(wf, label, dry, dry_dir):
    """Queue one workflow (or, in --dry-run, write its JSON). Returns the output image paths."""
    if dry:
        os.makedirs(dry_dir, exist_ok=True)
        p = os.path.join(dry_dir, re.sub(r"[^\w.-]+", "_", label) + ".json")
        with open(p, "w") as f:
            json.dump(wf, f, indent=1)
        log(f"  [dry] wrote {os.path.relpath(p, HERE)}")
        return []
    return cc().generate(wf, label)

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
        self.work = os.path.join(HERE, "work", self.name)
        self.dry_dir = os.path.join(self.work, "dry")
        self.seed = self.d["seed"] + args.seed_bump
        os.makedirs(self.work, exist_ok=True)
        self.neg = NEG_BASE + ", " + self.d["neg"] + (", " + args.neg if args.neg else "")

    def p(self, *parts):
        return os.path.join(self.work, *parts)

    def only(self, idx):
        return (not self.a.only) or idx in self.a.only

    def skip(self, idx, *outputs):
        """--resume: skip a frame whose outputs already exist (unless it was named in --only)."""
        if self.a.only:
            return idx not in self.a.only
        return self.a.resume and all(os.path.exists(o) for o in outputs)

    # -- stage: probe (uses the EXISTING sprites, proves the morph pass before any keyframe work)
    def probe(self):
        log("== probe: morph pass between the existing whelp2 and drake sprites")
        a = Image.open(os.path.join(ART, "ember-whelp2.webp")).convert("RGBA")
        b = Image.open(os.path.join(ART, "ember-drake.webp")).convert("RGBA")
        pa, _ = place_on_canvas(a, height_for(1/3))
        pb, _ = place_on_canvas(b, height_for(2/3))
        pa_path = save_png(pa, self.p("probe", "plate_a.png"))
        pb_path = save_png(pb, self.p("probe", "plate_b.png"))
        na, nb = ("plate_a.png", "plate_b.png") if self.a.dry_run else (stage(pa_path), stage(pb_path))
        pra, prb = stage_prompt(self.d, 1/3), stage_prompt(self.d, 2/3)
        outs = []
        for f in (0.0, 0.25, 0.5, 0.75, 1.0):
            wf = build_morph(tier(), pra, prb, f, self.neg, na, nb, self.a.denoise, self.seed,
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
        adult = self.gated_txt2img(stage_prompt(self.d, 1.0), "adult")
        if self.a.dry_run:
            run(cc().build_img2img(t, stage_prompt(self.d, 2/3), self.neg, "adult.png", 0.62, self.seed, "dm_key_drake"),
                "key drake", True, self.dry_dir)
            run(cc().build_img2img(t, stage_prompt(self.d, 1/3), self.neg, "drake.png", 0.62, self.seed, "dm_key_whelp"),
                "key whelp", True, self.dry_dir)
            run(cc().build_sdxl(t, stage_prompt(self.d, 0.0), self.neg, W, H, self.seed, "dm_key_hatchinit"),
                "key hatch-init", True, self.dry_dir)
            run(build_hybrid(t, stage_prompt(self.d, 0.0), self.neg, "hatchinit.png", "adult.png", 0.55, 0.5,
                             self.seed, "dm_key_hatch"), "key hatch hybrid", True, self.dry_dir)
            return
        # de-age chain: composition is inherited from the init, so identity holds while proportions shift
        drake = copy_out(cc().generate(cc().build_img2img(t, stage_prompt(self.d, 2/3), self.neg, stage(adult),
                         0.62, self.seed, "dm_key_drake"), "key drake"), self.p("keys", "drake.png"))
        whelp = copy_out(cc().generate(cc().build_img2img(t, stage_prompt(self.d, 1/3), self.neg, stage(drake),
                         0.62, self.seed, "dm_key_whelp"), "key whelp"), self.p("keys", "whelp.png"))
        # hatchling: pure img2img cannot change proportions (composition lock) and pure IPAdapter copies
        # the composition too -> HYBRID: cute-proportioned init + identity from the adult ref.
        # (This hybrid graph once crashed the XPU when run back-to-back with others: it runs LAST here.)
        init = self.gated_txt2img(stage_prompt(self.d, 0.0), "hatchinit")
        hatch = copy_out(cc().generate(build_hybrid(t, stage_prompt(self.d, 0.0), self.neg, stage(init), stage(adult),
                         0.55, 0.5, self.seed, "dm_key_hatch"), "key hatch hybrid"), self.p("keys", "hatch.png"))
        for tag, path in (("adult", adult), ("drake", drake), ("whelp", whelp), ("hatch", hatch)):
            rgba = rembg_rgba(path)
            save_png(rgba, self.p("keys", f"{tag}_rgba.png"))
            log(f"  {tag}: alpha bbox {alpha_bbox(rgba)} edge-contact {edge_contact(rgba) or 'none'}")
        self.contact([self.p("keys", f"{k}_rgba.png") for k in ("hatch", "whelp", "drake", "adult")],
                     self.p("keys", "contact.png"), cols=4)

    def gated_txt2img(self, prompt, tag, tries=8):
        """txt2img on the shared canvas; reroll the seed until the subject is fully inside the frame."""
        t = tier()
        for i in range(tries):
            seed = self.seed + i
            out = run(cc().build_sdxl(t, prompt, self.neg, W, H, seed, f"dm_key_{tag}"),
                      f"key {tag} seed={seed}", self.a.dry_run, self.dry_dir)
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
        for m in KEY_M:
            tag = key_tag(m)
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
        plate, _ = place_on_canvas(egg, H_EGG)
        plate_path = save_png(plate, self.p("eggs", "egg_plate.png"))
        name = "egg_plate.png" if self.a.dry_run else stage(plate_path)
        base = f"{self.d['shell']}, a single dragon egg sitting upright, {EGG_STYLE}"
        # CHAINED on purpose (the one place chaining is right): each crack frame is a LOW-denoise pass
        # over the previous frame, so the crack pattern is inherited and GROWS instead of being redrawn
        # - "no sudden changes except the hatch" (Ryan 9/5). Three steps are too few to drift.
        steps = [
            (0.22, f"{base}, intact smooth shell, faint inner glow"),
            (0.32, f"{base}, (a thin hairline crack:1.3) on the shell, faint light leaking from the crack"),
            (0.36, f"{base}, (the same cracks spreading wider across the shell:1.4), small chips loosening, "
                   "bright light leaking out"),
            (0.40, f"{base}, (the cracks bursting open:1.4), shell pieces breaking away, blazing light pouring out"),
        ]
        neg = self.neg + ", dragon, creature, hatchling, animal"
        prev = name
        for i, (dn, prompt) in enumerate(steps):
            dest = self.p("eggs", f"egg_{i}.png")
            if self.skip(i, self.p("eggs", f"egg_{i}_rgba.png")):
                prev = f"egg_{i}.png" if self.a.dry_run else stage(dest)
                continue
            out = run(cc().build_img2img(t, prompt, neg, prev, dn, self.seed, f"dm_egg_{i}"),
                      f"egg {i} d={dn} <- {prev}", self.a.dry_run, self.dry_dir)
            got = copy_out(out, dest)
            if got:
                save_png(rembg_rgba(got), self.p("eggs", f"egg_{i}_rgba.png"))
                prev = stage(got)
            else:
                prev = f"egg_{i}.png"

    # -- stage: morph
    def morph(self):
        log(f"== morph: {len(GROWTH_P)} growth frames (denoise {self.a.denoise}, init {self.a.init}, ipa {self.a.ipa})")
        t = tier()
        names = {m: (f"{key_tag(m)}.png" if self.a.dry_run else stage(self.p("plates", f"{key_tag(m)}.png")))
                 for m in KEY_M}
        for i, p in enumerate(GROWTH_P):
            if self.skip(i, self.p("morph", f"f{i:02d}_rgba.png")):
                continue
            m = maturity(p)
            a, b, f = bracket(m)
            wf = build_morph(t, stage_prompt(self.d, a), stage_prompt(self.d, b), f, self.neg, names[a], names[b],
                             self.a.denoise, self.seed, f"dm_morph_{i:02d}", ipa_w=self.a.ipa, init=self.a.init)
            out = run(wf, f"morph {i:02d} p={p} m={m:.3f} [{key_tag(a)}->{key_tag(b)} f={f:.2f}]",
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
        for i, p in enumerate(GROWTH_P):
            if self.skip(i, self.p("chomp", f"f{i:02d}_open_rgba.png")):
                continue
            src = self.p("morph", f"f{i:02d}.png")
            name = f"f{i:02d}.png" if self.a.dry_run else stage(src)
            box_out = run(build_head_box(name, f"dm_head_{i:02d}"), f"head box {i:02d}", self.a.dry_run, self.dry_dir)
            if self.a.dry_run:
                run(cc().build_sdxl_inpaint(t, "prompt", self.neg, name, "mask.png", 0.72, self.seed, f"dm_open_{i:02d}", grow=10),
                    f"open {i:02d}", True, self.dry_dir)
                log("  [dry] chomp graphs emitted for frame 00 only")
                break
            head = self.head_bbox(box_out)
            if head is None:
                log(f"  {i:02d}: Florence found no head -> falling back to the alpha top-third")
                x0, y0, x1, y1 = alpha_bbox(Image.open(self.p("morph", f"f{i:02d}_rgba.png")))
                head = (x0 + (x1 - x0) * 0.3, y0, x0 + (x1 - x0) * 0.8, y0 + (y1 - y0) * 0.38)
            mouth = self.mouth_rect(head)
            mask = Image.new("L", (W, H), 0)
            ImageDraw.Draw(mask).rectangle(mouth, fill=255)
            mname = stage(save_png(mask, self.p("chomp", f"f{i:02d}_mask.png")))
            prompt = f"(mouth wide open, roaring happily, open jaws, visible teeth:1.4), {stage_prompt(self.d, maturity(p))}"
            neg = self.neg + ", closed mouth, smile with closed lips"
            out = cc().generate(cc().build_sdxl_inpaint(t, prompt, neg, name, mname, self.a.open_denoise, self.seed,
                                f"dm_open_{i:02d}", grow=10), f"open {i:02d}")
            dest = copy_out(out, self.p("chomp", f"f{i:02d}_open.png"))
            if dest:
                save_png(rembg_rgba(dest), self.p("chomp", f"f{i:02d}_open_rgba.png"))
                mouths[str(i)] = {"head": [round(v) for v in head], "mouth": [round(v) for v in mouth],
                                  "cx": round((mouth[0] + mouth[2]) / 2 / W, 4),
                                  "cy": round((mouth[1] + mouth[3]) / 2 / H, 4)}
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

    @staticmethod
    def mouth_rect(head):
        """The mouth lives in the lower ~half of the head box; pad so the jaw can drop."""
        x0, y0, x1, y1 = head
        hw, hh = x1 - x0, y1 - y0
        return (max(0, x0 - hw * 0.08), y0 + hh * 0.48, min(W, x1 + hw * 0.08), min(H, y1 + hh * 0.22))

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
    ap.add_argument("--stage", default="probe",
                    choices=["probe", "keys", "plates", "eggs", "morph", "chomp", "vet", "export", "all"])
    ap.add_argument("--tier", default="photoreal", choices=["photoreal", "daily"])
    ap.add_argument("--dry-run", action="store_true", help="write workflow JSON only; never talks to ComfyUI")
    ap.add_argument("--validate", action="store_true", help="after a dry run, check every node class exists")
    ap.add_argument("--only", default="", help="comma list of frame indices to (re)generate")
    ap.add_argument("--seed-bump", type=int, default=0)
    ap.add_argument("--denoise", type=float, default=0.5, help="morph pass denoise (0.45 subtle .. 0.6 bolder)")
    ap.add_argument("--open-denoise", type=float, default=0.72, help="mouth inpaint denoise")
    ap.add_argument("--init", default="latent", choices=["latent", "pixel"])
    ap.add_argument("--ipa", type=float, default=0.45, help="total IPAdapter identity weight in the morph pass")
    ap.add_argument("--neg", default="")
    ap.add_argument("--no-caption", action="store_true", help="vet: skip the Florence-2 caption pass")
    ap.add_argument("--resume", action="store_true", help="skip frames whose outputs already exist")
    args = ap.parse_args()
    TIER_NAME = args.tier
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
