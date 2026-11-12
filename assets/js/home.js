/* Haru Studio — home page effects */
(() => {
  const { scroller, reduced } = window.Haru;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;

  /* ---------- intro sequence ---------- */
  const steps = reduced ? [0, 0, 0] : [250, 750, 1400];
  steps.forEach((t, i) => setTimeout(() => body.classList.add(`is-intro-${i + 1}`), t));

  /* ---------- procedural sakura branch (seeded, drawn in SVG) ---------- */
  function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function buildSakura(host) {
    const R = rng(20260412);
    const rand = (a, b) => a + R() * (b - a);
    const W = 1000, H = 900;
    const branches = [], blooms = [], buds = [];
    const ORIGIN = [1030, 70];
    const near = (x, y, d) => blooms.some((b) => Math.abs(b.x - x) < d && Math.abs(b.y - y) < d);
    const addBloom = (x, y, s, dist) => { if (!near(x, y, 24 * s)) blooms.push({ x, y, s, r: rand(0, 72), dist }); else if (R() < .3) buds.push({ x: x + rand(-10, 10), y: y + rand(-10, 10), r: rand(0, 360), dist }); };
    function grow(x, y, a, len, w, depth, dist) {
      a += (Math.PI - a) * .1 * (a > Math.PI ? 1 : 1);
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      const bend = rand(-.14, .14) * len;
      const cx = (x + ex) / 2 + Math.cos(a + Math.PI / 2) * bend, cy = (y + ey) / 2 + Math.sin(a + Math.PI / 2) * bend;
      const w2 = Math.max(w * .66, 1.1);
      branches.push({ x, y, cx, cy, ex, ey, w, w2, dist });
      const d2 = dist + len;
      if (depth >= 3 && R() < .5) {
        const t = rand(.3, .85), u = 1 - t;
        addBloom(u * u * x + 2 * u * t * cx + t * t * ex + rand(-5, 5), u * u * y + 2 * u * t * cy + t * t * ey + rand(-5, 5), rand(.6, .95), dist + len * t);
      }
      if (depth >= 7 || len < 14 || ex < 20 || ey > H + 40 || ey < -30) {
        if (R() < .82) addBloom(ex, ey, rand(.78, 1.12), d2);
        else buds.push({ x: ex, y: ey, r: a * 57.3, dist: d2 });
        if (R() < .45) buds.push({ x: ex + rand(-16, 16), y: ey + rand(-16, 16), r: rand(0, 360), dist: d2 });
        return;
      }
      grow(ex, ey, a + rand(-.32, .32), len * rand(.76, .88), w2, depth + 1, d2);
      const sides = depth < 1 ? 2 : (R() < .78 ? 1 : 0);
      for (let k = 0; k < sides; k++) {
        const dir = k % 2 ? 1 : -1;
        grow(ex, ey, a + dir * (R() < .5 ? 1 : -1) * rand(.5, 1.05), len * rand(.42, .62), w2 * .66, depth + 1, d2);
      }
    }
    grow(1040, 110, Math.PI + .12, 250, 30, 0, 0);
    grow(1030, 300, Math.PI - .22, 230, 24, 0, 120);
    grow(1035, 500, Math.PI + .3, 210, 20, 1, 260);
    grow(1020, 700, Math.PI - .35, 170, 16, 2, 380);
    // gnarled trunk along the right edge
    branches.push({ x: 1060, y: -40, cx: 900, cy: 420, ex: 985, ey: 960, w: 64, w2: 96, dist: 0 });

    const seg = (b) => {
      const pts = [], L = [], Rr = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, u = 1 - t;
        const px = u * u * b.x + 2 * u * t * b.cx + t * t * b.ex, py = u * u * b.y + 2 * u * t * b.cy + t * t * b.ey;
        const dx = 2 * u * (b.cx - b.x) + 2 * t * (b.ex - b.cx), dy = 2 * u * (b.cy - b.y) + 2 * t * (b.ey - b.cy);
        const m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m, hw = (b.w + (b.w2 - b.w) * t) / 2;
        L.push(`${(px + nx * hw).toFixed(1)},${(py + ny * hw).toFixed(1)}`); Rr.unshift(`${(px - nx * hw).toFixed(1)},${(py - ny * hw).toFixed(1)}`);
        pts.push([px, py]);
      }
      return `M${L.join("L")}L${Rr.join("L")}Z`;
    };
    const barkLine = (b, off) => `M${(b.x + off).toFixed(1)},${(b.y + off).toFixed(1)}Q${b.cx.toFixed(1)},${b.cy.toFixed(1)} ${b.ex.toFixed(1)},${b.ey.toFixed(1)}`;
    const petalPath = "M0 0C-7.5-5-9.5-15.5-4-21.5L0-18.6 4-21.5C9.5-15.5 7.5-5 0 0Z";
    const flower = (f, i) => {
      const d = (.55 + f.dist / 1100 * 2.4 + (i % 7) * .04).toFixed(2);
      let petals = "";
      for (let k = 0; k < 5; k++) petals += `<path d="${petalPath}" transform="rotate(${k * 72})" fill="url(#sk-petal)" stroke="#c45276" stroke-width=".7"/>`;
      let st = "";
      for (let k = 0; k < 9; k++) { const a = k * 40 + 10, r = 7.5; const x = Math.cos(a / 57.3) * r, y = Math.sin(a / 57.3) * r; st += `<path d="M0 0L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#a52a52" stroke-width=".55"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r=".95" fill="#7c1d3a"/>`; }
      return `<g transform="translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.r.toFixed(0)}) scale(${f.s.toFixed(2)})"><g class="sakura-bloom" style="--d:${d}s">${petals}<circle r="4.2" fill="#e9799b"/>${st}<circle r="2" fill="#b3325a"/></g></g>`;
    };
    const bud = (b, i) => `<g transform="translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.r.toFixed(0)})"><g class="sakura-bud" style="--d:${(.5 + b.dist / 1100 * 2.4).toFixed(2)}s"><path d="M0 0l3-2" stroke="#3a2a28" stroke-width="1"/><ellipse cx="7" cy="-2" rx="5" ry="3.4" fill="#d9577f" stroke="#a83a5d" stroke-width=".6"/></g></g>`;
    const falling = Array.from({ length: 9 }, (_, i) => {
      const f = blooms[Math.floor(R() * blooms.length)];
      return `<path class="sakura-fall" d="M0 0c3-4 9-4 10 1s-6 7-10-1z" fill="#f2a9be" transform="translate(${f.x.toFixed(0)} ${f.y.toFixed(0)})" style="--d:${(3 + i * 1.7).toFixed(1)}s;--dur:${(7 + R() * 5).toFixed(1)}s;--drift:${(-60 - R() * 120).toFixed(0)}px"/>`;
    }).join("");
    blooms.sort((a, b) => a.y - b.y);
    host.innerHTML = `<svg viewBox="0 -90 ${W} ${H + 90}" preserveAspectRatio="xMaxYMin meet" aria-hidden="true">
      <defs><radialGradient id="sk-petal" cx="50%" cy="100%" r="105%"><stop offset="0" stop-color="#d94a76"/><stop offset=".35" stop-color="#ee87a6"/><stop offset=".8" stop-color="#f9c4d4"/><stop offset="1" stop-color="#fde3eb"/></radialGradient>
      <linearGradient id="sk-bark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b3431"/><stop offset=".5" stop-color="#211c1b"/><stop offset="1" stop-color="#4a413d"/></linearGradient></defs>
      <g class="sakura-branch" filter="url(#ink-rough)">
        ${branches.map((b) => `<path d="${seg(b)}" fill="url(#sk-bark)"/>`).join("")}
        ${branches.filter((b) => b.w > 9).map((b) => `<path d="${barkLine(b, b.w * .14)}" fill="none" stroke="#9a918a" stroke-width="${(b.w * .07).toFixed(1)}" stroke-dasharray="${(b.w * 1.4).toFixed(0)} ${(b.w * .6).toFixed(0)} ${(b.w * .5).toFixed(0)} ${(b.w * .8).toFixed(0)}" stroke-linecap="round" opacity=".45"/>`).join("")}
      </g>
      <g>${buds.map(bud).join("")}${blooms.map(flower).join("")}</g>
      <g>${falling}</g>
    </svg>`;
  }
  const sak = $("#sakura");
  if (sak) buildSakura(sak);

  /* ---------- title sizing + haiku placement ---------- */
  const heading = $(".hero-title__heading"), above = $(".hero-title__above"), haiku = $("#haiku"), clients = $("#clients");
  function layoutHero() {
    const sizer = $(".hero-title__sizer");
    const w = Math.max(...$$("span", sizer).filter((s) => s.parentElement === sizer).map((s) => s.getBoundingClientRect().width), $(".hero-title__prefix").getBoundingClientRect().width);
    if (innerWidth > 767) above.style.width = Math.round(w) + "px";
    const hr = heading.getBoundingClientRect(), cr = clients.getBoundingClientRect();
    const centre = innerWidth > 767 ? hr.left - cr.left + Math.min(w, 520) / 2 : innerWidth * .32;
    haiku.style.setProperty("--hero-text-centre", centre + "px");
    haiku.classList.add("is-placed");
  }
  document.fonts?.ready.then(layoutHero);
  addEventListener("resize", layoutHero);
  layoutHero();

  /* ---------- rotating words + petal dissolve ---------- */
  const words = [["website", "iconic"], ["app", "addictive"], ["work", "effortless"]];
  const wordEl = $("[data-word]"), accEl = $("[data-accent]"), canvas = $("#hero-petals"), titleBox = $("#hero-title");
  const ctx = canvas.getContext("2d");
  Object.assign(canvas.style, { left: "-10%", top: "-40%", width: "175%", height: "180%", inset: "auto" });
  let parts = [], raf = 0;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  function sizeCanvas() { const r = canvas.getBoundingClientRect(); canvas.width = r.width * dpr; canvas.height = r.height * dpr; }
  sizeCanvas(); addEventListener("resize", sizeCanvas);
  const colors = ["#db5b7f", "#e7799a", "#f29db6", "#c9466c", "#f6b9cb"];
  function spawn(x, y) {
    parts.push({ x, y, vx: 40 + Math.random() * 160, vy: -70 + Math.random() * 90, r: Math.random() * 6.28, vr: (Math.random() - .5) * 8, s: 3 + Math.random() * 5, life: 0, max: 1.1 + Math.random() * 1.1, c: colors[(Math.random() * colors.length) | 0] });
  }
  let last = 0;
  function loop(t) {
    const dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter((p) => (p.life += dt) < p.max);
    for (const p of parts) {
      p.vy += 55 * dt; p.vx *= .995; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max) * .95;
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.moveTo(0, -p.s); ctx.bezierCurveTo(p.s * .9, -p.s * .5, p.s * .7, p.s * .8, 0, p.s); ctx.bezierCurveTo(-p.s * .7, p.s * .8, -p.s * .9, -p.s * .5, 0, -p.s); ctx.fill();
      ctx.restore();
    }
    if (parts.length || dissolving) raf = requestAnimationFrame(loop); else { raf = 0; last = 0; }
  }
  let dissolving = false, idx = 0;
  function dissolve(done) {
    dissolving = true;
    if (!raf) raf = requestAnimationFrame(loop);
    const cr = canvas.getBoundingClientRect(), ar = accEl.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(accEl).paddingLeft) || 0;
    const ax = ar.left + pad - cr.left, aw = ar.width - pad * 2, ay = ar.top + pad - cr.top, ah = ar.height - pad * 2;
    const t0 = performance.now(), D = 950;
    (function step(now) {
      const p = Math.min(1, (now - t0) / D);
      const pc = -14 + p * 128;
      accEl.style.webkitMaskImage = accEl.style.maskImage = `linear-gradient(90deg, transparent ${pc}%, #000 ${pc + 14}%)`;
      const fx = ax + aw * Math.min(1, Math.max(0, (pc + 7) / 100));
      for (let k = 0; k < 5; k++) spawn(fx + (Math.random() - .5) * 14, ay + ah * (.15 + Math.random() * .75));
      if (p < 1) requestAnimationFrame(step); else { dissolving = false; done(); }
    })(t0);
  }
  function next() {
    idx = (idx + 1) % words.length;
    dissolve(() => {
      accEl.classList.add("is-gone");
      wordEl.textContent = words[idx][0];
      wordEl.classList.remove("is-out"); wordEl.classList.add("is-below");
      void wordEl.offsetWidth;
      wordEl.classList.remove("is-below");
      setTimeout(() => {
        accEl.textContent = words[idx][1];
        accEl.style.maskImage = accEl.style.webkitMaskImage = "";
        accEl.classList.remove("is-gone", "is-entering"); void accEl.offsetWidth; accEl.classList.add("is-entering");
      }, 350);
    });
    setTimeout(() => wordEl.classList.add("is-out"), 320);
  }
  if (!reduced) {
    let timer = setInterval(next, 4600);
    // pause when the hero is off-screen
    new IntersectionObserver(([e]) => { clearInterval(timer); if (e.isIntersecting) timer = setInterval(next, 4600); }, { root: scroller }).observe(titleBox);
  }

  /* ---------- reel: fullscreen playback with sound ---------- */
  const reel = $("#reel");
  if (reel) {
    const stage = $(".home-reel__stage", reel), video = $("video", reel), poster = $(".home-reel__poster", reel), play = $(".home-reel__play", reel), close = $(".home-reel__close", reel);
    reel.addEventListener("pointermove", (e) => {
      const r = reel.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      play.style.setProperty("--mx", Math.max(-60, Math.min(60, dx * .22)) + "px");
      play.style.setProperty("--my", Math.max(-40, Math.min(40, dy * .22)) + "px");
      reel.classList.add("is-engaged");
      reel.classList.toggle("is-hot", Math.hypot(dx, dy) < 110);
    });
    reel.addEventListener("pointerleave", () => { play.style.setProperty("--mx", "0px"); play.style.setProperty("--my", "0px"); reel.classList.remove("is-engaged", "is-hot"); });
    const exit = () => {
      video.pause();
      stage.classList.remove("is-pseudo-full");
      reel.classList.remove("is-inline");
    };
    poster.addEventListener("click", async () => {
      if (!video.src) video.src = video.dataset.src;
      reel.classList.add("is-inline");
      video.muted = false; video.volume = 1;
      try { await stage.requestFullscreen(); } catch (_) { stage.classList.add("is-pseudo-full"); }
      video.play().catch(() => {});
    });
    document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) exit(); });
    close.addEventListener("click", () => { if (document.fullscreenElement) document.exitFullscreen(); else exit(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && stage.classList.contains("is-pseudo-full")) exit(); });
    video.addEventListener("ended", () => { if (document.fullscreenElement) document.exitFullscreen(); else exit(); });
  }

  /* ---------- scroll-driven: dancer poses + poster tilt ---------- */
  const poses = $$(".client-dancer__pose");
  const posterEls = $$("[data-poster]");
  const items = posterEls.map((p) => p.closest(".services__item"));
  let ticking = false;
  function onScroll() {
    ticking = false;
    if (poses.length === 2) {
      const r = clients.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height + innerHeight)));
      const which = Math.floor(p * 6) % 2;
      poses[0].style.opacity = which ? 0 : 1; poses[1].style.opacity = which ? 1 : 0;
    }
    if (innerWidth >= 1000 && !reduced) {
      items.forEach((it, i) => {
        if (!i) return;
        const t = Math.min(1, Math.max(0, it.getBoundingClientRect().top / innerHeight));
        posterEls[i].style.transform = t > 0 ? `rotate(${(-6 * t).toFixed(2)}deg)` : "";
      });
    }
  }
  poses.forEach((p) => (p.style.transition = "opacity .5s ease"));
  scroller.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
