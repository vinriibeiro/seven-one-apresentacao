# Apresentação do Seven One (`/apresentacao/sistema/`)

Apresentação para líderes de provedores, sem formação técnica: 29 cenas, cerca de 20 minutos. Abre pela **segurança** (camadas de proteção, vigia automático, plano de contingência e o esquema risco × resposta), mostra o que a plataforma tem, acompanha uma venda fictícia, traz os indicadores (com o link do painel de BI), a **proposta de integração de leitura com a Claro**, as **implementações futuras** e fecha com o piloto. Tudo é estático e fictício: nada é gravado, nenhum e-mail ou notificação é enviado; os únicos serviços externos são as fontes do Google e o link do Power BI, que abre em outra aba.

## Abrir

- Publicado: `https://<endereço do sistema>/apresentacao/sistema/`
- Local: na pasta `api`, suba o servidor (`npm start`, ou com variáveis falsas como no CI) e abra `http://localhost:3001/apresentacao/sistema/`. Os botões "Abrir … (demonstração)" dependem do servidor, porque usam a vitrine em `/apresentacao/sistema/demo/`.
- Roteiro de ensaio (falas, tempos, o que clicar, simulado × real, evidências): `roteiro.html` na mesma pasta. Imprime bem.

## Apresentar

| Tecla | Ação |
|---|---|
| → · espaço · Enter · clique à direita | avançar |
| ← · Backspace · clique na faixa esquerda | voltar |
| C | capítulos |
| N | notas do apresentador (gaveta à direita, escondida por padrão) |
| F | tela cheia |
| R | reiniciar (zera a história e o relógio) |
| T | zerar só o relógio |
| Alt+1 … Alt+8 | ir ao capítulo |
| ? | ajuda |

O botão ▯ abre as notas numa segunda janela (`?apresentador`), sincronizada com a principal; as setas nela também avançam a apresentação. Os botões "+" dentro das cenas abrem aprofundamentos (segurança, permissões, carga, integrações, tecnologias, novidades, telas, auditoria, linha do tempo) para perguntas: não fazem parte do percurso principal.

Voltar, avançar, pular capítulo ou reiniciar nunca duplica nada: o estado da história é recalculado do zero a cada cena (eventos dos passos 0..i).

## Arquivos

| Arquivo | O quê |
|---|---|
| `index.html` | página da apresentação (palco 1920×1080 escalado para a tela) |
| `tour.js` | motor: passos, capítulos, estado, navegação, notas, janelas; componentes `UI.cel` (celular) e `UI.web` (sistema web) |
| `tour.css` | estilo, com os tokens de `seven.css` (navy da lateral, vermelho da marca, IBM Plex) |
| `cenas.js` | capítulos 1–5: história da venda. No alto, `PERFIL` (seu nome, função, desde) e `P` (personagens e dados fictícios da venda) |
| `cenas-confianca.js` | capítulos de segurança, plataforma, indicadores, proposta Claro e futuro; no fim, `TOUR.ordenar()` define a ordem de todos os capítulos |
| `confianca.css` | estilo desses capítulos |
| `assets/` | marca Seven One (logo branca, logo escura e ícone) |
| `cenas-tecnicas.js` | capítulos 6–8: adoção na empresa, confiança e decisão de contratação; também contém os aprofundamentos técnicos para perguntas |
| `roteiro.html` | roteiro de ensaio gerado das mesmas cenas |
| `celular.html` | moldura de celular para a demonstração do app (usada pelos aprofundamentos) |
| `telas/` | capturas reais do sistema com dados fictícios (vitrine), versão de 31/10/2026 |

## Antes de apresentar

1. Confira `PERFIL` em `cenas.js`. A autoria permanece na capa; formação e atuação ficam no apoio "Quem desenvolve o Seven One".
2. Ensaie usando `roteiro.html` ou a segunda janela de notas. Piloto, prazo, investimento e suporte são propostas a combinar, não compromissos comerciais já definidos.
3. Leia as notas "Simulado × real" de cada cena: elas dizem o que não afirmar (2FA, certificação, LGPD completa, integração automática com Solar, capacidade garantida por um ensaio local).

## Validação da apresentação

Em `api`, `npm test` inclui `test/apresentacao.test.js`: renderização de todas as cenas, destinos de apoio, consistência da história ao pular/voltar e os scripts compartilhados com o roteiro. A demonstração usa dados fictícios e não exige acesso ao banco de produção.

## Versão pública (GitHub Pages)

`node ferramentas/pages/gerar.mjs <pasta>` monta a apresentação, o roteiro e o protótipo navegável (o sistema com a vitrine) como site estático, sem servidor, com dados fictícios. A pasta é o conteúdo do repositório `seven-one-apresentacao`. Gere de novo e publique sempre que a apresentação ou o sistema mudarem.
