# Garimpo (nome provisório) — Brainstorm

App pessoal para iPhone que encontra roupas masculinas em promoção com bom custo-benefício, com foco no Brasil.

## Perfil
- **Público:** masculino
- **Estilos:** casual, streetwear, esportivo/athleisure
- **Categorias:** roupas, tênis e calçados, acessórios
- **Marcas de referência:** Carnan, Pac3, Piet, Carhartt WIP, À La Garçonne, Adidas Originals, Jordan
- **Descoberta:** sugerir marcas parecidas com as que o usuário segue

## Lojas
- Sites das marcas, multimarcas nacionais, grandes varejistas e importados
- Só produtos novos (sem brechó/revenda)
- Frete, troca, cupons e parcelamento aparecem como informação extra; não mudam a ordem

## Importação
- Importado só aparece se o **custo total em reais** compensar: produto + IOF/câmbio + frete (direto ou via redirecionador, ex.: USCloser) + imposto de importação + ICMS
- Precisa ser mais barato que o melhor preço no Brasil, respeitando uma **economia mínima** configurável (padrão 20%)
- Tag **INTERNACIONAL** em todo item de fora, com detalhamento do preço
- Alíquotas e câmbio ficam em configuração atualizável (as regras mudam)

## Nota de Oferta (0–100)
1. Desconto real contra o preço habitual (não o "de/por" da loja)
2. Comparação com o mesmo item em outras lojas
3. Comparação com peças parecidas de marcas do mesmo nível
4. Bônus se for o menor preço já registrado

Itens com nota ≥ 70 (ajustável) geram alerta. Descontos a partir de ~25–30% já pontuam.

## Alertas
- Item salvo baixou · sale de marca favorita · menor preço histórico · lançamento/reposição no tamanho
- Na hora; se não houver nenhum no dia, um resumo diário
- Só mostra o que existe no tamanho do usuário

## Visual
- Design system IBM **Carbon**, tema escuro **Gray 100**, fontes IBM Plex
- Abre no **feed de ofertas**, grade de 2 colunas
- Abas: **Ofertas · Buscar · Marcas · Salvos · Perfil**

## Caminho técnico sugerido
1. Protótipo clicável (feito)
2. Web app instalável no iPhone (PWA) + lista de marcas curada
3. Fonte de dados: programas de afiliados (Awin, Lomadee) e monitoramento dos sites das marcas
4. Depois, se valer a pena: app nativo / App Store

---

## Onde paramos (14/11/2026)
- **No ar:** https://fascinating-puffpuff-02b586.netlify.app (Netlify) e robô no GitHub (projeto privado burneikoantonio/garimpo) às 8h e 18h, com avisos no ntfy.
- **Para mudar o app:** editar os arquivos e rodar `./publicar.sh "descrição"`.

## Histórico (13/11/2026)
- **App real** em `app/`: 1.622 produtos com fotos e preços reais de Carnan, Piet, PACE, Sufgang, Disturb, Jordan e Adidas Originals (estas duas via Artwalk e Authentic Feet).
- **Atualização automática** todo dia às 8h no Mac. O histórico de preços começou hoje.
- **Para abrir:** rodar `app/servidor.sh` no Mac e acessar no iPhone pelo endereço que ele mostra (mesmo Wi-Fi).
- **Ainda sem fonte:** Maze, Carhartt WIP (só importado) e À La Garçonne.

## Próximos passos possíveis
1. Servidor ligar sozinho quando o Mac liga
2. Hospedar na internet para usar fora de casa
3. Importados (Farfetch etc.) com a regra de custo total e tag INTERNACIONAL
4. Notificações no iPhone
5. Cadastro em programas de afiliados (Awin, Lomadee) para Maze, Nike, Adidas e Farfetch
