"use strict";
/* Vitrine: operação depois do lançamento e equipe do dia.
   GET /confirmacao (routes_operacao.js), /pendencias e /sem-venda (routes_notificacoes.js + notificacoes.js), /produtividade (routes_relatorios.js). */
(() => {
  const V = window.VITRINE, D = window.DEMO, B = V.base;
  const NOMES = ["MARIA APARECIDA SOUZA", "JOSE CARLOS PEREIRA", "ANA PAULA RODRIGUES", "FRANCISCO DAS CHAGAS LIMA", "LUCIANA MENDES", "ANTONIO MARCOS SILVA", "PATRICIA GOMES", "RAIMUNDO NONATO COSTA",
    "JULIANA FERREIRA", "PEDRO HENRIQUE ALVES", "SANDRA REGINA DIAS", "MARCOS VINICIUS RAMOS"];
  const PRODS = ["Claro Internet 500 Mega", "Claro Internet 1 Giga + Claro TV+ Box", "Claro Internet 500 Mega + 2x Chip Controle", "Claro Internet 350 Mega"];
  const eqNome = (id) => B.equipes.find((e) => e.id === id)?.nome || "SAMAMBAIA";

  /* Confirmação D+1 (vendas de 23/10) e D+15 (vendas de 09/10), com algumas atrasadas */
  const RES = [null, "CONFIRMADO", "CONFIRMADO", "NAO_ATENDEU", null, "PROBLEMA", null, "CONFIRMADO"];
  const conf = (dia, n, base, atras) => {
    const item = (i, d, r) => {
      const v = B.vendedores[(base + i) % B.vendedores.length];
      return { id: 7000 + base + i, numero_contrato: String(61208400 + base * 3 + i), data_venda: d, status_venda: i % 4 === 3 ? "ATIVO" : "PENDENTE", status_contrato: null,
        data_agendamento: "2026-10-2" + (6 + (i % 3)), turno: i % 2 ? "12:00 AS 18:00" : "08:00 AS 12:00", pacote_valor: [149.9, 189.9, 99.9, 219.9][i % 4], forma_pagamento: i % 3 ? "BOLETO" : "DCC",
        cliente_id: 900 + base + i, cliente: NOMES[(base + i) % NOMES.length], contato: "(61) 9" + String(81234567 + i * 1111).slice(0, 4) + "-" + String(4321 + i * 7).slice(0, 4), contato_2: i % 3 ? null : "(61) 3355-0101",
        vendedor: v.nome.toUpperCase(), equipe: eqNome(v.equipe_id), cidade: "BRASÍLIA/DF", bairro: ["SAMAMBAIA SUL", "CEILÂNDIA NORTE", "TAGUATINGA", "RECANTO DAS EMAS"][i % 4], produtos: PRODS[i % 4],
        resultado: r, observacao: r === "PROBLEMA" ? "Cliente diz que o técnico não apareceu na data marcada" : r === "NAO_ATENDEU" ? "Caixa postal" : r ? "Dados conferidos" : null,
        feito_em: r ? "2026-10-24T10:1" + (i % 10) + ":00-03:00" : null, feito_por: r ? "Cláudia Nogueira" : null, tentativas: r === "NAO_ATENDEU" ? 2 : r ? 1 : 0 };
    };
    const itens = Array.from({ length: n }, (_, i) => item(i, dia, RES[i % RES.length]));
    const atrasadas = Array.from({ length: atras }, (_, i) => item(n + i, "2026-10-2" + (1 - i), i ? null : "NAO_ATENDEU"));
    const c = (r) => itens.filter((x) => x.resultado === r).length;
    return { dia_venda: dia, itens, atrasadas, cont: { total: n, confirmadas: c("CONFIRMADO"), problema: c("PROBLEMA"), nao_atendeu: c("NAO_ATENDEU"), falta: itens.filter((x) => x.resultado !== "CONFIRMADO" && x.resultado !== "PROBLEMA").length, atrasadas: atras } };
  };
  V.rota("GET", "/confirmacao", () => ({ dia: "2026-10-24", d1: { etapa: "D1", ...conf("2026-10-23", 11, 0, 2) }, d15: { etapa: "D15", ...conf("2026-10-09", 7, 20, 1) } }));

  /* Pendências: três abas, com contagem das abertas por tipo */
  const PEND = [
    ["PENDENCIA", "Documento do titular ilegível; pedir foto nova", 3], ["PENDENCIA", "Endereço sem número no cadastro da Claro", 1], ["PENDENCIA", "CPF com restrição; aguardando análise de crédito", 6],
    ["CHIP_PENDENTE", "Chip Controle entregue, aguardando ativação", 2], ["CHIP_PENDENTE", "Portabilidade agendada para 28/10", 0],
    ["CADASTRO_ANDAMENTO", "Proposta enviada no NETSALES, aguardando retorno", 1], ["CADASTRO_ANDAMENTO", "Biometria marcada", 0], ["PENDENCIA", "Cliente pediu troca do turno", 9, true],
  ];
  const pend = PEND.map(([tipo, desc, dias, resolvida], i) => {
    const v = B.vendedores[(i * 3) % B.vendedores.length];
    return { id: 300 + i, tipo, data_abertura: `2026-10-${String(24 - dias).padStart(2, "0")}`, cliente_nome: NOMES[(i + 4) % NOMES.length], proposta: tipo === "CADASTRO_ANDAMENTO" ? "PR-88" + (120 + i) : null,
      hp: i % 3 ? null : String(4410 + i), hora_biometria: desc === "Biometria marcada" ? "15:30" : null, descricao: desc, origem: "PAP", aberta: !resolvida, resolvida_em: resolvida ? "2026-10-23T16:00:00-03:00" : null,
      contrato_id: i % 2 ? 7000 + i : null, numero_contrato: i % 2 ? String(61208400 + i) : null, vendedor: v.nome.toUpperCase(), equipe: eqNome(v.equipe_id), dias };
  });
  V.rota("GET", "/pendencias", ({ query }) => {
    if (query.resumo) { const c = {}; pend.filter((p) => p.aberta).forEach((p) => (c[p.tipo] = (c[p.tipo] || 0) + 1)); return { contagem: c, mais_antiga: "2026-10-12" }; }
    const sit = query.situacao || "abertas", b = (query.busca || "").toLowerCase();
    const itens = pend.filter((p) => (!query.tipo || p.tipo === query.tipo) && (sit === "todas" || (sit === "resolvidas" ? !p.aberta : p.aberta))
      && (!b || (p.cliente_nome + p.descricao + p.vendedor).toLowerCase().includes(b)));
    const contagem = {}; pend.filter((p) => p.aberta).forEach((p) => (contagem[p.tipo] = (contagem[p.tipo] || 0) + 1));
    return { itens, contagem };
  });

  /* Sem venda hoje: por equipe, os vendedores do DEMO */
  V.rota("GET", "/sem-venda", () => {
    const equipes = D.equipes.map((e, k) => {
      const sem = (e.nome === "Samambaia" ? D.vendedoresSamambaia.filter((v) => v.diasSem).map((v) => v.nome) : Array.from({ length: e.semVenda }, (_, i) => `Vendedor ${i + 1} · ${e.nome}`))
        .map((nome, i) => ({ id: 400 + k * 20 + i, nome: nome.toUpperCase(), ultima_venda: `2026-10-${String(23 - ((i + k) % 4)).padStart(2, "0")}` }));
      return { equipe: e.nome.toUpperCase(), supervisor: (e.sup || "").toUpperCase(), total: e.hc, com_venda: e.hc - sem.length, vendas: e.hc - sem.length + (k % 3), sem };
    }).sort((a, b) => b.sem.length - a.sem.length || a.equipe.localeCompare(b.equipe));
    const total = equipes.reduce((s, g) => s + g.total, 0), sem = equipes.reduce((s, g) => s + g.sem.length, 0);
    return { dia: "2026-10-24", total, sem_venda: sem, com_venda: total - sem, vendas: equipes.reduce((s, g) => s + g.vendas, 0), equipes };
  });

  /* Produtividade por vendedor no período (padrão: hoje) */
  V.rota("GET", "/produtividade", ({ query }) => {
    const de = query.de || "2026-10-24", ate = query.ate || de;
    const dias = Math.round((new Date(ate) - new Date(de)) / 864e5) + 1, f = Math.min(1, dias / 20);
    const agentes = B.vendedores.filter((v) => !query.equipe || String(v.equipe_id) === String(query.equipe)).map((v, i) => {
      const vendas = dias === 1 ? (i % 4 === 3 ? 0 : 1 + (i % 3)) : Math.round((14 + (i * 7) % 15) * f), canc = Math.round(vendas * 0.08), ativas = Math.round((vendas - canc) * 0.55);
      const validas = vendas - canc, valor = +(validas * 176.4).toFixed(2);
      return { id: v.id, nome: v.nome.toUpperCase(), equipe: eqNome(v.equipe_id), vendas, validas, ativas, pendentes: validas - ativas, canceladas: canc, bl: Math.round(validas * 0.85), tv: Math.round(validas * 0.2),
        movel: Math.round(validas * 0.5), fone: i % 5 ? 0 : 1, valor, dias: Math.min(dias, vendas), aproveitamento: vendas ? +(ativas / vendas).toFixed(4) : null, media_dia: +(validas / dias).toFixed(2), ticket: validas ? +(valor / validas).toFixed(2) : null };
    }).sort((a, b) => b.validas - a.validas || a.nome.localeCompare(b.nome));
    const soma = (k) => agentes.reduce((s, a) => s + (a[k] || 0), 0);
    const total = { agentes: agentes.length, com_venda: agentes.filter((a) => a.vendas).length, sem_venda: agentes.filter((a) => !a.vendas).length, vendas: soma("vendas"), validas: soma("validas"),
      ativas: soma("ativas"), pendentes: soma("pendentes"), canceladas: soma("canceladas"), bl: soma("bl"), tv: soma("tv"), movel: soma("movel"), fone: soma("fone"), valor: +soma("valor").toFixed(2) };
    const por_dia = [];
    for (let t = new Date(de + "T12:00:00Z"), k = 0; t <= new Date(ate + "T12:00:00Z"); t = new Date(t.getTime() + 864e5), k++) {
      const d = t.toISOString().slice(0, 10), dom = t.getUTCDay() === 0;
      por_dia.push({ dia: d, ativas: dom ? 0 : 8 + (k % 5), pendentes: dom ? 0 : 10 + (k % 4), canceladas: dom ? 0 : 1 + (k % 3) });
    }
    const vd = query.vendedor ? B.vendedores.find((v) => String(v.id) === String(query.vendedor)) : null;
    const detalhe = vd ? D.vendasLista.slice(0, 6).map((x, i) => ({ id: 5000 + i, numero_contrato: x.contrato, data_venda: "2026-" + x.data.split("/").reverse().join("-"), status_venda: { inst: "ATIVO", pend: "PENDENTE", canc: "CANCELADO" }[x.st] || "PENDENTE",
      status_contrato: null, pacote_valor: 179.9, data_agendamento: "2026-10-27", cliente: x.cliente.toUpperCase(), cidade: "BRASÍLIA", produtos: PRODS[i % 4] })) : null;
    return { permissoes: { valores: V.pessoa.perfil !== "cadastro", fpd: V.pessoa.perfil !== "cadastro" }, de, ate, dias, total, agentes, por_dia,
      vendedores: B.vendedores.map((v) => ({ id: v.id, nome: v.nome.toUpperCase() })), equipes: B.equipes.map((e) => ({ id: e.id, nome: e.nome })), detalhe };
  });
})();

/* números ao lado das páginas no painel de páginas (GET /contagens, routes_notificacoes.js) */
window.VITRINE.rota("GET", "/contagens", () => ({ vendas: window.DEMO.empresa.vendas, equipe: window.DEMO.equipes.length, rota: 46, pendencias: 7, online: 10,
  ...(window.VITRINE.pessoa.perfil === "cadastro" ? {} : { semvenda: window.DEMO.empresa.semVenda }) }));
