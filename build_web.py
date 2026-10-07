"""Monta web/ (site estático com login Supabase). Uso: npm install xlsx@0.18.5 && python3 build_web.py
Gera web/index.html e web/app.bundle.js. Nenhum dado de preço fica nesses arquivos: ele vem do banco após o login."""
t=open('src/tpl10.html').read()
head=t[:t.index('</style>')].replace('<title>Comparativo de Preços ADO</title>','<title>Comparativo de Preços</title>')
css=open('src/extra.css').read()
body=open('src/body.html').read()
lib=open('node_modules/xlsx/dist/xlsx.core.min.js').read()
app=open('src/app.js').read()
app=app[:app.index('/* =============== ACESSO')]   # remove a camada de acesso do artifact
open('web/app.bundle.js','w').write(lib+'\n'+app)
html=('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
 +head+css+'</style></head><body class="locked">\n'+body+
 '\n<script src="supabase.js"></script>\n<script src="config.js"></script>\n<script src="loader.js"></script>\n</body></html>\n')
open('web/index.html','w').write(html)
print('ok',len(html),len(lib+app))
