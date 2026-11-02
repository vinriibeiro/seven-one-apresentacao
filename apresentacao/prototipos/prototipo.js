/* Controles do protótipo (não fazem parte do produto): recolher a barra de navegação entre as telas.
   A escolha fica guardada neste navegador. */
(() => {
  // ?recolhido abre com o menu lateral recolhido; ?gaveta abre o menu do celular na direção B (para conferir esses estados nas capturas)
  for (const c of ["recolhido", "gaveta"]) if (new RegExp(`(^|[?&])${c}\\b`).test(location.search)) document.body.classList.add(c);
  // ?depurar: lista os elementos que passam da largura da tela (para achar rolagem lateral)
  if (/(^|[?&])depurar\b/.test(location.search)) setTimeout(() => {
    const W = document.documentElement.clientWidth, achados = [];
    document.querySelectorAll("body *").forEach((e) => { const r = e.getBoundingClientRect(); if (r.right > W + 1 && r.width > 0 && getComputedStyle(e).position !== "fixed") achados.push(`${e.tagName.toLowerCase()}.${[...e.classList].join(".")} → ${Math.round(r.right)}px (w ${Math.round(r.width)})`); });
    const d = document.createElement("pre"); d.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:999;background:#ff0;color:#000;font:11px monospace;white-space:pre-wrap;max-height:100vh;overflow:auto;margin:0;padding:6px";
    d.textContent = `largura ${W}px · página ${document.documentElement.scrollWidth}px\n` + achados.slice(0, 40).join("\n"); document.body.appendChild(d);
  }, 600);
  const barra = document.querySelector(".prev");
  if (!barra) return;
  // ?captura esconde a barra do protótipo (capturas de tela limpas para apresentar)
  if (/(^|[?&])captura\b/.test(location.search)) { barra.style.display = "none"; return; }
  const st = document.createElement("style");
  st.textContent = ".prev.min>:not(b):not(.prev-min){display:none!important}.prev .prev-min{border:0;background:#262a31;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font:600 14px system-ui,sans-serif;display:inline-flex;align-items:center;justify-content:center;margin-left:4px;flex:none}";
  document.head.appendChild(st);
  const bt = document.createElement("button");
  bt.className = "prev-min";
  const pinta = () => { const m = barra.classList.contains("min"); bt.textContent = m ? "+" : "–"; bt.title = m ? "Mostrar os controles do protótipo" : "Recolher os controles do protótipo"; bt.setAttribute("aria-label", bt.title); };
  bt.addEventListener("click", (ev) => { ev.stopPropagation(); barra.classList.toggle("min"); pinta(); try { localStorage.setItem("seven_prev_min", barra.classList.contains("min") ? "1" : ""); } catch {} });
  barra.appendChild(bt);
  try { if (localStorage.getItem("seven_prev_min") === "1") barra.classList.add("min"); } catch {}
  pinta();
})();
