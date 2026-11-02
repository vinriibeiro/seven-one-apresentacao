"use strict";
/* Gráficos em SVG puro (sem dependências), interativos e desenhados na largura real do painel (texto nítido, sem "encolher").
   Especificação visual:
   - marcas finas (colunas até 24 px), ponta arredondada de 4 px e base reta, sempre a partir do zero;
   - grade em fio contínuo de 1 px e recessiva; eixo de base um tom mais forte;
   - linhas de 2 px, área com lavagem de 10%; marcador só no último ponto (e em todos ao passar o mouse);
   - 2 px de respiro (cor do fundo) entre segmentos empilhados;
   - rótulos de valor seletivos; texto sempre em cor de texto (a cor da série fica só na marca);
   - legenda em "pílulas" sempre que há 2+ séries; um único eixo (nunca eixo duplo);
   - realizado em azul (--c-real), projeção em azul claro tracejado (--c-proj), meta como régua escura (--c-meta);
   - estado (ok/atenção/ruim) sempre com texto ou símbolo junto da cor; o vermelho da marca fica para as ações.
   Paleta: variáveis CSS --c-s1..s8 (categórica, ordem fixa), --c-r1..r7 (rampa azul sequencial),
   --c-ok / --c-pend / --c-ruim / --c-alerta (estado), definidas em seven.css (só tema claro). Aparência em graficos.css. */
const CH = (() => {
  const v = (n) => `var(--c-${n})`;
  const COR = {
    base: v("s1"), claro: v("r3"), azul: v("pend"), pend: v("pend"), ok: v("ok"), alerta: v("alerta"), ruim: v("ruim"), cinza: v("cinza"),
    real: v("real"), proj: v("proj"), meta: v("meta"),
    s: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => v("s" + i)), rampa: [1, 2, 3, 4, 5, 6, 7].map((i) => v("r" + i)),
    texto: v("texto"), suave: v("suave"), grade: v("grade"), eixo: v("eixo"), ref: v("ref"), fundo: v("fundo"),
  };
  /* situação da previsão em relação à meta: símbolo + nome + classe do texto (a cor nunca vai sozinha) */
  const SIT = (at) => (at >= 1 ? { s: "●", n: "No ritmo da meta", c: "okt" } : at >= 0.75 ? { s: "◆", n: "Atenção", c: "alt" } : { s: "▲", n: "Abaixo do ritmo", c: "rmt" });
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = new Intl.NumberFormat("pt-BR");
  /* no aplicativo as letras dos gráficos são maiores: as áreas de rótulo crescem junto */
  const AP = () => (document.body.classList.contains("app-vendedor") ? 1.22 : 1), CW = () => 7.6 * AP();
  const abrev = (x) => { const a = Math.abs(x); return a >= 1e6 ? (x / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(".", ",") + " mi" : a >= 1e4 ? (x / 1e3).toFixed(0) + " mil" : nf.format(x); };
  const REG = new Map();
  let seq = 0;
  const FS = 12;                                  // tamanho do texto (px reais, o SVG é desenhado na largura do painel)
  const larguraTxt = (s, fs = FS) => String(s ?? "").length * fs * 0.56;

  function escala(max, ticks = 4, min = 0) {      // topo "redondo" e passo legível
    const amp = max - min;
    if (!(amp > 0)) return { topo: min + 1, passo: 0.25, base: min };
    const bruto = amp / ticks, mag = Math.pow(10, Math.floor(Math.log10(bruto)));
    const f = [1, 2, 2.5, 5, 10].find((x) => x * mag >= bruto) * mag;
    return { topo: min + Math.ceil(amp / f) * f, passo: f, base: min };
  }

  /* ---------- peças comuns ---------- */
  const moldura = (W, H, corpo, titulo, id, classe, anim, defs = "") =>
    `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${esc(titulo)}" class="chart ${classe || ""} ${anim ? "" : "sem-anim"}" data-cid="${id}" data-w="${W}" preserveAspectRatio="xMinYMin meet" font-family="inherit" font-size="${FS}">${defs ? `<defs>${defs}</defs>` : ""}${corpo}</svg>`;

  /* linha da dica: { cor, rot, val, tipo? } — tipo "linha" | "tracejada" | "regua" (+ " fina") desenha a chave como traço */
  const dica = (titulo, linhas = [], rodape = "") =>
    `<div class="th">${esc(titulo)}</div>` + linhas.map((l) => `<div class="tl">${l.cor ? `<i class="${l.tipo || ""}" style="--k:${l.cor};background:${l.cor}"></i>` : ""}<span>${esc(l.rot)}</span><b>${esc(l.val)}</b></div>`).join("") +
    (rodape ? `<div class="tf">${esc(rodape)}</div>` : "");
  const attrTip = (h) => `data-tip="${esc(h)}"`;
  const attrGo = (d) => (d ? `data-go="${esc(JSON.stringify(d))}" style="cursor:pointer"` : "");

  /** Camada de luz por cima da barra (gradientes compartilhados #gl-v / #gl-h): dá volume sem mudar a cor da série. */
  const luz = () => "";   // sem camada de brilho: barras de cor chapada (aparência sóbria)
  /** Coluna: ponta de cima arredondada (6 px), base reta. */
  const colunaP = (x, y, w, h, r = 4) => {
    if (h <= 0) return "";
    r = Math.min(r, h, w / 2);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  };
  /** Barra horizontal: ponta da direita arredondada (4 px), base reta na esquerda. */
  const barraP = (x, y, w, h, r = 4) => {
    if (w <= 0) return "";
    r = Math.min(r, w, h / 2);
    return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
  };

  /** Legenda em pílulas (clicável: liga/desliga a série). Devolve { svg, altura }. */
  function legenda(series, x0, y0, W, ocultas) {
    let x = x0, y = y0, o = "";
    series.forEach((s, i) => {
      const w = 28 + larguraTxt(s.nome, 11.5);
      if (x + w > W - 8 && x > x0) { x = x0; y += 26; }
      o += `<g class="leg ${ocultas.has(i) ? "off" : ""}" data-leg="${i}" tabindex="0" role="button" aria-pressed="${!ocultas.has(i)}"><rect class="leg-bg" x="${x}" y="${y}" width="${w}" height="22" rx="11"/><circle cx="${x + 12}" cy="${y + 11}" r="4.5" fill="${s.cor}"/><text x="${x + 22}" y="${y + 15}" font-size="11.5" fill="${COR.texto}">${esc(s.nome)}</text></g>`;
      x += w + 6;
    });
    return { svg: o, altura: y - y0 + 22 };
  }
  /** Legenda fixa (não clicável): desenho da marca + nome, quebrando a linha quando falta largura. Devolve { svg, altura }.
      tipo: "barra" | "linha" | "proj" | "regua" | "marca" | "ponto" | "losango" (cor opcional). */
  function chaves(itens, W) {
    let x = 0, y = 0, o = "";
    itens.forEach(({ tipo, nome, cor }) => {
      const w = 22 + larguraTxt(nome, 11.5) * AP();
      if (x + w > W && x > 0) { x = 0; y += 20; }
      const c = cor || COR.real, m = y + 9;
      o += (tipo === "barra" ? `<rect x="${x}" y="${m - 5}" width="14" height="10" rx="2" fill="${c}"/>`
        : tipo === "linha" ? `<line x1="${x}" x2="${x + 14}" y1="${m}" y2="${m}" class="ch-linha"/>`
        : tipo === "proj" ? `<line x1="${x}" x2="${x + 14}" y1="${m}" y2="${m}" class="ch-proj"/>`
        : tipo === "regua" ? `<line x1="${x}" x2="${x + 14}" y1="${m}" y2="${m}" class="ch-regua"/>`
        : tipo === "marca" ? `<line x1="${x + 7}" x2="${x + 7}" y1="${m - 7}" y2="${m + 7}" class="ch-marca"/>`
        : tipo === "losango" ? `<path d="M${x + 7},${m - 6}L${x + 13},${m}L${x + 7},${m + 6}L${x + 1},${m}Z" fill="${c}"/>`
        : `<circle cx="${x + 7}" cy="${m}" r="5" fill="${c}"/>`) +
        `<text x="${x + 20}" y="${m + 4}" class="tk">${esc(nome)}</text>`;
      x += w + 14;
    });
    return { svg: o, altura: y + 18 };
  }

  function gradeY(m, W, H, e, fmt) {
    let o = "";
    for (let val = e.base; val <= e.topo + 1e-9; val += e.passo) {
      const y = m.t + (1 - (val - e.base) / (e.topo - e.base)) * (H - m.t - m.b);
      o += `<line x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}" class="${val === e.base ? "eixo" : "gr"}"/>`;
      o += `<text x="${m.l - 10}" y="${y + 4}" text-anchor="end" class="tk">${esc(fmt(val))}</text>`;
    }
    return o;
  }
  const rotY = (m, rotulo) => (rotulo ? `<text x="0" y="${m.t - 12}" class="tk un">${esc(rotulo)}</text>` : "");
  /** linha de referência: o nome vai como chave tracejada na faixa de cima, à direita (não disputa lugar com os rótulos de valor) */
  const refLinha = (m, W, y, ref) => { const w = larguraTxt(ref.rotulo) * AP(); return `<line x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}" class="ref"/><line x1="${W - m.r - w - 26}" x2="${W - m.r - w - 8}" y1="${m.t - 16}" y2="${m.t - 16}" class="ref"/><text x="${W - m.r}" y="${m.t - 12}" text-anchor="end" class="tk rf">${esc(ref.rotulo)}</text>`; };

  const ehMes = (x) => /^\d{2}\/\d{2}\*?$/.test(String(x));
  const variacao = (atual, ant, fmt) => {
    if (ant == null || ant === 0 || atual == null) return "";
    const d = (atual - ant) / Math.abs(ant);
    return `${d >= 0 ? "▲ +" : "▼ −"}${Math.abs(d * 100).toFixed(1).replace(".", ",")}% vs. ${fmt(ant)} no período anterior`;
  };
  const passoRot = (n, W) => Math.max(1, Math.ceil(n / Math.max(4, Math.floor(W / 42))));
  const fmtEixo = (fmt) => (x) => { const s = fmt(x); return s.length > 7 && typeof x === "number" && !/%/.test(s) ? (/R\$/.test(s) ? "R$ " : "") + abrev(x) : s; };

  /* ---------- colunas simples ---------- */
  function colunas(op, st, id, anim) {
    const { dados, fmt = (x) => nf.format(x), rotuloY = "", ref = null, altura = 260, titulo = "", destaque = null } = op;
    const W = st.W || 640, H = altura, fe = fmtEixo(fmt);
    const max = Math.max(...dados.map((d) => d.y || 0), ref ? ref.v : 0), e = escala(max);
    const m = { l: Math.max(40, larguraTxt(fe(e.topo)) + 18), r: 12, t: rotuloY || ref ? 32 : 18, b: 30 };
    const bw = (W - m.l - m.r) / Math.max(dados.length, 1), larg = Math.max(4, Math.min(30, bw * 0.6));
    const temporal = dados.length > 1 && dados.every((d) => ehMes(d.x));
    const pr = passoRot(dados.length, W - m.l), ultimo = dados.length - 1;
    const iMax = dados.reduce((b, d, i) => ((d.y || 0) > (dados[b]?.y || 0) ? i : b), 0);
    // rótulo em todas as colunas só quando cabem; senão, só no maior e no último (sem encostar um no outro)
    const lv = Math.max(...dados.map((d) => larguraTxt(fmt(d.y ?? 0)) * AP()), 0), todos = dados.length <= 16 && lv <= bw - 10;
    const comRot = (i) => todos || i === ultimo || (i === iMax && Math.abs(ultimo - iMax) * bw > lv + 4);
    let o = gradeY(m, W, H, e, fe) + rotY({ ...m, t: 22 }, rotuloY);
    dados.forEach((d, i) => {
      const cx = m.l + bw * (i + 0.5), h = ((d.y || 0) / e.topo) * (H - m.t - m.b), y = H - m.b - h;
      const fora = destaque != null && destaque !== i;
      const cor = d.cor || COR.base;
      const linhas = [{ cor, rot: rotuloY || "Valor", val: fmt(d.y) }];
      if (d.dica) String(d.dica).split(" · ").slice(1).forEach((p) => linhas.push({ rot: p, val: "" }));
      const rod = temporal && i > 0 ? variacao(d.y, dados[i - 1].y, fmt) : "";
      const rot = comRot(i);
      o += `<g class="pt" ${attrTip(dica(d.x, linhas, rod))} ${attrGo(d.ir)}><rect class="hit" x="${cx - bw / 2 + 1}" y="${m.t - 8}" width="${bw - 2}" height="${H - m.t - m.b + 8}" rx="6"/>` +
        `<path class="b" d="${colunaP(cx - larg / 2, y, larg, h)}" fill="${cor}" ${fora ? 'opacity=".45"' : ""} style="animation-delay:${i * 25}ms"/>` + luz(colunaP(cx - larg / 2, y, larg, h)) +
        (rot && d.y != null ? `<text x="${cx}" y="${y - 7}" text-anchor="middle" class="vl">${esc(fmt(d.y))}</text>` : "") + `</g>`;
      if (i % pr === 0 || i === ultimo && dados.length - 1 - i >= pr / 2) o += `<text x="${cx}" y="${H - m.b + 19}" text-anchor="middle" class="tk">${esc(d.x)}</text>`;
    });
    if (ref) {
      const y = m.t + (1 - ref.v / e.topo) * (H - m.t - m.b);
      o += refLinha({ ...m, t: 22 }, W, y, ref);
    }
    return moldura(W, H, o, titulo, id, "colunas", anim);
  }

  /* ---------- colunas empilhadas (composição de um total) ---------- */
  function empilhadas(op, st, id, anim) {
    const { cats, series: todas, fmt = (x) => nf.format(x), rotuloY = "", altura = 280, titulo = "", irCat = null } = op;
    const W = st.W || 640, fe = fmtEixo(fmt);
    const vis = todas.map((s, i) => ({ ...s, i })).filter((s) => !st.ocultas.has(s.i));
    const tot = cats.map((_, i) => vis.reduce((a, s) => a + (s.valores[i] || 0), 0));
    const e = escala(Math.max(...tot, 0));
    const leg = legenda(todas, 0, 0, W - Math.max(40, larguraTxt(fe(e.topo)) + 18), st.ocultas);
    const m = { l: Math.max(40, larguraTxt(fe(e.topo)) + 18), r: 12, t: leg.altura + (rotuloY ? 38 : 24), b: 30 }, H = altura + leg.altura - 22;
    const bw = (W - m.l - m.r) / cats.length, larg = Math.max(4, Math.min(30, bw * 0.6));
    const pr = passoRot(cats.length, W - m.l), tMax = Math.max(...tot), ultimo = cats.length - 1, iMax = tot.indexOf(tMax);
    const lv = Math.max(...tot.map((t) => larguraTxt(fmt(t)) * AP()), 0), todos = cats.length <= 16 && lv <= bw - 10;
    let o = `<g transform="translate(${m.l - 4} 4)">${legenda(todas, 0, 0, W - m.l, st.ocultas).svg}</g>` + gradeY(m, W, H, e, fe) + rotY(m, rotuloY);
    cats.forEach((c, i) => {
      const cx = m.l + bw * (i + 0.5); let base = H - m.b;
      const linhas = [...vis].reverse().map((s) => ({ cor: s.cor, rot: s.nome, val: `${fmt(s.valores[i] || 0)}${tot[i] ? `  ·  ${((s.valores[i] || 0) / tot[i] * 100).toFixed(0)}%` : ""}` }));
      if (vis.length > 1) linhas.push({ rot: "Total", val: fmt(tot[i]) });
      const rod = i > 0 && tot[i - 1] ? variacao(tot[i], tot[i - 1], fmt) : "";
      o += `<g class="pt" ${attrTip(dica(c, linhas, rod))} ${attrGo(irCat ? irCat(i) : null)}><rect class="hit" x="${cx - bw / 2 + 1}" y="${m.t - 8}" width="${bw - 2}" height="${H - m.t - m.b + 8}" rx="6"/>`;
      const comValor = vis.filter((s) => (s.valores[i] || 0) > 0), escH = (H - m.t - m.b) / e.topo;
      comValor.forEach((s, k) => {
        const val = s.valores[i] || 0, h = val * escH; base -= h;
        const gap = k < comValor.length - 1 && h > 3 ? 2 : 0;      // respiro de 2 px entre segmentos
        const topoSeg = k === comValor.length - 1;
        const dSeg = topoSeg ? colunaP(cx - larg / 2, base, larg, h) : `M${cx - larg / 2},${base + gap}h${larg}v${Math.max(0.5, h - gap)}h${-larg}Z`;
        o += `<path class="b" d="${dSeg}" fill="${s.cor}" style="animation-delay:${i * 25}ms"/>` + luz(dSeg);
      });
      const mostra = tot[i] > 0 && (todos || i === ultimo || (i === iMax && Math.abs(ultimo - iMax) * bw > lv + 4));
      o += (mostra ? `<text x="${cx}" y="${base - 7}" text-anchor="middle" class="vl">${esc(fmt(tot[i]))}</text>` : "") + `</g>`;
      if (i % pr === 0) o += `<text x="${cx}" y="${H - m.b + 19}" text-anchor="middle" class="tk">${esc(c)}</text>`;
    });
    return moldura(W, H, o, titulo, id, "colunas", anim);
  }

  /** Curva suave que não "estoura" acima dos pontos (interpolação monotônica de Fritsch–Carlson). */
  function curva(pts) {
    const n = pts.length; if (n < 3) return "M" + pts.map((p) => p.join(",")).join("L");
    const dx = [], sl = [], t = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; sl[i] = (pts[i + 1][1] - pts[i][1]) / (dx[i] || 1); }
    t[0] = sl[0]; t[n - 1] = sl[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = sl[i - 1] * sl[i] <= 0 ? 0 : (sl[i - 1] + sl[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (sl[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      const a = t[i] / sl[i], b = t[i + 1] / sl[i], h = Math.hypot(a, b);
      if (h > 3) { t[i] = 3 * a / h * sl[i]; t[i + 1] = 3 * b / h * sl[i]; }
    }
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n - 1; i++) d += `C${pts[i][0] + dx[i] / 3},${pts[i][1] + t[i] * dx[i] / 3} ${pts[i + 1][0] - dx[i] / 3},${pts[i + 1][1] - t[i + 1] * dx[i] / 3} ${pts[i + 1][0]},${pts[i + 1][1]}`;
    return d;
  }

  /* ---------- linhas (séries no tempo). Percentuais: max:1 e fmt de %. Série com tracejado: s.tracejado ---------- */
  function linhas(op, st, id, anim) {
    const { cats, series: todas, fmt = (x) => nf.format(x), min = 0, max = null, rotuloY = "", altura = 260, titulo = "", ref = null, irCat = null, dicaExtra = null } = op;
    const W = st.W || 640, fe = fmtEixo(fmt);
    const vis = todas.map((s, i) => ({ ...s, i })).filter((s) => !st.ocultas.has(s.i));
    const vals = vis.flatMap((s) => s.valores.filter((x) => x != null));
    const e = escala(max ?? Math.max(...vals, ref ? ref.v : 0, 0), 4, min);
    const leg = todas.length > 1 ? legenda(todas, 0, 0, W - Math.max(40, larguraTxt(fe(e.topo)) + 18), st.ocultas) : { svg: "", altura: -14 };
    // com 2+ séries que chegam ao fim, o valor final vai à direita do ponto (cada um na altura da sua linha)
    const ladoDir = vis.length > 1 && vis.some((s) => s.valores[cats.length - 1] != null);
    const lFim = Math.max(0, ...vis.map((s) => (s.valores[cats.length - 1] != null ? larguraTxt(fmt(s.valores[cats.length - 1])) * AP() : 0)));
    const m = { l: Math.max(40, larguraTxt(fe(e.topo)) + 18), r: ladoDir ? Math.max(22, lFim + 6) : 22, t: leg.altura + (rotuloY || ref ? 40 : 26), b: 30 }, H = altura + Math.max(0, leg.altura - 22);
    const esc0 = e.topo - e.base;
    let o = (todas.length > 1 ? `<g transform="translate(${m.l - 4} 4)">${legenda(todas, 0, 0, W - m.l, st.ocultas).svg}</g>` : "") + gradeY(m, W, H, e, fe) + rotY(m, rotuloY), defs = "";
    const dx = (W - m.l - m.r) / cats.length, px = (i) => m.l + dx * (i + 0.5), py = (val) => m.t + (1 - (val - e.base) / esc0) * (H - m.t - m.b);
    const pr = passoRot(cats.length, W - m.l);
    cats.forEach((c, i) => { if (i % pr === 0) o += `<text x="${px(i)}" y="${H - m.b + 19}" text-anchor="middle" class="tk">${esc(c)}</text>`; });
    if (ref) o += refLinha(m, W, py(ref.v), ref);
    const lavar = vis.length <= 2, fins = [];
    vis.forEach((s, k) => {
      const pts = s.valores.map((val, i) => (val == null ? null : [px(i), py(val)])).filter(Boolean);
      if (pts.length > 1) {
        const cv = curva(pts);
        if (lavar && !s.tracejado) {
          defs += `<linearGradient id="a${id}_${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.cor}" stop-opacity=".10"/><stop offset="1" stop-color="${s.cor}" stop-opacity="0"/></linearGradient>`;
          o += `<path class="area" d="${cv}L${pts[pts.length - 1][0]},${H - m.b}L${pts[0][0]},${H - m.b}Z" fill="url(#a${id}_${k})"/>`;
        }
        o += `<path class="ln" ${s.tracejado ? "" : 'pathLength="1"'} fill="none" stroke="${s.cor}" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" ${s.tracejado ? 'stroke-dasharray="5 4"' : ""} d="${cv}"/>`;
      }
      // último ponto: marcador e rótulo
      const iu = s.valores.reduce((b, x, i) => (x != null ? i : b), -1);
      if (iu >= 0) { o += `<circle cx="${px(iu)}" cy="${py(s.valores[iu])}" r="4" fill="${s.cor}" stroke="${COR.fundo}" stroke-width="2"/>`; fins.push(ladoDir && iu === cats.length - 1 ? { x: px(iu) + 9, y: py(s.valores[iu]) + 4, a: "start", t: fmt(s.valores[iu]) } : { x: px(iu), y: py(s.valores[iu]) - 10, a: iu === cats.length - 1 && dx < 50 ? "end" : "middle", t: fmt(s.valores[iu]) }); }
    });
    // rótulos do último ponto: separados na vertical quando duas séries terminam perto
    fins.sort((a, b) => a.y - b.y).forEach((r, i, l) => { if (i && Math.abs(r.x - l[i - 1].x) < 60 && r.y - l[i - 1].y < 15 * AP()) r.y = l[i - 1].y + 15 * AP(); o += `<text x="${r.x}" y="${r.y}" text-anchor="${r.a}" class="vl">${esc(r.t)}</text>`; });
    cats.forEach((c, i) => {
      const lin = vis.filter((s) => s.valores[i] != null).map((s) => ({ cor: s.cor, rot: s.nome, val: fmt(s.valores[i]) })).concat(dicaExtra ? dicaExtra(i) : []);
      let g = `<g class="pt col" ${attrTip(dica(c, lin.length ? lin : [{ rot: "Sem dados", val: "" }], ""))} ${attrGo(irCat ? irCat(i) : null)}><rect class="hit0" x="${px(i) - dx / 2}" y="${m.t - 6}" width="${dx}" height="${H - m.t - m.b + 6}" fill="transparent"/><line class="guia" x1="${px(i)}" x2="${px(i)}" y1="${m.t}" y2="${H - m.b}"/>`;
      vis.forEach((s) => { const val = s.valores[i]; if (val != null) g += `<circle class="dot" cx="${px(i)}" cy="${py(val)}" r="4" fill="${s.cor}" stroke="${COR.fundo}" stroke-width="2"/>`; });
      o += g + "</g>";
    });
    return moldura(W, H, o, titulo, id, "linhas", anim, defs);
  }

  /* ---------- barras horizontais ordenadas (rankings, nomes longos) ---------- */
  function barrasH(op, st, id, anim) {
    const { dados, fmt = (x) => nf.format(x), rotuloX = "", titulo = "", linha: linha0 = 30, larguraRot = 150, ref = null, destaque = null } = op;
    const W = st.W || 640;
    // celular: o nome fica numa linha acima da barra, e a barra ocupa a largura toda
    const estreito = W < 480, linha = estreito ? Math.max(linha0, 44) : linha0;
    const maiorNome = Math.max(...dados.map((d) => larguraTxt(String(d.rot), 12.5)), 0) * AP() + 20;
    const lr = estreito ? 0 : Math.min(Math.max(maiorNome, 110 * AP()), Math.max(larguraRot * AP(), W * 0.42 * AP()));
    const maxTxt = Math.max(...dados.map((d) => larguraTxt(fmt(d.y), 12)), 30);
    const m = { l: lr, r: estreito ? 2 : maxTxt + 14, t: rotuloX ? 22 : 6, b: ref ? 22 : 6 }, H = m.t + m.b + dados.length * linha;
    const e = escala(Math.max(...dados.map((d) => d.y || 0), ref ? ref.v : 0), 4);
    const pw = W - m.l - m.r;
    let o = rotuloX ? `<text x="${m.l}" y="12" class="tk un">${esc(rotuloX)}</text>` : "";
    const media = dados.length > 2 ? dados.reduce((a, d) => a + (d.y || 0), 0) / dados.length : null;
    const maxC = estreito ? Math.floor((W - 70) / (7 * AP())) : Math.floor((lr - 14) / (7 * AP()));
    dados.forEach((d, i) => {
      const y = m.t + i * linha, w = ((d.y || 0) / e.topo) * pw, esp = Math.min(8, linha * 0.3), oy = estreito ? y + 27 : y + (linha - esp) / 2;
      const ty = estreito ? y + 17 : y + linha / 2 + 4;
      const rot = String(d.rot).length > maxC ? String(d.rot).slice(0, maxC - 1) + "…" : d.rot;
      const cor = d.cor || COR.base, fora = destaque != null && destaque !== i;
      const lin = [{ cor, rot: rotuloX || "Valor", val: fmt(d.y) }];
      if (d.n != null) lin.push({ rot: "Base (n)", val: nf.format(d.n) });
      (d.extra || []).forEach((x) => lin.push(x));
      const rod = [`${i + 1}º de ${dados.length}`, media != null && media > 0 ? `${d.y >= media ? "+" : "−"}${Math.abs((d.y - media) / media * 100).toFixed(0)}% em relação à média` : ""].filter(Boolean).join("\n");
      o += `<g class="pt lh" ${attrTip(dica(d.rot, lin, rod))} ${attrGo(d.ir)}><rect class="hit" x="0" y="${y + 1}" width="${W}" height="${linha - 2}" rx="6"/><text x="${estreito ? 0 : m.l - 10}" y="${ty}" text-anchor="${estreito ? "start" : "end"}" class="rt">${esc(rot)}</text>` +
        `<rect class="pista" x="${m.l}" y="${oy}" width="${pw}" height="${esp}" rx="${esp / 2}"/><rect class="b bh" x="${m.l}" y="${oy}" width="${Math.max(w, d.y ? esp : 0)}" height="${esp}" rx="${esp / 2}" fill="${cor}" ${fora ? 'opacity=".45"' : ""} style="animation-delay:${i * 20}ms"/><text x="${W - 2}" y="${ty}" text-anchor="end" class="vl">${esc(fmt(d.y))}</text>${i < dados.length - 1 ? `<line x1="0" x2="${W}" y1="${y + linha}" y2="${y + linha}" class="gr"/>` : ""}</g>`;
    });
    if (ref) { const x = m.l + (ref.v / e.topo) * pw; o += `<line x1="${x}" x2="${x}" y1="${m.t}" y2="${H - m.b + 4}" class="ref"/><text x="${x}" y="${H - 3}" text-anchor="middle" class="tk rf">${esc(ref.rotulo)}</text>`; }
    return moldura(W, H, o, titulo, id, "barrash", anim);
  }

  /* ---------- Pareto em barras horizontais: barra = contratos; texto = valor e % acumulado (até 80% em cor cheia) ---------- */
  function pareto(op, st, id, anim) {
    const { dados, titulo = "", larguraRot = 250 } = op;
    const W = st.W || 640, linha = 30, maiorNome = Math.max(...dados.map((d) => larguraTxt(String(d.rot), 12.5)), 0) * AP() + 20, lr = Math.min(Math.max(maiorNome, 110 * AP()), Math.max(larguraRot * AP(), W * 0.42 * AP())), m = { l: lr, r: 120, t: 6, b: 6 }, H = m.t + m.b + dados.length * linha;
    const total = dados.reduce((a, d) => a + d.y, 0) || 1, e = escala(Math.max(...dados.map((d) => d.y)), 4), pw = W - m.l - m.r;
    let o = "";
    let acc = 0; const maxC = Math.floor((lr - 14) / (7 * AP()));
    dados.forEach((d, i) => {
      const y = m.t + i * linha, w = (d.y / e.topo) * pw, antes = acc / total, esp = 8, oy = y + (linha - esp) / 2; acc += d.y;
      const rot = String(d.rot).length > maxC ? String(d.rot).slice(0, maxC - 1) + "…" : d.rot;
      const cor = d.cor || (antes < 0.8 ? COR.base : COR.claro);
      const tip = dica(d.rot, [{ cor, rot: "Contratos", val: nf.format(d.y) }, { rot: "Parcela do total", val: ((d.y / total) * 100).toFixed(1).replace(".", ",") + "%" }, { rot: "Acumulado", val: ((acc / total) * 100).toFixed(0) + "%" }],
        antes < 0.8 ? "Está entre os motivos que somam 80% dos casos." : "");
      o += `<g class="pt lh" ${attrTip(tip)}><rect class="hit" x="0" y="${y + 1}" width="${W}" height="${linha - 2}" rx="6"/><text x="${m.l - 10}" y="${y + linha / 2 + 4}" text-anchor="end" class="rt">${esc(rot)}</text>` +
        `<rect class="pista" x="${m.l}" y="${oy}" width="${pw}" height="${esp}" rx="${esp / 2}"/><rect class="b bh" x="${m.l}" y="${oy}" width="${Math.max(w, esp)}" height="${esp}" rx="${esp / 2}" fill="${cor}" style="animation-delay:${i * 20}ms"/>${i < dados.length - 1 ? `<line x1="0" x2="${W}" y1="${y + linha}" y2="${y + linha}" class="gr"/>` : ""}` +
        `<text x="${m.l + w + 8}" y="${y + linha / 2 + 4}"><tspan class="vl">${nf.format(d.y)}</tspan><tspan class="tk" dx="8">acum. ${(acc / total * 100).toFixed(0)}%</tspan></text></g>`;
    });
    return moldura(W, H, o, titulo, id, "barrash", anim);
  }

  /* ---------- dispersão (volume x qualidade). pontos:[{x,y,rot}] ---------- */
  function dispersao(op, st, id, anim) {
    const { pontos, rotuloX, rotuloY, fmtX = (x) => nf.format(x), fmtY = (x) => nf.format(x), refX = null, refY = null, altura = 320, titulo = "" } = op;
    const W = st.W || 640;
    // com referência de qualidade, os pontos acima dela viram losango (forma + cor) e a legenda explica
    const leg = refY != null ? chaves([{ tipo: "ponto", nome: "dentro da referência" }, { tipo: "losango", cor: COR.ruim, nome: "acima da referência" }], W) : null;
    const H = altura + (leg ? leg.altura + 8 : 0);
    const ex = escala(Math.max(...pontos.map((p) => p.x), refX ?? 0)), ey = escala(Math.max(...pontos.map((p) => p.y), refY ?? 0));
    const m = { l: Math.max(44, larguraTxt(fmtY(ey.topo)) + 18), r: 18, t: 30 + (leg ? leg.altura + 8 : 0), b: 44 };
    const px = (val) => m.l + (val / ex.topo) * (W - m.l - m.r), py = (val) => m.t + (1 - val / ey.topo) * (H - m.t - m.b);
    let o = leg ? `<g transform="translate(0 2)">${leg.svg}</g>` : "";
    for (let val = 0; val <= ex.topo + 1e-9; val += ex.passo) o += `<line x1="${px(val)}" x2="${px(val)}" y1="${m.t}" y2="${H - m.b}" class="${val === 0 ? "eixo" : "gr"}"/><text x="${px(val)}" y="${H - m.b + 19}" text-anchor="middle" class="tk">${esc(fmtX(val))}</text>`;
    for (let val = 0; val <= ey.topo + 1e-9; val += ey.passo) o += `<line x1="${m.l}" x2="${W - m.r}" y1="${py(val)}" y2="${py(val)}" class="${val === 0 ? "eixo" : "gr"}"/><text x="${m.l - 10}" y="${py(val) + 4}" text-anchor="end" class="tk">${esc(fmtY(val))}</text>`;
    o += `<text x="${W - m.r}" y="${H - 6}" text-anchor="end" class="tk un">${esc(rotuloX)} →</text>` + rotY(m, "↑ " + (rotuloY || ""));
    if (refX != null) o += `<line x1="${px(refX)}" x2="${px(refX)}" y1="${m.t}" y2="${H - m.b}" class="ref"/>`;
    if (refY != null) o += `<line x1="${m.l}" x2="${W - m.r}" y1="${py(refY)}" y2="${py(refY)}" class="ref"/>`;
    const foco = new Set((refY != null ? pontos.filter((p) => p.y > refY).sort((a, b) => b.x - a.x) : [...pontos].sort((a, b) => b.x - a.x)).slice(0, 3));
    pontos.forEach((p, i) => {
      const acima = refY != null && p.y > refY, cor = p.cor || (acima ? COR.ruim : COR.base);
      const tip = dica(p.rot, [{ cor, rot: rotuloX, val: fmtX(p.x) }, { rot: rotuloY, val: fmtY(p.y) }], acima ? "Acima da referência de qualidade." : "");
      const cx = px(p.x), cy = py(p.y);
      o += `<g class="pt dp" ${attrTip(tip)} ${attrGo(p.ir)}>` + (acima
        ? `<path class="dot" d="M${cx},${cy - 8}L${cx + 8},${cy}L${cx},${cy + 8}L${cx - 8},${cy}Z" fill="${cor}" stroke="${COR.fundo}" stroke-width="2" style="animation-delay:${i * 8}ms"/>`
        : `<circle class="dot" cx="${cx}" cy="${cy}" r="6" fill="${cor}" fill-opacity=".9" stroke="${COR.fundo}" stroke-width="2" style="animation-delay:${i * 8}ms"/>`) +
        (foco.has(p) ? `<text x="${px(p.x) + 10}" y="${py(p.y) + 4}" class="rt">${esc(String(p.rot).split(" ")[0])}</text>` : "") + `</g>`;
    });
    return moldura(W, H, o, titulo, id, "disp", anim);
  }

  /** Minigráfico de tendência para os cartões de indicador (último ponto em destaque). */
  function spark(valores, { cor = COR.base, w = 96, h = 30 } = {}) {
    const vv = valores.filter((x) => x != null);
    if (vv.length < 2) return "";
    const mn = Math.min(...vv), mx = Math.max(...vv), fx = (i) => 3 + (i / (vv.length - 1)) * (w - 6), fy = (x) => h - 4 - (mx === mn ? 0.5 : (x - mn) / (mx - mn)) * (h - 9);
    const P = vv.map((x, i) => [+fx(i).toFixed(1), +fy(x).toFixed(1)]), cv = curva(P), u = P[P.length - 1];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><path d="${cv}L${u[0]},${h}L${P[0][0]},${h}Z" fill="${cor}" fill-opacity=".1"/><path d="${cv}" fill="none" stroke="${cor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${u[0]}" cy="${u[1]}" r="3" fill="${cor}" stroke="${COR.fundo}" stroke-width="1.5"/></svg>`;
  }
  /** Barrinha de dados para células de tabela (HTML). */
  const mini = (valor, max, { cor = COR.base, w = 70 } = {}) =>
    `<span class="minibar" style="width:${w}px"><i style="width:${max > 0 ? Math.max(2, Math.min(100, (valor / max) * 100)) : 0}%;background:${cor}"></i></span>`;

  /* ---------- rosca (composição de um total, até 6 partes) ---------- */
  function rosca(op, st, id, anim) {
    const { partes, fmt = (x) => nf.format(x), titulo = "", centro = "Total", altura = 230 } = op;
    const W = st.W || 640, vis = partes.map((p, i) => ({ ...p, i })).filter((p) => !st.ocultas.has(p.i));
    const tot = vis.reduce((a, p) => a + (p.y || 0), 0), estreito = W < 470;
    const H = estreito ? altura + partes.length * 34 + 10 : altura, R = Math.min(altura / 2 - 12, 105), r = R - 22;
    const cx = estreito ? W / 2 : Math.max(R + 20, W * 0.26), cy = estreito ? altura / 2 : H / 2;
    let o = "", ang = -Math.PI / 2;
    const pt = (a, rr) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
    o += `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="${COR.grade}" stroke-width="${R - r}"/>`;
    vis.forEach((p, k) => {
      const f = (p.y || 0) / (tot || 1); if (f <= 0) return;
      const gap = vis.filter((x) => x.y > 0).length > 1 ? 0.03 : 0, a0 = ang + gap / 2, a1 = ang + f * 2 * Math.PI - gap / 2; ang += f * 2 * Math.PI;
      const g = a1 - a0 > Math.PI ? 1 : 0, [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), [x2, y2] = pt(a1, r), [x3, y3] = pt(a0, r);
      const d = f >= 0.9999 ? `M${cx - R},${cy}a${R},${R} 0 1 1 ${2 * R},0a${R},${R} 0 1 1 ${-2 * R},0Z M${cx - r},${cy}a${r},${r} 0 1 0 ${2 * r},0a${r},${r} 0 1 0 ${-2 * r},0Z` : `M${x0},${y0}A${R},${R} 0 ${g} 1 ${x1},${y1}L${x2},${y2}A${r},${r} 0 ${g} 0 ${x3},${y3}Z`;
      o += `<g class="pt fatia" ${attrTip(dica(p.rot, [{ cor: p.cor, rot: "Quantidade", val: fmt(p.y) }, { rot: "Participação", val: (f * 100).toFixed(1).replace(".", ",") + "%" }], ""))} ${attrGo(p.ir)}><path class="b fat" fill-rule="evenodd" d="${d}" fill="${p.cor}" style="animation-delay:${k * 60}ms"/></g>`;
    });
    o += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" class="big">${esc(fmt(tot))}</text><text x="${cx}" y="${cy + 24}" text-anchor="middle" class="tk">${esc(centro)}</text>`;
    const tudo = partes.reduce((a, p) => a + (p.y || 0), 0);
    const lx = estreito ? 16 : cx + R + 40, lw = Math.min(estreito ? W - 32 : W - lx - 12, 380), ly = estreito ? altura + 10 : (H - partes.length * 40) / 2;
    partes.forEach((p, i) => {
      const y = ly + i * 40, off = st.ocultas.has(i), f = tudo ? (p.y || 0) / tudo : 0;
      o += `<g class="leg ${off ? "off" : ""}" data-leg="${i}" tabindex="0" role="button" aria-pressed="${!off}"><rect x="${lx - 6}" y="${y}" width="${lw + 12}" height="36" rx="8" class="leg-row"/><circle cx="${lx + 6}" cy="${y + 13}" r="5" fill="${p.cor}"/><text x="${lx + 18}" y="${y + 17}" class="rt">${esc(p.rot)}</text><text x="${lx + lw - 46}" y="${y + 17}" text-anchor="end" class="vl">${esc(fmt(p.y))}</text><text x="${lx + lw}" y="${y + 17}" text-anchor="end" class="tk">${(f * 100).toFixed(0)}%</text>` +
        `<rect x="${lx + 18}" y="${y + 25}" width="${lw - 18}" height="4" rx="2" class="pista"/><rect x="${lx + 18}" y="${y + 25}" width="${Math.max(0, (lw - 18) * f)}" height="4" rx="2" fill="${p.cor}"/></g>`;
    });
    return moldura(W, H, o, titulo, id, "rosca", anim);
  }

  /* ---------- calendário de calor (um mês). dias:[{d:'AAAA-MM-DD', v, folga?, nome?}] ---------- */
  function calor(op, st, id, anim) {
    const { dias, fmt = (x) => nf.format(x), titulo = "", rotulo = "Vendas", mes } = op;
    const W = st.W || 640, ref = mes || (dias[0]?.d || "").slice(0, 7);
    const [a, mm] = ref.split("-").map(Number), fim = new Date(Date.UTC(a, mm, 0)).getUTCDate();
    const porDia = new Map(dias.map((x) => [x.d, x])), max = Math.max(1, ...dias.map((x) => x.v || 0));
    const off = (new Date(Date.UTC(a, mm - 1, 1)).getUTCDay() + 6) % 7;   // semana começa na segunda
    const sem = Math.ceil((off + fim) / 7), gap = 6, cw = Math.min(92, (W - gap * 6) / 7), ch = Math.min(64, Math.max(40, cw * 0.62));
    const x0 = (W - (cw * 7 + gap * 6)) / 2, quebra = x0 + 330 * AP() > W, H = 26 + sem * (ch + gap) + (quebra ? 50 : 30);
    let o = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((n, i) => `<text x="${x0 + i * (cw + gap) + 8}" y="14" class="tk">${n}</text>`).join("");
    const hoje = new Date().toISOString().slice(0, 10);
    for (let d = 1; d <= fim; d++) {
      const k = off + d - 1, c = k % 7, l = Math.floor(k / 7), x = x0 + c * (cw + gap), y = 24 + l * (ch + gap);
      const iso = `${a}-${String(mm).padStart(2, "0")}-${String(d).padStart(2, "0")}`, it = porDia.get(iso) || {}, val = it.v || 0;
      const folga = it.folga || c === 6, nivel = val > 0 ? Math.min(6, Math.floor((val / max) * 6.999)) : -1;
      const cor = folga && !val ? "var(--c-folga)" : nivel < 0 ? "var(--c-vazio)" : COR.rampa[nivel];
      const escuro = nivel >= 3;
      const tip = dica(`${String(d).padStart(2, "0")}/${String(mm).padStart(2, "0")}${it.nome ? " · " + it.nome : folga ? " · folga" : ""}`, [{ cor: nivel >= 0 ? cor : null, rot: rotulo, val: fmt(val) }, ...(it.extra || [])], iso > hoje ? "Dia ainda não chegou." : "");
      o += `<g class="pt cel" ${attrTip(tip)} ${attrGo(it.ir)}><rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="8" fill="${cor}" class="b0 ${iso === hoje ? "hoje" : ""} ${folga ? "folga" : ""}"/>` +
        `<text x="${x + 8}" y="${y + 16}" font-size="11" class="${escuro ? "inv" : "tk"}">${d}</text>` +
        (val ? `<text x="${x + cw - 8}" y="${y + ch - 9}" text-anchor="end" class="vl ${escuro ? "inv" : ""}" font-size="${cw > 60 ? 15 : 12}">${esc(fmt(val))}</text>` : it.nome ? `<text x="${x + cw - 8}" y="${y + ch - 9}" text-anchor="end" class="tk" font-size="10">${esc(it.nome.length > (cw / 6) ? "feriado" : it.nome)}</text>` : "") + `</g>`;
    }
    // legenda da rampa; no celular a chave de folga desce para a linha de baixo
    const ly = H - (quebra ? 34 : 14), lx = x0, fx = quebra ? lx : lx + 44 + 7 * 18 + 50, fy = quebra ? ly + 20 : ly;
    o += `<text x="${lx}" y="${ly + 4}" class="tk">menos</text>` + COR.rampa.map((c, i) => `<rect x="${lx + 44 + i * 18}" y="${ly - 6}" width="14" height="12" rx="3" fill="${c}"/>`).join("") + `<text x="${lx + 44 + 7 * 18 + 4}" y="${ly + 4}" class="tk">mais</text>` +
      `<rect x="${fx}" y="${fy - 6}" width="14" height="12" rx="3" fill="var(--c-folga)"/><text x="${fx + 20}" y="${fy + 4}" class="tk">domingo / feriado</text>`;
    return moldura(W, H, o, titulo, id, "calor", anim);
  }

  /* ---------- treemap (participação de cada item num total). itens:[{rot,y,sub?,ir?}] ---------- */
  function treemap(op, st, id, anim) {
    const { itens, fmt = (x) => nf.format(x), titulo = "", altura = 340, rotulo = "Vendas" } = op;
    const W = st.W || 640, H = altura, tot = itens.reduce((a, x) => a + (x.y || 0), 0) || 1;
    const lista = itens.filter((x) => x.y > 0).sort((a, b) => b.y - a.y).map((x, i) => ({ ...x, i, area: (x.y / tot) * W * H }));
    // algoritmo "squarified" (Bruls et al.)
    const pior = (lin, lado) => { const s = lin.reduce((a, x) => a + x.area, 0), mx = Math.max(...lin.map((x) => x.area)), mn = Math.min(...lin.map((x) => x.area)); return Math.max((lado * lado * mx) / (s * s), (s * s) / (lado * lado * mn)); };
    const ret = []; let x = 0, y = 0, w = W, h = H, fila = lista.slice();
    while (fila.length) {
      const lado = Math.min(w, h); let lin = [fila[0]], k = 1;
      while (k < fila.length && pior([...lin, fila[k]], lado) <= pior(lin, lado)) { lin.push(fila[k]); k++; }
      fila = fila.slice(k);
      const s = lin.reduce((a, q) => a + q.area, 0);
      if (w >= h) { const lw = s / h; let yy = y; lin.forEach((q) => { const qh = q.area / lw; ret.push({ q, x, y: yy, w: lw, h: qh }); yy += qh; }); x += lw; w -= lw; }
      else { const lh = s / w; let xx = x; lin.forEach((q) => { const qw = q.area / lh; ret.push({ q, x: xx, y, w: qw, h: lh }); xx += qw; }); y += lh; h -= lh; }
    }
    const n = lista.length;
    let o = "";
    ret.forEach(({ q, x, y, w, h }, k) => {
      const nivel = Math.max(0, 6 - Math.floor((q.i / Math.max(1, n - 1)) * 6.999)), cor = q.cor || COR.rampa[Math.max(2, nivel)];
      const inv = (q.cor ? true : nivel >= 3), p = q.y / tot, cabe = w > 60 && h > 34, cabe2 = w > 80 && h > 52;
      const maxC = Math.floor((w - 16) / 7.2), rot = String(q.rot).length > maxC ? String(q.rot).slice(0, Math.max(3, maxC - 1)) + "…" : q.rot;
      o += `<g class="pt tm" ${attrTip(dica(q.rot, [{ cor, rot: rotulo, val: fmt(q.y) }, { rot: "Participação", val: (p * 100).toFixed(1).replace(".", ",") + "%" }, ...(q.extra || [])], q.sub || ""))} ${attrGo(q.ir)}>` +
        `<rect class="b0" x="${x + 1.5}" y="${y + 1.5}" width="${Math.max(0, w - 3)}" height="${Math.max(0, h - 3)}" rx="6" fill="${cor}" style="animation-delay:${k * 15}ms"/>` +
        (cabe ? `<text x="${x + 10}" y="${y + 21}" class="${inv ? "inv" : "rt"}" font-weight="600">${esc(rot)}</text>` : "") +
        (cabe2 ? `<text x="${x + 10}" y="${y + 40}" class="${inv ? "inv" : "rt"}" opacity=".92">${esc(fmt(q.y))} · ${(p * 100).toFixed(0)}%</text>` : "") + `</g>`;
    });
    return moldura(W, H, o, titulo, id, "treemap", anim);
  }

  /* ---------- funil (etapas sucessivas). etapas:[{rot,y}] ---------- */
  function funil(op, st, id, anim) {
    const { etapas, fmt = (x) => nf.format(x), titulo = "" } = op;
    const W = st.W || 640, linha = 46, H = etapas.length * linha + 4, max = Math.max(1, ...etapas.map((e) => e.y || 0));
    const lr = Math.min(170 * AP(), W * 0.3 * AP()), pw = W - lr - 110, maxC = Math.floor((lr - 14) / CW());
    let o = "";
    etapas.forEach((e, i) => {
      const rot = String(e.rot).length > maxC ? String(e.rot).slice(0, maxC - 1) + "…" : e.rot;
      const w = Math.max(3, ((e.y || 0) / max) * pw), x = lr + (pw - w) / 2, y = i * linha + 6, conv = i > 0 && etapas[i - 1].y ? e.y / etapas[i - 1].y : null;
      const cor = e.cor || COR.rampa[Math.max(1, 6 - i)];
      o += `<g class="pt" ${attrTip(dica(e.rot, [{ cor, rot: "Quantidade", val: fmt(e.y) }, ...(conv != null ? [{ rot: "Da etapa anterior", val: (conv * 100).toFixed(1).replace(".", ",") + "%" }] : []), { rot: "Do início", val: ((e.y / (etapas[0].y || 1)) * 100).toFixed(1).replace(".", ",") + "%" }]))} ${attrGo(e.ir)}>` +
        `<rect class="hit" x="0" y="${y - 3}" width="${W}" height="${linha - 6}" rx="8"/><text x="${lr - 14}" y="${y + 21}" text-anchor="end" class="rt">${esc(rot)}</text>` +
        `<rect class="b" x="${x}" y="${y}" width="${w}" height="${linha - 14}" rx="6" fill="${cor}"/>` +
        `<text x="${lr + pw + 14}" y="${y + 16}" class="vl">${esc(fmt(e.y))}</text>${conv != null ? `<text x="${lr + pw + 14}" y="${y + 31}" class="tk">${(conv * 100).toFixed(0)}% da anterior</text>` : ""}</g>`;
    });
    return moldura(W, H, o, titulo, id, "funil", anim);
  }

  /* ---------- metas ("bullet"): trilho claro, previsão em azul claro, realizado em azul e a meta como marca escura.
     itens:[{rot, real, prev, meta, sub, extra?, ir?}]. A situação (≥100% no ritmo, ≥75% atenção, abaixo) vai em texto
     com símbolo à direita; it.cor é ignorado (a barra não muda de cor por situação). ---------- */
  function metas(op, st, id, anim) {
    const { itens, fmt = (x) => nf.format(x), titulo = "", larguraRot = 170, linha = 42 } = op;
    const W = st.W || 640, lr = Math.min(larguraRot * AP(), W * 0.34 * AP());
    const leg = chaves([{ tipo: "barra", nome: "realizado" }, { tipo: "barra", cor: COR.proj, nome: "previsão p/ o fim do mês" }, { tipo: "marca", nome: "meta" }], W - lr);
    const m = { l: lr, r: 96 * AP(), t: leg.altura + 14, b: 4 }, H = m.t + m.b + itens.length * linha;
    const max = Math.max(1, ...itens.map((i) => Math.max(i.real || 0, i.prev || 0, i.meta || 0))) * 1.04, pw = W - m.l - m.r, sx = (x) => m.l + (x / max) * pw;
    let o = `<g transform="translate(${m.l} 2)">${leg.svg}</g>`;
    const maxC = Math.floor((lr - 14) / CW());
    itens.forEach((it, i) => {
      const y = m.t + i * linha, esp = 18, oy = y + 8, real = it.real || 0, prev = it.prev || 0, meta = it.meta || 0;
      const at = meta ? prev / meta : null, sit = meta ? SIT(at) : null, pct = meta ? (at * 100).toFixed(0) + "%" : "";
      const rot = String(it.rot).length > maxC ? String(it.rot).slice(0, maxC - 1) + "…" : it.rot;
      const lin = [{ cor: COR.real, rot: "Realizado", val: fmt(real) }, { cor: COR.proj, rot: "Previsão (fim do mês)", val: fmt(prev) },
        ...(meta ? [{ cor: COR.meta, tipo: "regua", rot: "Meta", val: fmt(meta) }, { rot: "Previsão ÷ meta", val: `${sit.s} ${pct} · ${sit.n}` }] : []), ...(it.extra || [])];
      o += `<g class="pt lh" ${attrTip(dica(it.rot, lin, it.sub || ""))} ${attrGo(it.ir)}><rect class="hit" x="0" y="${y + 1}" width="${W}" height="${linha - 2}" rx="6"/>` +
        `<text x="${m.l - 10}" y="${y + 19}" text-anchor="end" class="rt">${esc(rot)}</text>${it.sub ? `<text x="${m.l - 10}" y="${y + 34}" text-anchor="end" class="tk" font-size="10.5">${esc(it.sub)}</text>` : ""}` +
        `<rect x="${m.l}" y="${oy}" width="${pw}" height="${esp}" rx="2" class="pista"/>` +
        (prev > real ? `<path d="${barraP(m.l, oy + 4, sx(prev) - m.l, esp - 8, 2)}" class="prev"/>` : "") +
        `<path class="b bh" d="${barraP(m.l, oy + 4, Math.max(real ? 2 : 0, sx(real) - m.l), esp - 8, 2)}" fill="${COR.real}"/>` +
        (meta ? `<line x1="${sx(meta)}" x2="${sx(meta)}" y1="${oy - 2}" y2="${oy + esp + 2}" class="meta"/>` : "") +
        `<text x="${W - m.r + 12}" y="${y + 19}" class="vl">${esc(fmt(real))}</text>` +
        (meta ? `<text x="${W - m.r + 12}" y="${y + 34}" font-size="11.5" class="${sit.c}">${sit.s} ${pct} prev.</text>` : `<text x="${W - m.r + 12}" y="${y + 34}" font-size="10.5" class="tk">prev. ${esc(fmt(prev))}</text>`) + `</g>`;
    });
    return moldura(W, H, o, titulo, id, "metas", anim);
  }

  /* ---------- acumulado do mês: realizado (linha cheia) até hoje, projeção (tracejada) até o fim do mês, meta (régua).
     op: { dias:[{dia, real (acumulado até o dia) | null, proj | null, nome?}], meta, hoje (nº do dia), mes?: "AAAA-MM",
           fmt?, titulo?, rotuloReal?, rotuloProj?, altura? }. Mouse e setas do teclado leem dia a dia. ---------- */
  const SEM = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  function acumulado(op, st, id, anim) {
    const { dias, meta = 0, hoje = null, mes = "", fmt = (x) => nf.format(x), titulo = "", altura = 260,
      rotuloReal = "Realizado acumulado", rotuloProj = "Projeção pelo ritmo atual" } = op;
    const W = st.W || 640, fe = fmtEixo(fmt), n = dias.length, ultDia = dias[n - 1]?.dia || n;
    const real = dias.filter((d) => d.real != null), ult = real[real.length - 1];
    let pj = dias.filter((d) => d.proj != null && (!ult || d.dia >= ult.dia));
    if (ult && pj.length && pj[0].dia > ult.dia) pj = [{ dia: ult.dia, proj: ult.real }, ...pj];   // projeção sai do último ponto real
    const fim = pj.length > 1 ? pj[pj.length - 1] : null, dHoje = hoje ?? ult?.dia ?? null;
    const leg = chaves([{ tipo: "linha", nome: rotuloReal }, ...(fim ? [{ tipo: "proj", nome: rotuloProj }] : []), ...(meta ? [{ tipo: "regua", nome: "Meta do mês" }] : [])], W);
    const e = escala(Math.max(meta, ...dias.map((d) => Math.max(d.real || 0, d.proj || 0)), 1) * 1.06);
    const fs = 12.5 * AP(), lt = (s) => String(s).length * fs * 0.58;           // texto em negrito é um pouco mais largo
    const m = { l: Math.max(40, larguraTxt(fe(e.topo)) + 18), r: fim ? Math.max(66 * AP(), lt(fmt(fim.proj)) + 18) : 18, t: leg.altura + 30, b: 30 };
    const H = altura + leg.altura, pw = W - m.l - m.r;
    const px = (d) => m.l + ((d - 1) / Math.max(1, ultDia - 1)) * pw, py = (v) => m.t + (1 - (v - e.base) / (e.topo - e.base)) * (H - m.t - m.b);
    let o = `<g transform="translate(0 2)">${leg.svg}</g>` + gradeY(m, W, H, e, fe);
    // eixo X: 1, 5, 10, 15, 20, 25 e o último (some o que encostaria no último)
    [1, 5, 10, 15, 20, 25].filter((d) => d < ultDia && px(ultDia) - px(d) >= 24 * AP()).concat(ultDia)
      .forEach((d) => { o += `<text x="${px(d)}" y="${H - m.b + 19}" text-anchor="middle" class="tk">${String(d).padStart(2, "0")}</text>`; });
    // rótulos posicionados sem sobreposição: tenta cada lugar até achar um livre
    const ocup = [], caixa = (x, y, w, a) => { const x0 = a === "end" ? x - w : a === "middle" ? x - w / 2 : x; return [x0, y - fs, x0 + w, y + 3]; };
    const livre = (c) => c[0] >= m.l - 2 && c[2] <= W - 2 && c[1] >= 0 && c[3] <= H - m.b && !ocup.some((b) => c[0] < b[2] && b[0] < c[2] && c[1] < b[3] && b[1] < c[3]);
    const rotulo = (s, lugares, cls = "ac-rot") => {
      const w = cls === "tk" ? larguraTxt(s) * AP() : lt(s), ok = lugares.find(([x, y, a]) => livre(caixa(x, y, w, a))) || lugares[0];
      ocup.push(caixa(ok[0], ok[1], w, ok[2]));
      return `<text x="${ok[0]}" y="${ok[1]}" text-anchor="${ok[2]}" class="${cls}">${esc(s)}</text>`;
    };
    if (dHoje) o += `<line x1="${px(dHoje)}" x2="${px(dHoje)}" y1="${m.t}" y2="${H - m.b}" class="ac-hoje"/>` + rotulo("hoje", [[px(dHoje), m.t - 8, "middle"]], "tk");
    if (meta) {
      const ym = py(meta) - 7;
      o += `<line x1="${m.l}" x2="${W - m.r}" y1="${py(meta)}" y2="${py(meta)}" class="ac-meta"/>` +
        rotulo(`Meta do mês: ${fmt(meta)}`, [[m.l + 6, ym, "start"], [px(dHoje || 1) + 22, ym, "start"], [W - m.r - 6, ym, "end"], [m.l + 6, ym + 21, "start"]]);
    }
    if (real.length) {
      const P = real.map((d) => [px(d.dia), py(d.real)]);
      o += `<path class="ac-area" d="M${P[0][0]},${py(0)}L${P.map((p) => p.join(",")).join("L")}L${P[P.length - 1][0]},${py(0)}Z"/>` +
        `<path class="ac-real ln" pathLength="1" d="M${P.map((p) => p.join(",")).join("L")}"/>`;
    }
    if (fim) o += `<path class="ac-proj" d="M${pj.map((d) => `${px(d.dia)},${py(d.proj)}`).join("L")}"/>` +
      `<circle cx="${px(fim.dia)}" cy="${py(fim.proj)}" r="4.5" class="ac-pt-proj"/>` +
      `<text x="${W - m.r + 10}" y="${py(fim.proj) + 4}" class="ac-rot">${esc(fmt(fim.proj))}</text><text x="${W - m.r + 10}" y="${py(fim.proj) + 19}" class="tk">projeção</text>`;
    if (ult) {
      const x = px(ult.dia), y = py(ult.real);
      o += `<circle cx="${x}" cy="${y}" r="4.5" class="ac-pt-real"/>` +
        rotulo(`${fmt(ult.real)} até hoje`, [[x - 9, y - 10, "end"], [x + 9, y + 20, "start"], [x - 9, y + 20, "end"], [x + 9, y - 10, "start"]]);
    }
    // camada de leitura: uma coluna por dia (cruz + pontos + dica); o grupo recebe o foco e anda com as setas
    const dx = pw / Math.max(1, ultDia - 1), iHoje = Math.max(0, dias.findIndex((d) => d.dia === dHoje));
    let cols = "";
    dias.forEach((d, i) => {
      const [aa, mm] = mes.split("-").map(Number), dd = String(d.dia).padStart(2, "0");
      const tit = (aa && mm ? `${SEM[new Date(Date.UTC(aa, mm - 1, d.dia)).getUTCDay()]}, ${dd}/${String(mm).padStart(2, "0")}` : `Dia ${dd}`) + (d.nome ? " · " + d.nome : "");
      const ant = i > 0 ? dias[i - 1].real : null, lin = [];
      if (d.real != null) {
        lin.push({ cor: COR.real, tipo: "linha", rot: "Acumulado no mês", val: fmt(d.real) });
        if (i === 0 || ant != null) lin.push({ cor: COR.real, tipo: "linha fina", rot: "No dia", val: fmt(d.real - (ant || 0)) });
      } else if (d.proj != null) lin.push({ cor: COR.proj, tipo: "tracejada", rot: rotuloProj, val: fmt(d.proj) });
      if (meta) lin.push({ cor: COR.meta, tipo: "regua", rot: "Meta do mês", val: fmt(meta) });
      const v = d.real ?? d.proj, rod = meta && v != null ? `${((v / meta) * 100).toFixed(0)}% da meta${d.real == null ? ", se o ritmo continuar" : ""}` : "";
      const x = px(d.dia);
      cols += `<g class="pt col" ${attrTip(dica(tit, lin.length ? lin : [{ rot: "Sem dados", val: "" }], rod))}><rect class="hit0" x="${x - dx / 2}" y="${m.t - 6}" width="${dx}" height="${H - m.t - m.b + 6}" fill="transparent"/>` +
        `<line class="guia" x1="${x}" x2="${x}" y1="${m.t}" y2="${H - m.b}"/>` +
        (d.real != null ? `<circle class="dot" cx="${x}" cy="${py(d.real)}" r="4" fill="${COR.real}" stroke="${COR.fundo}" stroke-width="2"/>` : d.proj != null ? `<circle class="dot" cx="${x}" cy="${py(d.proj)}" r="4" fill="${COR.fundo}" stroke="${COR.real}" stroke-width="2"/>` : "") + `</g>`;
    });
    o += `<g class="teclas" tabindex="0" role="group" aria-label="Leitura dia a dia: use as setas para a esquerda e para a direita" data-teclas="" data-foco="${iHoje}">${cols}</g>`;
    const resumo = [titulo || rotuloReal, ult ? `${fmt(ult.real)} até o dia ${ult.dia}` : "", fim ? `projeção ${fmt(fim.proj)}` : "", meta ? `meta ${fmt(meta)}` : ""].filter(Boolean).join("; ");
    return moldura(W, H, o, resumo, id, "acumulado", anim);
  }

  /* ---------- série do mês: acumulado real até hoje e projeção até o fim do mês pelo ritmo por dia útil.
     op: { inicio: "AAAA-MM-01", dias: nº de dias do mês, hoje (nº do dia; null = mês fechado), feriados: ["AAAA-MM-DD"], porDia: [BL de cada dia], real (acumulado de hoje), prev (fim do mês) }.
     Devolve { dias:[{dia, real, proj}], uteis:[acumulado de dias úteis até cada dia, U[0] = 0] }: sábado vale meio dia; domingos e feriados não contam. ---------- */
  function serieMes({ inicio, dias: n, hoje, feriados = [], porDia = [], real = null, prev = null }) {
    const fer = new Set(feriados), h = hoje ?? n;
    const peso = (d) => { const iso = inicio.slice(0, 8) + String(d).padStart(2, "0"), w = new Date(iso + "T12:00:00Z").getUTCDay(); return fer.has(iso) || w === 0 ? 0 : w === 6 ? 0.5 : 1; };
    const U = [0]; for (let d = 1; d <= n; d++) U[d] = U[d - 1] + peso(d);
    let ac = 0;
    const r0 = porDia.slice(0, h).reduce((s, v) => s + (v || 0), 0), atual = real ?? r0, fim = prev ?? atual, resto = U[n] - U[h];
    return { uteis: U, dias: Array.from({ length: n }, (_, i) => {
      const d = i + 1; if (d <= h) ac += porDia[i] || 0;
      return { dia: d, real: d <= h ? ac : null, proj: h < n && d >= h ? Math.round(atual + (fim - atual) * (resto ? (U[d] - U[h]) / resto : 0)) : null };
    }) };
  }

  /* ---------- trajetória (pequeno múltiplo): acumulado em % da própria meta, na mesma escala para todas as equipes.
     Linha cheia = realizado, tracejada = projeção, régua = meta (100%), pontilhado = ritmo necessário para fechar em 100% (pelos dias úteis).
     op: { rot, dias:[{dia, real, proj}] (de serieMes), uteis (de serieMes), meta, hoje, topo?: 1.25, altura?: 120 }. ---------- */
  function trajetoria(op, st, id, anim) {
    const { dias, uteis: U, meta, hoje = null, rot = "", altura = 120 } = op;
    const W = st.W || 260, H = altura, n = dias.length, ult = dias.filter((d) => d.real != null).pop(), fim = dias[n - 1];
    const v = (x) => x / meta, topo = Math.max(op.topo || 1.25, Math.ceil(Math.max(...dias.map((d) => v(d.real ?? d.proj ?? 0))) * 4) / 4);
    const m = { l: 34, r: 8, t: 6, b: 20 }, px = (d) => m.l + ((d - 1) / Math.max(1, n - 1)) * (W - m.l - m.r), py = (x) => m.t + (1 - x / topo) * (H - m.t - m.b);
    let o = "";
    for (let x = 0; x <= topo + 1e-9; x += 0.25) if (x === 0 || x === 1 || W > 200 || x === 0.5) o += `<line x1="${m.l}" x2="${W - m.r}" y1="${py(x)}" y2="${py(x)}" class="${x ? "gr" : "eixo"}"/><text x="${m.l - 5}" y="${py(x) + 4}" text-anchor="end" class="tk">${Math.round(x * 100)}%</text>`;
    [1, 15, n].forEach((d) => (o += `<text x="${px(d)}" y="${H - 4}" text-anchor="middle" class="tk">${String(d).padStart(2, "0")}</text>`));
    o += `<path class="tr-ideal" d="M${dias.map((d) => `${px(d.dia)},${py(U[d.dia] / U[n])}`).join("L")}"/>`;
    o += `<line x1="${m.l}" x2="${W - m.r}" y1="${py(1)}" y2="${py(1)}" class="ac-meta"/>`;
    if (hoje && hoje < n) o += `<line x1="${px(hoje)}" x2="${px(hoje)}" y1="${m.t}" y2="${H - m.b}" class="ac-hoje"/>`;
    const R = dias.filter((d) => d.real != null).map((d) => `${px(d.dia)},${py(v(d.real))}`);
    if (R.length) o += `<path class="ac-area" d="M${px(1)},${py(0)}L${R.join("L")}L${px(ult.dia)},${py(0)}Z"/><path class="ac-real" d="M${R.join("L")}"/>`;
    const P = dias.filter((d) => d.proj != null);
    if (P.length > 1) o += `<path class="ac-proj" d="M${P.map((d) => `${px(d.dia)},${py(v(d.proj))}`).join("L")}"/><circle cx="${px(fim.dia)}" cy="${py(v(fim.proj))}" r="3.5" class="ac-pt-proj"/>`;
    if (ult) o += `<circle cx="${px(ult.dia)}" cy="${py(v(ult.real))}" r="3.5" class="ac-pt-real"/>`;
    const resumo = `${rot}: ${ult ? `${Math.round(v(ult.real) * 100)}% da meta até o dia ${ult.dia}` : "sem vendas"}${P.length > 1 ? `, projeção ${Math.round(v(fim.proj) * 100)}%` : ""}`;
    return moldura(W, H, o, resumo, id, "trajetoria", anim);
  }

  /* ---------- régua das equipes (HTML, não SVG): realizado, projeção, meta e "esperado até hoje" na mesma escala para todas.
     Duas leituras, trocadas no próprio bloco sem redesenhar: "% da meta" (toda meta no 100%) e "Quantidade". A escolha fica guardada no navegador.
     op: { itens:[{rot, sub, real, prev, meta, esp, ritmo, nec, href?, chave?}], total?: {mesmos campos}, un: "BL" }.
     esp = onde a meta pede estar hoje (meta × dias úteis decorridos ÷ dias úteis do mês); ritmo / nec = BL por dia útil, feito e necessário.
     href: a linha vira link; chave: a linha vira botão com data-rg-chave (a tela trata o clique). ---------- */
  const MODO_RG = "seven:regua-modo";
  const modoRegua = () => { try { return localStorage.getItem(MODO_RG) === "qtd" ? "qtd" : "pct"; } catch { return "pct"; } };
  function regua(op) {
    const { itens, total = null, un = "BL" } = op, todos = total ? [...itens, total] : itens, modo = modoRegua();
    const maxQ = Math.max(1, ...todos.filter((i) => i !== total).map((i) => Math.max(i.real || 0, i.prev || 0, i.meta || 0))) * 1.04;
    const maxP = Math.max(1.25, ...todos.filter((i) => i.meta).map((i) => (i.prev || 0) / i.meta)) * 1.02;
    const q = (x) => Math.min(100, (x / maxQ) * 100).toFixed(2) + "%", p = (x, i) => (i.meta ? Math.min(100, (x / i.meta / maxP) * 100).toFixed(2) + "%" : "0%");
    const d1 = (x) => (x == null || !isFinite(x) ? "–" : x.toFixed(1).replace(".", ","));
    const passo = escala(maxQ / 1.04).passo, tq = [], tp = [0, 0.25, 0.5, 0.75, 1, 1.25].filter((t) => t <= maxP);
    for (let t = 0; t <= maxQ; t += passo) tq.push(t);
    const eixo = `<div class="rg-eixo" aria-hidden="true">${tp.map((t) => `<span class="p" style="left:${((t / maxP) * 100).toFixed(2)}%">${Math.round(t * 100)}%</span>`).join("")}${tq.map((t) => `<span class="q" style="left:${q(t)}">${nf.format(t)}</span>`).join("")}</div>`;
    const linha = (i, tot) => {
      const at = i.meta ? (i.prev ?? i.real) / i.meta : null, s = at != null ? SIT(at) : null, atr = i.meta && i.esp != null ? Math.round(i.esp - i.real) : null;
      const pos = (k, x) => `--${k}q:${q(x)};--${k}p:${p(x, i)}`;
      const barra = `<div class="rg-trilho" aria-hidden="true"><span class="pista"></span><span class="pr" style="${pos("w", Math.max(i.prev || 0, i.real))}"></span><span class="re" style="${pos("w", i.real)}"></span>` +
        (i.meta ? `<span class="mt" style="${pos("x", i.meta)}"></span>` : "") + (i.meta && i.esp != null ? `<span class="esp" style="${pos("x", i.esp)}" title="Esperado até hoje: ${nf.format(Math.round(i.esp))} ${un}"></span>` : "") + `</div>`;
      const det = [i.prev != null ? `proj. ${nf.format(i.prev)}` : "", atr == null ? "" : atr > 0 ? `${nf.format(atr)} atrás do esperado` : `${nf.format(-atr)} à frente do esperado`,
        i.nec != null && i.meta ? `precisa ${d1(i.nec)}/dia (faz ${d1(i.ritmo)})` : ""].filter(Boolean).join(" · ");
      const num = `<div class="rg-num"><span class="v">${nf.format(i.real)}${i.meta ? ` <small>de ${nf.format(i.meta)}</small>` : ""}</span>` +
        (s ? `<span class="s ${s.c}" title="Projeção ÷ meta: ${s.n}">${s.s} ${Math.round(at * 100)}%</span>` : `<span class="s mut">sem meta</span>`) + (det ? `<span class="f">${esc(det)}</span>` : "") + `</div>`;
      const aria = `${i.rot}: ${nf.format(i.real)} ${un}${i.meta ? ` de ${nf.format(i.meta)}` : ""}${i.prev != null ? `, projeção ${nf.format(i.prev)}` : ""}${s ? ` (${Math.round(at * 100)}% da meta, ${s.n})` : ""}${det ? `; ${det}` : ""}`;
      const corpo = `<div class="rg-nome"><b>${esc(i.rot)}</b>${i.sub ? `<span>${esc(i.sub)}</span>` : ""}</div>${barra}${num}`;
      return tot ? `<div class="rg-lin rg-tot" role="listitem" aria-label="${esc(aria)}">${corpo}</div>`
        : i.href ? `<a class="rg-lin" role="listitem" href="${esc(i.href)}" aria-label="${esc(aria)}">${corpo}</a>`
        : i.chave != null ? `<button type="button" class="rg-lin" role="listitem" data-rg-chave="${esc(i.chave)}" aria-label="${esc(aria)}">${corpo}</button>`
        : `<div class="rg-lin" role="listitem" aria-label="${esc(aria)}">${corpo}</div>`;
    };
    return `<div class="rg ${modo}"><div class="rg-ctl"><div class="seg" role="group" aria-label="Escala da régua">${[["pct", "% da meta"], ["qtd", `Quantidade (${un})`]].map(([k, n]) => `<button type="button" data-rg-modo="${k}" class="${modo === k ? "on" : ""}" aria-pressed="${modo === k}">${n}</button>`).join("")}</div>
      <div class="rg-leg"><span><i class="chv barra"></i>Realizado</span><span><i class="chv barra proj"></i>Projeção</span><span><i class="chv tick"></i>Meta</span><span><i class="chv esp"></i>Esperado até hoje</span></div></div>
      <div class="rg-lista" role="list"><div class="rg-lin rg-cab" aria-hidden="true"><div class="rg-nome"><span>${esc(op.rotuloNome || "Equipe")}</span></div>${eixo}<div class="rg-num"><span>Vendida · proj. ÷ meta</span></div></div>${itens.map((i) => linha(i)).join("")}${total ? linha(total, true) : ""}</div></div>`;
  }
  function trocarRegua(btn) {
    const k = btn.dataset.rgModo; try { localStorage.setItem(MODO_RG, k); } catch {}
    document.querySelectorAll(".rg").forEach((rg) => {   // todas as réguas da tela ficam na mesma leitura
      rg.classList.toggle("pct", k === "pct"); rg.classList.toggle("qtd", k === "qtd");
      rg.querySelectorAll("[data-rg-modo]").forEach((b) => { b.classList.toggle("on", b.dataset.rgModo === k); b.setAttribute("aria-pressed", String(b.dataset.rgModo === k)); });
    });
  }

  /* ---------- dados em tabela / CSV / Excel ---------- */
  const TABELA = {
    colunas: (op) => [["Categoria", op.rotuloY || "Valor"], ...op.dados.map((d) => [d.x, d.y])],
    empilhadas: (op) => [["Categoria", ...op.series.map((s) => s.nome), "Total"], ...op.cats.map((c, i) => [c, ...op.series.map((s) => s.valores[i]), op.series.reduce((a, s) => a + (s.valores[i] || 0), 0)])],
    linhas: (op) => [["Categoria", ...op.series.map((s) => s.nome)], ...op.cats.map((c, i) => [c, ...op.series.map((s) => s.valores[i])])],
    barrasH: (op) => [["Item", op.rotuloX || "Valor", ...(op.dados.some((d) => d.n != null) ? ["Base (n)"] : [])], ...op.dados.map((d) => [d.rot, d.y, ...(op.dados.some((x) => x.n != null) ? [d.n ?? ""] : [])])],
    rosca: (op) => [["Parte", "Quantidade"], ...op.partes.map((p) => [p.rot, p.y])],
    pareto: (op) => [["Motivo", "Contratos"], ...op.dados.map((d) => [d.rot, d.y])],
    dispersao: (op) => [["Item", op.rotuloX, op.rotuloY], ...op.pontos.map((p) => [p.rot, p.x, p.y])],
    calor: (op) => [["Dia", op.rotulo || "Vendas", "Observação"], ...op.dias.map((d) => [d.d.split("-").reverse().join("/"), d.v || 0, d.nome || ""])],
    treemap: (op) => [["Item", op.rotulo || "Vendas"], ...op.itens.map((d) => [d.rot, d.y])],
    funil: (op) => [["Etapa", "Quantidade"], ...op.etapas.map((d) => [d.rot, d.y])],
    metas: (op) => [["Item", "Realizado", "Previsão", "Meta", "Previsão ÷ meta"], ...op.itens.map((d) => [d.rot, d.real, d.prev, d.meta ?? "", d.meta ? `${SIT(d.prev / d.meta).s} ${((d.prev / d.meta) * 100).toFixed(0)}% · ${SIT(d.prev / d.meta).n}` : ""])],
    trajetoria: (op) => [["Dia", "Realizado acumulado", "Projeção", "% da meta"], ...op.dias.map((d) => [d.dia, d.real ?? null, d.real == null ? d.proj ?? null : null, op.meta ? Math.round(((d.real ?? d.proj ?? 0) / op.meta) * 100) + "%" : ""])],
    acumulado: (op) => {
      const mm = String(op.mes || "").slice(5, 7);
      return [["Dia", "No dia", op.rotuloReal || "Realizado acumulado", op.rotuloProj || "Projeção pelo ritmo atual", "Meta do mês"],
        ...op.dias.map((d, i) => [mm ? `${String(d.dia).padStart(2, "0")}/${mm}` : d.dia, d.real != null && (i === 0 || op.dias[i - 1].real != null) ? d.real - (i ? op.dias[i - 1].real : 0) : null, d.real ?? null, d.real == null ? d.proj ?? null : null, op.meta ?? null])];
    },
  };
  const DESENHO = { rosca, colunas, empilhadas, linhas, barrasH, pareto, dispersao, calor, treemap, funil, metas, acumulado, trajetoria };

  function registrar(tipo, op) {
    const id = ++seq;
    if (REG.size > 400) REG.delete(REG.keys().next().value);
    const st = { tipo, op, ocultas: new Set(), W: 0 };
    REG.set(id, st);
    return DESENHO[tipo](op, st, id, true);
  }
  const pub = (tipo) => (op) => registrar(tipo, op);
  /** Dados de um gráfico (para exportar): { titulo, linhas } */
  const dados = (cid) => { const st = REG.get(+cid); return st ? { titulo: st.op.titulo || st.tipo, linhas: TABELA[st.tipo](st.op) } : null; };

  /* ---------- tamanho real: redesenha cada gráfico na largura do seu painel ---------- */
  function ajustar(svg, forcar) {
    const st = REG.get(+svg.dataset.cid); if (!st) return;
    // largura útil do recipiente (sem o recuo interno): o desenho sai 1:1, sem encolher nem sobrar faixa embaixo
    const p = svg.parentElement, cs = p ? getComputedStyle(p) : null;
    const w = Math.round((p?.clientWidth || 0) - (cs ? (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) : 0)); if (w < 120) return;
    const alvo = Math.max(st.tipo === "trajetoria" ? 140 : 260, w);   // pequenos múltiplos cabem em duas colunas no celular
    if (!forcar && Math.abs(alvo - (+svg.dataset.w || 0)) <= 4) return;
    const primeira = !st.W; st.W = alvo;
    svg.outerHTML = DESENHO[st.tipo](st.op, st, +svg.dataset.cid, primeira);
  }
  const ajustarTodos = (forcar) => document.querySelectorAll("svg.chart[data-cid]").forEach((s) => ajustar(s, forcar));

  /* ---------- interação (uma vez, no documento) ---------- */
  let tip = null, pronto = false, decorarT, redimT;
  function iniciar() {
    if (pronto) return; pronto = true;
    // gradientes compartilhados das barras (camada de luz): luz no topo da coluna / na ponta da barra, sombra leve na base
    const gl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    gl.setAttribute("width", "0"); gl.setAttribute("height", "0"); gl.setAttribute("aria-hidden", "true"); gl.style.cssText = "position:absolute;width:0;height:0";
    gl.innerHTML = `<defs><linearGradient id="gl-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".10"/></linearGradient>
      <linearGradient id="gl-h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".08"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".28"/></linearGradient></defs>`;
    document.body.appendChild(gl);
    tip = document.createElement("div"); tip.id = "tip"; tip.setAttribute("role", "tooltip"); document.body.appendChild(tip);
    const esconder = () => { tip.style.display = "none"; };
    document.addEventListener("mousemove", (e) => {
      const el = e.target.closest?.(".chart [data-tip]");
      if (!el) return esconder();
      if (tip.dataset.de !== el.dataset.tip) { tip.innerHTML = el.dataset.tip; tip.dataset.de = el.dataset.tip; }
      tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = e.clientX + 16, y = e.clientY + 16;
      if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 16;
      if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 16;
      tip.style.left = Math.max(4, x) + "px"; tip.style.top = Math.max(4, y) + "px";
    });
    document.addEventListener("mouseleave", esconder);
    document.addEventListener("scroll", esconder, true);
    document.addEventListener("click", (e) => {
      const rg = e.target.closest?.("[data-rg-modo]");
      if (rg) return trocarRegua(rg);
      const leg = e.target.closest?.("[data-leg]");
      if (leg) return alternar(leg);
      const go = e.target.closest?.("[data-go]");
      if (go) { esconder(); try { window.SEVEN_GO?.(JSON.parse(go.dataset.go)); } catch {} return; }
      const csv = e.target.closest?.("[data-csv]");
      if (csv) return baixar(csv);
      const tb = e.target.closest?.("[data-tab]");
      if (tb) return verTabela(tb);
      if (!e.target.closest?.(".chart")) esconder();
    });
    // leitura pelo teclado (acumulado): o grupo [data-teclas] guarda o dia em foco; as setas movem a cruz e a dica
    const cruzar = (k, i) => {
      const cols = k.querySelectorAll(".col"); if (!cols[i]) return;
      k.dataset.foco = i; cols.forEach((c, j) => c.classList.toggle("on", j === i));
      const g = cols[i].querySelector(".guia").getBoundingClientRect();
      tip.innerHTML = cols[i].dataset.tip; tip.dataset.de = cols[i].dataset.tip; tip.style.display = "block";
      const r = tip.getBoundingClientRect();
      let x = g.left + 14; if (x + r.width > innerWidth - 8) x = g.left - r.width - 14;
      tip.style.left = Math.max(4, x) + "px"; tip.style.top = Math.max(4, Math.min(innerHeight - r.height - 8, g.top + 8)) + "px";
    };
    document.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("[data-leg]")) { e.preventDefault(); alternar(e.target); }
      const k = e.target.matches?.("[data-teclas]") ? e.target : null;
      if (k && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const n = k.querySelectorAll(".col").length, i = +k.dataset.foco || 0;
        cruzar(k, e.key === "Home" ? 0 : e.key === "End" ? n - 1 : Math.max(0, Math.min(n - 1, i + (e.key === "ArrowRight" ? 1 : -1))));
      }
    });
    document.addEventListener("focusin", (e) => { if (e.target.matches?.("[data-teclas]")) cruzar(e.target, +e.target.dataset.foco || 0); });
    document.addEventListener("focusout", (e) => { if (e.target.matches?.("[data-teclas]")) { e.target.querySelectorAll(".col.on").forEach((c) => c.classList.remove("on")); esconder(); } });
    // ajuste de largura roda no próprio observador (antes da pintura): o usuário não vê o desenho provisório
    new MutationObserver(() => { ajustarTodos(false); clearTimeout(decorarT); decorarT = setTimeout(decorar, 60); }).observe(document.body, { childList: true, subtree: true });
    addEventListener("resize", () => { clearTimeout(redimT); redimT = setTimeout(() => ajustarTodos(false), 120); });
    document.addEventListener("transitionend", (e) => { if (e.target.classList?.contains("conteudo") || e.target.id === "ct" || e.target === document.body) ajustarTodos(false); });
  }

  function alternar(leg) {
    const svg = leg.closest("svg.chart"), st = REG.get(+svg.dataset.cid);
    if (!st) return;
    const i = +leg.dataset.leg, total = (st.op.series || st.op.partes).length;
    if (st.ocultas.has(i)) st.ocultas.delete(i);
    else if (st.ocultas.size < total - 1) st.ocultas.add(i);   // sempre sobra ao menos uma série visível
    svg.outerHTML = DESENHO[st.tipo](st.op, st, +svg.dataset.cid, false);
    tip && (tip.style.display = "none");
  }

  const ICS = {
    tab: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10"/></svg>',
    csv: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/></svg>',
  };
  /** Botões "Tabela" e "Baixar" no cabeçalho de cada painel que tem gráfico. */
  function decorar() {
    document.querySelectorAll(".painel").forEach((p) => {
      const svg = p.querySelector("svg.chart[data-cid]"), h2 = p.querySelector(":scope > h2");
      if (!h2) return;
      const ja = h2.querySelector("[data-csv]");
      if (!svg) { if (ja && !p.querySelector(".tv")) { ja.remove(); h2.querySelector("[data-tab]")?.remove(); } return; }
      if (ja) { ja.dataset.csv = svg.dataset.cid; h2.querySelector("[data-tab]").dataset.tab = svg.dataset.cid; return; }
      const mk = (cls, attr, ic, ttl) => { const b = document.createElement("button"); b.type = "button"; b.className = "csv " + cls; b.dataset[attr] = svg.dataset.cid; b.title = ttl; b.setAttribute("aria-label", ttl); b.innerHTML = ic; return b; };
      const a = mk("tbl", "tab", ICS.tab, "Ver os números em tabela"), c = mk("", "csv", ICS.csv, "Baixar os dados deste gráfico (CSV)");
      h2.append(a, c);
    });
  }
  function verTabela(btn) {
    const corpo = btn.closest(".painel").querySelector(".corpo"), tv = corpo.querySelector(".tv"), svg = corpo.querySelector("svg.chart");
    if (tv) { tv.remove(); btn.classList.remove("on"); corpo.querySelectorAll("svg.chart").forEach((x) => (x.style.display = "")); return; }
    const st = REG.get(+btn.dataset.tab); if (!st) return;
    const l = TABELA[st.tipo](st.op), cel = (x) => (typeof x === "number" ? nf.format(x) : esc(x ?? "–"));
    const d = document.createElement("div"); d.className = "tv tab";
    d.innerHTML = `<table><thead><tr>${l[0].map((h, i) => `<th class="${i ? "num" : ""}">${esc(h)}</th>`).join("")}</tr></thead><tbody>${l.slice(1).map((r) => `<tr>${r.map((x, i) => `<td class="${i ? "num" : ""}">${cel(x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    if (svg) svg.style.display = "none";
    (svg || corpo).insertAdjacentElement("afterend", d); btn.classList.add("on");
  }
  function baixar(btn) {
    const st = REG.get(+btn.dataset.csv); if (!st) return;
    const linhas = TABELA[st.tipo](st.op);
    const cel = (x) => { const t = x == null ? "" : typeof x === "number" ? String(x).replace(".", ",") : String(x); return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
    const txt = "﻿" + linhas.map((l) => l.map(cel).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" }));
    a.download = "grafico-" + (st.op.titulo || st.tipo).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-") + ".csv";
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  return { COR, iniciar, spark, mini, abrev, dados, colunas: pub("colunas"), empilhadas: pub("empilhadas"), linhas: pub("linhas"), barrasH: pub("barrasH"), pareto: pub("pareto"), rosca: pub("rosca"), dispersao: pub("dispersao"), calor: pub("calor"), treemap: pub("treemap"), funil: pub("funil"), metas: pub("metas"), acumulado: pub("acumulado"), trajetoria: pub("trajetoria"), regua, serieMes };
})();
