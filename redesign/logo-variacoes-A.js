await new Promise(r => setTimeout(r, 2500)); await document.fonts.load('100px "Sedgwick Ave Display"');
const V = '#D7261E', P = '#141414', B = '#F2F2F2';
const base = (x, N, fundo, cor, sombra, extras, opt = {}) => {
  x.fillStyle = fundo; x.fillRect(0, 0, N, N);
  const s = N / 512; x.lineCap = 'round'; x.lineJoin = 'round';
  const tr = (c, w, d) => { x.save(); x.scale(s, s); x.strokeStyle = c; x.lineWidth = w; x.stroke(new Path2D(d)); x.restore(); };
  const fl = (c, d) => { x.save(); x.scale(s, s); x.fillStyle = c; x.fill(new Path2D(d)); x.restore(); };
  extras(tr, fl);
  x.save(); x.translate(N / 2 + (opt.dx || 0) * s, N * (opt.y || 0.52)); x.rotate((opt.rot ?? -8) * Math.PI / 180); x.font = `${N * (opt.tam || 0.62)}px "Sedgwick Ave Display"`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = sombra; x.fillText('A', N * 0.03, N * 0.03); x.fillStyle = cor; x.fillText('A', 0, 0); x.restore();
  if (opt.depois) opt.depois(tr, fl);
};
const colchetes = (tr, c) => { tr(c, 9, 'M120 150 L104 150 L104 362 L120 362'); tr(c, 9, 'M392 150 L408 150 L408 362 L392 362'); };
const sinais = (tr, c1, c2) => { tr(c2, 11, 'M150 410 C230 420 300 418 370 404'); tr(c1, 8, 'M372 96 L398 122 M398 96 L372 122'); tr(c2, 8, 'M96 412 L118 434 M118 412 L96 434'); tr(c2, 8, 'M176 104 L166 84 M196 100 L198 78'); tr(c1, 8, 'M330 110 L344 90'); };
window.variA = {
  'A1 · A vermelho': (x, N) => base(x, N, B, V, P, tr => { colchetes(tr, P); sinais(tr, P, P); }),
  'A2 · fundo preto': (x, N) => base(x, N, '#0d0d0d', B, V, tr => { colchetes(tr, B); sinais(tr, B, V); }),
  'A3 · rabisco em volta': (x, N) => base(x, N, B, P, V, tr => { tr(P, 8, 'M256 92 C380 86 438 170 430 262 C422 360 340 428 250 424 C150 420 82 350 84 258 C86 168 150 100 262 104 C300 106 330 112 352 124'); tr(V, 11, 'M372 448 L410 470'); tr(V, 8, 'M90 96 L112 118 M112 96 L90 118'); tr(P, 8, 'M420 84 L432 64 M444 104 L466 98'); }, { tam: 0.56 }),
  'A4 · quadrado torto': (x, N) => base(x, N, B, P, V, tr => { tr(P, 9, 'M98 104 L410 92 L418 404 L104 416 Z'); tr(V, 7, 'M110 116 L400 104 L404 394'); tr(V, 8, 'M436 440 L458 462 M458 440 L436 462'); tr(P, 8, 'M70 72 L60 52 M92 64 L96 42'); }, { tam: 0.56 }),
  'A5 · tinta escorrendo': (x, N) => base(x, N, B, P, V, tr => { colchetes(tr, P); tr(V, 8, 'M372 96 L398 122 M398 96 L372 122'); tr(V, 8, 'M176 104 L166 84 M196 100 L198 78'); }, { depois: (tr, fl) => { tr(P, 12, 'M196 356 L196 404'); fl(P, 'M196 410 a8 9 0 1 0 .1 0'); tr(P, 10, 'M302 340 L302 380'); fl(P, 'M302 386 a7 8 0 1 0 .1 0'); tr(V, 9, 'M246 372 L246 438'); fl(V, 'M246 444 a7 8 0 1 0 .1 0'); } }),
  'A6 · mais limpo': (x, N) => base(x, N, B, P, V, tr => { tr(V, 13, 'M140 418 C230 430 300 426 372 410'); tr(V, 9, 'M392 104 L416 128 M416 104 L392 128'); }, { tam: 0.68, y: 0.5 }),
};
const W = 3 * 300 + 4 * 30, H = 2 * 360 + 30; const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#2a2a2a'; x.fillRect(0, 0, W, H);
let i = 0; for (const [k, f] of Object.entries(variA)) { const t = document.createElement('canvas'); t.width = t.height = 300; f(t.getContext('2d'), 300); const X = 30 + (i % 3) * 330, Y = 30 + Math.floor(i / 3) * 360; x.save(); x.beginPath(); x.roundRect(X, Y, 300, 300, 66); x.clip(); x.drawImage(t, X, Y); x.restore(); x.fillStyle = '#fff'; x.font = '24px sans-serif'; x.textAlign = 'center'; x.fillText(k, X + 150, Y + 333); i++; }
const blob = await new Promise(r => c.toBlob(r, 'image/png')); const tp = 'achei-logo-' + Math.random().toString(36).slice(2, 10); const r = await fetch(`https://ntfy.sh/${tp}?filename=a.png`, { method: 'PUT', body: blob }); (await r.json()).attachment?.url
