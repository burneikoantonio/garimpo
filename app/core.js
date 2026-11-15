/* Achei — regras compartilhadas entre o app (navegador) e o robô de alertas (nuvem).
   Usa as variáveis globais S (preferências) e DATA (catálogo) definidas por quem carrega o arquivo. */

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const median = arr => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

/* ---------- Categorias e tamanhos ---------- */
const EXCLUIR = /feminin|\bwomen|\bwoman\b|\bwmns\b|\bmeias?\b|\bsocks?\b|\bbody\b|vestido|dress|\bsaia\b|skirt|baby tee|sufbab|gift|adesivo|sticker|bolsa|\bbags?\b|mochila|backpack|chaveiro|keychain|porta-moeda|cueca|boxer|caneca|poster|isqueiro|tableware|home decor|\bbooks?\b|magazine|textile|high times|gloves|scarves|wallet|cardholder|\bkids?\b|infantil|junior|\bjr\b|baby ?look|cropped|legging|suti[aã]|calcinha|biqu[ií]ni|t[uú]nica|macac[aã]o|blusa (de al[cç]a|seda)|drapead|corset|\bgirls?\b|top fitness|regata curta|frete motoboy|miniatura/;
// peças com tema político (pedido do usuário): ficam fora em qualquer marca
const POLITICA = /\blula\b|bolsonaro|\bmarx\b|\bche\b|guevara|mais um silva|brasil [eé] dos brasileiros|angela davis|malcol?m x|rosa parks|\bpresidente\b|elei[cç][aã]o|\bfaz o l\b/;
// tags e endereço também denunciam peça feminina ou infantil ("all-feminino" sem masculino; URL "-feminino-" nas lojas VTEX)
const FEM_TAG = /femin|women|mulher|\bkids?\b|infantil|sufbab/, OCULTO = /esconder-busca-site|excluirfeed|collection-only/, MASC_TAG = /masculin|\bmen\b|unissex|unisex/;
const KINDS = [
  ['tenis', /t[eê]nis|sneaker|footwear|sapato|\bbota|derby|loafer|mocassim|chinelo|\bslide/],
  ['bone', /(?<!- )\bbon[eé]s?(?![a-z])(?!\s*(white|wash|color|cor))|touca|\bhats?\b|\bcaps?\b|gorro|beanie|chap[eé]u|bucket|6-panel|dad ?hat|viseira/],
  ['acessorio', /\bmeias?\b|socks?\b|cinto|belt|carteira|wallet|acess[oó]r|[oó]culos|colar|corrente|pulseira|anel\b/],
  ['calca', /cal[cç]a|pants|jeans|trouser|jogger/],
  ['bermuda', /short|bermuda/],
  ['jaqueta', /jaqueta|jacket|coat|casaco|corta.?vento|blazer|colete|parka|windbreaker/],
  ['moletom', /moletom|hoodie|crewneck|sweat|su[eé]ter|sweater|tricot|cardigan|fleece|knit/],
  ['camiseta', /camiseta|t-shirt|\btees?\b|regata|tank/],
  ['camisa', /camisa|shirt|polo/],
];
const KIND_LABEL = { tenis: 'Tênis', bone: 'Bonés', acessorio: 'Acessórios', calca: 'Calças', bermuda: 'Bermudas', jaqueta: 'Jaquetas', moletom: 'Moletons', camiseta: 'Camisetas', camisa: 'Camisas', outro: 'Outros' };
function classify(p) {
  const main = `${p.tipo} ${p.titulo}`.toLowerCase();
  if (EXCLUIR.test(main) || POLITICA.test(main)) return null;
  const tags = (p.tags || []).join(' ').toLowerCase();
  if (OCULTO.test(tags) || (FEM_TAG.test(tags) && !MASC_TAG.test(tags))) return null;
  const slug = (p.url || '').toLowerCase().replace(/^https?:\/\/[^/]+/, '').replace(/[-_/?=]+/g, ' ');
  if (/\b(feminino|feminina|women|wmns|cropped|infantil|kids)\b/.test(slug)) return null;
  for (const [k, re] of KINDS) if (re.test(main)) return k;
  for (const [k, re] of KINDS) if (re.test(tags)) return k;
  return 'outro';
}
const groupOf = k => k === 'tenis' ? 'shoe' : (k === 'calca' || k === 'bermuda') ? 'bottom' : (k === 'bone' || k === 'acessorio') ? 'one' : 'top';
const catOf = k => k === 'tenis' ? 'Tênis' : (k === 'bone' || k === 'acessorio') ? 'Acessórios' : 'Roupas';
const TOP_EQ = { PP: ['PP', 'XS'], P: ['P', 'S'], M: ['M'], G: ['G', 'L'], GG: ['GG', 'XG', 'XL', '2G'], XGG: ['XGG', '2XG', 'XXL', '2XL', '3G'] };
const BOTTOM_EQ = { 36: ['36', '26', 'PP', 'XS'], 38: ['38', '28', 'P', 'S'], 40: ['40', '30', 'M'], 42: ['42', '32', 'G', 'L'], 44: ['44', '34', 'GG', 'XL', 'XG'], 46: ['46', '36', 'XGG', 'XXL', '2XL'] };
const tokens = t => t.toUpperCase().split(/[^0-9A-Z.]+/).filter(Boolean);
function fits(variantTitle, group) {
  if (group === 'one' || variantTitle === 'Default Title') return true;
  // cada categoria aceita vários tamanhos (ex.: tênis 41, 42 e 43)
  const lista = v => (Array.isArray(v) ? v : [v]).map(String);
  const want = group === 'top' ? lista(S.sizes.top).flatMap(s => TOP_EQ[s] || [])
    : group === 'bottom' ? lista(S.sizes.bottom).flatMap(s => BOTTOM_EQ[s] || [])
    : lista(S.sizes.shoe);
  const tk = tokens(variantTitle);
  return (want || []).some(w => tk.includes(w));
}
const sizeLabel = t => t === 'Default Title' ? 'Único' : t.split(/\s*[|/]\s*/)[0];

/* ---------- Importados: custo total em reais ---------- */
// Valores de referência (nov/2026). Compra em site estrangeiro fora do Remessa Conforme:
// imposto de importação 60% sobre produto + frete, ICMS 17% "por dentro", IOF 3,5% no cartão.
const TAXAS = { iof: 0.035, ii: 0.60, icms: 0.17 };
function custoImportado(intl, preco) {
  const taxa = DATA.cambio?.[intl.moeda]; if (!taxa) return null;
  const produto = preco * taxa, frete = intl.frete * taxa;
  const iof = (produto + frete) * TAXAS.iof;
  const ii = (produto + frete) * TAXAS.ii;
  const icms = (produto + frete + ii) / (1 - TAXAS.icms) - (produto + frete + ii);
  return { moeda: intl.moeda, preco, taxa, produto, frete, iof, ii, icms, total: Math.round(produto + frete + iof + ii + icms) };
}

/* ---------- Monta o catálogo ---------- */
// cats: [{ m: marca de marcas.json, c: arquivo de catálogo }]
function buildData(idx, cats, hist, cambio) {
  // o mesmo produto (mesma referência) em lojas diferentes vira um item só, com várias ofertas
  const porChave = new Map();
  for (const x of cats) {
    if (!x) continue;
    for (const p of x.c.produtos) {
      const kind = classify(p); if (!kind) continue;
      const oferta = { key: x.c.site + ':' + p.id, loja: x.c.loja || x.c.marca, url: p.url, variantes: p.variantes, intl: x.c.intl || null };
      const chave = p.ref ? `ref:${x.m.nome}:${p.ref}` : oferta.key;
      const atual = porChave.get(chave);
      if (atual) { atual.ofertas.push(oferta); continue; }
      porChave.set(chave, {
        key: chave, marca: x.m.nome, relacao: x.m.relacao, titulo: p.titulo, imagens: p.imagens || [],
        kind, group: groupOf(kind), cat: catOf(kind), publicado: p.publicado, ofertas: [oferta],
      });
    }
  }
  const produtos = [...porChave.values()];
  // mediana de preço por tipo de peça (para comparar com peças parecidas)
  const byKind = {};
  // preço justo: por quanto esse tipo de peça está saindo hoje na própria marca (mediana, já com as promoções)
  const byMarcaKind = {};
  for (const p of produtos) {
    const a = p.ofertas.filter(o => !o.intl).flatMap(o => o.variantes).filter(v => v.a); if (!a.length) continue;
    (byKind[p.kind] ||= []).push(Math.min(...a.map(v => v.p)));
    (byMarcaKind[p.marca + "|" + p.kind] ||= []).push(Math.min(...a.map(v => v.p)));
  }
  const justos = Object.fromEntries(Object.entries(byMarcaKind).filter(([, v]) => v.length >= 4).map(([k, v]) => [k, { preco: median(v), n: v.length }]));
  return { marcas: idx.marcas, atualizado: idx.atualizado, produtos, hist, cambio, justos, medianas: Object.fromEntries(Object.entries(byKind).map(([k, v]) => [k, median(v)])) };
}

/* ---------- Avaliação (Nota de Oferta) ---------- */
// histórico do produto: menor preço do dia entre todas as lojas
function productHist(p) {
  const dias = {};
  for (const o of p.ofertas) for (const [d, v] of Object.entries(DATA.hist[o.key] || {})) dias[d] = Math.min(dias[d] ?? Infinity, v);
  return Object.entries(dias).sort(([a], [b]) => a.localeCompare(b));
}

function evaluate(p) {
  const allVars = p.ofertas.flatMap(o => o.variantes);
  const avail = allVars.filter(v => v.a);
  const mine = avail.filter(v => fits(v.t, p.group));
  // melhor preço de cada loja (no seu tamanho, se o filtro estiver ligado)
  let lojas = p.ofertas.map(o => {
    if (o.intl && !S.showIntl) return null;
    const vs = o.variantes.filter(v => v.a && v.p >= 10 && (!S.onlyMySize || fits(v.t, p.group))); // abaixo de R$ 10 são brindes ou itens de teste das lojas
    if (!vs.length) return null;
    const best = vs.reduce((a, b) => (b.p < a.p ? b : a));
    const c = Math.max(0, ...vs.filter(v => v.p === best.p).map(v => v.c));
    if (o.intl) {
      const custo = custoImportado(o.intl, best.p); if (!custo) return null;
      return { loja: o.loja, url: o.url, price: custo.total, de: c > best.p ? custoImportado(o.intl, c).total : null, intl: o.intl, custo };
    }
    return { loja: o.loja, url: o.url, price: best.p, de: c > best.p ? c : null };
  }).filter(Boolean);
  // importado só fica se for pelo menos minSave% mais barato que a melhor loja do Brasil
  const brMin = Math.min(...lojas.filter(l => !l.intl).map(l => l.price));
  let intlDescartado = null;
  if (isFinite(brMin)) lojas = lojas.filter(l => {
    if (!l.intl || l.price <= brMin * (1 - S.minSave / 100)) return true;
    intlDescartado = l; return false;
  });
  lojas.sort((a, b) => a.price - b.price);
  if (!lojas.length) return { ok: false, mySize: mine.length > 0, avail };
  const { price, de } = lojas[0];
  const off = de ? 1 - price / de : 0;
  const med = DATA.medianas[p.kind] || price;
  const h = productHist(p);
  const prev = h.slice(0, -1).map(([, v]) => v);
  const temHist = prev.length > 0;
  const outras = lojas.slice(1).map(l => l.price);
  const parts = {
    desconto: clamp(off * 100, 0, 45),
    parecidas: clamp(10 + ((med - price) / med) * 50, 0, 30),
    historico: temHist ? (price <= Math.min(...prev) ? 15 : price < Math.min(...prev) * 1.05 ? 7 : 0) : 0,
    lojas: outras.length ? clamp(10 + ((median(outras) - price) / median(outras)) * 150, 0, 25) : 0,
  };
  const max = 75 + (temHist ? 15 : 0) + (outras.length ? 25 : 0);
  const score = Math.round(((parts.desconto + parts.parecidas + parts.historico + parts.lojas) / max) * 100);
  const baixou = temHist && price < prev[prev.length - 1];
  const novo = p.publicado && (Date.now() - new Date(p.publicado)) < 21 * 864e5;
  // preço justo: compara com o preço típico (hoje) desse tipo de peça na mesma marca
  const ref = DATA.justos?.[p.marca + "|" + p.kind];
  const justo = ref ? { preco: ref.preco, n: ref.n, dif: price / ref.preco - 1, nivel: price <= ref.preco * 0.75 ? "abaixo" : price >= ref.preco * 1.25 ? "acima" : "media" } : null;
  return { ok: true, price, de, off, med, parts, score, max, temHist, hist: h, baixou, novo, lojas, justo, intl: !!lojas[0].intl, intlDescartado, mySize: mine.length > 0, avail, mine, allVars };
}

/* ---------- Alertas para o celular (usado pelo robô na nuvem) ---------- */
// cfg: config.json · enviados: { "chave|preço": "AAAA-MM-DD" } · agora: Date
function gerarAlertas(cfg, enviados, agora) {
  const seguidas = new Set(cfg.marcas);
  const ativas = new Set(DATA.marcas.filter(m => seguidas.has(m.nome) || (cfg.incluirSugeridas && m.relacao === 'sugerida' && !(cfg.dispensadas || []).includes(m.nome))).map(m => m.nome));
  const alertas = [], candidatos = [];
  for (const p of DATA.produtos) {
    if (!ativas.has(p.marca)) continue;
    const e = evaluate(p); if (!e.ok) continue;
    candidatos.push({ p, e });
    const chave = `${p.key}|${e.price}`;
    if (enviados[chave]) continue;
    const anterior = e.hist.length > 1 ? e.hist[e.hist.length - 2][1] : null;
    if (e.baixou && e.score >= cfg.notaMin) alertas.push({ tipo: 'baixou', chave, p, e, anterior });
    else if (e.novo && seguidas.has(p.marca) && agora - new Date(p.publicado) < 36 * 3600e3) alertas.push({ tipo: 'novo', chave, p, e });
  }
  alertas.sort((a, b) => b.e.score - a.e.score);
  // resumo: a melhor oferta de cada marca, até 5
  const vistas = new Set();
  const resumo = candidatos.filter(x => x.e.off > 0).sort((a, b) => b.e.score - a.e.score)
    .filter(x => !vistas.has(x.p.marca) && vistas.add(x.p.marca)).slice(0, 5);
  return { alertas, resumo };
}

// Top 10 da semana: as melhores notas com desconto das marcas ativas (no máximo 2 por marca). Usado pelo robô e pelo app.
function top10(ativas) {
  const porMarca = {};
  return DATA.produtos.filter(p => ativas.has(p.marca)).map(p => ({ p, e: evaluate(p) }))
    .filter(x => x.e.ok && x.e.off > 0).sort((a, b) => b.e.score - a.e.score)
    .filter(x => (porMarca[x.p.marca] = (porMarca[x.p.marca] || 0) + 1) <= 2).slice(0, 10);
}
if (typeof module !== 'undefined') module.exports = { top10, buildData, evaluate, productHist, gerarAlertas, fits, classify, custoImportado, KIND_LABEL };
