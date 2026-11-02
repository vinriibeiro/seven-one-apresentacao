"use strict";
/* Vitrine: rotas das telas de Indicadores (Vendas, Qualidade, Operação, Vendedores) e do Lançamento de FPD.
   /kpi/:nome (routes_dados.js): a linha das views de db/03_views_kpi.sql, sem embrulho (array) e sem parâmetros.
   /qualidade/lotes (routes_qualidade.js): histórico de envios (qualidade_lote + enviado_por_nome).
   vendas-mensal, fpd-safra, dia-semana, pareto-motivos, vendedor-mensal e geografia ficam em dados/painel.js.
   Colunas date chegam como ISO à meia-noite UTC (o front usa os 10 primeiros caracteres); numeric e bigint como número. */
(() => {
  const V = window.VITRINE, D = window.DEMO, B = V.base, E = D.empresa;
  const dia = (s) => s + "T00:00:00.000Z";
  const r4 = (v) => Math.round(v * 1e4) / 1e4, r2 = (v) => Math.round(v * 100) / 100;
  const MESES = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
  const BRUTAS = [1092, 1131, 1188, 1206, 1164, E.vendas];   // mesmos totais de /kpi/vendas-mensal (painel.js)
  const eqNome = (id) => B.equipes.find((e) => e.id === id)?.nome || "SAMAMBAIA";

  /* ---------- Vendas: origem e canal, mix de produto ---------- */
  const OC = [["PAP", "NETSALES", 0.46, 0.07, 0.31], ["PAP", "SOLAR", 0.22, 0.09, 0.34], ["INDICAÇÃO", "NETSALES", 0.12, 0.04, 0.27], ["REDE SOCIAL", "NETSALES", 0.09, 0.13, 0.36],
    ["CARROSSEL", "SOLAR", 0.07, 0.11, 0.33], ["INDICAÇÃO", "SOLAR", 0.04, 0.05, 0.29]];
  V.rota("GET", "/kpi/origem-canal", () => MESES.flatMap((m, j) => OC.map(([origem, canal, part, canc, pend], i) => ({
    mes_venda: dia(m + "-01"), origem, canal, vendas: Math.round(BRUTAS[j] * part),
    taxa_cancelamento: r4(canc + ((i + j) % 3) * 0.006), taxa_pendencia: r4(j === 5 ? pend + 0.18 : j === 4 ? pend * 0.4 : 0.01 + (i % 2) * 0.005),
    ticket_medio: r2(158.4 + i * 6.3 + j * 1.1) }))));

  const MIX = [["VIRTUA", "500 MB", null, 0.38], ["VIRTUA", "350 MB", null, 0.21], ["VIRTUA", "1 GIGA", null, 0.17], ["VIRTUA", "250 MB", null, 0.06],
    ["TV", "CLARO TV+ BOX", null, 0.19], ["MOVEL", "CONTROLE 25 GB", "LINHA_NOVA", 0.14], ["MOVEL", "CONTROLE 25 GB", "PORTABILIDADE", 0.12], ["MOVEL", "PÓS 50 GB", "PORTABILIDADE", 0.05],
    ["MOVEL", "CONTROLE 15 GB", "MIGRACAO", 0.07], ["FONE", "ILIMITADO BRASIL TOTAL", null, 0.08], ["MESH", "WI-FI MESH", null, 0.06], ["MPLAY", "MPLAY", null, 0.03], ["PONTO_ADICIONAL", "PONTO ADICIONAL", null, 0.04]];
  V.rota("GET", "/kpi/mix-produto", () => MESES.flatMap((m, j) => MIX.map(([categoria, produto, tipo_adesao, part], i) => {
    const contratos = Math.round(BRUTAS[j] * part * (1 + (((i + j) % 4) - 1.5) * 0.03));
    return { mes_venda: dia(m + "-01"), categoria, produto, tipo_adesao, contratos, unidades: categoria === "MOVEL" ? Math.round(contratos * 1.6) : contratos };
  })));

  /* ---------- Qualidade: FPD por recorte, sobrevivência, faturas, perda ----------
     Safras de maio a setembro (abas da planilha de Qualidade); outubro ainda não tem 1ª fatura. Mesmas bases de /kpi/fpd-safra. */
  const SAFRAS = [["2026-05", 846, 0.162, 0], ["2026-06", 878, 0.174, 0], ["2026-07", 921, 0.183, 0], ["2026-08", 917, 0.169, 0.03], ["2026-09", 812, 0.191, 0.28]];
  const FPD_V = [0.071, 0.045, 0.088, 0.061, 0.125, 0.03, 0.143, 0.1, 0.18, 0.27, 0.12, 0.22, 0.31, 0.15, 0.09, 0.24, 0.19, 0.29, 0.14, 0.21];
  const ativasV = (i, j) => Math.max(2, 19 - i + ((((i * 7 + (j - 4) * 3) % 5) + 5) % 5));   // mesma conta de /kpi/vendedor-mensal
  const fpdVend = (i, j) => Math.max(0, Math.min(0.6, FPD_V[i % FPD_V.length] + (((i + j) % 5) - 2) * 0.015));
  const rec = [];
  SAFRAS.forEach(([m, , f, prazo], j) => {
    const safra = dia(m + "-01");
    const linha = (dimensao, valor, resolvidas, pct) => { const nao_ok = Math.round(resolvidas * pct); rec.push({ dimensao, valor, safra, resolvidas, nao_ok, fpd_nao_ok_pct: resolvidas ? r4(nao_ok / resolvidas) : null, volume_suficiente: resolvidas >= 30 }); };
    D.equipes.forEach((e, k) => linha("EQUIPE", e.nome.toUpperCase(), Math.round((e.fpdBase / 3) * (1 - prazo) * (0.94 + ((k + j) % 3) * 0.04)), Math.max(0.03, e.fpd + (((k + j) % 5) - 2) * 0.012 + (f - 0.176))));
    B.vendedores.forEach((v, i) => linha("VENDEDOR", B.login(v.nome), Math.round((ativasV(i, j) * 2.2 + 14) * (1 - prazo * 0.6)), fpdVend(i, j)));
    const res = Math.round(Math.round([846, 878, 921, 917, 812][j] * 0.92) * (1 - prazo));
    [["BRASÍLIA", 0.71, 0], ["VALPARAÍSO DE GOIÁS", 0.17, 0.06], ["ÁGUAS LINDAS DE GOIÁS", 0.12, 0.04]].forEach(([c, p, d]) => linha("CIDADE", c, Math.round(res * p), f + d - 0.01));
    [["BOLETO", 0.58, 0.07], ["DCC", 0.42, -0.09]].forEach(([c, p, d]) => linha("PAGAMENTO", c, Math.round(res * p), f + d));
    [["PAP", 0.66, 0.01], ["INDICAÇÃO", 0.16, -0.06], ["REDE SOCIAL", 0.1, 0.07], ["CARROSSEL", 0.08, 0.04]].forEach(([c, p, d]) => linha("ORIGEM", c, Math.round(res * p), f + d));
    [["350", 0.25, 0.03], ["500", 0.48, 0], ["1000", 0.2, -0.05]].forEach(([c, p, d]) => linha("PLANO_MB", c, Math.round(res * p), f + d));
  });
  V.rota("GET", "/kpi/fpd-recorte", () => rec);

  V.rota("GET", "/kpi/sobrevivencia", () => SAFRAS.map(([m, a], j) => ({
    safra: dia(m + "-01"), contratos: a, pct_conectado: [0.861, 0.879, 0.904, 0.932, 0.968][j], idade_media_dias: Math.round((new Date("2026-10-24") - new Date(m + "-15")) / 864e5) })));

  V.rota("GET", "/kpi/situacao-faturas", () => [{ quitadas: 6318, primeira_em_aberto: 412, segunda_em_aberto: 287, taxa_quitacao: 0.8741 }]);

  const TX_REC = [0.46, 0.43, 0.41, 0.37, 0.29];   // mesma recuperação de /kpi/fpd-safra (painel.js)
  V.rota("GET", "/kpi/perda-fpd", () => SAFRAS.map(([m, a, f], j) => {
    const nok = Math.round(Math.round(a * 0.92) * f), rec2 = Math.round(nok * TX_REC[j]);
    return { safra: dia(m + "-01"), pacote_em_fpd_nao_ok: r2(nok * (161.4 + j * 3.2)), pacote_nao_recuperado: r2((nok - rec2) * (160.9 + j * 3.1)) };
  }));

  /* ---------- Operação: vencimento, carga do backoffice, vendedores parados ---------- */
  V.rota("GET", "/kpi/vencimento", () => [[5, 0.12], [10, 0.31], [15, 0.22], [20, 0.18], [25, 0.11], [30, 0.06]].map(([dia_vencimento, p]) => {
    const contratos = Math.round(4820 * p);
    return { dia_vencimento, contratos, receita: r2(contratos * 166.4) };
  }).concat([{ dia_vencimento: null, contratos: 37, receita: 6105.3 }]));

  const BKO = [["juliana.castro", 0.27], ["claudia.nogueira", 0.24], ["roberta.siqueira", 0.19], ["marcelo.antunes", 0.16], ["tais.medeiros", 0.14]];
  V.rota("GET", "/kpi/carga-backoffice", () => MESES.flatMap((m, j) => BKO.map(([backoffice, p], i) => ({
    mes_venda: dia(m + "-01"), backoffice, contratos_tratados: Math.round(BRUTAS[j] * p), taxa_cancelamento: r4(0.11 + ((i + j) % 4) * 0.012) }))));

  const PARADOS = [["CLEBER AUGUSTO MOREIRA", 8], ["NATALIA SOARES PINHEIRO", 11], ["JEFFERSON LUIZ CAMPOS", 15], ["ROSANGELA MARIA FREITAS", 19], ["DOUGLAS HENRIQUE PAIVA", 26],
    ["BRUNA LETICIA AMARAL", 34], ["EDSON RIBEIRO MATOS", 47], ["KARINE OLIVEIRA DUTRA", 63], ["WESLEY FERNANDES BRAGA", 121], ["MICHELE COSTA ARAUJO", null]];
  const menos = (n) => new Date(Date.UTC(2026, 9, 24) - n * 864e5).toISOString().slice(0, 10);
  V.rota("GET", "/kpi/vendedor-parado", () => [
    ...B.vendedores.map((v, i) => { const n = (D.vendedoresSamambaia.find((x) => x.nome === v.nome)?.diasSem ?? (i % 3)); return { vendedor_id: v.id, login: B.login(v.nome), nome_completo: v.nome.toUpperCase(), ultima_venda: dia(menos(n)), dias_sem_vender: n }; }),
    ...PARADOS.map(([nome, n], i) => ({ vendedor_id: 160 + i, login: B.login(nome), nome_completo: nome, ultima_venda: n == null ? null : dia(menos(n)), dias_sem_vender: n })),
  ]);

  /* ---------- Vendedores: quadrante volume x qualidade (vendedor-mensal + fpd-recorte VENDEDOR) ---------- */
  V.rota("GET", "/kpi/quadrante", () => MESES.flatMap((m, j) => B.vendedores.map((v, i) => {
    const vendas_ativas = ativasV(i, j), r = rec.find((x) => x.dimensao === "VENDEDOR" && x.valor === B.login(v.nome) && x.safra.startsWith(m));
    const f = r ? r.fpd_nao_ok_pct : null;
    return { vendedor: B.login(v.nome), mes_venda: dia(m + "-01"), vendas_ativas, fpd_nao_ok_pct: f,
      quadrante: vendas_ativas >= 10 && (f || 0) <= 0.25 ? "ALTO VOLUME, BOA QUALIDADE" : vendas_ativas >= 10 ? "ALTO VOLUME, QUALIDADE RUIM" : (f || 0) <= 0.25 ? "BAIXO VOLUME, BOA QUALIDADE" : "BAIXO VOLUME, QUALIDADE RUIM" };
  })));

  /* ---------- Lançamento de FPD: histórico de envios ---------- */
  V.rota("GET", "/qualidade/lotes", () => [
    [14, "CONTROLE DE QUALIDADE - SET 26.xlsx", "ARQUIVO", "2026-10-22T18:41:00.000Z", 1164, 803, 6, "SET 26"],
    [13, "Manual · contrato 61207719", "MANUAL", "2026-10-20T13:12:00.000Z", 1, 1, 0, null],
    [12, "Manual · contrato 61206950", "MANUAL", "2026-10-16T19:57:00.000Z", 1, 1, 0, null],
    [11, "CONTROLE DE QUALIDADE - AGO 26.xlsx", "ARQUIVO", "2026-10-08T14:03:00.000Z", 2351, 911, 4, "AGO 26, SET 26"],
    [10, "CONTROLE DE QUALIDADE - AGO 26.xlsx", "ARQUIVO", "2026-09-17T12:26:00.000Z", 1206, 1188, 9, "AGO 26"],
    [9, "CONTROLE DE QUALIDADE - JUL 26.xlsx", "ARQUIVO", "2026-08-19T20:15:00.000Z", 1188, 1171, 11, "JUL 26"],
    [8, "qualidade_jun.csv", "ARQUIVO", "2026-07-21T15:40:00.000Z", 1131, 1124, 7, "qualidade_jun"],
  ].map(([id, arquivo_nome, origem, enviado_em, linhas, atualizadas, sem_contrato, abas], i) => ({
    id, arquivo_nome, origem, enviado_por: i % 3 === 1 ? 3 : 1, enviado_em, linhas, atualizadas, sem_contrato, abas, enviado_por_nome: i % 3 === 1 ? "SANDRA MOTA" : "VINÍCIUS RIBEIRO" })));
})();
