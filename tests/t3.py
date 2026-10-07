from playwright.sync_api import sync_playwright
import os,glob
U='/root/.claude/uploads/0c0110c3-7f25-56f2-9781-b032438b31bf/'
old=glob.glob(U+'*C_pia*')[0];new=glob.glob(U+'*Proposta_Comercial_Frenet_06*')[0]
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1300,'height':900})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script(path='mock.js')
    pg.goto('file://'+os.getcwd()+'/comparativo_precos.html')
    print('tabA head:',pg.inner_text('#tabA .atitle').replace('\n',' | '))
    pg.click('[data-tab=B]')
    pg.set_input_files('[data-side=a] input[type=file]',old);pg.wait_for_timeout(2000)
    pg.select_option('[data-side=a] select[data-sheet]','Proposta Comercial ADO 1500 a 4')
    pg.set_input_files('[data-side=b] input[type=file]',new);pg.wait_for_timeout(2000)
    pg.select_option('[data-side=b] select[data-sheet]','Proposta ADO 1500-4500');pg.wait_for_timeout(900)
    print('msg1:',pg.inner_text('#saveMsg'))
    pg.wait_for_timeout(1500);print('A fields',pg.input_value('[data-carrier=a]'),pg.input_value('[data-ver=a]'),'B',pg.input_value('[data-carrier=b]'),pg.input_value('[data-ver=b]'),'chip',pg.inner_text('#hc'))
    print('msg2:',pg.inner_text('#saveMsg'));print('head:',pg.inner_text('#viewB .atitle').replace('\n',' | '))
    print('docs in store:',len(pg.evaluate("[...__store.keys()]")))
    pg.screenshot(path='h1.png')
    pg.click('[data-tab=C]');pg.wait_for_timeout(600);print(pg.inner_text('#histList')[:500])
    pg.click('[data-hopen]');pg.wait_for_timeout(1500);print('opened:',pg.inner_text('#hmount .res')[:150]);print(pg.inner_text('#hmount .atitle').replace('\n',' | ')[:200])
    pg.check('#hconf');pg.fill('#hnota','conferido ok');pg.wait_for_timeout(1200)
    pg.screenshot(path='h2.png',full_page=True)
    pg.click('#hclose');print(pg.inner_text('#histList')[-250:])
    pg.click('[data-hask]');pg.click('[data-hdel]');pg.wait_for_timeout(600);print('after del keys',len(pg.evaluate("[...__store.keys()]")),pg.inner_text('#histList')[:100])
    print(errs)
