// Coleta da Amazon Brasil: SÓ peças vendidas e entregues pela própria Amazon.com.br (filtro de vendedor p_6=A1ZZFT5FULY4LN).
// Vendedores de fora ficam de fora, mesmo com nota boa (risco de réplica). Roupas e tênis masculinos com desconto.
// Uso pelo navegador do app Claude, numa aba em https://www.amazon.com.br/ :
//   1) cole este arquivo inteiro uma vez                        → "pronto"
//   2) await amzColetar(0), await amzColetar(6), ...            → lê 6 marcas por vez; pare quando "marcas" acabar
//      (se vier "status 503", espere uns minutos e continue do mesmo ponto)
//   3) await amzEnviar()                                        → URL do arquivo no ntfy para baixar no Mac
//   No Mac: ruby rotinas/loja_merge.rb amz.json "Amazon" www.amazon.com.br amazon
window.AMZ = window.AMZ || {};
// nome no filtro de marca da Amazon → nome da marca no app
window.AMZ_MARCAS = [
  ['adidas', 'Adidas Originals'], ['Nike', 'Nike'], ['Jordan', 'Jordan'], ['Puma', 'Puma'], ['New Balance', 'New Balance'],
  ['ASICS', 'ASICS'], ['Mizuno', 'Mizuno'], ['Vans', 'Vans'], ['Converse', 'Converse'], ["Levi's", "Levi's"],
  ['The North Face', 'The North Face'], ['Lacoste', 'Lacoste'], ['Tommy Hilfiger', 'Tommy Hilfiger'], ['Calvin Klein', 'Calvin Klein'],
  ['Columbia', 'Columbia'], ['Champion', 'Champion'], ['Timberland', 'Timberland'], ['Oakley', 'Oakley'], ['Reserva', 'Reserva'],
  ['Hurley', 'Hurley'], ['Quiksilver', 'Quiksilver'], ['Element', 'Element'], ['Diesel', 'Diesel'], ['Fila', 'Fila'],
  ['Under Armour', 'Under Armour'], ['Carhartt', 'Carhartt WIP'], ['Dickies', 'Dickies'], ['Ellus', 'Ellus'],
];
const AMZ_FORA = /feminin|mulher|infantil|juvenil|kids|menina|menino|beb[eê]|meia|cueca|sutiã|calcinha|biquíni|maiô|toalha|garrafa|squeeze|carteira|perfume|rel[oó]gio|óculos|bola\b|cinto|chinelo|sand[aá]lia|mochila|bolsa|necessaire|pochete|chaveiro|luva/i;
window.amzLerDoc = (doc, marca) => {
  let n = 0;
  for (const c of doc.querySelectorAll('[data-component-type="s-search-result"][data-asin]')) {
    const asin = c.dataset.asin; if (!asin) continue;
    const hs = [...c.querySelectorAll('h2')].map(h => (h.innerText || h.textContent).trim());
    const nome = hs[hs.length - 1] || '';
    const num = s => +((s || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const por = num(c.querySelector('.a-price:not(.a-text-price) .a-offscreen')?.textContent);
    const de = num(c.querySelector('.a-price[data-a-strike="true"] .a-offscreen')?.textContent);
    const img = c.querySelector('img.s-image')?.src?.replace(/\._[^.]+_\./, '._AC_UL800_.');
    n++;
    if (!por || !de || de <= por || 1 - por / de < 0.2 || AMZ_FORA.test(nome) || !img) continue;
    AMZ[asin] = { nome, marca, por, de, img, url: 'https://www.amazon.com.br/dp/' + asin };
  }
  return n;
};
window.amzBusca = async (filtro, marca) => {
  let tot = 0;
  for (let p = 1; p <= 4; p++) {
    const u = `/s?k=masculino&rh=p_6%3AA1ZZFT5FULY4LN%2Cp_89%3A${encodeURIComponent(filtro)}&page=${p}`;
    const r = await fetch(u, { credentials: 'include' });
    if (r.status !== 200) return 'status ' + r.status;
    const n = amzLerDoc(new DOMParser().parseFromString(await r.text(), 'text/html'), marca);
    tot += n;
    if (n < 16) break;
    await new Promise(r => setTimeout(r, 1500));
  }
  return tot;
};
window.amzColetar = async (ini, q = 6) => {
  const out = [];
  for (const [filtro, marca] of AMZ_MARCAS.slice(ini, ini + q)) {
    const n = await amzBusca(filtro, marca); out.push(marca + ':' + n);
    if (String(n).startsWith('status')) break;
    await new Promise(r => setTimeout(r, 1500));
  }
  return [out.join(' '), 'com desconto: ' + Object.keys(AMZ).length, ini + q < AMZ_MARCAS.length ? 'próximo: ' + (ini + q) : 'fim'];
};
window.amzEnviar = async () => {
  const t = 'achei-amz-' + Math.random().toString(36).slice(2, 12);
  const r = await fetch(`https://ntfy.sh/${t}?filename=amz.json`, { method: 'PUT', body: JSON.stringify(AMZ) });
  const j = await r.json();
  return [r.status, Object.keys(AMZ).length, j.attachment?.url];
};
'pronto';
