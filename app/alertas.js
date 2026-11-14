// Robô de avisos do Garimpo: roda na nuvem depois de cada atualização e manda as ofertas para o app ntfy.
// Variáveis de ambiente: NTFY_TOPIC (canal secreto do ntfy), SITE_URL (endereço do app), DRY_RUN=1 só imprime.
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const ler = (f, padrao) => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { if (padrao !== undefined) return padrao; throw e; } };

const cfg = ler('config.json');
globalThis.S = { sizes: cfg.tamanhos, onlyMySize: true, showIntl: cfg.importados.mostrar, minSave: cfg.importados.economiaMinima };
const core = require('./core.js');

const idx = ler('data/marcas.json');
const cats = idx.marcas.flatMap(m => (m.arquivos || []).map(a => ({ m, c: ler(a, null) }))).filter(x => x.c);
globalThis.DATA = core.buildData(idx, cats, ler('data/historico.json', {}), ler('data/cambio.json', null));

const agora = new Date();
const hoje = agora.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const hora = +agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false });
const ARQ_ENVIADOS = 'data/alertas-enviados.json';
const enviados = ler(ARQ_ENVIADOS, {});
for (const [k, d] of Object.entries(enviados)) if ((agora - new Date(d)) > 30 * 864e5) delete enviados[k]; // esquece após 30 dias

const site = (process.env.SITE_URL || '').replace(/\/$/, '');
const link = p => site ? `${site}/#produto=${encodeURIComponent(p.key)}` : undefined;
const brl = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
const foto = p => p.imagens[0] ? p.imagens[0] + (p.imagens[0].includes('vteximg') ? '' : (p.imagens[0].includes('?') ? '&' : '?') + 'width=400') : undefined;

async function enviar(msg) {
  if (process.env.DRY_RUN || !process.env.NTFY_TOPIC) { console.log('[aviso]', msg.title, '—', msg.message); return; }
  const r = await fetch('https://ntfy.sh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: process.env.NTFY_TOPIC, ...msg }) });
  if (!r.ok) console.error('ntfy respondeu', r.status, await r.text());
}

(async () => {
  const { alertas, resumo } = core.gerarAlertas(cfg, enviados, agora);
  const individuais = alertas.slice(0, cfg.avisosPorVez);
  for (const a of individuais) {
    const { p, e } = a;
    const loja = e.lojas[0].loja + (e.intl ? ' · INTERNACIONAL' : '');
    await enviar({
      title: a.tipo === 'baixou' ? `Baixou: ${p.marca}` : `Novo: ${p.marca}`,
      message: `${p.titulo}\n${brl(e.price)}${a.anterior ? ` (era ${brl(a.anterior)})` : e.de ? ` (de ${brl(e.de)})` : ''} · nota ${e.score}\n${loja}`,
      tags: [a.tipo === 'baixou' ? 'chart_with_downwards_trend' : 'new'],
      click: link(p) || e.lojas[0].url, attach: foto(p),
    });
  }
  if (alertas.length > individuais.length) {
    const resto = alertas.slice(individuais.length);
    await enviar({ title: `Mais ${resto.length} ofertas no Garimpo`, message: resto.slice(0, 6).map(a => `• ${a.p.marca} ${a.p.titulo}: ${brl(a.e.price)}`).join('\n'), tags: ['shopping'], click: site || undefined });
  }
  for (const a of alertas) enviados[a.chave] = hoje;

  // resumo do dia: na última rodada, se nenhum aviso saiu hoje
  const saiuHoje = Object.values(enviados).includes(hoje);
  if (!saiuHoje && hora >= cfg.resumoAPartirDas && resumo.length) {
    await enviar({ title: 'Resumo do dia no Garimpo', message: resumo.map(x => `• ${x.p.marca} ${x.p.titulo}: ${brl(x.e.price)} (-${Math.round(x.e.off * 100)}%)`).join('\n'), tags: ['shopping'], click: site || undefined });
    enviados[`resumo|${hoje}`] = hoje;
  }
  fs.writeFileSync(path.join(dir, ARQ_ENVIADOS), JSON.stringify(enviados, null, 1));
  console.log(`Avisos: ${alertas.length} novos (${individuais.length} individuais), resumo: ${!saiuHoje && hora >= cfg.resumoAPartirDas ? 'sim' : 'não'}`);
})();
