# encoding: utf-8
# Lê a página inicial de cada loja e guarda as regras de pagamento e entrega em data/lojas-info.json:
#   pix: % de desconto no Pix (quando a loja anuncia no site)
#   freteGratis: valor a partir do qual o frete é grátis (0 = grátis em tudo)
# Regras conferidas à mão em lojas-info.txt têm prioridade sobre o que for lido do site.
require 'json'
require 'cgi'
require 'open3'

dir = __dir__
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'

lojas = {}
Dir[File.join(dir, 'data', '*.json')].each do |f|
  next if f =~ /marcas\.json|historico\.json|cambio\.json|alertas|lojas-info/
  j = JSON.parse(File.read(f, encoding: 'UTF-8')) rescue next
  lojas[j['loja']] ||= j['site'].to_s.sub(/^nuvemshop:/, '') if j['loja'] && j['site']
end

valor = ->(s) { s.to_s.gsub('.', '').tr(',', '.').to_f }
info = {}
lojas.each do |loja, site|
  html, = Open3.capture2('curl', '-sL', '--compressed', '-m', '25', '-A', UA, '-H', 'Accept: text/html', '-H', 'Accept-Language: pt-BR', "https://#{site}/")
  t = CGI.unescapeHTML(html.force_encoding('UTF-8').scrub.gsub(/<script.*?<\/script>|<style.*?<\/style>/m, ' ').gsub(/<[^>]+>/, ' ')).gsub(/\s+/, ' ')
  r = {}
  # "5% OFF no Pix", "5% de desconto no pagamento via Pix", "Pix com 10% de desconto"
  if (m = t.match(/(\d{1,2})\s*%\s*(?:de\s+desconto|off|de\s+off)?\s*(?:no|via|pagando\s+(?:com|via|no))?\s*(?:pagamento\s+(?:via|com|no)\s*)?pix/i) ||
          t.match(/pix\s*(?:com|e\s+ganhe|ganhe)?\s*(\d{1,2})\s*%/i))
    pct = m[1].to_i; r['pix'] = pct if pct.between?(1, 20)
  end
  # "frete grátis acima de R$ 399", "frete grátis a partir de R$399", "frete grátis em compras acima de R$ 299"
  if (m = t.match(/frete\s+gr[aá]tis[^.|$]{0,40}?(?:acima|a\s+partir)\s+de\s+R\$\s?([\d.]+(?:,\d{2})?)/i))
    r['freteGratis'] = valor.(m[1])
  elsif (m = t.match(/(?:est[aá](?:\s+a)?|faltam?)\s+R\$\s?([\d.]+(?:,\d{2})?)\s+(?:do|para\s+(?:o\s+)?|pra\s+(?:ganhar\s+)?)?frete\s+gr[aá]tis/i))
    r['freteGratis'] = valor.(m[1])   # carrinho vazio: "Você está a R$ 799,00 do frete grátis"
  end
  info[loja] = r unless r.empty?
  warn "#{loja}: #{r.empty? ? 'nada anunciado' : r}"
end

# regras conferidas à mão (loja<TAB>pix<TAB>frete grátis a partir de<TAB>observação)
manual = File.join(dir, 'lojas-info.txt')
if File.exist?(manual)
  File.readlines(manual, encoding: 'UTF-8').each do |l|
    next if l.strip.empty? || l.start_with?('#')
    loja, pix, frete, obs = l.chomp.split("\t")
    r = info[loja] ||= {}
    r['pix'] = pix.to_i if pix && !pix.strip.empty?
    r['freteGratis'] = frete.to_f if frete && !frete.strip.empty?
    r['freteObs'] = obs if obs && !obs.strip.empty?
  end
end

File.write(File.join(dir, 'data', 'lojas-info.json'), JSON.pretty_generate(info))
