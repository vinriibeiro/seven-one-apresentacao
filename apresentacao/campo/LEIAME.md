# Apresentação para vendedores e supervisores (`/apresentacao/campo/`)

A venda no app, em **modo vídeo**: narração por cena e telas do celular que se montam no tempo certo da fala. 16 cenas, cerca de 10 minutos. Vendedor só no celular (viabilidade e Conexão / Solar); supervisor no celular e no computador (Vendas da equipe e Visão da equipe). Sem indicadores de gerência ou de backoffice. Dados fictícios; nada é gravado.

## Abrir e apresentar

- Publicado: `https://<endereço do sistema>/apresentacao/campo/` ou, na versão estática, `…/seven-one-apresentacao/apresentacao/campo/#capa`.
- **Assistir** (botão da capa ou espaço): toca a narração da cena, revela as telas nos momentos certos e passa para a próxima cena sozinha. Espaço pausa; → e ← continuam funcionando. **L** liga a legenda (o texto narrado).
- Sem o áudio de uma cena, o relógio usa o tempo previsto dela e a legenda mostra o texto (aparece "sem áudio" no controle).
- Modo manual (sem Assistir): → revela o próximo momento; no último, avança a cena. Bom para apresentar comentando.
- `?tudo` na URL mostra cada cena completa (conferência, impressão). `?assistir` começa tocando.
- Os botões escuros ("Abrir o app de verdade", "Abrir no celular do supervisor"…) abrem a demonstração (`../sistema/demo/`) no perfil certo.

## Áudio (ElevenLabs ou outro)

**Um áudio só (mais simples):** cole `narracao/narracao-unica.txt` inteiro na ElevenLabs e salve como `audio/narracao.mp3`. As tags `<break time="2.5s" />` entre as cenas viram pausas longas; o player decodifica o áudio no navegador, acha as pausas e corta por cena. Se o número de trechos não bater com o de cenas, aparece "cortes?" no controle: crie `audio/cortes.json` com os segundos em que cada cena começa.

**Ou um arquivo por cena:**
1. `node ferramentas/apresentacao/narracao-campo.mjs` gera `narracao/NN-<id>.txt`, um por cena, e um LEIAME com a tabela.
2. Gere o MP3 de cada arquivo (voz em português do Brasil) e salve em `audio/<id>.mp3` (ex.: `audio/viab-form.mp3`).
3. Pronto: a apresentação carrega o áudio sozinha (o arquivo da cena vale antes do áudio único). Os parágrafos de cada texto são os momentos da cena; o player os distribui pela duração do áudio, proporcional ao tamanho. Para acertar na mão, `momentos: [seg, seg, …]` na cena.

## Arquivos

| Arquivo | O quê |
|---|---|
| `index.html` | a página; motor e estilo base de `../sistema/` (`tour.js`, `tour.css`) e `../operacao/operacao.css` |
| `player.js` | modo vídeo: áudio por cena ou único (corte pelas pausas), momentos (`data-m`), legenda, avanço automático, `?tudo`, `?assistir` |
| `cenas-campo.js` | conteúdo: capítulos, cenas, narração (`narracao`) e notas. No alto, `PERFIL` e os personagens |
| `campo.css` | estilo próprio (momentos, legenda, controles, cartões) |
| `roteiro.html` | roteiro gerado das mesmas cenas, com a narração de cada uma |
| `narracao/` | textos da narração, um por cena (gerados) · `audio/` | MP3 por cena (gerar fora) |
| `telas/` | capturas do supervisor (vitrine, dados fictícios) · `assets/` | marca |

## Validação

Em `api`, `npm test` inclui `test/apresentacao-campo.test.js`: cenas renderizam, cada `data-m` tem um trecho de narração, não aparecem indicadores de gerência (FPD, R$, fechamento, plano…), as demonstrações usam só os perfis vendedor e supervisor, e o player distribui os momentos pela duração.
