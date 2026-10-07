"""Monta dist/comparativo_precos.html a partir de src/ + data/. Uso: npm install && python3 build.py"""
import re
t=open('src/tpl10.html').read()
head=t[:t.index('</style>')].replace('<title>Comparativo de Preços ADO</title>','<title>Comparativo de Preços</title>')
lib=open('node_modules/xlsx/dist/xlsx.core.min.js').read()
tpl=head+open('src/extra.css').read()+'</style>\n'+open('src/body.html').read()+'\n<script>'+lib+'</script>\n<script>\n'+open('src/app.js').read()+'</script>\n'
open('dist/comparativo_precos.html','w').write(tpl.replace('__DATA2__',open('data/data2.json').read()).replace('__DATA__',open('data/data.json').read()))
print('ok')
