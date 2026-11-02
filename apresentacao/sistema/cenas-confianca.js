"use strict";
/* Seven One · apresentação para líderes de provedores: capítulos de confiança e visão.
   - Seus dados protegidos (logo depois da capa): camadas de proteção, vigia automático, plano de contingência e o esquema completo.
   - O que a plataforma tem, inteligência (Power BI), proposta de integração de leitura com a Claro e implementações futuras.
   Linguagem para quem não é da área técnica: o que existe e para que serve. Tudo fictício; nada é gravado.
   No fim, TOUR.ordenar() define a ordem dos capítulos (os arquivos registram em qualquer ordem). */
(() => {
  const T = window.TOUR, U = window.UI, esc = U.esc;
  const { cab, aprof, etiq } = U;
  const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    chave: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
    olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    cofre: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5V7M12 17v-1.5M8.5 12H7M17 12h-1.5"/>',
    escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    sino: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 20a2 2 0 004 0"/>',
    raio: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    lupa: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    fala: '<path d="M4 5h16v11H8l-4 4z"/>',
    volta: '<path d="M4 12a8 8 0 108-8"/><path d="M4 4v5h5"/>',
    livro: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>',
    cel: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
    tela: '<rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    mapa: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    alvo: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    grafico: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    medalha: '<circle cx="12" cy="14" r="6"/><path d="M8.5 3h7l-2 6M8.5 3l2 6"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    nuvem: '<path d="M7 18h10a4 4 0 00.6-7.95A6 6 0 006 9.5 4.3 4.3 0 007 18z"/>',
    porta: '<path d="M5 21V4a1 1 0 011-1h9l4 2v16"/><path d="M3 21h18M12 12h.01"/>',
    rede: '<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M7.3 11l9.4-4.8M7.3 13l9.4 4.8"/>',
  };
  const ICONES = I;

  /* ====== capítulos ====== */
  T.capitulo({ id: "abertura", titulo: "Seven One", curto: "Abertura", resumo: "A plataforma e o que esta apresentação mostra." });
  T.capitulo({ id: "protecao", titulo: "Seus dados protegidos", curto: "Segurança", resumo: "Como as informações estão protegidas, quem vigia e o que fazemos se algo acontecer." });
  T.capitulo({ id: "plataforma", titulo: "O que o Seven One tem", curto: "Plataforma", resumo: "Os módulos e para que serve cada um." });
  T.capitulo({ id: "inteligencia", titulo: "Inteligência para decidir", curto: "Indicadores", resumo: "Painéis de acompanhamento e o painel de BI." });
  T.capitulo({ id: "claro", titulo: "Proposta: integração de leitura com a Claro", curto: "Integração Claro", resumo: "Receber as vendas da Seven direto da Claro, sem digitar de novo." });
  T.capitulo({ id: "futuro", titulo: "O que vem por aí", curto: "Futuro", resumo: "As próximas implementações planejadas." });

  /* ================================================================== SEUS DADOS PROTEGIDOS */
  T.passo({ cap: "protecao", id: "seg-camadas", titulo: "Proteção em camadas, da porta de entrada ao cofre", tempo: 50,
    cena: () => `<div class="pad executiva conf">${cab("SEUS DADOS PROTEGIDOS", "Proteção em camadas, da porta de entrada ao cofre", "Quem entra, o que cada um vê, o que fica registrado e onde os dados ficam guardados.")}
      <div class="conteudo"><div class="col"><div class="camadas">
        <div class="camada"><div class="ic">${ic(I.chave)}</div><span class="n">1</span><h3>Quem entra</h3><ul>
          <li>Senha forte obrigatória</li><li>Código no celular (2FA) para quem quiser mais proteção</li><li>Conta bloqueada após 5 tentativas erradas</li><li>Saída automática quando o sistema fica parado</li></ul></div>
        <div class="camada"><div class="ic">${ic(I.olho)}</div><span class="n">2</span><h3>O que cada um vê</h3><ul>
          <li>Vendedor vê só as próprias vendas</li><li>Supervisor vê só a própria equipe</li><li>CPF e telefone aparecem mascarados</li><li>A regra vale no servidor e no banco, não só na tela</li></ul></div>
        <div class="camada"><div class="ic">${ic(I.lista)}</div><span class="n">3</span><h3>Tudo fica registrado</h3><ul>
          <li>Quem alterou, quando e o valor antes e depois</li><li>Quem baixou planilhas e quantas linhas</li><li>Entradas, falhas de senha e bloqueios</li><li>O histórico não se apaga: contas são desativadas</li></ul></div>
        <div class="camada"><div class="ic">${ic(I.cofre)}</div><span class="n">4</span><h3>Guardado com cuidado</h3><ul>
          <li>Conexão criptografada (o cadeado do navegador)</li><li>Banco de dados com regras de acesso por linha</li><li>Senhas guardadas de forma irreversível</li><li>Cópias de segurança do banco</li></ul></div>
      </div>
      <div class="valor-negocio"><span>O QUE ISSO SIGNIFICA PARA VOCÊ</span><p>Cada pessoa vê apenas o que precisa para trabalhar. E se alguém tentar algo errado, o sistema sabe quem, quando e o quê.</p></div>
      ${aprof([["seguranca-simples", "Perguntas comuns sobre segurança"]])}</div></div></div>`,
    notas: { objetivo: "Mostrar que a segurança é parte da plataforma, em quatro camadas fáceis de entender.", fala: "Antes de mostrar o que o sistema faz, quero mostrar como ele protege as informações. Pense em quatro camadas. Primeiro, quem entra: senha forte, bloqueio depois de cinco tentativas erradas, saída automática e, para quem quiser, o código no celular. Segundo, o que cada um vê: o vendedor só vê as próprias vendas, o supervisor só a equipe dele, e o CPF aparece mascarado. Terceiro, tudo fica registrado: quem alterou, quem baixou planilha, quem entrou. E quarto, onde os dados ficam: conexão criptografada, banco com regras por linha e cópias de segurança.", clicar: "Avançar. O botão de perguntas comuns ajuda se alguém perguntar detalhes.", observar: "As quatro camadas e a frase do quadro escuro.", transicao: "E quem fica de olho nisso o tempo todo?", simulado: "Demonstração com dados fictícios. Não afirmar certificação nem garantia de risco zero: falar em camadas de proteção e resposta rápida.", evidencia: "Senha forte e bloqueio: routes_auth.js. 2FA: routes_dois_fatores.js e totp.js. Inatividade: auth.js (ociosoDemais). Acesso por função: navegacao.js + exigePerfil + RLS (db/17). Registros: alteracao_log e conta_acesso_evento." } });

  T.passo({ cap: "protecao", id: "seg-vigia", titulo: "Um vigia que não dorme", tempo: 40,
    cena: () => `<div class="pad executiva conf">${cab("SEUS DADOS PROTEGIDOS", "Um vigia que não dorme", "A cada 2 minutos o sistema confere sinais de risco e avisa a gestão no celular.")}
      <div class="conteudo"><div class="col"><div class="cartoes c2 alertas-lista">
        <div class="cartao"><div class="ic">${ic(I.grafico)}</div><h3>Cópia grande de dados</h3><p>Alguém baixou muitas linhas ou muitas planilhas em pouco tempo.</p></div>
        <div class="cartao"><div class="ic">${ic(I.chave)}</div><h3>Tentativas de invasão</h3><p>Conta bloqueada por senha errada, ou várias contas testadas ao mesmo tempo.</p></div>
        <div class="cartao"><div class="ic">${ic(I.porta)}</div><h3>Entrada fora do horário</h3><p>Gerente, administrador ou equipe de apoio entrando de madrugada.</p></div>
        <div class="cartao"><div class="ic">${ic(I.escudo)}</div><h3>Proteção desligada</h3><p>Código no celular desligado ou senha de gerente trocada por outra pessoa.</p></div>
      </div><p class="mini" style="margin-top:22px">Os avisos chegam ao Gerente, ao Administrador e ao responsável técnico, e ficam listados na página Segurança.</p></div>
      <div class="col estreita"><div class="celular-aviso"><div class="barra">9:41</div>
        <div class="aviso-push"><b>🔒 Exportação grande de dados</b><span>Ana Souza baixou 3.500 linhas em 2 exportações na última hora.</span><i>agora</i></div>
        <div class="aviso-push"><b>🔒 Conta bloqueada por tentativas erradas</b><span>A conta de Pedro Lima foi bloqueada por 15 minutos.</span><i>há 6 min</i></div>
        <div class="aviso-push"><b>🔒 Login fora do horário</b><span>Marcos Dias (gerente) entrou de madrugada. Confirme que foi a própria pessoa.</span><i>02:47</i></div>
        <p class="legenda">Exemplo de avisos (nomes fictícios)</p></div></div></div></div>`,
    notas: { objetivo: "Mostrar que existe vigilância automática e quem é avisado.", fala: "Ter regras não basta: alguém precisa perceber quando algo foge do padrão. O Seven One tem um vigia automático. A cada dois minutos ele confere quatro tipos de sinal: alguém copiando muitos dados, tentativas de descobrir senha, entrada de madrugada de quem tem acesso amplo e proteções sendo desligadas. Quando acontece, a gestão recebe o aviso no celular na hora, e fica tudo listado na página de Segurança.", clicar: "Avançar.", observar: "O celular com os avisos.", transicao: "E se algo acontecer de verdade?", simulado: "Nomes e números dos avisos são fictícios. Os avisos dependem de a pessoa ter ativado as notificações no aparelho.", evidencia: "api/src/vigia.js (regras e limites), notificacoes.js (envio), routes_seguranca.js (lista na página)." } });

  T.passo({ cap: "protecao", id: "seg-contingencia", titulo: "Se algo acontecer: o plano de contingência", tempo: 50,
    cena: () => `<div class="pad executiva conf">${cab("SEUS DADOS PROTEGIDOS", "Se algo acontecer: o plano de contingência", "Um passo a passo escrito antes do problema, para agir em minutos e não em dias.")}
      <div class="conteudo"><div class="col"><ol class="trilha">
        <li><span class="ic">${ic(I.lupa)}</span><b>1. Detectar</b><p>Alerta do vigia, aviso de um colaborador ou da operadora.</p></li>
        <li class="destaque"><span class="ic">${ic(I.raio)}</span><b>2. Conter em minutos</b><p>Botão de emergência: tira todo mundo do sistema e trava as exportações.</p></li>
        <li><span class="ic">${ic(I.lista)}</span><b>3. Investigar</b><p>O registro mostra o que foi visto, por quem e quando.</p></li>
        <li><span class="ic">${ic(I.fala)}</span><b>4. Comunicar</b><p>Clientes afetados, autoridade de proteção de dados e parceiros, no prazo da lei.</p></li>
        <li><span class="ic">${ic(I.volta)}</span><b>5. Recuperar</b><p>Senhas novas, chaves trocadas e o serviço volta só com a causa resolvida.</p></li>
        <li><span class="ic">${ic(I.livro)}</span><b>6. Aprender</b><p>Revisão do que falhou e simulação do plano a cada 6 meses.</p></li>
      </ol>
      <div class="emergencia"><div><span class="selo">BOTÃO DE EMERGÊNCIA</span><h3>Dois cliques para conter</h3><p>Só a gestão tem acesso. Cada uso fica registrado com nome e hora.</p></div>
        <div class="botoes-emerg"><div class="b"><b>Encerrar todas as sessões</b><span>todos saem em até 15 segundos</span></div><div class="b"><b>Travar exportações</b><span>ninguém baixa planilhas até liberar</span></div></div></div>
      </div></div></div>`,
    notas: { objetivo: "Transmitir preparo: existe um plano escrito e ferramentas para conter rápido.", fala: "Nenhuma empresa consegue prometer risco zero. O que transmite confiança é estar preparado. Temos um plano de contingência escrito, em seis passos. O mais importante é o segundo: conter em minutos. A gestão tem um botão de emergência que tira todo mundo do sistema em até quinze segundos e trava qualquer exportação de planilha. Depois, o registro mostra exatamente o que aconteceu, e o plano diz quem avisar e em qual prazo, como pede a Lei Geral de Proteção de Dados.", clicar: "Avançar.", observar: "O passo 2 e o quadro do botão de emergência.", transicao: "Juntando tudo: o esquema completo.", simulado: "O prazo legal de comunicação (ANPD, 3 dias úteis) está no plano e deve ser confirmado com o jurídico; não citar número se não perguntarem.", evidencia: "docs/PLANO_CONTINGENCIA_VAZAMENTO.md; página Segurança (pg_seguranca.js, routes_seguranca.js)." } });

  const linhaA = (risco, prot) => `<tr><td><b>${risco}</b></td><td>${prot}</td></tr>`;
  T.passo({ cap: "protecao", id: "seg-esquema", titulo: "O esquema completo: cada risco tem uma resposta", tempo: 50,
    cena: () => `<div class="pad executiva conf">${cab("SEUS DADOS PROTEGIDOS", "O esquema completo: cada risco tem uma resposta", "O que poderia acontecer e como o Seven One se protege.")}
      <div class="conteudo"><div class="col"><table class="riscos"><thead><tr><th>Se acontecer…</th><th>O Seven One…</th></tr></thead><tbody>
        ${linhaA("Alguém descobre a senha de um colaborador", "pede o código do celular (2FA), bloqueia após 5 tentativas e avisa a gestão")}
        ${linhaA("Um computador fica aberto ou um celular é perdido", "sai sozinho após 2 horas parado (8 horas com 2FA); “sair de todos os aparelhos” em um clique")}
        ${linhaA("Um colaborador sai da empresa", "o acesso é desligado e cai na hora em todos os aparelhos, sem apagar o histórico")}
        ${linhaA("Alguém tenta copiar a base de clientes", "limite diário de exportação, alerta de cópia grande e trava geral de exportações")}
        ${linhaA("Um vendedor tenta ver dados de outro", "o servidor e o banco recusam: cada um só recebe o que é seu")}
        ${linhaA("Uma informação é alterada por engano ou de propósito", "o histórico guarda quem alterou, quando e o valor anterior")}
        ${linhaA("Ataque automático de tentativas", "limite de tentativas por aparelho e por pessoa, com bloqueio temporário")}
        ${linhaA("Problema no servidor", "monitoramento contínuo, cópias de segurança e procedimento de volta da versão anterior")}
      </tbody></table></div>
      <div class="col estreita"><div class="cartao escuro"><h3>Em construção, com transparência</h3><ul class="lista-clara">
        <li>Teste periódico de restauração das cópias de segurança</li><li>Monitor externo do sistema 24 horas</li><li>Aprovação da gestão para exportar dados completos</li><li>Registro de quem visualizou dados de clientes</li></ul>
        <p style="margin-top:14px">Preferimos mostrar o que ainda está sendo feito a prometer o que não existe.</p></div></div></div></div>`,
    notas: { objetivo: "Fechar a segurança com o mapa risco × resposta, em linguagem simples, e com honestidade sobre o que está em construção.", fala: "Para fechar a parte de segurança, um resumo direto: para cada coisa que poderia dar errado, existe uma resposta no sistema. Senha descoberta, computador esquecido aberto, colaborador que saiu, alguém tentando copiar a base, um vendedor querendo ver o que não é dele, alteração indevida, ataque automático, problema no servidor. E à direita está o que ainda estamos construindo. Prefiro mostrar isso com transparência.", clicar: "Avançar.", observar: "A tabela e o quadro escuro.", transicao: "Agora, o que a plataforma oferece no dia a dia.", simulado: "Itens 'em construção' não existem ainda: não afirmar como prontos.", evidencia: "Inatividade: auth.js; limite de exportação: routes_seguranca.js (EXPORT_LIMITE_DIA_LINHAS); desligar acesso: db/11_seguranca.sql (token_versao); limites de tentativas: routes_auth.js e server.js; monitoramento: monitor.js, docs/MONITORAMENTO.md." } });

  /* ================================================================== O QUE O SEVEN ONE TEM */
  const mod = (icone, t, p) => `<div class="cartao modulo"><div class="ic">${ic(icone)}</div><h3>${t}</h3><p>${p}</p></div>`;
  T.passo({ cap: "plataforma", id: "modulos", titulo: "Tudo o que a operação precisa, em um só lugar", tempo: 45,
    cena: () => `<div class="pad executiva conf">${cab("O QUE O SEVEN ONE TEM", "Tudo o que a operação precisa, em um só lugar", "Cada módulo resolve uma parte do dia a dia. Juntos, acompanham a venda do início ao fim.")}
      <div class="conteudo"><div class="col"><div class="cartoes c4 modulos">
        ${mod(I.cel, "App do vendedor", "Pedir viabilidade, enviar a venda, acompanhar contratos, agenda e premiação pelo celular.")}
        ${mod(I.mapa, "Viabilidade e envio de vendas", "Fila única para a equipe de apoio responder endereço, crédito e linha, com conversa da venda.")}
        ${mod(I.lista, "Vendas e contratos", "Cada venda com situação, produtos e histórico; lançamento em lote e importação de planilhas.")}
        ${mod(I.porta, "Rota de instalação", "Agenda do dia, confirmação na véspera e baixa de instalada, reagendada ou cancelada.")}
        ${mod(I.check, "Qualidade pós-venda", "Ligações de confirmação, primeira fatura (FPD), cobrança e clientes em risco de cancelar.")}
        ${mod(I.medalha, "Metas e premiação", "Meta geral do mês dividida pelos líderes e premiação calculada com as regras do plano.")}
        ${mod(I.grafico, "Painel e previsões", "Resultado do mês, projeção de fechamento, ritmo de cada equipe e quem ainda não vendeu hoje.")}
        ${mod(I.escudo, "Segurança e auditoria", "Acessos por função, histórico de alterações, alertas automáticos e botão de emergência.")}
      </div><div class="valor-negocio"><span>PARA QUEM</span><p>Vendedor no celular · equipe de apoio no computador · supervisores e coordenadores acompanhando a equipe · gestão com a visão do todo.</p></div></div></div></div>`,
    notas: { objetivo: "Dar a visão geral do produto: o que existe e para que serve.", fala: "Este é o mapa do Seven One. São oito módulos. O app do vendedor, onde a venda começa. A viabilidade e o envio de vendas, onde a equipe de apoio responde numa fila única. Vendas e contratos, com o histórico de cada uma. A rota de instalação. A qualidade depois da venda: confirmação, primeira fatura, cobrança. Metas e premiação. O painel com previsão de fechamento. E a segurança que acabamos de ver. Cada pessoa acessa só o que precisa.", clicar: "Avançar.", observar: "Os oito módulos.", transicao: "Vamos ver como isso aparece no dia a dia.", simulado: "Funcionalidades existentes no sistema; dados das telas são fictícios.", evidencia: "api/public/navegacao.js (módulos e telas por perfil)." } });

  /* ================================================================== INTELIGÊNCIA */
  const PBI = "https://app.powerbi.com/view?r=eyJrIjoiY2UwYTFlYjUtMDZiMy00NzVkLTkxMmEtYjQxM2RkYWZkZWRiIiwidCI6IjY1OWNlMmI4LTA3MTQtNDE5OC04YzM4LWRjOWI2MGFhYmI1NyJ9";
  T.passo({ cap: "inteligencia", id: "bi", titulo: "Indicadores para decidir durante o mês, não depois", tempo: 40,
    cena: () => `<div class="pad executiva conf">${cab("INTELIGÊNCIA PARA DECIDIR", "Indicadores para decidir durante o mês, não depois", "O que acontece na operação vira número no mesmo dia.")}
      <div class="conteudo"><div class="col"><div class="cartoes c3">
        <div class="cartao"><div class="ic">${ic(I.grafico)}</div><h3>No próprio sistema</h3><p>Painel do mês, previsão de fechamento, ritmo por equipe, qualidade e premiação, atualizados com cada venda.</p></div>
        <div class="cartao"><div class="ic">${ic(I.rede)}</div><h3>No Power BI</h3><p>Os mesmos dados alimentam painéis de BI para a diretoria cruzar vendas, instalação, cidades e períodos.</p></div>
        <div class="cartao"><div class="ic">${ic(I.alvo)}</div><h3>Para agir</h3><p>Desvios aparecem com a explicação do cálculo: qual equipe está abaixo do ritmo e quanto falta por dia.</p></div>
      </div>
      <div class="bi-chamada"><div><h3>Painel de indicadores no Power BI</h3><p>Abre em uma nova aba, fora desta demonstração.</p></div>
        <a class="bi-botao" href="${PBI}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Abrir o painel de BI ${ic(I.seta)}</a></div>
      ${aprof([["demo-gestor", "Ver o painel do gerente (demonstração)"]])}</div></div></div>`,
    notas: { objetivo: "Mostrar a camada de inteligência: painel no sistema e BI para a diretoria.", fala: "Toda essa operação vira informação para decidir. No próprio sistema, o painel mostra o resultado do mês e a previsão de fechamento. E os mesmos dados alimentam o Power BI, para a diretoria cruzar vendas, instalação, cidades e períodos. Posso abrir o painel de BI agora, se quiserem ver.", clicar: "Se pedirem, clicar em 'Abrir o painel de BI' (abre em nova aba). Para o painel do sistema, usar o botão da demonstração.", observar: "As três formas de usar os números.", transicao: "Agora, uma proposta para dar um passo além.", simulado: "O painel de BI é externo à demonstração; confira antes se ele pode ser mostrado ao público presente.", evidencia: "Camada de BI: db/41_bi_fabric.sql; painel: pg_dash.js." } });

  /* ================================================================== PROPOSTA CLARO */
  T.passo({ cap: "claro", id: "claro-hoje", titulo: "Hoje cada venda é digitada duas vezes. Não precisa ser assim.", tempo: 50,
    cena: () => `<div class="pad executiva conf">${cab("PROPOSTA · INTEGRAÇÃO DE LEITURA COM A CLARO", "Hoje cada venda é digitada duas vezes. Não precisa ser assim.", "Se a Claro liberar a visualização somente das vendas da Seven, o Seven One recebe tudo sozinho.")}
      <div class="conteudo"><div class="col"><div class="comparar">
        <div class="lado hoje"><span class="selo">HOJE</span><ol>
          <li>O vendedor finaliza a venda no sistema da Claro</li><li>A equipe de apoio digita a mesma venda de novo no Seven One</li><li>A situação (instalada, cancelada) é conferida à mão</li><li>Planilhas são exportadas e importadas para fechar o mês</li><li>Divergências aparecem tarde, no fechamento</li></ol></div>
        <div class="seta-grande">${ic(I.seta)}</div>
        <div class="lado depois"><span class="selo">COM A INTEGRAÇÃO</span><ol>
          <li>O vendedor finaliza a venda no sistema da Claro</li><li>O Seven One lê a venda automaticamente, em minutos</li><li>Instalação, cancelamento e situação se atualizam sozinhos</li><li>O fechamento do mês bate com o que a Claro registrou</li><li>A equipe usa o tempo para vender e resolver pendências</li></ol></div>
      </div>
      <div class="cartoes c4 ganhos">
        <div class="cartao"><h3>Fim da digitação em dobro</h3><p>Horas da equipe de apoio liberadas todo dia.</p></div>
        <div class="cartao"><h3>Menos erro</h3><p>Número de contrato, plano e cliente vêm direto da fonte.</p></div>
        <div class="cartao"><h3>Situação em tempo real</h3><p>Gestão vê instalação e cancelamento no mesmo dia.</p></div>
        <div class="cartao"><h3>Premiação conferida</h3><p>O cálculo usa o mesmo dado que a Claro usa para pagar.</p></div>
      </div></div></div></div>`,
    notas: { objetivo: "Apresentar o problema atual e o ganho da proposta de forma concreta.", fala: "Hoje, cada venda é digitada duas vezes: o vendedor finaliza no sistema da Claro e a nossa equipe digita a mesma venda de novo no Seven One. Depois, a situação de cada contrato é conferida à mão. A proposta é simples: a Claro libera para nós a visualização somente das vendas da Seven. Com isso, o Seven One lê as vendas sozinho, a situação se atualiza sem ninguém digitar e o fechamento do mês bate com o que a Claro registrou. É menos trabalho, menos erro e informação no mesmo dia.", clicar: "Avançar.", observar: "Os dois lados e os quatro ganhos.", transicao: "E como isso funcionaria, sem mexer no sistema da Claro?", simulado: "É uma proposta: a integração depende de acordo e liberação da Claro. Hoje o sistema importa a exportação de vendas da Claro (planilha).", evidencia: "Importação atual: api/src/routes_importacao.js (exportação de vendas da Claro)." } });

  T.passo({ cap: "claro", id: "claro-como", titulo: "Como funcionaria, sem tocar no sistema da Claro", tempo: 50,
    cena: () => `<div class="pad executiva conf">${cab("PROPOSTA · INTEGRAÇÃO DE LEITURA COM A CLARO", "Como funcionaria, sem tocar no sistema da Claro", "Acesso somente de leitura, só às vendas da Seven, com a Claro no controle.")}
      <div class="conteudo"><div class="col"><div class="fluxo-claro">
        <div class="no claro"><div class="ic">${ic(I.nuvem)}</div><b>Sistema da Claro</b><span>continua igual</span></div>
        <div class="tubo"><span>somente leitura</span><span>só vendas da Seven</span><span>conexão protegida</span>${ic(I.seta)}</div>
        <div class="no one"><div class="ic">${ic(I.escudo)}</div><b>Seven One</b><span>lê, organiza e acompanha</span></div>
      </div>
      <div class="cartoes c3 regras">
        <div class="cartao"><h3>Somente leitura</h3><p>O Seven One não cria, não altera e não apaga nada na Claro. Nenhum risco para o sistema dela.</p></div>
        <div class="cartao"><h3>Só as vendas da Seven</h3><p>O filtro é feito do lado da Claro, pelo código do parceiro. Nenhum outro cliente é visível.</p></div>
        <div class="cartao"><h3>A Claro no controle</h3><p>Credencial exclusiva, registro de cada consulta e acesso que pode ser suspenso a qualquer momento.</p></div>
      </div>
      <div class="etapas-linha"><div><span>1</span>Acordo e termo de uso dos dados</div><div><span>2</span>Credencial de leitura liberada pela Claro</div><div><span>3</span>Teste com um mês, comparando com a planilha</div><div><span>4</span>Ligar de vez (a planilha fica como reserva)</div></div>
      <p class="mini" style="margin-top:16px">Formatos possíveis, à escolha da Claro: consulta direta (API), relatório automático programado ou cópia de leitura dos dados da Seven.</p></div></div></div>`,
    notas: { objetivo: "Tranquilizar sobre riscos e mostrar um caminho simples de adoção.", fala: "Funcionaria assim. O sistema da Claro continua exatamente igual. A Claro libera uma credencial de leitura que só enxerga as vendas da Seven, com o filtro feito do lado dela. O Seven One só lê: não cria, não altera e não apaga nada. A Claro mantém o controle: cada consulta fica registrada e o acesso pode ser suspenso a qualquer momento. Para começar, bastam quatro passos: um acordo de uso dos dados, a credencial, um mês de teste comparando com a planilha e, se tudo bater, ligamos de vez. A planilha continua como reserva.", clicar: "Avançar.", observar: "A seta de leitura e as três regras.", transicao: "Essa é uma das implementações que planejamos.", simulado: "Proposta a negociar com a Claro; não existe integração automática hoje. Formatos e prazos dependem da Claro.", evidencia: "Hoje: importação da exportação de vendas (routes_importacao.js), com o mesmo cuidado de dados (registro e permissões)." } });

  /* ================================================================== FUTURO */
  T.passo({ cap: "futuro", id: "roadmap", titulo: "O que vem por aí", tempo: 45,
    cena: () => `<div class="pad executiva conf">${cab("O QUE VEM POR AÍ", "O que vem por aí", "Implementações planejadas. Prioridade e datas são combinadas com a operação.")}
      <div class="conteudo"><div class="col"><div class="roadmap">
        <div class="fase"><span class="selo">PRÓXIMAS SEMANAS</span><ul>
          <li><b>Código no celular por QR code</b>ativar o 2FA apontando a câmera</li>
          <li><b>Teste mensal das cópias de segurança</b>restaurar e conferir, com registro</li>
          <li><b>Monitor externo 24 horas</b>aviso se o sistema ficar fora do ar</li>
          <li><b>Aprovação para exportar dados completos</b>a gestão autoriza antes de baixar CPF</li></ul></div>
        <div class="fase"><span class="selo">EM SEGUIDA</span><ul>
          <li><b>Integração de leitura com a Claro</b>vendas e situação sem digitar de novo</li>
          <li><b>Painéis de BI dentro do sistema</b>indicadores da diretoria sem sair do Seven One</li>
          <li><b>Avisos também por e-mail e WhatsApp</b>alertas e resumos para quem não usa o app</li>
          <li><b>Registro de quem viu dados de clientes</b>auditoria também da consulta</li></ul></div>
        <div class="fase"><span class="selo">DEPOIS</span><ul>
          <li><b>Vários provedores e canais</b>cada empresa com seus dados separados</li>
          <li><b>Relatórios automáticos para a diretoria</b>resumo semanal e de fechamento</li>
          <li><b>Previsão inteligente de metas</b>sugestão de meta por equipe com base no histórico</li>
          <li><b>App com uso sem internet</b>pedir viabilidade mesmo com sinal fraco</li></ul></div>
      </div><div class="valor-negocio"><span>COMO CADA NOVIDADE CHEGA</span><p>Testes automáticos antes de publicar, revisão independente e publicação acompanhada, sem parar a operação.</p></div></div></div></div>`,
    notas: { objetivo: "Mostrar visão de futuro e que o produto continua evoluindo.", fala: "E o Seven One continua evoluindo. Nas próximas semanas: ativar o código no celular por QR code, testar todo mês as cópias de segurança, um monitor externo vinte e quatro horas e a aprovação da gestão antes de exportar dados completos. Em seguida, a integração de leitura com a Claro, os painéis de BI dentro do sistema, avisos por e-mail e WhatsApp e o registro de quem visualizou dados de clientes. Depois, abrir para vários provedores, cada um com seus dados separados, relatórios automáticos, previsão de metas e o app funcionando mesmo com sinal fraco.", clicar: "Avançar.", observar: "As três colunas.", transicao: "Para encerrar, como avaliar.", simulado: "Tudo nesta cena é planejado, não existe ainda. Datas a combinar.", evidencia: "Planejamento do produto; pendências em docs/PLANO_CONTINGENCIA_VAZAMENTO.md (seção 10)." } });

  /* ================================================================== APOIO */
  T.aprofundamento("seguranca-simples", { titulo: "Perguntas comuns sobre segurança", etiqueta: "Respostas curtas, sem termos técnicos", html: `
    <h3>Alguém de fora consegue ver os dados?</h3><p>Só com um acesso válido. Cada acesso é pessoal, com senha forte, bloqueio por tentativas e, se a pessoa ligar, código no celular. A conexão é criptografada.</p>
    <h3>Um vendedor consegue ver as vendas de outro?</h3><p>Não. A regra é aplicada no servidor e no banco de dados, não só na tela. Supervisor vê a própria equipe; coordenador, as equipes dele.</p>
    <h3>E se um funcionário sair levando a senha?</h3><p>Ao desligar o acesso, todas as sessões dele caem na hora, em qualquer aparelho. O histórico do que ele fez continua guardado.</p>
    <h3>Dá para saber quem baixou uma planilha?</h3><p>Sim: quem, quando, quantas linhas e com quais filtros. Exportação grande gera alerta, e existe limite diário por pessoa.</p>
    <h3>O que acontece se houver um vazamento?</h3><p>Seguimos o plano de contingência: conter em minutos com o botão de emergência, investigar pelo registro, comunicar quem precisa ser avisado no prazo da lei e corrigir a causa.</p>
    <h3>Os dados ficam onde?</h3><p>Em banco de dados em nuvem, com regras de acesso por linha e cópias de segurança. As senhas são guardadas de forma que nem a equipe técnica consegue ler.</p>
    <div class="botoes-aprof"><button data-aprofundar="seguranca">Inventário técnico (para a equipe de TI)</button></div>` });

  /* ================================================================== ORDEM DOS CAPÍTULOS */
  T.ordenar(["abertura", "protecao", "quem", "plataforma", "desafio", "jornada", "comunicacao", "acompanhamento", "inteligencia", "claro", "integracoes", "futuro", "contribuicao"]);
  window.ICONES_CONFIANCA = ICONES;
})();
