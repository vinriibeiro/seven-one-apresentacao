"use strict";
/* Vitrine: fechamento do dia (GET /fechamento, routes_relatorios.js + fechamento.js) com todos os campos de zero():
   dia, véspera e mês até o dia, por equipe e por pessoa. Carrega antes de painel.js, então vale também para o Painel. */
(() => {
  const V = window.VITRINE, D = window.DEMO, DU = D.DU, MES = "2026-10-01";
  const st = (p) => (p >= 1 ? "ok" : p >= 0.75 ? "alerta" : "ruim");
  const ritmo = (prev, meta) => (meta ? { projecao: prev, pct: +(prev / meta).toFixed(3), status: st(prev / meta) } : null);
  const prevDe = (bl, vendas, chips) => ({ bl: Math.round((bl / DU.decorridos) * DU.total), vendas: Math.round((vendas / DU.decorridos) * DU.total), chips: Math.round((chips / DU.decorridos) * DU.total),
    dias_uteis: DU.total, dias_decorridos: DU.decorridos, dias_restantes: DU.restantes });
  /** Campos do dia a partir do nº de vendas do dia (proporções coerentes com o resto da demonstração). */
  const dia = (n, k = 0) => {
    const can = n > 3 ? 1 : 0, con = Math.round((n - can) * 0.35), pen = n - can - con;
    return { vendas: n - can, conectadas: con, pendentes: pen, canceladas: can, v_total: (n - can) * 179.9, v_conectado: con * 179.9, v_pendente: pen * 179.9, v_perdido: can * 149.9,
      bl: Math.round((n - can) * 0.8), tv: Math.round(n * 0.25), movel: Math.round(n * 0.4), chip_nova: (k % 3), chip_mig: (k % 2), chip_port: n > 2 ? 1 : 0, fone: n > 4 ? 1 : 0, multi: 0,
      dcc: Math.round(n * 0.5), apt: Math.round(n * 0.3), netsales: Math.round(n * 0.6), solar: n - Math.round(n * 0.6) };
  };
  const mes = (o) => ({ mes_vendas: o.validas, mes_bl: o.bl, mes_bl_con: Math.round(o.bl * 0.6), mes_bl_pend: o.bl - Math.round(o.bl * 0.6), mes_chip_mp: o.chips, mes_chip_mp_con: Math.round(o.chips * 0.5),
    mes_conectadas: o.inst, mes_canceladas: o.canc, mes_valor: o.validas * 179.9 });
  const diasMes = (total) => D.dias.map((d) => (d.bl == null ? 0 : Math.round((d.bl / D.empresa.bl) * total)));
  let id = 500;
  const grupos = D.equipes.map((e, i) => {
    const hoje = e.hc - e.semVenda + (i % 3), chips = Math.round(e.hc * 2.4);
    const lista = e.nome === "Samambaia" ? D.vendedoresSamambaia : Array.from({ length: e.hc }, (_, k) => ({ nome: `Vendedor ${k + 1} · ${e.nome}`, bl: Math.round(e.bl / e.hc), meta: Math.round(e.meta / e.hc), vendas: Math.round(e.vendas / e.hc), inst: Math.round(e.inst / e.hc), canc: Math.round(e.canc / e.hc), diasSem: k < e.semVenda ? 1 : 0 }));
    const pessoas = lista.map((v, k) => {
      const n = v.diasSem ? 0 : 1 + ((k + i) % 3), ch = 1 + (k % 3), prev = prevDe(v.bl, v.vendas - v.canc, ch);
      return { id: id++, nome: v.nome, equipe: e.nome.toUpperCase(), cidade: e.nome === "Valparaíso de Goiás" ? "VALPARAÍSO DE GOIÁS" : "BRASÍLIA", ...dia(n, k), ontem: 1 + (k % 2),
        ...mes({ validas: v.vendas - v.canc, bl: v.bl, chips: ch, inst: v.inst, canc: v.canc }), dias: diasMes(v.vendas), meta_bl: v.meta, meta_chip: 3, uf: "DF", feriados_mes: ["2026-10-12"],
        previsao: prev, frac: DU.decorridos / DU.total, ritmo: ritmo(prev.bl, v.meta) };
    });
    const prev = { ...prevDe(e.bl, e.validas, chips), bl: e.proj };
    return { grupo: e.nome.toUpperCase(), ...dia(hoje, i), ontem: e.hc + 2, ...mes({ validas: e.validas, bl: e.bl, chips, inst: e.inst, canc: e.canc }), dias: diasMes(e.validas),
      pessoas, hc: e.hc, supervisor: (e.sup || "").toUpperCase() || null, sem_venda: e.semVenda, meta_bl: e.meta, meta_chip: e.hc * 3, previsao: prev, ritmo: ritmo(prev.bl, e.meta), frac: DU.decorridos / DU.total, agendadas: 4 + (i % 4), instaladas: 2 + (i % 3) };
  });
  const E = D.empresa, soma = (k) => grupos.reduce((s, g) => s + (g[k] || 0), 0);
  const CAMPOS = ["vendas", "conectadas", "pendentes", "canceladas", "v_total", "v_conectado", "v_pendente", "v_perdido", "bl", "tv", "movel", "chip_nova", "chip_mig", "chip_port", "fone", "multi", "dcc", "apt", "netsales", "solar", "agendadas", "instaladas", "ontem"];
  const prevE = { ...prevDe(E.bl, E.validas, soma("mes_chip_mp")), bl: E.proj };
  const total = { ...Object.fromEntries(CAMPOS.map((k) => [k, soma(k)])), ...mes({ validas: E.validas, bl: E.bl, chips: soma("mes_chip_mp"), inst: E.inst, canc: E.canc }),
    dias: D.dias.map((d) => (d.bl == null ? 0 : Math.round(d.bl * (E.validas / E.bl)))), dias_bl: D.dias.map((d) => d.bl ?? 0),
    hc: E.hc, com_venda: E.hc - E.semVenda, meta_bl: E.meta, meta_chip: soma("meta_chip"), previsao: prevE, ritmo: ritmo(prevE.bl, E.meta), frac: DU.decorridos / DU.total };
  const serie = Array.from({ length: 14 }, (_, k) => { const d = 11 + k, x = dia(Math.max(0, Math.round((D.dias[d - 1].bl || 0) * 1.2)), k); return { dia: `2026-10-${String(d).padStart(2, "0")}`, conectadas: x.conectadas, pendentes: x.pendentes, canceladas: x.canceladas }; });
  const todas = grupos.flatMap((g) => g.pessoas);
  const top = [...todas].sort((a, b) => b.vendas - a.vendas).slice(0, 3).map((p) => ({ nome: p.nome, equipe: p.equipe, vendas: p.vendas, bl: p.bl }));
  const semVenda = todas.filter((p) => !p.vendas).map((p) => ({ nome: p.nome, equipe: p.equipe }));
  V.rota("GET", "/fechamento", ({ query }) => {
    const ag = query.agrupar || "equipe";
    return { dia: "2026-10-24", ontem: "2026-10-23", agrupar: ag, rotulo: { equipe: "Equipe", cidade: "Cidade", vendedor: "Vendedor", lider: "Supervisor", coordenador: "Coordenador" }[ag] || "Equipe",
      opcoes_agrupar: [{ k: "equipe", rot: "Equipe" }, { k: "cidade", rot: "Cidade" }, { k: "vendedor", rot: "Vendedor" }, { k: "lider", rot: "Supervisor" }, { k: "coordenador", rot: "Coordenador" }],
      mes: { inicio: MES, dia_mes: 24, dias_mes: 31, frac: DU.decorridos / DU.total, uteis: { total: DU.total, decorridos: DU.decorridos, feriados: ["2026-10-12"] } }, plano: { mes: MES },
      total, grupos: query.equipe ? grupos.filter((g) => String(D.equipes.find((e) => e.nome.toUpperCase() === g.grupo)?.id) === String(query.equipe)) : grupos, serie,
      destaques: { top, sem_venda: semVenda, abaixo_ritmo: todas.filter((p) => p.ritmo?.status === "ruim").length },
      equipes: D.equipes.map((e) => ({ id: e.id, nome: e.nome.toUpperCase() })), cidades: [{ id: 1, nome: "BRASÍLIA" }, { id: 2, nome: "VALPARAÍSO DE GOIÁS" }],
      vendedores: todas.map((p) => ({ id: p.id, nome: p.nome })), permissoes: { valores: V.pessoa.perfil !== "lider" } };
  });
})();
