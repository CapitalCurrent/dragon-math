"""LTX-Video image-to-video through the studio (ComfyUI native LTXV nodes, 2B 0.9.8 distilled).
Animates OUR frames: a start image, an optional END image (first+last-frame guidance), a motion
prompt -> per-frame PNGs + an animated webp preview.

  python ltx.py --start scene.png --prompt "..." --out work/ltx/adult-breathe [--end scene2.png]
      [--frames 49 --fps 24 --width 768 --height 448 --seed 1 --steps 8]
"""
import argparse, os, sys, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import morph as M

CKPT = "ltxv-2b-0.9.8-distilled.safetensors"
T5 = "t5-v1_1-xxl-encoder-Q5_K_M.gguf"
NEG = ("worst quality, inconsistent motion, blurry, jittery, distorted, deformed, extra limbs, morphing, "
       "text, watermark, static image, flicker")


def build(start, prompt, width, height, length, fps, seed, steps, prefix, end=None, end_strength=1.0, cfg=1.0):
    wf = {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "2": {"class_type": "CLIPLoaderGGUF", "inputs": {"clip_name": T5, "type": "ltxv"}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["2", 0]}},
        "5": {"class_type": "LoadImage", "inputs": {"image": start}},
        "6": {"class_type": "LTXVImgToVideo", "inputs": {"positive": ["3", 0], "negative": ["4", 0], "vae": ["1", 2],
              "image": ["5", 0], "width": width, "height": height, "length": length, "batch_size": 1, "strength": 1.0}},
    }
    pos, neg, lat = ["6", 0], ["6", 1], ["6", 2]
    if end:
        wf["7"] = {"class_type": "LoadImage", "inputs": {"image": end}}
        wf["8"] = {"class_type": "LTXVAddGuide", "inputs": {"positive": pos, "negative": neg, "vae": ["1", 2],
                   "latent": lat, "image": ["7", 0], "frame_idx": -1, "strength": end_strength}}
        pos, neg, lat = ["8", 0], ["8", 1], ["8", 2]
    wf.update({
        "9": {"class_type": "LTXVConditioning", "inputs": {"positive": pos, "negative": neg, "frame_rate": fps}},
        "10": {"class_type": "LTXVScheduler", "inputs": {"steps": steps, "max_shift": 2.05, "base_shift": 0.95,
               "stretch": True, "terminal": 0.1, "latent": lat}},
        "11": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "12": {"class_type": "SamplerCustom", "inputs": {"model": ["1", 0], "add_noise": True, "noise_seed": seed,
               "cfg": cfg, "positive": ["9", 0], "negative": ["9", 1], "sampler": ["11", 0], "sigmas": ["10", 0],
               "latent_image": lat}},
        "13": {"class_type": "VAEDecode", "inputs": {"samples": ["12", 0], "vae": ["1", 2]}},
        "14": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix + "/f", "images": ["13", 0]}},
        "15": {"class_type": "SaveAnimatedWEBP", "inputs": {"filename_prefix": prefix + "/preview", "images": ["13", 0],
               "fps": fps, "lossless": False, "quality": 85, "method": "default"}},
    })
    return wf


def run(args):
    M.GEN_TIMEOUT = args.timeout
    start = M.stage(args.start)
    end = M.stage(args.end) if args.end else None
    prefix = "dm_ltx_" + os.path.basename(args.out.rstrip("/\\"))
    wf = build(start, args.prompt, args.width, args.height, args.frames, args.fps, args.seed, args.steps, prefix,
               end=end, end_strength=args.end_strength)
    t0 = time.time()
    imgs = M.generate(wf, f"ltx {prefix} ({args.frames} frames {args.width}x{args.height})")
    os.makedirs(args.out, exist_ok=True)
    import shutil
    n = 0
    for p in sorted(imgs):
        base = os.path.basename(p)
        if base.startswith("f_") and base.endswith(".png"):
            shutil.copyfile(p, os.path.join(args.out, f"f{n:03d}.png")); n += 1
        elif base.endswith(".webp"):
            shutil.copyfile(p, os.path.join(args.out, "preview.webp"))
    print(f"{n} frames -> {args.out} in {time.time()-t0:.0f}s")
    return n


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", required=True)
    ap.add_argument("--end", default="")
    ap.add_argument("--end-strength", type=float, default=1.0)
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--frames", type=int, default=49)
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--width", type=int, default=768)
    ap.add_argument("--height", type=int, default=448)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--steps", type=int, default=8)
    ap.add_argument("--timeout", type=int, default=900)
    run(ap.parse_args())
