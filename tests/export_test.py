from playwright.sync_api import sync_playwright
import os,base64,sys
R=os.path.abspath('.')
MAP={'exceljs/4.4.0/exceljs.min.js':'node_modules/exceljs/dist/exceljs.min.js','jspdf/2.5.1/jspdf.umd.min.js':'node_modules/jspdf/dist/jspdf.umd.min.js','jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js':'node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.min.js'}
def route(r):
    u=r.request.url
    for k,v in MAP.items():
        if k in u: return r.fulfill(path=os.path.join(R,v),content_type='application/javascript')
    if 'fonts.g' in u: return r.abort()
    r.continue_()
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1300,'height':900})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    pg.route('**/*',route)
    pg.add_init_script(path='tests/mock.js')
    pg.add_init_script('''(()=>{const o=window.claude.use;window.claude.use=async n=>n==='downloads'?{save:async({filename,data})=>{const ab=await new Response(data).arrayBuffer();const u=new Uint8Array(ab);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));(window.__dls=window.__dls||[]).push({filename,b64:btoa(s)});return {status:'saved'}}}:o(n)})()''')
    pg.goto('file://'+R+'/dist/comparativo_precos.html');pg.wait_for_timeout(800)
    print('exp visible:',pg.is_visible('#tabA .exp'))
    for tab,sel in (('A','#tabA'),('A2','#tabA2')):
        pg.click(f'[data-tab={tab}]')
        pg.click(sel+' button[data-x=xlsx]');pg.wait_for_function('window.__dls&&window.__dls.length>=%d'%(1 if tab=='A' else 3),timeout=60000)
        pg.click(sel+' button[data-x=pdf]');pg.wait_for_function('window.__dls.length>=%d'%(2 if tab=='A' else 4),timeout=90000)
        print(tab,pg.inner_text(sel+' .exp-msg'))
    # filtro
    pg.click('[data-tab=A2]');pg.select_option('#tabA2 .s-uf','SP');pg.check('#tabA2 .s-dif')
    pg.click('#tabA2 button[data-x=xlsx]');pg.wait_for_function('window.__dls.length>=5',timeout=60000)
    print(pg.inner_text('#tabA2 .exp-msg'))
    for i,d in enumerate(pg.evaluate('window.__dls')):
        open(f'/tmp/exp_{i}_'+d['filename'].replace('/','_'),'wb').write(base64.b64decode(d['b64']));print(i,d['filename'],len(d['b64'])*3//4)
    pg.screenshot(path='/tmp/exp_ui.png')
    print('errs',errs)
