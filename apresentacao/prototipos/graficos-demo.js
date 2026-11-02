/* Gráficos dos protótipos (compartilhados pelas duas direções; a aparência vem das variáveis CSS de cada uma).
   Regras seguidas: um eixo só; realizado, projeção e meta com codificações diferentes (linha cheia, tracejada, régua);
   valores sempre visíveis em texto (a dica ao passar o mouse só complementa); dias sem expediente não viram "falta de dado". */
window.GRAF = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const nf = new Intl.NumberFormat("pt-BR");
  const el = (tag, at = {}, pai) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (pai) pai.appendChild(e); return e; };
  const txt = (pai, x, y, s, cls, anchor = "start") => { const t = el("text", { x, y, class: cls, "text-anchor": anchor }, pai); t.textContent = s; return t; };
  const passoBonito = (max, n = 4) => { const bruto = max / n, p = 10 ** Math.floor(Math.log10(bruto)); const m = [1, 2, 2.5, 3, 5, 10].find((k) => k * p >= bruto); return m * p; };
  const SEM = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

  /* Dica única (tooltip) reaproveitada por todos os gráficos da página. Usa textContent: rótulos nunca viram HTML. */
  let dica;
  function mostrarDica(x, y, titulo, linhas) {
    if (!dica) { dica = document.createElement("div"); dica.className = "g-dica"; dica.setAttribute("role", "status"); document.body.appendChild(dica); }
    dica.replaceChildren();
    const h = document.createElement("div"); h.className = "g-dica-t"; h.textContent = titulo; dica.appendChild(h);
    for (const [cor, rot, val, tipo] of linhas) {
      const r = document.createElement("div"); r.className = "g-dica-l";
      const k = document.createElement("i"); k.className = "g-chave " + (tipo || ""); k.style.setProperty("--k", cor); r.appendChild(k);
      const v = document.createElement("b"); v.textContent = val; r.appendChild(v);
      const s = document.createElement("span"); s.textContent = rot; r.appendChild(s);
      dica.appendChild(r);
    }
    dica.style.display = "block";
    const w = dica.offsetWidth, hh = dica.offsetHeight;
    dica.style.left = Math.min(innerWidth - w - 12, x + 14) + "px";
    dica.style.top = Math.max(8, y - hh - 12) + "px";
  }
  const esconderDica = () => { if (dica) dica.style.display = "none"; };

  /* Linha acumulada do mês: realizado (cheia) até hoje, projeção (tracejada) até o fim do mês, meta (régua). */
  function acumulado(alvo, { dias, meta, hoje = 24, altura = 260, rotuloReal = "BL vendida acumulada", rotuloProj = "Projeção pelo ritmo atual" }) {
    const W = 760, H = altura, m = { t: 18, r: 92, b: 34, l: 46 };
    const maxY = Math.max(meta, ...dias.map((d) => d.proj || d.acum || 0)) * 1.06;
    const passo = passoBonito(maxY), topo = Math.ceil(maxY / passo) * passo;
    const x = (d) => m.l + ((d - 1) / (dias.length - 1)) * (W - m.l - m.r);
    const y = (v) => H - m.b - (v / topo) * (H - m.t - m.b);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "g-svg", role: "img", "aria-label": `${rotuloReal}: ${nf.format(dias.find((d) => d.d === hoje).acum)} até o dia ${hoje}; projeção ${nf.format(dias.at(-1).proj)}; meta ${nf.format(meta)}.` });
    for (let v = 0; v <= topo; v += passo) {
      el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: v === 0 ? "g-base" : "g-grade" }, svg);
      txt(svg, m.l - 8, y(v) + 4, nf.format(v), "g-tick", "end");
    }
    for (const d of dias) if ([1, 5, 10, 15, 20, 25, dias.length].includes(d.d)) txt(svg, x(d.d), H - m.b + 18, String(d.d).padStart(2, "0"), "g-tick", "middle");
    // meta: régua horizontal com rótulo acima, no início (não disputa espaço com o rótulo da projeção, à direita)
    el("line", { x1: m.l, x2: W - m.r, y1: y(meta), y2: y(meta), class: "g-meta" }, svg);
    txt(svg, m.l + 6, y(meta) - 7, `Meta do mês: ${nf.format(meta)}`, "g-rot-meta");
    // hoje: marca vertical discreta
    el("line", { x1: x(hoje), x2: x(hoje), y1: m.t, y2: H - m.b, class: "g-hoje" }, svg);
    txt(svg, x(hoje), m.t - 6, "hoje", "g-tick", "middle");
    // realizado
    const real = dias.filter((d) => d.acum != null);
    el("path", { d: real.map((d, i) => `${i ? "L" : "M"}${x(d.d)},${y(d.acum)}`).join(""), class: "g-real" }, svg);
    el("path", { d: `M${x(1)},${y(0)}` + real.map((d) => `L${x(d.d)},${y(d.acum)}`).join("") + `L${x(hoje)},${y(0)}Z`, class: "g-real-area" }, svg);
    // projeção
    const pj = dias.filter((d) => d.proj != null);
    el("path", { d: pj.map((d, i) => `${i ? "L" : "M"}${x(d.d)},${y(d.proj)}`).join(""), class: "g-proj" }, svg);
    const ult = real.at(-1), fim = pj.at(-1);
    el("circle", { cx: x(ult.d), cy: y(ult.acum), r: 4.5, class: "g-pt-real" }, svg);
    el("circle", { cx: x(fim.d), cy: y(fim.proj), r: 4.5, class: "g-pt-proj" }, svg);
    txt(svg, W - m.r + 8, y(fim.proj) + 4, nf.format(fim.proj), "g-rot-fim");
    txt(svg, W - m.r + 8, y(fim.proj) + 19, "projeção", "g-tick");
    txt(svg, x(ult.d) - 8, y(ult.acum) - 10, `${nf.format(ult.acum)} até hoje`, "g-rot-fim", "end");
    // camada de leitura: cruz que encaixa no dia mais próximo (mouse e teclado)
    const cruz = el("line", { y1: m.t, y2: H - m.b, class: "g-cruz", visibility: "hidden" }, svg);
    const capa = el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: "transparent", tabindex: 0, class: "g-capa", "aria-label": "Use as setas para ler dia a dia" }, svg);
    let foco = hoje;
    const ler = (d, cx, cy) => {
      const dia = dias.find((k) => k.d === d); if (!dia) return;
      cruz.setAttribute("x1", x(d)); cruz.setAttribute("x2", x(d)); cruz.setAttribute("visibility", "visible");
      const dow = SEM[new Date(Date.UTC(2026, 9, d)).getUTCDay()];
      const tit = `${dow}, ${String(d).padStart(2, "0")}/10${dia.folga ? " · " + dia.folga + " (sem expediente)" : dia.parcial ? " · parcial até 14:20" : ""}`;
      const linhas = [];
      if (dia.acum != null) { linhas.push(["var(--g-real)", "acumulado no mês", nf.format(dia.acum)]); if (!dia.folga) linhas.push(["var(--g-real)", "vendidas no dia", nf.format(dia.bl), "fina"]); }
      if (dia.proj != null && d > hoje) linhas.push(["var(--g-proj)", "projeção pelo ritmo atual", nf.format(dia.proj), "tracejada"]);
      linhas.push(["var(--g-meta)", "meta do mês", nf.format(meta), "regua"]);
      mostrarDica(cx, cy, tit, linhas);
    };
    const pelaPosicao = (ev) => { const r = svg.getBoundingClientRect(), px = ((ev.clientX - r.left) / r.width) * W; return Math.max(1, Math.min(dias.length, Math.round(((px - m.l) / (W - m.l - m.r)) * (dias.length - 1)) + 1)); };
    capa.addEventListener("pointermove", (ev) => { foco = pelaPosicao(ev); ler(foco, ev.clientX, ev.clientY); });
    capa.addEventListener("pointerleave", () => { cruz.setAttribute("visibility", "hidden"); esconderDica(); });
    capa.addEventListener("focus", () => { const r = svg.getBoundingClientRect(); ler(foco, r.left + (x(foco) / W) * r.width, r.top + 20); });
    capa.addEventListener("blur", () => { cruz.setAttribute("visibility", "hidden"); esconderDica(); });
    capa.addEventListener("keydown", (ev) => {
      if (!["ArrowLeft", "ArrowRight"].includes(ev.key)) return; ev.preventDefault();
      foco = Math.max(1, Math.min(dias.length, foco + (ev.key === "ArrowRight" ? 1 : -1)));
      const r = svg.getBoundingClientRect(); ler(foco, r.left + (x(foco) / W) * r.width, r.top + 20);
    });
    alvo.replaceChildren(svg);
  }

  /* Barra de equipe (bullet): realizado cheio, projeção mais clara até onde o ritmo leva, meta como traço vertical.
     Todas as linhas usam a mesma escala (o máximo entre metas e projeções), para comparar de verdade. */
  function escalaComum(itens) { return Math.max(...itens.map((e) => Math.max(e.meta, e.proj))) * 1.04; }
  function barraMeta(e, max, { compacta = false } = {}) {
    const p = (v) => ((v / max) * 100).toFixed(2) + "%";
    const st = { ok: "No ritmo da meta", atencao: "Atenção", abaixo: "Abaixo do ritmo" }[e.status];
    return `<div class="g-bullet${compacta ? " compacta" : ""}" tabindex="0" role="img"
      aria-label="${e.nome}: ${nf.format(e.bl)} BL vendidas, projeção ${nf.format(e.proj)}, meta ${nf.format(e.meta)} (${st})"
      data-dica='${JSON.stringify({ t: e.nome, real: e.bl, proj: e.proj, meta: e.meta })}'>
      <span class="g-b-proj" style="width:${p(Math.max(e.proj, e.bl))}"></span>
      <span class="g-b-real" style="width:${p(e.bl)}"></span>
      <span class="g-b-meta" style="left:${p(e.meta)}"></span>
    </div>`;
  }
  /* liga a dica (mouse e teclado) a todas as barras de meta de um contêiner */
  function ligarBullets(raiz) {
    raiz.querySelectorAll(".g-bullet").forEach((b) => {
      const d = JSON.parse(b.dataset.dica);
      const linhas = [["var(--g-real)", "BL vendida até hoje", nf.format(d.real)], ["var(--g-proj)", "projeção pelo ritmo atual", nf.format(d.proj), "tracejada"], ["var(--g-meta)", "meta do mês", nf.format(d.meta), "regua"]];
      const abrir = (cx, cy) => mostrarDica(cx, cy, d.t, linhas);
      b.addEventListener("pointermove", (ev) => abrir(ev.clientX, ev.clientY));
      b.addEventListener("pointerleave", esconderDica);
      b.addEventListener("focus", () => { const r = b.getBoundingClientRect(); abrir(r.left + r.width / 2, r.top); });
      b.addEventListener("blur", esconderDica);
    });
  }

  /* Situação das vendas: barra 100% empilhada (estados), com rótulo fora quando o pedaço é estreito. */
  function situacao(partes) {
    const tot = partes.reduce((s, p) => s + p.v, 0);
    return `<div class="g-pilha" role="img" aria-label="${partes.map((p) => `${p.rot}: ${nf.format(p.v)}`).join(", ")}">${partes.map((p) => `<span class="g-pilha-p ${p.cls}" style="flex:${p.v}" title="${p.rot}: ${nf.format(p.v)} (${Math.round((p.v / tot) * 100)}%)"></span>`).join("")}</div>`;
  }

  /* Tabelas no celular: cada célula recebe o nome da coluna (o CSS mostra "rótulo · valor" em linhas empilhadas,
     sem rolagem lateral). Colunas sem título (ações) ficam sem rótulo. */
  function rotularTabelas(raiz) {
    raiz.querySelectorAll("table").forEach((t) => {
      const tit = [...t.querySelectorAll("thead th")].map((th) => th.childNodes[0]?.textContent?.trim() || "");
      t.querySelectorAll("tbody tr, tfoot tr").forEach((tr) => [...tr.children].forEach((td, i) => { if (tit[i]) td.dataset.l = tit[i]; }));
    });
  }

  return { acumulado, barraMeta, escalaComum, ligarBullets, situacao, nf, esconderDica, rotularTabelas };
})();
