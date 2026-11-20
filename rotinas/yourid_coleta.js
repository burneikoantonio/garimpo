// Coleta da sale da Your ID (youridstore.com.br). A lista só aparece com a janela grande (1280x1000) e carrega devagar.
// Uso pelo navegador do app Claude, numa aba em https://www.youridstore.com.br/sale/c :
//   1) cole este arquivo inteiro uma vez (guarda o leitor na própria aba)          → "pronto"
//   2) para cada página N = 1, 2, 3...: navegue para https://www.youridstore.com.br/sale/c?pageNumber=N
//      e rode:  await eval(localStorage.getItem('yidPasso'))   → [página, peças novas, total]
//      pare quando "peças novas" vier 0 (ou menos de 24 = última página)
//   3) rode:  await eval(localStorage.getItem('yidEnviar'))     → URL do arquivo no ntfy para baixar no Mac
const yidLer = () => {
  const out = {};
  const cs = [...document.querySelectorAll('div.jet-container')].filter(c => {
    const hs = new Set([...c.querySelectorAll('a[href$="/p"]')].map(a => a.getAttribute('href')));
    return hs.size === 1 && c.querySelector('img') && /R\$/.test(c.innerText);
  });
  cs.sort((a, b) => a.innerHTML.length - b.innerHTML.length);   // a caixa menor de cada produto é o card dele
  for (const c of cs) {
    const href = c.querySelector('a[href$="/p"]').getAttribute('href');
    if (out[href]) continue;
    const txt = c.innerText.split('\n').map(s => s.trim()).filter(Boolean);
    const nome = txt.find(s => s.length > 12 && !/R\$|PIX|juros/i.test(s)) || txt[0];
    const precos = (c.innerText.match(/R\$\s?[\d.]+,\d{2}/g) || []).map(p => +p.replace(/[^\d,]/g, '').replace(',', '.'));
    const pix = /no PIX/i.test(c.innerText) ? precos[0] : null;
    const resto = pix ? precos.slice(1) : precos;
    const tams = txt.filter(s => /^\d{2}([,.]5)?$|^(PP|P|M|G|GG|2GG|XG)$/i.test(s));
    const im = [...c.querySelectorAll('img')].map(i => i.src).find(s => /\/produto\//.test(s));
    out[href] = {
      nome, url: 'https://www.youridstore.com.br/' + href.replace(/^\//, ''),
      de: Math.max(...resto), por: Math.min(...resto), pix, tam: tams.join(', '),
      img: im ? 'https://yourid.jetassets.com.br/produto/' + im.split('/produto/')[1] : null,
    };
  }
  return out;
};
localStorage.setItem('yidLer', yidLer.toString());
localStorage.setItem('yidDados', '{}');
localStorage.setItem('yidPasso', `(async () => { await new Promise(r => setTimeout(r, 6500)); const ler = eval('(' + localStorage.getItem('yidLer') + ')'); const d = JSON.parse(localStorage.getItem('yidDados') || '{}'); const novos = ler(); Object.assign(d, novos); localStorage.setItem('yidDados', JSON.stringify(d)); return [location.search, Object.keys(novos).length, Object.keys(d).length]; })()`);
localStorage.setItem('yidEnviar', `(async () => { const dados = localStorage.getItem('yidDados'); const t = 'achei-yid-' + Math.random().toString(36).slice(2, 12); const r = await fetch('https://ntfy.sh/' + t + '?filename=yid.json', { method: 'PUT', body: dados }); const j = await r.json(); return [r.status, Object.keys(JSON.parse(dados)).length, j.attachment && j.attachment.url]; })()`);
'pronto';
