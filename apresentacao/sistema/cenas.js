"use strict";
/* Seven One · apresentação executiva: capítulos 1 a 5 (valor para a empresa, desafio, jornada da venda, comunicação, acompanhamento).
   Tudo fictício: pessoas, cliente, números. Os campos, status e regras são os do sistema (ver notas de cada cena).
   Edite PERFIL para ajustar a sua apresentação pessoal. */
(() => {
  const T = window.TOUR, U = window.UI, esc = U.esc;
  const { cel, celAbas, campo, vendaCel, web, pedido, seta, etiq, cab, aprof, fonte } = U;

  /* ====== ajuste aqui o que é seu ====== */
  const PERFIL = {
    nome: "Vinícius Ribeiro da Silva",
    funcao: "Desenvolvedor do Seven One",
    desde: "desde 23 de setembro de 2026",             // deixe vazio para não mostrar
    atual: "Analista de Dados no Ministério do Desenvolvimento Social e Combate à Fome (em saída, com o fim da licitação)",
    formacao: "Pós-graduado em Ciência de Dados",
    frase: "Conheço a operação por dentro e construí o sistema que a acompanha, do app do vendedor ao painel da gestão.",
  };
  window.PERFIL = PERFIL;

  /* ====== personagens e a venda da história (fictícios) ====== */
  const P = {
    vend: "Rafael Moura", vendIni: "RM", equipe: "Samambaia", sup: "Rodrigo Teles",
    bko: "Juliana Castro", bkoIni: "JC", gestora: "Luciana Abreu", gestIni: "LA",
    cliente: "Carlos Eduardo Nunes Sampaio", cpf: "025.•••.•••-11", tel: "(61) 9 9812-•••7",
    cep: "72327-503", rua: "QR 425 Conjunto 3", num: "Casa 22", bairro: "Samambaia Norte", cidade: "Brasília", uf: "DF",
    viab: "1914", hp: "48219077", solar: "2332", contrato: "61214521",
    produtos: "Internet 500 Mega + Claro TV+ Box", pacote: "R$ 189,90", venc: "10", pgto: "DCC (débito em conta)",
    agenda: "27/10", agendaRot: "terça, 27/10 · manhã (08:00 às 12:00)", turno: "08:00 AS 12:00",
    obsVend: "Cliente mora na casa dos fundos, entrada pela rua lateral. Precisa da análise de crédito hoje, ele fecha agora.",
    respBko: "Atende. HP 48219077. Crédito aprovado. Pode finalizar no Solar.",
    chatBko: "Recebi a venda Solar nº 2332. Vou lançar o contrato agora e agendar a instalação para terça de manhã.",
    chatVend: "Perfeito. O cliente pediu ligação 30 min antes do técnico chegar.",
  };
  window.HISTORIA = P;

  /* ====== estado inicial da história (recalculado a cada passo) ====== */
  T.inicial(() => ({
    hora: "14:21", viab: null, ve: null, venda: null, pushGestora: null, pushRafael: null, toastWeb: null, toastApp: null,
    ind: { rafaelBl: 17, rafaelVendas: 21, samBl: 112, samVendas: 142, empBl: 812, validas: 950, lancadas: 1034, pend: 352, proj: 1060 },
    badgeOp: 10, viabAbertas: 3, csAndamento: 2, contratosMes: 21, delta: false,
  }));

  /* ====== capítulos ====== */
  T.capitulo({ id: "quem", titulo: "Por que considerar o Seven One", curto: "Valor", resumo: "O que o sistema faz e o que cada área pode ganhar com ele." });
  T.capitulo({ id: "desafio", titulo: "O desafio operacional", curto: "Desafio", resumo: "O que motivou o sistema: a operação antes e o caminho de uma venda." });
  T.capitulo({ id: "jornada", titulo: "A jornada da venda: app e sistema web", curto: "Jornada", resumo: "O vendedor pede a viabilidade no app; o backoffice recebe no sistema web, na hora." });
  T.capitulo({ id: "comunicacao", titulo: "Vendedor e backoffice conversando", curto: "Comunicação", resumo: "Mensagem, resposta, venda no Solar e contrato lançado." });
  T.capitulo({ id: "acompanhamento", titulo: "Acompanhamento: vendedor e gestão", curto: "Acompanhamento", resumo: "O vendedor vê a própria venda andar; a gestão vê o reflexo nos indicadores." });
  T.capitulo({ id: "integracoes", titulo: "Como adotar na empresa", curto: "Adoção", resumo: "Onde o Seven One se encaixa e como começar com uma equipe." });
  T.capitulo({ id: "seguranca", titulo: "Confiança e controle", curto: "Controle", resumo: "Acesso por função, histórico de alterações e cuidado com a continuidade." });
  T.capitulo({ id: "contribuicao", titulo: "Por que contratar e como avaliar", curto: "Decisão", resumo: "Razões para considerar o sistema e critérios para decidir com um piloto." });

  /* ================================================================== 1. VALOR PARA A EMPRESA */
  T.passo({ cap: "abertura", id: "capa", titulo: "Seven One: segurança, controle e inteligência", tempo: 30, classe: "escura",
    cena: () => `<div class="capa"><div class="marca marca-one"><img src="assets/seven-one-branco.png" alt="Seven One"><span>Plataforma Integrada de Gestão<br>e Inteligência Operacional</span></div>
      <div class="cap-n">APRESENTAÇÃO PARA LÍDERES DE PROVEDORES</div>
      <h1>Controle de cada venda.<br>Dados protegidos de ponta a ponta.</h1>
      <p class="sub">O Seven One reúne vendedores, equipe de apoio e gestão em uma só plataforma: da venda à instalação, à qualidade e à premiação, com segurança em cada etapa.</p>
      <div class="pontos"><span>Segurança em camadas</span><span>Tudo registrado</span><span>Alertas automáticos</span><span>Decisões durante o mês</span></div>
      <div class="assin">${esc(PERFIL.nome)} · ${esc(PERFIL.funcao)}</div>
      <p class="aviso-ficticio">Todos os nomes, clientes, equipes e números desta apresentação são fictícios.</p></div>`,
    notas: { objetivo: "Abrir com a promessa: controle e segurança.", fala: "Boa noite. Este é o Seven One, a plataforma que reúne toda a operação de vendas: o vendedor no celular, a equipe de apoio no computador e a gestão com a visão do resultado. Vou começar pelo que mais importa para quem lida com dados de clientes: como as informações estão protegidas. Depois mostro o que a plataforma faz, uma proposta de integração com a Claro e o que vem por aí. Todos os dados que vocês vão ver são fictícios.", clicar: "Avançar.", observar: "A marca e as quatro palavras-chave.", transicao: "Primeiro, a segurança." } });

  T.passo({ cap: "quem", id: "quem-sou", titulo: "Cada área sabe o que precisa fazer", tempo: 40,
    cena: () => `<div class="pad executiva">${cab("1 · O VALOR PARA A EMPRESA", "Cada área sabe o que precisa fazer", "Um processo compartilhado, com uma visão adequada a cada função.")}<div class="conteudo"><div class="col"><div class="cartoes c3"><div class="cartao"><h3>Vendedor</h3><p>Solicita a análise do endereço, recebe a resposta e acompanha suas vendas e metas pelo celular.</p></div><div class="cartao"><h3>Equipe de apoio</h3><p>Organiza pedidos por fila, registra respostas e acompanha instalação e pendências.</p></div><div class="cartao"><h3>Gestão</h3><p>Acompanha metas, equipes, cancelamentos e qualidade para definir onde agir.</p></div></div><div class="valor-negocio"><span>O GANHO PARA A EMPRESA</span><p>A informação acompanha a venda. A equipe passa a consultar o andamento no mesmo processo.</p></div>${aprof([["equipe-produto", "Quem desenvolve o Seven One"], ["telas", "Ver telas do sistema"]])}</div></div></div>`,
    notas: { objetivo: "Um processo compartilhado, com uma visão adequada a cada função.", fala: "Para o vendedor, significa acompanhar a venda sem depender de uma nova mensagem a cada etapa. Para a equipe de apoio, chamada backoffice nas telas, significa fila, responsável e histórico. Para a gestão, significa saber durante o mês onde estão os desvios. A proposta é dar clareza de ação para cada pessoa.", clicar: "Avançar; use os botões de apoio apenas se houver perguntas.", observar: "Cada área sabe o que precisa fazer", simulado: "Exemplos e dados da demonstração são fictícios. Benefícios são possibilidades a validar na operação; não há promessa de economia ou receita. Piloto e condições comerciais são propostas, não funcionalidades contratadas.", evidencia: "README.md: funcionalidades e perfis; api/public/navegacao.js" } });

  /* ================================================================== 2. DESAFIO */
  T.passo({ cap: "desafio", id: "antes", titulo: "Quando a informação se espalha, o controle fica mais difícil", tempo: 40,
    cena: () => `<div class="pad executiva">${cab("2 · O DESAFIO OPERACIONAL", "Quando a informação se espalha, o controle fica mais difícil", "Planilhas, mensagens e sistemas da operadora precisam conversar no trabalho diário.")}<div class="conteudo"><div class="col"><div class="cartoes c3"><div class="cartao"><h3>Pedidos sem uma fila única</h3><p>É mais difícil enxergar o que está esperando e quem deve responder.</p></div><div class="cartao"><h3>Situações em lugares diferentes</h3><p>Vendedor e apoio precisam conferir mensagens e controles para reconstruir o andamento.</p></div><div class="cartao"><h3>Resultado consolidado à mão</h3><p>A gestão precisa reunir informações para comparar metas, equipes e qualidade.</p></div></div><div class="valor-negocio"><span>O GANHO PARA A EMPRESA</span><p>O Seven One organiza esse acompanhamento em um lugar: situação, responsável, histórico e indicadores.</p></div></div></div></div>`,
    notas: { objetivo: "Planilhas, mensagens e sistemas da operadora precisam conversar no trabalho diário.", fala: "A pergunta aqui é simples: quanto esforço sua equipe faz para descobrir como está uma venda? O projeto já lê a planilha de controle da operação e convive com os sistemas da Claro. O Seven One organiza o acompanhamento entre essas etapas. Em uma nova empresa, precisamos mapear quais desses problemas realmente existem antes de estimar qualquer ganho.", clicar: "Avançar; use os botões de apoio apenas se houver perguntas.", observar: "Quando a informação se espalha, o controle fica mais difícil", simulado: "Exemplos e dados da demonstração são fictícios. Benefícios são possibilidades a validar na operação; não há promessa de economia ou receita. Piloto e condições comerciais são propostas, não funcionalidades contratadas.", evidencia: "db/importar_planilha_vendas.py; README.md" } });

  T.passo({ cap: "desafio", id: "caminho", titulo: "O caminho de uma venda no Seven One", tempo: 45,
    cena: () => `<div class="pad">${cab("CAPÍTULO 2 · O DESAFIO", "O Seven One segue a venda em cada etapa", "Viabilidade é a análise do endereço e do crédito. Backoffice é a equipe de apoio à venda.")}
      <div class="conteudo"><div class="col"><div class="timeline">
        <div class="tl"><div class="q">1 · APP</div><b>Viabilidade</b><span>O vendedor pede; o backoffice de Cadastro responde na fila.</span></div>
        <div class="tl"><div class="q">2 · APP</div><b>Conexão / Solar</b><span>Venda finalizada nos sistemas da Claro e enviada ao Cadastro.</span></div>
        <div class="tl"><div class="q">3 · WEB</div><b>Contrato lançado</b><span>Cadastro lança a venda com cliente, produtos e agendamento.</span></div>
        <div class="tl"><div class="q">4 · WEB</div><b>Rota e instalação</b><span>Confirmação na véspera; instalado na rota deixa a venda instalada.</span></div>
        <div class="tl"><div class="q">5 · WEB</div><b>Qualidade</b><span>Contato após a instalação, faturas em atraso e cancelamentos nos primeiros meses.</span></div>
        <div class="tl"><div class="q">6 · WEB</div><b>Premiação</b><span>Resultado do mês por pessoa, pelo plano do mês, congelado ao fechar.</span></div>
      </div>
      <div class="cartoes c4" style="margin-top:34px">
        <div class="cartao"><div class="grande">7<small>perfis</small></div><p>vendedor, supervisor, coordenador, Cadastro, Qualidade, gerente, administrador</p></div>
        <div class="cartao"><div class="grande">2<small>jeitos de usar</small></div><p>app instalado no celular (vendedor e supervisor) e sistema web no computador</p></div>
        <div class="cartao"><div class="grande">1<small>regra por número</small></div><p>Metas e ritmo de vendas seguem a mesma regra no celular e no painel da gestão.</p></div>
        <div class="cartao"><h3>Próximo passo visível</h3><p>Cada função acompanha suas tarefas, sem perder o contexto da venda.</p></div>
      </div>
      ${aprof([["novidades", "O que entrou nas últimas semanas"]])}</div></div></div>`,
    notas: { objetivo: "Dar o mapa antes do passeio: seis etapas. A partir daqui, a venda do Rafael percorre esse caminho.",
      fala: "O Seven One segue a venda em seis etapas: viabilidade, venda no Conexão ou no Solar, contrato lançado, rota de instalação, qualidade e premiação. Sete perfis, cada um vendo só o que usa; o vendedor pelo app no celular, o resto pelo computador. E uma regra só para cada número: a meta e o ritmo que o vendedor vê no app são os mesmos do painel do gerente.\nVamos ver isso acontecendo com uma venda.",
      clicar: "Nada. 'O que entrou nas últimas semanas' lista as novidades, se perguntarem.", observar: "As seis etapas e a responsabilidade de cada área.",
      evidencia: "api/public/navegacao.js (perfis e páginas: 31 chaves para o gerente); README.md; api/src/fechamento.js (regra única de ritmo).", transicao: "Capítulo 3: sábado à tarde, Rafael está na rua com um cliente." } });

  /* ================================================================== 3. JORNADA */
  const inicioApp = (S) => `<div class="app-corpo">
      <div class="card"><h5>Meu mês · BL vendida · meta do plano</h5><div class="g ${S.delta ? "dest" : ""}">${S.ind.rafaelBl} <small>de 20</small></div>
        <div class="barra-meta"><i style="width:${S.ind.rafaelBl / 20 * 100}%"></i><em style="left:75%"></em></div><div class="micro" style="display:flex;justify-content:space-between"><span>esperado até hoje: 15</span><span>meta 20</span></div>
        <div style="color:var(--ok);font-weight:600;font-size:14px;margin-top:6px">● No ritmo da meta · projeção ${Math.round(S.ind.rafaelBl / 18 * 23.5)}</div>
        <div class="kpis3"><div><b>0,5</b>BL por dia útil para a meta</div><div><b>${S.ind.rafaelVendas - 2}</b>vendas válidas no mês</div><div><b>3º de 8</b>na equipe em BL</div></div></div>
      <div class="secao">Para fazer agora <a>Ver tudo (4)</a></div>
      <div class="item"><div class="ic crit">!</div><div class="tx"><b>2 avisos em Conexão / Solar</b><span>Retorno do backoffice, mensagem nova ou prazo de HP</span></div><div class="qd">agora</div></div>
      <div class="item"><div class="ic ok">✓</div><div class="tx"><b>Viabilidade respondida</b><span>Toque para ver a resposta do backoffice</span></div><div class="qd">hoje</div></div>
      <div class="item"><div class="ic info">☎</div><div class="tx"><b>Retorno agendado · 16:00</b><span>Sônia Aparecida Martins · indicação do vizinho</span></div><div class="qd">hoje</div></div>
      <div class="secao">Premiação</div>
      <div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><div><b>Parcial de outubro</b><div class="micro">Pelas vendas instaladas até hoje · regra do plano</div></div><div style="font-size:22px;font-weight:700">R$ 312,00</div></div></div>
    </div>`;

  T.passo({ cap: "jornada", id: "app-inicio", titulo: "O app do vendedor", tempo: 25,
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 3 · A JORNADA DA VENDA", "O vendedor acompanha meta e prioridades pelo celular", "Rafael, vendedor em Samambaia, tem vendas, agenda e premiação no mesmo app. BL significa banda larga.")}
      <div class="conteudo"><div class="lado" style="flex:1">${cel({ hora: S.hora, quem: `<b>${P.vend}</b> · vendedor · equipe ${P.equipe}`, titulo: "Boa tarde, Rafael", sub: `${P.equipe} · sábado, 24 de outubro`, corpo: inicioApp(S), aba: "inicio", badge: { vendas: 3 }, grande: true })}
        <div class="col" style="max-width:640px;margin-left:80px"><ul class="lista">
          <li><b>Meta e ritmo</b> do mês, pela mesma regra do painel do gerente.</li>
          <li><b>"Para fazer agora":</b> retornos do backoffice, prazos de HP e agenda.</li>
          <li><b>Premiação parcial</b> pelo plano do mês.</li>
          <li>O botão <b>+</b> registra: viabilidade, venda Conexão/Solar e retorno na agenda.</li></ul>
          ${aprof([["demo-app", "Abrir o app real (demonstração)"]])}</div></div></div></div>`,
    notas: { objetivo: "Apresentar o personagem e o app. O público precisa entender que é o celular do vendedor, instalado como aplicativo.",
      fala: "Sábado, 14:21. O Rafael é vendedor da equipe Samambaia e está com um cliente. No celular dele, o app Seven One: a meta do mês, o ritmo, o que fazer agora e a parcial da premiação. Tudo com a mesma regra que o gerente vê no painel.\nO cliente quer fechar. Primeiro passo: saber se o endereço atende.",
      clicar: "Avançar. (O botão 'Abrir o app real' abre a demonstração interativa, só se pedirem.)", observar: "O botão vermelho '+' no meio da barra: é por ele que o Rafael registra.",
      simulado: "A tela é uma reprodução fiel do app com dados fictícios. O app real está em 'Abrir o app real'.",
      evidencia: "api/public/pg_dash.js (Início do vendedor: /meu-mes), navegacao.js (abas do app e o '+').", transicao: "Rafael toca no '+'." } });

  const formViab = (S, preenchido) => `<div class="app-corpo">
      <div class="card" style="display:grid;gap:10px">
        <div class="campo"><label>O que verificar?</label><div class="checks"><span class="${preenchido ? "on" : ""}">Endereço</span><span class="${preenchido ? "on" : ""}">Crédito</span><span>Linha móvel</span><span>Link de biometria</span></div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${campo("CEP", preenchido ? P.cep : "")}${campo("Número", preenchido ? P.num : "")}</div>
        ${campo("Rua", preenchido ? P.rua : "", preenchido ? "auto" : "")}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${campo("Bairro", preenchido ? P.bairro : "", preenchido ? "auto" : "")}${campo("Cidade / UF", preenchido ? P.cidade + " / " + P.uf : "", preenchido ? "auto" : "")}</div>
        ${campo("Cliente (opcional)", preenchido ? P.cliente : "")}
        ${campo("Observação para o backoffice", preenchido ? P.obsVend : "")}
      </div>
      <button class="btn ${preenchido ? "dest" : ""}" ${preenchido ? 'data-rotulo="enviar"' : ""}>Enviar pedido</button>
      <div class="micro" style="text-align:center">Você recebe um aviso quando o backoffice responder.</div></div>`;

  T.passo({ cap: "jornada", id: "app-form", titulo: "Pedir viabilidade", tempo: 35,
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 3 · A JORNADA DA VENDA", "Um pedido organizado desde o primeiro contato", "O vendedor pede a análise do endereço e do crédito, com os dados e as observações necessários.")}
      <div class="conteudo"><div class="lado" style="flex:1">${cel({ hora: S.hora, quem: `<b>${P.vend}</b> · vendedor`, titulo: "Pedir viabilidade", voltar: true, corpo: formViab(S, true), aba: "vendas", badge: { vendas: 3 }, grande: true, abas: false })}
        <div class="col" style="max-width:640px;margin-left:80px"><ul class="lista"><li><b>CEP consulta o ViaCEP:</b> rua, bairro e cidade entram sozinhos.</li><li><b>Checagens:</b> Endereço, Crédito, Linha móvel, Biometria. Rafael pediu as duas primeiras.</li><li><b>Observação:</b> a mensagem vai junto para o backoffice.</li><li>Se já houver pedido aberto no mesmo endereço, o sistema recusa a duplicidade.</li></ul>
        <p class="mini">Endereço, cliente e CPF são fictícios.</p></div></div></div></div>`,
    notas: { objetivo: "O momento 'uma ação principal': enviar. Chamar atenção para a observação, que vai aparecer no backoffice daqui a pouco.",
      fala: "Rafael digita o CEP e o endereço se completa sozinho, pela consulta ao ViaCEP. Marca o que precisa: endereço e crédito. E escreve um recado: 'cliente mora na casa dos fundos, precisa da análise de crédito hoje'. Envia.",
      clicar: "Avançar (simula o toque em Enviar).", observar: "Campos azulados preenchidos pelo CEP; o texto da observação.",
      simulado: "A consulta ao ViaCEP acontece no sistema real (GET /api/cep); aqui o resultado está pré-preenchido. O envio também é simulado: nada é gravado.",
      evidencia: "api/src/routes_viabilidade.js:26-40 (ViaCEP), :107-160 (validação do pedido; 409 em duplicidade); pg_viabilidade.js:64-95 (formulário).", transicao: "O pedido chega no sistema web, na tela da Juliana, do backoffice de Cadastro." } });

  /* fila do backoffice */
  const filaBase = [
    { ha: "há 1h33", st: "an", stRot: "Em análise · Juliana", num: "1902", end: "SHIN QI, 9 Conjunto 3 Casa 14", cep: "71515-030", bairro: "Lago Norte", cidade: "Brasília-DF", vendedor: "Helena Vasconcelos", equipe: "Plano Piloto e Lago Sul", checks: ["Endereço", "Crédito", "Linha móvel", "Biometria"] },
    { ha: "há 1h08", st: "", stRot: "Aguardando", num: "1904", end: "Rua, 30 Quadra 47 Lote 9", cep: "72876-030", bairro: "Jardim Céu Azul", cidade: "Valparaíso de Goiás-GO", vendedor: "Mateus Rocha", equipe: "Valparaíso de Goiás", checks: ["Endereço", "Crédito"], obs: true },
    { ha: "há 50 min", st: "", stRot: "Aguardando", num: "1906", end: "Avenida das Araucárias, 1835, Bloco B Apto 1102", cep: "71936-250", bairro: "Águas Claras", cidade: "Brasília-DF", vendedor: "Gabriela Torres", equipe: "Águas Claras", checks: ["Endereço", "Biometria"] },
  ];
  const pedidoRafael = (S, extra = {}) => pedido({ ha: S.viab.ha, st: S.viab.st === "EM_ANALISE" ? "an" : "", stRot: S.viab.st === "EM_ANALISE" ? "Em análise · Juliana" : S.viab.st === "ATENDE" ? "Atende · há 1 min" : "Aguardando", num: P.viab, end: `${P.rua} ${P.num}`, cep: P.cep, bairro: P.bairro, cidade: `${P.cidade}-${P.uf}`, vendedor: P.vend, equipe: P.equipe, checks: ["Endereço", "Crédito"], obs: true, ...extra });
  const filaHtml = (S, opts = {}) => `<h1>Viabilidade</h1><p class="sub">Pedidos dos vendedores · <b>mais antigos primeiro</b> · Tempo de referência <b>30 min</b> para começar a análise · Hoje: <b>41 respondidos</b> (33 atende, 8 não atende)</p>
      <div class="filtros"><div class="seg"><span class="on">Na fila ${S.viab ? 13 : 12}</span><span>Atende hoje 33</span><span>Não atende hoje 8</span><span>Todos</span></div><div class="campo">Rua, bairro, CEP, cliente ou vendedor</div></div>
      <div class="duas"><div class="fila">${(opts.base || filaBase).map((f) => pedido({ ...f, on: !S.viab && f.num === "1902" })).join("")}${opts.fim || ""}</div>${opts.detalhe || `<div class="painel"><div class="vazio">Escolha um pedido na fila.</div></div>`}</div>`;

  T.passo({ cap: "jornada", id: "web-chega", titulo: "O pedido chega no sistema web", tempo: 40,
    evento: (S) => { S.hora = "14:22"; S.viab = { num: P.viab, st: "PENDENTE", ha: "há 0 min" }; S.badgeOp = 11; S.viabAbertas = 4; },
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 3 · A JORNADA DA VENDA", "O pedido entra na fila da equipe de apoio", "A fila mostra os pedidos e o tempo de espera, para organizar o atendimento.")}
      <div class="conteudo" style="align-items:center">${cel({ hora: S.hora, quem: `<b>${P.vend}</b> · app`, titulo: "Viabilidade", sub: "Pedido enviado", corpo: `<div class="app-corpo">${celAbas("viab", { viab: "4 abertas", cs: "2 em andamento", con: "21 no mês" })}
          <div class="card novo dest" style="border-color:var(--info-line)"><div class="micro">Aguardando · enviada agora</div><b style="font-size:16px">${P.rua} ${P.num}</b><div class="micro">${P.cep} · ${P.bairro} · ${P.cidade}-${P.uf}</div><div class="checks" style="margin-top:8px"><span>Endereço</span><span>Crédito</span></div><div class="micro" style="margin-top:8px">nº ${P.viab} · ${P.cliente}</div></div>
          <div class="micro" style="text-align:center">Você recebe um aviso quando o backoffice responder.</div></div>`, aba: "vendas", badge: { vendas: 4 } })}
        ${seta("20 s, no máximo", true)}
        ${web({ quem: `<b>${P.bko}</b> · backoffice de Cadastro · sistema web`, pessoa: { ini: P.bkoIni }, badge: { operacao: S.badgeOp }, corpo: filaHtml(S, { fim: pedidoRafael(S, { novo: true, dest: true }) }),
          toast: { tit: "Nova viabilidade", txt: "10 pedidos aguardando verificação.", som: true } })}</div></div>`,
    notas: { objetivo: "O momento de sincronização nº 1. Causa (envio no app) e efeito (fila, contador e aviso sonoro no web).",
      fala: "Na mesa da Juliana, do backoffice de Cadastro, o sistema web avisa: som, contador no menu Operação e o pedido do Rafael entra na fila. A fila é por ordem de chegada, com o tempo de espera de cada pedido, e há um tempo de referência de 30 minutos para começar a análise.\nNão foi WhatsApp, não foi ligação. É o mesmo sistema, em dois lugares.",
      clicar: "Avançar.", observar: "Esquerda: o pedido 'Aguardando' no app. Direita: aviso 'Nova viabilidade', contador 11 no menu Operação e o pedido nº 1914 no fim da fila (destacado).",
      simulado: "No sistema real o web consulta /api/avisos a cada 20 segundos (60 s com a aba oculta) e toca o aviso; aqui a chegada é imediata ao avançar. O pedido entra no FIM da fila (mais antigos primeiro); está destacado para o público achar.",
      evidencia: "api/public/avisos.js (polling 20 s, som, toast, Notification); routes_viabilidade.js:303-333 (/avisos).", transicao: "Juliana pega o pedido para análise." } });

  const detalheRafael = (S, modo) => {
    const conversa = `<h4>Conversa com o vendedor</h4><div class="obs"><div class="m ${modo === "lida" ? "dest" : ""}" ${modo === "lida" ? 'data-rotulo="a mensagem do Rafael, lida aqui"' : ""}><span class="de">${P.vend} · vendedor · 14:21</span>${P.obsVend}</div>${modo === "respondida" ? `<div class="m eu novo dest"><span class="de">Juliana Castro · Cadastro · 14:27</span>${P.respBko}</div>` : ""}</div>`;
    const cab = `<h2>${P.rua} ${P.num}</h2><div class="meta">Viabilidade nº <b class="mono">${P.viab}</b> · pedida às <b>14:21</b> por <b>${P.vend}</b> (${P.equipe}) · ${modo === "fila" ? "Aguardando" : modo === "respondida" ? `<span style="color:var(--ok);font-weight:600">Atende</span> · respondida às 14:27` : `<span class="an">Em análise</span> · Juliana Castro`}</div>
      <h4>Endereço</h4><div class="grade4"><div>Logradouro<b>${P.rua} ${P.num}</b></div><div>Bairro<b>${P.bairro}</b></div><div>Cidade<b>${P.cidade}/${P.uf}</b></div><div>CEP<b class="mono">${P.cep}</b></div></div>`;
    if (modo === "fila") return `<div class="painel">${cab}${conversa}<h4>Checagens pedidas</h4><div style="display:flex;gap:8px">${etiq("Endereço", "sem")}${etiq("Crédito", "sem")}</div>
      <div class="botoes"><button class="bt brand dest" data-rotulo="clicar">Pegar para análise</button><span>Tranca o pedido para você; outra pessoa não responde o mesmo.</span></div></div>`;
    if (modo === "lida") return `<div class="painel">${cab}${conversa}<h4>Resposta do endereço <span class="mini" style="float:right">vale para a venda inteira</span></h4>
      <div class="resposta"><div><label>HP <span class="mini">obrigatório para atender</span></label><div class="in">Somente números</div></div><div><label>Resposta para o vendedor</label><div class="in">Ex.: endereço fora da área de cobertura</div></div></div>
      <div class="botoes"><button class="bt ok">✓ Atende</button><button class="bt crit">✕ Não atende</button><span>Com Juliana Castro em análise.</span></div></div>`;
    if (modo === "responder") return `<div class="painel">${cab}${conversa}<h4>Resposta do endereço <span class="mini" style="float:right">vale para a venda inteira</span></h4>
      <div class="resposta"><div><label>HP <span class="mini">obrigatório para atender</span></label><div class="in ok mono">${P.hp}</div></div><div><label>Resposta para o vendedor</label><div class="in ok">${P.respBko}</div></div></div>
      <div class="botoes"><button class="bt ok ativo dest" data-rotulo="clicar">✓ Atende</button><button class="bt crit">✕ Não atende</button><span>Com Juliana Castro em análise.</span></div>
      <h4>Checagem de crédito <span class="mini" style="float:right">pedida junto com o endereço</span></h4><div class="grade4"><div>Nome completo<b>${P.cliente}</b></div><div>CPF<b class="mono">${P.cpf}</b></div><div>Resultado<b style="color:var(--ok)">Aprovado</b></div><div>Oferta Single<b>Não</b></div></div></div>`;
    return `<div class="painel">${cab}${conversa}<h4>Resposta</h4><div style="display:flex;gap:10px;align-items:center">${etiq("Atende", "ok")} <span class="mono">HP ${P.hp}</span> ${etiq("Crédito aprovado", "ok")} <span class="mini">· o vendedor foi avisado no app</span></div></div>`;
  };

  T.passo({ cap: "jornada", id: "web-analise", titulo: "Pegar para análise", tempo: 25,
    evento: (S) => { S.hora = "14:24"; S.viab.st = "EM_ANALISE"; S.viab.ha = "há 3 min"; },
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 3 · A JORNADA DA VENDA", "Cada pedido tem um responsável pelo atendimento", "A equipe vê quem está atendendo. O vendedor acompanha a análise pelo app.")}
      <div class="conteudo" style="align-items:center">${web({ quem: `<b>${P.bko}</b> · backoffice de Cadastro`, pessoa: { ini: P.bkoIni }, badge: { operacao: S.badgeOp }, altura: 820,
        corpo: filaHtml(S, { base: filaBase.slice(0, 2), fim: pedidoRafael(S, { on: true }), detalhe: detalheRafael(S, "fila") }) })}</div></div>`,
    notas: { objetivo: "Mostrar a fila funcionando como fila: trancar o pedido, tempo de espera, uma pessoa por pedido.",
      fala: "Juliana abre o pedido. Vê o endereço, a checagem de crédito pedida e a conversa com o vendedor. Clica em 'Pegar para análise': o pedido fica com ela e mais ninguém responde o mesmo pedido. No app, o Rafael já vê 'Em análise, Juliana'.",
      clicar: "Avançar.", observar: "O botão 'Pegar para análise' e a mensagem do Rafael na 'Conversa com o vendedor'.",
      simulado: "Reprodução da tela real de viabilidade (pg_viabilidade.js). O clique é simulado.", evidencia: "routes_viabilidade.js:176-178 (EM_ANALISE tranca o pedido; devolver para a fila).", transicao: "Capítulo 4: a conversa. A mensagem do Rafael já chegou junto com o pedido." } });

  /* ================================================================== 4. COMUNICAÇÃO */

  T.passo({ cap: "comunicacao", id: "web-responde", titulo: "Juliana responde: Atende", tempo: 35,
    evento: (S) => { S.hora = "14:27"; S.viab.st = "ATENDE"; S.viab.ha = "há 6 min"; S.badgeOp = 10; },
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 4 · VENDEDOR E BACKOFFICE", "A resposta fica registrada junto ao pedido", "HP é o código do endereço na operadora. A resposta informa esse código ou o motivo de não atendimento.")}
      <div class="conteudo" style="align-items:center">${web({ quem: `<b>${P.bko}</b> · backoffice de Cadastro`, pessoa: { ini: P.bkoIni }, badge: { operacao: S.badgeOp }, altura: 820, corpo: `<h1>Viabilidade</h1><p class="sub">Pedido nº ${P.viab} · em análise com você</p>${detalheRafael(S, "responder")}` })}</div></div>`,
    notas: { objetivo: "Regras que protegem a operação: Atende exige HP; Não atende exige resposta; crédito tem resultado próprio.",
      fala: "Juliana confere a cobertura e o crédito. Responde 'Atende', com o número do HP, e marca o crédito como aprovado. O sistema não deixa responder 'Atende' sem HP, nem 'Não atende' sem explicar o motivo ao vendedor. Clica.",
      clicar: "Avançar.", observar: "HP preenchido, texto da resposta, botão Atende.",
      simulado: "Clique simulado. No sistema real a resposta grava a hora, o autor, zera o 'visto' do vendedor e vira uma linha da conversa.",
      evidencia: "routes_viabilidade.js:168-201 (Atende exige HP; Não atende exige resposta; resposta vira obs); :250-294 (crédito Aprovado / Oferta Single / Reprovado).", transicao: "No celular do Rafael, o aviso chega." } });

  T.passo({ cap: "comunicacao", id: "app-resposta", titulo: "A resposta aparece no app", tempo: 40,
    evento: (S) => { S.hora = "14:27"; S.toastApp = true; },
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 4 · VENDEDOR E BACKOFFICE", "O vendedor recebe a resposta no mesmo pedido", "No exemplo fictício, a resposta chega em seis minutos. Esse tempo ilustra a história; não é um prazo garantido.")}
      <div class="conteudo" style="align-items:center">${web({ quem: `<b>${P.bko}</b> · sistema web`, pessoa: { ini: P.bkoIni }, badge: { operacao: S.badgeOp }, altura: 760, corpo: `<h1>Viabilidade</h1><p class="sub">Pedido nº ${P.viab} · respondido por você às 14:27</p>${detalheRafael(S, "respondida")}` })}
        ${seta("20 s, no máximo", true)}
        ${cel({ hora: S.hora, quem: `<b>${P.vend}</b> · app`, titulo: "Viabilidade", corpo: `<div class="app-corpo">${celAbas("viab", { viab: "3 abertas", cs: "2 em andamento", con: "21 no mês" }, { viab: 1 })}
          <div class="card novo dest" style="border-color:var(--ok-line)"><div style="display:flex;gap:8px;align-items:center">${etiq("Atende", "ok")}<span class="etiq brand sem" style="font-size:11px">NOVA RESPOSTA</span><span class="micro" style="margin-left:auto">respondida há 0 min</span></div><b style="font-size:16px;display:block;margin-top:8px">${P.rua} ${P.num}</b><div class="micro">${P.cep} · ${P.bairro} · ${P.cliente}</div>
            <div class="msgs" style="margin-top:10px"><div class="msg"><span class="de">Juliana Castro · Cadastro · 14:27</span>${P.respBko}</div></div>
            <button class="btn" style="margin-top:10px" data-rotulo="próximo passo" data-rotulo-pos="baixo">Encaminhar a venda → Solar</button></div></div>`, aba: "vendas", badge: { vendas: 4 }, toast: { tit: "Viabilidade respondida", txt: "O backoffice respondeu o seu pedido. Toque para ver." } })}</div></div>`,
    notas: { objetivo: "Sincronização nº 3, no sentido contrário: web → app. Fechar o ciclo da conversa e abrir o próximo passo (encaminhar para o Solar).",
      fala: "No app do Rafael: 'Viabilidade respondida'. Atende, HP, crédito aprovado e a mensagem da Juliana. Seis minutos entre o pedido e a resposta, tudo registrado.\nE o próprio pedido já oferece o próximo passo: encaminhar a venda para o Solar.",
      clicar: "Avançar.", observar: "O toast no app, a etiqueta 'Atende' e o botão 'Encaminhar a venda → Solar', que só aparece depois do Atende.",
      simulado: "Chegada imediata ao avançar; no real, o app consulta os avisos a cada 20 s. O aviso de viabilidade é por consulta (polling), não por notificação push.",
      evidencia: "avisos.js:106-111 ('Viabilidade respondida'); routes_viabilidade.js:231-247 (encaminhar só após Atende e checagens atendidas).", transicao: "Rafael fecha no Solar e envia a venda ao Cadastro." } });

  const formSolar = (S) => `<div class="app-corpo"><div class="card" style="display:grid;gap:10px">
      <div class="campo"><label>Sistema</label><div class="checks"><span>Conexão</span><span class="on">Solar</span></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${campo("CPF do cliente", P.cpf)}${campo("Nº do contrato", P.contrato)}</div>
      ${campo("Plano", P.produtos)}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${campo("Vencimento", "dia " + P.venc)}${campo("Multi", "Não")}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${campo("Agendamento", P.agenda + " (seg)")}${campo("Turno", "Manhã")}</div>
      ${campo("Viabilidade", "nº " + P.viab + " · Atende · HP " + P.hp, "auto")}
      ${campo("Observação", "Cliente pediu ligação 30 min antes do técnico chegar.")}
    </div><button class="btn dest" data-rotulo="enviar ao Cadastro">Enviar venda Solar</button></div>`;

  T.passo({ cap: "comunicacao", id: "app-solar", titulo: "Venda finalizada no Solar, enviada ao Cadastro", tempo: 35,
    evento: (S) => { S.hora = "14:35"; S.ve = { num: P.solar, st: "PENDENTE_TRATAMENTO", chat: [] }; S.csAndamento = 3; S.badgeOp = 11; },
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 4 · VENDEDOR E BACKOFFICE", "Rafael finaliza no Solar e envia os dados ao Cadastro", "CPF, contrato, plano, vencimento, agendamento e Multi: o modelo 'Venda finalizada no Solar', ligado à viabilidade.")}
      <div class="conteudo" style="align-items:center">${cel({ hora: S.hora, quem: `<b>${P.vend}</b> · app`, titulo: "Enviar venda Solar", voltar: true, corpo: formSolar(S), aba: "vendas", badge: { vendas: 4 }, abas: false })}
        ${seta("chega na fila Conexão / Solar", true)}
        ${web({ quem: `<b>${P.bko}</b> · backoffice de Cadastro`, pessoa: { ini: P.bkoIni }, badge: { operacao: S.badgeOp }, caminho: ["Operação", "Conexão / Solar"], url: "controleseven.com.br/#/vendaexterna", altura: 760, corpo: `<h1>Conexão / Solar</h1><p class="sub">Vendas enviadas pelos vendedores. Confira, responda e acompanhe os prazos de HP.</p>
          <div class="filtros"><div class="seg"><span class="on">Em aberto 4</span><span>Pendente</span><span>Criação de HP</span><span>Pendência</span><span>Finalizadas</span></div><div class="campo">cliente, código, CPF, contrato, vendedor</div></div>
          <div class="fila"><div class="pedido on dest novo"><div class="l1"><span><span class="ha">há 0 min</span> · <span class="st">Pendente de tratamento</span></span><span class="mono">Solar nº ${P.solar}</span></div><b>CPF ${P.cpf} · contrato ${P.contrato}</b><div class="l3">${P.produtos} · venc. ${P.venc} · ${P.agenda} manhã</div><div class="l3">${P.vend} · ${P.equipe} · viabilidade nº ${P.viab} (Atende)</div></div>
          <div class="pedido"><div class="l1"><span><span class="ha ok">há 1h 05</span> · <span class="st an">Criação de HP · vence em 1h 40</span></span><span class="mono">Solar nº 2331</span></div><b>CPF 284.•••.•••-07</b><div class="l3">Rafael Moura · Samambaia</div></div>
          <div class="pedido"><div class="l1"><span><span class="ha ok">há 2h 10</span> · <span class="st">Pendente de tratamento</span></span><span class="mono">Conexão nº 2329</span></div><b>Edson Pereira Lima</b><div class="l3">Bianca Ferreira Lacerda · Samambaia · com chip</div></div>
          <div class="pedido"><div class="l1"><span><span class="ha ok">há 3h 20</span> · <span class="st" style="color:var(--warn)">Pendência · falta comprovante</span></span><span class="mono">Solar nº 2327</span></div><b>CPF 031.•••.•••-55</b><div class="l3">Thiago Nascimento · Samambaia</div></div></div>`,
          toast: { tit: "Nova venda Conexão / Solar", txt: "4 aguardando tratamento.", som: true } })}</div></div>`,
    notas: { objetivo: "Explicar o papel dos sistemas da Claro: a venda é FINALIZADA no Solar (ou no Conexão) e o vendedor envia os dados ao Cadastro pelo app. Não há integração automática com o Solar; é um registro guiado.",
      fala: "Com o Atende, Rafael finaliza a venda no Solar, o sistema da Claro, e envia os dados pelo app: CPF, contrato, plano, vencimento, agendamento e Multi. O pedido vai ligado à viabilidade que acabou de ser respondida.\nNa tela da Juliana, a fila Conexão/Solar recebe a venda com aviso. Ela acompanha os prazos de HP e as pendências por aqui.",
      clicar: "Avançar.", observar: "Formulário com o modelo Solar; à direita, a venda nº 2332 no topo da fila 'Em aberto'.",
      simulado: "Chegada imediata ao avançar. Importante: não existe integração por API com o Solar ou o Conexão; o vendedor transcreve a venda finalizada lá. O sistema valida o CPF (dígito) e guarda o vínculo com a viabilidade.",
      evidencia: "routes_vendaexterna.js:24-53 (campos Solar/Conexão), :101 (viabilidade_id), :130-159 (status: Pendente → Criação de HP com prazo → Pendência → Finalizado); db/42_solar_modelo_novo.sql.", transicao: "Juliana responde na conversa da venda, e o Rafael recebe uma notificação no celular." } });

  T.passo({ cap: "comunicacao", id: "chat-push", titulo: "Conversa da venda com notificação no celular", tempo: 30,
    evento: (S) => { S.hora = "14:41"; S.ve.chat = [{ de: P.bko, txt: P.chatBko, h: "14:41" }]; S.pushRafael = { tit: `Conexão / Solar · venda nº ${P.solar}`, txt: "Nova mensagem na conversa", qd: "agora" }; },
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 4 · VENDEDOR E BACKOFFICE", "Mensagem na venda: o celular do Rafael recebe uma notificação", "Na conversa da venda Conexão/Solar, cada mensagem avisa o outro lado por notificação, mesmo com o app fechado.")}
      <div class="conteudo" style="align-items:center">${web({ quem: `<b>${P.bko}</b> · backoffice de Cadastro`, pessoa: { ini: P.bkoIni }, badge: { operacao: S.badgeOp }, caminho: ["Operação", "Conexão / Solar"], url: "controleseven.com.br/#/vendaexterna", altura: 760, corpo: `<h1>Conexão / Solar</h1><p class="sub">Solar nº ${P.solar} · ${P.vend} · Pendente de tratamento</p>
          <div class="painel"><div class="grade4"><div>CPF<b class="mono">${P.cpf}</b></div><div>Contrato<b class="mono">${P.contrato}</b></div><div>Plano<b>${P.produtos}</b></div><div>Agendamento<b>${P.agenda} · manhã</b></div></div>
          <h4>Conversa com o vendedor</h4><div class="obs"><div class="m eu dest novo"><span class="de">Juliana Castro · Cadastro · 14:41</span>${P.chatBko}</div></div>
          <h4>Resposta ao vendedor</h4><div class="botoes"><button class="bt">Correção de venda</button><button class="bt">Criação de HP · prazo em horas</button><button class="bt">Pendência</button><button class="bt ok">Finalizado</button></div></div>` })}
        ${seta("notificação push", true)}
        ${cel({ hora: S.hora, quem: `<b>${P.vend}</b> · celular, app fechado`, push: S.pushRafael, titulo: "Conexão / Solar", corpo: `<div class="app-corpo">${celAbas("cs", { viab: "3 abertas", cs: "3 em andamento", con: "21 no mês" }, { cs: 1 })}
          <div class="card"><div class="micro"><span class="st pend">Pendente de tratamento</span> · Solar nº ${P.solar}</div><b style="font-size:16px">${P.cliente}</b><div class="micro">${P.produtos} · ${P.agenda} manhã</div>
            <div class="msgs" style="margin-top:10px"><div class="msg dest"><span class="de">Juliana Castro · Cadastro · 14:41</span>${P.chatBko}</div></div></div></div>`, aba: "vendas", badge: { vendas: 5 } })}</div></div>`,
    notas: { objetivo: "Mostrar a notificação push de verdade (Android e iPhone com o app instalado). Diferenciar: a conversa da viabilidade avisa por consulta; a conversa Conexão/Solar avisa por push.",
      fala: "Juliana escreve na conversa da venda: 'recebi, vou lançar o contrato e agendar para terça de manhã'. O celular do Rafael recebe uma notificação, mesmo com o app fechado, sem o texto da mensagem, por privacidade. Ele abre e lê.",
      clicar: "Avançar.", observar: "A notificação no alto do celular e a mesma mensagem nos dois lados.",
      simulado: "A notificação é reproduzida visualmente. No sistema real é Web Push (VAPID) implementado no servidor; funciona no Android e no iPhone 16.4+ com o app instalado, e o usuário precisa ativá-la em 'Meu perfil'.",
      evidencia: "routes_vendaexterna.js:161-176 (chat e push sem o texto); api/src/webpush.js (implementação própria); api/public/notificacoes.js (ativação).", transicao: "Juliana lança o contrato no sistema web." } });

  T.passo({ cap: "comunicacao", id: "web-contrato", titulo: "O contrato é lançado pelo Cadastro", tempo: 40,
    evento: (S) => { S.hora = "14:52"; S.ve.st = "FINALIZADO"; S.csAndamento = 2; S.badgeOp = 10; S.venda = { num: P.contrato, st: "PENDENTE", rota: { data: P.agenda, turno: "manhã", confirmada: false, situacao: "PENDENTE_INSTALACAO" } };
      S.ind.rafaelBl = 18; S.ind.rafaelVendas = 22; S.ind.samBl = 113; S.ind.samVendas = 143; S.ind.empBl = 813; S.ind.validas = 951; S.ind.lancadas = 1035; S.ind.pend = 353; S.ind.proj = 1061; S.contratosMes = 22; S.delta = true;
      S.pushGestora = { tit: `Nova venda · ${P.vend}`, txt: `Equipe ${P.equipe.toUpperCase()}\nBL 500 MB + TV · ${P.cidade}/${P.uf} · ${P.pacote}`, qd: "agora" }; },
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 4 · VENDEDOR E BACKOFFICE", "Venda registrada, instalação agendada", "Quem lança o contrato é o backoffice de Cadastro. A venda nasce 'Pendente' e já entra na rota de instalação.")}
      <div class="conteudo" style="align-items:center">${web({ quem: `<b>${P.bko}</b> · backoffice de Cadastro`, pessoa: { ini: P.bkoIni }, modulo: "comercial", badge: { operacao: S.badgeOp }, caminho: ["Comercial", "Vendas", "Nova venda"], url: "controleseven.com.br/#/vendas/nova", altura: 720, corpo: `<h1>Nova venda</h1><p class="sub">Lançamento unitário · CPF e CNPJ com o dígito conferido · produtos por categoria</p>
          <div class="painel" style="display:grid;grid-template-columns:1fr 1fr;gap:26px">
            <div><h4 style="border:0;padding:0;margin-top:0">Cliente</h4><div class="grade4" style="grid-template-columns:1fr 1fr"><div>CPF<b class="mono">${P.cpf} <span class="etiq ok sem" style="font-size:11px">válido</span></b></div><div>Nome<b>${P.cliente}</b></div><div>Nascimento<b>12/07/1985</b></div><div>Telefone<b class="mono">${P.tel}</b></div></div>
              <h4>Produtos</h4><div class="chk" style="display:flex;gap:8px;flex-wrap:wrap"><span class="etiq info sem">Internet 500 Mega</span><span class="etiq info sem">Claro TV+ Box</span><span class="etiq sem">Móvel</span><span class="etiq sem">Fone</span><span class="etiq sem">Mesh</span></div></div>
            <div><h4 style="border:0;padding:0;margin-top:0">Venda</h4><div class="grade4" style="grid-template-columns:1fr 1fr"><div>Data da venda<b>24/10/2026</b></div><div>Nº do contrato<b class="mono">${P.contrato}</b></div><div>Vendedor<b>${P.vend}</b></div><div>Equipe<b>${P.equipe.toUpperCase()} <span class="mini">(automática)</span></b></div><div>Origem<b>PAP</b></div><div>Canal<b>SOLAR</b></div><div>Tipo<b>PROSPECT</b></div><div>Pagamento<b>DCC · venc. ${P.venc}</b></div><div>Valor do pacote<b>${P.pacote}</b></div><div>Possui oferta?<b>Sim</b></div><div>Cidade / bairro<b>${P.cidade} · ${P.bairro}</b></div><div>Agendamento<b>${P.agenda} · ${P.turno}</b></div></div></div></div>
          <div class="botoes" style="justify-content:flex-end"><button class="bt">Cancelar</button><button class="bt brand dest" data-rotulo="salvar">Salvar venda</button></div>` })}
        <div class="col" style="max-width:520px"><h3>O que acontece ao salvar</h3><ul class="lista ok"><li>Venda nasce <b>Pendente</b>; o histórico registra quem lançou e quando.</li><li>Entra na <b>rota de instalação</b> de terça, 27/10, manhã.</li><li>Gerente recebe a <b>notificação</b> "Nova venda · Rafael Moura".</li><li>Os indicadores do mês e do vendedor <b>mudam na hora</b>.</li></ul></div></div></div>`,
    notas: { objetivo: "Esclarecer quem lança o contrato (Cadastro, não o vendedor) e o que o lançamento dispara. É o ponto que liga o capítulo 4 ao 5.",
      fala: "Com os dados do Solar, Juliana lança o contrato na tela 'Nova venda': CPF com o dígito conferido, produtos por categoria, forma de pagamento, oferta e o agendamento. Salvar faz quatro coisas de uma vez: a venda nasce pendente, entra na rota de instalação de terça, o gerente recebe uma notificação e os indicadores mudam na hora.",
      clicar: "Avançar.", observar: "A etiqueta 'válido' no CPF; o botão Salvar; a lista das quatro consequências.",
      simulado: "Clique simulado. No real, salvar grava cliente, contrato e itens numa transação, cria a linha da rota e dispara o push ao gerente. A venda Solar nº 2332 NÃO vira contrato sozinha: o Cadastro lança e marca a venda externa como finalizada.",
      evidencia: "routes_vendas.js:9 (só Cadastro e gerente criam), :36-72 (POST /vendas, push na linha 70); api/src/vendas.js:179-202 (nasce PENDENTE, cria rota); util.js:12-26 (CPF/CNPJ).", transicao: "Capítulo 5: o que o Rafael vê e o que a gestão vê." } });

  /* ================================================================== 5. ACOMPANHAMENTO */
  T.passo({ cap: "acompanhamento", id: "app-minhas-vendas", titulo: "Rafael vê a própria venda", tempo: 30,
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 5 · ACOMPANHAMENTO", "No app, a venda já está em 'Minhas vendas' e o mês subiu", "O vendedor acompanha a própria carteira e a meta. Na lista de contratos, os dados pessoais ficam restritos.")}
      <div class="conteudo" style="align-items:center">${cel({ hora: S.hora, quem: `<b>${P.vend}</b> · app`, titulo: "Minhas vendas", sub: `Outubro · ${S.contratosMes} contratos no mês`, corpo: `<div class="app-corpo" style="padding-bottom:0">${celAbas("con", { viab: "3 abertas", cs: "2 em andamento", con: S.contratosMes + " no mês" })}</div>
        <div style="margin-top:4px">${vendaCel({ cliente: P.cliente, st: "pend", stRot: "Pendente", num: P.contrato, data: "24/10", prods: "Banda larga + TV", prox: "Instalação 27/10 · manhã", dest: true })}
        ${vendaCel({ cliente: "Gilberto Nogueira", st: "pend", stRot: "Pendente", num: "61214503", data: "24/10", prods: "Banda larga", prox: "Instalação 29/10 · tarde" })}
        ${vendaCel({ cliente: "Lorena Batista", st: "inst", stRot: "Instalada", num: "61212204", data: "22/10", prods: "Banda larga", prox: "Confirmação D+15 em 06/11" })}
        ${vendaCel({ cliente: "Francisco das Chagas Rodrigues Filho", st: "canc", stRot: "Cancelada", num: "61210963", data: "21/10", prods: "Banda larga + TV + Móvel", prox: "Motivo: cliente desistiu" })}
        ${vendaCel({ cliente: "Mariana Albuquerque Teixeira", st: "pend", stRot: "Pendente", num: "61208457", data: "19/10", prods: "Banda larga + TV + Móvel", prox: "Instalação 26/10 · manhã" })}</div>`, aba: "vendas", badge: { vendas: 1 } })}
        ${seta("mesma venda", false)}
        ${cel({ hora: S.hora, quem: `<b>${P.vend}</b> · app · Início`, titulo: "Boa tarde, Rafael", sub: `${P.equipe} · sábado, 24 de outubro`, corpo: inicioApp(S), aba: "inicio", badge: { vendas: 1 } })}</div></div>`,
    notas: { objetivo: "O vendedor acompanha sem perguntar a ninguém. E a regra de privacidade: só o nome do cliente das próprias vendas.",
      fala: "No app do Rafael, a venda já aparece em 'Minhas vendas': pendente, instalação terça de manhã. E o Início mudou: 18 de 20 na meta, 22 vendas no mês. Ele acompanha sem precisar perguntar a ninguém. Por decisão de projeto, o vendedor vê o nome do cliente e a data da instalação, nunca CPF, telefone ou endereço.",
      clicar: "Avançar.", observar: "Esquerda: a venda destacada no topo. Direita: 17 → 18 na meta.",
      simulado: "Atualização imediata ao avançar; no real, a lista é a view v_meus_contratos (só do próprio vendedor), e os avisos chegam por consulta a cada 20 s.",
      evidencia: "db/50_vendedor_ve_cliente.sql (v_meus_contratos: nome do cliente e agendamento, sem CPF/telefone/endereço); db/04_acesso.sql (vendedor só enxerga as próprias vendas).", transicao: "O que acontece com a venda nos dias seguintes." } });

  T.passo({ cap: "acompanhamento", id: "linha-tempo", titulo: "A venda avança pelas regras", tempo: 40,
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 5 · ACOMPANHAMENTO", "Os dias seguintes: rota, instalação, qualidade", "Ao marcar a instalação na rota, a venda é atualizada. Qualidade acompanha contatos, faturas em atraso e cancelamentos.")}
      <div class="conteudo"><div class="col"><div class="timeline">
        <div class="tl ok"><div class="q">SÁB 24/10 · 14:52</div><b>Lançada · Pendente</b><span>Cadastro lança o contrato; rota de terça criada.</span></div>
        <div class="tl ok"><div class="q">SEG 26/10 · D-1</div><b>Confirmou? Sim</b><span>Cadastro confirma com o cliente pelo WhatsApp, na Rota.</span></div>
        <div class="tl agora"><div class="q">TER 27/10 · manhã</div><b>Instalado na rota</b><span>→ a venda vira <b>Instalada</b> e o contrato, <b>Conectado</b>. Automático.</span></div>
        <div class="tl futuro"><div class="q">QUA 28/10 · PI+1</div><b>Qualidade liga</b><span>Internet funcionando? Lembrete da 1ª fatura.</span></div>
        <div class="tl futuro"><div class="q">11/11 · PI+15</div><b>Qualidade liga</b><span>Satisfação e fatura em aberto.</span></div>
        <div class="tl futuro"><div class="q">NOV · 1ª FATURA</div><b>FPD</b><span>Paga no prazo? Entra na premiação e no painel.</span></div>
      </div>
      <div class="cartoes c2" style="margin-top:34px">
        <div class="cartao"><h3>Regras que o sistema aplica sozinho</h3><ul class="lista"><li>Instalado na rota ⇒ venda Instalada e contrato Conectado.</li><li>Cancelar na rota exige o motivo (código Claro) e cancela a venda.</li><li>Reagendar guarda a linha antiga e cria a nova.</li></ul></div>
        <div class="cartao"><h3>Fila da Qualidade (novo, 31/10)</h3><ul class="lista"><li>D+1 e D+15 contados da <b>instalação</b>, só vendas instaladas.</li><li>Acompanhamento da primeira e da segunda fatura em aberto.</li><li>Cancelamentos nos quatro primeiros meses, com registro da tratativa.</li></ul></div>
      </div>${aprof([["demo-qualidade", "Abrir a Fila da Qualidade (demonstração)"], ["demo-cadastro", "Abrir o sistema como backoffice"]])}</div></div></div>`,
    notas: { objetivo: "Comprimir o tempo com honestidade: dizer que é uma linha do tempo projetada, e mostrar as regras automáticas (rota ⇄ venda) e a Fila da Qualidade, a novidade mais recente.",
      fala: "Daqui em diante o sistema segue a venda pelas regras: na segunda o Cadastro confirma a instalação com o cliente; na terça, o técnico instala, o Cadastro marca 'instalado' na rota e a venda vira 'instalada' sozinha. Depois entra a Qualidade: ligação no dia seguinte e em quinze dias, e a primeira fatura, o FPD, que alimenta a premiação. Isso tudo é a versão publicada nesta semana.",
      clicar: "Avançar. Se perguntarem pela Qualidade, abra 'Fila da Qualidade (demonstração)'.", observar: "A sequência de datas; o quadro 'Regras que o sistema aplica sozinho'.",
      simulado: "Linha do tempo projetada (não aconteceu na demonstração). As regras são reais: gatilhos no banco sincronizam rota e venda; as etapas PI1/PI15 e as filas de cobrança e churn são da migração 53 (31/10).",
      evidencia: "db/49_rota_venda_sincronizadas.sql (gatilhos); routes_rota.js:77-91; db/53_fila_qualidade.sql; routes_qualidade.js:275-324 (cobrança, churn).", transicao: "Agora a visão de quem gerencia." } });

  const painelHtml = (S) => `<h1>Resultado de outubro</h1><p class="sub">Atualizado <b>sáb, 24/10 às ${S.hora}</b> · Dia útil <b>18 de 23,5</b> · escala 6x1 · Escopo <b>todas as equipes</b></p>
      <div class="kpis"><div>BL vendida <span class="mini">?</span><div class="g ${S.delta ? "dest" : ""}">${S.ind.empBl} <small>de 1.160</small>${S.delta ? '<span class="delta">+1</span>' : ""}</div>70% da meta do mês · esperado até hoje: 889<div class="regua" style="margin-top:8px"><i style="width:70%"></i><em style="left:76.6%"></em></div></div>
        <div>Vendas válidas<div class="g">${S.ind.validas}${S.delta ? '<span class="delta">+1</span>' : ""}</div>de <b>${S.ind.lancadas.toLocaleString("pt-BR")}</b> lançadas · 84 canceladas<br>52,8 por dia útil</div>
        <div>Situação das ${S.ind.lancadas.toLocaleString("pt-BR")} vendas lançadas<div style="height:8px;border-radius:4px;background:linear-gradient(90deg,var(--ok-mark) 58%,#6f8fbf 58% 92%,var(--crit-mark) 92%);margin:12px 0"></div>● Instaladas 598 · 58%<br>● Pendentes ${S.ind.pend} · ${Math.round(S.ind.pend / S.ind.lancadas * 100)}%<br>● Canceladas 84 · 8%</div>
        <div>FPD · 3 últimas safras<div class="g">18,1%</div>alerta acima de 20% · crítico acima de 25%<br>2.438 faturas resolvidas (jul, ago, set)</div></div>
      <div style="display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start"><div class="painel"><h2>Projeção de fechamento</h2><div class="meta">BL vendida</div><div style="font-size:44px;font-weight:700;letter-spacing:-.02em;line-height:1">${S.ind.proj.toLocaleString("pt-BR")}</div><div style="color:var(--warn);font-weight:600;margin:6px 0 12px">◆ Atenção · 91% da meta</div><div class="mini">Ritmo atual <b>45,2</b> BL por dia útil<br>Ritmo para bater a meta <b>63,1</b></div></div>
      <table><thead><tr><th>Equipe</th><th>BL vendida, projeção e meta</th><th class="num">Vendida</th><th class="num">Projeção</th><th class="num">Meta</th><th>Situação</th></tr></thead><tbody>
        <tr><td><b>Valparaíso de Goiás</b><div class="mini">sup. Marcos Vinícius Araújo · 8 vendedores</div></td><td><div class="regua"><i style="width:56%"></i><em style="left:100%"></em></div></td><td class="num">96</td><td class="num">125</td><td class="num">170</td><td style="color:var(--crit)">▲ Abaixo do ritmo</td></tr>
        <tr class="${S.delta ? "on" : ""}"><td><b>Samambaia</b><div class="mini">sup. Rodrigo Teles · 8 vendedores</div></td><td><div class="regua"><i style="width:${S.ind.samBl / 160 * 100}%"></i><em style="left:100%"></em></div></td><td class="num ${S.delta ? "dest" : ""}">${S.ind.samBl}</td><td class="num">${Math.round(S.ind.samBl / 18 * 23.5)}</td><td class="num">160</td><td style="color:var(--warn)">◆ Atenção</td></tr>
        <tr><td><b>Águas Claras</b><div class="mini">sup. Patrícia Rocha · 7 vendedores</div></td><td><div class="regua"><i style="width:74%"></i><em style="left:100%"></em></div></td><td class="num">104</td><td class="num">136</td><td class="num">140</td><td style="color:var(--warn)">◆ Atenção</td></tr>
        <tr><td><b>Ceilândia Centro</b><div class="mini">sup. Anderson Lima · 11 vendedores</div></td><td><div class="regua"><i style="width:80%"></i><em style="left:100%"></em></div></td><td class="num">176</td><td class="num">230</td><td class="num">220</td><td style="color:var(--ok)">● No ritmo da meta</td></tr>
      </tbody></table></div>`;

  T.passo({ cap: "acompanhamento", id: "gestao-painel", titulo: "O painel da gerente muda na hora", tempo: 45,
    cena: (S) => `<div class="pad">${cab("CAPÍTULO 5 · ACOMPANHAMENTO", "A mesma venda, agora nos indicadores", "BL = banda larga. FPD = primeira fatura não paga no prazo. A gestão vê metas, ritmo de vendas e qualidade no mesmo painel.")}
      <div class="conteudo" style="align-items:center">${web({ quem: `<b>${P.gestora}</b> · gerente · sistema web`, pessoa: { ini: P.gestIni }, modulo: "visao", caminho: ["Visão geral", "Painel"], url: "controleseven.com.br/#/dashboard", altura: 760, corpo: painelHtml(S) })}</div>
      ${aprof([["demo-gestor", "Abrir o painel real (demonstração)"], ["gestao-mais", "Equipes, fechamento do dia e premiação"]])}</div>`,
    notas: { objetivo: "Fechar o ciclo: a venda do Rafael aparece nos números da empresa e da equipe, com a mesma regra do app. Mostrar o painel como resposta às perguntas do gestor: vamos bater a meta? quem precisa de atenção?",
      fala: "E no painel da gerente, a venda do Rafael já está nos números: BL vendida 813, vendas válidas 951, Samambaia 113. O painel responde às perguntas do gestor: vamos bater a meta? Projeção de 1.061 contra 1.160, atenção. Quem precisa de atenção? As equipes abaixo do ritmo, na mesma régua. Tudo calculado pelo sistema, com a mesma regra do app do vendedor.",
      clicar: "Avançar. 'Abrir o painel real' mostra o sistema de verdade com dados fictícios, se pedirem.", observar: "Os '+1' verdes e a linha da Samambaia destacada.",
      simulado: "Os números são fictícios (base da demonstração: 812 BL, 1.034 vendas). O painel real recalcula a cada consulta; a atualização aqui é imediata ao avançar.",
      evidencia: "pg_dash.js:172-266 (painel: resultado do mês, projeção, equipes, desvios, filas); api/src/fechamento.js (regra única de ritmo e projeção).", transicao: "Como começar a usar na empresa." } });
})();
