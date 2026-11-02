"use strict";
/* Vitrine: telas de Administração e Meu perfil.
   /agentes, /agentes/pedidos-senha e /equipes (routes_contas.js, view v_agentes_acesso), /feriados (routes_operacao.js + calendario.js),
   /atividade, /atividade/resumo, /atividade/pessoas e /acessos (routes_perfil.js), /notificacoes/estado (routes_notificacoes.js + notificacoes.js). */
(() => {
  const V = window.VITRINE, D = window.DEMO, B = V.base, P = V.PESSOAS;
  const up = (s) => String(s).toUpperCase();
  const mail = (n) => B.login(n) + "@exemplo.com.br";

  /* ---------- Usuários e acessos ---------- */
  const SUP = D.equipes.map((e, i) => ({ id: e.nome === "Samambaia" ? P.lider.id : 30 + i, nome: e.sup, equipe_id: e.id }));
  const pessoas = [
    { id: P.gestor.id, nome: P.gestor.nome, perfil: "gestor", funcoes: "GESTOR", vendas: 0, entrada: "2023-02-01", login: "2026-10-24T11:02:00.000Z" },
    { id: P.administrador.id, nome: P.administrador.nome, perfil: "administrador", funcoes: "GESTOR", vendas: 0, entrada: "2023-08-14", login: "2026-10-24T12:47:00.000Z" },
    { id: P.cadastro.id, nome: P.cadastro.nome, perfil: "backoffice", setor: "CADASTRO", funcoes: "BACKOFFICE", vendas: 0, entrada: "2024-03-04", login: "2026-10-24T11:15:00.000Z" },
    { id: 12, nome: "Cláudia Nogueira", perfil: "backoffice", setor: "CADASTRO", funcoes: "BACKOFFICE", vendas: 0, entrada: "2024-09-16", login: "2026-10-24T10:58:00.000Z" },
    { id: P.qualidade.id, nome: P.qualidade.nome, perfil: "backoffice", setor: "QUALIDADE", funcoes: "BACKOFFICE, COBRANCA", vendas: 0, entrada: "2024-05-20", login: "2026-10-23T19:31:00.000Z" },
    { id: P.coordenador.id, nome: P.coordenador.nome, perfil: "coordenador", funcoes: "COORDENADOR", vendas: 0, entrada: "2023-11-06", login: "2026-10-24T13:20:00.000Z" },
    ...SUP.map((s, i) => ({ id: s.id, nome: s.nome, perfil: "lider", funcoes: "LIDER, VENDEDOR", vendas: 41 + i * 17, equipe_id: s.equipe_id, entrada: `2024-0${1 + i}-1${i}`, login: `2026-10-2${4 - (i % 3)}T1${i}:05:00.000Z`, sem: i === 6 })),
    ...B.vendedores.map((v, i) => ({ id: v.id, nome: v.nome, perfil: "vendedor", funcoes: "VENDEDOR", vendas: 260 - i * 9 + (i % 4) * 5, equipe_id: v.equipe_id, entrada: `2025-${String(1 + (i % 12)).padStart(2, "0")}-0${1 + (i % 9)}`,
      login: i % 6 === 5 ? null : `2026-10-2${4 - (i % 4)}T1${i % 9}:2${i % 6}:00.000Z`, sem: i % 6 === 5, troca: i === 17 })),
    { id: 160, nome: "Cleber Augusto Moreira", perfil: "vendedor", funcoes: "VENDEDOR", vendas: 74, equipe_id: 6, entrada: "2025-04-07", login: "2026-10-16T12:10:00.000Z", bloqueado: true },
    { id: 168, nome: "Wesley Fernandes Braga", perfil: "vendedor", funcoes: "VENDEDOR", vendas: 38, equipe_id: 2, entrada: "2025-02-03", login: null, sem: true, desligado: true },
  ];
  const agentes = pessoas.map((p) => ({
    usuario_id: p.id, login: B.login(p.nome), nome_completo: up(p.nome), email: p.sem ? null : mail(p.nome), perfil_acesso: p.perfil, nivel_vendedor: p.perfil === "vendedor" ? (p.vendas > 200 ? "PULSE" : "START") : null,
    agente_ativo: !p.desligado, tem_acesso: !p.sem, acesso_ativo: !p.sem && !p.bloqueado, ultimo_login: p.sem ? null : p.login, deve_trocar_senha: p.sem ? null : !!p.troca,
    funcoes: p.funcoes, equipes: p.equipe_id ? B.equipes.find((e) => e.id === p.equipe_id).nome : null, total_vendas: p.vendas, equipe_id: p.equipe_id || null,
    data_entrada: p.entrada + "T00:00:00.000Z", setor: p.setor || null,
  })).sort((a, b) => b.total_vendas - a.total_vendas || a.nome_completo.localeCompare(b.nome_completo));
  V.rota("GET", "/agentes", ({ query }) => {
    const b = String(query.busca || "").trim().toLowerCase(), pg = Math.max(1, parseInt(query.pagina || "1", 10));
    const l = agentes.filter((a) => (!b || (a.nome_completo + a.login + (a.email || "")).toLowerCase().includes(b)) && (query.acesso !== "com" || a.tem_acesso) && (query.acesso !== "sem" || !a.tem_acesso));
    return { total: l.length, pagina: pg, itens: l.slice((pg - 1) * 50, pg * 50) };
  });
  V.rota("GET", "/agentes/pedidos-senha", () => [
    { usuario_id: B.vendedores[6].id, nome_completo: up(B.vendedores[6].nome), email: mail(B.vendedores[6].nome), pedido_em: "2026-10-24T12:38:00.000Z" },
    { usuario_id: B.vendedores[14].id, nome_completo: up(B.vendedores[14].nome), email: mail(B.vendedores[14].nome), pedido_em: "2026-10-23T22:05:00.000Z" },
  ]);
  V.rota("GET", "/equipes", () => B.equipes.map((e) => {
    const s = SUP.find((x) => x.equipe_id === e.id);
    return { id: e.id, nome: e.nome, ativa: true, lider_id: s.id, coordenador_id: P.coordenador.id, lider: up(s.nome), coordenador: up(P.coordenador.nome), membros: D.equipes.find((x) => x.id === e.id).hc };
  }).concat([{ id: 9, nome: "SOBRADINHO", ativa: false, lider_id: null, coordenador_id: null, lider: null, coordenador: null, membros: 0 }])
    .sort((a, b) => (b.ativa - a.ativa) || a.nome.localeCompare(b.nome)));

  /* ---------- Feriados: mesma conta de api/src/calendario.js ---------- */
  const p2 = (n) => String(n).padStart(2, "0"), ymd = (a, m, d) => `${a}-${p2(m)}-${p2(d)}`;
  const somaDias = (d, n) => new Date(new Date(d + "T12:00:00Z").getTime() + n * 864e5).toISOString().slice(0, 10);
  function pascoa(ano) {
    const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    return ymd(ano, Math.floor((h + l - 7 * m + 114) / 31), ((h + l - 7 * m + 114) % 31) + 1);
  }
  const nacionais = (ano) => [[1, 1, "Confraternização Universal"], [4, 21, "Tiradentes"], [5, 1, "Dia do Trabalho"], [9, 7, "Independência do Brasil"], [10, 12, "Nossa Senhora Aparecida"],
    [11, 2, "Finados"], [11, 15, "Proclamação da República"], [11, 20, "Consciência Negra"], [12, 25, "Natal"]].map(([m, d, nome]) => ({ data: ymd(ano, m, d), nome, abrangencia: "NACIONAL", considera: true }))
    .concat([{ data: somaDias(pascoa(ano), -2), nome: "Sexta-feira Santa", abrangencia: "NACIONAL", considera: true }]);
  const daRegiao = (r, reg) => r.abrangencia === "NACIONAL" || (r.abrangencia === "ESTADUAL" && reg?.uf && r.uf === reg.uf) || (r.abrangencia === "MUNICIPAL" && reg?.cidade_id && +r.cidade_id === +reg.cidade_id);
  function feriadosDoAno(ano, regras, regiao) {
    const out = new Map();
    for (const f of nacionais(ano)) out.set(f.data, f);
    for (const r of regras) {
      if (!daRegiao(r, regiao)) continue;
      const data = r.recorrente ? ymd(ano, r.mes, r.dia) : String(r.data).slice(0, 10);
      if (!data.startsWith(String(ano))) continue;
      const atual = out.get(data);
      if (!atual || (atual.considera === false && r.considera !== false)) out.set(data, { data, nome: r.nome, abrangencia: r.abrangencia, considera: r.considera !== false, id: r.id });
    }
    return [...out.values()].sort((a, b) => a.data.localeCompare(b.data));
  }
  function diasUteisMes(ano, mes, regras, regiao) {
    const fer = new Set(feriadosDoAno(ano, regras, regiao).filter((f) => f.considera).map((f) => f.data)), fim = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    let total = 0;
    for (let d = 1; d <= fim; d++) { const dow = new Date(Date.UTC(ano, mes - 1, d)).getUTCDay(); if (dow === 0 || fer.has(ymd(ano, mes, d))) continue; total += dow === 6 ? 0.5 : 1; }
    return Math.round(total * 2) / 2;
  }
  const CIDADES = [{ id: 1, nome: "BRASÍLIA", uf: "DF" }, { id: 3, nome: "ÁGUAS LINDAS DE GOIÁS", uf: "GO" }, { id: 2, nome: "VALPARAÍSO DE GOIÁS", uf: "GO" }];
  const regra = (id, nome, abrangencia, uf, cidade_id, dm, data, considera = true) => ({ id, nome, abrangencia, uf, cidade_id, recorrente: !data, dia: dm ? dm[0] : null, mes: dm ? dm[1] : null, data: data || null,
    considera, criado_em: "2026-03-02T13:10:00.000Z", cidade: cidade_id ? CIDADES.find((c) => c.id === cidade_id).nome : null });
  const REGRAS = [
    regra(10, "Carnaval (ponto facultativo)", "NACIONAL", null, null, null, "2026-02-16", false), regra(11, "Carnaval (ponto facultativo)", "NACIONAL", null, null, null, "2026-02-17", false),
    regra(1, "Aniversário de Brasília", "ESTADUAL", "DF", null, [21, 4]), regra(12, "Corpus Christi (ponto facultativo)", "NACIONAL", null, null, null, "2026-06-04", false),
    regra(14, "Aniversário de Valparaíso de Goiás", "MUNICIPAL", "GO", 2, [18, 4]), regra(15, "Aniversário de Águas Lindas de Goiás", "MUNICIPAL", "GO", 3, [27, 7]),
    regra(16, "Nossa Senhora D'Abadia (padroeira)", "MUNICIPAL", "GO", 2, [15, 8], null, false), regra(9, "Dia do Evangélico (DF)", "ESTADUAL", "DF", null, [30, 11]),
  ];
  V.rota("GET", "/feriados", ({ query }) => {
    const ano = /^\d{4}$/.test(query.ano || "") ? +query.ano : 2026;
    const cid = CIDADES.find((x) => String(x.id) === String(query.cidade_id)) || null, regiao = cid ? { uf: cid.uf, cidade_id: cid.id } : null;
    const calendario = feriadosDoAno(ano, REGRAS, regiao);
    const meses = Array.from({ length: 12 }, (_, i) => ({ mes: `${ano}-${p2(i + 1)}`, dias_uteis: diasUteisMes(ano, i + 1, REGRAS, regiao) }));
    return { ano, regiao: cid, regras: REGRAS, cidades: CIDADES, calendario, meses };
  });

  /* ---------- Central de alterações e histórico do perfil ---------- */
  const QUEM = [[P.cadastro.id, P.cadastro.nome, 0.34], [12, "Cláudia Nogueira", 0.27], [P.gestor.id, P.gestor.nome, 0.12], [P.administrador.id, P.administrador.nome, 0.08],
    [P.qualidade.id, P.qualidade.nome, 0.06], [P.lider.id, P.lider.nome, 0.05], [P.coordenador.id, P.coordenador.nome, 0.03], [null, "Sistema / carga", 0.05]];
  const NOMES = ["MARIA APARECIDA SOUZA", "JOSE CARLOS PEREIRA", "ANA PAULA RODRIGUES", "FRANCISCO DAS CHAGAS LIMA", "LUCIANA MENDES", "ANTONIO MARCOS SILVA", "PATRICIA GOMES", "RAIMUNDO NONATO COSTA"];
  const MODELOS = [
    ["contrato", "UPDATE", [["Situação da venda", "PENDENTE", "INSTALADA"]]], ["agenda_instalacao", "UPDATE", [["Situação da rota", "PENDENTE_INSTALACAO", "INSTALADO"], ["Confirmação", "não", "sim"]]],
    ["contrato", "INSERT", []], ["contrato_item", "INSERT", [["Produto", null, "500 MB"], ["Quantidade", null, "1"]]], ["cliente", "UPDATE", [["Telefone", "(61) 99812-3344", "(61) 98145-7720"]]],
    ["contrato", "UPDATE", [["Agendamento", "26/10/2026", "28/10/2026"], ["Turno", "08:00 AS 12:00", "12:00 AS 18:00"]]], ["confirmacao_venda", "INSERT", []],
    ["contrato", "UPDATE", [["Situação da venda", "PENDENTE", "CANCELADA"], ["Motivo", "vazio", "CLIENTE DESISTIU"]]], ["viabilidade", "UPDATE", [["status", "PENDENTE", "ATENDE"]]],
    ["usuario", "UPDATE", [["Perfil", "vendedor", "lider"]]], ["equipe_membro", "INSERT", [["Equipe", null, "SAMAMBAIA"], ["Início", null, "20/10/2026"]]], ["contrato_item", "DELETE", [["Produto", null, "CLARO TV+ BOX"], ["Quantidade", null, "1"]]],
    ["cliente_observacao", "INSERT", []], ["contrato", "UPDATE", [["Valor do pacote", "R$ 149,90", "R$ 189,90"]]],
  ];
  const ROT = { cliente: "Cliente", contrato: "Venda", contrato_item: "Produto da venda", agenda_instalacao: "Rota", usuario: "Usuário", equipe_membro: "Equipe do colaborador", viabilidade: "Viabilidade", confirmacao_venda: "Confirmação D-1/D-15", cliente_observacao: "Observação do cliente" };
  const quemDe = (i) => { const x = (i * 37) % 100 / 100; let s = 0; for (const q of QUEM) { s += q[2]; if (x < s) return q; } return QUEM[0]; };
  const LOG = Array.from({ length: 120 }, (_, i) => {
    const [tabela, acao, cs] = MODELOS[(i * 5) % MODELOS.length], [uid, nome] = quemDe(i), em = new Date(Date.UTC(2026, 9, 24, 17, 18) - i * (47 + (i % 7) * 23) * 6e4);
    const contrato = ["contrato", "contrato_item", "agenda_instalacao", "confirmacao_venda"].includes(tabela) ? 7000 + ((i * 13) % 60) : null;
    const alvo = contrato ? String(61208400 + ((i * 13) % 60)) : tabela === "cliente" || tabela === "cliente_observacao" ? NOMES[i % NOMES.length] : tabela === "usuario" || tabela === "equipe_membro" ? up(B.vendedores[i % B.vendedores.length].nome) : `#${300 + i}`;
    return { id: 98400 - i, em: em.toISOString(), quem: nome === "Sistema / carga" ? nome : up(nome), usuario_id: uid, tabela: ROT[tabela], tabela_cod: tabela, acao,
      resumo: { INSERT: "criou", UPDATE: "alterou", DELETE: "apagou" }[acao], campos: cs.map(([campo, de, para]) => (acao === "UPDATE" ? { campo, de, para } : { campo, para })), contrato_id: contrato, alvo };
  });
  const filtrar = (q, perfil) => LOG.filter((l) => (perfil === "gestor" || perfil === "master" ? !q.usuario || String(l.usuario_id) === String(q.usuario) : l.usuario_id === V.pessoa.id)
    && (!q.tabela || l.tabela_cod === q.tabela) && (!q.acao || l.acao === q.acao) && (!q.de || l.em.slice(0, 10) >= q.de) && (!q.ate || l.em.slice(0, 10) <= q.ate)
    && (!q.q || l.alvo.toLowerCase().includes(String(q.q).toLowerCase())));
  const ESCALA = 11;   // o log fictício tem 120 linhas; os totais representam ~30 dias de uso
  V.rota("GET", "/atividade", ({ query, perfil }) => {
    const l = filtrar(query, perfil), pg = Math.max(1, parseInt(query.pagina || "1", 10));
    const gestor = V.pessoa.perfil === "gestor" || V.pessoa.perfil === "master" || V.pessoa.perfil === "administrador";
    return { total: l.length * ESCALA, pagina: pg, tam: 40, escopo: gestor ? "todos" : "proprio", itens: l.slice(((pg - 1) * 40) % l.length, ((pg - 1) * 40) % l.length + 40) };
  });
  V.rota("GET", "/atividade/resumo", ({ query }) => {
    const l = filtrar(query, "gestor"), n = (a) => l.filter((x) => x.acao === a).length * ESCALA;
    const fim = query.ate || "2026-10-24", ini = query.de || somaDias(fim, -29), por_dia = [];
    for (let d = ini, k = 0; d <= fim && k < 90; d = somaDias(d, 1), k++) {
      const dom = new Date(d + "T12:00:00Z").getUTCDay() === 0, f = dom ? 0.05 : 1 + ((k * 7) % 5) * 0.12;
      por_dia.push({ dia: d, criou: Math.round(14 * f), alterou: Math.round(27 * f), apagou: dom ? 0 : (k % 4 === 1 ? 1 : 0) });
    }
    const pp = {}; l.forEach((x) => { const p = (pp[x.quem] ||= { quem: x.quem, usuario_id: x.usuario_id, n: 0, apagou: 0 }); p.n += ESCALA; if (x.acao === "DELETE") p.apagou += ESCALA; });
    const pt = {}; l.forEach((x) => (pt[x.tabela_cod] = (pt[x.tabela_cod] || 0) + ESCALA));
    const uid = parseInt(query.usuario || "", 10), a = uid ? agentes.find((x) => x.usuario_id === uid) : null;
    return {
      totais: { total: l.length * ESCALA, criou: n("INSERT"), alterou: n("UPDATE"), apagou: n("DELETE"), pessoas: new Set(l.map((x) => x.usuario_id)).size, primeira: l.length ? l[l.length - 1].em : null, ultima: l.length ? l[0].em : null },
      por_dia, por_pessoa: Object.values(pp).sort((x, y) => y.n - x.n).slice(0, 10), por_tabela: Object.entries(pt).map(([tabela, n]) => ({ tabela, n, rotulo: ROT[tabela] || tabela })).sort((x, y) => y.n - x.n),
      pessoa: a ? { id: a.usuario_id, nome_completo: a.nome_completo, login: a.login, email: a.email, perfil_acesso: a.perfil_acesso, ativo: a.agente_ativo, ultimo_login: a.ultimo_login, foto: null, equipe: a.equipes, logins: 212 } : null,
    };
  });
  V.rota("GET", "/atividade/pessoas", () => QUEM.filter((q) => q[0] != null).map(([id, nome]) => ({ id, nome: up(nome) })).sort((a, b) => a.nome.localeCompare(b.nome)));
  const EV = [["LOGIN_OK", B.vendedores[0].nome, null, null], ["LOGIN_OK", P.cadastro.nome, null, null], ["LOGIN_FALHOU", B.vendedores[6].nome, null, "senha incorreta"], ["SENHA_REDEFINIDA", B.vendedores[17].nome, P.gestor.nome, null],
    ["LOGIN_OK", P.lider.nome, null, null], ["CRIADA", B.vendedores[17].nome, P.gestor.nome, "perfil=vendedor"], ["PERFIL_ALTERADO", "Cláudia Nogueira", P.administrador.nome, "perfil=backoffice setor=CADASTRO"],
    ["BLOQUEADA", "Cleber Augusto Moreira", null, "5 tentativas erradas"], ["LOGIN_OK", P.gestor.nome, null, null], ["DESATIVADA", "Wesley Fernandes Braga", P.gestor.nome, null]];
  V.rota("GET", "/acessos", () => EV.map(([acao, pessoa, feito, detalhe], i) => ({ em: new Date(Date.UTC(2026, 9, 24, 17, 5) - i * 97 * 6e4).toISOString(), acao, detalhe, pessoa: up(pessoa), feito_por: feito ? up(feito) : null })));

  /* ---------- Notificações no celular (Meu perfil) ---------- */
  const estado = () => ({ nova_venda: true, relatorio: true, aparelhos: 1, este_aparelho: false, horarios: ["12:00", "17:00"] });
  V.rota("GET", "/notificacoes/estado", estado);
  V.rota("GET", "/notificacoes/equipe/estado", estado);
})();
