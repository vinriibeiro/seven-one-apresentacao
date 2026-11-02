"use strict";
/* Navegação do sistema: módulos (trilho), páginas de cada módulo (painel de páginas) e abas do app, por perfil.
   É também a lista de permissões das telas: uma página só abre se estiver aqui para o perfil (o servidor confere de novo).
   Cada página: [chave, nome] ou [chave, nome, mãe]. Com "mãe", a página não aparece na lista: vira ação dentro da mãe
   (ex.: Nova venda dentro de Vendas) e a mãe fica marcada enquanto ela está aberta. */
window.SEVEN_NAV = (() => {
  const MODULO = {
    visao: { nome: "Visão geral", curto: "Visão geral", ic: '<rect x="3.5" y="3.5" width="7" height="8" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/><rect x="3.5" y="14.5" width="7" height="6" rx="1.5"/>' },
    comercial: { nome: "Comercial", curto: "Comercial", ic: '<path d="M4 19h16"/><path d="M7 16V10M12 16V6M17 16v-4"/>' },
    operacao: { nome: "Operação", curto: "Operação", ic: '<path d="M4 6h10M4 12h16M4 18h7"/><circle cx="18" cy="6" r="2"/><circle cx="15" cy="18" r="2"/>' },
    gestao: { nome: "Gestão", curto: "Gestão", ic: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12V3.5M12 12l6.5 4.5"/>' },
    admin: { nome: "Administração", curto: "Admin.", ic: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>' },
  };

  /* [módulo, [[grupo, [páginas]]]] — a ordem dos módulos é a mesma para todos os perfis */
  const VENDAS_ACOES = [["nova", "Nova venda", "vendas"], ["lote", "Lançamento em lote", "vendas"], ["importvendas", "Importar planilha", "vendas"]];
  const PERFIS = {
    gestor: [
      ["visao", [["Acompanhamento", [["dashboard", "Painel"], ["fechamento", "Fechamento do dia"]]]]],
      ["comercial", [["Vendas", [["vendas", "Vendas"], ...VENDAS_ACOES, ["crm", "CRM · agenda e clientes"]]],
        ["Equipes e vendedores", [["equipe", "Equipes"], ["semvenda", "Sem venda hoje"], ["produtividade", "Produtividade por vendedor"]]]]],
      ["operacao", [["Antes do lançamento", [["viabilidade", "Viabilidade"], ["vendaexterna", "Conexão / Solar"]]],
        ["Depois do lançamento", [["rota", "Rota de instalação"], ["pendencias", "Pendências"]]],
        ["Fila da Qualidade", [["confirmacao", "D+1 / D+15 (pós-instalação)"], ["fila-cobranca", "Cobrança de faturas"], ["fila-churn", "Churn · 4 meses"]]]]],
      ["gestao", [["Análises", [["ind-vendas", "Vendas"], ["ind-qualidade", "Qualidade (FPD)"], ["fpd", "Lançar FPD", "ind-qualidade"], ["ind-operacao", "Operação"], ["ind-pessoas", "Vendedores"], ["ind-geo", "Geografia"]]],
        ["Metas e premiação", [["comissao", "Premiação do mês"], ["plano", "Plano do mês (metas)"]]],
        ["Financeiro", [["extrato", "Extrato Claro"]]]]],
      ["admin", [["Cadastros e controle", [["usuarios", "Usuários e acessos"], ["feriados", "Feriados e dias úteis"], ["central", "Central de alterações"], ["online", "Quem está online"], ["monitor", "Monitoramento"], ["seguranca", "Segurança"]]]]],
    ],
    // backoffice de Cadastro: cria e alimenta vendas, responde viabilidade, Conexão/Solar e faz a rota (D-1: confirmar a véspera da instalação)
    backoffice_cadastro: [
      ["visao", [["Acompanhamento", [["dashboard", "Painel"], ["fechamento", "Fechamento do dia"]]]]],
      ["comercial", [["Vendas", [["vendas", "Vendas"], ...VENDAS_ACOES]], ["Vendedores", [["produtividade", "Produtividade por vendedor"]]]]],
      ["operacao", [["Antes do lançamento", [["viabilidade", "Viabilidade"], ["vendaexterna", "Conexão / Solar"]]],
        ["Depois do lançamento", [["rota", "Rota de instalação"], ["pendencias", "Pendências"]]]]],
      ["admin", [["Equipe", [["online", "Quem está online"]]]]],
    ],
    // backoffice de Qualidade: FPD (ver e lançar), fila de pós-instalação, cobrança e churn; vendas só para consulta
    backoffice_qualidade: [
      ["visao", [["Acompanhamento", [["dashboard", "Painel"]]]]],
      ["comercial", [["Vendas", [["vendas", "Vendas"]]]]],
      ["operacao", [["Fila da Qualidade", [["confirmacao", "D+1 / D+15 (pós-instalação)"], ["fila-cobranca", "Cobrança de faturas"], ["fila-churn", "Churn · 4 meses"]]]]],
      ["gestao", [["Análises", [["ind-vendas", "Vendas"], ["ind-qualidade", "Qualidade (FPD)"], ["fpd", "Lançar FPD", "ind-qualidade"], ["ind-operacao", "Operação"], ["ind-pessoas", "Vendedores"], ["ind-geo", "Geografia"]]]]],
      ["admin", [["Equipe", [["online", "Quem está online"]]]]],
    ],
    lider: [
      ["comercial", [["Minha equipe", [["equipe", "Visão da equipe"], ["vendas", "Vendas da equipe"]]]]],
      ["gestao", [["Premiação", [["comissao", "Premiação da equipe"]]]]],
    ],
    coordenador: [
      ["comercial", [["Minha coordenação", [["equipe", "Visão da coordenação"], ["vendas", "Vendas da coordenação"]]]]],
      ["gestao", [["Premiação", [["comissao", "Premiação da coordenação"]]]]],
    ],
    vendedor: [
      ["visao", [["Minha área", [["meu", "Meu desempenho"]]]]],
      ["comercial", [["Vendas", [["vendas", "Minhas vendas"], ["crm", "Agenda e clientes"]]]]],
      ["operacao", [["Antes do lançamento", [["viabilidade", "Viabilidade"], ["vendaexterna", "Conexão / Solar"]]]]],
      ["gestao", [["Premiação", [["comissao", "Minha premiação"]]]]],
    ],
  };
  /* páginas que todo perfil abre: a Wiki (botão Ajuda), o perfil (menu da conta) e o detalhe da venda (a partir da lista) */
  const SEMPRE = ["wiki", "perfil", "venda"];

  /* App instalado: abas da barra de baixo. "+" abre o menu de registrar (só vendedor). */
  const ABAS = {
    vendedor: [["meu", "Início"], ["vendas", "Vendas"], ["+", "Registrar"], ["crm", "Agenda"], ["comissao", "Premiação"]],
    gestor: [["dashboard", "Início"], ["semvenda", "Sem venda"], ["vendas", "Vendas"], ["fechamento", "Hoje"], ["equipe", "Equipes"]],
  };
  /* no app do vendedor, a aba Vendas reúne as três etapas, em abas no alto da tela */
  const ETAPAS_VENDEDOR = [["viabilidade", "Viabilidade"], ["vendaexterna", "Conexão / Solar"], ["vendas", "Contratos"]];
  const REGISTRAR = [
    ["viabilidade", "Pedir viabilidade", "Endereço, crédito, linha móvel ou biometria"],
    ["vendaexterna", "Enviar venda Conexão ou Solar", "Para o backoffice de Cadastro conferir e finalizar"],
    ["crm", "Retorno na agenda", "Lembrete para ligar ou visitar um cliente"],
  ];

  const chavePerfil = (u) => (u.perfil === "backoffice" ? (u.setor === "QUALIDADE" ? "backoffice_qualidade" : "backoffice_cadastro") : u.perfil);
  const modulosDe = (u) => PERFIS[chavePerfil(u)] || [];
  /** Todas as páginas do perfil, achatadas: {chave, nome, mae, grupo, modulo}. */
  function paginasDe(u) {
    const out = [];
    for (const [m, grupos] of modulosDe(u)) for (const [g, its] of grupos) for (const [k, n, mae] of its) out.push({ chave: k, nome: n, mae: mae || null, grupo: g, modulo: m });
    return out;
  }
  const permitidas = (u) => new Set([...paginasDe(u).map((p) => p.chave), ...SEMPRE]);
  /** Página inicial do perfil: a primeira da lista (igual ao sistema anterior). */
  const inicial = (u) => paginasDe(u)[0]?.chave || "perfil";
  /** Ações (páginas com "mãe") que o perfil pode abrir a partir de uma página. */
  const acoesDe = (u, mae) => paginasDe(u).filter((p) => p.mae === mae);
  /** Formato antigo do menu ([grupo, [[chave, nome]]]) — a Wiki usa para mostrar só os assuntos das telas do perfil. */
  const menuAntigo = (u) => modulosDe(u).flatMap(([, grupos]) => grupos.map(([g, its]) => [g, its.map(([k, n]) => [k, n])]))
    .concat([["Ajuda", [["wiki", "Wiki · como usar"]]]]);
  function abasApp(u) {
    const ks = permitidas(u);
    const lista = ABAS[chavePerfil(u)] || paginasDe(u).filter((p) => !p.mae).slice(0, 5).map((p) => [p.chave, p.nome]);
    return lista.filter(([k]) => k === "+" || ks.has(k));
  }

  return { MODULO, PERFIS, SEMPRE, ETAPAS_VENDEDOR, REGISTRAR, chavePerfil, modulosDe, paginasDe, permitidas, inicial, acoesDe, menuAntigo, abasApp };
})();
