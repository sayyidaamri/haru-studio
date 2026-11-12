/* Haru Studio — inner page behaviour (services, cities, projects, blog, tools, contact) */
(() => {
  const { scroller, reduced } = window.Haru;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* testimonials carousel */
  $$("[data-carousel]").forEach((c) => {
    const track = $("[data-track]", c), prev = $("[data-prev]", c), next = $("[data-next]", c);
    const cards = $$(".voice-card", track);
    let i = 0;
    const perView = () => (innerWidth < 900 ? 1 : 4);
    const go = (n) => {
      const max = Math.max(0, cards.length - perView());
      i = Math.max(0, Math.min(max, n));
      const step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : 0;
      track.style.transform = `translateX(${-i * step}px)`;
      prev.disabled = i === 0; next.disabled = i === max;
    };
    prev.addEventListener("click", () => go(i - 1));
    next.addEventListener("click", () => go(i + 1));
    let sx = null;
    track.addEventListener("pointerdown", (e) => (sx = e.clientX));
    addEventListener("pointerup", (e) => { if (sx == null) return; const d = e.clientX - sx; if (Math.abs(d) > 40) go(i + (d < 0 ? 1 : -1)); sx = null; });
    addEventListener("resize", () => go(i));
    go(0);
  });

  /* before / after slider */
  $$("[data-compare]").forEach((f) => {
    const h = $(".compare__handle", f);
    const set = (p) => { p = Math.max(0, Math.min(100, p)); f.style.setProperty("--pos", p + "%"); h.setAttribute("aria-valuenow", Math.round(p)); };
    let drag = false;
    const from = (e) => { const r = f.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
    f.addEventListener("pointerdown", (e) => { drag = true; f.setPointerCapture(e.pointerId); from(e); });
    f.addEventListener("pointermove", (e) => drag && from(e));
    f.addEventListener("pointerup", () => (drag = false));
    h.addEventListener("keydown", (e) => {
      const v = +h.getAttribute("aria-valuenow");
      if (e.key === "ArrowLeft") { set(v - 5); e.preventDefault(); }
      if (e.key === "ArrowRight") { set(v + 5); e.preventDefault(); }
    });
    // gentle hint when it scrolls into view
    if (!reduced) new IntersectionObserver(([en], o) => {
      if (!en.isIntersecting) return; o.disconnect();
      const t0 = performance.now();
      (function a(t) { const k = (t - t0) / 1600; if (k > 1) return set(50); set(50 + Math.sin(k * Math.PI * 2) * 16 * (1 - k)); requestAnimationFrame(a); })(t0);
    }, { root: scroller, threshold: .6 }).observe(f);
  });

  /* contact forms: validation + success state (never sent anywhere) */
  $$("[data-contact-form]").forEach((form) => {
    const ta = $("textarea", form), count = $("[data-count]", form);
    ta?.addEventListener("input", () => (count.textContent = `${ta.value.length} / ${ta.maxLength}`));
    $$(".p-field__control", form).forEach((el) => el.addEventListener("input", () => {
      const f = el.closest(".p-field");
      f.classList.toggle("is-valid", el.checkValidity() && el.value.trim() !== "");
      if (el.checkValidity()) { f.classList.remove("is-error"); f.querySelector(".p-field__error")?.remove(); }
    }));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let first = null;
      $$(".p-field__control", form).forEach((el) => {
        const f = el.closest(".p-field");
        f.querySelector(".p-field__error")?.remove();
        if (!el.checkValidity()) {
          f.classList.add("is-error");
          f.insertAdjacentHTML("beforeend", `<span class="p-field__error">${el.validity.typeMismatch ? "Please enter a valid email." : "This field is required."}</span>`);
          first ??= el;
        }
      });
      if (first) { first.focus(); return; }
      const btn = $('button[type="submit"]', form);
      btn.classList.add("is-busy"); btn.disabled = true;
      setTimeout(() => {
        $("[data-form-fields]", form).hidden = true;
        $("[data-form-done]", form).hidden = false;
        btn.classList.remove("is-busy"); btn.disabled = false;
      }, 900);
    });
    $("[data-form-reset]", form)?.addEventListener("click", () => {
      form.reset(); $$(".p-field", form).forEach((f) => f.classList.remove("is-valid", "is-error"));
      if (count) count.textContent = `0 / ${ta.maxLength}`;
      $("[data-form-fields]", form).hidden = false; $("[data-form-done]", form).hidden = true;
    });
  });

  /* horizontal pinned gallery (project pages) */
  $$("[data-hscroll]").forEach((sec) => {
    const track = $("[data-hscroll-track]", sec);
    const fit = () => {
      if (innerWidth < 900) { sec.style.height = ""; track.style.transform = ""; return; }
      const extra = track.scrollWidth - innerWidth;
      sec.style.height = `${innerHeight + Math.max(0, extra)}px`;
    };
    const upd = () => {
      if (innerWidth < 900) return;
      const r = sec.getBoundingClientRect();
      const max = track.scrollWidth - innerWidth;
      const p = Math.min(1, Math.max(0, -r.top / (sec.offsetHeight - innerHeight || 1)));
      track.style.transform = `translate3d(${-p * max}px,0,0)`;
    };
    addEventListener("resize", () => { fit(); upd(); });
    window.addEventListener("load", () => { fit(); upd(); });
    scroller.addEventListener("scroll", upd, { passive: true });
    fit(); upd();
  });

  /* copy buttons (blog code, tools) */
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    const target = document.getElementById(b.dataset.copy) || b.closest(".code-block")?.querySelector("code");
    const text = target?.value ?? target?.textContent ?? "";
    try { await navigator.clipboard.writeText(text); } catch (_) { const t = document.createElement("textarea"); t.value = text; document.body.append(t); t.select(); document.execCommand("copy"); t.remove(); }
    const o = b.textContent; b.textContent = "Copied"; setTimeout(() => (b.textContent = o), 1400);
  });

  /* share buttons on articles */
  $$("[data-share]").forEach((b) => b.addEventListener("click", async () => {
    const url = location.href;
    if (b.dataset.share === "copy") { try { await navigator.clipboard.writeText(url); window.Haru.toast("Link copied"); } catch (_) {} return; }
    const map = { x: `https://x.com/intent/post?url=${encodeURIComponent(url)}`, li: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, fb: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` };
    open(map[b.dataset.share], "_blank", "noopener");
  }));
  $$("[data-react]").forEach((b) => b.addEventListener("click", () => { b.classList.toggle("is-on"); const n = $("span", b); n.textContent = +n.textContent + (b.classList.contains("is-on") ? 1 : -1); }));
})();
