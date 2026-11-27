#!/bin/bash
# Atualiza o catálogo do Garimpo:
#  1. lojas.txt  -> lojas multimarca VTEX (Artwalk, Authentic Feet), por marca
#  2. marcas.txt -> sites oficiais Shopify (/products.json)
# e registra o menor preço do dia de cada produto em data/historico.json.
set -u
cd "$(dirname "$0")"
mkdir -p data
HOJE=$(date +%F)
TMP=$(mktemp -d)
UA="Mozilla/5.0 (Garimpo; uso pessoal)"
[ -f data/historico.json ] || echo '{}' > data/historico.json
echo '[]' > "$TMP/marcas.json"
: > "$TMP/arquivos.tsv"   # marca <tab> arquivo
# para a seção "Chegou agora": o que já existia antes desta rodada
jq 'keys' data/historico.json > "$TMP/hist-antes.json"
jq '[.marcas[]?.nome]' data/marcas.json > "$TMP/marcas-antes.json" 2>/dev/null || echo '[]' > "$TMP/marcas-antes.json"

trim() { printf '%s' "$1" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//'; }

# marcas recomendadas com data de liberação no futuro ficam na fila (uma leva por semana)
aguardando() {
  awk -F'|' -v n="$1" -v h="$HOJE" '!/^#/ { g=$1; gsub(/^ +| +$/, "", g); d=$5; gsub(/^ +| +$/, "", d); if (g == n && d != "" && d > h) f=1 } END { exit !f }' marcas.txt
}

registrar_historico() {  # $1 = arquivo de catálogo
  jq --slurpfile cat "$1" --arg hoje "$HOJE" '
    reduce ($cat[0].produtos[] | {k: ($cat[0].site + ":" + .id), p: ([.variantes[] | select(.a) | .p] | min)} | select(.p != null)) as $x
      (.; .[$x.k][$hoje] = $x.p)' data/historico.json > "$TMP/h.json" && mv "$TMP/h.json" data/historico.json
}

# ---------- 1. Lojas multimarca (VTEX) ----------
grep -v '^#' lojas.txt | while IFS='|' read -r loja site marca buscas filtro; do
  loja=$(trim "$loja"); site=$(trim "$site"); marca=$(trim "$marca"); filtro=$(trim "$filtro")
  [ -z "$loja" ] && continue
  aguardando "$marca" && continue
  rm -f "$TMP"/v-*.json
  i=0
  IFS=';' read -ra termos <<< "$buscas"
  for termo in "${termos[@]}"; do
    termo=$(trim "$termo"); q=${termo// /%20}
    for de in 0 50 100 150 200 250; do
      i=$((i + 1))
      curl -s -L --compressed --max-time 40 -A "$UA" \
        "https://$site/api/catalog_system/pub/products/search?ft=$q&_from=$de&_to=$((de + 49))" | LC_ALL=C tr -d '\000-\037' > "$TMP/v-$i.json"
      n=$(jq 'if type == "array" then length else 0 end' "$TMP/v-$i.json" 2>/dev/null || echo 0)
      [ "$n" -gt 0 ] 2>/dev/null || { rm -f "$TMP/v-$i.json"; break; }
      [ "$n" -lt 50 ] && break
      sleep 1
    done
  done
  if ! ls "$TMP"/v-*.json >/dev/null 2>&1; then echo "✗ $loja / $marca: sem resposta"; continue; fi
  arquivo="data/$(echo "$site-$marca" | tr 'A-Z .' 'a-z--' | tr -cd 'a-z0-9.-').json"
  jq -s --arg marca "$marca" --arg loja "$loja" --arg site "$site" --arg filtro "$filtro" '
    [.[][]]
    | map(select(
        (.brand | ascii_downcase | test($filtro)) and
        ((.["Gêneros"] // .["gênero"] // .["Gênero"] // ["Unissex"]) | any(test("homens|masculino|unissex|unisex"; "i"))) and
        (.productName | test("infantil|feminin|juvenil|chuteira|beb[eê]|kids|menin"; "i") | not)))
    | unique_by(.productId)
    | {marca: $marca, loja: $loja, site: $site, atualizado: (now | todate), produtos: map({
        id: .productId, titulo: .productName, url: .link, ref: (.productReference // ""),
        tipo: ((.categories[0] // "") + " " + ((.["Tipo de Produto"] // []) | join(" "))), tags: [],
        publicado: .releaseDate,
        imagens: [.items[0].images[0:4][] | .imageUrl],
        variantes: [.items[] | {
          t: ((.Tamanho // [])[0] // (.name | split(" - ") | last)),
          p: (.sellers[0].commertialOffer.Price // 0),
          c: (.sellers[0].commertialOffer.ListPrice // 0),
          x: ([.sellers[0].commertialOffer.Installments[]? | select(.PaymentSystemName | test("pix"; "i")) | .Value] | min),
          a: ((.sellers[0].commertialOffer.AvailableQuantity // 0) > 0)}]
      })}' "$TMP"/v-*.json > "$arquivo"
  registrar_historico "$arquivo"
  printf '%s\t%s\n' "$marca" "$arquivo" >> "$TMP/arquivos.tsv"
  echo "✓ $loja / $marca: $(jq '.produtos | length' "$arquivo") produtos"
done

# ---------- 1b. Lojas internacionais (Shopify, por coleção) ----------
grep -v '^#' importados.txt | while IFS='|' read -r loja site marca colecao moeda frete envio; do
  loja=$(trim "$loja"); site=$(trim "$site"); marca=$(trim "$marca"); colecao=$(trim "$colecao")
  moeda=$(trim "$moeda"); frete=$(trim "$frete"); envio=$(trim "$envio")
  [ -z "$loja" ] && continue
  rm -f "$TMP"/i-*.json
  for pagina in 1 2 3 4; do
    curl -s -L --compressed --max-time 40 -A "$UA" "https://$site/collections/$colecao/products.json?limit=250&page=$pagina" -o "$TMP/i-$pagina.json"
    n=$(jq '.products | length' "$TMP/i-$pagina.json" 2>/dev/null || echo 0)
    [ "$n" -gt 0 ] 2>/dev/null || { rm -f "$TMP/i-$pagina.json"; break; }
    [ "$n" -lt 250 ] && break
    sleep 1
  done
  if ! ls "$TMP"/i-*.json >/dev/null 2>&1; then echo "✗ $loja / $marca: sem resposta"; continue; fi
  arquivo="data/$(echo "$site-$marca" | tr 'A-Z .' 'a-z--' | tr -cd 'a-z0-9.-').json"
  jq -s --arg marca "$marca" --arg loja "$loja" --arg site "$site" --arg moeda "$moeda" --argjson frete "$frete" --arg envio "$envio" '
    [.[].products[] | select(.title | test("women|wmns"; "i") | not) | {
      id: (.id | tostring), titulo: .title, url: ("https://" + $site + "/products/" + .handle), ref: "",
      tipo: .product_type, tags, publicado: .published_at,
      imagens: [.images[0:4][] | .src],
      variantes: [.variants[] | {t: .title, p: (.price | tonumber), c: ((.compare_at_price // "0") | tonumber), a: .available}]
    }] | {marca: $marca, loja: $loja, site: $site, atualizado: (now | todate),
          intl: {moeda: $moeda, frete: $frete, envio: $envio}, produtos: .}' "$TMP"/i-*.json > "$arquivo"
  printf '%s\t%s\n' "$marca" "$arquivo" >> "$TMP/arquivos.tsv"
  echo "✓ $loja / $marca (internacional): $(jq '.produtos | length' "$arquivo") produtos"
done

# câmbio do dia (Banco Central Europeu, via frankfurter.app); mantém o anterior se falhar
for m in USD EUR GBP; do
  curl -s -L --max-time 20 "https://api.frankfurter.app/latest?from=$m&to=BRL" | jq -e --arg m "$m" '{($m): .rates.BRL, data: .date}' 2>/dev/null
done | jq -s 'add' > "$TMP/cambio.json" && jq -e '.EUR' "$TMP/cambio.json" >/dev/null && mv "$TMP/cambio.json" data/cambio.json && echo "✓ Câmbio: EUR $(jq '.EUR' data/cambio.json)"

# regras de cada loja (desconto no Pix, frete grátis), lidas do site todo dia
echo "→ Regras das lojas (Pix e frete grátis)"
ruby lojas_info.rb 2>&1 | sed "s/^/  /" || true

# ---------- 1c. Lojas lidas pelo navegador do Mac (ex.: Your ID), salvas em extra/ ----------
# o robô não consegue abrir essas lojas; a tarefa diária do Mac grava extra/<loja>-<marca>.json e aqui elas entram no catálogo
for arquivo in extra/*.json; do
  [ -f "$arquivo" ] || continue
  marca=$(jq -r ".marca" "$arquivo")
  registrar_historico "$arquivo"
  printf "%s\t%s\n" "$marca" "$arquivo" >> "$TMP/arquivos.tsv"
  echo "✓ $(jq -r .loja "$arquivo") / $marca: $(jq ".produtos | length" "$arquivo") produtos (lidos pelo Mac em $(jq -r .atualizado "$arquivo" | cut -c1-10))"
done

# ---------- 2. Sites oficiais (Shopify) ----------
grep -v '^#' marcas.txt | while IFS='|' read -r nome site rel obs liberar; do
  nome=$(trim "$nome"); site=$(trim "$site"); rel=$(trim "$rel"); obs=$(trim "$obs"); liberar=$(trim "$liberar")
  [ -z "$nome" ] && continue
  if aguardando "$nome"; then echo "… $nome: entra na aba Novas em $liberar"; continue; fi
  # lojas Nuvemshop (ex.: nuvemshop:www.alagarconne.com.br): lidas pelas páginas de listagem
  if [[ "$site" == nuvemshop:* ]]; then
    site=${site#nuvemshop:}
    arquivo="data/$(echo "$site" | tr '.' '-').json"
    if ruby nuvemshop.rb "$site" "$nome" > "$TMP/ns.json" && [ "$(jq '.produtos | length' "$TMP/ns.json")" -gt 0 ]; then
      mv "$TMP/ns.json" "$arquivo"
      registrar_historico "$arquivo"
      printf '%s\t%s\n' "$nome" "$arquivo" >> "$TMP/arquivos.tsv"
      echo "✓ $nome: $(jq '.produtos | length' "$arquivo") produtos"
    else
      echo "✗ $nome: não consegui ler $site"
    fi
  elif [ -n "$site" ]; then
    rm -f "$TMP"/pagina-*.json
    for pagina in 1 2 3 4 5 6 7 8; do
      curl -s -L --max-time 40 -A "$UA" "https://$site/products.json?limit=250&page=$pagina" -o "$TMP/pagina-$pagina.json"
      n=$(jq '.products | length' "$TMP/pagina-$pagina.json" 2>/dev/null || echo 0)
      [ "$n" -gt 0 ] 2>/dev/null || { rm -f "$TMP/pagina-$pagina.json"; break; }
      [ "$n" -lt 250 ] && break
      sleep 1
    done
    if ls "$TMP"/pagina-*.json >/dev/null 2>&1; then
      arquivo="data/$(echo "$site" | tr '.' '-').json"
      jq -s --arg marca "$nome" --arg site "$site" '
        [.[].products[] | {
          id: (.id | tostring), titulo: .title, url: ("https://" + $site + "/products/" + .handle), ref: "",
          tipo: .product_type, tags, publicado: .published_at,
          imagens: [.images[0:4][] | .src],
          variantes: [.variants[] | {t: .title, p: (.price | tonumber), c: ((.compare_at_price // "0") | tonumber), a: .available}]
        }] | {marca: $marca, loja: ("Site " + $marca), site: $site, atualizado: (now | todate), produtos: .}' "$TMP"/pagina-*.json > "$arquivo"
      registrar_historico "$arquivo"
      printf '%s\t%s\n' "$nome" "$arquivo" >> "$TMP/arquivos.tsv"
      echo "✓ $nome: $(jq '.produtos | length' "$arquivo") produtos"
    else
      echo "✗ $nome: não consegui ler $site"
    fi
  fi
  arquivos=$(awk -F'\t' -v m="$nome" '$1 == m {print $2}' "$TMP/arquivos.tsv" | jq -R . | jq -s .)
  [ "$arquivos" = "[]" ] && [ -z "$site" ] && echo "– $nome: sem fonte automática"
  jq --arg nome "$nome" --arg site "$site" --arg rel "$rel" --arg obs "$obs" --arg lib "$liberar" --argjson arqs "$arquivos" \
    '. + [{nome: $nome, site: $site, relacao: $rel, obs: $obs, liberada: $lib, arquivos: $arqs}]' "$TMP/marcas.json" > "$TMP/m.json" && mv "$TMP/m.json" "$TMP/marcas.json"
done

# marcas achadas nas lojas lidas pelo Mac (Shop2gether, Nike…) que ainda não estão em marcas.txt entram como sugeridas
cut -f1 "$TMP/arquivos.tsv" | sort -u | while IFS= read -r nome; do
  [ -z "$nome" ] && continue
  jq -e --arg n "$nome" 'any(.[]; .nome == $n)' "$TMP/marcas.json" >/dev/null && continue
  arqs=$(awk -F'\t' -v m="$nome" '$1 == m {print $2}' "$TMP/arquivos.tsv" | jq -R . | jq -s .)
  lojas=$(for f in $(echo "$arqs" | jq -r '.[]'); do jq -r .loja "$f"; done | sort -u | paste -sd ", " -)
  jq --arg n "$nome" --arg obs "Achada na Black Friday ($lojas)" --argjson arqs "$arqs" '. + [{nome: $n, site: "", relacao: "sugerida", obs: $obs, liberada: "", arquivos: $arqs}]' "$TMP/marcas.json" > "$TMP/m.json" && mv "$TMP/m.json" "$TMP/marcas.json"
done

jq --arg hoje "$(date '+%d/%m/%Y %H:%M')" '{atualizado: $hoje, marcas: .}' "$TMP/marcas.json" > data/marcas.json
# ---------- Chegou agora: peças e marcas que entraram nesta rodada (o app mostra numa seção própria) ----------
[ -f data/novidades.json ] || echo '{"rodadas":[]}' > data/novidades.json
jq --slurpfile antes "$TMP/hist-antes.json" --slurpfile hist data/historico.json \
   --slurpfile mantes "$TMP/marcas-antes.json" --slurpfile marcas data/marcas.json \
   --arg quando "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg rotulo "$(TZ=America/Sao_Paulo date '+%d/%m às %Hh')" '
  ($antes[0] | map({(.): 1}) | add // {}) as $ja
  | ($mantes[0] | map({(.): 1}) | add // {}) as $mja
  | {quando: $quando, rotulo: $rotulo,
     pecas: [$hist[0] | keys[] | select($ja[.] | not)],
     marcas: [$marcas[0].marcas[].nome | select($mja[.] | not)]} as $r
  | .rodadas = ([$r] + .rodadas)[:6]' data/novidades.json > "$TMP/nov.json" && mv "$TMP/nov.json" data/novidades.json
echo "✓ Chegou agora: $(jq '.rodadas[0].pecas | length' data/novidades.json) peças e $(jq '.rodadas[0].marcas | length' data/novidades.json) marcas novas nesta rodada"

rm -rf "$TMP"
echo "Pronto. Dados em app/data/"
