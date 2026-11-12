/* Haru Studio — shared behaviour for every page */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const scroller = $("#scroller");
  const header = $("#header");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = html.classList.contains("is-touch");
  window.Haru = { scroller, reduced, isTouch };

  /* ---------- header ready + scrolled state ---------- */
  const readyDelay = document.body.classList.contains("page-home") ? 1500 : 250;
  setTimeout(() => header.classList.add("header--ready"), reduced ? 0 : readyDelay);
  const hideZones = $$("[data-hide-nav]");
  const onScrollHeader = () => {
    const y = scroller.scrollTop;
    header.classList.toggle("header--scrolled", y > 10);
    let hide = false;
    for (const z of hideZones) {
      const r = z.getBoundingClientRect();
      if (r.top <= 2 && r.bottom > innerHeight * .6) hide = true;
    }
    header.classList.toggle("header--nav-hidden", hide && !header.classList.contains("is-menu-open"));
  };
  scroller.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- scroll indicator ---------- */
  const bar = $("#scrollbar"), thumb = $("#scrollbar > div");
  let barTimer;
  scroller.addEventListener("scroll", () => {
    const max = scroller.scrollHeight - scroller.clientHeight;
    const p = max > 0 ? scroller.scrollTop / max : 0;
    thumb.style.transform = `translateY(${p * 400}%)`;
    bar.style.opacity = 1;
    clearTimeout(barTimer);
    barTimer = setTimeout(() => (bar.style.opacity = 0), 1200);
  }, { passive: true });

  /* ---------- custom cursor ---------- */
  const cursor = $("#cursor");
  if (!isTouch && cursor) {
    const label = cursor.querySelector("span");
    let x = -100, y = -100, cx = -100, cy = -100, size = 60;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    const tick = () => {
      cx += (x - cx) * .22; cy += (y - cy) * .22;
      cursor.style.transform = `translate(${cx + size / 2 + 8}px, ${cy - size / 2 + 8}px)`;
      requestAnimationFrame(tick);
    };
    tick();
    const target = (el) => el.closest("[data-cursor], a[href], .faq-q");
    document.addEventListener("mouseover", (e) => {
      const t = target(e.target);
      if (!t) return;
      const text = t.hasAttribute("data-cursor") ? t.getAttribute("data-cursor") : "Visit";
      if (!text) { setCursor(false); return; }
      setCursor(true, text, t.closest(".home-reel, [data-cursor-light]"));
    });
    document.addEventListener("mouseout", (e) => {
      const t = target(e.target);
      if (t && !t.contains(e.relatedTarget)) setCursor(false);
    });
    function setCursor(on, text = "", light = false) {
      cursor.classList.toggle("is-hovering", on);
      cursor.classList.toggle("is-light", !!light);
      label.textContent = on ? text : "";
      size = on ? 90 : 60;
      cursor.style.width = cursor.style.height = size + "px";
    }
    document.addEventListener("mouseleave", () => setCursor(false));
  }

  /* ---------- desktop services dropdown ---------- */
  const dd = $("#nav-dropdown"), ddItem = $("[data-dropdown]");
  if (dd && ddItem) {
    const btn = ddItem.querySelector("button");
    let closeTimer;
    const open = () => {
      clearTimeout(closeTimer);
      dd.classList.add("is-open"); dd.inert = false; ddItem.classList.add("is-open"); btn.setAttribute("aria-expanded", "true");
      $$("img", dd).forEach((im) => { if (im.complete) im.classList.add("is-loaded"); else im.onload = () => im.classList.add("is-loaded"); });
    };
    const close = () => { dd.classList.remove("is-open"); dd.inert = true; ddItem.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); };
    const later = () => { clearTimeout(closeTimer); closeTimer = setTimeout(close, 180); };
    ddItem.addEventListener("mouseenter", open);
    ddItem.addEventListener("mouseleave", later);
    dd.addEventListener("mouseenter", () => clearTimeout(closeTimer));
    dd.addEventListener("mouseleave", later);
    btn.addEventListener("click", () => (dd.classList.contains("is-open") ? close() : open()));
    addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    $$(".header__menu > li:not([data-dropdown])").forEach((li) => li.addEventListener("mouseenter", later));
  }

  /* ---------- mobile menu ---------- */
  const toggle = $(".menu-toggle"), mobile = $("#nav-mobile");
  if (toggle && mobile) {
    toggle.addEventListener("click", () => {
      const open = !mobile.classList.contains("is-open");
      mobile.classList.toggle("is-open", open);
      mobile.inert = !open;
      header.classList.toggle("menu-open", open);
      header.classList.toggle("is-menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (open) header.classList.remove("header--nav-hidden");
    });
    const sBtn = $("[data-mobile-services]");
    sBtn?.addEventListener("click", () => {
      const li = sBtn.closest(".nav-mobile__item");
      const ex = !li.classList.contains("is-expanded");
      li.classList.toggle("is-expanded", ex);
      sBtn.setAttribute("aria-expanded", String(ex));
    });
  }

  /* ---------- language (only English is published) ---------- */
  const toast = $(".toast");
  let toastTimer;
  window.Haru.toast = (msg) => {
    toast.textContent = msg; toast.classList.add("is-visible");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  };
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => window.Haru.toast("Versi Bahasa Indonesia segera hadir.")));

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); } });
  }, { root: scroller, rootMargin: "0px 0px -12% 0px", threshold: 0.01 });
  $$("[data-reveal], [data-reveal-item]").forEach((el) => io.observe(el));
  window.Haru.observe = (el) => io.observe(el);

  /* ---------- FAQ accordion with hanging ribbon ---------- */
  const ribbonSVG = `<svg class="faq-ribbon" viewBox="0 0 72 204" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round"><path d="M36 37.8c-6-10-14-12-18-6s4 10 18 6c14 4 22-1 18-6s-12-4-18 6" stroke-width="3.2"/><path d="M36 38c-3 14-9 22-15 30M36 38c3 14 9 22 15 30" stroke-width="2.6"/></g><path d="M31 37h10l-1 50h-8z" fill="currentColor"/><circle cx="36" cy="39" r="5.2" fill="currentColor"/><path d="M33 86h6l3 6H30z" fill="#7a1b20"/><path d="M29 92h14l4 96c-6 6-16 6-22 0z" fill="currentColor"/><g stroke="#7a1b20" stroke-width=".8" opacity=".55">${Array.from({ length: 7 }, (_, i) => `<path d="M${31 + i * 2} 96v${86 + (i % 3) * 3}"/>`).join("")}</g><path d="M28 112h16" stroke="#e8b24c" stroke-width="2.4"/></svg>`;
  $$("[data-faq]").forEach((list) => {
    const items = $$(".faq-item", list);
    const setH = () => items.forEach((it) => it.style.setProperty("--faq-q-h", it.querySelector(".faq-q").offsetHeight + "px"));
    setH(); addEventListener("resize", setH); document.fonts?.ready.then(setH);
    let ribbon = null;
    const hang = (item) => {
      if (!ribbon) { list.insertAdjacentHTML("beforeend", ribbonSVG); ribbon = list.lastElementChild; }
      item.appendChild(ribbon);
      kick(8);
    };
    /* pendulum physics: the ribbon swings when an item opens AND when the page scrolls past it */
    let angle = 0, vel = 0, running = false, lastY = scroller.scrollTop;
    const step = () => {
      vel += -angle * 0.018;   // spring back to rest
      vel *= 0.955;            // air damping
      angle += vel;
      angle = Math.max(-14, Math.min(14, angle));
      if (ribbon) ribbon.style.setProperty("--sway", angle.toFixed(2) + "deg");
      if (Math.abs(angle) > 0.02 || Math.abs(vel) > 0.02) requestAnimationFrame(step);
      else { angle = vel = 0; running = false; if (ribbon) ribbon.style.setProperty("--sway", "0deg"); }
    };
    function kick(v) {
      if (reduced || !ribbon) return;
      vel += v * 0.18;
      if (!running) { running = true; requestAnimationFrame(step); }
    }
    scroller.addEventListener("scroll", () => {
      const y = scroller.scrollTop, dy = y - lastY; lastY = y;
      if (!ribbon) return;
      const r = ribbon.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) return; // only while it is on screen
      kick(Math.max(-6, Math.min(6, dy * 0.06)));
    }, { passive: true });
    items.forEach((item) => {
      const q = item.querySelector(".faq-q");
      q.addEventListener("click", () => {
        const open = !item.classList.contains("is-open");
        items.forEach((o) => { o.classList.remove("is-open"); o.querySelector(".faq-q").setAttribute("aria-expanded", "false"); });
        if (open) { item.classList.add("is-open"); q.setAttribute("aria-expanded", "true"); hang(item); }
      });
    });
    const first = items.find((i) => i.classList.contains("is-open"));
    if (first) hang(first);
  });

  /* ---------- page transitions between real pages ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || a.target === "_blank" || /^(mailto|tel|https?):/i.test(href) || a.hasAttribute("download")) return;
    if (a.getAttribute("aria-current") === "page") { e.preventDefault(); return; }
    e.preventDefault();
    if (reduced) { location.href = a.href; return; }
    html.classList.add("is-leaving");
    try { sessionStorage.setItem("haru-nav", "1"); } catch (_) {}
    setTimeout(() => (location.href = a.href), 720);
  });
  addEventListener("pageshow", (e) => { if (e.persisted) html.classList.remove("is-leaving"); });
  setTimeout(() => html.classList.remove("is-entering"), 1100);

  /* in-page anchors scroll the inner scroller */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    scroller.scrollTo({ top: scroller.scrollTop + t.getBoundingClientRect().top - 90, behavior: reduced ? "auto" : "smooth" });
  });

  /* ---------- booking modal (15-min fit call) ---------- */
  const modal = $("#booking");
  if (modal) {
    const days = $("[data-days]", modal), slots = $("[data-slots]", modal), sum = $("[data-summary]", modal), confirm = $("[data-confirm]", modal), email = $("[data-booking-email]", modal);
    const state = { day: null, slot: null };
    const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
    const list = [];
    for (let d = new Date(), n = 0; list.length < 5 && n < 14; n++) {
      d = new Date(Date.now() + (n + 1) * 864e5);
      if (d.getDay() !== 0 && d.getDay() !== 6) list.push(d);
    }
    days.innerHTML = list.map((d, i) => `<button type="button" class="booking__day" data-i="${i}" data-cursor=""><small>${fmt.format(d)}</small><b>${d.getDate()}</b></button>`).join("");
    const times = ["09:00", "09:30", "10:30", "13:00", "14:30", "16:00"];
    slots.innerHTML = times.map((t) => `<button type="button" class="booking__slot" data-cursor="">${t}</button>`).join("");
    const update = () => {
      const ok = state.day != null && state.slot && /\S+@\S+\.\S+/.test(email.value);
      confirm.disabled = !ok;
      sum.textContent = state.day != null && state.slot ? `${list[state.day].toDateString()} · ${state.slot} (GMT+8)` : "Choose a day and a time.";
    };
    days.addEventListener("click", (e) => { const b = e.target.closest(".booking__day"); if (!b) return; $$(".booking__day", days).forEach((x) => x.classList.remove("is-active")); b.classList.add("is-active"); state.day = +b.dataset.i; update(); });
    slots.addEventListener("click", (e) => { const b = e.target.closest(".booking__slot"); if (!b) return; $$(".booking__slot", slots).forEach((x) => x.classList.remove("is-active")); b.classList.add("is-active"); state.slot = b.textContent; update(); });
    email.addEventListener("input", update);
    confirm.addEventListener("click", () => {
      confirm.classList.add("is-busy");
      setTimeout(() => {
        $('[data-step="pick"]', modal).hidden = true;
        $('[data-step="done"]', modal).hidden = false;
        $("[data-done-text]", modal).textContent = `We'll see you on ${list[state.day].toDateString()} at ${state.slot}. A calendar invite is on its way to ${email.value}. (Demo: nothing is sent.)`;
      }, 700);
    });
    let lastFocus;
    const openM = () => { lastFocus = document.activeElement; modal.classList.add("is-open"); modal.inert = false; setTimeout(() => $(".booking__day", modal)?.focus(), 50); };
    const closeM = () => {
      modal.classList.remove("is-open"); modal.inert = true; lastFocus?.focus?.();
      setTimeout(() => { $('[data-step="pick"]', modal).hidden = false; $('[data-step="done"]', modal).hidden = true; confirm.classList.remove("is-busy"); }, 400);
    };
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-book]")) { e.preventDefault(); openM(); }
      if (e.target.closest("[data-close]") && modal.contains(e.target)) closeM();
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) closeM(); });
  }
})();
