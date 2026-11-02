"use strict";
/* Central de monitoramento (só Gerente e Administrador).
   Cada número mostra de onde vem (origem), a unidade e a janela. "Sem coleta" nunca aparece como zero.
   Atualiza a cada 30 s com a tela aberta; a consulta é leve (memória do servidor + 1 leitura curta de histórico). */
(() => {
  const { esc, api, painel, tabela } = S;
  const nf = new Intl.NumberFormat("pt-BR");
  const est = { janela: 15, horas: 6 };
  const hora = (d) => (d ? new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "–");
  const num = (v, un = "") => (v == null ? '<span class="chip">sem coleta</span>' : `${nf.format(Math.round(v * 10) / 10)}${un ? " " + un : ""}`);
  const GRAV = { critico: "Crítico", atencao: "Atenção", info: "Info" };

  const card = (titulo, valor, linha, estado) => `<div class="${estado || ""}"><b>${valor}</b><span>${esc(titulo)}</span><small class="mut">${linha}</small></div>`;

  // pequeno gráfico de barras (SVG) do histórico: pedidos e falhas 5xx por faixa de 5 min
  function grafico(pontos) {
    if (!pontos.length) return '<p class="mut">Sem amostras no período (ou histórico indisponível).</p>';
    const W = 720, H = 120, m = Math.max(...pontos.map((p) => p.req), 1), bw = Math.max(2, Math.floor(W / pontos.length) - 1);
    const barras = pontos.map((p, i) => {
      const h = Math.round((p.req / m) * (H - 14)), e = Math.round((p.e5xx / m) * (H - 14));
      const x = i * (bw + 1);
      return `<g><title>${esc(hora(p.ate))} · ${p.req} pedidos · ${p.e5xx} falhas 5xx · p95 ${p.p95_ms ?? "sem pedidos"} ms</title>
        <rect x="${x}" y="${H - h}" width="${bw}" height="${h}" fill="#2f6fed" opacity=".75"/>${e ? `<rect x="${x}" y="${H - e}" width="${bw}" height="${e}" fill="#c0392b"/>` : ""}</g>`;
    }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Pedidos por 5 minutos; vermelho = falhas 5xx" style="max-height:140px">${barras}</svg>
      <p class="mut">Cada barra = 5 minutos. Azul: pedidos /api (todas as instâncias). Vermelho: falhas 5xx. Máximo da escala: ${nf.format(m)} pedidos.</p>`;
  }

  S.PAGES.monitor = async (el) => {
    const desenhar = async () => {
      const [m, h] = await Promise.all([api(`/monitor/resumo?janela=${est.janela}&nocache=1`), api(`/monitor/historico?horas=${est.horas}&nocache=1`)]);
      const p = m.pedidos, abertos = (m.incidentes.itens || []).filter((i) => !i.resolvido_em && !i.teste);
      const dbOk = m.banco.ok, bancoEstado = dbOk === null ? "" : dbOk ? "ok" : "ruim";
      el.innerHTML = `<div class="cab"><div><div class="migalha">Administração</div><h1>Monitoramento</h1>
        <p>Versão <b>${esc(m.versao)}</b> · Node ${esc(m.node)} · instância <b>${esc(m.instancia)}</b> · no ar desde ${hora(m.iniciado_em)} · atualizado ${hora(m.gerado_em)}.
        ${m.telemetria.desatualizada ? '<b style="color:#c0392b"> Telemetria desatualizada: a checagem do banco não roda há mais de 2 minutos.</b>' : ""}</p></div></div>
        ${abertos.length ? `<div class="painel" style="border-left:4px solid #c0392b;padding:10px 14px;margin-bottom:12px"><b>${abertos.length} incidente(s) aberto(s):</b> ${abertos.map((i) => `${esc(GRAV[i.gravidade] || i.gravidade)} — ${esc(i.titulo)}`).join(" · ")}</div>` : ""}
        <div class="filtros"><div class="campo" style="width:auto"><label>Janela dos pedidos</label><div class="seg" id="mj">${[5, 15, 60].map((x) => `<button data-j="${x}" class="${est.janela === x ? "on" : ""}">${x} min</button>`).join("")}</div></div>
          <div class="campo" style="width:auto"><label>Histórico</label><div class="seg" id="mh">${[1, 6, 24].map((x) => `<button data-h="${x}" class="${est.horas === x ? "on" : ""}">${x} h</button>`).join("")}</div></div>
          <div class="campo" style="width:auto"><label>Alertas</label><button id="mt" class="btn sec">Gerar alerta de teste</button></div></div>
        <div class="vb-resumo">
          ${card("Banco de dados", dbOk === null ? '<span class="chip">sem coleta</span>' : dbOk ? "No ar" : "FORA", `${m.banco.latencia_ms != null ? m.banco.latencia_ms + " ms" : "sem medida"} · checado ${hora(m.banco.checado_em)} · ${esc(m.banco.origem)}`, bancoEstado)}
          ${card(`Pedidos /api (${p.janela_min} min)`, p.coletado ? nf.format(p.total) : '<span class="chip">sem coleta</span>', esc(p.origem), "")}
          ${card("Falhas 5xx", p.coletado ? `${nf.format(p.e5xx)} (${(p.taxa_5xx * 100).toFixed(2)}%)` : '<span class="chip">sem coleta</span>', "erros técnicos · janela " + p.janela_min + " min", p.coletado && p.e5xx ? "ruim" : "")}
          ${card("Respostas 4xx", p.coletado ? nf.format(p.e4xx) : '<span class="chip">sem coleta</span>', "esperadas: validação, permissão, limite", "")}
          ${card("Latência p95", num(p.p95_ms, "ms"), `p50 ${p.p50_ms ?? "–"} · p99 ${p.p99_ms ?? "–"} ms · por faixas`, p.p95_ms > 4000 ? "ruim" : "")}
          ${card("Pool de conexões", `${m.pool.abertas}/${m.pool.maximo}`, `livres ${m.pool.livres} · aguardando ${m.pool.aguardando} · desta instância`, m.pool.aguardando > 0 ? "ruim" : "")}
          ${card("Memória (RSS)", num(m.processo.rss_mb, "MB"), esc(m.processo.nota_limite || "limite " + m.processo.limite_mb + " MB") + ` · heap ${m.processo.heap_mb} MB`, "")}
          ${card("Atraso do laço (p99)", num(m.processo.lag_p99_ms, "ms"), "Node event loop · desde a última amostra", "")}</div>
        ${m.banco.conexoes_vistas != null ? `<p class="mut">Conexões vistas pelo banco: ${m.banco.conexoes_vistas} de ${m.banco.max_conexoes} permitidas (${esc(m.banco.nota_conexoes)}).</p>` : ""}
        ${p.coletado ? "" : `<p class="mut">${esc(p.nota)}</p>`}
        ${painel("Histórico de pedidos", grafico(h.pontos || []), h.disponivel ? `últimas ${h.horas} h · amostras gravadas no banco por minuto` : (h.motivo || "indisponível"), "")}
        ${painel("Rotas com falha técnica (5xx)", m.rotas.com_falha.length ? tabela([{ t: "Rota", f: (x) => esc(x.rota) }, { t: "5xx", f: (x) => x.e5xx }, { t: "Pedidos", f: (x) => nf.format(x.pedidos) }], m.rotas.com_falha) : '<p class="mut">Nenhuma rota com 5xx desde que o processo subiu.</p>', m.rotas.nota, "")}
        ${painel("Rotas mais lentas (média)", tabela([{ t: "Rota", f: (x) => esc(x.rota) }, { t: "Pedidos", f: (x) => nf.format(x.pedidos) }, { t: "Média", f: (x) => x.medio_ms + " ms" }, { t: "p95", f: (x) => (x.p95_ms ?? "–") + " ms" }, { t: "Máx.", f: (x) => x.maximo_ms + " ms" }, { t: "4xx", f: (x) => x.e4xx }, { t: "5xx", f: (x) => x.e5xx }], m.rotas.mais_lentas), "por nome de rota, sem parâmetros nem dados de clientes", "")}
        ${painel("Consultas lentas ao banco", m.consultas_lentas.itens.length ? tabela([{ t: "SQL (sem valores)", f: (x) => `<code style="font-size:11px">${esc(x.sql)}</code>` }, { t: "Vezes", f: (x) => x.vezes }, { t: "Média", f: (x) => x.medio_ms + " ms" }, { t: "Máx.", f: (x) => x.maximo_ms + " ms" }, { t: "Última", f: (x) => hora(x.ultima) }], m.consultas_lentas.itens) : '<p class="mut">Nenhuma consulta acima do limite desde que o processo subiu.</p>', m.consultas_lentas.origem, "")}
        ${painel("Tarefas agendadas", m.tarefas.length ? tabela([{ t: "Tarefa", f: (x) => esc(x.nome) }, { t: "Execuções", f: (x) => x.execucoes }, { t: "Falhas seguidas", f: (x) => (x.falhas_seguidas ? `<b style="color:#c0392b">${x.falhas_seguidas}</b>` : "0") }, { t: "Última", f: (x) => hora(x.ultima_execucao) }, { t: "Último erro", f: (x) => esc(x.ultimo_erro || "–") }], m.tarefas) : '<p class="mut">Nenhuma tarefa executou desde que o processo subiu (isto é ausência de coleta, não sucesso).</p>', "", "")}
        ${painel("Incidentes e alertas", `${m.incidentes.nota ? `<p class="mut">${esc(m.incidentes.nota)}</p>` : ""}<p class="mut">Canal de alerta: ${esc(m.alertas.canal)}. Regras: 5xx ≥ ${(m.alertas.regras.taxa_5xx * 100).toFixed(0)}% dos pedidos, p95 > ${m.alertas.regras.p95_ms} ms, pool com espera por ${m.alertas.regras.pool_minutos}+ min, banco sem resposta, tarefa com 3 falhas seguidas.</p>`
          + (m.incidentes.itens.length ? tabela([{ t: "Abriu", f: (x) => hora(x.aberto_em) }, { t: "Gravidade", f: (x) => esc(GRAV[x.gravidade] || x.gravidade) + (x.teste ? " (teste)" : "") }, { t: "Incidente", f: (x) => esc(x.titulo) }, { t: "Situação", f: (x) => (x.resolvido_em ? "resolvido " + hora(x.resolvido_em) : "<b>aberto</b>") }, { t: "Aviso externo", f: (x) => esc(x.entrega || "–") }], m.incidentes.itens) : '<p class="mut">Nenhum incidente registrado.</p>'), "", "")}
        <p class="mut">${esc(m.aviso_instancia)} A disponibilidade medida aqui vem do próprio sistema; ela não detecta que o sistema inteiro caiu. Para isso use também um monitor externo apontado para <code>/api/pronto</code>.</p>`;
      el.querySelector("#mj").addEventListener("click", (e) => { const j = e.target.closest("[data-j]")?.dataset.j; if (j) { est.janela = +j; desenhar(); } });
      el.querySelector("#mh").addEventListener("click", (e) => { const x = e.target.closest("[data-h]")?.dataset.h; if (x) { est.horas = +x; desenhar(); } });
      el.querySelector("#mt").addEventListener("click", async () => { await api("/monitor/alerta-teste", { method: "POST", body: {} }); desenhar(); });
    };
    await desenhar();
    clearInterval(el._monitor);
    el._monitor = setInterval(() => { if (!el.isConnected || !el.querySelector("#mj")) return clearInterval(el._monitor); if (!document.hidden) desenhar().catch(() => {}); }, 30000);
  };
})();
