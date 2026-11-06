# Apresentação para a operação (`/apresentacao/operacao/`)

Para o time inteiro da Seven: vendedores, backoffice de Cadastro e de Qualidade, supervisores, coordenadores e gerência. 22 cenas, cerca de 25 minutos, mais perguntas. Primeiro o que vale para todos (o que muda, acesso e ajuda, o caminho da venda), depois um capítulo por função e, no fim, os combinados da operação e a primeira semana de cada um.

Os botões escuros nas cenas ("Abrir … no sistema") abrem o sistema de verdade com dados fictícios (a vitrine em `../sistema/demo/`) dentro da própria apresentação, no perfil daquela função. Nada é gravado.

## Abrir

- Publicado: `https://<endereço do sistema>/apresentacao/operacao/` ou, na versão estática, `…/seven-one-apresentacao/apresentacao/operacao/#capa`.
- Roteiro de ensaio (falas, tempos, o que clicar, o que não prometer): `roteiro.html`, na mesma pasta. Imprime bem.
- Teclas: as mesmas da apresentação da diretoria (→ avança, ← volta, C capítulos, N notas, F tela cheia, R reinicia, ? ajuda).

## Arquivos

| Arquivo | O quê |
|---|---|
| `index.html` | a página; usa o motor e o estilo base de `../sistema/` (`tour.js`, `tour.css`) |
| `cenas-operacao.js` | todo o conteúdo: capítulos, cenas, falas e notas. No alto, `PERFIL` (seu nome, função e o endereço do sistema) |
| `operacao.css` | estilo próprio desta apresentação (cores por função, raias, filas, combinados) |
| `celular.html` | moldura de celular para o app na demonstração: `?perfil=vendedor|lider|coordenador|gestor&rota=/meu` |
| `roteiro.html` | roteiro de ensaio gerado das mesmas cenas |
| `assets/` | marca Seven One |

As capturas vêm de `../sistema/telas/` (vitrine com dados fictícios). A tela D+1 / D+15 é desenhada na própria cena: a captura da vitrine sai sem a data de instalação.

## Validação

Em `api`, `npm test` inclui `test/apresentacao-operacao.test.js`: todas as cenas renderizam, têm fala, os destinos e as imagens existem, cada função tem capítulo, o tempo cabe em 30 minutos e todo "Abrir no sistema" aponta para a demonstração.
