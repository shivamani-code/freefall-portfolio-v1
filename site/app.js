(() => {
const D = document, H = D.documentElement, W = window;
const Q = new URLSearchParams(location.search);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches || Q.has('still');
if (RM) H.classList.add('rm');
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const cl = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const F = W.FRAMES;
const LOCAL = /^(localhost|127\.)/.test(location.hostname) || Q.has('local');

/* ---------- acts & layout ---------- */
const acts = [...D.querySelectorAll('.act')];
let vh = innerHeight, vw = innerWidth, geo = [], docH = 1;
function layout() {
  vh = innerHeight; vw = innerWidth;
  if (!RM) acts.forEach(a => a.style.height = Math.round(+a.dataset.h / 100 * vh) + 'px');
  geo = acts.map(a => ({ el: a, top: a.offsetTop, h: a.offsetHeight }));
  docH = D.documentElement.scrollHeight;
  if (W.__cases) __cases.forEach(o => { const r = o.c.getBoundingClientRect(); o.top = r.top + scrollY; o.h = r.height; });
  sizeCanvas(); dirty = true;
}
let lastW = innerWidth;
addEventListener('resize', () => { if (Math.abs(innerWidth - lastW) > 40 || !('ontouchstart' in W)) { lastW = innerWidth; layout(); } else { sizeCanvas(); } }, { passive: true });

/* ---------- film canvas ---------- */
const cv = D.getElementById('film'), cx = cv.getContext('2d', { alpha: false });
const col = D.createElement('canvas'), kx = col.getContext('2d');
const amb = D.createElement('canvas'); amb.width = 36; amb.height = 64; const ax = amb.getContext('2d');
const mobile = matchMedia('(pointer:coarse)').matches || innerWidth < 900;
const DPR = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75);
function sizeCanvas() { cv.width = Math.round(innerWidth * DPR); cv.height = Math.round(innerHeight * DPR); dirty = true; }
const films = F.films.map(f => ({ n: f.n, imgs: new Array(f.n).fill(null), poster: null }));
F.posters.forEach((p, k) => { const im = new Image(); im.onload = () => { films[k].poster = im; dirty = true; }; im.src = p; });
const url = (k, i) => (LOCAL ? 'frames/' : F.hosts[F.films[k].h[i]]) + F.films[k].id + '_' + String(i + 1).padStart(3, '0') + '.webp';
let loaded = 0, total = films.reduce((s, f) => s + f.n, 0);
const bar = D.querySelector('#load i');
function loadAll() {
  const order = [], seen = new Set(), push = (k, i) => { const key = k * 1000 + i; if (!seen.has(key)) { seen.add(key); order.push([k, i]); } };
  const pass = (k, s) => { for (let i = 0; i < films[k].n; i += s) push(k, i); };
  pass(0, 6); pass(0, 2); pass(0, 1); pass(1, 4); pass(2, 4); pass(1, 1); pass(2, 1);
  let q = 0;
  const lane = () => {
    if (q >= order.length) return;
    const [k, i] = order[q++]; const im = new Image(); im.decoding = 'async';
    im.onload = () => { films[k].imgs[i] = im; loaded++; dirty = true; bar.style.transform = `scaleX(${loaded / total})`; if (loaded === total) bar.style.opacity = 0; if (loaded === 60) D.querySelectorAll('.screens img').forEach(x => x.loading = 'eager'); lane(); };
    im.onerror = () => { loaded++; lane(); };
    im.src = url(k, i);
  };
  for (let c = 0; c < (mobile ? 5 : 8); c++) lane();
}
function near(f, i, dir) { for (let j = i; j >= 0 && j < f.n; j += dir) if (f.imgs[j]) return j; return -1; }
function drawImg(img, a, wide) {
  const cw = cv.width, ch = cv.height, iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  cx.globalAlpha = a;
  if (wide) {
    const s = ch / ih, w = iw * s, x = (cw - w) / 2;
    cx.drawImage(img, x, 0, w, ch);
  } else {
    const s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    cx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  cx.globalAlpha = 1;
}
let dirty = true, curK = -1, curF = -1, shake = 0;
function render(k, p) {
  const f = films[k], fi = p * (f.n - 1);
  if (!dirty && k === curK && Math.abs(fi - curF) < 0.01 && !shake) return;
  let a = near(f, Math.floor(fi), -1), b = near(f, Math.ceil(fi), 1);
  if (a < 0) a = b; if (b < 0) b = a;
  const base = a >= 0 ? f.imgs[a] : f.poster;
  if (!base) return;
  dirty = false; curK = k; curF = fi;
  const cw = cv.width, ch = cv.height, wide = cw / ch > 0.8;
  cx.save();
  if (shake) { cx.translate((Math.random() - .5) * shake * DPR, (Math.random() - .5) * shake * DPR); }
  if (wide) {
    ax.drawImage(base, 0, 0, 36, 64);
    cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
    const cw2 = cw * 1.08, chh = cw2 * 16 / 9;
    cx.drawImage(amb, (cw - cw2) / 2, (ch - chh) * 0.42, cw2, chh);
    cx.fillStyle = 'rgba(7,7,10,.42)'; cx.fillRect(0, 0, cw, ch);
    const w = Math.round(ch * 9 / 16), x = Math.round((cw - w) / 2);
    if (col.width !== w || col.height !== ch) { col.width = w; col.height = ch; }
    kx.globalCompositeOperation = 'source-over'; kx.globalAlpha = 1;
    kx.drawImage(base, 0, 0, w, ch);
    if (a >= 0 && b !== a) { const t = (fi - a) / (b - a); if (t > 0.03) { kx.globalAlpha = t; kx.drawImage(f.imgs[b], 0, 0, w, ch); kx.globalAlpha = 1; } }
    kx.globalCompositeOperation = 'destination-in';
    const g = kx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.24, 'rgba(0,0,0,1)'); g.addColorStop(0.76, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    kx.fillStyle = g; kx.fillRect(0, 0, w, ch);
    kx.globalCompositeOperation = 'source-over';
    cx.drawImage(col, x, 0);
  } else {
    drawImg(base, 1, false);
    if (a >= 0 && b !== a) { const t = (fi - a) / (b - a); if (t > 0.03) drawImg(f.imgs[b], t, false); }
  }
  cx.restore();
}

/* ---------- embers ---------- */
const ec = D.getElementById('embers'), ex = ec.getContext('2d');
const EN = RM ? 0 : (mobile ? 34 : 70); let eps = [];
function sizeEmb() { ec.width = innerWidth; ec.height = innerHeight; }
sizeEmb(); addEventListener('resize', sizeEmb, { passive: true });
for (let i = 0; i < EN; i++) eps.push({ x: Math.random(), y: Math.random(), v: .2 + Math.random() * .8, s: .6 + Math.random() * 2.2, w: Math.random() * 6.28 });
let embOn = true;
function embers(level, dt, vel) {
  if (level <= 0.01) { if (embOn) { ex.clearRect(0, 0, ec.width, ec.height); embOn = false; } return; }
  embOn = true; ex.clearRect(0, 0, ec.width, ec.height);
  ex.globalCompositeOperation = 'lighter';
  for (const e of eps) {
    e.y -= (e.v * 0.00028 + Math.abs(vel) * 0.00002) * dt; e.w += dt * 0.002; e.x += Math.sin(e.w) * 0.0004;
    if (e.y < -0.05) { e.y = 1.05; e.x = Math.random(); }
    const a = level * (0.35 + 0.65 * Math.sin(e.w * 1.7) ** 2);
    ex.fillStyle = `rgba(255,${120 + (e.s * 30 | 0)},40,${a})`;
    ex.beginPath(); ex.arc(e.x * ec.width, e.y * ec.height, e.s, 0, 6.29); ex.fill();
  }
  ex.globalCompositeOperation = 'source-over';
}

/* ---------- beats ---------- */
const beats = acts.map(a => [...a.querySelectorAll('.beat')].map(el => {
  const [s, e] = el.dataset.r.split(',').map(Number);
  return { el, s, e, hold: el.hasAttribute('data-hold-start'), fly: el.classList.contains('fly') };
}));
const nameL = [...D.querySelectorAll('.name span')];
let nameFree = false;
nameL[3] && nameL[3].addEventListener('animationend', () => { nameL.forEach(s => s.style.animation = 'none'); nameFree = true; });
setTimeout(() => { nameL.forEach(s => s.style.animation = 'none'); nameFree = true; }, 2600);
const buildL = [...D.querySelectorAll('.build span')];
const ring = D.querySelector('.ring');
function beatsUpdate(ai, p) {
  for (const b of beats[ai]) {
    let t = (p - b.s) / (b.e - b.s);
    let o;
    if (b.hold && t < 0.5) o = 1; else o = t <= 0 || t >= 1 ? 0 : Math.min(1, t / 0.22, (1 - t) / 0.22);
    if (b.el.classList.contains('hero')) {
      b.el.style.opacity = o;
      if (nameFree) { const u = cl(t * 1.6); nameL.forEach((s, i) => s.style.transform = `translate3d(${(i - 1.5) * u * 46}vw,${u * -10}vh,${u * 700}px) rotateY(${(i - 1.5) * u * 24}deg)`); }
      continue;
    }
    if (o <= 0 && b.o <= 0) continue;
    b.el.style.opacity = o; b.o = o;
    if (o <= 0) continue;
    if (b.fly) { const z = -520 + cl(t) * 760; b.el.style.transform = `translate3d(0,0,${z}px) rotateX(${(0.5 - t) * 10}deg)`; }
    if (b.el.classList.contains('build')) buildL.forEach((s, i) => {
      const u = cl((t - i * 0.06) / 0.26), q = 1 - u;
      s.style.transform = `translate3d(0,${q * 70}vh,0) rotateX(${q * -70}deg) scale(${1 + q * .4})`; s.style.opacity = u;
    });
  }
}

/* ---------- sound (procedural, off by default) ---------- */
let ac = null, master, whooshG;
const snd = D.getElementById('snd');
function startSound() {
  ac = new (W.AudioContext || W.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; lp.connect(master);
  [55, 55.6, 82.4].forEach(fq => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fq; const g = ac.createGain(); g.gain.value = 0.05; o.connect(g); g.connect(lp); o.start(); });
  const nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const ns = ac.createBufferSource(); ns.buffer = nb; ns.loop = true;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.7;
  whooshG = ac.createGain(); whooshG.gain.value = 0; ns.connect(bp); bp.connect(whooshG); whooshG.connect(master); ns.start();
  W._nb = nb;
}
function boom() {
  if (!ac || snd.getAttribute('aria-pressed') !== 'true') return;
  const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(32, t + 1.4);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 2.1);
  const s = ac.createBufferSource(); s.buffer = W._nb; const ng = ac.createGain(); ng.gain.setValueAtTime(0.5, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  s.connect(ng); ng.connect(ac.destination); s.start(t); s.stop(t + 1);
}
snd.addEventListener('click', () => {
  if (!ac) startSound();
  const on = snd.getAttribute('aria-pressed') !== 'true';
  snd.setAttribute('aria-pressed', on); snd.querySelector('b').textContent = on ? 'on' : 'off';
  ac.resume(); master.gain.setTargetAtTime(on ? 0.5 : 0, ac.currentTime, 0.4);
});

/* ---------- scroll engine ---------- */
let lenis = null;
if (!RM && W.Lenis) { lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 }); }
const flash = D.getElementById('flash'), dim = D.getElementById('dim'), prog = D.getElementById('prog'), clock = D.getElementById('clock');
let lastY = scrollY, lastT = performance.now(), boomed = false, lastPct = -1;
function frame(now) {
  const dt = Math.min(64, now - lastT); lastT = now;
  if (lenis) lenis.raf(now);
  const y = scrollY, vel = (y - lastY) / Math.max(dt, 1) * 16; lastY = y;
  const [A1, A2, A3] = geo; if (!A1) { requestAnimationFrame(frame); return; }
  const pr = g => cl((y - g.top) / Math.max(1, g.h - vh));
  const p1 = pr(A1), p2 = pr(A2), p3 = pr(A3);
  const sw = A3.top - vh;
  let k, p, dm = 0, fl = 0, emb = 0;
  if (y < A2.top) { k = 0; p = p1; }
  else if (y < sw) { k = 1; p = p2; }
  else { k = 2; p = p3; }
  // dim: after act II, deep before the door, clear inside it
  const a2end = A2.top + A2.h - vh;
  if (k === 1 && y > a2end) dm = 0.74 * cl((y - a2end) / (vh * 0.7));
  if (y > sw - vh * 0.7 && y < sw) dm = 0.74 + 0.26 * cl((y - (sw - vh * 0.7)) / (vh * 0.7));
  if (k === 2) dm = 1 - cl((y - sw) / (vh * 0.9));
  // impact flash + shake
  if (!RM) {
    const d = (y - A2.top) / vh;
    fl = Math.pow(cl(1 - Math.abs(d) / 0.2), 1.4);
    shake = Math.abs(d) < 0.35 ? (1 - Math.abs(d) / 0.35) * 18 : 0;
    if (d > -0.02 && !boomed) { boomed = true; boom(); } if (d < -0.3) boomed = false;
    if (k === 2) { const a3e = A3.top + A3.h - vh; fl = Math.max(fl, Math.pow(cl((p3 - 0.74) / 0.26), 1.6) * 0.95 * (1 - cl((y - a3e) / (vh * 0.8)))); }
    emb = k === 0 ? cl((p1 - 0.85) / 0.15) * 0.6 : k === 1 ? 0.9 + fl : cl(p3 * 2) * 0.7;
    if (k === 1 && y < A2.top + vh * 0.25) emb = 1.6;
    ring.style.opacity = cl(1 - p2 / 0.3) * (p2 > 0.005 ? 1 : 0);
    ring.style.transform = `scale(${0.2 + p2 * 26}) rotateX(72deg)`;
  }
  flash.style.opacity = fl; flash.style.visibility = fl > 0.002 ? 'visible' : 'hidden'; dim.style.opacity = dm; dim.style.visibility = dm > 0.002 ? 'visible' : 'hidden';
  render(k, p);
  embers(emb, dt, vel);
  if (whooshG) whooshG.gain.setTargetAtTime(Math.min(0.5, Math.abs(vel) * 0.012), ac.currentTime, 0.08);
  beatsUpdate(0, p1); beatsUpdate(1, p2); beatsUpdate(2, p3);
  const all = cl(y / (docH - vh));
  const pct = Math.round(all * 100);
  if (pct !== lastPct) { lastPct = pct; clock.textContent = String(pct).padStart(2, '0') + '%'; prog.style.transform = `scaleX(${all})`; }
  parallax(y);
  requestAnimationFrame(frame);
}

/* ---------- case screens: parallax + reveals ---------- */
const cases = W.__cases = [...D.querySelectorAll('.case')].map(c => ({ c, top: 0, h: 1, a: c.querySelector('.screens img:first-child'), b: c.querySelector('.screens img:last-child') }));
function parallax(y) {
  if (RM) return;
  for (const o of cases) {
    const top = o.top - y; if (top + o.h < 0 || top > vh) { continue; }
    const m = (top + o.h / 2 - vh / 2) / vh;
    o.a.style.transform = `translate3d(0,${m * -40}px,0) rotateY(${12 + m * 10}deg) rotateZ(${-3 + m * 2}deg)`;
    o.b.style.transform = `translate3d(0,${m * 70}px,-60px) rotateY(${-14 + m * -8}deg) rotateZ(${4 - m * 2}deg)`;
  }
}
D.querySelectorAll('.case .title,.case .line,.case .enter,.sect,.mani-line,.four li,.index li,.cta,.mail').forEach(e => e.classList.add('rise'));
D.querySelectorAll('.screens').forEach(e => e.classList.add('reveal'));
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
D.querySelectorAll('.rise,.reveal').forEach(e => io.observe(e));

/* ---------- navigation ---------- */
function go(target, dur) {
  const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY - 10;
  if (lenis) lenis.scrollTo(top, { duration: dur || 1.6, easing: t => 1 - Math.pow(1 - t, 4) }); else scrollTo({ top, behavior: RM ? 'auto' : 'smooth' });
}
D.querySelectorAll('[data-to]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const t = a.dataset.to; go(t === '0' ? 0 : D.getElementById(t)); }));
D.getElementById('again').addEventListener('click', () => go(0, RM ? 0 : 6.5));

/* ---------- desktop: cursor + magnetic ---------- */
if (fine && !RM) {
  const cur = D.createElement('div'); cur.className = 'cursor'; D.body.appendChild(cur);
  let mx = -99, my = -99, cxp = -99, cyp = -99;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  (function c() { cxp += (mx - cxp) * .22; cyp += (my - cyp) * .22; cur.style.transform = `translate3d(${cxp}px,${cyp}px,0)`; requestAnimationFrame(c); })();
  D.querySelectorAll('a,button').forEach(el => { el.addEventListener('mouseenter', () => cur.classList.add('big')); el.addEventListener('mouseleave', () => cur.classList.remove('big')); });
  D.querySelectorAll('.mag').forEach(el => {
    el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .3}px,${(e.clientY - r.top - r.height / 2) * .4}px)`; });
    el.addEventListener('mouseleave', () => { el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)'; el.style.transform = ''; setTimeout(() => el.style.transition = '', 500); });
  });
}

layout();
D.fonts && D.fonts.ready.then(layout);
addEventListener('load', layout);
if (!RM) loadAll();
requestAnimationFrame(frame);
})();
