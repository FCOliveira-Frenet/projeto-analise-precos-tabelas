(()=>{
const store=new Map(),subs=[];
const snapDoc=(p)=>({id:p.split('/').pop(),exists:store.has(p),data:()=>store.has(p)?JSON.parse(JSON.stringify(store.get(p))):undefined,metadata:{}});
const notify=()=>subs.forEach(f=>f());
function coll(path){
  const direct=()=>[...store.keys()].filter(k=>k.startsWith(path+'/')&&k.slice(path.length+1).split('/').length===1);
  const mk=(ord,lim)=>({orderBy:(f,d)=>mk([f,d||'asc'],lim),limit:n=>mk(ord,n),
    get:async()=>{let ks=direct().sort();let docs=ks.map(snapDoc);if(ord){const [f,d]=ord;docs.sort((a,b)=>{const x=a.data()[f],y=b.data()[f];return (x<y?-1:x>y?1:0)*(d==='desc'?-1:1)})}if(lim)docs=docs.slice(0,lim);return {docs,size:docs.length,empty:!docs.length}},
    onSnapshot:(next)=>{const run=()=>mk(ord,lim).get().then(next);run();subs.push(run);return ()=>{}}});
  const c=mk(null,null);c.doc=id=>docRef(path+'/'+id);c.path=path;return c}
function docRef(path){return {id:path.split('/').pop(),path,get:async()=>snapDoc(path),onSnapshot:(next)=>{const run=()=>next(snapDoc(path));run();subs.push(run);return ()=>{}},set:async d=>{store.set(path,JSON.parse(JSON.stringify(d)));notify()},update:async d=>{if(!store.has(path))throw {code:'invalid_argument'};store.set(path,{...store.get(path),...JSON.parse(JSON.stringify(d))});notify()},delete:async()=>{store.delete(path);notify()},collection:p=>coll(path+'/'+p)}}
const db={doc:docRef,collection:coll};
window.__store=store;
const VIEWER=window.__viewer;window.claude={use:async n=>n==='db'?db:n==='user'?(VIEWER?{can:async()=>true,isOwner:async()=>false,canEdit:async()=>false,me:async()=>({id:'u_x1',name:'Maria',email:'maria@x.com'})}:{can:async()=>true,isOwner:async()=>true,canEdit:async()=>true,me:async()=>({id:'u_own',name:'Fernando',email:'f@x.com'})}):null};
})();
