"use strict";
/* Seven One · apresentação executiva: motor do tour.
   - Passos (cenas) e capítulos vêm de cenas.js. Cada passo pode declarar um "evento" que altera a história da venda.
   - O estado de cada passo é RECALCULADO do zero (estado inicial + eventos dos passos 0..i): avançar, voltar,
     pular capítulo ou reiniciar nunca duplica mensagens, vendas ou avisos, e a história fica sempre consistente.
   - Nada aqui fala com o servidor: a demonstração é estática. Dados fictícios. */
window.TOUR = (() => {
  const CAPS = [], PASSOS = [], APROF = {};
  let i = 0, estadoBase = () => ({}), t0 = null, canal = null, ultimoRender = -1;
  const q = new URLSearchParams(location.search);
  const APRESENTADOR = q.has("apresentador");
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mmss = (seg) => { seg = Math.max(0, Math.round(seg)); return String(Math.floor(seg / 60)).padStart(2, "0") + ":" + String(seg % 60).padStart(2, "0"); };

  /* ---------- registro (cenas.js) ---------- */
  const capitulo = (c) => CAPS.push(c);
  const passo = (p) => PASSOS.push(p);
  const aprofundamento = (id, a) => (APROF[id] = a);
  const inicial = (fn) => (estadoBase = fn);
  /** Define a ordem dos capítulos depois que todos os arquivos registraram os seus. Capítulos fora da lista saem do percurso. */
  const ordenar = (ids) => {
    const pos = (id) => ids.indexOf(id);
    const caps = CAPS.filter((c) => pos(c.id) >= 0).sort((a, b) => pos(a.id) - pos(b.id));
    const ps = PASSOS.map((p, n) => ({ p, n })).filter((x) => pos(x.p.cap) >= 0).sort((a, b) => pos(a.p.cap) - pos(b.p.cap) || a.n - b.n).map((x) => x.p);
    CAPS.splice(0, CAPS.length, ...caps); PASSOS.splice(0, PASSOS.length, ...ps);
  };

  /* ---------- estado da história no passo k: replay determinístico ---------- */
  function estado(k) {
    const S = estadoBase();
    for (let j = 0; j <= k && j < PASSOS.length; j++) if (typeof PASSOS[j].evento === "function") PASSOS[j].evento(S);
    return S;
  }
  const capDe = (p) => CAPS.find((c) => c.id === p.cap) || CAPS[0];
  const indiceCap = (p) => CAPS.indexOf(capDe(p));
  const primeiroDoCap = (id) => PASSOS.findIndex((p) => p.cap === id);
  const tempoAte = (k) => PASSOS.slice(0, k).reduce((s, p) => s + (p.tempo || 0), 0);   // segundos previstos até o início do passo k
  const tempoTotal = () => tempoAte(PASSOS.length);
  const tempoCap = (id) => PASSOS.filter((p) => p.cap === id).reduce((s, p) => s + (p.tempo || 0), 0);

  /* ---------- escala do palco (1920×1080 cabe em qualquer tela) ---------- */
  function escalar() {
    const m = $("#moldura"), p = $("#palco");
    if (!m || !p) return;
    const r = m.getBoundingClientRect();
    const k = Math.min(r.width / 1920, r.height / 1080);
    p.style.transform = `translate(-50%,-50%) scale(${k})`;
  }

  /* ---------- render ---------- */
  function render(motivo) {
    const p = PASSOS[i];
    if (!p) return;
    const S = estado(i);
    const palco = $("#palco");
    if (palco && !APRESENTADOR) {
      const html = typeof p.cena === "function" ? p.cena(S, { esc }) : p.cena;
      palco.innerHTML = `<div class="cena ${p.classe || ""}" data-passo="${p.id}">${html}<span class="selo-demo"><i></i>Demonstração · dados fictícios</span></div>`;
      // rótulos: elementos com data-rotulo ganham um balão posicionado acima
      palco.querySelectorAll("[data-rotulo]").forEach((el) => {
        const r = document.createElement("span"); r.className = "rotulo" + (el.dataset.rotuloPos === "baixo" ? " baixo" : "");
        r.textContent = el.dataset.rotulo; el.style.position = el.style.position || "relative"; el.appendChild(r);
        r.style.left = "0"; r.style[el.dataset.rotuloPos === "baixo" ? "bottom" : "top"] = "-" + (r.offsetHeight + 14) + "px";
      });
      palco.querySelectorAll("[data-aprofundar]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); abrirAprof(b.dataset.aprofundar); }));
      palco.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); irPara(b.dataset.ir); }));
    }
    // progresso, posição e capítulo
    const cap = capDe(p), nCap = indiceCap(p) + 1;
    $("#progresso").style.width = ((i + 1) / PASSOS.length * 100) + "%";
    $("#ctl .pos").innerHTML = `<b>${nCap}</b>/${CAPS.length} · ${esc(cap.curto || cap.titulo)} · ${i + 1}/${PASSOS.length}`;
    $("#capitulo-atual").textContent = `${nCap}. ${cap.titulo}`;
    renderNotas(S);
    if (history.replaceState) history.replaceState(null, "", "#" + p.id);
    document.title = `${nCap}.${PASSOS.filter((x) => x.cap === p.cap).indexOf(p) + 1} ${p.titulo || cap.titulo} · Seven One`;
    if (canal && motivo !== "canal") canal.postMessage({ i, t0 });
    ultimoRender = i;
  }

  function renderNotas(S) {
    const p = PASSOS[i], cap = capDe(p), n = p.notas || {};
    const prox = PASSOS[i + 1];
    const dentro = PASSOS.filter((x) => x.cap === p.cap), k = dentro.indexOf(p) + 1;
    $("#notas .topo .cap-n").textContent = `Capítulo ${indiceCap(p) + 1} de ${CAPS.length} · ${cap.titulo} · cena ${k}/${dentro.length}`;
    $("#notas .topo h2").textContent = p.titulo || cap.titulo;
    const corpo = $("#notas .corpo");
    const bloco = (t, v, cls) => (v ? `<h3>${t}</h3>${cls === "fala" ? `<div class="fala">${esc(v)}</div>` : cls === "simulado" ? `<div class="simulado">${esc(v)}</div>` : `<p>${esc(v)}</p>`}` : "");
    corpo.innerHTML =
      bloco("Objetivo da cena", n.objetivo) +
      bloco("Fala sugerida", n.fala, "fala") +
      bloco("O que clicar", n.clicar) +
      bloco("O que o público deve observar", n.observar) +
      bloco("Simulado × real", n.simulado, "simulado") +
      bloco("Evidência", n.evidencia) +
      `<h3>Transição</h3><div class="prox">${prox ? `<b>Próximo:</b> ${esc(prox.titulo || capDe(prox).titulo)}${n.transicao ? " — " + esc(n.transicao) : ""}` : "Fim do percurso. Abra os capítulos (C) para perguntas."}</div>`;
    atualizarRelogios();
  }

  function atualizarRelogios() {
    const p = PASSOS[i]; if (!p) return;
    const previsto = tempoAte(i), previstoFim = previsto + (p.tempo || 0);
    const dec = t0 ? (Date.now() - t0) / 1000 : 0;
    const el = $("#notas .relogios"); if (!el) return;
    const atraso = t0 ? dec - previstoFim : 0;
    el.innerHTML = `<div>Decorrido<b class="${t0 ? (atraso > 45 ? "atrasado" : atraso < -45 ? "ok" : "") : ""}">${mmss(dec)}</b></div>
      <div>Previsto até aqui<b>${mmss(previsto)}–${mmss(previstoFim)}</b></div>
      <div>Esta cena · total<b>${mmss(p.tempo || 0)} · ${mmss(tempoTotal())}</b></div>`;
    const t = $("#ctl .tempo"); t.textContent = t0 ? mmss(dec) : "00:00"; t.classList.toggle("atrasado", t0 && atraso > 45);
  }
  setInterval(atualizarRelogios, 1000);

  /* ---------- navegação ---------- */
  function ir(k, motivo) {
    k = Math.max(0, Math.min(PASSOS.length - 1, k));
    if (k === i && ultimoRender === i) return;
    i = k; render(motivo);
  }
  const prox = () => { if (!t0 && i === 0) t0 = Date.now(); ir(i + 1); };
  const ant = () => ir(i - 1);
  function irPara(ref) {   // id de passo ou id de capítulo
    let k = PASSOS.findIndex((p) => p.id === ref);
    if (k < 0) k = primeiroDoCap(ref);
    if (k >= 0) { fecharTudo(); ir(k); }
  }
  function reiniciar() { fecharTudo(); t0 = null; i = 0; render(); }
  function telaCheia() { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.(); }

  /* ---------- sobreposições: capítulos, aprofundamento, notas, ajuda ---------- */
  function abrirCaps() {
    fecharTudo();
    const g = $("#caps .grade");
    g.innerHTML = CAPS.map((c, n) => {
      const ps = PASSOS.filter((p) => p.cap === c.id);
      const on = PASSOS[i].cap === c.id;
      return `<button class="cap ${on ? "on" : ""}" data-ir="${c.id}"><span class="n">CAPÍTULO ${n + 1}</span><b>${esc(c.titulo)}</b><span>${esc(c.resumo || "")}</span><span class="t">${ps.length} ${ps.length === 1 ? "cena" : "cenas"} · ${mmss(tempoCap(c.id))} · começa aos ${mmss(tempoAte(primeiroDoCap(c.id)))}</span></button>`;
    }).join("");
    g.querySelectorAll("[data-ir]").forEach((b) => b.addEventListener("click", () => irPara(b.dataset.ir)));
    $("#caps").hidden = false;
  }
  function abrirAprof(id) {
    const a = APROF[id]; if (!a) return;
    $("#janela").hidden = true;
    const S = estado(i);
    const corpo = $("#janela .corpo");
    $("#janela header h2").textContent = a.titulo || id;
    $("#janela header .etiq").textContent = a.etiqueta || "Aprofundamento · para perguntas";
    if (a.iframe) { corpo.className = "corpo iframe"; corpo.innerHTML = `<iframe src="${esc(a.iframe)}" title="${esc(a.titulo || "")}"></iframe>`; }
    else { corpo.className = "corpo"; corpo.innerHTML = typeof a.html === "function" ? a.html(S, { esc }) : a.html; }
    corpo.querySelectorAll("[data-aprofundar]").forEach((b) => b.addEventListener("click", () => abrirAprof(b.dataset.aprofundar)));
    $("#janela").hidden = false;
    corpo.scrollTop = 0;
  }
  function alternarNotas(forcar) {
    const aberto = typeof forcar === "boolean" ? forcar : !document.body.classList.contains("notas-abertas");
    document.body.classList.toggle("notas-abertas", aberto);
    $("#notas").hidden = !aberto;
    localStorage.setItem("seven_tour_notas", aberto ? "1" : "0");
    requestAnimationFrame(escalar);
  }
  function fecharTudo() { $("#caps").hidden = true; $("#janela").hidden = true; $("#ajuda").hidden = true; }
  const algoAberto = () => !$("#caps").hidden || !$("#janela").hidden || !$("#ajuda").hidden;

  /* ---------- teclado ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input,textarea,select")) return;
    const k = e.key;
    if (k === "Escape") { if (algoAberto()) fecharTudo(); else alternarNotas(false); return; }
    if (algoAberto() && !["c", "C", "?"].includes(k)) { if (k === "ArrowRight" || k === "ArrowLeft") { fecharTudo(); } else return; }
    if (["ArrowRight", " ", "PageDown", "Enter", "ArrowDown"].includes(k)) { e.preventDefault(); prox(); }
    else if (["ArrowLeft", "PageUp", "Backspace", "ArrowUp"].includes(k)) { e.preventDefault(); ant(); }
    else if (k === "Home") ir(0);
    else if (k === "End") ir(PASSOS.length - 1);
    else if (k === "f" || k === "F") telaCheia();
    else if (k === "n" || k === "N") alternarNotas();
    else if (k === "c" || k === "C") { $("#caps").hidden ? abrirCaps() : fecharTudo(); }
    else if (k === "r" || k === "R") reiniciar();
    else if (k === "t" || k === "T") { t0 = Date.now(); atualizarRelogios(); }
    else if (k === "?" || k === "h" || k === "H") { const a = $("#ajuda"); const ab = a.hidden; fecharTudo(); a.hidden = !ab; }
    else if (/^[1-8]$/.test(k) && e.altKey) irPara(CAPS[Number(k) - 1]?.id);
  });
  // clique no palco avança (área direita) ou volta (faixa esquerda de 12%); botões e links não contam
  document.addEventListener("click", (e) => {
    const palco = $("#palco"); if (!palco || !palco.contains(e.target) || e.target.closest("button,a,[data-aprofundar],[data-ir]")) return;
    const r = palco.getBoundingClientRect();
    (e.clientX - r.left) / r.width < 0.12 ? ant() : prox();
  });
  let timerCtl; document.addEventListener("mousemove", () => { document.body.classList.add("mostrar-ctl"); clearTimeout(timerCtl); timerCtl = setTimeout(() => document.body.classList.remove("mostrar-ctl"), 2500); });

  /* ---------- segunda janela do apresentador (BroadcastChannel) ---------- */
  try {
    canal = new BroadcastChannel("seven-tour");
    canal.onmessage = (m) => {
      const d = m.data || {};
      if (APRESENTADOR && typeof d.i === "number") { t0 = d.t0 || t0; i = d.i; render("canal"); }
      if (!APRESENTADOR && d.cmd === "prox") prox();
      if (!APRESENTADOR && d.cmd === "ant") ant();
    };
  } catch { canal = null; }

  /* ---------- início ---------- */
  function iniciar() {
    if (!$("#palco") || !$("#ctl")) return;   // roteiro.html usa só os dados
    if (APRESENTADOR) { document.body.classList.add("apresentador"); $("#notas").hidden = false; }
    const alvo = location.hash.replace("#", "");
    const k = PASSOS.findIndex((p) => p.id === alvo);
    i = k >= 0 ? k : 0;
    if (!APRESENTADOR && localStorage.getItem("seven_tour_notas") === "1") alternarNotas(true);
    render();
    escalar();
    addEventListener("resize", escalar);
    $("#ctl .ant").addEventListener("click", ant);
    $("#ctl .prox").addEventListener("click", prox);
    $("#ctl .caps").addEventListener("click", abrirCaps);
    $("#ctl .notas").addEventListener("click", () => alternarNotas());
    $("#ctl .cheia").addEventListener("click", telaCheia);
    $("#ctl .reiniciar").addEventListener("click", reiniciar);
    $("#ctl .apres").addEventListener("click", () => open(location.pathname + "?apresentador#" + PASSOS[i].id, "seven-apresentador", "width=720,height=900"));
    document.querySelectorAll(".fechar").forEach((b) => b.addEventListener("click", () => { if (b.closest("#notas")) alternarNotas(false); else fecharTudo(); }));
    if (APRESENTADOR) document.addEventListener("keydown", (e) => { if (e.key === "ArrowRight" || e.key === " ") canal?.postMessage({ cmd: "prox" }); if (e.key === "ArrowLeft") canal?.postMessage({ cmd: "ant" }); });
  }
  addEventListener("DOMContentLoaded", iniciar);

  return { capitulo, passo, aprofundamento, inicial, ordenar, estado: () => estado(i), ir, irPara, prox, ant, reiniciar, abrirAprof, esc, mmss, CAPS, PASSOS, APROF, tempoAte, tempoTotal, tempoCap, get i() { return i; } };
})();

/* =====================================================================================
   Componentes visuais (HTML em string). Reproduzem a casca do sistema (seven.css) em escala de palco.
   ===================================================================================== */
window.UI = (() => {
  const esc = window.TOUR.esc;
  const ICONES = {
    visao: '<rect x="3.5" y="3.5" width="7" height="8" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/><rect x="3.5" y="14.5" width="7" height="6" rx="1.5"/>',
    comercial: '<path d="M4 19h16"/><path d="M7 16V10M12 16V6M17 16v-4"/>',
    operacao: '<path d="M4 6h10M4 12h16M4 18h7"/><circle cx="18" cy="6" r="2"/><circle cx="15" cy="18" r="2"/>',
    gestao: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12V3.5M12 12l6.5 4.5"/>',
    admin: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    inicio: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    vendas: '<path d="M4 6h12M4 12h12M4 18h12"/><circle cx="20" cy="6" r="1.5"/><circle cx="20" cy="12" r="1.5"/><circle cx="20" cy="18" r="1.5"/>',
    agenda: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    premiacao: '<path d="M8 3h8v8a4 4 0 0 1-8 0z"/><path d="M8 5H5a3 3 0 0 0 3 5M16 5h3a3 3 0 0 1-3 5M12 15v3M9 21h6"/>',
    seta: '<path d="M4 12h14M12 6l6 6-6 6"/>',
    sino: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  };
  const svg = (n, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n] || ""}</svg>`;
  const LOGO = "assets/icone-seven-one.png";

  /* ---------- celular (app do vendedor, instalado) ---------- */
  function cel({ hora = "14:21", quem, titulo, sub, corpo = "", aba = "inicio", badge = {}, toast, push, folha, voltar, grande, legenda, abas = true, dest }) {
    const abasFim = [["inicio", "Início"], ["vendas", "Vendas"], ["+", ""], ["agenda", "Agenda"], ["premiacao", "Premiação"]].map(([k, n]) =>
      k === "+" ? `<div><div class="mais">+</div></div>` : `<div class="${aba === k ? "on" : ""}">${svg(k)}${n}${badge[k] ? `<span class="bol">${badge[k]}</span>` : ""}</div>`).join("");
    return `<div class="cel-wrap">${quem ? `<div class="quem">${quem}</div>` : ""}<div class="cel ${grande ? "grande" : ""} ${dest ? "dest" : ""}">
      <div class="status"><span>${hora}</span><span class="ilha"></span><span>●●● ⌃ ▮</span></div>
      <div class="tela">
        ${titulo ? `<div class="app-cab"><div>${voltar ? `<span class="voltar">‹</span>` : ""}<h4 style="display:inline">${titulo}</h4>${sub ? `<span class="sub">${sub}</span>` : ""}</div><div class="av">RM</div></div>` : ""}
        ${corpo}
        ${toast ? `<div class="toast novo"><div class="sino">${svg("sino")}</div><div><b>${toast.tit}</b>${toast.txt}</div><button class="ab">Abrir</button></div>` : ""}
        ${folha || ""}
      </div>
      ${push ? `<div class="push novo"><img src="${LOGO}" alt=""><div><b>${push.tit}</b>${push.txt}</div><span class="qd">${push.qd || "agora"}</span></div>` : ""}
      ${abas ? `<div class="abas-fim">${abasFim}</div>` : ""}
    </div>${legenda ? `<div class="legenda-cel">${legenda}</div>` : ""}</div>`;
  }
  const celAbas = (ativa, c = { viab: "3 abertas", cs: "2 em andamento", con: "21 no mês" }, bol = {}) => `<div class="app-abas">
      <div class="${ativa === "viab" ? "on" : ""}"><b>Viabilidade${bol.viab ? `<span class="bol">${bol.viab}</span>` : ""}</b>${c.viab}</div>
      <div class="${ativa === "cs" ? "on" : ""}"><b>Conexão / Solar${bol.cs ? `<span class="bol">${bol.cs}</span>` : ""}</b>${c.cs}</div>
      <div class="${ativa === "con" ? "on" : ""}"><b>Contratos</b>${c.con}</div></div>`;
  const campo = (l, v, cls = "") => `<div class="campo"><label>${l}</label><div class="${cls}${v ? "" : " vazio"}">${v || "—"}</div></div>`;
  const vendaCel = ({ cliente, st, stRot, num, data, prods, prox, dest }) => `<div class="venda ${dest ? "dest novo" : ""}"><div class="l1"><b>${cliente}</b><span class="st ${st}">${stRot}</span></div><div class="l2">${num} · ${data} · ${prods}</div>${prox ? `<div class="l3">→ ${prox}</div>` : ""}</div>`;

  /* ---------- web (sistema no computador) ---------- */
  const MODS = [["visao", "Visão geral"], ["comercial", "Comercial"], ["operacao", "Operação"], ["gestao", "Gestão"], ["admin", "Admin."]];
  function web({ quem, pessoa = { ini: "JC" }, modulo = "operacao", caminho = ["Operação", "Viabilidade"], url = "controleseven.com.br/#/viabilidade", badge = {}, mods, paginas, corpo = "", toast, altura = 760, dest }) {
    altura = Math.min(altura, 790);
    const lista = (mods || MODS).map(([k, n]) => `<div class="mod ${modulo === k ? "on" : ""}">${svg(k)}${n}${badge[k] ? `<span class="bol">${badge[k]}</span>` : ""}</div>`).join("");
    return `<div class="web-wrap">${quem ? `<div class="quem">${quem}</div>` : ""}<div class="web ${dest ? "dest" : ""}" style="--web-h:${altura}px">
      <div class="cromo"><i></i><i></i><i></i><div class="url">🔒 <b>${url}</b></div></div>
      <div class="casca ${paginas ? "com-paginas" : ""}">
        <div class="trilho"><div class="marca"><img src="${LOGO}" alt=""></div>${lista}<div class="fim"><span>Páginas</span><span>Ajuda</span><div class="conta">${pessoa.ini}</div></div></div>
        ${paginas ? `<div class="contexto">${paginas}</div>` : ""}
        <div class="trabalho">
          <div class="barra"><div class="caminho">${caminho.map((c, k) => k === caminho.length - 1 ? `<b>${c}</b>` : `${c} <span>/</span>`).join(" ")}</div><div class="busca">⌕ Buscar contrato, cliente ou CPF</div><div class="online"><i></i>JC PH RT · 10 online</div></div>
          <div class="pagina">${corpo}</div>
        </div>
      </div>
      ${toast ? `<div class="toast novo ${toast.som ? "som" : ""}"><div class="sino">${svg("sino")}</div><div><b>${toast.tit}</b>${toast.txt}</div><button class="ab">Abrir</button></div>` : ""}
    </div></div>`;
  }
  const pedido = ({ ha, st, stRot, num, end, cep, bairro, cidade, vendedor, equipe, checks, obs, on, dest, novo }) => `<div class="pedido ${on ? "on" : ""} ${dest ? "dest" : ""} ${novo ? "novo" : ""}">
      <div class="l1"><span><span class="ha ${/min|h/.test(ha) && !/^há [0-5] min/.test(ha) ? "" : "ok"}">${ha}</span> · <span class="st ${st === "an" ? "an" : ""}">${stRot}</span></span><span class="mono">nº ${num}</span></div>
      <b>${end}</b><div class="l3">${cep} · ${bairro} · ${cidade}</div><div class="l3">${vendedor} · ${equipe}${obs ? " · 1 observação" : ""}</div>
      <div class="chk">${checks.map((c) => `<span>${c}</span>`).join("")}</div></div>`;
  const seta = (txt, ativa = true) => `<div class="seta-fluxo ${ativa ? "ativa" : ""}">${svg("seta")}<span>${txt || ""}</span></div>`;
  const etiq = (t, cls = "") => `<span class="etiq ${cls}">${t}</span>`;
  const cab = (capN, h, sub) => `<div class="cab">${capN ? `<div class="cap-n">${capN}</div>` : ""}<h2>${h}</h2>${sub ? `<p class="sub">${sub}</p>` : ""}</div>`;
  const aprof = (lista) => `<div class="botoes-aprof">${lista.map(([id, t]) => `<button data-aprofundar="${id}">${t}</button>`).join("")}</div>`;
  const fonte = (t) => `<div class="fonte">${t}</div>`;

  return { svg, cel, celAbas, campo, vendaCel, web, pedido, seta, etiq, cab, aprof, fonte, LOGO, esc };
})();
