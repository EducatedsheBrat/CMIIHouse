// Generates the LeaderQuest panther mascots from one articulated rig.
//   npm run panthers            → src/assets/panthers/*.svg
//   npm run panthers -- --preview  → also writes PNG contact sheets to scripts/.panther-preview/
//
// Every panther shares the same skeleton (torso, neck, head + jaw, 2-3 segment legs,
// 4-segment tail), so the silhouettes stay consistent. Static poses bake joint angles
// into transform attributes; the running sprite drives the same joints with CSS keyframes.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'src/assets/panthers');
const PREVIEW = resolve(root, 'scripts/.panther-preview');
const preview = process.argv.includes('--preview');
mkdirSync(OUT, { recursive: true });

const VB_W = 200;
const VB_H = 140;

// ---------------------------------------------------------------- geometry

const P = (x, y) => ({ x, y });
const r2 = (n) => Math.round(n * 100) / 100;

/** Maps rig coordinates into the final viewBox (uniform scale + translate). */
const makeT = (s = 1, tx = 0, ty = 0) => (p) => P(p.x * s + tx, p.y * s + ty);

/** Outline of two circles joined by their outer tangents — a tapered limb segment. */
function capsule(T, s, a, ra, b, rb) {
  const A = T(a);
  const B = T(b);
  ra *= s;
  rb *= s;
  const L = Math.hypot(B.x - A.x, B.y - A.y) || 0.001;
  const ang = Math.atan2(B.y - A.y, B.x - A.x);
  const phi = Math.acos(Math.max(-0.98, Math.min(0.98, (ra - rb) / L)));
  const pts = [];
  const arc = (c, r, from, to) => {
    const steps = Math.max(4, Math.ceil(Math.abs(to - from) / (Math.PI / 14)));
    for (let i = 0; i <= steps; i++) {
      const t = from + ((to - from) * i) / steps;
      pts.push(P(c.x + Math.cos(t) * r, c.y + Math.sin(t) * r));
    }
  };
  arc(B, rb, ang + phi, ang - phi);
  arc(A, ra, ang - phi, ang + phi - Math.PI * 2);
  return `<path d="M${pts.map((p) => `${r2(p.x)} ${r2(p.y)}`).join('L')}Z"/>`;
}

/** Cubic path from rig-space commands: [['M',x,y], ['C',x1,y1,x2,y2,x,y], ...]. */
function bez(T, cmds) {
  return (
    '<path d="' +
    cmds
      .map(([c, ...n]) => {
        if (c === 'Z') return 'Z';
        const out = [];
        for (let i = 0; i < n.length; i += 2) {
          const p = T(P(n[i], n[i + 1]));
          out.push(r2(p.x), r2(p.y));
        }
        return c + out.join(' ');
      })
      .join('') +
    '"/>'
  );
}

function ellipse(T, s, c, rx, ry, rot = 0, extra = '') {
  const C = T(c);
  return `<ellipse cx="${r2(C.x)}" cy="${r2(C.y)}" rx="${r2(rx * s)}" ry="${r2(ry * s)}"${rot ? ` transform="rotate(${rot} ${r2(C.x)} ${r2(C.y)})"` : ''}${extra}/>`;
}

// ---------------------------------------------------------------- the rig (rest pose, facing right)

const FRONT = {
  shoulder: P(144, 62),
  upper: [P(143, 60), 12, P(146, 89), 7.2],
  elbow: P(146, 89),
  lower: [P(146, 89), 7.2, P(147, 115), 5],
  wrist: P(147, 115),
  paw: [P(151.5, 119.5), 7.6, 4.4],
};

const HIND = {
  hip: P(64, 66),
  thigh: [P(62, 63), 19.5, P(80, 91), 9],
  knee: P(80, 91),
  shin: [P(80, 91), 8, P(66, 109), 5.2],
  hock: P(66, 109),
  meta: [P(66, 109), 5.2, P(69, 119.5), 4.3],
  ankle: P(69, 119.5),
  paw: [P(74, 121.2), 7.6, 4.1],
};

const TORSO = [
  ['M', 46, 57],
  ['C', 60, 45, 92, 50, 112, 52],
  ['C', 122, 53, 130, 41, 145, 45],
  ['C', 161, 51, 165, 72, 155, 85],
  ['C', 149, 91, 136, 91, 128, 87],
  ['C', 110, 82, 92, 80, 82, 83],
  ['C', 70, 87, 51, 85, 43, 76],
  ['C', 37, 69, 38, 61, 46, 57],
  ['Z'],
];

const NECK = [P(136, 58), 17, P(160, 45), 12.5];
const HEAD_PIVOT = P(156, 46);
// Round cranium, short blunt muzzle — a cat, not a wolf.
const HEAD = [
  ['M', 154, 44],
  ['C', 152, 32, 161, 23.5, 172, 23],
  ['C', 181, 22.5, 187, 26.5, 190, 31],
  ['C', 193, 32, 195.5, 34, 196, 37],
  ['C', 196.8, 40, 195.5, 43, 192.5, 43.8],
  ['C', 189.5, 44.6, 186.5, 45, 183.5, 45],
  ['C', 184, 49, 180.5, 52.5, 174.5, 52.5],
  ['C', 166, 53, 157, 51.5, 154, 44],
  ['Z'],
];
const HEAD_ROAR = [
  ['M', 154, 44],
  ['C', 152, 32, 161, 23.5, 172, 23],
  ['C', 181, 22.5, 187, 26.5, 190, 31],
  ['C', 193, 32, 195.5, 34, 196, 37],
  ['C', 196.8, 40, 195.5, 43, 192.5, 43.8],
  ['C', 187, 44.4, 179, 45.2, 172, 47],
  ['C', 166, 48.5, 159, 49.5, 156, 48],
  ['C', 154.5, 47, 154, 45.5, 154, 44],
  ['Z'],
];
const JAW_PIVOT = P(164, 47.5);
const JAW = [
  ['M', 161, 46],
  ['C', 169, 46, 180, 46, 189.5, 46.3],
  ['C', 191, 49, 188, 52.5, 182, 53],
  ['C', 174, 54, 165, 53.5, 158, 50],
  ['Z'],
];
const EAR_NEAR = [['M', 159.5, 30], ['C', 159, 24.5, 161.5, 19.5, 166.5, 18.8], ['C', 170.5, 19.8, 172.5, 23.8, 172.3, 27.8], ['Z']];
const EAR_FAR = [['M', 169, 26.5], ['C', 169.5, 22, 172.5, 18.8, 176.5, 18.8], ['C', 179.3, 20.8, 180, 24.3, 179.4, 28], ['Z']];
const EYE = P(182, 33.5);

const TAIL = [
  { pivot: P(46, 59), seg: [P(46, 59), 6.2, P(30, 74), 5] },
  { pivot: P(30, 74), seg: [P(30, 74), 5, P(20, 92), 4.3] },
  { pivot: P(20, 92), seg: [P(20, 92), 4.3, P(18, 108), 3.9] },
  { pivot: P(18, 108), seg: [P(18, 108), 3.9, P(23, 118), 3.8] },
];

const TORSO_PIVOT = P(64, 66);

// ---------------------------------------------------------------- building

/**
 * ctx: { T, s, animated, pose, layer: 'rim' | 'body', near, far }
 * Joint groups get either a static rotate() or, for the animated sprite, a class the CSS drives.
 */
function joint(ctx, name, pivot, children) {
  const p = ctx.T(pivot);
  if (ctx.animated) {
    ctx.origins[name] = p;
    return `<g class="lqp-${name}">${children}</g>`;
  }
  const a = ctx.pose.joints[name] ?? 0;
  return a ? `<g transform="rotate(${a} ${r2(p.x)} ${r2(p.y)})">${children}</g>` : `<g>${children}</g>`;
}

function frontLeg(ctx, id, off) {
  const { T, s } = ctx;
  const o = (p) => P(p.x + off.x, p.y + off.y);
  const L = FRONT;
  const paw = ellipse(T, s, o(L.paw[0]), L.paw[1], L.paw[2]);
  const lower = capsule(T, s, o(L.lower[0]), L.lower[1], o(L.lower[2]), L.lower[3]);
  const upper = capsule(T, s, o(L.upper[0]), L.upper[1], o(L.upper[2]), L.upper[3]);
  return joint(ctx, `${id}-sh`, o(L.shoulder), upper + joint(ctx, `${id}-el`, o(L.elbow), lower + joint(ctx, `${id}-wr`, o(L.wrist), paw)));
}

function hindLeg(ctx, id, off) {
  const { T, s } = ctx;
  const o = (p) => P(p.x + off.x, p.y + off.y);
  const L = HIND;
  const paw = ellipse(T, s, o(L.paw[0]), L.paw[1], L.paw[2]);
  const meta = capsule(T, s, o(L.meta[0]), L.meta[1], o(L.meta[2]), L.meta[3]);
  const shin = capsule(T, s, o(L.shin[0]), L.shin[1], o(L.shin[2]), L.shin[3]);
  const thigh = capsule(T, s, o(L.thigh[0]), L.thigh[1], o(L.thigh[2]), L.thigh[3]);
  return joint(
    ctx,
    `${id}-hip`,
    o(L.hip),
    thigh + joint(ctx, `${id}-kn`, o(L.knee), shin + joint(ctx, `${id}-hk`, o(L.hock), meta + joint(ctx, `${id}-an`, o(L.ankle), paw))),
  );
}

function tail(ctx) {
  const { T, s } = ctx;
  let inner = '';
  for (let i = TAIL.length - 1; i >= 0; i--) {
    const { pivot, seg } = TAIL[i];
    const tip = i === TAIL.length - 1 ? capsule(T, s, seg[2], seg[3], P(seg[2].x + 2, seg[2].y + 3), 3.1) : '';
    inner = joint(ctx, `t${i}`, pivot, capsule(T, s, seg[0], seg[1], seg[2], seg[3]) + tip + inner);
  }
  return inner;
}

function head(ctx) {
  const { T, s, layer, pose } = ctx;
  const roar = !!pose.roar;
  const far = `<g style="fill:${ctx.far}">${bez(T, EAR_FAR)}</g>`;
  let body = far + bez(T, EAR_NEAR) + bez(T, roar ? HEAD_ROAR : HEAD);
  if (roar) {
    const fang = (cmds) => (layer === 'body' ? `<g style="fill:var(--lqp-fang,#EFE6D2)">${bez(T, cmds)}</g>` : '');
    const upperFang = fang([['M', 190.5, 43.9], ['L', 189, 48.6], ['L', 187.4, 44.2], ['Z']]);
    const lowerFang = fang([['M', 186.8, 46.4], ['L', 185.4, 42.4], ['L', 183.8, 46.4], ['Z']]);
    const mouth =
      layer === 'body'
        ? `<g style="fill:var(--lqp-mouth,#2A0B10)">${ellipse(T, s, P(178, 50), 12, 5.5, 22)}</g>`
        : '';
    body = mouth + body + upperFang + joint(ctx, 'jaw', JAW_PIVOT, bez(T, JAW) + lowerFang);
  }
  if (layer === 'body') {
    const E = T(EYE);
    body +=
      `<g class="lqp-eye" style="fill:var(--lqp-eye,#D4A843)">` +
      `<ellipse cx="${r2(E.x)}" cy="${r2(E.y)}" rx="${r2(6.5 * s)}" ry="${r2(4.2 * s)}" opacity=".28"/>` +
      `<ellipse cx="${r2(E.x)}" cy="${r2(E.y)}" rx="${r2(2.9 * s)}" ry="${r2(1.55 * s)}" transform="rotate(-12 ${r2(E.x)} ${r2(E.y)})"/>` +
      `</g>`;
  }
  return joint(ctx, 'head', HEAD_PIVOT, body);
}

function rig(ctx) {
  const { T, s } = ctx;
  const farFront = P(-8, -2.5);
  const farHind = P(9, -2.5);
  const farWrap = (svg) => `<g style="fill:${ctx.far}">${svg}</g>`;
  const torso =
    farWrap(frontLeg(ctx, 'ff', farFront)) +
    capsule(T, s, NECK[0], NECK[1], NECK[2], NECK[3]) +
    bez(T, TORSO) +
    head(ctx) +
    frontLeg(ctx, 'fn', P(0, 0));
  const tailSvg = tail(ctx);
  // Seated panthers wrap the tail around their paws, so it's drawn in front.
  return (
    farWrap(hindLeg(ctx, 'hf', farHind)) +
    (ctx.pose.tailFront ? '' : tailSvg) +
    joint(ctx, 'torso', TORSO_PIVOT, torso) +
    hindLeg(ctx, 'hn', P(0, 0)) +
    (ctx.pose.tailFront ? tailSvg : '')
  );
}

// ---------------------------------------------------------------- poses (SVG degrees; legs: positive swings back)

const GALLOP = {
  // keyframe stops: 0%, 25%, 50%, 75%
  'fn-sh': [-58, -18, 34, 6],
  'fn-el': [-12, 0, 12, 78],
  'fn-wr': [-30, 8, 48, 36],
  'ff-sh': [-48, -6, 40, -6],
  'ff-el': [-8, 4, 20, 70],
  'ff-wr': [-24, 14, 50, 26],
  'hn-hip': [48, 4, -42, 14],
  'hn-kn': [8, -40, -8, 0],
  'hn-hk': [-18, 46, 20, 4],
  'hn-an': [34, 22, -12, 2],
  'hf-hip': [38, -8, -48, 24],
  'hf-kn': [12, -34, -2, 6],
  'hf-hk': [-10, 40, 16, -2],
  'hf-an': [30, 20, -8, 6],
  torso: [-3, 1, 3, 0],
  head: [4, 1, -3, 1],
  t0: [64, 58, 52, 58],
  t1: [-12, -2, 8, -4],
  t2: [-18, -8, 2, -10],
  t3: [-26, -10, 8, -18],
};
const frame = (i) => Object.fromEntries(Object.entries(GALLOP).map(([k, v]) => [k, v[i]]));

const SEATED_HIND = { 'hn-hip': -56, 'hn-kn': 96, 'hn-hk': -98, 'hn-an': 58, 'hf-hip': -50, 'hf-kn': 92, 'hf-hk': -96, 'hf-an': 54 };

const POSES = {
  neutral: { label: 'Black panther, running', joints: frame(0) },
  kaizen: {
    label: 'Kaizen panther, in stride',
    speedLines: true,
    joints: {
      ...frame(0),
      'fn-sh': -40, 'fn-el': -6, 'fn-wr': -20,
      'ff-sh': 26, 'ff-el': 10, 'ff-wr': 40,
      'hn-hip': -30, 'hn-kn': -12, 'hn-hk': 18, 'hn-an': -6,
      'hf-hip': 40, 'hf-kn': 10, 'hf-hk': -14, 'hf-an': 30,
      torso: -2, head: 3,
    },
  },
  lumina: {
    label: 'Lumina panther, head raised',
    tailFront: true,
    joints: {
      torso: -34, head: 2,
      'fn-sh': 34, 'fn-el': 0, 'fn-wr': 0,
      'ff-sh': 32, 'ff-el': 0, 'ff-wr': 0,
      ...SEATED_HIND,
      t0: -52, t1: -58, t2: -24, t3: -46,
    },
  },
  doron: {
    label: 'Doron panther, paw extended',
    tailFront: true,
    joints: {
      torso: -26, head: 16,
      'fn-sh': -48, 'fn-el': -40, 'fn-wr': 30,
      'ff-sh': 26, 'ff-el': 0, 'ff-wr': 0,
      ...SEATED_HIND,
      t0: -50, t1: -58, t2: -24, t3: -46,
    },
  },
  ase: {
    label: 'Asé panther, roaring mid-leap',
    roar: true,
    rootAngle: -18,
    joints: {
      torso: -6, head: -12, jaw: 30,
      'fn-sh': -72, 'fn-el': -24, 'fn-wr': -18,
      'ff-sh': -52, 'ff-el': 14, 'ff-wr': -6,
      'hn-hip': 56, 'hn-kn': 22, 'hn-hk': -8, 'hn-an': 44,
      'hf-hip': 44, 'hf-kn': 30, 'hf-hk': -4, 'hf-an': 38,
      t0: 70, t1: -28, t2: -26, t3: -24,
    },
  },
};

const HOUSE_COLORS = { lumina: '#D4A843', doron: '#5B8DBE', ase: '#9B6BA3', kaizen: '#6AAB6E' };

function hexMix(a, b, t) {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function palette(key) {
  if (key === 'neutral') {
    return { accent: '#8E97AA', rimOpacity: 0.55, top: '#0B0B10', bottom: '#1A1C24', farTop: '#16161D', farBottom: '#23252E', eye: '#D4A843' };
  }
  const c = HOUSE_COLORS[key];
  return {
    accent: c,
    rimOpacity: 0.95,
    top: '#0B0B10',
    bottom: hexMix(c, '#0D0D12', 0.76),
    farTop: '#17171E',
    farBottom: hexMix(c, '#0D0D12', 0.84),
    eye: hexMix(c, '#FFFFFF', 0.35),
  };
}

// ---------------------------------------------------------------- SVG assembly

function svgDocument({ key, pose, T, s, animated, bbox }) {
  const pal = palette(key);
  const origins = {};
  const far = 'url(#lqpid-far)';
  const base = { T, s, animated, pose, far, origins };
  const rimT = (p) => {
    const q = T(p);
    return P(q.x - 1.2, q.y - 1.5);
  };
  const rim = rig({ ...base, T: rimT, layer: 'rim', far: 'inherit' });
  const body = rig({ ...base, layer: 'body' });

  let speed = '';
  if (pose.speedLines && bbox) {
    const y0 = bbox.y + bbox.h * 0.35;
    speed = [0, 1, 2]
      .map((i) => {
        const y = r2(y0 + i * bbox.h * 0.16);
        const x1 = r2(Math.max(2, bbox.x - 6 - i * 4));
        const x2 = r2(x1 + 26 - i * 6);
        return `<path d="M${x1} ${y}H${x2}" stroke-width="${r2(2.4 - i * 0.5)}" stroke-linecap="round" opacity="${0.8 - i * 0.2}"/>`;
      })
      .join('');
    speed = `<g class="lqp-speed" style="stroke:var(--lqp-accent,${pal.accent})">${speed}</g>`;
  }

  let rootOpen = '<g class="lqp-root">';
  if (pose.rootAngle && !animated) {
    const c = T(TORSO_PIVOT);
    rootOpen = `<g class="lqp-root" transform="rotate(${pose.rootAngle} ${r2(c.x)} ${r2(c.y)})">`;
  }

  let style = '';
  if (animated) {
    const stops = ['0%', '25%', '50%', '75%', '100%'];
    const rules = Object.entries(GALLOP).map(([name, v]) => {
      const o = origins[name];
      const keys = [...v, v[0]].map((a, i) => `${stops[i]}{transform:rotate(${a}deg)}`).join('');
      const lag = name.startsWith('ff') || name.startsWith('hf') ? ' animation-delay:calc(var(--lqp-run-duration,.46s) * -.1);' : '';
      // Scoped to the running sprite so inlining it never animates the static panthers on the page.
      return (
        `@keyframes lqp-${name}{${keys}}` +
        `.lq-panther--running .lqp-${name}{transform-box:view-box;transform-origin:${r2(o.x)}px ${r2(o.y)}px;transform:rotate(${v[0]}deg);` +
        `animation:lqp-${name} var(--lqp-run-duration,.46s) linear infinite;${lag}}`
      );
    });
    rules.push(
      `@keyframes lqp-bob{0%,50%,100%{transform:translateY(0)}25%,75%{transform:translateY(-2.5px)}}` +
        `.lq-panther--running .lqp-root{animation:lqp-bob var(--lqp-run-duration,.46s) ease-in-out infinite}`,
    );
    style = `<style>${rules.join('')}</style>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}" class="lq-panther lq-panther--${key}${animated ? ' lq-panther--running' : ''}" role="img" aria-label="${pose.label}">` +
    style +
    `<defs>` +
    `<linearGradient id="lqpid-body" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="${VB_H}">` +
    `<stop offset="0" style="stop-color:var(--lqp-body-top,${pal.top})"/><stop offset=".55" style="stop-color:var(--lqp-body-top,${pal.top})"/><stop offset="1" style="stop-color:var(--lqp-body-bottom,${pal.bottom})"/></linearGradient>` +
    `<linearGradient id="lqpid-far" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="${VB_H}">` +
    `<stop offset="0" style="stop-color:var(--lqp-far-top,${pal.farTop})"/><stop offset="1" style="stop-color:var(--lqp-far-bottom,${pal.farBottom})"/></linearGradient>` +
    `</defs>` +
    speed +
    rootOpen +
    `<g class="lqp-rim" style="fill:var(--lqp-accent,${pal.accent});opacity:var(--lqp-rim-opacity,${pal.rimOpacity})">${rim}</g>` +
    `<g class="lqp-body" style="fill:url(#lqpid-body)">${body}</g>` +
    `</g></svg>`
  );
}

/** Renders a pose on a big scratch canvas and trims it to find its bounding box in rig units. */
async function measure(key, pose) {
  const PAD = 120;
  const T = makeT(1, PAD, PAD);
  const svg = svgDocument({ key, pose: { ...pose, speedLines: false }, T, s: 1, animated: false }).replace(
    `viewBox="0 0 ${VB_W} ${VB_H}"`,
    `viewBox="0 0 ${VB_W + PAD * 2} ${VB_H + PAD * 2}" width="${(VB_W + PAD * 2) * 4}" height="${(VB_H + PAD * 2) * 4}"`,
  );
  const { info } = await sharp(Buffer.from(svg)).png().trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  return {
    x: -info.trimOffsetLeft / 4 - PAD,
    y: -info.trimOffsetTop / 4 - PAD,
    w: info.width / 4,
    h: info.height / 4,
  };
}

const FILES = {
  neutral: 'panther-neutral.svg',
  lumina: 'panther-lumina.svg',
  doron: 'panther-doron.svg',
  ase: 'panther-ase.svg',
  kaizen: 'panther-kaizen.svg',
};

const sheets = [];
const strip = [];
const modules = {};
for (const [key, pose] of Object.entries(POSES)) {
  const box = await measure(key, pose);
  const pad = key === 'kaizen' ? 16 : 6;
  const s = Math.min((VB_W - pad - 6) / box.w, (VB_H - 8) / box.h);
  const tx = pad + (VB_W - pad - 6 - box.w * s) / 2 - box.x * s;
  const ty = VB_H - 4 - (box.y + box.h) * s; // stand on the bottom edge
  const T = makeT(s, tx, ty);
  const fitted = { x: box.x * s + tx, y: box.y * s + ty, w: box.w * s, h: box.h * s };
  const svg = svgDocument({ key, pose, T, s, animated: false, bbox: fitted });
  writeFileSync(resolve(OUT, FILES[key]), svg);
  console.log(`✓ src/assets/panthers/${FILES[key]}  (fit ${r2(s)}×)`);
  sheets.push({ key, svg });
  modules[key] = svg;

  if (key === 'neutral') {
    // Running sprite: same rig with extra room for the stride, joints driven by CSS.
    const sr = s * 0.9;
    const Tr = makeT(sr, (VB_W - box.w * sr) / 2 - box.x * sr, VB_H - 6 - (box.y + box.h) * sr);
    const run = svgDocument({ key, pose, T: Tr, s: sr, animated: true });
    writeFileSync(resolve(OUT, 'panther-run-sprite.svg'), run);
    console.log('✓ src/assets/panthers/panther-run-sprite.svg  (animated)');
    modules.runSprite = run;
    if (preview) {
      // Eight evenly spaced phases of the run cycle, interpolated the way CSS linear keyframes are.
      for (let i = 0; i < 8; i++) {
        const joints = {};
        for (const [name, v] of Object.entries(GALLOP)) {
          const lag = name.startsWith('ff') || name.startsWith('hf') ? 0.1 : 0;
          const p = ((i / 8 + lag) % 1) * 4;
          const k = Math.floor(p);
          const a = v[k];
          const b = v[(k + 1) % 4];
          joints[name] = a + (b - a) * (p - k);
        }
        strip.push(svgDocument({ key, pose: { ...pose, joints }, T: Tr, s: sr, animated: false }));
      }
    }
  }
}

// The app imports the markup from this module (bundler-agnostic — no raw-loader needed).
const moduleSource =
  '// Generated by scripts/generate-panthers.mjs — do not edit. Run `npm run panthers` instead.\n' +
  '// Each export is the markup of the matching .svg file in this folder.\n\n' +
  Object.entries(modules)
    .map(([name, svg]) => `export const ${name} = ${JSON.stringify(svg)};\n`)
    .join('\n');
writeFileSync(resolve(OUT, 'index.ts'), moduleSource);
console.log('✓ src/assets/panthers/index.ts');

if (preview) {
  mkdirSync(PREVIEW, { recursive: true });
  const cell = (svg, w) => sharp(Buffer.from(svg.replace('<svg ', `<svg width="${w}" height="${Math.round((w * VB_H) / VB_W)}" `))).png().toBuffer();
  const W = 400;
  const H = Math.round((W * VB_H) / VB_W);
  const composites = [];
  let i = 0;
  for (const { svg } of sheets) {
    composites.push({ input: await cell(svg, W), left: (i % 3) * (W + 10) + 10, top: Math.floor(i / 3) * (H + 70) + 10 });
    composites.push({ input: await cell(svg, 64), left: (i % 3) * (W + 10) + 10, top: Math.floor(i / 3) * (H + 70) + H + 2 });
    i++;
  }
  const rows = Math.ceil(sheets.length / 3);
  await sharp({ create: { width: 3 * (W + 10) + 10, height: rows * (H + 70) + 10, channels: 4, background: '#0A1628' } })
    .composite(composites)
    .png()
    .toFile(resolve(PREVIEW, 'sheet.png'));
  const SW = 300;
  const SH = Math.round((SW * VB_H) / VB_W);
  const stripComposites = await Promise.all(strip.map(async (svg, j) => ({ input: await cell(svg, SW), left: (j % 4) * SW, top: Math.floor(j / 4) * SH })));
  await sharp({ create: { width: 4 * SW, height: 2 * SH, channels: 4, background: '#0A1628' } })
    .composite(stripComposites)
    .png()
    .toFile(resolve(PREVIEW, 'gallop.png'));
  console.log('✓ preview: scripts/.panther-preview/sheet.png, gallop.png');
}
