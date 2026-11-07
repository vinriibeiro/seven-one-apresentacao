"use strict";
/* Seven One · modo vídeo por cima do motor do tour (../sistema/tour.js).
   - Cada cena pode ter `narracao`: lista de trechos. Cada trecho é um "momento": quando ele começa, os elementos da cena
     marcados com data-m="N" (N = índice do trecho) aparecem. Assim a tela vai se montando junto com a voz.
   - Áudio: audio/<id da cena>.mp3 (gerado fora, ex.: ElevenLabs, a partir de narracao/<id>.txt). Com o áudio, os momentos
     seguem o tempo do arquivo (proporcional ao tamanho dos trechos, ou `momentos: [seg, seg, ...]` na cena). Sem o áudio,
     um relógio usa `tempo` da cena. No fim, a cena seguinte entra sozinha.
   - Sem reprodução (modo manual), → mostra o próximo momento e, no último, avança a cena. Espaço: tocar/pausar. L: legenda.
   Nada aqui fala com o servidor. */
window.PLAYER = (() => {
  const T = window.TOUR;
  const $ = (s, r = document) => r.querySelector(s);
  const AUDIO_DIR = "audio/";
  const TUDO = new URLSearchParams(location.search).has("tudo");
  /* Áudio único (audio/narracao.mp3) ou em partes (audio/narracao-1.mp3, narracao-2.mp3, ...): a narração inteira, com
     uma pausa longa (>= 1,6 s) entre as cenas. O player decodifica cada arquivo uma vez, acha as pausas e corta por cena,
     na ordem das cenas (as partes se emendam). audio/cortes.json (lista de segundos em que cada cena começa, só para o
     arquivo único) substitui a detecção. Se houver audio/<id>.mp3 para uma cena, ele vale primeiro. */
  const UNICO = AUDIO_DIR + "narracao.mp3", CORTES_MANUAL = AUDIO_DIR + "cortes.json", PAUSA_MIN = 1.6;
  let cortes = null;   // [{inicio, fim}] por cena, na ordem de T.PASSOS; null = sem áudio único
  let unicoPronto = null;
  async function prepararUnico() {
    if (unicoPronto) return unicoPronto;
    unicoPronto = (async () => {
      // arquivos: narracao.mp3 ou narracao-1.mp3, narracao-2.mp3, ... (em ordem, até faltar um)
      const arquivos = [];
      const r0 = await fetch(UNICO, { cache: "force-cache" }).catch(() => null);
      if (r0 && r0.ok) arquivos.push([UNICO, await r0.arrayBuffer()]);
      else for (let n = 1; n <= 20; n++) {
        const r = await fetch(AUDIO_DIR + "narracao-" + n + ".mp3", { cache: "force-cache" }).catch(() => null);
        if (!r || !r.ok) break;
        arquivos.push([AUDIO_DIR + "narracao-" + n + ".mp3", await r.arrayBuffer()]);
      }
      if (!arquivos.length) return null;
      const manual = arquivos.length === 1 ? await fetch(CORTES_MANUAL).then((x) => (x.ok ? x.json() : null)).catch(() => null) : null;
      const lista = [];   // {arquivo, inicio, fim} por trecho falado, na ordem dos arquivos
      for (const [arquivo, buf] of arquivos) {
        const chave = "seven_campo_cortes:" + arquivo + ":" + buf.byteLength;
        let inicios = Array.isArray(manual) && manual.length === T.PASSOS.length ? manual.map(Number) : null, total = 0;
        const guardado = !inicios && localStorage.getItem(chave);
        if (guardado) { const g = JSON.parse(guardado); inicios = g.inicios; total = g.total; }
        if (!inicios || !total) {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const dados = await ctx.decodeAudioData(buf.slice(0));
          total = dados.duration;
          if (!inicios) inicios = detectarInicios(dados);
          ctx.close?.();
          localStorage.setItem(chave, JSON.stringify({ inicios, total }));
        }
        inicios.forEach((ini, i) => lista.push({ arquivo, inicio: ini, fim: i + 1 < inicios.length ? inicios[i + 1] : total }));
      }
      console.info(`Narração: ${lista.length} trechos em ${arquivos.length} arquivo(s) para ${T.PASSOS.length} cenas`, lista.map((c) => `${c.arquivo.replace(AUDIO_DIR, "")} ${Math.round(c.inicio)}–${Math.round(c.fim)}s`));
      if (lista.length !== T.PASSOS.length) { console.warn(`Ajuste as pausas entre as cenas ou crie ${CORTES_MANUAL}.`); $("#ctl .player")?.classList.add("cortes-errados"); return null; }
      return lista;
    })();
    return unicoPronto;
  }
  /** instantes em que começa cada trecho falado, separados por silêncio de PAUSA_MIN ou mais (energia RMS em janelas de 50 ms) */
  function detectarInicios(dados) {
    const canal = dados.getChannelData(0), sr = dados.sampleRate, jan = Math.round(sr * 0.05);
    const rms = [];
    for (let i = 0; i + jan <= canal.length; i += jan) { let s = 0; for (let j = i; j < i + jan; j++) s += canal[j] * canal[j]; rms.push(Math.sqrt(s / jan)); }
    let pico = 0; for (const v of rms) if (v > pico) pico = v;
    const limiar = Math.max(pico * 0.04, 0.004);
    const inicios = []; let silencio = 0, falando = false;
    for (let k = 0; k < rms.length; k++) {
      if (rms[k] < limiar) { silencio++; if (falando && silencio * 0.05 >= PAUSA_MIN) falando = false; }
      else { if (!falando) inicios.push(Math.max(0, k * 0.05 - 0.15)); falando = true; silencio = 0; }
    }
    return inicios;
  }
  let tocando = false, audio = null, timer = null, t0 = 0, momento = 0, cenaId = null, dur = 0, legenda = localStorage.getItem("seven_campo_legenda") !== "0", semAudio = false;

  const passoAtual = () => T.PASSOS[T.i];
  const trechos = (p) => Array.isArray(p?.narracao) ? p.narracao : p?.narracao ? [p.narracao] : [];

  /* ---------- momentos ---------- */
  function aplicarMomento(n) {
    momento = n;
    const palco = $("#palco");
    palco.querySelectorAll("[data-m]").forEach((el) => {
      const k = Number(el.dataset.m);
      el.classList.toggle("m-on", k <= n);
      el.classList.toggle("m-agora", k === n);
    });
    const p = passoAtual(), ts = trechos(p);
    let leg = $("#legenda", palco);   // dentro do palco, para escalar junto com a cena
    if (!leg) { leg = document.createElement("div"); leg.id = "legenda"; palco.appendChild(leg); }
    leg.textContent = ts[n] || ts[0] || ""; leg.hidden = !legenda || !leg.textContent;
    palco.classList.toggle("com-legenda", !leg.hidden);
    const el = palco.querySelector(`[data-m="${n}"][data-rolar]`);
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  /** instantes (s) em que cada momento começa: `momentos` da cena, ou proporcional ao tamanho dos trechos */
  function instantes(p, total) {
    const ts = trechos(p);
    if (Array.isArray(p.momentos) && p.momentos.length >= ts.length - 1) return [0, ...p.momentos.slice(0, ts.length - 1)];
    const tam = ts.map((t) => t.length + 25), soma = tam.reduce((a, b) => a + b, 0) || 1;
    const out = [0]; let acc = 0;
    for (let i = 0; i < ts.length - 1; i++) { acc += tam[i]; out.push(total * acc / soma); }
    return out;
  }
  const ultimoMomento = (p) => Math.max(0, trechos(p).length - 1, ...[...$("#palco").querySelectorAll("[data-m]")].map((e) => Number(e.dataset.m)));

  /* ---------- reprodução ---------- */
  function pararAudio() {
    if (audio) { audio.pause(); audio.removeAttribute("src"); audio = null; }
    clearInterval(timer); timer = null;
  }
  function tocar() {
    const p = passoAtual(); if (!p) return;
    tocando = true; document.body.classList.add("tocando"); atualizarBotao();
    pararAudio();
    cenaId = p.id; t0 = Date.now(); semAudio = false;
    const inst = () => instantes(p, dur || p.tempo || 20);
    const tick = (seg) => {
      const ins = inst(); let n = 0;
      for (let i = 0; i < ins.length; i++) if (seg >= ins[i]) n = i;
      if (n !== momento) aplicarMomento(n);
      const barra = $("#ctl .player .barra i"); if (barra) barra.style.width = Math.min(100, seg / (dur || p.tempo || 20) * 100) + "%";
    };
    const terminou = () => { if (!tocando || cenaId !== p.id) return; aplicarMomento(ultimoMomento(p)); setTimeout(() => { if (tocando && cenaId === p.id) proximaCena(); }, 900); };
    const relogio = () => {   // sem arquivo: relógio pelo tempo previsto da cena
      if (semAudio || !tocando || cenaId !== p.id) return;
      semAudio = true; dur = p.tempo || 20; t0 = Date.now(); $("#ctl .player")?.classList.add("sem-audio");
      timer = setInterval(() => { const seg = (Date.now() - t0) / 1000; tick(seg); if (seg >= dur) { clearInterval(timer); terminou(); } }, 100);
    };
    $("#ctl .player")?.classList.remove("sem-audio");
    const proprio = new Audio(AUDIO_DIR + p.id + ".mp3");
    proprio.preload = "auto";
    audio = proprio;
    proprio.addEventListener("loadedmetadata", () => { dur = proprio.duration || 0; });
    proprio.addEventListener("timeupdate", () => tick(proprio.currentTime));
    proprio.addEventListener("ended", terminou);
    proprio.addEventListener("error", async () => {   // não há audio/<id>.mp3: tenta o áudio único, depois o relógio
      if (!tocando || cenaId !== p.id) return;
      const k = T.PASSOS.indexOf(p);
      const c = (cortes || (cortes = await prepararUnico()))?.[k];
      if (!tocando || cenaId !== p.id) return;
      if (!c) return relogio();
      const u = new Audio(c.arquivo || UNICO); audio = u; dur = c.fim - c.inicio;
      u.addEventListener("loadedmetadata", () => { u.currentTime = c.inicio; });
      u.addEventListener("timeupdate", () => { const seg = u.currentTime - c.inicio; tick(Math.max(0, seg)); if (u.currentTime >= c.fim - 0.05) { u.pause(); terminou(); } });
      u.addEventListener("ended", terminou);
      u.addEventListener("error", relogio);
      u.play().catch(relogio);
    });
    proprio.play().catch(() => { if (!semAudio && audio === proprio) proprio.dispatchEvent(new Event("error")); });   // sem gesto do usuário o navegador bloqueia o som
  }
  function pausar() { tocando = false; document.body.classList.remove("tocando"); pararAudio(); atualizarBotao(); }
  function alternar() { tocando ? pausar() : tocar(); }
  function proximaCena() { if (T.i >= T.PASSOS.length - 1) { pausar(); return; } T.prox(); }

  function atualizarBotao() {
    const b = $("#ctl .player .play"); if (!b) return;
    b.innerHTML = tocando ? `<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>Pausar` : `<svg viewBox="0 0 24 24"><path d="M7 4l12 8-12 8z"/></svg>Assistir`;
    b.title = tocando ? "Pausar (espaço)" : "Assistir: narração e telas no tempo certo (espaço)";
  }

  /* ---------- quando a cena muda (o tour renderiza; aqui observamos o palco) ---------- */
  function cenaMudou() {
    const p = passoAtual(); if (!p) return;
    const barra = $("#ctl .player .barra i"); if (barra) barra.style.width = "0";
    dur = 0;
    aplicarMomento(TUDO ? ultimoMomento(p) : 0);   // ?tudo mostra a cena inteira (impressão, conferência)
    if (tocando) tocar(); else { cenaId = p.id; pararAudio(); }
    $("#palco .assistir")?.addEventListener("click", (e) => { e.stopPropagation(); if (!tocando) tocar(); });
  }
  if ($("#palco")) new MutationObserver((ms) => { if (ms.some((m) => [...m.addedNodes].some((n) => n.nodeType === 1 && n.classList?.contains("cena")))) cenaMudou(); })
    .observe($("#palco"), { childList: true });   // roteiro.html não tem palco: só usa os dados

  /* ---------- teclado e clique, antes do tour (fase de captura) ---------- */
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input,textarea,select")) return;
    const aberto = !$("#caps").hidden || !$("#janela").hidden || !$("#ajuda").hidden;
    if (aberto) return;
    if (e.key === " ") { e.preventDefault(); e.stopImmediatePropagation(); alternar(); return; }
    if (e.key === "l" || e.key === "L") { legenda = !legenda; localStorage.setItem("seven_campo_legenda", legenda ? "1" : "0"); aplicarMomento(momento); $("#ctl .legenda")?.classList.toggle("on", legenda); return; }
    if (!tocando && ["ArrowRight", "Enter", "PageDown", "ArrowDown"].includes(e.key)) {
      if (momento < ultimoMomento(passoAtual())) { e.preventDefault(); e.stopImmediatePropagation(); aplicarMomento(momento + 1); }
    }
  }, true);
  document.addEventListener("click", (e) => {
    const palco = $("#palco"); if (!palco.contains(e.target) || e.target.closest("button,a,[data-aprofundar],[data-ir]")) return;
    const r = palco.getBoundingClientRect();
    if ((e.clientX - r.left) / r.width < 0.12) return;   // faixa da esquerda: volta (o tour cuida)
    if (!tocando && momento < ultimoMomento(passoAtual())) { e.stopImmediatePropagation(); aplicarMomento(momento + 1); }
  }, true);

  /* ---------- controles ---------- */
  function montarControles() {
    const ctl = $("#ctl"); if (!ctl) return;
    const box = document.createElement("span"); box.className = "player";
    box.innerHTML = `<button class="play"></button><span class="barra" title="Narração desta cena"><i></i></span><span class="aviso-audio" title="Sem áudio para esta cena: o relógio usa o tempo previsto">sem áudio</span><span class="aviso-cortes" title="audio/narracao.mp3 existe, mas o número de trechos entre pausas não bate com o de cenas">cortes?</span>`;
    ctl.insertBefore(box, ctl.querySelector(".tempo"));
    box.querySelector(".play").addEventListener("click", alternar);
    const leg = document.createElement("button"); leg.className = "legenda " + (legenda ? "on" : ""); leg.title = "Legenda (L)";
    leg.innerHTML = `<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 13h5M14 13h3"/></svg>Legenda`;
    leg.addEventListener("click", () => { legenda = !legenda; localStorage.setItem("seven_campo_legenda", legenda ? "1" : "0"); aplicarMomento(momento); leg.classList.toggle("on", legenda); });
    ctl.insertBefore(leg, ctl.querySelector(".cheia"));
    atualizarBotao();
  }
  addEventListener("DOMContentLoaded", () => { if (!$("#palco")) return; montarControles(); cenaMudou(); if (new URLSearchParams(location.search).has("assistir")) tocar(); });

  return { tocar, pausar, alternar, detectarInicios, prepararUnico, get tocando() { return tocando; }, get momento() { return momento; }, trechos, instantes };
})();
