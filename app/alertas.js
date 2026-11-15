// Robô de avisos do Achei: roda na nuvem depois de cada atualização e manda as ofertas para o app ntfy.
// Variáveis de ambiente: NTFY_TOPIC (canal secreto do ntfy), SITE_URL (endereço do app), DRY_RUN=1 só imprime.
// Preferências do celular (salvos, alertas de modelo, tamanhos) chegam pelo canal "<NTFY_TOPIC>-prefs"
// e ficam guardadas em .prefs/prefs.json (cache do GitHub, fora do projeto público).
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const ler = (f, padrao) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { if (padrao !== undefined) return padrao; throw e; } };
const PREFS = path.join(dir, '..', '.prefs', 'prefs.json');
// modo teste (CANAL_TESTE): usa outro canal e não grava nada, para não afetar os avisos de verdade
const TESTE = !!process.env.CANAL_TESTE;
const TOPICO = process.env.CANAL_TESTE || process.env.NTFY_TOPIC;

async function carregarPrefs() {
  let guardadas = null;
  if (!TESTE) try { guardadas = JSON.parse(fs.readFileSync(PREFS, 'utf8')); } catch (e) {}
  const topic = TOPICO;
  if (topic) {
    try {
      const r = await fetch(`https://ntfy.sh/${topic}-prefs/json?poll=1&since=all`);
      const linhas = (await r.text()).trim().split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(m => m.event === 'message');
      for (const m of linhas) {
        const p = JSON.parse(m.message);
        if (!guardadas || (p.em || 0) > (guardadas.em || 0)) guardadas = p;
      }
    } catch (e) { console.error('Não consegui ler as preferências do celular:', e.message); }
  }
  if (guardadas && !TESTE) {
    fs.mkdirSync(path.dirname(PREFS), { recursive: true }); fs.writeFileSync(PREFS, JSON.stringify(guardadas));
    // reenvia a versão mais recente para o canal, que guarda mensagens por só 12 horas
    try { await fetch('https://ntfy.sh', { method: 'POST', body: JSON.stringify({ topic: `${topic}-prefs`, message: JSON.stringify(guardadas) }) }); } catch (e) {}
  }
  return guardadas;
}

(async () => {
  const cfg = ler('config.json');
  const prefs = await carregarPrefs();
  globalThis.S = { sizes: prefs?.tamanhos || cfg.tamanhos, onlyMySize: true, showIntl: cfg.importados.mostrar, minSave: cfg.importados.economiaMinima };
  if (prefs?.follow?.length) cfg.marcas = prefs.follow;
  cfg.dispensadas = prefs?.dispensadas || [];
  const core = require('./core.js');

  const idx = ler('data/marcas.json');
  const cats = idx.marcas.flatMap(m => (m.arquivos || []).map(a => ({ m, c: ler(a, null) }))).filter(x => x.c);
  globalThis.DATA = core.buildData(idx, cats, ler('data/historico.json', {}), ler('data/cambio.json', null));

  const agora = new Date();
  const hoje = agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  const hora = +agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false });
  const domingo = new Date(hoje + 'T12:00:00').getDay() === 0;
  const ARQ_ENVIADOS = 'data/alertas-enviados.json';
  const enviados = ler(ARQ_ENVIADOS, {});
  for (const [k, d] of Object.entries(enviados)) if ((agora - new Date(d)) > 30 * 864e5) delete enviados[k]; // esquece após 30 dias

  const site = (process.env.SITE_URL || '').replace(/\/$/, '');
  const link = p => site ? `${site}/#produto=${encodeURIComponent(p.key)}` : undefined;
  const brl = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const foto = p => p.imagens[0] ? p.imagens[0] + (p.imagens[0].includes('vteximg') ? '' : (p.imagens[0].includes('?') ? '&' : '?') + 'width=400') : undefined;
  let enviadosAgora = 0;

  async function enviar(msg) {
    enviadosAgora++;
    if (process.env.DRY_RUN || !TOPICO) { console.log('[aviso]', msg.title, '—', msg.message.replace(/\n/g, ' | ')); return; }
    const r = await fetch('https://ntfy.sh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: TOPICO, ...msg }) });
    if (!r.ok) console.error('ntfy respondeu', r.status, await r.text());
  }
  const avisoPeca = (titulo, p, e, extra, tag) => enviar({
    title: titulo, tags: [tag],
    message: `${p.titulo}\n${brl(e.price)}${extra ? " " + extra : ""}${e.score > 0 ? ` · nota ${e.score}` : ""}\n${e.lojas[0].loja}`,
    click: link(p) || e.lojas[0].url, attach: foto(p),
  });

  // 1. Peças salvas no celular: preço no seu tamanho abaixo do alvo
  let nSalvos = 0;
  for (const [key, s] of Object.entries(prefs?.salvos || {})) {
    const p = DATA.produtos.find(x => x.key === key); if (!p) continue;
    const e = core.evaluate(p); if (!e.ok) continue;
    // com alvo: preço no alvo. Sem alvo ("auto"): preço fora do comum
    const anterior = e.hist.length > 1 ? e.hist[e.hist.length - 2][1] : null;
    const motivo = s.alvo ? (e.price <= s.alvo ? `(seu alvo: ${brl(s.alvo)})` : null)
      : e.temHist && e.parts.historico >= 15 && anterior && e.price < anterior ? '(menor preço já visto)'
      : anterior && e.price <= anterior * 0.9 ? `(era ${brl(anterior)})`
      : e.justo?.nivel === 'abaixo' ? `(${Math.round(-e.justo.dif * 100)}% abaixo do preço justo)`
      : null;
    if (!motivo) continue;
    const chave = `salvo|${key}|${e.price}`; if (enviados[chave]) continue;
    await avisoPeca(`🔔 ${p.marca}: preço ${s.alvo ? 'no seu alvo' : 'fora do comum'}`, p, e, motivo, 'bell');
    enviados[chave] = hoje; nSalvos++;
  }

  // 2. Alertas de modelo: palavras no nome, nos seus tamanhos, até o preço máximo (até 3 por alerta)
  let nModelos = 0;
  for (const m of prefs?.modelos || []) {
    const ws = m.texto.toLowerCase().split(/\s+/).filter(Boolean);
    const achados = DATA.produtos.filter(p => ws.every(w => (p.marca + ' ' + p.titulo).toLowerCase().includes(w)))
      .map(p => ({ p, e: core.evaluate(p) })).filter(x => x.e.ok && x.e.price <= m.max).sort((a, b) => a.e.price - b.e.price);
    let n = 0;
    for (const { p, e } of achados) {
      const chave = `modelo|${m.id}|${p.key}|${e.price}`; if (enviados[chave]) continue;
      if (n >= 3) break;
      await avisoPeca(`Achei "${m.texto}" até ${brl(m.max)}`, p, e, e.de ? `(de ${brl(e.de)})` : '', 'mag');
      enviados[chave] = hoje; n++; nModelos++;
    }
  }

  // 3. Quedas de preço e lançamentos das suas marcas
  const { alertas, resumo } = core.gerarAlertas(cfg, enviados, agora);
  const individuais = alertas.slice(0, cfg.avisosPorVez);
  for (const a of individuais) {
    const anterior = a.anterior ? `(era ${brl(a.anterior)})` : a.e.de ? `(de ${brl(a.e.de)})` : '';
    await avisoPeca(a.tipo === 'baixou' ? `Baixou: ${a.p.marca}` : `Novo: ${a.p.marca}`, a.p, a.e, anterior, a.tipo === 'baixou' ? 'chart_with_downwards_trend' : 'new');
  }
  if (alertas.length > individuais.length) {
    const resto = alertas.slice(individuais.length);
    await enviar({ title: `Mais ${resto.length} ofertas no Achei`, message: resto.slice(0, 6).map(a => `• ${a.p.marca} ${a.p.titulo}: ${brl(a.e.price)}`).join('\n'), tags: ['shopping'], click: site || undefined });
  }
  for (const a of alertas) enviados[a.chave] = hoje;

  // 4. Leva nova de marcas recomendadas: avisa uma vez, no dia em que entra na aba Novas
  const levaHoje = idx.marcas.filter(m => m.relacao === 'sugerida' && !cfg.dispensadas.includes(m.nome) && m.liberada === hoje && (m.arquivos || []).length);
  if (levaHoje.length && !enviados[`leva|${hoje}`]) {
    await enviar({ title: 'Marcas novas para você', message: `${levaHoje.map(m => m.nome).join(', ')} entraram na aba Marcas. Siga as que gostar.`, tags: ['sparkles'], click: site || undefined });
    enviados[`leva|${hoje}`] = hoje;
  }

  // 5. Top 10 da semana: domingo, na rodada da tarde (no máximo 2 peças por marca)
  let top = false;
  if (domingo && hora >= cfg.resumoAPartirDas && !enviados[`top10|${hoje}`]) {
    const seguidas = new Set(cfg.marcas);
    const ativas = new Set(DATA.marcas.filter(m => seguidas.has(m.nome) || (cfg.incluirSugeridas && m.relacao === 'sugerida' && !(cfg.dispensadas || []).includes(m.nome))).map(m => m.nome));
    const porMarca = {};
    const lista = DATA.produtos.filter(p => ativas.has(p.marca)).map(p => ({ p, e: core.evaluate(p) }))
      .filter(x => x.e.ok && x.e.off > 0).sort((a, b) => b.e.score - a.e.score)
      .filter(x => (porMarca[x.p.marca] = (porMarca[x.p.marca] || 0) + 1) <= 2).slice(0, 10);
    if (lista.length) {
      await enviar({ title: 'Top 10 da semana no Achei', message: lista.map((x, i) => `${i + 1}. ${x.p.marca} ${x.p.titulo}: ${brl(x.e.price)} (-${Math.round(x.e.off * 100)}%)`).join('\n'), tags: ['trophy'], click: site || undefined });
      enviados[`top10|${hoje}`] = hoje; top = true;
    }
  }

  // 6. Resumo do dia: na rodada da tarde, se nenhum aviso saiu hoje
  const saiuHoje = Object.values(enviados).includes(hoje);
  if (!saiuHoje && hora >= cfg.resumoAPartirDas && resumo.length) {
    await enviar({ title: 'Resumo do dia no Achei', message: resumo.map(x => `• ${x.p.marca} ${x.p.titulo}: ${brl(x.e.price)} (-${Math.round(x.e.off * 100)}%)`).join('\n'), tags: ['shopping'], click: site || undefined });
    enviados[`resumo|${hoje}`] = hoje;
  }

  if (!TESTE) fs.writeFileSync(path.join(dir, ARQ_ENVIADOS), JSON.stringify(enviados, null, 1));
  console.log(`Preferências do celular: ${prefs ? `sim (${Object.keys(prefs.salvos || {}).length} salvos, ${(prefs.modelos || []).length} alertas de modelo)` : 'não recebidas ainda'}`);
  console.log(`Avisos: ${enviadosAgora} enviados (salvos ${nSalvos}, modelos ${nModelos}, quedas/lançamentos ${alertas.length}, top 10 ${top ? 'sim' : 'não'})`);
})();
