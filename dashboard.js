// نمودار روندی (خطی) و نمای کلی شرکت
(function(){
const FORMS=['درآمد','هزینه','نقدینگی'];
const R=n=>num(Math.round(n));
const sg=n=>n>0?'+'+R(n):n<0?'−'+R(-n):R(0);
const pcs=p=>p==null?'—':(p>0?'+':p<0?'−':'')+num(Math.round(Math.abs(p)*100))+'٪';
const PAL=['#d2ac67','#6b6b6b','#3f9a7e','#b04a3b'];

/* ---------- نمودار خطی (روندی) ---------- */
const nice=r=>{const p=Math.pow(10,Math.floor(Math.log10(r||1))),f=r/p;return (f<=1?1:f<=2?2:f<=5?5:10)*p};
window.lineChart=(labels,series,o={})=>{
  const W=680,H=o.h||250,pl=58,pr=18,pt=16,pb=32,n=labels.length;
  const all=series.flatMap(s=>s.data.filter(v=>v!=null&&Number.isFinite(v)));
  if(!all.length||!n)return '<div class="empty" style="padding:30px 0">داده‌ای برای نمایش نیست.</div>';
  let max=Math.max(...all),min=Math.min(0,...all);if(max===min)max=min+1;
  const step=nice((max-min)/4),top=Math.ceil(max/step)*step,bot=Math.floor(min/step)*step;
  const iw=W-pl-pr,x=i=>n===1?pl+iw/2:pl+i*iw/(n-1),y=v=>pt+(H-pt-pb)*(1-(v-bot)/(top-bot));
  let grid='';for(let t=bot;t<=top+1e-9;t+=step)grid+=`<line x1="${pl}" x2="${W-pr}" y1="${y(t)}" y2="${y(t)}" stroke="#ececec"/><text x="${pl-8}" y="${y(t)+3.5}" text-anchor="end">${num(Math.round(t))}</text>`;
  const xl=labels.map((l,i)=>`<text x="${x(i)}" y="${H-10}" text-anchor="middle">${esc(l)}</text>`).join('');
  const lines=series.map((s,k)=>{
    const col=s.color||PAL[k%PAL.length];let d='',pen=false;
    s.data.forEach((v,i)=>{if(v==null||!Number.isFinite(v)){pen=false;return}d+=`${pen?'L':'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;pen=true});
    const pts=s.data.map((v,i)=>v==null||!Number.isFinite(v)?'':`<circle cx="${x(i)}" cy="${y(v)}" r="3.4" fill="#fff" stroke="${col}" stroke-width="2"><title>${esc(labels[i])} · ${esc(s.name)}: ${num(Math.round(v))}</title></circle>${n<=4?`<text class="val" x="${x(i)}" y="${y(v)-8}" text-anchor="middle">${num(Math.round(v))}</text>`:''}`).join('');
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"${s.dash?' stroke-dasharray="7 5"':''}/>${pts}`;
  }).join('');
  const legend=`<div class="legend" style="margin-bottom:6px">${series.map((s,k)=>`<span><i class="dot" style="background:${s.color||PAL[k%PAL.length]}"></i>${esc(s.name)}</span>`).join('')}${o.unit?`<span class="cunit">${esc(o.unit)}</span>`:''}</div>`;
  const id='lc'+(++CID);CH[id]={labels,series,unit:o.unit||'',title:o.title||'جزئیات نمودار',detail:o.detail};
  const hw=n===1?iw:iw/(n-1),hits=labels.map((l,i)=>`<rect class="hit" x="${(x(i)-hw/2).toFixed(1)}" y="${pt}" width="${hw.toFixed(1)}" height="${H-pt-pb}" fill="transparent" onclick="chartOpen('${id}',${i})"><title>${esc(l)} · برای مشاهده جزئیات کلیک کنید</title></rect>`).join('');
  return `<div class="lcwrap">${legend}<svg class="lc" viewBox="0 0 ${W} ${H}" width="100%" role="img">${grid}${xl}${lines}${hits}</svg><div class="lchint">🔍 روی هر ماه یا دوره کلیک کنید تا جزئیات همان دوره نمایش داده شود</div></div>`;
};
let CID=0;const CH={};
window.chartOpen=(id,i)=>{
  const c=CH[id];if(!c)return;const {labels,series:s0}=c,l=labels[i];let series=s0;
  const dt=c.detail?c.detail(i):null;
  if(dt&&dt.rows){
    const cols=['#8c8c8c','#b04a3b'],f1=v=>v==null||!Number.isFinite(v)?'—':num(Math.round(Math.abs(v)*10)/10);
    const sec=(title,R_)=>{
      if(!R_.length)return '';
      const W=760,LW=250,rh=46,bh=14,H=R_.length*rh+10,bx=W-LW-10,mx=Math.max(1,...R_.flatMap(r=>[Math.abs(r.a||0),Math.abs(r.b||0)])),sc=(bx-70)/mx;
      let g='';R_.forEach((r,j)=>{const y0=5+j*rh;
        g+=`<text x="${W-6}" y="${y0+rh/2+4}" text-anchor="end" style="font-size:12px;font-weight:600">${esc((n=>n.length>38?n.slice(0,37)+'…':n)(r.name.replace(' · درآمد خدمات ',' · ')))}<title>${esc(r.name)}</title></text>`;
        [r.a,r.b].forEach((v,t)=>{if(v==null||!Number.isFinite(v))return;const w=Math.max(2,Math.abs(v)*sc),y=y0+6+t*(bh+3);
          g+=`<rect x="${bx-w}" y="${y}" width="${w}" height="${bh}" rx="3" fill="${cols[t]}"><title>${esc(r.name)} · ${esc(dt.names[t])}: ${f1(v)}</title></rect><text x="${bx-w-6}" y="${y+bh-3}" text-anchor="end" style="font-size:10px">${f1(v)}</text>`});
        g+=`<line x1="10" x2="${W-6}" y1="${y0+rh-1}" y2="${y0+rh-1}" stroke="#eee"/>`});
      const rows=R_.map(r=>{const aa=Math.abs(r.a||0),bb=Math.abs(r.b||0),dd=bb-aa;return `<tr><td style="white-space:normal">${esc(r.name)}</td><td>${f1(r.a)}</td><td>${f1(r.b)}</td><td class="${r.tone==='good'?'t-good':r.tone==='bad'?'t-bad':''}">${(dd>0?'+':dd<0?'−':'')+f1(dd)}</td><td>${r.pct==null?'—':(dd>0?'+':dd<0?'−':'')+num(Math.round(Math.abs(r.pct)*100))+'٪'}</td><td><span class="badge ${r.tone}">${esc(r.ev)}</span></td></tr>`}).join('');
      return `<h3 style="margin:18px 0 6px">${title}</h3><svg class="lc" viewBox="0 0 ${W} ${H}" width="100%">${g}</svg><div class="tablewrap" style="margin-top:8px"><table><thead><tr><th>سرفصل</th><th>${esc(dt.names[0])}</th><th>${esc(dt.names[1])}</th><th>تفاوت</th><th>٪</th><th>ارزیابی</th></tr></thead><tbody>${rows}</tbody></table></div>`};
    const inc=dt.rows.filter(r=>r.f==='درآمد'),exp=dt.rows.filter(r=>r.f!=='درآمد');
    modal(`${esc(c.title)} · ${esc(l)}`,`<p class="muted small">${esc(c.unit||'')}${c.unit?' · ':''}سرفصل‌ها فقط برای «${esc(l)}» · مقادیر بدون علامت منفی</p>
    <div class="legend" style="margin-bottom:6px">${dt.names.map((n,t)=>`<span><i class="dot" style="background:${cols[t]}"></i>${esc(n)}</span>`).join('')}</div>`+sec('درآمد‌ها',inc)+sec('هزینه‌ها',exp),`<button class="btn" onclick="closeModal()">بستن</button>`);
    document.querySelector('#modal .modal').style.width='min(900px,100%)';return;
  }
  if(dt)series=dt.fields.map(f=>({name:f.name,color:f.color,data:Array(i).concat([f.value])}));
  const k=series.length;
  const vals=series.map(s_=>s_.data[i]),ok=vals.filter(v=>v!=null&&Number.isFinite(v));
  const W=560,H=260,pl=60,pr=16,pt=22,pb=44,mx=Math.max(0,...ok),mn=Math.min(0,...ok),rg=(mx-mn)||1;
  const y=v=>pt+(H-pt-pb)*(1-(v-mn)/rg),gw=(W-pl-pr)/k,bw=Math.min(90,gw*0.6);
  let bars='';
  series.forEach((s_,j)=>{const v=vals[j],cx=pl+j*gw+gw/2;
    bars+=`<text x="${cx}" y="${H-12}" text-anchor="middle">${esc(s_.name)}</text>`;
    if(v==null||!Number.isFinite(v))return;
    bars+=`<rect x="${cx-bw/2}" y="${y(Math.max(v,0))}" width="${bw}" height="${Math.max(1,Math.abs(y(v)-y(0)))}" rx="5" fill="${s_.color||'#d2ac67'}" ${s_.dash?'fill-opacity=".55"':''}/><text class="val" x="${cx}" y="${y(Math.max(v,0))-6}" text-anchor="middle" style="font-size:12px;font-weight:bold">${num(Math.round(v*10)/10)}</text>`});
  const grid=[0,1,2,3,4].map(t=>{const v=mn+rg*t/4;return `<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" stroke="#eee"/><text x="${pl-8}" y="${y(v)+3.5}" text-anchor="end">${num(Math.round(v))}</text>`}).join('');
  const f=v=>v==null||!Number.isFinite(v)?'—':num(Math.round(v*10)/10);
  const dv=k===2&&vals[0]!=null&&vals[1]!=null?vals[1]-vals[0]:null;
  modal(`${esc(c.title)} · ${esc(l)}`,`<p class="muted small">${esc(c.unit||'')}${c.unit?' · ':''}فقط داده‌ی «${esc(l)}»</p>
  <svg class="lc" viewBox="0 0 ${W} ${H}" width="100%">${grid}${bars}</svg>
  <div class="tablewrap" style="margin-top:12px"><table><thead><tr><th>فیلد داده</th><th>${esc(l)}</th></tr></thead><tbody>${series.map((s_,j)=>`<tr><td><i class="dot" style="background:${s_.color||'#d2ac67'}"></i> ${esc(s_.name)}</td><td><b>${f(vals[j])}</b></td></tr>`).join('')}${dt?dt.extra.map(e=>`<tr><td>${esc(e[0])}</td><td><b>${esc(e[1])}</b></td></tr>`).join(''):''}${!dt&&k===2?`<tr style="font-weight:bold"><td>تفاوت (${esc(series[1].name)} − ${esc(series[0].name)})</td><td>${dv==null?'—':f(dv)}${dv!=null&&vals[0]?` <span class="muted small">(${dv>0?'+':dv<0?'−':''}${num(Math.round(Math.abs(dv/vals[0])*100))}٪)</span>`:''}</td></tr>`:''}</tbody></table></div>`,`<button class="btn" onclick="closeModal()">بستن</button>`);
};
// نمودارهای دوسریِ قدیمی (بودجه/عملکرد، درآمد/هزینه) هم روندی شدند
window.paired=(labels,a,b,al='بودجه',bl='عملکرد')=>lineChart(labels,[{name:al,data:a,color:'#d2ac67'},{name:bl,data:b,color:'#6b6b6b'}]);

/* ---------- داده‌های نمای کلی ---------- */
const mSum=(rows,f)=>months.map((_,m)=>sum((rows[f]||[]).map(r=>r.values[m])));
function pickBudget(){
  const s=S.subs.find(x=>x.status!=='حذف‌شده'&&x.sentAt);
  if(s)return {rows:s.rows,src:'درخواست ارسال‌شده'};
  return null;
}
function actualInfo(){
  const d=(S.actData&&S.actData[1405])||{};let last=-1;
  months.forEach((_,m)=>{if(['درآمد','هزینه'].some(f=>(d[f]||[]).some(r=>r.values[m]!=null)))last=m});
  const mon=f=>months.map((_,m)=>sum((d[f]||[]).map(r=>r.values[m]==null?0:r.values[m])));
  return {last,inc:mon('درآمد'),cost:mon('هزینه')};
}
function statusCard(){
  const sub=S.subs.find(x=>x.status!=='حذف‌شده'),st=sub?sub.status:null;
  const key=!sub?'none':st==='تصویب‌شده'?'ok':st==='بازگشت برای اصلاح'?'rej':'rev';
  const steps=[['none','ارسال نشده'],['rev','ارسال‌شده · در حال بررسی'],['ok','تأیید شده'],['rej','رد شده']];
  const cls={none:'',rev:'warn',ok:'good',rej:'bad'};
  const last=sub&&[...sub.events].reverse().find(e=>/بازگشت/.test(e.type));
  const detail=!sub?(S.drafts.length?`${num(S.drafts.length)} پیش‌نویس دارید؛ از «درخواست‌های بودجه» یکی را برای معاونت مالی هلدینگ ارسال کنید.`:'هنوز پیش‌نویس یا درخواستی ثبت نشده است. بودجه را در «پیش‌بینی بودجه» تکمیل و پیش‌نویس کنید.')
    :key==='rev'?`ارسال: ${sub.sentAt} · مرحله فعلی: ${st==='در بررسی کارشناس'?'کارشناس مالی هلدینگ':st==='در بررسی مدیر مالی'?'مدیر مالی هلدینگ':'هیئت‌مدیره هلدینگ'}`
    :key==='ok'?`تصویب نهایی شد · ارسال: ${sub.sentAt}`
    :`برای اصلاح برگشت خورد${last&&last.note?': '+last.note:''}`;
  return `<div class="card" style="margin-bottom:18px"><div class="spread"><div><h2>وضعیت ارسال بودجه ۱۴۰۶</h2><p class="muted small">${esc(detail)}</p></div><button class="btn" onclick="go('workflow')">درخواست‌های بودجه</button></div>
  <div class="dstatus">${steps.map(([k,t])=>`<div class="${k===key?'on '+cls[k]:''}"><span class="dstep">${k===key?'●':'○'}</span>${t}</div>`).join('')}</div></div>`;
}

/* ---------- داده نمونه برای نمایش ---------- */
const DEMO={
  'درآمد':[['خدمات زیرساخت و سرور · درآمد خدمات به شرکت‌های گروه',[1100,1150,1150,1200,1250,1300,1350,1400,1450,1470,1500,1560]],['خدمات زیرساخت و سرور · درآمد خدمات خارج از گروه',[360,390,420,450,480,510,540,570,600,630,660,690]],['خدمات نرم‌افزار · درآمد خدمات به شرکت‌های گروه',[700,700,750,800,850,900,900,900,950,980,1000,1040]],['خدمات نرم‌افزار · درآمد خدمات خارج از گروه',[240,260,280,300,320,340,360,380,400,420,440,460]]],
  'هزینه':[['بهای تمام‌شده خدمات',[700,720,740,760,780,800,820,840,860,880,900,920]],['حقوق و مزایای پرسنل',Array(12).fill(800)],['هزینه عمومی و اداری',Array(12).fill(250)],['هزینه استهلاک',Array(12).fill(60)]],
  'نقدینگی':[['دریافت نقدی از مشتریان',[2300,2400,2500,2600,2700,2800,2900,3000,3100,3200,3300,3400]],['پرداخت نقدی حقوق و هزینه‌ها',[1750,1780,1800,1830,1860,1890,1920,1950,1980,2010,2040,2070]]]
};
window.seedDemo=()=>{
  const nowT=new Date().toLocaleString('fa-IR'),rows={};
  FORMS.forEach(f=>rows[f]=DEMO[f].map(([name,v])=>({name,values:v.slice()})));
  if(!S.subs.some(x=>x.demo)){
    const ev=(type,actor,note)=>({type,time:nowT,actor,note:note||''});
    S.subs.unshift({id:Date.now(),demo:true,name:'بودجه ۱۴۰۶ (نمونه)',source:'نمونه',created:nowT,sentAt:nowT,rows,docs:[{name:'صورت‌جلسه-تصویب-داخلی.pdf',type:'صورت‌جلسه تصویب داخلی',time:nowT,size:'۲۴۰ کیلوبایت'}],message:'بودجه ۱۴۰۶ پس از تصویب داخلی برای بررسی ارسال می‌شود.',status:'در بررسی مدیر مالی',company:'دانا',
      events:[ev('ارسال به معاونت مالی هلدینگ','شرکت دانا','بودجه ۱۴۰۶ پس از تصویب داخلی برای بررسی ارسال می‌شود. · ۱ سند پیوست'),ev('تأیید و ارجاع به مدیر مالی هلدینگ','کارشناس مالی هلدینگ','مفروضات تأیید شد')]});
    S.status='در بررسی مدیر مالی';
  }
  S.actData=S.actData||{};
  // فرم‌های پیش‌بینی بودجه هم نمونه داشته باشند (هر فرمِ خالی با ردیف‌های نمونه پر می‌شود)
  FORMS.forEach(f=>{if(!S.rows[f].length)S.rows[f]=DEMO[f].map(([name,v])=>({name,values:v.slice(),demo:true}))});
  if(window.HB){
    [1404,1405].forEach(y=>{const dd=S.actData[y]=S.actData[y]||{};FORMS.forEach(f=>dd[f]=dd[f]||[]);
      if(!FORMS.some(f=>dd[f].length)){FORMS.forEach(f=>DEMO[f].forEach(([name],k)=>dd[f].push({name,values:HB.bud('دانا',y,f,name).map((x,m)=>m<(y===1405?8:12)?Math.round(x*((f==='هزینه'?1.05:.96)+.08*Math.sin(k+m+y%7))):null),src:'نمونه'})))}});
  }
  if(!S.drafts.some(x=>x.demo)&&window.createDraft){
    // این پیش‌نویس عمداً چند خطا و هشدار دارد تا اعتبارسنجی دیده شود (نسبت نیروی انسانی ۷۵٪، درآمد خارج از گروه کمتر از حداقل، فرم نقدینگی خالی)
    const dr={'درآمد':[{name:'خدمات نرم‌افزار · درآمد خدمات به شرکت‌های گروه',values:[620,640,660,680,700,720,740,760,780,800,820,840]},{name:'خدمات نرم‌افزار · درآمد خدمات خارج از گروه',values:[240,250,260,270,280,290,300,310,320,330,340,310]}],
      'هزینه':[{name:'حقوق و مزایای پرسنل',values:Array(12).fill(630)},{name:'بهای تمام‌شده خدمات',values:Array(12).fill(140)},{name:'هزینه عمومی و اداری',values:Array(12).fill(70)}],'نقدینگی':[]};
    createDraft('پیش‌نویس بودجه ۱۴۰۶ (نمونه)','نمونه',dr);S.drafts[0].demo=true;
    S.drafts[0].msg='پیش‌نویس نمونه برای نمایش.';
  }
  S.demoSeed=true;S.demoDismissed=false;save();render();
};
window.clearDemo=()=>{
  S.subs=S.subs.filter(x=>!x.demo);
  const c=S.subs.find(x=>x.status!=='حذف‌شده');S.status=c?c.status:'پیش‌نویس';
  if(S.actData){Object.keys(S.actData).forEach(y=>FORMS.forEach(f=>{S.actData[y][f]=(S.actData[y][f]||[]).filter(r=>r.src!=='نمونه')}));S.demoActual=false}
  S.drafts=S.drafts.filter(x=>!x.demo);
  FORMS.forEach(f=>{S.rows[f]=S.rows[f].filter(r=>!r.demo)});
  S.demoSeed=false;S.demoDismissed=true;save();render();
};

/* ---------- امتیاز ستاره‌ای شرکت در میان شرکت‌های هلدینگ ---------- */
let rateOpen=false;
const IND=[['margin','حاشیه سود',.35,false,'سودآوری'],['ach','تحقق درآمد نسبت به بودجه',.25,false,'درآمد'],['ctl','کنترل هزینه (هزینه واقعی ÷ بودجه)',.20,true,'هزینه'],['growth','رشد درآمد نسبت به ۱۴۰۴',.20,false,'رشد']];
function rateData(){
  if(!window.CMP)return null;
  const dm_=CMP.leaf(1405,'A','دانا').avail;
  const tot=(l,f)=>Object.entries(l.map).filter(([k])=>k.startsWith(f+'|')).reduce((s,[,v])=>s+v.reduce((x,y,m)=>x+(dm_[m]?y:0),0),0);
  const rows=companies.map(c=>{
    const a5=CMP.leaf(1405,'A',c),b5=CMP.leaf(1405,'B',c),a4=CMP.leaf(1404,'A',c);
    if(!a5.has)return {c,has:false};
    const inc=tot(a5,'درآمد'),cost=tot(a5,'هزینه'),bi=b5.has?tot(b5,'درآمد'):0,bc=b5.has?tot(b5,'هزینه'):0,i4=a4.has?tot(a4,'درآمد'):0;
    return {c,has:true,margin:inc?(inc-cost)/inc:null,ach:bi?inc/bi:null,ctl:bc?cost/bc:null,growth:i4?inc/i4-1:null};
  }).filter(r=>r.has);
  const me=rows.find(r=>r.c==='دانا');if(!me||rows.length<3)return null;
  const pct=(key,inv,r)=>{const xs=rows.map(x=>x[key]).filter(v=>v!=null),v=r[key];if(v==null)return null;let lo=0,eq=0;xs.forEach(x=>{if(x<v)lo++;else if(x===v)eq++});const p=(lo+(eq-1)/2)/(xs.length-1||1);return inv?1-p:p};
  const comp=r=>{let s=0,w=0;IND.forEach(([k,,wt,inv])=>{const p=pct(k,inv,r);if(p!=null){s+=p*wt;w+=wt}});return w?s/w:0};
  const scores=rows.map(r=>({c:r.c,s:comp(r)})).sort((a,b)=>b.s-a.s);
  const rank=scores.findIndex(x=>x.c==='دانا')+1,s=scores[rank-1].s;
  const stars=Math.min(5,Math.max(1,Math.round(s*10)/2));
  const med=key=>{const xs=rows.map(x=>x[key]).filter(v=>v!=null).sort((a,b)=>a-b);return xs.length?xs[Math.floor(xs.length/2)]:null};
  const ind=IND.map(([k,name,wt,inv,short])=>{const p=pct(k,inv,me);return {k,name,wt,inv,short,v:me[k],m:med(k),p}});
  const withP=ind.filter(x=>x.p!=null).sort((a,b)=>b.p-a.p);
  return {stars,rank,n:rows.length,ind,best:withP[0],worst:withP[withP.length-1]};
}
const stLabel=s=>s>=4.5?'عالی':s>=3.5?'خوب':s>=2.5?'متوسط':s>=1.5?'نیازمند بهبود':'ضعیف';
const STAR='12 2 15.1 8.6 22 9.3 16.8 14 18.4 21 12 17.3 5.6 21 7.2 14 2 9.3 8.9 8.6';
const starsHtml=s=>[1,2,3,4,5].map(i=>{const f=Math.max(0,Math.min(1,s-(i-1)));return `<svg viewBox="0 0 24 24" width="22" height="22"><defs><clipPath id="sc${i}"><rect x="${24*(1-f)}" y="0" width="${24*f}" height="24"/></clipPath></defs><polygon points="${STAR}" fill="#e3e3e3"/><polygon points="${STAR}" fill="#e0a526" clip-path="url(#sc${i})"/></svg>`}).join('');
const fv=(k,v)=>v==null?'—':k==='margin'||k==='growth'?pcs(v).replace(/^\+/,'')+'':num(Math.round(v*100))+'٪';
window.rateToggle=()=>{rateOpen=!rateOpen;render()};
document.addEventListener('click',e=>{if(rateOpen&&!e.target.closest('.ratewrap')){rateOpen=false;render()}});
function ratingHtml(){
  const r=rateData();
  if(!r)return `<div class="ratewrap"><div class="ratebox"><div><div class="small muted">امتیاز شرکت در هلدینگ</div><div class="stars">${starsHtml(0)}</div></div><span class="small muted">پس از ثبت عملکرد ۱۴۰۵ محاسبه می‌شود</span></div></div>`;
  const lab=stLabel(r.stars);
  const panel=rateOpen?`<div class="ratepanel"><b>چرا ${num(r.stars)} از ۵؟</b>
    <p>رتبه‌ی شما <b>${num(r.rank)}</b> از ${num(r.n)} شرکت هلدینگ است. با توجه به شاخص‌های سود، درآمد و هزینه، شما بین شرکت‌های هلدینگ در وضعیت «<b>${lab}</b>» قرار دارید.</p>
    <table><thead><tr><th>شاخص</th><th>وزن</th><th>شما</th><th>میانه هلدینگ</th><th></th></tr></thead><tbody>${r.ind.map(x=>{const good=x.p==null?null:x.p>=.5;return `<tr><td style="white-space:normal">${x.name}</td><td>${num(Math.round(x.wt*100))}٪</td><td>${fv(x.k,x.v)}</td><td>${fv(x.k,x.m)}</td><td class="${good==null?'':good?'t-good':'t-bad'}">${good==null?'':good?'▲ بهتر':'▼ ضعیف‌تر'}</td></tr>`}).join('')}</tbody></table>
    ${r.best&&r.worst?`<p class="small">نقطه قوت: <b>${r.best.short}</b> · نقطه ضعف: <b>${r.worst.short}</b></p>`:''}
    <p class="small muted">امتیاز = ۵ × میانگین وزنی رتبه‌ی نسبی شما در هر شاخص بین شرکت‌های هلدینگ؛ مثلاً بهتر بودن از ۸۰٪ شرکت‌ها یعنی حدود ۴ ستاره و قرار گرفتن در میانه یعنی حدود ۲٫۵ ستاره. محاسبه با عملکرد محقق‌شده ۱۴۰۵ انجام می‌شود و ارقام سایر شرکت‌ها نمونه‌ی فرضی است.</p></div>`:'';
  return `<div class="ratewrap"><div class="ratebox"><div><div class="small muted">امتیاز شرکت در هلدینگ</div><div class="stars">${starsHtml(r.stars)}</div></div><div><b>${num(r.stars)} از ۵</b><div class="small muted">${lab}</div></div><button class="rinfo" onclick="rateToggle()" title="توضیح امتیاز" aria-label="توضیح امتیاز">!</button></div>${panel}</div>`;
}

/* ---------- نمای کلی شرکت ---------- */
window.companyDashboard=()=>{
  const bsel=pickBudget(),act=actualInfo(),L=act.last,prev=L>=0?{inc:sum(act.inc.slice(0,L+1)),cost:sum(act.cost.slice(0,L+1))}:null;
  const bInc=bsel?mSum(bsel.rows,'درآمد'):Array(12).fill(0),bCost=bsel?mSum(bsel.rows,'هزینه'):Array(12).fill(0),nul=Array(12).fill(null),bIncC=bsel?bInc:nul,bCostC=bsel?bCost:nul;
  const tInc=sum(bInc),tCost=sum(bCost);
  const kp=(t,v,s,extra='')=>`<div class="card kpi"><span class="muted">${t}</span><div class="value">${v}</div><span class="small muted">${s}</span>${extra}</div>`;
  const delta=(a,b)=>b?pcs(a/b-1):'—';
  const aI=L>=0?sum(act.inc.slice(0,L+1)):0,aC=L>=0?sum(act.cost.slice(0,L+1)):0,bI=sum(bInc.slice(0,L+1)),bC=sum(bCost.slice(0,L+1));
  const rate=(a,b)=>b?num(Math.round(a/b*100))+'٪ از بودجه':'';
  const none='پس از ارسال بودجه نمایش داده می‌شود',tG=tInc-tCost,aG=aI-aC,bG=bI-bC,mp=(g,i)=>i?Math.round(g/i*1000)/10:null,pm=v=>v==null?'—':num(v)+'٪';
  const b05=(()=>{ // بودجه ۱۴۰۵ (نمونه فرضی) برای همان سرفصل‌هایی که عملکرد ۱۴۰۵ دارند
    if(!window.HB)return null;const dd=(S.actData&&S.actData[1405])||{},out={inc:Array(12).fill(0),cost:Array(12).fill(0)};let any=false;
    [['درآمد','inc'],['هزینه','cost']].forEach(([f,k])=>(dd[f]||[]).forEach(r=>{HB.bud('دانا',1405,f,r.name).forEach((v,m)=>{out[k][m]+=v});any=true}));
    return any?out:null})();
  const sI=b05?b05.inc:nul,sC=b05?b05.cost:nul;
  const per=L>=0?(L<11?`سال ۱۴۰۵ · تا پایان ${months[L]}`:'کل سال ۱۴۰۵'):'';
  const IC={
    inc:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>',
    cost:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 7 9 13 13 9 21 17"/><polyline points="15 17 21 17 21 11"/></svg>',
    gross:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="20" x2="5" y2="12"/><line x1="12" y1="20" x2="12" y2="5"/><line x1="19" y1="20" x2="19" y2="9"/></svg>',
    margin:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/></svg>',
    target:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/></svg>',
    done:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="8 12.5 11 15.5 16 9"/></svg>'
  };
  // وضعیت نسبت به پیش‌بینی: kind = inc | cost | gross | margin
  const stat=(kind,a,p)=>{
    if(a==null||p==null)return null;
    let dv;
    if(kind==='margin'){dv=a-p;if(dv<=-1)return {tone:'bad',icon:'▼',text:'پایین‌تر از پیش‌بینی'};if(dv>=1)return {tone:'good',icon:'▲',text:'بهتر از پیش‌بینی'};return {tone:'',icon:'●',text:'مطابق پیش‌بینی'}}
    dv=(a-p)/Math.abs(p||1);
    if(kind==='cost'){if(dv>=.03)return {tone:'bad',icon:'▲',text:'بالاتر از پیش‌بینی'};if(dv<=-.03)return {tone:'good',icon:'▼',text:'کمتر از پیش‌بینی'};return {tone:'',icon:'●',text:'مطابق پیش‌بینی'}}
    if(dv<=-.03)return {tone:'bad',icon:'▼',text:'عقب‌تر از پیش‌بینی'};if(dv>=.03)return {tone:'good',icon:'▲',text:'جلوتر از پیش‌بینی'};return {tone:'',icon:'●',text:'مطابق پیش‌بینی'};
  };
  const kcard=(ic,t,v,sub,st)=>`<div class="kpi2 ${st?st.tone:''}"><div class="kh"><span class="kic">${IC[ic]}</span><span class="muted">${t}</span></div><div class="value">${v}</div>${sub?`<div class="small muted">${sub}</div>`:''}${st?`<div class="kst ${st.tone}">${st.icon} ${st.text}</div>`:''}</div>`;
  const grp=(cls,ic,title,sub,cards)=>`<div class="kgroup ${cls}"><div class="kghead"><span class="kgic">${IC[ic]}</span><div><h2>${title} <span class="kunit">میلیون ریال</span></h2><p class="muted small">${sub}</p></div></div><div class="grid kpis" style="margin:0">${cards}</div></div>`;
  const p05={inc:b05?sum(b05.inc.slice(0,L+1)):null,cost:b05?sum(b05.cost.slice(0,L+1)):null};
  const pG=b05?p05.inc-p05.cost:null,pM=b05?mp(pG,p05.inc):null;
  const aMg=L>=0?mp(aG,aI):null;
  const plan=(v,fmt)=>b05?`پیش‌بینی ۱۴۰۵ (نمونه): ${fmt(v)}`:'';
  const kpis=grp('budget','target','بودجه ۱۴۰۶','پیش‌بینی سال جاری',
    kcard('inc','درآمد',bsel?R(tInc):'—',bsel?'':none)+
    kcard('cost','هزینه',bsel?R(tCost):'—',bsel?'':none)+
    kcard('gross','سود/زیان ناخالص',bsel?sg(tG):'—',bsel?'':none)+
    kcard('margin','حاشیه سود',bsel?pm(mp(tG,tInc)):'—',bsel?'':none))
  +grp('actual','done','محقق‌شده ۱۴۰۵',L>=0?`${per} · مقایسه با پیش‌بینی بودجه ۱۴۰۵ (نمونه فرضی)`:'عملکرد ۱۴۰۵ را در «ایجاد عملکرد جدید» ثبت کنید',
    kcard('inc','درآمد',L>=0?R(aI):'ثبت نشده',L>=0?`${plan(p05.inc,R)} · ${delta(aI,p05.inc)}`:'',L>=0?stat('inc',aI,p05.inc):null)+
    kcard('cost','هزینه',L>=0?R(aC):'ثبت نشده',L>=0?`${plan(p05.cost,R)} · ${delta(aC,p05.cost)}`:'',L>=0?stat('cost',aC,p05.cost):null)+
    kcard('gross','سود/زیان ناخالص',L>=0?sg(aG):'ثبت نشده',L>=0?`${plan(pG,sg)}`:'',L>=0?stat('gross',aG,pG):null)+
    kcard('margin','حاشیه سود',L>=0?pm(aMg):'ثبت نشده',L>=0?`${plan(pM,pm)}`:'',L>=0?stat('margin',aMg,pM):null));
  const lab=L>=0?months.slice(0,L+1):[];
  const empty=`<div class="empty" style="padding:30px 0">عملکرد محقق‌شده ۱۴۰۵ ثبت نشده است. <button class="btn link" onclick="go('actual')">ایجاد عملکرد جدید</button></div>`;
  const c1=L>=0?lineChart(lab,[{name:'درآمد محقق‌شده ۱۴۰۵',data:act.inc.slice(0,L+1),color:'#3f9a7e'},{name:'هزینه محقق‌شده ۱۴۰۵',data:act.cost.slice(0,L+1),color:'#b04a3b'}],{unit:'میلیون ریال',title:'درآمد و هزینه ماهانه محقق‌شده ۱۴۰۵'}):empty;
  const dm=['درآمد','هزینه','سود/زیان ناخالص','حاشیه سود'].includes(S.dashMetric)?S.dashMetric:'درآمد';
  const bM=dm==='درآمد'?sI:dm==='هزینه'?sC:dm==='حاشیه سود'?(b05?sI.map((v,i)=>v?(v-sC[i])/v*100:null):nul):(b05?sI.map((v,i)=>v-sC[i]):nul);
  const aM=dm==='درآمد'?act.inc:dm==='هزینه'?act.cost:dm==='حاشیه سود'?act.inc.map((v,i)=>v?(v-act.cost[i])/v*100:null):act.inc.map((v,i)=>v-act.cost[i]);
  const aCol=dm==='درآمد'?'#3f9a7e':dm==='هزینه'?'#b04a3b':'#3a77b5';
  const aMc=aM.map((v,i)=>L>=0&&i<=L?v:null);
  const c2=(L>=0||b05)?lineChart(months,[{name:'بودجه ۱۴۰۵',data:bM,color:'#d2ac67',dash:true},{name:'محقق‌شده ۱۴۰۵',data:aMc,color:aCol}],{h:240,unit:dm==='حاشیه سود'?'درصد':'میلیون ریال',title:'بودجه ۱۴۰۵ و محقق‌شده ۱۴۰۵ · '+dm}):empty;
  return `${heading('نمای کلی شرکت دانا','وضعیت بودجه ۱۴۰۶ و عملکرد محقق‌شده ۱۴۰۵',`<div class="row" style="gap:16px;align-items:center">${ratingHtml()}<button class="btn" onclick="go('budget')">پیش‌بینی بودجه</button></div>`)}
  ${S.demoSeed?`<div class="notice" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:10px"><span>داده‌های این صفحه نمونه هستند.</span><button class="btn link" onclick="clearDemo()">حذف داده نمونه</button></div>`:(!S.subs.length&&L<0?`<div class="notice" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:10px"><span>برای دیدن نمونه‌ی نمای کلی می‌توانید داده نمونه بارگذاری کنید.</span><button class="btn" onclick="seedDemo()">پر کردن با داده نمونه</button></div>`:'')}
  ${statusCard()}${kpis}
  ${bsel?`<p class="muted small" style="margin:-6px 0 14px">بودجه ۱۴۰۶ از درخواست ارسال‌شده محاسبه شده است. عملکرد محقق‌شده فقط تا سال ۱۴۰۵ ثبت می‌شود.</p>`:'<p class="muted small" style="margin:-6px 0 14px">بودجه ۱۴۰۶ تا زمانی که برای هلدینگ ارسال نشود، در این صفحه خالی می‌ماند.</p>'}
  <div class="card" style="margin-bottom:18px"><h2>درآمد و هزینه ماهانه محقق‌شده ۱۴۰۵</h2><p class="muted small">میلیون ریال</p>${c1}</div>
  <div class="card"><div class="spread"><div><h2>بودجه ۱۴۰۵ و محقق‌شده ۱۴۰۵</h2><p class="muted small">${dm==='حاشیه سود'?'درصد':'میلیون ریال'} · خط‌چین: بودجه ۱۴۰۵ (نمونه فرضی) · خط ممتد: محقق‌شده ۱۴۰۵</p></div>
  <div class="field" style="margin:0"><label>چه چیزی مقایسه شود؟</label><select onchange="set('dashMetric',this.value)">${['درآمد','هزینه','سود/زیان ناخالص','حاشیه سود'].map(x=>`<option ${dm===x?'selected':''}>${x}</option>`).join('')}</select></div></div>${c2}</div>`;
};
/* بار اول (وقتی هیچ داده‌ای نیست) داده نمونه خودکار بارگذاری می‌شود تا برنامه خالی نباشد */
if(!S.demoSeed&&!S.demoDismissed&&!S.subs.length&&!S.drafts.length&&!['درآمد','هزینه','نقدینگی'].some(f=>S.rows[f].length)&&!Object.values(S.actData||{}).some(d=>['درآمد','هزینه','نقدینگی'].some(f=>(d[f]||[]).length)))seedDemo();
render();
})();
