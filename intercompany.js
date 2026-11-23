// مطالبات درون‌گروهی: جدول قراردادها، وضعیت تسویه و جزئیات هر قرارداد (داده نمونه فرضی)
(function(){
const R=n=>num(Math.round(n));
const CUM=[0,31,62,93,124,155,186,216,246,276,306,336];
const parse=s=>{const [y,m,d]=s.split('/').map(Number);return {y,m,d}};
const dayNum=s=>{const {y,m,d}=parse(s);return y*365+CUM[m-1]+d};
const fd=s=>{const {y,m,d}=parse(s);return String(y).replace(/\d/g,x=>'۰۱۲۳۴۵۶۷۸۹'[x])+'/'+String(m).padStart(2,'0').replace(/\d/g,x=>'۰۱۲۳۴۵۶۷۸۹'[x])+'/'+String(d).padStart(2,'0').replace(/\d/g,x=>'۰۱۲۳۴۵۶۷۸۹'[x])};
const todayJ=()=>{try{const p=new Date().toLocaleDateString('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric'}).match(/(\d+)\/(\d+)\/(\d+)/);return `${p[3]}/${p[1]}/${p[2]}`}catch(e){return '1405/09/02'}};

const C=[
 {id:'QD-1405-011',from:'دانا',to:'تی‌نکست',svc:'خدمات زیرساخت و سرور',cat:'فناوری اطلاعات',start:'1405/01/15',due:'1405/10/30',total:1200,pays:[['1405/04/20',250,'چک ۳۲۱۴'],['1405/07/10',150,'انتقال بانکی']],inv:'F-9811',terms:'پرداخت ۳۰۰ روزه با تسویه‌ی مرحله‌ای',rate:2,rec:'در انتظار تطبیق',recDate:'',owner:'مدیر مالی دانا',note:'قرارداد سالانه‌ی نگهداری زیرساخت؛ صورت‌حساب ماهانه صادر می‌شود.'},
 {id:'QD-1405-014',from:'دانا',to:'تیپاکس',svc:'پشتیبانی و نگهداری نرم‌افزار',cat:'نرم‌افزار',start:'1405/03/01',due:'1405/07/15',total:900,pays:[['1405/05/12',300,'انتقال بانکی'],['1405/06/20',200,'انتقال بانکی']],inv:'F-9902',terms:'پرداخت ۱۲۰ روزه',rate:2,rec:'مغایرت',recDate:'1405/08/10',owner:'مدیر مالی دانا',note:'تیپاکس مبلغ ۱۰۰ میلیون از فاکتور را مورد اعتراض قرار داده است.'},
 {id:'QD-1405-019',from:'دانا',to:'اکتیران',svc:'خدمات مشاوره مالی',cat:'مشاوره',start:'1405/05/10',due:'1405/09/20',total:450,pays:[],inv:'F-9957',terms:'پرداخت ۱۲۰ روزه',rate:2,rec:'تطبیق‌شده',recDate:'1405/08/25',owner:'کارشناس مالی دانا',note:''},
 {id:'QD-1405-022',from:'مهان‌پوش',to:'دانا',svc:'خدمات حمل و لجستیک',cat:'لجستیک',start:'1405/02/01',due:'1405/11/10',total:700,pays:[['1405/05/15',350,'انتقال بانکی'],['1405/08/02',350,'انتقال بانکی']],inv:'M-3320',terms:'پرداخت ۲۷۰ روزه',rate:1.5,rec:'تطبیق‌شده',recDate:'1405/08/05',owner:'مدیر مالی مهان‌پوش',note:'تسویه کامل شد.'},
 {id:'QD-1405-025',from:'تی‌هاب',to:'دانا',svc:'میزبانی ابری و پشتیبان‌گیری',cat:'فناوری اطلاعات',start:'1405/04/01',due:'1405/10/05',total:600,pays:[['1405/07/01',200,'انتقال بانکی']],inv:'H-5521',terms:'پرداخت ۱۸۰ روزه',rate:2,rec:'در انتظار تطبیق',recDate:'',owner:'مدیر مالی تی‌هاب',note:''},
 {id:'QD-1404-031',from:'دانا',to:'خوگر',svc:'خدمات آموزشی و توانمندسازی',cat:'آموزش',start:'1404/10/01',due:'1405/06/30',total:300,pays:[['1405/02/25',150,'چک ۱۱۸۸'],['1405/06/25',150,'انتقال بانکی']],inv:'F-9544',terms:'پرداخت ۲۴۰ روزه',rate:1.5,rec:'تطبیق‌شده',recDate:'1405/06/28',owner:'کارشناس مالی دانا',note:''},
 {id:'QD-1405-027',from:'پرسیت',to:'دانا',svc:'خدمات تبلیغات و بازاریابی',cat:'بازاریابی',start:'1405/06/15',due:'1405/08/15',total:350,pays:[['1405/07/20',100,'انتقال بانکی']],inv:'P-7710',terms:'پرداخت ۶۰ روزه',rate:3,rec:'در انتظار تطبیق',recDate:'',owner:'مدیر مالی پرسیت',note:'پیگیری تماس‌گرفته‌شده؛ وعده‌ی پرداخت تا پایان آذر.'},
 {id:'QD-1405-029',from:'دانا',to:'ریشه',svc:'توسعه نرم‌افزار سفارشی',cat:'نرم‌افزار',start:'1405/07/01',due:'1406/01/20',total:1500,pays:[['1405/07/05',300,'پیش‌پرداخت'],['1405/08/20',300,'انتقال بانکی']],inv:'F-10002',terms:'۲۰٪ پیش‌پرداخت و مابقی در سه قسط',rate:2,rec:'تطبیق‌شده',recDate:'1405/08/22',owner:'مدیر مالی دانا',note:'قسط سوم هم‌زمان با تحویل نهایی پرداخت می‌شود.'},
 {id:'QD-1405-033',from:'تی‌نکست',to:'تی‌پی‌ایکس',svc:'خدمات ارتباطات و شبکه',cat:'فناوری اطلاعات',start:'1405/03/20',due:'1405/08/20',total:800,pays:[['1405/06/01',300,'انتقال بانکی']],inv:'N-4410',terms:'پرداخت ۱۵۰ روزه',rate:2,rec:'مغایرت',recDate:'1405/08/18',owner:'مدیر مالی تی‌نکست',note:''},
 {id:'QD-1405-036',from:'جابار',to:'زی‌بوم',svc:'خدمات حمل‌ونقل',cat:'لجستیک',start:'1405/05/01',due:'1405/12/15',total:500,pays:[['1405/07/25',100,'انتقال بانکی']],inv:'J-2201',terms:'پرداخت ۲۱۰ روزه',rate:1.5,rec:'تطبیق‌شده',recDate:'1405/08/01',owner:'مدیر مالی جابار',note:''},
 {id:'QD-1405-038',from:'ایفا',to:'حلزون',svc:'خدمات حسابداری و حسابرسی',cat:'مشاوره',start:'1405/04/10',due:'1405/09/10',total:250,pays:[],inv:'E-1180',terms:'پرداخت ۱۵۰ روزه',rate:2,rec:'در انتظار تطبیق',recDate:'',owner:'مدیر مالی ایفا',note:''}
];
S.icf=Object.assign({st:'همه',cr:'همه',db:'همه'},S.icf);

function derive(c){
  const paid=c.pays.reduce((s,p)=>s+p[1],0),rem=c.total-paid,td=dayNum(todayJ()),dd=dayNum(c.due);
  const late=rem>0&&dd<td,daysLate=late?td-dd:0,left=dd-td;
  let st,tone;
  if(rem<=0){st='تسویه‌شده';tone='good'}else if(late){st='سررسیدگذشته';tone='bad'}else if(left<=30){st='نزدیک سررسید';tone='warn'}else{st='جاری';tone=''}
  const penalty=late?rem*(c.rate/100)*(daysLate/30):0;
  return {...c,paid,rem,late,daysLate,left,st,tone,penalty,pct:c.total?paid/c.total:0};
}
const recTone=r=>r==='تطبیق‌شده'?'good':r==='مغایرت'?'bad':'warn';
const mine=c=>c.from==='دانا'; // پنل شرکت: فقط مطالبات دانا (دانا بستانکار)

function rows(){
  const holding=S.scope==='holding';
  let l=C.map(derive);
  if(!holding)l=l.filter(mine);
  const f=S.icf;
  if(holding&&f.cr!=='همه')l=l.filter(c=>c.from===f.cr);
  if(holding&&f.db!=='همه')l=l.filter(c=>c.to===f.db);
  if(f.st!=='همه')l=l.filter(c=>c.st===f.st);
  return l.sort((a,b)=>dayNum(a.due)-dayNum(b.due));
}
const opt=(l,v)=>l.map(x=>`<option ${x===v?'selected':''}>${esc(x)}</option>`).join('');
window.icSet=(k,v)=>{S.icf[k]=v;save();render()};

pages.intercompany=()=>{
  const holding=S.scope==='holding',all=C.map(derive).filter(c=>holding||mine(c)),l=rows();
  const recv=all;
  const kp=(t,v,s,tone='')=>`<div class="card kpi"><span class="muted">${t}</span><div class="value ${tone}" style="font-size:22px">${v}</div><span class="small muted">${s}</span></div>`;
  const sumR=a=>a.reduce((s,c)=>s+c.rem,0),over=all.filter(c=>c.late);
  return `${heading('مطالبات درون‌گروهی','شفافیت خدمات و تسویه میان شرکت‌های گروه · میلیون ریال')}
  <div class="grid kpis">
    ${kp(holding?'کل مطالبات باقی‌مانده':'مطالبات باقی‌مانده دانا',R(sumR(recv)),`${num(recv.filter(c=>c.rem>0).length)} قرارداد باز`)}
    ${kp('مبلغ کل قراردادها',R(all.reduce((s,c)=>s+c.total,0)),`${num(all.length)} قرارداد`)}
    ${kp('سررسیدگذشته',R(sumR(over)),`${num(over.length)} قرارداد`,over.length?'t-bad':'')}
    ${kp('وصول‌شده تا امروز',R(all.reduce((s,c)=>s+c.paid,0)),`از ${R(all.reduce((s,c)=>s+c.total,0))} مبلغ کل`)}
  </div>
  <div class="card"><div class="filters" style="align-items:flex-end">
    ${holding?`<div class="field" style="margin:0"><label>بستانکار (ارائه‌دهنده)</label><select onchange="icSet('cr',this.value)">${opt(['همه',...companies],S.icf.cr)}</select></div><div class="field" style="margin:0"><label>بدهکار (دریافت‌کننده)</label><select onchange="icSet('db',this.value)">${opt(['همه',...companies],S.icf.db)}</select></div>`:''}
    <div class="field" style="margin:0"><label>وضعیت تسویه</label><select onchange="icSet('st',this.value)">${opt(['همه','جاری','نزدیک سررسید','سررسیدگذشته','تسویه‌شده'],S.icf.st)}</select></div></div>
  <div class="tablewrap"><table><thead><tr><th>شماره قرارداد</th><th>بستانکار (ارائه‌دهنده)</th><th>بدهکار (دریافت‌کننده)</th><th>شرح خدمت</th><th>تاریخ شروع</th><th>تاریخ سررسید</th><th>مبلغ کل</th><th>پرداخت‌شده</th><th>باقی‌مانده</th><th>وضعیت تسویه</th><th></th></tr></thead><tbody>${l.length?l.map(c=>`<tr><td>${esc(c.id)}</td><td>${esc(c.from)}</td><td>${esc(c.to)}</td><td style="white-space:normal;min-width:170px">${esc(c.svc)}</td><td>${fd(c.start)}</td><td>${fd(c.due)}${c.late?`<div class="small t-bad">${num(c.daysLate)} روز تأخیر</div>`:c.rem>0&&c.left<=30?`<div class="small muted">${num(c.left)} روز مانده</div>`:''}</td><td>${R(c.total)}</td><td>${R(c.paid)}<div class="track" style="margin-top:4px;min-width:60px"><span style="width:${Math.min(100,c.pct*100)}%"></span></div></td><td class="${c.rem>0&&c.late?'t-bad':''}"><b>${R(c.rem)}</b></td><td><span class="badge ${c.tone}">${c.st}</span></td><td><button class="btn" onclick="icDetail('${c.id}')">جزئیات</button></td></tr>`).join(''):'<tr><td colspan="11" class="empty">قراردادی با این فیلتر نیست.</td></tr>'}</tbody></table></div>
  <p class="muted small" style="margin-top:12px">ارقام نمونه‌ی فرضی است. تاریخ سررسید و روز تأخیر بر اساس تاریخ امروز محاسبه می‌شود.</p></div>`;
};

window.icDetail=id=>{
  const raw=C.find(x=>x.id===id);if(!raw)return;const c=derive(raw);
  const row=(k,v)=>`<div class="spread" style="padding:7px 0;border-bottom:1px solid #f0f0f0"><span class="muted">${k}</span><b>${v}</b></div>`;
  const dur=Math.max(0,dayNum(c.due)-dayNum(c.start));
  modal(`قرارداد ${esc(c.id)} · ${esc(c.svc)}`,`
  <div class="row" style="gap:8px;margin-bottom:10px"><span class="badge ${c.tone}">${c.st}</span><span class="badge ${recTone(c.rec)}">تطبیق: ${c.rec}</span><span class="badge">${esc(c.cat)}</span></div>
  <div class="grid twocol" style="grid-template-columns:1fr 1fr;gap:22px">
   <div><h3>قرارداد</h3>${row('بستانکار (ارائه‌دهنده)',esc(c.from))}${row('بدهکار (دریافت‌کننده)',esc(c.to))}${row('تاریخ شروع',fd(c.start))}${row('تاریخ سررسید',fd(c.due))}${row('مدت قرارداد',num(dur)+' روز')}${row('شرایط پرداخت',esc(c.terms))}${row('شماره فاکتور',esc(c.inv))}${row('مسئول پیگیری',esc(c.owner))}</div>
   <div><h3>مالی</h3>${row('مبلغ کل',R(c.total))}${row('پرداخت‌شده',R(c.paid)+' ('+num(Math.round(c.pct*100))+'٪)')}${row('باقی‌مانده',`<span class="${c.rem>0&&c.late?'t-bad':''}">${R(c.rem)}</span>`)}${row('نرخ جریمه تأخیر',num(c.rate)+'٪ ماهانه')}${row('جریمه تأخیر تا امروز',c.late?`<span class="t-bad">${R(c.penalty)}</span>`:'—')}${row('روز تأخیر',c.late?num(c.daysLate):'—')}${row('تطبیق حساب',esc(c.rec)+(c.recDate?' · '+fd(c.recDate):''))}</div></div>
  <h3 style="margin-top:18px">تاریخچه پرداخت‌ها</h3>
  <div class="tablewrap"><table><thead><tr><th>تاریخ</th><th>مبلغ</th><th>روش / مرجع</th></tr></thead><tbody>${c.pays.length?c.pays.map(p=>`<tr><td>${fd(p[0])}</td><td>${R(p[1])}</td><td>${esc(p[2])}</td></tr>`).join('')+`<tr style="font-weight:bold"><td>جمع</td><td>${R(c.paid)}</td><td></td></tr>`:'<tr><td colspan="3" class="empty">پرداختی ثبت نشده است.</td></tr>'}</tbody></table></div>
  ${c.note?`<h3 style="margin-top:18px">توضیحات</h3><div class="notice">${esc(c.note)}</div>`:''}`,`<button class="btn" onclick="closeModal()">بستن</button>`);
  document.querySelector('#modal .modal').style.width='min(820px,100%)';
};
render();
})();
