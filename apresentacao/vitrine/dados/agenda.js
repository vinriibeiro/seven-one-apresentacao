"use strict";
/* Vitrine: rota de instalação (GET /rota e /rota/resumo, routes_rota.js), com as vendas pendentes do DEMO. */
(() => {
  const V = window.VITRINE, D = window.DEMO;
  const turnos = ["08:00 AS 12:00", "12:00 AS 15:00", "15:00 AS 18:00"];
  const SIT = ["PENDENTE_INSTALACAO", "PENDENTE_INSTALACAO", "INSTALADO", "PENDENTE_INSTALACAO", "CLIENTE_AUSENTE", "INSTALADO"];
  const linhas = D.vendasLista.concat(D.vendasLista).slice(0, 12).map((v, i) => ({
    agenda_id: 700 + i, contrato_id: 5000 + (i % 10), numero_contrato: String(61214503 - i * 37), data_rota: "2026-10-24", turno: turnos[i % 3], situacao: SIT[i % 6], confirmada: i % 4 !== 1 ? true : null,
    obs_agenda: i % 4 === 1 ? "SEM CONFIRMAÇÃO" : "TUDO OK", cliente: v.cliente.toUpperCase(), telefone: "6199812" + String(4410 + i), endereco: "QR 403 CONJUNTO " + (i + 2) + " CASA " + (i + 5), bairro: v.bairro.toUpperCase(),
    cidade: "BRASÍLIA", vendedor: v.vendedor, equipe: "SAMAMBAIA", atualizada_em: "2026-10-24T12:40:00Z", atualizada_por_nome: "Juliana Castro" }));
  V.rota("GET", "/rota", () => linhas);
  V.rota("GET", "/rota/resumo", () => ({ dias: ["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-26", "2026-10-27"].flatMap((d, k) => [{ data_rota: d, situacao: "PENDENTE_INSTALACAO", n: 8 + k, confirmadas: 3 + k }, { data_rota: d, situacao: "INSTALADO", n: k < 3 ? 20 - k : 0 }]), atrasadas: 6, atrasada_mais_antiga: "2026-10-21" }));
})();
