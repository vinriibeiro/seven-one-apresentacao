"use strict";
/* Vitrine: comparação das equipes (GET /painel-equipe, routes_relatorios.js + fechamento.js), com os números de window.DEMO. */
(() => {
  const V = window.VITRINE, D = window.DEMO, DU = D.DU;
  const st = (p) => (p >= 1 ? "ok" : p >= 0.75 ? "alerta" : "ruim");
  const ritmo = (prev, meta) => (meta ? { projecao: prev, pct: +(prev / meta).toFixed(3), status: st(prev / meta) } : null);
  const prevDe = (bl, vendas) => ({ bl: Math.round((bl / DU.decorridos) * DU.total), vendas: Math.round((vendas / DU.decorridos) * DU.total), chips: 0, dias_uteis: DU.total, dias_decorridos: DU.decorridos, dias_restantes: DU.restantes });
  const pessoa = (nome, i, e, bl, meta, vendas, inst, canc, fpd) => ({
    id: 300 + i, nome, equipe: e.nome.toUpperCase(), cidade: "BRASÍLIA", mes_vendas: vendas - canc, ant_vendas: vendas - 2, vendas: i % 3 ? 1 : 0, mes_matinal: Math.round(vendas / 2), mes_vespertina: vendas - Math.round(vendas / 2),
    mes_conectadas: inst, mes_canceladas: canc, conectividade: vendas ? inst / vendas : null, mes_bl: bl, mes_bl_con: Math.round(bl * 0.6), mes_bl_pend: bl - Math.round(bl * 0.6), meta_bl: meta, mes_chip_mp: i % 4, meta_chip: null,
    previsao: prevDe(bl, vendas - canc), ritmo: ritmo(prevDe(bl, vendas).bl, meta), fpd, fpd_resolvidas: 30, fpd_nao_ok: Math.round((fpd || 0) * 30), ticket: 179.9, dias_sem_venda: i % 5 === 4 ? 3 : 0, ultima_venda: "2026-10-24", frac: DU.decorridos / DU.total,
  });
  // BL por dia de cada equipe: a curva da empresa (D.dias) na proporção da equipe, fechando exatamente no total dela
  const blPorDia = (bl) => { const tot = D.dias.reduce((s, d) => s + (d.bl || 0), 0) || 1; let ac = 0, ult = 0;
    const v = D.dias.map((d, i) => { const x = Math.round(((ac += d.bl || 0) / tot) * bl) - ult; ult += x; return d.bl == null ? 0 : x; }); return v; };
  const grupos = D.equipes.map((e, k) => {
    const pessoas = e.nome === "Samambaia"
      ? D.vendedoresSamambaia.map((v, i) => pessoa(v.nome, k * 20 + i, e, v.bl, v.meta, v.vendas, v.inst, v.canc, v.fpd))
      : Array.from({ length: e.hc }, (_, i) => pessoa(`Vendedor ${i + 1} · ${e.nome}`, k * 20 + i, e, Math.round(e.bl / e.hc), Math.round(e.meta / e.hc), Math.round(e.vendas / e.hc), Math.round(e.inst / e.hc), Math.round(e.canc / e.hc), e.fpd));
    return { grupo: e.nome.toUpperCase(), nome: e.nome.toUpperCase(), hc: e.hc, sem_venda: e.semVenda, sem_venda_2d: Math.max(0, e.semVenda - 1), vendas: e.hc - e.semVenda, ant_vendas: e.validas - 9, mes_vendas: e.validas, mes_matinal: Math.round(e.validas / 2), mes_vespertina: e.validas - Math.round(e.validas / 2),
      mes_conectadas: e.inst, mes_canceladas: e.canc, conectividade: e.inst / e.vendas, mes_bl: e.bl, mes_bl_con: Math.round(e.bl * 0.6), mes_bl_pend: e.bl - Math.round(e.bl * 0.6), meta_bl: e.meta, mes_chip_mp: 12, meta_chip: null,
      previsao: { ...prevDe(e.bl, e.validas), bl: e.proj }, ritmo: ritmo(e.proj, e.meta), fpd: e.fpd, fpd_resolvidas: e.fpdBase, fpd_nao_ok: Math.round(e.fpd * e.fpdBase), ticket: 182.4, frac: DU.decorridos / DU.total, dias_bl: blPorDia(e.bl), pessoas };
  });
  const E = D.empresa;
  const total = { hc: E.hc, sem_venda: E.semVenda, sem_venda_2d: 9, vendas: E.hc - E.semVenda, ant_vendas: E.validas - 60, mes_vendas: E.validas, mes_matinal: 470, mes_vespertina: E.validas - 470, mes_conectadas: E.inst, mes_canceladas: E.canc,
    conectividade: E.inst / E.vendas, mes_bl: E.bl, mes_bl_con: Math.round(E.bl * 0.6), mes_bl_pend: E.bl - Math.round(E.bl * 0.6), meta_bl: E.meta, mes_chip_mp: 84, meta_chip: null, previsao: { ...prevDe(E.bl, E.validas), bl: E.proj }, ritmo: ritmo(E.proj, E.meta),
    fpd: E.fpd, fpd_resolvidas: E.fpdBase, fpd_nao_ok: Math.round(E.fpd * E.fpdBase), ticket: 181.2, cancelamento: E.canc / E.vendas, dias_bl: blPorDia(E.bl) };
  const serie = Array.from({ length: 14 }, (_, i) => { const d = 11 + i; return { dia: `2026-10-${String(d).padStart(2, "0")}`, conectadas: 20 + (i % 5), pendentes: 15 + (i % 4), canceladas: 2 + (i % 3) }; });
  V.rota("GET", "/painel-equipe", ({ query }) => {
    const g = query.equipe ? grupos.filter((x) => String(D.equipes.find((e) => e.nome.toUpperCase() === x.grupo)?.id) === String(query.equipe)) : V.pessoa.perfil === "lider" ? grupos.filter((x) => x.grupo === "SAMAMBAIA") : grupos;
    const t = g.length === 1 ? { ...g[0], cancelamento: g[0].mes_canceladas / (g[0].mes_vendas + g[0].mes_canceladas) } : total;
    return { competencia: "2026-10", dia: "2026-10-24", mes: { inicio: "2026-10-01", dia_mes: 24, dias_mes: 31, frac: DU.decorridos / DU.total, uteis: { total: DU.total, decorridos: DU.decorridos, restantes: DU.restantes, feriados: ["2026-10-12"] } },
      mes_anterior: { de: "2026-09-01", ate: "2026-09-24" }, total: t, grupos: g, equipes: D.equipes.map((e) => ({ id: e.id, nome: e.nome.toUpperCase() })), serie,
      destaques: { top: [], sem_venda: [], abaixo_ritmo: 2 }, fpd_safras: { de: "2026-07-01", ate: "2026-09-30" }, permissoes: { valores: V.pessoa.perfil !== "lider" } };
  });
})();
