/* Haru Studio — free tools (both run fully in the browser) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const usd = (n) => "USD " + n.toLocaleString("en-US");

  /* ---------- website cost calculator ---------- */
  const calc = $("[data-calc]");
  if (calc) {
    const price = $("[data-price]"), list = $("[data-lines]"), warn = $("[data-ai-warn]"), swLabel = $("[data-switch-label]");
    const items = () => {
      const f = calc.elements, out = [["Design & development (1–5 pages)", 1500]];
      if (f.ecommerce.checked) out.push(["Online store & checkout", 2500]);
      const pg = +f.pages.value; if (pg) out.push([`Extra pages (${f.pages.selectedOptions[0].text})`, pg]);
      if (f.integrations.checked) out.push(["External integrations", 1200]);
      if (f.database.checked) out.push(["Database & accounts", 2000]);
      if (f.languages.checked) out.push(["Multilingual setup", 800]);
      return out;
    };
    let shown = 1500;
    const render = () => {
      swLabel.textContent = calc.elements.ecommerce.checked ? "Yes" : "No";
      const ai = calc.elements.ai.checked;
      warn.hidden = !ai;
      const its = items(), total = its.reduce((a, [, v]) => a + v, 0);
      list.innerHTML = ai ? "" : its.map(([k, v]) => `<li><span>${k}</span><b>${usd(v)}</b></li>`).join("");
      const target = ai ? 0 : total, from = shown, t0 = performance.now();
      (function tick(t) { const k = Math.min(1, (t - t0) / 500); shown = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3))); price.textContent = ai ? "USD ¯\\_(ツ)_/¯" : usd(shown); if (k < 1 && !ai) requestAnimationFrame(tick); })(t0);
    };
    calc.addEventListener("change", render);
    render();
    $("[data-print]")?.addEventListener("click", () => {
      const its = items(), total = its.reduce((a, [, v]) => a + v, 0);
      const w = open("", "_blank");
      if (!w) return window.Haru.toast("Allow pop-ups to download the PDF");
      w.document.write(`<!doctype html><title>Haru Studio — website budget</title><style>body{font:15px/1.6 Poppins,Arial,sans-serif;max-width:640px;margin:48px auto;color:#202020}h1{font-size:30px;letter-spacing:-.04em}td{padding:10px 0;border-bottom:1px solid #ddd}td:last-child{text-align:right}tfoot td{font-weight:700;font-size:18px;border:0}small{color:#666}</style><h1>Website budget estimate</h1><p>Prepared with the Haru Studio cost calculator on ${new Date().toLocaleDateString("en-GB")}.</p><table width="100%">${its.map(([k, v]) => `<tr><td>${k}</td><td>${usd(v)}</td></tr>`).join("")}<tfoot><tr><td>Estimated total</td><td>${usd(total)}</td></tr></tfoot></table><p><small>Indicative only. Final quote depends on scope and complexity. hello@haru.studio</small></p><script>onload=()=>print()<\/script>`);
      w.document.close();
    });
  }

  /* ---------- critical CSS extractor ---------- */
  const form = $("[data-critical]");
  if (form) {
    const out = $("#crit-output"), stats = $("[data-crit-stats]");
    $("[data-sample]").addEventListener("click", () => {
      form.elements.html.value = `<header class="nav"><a class="logo">Lotus</a><nav><a>Menu</a><a>Book</a></nav></header>\n<section class="hero"><h1>Slow food,<br>fast site.</h1><p>Seasonal plates in Ubud.</p><a class="btn">Reserve</a></section>\n<section class="menu" style="margin-top:900px"><h2>Menu</h2><div class="card">Nasi campur</div></section>\n<footer class="foot">© Lotus</footer>`;
      form.elements.css.value = `@font-face{font-family:Lotus;src:url(lotus.woff2)}\n*{box-sizing:border-box}\nbody{margin:0;font-family:Lotus,sans-serif}\n.nav{display:flex;justify-content:space-between;height:72px;padding:0 24px}\n.nav a:hover{text-decoration:underline}\n.hero{display:grid;place-items:center;min-height:70vh;background:#f6efe6}\n.hero h1{font-size:64px;animation:rise .6s both}\n@keyframes rise{from{opacity:0}to{opacity:1}}\n.btn{background:#c2410c;color:#fff;padding:12px 20px}\n.menu{padding:80px 24px}\n.card{border:1px solid #ddd;padding:16px}\n.foot{padding:40px;color:#666}\n@media (max-width:600px){.hero h1{font-size:40px}}`;
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const { html, css, w, h, fonts } = form.elements;
      let bad = false;
      [html, css].forEach((el) => { const f = el.closest(".p-field"); f.classList.toggle("is-error", !el.value.trim()); if (!el.value.trim()) bad = true; });
      if (bad) { stats.textContent = "Paste both HTML and CSS first"; return; }
      const btn = form.querySelector('[type="submit"]'); btn.classList.add("is-busy");
      const W = +w.value || 1440, H = +h.value || 900;
      const frame = document.createElement("iframe");
      Object.assign(frame.style, { position: "fixed", left: "-99999px", top: "0", width: W + "px", height: H + "px", border: "0", visibility: "hidden" });
      frame.srcdoc = `<!doctype html><html><head><style>${css.value.replace(/<\/style/gi, "")}</style></head><body>${html.value.replace(/<script[\s\S]*?<\/script>/gi, "")}</body></html>`;
      frame.onload = () => {
        try {
          const doc = frame.contentDocument, win = frame.contentWindow;
          const visible = (el) => { const r = el.getBoundingClientRect(); return r.top < H && r.bottom > 0 && r.width >= 0; };
          const always = /^(\*|html|body|:root)(\s|,|$)/;
          const keptAnims = new Set(); let total = 0, kept = 0;
          const strip = (sel) => sel.replace(/::?(before|after|placeholder|selection|marker|-webkit-[\w-]+)/g, "").replace(/:(hover|focus|focus-visible|focus-within|active|visited|checked|disabled)/g, "").trim() || "*";
          const walk = (rules) => {
            const res = [];
            for (const r of rules) {
              if (r instanceof win.CSSStyleRule) {
                total++;
                const parts = r.selectorText.split(",").filter((s) => { if (always.test(s.trim())) return true; try { return [...doc.querySelectorAll(strip(s))].some(visible); } catch (_) { return false; } });
                if (parts.length) { kept++; res.push(r.cssText.replace(r.selectorText, parts.join(",").trim())); const m = r.style.animationName || r.style.animation; if (m) m.split(/[\s,]+/).forEach((n) => keptAnims.add(n)); }
              } else if (r instanceof win.CSSMediaRule) {
                if (win.matchMedia(r.conditionText || r.media.mediaText).matches) { const inner = walk(r.cssRules); if (inner.length) res.push(`@media ${r.conditionText || r.media.mediaText}{${inner.join("")}}`); }
              } else if (r instanceof win.CSSFontFaceRule) { if (fonts.checked) res.push(r.cssText); }
              else if (r instanceof win.CSSKeyframesRule) res.push({ kf: r });
              else res.push(r.cssText);
            }
            return res;
          };
          const all = walk(doc.styleSheets[0]?.cssRules || []);
          const final = all.map((x) => (typeof x === "object" ? (keptAnims.has(x.kf.name) ? x.kf.cssText : "") : x)).filter(Boolean);
          const text = final.join("\n");
          out.textContent = text || "/* No rules matched the first screen. */";
          stats.textContent = `${kept} of ${total} rules · ${(new Blob([text]).size / 1024).toFixed(1)} KB · ${W}×${H}`;
        } catch (err) { out.textContent = "/* Could not analyse this page: " + err.message + " */"; }
        frame.remove(); btn.classList.remove("is-busy");
      };
      document.body.append(frame);
    });
  }
})();
