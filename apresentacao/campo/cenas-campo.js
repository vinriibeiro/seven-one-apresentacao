"use strict";
/* Seven One · apresentação para vendedores e supervisores ("campo"): a venda no app, da viabilidade ao Conexão/Solar,
   e o que o supervisor acompanha no celular e no computador. Modo vídeo: ../campo/player.js (narração + momentos).
   Cada cena: `narracao` = trechos falados; os elementos com data-m="N" aparecem quando o trecho N começa.
   Fonte das telas e regras: api/public/pg_viabilidade.js, pg_vendaexterna.js, pg_vendas.js, pg_equipe.js, navegacao.js.
   Tudo fictício: pessoas, cliente, endereço, números. Nada é gravado. */
(() => {
  const T = window.TOUR, U = window.UI, esc = U.esc;
  const { cel, celAbas, campo, vendaCel, etiq, cab, svg } = U;

  /* ====== ajuste aqui o que é seu ====== */
  const PERFIL = { nome: "Vinícius Ribeiro da Silva", funcao: "Desenvolvedor do Seven One", endereco: "controleseven.com.br" };
  window.PERFIL = PERFIL;

  /* ====== personagens e a venda da história (fictícios) ====== */
  const P = {
    vend: "Rafael Moura", vendIni: "RM", equipe: "Samambaia", sup: "Rodrigo Teles", supIni: "RT", bko: "Juliana Castro",
    cliente: "Carlos Eduardo Nunes Sampaio", cpf: "025.•••.•••-11",
    cep: "72327-503", rua: "QR 425 Conjunto 3", num: "Casa 22", bairro: "Samambaia Norte", cidade: "Brasília", uf: "DF",
    viab: "1914", hp: "48219077", solar: "2332", contrato: "61214521",
    produtos: "Internet 500 Mega + Claro TV+ Box", venc: "10", agenda: "27/10", turno: "08:00 às 12:00",
    obsVend: "Cliente mora na casa dos fundos, entrada pela rua lateral. Fecha hoje se o crédito aprovar.",
    respBko: "Atende. HP 48219077. Crédito aprovado. Pode finalizar no Solar.",
    naoAtende: "Não atende: endereço fora da área de cobertura HFC. O prédio vizinho, QR 425 Conjunto 4, atende.",
    chatBko: "Recebi a venda Solar 2332. Falta o comprovante de endereço do cliente. Manda pelo app que eu finalizo.",
    chatVend: "Mandei o comprovante agora. Cliente pediu ligação 30 min antes do técnico.",
  };
  window.HISTORIA = P;
  T.inicial(() => ({}));

  /* ====== peças ====== */
  const TELAS = "telas/", DEMO = "../sistema/demo/";
  const funcao = (k) => k === "vend" ? `<span class="funcao f-vend"><i></i>Vendedor · no celular</span>` : k === "sup" ? `<span class="funcao f-sup"><i></i>Supervisor · celular e computador</span>` : `<span class="funcao f-todos"><i></i>Vendedor e supervisor</span>`;
  const topo = (k, n, h, sub) => `<div class="linha-f">${funcao(k)}<span class="cap-n">${n}</span></div>${cab("", h, sub)}`;
  const m = (n, html, cls = "") => `<div data-m="${n}" class="mom ${cls}">${html}</div>`;
  const passos = (itens, cor = "--f-vend") => `<ol class="marc" style="--c:var(${cor})">${itens.map(([k, t]) => `<li data-m="${k}"><span>${t}</span></li>`).join("")}</ol>`;
  const dica = (t, cls = "") => `<div class="dica ${cls}">${t}</div>`;
  const demoBtn = (id, t) => `<button class="btn-demo" data-aprofundar="${id}">${t}</button>`;
  const web = (arq, alt) => `<img class="print web" src="${TELAS}${arq}" alt="${esc(alt)}">`;
  const celImg = (arq, alt) => `<img class="print cel" src="${TELAS}${arq}" alt="${esc(alt)}">`;
  const demo = (t, u) => ({ titulo: t, etiqueta: "Sistema real · dados fictícios · nada é gravado", iframe: u });
  T.aprofundamento("demo-app", demo("App do vendedor", "../operacao/celular.html?perfil=vendedor&rota=/meu"));
  T.aprofundamento("demo-viab", demo("App do vendedor · Viabilidade", "../operacao/celular.html?perfil=vendedor&rota=/viabilidade"));
  T.aprofundamento("demo-sup-app", demo("Supervisor · no celular", "../operacao/celular.html?perfil=lider&rota=/vendas"));
  T.aprofundamento("demo-sup-web", demo("Supervisor · Vendas da equipe no computador", DEMO + "?perfil=lider#/vendas"));
  T.aprofundamento("demo-sup-equipe", demo("Supervisor · Visão da equipe", DEMO + "?perfil=lider#/equipe"));

  /* telas do celular do Rafael */
  const inicioApp = () => `<div class="app-corpo">
      <div class="card"><h5>Meu mês · BL vendida</h5><div class="g">17 <small>de 20</small></div>
        <div class="barra-meta"><i style="width:85%"></i><em style="left:75%"></em></div>
        <div style="color:var(--ok);font-weight:600;font-size:14px;margin-top:6px">● No ritmo da meta</div></div>
      <div class="secao">Para fazer agora <a>Ver tudo (3)</a></div>
      <div class="item"><div class="ic ok">✓</div><div class="tx"><b>Viabilidade respondida</b><span>Toque para ver a resposta do backoffice</span></div><div class="qd">hoje</div></div>
      <div class="item"><div class="ic crit">!</div><div class="tx"><b>1 aviso em Conexão / Solar</b><span>Retorno do backoffice na venda 2331</span></div><div class="qd">agora</div></div>
      <div class="item"><div class="ic info">☎</div><div class="tx"><b>Retorno agendado · 16:00</b><span>Sônia Aparecida Martins</span></div><div class="qd">hoje</div></div>
    </div>`;
  const folhaRegistrar = (n) => `<div class="folha" data-m="${n}"><h5>Registrar</h5>
      <div class="op dest-m" data-m="${n + 1}"><div class="ic">${svg("vendas")}</div><div><b>Pedir viabilidade</b><br><small>Endereço, crédito, linha móvel ou biometria</small></div></div>
      <div class="op"><div class="ic">${svg("seta")}</div><div><b>Enviar venda Conexão ou Solar</b><br><small>Para o backoffice de Cadastro conferir e finalizar</small></div></div>
      <div class="op"><div class="ic">${svg("agenda")}</div><div><b>Retorno na agenda</b><br><small>Lembrete para ligar ou visitar um cliente</small></div></div></div>`;
  const formViab = () => `<div class="app-corpo"><div class="card" style="display:grid;gap:10px">
      <div class="campo"><label>O que verificar?</label><div class="checks"><span class="on">Endereço</span><span data-m="2" class="liga">Crédito</span><span>Linha móvel</span><span>Link de biometria</span></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div data-m="1" class="mom">${campo("CEP", P.cep)}</div><div data-m="2" class="mom">${campo("Número", P.num)}</div></div>
      <div data-m="1" class="mom">${campo("Rua", P.rua, "auto")}</div>
      <div data-m="1" class="mom" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${campo("Bairro", P.bairro, "auto")}${campo("Cidade / UF", P.cidade + " / " + P.uf, "auto")}</div>
      <div data-m="2" class="mom">${campo("Cliente (opcional)", P.cliente)}</div>
      <div data-m="3" class="mom">${campo("Observação para o backoffice", P.obsVend)}</div>
    </div><button class="btn dest-m" data-m="4">Enviar pedido</button><div class="micro" style="text-align:center">Você recebe um aviso quando o backoffice responder.</div></div>`;
  const cardViab = ({ st, rot, cls, ha, msgs = "", botao = "", dm = "" }) => `<div class="card ${dm ? "mom" : ""}" ${dm ? `data-m="${dm}"` : ""} style="border-color:var(--${cls}-line)"><div style="display:flex;gap:8px;align-items:center">${etiq(rot, cls)}<span class="micro" style="margin-left:auto">${ha}</span></div>
      <b style="font-size:16px;display:block;margin-top:8px">${P.rua} ${P.num}</b><div class="micro">${P.cep} · ${P.bairro} · ${P.cliente}</div><div class="micro">nº ${P.viab} · Endereço · Crédito</div>${msgs}${botao}</div>`;
  const listaViab = (destaque) => `<div class="app-corpo">${celAbas("viab", { viab: "3 abertas", cs: "1 em andamento", con: "21 no mês" }, destaque ? { viab: 1 } : {})}
      <div class="micro" style="display:flex;gap:8px"><span class="etiq sem" style="font-size:12px">2 aguardando</span><span class="etiq ok sem" style="font-size:12px">1 atende</span><span class="etiq crit sem" style="font-size:12px">1 não atende</span></div>`;

  /* ====== capítulos ====== */
  T.capitulo({ id: "abertura", titulo: "Abertura", curto: "Abertura", resumo: "O que vendedor e supervisor fazem no Seven One." });
  T.capitulo({ id: "viab", titulo: "Vendedor: pedir viabilidade", curto: "Viabilidade", resumo: "No celular: o +, o pedido, a fila e a resposta." });
  T.capitulo({ id: "solar", titulo: "Vendedor: enviar a venda Conexão / Solar", curto: "Conexão / Solar", resumo: "A venda feita na Claro vai pelo app; o Cadastro responde no próprio pedido." });
  T.capitulo({ id: "sup", titulo: "Supervisor: acompanhar a equipe", curto: "Supervisor", resumo: "Vendas da equipe no celular e no computador; quem vendeu e quem parou." });
  T.capitulo({ id: "fim", titulo: "Combinados", curto: "Combinados", resumo: "As regras do jogo e onde pedir ajuda." });

  /* ================================================================== ABERTURA */
  T.passo({ cap: "abertura", id: "capa", titulo: "A venda no app", tempo: 22, classe: "escura",
    narracao: ["Seven One. A venda no app, do pedido de viabilidade até a venda finalizada. Esta apresentação é para quem está na rua: o vendedor, e para quem acompanha a equipe: o supervisor."],
    cena: () => `<div class="capa"><div class="marca marca-one"><img src="assets/seven-one-branco.png" alt="Seven One"></div>
      <div class="cap-n">VENDEDORES E SUPERVISORES · SEVEN TELECOM</div>
      <h1>A venda no app.<br>Do pedido ao fechamento.</h1>
      <p class="sub">Viabilidade, Conexão / Solar e o acompanhamento da equipe, do jeito que acontece no celular.</p>
      <div class="publico"><span class="f-vend"><i></i>Vendedor · celular</span><span class="f-sup"><i></i>Supervisor · celular e computador</span></div>
      <button class="assistir"><svg viewBox="0 0 24 24"><path d="M7 4l12 8-12 8z"/></svg>Assistir</button>
      <div class="assin">${esc(PERFIL.nome)} · ${esc(PERFIL.funcao)}</div></div>`,
    notas: { objetivo: "Abrir. O botão Assistir liga a narração e o avanço automático.", fala: "Clique em Assistir (ou espaço). A partir daqui a apresentação anda sozinha; pause quando quiser comentar.", clicar: "Assistir.", observar: "As duas funções.", simulado: "Todos os dados são fictícios." } });

  T.passo({ cap: "abertura", id: "roteiro", titulo: "Três momentos", tempo: 30,
    narracao: ["São três momentos.", "Primeiro: o vendedor pede a viabilidade no celular e recebe a resposta na hora.", "Segundo: fechou a venda no Conexão ou no Solar? Envia pelo app, e o Cadastro responde no próprio pedido.", "Terceiro: o supervisor acompanha as vendas da equipe no celular e no computador, sem precisar perguntar a ninguém."],
    cena: () => `<div class="pad">${topo("todos", "O QUE VAMOS VER", "Três momentos", "")}
      <div class="conteudo"><div class="col"><div class="tres">
        <div class="mom f-vend" data-m="1"><span class="n">1</span><b>Pedir viabilidade</b><span>No celular, na porta do cliente. A resposta chega como aviso.</span></div>
        <div class="mom f-vend" data-m="2"><span class="n">2</span><b>Enviar a venda Conexão / Solar</b><span>Vendeu na Claro? Manda pelo app. O Cadastro responde ali mesmo.</span></div>
        <div class="mom f-sup" data-m="3"><span class="n">3</span><b>Supervisor acompanha</b><span>Vendas da equipe, pendente ou instalada, no celular e no computador.</span></div>
      </div></div></div></div>`,
    notas: { objetivo: "Dar o mapa.", fala: "(narração)", clicar: "Deixe correr.", observar: "Os três blocos." } });

  /* ================================================================== VIABILIDADE */
  T.passo({ cap: "viab", id: "app-mais", titulo: "O botão + do app", tempo: 34,
    narracao: ["Rafael é vendedor da equipe Samambaia e está na porta do cliente. Abre o app do Seven One no celular.", "Tudo que ele registra sai do botão vermelho, no meio da barra de baixo.", "Toca no mais, e aparecem três opções: pedir viabilidade, enviar venda Conexão ou Solar, e marcar um retorno na agenda.", "Primeiro passo: saber se o endereço atende. Pedir viabilidade."],
    cena: () => `<div class="pad">${topo("vend", "VIABILIDADE · 1 DE 5", "Tudo começa no botão +", "")}
      <div class="conteudo"><div class="lado" style="flex:1;justify-content:flex-start;gap:70px">${cel({ hora: "14:21", quem: `<b>${P.vend}</b> · vendedor · equipe ${P.equipe}`, titulo: "Boa tarde, Rafael", sub: `${P.equipe} · sábado, 24 de outubro`, corpo: inicioApp() + folhaRegistrar(2), aba: "inicio", badge: { vendas: 3 }, grande: true })}
        <div class="col" style="max-width:720px">${passos([[1, "<b>O +</b> no meio da barra: é por ele que você registra."], [2, "<b>Três opções:</b> viabilidade, venda Conexão / Solar e retorno na agenda."], [3, "<b>Pedir viabilidade</b> é o primeiro passo de toda venda."]])}
          <div class="demos">${demoBtn("demo-app", "Abrir o app de verdade")}</div></div></div></div>`,
    notas: { objetivo: "Apresentar o Rafael e o +.", fala: "(narração)", clicar: "Deixe correr. 'Abrir o app de verdade' mostra a demonstração, se pedirem.", observar: "O botão vermelho e a folha Registrar.", simulado: "Tela reproduzida com dados fictícios; o app real está no botão." } });

  T.passo({ cap: "viab", id: "viab-form", titulo: "Preencher o pedido", tempo: 44,
    narracao: ["O pedido é rápido.", "Rafael digita o CEP, e rua, bairro e cidade vêm sozinhos.", "Completa o número da casa. Marca o que precisa verificar: endereço e, se o cliente vai fechar hoje, o crédito também. Pode colocar o nome do cliente.", "Agora a parte mais importante: a observação. Rafael escreve o que o backoffice precisa saber: casa dos fundos, entrada pela rua lateral, fecha hoje se o crédito aprovar.", "Envia. Pronto: o pedido entrou na fila do Cadastro, com hora e com o nome dele."],
    cena: () => `<div class="pad">${topo("vend", "VIABILIDADE · 2 DE 5", "CEP, número, o que verificar e a observação", "")}
      <div class="conteudo"><div class="lado" style="flex:1;justify-content:flex-start;gap:70px">${cel({ hora: "14:22", quem: `<b>${P.vend}</b> · Pedir viabilidade`, titulo: "Pedir viabilidade", voltar: true, corpo: formViab(), aba: "vendas", abas: false, grande: true })}
        <div class="col" style="max-width:720px">${passos([[1, "<b>CEP:</b> rua, bairro e cidade entram sozinhos."], [2, "<b>Número</b>, o que verificar (endereço, crédito, linha móvel, biometria) e o cliente, se quiser."], [3, "<b>Observação:</b> o que o backoffice precisa saber para responder certo."], [4, "<b>Enviar.</b> O pedido entra na fila com hora e com o seu nome."]])}
          ${m(3, dica("<b>Observação boa = resposta rápida.</b> Um pedido sem contexto volta como pergunta e atrasa a sua venda.", "ok"))}</div></div></div>`,
    notas: { objetivo: "Mostrar o formulário se montando e insistir na observação.", fala: "(narração)", clicar: "Deixe correr.", observar: "Os campos azulados vieram do CEP; a observação.", simulado: "No sistema real, a consulta do CEP é automática (ViaCEP). Aqui o preenchimento é reproduzido.", evidencia: "pg_viabilidade.js (formulário); routes_viabilidade.js (CEP e validação)." } });

  T.passo({ cap: "viab", id: "viab-enviado", titulo: "Acompanhar na fila", tempo: 34,
    narracao: ["Enviou, e agora? Em Vendas, na aba Viabilidade, Rafael vê todos os pedidos dele.", "O que acabou de mandar aparece como Aguardando, com o tempo desde o envio.", "Quando o Cadastro pegar para analisar, muda para Em análise, com o nome de quem está respondendo.", "Não precisa mandar mensagem no grupo nem ligar para ninguém. A fila é a mesma que o backoffice vê, e o pedido mais antigo é o primeiro da vez."],
    cena: () => `<div class="pad">${topo("vend", "VIABILIDADE · 3 DE 5", "O pedido está na fila: dá para acompanhar sem perguntar", "")}
      <div class="conteudo"><div class="lado" style="flex:1;justify-content:flex-start;gap:70px">${cel({ hora: "14:23", quem: `<b>${P.vend}</b> · Vendas › Viabilidade`, titulo: "Viabilidade", corpo: listaViab(false) + cardViab({ st: "ag", rot: "Aguardando", cls: "warn", ha: "enviado há 1 min", dm: 1 }) + m(2, cardViab({ rot: "Em análise · Juliana", cls: "info", ha: "há 4 min" }).replace('class="card "', 'class="card"'))
        + `<div class="card" style="opacity:.75"><div style="display:flex;gap:8px;align-items:center">${etiq("Atende", "ok")}<span class="micro" style="margin-left:auto">ontem</span></div><b style="font-size:16px;display:block;margin-top:8px">QN 118 Conjunto 5 Lote 8</b><div class="micro">72302-150 · Samambaia Sul · Lúcia Helena Marques</div></div></div>`, aba: "vendas", badge: { vendas: 3 }, grande: true })}
        <div class="col" style="max-width:720px">${passos([[1, "<b>Aguardando:</b> na fila, com o tempo desde o envio."], [2, "<b>Em análise:</b> alguém do Cadastro pegou o pedido. Aparece o nome."], [3, "<b>A fila é a mesma</b> que o backoffice vê. Mais antigo primeiro."]])}
          ${m(3, dica("<b>Enquanto espera,</b> siga com o cliente. O aviso chega no celular quando a resposta sair."))}</div></div></div>`,
    notas: { objetivo: "Tirar o 'e aí, saiu?' do grupo.", fala: "(narração)", clicar: "Deixe correr.", observar: "Aguardando → Em análise.", simulado: "A mudança para Em análise é reproduzida; no real, o app consulta os avisos a cada 20 segundos." } });

  T.passo({ cap: "viab", id: "viab-resposta", titulo: "A resposta chega", tempo: 40,
    narracao: ["Rafael segue a conversa com o cliente. Seis minutos depois...", "O celular avisa: viabilidade respondida.", "Rafael abre: Atende. HP criado, crédito aprovado, e a mensagem da Juliana, do Cadastro: pode finalizar no Solar.", "Repare que o próprio pedido já mostra o próximo passo: encaminhar a venda para o Solar. Esse botão só aparece depois do Atende.", "Da porta do cliente, sem sair do app, Rafael já sabe que pode fechar."],
    cena: () => `<div class="pad">${topo("vend", "VIABILIDADE · 4 DE 5", "Atende: a resposta vem no mesmo pedido, com aviso", "")}
      <div class="conteudo"><div class="lado" style="flex:1;justify-content:flex-start;gap:70px">${cel({ hora: "14:27", quem: `<b>${P.vend}</b> · aviso no celular`, titulo: "Viabilidade", corpo: listaViab(true) + cardViab({ rot: "Atende", cls: "ok", ha: "respondida há 0 min", dm: 2, msgs: `<div class="msgs" style="margin-top:10px"><div class="msg"><span class="de">${P.bko} · Cadastro · 14:27</span>${P.respBko}</div></div>`, botao: `<button class="btn dest-m" data-m="3" style="margin-top:10px">Encaminhar a venda → Solar</button>` })
        + `</div><div class="toast novo" data-m="1"><div class="sino">${svg("sino")}</div><div><b>Viabilidade respondida</b>O backoffice respondeu o seu pedido. Toque para ver.</div><button class="ab">Abrir</button></div>`, aba: "vendas", badge: { vendas: 4 }, grande: true })}
        <div class="col" style="max-width:720px">${passos([[1, "<b>Aviso no celular:</b> viabilidade respondida."], [2, "<b>Atende</b>, HP, crédito e a mensagem de quem respondeu."], [3, "<b>Encaminhar a venda → Solar:</b> o botão só existe depois do Atende."]])}
          ${m(4, dica("<b>Viabilidade não é venda.</b> Depois do Atende, a venda ainda precisa ser feita na Claro e enviada pelo app.", "at"))}</div></div></div>`,
    notas: { objetivo: "Fechar o ciclo do pedido e abrir o próximo passo.", fala: "(narração)", clicar: "Deixe correr.", observar: "O toast, a etiqueta Atende e o botão.", simulado: "Os seis minutos são da história, não um prazo garantido. O aviso de viabilidade chega por consulta (a cada 20 s), não por notificação push.", evidencia: "avisos.js ('Viabilidade respondida'); routes_viabilidade.js (encaminhar só após Atende)." } });

  T.passo({ cap: "viab", id: "viab-nao-atende", titulo: "Quando não atende", tempo: 38,
    narracao: ["E quando a resposta é Não atende?", "Ela vem com o motivo. Neste exemplo: endereço fora da área de cobertura, e uma dica: o prédio vizinho atende.", "Ficou com dúvida? Responda no próprio pedido. A conversa fica ali, com hora, para os dois lados.", "O que não dá é mandar outro pedido igual: o sistema recusa pedido repetido no mesmo endereço. Converse no pedido que já existe."],
    cena: () => `<div class="pad">${topo("vend", "VIABILIDADE · 5 DE 5", "Não atende vem com motivo. Dúvida? Responda no pedido.", "")}
      <div class="conteudo"><div class="lado" style="flex:1;justify-content:flex-start;gap:70px">${cel({ hora: "15:02", quem: `<b>${P.vend}</b> · outro pedido, outro cliente`, titulo: "Viabilidade", voltar: true, corpo: `<div class="app-corpo"><div class="card" style="border-color:var(--crit-line)"><div style="display:flex;gap:8px;align-items:center">${etiq("Não atende", "crit")}<span class="micro" style="margin-left:auto">respondida há 2 min</span></div>
          <b style="font-size:16px;display:block;margin-top:8px">QR 425 Conjunto 3 Casa 40</b><div class="micro">72327-503 · Samambaia Norte · Marina Helena Rocha</div>
          <div class="msgs" style="margin-top:10px"><div class="msg mom" data-m="1"><span class="de">${P.bko} · Cadastro · 15:00</span>${P.naoAtende}</div>
          <div class="msg eu mom" data-m="2"><span class="de">Você · 15:02</span>O cliente aceita o endereço do vizinho? Vou confirmar com ele e abro um pedido novo para o Conjunto 4.</div></div>
          <div class="campo mom" data-m="2" style="margin-top:10px"><label>Responder no pedido</label><div class="vazio">Escrever mensagem…</div></div></div>
          <div class="card mom" data-m="3" style="border-color:var(--warn-line);background:var(--warn-wash)"><b style="font-size:14px">Pedido repetido</b><div class="micro">Já existe um pedido aberto para este endereço. Use a conversa do pedido nº 1921.</div></div></div>`, aba: "vendas", badge: { vendas: 4 }, grande: true })}
        <div class="col" style="max-width:720px">${passos([[1, "<b>Não atende</b> sempre vem com o motivo e, quando dá, uma alternativa."], [2, "<b>Responda no pedido.</b> A conversa fica registrada para os dois lados."], [3, "<b>Pedido repetido é recusado.</b> Converse no que já existe."]])}
          <div class="demos">${demoBtn("demo-viab", "Abrir a viabilidade no app")}</div></div></div></div>`,
    notas: { objetivo: "Mostrar o caminho quando não atende e evitar pedidos duplicados.", fala: "(narração)", clicar: "Deixe correr.", observar: "A conversa dentro do pedido.", simulado: "Mensagens fictícias. A recusa de pedido repetido é regra real do servidor.", evidencia: "routes_viabilidade.js (409 em duplicidade; observações do pedido)." } });

  /* ================================================================== CONEXÃO / SOLAR */
  const formSolar = () => `<div class="app-corpo compacto"><div class="card" style="display:grid;gap:7px">
      <div class="campo"><label>Sistema</label><div class="checks"><span>Conexão</span><span class="on">Solar</span></div></div>
      <div class="mom" data-m="1" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${campo("CPF do cliente", P.cpf)}${campo("Contrato", P.contrato)}</div>
      <div class="mom" data-m="1">${campo("Plano", P.produtos)}</div>
      <div class="mom" data-m="2" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${campo("Vencimento (dia)", P.venc)}${campo("Multi", "Não")}</div>
      <div class="mom" data-m="2" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${campo("Agendamento", P.agenda)}${campo("Turno", P.turno)}</div>
      <div class="mom" data-m="3">${campo("Viabilidade", "nº " + P.viab + " · Atende · HP " + P.hp, "auto")}</div>
      <div class="mom" data-m="3">${campo("Observação", "Cliente pediu ligação 30 min antes do técnico chegar.")}</div>
    </div><button class="btn dest-m" data-m="4">Enviar venda Solar</button></div>`;

  T.passo({ cap: "solar", id: "solar-form", titulo: "Enviar a venda feita na Claro", tempo: 46,
    narracao: ["Rafael fechou a venda no Solar, o sistema da Claro. Agora ele avisa o Cadastro pelo app: toca no mais, enviar venda Conexão ou Solar.", "Escolhe o sistema. No Solar, informa CPF do cliente, número do contrato e o plano.", "Vencimento, se é Multi, e o agendamento com o turno que combinou com o cliente.", "A viabilidade que acabou de ser aprovada já vem ligada ao pedido. E a observação: cliente pediu ligação trinta minutos antes do técnico.", "Envia. A venda cai na fila do Cadastro, que vai conferir, lançar o contrato e responder ali mesmo."],
    cena: () => `<div class="pad">${topo("vend", "CONEXÃO / SOLAR · 1 DE 3", "Vendeu na Claro? Avisa o Cadastro pelo app", "")}
      <div class="conteudo"><div class="lado" style="flex:1;justify-content:flex-start;gap:70px">${cel({ hora: "14:35", quem: `<b>${P.vend}</b> · Enviar venda Solar`, titulo: "Enviar venda Solar", voltar: true, corpo: formSolar(), aba: "vendas", abas: false, grande: true })}
        <div class="col" style="max-width:720px">${passos([[1, "<b>Solar:</b> CPF, contrato e plano."], [2, "<b>Vencimento, Multi</b> e o agendamento com turno."], [3, "<b>A viabilidade vem ligada</b> ao pedido. Observação para o Cadastro."], [4, "<b>Enviar.</b> Cai na fila Conexão / Solar do Cadastro."]])}
          ${m(2, dica("<b>No Conexão</b> os campos são outros: nome do cliente, código Conexão, biometria feita e se possui chip."))}
          ${m(4, dica("<b>Não é integração com a Claro.</b> A venda é feita lá; aqui você registra para o Cadastro lançar o contrato e acompanhar.", "at"))}</div></div></div>`,
    notas: { objetivo: "Explicar o papel do Conexão/Solar: a venda é feita na Claro e registrada no app para o Cadastro.", fala: "(narração)", clicar: "Deixe correr.", observar: "O formulário se montando e a viabilidade ligada.", simulado: "Não existe integração automática com o Solar ou o Conexão; o vendedor transcreve a venda feita lá.", evidencia: "pg_vendaexterna.js (campos Solar e Conexão); routes_vendaexterna.js (viabilidade_id)." } });

  const stCard = (n, cls, rot, txt, extra = "") => `<div class="card mom" data-m="${n}" style="border-color:var(--${cls}-line)"><div style="display:flex;gap:8px;align-items:center">${etiq(rot, cls)}<span class="micro" style="margin-left:auto">Solar nº ${P.solar}</span></div><div class="micro" style="margin-top:6px">${txt}</div>${extra}</div>`;
  T.passo({ cap: "solar", id: "solar-retornos", titulo: "Os retornos do Cadastro", tempo: 46,
    narracao: ["Depois que envia, a venda aparece na aba Conexão Solar, e cada retorno do Cadastro muda a situação dela.", "Pendente de tratamento: chegou e está na fila.", "Criação de HP: o Cadastro abriu a criação do HP na Claro e o pedido ganha um prazo, em horas, que você acompanha no app.", "Pendência: falta alguma coisa. Vem sempre com uma mensagem dizendo o quê, e você resolve pelo próprio pedido.", "Correção de venda: algum dado veio errado; corrija e reenvie.", "Finalizado: o contrato foi lançado. A partir daqui a venda aparece em Contratos, como pendente de instalação."],
    cena: () => `<div class="pad">${topo("vend", "CONEXÃO / SOLAR · 2 DE 3", "Cada retorno do Cadastro muda a situação da venda", "")}
      <div class="conteudo"><div class="lado" style="flex:1;justify-content:flex-start;gap:70px">${cel({ hora: "16:10", quem: `<b>${P.vend}</b> · Vendas › Conexão / Solar`, titulo: "Conexão / Solar", corpo: `<div class="app-corpo">${celAbas("cs", { viab: "2 abertas", cs: "2 em andamento", con: "21 no mês" }, { cs: 1 })}
        ${stCard(1, "warn", "Pendente de tratamento", "Chegou na fila do Cadastro · há 2 min")}
        ${stCard(2, "info", "Criação de HP · vence em 71h", "O Cadastro abriu a criação do HP. Prazo: 72 horas.")}
        ${stCard(3, "warn", "Pendência", "Falta o comprovante de endereço do cliente.", `<div class="msgs" style="margin-top:8px"><div class="msg"><span class="de">${P.bko} · Cadastro</span>Manda o comprovante pelo app que eu finalizo.</div></div>`)}
        ${stCard(4, "crit", "Correção de venda", "CPF não confere com o contrato. Corrija e reenvie.")}
        ${stCard(5, "ok", "Finalizado", "Contrato 61214521 lançado. Instalação 27/10, manhã.")}</div>`, aba: "vendas", badge: { vendas: 2 }, grande: true })}
        <div class="col" style="max-width:720px">${passos([[1, "<b>Pendente de tratamento:</b> está na fila."], [2, "<b>Criação de HP:</b> com prazo em horas para acompanhar."], [3, "<b>Pendência:</b> falta algo. Vem com mensagem."], [4, "<b>Correção de venda:</b> dado errado. Corrija e reenvie."], [5, "<b>Finalizado:</b> contrato lançado. Agora é em Contratos."]])}</div></div></div>`,
    notas: { objetivo: "Os cinco retornos possíveis e o que o vendedor faz em cada um.", fala: "(narração)", clicar: "Deixe correr.", observar: "Os cartões aparecendo um a um.", simulado: "Na tela real, uma venda tem uma situação por vez; aqui as cinco aparecem juntas para explicar.", evidencia: "pg_vendaexterna.js (ST: Pendente tratamento, Ativo sem sucesso, Criação de HP, Pendência, Finalizado; respostas do Cadastro com prazo em horas)." } });

  T.passo({ cap: "solar", id: "solar-chat", titulo: "Conversa na venda, com aviso no celular", tempo: 36,
    narracao: ["Falta uma coisa: a conversa da venda.", "Toda mensagem do Cadastro na venda chega como notificação no celular, mesmo com o app fechado.", "Juliana escreveu: falta o comprovante de endereço. Rafael abre, anexa o comprovante e responde na mesma conversa.", "Nada de foto de documento no grupo do WhatsApp. O dado do cliente fica dentro do sistema, na venda, com quem mandou e quando."],
    cena: () => `<div class="pad">${topo("vend", "CONEXÃO / SOLAR · 3 DE 3", "A conversa da venda avisa no celular, mesmo com o app fechado", "")}
      <div class="conteudo"><div class="lado" style="flex:1;justify-content:flex-start;gap:70px">${cel({ hora: "16:12", quem: `<b>${P.vend}</b> · notificação no celular`, titulo: "Conexão / Solar", corpo: `<div class="push novo" data-m="1" style="top:10px"><img src="../sistema/assets/icone-seven-one.png" alt=""><div><b>Conexão / Solar · venda nº ${P.solar}</b>Nova mensagem na conversa</div><span class="qd">agora</span></div>
        <div class="app-corpo" style="padding-top:70px"><div class="card"><div class="micro"><span class="st pend">Pendência</span> · Solar nº ${P.solar}</div><b style="font-size:16px">${P.cliente}</b><div class="micro">${P.produtos} · ${P.agenda} manhã</div>
          <div class="msgs" style="margin-top:10px"><div class="msg mom" data-m="1"><span class="de">${P.bko} · Cadastro · 16:11</span>${P.chatBko}</div>
          <div class="msg eu mom" data-m="2"><span class="de">Você · 16:12 · 1 anexo</span>${P.chatVend}</div></div>
          <div class="campo mom" data-m="2" style="margin-top:10px"><label>Responder · anexar arquivo</label><div class="vazio">Escrever mensagem…</div></div></div></div>`, aba: "vendas", badge: { vendas: 1 }, grande: true })}
        <div class="col" style="max-width:720px">${passos([[1, "<b>Notificação</b> no celular a cada mensagem do Cadastro, mesmo com o app fechado."], [2, "<b>Responda e anexe</b> na própria venda."], [3, "<b>Documento de cliente não vai para grupo.</b> Fica na venda, com autor e hora."]])}
          ${m(3, dica("<b>Para receber as notificações,</b> instale o app pela tela inicial e ative os avisos em Meu perfil.", "ok"))}</div></div></div>`,
    notas: { objetivo: "Notificação push e o combinado de não mandar documento no grupo.", fala: "(narração)", clicar: "Deixe correr.", observar: "A notificação no alto e a resposta com anexo.", simulado: "Notificação reproduzida. No real é Web Push: Android e iPhone com o app instalado e os avisos ativados em Meu perfil. A notificação não traz o texto da mensagem.", evidencia: "routes_vendaexterna.js (chat e push); notificacoes.js." } });

  T.passo({ cap: "solar", id: "vend-resumo", titulo: "Vendedor: a venda em quatro toques", tempo: 30,
    narracao: ["Resumindo o lado do vendedor, tudo no celular.", "Um: pedir viabilidade com observação. Dois: receber a resposta no mesmo pedido. Três: vender na Claro e enviar pelo app. Quatro: acompanhar os retornos e responder na venda.", "O que não está no app não tem fila, não tem dono e não tem histórico."],
    cena: () => `<div class="pad">${topo("vend", "RESUMO", "A venda em quatro toques", "")}
      <div class="conteudo"><div class="col"><div class="quatro">
        <div class="mom" data-m="1"><span class="n">1</span><b>Pedir viabilidade</b><span>No +, com CEP, número e observação.</span></div>
        <div class="mom" data-m="1"><span class="n">2</span><b>Receber a resposta</b><span>Aviso no celular. Atende ou não atende, com motivo.</span></div>
        <div class="mom" data-m="1"><span class="n">3</span><b>Vender e enviar</b><span>Fechou no Conexão ou no Solar? Enviar pelo +.</span></div>
        <div class="mom" data-m="1"><span class="n">4</span><b>Acompanhar e responder</b><span>Pendente, HP, pendência, finalizado. Responder na venda.</span></div>
      </div>${m(2, dica("<b>O que não está no app não tem fila, não tem dono e não tem histórico.</b> Viabilidade e venda, sempre pelo app.", "at"))}</div></div></div>`,
    notas: { objetivo: "Fixar.", fala: "(narração)", clicar: "Deixe correr.", observar: "Os quatro." } });

  /* ================================================================== SUPERVISOR */
  const vendasEquipe = () => `<div class="app-corpo"><div class="card" style="padding:10px 12px"><div class="micro" style="display:flex;gap:8px;flex-wrap:wrap"><span class="etiq sem" style="font-size:12px;background:var(--nav);color:#fff">Todas 142</span><span class="etiq ok sem" style="font-size:12px">Instaladas 84</span><span class="etiq info sem" style="font-size:12px">Pendentes 47</span><span class="etiq crit sem" style="font-size:12px">Canceladas 11</span></div>
      <div class="mom" data-m="2" style="margin-top:8px">${campo("Vendedor", P.vend)}</div></div></div>
      <div class="mom" data-m="1">${vendaCel({ cliente: P.cliente, st: "pend", stRot: "Pendente", num: P.contrato, data: "24/10 · " + P.vend, prods: "Banda larga + TV", prox: "Instalação 27/10 · manhã", dest: true })}
      ${vendaCel({ cliente: "Gilberto Nogueira", st: "pend", stRot: "Pendente", num: "61214503", data: "24/10 · Bianca Ferreira Lacerda", prods: "Banda larga", prox: "Instalação 29/10 · tarde" })}
      ${vendaCel({ cliente: "Lorena Batista", st: "inst", stRot: "Instalada", num: "61212204", data: "22/10 · " + P.vend, prods: "Banda larga", prox: "Instalada 23/10" })}
      ${vendaCel({ cliente: "Francisco das Chagas Rodrigues Filho", st: "canc", stRot: "Cancelada", num: "61210963", data: "21/10 · Lucas Henrique Barbosa", prods: "Banda larga + TV + Móvel", prox: "Motivo: cliente desistiu" })}
      ${vendaCel({ cliente: "Raimunda Ferreira", st: "pend", stRot: "Pendente", num: "61207306", data: "18/10 · Diego Cardoso", prods: "Banda larga + Móvel", prox: "Instalação 21/10 · atrasada" })}</div>`;
  const abasSup = `<div class="abas-fim sup"><div class="on">${svg("comercial")}Visão da equipe</div><div>${svg("vendas")}Vendas da equipe</div><div>${svg("premiacao")}Premiação</div></div>`;

  T.passo({ cap: "sup", id: "sup-celular", titulo: "Supervisor: as vendas da equipe no celular", tempo: 42,
    narracao: ["Agora o supervisor. Rodrigo cuida da equipe Samambaia e também tem o app no celular.", "Em Vendas da equipe, ele vê cada venda lançada pelo Cadastro para a equipe dele: cliente, vendedor, produtos e a situação. Pendente, instalada ou cancelada, com a data da instalação ou o motivo.", "Quer ver só um vendedor? Filtra pelo nome.", "A venda do Rafael, que acabou de ser lançada, já está lá: pendente, instalação terça de manhã.", "Ou seja: o supervisor acompanha a venda do vendedor sem pedir print, sem pedir planilha."],
    cena: () => `<div class="pad">${topo("sup", "SUPERVISOR · 1 DE 3", "Vendas da equipe no celular: cada venda, de cada vendedor", "")}
      <div class="conteudo"><div class="lado" style="flex:1;justify-content:flex-start;gap:70px">${cel({ hora: "17:40", quem: `<b>${P.sup}</b> · supervisor · app`, titulo: "Vendas da equipe", sub: "Outubro · 142 lançadas", corpo: vendasEquipe(), abas: false, grande: true }).replace(/<\/div><\/div>$/, abasSup + "</div></div>").replace('<div class="av">RM</div>', `<div class="av">${P.supIni}</div>`)}
        <div class="col" style="max-width:720px">${passos([[1, "<b>Cada venda da equipe:</b> cliente, vendedor, produtos e situação."], [2, "<b>Filtro por vendedor</b> para a conversa com uma pessoa."], [3, "<b>A venda do Rafael já está lá</b>, pendente, com a data da instalação."]], "--f-sup")}
          ${m(4, dica("<b>Pendente antiga vira cancelamento.</b> Instalação atrasada é a primeira conversa do dia com o vendedor.", "at"))}
          <div class="demos">${demoBtn("demo-sup-app", "Abrir no celular do supervisor")}</div></div></div></div>`,
    notas: { objetivo: "O supervisor acompanha a venda sem print.", fala: "(narração)", clicar: "Deixe correr.", observar: "O filtro por vendedor e a venda do Rafael.", simulado: "O supervisor vê as equipes em que está marcado como supervisor. Ele não vê a viabilidade nem a fila Conexão/Solar: acompanha a venda a partir do contrato lançado.", evidencia: "navegacao.js (perfil lider: equipe, vendas, comissao); pg_vendas.js (filtro de vendedor no escopo)." } });

  T.passo({ cap: "sup", id: "sup-computador", titulo: "Supervisor: no computador", tempo: 40,
    narracao: ["No computador, a mesma tela, com mais espaço.", "Em cima, os filtros: período, situação, vendedor e busca por cliente ou contrato.", "Na lista, uma linha por venda: data, contrato, cliente, vendedor, produtos, situação e instalação. Instalação atrasada aparece em vermelho.", "Clicar na linha abre a ficha da venda. E o botão Exportar baixa a lista filtrada para conferir com a equipe."],
    cena: () => `<div class="pad">${topo("sup", "SUPERVISOR · 2 DE 3", "No computador: a mesma lista, com filtros e exportação", "")}
      <div class="conteudo"><div class="col larga print-wrap">${web("sup-vendas.png", "Vendas da equipe no computador")}
        <span class="marcador mom" data-m="1" style="left:5%;top:18%">1</span><span class="marcador mom" data-m="2" style="left:83%;top:79%">2</span><span class="marcador mom" data-m="3" style="left:86%;top:10%">3</span></div>
        <div class="col" style="flex:0 0 520px">${passos([[1, "<b>Filtros:</b> período, situação, vendedor e busca."], [2, "<b>Uma linha por venda.</b> Instalação atrasada em vermelho."], [3, "<b>Exportar</b> a lista filtrada; clicar na linha abre a ficha."]], "--f-sup")}
          <div class="demos">${demoBtn("demo-sup-web", "Abrir no computador do supervisor")}</div></div></div></div>`,
    notas: { objetivo: "Mostrar a versão web.", fala: "(narração)", clicar: "Deixe correr.", observar: "Os marcadores 1, 2 e 3.", simulado: "Captura real do sistema com dados fictícios (vitrine).", evidencia: "pg_vendas.js." } });

  T.passo({ cap: "sup", id: "sup-equipe", titulo: "Supervisor: quem vendeu e quem parou", tempo: 36,
    narracao: ["A última tela do supervisor é a Visão da equipe.", "Ali ele vê o ritmo do time: quanto a equipe já vendeu no mês, contra a meta, e a projeção.", "Tocando na equipe, abre vendedor por vendedor: vendas do mês, quantas instalaram e há quantos dias cada um não vende.", "Uma rotina simples: todo dia de manhã, olhar quem está há três ou quatro dias sem venda. Essa é a primeira conversa do dia."],
    cena: () => `<div class="pad">${topo("sup", "SUPERVISOR · 3 DE 3", "Visão da equipe: o ritmo do time e quem parou de vender", "")}
      <div class="conteudo"><div class="col estreita" style="flex:0 0 400px;align-items:center">${celImg("sup-equipe.png", "Visão da equipe no celular")}</div>
        <div class="col">${passos([[1, "<b>A equipe contra a meta</b> e a projeção do mês."], [2, "<b>Vendedor por vendedor:</b> vendas, instaladas e há quantos dias não vende."], [3, "<b>Rotina:</b> de manhã, quem está parado é a primeira conversa."]], "--f-sup")}
          ${m(3, dica("<b>Sem equipe atribuída, a tela aparece vazia.</b> Peça ao gerente para te marcar como supervisor da equipe.", "at"))}
          <div class="demos">${demoBtn("demo-sup-equipe", "Abrir a Visão da equipe")}</div></div></div></div>`,
    notas: { objetivo: "Dar ao supervisor a rotina de leitura, sem entrar em indicadores de gerência.", fala: "(narração)", clicar: "Deixe correr.", observar: "A barra da equipe contra a meta.", simulado: "Captura real (vitrine). Não citar FPD, valores em R$ nem premiação aqui: são assunto da gerência.", evidencia: "pg_equipe.js (supervisor vê só as equipes dele)." } });

  /* ================================================================== COMBINADOS */
  T.passo({ cap: "fim", id: "combinados", titulo: "Combinados", tempo: 40,
    narracao: ["Para fechar, cinco combinados.", "Viabilidade e venda, sempre pelo app, nunca pelo grupo.", "Observação clara, dos dois lados.", "Olhe no app antes de perguntar: a situação já está lá.", "Documento e dado de cliente ficam no sistema, não em grupo.", "E supervisor acompanha pelo app, não por print."],
    cena: () => `<div class="pad">${topo("todos", "COMBINADOS", "Cinco combinados para vendedor e supervisor", "")}
      <div class="conteudo"><div class="col"><div class="combinados cinco">
        <div class="mom" data-m="1"><span><b>Viabilidade e venda pelo app</b>Nunca pelo grupo. O que não está no app não tem fila, nem dono, nem histórico.</span></div>
        <div class="mom" data-m="2"><span><b>Observação clara, sempre</b>Quem pede escreve o contexto; quem responde escreve o motivo.</span></div>
        <div class="mom" data-m="3"><span><b>Olhe no app antes de perguntar</b>Aguardando, em análise, atende, pendência, finalizado: a situação já está lá.</span></div>
        <div class="mom" data-m="4"><span><b>Dado de cliente fica no sistema</b>CPF, comprovante, print: na venda, nunca em grupo.</span></div>
        <div class="mom" data-m="5"><span><b>Supervisor acompanha pelo app</b>Vendas da equipe e Visão da equipe, não print nem planilha.</span></div>
      </div></div></div></div>`,
    notas: { objetivo: "Regras curtas que todo mundo repete.", fala: "(narração)", clicar: "Deixe correr.", observar: "Os cinco." } });

  T.passo({ cap: "fim", id: "fim", titulo: "Dúvidas", tempo: 20, classe: "escura",
    narracao: ["Dúvida depois de hoje? Primeiro o botão Ajuda, dentro do app: a Wiki abre no assunto da tela. Depois, o seu supervisor. E viabilidade, venda e instalação, direto no pedido, com o Cadastro. Obrigado."],
    cena: () => `<div class="capa fim"><div class="marca marca-one"><img src="assets/seven-one-branco.png" alt="Seven One"></div>
      <h1>Perguntas?</h1>
      <p class="sub">Depois de hoje, quando surgir dúvida:</p>
      <div class="ajuda-cam">
        <div><span class="n">1</span><b>Botão Ajuda</b>A Wiki abre no assunto da tela.</div>
        <div><span class="n">2</span><b>Seu supervisor</b>Rotina e equipe.</div>
        <div><span class="n">3</span><b>Cadastro, no pedido</b>Viabilidade, venda e instalação.</div>
      </div>
      <div class="links"><button class="btn-demo" data-ir="app-mais">Rever: pedir viabilidade</button><button class="btn-demo" data-ir="solar-form">Rever: Conexão / Solar</button><button class="btn-demo" data-aprofundar="demo-app">Abrir o app</button></div>
      <div class="assin">${esc(PERFIL.nome)} · ${esc(PERFIL.funcao)} · ${esc(PERFIL.endereco)}</div></div>`,
    notas: { objetivo: "Perguntas.", fala: "(narração)", clicar: "Os botões voltam às cenas mais pedidas.", observar: "O caminho da ajuda." } });

  T.ordenar(["abertura", "viab", "solar", "sup", "fim"]);
})();
