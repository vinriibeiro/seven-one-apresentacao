"use strict";
/* Visão da equipe (supervisor), da coordenação (coordenador) e das equipes (gerente).
   Indicadores do supervisor no topo e os vendedores em tabela: vendas do mês na 1ª coluna e os demais indicadores ao lado.
   Os números vêm de /api/painel-equipe; o banco limita cada supervisor/coordenador às equipes ligadas a ele. */
(() => {
  const { esc, nf, api, brl, painel } = S;
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mesRot = (m) => { const [a, n] = m.split("-"); return `${MESES[+n - 1]}/${a}`; };
  const br = (d) => (d ? String(d).slice(0, 10).split("-").reverse().join("/") : "–");
  const pct0 = (x) => (x == null || !isFinite(x) ? "–" : Math.round(x * 100) + "%");
  const pct1 = (x) => (x == null || !isFinite(x) ? "–" : (x * 100).toFixed(1).replace(".", ",") + "%");
  const REF_FPD = 0.25;
  const est = { mes: null, equipe: "", ordem: "mes_vendas", desc: true, abertos: new Set() };

  const fpdCel = (o) => (o.fpd == null ? `<span class="fx-z" title="Sem faturas resolvidas nas 3 últimas safras">–</span>`
    : `<span class="eq-fpd ${o.fpd > REF_FPD ? "ruim" : o.fpd > REF_FPD * 0.8 ? "alerta" : "ok"}" title="${o.fpd_nao_ok} de ${o.fpd_resolvidas} primeiras faturas não pagas no prazo">${pct1(o.fpd)}</span>`);
  const semVender = (p) => (p.dias_sem_venda == null ? `<span class="eq-sv ruim">nunca vendeu</span>` : p.dias_sem_venda === 0 ? `<span class="eq-sv ok">hoje</span>`
    : `<span class="eq-sv ${p.dias_sem_venda >= 5 ? "ruim" : p.dias_sem_venda >= 2 ? "alerta" : ""}" title="Última venda em ${br(p.ultima_venda)}">há ${p.dias_sem_venda} dia${p.dias_sem_venda === 1 ? "" : "s"}</span>`);

  const COLS = [
    ["mes_vendas", "Vendas", "Vendas válidas no mês (sem as canceladas)"], ["ant_vendas", "Mês ant.", "Mesmo período do mês anterior"], ["vendas", "Hoje", "Vendas válidas no dia"],
    ["mes_matinal", "Matinal", "Vendas do mês agendadas para o turno da manhã (08h às 12h)"], ["mes_vespertina", "Vespertina", "Vendas do mês agendadas para o turno da tarde (a partir de 12h)"],
    ["mes_conectadas", "Instal.", "Instaladas no mês"], ["mes_pend", "Pend.", "Pendentes de instalação"], ["mes_canceladas", "Canc.", "Canceladas no mês"],
    ["conectividade", "% conect.", "Instaladas ÷ todas as vendas do mês"], ["mes_bl", "BL × meta", "Banda larga do mês (instalada + pendente) contra a meta"],
    ["mes_chip_mp", "Chips M/P", "Chips de migração e portabilidade no mês"], ["ritmo", "Ritmo", "Projeção da BL até o fim do mês contra a meta"], ["fpd", "FPD 3m", "Primeira fatura não paga no prazo, nas 3 últimas safras fechadas (referência 25%)"],
    ["ticket", "Ticket", "Pacote médio das vendas do mês"], ["dias_sem_venda", "Últ. venda", "Dias desde a última venda"],
  ];
  let VV = true;   // vê valores em R$ (só gerente/administrador)
  const cols = () => COLS.filter(([k]) => k !== "ticket" || VV);
  const valorOrdem = (p, k) => (k === "mes_pend" ? p.mes_vendas - p.mes_conectadas : k === "ritmo" ? p.ritmo?.pct ?? -1 : k === "mes_bl" ? p.mes_bl : k === "dias_sem_venda" ? (p.dias_sem_venda ?? 9999) : p[k] ?? -1);
  function celulas(o, frac, nivel) {
    const pend = o.mes_vendas - o.mes_conectadas, z = S.fx.z;
    return `<td class="num eq-v1">${nf.format(o.mes_vendas)}</td><td class="num mut">${z(o.ant_vendas)}</td><td class="num">${z(o.vendas)}</td><td class="num">${z(o.mes_matinal)}</td><td class="num">${z(o.mes_vespertina)}</td>
      <td class="num">${z(o.mes_conectadas)}</td><td class="num">${z(pend)}</td><td class="num ${o.mes_canceladas ? "fx-neg" : ""}">${z(o.mes_canceladas)}</td>
      <td class="num">${pct0(o.conectividade)}</td><td class="fx-mcel">${S.fx.barraMeta(o, o.frac ?? frac, nivel === "p")}</td>
      <td class="num">${o.meta_chip ? `${nf.format(o.mes_chip_mp)}<small class="mut">/${nf.format(o.meta_chip)}</small>` : z(o.mes_chip_mp)}</td><td>${S.fx.pilula(o.ritmo)}</td>
      <td class="num">${fpdCel(o)}</td>${VV ? `<td class="num">${o.ticket ? brl(o.ticket) : z(0)}</td>` : ""}
      <td>${nivel === "p" ? semVender(o) : o.sem_venda_2d ? `<span class="eq-sv alerta" title="Vendedores sem vender há 2 dias ou mais">${o.sem_venda_2d} parado${o.sem_venda_2d === 1 ? "" : "s"}</span>` : `<span class="eq-sv ok">todos ativos</span>`}</td>`;
  }
  function tabela(j) {
    const frac = j.mes.frac, varias = j.grupos.length > 1;
    const ord = (l) => [...l].sort((a, b) => { const x = valorOrdem(a, est.ordem), y = valorOrdem(b, est.ordem); return (est.desc ? y - x : x - y) || a.nome.localeCompare(b.nome); });
    const th = cols().map(([k, t, d]) => `<th class="${["mes_bl", "ritmo", "dias_sem_venda"].includes(k) ? "" : "num"} eq-ord ${est.ordem === k ? "on " + (est.desc ? "desc" : "asc") : ""} ${k === "mes_vendas" ? "eq-v1" : ""}" data-o="${k}" title="${esc(d)} · clique para ordenar">${esc(t)}</th>`).join("");
    const linhaP = (p) => `<tr class="fx-p ${p.mes_vendas ? "" : "zerado"}"><td class="fx-c1"><span class="fx-av">${esc(S.fx.iniciais(p.nome))}</span><span class="fx-nm">${esc(p.nome)}</span></td>${celulas(p, frac, "p")}</tr>`;
    const corpo = varias ? j.grupos.map((g, gi) => {
      const aberto = est.abertos.has(g.grupo);   // começa fechado: toque no nome para abrir
      return `<tr class="fx-g ${aberto ? "aberto" : ""}" data-g="${gi}"><td class="fx-c1"><span class="fx-chev">${S.fx.ico("chev", 14)}</span><b>${esc(g.grupo)}</b><small>${g.hc} vendedor${g.hc === 1 ? "" : "es"}${g.pessoas[0]?.cidade ? " · " + esc(g.pessoas[0].cidade) : ""}</small></td>${celulas(g, frac, "g")}</tr>${aberto ? ord(g.pessoas).map(linhaP).join("") : ""}`;
    }).join("") : ord(j.grupos[0]?.pessoas || []).map(linhaP).join("");
    const t = j.total;
    return `<div class="tab fx-tabela eq-tabela"><table><thead><tr><th class="fx-c1">Vendedor</th>${th}</tr></thead>
      <tbody>${corpo || `<tr><td colspan="${cols().length + 1}" class="mut">Nenhum vendedor ligado a esta equipe.</td></tr>`}</tbody>
      <tfoot><tr class="fx-t"><td class="fx-c1"><b>Total</b><small>${t.hc} vendedor${t.hc === 1 ? "" : "es"}</small></td>${celulas(t, frac, "t")}</tr></tfoot></table></div>`;
  }
  function atencao(j) {
    const ps = [...new Map(j.grupos.flatMap((g) => g.pessoas).map((p) => [p.id, p])).values()];
    const parados = ps.filter((p) => p.dias_sem_venda == null || p.dias_sem_venda >= 2).sort((a, b) => (b.dias_sem_venda ?? 999) - (a.dias_sem_venda ?? 999));
    const abaixo = ps.filter((p) => p.ritmo?.status === "ruim").sort((a, b) => a.ritmo.pct - b.ritmo.pct);
    const fpdAlto = ps.filter((p) => p.fpd != null && p.fpd > REF_FPD && p.fpd_resolvidas >= 5).sort((a, b) => b.fpd - a.fpd);
    const bloco = (tit, l, f) => `<div class="eq-at"><div class="fx-sub-t">${esc(tit)} <b>${l.length}</b></div>${l.length ? `<ul>${l.slice(0, 8).map((p) => `<li><span>${esc(p.nome)}</span>${f(p)}</li>`).join("")}${l.length > 8 ? `<li class="mut">+${l.length - 8}</li>` : ""}</ul>` : `<p class="mut">Ninguém.</p>`}</div>`;
    return painel("Pontos de atenção", `<div class="eq-ats">${bloco("Parados há 2+ dias", parados, semVender)}${bloco("Abaixo do ritmo da meta", abaixo, (p) => `<span class="mut">${p.mes_bl}/${p.meta_bl} BL · proj. ${p.ritmo.projecao}</span>`)}${bloco("FPD acima de 25%", fpdAlto, (p) => fpdCel(p))}</div>`,
      "Quem precisa de acompanhamento esta semana. FPD só para quem tem 5+ faturas resolvidas.");
  }

  async function excel(j) {
    const N = (v, s = "", f = "_int") => ({ v: +v || 0, s: (+v ? s : s === "" ? "z" : s) + f });
    const linha = (o, nome, s) => [{ v: nome, s: s || "" }, N(o.mes_vendas, s || "b"), N(o.ant_vendas, s), N(o.vendas, s), N(o.mes_conectadas, s), N(o.mes_vendas - o.mes_conectadas, s), N(o.mes_canceladas, s),
      o.conectividade == null ? { v: "", s } : { v: o.conectividade, s: (s || "") + "_pct" }, N(o.mes_bl, s), o.meta_bl == null ? { v: "", s } : N(o.meta_bl, s), N(o.mes_chip_mp, s),
      o.ritmo ? { v: S.fx.RITMO[o.ritmo.status], s: s === "t" ? "t" : o.ritmo.status } : { v: "", s }, o.fpd == null ? { v: "", s } : { v: o.fpd, s: (s || "") + "_pct" }, o.ticket ? N(o.ticket, s, "_brl") : { v: "", s },
      { v: o.ultima_venda ? br(o.ultima_venda) : "", s }];
    const L = [[{ v: "", s: "" }, { v: `Visão da equipe · ${mesRot(j.competencia)}`, s: "titulo" }], [{ v: "" }, { v: `Até ${br(j.dia)} · FPD das safras ${br(j.fpd_safras.de).slice(3)} a ${br(j.fpd_safras.ate).slice(3)}`, s: "sub" }], []];
    L.push(["Vendedor", "Vendas no mês", "Mês anterior", "Hoje", "Instaladas", "Pendentes", "Canceladas", "Conectividade", "BL no mês", "Meta BL", "Chips M/P", "Ritmo", "FPD 3 safras", "Ticket médio", "Última venda"].map((v) => ({ v, s: "h" })));
    const rc = L.length;
    for (const g of j.grupos) { if (j.grupos.length > 1) L.push(linha(g, g.grupo, "g")); for (const p of g.pessoas) L.push(linha(p, (j.grupos.length > 1 ? "    " : "") + p.nome, "")); }
    L.push(linha(j.total, "TOTAL", "t"));
    const logo = await XLSX7.png((window.SEVEN_CFG || {}).logo || "logo.png", 36);
    if (!VV) L.forEach((l) => l.length > 13 && l.splice(13, 1));
    XLSX7.baixar(`Equipe_${j.competencia}.xlsx`, [{ nome: "Equipe", linhas: L, larguras: [34, 13, 15, 8, 11, 10, 11, 12, 10, 9, 10, 11, 12, 12, 13], mesclar: ["B1:L1", "B2:L2"], congelar: { linha: rc, coluna: 1 }, alturas: { 0: 30 },
      imagem: logo ? { ...logo, coluna: 0, linha: 0, dx: 4 * 9525, dy: 4 * 9525 } : null }], { titulo: "Visão da equipe" });
  }

  /* ---------- comparação das equipes: mesmo desenho do protótipo aprovado (design/prototipos/direcao-a.html, telaEquipes) ---------- */
  const MIUDAS = new Set(["de", "da", "das", "do", "dos", "e"]);
  const nomeEq = (g) => String(g || "").replace(/^EQUIPE\s+/i, "").toLowerCase().split(" ").map((p, i) => (i && MIUDAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(" ");
  const ORDENS = [["proj", "Menor projeção ÷ meta"], ["bl", "Maior BL vendida"], ["nome", "Nome"]];
  est.comp = est.comp || "proj";
  /** Equipes na ordem escolhida (a régua e as trajetórias seguem a mesma). */
  function ordenadas(j) {
    const at = (g) => (g.meta_bl ? (g.previsao?.bl ?? g.mes_bl) / g.meta_bl : Infinity);
    return [...j.grupos].sort(est.comp === "bl" ? (a, b) => b.mes_bl - a.mes_bl : est.comp === "nome" ? (a, b) => a.grupo.localeCompare(b.grupo) : (a, b) => at(a) - at(b));
  }
  function comparacao(j) {
    const u = j.mes.uteis || {}, dec = u.decorridos || 0, rest = Math.max(0, (u.total || 0) - dec);
    const ord = ordenadas(j);
    const ritmoAt = (g) => (dec ? g.mes_bl / dec : null), nec = (g) => (g.meta_bl && rest ? Math.max(0, g.meta_bl - g.mes_bl) / rest : null);
    const lanc = (g) => g.mes_vendas + g.mes_canceladas;
    const fpdC = (g) => (g.fpd == null ? "–" : g.fpd > 0.25 ? `<span class="st abaixo">${pct1(g.fpd)}</span>` : g.fpd > 0.2 ? `<span class="st atencao">${pct1(g.fpd)}</span>` : pct1(g.fpd));
    const t = j.total;
    const item = (g, rot, sub, chave) => ({ rot, sub, chave, real: g.mes_bl, prev: g.previsao?.bl ?? g.mes_bl, meta: g.meta_bl || null,
      esp: rest && g.meta_bl ? g.meta_bl * (g.frac ?? j.mes.frac) : null, ritmo: ritmoAt(g), nec: rest ? nec(g) : null });
    return `${CH.regua({ itens: ord.map((g) => item(g, nomeEq(g.grupo), `${g.supervisor ? `sup. ${S.titulo(g.supervisor)} · ` : ""}${nf.format(g.hc)} vendedor${g.hc === 1 ? "" : "es"}`, j.grupos.indexOf(g))),
        total: j.grupos.length > 1 ? item(t, "Empresa", `${nf.format(t.hc)} vendedores`) : null })}
      <p class="metodo">BL vendida conta contratos do mês com banda larga, instalados ou pendentes (cancelados não contam). Projeção = vendida ÷ dias úteis decorridos × dias úteis do mês, pessoa a pessoa, pelo calendário da cidade da equipe. Situação: no ritmo (projeção ≥ meta), atenção (75% a 99%), abaixo do ritmo (menos de 75%).</p>
      ${trajetorias(j, ord)}
      <section class="secao"><header><h2>Vendas, instalação e qualidade por equipe<small>Mesmas equipes, outros resultados do mês</small></h2></header>
        <div class="tab-env"><table class="tabela equipes"><thead><tr><th>Equipe</th><th class="n">Lançadas</th><th class="n">Instaladas</th><th class="n">Pendentes</th><th class="n">Canceladas</th><th class="n">% canceladas</th><th class="n">FPD 3 safras<span class="sub">faturas resolvidas</span></th><th class="n">Sem venda hoje</th></tr></thead>
        <tbody>${ord.map((g) => `<tr><td data-l="Equipe"><b>${esc(nomeEq(g.grupo))}</b></td><td class="n" data-l="Lançadas">${nf.format(lanc(g))}</td><td class="n" data-l="Instaladas">${nf.format(g.mes_conectadas)}</td><td class="n" data-l="Pendentes">${nf.format(g.mes_vendas - g.mes_conectadas)}</td>
          <td class="n" data-l="Canceladas">${nf.format(g.mes_canceladas)}</td><td class="n" data-l="% canceladas">${pct1(lanc(g) ? g.mes_canceladas / lanc(g) : null)}</td><td class="n" data-l="FPD 3 safras">${fpdC(g)}${g.fpd_resolvidas != null ? `<span class="sub">${nf.format(g.fpd_resolvidas)}</span>` : ""}</td>
          <td class="n" data-l="Sem venda hoje">${g.sem_venda != null ? `${nf.format(g.sem_venda)} de ${nf.format(g.hc)}` : "–"}</td></tr>`).join("")}</tbody>
        <tfoot><tr><td>${j.grupos.length > 1 ? "Empresa" : "Total"}</td><td class="n">${nf.format(lanc(t))}</td><td class="n">${nf.format(t.mes_conectadas)}</td><td class="n">${nf.format(t.mes_vendas - t.mes_conectadas)}</td><td class="n">${nf.format(t.mes_canceladas)}</td><td class="n">${pct1(lanc(t) ? t.mes_canceladas / lanc(t) : null)}</td>
          <td class="n">${fpdC(t)}${t.fpd_resolvidas != null ? `<span class="sub">${nf.format(t.fpd_resolvidas)}</span>` : ""}</td><td class="n">${t.sem_venda != null ? `${nf.format(t.sem_venda)} de ${nf.format(t.hc)}` : "–"}</td></tr></tfoot></table></div>
        <p class="metodo">Instaladas, pendentes e canceladas são a situação de hoje das vendas lançadas no mês (não as instalações feitas no mês). FPD: alerta acima de 20%, crítico acima de 25%.</p></section>`;
  }

  /* ---------- trajetória de cada equipe (pequenos múltiplos em % da própria meta) e detalhe da equipe ---------- */
  const serieDe = (j, g) => CH.serieMes({ inicio: j.mes.inicio, dias: j.mes.dias_mes, hoje: j.mes.uteis?.restantes ? j.mes.dia_mes : null, feriados: j.mes.uteis?.feriados,
    porDia: g.dias_bl, real: g.mes_bl, prev: g.previsao?.bl ?? g.mes_bl });
  const SIT = (x) => (x >= 1 ? ["okt", "●"] : x >= 0.75 ? ["alt", "◆"] : ["rmt", "▲"]);
  function trajetorias(j, ord) {
    const com = ord.filter((g) => g.meta_bl && g.dias_bl);
    if (!com.length) return "";
    const hoje = j.mes.uteis?.restantes ? j.mes.dia_mes : null;
    const cartao = (g, rot, i) => {
      const sr = serieDe(j, g), x = (g.previsao?.bl ?? g.mes_bl) / g.meta_bl, [c, sb] = SIT(x);
      const corpo = `<b>${esc(rot)}</b><span class="st-t ${c}">${sb} ${pct0(x)} <small>proj. · ${pct0(g.mes_bl / g.meta_bl)} ${hoje ? "hoje" : "no mês"}</small></span>${CH.trajetoria({ rot, dias: sr.dias, uteis: sr.uteis, meta: g.meta_bl, hoje })}`;
      return i == null ? `<div class="traj tot">${corpo}</div>` : `<button type="button" class="traj" data-tr="${i}" aria-label="Abrir ${esc(rot)}">${corpo}</button>`;
    };
    const t = j.total, tot = j.grupos.length > 1 && t.meta_bl && t.dias_bl ? cartao(t, "Empresa", null) : "";
    return `<section class="secao"><header><h2>${com.length > 1 ? "Trajetória das equipes" : "Trajetória da equipe"}<small>Acumulado em % da própria meta${com.length > 1 ? ", todas na mesma escala" : ""} · toque ${com.length > 1 ? "numa equipe" : "nela"} para ver os vendedores</small></h2></header>
      <div class="trajs-leg"><span><i></i>Realizado</span><span><i class="proj"></i>Projeção</span><span><i class="meta"></i>Meta (100%)</span><span><i class="ideal"></i>Ritmo para fechar a meta</span></div>
      <div class="trajs">${com.map((g) => cartao(g, nomeEq(g.grupo), j.grupos.indexOf(g))).join("")}${tot}</div></section>`;
  }
  function detalhe(j, g) {
    const rot = nomeEq(g.grupo), sr = serieDe(j, g), prev = g.previsao?.bl ?? g.mes_bl, hoje = j.mes.uteis?.restantes ? j.mes.dia_mes : null;
    const u = j.mes.uteis || {}, rest = Math.max(0, (u.total || 0) - (u.decorridos || 0)), nec = g.meta_bl && rest ? Math.max(0, g.meta_bl - g.mes_bl) / rest : null;
    const [c] = g.meta_bl ? SIT(prev / g.meta_bl) : [""];
    const pessoas = [...g.pessoas].sort((a, b) => b.mes_bl - a.mes_bl);
    const m = S.modal(rot, `<p class="mut" style="margin:0 0 12px">${g.supervisor ? `sup. ${esc(S.titulo(g.supervisor))} · ` : ""}${nf.format(g.hc)} vendedor${g.hc === 1 ? "" : "es"}</p>
      <div class="eq-det-k"><div><span>Vendida</span><b>${nf.format(g.mes_bl)}</b></div><div><span>Projeção</span><b class="${c}">${nf.format(prev)}</b></div><div><span>Meta</span><b>${g.meta_bl ? nf.format(g.meta_bl) : "–"}</b></div><div><span>Precisa por dia</span><b>${nec == null ? "–" : nec.toFixed(1).replace(".", ",")}</b></div></div>
      ${g.dias_bl ? CH.acumulado({ dias: sr.dias, meta: g.meta_bl || 0, hoje, mes: j.mes.inicio.slice(0, 7), titulo: `BL vendida acumulada · ${rot}`, rotuloReal: "BL vendida acumulada", altura: 220 }) : ""}
      <h3 class="eq-det-t">Vendedores · BL no mês contra a meta individual</h3>
      ${pessoas.length ? CH.metas({ titulo: `Vendedores · ${rot}`, larguraRot: 150, itens: pessoas.map((p) => ({ rot: p.nome, real: p.mes_bl, prev: p.previsao?.bl ?? p.mes_bl, meta: p.meta_bl || 0 })) }) : `<p class="mut">Nenhum vendedor nesta equipe.</p>`}`,
      `<button type="button" class="btn sec" data-fechar>Fechar</button>`);
    m.classList.add("eq-det");
    m.querySelector("[data-fechar]").addEventListener("click", () => m.remove());
    const esc_ = (e) => { if (e.key === "Escape") { m.remove(); removeEventListener("keydown", esc_); } };
    addEventListener("keydown", esc_);
    m.querySelector("[data-fechar]").focus();
  }

  S.PAGES.equipe = async (el) => {
    const u = S.sessao.usuario, gestor = u.perfil === "gestor";
    const titulo = window.SEVEN_NAV.paginasDe(u).find((p) => p.chave === "equipe")?.nome || "Equipes";   // o mesmo nome do menu e do caminho no topo
    const q = new URLSearchParams({ ...(est.mes ? { mes: est.mes } : {}), ...(est.equipe ? { equipe: est.equipe } : {}) });
    const j = await api("/painel-equipe?" + q);
    VV = j.permissoes?.valores !== false;
    est.mes = j.competencia;
    const hojeMes = new Date().toISOString().slice(0, 7), meses = [];
    for (let i = 0; i < 12; i++) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); meses.push(d.toISOString().slice(0, 7)); }
    if (!meses.includes(est.mes)) meses.push(est.mes);
    if (!j.total.hc && !j.total.mes_vendas) {
      el.innerHTML = `<div class="tela-painel tela-equipes"><div class="cab"><div><h1>${titulo}</h1></div></div><div class="aviso">Ainda não há vendedores ou vendas para mostrar. Se você acabou de receber este acesso, peça ao gerente para ligar você às equipes em <b>Usuários e acessos → Equipes</b>.</div></div>`;
      return;
    }
    const serie = j.serie, uteis = j.mes.uteis || {};
    const graf = painel("Vendas por dia (14 dias)", CH.empilhadas({ cats: serie.map((d) => d.dia.slice(8, 10) + "/" + d.dia.slice(5, 7)), rotuloY: "Vendas", titulo: "Vendas por dia", altura: 240,
      series: [{ nome: "Instaladas", cor: CH.COR.ok, valores: serie.map((d) => d.conectadas) }, { nome: "Pendentes", cor: CH.COR.base, valores: serie.map((d) => d.pendentes) }, { nome: "Canceladas", cor: CH.COR.ruim, valores: serie.map((d) => d.canceladas) }] }),
      "Pela data da venda, na situação de hoje.");
    const mesTxt = mesRot(j.competencia).replace("/", " de ").replace(/^./, (c) => c.toUpperCase());
    el.innerHTML = `<div class="tela-painel tela-equipes"><div class="cab"><div><h1>${titulo}</h1>
        <div class="linha"><span>${esc(mesTxt)} · <b>${j.competencia === hojeMes ? `dia útil ${S.du(uteis.decorridos ?? j.mes.dia_mes)} de ${S.du(uteis.total ?? j.mes.dias_mes)}` : "mês fechado"}</b></span><span><b>${nf.format(j.total.hc)} vendedores</b>${j.grupos.length > 1 ? ` em ${j.grupos.length} equipes` : ""}</span>${j.grupos.length > 1 ? "<span>Mesma régua para todas as equipes</span>" : ""}</div></div>
        <div class="acoes"><div class="seg" id="or" role="group" aria-label="Ordenar">${ORDENS.map(([k, n]) => `<button type="button" data-o="${k}" class="${est.comp === k ? "on" : ""}" aria-pressed="${est.comp === k}">${n}</button>`).join("")}</div>
          <div class="campo"><label for="ms" class="sr">Mês</label><select id="ms">${meses.sort().reverse().map((m) => `<option value="${m}" ${m === est.mes ? "selected" : ""}>${mesRot(m)}</option>`).join("")}</select></div>
          ${gestor ? `<div class="campo"><label for="eq" class="sr">Equipe</label><select id="eq"><option value="">Todas as equipes</option>${j.equipes.map((e) => `<option value="${e.id}" ${String(e.id) === String(est.equipe) ? "selected" : ""}>${esc(nomeEq(e.nome))}</option>`).join("")}</select></div>` : ""}
          <button class="btn sec" id="xl" data-exp-pag="1" title="Baixar a visão das equipes e dos vendedores em Excel">${S.fx.ico("xls")} Exportar</button></div></div>
      <div id="comp">${comparacao(j)}</div>
      <section class="secao"><header><h2>Vendedores<small>Por equipe: toque no nome da equipe para abrir · clique no título da coluna para ordenar</small></h2></header>${tabela(j)}
        <p class="metodo">Vendas no mês = válidas (sem as canceladas). Mês ant. = mesmo período do mês anterior. FPD 3m = primeira fatura não paga no prazo nas 3 últimas safras fechadas.</p></section>
      <section class="secao"><header><h2>Últimos dias e pontos de atenção<small>Vendas dos últimos 14 dias e quem precisa de acompanhamento</small></h2></header><div class="grade g2">${graf}${atencao(j)}</div></section></div>`;
    const go = () => S.PAGES.equipe(el).catch(S.erroEm(el));
    el.querySelector("#ms").addEventListener("change", (e) => { est.mes = e.target.value; go(); });
    el.querySelector("#eq")?.addEventListener("change", (e) => { est.equipe = e.target.value; go(); });
    el.querySelector("#xl").addEventListener("click", () => excel(j).catch((e) => alert(e.message)));
    el.querySelector("#or").addEventListener("click", (e) => { const b = e.target.closest("[data-o]"); if (!b) return; est.comp = b.dataset.o; el.querySelectorAll("#or [data-o]").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); }); el.querySelector("#comp").innerHTML = comparacao(j); });
    const abrir = (e) => { const b = e.target.closest("[data-rg-chave],[data-tr]"); if (b) detalhe(j, j.grupos[+(b.dataset.rgChave ?? b.dataset.tr)]); };   // régua e trajetórias abrem o detalhe da equipe
    el.querySelector("#comp").addEventListener("click", abrir);
    const repinta = () => { el.querySelector(".eq-tabela").outerHTML = tabela(j); liga(); };
    const liga = () => {
      el.querySelectorAll(".eq-ord").forEach((th) => th.addEventListener("click", () => { const k = th.dataset.o; if (est.ordem === k) est.desc = !est.desc; else { est.ordem = k; est.desc = k !== "dias_sem_venda"; } repinta(); }));
      el.querySelectorAll(".fx-g[data-g]").forEach((tr) => tr.addEventListener("click", () => { const g = j.grupos[+tr.dataset.g].grupo; est.abertos.has(g) ? est.abertos.delete(g) : est.abertos.add(g); repinta(); }));
    };
    liga();
  };
})();
