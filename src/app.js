try{document.body.classList.add('locked')}catch(e){}
const $=(s,r=document)=>r.querySelector(s);
const fmt=(v,d=2)=>v.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const pctOf=(a,b)=>(a==null||b==null||a===0)?null:(b-a)/a*100;
const okSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const svgW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.6 17a1.8 1.8 0 0 0 1.6 2.7h15.6a1.8 1.8 0 0 0 1.6-2.7L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z"/></svg>';
const svgO='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>';
const bandLabel=b=>typeof b==='number'?String(b).replace('.',','):(/adic|exced/i.test(b)?'Adic.':String(b).slice(0,8));
const bandFull=b=>typeof b==='number'?bandLabel(b)+' kg':'Adicional (por kg)';


function headHtml(h){
  if(!h)return '';
  const same=h.a.n&&h.b.n&&norm(h.a.n)===norm(h.b.n);
  const title=same?esc(h.a.n):`${esc(h.a.n||'Planilha A')} <span class="vs">×</span> ${esc(h.b.n||'Planilha B')}`;
  const sub=same?`${esc(h.a.v||'A')} <span class="vs">×</span> ${esc(h.b.v||'B')}`:'';
  const pill=(k,x)=>`<span class="pill"><b>${k}</b> ${esc(x.n||'sem nome')}${x.v?' · '+esc(x.v):''}${x.f?` <small>${esc(x.f)}</small>`:''}</span>`;
  return `<div class="at-k">Transportadora analisada</div><div class="at-n">${title}</div>${sub?`<div class="at-s">${sub}</div>`:''}<div class="pills">${pill('A',h.a)}${pill('B',h.b)}</div>`;
}
function buildL(i){
  const na=(i.carrierA||'').trim(),nb=(i.carrierB||'').trim(),va=(i.verA||'').trim(),vb=(i.verB||'').trim();
  const same=!!(na&&nb&&norm(na)===norm(nb));
  const ca=same?(va||'A'):(na||'A').slice(0,12),cb=same?(vb||'B'):(nb||'B').slice(0,12);
  const dA=same?`${na} ${va||'A'}`:(na||'A'),dB=same?`${nb} ${vb||'B'}`:(nb||'B');
  const fl=(f,sh)=>f?f+(sh?' ('+sh+')':''):'';
  return {ca,cb,nameA:dA+(i.fileA?' — '+i.fileA:''),nameB:dB+(i.fileB?' — '+i.fileB:''),inA:'em '+dA,inB:'em '+dB,refA:dA,
    title:`Informações vazias em ${dB} em relação a ${dA}`,okTitle:`${dB} não tem informações vazias em relação a ${dA}`,
    head:{a:{n:na,v:va,f:fl(i.fileA,i.sheetA)},b:{n:nb,v:vb,f:fl(i.fileB,i.sheetB)}}};
}
function statsOf(D){
  const common=D.rows.filter(r=>r.o&&r.w);let nDiff=0,nCmp=0,maxUp=0,maxDn=0;const dc=new Set();
  common.forEach(r=>r.o.p.forEach((a,i)=>{const p=pctOf(a,r.w.p[i]);if(p==null)return;nCmp++;if(Math.abs(p)>=0.005){nDiff++;dc.add(r)}if(p>maxUp)maxUp=p;if(p<maxDn)maxDn=p}));
  return {cidadesA:D.rows.filter(r=>r.o).length,cidadesB:D.rows.filter(r=>r.w).length,comuns:common.length,soA:D.rows.filter(r=>r.o&&!r.w).length,soB:D.rows.filter(r=>r.w&&!r.o).length,pesos:D.bands.length,precos:nCmp,precosDif:nDiff,cidadesDif:dc.size,maxUp:+maxUp.toFixed(3),maxDn:+maxDn.toFixed(3)};
}

/* =============== EXPORTAÇÃO (Excel e PDF) =============== */
const CDN={xlsx:'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',pdf:'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',tbl:'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'};
const libP={};
function loadLib(url){return libP[url]||(libP[url]=new Promise((ok,no)=>{const s=document.createElement('script');s.src=url;s.onload=ok;s.onerror=()=>{delete libP[url];no(new Error('Não foi possível carregar o gerador de arquivos. Confira a conexão e tente de novo.'))};document.head.appendChild(s)}))}
let dlP=null;const getDl=()=>dlP||(dlP=(async()=>{try{return window.claude&&claude.use?await claude.use('downloads'):null}catch(e){return null}})());
const plc=(n,u,v)=>n+' '+(n===1?u:v);
function headlineOf(S){
  if(S.nUp&&S.nDn)return `Aumento em ${plc(S.cUp,'cidade','cidades')} e desconto em ${plc(S.cDn,'cidade','cidades')}`;
  if(S.nUp)return `Aumento de preço em ${plc(S.cUp,'cidade','cidades')}`;
  if(S.nDn)return `Desconto em ${plc(S.cDn,'cidade','cidades')} e nenhum aumento`;
  return 'Preços iguais nas duas planilhas';
}
const bandFullX=b=>typeof b==='number'?String(b).replace('.',',')+' kg':'Adicional (por kg)';
const pctTxt=p=>p==null?'—':Math.abs(p)<0.005?'0,00%':(p>0?'+':'-')+fmt(Math.abs(p))+'%';
const dtOf=s=>((s||'').match(/\d{2}\/\d{2}\/\d{4}/)||[''])[0].replace(/\//g,'-');
const shortF=f=>String(f||'').replace(/^aba\s+/i,'').replace(/Proposta\s+(Comercial\s+)?/i,'').trim();
function exportName(X,ext){
  const h=X.L.head,a=h.a,b=h.b,car=(a.n&&b.n&&norm(a.n)!==norm(b.n))?a.n+' x '+b.n:(a.n||b.n||'Comparativo');
  const d=[dtOf(a.v),dtOf(b.v)].filter(Boolean).join(' x ');
  const fa=shortF(a.f),fb=shortF(b.f),tag=fa&&fb&&fa!==fb?fa+' x '+fb:(fb||fa);
  return ('Comparativo '+car+(d?' '+d:'')+(tag?' ('+tag+')':'')).replace(/[\\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').trim().slice(0,150)+'.'+ext;
}
function headLines(X){
  const h=X.L.head,side=s=>[s.n||'',s.v||'',s.f?'('+s.f+')':''].filter(Boolean).join(' ');
  return {carrier:(h.a.n&&h.b.n&&norm(h.a.n)!==norm(h.b.n))?h.a.n+' × '+h.b.n:(h.a.n||h.b.n||''),a:'A  '+side(h.a),b:'B  '+side(h.b)};
}
async function saveFile(name,data){
  const dl=await getDl();if(!dl)throw new Error('Este modo de visualização não permite baixar arquivos.');
  return dl.save({filename:name,data});
}
async function exportXlsx(X){
  await loadLib(CDN.xlsx);
  const E=window.ExcelJS,wb=new E.Workbook();wb.creator='Comparativo de Preços';wb.created=new Date();
  const hl=headLines(X),n=X.bands.length,last=2+n*3;
  const C={ink:'FF0C0452',head:'FFEEF0FF',hd2:'FFE0E4FF',nw:'FFF1F3FF',up:'FFC92F4B',upBg:'FFFCE4E9',dn:'FF1F7C95',dnBg:'FFDDF1F6',zero:'FF777794',line:'FFD9DBF0',white:'FFFFFFFF'};
  const thin={style:'thin',color:{argb:C.line}};const box={top:thin,left:thin,bottom:thin,right:thin};
  const ws=wb.addWorksheet('Comparativo',{views:[{state:'frozen',xSplit:2,ySplit:6,showGridLines:false}]});
  ws.getCell('A1').value='Comparativo de Preços'+(hl.carrier?' · '+hl.carrier:'');ws.getCell('A1').font={bold:true,size:16,color:{argb:C.ink}};
  ws.getCell('A2').value=hl.a;ws.getCell('A3').value=hl.b;
  ws.getCell('A4').value=X.filtro;ws.getCell('A4').font={italic:true,color:{argb:C.zero}};
  ['A2','A3'].forEach(k=>ws.getCell(k).font={size:11,color:{argb:C.ink}});
  ws.getCell('A5').value=`Colunas: ${X.L.ca} · ${X.L.cb} · % Dif = (${X.L.cb} − ${X.L.ca}) ÷ ${X.L.ca}. Vermelho: ${X.L.cb} mais caro · azul: ${X.L.cb} mais barato · cinza: igual. Nome da cidade: vermelho = tem aumento, verde = só desconto.`;ws.getCell('A5').font={size:9,color:{argb:C.zero}};
  // cabeçalho em duas linhas (6 e 7) como na tela
  ws.views=[{state:'frozen',xSplit:2,ySplit:7,showGridLines:false}];
  ['Cidade','UF'].forEach((t,i)=>{ws.mergeCells(6,i+1,7,i+1);const c=ws.getCell(6,i+1);c.value=t;c.font={bold:true,color:{argb:C.ink}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.head}};c.alignment={vertical:'middle',horizontal:'left'};c.border=box});
  X.bands.forEach((b,i)=>{
    const c0=3+i*3;ws.mergeCells(6,c0,6,c0+2);const t=ws.getCell(6,c0);t.value=bandFullX(b);t.font={bold:true,color:{argb:C.ink}};t.fill={type:'pattern',pattern:'solid',fgColor:{argb:i%2?C.hd2:C.head}};t.alignment={horizontal:'center'};
    for(let k=0;k<3;k++){const c=ws.getCell(6,c0+k);c.border=box;c.fill=t.fill;
      const s=ws.getCell(7,c0+k);s.value=[X.L.ca,X.L.cb,'% Dif'][k];s.font={bold:true,size:10,color:{argb:C.ink}};s.alignment={horizontal:'center'};s.border=box;s.fill={type:'pattern',pattern:'solid',fgColor:{argb:k===1?C.nw:(i%2?C.hd2:C.head)}}}
  });
  X.list.forEach((r,ri)=>{
    const row=ws.getRow(8+ri);
    const stt=X.state(r),c1=row.getCell(1);c1.value=r.n;c1.font={bold:stt==='u'||stt==='d',color:{argb:stt==='u'?C.up:stt==='d'?'FF15803D':C.ink}};c1.border=box;
    const c2=row.getCell(2);c2.value=r.u||'';c2.border=box;c2.font={color:{argb:C.zero}};
    X.bands.forEach((_,i)=>{
      const a=r.o?r.o.p[i]:null,b=r.w?r.w.p[i]:null,p=pctOf(a,b),d=p!=null&&Math.abs(p)>=0.005,col=d?(p>0?C.up:C.dn):null,bg=d?(p>0?C.upBg:C.dnBg):null;
      const c0=3+i*3;
      [[a,0],[b,1]].forEach(([v,k])=>{const c=row.getCell(c0+k);c.value=v==null?'—':v;c.numFmt='#,##0.00';c.alignment={horizontal:v==null?'center':'right'};c.border=box;
        c.font={bold:d,color:{argb:d?col:C.ink}};if(bg)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}};else if(k===1)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.nw}}});
      const c=row.getCell(c0+2);c.border=box;c.alignment={horizontal:'right'};
      if(p==null){c.value='—';c.alignment={horizontal:'center'};c.font={color:{argb:C.zero}}}
      else{c.value=p/100;c.numFmt=d?'+0.00%;-0.00%':'0.00%';c.font={bold:d,color:{argb:d?col:C.zero}};if(bg)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}}}
    });
  });
  ws.getColumn(1).width=30;ws.getColumn(2).width=5;for(let c=3;c<=last;c++)ws.getColumn(c).width=(c-3)%3===2?9:10.5;
  if(X.list.length)ws.autoFilter={from:{row:7,column:1},to:{row:7+X.list.length,column:last}};
  // aba Resumo
  const rs=wb.addWorksheet('Resumo',{views:[{showGridLines:false}]});
  rs.getColumn(1).width=46;rs.getColumn(2).width=18;rs.getColumn(3).width=70;
  const put=(r,a,b,c,o={})=>{const row=rs.getRow(r);[a,b,c].forEach((v,i)=>{if(v!==undefined){const x=row.getCell(i+1);x.value=v;x.alignment={vertical:'top',wrapText:true};if(o.bold)x.font={bold:true,color:{argb:C.ink}};if(o.head){x.fill={type:'pattern',pattern:'solid',fgColor:{argb:C.head}};x.font={bold:true,color:{argb:C.ink}}}}});};
  let r=1;rs.getCell('A1').value='Comparativo de Preços'+(hl.carrier?' · '+hl.carrier:'');rs.getCell('A1').font={bold:true,size:16,color:{argb:C.ink}};
  rs.getCell('A2').value=hl.a;rs.getCell('A3').value=hl.b;r=5;
  const S=X.st;
  put(r++,'Resumo das diferenças de preço',undefined,undefined,{head:true});rs.mergeCells(r-1,1,r-1,3);
  put(r++,headlineOf(S),undefined,undefined);
  put(r++,'Aumentos (Novo mais caro que Antigo)',S.cUp+' cidades',S.nUp?`${S.nUp} preços · média ${pctTxt(S.avgUp)} · maior aumento ${pctTxt(S.maxUp)}`:'nenhum aumento');
  put(r++,'Descontos (Novo mais barato que Antigo)',S.cDn+' cidades',S.nDn?`${S.nDn} preços · média ${pctTxt(S.avgDn)} · maior desconto ${pctTxt(S.maxDn)}`:'nenhum desconto');
  put(r++,'Variação média geral',S.nCmp?pctTxt(S.avgAll):'—',`média de todos os ${S.nCmp.toLocaleString('pt-BR')} preços`);
  r++;put(r++,X.L.title||'Informações vazias',undefined,undefined,{head:true});rs.mergeCells(r-1,1,r-1,3);
  put(r++,'Ponto de atenção','Cidades','Detalhe',{bold:true});
  X.gaps.forEach(g=>put(r++,g.t,g.n,g.s));
  if(!X.gaps.length)put(r++,'Nenhum ponto de atenção',0,'');
  rs.getRow(5).height=20;
  // aba Informações vazias (uma linha por cidade)
  const gp=wb.addWorksheet('Informações vazias');
  gp.columns=[{header:'Ponto de atenção',width:70},{header:'Cidade',width:32},{header:'UF',width:6}];
  gp.getRow(1).font={bold:true,color:{argb:C.ink}};gp.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:C.head}};
  X.gaps.forEach(g=>{if(g.l.length)g.l.forEach(c=>gp.addRow([g.t,c.n,c.u||'']));else gp.addRow([g.t+' — '+g.s,'','']);});
  gp.views=[{state:'frozen',ySplit:1}];
  const buf=await wb.xlsx.writeBuffer();
  return saveFile(exportName(X,'xlsx'),new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
}
async function exportPdf(X){
  await loadLib(CDN.pdf);await loadLib(CDN.tbl);
  const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4',compress:true});
  const W=297,H=210,M=10;
  const T=s=>String(s==null?'':s).replace(/[−–]/g,'-').replace(/[▼▲≥≤]/g,'').replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ—·×]/g,'');
  const hl=headLines(X),S=X.st;
  const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const K={ink:'#0C0452',acc:'#5B6EEB',muted:'#777794',head:'#EEF0FF',hd2:'#E0E4FF',nw:'#F1F3FF',up:'#C92F4B',upBg:'#FCE4E9',dn:'#1F7C95',dnBg:'#DDF1F6',line:'#D9DBF0'};
  // ---- página 1: resumo
  doc.setFillColor(...rgb(K.acc));doc.rect(0,0,W,3,'F');
  doc.setTextColor(...rgb(K.ink));doc.setFont('helvetica','bold');doc.setFontSize(20);doc.text(T('Comparativo de Preços'+(hl.carrier?' · '+hl.carrier:'')),M,18);
  doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(...rgb('#555577'));
  doc.text(T(hl.a),M,25);doc.text(T(hl.b),M,30);
  doc.setFontSize(8.5);doc.setTextColor(...rgb(K.muted));doc.text(T(X.filtro+'  ·  gerado em '+new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})),M,36);
  doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(...rgb(S.nUp?K.up:'#15803D'));
  doc.text(T(headlineOf(S)),M,47);
  const cards=[['Aumentos',plc(S.cUp,'cidade','cidades'),S.nUp?`${S.nUp.toLocaleString('pt-BR')} preços · média ${pctTxt(S.avgUp)} · maior aumento ${pctTxt(S.maxUp)}`:'sem aumento',K.up,K.upBg],
    ['Descontos',plc(S.cDn,'cidade','cidades'),S.nDn?`${S.nDn.toLocaleString('pt-BR')} preços · média ${pctTxt(S.avgDn)} · maior desconto ${pctTxt(S.maxDn)}`:'sem desconto','#15803D','#DCF5E5'],
    ['Variação média geral',S.nCmp?pctTxt(S.avgAll):'—','de todos os preços comparados',S.avgAll<0?'#15803D':K.up,K.head]];
  const cw=(W-2*M-2*4)/3;
  cards.forEach((c,i)=>{const x=M+i*(cw+4),y=53;doc.setFillColor(...rgb(c[4]));doc.roundedRect(x,y,cw,27,2,2,'F');
    doc.setFillColor(...rgb(c[3]));doc.rect(x,y+2,1.2,23,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(...rgb(K.ink));doc.text(T(c[0]),x+4,y+6.5);
    doc.setFontSize(17);doc.setTextColor(...rgb(c[3]));doc.text(T(c[1]),x+4,y+16);
    doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...rgb('#555577'));doc.text(T(c[2]),x+4,y+22.5,{maxWidth:cw-6})});
  doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(...rgb(K.ink));doc.text(T(X.L.title||'Informações vazias'),M,92);
  doc.autoTable({startY:95,margin:{left:M,right:M},head:[['Cidades','Ponto de atenção','Detalhe']],
    body:(X.gaps.length?X.gaps:[{n:0,t:'Nenhum ponto de atenção',s:''}]).map(g=>[String(g.n),T(g.t),T(g.s)]),
    styles:{font:'helvetica',fontSize:8.5,cellPadding:1.8,textColor:rgb(K.ink),lineColor:rgb(K.line),lineWidth:.15,valign:'middle'},
    headStyles:{fillColor:rgb(K.head),textColor:rgb(K.ink),fontStyle:'bold'},columnStyles:{0:{halign:'center',cellWidth:18,fontStyle:'bold'},1:{cellWidth:120},2:{textColor:rgb('#555577')}},theme:'grid'});
  // ---- tabela por blocos de pesos
  const per=6,nb=Math.ceil(X.bands.length/per),cityW=46,ufW=9,colW=(W-2*M-cityW-ufW)/(per*3);
  const pgBlock=[];let curBlock='';
  for(let bi=0;bi<nb&&X.list.length;bi++){
    const idx=X.bands.map((_,i)=>i).slice(bi*per,bi*per+per);
    const lbl=idx.length>1?`${bandFullX(X.bands[idx[0]])} a ${bandFullX(X.bands[idx[idx.length-1]])}`:bandFullX(X.bands[idx[0]]);
    const head1=[{content:'Cidade',rowSpan:2,styles:{halign:'left',valign:'middle'}},{content:'UF',rowSpan:2,styles:{halign:'left',valign:'middle'}}].concat(idx.map(i=>({content:T(bandFullX(X.bands[i])),colSpan:3,styles:{halign:'center',fillColor:rgb(i%2?K.hd2:K.head)}})));
    const head2=idx.flatMap(i=>[X.L.ca,X.L.cb,'% Dif'].map((t,k)=>({content:T(t),styles:{halign:'center',fontSize:6.5,fillColor:rgb(k===1?K.nw:(i%2?K.hd2:K.head))}})));
    const body=X.list.map(r=>{const row=[{content:T(r.n),styles:{fontStyle:(X.state(r)==='u'||X.state(r)==='d')?'bold':'normal',textColor:rgb(X.state(r)==='u'?K.up:X.state(r)==='d'?'#15803D':K.ink)}},{content:T(r.u||''),styles:{textColor:rgb(K.muted)}}];
      idx.forEach(i=>{const a=r.o?r.o.p[i]:null,b=r.w?r.w.p[i]:null,p=pctOf(a,b),d=p!=null&&Math.abs(p)>=0.005,col=d?(p>0?K.up:K.dn):null,bg=d?(p>0?K.upBg:K.dnBg):null;
        const mk=(t,k)=>({content:t,styles:Object.assign({halign:'right'},d?{fontStyle:'bold',textColor:rgb(col),fillColor:rgb(bg)}:(k===1?{fillColor:rgb(K.nw)}:{}),p==null&&t==='—'?{halign:'center'}:{})});
        row.push(mk(a==null?'—':fmt(a),0),mk(b==null?'—':fmt(b),1),{content:pctTxt(p),styles:Object.assign({halign:'right',textColor:rgb(d?col:K.muted)},d?{fontStyle:'bold',fillColor:rgb(bg)}:{},p==null?{halign:'center'}:{})})});
      return row});
    doc.addPage();
    doc.autoTable({head:[head1,head2],body,startY:20,margin:{top:20,left:M,right:M,bottom:12},theme:'grid',tableWidth:W-2*M,
      styles:{font:'helvetica',fontSize:6.8,cellPadding:{top:.9,bottom:.9,left:.8,right:.8},textColor:rgb(K.ink),lineColor:rgb(K.line),lineWidth:.12,overflow:'hidden',valign:'middle'},
      headStyles:{fontStyle:'bold',textColor:rgb(K.ink),fillColor:rgb(K.head),fontSize:7.2},
      columnStyles:Object.assign({0:{cellWidth:cityW},1:{cellWidth:ufW}},Object.fromEntries(idx.flatMap((_,j)=>[[2+j*3,{cellWidth:colW}],[3+j*3,{cellWidth:colW}],[4+j*3,{cellWidth:colW}]]))),
      showHead:'everyPage',rowPageBreak:'avoid',
      didDrawPage:d=>{doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(...rgb(K.ink));doc.text(T(`Pesos: ${lbl}`),M,11);
        doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(...rgb(K.muted));doc.text(T((hl.carrier||'Comparativo')+' · '+X.filtro),M,15.5,{maxWidth:W-2*M-40});
        doc.text(`Bloco ${bi+1} de ${nb}`,W-M,11,{align:'right'})}});
  }
  const pages=doc.getNumberOfPages();
  for(let p=1;p<=pages;p++){doc.setPage(p);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(...rgb(K.muted));doc.text(`Página ${p} de ${pages}`,W-M,H-5,{align:'right'});doc.text(T('Comparativo de Preços · '+(hl.carrier||'')),M,H-5)}
  return saveFile(exportName(X,'pdf'),doc.output('blob'));
}
function exportBar(root,getX){
  const box=root.querySelector('.exp');if(!box)return;
  const msg=box.querySelector('.exp-msg');
  getDl().then(d=>{if(!d)box.hidden=true});
  const say=(t,bad)=>{msg.textContent=t||'';msg.className='exp-msg'+(bad?' bad':'')};
  box.addEventListener('click',async e=>{
    const b=e.target.closest('button[data-x]');if(!b||b.disabled)return;
    const kind=b.dataset.x,old=b.textContent,all=box.querySelectorAll('button');
    all.forEach(x=>x.disabled=true);b.textContent='Gerando…';say('');
    try{
      await new Promise(r=>setTimeout(r,30));
      const X=getX();if(!X.list.length){say('Não há cidades na tabela para exportar. Ajuste os filtros.',true);return}
      const r=await (kind==='xlsx'?exportXlsx(X):exportPdf(X));
      say('Arquivo '+(kind==='xlsx'?'Excel':'PDF')+' gerado com '+X.list.length+' cidades.');
    }catch(err){
      if(err&&err.code==='declined')say('Download cancelado.');
      else say('Não foi possível gerar o arquivo: '+(err&&err.message||err),true);
    }finally{all.forEach(x=>x.disabled=false);b.textContent=old}
  });
}

/* =============== VISÃO COMPARATIVA (usada nas duas abas) =============== */
function mountView(root,DATA,L){
  const rows=DATA.rows,bands=DATA.bands,meta=DATA.meta||{};
  const A=bands.map((_,i)=>i);
  root.innerHTML=`${L.intro?`<div class="intro">${L.intro}</div>`:''}<div class="atitle">${headHtml(L.head)}</div><div class="res"></div><div class="gap"></div><div class="focus" hidden></div>
  <div class="bar">
    <div class="f"><label>UF</label><select class="s-uf"><option value="">Todas</option></select></div>
    <div class="f"><label>Cidade</label><input type="search" class="s-q" placeholder="Buscar cidade"></div>
    <label class="chk"><input type="checkbox" class="s-dif"> Só com diferença</label>
    <label class="chk"><input type="checkbox" class="s-solo"> Incluir cidades que estão em só uma planilha</label>
    <span class="count"></span>
    <span class="exp" role="group" aria-label="Exportar a tabela"><button type="button" data-x="xlsx" title="Baixa a tabela como está na tela, em Excel">Baixar Excel</button><button type="button" data-x="pdf" title="Baixa a tabela como está na tela, em PDF">Baixar PDF</button><span class="exp-msg" role="status" aria-live="polite"></span></span>
  </div>
  <div class="box"><div class="scroll"><table></table></div></div>
  <p class="foot"></p>`;
  const q=s=>$(s,root);
  const sorted=[...rows].sort((a,b)=>a.n.localeCompare(b.n,'pt-BR'));
  const both=r=>r.o&&r.w;
  const common=sorted.filter(both);
  const cityState=r=>{if(!both(r))return '';let up=false,dn=false;r.o.p.forEach((a,i)=>{const p=pctOf(a,r.w.p[i]);if(p==null)return;if(p>=0.005)up=true;else if(p<=-0.005)dn=true});return up?'u':dn?'d':'z'};
  const isDiff=(r)=>both(r)&&r.o.p.some((a,i)=>{const p=pctOf(a,r.w.p[i]);return p!=null&&Math.abs(p)>=0.005});

  /* resumo */
  let maxAbs=0,nDiff=0,nCmp=0,maxUp=0,maxDn=0,nUp=0,nDn=0,sUp=0,sDn=0,sAll=0;
  const cDn=new Set(),cUp=new Set();
  common.forEach(r=>r.o.p.forEach((a,i)=>{const p=pctOf(a,r.w.p[i]);if(p==null)return;nCmp++;sAll+=p;if(Math.abs(p)>maxAbs)maxAbs=Math.abs(p);
    if(p>=0.005){nDiff++;nUp++;sUp+=p;cUp.add(r)}else if(p<=-0.005){nDiff++;nDn++;sDn+=p;cDn.add(r)}
    if(p>maxUp)maxUp=p;if(p<maxDn)maxDn=p}));
  const diffCities=common.filter(isDiff);
  const resEl=q('.res');
  const sg=(v,d=2)=>(v>0?'+':v<0?'−':'')+fmt(Math.abs(v),d)+'%';
  if(!nDiff){
    resEl.innerHTML=`<span class="ok">${okSvg}</span><b>Preços iguais nas duas planilhas.</b><span>Maior diferença: ${fmt(maxAbs,3)}% (arredondamento).</span>`;
  }else{
    resEl.classList.add('dif');if(!nUp)resEl.classList.add('good');
    const S0={nUp,nDn,cUp:cUp.size,cDn:cDn.size},nf=n=>n.toLocaleString('pt-BR');
    const hero=(k,cls,lab,nC,nP,det)=>`<button type="button" class="hero ${cls}${nP?'':' off'}" data-f="${k}"><span class="k">${lab}</span><b class="big">${nP?plc(nC,'cidade','cidades'):'Nenhuma cidade'}</b><small>${nP?`${nf(nP)} ${nP>1?'preços':'preço'} · ${det}`:'sem '+(k==='dn'?'desconto':'aumento')}</small>${nP?'<span class="vt">ver na tabela</span>':''}</button>`;
    resEl.innerHTML=`<div class="rs-top"><span class="bad${nUp?'':' gd'}">${nUp?svgW:okSvg}</span><b class="hl">${esc(headlineOf(S0))}</b></div>
    <div class="rs-hero">
      ${hero('up','up','Aumentos <small>('+esc(L.cb)+' mais caro que '+esc(L.ca)+')</small>',cUp.size,nUp,nUp?`média ${sg(sUp/nUp)} · maior aumento ${sg(maxUp)}`:'')}
      ${hero('dn','dn','Descontos <small>('+esc(L.cb)+' mais barato que '+esc(L.ca)+')</small>',cDn.size,nDn,nDn?`média ${sg(sDn/nDn)} · maior desconto ${sg(maxDn)}`:'')}
      <div class="hero avg"><span class="k">Variação média geral</span><b class="big ${sAll/nCmp<0?'neg':'pos'}">${sg(sAll/nCmp)}</b><small>de todos os preços comparados</small></div>
    </div>`;
    resEl.onclick=e=>{const g=e.target.closest('[data-f]');if(!g)return;const f=g.dataset.f;
      if(f==='dn'&&nDn)setFocus({t:'Cidades com desconto (preço novo menor)',l:[...cDn]});
      else if(f==='up'&&nUp)setFocus({t:'Cidades com acréscimo (preço novo maior)',l:[...cUp]})};
  }
  q('.s-uf').innerHTML+=[...new Set(rows.map(r=>r.u).filter(Boolean))].sort().map(u=>`<option>${esc(u)}</option>`).join('');
  if(!rows.some(r=>r.u))q('.s-uf').closest('.f').hidden=true;

  /* tabela */
  q('table').innerHTML='<thead><tr class="h1"><th class="l c1" rowspan="2">Cidade</th><th class="l c2" rowspan="2">UF</th>'+A.map(i=>`<th colspan="3" class="gs${i%2?' ga':''}">${esc(bandLabel(bands[i]))}${typeof bands[i]==='number'?' kg':''}</th>`).join('')+'</tr><tr class="h2">'+A.map(i=>`<th class="o gs${i%2?' ga':''}" title="${esc(L.nameA)}">${esc(L.ca)}</th><th class="nw${i%2?' ga':''}" title="${esc(L.nameB)}">${esc(L.cb)}</th><th class="${i%2?'ga':''}">% Dif</th>`).join('')+'</tr></thead><tbody></tbody>';
  const tb=q('tbody');
  let list=[],focus=null,gapItems=[];
  function triple(i,a,b){
    const g=i%2?' ga':'',p=pctOf(a,b);
    const dc=p==null?`<td class="d na${g}">—</td>`:Math.abs(p)<0.005?`<td class="d z${g}">0,00%</td>`:`<td class="d ${p>0?'u':'n'}${g}">${p>0?'+':'−'}${fmt(Math.abs(p))}%</td>`;
    const h=p!=null&&Math.abs(p)>=0.005?(p>0?' hu':' hn'):'';
    return `<td class="o gs${g}${h}">${a==null?'—':fmt(a)}</td><td class="nw${g}${h}">${b==null?'—':fmt(b)}</td>${dc}`;
  }
  function draw(){
    q('.count').textContent=list.length+' cidades';
    tb.innerHTML=list.map(r=>`<tr><td class="l c1 city cs-${cityState(r)||'n'}">${esc(r.n)}</td><td class="l c2 uf">${esc(r.u||'')}</td>${A.map(i=>triple(i,r.o?r.o.p[i]:null,r.w?r.w.p[i]:null)).join('')}</tr>`).join('')||`<tr><td colspan="${2+bands.length*3}" class="empty">Nenhuma cidade com estes filtros.</td></tr>`;
  }
  function build(){
    if(focus){list=focus.l.slice().sort((a,b)=>a.n.localeCompare(b.n,'pt-BR'));draw();return}
    const uf=q('.s-uf').value,qq=norm(q('.s-q').value),dif=q('.s-dif').checked,solo=q('.s-solo').checked;
    list=sorted.filter(r=>{
      if(!solo&&!both(r))return false;
      if(uf&&r.u!==uf)return false;
      if(qq&&!norm(r.n).includes(qq))return false;
      if(dif&&!isDiff(r))return false;
      return true});
    draw();
  }
  function setFocus(f){
    focus=f;const el=q('.focus');
    if(f){el.hidden=false;el.innerHTML=`<span>Mostrando na tabela: <b>${esc(f.t)}</b> (${f.l.length} ${f.l.length>1?'cidades':'cidade'})</span><button type="button" class="fx">Limpar e voltar</button>`;q('.fx').onclick=()=>setFocus(null)}else el.hidden=true;
    build();if(f)el.scrollIntoView({behavior:'smooth',block:'start'});
  }
  ['.s-uf','.s-dif','.s-solo'].forEach(s=>q(s).onchange=build);
  q('.s-q').oninput=build;
  q('.foot').innerHTML=`Preços como na planilha e pesos em kg. Para cada peso, três colunas lado a lado: ${esc(L.ca)}, ${esc(L.cb)} e % Dif = (${esc(L.cb)} − ${esc(L.ca)}) ÷ ${esc(L.ca)}. Quando há diferença, as três células do peso ficam coloridas e em negrito (azul: ${esc(L.cb)} mais barato; vermelho: ${esc(L.cb)} mais caro) e a cidade ganha um ponto: verde quando só há desconto, vermelho quando há algum aumento e cinza quando tudo é igual. Cinza nos números: igual.`;

  /* card de informações vazias */
  (function(){
    const empty=v=>v==null||v===''||v==='#REF!';
    const nm=r=>r.n+(r.u?' / '+r.u:'');
    const gone=sorted.filter(r=>r.o&&!r.w);
    const items=[];
    items.push({n:gone.length,t:`Cidades que estão ${L.inA} e não estão ${L.inB}`,s:`Ficam sem preço ${L.inB}.`,l:gone});
    const newOnly=sorted.filter(r=>r.w&&!r.o);
    items.push({n:newOnly.length,t:`Cidades que estão ${L.inB} e não estão ${L.inA}`,s:`Cidades novas: não há preço ${L.inA} para comparar.`,l:newOnly});
    const lostBands=bands.map((b,i)=>({b,i})).filter(({i})=>common.length&&common.some(r=>r.o.p[i]!=null)&&!common.some(r=>r.w.p[i]!=null));
    if(lostBands.length)items.push({n:lostBands.length,t:`Faixas de peso que existem ${L.inA} e não existem ${L.inB}`,s:'Sem nenhum preço em toda a coluna: '+lostBands.map(x=>bandFull(x.b)).join(', ')+'.',l:[]});
    if(meta.zi){const noCep=sorted.filter(r=>r.w&&empty(r.w.zi));const nNew=noCep.filter(r=>!r.o).length;
      items.push({n:noCep.length,t:`Cidades ${L.inB} sem CEP inicial e final`,s:nNew?`${nNew} não existiam ${L.inA}, então não há CEP para comparar.`:'Todas existem nas duas planilhas.',l:noCep})}
    if(meta.c){const clEmpty=sorted.filter(r=>r.w&&empty(r.w.c));const clLost=common.filter(r=>!empty(r.o.c)&&empty(r.w.c));
      const wasRef=clEmpty.filter(r=>r.o&&r.o.c==='#REF!').length,nNew=clEmpty.filter(r=>!r.o).length;
      items.push({n:clLost.length,t:`Cluster que tinha valor ${L.inA} e ficou vazio ${L.inB}`,s:clEmpty.length+` cidades estão sem cluster ${L.inB}: `+(wasRef?wasRef+' já tinham #REF! (erro) '+L.inA+' e ':'')+nNew+' são cidades que só existem '+L.inB+'.',l:clLost});
      const clNewOnly=clEmpty.filter(r=>!r.o),clOldEmpty=clEmpty.filter(r=>r.o);
      items.push({n:clNewOnly.length,t:`Cidades novas ${L.inB} sem cluster`,s:`Só existem ${L.inB}; não estão ${L.inA}.`,l:clNewOnly});
      items.push({n:clOldEmpty.length,t:`Cidades sem cluster ${L.inB} que já vinham vazias ou com erro ${L.inA}`,s:'Existem nas duas planilhas; o cluster já não estava preenchido antes.',l:clOldEmpty})}
    const onlyNew=common.filter(r=>r.o.p.some((a,i)=>a==null&&r.w.p[i]!=null));
    items.push({n:onlyNew.length,t:`Cidades com preço ${L.inB} em faixas que estavam vazias ${L.inA}`,s:'Existem nas duas planilhas, mas algumas faixas de peso só têm preço na nova.',l:onlyNew});
    const noPrice=common.filter(r=>r.o.p.some((a,i)=>a!=null&&r.w.p[i]==null&&bands.length&&!lostBands.some(x=>x.i===i)));
    items.push({n:noPrice.length,t:`Cidades com preço vazio ${L.inB} onde ${L.refA} tinha valor`,s:`Confere as ${bands.length} faixas de peso.`,l:noPrice});
    const f=[];
    if(meta.h)f.push('h');if(meta.d)f.push('d');
    if(f.length){const lost=[...new Set(f.flatMap(k=>common.filter(r=>!empty(r.o[k])&&empty(r.w[k]))))];
      items.push({n:lost.length,t:`Hub ou prazo vazio ${L.inB} onde ${L.refA} tinha valor`,s:'Confere hub e prazo das cidades presentes nas duas planilhas.',l:lost})}
    items.forEach((i,k)=>i.k=k);gapItems=items;
    const crit=items.filter(i=>i.n>0),el=q('.gap');
    if(!crit.length){el.className='gap okc';el.innerHTML=`<h2>${svgO}${esc(L.okTitle)}</h2>`;return}
    el.innerHTML=`<h2>${svgW}${esc(L.title)}</h2><p>${crit.length} ${crit.length>1?'pontos':'ponto'} de atenção. Clique em "ver na tabela" para puxar as cidades na tabela abaixo, ou em "ver cidades" e depois no nome de uma cidade.</p><div class="gl">`+items.map(i=>{
      const head=`<span class="n0${i.n?'':' z0'}">${i.n}</span><span class="tx">${esc(i.t)}<small>${esc(i.s)}</small></span>`;
      return i.n&&i.l.length?`<details class="gi"><summary>${head}<button type="button" class="go" data-k="${i.k}">ver na tabela</button><span class="ver">ver cidades</span></summary><div class="chips">${i.l.map((r,j)=>`<button type="button" data-c="${i.k}:${j}">${esc(nm(r))}</button>`).join('')}</div></details>`:`<div class="gi"><div class="gr">${head}</div></div>`}).join('')+'</div>';
    el.onclick=e=>{const g=e.target.closest('.go'),c=e.target.closest('[data-c]');
      if(g){e.preventDefault();e.stopPropagation();const i=items[+g.dataset.k];setFocus({t:i.t,l:i.l})}
      else if(c){const[k,j]=c.dataset.c.split(':');const r=items[+k].l[+j];if(r)setFocus({t:nm(r),l:[r]})}};
  })();
  function filtroTxt(){
    if(focus)return 'Mostrando: '+focus.t+' ('+focus.l.length+' '+(focus.l.length>1?'cidades':'cidade')+')';
    const f=[],uf=q('.s-uf').value,qq=q('.s-q').value.trim();
    if(uf)f.push('UF '+uf);if(qq)f.push('cidade contém "'+qq+'"');if(q('.s-dif').checked)f.push('só cidades com diferença');
    f.push(q('.s-solo').checked?'inclui cidades que estão em só uma planilha':'cidades presentes nas duas planilhas');
    return 'Filtros: '+f.join(' · ')+' · '+list.length+' '+(list.length===1?'cidade':'cidades');
  }
  exportBar(root,()=>({L,bands,list:list.slice(),isDiff,state:cityState,filtro:filtroTxt(),gaps:gapItems.filter(i=>i.n>0),
    st:{cidades:cUp.size,common:common.length,nDiff,nCmp,nDn,nUp,cDn:cDn.size,cUp:cUp.size,avgDn:nDn?sDn/nDn:0,avgUp:nUp?sUp/nUp:0,avgAll:nCmp?sAll/nCmp:0,maxUp,maxDn}}));
  build();
}

/* =============== LEITURA GENÉRICA DE PLANILHAS =============== */
function numOf(s){ // "1.234,56" | "2,10" | "R$ 3.5"
  if(typeof s==='number')return isFinite(s)?s:null;
  if(typeof s!=='string')return null;
  let t=s.replace(/R\$|\s|kg|g$/gi,'').replace(/[^\d.,\-]/g,'');
  if(!t||t==='-')return null;
  if(t.includes(',')&&t.includes('.'))t=t.replace(/\./g,'').replace(',','.');
  else if(t.includes(','))t=t.replace(',','.');
  const v=parseFloat(t);return isFinite(v)?v:null;
}
function weightOf(v){ // {add:true} | {w:kg} | null
  if(v==null||v==='')return null;
  if(typeof v==='number')return (v>0&&v<=100000)?{w:v}:null;
  const s=String(v).trim();
  if(/adicional|excedente|kg adic|por kg|exced/i.test(s))return {add:true};
  let m=s.match(/([\d.,]+)\s*(?:a|-|–|até|ate)\s*([\d.,]+)\s*(kg|g|kgs)?\s*$/i);
  let n,u;
  if(m){n=numOf(m[2]);u=m[3]}else{
    m=s.match(/^(?:até|ate|de|faixa|peso)?\s*([\d.,]+)\s*(kg|kgs|g|gr|quilos?)?\s*$/i);
    if(!m)return null;n=numOf(m[1]);u=m[2]}
  if(n==null||n<=0)return null;
  if(u&&/^(g|gr)$/i.test(u))n=n/1000;
  return {w:n};
}
const colLetter=i=>{let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s};
const CITY_RE=/^\s*(cidade|city|munic[ií]pio|pra[cç]a|destino|localidade|origem|nome da cidade)\b[^\d]{0,20}$/i;
const UF_RE=/^\s*(uf|estado|sigla)\s*$/i;
function isNumCell(v){return typeof v==='number'||(typeof v==='string'&&/\d/.test(v)&&numOf(v)!=null&&/^[\sR$\d.,\-]+$/.test(v))}
function detectHeader(M){
  const lim=Math.min(M.length,80);let best=-1,bs=-1;
  for(let r=0;r<lim;r++){
    const R=M[r]||[];const wc=R.filter(v=>weightOf(v)).length;if(wc<3)continue;
    let nx=r+1;while(nx<lim+3&&nx<M.length&&!(M[nx]||[]).some(v=>v!=null&&v!==''))nx++;
    const N=M[nx]||[];const nn=N.filter(isNumCell).length;
    if(!N.some(v=>typeof v==='string'&&v.trim().length>1&&!isNumCell(v)))continue;
    if(nn<wc*0.5)continue;
    const city=R.some(v=>typeof v==='string'&&CITY_RE.test(v));
    const sc=(city?1000:0)+wc-r*0.001;
    if(sc>bs){bs=sc;best=r}
  }
  return best;
}
function detectCols(M,h){
  const H=M[h]||[];const n=Math.max(H.length,...M.slice(h+1,h+60).map(r=>(r||[]).length),0);
  const data=M.slice(h+1,h+301);
  let wcols=[];for(let c=0;c<H.length;c++){if(weightOf(H[c]))wcols.push(c)}
  wcols=wcols.filter(c=>{let t=0,k=0;data.forEach(r=>{const v=(r||[])[c];if(v!=null&&v!==''){t++;if(isNumCell(v))k++}});return t>0&&k/t>=0.5});
  let city=H.findIndex(v=>typeof v==='string'&&CITY_RE.test(v));
  if(city<0){let bc=-1,bn=0;for(let c=0;c<n;c++){if(wcols.includes(c))continue;const k=data.filter(r=>{const v=(r||[])[c];return typeof v==='string'&&v.trim().length>2&&!isNumCell(v)}).length;if(k>bn){bn=k;bc=c}}city=bc}
  let uf=H.findIndex(v=>typeof v==='string'&&UF_RE.test(v));
  if(uf<0){for(let c=0;c<n;c++){if(c===city||wcols.includes(c))continue;const vs=data.map(r=>(r||[])[c]).filter(v=>v!=null&&v!=='');if(vs.length>3&&vs.filter(v=>/^[A-Za-z]{2}$/.test(String(v).trim())).length/vs.length>=0.8){uf=c;break}}}
  return {city,uf,first:wcols.length?wcols[0]:-1,last:wcols.length?wcols[wcols.length-1]:-1};
}
function autoCfg(M){const h=detectHeader(M);if(h<0)return null;return {hdr:h,...detectCols(M,h)}}
function parseRows(M,cfg){
  const H=M[cfg.hdr]||[];const wc=[],seen=new Set();
  for(let c=cfg.first;c<=cfg.last&&c>=0;c++){if(c===cfg.city||c===cfg.uf)continue;const w=weightOf(H[c]);if(!w)continue;const key=w.add?'add':Math.round(w.w*10000);if(seen.has(key))continue;seen.add(key);wc.push({c,key,v:w.add?'adicional':w.w})}
  const findc=re=>H.findIndex(v=>typeof v==='string'&&re.test(v));
  const mc={h:findc(/^\s*(hub|base|filial)/i),c:findc(/cluster/i),d:findc(/dead|ealine|prazo/i),zi:findc(/(initial|inicial|ini\b|de)\W*(zip|cep)|(zip|cep)\W*(initial|inicial|ini)/i),zf:findc(/(final|fim|at[eé])\W*(zip|cep)|(zip|cep)\W*(final|fim|at[eé])/i)};
  const out=new Map();let dup=0,skipped=0;
  for(let r=cfg.hdr+1;r<M.length;r++){
    const R=M[r]||[];const cv=R[cfg.city];if(cv==null)continue;
    const city=String(cv).trim();if(!city||isNumCell(cv)||/^(total|obs|nota|legenda)/i.test(city))continue;
    const p=wc.map(x=>{const v=numOf(R[x.c]);return v!=null&&v>0?v:null});
    if(!p.some(v=>v!=null)){skipped++;continue}
    const u=cfg.uf>=0&&R[cfg.uf]!=null?String(R[cfg.uf]).trim().toUpperCase():'';
    const key=norm(city)+'|'+norm(u);
    if(out.has(key)){dup++;continue}
    const g=k=>mc[k]>=0&&R[mc[k]]!=null&&R[mc[k]]!==''?String(R[mc[k]]).trim():null;
    out.set(key,{n:city,u,p,keys:wc.map(x=>x.key),h:g('h'),c:g('c'),d:g('d'),zi:g('zi'),zf:g('zf')});
  }
  return {rows:[...out.values()],wc,dup,mc,hasUF:cfg.uf>=0};
}
function mergeSides(a,b){
  const keyV=new Map();
  [a,b].forEach(s=>s.wc.forEach(x=>keyV.set(x.key,x.v)));
  const keys=[...keyV.keys()].sort((x,y)=>(x==='add')-(y==='add')||(x==='add'?0:x-y));
  const bands=keys.map(k=>keyV.get(k));
  const useUF=a.hasUF&&b.hasUF;
  const idx=(s)=>{const m=new Map();s.rows.forEach(r=>m.set(norm(r.n)+(useUF?'|'+norm(r.u):''),r));return m};
  const ma=idx(a),mb=idx(b);
  const align=(r)=>{const p=keys.map(k=>{const j=r.keys.indexOf(k);return j<0?null:r.p[j]});return {p,h:r.h,c:r.c,d:r.d,zi:r.zi,zf:r.zf}};
  const out=[];const all=new Set([...ma.keys(),...mb.keys()]);
  all.forEach(k=>{const x=ma.get(k),y=mb.get(k);const ref=y||x;out.push({n:ref.n,u:ref.u||(x&&x.u)||'',o:x?align(x):null,w:y?align(y):null})});
  const both=(k)=>a.mc[k]>=0&&b.mc[k]>=0;
  return {rows:out,bands,meta:{h:both('h'),c:both('c'),d:both('d'),zi:both('zi')}};
}

/* =============== ABA A: FRENET ADO =============== */
const DATA=__DATA__;
DATA.meta={h:true,c:true,d:true,zi:true};
mountView($('#tabA'),DATA,{intro:'<b>Análise da aba ADO 1500 a 4500.</b> Compara a planilha antiga (31/01/2025) com a planilha nova (06/10/2026), as duas na aba de ADO de 1500 a 4500. Mostra, cidade a cidade, onde o preço novo ficou mais caro (aumento) ou mais barato (desconto).',head:{a:{n:'Pegaki',v:'antiga · 31/01/2025',f:'Proposta ADO 1500 a 4500'},b:{n:'Pegaki',v:'nova · 06/10/2026',f:'Proposta ADO 1500-4500'}},ca:'Antigo',cb:'Novo',nameA:'Planilha antiga (31/01/2025)',nameB:'Planilha nova (06/10/2026)',inA:'na antiga',refA:'a antiga',inB:'na nova',title:'Informações vazias na nova base em relação à antiga',okTitle:'A nova base não tem informações vazias em relação à antiga'});


/* =============== DETECÇÃO DA TRANSPORTADORA E DA DATA =============== */
const KNOWN=['Pegaki','Jadlog','Loggi','Correios','Total Express','Sequoia','Braspress','Jamef','Azul Cargo','Mandaê','Kangu','Melhor Envio','J&T Express','Shopee Xpress','Mercado Envios','Rodonaves','TNT','FedEx','DHL','Direct Express','Favorita','Alfa Transportes','Rapidão Cometa','Patrus','Flash Courier','Lalamove','Cargo X','Latam Cargo','Gollog','Buslog','Transfolha','Jet Express','Intelipost','Tex Courier','Active Logistics','Carriers','Sedex','Binpar','Entrego','Bem Express','Rede Sul','Expresso São Miguel','Transportes Bertolini','Translovato','ATUAL Cargas','Vitória Transportes'];
const STOPW=new Set(['frenet','cliente','contratante','contratada','empresa','transportadora','operadora','pontos','ponto','rede','origem','destino','proposta','tabela','comercial','prazo','preco','precos','valor','valores','coleta','entrega','embalagem','capa','seguro','nota','fiscal','conforme','sendo','todos','todas','cada','deste','desta','este','esta','nosso','nossa','sua','seu']);
function titleCase(w){return w.length>3&&w===w.toUpperCase()?w[0]+w.slice(1).toLowerCase():w}
function fileDate(name){
  let m=name.match(/(?<!\d)(\d{4})[-_.](\d{1,2})[-_.](\d{1,2})(?!\d)/);
  if(m&&+m[2]>=1&&+m[2]<=12&&+m[3]>=1&&+m[3]<=31)return String(m[3]).padStart(2,'0')+'/'+String(m[2]).padStart(2,'0')+'/'+m[1];
  m=name.match(/(?<!\d)(\d{1,2})[-_. ](\d{1,2})[-_. ](\d{4}|\d{2})(?!\d)/);
  if(m&&+m[2]>=1&&+m[2]<=12&&+m[1]>=1&&+m[1]<=31){const y=m[3].length===2?'20'+m[3]:m[3];return String(m[1]).padStart(2,'0')+'/'+String(m[2]).padStart(2,'0')+'/'+y}
  return '';
}
function detectCarrier(s){
  const texts=[];
  const P=s.wb.Props||{};[P.Company,P.Title,P.Subject].forEach(v=>v&&texts.push([String(v),3]));
  s.wb.SheetNames.forEach(n=>texts.push([n,1]));
  Object.values(s.mats).forEach(M=>{let k=0;for(const R of M){if(k++>400)break;for(const v of (R||[])){if(typeof v==='string'&&v.length>2&&v.length<600&&!isNumCell(v))texts.push([v,1])}}});
  const sc=new Map();
  const CTX=/logo|rede|transportadora|operadora|parceir|etiqueta|homolog|ponto/i;
  KNOWN.forEach(name=>{
    const nn=' '+norm(name)+' ';let tot=0;
    texts.forEach(([t,w])=>{const c=(' '+norm(t)+' ').split(nn).length-1;if(c)tot+=c*w*(CTX.test(t)?3:1)});
    const fc=(' '+norm(s.file||'')+' ').split(nn).length-1;tot+=fc*5;
    if(tot)sc.set(name,tot)});
  if(sc.size){return [...sc.entries()].sort((a,b)=>b[1]-a[1])[0][0]}
  const cand=new Map(),add=w=>{const k=norm(w);if(k.length<3||STOPW.has(k)||/^\d/.test(k))return;const o=cand.get(k)||{n:0,w};o.n++;cand.set(k,o)};
  const re1=/\b(?:logo|rede|pontos?|transportadora|operadora|parceir[oa]|empresa)\s+(?:d[aeo]s?\s+)?([A-ZÀ-Ý][\p{L}&]{2,})/gu,re2=/\b[Aa]\s+([A-ZÀ-Ý][\p{L}&]{2,})\s+dever[aá]/gu,re3=/\bXD\s+([A-ZÀ-Ý][\p{L}&]{2,})/g;
  texts.forEach(([t])=>{for(const re of [re1,re2,re3]){re.lastIndex=0;let m;while((m=re.exec(t)))add(m[1])}});
  if(cand.size){const top=[...cand.values()].sort((a,b)=>b.n-a.n)[0];if(top.n>=2)return titleCase(top.w)}
  const base=(s.file||'').replace(/\.[a-z0-9]+$/i,'').split(/[^\p{L}\d&]+/u).filter(w=>w.length>=3&&!/\d/.test(w)&&!STOPW.has(norm(w))&&!/^(copia|c|pia|atualiza|abrang|ncia|externo|novo|nova|ado|final|rev|versao)$/i.test(w));
  return base.length?titleCase(base[0]):'';
}
function detectMeta(s){
  let ver=fileDate(s.file||'');
  if(!ver){const P=s.wb.Props||{};const d=P.ModifiedDate||P.CreatedDate;if(d instanceof Date&&!isNaN(d))ver=d.toLocaleDateString('pt-BR')}
  return {carrier:detectCarrier(s),ver};
}
function carrierChip(a,b){a=(a||'').trim();b=(b||'').trim();if(!a&&!b)return '';if(!b||norm(a)===norm(b))return a||b;if(!a)return b;return a+' × '+b}
let curTab='A',openCarr='';
function updateH1(){
  let t='';
  if(curTab==='A'||curTab==='A2')t='Pegaki';
  else if(curTab==='B'&&side.a.parsed&&side.b.parsed)t=carrierChip(side.a.carrier,side.b.carrier);
  else if(curTab==='C')t=openCarr;
  $('#hc').textContent=t;
}

const DATA2=__DATA2__;
mountView($('#tabA2'),DATA2,{intro:'<b>Comparativo entre abas diferentes.</b> Compara a aba ADO até 1500 da planilha antiga (31/01/2025) com a aba ADO 1500 a 4500 da planilha nova (06/10/2026). Mostra se as cidades que tinham preço até 1500 mantiveram preço na faixa nova, o que mudou de valor e quais cidades só existem na nova.',head:{a:{n:'Pegaki',v:'antiga · 31/01/2025',f:'aba Proposta ADO até 1500'},b:{n:'Pegaki',v:'nova · 06/10/2026',f:'aba Proposta ADO 1500-4500'}},ca:'Antigo',cb:'Novo',nameA:'Antiga (31/01/2025) · aba ADO até 1500',nameB:'Nova (06/10/2026) · aba ADO 1500 a 4500',inA:'na antiga (até 1500)',inB:'na nova (1500 a 4500)',refA:'a antiga (até 1500)',title:'Informações vazias na nova (1500 a 4500) em relação à antiga (até 1500)',okTitle:'A nova (1500 a 4500) não tem informações vazias em relação à antiga (até 1500)'});

/* =============== ABA B: OUTRAS PLANILHAS =============== */
const side={a:{carrier:'',ver:''},b:{carrier:'',ver:''}};
const loaderEl=$('#loader');
function sideHtml(k){
  const s=side[k],t=k==='a'?'Planilha A':'Planilha B',sub=k==='a'?'referência (a mais antiga ou a base)':'a que será comparada com A';
  let h=`<h3>${t} <small>${sub}</small></h3>`;
  if(!s.wb){
    h+=`<label class="drop" data-k="${k}"><input type="file" accept=".xlsx,.xlsm,.xls,.csv,.txt"><b>Arraste a planilha aqui</b><span>ou clique para escolher</span><small>.xlsx, .xls ou .csv</small></label>`;
    if(s.err)h+=`<div class="er">${esc(s.err)}</div>`;
    return h;
  }
  const names=Object.keys(s.info);
  h+=`<div class="fl"><span class="fn">${esc(s.file)}</span><button type="button" class="lk" data-trocar="${k}">trocar</button></div>
  <div class="two"><label class="t">Transportadora${s.detC&&!s.edC?' <span class="auto">lida do arquivo</span>':''}<input class="nm" data-carrier="${k}" maxlength="40" placeholder="Ex.: Jadlog" value="${esc(s.carrier)}"></label>
  <label class="t">Versão / data${s.detV&&!s.edV?' <span class="auto">lida do arquivo</span>':''}<input class="nm" data-ver="${k}" maxlength="20" placeholder="Ex.: Out/2026" value="${esc(s.ver)}"></label></div>
  <label class="t">Aba da planilha<select data-sheet="${k}">${names.map(n=>`<option value="${esc(n)}"${n===s.sheet?' selected':''}>${esc(n)} — ${s.info[n].txt}</option>`).join('')}</select></label>`;
  if(s.cfg&&s.parsed){
    const pr=s.parsed;
    h+=`<div class="ok2">Lido: ${pr.rows.length} cidades × ${pr.wc.length} faixas de peso${pr.hasUF?'':' (sem coluna UF)'}</div>`;
    if(pr.dup)h+=`<div class="mut">${pr.dup} linhas repetidas (mesma cidade e UF) foram ignoradas.</div>`;
    const M=s.mats[s.sheet],c=s.cfg,H0=M[c.hdr]||[];
    const cols=Math.max(H0.length,...M.slice(c.hdr+1,c.hdr+40).map(r=>(r||[]).length));
    const opt=(sel,none)=>(none?`<option value="-1"${sel<0?' selected':''}>— nenhuma —</option>`:'')+Array.from({length:cols},(_,i)=>`<option value="${i}"${i===sel?' selected':''}>${colLetter(i)} · ${esc(String(H0[i]==null?'':H0[i]).slice(0,18))}</option>`).join('');
    h+=`<details class="adj"><summary>Ajustar leitura (se algo vier errado)</summary><div class="g">
      <label class="t">Linha do cabeçalho<input type="number" min="1" value="${c.hdr+1}" data-f="hdr" data-k="${k}"></label>
      <label class="t">Coluna da cidade<select data-f="city" data-k="${k}">${opt(c.city)}</select></label>
      <label class="t">Coluna da UF<select data-f="uf" data-k="${k}">${opt(c.uf,true)}</select></label>
      <label class="t">Primeira coluna de peso<select data-f="first" data-k="${k}">${opt(c.first)}</select></label>
      <label class="t">Última coluna de peso<select data-f="last" data-k="${k}">${opt(c.last)}</select></label></div></details>`;
  }else h+=`<div class="er">Não encontrei uma tabela de cidades × pesos nesta aba. Tente outra aba ou ajuste a leitura.</div>`;
  return h;
}
function renderLoader(){
  loaderEl.innerHTML=['a','b'].map(k=>`<div class="lside" data-side="${k}">${sideHtml(k)}</div>`).join('');
  if(!(side.a.parsed&&side.b.parsed&&side.a.parsed.rows.length&&side.b.parsed.rows.length)){$('#viewB').innerHTML='<p class="hint">Carregue as duas planilhas para ver o comparativo.</p>';setSaveMsg('')}
  updateH1();
}
function infoOf(){const a=side.a,b=side.b;return {carrierA:a.carrier,verA:a.ver,fileA:a.file,sheetA:a.sheet,carrierB:b.carrier,verB:b.ver,fileB:b.file,sheetB:b.sheet}}
let curD=null;
function refreshView(){
  const a=side.a,b=side.b;
  if(!(a.parsed&&b.parsed&&a.parsed.rows.length&&b.parsed.rows.length))return;
  const D=mergeSides(a.parsed,b.parsed);curD=D;
  const common=D.rows.filter(r=>r.o&&r.w).length;
  const el=$('#viewB');el.innerHTML='';
  if(!common){el.innerHTML='<p class="hint er">Nenhuma cidade em comum entre as duas planilhas. Confira se a coluna de cidade (e UF) está correta em cada lado.</p>';setSaveMsg('');return}
  mountView(el,D,buildL(infoOf()));
  updateH1();
  scheduleSave();
}
function evalSheets(s){
  s.mats={};s.info={};let best=null,bs=-1;
  s.wb.SheetNames.forEach(n=>{
    const M2=XLSX.utils.sheet_to_json(s.wb.Sheets[n],{header:1,raw:true,defval:null,blankrows:true});
    s.mats[n]=M2;
    const cfg=autoCfg(M2);let txt='sem tabela de preços';
    if(cfg&&cfg.first>=0&&cfg.city>=0){const p=parseRows(M2,cfg);if(p.rows.length){txt=p.rows.length+' cidades × '+p.wc.length+' pesos';const sc=p.rows.length*Math.min(p.wc.length,5);if(sc>bs){bs=sc;best=n}}}
    s.info[n]={txt};
  });
  return best||s.wb.SheetNames[0];
}
function setSheet(s,n,keepCfg){
  s.sheet=n;const M=s.mats[n];
  s.cfg=keepCfg||autoCfg(M);s.parsed=null;
  if(s.cfg&&s.cfg.city>=0&&s.cfg.first>=0)s.parsed=parseRows(M,s.cfg);
}
async function loadFile(k,file){
  const s=side[k];s.err='';
  try{
    const buf=await file.arrayBuffer();
    s.wb=XLSX.read(buf,{type:'array',cellDates:false});
    s.file=file.name;
    const sheet=evalSheets(s);
    const other=side[k==='a'?'b':'a'];
    const pick=other.sheet&&s.wb.SheetNames.includes(other.sheet)&&s.info[other.sheet].txt.includes('cidades')?other.sheet:sheet;
    setSheet(s,pick);
    const dm=detectMeta(s);s.detC=dm.carrier;s.detV=dm.ver;
    if(!s.edC)s.carrier=dm.carrier;if(!s.edV)s.ver=dm.ver;
  }catch(e){s.wb=null;s.err='Não consegui ler este arquivo ('+(e&&e.message||e)+'). Use .xlsx, .xls ou .csv.'}
  renderLoader();refreshView();
}
loaderEl.addEventListener('change',e=>{
  const t=e.target,sd=t.closest('[data-side]');if(!sd)return;const k=sd.dataset.side,s=side[k];
  if(t.type==='file'&&t.files[0]){loadFile(k,t.files[0]);return}
  if(t.dataset.sheet){setSheet(s,t.value);renderLoader();refreshView();return}
  if(t.dataset.f){
    const f=t.dataset.f,M=s.mats[s.sheet];let c={...s.cfg};
    if(f==='hdr'){const h=Math.max(0,(+t.value||1)-1);c={hdr:h,...detectCols(M,h)}}
    else c[f]=+t.value;
    setSheet(s,s.sheet,c);renderLoader();
    const d=$(`[data-side="${k}"] details.adj`);if(d)d.open=true;
    refreshView();
  }
});
let nmT;
loaderEl.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.carrier){side[t.dataset.carrier].carrier=t.value;side[t.dataset.carrier].edC=true;clearTimeout(nmT);nmT=setTimeout(refreshView,400)}
  if(t.dataset.ver){side[t.dataset.ver].ver=t.value;side[t.dataset.ver].edV=true;clearTimeout(nmT);nmT=setTimeout(refreshView,400)}});
loaderEl.addEventListener('click',e=>{const t=e.target.closest('[data-trocar]');if(t){const s=side[t.dataset.trocar];Object.assign(s,{wb:null,parsed:null,cfg:null,file:'',sheet:'',err:'',carrier:'',ver:'',edC:false,edV:false});renderLoader()}});
['dragover','dragenter'].forEach(ev=>loaderEl.addEventListener(ev,e=>{const d=e.target.closest('.drop');if(d){e.preventDefault();d.classList.add('on')}}));
['dragleave','drop'].forEach(ev=>loaderEl.addEventListener(ev,e=>{const d=e.target.closest('.drop');if(d){e.preventDefault();d.classList.remove('on');if(ev==='drop'&&e.dataTransfer.files[0])loadFile(d.dataset.k,e.dataTransfer.files[0])}}));

/* =============== HISTÓRICO (banco da página) =============== */
const Hs={db:null,canWrite:null,docs:[],open:null,confirmDel:null,q:'',saved:new Set(),loaded:false,err:''};
function setSaveMsg(t,cls){const el=$('#saveMsg');el.className='savemsg '+(cls||'');el.textContent=t||'';el.hidden=!t}
const rd=v=>v==null?null:Math.round(v*1e6)/1e6;
const hashStr=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(36)};
const metaArr=x=>x?[x.h??null,x.c??null,x.d??null,x.zi??null,x.zf??null]:null;
function encodeRows(rows){return rows.map(r=>[r.n,r.u||'',r.o?r.o.p.map(rd):null,r.w?r.w.p.map(rd):null,metaArr(r.o),metaArr(r.w)])}
function decodeRows(arr){const mk=(p,m)=>p?{p,h:m&&m[0],c:m&&m[1],d:m&&m[2],zi:m&&m[3],zf:m&&m[4]}:null;return arr.map(x=>({n:x[0],u:x[1],o:mk(x[2],x[4]),w:mk(x[3],x[5])}))}
async function deleteEntry(id){const sn=await Hs.db.collection('analises/'+id+'/dados').get();for(const x of sn.docs)await Hs.db.doc('analises/'+id+'/dados/'+x.id).delete();await Hs.db.doc('analises/'+id).delete()}
Hs.sess=new Map();
let saveT;
function scheduleSave(){clearTimeout(saveT);saveT=setTimeout(saveAnalysis,700)}
async function saveAnalysis(){
  const D=curD,info=infoOf();if(!D)return;
  if(!Hs.db){setSaveMsg('Histórico indisponível neste modo de visualização: a análise não foi salva.','warn');return}
  if(Hs.canWrite===false){setSaveMsg('Você tem acesso somente leitura: a análise não será salva no histórico.','warn');return}
  const unk=!info.carrierA.trim()||!info.carrierB.trim();
  if(!info.carrierA.trim())info.carrierA='Não identificada';
  if(!info.carrierB.trim())info.carrierB='Não identificada';
  const st=statsOf(D);
  const sum=D.rows.reduce((t,r)=>t+(r.o?r.o.p.reduce((x,v)=>x+(v||0),0):0)+(r.w?r.w.p.reduce((x,v)=>x+(v||0),0):0),0);
  const id='a'+hashStr([info.fileA,info.sheetA,info.fileB,info.sheetB,st.cidadesA,st.cidadesB,sum.toFixed(2)].join('|'));
  const ref=Hs.db.doc('analises/'+id);
  setSaveMsg('Salvando no histórico…');
  try{
    const snap=await ref.get(),now=new Date().toISOString();
    const base={...info,updatedAt:now};
    if(snap.exists){await ref.update(base);setSaveMsg(unk?'Informe a transportadora para atualizar o histórico.':'Análise já estava no histórico; nomes atualizados.',unk?'warn':'good')}
    else{
      const enc=encodeRows(D.rows),N=60,chunks=Math.ceil(enc.length/N);
      for(let c=0;c<chunks;c++)await ref.collection('dados').doc('c'+String(c).padStart(3,'0')).set({rows:enc.slice(c*N,(c+1)*N)});
      await ref.set({id,createdAt:now,...base,bands:D.bands,meta:D.meta,stats:st,nChunks:chunks,conferido:false,nota:''});
      const pk=info.fileA+'|'+info.fileB,prev=Hs.sess.get(pk);Hs.sess.set(pk,id);
      if(prev&&prev!==id){try{await deleteEntry(prev)}catch(e){}}
      setSaveMsg(unk?'Análise salva no histórico, mas não identifiquei a transportadora no arquivo. Digite o nome acima e o histórico será atualizado.':'Análise salva no histórico.',unk?'warn':'good');
    }
  }catch(e){setSaveMsg('Não consegui salvar no histórico ('+(e&&e.code||e&&e.message||e)+').','warn')}
}
const fdt=iso=>{try{return new Date(iso).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch(e){return iso||''}};
function renderHist(){
  const el=$('#histList');if(!el)return;
  $('#histCount').textContent=Hs.docs.length?` (${Hs.docs.length})`:'';
  if(!Hs.db){el.innerHTML='<p class="hint">O histórico não está disponível neste modo de visualização.</p>';return}
  if(!Hs.loaded){el.innerHTML='<p class="hint">Carregando histórico…</p>';return}
  const q=norm(Hs.q);
  const L=Hs.docs.filter(d=>!q||norm([d.carrierA,d.carrierB,d.verA,d.verB,d.fileA,d.fileB,d.nota].join(' ')).includes(q));
  if(!Hs.docs.length){el.innerHTML='<p class="hint">Nenhuma análise salva ainda. Carregue duas planilhas na aba "Comparar outras planilhas" e ela será salva aqui automaticamente.</p>';return}
  el.innerHTML=`<div class="box"><div class="scroll" style="max-height:none"><table class="ht"><thead><tr><th class="l">Data do comparativo</th><th class="l">Transportadora</th><th class="l">Arquivos</th><th>Cidades em comum</th><th>Cidades com diferença</th><th>Só em A</th><th>Só em B</th><th class="l">Situação</th><th class="l">Ações</th></tr></thead><tbody>`+
  (L.map(d=>{const s=d.stats||{};const same=norm(d.carrierA||'')===norm(d.carrierB||'');
    const nm=same?`${esc(d.carrierA)} <small>${esc(d.verA||'A')} × ${esc(d.verB||'B')}</small>`:`${esc(d.carrierA)}${d.verA?' <small>'+esc(d.verA)+'</small>':''} <span class="vs">×</span> ${esc(d.carrierB)}${d.verB?' <small>'+esc(d.verB)+'</small>':''}`;
    const act=Hs.confirmDel===d.id?`<button class="lk dg" data-hdel="${d.id}">Confirmar exclusão</button> <button class="lk" data-hcancel="1">Cancelar</button>`:`<button class="lk" data-hopen="${d.id}">Abrir</button> <button class="lk dg2" data-hask="${d.id}">Excluir</button>`;
    return `<tr${Hs.open===d.id?' class="sel"':''}><td class="l">${fdt(d.createdAt)}</td><td class="l tn">${nm}</td><td class="l fl2">A: ${esc(d.fileA||'')}<br>B: ${esc(d.fileB||'')}</td><td>${s.comuns??''}</td><td class="${s.cidadesDif?'hu2':''}">${s.cidadesDif??''}</td><td>${s.soA??''}</td><td>${s.soB??''}</td><td class="l">${d.conferido?'<span class="bdg ok3">conferida</span>':'<span class="bdg">pendente</span>'}${d.nota?'<br><small>'+esc(d.nota.slice(0,60))+'</small>':''}</td><td class="l">${act}</td></tr>`}).join('')||'<tr><td colspan="9" class="empty">Nada encontrado para esta busca.</td></tr>')+`</tbody></table></div></div>`;
}
async function openEntry(id){
  const d=Hs.docs.find(x=>x.id===id);if(!d)return;
  Hs.open=id;renderHist();
  const pane=$('#histView');pane.innerHTML='<p class="hint">Carregando análise…</p>';
  try{
    const snap=await Hs.db.collection('analises/'+id+'/dados').get();
    const rows=snap.docs.sort((a,b)=>a.id<b.id?-1:1).flatMap(x=>decodeRows(x.data().rows));
    const D={rows,bands:d.bands,meta:d.meta||{}};
    pane.innerHTML=`<div class="hpanel"><div class="hp1"><b>Análise salva em ${esc(fdt(d.createdAt))}</b><button class="lk" id="hclose">Fechar</button></div>
      <div class="hp2"><label class="chk"><input type="checkbox" id="hconf"${d.conferido?' checked':''}> Marcar como conferida</label>
      <label class="t grow">Observação<input class="nm" id="hnota" maxlength="300" placeholder="Ex.: conferido com o comercial em 07/10" value="${esc(d.nota||'')}"></label></div></div><div id="hmount" class="view"></div>`;
    mountView($('#hmount'),D,buildL(d));openCarr=carrierChip(d.carrierA,d.carrierB);updateH1();
    pane.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){pane.innerHTML='<p class="hint er">Não consegui abrir esta análise ('+esc(e&&e.code||e&&e.message||e)+').</p>'}
}
async function patchEntry(id,patch){try{await Hs.db.doc('analises/'+id).update({...patch,updatedAt:new Date().toISOString()})}catch(e){}}
let notaT;
$('#tabC').addEventListener('click',async e=>{
  const g=k=>e.target.closest('['+k+']');
  if(g('data-hopen')){openEntry(g('data-hopen').dataset.hopen);return}
  if(g('data-hask')){Hs.confirmDel=g('data-hask').dataset.hask;renderHist();return}
  if(g('data-hcancel')){Hs.confirmDel=null;renderHist();return}
  if(e.target.id==='hclose'){Hs.open=null;openCarr='';updateH1();$('#histView').innerHTML='';renderHist();return}
  if(g('data-hdel')){
    const id=g('data-hdel').dataset.hdel;Hs.confirmDel=null;
    try{await deleteEntry(id);if(Hs.open===id){Hs.open=null;$('#histView').innerHTML=''}}catch(err){}
    renderHist();
  }
});
$('#tabC').addEventListener('change',e=>{if(e.target.id==='hconf'&&Hs.open)patchEntry(Hs.open,{conferido:e.target.checked})});
$('#tabC').addEventListener('input',e=>{
  if(e.target.id==='hnota'&&Hs.open){const id=Hs.open,v=e.target.value;clearTimeout(notaT);notaT=setTimeout(()=>patchEntry(id,{nota:v}),700)}
  if(e.target.id==='hq'){Hs.q=e.target.value;renderHist()}});
async function initHist(){
  try{
    if(!(window.claude&&claude.use))return;
    Hs.db=await claude.use('db');
    try{const u=await claude.use('user');Hs.canWrite=u?await u.can('data.write'):null}catch(e){}
    if(!Hs.db){renderHist();return}
    Hs.db.collection('analises').orderBy('createdAt','desc').limit(500).onSnapshot(sn=>{Hs.docs=sn.docs.map(x=>({id:x.id,...x.data()}));Hs.loaded=true;renderHist()},err=>{Hs.loaded=true;Hs.err=err&&err.code;renderHist()});
  }catch(e){Hs.db=null}
  renderHist();
}
renderLoader();renderHist();initHist();

/* =============== ABAS E TEMA =============== */
const SUBS={A:'',A2:'',D:'Pedidos de acesso: libere ou bloqueie quem abriu este comparativo.',C:'Todas as análises de planilhas carregadas ficam guardadas aqui para você conferir quando precisar.',B:'Carregue duas planilhas de outras transportadoras (ou duas versões da mesma) e compare cidade por cidade.'};
function setTab(t){document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===t));['A','A2','B','C','D'].forEach(k=>{const e=$('#tab'+k);if(e)e.hidden=k!==t});curTab=t;updateH1();$('#sub').textContent=SUBS[t];$('#sub').hidden=!SUBS[t];try{localStorage.setItem('cmp-tab',t)}catch(e){}}
$('.tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setTab(b.dataset.tab)});
setTab('A');
function setTheme(t){const r=document.documentElement;if(t==='system')r.removeAttribute('data-theme');else r.setAttribute('data-theme',t);document.querySelectorAll('#themeToggle button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===t));try{localStorage.setItem('cmp-theme',t)}catch(e){}}
$('#themeToggle').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setTheme(b.dataset.t)});
try{const t=localStorage.getItem('cmp-theme');if(t)setTheme(t)}catch(e){}

/* =============== ACESSO (pedido + liberação) =============== */
(function(){
  const gate=$('#gate'),box=$('#gateBox');
  const unlock=()=>{document.body.classList.remove('locked');gate.hidden=true};
  const say=(h)=>{box.innerHTML=h};
  const when=t=>{try{return new Date(t).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch(e){return ''}};
  async function adminPanel(db,user){
    const btn=$('#tabDbtn');btn.hidden=false;
    let ped=[],lib=[];
    const root=$('#accList');
    const render=()=>{
      const libIds=new Set(lib.map(x=>x.uid));
      const pend=ped.filter(x=>!libIds.has(x.uid)).sort((a,b)=>(b.at||0)-(a.at||0));
      $('#accCount').textContent=pend.length?` (${pend.length})`:'';
      const row=(x,ok)=>`<div class="accrow"><div><b>${esc(x.name||'Sem nome')}</b><span>${esc(x.email||'e-mail não informado')}</span><small>${ok?'liberado':'pediu'} em ${esc(when(x.at))}</small></div><div>${ok?`<button class="go" data-rev="${esc(x.uid)}">Bloquear</button>`:`<button class="go primary" data-ok="${esc(x.uid)}">Liberar</button> <button class="go" data-no="${esc(x.uid)}">Negar</button>`}</div></div>`;
      root.innerHTML=`<h3>Aguardando liberação (${pend.length})</h3>${pend.map(x=>row(x,false)).join('')||'<p class="muted">Nenhum pedido pendente.</p>'}<h3>Com acesso (${lib.length})</h3>${lib.map(x=>row(x,true)).join('')||'<p class="muted">Ninguém liberado ainda além de você.</p>'}`;
    };
    db.collection('pedidos').onSnapshot(sn=>{ped=sn.docs.map(d=>d.data());render()});
    db.collection('liberados').onSnapshot(sn=>{lib=sn.docs.map(d=>d.data());render()});
    root.addEventListener('click',async e=>{
      const b=e.target.closest('button');if(!b)return;
      try{
        if(b.dataset.ok){const x=ped.find(p=>p.uid===b.dataset.ok);if(x)await db.doc('liberados/'+x.uid).set({uid:x.uid,name:x.name||'',email:x.email||'',at:Date.now()})}
        else if(b.dataset.no){await db.doc('pedidos/'+b.dataset.no).delete()}
        else if(b.dataset.rev){await db.doc('liberados/'+b.dataset.rev).delete()}
      }catch(err){root.insertAdjacentHTML('afterbegin','<p class="muted">Não foi possível salvar: '+esc(err&&err.message||err)+'</p>')}
    });
  }
  (async function(){
    let user=null,db=null;
    try{user=await claude.use('user');db=await claude.use('db')}catch(e){}
    let admin=false;
    try{admin=!!(user&&(await user.isOwner()||await user.canEdit()))}catch(e){}
    if(admin){unlock();if(db)adminPanel(db,user);return}
    if(!user||!db){gate.hidden=false;say('<h2>Acesso restrito</h2><p>Entre com sua conta Claude para solicitar acesso a este comparativo.</p>');return}
    gate.hidden=false;
    let me;try{me=await user.me()}catch(e){me={}}
    const id=me.id;
    if(!id){say('<h2>Acesso restrito</h2><p>Não foi possível identificar sua conta. Entre com sua conta Claude e recarregue.</p>');return}
    const showReq=(sent)=>say(`<h2>Acesso restrito</h2><p>Este comparativo de preços é de uso interno. ${sent?'Seu pedido foi enviado. Assim que for liberado, esta tela abre sozinha.':'Peça acesso e o responsável será avisado no painel dele.'}</p><p class="who">${esc(me.name||'')} ${me.email?'· '+esc(me.email):''}</p>${sent?'<p class="muted">Aguardando liberação…</p>':`<input id="reqMail" type="email" placeholder="Seu e-mail" value="${esc(me.email||'')}" style="font:inherit;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink);width:80%;margin-bottom:10px"><br><button class="go primary big" id="reqBtn">Solicitar acesso</button>`}`);
    let sent=false;showReq(false);
    db.doc('liberados/'+id).onSnapshot(d=>{if(d&&d.exists)unlock()});
    gate.addEventListener('click',async e=>{
      if(!e.target.closest('#reqBtn'))return;
      const em=(($('#reqMail')||{}).value||me.email||'').trim();if(!/^\S+@\S+\.\S+$/.test(em)){box.insertAdjacentHTML('beforeend','<p class="muted">Informe um e-mail válido para o responsável identificar você.</p>');return}
      try{me.email=em;await db.doc('pedidos/'+id).set({uid:id,name:me.name||'',email:em,at:Date.now()});sent=true;showReq(true)}
      catch(err){box.insertAdjacentHTML('beforeend','<p class="muted">Não foi possível enviar o pedido. Tente de novo.</p>')}
    });
  })();
})();
