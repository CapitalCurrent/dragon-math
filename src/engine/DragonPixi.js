import React, { useRef, useEffect, useCallback } from 'react';
import { Application, Texture, Sprite, Graphics } from 'pixi.js';

// Particle configs per dragon type
const PARTICLE_CONFIGS = {
  embers:  { count: 25, colors: [0xff6b35, 0xff9800, 0xffeb3b], vy: -60, spread: 80, size: [2, 5], life: [1, 2.5], gravity: -15, vxSpread: 8 },
  frost:   { count: 18, colors: [0x4fc3f7, 0x81d4fa, 0xe1f5fe], vy: -20, spread: 90, size: [1.5, 4], life: [2, 4], gravity: -3, vxSpread: 12 },
  moss:    { count: 10, colors: [0x8bc34a, 0xa5d6a7, 0x795548], vy: -8, spread: 60, size: [3, 6], life: [3, 5], gravity: 2, vxSpread: 5 },
  smoke:   { count: 15, colors: [0x9c27b0, 0x7b1fa2, 0xe1bee7], vy: -35, spread: 80, size: [2, 6], life: [1.5, 3], gravity: -8, vxSpread: 10 },
  sparkle: { count: 22, colors: [0xffd54f, 0xfff176, 0xffffff], vy: -25, spread: 100, size: [1, 3.5], life: [0.5, 1.5], gravity: 0, vxSpread: 15 },
  sparks:  { count: 20, colors: [0x29b6f6, 0x4dd0e1, 0xffee58], vy: -70, spread: 60, size: [1, 3], life: [0.3, 1], gravity: 8, vxSpread: 20 },
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
}

/**
 * DragonPixi — renders the SVG dragon off-screen, captures to a Pixi texture,
 * then displays with GPU-accelerated particles + breathing animation.
 */
export default function DragonPixi({ dragon, progress, size = 440, chomping = false, DragonSVGComponent }) {
  const canvasContainerRef = useRef(null);
  const svgContainerRef = useRef(null);
  const appRef = useRef(null);
  const spriteRef = useRef(null);
  const particlesRef = useRef([]);
  const particleGfxRef = useRef(null);
  const timeRef = useRef(0);
  const chompTimeRef = useRef(0);
  const chompingRef = useRef(chomping);

  const canvasW = 540;
  const canvasH = 520;
  const cx = canvasW / 2;
  const cy = canvasH - 30;

  // Keep chomping ref in sync
  useEffect(() => {
    chompingRef.current = chomping;
    if (chomping) chompTimeRef.current = 0;
  }, [chomping]);

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

      // Particle graphics layer
      const gfx = new Graphics();
      app.stage.addChild(gfx);
      particleGfxRef.current = gfx;

      // Dragon sprite (placeholder — texture set later)
      const sprite = new Sprite();
      sprite.anchor.set(0.5, 1);
      sprite.x = cx;
      sprite.y = cy;
      app.stage.addChild(sprite);
      spriteRef.current = sprite;

      // Ticker for animation
      app.ticker.add((ticker) => {
        const dt = ticker.deltaTime / 60;
        timeRef.current += dt;
        const t = timeRef.current;

        // Breathing / chomp
        if (spriteRef.current) {
          if (chompingRef.current) {
            chompTimeRef.current += dt;
            const ct = chompTimeRef.current;
            const s = ct < 0.15 ? 1 + ct / 0.15 * 0.18
              : ct < 0.3 ? 1.18 - (ct - 0.15) / 0.15 * 0.28
              : ct < 0.45 ? 0.9 + (ct - 0.3) / 0.15 * 0.18
              : ct < 0.6 ? 1.08 - (ct - 0.45) / 0.15 * 0.08
              : 1;
            spriteRef.current.scale.set(s);
            spriteRef.current.y = cy;
          } else {
            spriteRef.current.scale.set(1 + Math.sin(t * 1.2) * 0.015);
            spriteRef.current.y = cy + Math.sin(t * 1.2) * 3;
          }
        }

        // Particles
        if (particleGfxRef.current) {
          particleGfxRef.current.clear();
          for (const p of particlesRef.current) {
            p.life += dt;
            const feat = dragon?.physiology?.extraFeature || 'embers';
            const config = PARTICLE_CONFIGS[feat] || PARTICLE_CONFIGS.embers;
            if (p.life > p.maxLife) resetParticle(p, config, cx, cy);
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            const frac = p.life / p.maxLife;
            p.alpha = (frac < 0.15 ? frac / 0.15 : frac > 0.65 ? (1 - frac) / 0.35 : 1) * p.baseAlpha;

            if (p.alpha > 0.01) {
              particleGfxRef.current.circle(p.x, p.y, p.size);
              particleGfxRef.current.fill({ color: p.color, alpha: p.alpha });
            }
          }
        }
      });
    }

    init();

    return () => {
      destroyed = true;
      if (app) {
        app.destroy(true, { children: true });
      }
      appRef.current = null;
      spriteRef.current = null;
      particleGfxRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize particles when dragon changes
  useEffect(() => {
    if (!dragon) return;
    const feat = dragon.physiology?.extraFeature || 'embers';
    const config = PARTICLE_CONFIGS[feat] || PARTICLE_CONFIGS.embers;
    particlesRef.current = Array.from({ length: config.count }, () => {
      const p = { life: 0, maxLife: 1, x: 0, y: 0, vx: 0, vy: 0, size: 2, color: 0xffffff, alpha: 0, baseAlpha: 0.5, gravity: 0 };
      resetParticle(p, config, cx, cy);
      p.life = Math.random() * p.maxLife;
      return p;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragon?.id, cx, cy]);

  // Capture SVG to Pixi texture when dragon/progress changes
  const captureSVG = useCallback(() => {
    if (!svgContainerRef.current || !spriteRef.current) return;
    const svgEl = svgContainerRef.current.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
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
      spriteRef.current.texture = tex;
      spriteRef.current.width = size;
      spriteRef.current.height = size;
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

      {/* Pixi canvas container */}
      <div ref={canvasContainerRef} style={{ width: canvasW, height: canvasH }} />
    </div>
  );
}
