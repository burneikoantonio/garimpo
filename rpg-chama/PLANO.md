# A Última Chama — plano do RPG (salvo em 22/11/2026)

Status: só planejamento e testes de ferramenta. NENHUM arquivo do jogo foi gerado ainda.

## Respostas do usuário
- Clima/história: "pode escolher você" (Claude decide tudo)
- Tamanho: médio (~30 min) — vila + 3 regiões com dungeon e chefão
- Sistemas: nível + XP com ÁRVORE DE HABILIDADES
- Visual: pixel art simples
- RPG de ação (não por turnos), no GameMaker LTS 2026

## História
Vila Farol é o último lugar iluminado pela Chama Eterna, no alto do farol. Kai, aprendiz do
faroleiro Velho Bram, vê a Névoa subir: o Rei Pálido parte a chama em 3 Brasas e as leva para
3 terras. Cada terra tem um guardião corrompido. Com as 3 Brasas, abre a Torre da Névoa.
Reviravolta: o Rei Pálido é Edran, antigo aprendiz de Bram, que tentou carregar a chama sozinho
e foi consumido. Final: Kai reacende o farol — "a chama não é de um só, é de quem a carrega junto".

NPCs da vila: Bram (história), Nina ferreira (explica árvore/tecla T), Tito criança, guarda
Osvaldo (bloqueia a torre até ter 3 brasas). Um viajante perdido em cada região com lore.

## Mapas (tiles 16px, câmera 320x180, janela 1280x720, ~30x20 tiles cada)
- Vila (portões: oeste Bosque livre; leste Minas precisa 1 brasa; sul Cinzas precisa 2; norte Torre precisa 3)
- Bosque Sussurrante 1, 2 (dungeon, baú, fogueira), 3 (chefe Mãe-Raiz)
- Minas de Cristal 1, 2, 3 (chefe Rainha de Cristal)
- Pico de Cinzas 1, 2, 3 (chefe Colosso de Cinza)
- Torre da Névoa 1, 2 (chefe final Rei Pálido)
Mapas em ASCII dentro do código: # parede . chão , chão2 T árvore ~ água/lava o pedra
H casa L farol F fogueira = ponte 1-4 saídas, %/&/$ portões (1/2/3 brasas), + portão de arena,
P início, n NPC, c baú, Z chefe, letras minúsculas = inimigos.

## Inimigos
e gosma (persegue), l lobo (investida), a espinheiro (torre que atira), b morcego (voo errático),
g golem (tanque, pisão), i diabrete (3 tiros em leque), k cavaleiro pálido (elite), m espectro
(teleporta, orbe teleguiado). Força escala por região. Números de dano flutuando.

## Chefes
1 Mãe-Raiz: raízes no chão (aviso), anel de sementes, invoca gosmas aos 50%. HP 120
2 Rainha de Cristal: investidas quicando nas paredes, leque de cristais, morcegos. HP 220
3 Colosso de Cinza: ondas de choque em anel, chuva de fogo, fase 2 rápida. HP 350
4 Rei Pálido: teleporte, orbes teleguiados, investida, invoca cavaleiros, fase 2 espiral. HP 500

## Jogador
Vida 30, mana 20. Espaço = espada, E = bola de fogo (5 mana), Shift = esquiva, Q = giro,
R = tempestade, T = árvore, F = falar. Cada nível: +vida, +dano, 1 ponto. Baús dão pontos.
Fogueira: cura, salva (arquivo ini) e é onde renasce. Morrer não perde nada.

## Árvore de habilidades (3 ramos x 4)
Lâmina: Fio Afiado (3) +2 dano | Golpe Giratório (Q) | Sede de Sangue (2) cura ao acertar | Lâmina Fantasma (onda com vida alta)
Chama: Brasa Viva (3) +3 dano fogo | Explosão em área | Fonte Interior (2) +mana/regen | Tempestade de Fogo (R)
Vigor: Coração Forte (3) +10 vida | Esquiva (Shift, invencível) | Regeneração (2) | Fênix (revive 1x por fogueira)

## Arquitetura técnica decidida
- Projeto novo em ~/GameMakerProjects/A Ultima Chama, gerado por script perl (Mac não tem python3).
  Código-fonte do gerador e dos .gml deve ficar AQUI em rpg-chama/ (não no scratchpad, que some).
- Formatos .yy copiados do projeto "RPG teste do Ben". Uma sala só (rm_jogo) com obj_jogo
  persistente que carrega mapas de dados, desenha tiles, HUD, diálogo, menus, câmera.
- Objetos: obj_jogo, obj_jogador, obj_inimigo (tipo), obj_chefe (tipo), obj_proj, obj_perigo,
  obj_onda, obj_golpe, obj_npc, obj_bau, obj_fogueira, obj_item, obj_texto, obj_part.
- Colisão por grade de tiles (sem objetos parede). Profundidade = -y.
- Fonte própria em pixel art (sprite + font_add_sprite_ext) pra ter acentos.
- Mudar option_mac_interpolate_pixels para false (pixel art nítida).

## Como compilar e rodar sem clicar no GameMaker (testado, funciona)
Igor compila pelo terminal (precisa rodar fora do sandbox; apagar cache/temp se der erro):
  R=/Users/Shared/GameMakerStudio2-LTS2026/Cache/runtimes/runtime-2026.1.0.28
  U="$HOME/Library/Application Support/GameMakerStudio2-LTS2026/unknownUser_unknownUserID"
  "$R/bin/igor/osx/arm64/Igor" --project=<yyp> --rp="$R" --uf="$U" --cache=<dir> --temp=<dir> -r=VM -- mac Run
Gera output/<nome>/game.ios (o crash no final, em InstallRunnerOnMac, não importa).
Rodar: "$R/mac/YoYo Runner.app/Contents/MacOS/Mac_Runner" -game <game.ios>  (ainda não testado)

## Próximos passos
1. Escrever gerador perl + sprites em ASCII + fonte
2. Escrever os .gml (motor, inimigos, chefes, árvore, diálogos, mapas)
3. Compilar com Igor, corrigir erros, rodar e testar
4. Abrir no GameMaker pro usuário jogar
