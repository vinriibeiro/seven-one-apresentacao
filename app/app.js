"use strict";
/* Núcleo: sessão, chamadas à API, utilidades, layout e rotas (#/pagina) */
const S = (() => {
  const CFG = window.SEVEN_CFG || {};
  let sessao = null;
  /* No app instalado (tela inicial do celular), fechar o app apaga o sessionStorage: lá a sessão fica no localStorage.
     A saída automática por 2 h sem uso continua valendo (conferida também ao abrir). */
  const instalado = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const deposito = () => { try { return instalado ? localStorage : sessionStorage; } catch { return null; } };
  try {
    const ult = Number(localStorage.getItem("seven_ativo") || 0);
    const guardada = JSON.parse(deposito()?.getItem("seven") || "null");
    if (instalado && ult && Date.now() - ult > (guardada?.usuario?.dois_fatores ? 8 : 2) * 60 * 60 * 1000) localStorage.removeItem("seven");
    sessao = normaliza(JSON.parse(deposito()?.getItem("seven") || "null"));
  } catch {}
  const gravarSessao = () => { try { sessao ? deposito()?.setItem("seven", JSON.stringify(sessao)) : deposito()?.removeItem("seven"); } catch {} };
  const guardar = (k, v) => { try { v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch {} };
  const ler = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = new Intl.NumberFormat("pt-BR");
  const pct = (x, d = 1) => (x == null || isNaN(x) ? "–" : (x * 100).toFixed(d).replace(".", ",") + "%");
  const brl = (x) => (x == null ? "–" : Number(x).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  /** Dias úteis podem ter meio dia (sábado vale 0,5): mostra 8 ou 8,5 em vez de 8.5 */
  const du = (v) => (v == null ? "–" : (Math.round(v * 2) / 2).toString().replace(".5", ",5"));
  const dt = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "–");
  const mes = (s) => { const [a, m] = String(s).slice(0, 7).split("-"); return `${m}/${a.slice(2)}`; };
  const PAGES = {};
  let cat = null, S_perfil = null;
  /* sem internet o navegador só diz "Failed to fetch": troca por uma mensagem que diz o que fazer */
  const SEM_REDE = "Sem conexão com a internet. Confira o Wi-Fi ou os dados móveis e tente de novo.";
  const buscar = (url, init) => fetch(url, init).catch(() => { throw new Error(SEM_REDE); });

  async function api(path, opt = {}) {
    const r = await buscar("/api" + path, {
      method: opt.method || "GET",
      headers: { "Content-Type": "application/json", ...(sessao ? { Authorization: "Bearer " + sessao.token } : {}), ...(sessao?.vercomo != null ? { "X-Ver-Como": String(sessao.vercomo), "X-Ver-Perfil": sessao.vercomoPerfil || "", "X-Ver-Setor": sessao.vercomoSetor || "" } : {}) },
      body: opt.body ? JSON.stringify(opt.body) : undefined,
    });
    const novo = r.headers.get("X-Token-Novo");   // sessão deslizante: o servidor renovou o token
    if (novo && sessao) { sessao.token = novo; gravarSessao(); }
    const j = await r.json().catch(() => ({}));
    const ap = r.headers.get("X-Perfil-Aplicado");
    if (ap && sessao && ap !== sessao.usuario.perfil && !path.startsWith("/auth/")) throw new Error(`Conferência falhou: a tela está como “${sessao.usuario.perfil}” mas o servidor aplicou “${ap}”. Feche e abra o sistema de novo; se persistir, reinicie o servidor.`);
    if (r.status === 401 && sessao && !path.startsWith("/auth/login") && !path.startsWith("/auth/trocar-senha")) { sair(j.erro || "Sessão expirada. Entre novamente."); throw new Error(j.erro || "Sessão expirada. Entre novamente."); }
    if (r.status === 403 && j.trocar_senha) { telaTrocarSenha(true); throw new Error(j.erro); }
    if (r.status === 404 && !j.erro) throw Object.assign(new Error("O servidor está com uma versão antiga e não tem esta função. Feche a janela do CMD, entre na pasta api nova e rode npm start de novo."), { dados: j });
    if (!r.ok) throw Object.assign(new Error(j.erro || "Erro " + r.status), { dados: j });
    return j;
  }
  /** Baixa um arquivo da API (com login) e entrega ao navegador. */
  async function baixar(path, nome) {
    const r = await buscar("/api" + path, { headers: { ...(sessao ? { Authorization: "Bearer " + sessao.token } : {}), ...(sessao?.vercomo != null ? { "X-Ver-Como": String(sessao.vercomo), "X-Ver-Perfil": sessao.vercomoPerfil || "", "X-Ver-Setor": sessao.vercomoSetor || "" } : {}) } });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.erro || (r.status === 404 ? "Servidor desatualizado: reinicie o npm start." : "Erro " + r.status)); }
    const b = await r.blob(), a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const catalogos = async () => (cat ||= await api("/catalogos"));
  const limparCatalogos = () => (cat = null);
  /** O master (desenvolvedor) usa as telas do gestor; o servidor continua tratando como master. */
  function normaliza(s) {
    if (s?.usuario?.perfil === "master") s.usuario = { ...s.usuario, perfil: "gestor", master: true };
    // administrador = mesmas telas e permissões do gerente; só o nome muda
    if (s?.usuario?.perfil === "administrador") s.usuario = { ...s.usuario, perfil: "gestor", cargo: "administrador" };
    return s;
  }
  /** Nome do perfil que aparece nas telas ("gestor" é o perfil interno do Gerente). */
  const ROTULO_PERFIL = { master: "Master", administrador: "Administrador", gestor: "Gerente", gerente: "Gerente", coordenador: "Coordenador", lider: "Supervisor", backoffice: "Backoffice", vendedor: "Vendedor" };
  const rotPerfil = (p) => ROTULO_PERFIL[p] || p || "";
  const salvar = (s) => { sessao = normaliza(s); gravarSessao(); };
  const sair = (msg) => {
    // quem está online: sai da lista na hora (sem esperar resposta; se a sessão já caiu, não faz nada)
    if (sessao?.token) fetch("/api/online/sair", { method: "POST", keepalive: true, headers: { Authorization: "Bearer " + sessao.token } }).catch(() => {});
    S.avisos?.parar(); sessao = null; cat = null; gravarSessao(); telaLogin(msg); };

  /* ---------- segurança: sai sozinho após 30 min sem uso (vale para todas as abas) ---------- */
  const ociosoH = () => (sessao?.usuario?.dois_fatores ? 8 : 2);   // horas sem nenhum uso: 2 h; com verificação em dois fatores, 8 h
  const marcar = () => { try { localStorage.setItem("seven_ativo", String(Date.now())); } catch {} };
  let ultMarca = 0;
  ["click", "keydown", "mousemove", "touchstart", "scroll"].forEach((ev) => addEventListener(ev, () => { const n = Date.now(); if (n - ultMarca > 15000) { ultMarca = n; marcar(); } }, { passive: true }));
  marcar();
  setInterval(() => {
    if (!sessao) return;
    const ult = Number(ler("seven_ativo") || Date.now());
    if (Date.now() - ult > ociosoH() * 60 * 60 * 1000) sair(`Você saiu automaticamente após ${ociosoH()} horas sem uso.`);
  }, 30000);
  /* quem está online: com o app aberto na tela, um sinal por minuto */
  setInterval(() => { if (sessao && !sessao.usuario.trocar && sessao.vercomo == null && !document.hidden) api("/online/ping?nocache=1").catch(() => {}); }, 60000);
  const logo = (h) => `<img class="logo-c" src="${esc(CFG.logo || "logo.png")}" alt="${esc(CFG.empresa || "")}" style="height:${h || CFG.logoAltura || 30}px">`;

  /* ---------- cartão de indicador (ícone escolhido pelo nome do indicador) ---------- */
  const ICO = {
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>', check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    x: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>', wallet: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16 14.5h2"/>', pct: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.2"/><circle cx="17" cy="17" r="2.2"/>',
    wifi: '<path d="M2.5 9a15 15 0 0119 0M6 12.5a10 10 0 0112 0M9.3 16a5 5 0 015.4 0"/><circle cx="12" cy="19.2" r="1"/>', users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3.2 3.2 0 010 5.6M18.5 14.4c1.6.8 2.5 2.6 2.5 5.6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>', cal: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    bars: '<path d="M5 20V11M12 20V4M19 20v-6"/>', pen: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  };
  const ICO_REGRAS = [[/cancel|inadimpl|perd|apagou|exclus/, "x", "ruim"], [/pendent|aberto|prazo/, "clock", "alerta"], [/conectad|quitad|ativ|bateram/, "check", "ok"], [/ticket|receita|pacote|comiss|premia|pagar|valor/, "wallet", "azul"],
    [/fpd|taxa|conectividade|%/, "pct", "alerta"], [/banda|\bbl\b/, "wifi", "azul"], [/pessoa|vendedor|colabor|equipe|acess/, "users", "azul"], [/meta/, "target", "azul"], [/alter|edi[çc]|cria/, "pen", "azul"], [/venda/, "trend", "azul"], [/m[eê]s|dia|semana|safra/, "cal", "azul"]];
  /** Cartão de indicador. serie (opcional): valores para o minigráfico; chip (opcional): {txt, tom} ao lado do valor. */
  function kpi(rotulo, valor, detalhe, serie, chip) {
    const [, ic, tom] = ICO_REGRAS.find(([re]) => re.test(String(rotulo).toLowerCase())) || [0, "trend", "azul"];
    const sp = Array.isArray(serie) && serie.filter((x) => x != null).length > 1 ? CH.spark(serie.slice(-12), { cor: { ok: CH.COR.ok, ruim: CH.COR.ruim, alerta: CH.COR.alerta }[tom] || CH.COR.base, w: 84, h: 28 }) : "";
    return `<div class="kpi"><div class="kpi-topo"><div class="r">${esc(rotulo)}</div><span class="ico ${tom}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[ic]}</svg></span></div><div class="kpi-val"><div class="v">${valor}${chip ? ` <span class="chip ${chip.tom || ""}">${esc(chip.txt)}</span>` : ""}</div>${sp}</div><div class="d">${esc(detalhe || "") || "&nbsp;"}</div></div>`;
  }

  function tabela(cols, rows, opt = {}) {
    const cab = cols.map((c) => `<th class="${c.n ? "num" : ""}">${esc(c.t)}</th>`).join("");
    const corpo = rows.map((r, i) => `<tr ${opt.clic ? `class="clic" data-i="${i}"` : ""}>${cols.map((c) => `<td data-l="${esc(c.t || "")}" class="${c.n ? "num" : ""} ${c.c || ""}">${c.f ? c.f(r) : esc(r[c.k] ?? "")}</td>`).join("")}</tr>`).join("");
    return `<div class="tab"><table><thead><tr>${cab}</tr></thead><tbody>${corpo || `<tr><td colspan="${cols.length}" class="mut">Nenhum registro.</td></tr>`}</tbody></table></div>`;
  }
  function modal(titulo, html, rod) {
    const d = document.createElement("div"); d.className = "modal";
    d.innerHTML = `<div class="caixa"><h2>${esc(titulo)}</h2><div class="corpo">${html}</div>${rod ? `<div class="rod">${rod}</div>` : ""}</div>`;
    d.addEventListener("mousedown", (e) => { if (e.target === d) d.remove(); });
    document.body.appendChild(d); return d;
  }
  const painel = (titulo, corpo, nota, extra) => `<section class="painel"><h2><span>${esc(titulo)}</span>${extra ? `<small>${esc(extra)}</small>` : ""}</h2><div class="corpo">${corpo}</div>${nota ? `<div class="nota">${esc(nota)}</div>` : ""}</section>`;
  const erroEm = (el) => (e) => { el.innerHTML = `<div class="aviso erro">${esc(e.message)}</div>`; };

  /* ---------- telas de entrada: cartão no azul-marinho, com o aviso de versão nova ---------- */
  // A etiqueta "Nova versão" aparece na entrada até esta data (30 dias depois da publicação do redesign).
  const NOVIDADE_ATE = "2026-11-24";
  const REGRA_SENHA = "Use 10 ou mais caracteres, com letras e números. Nada óbvio, como 12345678 ou senha123, e sem o seu e-mail.";
  /** Aviso com ícone e texto (a cor nunca vai sozinha). tipo: erro | ok | atencao | info */
  const avisoHtml = (tipo, titulo, texto) => `<div class="aviso ${tipo}" role="${tipo === "erro" || tipo === "atencao" ? "alert" : "status"}"><b class="av-t">${esc(titulo)}</b>${texto ? `<p>${esc(texto)}</p>` : ""}</div>`;
  const avisoErro = (e) => avisoHtml(e?.message === SEM_REDE ? "atencao" : "erro", e?.message || "Não deu certo. Tente de novo.");
  const campoEntrada = (nome, rot, tipo, auto, valor = "") => `<div class="campo"><label for="f-${nome}">${rot}</label><input id="f-${nome}" name="${nome}" type="${tipo}" autocomplete="${auto}" value="${esc(valor)}" required${tipo === "email" ? ' inputmode="email" autocapitalize="off" spellcheck="false"' : ""}></div>`;
  const campoSenha = (nome, rot, auto, ajuda = "", extra = "") => `<div class="campo"><label for="f-${nome}">${rot}</label><div class="senha"><input id="f-${nome}" name="${nome}" type="password" autocomplete="${auto}" required ${extra}${ajuda ? ` aria-describedby="f-${nome}-a"` : ""}><button type="button" class="mostrar" aria-pressed="false" aria-controls="f-${nome}">Mostrar</button></div>${ajuda ? `<span class="ajuda" id="f-${nome}-a">${ajuda}</span>` : ""}</div>`;
  const cabEntrada = (titulo, sub, passo) => `<div class="cab-entrada">${passo ? `<p class="passo">${passo}</p>` : ""}<h1>${titulo}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}</div>`;
  /** Monta a página de entrada: fundo azul-marinho, logo da Seven em cima e o cartão do formulário. A lista "o que mudou" continua na Wiki; aqui não aparece mais. */
  function entrada(conteudo, opt = {}) {
    const app = document.getElementById("app");
    const sistema = esc(CFG.sistema || "Seven One");
    const pal = String(CFG.descricao || "").split(" "), desc = [pal.slice(0, -2).join(" "), pal.slice(-2).join(" ")].filter(Boolean);   // 2 linhas: a logo tem a largura da primeira
    app.innerHTML = `<div class="entrada">
      <aside class="marca-painel">
        <div class="marca-bloco">
          <img class="marca-logo" src="${esc(CFG.logoEscuro || "logo_escuro.png")}" alt="${sistema}">
          <p class="marca-desc">${desc.map((l) => `<span>${esc(l)}</span>`).join("")}</p>
        </div>
      </aside>
      <div class="centro">
        <main class="cartao${opt.largo ? " largo" : ""}"><img class="logo-entrada" src="${esc(CFG.logo || "logo.png")}" alt="${sistema}">${conteudo}</main>
        <p class="rodape">${sistema} · canal Claro</p>
      </div></div>`;
    const raiz = app.firstElementChild;   // ouvintes na página nova (o #app continua o mesmo entre as telas)
    raiz.addEventListener("click", (ev) => {   // "Mostrar" a senha digitada
      const b = ev.target.closest(".mostrar"); if (!b) return;
      const i = document.getElementById(b.getAttribute("aria-controls")), ver = i.type === "password";
      i.type = ver ? "text" : "password"; b.textContent = ver ? "Ocultar" : "Mostrar"; b.setAttribute("aria-pressed", String(ver));
    });
    raiz.addEventListener("input", (ev) => { const c = ev.target.closest(".campo.invalido"); if (c) { c.classList.remove("invalido"); c.querySelector(".msg-erro")?.remove(); } });
    return app;
  }
  /** Confere os campos obrigatórios e marca o que falta, sem apagar nada do que foi digitado. */
  function validar(f) {
    let primeiro = null;
    f.querySelectorAll("input[required]").forEach((i) => {
      if (String(i.value).trim()) return;
      const c = i.closest(".campo"); c.classList.add("invalido");
      if (!c.querySelector(".msg-erro")) c.insertAdjacentHTML("beforeend", `<span class="msg-erro">Preencha este campo.</span>`);
      primeiro ||= i;
    });
    primeiro?.focus();
    return !primeiro;
  }
  function telaLogin(msg) {
    const app = entrada(`${cabEntrada("Entrar", "Use o e-mail e a senha de sempre.")}<div id="e" aria-live="polite">${msg ? avisoHtml("info", msg) : ""}</div>
      <form id="f" novalidate>${campoEntrada("email", "E-mail", "email", "username")}${campoSenha("senha", "Senha", "current-password")}
      <button class="btn pri grande" type="submit">Entrar</button></form>
      <button type="button" class="link-entrada" id="esq">Esqueci a senha</button>`);
    app.querySelector("#esq").addEventListener("click", () => telaEsqueci(app.querySelector("#f-email").value));
    app.querySelector("#f").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = ev.target, b = f.querySelector("button[type=submit]");
      if (!validar(f)) return;
      b.disabled = true;
      try {
        const j = await api("/auth/login", { method: "POST", body: Object.fromEntries(new FormData(f)) });
        if (j.precisa_2fa) return telaCodigo2fa(j.ticket);
        entrou(j);
      } catch (e) { b.disabled = false; app.querySelector("#e").innerHTML = avisoErro(e); }
    });
  }
  function entrou(j) {
    salvar(j);
    if (j.usuario.trocar) telaTrocarSenha(true);
    else if (sessao.usuario.master) telaEntrarComo();   // master escolhe com qual função entrar
    else iniciar();
  }
  /** Segundo passo do login (verificação em dois fatores): código do aplicativo autenticador ou código de reserva. */
  function telaCodigo2fa(ticket, msg) {
    const app = entrada(`${cabEntrada("Código de verificação", "Abra o aplicativo autenticador e digite o código de 6 dígitos. Sem o celular, use um código de reserva.", "Verificação em dois fatores")}<div id="e" aria-live="polite">${msg ? avisoHtml("info", msg) : ""}</div>
      <form id="f" novalidate><div class="campo"><label for="f-codigo">Código</label><input id="f-codigo" name="codigo" type="text" inputmode="text" autocomplete="one-time-code" autocapitalize="off" maxlength="12" required></div>
      <button class="btn pri grande" type="submit">Entrar</button></form>
      <button type="button" class="link-entrada" id="vl">Voltar para o login</button>`);
    app.querySelector("#vl").addEventListener("click", () => telaLogin());
    app.querySelector("#f-codigo").focus();
    app.querySelector("#f").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = ev.target, b = f.querySelector("button[type=submit]");
      if (!validar(f)) return;
      b.disabled = true;
      try {
        const j = await api("/auth/2fa/entrar", { method: "POST", body: { ticket, codigo: f.codigo.value } });
        entrou(j);
        if (j.reserva_usada) setTimeout(() => alert(`Você entrou com um código de reserva. Restam ${j.reservas_restantes}. Gere novos em Meu perfil > Segurança.`), 600);
      } catch (e) {
        if (e.reiniciar || /Entre de novo|acabou/.test(e.message)) return telaLogin(e.message);
        b.disabled = false; app.querySelector("#e").innerHTML = avisoErro(e); f.codigo.select();
      }
    });
  }
  function telaEsqueci(email0) {
    const app = entrada(`${cabEntrada("Esqueci a senha", "Informe o e-mail do seu acesso para receber o link de nova senha.")}<div id="e" aria-live="polite"></div>
      <form id="f" novalidate>${campoEntrada("email", "E-mail", "email", "username", email0 || "")}<button class="btn pri grande" type="submit">Pedir nova senha</button></form>
      <button type="button" class="link-entrada" id="vl">Voltar para o login</button>`);
    app.querySelector("#vl").addEventListener("click", () => telaLogin());
    app.querySelector("#f").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = ev.target, b = f.querySelector("button[type=submit]");
      if (!validar(f)) return;
      b.disabled = true;
      try {
        const j = await api("/auth/esqueci-senha", { method: "POST", body: Object.fromEntries(new FormData(f)) });
        app.querySelector(".cab-entrada .sub").innerHTML = `Pedido feito para <b>${esc(f.email.value)}</b>.`;
        app.querySelector("#e").innerHTML = j.por_email ? avisoHtml("ok", "Confira o seu e-mail.", j.mensagem) : avisoHtml("ok", j.mensagem);
        f.remove();
        app.querySelector("#vl").outerHTML = `<button type="button" class="btn sec grande" id="vl2">Voltar para o login</button>`;
        app.querySelector("#vl2").addEventListener("click", () => telaLogin());
      } catch (e) { b.disabled = false; app.querySelector("#e").innerHTML = avisoErro(e); }
    });
  }
  /* Tela aberta pelo link do e-mail: #/redefinir/<token> */
  async function telaRedefinir(token) {
    const voltar = () => { history.replaceState(null, "", location.pathname); telaLogin(); };
    entrada(cabEntrada("Nova senha", "Conferindo o link…", "Link recebido por e-mail"));
    let info;
    try { info = await api(`/auth/redefinir-senha/${encodeURIComponent(token)}`); }
    catch (e) {
      const app = entrada(`${cabEntrada("Nova senha", "", "Link recebido por e-mail")}<div id="e">${avisoErro(e)}</div>
        <button type="button" class="btn pri grande" id="es">Pedir um link novo</button><button type="button" class="link-entrada" id="vl">Voltar para o login</button>`);
      app.querySelector("#es").addEventListener("click", () => { history.replaceState(null, "", location.pathname); telaEsqueci(); });
      app.querySelector("#vl").addEventListener("click", voltar);
      return;
    }
    const app = entrada(`${cabEntrada("Nova senha", `Acesso de <b>${esc(info.email)}</b>. Escolha a senha nova.`, "Link recebido por e-mail")}<div id="e" aria-live="polite"></div>
      <form id="f" novalidate>${campoSenha("senha_nova", "Senha nova", "new-password", REGRA_SENHA, 'minlength="10" maxlength="128"')}${campoSenha("senha_2", "Repita a senha nova", "new-password", "", 'minlength="10" maxlength="128"')}
      <button class="btn pri grande" type="submit">Salvar senha</button></form>
      <button type="button" class="link-entrada" id="vl">Voltar para o login</button>`);
    app.querySelector("#vl").addEventListener("click", voltar);
    app.querySelector("#f").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = ev.target;
      if (!validar(f)) return;
      const d = Object.fromEntries(new FormData(f));
      if (d.senha_nova !== d.senha_2) { app.querySelector("#e").innerHTML = avisoHtml("erro", "As duas senhas não são iguais."); return; }
      const b = f.querySelector("button[type=submit]"); b.disabled = true;
      try {
        const j = await api("/auth/redefinir-senha", { method: "POST", body: { token, senha_nova: d.senha_nova } });
        history.replaceState(null, "", location.pathname);
        telaLogin(j.mensagem || "Senha alterada. Entre com a senha nova.");
      } catch (e) { b.disabled = false; app.querySelector("#e").innerHTML = avisoErro(e); }
    });
  }
  function telaTrocarSenha(obrig) {
    const app = entrada(obrig
      ? `${cabEntrada("Defina a sua senha", "Para continuar, troque a senha temporária que você recebeu por uma senha só sua.", "Primeiro acesso")}<div id="e" aria-live="polite"></div>
        <form id="f" novalidate>${campoSenha("senha_atual", "Senha temporária", "current-password")}${campoSenha("senha_nova", "Senha nova", "new-password", REGRA_SENHA, 'minlength="10" maxlength="128"')}
        <button class="btn pri grande" type="submit">Salvar e continuar</button></form>`
      : `${cabEntrada("Trocar senha", "Escolha uma senha nova para o seu acesso.")}<div id="e" aria-live="polite"></div>
        <form id="f" novalidate>${campoSenha("senha_atual", "Senha atual", "current-password")}${campoSenha("senha_nova", "Senha nova", "new-password", REGRA_SENHA, 'minlength="10" maxlength="128"')}
        <button class="btn pri grande" type="submit">Salvar</button></form>
        <button type="button" class="link-entrada" id="v">Voltar ao sistema</button>
        <div class="sair-todos"><p>Esqueceu o sistema aberto em outro computador ou celular?</p><button class="btn sec grande" type="button" id="st">Sair de todos os aparelhos</button></div>`,
      { semNovidade: true });
    app.querySelector("#v")?.addEventListener("click", () => iniciar());
    app.querySelector("#st")?.addEventListener("click", async () => {
      if (!confirm("Encerrar o acesso em todos os aparelhos, inclusive este? Você vai precisar entrar de novo.")) return;
      try { await api("/auth/sair-todos", { method: "POST", body: {} }); sair("Sessões encerradas em todos os aparelhos. Entre novamente."); }
      catch (e) { app.querySelector("#e").innerHTML = avisoErro(e); }
    });
    app.querySelector("#f").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const f = ev.target;
      if (!validar(f)) return;
      const b = f.querySelector("button[type=submit]"); b.disabled = true;
      try {
        const j = await api("/auth/trocar-senha", { method: "POST", body: Object.fromEntries(new FormData(f)) });
        salvar({ token: j.token, usuario: { ...sessao.usuario, trocar: false } }); iniciar();
      } catch (e) { b.disabled = false; app.querySelector("#e").innerHTML = avisoErro(e); }
    });
  }

  /* ---------- casca: trilho de módulos, painel de páginas, barra do topo e, no app, a barra de baixo ---------- */
  const NAV = window.SEVEN_NAV;   // módulos, páginas e abas por perfil (navegacao.js)
  /* ícones das páginas (barra do app e escolha de função do master) */
  const ICM = {
    dashboard: '<rect x="3.5" y="3.5" width="7" height="8" rx="2"/><rect x="13.5" y="3.5" width="7" height="5" rx="2"/><rect x="13.5" y="11.5" width="7" height="9" rx="2"/><rect x="3.5" y="14.5" width="7" height="6" rx="2"/>',
    equipe: ICO.users, meu: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>',
    vendas: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>', nova: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    lote: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>', importvendas: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"/>', viabilidade: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    vendaexterna: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M8 10h8M8 14h5"/>',
    online: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="18" cy="8" r="2.5" fill="currentColor" stroke="none"/>',
    confirmacao: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>', rota: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H16a3.5 3.5 0 000-7H8a3.5 3.5 0 010-7h7.5"/>',
    fechamento: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4V2.8h6V4M9 11h6M9 15h4"/>', semvenda: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', pendencias: '<path d="M12 3l9.5 16.5h-19z"/><path d="M12 10v4M12 17.2v.1"/>', produtividade: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    "ind-vendas": ICO.trend, "ind-qualidade": '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>', fpd: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"/>',
    "ind-operacao": '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    "ind-pessoas": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>', "ind-geo": '<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4z"/><path d="M9 4v13.5M15 6.5V20"/>',
    comissao: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>', plano: ICO.target, extrato: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="M19 8v6M16 11h6"/>', feriados: ICO.cal, crm: ICO.cal, wiki: '<path d="M4 4.5A1.5 1.5 0 015.5 3H18a1 1 0 011 1v15a1 1 0 01-1 1H5.5A1.5 1.5 0 014 18.5z"/><path d="M4 16.5A1.5 1.5 0 015.5 15H19"/><path d="M8.5 7.5h6M8.5 11h4"/>', central: '<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  };
  const icm = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICM[k] || ICO.bars}</svg>`;
  const svgIc = (d, w = 1.7) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC_UI = {
    ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 014.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17.2v.1"/>',
    expandir: '<path d="M10 7l5 5-5 5"/>', recolher: '<path d="M14 7l-5 5 5 5"/>',
    busca: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', mais: '<path d="M12 5v14M5 12h14"/>',
  };
  /* nomes curtos no app (título do topo) */
  const CURTO = { crm: "Agenda", meu: "Início", vendas: "Vendas", viabilidade: "Viabilidade", vendaexterna: "Conexão / Solar", comissao: "Premiação", dashboard: "Início", semvenda: "Sem venda hoje", fechamento: "Hoje", equipe: "Equipes", pendencias: "Pendências" };
  const menuDe = (u) => NAV.menuAntigo(u);   // formato antigo do menu: a Wiki usa para mostrar só os assuntos das telas do perfil

  const iniciais = (n) => String(n || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  /** Foto ou iniciais em todos os lugares do avatar (trilho, menu da conta e topo do app). */
  function pintarAvatar(foto, nome) {
    document.querySelectorAll("[data-avatar]").forEach((av) => { av.innerHTML = foto ? `<img src="${esc(foto)}" alt="">` : esc(iniciais(nome)); });
  }
  /** Avisos fixos logo abaixo do topo (não rolam com a página). */
  function faixa(html) { const f = document.getElementById("faixas"); if (!f) return; f.insertAdjacentHTML("beforeend", html); document.body.classList.add("com-faixa"); }

  /** Painel de páginas do módulo aberto (no celular vira uma faixa de atalhos). */
  function pintarContexto(u, modulo, ativa) {
    const ctx = document.getElementById("ctx"); if (!ctx) return;
    const def = NAV.modulosDe(u).find(([m]) => m === modulo);
    if (!def) { ctx.innerHTML = ""; ctx.hidden = true; return; }
    ctx.hidden = false;
    ctx.innerHTML = `<h2>${esc(NAV.MODULO[modulo].nome)}</h2>` + def[1].map(([g, its]) => {
      const vis = its.filter(([, , mae]) => !mae);
      return vis.length ? `<div class="grp">${esc(g)}</div>` + vis.map(([k, n]) => `<a href="#/${k}" data-k="${k}"${k === ativa ? ' class="on" aria-current="page"' : ""}><span>${esc(n)}</span></a>`).join("") : "";
    }).join("") + `<div class="rodape"><button type="button" id="rc">${svgIc(IC_UI.recolher, 1.8)}Recolher painel de páginas</button></div>`;
    ctx.querySelector("#rc").addEventListener("click", () => recolher(true));
  }
  /** Painel de páginas: começa fechado; a pessoa abre se quiser e a escolha fica guardada neste navegador. */
  function recolher(sim) {
    document.body.classList.toggle("recolhido", sim);
    guardar("seven_paginas", sim ? "fechado" : "aberto");
    (sim ? document.getElementById("ex") : document.querySelector("#ctx a.on, #ctx a"))?.focus();
  }

  /** Quem está online (Gerente e backoffice): contagem e iniciais no topo, renovada a cada 2 minutos com a tela aberta. */
  let timerOnline = 0;
  function pintarOnline() {
    const a = document.getElementById("on"); if (!a || document.hidden) return;
    api("/online?nocache=1").then((j) => {
      const on = (j.itens || []).filter((x) => x.online);
      document.getElementById("on-n").textContent = `${nf.format(on.length)} online`;
      document.getElementById("on-p").innerHTML = on.slice(0, 3).map((x) => `<span>${esc(iniciais(x.nome))}</span>`).join("");
      a.title = on.length ? `Online agora: ${on.slice(0, 8).map((x) => x.nome).join(", ")}${on.length > 8 ? "…" : ""}` : "Ninguém online agora";
      a.hidden = false;
    }).catch(() => {});
  }

  /** App: barra de baixo e, para o vendedor, o "+" de registrar. */
  function appCasca(u) {
    const abas = NAV.abasApp(u), ok = NAV.permitidas(u);
    return `<nav class="tabbar" aria-label="Navegação do app">${abas.map(([k, n]) => k === "+"
      ? `<button type="button" class="tab-mais" id="rg-b" aria-haspopup="dialog" aria-label="Registrar: viabilidade, venda Conexão ou Solar, retorno na agenda">${svgIc(IC_UI.mais, 2.2)}</button>`
      : `<a href="#/${k}" data-k="${k}">${icm(k)}<span>${esc(n)}</span></a>`).join("")}</nav>
      ${abas.some(([k]) => k === "+") ? `<dialog class="folha" id="rg" aria-labelledby="rg-t"><h2 id="rg-t">Registrar</h2>${NAV.REGISTRAR.filter(([k]) => ok.has(k)).map(([k, n, d]) =>
        `<a href="#/${k}/novo" data-fecha><span class="ic">${icm(k)}</span><span><b>${esc(n)}</b><small>${esc(d)}</small></span></a>`).join("")}<button type="button" class="btn sec grande" data-fecha>Cancelar</button></dialog>` : ""}`;
  }

  /* ouvintes do documento: ligados uma vez só (iniciar() roda de novo ao trocar de perfil no "ver como") */
  let docLigado = false;
  const fecharConta = () => {
    const cm = document.getElementById("cm"); if (!cm || cm.hidden) return;
    cm.hidden = true; document.querySelectorAll("[aria-controls=cm]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  };
  function ligarDocumento() {
    if (docLigado) return; docLigado = true;
    document.addEventListener("click", (ev) => {
      const b = ev.target.closest("[aria-controls=cm]"), cm = document.getElementById("cm");
      if (!cm) return;
      if (b) {
        const abrir = cm.hidden; fecharConta();
        if (abrir) { cm.hidden = false; cm.classList.toggle("no-topo", !!b.closest(".app-topo")); b.setAttribute("aria-expanded", "true"); cm.querySelector("a, button")?.focus(); }
        return;
      }
      if (!ev.target.closest("#cm") || ev.target.closest("#cm a, #cm button")) fecharConta();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") fecharConta();
      if (ev.key === "/" && !ev.target.closest("input, textarea, select, [contenteditable]")) {   // "/" vai para a busca
        const i = document.getElementById("bu-i"); if (i && i.offsetParent) { ev.preventDefault(); i.focus(); }
      }
    });
    document.addEventListener("visibilitychange", pintarOnline);
  }

  /** Gerente, Administrador e backoffice sem 2FA: um aviso discreto (não é obrigatório). "Depois" some por 7 dias neste aparelho. */
  async function avisar2fa() {
    const u = sessao?.usuario;
    if (!u || u.dois_fatores || sessao.vercomo != null || !["gestor", "backoffice"].includes(u.perfil)) return;
    if (Date.now() < Number(ler("seven_2fa_depois") || 0)) return;
    const e = await api("/auth/2fa/estado?nocache=1").catch(() => null);
    const alvo = document.getElementById("aviso2fa");
    if (!e || !e.disponivel || e.ativo || !alvo) return;
    alvo.innerHTML = `<div class="aviso" role="status" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 10px"><span style="flex:1;min-width:220px"><b>Proteja a sua conta.</b> Ligue a verificação em dois fatores: leva 2 minutos e, com ela, você fica conectado por até 8 horas sem precisar entrar de novo (hoje são 2).</span>
      <a class="btn pq" href="#/perfil" id="a2-ir">Ativar agora</a><button class="btn sec pq" type="button" id="a2-dp">Depois</button></div>`;
    document.getElementById("a2-ir").addEventListener("click", () => { guardar("seven_2fa_aba", "seguranca"); alvo.innerHTML = ""; });
    document.getElementById("a2-dp").addEventListener("click", () => { guardar("seven_2fa_depois", String(Date.now() + 7 * 864e5)); alvo.innerHTML = ""; });
  }
  function iniciar() {
    if (window.SEVEN_APP?.bloqueia(sessao.usuario)) return;   // app do celular: só vendedores, líderes (supervisores e coordenadores) e Gerente
    document.body.classList.remove("com-faixa");
    const u = sessao.usuario, noApp = document.body.classList.contains("app-vendedor"), ok = NAV.permitidas(u);
    S.menuAtual = menuDe(u);   // a Wiki usa isto para mostrar só os assuntos das telas deste perfil
    const papel = rotPerfil(u.master ? "master" : u.cargo || u.perfil) + (u.perfil === "backoffice" ? (u.setor === "QUALIDADE" ? " · Qualidade" : " · Cadastro") : "");
    const avatar = `<span class="avatar" data-avatar>${esc(iniciais(u.nome))}</span>`;
    const contaBtn = (extra) => `<button type="button" class="conta" aria-haspopup="menu" aria-expanded="false" aria-controls="cm" title="Sua conta" aria-label="Sua conta"${extra || ""}>${avatar}</button>`;
    document.getElementById("app").innerHTML = `<div class="casca">
      <nav class="trilho" aria-label="Módulos">
        <a class="marca" href="#/${NAV.inicial(u)}" title="Página inicial"><img src="icone-192.png" alt="${esc(CFG.sistema || "Seven One")}"></a>
        <div class="modulos">${NAV.modulosDe(u).map(([m, grupos]) => {
          const info = NAV.MODULO[m], pags = grupos.flatMap(([, its]) => its).filter(([, , mae]) => !mae);
          return `<div class="item"><a href="#/${pags[0][0]}" class="mod" data-m="${m}">${svgIc(info.ic)}<span>${esc(info.curto)}</span></a>
            <div class="voo"><b>${esc(info.nome)}</b>${pags.map(([k, n]) => `<a href="#/${k}" data-k="${k}">${esc(n)}</a>`).join("")}</div></div>`;
        }).join("")}</div>
        <div class="fim">
          <button type="button" class="expandir" id="ex" title="Mostrar o painel de páginas">${svgIc(IC_UI.expandir, 1.8)}<span>Páginas</span></button>
          <a class="ajuda" id="aj" href="#/wiki" title="Ajuda: abre a Wiki no assunto desta tela">${svgIc(IC_UI.ajuda)}<span>Ajuda</span></a>
          ${contaBtn()}
        </div>
      </nav>
      <aside class="contexto" id="ctx" aria-label="Páginas do módulo"></aside>
      <div class="trabalho">
        ${noApp ? `<header class="app-topo"><b id="app-t"></b><a class="ajuda" id="aj2" href="#/wiki" title="Ajuda" aria-label="Ajuda">${svgIc(IC_UI.ajuda)}</a>${contaBtn()}</header>
          <nav class="etapas-app" id="etapas" aria-label="Etapas da venda" hidden></nav>` : ""}
        <header class="barra">
          <nav class="caminho" id="mg" aria-label="Você está em"></nav>
          ${ok.has("vendas") ? `<form class="busca" id="bu" role="search"><label class="sr" for="bu-i">Buscar contrato, cliente ou CPF</label>${svgIc(IC_UI.busca, 2)}<input id="bu-i" type="search" placeholder="Buscar contrato, cliente ou CPF" autocomplete="off" enterkeyhint="search"><kbd aria-hidden="true">/</kbd></form>` : ""}
          ${ok.has("online") ? `<a class="online" id="on" href="#/online" hidden><span class="ponto" aria-hidden="true"></span><span class="pts" id="on-p" aria-hidden="true"></span><span id="on-n"></span></a>` : ""}
          ${u.master ? `<button class="btn pq" id="vc" type="button" title="Ver o sistema como outro usuário (somente leitura)">Ver como…</button>` : ""}
        </header>
        <div id="faixas"></div>
        <div id="aviso2fa"></div>
        <main class="conteudo" id="ct"></main>
      </div>
    </div>
    <div class="conta-menu" id="cm" role="menu" aria-label="Sua conta" hidden>
      <div class="cm-cab">${avatar}<div><b>${esc(u.nome)}</b><small>${esc(papel)}</small></div></div>
      <a href="#/perfil" role="menuitem">Meu perfil</a>
      <button type="button" role="menuitem" id="sn">Trocar senha</button>
      ${u.master ? `<button type="button" role="menuitem" id="vc2">Ver como…</button>` : ""}
      <button type="button" role="menuitem" id="sx">Sair</button>
    </div>
    ${noApp ? appCasca(u) : ""}`;
    document.getElementById("sx").addEventListener("click", () => sair());
    document.getElementById("sn").addEventListener("click", () => telaTrocarSenha(false));
    avisar2fa();
    ["vc", "vc2"].forEach((id) => document.getElementById(id)?.addEventListener("click", escolherUsuario));
    document.getElementById("ex").addEventListener("click", () => recolher(false));
    document.body.classList.toggle("recolhido", ler("seven_paginas") !== "aberto");   // começa fechado; a pessoa abre se quiser
    document.getElementById("bu")?.addEventListener("submit", (ev) => { ev.preventDefault(); const q = document.getElementById("bu-i").value.trim(); if (q) S.filtrarVendas?.({ busca: q }); });
    const rg = document.getElementById("rg");
    document.getElementById("rg-b")?.addEventListener("click", () => rg.showModal());
    rg?.addEventListener("click", (ev) => { if (ev.target === rg || ev.target.closest("[data-fecha]")) rg.close(); });
    ligarDocumento();
    if (sessao.vercomo != null) {
      faixa(`<div class="faixa-ver"><span class="fv-txt">Vendo como <b>${esc(u.nome)}</b> · ${esc(rotPerfil(u.cargo || u.perfil))} · só consulta</span>
        <button class="btn pq" id="vv">Voltar ao master</button>
        <button type="button" class="fv-min" id="vmin" title="Minimizar este aviso" aria-label="Minimizar este aviso">–</button></div>`);
      // minimizar: vira uma pastilha pequena, para a tela ficar livre (fica assim até clicar nela de novo)
      const min = (v) => { document.body.classList.toggle("faixa-min", v); try { sessionStorage.setItem("seven_faixa_min", v ? "1" : ""); } catch {} };
      let guardado = ""; try { guardado = sessionStorage.getItem("seven_faixa_min") || ""; } catch {}
      min(!!guardado);
      document.getElementById("vmin").addEventListener("click", (e) => { e.stopPropagation(); min(!document.body.classList.contains("faixa-min")); });
      document.querySelector(".faixa-ver").addEventListener("click", (e) => { if (document.body.classList.contains("faixa-min") && !e.target.closest("#vv")) min(false); });
    }
    document.getElementById("vv")?.addEventListener("click", () => { sessao = { ...sessao, usuario: sessao.original, vercomo: null, vercomoPerfil: null, vercomoSetor: null, original: null }; gravarSessao(); cat = null; S_perfil = null; location.hash = "#/dashboard"; iniciar(); });
    CH.iniciar();
    try { localStorage.removeItem("seven_tema"); } catch {}   // o tema escuro saiu: esquece a preferência antiga
    delete document.documentElement.dataset.tema;
    fetch("/api/saude").then((r) => r.json()).then((j) => {
      if ((j.versao || 0) < (CFG.apiMinima || 0)) faixa(`<div class="faixa-erro">O servidor está desatualizado (versão ${j.versao || 1}, o site espera ${CFG.apiMinima}). Feche a janela preta do CMD, entre na pasta <b>api</b> nova e rode <b>npm start</b> de novo. Rota, Perfil e Novo colaborador só funcionam depois disso.</div>`);
    }).catch(() => {});
    // gerente: avisa os arquivos da pasta db que ainda não foram rodados no Supabase
    if (u.perfil === "gestor" && sessao.vercomo == null) api("/sistema/migracoes?nocache=1").then((j) => { if (j.faltando?.length) faixa(`<div class="faixa-erro">Faltam rodar no SQL Editor do Supabase, nesta ordem: <b>${j.faltando.map((x) => esc(x.arquivo)).join(", ")}</b> (pasta db). Até lá, algumas telas podem dar erro.</div>`); }).catch(() => {});
    window.SEVEN_GO = (d) => { if (d.f) S.filtrarVendas?.(d.f); else if (d.rota) S.filtrarRota?.(d.rota); else if (d.cen) S.filtrarCentral?.(d.cen); else if (d.h) location.hash = d.h; };
    api("/perfil").then((p) => { S.perfil = p; pintarAvatar(p.foto, p.nome_completo); }).catch(() => {});
    window.onhashchange = rotear; rotear();
    pintarOnline(); clearInterval(timerOnline); timerOnline = setInterval(pintarOnline, 120000);
    S.avisos?.iniciar(u);
    S.push?.iniciar();   // convite para ativar as notificações no celular (Gerente/Adm)
  }
  /** Master: menu suspenso para ver o sistema como qualquer perfil / pessoa (somente leitura), sem criar usuário de teste. */
  /** Pessoas que realmente têm aquele perfil (e, no backoffice, aquele setor). */
  const doPerfil = (pessoas, p) => {
    const [base, setor] = String(p).split(":");
    return pessoas.filter((x) => x.perfil_acesso === base && (!setor || (x.setor || "CADASTRO") === setor));
  };
  const PERFIS_VER = { vendedor: "Vendedor", lider: "Supervisor", coordenador: "Coordenador", "backoffice:CADASTRO": "Backoffice · Cadastro", "backoffice:QUALIDADE": "Backoffice · Qualidade", gestor: "Gerente", administrador: "Administrador" };

  /** Entra no sistema com o perfil de outra pessoa (só leitura). Usado pelo master. */
  function verComo(p, perfil, setor) {
    sessao = { ...sessao, original: sessao.original || sessao.usuario, vercomo: p.id, vercomoPerfil: perfil, vercomoSetor: setor || "",
      usuario: { id: p.id, nome: p.nome, perfil: perfil === "administrador" ? "gestor" : perfil, cargo: perfil === "administrador" ? "administrador" : undefined, setor: setor || null, master: false, vercomo: true, trocar: false } };
    gravarSessao(); cat = null; S_perfil = null; location.hash = "#/"; iniciar();
  }

  /** Depois do login do master: pergunta com qual função entrar (master mesmo ou vendo como alguém). */
  async function telaEntrarComo() {
    const nome = String(sessao.usuario.nome || "").split(" ")[0];
    const icoDe = (k) => icm(k === "master" ? "usuarios" : k.split(":")[0] === "backoffice" ? "lote" : k === "vendedor" ? "meu" : (k === "gestor" || k === "administrador") ? "dashboard" : "equipe");
    const cartao = (k, n, d) => `<button type="button" class="ec-op" data-p="${esc(k)}"><span class="ec-ic">${icoDe(k)}</span><span><b>${esc(n)}</b><small>${esc(d)}</small></span></button>`;
    const el = entrada(`${cabEntrada(`Olá, ${esc(nome)}`, "Você entrou como <b>master</b>. Com qual função quer abrir o sistema agora?")}<div id="e" aria-live="polite"></div>
      <div class="ec-lista">
        ${cartao("master", "Master (acesso total)", "Todas as telas, podendo alterar dados")}
        ${Object.entries(PERFIS_VER).map(([k, n]) => cartao(k, n, "Abre como esse perfil enxerga, só para consulta")).join("")}
      </div>`, { largo: true, semNovidade: true });
    el.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", async () => {
      const k = b.dataset.p;
      if (k === "master") return iniciar();
      try {
        const pessoas = await api("/equipes/pessoas").catch(() => []);
        const lista = doPerfil(pessoas, k);
        const [perfil, setor] = k.split(":");
        if (!lista.length) return verComo({ id: 0, nome: `${PERFIS_VER[k]} (sem pessoa)` }, perfil, setor);   // entra só com o perfil
        el.querySelector(".ec-lista").innerHTML = lista.map((p) => `<button type="button" class="ec-op" data-id="${p.id}"><span class="ec-ic ini">${esc(iniciais(p.nome))}</span><span><b>${esc(p.nome)}</b><small>${esc(p.email || "sem e-mail de acesso")}</small></span></button>`).join("")
          + `<button type="button" class="ec-op" data-id="0"><span class="ec-ic">${icm("dashboard")}</span><span><b>Sem pessoa específica</b><small>só as telas do perfil, em branco</small></span></button>`
          + `<button type="button" class="btn sec grande" id="ec-volta">← Escolher outra função</button>`;
        el.querySelector(".sub").innerHTML = `Entrando como <b>${esc(PERFIS_VER[k])}</b>. Escolha a pessoa:`;
        el.querySelectorAll("[data-id]").forEach((c) => c.addEventListener("click", () => verComo(lista.find((x) => x.id === +c.dataset.id) || { id: 0, nome: `${PERFIS_VER[k]} (sem pessoa)` }, perfil, setor)));
        el.querySelector("#ec-volta").addEventListener("click", () => telaEntrarComo());
      } catch (e) { el.querySelector("#e").innerHTML = avisoErro(e); }
    }));
  }

  async function escolherUsuario() {
    const pessoas = await api("/equipes/pessoas");
    const ROT = PERFIS_VER;
    const m = modal("Ver como…", `<p class="mut" style="margin-top:0">Escolha o perfil e a pessoa. O sistema abre exatamente como aquele perfil enxerga, só para consulta. Você volta ao master quando quiser.</p>
      <div class="campo" style="margin-bottom:10px"><label>Perfil</label><select id="vp">${Object.entries(ROT).map(([k, n]) => `<option value="${k}">${n}</option>`).join("")}</select></div>
      <div class="campo"><label>Pessoa</label><select id="vs"></select></div><div class="mut" id="vd" style="margin-top:8px"></div>`,
      `<button class="btn sec" id="vx">Cancelar</button><button class="btn" id="vo">Ver como</button>`);
    const vp = m.querySelector("#vp"), vs = m.querySelector("#vs");
    const NOTA = { lider: "Supervisor vê as equipes em que ele estiver como supervisor (Usuários e acessos → Equipes). Sem equipe atribuída, a tela aparece vazia.", coordenador: "Coordenador vê as equipes em que ele estiver como coordenador. Sem equipe atribuída, a tela aparece vazia.", vendedor: "Vendedor vê só as vendas da pessoa escolhida.", "backoffice:CADASTRO": "Backoffice de Cadastro: vendas, viabilidade, rota (com o D-1) e fechamento (aqui, só consulta).", "backoffice:QUALIDADE": "Backoffice de Qualidade: FPD (ver e lançar), D+1/D+15, cobrança e churn; vendas só para consulta.", gestor: "Gerente vê e administra tudo, inclusive o Extrato Claro (aqui, só consulta).", administrador: "Administrador tem as mesmas permissões do gerente (aqui, só consulta)." };
    const pinta = () => {
      const p = vp.value, opt = (x) => `<option value="${x.id}">${esc(x.nome)}</option>`;
      const iguais = doPerfil(pessoas, p);   // só quem realmente está nessa função
      vs.innerHTML = iguais.map(opt).join("") + `<option value="0">— Sem pessoa (só as telas do perfil) —</option>`;
      vs.disabled = false; m.querySelector("#vo").disabled = false;
      m.querySelector("#vd").textContent = iguais.length ? (NOTA[p] || "") : `Ninguém está com o perfil ${ROT[p]} hoje: dá para entrar assim mesmo, só para ver as telas.`;
    };
    pinta(); vp.addEventListener("change", pinta);
    m.querySelector("#vx").addEventListener("click", () => m.remove());
    m.querySelector("#vo").addEventListener("click", () => {
      const [perfil, setor] = vp.value.split(":");
      const p = pessoas.find((x) => x.id === +vs.value) || { id: 0, nome: `${ROT[vp.value]} (sem pessoa)` };
      m.remove();
      verComo(p, perfil, setor);
    });
  }
  /** Marca onde a pessoa está: módulo no trilho, página no painel, migalha no topo, aba do app e o assunto da Ajuda. */
  function mostrarOnde(u, nome) {
    const pags = NAV.paginasDe(u), p = pags.find((x) => x.chave === nome);
    const mae = nome === "venda" ? "vendas" : p?.mae || null, ativa = mae || nome;
    const pa = pags.find((x) => x.chave === ativa), modulo = pa?.modulo || null;
    document.body.dataset.modulo = modulo || "";   // o visual de cada módulo (ex.: Gestão) se apoia nisto em gestao.css
    document.querySelectorAll(".trilho .mod").forEach((a) => { const on = a.dataset.m === modulo; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    document.querySelectorAll(".trilho .voo a").forEach((a) => a.classList.toggle("on", a.dataset.k === ativa));
    pintarContexto(u, modulo, ativa);
    const fim = nome === "venda" ? "Detalhe da venda" : p?.nome || "";
    const partes = nome === "perfil" ? ["Sua conta", "Meu perfil"] : nome === "wiki" ? ["Ajuda", "Wiki"]
      : [modulo ? NAV.MODULO[modulo].nome : "", ...(mae ? [pa.nome] : []), fim].filter(Boolean);
    const mg = document.getElementById("mg");
    if (mg) mg.innerHTML = partes.map((t, i) => (i === partes.length - 1 ? `<b aria-current="page">${esc(t)}</b>` : mae && i === partes.length - 2 ? `<a href="#/${mae}">${esc(t)}</a>` : `<span>${esc(t)}</span>`)).join(`<i aria-hidden="true">/</i>`);
    document.title = `${partes[partes.length - 1] || ""} · ${CFG.sistema || "Seven One"}`;
    const destino = S.wikiLink?.(nome) || "#/wiki";   // a Ajuda abre a Wiki no assunto desta tela
    ["aj", "aj2"].forEach((id) => { const a = document.getElementById(id); if (a) a.href = destino; });
    const etapaVenda = u.perfil === "vendedor" && NAV.ETAPAS_VENDEDOR.some(([k]) => k === ativa);
    document.querySelectorAll(".tabbar a").forEach((a) => { const on = a.dataset.k === ativa || (etapaVenda && a.dataset.k === "vendas"); a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    const t = document.getElementById("app-t");
    if (t) t.textContent = nome === "venda" ? "Detalhe da venda" : nome === "perfil" ? "Meu perfil" : nome === "wiki" ? "Ajuda" : CURTO[nome] || fim;
  }
  /** A tela pode deixar a migalha mais precisa (ex.: "Contrato 61208457" no detalhe da venda). */
  function migalha(texto) {
    const b = document.querySelector("#mg b"); if (!b || !texto) return;
    b.textContent = texto; document.title = `${texto} · ${CFG.sistema || "Seven One"}`;
  }
  /** App do vendedor: as três etapas da venda (viabilidade, Conexão/Solar e contratos) em abas no alto da tela.
      Ficam fora do conteúdo, para continuarem lá quando a tela se redesenha sozinha. */
  function pintarEtapas(u, nome) {
    const n = document.getElementById("etapas"); if (!n) return;
    const mostra = u.perfil === "vendedor" && NAV.ETAPAS_VENDEDOR.some(([k]) => k === nome);
    n.hidden = !mostra;
    n.innerHTML = mostra ? NAV.ETAPAS_VENDEDOR.map(([k, t]) => `<a href="#/${k}"${k === nome ? ' class="on" aria-current="page"' : ""}>${esc(t)}</a>`).join("") : "";
    document.body.classList.toggle("com-etapas", mostra);
  }
  async function rotear() {
    if (!sessao) return;
    const [, pg, arg] = (location.hash || "").split("/");
    const u = sessao.usuario;
    const nome = PAGES[pg] && NAV.permitidas(u).has(pg) ? pg : NAV.inicial(u);
    mostrarOnde(u, nome);
    pintarEtapas(u, nome);
    S.avisos?.pintar?.();   // números de aviso no painel e na barra do app (redesenhados a cada tela)
    fecharConta();
    // cada navegação ganha o seu próprio contêiner: uma tela lenta que termina depois não sobrescreve a atual
    const ct = document.getElementById("ct"), el = document.createElement("div"); el.innerHTML = `<p class="mut carregando">Carregando…</p>`;
    ct.replaceChildren(el);
    try { await PAGES[nome](el, arg); S.ui?.botaoExportar(el); } catch (e) { erroEm(el)(e); }
    window.scrollTo(0, 0); ct.scrollTop = 0;
  }
  return { rotPerfil, get sessao() { return sessao; }, pintarAvatar, iniciais, get perfil() { return S_perfil; }, set perfil(v) { S_perfil = v; }, api, esc, nf, pct, brl, dt, du, mes, tabela, kpi, modal, painel, erroEm, baixar, catalogos, limparCatalogos, logo, telaLogin, telaEsqueci, telaRedefinir, telaTrocarSenha, iniciar, PAGES, sair, salvar,
    entrada, avisoHtml, migalha, acoes: (pg) => (sessao ? NAV.acoesDe(sessao.usuario, pg) : []), icone: icm };
})();
