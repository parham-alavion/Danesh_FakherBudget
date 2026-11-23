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
  const legend=`<div class="legend" style="margin-bottom:6px">${series.map((s,k)=>`<span><i class="dot" style="background:${s.color||PAL[k%PAL.length]}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  return `${legend}<svg class="lc" viewBox="0 0 ${W} ${H}" width="100%" role="img">${grid}${xl}${lines}</svg>`;
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
    :key==='rev'?`ارسال: ${sub.sentAt} · مرحله فعلی: ${st==='در بررسی کارشناس'?'کارشناس هلدینگ':st==='در بررسی مدیر مالی'?'مدیر مالی هلدینگ':'هیئت‌مدیره'}`
    :key==='ok'?`تصویب نهایی شد · ارسال: ${sub.sentAt}`
    :`برای اصلاح برگشت خورد${last&&last.note?': '+last.note:''}`;
  return `<div class="card" style="margin-bottom:18px"><div class="spread"><div><h2>وضعیت ارسال بودجه ۱۴۰۶</h2><p class="muted small">${esc(detail)}</p></div><button class="btn" onclick="go('workflow')">درخواست‌های بودجه</button></div>
  <div class="dstatus">${steps.map(([k,t])=>`<div class="${k===key?'on '+cls[k]:''}"><span class="dstep">${k===key?'●':'○'}</span>${t}</div>`).join('')}</div></div>`;
}

/* ---------- داده نمونه برای نمایش ---------- */
const DEMO={
  'درآمد':[['درآمد خدمات به شرکت‌های گروه',[1800,1850,1900,2000,2100,2200,2250,2300,2400,2450,2500,2600]],['درآمد خدمات خارج از گروه',[600,650,700,750,800,850,900,950,1000,1050,1100,1150]]],
  'هزینه':[['بهای تمام‌شده خدمات',[700,720,740,760,780,800,820,840,860,880,900,920]],['حقوق و مزایای پرسنل',Array(12).fill(800)],['هزینه عمومی و اداری',Array(12).fill(250)],['هزینه استهلاک',Array(12).fill(60)]],
  'نقدینگی':[['دریافت نقدی از مشتریان',[2300,2400,2500,2600,2700,2800,2900,3000,3100,3200,3300,3400]],['پرداخت نقدی حقوق و هزینه‌ها',[1750,1780,1800,1830,1860,1890,1920,1950,1980,2010,2040,2070]]]
};
window.seedDemo=()=>{
  const nowT=new Date().toLocaleString('fa-IR'),rows={};
  FORMS.forEach(f=>rows[f]=DEMO[f].map(([name,v])=>({name,values:v.slice()})));
  if(!S.subs.some(x=>x.demo)){
    const ev=(type,actor,note)=>({type,time:nowT,actor,note:note||''});
    S.subs.unshift({id:Date.now(),demo:true,name:'بودجه ۱۴۰۶ (نمونه)',source:'نمونه',created:nowT,sentAt:nowT,rows,docs:[{name:'صورت‌جلسه-تصویب-داخلی.pdf',type:'صورت‌جلسه تصویب داخلی',time:nowT,size:'۲۴۰ کیلوبایت'}],message:'بودجه ۱۴۰۶ پس از تصویب داخلی برای بررسی ارسال می‌شود.',status:'تصویب‌شده',
      events:[ev('ارسال به معاونت مالی هلدینگ','شرکت دانا','بودجه ۱۴۰۶ پس از تصویب داخلی برای بررسی ارسال می‌شود. · ۱ سند پیوست'),ev('تأیید و ارجاع به مدیر مالی هلدینگ','کارشناس هلدینگ','مفروضات تأیید شد'),ev('تأیید و ارجاع به هیئت‌مدیره','مدیر مالی هلدینگ','نسبت هزینه نیروی انسانی در محدوده است'),ev('تصویب نهایی','هیئت‌مدیره','')]});
    S.status='تصویب‌شده';
  }
  S.actData=S.actData||{};
  if(window.HB){
    [1404,1405].forEach(y=>{const dd=S.actData[y]=S.actData[y]||{};FORMS.forEach(f=>dd[f]=dd[f]||[]);
      if(!FORMS.some(f=>dd[f].length)){FORMS.forEach(f=>DEMO[f].forEach(([name],k)=>dd[f].push({name,values:HB.bud('دانا',y,f,name).map((x,m)=>Math.round(x*((f==='هزینه'?1.05:.96)+.08*Math.sin(k+m+y%7)))),src:'نمونه'})))}});
  }
  S.demoSeed=true;save();render();
};
window.clearDemo=()=>{
  S.subs=S.subs.filter(x=>!x.demo);
  const c=S.subs.find(x=>x.status!=='حذف‌شده');S.status=c?c.status:'پیش‌نویس';
  if(S.actData){Object.keys(S.actData).forEach(y=>FORMS.forEach(f=>{S.actData[y][f]=(S.actData[y][f]||[]).filter(r=>r.src!=='نمونه')}));S.demoActual=false}
  S.demoSeed=false;save();render();
};

/* ---------- امتیاز ستاره‌ای شرکت در میان شرکت‌های هلدینگ ---------- */
let rateOpen=false;
const IND=[['margin','حاشیه سود',.35,false,'سودآوری'],['ach','تحقق درآمد نسبت به بودجه',.25,false,'درآمد'],['ctl','کنترل هزینه (هزینه واقعی ÷ بودجه)',.20,true,'هزینه'],['growth','رشد درآمد نسبت به ۱۴۰۴',.20,false,'رشد']];
function rateData(){
  if(!window.CMP)return null;
  const tot=(l,f)=>Object.entries(l.map).filter(([k])=>k.startsWith(f+'|')).reduce((s,[,v])=>s+v.reduce((x,y)=>x+y,0),0);
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
  const p05={inc:b05?sum(b05.inc):null,cost:b05?sum(b05.cost):null};
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
  const c1=L>=0?lineChart(lab,[{name:'درآمد محقق‌شده ۱۴۰۵',data:act.inc.slice(0,L+1),color:'#3f9a7e'},{name:'هزینه محقق‌شده ۱۴۰۵',data:act.cost.slice(0,L+1),color:'#b04a3b'}]):empty;
  const dm=['درآمد','هزینه','سود/زیان ناخالص','حاشیه سود'].includes(S.dashMetric)?S.dashMetric:'درآمد';
  const bM=dm==='درآمد'?sI:dm==='هزینه'?sC:dm==='حاشیه سود'?(b05?sI.map((v,i)=>v?(v-sC[i])/v*100:null):nul):(b05?sI.map((v,i)=>v-sC[i]):nul);
  const aM=dm==='درآمد'?act.inc:dm==='هزینه'?act.cost:dm==='حاشیه سود'?act.inc.map((v,i)=>v?(v-act.cost[i])/v*100:null):act.inc.map((v,i)=>v-act.cost[i]);
  const aCol=dm==='درآمد'?'#3f9a7e':dm==='هزینه'?'#b04a3b':'#3a77b5';
  const aMc=aM.map((v,i)=>L>=0&&i<=L?v:null);
  const c2=(L>=0||b05)?lineChart(months,[{name:'بودجه ۱۴۰۵',data:bM,color:'#d2ac67',dash:true},{name:'محقق‌شده ۱۴۰۵',data:aMc,color:aCol}],{h:240}):empty;
  return `${heading('نمای کلی شرکت دانا','وضعیت بودجه ۱۴۰۶ و عملکرد محقق‌شده ۱۴۰۵',`<div class="row" style="gap:16px;align-items:center">${ratingHtml()}<button class="btn" onclick="go('budget')">پیش‌بینی بودجه</button></div>`)}
  ${S.demoSeed?`<div class="notice" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:10px"><span>داده‌های این صفحه نمونه هستند.</span><button class="btn link" onclick="clearDemo()">حذف داده نمونه</button></div>`:(!S.subs.length&&L<0?`<div class="notice" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:10px"><span>برای دیدن نمونه‌ی نمای کلی می‌توانید داده نمونه بارگذاری کنید.</span><button class="btn" onclick="seedDemo()">پر کردن با داده نمونه</button></div>`:'')}
  ${statusCard()}${kpis}
  ${bsel?`<p class="muted small" style="margin:-6px 0 14px">بودجه ۱۴۰۶ از درخواست ارسال‌شده محاسبه شده است. عملکرد محقق‌شده فقط تا سال ۱۴۰۵ ثبت می‌شود.</p>`:'<p class="muted small" style="margin:-6px 0 14px">بودجه ۱۴۰۶ تا زمانی که برای هلدینگ ارسال نشود، در این صفحه خالی می‌ماند.</p>'}
  <div class="card" style="margin-bottom:18px"><h2>درآمد و هزینه ماهانه محقق‌شده ۱۴۰۵</h2><p class="muted small">میلیون ریال</p>${c1}</div>
  <div class="card"><div class="spread"><div><h2>بودجه ۱۴۰۵ و محقق‌شده ۱۴۰۵</h2><p class="muted small">${dm==='حاشیه سود'?'درصد':'میلیون ریال'} · خط‌چین: بودجه ۱۴۰۵ (نمونه فرضی) · خط ممتد: محقق‌شده ۱۴۰۵</p></div>
  <div class="field" style="margin:0"><label>چه چیزی مقایسه شود؟</label><select onchange="set('dashMetric',this.value)">${['درآمد','هزینه','سود/زیان ناخالص','حاشیه سود'].map(x=>`<option ${dm===x?'selected':''}>${x}</option>`).join('')}</select></div></div>${c2}</div>`;
};
render();
})();
