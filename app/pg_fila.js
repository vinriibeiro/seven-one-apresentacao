"use strict";
/* Operação → Fila da Qualidade: Cobrança de faturas e Churn (4 meses na base). Backoffice de Qualidade e gerente.
   Cobrança: contratos ATIVO com a 1ª ou a 2ª fatura em aberto (ou não paga), pelo prazo máximo Seven.
   Churn: clientes instalados há até 120 dias (parâmetro churn_dias) que caíram, têm fatura não paga ou estão perto de completar os 4 meses.
   Cada contato fica registrado (tabela tratativa) com os mesmos textos da planilha de Qualidade; vale o último. */
(() => {
  const { esc, nf, api } = S;
  const LIM = 300;   // linhas desenhadas por vez (a lista pode ter mais; os filtros reduzem)
  const br = (d) => (d ? String(d).slice(0, 10).split("-").reverse().join("/") : "–");
  const fone = (t) => String(t || "").replace(/\D/g, "");
  const wa = (t) => { const d = fone(t); return d.length >= 10 ? `https://wa.me/55${d.replace(/^55(?=\d{10,11}$)/, "")}` : null; };
  const sem = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const kp = (r, v, d) => `<div class="kpi"><div class="r">${esc(r)}</div><div class="v">${v}</div><div class="d">${d || "&nbsp;"}</div></div>`;
  const estC = { prazo: "", fat: "", so: true, busca: "" };
  const estH = { motivo: "", so: true, busca: "" };

  const contato = (x) => {
    const z = wa(x.contato);
    return x.contato ? `<a href="tel:${fone(x.contato)}">${esc(x.contato)}</a>${z ? ` <a class="cf-wa" href="${z}" target="_blank" rel="noopener">WhatsApp</a>` : ""}` : `<span class="mut">sem telefone</span>`;
  };
  const ultimo = (x) => (x.resultado ? `<b>${esc(x.resultado)}</b>${x.com_oferta === true ? ` <span class="tag">com oferta</span>` : ""}<div class="mut">${br(x.ocorrido_em)}${x.feito_por ? " · " + esc(S.titulo(x.feito_por)) : ""}${x.observacao ? " · “" + esc(x.observacao) + "”" : ""}</div>` : `<span class="mut">nenhum contato</span>`);
  const acao = (x, opcoes, tipo) => (S.sessao.vercomo ? "" : `<div class="fl-acao" data-id="${x.contrato_id}" data-tipo="${tipo}">
      <select class="fl-res"><option value="">Registrar contato…</option>${opcoes.map((o) => `<option>${esc(o)}</option>`).join("")}</select>
      <input class="fl-obs" maxlength="500" placeholder="Observação (opcional)">
      <label class="fl-of"><input type="checkbox" class="fl-oferta"> com oferta</label>
      <button class="btn pq fl-ok">Registrar</button></div>`);
  function ligar(el, recarregar) {
    el.querySelectorAll(".fl-ok").forEach((b) => b.addEventListener("click", async () => {
      const box = b.closest(".fl-acao"), sel = box.querySelector(".fl-res");
      if (!sel.value) { sel.focus(); sel.classList.add("faltando"); return; }
      b.disabled = true;
      try {
        await api("/qualidade/tratativa", { method: "POST", body: { contrato_id: +box.dataset.id, tipo: box.dataset.tipo, resultado: sel.value, observacao: box.querySelector(".fl-obs").value.trim(), com_oferta: box.querySelector(".fl-oferta").checked ? true : null } });
        recarregar();
      } catch (e) { alert(e.message); b.disabled = false; }
    }));
  }
  const filtroBusca = (el, est, recarregar) => {
    el.querySelector("#fb")?.addEventListener("keydown", (e) => { if (e.key === "Enter") el.querySelector("#ok").click(); });
    el.querySelector("#ok").addEventListener("click", () => { est.busca = el.querySelector("#fb").value.trim(); recarregar(); });
  };

  /* ---------- Cobrança ---------- */
  S.PAGES["fila-cobranca"] = async (el) => {
    const j = await api("/qualidade/cobranca");
    const q = sem(estC.busca);
    let L = j.itens;
    if (estC.fat) L = L.filter((x) => String(x.fatura) === estC.fat);
    if (estC.prazo === "vencido") L = L.filter((x) => x.dias_restantes < 0);
    if (estC.prazo === "7") L = L.filter((x) => x.dias_restantes >= 0 && x.dias_restantes <= 7);
    if (estC.so) L = L.filter((x) => !x.resultado);
    if (q) L = L.filter((x) => sem(x.cliente).includes(q) || String(x.numero_contrato || "").includes(q.replace(/\D/g, "") || "\u0000"));
    const c = j.cont;
    const prazoTxt = (x) => (x.dias_restantes < 0 ? `<span class="tag ruim">vencido há ${nf.format(-x.dias_restantes)} dia${x.dias_restantes === -1 ? "" : "s"}</span>` : x.dias_restantes <= 7 ? `<span class="tag alerta">${x.dias_restantes === 0 ? "vence hoje" : `faltam ${nf.format(x.dias_restantes)} dia${x.dias_restantes === 1 ? "" : "s"}`}</span>` : `<span class="tag">faltam ${nf.format(x.dias_restantes)} dias</span>`) + `<div class="mut">prazo Seven ${br(x.prazo_seven)}${x.vencimento_estimado ? " (estimado)" : ""}</div>`;
    el.innerHTML = `<div class="cab"><div><div class="migalha">Fila da Qualidade</div><h1>Cobrança de faturas</h1>
        <div class="mut" style="margin-top:3px">Contratos ativos com a 1ª ou a 2ª fatura em aberto ou não paga. A mais urgente (prazo Seven mais perto ou já vencido) vem primeiro.</div></div></div>
      <div class="kpis">${kp("Faturas na fila", nf.format(c.total), `${nf.format(c.primeira)} da 1ª · ${nf.format(c.segunda)} da 2ª`)}${kp("Prazo Seven vencido", nf.format(c.vencidas), "cobrar com prioridade")}${kp("Sem nenhum contato", nf.format(c.sem_tratativa), "ainda não ligados")}${kp("Na tela", nf.format(L.length), L.length > LIM ? `mostrando ${LIM}` : "com os filtros")}</div>
      <div class="filtros">
        <div class="campo" style="width:130px"><label>Fatura</label><select id="ff"><option value="">1ª e 2ª</option><option value="1" ${estC.fat === "1" ? "selected" : ""}>Só a 1ª</option><option value="2" ${estC.fat === "2" ? "selected" : ""}>Só a 2ª</option></select></div>
        <div class="campo" style="width:190px"><label>Prazo Seven</label><select id="fp"><option value="">Todos</option><option value="vencido" ${estC.prazo === "vencido" ? "selected" : ""}>Já vencido</option><option value="7" ${estC.prazo === "7" ? "selected" : ""}>Vence em até 7 dias</option></select></div>
        <label class="fx-sw"><input type="checkbox" id="fs" ${estC.so ? "checked" : ""}><i></i>Só sem contato</label>
        <div class="campo" style="width:230px"><label>Buscar (cliente ou contrato)</label><input id="fb" value="${esc(estC.busca)}"></div><button class="btn" id="ok">Filtrar</button></div>
      <div class="tab fila"><table><thead><tr><th>Cliente</th><th>Fatura</th><th>Prazo Seven</th><th>Vendedor</th><th>Contato</th><th>Último contato</th><th>Registrar</th></tr></thead><tbody>${L.length ? L.slice(0, LIM).map((x) => `<tr>
          <td><a href="#/venda/${x.contrato_id}">${esc(S.titulo(x.cliente))}</a><div class="mut">contrato ${esc(x.numero_contrato)}${x.forma_pagamento === "DCC" ? ` <span class="tag">DCC</span>` : ""}${x.possui_oferta ? ` <span class="tag">com oferta</span>` : ""}</div></td>
          <td><b>${x.fatura}ª</b> <span class="tag ${x.situacao === "NAO_PAGA" ? "ruim" : "alerta"}">${x.situacao === "NAO_PAGA" ? "não paga" : "em aberto"}</span></td>
          <td>${prazoTxt(x)}</td><td>${esc(S.titulo(x.vendedor || "–"))}${x.equipe ? `<div class="mut">${esc(S.titulo(x.equipe))}</div>` : ""}</td>
          <td>${contato(x)}</td><td>${ultimo(x)}</td><td>${acao(x, j.opcoes, "COBRANCA")}</td></tr>`).join("") : `<tr><td colspan="7" class="mut">Nenhuma fatura com esses filtros.</td></tr>`}</tbody></table></div>
      ${L.length > LIM ? `<div class="mut" style="margin-top:8px">Mostrando as ${LIM} primeiras de ${nf.format(L.length)}. Use os filtros para ver as demais.</div>` : ""}`;
    const go = () => S.PAGES["fila-cobranca"](el).catch(S.erroEm(el));
    el.querySelector("#ff").addEventListener("change", (e) => { estC.fat = e.target.value; go(); });
    el.querySelector("#fp").addEventListener("change", (e) => { estC.prazo = e.target.value; go(); });
    el.querySelector("#fs").addEventListener("change", (e) => { estC.so = e.target.checked; go(); });
    filtroBusca(el, estC, go); ligar(el, go);
  };

  /* ---------- Churn: manter o cliente 4 meses na base ---------- */
  const MOTIVO = { CAIU: ["Caiu", "ruim"], FATURA_NAO_PAGA: ["Fatura não paga", "alerta"], CHEGANDO: ["Perto dos 4 meses", ""] };
  S.PAGES["fila-churn"] = async (el) => {
    const j = await api("/qualidade/churn");
    const q = sem(estH.busca);
    let L = j.itens;
    if (estH.motivo) L = L.filter((x) => x.motivo === estH.motivo);
    if (estH.so) L = L.filter((x) => !x.resultado);
    if (q) L = L.filter((x) => sem(x.cliente).includes(q) || String(x.numero_contrato || "").includes(q.replace(/\D/g, "") || "\u0000"));
    const c = j.cont, meses = Math.round(j.dias / 30);
    el.innerHTML = `<div class="cab"><div><div class="migalha">Fila da Qualidade</div><h1>Churn · ${meses} meses na base</h1>
        <div class="mut" style="margin-top:3px">Clientes instalados há até ${nf.format(j.dias)} dias (${meses} meses) que caíram, têm fatura não paga ou estão perto de completar o prazo. Acompanhe cada um até fechar o prazo e registre o resultado.</div></div></div>
      <div class="kpis">${kp("Na fila", nf.format(c.total), "dentro do prazo")}${kp("Caíram", nf.format(c.caiu), "contrato desconectado/cancelado")}${kp("Fatura não paga", nf.format(c.fatura_nao_paga), "risco de cair")}${kp("Perto dos " + meses + " meses", nf.format(c.chegando), "ainda conectados")}${kp("Sem tratativa", nf.format(c.sem_tratativa), "nenhum resultado registrado")}</div>
      <div class="filtros">
        <div class="campo" style="width:200px"><label>Motivo</label><select id="fm"><option value="">Todos</option>${Object.entries(MOTIVO).map(([k, v]) => `<option value="${k}" ${estH.motivo === k ? "selected" : ""}>${v[0]}</option>`).join("")}</select></div>
        <label class="fx-sw"><input type="checkbox" id="fs" ${estH.so ? "checked" : ""}><i></i>Só sem tratativa</label>
        <div class="campo" style="width:230px"><label>Buscar (cliente ou contrato)</label><input id="fb" value="${esc(estH.busca)}"></div><button class="btn" id="ok">Filtrar</button></div>
      <div class="tab fila"><table><thead><tr><th>Cliente</th><th>Motivo</th><th>Dias na base</th><th>Vendedor</th><th>Contato</th><th>Última tratativa</th><th>Registrar</th></tr></thead><tbody>${L.length ? L.slice(0, LIM).map((x) => { const m = MOTIVO[x.motivo] || [x.motivo, ""]; return `<tr>
          <td><a href="#/venda/${x.contrato_id}">${esc(S.titulo(x.cliente))}</a><div class="mut">contrato ${esc(x.numero_contrato)}${x.status_contrato ? " · " + esc(S.titulo(x.status_contrato)) : ""}</div></td>
          <td><span class="tag ${m[1]}">${esc(m[0])}</span></td>
          <td><b>${nf.format(x.dias_base)}</b> <span class="mut">de ${nf.format(j.dias)}</span><div class="mut">${x.faltam ? `faltam ${nf.format(x.faltam)} dia${x.faltam === 1 ? "" : "s"}` : "prazo completo"} · instalado ${br(x.data_instalacao)}</div></td>
          <td>${esc(S.titulo(x.vendedor || "–"))}${x.equipe ? `<div class="mut">${esc(S.titulo(x.equipe))}</div>` : ""}</td>
          <td>${contato(x)}</td><td>${ultimo(x)}</td><td>${acao(x, j.opcoes, "CHURN")}</td></tr>`; }).join("") : `<tr><td colspan="7" class="mut">Nenhum cliente com esses filtros.</td></tr>`}</tbody></table></div>
      ${L.length > LIM ? `<div class="mut" style="margin-top:8px">Mostrando os ${LIM} primeiros de ${nf.format(L.length)}. Use os filtros para ver os demais.</div>` : ""}`;
    const go = () => S.PAGES["fila-churn"](el).catch(S.erroEm(el));
    el.querySelector("#fm").addEventListener("change", (e) => { estH.motivo = e.target.value; go(); });
    el.querySelector("#fs").addEventListener("change", (e) => { estH.so = e.target.checked; go(); });
    filtroBusca(el, estH, go); ligar(el, go);
  };
})();
