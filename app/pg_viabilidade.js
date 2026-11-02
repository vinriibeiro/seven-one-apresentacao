"use strict";
/* Viabilidade (Operação / Minha área)
   Vendedor: pede a verificação (CEP + endereço), acompanha a resposta e conversa nas observações.
   Backoffice de Cadastro e gerente: fila por ordem de chegada, pega para análise, responde Atende / Não atende. */
(() => {
  const { esc, api, modal } = S;
  const ROT = { PENDENTE: "Aguardando", EM_ANALISE: "Em análise", ATENDE: "Atende", NAO_ATENDE: "Não atende", NAO_PEDIDO: "Só checagens" };
  const COR = { PENDENTE: "alerta", EM_ANALISE: "azul", ATENDE: "ok", NAO_ATENDE: "ruim", NAO_PEDIDO: "azul" };
  const pill = (s) => `<span class="vb-pill ${COR[s]}">${ROT[s] || esc(s)}</span>`;
  const cepFmt = (c) => (c ? String(c).replace(/^(\d{5})(\d{3})$/, "$1-$2") : "");
  const hora = (d) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const ha = (d) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(d)) / 6e4));
    return m < 1 ? "agora" : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.floor(m / 60)} h${m % 60 ? " " + (m % 60) + " min" : ""}` : `há ${Math.floor(m / 1440)} dia${m >= 2880 ? "s" : ""}`;
  };
  const ped = (v) => [v.checa_endereco && "Endereço", v.checa_credito && "Crédito", v.checa_linha && "Linha móvel", v.checa_biometria && "Biometria"].filter(Boolean).join(" + ");
  const pillPedido = (v) => (v.checa_endereco ? pill(v.status) : `<span class="vb-pill azul">Só checagens</span>`);
  const endereco = (v) => `${esc(v.logradouro)}${v.numero ? ", " + esc(v.numero) : ""}${v.complemento ? " · " + esc(v.complemento) : ""}`;
  const local = (v) => [cepFmt(v.cep), v.bairro, v.uf === "DF" ? "Brasília-DF" : v.cidade && v.uf ? `${v.cidade}/${v.uf}` : v.cidade].filter(Boolean).map(esc).join(" · ");
  const mapa = (v) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent([v.logradouro, v.numero, v.bairro, v.cidade, v.uf, cepFmt(v.cep)].filter(Boolean).join(", "));
  const ehVendedor = () => S.sessao.usuario.perfil === "vendedor";
  const responde = () => { const u = S.sessao.usuario; return u.perfil === "gestor" || (u.perfil === "backoffice" && u.setor !== "QUALIDADE"); };
  const ICO = {
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    som: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/>', mudo: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>', env: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  };
  const ico = (k, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k]}</svg>`;

  const dinheiro = (n) => Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cpfFmt = (c) => (c ? String(c).replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : "");
  const nascFmt = (d) => { if (!d) return ""; if (d instanceof Date) return d.toLocaleDateString("pt-BR"); const [a, m, dd] = String(d).slice(0, 10).split("-"); return `${dd}/${m}/${a}`; };
  const NOME_CHK = { CREDITO: "Crédito", LINHA: "Linha móvel", BIOMETRIA: "Link de biometria" };
  const pedidas = (v) => [v.checa_credito && "CREDITO", v.checa_linha && "LINHA", v.checa_biometria && "BIOMETRIA"].filter(Boolean);
  const stChk = (v, t) => (t === "CREDITO" ? v.credito_status : t === "LINHA" ? v.linha_status : v.biometria_status);
  // crédito usa Aprovado / Reprovado (e Oferta Single); a linha móvel segue Atende / Não atende; biometria é Link enviado / Não enviado
  const rotChk = (v, t) => {
    const st = stChk(v, t);
    if (t === "CREDITO") return st === "ATENDE" ? (v.credito_oferta_single ? "Aprovado (Oferta Single)" : "Aprovado") : st === "NAO_ATENDE" ? "Reprovado" : ROT[st];
    if (t === "BIOMETRIA") return st === "ATENDE" ? "Link enviado" : st === "NAO_ATENDE" ? "Não enviado" : ROT[st];
    return ROT[st];
  };
  const pillChk = (v, t) => `<span class="vb-pill ${COR[stChk(v, t)]}">${esc(rotChk(v, t))}</span>`;

  const est = { status: "ABERTAS", busca: "", vendedor: "", sel: null, pagina: 1 };

  /* ---------- conversa (observações) ---------- */
  function conversa(v) {
    const eu = S.sessao.usuario.id;
    const msgs = v.obs.map((o) => `<div class="vb-msg ${o.autor_id === eu ? "eu" : ""} ${o.autor_id === v.vendedor_id ? "vend" : "bo"}"><div class="vb-bolha">${esc(o.texto).replace(/\n/g, "<br>")}</div><small>${esc(o.autor_id === eu ? "Você" : o.autor)} · ${hora(o.em)}</small></div>`).join("");
    return `<div class="vb-conv">${msgs || `<p class="mut vb-vazio">Nenhuma observação ainda.</p>`}</div>
      <form class="vb-env" data-env="${v.id}"><textarea name="t" rows="2" maxlength="1000" placeholder="Escrever observação…" required></textarea><button class="btn" title="Enviar">${ico("env")}<span>Enviar</span></button></form>`;
  }
  function ligarConversa(box, v, depois) {
    box.querySelector("[data-env]")?.addEventListener("submit", async (e) => {
      e.preventDefault(); const t = e.target.t.value.trim(); if (!t) return;
      const b = e.target.querySelector("button"); b.disabled = true;
      try { await api(`/viabilidade/${v.id}/obs`, { method: "POST", body: { texto: t } }); depois(); } catch (er) { alert(er.message); b.disabled = false; }
    });
    const c = box.querySelector(".vb-conv"); if (c) c.scrollTop = c.scrollHeight;
  }

  /* ---------- formulário de pedido (vendedor): mesmo desenho do protótipo do app ("Pedir viabilidade") ---------- */
  function formNovo(depois) {
    const f1 = (rot, campo, extra = "") => `<div class="f">${rot}${campo}${extra}</div>`;
    const lb = (txt, nome, obr) => `<label for="vn-${nome}">${txt}${obr ? `<span class="obr" aria-hidden="true">*</span>` : ""}</label>`;
    const tile = (nome, txt) => `<label class="cx-l"><input type="checkbox" name="${nome}" id="${{ checa_endereco: "ce", checa_credito: "cc", checa_linha: "cl", checa_biometria: "cb" }[nome]}"><span class="cx" aria-hidden="true">✓</span>${txt}</label>`;
    const m = modal("Pedir viabilidade", `<form id="f" class="vb-form-app" autocomplete="off" novalidate>
      <div class="grupo"><h4>O que verificar? <small>marque uma ou mais</small></h4>
        <div class="checa">${tile("checa_endereco", "Endereço")}${tile("checa_credito", "Crédito")}${tile("checa_linha", "Linha móvel")}${tile("checa_biometria", "Link de biometria")}</div></div>
      <div class="grupo" id="se" hidden><h4>Endereço</h4>
        ${f1(lb("CEP", "cep", true), `<input id="vn-cep" name="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000">`, `<span class="ajuda" id="cs">Rua, bairro e cidade são preenchidos pelo CEP.</span>`)}
        ${f1(lb("Rua ou avenida", "logradouro", true), `<input id="vn-logradouro" name="logradouro" maxlength="200">`)}
        <div class="dois">${f1(lb("Número", "numero", true), `<input id="vn-numero" name="numero" maxlength="20" placeholder="ou S/N">`)}${f1(lb("Complemento", "complemento"), `<input id="vn-complemento" name="complemento" maxlength="100" placeholder="Casa, apto…">`)}</div>
        ${f1(lb("Bairro", "bairro"), `<input id="vn-bairro" name="bairro" maxlength="100">`)}
        <div class="dois uf">${f1(lb("Cidade", "cidade"), `<input id="vn-cidade" name="cidade" maxlength="100">`)}${f1(lb("UF", "uf"), `<input id="vn-uf" name="uf" maxlength="2">`)}</div>
        ${f1(lb("Ponto de referência", "referencia"), `<input id="vn-referencia" name="referencia" maxlength="200" placeholder="Ex.: ao lado do mercado">`)}</div>
      <div class="grupo" id="sc" hidden><h4>Crédito <small>dados do titular</small></h4>
        ${f1(lb("Nome completo", "cred_nome", true), `<input id="vn-cred_nome" name="cred_nome" maxlength="150" autocomplete="off">`)}
        ${f1(lb("CPF", "cred_cpf", true), `<input id="vn-cred_cpf" name="cred_cpf" inputmode="numeric" maxlength="14" placeholder="000.000.000-00">`)}
        ${f1(lb("Data de nascimento", "cred_nascimento", true), `<input id="vn-cred_nascimento" name="cred_nascimento" type="date">`)}
        ${f1(lb("Cidade", "cred_cidade"), `<input id="vn-cred_cidade" name="cred_cidade" maxlength="100">`)}</div>
      <div class="grupo" id="sl" hidden><h4>Linha móvel</h4>
        ${f1(lb("CPF", "linha_cpf", true), `<input id="vn-linha_cpf" name="linha_cpf" inputmode="numeric" maxlength="14" placeholder="000.000.000-00">`)}</div>
      <div class="grupo" id="sb" hidden><h4>Link de biometria <small>o backoffice envia o link para o WhatsApp do cliente</small></h4>
        ${f1(lb("Nome completo", "bio_nome", true), `<input id="vn-bio_nome" name="bio_nome" maxlength="150">`)}
        ${f1(lb("CPF", "bio_cpf", true), `<input id="vn-bio_cpf" name="bio_cpf" inputmode="numeric" maxlength="14" placeholder="000.000.000-00">`)}
        ${f1(lb("WhatsApp do cliente", "bio_contato", true), `<input id="vn-bio_contato" name="bio_contato" inputmode="tel" maxlength="40" placeholder="(61) 99999-9999">`, `<span class="ajuda">Com DDD.</span>`)}</div>
      <div class="grupo"><h4>Cliente <small>opcional</small></h4>
        <div class="dois">${f1(lb("Nome", "cliente_nome"), `<input id="vn-cliente_nome" name="cliente_nome" maxlength="150">`)}${f1(lb("Telefone", "cliente_contato"), `<input id="vn-cliente_contato" name="cliente_contato" inputmode="tel" maxlength="40">`)}</div></div>
      <div class="grupo"><h4>Para o backoffice <small>opcional</small></h4>
        ${f1(lb("Observação", "observacao"), `<textarea id="vn-observacao" name="observacao" maxlength="1000" placeholder="Algo que ajude na verificação"></textarea>`)}
        <div data-anx-novo class="anexar"></div></div>
      <div class="erro" id="e" role="alert"></div></form>`,
      `<button class="btn sec" type="button" id="x">Cancelar</button><button class="btn" type="button" id="s">Enviar para verificação</button><small class="rod-nota">Você recebe um aviso quando o backoffice responder.</small>`);
    m.querySelector(".caixa").classList.add("vb-modal", "vb-modal-app");
    const f = m.querySelector("#f"), cs = m.querySelector("#cs");
    const anexos = S.anexos?.seletor(m.querySelector("[data-anx-novo]"));
    // só o que foi escolhido aparece e é obrigatório (as regras são as mesmas de antes)
    const OBRIG = { se: ["cep", "logradouro", "numero"] };
    const mostra = () => {
      const e = f.checa_endereco.checked;
      m.querySelector("#se").hidden = !e;
      OBRIG.se.forEach((n) => (f[n].required = e));
      m.querySelector("#sc").hidden = !f.checa_credito.checked;
      m.querySelector("#sl").hidden = !f.checa_linha.checked;
      m.querySelector("#sb").hidden = !f.checa_biometria.checked;
      f.querySelectorAll(".checa input").forEach((c) => c.closest("label").classList.toggle("on", c.checked));
    };
    f.checa_endereco.addEventListener("change", () => { mostra(); if (f.checa_endereco.checked) f.cep.focus(); });
    f.checa_credito.addEventListener("change", mostra);
    f.checa_linha.addEventListener("change", mostra);
    f.checa_biometria.addEventListener("change", mostra);
    f.cep.addEventListener("input", async () => {
      let d = f.cep.value.replace(/\D/g, "").slice(0, 8);
      f.cep.value = d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
      if (d.length !== 8) return;
      cs.textContent = "Buscando endereço…";
      try {
        const e = await api("/cep/" + d);
        for (const k of ["logradouro", "bairro", "cidade", "uf"]) if (e[k] && !f[k].value) f[k].value = e[k];
        cs.textContent = e.logradouro ? "Endereço encontrado. Confira e informe o número." : "CEP da cidade inteira: preencha a rua.";
        (e.logradouro ? f.numero : f.logradouro).focus();
      } catch (er) { cs.textContent = er.message; f.logradouro.focus(); }
    });
    m.querySelector("#x").addEventListener("click", () => m.remove());
    m.querySelector("#s").addEventListener("click", async () => {
      if (!f.checa_endereco.checked && !f.checa_credito.checked && !f.checa_linha.checked && !f.checa_biometria.checked) { m.querySelector("#e").textContent = "Escolha ao menos uma checagem: endereço, crédito, linha móvel ou link de biometria."; return; }
      if (!f.reportValidity()) return;
      const b = m.querySelector("#s"); b.disabled = true;
      try {
        const r = await api("/viabilidade", { method: "POST", body: Object.fromEntries(new FormData(f)) });
        const falhas = await S.anexos.enviarVarios("VIABILIDADE", r.id, anexos.arquivos());
        m.remove(); depois(true);
        if (falhas.length) alert("Pedido enviado. Alguns arquivos não subiram, anexe de novo pelo detalhe:\n" + falhas.join("\n"));
        detalheVendedor(r.id, depois);
      }
      catch (e) { m.querySelector("#e").textContent = e.message; b.disabled = false; }
    });
  }

  /* ---------- tela do vendedor ---------- */
  async function telaVendedor(el) {
    const j = await api("/viabilidade?status=" + (est.status === "ABERTAS" ? "" : est.status));
    const c = j.contagem, novas = j.itens.filter((v) => v.respondido_em && !v.visto_vendedor_em).length;
    el.innerHTML = `${window.SEVEN_APP?.convite() || ""}<div class="cab"><div><h1>Viabilidade</h1><p class="sub">Peça a verificação do endereço aqui. O backoffice responde e você recebe o aviso.</p></div>
        <div class="acoes"><button class="btn vb-novo" id="nv">${ico("plus")} Nova consulta</button></div></div>
      <div class="vb-resumo">
        <div><b>${(c.PENDENTE || 0) + (c.EM_ANALISE || 0)}</b><span>aguardando</span></div><div class="ok"><b>${c.ATENDE || 0}</b><span>atende</span></div><div class="ruim"><b>${c.NAO_ATENDE || 0}</b><span>não atende</span></div>
        ${novas ? `<div class="novo"><b>${novas}</b><span>resposta${novas === 1 ? "" : "s"} nova${novas === 1 ? "" : "s"}</span></div>` : ""}</div>
      <div class="vb-cards">${j.itens.length ? j.itens.map((v) => {
        const nova = v.respondido_em && !v.visto_vendedor_em;
        return `<button class="vb-card ${nova ? "nova" : ""} st-${v.status}" data-id="${v.id}">
          <div class="vb-card-t">${pillPedido(v)}${nova ? `<span class="vb-nova">Nova resposta</span>` : ""}<span class="mut vb-quando">${v.respondido_em ? "respondida " + ha(v.respondido_em) : "enviada " + ha(v.criado_em)}</span></div>
          ${v.checa_endereco ? `<div class="vb-end">${ico("pin", 15)} ${endereco(v)}</div><div class="mut">${local(v)}${v.cliente_nome ? " · " + esc(v.cliente_nome) : ""}</div>` : `<div class="vb-end">${ico("pin", 15)} Só checagens: ${esc(ped(v))}</div>${v.cliente_nome ? `<div class="mut">${esc(v.cliente_nome)}</div>` : ""}`}
          ${v.ultima_obs && v.respondido_em ? `<div class="vb-resp">“${esc(v.ultima_obs.slice(0, 140))}${v.ultima_obs.length > 140 ? "…" : ""}”<small> — ${esc(v.respondido_por_nome || "backoffice")}</small></div>` : v.status === "EM_ANALISE" ? `<div class="vb-resp mut">${esc(v.em_analise_por_nome || "Backoffice")} está verificando…</div>` : ""}
          ${v.n_obs ? `<div class="vb-nobs">${v.n_obs} observaç${v.n_obs === 1 ? "ão" : "ões"}</div>` : ""}</button>`;
      }).join("") : `<div class="vb-vazio-g"><p>Você ainda não pediu nenhuma viabilidade.</p><button class="btn" id="nv2">${ico("plus")} Fazer a primeira consulta</button></div>`}</div>`;
    window.SEVEN_APP?.ligarConvite(el);
    const go = () => S.PAGES.viabilidade(el).catch(S.erroEm(el));
    const novo = () => formNovo(() => { go(); S.avisos?.atualizar(); });
    el.querySelector("#nv").addEventListener("click", novo);
    el.querySelector("#nv2")?.addEventListener("click", novo);
    el.querySelectorAll(".vb-card").forEach((b) => b.addEventListener("click", () => detalheVendedor(+b.dataset.id, go)));
  }
  async function detalheVendedor(id, depois) {
    const v = await api("/viabilidade/" + id);
    if (v.respondido_em && !v.visto_vendedor_em && !S.sessao.vercomo) { api(`/viabilidade/${id}/visto`, { method: "POST" }).then(() => S.avisos?.atualizar()).catch(() => {}); }
    const DEST = { CONEXAO: "Conexão", SOLAR: "Solar" };
    const faltam = pedidas(v).filter((t) => t !== "BIOMETRIA" && stChk(v, t) !== "ATENDE").map((t) => NOME_CHK[t]);
    const encaminhar = (!v.checa_endereco || v.status === "ATENDE") && !S.sessao.vercomo ? (v.encaminhado_para
        ? `<div class="vb-enc ok">Venda encaminhada para <b>${DEST[v.encaminhado_para]}</b> em ${hora(v.encaminhado_em)}.</div>`
        : faltam.length
          ? `<div class="vb-enc"><b>Encaminhar a venda</b><span class="mut">Aguardando a aprovação de: ${faltam.join(" e ")}.</span></div>`
          : `<div class="vb-enc"><b>Encaminhar a venda</b><span class="mut">Escolha para onde ela vai.</span><div class="vb-bts"><button class="btn" data-enc="CONEXAO">Conexão</button><button class="btn sec" data-enc="SOLAR">Solar</button></div></div>`) : "";
    const chkVend = pedidas(v).map((t) => {
      const st = stChk(v, t), lim = t === "LINHA" && st === "ATENDE" && v.linha_limite != null ? ` · limite liberado R$ ${dinheiro(v.linha_limite)}` : "";
      const link = t === "BIOMETRIA" && st === "ATENDE" && v.biometria_link ? ` · <a href="${esc(v.biometria_link)}" target="_blank" rel="noopener">abrir link</a>` : "";
      return `<div class="vb-chk-l"><b>${NOME_CHK[t]}</b> ${pillChk(v, t)}<span class="mut">${st === "PENDENTE" ? "aguardando o backoffice" : esc(lim) + link}</span></div>`;
    }).join("");
    // contestação: só depois de "Não atende", em até 7 dias da resposta, quantas vezes quiser
    const dias7 = v.respondido_em && Date.now() - new Date(v.respondido_em) < 7 * 864e5;
    const contestar = v.checa_endereco && v.status === "NAO_ATENDE" && dias7 && !S.sessao.vercomo
      ? `<div class="vb-enc"><b>Contestar esta resposta</b><span class="mut">Se a viabilidade estiver correta, escreva o motivo: o pedido volta para o backoffice. Prazo até ${hora(new Date(new Date(v.respondido_em).getTime() + 7 * 864e5))}.</span>
          <textarea id="cont" rows="2" maxlength="1000" placeholder="Ex.: o cliente mostrou a conta de luz no endereço; o vizinho do lado tem Claro"></textarea>
          <div class="vb-bts"><button class="btn" id="contbt">Contestar e voltar para o backoffice</button></div></div>`
      : "";
    const m = modal(`Viabilidade nº ${v.id}`, `<div class="vb-det">
      <div class="vb-det-t">${pillPedido(v)}<span class="mut">enviada em ${hora(v.criado_em)}</span></div>
      ${v.checa_endereco && (v.status === "ATENDE" || v.status === "NAO_ATENDE") ? `<div class="vb-veredito ${COR[v.status]}"><b>${v.status === "ATENDE" ? "Atende! Pode seguir com a venda." : "Não atende neste endereço."}</b><span>Respondida por ${esc(v.respondido_por_nome || "backoffice")} em ${hora(v.respondido_em)}</span></div>` : ""}
      ${v.hp ? `<div class="vb-hp-info">HP: <b>${esc(v.hp)}</b></div>` : ""}
      ${chkVend ? `<div class="vb-chks"><span class="mut">Checagens pedidas</span>${chkVend}</div>` : ""}
      ${encaminhar}
      ${contestar}
      ${v.checa_endereco ? `<div class="vb-end">${ico("pin", 15)} ${endereco(v)}</div><div class="mut">${local(v)}${v.referencia ? " · ref.: " + esc(v.referencia) : ""}</div>` : `<div class="mut">Sem endereço neste pedido (só checagens).</div>`}
      ${v.cliente_nome || v.cliente_contato ? `<div class="mut">Cliente: ${esc([v.cliente_nome, v.cliente_contato].filter(Boolean).join(" · "))}</div>` : ""}
      <h3 class="vb-h3">Observações</h3>${conversa(v)}</div>`, `<button class="btn sec" id="x">Fechar</button>`);
    m.querySelector(".caixa").classList.add("vb-modal");
    const fechar = () => { m.remove(); depois(); };
    m.querySelector(".vb-det")?.insertAdjacentHTML("beforeend", '<div data-anx></div>');
    S.anexos?.montar(m.querySelector("[data-anx]"), "VIABILIDADE", v.id, { enviar: true, remover: S.sessao.usuario.perfil === "gestor" });
    m.querySelector("#x").addEventListener("click", fechar);
    m.querySelectorAll("[data-enc]").forEach((b) => b.addEventListener("click", async () => {
      const nome = DEST[b.dataset.enc];
      if (!confirm(`Encaminhar esta venda para ${nome}? Depois de enviada não dá para mudar.`)) return;
      m.querySelectorAll("[data-enc]").forEach((x) => (x.disabled = true));
      try { await api(`/viabilidade/${v.id}/encaminhar`, { method: "POST", body: { destino: b.dataset.enc } }); m.remove(); detalheVendedor(id, depois); }
      catch (e) { alert(e.message); m.querySelectorAll("[data-enc]").forEach((x) => (x.disabled = false)); }
    }));
    m.querySelector("#contbt")?.addEventListener("click", async () => {
      const t = m.querySelector("#cont").value.trim();
      if (t.length < 3) { alert("Escreva o motivo da contestação."); return; }
      const b = m.querySelector("#contbt"); b.disabled = true;
      try { await api(`/viabilidade/${v.id}/contestar`, { method: "POST", body: { texto: t } }); m.remove(); detalheVendedor(id, depois); }
      catch (e) { alert(e.message); b.disabled = false; }
    });
    ligarConversa(m, v, () => { m.remove(); detalheVendedor(id, depois); });
  }

  /* ---------- tela do backoffice ---------- */
  /* ---------- fila do backoffice: mesmo desenho do protótipo aprovado (design/prototipos/direcao-a.html, telaViabilidade) ---------- */
  const REF_MIN = 30;   // tempo de referência para começar a análise (o mesmo destaque de antes: passou de 30 min, fica em vermelho)
  const idade = (d) => { const m = Math.max(0, Math.round((Date.now() - new Date(d)) / 6e4)); return m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `há ${Math.floor(m / 1440)} d`; };
  const ST_FILA = { PENDENTE: ["neutro", "Aguardando"], EM_ANALISE: ["pend", "Em análise"], ATENDE: ["ok", "Atende"], NAO_ATENDE: ["canc", "Não atende"], NAO_PEDIDO: ["pend", "Só checagens"] };
  const stFila = (v) => { const s = v.checa_endereco ? ST_FILA[v.status] || ["neutro", v.status] : ST_FILA.NAO_PEDIDO; return `<span class="st ${s[0]}">${s[1]}${v.status === "EM_ANALISE" && v.em_analise_por_nome ? " · " + esc(v.em_analise_por_nome.split(" ")[0]) : ""}</span>`; };
  const checas = (v) => [v.checa_endereco && "Endereço", v.checa_credito && "Crédito", v.checa_linha && "Linha móvel", v.checa_biometria && "Biometria"].filter(Boolean);
  async function telaBackoffice(el) {
    const q = new URLSearchParams({ status: est.status === "TODAS" ? "" : est.status, busca: est.busca, vendedor: est.vendedor, pagina: est.pagina });
    if (est.hoje) q.set("respondido", "hoje");
    const j = await api("/viabilidade?" + q);
    const c = j.contagem, som = S.avisos?.somLigado();
    const paginas = Math.max(1, Math.ceil(j.total / 50));
    if (est.sel && !j.itens.some((v) => v.id === est.sel)) est.sel = null;
    if (!est.sel && j.itens[0] && window.innerWidth > 1000) est.sel = j.itens[0].id;
    const fila = (c.PENDENTE || 0) + (c.EM_ANALISE || 0);
    const filtros = [["ABERTAS", "Na fila", fila, false], ["ATENDE", "Atende hoje", c.ATENDE_HOJE, true], ["NAO_ATENDE", "Não atende hoje", c.NAO_ATENDE_HOJE, true], ["TODAS", "Todos", null, false]];
    const on = (k, h) => est.status === k && !!est.hoje === h;
    el.innerHTML = `<div class="tela-viab"><div class="cab"><div><h1>Viabilidade</h1>
        <div class="linha"><span>Pedidos dos vendedores · <b>mais antigos primeiro</b></span><span>Tempo de referência <b>${REF_MIN} min</b> para começar a análise</span>${c.RESPONDIDAS_HOJE != null ? `<span>Hoje: <b>${c.RESPONDIDAS_HOJE} ${c.RESPONDIDAS_HOJE === 1 ? "respondido" : "respondidos"}</b> (${c.ATENDE_HOJE || 0} atende, ${c.NAO_ATENDE_HOJE || 0} não atende)</span>` : ""}</div></div>
        <div class="acoes"><button class="btn leve" id="sm" title="Som e aviso quando chega pedido novo">${ico(som ? "som" : "mudo")} Aviso sonoro ${som ? "ligado" : "desligado"}</button>${"Notification" in window && Notification.permission === "default" ? `<button class="btn leve" id="nt">Avisar com o navegador minimizado</button>` : ""}</div></div>
      <div class="filtros">
        <div class="seg" id="fs" role="group" aria-label="Situação">${filtros.map(([k, n, ct, h]) => `<button type="button" data-s="${k}" data-h="${h ? 1 : ""}" class="${on(k, h) ? "on" : ""}" aria-pressed="${on(k, h)}">${n}${ct != null ? ` <span class="n">${ct}</span>` : ""}</button>`).join("")}</div>
        <div class="campo vb-f-busca"><label for="fb">Buscar</label><input id="fb" type="search" value="${esc(est.busca)}" placeholder="Rua, bairro, CEP, cliente ou vendedor"></div>
        <div class="campo vb-f-vend"><label for="fv">Vendedor</label><select id="fv"><option value="">Todos</option>${j.vendedores.map((x) => `<option value="${x.id}" ${String(x.id) === String(est.vendedor) ? "selected" : ""}>${esc(x.nome)}</option>`).join("")}</select></div></div>
      <div class="fila"><div class="fila-lista" role="listbox" aria-label="Pedidos">${j.itens.length ? j.itens.map((v) => `<button type="button" class="fila-item ${v.id === est.sel ? "on" : ""}" data-id="${v.id}" role="option" aria-selected="${v.id === est.sel}">
          <span class="l1">${v.respondido_em ? `<span class="idade">${hora(v.respondido_em)}</span>` : `<span class="idade ${v.status === "PENDENTE" && Date.now() - new Date(v.criado_em) > REF_MIN * 6e4 ? "fora" : ""}">${idade(v.criado_em)}</span>`}${stFila(v)}${v.contestado && !v.respondido_em ? `<span class="marca-cont" title="O vendedor contestou um “Não atende” e o pedido voltou para a fila">contestado</span>` : ""}<span class="mono">nº ${v.id}</span></span>
          ${v.checa_endereco ? `<span class="end">${endereco(v)}</span><span class="onde">${esc(local(v))}</span>` : `<span class="end">Sem endereço · só checagens</span>`}
          <span class="quem">${esc(v.vendedor_nome)}${v.vendedor_equipe ? ` · ${esc(S.titulo(v.vendedor_equipe))}` : ""}${v.n_obs ? ` · ${v.n_obs} ${v.n_obs === 1 ? "observação" : "observações"}` : ""}</span>
          <span class="checas">${checas(v).map((x) => `<span>${x}</span>`).join("")}</span></button>`).join("")
        : `<p class="fila-vazia">${est.status === "ABERTAS" ? "Fila vazia. Nenhum pedido aguardando." : "Nada encontrado."}</p>`}
        <div class="fila-rodape">${est.status === "ABERTAS" && !est.hoje ? `Mostrando ${j.itens.length} de ${fila} na fila (${c.PENDENTE || 0} aguardando, ${c.EM_ANALISE || 0} em análise)` : `Mostrando ${j.itens.length} de ${j.total}`}
          ${paginas > 1 ? `<span class="pag"><button type="button" id="pa" ${est.pagina <= 1 ? "disabled" : ""} aria-label="Página anterior">‹</button><span>${est.pagina}/${paginas}</span><button type="button" id="pp" ${est.pagina >= paginas ? "disabled" : ""} aria-label="Próxima página">›</button></span>` : ""}</div></div>
        <div class="fila-det" id="dp">${est.sel ? `<p class="mut">Carregando…</p>` : `<p class="fila-vazia">Escolha um pedido na lista.</p>`}</div></div></div>`;
    const go = () => S.PAGES.viabilidade(el).catch(S.erroEm(el));
    el.querySelector("#sm").addEventListener("click", () => { S.avisos?.alternarSom(); go(); });
    el.querySelector("#nt")?.addEventListener("click", async () => { await S.avisos?.pedirNotificacao(); go(); });
    el.querySelector("#fs").addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (b) { est.status = b.dataset.s; est.hoje = !!b.dataset.h; est.pagina = 1; est.sel = null; go(); } });
    el.querySelector("#fb").addEventListener("keydown", (e) => { if (e.key === "Enter") { est.busca = e.target.value.trim(); est.pagina = 1; go(); } });
    el.querySelector("#fb").addEventListener("search", (e) => { if (!e.target.value && est.busca) { est.busca = ""; est.pagina = 1; go(); } });
    el.querySelector("#fv").addEventListener("change", (e) => { est.vendedor = e.target.value; est.pagina = 1; go(); });
    el.querySelector("#pa")?.addEventListener("click", () => { est.pagina--; go(); });
    el.querySelector("#pp")?.addEventListener("click", () => { est.pagina++; go(); });
    const dp = el.querySelector("#dp");
    const abrir = (id) => { est.sel = id; el.querySelectorAll(".fila-item").forEach((b) => { b.classList.toggle("on", +b.dataset.id === id); b.setAttribute("aria-selected", String(+b.dataset.id === id)); }); detalheBackoffice(dp, id, go); if (window.innerWidth <= 1000) dp.scrollIntoView({ behavior: "smooth" }); };
    el.querySelectorAll(".fila-item").forEach((b) => b.addEventListener("click", () => abrir(+b.dataset.id)));
    if (est.sel) detalheBackoffice(dp, est.sel, go);
    // chegou pedido novo enquanto a tela está aberta: atualiza a fila sozinha
    const ouvinte = () => { if (!el.isConnected) return document.removeEventListener("seven-aviso", ouvinte); go(); };
    document.addEventListener("seven-aviso", ouvinte, { once: true });
  }
  /** Dados de uma checagem, no formato de lista do protótipo. */
  const dados = (pares) => `<dl class="dados">${pares.filter(([, x]) => x).map(([k, x]) => `<div><dt>${esc(k)}</dt><dd>${x}</dd></div>`).join("")}</dl>`;
  function blocoChecagensBO(v) {
    return pedidas(v).map((t) => {
      const st = stChk(v, t), cred = t === "CREDITO", bio = t === "BIOMETRIA";
      const zap = (v.bio_contato || "").replace(/\D/g, "");
      const lista = cred
        ? dados([["Nome completo", esc(v.cred_nome || "")], ["CPF", `<span class="mono">${esc(cpfFmt(v.cred_cpf))}</span>`], ["Nascimento", esc(nascFmt(v.cred_nascimento))], ["Cidade", esc(v.cred_cidade || "")]])
        : bio
          ? dados([["Nome", esc(v.bio_nome || "")], ["CPF", `<span class="mono">${esc(cpfFmt(v.bio_cpf))}</span>`], ["WhatsApp", `${esc(v.bio_contato || "")}${zap.length >= 10 ? ` · <a href="https://wa.me/55${zap.replace(/^55/, "")}" target="_blank" rel="noopener">abrir conversa</a>` : ""}`]])
          : dados([["CPF", `<span class="mono">${esc(cpfFmt(v.linha_cpf))}</span>`]]);
      return `<div class="bloco" data-tipo="${t}">
        <h3><span>${cred ? "Checagem de crédito" : bio ? "Link de biometria" : "Checagem de linha móvel"}</span><small>${st !== "PENDENTE" ? `${pillChk(v, t)} por ${esc(v.respondido_por_nome || "")}` : v.checa_endereco ? "pedida junto com o endereço" : "pedida sem endereço"}</small></h3>
        ${lista}
        <div class="resposta">${t === "LINHA" ? `<div class="campo"><label>Limite liberado (R$) <span class="ajuda">obrigatório para atender</span></label><input data-lim inputmode="decimal" placeholder="0,00" value="${st === "ATENDE" ? esc(dinheiro(v.linha_limite)) : ""}"></div>`
          : bio ? `<div class="campo"><label>Link enviado <span class="ajuda">opcional, para o vendedor repassar</span></label><input data-link type="url" maxlength="500" placeholder="https://…" value="${esc(v.biometria_link || "")}"></div>` : ""}
          <div class="campo${t === "LINHA" || bio ? "" : " largo"}"><label>Resposta para o vendedor <span class="ajuda">obrigatória se não ${bio ? "enviar" : "atender"}</span></label><textarea data-res rows="2" maxlength="1000" placeholder="${cred ? "Motivo" : "Motivo ou observação"}"></textarea></div></div>
        <div class="botoes">${cred ? `<button class="btn sim" data-cst="ATENDE">✓ Aprovado</button><button class="btn sim" data-cst="SINGLE">✓ Aprovado (Oferta Single)</button><button class="btn nao" data-cst="NAO_ATENDE">✕ Reprovado</button>` : bio ? `<button class="btn sim" data-cst="ATENDE">✓ Link enviado</button><button class="btn nao" data-cst="NAO_ATENDE">✕ Não foi possível</button>` : `<button class="btn sim" data-cst="ATENDE">✓ Atende</button><button class="btn nao" data-cst="NAO_ATENDE">✕ Não atende</button>`}${st !== "PENDENTE" ? `<button class="btn leve pq" data-cst="PENDENTE">Reabrir</button>` : ""}</div></div>`;
    }).join("");
  }
  async function detalheBackoffice(box, id, recarregar) {
    const v = await api("/viabilidade/" + id);
    const eu = S.sessao.usuario.id, aberta = v.checa_endereco && (v.status === "PENDENTE" || v.status === "EM_ANALISE");
    const comOutro = v.status === "EM_ANALISE" && v.em_analise_por && v.em_analise_por !== eu;
    const podeResp = !S.sessao.vercomo && responde();
    const pedida = new Date(v.criado_em).toTimeString().slice(0, 5);
    const titulo = v.checa_endereco ? endereco(v) : `Só checagens: ${esc(ped(v))}`;
    const botoesCab = [podeResp && aberta && v.status === "PENDENTE" ? `<button class="btn" data-st="EM_ANALISE">Pegar para análise</button>` : "",
      podeResp && aberta && v.status === "EM_ANALISE" && !comOutro ? `<button class="btn sec" data-st="PENDENTE">Devolver para a fila</button>` : "",
      v.checa_endereco ? `<a class="btn leve" href="${esc(mapa(v))}" target="_blank" rel="noopener">Ver no mapa ↗</a>` : ""].join("");
    const situacao = v.checa_endereco && !aberta ? `<span class="st ${(ST_FILA[v.status] || ["neutro"])[0]}">${ROT[v.status]}</span>` : v.checa_endereco ? `<span class="st ${(ST_FILA[v.status] || ["neutro"])[0]}">${ROT[v.status]} ${idade(v.criado_em)}</span>` : "";
    const resposta = !v.checa_endereco ? "" : aberta
      ? `<div class="bloco"><h3><span>Resposta do endereço</span><small>vale para a venda inteira</small></h3>
          ${podeResp ? `<div class="resposta"><div class="campo"><label for="hpa">HP <span class="ajuda">obrigatório para atender</span></label><input id="hpa" inputmode="numeric" maxlength="20" pattern="[0-9]*" placeholder="Somente números" value="${esc(v.hp || "")}"></div>
            <div class="campo"><label for="rp">Resposta para o vendedor <span class="ajuda">obrigatória se não atender</span></label><textarea id="rp" rows="2" maxlength="1000" placeholder="Ex.: endereço fora da área de cobertura"></textarea></div></div>
          <div class="botoes"><button class="btn sim" data-st="ATENDE">✓ Atende</button><button class="btn nao" data-st="NAO_ATENDE">✕ Não atende</button>
            <span class="det">${v.status === "PENDENTE" ? "Ninguém pegou este pedido ainda: ao pegar, os outros veem que ele está com você." : comOutro ? `Com ${esc(v.em_analise_por_nome)} em análise.` : "Este pedido está com você."}</span></div>` : `<p class="det">${v.status === "EM_ANALISE" ? `Em análise com ${esc(v.em_analise_por_nome || "")}.` : "Aguardando o backoffice de Cadastro."}</p>`}</div>`
      : `<div class="bloco"><h3><span>Resposta do endereço</span><small>vale para a venda inteira</small></h3>
          <div class="veredito ${COR[v.status]}"><b>${ROT[v.status]}</b><span>por ${esc(v.respondido_por_nome || "")} em ${hora(v.respondido_em)}${v.visto_vendedor_em ? " · vendedor já viu" : " · vendedor ainda não viu"}</span></div>
          ${dados([["HP", v.hp ? `<span class="mono">${esc(v.hp)}</span>` : ""], ["Encaminhada", v.encaminhado_para ? `para ${v.encaminhado_para === "CONEXAO" ? "Conexão" : "Solar"} em ${hora(v.encaminhado_em)}` : ""]])}
          ${podeResp ? `<div class="botoes"><button class="btn leve pq" data-st="PENDENTE">Reabrir pedido</button></div>` : ""}</div>`;
    box.innerHTML = `<div class="vb-det">
      <div class="det-cab"><div><h2>${titulo}</h2>
        <div class="linha">Viabilidade <span class="mono">nº ${v.id}</span> · pedida às <b>${pedida}</b> por <b>${esc(v.vendedor_nome)}</b>${v.vendedor_equipe ? ` (${esc(S.titulo(v.vendedor_equipe))})` : ""}${situacao ? " · " + situacao : ""}</div></div>
        ${botoesCab ? `<div class="botoes">${botoesCab}</div>` : ""}</div>
      ${v.checa_endereco ? `<div class="bloco"><h3>Endereço</h3>${dados([["Logradouro", endereco(v)], ["Bairro", esc(v.bairro || "")], ["Cidade", esc(v.uf === "DF" ? "Brasília/DF" : [v.cidade, v.uf].filter(Boolean).join("/"))], ["CEP", v.cep ? `<span class="mono">${esc(cepFmt(v.cep))}</span>` : ""],
        ["Ponto de referência", esc(v.referencia || "")], ["Cliente", esc(v.cliente_nome || "")], ["Telefone", v.cliente_contato ? `<span class="mono">${esc(v.cliente_contato)}</span>` : ""]])}</div>` : ""}
      ${resposta}
      ${podeResp ? blocoChecagensBO(v) : ""}
      <div class="bloco"><h3><span>Conversa com o vendedor</span><small>${v.obs.length} ${v.obs.length === 1 ? "observação" : "observações"}</small></h3>${conversa(v)}<div data-anx></div></div></div>`;
    box.querySelectorAll("[data-cst]").forEach((b) => b.addEventListener("click", async () => {
      const bl = b.closest("[data-tipo]"), tipo = bl.dataset.tipo, cst = b.dataset.cst, st = cst === "SINGLE" ? "ATENDE" : cst, oferta = cst === "SINGLE";
      const resposta = bl.querySelector("[data-res]").value.trim(), limite = bl.querySelector("[data-lim]")?.value.trim() || "", link = bl.querySelector("[data-link]")?.value.trim() || "";
      if (st === "ATENDE" && tipo === "LINHA" && !(Number(limite.replace(/\./g, "").replace(",", ".")) > 0)) { alert("Informe o limite liberado em R$ antes de marcar Atende na linha móvel."); bl.querySelector("[data-lim]").focus(); return; }
      if (st === "NAO_ATENDE" && !resposta) { alert(tipo === "BIOMETRIA" ? "Explique por que o link não foi enviado (o vendedor vai ler)." : "Explique por que não atende (o vendedor vai ler)."); bl.querySelector("[data-res]").focus(); return; }
      if (st === "PENDENTE" && !confirm(`Reabrir a checagem de ${NOME_CHK[tipo]}?`)) return;
      b.disabled = true;
      try { await api(`/viabilidade/${v.id}/checagem/${tipo}`, { method: "PATCH", body: { status: st, resposta, limite, oferta_single: oferta, link } }); S.avisos?.atualizar(); recarregar(); }
      catch (e) { alert(e.message); b.disabled = false; }
    }));
    box.querySelectorAll("[data-st]").forEach((b) => b.addEventListener("click", async () => {
      const st = b.dataset.st, resposta = box.querySelector("#rp")?.value.trim() || "", hp = box.querySelector("#hpa")?.value.trim() || "";
      if (st === "ATENDE" && !/^[0-9]{1,20}$/.test(hp)) { alert("Preencha o HP (só números) antes de marcar Atende."); box.querySelector("#hpa")?.focus(); return; }
      if (st === "PENDENTE" && !aberta && !confirm("Reabrir este pedido? A resposta anterior continua nas observações.")) return;
      b.disabled = true;
      try { await api("/viabilidade/" + v.id, { method: "PATCH", body: { status: st, resposta, hp } }); S.avisos?.atualizar(); recarregar(); }
      catch (e) { alert(e.message); b.disabled = false; }
    }));
    S.anexos?.montar(box.querySelector("[data-anx]"), "VIABILIDADE", v.id, { enviar: true, remover: S.sessao.usuario.perfil === "gestor" });
    ligarConversa(box, v, () => detalheBackoffice(box, id, recarregar));
  }

  // #/viabilidade/novo (o "+" do app) abre direto o formulário de pedido; o endereço volta para #/viabilidade
  S.PAGES.viabilidade = async (el, arg) => {
    if (!ehVendedor()) return telaBackoffice(el);
    await telaVendedor(el);
    if (arg === "novo" && !S.sessao.vercomo) { try { history.replaceState(null, "", location.href.replace(/#.*$/, "") + "#/viabilidade"); } catch {} el.querySelector("#nv")?.click(); }
  };
})();
