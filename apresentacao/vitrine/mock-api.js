"use strict";
/* Vitrine: abre o sistema de verdade (api/public) sem servidor e sem banco, com dados fictícios.
   Este arquivo roda antes de tudo: fixa o relógio, monta a sessão pedida na URL e troca o fetch de /api por rotas fictícias.
   Parâmetros: ?perfil=gestor|master|administrador|cadastro|qualidade|lider|coordenador|vendedor  ?app  ?paginas  ?sair  ?depurar  ?hoje=AAAA-MM-DDTHH:MM */
window.VITRINE = (() => {
  const q = new URLSearchParams(location.search);

  /* ---------- armazenamento separado: publicada no site (/apresentacao/sistema/demo/), a vitrine divide o endereço com
     o sistema de verdade; com o prefixo "vitrine:" ela nunca lê nem apaga a sessão e as preferências de quem usa o sistema ---------- */
  const separado = (real) => {
    const P = "vitrine:", chaves = () => Array.from({ length: real.length }, (_, i) => real.key(i)).filter((k) => k?.startsWith(P)).map((k) => k.slice(P.length));
    return {
      getItem: (k) => real.getItem(P + k), setItem: (k, v) => real.setItem(P + k, String(v)), removeItem: (k) => real.removeItem(P + k),
      clear: () => chaves().forEach((k) => real.removeItem(P + k)), key: (i) => chaves()[i] ?? null, get length() { return chaves().length; },
    };
  };
  try {
    const ls = separado(window.localStorage), ss = separado(window.sessionStorage);
    Object.defineProperty(window, "localStorage", { configurable: true, get: () => ls });
    Object.defineProperty(window, "sessionStorage", { configurable: true, get: () => ss });
  } catch {}

  /* ---------- relógio: por padrão, sábado 24/10/2026 às 14:20 (a referência dos dados de demonstração) ---------- */
  const DataReal = Date;
  const desloc = new DataReal((q.get("hoje") || "2026-10-24T14:20") + ":00-03:00").getTime() - DataReal.now();
  if (Number.isFinite(desloc)) {
    window.Date = class extends DataReal {
      constructor(...a) { a.length ? super(...a) : super(DataReal.now() + desloc); }
      static now() { return DataReal.now() + desloc; }
    };
  }

  /* ---------- sessão ---------- */
  const PESSOAS = {
    gestor: { id: 1, nome: "Luciana Abreu", perfil: "gestor" },
    master: { id: 2, nome: "Equipe de desenvolvimento", perfil: "master" },
    administrador: { id: 3, nome: "Sandra Mota", perfil: "administrador" },
    cadastro: { id: 10, nome: "Juliana Castro", perfil: "backoffice", setor: "CADASTRO" },
    qualidade: { id: 11, nome: "Paulo Henrique", perfil: "backoffice", setor: "QUALIDADE" },
    coordenador: { id: 20, nome: "Eduardo Saraiva", perfil: "coordenador" },
    lider: { id: 21, nome: "Rodrigo Teles", perfil: "lider" },
    vendedor: { id: 100, nome: "Rafael Moura", perfil: "vendedor" },
  };
  const perfil = q.get("perfil") || "gestor";
  try {
    localStorage.removeItem("seven_tema");
    q.has("paginas") ? localStorage.setItem("seven_paginas", "aberto") : localStorage.removeItem("seven_paginas");
    if (!q.has("app")) sessionStorage.removeItem("seven_app");
    if (q.has("sair")) { sessionStorage.removeItem("seven"); localStorage.removeItem("seven"); }
    else if (!sessionStorage.getItem("seven") || JSON.parse(sessionStorage.getItem("seven")).vitrine !== perfil) {
      const u = PESSOAS[perfil] || PESSOAS.gestor;
      sessionStorage.setItem("seven", JSON.stringify({ token: "vitrine", vitrine: perfil, usuario: { ...u, trocar: false } }));
    }
  } catch {}

  /* ---------- rotas fictícias ---------- */
  const rotas = [];
  const molde = (caminho) => new RegExp("^" + caminho.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\/:(\w+)/g, "/(?<$1>[^/]+)") + "$");
  /** Registra uma rota: VITRINE.rota("GET", "/vendas/:id", ({ params, query, corpo, perfil }) => resposta | { status, corpo }).
      Se a mesma rota já existir, vale a primeira (base.js carrega antes dos grupos). */
  function rota(metodo, caminho, fn) {
    metodo = metodo.toUpperCase();
    if (rotas.some((r) => r.metodo === metodo && r.caminho === caminho)) { console.warn(`(vitrine) rota repetida, ficou a primeira: ${metodo} ${caminho}`); return; }
    rotas.push({ metodo, caminho, re: molde(caminho), fn });
  }

  const problemas = [];
  const anotar = (txt) => { problemas.push(txt); pintarProblemas(); };
  const resposta = (status, corpo, tipo = "application/json") =>
    new Response(tipo === "application/json" ? JSON.stringify(corpo ?? {}) : corpo, { status, headers: { "Content-Type": tipo } });

  const fetchReal = window.fetch.bind(window);
  window.fetch = async (entrada, init = {}) => {
    const url = typeof entrada === "string" ? entrada : entrada?.url || String(entrada);
    const i = url.indexOf("/api/");
    if (!url.startsWith("/api") && i < 0) return fetchReal(entrada, init);
    const u = new URL(url.slice(url.startsWith("/api") ? 0 : i), "http://vitrine");
    const caminho = u.pathname.replace(/^\/api/, "") || "/";
    const metodo = (init.method || "GET").toUpperCase();
    let corpo = null;
    try { corpo = init.body ? JSON.parse(init.body) : null; } catch { corpo = init.body; }
    const query = Object.fromEntries(u.searchParams);
    for (const r of rotas) {
      const m = r.metodo === metodo && r.re.exec(caminho);
      if (!m) continue;
      try {
        const out = await r.fn({ params: m.groups || {}, query, corpo, perfil });
        if (out && typeof out === "object" && "status" in out && "corpo" in out) return resposta(out.status, out.corpo, out.tipo);
        return resposta(200, out);
      } catch (e) { anotar(`erro na rota ${metodo} ${caminho}: ${e.message}`); return resposta(500, { erro: "(vitrine) " + e.message }); }
    }
    if (metodo !== "GET") return resposta(200, { ok: true });
    const txt = `(vitrine) sem dados para GET ${caminho}`;
    console.warn(txt); anotar(txt);
    return resposta(404, { erro: txt });
  };

  /* ---------- links #/... com <base>: sem isto, o clique abriria api/public/index.html ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (a && !e.defaultPrevented) { e.preventDefault(); location.hash = a.getAttribute("href"); }
  });

  /* ---------- ?depurar: mostra rotas faltando e erros num quadro no canto ---------- */
  addEventListener("error", (e) => anotar("erro: " + (e.message || e.error)));
  addEventListener("unhandledrejection", (e) => anotar("promessa rejeitada: " + (e.reason?.message || e.reason)));
  function pintarProblemas() {
    if (!q.has("depurar") || !document.body) return;
    let el = document.getElementById("vitrine-problemas");
    if (!el) {
      el = document.createElement("pre"); el.id = "vitrine-problemas";
      el.style.cssText = "position:fixed;right:8px;bottom:8px;z-index:99999;max-width:46vw;max-height:40vh;overflow:auto;margin:0;padding:8px 10px;background:#fff7d6;color:#3b2f00;border:1px solid #d9b100;font:12px/1.4 monospace;white-space:pre-wrap";
      document.body.appendChild(el);
    }
    el.textContent = [...new Set(problemas)].join("\n");
  }
  addEventListener("DOMContentLoaded", pintarProblemas);

  return { rota, perfil, pessoa: PESSOAS[perfil] || PESSOAS.gestor, PESSOAS, problemas, demo: () => window.DEMO };
})();
