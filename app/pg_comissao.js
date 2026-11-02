"use strict";
/* Premiação: apuração do mês (todos os perfis, cada um no seu alcance) e Plano do mês (gestor: metas e valores) */
(() => {
  const { esc, nf, api, painel, brl, modal } = S;
  const est = { mes: "" };
  const ROT = { BL: "Banda larga", BL_PME: "Banda larga PME", MPLAY: "Bônus MPLAY marcado", MDU: "Bônus MDU (apartamento)", TV: "TV (single ou c/ linha nova)", TV_PLUS: "TV+ (base ou c/ banda larga)", CHIP_NOVA: "Chip linha nova", CHIP_MIGRACAO: "Chip migração", CHIP_PORT: "Chip portabilidade", DCC: "Bônus DCC (débito em conta)",
    BONUS_FPD_A: "Bônus FPD (faixa melhor)", BONUS_FPD_B: "Bônus FPD (faixa intermediária)", BONUS_DCC: "Bônus DCC da equipe", BONUS_VENDEDOR: "Bônus por vendedor com meta de BL" };
  const ORDEM = Object.keys(ROT);
  const mesRot = (m) => { const [a, n] = m.split("-"); return ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][+n - 1] + "/" + a; };
  const p1 = (x) => (x == null ? "–" : (x * 100).toFixed(1).replace(".", ",") + "%");
  const kpi = S.kpi;
  const seletorMes = (meses, atual, extra) => {
    const lista = new Set([...meses.map((m) => m.mes), atual, ...(extra || [])]);
    return `<div class="campo" style="width:190px"><label>Mês</label><select id="sm">${[...lista].sort().reverse().map((m) => `<option value="${m}" ${m === atual ? "selected" : ""}>${esc(mesRot(m))}${meses.find((x) => x.mes === m)?.fechado ? " (fechado)" : ""}</option>`).join("")}</select></div>`;
  };

  S.PAGES.comissao = async (el) => {
    const u = S.sessao.usuario, gestor = u.perfil === "gestor";
    const j = await api("/comissao" + (est.mes ? "?mes=" + est.mes : ""));
    est.mes = j.mes;
    const go = () => S.PAGES.comissao(el).catch(S.erroEm(el));
    const cab = `<div class="cab"><div><div class="migalha">Premiação</div><h1>Premiação de ${esc(mesRot(j.mes))}</h1></div><div class="acoes">${j.plano ? `<button class="btn sec" id="ex">Exportar CSV</button>` : ""}</div></div>`;
    if (!j.plano) {
      el.innerHTML = `${cab}<div class="filtros">${seletorMes(j.meses, j.mes)}</div><div class="aviso">Este mês ainda não tem plano de premiação. ${gestor ? `Crie em <a href="#/plano">Plano do mês</a>.` : "Fale com o gerente."}</div>`;
      el.querySelector("#sm").addEventListener("change", (e) => { est.mes = e.target.value; go(); });
      return;
    }
    if (document.body.classList.contains("app-vendedor") && u.perfil === "vendedor" && j.linhas.length === 1) return appPremio(el, j, go);
    const L = j.linhas, tot = L.reduce((s, l) => s + l.total, 0), bl = L.filter((l) => l.papel === "VENDEDOR").reduce((s, l) => s + l.bl, 0);
    const ok = L.filter((l) => l.meta_ok).length;
    const fp = L.filter((l) => l.fpd != null);
    const lider = L.some((l) => l.papel === "LIDER");
    el.innerHTML = `${cab}
      <div class="filtros">${seletorMes(j.meses, j.mes)}<div class="mut" style="padding-bottom:8px">${j.plano.fechado ? `Mês fechado: resultado congelado${j.congelado_em ? " em " + new Date(j.congelado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}. Cancelamentos e FPD lançados depois não mudam estes valores.` : j.parcial ? "Mês em andamento: valores parciais. O FPD só existe depois que as primeiras faturas vencem." : "Valores calculados com as vendas instaladas do mês."}</div></div>
      <div class="kpis">${kpi(u.perfil === "vendedor" ? "Minha premiação" : "Total a pagar", brl(tot), u.perfil === "vendedor" ? "" : `${L.length} pessoa(s)`)}${u.perfil === "vendedor" ? "" : kpi("Banda larga (vendedores)", nf.format(bl), "instaladas no mês")}${kpi("Bateram a meta", `${ok}/${L.length}`, "meta mínima do plano")}${u.perfil === "vendedor" ? "" : kpi("FPD médio", fp.length ? p1(fp.reduce((s, l) => s + l.fpd, 0) / fp.length) : "–", fp.length ? `${fp.length} com FPD apurado` : "sem faturas apuradas")}</div>
      ${L.length > 1 ? `<div class="grade g2">${painel("Premiação por pessoa", CH.barrasH({ dados: [...L].sort((a, b) => b.total - a.total).slice(0, 15).map((l) => ({ rot: l.nome, y: l.total })), rotuloX: "R$", titulo: "Premiação por pessoa", fmt: (v) => "R$ " + nf.format(Math.round(v)) }), "Até 15 maiores valores do mês.")}
        ${painel("Faixa 1 × Faixa 2", (() => { const f2 = L.filter((l) => l.faixa === 2).length, f1 = L.length - f2; return CH.rosca({ centro: "pessoas", titulo: "Faixa 1 e Faixa 2", altura: 210, partes: [{ rot: `Faixa 2 (FPD ≤ ${(j.plano.fpd_faixa * 100).toFixed(0)}%)`, y: f2, cor: CH.COR.ok }, { rot: "Faixa 1", y: f1, cor: CH.COR.azul }] }); })(), "Sem FPD apurado a pessoa fica na Faixa 1.")}</div>` : ""}
      ${painel("Apuração", S.tabela([
        { t: "Pessoa", f: (l) => `<b>${esc(l.nome)}</b>${l.papel === "LIDER" ? ` <span class="tag">supervisor</span>` : ""}<div class="mut">${esc(l.equipe || "sem equipe")}</div>` },
        { t: "BL/meta", n: true, f: (l) => `${l.bl} / ${l.meta_bl}` },
        ...(j.plano.pme_ativo ? [{ t: "BL PME/meta", n: true, f: (l) => `${l.bl_pme || 0} / ${l.meta_bl_pme || 0}` }] : []),
        ...(L.some((l) => l.papel === "VENDEDOR") ? [{ t: "Chips", n: true, f: (l) => (l.papel === "LIDER" ? "–" : `${l.chips_mp} / ${l.meta_chip}`) }] : []),
        ...(u.perfil === "vendedor" ? [] : [{ t: "FPD", n: true, f: (l) => p1(l.fpd) }]),
        { t: "Faixa", f: (l) => `<span class="tag ${l.faixa === 2 ? "ok" : ""}" title="${esc(l.faixa_motivo)}">Faixa ${l.faixa}</span>${l.inelegivel ? ` <span class="tag ruim">inelegível</span>` : l.bloqueio.length ? ` <span class="tag alerta" title="${esc(l.bloqueio.join("; "))}">restrição</span>` : ""}` },
        { t: "Base", n: true, f: (l) => brl(l.base) }, { t: "Bônus", n: true, f: (l) => brl(l.bonus_total) },
        { t: "Ajuste", n: true, f: (l) => (l.ajuste ? brl(l.ajuste) : "–") }, { t: "Total", n: true, f: (l) => `<b>${brl(l.total)}</b>` },
      ], [...L].sort((a, b) => b.total - a.total), { clic: true }) + (lider ? `<div class="nota">Supervisor: premiação sobre tudo que a equipe conectou no mês.</div>` : ""))}`;
    el.querySelector("#sm").addEventListener("change", (e) => { est.mes = e.target.value; go(); });
    el.querySelector("#ex").addEventListener("click", () => S.baixar("/exportar/comissao?mes=" + j.mes, `premiacao-${j.mes}.csv`).catch((e) => alert(e.message)));
    const ordenada = [...L].sort((a, b) => b.total - a.total);
    el.querySelectorAll("tr.clic").forEach((tr) => tr.addEventListener("click", () => detalhe(ordenada[+tr.dataset.i], j, go)));
    painelMeta(el, j.mes, go).catch(() => {});
  };

  /* Meta de BL do mês: o gerente define a meta geral e o líder reparte entre os vendedores da equipe dele; a soma não passa da meta geral.
     Só aparece com o db/56 rodado. Não é a meta mínima da premiação (essa continua no Plano do mês). */
  async function painelMeta(el, mes, go) {
    const u = S.sessao.usuario;
    if (u.perfil === "vendedor") return;
    const m = await api("/comissao/meta-geral?mes=" + mes).catch(() => null);
    const dest = el.querySelector(".filtros");
    if (!m || !m.existe || !dest) return;
    if (m.migracao_pendente) { if (u.perfil === "gestor") dest.insertAdjacentHTML("afterend", `<div class="aviso">Meta geral do mês: rode o arquivo <b>db/56_meta_geral.sql</b> no Supabase para ativar.</div>`); return; }
    const geral = m.meta_geral, ed = m.editavel, distribuir = ed && geral != null, f = (n) => nf.format(n);
    const resumo = () => (geral == null ? `<p class="mut">O gerente ainda não definiu a meta geral de ${esc(mesRot(mes))}.</p>`
      : `<div class="kpis">${kpi("Meta geral do mês", f(geral), "BL da operação")}${kpi("Distribuída aos vendedores", `<span id="md">${f(m.distribuida)}</span>`, "soma das metas")}${kpi("Falta distribuir", `<span id="mf">${f(Math.max(m.falta, 0))}</span>`, "a soma tem que fechar com a meta geral")}</div>`);
    const campoGeral = m.pode_definir ? `<div class="filtros" style="border:0;padding:0 0 8px"><div class="campo" style="width:210px"><label for="mg">Meta geral do mês (BL)</label><input id="mg" type="number" min="0" value="${geral ?? ""}" ${ed ? "" : "disabled"}></div>${ed ? `<button class="btn sec" id="mgs" style="align-self:flex-end">Salvar meta geral</button>` : ""}</div>` : "";
    const lista = m.itens.length ? `${m.itens.length > 12 ? `<div class="campo" style="width:260px;margin-bottom:8px"><label for="mb">Buscar vendedor ou equipe</label><input id="mb" placeholder="nome ou equipe"></div>` : ""}
      <div class="tab"><table><thead><tr><th>Equipe</th><th>Vendedor</th><th class="num">Meta de BL</th></tr></thead><tbody id="mtl">${m.itens.map((x) => `<tr data-b="${esc((x.nome + " " + x.equipe).toLowerCase())}"><td class="mut">${esc(x.equipe)}</td><td><b>${esc(x.nome)}</b></td><td class="num"><input class="mini" type="number" min="0" max="100000" data-v="${x.id}" data-o="${x.meta ?? ""}" value="${x.meta ?? ""}" placeholder="0" ${distribuir ? "" : "disabled"}></td></tr>`).join("")}</tbody></table></div>
      ${distribuir ? `<div style="margin-top:8px"><button class="btn" id="mts">Salvar metas dos vendedores</button></div>` : ""}` : `<p class="mut">Nenhum vendedor ativo nas suas equipes.</p>`;
    dest.insertAdjacentHTML("afterend", painel("Meta de BL do mês", `${campoGeral}${resumo()}${lista}`,
      u.perfil === "gestor" ? "O gerente define a meta geral; os líderes repartem entre os vendedores. A soma não pode passar da meta geral. Não altera a meta mínima da premiação." : "Reparta a meta do mês entre os seus vendedores. A soma de todos os líderes tem que fechar com a meta geral."));
    const aviso = (t) => el.insertAdjacentHTML("afterbegin", `<div class="aviso">${t}</div>`);
    const caixas = [...el.querySelectorAll("#mtl input[data-v]")];
    const atualizar = () => {   // soma ao vivo: o que já estava distribuído, trocando as caixas desta tela pelo que está digitado
      const ant = caixas.reduce((s, i) => s + (+i.dataset.o || 0), 0), agora = caixas.reduce((s, i) => s + (+i.value || 0), 0), tot = m.distribuida - ant + agora;
      const d = el.querySelector("#md"), fl = el.querySelector("#mf"); if (!d || !fl) return;
      d.textContent = f(tot); fl.textContent = f(Math.max(geral - tot, 0)); d.style.color = tot > geral ? "var(--st-canc, #c0392b)" : "";
    };
    caixas.forEach((i) => i.addEventListener("input", atualizar));
    el.querySelector("#mb")?.addEventListener("input", (e) => { const q = e.target.value.trim().toLowerCase(); el.querySelectorAll("#mtl tr[data-b]").forEach((tr) => { tr.style.display = !q || tr.dataset.b.includes(q) ? "" : "none"; }); });
    el.querySelector("#mgs")?.addEventListener("click", async () => {
      try { await api("/comissao/meta-geral", { method: "PUT", body: { mes, meta_geral: el.querySelector("#mg").value } }); await go(); el.insertAdjacentHTML("afterbegin", `<div class="aviso">Meta geral salva.</div>`); } catch (e) { alert(e.message); }
    });
    el.querySelector("#mts")?.addEventListener("click", async () => {
      const itens = caixas.filter((i) => i.value !== i.dataset.o).map((i) => ({ usuario_id: +i.dataset.v, meta: i.value }));
      if (!itens.length) { alert("Nenhuma meta foi alterada."); return; }
      try { const r = await api("/comissao/meta-geral", { method: "PUT", body: { mes, itens } }); await go(); el.insertAdjacentHTML("afterbegin", `<div class="aviso">Metas salvas (${itens.length} vendedor(es)). Distribuído: ${f(r.distribuida)} de ${f(r.meta_geral)}.</div>`); } catch (e) { alert(e.message); }
    });
  }

  /* app do vendedor: a premiação em um cartão grande, fácil de ler no celular */
  function appPremio(el, j, go) {
    const l = j.linhas[0], pc = (a, b) => (b ? Math.min(100, (a / b) * 100) : 0);
    const st = l.inelegivel ? "ruim" : l.meta_ok ? "ok" : "";
    const tile = (r, v, d) => `<div class="ap-tile"><div class="r">${r}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
    // o que falta para a meta mínima: BL e/ou chips (antes dizia "faltam 0 BL" quando só faltavam chips)
    const falta = (x) => [x.bl < x.meta_bl && `${nf.format(x.meta_bl - x.bl)} BL`, j.plano.pme_ativo && x.meta_bl_pme && (x.bl_pme || 0) < x.meta_bl_pme && `${nf.format(x.meta_bl_pme - (x.bl_pme || 0))} BL PME`, x.meta_chip && x.chips_mp < x.meta_chip && `${nf.format(x.meta_chip - x.chips_mp)} ${x.meta_chip - x.chips_mp === 1 ? "chip" : "chips"}`].filter(Boolean).join(" e ") || "0 BL";
    el.innerHTML = `<div class="ap-cab"><h1>Minha premiação</h1><span>${esc(mesRot(j.mes))}</span></div>
      <div class="ap-mes-sel">${seletorMes(j.meses, j.mes)}</div>
      <section class="ap-hero ${st}"><div class="ap-rot" style="margin-top:0">${j.plano.fechado ? "Premiação do mês" : "Premiação até agora"}</div>
        <div class="ap-big"><b class="ap-rs">${brl(l.total)}</b></div>
        <div class="ap-msg">${l.inelegivel ? "Neste mês você ficou inelegível. Toque em “Ver detalhes” para entender." : l.meta_ok ? "Meta mínima batida. Continue vendendo para aumentar a premiação!" : `Faltam ${falta(l)} para a meta mínima.`}${j.plano.fechado ? "" : " Valores parciais, o mês ainda está em andamento."}</div>
        <div class="ap-metas"><div><span>Banda larga</span><b>${nf.format(l.bl)} <small>de ${nf.format(l.meta_bl)}</small></b><div class="ap-barra fina"><i class="r" style="width:${pc(l.bl, l.meta_bl)}%"></i></div></div>
          <div><span>Chips</span><b>${nf.format(l.chips_mp)} <small>de ${nf.format(l.meta_chip)}</small></b><div class="ap-barra fina"><i class="r" style="width:${pc(l.chips_mp, l.meta_chip)}%"></i></div></div>
          ${j.plano.pme_ativo ? `<div><span>BL PME</span><b>${nf.format(l.bl_pme || 0)} <small>de ${nf.format(l.meta_bl_pme || 0)}</small></b><div class="ap-barra fina"><i class="r" style="width:${pc(l.bl_pme || 0, l.meta_bl_pme)}%"></i></div></div>` : ""}</div></section>
      <div class="ap-tiles">${tile("Base", brl(l.base), "pelas vendas instaladas")}${tile("Bônus", brl(l.bonus_total), "DCC e metas")}${tile("Meta mínima", l.meta_ok ? "Batida" : l.bl < l.meta_bl ? nf.format(l.meta_bl - l.bl) : nf.format(Math.max(0, (l.meta_chip || 0) - l.chips_mp)), l.meta_ok ? "parabéns!" : l.bl < l.meta_bl ? "BL para bater" : "chips para bater")}${tile("Ajuste", l.ajuste ? brl(l.ajuste) : "–", "lançado pelo gerente")}</div>
      <button class="btn ap-cta" id="dt">Ver detalhes da premiação</button>`;
    el.querySelector("#sm").addEventListener("change", (e) => { est.mes = e.target.value; go(); });
    el.querySelector("#dt").addEventListener("click", () => detalhe(l, j, go));
  }

  function detalhe(l, j, recarregar) {
    const semVer = S.sessao.vercomo;
    const itens = l.itens.length ? S.tabela([{ t: "Item", f: (x) => esc(x.nome) }, { t: "Qtd", n: true, f: (x) => x.qtd }, { t: "Valor unit.", n: true, f: (x) => brl(x.unit) }, { t: "Valor", n: true, f: (x) => brl(x.valor) }], l.itens) : `<p class="mut">Nenhuma venda conectada no mês.</p>`;
    const bonus = l.bonus.length ? S.tabela([{ t: "Bônus", f: (x) => esc(x.nome) }, { t: "Situação", f: (x) => `<span class="tag ${x.ok ? "ok" : ""}">${x.ok ? "ganhou" : "não"}</span>` }, { t: "Regra", f: (x) => `<span class="mut">${esc(x.obs)}</span>` }, { t: "Valor", n: true, f: (x) => brl(x.valor) }], l.bonus) : "";
    const form = l.editavel && !semVer ? `<h3 style="margin:14px 0 6px">Ajustar</h3>
      <div class="filtros" style="border:0;padding:0">
        <div class="campo" style="width:110px"><label>Meta BL</label><input type="number" min="0" id="mb" value="${l.meta_bl_personalizada ? l.meta_bl : ""}" placeholder="${l.meta_bl}"></div>
        ${j.plano.pme_ativo ? `<div class="campo" style="width:130px"><label>Meta BL PME</label><input type="number" min="0" id="mp" value="${l.meta_bl_pme_personalizada ? l.meta_bl_pme : ""}" placeholder="${l.meta_bl_pme ?? 0}"></div>` : ""}
        ${l.papel === "VENDEDOR" ? `<div class="campo" style="width:110px"><label>Meta chips</label><input type="number" min="0" id="mc" value="${l.meta_chip_personalizada ? l.meta_chip : ""}" placeholder="${l.meta_chip}"></div>` : ""}
        <div class="campo" style="width:120px"><label>Ajuste (R$)</label><input type="number" step="0.01" id="aj" value="${l.ajuste || ""}"></div>
        <div class="campo" style="flex:1;min-width:180px"><label>Motivo do ajuste</label><input id="mo" maxlength="300" value="${esc(l.motivo || "")}"></div>
        <label class="mut" style="display:flex;gap:6px;align-items:center;padding-bottom:9px;white-space:nowrap"><input type="checkbox" id="pp" ${l.pap_ok ? "checked" : ""}> PAP Tools ok</label></div>
      <div class="mut">Meta vazia usa a do plano. Sem PAP Tools ok, a pessoa não recebe bônus. Tudo fica na Central de alterações.</div>` : "";
    const m = modal(l.nome + (l.papel === "LIDER" ? " (supervisor)" : ""), `<div class="mut" style="margin-bottom:8px">${esc(l.equipe || "sem equipe")} · ${esc(l.faixa_motivo)}${l.meses_casa == null ? "" : ` · ${l.meses_casa + 1}º mês de casa`}</div>
      ${l.bloqueio.length ? `<div class="aviso">${l.bloqueio.map(esc).join("<br>")}</div>` : ""}${itens}<div style="height:8px"></div>${bonus}
      <p style="text-align:right;margin:10px 0 0">Base ${brl(l.base)} + bônus ${brl(l.bonus_total)} ${l.ajuste ? `+ ajuste ${brl(l.ajuste)}` : ""} = <b style="font-size:16px">${brl(l.total)}</b></p>${form}`,
      `<button class="btn sec" id="fx">Fechar</button>${form ? `<button class="btn" id="sv">Salvar ajuste</button>` : ""}`);
    Object.assign(m.querySelector(".caixa").style, { width: "min(760px, 94vw)", maxWidth: "94vw" });
    m.querySelector("#fx").addEventListener("click", () => m.remove());
    m.querySelector("#sv")?.addEventListener("click", async () => {
      try {
        await api("/comissao/pessoa", { method: "PUT", body: { mes: j.mes, usuario_id: l.usuario_id, papel: l.papel, meta_bl: m.querySelector("#mb").value, meta_bl_pme: m.querySelector("#mp")?.value, meta_chip: m.querySelector("#mc")?.value ?? null, ajuste: m.querySelector("#aj").value, motivo: m.querySelector("#mo").value.trim(), pap_ok: m.querySelector("#pp").checked } });
        m.remove(); recarregar();
      } catch (e) { alert(e.message); }
    });
  }

  /* ---------- Plano do mês (gestor) ---------- */
  const PARAMS = [
    ["meta_bl", "Meta mínima de BL (por vendedor; supervisor = × HC)", "n"], ["meta_bl_pme", "Meta mínima de BL PME (por vendedor; supervisor = × HC)", "n"], ["meta_chip", "Meta de chips (migração ou portabilidade)", "n"],
    ["fpd_faixa", "FPD máximo para Faixa 2 (%)", "p"], ["fpd_inelegivel", "FPD a partir do qual não é elegível (%)", "p"],
    ["fpd_bonus_a", "FPD para o bônus (vendedor e supervisor) (%)", "p"], ["fpd_bonus_b", "FPD para o bônus menor do supervisor (%)", "p"],
    ["dcc_pct_lider", "% de DCC da equipe para o bônus do supervisor", "p"], ["bl_bonus_vendedor", "BL do vendedor que rende bônus ao supervisor", "n"],
    ["min_contratos_fpd", "Mínimo de BL com FPD apurado (bônus do vendedor)", "n"], ["meses_so_faixa1", "Meses de casa que só recebem Faixa 1", "n"],
  ];
  S.PAGES.plano = async (el) => {
    if (S.sessao.usuario.perfil !== "gestor") { el.innerHTML = `<div class="aviso erro">Somente o gerente ou o administrador edita o plano de premiação.</div>`; return; }
    const j = await api("/comissao/plano" + (est.mesPlano ? "?mes=" + est.mesPlano : ""));
    if (!est.mesPlano) { est.mesPlano = j.sugerido; return S.PAGES.plano(el); }
    est.mesPlano = j.mes;
    const go = () => S.PAGES.plano(el).catch(S.erroEm(el));
    const cab = `<div class="cab"><div><div class="migalha">Premiação</div><h1>Plano de ${esc(mesRot(j.mes))}</h1></div></div>`;
    const sel = `<div class="filtros">${seletorMes(j.meses, j.mes, [j.sugerido])}<div class="mut" style="padding-bottom:8px">O mês seguinte já vem sugerido. Metas e valores valem só para o mês escolhido.</div></div>`;
    const ligar = () => el.querySelector("#sm").addEventListener("change", (e) => { est.mesPlano = e.target.value; go(); });
    if (!j.existe) {
      const ant = j.meses.filter((m) => m.mes < j.mes)[0];
      el.innerHTML = `${cab}${sel}<div class="aviso">Este mês ainda não tem plano. ${ant ? `Vou copiar metas e valores de <b>${esc(mesRot(ant.mes))}</b>; depois é só ajustar.` : "Começa com os valores padrão vazios."}</div><button class="btn" id="cr">Criar plano de ${esc(mesRot(j.mes))}</button>`;
      ligar();
      el.querySelector("#cr").addEventListener("click", async () => { try { await api("/comissao/plano", { method: "POST", body: { mes: j.mes } }); go(); } catch (e) { alert(e.message); } });
      return;
    }
    const ed = j.editavel, p = j.plano, dis = ed ? "" : "disabled";
    const mt = await api("/comissao/metas?mes=" + j.mes).catch(() => ({ itens: [], editavel: false }));
    const ROT_CARGO = { VENDEDOR: "Vendedor", LIDER: "Supervisor", COORDENADOR: "Coordenador" };
    const campoMeta = (x, f) => { const off = !mt.editavel || (f === "meta_chip" && x.papel !== "VENDEDOR"), v = x[f] ?? "", ph = x.padrao[f] ?? ""; return `<td class="num"><input class="mini" type="number" min="0" max="10000" data-u="${x.usuario_id}" data-pp="${x.papel}" data-f="${f}" data-o="${v}" value="${v}" placeholder="${ph}" ${off ? "disabled" : ""}></td>`; };
    const individuais = painel("Metas individuais", `<div class="filtros" style="border:0;padding:0 0 8px"><div class="campo" style="width:260px"><label>Buscar pessoa ou equipe</label><input id="mbusca" placeholder="nome ou equipe"></div></div>
        <div class="tab"><table><thead><tr><th>Pessoa</th><th>Cargo</th><th>Equipe</th><th class="num">Meta BL</th><th class="num">Meta BL PME</th><th class="num">Meta chips</th></tr></thead><tbody id="mtb">${mt.itens.length ? mt.itens.map((x) => `<tr data-b="${esc((x.nome + " " + x.equipe).toLowerCase())}"><td><b>${esc(x.nome)}</b></td><td>${ROT_CARGO[x.papel]}</td><td class="mut">${esc(x.equipe || "–")}</td>${campoMeta(x, "meta_bl")}${campoMeta(x, "meta_bl_pme")}${campoMeta(x, "meta_chip")}</tr>`).join("") : `<tr><td colspan="6" class="mut">Nenhuma pessoa ativa encontrada.</td></tr>`}</tbody></table></div>
        ${mt.editavel ? `<div style="margin-top:8px"><button class="btn" id="svm">Salvar metas individuais</button></div>` : ""}`,
      "Vazio usa a meta do plano; o número em cinza dentro da caixa é a meta que vale hoje. Supervisor e coordenador: meta do plano × vendedores da equipe. A meta do coordenador fica registrada aqui; ele não tem premiação calculada.", `${mt.itens.length} pessoas`);
    const tabela = (papel, titulo, nota) => {
      const t = j.tabela[papel], itens = ORDEM.filter((i) => t[i]);
      const norm = itens.filter((i) => !i.startsWith("BONUS_")), bon = itens.filter((i) => i.startsWith("BONUS_"));
      const lin = (i, bonus) => `<tr><td>${esc(ROT[i])}</td>${bonus ? `<td class="mut num">–</td>` : `<td class="num"><input class="mini" type="number" step="0.01" min="0" data-p="${papel}" data-i="${i}" data-f="faixa1" value="${t[i].faixa1}" ${dis}></td>`}<td class="num"><input class="mini" type="number" step="0.01" min="0" data-p="${papel}" data-i="${i}" data-f="faixa2" value="${t[i].faixa2}" ${dis}></td></tr>`;
      return painel(titulo, `<div class="tab"><table><thead><tr><th>Item</th><th class="num">Faixa 1 (R$)</th><th class="num">Faixa 2 (R$)</th></tr></thead><tbody>${norm.map((i) => lin(i)).join("")}${bon.length ? `<tr><td colspan="3" class="mut"><b>Bônus</b> (valor único, na coluna Faixa 2)</td></tr>${bon.map((i) => lin(i, true)).join("")}` : ""}</tbody></table></div>`, nota);
    };
    el.innerHTML = `${cab}${sel}
      ${p.fechado ? `<div class="aviso">Plano fechado: nada pode ser alterado. <button class="btn sec pq" id="ro">Reabrir</button></div>` : ""}
      ${painel("Metas e regras do mês", `<label class="fx-sw" style="margin-bottom:10px"><input type="checkbox" data-par="pme_ativo" data-t="b" ${p.pme_ativo ? "checked" : ""} ${dis}><i></i>Contar e pagar BL PME (plano PME) à parte, com meta própria</label>
        <div class="grade-form">${PARAMS.map(([k, n, t]) => `<div class="campo"><label>${esc(n)}</label><input type="number" step="${t === "p" ? "0.1" : "1"}" min="0" data-par="${k}" data-t="${t}" value="${t === "p" ? +(p[k] * 100).toFixed(2) : p[k]}" ${dis}></div>`).join("")}</div>
        <div class="campo" style="margin-top:8px"><label>Observação</label><input data-par="observacao" data-t="s" maxlength="300" value="${esc(p.observacao || "")}" ${dis}></div>`, "Faixa 2 quando FPD ≤ limite; Faixa 1 acima disso. Com a chave do BL PME desligada, o BL PME conta como BL comum, como sempre foi.")}
      <div class="grade g2">${tabela("VENDEDOR", "Tabela do vendedor", "PLUS Bônus DCC vale por venda de banda larga com débito em conta.")}${tabela("LIDER", "Tabela do supervisor", "Bônus de FPD não somam: vale o maior que a equipe alcançar.")}</div>
      ${individuais}
      ${ed ? `<div style="display:flex;gap:8px;margin-top:6px"><button class="btn" id="sv">Salvar plano</button><button class="btn sec" id="fc">Fechar o mês</button></div>` : ""}`;
    ligar();
    el.querySelector("#ro")?.addEventListener("click", async () => { if (!confirm("Reabrir o mês? O resultado congelado é descartado e a premiação volta a ser recalculada com as vendas e o FPD de hoje.")) return; await api(`/comissao/plano/${j.mes}/reabrir`, { method: "POST" }); go(); });
    el.querySelector("#fc")?.addEventListener("click", async () => { if (confirm("Fechar o mês? O resultado de agora fica congelado (é o que vale para o pagamento) e ninguém consegue ajustar até você reabrir.")) { await api(`/comissao/plano/${j.mes}/fechar`, { method: "POST" }); go(); } });
    el.querySelector("#mbusca")?.addEventListener("input", (e) => { const q = e.target.value.trim().toLowerCase(); el.querySelectorAll("#mtb tr[data-b]").forEach((tr) => { tr.style.display = !q || tr.dataset.b.includes(q) ? "" : "none"; }); });
    el.querySelector("#svm")?.addEventListener("click", async () => {
      const linhas = new Map();   // só as pessoas cuja meta mudou; a linha vai inteira (as três metas)
      el.querySelectorAll("#mtb input[data-u]").forEach((i) => {
        const k = i.dataset.u + "|" + i.dataset.pp, x = linhas.get(k) || { usuario_id: +i.dataset.u, papel: i.dataset.pp, mudou: false };
        x[i.dataset.f] = i.value; if (i.value !== i.dataset.o) x.mudou = true; linhas.set(k, x);
      });
      const itens = [...linhas.values()].filter((x) => x.mudou).map(({ mudou, ...x }) => x);
      if (!itens.length) { alert("Nenhuma meta foi alterada."); return; }
      try { const r = await api("/comissao/metas", { method: "PUT", body: { mes: j.mes, itens } }); await go(); el.insertAdjacentHTML("afterbegin", `<div class="aviso">Metas individuais salvas (${r.gravadas} pessoa(s)).</div>`); } catch (e) { alert(e.message); }
    });
    el.querySelector("#sv")?.addEventListener("click", async () => {
      const parametros = {}, tabela = { VENDEDOR: {}, LIDER: {} };
      el.querySelectorAll("[data-par]").forEach((i) => { parametros[i.dataset.par] = i.dataset.t === "b" ? i.checked : i.dataset.t === "s" ? i.value : i.dataset.t === "p" ? Number(i.value) / 100 : Number(i.value); });
      el.querySelectorAll("[data-i]").forEach((i) => { (tabela[i.dataset.p][i.dataset.i] ||= { faixa1: 0, faixa2: 0 })[i.dataset.f] = Number(i.value); });
      try { await api("/comissao/plano/" + j.mes, { method: "PUT", body: { parametros, tabela } }); go(); el.insertAdjacentHTML("afterbegin", `<div class="aviso">Plano salvo.</div>`); } catch (e) { alert(e.message); }
    });
  };
})();
