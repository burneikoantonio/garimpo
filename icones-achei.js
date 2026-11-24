/* =========================================================
   ACHEI — ícones rabiscados, contornos tortos e ilustrações
   Estilo aprovado: ícones RETOS (rotação leve), traço tremido,
   segunda passada de traço e sombra vermelha deslocada.
   ========================================================= */

/* 1) Colocar UMA vez no <body>: filtros de "linha tremida" (3 sementes p/ efeito fervendo) */
const FILTROS_SVG = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="trem0"><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="2"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>
  <filter id="trem1"><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>
  <filter id="trem2"><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="17"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter>
  <filter id="tremIl"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="3.5"/></filter>
</defs></svg>`;

/* 2) Desenhos. Cada ícone = [traço principal, traço secundário, rabiscos extras]
      (rabiscos extras só aparecem em tamanho >= 32px) */
const TRACOS = {
  // ---- principais (abas + funções)
  ofertas:   ['M2.5 12.2V3.6h8.2l10.4 10.4-7.8 7.8z', 'M7.6 8.2a1.2 1.2 0 1 0 .1 0', 'M1.5 3.2l3 .2M15.5 20.8l3.4 1.4'],
  marcas:    ['M12 2.5l2.7 6.2 6.8.6-5.2 4.4 1.6 6.6L12 16.8l-5.9 3.5 1.6-6.6-5.2-4.4 6.8-.6z', 'M21.5 9.3l1.6-.3M12 1.2v1.3', 'M4 21.5l2.5-1.6'],
  importados:['M3.2 12a8.8 8.8 0 1 0 17.6 0a8.8 8.8 0 1 0-17.6 0', 'M2.4 12.3h19.4M12 3c2.8 2.7 3.8 5.8 3.8 9s-1 6.3-3.8 9c-2.8-2.7-3.8-5.8-3.8-9s1-6.3 3.8-9', 'M19 4.6l2.4-1.8'],
  salvos:    ['M12 20.5S3.6 15.4 3.6 9.3A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8.4 1.9c0 6.1-8.4 11.2-8.4 11.2z', 'M15.6 6l1.4-.5M19.8 4.6l1.6-1.3', 'M12 20.5l.4 2.3'],
  perfil:    ['M8 7.8a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M3.6 21.2c1-4.4 4-6.6 8.4-6.6s7.4 2.2 8.4 6.6', 'M2.4 21.4h3.2M17.8 2.6l1.8-1'],
  alertas:   ['M5 17.2h14l-1.8-2.4V9.9a5.2 5.2 0 0 0-10.4 0v4.9z', 'M9.8 20.2a2.2 2.2 0 0 0 4.4 0M12 4.7V2.8', 'M2.6 8.8l1.8.8M21.4 8.8l-1.8.8'],
  top10:     ['M3 19.4h18.5', 'M4.8 16.6 3.7 7.2l5 4L12 4.6l3.3 6.6 5-4-1.1 9.4z', 'M6.6 21.6l10.6-.7M10 9.7l1.7-.9M21.6 6.4l1.4-1'],   // coroa (substitui 🏆)
  baixou:    ['M2.4 5.2l7 7.6 4.2-4.2 8.2 9.2', 'M21.8 11v7.4h-7', 'M1.4 4l1.6 1.8'],                                     // substitui 📉
  combinar:  ['M8.6 3.6 3 6.9l2.2 4.4 2-1.1v10.4h9.6V10.2l2 1.1L21 6.9l-5.6-3.3c0 2-1.8 3.3-3.4 3.3S8.6 5.6 8.6 3.6z', 'M10.4 13h3.4M10 16h4.4', 'M2 6.2l1.4 1.2'], // substitui 👕
  simular:   ['M4.6 8.2h14.8l-1.3 12.2H5.9z', 'M8.8 8.2V6.4a3.2 3.2 0 0 1 6.4 0v1.8', 'M3.4 21.2h17.4M9 12.6l.6 1.4'],   // substitui 🛒
  // ---- apoio (pequenos: sem segunda passada, sombra vermelha MAIS forte)
  fechar:    ['M5 5.2l14 13.6M18.8 5 5.4 19', '', ''],
  voltar:    ['M15.4 4.2 7.6 12l7.8 7.8', 'M7.8 12h12.4', ''],
  abrir:     ['M6 18 18.2 5.8', 'M9.4 5.4h9.2v9.2', ''],          // substitui ↗
  filtro:    ['M5 8.8l7 7 7-7', '', ''],                            // substitui ▾ (girar 180° quando aberto)
  buscar:    ['M4.2 10.6a6.4 6.4 0 1 0 12.8 0a6.4 6.4 0 1 0-12.8 0', 'M15.4 15.6l5 5', ''],  // substitui ⌕
  seta:      ['M9 4.6l7.4 7.4L9 19.4', '', ''],                     // substitui ›
};
const APOIO = new Set(['fechar', 'voltar', 'abrir', 'filtro', 'buscar', 'seta']);

/* 3) Gera o SVG do ícone. tam em px. Para coração curtido: icone('salvos', 24, {cheio:true}) */
function icone(nome, tam = 22, { cheio = false } = {}) {
  const [a, b, extra] = TRACOS[nome];
  const pequeno = tam < 32 || APOIO.has(nome);
  const ds = [a, b].filter(Boolean);
  const off = pequeno ? 2.3 : 1.6;                 // "mais vermelho" no tamanho real
  const wR = pequeno ? 3.4 : 3.2, wB = 2.6;
  const giro = ((nome.length * 37) % 9) - 4;        // leve rotação fixa por ícone (-4° a 4°)
  const vermelho = ds.map(d => `<path d="${d}" stroke="#D7261E" stroke-width="${wR}"/>`).join('');
  const branco = ds.map(d => `<path d="${d}" stroke="currentColor" stroke-width="${wB}"/>`).join('');
  const passada2 = pequeno ? '' : ds.map(d => `<path d="${d}" stroke="currentColor" stroke-width="1.2" opacity=".75" transform="translate(1 -.8) rotate(2.5 12 12)"/>`).join('');
  const rabisco = (!pequeno && extra) ? `<path d="${extra}" stroke="currentColor" stroke-width="1.2" opacity=".8"/>` : '';
  const preenche = cheio ? `<path d="${a}" fill="#D7261E" stroke="none"/>` : '';
  return `<svg class="ic" width="${tam}" height="${tam}" viewBox="0 0 24 24" aria-hidden="true"
    style="overflow:visible;fill:none;stroke-linecap:round;stroke-linejoin:round;transform:rotate(${giro}deg)">
    <g class="trem" filter="url(#trem0)">${preenche}<g transform="translate(${off} ${off})">${vermelho}</g>${branco}${passada2}${rabisco}</g></svg>`;
}

/* 4) Contorno torto (botão secundário, chips, aba ativa, selos de resumo) */
function contornoTorto(cor = 'currentColor', esp = 1.8) {
  return `<svg viewBox="0 0 60 30" preserveAspectRatio="none" aria-hidden="true"><g filter="url(#trem0)">
    <path d="M3 5 L58 2 L56 28 L2 27 L4 3 L12 6" fill="none" stroke="${cor}" stroke-width="${esp}" stroke-linecap="round" vector-effect="non-scaling-stroke"/></g></svg>`;
}

/* 5) Interruptor (trilho torto) */
function interruptor() {
  return `<svg width="44" height="24" viewBox="0 0 44 24" aria-hidden="true"><g filter="url(#trem0)">
    <path class="trilho" d="M4 5 L41 3 L40 21 L3 20 Z" fill="none" stroke-width="1.8" stroke-linejoin="round"/>
    <rect class="caixa" x="7" y="7" width="12" height="10" transform="rotate(-6 13 12)"/></g></svg>`;
}

/* 6) Tremida + linha "fervendo" ao tocar. Ligar em: ícones, botões, coração, abas, interruptores.
      document.addEventListener('click', e => { const el = e.target.closest('button, a'); if (el) tremer(el); }); */
function tremer(el) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const alvo = el.querySelector('.ic') || el;
  alvo.classList.remove('tremer'); void alvo.getBoundingClientRect(); alvo.classList.add('tremer');
  el.querySelectorAll('.trem, [filter^="url(#trem"]').forEach(g => {
    let n = 0; const id = setInterval(() => {
      g.setAttribute('filter', `url(#trem${(++n) % 3})`);
      if (n > 5) { clearInterval(id); g.setAttribute('filter', 'url(#trem0)'); }
    }, 90);
  });
}

/* 7) Ilustrações das telas vazias (viewBox 0 0 60 50). [traço principal, detalhes em cinza] */
const ILUSTRACOES = {
  salvosVazio:   { titulo: 'Cabide vazio',     texto: 'Curta peças e elas aparecem aqui.',                      botao: 'Ver ofertas',
                   a: 'M30 6 C30 10,34 10,34 13 C34 16,30 17,30 17 L6 32 H54 L30 17', b: 'M2 4 H58 M16 42 L20 46 M44 42 L40 47 M30 44 L30 49' },
  semPromocao:   { titulo: 'Preço cheio',      texto: 'Tudo no preço normal hoje. A gente avisa quando cair.',   botao: 'Seguir mais marcas',
                   a: 'M8 24 V12 h14 l22 22 -14 14 Z M13 17 a1.5 1.5 0 1 0 .1 0', b: 'M38 8 L52 22 M52 8 L38 22' },
  buscaVazia:    { titulo: 'Não achei',        texto: 'Nenhuma peça com essa busca.',                            botao: 'Limpar busca',
                   a: 'M10 20 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0 M31 29 L44 42', b: 'M18 16 C18 12,26 12,26 16 C26 19,22 19,22 22 M22 26 L22 27 M48 10 L52 8 M50 16 L55 16' },
  semAlertas:    { titulo: 'Tudo quieto',      texto: 'Sem alertas por enquanto. Ligue o sino nas peças.',       botao: 'Ver ofertas',
                   a: 'M14 36 H40 L36 31 V21 a9 9 0 0 0 -18 0 V31 Z M24 40 a3 3 0 0 0 6 0', b: 'M42 8 H50 L42 16 H50 M50 20 H55 L50 25 H55' },
  simularVazio:  { titulo: 'Sacola vazia',     texto: 'Adicione peças para simular a compra.',                   botao: 'Ver ofertas',
                   a: 'M12 18 H48 L45 46 H15 Z M22 18 V13 a8 8 0 0 1 16 0 V18', b: 'M24 30 C26 33,34 33,36 30 M28 38 L29 38 M32 39 L33 39' },
  topVazio:      { titulo: 'Sem ranking hoje', texto: 'Ainda não há peças suficientes para o top 10.',           botao: 'Ver ofertas',
                   a: 'M14 40 L10 26 L20 31 L24 20 L32 28 L38 20 L40 36 Z', b: 'M2 44 H58 M48 12 L50 16 M52 10 L56 12 M46 18 L50 20' },
  semConexao:    { titulo: 'Sem sinal',        texto: 'A conexão caiu. Verifique a internet.',                   botao: 'Tentar de novo',
                   a: 'M30 40 a1.5 1.5 0 1 0 .1 0 M22 32 C26 28,34 28,38 32', b: 'M14 24 C22 16,38 16,46 24 M6 16 C18 4,42 4,54 16 M10 44 L50 6' },
};
function ilustracao(chave) {
  const { a, b } = ILUSTRACOES[chave];
  return `<svg width="120" height="100" viewBox="0 0 60 50" aria-hidden="true" style="overflow:visible;fill:none;stroke-linecap:round;stroke-linejoin:round">
    <g filter="url(#tremIl)"><g transform="translate(1.3 1.3)"><path d="${a}" stroke="#D7261E" stroke-width="2.4"/></g>
    <path d="${a}" stroke="currentColor" stroke-width="1.8"/><path d="${b}" stroke="#8a8a8a" stroke-width="1.3"/></g></svg>`;
}

/* 8) Carregamento: frase empilhada sorteada + ícone da aba se desenhando */
const FRASES_CARREGANDO = [['Fica', 'ligado'], ['Já tá', 'vindo'], ['Pera', 'aí'], ['Segura', 'aí'], ['Só um', 'segundo'], ['Achando', '']];
