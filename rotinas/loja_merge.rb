# encoding: utf-8
# Transforma a coleta de uma loja feita pelo navegador do Mac (Nike, adidas, Centauro...) em catálogos do app:
#   app/extra/<prefixo>-<marca>.json   (o robô na nuvem inclui esses arquivos em cada atualização)
# Uso: ruby rotinas/loja_merge.rb arquivo.json "Nome da loja" site prefixo
# arquivo.json: { id: { nome, url, de, por, pix, img, marca, tam? } }
require 'json'
require 'time'
require 'fileutils'

arq, loja, site, prefixo = ARGV
dados = JSON.parse(File.read(arq, encoding: 'UTF-8'))
por_marca = Hash.new { |h, k| h[k] = [] }
dados.each_value do |x|
  next unless x['nome'] && x['por'].to_f >= 10 && x['marca']
  de = x['de'].to_f > x['por'].to_f ? x['de'].to_f : 0
  pix = x['pix'] && x['pix'].to_f < x['por'].to_f ? x['pix'].to_f : nil
  tams = x['tam'].to_s.split(',').map(&:strip).reject(&:empty?)
  tams = ['Default Title'] if tams.empty?   # loja não informa tamanhos na lista: vale para todos
  por_marca[x['marca']] << {
    id: x['id'].to_s, titulo: x['nome'], url: x['url'], ref: '', tipo: x['tipo'].to_s, tags: [], publicado: nil,
    imagens: [x['img']].compact,
    variantes: tams.map { |t| { t: t, p: x['por'].to_f, c: de, x: pix, a: true } },
  }
end
dir = File.join(__dir__, '..', 'app', 'extra')
FileUtils.mkdir_p(dir)
Dir[File.join(dir, "#{prefixo}-*.json")].each { |f| File.delete(f) }
por_marca.each do |marca, produtos|
  nome = "#{prefixo}-" + marca.downcase.tr(' ', '-').gsub(/[^a-z0-9-]/, '')
  File.write(File.join(dir, "#{nome}.json"), JSON.generate(marca: marca, loja: loja, site: site, atualizado: Time.now.utc.iso8601, produtos: produtos))
  puts "#{marca}: #{produtos.size} peças"
end
