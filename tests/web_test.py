"""Teste do site web com um Supabase simulado (sem rede)."""
from playwright.sync_api import sync_playwright
import os,json,http.server,threading,functools
root=os.path.join(os.getcwd(),'web')
h=functools.partial(http.server.SimpleHTTPRequestHandler,directory=root)
srv=http.server.ThreadingHTTPServer(('127.0.0.1',8765),h);threading.Thread(target=srv.serve_forever,daemon=True).start()
A=open('data/data.json').read();A2=open('data/data2.json').read()
STUB="""(()=>{const mode=window.__mode;const store={docs:{}};
const q=(t)=>{const o={_t:t,_f:{},select(){return o},eq(k,v){o._f[k]=v;return o},order(){return o},maybeSingle(){return o.then(r=>({data:Array.isArray(r.data)?r.data[0]||null:r.data}))},
 upsert(r){o._up=r;return o},update(v){o._upd=v;return o},delete(){o._del=true;return o},
 then(res,rej){return Promise.resolve(run(o)).then(res,rej)}};return o};
function run(o){const t=o._t;
 if(t==='acessos')return {data:[{user_id:'u1',email:'maria@x.com',nome:'Maria',status:mode==='pending'?'pendente':'liberado',criado_em:new Date().toISOString()}]};
 if(t==='comparativos')return {data:mode==='nodata'?[]:[{id:'A',payload:JSON.parse(window.__A)},{id:'A2',payload:JSON.parse(window.__A2)}]};
 if(t==='docs'){if(o._up){store.docs[o._up.path]=o._up;return {data:null}}if(o._f.path)return {data:store.docs[o._f.path]?[store.docs[o._f.path]]:[]};return {data:Object.values(store.docs).filter(d=>d.parent===o._f.parent)}}
 return {data:[]}}
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:mode==='anon'?null:{user:{id:'u1',email:'maria@x.com'}}}}),onAuthStateChange:()=>{},signInWithOtp:async()=>({error:null}),signOut:async()=>{}},
 rpc:async()=>({data:mode==='admin'||mode==='nodata'}),from:q})};})();"""
with sync_playwright() as p:
    b=p.chromium.launch()
    for mode in ['anon','pending','liberado','admin','nodata']:
        pg=b.new_page(viewport={'width':1300,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.route('**/supabase.js',lambda r:r.fulfill(body=STUB,content_type='application/javascript'))
        pg.route('https://fonts.googleapis.com/**',lambda r:r.abort())
        pg.add_init_script(f"window.__mode='{mode}';window.__A={json.dumps(A)};window.__A2={json.dumps(A2)}")
        pg.goto('http://127.0.0.1:8765/index.html');pg.wait_for_timeout(1500)
        app_visible=pg.is_visible('.app')
        print(mode,'| app:',app_visible,'|',pg.inner_text('#gate')[:70].replace('\n',' ') if pg.is_visible('#gate') else '(sem gate)','| tabs:',pg.inner_text('#tabA .atitle')[:40].replace('\n',' ') if app_visible else '', '| D:',pg.is_visible('#tabDbtn'),errs)
        if mode=='admin':
            pg.click('#tabDbtn');pg.wait_for_timeout(500);print('  painel:',pg.inner_text('#accList')[:120].replace('\n',' / '))
            pg.screenshot(path='/tmp/web_admin.png')
        pg.close()
