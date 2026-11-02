"use strict";
/* Vitrine: premiação (GET /comissao e /comissao/plano, routes_comissao.js + comissao.js), com os vendedores de Samambaia do DEMO. */
(() => {
  const V = window.VITRINE, D = window.DEMO;
  const plano = { mes: "2026-10-01", fpd_faixa: 0.25, fpd_inelegivel: 0.4, meses_so_faixa1: 3, fechado: false };
  const tab = { VENDEDOR: { BL: { faixa1: 12, faixa2: 16 }, TV: { faixa1: 8, faixa2: 10 }, CHIP: { faixa1: 4, faixa2: 5 } }, LIDER: { BL: { faixa1: 3, faixa2: 4 } } };
  const linha = (v, i) => {
    const chips = 2 + (i % 4), faixa = v.fpd == null || v.fpd <= 0.25 ? 2 : 1, u = faixa === 2 ? 16 : 12;
    const itens = [{ item: "BL", nome: "Banda larga instalada", qtd: v.inst, unit: u, valor: v.inst * u }, { item: "CHIP", nome: "Chip migração/portabilidade", qtd: chips, unit: 5, valor: chips * 5 }];
    const base = itens.reduce((s, x) => s + x.valor, 0), metaOk = v.bl >= 15 && chips >= 3;
    const bonus = [{ item: "BONUS_DCC", nome: "Bônus DCC", ok: metaOk, valor: metaOk ? 40 : 0, valor_tabela: 40 }, { item: "BONUS_META", nome: "Bônus meta de BL", ok: v.bl >= v.meta, valor: v.bl >= v.meta ? 60 : 0, valor_tabela: 60 }];
    const bonusTotal = bonus.reduce((s, b) => s + b.valor, 0), ajuste = i === 2 ? -20 : 0;
    return { usuario_id: 100 + i, nome: v.nome, papel: "VENDEDOR", equipe: "SAMAMBAIA", fpd: v.fpd, fpd_resolvidas: 14 + i, faixa, faixa_motivo: faixa === 2 ? `FPD ${((v.fpd || 0) * 100).toFixed(1)}% ≤ 25%` : `FPD ${(v.fpd * 100).toFixed(1)}% > 25%`,
      inelegivel: false, meta_bl: 15, meta_chip: 3, bl: v.bl, chips_mp: chips, meta_ok: metaOk, bloqueio: metaOk ? [] : [`meta mínima não batida (${v.bl}/15 BL, ${chips}/3 chips)`], itens, bonus, base, bonus_total: bonusTotal, ajuste,
      total: i === 0 ? D.app.premiacao : base + bonusTotal + ajuste, meses_casa: 6 + i, pap_ok: true, motivo: ajuste ? "Desconto de venda cancelada após o fechamento" : null, editavel: true, meta_bl_personalizada: null, meta_chip_personalizada: null };
  };
  const vendedores = D.vendedoresSamambaia.map(linha);
  const lider = { usuario_id: 21, nome: "Rodrigo Teles", papel: "LIDER", equipe: "SAMAMBAIA", fpd: 0.091, fpd_resolvidas: 120, faixa: 2, faixa_motivo: "FPD 9,1% ≤ 25%", inelegivel: false, meta_bl: 160, meta_chip: 0, bl: 112, chips_mp: 19, meta_ok: false,
    bloqueio: ["meta de BL não batida (112/160)"], itens: [{ item: "BL", nome: "BL instalada da equipe", qtd: 84, unit: 4, valor: 336 }], bonus: [], base: 336, bonus_total: 0, ajuste: 0, total: 336, meses_casa: 20, pap_ok: true, editavel: true };
  V.rota("GET", "/comissao", () => {
    const p = V.pessoa.perfil, linhas = p === "vendedor" ? vendedores.slice(0, 1) : p === "lider" ? [lider, ...vendedores] : [lider, ...vendedores];
    return { mes: "2026-10", plano, tabela: p === "vendedor" ? { VENDEDOR: tab.VENDEDOR } : tab, meses: [{ mes: "2026-10", fechado: false }, { mes: "2026-09", fechado: true }], linhas, parcial: true, congelado_em: null };
  });
  V.rota("GET", "/comissao/plano", () => ({ mes: "2026-10", sugerido: "2026-10", existe: true, plano, tabela: tab, meses: [{ mes: "2026-10", fechado: false }, { mes: "2026-09", fechado: true }], pessoas: [] }));
})();
