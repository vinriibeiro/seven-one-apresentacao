"use strict";
/* Meu perfil: foto, dados da conta e histórico de alterações (quem editou o quê) */
(() => {
  const { esc, nf, tabela, api } = S;
  const gestor = () => S.sessao.usuario.perfil === "gestor";
  const est = { aba: "perfil", pagina: 1, usuario: "", tabela: "", acao: "", de: "", ate: "" };
  const hora = (s) => new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const ACAO = { INSERT: "criou", UPDATE: "alterou", DELETE: "apagou" };
  const EVENTO = { CRIADA: "Acesso criado", PERFIL_ALTERADO: "Perfil alterado", DESATIVADA: "Acesso desativado", REATIVADA: "Acesso reativado", SENHA_REDEFINIDA: "Senha redefinida", SENHA_TROCADA: "Senha trocada", LOGIN_OK: "Entrou", LOGIN_FALHOU: "Senha errada", BLOQUEADA: "Conta bloqueada", SESSOES_ENCERRADAS: "Saiu de todos os aparelhos", SENHA_SOLICITADA: "Pediu nova senha", EXPORTACAO: "Exportou dados" };
  const TABELAS = { contrato: "Vendas", cliente: "Clientes", contrato_item: "Produtos da venda", agenda_instalacao: "Rota", usuario: "Usuários", equipe_membro: "Equipes" };

  S.PAGES.perfil = async (el) => {
    const p = S.perfil || (S.perfil = await api("/perfil"));
    try { if (localStorage.getItem("seven_2fa_aba") === "seguranca") { est.aba = "seguranca"; localStorage.removeItem("seven_2fa_aba"); } } catch {}
    const abas = [["perfil", "Meu perfil"], ["seguranca", "Segurança"], ["atividade", gestor() ? "Quem alterou o quê" : "Minhas alterações"], ...(gestor() ? [["acessos", "Acessos ao sistema"]] : [])];
    el.innerHTML = `<div class="cab" data-sem-exp><div><div class="migalha">Conta</div><h1>${esc(p.nome_completo)}</h1></div></div>
      <div class="abas">${abas.map(([k, n]) => `<button data-a="${k}" class="${est.aba === k ? "on" : ""}">${esc(n)}</button>`).join("")}</div><div id="ab"></div>`;
    el.querySelector(".abas").addEventListener("click", (e) => { const a = e.target.dataset.a; if (a) { est.aba = a; S.PAGES.perfil(el).catch(S.erroEm(el)); } });
    const ab = el.querySelector("#ab");
    if (est.aba === "perfil") aba_perfil(ab, p);
    else if (est.aba === "seguranca") await aba_seguranca(ab);
    else if (est.aba === "atividade") await aba_atividade(ab);
    else await aba_acessos(ab);
  };

  /* Verificação em dois fatores (opcional): ligar, ver os códigos de reserva e desligar. Quem liga fica conectado até 8 h sem uso (sem 2FA: 2 h). */
  async function aba_seguranca(ab) {
    const e = await api("/auth/2fa/estado?nocache=1");
    const caixa = (corpo) => { ab.innerHTML = `<section class="painel"><h2><span>Verificação em dois fatores</span></h2><div class="corpo">${corpo}</div></section>`; };
    const refaz = () => aba_seguranca(ab).catch(S.erroEm(ab));
    const trocouToken = (j, ligado) => { const av = document.getElementById("aviso2fa"); if (ligado && av) av.innerHTML = ""; return S.salvar({ ...S.sessao, token: j.token, usuario: { ...S.sessao.usuario, dois_fatores: ligado } }); };
    const aviso = (t) => `<div class="aviso erro" id="e2" role="alert" style="display:none"></div>`;
    const falha = (m) => { const x = ab.querySelector("#e2"); x.textContent = m; x.style.display = ""; };
    if (!e.disponivel) return caixa(`<p class="mut">Ainda não está disponível neste sistema. Peça ao administrador para ativar.</p>`);
    if (e.ativo) {
      caixa(`<p><span class="tag ok">Ligada</span> Ao entrar, além da senha, você digita o código do aplicativo autenticador. Você fica conectado por até <b>8 horas</b> sem uso.</p>
        <p class="mut">Códigos de reserva que ainda valem: <b>${e.reservas}</b>. Cada um serve uma única vez, se você perder o celular.</p>
        <details style="margin-top:12px"><summary class="btn sec pq" style="display:inline-block;cursor:pointer">Desligar a verificação</summary>
          <form id="fd" style="margin-top:10px;max-width:360px">${aviso()}<div class="campo"><label>Sua senha</label><input type="password" name="senha" autocomplete="current-password" required></div>
          <div class="campo"><label>Código do aplicativo (ou de reserva)</label><input name="codigo" autocomplete="one-time-code" maxlength="12" required></div>
          <button class="btn perigo" type="submit">Desligar</button></form></details>`);
      ab.querySelector("#fd").addEventListener("submit", async (ev) => {
        ev.preventDefault(); const f = ev.target;
        try { const j = await api("/auth/2fa/desativar", { method: "POST", body: { senha: f.senha.value, codigo: f.codigo.value } }); trocouToken(j, false); refaz(); }
        catch (err) { falha(err.message); }
      });
      return;
    }
    caixa(`<p><span class="tag">Desligada</span> A verificação em dois fatores pede, além da senha, um código de 6 dígitos que muda a cada 30 segundos no seu celular. Mesmo que alguém descubra a sua senha, não consegue entrar.</p>
      <ul class="mut" style="margin:8px 0 12px 18px"><li>É opcional, mas recomendada${e.avisado ? " para o seu perfil" : ""}.</li><li>Com ela ligada, você fica conectado por até <b>8 horas</b> sem uso (sem ela, 2 horas).</li><li>Você precisa de um aplicativo autenticador no celular (Google Authenticator, Microsoft Authenticator ou similar).</li></ul>
      <form id="f1" style="max-width:360px">${aviso()}<div class="campo"><label>Sua senha, para começar</label><input type="password" name="senha" autocomplete="current-password" required></div>
      <button class="btn" type="submit">Ligar a verificação</button></form>`);
    ab.querySelector("#f1").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      let j;
      try { j = await api("/auth/2fa/iniciar", { method: "POST", body: { senha: ev.target.senha.value } }); } catch (err) { return falha(err.message); }
      const chave = j.segredo.match(/.{1,4}/g).join(" ");
      caixa(`<p><b>1.</b> No celular, abra o aplicativo autenticador e adicione uma conta pela <b>chave</b> abaixo (ou toque em “Abrir no aplicativo”, se estiver neste celular).</p>
        <p style="margin:8px 0"><code style="font-size:18px;letter-spacing:.08em;user-select:all">${esc(chave)}</code></p>
        <p style="margin:0 0 12px"><a class="btn sec pq" href="${esc(j.url)}">Abrir no aplicativo</a></p>
        <p><b>2.</b> Digite o código de 6 dígitos que o aplicativo mostrar:</p>
        <form id="f2" style="max-width:360px;margin-top:8px">${aviso()}<div class="campo"><label>Código</label><input name="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="7" required></div>
        <button class="btn" type="submit">Confirmar e ligar</button> <button class="btn sec" type="button" id="cx">Cancelar</button></form>`);
      ab.querySelector("#cx").addEventListener("click", refaz);
      ab.querySelector("#f2").addEventListener("submit", async (ev2) => {
        ev2.preventDefault();
        try {
          const r = await api("/auth/2fa/confirmar", { method: "POST", body: { codigo: ev2.target.codigo.value } });
          trocouToken(r, true);
          caixa(`<p><span class="tag ok">Ligada</span> Pronto! Guarde estes <b>códigos de reserva</b> em lugar seguro. Cada um vale uma vez e só aparece agora. Se perder o celular, é por eles que você entra.</p>
            <pre id="rs" style="font-size:17px;line-height:1.8;background:var(--surface-3);padding:12px;border-radius:8px;user-select:all">${r.reservas.map(esc).join("\n")}</pre>
            <p style="margin-top:10px"><button class="btn sec" type="button" id="cp">Copiar</button> <button class="btn" type="button" id="ok">Guardei, concluir</button></p>`);
          ab.querySelector("#cp").addEventListener("click", async () => { try { await navigator.clipboard.writeText(r.reservas.join("\n")); ab.querySelector("#cp").textContent = "Copiado"; } catch { alert("Selecione o texto e copie."); } });
          ab.querySelector("#ok").addEventListener("click", refaz);
        } catch (err) { falha(err.message); }
      });
    });
  }

  let msgFoto = null;
  const TIPOS_OK = ["image/jpeg", "image/png", "image/webp"], MAX_MB = 8, MIN_PX = 100;
  function aba_perfil(ab, p) {
    ab.innerHTML = `<section class="painel"><h2><span>Dados da conta</span></h2><div class="corpo"><div class="perfil">
      <div class="foto-box"><span class="avatar gd" id="avg">${p.foto ? `<img src="${esc(p.foto)}" alt="">` : esc(S.iniciais(p.nome_completo))}</span>
        <div class="foto-acoes"><label class="btn sec pq" style="cursor:pointer" id="lf">${p.foto ? "Trocar foto" : "Enviar foto"}<input type="file" id="fi" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" hidden></label>
        ${p.foto ? `<button class="btn sec pq" id="rf">Remover foto</button>` : ""}</div>
        <div class="foto-msg ${msgFoto?.ok ? "ok" : msgFoto ? "ruim" : ""}" id="e" role="status">${msgFoto ? esc(msgFoto.t) : ""}</div>
        <ul class="foto-regras"><li>Formatos: <b>JPG, PNG ou WebP</b></li><li>Tamanho: até <b>8 MB</b></li><li>Ideal: <b>quadrada, 400 × 400 px</b> ou mais</li><li>Rosto centralizado: cortamos o centro e reduzimos sozinhos</li><li>Não aceitamos HEIC (iPhone), GIF, PDF ou vídeo</li></ul></div>
      <div><dl><dt>Nome</dt><dd>${esc(p.nome_completo)}</dd><dt>E-mail de acesso</dt><dd>${esc(p.email || "–")}</dd><dt>Perfil</dt><dd>${esc(S.rotPerfil(p.perfil_acesso))}</dd>
        <dt>Equipe</dt><dd>${esc(p.equipe || "–")}</dd><dt>Funções</dt><dd>${esc(p.funcoes || "–")}</dd><dt>Entrada</dt><dd>${S.dt(p.data_entrada)}</dd>
        <dt>Último acesso</dt><dd>${p.ultimo_login ? esc(hora(p.ultimo_login)) : "–"}</dd></dl>
        <p style="margin-top:14px"><button class="btn sec" id="ts">Trocar senha</button></p></div></div></div></section><div id="pushbox"></div>`;
    ab.querySelector("#ts").addEventListener("click", () => S.telaTrocarSenha(false));
    S.push?.painel(ab.querySelector("#pushbox")).catch(() => {});   // notificações no celular (Gerente/Adm)
    const erro = (m, ok) => { msgFoto = m ? { t: m, ok: !!ok } : null; const e = ab.querySelector("#e"); e.textContent = m || ""; e.className = "foto-msg " + (m ? (ok ? "ok" : "ruim") : ""); };
    const atualizar = (foto, m) => { msgFoto = m ? { t: m, ok: true } : null; S.perfil = { ...S.perfil, foto }; S.pintarAvatar(foto, p.nome_completo); S.PAGES.perfil(document.getElementById("ct")).catch(() => {}); };
    ab.querySelector("#rf")?.addEventListener("click", async () => { try { await api("/perfil/foto", { method: "DELETE" }); atualizar(null, "Foto removida."); } catch (e) { erro(e.message); } });
    ab.querySelector("#fi").addEventListener("change", async (e) => {
      const f = e.target.files[0]; e.target.value = ""; if (!f) return;
      erro("Enviando…", true);
      try { const foto = await reduzir(f); await api("/perfil/foto", { method: "POST", body: { foto } }); atualizar(foto, "Foto atualizada."); }
      catch (err) { erro(err.message || "Não consegui usar essa imagem."); }
    });
  }

  /** Recorta o centro em quadrado, reduz para 256 px e comprime (o arquivo original nunca sai do navegador). */
  function reduzir(arq) {
    return new Promise((ok, falha) => {
      const ext = (arq.name.split(".").pop() || "").toLowerCase();
      if (/heic|heif/.test(arq.type) || ["heic", "heif"].includes(ext)) return falha(new Error("Não foi possível: fotos HEIC (iPhone) não são aceitas. Envie em JPG ou PNG (no iPhone: Ajustes > Câmera > Formatos > Mais compatível)."));
      if (!TIPOS_OK.includes(arq.type)) return falha(new Error(`Não foi possível: o formato ${arq.type ? arq.type.replace("image/", "").toUpperCase() : ext.toUpperCase() || "desconhecido"} não é aceito. Use JPG, PNG ou WebP.`));
      if (arq.size > MAX_MB * 1048576) return falha(new Error(`Não foi possível: o arquivo tem ${(arq.size / 1048576).toFixed(1).replace(".", ",")} MB e o limite é ${MAX_MB} MB. Escolha uma foto menor.`));
      const url = URL.createObjectURL(arq), img = new Image();
      img.onerror = () => { URL.revokeObjectURL(url); falha(new Error("Não foi possível abrir a imagem: o arquivo parece corrompido ou não é uma foto válida. Tente outra.")); };
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (Math.min(img.width, img.height) < MIN_PX) return falha(new Error(`Não foi possível: a imagem é muito pequena (${img.width}×${img.height}). O mínimo é ${MIN_PX}×${MIN_PX} px; o ideal é 400×400.`));
        const lado = Math.min(img.width, img.height), c = document.createElement("canvas"); c.width = c.height = 256;
        const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, 256, 256);
        g.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 256, 256);
        for (const q of [0.85, 0.7, 0.55]) { const d = c.toDataURL("image/jpeg", q); if (d.length < 85000) return ok(d); }
        falha(new Error("Não foi possível: mesmo reduzida, a imagem ficou pesada demais. Escolha uma foto com menos detalhes."));
      };
      img.src = url;
    });
  }

  S.itemAtividade = (i) => {
      const alvo = i.contrato_id ? `<a href="#/venda/${i.contrato_id}">${esc(i.alvo)}</a>` : esc(i.alvo);
      const campos = i.campos.length ? `<div class="campos">${i.campos.map((c) => `<div>${esc(c.campo)}: ${c.de !== undefined ? `<span class="de">${esc(c.de)}</span> → ` : ""}<span class="para">${esc(c.para)}</span></div>`).join("")}</div>` : "";
      return `<div class="it"><div class="quando"><b>${esc(hora(i.em).slice(11))}</b>${esc(hora(i.em).slice(0, 10))}</div>
        <div><b>${esc(S.nomeExib(i.quem))}</b> ${ACAO[i.acao]} · ${esc(i.tabela)} ${alvo}${campos}</div></div>`;
  };

  async function aba_atividade(ab) {
    const pessoas = gestor() ? await api("/atividade/pessoas") : [];
    const qs = Object.entries({ pagina: est.pagina, usuario: est.usuario, tabela: est.tabela, acao: est.acao, de: est.de, ate: est.ate }).filter(([, v]) => v !== "" && v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    const j = await api("/atividade?" + qs);
    const paginas = Math.max(1, Math.ceil(j.total / j.tam));
    const item = S.itemAtividade;
    ab.innerHTML = `<div class="aviso">${gestor() ? "Tudo o que foi criado, alterado ou apagado em vendas, clientes, rota e cadastros, com quem fez e o valor antes e depois." : "Suas criações e alterações no sistema."} Registros da carga inicial aparecem como “Sistema / carga”.</div>
      <div class="filtros">${gestor() ? `<div class="campo" style="width:190px"><label>Pessoa</label><select id="fu"><option value="">Todas</option>${pessoas.map((x) => `<option value="${x.id}" ${String(x.id) === String(est.usuario) ? "selected" : ""}>${esc(x.nome)}</option>`).join("")}</select></div>` : ""}
        <div class="campo" style="width:160px"><label>O quê</label><select id="ft"><option value="">Tudo</option>${Object.entries(TABELAS).map(([k, v]) => `<option value="${k}" ${est.tabela === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="campo" style="width:130px"><label>Ação</label><select id="fc"><option value="">Todas</option>${Object.entries(ACAO).map(([k, v]) => `<option value="${k}" ${est.acao === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="campo" style="width:140px"><label>De</label><input type="date" id="fd" value="${est.de}"></div><div class="campo" style="width:140px"><label>Até</label><input type="date" id="fa" value="${est.ate}"></div>
        <button class="btn" id="ok">Filtrar</button><button class="btn sec" id="lp">Limpar</button><button class="btn sec" id="ex">Exportar CSV</button></div>
      <div class="ativ">${j.itens.map(item).join("") || `<div class="it"><div class="mut">Nenhuma alteração encontrada.</div></div>`}</div>
      <div class="pag"><button class="btn sec pq" id="an" ${j.pagina <= 1 ? "disabled" : ""}>‹ Anterior</button><span>${nf.format(j.total)} registro(s) · página ${j.pagina}/${paginas}</span><button class="btn sec pq" id="px" ${j.pagina >= paginas ? "disabled" : ""}>Próxima ›</button></div>`;
    const go = () => S.PAGES.perfil(document.getElementById("ct")).catch(S.erroEm(document.getElementById("ct")));
    ab.querySelector("#ok").addEventListener("click", () => { est.usuario = ab.querySelector("#fu")?.value || ""; est.tabela = ab.querySelector("#ft").value; est.acao = ab.querySelector("#fc").value; est.de = ab.querySelector("#fd").value; est.ate = ab.querySelector("#fa").value; est.pagina = 1; go(); });
    ab.querySelector("#lp").addEventListener("click", () => { Object.assign(est, { usuario: "", tabela: "", acao: "", de: "", ate: "", pagina: 1 }); go(); });
    ab.querySelector("#ex").addEventListener("click", () => S.baixar("/atividade/exportar?" + qs, "historico-alteracoes.csv").catch((e) => alert(e.message)));
    ab.querySelector("#an").addEventListener("click", () => { est.pagina--; go(); });
    ab.querySelector("#px").addEventListener("click", () => { est.pagina++; go(); });
  }

  async function aba_acessos(ab) {
    const rows = await api("/acessos");
    ab.innerHTML = `<div class="aviso">Últimos 100 eventos de conta: entradas, tentativas erradas, criação de acessos e trocas de senha.</div>` +
      tabela([{ t: "Quando", f: (r) => esc(hora(r.em)) }, { t: "Pessoa", k: "pessoa" }, { t: "Evento", f: (r) => esc(EVENTO[r.acao] || r.acao) }, { t: "Feito por", f: (r) => esc(r.feito_por || "a própria pessoa") }, { t: "Detalhe", k: "detalhe" }], rows);
  }
})();
