/* Dados de DEMONSTRAÇÃO para os protótipos de redesign.
   Fictícios, mas coerentes entre as telas: a soma das equipes fecha com a empresa, a venda do detalhe
   aparece na lista e na fila, o vendedor do app pertence a uma das equipes.
   Referência: sábado, 24/10/2026, 14:20 · outubro tem 23,5 dias úteis na escala 6x1
   (sábado vale meio dia; domingos e o feriado de 12/10 não contam) · decorridos 18 · restantes 5,5. */
window.DEMO = (() => {
  /* Conceitos (como o sistema calcula hoje):
     vendas  = lançadas no mês, qualquer situação · validas = instaladas + pendentes (sem as canceladas)
     bl      = BL vendida válida: contratos com banda larga, instalados ou pendentes (fechamento.js mes_bl)
     fpd     = FPD das 3 últimas safras (jul, ago, set): faturas não pagas no prazo ÷ faturas resolvidas;
               referência das telas: alerta acima de 20%, crítico acima de 25% */
  const equipes = [
    { id: 1, nome: "Taguatinga Norte", sup: "Carla Menezes", hc: 9, bl: 168, meta: 190, vendas: 214, inst: 129, canc: 15, semVenda: 1, fpd: 0.121, fpdBase: 341 },
    { id: 2, nome: "Ceilândia Centro", sup: "Anderson Lima", hc: 11, bl: 176, meta: 220, vendas: 221, inst: 133, canc: 18, semVenda: 2, fpd: 0.158, fpdBase: 402 },
    { id: 3, nome: "Águas Claras", sup: "Patrícia Rocha", hc: 7, bl: 104, meta: 140, vendas: 131, inst: 81, canc: 9, semVenda: 1, fpd: 0.114, fpdBase: 229 },
    { id: 4, nome: "Samambaia", sup: "Rodrigo Teles", hc: 8, bl: 112, meta: 160, vendas: 142, inst: 84, canc: 11, semVenda: 2, fpd: 0.196, fpdBase: 266 },
    { id: 5, nome: "Plano Piloto e Lago Sul", sup: "Fernanda Quintela", hc: 6, bl: 78, meta: 120, vendas: 96, inst: 54, canc: 8, semVenda: 2, fpd: 0.149, fpdBase: 168 },
    { id: 6, nome: "Valparaíso de Goiás", sup: "Marcos Vinícius Araújo", hc: 8, bl: 96, meta: 170, vendas: 120, inst: 66, canc: 12, semVenda: 3, fpd: 0.268, fpdBase: 257 },
    { id: 7, nome: "Recanto das Emas e Riacho Fundo", sup: "Juliana Prado", hc: 9, bl: 78, meta: 160, vendas: 110, inst: 51, canc: 11, semVenda: 3, fpd: 0.227, fpdBase: 249 },
  ];
  const DU = { total: 23.5, decorridos: 18, restantes: 5.5 };
  const proj = (x) => Math.round((x / DU.decorridos) * DU.total);
  equipes.forEach((e) => {
    e.pend = e.vendas - e.inst - e.canc;
    e.proj = proj(e.bl);
    e.atinge = e.proj / e.meta;                         // projeção ÷ meta
    e.status = e.atinge >= 1 ? "ok" : e.atinge >= 0.75 ? "atencao" : "abaixo";   // regra do servidor (fechamento.js)
    e.validas = e.vendas - e.canc;
    e.fpdSt = e.fpd > 0.25 ? "abaixo" : e.fpd > 0.20 ? "atencao" : "ok";
    e.ritmoNec = Math.max(0, (e.meta - e.bl) / DU.restantes);   // BL por dia útil para bater a meta
    e.ritmoAtual = e.bl / DU.decorridos;
  });
  const soma = (k) => equipes.reduce((s, e) => s + e[k], 0);
  const empresa = {
    vendas: soma("vendas"), bl: soma("bl"), meta: soma("meta"), inst: soma("inst"), canc: soma("canc"), pend: soma("pend"),
    hc: soma("hc"), semVenda: soma("semVenda"), proj: proj(soma("bl")), validas: soma("validas"),
    fpd: equipes.reduce((s, e) => s + e.fpd * e.fpdBase, 0) / soma("fpdBase"), fpdSafras: "jul, ago e set", fpdLimite: 0.25, fpdAlerta: 0.20, fpdBase: soma("fpdBase"),
  };
  empresa.atinge = empresa.proj / empresa.meta;
  empresa.ritmoNec = (empresa.meta - empresa.bl) / DU.restantes;
  empresa.ritmoAtual = empresa.bl / DU.decorridos;

  // BL vendida por dia de outubro (domingos e 12/10 sem expediente; 24/10 parcial até 14:20)
  const porDia = { 1: 41, 2: 44, 3: 24, 5: 47, 6: 49, 7: 46, 8: 43, 9: 45, 10: 22, 13: 39, 14: 46, 15: 48, 16: 44, 17: 25, 19: 47, 20: 50, 21: 46, 22: 45, 23: 48, 24: 13 };
  const folga = { 4: "domingo", 11: "domingo", 12: "feriado (N. Sra. Aparecida)", 18: "domingo", 25: "domingo" };
  const peso = (d) => { const dow = new Date(Date.UTC(2026, 9, d)).getUTCDay(); return folga[d] || dow === 0 ? 0 : dow === 6 ? 0.5 : 1; };
  const dias = [];
  let acum = 0, acumUteis = 0;
  for (let d = 1; d <= 31; d++) {
    const p = peso(d); acumUteis += p;
    const passou = d <= 24;
    if (passou) acum += porDia[d] || 0;
    dias.push({ d, peso: p, folga: folga[d] || (p === 0 ? "domingo" : null), bl: passou ? porDia[d] || 0 : null, acum: passou ? acum : null,
      // projeção: do dia de hoje em diante, segue o ritmo atual por dia útil
      proj: d >= 24 ? Math.round(empresa.bl + empresa.ritmoAtual * Math.max(0, acumUteis - DU.decorridos)) : null,
      parcial: d === 24 });
  }

  const vendedoresSamambaia = [
    { nome: "Rafael Moura", bl: 17, meta: 20, vendas: 21, inst: 12, canc: 2, ultimaVenda: "hoje 11:42", diasSem: 0, fpd: 0.071 },
    { nome: "Bianca Ferreira Lacerda", bl: 22, meta: 20, vendas: 26, inst: 17, canc: 1, ultimaVenda: "hoje 13:05", diasSem: 0, fpd: 0.045 },
    { nome: "Thiago Nascimento", bl: 15, meta: 20, vendas: 19, inst: 11, canc: 2, ultimaVenda: "hoje 09:58", diasSem: 0, fpd: 0.088 },
    { nome: "Jéssica Cristina Oliveira Santos", bl: 14, meta: 20, vendas: 17, inst: 10, canc: 1, ultimaVenda: "ontem 17:20", diasSem: 1, fpd: 0.061 },
    { nome: "Lucas Henrique Barbosa", bl: 13, meta: 20, vendas: 16, inst: 9, canc: 2, ultimaVenda: "hoje 10:31", diasSem: 0, fpd: 0.125 },
    { nome: "Amanda Ribeiro", bl: 12, meta: 20, vendas: 15, inst: 9, canc: 1, ultimaVenda: "hoje 12:17", diasSem: 0, fpd: 0.0 },
    { nome: "Diego Cardoso", bl: 11, meta: 20, vendas: 15, inst: 9, canc: 1, ultimaVenda: "21/10 16:44", diasSem: 3, fpd: 0.143 },
    { nome: "Vanessa Pires", bl: 8, meta: 20, vendas: 13, inst: 7, canc: 1, ultimaVenda: "20/10 15:02", diasSem: 4, fpd: null },
  ];

  // a venda que aparece no detalhe, na lista e na rota
  const venda = {
    contrato: "61208457", dataVenda: "19/10/2026", situacao: "PENDENTE", situacaoRot: "Pendente de instalação",
    statusContrato: null, origem: "PAP", canal: "Solar", tipo: "Prospect",
    cliente: "Mariana Albuquerque Teixeira", doc: "***.982.247-**", contato: "(61) 9 9812-•••4", nascimento: "14/03/1988",
    endereco: "QR 403 Conjunto 12 Casa 8", bairro: "Samambaia Norte", cidade: "Brasília/DF", imovel: "Casa",
    vendedor: "Rafael Moura", equipe: "Samambaia", supervisor: "Rodrigo Teles",
    produtos: [
      { cat: "BL", nome: "Internet 500 Mega", qtd: 1 },
      { cat: "TV", nome: "Claro TV+ Box", qtd: 1 },
      { cat: "Móvel", nome: "Chip Claro Controle 25 GB", qtd: 2, adesao: "Portabilidade" },
    ],
    pagamento: "Débito em conta (DCC)", vencimento: 10, pacote: 189.9,
    agendamento: "26/10/2026", turno: "Manhã", rota: "Pendente de instalação", rotaConfirmada: true,
    confirmacoes: [
      { etapa: "D+1", quando: "20/10 10:14", resultado: "Confirmado", por: "Juliana Castro", obs: "Cliente confirmou endereço e horário." },
      { etapa: "D+15", quando: "previsto 03/11", resultado: null },
    ],
    historico: [
      { quando: "24/10 09:40", tipo: "rota", txt: "Instalação confirmada com o cliente por WhatsApp", por: "Juliana Castro · Cadastro" },
      { quando: "20/10 10:14", tipo: "confirmacao", txt: "Confirmação D+1: confirmado", por: "Juliana Castro · Cadastro" },
      { quando: "19/10 16:02", tipo: "status", txt: "Venda lançada como Pendente (agendada 26/10, manhã)", por: "Juliana Castro · Cadastro" },
      { quando: "19/10 15:40", tipo: "externa", txt: "Solar: retorno Finalizado (venda nº 2318)", por: "Paulo Henrique · Cadastro" },
      { quando: "19/10 10:05", tipo: "externa", txt: "Enviada ao Solar pelo vendedor", por: "Rafael Moura · vendedor" },
      { quando: "19/10 09:31", tipo: "viab", txt: "Viabilidade nº 1847: Atende (endereço, crédito e linha)", por: "Paulo Henrique · Cadastro" },
      { quando: "19/10 09:12", tipo: "viab", txt: "Viabilidade pedida pelo vendedor", por: "Rafael Moura · vendedor" },
    ],
    obs: [
      { quando: "24/10 09:40", por: "Juliana Castro", txt: "Cliente pediu ligação 30 min antes do técnico chegar." },
    ],
  };

  const viabilidade = [
    { id: 1912, quando: "14:18", ha: 2, end: "QNM 34 Conjunto F Casa 21", bairro: "Ceilândia Norte", cidade: "Brasília/DF", cep: "72215-346", vendedor: "Wellington Sousa", equipe: "Ceilândia Centro", checa: ["Endereço", "Crédito"], st: "PENDENTE", resp: null, cont: false },
    { id: 1911, quando: "14:06", ha: 14, end: "Rua 12 Chácara 157 Lote 3", bairro: "Vicente Pires", cidade: "Brasília/DF", cep: "72007-160", vendedor: "Bianca Ferreira Lacerda", equipe: "Samambaia", checa: ["Endereço", "Crédito", "Linha móvel"], st: "ANALISE", resp: "Paulo Henrique", cont: false },
    { id: 1909, quando: "13:51", ha: 29, end: "Quadra 307 Conjunto 4 Lote 11 Apto 204", bairro: "Recanto das Emas", cidade: "Brasília/DF", cep: "72621-104", vendedor: "Kauã Almeida", equipe: "Recanto das Emas e Riacho Fundo", checa: ["Endereço"], st: "PENDENTE", resp: null, cont: true },
    { id: 1906, quando: "13:30", ha: 50, end: "Avenida das Araucárias, 1835, Bloco B Apto 1102", bairro: "Águas Claras", cidade: "Brasília/DF", cep: "71936-250", vendedor: "Gabriela Torres", equipe: "Águas Claras", checa: ["Endereço", "Biometria"], st: "PENDENTE", resp: null, cont: false },
    { id: 1904, quando: "13:12", ha: 68, end: "Rua 30 Quadra 47 Lote 9", bairro: "Jardim Céu Azul", cidade: "Valparaíso de Goiás/GO", cep: "72876-030", vendedor: "Mateus Rocha", equipe: "Valparaíso de Goiás", checa: ["Endereço", "Crédito"], st: "PENDENTE", resp: null, cont: false },
    { id: 1902, quando: "12:47", ha: 93, end: "SHIN QI 9 Conjunto 3 Casa 14", bairro: "Lago Norte", cidade: "Brasília/DF", cep: "71515-030", vendedor: "Helena Vasconcelos", equipe: "Plano Piloto e Lago Sul", checa: ["Endereço", "Crédito", "Linha móvel", "Biometria"], st: "ANALISE", resp: "Juliana Castro", cont: false },
  ];
  const viabResumo = { pendentes: 9, analise: 3, respondidasHoje: 41, atende: 33, naoAtende: 8 };

  const conexaoSolar = [
    { id: 2331, sis: "Solar", cliente: "CPF 284.***.***-07", vendedor: "Rafael Moura", st: "CRIACAO_HP", prazo: "vence em 1h 40min", chip: false },
    { id: 2329, sis: "Conexão", cliente: "Edson Pereira Lima", vendedor: "Bianca Ferreira Lacerda", st: "PENDENTE_TRATAMENTO", chip: true },
    { id: 2327, sis: "Solar", cliente: "CPF 031.***.***-55", vendedor: "Thiago Nascimento", st: "PENDENCIA", msg: "Falta o comprovante de endereço" },
  ];

  // vendedor que usa o app (pertence à equipe Samambaia)
  const app = {
    nome: "Rafael Moura", primeiro: "Rafael", equipe: "Samambaia", sup: "Rodrigo Teles",
    bl: 17, meta: 20, proj: Math.round((17 / DU.decorridos) * DU.total), vendas: 21, inst: 12, pend: 7, canc: 2,
    premiacao: 312.0, posicao: 3, equipeTam: 8,
    acoes: [
      { tipo: "hp", tit: "Solar nº 2331 · Criação de HP", txt: "O prazo vence em 1h 40min", quando: "agora" },
      { tipo: "viab", tit: "Viabilidade respondida", txt: "QR 407 Cj 3 · Atende", quando: "13:58" },
      { tipo: "crm", tit: "Retorno agendado · 16:00", txt: "Ligar para Sônia (indicação do vizinho)", quando: "hoje" },
      { tipo: "pend", tit: "Conexão nº 2310 · Pendência", txt: "Backoffice pediu a foto do chip", quando: "ontem" },
    ],
    lista: [
      { contrato: "61208457", cliente: "Mariana Albuquerque Teixeira", data: "19/10", st: "Pendente", prox: "Instalação 26/10 · manhã", produtos: "500 Mega + TV + 2 chips" },
      { contrato: "61207712", cliente: "José Carlos Fontes", data: "18/10", st: "Instalada", prox: "Confirmação D+15 em 02/11", produtos: "1 Giga" },
      { contrato: "61203390", cliente: "Patrícia Gomes de Souza Ramalho", data: "16/10", st: "Pendente", prox: "Pendência: falta comprovante", produtos: "500 Mega + 1 chip" },
      { contrato: "61199841", cliente: "Antônio Batista", data: "15/10", st: "Cancelada", prox: "Motivo: cliente desistiu", produtos: "350 Mega" },
      { contrato: "61198025", cliente: "Rosângela Mendes", data: "14/10", st: "Instalada", prox: "—", produtos: "500 Mega + TV" },
    ],
  };

  // lista de vendas filtrada pela equipe Samambaia (142 no mês); a venda do detalhe é a primeira pendente
  const vendasLista = [
    { data: "24/10", contrato: "61214503", cliente: "Gilberto Nogueira", bairro: "Samambaia Sul", vendedor: "Bianca Ferreira Lacerda", prods: ["1 Giga"], st: "pend", inst: "29/10 · tarde" },
    { data: "24/10", contrato: "61214477", cliente: "Elaine Cristina de Paula Moura", bairro: "Samambaia Norte", vendedor: "Amanda Ribeiro", prods: ["500 Mega", "TV"], st: "pend", inst: "28/10 · manhã" },
    { data: "23/10", contrato: "61213980", cliente: "Rubens Tavares", bairro: "Samambaia Sul", vendedor: "Thiago Nascimento", prods: ["500 Mega", "2 chips"], st: "pend", inst: "sem agendamento", alerta: true },
    { data: "22/10", contrato: "61212204", cliente: "Lorena Batista", bairro: "Samambaia Norte", vendedor: "Rafael Moura", prods: ["350 Mega"], st: "inst", inst: "instalada 23/10" },
    { data: "21/10", contrato: "61210963", cliente: "Francisco das Chagas Rodrigues Filho", bairro: "Samambaia Sul", vendedor: "Lucas Henrique Barbosa", prods: ["1 Giga", "TV", "1 chip"], st: "canc", inst: "cliente desistiu" },
    { data: "19/10", contrato: "61208457", cliente: "Mariana Albuquerque Teixeira", bairro: "Samambaia Norte", vendedor: "Rafael Moura", prods: ["500 Mega", "TV", "2 chips"], st: "pend", inst: "26/10 · manhã" },
    { data: "19/10", contrato: "61208112", cliente: "Weslley Santos", bairro: "Samambaia Norte", vendedor: "Jéssica Cristina Oliveira Santos", prods: ["500 Mega"], st: "inst", inst: "instalada 21/10" },
    { data: "18/10", contrato: "61207306", cliente: "Raimunda Ferreira", bairro: "Samambaia Sul", vendedor: "Diego Cardoso", prods: ["350 Mega", "1 chip"], st: "pend", inst: "21/10 · atrasada", atrasada: true },
    { data: "17/10", contrato: "61206640", cliente: "Otávio Lins", bairro: "Samambaia Norte", vendedor: "Bianca Ferreira Lacerda", prods: ["1 Giga", "TV"], st: "inst", inst: "instalada 20/10" },
    { data: "16/10", contrato: "61205877", cliente: "Cláudia Regina Albuquerque", bairro: "Samambaia Sul", vendedor: "Vanessa Pires", prods: ["500 Mega"], st: "inst", inst: "instalada 19/10" },
  ];

  return { hoje: "24/10/2026", hora: "14:20", mesRot: "outubro de 2026", DU, equipes, empresa, dias, vendedoresSamambaia, venda, viabilidade, viabResumo, conexaoSolar, app, vendasLista };
})();
