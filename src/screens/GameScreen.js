import React, { lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useVersion } from '../App';
import DragonSVG from '../components/DragonSVG';
import FloatingNumbers from '../components/FloatingNumbers';
import AnswerInput from '../components/AnswerInput';
import ProgressBar from '../components/ProgressBar';
import SkillBar from '../components/SkillBar';
import DevPanel from '../components/DevPanel';

const DragonPixi = lazy(() => import('../engine/DragonPixi'));

// Full-bleed side-view cave cross-section
// Approach: sky background → cave rock drawn ON TOP as solid shapes → sky shows through naturally
function CaveBackground({ dragon }) {
  const { primary, accent, glow } = dragon.colors;

  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <defs>
        {/* Night sky — visible through the cave opening */}
        <linearGradient id="sky-grad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#0a1025" />
          <stop offset="40%" stopColor="#0e1830" />
          <stop offset="100%" stopColor="#060c1a" />
        </linearGradient>
        {/* Back wall depth — lighter center fading to dark edges */}
        <radialGradient id="back-wall-grad" cx="70%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1e1e24" />
          <stop offset="50%" stopColor="#151518" />
          <stop offset="100%" stopColor="#0c0c0f" />
        </radialGradient>
        {/* Cave interior ambient — dark gradient for depth */}
        <linearGradient id="cave-ambient" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#0a0a0d" />
          <stop offset="60%" stopColor="#0d0d10" stopOpacity="0.6" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        {/* Dragon glow effects */}
        <radialGradient id="wall-glow" cx="55%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.18" />
          <stop offset="60%" stopColor={primary} stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="floor-glow" cx="40%" cy="20%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.25" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ceil-glow" cx="40%" cy="90%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.10" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* ============================================= */}
      {/* LAYER 1: NIGHT SKY — the full background      */}
      {/* ============================================= */}
      <rect width="1600" height="900" fill="url(#sky-grad)" />
      {/* Moon with halo */}
      <circle cx="1350" cy="180" r="80" fill="#111830" opacity="0.3" />
      <circle cx="1350" cy="180" r="40" fill="#182040" opacity="0.35" />
      <circle cx="1350" cy="180" r="22" fill="#1c2548" opacity="0.5" />
      {/* Stars */}
      {[
        [1100,50,2],[1220,100,1.5],[1350,40,2.2],[1480,80,1.3],[1560,55,1.8],
        [1150,160,1.2],[1420,240,1.8],[1550,180,1],[1280,300,1.3],[1500,320,1.5],
        [1120,260,1],[1380,350,1.5],[1560,290,1.2],[1200,400,1],[1480,430,1.3],
        [1320,480,1.8],[1550,460,1],[1160,520,1.2],[1440,560,1.5],[1280,600,1],
      ].map(([x,y,r], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={r} fill="#99aadd" opacity={0.2 + (i % 4) * 0.08} />
      ))}
      {/* Treeline silhouette */}
      <path d="M 1020 720 Q 1080 690 1140 700 Q 1200 675 1260 685 Q 1340 660 1420 670 Q 1500 650 1560 660 L 1600 655 L 1600 760 L 1020 760 Z" fill="#050a15" opacity="0.7" />

      {/* ============================================= */}
      {/* LAYER 2: CAVE — dark interior + rock framing    */}
      {/* Sky only visible through opening on far right   */}
      {/* ============================================= */}

      {/* CAVE INTERIOR — the dark enclosed space itself */}
      {/* Extended right to x:1500 so it fully overlaps ceiling/floor rock — no sky bleed-through */}
      {/* The ceiling and floor rock shapes will draw ON TOP, and the mouth transition fades this out */}
      <path
        d={`M 0 150
            Q 40 200 80 240 Q 120 272 170 292
            Q 240 310 340 318 Q 440 320 540 314
            Q 640 304 740 286 Q 840 260 920 238
            Q 1000 210 1060 185 Q 1120 158 1180 138
            Q 1260 110 1380 70 Q 1500 45 1600 30
            L 1600 860
            Q 1500 830 1380 790 Q 1280 760 1200 740
            Q 1120 722 1040 710 Q 940 698 840 690
            Q 740 683 640 680 Q 540 678 440 680
            Q 360 682 290 688 Q 230 698 170 712
            Q 120 730 80 755 Q 40 780 0 820 Z`}
        fill="#080810"
      />
      {/* Interior depth gradient — darker toward back, lighter near opening */}
      <path
        d={`M 0 150
            Q 40 200 80 240 Q 120 272 170 292
            Q 240 310 340 318 Q 440 320 540 314
            Q 640 304 740 286 Q 840 260 920 238
            Q 1000 210 1060 185 Q 1120 158 1180 138
            Q 1260 110 1380 70 Q 1500 45 1600 30
            L 1600 860
            Q 1500 830 1380 790 Q 1280 760 1200 740
            Q 1120 722 1040 710 Q 940 698 840 690
            Q 740 683 640 680 Q 540 678 440 680
            Q 360 682 290 688 Q 230 698 170 712
            Q 120 730 80 755 Q 40 780 0 820 Z`}
        fill="url(#cave-ambient)" opacity="0.5"
      />

      {/* Cave mouth opening — cut a hole in the interior to reveal sky on far right */}
      {/* This path matches the sky opening shape but uses the sky gradient to "erase" the interior */}
      <path
        d={`M 1300 100
            Q 1280 160 1260 240 Q 1245 340 1242 440
            Q 1245 540 1260 640 Q 1280 740 1300 800
            Q 1380 800 1460 820 L 1600 860
            L 1600 30 Q 1500 45 1400 70 Q 1340 85 1300 100 Z`}
        fill="url(#sky-grad)"
      />
      {/* Soft feathered edge at the cave mouth — gradual dark-to-sky transition */}
      <path
        d={`M 1200 80
            Q 1180 150 1165 240 Q 1150 340 1148 440
            Q 1150 540 1165 640 Q 1180 740 1200 810
            L 1380 830 Q 1350 740 1335 640
            Q 1320 540 1318 440 Q 1320 340 1335 250
            Q 1350 170 1380 90 Z`}
        fill="#080810" opacity="0.4"
      />
      <path
        d={`M 1250 90
            Q 1230 170 1218 270 Q 1210 370 1208 450
            Q 1210 540 1220 640 Q 1238 730 1260 810
            L 1350 820 Q 1330 730 1315 640
            Q 1305 540 1305 450 Q 1308 360 1320 270
            Q 1335 180 1355 100 Z`}
        fill="#080810" opacity="0.22"
      />

      {/* CEILING — solid rock mass (lower edge matches cave interior upper edge exactly) */}
      <path
        d={`M 0 0 L 1600 0
            L 1600 30
            Q 1500 45 1380 70 Q 1260 110 1180 138
            Q 1120 158 1060 185 Q 1000 210 920 238
            Q 840 260 740 286 Q 640 304 540 314
            Q 440 320 340 318 Q 240 310 170 292
            Q 120 272 80 240 Q 40 200 0 150 Z`}
        fill="#080810"
      />
      {/* Ceiling underside edge */}
      <path
        d={`M 170 292 Q 240 310 340 318 Q 440 320 540 314
            Q 640 304 740 286 Q 840 260 920 238
            Q 1000 210 1060 185 Q 1120 158 1180 138
            Q 1260 110 1350 85 Q 1450 60 1550 42`}
        fill="none" stroke="#1c1c22" strokeWidth="4" opacity="0.7"
      />
      {/* Ceiling strata lines */}
      <path d="M 190 278 Q 350 302 520 306 Q 700 295 860 255 Q 1000 220 1120 175 Q 1250 130 1400 80" fill="none" stroke="#15151a" strokeWidth="2.5" opacity="0.4" />
      <path d="M 200 260 Q 370 282 550 286 Q 720 275 880 238 Q 1020 202 1150 155" fill="none" stroke="#121216" strokeWidth="2" opacity="0.35" />

      {/* FLOOR — solid rock mass */}
      <path
        d={`M 0 900 L 1600 900
            L 1600 860
            Q 1500 830 1380 790 Q 1280 760 1200 740
            Q 1120 722 1040 710 Q 940 698 840 690
            Q 740 683 640 680 Q 540 678 440 680
            Q 360 682 290 688 Q 220 698 170 712
            Q 120 730 80 755 Q 40 780 0 820 Z`}
        fill="#0a0a0d"
      />
      {/* Floor top surface edge */}
      <path
        d={`M 170 712 Q 230 698 310 688 Q 400 681 500 678
            Q 620 676 740 680 Q 860 685 960 692
            Q 1060 702 1140 715 Q 1220 732 1300 758
            Q 1380 785 1460 818`}
        fill="none" stroke="#1c1c22" strokeWidth="4" opacity="0.6"
      />
      {/* Floor strata */}
      <path d="M 200 724 Q 360 700 520 690 Q 700 685 880 695 Q 1040 710 1180 740" fill="none" stroke="#15151a" strokeWidth="2" opacity="0.35" />

      {/* BACK WALL — concave surface connecting ceiling to floor */}
      <path
        d={`M 0 150 Q 40 200 80 240 Q 120 272 170 292
            Q 185 300 195 318 Q 210 348 218 390
            Q 225 440 225 480 Q 225 520 220 560
            Q 212 605 200 640 Q 188 668 170 688
            Q 150 705 170 712 Q 120 730 80 755
            Q 40 780 0 820 Z`}
        fill="url(#back-wall-grad)"
      />
      {/* Rock face lines on back wall — organic strata following curvature */}
      <path d="M 60 220 Q 100 248 140 270 Q 170 285 190 305" fill="none" stroke="#222230" strokeWidth="2.5" opacity="0.35" />
      <path d="M 35 310 Q 80 320 130 338 Q 170 355 200 380" fill="none" stroke="#1e1e28" strokeWidth="2" opacity="0.3" />
      <path d="M 25 410 Q 75 418 130 430 Q 175 445 210 470" fill="none" stroke="#202028" strokeWidth="2" opacity="0.3" />
      <path d="M 25 510 Q 80 518 135 535 Q 175 550 210 575" fill="none" stroke="#1e1e28" strokeWidth="2" opacity="0.3" />
      <path d="M 35 600 Q 85 610 135 630 Q 170 648 195 670" fill="none" stroke="#202030" strokeWidth="2" opacity="0.3" />
      <path d="M 60 700 Q 100 710 140 728 Q 165 740 185 758" fill="none" stroke="#222230" strokeWidth="2.5" opacity="0.3" />
      {/* Rock ledges on back wall */}
      <path d="M 100 365 Q 150 355 200 362 Q 218 378 210 392 Q 165 388 110 382 Q 92 376 100 365 Z" fill="#141418" opacity="0.5" />
      <path d="M 80 540 Q 140 530 195 538 Q 212 552 202 565 Q 150 560 90 555 Q 72 548 80 540 Z" fill="#141418" opacity="0.45" />

      {/* Crystal formations on back wall */}
      <g opacity="0.45">
        <path d="M 120 315 L 132 280 L 138 320 Z" fill="#2a2a58" />
        <path d="M 133 322 L 148 278 L 152 325 Z" fill="#252555" />
        <path d="M 110 325 L 116 288 L 125 328 Z" fill="#303065" />
        <circle cx="138" cy="290" r="2.5" fill={accent} opacity="0.3" />
        <circle cx="118" cy="302" r="2" fill="#8888cc" opacity="0.35" />
      </g>
      <g opacity="0.35">
        <path d="M 90 580 L 100 555 L 106 585 Z" fill="#2a2a55" />
        <path d="M 100 588 L 112 558 L 115 590 Z" fill="#282858" />
        <circle cx="105" cy="565" r="2" fill={accent} opacity="0.2" />
      </g>
      {/* Scattered mineral patches */}
      <path d="M 55 440 Q 85 434 100 448 Q 88 462 52 455 Z" fill="#28284a" opacity="0.35" />
      <path d="M 140 480 Q 170 475 180 488 Q 168 500 138 495 Z" fill="#2a2a50" opacity="0.3" />
      <path d="M 65 670 Q 95 665 108 678 Q 95 690 62 684 Z" fill="#282852" opacity="0.3" />
      {/* Crystal glint points */}
      <circle cx="138" cy="290" r="3" fill={accent} opacity="0.22" />
      <circle cx="75" cy="450" r="2" fill={accent} opacity="0.15" />
      <circle cx="105" cy="565" r="2.5" fill={accent} opacity="0.15" />
      <circle cx="80" cy="678" r="2" fill={accent} opacity="0.12" />
      <circle cx="55" cy="375" r="1.5" fill="#7777bb" opacity="0.2" />
      <circle cx="155" cy="495" r="1.5" fill="#7777bb" opacity="0.18" />
      <circle cx="40" cy="615" r="1.5" fill="#7777bb" opacity="0.15" />

      {/* (interior fill already handled by cave interior shape above) */}

      {/* === STALACTITES — lighter fills + edge highlights so they read against dark bg === */}
      {/* Large stalactites with highlight edge */}
      <path d="M 298 315 Q 308 348 312 395 Q 310 402 305 390 Q 297 350 293 318 Z" fill="#16161e" opacity="0.85" />
      <path d="M 312 315 Q 314 348 314 395" fill="none" stroke="#22222e" strokeWidth="1" opacity="0.5" />
      <path d="M 478 312 Q 490 350 496 410 Q 494 418 487 402 Q 477 355 473 315 Z" fill="#15151d" opacity="0.8" />
      <path d="M 496 312 Q 498 350 498 410" fill="none" stroke="#22222e" strokeWidth="1" opacity="0.45" />
      <path d="M 648 296 Q 658 330 664 380 Q 662 388 655 372 Q 647 332 643 300 Z" fill="#14141c" opacity="0.75" />
      <path d="M 664 296 Q 666 330 666 380" fill="none" stroke="#20202a" strokeWidth="1" opacity="0.4" />
      <path d="M 798 268 Q 806 298 810 340 Q 808 346 803 335 Q 797 300 794 272 Z" fill="#13131a" opacity="0.7" />
      <path d="M 810 268 Q 812 298 812 340" fill="none" stroke="#1e1e28" strokeWidth="1" opacity="0.35" />
      <path d="M 948 238 Q 955 262 958 298 Q 956 304 951 292 Q 947 264 944 242 Z" fill="#121218" opacity="0.6" />
      {/* Medium stalactites */}
      <path d="M 378 318 Q 385 340 388 368 Q 386 372 382 362 Q 377 338 374 320 Z" fill="#151520" opacity="0.65" />
      <path d="M 568 308 Q 575 330 578 355 Q 576 358 571 350 Q 567 328 564 310 Z" fill="#14141e" opacity="0.6" />
      <path d="M 728 282 Q 734 302 737 325 Q 735 328 731 320 Q 727 300 725 285 Z" fill="#13131c" opacity="0.55" />
      <path d="M 878 252 Q 883 270 886 290 Q 884 293 881 285 Q 877 268 875 255 Z" fill="#12121a" opacity="0.5" />
      {/* Small stalactites */}
      <path d="M 340 317 L 344 338 L 337 318" fill="#16161e" opacity="0.5" />
      <path d="M 520 310 L 524 330 L 518 311" fill="#15151d" opacity="0.45" />
      <path d="M 690 290 L 694 308 L 688 291" fill="#14141c" opacity="0.4" />
      <path d="M 1020 210 L 1024 228 L 1018 212" fill="#13131a" opacity="0.35" />

      {/* === STALAGMITES — lighter fills with edge highlights === */}
      <path d="M 378 682 Q 386 650 393 620 Q 396 617 398 625 Q 402 652 406 684 Z" fill="#16161e" opacity="0.65" />
      <path d="M 393 620 Q 398 617 398 625" fill="none" stroke="#22222e" strokeWidth="1" opacity="0.4" />
      <path d="M 578 680 Q 586 648 592 620 Q 595 617 597 625 Q 600 650 604 682 Z" fill="#15151d" opacity="0.6" />
      <path d="M 758 684 Q 764 658 770 635 Q 772 632 774 640 Q 777 658 782 686 Z" fill="#14141c" opacity="0.55" />
      <path d="M 948 694 Q 953 675 958 658 Q 960 656 962 662 Q 964 675 968 696 Z" fill="#13131a" opacity="0.5" />
      {/* Short stalagmites */}
      <path d="M 470 681 Q 475 663 480 680" fill="#15151d" opacity="0.5" />
      <path d="M 680 682 Q 685 666 690 681" fill="#14141c" opacity="0.45" />

      {/* Floor rubble — slightly lighter */}
      <ellipse cx="340" cy="685" rx="24" ry="8" fill="#151520" opacity="0.55" />
      <ellipse cx="520" cy="680" rx="18" ry="7" fill="#14141c" opacity="0.5" />
      <ellipse cx="700" cy="682" rx="20" ry="7" fill="#151520" opacity="0.45" />
      <ellipse cx="880" cy="692" rx="16" ry="6" fill="#14141c" opacity="0.4" />
      <circle cx="430" cy="682" r="4.5" fill="#161620" opacity="0.45" />
      <circle cx="620" cy="679" r="4" fill="#151520" opacity="0.4" />
      <circle cx="820" cy="686" r="3.5" fill="#161620" opacity="0.35" />

      {/* === MID-GROUND ROCK FEATURES — depth/parallax === */}
      {/* Partial boulder on floor — left side */}
      <path d="M 280 688 Q 300 665 340 660 Q 360 665 365 680 Q 355 692 320 694 Q 290 695 280 688 Z" fill="#111118" opacity="0.6" />
      <path d="M 300 665 Q 340 660 360 665" fill="none" stroke="#1a1a24" strokeWidth="1.5" opacity="0.4" />
      {/* Rock column fragment — mid-right */}
      <path d="M 1050 340 Q 1060 330 1075 332 Q 1082 340 1080 365 Q 1078 390 1070 400 Q 1058 398 1050 385 Q 1045 365 1050 340 Z" fill="#111118" opacity="0.4" />

      {/* Foreground rock silhouettes — frame edges */}
      <path d="M 0 865 Q 60 852 130 855 Q 190 848 250 858 Q 300 845 360 852 L 360 900 L 0 900 Z" fill="#060609" opacity="0.7" />
      <path d="M 0 0 L 0 65 Q 45 52 95 58 Q 140 48 180 55 Q 220 44 260 50 L 260 0 Z" fill="#060609" opacity="0.6" />

      {/* === CAVE MOUTH EDGE — rocky border at the opening === */}
      {/* Top-right rocky edge — where ceiling meets sky */}
      <path
        d={`M 1550 42 Q 1540 50 1535 38 Q 1520 55 1510 42 Q 1495 58 1480 46
            Q 1460 62 1445 52 Q 1420 68 1400 58 Q 1370 78 1350 68`}
        fill="none" stroke="#151518" strokeWidth="3" opacity="0.5"
      />
      {/* Bottom-right rocky edge — where floor meets sky */}
      <path
        d={`M 1460 818 Q 1445 808 1440 822 Q 1420 806 1400 818
            Q 1380 802 1360 815 Q 1340 800 1320 812`}
        fill="none" stroke="#151518" strokeWidth="3" opacity="0.5"
      />

      {/* === LIGHTING FROM DRAGON === */}
      {/* Glow pool on floor — stronger */}
      <ellipse cx="560" cy="682" rx="320" ry="40" fill="url(#floor-glow)" />
      <ellipse cx="560" cy="682" rx="180" ry="25" fill={glow} opacity="0.06" />
      {/* Glow on ceiling — stronger */}
      <ellipse cx="540" cy="310" rx="380" ry="60" fill="url(#ceil-glow)" />
      {/* Glow on back wall — stronger */}
      <path
        d={`M 0 220 L 0 750 Q 50 730 100 700 Q 150 660 190 610
            Q 220 550 225 480 Q 225 410 210 350
            Q 185 290 150 260 Q 100 230 50 215 Z`}
        fill="url(#wall-glow)"
      />
      {/* Ambient glow filling cave interior — warm tint */}
      <ellipse cx="520" cy="490" rx="420" ry="200" fill={glow} opacity="0.035" />
      {/* Secondary glow halo around dragon position */}
      <ellipse cx="560" cy="520" rx="200" ry="150" fill={glow} opacity="0.04" />

      {/* Nest rocks moved to DragonPixi.js — same coordinate system as egg sprite */}
    </svg>
  );
}

// Ambient floating particles for the game background
function AmbientParticles({ color, count = 20 }) {
  const particles = React.useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      dur: 8 + Math.random() * 12,
      delay: Math.random() * 8,
      drift: (Math.random() - 0.5) * 30,
    })),
    [count]
  );

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: color,
          }}
          animate={{
            y: [0, -60 - Math.random() * 40],
            x: [0, p.drift],
            opacity: [0, 0.4, 0.3, 0],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// Flying answer overlay — renders at fixed position so it can cross layout boundaries
function FlyingAnswer({ dragon, answer, dragonRef, numbersRef }) {
  const colors = dragon?.colors || {};
  const [coords, setCoords] = React.useState(null);

  React.useEffect(() => {
    const numEl = numbersRef?.current;
    const dragEl = dragonRef?.current;
    if (!numEl || !dragEl) return;

    const numRect = numEl.getBoundingClientRect();
    const dragRect = dragEl.getBoundingClientRect();

    const startX = numRect.left + numRect.width / 2;
    const startY = numRect.top + numRect.height * 0.3;
    // Dragon SVG is scaleX(-1) so head/mouth is on the RIGHT side visually
    const endX = dragRect.left + dragRect.width * 0.68;
    const endY = dragRect.top + dragRect.height * 0.22;

    setCoords({ startX, startY, endX, endY, dx: endX - startX, dy: endY - startY });
  }, [dragonRef, numbersRef]);

  if (!coords) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
      {/* Trail particles */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <motion.div
          key={`trail-${i}`}
          style={{
            position: 'absolute',
            left: coords.startX,
            top: coords.startY,
            width: 16 - i * 2,
            height: 16 - i * 2,
            borderRadius: '50%',
            background: i % 2 === 0 ? colors.accent : colors.glow,
            boxShadow: `0 0 12px ${colors.glow}`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: coords.dx * (0.3 + i * 0.08),
            y: coords.dy * (0.3 + i * 0.08),
            opacity: [0, 0.9, 0.6, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{ duration: 0.9, delay: 0.25 + i * 0.06, ease: 'easeOut' }}
        />
      ))}
      {/* Main answer bubble — hovers then arcs to dragon mouth */}
      <motion.div
        style={{
          position: 'absolute',
          left: coords.startX,
          top: coords.startY,
          width: 80,
          height: 80,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          background: `radial-gradient(circle at 35% 35%, ${colors.accent}, ${colors.primary})`,
          boxShadow: `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}40, inset 0 -4px 12px ${colors.glow}30`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        animate={{
          x: [0, 0, coords.dx * 0.35, coords.dx],
          y: [0, -15, coords.dy * 0.5 - 30, coords.dy],
          scale: [1, 1.15, 0.9, 0.15],
          opacity: [1, 1, 1, 0],
        }}
        transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1], times: [0, 0.12, 0.5, 1] }}
      >
        {answer}
      </motion.div>
      {/* Impact flash at dragon position */}
      <motion.div
        style={{
          position: 'absolute',
          left: coords.endX,
          top: coords.endY,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.glow}90, ${colors.accent}50, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.5, 3], opacity: [0, 0.9, 0] }}
        transition={{ delay: 0.95, duration: 0.4 }}
      />
    </div>
  );
}

// === ELEMENTAL SKILL EFFECTS ===
// Each dragon type gets a unique full-screen VFX

function FireBlast({ colors }) {
  return (
    <>
      {/* Screen engulfed in rising flames */}
      {Array.from({ length: 18 }, (_, i) => {
        const x = 5 + (i / 17) * 90;
        const h = 30 + Math.random() * 40;
        return (
          <motion.div
            key={`flame-${i}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              bottom: 0,
              width: 40 + Math.random() * 30,
              height: `${h}%`,
              borderRadius: '50% 50% 0 0',
              background: `linear-gradient(to top, ${colors.primary}cc, ${colors.accent}88, transparent)`,
              filter: `blur(${2 + Math.random() * 4}px)`,
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: [0, 1.2, 0.8, 0], opacity: [0, 0.8, 0.6, 0] }}
            transition={{ duration: 1.8, delay: i * 0.06, ease: 'easeOut' }}
          />
        );
      })}
      {/* Central fireball */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '35%',
          width: 200, height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.accent}dd, ${colors.primary}88, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(8px)',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 3, 2, 0], opacity: [0, 0.9, 0.5, 0] }}
        transition={{ duration: 1.5 }}
      />
      {/* Ember particles */}
      {Array.from({ length: 25 }, (_, i) => (
        <motion.div
          key={`emb-${i}`}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: 6 + Math.random() * 8,
            height: 6 + Math.random() * 8,
            borderRadius: '50%',
            background: i % 3 === 0 ? colors.accent : i % 3 === 1 ? '#ff6b35' : '#ff9800',
            boxShadow: `0 0 8px ${colors.glow}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 600,
            y: -100 - Math.random() * 500,
            opacity: [0, 1, 0.6, 0],
            scale: [0, 1.5, 0.5],
          }}
          transition={{ duration: 1.5, delay: 0.1 + Math.random() * 0.4 }}
        />
      ))}
    </>
  );
}

function IceBlast({ colors }) {
  return (
    <>
      {/* Frost wave expanding from center */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: '100vw', height: '100vh',
          borderRadius: '50%',
          border: `3px solid ${colors.accent}`,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 40px ${colors.glow}60, inset 0 0 40px ${colors.glow}30`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5], opacity: [0.9, 0] }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      {/* Ice crystals forming across screen */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 100 + Math.random() * 250;
        return (
          <motion.div
            key={`ice-${i}`}
            style={{
              position: 'absolute',
              left: '50%', top: '45%',
              width: 3,
              height: 20 + Math.random() * 30,
              background: `linear-gradient(to top, ${colors.accent}, #fff)`,
              borderRadius: 2,
              transform: `rotate(${angle}rad)`,
              transformOrigin: '50% 100%',
              boxShadow: `0 0 8px ${colors.glow}80`,
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: [0, 1, 0.8],
              opacity: [0, 0.9, 0],
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
            }}
            transition={{ duration: 1.4, delay: 0.05 + i * 0.04, ease: 'easeOut' }}
          />
        );
      })}
      {/* Frost overlay */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, ${colors.glow}20, transparent 40%, transparent 60%, ${colors.glow}20)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 1.5 }}
      />
      {/* Snowflake particles */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={`snow-${i}`}
          style={{
            position: 'absolute',
            left: `${10 + Math.random() * 80}%`,
            top: '-5%',
            fontSize: 14 + Math.random() * 14,
            opacity: 0,
          }}
          animate={{ y: [0, 300 + Math.random() * 300], opacity: [0, 0.7, 0], rotate: [0, 180] }}
          transition={{ duration: 2, delay: Math.random() * 0.6 }}
        >
          ❄
        </motion.div>
      ))}
    </>
  );
}

function EarthBlast({ colors }) {
  return (
    <>
      {/* Screen shake effect via CSS filter */}
      <motion.div
        style={{ position: 'absolute', inset: 0 }}
        animate={{ x: [0, -8, 8, -6, 6, -3, 3, 0], y: [0, 4, -4, 3, -3, 2, -1, 0] }}
        transition={{ duration: 0.6 }}
      />
      {/* Ground crack lines */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <motion.div
            key={`crack-${i}`}
            style={{
              position: 'absolute',
              left: '50%', top: '60%',
              width: 3,
              height: 120 + Math.random() * 80,
              background: `linear-gradient(to top, ${colors.accent}cc, ${colors.primary}44, transparent)`,
              transform: `rotate(${angle}rad)`,
              transformOrigin: '50% 0',
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: [0, 1, 0.7], opacity: [0, 0.8, 0] }}
            transition={{ duration: 1.0, delay: 0.1 + i * 0.05 }}
          />
        );
      })}
      {/* Rising boulders */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={`rock-${i}`}
          style={{
            position: 'absolute',
            left: `${15 + Math.random() * 70}%`,
            bottom: '10%',
            width: 16 + Math.random() * 24,
            height: 14 + Math.random() * 20,
            borderRadius: '30%',
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`,
            boxShadow: `0 0 6px ${colors.glow}40, inset -2px -2px 4px rgba(0,0,0,0.3)`,
          }}
          initial={{ y: 50, opacity: 0, scale: 0 }}
          animate={{
            y: [50, -100 - Math.random() * 200, -60 - Math.random() * 150],
            opacity: [0, 0.9, 0],
            scale: [0, 1.2, 0.4],
            rotate: [0, (Math.random() - 0.5) * 180],
          }}
          transition={{ duration: 1.5, delay: 0.15 + Math.random() * 0.3 }}
        />
      ))}
      {/* Dust cloud at base */}
      <motion.div
        style={{
          position: 'absolute', left: '10%', right: '10%', bottom: 0,
          height: '25%',
          background: `linear-gradient(to top, ${colors.accent}40, transparent)`,
          filter: 'blur(12px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 1.5 }}
      />
    </>
  );
}

function ShadowBlast({ colors }) {
  return (
    <>
      {/* Screen dims to near-black */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: '#0a001a' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0.7, 0] }}
        transition={{ duration: 1.8 }}
      />
      {/* Purple lightning cracks */}
      {Array.from({ length: 6 }, (_, i) => {
        const startX = 20 + Math.random() * 60;
        return (
          <motion.div
            key={`bolt-${i}`}
            style={{
              position: 'absolute',
              left: `${startX}%`,
              top: 0,
              width: 3,
              height: '60%',
              background: `linear-gradient(to bottom, ${colors.accent}, ${colors.primary}, transparent)`,
              boxShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.primary}80`,
              transform: `skewX(${(Math.random() - 0.5) * 30}deg)`,
            }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: [0, 1, 0.8, 0], scaleY: [0, 1, 1, 0.5] }}
            transition={{ duration: 0.8, delay: 0.15 + i * 0.12 }}
          />
        );
      })}
      {/* Central void pulse */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '40%',
          width: 120, height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.glow}aa, ${colors.primary}60, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          boxShadow: `0 0 60px ${colors.glow}`,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: [0, 3, 4, 0], opacity: [0, 1, 0.5, 0] }}
        transition={{ duration: 1.5 }}
      />
      {/* Shadow wisps */}
      {Array.from({ length: 10 }, (_, i) => (
        <motion.div
          key={`wisp-${i}`}
          style={{
            position: 'absolute', left: '50%', top: '40%',
            width: 60, height: 8,
            borderRadius: 4,
            background: `linear-gradient(90deg, transparent, ${colors.primary}88, transparent)`,
            transform: `rotate(${(i / 10) * 360}deg)`,
            transformOrigin: 'left center',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{
            scaleX: [0, 3, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{ duration: 1.2, delay: 0.2 + i * 0.06 }}
        />
      ))}
    </>
  );
}

function LightBlast({ colors }) {
  return (
    <>
      {/* Blinding white-gold flash */}
      <motion.div
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 40%, #ffffffee, ${colors.accent}88, transparent 70%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.4, 0] }}
        transition={{ duration: 1.2 }}
      />
      {/* Expanding light rings */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={`ring-${i}`}
          style={{
            position: 'absolute', left: '50%', top: '40%',
            width: 100, height: 100,
            borderRadius: '50%',
            border: `2px solid ${colors.accent}`,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 20px ${colors.glow}80`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 3 + i, 4 + i * 1.5], opacity: [0, 0.8, 0] }}
          transition={{ duration: 1.5, delay: i * 0.2 }}
        />
      ))}
      {/* Light beam rays from center */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={`ray-${i}`}
          style={{
            position: 'absolute',
            left: '50%', top: '40%',
            width: 3,
            height: 200,
            background: `linear-gradient(to bottom, ${colors.accent}cc, ${colors.glow}44, transparent)`,
            transformOrigin: '50% 0',
            transform: `rotate(${(i / 12) * 360}deg)`,
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1, 0.5], opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.0, delay: 0.1 + i * 0.04 }}
        />
      ))}
      {/* Sparkle burst */}
      {Array.from({ length: 15 }, (_, i) => (
        <motion.div
          key={`spr-${i}`}
          style={{
            position: 'absolute', left: '50%', top: '40%',
            width: 4, height: 4,
            background: '#fff',
            borderRadius: '50%',
            boxShadow: `0 0 6px ${colors.accent}`,
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 500,
            y: (Math.random() - 0.5) * 400,
            opacity: [0, 1, 0],
            scale: [0, 2, 0],
          }}
          transition={{ duration: 1.2, delay: 0.15 + Math.random() * 0.3 }}
        />
      ))}
    </>
  );
}

function StormBlast({ colors }) {
  return (
    <>
      {/* Dark storm clouds at top */}
      <motion.div
        style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: '30%',
          background: 'linear-gradient(to bottom, #0a0a1a, transparent)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.5, 0] }}
        transition={{ duration: 1.8 }}
      />
      {/* Lightning bolts */}
      {Array.from({ length: 5 }, (_, i) => (
        <motion.div
          key={`zap-${i}`}
          style={{
            position: 'absolute',
            left: `${15 + i * 17}%`,
            top: 0,
            width: 4,
            height: '55%',
            background: `linear-gradient(to bottom, ${colors.accent}, #fff, ${colors.accent}80, transparent)`,
            boxShadow: `0 0 20px ${colors.accent}, 0 0 40px ${colors.glow}80`,
            clipPath: `polygon(${[
              '0% 0%', '40% 20%', '60% 20%', '30% 45%', '55% 45%', '20% 70%', '50% 70%', '10% 100%', '45% 65%', '15% 65%', '50% 40%', '25% 40%', '55% 15%', '20% 15%'
            ].join(', ')})`,
          }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 1, 0.9, 0], scaleY: [0, 1, 1, 0] }}
          transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
        />
      ))}
      {/* Rain streaks */}
      {Array.from({ length: 30 }, (_, i) => (
        <motion.div
          key={`rain-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: '-10%',
            width: 1.5,
            height: 20 + Math.random() * 15,
            background: `linear-gradient(to bottom, ${colors.primary}80, transparent)`,
            borderRadius: 1,
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [0, 500], opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.6 + Math.random() * 0.3, delay: Math.random() * 0.8 }}
        />
      ))}
      {/* Wind gust particles */}
      {Array.from({ length: 10 }, (_, i) => (
        <motion.div
          key={`wind-${i}`}
          style={{
            position: 'absolute',
            left: '-5%',
            top: `${20 + Math.random() * 60}%`,
            width: 40 + Math.random() * 30,
            height: 2,
            borderRadius: 1,
            background: `linear-gradient(90deg, transparent, ${colors.primary}44, transparent)`,
          }}
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: [0, 500], opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.8, delay: 0.1 + i * 0.08 }}
        />
      ))}
      {/* Thunder flash */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: '#fff' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0, 0.3, 0] }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
    </>
  );
}

// Unified skill blast that delegates to element-specific effects
function SkillBlast({ skill, dragon, dispatch }) {
  const colors = dragon?.colors || {};
  const element = dragon?.id;

  React.useEffect(() => {
    const timer = setTimeout(() => dispatch({ type: 'CLEAR_ACTIVE_SKILL' }), 2200);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const elementEffects = {
    ember: FireBlast,
    frost: IceBlast,
    stone: EarthBlast,
    shadow: ShadowBlast,
    glimmer: LightBlast,
    storm: StormBlast,
  };

  const ElementEffect = elementEffects[element] || FireBlast;

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Element-specific VFX */}
      <ElementEffect colors={colors} skill={skill} />

      {/* Giant skill icon (shared across all elements) */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '38%',
          fontSize: 100, transform: 'translate(-50%, -50%)',
          filter: `drop-shadow(0 0 25px ${colors.glow}) drop-shadow(0 0 50px ${colors.primary}80)`,
        }}
        initial={{ scale: 0, rotate: -30 }}
        animate={{
          scale: [0, 1.8, 1.3, 2, 0],
          rotate: [0, 10, -10, 5, 0],
          opacity: [0, 1, 1, 1, 0],
        }}
        transition={{ duration: 2.0, times: [0, 0.15, 0.4, 0.7, 1] }}
      >
        {skill.icon}
      </motion.div>

      {/* Skill name text */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '56%',
          transform: 'translate(-50%, -50%)',
          fontSize: 28, fontWeight: 900,
          color: colors.accent,
          textShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.primary}`,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -10] }}
        transition={{ duration: 2.0, times: [0, 0.2, 0.7, 1] }}
      >
        {skill.name}!
      </motion.div>
    </motion.div>
  );
}

export default function GameScreen() {
  const { dragon, progress, eating, mouthOpen, streak, wrongAnswer, currentQuestion, activeSkill, dispatch } = useGame();
  const version = useVersion();
  const isPixi = version === 'v2';
  const dragonRef = useRef(null);
  const numbersRef = useRef(null);

  // Responsive sizing
  const isWide = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const dragonSize = isWide ? 520 : 380;

  if (!dragon) return null;
  const stageIndex = Math.min(4, Math.floor(progress * 5));

  return (
    <div className="h-screen flex flex-col relative overflow-hidden"
      style={{ background: '#050510' }}
    >
      {/* Full-bleed cave background */}
      <CaveBackground dragon={dragon} />

      {/* Ambient background particles */}
      <AmbientParticles color={dragon.colors.glow + '40'} count={20} />

      {/* Progress bar at top — overlaid on cave ceiling */}
      <div className="w-full max-w-3xl mx-auto px-4 pt-3 relative z-10">
        <ProgressBar />
      </div>

      {/* Main game area — dragon on left in cave, numbers at cave mouth on right */}
      <div className="flex flex-col lg:flex-row items-center lg:items-end justify-center gap-4 lg:gap-0 w-full flex-1 relative z-10 px-4" style={{ paddingBottom: isWide ? 120 : 40 }}>

        {/* Dragon area — sits on cave floor, left ~45% */}
        <div className="flex flex-col items-center lg:items-center lg:flex-1" style={{ maxWidth: 600 }}>
          {/* Dragon on the floor */}
          <div className="flex-shrink-0 flex items-end justify-center" ref={dragonRef}>

            {isPixi ? (
              <Suspense fallback={
                <DragonSVG dragon={dragon} progress={progress} size={dragonSize} chomping={mouthOpen} />
              }>
                <DragonPixi
                  dragon={dragon}
                  progress={progress}
                  size={dragonSize}
                  chomping={mouthOpen}
                  streak={streak}
                  wrongAnswer={wrongAnswer}
                  DragonSVGComponent={DragonSVG}
                />
              </Suspense>
            ) : (
              <DragonSVG dragon={dragon} progress={progress} size={dragonSize} chomping={mouthOpen} />
            )}
          </div>

          {/* Stage name + skill bar — below dragon, above cave floor */}
          <motion.div
            className="text-center relative z-10"
            key={stageIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xl lg:text-2xl font-black tracking-wide" style={{
              color: dragon.colors.accent,
              textShadow: `0 0 12px ${dragon.colors.glow}60, 0 2px 4px rgba(0,0,0,0.5)`,
            }}>
              {dragon.stages[stageIndex]?.name}
            </p>
            <p className="text-sm lg:text-base text-gray-400 italic" style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}>
              {dragon.stages[stageIndex]?.description}
            </p>
          </motion.div>

          <div className="mt-2 mb-4">
            <SkillBar />
          </div>
        </div>

        {/* Question + input — at cave mouth, right side */}
        <div ref={numbersRef} className="flex flex-col items-center justify-center lg:flex-1 lg:pb-20" style={{ maxWidth: 480 }}>
          <FloatingNumbers />
          <AnswerInput />
        </div>
      </div>

      {/* Flying answer overlay — uses fixed positioning to cross layout boundaries */}
      <AnimatePresence>
        {eating && currentQuestion && (
          <FlyingAnswer
            key={`fly-${currentQuestion.display}`}
            dragon={dragon}
            answer={currentQuestion.answer}
            dragonRef={dragonRef}
            numbersRef={numbersRef}
          />
        )}
      </AnimatePresence>

      {/* Dramatic skill activation overlay */}
      <AnimatePresence>
        {activeSkill && (
          <SkillBlast
            key={`skill-${activeSkill.name}`}
            skill={activeSkill}
            dragon={dragon}
            dispatch={dispatch}
          />
        )}
      </AnimatePresence>

      {/* Developer tools — growth stage scrubber */}
      <DevPanel />
    </div>
  );
}
