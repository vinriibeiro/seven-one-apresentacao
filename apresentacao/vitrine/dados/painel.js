"use strict";
/* Vitrine: rotas do Painel (gerente e backoffice) e do Início do vendedor (pg_dash.js).
   Formatos como em api/src: /kpi/:nome (routes_dados.js), /fechamento (routes_relatorios.js + fechamento.js),
   /meu/:nome (routes_dados.js) e /meu-mes (routes_operacao.js). Números de window.DEMO (outubro de 2026). */
(() => {
  const V = window.VITRINE, D = window.DEMO, E = D.empresa, DU = D.DU, A = D.app;
  const MES = "2026-10-01", FERIADOS = ["2026-10-12"];
  const uteis = { total: DU.total, decorridos: DU.decorridos, restantes: DU.restantes, feriados: FERIADOS };
  const prevDe = (bl, validas, chips) => ({ bl: Math.round((bl / DU.decorridos) * DU.total), vendas: Math.round((validas / DU.decorridos) * DU.total), chips,
    dias_decorridos: DU.decorridos, dias_uteis: DU.total, dias_restantes: DU.restantes });
  const ritmoDe = (prev, meta) => ({ status: !meta ? null : prev / meta >= 1 ? "ok" : prev / meta >= 0.75 ? "alerta" : "ruim" });
  // vendas válidas por dia: a BL do dia do DEMO, na proporção válidas ÷ BL da empresa
  const diasEmp = D.dias.map((d) => (d.bl == null ? 0 : Math.round(d.bl * (E.validas / E.bl))));

  /* ---------- histórico (vendas-mensal): maio a outubro; outubro = DEMO.empresa ---------- */
  const HIST = [["2026-05", 1092, 846, 0, 141, 0.162, 0.0], ["2026-06", 1131, 878, 0, 139, 0.174, 0.0], ["2026-07", 1188, 921, 0, 153, 0.183, 0.0],
    ["2026-08", 1206, 917, 21, 164, 0.169, 0.03], ["2026-09", 1164, 812, 176, 158, 0.191, 0.28], ["2026-10", E.vendas, E.inst, E.pend, E.canc, null, null]];
  V.rota("GET", "/kpi/vendas-mensal", () => HIST.map(([m, b, a, p, c]) => ({ mes_venda: m + "-01", vendas_brutas: b, vendas_ativas: a, vendas_pendentes: p || b - a - c, vendas_canceladas: c, receita_ativa: a * 164.9, receita_contratada: b * 164.9 })));
  const TX_REC = [0.46, 0.43, 0.41, 0.37, 0.29];   // recuperação após o prazo, por safra (a mais recente ainda recuperando)
  V.rota("GET", "/kpi/fpd-safra", () => HIST.filter((h) => h[5] != null).map(([m, , a, , , f, prazo], j) => {
    const res = Math.round(a * 0.92), nok = Math.round(res * f), rec = Math.round(nok * TX_REC[j]);
    return { safra: m + "-01", fpd_ok: res - nok, fpd_nao_ok: nok, fpd_prazo: Math.round(a * prazo), fpd_nao_ok_pct: nok / res, pct_em_prazo: prazo, recuperadas: rec, taxa_recuperacao: Math.round((rec / nok) * 1e4) / 1e4 };
  }));
  V.rota("GET", "/kpi/dia-semana", () => [[1, 1310], [2, 1362], [3, 1298], [4, 1341], [5, 1287], [6, 702], [7, 41]].map(([dia_semana, vendas]) => ({ dia_semana, vendas })));
  const MOTIVOS = [["Cliente desistiu", 64], ["Sem viabilidade técnica", 41], ["Crédito reprovado", 33], ["Endereço não localizado", 22], ["Cliente ausente na instalação", 19], ["Duplicidade de venda", 9], ["Outros", 7]];
  V.rota("GET", "/kpi/pareto-motivos", () => ["2026-08", "2026-09", "2026-10"].flatMap((m, i) => MOTIVOS.map(([descricao, n]) => ({ mes_venda: m + "-01", descricao, contratos: Math.round(n * (0.8 + i * 0.1)) }))));
  // v_kpi_vendedor_mensal: maio a outubro (setembro e outubro com os mesmos números de antes)
  V.rota("GET", "/kpi/vendedor-mensal", () => {
    const rows = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"].flatMap((m, k) => V.base.vendedores.map((v, i) => {
      const j = k - 4, ativas = Math.max(2, 19 - i + ((((i * 7 + j * 3) % 5) + 5) % 5)), canc = 1 + ((i + k) % 3);
      const brutas = ativas + canc + Math.round(ativas * (k === 5 ? 0.55 : k === 4 ? 0.18 : 0.03));
      const eq = V.base.equipes.find((e) => e.id === v.equipe_id);
      return { mes_venda: m + "-01T00:00:00.000Z", vendedor_id: v.id, vendedor_login: V.base.login(v.nome), vendedor_nome: v.nome.toUpperCase(), equipe_id: v.equipe_id, equipe: eq ? eq.nome : null,
        vendas_brutas: brutas, vendas_ativas: ativas, bl_conectado: Math.round(ativas * 0.86), vendas_canceladas: canc, taxa_cancelamento: Math.round((canc / brutas) * 1e4) / 1e4,
        taxa_auditoria: Math.round((0.6 + (i % 4) * 0.08) * 1e4) / 1e4, receita_ativa: Math.round(ativas * (159.9 + (i % 5) * 6.5) * 100) / 100, participacao_pct: null };
    }));
    rows.forEach((r) => { const tot = rows.filter((x) => x.mes_venda === r.mes_venda).reduce((s, x) => s + x.vendas_ativas, 0); r.participacao_pct = Math.round((10000 * r.vendas_ativas) / tot) / 100; });
    return rows;
  });
  // v_kpi_geografia: uma linha por UF, cidade e bairro (todo o período)
  const GEO = [["DF", "BRASÍLIA", [["SAMAMBAIA SUL", 612], ["SAMAMBAIA NORTE", 488], ["CEILÂNDIA NORTE", 571], ["CEILÂNDIA SUL", 433], ["TAGUATINGA NORTE", 402], ["TAGUATINGA SUL", 296],
      ["ÁGUAS CLARAS", 318], ["RECANTO DAS EMAS", 377], ["RIACHO FUNDO II", 201], ["PLANO PILOTO", 164], ["LAGO SUL", 58], ["GUARÁ II", 143], ["SOL NASCENTE", 189], [null, 41]]],
    ["GO", "VALPARAÍSO DE GOIÁS", [["JARDIM ORIENTE", 233], ["PARQUE ESPLANADA III", 187], ["VALPARAÍSO I", 141], ["CHÁCARAS ANHANGUERA", 64]]],
    ["GO", "ÁGUAS LINDAS DE GOIÁS", [["JARDIM BRASÍLIA", 126], ["MANSÕES CAMARGO", 88], ["PARQUE DA BARRAGEM", 47]]],
    ["GO", "CIDADE OCIDENTAL", [["CENTRO", 39], ["PARQUE NÁPOLIS", 22]]], ["GO", "NOVO GAMA", [["LAGO AZUL", 31], ["PEDREGAL", 18]]], ["GO", "LUZIÂNIA", [["JARDIM INGÁ", 27]]]];
  V.rota("GET", "/kpi/geografia", () => GEO.flatMap(([uf, cidade, bs], c) => bs.map(([bairro, vendas], i) => {
    const tc = Math.round((0.085 + c * 0.018 + (i % 4) * 0.009) * 1e4) / 1e4, tk = Math.round((161.2 + (i % 5) * 4.7 - c * 2.1) * 100) / 100;
    return { uf, cidade, bairro, vendas, taxa_cancelamento: tc, ticket_medio: tk, receita_ativa: Math.round(vendas * 0.74 * tk * 100) / 100 };
  })));

  /* ---------- fechamento do dia (empresa e equipes) ---------- */
  // BL por dia de cada equipe: a curva da empresa (D.dias) na proporção da equipe, fechando exatamente no total dela
  const blPorDia = (bl) => { const tot = D.dias.reduce((s, d) => s + (d.bl || 0), 0) || 1; let ac = 0, ult = 0;
    const v = D.dias.map((d, i) => { const x = Math.round(((ac += d.bl || 0) / tot) * bl) - ult; ult += x; return d.bl == null ? 0 : x; }); return v; };
  V.rota("GET", "/fechamento", () => {
    const grupos = D.equipes.map((e, i) => {
      const prev = prevDe(e.bl, e.validas, Math.round(e.hc * 2.4));
      return { grupo: e.nome.toUpperCase(), hc: e.hc, sem_venda: e.semVenda, vendas: e.hc - e.semVenda + (i % 3), ontem: e.hc + 2, mes_vendas: e.validas, mes_bl: e.bl, mes_bl_con: Math.round(e.bl * 0.6),
        mes_bl_pend: e.bl - Math.round(e.bl * 0.6), mes_conectadas: e.inst, mes_canceladas: e.canc, meta_bl: e.meta, agendadas: 4 + (i % 4), instaladas: 2 + (i % 3), previsao: prev, ritmo: ritmoDe(prev.bl, e.meta), frac: DU.decorridos / DU.total, dias: [], dias_bl: blPorDia(e.bl) };
    });
    const soma = (k) => grupos.reduce((s, g) => s + g[k], 0);
    const prev = prevDe(E.bl, E.validas, soma("hc") * 2);
    const total = { vendas: soma("vendas"), ontem: soma("ontem"), mes_vendas: E.validas, mes_bl: E.bl, mes_bl_base: Math.round(E.bl * 0.09), mes_bl_prospect: E.bl - Math.round(E.bl * 0.09), mes_bl_con: soma("mes_bl_con"), mes_bl_pend: soma("mes_bl_pend"), mes_conectadas: E.inst,
      mes_canceladas: E.canc, meta_bl: E.meta, agendadas: soma("agendadas"), instaladas: soma("instaladas"), hc: E.hc, dias: diasEmp, dias_bl: D.dias.map((d) => d.bl ?? 0), previsao: prev, ritmo: ritmoDe(prev.bl, E.meta) };
    const serie = [];
    for (let d = 11; d <= 24; d++) { const v = diasEmp[d - 1]; serie.push({ dia: `2026-10-${String(d).padStart(2, "0")}`, conectadas: Math.round(v * 0.35), pendentes: v - Math.round(v * 0.35), canceladas: v ? 2 + (d % 3) : 0 }); }
    return { dia: "2026-10-24", ontem: "2026-10-23", agrupar: "equipe", rotulo: "Equipe", opcoes_agrupar: [{ k: "equipe", rot: "Equipe" }, { k: "cidade", rot: "Cidade" }, { k: "origem", rot: "Origem" }], mes: { inicio: MES, dia_mes: 24, dias_mes: 31, frac: 0.766, uteis }, plano: null, total, grupos, serie, destaques: { top: [], sem_venda: [], abaixo_ritmo: 0 } };
  });

  /* ---------- Início do vendedor ---------- */
  V.rota("GET", "/meu/desempenho", () => [["2026-05", 18, 15, 2], ["2026-06", 22, 18, 2], ["2026-07", 20, 17, 1], ["2026-08", 24, 19, 3], ["2026-09", 23, 16, 2], ["2026-10", A.vendas, A.inst, A.canc]]
    .map(([m, b, a, c]) => ({ mes_venda: m + "-01", vendas_brutas: b, vendas_ativas: a, vendas_canceladas: c })));
  V.rota("GET", "/meu-mes", () => {
    const dias = D.dias.map((d) => (d.bl == null ? 0 : [1, 0, 2, 1, 0, 1][d.d % 6]));
    const prev = prevDe(A.bl, A.vendas - A.canc, 9);
    return { mes: { inicio: MES, dia_mes: 24, dias_mes: 31, uteis },
      eu: { vendas: 2, ontem: 1, mes_vendas: A.vendas - A.canc, mes_bl: A.bl, mes_bl_con: 11, meta_bl: A.meta, meta_chip: 10, mes_chip_mp: 6, mes_conectadas: A.inst, mes_canceladas: A.canc,
        dias, feriados_mes: FERIADOS, previsao: prev, ritmo: ritmoDe(prev.bl, A.meta) },
      equipe: { posicao: A.posicao, de: A.equipeTam, media_bl: 14, lider_bl: 22 }, empresa: { posicao: 12, de: E.hc, media_bl: 13.8, lider_bl: 31 },
      mix: { bl: A.bl, tv: 6, fone: 3, chip_nova: 4, chip_mp: 6, dcc: 9 } };
  });
  /* Início do app: retornos da agenda de hoje (/crm/mes) e a premiação parcial (/comissao), com os números do protótipo */
  V.rota("GET", "/crm/mes", () => ({ itens: [{ id: 2, tipo: "VISITAR", data_hora: "2026-10-24T21:30:00Z", observacao: "levar proposta de TV", cliente_id: 4, nome: "Marcos Paulo Teixeira" }, { id: 1, tipo: "LIGAR", data_hora: "2026-10-24T19:00:00Z", observacao: "indicação do vizinho", cliente_id: 3, nome: "Sônia Aparecida Martins", telefone: "61991234567", status: "ATIVO", vendedor_id: 100, vendedor_nome: "Rafael Moura" }] }));
})();
