# Lê o catálogo de uma loja Nuvemshop pelas páginas de listagem (/produtos/page/N/),
# que trazem preço, preço antigo, tamanho e estoque de cada produto em data-variants.
# Uso: ruby nuvemshop.rb <dominio> <marca> > arquivo.json
require 'json'
require 'cgi'
require 'time'

dominio, marca = ARGV.map { |a| a.dup.force_encoding('UTF-8') }
abort 'uso: ruby nuvemshop.rb <dominio> <marca>' unless dominio && marca
UA = 'Mozilla/5.0 (Garimpo; uso pessoal)'

produtos = {}
(1..30).each do |pagina|
  url = pagina == 1 ? "https://#{dominio}/produtos/" : "https://#{dominio}/produtos/page/#{pagina}/"
  html = `curl -s -L --compressed --max-time 40 -A '#{UA}' '#{url}'`.force_encoding('UTF-8').scrub('')
  blocos = html.split('js-item-product ').drop(1)
  break if blocos.empty?
  novos = 0
  blocos.each do |b|
    id = b[/data-product-id="(\d+)"/, 1] or next
    next if produtos[id]
    variantes_raw = b[/data-variants="([^"]*)"/, 1] or next
    variantes = JSON.parse(CGI.unescapeHTML(variantes_raw)) rescue next
    link = b[%r{href="(https://#{Regexp.escape(dominio)}/produtos/[^"]+)"}, 1]
    nome = CGI.unescapeHTML(b[/title="([^"]+)"/, 1] || b[/alt="([^"]+)"/, 1] || '')
    img = b[/data-srcset="([^" ]+)/, 1] || b[/srcset="([^" ]+)/, 1] || b[/src="(\/\/[^"]+)"/, 1]
    img = "https:#{img}" if img&.start_with?('//')
    produtos[id] = {
      id: id, titulo: nome, url: link, ref: '', tipo: '', tags: [], publicado: nil,
      imagens: img ? [img] : [],
      variantes: variantes.map do |v|
        tam = [v['option0'], v['option1'], v['option2']].compact.join(' / ')
        preco = v['price_number'].to_f
        antes = (v['compare_at_price_number'] || 0).to_f
        { t: tam.empty? ? 'Default Title' : tam, p: preco, c: antes, a: !!v['available'] }
      end
    }
    novos += 1
  end
  break if novos.zero?
  sleep 1
end

puts JSON.generate(marca: marca, loja: "Site #{marca}", site: dominio, atualizado: Time.now.utc.iso8601, produtos: produtos.values)
