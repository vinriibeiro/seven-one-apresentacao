"use strict";
/* Quem está online (backoffice, gerente e administrador).
   Online = app aberto com sinal nos últimos minutos. A lista mostra também quem passou pelo sistema nas últimas 12 horas.
   Atualiza sozinha a cada 30 s enquanto a tela estiver aberta. */
(() => {
  const { esc, api, painel, tabela } = S;
  const SETOR = { CADASTRO: "Cadastro", QUALIDADE: "Qualidade" };
  const ha = (d) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(d)) / 6e4));
    return m < 1 ? "agora" : m < 60 ? `há ${m} min` : `há ${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`;
  };
  const hora = (d) => (d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "–");
  const est = { so: false, busca: "" };

  S.PAGES.online = async (el) => {
    const desenhar = async () => {
      const j = await api("/online?nocache=1");
      const on = j.itens.filter((x) => x.online);
      const porCargo = on.reduce((a, x) => ((a[x.cargo] = (a[x.cargo] || 0) + 1), a), {});
      const b = est.busca.toLowerCase();
      const lista = j.itens.filter((x) => (!est.so || x.online) && (!b || `${x.nome} ${x.equipe || ""}`.toLowerCase().includes(b)));
      el.innerHTML = `<div class="cab"><div><div class="migalha">Equipe</div><h1>Quem está online</h1><p>Online = com o sistema aberto agora (sinal nos últimos ${j.online_min} minutos). Abaixo deles, quem entrou nas últimas 12 horas. Atualiza sozinho a cada 30 segundos.</p></div></div>
        <div class="vb-resumo"><div class="ok"><b>${on.length}</b><span>online agora</span></div>
          ${Object.entries(porCargo).sort((a, z) => z[1] - a[1]).map(([c, n]) => `<div><b>${n}</b><span>${esc(S.rotPerfil(c))}</span></div>`).join("")}
          <div><b>${j.itens.length - on.length}</b><span>saíram ou estão ausentes</span></div></div>
        <div class="filtros"><div class="campo" style="width:auto"><label>Mostrar</label><div class="seg" id="ofs"><button data-s="0" class="${est.so ? "" : "on"}">Todos (12 h)</button><button data-s="1" class="${est.so ? "on" : ""}">Só online</button></div></div>
          <div class="campo" style="flex:1;min-width:200px"><label>Buscar</label><input id="ofb" value="${esc(est.busca)}" placeholder="nome ou equipe"></div></div>
        ${painel("Pessoas", tabela([
          { t: "", f: (x) => `<span class="chip ${x.online ? "ok" : ""}">${x.online ? "Online" : "Ausente"}</span>` },
          { t: "Nome", f: (x) => `<b>${esc(x.nome)}</b>` },
          { t: "Cargo", f: (x) => esc(S.rotPerfil(x.cargo)) + (x.setor ? ` <span class="mut">· ${SETOR[x.setor] || esc(x.setor)}</span>` : "") },
          { t: "Equipe", f: (x) => esc(x.equipe ? S.titulo(x.equipe) : "–") },
          { t: "Último sinal", f: (x) => (x.online ? "agora" : ha(x.visto_em)) },
          { t: "Entrou em", f: (x) => hora(x.ultimo_login) }], lista), "Quem fecha o app ou o navegador sai de “online” em poucos minutos; quem clica em Sair sai na hora.", `${lista.length}`)}`;
      el.querySelector("#ofs").addEventListener("click", (e) => { const s = e.target.closest("[data-s]")?.dataset.s; if (s) { est.so = s === "1"; desenhar(); } });
      el.querySelector("#ofb").addEventListener("input", (e) => { clearTimeout(el._tb); el._tb = setTimeout(() => { est.busca = e.target.value.trim(); desenhar().then(() => { const i = el.querySelector("#ofb"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }); }, 400); });
    };
    await desenhar();
    clearInterval(el._online);
    el._online = setInterval(() => { if (!el.isConnected || !el.querySelector("#ofs")) return clearInterval(el._online); if (!document.hidden) desenhar().catch(() => {}); }, 30000);
  };
})();
