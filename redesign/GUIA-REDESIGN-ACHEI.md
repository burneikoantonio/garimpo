# Achei — guia do novo visual

Todas as decisões de design do app **Achei** (repositório `burneikoantonio/garimpo`, arquivo principal `app/index.html`).
Este pacote tem 3 arquivos:

| Arquivo | O que é |
|---|---|
| `GUIA-REDESIGN-ACHEI.md` | Este guia: regras e o passo a passo de aplicação |
| `estilo-achei.css` | Cores, fontes e todos os componentes prontos |
| `icones-achei.js` | Ícones rabiscados, contornos tortos, interruptor, tremida, ilustrações e frases de carregamento |

A identidade em uma frase: **app preto e branco, com letra de spray e tag de muro, e um único vermelho só nos detalhes.**

---

## 1. Cores

- **Só 3 cores:** preto, branco e vermelho. Nada de verde, amarelo ou azul.
- Textos, fundos e imagens ficam sempre em preto e branco.
- **Vermelho Spray `#D7261E`** aparece só em: sombra dos títulos, sombra dos ícones, etiquetas de desconto, botão principal, seleção (chips e aba ativa) e estados ativos.
- **Tema escuro é o principal.** O claro fica como opção (já existe `data-tema="claro"` no app; só trocar os valores).
- As fotos ficam sempre num **fundo cinza claro** (`--vitrine #d9d9d6`). Assim a roupa preta aparece no tema escuro.

| Nome | Hex | Uso |
|---|---|---|
| Asfalto | `#0D0D0D` | Fundo do app |
| Grafite | `#1C1C1C` | Barras, divisórias |
| Concreto | `#3A3A3A` | Bordas inativas |
| Poeira | `#8A8A8A` | Texto secundário, preço antigo |
| Giz | `#F2F2F2` | Texto, traço dos ícones |
| Vitrine | `#D9D9D6` | Fundo das fotos |
| Spray | `#D7261E` | Único destaque |

## 2. Tipografia

- **Títulos e logo:** Sedgwick Ave Display (tag de grafite), com **sombra vermelha deslocada 3px** (classe `.tag`).
- **Todo o resto** (nomes, preços, tamanhos, botões, descrições): **Lacquer** (spray), **reduzida e mais junta**: 13px de base, `letter-spacing: -0.03em`, nunca abaixo de 11px.
- Remover a IBM Plex Sans e a IBM Plex Mono.
- As duas fontes são do Google Fonts, com licença OFL (uso comercial liberado).

## 3. Ícones

- **Nenhum emoji no app.** Substituir todos pelos ícones de `icones-achei.js`:

| Hoje | Novo |
|---|---|
| 📉 | `icone('baixou')` |
| 🏆 | `icone('top10')` (coroa) |
| 👕 | `icone('combinar')` |
| 🛒 | `icone('simular')` |
| 🔔 | `icone('alertas')` |
| ♡ / ♥ | `icone('salvos')` / `icone('salvos', 24, {cheio:true})` |
| ⌕ | `icone('buscar')` |
| ↗ | `icone('abrir')` |
| ▾ / ▴ | `icone('filtro')` (girar 180° quando aberto) |
| ✕ | `icone('fechar')` |
| › | `icone('seta')` |
| ✓ | remover, usar o estado ativo do botão |

- Também substituir o objeto `ICON` atual (linha ~288 de `index.html`) pelos novos.
- Estilo: **retos** (só uma rotação leve), traço tremido, segunda passada de traço e **sombra vermelha**.
- No tamanho pequeno (menos de 32px) e nos ícones de apoio, a função já tira a segunda passada e **reforça o vermelho**.
- **Ficam parados e tremem ao toque** (`tremer(el)`): giro rápido mais a linha "fervendo" por meio segundo.

## 4. Botões e controles

| Componente | Estilo | Classe |
|---|---|---|
| Botão principal ("Ver na loja", "Começar") | **Pincelada** vermelha atrás do texto, que se pinta da esquerda para a direita ao tocar | `.btn-pincel` |
| Botão secundário ("Seguir", "Mostrar mais", "Remover", "Limpar busca") | **Contorno torto branco** (todos brancos). Fica vermelho ao tocar. "Seguindo" fica vermelho permanente | `.btn-sec` + `contornoTorto()` |
| Chips e tamanhos (Tudo, Roupas, 41...) | Só texto cinza. O selecionado ganha o **quadrado torto vermelho**, que se desenha | `.chip` + `contornoTorto('#D7261E', 2)` |
| Interruptor ("Só peças com desconto") | **Trilho torto** com caixinha que desliza. O trilho fica vermelho ao ligar | `.switch` + `interruptor()` |
| Barra de navegação | **Ícone + nome.** Aba ativa acesa com **quadrado torto vermelho**, inativas apagadas | `.nav` |

**Não usar círculos** em nenhum lugar do app. Todas as marcações são quadradas e tortas.

## 5. Card de produto

- A foto ocupa o card inteiro (fundo vitrine).
- **Faixa preta inclinada sobre a parte de baixo da foto**, com: marca · nome · preço antigo riscado · preço.
- **Etiqueta vermelha** no canto superior esquerdo, só quando tiver desconto (`-30%`) ou queda (`Baixou R$ 60`). Se tiver os dois, mostra o desconto.
- **Coração** no canto superior direito. Ao curtir, treme e se enche de vermelho.
- A loja e o histórico **não** aparecem no card, só na página do produto.

## 6. Página do produto

De cima para baixo:
1. Cabeçalho com `voltar` e o nome da marca.
2. Fotos (deslizar), no fundo vitrine, com a etiqueta vermelha.
3. Marca · tipo, nome, **preço grande** e preço antigo riscado.
4. **Resumo em 3 selos** com contorno torto, por exemplo: `Preço bom` · `Nota 8/10` (este em vermelho) · `Menor em 30 dias`.
5. Tamanhos (chip com quadrado torto no do usuário).
6. **Blocos sanfonados** (abrem com "+"): Pagamento, Preço justo, Nota de oferta, Onde comprar, Mesmo modelo em outras lojas, Importar, Histórico de preço, Combinar.
7. "Não curti: esconder esta peça" (botão secundário, no final).
8. **Barra fixa no rodapé**, sempre visível: ícones de Alerta, Curtir e Simular, mais o botão **"Ver na loja"** em pincelada.

## 7. Carregamento

- Frase em tag (com sombra vermelha), **empilhada em duas linhas**: a primeira menor, a segunda maior e deslocada para a direita. Inclinada -6° e "fervendo" (trocar `trem0/1/2` a cada 140ms).
- Frase **sorteada** a cada carregamento: *Fica ligado · Já tá vindo · Pera aí · Segura aí · Só um segundo · Achando* (essa fica numa linha só).
- Embaixo da frase, **o ícone da aba atual se desenhando em loop** (classe `.desenhar`): etiqueta em Ofertas, estrela em Marcas, globo em Importados, coração em Salvos e boneco em Perfil.
- Cuidado: o texto não pode quebrar linha sozinho (`white-space: nowrap`) nem encostar no ícone.

## 8. Telas vazias

Ilustração rabiscada (com sombra vermelha) + título em tag + texto curto + botão secundário. Tudo pronto em `ILUSTRACOES`:

| Situação | Desenho | Título | Botão |
|---|---|---|---|
| Salvos vazio | Cabide vazio | Cabide vazio | Ver ofertas |
| Sem promoção nas marcas | Etiqueta com X | Preço cheio | Seguir mais marcas |
| Busca sem resultado | Lupa com "?" | Não achei | Limpar busca |
| Sem alertas | Sino com "zzz" | Tudo quieto | Ver ofertas |
| Simular compra vazio | Sacola vazia | Sacola vazia | Ver ofertas |
| Top 10 sem peças | Coroa caída | Sem ranking hoje | Ver ofertas |
| Sem conexão | Wi-fi riscado | Sem sinal | Tentar de novo |

## 9. Ícone do app e tela de abertura

- **Nome:** Achei.
- **Ícone do app** (gerar `icone-180.png`, `icone-192.png`, `icone-512.png` e atualizar `manifest.webmanifest`): fundo branco `#F2F2F2`, com **"Achei" grande em Sedgwick Ave Display preta e sombra vermelha** (deslocamento de cerca de 3% do tamanho). Texto inclinado -10° e `skewX(-8°)`, letras juntas (`letter-spacing -2`), ocupando quase a largura toda do ícone, com o traço levemente tremido. Sem rabiscos extras nas letras.
- **Abertura** (fundo branco, cerca de 2s):
  1. A etiqueta de preço se desenha (0,6s) e some.
  2. "Achei" entra com um quique (mesmo visual do ícone).
  3. Em volta, as **marcações aparecem uma por uma** (0,1s entre cada), na composição "Espalhado": sublinhado vermelho embaixo do nome, uma seta curva preta no canto superior esquerdo, uma seta vermelha no canto inferior direito, um X preto no alto à direita, um X vermelho embaixo à esquerda, colchetes pretos dos dois lados do nome e dois pares de riscos de brilho (um vermelho, um preto) no alto.
  - **Nada** de coroa, coração ou estrela na abertura.
- Substituir o logo antigo ("A" curvado, `logo-128.png` / `achei-*.png`) pelo "Achei" em tag.

## 10. Regras de animação

- Tudo que é clicável reage ao toque: ícones e abas **tremem**, o botão principal **pincela**, chips **desenham o quadrado**, o coração **treme e enche**.
- Etiquetas de desconto **não** animam (são informação, não botão).
- Toda animação com menos de 0,5s (menos o carregamento).
- Com "reduzir movimento" ligado no celular, nada anima (já está no CSS).

---

## Texto para colar no Claude Code

> Quero aplicar um redesign completo no app Achei (pasta `app/`, arquivo principal `index.html`). Na raiz do repositório coloquei a pasta `redesign/` com 3 arquivos: `GUIA-REDESIGN-ACHEI.md` (todas as decisões), `estilo-achei.css` (cores, fontes e componentes) e `icones-achei.js` (ícones, contornos, interruptor, tremida, ilustrações e frases).
>
> Leia o guia inteiro antes de começar. Depois:
> 1. Crie um branch `redesign-achei`.
> 2. Troque o tema IBM/Carbon atual pelas cores e fontes do guia (escuro como padrão, claro como opção no `data-tema="claro"` que já existe).
> 3. Substitua TODOS os emojis e símbolos de texto (📉 🏆 👕 🛒 🔔 ♡ ♥ ⌕ ↗ ▾ ▴ ✕ › ✓) e o objeto `ICON` pelos ícones de `icones-achei.js`.
> 4. Aplique os componentes: pincelada no botão principal, contorno torto nos secundários, quadrado torto nos chips e tamanhos, trilho torto nos interruptores, navegação com ícone + nome.
> 5. Refaça o card de produto (faixa preta sobre a foto) e a página de produto (3 selos de resumo, blocos sanfonados, barra fixa embaixo).
> 6. Implemente o carregamento, as telas vazias, o ícone do app e a tela de abertura, como descritos no guia.
> 7. Não mude nenhuma lógica, dado ou cálculo do app, só o visual.
>
> Faça em etapas, na ordem do guia, e me mostre o resultado de cada etapa antes de seguir. Não junte com o branch principal antes de eu aprovar.
