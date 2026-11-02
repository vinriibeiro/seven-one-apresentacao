"use strict";
/* Vitrine: dados comuns e as rotas da casca (servidor, perfil, catálogos, avisos, quem está online).
   Os números seguem design/prototipos/dados-demo.js (window.DEMO), carregado antes deste arquivo:
   outubro de 2026, referência sábado 24/10 às 14:20. Cada grupo de telas acrescenta o seu dados/<grupo>.js. */
(() => {
  const D = window.DEMO, V = window.VITRINE;

  /* Pessoas fictícias: supervisores e vendedores das equipes do DEMO, com ids estáveis */
  const equipes = D.equipes.map((e) => ({ id: e.id, nome: e.nome.toUpperCase(), rot: e.nome, supervisor: e.sup }));
  const vendedores = [];
  let id = 100;
  D.vendedoresSamambaia.forEach((v) => vendedores.push({ id: id++, nome: v.nome, equipe_id: 4 }));
  const outros = ["Wellington Sousa", "Kauã Almeida", "Gabriela Torres", "Mateus Rocha", "Helena Vasconcelos", "Priscila Duarte", "Renan Gouveia", "Simone Batista", "Caio Monteiro", "Larissa Fontes", "Igor Pacheco", "Tatiane Moraes"];
  const equipeDe = { "Wellington Sousa": 2, "Kauã Almeida": 7, "Gabriela Torres": 3, "Mateus Rocha": 6, "Helena Vasconcelos": 5 };
  outros.forEach((n, i) => vendedores.push({ id: id++, nome: n, equipe_id: equipeDe[n] || ((i % 7) + 1) }));
  const login = (n) => n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(" ").filter((p) => p.length > 2).slice(0, 2).join(".");

  window.VITRINE.base = { equipes, vendedores, login };

  const P = V.pessoa;
  const perfilAcesso = P.perfil === "lider" ? "lider" : P.perfil;

  V.rota("GET", "/saude", () => ({ ok: true, versao: 20 }));
  V.rota("GET", "/sistema/migracoes", () => ({ faltando: [] }));
  V.rota("GET", "/online/ping", () => ({ ok: true }));
  V.rota("POST", "/online/sair", () => ({ ok: true }));
  /* tela de entrada (?sair): qualquer e-mail e senha entram com o perfil da URL */
  V.rota("POST", "/auth/login", () => ({ token: "vitrine", vitrine: V.perfil, usuario: { ...V.pessoa, trocar: false } }));
  V.rota("POST", "/auth/esqueci-senha", ({ corpo }) => ({ ok: true, por_email: true, mensagem: `Se ${corpo?.email || "o e-mail"} tiver acesso, o link chega em alguns minutos.` }));

  V.rota("GET", "/perfil", () => ({
    id: P.id, nome_completo: P.nome, login: login(P.nome), email: login(P.nome) + "@exemplo.com.br", perfil_acesso: perfilAcesso,
    foto: null, data_entrada: "2024-03-04", ultimo_login: "2026-10-24T08:02:00-03:00", criada_em: "2024-03-04T10:00:00-03:00",
    funcoes: P.perfil === "vendedor" ? "VENDEDOR" : P.perfil === "lider" ? "SUPERVISOR" : null,
    equipe: P.perfil === "vendedor" || P.perfil === "lider" ? "SAMAMBAIA" : null,
  }));

  V.rota("GET", "/catalogos", () => ({
    origens: [{ codigo: "CARROSSEL", descricao: "Venda Carrossel (não conta na premiação)" }, { codigo: "INDICAÇÃO", descricao: "Indicação de cliente" }, { codigo: "PAP", descricao: "Porta a porta" }, { codigo: "REDE SOCIAL", descricao: "Lead vindo de rede social" }],
    canais: [{ codigo: "NETSALES", descricao: "Finalizada no NETSALES" }, { codigo: "SOLAR", descricao: "Finalizada no SOLAR" }],
    formas: [{ codigo: "BOLETO", descricao: "Boleto" }, { codigo: "DCC", descricao: "Débito em conta" }],
    turnos: [{ codigo: "08:00 AS 12:00" }, { codigo: "12:00 AS 15:00" }, { codigo: "12:00 AS 18:00" }, { codigo: "15:00 AS 18:00" }],
    cidades: [{ id: 1, uf: "DF", nome: "BRASÍLIA" }, { id: 2, uf: "GO", nome: "VALPARAÍSO DE GOIÁS" }, { id: 3, uf: "GO", nome: "ÁGUAS LINDAS DE GOIÁS" }],
    produtos: [
      { id: 1, categoria: "BL", nome: "INTERNET 350 MEGA", velocidade_mb: 350 }, { id: 2, categoria: "BL", nome: "INTERNET 500 MEGA", velocidade_mb: 500 },
      { id: 3, categoria: "BL", nome: "INTERNET 1 GIGA", velocidade_mb: 1000 }, { id: 4, categoria: "TV", nome: "CLARO TV+ BOX", velocidade_mb: null },
      { id: 5, categoria: "MOVEL", nome: "CLARO CONTROLE 25 GB", velocidade_mb: null }, { id: 6, categoria: "FIXO", nome: "FONE ILIMITADO BRASIL", velocidade_mb: null },
    ],
    motivos: [
      { id: 1, codigo: "100", descricao: "AGENDA NÃO CUMPRIDA", categoria: "CONFIRMACAO" }, { id: 2, codigo: "101", descricao: "ENDEREÇO NÃO LOCALIZADO", categoria: "INFRAESTRUTURA" },
      { id: 3, codigo: "106", descricao: "CLIENTE AUSENTE", categoria: "CONFIRMACAO" }, { id: 4, codigo: "205", descricao: "FALTA DE NAP / NAP LOTADA", categoria: "INFRAESTRUTURA" },
      { id: 5, codigo: null, descricao: "CLIENTE DESISTIU", categoria: "OUTRO" },
    ],
    equipes: equipes.map(({ id, nome }) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome)),
    vendedores: vendedores.map((v) => ({ id: v.id, login: login(v.nome), nome: v.nome })).sort((a, b) => a.nome.localeCompare(b.nome)),
    tipos: [{ codigo: "BASE" }, { codigo: "PROSPECT" }],
  }));

  V.rota("GET", "/avisos", () => {
    if (P.perfil === "vendedor") return { viabilidade: { respondidas: 1, marca: "1792860000" }, conexao: { avisos: 2, marca: "1792860000" }, etapas: { viabilidade: 3, vendaexterna: 2, vendas: 21 } };
    if (P.perfil === "gestor" || P.perfil === "master" || P.perfil === "administrador" || P.setor === "CADASTRO")
      return { viabilidade: { pendentes: D.viabResumo.pendentes, em_analise: D.viabResumo.analise, marca: "1912", mais_antigo: "2026-10-24T12:47:00-03:00", respondidas_hoje: 41, atende_hoje: 33 }, conexao: { pendentes: 1, marca: "1792860000", mais_antigo: "2026-10-24T13:28:00-03:00" } };
    return {};
  });

  const agora = () => new Date().toISOString();
  V.rota("GET", "/online", () => ({
    online_min: 3, agora: agora(),
    itens: [
      { id: 10, nome: "Juliana Castro", perfil_acesso: "backoffice", setor: "CADASTRO", foto: null, online: true, equipe: null, cargo: "Backoffice" },
      { id: 11, nome: "Paulo Henrique", perfil_acesso: "backoffice", setor: "QUALIDADE", foto: null, online: true, equipe: null, cargo: "Backoffice" },
      { id: 21, nome: "Rodrigo Teles", perfil_acesso: "lider", setor: null, foto: null, online: true, equipe: "SAMAMBAIA", cargo: "Supervisor" },
      { id: 22, nome: "Carla Menezes", perfil_acesso: "lider", setor: null, foto: null, online: true, equipe: "TAGUATINGA NORTE", cargo: "Supervisor" },
      ...vendedores.slice(0, 9).map((v, i) => ({ id: v.id, nome: v.nome, perfil_acesso: "vendedor", setor: null, foto: null, online: i < 6, equipe: equipes.find((e) => e.id === v.equipe_id).nome, cargo: "Vendedor", visto_em: agora() })),
    ],
  }));

  V.rota("GET", "/equipes/pessoas", () => [
    ...Object.values(V.PESSOAS).filter((p) => p.perfil !== "master" && p.perfil !== "vendedor").map((p) => ({ id: p.id, nome: p.nome, perfil_acesso: p.perfil, setor: p.setor || null, email: login(p.nome) + "@exemplo.com.br", tem_acesso: true })),
    ...vendedores.map((v) => ({ id: v.id, nome: v.nome, perfil_acesso: "vendedor", setor: null, email: login(v.nome) + "@exemplo.com.br", tem_acesso: true })),
  ].sort((a, b) => a.nome.localeCompare(b.nome)));
})();

/* ?clicar=<seletor>: clica no elemento depois que a tela abre (capturar.mjs, opção "clicar"), para conferir menus e janelas */
(() => {
  const sel = new URLSearchParams(location.search).get("clicar");
  if (sel) setTimeout(() => document.querySelector(sel)?.click(), 2500);
})();
