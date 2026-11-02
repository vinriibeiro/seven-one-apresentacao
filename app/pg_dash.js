"use strict";
/* Painel e indicadores. Cada indicador usa o gráfico adequado ao tipo de dado:
   evolução no tempo -> linhas/colunas | composição de um total -> colunas empilhadas | taxa por grupo -> colunas com referência
   ranking -> barras horizontais | causas -> Pareto | volume x qualidade -> dispersão */
(() => {
  const { esc, nf, pct, brl, mes, tabela, painel, api } = S, C = CH.COR;
  const DIAS = { 1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb", 7: "Dom", 0: "Dom" };
  const k = (s) => String(s).slice(0, 7);
  /** "2026-09" -> {de:"2026-09-01", ate:"2026-09-30"}: usado ao clicar num gráfico para abrir as vendas do mês */
  const mesIntervalo = (m) => { const [a, mm] = m.split("-").map(Number); return { de: `${m}-01`, ate: `${m}-${String(new Date(a, mm, 0).getDate()).padStart(2, "0")}` }; };

  function porMes(rows) {
    const o = {};
    rows.forEach((r) => {
      const m = (o[k(r.mes_venda)] ||= { m: k(r.mes_venda), brutas: 0, ativas: 0, pend: 0, canc: 0, receita: 0, contratada: 0 });
      m.brutas += r.vendas_brutas; m.ativas += r.vendas_ativas; m.pend += r.vendas_pendentes; m.canc += r.vendas_canceladas;
      m.receita += r.receita_ativa || 0; m.contratada += r.receita_contratada || 0;
    });
    return Object.values(o).sort((a, b) => a.m.localeCompare(b.m));
  }
  const rot = (ms, i) => mes(ms[i].m) + (i === 0 || i === ms.length - 1 ? "*" : "");
  /** Faixa de destaque do último mês fechado da base, com a variação sobre o mês anterior (mesmos números dos gráficos). */
  function faixaVendas(ms) {
    if (ms.length < 2) return "";
    const i = ms.length >= 3 ? ms.length - 2 : ms.length - 1, a = ms[i], b = ms[i - 1];
    const ate = (f) => ms.slice(0, i + 1).map(f);
    const var_ = (x, y, bom) => (y ? { x: (x - y) / Math.abs(y), bom } : null);
    const chip = (v) => (v ? { txt: (v.x >= 0 ? "▲ " : "▼ ") + pct(Math.abs(v.x), 1), tom: Math.abs(v.x) < 0.005 ? "dneu" : (v.x >= 0) === v.bom ? "dpos" : "dneg" } : null);
    const mm = mes(a.m), tx = (m, n) => (m.brutas ? n / m.brutas : null);
    return `<div class="kpis">${kpi("Vendas em " + mm, nf.format(a.brutas), "contratos vendidos · vs " + mes(b.m), ate((m) => m.brutas), chip(var_(a.brutas, b.brutas, true)))}
      ${kpi("Instaladas em " + mm, nf.format(a.ativas), pct(tx(a, a.ativas)) + " das vendas (pode subir: há pendentes)", ate((m) => m.ativas), chip(var_(a.ativas, b.ativas, true)))}
      ${kpi("Cancelamento em " + mm, pct(tx(a, a.canc)), nf.format(a.canc) + " contratos cancelados", ate((m) => tx(m, m.canc)), chip(var_(tx(a, a.canc), tx(b, b.canc), false)))}
      ${ehGestor() ? kpi("Receita instalada em " + mm, brl(a.receita), "soma do pacote das vendas instaladas", ate((m) => m.receita), chip(var_(a.receita, b.receita, true))) : ""}
      ${ehGestor() ? kpi("Ticket médio em " + mm, brl(a.brutas ? a.contratada / a.brutas : 0), "média do pacote por venda", ate((m) => (m.brutas ? m.contratada / m.brutas : null)), chip(var_(a.brutas ? a.contratada / a.brutas : 0, b.brutas ? b.contratada / b.brutas : 0, true))) : ""}</div>`;
  }
  /** "Em resumo": uma frase em português simples no alto do gráfico, com os mesmos números que ele mostra. */
  const leitura = (t) => (t ? `<p class="leitura">${t}</p>` : "");
  const fechado = (ms) => (ms.length >= 3 ? ms.length - 2 : ms.length - 1);   // último mês completo (o último da base ainda está em andamento)
  const maisMenos = (dif, rot) => (dif == null ? "" : dif === 0 ? ` Mesmo número de ${rot}.` : ` ${nf.format(Math.abs(Math.round(dif)))} ${dif > 0 ? "a mais" : "a menos"} que em ${rot}.`);
  const lerVendas = (ms) => { if (!ms.length) return ""; const i = fechado(ms), a = ms[i], b = ms[i - 1];
    return `Em <b>${mes(a.m)}</b> foram vendidos <b>${nf.format(a.brutas)}</b> contratos: ${nf.format(a.ativas)} já instalados, ${nf.format(a.pend)} aguardando instalação e ${nf.format(a.canc)} cancelados.` + (b ? maisMenos(a.brutas - b.brutas, mes(b.m)) : ""); };
  const lerTaxas = (ms) => { if (!ms.length) return ""; const a = ms[fechado(ms)];
    return `Em <b>${mes(a.m)}</b>, de cada 100 vendas, <b>${Math.round(a.ativas / a.brutas * 100)}</b> foram instaladas e <b>${Math.round(a.canc / a.brutas * 100)}</b> canceladas.` + (a.pend ? ` ${nf.format(a.pend)} ainda aguardam instalação, por isso o número de instaladas tende a subir.` : ""); };
  const lerReceita = (ms) => { if (!ms.length) return ""; const i = fechado(ms), a = ms[i], b = ms[i - 1];
    return `Em <b>${mes(a.m)}</b> as vendas instaladas somaram <b>${brl(a.receita)}</b> em mensalidades contratadas.` + (b ? (a.receita >= b.receita ? ` ${brl(a.receita - b.receita)} a mais` : ` ${brl(b.receita - a.receita)} a menos`) + ` que em ${mes(b.m)}.` : ""); };
  const lerTicket = (ms) => { const v = ms.filter((m) => m.brutas); if (!v.length) return ""; const i = fechado(v), a = v[i], b = v[i - 1], t = (m) => m.contratada / m.brutas;
    return `Em <b>${mes(a.m)}</b> cada venda teve um pacote médio de <b>${brl(t(a))}</b>.` + (b ? ` Em ${mes(b.m)} era ${brl(t(b))}.` : ""); };
  const lerDia = (rows) => { if (!rows.length) return ""; const o = [...rows].sort((a, b) => b.vendas - a.vendas);
    return `O dia da semana que mais vende é <b>${DIAS[o[0].dia_semana]}</b> (${nf.format(o[0].vendas)} contratos no total) e o que menos vende é <b>${DIAS[o[o.length - 1].dia_semana]}</b> (${nf.format(o[o.length - 1].vendas)}).`; };
  const NOTA_PARCIAL = "* mês incompleto (primeira ou última data da base): não compare diretamente com meses fechados.";
  // nomes de pessoas e equipes vêm em maiúsculas do banco: nos indicadores, no mesmo formato das outras telas
  const NOMES = ["vendedor_nome", "nome_completo", "equipe", "nome", "cidade", "bairro"];
  const carregar = (n) => api("/kpi/" + n).then((l) => (Array.isArray(l) ? l.map((r) => { for (const k of NOMES) if (typeof r[k] === "string") r[k] = S.titulo(r[k]); return r; }) : l));
  const maturo = (f) => f.filter((x) => x.fpd_ok + x.fpd_nao_ok >= 30).sort((a, b) => String(a.safra).localeCompare(String(b.safra)));

  const gVendas = (ms) => painel("Vendas por mês e situação", leitura(lerVendas(ms)) + CH.linhas({ cats: ms.map((_, i) => rot(ms, i)), rotuloY: "Contratos", titulo: "Vendas por mês e situação",
    series: [{ nome: "Instaladas", cor: C.ok, valores: ms.map((m) => m.ativas) }, { nome: "Pendentes", cor: C.pend, valores: ms.map((m) => m.pend) }, { nome: "Canceladas", cor: C.ruim, valores: ms.map((m) => m.canc) }],
    irCat: (i) => ({ f: mesIntervalo(ms[i].m) }) }), "Azul-escuro: vendas já instaladas. Azul-claro: vendas que ainda aguardam instalação. Vermelho: vendas canceladas. " + NOTA_PARCIAL + " Clique em um ponto para abrir as vendas do mês.", "quantas vendas por mês e o que aconteceu com elas");
  const gTaxas = (ms0) => { const ms = ms0.filter((m) => m.brutas >= 100); return painel("De cada 100 vendas, quantas instalam e quantas cancelam", leitura(lerTaxas(ms)) + CH.linhas({ cats: ms.map((m) => mes(m.m) + (m === ms0[ms0.length - 1] ? "*" : "")), min: 0, max: 1, fmt: (v) => pct(v, 0), rotuloY: "% das vendas do mês",
    series: [{ nome: "Instaladas", cor: C.ok, valores: ms.map((m) => (m.brutas ? m.ativas / m.brutas : null)) }, { nome: "Canceladas", cor: C.ruim, valores: ms.map((m) => (m.brutas ? m.canc / m.brutas : null)) }],
    titulo: "Conectividade e cancelamento" }), "Azul: de cada 100 vendas do mês, quantas foram instaladas. Vermelho: quantas foram canceladas. Meses recentes ainda têm vendas aguardando instalação, por isso o azul tende a subir. Meses com menos de 100 vendas ficam de fora.", "em % das vendas do mês"); };
  const gFPD = (f) => {
    const d = maturo(f);
    const u = d.filter((x) => x.pct_em_prazo <= 0.1).pop() || d[d.length - 1];
    return painel("Clientes que não pagaram a 1ª fatura no prazo", (u ? leitura(`Das vendas feitas em <b>${mes(u.safra)}</b>, <b>${pct(u.fpd_nao_ok_pct, 0)}</b> dos clientes não pagaram a primeira fatura no prazo (${nf.format(u.fpd_nao_ok)} de ${nf.format(u.fpd_ok + u.fpd_nao_ok)}). ${u.fpd_nao_ok_pct > 0.25 ? "Está <b>acima</b> do limite de 25%: ponto de atenção." : "Está dentro do limite de 25%."}`) : "") + (d.length ? CH.linhas({ cats: d.map((x) => mes(x.safra)), series: [{ nome: "Não pagaram no prazo", cor: C.base, valores: d.map((x) => x.fpd_nao_ok_pct) }], rotuloY: "% das faturas resolvidas", fmt: (v) => pct(v, 0), ref: { v: 0.25, rotulo: "crítico acima de 25%" }, titulo: "FPD não pago por safra",
      dicaExtra: (i) => [{ rot: nf.format(d[i].fpd_ok + d[i].fpd_nao_ok) + " faturas resolvidas", val: "" }, { rot: pct(d[i].pct_em_prazo, 0) + " ainda no prazo", val: "" }] }) : `<p class="legenda-vazia">Sem safras com volume suficiente.</p>`),
      "FPD = primeira fatura não paga no prazo. Cada ponto é um mês de venda. Nos meses recentes ainda há faturas a vencer, por isso o número pode subir. A linha tracejada marca os 25%: acima disso é crítico.", "por mês da venda");
  };
  const gDia = (rows) => painel("Vendas por dia da semana", leitura(lerDia(rows)) + CH.linhas({ cats: [...rows].sort((a, b) => a.dia_semana - b.dia_semana).map((r) => DIAS[r.dia_semana]), series: [{ nome: "Contratos", cor: C.base, valores: [...rows].sort((a, b) => a.dia_semana - b.dia_semana).map((r) => r.vendas) }], rotuloY: "Contratos (histórico)", titulo: "Vendas por dia da semana" }), "Contando todas as vendas já registradas no sistema. Serve para saber em que dias a equipe vende mais.", "todas as vendas");
  /** Faixa de indicadores da Operação (mesmos dados das tabelas abaixo). */
  function faixaOperacao(mot, ven, parado) {
    const alvo = new Set([...new Set(mot.map((r) => k(r.mes_venda)))].sort().slice(-3)), a = {};
    mot.filter((r) => alvo.has(k(r.mes_venda))).forEach((r) => (a[r.descricao] = (a[r.descricao] || 0) + r.contratos));
    const l = Object.entries(a).sort((x, y) => y[1] - x[1]), tot = l.reduce((s, x) => s + x[1], 0);
    const v = [...ven].filter((r) => r.dia_vencimento != null).sort((x, y) => y.contratos - x.contratos)[0];
    const np = parado.filter((r) => r.dias_sem_vender >= 7 && r.dias_sem_vender <= 90).length;
    return `<div class="kpis">${kpi("Contratos com motivo (3 meses)", nf.format(tot), "cancelamento e pendência")}
      ${kpi("Motivo mais frequente", l.length ? pct(tot ? l[0][1] / tot : null, 0) : "–", l.length ? esc(l[0][0]) + " · " + nf.format(l[0][1]) + " contratos" : "sem motivos registrados")}
      ${kpi("Vendedores parados", nf.format(np), "de 7 a 90 dias sem vender")}
      ${kpi("Vencimento mais cheio", v ? "dia " + v.dia_vencimento : "–", v ? nf.format(v.contratos) + " contratos" : "")}</div>`;
  }
  const gPareto = (rows, meses) => {
    const alvo = new Set([...new Set(rows.map((r) => k(r.mes_venda)))].sort().slice(-meses));
    const a = {}; rows.filter((r) => alvo.has(k(r.mes_venda))).forEach((r) => (a[r.descricao] = (a[r.descricao] || 0) + r.contratos));
    let l = Object.entries(a).map(([rot, y]) => ({ rot, y })).sort((x, y) => y.y - x.y);
    if (l.length > 9) { const out = l.slice(9).reduce((s, x) => s + x.y, 0); l = [...l.slice(0, 9), { rot: "Outros", y: out, cor: C.cinza }]; }
    const totM = l.reduce((s, x) => s + x.y, 0) || 1;
    return painel(`Por que as vendas cancelam ou travam`, leitura(l.length ? `Nos últimos ${meses} meses o motivo mais comum foi <b>${esc(l[0].rot)}</b>: ${nf.format(l[0].y)} contratos (${pct(l[0].y / totM, 0)} do total).` : "") + (l.length ? (() => { const tot = totM; let ac = 0; return tabela([{ t: "Motivo", f: (r) => esc(r.rot) }, { t: "Contratos", n: 1, f: (r) => nf.format(r.y) + CH.mini(r.y, l[0].y, { w: 90 }) }, { t: "% do total", n: 1, f: (r) => pct(r.p) }, { t: "% acumulado", n: 1, f: (r) => pct(r.a, 0) }], l.map((x) => { ac += x.y; return { ...x, p: x.y / tot, a: ac / tot }; })); })() : `<p class="legenda-vazia">Sem motivos registrados.</p>`), "Cada linha é um motivo, do mais comum para o menos. “% acumulado” soma os motivos de cima para baixo: mostra quantos motivos explicam a maior parte dos casos.", `últimos ${meses} meses`);
  };
  const ranking = (rows, m, campo = "vendas_ativas", n = 12) => {
    const l = rows.filter((r) => k(r.mes_venda) === m && r[campo] > 0).sort((a, b) => b[campo] - a[campo]).slice(0, n);
    return l.length ? tabela([{ t: "#", n: 1, f: (r) => r._i }, { t: "Vendedor", f: (r) => esc(r.vendedor_nome || r.vendedor_login) }, { t: "Vendas instaladas (com BL)", n: 1, f: (r) => nf.format(r[campo]) + CH.mini(r[campo], l[0][campo], { w: 90 }) }], l.map((r, i) => ({ ...r, _i: i + 1 }))) : `<p class="legenda-vazia">Sem dados no mês.</p>`;
  };
  const kpi = S.kpi;

  /* ---------- Visão geral: cada departamento vê só o que é dele ---------- */
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const mesExt = (m) => { const [a, mm] = String(m).slice(0, 7).split("-").map(Number); return `${MESES[mm - 1]} de ${a}`; };
  const hoje = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const ehGestor = () => S.sessao.usuario.perfil === "gestor";
  /** Calendário do mês a partir de um vetor de vendas por dia (fechamento). */
  const diasCal = (mesIni, vet = [], feriados = []) => { const fer = new Set(feriados); return vet.map((v, i) => { const d = mesIni.slice(0, 8) + String(i + 1).padStart(2, "0"); return { d, v, folga: fer.has(d), nome: fer.has(d) ? "feriado" : "", ir: v ? { f: { de: d, ate: d } } : null }; }); };
  const subMes = (fx) => (fx?.mes?.uteis ? `${mesExt(fx.mes.inicio)} · dia útil ${S.du(fx.mes.uteis.decorridos)} de ${S.du(fx.mes.uteis.total)} (escala 6x1, sábado vale meio dia)` : "");
  /** Cabeçalho da tela (o caminho fica na barra do topo). sub e acoes já vêm em HTML. */
  const cabec = (tit, sub = "", acoes = "") => `<div class="cab"><div><h1>${esc(tit)}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}</div>${acoes ? `<div class="acoes">${acoes}</div>` : ""}</div>`;
  /** Seção da tela, no desenho do protótipo: título, uma linha de contexto e um link opcional à direita. */
  const secao = (tit, sub, corpo, ver = "") => `<section class="secao"><header><h2>${esc(tit)}${sub ? `<small>${esc(sub)}</small>` : ""}</h2>${ver}</header>${corpo}</section>`;
  /** Situação do FPD pelos limites da casa: acima de 20% alerta, acima de 25% crítico. */
  const fpdSit = (v) => (v > 0.25 ? { tom: "ruim", txt: "crítico" } : v > 0.2 ? { tom: "alerta", txt: "alerta" } : { tom: "ok", txt: "dentro do limite" });
  const filtroMes = (meses, sel) => `<div class="filtros rk-filtro"><div class="campo"><label for="rm">Mês</label><select id="rm">${meses.slice().reverse().map((m) => `<option value="${m}" ${m === sel ? "selected" : ""}>${mes(m)}</option>`).join("")}</select></div></div><div id="rk"></div>`;
  const metasEquipes = (fx) => {
    const g = (fx?.grupos || []).filter((x) => x.mes_bl || x.meta_bl).sort((a, b) => (b.previsao?.bl || 0) - (a.previsao?.bl || 0));
    return g.length ? CH.metas({ titulo: "Previsão de BL por equipe", itens: g.map((x) => ({ rot: x.grupo.replace(/^EQUIPE\s+/i, ""), sub: `${x.hc} vendedores`, real: x.mes_bl, prev: x.previsao?.bl || x.mes_bl, meta: x.meta_bl, extra: [{ rot: "Vendas no mês", val: nf.format(x.mes_vendas) }] })) }) : `<p class="legenda-vazia">Sem vendas no mês.</p>`;
  };

  /* ---------- Painel do gerente: mesmo desenho do protótipo aprovado (design/prototipos/direcao-a.html, telaPainel) ---------- */
  const ST = { ok: ["ok", "No ritmo da meta"], alerta: ["atencao", "Atenção"], ruim: ["abaixo", "Abaixo do ritmo"] };
  const dec = (v) => (v == null || !isFinite(v) ? "–" : v.toFixed(1).replace(".", ","));
  const def = (t) => `<span class="def" title="${esc(t)}" aria-label="${esc(t)}">?</span>`;
  const MIUDAS = new Set(["de", "da", "das", "do", "dos", "e"]);   // os nomes de equipe vêm em maiúsculas: mostra "Recanto das Emas"
  const nomeEq = (g) => String(g || "").replace(/^EQUIPE\s+/i, "").toLowerCase().split(" ")
    .map((p, i) => (i && MIUDAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(" ");
  const pct0 = (v) => (v == null || !isFinite(v) ? "–" : Math.round(v * 100) + "%");
  const fil = { equipe: "", mes: "" };   // filtros do Painel, mantidos enquanto o sistema estiver aberto

  /** Realizado acumulado por dia (BL) e a projeção de hoje até o fim do mês, pelo mesmo ritmo por dia útil da previsão. */
  function serieAcum(fx) {
    const t = fx.total, ini = fx.mes.inicio, n = fx.mes.dias_mes, hoje = +fx.dia.slice(8), fer = new Set(fx.mes.uteis?.feriados || []);
    const peso = (d) => { const iso = ini.slice(0, 8) + String(d).padStart(2, "0"), w = new Date(iso + "T12:00:00Z").getUTCDay(); return fer.has(iso) || w === 0 ? 0 : w === 6 ? 0.5 : 1; };
    const U = [0]; for (let d = 1; d <= n; d++) U[d] = U[d - 1] + peso(d);
    const prev = t.previsao?.bl ?? t.mes_bl, resto = U[n] - U[hoje];
    let ac = 0;
    return Array.from({ length: n }, (_, i) => {
      const d = i + 1; if (d <= hoje) ac += t.dias_bl?.[i] || 0;
      return { dia: d, real: d <= hoje ? ac : null, proj: hoje < n && d >= hoje ? Math.round(t.mes_bl + (prev - t.mes_bl) * (resto ? (U[d] - U[hoje]) / resto : 0)) : null };
    });
  }

  S.PAGES.dashboard = async (el) => {
    const u = S.sessao.usuario;
    if (u.perfil === "backoffice") return u.setor === "QUALIDADE" ? painelQualidade(el) : painelCadastro(el);
    const [vm, fpd, dia, mot, vend, geo0, cat] = await Promise.all([...["vendas-mensal", "fpd-safra", "dia-semana", "pareto-motivos", "vendedor-mensal", "geografia"].map(carregar), S.catalogos().catch(() => null)]);
    if (!vm.length) { el.innerHTML = `<div class="tela-painel">${cabec("Visão geral")}<div class="vazio"><p>Ainda não há vendas no sistema. Importe os dados ou lance a primeira venda para ver os indicadores.</p></div></div>`; return; }
    const ms = porMes(vm), meses = [...new Set(vend.map((r) => k(r.mes_venda)))].sort();
    const pode = window.SEVEN_NAV.permitidas(u);

    async function desenhar() {
      const q = new URLSearchParams();
      if (fil.equipe) q.set("equipe", fil.equipe);
      if (fil.mes) q.set("dia", mesIntervalo(fil.mes).ate);
      const atual = !fil.mes;
      const hj = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
      const qe = new URLSearchParams({ ...(fil.mes ? { mes: fil.mes } : {}), ...(fil.equipe ? { equipe: fil.equipe } : {}) });
      const [fx, av, conf, eqp, rr, pq, svd] = await Promise.all([api("/fechamento?" + q).catch(() => null), atual ? api("/avisos").catch(() => null) : null,
        atual && pode.has("confirmacao") ? api("/confirmacao").catch(() => null) : null,
        pode.has("equipe") ? api("/painel-equipe?" + qe).catch(() => null) : null,                       // FPD por equipe (desvios)
        atual && pode.has("rota") ? api(`/rota/resumo?de=${hj}&ate=${hj}`).catch(() => null) : null,      // rota de hoje e atrasadas
        atual && pode.has("pendencias") ? api("/pendencias?resumo=1").catch(() => null) : null,
        atual && pode.has("semvenda") ? api("/sem-venda").catch(() => null) : null]);                     // dias sem vender de cada pessoa
      const diasDesde = (d) => Math.round((new Date(hj + "T12:00:00Z") - new Date(String(d).slice(0, 10) + "T12:00:00Z")) / 864e5);
      /** Há quanto tempo um pedido espera: "há 52 min", "há 1h33", "3 dias". */
      const idade = (ts) => { if (!ts) return "—"; const m = Math.max(0, Math.round((Date.now() - new Date(ts)) / 6e4));
        return m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${Math.floor(m / 1440)} dia${m >= 2880 ? "s" : ""}`; };
      if (!fx) { el.innerHTML = `<div class="tela-painel">${cabec("Visão geral")}${S.avisoHtml("erro", "Não foi possível carregar o fechamento do mês.", "Tente de novo em instantes.")}</div>`; return; }
      const t = fx.total, p = t.previsao || {}, meta = t.meta_bl || 0, ate = S.dt(fx.dia).slice(0, 5);
      const mesNome = mesExt(fx.mes.inicio).split(" de ")[0], eqNome = fil.equipe ? nomeEq(cat?.equipes?.find((e) => String(e.id) === fil.equipe)?.nome) : "todas as equipes";
      const agora = new Date(), quando = agora.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).replace(".", "") + " às " + agora.toTimeString().slice(0, 5);

      /* cabeçalho: título, linha de contexto e filtros */
      /* o 1º item é sempre o mês do calendário (valor vazio = mês atual), mesmo sem vendas lançadas; depois vêm os meses fechados que têm vendas */
      const mesAtual = hj.slice(0, 7);
      const opMes = [mesAtual, ...ms.map((m) => m.m).filter((m) => m < mesAtual).slice(-5).reverse()].map((m, i) => `<option value="${i ? m : ""}"${(i ? m : "") === fil.mes ? " selected" : ""}>${esc(mesExt(m).replace(/^./, (c) => c.toUpperCase()))}${i ? " (fechado)" : ""}</option>`).join("");
      const opEq = `<option value="">Todas as equipes</option>` + (cat?.equipes || []).map((e) => `<option value="${e.id}"${String(e.id) === fil.equipe ? " selected" : ""}>${esc(nomeEq(e.nome))}</option>`).join("");
      const cab = `<div class="cab"><div><h1>Resultado de ${esc(mesNome)}</h1>
        <div class="linha">${atual ? `<span>Atualizado <b>${esc(quando)}</b></span>` : `<span>Mês <b>fechado</b></span>`}<span>Dia útil <b>${S.du(p.dias_decorridos)} de ${S.du(p.dias_uteis)}</b> · escala 6x1</span><span>Escopo <b>${esc(eqNome)}</b></span></div></div>
        <div class="acoes"><div class="campo"><label for="f-eq" class="sr">Equipe</label><select id="f-eq">${opEq}</select></div>
        <div class="campo"><label for="f-mes" class="sr">Mês</label><select id="f-mes">${opMes}</select></div></div></div>`;

      /* 1. resultado do mês */
      const lanc = t.mes_vendas + t.mes_canceladas, pend = Math.max(0, t.mes_vendas - t.mes_conectadas);
      const sf = maturo(fpd).filter((x) => String(x.safra).slice(0, 7) < fx.mes.inicio.slice(0, 7)).slice(-3);
      const fOk = sf.reduce((s, x) => s + x.fpd_ok, 0), fNao = sf.reduce((s, x) => s + x.fpd_nao_ok, 0), fpdV = fOk + fNao ? fNao / (fOk + fNao) : null;
      const safras = sf.map((x) => MESES[+String(x.safra).slice(5, 7) - 1].slice(0, 3)).join(", ");
      const partes = [["Instaladas", t.mes_conectadas, "inst"], ["Pendentes", pend, "pend"], ["Canceladas", t.mes_canceladas, "canc"]];
      const s1 = secao("Resultado do mês", `O que já foi realizado de 1º a ${ate}`, `<div class="livro">
        <div><div class="rot">BL vendida ${def("Contratos do mês com banda larga, instalados ou pendentes; os cancelados não contam. O total ao lado são as vendas lançadas no mês, de todos os produtos, inclusive as canceladas. A meta do mês fica em Meta e fechamento.")}</div>
          <div class="val">${nf.format(t.mes_bl)}${lanc ? ` <small>de ${nf.format(lanc)}</small>` : ""}</div>
          <div class="det">${lanc ? `<b>${pct0(t.mes_bl / lanc)}</b> das vendas lançadas no mês` : "sem vendas lançadas no mês"}</div>
          ${lanc ? `<div class="medidor" aria-hidden="true"><i style="width:${Math.min(100, (t.mes_bl / lanc) * 100)}%"></i></div>
          <div class="medidor-leg"><span>0</span><span>${nf.format(lanc)} lançadas</span></div>` : ""}
          <div class="bl-tipos" role="group" aria-label="BL vendida por tipo de cliente">
            <div title="Cliente novo"><span>Prospect</span><b>${nf.format(t.mes_bl_prospect ?? 0)}</b></div>
            <div title="Cliente que já possui contrato"><span>Base</span><b>${nf.format(t.mes_bl_base ?? 0)}</b></div>
            <div title="Prospect + Base"><span>Todas</span><b>${nf.format(t.mes_bl)}</b></div></div></div>
        <div><div class="rot">Vendas válidas ${def("Contratos de todos os produtos lançados no mês, instalados ou pendentes. Os cancelados não contam.")}</div>
          <div class="val">${nf.format(t.mes_vendas)}</div>
          <div class="det">de <b>${nf.format(lanc)}</b> lançadas · ${nf.format(t.mes_canceladas)} canceladas<br><b>${dec(p.dias_decorridos ? t.mes_vendas / p.dias_decorridos : null)}</b> por dia útil</div></div>
        <div><div class="rot">Situação das ${nf.format(lanc)} vendas lançadas</div>
          <div class="g-pilha" role="img" aria-label="${partes.map(([r, v]) => `${r}: ${v}`).join(", ")}">${partes.map(([r, v, c]) => (v ? `<span class="g-pilha-p ${c}" style="flex:${v}" title="${r}: ${nf.format(v)}"></span>` : "")).join("")}</div>
          <div class="leg-est">${partes.map(([r, v, c]) => `<i style="background:var(--st-${c})"></i><span>${r}</span><span class="num">${nf.format(v)} · ${pct0(lanc ? v / lanc : null)}</span>`).join("")}</div></div>
        <div><div class="rot">FPD · ${sf.length} últimas safras ${def("Primeiras faturas não pagas no prazo ÷ primeiras faturas já resolvidas, nas safras indicadas (mês da venda), de toda a empresa. A safra mais recente ainda está em maturação e tende a subir.")}</div>
          <div class="val">${fpdV == null ? "–" : dec(fpdV * 100) + "%"}</div>
          <div class="det">alerta acima de <b>20%</b> · crítico acima de <b>25%</b><br>${nf.format(fOk + fNao)} faturas resolvidas${safras ? ` (${esc(safras)})` : ""}</div></div>
      </div>`);

      /* 2. meta e fechamento */
      const st = ST[t.ritmo?.status] || null, ritmoAt = p.dias_decorridos ? t.mes_bl / p.dias_decorridos : null;
      const ritmoNec = meta && p.dias_restantes ? Math.max(0, meta - t.mes_bl) / p.dias_restantes : null;
      const s2 = secao("Meta e fechamento", atual ? "Como estamos em relação à meta e onde o mês deve terminar no ritmo atual" : "Como o mês terminou em relação à meta", `<div class="meta-grade">
        <div class="proj-box"><div class="rot">${atual ? "Projeção de fechamento" : "Fechamento"} · BL vendida</div>
          <div class="val">${nf.format(atual ? p.bl ?? t.mes_bl : t.mes_bl)}</div>
          <div class="det">${st && meta ? `<span class="st ${st[0]}">${st[1]}</span> &nbsp;${pct0(p.bl / meta)} da meta · ${p.bl >= meta ? `passaria a meta em ${nf.format(p.bl - meta)}` : `faltariam ${nf.format(meta - p.bl)}`}` : "sem meta definida"}</div>
          <dl><dt>Ritmo atual</dt><dd>${dec(ritmoAt)}<small>BL por dia útil</small></dd>
            ${atual ? `<dt>Ritmo para bater a meta</dt><dd>${ritmoNec == null ? "–" : dec(ritmoNec)}<small>nos ${S.du(p.dias_restantes)} dias úteis restantes</small></dd>` : ""}</dl>
          <p class="metodo">Projeção = BL vendida até hoje ÷ dias úteis decorridos × dias úteis do mês, por vendedor e somada. Sábado vale meio dia; domingos e feriados não contam.</p></div>
        <figure class="grafico">${t.dias_bl ? CH.acumulado({ dias: serieAcum(fx), meta, hoje: atual ? +fx.dia.slice(8) : null, mes: fx.mes.inicio.slice(0, 7), titulo: "BL vendida acumulada", rotuloReal: "BL vendida acumulada" }) : `<p class="legenda-vazia">O servidor ainda não manda a BL por dia; o gráfico aparece depois da atualização.</p>`}</figure>
      </div>`);

      /* 3. equipes: mesma régua para todas (em % da meta ou em quantidade), com o esperado até hoje; menor projeção primeiro */
      const gr = (fx.grupos || []).filter((g) => g.mes_bl || g.meta_bl);
      const at = (g) => (g.meta_bl ? (g.previsao?.bl ?? g.mes_bl) / g.meta_bl : Infinity);
      const ord = [...gr].sort((a, b) => at(a) - at(b));
      const uDec = fx.mes.uteis?.decorridos || 0, uRest = atual ? Math.max(0, (fx.mes.uteis?.total || 0) - uDec) : 0;
      const itemRg = (g, rot, sub) => ({ rot, sub, real: g.mes_bl, prev: g.previsao?.bl ?? g.mes_bl, meta: g.meta_bl || null,
        esp: atual && g.meta_bl ? g.meta_bl * (g.frac ?? fx.mes.frac) : null, ritmo: uDec ? g.mes_bl / uDec : null, nec: g.meta_bl && uRest ? Math.max(0, g.meta_bl - g.mes_bl) / uRest : null,
        href: pode.has("equipe") ? "#/equipe" : null });
      const s3 = gr.length ? secao("Equipes", "Mesma régua para todas · menor projeção ÷ meta primeiro",
        CH.regua({ itens: ord.map((g) => itemRg(g, nomeEq(g.grupo), `${g.supervisor ? `sup. ${S.titulo(g.supervisor)} · ` : ""}${nf.format(g.hc)} vendedores`)),
          total: itemRg({ ...t, previsao: p }, fil.equipe ? eqNome : "Empresa", `${nf.format(t.hc)} vendedores`) }),
        pode.has("equipe") ? `<a class="ver" href="#/equipe">Comparação completa das equipes →</a>` : "") : "";

      /* 4. desvios que pedem atenção (só o que os dados do mês sustentam) */
      const dv = [];
      const item = (tom, tit, txt, base, bt, href) => dv.push(`<div class="desvio"><span class="ic ${tom}" aria-hidden="true">!</span><div><b>${tit}</b><p>${txt}</p><span class="base">${base}</span></div>${bt && pode.has(href.slice(2)) ? `<a class="btn sec pq" href="${href}">${bt}</a>` : ""}</div>`);
      const baseProj = `Base: BL vendida de 1º a ${ate} · projeção pelo ritmo por dia útil de cada pessoa`;
      const ruins = ord.filter((g) => g.meta_bl && g.ritmo?.status === "ruim"), alertas = ord.filter((g) => g.meta_bl && g.ritmo?.status === "alerta");
      const lista = (gs) => gs.map((g) => `${esc(nomeEq(g.grupo))} (${pct0(at(g))})`).join(", ");
      const falta = (gs) => gs.reduce((s, g) => s + Math.max(0, g.meta_bl - (g.previsao?.bl ?? g.mes_bl)), 0);
      if (atual && ruins.length) item("abaixo", `${ruins.length} ${ruins.length > 1 ? "equipes projetam" : "equipe projeta"} fechar abaixo de 75% da meta`, `${lista(ruins)}. No ritmo atual, faltariam ${nf.format(falta(ruins))} BL para ${ruins.length > 1 ? "as metas dessas equipes" : "a meta dessa equipe"}.`, baseProj, "Ver equipes", "#/equipe");
      if (atual && alertas.length) item("atencao", `${alertas.length} ${alertas.length > 1 ? "equipes ficam" : "equipe fica"} entre 75% e 100% da meta`, `${lista(alertas)}. No ritmo atual, faltariam ${nf.format(falta(alertas))} BL.`, baseProj, "Ver equipes", "#/equipe");
      // FPD: por equipe quando a comparação das equipes está disponível; senão, o da empresa
      const fg = (eqp?.grupos || []).filter((g) => g.fpd != null), fCrit = fg.filter((g) => g.fpd > 0.25), fAl = fg.filter((g) => g.fpd > 0.2 && g.fpd <= 0.25);
      const nEq = (n) => `${n} equipe${n > 1 ? "s" : ""}`, fLista = (gs) => gs.map((g) => `${esc(nomeEq(g.grupo))} ${dec(g.fpd * 100)}% (${nf.format(g.fpd_resolvidas || 0)} faturas resolvidas)`).join(", ");
      const fs = eqp?.fpd_safras, fSafras = fs ? `${MESES[+fs.de.slice(5, 7) - 1].slice(0, 3)} a ${MESES[+fs.ate.slice(5, 7) - 1].slice(0, 3)}` : "";
      if (fg.length && (fCrit.length || fAl.length)) item(fCrit.length ? "abaixo" : "atencao",
        fCrit.length ? `FPD crítico em ${nEq(fCrit.length)}${fAl.length ? ` e em alerta em ${nEq(fAl.length)}` : ""}` : `FPD em alerta em ${nEq(fAl.length)}`,
        [fCrit.length ? `${fLista(fCrit)}, acima do limite de 25%.` : "", fAl.length ? `${fLista(fAl)}, acima do alerta de 20%.` : ""].filter(Boolean).join(" "),
        `Base: 3 últimas safras fechadas${fSafras ? ` (${esc(fSafras)})` : ""} · a mais recente ainda está em maturação`, "Ver qualidade", "#/ind-qualidade");
      else if (!fg.length && fpdV != null && fpdV > 0.2) item(fpdV > 0.25 ? "abaixo" : "atencao", `FPD ${fpdV > 0.25 ? "crítico" : "em alerta"}: ${dec(fpdV * 100)}%`, `Acima ${fpdV > 0.25 ? "do limite de 25%" : "do alerta de 20%"} nas safras de ${esc(safras)}.`, "Base: primeiras faturas resolvidas dessas safras · a mais recente ainda está em maturação", "Ver qualidade", "#/ind-qualidade");
      if (rr?.atrasadas) item("atencao", `${nf.format(rr.atrasadas)} ${rr.atrasadas > 1 ? "instalações atrasadas" : "instalação atrasada"} na rota`,
        `Agendada${rr.atrasadas > 1 ? "s" : ""} para dias anteriores e ainda pendente${rr.atrasadas > 1 ? "s" : ""} de instalação.${rr.atrasada_mais_antiga ? ` A mais antiga é de ${S.dt(rr.atrasada_mais_antiga).slice(0, 5)}.` : ""}`,
        "Base: rota de instalação, situação “pendente”, data anterior a hoje", "Abrir rota", "#/rota");
      // sem venda hoje: pela lista da tela "Sem venda hoje" (com os dias sem vender); sem ela, pelo fechamento
      const eqSel = fil.equipe ? String(cat?.equipes?.find((e) => String(e.id) === fil.equipe)?.nome || "") : "";
      const svEq = svd ? svd.equipes.filter((g) => !eqSel || g.equipe === eqSel) : null;
      const sv = svEq ? svEq.flatMap((g) => g.sem) : fx.destaques?.sem_venda || [], svTot = svEq ? svEq.reduce((s, g) => s + g.total, 0) : t.hc;
      const longos = svEq ? sv.map((x) => ({ ...x, d: x.ultima_venda ? diasDesde(x.ultima_venda) : null })).filter((x) => x.d == null || x.d >= 3).sort((a, b) => (b.d ?? 999) - (a.d ?? 999)) : [];
      const nomeD = (x) => `${esc(S.titulo(x.nome))} (${x.d == null ? "nunca vendeu" : `${x.d} dias`})`;
      if (atual && sv.length) item("atencao", `${nf.format(sv.length)} de ${nf.format(svTot)} vendedores ainda sem venda hoje`,
        longos.length ? `${longos.length === 1 ? "Um está" : `${nf.format(longos.length)} estão`} há 3 dias ou mais sem vender: ${longos.slice(0, 3).map(nomeD).join(", ")}${longos.length > 3 ? ` e mais ${longos.length - 3}` : ""}.`
          : `${sv.slice(0, 3).map((x) => esc(S.titulo(x.nome))).join(", ")}${sv.length > 3 ? ` e mais ${sv.length - 3}` : ""}.`,
        `Base: vendedores ativos em equipe · hoje até ${esc(agora.toTimeString().slice(0, 5))}`, "Ver lista", "#/semvenda");
      const s4 = secao("Desvios que pedem atenção", "Cada item mostra a base do cálculo e leva aos registros que explicam o número",
        dv.length ? `<div class="desvios">${dv.join("")}</div>` : `<div class="vazio"><p>Nenhum desvio no momento: equipes no ritmo e FPD dentro do limite.</p></div>`);

      /* 5. filas da operação agora (só as que o perfil pode abrir) */
      const fl = [];
      const fila = (k, nome, n, sub, mais, obs) => { if (pode.has(k)) fl.push(`<tr><td data-l="Fila"><b>${nome}</b></td><td class="n" data-l="Aguardando"><b>${nf.format(n)}</b>${sub ? ` <span class="sub">${sub}</span>` : ""}</td><td data-l="Mais antigo">${mais}</td><td data-l="Observação">${obs}</td><td class="n"><a class="btn sec pq" href="#/${k}">${k === "rota" ? "Abrir rota" : "Abrir fila"}</a></td></tr>`); };
      if (atual) {
        if (av?.viabilidade) fila("viabilidade", "Viabilidade", av.viabilidade.pendentes || 0, av.viabilidade.em_analise ? `+${av.viabilidade.em_analise} em análise` : "", av.viabilidade.pendentes ? idade(av.viabilidade.mais_antigo) : "—",
          av.viabilidade.respondidas_hoje != null ? `${nf.format(av.viabilidade.respondidas_hoje)} respondidas hoje · ${nf.format(av.viabilidade.atende_hoje || 0)} atende` : "pedidos aguardando resposta ao vendedor");
        if (av?.conexao) fila("vendaexterna", "Conexão / Solar", av.conexao.pendentes || 0, "", av.conexao.pendentes ? idade(av.conexao.mais_antigo) : "—", "vendas aguardando tratamento");
        if (conf) fila("confirmacao", "Confirmação D+1 / D+15", (conf.d1?.cont?.falta || 0) + (conf.d15?.cont?.falta || 0), "", "—", `${nf.format(conf.d1?.cont?.falta || 0)} de D+1 e ${nf.format(conf.d15?.cont?.falta || 0)} de D+15 para ligar hoje`);
        const hoje = rr ? rr.dias.filter((d) => String(d.data_rota).slice(0, 10) === hj && !["CANCELADO", "INSTALADO"].includes(d.situacao)) : [];
        const semConf = hoje.reduce((s, d) => s + d.n - d.confirmadas, 0);
        fila("rota", "Rota de instalação", t.agendadas, "agendadas hoje", "—", rr ? `${nf.format(semConf)} sem confirmação · ${nf.format(rr.atrasadas || 0)} atrasada${rr.atrasadas === 1 ? "" : "s"} de dias anteriores`
          : `${nf.format(t.instaladas)} instaladas · ${nf.format(Math.max(0, t.agendadas - t.instaladas))} em aberto`);
        if (pq) { const c = pq.contagem || {}, n = Object.values(c).reduce((s, x) => s + x, 0);
          fila("pendencias", "Pendências", n, "", pq.mais_antiga ? `${nf.format(diasDesde(pq.mais_antiga))} dias` : "—", `${nf.format(c.CHIP_PENDENTE || 0)} chips a ativar · ${nf.format(c.CADASTRO_ANDAMENTO || 0)} cadastros em andamento`); }
      }
      const s5 = fl.length ? secao("Filas da operação agora", "Trabalho aguardando o backoffice de Cadastro",
        `<table class="tabela"><thead><tr><th>Fila</th><th class="n">Aguardando</th><th>Mais antigo</th><th>Observação</th><th></th></tr></thead><tbody>${fl.join("")}</tbody></table>`) : "";

      /* histórico (já existia): fica no fim, sempre de toda a empresa */
      const s6 = secao("Histórico e qualidade", "Meses anteriores, FPD por safra, dias da semana, ranking e motivos · toda a empresa", `<div class="grade g2">${gVendas(ms)}${gTaxas(ms)}${gFPD(fpd)}${gDia(dia)}
        ${painel("Ranking de vendedores", filtroMes(meses, meses.at(-1)), "Ranking por vendas instaladas no mês selecionado.", "top 12")}
        ${gPareto(mot, 3)}</div>`);

      el.innerHTML = `<div class="tela-painel">${cab}${s1}${s2}${s3}${s4}${s5}${s6}</div>`;
      el.querySelector("#f-eq").addEventListener("change", (e) => { fil.equipe = e.target.value; desenhar().then(() => S.ui?.botaoExportar(el)).catch(S.erroEm(el)); });
      el.querySelector("#f-mes").addEventListener("change", (e) => { fil.mes = e.target.value; desenhar().then(() => S.ui?.botaoExportar(el)).catch(S.erroEm(el)); });
      el.querySelectorAll("tr[data-ir]").forEach((tr) => tr.addEventListener("click", () => (location.hash = tr.dataset.ir)));
      const rk = () => (el.querySelector("#rk").innerHTML = ranking(vend, el.querySelector("#rm").value));
      el.querySelector("#rm").addEventListener("change", rk); rk();
    }
    await desenhar();
  };

  /** Qualidade: filas de trabalho (D+1/D+15, cobrança, churn) e volume, situação, cancelamento e motivos. Sem valores em R$. */
  async function painelQualidade(el) {
    const [vm, dia, mot, vend] = await Promise.all(["vendas-mensal", "dia-semana", "pareto-motivos", "vendedor-mensal"].map(carregar));
    const [cf, cb, ch] = await Promise.all([api("/confirmacao"), api("/qualidade/cobranca"), api("/qualidade/churn")].map((p) => p.catch(() => null)));
    const IC = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
    const atq = (n, rot, sub, href, tom, ic) => `<a class="atalho ${n ? tom : "ok"}" href="${href}"><span class="ai">${IC(ic)}</span><div><b>${nf.format(n)}</b><span>${esc(rot)}${sub ? ` · ${esc(sub)}` : ""}</span></div></a>`;
    const filas = (cf || cb || ch) ? `<div class="atalhos">${cf ? atq((cf.d1.cont.falta || 0) + (cf.d15.cont.falta || 0), "ligações D+1 / D+15 a fazer", `${nf.format(cf.d1.cont.falta || 0)} de D+1 · ${nf.format(cf.d15.cont.falta || 0)} de D+15`, "#/confirmacao", "alerta", '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>') : ""}
        ${cb ? atq(cb.cont.sem_tratativa, "faturas em aberto sem contato", `${nf.format(cb.cont.vencidas)} com prazo Seven vencido`, "#/fila-cobranca", cb.cont.vencidas ? "ruim" : "alerta", '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>') : ""}
        ${ch ? atq(ch.cont.sem_tratativa, "clientes no churn sem tratativa", `${nf.format(ch.cont.caiu)} caíram · ${nf.format(ch.cont.chegando)} perto dos ${Math.round(ch.dias / 30)} meses`, "#/fila-churn", ch.cont.caiu ? "ruim" : "alerta", '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>') : ""}</div>` : "";
    if (!vm.length) { el.innerHTML = `<div class="tela-painel">${cabec("Visão geral")}<div class="vazio"><p>Ainda não há vendas no sistema.</p></div></div>`; return; }
    const ms = porMes(vm), at = ms[ms.length - 1], meses = [...new Set(vend.map((r) => k(r.mes_venda)))].sort();
    el.innerHTML = `<div class="tela-painel">${cabec("Visão geral", `${mesExt(at.m)} · situação, conectividade e cancelamento das vendas`)}` + filas +
      `<div class="grade g2">${gVendas(ms)}${gTaxas(ms)}${gPareto(mot, 3)}${gDia(dia)}
      ${painel("Ranking de vendedores", filtroMes(meses), "Ranking por vendas instaladas no mês selecionado.", "top 12")}</div></div>`;
    const rk = () => (el.querySelector("#rk").innerHTML = ranking(vend, el.querySelector("#rm").value));
    el.querySelector("#rm").addEventListener("change", rk); rk();
  }

  /** Cadastro: a fila de trabalho do dia (viabilidade, D-1 das instalações de amanhã, rota) e o volume de vendas. Sem R$ e sem FPD. */
  async function painelCadastro(el) {
    const amanha = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4 + 864e5).toISOString().slice(0, 10);
    const [fx, rt, vb] = await Promise.all([api("/fechamento"), api(`/rota/resumo?de=${amanha}&ate=${amanha}`).catch(() => null), api("/viabilidade?status=PENDENTE").catch(() => null)]);
    const t = fx.total, IC = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
    const pend = vb?.contagem?.PENDENTE || 0, an = vb?.contagem?.EM_ANALISE || 0;
    // D-1: instalações de amanhã que ainda estão pendentes e sem confirmação do cliente
    const d1 = rt ? rt.dias.filter((x) => x.situacao === "PENDENTE_INSTALACAO").reduce((s, x) => s + x.n - x.confirmadas, 0) : 0, atr = rt?.atrasadas || 0;
    const at = (n, rot, sub, href, tom, ic) => `<a class="atalho ${n ? tom : "ok"}" href="${href}"><span class="ai">${IC(ic)}</span><div><b>${nf.format(n)}</b><span>${esc(rot)}${sub ? ` · ${esc(sub)}` : ""}</span></div></a>`;
    el.innerHTML = `<div class="tela-painel">${cabec("Visão geral", `Hoje, ${S.dt(fx.dia)} · ${subMes(fx)}`)}` +
      `<div class="atalhos">${at(pend + an, "viabilidades aguardando", an ? `${an} em análise` : "responder ao vendedor", "#/viabilidade", "ruim", '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>')}
        ${at(d1, "instalações de amanhã sem confirmação", "D-1: ligar para o cliente", "#/rota", "alerta", '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>').replace("<a ", '<a data-d1="1" ')}
        ${at(atr, "instalações atrasadas", "de dias anteriores, sem resultado", "#/rota", "ruim", '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')}
        ${at(Math.max(0, t.agendadas - t.instaladas), "instalações em aberto hoje", `${t.instaladas} de ${t.agendadas} feitas`, "#/rota", "alerta", '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H16a3.5 3.5 0 000-7H8a3.5 3.5 0 010-7h7.5"/>')}</div>
      <div class="kpis">${kpi("Vendas hoje", nf.format(t.vendas), `${nf.format(t.ontem)} ontem`, fx.serie.map((d) => d.conectadas + d.pendentes))}${kpi("Vendas no mês", nf.format(t.mes_vendas), `${nf.format(t.mes_bl)} com banda larga`)}
        ${kpi("Instaladas no mês", nf.format(t.mes_conectadas), pct(t.mes_vendas + t.mes_canceladas ? t.mes_conectadas / (t.mes_vendas + t.mes_canceladas) : null) + " de conectividade")}${kpi("Canceladas no mês", nf.format(t.mes_canceladas), pct(t.mes_vendas + t.mes_canceladas ? t.mes_canceladas / (t.mes_vendas + t.mes_canceladas) : null))}</div>
      ${S.ui.previsao(t, { titulo: "Previsão de BL da empresa" })}
      <div class="grade g2">${painel(`Vendas por dia · ${mesExt(fx.mes.inicio)}`, CH.calor({ titulo: "Vendas por dia do mês", rotulo: "Vendas válidas", mes: fx.mes.inicio.slice(0, 7), dias: diasCal(fx.mes.inicio, t.dias, fx.mes.uteis.feriados) }), "Domingos e feriados em cinza (fora da escala 6x1). Clique num dia para abrir as vendas.", "calendário")}
      ${painel("Últimos 14 dias", CH.empilhadas({ titulo: "Últimos 14 dias", rotuloY: "Vendas", cats: fx.serie.map((d) => d.dia.slice(8) + "/" + d.dia.slice(5, 7)), series: [{ nome: "Instaladas", cor: C.ok, valores: fx.serie.map((d) => d.conectadas) }, { nome: "Pendentes", cor: C.pend, valores: fx.serie.map((d) => d.pendentes) }, { nome: "Canceladas", cor: C.ruim, valores: fx.serie.map((d) => d.canceladas) }] }), "Pela data da venda, na situação de hoje.")}</div>
      ${painel("Vendas no mês por equipe", tabela([{ t: "Equipe", f: (g) => `<b>${esc(g.grupo)}</b>` }, { t: "Hoje", n: 1, f: (g) => nf.format(g.vendas) }, { t: "Mês", n: 1, f: (g) => nf.format(g.mes_vendas) }, { t: "BL no mês", n: 1, f: (g) => nf.format(g.mes_bl) + CH.mini(g.mes_bl, Math.max(...fx.grupos.map((x) => x.mes_bl), 1), { w: 60 }) }, { t: "Pendentes de BL", n: 1, f: (g) => nf.format(g.mes_bl_pend) }, { t: "Canceladas", n: 1, f: (g) => nf.format(g.mes_canceladas) }, { t: "Instalações hoje", n: 1, f: (g) => `${g.instaladas}/${g.agendadas}` }], fx.grupos), "", `${fx.grupos.length} equipes`)}</div>`;
    el.querySelector("[data-d1]")?.addEventListener("click", (e) => { e.preventDefault(); S.filtrarRota(amanha); });
  }

  /* ---------- Indicadores por tema ---------- */
  S.PAGES["ind-vendas"] = async (el) => {
    const [vm, oc, mix, dia] = await Promise.all(["vendas-mensal", "origem-canal", "mix-produto", "dia-semana"].map(carregar));
    const ms = porMes(vm);
    const orig = {}; oc.forEach((r) => { const o = (orig[`${r.origem || "sem origem informada"} / ${r.canal || "sem canal"}`] ||= { v: 0, c: 0, p: 0 }); o.v += r.vendas; o.c += r.taxa_cancelamento * r.vendas; o.p += r.taxa_pendencia * r.vendas; });
    const lo = Object.entries(orig).map(([n, o]) => ({ n, v: o.v, c: o.c / o.v, p: o.p / o.v })).sort((a, b) => b.v - a.v);
    const cats = {}; const ult = [...new Set(mix.map((r) => k(r.mes_venda)))].sort().slice(-3);
    mix.filter((r) => ult.includes(k(r.mes_venda))).forEach((r) => (cats[r.categoria] = (cats[r.categoria] || 0) + r.contratos));
    const NM = { VIRTUA: "Internet (Vírtua)", TV: "TV", MOVEL: "Móvel (chip)", MESH: "Wi-Fi Mesh", FONE: "Fone", MPLAY: "MPlay", PONTO_ADICIONAL: "Ponto adicional" };
    el.innerHTML = `<div class="cab"><div><div class="migalha">Indicadores</div><h1>Vendas</h1>${ms.length ? `<p>${nf.format(ms.reduce((s, m) => s + m.brutas, 0))} contratos vendidos de ${mes(ms[0].m)} a ${mes(ms[ms.length - 1].m)} · meses incompletos marcados com *</p>` : ""}</div></div>
      ${faixaVendas(ms)}
      <div class="grade g2">${gVendas(ms)}${gTaxas(ms)}
      ${ehGestor() ? painel("Receita de pacotes por mês", leitura(lerReceita(ms)) + CH.linhas({ cats: ms.map((_, i) => rot(ms, i)), series: [{ nome: "Receita instalada", cor: C.base, valores: ms.map((m) => m.receita) }], fmt: (v) => (v >= 1000 ? nf.format(Math.round(v / 1000)) + " mil" : nf.format(v)), rotuloY: "R$ (vendas instaladas)", titulo: "Receita instalada por mês" }), "Soma das mensalidades (pacotes) de todas as vendas instaladas no mês. " + NOTA_PARCIAL, "quanto as vendas instaladas valem por mês") : ""}
      ${ehGestor() ? painel("Ticket médio por mês", leitura(lerTicket(ms)) + CH.linhas({ cats: ms.map((_, i) => rot(ms, i)), series: [{ nome: "Ticket médio", cor: C.base, valores: ms.map((m) => (m.brutas ? m.contratada / m.brutas : null)) }], min: Math.max(0, Math.floor(Math.min(...ms.filter((m) => m.brutas).map((m) => m.contratada / m.brutas), 1e9) * 0.9 / 10) * 10), fmt: (v) => "R$ " + nf.format(Math.round(v)), rotuloY: "R$ por venda", titulo: "Ticket médio" }), "Ticket médio = valor médio do pacote (mensalidade) de cada venda. Quanto mais alto, mais cada venda vale.", "valor médio do pacote por venda") : ""}
      ${painel("Contratos por produto (últimos 3 meses)", leitura((() => { const t = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]; return t ? `O produto mais vendido nos últimos 3 meses é <b>${esc(NM[t[0]] || t[0])}</b>: está em ${nf.format(t[1])} contratos.` : ""; })()) + tabela([{ t: "Produto", f: (r) => esc(r.rot) }, { t: "Contratos", n: 1, f: (r) => nf.format(r.y) + CH.mini(r.y, Math.max(...Object.values(cats), 1), { w: 110 }) }], Object.entries(cats).map(([n, y]) => ({ rot: NM[n] || n, y })).sort((a, b) => b.y - a.y)), "Um contrato pode ter mais de um produto; os valores não somam o total de contratos.")}
      ${gDia(dia)}</div>
      ${painel("Origem e canal", leitura(lo.length ? `A maior parte das vendas vem de <b>${esc(lo[0].n)}</b>: ${nf.format(lo[0].v)} contratos (${pct(lo[0].v / lo.reduce((s, x) => s + x.v, 0), 0)} do total).` : "") + tabela([{ t: "Origem / canal", k: "n" }, { t: "Vendas", n: 1, f: (r) => nf.format(r.v) + CH.mini(r.v, Math.max(...lo.map((x) => x.v), 1), { w: 64 }) }, { t: "% cancelamento", n: 1, f: (r) => pct(r.c) + CH.mini(r.c, Math.max(...lo.map((x) => x.c), 0.01), { cor: C.ruim, w: 64 }) }, { t: "% pendência", n: 1, f: (r) => pct(r.p) + CH.mini(r.p, Math.max(...lo.map((x) => x.p), 0.01), { cor: C.pend, w: 64 }) }], lo), "Origem = como o cliente chegou (PAP, indicação, rede social...). Canal = por onde a venda foi feita (NETSALES ou SOLAR).", "de onde vêm as vendas · todo o período")}`;
  };

  S.PAGES["ind-qualidade"] = async (el) => {
    const [fpd, rec, sob, sit, perda] = await Promise.all(["fpd-safra", "fpd-recorte", "sobrevivencia", "situacao-faturas", "perda-fpd"].map(carregar));
    const acomp = (await api("/qualidade/acompanhamento").catch(() => [])).filter((x) => x.primeira_resolvidas + x.depois_resolvidas > 0);
    const taxa = (n, t) => (t ? n / t : null);
    const pAcomp = !acomp.length ? "" : painel("FPD: 1º acompanhamento × depois do prazo", (() => { const u = acomp[acomp.length - 1], a = taxa(u.primeira_nao_ok, u.primeira_resolvidas), b = taxa(u.depois_nao_ok, u.depois_resolvidas); return leitura(`Nas vendas de <b>${mes(u.safra)}</b>, <b>${pct(a ?? 0, 0)}</b> dos clientes não pagaram no 1º acompanhamento. Depois do prazo, <b>${pct(b ?? 0, 0)}</b> continuam sem pagar: <b>${nf.format(u.pagaram_depois)}</b> cliente${u.pagaram_depois === 1 ? "" : "s"} ${u.pagaram_depois === 1 ? "pagou" : "pagaram"} depois de atrasar.`); })()
      + (acomp.length > 1 ? CH.linhas({ cats: acomp.map((x) => mes(x.safra)), series: [{ nome: "1º acompanhamento", cor: C.pend, valores: acomp.map((x) => taxa(x.primeira_nao_ok, x.primeira_resolvidas)) }, { nome: "Depois do prazo", cor: C.base, valores: acomp.map((x) => taxa(x.depois_nao_ok, x.depois_resolvidas)) }], rotuloY: "% que não pagou", fmt: (v) => pct(v, 0), ref: { v: 0.25, rotulo: "crítico acima de 25%" }, titulo: "FPD: 1º acompanhamento e depois do prazo" }) : "")
      + tabela([{ t: "Safra", f: (x) => `<b>${mes(x.safra)}</b>` }, { t: "1º acompanhamento", n: 1, f: (x) => pct(taxa(x.primeira_nao_ok, x.primeira_resolvidas) ?? 0, 0) + ` <span class="mut">(${nf.format(x.primeira_nao_ok)} de ${nf.format(x.primeira_resolvidas)})</span>` },
        { t: "Depois do prazo", n: 1, f: (x) => (x.depois_resolvidas ? pct(taxa(x.depois_nao_ok, x.depois_resolvidas), 0) + ` <span class="mut">(${nf.format(x.depois_nao_ok)} de ${nf.format(x.depois_resolvidas)})</span>` : "–") }, { t: "Pagaram depois de atrasar", n: 1, f: (x) => nf.format(x.pagaram_depois) }], acomp),
      "Vem da planilha de Qualidade (colunas FPD e DEPOIS DO PRAZO). Percentual sobre as faturas já resolvidas; quem ainda está no prazo não entra na conta.", "por mês da venda");
    const s = sit[0] || {}, safras = [...new Set(rec.map((r) => k(r.safra)))].sort();
    const d = maturo(fpd), sq = new Set(d.map((x) => k(x.safra))), so = [...sob].filter((x) => sq.has(k(x.safra))).sort((a, b) => String(a.safra).localeCompare(String(b.safra)));
    el.innerHTML = `${cabec("Qualidade (FPD)", "Faturas e FPD por safra (mês da venda).", S.acoes("ind-qualidade").map((a) => `<a class="btn" href="#/${esc(a.chave)}">${esc(a.nome)}</a>`).join(""))}
      <div class="kpis">${kpi("Faturas quitadas", nf.format(s.quitadas || 0))}${kpi("1ª fatura em aberto", nf.format(s.primeira_em_aberto || 0))}${kpi("2ª fatura em aberto", nf.format(s.segunda_em_aberto || 0))}</div>
      ${pAcomp}
      <div class="grade g2">${gFPD(fpd)}
      ${painel("Atrasados que acabaram pagando", leitura((() => { const u = d.filter((x) => x.pct_em_prazo <= 0.1).pop() || d[d.length - 1]; return u ? `Das primeiras faturas que atrasaram nas vendas de <b>${mes(u.safra)}</b>, <b>${pct(u.taxa_recuperacao || 0, 0)}</b> acabaram sendo pagas depois (${nf.format(u.recuperadas || 0)} faturas).` : ""; })()) + CH.linhas({ cats: d.map((x) => mes(x.safra)), series: [{ nome: "Recuperação", cor: C.base, valores: d.map((x) => x.taxa_recuperacao || 0) }], rotuloY: "% das faturas não pagas no prazo", fmt: (v) => pct(v, 0), titulo: "Recuperação", dicaExtra: (i) => [{ rot: nf.format(d[i].recuperadas) + " recuperadas", val: "" }] }), "Quanto maior, melhor: é cliente que atrasou mas pagou. Cada ponto é um mês de venda.", "por mês da venda")}
      ${painel("Clientes que continuam conectados", leitura(so.length ? `Dos clientes que compraram em <b>${mes(so[so.length - 1].safra)}</b>, <b>${pct(so[so.length - 1].pct_conectado, 0)}</b> continuam conectados hoje.` + (so.length > 1 ? ` Dos que compraram em ${mes(so[0].safra)}, ${pct(so[0].pct_conectado, 0)}.` : "") : "") + CH.linhas({ cats: so.map((x) => mes(x.safra)), series: [{ nome: "Conectados", cor: C.base, valores: so.map((x) => x.pct_conectado) }], rotuloY: "% conectados", fmt: (v) => pct(v, 0), titulo: "Sobrevivência das safras", dicaExtra: (i) => [{ rot: "de " + nf.format(so[i].contratos) + " contratos", val: "" }] }), "Quanto mais antigo o mês da venda, mais clientes já cancelaram: é normal a linha cair para a esquerda. Só meses cobertos pelas planilhas de qualidade.", "por mês da venda")}
      ${painel("Dinheiro em risco por 1ª fatura não paga", leitura((() => { const p = [...perda].sort((a, b) => (b.pacote_em_fpd_nao_ok || 0) - (a.pacote_em_fpd_nao_ok || 0))[0]; return p ? `O mês com mais dinheiro em risco é <b>${mes(p.safra)}</b>: <b>${brl(p.pacote_em_fpd_nao_ok)}</b> em mensalidades de clientes que não pagaram a 1ª fatura.` : ""; })()) + tabela([{ t: "Safra", f: (r) => mes(r.safra) }, { t: "Pacote em FPD não pago", n: 1, f: (r) => brl(r.pacote_em_fpd_nao_ok) }, { t: "Não recuperado", n: 1, f: (r) => brl(r.pacote_nao_recuperado) }], [...perda].sort((a, b) => String(b.safra).localeCompare(String(a.safra)))), "Pacote = soma das mensalidades dos contratos cujo cliente não pagou a 1ª fatura. Não recuperado = ainda não pagou.", "por mês da venda")}</div>
      ${painel("1ª fatura não paga, por vendedor", `<div class="filtros" style="border:0;padding:0 0 8px"><div class="campo" style="width:140px"><label>Safra</label><select id="sf">${safras.slice().reverse().map((m) => `<option value="${m}">${mes(m)}</option>`).join("")}</select></div></div><div id="fv"></div>`, "Do pior para o melhor. Em vermelho: acima de 25%, que é o limite. Só entram vendedores com faturas suficientes para o percentual ter valor.", "pior para melhor")}
      ${painel("1ª fatura não paga, por equipe", `<div id="fe"></div>`, "Mesmo mês escolhido acima. Do pior para o melhor; em vermelho, acima do limite de 25%.", "pior para melhor")}`;
    const dr = () => {
      const m = el.querySelector("#sf").value;
      const l = rec.filter((r) => r.dimensao === "VENDEDOR" && k(r.safra) === m && r.volume_suficiente).sort((a, b) => b.fpd_nao_ok_pct - a.fpd_nao_ok_pct).slice(0, 15);
      const le = rec.filter((r) => r.dimensao === "EQUIPE" && k(r.safra) === m && r.resolvidas > 0).sort((a, b) => b.fpd_nao_ok_pct - a.fpd_nao_ok_pct);
      el.querySelector("#fe").innerHTML = le.length ? tabela([{ t: "Equipe", f: (r) => esc(r.valor ? S.titulo(r.valor) : "sem equipe") }, { t: "Faturas resolvidas", n: 1, f: (r) => nf.format(r.resolvidas) }, { t: "FPD não pago", n: 1, f: (r) => pct(r.fpd_nao_ok_pct, 0) + CH.mini(r.fpd_nao_ok_pct, Math.max(...le.map((x) => x.fpd_nao_ok_pct), 0.25), { cor: r.fpd_nao_ok_pct > 0.25 ? C.ruim : C.base, w: 90 }) }], le) : `<p class="legenda-vazia">Sem faturas resolvidas nesta safra.</p>`;
      el.querySelector("#fv").innerHTML = l.length ? tabela([{ t: "Vendedor", f: (r) => esc(r.valor) }, { t: "Faturas resolvidas", n: 1, f: (r) => nf.format(r.resolvidas) }, { t: "FPD não pago", n: 1, f: (r) => pct(r.fpd_nao_ok_pct, 0) + CH.mini(r.fpd_nao_ok_pct, Math.max(...l.map((x) => x.fpd_nao_ok_pct), 0.25), { cor: r.fpd_nao_ok_pct > 0.25 ? C.ruim : C.base, w: 90 }) }], l) : `<p class="legenda-vazia">Nenhum vendedor com volume suficiente nesta safra.</p>`;
    };
    el.querySelector("#sf").addEventListener("change", dr); dr();
  };

  S.PAGES["ind-operacao"] = async (el) => {
    const [mot, ven, carga, parado] = await Promise.all(["pareto-motivos", "vencimento", "carga-backoffice", "vendedor-parado"].map(carregar));
    const ul = [...new Set(carga.map((r) => k(r.mes_venda)))].sort().at(-2) || null;
    el.innerHTML = `<div class="cab"><div><div class="migalha">Indicadores</div><h1>Operação</h1></div></div>
      ${faixaOperacao(mot, ven, parado)}
      <div class="grade g2">${gPareto(mot, 3)}
      ${painel("Em que dia do mês as faturas vencem", leitura((() => { const v = [...ven].filter((r) => r.dia_vencimento != null).sort((a, b) => b.contratos - a.contratos)[0]; return v ? `A maioria das faturas vence no dia <b>${v.dia_vencimento}</b>: ${nf.format(v.contratos)} contratos.` : ""; })()) + CH.linhas({ cats: [...ven].filter((r) => r.dia_vencimento != null).sort((a, b) => a.dia_vencimento - b.dia_vencimento).map((r) => "dia " + r.dia_vencimento), series: [{ nome: "Contratos", cor: C.base, valores: [...ven].filter((r) => r.dia_vencimento != null).sort((a, b) => a.dia_vencimento - b.dia_vencimento).map((r) => r.contratos) }], rotuloY: "Contratos", titulo: "Vencimentos" }), "Quantos contratos têm a fatura vencendo em cada dia. Dias muito cheios concentram a cobrança e o risco de atraso.", "todas as vendas")}
      ${painel("Quem do backoffice tratou mais contratos", (ul && carga.length ? leitura((() => { const c = carga.filter((r) => k(r.mes_venda) === ul).sort((a, b) => b.contratos_tratados - a.contratos_tratados)[0]; return c ? `Em ${mes(ul)}, <b>${esc(c.backoffice)}</b> tratou mais contratos: ${nf.format(c.contratos_tratados)}.` : ""; })()) : "") + (ul ? tabela([{ t: "Backoffice", f: (r) => esc(r.backoffice) }, { t: "Contratos tratados", n: 1, f: (r) => nf.format(r.contratos_tratados) + CH.mini(r.contratos_tratados, Math.max(...carga.filter((x) => k(x.mes_venda) === ul).map((x) => x.contratos_tratados), 1), { w: 110 }) }], carga.filter((r) => k(r.mes_venda) === ul).sort((a, b) => b.contratos_tratados - a.contratos_tratados).slice(0, 12)) : `<p class="legenda-vazia">Sem dados.</p>`), "Contratos lançados ou acompanhados por cada pessoa do backoffice no mês.", ul ? mes(ul) : "")}
      ${painel("Vendedores parados", leitura((() => { const p = parado.filter((r) => r.dias_sem_vender >= 7 && r.dias_sem_vender <= 90).sort((a, b) => b.dias_sem_vender - a.dias_sem_vender); return p.length ? `<b>${nf.format(p.length)}</b> vendedores estão entre 7 e 90 dias sem vender. O mais parado é <b>${esc(S.titulo(p[0].nome_completo))}</b>, há ${p[0].dias_sem_vender} dias.` : "Nenhum vendedor parado entre 7 e 90 dias."; })()) + tabela([{ t: "Vendedor", f: (r) => esc(S.titulo(r.nome_completo)) }, { t: "Última venda", f: (r) => S.dt(r.ultima_venda) }, { t: "Dias sem vender", n: 1, k: "dias_sem_vender" }], parado.filter((r) => r.dias_sem_vender >= 7 && r.dias_sem_vender <= 90).sort((a, b) => b.dias_sem_vender - a.dias_sem_vender).slice(0, 15)), "Quem já vendeu e ficou de 7 a 90 dias sem vender. Acima de 90 dias, o agente é tratado como desligado.", "7 a 90 dias")}</div>`;
  };

  S.PAGES["ind-pessoas"] = async (el) => {
    const semFpd = S.sessao.usuario.perfil === "backoffice";
    const [vend, quad, fp] = await Promise.all(semFpd ? [carregar("vendedor-mensal"), [], []] : ["vendedor-mensal", "quadrante", "fpd-safra"].map(carregar));
    const fmt0 = maturo(fp).filter((x) => x.pct_em_prazo <= 0.1).pop(), padrao = fmt0 ? k(fmt0.safra) : null;
    const meses = [...new Set(vend.map((r) => k(r.mes_venda)))].sort();
    el.innerHTML = `<div class="cab"><div><div class="migalha">Indicadores</div><h1>Vendedores</h1></div></div>
      <div class="filtros"><div class="campo" style="width:140px"><label>Mês</label><select id="rm">${meses.slice().reverse().map((m) => `<option value="${m}" ${m === padrao ? "selected" : ""}>${mes(m)}</option>`).join("")}</select></div></div>
      <div id="pk"></div><div class="grade g2"><div id="p1"></div><div id="p2"></div></div><div id="p3"></div>`;
    const f = () => {
      const m = el.querySelector("#rm").value;
      const doMes = vend.filter((r) => k(r.mes_venda) === m), sb = doMes.reduce((s, r) => s + (r.vendas_brutas || 0), 0), sa = doMes.reduce((s, r) => s + (r.vendas_ativas || 0), 0), sc = doMes.reduce((s, r) => s + (r.taxa_cancelamento || 0) * (r.vendas_brutas || 0), 0);
      el.querySelector("#pk").innerHTML = `<div class="kpis">${kpi("Vendedores com venda", nf.format(doMes.filter((r) => r.vendas_brutas > 0).length), "em " + mes(m))}${kpi("Vendas no mês", nf.format(sb), "contratos vendidos")}${kpi("Instaladas (com BL)", nf.format(sa), pct(sb ? sa / sb : null) + " das vendas")}${kpi("Cancelamento", pct(sb ? sc / sb : null), "sobre as vendas do mês")}${ehGestor() ? kpi("Receita instalada", brl(doMes.reduce((s, r) => s + (r.receita_ativa || 0), 0)), "soma do pacote das instaladas") : ""}</div>`;
      el.querySelector("#p1").innerHTML = painel("Quem mais instalou no mês", leitura((() => { const r = vend.filter((x) => k(x.mes_venda) === m && x.vendas_ativas > 0).sort((a, b) => b.vendas_ativas - a.vendas_ativas)[0]; return r ? `<b>${esc(r.vendedor_nome || r.vendedor_login)}</b> lidera ${mes(m)} com ${nf.format(r.vendas_ativas)} vendas instaladas (com banda larga).` : ""; })()) + ranking(vend, m, "vendas_ativas", 15), "Conta só vendas já instaladas e com banda larga, que é o que vale para a meta.", "15 primeiros");
      const pts = quad.filter((r) => k(r.mes_venda) === m && r.fpd_nao_ok_pct != null && r.vendas_ativas > 0);
      el.querySelector("#p2").innerHTML = semFpd ? painel("Cancelamento por vendedor", tabela([{ t: "Vendedor", f: (r) => esc(r.vendedor_nome) }, { t: "Vendas", n: 1, f: (r) => nf.format(r.vendas_brutas) }, { t: "% canceladas", n: 1, f: (r) => pct(r.taxa_cancelamento || 0, 0) + CH.mini(r.taxa_cancelamento || 0, 0.3, { cor: (r.taxa_cancelamento || 0) > 0.15 ? C.ruim : C.base, w: 90 }) }], vend.filter((r) => k(r.mes_venda) === m && r.vendas_brutas >= 5).sort((a, b) => b.taxa_cancelamento - a.taxa_cancelamento).slice(0, 15)), "Vendedores com 5+ vendas no mês.", "pior para melhor") : painel("Quem vende muito e quem gera calote", leitura(pts.length ? `Cada ponto é um vendedor. <b>${nf.format(pts.filter((r) => r.fpd_nao_ok_pct > 0.25).length)}</b> estão acima do limite de 25% de clientes que não pagaram a 1ª fatura.` : "") + (pts.length ? CH.dispersao({ pontos: pts.map((r) => ({ x: r.vendas_ativas, y: r.fpd_nao_ok_pct, rot: r.vendedor })), rotuloX: "Vendas ativas no mês", rotuloY: "% FPD não pago", fmtY: (v) => pct(v, 0), refY: 0.25, titulo: "Volume x qualidade por vendedor" }) : `<p class="legenda-vazia">Sem vendedores com faturas resolvidas nesta safra.</p>`), "Para a direita = vendeu mais. Para cima = mais clientes dele não pagaram a 1ª fatura. O bom é estar embaixo e à direita. A linha tracejada é o limite de 25%. Passe o mouse no ponto para ver o nome.", "vendas × 1ª fatura não paga");
      const t = vend.filter((r) => k(r.mes_venda) === m).sort((a, b) => b.vendas_brutas - a.vendas_brutas).slice(0, 40);
      el.querySelector("#p3").innerHTML = painel("Detalhe do mês", tabela([{ t: "Vendedor", k: "vendedor_nome" }, { t: "Equipe", k: "equipe" }, { t: "Vendas", n: 1, f: (r) => nf.format(r.vendas_brutas) + CH.mini(r.vendas_brutas, Math.max(...t.map((x) => x.vendas_brutas), 1), { w: 80 }) }, { t: "Instaladas", n: 1, k: "vendas_ativas" }, { t: "% cancel.", n: 1, f: (r) => pct(r.taxa_cancelamento) }, ...(ehGestor() ? [{ t: "Receita instalada", n: 1, f: (r) => brl(r.receita_ativa) }] : [])], t), "", "40 maiores");
    };
    el.querySelector("#rm").addEventListener("change", f); f();
  };

  S.PAGES["ind-geo"] = async (el) => {
    const geo = await carregar("geografia"), G = ehGestor();
    const UFN = { AC: "Acre", DF: "Distrito Federal", GO: "Goiás", MS: "Mato Grosso do Sul", MT: "Mato Grosso", RO: "Rondônia", AM: "Amazonas", TO: "Tocantins", SP: "São Paulo", MG: "Minas Gerais", PA: "Pará", BA: "Bahia", PR: "Paraná" };
    const cid = {}, uf = {};
    geo.forEach((r) => {
      const c = (cid[`${r.uf}|${r.cidade}`] ||= { rot: r.cidade, uf: r.uf, v: 0, c: 0, ra: 0, bairros: 0 }); c.v += r.vendas; c.c += (r.taxa_cancelamento || 0) * r.vendas; c.ra += r.receita_ativa || 0; if (r.bairro) c.bairros++;
      const u = (uf[r.uf || "–"] ||= { uf: r.uf || "–", v: 0, c: 0, cid: new Set() }); u.v += r.vendas; u.c += (r.taxa_cancelamento || 0) * r.vendas; u.cid.add(r.cidade);
    });
    const l = Object.values(cid).sort((a, b) => b.v - a.v), tot = l.reduce((s, x) => s + x.v, 0) || 1;
    const ufs = Object.values(uf).sort((a, b) => b.v - a.v);
    const taxa = l.filter((x) => x.v >= 30).map((x) => ({ rot: `${x.rot} (${x.uf})`, y: x.c / x.v, n: x.v })).sort((a, b) => b.y - a.y).slice(0, 12);
    const media = l.reduce((s, x) => s + x.c, 0) / tot;
    const bairros = geo.filter((r) => r.bairro).sort((a, b) => b.vendas - a.vendas).slice(0, 25), maxB = Math.max(1, ...bairros.map((b) => b.vendas));
    const cartaoUf = (u) => `<div class="kpi"><div class="kpi-topo"><div class="r">${esc(UFN[u.uf] || u.uf)}</div><span class="chip azul">${esc(u.uf)}</span></div><div class="v">${nf.format(u.v)}</div><div class="kpi-pe"><div class="d">${(u.v / tot * 100).toFixed(0)}% das vendas · ${u.cid.size} ${u.cid.size > 1 ? "cidades" : "cidade"} · cancel. ${pct(u.v ? u.c / u.v : null, 0)}</div></div></div>`;
    el.innerHTML = cabec("Geografia", `${nf.format(tot)} vendas em ${l.length} cidades de ${ufs.length} estados · todo o período importado`) +
      `<div class="kpis">${ufs.slice(0, 6).map(cartaoUf).join("")}</div>
      ${painel("Onde vendemos mais", leitura(l.length ? `<b>${esc(l[0].rot)} (${esc(l[0].uf)})</b> é a cidade que mais vende: ${nf.format(l[0].v)} contratos, ${pct(l[0].v / tot, 0)} do total.` : "") + CH.treemap({ titulo: "Vendas por cidade", rotulo: "Vendas", altura: 360, itens: l.slice(0, 24).map((x) => ({ rot: `${x.rot} · ${x.uf}`, y: x.v, sub: `Cancelamento ${pct(x.v ? x.c / x.v : null)}`, extra: [{ rot: "Cancelamento", val: pct(x.v ? x.c / x.v : null) }] })) }), "Cada quadrado é uma cidade: quanto maior e mais escuro, mais ela vende. Passe o mouse para ver os números.", "tamanho = vendas")}
      <div class="grade g2">${painel("Estados", leitura(ufs.length ? `<b>${esc(UFN[ufs[0].uf] || ufs[0].uf)}</b> concentra ${pct(ufs[0].v / tot, 0)} das vendas.` : "") + tabela([{ t: "Estado", f: (u) => esc(UFN[u.uf] || u.uf) }, { t: "Vendas", n: 1, f: (u) => nf.format(u.v) + CH.mini(u.v, ufs[0]?.v || 1, { w: 70 }) }, { t: "Participação", n: 1, f: (u) => pct(u.v / tot) }, { t: "Cidades", n: 1, f: (u) => nf.format(u.cid.size) }, { t: "% cancel.", n: 1, f: (u) => pct(u.v ? u.c / u.v : null) }], ufs), "", `${ufs.length} estados`)}
      ${painel("Onde mais se cancela", leitura(taxa.length ? `<b>${esc(taxa[0].rot)}</b> tem o maior cancelamento: ${pct(taxa[0].y, 0)} dos contratos. A média da empresa é ${pct(media, 0)}.` : "") + (taxa.length ? CH.barrasH({ dados: taxa.map((x) => ({ ...x, cor: x.y > media * 1.25 ? C.ruim : C.base })), fmt: (v) => pct(v, 0), rotuloX: "% de contratos cancelados", titulo: "Cancelamento por cidade", larguraRot: 210, ref: { v: media, rotulo: "média " + pct(media, 0) } }) : `<p class="legenda-vazia">Sem cidades com volume suficiente.</p>`), "Só cidades com 30 ou mais vendas. Em vermelho: bem acima da média da empresa (a linha tracejada).", "do maior para o menor")}</div>
      ${painel("Cidades", tabela([{ t: "Cidade", f: (x) => `<b>${esc(x.rot)}</b>` }, { t: "UF", k: "uf" }, { t: "Vendas", n: 1, f: (x) => nf.format(x.v) + CH.mini(x.v, l[0]?.v || 1) }, { t: "Participação", n: 1, f: (x) => pct(x.v / tot) }, { t: "% cancel.", n: 1, f: (x) => pct(x.v ? x.c / x.v : null) }, { t: "Bairros", n: 1, f: (x) => nf.format(x.bairros) }, ...(G ? [{ t: "Receita instalada", n: 1, f: (x) => brl(x.ra) }] : [])], l), "", `${l.length} cidades`)}
      ${painel("Bairros com mais vendas", tabela([{ t: "Bairro", f: (r) => `<b>${esc(r.bairro)}</b>` }, { t: "Cidade", f: (r) => esc(`${r.cidade} (${r.uf})`) }, { t: "Vendas", n: 1, f: (r) => nf.format(r.vendas) + CH.mini(r.vendas, maxB) }, { t: "% cancel.", n: 1, f: (r) => pct(r.taxa_cancelamento) }, ...(G ? [{ t: "Ticket médio", n: 1, f: (r) => brl(r.ticket_medio) }] : [])], bairros), "Bairros informados no cadastro da venda.", "25 maiores")}`;
  };

  /* ---------- Meu desempenho (vendedor) ---------- */
  S.PAGES.meu = async (el) => {
    const [rows, mm] = await Promise.all([api("/meu/desempenho"), api("/meu-mes").catch(() => null)]);
    const ms = rows.map((r) => ({ m: k(r.mes_venda), a: r.vendas_ativas, b: r.vendas_brutas, c: r.vendas_canceladas })).sort((a, b) => a.m.localeCompare(b.m));
    const eu = mm?.eu, nome = String(S.sessao.usuario.nome || "").split(" ")[0];
    const conMes = eu && eu.mes_vendas + eu.mes_canceladas ? eu.mes_conectadas / (eu.mes_vendas + eu.mes_canceladas) : null;
    const st = eu?.ritmo?.status, msg = !eu ? "" : !eu.meta_bl ? "Sua meta do mês ainda não foi cadastrada." : st === "ok" ? "Você está no ritmo para bater a meta. Continue assim!" : st === "alerta" ? "Está perto: um pouco mais por dia e a meta vem." : "Abaixo do ritmo da meta: veja quantas BL por dia útil faltam.";
    const rank = (p, rot) => p?.posicao ? `<div class="ini-posicao"><div class="med">${p.posicao}º<small> de ${p.de}</small></div><div><b>${esc(rot)}</b><div class="mut">média ${String(p.media_bl).replace(".", ",")} BL por pessoa · 1º lugar com ${p.lider_bl} BL</div></div></div>` : `<p class="mut">Sem vendas no mês ainda.</p>`;
    const APP = document.body.classList.contains("app-vendedor");
    const h = new Date().getHours(), oi = `${h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"}, ${nome}`;
    const SIT = { ok: "No ritmo da meta", alerta: "Atenção", ruim: "Abaixo do ritmo" };
    const diaUtil = mm ? `${mesExt(mm.mes.inicio)} · dia útil ${S.du(eu?.previsao?.dias_decorridos ?? mm.mes.uteis.decorridos)} de ${S.du(eu?.previsao?.dias_uteis ?? mm.mes.uteis.total)}` : "";
    /** Medidor em SVG (sem estilo inline): previsão em tom claro, realizado em azul e o traço de onde deveria estar hoje. */
    const medidor = (real, prev, meta, frac) => {
      const x = (v) => Math.max(0, Math.min(100, (v / meta) * 100)).toFixed(2);
      return `<svg class="ini-medidor" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><rect class="pista" width="100" height="10"/><rect class="p" width="${x(prev)}" height="10"/><rect class="r" width="${x(real)}" height="10"/>${frac != null ? `<rect class="hoje" x="${Math.min(99.4, frac * 100).toFixed(2)}" y="0" width=".6" height="10"/>` : ""}</svg>`;
    };
    // app do celular: mesmo desenho do protótipo do app (design/prototipos/direcao-a-app.html, "Início")
    const appTopo = (extra) => {
      const p = eu.previsao || {}, meta = eu.meta_bl || 0, real = eu.mes_bl || 0, faltam = Math.max(0, meta - real), nec = p.dias_restantes ? faltam / p.dias_restantes : null;
      const esperado = meta && p.dias_uteis ? Math.round((meta / p.dias_uteis) * p.dias_decorridos) : null;
      const dec = (v) => (v == null ? "–" : v.toFixed(1).replace(".", ","));
      const ST_APP = { ok: "ok", alerta: "atencao", ruim: "abaixo" };
      const it = (ico, cls, tit, txt, quando, href) => `<li><a href="${href}"><span class="ico ${cls}" aria-hidden="true">${ico}</span><div><b>${tit}</b><small>${txt}</small></div><time>${quando}<br><span class="chev" aria-hidden="true">›</span></time></a></li>`;
      const { av, crm, prem } = extra;
      const fazer = [
        av?.conexao?.avisos ? it("!", "hp", `${nf.format(av.conexao.avisos)} ${av.conexao.avisos === 1 ? "aviso" : "avisos"} em Conexão / Solar`, "Retorno do backoffice, mensagem nova ou prazo de HP", "agora", "#/vendaexterna") : "",
        av?.viabilidade?.respondidas ? it("✓", "viab", `${av.viabilidade.respondidas === 1 ? "Viabilidade respondida" : `${nf.format(av.viabilidade.respondidas)} viabilidades respondidas`}`, "Toque para ver a resposta do backoffice", "hoje", "#/viabilidade") : "",
        ...(crm || []).map((r) => it("☎", "crm", `Retorno agendado · ${new Date(r.data_hora).toTimeString().slice(0, 5)}`, esc([r.nome, r.observacao].filter(Boolean).join(" · ")), "hoje", "#/crm")),
      ].filter(Boolean);
      return `<div class="tela-inicio app-inicio">
        <div class="sec"><h3>Meu mês</h3><div class="bloco mes">
          <div class="rot">BL vendida${meta ? " · meta do plano" : ""}</div>
          <div class="val">${nf.format(real)} <small>${meta ? `de ${nf.format(meta)}` : "sem meta cadastrada"}</small></div>
          ${meta ? `<div class="medidor" aria-hidden="true"><i style="width:${Math.min(100, (real / meta) * 100).toFixed(1)}%"></i>${esperado != null ? `<u style="left:${Math.min(100, (esperado / meta) * 100).toFixed(1)}%"></u>` : ""}</div>
          <div class="leg"><span>${esperado != null ? `esperado até hoje: ${nf.format(esperado)}` : ""}</span><span>meta ${nf.format(meta)}</span></div>` : ""}
          ${meta && st ? `<div class="ini-st"><span class="st ${ST_APP[st]}">${SIT[st]} · projeção ${nf.format(p.bl || 0)}</span></div>` : ""}
          <div class="trio"><div><b>${!meta ? "–" : faltam ? dec(nec) : "✓"}</b><span>${!meta || faltam ? "BL por dia útil para a meta" : "meta batida"}</span></div><div><b>${nf.format(eu.mes_vendas)}</b><span>vendas válidas no mês</span></div>
            <div><b>${mm.equipe?.posicao ? `${mm.equipe.posicao}º de ${mm.equipe.de}` : "–"}</b><span>na equipe em BL</span></div></div></div></div>
        <div class="sec"><h3>Para fazer agora${fazer.length > 3 ? `<button type="button" class="ver-tudo" aria-expanded="false">Ver tudo (${fazer.length})</button>` : ""}</h3>${fazer.length ? `<ul class="bloco lista">${fazer.map((li, i) => (i < 3 ? li : li.replace("<li>", "<li hidden>"))).join("")}</ul>` : `<div class="bloco vazio-app">Nada pendente agora. Os avisos de viabilidade, Conexão/Solar e os retornos da agenda aparecem aqui.</div>`}</div>
        ${prem ? `<div class="sec"><h3>Premiação</h3><a class="bloco linha-simples" href="#/comissao"><div><b>Parcial de ${esc(mesExt(mm.mes.inicio).split(" de ")[0])}</b><small>Pelas vendas instaladas até hoje · regra do plano</small></div><span class="valor">${S.brl(prem.total)}</span></a></div>` : ""}
      </div>`;
    };
    if (APP && eu) {
      // topo do app: saudação, equipe e data, como no protótipo
      const tit = document.getElementById("app-t"), eq = eu.equipe || S.perfil?.equipe || "";
      const dataLonga = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).replace("-feira", "");
      if (tit) tit.innerHTML = `${esc(oi)}<span class="sub">${esc([eq ? eq.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : "", dataLonga].filter(Boolean).join(" · "))}</span>`;
      const hoje = new Date(), hojeIso = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
      const [av, crmMes, com] = await Promise.all([api("/avisos").catch(() => null), api(`/crm/mes?ano=${hoje.getFullYear()}&mes=${hoje.getMonth() + 1}&nocache=1`).catch(() => null), api("/comissao").catch(() => null)]);
      const crm = (crmMes?.itens || []).filter((r) => new Date(new Date(r.data_hora).getTime() - 3 * 3600e3).toISOString().slice(0, 10) === hojeIso)
        .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));   // todos os de hoje, pela hora: a lista mostra 3 e o resto em "Ver tudo"
      const prem = com?.plano && com.linhas?.length ? { total: com.linhas.reduce((s, l) => s + (l.total || 0), 0) } : null;
      el.innerHTML = appTopo({ av, crm, prem });
      el.querySelector(".ver-tudo")?.addEventListener("click", (e) => { el.querySelectorAll(".lista li[hidden]").forEach((li) => (li.hidden = false)); e.currentTarget.remove(); });
      return;
    }
    el.innerHTML = `<div class="tela-inicio">${cabec(oi, mm ? `${diaUtil}. ${esc(msg)}` : "")}` +
      (eu ? secao("Meu mês", "BL, vendas e previsão até o fim do mês", `<div class="kpis">${kpi("Vendas no mês", nf.format(eu.mes_vendas), `${nf.format(eu.vendas)} hoje · ${nf.format(eu.ontem)} ontem`, eu.dias.slice(0, mm.mes.dia_mes))}
        ${kpi("BL no mês", nf.format(eu.mes_bl), eu.meta_bl ? `meta ${nf.format(eu.meta_bl)} · ${eu.mes_bl_con} instaladas` : `${eu.mes_bl_con} instaladas`, null, eu.meta_bl ? { txt: S.ui.pct0(eu.mes_bl / eu.meta_bl), tom: st } : null)}
        ${kpi("Conectividade", pct(conMes, 0), `${eu.mes_conectadas} instaladas · ${eu.mes_canceladas} canceladas`)}
        ${kpi("Chips (migração/port.)", nf.format(eu.mes_chip_mp), eu.meta_chip ? `meta ${nf.format(eu.meta_chip)}` : "no mês")}</div>
      ${S.ui.previsao(eu, { titulo: "Sua previsão para o mês" })}`) +
      secao("Detalhes do mês", "Dia a dia, posição no ranking e o que foi vendido", `<div class="grade g2">${painel("Meu mês, dia a dia", CH.calor({ titulo: "Minhas vendas por dia", rotulo: "Vendas", mes: mm.mes.inicio.slice(0, 7), dias: diasCal(mm.mes.inicio, eu.dias, eu.feriados_mes || mm.mes.uteis.feriados) }), "Domingos e feriados da sua cidade ficam em cinza: não contam como dia útil.", "calendário")}
      ${painel("Minha posição em BL", `<div class="ini-ranks">${rank(mm.equipe, "na minha equipe")}${rank(mm.empresa, "na empresa toda")}</div>`, "Ranking pela quantidade de BL vendida no mês (canceladas não contam).", "mês atual")}
      ${painel("O que vendi no mês", CH.barrasH({ titulo: "Mix do mês", dados: [{ rot: "Banda larga (BL)", y: mm.mix.bl }, { rot: "TV", y: mm.mix.tv }, { rot: "Fone", y: mm.mix.fone }, { rot: "Chip novo", y: mm.mix.chip_nova }, { rot: "Chip migração/port.", y: mm.mix.chip_mp }, { rot: "Pagamento em DCC", y: mm.mix.dcc }], rotuloX: "Quantidade", larguraRot: 170 }), "Vendas válidas do mês (sem as canceladas).")}</div>`) : "") +
      secao("Histórico", "Minhas vendas e a conectividade, mês a mês", `<div class="grade g2">${painel("Minhas vendas por mês", CH.empilhadas({ cats: ms.map((m) => mes(m.m)), rotuloY: "Contratos", series: [{ nome: "Instaladas", cor: C.ok, valores: ms.map((m) => m.a) }, { nome: "Pendentes", cor: C.pend, valores: ms.map((m) => m.b - m.a - m.c) }, { nome: "Canceladas", cor: C.ruim, valores: ms.map((m) => m.c) }], titulo: "Minhas vendas" }))}
      ${painel("Conectividade por mês", CH.linhas({ cats: ms.map((m) => mes(m.m)), min: 0, max: 1, fmt: (v) => pct(v, 0), series: [{ nome: "Conectividade", cor: C.ok, valores: ms.map((m) => (m.b ? m.a / m.b : null)) }], titulo: "Conectividade" }), "Vendas instaladas sobre o total de vendas do mês.")}</div>`) + `</div>`;
  };

  /* Visão da equipe (supervisor, coordenador e gerente): ver pg_equipe.js */
})();
