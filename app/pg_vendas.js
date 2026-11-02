"use strict";
/* Vendas: lista, detalhe/edição, cadastro unitário e lançamento em lote */
(() => {
  const { esc, nf, brl, dt, tabela, painel, api, modal } = S;
  const staff = () => ["gestor", "backoffice"].includes(S.sessao.usuario.perfil);   // quem opera vendas (criar/editar)
  const eqp = () => ["lider", "coordenador"].includes(S.sessao.usuario.perfil);
  const opt = (arr, val, txt, sel, vazio) => (vazio ? `<option value="">${esc(vazio)}</option>` : "") + arr.map((x) => `<option value="${esc(val(x))}" ${String(val(x)) === String(sel ?? "") ? "selected" : ""}>${esc(txt(x))}</option>`).join("");
  const STATUS_V = ["PENDENTE", "ATIVO", "CANCELADO"], STATUS_C = ["CONECTADO", "DESABILITADO", "DESC INADIMPLENCIA", "DESC OPÇÃO", "CANCELADO"];
  const ROT_VENDA = { ATIVO: "INSTALADA", PENDENTE: "PENDENTE", CANCELADO: "CANCELADA" };   // "ATIVO" no banco = "Instalada" na linguagem da Claro
  const tagStatus = (s) => `<span class="tag ${{ ATIVO: "ok", PENDENTE: "alerta", CANCELADO: "ruim" }[s] || ""}">${esc(ROT_VENDA[s] || s)}</span>`;
  const campo = (rot, html, c = "c3") => `<div class="campo ${c}"><label>${esc(rot)}</label>${html}</div>`;
  const iso = (d) => (d ? String(d).slice(0, 10) : "");
  /** Endereço do DF aparece como Brasília-DF (só na tela; o dado guardado não muda). */
  const cidadeTela = (r) => (r.uf === "DF" ? "Brasília-DF" : (r.cidade ?? ""));
  /** Campo que só aceita números (CPF/CNPJ): bloqueia letras ao digitar e limpa pontos/traços ao colar. */
  const soNumeros = (i, max = 14) => {
    i.addEventListener("beforeinput", (e) => { if (e.data && e.inputType === "insertText" && /\D/.test(e.data)) e.preventDefault(); });
    i.addEventListener("input", () => { const v = i.value.replace(/\D/g, "").slice(0, max); if (v !== i.value) i.value = v; });
  };
  const qualidade = () => S.sessao.usuario.perfil === "backoffice" && S.sessao.usuario.setor === "QUALIDADE";   // só consulta
  S.filtrarVendas = (f) => { filtro = { busca: "", status: "", de: "", ate: "", vendedor: "", pagina: 1, ...f }; if (location.hash === "#/vendas") S.PAGES.vendas(document.getElementById("ct")).catch(S.erroEm(document.getElementById("ct"))); else location.hash = "#/vendas"; };
  const IC_BAIXAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/></svg>`;
  const DESC_ACAO = { nova: "Uma venda: cliente, produtos, pagamento e agendamento", lote: "Várias vendas coladas do Excel, conferidas linha a linha", importvendas: "Planilha de vendas da Claro" };
  /** Ações de lançar (S.acoes, já pelo perfil): "Nova venda" à mostra e as demais no menu ▾. */
  function menuAcoes(acs) {
    if (!acs.length) return "";
    const pri = acs.find((a) => a.chave === "nova") || acs[0], bt = `<a class="btn" href="#/${esc(pri.chave)}">${pri.chave === "nova" ? "+ " : ""}${esc(pri.nome)}</a>`;
    if (acs.length === 1) return bt;
    return `<div class="vd-menu">${bt}<button type="button" class="btn vd-mais" aria-haspopup="menu" aria-expanded="false" aria-label="Outras formas de lançar">▾</button>
      <div class="vd-pop" role="menu" hidden>${acs.map((a) => `<a role="menuitem" href="#/${esc(a.chave)}"><b>${esc(a.nome)}</b>${DESC_ACAO[a.chave] ? `<small>${esc(DESC_ACAO[a.chave])}</small>` : ""}</a>`).join("")}</div></div>`;
  }
  const fechaMenus = () => document.querySelectorAll(".vd-pop:not([hidden])").forEach((p) => { p.hidden = true; p.parentElement.querySelector(".vd-mais")?.setAttribute("aria-expanded", "false"); });
  if (!window.__vdMenuLigado) {   // um par de ouvintes só: clique fora e Esc fecham o menu
    window.__vdMenuLigado = true;
    document.addEventListener("click", (e) => {
      const b = e.target.closest?.(".vd-mais");
      if (!b) { if (!e.target.closest?.(".vd-pop")) fechaMenus(); return; }
      const p = b.parentElement.querySelector(".vd-pop"), abrir = p.hidden; fechaMenus();
      p.hidden = !abrir; b.setAttribute("aria-expanded", String(abrir)); if (abrir) p.querySelector("a")?.focus();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.querySelector(".vd-pop:not([hidden])")) { const b = document.querySelector(".vd-pop:not([hidden])").parentElement.querySelector(".vd-mais"); fechaMenus(); b?.focus(); } });
  }
  const ST_SEG = [["", "Todas"], ["ATIVO", "Instaladas"], ["PENDENTE", "Pendentes"], ["CANCELADO", "Canceladas"]];
  const ST_LISTA = { ATIVO: ["inst", "Instalada"], PENDENTE: ["pend", "Pendente"], CANCELADO: ["canc", "Cancelada"] };
  const prodsDe = (r) => [r.tem_bl && "Banda larga", r.tem_tv && "TV", r.tem_movel && "Móvel", r.tem_multi && "Multi"].filter(Boolean);
  // nomes vêm em maiúsculas do banco: "Mariana Albuquerque"; siglas sem vogal continuam em maiúsculas (QR, TV+, GB, DCC)
  const titulo = (s) => String(s || "").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())
    .replace(/(^|\s)([^\sAEIOUaeiouÁÉÍÓÚáéíóúÂÊÔâêôÃÕãõ\d]{2,4})(?=\s|$)/g, (m, a, w) => a + w.toUpperCase())
    .replace(/ (De|Da|Das|Do|Dos|E)(?= )/g, (m) => m.toLowerCase());   // "Francisco das Chagas", "Cristina de Paula"
  S.titulo = titulo;   // as outras telas usam a mesma regra para os nomes
  S.nomeExib = (s) => (s && s === s.toUpperCase() ? titulo(s) : s || "");   // só o que veio em maiúsculas (ex.: "Sistema / carga" fica igual)
  /** Produtos da lista ("categoria|qtd|nome;…") no formato curto do protótipo: 500 Mega, TV, 2 chips. */
  const prodsCurtos = (txt) => String(txt || "").split(";").filter(Boolean).map((x) => {
    const [cat, q, nome] = x.split("|"), n = +q || 1;
    if (cat === "VIRTUA") return titulo(nome.replace(/^INTERNET\s+/i, ""));
    if (cat === "TV") return n > 1 ? `${n} TV` : "TV";
    if (cat === "MOVEL") return n > 1 ? `${n} chips` : "1 chip";
    if (cat === "FONE") return "Fone";
    if (cat === "MESH") return n > 1 ? `${n} Wi-Fi Mesh` : "Wi-Fi Mesh";
    return titulo(nome);
  });
  const turnoCurto = (t) => (!t ? "" : +String(t).slice(0, 2) < 12 ? "manhã" : "tarde");
  const ddmm = (d) => (d ? dt(d).slice(0, 5) : "");
  /** Coluna Instalação: agendamento da pendente (atrasada se a data passou), dia da instalação ou motivo do cancelamento. */
  function instCel(r) {
    if (r.status_venda === "CANCELADO") return `<span class="inst-cel">${esc(r.motivo ? r.motivo.toLowerCase() : "cancelada")}</span>`;
    if (r.status_venda === "ATIVO") return `<span class="inst-cel">${r.data_agendamento ? "instalada " + ddmm(r.data_agendamento) : "instalada"}</span>`;
    if (!("data_agendamento" in r)) return "–";
    if (!r.data_agendamento) return `<span class="inst-cel alerta">sem agendamento</span>`;
    const hoje = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10), atras = iso(r.data_agendamento) < hoje;
    return `<span class="inst-cel${atras ? " atrasada" : ""}">${ddmm(r.data_agendamento)}${atras ? " · atrasada" : r.turno ? " · " + turnoCurto(r.turno) : ""}</span>`;
  }
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mesDe = (m) => { const [a, mm] = m.split("-").map(Number); return { de: `${m}-01`, ate: `${m}-${String(new Date(a, mm, 0).getDate()).padStart(2, "0")}`, rot: `${MESES[mm - 1]} de ${a}` }; };
  const mesAtual = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 7);
  /** Período do filtro: um mês inteiro (valor AAAA-MM), todo o período ("") ou datas livres ("livre"). */
  const periodoDe = (f) => { if (!f.de && !f.ate) return ""; const m = String(f.de).slice(0, 7), x = mesDe(m); return f.de === x.de && f.ate === x.ate ? m : "livre"; };
  let filtro = null;   // começa no mês atual, como no protótipo (no computador e no app)

  /* ---------- lista: mesmo desenho do protótipo aprovado (design/prototipos/direcao-a.html, telaVendas) ---------- */
  /* Colunas da lista: quem vê escolhe quais mostrar; a escolha fica só neste navegador */
  const COLS_LISTA = ["Data", "Contrato", "Cliente", "Vendedor", "Produtos", "Situação", "Instalação"], CH_COLS = "seven_vendas_colunas";
  const colsOcultas = () => { try { return new Set(JSON.parse(localStorage.getItem(CH_COLS) || "[]")); } catch { return new Set(); } };
  const gravaCols = (s) => { try { localStorage.setItem(CH_COLS, JSON.stringify([...s])); } catch {} };
  function aplicaCols(el) {
    const oc = colsOcultas();
    COLS_LISTA.forEach((c, i) => el.querySelectorAll(`.tabela.colada th:nth-child(${i + 1}), .tabela.colada td[data-l="${c}"]`).forEach((x) => (x.hidden = oc.has(c))));
  }
  S.PAGES.vendas = async (el) => {
    if (!filtro) filtro = { busca: "", status: "", de: mesDe(mesAtual()).de, ate: mesDe(mesAtual()).ate, vendedor: "", equipe: "", pagina: 1 };
    let cat = staff() ? await S.catalogos() : null;
    if (eqp()) {   // supervisor/coordenador: o filtro de vendedor lista só quem está no escopo dele
      const m = new Map(); (await api("/equipe/desempenho")).forEach((r) => m.set(r.vendedor_id, r.vendedor_nome));
      cat = { vendedores: [...m].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome)) };
    }
    const qs = () => Object.entries(filtro).filter(([, v]) => v !== "" && v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    const j = await api("/contratos?" + qs());
    const paginas = Math.max(1, Math.ceil(j.total / 50));
    if (document.body.classList.contains("app-vendedor") && !staff() && !eqp()) return appVendas(el, j, paginas);
    const lider = S.sessao.usuario.perfil === "lider";
    const ct = j.contagem || {}, lanc = (ct.ATIVO || 0) + (ct.PENDENTE || 0) + (ct.CANCELADO || 0);
    const per = periodoDe(filtro), perRot = per === "" ? "no total" : per === "livre" ? `de ${dt(filtro.de) || "…"} a ${dt(filtro.ate) || "…"}` : "em " + mesDe(per).rot.split(" de ")[0];
    const eqNome = filtro.equipe ? titulo(cat?.equipes?.find((e) => String(e.id) === String(filtro.equipe))?.nome) : "";
    const escopo = eqNome ? ` na equipe ${esc(eqNome)}` : staff() ? "" : eqp() ? ` na sua ${lider ? "equipe" : "coordenação"}` : " suas";
    const vendNome = cat?.vendedores.find((x) => String(x.id) === String(filtro.vendedor))?.nome;
    // filtros ativos: cada um com o × que tira só ele
    const ativos = [per && ["periodo", per === "livre" ? `Venda de ${dt(filtro.de) || "…"} a ${dt(filtro.ate) || "…"}` : titulo(mesDe(per).rot).replace(" De ", " de ")],
      filtro.status && ["status", "Situação: " + ST_LISTA[filtro.status][1].toLowerCase()], eqNome && ["equipe", "Equipe: " + eqNome],
      filtro.vendedor && ["vendedor", "Vendedor: " + (vendNome || filtro.vendedor)], filtro.busca && ["busca", `Busca: “${filtro.busca}”`]].filter(Boolean);
    const meses = Array.from({ length: 12 }, (_, i) => { const d = new Date(Date.now() - 3 * 3600e3); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - i); return d.toISOString().slice(0, 7); });
    const opPer = meses.map((m) => `<option value="${m}"${per === m ? " selected" : ""}>${esc(titulo(mesDe(m).rot).replace(" De ", " de "))}</option>`).join("")
      + `<option value=""${per === "" ? " selected" : ""}>Todo o período</option><option value="livre"${per === "livre" ? " selected" : ""}>Escolher as datas…</option>`;
    const td = (rot, html, cls = "") => `<td data-l="${rot}"${cls ? ` class="${cls}"` : ""}>${html}</td>`;
    const ini = j.itens.length ? (j.pagina - 1) * 50 + 1 : 0, fim = (j.pagina - 1) * 50 + j.itens.length;
    const pags = [...new Set([1, j.pagina - 1, j.pagina, j.pagina + 1, paginas].filter((n) => n >= 1 && n <= paginas))].sort((a, b) => a - b);
    const prods = (r) => (r.produtos !== undefined ? prodsCurtos(r.produtos) : prodsDe(r));
    el.innerHTML = `<div class="tela-vendas"><div class="cab"><div><h1>${staff() ? "Vendas" : eqp() ? (lider ? "Vendas da equipe" : "Vendas da coordenação") : "Minhas vendas"}</h1>
        <div class="linha"><span><b>${nf.format(lanc)} ${lanc === 1 ? "lançada" : "lançadas"}</b> ${perRot}${escopo}</span><span>${nf.format((ct.ATIVO || 0) + (ct.PENDENTE || 0))} válidas · ${nf.format(ct.CANCELADO || 0)} canceladas</span><span>Situação de hoje de cada venda</span></div></div>
      <div class="acoes">${qualidade() ? "" : `<button class="btn sec" id="ex" title="Baixa todas as vendas do filtro atual, não só esta página">${IC_BAIXAR}Exportar ${nf.format(j.total)} (CSV)</button>`}${menuAcoes(S.acoes("vendas"))}</div></div>
      <div class="filtros">
        <div class="campo vd-f-per"><label for="fp">Período</label><select id="fp">${opPer}</select></div>
        ${per === "livre" ? `<div class="campo vd-f-data"><label for="fd">Venda de</label><input id="fd" type="date" value="${esc(filtro.de)}"></div><div class="campo vd-f-data"><label for="fa">até</label><input id="fa" type="date" value="${esc(filtro.ate)}"></div>` : ""}
        <div class="campo"><span class="r" id="fs-r">Situação</span><div class="seg" id="fs" role="group" aria-labelledby="fs-r">${ST_SEG.map(([k, n]) => `<button type="button" data-st="${k}" class="${filtro.status === k ? "on" : ""}" aria-pressed="${filtro.status === k}">${n} <span class="n">${nf.format(k ? ct[k] || 0 : lanc)}</span></button>`).join("")}</div></div>
        ${staff() && cat?.equipes ? `<div class="campo vd-f-sel"><label for="fe">Equipe</label><select id="fe">${opt(cat.equipes, (x) => x.id, (x) => titulo(x.nome), filtro.equipe, "Todas as equipes")}</select></div>` : ""}
        ${cat ? `<div class="campo vd-f-sel"><label for="fv">Vendedor</label><select id="fv">${opt(cat.vendedores, (x) => x.id, (x) => x.nome, filtro.vendedor, "Todos")}</select></div>` : ""}
        <div class="campo vd-f-busca"><label for="fb">Buscar</label><input id="fb" type="search" value="${esc(filtro.busca)}" placeholder="Cliente, contrato ou CPF"></div></div>
      <div class="ativos"><span>Filtros ativos:</span>${ativos.length ? ativos.map(([k, t]) => `<span class="chip">${esc(t)} <button type="button" data-tira="${k}" aria-label="Remover filtro ${esc(t)}">×</button></span>`).join("") : "<span>nenhum</span>"}${ativos.length ? `<button class="btn leve pq" id="lp">Limpar filtros</button>` : ""}
        <span class="vd-cols">Colunas: <button type="button" id="vc" aria-expanded="false" aria-controls="vc-p">escolher</button>
          <span class="vd-cols-pop" id="vc-p" role="group" aria-label="Colunas visíveis" hidden>${COLS_LISTA.map((c) => `<label><input type="checkbox" data-col="${c}" ${colsOcultas().has(c) ? "" : "checked"}> ${c}</label>`).join("")}</span></span></div>
      <table class="tabela colada"><thead><tr><th>Data</th><th>Contrato</th><th>Cliente</th><th>Vendedor</th><th>Produtos</th><th>Situação</th><th>Instalação</th></tr></thead>
      <tbody>${j.itens.map((r) => { const s = ST_LISTA[r.status_venda] || ["neutro", r.status_venda]; return `<tr ${staff() ? `class="link" data-id="${r.contrato_id}" tabindex="0"` : ""}>${td("Data", ddmm(r.data_venda), "num")}${td("Contrato", esc(r.numero_contrato ?? "–"), "mono")}
        ${td("Cliente", `<b>${esc(r.cliente ?? "")}</b>${r.bairro ? `<span class="sub">${esc(titulo(r.bairro))}</span>` : ""}`)}${td("Vendedor", esc(r.vendedor ?? ""))}
        ${td("Produtos", `<span class="prods">${prods(r).map((p) => `<span>${esc(p)}</span>`).join("") || "–"}</span>`)}
        ${td("Situação", `<span class="st ${s[0]}">${esc(s[1])}</span>`)}${td("Instalação", instCel(r))}</tr>`; }).join("") || `<tr><td colspan="7" class="mut">Nenhuma venda encontrada.</td></tr>`}</tbody></table>
      <div class="rodape-tab"><span>${ini}–${fim} de ${nf.format(j.total)} · ordenadas pela data da venda</span>
        <div class="pag"><button type="button" data-pg="${j.pagina - 1}" ${j.pagina <= 1 ? "disabled" : ""} aria-label="Página anterior">‹</button>${pags.map((n, i) => `${i && n - pags[i - 1] > 1 ? "<span>…</span>" : ""}<button type="button" data-pg="${n}"${n === j.pagina ? ' class="on" aria-current="page"' : ""}>${n}</button>`).join("")}<button type="button" data-pg="${j.pagina + 1}" ${j.pagina >= paginas ? "disabled" : ""} aria-label="Próxima página">›</button></div></div></div>`;
    const go = () => S.PAGES.vendas(el).catch(S.erroEm(el));
    const muda = (f) => { filtro = { ...filtro, ...f, pagina: 1 }; go(); };
    el.querySelector("#fp").addEventListener("change", (e) => { const v = e.target.value; if (v === "livre") { filtro = { ...filtro, de: filtro.de || mesDe(mesAtual()).de, ate: "" }; go(); } else muda(v ? { de: mesDe(v).de, ate: mesDe(v).ate } : { de: "", ate: "" }); });
    el.querySelector("#fd")?.addEventListener("change", (e) => muda({ de: e.target.value }));
    el.querySelector("#fa")?.addEventListener("change", (e) => muda({ ate: e.target.value }));
    el.querySelectorAll("#fs [data-st]").forEach((b) => b.addEventListener("click", () => muda({ status: b.dataset.st })));
    el.querySelector("#fe")?.addEventListener("change", (e) => muda({ equipe: e.target.value }));
    el.querySelector("#fv")?.addEventListener("change", (e) => muda({ vendedor: e.target.value }));
    el.querySelector("#fb").addEventListener("keydown", (e) => e.key === "Enter" && muda({ busca: e.target.value.trim() }));
    el.querySelector("#fb").addEventListener("search", (e) => !e.target.value && filtro.busca && muda({ busca: "" }));
    el.querySelectorAll("[data-tira]").forEach((b) => b.addEventListener("click", () => muda(b.dataset.tira === "periodo" ? { de: "", ate: "" } : { [b.dataset.tira]: "" })));
    aplicaCols(el);
    const vc = el.querySelector("#vc"), vp = el.querySelector("#vc-p");
    const fechaCols = () => { vp.hidden = true; vc.setAttribute("aria-expanded", "false"); };
    vc.addEventListener("click", () => { vp.hidden = !vp.hidden; vc.setAttribute("aria-expanded", String(!vp.hidden)); });
    el.addEventListener("click", (e) => { if (!vp.hidden && !e.target.closest(".vd-cols")) fechaCols(); });
    vp.addEventListener("keydown", (e) => { if (e.key === "Escape") { fechaCols(); vc.focus(); } });
    vp.addEventListener("change", (e) => {
      const oc = colsOcultas(), c = e.target.dataset.col;
      if (e.target.checked) oc.delete(c); else if (oc.size < COLS_LISTA.length - 1) oc.add(c); else { e.target.checked = true; return; }   // pelo menos uma coluna
      gravaCols(oc); aplicaCols(el);
    });
    el.querySelector("#lp")?.addEventListener("click", () => { filtro = { busca: "", status: "", de: "", ate: "", vendedor: "", equipe: "", pagina: 1 }; go(); });
    el.querySelector("#ex")?.addEventListener("click", (e) => { const b = e.currentTarget; b.disabled = true; const q = qs().replace(/(^|&)pagina=\d+/, "").replace(/^&/, ""); S.baixar("/exportar/contratos?" + q, "vendas-" + new Date().toISOString().slice(0, 10) + ".csv").catch((x) => alert(x.message)).finally(() => (b.disabled = false)); });
    el.querySelectorAll(".pag [data-pg]").forEach((b) => b.addEventListener("click", () => { filtro.pagina = +b.dataset.pg; go(); }));
    el.querySelectorAll("tr[data-id]").forEach((tr) => {
      tr.addEventListener("click", () => (location.hash = "#/venda/" + tr.dataset.id));
      tr.addEventListener("keydown", (e) => e.key === "Enter" && (location.hash = "#/venda/" + tr.dataset.id));
    });
  };

  /* ---------- app do vendedor: mesmo desenho do protótipo (design/prototipos/direcao-a-app.html, "Minhas vendas") ---------- */
  const ROT_ST = { "": "Todas", PENDENTE: "Pendentes", ATIVO: "Instaladas", CANCELADO: "Canceladas" };
  const COR_ST = { ATIVO: "ok", PENDENTE: "alerta", CANCELADO: "ruim" };
  const NOME_ST = { ATIVO: "Instalada", PENDENTE: "Pendente", CANCELADO: "Cancelada" };
  const ST_APP = { ATIVO: "ok", PENDENTE: "pend", CANCELADO: "canc" };
  const IC_BUSCA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>`;
  function appVendas(el, j, paginas) {
    const go = () => S.PAGES.vendas(el).catch(S.erroEm(el));
    // Mês/ano: últimos 12 meses. "Todos os meses" = sem filtro de data (comportamento anterior).
    const hoje = new Date(), meses = [];
    for (let i = 0; i < 12; i++) { const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1); meses.push({ v: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, t: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) }); }
    const mesSel = filtro.de && filtro.de.endsWith("-01") && filtro.ate && filtro.ate.slice(0, 7) === filtro.de.slice(0, 7) ? filtro.de.slice(0, 7) : "";
    const mesNome = mesSel ? meses.find((x) => x.v === mesSel)?.t.split(" de ")[0] || mesSel : "";
    const ct = j.contagem || {}, lanc = (ct.ATIVO || 0) + (ct.PENDENTE || 0) + (ct.CANCELADO || 0) || j.total;
    // título no topo do app, como no protótipo: "Minhas vendas · Outubro · 21 contratos lançados"
    const tit = document.getElementById("app-t");
    if (tit) tit.innerHTML = `Minhas vendas<span class="sub">${esc(mesNome ? mesNome.charAt(0).toUpperCase() + mesNome.slice(1) : "Todos os meses")} · ${nf.format(lanc)} ${lanc === 1 ? "contrato lançado" : "contratos lançados"}</span>`;
    const hojeIso = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
    /** O que vem a seguir, só com o que a venda já traz: motivo do cancelamento ou a confirmação D+15 (contada da data da venda). */
    const prox = (r) => {
      if (r.status_venda === "CANCELADO") return r.motivo ? `<span class="prox">Motivo: ${esc(r.motivo.toLowerCase())}</span>` : "";
      if (r.status_venda === "ATIVO") { const d = maisDias(r.data_venda, 15); return d >= hojeIso ? `<span class="prox">Confirmação D+15 em ${ddmm(d)}</span>` : ""; }
      // pendente: o agendamento da instalação (a view do vendedor traz data e turno desde a migração 50)
      if (r.data_agendamento) { const d = String(r.data_agendamento).slice(0, 10);
        return d < hojeIso ? `<span class="prox alerta">Instalação atrasada: era ${ddmm(d)}</span>` : `<span class="prox">Instalação ${ddmm(d)}${r.turno ? " · " + turnoCurto(r.turno) : ""}</span>`; }
      return "";
    };
    el.innerHTML = `<div class="vd-app">
      <form class="busca-app" id="fbusca" role="search">${IC_BUSCA}<input id="fb" type="search" inputmode="numeric" enterkeyhint="search" placeholder="Buscar pelo nº do contrato" aria-label="Buscar pelo número do contrato" value="${esc(filtro.busca)}"></form>
      <div class="chips-app"><label class="chip-mes"><span class="sr">Mês</span><select id="fmes"><option value="">Todos os meses</option>${meses.map((x) => `<option value="${x.v}" ${x.v === mesSel ? "selected" : ""}>${x.t.charAt(0).toUpperCase() + x.t.slice(1)}</option>`).join("")}</select></label>
        ${Object.entries(ROT_ST).map(([k, n]) => `<button type="button" data-st="${k}" class="${filtro.status === k ? "on" : ""}" aria-pressed="${filtro.status === k}">${n} ${nf.format(k ? ct[k] || 0 : lanc)}</button>`).join("")}</div>
      ${j.itens.length ? `<ul class="vendas-app">${j.itens.map((r, i) => `<li data-i="${i}" role="button" tabindex="0">
          <b>${esc(r.cliente ? titulo(r.cliente) : r.numero_contrato ? "Contrato " + r.numero_contrato : "Venda")}</b><span class="st ${ST_APP[r.status_venda] || ""}">${esc(NOME_ST[r.status_venda] || r.status_venda || "")}</span>
          <span class="meta">${[r.cliente && r.numero_contrato ? `<span class="mono">${esc(r.numero_contrato)}</span>` : "", ddmm(r.data_venda), prodsDe(r).join(" + ")].filter(Boolean).join(" · ")}</span>
          ${prox(r)}</li>`).join("")}</ul>`
        : `<div class="ap-vazio"><b>Nenhuma venda encontrada</b><span>${filtro.busca || filtro.status ? "Tente outra busca ou toque em “Todas”." : "Assim que suas vendas forem lançadas, elas aparecem aqui."}</span></div>`}
      ${paginas > 1 ? `<div class="ap-pag"><button class="btn sec" id="an" ${j.pagina <= 1 ? "disabled" : ""}>‹ Anteriores</button><span>${j.pagina} de ${paginas}</span><button class="btn sec" id="px" ${j.pagina >= paginas ? "disabled" : ""}>Próximas ›</button></div>` : ""}</div>`;
    el.querySelector("#fbusca").addEventListener("submit", (e) => { e.preventDefault(); filtro = { ...filtro, busca: el.querySelector("#fb").value.trim(), pagina: 1 }; go(); });
    el.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", () => { filtro = { ...filtro, status: b.dataset.st, pagina: 1 }; go(); }));
    el.querySelector("#fmes").addEventListener("change", (e) => {
      const m = e.target.value, [y, mo] = m ? m.split("-").map(Number) : [0, 0];
      filtro = { ...filtro, de: m ? `${m}-01` : "", ate: m ? `${m}-${String(new Date(y, mo, 0).getDate()).padStart(2, "0")}` : "", pagina: 1 }; go();
    });
    el.querySelector("#an")?.addEventListener("click", () => { filtro.pagina--; go(); });
    el.querySelector("#px")?.addEventListener("click", () => { filtro.pagina++; go(); });
    el.querySelectorAll(".vendas-app li[data-i]").forEach((c) => {
      c.addEventListener("click", () => detalheApp(j.itens[+c.dataset.i]));
      c.addEventListener("keydown", (e) => e.key === "Enter" && detalheApp(j.itens[+c.dataset.i]));
    });
  }
  /** Toque numa venda: abre a ficha dela por baixo da tela (folha do app). */
  function detalheApp(r) {
    const lin = (k, v) => (v ? `<div class="ap-ficha-l"><span>${k}</span><b>${v}</b></div>` : "");
    const prods = [r.tem_bl && "Banda larga", r.tem_tv && "TV", r.tem_movel && "Móvel", r.tem_multi && "Multi"].filter(Boolean).join(" · ");
    const m = S.modal(r.numero_contrato ? "Contrato " + r.numero_contrato : "Venda", `<div class="ap-ficha"><div class="ap-ficha-st"><span class="tag ${COR_ST[r.status_venda] || ""}">${esc(NOME_ST[r.status_venda] || r.status_venda || "")}</span></div>
      ${lin("Data da venda", dt(r.data_venda))}${lin("Produtos", esc(prods))}${lin("Status do contrato", esc(r.status_contrato || ""))}${lin("Cidade", esc([r.bairro, r.uf === "DF" ? "Brasília-DF" : r.cidade].filter(Boolean).join(" · ")))}
      ${lin("Pagamento", esc(r.forma_pagamento === "DCC" ? "Débito em conta" : r.forma_pagamento || ""))}${lin("Origem", esc(r.origem || ""))}${lin("Motivo", esc(r.motivo || ""))}</div>`, `<button class="btn" type="button" data-fecha>Fechar</button>`);
    m.querySelector("[data-fecha]").addEventListener("click", () => m.remove());
  }

  /* ---------- produtos (checklist) ---------- */
  const NOME_CAT = { VIRTUA: "Internet", TV: "TV", MOVEL: "Móvel", MESH: "Wi-Fi Mesh", FONE: "Fone", MPLAY: "MPlay", PONTO_ADICIONAL: "Ponto adicional" };
  /** Produtos em "chips": uma linha por categoria; clicar liga/desliga; ao marcar aparece o controle de quantidade. */
  const resumoProdutos = (cat, sel) => sel.length ? sel.map((x) => `<span class="rp">${x.q > 1 ? x.q + "× " : ""}${esc(x.nome)}</span>`).join("") : `<span class="mut">Nenhum produto marcado</span>`;
  function checklistProdutos(cat, marcados = []) {
    const m = new Map(marcados.map((i) => [i.produto_id, i]));
    const grupos = {}; cat.produtos.forEach((p) => (grupos[p.categoria] ||= []).push(p));
    const sel = cat.produtos.filter((p) => m.has(p.id)).map((p) => ({ nome: p.nome, q: m.get(p.id).quantidade || 1 }));
    const ORDEM = ["VIRTUA", "TV", "MOVEL", "FONE", "MESH", "MPLAY", "PONTO_ADICIONAL"], gs = Object.entries(grupos).sort((a, b) => (ORDEM.indexOf(a[0]) + 1 || 99) - (ORDEM.indexOf(b[0]) + 1 || 99));
    return `<div class="prods"><div class="prods-sel"><b>Selecionados</b><div class="rps">${resumoProdutos(cat, sel)}</div></div>
      ${gs.map(([g, ps]) => `<div class="prods-cat"><div class="prods-nome">${esc(NOME_CAT[g] || g)}</div><div class="prods-chips">
        ${ps.map((p) => { const x = m.get(p.id); return `<label class="chip ${x ? "on" : ""}"><input type="checkbox" data-p="${p.id}" data-n="${esc(p.nome)}" ${x ? "checked" : ""}><span class="cn">${esc(p.nome)}</span><span class="qt" title="Quantidade"><button type="button" class="qm" tabindex="-1">−</button><input type="number" min="1" value="${x?.quantidade || 1}" data-q="${p.id}"><button type="button" class="qp" tabindex="-1">+</button></span></label>`; }).join("")}</div></div>`).join("")}</div>`;
  }
  if (!window.__prodsLigado) {
    window.__prodsLigado = true;
    const atualiza = (box) => {
      const sel = [...box.querySelectorAll("input[data-p]:checked")].map((c) => ({ nome: c.dataset.n, q: +box.querySelector(`input[data-q="${c.dataset.p}"]`).value || 1 }));
      box.querySelector(".rps").innerHTML = resumoProdutos(null, sel);
    };
    document.addEventListener("change", (e) => { const c = e.target; if (c.matches?.(".prods input[data-p]")) { c.closest(".chip").classList.toggle("on", c.checked); atualiza(c.closest(".prods")); } else if (c.matches?.(".prods input[data-q]")) atualiza(c.closest(".prods")); });
    document.addEventListener("click", (e) => {
      const b = e.target.closest?.(".prods .qm, .prods .qp"); if (!b) return;
      e.preventDefault(); const i = b.parentElement.querySelector("input"); i.value = Math.max(1, (+i.value || 1) + (b.classList.contains("qp") ? 1 : -1)); i.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
  const lerProdutos = (el) => [...el.querySelectorAll("input[data-p]:checked")].map((c) => ({ produto_id: +c.dataset.p, quantidade: +el.querySelector(`input[data-q="${c.dataset.p}"]`).value || 1 }));

  /* ---------- campos da venda (formulário unitário e edição) ---------- */
  function camposVenda(cat, v = {}) {
    return `${campo("Data da venda", `<input name="data_venda" type="date" value="${iso(v.data_venda) || iso(new Date().toISOString())}" required>`)}
      ${campo("Nº do contrato", `<input name="numero_contrato" inputmode="numeric" value="${esc(v.numero_contrato ?? "")}">`)}
      ${campo("Vendedor", `<select name="vendedor_id" ${v.id ? "disabled" : "required"}>${opt(cat.vendedores, (x) => x.id, (x) => x.nome, v.vendedor_id, "Selecione…")}</select>`, "c4")}
      ${campo("Equipe", `<select name="equipe_id">${opt(cat.equipes, (x) => x.id, (x) => x.nome, v.equipe_id, "Automática (última do vendedor)")}</select>`, "c2")}
      ${campo("Origem", `<select name="origem" ${v.id ? "" : "required"}>${opt(cat.origens, (x) => x.codigo, (x) => x.codigo, v.origem, "Selecione…")}</select>`, "c2")}
      ${campo("Canal", `<select name="canal">${opt(cat.canais, (x) => x.codigo, (x) => x.codigo, v.canal, "–")}</select>`, "c2")}
      ${campo("Tipo", `<select name="tipo_contrato">${opt(cat.tipos, (x) => x.codigo, (x) => x.codigo, v.tipo_contrato || "PROSPECT")}</select>`, "c2")}
      ${campo("Forma de pagamento", `<select name="forma_pagamento">${opt(cat.formas, (x) => x.codigo, (x) => x.codigo + (x.codigo === "DCC" ? " (débito em conta)" : ""), v.forma_pagamento, "–")}</select>`, "c3")}
      ${campo("Dia do vencimento", `<input name="dia_vencimento" type="number" min="1" max="31" value="${esc(v.dia_vencimento ?? "")}">`, "c2")}
      ${campo("Valor do pacote (R$)", `<input name="pacote_valor" inputmode="decimal" value="${v.pacote_valor ?? ""}">`, "c2")}
      ${campo("Possui oferta?", `<select name="possui_oferta" ${v.id ? "" : "required"}><option value="">${v.id ? "Não informado" : "Selecione…"}</option><option value="SIM" ${v.possui_oferta === true ? "selected" : ""}>Sim</option><option value="NAO" ${v.possui_oferta === false ? "selected" : ""}>Não</option></select>`, "c2")}
      ${campo("Cidade", `<select name="cidade_id" required>${opt(cat.cidades, (x) => x.id, (x) => `${x.uf} - ${x.nome}`, v.cidade_id, "Selecione…")}</select>`, "c3")}
      ${campo("Bairro", `<input name="bairro" value="${esc(v.bairro ?? "")}">`, "c3")}
      ${campo("Endereço", `<input name="endereco" value="${esc(v.endereco ?? "")}">`, "c6")}
      ${campo("Agendamento", `<input name="data_agendamento" type="date" value="${iso(v.data_agendamento)}">`, "c3")}
      ${campo("Turno", `<select name="turno">${opt(cat.turnos, (x) => x.codigo, (x) => x.codigo, v.turno, "–")}</select>`, "c3")}
      ${campo("Observação", `<input name="observacao" value="${esc(v.observacao ?? "")}">`, "c6")}`;
  }
  const lerForm = (form) => Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, v]));

  /* ---------- nova venda ---------- */
  S.PAGES.nova = async (el) => {
    const cat = await S.catalogos();
    el.innerHTML = `<div class="tela-vendas"><div class="cab"><div><h1>Nova venda</h1><p class="sub">Cliente, dados da venda e produtos. A venda entra como <b>Pendente</b>.</p></div><div class="acoes"><a class="btn sec" href="#/lote">Cadastrar várias de uma vez</a></div></div>
      <form id="f" class="vd-nova"><section class="painel"><h2><span>Cliente</span><small id="cli"></small></h2><div class="corpo"><div class="form">
        ${campo("CPF / CNPJ", `<input name="documento" inputmode="numeric" maxlength="14" pattern="(\\d{11}|\\d{14})" title="Somente números: 11 dígitos (CPF) ou 14 (CNPJ)" placeholder="só números" required autocomplete="off">`)}
        ${campo("Nome completo / razão social", `<input name="nome" required>`, "c6")}
        ${campo("Nascimento", `<input name="data_nascimento" type="date">`, "c3")}
        ${campo("Telefone principal", `<input name="contato" inputmode="tel" placeholder="(69) 99999-9999">`, "c3")}
        ${campo("Telefone 2", `<input name="contato_2" inputmode="tel">`, "c3")}</div></div></section>
      <section class="painel"><h2><span>Venda</span></h2><div class="corpo"><div class="form">${camposVenda(cat)}</div></div></section>
      <section class="painel"><h2><span>Produtos</span><small>marque e ajuste a quantidade</small></h2><div class="corpo">${checklistProdutos(cat)}</div></section>
      <div id="msg"></div><div class="vd-salvar"><button class="btn" type="submit" id="sv">Salvar venda</button><a class="btn sec" href="#/vendas">Cancelar</a></div></form></div>`;
    const f = el.querySelector("#f");
    soNumeros(f.documento);
    f.documento.addEventListener("blur", async () => {   // reaproveita cliente já cadastrado
      const d = f.documento.value.replace(/\D/g, "");
      if (d.length < 9) return;
      try {
        const r = (await api("/clientes?busca=" + d)).find((c) => c.documento === d.padStart(d.length > 11 ? 14 : 11, "0"));
        el.querySelector("#cli").textContent = r ? "Cliente já cadastrado" : "Cliente novo";
        aviso2p(r);
        if (r) { f.nome.value = r.nome; f.contato.value ||= r.contato || ""; f.contato_2.value ||= r.contato_2 || ""; f.data_nascimento.value ||= iso(r.data_nascimento); }
      } catch {}
    });
    // CPF/CNPJ já cadastrado: não barra, só avisa e pergunta se é um segundo ponto
    let doc2 = null;   // { cliente, segundoPonto: true|false|null }
    const aviso2p = (r) => {
      let box = el.querySelector("#doc2"); if (!box) { box = document.createElement("div"); box.id = "doc2"; el.querySelector("#cli").closest("section").after(box); }
      if (!r) { doc2 = null; box.innerHTML = ""; return; }
      doc2 = { cliente: r, segundoPonto: null };
      const n = r.contratos || 0, ult = r.ultima_venda ? S.dt(r.ultima_venda) : "–";
      box.innerHTML = `<div class="aviso aviso-2p"><b>Já existe cadastro com este ${esc(r.tipo_pessoa)}:</b> ${esc(r.nome)}.
        ${n ? `Ele já tem <b>${n}</b> venda(s)${r.situacoes ? " (" + esc(r.situacoes) + ")" : ""}, a última em ${esc(ult)}.` : "Ainda não tem vendas."}
        <div class="vd-2p-l"><b>Esta venda é um segundo ponto (nova contratação do mesmo cliente)?</b></div>
        <div class="seg vd-2p-l"><button type="button" data-r="1">Sim, é um segundo ponto</button><button type="button" data-r="0">Não, é outro contrato / conferir CPF</button></div>
        <div class="mut vd-2p-l">O sistema não bloqueia: a venda será gravada no cadastro que já existe. A resposta fica na observação da venda.</div></div>`;
      box.querySelectorAll("[data-r]").forEach((b) => b.addEventListener("click", () => { doc2.segundoPonto = b.dataset.r === "1"; box.querySelectorAll("[data-r]").forEach((x) => x.classList.toggle("on", x === b)); }));
    };
    f.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const msg = el.querySelector("#msg"); msg.innerHTML = ""; el.querySelector("#sv").disabled = true;
      try {
        const linha = { ...lerForm(f), produtos: lerProdutos(f) };
        if (!linha.produtos.length) throw Object.assign(new Error("Marque ao menos 1 produto."), {});
        if (doc2?.segundoPonto) linha.observacao = ("[2º ponto] " + (linha.observacao || "")).trim();
        const j = await api("/vendas", { method: "POST", body: { linhas: [linha], gravar: true } });
        const r = j.resultado[0];
        if (!r.ok) { msg.innerHTML = `<div class="aviso erro">${r.erros.map(esc).join("<br>")}</div>`; return; }
        msg.innerHTML = `<div class="aviso ok">Venda salva${r.cliente_novo ? "" : " (cliente já existia)"}. <a href="#/venda/${r.contrato_id}">Abrir</a> · <a href="#/nova" id="outra">Cadastrar outra</a></div>`;
        el.querySelector("#outra").addEventListener("click", (e) => { e.preventDefault(); S.PAGES.nova(el); });
        window.scrollTo(0, document.body.scrollHeight);
      } catch (e) { msg.innerHTML = `<div class="aviso erro">${esc(e.message)}</div>`; }
      finally { el.querySelector("#sv") && (el.querySelector("#sv").disabled = false); }
    });
  };

  /* ---------- detalhe / edição: mesmo desenho do protótipo aprovado (design/prototipos/direcao-a.html, telaVenda) ---------- */
  const quando = (d) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", "");
  const IC_AGENDA = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>`;
  const ST_GRANDE = { PENDENTE: ["pend", "Pendente de instalação"], ATIVO: ["inst", "Instalada"], CANCELADO: ["canc", "Cancelada"] };
  const RES_CONF = { CONFIRMADO: "confirmado", NAO_ATENDEU: "não atendeu", PROBLEMA: "problema" };
  const CAMPO_ROT = { status_venda: "situação", status_contrato: "status do contrato", motivo_id: "motivo", data_agendamento: "agendamento", turno: "turno", pacote_valor: "pacote",
    forma_pagamento: "pagamento", dia_vencimento: "vencimento", observacao: "observação", numero_contrato: "nº do contrato", endereco: "endereço", bairro: "bairro", cidade_id: "cidade",
    equipe_id: "equipe", origem: "origem", canal: "canal", data_venda: "data da venda", tipo_contrato: "tipo", vendedor_id: "vendedor", tipo_imovel: "imóvel", possui_oferta: "oferta" };
  const IMOVEL = { APT: "Apartamento", CASA: "Casa" };
  const maisDias = (d, n) => { const x = new Date(iso(d) + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const diaSemana = (d) => new Date(iso(d) + "T12:00:00Z").toLocaleDateString("pt-BR", { weekday: "long", timeZone: "UTC" }).replace("-feira", "");
  const docFmt = (d) => { const s = String(d || "").replace(/\D/g, ""); return s.length === 11 ? s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : s.length === 14 ? s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : String(d || ""); };
  const telFmt = (t) => { const s = String(t || "").replace(/\D/g, ""); return s.length === 11 ? `(${s.slice(0, 2)}) ${s.slice(2, 7)}-${s.slice(7)}` : s.length === 10 ? `(${s.slice(0, 2)}) ${s.slice(2, 6)}-${s.slice(6)}` : String(t || ""); };
  const wa = (t) => { const s = String(t || "").replace(/\D/g, ""); return s.length >= 10 ? `https://wa.me/55${s}` : ""; };
  /** Lista de rótulo e valor (valor já em HTML); pula os vazios. */
  const dl = (pares) => `<dl>${pares.filter(([, v]) => v).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
  const cartao = (tit, corpo, extra = "", cls = "") => `<section class="cartao ${cls}"><h3><span>${tit}</span>${extra ? `<small>${extra}</small>` : ""}</h3>${corpo}</section>`;
  S.PAGES.venda = async (el, id) => {
    const [cat, d] = await Promise.all([S.catalogos(), api("/contratos/" + parseInt(id, 10))]);
    const c = d.contrato, gestor = S.sessao.usuario.perfil === "gestor", soLeitura = qualidade();
    const pode = window.SEVEN_NAV.permitidas(S.sessao.usuario);
    S.migalha("Contrato " + (c.numero_contrato ?? "s/ nº"));
    const achar = (arr, k, v) => (v == null || v === "" ? null : (arr || []).find((x) => String(x[k]) === String(v)));
    const mot = achar(cat.motivos, "id", c.motivo_id), motivo = mot ? mot.descricao.toLowerCase() : "";
    const equipe = titulo(c.equipe_nome || achar(cat.equipes, "id", c.equipe_id)?.nome || "");
    const cidade = c.uf === "DF" ? "Brasília/DF" : [titulo(c.cidade_nome), c.uf].filter(Boolean).join("/");
    const pagto = c.forma_pagamento === "DCC" ? "Débito em conta (DCC)" : c.forma_pagamento ? titulo(c.forma_pagamento) : "";
    const lancou = (d.alteracoes || []).filter((a) => a.acao === "INSERT").pop()?.quem || "";   // só o gerente vê as alterações
    const st = ST_GRANDE[c.status_venda] || ["neutro", c.status_venda];
    const turno = turnoCurto(c.turno), base = c.data_agendamento || c.data_venda, d15 = maisDias(base, 15), d1 = maisDias(base, 1);   // D+1 e D+15 contam da instalação
    const confs = d.confirmacoes || [], conf = (et) => confs.find((x) => x.etapa === et || x.etapa === { D1: "PI1", D15: "PI15" }[et]);   // PI1 / PI15 = pós-instalação (Qualidade); D1 / D15 = histórico antigo
    const rota = d.rota, fat1 = (d.faturas || [])[0];

    /* próximo passo: o que vem agora para esta venda */
    let prox = "";
    const btRota = c.data_agendamento && pode.has("rota") ? `<a class="btn sec pq" href="#/rota" id="vr">Abrir na rota</a>` : "";
    if (c.status_venda === "PENDENTE" && c.data_agendamento)
      prox = [`Próximo passo: instalação ${diaSemana(c.data_agendamento) === "domingo" || diaSemana(c.data_agendamento) === "sábado" ? "no" : "na"} ${diaSemana(c.data_agendamento)}, ${ddmm(c.data_agendamento)}${turno ? `, ${turno === "manhã" ? "de manhã" : "à tarde"}` : ""}`,
        [rota?.confirmada ? `Confirmada com a cliente${rota.quem ? " por " + esc(rota.quem) : ""}.` : rota && rota.confirmada === false ? "Ainda sem confirmação com a cliente." : "", `Depois dela: confirmação D+15 em ${ddmm(d15)}.`].filter(Boolean).join(" "), btRota];
    else if (c.status_venda === "PENDENTE")
      prox = ["Próximo passo: agendar a instalação", "A venda ainda não tem data de instalação.", ""];
    else if (c.status_venda === "ATIVO" && !conf("D15"))
      prox = [`Próximo passo: confirmação D+15 em ${ddmm(d15)}`, `Instalada${c.data_agendamento ? " em " + ddmm(c.data_agendamento) : ""}${c.status_contrato ? " · contrato " + esc(c.status_contrato.toLowerCase()) : ""}.`, ""];
    else if (c.status_venda === "CANCELADO")
      prox = ["Venda cancelada", motivo ? `Motivo: ${esc(motivo)}.` : "Motivo não informado.", ""];
    const proximo = prox ? `<div class="proximo"><span class="ic">${IC_AGENDA}</span><div><b>${prox[0]}</b><span>${prox[1]}</span></div>${prox[2]}</div>` : "";

    /* andamento: do lançamento à primeira fatura (para quem vê confirmação e rota) */
    const etapa = (cls, tit, txt, tempo) => `<li class="${cls}"><span class="pt" aria-hidden="true">${cls === "feito" ? "✓" : cls === "agora" ? "•" : cls === "falhou" ? "!" : ""}</span><div><b>${tit}</b><span>${txt}</span></div><time>${tempo}</time></li>`;
    const evConf = (et, prev) => { const x = conf(et); return x ? etapa(x.resultado === "CONFIRMADO" ? "feito" : "falhou", `Confirmação ${et === "D1" ? "D+1" : "D+15"}`, `${titulo(RES_CONF[x.resultado] || x.resultado)}${x.quem ? " por " + esc(x.quem) : ""}${x.observacao ? `: “${esc(x.observacao)}”` : ""}`, quando(x.feito_em))
      : etapa("", `Confirmação ${et === "D1" ? "D+1" : "D+15"}`, et === "D1" ? "Ligação pós-instalação (Qualidade)" : "Ligação de pós-venda (Qualidade)", ddmm(prev)); };
    const andamento = d.confirmacoes ? cartao("Andamento", `<ol class="etapas">
        ${etapa("feito", "Venda lançada", `${ST_GRANDE[d.historico?.at(-1)?.status_venda || "PENDENTE"]?.[1] || "Pendente"}${c.data_agendamento ? `, com agendamento para ${ddmm(c.data_agendamento)}${turno ? ` (${turno})` : ""}` : ""}`, d.historico?.length ? quando(d.historico.at(-1).ocorrido_em) : ddmm(c.data_venda))}
        ${evConf("D1", d1)}
        ${c.status_venda === "ATIVO" ? etapa("feito", "Instalação", `Instalada${c.status_contrato ? " · contrato " + esc(c.status_contrato.toLowerCase()) : ""}`, ddmm(c.data_agendamento))
          : c.status_venda === "CANCELADO" ? etapa("falhou", "Instalação", `Venda cancelada${motivo ? " · " + esc(motivo) : ""}`, "")
          : etapa("agora", "Instalação", c.data_agendamento ? `Agendada para ${ddmm(c.data_agendamento)}${turno ? ", " + turno : ""}${rota?.confirmada ? " · confirmada com a cliente" : ""}` : "Ainda sem agendamento", ddmm(c.data_agendamento))}
        ${evConf("D15", d15)}
        ${etapa(fat1?.data_pagamento ? "feito" : "", "Primeira fatura", fat1 ? `Vencimento ${dt(fat1.vencimento)}${fat1.data_pagamento ? " · paga em " + dt(fat1.data_pagamento) : ""}` : `Vencimento dia ${esc(c.dia_vencimento || "–")} · entra no FPD da safra de ${esc(new Date(iso(c.data_venda) + "T12:00:00Z").toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" }))}`, fat1 ? ddmm(fat1.vencimento) : "")}
      </ol>`, "do lançamento à primeira fatura") : "";

    /* histórico: situação, contatos (confirmações) e alterações (só gerente), do mais recente ao mais antigo */
    const evs = [...(d.historico || []).map((h) => ({ em: h.ocorrido_em, g: "sit", tipo: "Situação", txt: `Venda ${(ST_GRANDE[h.status_venda]?.[1] || h.status_venda || "–").toLowerCase()}${h.status_contrato ? " · contrato " + h.status_contrato.toLowerCase() : ""}`, por: "" })),
      ...confs.map((x) => ({ em: x.feito_em, g: "con", tipo: "Confirmação", txt: `Confirmação ${["D1", "PI1"].includes(x.etapa) ? "D+1" : "D+15"}: ${RES_CONF[x.resultado] || x.resultado}${x.observacao ? ` — “${x.observacao}”` : ""}`, por: x.quem || "" })),
      ...(d.alteracoes || []).map((a) => ({ em: a.em, g: "alt", tipo: "Alteração", por: a.quem ?? "carga",
        txt: a.acao === "INSERT" ? "Venda lançada" : a.acao === "DELETE" ? "Venda apagada" : "Alterou " + ([...new Set(Object.keys(a.depois || {}).map((k) => CAMPO_ROT[k]).filter(Boolean))].join(", ") || "dados da venda") }))]
      .sort((a, b) => String(b.em).localeCompare(String(a.em)));
    const grupos = [["", "Tudo"], ["sit", "Situação"], ["con", "Contatos"], ["alt", "Alterações"]].filter(([g]) => !g || evs.some((e) => e.g === g));
    const historico = cartao("Histórico", `${grupos.length > 2 ? `<div class="corpo vd-hist-f"><div class="seg" role="group" aria-label="Filtrar o histórico">${grupos.map(([g, n], i) => `<button type="button" data-g="${g}"${i ? "" : ' class="on"'} aria-pressed="${!i}">${n}</button>`).join("")}</div></div>` : ""}
      <ol class="linha-tempo">${evs.map((h) => `<li data-g="${h.g}"><time>${quando(h.em)}</time><div><span class="tipo">${h.tipo}</span>${esc(h.txt)}${h.por ? `<small>${esc(h.por)}</small>` : ""}</div></li>`).join("") || `<li class="mut">Sem registros.</li>`}</ol>`,
      gestor ? "situação, contatos e alterações, do mais recente ao mais antigo" : "situação e contatos, do mais recente ao mais antigo");

    const produtos = cartao("Produtos e pagamento", `<div class="corpo"><table class="tab-prod">${(d.itens || []).map((i) => `<tr><td><b>${esc(titulo(i.nome))}</b> <span class="mut">· ${esc(NOME_CAT[i.categoria] || i.categoria || "")}${i.tipo_adesao ? " · " + esc(titulo(i.tipo_adesao)) : ""}</span></td><td class="n">${nf.format(i.quantidade || 1)}×</td></tr>`).join("") || `<tr><td class="mut" colspan="2">Nenhum produto marcado.</td></tr>`}
      <tr><td>Pagamento</td><td class="n">${esc(pagto || "–")}${c.dia_vencimento ? " · vencimento dia " + esc(c.dia_vencimento) : ""}</td></tr>
      ${c.pacote_valor != null ? `<tr><td>Pacote</td><td class="n">${brl(c.pacote_valor)}</td></tr>` : ""}
      <tr><td>Possui oferta?</td><td class="n">${c.possui_oferta == null ? "–" : c.possui_oferta ? "Sim" : "Não"}</td></tr></table></div>`);
    const faturas = d.faturas && d.faturas.length ? painel("Faturas", tabela([{ t: "Nº", k: "numero" }, { t: "Vencimento", f: (r) => dt(r.vencimento) }, { t: "Pago em", f: (r) => dt(r.data_pagamento) }, { t: "Situação", f: (r) => esc((r.situacao || "").replaceAll("_", " ").toLowerCase()) }], d.faturas)) : "";
    const ver = `<div id="vd-ver">${proximo}${andamento}${produtos}${faturas}${historico}</div>`;

    const editar = soLeitura ? "" : `<form id="f" hidden>
        <section class="painel"><h2><span>Situação</span></h2><div class="corpo"><div class="form">
        ${campo("Situação da venda", `<select name="status_venda">${opt(STATUS_V, (x) => x, (x) => ROT_VENDA[x] || x, c.status_venda)}</select>`, "c4")}
        ${campo("Status do contrato", `<select name="status_contrato">${opt(STATUS_C, (x) => x, (x) => x, c.status_contrato, "–")}</select>`, "c4")}
        ${campo("Motivo (cancelamento / pendência)", `<select name="motivo_id">${opt(cat.motivos, (x) => x.id, (x) => (x.codigo ? x.codigo + " · " : "") + x.descricao, c.motivo_id, "–")}</select>`, "c4")}</div></div></section>
      <section class="painel"><h2><span>Venda</span><small>vendedor: ${esc(c.vendedor_nome)}</small></h2><div class="corpo"><div class="form">${camposVenda(cat, { ...c, id: c.id })}</div></div></section>
      <section class="painel"><h2><span>Cliente</span><small>${esc(c.tipo_pessoa)} ${esc(c.documento ?? "sem documento")}</small></h2><div class="corpo"><div class="form">
        ${campo("Nome", `<input name="c_nome" value="${esc(c.cliente_nome)}">`, "c6")}${campo("Nascimento", `<input name="c_data_nascimento" type="date" value="${iso(c.data_nascimento)}">`, "c3")}
        ${campo("Telefone", `<input name="c_contato" value="${esc(c.contato ?? "")}">`, "c3")}${campo("Telefone 2", `<input name="c_contato_2" value="${esc(c.contato_2 ?? "")}">`, "c3")}</div></div></section>
      <section class="painel"><h2><span>Produtos</span>${gestor ? "" : `<small>remover produto: só gerente ou administrador</small>`}</h2><div class="corpo">${checklistProdutos(cat, d.itens)}</div></section>
      <div class="vd-salvar"><button class="btn" type="button" id="sv">Salvar alterações</button><button class="btn sec" type="button" id="cx">Cancelar edição</button></div></form>`;

    const botoes = soLeitura ? "" : `<button class="btn sec" type="button" id="ed">Editar venda</button>${c.status_venda === "PENDENTE" ? `<button class="btn sec" type="button" id="ra">Reagendar instalação</button>` : ""}
      ${gestor ? `<div class="vd-menu"><button type="button" class="btn leve vd-mais" aria-haspopup="menu" aria-expanded="false">Mais ▾</button><div class="vd-pop" role="menu" hidden><a role="menuitem" href="#" id="ap" class="perigo"><b>Apagar venda</b><small>Remove a venda, com itens, faturas e histórico</small></a></div></div>` : ""}`;
    el.innerHTML = `<div class="tela-venda"><div class="ficha-cab"><div><div class="sobre">VENDA · CONTRATO <span class="mono">${esc(c.numero_contrato ?? "s/ nº")}</span></div><h1>${esc(titulo(c.cliente_nome))}</h1>
        <div class="linha"><span>Lançada em <b>${dt(c.data_venda)}</b>${lancou ? ` por <b>${esc(lancou)}</b>` : ""}</span><span>Vendedor <b>${esc(c.vendedor_nome)}</b>${equipe ? " · " + esc(equipe) : ""}</span>${c.origem ? `<span>Origem <b>${esc(c.origem)}</b>${c.canal ? ` · finalizada no <b>${esc(titulo(c.canal))}</b>` : ""}</span>` : ""}</div></div>
      <div class="ficha-st"><span class="st-grande ${st[0]}">${esc(st[1])}</span><div class="botoes">${botoes}</div></div></div>
      <div id="msg"></div>
      <div class="ficha"><div>${ver}${editar}</div>
      <aside class="lado">
        ${cartao("Cliente", `<div class="corpo">${dl([["Nome", esc(titulo(c.cliente_nome))], [c.tipo_pessoa || "Documento", `<span class="mono">${esc(docFmt(c.documento) || "sem documento")}</span>`],
          ["Telefone", c.contato ? `<span class="mono">${esc(telFmt(c.contato))}</span>${wa(c.contato) ? ` · <a href="${wa(c.contato)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}` : ""], ["Telefone 2", c.contato_2 ? `<span class="mono">${esc(telFmt(c.contato_2))}</span>` : ""],
          ["Nascimento", c.data_nascimento ? dt(c.data_nascimento) : ""], ["Endereço", [esc(titulo(c.endereco || "")), [titulo(c.bairro), cidade].filter(Boolean).map(esc).join(" · ")].filter(Boolean).join("<br>")], ["Imóvel", esc(IMOVEL[c.tipo_imovel] || titulo(c.tipo_imovel || ""))]])}</div>`)}
        ${cartao("Responsáveis", `<div class="corpo">${dl([["Vendedor", esc(c.vendedor_nome) + `<br><span class="mut">${[equipe, c.vendedor_login].filter(Boolean).map(esc).join(" · ")}</span>`], ["Lançamento", esc(lancou)], ["Tipo", [titulo(c.tipo_contrato || ""), c.origem].filter(Boolean).map(esc).join(" · ")], ["Observação", esc(c.observacao || "")]])}</div>`)}
        <section class="cartao vd-obs"><h3><span>Observações da cliente</span><small id="ob-n"></small></h3><div class="corpo" id="obs"><p class="mut">Carregando…</p></div></section>
      </aside></div></div>`;
    const f = el.querySelector("#f"), msg = el.querySelector("#msg"), verBox = el.querySelector("#vd-ver"), btEd = el.querySelector("#ed"), btRa = el.querySelector("#ra");
    observacoes(el.querySelector("#obs"), c);
    el.querySelector("#vr")?.addEventListener("click", (e) => { e.preventDefault(); S.filtrarRota?.(iso(c.data_agendamento)); });
    el.querySelectorAll(".vd-hist-f [data-g]").forEach((b) => b.addEventListener("click", () => {
      el.querySelectorAll(".vd-hist-f [data-g]").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
      el.querySelectorAll(".linha-tempo li[data-g]").forEach((li) => (li.hidden = !!b.dataset.g && li.dataset.g !== b.dataset.g));
    }));
    const modoEdicao = (on) => { verBox.hidden = on; f.hidden = !on; if (btEd) btEd.hidden = on; if (btRa) btRa.hidden = on; if (on) f.querySelector("select,input")?.focus(); };
    btEd?.addEventListener("click", () => modoEdicao(true));
    btRa?.addEventListener("click", () => { modoEdicao(true); const a = f.querySelector('[name="data_agendamento"]'); a?.scrollIntoView({ block: "center" }); a?.focus(); });   // atalho: a mesma edição, já no agendamento
    el.querySelector("#cx")?.addEventListener("click", () => { f.reset(); modoEdicao(false); });
    el.querySelector("#sv")?.addEventListener("click", async () => {
      msg.innerHTML = "";
      const v = lerForm(f);
      const corpo = { status_venda: v.status_venda, status_contrato: v.status_contrato, motivo_id: v.motivo_id ? +v.motivo_id : null, data_venda: v.data_venda, numero_contrato: v.numero_contrato || null,
        equipe_id: v.equipe_id ? +v.equipe_id : null, origem: v.origem, canal: v.canal, tipo_contrato: v.tipo_contrato, forma_pagamento: v.forma_pagamento, dia_vencimento: v.dia_vencimento || null,
        pacote_valor: v.pacote_valor ? String(v.pacote_valor).replace(",", ".") : null, cidade_id: +v.cidade_id, bairro: (v.bairro || "").toUpperCase(), endereco: (v.endereco || "").toUpperCase(),
        data_agendamento: v.data_agendamento || null, turno: v.turno, observacao: v.observacao, possui_oferta: v.possui_oferta || null,
        cliente: { nome: (v.c_nome || "").toUpperCase(), data_nascimento: v.c_data_nascimento || null, contato: v.c_contato, contato_2: v.c_contato_2 }, itens: lerProdutos(f) };
      delete corpo.tipo_contrato;   // tipo é definido na criação
      try { await api("/contratos/" + c.id, { method: "PATCH", body: corpo }); msg.innerHTML = `<div class="aviso ok">Alterações salvas.</div>`; window.scrollTo(0, 0); setTimeout(() => S.PAGES.venda(el, c.id).catch(S.erroEm(el)), 700); }
      catch (e) { msg.innerHTML = `<div class="aviso erro">${esc(e.message)}</div>`; window.scrollTo(0, 0); }
    });
    el.querySelector("#ap")?.addEventListener("click", (ev) => {
      ev.preventDefault();
      const m = modal("Apagar venda", `<p>Esta ação remove a venda <b>${esc(c.numero_contrato ?? "")}</b> de <b>${esc(c.cliente_nome)}</b>, com itens, faturas e histórico. O registro fica guardado no histórico de alterações, mas a venda não volta sozinha.</p><p>Digite <b>APAGAR</b> para confirmar:</p><input id="cf">`,
        `<button class="btn sec" id="nx">Cancelar</button><button class="btn ruim" id="ok">Apagar</button>`);
      m.querySelector("#nx").addEventListener("click", () => m.remove());
      m.querySelector("#ok").addEventListener("click", async () => {
        if (m.querySelector("#cf").value.trim() !== "APAGAR") return;
        try { await api("/contratos/" + c.id, { method: "DELETE" }); m.remove(); location.hash = "#/vendas"; } catch (e) { m.remove(); msg.innerHTML = `<div class="aviso erro">${esc(e.message)}</div>`; }
      });
    });
  };

  /** Observações do cliente: histórico com data e autor (vale para todas as vendas do mesmo cliente). */
  async function observacoes(box, c) {
    const lista = await api(`/clientes/${c.cliente_id}/obs`).catch((e) => { box.innerHTML = `<p class="erro">${esc(e.message)}</p>`; return null; });
    if (!lista) return;
    const soLeitura = S.sessao.vercomo || qualidade();
    const n = box.closest(".cartao")?.querySelector("#ob-n"); if (n) n.textContent = lista.length ? String(lista.length) : "";
    box.innerHTML = `<ol class="ob-lista">${lista.length ? lista.map((o) => `<li><div class="ob-txt">${esc(o.texto).replace(/\n/g, "<br>")}</div><div class="ob-meta">${esc(o.autor || "—")} · ${quando(o.em)}${o.numero_contrato && o.contrato_id !== c.id ? ` · venda ${esc(o.numero_contrato)}` : ""}</div></li>`).join("") : `<li class="mut ob-vazio">Nenhuma observação ainda.</li>`}</ol>
      ${soLeitura ? "" : `<div class="ob-form"><label class="sr" for="ob-t">Nova observação</label><textarea id="ob-t" rows="2" maxlength="2000" placeholder="Anotar algo sobre a cliente…"></textarea><button type="button" class="btn sec pq" id="ob-s">Salvar observação</button></div>`}`;
    box.querySelector("#ob-s")?.addEventListener("click", async (e) => {
      const t = box.querySelector("#ob-t").value.trim(); if (!t) { box.querySelector("#ob-t").focus(); return; }
      const b = e.currentTarget; b.disabled = true;
      try { await api(`/clientes/${c.cliente_id}/obs`, { method: "POST", body: { texto: t, contrato_id: c.id } }); observacoes(box, c); }
      catch (er) { alert(er.message); b.disabled = false; }
    });
  }

  /* ---------- lançamento em lote ---------- */
  const COLS = [
    ["data_venda", "Data venda", 96, "dd/mm/aaaa"], ["nome", "Nome do cliente", 200], ["documento", "CPF/CNPJ", 130], ["contato", "Telefone", 120], ["vendedor", "Vendedor (login)", 150, null, "dl-v"],
    ["origem", "Origem", 90, null, "dl-o"], ["cidade", "Cidade", 190, "UF - CIDADE", "dl-c"], ["bairro", "Bairro", 130], ["endereco", "Endereço", 190], ["dia_vencimento", "Venc.", 54],
    ["forma_pagamento", "Pagamento", 96, null, "dl-f"], ["pacote_valor", "Pacote R$", 80], ["produtos", "Produtos (separe com ;)", 300, "500; MOVEL PÓS 30 GB; 2x WI-FI MESH"], ["numero_contrato", "Nº contrato", 100],
    ["possui_oferta", "Possui oferta?", 90, "Sim / Não"],
  ];
  S.PAGES.lote = async (el) => {
    const cat = await S.catalogos();
    el.innerHTML = `<div class="tela-vendas"><div class="cab"><div><h1>Lançamento em lote</h1><p class="sub">Várias vendas de uma vez, coladas do Excel ou digitadas</p></div><div class="acoes"><a class="btn sec" href="#/importvendas">Importar planilha da Claro</a><a class="btn sec" href="#/nova">Venda única (formulário)</a></div></div>
      <div class="aviso">Cole direto do Excel (Ctrl+V) a partir da primeira célula, na ordem das colunas abaixo, ou digite. <b>Validar</b> mostra os erros linha a linha sem gravar; <b>Gravar</b> salva as linhas corretas e mantém as com erro para você corrigir. Novas vendas entram como <b>Pendente</b>.</div>
      <div class="filtros vd-lote-f"><div class="campo vd-w190"><label>Preencher vendedor vazio com</label><input id="dv" list="dl-v" placeholder="login"></div>
        <div class="campo vd-w110"><label>Origem</label><input id="do" list="dl-o"></div><div class="campo vd-w140"><label>Data</label><input id="dd" type="date"></div>
        <button class="btn sec" id="pf">Preencher linhas</button><span class="vd-esp"></span><button class="btn sec" id="ml">+ 10 linhas</button><button class="btn sec" id="va">Validar</button><button class="btn" id="gr">Gravar válidas</button></div>
      <datalist id="dl-v">${cat.vendedores.map((v) => `<option value="${esc(v.login)}">${esc(v.nome)}</option>`).join("")}</datalist>
      <datalist id="dl-o">${cat.origens.map((o) => `<option value="${esc(o.codigo)}">`).join("")}</datalist>
      <datalist id="dl-c">${cat.cidades.map((c) => `<option value="${esc(c.uf + " - " + c.nome)}">`).join("")}</datalist>
      <datalist id="dl-f">${cat.formas.map((o) => `<option value="${esc(o.codigo)}">`).join("")}</datalist>
      <div class="lote"><table><thead><tr><th>#</th>${COLS.map((c) => `<th style="min-width:${c[2]}px">${esc(c[1])}</th>`).join("")}<th>Resultado</th></tr></thead><tbody id="tb"></tbody></table></div><div id="res" class="vd-res"></div></div>`;
    const tb = el.querySelector("#tb");
    const linha = () => { const tr = document.createElement("tr"); tr.innerHTML = `<td class="n"></td>${COLS.map((c) => `<td><input data-k="${c[0]}" ${c[4] ? `list="${c[4]}"` : ""} ${c[3] ? `placeholder="${esc(c[3])}"` : ""} autocomplete="off"></td>`).join("")}<td class="st mut"></td>`; return tr; };
    const numerar = () => [...tb.rows].forEach((tr, i) => (tr.cells[0].textContent = i + 1));
    // CPF/CNPJ já cadastrado: avisa na própria linha e pergunta se é segundo ponto (não bloqueia)
    const checarDoc = async (tr) => {
      const inp = tr.querySelector('input[data-k="documento"]'), st = tr.querySelector(".st"), d = inp.value.replace(/\D/g, "");
      delete tr.dataset.dup; delete tr.dataset.p2;
      if (tr.classList.contains("good")) return;
      if (d.length !== 11 && d.length !== 14) { if (st.dataset.aviso) { st.innerHTML = ""; delete st.dataset.aviso; } return; }
      try {
        const r = (await api("/clientes?busca=" + d)).find((c) => c.documento === d);
        if (!r) { if (st.dataset.aviso) { st.innerHTML = ""; delete st.dataset.aviso; } return; }
        tr.dataset.dup = "1"; st.dataset.aviso = "1";
        st.innerHTML = `<span class="tag alerta">CPF já cadastrado</span> ${esc(r.nome)} (${r.contratos || 0} venda(s)). <b>É segundo ponto?</b> <span class="seg"><button type="button" data-p2="1">Sim</button><button type="button" data-p2="0">Não</button></span>`;
        st.querySelectorAll("[data-p2]").forEach((b) => b.addEventListener("click", () => { tr.dataset.p2 = b.dataset.p2; st.querySelectorAll("[data-p2]").forEach((x) => x.classList.toggle("on", x === b)); }));
      } catch {}
    };
    tb.addEventListener("change", (e) => { if (e.target.dataset?.k === "documento") checarDoc(e.target.closest("tr")); });
    const add = (n) => { for (let i = 0; i < n; i++) tb.appendChild(linha()); numerar(); };
    add(15);
    const valores = (tr) => Object.fromEntries([...tr.querySelectorAll("input")].map((i) => [i.dataset.k, i.value.trim()]));
    const vazia = (tr) => Object.values(valores(tr)).every((v) => !v);
    tb.addEventListener("paste", (e) => {
      const t = e.clipboardData.getData("text");
      if (!/[\t\n]/.test(t.replace(/\n$/, ""))) return;
      e.preventDefault();
      const inp = e.target.closest("input"); if (!inp) return;
      const tr0 = inp.closest("tr"), c0 = COLS.findIndex((c) => c[0] === inp.dataset.k);
      const linhas = t.replace(/\r/g, "").replace(/\n+$/, "").split("\n").map((l) => l.split("\t"));
      let tr = tr0;
      linhas.forEach((cols, li) => {
        if (li > 0) { if (!tr.nextElementSibling) add(1); tr = tr.nextElementSibling; }
        cols.forEach((v, ci) => { const c = COLS[c0 + ci]; if (c) tr.querySelector(`input[data-k="${c[0]}"]`).value = c[0] === "documento" ? v.replace(/\D/g, "").slice(0, 14) : v.trim(); });
      });
      numerar();
      linhas.forEach((_, li) => { let t = tr0; for (let k = 0; k < li; k++) t = t.nextElementSibling; if (t) checarDoc(t); });
    });
    tb.addEventListener("beforeinput", (e) => { if (e.target.dataset?.k === "documento" && e.data && e.inputType === "insertText" && /\D/.test(e.data)) e.preventDefault(); });
    tb.addEventListener("input", (e) => { const i = e.target; if (i.dataset?.k === "documento") { const v = i.value.replace(/\D/g, "").slice(0, 14); if (v !== i.value) i.value = v; } });
    tb.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || !e.target.matches("input")) return; e.preventDefault();
      const nx = e.target.closest("tr").nextElementSibling; if (nx) nx.querySelector(`input[data-k="${e.target.dataset.k}"]`).focus();
    });
    el.querySelector("#ml").addEventListener("click", () => add(10));
    el.querySelector("#pf").addEventListener("click", () => {
      const dv = el.querySelector("#dv").value.trim(), dor = el.querySelector("#do").value.trim(), dd = el.querySelector("#dd").value;
      const brData = dd ? dd.split("-").reverse().join("/") : "";
      [...tb.rows].filter((tr) => !vazia(tr) && !tr.classList.contains("good")).forEach((tr) => {
        for (const [k, v] of [["vendedor", dv], ["origem", dor], ["data_venda", brData]]) { const i = tr.querySelector(`input[data-k="${k}"]`); if (v && !i.value.trim()) i.value = v; }
      });
    });
    async function enviar(gravar) {
      const trs = [...tb.rows].filter((tr) => !vazia(tr) && !tr.classList.contains("good"));
      const res = el.querySelector("#res");
      if (!trs.length) { res.innerHTML = `<div class="aviso">Nenhuma linha preenchida.</div>`; return; }
      const b1 = el.querySelector("#va"), b2 = el.querySelector("#gr"); b1.disabled = b2.disabled = true;
      try {
        const j = await api("/vendas", { method: "POST", body: { linhas: trs.map((tr) => { const v = valores(tr); if (tr.dataset.p2 === "1") v.observacao = "[2º ponto]"; return v; }), gravar } });
        j.resultado.forEach((r) => {
          const tr = trs[r.linha], st = tr.querySelector(".st");
          tr.classList.remove("bad", "good"); delete st.dataset.aviso;
          if (r.ok) { tr.classList.add(gravar ? "good" : "good"); st.innerHTML = gravar ? `Gravada · <a href="#/venda/${r.contrato_id}">abrir</a>${r.cliente_novo ? "" : " · cliente já existia"}` : "OK"; if (gravar) tr.querySelectorAll("input").forEach((i) => (i.disabled = true)); }
          else { tr.classList.add("bad"); st.innerHTML = r.erros.map(esc).join("<br>"); }
        });
        res.innerHTML = `<div class="aviso ${j.invalidas ? "" : "ok"}">${gravar ? `<b>${j.validas}</b> venda(s) gravada(s).` : `<b>${j.validas}</b> linha(s) válida(s).`} ${j.invalidas ? `<b>${j.invalidas}</b> com erro (em vermelho): corrija e envie novamente.` : ""}</div>`;
      } catch (e) { res.innerHTML = `<div class="aviso erro">${esc(e.message)}</div>`; }
      finally { b1.disabled = b2.disabled = false; }
    }
    el.querySelector("#va").addEventListener("click", () => enviar(false));
    el.querySelector("#gr").addEventListener("click", () => enviar(true));
  };
})();
