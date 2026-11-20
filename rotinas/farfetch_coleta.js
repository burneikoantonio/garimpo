// Coleta dos importados na Farfetch Brasil. Roda DENTRO de uma aba aberta em https://www.farfetch.com/br/...
// (pelo navegador do app Claude). Cada chamada precisa terminar em menos de 45 s, então use em etapas:
//   1) cole este arquivo inteiro (define as funções)          → "pronto"
//   2) await ffColetar(0)  ... await ffColetar(N)              → lê as páginas da lista PAGINAS, 4 por vez
//   3) ffEscolher()                                             → separa os melhores (tênis e roupas)
//   4) await ffFotos(12)                                        → busca mais fotos de até 12 peças (para no 1º bloqueio)
//   5) await ffEnviar()                                         → manda para um canal temporário do ntfy e devolve a URL do arquivo
window.__FF = window.__FF || {};
window.PAGINAS = [
  // promoção da Black Friday (mais 20% automático). Fora da promoção essas páginas somem e são ignoradas.
  ...[...Array(20)].map((_, i) => `/br/promotions/men/black-friday?price=0-2000&category=135968&page=${i + 1}`),
  ...[...Array(24)].map((_, i) => `/br/promotions/men/black-friday?price=0-1500&category=136330&page=${i + 1}`),
  // sale normal
  ...[1, 2, 3, 4].map(p => `/br/shopping/men/sale/shoes-2/items.aspx?price=0-2000&page=${p}`),
  ...[1, 2, 3, 4].map(p => `/br/shopping/men/sale/clothing-2/items.aspx?price=0-1500&page=${p}`),
];
window.ffPagina = async (u) => {
  const r = await fetch(u, { credentials: 'include' });
  if (r.status !== 200) return 'status ' + r.status;
  const t = await r.text();
  const doc = new DOMParser().parseFromString(t, 'text/html');
  const sc = [...doc.scripts].find(s => s.textContent.includes('productCatalog'));
  if (!sc) return 'sem dados';
  const s = sc.textContent;
  const est = JSON.parse(JSON.parse(s.slice(s.indexOf('=') + 1).replace(/;\s*$/, ''))).apolloInitialState;
  const rq = est.ROOT_QUERY;
  const ck = Object.keys(rq).find(k => k.startsWith('productCatalog'));
  let n = 0;
  for (const { node: x } of rq[ck].edges) {
    const pp = x.productPrice || {};
    const full = pp.full?.value?.raw || x.price?.fullPriceValue?.raw || 0;
    const fin = pp.final?.value?.raw || x.price?.value?.raw || 0;
    const tams = (x.variationProperties || []).flatMap(v => (v.values || []).map(z => z.description)).filter(Boolean);
    const velho = __FF[x.id];
    __FF[x.id] = {
      id: x.id, marca: est[x.brand?.__ref]?.name || '', nome: x.shortDescription, de: full, por: fin,
      promo: (pp.discounts || []).some(d => d.type === 'PROMOTION'), tam: tams.join(', '),
      url: 'https://www.farfetch.com/br' + x.resourceIdentifier.path,
      imgs: velho?.imgs?.length > 2 ? velho.imgs : (x.images || []).sort((a, b) => a.order - b.order).map(i => i.size480?.url).filter(Boolean),
      cat: /135968|shoes/.test(u) ? 'shoes' : 'clothing',
    };
    n++;
  }
  return n;
};
window.ffColetar = async (ini) => {
  const out = [];
  for (const u of PAGINAS.slice(ini, ini + 4)) {
    const n = await ffPagina(u); out.push(n);
    if (String(n).startsWith('status 403')) break;
    await new Promise(r => setTimeout(r, 2000));
  }
  return [out.join(' '), Object.keys(__FF).length];
};
// mesmos critérios usados à mão em 17/11/2026
window.ffEscolher = () => {
  const FORA = /^(Karl Lagerfeld|Karl Lagerfeld Jeans|Moschino|Giuseppe Zanotti|TOM FORD|MC2 Saint Barth|Philipp Plein|Plein Sport|Dolce & Gabbana|Versace|Balmain|Roberto Cavalli|Just Cavalli|John Richmond|Bikkembergs|Ea7 Emporio Armani|Calvin Klein|Tommy Hilfiger|Crocs|UGG|Moon Boot|Birkenstock|Timberland|Dr\. Martens|Sebago)$/i;
  const RUIM = /brief|boxer|underwear|sock|swim|pyjama|robe|kids|baby|bodysuit|suit\b|tuxedo|waistcoat|tie\b|dress\b|skirt/i;
  const off = x => x.de ? 1 - x.por / x.de : 0;
  const escolhe = (lista, lim, n, max) => { const pm = {}; return lista.filter(x => !FORA.test(x.marca) && !RUIM.test(x.nome) && x.por > 0 && x.por <= lim).sort((a, b) => off(b) - off(a) || a.por - b.por).filter(x => (pm[x.marca] = (pm[x.marca] || 0) + 1) <= (/diesel/i.test(x.marca) ? 8 : max)).slice(0, n); };
  const v = Object.values(__FF);
  const ten = escolhe(v.filter(x => x.cat === 'shoes' && /sneaker|trainer|runner/i.test(x.nome) && off(x) >= 0.35), 2000, 140, 6);
  const rou = escolhe(v.filter(x => x.cat === 'clothing' && off(x) >= 0.4), 1500, 220, 6);
  window.__SEL = [...ten, ...rou];
  return [ten.length, rou.length];
};
// mais fotos: só na página do produto. A Farfetch bloqueia (403) depois de ~14 páginas, então vai aos poucos.
window.ffFotos = async (max = 12) => {
  let ok = 0, erro = '';
  for (const x of __SEL.filter(x => (x.imgs || []).length < 3).slice(0, max)) {
    try {
      const r = await fetch(x.url.replace('https://www.farfetch.com', ''), { credentials: 'include' });
      if (r.status !== 200) { erro = 'status ' + r.status; break; }
      const t = await r.text();
      const ids = [...new Set((t.match(new RegExp(`/${x.id}_(\\d+)_`, 'g')) || []).map(s => s.match(/_(\d+)_/)[1]))];
      const base = x.imgs[0]?.replace(/\/\d+_\d+_480\.jpg$/, '');
      if (ids.length > x.imgs.length && base) x.imgs = ids.slice(0, 6).map(i => `${base}/${x.id}_${i}_480.jpg`);
      ok++;
    } catch (e) { erro = e.message; break; }
    await new Promise(r => setTimeout(r, 1500));
  }
  return [ok, erro];
};
window.ffEnviar = async () => {
  const dados = JSON.stringify(__SEL.map(({ id, marca, nome, de, por, promo, tam, url, imgs, cat }) => ({ id, marca, nome, de, por, promo, tam, url, imgs, cat })));
  const topico = 'achei-ff-' + Math.random().toString(36).slice(2, 12);
  const r = await fetch(`https://ntfy.sh/${topico}?filename=ff.json`, { method: 'PUT', body: dados });
  const j = await r.json();
  return [r.status, __SEL.length, j.attachment?.url];
};
'pronto';
