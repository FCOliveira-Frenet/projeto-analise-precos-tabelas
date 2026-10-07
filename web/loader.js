/* Login, liberação e carga de dados via Supabase. O app (app.bundle.js) só é carregado depois de liberado. */
(function(){
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sb=supabase.createClient(window.SB_URL,window.SB_KEY,{auth:{persistSession:true,detectSessionInUrl:true}});
const gate=$('#gate'),box=$('#gateBox');
const show=h=>{gate.hidden=false;box.innerHTML=h};
let me=null,isAdmin=false,pollT=null,started=false;

/* ---------- camada de banco compatível com o histórico do app ---------- */
function makeDb(){
  const subs=new Set();const notify=()=>subs.forEach(f=>f());
  const snapOf=r=>({id:r.path.split('/').pop(),exists:true,data:()=>JSON.parse(JSON.stringify(r.data))});
  const missing=p=>({id:p.split('/').pop(),exists:false,data:()=>undefined});
  async function list(path,ord,lim){
    let q=sb.from('docs').select('path,data').eq('parent',path);
    if(!ord)q=q.order('path');
    const {data,error}=await q;if(error)throw {code:error.code||'error',message:error.message};
    let rows=data||[];
    if(ord){const [f,d]=ord;rows.sort((a,b)=>{const x=(a.data||{})[f],y=(b.data||{})[f];return (x<y?-1:x>y?1:0)*(d==='desc'?-1:1)})}
    if(lim)rows=rows.slice(0,lim);
    return {docs:rows.map(snapOf),size:rows.length,empty:!rows.length};
  }
  const coll=(path,ord,lim)=>({path,
    orderBy:(f,d)=>coll(path,[f,d||'asc'],lim),limit:n=>coll(path,ord,n),
    get:()=>list(path,ord,lim),
    doc:id=>docRef(path+'/'+id),
    onSnapshot:(next,err)=>{const run=()=>list(path,ord,lim).then(next,e=>err&&err(e));run();subs.add(run);const t=setInterval(run,20000);return()=>{subs.delete(run);clearInterval(t)}}});
  function docRef(path){
    const parent=path.split('/').slice(0,-1).join('/');
    return {id:path.split('/').pop(),path,
      get:async()=>{const {data}=await sb.from('docs').select('path,data').eq('path',path).maybeSingle();return data?snapOf(data):missing(path)},
      set:async d=>{const {error}=await sb.from('docs').upsert({path,parent,data:JSON.parse(JSON.stringify(d)),atualizado_em:new Date().toISOString()});if(error)throw {code:error.code,message:error.message};notify()},
      update:async d=>{const cur=await sb.from('docs').select('data').eq('path',path).maybeSingle();if(!cur.data)throw {code:'not_found'};const {error}=await sb.from('docs').update({data:{...cur.data.data,...JSON.parse(JSON.stringify(d))},atualizado_em:new Date().toISOString()}).eq('path',path);if(error)throw {code:error.code,message:error.message};notify()},
      delete:async()=>{const {error}=await sb.from('docs').delete().eq('path',path);if(error)throw {code:error.code,message:error.message};notify()},
      collection:p=>coll(path+'/'+p),
      onSnapshot:(next)=>{const run=()=>docRef(path).get().then(next);run();subs.add(run);return()=>subs.delete(run)}};
  }
  return {doc:docRef,collection:p=>coll(p)};
}
window.claude={use:async n=>n==='db'?makeDb():n==='user'?{can:async()=>true,isOwner:async()=>isAdmin,canEdit:async()=>isAdmin,me:async()=>({id:me&&me.id,name:me&&me.email,email:me&&me.email})}:null};

/* ---------- telas ---------- */
function loginScreen(msg){
  show(`<h2>Comparativo de Preços</h2><p>Acesso restrito. Entre para continuar. Se ainda não tiver acesso, seu pedido vai para o responsável liberar.</p>
  <div id="gBox"></div>
  <input id="lgMail" type="email" placeholder="seu@email.com" autocomplete="email"><br>
  <button class="go primary big" id="lgBtn">Entrar com link no e-mail</button>${msg?`<p class="muted">${esc(msg)}</p>`:''}`);
  $('#lgBtn').onclick=async()=>{
    const em=$('#lgMail').value.trim();
    if(!/^\S+@\S+\.\S+$/.test(em)){loginScreen('Informe um e-mail válido.');return}
    $('#lgBtn').disabled=true;
    const {error}=await sb.auth.signInWithOtp({email:em,options:{emailRedirectTo:location.origin+location.pathname}});
    if(error)loginScreen('Não foi possível enviar o link: '+error.message);
    else{show(`<h2>Verifique seu e-mail</h2><p>Enviamos um link de acesso para <b>${esc(em)}</b>. Abra o e-mail e clique no link para entrar. Pode fechar esta aba.</p><p class="muted">Não chegou? Veja a caixa de spam.</p><button class="go" id="bkBtn">← Voltar</button>`);$('#bkBtn').onclick=()=>loginScreen()}
  };
  /* botão do Google: só aparece se o provedor estiver ativado no Supabase */
  fetch(window.SB_URL+'/auth/v1/settings',{headers:{apikey:window.SB_KEY}}).then(r=>r.json()).then(cfg=>{
    if(!(cfg&&cfg.external&&cfg.external.google))return;
    const g=$('#gBox');if(!g)return;
    g.innerHTML='<button class="go gbtn" id="ggBtn"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.1 5.5c4.2-3.9 7.2-9.6 7.2-16.9z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.5 2.1-8.8 2.1-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg> Entrar com Google</button><p class="muted" style="margin:10px 0">ou</p>';
    $('#ggBtn').onclick=async()=>{const {error}=await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(error)loginScreen('Google indisponível: '+error.message)};
  }).catch(()=>{});
}
const signOutLink=()=>`<p class="muted"><a href="#" id="soBtn">Sair (${esc(me.email)})</a></p>`;
function bindSignOut(){const b=$('#soBtn');if(b)b.onclick=async e=>{e.preventDefault();await sb.auth.signOut();location.reload()}}

async function myAccess(){
  for(let i=0;i<4;i++){const {data}=await sb.from('acessos').select('status').eq('user_id',me.id).maybeSingle();if(data)return data.status;await new Promise(r=>setTimeout(r,700))}
  return null;
}

async function start(){
  if(started)return;started=true;
  const {data:{session}}=await sb.auth.getSession();
  if(!session){loginScreen();return}
  me=session.user;
  show('<h2>Verificando acesso…</h2>');
  try{const {data}=await sb.rpc('is_admin');isAdmin=!!data}catch(e){}
  const st=await myAccess();
  if(st==='liberado'||isAdmin){await openApp();return}
  if(st==='negado'){clearInterval(pollT);show('<h2>Acesso negado</h2><p>O responsável não liberou o acesso para esta conta.</p>'+signOutLink());bindSignOut();return}
  show('<h2>Aguardando liberação</h2><p>Seu pedido de acesso foi registrado para <b>'+esc(me.email)+'</b>. Assim que o responsável liberar, esta tela abre sozinha.</p><p class="muted">Aguardando…</p>'+signOutLink());bindSignOut();
  clearInterval(pollT);pollT=setInterval(async()=>{const s=await myAccess();if(s==='liberado'){clearInterval(pollT);location.reload()}else if(s==='negado'){clearInterval(pollT);started=false;start()}},6000);
}

async function openApp(){
  const {data:rows,error}=await sb.from('comparativos').select('id,payload');
  const byId=Object.fromEntries((rows||[]).map(r=>[r.id,r.payload]));
  if(error||!byId.A||!byId.A2){
    if(isAdmin){uploadScreen(byId);return}
    show('<h2>Dados ainda não publicados</h2><p>O responsável ainda não publicou as tabelas de preço. Volte mais tarde.</p>'+signOutLink());bindSignOut();return}
  let js=await (await fetch('app.bundle.js?'+Date.now())).text();
  js=js.replace('__DATA2__',()=>JSON.stringify(byId.A2)).replace('__DATA__',()=>JSON.stringify(byId.A));
  const s=document.createElement('script');s.textContent=js;document.body.appendChild(s);
  gate.hidden=true;document.body.classList.remove('locked');
  addTopBar();
  if(isAdmin)adminPanel();
}
function addTopBar(){
  const d=document.createElement('div');d.style.cssText='position:fixed;right:12px;bottom:10px;font-size:12px;color:var(--ink2);background:var(--card);border:1px solid var(--line);border-radius:999px;padding:4px 12px;z-index:5';
  d.innerHTML=esc(me.email)+' · <a href="#" id="soBtn2">sair</a>';document.body.appendChild(d);
  $('#soBtn2').onclick=async e=>{e.preventDefault();await sb.auth.signOut();location.reload()};
}

/* ---------- administrador ---------- */
function uploadScreen(have){
  show(`<h2>Publicar tabelas de preço</h2><p>Selecione os arquivos de dados (<code>data.json</code> para a aba A e <code>data2.json</code> para a aba A2). Isso é feito uma vez.</p>
  <p>Aba A ${have.A?'✔ já publicada':''}<br><input type="file" id="upA" accept=".json"></p><p>Aba A2 ${have.A2?'✔ já publicada':''}<br><input type="file" id="upA2" accept=".json"></p>
  <button class="go primary big" id="upGo">Publicar</button><p class="muted" id="upMsg"></p>`);
  $('#upGo').onclick=async()=>{
    const msg=$('#upMsg');
    try{
      for(const [id,inp,t] of [['A','#upA','ADO 1500 a 4500 · antiga × nova'],['A2','#upA2','ADO até 1500 (antiga) × 1500 a 4500 (nova)']]){
        const f=$(inp).files[0];if(!f)continue;
        const payload=JSON.parse(await f.text());
        const {error}=await sb.from('comparativos').upsert({id,titulo:t,payload,atualizado_em:new Date().toISOString()});
        if(error)throw error;
      }
      msg.textContent='Publicado. Recarregando…';setTimeout(()=>location.reload(),800);
    }catch(e){msg.textContent='Erro: '+(e.message||e)}
  };
}
function adminPanel(){
  $('#tabDbtn').hidden=false;
  const root=$('#accList');let rows=[];
  const when=t=>{try{return new Date(t).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch(e){return ''}};
  const row=x=>`<div class="accrow"><div><b>${esc(x.nome||x.email)}</b><span>${esc(x.email)}</span><small>${esc(x.status)} · pediu em ${esc(when(x.criado_em))}</small></div><div>${x.status==='liberado'?`<button class="go" data-st="negado" data-id="${esc(x.user_id)}">Bloquear</button>`:`<button class="go primary" data-st="liberado" data-id="${esc(x.user_id)}">Liberar</button>${x.status==='pendente'?` <button class="go" data-st="negado" data-id="${esc(x.user_id)}">Negar</button>`:''}`}</div></div>`;
  const render=()=>{
    const p=rows.filter(x=>x.status==='pendente'),l=rows.filter(x=>x.status==='liberado'),n=rows.filter(x=>x.status==='negado');
    $('#accCount').textContent=p.length?` (${p.length})`:'';
    root.innerHTML=`<h3>Aguardando liberação (${p.length})</h3>${p.map(row).join('')||'<p class="muted">Nenhum pedido pendente.</p>'}<h3>Com acesso (${l.length})</h3>${l.map(row).join('')}<h3>Negados (${n.length})</h3>${n.map(row).join('')||'<p class="muted">Nenhum.</p>'}<h3>Tabelas de preço</h3><p class="muted">Para atualizar os dados das abas A e A2, <a href="#" id="reUp">publique novos arquivos</a>.</p>`;
    const r=$('#reUp');if(r)r.onclick=e=>{e.preventDefault();document.body.classList.add('locked');uploadScreen({A:1,A2:1})};
  };
  const load=async()=>{const {data}=await sb.from('acessos').select('*').order('criado_em',{ascending:false});rows=data||[];render()};
  root.addEventListener('click',async e=>{
    const b=e.target.closest('button[data-st]');if(!b)return;b.disabled=true;
    await sb.from('acessos').update({status:b.dataset.st,decidido_em:new Date().toISOString()}).eq('user_id',b.dataset.id);load();
  });
  load();setInterval(load,15000);
}
sb.auth.onAuthStateChange((ev)=>{if(ev==='SIGNED_IN'&&!started)start()});
start();
})();
