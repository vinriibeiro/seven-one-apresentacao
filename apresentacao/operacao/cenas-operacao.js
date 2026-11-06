"use strict";
/* Seven One · apresentação para a operação (vendedores, backoffice, supervisores, coordenadores e gerência).
   Usa o motor ../sistema/tour.js. Cada função tem um capítulo; os botões "Abrir no sistema" mostram o sistema de verdade
   com dados fictícios (a vitrine em ../sistema/demo/), dentro da própria apresentação. Nada é gravado.
   Fonte das regras: api/public/navegacao.js (o que cada perfil vê) e api/public/pg_wiki.js (como cada tela funciona). */
(() => {
  const T = window.TOUR, U = window.UI, esc = U.esc;
  const { cab, aprof } = U;

  /* ====== ajuste aqui o que é seu ====== */
  const PERFIL = { nome: "Vinícius Ribeiro da Silva", funcao: "Desenvolvedor do Seven One", endereco: "controleseven.com.br" };
  window.PERFIL = PERFIL;

  T.inicial(() => ({}));

  /* ====== peças ====== */
  const TELAS = "../sistema/telas/";
  const DEMO = "../sistema/demo/";
  const F = { vend: ["f-vend", "Vendedor"], cad: ["f-cad", "Backoffice · Cadastro"], qua: ["f-qua", "Backoffice · Qualidade"], lid: ["f-lid", "Supervisor e coordenador"], ger: ["f-ger", "Gerência"], todos: ["f-todos", "Para todos"] };
  const funcao = (k) => `<span class="funcao ${F[k][0]}"><i></i>${F[k][1]}</span>`;
  /** etiqueta da função e o marcador do capítulo na mesma linha (sem repetir o nome da função) */
  const topo = (k, n, h, sub) => `<div class="linha-f">${funcao(k)}<span class="cap-n">${n.replace(/^.* · /, "")}</span></div>${cab("", h, sub)}`;
  const web = (arq, alt) => `<img class="print web" src="${TELAS}${arq}" alt="${esc(alt)}">`;
  const celImg = (arq, alt) => `<img class="print cel" src="${TELAS}${arq}" alt="${esc(alt)}">`;
  const marc = (itens, cor, cls = "") => `<ol class="marc ${cls}" style="--c:var(${cor})">${itens.map((t) => `<li><span>${t}</span></li>`).join("")}</ol>`;
  const demoBtn = (id, t) => `<button class="btn-demo" data-aprofundar="${id}">${t}</button>`;
  const dica = (t, cls = "") => `<div class="dica ${cls}">${t}</div>`;
  const SIMULADO = "Todos os nomes, clientes e números da tela são fictícios (vitrine de demonstração). As regras e as telas são as do sistema em produção.";

  /* ====== o sistema de verdade, dentro da apresentação ====== */
  const demo = (t, u) => ({ titulo: t, etiqueta: "Sistema real · dados fictícios · nada é gravado", iframe: u });
  T.aprofundamento("demo-vendedor", demo("App do vendedor", "celular.html?perfil=vendedor&rota=/meu"));
  T.aprofundamento("demo-vendedor-viab", demo("App do vendedor · Viabilidade", "celular.html?perfil=vendedor&rota=/viabilidade"));
  T.aprofundamento("demo-cadastro", demo("Backoffice de Cadastro · Viabilidade", DEMO + "?perfil=cadastro#/viabilidade"));
  T.aprofundamento("demo-cadastro-rota", demo("Backoffice de Cadastro · Rota de instalação", DEMO + "?perfil=cadastro#/rota"));
  T.aprofundamento("demo-qualidade", demo("Backoffice de Qualidade · D+1 / D+15", DEMO + "?perfil=qualidade#/confirmacao"));
  T.aprofundamento("demo-qualidade-fpd", demo("Backoffice de Qualidade · FPD", DEMO + "?perfil=qualidade#/ind-qualidade"));
  T.aprofundamento("demo-lider", demo("Supervisor · Visão da equipe", DEMO + "?perfil=lider#/equipe"));
  T.aprofundamento("demo-lider-app", demo("Supervisor · no celular", "celular.html?perfil=lider&rota=/equipe"));
  T.aprofundamento("demo-coordenador", demo("Coordenador · Visão da coordenação", DEMO + "?perfil=coordenador#/equipe"));
  T.aprofundamento("demo-gerente", demo("Gerência · Painel", DEMO + "?perfil=gestor#/dashboard"));
  T.aprofundamento("demo-gerente-fech", demo("Gerência · Fechamento do dia", DEMO + "?perfil=gestor#/fechamento"));
  T.aprofundamento("demo-wiki", demo("Wiki · ajuda dentro do sistema", DEMO + "?perfil=vendedor#/wiki"));

  /* ====== capítulos ====== */
  T.capitulo({ id: "abertura", titulo: "Abertura", curto: "Abertura", resumo: "O que é o Seven One e o que cada um vai levar daqui." });
  T.capitulo({ id: "dia", titulo: "O que muda no dia a dia", curto: "O que muda", resumo: "Antes e agora, um número só para todos e quem vê o quê." });
  T.capitulo({ id: "acesso", titulo: "Entrar, instalar e pedir ajuda", curto: "Acesso", resumo: "Primeiro acesso, senha, app no celular e a Wiki." });
  T.capitulo({ id: "caminho", titulo: "Uma venda, todos juntos", curto: "A venda", resumo: "O caminho da venda e quem faz o quê em cada etapa." });
  T.capitulo({ id: "vendedor", titulo: "Vendedor", curto: "Vendedor", resumo: "O mês no app, viabilidade, envio da venda, acompanhamento e premiação." });
  T.capitulo({ id: "cadastro", titulo: "Backoffice de Cadastro", curto: "Cadastro", resumo: "A fila do dia, lançar vendas certo e a rota de instalação." });
  T.capitulo({ id: "qualidade", titulo: "Backoffice de Qualidade", curto: "Qualidade", resumo: "D+1 / D+15, cobrança, churn e FPD." });
  T.capitulo({ id: "lideranca", titulo: "Supervisor e coordenador", curto: "Liderança", resumo: "A visão da equipe, a meta do mês e a premiação da equipe." });
  T.capitulo({ id: "gerencia", titulo: "Gerência", curto: "Gerência", resumo: "A rotina de gestão e o controle de acessos." });
  T.capitulo({ id: "combinados", titulo: "Combinados e próximos passos", curto: "Combinados", resumo: "As regras da operação, a primeira semana e onde pedir ajuda." });

  /* ================================================================== ABERTURA */
  T.passo({ cap: "abertura", id: "capa", titulo: "Seven One na operação", tempo: 40, classe: "escura",
    cena: () => `<div class="capa"><div class="marca marca-one"><img src="assets/seven-one-branco.png" alt="Seven One"></div>
      <div class="cap-n">APRESENTAÇÃO PARA A OPERAÇÃO · SEVEN TELECOM</div>
      <h1>Uma venda, um sistema.<br>Cada um no seu papel.</h1>
      <p class="sub">Como vendedores, backoffice, supervisores, coordenadores e gerência trabalham juntos no Seven One, do pedido de viabilidade até a premiação.</p>
      <div class="publico">${["vend", "cad", "qua", "lid", "ger"].map((k) => `<span class="${F[k][0]}"><i></i>${F[k][1]}</span>`).join("")}</div>
      <div class="assin">${esc(PERFIL.nome)} · ${esc(PERFIL.funcao)}</div></div>`,
    notas: { objetivo: "Abrir dizendo para quem é e qual a promessa: todo mundo no mesmo sistema.", fala: "Bom dia, pessoal. Hoje a conversa é com a operação inteira: vendedores, backoffice de Cadastro e de Qualidade, supervisores, coordenadores e gerência. O Seven One é o sistema onde a venda nasce, anda e vira premiação. A ideia de hoje é cada um sair daqui sabendo três coisas: onde entra, o que faz no dia e onde pede ajuda. Os nomes e números que vocês vão ver na tela são fictícios.", clicar: "Avançar.", observar: "As cinco funções na capa: todo mundo está incluído.", simulado: SIMULADO, transicao: "O roteiro de hoje." } });

  T.passo({ cap: "abertura", id: "agenda", titulo: "O que vamos ver hoje", tempo: 50,
    cena: () => `<div class="pad">${cab("ROTEIRO DE HOJE", "Cada um sai daqui sabendo onde entra, o que faz e onde pede ajuda", "Primeiro a parte que vale para todos. Depois, um bloco para cada função. Clique numa função para ir direto ao bloco dela.")}
      <div class="conteudo"><div class="col">
        <div class="roteiro-hoje">
          <div><span class="n">01</span><b>O que muda</b>Antes e agora, e por que o número é um só.</div>
          <div><span class="n">02</span><b>Acesso e ajuda</b>Senha, app no celular e a Wiki.</div>
          <div><span class="n">03</span><b>A venda</b>O caminho dela e quem faz o quê.</div>
          <div><span class="n">04</span><b>Combinados</b>As regras do jogo e a primeira semana.</div>
        </div>
        <div class="papeis">
          <button class="papel f-vend" style="--c:var(--f-vend)" data-ir="vendedor"><b>Vendedor</b><span>Meta, viabilidade, venda, agenda e premiação no app.</span><em>3 cenas →</em></button>
          <button class="papel f-cad" style="--c:var(--f-cad)" data-ir="cadastro"><b>Cadastro</b><span>Fila do dia, lançamento de vendas e rota.</span><em>3 cenas →</em></button>
          <button class="papel f-qua" style="--c:var(--f-qua)" data-ir="qualidade"><b>Qualidade</b><span>Pós-instalação, cobrança, churn e FPD.</span><em>2 cenas →</em></button>
          <button class="papel f-lid" style="--c:var(--f-lid)" data-ir="lideranca"><b>Supervisor e coordenador</b><span>Visão da equipe, meta e premiação.</span><em>2 cenas →</em></button>
          <button class="papel f-ger" style="--c:var(--f-ger)" data-ir="gerencia"><b>Gerência</b><span>Rotina de gestão e controle de acessos.</span><em>2 cenas →</em></button>
        </div>
      </div></div></div>`,
    notas: { objetivo: "Mostrar que tem parte para todos e um bloco de cada função.", fala: "Vou começar pelo que vale para todo mundo: o que muda no dia a dia, como entrar e como pedir ajuda, e o caminho de uma venda. Depois passo por cada função. Peço que todo mundo preste atenção também nos blocos das outras funções: quando o vendedor entende o que o Cadastro precisa, a resposta volta mais rápido. No fim fecho com os combinados da operação.", clicar: "Avançar. Os cartões de função levam direto ao bloco, se o tempo apertar.", observar: "Os cinco blocos de função.", simulado: "O tempo previsto é de cerca de 25 minutos, mais perguntas.", transicao: "O que muda no dia a dia." } });

  /* ================================================================== O QUE MUDA */
  T.passo({ cap: "dia", id: "antes-agora", titulo: "O que muda no dia a dia", tempo: 70,
    cena: () => `<div class="pad">${topo("todos", "O QUE MUDA", "Menos mensagem solta, mais venda acompanhada", "O que antes dependia de grupo, ligação e planilha agora fica num lugar só, com aviso na hora.")}
      <div class="conteudo"><div class="col"><div class="troca">
        <div class="h">Antes</div><div class="h seta"></div><div class="h agora">Agora, no Seven One</div>
        <div>Pedido de viabilidade no grupo, perdido entre mensagens</div><div class="seta">→</div><div class="agora"><span>Pedido numa <b>fila</b>, com o tempo de espera e aviso na hora da resposta</span></div>
        <div>“Como está a minha venda?” por mensagem ou ligação</div><div class="seta">→</div><div class="agora"><span>A <b>situação</b> de cada venda no app: pendente, instalada ou cancelada</span></div>
        <div>Cada um com o seu controle, números diferentes</div><div class="seta">→</div><div class="agora"><span><b>Um número só</b>: o que o vendedor vê é o que o gerente vê</span></div>
        <div>Premiação conhecida só no fim do mês</div><div class="seta">→</div><div class="agora"><span><b>Parcial da premiação</b> todo dia, com o que falta para a meta</span></div>
        <div>Fechamento do dia montado à mão</div><div class="seta">→</div><div class="agora"><span><b>Fechamento pronto</b>: texto do WhatsApp, Excel e PDF, por equipe</span></div>
        <div>Ninguém sabe quem mudou o quê</div><div class="seta">→</div><div class="agora"><span><b>Histórico</b> de cada alteração, com quem fez e quando</span></div>
      </div></div></div></div>`,
    notas: { objetivo: "Conectar o sistema com dores que a operação reconhece.", fala: "Olhem a coluna da esquerda: tenho certeza que todo mundo aqui já viveu pelo menos uma dessas. Pedido de viabilidade que some no grupo, vendedor ligando para saber da venda, número do supervisor diferente do número do gerente. A coluna da direita é o que o Seven One faz. Não é mais trabalho: é o mesmo trabalho, só que registrado num lugar onde todo mundo enxerga.", clicar: "Avançar.", observar: "Cada linha da esquerda tem uma resposta concreta na direita.", simulado: "Não prometer fim do WhatsApp: o fechamento continua sendo enviado no grupo, só que já pronto.", transicao: "Um número só: quem vê o quê." } });

  T.passo({ cap: "dia", id: "quem-ve", titulo: "Um número só, cada um vê a sua parte", tempo: 60,
    cena: () => `<div class="pad">${topo("todos", "UM NÚMERO SÓ", "Todo mundo olha o mesmo dado. Cada um vê a sua parte.", "O que cada pessoa enxerga depende do perfil cadastrado. A proteção é feita no servidor: quem não tem permissão não vê, nem sabendo o endereço da tela.")}
      <div class="conteudo"><div class="col"><table class="tab">
        <tr><th>Perfil</th><th>O que vê e faz</th><th>App no celular</th></tr>
        <tr><td style="--c:var(--f-vend)"><i></i>Vendedor</td><td>As próprias vendas, viabilidades, agenda, meta e premiação</td><td class="sim">Sim</td></tr>
        <tr><td style="--c:var(--f-cad)"><i></i>Backoffice · Cadastro</td><td>Lança e corrige vendas, responde viabilidade, Conexão/Solar, rota (D-1), pendências e fechamento</td><td class="nao">Navegador</td></tr>
        <tr><td style="--c:var(--f-qua)"><i></i>Backoffice · Qualidade</td><td>D+1 / D+15, cobrança, churn, FPD e indicadores; vendas só para consulta</td><td class="nao">Navegador</td></tr>
        <tr><td style="--c:var(--f-lid)"><i></i>Supervisor · Coordenador</td><td>As equipes sob a sua responsabilidade: vendas, ritmo, meta e premiação</td><td class="sim">Sim</td></tr>
        <tr><td style="--c:var(--f-ger)"><i></i>Gerente · Administrador</td><td>Tudo, inclusive valores em R$, FPD, Extrato Claro, usuários e segurança</td><td class="sim">Sim</td></tr>
      </table>${dica("<b>Por que isso importa:</b> quando o número do vendedor bate com o do supervisor e com o do gerente, a conversa deixa de ser “qual número está certo” e passa a ser “o que fazer para bater a meta”.")}</div></div></div>`,
    notas: { objetivo: "Explicar perfis e o motivo de cada um ver uma parte.", fala: "O sistema tem um banco de dados só. O número que o vendedor vê no app é exatamente o mesmo que o supervisor e o gerente veem. O que muda é o recorte: o vendedor vê as vendas dele, o supervisor vê a equipe dele, o gerente vê tudo. E isso não é só esconder botão: o servidor confere a permissão a cada pedido. Backoffice usa pelo navegador, que tem todas as telas; vendedor, supervisor, coordenador e gerente também têm o app.", clicar: "Avançar.", observar: "A coluna do app: backoffice usa o navegador.", simulado: "Supervisor e coordenador só enxergam as equipes em que estão marcados em Usuários e acessos → Equipes. Sem vínculo, a tela fica vazia.", evidencia: "api/public/navegacao.js (PERFIS e ABAS); pg_wiki.js, “Começar aqui”.", transicao: "Como entrar." } });

  /* ================================================================== ACESSO */
  T.passo({ cap: "acesso", id: "entrar", titulo: "Entrar, trocar a senha e instalar o app", tempo: 75,
    cena: () => `<div class="pad grande-txt">${topo("todos", "ACESSO", "Entrar, trocar a senha e instalar o app", `Endereço: <b class="mono">${esc(PERFIL.endereco)}</b> · o acesso é o seu e-mail.`)}
      <div class="conteudo">
        <div class="col"><div class="cartoes c2">
          <div class="cartao"><h3>Primeiro acesso</h3>${marc(["Entre com o seu e-mail e a senha temporária.", "O sistema pede para trocar por uma senha sua: <b>10 caracteres ou mais</b>, com letras e números.", "Sem senha óbvia e sem o seu e-mail dentro dela."], "--brand", "compacta")}</div>
          <div class="cartao"><h3>Instalar o app</h3>${marc(["Abra o endereço no navegador do celular e entre.", "<b>Android (Chrome):</b> menu ⋮ → Instalar aplicativo.", "<b>iPhone (Safari):</b> Compartilhar → Adicionar à Tela de Início.", "Abra sempre pelo ícone."], "--brand", "compacta")}</div>
          <div class="cartao"><h3>Esqueci a senha</h3><p>Link <b>Esqueci a senha</b> na entrada. O pedido vai para o gerente, que gera uma senha temporária para você. Não sai e-mail automático, para ninguém pedir senha no seu lugar.</p></div>
          <div class="cartao"><h3>Conta bloqueada</h3><p><b>5 senhas erradas</b> bloqueiam a conta por 15 minutos. Sem uso, o sistema sai sozinho depois de 2 horas (8 horas com a verificação em dois fatores ligada).</p></div>
        </div></div>
        <div class="col estreita" style="flex:0 0 380px;align-items:center">${celImg("app-inicio.png", "Tela inicial do app")}</div>
      </div></div>`,
    notas: { objetivo: "Garantir que todos saem sabendo entrar e instalar.", fala: "O endereço é controleseven.com.br e o acesso é o seu e-mail. No primeiro acesso o sistema obriga a trocar a senha temporária por uma sua, com pelo menos dez caracteres, letras e números. Para quem usa o app: abra o endereço no celular e instale pelo menu do navegador; a partir daí, abra sempre pelo ícone. Esqueceu a senha? Tem o link na entrada; o pedido chega no gerente, que libera uma senha nova. E atenção: cinco senhas erradas bloqueiam por quinze minutos.", clicar: "Avançar. Se alguém pedir, mostre a instalação no próprio celular.", observar: "O caminho de instalação para Android e iPhone.", simulado: "A verificação em dois fatores é opcional; recomendada para gerência e backoffice, que veem dados em volume.", evidencia: "pg_wiki.js, tópicos “Começar aqui”, “App do vendedor” e “Segurança da sua conta (2FA)”.", transicao: "E quando surgir dúvida?" } });

  T.passo({ cap: "acesso", id: "ajuda", titulo: "A ajuda está dentro do sistema", tempo: 50,
    cena: () => `<div class="pad">${topo("todos", "AJUDA", "Dúvida? O botão Ajuda abre a Wiki no assunto da tela", "A Wiki é o manual do sistema, escrita para cada função. Cada um vê só os assuntos das telas que usa.")}
      <div class="conteudo">
        <div class="col">${marc(["<b>Ajuda (?)</b> no alto da tela ou na faixa da esquerda: a Wiki abre já no assunto certo.", "<b>Primeiros passos</b>: um roteiro de primeira semana para a sua função, para ir marcando.", "<b>Glossário</b>: BL, FPD, safra, DCC, D+1, D+15, conectividade e o resto das siglas.", "<b>O que mudou</b>: as novidades de cada versão do sistema."], "--brand", "solta")}
          ${dica("<b>Dica:</b> antes de perguntar no grupo, toque em Ajuda. A maioria das dúvidas de tela já está respondida lá, com desenho da tela.", "ok")}
          <div class="demos">${demoBtn("demo-wiki", "Abrir a Wiki no sistema")}</div></div>
        <div class="col"><div class="glos"><h3>Glossário rápido</h3>${[["BL", "Banda larga: a venda que conta na meta"], ["FPD", "Cliente que não pagou a 1ª fatura no prazo"], ["Safra", "O mês em que a venda foi feita"], ["DCC", "Débito em conta corrente"], ["M/P", "Chip de migração ou portabilidade"], ["D-1", "Véspera da instalação: confirmar com o cliente"], ["D+1 · D+15", "Ligações 1 e 15 dias depois da instalação"], ["Conectividade", "Instaladas ÷ vendas do mês"]].map(([t, d]) => `<b>${t}</b><span>${d}</span>`).join("")}</div></div>
      </div></div>`,
    notas: { objetivo: "Fazer da Wiki o primeiro lugar de dúvida.", fala: "Todo mundo tem um botão de Ajuda em qualquer tela. Ele abre a Wiki direto no assunto daquela tela. E tem uma parte chamada Primeiros passos, que é um roteiro da primeira semana para cada função: vendedor tem o dele, Cadastro tem o dele, supervisor tem o dele. Vale marcar item por item. Vou abrir rapidinho para vocês verem.", clicar: "Abrir a Wiki no sistema (mostrar a aba Primeiros passos e o Glossário). Fechar com Esc.", observar: "A Wiki com desenho das telas e o roteiro por função.", simulado: SIMULADO, evidencia: "api/public/pg_wiki.js", transicao: "O caminho de uma venda." } });

  /* ================================================================== CAMINHO DA VENDA */
  T.passo({ cap: "caminho", id: "raias", titulo: "O caminho da venda e quem faz o quê", tempo: 100,
    cena: () => {
      const L = [
        ["vend", "Vendedor", ["Pede no app, na porta do cliente", "Envia a venda finalizada", "Acompanha a situação", "Confirma o cliente se preciso", "—", "Vê a parcial todo dia"]],
        ["cad", "Cadastro", ["Responde: atende ou não atende", "Trata a venda e lança o contrato", "Corrige e trata pendências", "Confirma a véspera (D-1) e dá o resultado", "—", "—"]],
        ["qua", "Qualidade", ["—", "—", "—", "—", "Liga no D+1 e D+15, cobra a 1ª fatura, acompanha churn e FPD", "O FPD define a faixa"]],
        ["lid", "Supervisor · Coord.", ["Acompanha quem pede", "Vê a venda na equipe", "Cobra quem parou", "—", "Treina quem tem FPD alto", "Reparte a meta da equipe"]],
        ["ger", "Gerência", ["Fila parada?", "Painel e fechamento", "Ritmo do mês", "Rota do dia", "Qualidade e FPD", "Plano do mês e fechamento"]],
      ];
      const faz = new Set(["vend0", "vend1", "cad0", "cad1", "cad2", "cad3", "qua4", "lid2", "lid5", "ger5"]);
      const cor = { vend: "--f-vend", cad: "--f-cad", qua: "--f-qua", lid: "--f-lid", ger: "--f-ger" };
      const et = [["1 · APP", "Viabilidade"], ["2 · APP", "Conexão / Solar"], ["3 · WEB", "Contrato lançado"], ["4 · WEB", "Rota e instalação"], ["5 · WEB", "Pós-instalação"], ["6 · TODOS", "Meta e premiação"]];
      const grade = `<div class="et vazio"></div>` + et.map(([s, t]) => `<div class="et"><small>${s}</small>${t}</div>`).join("") +
        L.map(([k, n, cel]) => `<div class="q" style="--c:var(${cor[k]})"><i></i>${n}</div>` + cel.map((c, j) => `<div class="${faz.has(k + j) ? "faz" : "ve"}" style="--c:var(${cor[k]})">${c === "—" ? "" : esc(c)}</div>`).join("")).join("");
      return `<div class="pad">${topo("todos", "UMA VENDA, TODOS JUNTOS", "O caminho de uma venda e quem faz o quê", "Faixa colorida = quem executa a etapa. O resto da equipe acompanha a mesma venda, ao mesmo tempo.")}
        <div class="conteudo"><div class="col"><div class="raias">${grade}</div></div></div></div>`;
    },
    notas: { objetivo: "A cena mais importante: cada um se enxergar no fluxo e ver de quem depende.", fala: "Esta é a cena que eu queria que todo mundo guardasse. Uma venda passa por seis etapas. Um: o vendedor pede a viabilidade no app, ainda na porta do cliente, e o Cadastro responde. Dois: o vendedor envia a venda Conexão ou Solar e o Cadastro confere e lança o contrato. Três: a venda fica pendente e todo mundo acompanha. Quatro: na véspera da instalação o Cadastro confirma com o cliente, o D-1, e depois registra se instalou. Cinco: instalada, a Qualidade liga no dia seguinte e quinze dias depois, cobra a primeira fatura e acompanha quem pode cancelar. Seis: tudo isso vira meta e premiação. Repare que ninguém trabalha sozinho: se o vendedor manda o pedido incompleto, o Cadastro demora; se o Cadastro não dá resultado na rota, a venda não aparece como instalada e não conta para a premiação.", clicar: "Avançar.", observar: "As faixas coloridas: quem executa cada etapa.", simulado: "A venda nos sistemas da Claro (Conexão / Solar) continua sendo feita lá; o Seven One acompanha e registra. Não há integração automática com a Claro.", evidencia: "api/public/navegacao.js; pg_wiki.js, “Operação do dia” e “Qualidade e FPD”.", transicao: "Começando pelo vendedor." } });

  /* ================================================================== VENDEDOR */
  T.passo({ cap: "vendedor", id: "vend-mes", titulo: "Vendedor: o seu mês na tela de início", tempo: 80,
    cena: () => `<div class="pad">${topo("vend", "VENDEDOR · 1 DE 3", "Abriu o app, já sabe quanto vendeu, quanto falta e o que fazer agora", "")}
      <div class="conteudo">
        <div class="col estreita" style="flex:0 0 380px;align-items:center">${celImg("vendedor-meu.png", "Início do app do vendedor")}</div>
        <div class="col">${marc(["<b>BL vendida × meta do plano.</b> O tracinho na barra mostra onde você deveria estar hoje.", "<b>No ritmo, atenção ou abaixo do ritmo</b>, com a projeção do mês.", "<b>BL por dia útil para a meta:</b> quantas por dia, nos dias úteis que sobram.", "<b>Para fazer agora:</b> viabilidade respondida, retorno do backoffice e os clientes para ligar hoje.", "<b>Premiação parcial</b> pelas vendas instaladas até hoje."], "--f-vend")}
          <div class="conta-dia" style="margin-top:22px"><div><b>1</b>segunda a sexta, cada dia</div><div><b>0,5</b>sábado vale meio dia útil</div><div><b>0</b>domingo e feriado não contam</div></div>
          <div class="demos">${demoBtn("demo-vendedor", "Abrir o app do vendedor")}</div></div>
      </div></div>`,
    notas: { objetivo: "O vendedor entender a tela que vai abrir todo dia.", fala: "Vendedor, essa é a sua tela. Abriu o app, ela responde três perguntas: quanto eu vendi, quanto falta e o que eu preciso fazer agora. A barra mostra a sua BL contra a meta, e o tracinho é onde você deveria estar hoje. Embaixo, quantas BL por dia útil faltam. E uma regra importante: segunda a sexta vale um dia, sábado vale meio dia, domingo e feriado não contam. Em Para fazer agora aparecem as respostas do backoffice e os clientes que você marcou para ligar.", clicar: "Abrir o app do vendedor (mostrar Início e a barra de baixo). Fechar com Esc.", observar: "O tracinho da meta e a lista Para fazer agora.", simulado: SIMULADO + " A parcial da premiação só vale como definitiva quando o gerente fecha o mês.", evidencia: "pg_wiki.js, “Meu dia no app”.", transicao: "Como pedir viabilidade e mandar a venda." } });

  T.passo({ cap: "vendedor", id: "vend-viab", titulo: "Pedir viabilidade e enviar a venda", tempo: 80,
    cena: () => `<div class="pad">${topo("vend", "VENDEDOR · 2 DE 3", "Pede a viabilidade no + e recebe a resposta na hora", "O botão + no meio da barra faz as três coisas: pedir viabilidade, enviar venda Conexão ou Solar e marcar retorno na agenda.")}
      <div class="conteudo">
        <div class="col estreita" style="flex:0 0 380px;align-items:center">${celImg("vendedor-viabilidade.png", "Viabilidade no app")}</div>
        <div class="col">
          <h3 style="font-size:28px">Viabilidade</h3>
          ${marc(["Toque no <b>+</b> e em <b>Pedir viabilidade</b>. Digite o CEP: cidade, bairro e UF vêm sozinhos.", "Complete número e referência. Se ajudar, nome e telefone do cliente.", "Escreva na <b>observação</b> o que o backoffice precisa saber.", "Acompanhe: <b>Aguardando</b>, <b>Atende</b> ou <b>Não atende</b>. O aviso chega na hora."], "--f-vend", "compacta")}
          <h3 style="font-size:28px;margin-top:20px">Venda Conexão / Solar</h3>
          <p style="font-size:21px">Fez a venda no Conexão ou no Solar? Envie pelo <b>+</b>. O Cadastro trata e responde no próprio pedido: <b>correção</b>, <b>criação de HP</b> (com prazo), <b>pendência</b> ou <b>finalizado</b>.</p>
          ${dica("<b>Atenção:</b> viabilidade não é venda. Depois do “atende”, a venda precisa ser enviada e lançada pelo Cadastro.", "at")}
          <div class="demos">${demoBtn("demo-vendedor-viab", "Abrir a viabilidade no app")}</div></div>
      </div></div>`,
    notas: { objetivo: "Tirar a viabilidade do grupo de WhatsApp.", fala: "O botão vermelho do meio, o mais, é o seu atalho. Pediu viabilidade ali, na porta do cliente, com o CEP o resto vem sozinho. E escreve a observação: “prédio de três andares, cliente quer 500 mega”. Quanto melhor a observação, mais rápida e certa a resposta. A resposta chega como aviso no celular. Fez a venda no Solar ou no Conexão? Manda pelo mesmo botão e acompanha ali o retorno do Cadastro: correção, criação de HP com prazo, pendência ou finalizado. E lembrem: viabilidade com atende ainda não é venda.", clicar: "Abrir a viabilidade no app e tocar em + para mostrar o menu de registrar.", observar: "O menu do + com as três opções.", simulado: SIMULADO, evidencia: "pg_wiki.js, “Pedir viabilidade”; navegacao.js, REGISTRAR.", transicao: "Acompanhar a venda depois." } });

  T.passo({ cap: "vendedor", id: "vend-acomp", titulo: "Acompanhar vendas, agenda e premiação", tempo: 80,
    cena: () => `<div class="pad">${topo("vend", "VENDEDOR · 3 DE 3", "Sua venda andando, seus retornos e o que falta para a meta", "")}
      <div class="conteudo"><div class="col"><div class="cels" style="height:740px">
        <figure>${celImg("vendedor-vendas.png", "Minhas vendas")}<figcaption><b>Vendas › Contratos</b>Pendente, instalada ou cancelada. Só a instalada conta para a meta.</figcaption></figure>
        <figure>${celImg("vendedor-crm.png", "Agenda")}<figcaption><b>Agenda</b>Retornos para ligar ou visitar. Aparecem no Início no dia marcado.</figcaption></figure>
        <figure>${celImg("vendedor-comissao.png", "Minha premiação")}<figcaption><b>Premiação</b>Base por BL instalada, bônus e o que falta para a meta mínima.</figcaption></figure>
      </div></div>
      <div class="col estreita" style="flex:0 0 470px;gap:16px">
        ${dica("<b>Faixa 1 ou Faixa 2?</b> Depende do seu FPD. Cliente que paga a primeira fatura mantém você na Faixa 2, que paga mais por BL.", "ok")}
        ${dica("<b>Débito em conta (DCC)</b> costuma reduzir o FPD e ainda dá bônus.")}
        ${dica("<b>Não achou uma venda?</b> Fale com o Cadastro: ela pode ainda não ter sido lançada.", "at")}
      </div></div></div>`,
    notas: { objetivo: "Mostrar ao vendedor que ele acompanha tudo sem precisar perguntar.", fala: "Em Vendas, na aba Contratos, ficam todas as suas vendas, cada uma com a situação: pendente, instalada ou cancelada. Só a instalada conta para a meta e para a premiação. Na Agenda você marca o retorno de um cliente e ele aparece no seu Início no dia certo. E na Premiação você vê quanto já tem no mês e quanto falta para a meta mínima. Uma coisa que eu quero deixar clara: a faixa depende do FPD, que é o cliente que não paga a primeira fatura. Vender para quem paga coloca dinheiro no seu bolso.", clicar: "Avançar.", observar: "As três telas e a regra da faixa.", simulado: SIMULADO + " Valores e faixas vêm do Plano do mês publicado pelo gerente.", evidencia: "pg_wiki.js, “Minhas vendas” e “Minha premiação”.", transicao: "Agora, quem recebe esses pedidos: o Cadastro." } });

  /* ================================================================== CADASTRO */
  T.passo({ cap: "cadastro", id: "cad-fila", titulo: "Cadastro: a fila do dia", tempo: 75,
    cena: () => `<div class="pad">${topo("cad", "BACKOFFICE DE CADASTRO · 1 DE 3", "A fila mostra o que está esperando e há quanto tempo", "Cada pedido do vendedor chega aqui na hora, com aviso. Quem responde fica registrado.")}
      <div class="conteudo">
        <div class="col larga">${web("cadastro-viabilidade.png", "Fila de viabilidade")}</div>
        <div class="col">${marc(["Abra o pedido na fila e consulte no portal da Claro.", "Marque <b>Atende</b> ou <b>Não atende</b> e escreva a <b>observação</b> (ex.: “rede HFC, até 1 Giga”).", "O vendedor recebe o aviso na hora. Os dois conversam pelo próprio pedido.", "Em <b>Conexão / Solar</b>, trate a venda enviada e responda: correção, criação de HP, pendência ou finalizado."], "--f-cad")}
          ${dica("<b>Dica:</b> “Não atende” sem explicação volta como pergunta e gasta o seu tempo de novo.", "at")}
          <div class="demos">${demoBtn("demo-cadastro", "Abrir a fila no sistema")}</div></div>
      </div></div>`,
    notas: { objetivo: "Mostrar a fila e a importância da observação.", fala: "Cadastro, essa é a fila de vocês. Cada pedido de viabilidade chega com aviso e mostra há quanto tempo está esperando. Abriu, consultou no portal da Claro, marcou atende ou não atende e escreveu a observação. O vendedor recebe na hora. O mesmo vale para Conexão e Solar: o vendedor envia, vocês conferem e lançam o contrato. O pedido mais antigo da fila é o que mais pesa: vendedor esperando na porta do cliente é venda que pode cair.", clicar: "Abrir a fila no sistema, abrir um pedido e mostrar o campo de observação.", observar: "O tempo de espera de cada pedido.", simulado: SIMULADO, evidencia: "pg_wiki.js, “A fila do dia”.", transicao: "Lançar a venda certo." } });

  T.passo({ cap: "cadastro", id: "cad-lancar", titulo: "Lançar a venda certo da primeira vez", tempo: 75,
    cena: () => `<div class="pad">${topo("cad", "BACKOFFICE DE CADASTRO · 2 DE 3", "Venda lançada certo é venda que conta para o vendedor", "A venda nasce pendente e passa a instalada quando a instalação é confirmada.")}
      <div class="conteudo">
        <div class="col larga">${web("cadastro-vendas.png", "Lista de vendas")}</div>
        <div class="col">${marc(["<b>Nova venda:</b> digite o CPF/CNPJ; cliente que já existe é reaproveitado.", "Marque produtos e quantidades, endereço, origem e forma de pagamento.", "<b>Confira o vendedor.</b> É por ele que a venda entra na meta e na premiação.", "<b>Lançamento em lote</b> e <b>Importar planilha:</b> leia a prévia antes de gravar; linha com erro não trava as outras.", "Corrigiu algo? Fica na Central de alterações, com quem fez e o quê."], "--f-cad", "compacta")}
          ${dica("<b>Na dúvida sobre um campo,</b> lance como pendente e registre uma observação no cliente. Tudo fica no histórico e dá para corrigir depois.")}</div>
      </div></div>`,
    notas: { objetivo: "Reduzir erros de lançamento, principalmente de vendedor.", fala: "Lançar certo é o que garante que a venda conte para quem vendeu. O ponto que mais dá problema é o vendedor: confiram sempre. A importação da planilha da Claro liga a venda ao vendedor pelo nome completo, então cadastro com nome diferente faz a venda não entrar no nome da pessoa. No lote e na importação, leiam a prévia: o sistema mostra linha por linha o que vai entrar e o motivo de cada recusa. E qualquer correção fica registrada, então não tenham medo de corrigir.", clicar: "Avançar.", observar: "O aviso de conferir o vendedor.", simulado: SIMULADO, evidencia: "pg_wiki.js, “Lançar vendas”; api/src/routes_importacao.js (vínculo pelo nome completo).", transicao: "A rota de instalação." } });

  T.passo({ cap: "cadastro", id: "cad-rota", titulo: "Rota de instalação e a véspera (D-1)", tempo: 70,
    cena: () => `<div class="pad">${topo("cad", "BACKOFFICE DE CADASTRO · 3 DE 3", "Rota do dia: confirmar a véspera e dar o resultado", "O botão Amanhã (D-1) abre as instalações do dia seguinte para confirmar com o cliente.")}
      <div class="conteudo">
        <div class="col larga">${web("cadastro-rota.png", "Rota de instalação")}</div>
        <div class="col">${marc(["<b>Amanhã (D-1):</b> ligue ou mande WhatsApp e marque quem confirmou.", "No dia, registre o resultado: <b>Instalado</b>, <b>Cliente ausente</b> ou <b>Cancelado</b> (com o motivo).", "<b>Instalado</b> na rota deixa a venda instalada, e só aí ela conta na meta.", "O aviso no alto mostra instalações de dias anteriores ainda sem resultado."], "--f-cad", "compacta")}
          ${dica("<b>Fechamento do dia:</b> no fim do expediente, o texto do WhatsApp, o Excel e o PDF saem prontos, por equipe.", "ok")}
          <div class="demos">${demoBtn("demo-cadastro-rota", "Abrir a rota no sistema")}</div></div>
      </div></div>`,
    notas: { objetivo: "Fechar o ciclo do Cadastro: sem resultado na rota, a venda não vira instalada.", fala: "A rota organiza as instalações por dia e por turno. Na véspera, com o botão Amanhã, vocês confirmam com o cliente: é o D-1. No dia, registrem o resultado de cada uma. Isso é muito importante para todo mundo aqui: é o instalado na rota que faz a venda virar instalada, e é a instalada que conta na meta e na premiação do vendedor. Rota sem resultado é vendedor sem venda contada. O aviso no alto lembra o que ficou para trás.", clicar: "Abrir a rota no sistema e clicar em Amanhã (D-1).", observar: "Os cartões de confirmadas, pendentes e instaladas.", simulado: SIMULADO, evidencia: "pg_wiki.js, “Operação do dia”; api/public/pg_rota.js.", transicao: "Depois da instalação, entra a Qualidade." } });

  /* ================================================================== QUALIDADE */
  T.passo({ cap: "qualidade", id: "qua-filas", titulo: "Qualidade: as filas depois da instalação", tempo: 80,
    cena: () => `<div class="pad">${topo("qua", "BACKOFFICE DE QUALIDADE · 1 DE 2", "Venda boa é a que instala, fica e paga", "O sistema monta as listas do dia sozinho. Cada ligação fica registrada; vale o último resultado.")}
      <div class="conteudo"><div class="col">
        <div class="filas">
          <div class="fila"><span class="tag">D+1 · D+15</span><h3>Pós-instalação</h3><p>Um dia e quinze dias depois da instalação. A internet funciona? Lembre a data da 1ª fatura e o débito em conta.</p>
            <div class="cli"><b>Maria Aparecida Souza</b>Internet 500 Mega · DCC · a ligar</div><div class="bots"><span class="on">Confirmado</span><span>Não atendeu</span><span>Problema</span></div></div>
          <div class="fila"><span class="tag">FATURA</span><h3>Cobrança de faturas</h3><p>Contratos ativos com a 1ª ou a 2ª fatura em aberto, do prazo mais urgente para o mais folgado.</p>
            <div class="cli"><b>José Carlos Pereira</b>1ª fatura em aberto · vence em 3 dias</div><div class="bots"><span>Fatura enviada</span><span>Em dia</span><span>Vai pagar</span><span>Vai negociar</span><span>Sem sucesso</span></div></div>
          <div class="fila"><span class="tag">120 DIAS</span><h3>Churn · 4 meses</h3><p>Instalados há até 120 dias que caíram, têm fatura não paga ou estão perto dos 4 meses.</p>
            <div class="cli"><b>Ana Beatriz Lima</b>instalada há 97 dias · 2ª fatura não paga</div><div class="bots"><span>Churn OK</span><span>Churn não OK</span><span>OS retirada</span></div></div>
        </div>
        ${dica("<b>Problema exige observação.</b> É ela que conta para o Cadastro, para o supervisor e para a gerência o que aconteceu com o cliente.", "at")}
        <div class="demos">${demoBtn("demo-qualidade", "Abrir as filas no sistema")}</div>
      </div></div></div>`,
    notas: { objetivo: "Mostrar as três filas da Qualidade e por que importam para a premiação de todos.", fala: "Qualidade, vocês entram depois da instalação, e o sistema monta as listas do dia sozinho. D+1 e D+15: ligar um dia e quinze dias depois da instalação, saber se está tudo funcionando e lembrar da primeira fatura. Cobrança: quem está com a primeira ou a segunda fatura em aberto, do mais urgente para o mais folgado. Churn: quem foi instalado há até quatro meses e está em risco. Cada contato fica registrado. E isso não é só da Qualidade: cliente que paga a primeira fatura é o que segura a faixa do vendedor e do supervisor.", clicar: "Abrir as filas no sistema (D+1 / D+15).", observar: "Os botões de resultado em cada fila.", simulado: "Os cartões desta cena são ilustrativos, com nomes fictícios; os resultados possíveis são os do sistema.", evidencia: "pg_wiki.js, “Qualidade e FPD” (Fila da Qualidade); api/public/pg_confirmacao.js e pg_fila.js.", transicao: "FPD: o número que decide a faixa." } });

  T.passo({ cap: "qualidade", id: "qua-fpd", titulo: "FPD: o número que decide a faixa", tempo: 70,
    cena: () => `<div class="pad grande-txt">${topo("qua", "BACKOFFICE DE QUALIDADE · 2 DE 2", "FPD: o cliente que não pagou a primeira fatura", "É o indicador da qualidade da venda. Vale para todo mundo aqui, não só para a Qualidade.")}
      <div class="conteudo">
        <div class="col"><div class="cartoes c3">
          <div class="cartao"><h3>Por safra</h3><p>Safra é o mês em que a venda foi feita. Uma safra só é confiável depois que as faturas dela venceram.</p></div>
          <div class="cartao"><h3>Referência 25%</h3><p>Acima disso, a barra da safra fica vermelha no gráfico.</p><div class="grande">25<small>%</small></div></div>
          <div class="cartao brand"><h3>Mexe no bolso</h3><p>FPD dentro do limite: Faixa 2, que paga mais. Acima: Faixa 1. Muito acima: sem premiação no mês.</p></div>
        </div>
        <div class="cartoes c2" style="margin-top:22px">
          <div class="cartao"><h3>O que a Qualidade faz</h3><p>Lança a lista de FPD da Claro em <b>Lançar FPD</b> (planilha ou contrato a contrato), confere a prévia e acompanha os indicadores de vendas, operação, vendedores e geografia.</p></div>
          <div class="cartao ok"><h3>O que todo mundo pode fazer</h3><p>Vender para quem tem condição de pagar, confirmar os dados de cobrança na hora da venda e oferecer débito em conta.</p></div>
        </div>
        <div class="demos">${demoBtn("demo-qualidade-fpd", "Abrir o FPD no sistema")}</div></div>
      </div></div>`,
    notas: { objetivo: "Fazer todo mundo entender FPD e a ligação com a premiação.", fala: "FPD é a sigla que mais vai aparecer: é o cliente que não pagou a primeira fatura. Ele é medido por safra, que é o mês da venda. A referência que usamos é vinte e cinco por cento. E aqui está o ponto para todo mundo: o FPD decide a faixa da premiação. Dentro do limite, Faixa 2, que paga mais por BL. Acima, Faixa 1. Muito acima, a pessoa não recebe no mês. Então qualidade não é assunto só da Qualidade: começa na venda.", clicar: "Abrir o FPD no sistema e mostrar o gráfico por safra.", observar: "A ligação entre FPD e faixa.", simulado: "Os limites exatos de FPD por faixa estão no Plano do mês publicado pelo gerente; não citar números de limite além da referência de 25% do gráfico. Valores em R$ e FPD somado ficam com Gerente e Administrador.", evidencia: "pg_wiki.js, “Qualidade e FPD” e “Premiação”.", transicao: "Agora, a liderança." } });

  /* ================================================================== LIDERANÇA */
  T.passo({ cap: "lideranca", id: "lid-equipe", titulo: "Supervisor e coordenador: a visão da equipe", tempo: 80,
    cena: () => `<div class="pad">${topo("lid", "SUPERVISOR E COORDENADOR · 1 DE 2", "Numa linha por vendedor: quem está no ritmo, quem parou e quem precisa de ajuda", "O supervisor vê as equipes em que é supervisor; o coordenador, as equipes da coordenação dele.")}
      <div class="conteudo">
        <div class="col larga">${web("gestor-equipe.png", "Visão da equipe")}</div>
        <div class="col">${marc(["<b>BL × meta</b> e <b>Ritmo</b> de cada vendedor: no ritmo, atenção ou abaixo.", "Ordene por <b>Últ. venda</b> para achar quem parou de vender.", "<b>% conect.</b> e <b>FPD 3m</b>: quem vende com qualidade e quem precisa de treino.", "<b>Vendas da equipe</b>: pendentes antigas costumam virar cancelamento."], "--f-lid", "compacta")}
          ${dica("<b>Equipe vazia?</b> Você precisa estar marcado como supervisor da equipe. Peça ao gerente para fazer o vínculo.", "at")}
          <div class="demos">${demoBtn("demo-lider", "Abrir a visão do supervisor")}${demoBtn("demo-lider-app", "No celular")}</div></div>
      </div></div>`,
    notas: { objetivo: "Dar ao supervisor uma rotina de leitura da equipe.", fala: "Supervisores e coordenadores, essa é a tela de trabalho de vocês. Uma linha por vendedor: BL contra a meta, o ritmo, quantas já instalaram, o FPD dos últimos três meses e há quantos dias a pessoa não vende. Uma dica prática: ordenem pela coluna Últ. venda toda manhã. Quem está há três, quatro dias sem vender é a primeira conversa do dia. E vocês têm isso também no app, no celular.", clicar: "Abrir a visão do supervisor e ordenar por Últ. venda.", observar: "A coluna Últ. venda e o ritmo.", simulado: SIMULADO, evidencia: "pg_wiki.js, “Visão da equipe”.", transicao: "Meta e premiação da equipe." } });

  T.passo({ cap: "lideranca", id: "lid-meta", titulo: "Meta do mês e premiação da equipe", tempo: 70,
    cena: () => `<div class="pad">${topo("lid", "SUPERVISOR E COORDENADOR · 2 DE 2", "O líder reparte a meta. O sistema não deixa passar da meta geral.", "")}
      <div class="conteudo">
        <div class="col" style="flex:0 0 660px;gap:20px">
          <div class="cartao"><h3>Meta de BL do mês</h3>${marc(["O gerente define a <b>meta geral</b>.", "Em <b>Premiação › Meta de BL do mês</b>, você preenche quanto cada vendedor deve entregar.", "A soma não pode passar da meta geral: o quadro mostra quanto falta distribuir."], "--f-lid", "compacta")}</div>
          <div class="cartao"><h3>Premiação da equipe</h3>${marc(["Escolha o mês e clique numa pessoa para ver a conta aberta.", "A faixa de cada um depende do FPD dela.", "O supervisor é premiado pelo que a equipe conectou e tem bônus por FPD baixo."], "--f-lid", "compacta")}</div>
          ${dica("<b>Fechamento da equipe:</b> o fechamento do dia sai separado por equipe, com totais e destaques só dela, pronto para mandar no grupo.", "ok")}
        </div>
        <div class="col" style="gap:20px">${web("gestor-comissao.png", "Premiação")}
          ${dica("<b>Meta de acompanhamento × meta mínima:</b> a meta que você reparte é para acompanhar o ritmo. A meta mínima para receber premiação é a do Plano do mês e não muda.")}</div>
      </div></div>`,
    notas: { objetivo: "Explicar a distribuição de meta e a premiação do líder.", fala: "Quando o gerente define a meta geral do mês, vocês repartem entre os vendedores da equipe, no quadro Meta de BL do mês. O sistema não aceita que a soma passe da meta geral e mostra quanto falta distribuir. Atenção a uma diferença: essa é a meta de acompanhamento. A meta mínima para receber premiação continua sendo a do Plano do mês. Na premiação da equipe vocês abrem a conta de cada pessoa. E o supervisor tem bônus por FPD baixo, então qualidade da equipe também é premiação de vocês.", clicar: "Avançar.", observar: "A diferença entre meta de acompanhamento e meta mínima.", simulado: "O coordenador tem meta registrada, mas não tem premiação calculada pelo sistema. Valores e regras dependem do Plano do mês publicado.", evidencia: "pg_wiki.js, “Premiação” e “Premiação da equipe”.", transicao: "A gerência." } });

  /* ================================================================== GERÊNCIA */
  T.passo({ cap: "gerencia", id: "ger-rotina", titulo: "Gerência: a rotina de gestão", tempo: 75,
    cena: () => `<div class="pad">${topo("ger", "GERÊNCIA · 1 DE 2", "Dez minutos por dia, meia hora por semana, um fechamento por mês", "Uma rotina que usa só telas que já existem.")}
      <div class="conteudo">
        <div class="col" style="flex:0 0 640px"><div class="rotina pilha">
          <div><h3>Todo dia</h3><span class="t">10 minutos</span><ul class="lista"><li><b>Painel:</b> projeção, ritmo e desvios</li><li><b>Fechamento:</b> texto no grupo e arquivos por equipe</li><li><b>Viabilidade:</b> pedido parado?</li><li><b>D+1 / D+15:</b> a fila foi trabalhada?</li><li><b>Sem venda hoje</b></li></ul></div>
          <div><h3>Toda semana</h3><span class="t">30 minutos</span><ul class="lista"><li><b>Equipes</b> por Últ. venda</li><li><b>Vendedores:</b> volume com qualidade</li><li><b>Operação:</b> prazo até a instalação</li><li><b>Geografia:</b> bairro com cancelamento alto</li></ul></div>
          <div><h3>Todo mês</h3><span class="t">fechamento</span><ul class="lista"><li>Publicar o <b>Plano do mês</b> e a meta geral</li><li><b>Extrato Claro</b> na quinzena</li><li><b>Lançar FPD</b> quando a Claro mandar</li><li>Fechar e conferir a <b>premiação</b></li></ul></div>
        </div>
        <div class="demos">${demoBtn("demo-gerente", "Abrir o Painel")}${demoBtn("demo-gerente-fech", "Abrir o Fechamento do dia")}</div></div>
        <div class="col">${web("gestor-dashboard.png", "Painel do gerente")}</div>
      </div></div>`,
    notas: { objetivo: "Dar à gerência uma cadência simples e mostrar ao time o que a gerência acompanha.", fala: "Para a gerência, a proposta é uma rotina. Todo dia, dez minutos: Painel, Fechamento, fila de viabilidade, fila da Qualidade e quem está sem venda hoje. Toda semana, meia hora: equipes, vendedores, prazo de instalação e geografia. Todo mês: publicar o plano e a meta, conferir o extrato da Claro, lançar o FPD e fechar a premiação. E eu mostro isso para todo mundo de propósito: é isso que a gerência vai olhar, então é isso que precisa estar em dia.", clicar: "Abrir o Painel ou o Fechamento do dia, conforme o interesse.", observar: "Que a rotina usa as mesmas telas que o time alimenta.", simulado: SIMULADO, evidencia: "pg_wiki.js, “Rotina do gerente”.", transicao: "Controle e acessos." } });

  T.passo({ cap: "gerencia", id: "ger-controle", titulo: "Controle: acessos, histórico e segurança", tempo: 65,
    cena: () => `<div class="pad">${topo("ger", "GERÊNCIA · 2 DE 2", "Quem entra, o que vê e o que mudou: tudo registrado", "")}
      <div class="conteudo">
        <div class="col larga">${web("gestor-usuarios.png", "Usuários e acessos")}</div>
        <div class="col">${marc(["<b>Usuários e acessos:</b> perfil, setor e equipe de cada pessoa. É isso que define quem vê o quê.", "<b>Nome completo igual ao da planilha da Claro.</b> Nome diferente faz a venda não entrar no nome do vendedor.", "<b>Central de alterações:</b> quem mudou o quê, e quando.", "<b>Quem está online</b> e <b>Segurança:</b> alertas automáticos e botão de emergência.", "<b>Feriados:</b> revisar todo ano, para a previsão não errar."], "--f-ger", "compacta")}
          ${dica("<b>Antes de criar um vendedor novo,</b> confira se já existe conta com nome parecido. Prefira corrigir a conta antiga.", "at")}</div>
      </div></div>`,
    notas: { objetivo: "Mostrar o controle e o cuidado com o cadastro de pessoas.", fala: "Na administração, o que mais importa para a operação é o cadastro das pessoas. O perfil, o setor e a equipe de cada um definem o que a pessoa vê. E o nome do vendedor precisa ser o nome completo, igual ao da planilha da Claro: é por ele que a venda importada entra no nome certo. Já tivemos duplicata por causa disso, e a venda ficava sem dono. Tudo o que muda fica na Central de alterações, e a página de Segurança dá alertas automáticos e o botão de emergência.", clicar: "Avançar.", observar: "O alerta do nome completo.", simulado: SIMULADO + " A verificação em dois fatores é opcional e recomendada para gerência e backoffice.", evidencia: "api/src/routes_importacao.js (vínculo pelo nome completo); pg_wiki.js, “Administração” e “Segurança: emergência e alertas”.", transicao: "Os combinados da operação." } });

  /* ================================================================== COMBINADOS */
  T.passo({ cap: "combinados", id: "regras", titulo: "Os combinados da operação", tempo: 90,
    cena: () => `<div class="pad">${topo("todos", "COMBINADOS", "Oito combinados para a operação andar junta", "")}
      <div class="conteudo"><div class="col"><div class="combinados">
        <div><span><b>Viabilidade e venda pelo app</b>Não pelo grupo. O que não está no sistema não tem fila, nem dono, nem histórico.</span></div>
        <div><span><b>Observação clara, sempre</b>Quem pede e quem responde escreve o que o outro precisa saber.</span></div>
        <div><span><b>Olhe no app antes de perguntar</b>A situação da venda e a resposta do backoffice já estão lá.</span></div>
        <div><span><b>Rota com resultado no mesmo dia</b>Sem “instalado” registrado, a venda não conta para ninguém.</span></div>
        <div><span><b>Nome completo igual ao da Claro</b>Confira o seu no Meu perfil. Errado, a venda não entra no seu nome.</span></div>
        <div><span><b>Senha é pessoal</b>Não empreste o acesso. Em computador compartilhado, sempre clique em Sair.</span></div>
        <div><span><b>Dado de cliente fica no sistema</b>Não mande CPF, telefone ou print de cliente em grupo.</span></div>
        <div><span><b>Qualidade antes de volume</b>Venda boa instala e paga. É ela que garante a Faixa 2.</span></div>
      </div></div></div></div>`,
    notas: { objetivo: "Fechar com regras simples que todos possam repetir.", fala: "Se vocês lembrarem de uma cena só, que seja esta. Oito combinados. Viabilidade e venda pelo app, não pelo grupo. Observação clara, dos dois lados. Antes de perguntar, olha no app. Rota com resultado no mesmo dia. Nome completo igual ao da Claro. Senha é pessoal. Dado de cliente fica no sistema, não vai para grupo. E qualidade antes de volume. Isso vale para todo mundo, do vendedor ao gerente.", clicar: "Avançar.", observar: "Os oito combinados.", simulado: "Os combinados são propostas de rotina da operação para a gerência validar; não são regras automáticas do sistema.", transicao: "A primeira semana de cada um." } });

  T.passo({ cap: "combinados", id: "semana", titulo: "A sua primeira semana", tempo: 60,
    cena: () => `<div class="pad">${topo("todos", "PRÓXIMOS PASSOS", "A sua primeira semana, função por função", "Está na Wiki, em Primeiros passos, para marcar item por item.")}
      <div class="conteudo"><div class="col"><div class="semana">
        <div style="--c:var(--f-vend)"><h3>Vendedor</h3><ul><li>Troquei a senha temporária</li><li>Instalei o app no celular</li><li>Vi minha meta e quantas BL faltam por dia útil</li><li>Pedi uma viabilidade de teste</li><li>Abri Minhas vendas e Minha premiação</li></ul></div>
        <div style="--c:var(--f-cad)"><h3>Cadastro</h3><ul><li>Troquei a senha temporária</li><li>Respondi uma viabilidade com observação</li><li>Lancei uma venda do começo ao fim</li><li>Usei o lote lendo a prévia</li><li>Conferi a rota de amanhã (D-1) e fechei o dia</li></ul></div>
        <div style="--c:var(--f-qua)"><h3>Qualidade</h3><ul><li>Troquei a senha temporária</li><li>Trabalhei a fila D+1 / D+15 do dia</li><li>Entendi FPD, safra e a referência de 25%</li><li>Olhei os motivos de cancelamento</li><li>Vi na Geografia onde cancela mais</li></ul></div>
        <div style="--c:var(--f-lid)"><h3>Supervisor e coord.</h3><ul><li>Troquei a senha e instalei o app</li><li>Conferi se estou vinculado à minha equipe</li><li>Ordenei por Últ. venda</li><li>Reparti a meta de BL do mês</li><li>Abri a premiação da equipe</li></ul></div>
        <div style="--c:var(--f-ger)"><h3>Gerência</h3><ul><li>Liguei a verificação em dois fatores</li><li>Conferi perfis, equipes e nomes completos</li><li>Publiquei o plano e a meta geral</li><li>Mandei o fechamento por equipe</li><li>Revisei os feriados do ano</li></ul></div>
      </div></div></div></div>`,
    notas: { objetivo: "Sair com uma tarefa concreta por função.", fala: "Para esta semana, cada função tem cinco coisas para fazer. Está tudo na Wiki, em Primeiros passos, com caixinha para marcar. Supervisores, peço que vocês confiram com a equipe de vocês até sexta: todo mundo trocou a senha, instalou o app e pediu pelo menos uma viabilidade pelo sistema.", clicar: "Avançar.", observar: "Cinco itens por função.", simulado: "O prazo “até sexta” é sugestão; combine com a gerência antes de falar.", evidencia: "pg_wiki.js, Primeiros passos (pp_vendedor, pp_cadastro, pp_qualidade, pp_supervisor); “Rotina do gerente”.", transicao: "Onde pedir ajuda, e perguntas." } });

  T.passo({ cap: "combinados", id: "fim", titulo: "Dúvidas: o caminho da ajuda", tempo: 40, classe: "escura",
    cena: () => `<div class="capa fim"><div class="marca marca-one"><img src="assets/seven-one-branco.png" alt="Seven One"></div>
      <h1>Perguntas?</h1>
      <p class="sub">E depois de hoje, quando surgir dúvida, este é o caminho:</p>
      <div class="ajuda-cam">
        <div><span class="n">1</span><b>Botão Ajuda</b>A Wiki abre no assunto da tela.</div>
        <div><span class="n">2</span><b>Seu supervisor</b>Rotina, meta e equipe.</div>
        <div><span class="n">3</span><b>Backoffice</b>Viabilidade, venda e instalação, pelo próprio pedido.</div>
        <div><span class="n">4</span><b>Gerência</b>Acesso, senha, cadastro e premiação.</div>
      </div>
      <div class="links"><button class="btn-demo" data-ir="raias">Rever o caminho da venda</button><button class="btn-demo" data-ir="regras">Rever os combinados</button><button class="btn-demo" data-aprofundar="demo-vendedor">Abrir o app</button></div>
      <div class="assin">${esc(PERFIL.nome)} · ${esc(PERFIL.funcao)} · ${esc(PERFIL.endereco)}</div></div>`,
    notas: { objetivo: "Abrir para perguntas e deixar o caminho da ajuda.", fala: "Era isso, pessoal. Agora é com vocês: perguntas. E depois de hoje, quando surgir dúvida, o caminho é esse: primeiro o botão Ajuda, depois o supervisor, depois o backoffice pelo próprio pedido, e acesso, senha e premiação com a gerência. Obrigado.", clicar: "Usar os botões para voltar ao caminho da venda ou aos combinados conforme as perguntas. C abre os capítulos.", observar: "O caminho da ajuda em quatro passos.", simulado: "Ajuste o caminho da ajuda com a gerência se a escala de atendimento for diferente.", transicao: "" } });

  T.ordenar(["abertura", "dia", "acesso", "caminho", "vendedor", "cadastro", "qualidade", "lideranca", "gerencia", "combinados"]);
})();
