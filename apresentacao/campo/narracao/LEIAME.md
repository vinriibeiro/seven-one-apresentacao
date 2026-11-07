# Narração

## Jeito mais simples: um áudio só

Cole `narracao-unica.txt` inteiro no ElevenLabs (modelo Multilingual v2 ou v3, voz em português do Brasil) e salve o MP3 como `../audio/narracao.mp3`. As tags `<break time="2.5s" />` entre as cenas viram pausas longas: o player decodifica o áudio no navegador, acha essas pausas e corta por cena sozinho. Dentro da cena, as quebras de linha são só pausas curtas.

A ElevenLabs aceita 5000 caracteres por vez: use `narracao-parte1.txt`, `narracao-parte2.txt`… (cortados entre cenas) e salve como `../audio/narracao-1.mp3`, `narracao-2.mp3`… na mesma ordem. O player emenda as partes.

Se o número de trechos encontrados não bater com o de cenas (aparece "cortes?" no controle), crie `../audio/cortes.json` com a lista dos segundos em que cada cena começa, na ordem, ex.: `[0, 14.2, 31.9, …]`.

## Ou um arquivo por cena

Gere o áudio de cada arquivo (ex.: ElevenLabs, voz em português do Brasil, velocidade normal) e salve o MP3 em `../audio/` com o **nome da cena**: a apresentação carrega `audio/<id>.mp3` sozinha. Cena sem áudio toca pelo relógio, com a legenda.

Os parágrafos em branco separam os **momentos** da cena: a tela se monta a cada parágrafo. Leia com uma pausa curta entre eles. Não precisa marcar tempo: o player distribui os momentos pela duração do áudio, proporcional ao tamanho de cada parágrafo. Se quiser ajustar na mão, coloque `momentos: [seg, seg, ...]` na cena.

| # | id | cena | tamanho | arquivo de áudio |
|---|---|---|---|---|
| 01 | capa | A venda no app | 176 caracteres · ~13 s | `audio/capa.mp3` |
| 02 | roteiro | Três momentos | 321 caracteres · ~23 s | `audio/roteiro.mp3` |
| 03 | app-mais | O botão + do app | 358 caracteres · ~26 s | `audio/app-mais.mp3` |
| 04 | viab-form | Preencher o pedido | 480 caracteres · ~34 s | `audio/viab-form.mp3` |
| 05 | viab-enviado | Acompanhar na fila | 399 caracteres · ~29 s | `audio/viab-enviado.mp3` |
| 06 | viab-resposta | A resposta chega | 417 caracteres · ~30 s | `audio/viab-resposta.mp3` |
| 07 | viab-nao-atende | Quando não atende | 371 caracteres · ~27 s | `audio/viab-nao-atende.mp3` |
| 08 | solar-form | Enviar a venda feita na Claro | 536 caracteres · ~38 s | `audio/solar-form.mp3` |
| 09 | solar-retornos | Os retornos do Cadastro | 559 caracteres · ~40 s | `audio/solar-retornos.mp3` |
| 10 | solar-chat | Conversa na venda, com aviso no celular | 375 caracteres · ~27 s | `audio/solar-chat.mp3` |
| 11 | vend-resumo | Vendedor: a venda em quatro toques | 292 caracteres · ~21 s | `audio/vend-resumo.mp3` |
| 12 | sup-celular | Supervisor: as vendas da equipe no celular | 510 caracteres · ~36 s | `audio/sup-celular.mp3` |
| 13 | sup-computador | Supervisor: no computador | 379 caracteres · ~27 s | `audio/sup-computador.mp3` |
| 14 | sup-equipe | Supervisor: quem vendeu e quem parou | 384 caracteres · ~27 s | `audio/sup-equipe.mp3` |
| 15 | combinados | Combinados | 288 caracteres · ~21 s | `audio/combinados.mp3` |
| 16 | fim | Dúvidas | 198 caracteres · ~14 s | `audio/fim.mp3` |

Total: 5994 caracteres · 16 arquivos.
