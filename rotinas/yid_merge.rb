# encoding: utf-8
# Transforma a coleta da sale da Your ID (feita pelo navegador do Mac) em catálogos do app, um por marca:
#   app/extra/youridstore-<marca>.json   (o robô na nuvem inclui esses arquivos em cada atualização)
# Uso: ruby rotinas/yid_merge.rb caminho/yid.json   (rodar na pasta do projeto)
require 'json'
require 'time'
require 'fileutils'

dados = JSON.parse(File.read(ARGV[0], encoding: 'UTF-8'))
MARCAS = [
  [/jordan/i, 'Jordan'], [/\bnike\b|air max|air force|kobe|dunk|air trainer/i, 'Nike'], [/adidas/i, 'Adidas Originals'],
  [/new balance/i, 'New Balance'], [/asics/i, 'ASICS'], [/\bpuma\b/i, 'Puma'], [/\bvans\b/i, 'Vans'], [/converse/i, 'Converse'],
  [/pleasu?a?res/i, 'Pleasures'], [/\bmarket\b/i, 'Market'], [/\bon (cloud|running)/i, 'On'],
]
por_marca = Hash.new { |h, k| h[k] = [] }
dados.each_value do |x|
  next unless x['nome'] && x['por'].to_f > 0
  marca = MARCAS.find { |re, _| x['nome'] =~ re }&.last or next
  tams = x['tam'].to_s.split(',').map(&:strip).reject(&:empty?).uniq
  tams = ['Único'] if tams.empty?
  de = x['de'].to_f > x['por'].to_f ? x['de'].to_f : 0
  por_marca[marca] << {
    id: x['url'][%r{br/([^/]+)/p}, 1] || x['url'], titulo: x['nome'], url: x['url'], ref: '', tipo: '', tags: [], publicado: nil,
    imagens: [x['img']].compact,
    variantes: tams.map { |t| { t: t, p: x['por'].to_f, c: de, x: (x['pix'] && x['pix'].to_f < x['por'].to_f ? x['pix'].to_f : nil), a: true } },
  }
end
dir = File.join(__dir__, '..', 'app', 'extra')
FileUtils.mkdir_p(dir)
Dir[File.join(dir, 'youridstore-*.json')].each { |f| File.delete(f) }   # marca que saiu da sale some
por_marca.each do |marca, produtos|
  nome = 'youridstore-' + marca.downcase.tr(' ', '-').gsub(/[^a-z0-9-]/, '')
  File.write(File.join(dir, "#{nome}.json"), JSON.generate(marca: marca, loja: 'Your ID', site: 'www.youridstore.com.br', atualizado: Time.now.utc.iso8601, produtos: produtos))
  puts "#{marca}: #{produtos.size} peças"
end
