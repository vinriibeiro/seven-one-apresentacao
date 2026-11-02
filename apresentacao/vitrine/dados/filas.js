"use strict";
/* Vitrine: filas. Viabilidade (routes_viabilidade.js): lista GET /viabilidade (itens, contagem, vendedores, total, pagina),
   detalhe GET /viabilidade/:id (com obs[]) e busca de CEP GET /cep/:cep. Anexos do pedido: GET /anexos (routes_anexos.js). */
(() => {
  const V = window.VITRINE, D = window.DEMO, R = D.viabResumo;
  const antes = (min) => new Date(Date.now() - min * 6e4).toISOString();
  const vend = (nome) => V.base.vendedores.find((v) => v.nome === nome) || V.base.vendedores[0];
  const ST = { PENDENTE: "PENDENTE", ANALISE: "EM_ANALISE" };
  const BO = { "Paulo Henrique": 11, "Juliana Castro": 10 };
  // "Rua 30 Quadra 47 Lote 9" -> logradouro "Rua 30 Quadra 47", número "Lote 9" (o sistema guarda os dois separados)
  const partes = (end) => { const m = end.match(/^(.*?)(?:,\s*|\s+)((?:Lote|Casa|\d+)\b.*)$/); return m ? [m[1], m[2]] : [end, ""]; };
  const linha = (v, extra = {}) => {
    const [logradouro, numero] = partes(v.end), [cidade, uf] = v.cidade.split("/"), p = vend(v.vendedor);
    return {
      id: v.id, vendedor_id: p.id, vendedor_nome: v.vendedor, vendedor_equipe: (v.equipe || "").toUpperCase() || null, contestado: !!v.cont, criado_em: antes(v.ha), status: ST[v.st] || v.st,
      checa_endereco: v.checa.includes("Endereço"), checa_credito: v.checa.includes("Crédito"), checa_linha: v.checa.includes("Linha móvel"), checa_biometria: v.checa.includes("Biometria"),
      credito_status: "PENDENTE", linha_status: "PENDENTE", biometria_status: "PENDENTE", credito_oferta_single: false, linha_limite: null, biometria_link: null,
      cep: v.cep.replace("-", ""), logradouro, numero, complemento: null, bairro: v.bairro, cidade, uf, referencia: null,
      cliente_nome: null, cliente_contato: null, hp: null, encaminhado_para: null, encaminhado_em: null,
      em_analise_por: v.resp ? BO[v.resp] : null, em_analise_por_nome: v.resp, em_analise_em: v.resp ? antes(v.ha - 3) : null,
      respondido_por: null, respondido_por_nome: null, respondido_em: null, visto_vendedor_em: null, n_obs: 0, ultima_obs: null, ...extra,
    };
  };
  const fila = D.viabilidade.map((v) => linha(v, v.id === 1904 ? { referencia: "Ao lado da Praça da Bíblia", cliente_nome: "Roberto Dias", cliente_contato: "(61) 98456-0371", n_obs: 1, ultima_obs: "Cliente mora na casa dos fundos, entrada pela rua lateral. Foto da fachada anexada." } : {}))
    .sort((a, b) => new Date(a.criado_em) - new Date(b.criado_em));
  // respondidas hoje (para os filtros Atende / Não atende / Todas): dois exemplos com a mesma forma
  const resp = (id, base, st, min, txt) => ({ ...linha({ ...base, id, ha: min + 25, st }), respondido_por: 10, respondido_por_nome: "Juliana Castro", respondido_em: antes(min), visto_vendedor_em: antes(min - 5), hp: st === "ATENDE" ? "48201937" : null, n_obs: 1, ultima_obs: txt });
  const respondidas = [
    resp(1901, { end: "QR 409 Conjunto 12 Casa 7", bairro: "Samambaia Norte", cidade: "Brasília/DF", cep: "72319-213", vendedor: "Bianca Ferreira Lacerda", checa: ["Endereço"] }, "ATENDE", 40, "Atende. HP 48201937."),
    resp(1899, { end: "Rua 8 Chácara 22 Lote 4", bairro: "Setor Habitacional Arniqueira", cidade: "Brasília/DF", cep: "71995-010", vendedor: "Kauã Almeida", checa: ["Endereço"] }, "NAO_ATENDE", 75, "Fora da área de cobertura da rede."),
  ];
  // vendedor da sessão (Rafael Moura): os próprios pedidos, um em cada situação
  const meus = () => {
    const eu = V.pessoa, base = { vendedor: eu.nome };
    const m = (o) => ({ ...o, vendedor_id: eu.id, vendedor_nome: eu.nome });
    return [
      m({ ...resp(1913, { ...base, end: "QR 425 Conjunto 3 Casa 18", bairro: "Samambaia Norte", cidade: "Brasília/DF", cep: "72327-503", checa: ["Endereço", "Crédito"] }, "ATENDE", 12, "Atende. HP 48219055. Crédito aprovado."), visto_vendedor_em: null, credito_status: "ATENDE", cliente_nome: "Márcia Lopes" }),
      m(linha({ id: 1910, ha: 22, end: "QN 312 Conjunto 9 Lote 2", bairro: "Samambaia Sul", cidade: "Brasília/DF", cep: "72308-509", vendedor: eu.nome, checa: ["Endereço"], st: "ANALISE", resp: "Juliana Castro" })),
      m(linha({ id: 1907, ha: 41, end: "", bairro: "", cidade: "/", cep: "", vendedor: eu.nome, checa: ["Crédito", "Linha móvel"], st: "PENDENTE" }, { checa_endereco: false, status: "PENDENTE", cep: null, logradouro: null, cidade: null, uf: null, cliente_nome: "Diego Ramos" })),
      m(resp(1895, { ...base, end: "QR 116 Conjunto 5 Casa 30", bairro: "Samambaia Sul", cidade: "Brasília/DF", cep: "72302-605", checa: ["Endereço"] }, "NAO_ATENDE", 300, "Endereço fora da área de cobertura da rede.")),
    ];
  };
  const ABERTO = (v) => (v.checa_endereco && ["PENDENTE", "EM_ANALISE"].includes(v.status)) || [["checa_credito", "credito_status"], ["checa_linha", "linha_status"], ["checa_biometria", "biometria_status"]].some(([c, s]) => v[c] && v[s] === "PENDENTE");
  const todos = () => (V.pessoa.perfil === "vendedor" ? meus() : [...fila, ...respondidas]);

  V.rota("GET", "/viabilidade", ({ query }) => {
    const st = query.status || "", b = (query.busca || "").toLowerCase();
    const lista = todos().filter((v) => (st === "ABERTAS" ? ABERTO(v) : !st || v.status === st)
      && (!query.vendedor || String(v.vendedor_id) === String(query.vendedor))
      && (!b || [v.logradouro, v.bairro, v.cidade, v.cep, v.cliente_nome, v.vendedor_nome].some((x) => (x || "").toLowerCase().includes(b))));
    const vendedor = V.pessoa.perfil === "vendedor";
    const total = vendedor || st || b || query.vendedor ? lista.length : R.pendentes + R.analise + R.atende + R.naoAtende;
    const contagem = vendedor ? { PENDENTE: 1, EM_ANALISE: 1, ATENDE: 1, NAO_ATENDE: 1 } : { PENDENTE: R.pendentes, EM_ANALISE: R.analise, ATENDE: R.atende, NAO_ATENDE: R.naoAtende, ATENDE_HOJE: R.atende, NAO_ATENDE_HOJE: R.naoAtende, RESPONDIDAS_HOJE: R.respondidasHoje };
    const vendedores = vendedor ? [] : [...new Map([...fila, ...respondidas].map((v) => [v.vendedor_id, { id: v.vendedor_id, nome: v.vendedor_nome }])).values()].sort((a, b) => a.nome.localeCompare(b.nome));
    return { total: st === "ABERTAS" && !b && !query.vendedor && !vendedor ? R.pendentes + R.analise : total, pagina: Number(query.pagina || 1), itens: lista, contagem, vendedores };
  });
  V.rota("GET", "/viabilidade/:id", ({ params }) => {
    const v = todos().find((x) => x.id === Number(params.id));
    if (!v) return { status: 404, corpo: { erro: "Viabilidade não encontrada." } };
    const det = { ...v };
    if (v.checa_credito) Object.assign(det, v.id === 1904 ? { cred_nome: "Roberto Dias de Almeida", cred_cpf: "41641650822", cred_nascimento: "1979-09-02", cred_cidade: "Valparaíso de Goiás/GO" } : { cred_nome: v.cliente_nome || "Cliente da demonstração", cred_cpf: "12345678909", cred_nascimento: "1988-04-15", cred_cidade: "Brasília/DF" });
    if (v.checa_linha) det.linha_cpf = "12345678909";
    if (v.checa_biometria) Object.assign(det, { bio_nome: "Cliente da demonstração", bio_cpf: "12345678909", bio_contato: "(61) 99876-5432" });
    det.obs = v.ultima_obs ? [{ id: v.id * 10, texto: v.ultima_obs, em: v.respondido_em || antes(Math.max(0, (Date.now() - new Date(v.criado_em)) / 6e4 - 1)), autor_id: v.respondido_em ? v.respondido_por : v.vendedor_id, autor: v.respondido_em ? v.respondido_por_nome : v.vendedor_nome }] : [];
    return det;
  });
  V.rota("GET", "/anexos", ({ query }) => ({ itens: query.entidade === "VIABILIDADE" && query.id === "1904" ? [{ id: 1, nome: "fachada.jpg", tamanho: 1887436, enviado_por_nome: "Mateus Rocha", criado_em: antes(68) }] : [] }));
  V.rota("GET", "/cep/:cep", ({ params }) => ({ cep: params.cep, logradouro: "QR 425 Conjunto 3", bairro: "Samambaia Norte", cidade: "Brasília", uf: "DF" }));
  /* atalhos do "+" do app: Conexão/Solar e agenda (listas vazias bastam para abrir os formulários) */
  V.rota("GET", "/venda-externa", () => ({ total: 0, pagina: 1, itens: [], contagem: {} }));
  V.rota("GET", "/crm/clientes", () => ({ itens: [] }));
})();
