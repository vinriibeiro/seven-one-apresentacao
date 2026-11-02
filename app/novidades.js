"use strict";
/* "O que mudou nesta versão": janela aberta pela etiqueta "Nova versão" da tela de entrada.
   Revise este texto a cada versão publicada: ele só deve listar o que de fato entrou. */
S.novidades = (() => {
  const MAPA = [
    ["Painel › Visão geral", "Visão geral › Painel"],
    ["Painel › Visão das equipes", "Comercial › Equipes"],
    ["Vendas › Lista, Nova venda, Lote e Importar planilha", "Comercial › Vendas (botão “Nova venda”)"],
    ["Operação › Viabilidade, Conexão/Solar, Confirmação, Rota e Pendências", "Operação, separada em antes e depois do lançamento"],
    ["Operação › Fechamento do dia", "Visão geral › Fechamento do dia"],
    ["Operação › Sem venda hoje e Produtividade", "Comercial › Equipes e vendedores"],
    ["Indicadores e Lançar FPD", "Gestão › Análises"],
    ["Premiação, Plano do mês e Extrato Claro", "Gestão"],
    ["CRM", "Comercial › CRM"],
    ["Ajuda › Wiki", "Botão Ajuda (?), embaixo na faixa à esquerda"],
    ["Trocar senha e sair, no topo", "Menu da sua conta (suas iniciais), embaixo na faixa à esquerda"],
  ];
  const esc = (s) => S.esc(s);
  return function abrir() {
    let d = document.getElementById("novidades");
    if (!d) {
      d = document.createElement("dialog");
      d.id = "novidades"; d.className = "novidades"; d.setAttribute("aria-labelledby", "nv-t");
      d.innerHTML = `<div class="d-cab"><div><span class="etiqueta"><i></i>Nova versão</span><h2 id="nv-t">O que mudou nesta versão</h2></div><button class="fechar" type="button" data-fecha aria-label="Fechar">×</button></div>
        <div class="d-corpo">
          <section><h3>O que continua igual</h3><p>Seu e-mail e sua senha, suas permissões, as regras de cada perfil e todos os registros. Nada precisa ser refeito.</p></section>
          <section><h3>Onde ficou cada coisa no sistema</h3>
            <table class="mapa"><thead><tr><th>Antes</th><th></th><th>Agora</th></tr></thead><tbody>
              ${MAPA.map(([a, b]) => `<tr><td>${esc(a)}</td><td class="seta">→</td><td class="agora">${esc(b)}</td></tr>`).join("")}
            </tbody></table>
            <p style="margin-top:10px">O painel de páginas de cada módulo começa fechado: passe o mouse no módulo para ver as páginas ou abra o painel em “Páginas”. Ao lado de cada página aparece o tamanho da lista (por exemplo, quantas pendências estão abertas).</p></section>
          <section><h3>Nas vendas</h3><ul>
            <li>A lista abre nas vendas do mês atual; cada situação mostra quantas vendas tem. Período, equipe e vendedor ficam nos filtros. Em “Colunas: escolher” você esconde as colunas que não usa (vale só no seu navegador).</li>
            <li>A ficha da venda mostra o andamento em etapas, os produtos e o histórico. Para corrigir, use “Editar venda”; reagendar e apagar ficam em “Mais”.</li></ul></section>
          <section><h3>No app do vendedor</h3><ul>
            <li>Barra de baixo com Início, Vendas, Agenda e Premiação, e o botão + no meio para registrar viabilidade, venda Conexão ou Solar e retorno na agenda.</li>
            <li>Vendas reúne viabilidade, Conexão/Solar e contratos, separados em abas no alto da tela, cada uma com quantos pedidos estão em andamento.</li></ul></section>
          <section><h3>Visual</h3><p>Telas redesenhadas, com a base de cada número à vista e as situações sempre com texto e símbolo. O tema escuro foi retirado: agora há um visual só.</p></section>
        </div>
        <div class="d-rod"><p>Dúvidas depois de entrar? O botão Ajuda (?) abre a Wiki no assunto da tela.</p><button class="btn" type="button" data-fecha>Entendi</button></div>`;
      d.addEventListener("click", (ev) => { if (ev.target === d || ev.target.closest("[data-fecha]")) d.close(); });
      document.body.appendChild(d);
    }
    d.showModal();
  };
})();
