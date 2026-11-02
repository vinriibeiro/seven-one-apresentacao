"use strict";
/* Segurança (só Gerente e Administrador): botão de emergência (encerrar todas as sessões, travar exportações) e painel de detecção.
   O plano completo de contingência está em docs/PLANO_CONTINGENCIA_VAZAMENTO.md. */
(() => {
  const { esc, nf, api, painel, tabela } = S;
  const hora = (d) => (d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "–");
  const linhasDe = (t) => +(/:\s*(\d+)\s*linha/.exec(t || "")?.[1] || 0);
  const oque = (t) => String(t || "").split(":")[0];

  S.PAGES.seguranca = async (el) => {
    const [j, dc] = await Promise.all([api("/seguranca/resumo?nocache=1"), api("/auth/2fa/contas?nocache=1").catch(() => null)]);
    const go = () => S.PAGES.seguranca(el).catch(S.erroEm(el));
    const ex = j.exportacao, enc = j.ultimo_encerramento;

    const porPessoa = new Map();
    for (const x of j.exportacoes) {
      const a = porPessoa.get(x.login) || { nome: x.nome, login: x.login, n: 0, linhas: 0, ultima: x.em };
      a.n++; a.linhas += linhasDe(x.detalhe); porPessoa.set(x.login, a);
    }
    const quem = [...porPessoa.values()].sort((a, b) => b.linhas - a.linhas).slice(0, 10);

    const emergencia = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px">
      <div><b>Encerrar todas as sessões</b>
        <p class="mut" style="margin:6px 0 10px">Todos, inclusive você, saem do sistema em até 15 segundos e precisam entrar de novo. Use se houver suspeita de conta invadida ou senha vazada.${enc ? ` Último uso: ${esc(hora(enc.em))}, por ${esc(enc.nome)}.` : ""}</p>
        <button class="btn perigo" id="sg-enc">Encerrar todas as sessões</button></div>
      <div><b>Exportações em CSV: <span class="${ex.travada ? "tag ruim" : "tag ok"}">${ex.travada ? "TRAVADAS" : "liberadas"}</span></b>
        <p class="mut" style="margin:6px 0 10px">${ex.disponivel ? (ex.travada ? `Ninguém consegue baixar CSV (vendas, extrato, qualidade, premiação, histórico)${ex.desde ? ` desde ${esc(hora(ex.desde))}` : ""}${ex.por ? `, por ${esc(ex.por)}` : ""}.` : "Travar impede qualquer pessoa, de qualquer perfil, de baixar CSV até você liberar. Use se suspeitar de cópia de dados.") : "Para ativar a trava, rode o arquivo <b>db/57_seguranca_emergencia.sql</b> no Supabase."}</p>
        ${ex.disponivel ? `<button class="btn ${ex.travada ? "sec" : "perigo"}" id="sg-trav">${ex.travada ? "Liberar exportações" : "Travar exportações"}</button>` : ""}</div></div>`;

    const passos = `<ol style="margin:0;padding-left:20px;line-height:1.7">
      <li>Anote a hora e o que foi visto. Não apague nada: <b>desative</b>, o histórico é prova.</li>
      <li>Uma conta suspeita: desative em <a href="#/usuarios">Usuários e acessos</a> (a sessão dela cai em até 15 segundos).</li>
      <li>Suspeita ampla ou conta do Gerente/Administrador: use os dois botões acima e troque as senhas.</li>
      <li>Responsável técnico troca os segredos do servidor (<code>JWT_SECRET</code>, senha do banco) e guarda os registros.</li>
      <li>Avise o encarregado de dados: ANPD e titulares em até <b>3 dias úteis</b> (confirmar com o jurídico) e verifique o prazo do contrato com a Claro.</li>
    </ol>`;

    el.innerHTML = `<div class="cab"><div><div class="migalha">Administração</div><h1>Segurança</h1><p>Botão de emergência e sinais de uso indevido. Só o Gerente e o Administrador veem esta tela. Plano completo: <code>docs/PLANO_CONTINGENCIA_VAZAMENTO.md</code>.</p></div></div>
      ${painel("Emergência", emergencia, "Cada ação fica registrada com quem fez e a hora.")}
      <div class="grade g2">
        ${painel("Exportações nas últimas 72 horas", j.exportacoes.length ? tabela([
          { t: "Pessoa", f: (x) => `<b>${esc(x.nome)}</b><div class="mut">${esc(x.login)}</div>` },
          { t: "Exportações", n: true, f: (x) => nf.format(x.n) }, { t: "Linhas", n: true, f: (x) => nf.format(x.linhas) }, { t: "Última", f: (x) => esc(hora(x.ultima)) }], quem) : `<p class="mut">Nenhuma exportação nas últimas 72 horas.</p>`,
        "Quem mais baixou dados. Muitas linhas ou horário estranho merecem uma conversa.", `${j.exportacoes.length}`)}
        ${painel("Falhas de login nas últimas 24 horas", j.falhas_login.length ? tabela([
          { t: "Conta", f: (x) => `<b>${esc(x.nome)}</b><div class="mut">${esc(x.login)}</div>` },
          { t: "Falhas", n: true, f: (x) => nf.format(x.falhas) }, { t: "Última", f: (x) => esc(hora(x.ultima)) }], j.falhas_login) : `<p class="mut">Nenhuma falha de login nas últimas 24 horas.</p>`,
        `${nf.format(j.contas_bloqueadas)} conta(s) bloqueada(s) agora por excesso de tentativas.`)}
      </div>
      ${painel("Alertas automáticos", (j.alertas || []).length ? tabela([
        { t: "Quando", f: (x) => esc(hora(x.em)) }, { t: "O que aconteceu", f: (x) => esc(x.resumo) }], j.alertas) : `<p class="mut">Nenhum alerta até agora. Quando algo fugir do padrão, o sistema avisa no celular do Gerente, do Administrador e do master e registra aqui.</p>`,
        "O vigia confere a cada 2 minutos: exportação grande, conta bloqueada, tentativas em várias contas, login de madrugada, 2FA desligado e senha de gerente redefinida.")}
      ${j.exportacoes.length ? painel("Exportações, uma a uma", tabela([
        { t: "Quando", f: (x) => esc(hora(x.em)) }, { t: "Pessoa", f: (x) => esc(x.nome) },
        { t: "O que", f: (x) => esc(oque(x.detalhe)) }, { t: "Linhas", n: true, f: (x) => nf.format(linhasDe(x.detalhe)) }], j.exportacoes.slice(0, 50)), "As 50 mais recentes.") : ""}
      ${dc ? painel("Verificação em dois fatores", tabela([
        { t: "Pessoa", f: (x) => `<b>${esc(x.nome)}</b><div class="mut">${esc(S.rotPerfil(x.perfil))} · ${esc(x.login)}</div>` },
        { t: "2FA", f: (x) => (x.ativo ? `<span class="tag ok">ligado</span>` : `<span class="tag alerta">desligado</span>`) },
        { t: "Último acesso", f: (x) => esc(hora(x.ultimo_login)) },
        { t: "", f: (x) => (x.ativo ? `<button class="btn sec pq" data-r2="${x.id}">Redefinir</button>` : "") }], dc.contas),
        "Opcional. Gerente, Administrador e backoffice recebem um aviso para ligar. Redefinir desliga o 2FA de quem perdeu o celular e encerra as sessões dessa pessoa; ela liga de novo em Meu perfil > Segurança.", `${dc.contas.filter((x) => x.ativo).length} de ${dc.contas.length} com 2FA`) : ""}
      ${painel("Se houver incidente", passos)}`;

    el.querySelectorAll("[data-r2]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Desligar o 2FA desta pessoa e encerrar as sessões dela? Use quando ela perdeu o celular.")) return;
      try { await api("/auth/2fa/redefinir", { method: "POST", body: { usuario_id: +b.dataset.r2 } }); await go(); el.insertAdjacentHTML("afterbegin", `<div class="aviso">2FA redefinido.</div>`); } catch (e) { alert(e.message); }
    }));
    el.querySelector("#sg-enc").addEventListener("click", async () => {
      const t = prompt("Isto desloga TODAS as pessoas, inclusive você.\nDigite ENCERRAR para confirmar:");
      if (t !== "ENCERRAR") return;
      try { await api("/seguranca/encerrar-sessoes", { method: "POST", body: { confirmar: "ENCERRAR" } }); alert("Sessões encerradas. Você será desconectado agora."); S.sair("Sessões encerradas por segurança."); }
      catch (e) { alert(e.message); }
    });
    el.querySelector("#sg-trav")?.addEventListener("click", async () => {
      const travar = !ex.travada;
      if (!confirm(travar ? "Travar TODAS as exportações em CSV para todos os perfis?" : "Liberar as exportações em CSV de novo?")) return;
      try { await api("/seguranca/exportacao", { method: "POST", body: { travar } }); await go(); el.insertAdjacentHTML("afterbegin", `<div class="aviso">Exportações ${travar ? "travadas" : "liberadas"}.</div>`); }
      catch (e) { alert(e.message); }
    });
  };
})();
