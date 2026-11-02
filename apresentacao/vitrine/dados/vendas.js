"use strict";
/* Vitrine: vendas. Lista (GET /contratos, routes_dados.js), detalhe (GET /contratos/:id, routes_vendas.js),
   observações do cliente (GET /clientes/:id/obs, routes_operacao.js) e busca de cliente (GET /clientes). */
(() => {
  const V = window.VITRINE, D = window.DEMO;
  const ST = { pend: "PENDENTE", inst: "ATIVO", canc: "CANCELADO" };
  const iso = (dm) => "2026-" + dm.split("/").reverse().join("-");
  const itens = D.vendasLista.map((v, i) => ({
    contrato_id: 5000 + i, numero_contrato: v.contrato, data_venda: iso(v.data), status_venda: ST[v.st], status_contrato: v.st === "inst" ? "CONECTADO" : null,
    origem: "PAP", pacote_valor: [149.9, 189.9, 99.9, 219.9][i % 4], cliente: v.cliente, vendedor: v.vendedor, cidade: "BRASÍLIA", uf: "DF", bairro: v.bairro,
    // v_meus_contratos / v_eq_contratos trazem também produtos, pagamento e motivo (e, desde a migração 50, cliente e agendamento)
    _app: { tem_bl: true, tem_tv: v.prods.includes("TV"), tem_movel: v.prods.some((p) => /chip/.test(p)), tem_multi: false, forma_pagamento: i % 2 ? "BOLETO" : "DCC", motivo: v.st === "canc" ? "CLIENTE DESISTIU" : null },
  }));
  // campos que a lista do gerente/backoffice traz (routes_dados.js): produtos "categoria|qtd|nome", agendamento, turno e motivo
  const prodTxt = (ps) => ps.map((p) => /chip/.test(p) ? `MOVEL|${parseInt(p)}|CLARO CONTROLE 25 GB` : p === "TV" ? "TV|1|CLARO TV+ BOX" : `VIRTUA|1|INTERNET ${p.toUpperCase()}`).join(";");
  const agenda = (t) => { const m = /(\d{2})\/(\d{2})/.exec(t); return m && !/instalada/.test(t) ? `2026-${m[2]}-${m[1]}` : /instalada (\d{2})\/(\d{2})/.test(t) ? t.replace(/.*instalada (\d{2})\/(\d{2}).*/, "2026-$2-$1") : null; };
  itens.forEach((r, i) => { const v = D.vendasLista[i]; Object.assign(r, { produtos: prodTxt(v.prods), data_agendamento: agenda(v.inst), turno: /tarde/.test(v.inst) ? "12:00 AS 18:00" : /manhã/.test(v.inst) ? "08:00 AS 12:00" : null, motivo: v.st === "canc" ? "CLIENTE DESISTIU" : null }); });
  V.rota("GET", "/contratos", ({ query, perfil }) => {
    const f = itens.filter((r) => (!query.status || r.status_venda === query.status) && (!query.busca || (r.cliente + r.numero_contrato).toLowerCase().includes(query.busca.toLowerCase())));
    const staff = ["gestor", "backoffice", "master", "administrador"].includes(perfil?.perfil || perfil);
    return { total: query.status || query.busca ? f.length : 142, pagina: Number(query.pagina || 1), contagem: { ATIVO: 84, PENDENTE: 47, CANCELADO: 11 },
      itens: f.map(({ _app, produtos, data_agendamento, turno, motivo, ...r }) => (staff ? { ...r, produtos, data_agendamento, turno, motivo } : { ...r, ..._app, data_agendamento, turno })) };
  });
  V.rota("GET", "/equipe/desempenho", () => V.base.vendedores.slice(0, 8).map((v) => ({ vendedor_id: v.id, vendedor_nome: v.nome })));

  /* detalhe: a venda do DEMO (contrato 61208457); as demais da lista usam o mesmo corpo com o próprio número e cliente */
  const W = D.venda, vend = V.base.vendedores.find((v) => v.nome === W.vendedor) || V.base.vendedores[0];
  const PROD = { "Internet 500 Mega": [2, "BL"], "Claro TV+ Box": [4, "TV"], "Chip Claro Controle 25 GB": [5, "MOVEL"] };
  V.rota("GET", "/contratos/:id", ({ params, perfil }) => {
    const l = itens.find((r) => r.contrato_id === Number(params.id)) || itens[5];
    const gestor = (perfil?.perfil || perfil) === "gestor";
    return {
      contrato: {
        id: l.contrato_id, numero_contrato: l.numero_contrato, data_venda: l.data_venda, status_venda: l.status_venda, status_contrato: l.status_contrato, motivo_id: l.status_venda === "CANCELADO" ? 5 : null,
        origem: W.origem, canal: "SOLAR", tipo_contrato: "PROSPECT", forma_pagamento: "DCC", dia_vencimento: W.vencimento, pacote_valor: W.pacote,
        cidade_id: 1, cidade_nome: "BRASÍLIA", uf: "DF", bairro: l.bairro.toUpperCase(), endereco: W.endereco.toUpperCase(), data_agendamento: "2026-10-26", turno: "08:00 AS 12:00",
        observacao: "Casa dos fundos, entrada pela rua lateral", cliente_id: 900 + l.contrato_id, vendedor_id: vend.id, equipe_id: 4,
        cliente_nome: l.cliente.toUpperCase(), tipo_pessoa: "CPF", documento: "02598224711", contato: "61998124410", contato_2: null, data_nascimento: "1988-03-14",
        vendedor_nome: l.vendedor, vendedor_login: V.base.login(l.vendedor), equipe_nome: "SAMAMBAIA", tipo_imovel: "CASA",
      },
      itens: W.produtos.map((p, i) => ({ id: 70 + i, produto_id: PROD[p.nome][0], quantidade: p.qtd, tipo_adesao: p.adesao ? p.adesao.toUpperCase() : null, categoria: PROD[p.nome][1], nome: p.nome.toUpperCase() })),
      historico: [
        { status_venda: "PENDENTE", status_contrato: null, motivo_id: null, usuario_id: 7, ocorrido_em: "2026-10-19T19:02:00Z" },
      ],
      faturas: gestor ? [{ numero: 1, vencimento: "2026-11-10", prazo_limite: "2026-12-10", valor: 189.9, data_pagamento: null, situacao: "EM_ABERTO" }] : null,
      // gerente e backoffice: confirmações D+1/D+15 e a rota (andamento e próximo passo)
      confirmacoes: gestor || /cadastro|qualidade/.test(perfil) ? [{ etapa: "D1", resultado: "CONFIRMADO", observacao: "Cliente confirmou endereço e horário.", feito_em: "2026-10-20T13:14:00Z", quem: "Juliana Castro" }] : null,
      rota: gestor || /cadastro|qualidade/.test(perfil) ? { data_rota: "2026-10-26", turno: "08:00 AS 12:00", situacao: "PENDENTE_INSTALACAO", confirmada: true, obs_agenda: "TUDO OK", quem: "Juliana Castro" } : null,
      alteracoes: gestor ? [
        { tabela: "contrato", acao: "UPDATE", antes: { data_agendamento: "2026-10-25" }, depois: { data_agendamento: "2026-10-26", turno: "08:00 AS 12:00" }, em: "2026-10-24T12:40:00Z", quem: "Juliana Castro" },
        { tabela: "contrato", acao: "INSERT", antes: null, depois: { status_venda: "PENDENTE", origem: "PAP", canal: "SOLAR" }, em: "2026-10-19T19:02:00Z", quem: "Juliana Castro" },
      ] : [],
    };
  });
  V.rota("GET", "/clientes/:id/obs", () => W.obs.map((o, i) => ({ id: 30 + i, texto: o.txt, em: "2026-10-24T12:40:00Z", contrato_id: 5005, numero_contrato: W.contrato, autor: o.por })));
  V.rota("POST", "/clientes/:id/obs", () => ({ ok: true }));
  V.rota("GET", "/clientes", () => []);
})();
