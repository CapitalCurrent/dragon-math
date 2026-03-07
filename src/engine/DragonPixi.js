import { useRef, useEffect, useCallback } from 'react';
import { Application, Texture, Sprite, Graphics } from 'pixi.js';

// ============================================================
// PARTICLE CONFIGS — per dragon extraFeature
// ============================================================
const PARTICLE_CONFIGS = {
  embers:  { count: 30, colors: [0xff6b35, 0xff9800, 0xffeb3b], vy: -60, spread: 80, size: [2, 5], life: [1, 2.5], gravity: -15, vxSpread: 10, shape: 'circle', trail: true },
  frost:   { count: 22, colors: [0x4fc3f7, 0x81d4fa, 0xe1f5fe], vy: -20, spread: 90, size: [1.5, 4], life: [2, 4], gravity: -3, vxSpread: 12, shape: 'diamond', trail: false },
  moss:    { count: 12, colors: [0x8bc34a, 0xa5d6a7, 0x66bb6a], vy: -8, spread: 60, size: [3, 6], life: [3, 5], gravity: 2, vxSpread: 5, shape: 'circle', trail: false },
  smoke:   { count: 18, colors: [0x9c27b0, 0x7b1fa2, 0xe1bee7], vy: -35, spread: 80, size: [3, 7], life: [1.5, 3], gravity: -8, vxSpread: 10, shape: 'circle', trail: true },
  sparkle: { count: 26, colors: [0xffd54f, 0xfff176, 0xffffff], vy: -25, spread: 100, size: [1, 3.5], life: [0.5, 1.5], gravity: 0, vxSpread: 18, shape: 'star', trail: false },
  sparks:  { count: 24, colors: [0x29b6f6, 0x4dd0e1, 0xffee58], vy: -70, spread: 60, size: [1, 3], life: [0.3, 1], gravity: 8, vxSpread: 25, shape: 'line', trail: true },
};

// ============================================================
// SKILL VFX CONFIGS — per dragon type
// ============================================================
const SKILL_VFX = {
  embers: {
    type: 'breath', color: 0xff6b35, color2: 0xffeb3b,
    particleCount: 40, speed: 300, spread: 0.6, size: [3, 8], life: 0.8,
  },
  frost: {
    type: 'ring', color: 0x4fc3f7, color2: 0xe1f5fe,
    particleCount: 30, speed: 200, spread: Math.PI * 2, size: [2, 5], life: 1.0,
  },
  moss: {
    type: 'ground', color: 0x8bc34a, color2: 0x795548,
    particleCount: 25, speed: 150, spread: Math.PI, size: [4, 10], life: 1.2,
  },
  smoke: {
    type: 'tendrils', color: 0x9c27b0, color2: 0x4a148c,
    particleCount: 20, speed: 120, spread: 0.8, size: [3, 7], life: 1.5,
  },
  sparkle: {
    type: 'starburst', color: 0xffd54f, color2: 0xffffff,
    particleCount: 35, speed: 250, spread: Math.PI * 2, size: [2, 6], life: 0.6,
  },
  sparks: {
    type: 'lightning', color: 0x29b6f6, color2: 0xffee58,
    particleCount: 15, speed: 400, spread: 0.5, size: [1, 3], life: 0.4,
  },
};

function resetParticle(p, config, cx, cy) {
  p.life = 0;
  p.maxLife = config.life[0] + Math.random() * (config.life[1] - config.life[0]);
  p.x = cx + (Math.random() - 0.5) * config.spread;
  p.y = cy - 30 - Math.random() * 100;
  p.vx = (Math.random() - 0.5) * config.vxSpread;
  p.vy = config.vy + (Math.random() - 0.5) * 20;
  p.size = config.size[0] + Math.random() * (config.size[1] - config.size[0]);
  p.color = config.colors[Math.floor(Math.random() * config.colors.length)];
  p.baseAlpha = 0.3 + Math.random() * 0.5;
  p.alpha = 0;
  p.gravity = config.gravity;
  p.rotation = Math.random() * Math.PI * 2;
  p.rotSpeed = (Math.random() - 0.5) * 3;
  // Trail history
  p.trail = config.trail ? [] : null;
}

function resetSkillParticle(p, vfx, cx, cy) {
  p.life = 0;
  p.maxLife = vfx.life + Math.random() * 0.3;

  const angle = (() => {
    switch (vfx.type) {
      case 'breath': return -Math.PI * 0.5 + (Math.random() - 0.5) * vfx.spread;
      case 'ring': return Math.random() * Math.PI * 2;
      case 'ground': return Math.PI * 0.5 + (Math.random() - 0.5) * 0.8;
      case 'tendrils': return -Math.PI * 0.5 + (Math.random() - 0.5) * vfx.spread;
      case 'starburst': return Math.random() * Math.PI * 2;
      case 'lightning': return -Math.PI * 0.3 + (Math.random() - 0.5) * vfx.spread;
      default: return Math.random() * Math.PI * 2;
    }
  })();

  const speed = vfx.speed * (0.5 + Math.random() * 0.5);
  p.x = cx;
  p.y = cy - 80;
  p.vx = Math.cos(angle) * speed;
  p.vy = Math.sin(angle) * speed;
  p.size = vfx.size[0] + Math.random() * (vfx.size[1] - vfx.size[0]);
  p.color = Math.random() > 0.5 ? vfx.color : vfx.color2;
  p.alpha = 1;
  p.baseAlpha = 1;
  p.gravity = vfx.type === 'ground' ? 100 : vfx.type === 'lightning' ? 0 : -20;
  p.rotation = angle;
  p.rotSpeed = (Math.random() - 0.5) * 8;
}

// Draw a single particle shape
function drawParticle(gfx, p, shape) {
  if (p.alpha < 0.01) return;
  switch (shape) {
    case 'diamond':
      gfx.moveTo(p.x, p.y - p.size);
      gfx.lineTo(p.x + p.size * 0.6, p.y);
      gfx.lineTo(p.x, p.y + p.size);
      gfx.lineTo(p.x - p.size * 0.6, p.y);
      gfx.closePath();
      gfx.fill({ color: p.color, alpha: p.alpha });
      break;
    case 'star': {
      const s = p.size;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + p.rotation;
        gfx.moveTo(p.x, p.y);
        gfx.lineTo(p.x + Math.cos(a) * s, p.y + Math.sin(a) * s);
        gfx.stroke({ color: p.color, alpha: p.alpha, width: 1.5 });
      }
      gfx.circle(p.x, p.y, s * 0.4);
      gfx.fill({ color: 0xffffff, alpha: p.alpha * 0.8 });
      break;
    }
    case 'line': {
      const a = p.rotation;
      const len = p.size * 2;
      gfx.moveTo(p.x - Math.cos(a) * len, p.y - Math.sin(a) * len);
      gfx.lineTo(p.x + Math.cos(a) * len, p.y + Math.sin(a) * len);
      gfx.stroke({ color: p.color, alpha: p.alpha, width: 1.5 });
      break;
    }
    default:
      gfx.circle(p.x, p.y, p.size);
      gfx.fill({ color: p.color, alpha: p.alpha });
  }
}

// Draw particle trail
function drawTrail(gfx, p) {
  if (!p.trail || p.trail.length < 2) return;
  for (let i = 1; i < p.trail.length; i++) {
    const prev = p.trail[i - 1];
    const curr = p.trail[i];
    const trailAlpha = (i / p.trail.length) * p.alpha * 0.3;
    if (trailAlpha < 0.01) continue;
    gfx.moveTo(prev.x, prev.y);
    gfx.lineTo(curr.x, curr.y);
    gfx.stroke({ color: p.color, alpha: trailAlpha, width: p.size * 0.5 });
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function DragonPixi({
  dragon, progress, size = 440, chomping = false,
  streak = 0, wrongAnswer = false,
  DragonSVGComponent,
}) {
  const canvasContainerRef = useRef(null);
  const svgContainerRef = useRef(null);
  const appRef = useRef(null);
  const spriteRef = useRef(null);
  const glowGfxRef = useRef(null);
  const particleGfxRef = useRef(null);
  const vfxGfxRef = useRef(null);
  const particlesRef = useRef([]);
  const skillParticlesRef = useRef([]);
  const timeRef = useRef(0);
  const chompTimeRef = useRef(0);
  const chompingRef = useRef(chomping);
  const streakRef = useRef(streak);
  const wrongRef = useRef(false);
  const wrongTimeRef = useRef(0);
  const skillActiveRef = useRef(false);
  const skillTimeRef = useRef(0);
  const fidgetTimerRef = useRef(0);
  const blinkTimerRef = useRef(0);
  const canvasW = 540;
  const canvasH = 520;
  const cx = canvasW / 2;
  const cy = canvasH - 30;

  // Smooth lerp state (current values that chase targets)
  const currentXRef = useRef(cx);
  const currentYRef = useRef(cy);
  const currentScaleXRef = useRef(1);
  const currentScaleYRef = useRef(1);
  const currentRotRef = useRef(0);

  // Keep refs in sync
  useEffect(() => {
    chompingRef.current = chomping;
    if (chomping) {
      chompTimeRef.current = 0;
      // Trigger skill VFX on chomp
      skillActiveRef.current = true;
      skillTimeRef.current = 0;
    }
  }, [chomping]);

  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => {
    if (wrongAnswer) {
      wrongRef.current = true;
      wrongTimeRef.current = 0;
    }
  }, [wrongAnswer]);

  // Initialize Pixi Application
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    let app;
    let destroyed = false;

    async function init() {
      app = new Application();
      await app.init({
        width: canvasW,
        height: canvasH,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });

      if (destroyed) { app.destroy(true); return; }

      appRef.current = app;
      canvasContainerRef.current.appendChild(app.canvas);
      app.canvas.style.width = canvasW + 'px';
      app.canvas.style.height = canvasH + 'px';

      // Layer order: glow -> particles behind -> sprite -> vfx on top
      const glowGfx = new Graphics();
      app.stage.addChild(glowGfx);
      glowGfxRef.current = glowGfx;

      const particleGfx = new Graphics();
      app.stage.addChild(particleGfx);
      particleGfxRef.current = particleGfx;

      const sprite = new Sprite();
      sprite.anchor.set(0.5, 1);
      sprite.x = cx;
      sprite.y = cy;
      app.stage.addChild(sprite);
      spriteRef.current = sprite;

      const vfxGfx = new Graphics();
      app.stage.addChild(vfxGfx);
      vfxGfxRef.current = vfxGfx;

      // === MAIN TICK LOOP ===
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime / 60;
        timeRef.current += dt;
        const t = timeRef.current;

        const currentStreak = streakRef.current;
        const streakIntensity = Math.min(1, currentStreak / 10);

        // --- SPRITE ANIMATION (lerp-smoothed) ---
        if (spriteRef.current) {
          // Compute target values, then lerp toward them
          let tgtX = cx;
          let tgtY = cy;
          let tgtSX = 1;
          let tgtSY = 1;
          let tgtRot = 0;
          const lerpSpeed = 12; // higher = snappier (frames to ~63%)

          if (chompingRef.current) {
            // Chomp: punchy scale with slight forward lean
            chompTimeRef.current += dt;
            const ct = chompTimeRef.current;
            const s = ct < 0.1 ? 1 + ct / 0.1 * 0.2
              : ct < 0.2 ? 1.2 - (ct - 0.1) / 0.1 * 0.35
              : ct < 0.35 ? 0.85 + (ct - 0.2) / 0.15 * 0.2
              : ct < 0.5 ? 1.05 - (ct - 0.35) / 0.15 * 0.05
              : 1;
            tgtSX = s;
            tgtSY = s;
            tgtRot = ct < 0.2 ? -0.05 * Math.sin(ct * 30) : 0;
            tgtX = cx;
            tgtY = cy;
          } else if (wrongRef.current) {
            // Wrong answer: shake side to side (direct, no lerp for shake)
            wrongTimeRef.current += dt;
            const wt = wrongTimeRef.current;
            if (wt > 0.6) { wrongRef.current = false; }
            else {
              const shake = Math.sin(wt * 40) * 8 * (1 - wt / 0.6);
              tgtX = cx + shake;
              tgtRot = shake * 0.003;
            }
          }

          // Idle breathing — always computed, blends in when not chomping/shaking
          if (!chompingRef.current && !wrongRef.current) {
            const breathCycle = Math.sin(t * 1.2);
            const deepBreath = Math.sin(t * 0.3) > 0.9 ? 0.01 : 0;
            const breathAmt = 0.015 + deepBreath + streakIntensity * 0.008;
            tgtSY = 1 + breathCycle * breathAmt;
            tgtSX = 1 - breathCycle * breathAmt * 0.3;
            tgtY = cy + breathCycle * 3;
            tgtX = cx;

            // Fidget: periodic small rotation
            fidgetTimerRef.current += dt;
            if (fidgetTimerRef.current > 4 + Math.random() * 3) {
              fidgetTimerRef.current = 0;
            }
            const fidgetPhase = fidgetTimerRef.current;
            if (fidgetPhase < 0.8) {
              tgtRot = Math.sin(fidgetPhase * Math.PI * 2.5) * 0.02;
            }

            // Eye blink simulation: brief squash every few seconds
            blinkTimerRef.current += dt;
            if (blinkTimerRef.current > 3 + Math.random() * 4) {
              blinkTimerRef.current = 0;
            }
            if (blinkTimerRef.current < 0.1) {
              tgtSY *= 0.97;
            }
          }

          // Smooth lerp all values toward targets
          const lf = 1 - Math.exp(-lerpSpeed * dt);
          currentXRef.current += (tgtX - currentXRef.current) * lf;
          currentYRef.current += (tgtY - currentYRef.current) * lf;
          currentScaleXRef.current += (tgtSX - currentScaleXRef.current) * lf;
          currentScaleYRef.current += (tgtSY - currentScaleYRef.current) * lf;
          currentRotRef.current += (tgtRot - currentRotRef.current) * lf;

          spriteRef.current.x = currentXRef.current;
          spriteRef.current.y = currentYRef.current;
          // Negate scaleX to flip dragon horizontally (SVG faces left, we want right)
          spriteRef.current.scale.set(-currentScaleXRef.current, currentScaleYRef.current);
          spriteRef.current.rotation = currentRotRef.current;
        }

        // --- GLOW AURA ---
        if (glowGfxRef.current) {
          glowGfxRef.current.clear();
          const dragonColors = dragon?.colors;
          if (dragonColors) {
            const glowPulse = 0.5 + Math.sin(t * 1.5) * 0.3 + streakIntensity * 0.4;
            const baseRadius = 60 + streakIntensity * 40;

            // Ground glow pool
            glowGfxRef.current.ellipse(cx, cy + 5, baseRadius * 1.5, 20);
            glowGfxRef.current.fill({
              color: parseInt(dragonColors.glow.replace('#', ''), 16),
              alpha: 0.08 * glowPulse,
            });

            // Aura behind dragon (only visible at higher streaks)
            if (currentStreak >= 3) {
              const auraAlpha = Math.min(0.15, (currentStreak - 3) * 0.02);
              glowGfxRef.current.circle(cx, cy - size * 0.4, baseRadius);
              glowGfxRef.current.fill({
                color: parseInt(dragonColors.primary.replace('#', ''), 16),
                alpha: auraAlpha * glowPulse,
              });
            }

            // Streak >= 5: outer ring pulse
            if (currentStreak >= 5) {
              const ringRadius = baseRadius + 30 + Math.sin(t * 3) * 10;
              glowGfxRef.current.circle(cx, cy - size * 0.35, ringRadius);
              glowGfxRef.current.stroke({
                color: parseInt(dragonColors.accent.replace('#', ''), 16),
                alpha: 0.1 + Math.sin(t * 3) * 0.05,
                width: 2,
              });
            }

            // Streak >= 10: celebration sparkle ring
            if (currentStreak >= 10) {
              for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + t * 0.5;
                const r = baseRadius + 50;
                const sx = cx + Math.cos(angle) * r;
                const sy = (cy - size * 0.35) + Math.sin(angle) * r * 0.6;
                glowGfxRef.current.star(sx, sy, 4, 3, 1.5, t + i);
                glowGfxRef.current.fill({
                  color: parseInt(dragonColors.accent.replace('#', ''), 16),
                  alpha: 0.3 + Math.sin(t * 4 + i) * 0.2,
                });
              }
            }
          }
        }

        // --- AMBIENT PARTICLES ---
        if (particleGfxRef.current) {
          particleGfxRef.current.clear();
          const feat = dragon?.physiology?.extraFeature || 'embers';
          const config = PARTICLE_CONFIGS[feat] || PARTICLE_CONFIGS.embers;
          const shape = config.shape || 'circle';

          for (const p of particlesRef.current) {
            p.life += dt;
            if (p.life > p.maxLife) resetParticle(p, config, cx, cy);

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.rotation += p.rotSpeed * dt;

            const frac = p.life / p.maxLife;
            p.alpha = (frac < 0.15 ? frac / 0.15 : frac > 0.65 ? (1 - frac) / 0.35 : 1) * p.baseAlpha;

            // Streak boost: bigger, brighter particles
            const streakSize = 1 + streakIntensity * 0.5;
            const origSize = p.size;
            p.size *= streakSize;
            p.alpha *= (1 + streakIntensity * 0.3);

            // Draw trail
            if (p.trail) {
              p.trail.push({ x: p.x, y: p.y });
              if (p.trail.length > 6) p.trail.shift();
              drawTrail(particleGfxRef.current, p);
            }

            drawParticle(particleGfxRef.current, p, shape);
            p.size = origSize;
          }
        }

        // --- SKILL VFX ---
        if (vfxGfxRef.current) {
          vfxGfxRef.current.clear();

          if (skillActiveRef.current) {
            skillTimeRef.current += dt;
            const feat = dragon?.physiology?.extraFeature || 'embers';
            const vfx = SKILL_VFX[feat] || SKILL_VFX.embers;

            // Spawn skill particles on first frame
            if (skillTimeRef.current < dt * 2 && skillParticlesRef.current.length === 0) {
              skillParticlesRef.current = Array.from({ length: vfx.particleCount }, () => {
                const p = { life: 0, maxLife: 1, x: 0, y: 0, vx: 0, vy: 0, size: 3, color: 0xffffff, alpha: 1, baseAlpha: 1, gravity: 0, rotation: 0, rotSpeed: 0 };
                resetSkillParticle(p, vfx, cx, cy);
                return p;
              });
            }

            // Update and draw skill particles
            let allDead = true;
            for (const p of skillParticlesRef.current) {
              p.life += dt;
              if (p.life > p.maxLife) {
                p.alpha = 0;
                continue;
              }
              allDead = false;

              p.x += p.vx * dt;
              p.y += p.vy * dt;
              p.vy += p.gravity * dt;
              p.rotation += p.rotSpeed * dt;

              const frac = p.life / p.maxLife;
              p.alpha = frac < 0.1 ? frac / 0.1 : (1 - frac) / 0.9;
              p.alpha *= p.baseAlpha;

              // Draw based on VFX type
              if (p.alpha > 0.01) {
                switch (vfx.type) {
                  case 'breath':
                    // Flame-like elongated circles
                    vfxGfxRef.current.ellipse(p.x, p.y, p.size * 1.5, p.size);
                    vfxGfxRef.current.fill({ color: p.color, alpha: p.alpha });
                    // Hot core
                    vfxGfxRef.current.circle(p.x, p.y, p.size * 0.4);
                    vfxGfxRef.current.fill({ color: 0xffffff, alpha: p.alpha * 0.5 });
                    break;
                  case 'ring':
                    // Ice crystals — diamond shapes
                    vfxGfxRef.current.moveTo(p.x, p.y - p.size);
                    vfxGfxRef.current.lineTo(p.x + p.size * 0.5, p.y);
                    vfxGfxRef.current.lineTo(p.x, p.y + p.size);
                    vfxGfxRef.current.lineTo(p.x - p.size * 0.5, p.y);
                    vfxGfxRef.current.closePath();
                    vfxGfxRef.current.fill({ color: p.color, alpha: p.alpha });
                    break;
                  case 'ground':
                    // Rock chunks
                    vfxGfxRef.current.roundRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, 2);
                    vfxGfxRef.current.fill({ color: p.color, alpha: p.alpha });
                    break;
                  case 'tendrils':
                    // Smoky wisps — thick strokes
                    vfxGfxRef.current.circle(p.x, p.y, p.size);
                    vfxGfxRef.current.fill({ color: p.color, alpha: p.alpha * 0.6 });
                    vfxGfxRef.current.circle(p.x + p.size, p.y - p.size * 0.5, p.size * 0.7);
                    vfxGfxRef.current.fill({ color: p.color, alpha: p.alpha * 0.3 });
                    break;
                  case 'starburst':
                    // Golden sparkles with rays
                    vfxGfxRef.current.star(p.x, p.y, 4, p.size, p.size * 0.4, p.rotation);
                    vfxGfxRef.current.fill({ color: p.color, alpha: p.alpha });
                    break;
                  case 'lightning': {
                    // Zigzag bolt segments
                    const len = p.size * 4;
                    let lx = p.x, ly = p.y;
                    vfxGfxRef.current.moveTo(lx, ly);
                    for (let seg = 0; seg < 4; seg++) {
                      lx += (Math.random() - 0.3) * len;
                      ly += (Math.random() - 0.5) * len * 0.5 - len * 0.2;
                      vfxGfxRef.current.lineTo(lx, ly);
                    }
                    vfxGfxRef.current.stroke({ color: p.color, alpha: p.alpha, width: 2 });
                    // Glow dot at tip
                    vfxGfxRef.current.circle(lx, ly, 3);
                    vfxGfxRef.current.fill({ color: 0xffffff, alpha: p.alpha * 0.8 });
                    break;
                  }
                  default:
                    vfxGfxRef.current.circle(p.x, p.y, p.size);
                    vfxGfxRef.current.fill({ color: p.color, alpha: p.alpha });
                }
              }
            }

            // Screen flash on skill start
            if (skillTimeRef.current < 0.15) {
              const flashAlpha = (1 - skillTimeRef.current / 0.15) * 0.2;
              const flashColor = parseInt((dragon?.colors?.glow || '#ffffff').replace('#', ''), 16);
              vfxGfxRef.current.rect(0, 0, canvasW, canvasH);
              vfxGfxRef.current.fill({ color: flashColor, alpha: flashAlpha });
            }

            if (allDead && skillTimeRef.current > 0.3) {
              skillActiveRef.current = false;
              skillParticlesRef.current = [];
            }
          }
        }
      });
    }

    init();

    return () => {
      destroyed = true;
      if (app) app.destroy(true, { children: true });
      appRef.current = null;
      spriteRef.current = null;
      glowGfxRef.current = null;
      particleGfxRef.current = null;
      vfxGfxRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize ambient particles when dragon changes
  useEffect(() => {
    if (!dragon) return;
    const feat = dragon.physiology?.extraFeature || 'embers';
    const config = PARTICLE_CONFIGS[feat] || PARTICLE_CONFIGS.embers;
    particlesRef.current = Array.from({ length: config.count }, () => {
      const p = {
        life: 0, maxLife: 1, x: 0, y: 0, vx: 0, vy: 0,
        size: 2, color: 0xffffff, alpha: 0, baseAlpha: 0.5, gravity: 0,
        rotation: 0, rotSpeed: 0, trail: null,
      };
      resetParticle(p, config, cx, cy);
      p.life = Math.random() * p.maxLife;
      return p;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragon?.id, cx, cy]);

  // Capture SVG to Pixi texture
  // DragonSVG renders a wrapper div (size × size, flex align-end center)
  // with the actual SVG inside (which may be smaller, e.g. egg = 242px).
  // We build a composite SVG at the full wrapper size, positioning the
  // inner SVG content at bottom-center to match the CSS flex layout.
  const captureSVG = useCallback(() => {
    if (!svgContainerRef.current || !spriteRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg');
    if (!svgEl) return;

    // Get the inner SVG's rendered dimensions from its parent (motion.div)
    const parent = svgEl.parentElement;
    const innerW = parent ? parent.offsetWidth : size;
    const innerH = parent ? parent.offsetHeight : size;

    // Clone SVG and set explicit pixel dimensions (replacing width="100%" etc.)
    const clone = svgEl.cloneNode(true);
    clone.setAttribute('width', String(innerW));
    clone.setAttribute('height', String(innerH));

    // Wrap in a full-size SVG positioned at bottom-center (matching flex layout)
    const offsetX = (size - innerW) / 2;
    const offsetY = size - innerH;
    const wrapperSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <g transform="translate(${offsetX},${offsetY})">
        ${new XMLSerializer().serializeToString(clone)}
      </g>
    </svg>`;

    const blob = new Blob([wrapperSVG], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const tex = Texture.from(canvas);
      if (spriteRef.current) {
        spriteRef.current.texture = tex;
        spriteRef.current.width = size;
        spriteRef.current.height = size;
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [size]);

  useEffect(() => {
    const timer = setTimeout(captureSVG, 150);
    return () => clearTimeout(timer);
  }, [dragon?.id, progress, captureSVG]);

  return (
    <div style={{ width: canvasW, height: canvasH, position: 'relative' }}>
      {/* Hidden SVG renderer */}
      <div
        ref={svgContainerRef}
        style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}
        aria-hidden
      >
        <DragonSVGComponent dragon={dragon} progress={progress} size={size} chomping={false} />
      </div>
      {/* Pixi canvas */}
      <div ref={canvasContainerRef} style={{ width: canvasW, height: canvasH }} />
    </div>
  );
}
