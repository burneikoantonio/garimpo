# encoding: utf-8
require 'json'
require 'date'
# Junta a coleta do dia (arquivo baixado do ntfy) em app/farfetch.json.
# Uso: ruby rotinas/ff_merge.rb caminho/ff.json   (rodar na pasta do projeto)
# Peça vista hoje: preço e fotos atualizados. Peça que não aparece há mais de 3 dias sai (esgotou ou saiu da sale).
HOJE = Date.today.iso8601
Dir.chdir(File.join(__dir__, '..', 'app'))
ff = JSON.parse(File.read('farfetch.json', encoding: 'UTF-8'))
novos = JSON.parse(File.read(ARGV[0], encoding: 'UTF-8'))
NOME = { 'Études Studio' => 'Études', 'FEAR OF GOD ESSENTIALS' => 'Fear of God Essentials', 'A BATHING APE®' => 'A Bathing Ape', 'L/ab c/o Off-White' => 'Off-White', 'OUR LEGACY' => 'Our Legacy', 'Polo Ralph Lauren' => 'Ralph Lauren', 'DSQUARED2' => 'Dsquared2', 'HOKA' => 'Hoka' }
LUXO = /Off-White|Palm Angels|Dsquared2|Casablanca|Y-3|Represent|Purple Brand|Moncler|Stone Island|Amiri|Rhude|Golden Goose|Premiata|Diesel|C\.P\. Company|Fear of God/i
ACESS = /Carhartt WIP|ASICS|adidas|Autry|Salomon|New Balance|Nike|Lacoste|The North Face|Hoka|Vans|Converse|Mizuno|Saucony|PUMA|VEJA|Levi's|Melt|Crime London|Thom Krom|Satisfy|ENTIRE STUDIOS|Barbour|Hackett/i
id = ->(u) { u[/item-(\d+)/, 1] }
idx = ff['achados'].each_with_index.to_h { |a, i| [id.(a['url']), i] }
add = upd = 0
novos.each do |n|
  marca = NOME[n['marca']] || n['marca']
  item = { 'marca' => marca, 'nome' => "#{n['marca']} #{n['nome']}", 'de' => (n['de'] > n['por'] ? n['de'] : nil), 'por' => n['por'],
           'off' => n['de'] > 0 ? ((1 - n['por'].to_f / n['de']) * 100).round : 0, 'tam' => n['tam'], 'url' => n['url'],
           'img' => n['imgs'][0], 'imgs' => n['imgs'], 'blackFriday' => n['promo'], 'visto' => HOJE }
  if (i = idx[n['id']]) && (ff['achados'][i]['imgs'] || []).size > item['imgs'].size then item['imgs'] = ff['achados'][i]['imgs']; item['img'] = item['imgs'][0] end
  if (i = idx[n['id']]) then ff['achados'][i] = item; upd += 1 else ff['achados'] << item; add += 1 end
  unless ff['marcas'].any? { |m| m['nome'] == marca }
    faixa = marca =~ ACESS ? 'acessivel' : marca =~ LUXO ? 'premium' : 'premium'
    ff['marcas'] << { 'nome' => marca, 'faixa' => faixa, 'frase' => 'Achado na Black Friday da Farfetch', 'busca' => n['marca'].downcase }
  end
end
ff['achados'].each { |a| a['visto'] ||= HOJE }
antes = ff['achados'].size
ff['achados'].select! { |a| (Date.parse(HOJE) - Date.parse(a['visto'])).to_i <= 3 }
puts 'saíram ' + (antes - ff[%q(achados)].size).to_s
ff['escolhidosEm'] = HOJE
ff['limite'] = 2000
if ff['achados'].any? { |a| a['blackFriday'] } then ff['blackFriday'] = 'Black Friday da Farfetch: mais 20% de desconto aplicado automaticamente nas peças marcadas (já incluso no preço).' else ff.delete('blackFriday') end
File.write('farfetch.json', JSON.pretty_generate(ff))
puts "novos #{add}, atualizados #{upd}, total #{ff['achados'].size}, marcas #{ff['marcas'].size}"
