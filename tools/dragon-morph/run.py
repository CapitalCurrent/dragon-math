#!/usr/bin/env python
"""Unattended runner: take each dragon from nothing to a VET-CLEAN frame set, then build a review
packet. Nothing is exported into the app until Claude has looked at the packet and the run is
approved with --approve. The user only ever sees approved frames.

  python run.py --dragons all            # ember, frost, stone, shadow, glimmer, storm in turn
  python run.py --dragons ember,frost    # a subset
  python run.py --approve ember          # after review: export into src/assets/art/morph/ember

Per dragon: [start ComfyUI if needed] keys -> plates -> eggs -> morph -> chomp -> vet
            -> up to --rounds reroll rounds of whatever vet flagged (new seed each round) -> packet.
Every stage is a separate morph.py process with --resume, so a crash (the Arc's XPU device-loss)
costs one stage: the runner restarts ComfyUI (its own portable python only) and continues where
the outputs stop. Everything is logged to work/<dragon>/run.log.
"""
import argparse, datetime, json, os, shutil, subprocess, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import morph as M   # constants only (KEY_M, GROWTH_P, maturity); never runs anything
STUDIO = r"F:\Software Builds\ComfyUI_Windows_portable"
SERVER = "http://127.0.0.1:8188"
PY = sys.executable
MORPH = os.path.join(HERE, "morph.py")
ORDER = ["ember", "frost", "stone", "shadow", "glimmer", "storm"]
PIPELINE = ["keys", "plates", "eggs", "subdivide", "morph", "chomp"]
SUBDIVIDE = [[0.5], [0.25, 0.75]]   # midpoint first, then the quarter points: every frame descends from the 2 anchors
KEY_TRIES = 3                       # seeds tried per subdivision key; the cleanest cutout wins
CHUNK = 3                           # frames per studio session before a proactive restart (wedge avoidance)


def ghost_score(rgba_path):
    """Unresolved blends leave translucent ghosts: the share of semi-transparent pixels after
    background removal, relative to the opaque body. Lower is cleaner."""
    import numpy as np
    from PIL import Image
    a = np.asarray(Image.open(rgba_path).convert("RGBA"))[:, :, 3]
    return float(((a > 20) & (a <= 230)).sum()) / max(1, (a > 230).sum())
WORK = os.path.join(HERE, "work")
SETTINGS = os.path.join(WORK, "settings.json")       # the tuned knobs, persisted across sessions
CHECKPOINT = os.path.join(WORK, "checkpoint.json")   # where the runner was, updated at every step
KNOBS = ("tier", "style", "denoise", "open_denoise", "init", "ipa", "rounds", "no_caption")


def load_settings(args, argv):
    """Knobs given on this command line win; otherwise the persisted ones; otherwise the defaults.
    Whatever results is written back, so the NEXT session starts from the same tuning."""
    os.makedirs(WORK, exist_ok=True)
    saved = {}
    if os.path.exists(SETTINGS):
        with open(SETTINGS) as f:
            saved = json.load(f)
    given = {a.lstrip("-").replace("-", "_").split("=")[0] for a in argv if a.startswith("--")}
    for k in KNOBS:
        if k in saved and k not in given:
            setattr(args, k, saved[k])
    with open(SETTINGS, "w") as f:
        json.dump({k: getattr(args, k) for k in KNOBS}, f, indent=1)
    return args


def checkpoint(**state):
    state["at"] = datetime.datetime.now().isoformat(timespec="seconds")
    with open(CHECKPOINT, "w") as f:
        json.dump(state, f, indent=1)


def last_checkpoint():
    if os.path.exists(CHECKPOINT):
        with open(CHECKPOINT) as f:
            return json.load(f)
    return None


def up():
    try:
        urllib.request.urlopen(SERVER + "/system_stats", timeout=3).read()
        return True
    except Exception:
        return False


def wait_up(timeout=300):
    t0 = time.time()
    while time.time() - t0 < timeout:
        if up():
            return True
        time.sleep(3)
    return False


def launch_comfy():
    """Boot ComfyUI OURSELVES with the studio's environment but WITHOUT --disable-smart-memory.
    That flag (right for the interactive studio) unloads every model after each prompt, so a batch
    reloads ~6.5 GB per frame and the Arc dies during the load (UR_RESULT_ERROR_DEVICE_LOST, every
    2-3 frames on 9/5). With models resident the load happens once per session."""
    env = dict(os.environ)
    env.update({
        "HF_HUB_CACHE": os.path.join(STUDIO, "HuggingFaceHub"),
        "TORCH_HOME": os.path.join(STUDIO, "TorchHome"),
        "PYTHONPYCACHEPREFIX": os.path.join(STUDIO, "pycache"),
        "ONEAPI_DEVICE_SELECTOR": "level_zero:0",
        "PYTORCH_ALLOC_CONF": "expandable_segments:True",
        "PATH": env.get("PATH", "") + ";" + os.path.join(STUDIO, "MinGit", "cmd") + ";"
                + os.path.join(STUDIO, "python_standalone", "Scripts"),
    })
    out = open(os.path.join(WORK, "comfy.out"), "a", encoding="utf-8")
    flags = subprocess.CREATE_NEW_PROCESS_GROUP | getattr(subprocess, "DETACHED_PROCESS", 0)
    subprocess.Popen([os.path.join(STUDIO, "python_standalone", "python.exe"), "-s",
                      os.path.join("ComfyUI", "main.py"), "--windows-standalone-build", "--disable-smart-memory", "--disable-auto-launch"],
                     cwd=STUDIO, env=env, stdout=out, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL,
                     creationflags=flags)


def start_comfy(log):
    if up():
        return True
    log("ComfyUI not running -> launching it (models resident, no --disable-smart-memory)")
    launch_comfy()
    ok = wait_up()
    log("ComfyUI is up" if ok else "ComfyUI did not come up in 5 min")
    return ok


def restart_comfy(log):
    """Stop ONLY the ComfyUI server process (matched on its main.py command line) and start it again.
    NEVER Restart-ComfyUI.bat from here: it kills every process on the studio's portable python,
    and this runner IS one of those - it killed itself that way at 03:34 on 9/5 and sat dead 5 hours."""
    log("restarting ComfyUI (targeted: the ComfyUI main.py process only)")
    ps = ("Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'python.exe' -and "
          "$_.CommandLine -like '*ComfyUI*main.py*' } | ForEach-Object { "
          "Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue; $_.ProcessId }")
    try:
        out = subprocess.run(["powershell", "-NoProfile", "-Command", ps], capture_output=True, text=True,
                             timeout=60).stdout.split()
    except Exception as e:
        out = [f"(kill failed: {e})"]
    log(f"  stopped ComfyUI pid(s): {' '.join(out) or 'none found'}")
    time.sleep(5)
    launch_comfy()
    ok = wait_up()
    log("ComfyUI is back" if ok else "ComfyUI did not come back")
    return ok


class Runner:
    def __init__(self, dragon, args):
        self.dragon, self.args = dragon, args
        self.work = os.path.join(HERE, "work", dragon + (f"-{args.variant}" if getattr(args, "variant", "") else ""))
        os.makedirs(os.path.join(self.work, "review"), exist_ok=True)
        self.logf = open(os.path.join(self.work, "run.log"), "a", encoding="utf-8")

    def log(self, msg):
        line = f"[{datetime.datetime.now():%H:%M:%S}] {msg}"
        print(line, flush=True)
        self.logf.write(line + "\n")
        self.logf.flush()

    def stage(self, name, extra=()):
        a = self.args
        cmd = [PY, MORPH, "--dragon", self.dragon, "--stage", name, "--resume", "--tier", a.tier,
               "--denoise", str(a.denoise), "--init", a.init, "--ipa", str(a.ipa),
               "--open-denoise", str(a.open_denoise), "--style", a.style] + list(extra)
        if a.adult_ref and name == "keys":
            cmd += ["--adult-ref", a.adult_ref, "--adult-ipa", str(a.adult_ipa)]
        if getattr(a, "variant", ""):
            cmd += ["--variant", a.variant]
        if a.seed_bump and "--seed-bump" not in extra:
            cmd += ["--seed-bump", str(a.seed_bump)]
        self.log("> " + " ".join(cmd[2:]))
        proc = subprocess.Popen(cmd, cwd=HERE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True,
                                encoding="utf-8", errors="replace")
        for line in proc.stdout:
            self.log("  " + line.rstrip())
        return proc.wait()

    def attempt(self, name, extra=(), tries=3):
        checkpoint(dragon=self.dragon, stage=name, extra=list(extra), status="running")
        for k in range(tries):
            if not up() and not (restart_comfy(self.log) if k else start_comfy(self.log)):
                continue
            t0 = time.time()
            rc = self.stage(name, extra)
            self.log(f"{name}: rc={rc} in {time.time()-t0:.0f}s")
            if rc == 0:
                return True
            self.log(f"{name} FAILED (try {k+1}/{tries})")
            if k < tries - 1:
                restart_comfy(self.log)
        return False

    def reroll_list(self):
        p = os.path.join(self.work, "vet", "reroll.json")
        if not os.path.exists(p):
            return {"growth": [], "eggs": []}
        with open(p) as f:
            return json.load(f)

    def keys(self):
        p = os.path.join(self.work, "keys", "keys.json")
        extra = json.load(open(p)) if os.path.exists(p) else []
        return sorted(set(M.KEY_M) | set(extra))

    def promote_candidates(self, flagged):
        """A segment between two keyframes with 2+ flagged frames is too wide a gap to morph: pick its
        cleanest frame nearest the midpoint to promote to a keyframe (never a flagged one, never a
        segment already narrower than MIN_SEG)."""
        MIN_SEG = 0.12
        keys, out = self.keys(), []
        for lo, hi in zip(keys, keys[1:]):
            seg = [i for i, p in enumerate(M.GROWTH_P) if lo < M.maturity(p) < hi]
            bad = [i for i in seg if i in flagged]
            clean = [i for i in seg if i not in flagged]
            if len(bad) >= 2 and (hi - lo) > MIN_SEG and seg:
                # prefer a clean frame; when the whole segment is flagged (a wing-unfurl segment on
                # 9/5) the midpoint frame is still a real, resolved frame - halving the gap is the fix
                mid = (lo + hi) / 2
                out.append(min(clean or seg, key=lambda i: abs(M.maturity(M.GROWTH_P[i]) - mid)))
        return out

    def subdivide(self):
        """Build the family tree between the two anchors: morph the midpoint frame from adult+newborn,
        promote it to a keyframe, then the quarter points from their halves. Every later frame then
        morphs between keys that are themselves descendants of the same two images."""
        for level in SUBDIVIDE:
            keys = self.keys()
            for m in level:
                if any(abs(k - m) < 1e-6 for k in keys):
                    self.log(f"subdivide: key at m={m} already exists")
                    continue
                idx = min(range(len(M.GROWTH_P)), key=lambda i: abs(M.maturity(M.GROWTH_P[i]) - m))
                # a key is the root of everything below it: try KEY_TRIES seeds, keep the cleanest cutout
                best, best_score = None, 1e9
                src = os.path.join(self.work, "morph", f"f{idx:02d}")
                for bump in range(KEY_TRIES):
                    if not self.attempt("morph", ["--only", str(idx), "--seed-bump", str(bump)]):
                        return False
                    if not os.path.exists(src + "_rgba.png"):
                        self.log(f"subdivide m={m} seed+{bump}: no output - skipping this try")
                        continue
                    score = ghost_score(src + "_rgba.png")
                    self.log(f"subdivide m={m} seed+{bump}: ghost score {score:.3f}")
                    if score < best_score:
                        best_score = score
                        for ext in (".png", "_rgba.png"):
                            shutil.copyfile(src + ext, src + "_best" + ext)
                if best_score >= 1e9:
                    self.log(f"subdivide m={m}: every try failed")
                    return False
                for ext in (".png", "_rgba.png"):
                    shutil.copyfile(src + "_best" + ext, src + ext)
                    os.remove(src + "_best" + ext)
                self.log(f"subdivide m={m}: kept the cleanest (score {best_score:.3f})")
                if not self.attempt("promote", ["--only", str(idx)]):
                    return False
        self.log(f"subdivide: keys now {self.keys()}")
        return True

    def remaining(self, stage):
        sub, suffix = ("morph", "_rgba.png") if stage == "morph" else ("chomp", "_open_rgba.png")
        return [i for i in range(len(M.GROWTH_P))
                if not os.path.exists(os.path.join(self.work, sub, f"f{i:02d}{suffix}"))]

    def chunked(self, stage):
        """The Arc wedges every few IPAdapter+img2img frames: run the stage CHUNK frames at a time and
        restart the studio between chunks, before it can wedge (a wedge costs 150 s + a restart)."""
        guard = 0
        while self.remaining(stage) and guard < 12:
            guard += 1
            if not self.attempt(stage, ["--chunk", str(CHUNK)]):
                return False
            if self.remaining(stage):
                self.log(f"{stage}: {len(self.remaining(stage))} frames left - proactive studio restart")
                restart_comfy(self.log)
        return not self.remaining(stage)

    def reload_settings(self):
        if os.path.exists(SETTINGS):
            with open(SETTINGS) as f:
                for k, v in json.load(f).items():
                    setattr(self.args, k, v)

    def prior_status(self):
        p = os.path.join(self.work, "review", "status.json")
        if os.path.exists(p):
            with open(p) as f:
                return json.load(f)
        return None

    def run(self):
        prior = self.prior_status()
        if prior and prior.get("clean") and not self.args.force:
            self.log(f"===== {self.dragon}: already CLEAN ({prior.get('finished')}) - skipping (use --force to redo)")
            return prior
        self.log(f"===== {self.dragon}: tier {self.args.tier} denoise {self.args.denoise} init {self.args.init} ipa {self.args.ipa}"
                 + (f"  (resuming: prior run reached {prior.get('failed_stage') or 'vet'})" if prior else ""))
        status = {"dragon": self.dragon, "clean": False, "rounds": 0, "failed_stage": None, "flagged": None,
                  "promoted": [], "started": datetime.datetime.now().isoformat(timespec="seconds")}
        if self.args.sweep and not os.path.exists(os.path.join(WORK, "sweep.done")):
            if self.attempt("sweep"):
                open(os.path.join(WORK, "sweep.done"), "w").write(self.dragon)
                self.reload_settings()
                self.log(f"sweep picked denoise {self.args.denoise} init {self.args.init} ipa {self.args.ipa}")
        for s in PIPELINE:
            ok = self.subdivide() if s == "subdivide" else \
                 self.chunked(s) if s in ("morph", "chomp") else self.attempt(s)
            if not ok:
                status["failed_stage"] = s
                return self.finish(status)
            if s == self.args.stop_after:
                self.log(f"stopping after '{s}' for Claude's review (re-run the same command to continue)")
                status["failed_stage"] = f"paused-after-{s}"
                return self.finish(status)
        vet_extra = ["--no-caption"] if self.args.no_caption else []
        for r in range(1, self.args.rounds + 1):
            if not self.attempt("vet", vet_extra):
                status["failed_stage"] = "vet"
                return self.finish(status)
            rr = self.reroll_list()
            status["rounds"] = r
            if not rr["growth"] and not rr["eggs"]:
                status["clean"] = True
                break
            self.log(f"round {r}: vet flagged growth {rr['growth']} eggs {rr['eggs']}")
            # a rough SEGMENT is a keyframe gap too wide to morph: halve it by promoting a clean frame
            promos = self.promote_candidates(set(rr["growth"])) if rr["growth"] else []
            if promos:
                self.log(f"round {r}: promoting frames {promos} to keyframes (segment too wide), re-morphing their halves")
                for i in promos:
                    self.attempt("promote", ["--only", str(i)])
                status["promoted"] += promos
                self.attempt("morph")           # --resume rebuilds only the cleared frames
                self.attempt("chomp")
                continue                        # next round measures the halves before any seed reroll
            self.log(f"round {r}: reroll with seed bump {r}")
            if rr["growth"]:
                csv = ",".join(str(i) for i in rr["growth"])
                self.attempt("morph", ["--only", csv, "--seed-bump", str(r)])
                self.attempt("chomp", ["--only", csv])
            if rr["eggs"]:
                csv = ",".join(str(i) for i in rr["eggs"])
                self.attempt("eggs", ["--only", csv, "--seed-bump", str(r)])
        else:
            self.attempt("vet", vet_extra)          # final measure after the last reroll round
            rr = self.reroll_list()
            status["clean"] = not rr["growth"] and not rr["eggs"]
        status["flagged"] = self.reroll_list()
        return self.finish(status)

    def finish(self, status):
        status["finished"] = datetime.datetime.now().isoformat(timespec="seconds")
        checkpoint(dragon=self.dragon, stage="done", status="clean" if status["clean"] else "not-clean",
                   failed_stage=status["failed_stage"])
        with open(os.path.join(self.work, "review", "status.json"), "w") as f:
            json.dump(status, f, indent=1)
        self.packet(status)
        self.log(f"===== {self.dragon}: {'CLEAN' if status['clean'] else 'NOT CLEAN'} after {status['rounds']} vet round(s)"
                 + (f"; failed at {status['failed_stage']}" if status["failed_stage"] else ""))
        self.logf.close()
        return status

    def packet(self, status):
        """review/packet.md: everything Claude needs to look at, in order, with the checklist."""
        rel = lambda *p: os.path.relpath(os.path.join(self.work, *p), os.path.join(self.work, "review")).replace("\\", "/")
        items = [
            ("Keyframes", rel("keys", "contact.png"), "hatch / whelp / drake / adult. Identity holds across all four? "
             "Realistic, serious (softness only in the hatchling)? Whole body inside every frame?"),
            ("Growth frames with vet flags", rel("vet", "contact.png"), "Read left to right: does it GROW a little "
             "each step with no jump, no size flip, no identity change? Feet on the same line?"),
            ("Closed / open pairs", rel("vet", "pairs.png"), "Each pair: mouth actually open, nothing else moved."),
            ("Eggs + first dragon frames", rel("vet", "eggs.png"), "Cracks escalate 0->3 and the egg keeps its look; "
             "hatchling sits where the egg stood."),
            ("Vet report", rel("vet", "report.md"), "Numbers behind the flags; the reroll command."),
            ("Scrub viewer", rel("viewer-morph.html"), "Open in a browser: arrows scrub, play animates."),
        ]
        lines = [f"# Review packet - {self.dragon}", "",
                 f"status: **{'CLEAN' if status['clean'] else 'NOT CLEAN'}** after {status['rounds']} vet round(s)"
                 + (f" - FAILED at stage `{status['failed_stage']}`" if status["failed_stage"] else "")
                 + (f" - promoted frames {status['promoted']} to keyframes" if status.get("promoted") else ""),
                 f"flagged now: `{json.dumps(status.get('flagged'))}`", "",
                 "Claude reviews every image below BEFORE `run.py --approve` exports anything to the app.", ""]
        for title, path, ask in items:
            exists = os.path.exists(os.path.join(self.work, "review", path))
            lines += [f"## {title}{'' if exists else ' (missing)'}", f"`{path}`", "", ask, ""]
        lines += ["## Verdict", "", "- [ ] approve -> `python run.py --approve " + self.dragon + "`",
                  "- [ ] reroll frames: `python morph.py --dragon " + self.dragon +
                  " --stage morph --only <i,j> --seed-bump <n>` then `--stage chomp --only <i,j>` then `--stage vet`",
                  "- [ ] regenerate keyframes (delete work/" + self.dragon + "/keys and re-run)", ""]
        with open(os.path.join(self.work, "review", "packet.md"), "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        self.log(f"review packet -> work/{self.dragon}/review/packet.md")


def approve(dragon, args):
    r = Runner(dragon, args)
    st_path = os.path.join(r.work, "review", "status.json")
    st = json.load(open(st_path)) if os.path.exists(st_path) else {}
    r.log(f"APPROVE {dragon} (vet status: {'clean' if st.get('clean') else 'NOT clean - approving anyway on review'})")
    ok = r.stage("export") == 0
    with open(os.path.join(r.work, "review", "approved.json"), "w") as f:
        json.dump({"dragon": dragon, "approved": datetime.datetime.now().isoformat(timespec="seconds"),
                   "exported": ok}, f, indent=1)
    r.log("exported into src/assets/art/morph/" + dragon if ok else "EXPORT FAILED")
    r.logf.close()
    return ok


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dragons", default="ember", help="'all' or a comma list, run in order")
    ap.add_argument("--approve", default="", help="dragon to export after Claude's review")
    ap.add_argument("--rounds", type=int, default=3, help="max vet/reroll rounds per dragon")
    ap.add_argument("--tier", default="photoreal", choices=["photoreal", "daily"])
    ap.add_argument("--style", default="realistic", choices=["graphic-novel", "realistic", "painterly"])
    ap.add_argument("--denoise", type=float, default=0.5)
    ap.add_argument("--open-denoise", type=float, default=0.72)
    ap.add_argument("--init", default="latent", choices=["latent", "pixel"])
    ap.add_argument("--ipa", type=float, default=0.45)
    ap.add_argument("--no-caption", action="store_true", help="skip Florence captions in vet (faster)")
    ap.add_argument("--force", action="store_true", help="re-run dragons already marked clean")
    ap.add_argument("--seed-bump", type=int, default=0, help="forwarded to every stage (reroll the whole dragon)")
    ap.add_argument("--adult-ref", default="", help="an existing image as the adult's identity reference (keys stage)")
    ap.add_argument("--adult-ipa", type=float, default=0.6)
    ap.add_argument("--variant", default="", help="work folder suffix: work/<dragon>-<variant> (one per style set)")
    ap.add_argument("--stop-after", default="", choices=["", "keys", "plates", "eggs", "morph", "chomp"],
                    help="pause after this stage so Claude can review (keys = approve the 4 keyframes first)")
    ap.add_argument("--sweep", action="store_true",
                    help="before the first dragon: auto-tune denoise/init/ipa on a 3-frame grid and persist the winner")
    ap.add_argument("--status", action="store_true", help="print the last checkpoint + per-dragon status and exit")
    args = load_settings(ap.parse_args(), sys.argv[1:])

    if args.status:
        cp = last_checkpoint()
        print("settings:", json.dumps({k: getattr(args, k) for k in KNOBS}))
        print("last checkpoint:", json.dumps(cp) if cp else "none")
        for d in ORDER:
            p = os.path.join(WORK, d, "review", "status.json")
            ap_ = os.path.join(WORK, d, "review", "approved.json")
            if os.path.exists(p):
                st = json.load(open(p))
                print(f"  {d:8s} {'CLEAN' if st.get('clean') else 'not clean'} rounds={st.get('rounds')}"
                      + (f" failed@{st['failed_stage']}" if st.get("failed_stage") else "")
                      + ("  APPROVED+exported" if os.path.exists(ap_) else "  awaiting Claude's review"))
            else:
                print(f"  {d:8s} not started")
        return

    if args.approve:
        sys.exit(0 if approve(args.approve, args) else 1)

    dragons = ORDER if args.dragons == "all" else [d.strip() for d in args.dragons.split(",") if d.strip()]
    results = []
    for d in dragons:
        results.append(Runner(d, args).run())
    print("\n===== SUMMARY =====")
    for s in results:
        print(f"{s['dragon']:8s} {'CLEAN' if s['clean'] else 'NOT CLEAN'}  rounds={s['rounds']}"
              + (f"  FAILED@{s['failed_stage']}" if s["failed_stage"] else "")
              + f"  flagged={s.get('flagged')}  -> work/{s['dragon']}/review/packet.md")
    print("Next: Claude reads each packet's images, then `python run.py --approve <dragon>` per approved dragon.")


if __name__ == "__main__":
    main()
