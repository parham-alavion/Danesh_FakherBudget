// ماژول یکپارچه «تحلیل و مقایسه»: انتخاب موارد، مقایسه، تعدیل و ریزشدن علت اختلاف
(function(){
const YEARS=[1406,1405,1404,1403],QN=['بهار','تابستان','پاییز','زمستان'];
const YCOL={1406:'#d2ac67',1405:'#3f9a7e',1404:'#3a77b5',1403:'#8c8c8c'};
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const R=n=>num(Math.round(n));
const sg=n=>n>0?'+'+R(n):n<0?'−'+R(-n):R(0);
const pcs=p=>p==null||!Number.isFinite(p)?'—':(p>0?'+':p<0?'−':'')+num(Math.round(Math.abs(p)*100))+'٪';
const cp=Object.assign({items:[],confirmed:false,py:1406,pt:'B',msg:'',metric:'درآمد',period:'ماهانه',adj:false,rate:40,company:'همه',common:true,base:'',cmpI:'',ddc:null,ddn:null},S.cmp);
S.cmp=cp;
cp.items=cp.items.filter(k=>!(k.endsWith(':A')&&Number(k.split(':')[0])>1405));
if(cp.pt==='A'&&cp.py>1405)cp.py=1405;
if(cp.v!==2){cp.items=[];cp.confirmed=false;cp.base='';cp.cmpI='';cp.ddc=null;cp.ddn=null;cp.v=2}
const holding=()=>S.scope==='holding';
const lbl=k=>{const [y,t]=k.split(':');return (t==='B'?'بودجه ':'عملکرد ')+fa(y)};
const sentSub=()=>S.subs.find(x=>x.status!=='حذف‌شده'&&x.sentAt);

/* ---------- داده ---------- */
function companies(){return holding()?(cp.company==='همه'||!HB.sentCos().includes(cp.company)?HB.sentCos():[cp.company]):['دانا']}
function typeNames(f){const s=new Set(HB.fieldNames(f));const sub=sentSub();if(sub)(sub.rows[f]||[]).forEach(r=>s.add(r.name));return [...s]}
// داده یک مورد (سال و بودجه/عملکرد) برای یک شرکت
function leaf(y,t,c){
  const map={},avail=Array(12).fill(false);let syn=false,has=false;
  if(t==='A'&&y>1405)return {map,avail,syn,has}; // عملکرد محقق‌شده فقط تا ۱۴۰۵ وجود دارد
  const synth=(fn,n12)=>{['درآمد','هزینه'].forEach(f=>typeNames(f).forEach(n=>{map[f+'|'+n]=fn(f,n).map(v=>Number(v)||0)}));for(let m=0;m<n12;m++)avail[m]=true;syn=true;has=true;
    if(c!=='دانا'){ // نسبت هزینه به درآمد نمونه‌ها واقع‌بینانه شود (حاشیه سود حدود ۲۰ تا ۵۰ درصد)
      const tot=f=>Object.entries(map).filter(([k])=>k.startsWith(f+'|')).reduce((a,[,v])=>a+v.reduce((x,y)=>x+y,0),0);
      const it=tot('درآمد'),ct=tot('هزینه');
      if(ct>0&&it>0){const r=(0.5+0.3*HB.rnd('cr'+c+y)+(t==='A'?0.04*(HB.rnd('cx'+c+y)-.5):0))*it/ct;Object.keys(map).forEach(k=>{if(k.startsWith('هزینه|'))map[k]=map[k].map(v=>v*r)})}
    }};
  if(t==='B'){
    if(c==='دانا'&&y===1406){
      const sub=sentSub();
      if(sub){['درآمد','هزینه'].forEach(f=>(sub.rows[f]||[]).forEach(r=>{map[f+'|'+r.name]=r.values.map(v=>Number(v)||0)}));avail.fill(true);has=true}
    }else synth((f,n)=>HB.bud(c,y,f,n),12);
  }else{
    const d=c==='دانا'&&S.actData&&S.actData[y];
    if(d&&['درآمد','هزینه'].some(f=>(d[f]||[]).length)){
      ['درآمد','هزینه'].forEach(f=>(d[f]||[]).forEach(r=>{const k=f+'|'+r.name;map[k]=map[k]?map[k].map((v,m)=>v+(Number(r.values[m])||0)):r.values.map(v=>Number(v)||0);r.values.forEach((v,m)=>{if(v!=null)avail[m]=true})}));has=true;
    }else if(holding()||c!=='دانا'){
      synth((f,n)=>y===1406?HB.act(c,f,n):HB.bud(c,y,f,n).map((v,m)=>Math.round(v*(1+(HB.rnd('av'+c+f+n+y+m)-.5)*.2))),y===1406?6:12);
    }
  }
  return {map,avail,syn,has};
}
function item(key,cs){
  const [y,t]=key.split(':'),res={map:{},avail:Array(12).fill(false),syn:false,has:false};
  (cs||companies()).forEach(c=>{const l=leaf(Number(y),t,c);if(!l.has)return;res.has=true;res.syn=res.syn||l.syn;
    Object.entries(l.map).forEach(([k,v])=>{res.map[k]=res.map[k]?res.map[k].map((x,m)=>x+v[m]):v.slice()});
    l.avail.forEach((a,m)=>{if(a)res.avail[m]=true})});
  return res;
}
const yearOf=k=>Number(k.split(':')[0]);
const baseYear=()=>Math.max(...cp.items.map(yearOf),0);
const factor=k=>cp.adj?Math.pow(1+(Number(cp.rate)||0)/100,baseYear()-yearOf(k)):1;
const isM=()=>cp.metric==='حاشیه';
const net=()=>cp.metric==='ترکیبی'||isM();
const formsOf=()=>net()?['درآمد','هزینه']:[cp.metric];
const sgn=f=>net()&&f==='هزینه'?-1:1;
function incMonthly(map){const out=Array(12).fill(0);Object.entries(map).forEach(([k,v])=>{if(k.split('|')[0]==='درآمد')v.forEach((x,m)=>out[m]+=x)});return out}
const f1=v=>num(Math.round(v*10)/10)+'٪';
const sg1=v=>(v>0?'+':v<0?'−':'')+num(Math.abs(Math.round(v*10)/10));
const fmt=v=>v==null?'—':isM()?f1(v):R(v);
// مقدار ماهانه معیار برای کلیدهای انتخاب‌شده از map
function metricMonthly(map,pred){
  const out=Array(12).fill(0);
  Object.entries(map).forEach(([k,v])=>{const f=k.split('|')[0];if(!formsOf().includes(f)||(pred&&!pred(k)))return;v.forEach((x,m)=>out[m]+=sgn(f)*x)});
  return out;
}
function maskFor(keys,datas){
  if(!cp.common)return null;
  const m=Array(12).fill(true);keys.forEach(k=>{if(datas[k]&&datas[k].has)datas[k].avail.forEach((a,i)=>{if(!a)m[i]=false})});return m;
}
const aggP=(a,p)=>{
  const S_=x=>{const v=x.filter(y=>y!=null);return v.length?v.reduce((s,y)=>s+y,0):null};
  if(p==='ماهانه')return a.slice();
  if(p==='فصلی')return [0,1,2,3].map(q=>S_(a.slice(q*3,q*3+3)));
  if(p==='نیم‌ساله')return [S_(a.slice(0,6)),S_(a.slice(6,12))];
  return [S_(a)];
};
const plabels=p=>p==='ماهانه'?months:p==='فصلی'?QN:p==='نیم‌ساله'?['نیمه اول','نیمه دوم']:['کل سال'];

/* ---------- رابط ---------- */
const opt=(l,v)=>l.map(x=>`<option ${x===v?'selected':''}>${esc(x)}</option>`).join('');
window.cmpSet=(k,v)=>{cp[k]=v;if(k==='pt'&&v==='A'&&cp.py>1405)cp.py=1405;if(['metric','company','common','adj','rate'].includes(k)){cp.ddc=null;cp.ddn=null}save();render()};
const resetDd=()=>{cp.base='';cp.cmpI='';cp.ddc=null;cp.ddn=null};
window.cmpAdd=()=>{
  const key=cp.py+':'+cp.pt;
  if(cp.items.includes(key)){cp.msg='این مورد قبلاً اضافه شده است.';save();render();return}
  if(!item(key).has){cp.msg='برای «'+lbl(key)+'» داده‌ای ثبت نشده است.';save();render();return}
  cp.items=[...cp.items,key];cp.msg='';resetDd();save();render();
};
window.cmpRemove=key=>{cp.items=cp.items.filter(x=>x!==key);if(!cp.items.length)cp.confirmed=false;resetDd();save();render()};
window.cmpConfirm=()=>{if(!cp.items.length){cp.msg='ابتدا دست‌کم یک مورد (سال و بودجه یا عملکرد) اضافه کنید.';save();render();return}cp.msg='';cp.confirmed=true;resetDd();save();render()};

function selectionCard(){
  const chips=cp.items.map(k=>{const it=item(k);return `<span class="chip"><span class="dot" style="background:${YCOL[k.split(':')[0]]}"></span>${lbl(k)}${it.syn?' <small class="muted">(نمونه)</small>':''}<button onclick="cmpRemove('${k}')" title="حذف">✕</button></span>`}).join('');
  return `<div class="card"><h2>انتخاب موارد مقایسه</h2><p class="muted small">سال و نوع را انتخاب و اضافه کنید؛ برای مقایسه چند مورد، این کار را تکرار کنید. نمونه‌ی فرضی برای سال‌ها و شرکت‌هایی است که داده‌ی واقعی در سامانه ندارند.</p>
  <div class="filters" style="align-items:flex-end">
    <div class="field" style="margin:0"><label>سال</label><select onchange="cmpSet('py',Number(this.value))">${YEARS.filter(y=>cp.pt==='B'||y<=1405).map(y=>`<option value="${y}" ${cp.py===y?'selected':''}>${fa(y)}</option>`).join('')}</select></div>
    <div class="field" style="margin:0"><label>بودجه یا عملکرد</label><select onchange="cmpSet('pt',this.value)"><option value="B" ${cp.pt==='B'?'selected':''}>بودجه</option><option value="A" ${cp.pt==='A'?'selected':''}>عملکرد</option></select></div>
    <button class="btn" onclick="cmpAdd()">＋ افزودن به مقایسه</button>
  </div>
  ${cp.msg?`<p class="error">${esc(cp.msg)}</p>`:''}
  <div style="margin:12px 0;min-height:34px">${chips||'<span class="muted small">هنوز موردی اضافه نشده است.</span>'}</div>
  <div class="filters" style="align-items:flex-end">
    <div class="field" style="margin:0"><label>چه چیزی مقایسه شود؟</label><select onchange="cmpSet('metric',this.value)">${['درآمد','هزینه','ترکیبی','حاشیه'].map(x=>`<option value="${x}" ${cp.metric===x?'selected':''}>${x==='ترکیبی'?'سود/زیان ناخالص':x==='حاشیه'?'حاشیه سود':x}</option>`).join('')}</select></div>
    <div class="field" style="margin:0"><label>دوره نمودار</label><select onchange="cmpSet('period',this.value)">${opt(['ماهانه','فصلی','نیم‌ساله','سالانه'],cp.period)}</select></div>
    ${holding()?`<div class="field" style="margin:0"><label>شرکت</label><select onchange="cmpSet('company',this.value)">${opt(['همه',...HB.sentCos()],cp.company)}</select></div>`:''}
    <label class="small" style="display:flex;gap:6px;align-items:center;margin-bottom:10px"><input type="checkbox" ${cp.common?'checked':''} onchange="cmpSet('common',this.checked)"> فقط ماه‌های دارای داده در همه موارد</label>
  </div>
  <div class="filters" style="align-items:flex-end">
    <label class="small" style="display:flex;gap:6px;align-items:center;margin-bottom:10px"><input type="checkbox" ${cp.adj?'checked':''} onchange="cmpSet('adj',this.checked)"> مقایسه تعدیل‌شده</label>
    ${cp.adj?`<div class="field" style="margin:0"><label>نرخ تعدیل سالانه (درصد)</label><input type="number" min="0" step="any" value="${esc(cp.rate)}" style="width:140px" onchange="cmpSet('rate',this.value)"></div><span class="small muted" style="margin-bottom:12px">همه ارقام به قیمت سال ${fa(baseYear()||1406)} تعدیل می‌شوند: مبلغ × (۱ + نرخ) ^ (تعداد سال تا ${fa(baseYear()||1406)})</span>`:''}
  </div>
  <div class="actions" style="margin-top:6px"><button class="btn primary" onclick="cmpConfirm()">تأیید و نمایش نمودار</button></div></div>`;
}

function resultCard(){
  const keys=cp.items.filter(k=>item(k).has);
  if(!keys.length)return `<div class="card" style="margin-top:18px"><h2>نتیجه مقایسه</h2><div class="empty">حداقل یک مورد دارای داده را انتخاب کنید.</div></div>`;
  const datas={};keys.forEach(k=>datas[k]=item(k));
  const mask=maskFor(keys,datas),F=k=>factor(k);
  const series=keys.map(k=>{
    const okm=m=>mask?mask[m]:datas[k].avail[m];
    const mm=metricMonthly(datas[k].map).map((v,m)=>okm(m)?v*F(k):null);
    const im=isM()?incMonthly(datas[k].map).map((v,m)=>okm(m)?v*F(k):null):null;
    return {k,mm,im};
  });
  const P=(s,p)=>{const a=aggP(s.mm,p);if(!isM())return a;const b=aggP(s.im,p);return a.map((v,i)=>v==null||!b[i]?null:v/b[i]*100)};
  const labels=plabels(cp.period),st=series.map(s=>P(s,cp.period));
  let lastIdx=labels.length-1;while(lastIdx>0&&st.every(a=>a[lastIdx]==null))lastIdx--;
  const L=labels.slice(0,lastIdx+1);
  const chart=lineChart(L,keys.map((k,i)=>{const [y,t]=k.split(':'),it=datas[k];return {name:lbl(k)+(it.syn?' (نمونه)':'')+(cp.adj?' · تعدیل‌شده':''),data:st[i].slice(0,lastIdx+1),color:YCOL[y],dash:t==='B'}}));
  const tot=series.map(s=>{const v=s.mm.filter(x=>x!=null);if(!v.length)return null;if(!isM())return sum(v);const i=sum(s.im.filter(x=>x!=null));return i?sum(v)/i*100:null});
  const q=series.map(s=>P(s,'فصلی'));
  const b0=tot[0];
  const rows=keys.map((k,i)=>`<tr><td><span class="dot" style="background:${YCOL[k.split(':')[0]]}"></span> ${lbl(k)}${datas[k].syn?' <span class="muted small">(نمونه)</span>':''}${i===0?' <span class="badge">مبنا</span>':''}</td>${q[i].map(v=>`<td>${fmt(v)}</td>`).join('')}<td><b>${fmt(tot[i])}</b></td></tr>`).join('');
  const dcell=(v,b)=>v==null||b==null?'<td>—</td>':`<td class="${v-b===0?'':v-b>0?'t-good':'t-bad'}">${isM()?sg1(v-b):sg(v-b)}<div class="small" style="font-weight:normal">${isM()?'نقطه درصد':pcs(b?v/b-1:null)}</div></td>`;
  const diffRows=keys.slice(1).map((k,i)=>`<tr class="stsum"><td>تفاوت «${lbl(k)}» با «${lbl(keys[0])}»</td>${q[i+1].map((v,m)=>dcell(v,q[0][m])).join('')}${dcell(tot[i+1],tot[0])}</tr>`).join('');
  const mon=mask?months.filter((_,i)=>mask[i]):null;
  return `<div class="card" style="margin-top:18px"><h2>نتیجه مقایسه ${cp.metric==='ترکیبی'?'· سود/زیان ناخالص':isM()?'· حاشیه سود':'· '+cp.metric}</h2>
  <p class="muted small">${isM()?'درصد (سود/زیان ناخالص ÷ درآمد)':'میلیون ریال'}${cp.adj?` · تعدیل‌شده با نرخ ${num(cp.rate)}٪ به قیمت سال ${fa(baseYear())}`:''}${mon?` · ماه‌های مشترک: ${mon.length?esc(mon[0])+' تا '+esc(mon[mon.length-1]):'ندارد'}`:''} · خط‌چین: بودجه · خط ممتد: عملکرد</p>
  ${chart}
  <div class="tablewrap" style="margin-top:16px"><table><thead><tr><th>مورد</th>${QN.map(x=>`<th>${x}</th>`).join('')}<th>جمع</th></tr></thead><tbody>${rows}${diffRows}</tbody></table></div></div>`;
}

/* ---------- ریزشدن ---------- */
let DDROWS=[];
window.cmpDd=i=>{const r=DDROWS[i];if(!r)return;if(r.kind==='c'){cp.ddc=r.key;cp.ddn=null}else{cp.ddn=r.key}save();render()};
window.cmpBack=l=>{if(l<=0){cp.ddc=null;cp.ddn=null}else cp.ddn=null;save();render()};
function drillCard(){
  const keys=cp.items.filter(k=>item(k).has);
  if(keys.length<2)return `<div class="card" style="margin-top:18px"><h2>ریزشدن علت اختلاف</h2><div class="empty">برای ریزشدن، دست‌کم دو مورد دارای داده انتخاب کنید.</div></div>`;
  if(!keys.includes(cp.base))cp.base=keys[0];if(!keys.includes(cp.cmpI)||cp.cmpI===cp.base)cp.cmpI=keys.find(k=>k!==cp.base);
  const A=cp.base,B=cp.cmpI,multi=holding()&&companies().length>1;
  const level=multi?(cp.ddc?(cp.ddn?2:1):0):(cp.ddn?2:1);
  const cs=multi?(cp.ddc&&companies().includes(cp.ddc)?[cp.ddc]:companies()):companies();
  const dA=item(A,cs),dB=item(B,cs),mask=maskFor([A,B],{[A]:dA,[B]:dB});
  const mOk=m=>mask?mask[m]:(dA.avail[m]&&dB.avail[m]);
  const fA=factor(A),fB=factor(B);
  const sumM=(map,f,pred)=>{const o=metricMonthly(map,pred);return o.map((v,m)=>mOk(m)?v*f:0)};
  const good=(f,diff)=>net()?diff>0:(f==='هزینه'?diff<0:diff>0);
  const incOf=(map,f)=>incMonthly(map).map((v,m)=>mOk(m)?v*f:0);
  const mg=(map,f)=>{const i=sum(incOf(map,f));return i?sum(sumM(map,f))/i*100:null};
  const badge=(diff,base,f)=>{const p=base?Math.abs(diff/base):0;if(p<.03)return '<span class="badge">بدون تغییر چشمگیر</span>';return good(f,diff)?'<span class="badge good">مطلوب</span>':'<span class="badge bad">نامطلوب</span>'};
  const rowsHtml=[],list=[];DDROWS=[];
  let tableHead='',tableBody='',crumb='';
  const crumbs=[`<button onclick="cmpBack(0)" class="${level===0?'cur':''}">${multi?'همه شرکت‌ها':'همه سرفصل‌ها'}</button>`];
  if(multi&&cp.ddc)crumbs.push(`<button onclick="cmpBack(1)" class="${level===1?'cur':''}">${esc(cp.ddc)}</button>`);
  if(cp.ddn)crumbs.push(`<span class="cur">${esc(cp.ddn.split('|')[1])}${net()?' ('+cp.ddn.split('|')[0]+')':''}</span>`);
  crumb=`<div class="crumbs">${crumbs.join(' › ')}</div>`;
  const hd=l=>`<thead><tr><th>${l}</th><th>${lbl(A)}</th><th>${lbl(B)}</th><th>تفاوت</th><th>٪</th><th>ارزیابی</th><th></th></tr></thead>`;
  const line=(label,a,b,f,btn)=>`<tr><td>${label}</td><td>${R(a)}</td><td>${R(b)}</td><td class="${good(f,b-a)?'t-good':'t-bad'}">${sg(b-a)}</td><td>${pcs(a?b/a-1:null)}</td><td>${badge(b-a,a,f)}</td><td>${btn||''}</td></tr>`;
  const lineM=(label,a,b,btn)=>{const d=a==null||b==null?null:b-a;return `<tr><td>${label}</td><td>${a==null?'—':f1(a)}</td><td>${b==null?'—':f1(b)}</td><td class="${d==null||d===0?'':d>0?'t-good':'t-bad'}">${d==null?'—':sg1(d)+' نقطه'}</td><td>—</td><td>${d==null||Math.abs(d)<1?'<span class="badge">بدون تغییر چشمگیر</span>':d>0?'<span class="badge good">مطلوب</span>':'<span class="badge bad">نامطلوب</span>'}</td><td>${btn||''}</td></tr>`};
  const marginSeries=(ml)=>{const ia=incOf(dA.map,fA),ib=incOf(dB.map,fB),na=sumM(dA.map,fA),nb=sumM(dB.map,fB);return [ml.map(m=>months[m]),ml.map(m=>ia[m]?na[m]/ia[m]*100:null),ml.map(m=>ib[m]?nb[m]/ib[m]*100:null)]};
  let chartM=null,summary='';
  if(level===2){
    const kk=cp.ddn,f0=kk.split('|')[0];
    const va=sumM(dA.map,fA,k=>k===kk),vb=sumM(dB.map,fB,k=>k===kk);
    const ml=months.map((_,m)=>m).filter(mOk);
    tableHead=hd('ماه');tableBody=ml.map(m=>line(months[m],va[m],vb[m],f0)).join('')+line('<b>جمع</b>',sum(va),sum(vb),f0);
    chartM=[ml.map(m=>months[m]),ml.map(m=>va[m]),ml.map(m=>vb[m])];
  }else if(level===1){
    // فهرست سرفصل‌ها
    const names=new Set([...Object.keys(dA.map),...Object.keys(dB.map)].filter(k=>formsOf().includes(k.split('|')[0])));
    const rs=[...names].map(k=>{const f=k.split('|')[0],a=sum(sumM(dA.map,fA,x=>x===k)),b=sum(sumM(dB.map,fB,x=>x===k));return {k,f,a,b}}).sort((x,y)=>Math.abs(y.b-y.a)-Math.abs(x.b-x.a));
    rs.forEach(r=>{DDROWS.push({kind:'n',key:r.k})});
    tableHead=hd('سرفصل');tableBody=(isM()?lineM('<b>حاشیه سود (کل)</b>',mg(dA.map,fA),mg(dB.map,fB)):'')+rs.map((r,i)=>line(esc(r.k.split('|')[1])+(net()?` <span class="muted small">(${r.f})</span>`:''),r.a,r.b,r.f,`<button class="btn link" onclick="cmpDd(${i})">ریزشدن</button>`)).join('')||'<tr><td colspan="7" class="empty">سرفصلی نیست.</td></tr>';
    const va=sumM(dA.map,fA),vb=sumM(dB.map,fB),ml=months.map((_,m)=>m).filter(mOk);
    chartM=isM()?marginSeries(ml):[ml.map(m=>months[m]),ml.map(m=>va[m]),ml.map(m=>vb[m])];
    summary=rs.slice(0,3).filter(r=>r.a!==r.b).map(r=>`<span class="badge ${good(r.f,r.b-r.a)?'good':'bad'}">${esc(r.k.split('|')[1])}: ${sg(r.b-r.a)}</span>`).join(' ');
  }else{
    // سطح شرکت‌ها (هلدینگ)
    const rs=companies().map(c=>{const a=item(A,[c]),b=item(B,[c]);const m2=maskFor([A,B],{[A]:a,[B]:b});const ok=m=>m2?m2[m]:(a.avail[m]&&b.avail[m]);
      const s=(it,f)=>sum(metricMonthly(it.map).map((v,m)=>ok(m)?v*f:0)),mgn=(it,f)=>{const i=sum(incMonthly(it.map).map((v,m)=>ok(m)?v*f:0));return i?s(it,f)/i*100:null};return isM()?{c,a:mgn(a,fA),b:mgn(b,fB)}:{c,a:s(a,fA),b:s(b,fB)}}).sort((x,y)=>Math.abs((y.b||0)-(y.a||0))-Math.abs((x.b||0)-(x.a||0)));
    rs.forEach(r=>DDROWS.push({kind:'c',key:r.c}));
    tableHead=hd('شرکت');tableBody=rs.map((r,i)=>isM()?lineM(esc(r.c),r.a,r.b,`<button class="btn link" onclick="cmpDd(${i})">ریزشدن</button>`):line(esc(r.c),r.a,r.b,cp.metric==='هزینه'?'هزینه':'درآمد',`<button class="btn link" onclick="cmpDd(${i})">ریزشدن</button>`)).join('');
    const va=sumM(dA.map,fA),vb=sumM(dB.map,fB),ml=months.map((_,m)=>m).filter(mOk);
    chartM=isM()?marginSeries(ml):[ml.map(m=>months[m]),ml.map(m=>va[m]),ml.map(m=>vb[m])];
    summary=rs.slice(0,3).filter(r=>r.a!==r.b).map(r=>isM()?`<span class="badge ${(r.b-r.a)>0?'good':'bad'}">${esc(r.c)}: ${sg1((r.b||0)-(r.a||0))} نقطه</span>`:`<span class="badge ${good(cp.metric==='هزینه'?'هزینه':'درآمد',r.b-r.a)?'good':'bad'}">${esc(r.c)}: ${sg(r.b-r.a)}</span>`).join(' ');
  }
  const pick=(id,cur,excl)=>`<select onchange="cmpSet('${id}',this.value)">${keys.filter(k=>k!==excl).map(k=>`<option value="${k}" ${k===cur?'selected':''}>${lbl(k)}</option>`).join('')}</select>`;
  return `<div class="card" style="margin-top:18px"><h2>ریزشدن علت اختلاف</h2><p class="muted small">تفاوت = «مقایسه» − «مبنا». از بزرگ‌ترین اختلاف شروع کنید و روی «ریزشدن» بزنید تا مشخص شود مشکل از کجاست.</p>
  <div class="filters" style="align-items:flex-end"><div class="field" style="margin:0"><label>مبنا</label>${pick('base',A,B)}</div><div class="field" style="margin:0"><label>مقایسه</label>${pick('cmpI',B,A)}</div></div>
  ${crumb}${summary?`<div style="margin:8px 0"><span class="small muted">بیشترین اختلاف‌ها: </span>${summary}</div>`:''}
  ${chartM&&chartM[0].length?lineChart(chartM[0],[{name:lbl(A),data:chartM[1],color:YCOL[A.split(':')[0]],dash:A.endsWith('B')},{name:lbl(B),data:chartM[2],color:'#b04a3b',dash:B.endsWith('B')}],{h:210}):''}
  <div class="tablewrap" style="margin-top:12px"><table>${tableHead}<tbody>${tableBody}</tbody></table></div></div>`;
}

window.cmpPage=()=>{
  if(!window.HB)return '<div class="empty">در حال بارگذاری…</div>';
  return `${heading('تحلیل و مقایسه','مقایسه بودجه و عملکرد سال‌ها، تعدیل و ریزشدن علت اختلاف')}${selectionCard()}${cp.confirmed&&cp.items.length?resultCard()+drillCard():''}`;
};
window.CMP={leaf};
pages.variance=cmpPage;pages.compare=cmpPage;
render();
})();
