#!/bin/bash
# Envia os arquivos do Garimpo para o GitHub num único commit, sem precisar do Git instalado.
# Uso: ./publicar.sh "mensagem do commit"
set -euo pipefail
cd "$(dirname "$0")"
GH=./.ferramentas/gh
REPO=${REPO:-burneikoantonio/garimpo}
MSG=${1:-"Atualiza o Garimpo"}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# o celular sempre baixa a versão nova das regras (evita cópia antiga em cache)
sed -i "" -E "s/core\.js\?v=[0-9]+/core.js?v=$(date +%s)/" app/index.html

base=$($GH api "repos/$REPO/git/ref/heads/main" --jq .object.sha)
base_tree=$($GH api "repos/$REPO/git/commits/$base" --jq .tree.sha)

# todos os arquivos do projeto, menos ferramentas locais e configurações do Mac.
# app/data só vai junto com INCLUIR_DADOS=1 (primeiro envio): depois disso quem cuida dos dados é o robô na nuvem.
excluir_dados=(-not -path './app/data/*')
[ "${INCLUIR_DADOS:-0}" = 1 ] && excluir_dados=()
find . -type f \
  -not -path './.git/*' -not -path './.ferramentas/*' -not -path './.claude/*' -not -path './.prefs/*' \
  -not -name '.DS_Store' ${excluir_dados[@]+"${excluir_dados[@]}"} | sed 's|^\./||' | sort > "$TMP/arquivos.txt"

echo '[]' > "$TMP/tree.json"
while IFS= read -r f; do
  jq -n --rawfile c <(base64 -i "$f") '{content: $c, encoding: "base64"}' > "$TMP/blob.json"
  sha=$($GH api "repos/$REPO/git/blobs" --input "$TMP/blob.json" --jq .sha)
  modo=100644; [ -x "$f" ] && modo=100755
  jq --arg p "$f" --arg s "$sha" --arg m "$modo" '. + [{path: $p, mode: $m, type: "blob", sha: $s}]' "$TMP/tree.json" > "$TMP/t2.json" && mv "$TMP/t2.json" "$TMP/tree.json"
done < "$TMP/arquivos.txt"

jq -n --arg b "$base_tree" --slurpfile t "$TMP/tree.json" '{base_tree: $b, tree: $t[0]}' > "$TMP/tree-body.json"
tree=$($GH api "repos/$REPO/git/trees" --input "$TMP/tree-body.json" --jq .sha)
jq -n --arg m "$MSG" --arg t "$tree" --arg p "$base" '{message: $m, tree: $t, parents: [$p]}' > "$TMP/commit.json"
commit=$($GH api "repos/$REPO/git/commits" --input "$TMP/commit.json" --jq .sha)
$GH api -X PATCH "repos/$REPO/git/refs/heads/main" -f sha="$commit" --silent
echo "Enviado: $(wc -l < "$TMP/arquivos.txt" | tr -d ' ') arquivos, commit ${commit:0:7}"
