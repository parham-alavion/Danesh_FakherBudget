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
  const d=(S.actData&&S.actData[1406])||{};let last=-1;
  months.forEach((_,m)=>{if(['درآمد','هزینه'].some(f=>(d[f]||[]).some(r=>r.values[m]!=null)))last=m});
  const mon=f=>months.map((_,m)=>sum((d[f]||[]).map(r=>r.values[m]==null?0:r.values[m])));
  return {last,inc:mon('درآمد'),cost:mon('هزینه')};
}
function prevTotals(rows){
  if(!window.HB||!rows)return null;
  const tot=f=>sum((rows[f]||[]).map(r=>sum(HB.bud('دانا',1405,f,r.name))));
  return {inc:tot('درآمد'),cost:tot('هزینه')};
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
  const d=(S.actData=S.actData||{})[1406]=(S.actData[1406]||{});FORMS.forEach(f=>d[f]=d[f]||[]);
  if(!FORMS.some(f=>d[f].length)){
    FORMS.forEach(f=>{DEMO[f].forEach(([name,v],k)=>d[f].push({name,values:v.map((x,m)=>m<6?Math.round(x*((f==='هزینه'?1.07:f==='درآمد'?0.95:1)+.12*Math.sin(k*2+m*1.3+1))):null),src:'نمونه'}))});
    S.demoActual=true;
  }
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

/* ---------- نمای کلی شرکت ---------- */
window.companyDashboard=()=>{
  const bsel=pickBudget(),act=actualInfo(),prev=prevTotals(bsel&&bsel.rows),L=act.last;
  const bInc=bsel?mSum(bsel.rows,'درآمد'):Array(12).fill(0),bCost=bsel?mSum(bsel.rows,'هزینه'):Array(12).fill(0),nul=Array(12).fill(null),bIncC=bsel?bInc:nul,bCostC=bsel?bCost:nul;
  const tInc=sum(bInc),tCost=sum(bCost);
  const kp=(t,v,s,extra='')=>`<div class="card kpi"><span class="muted">${t}</span><div class="value">${v}</div><span class="small muted">${s}</span>${extra}</div>`;
  const delta=(a,b)=>b?pcs(a/b-1):'—';
  const aI=L>=0?sum(act.inc.slice(0,L+1)):0,aC=L>=0?sum(act.cost.slice(0,L+1)):0,bI=sum(bInc.slice(0,L+1)),bC=sum(bCost.slice(0,L+1));
  const rate=(a,b)=>b?num(Math.round(a/b*100))+'٪ از بودجه':'';
  const none='پس از ارسال بودجه نمایش داده می‌شود',tG=tInc-tCost,aG=aI-aC,bG=bI-bC,mp=(g,i)=>i?Math.round(g/i*1000)/10:null,pm=v=>v==null?'—':num(v)+'٪';
  const kpis=`<div class="grid kpis">
    ${kp('بودجه ۱۴۰۶ · درآمد',bsel?R(tInc):'—',prev?`سال قبل: ${R(prev.inc)} · ${delta(tInc,prev.inc)}`:none)}
    ${kp('بودجه ۱۴۰۶ · هزینه',bsel?R(tCost):'—',prev?`سال قبل: ${R(prev.cost)} · ${delta(tCost,prev.cost)}`:none)}
    ${kp('بودجه ۱۴۰۶ · سود/زیان ناخالص',bsel?sg(tG):'—',prev?`سال قبل: ${sg(prev.inc-prev.cost)} · ${delta(tG,prev.inc-prev.cost)}`:none)}
    ${kp('بودجه ۱۴۰۶ · حاشیه سود',bsel?pm(mp(tG,tInc)):'—',prev?`سال قبل: ${pm(mp(prev.inc-prev.cost,prev.inc))} · سود/زیان ناخالص ÷ درآمد`:none)}
    ${kp('درآمد محقق‌شده امسال',L>=0?R(aI):'ثبت نشده',L>=0?`تا پایان ${months[L]} · ${rate(aI,bI)||'بدون بودجه'}`:'عملکرد را در «ایجاد عملکرد جدید» ثبت کنید')}
    ${kp('هزینه محقق‌شده امسال',L>=0?R(aC):'ثبت نشده',L>=0?`تا پایان ${months[L]} · ${rate(aC,bC)||'بدون بودجه'}`:'')}
    ${kp('سود/زیان ناخالص محقق‌شده امسال',L>=0?sg(aG):'ثبت نشده',L>=0?`تا پایان ${months[L]} · ${bsel?'بودجه همان دوره: '+sg(bG):'بدون بودجه'}`:'')}
    ${kp('حاشیه سود محقق‌شده امسال',L>=0?pm(mp(aG,aI)):'ثبت نشده',L>=0?`تا پایان ${months[L]}${bsel?' · بودجه همان دوره: '+pm(mp(bG,bI)):''}`:'')}
  </div>`;
  const lab=L>=0?months.slice(0,L+1):[];
  const empty=`<div class="empty" style="padding:30px 0">عملکرد واقعی امسال ثبت نشده است. <button class="btn link" onclick="go('actual')">ایجاد عملکرد جدید</button></div>`;
  const c1=L>=0?lineChart(lab,[{name:'درآمد محقق‌شده',data:act.inc.slice(0,L+1),color:'#3f9a7e'},{name:'هزینه محقق‌شده',data:act.cost.slice(0,L+1),color:'#b04a3b'}]):empty;
  const dm=['درآمد','هزینه','سود/زیان ناخالص','حاشیه سود'].includes(S.dashMetric)?S.dashMetric:'درآمد';
  const bM=dm==='درآمد'?bIncC:dm==='هزینه'?bCostC:dm==='حاشیه سود'?(bsel?bInc.map((v,i)=>v?(v-bCost[i])/v*100:null):nul):(bsel?bInc.map((v,i)=>v-bCost[i]):nul);
  const aM=dm==='درآمد'?act.inc:dm==='هزینه'?act.cost:dm==='حاشیه سود'?act.inc.map((v,i)=>v?(v-act.cost[i])/v*100:null):act.inc.map((v,i)=>v-act.cost[i]);
  const aCol=dm==='درآمد'?'#3f9a7e':dm==='هزینه'?'#b04a3b':'#3a77b5';
  const c2=L>=0?lineChart(lab,[{name:'بودجه ۱۴۰۶',data:bM.slice(0,L+1),color:'#d2ac67',dash:true},{name:'محقق‌شده امسال',data:aM.slice(0,L+1),color:aCol}],{h:240}):empty;
  return `${heading('نمای کلی شرکت دانا','وضعیت بودجه ۱۴۰۶، مقایسه با سال قبل و عملکرد محقق‌شده تا اینجا',`<button class="btn" onclick="go('budget')">پیش‌بینی بودجه</button>`)}
  ${S.demoSeed?`<div class="notice" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:10px"><span>داده‌های این صفحه نمونه هستند.</span><button class="btn link" onclick="clearDemo()">حذف داده نمونه</button></div>`:(!S.subs.length&&L<0?`<div class="notice" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:10px"><span>برای دیدن نمونه‌ی نمای کلی می‌توانید داده نمونه بارگذاری کنید.</span><button class="btn" onclick="seedDemo()">پر کردن با داده نمونه</button></div>`:'')}
  ${statusCard()}${kpis}
  ${bsel?`<p class="muted small" style="margin:-6px 0 14px">بودجه ۱۴۰۶ از درخواست ارسال‌شده محاسبه شده است.${prev?' ارقام سال قبل نمونه فرضی است.':''}</p>`:'<p class="muted small" style="margin:-6px 0 14px">بودجه ۱۴۰۶ تا زمانی که برای هلدینگ ارسال نشود، در این صفحه خالی می‌ماند.</p>'}
  <div class="card" style="margin-bottom:18px"><h2>درآمد و هزینه ماهانه امسال تا اینجا</h2><p class="muted small">عملکرد محقق‌شده · میلیون تومان</p>${c1}</div>
  <div class="card"><div class="spread"><div><h2>بودجه ۱۴۰۶ و محقق‌شده امسال</h2><p class="muted small">تا پایان ${L>=0?months[L]:'—'} · ${dm==='حاشیه سود'?'درصد':'میلیون تومان'} · خط‌چین: بودجه · خط ممتد: محقق‌شده</p></div>
  <div class="field" style="margin:0"><label>چه چیزی مقایسه شود؟</label><select onchange="set('dashMetric',this.value)">${['درآمد','هزینه','سود/زیان ناخالص','حاشیه سود'].map(x=>`<option ${dm===x?'selected':''}>${x}</option>`).join('')}</select></div></div>${c2}</div>`;
};
render();
})();
