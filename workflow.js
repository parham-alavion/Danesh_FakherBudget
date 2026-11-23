// گردش تصویب، پیش‌نویس‌ها و تاریخچه ارسال‌ها (نمونه نمایشی)
(function(){
const FORMS=['درآمد','هزینه','نقدینگی'];
const STAGES=['تهیه در شرکت','کارشناس مالی هلدینگ','مدیر مالی هلدینگ','هیئت‌مدیره هلدینگ'];
const IDX={'تهیه در شرکت':0,'بازگشت برای اصلاح':0,'در بررسی کارشناس':1,'در بررسی مدیر مالی':2,'در انتظار هیئت‌مدیره':3,'تصویب‌شده':4};
const NEXT={'در بررسی کارشناس':'در بررسی مدیر مالی','در بررسی مدیر مالی':'در انتظار هیئت‌مدیره','در انتظار هیئت‌مدیره':'تصویب‌شده'};
const now=()=>new Date().toLocaleString('fa-IR');
const clone=o=>JSON.parse(JSON.stringify(o));
const R=n=>num(Math.round(n));
const safe=s=>String(s).replace(/[\\/:*?"<>|]/g,'-');
S.subs=S.subs||[];S.drafts=S.drafts||[];

/* انتقال از نسخه قبلی که وضعیت را در S.status نگه می‌داشت */
if(!S.subs.length&&S.status&&S.status!=='پیش‌نویس'&&IDX[S.status]!=null){
  S.subs.push({id:Date.now(),name:'بودجه ۱۴۰۶',source:'فرم‌ها',created:now(),sentAt:IDX[S.status]>0?now():null,rows:clone(S.rows),docs:[],status:S.status,events:[{type:'ایجاد درخواست',time:now(),actor:'شرکت دانا',note:'انتقال از نسخه قبلی'}]});
}

/* یک‌بار: اطلاعاتی که قبلاً در فرم‌ها مانده و عیناً در یک پیش‌نویس هم ذخیره شده، از فرم‌ها پاک می‌شود */
if(!S.formsDedup){
  const sig=a=>JSON.stringify((a||[]).map(r=>[r.name,r.values]));
  FORMS.forEach(f=>{
    if(S.rows[f].length&&S.drafts.some(d=>(d.forms||FORMS).includes(f)&&sig(d.rows[f])===sig(S.rows[f]))){S.rows[f]=[];if(S.entries)S.entries[f]={}}
  });
  S.formsDedup=true;save();
}
/* درخواست‌های قدیمی که هنوز ارسال نشده بودند (مرحله تهیه در شرکت) به پیش‌نویس تبدیل می‌شوند */
S.subs.filter(x=>x.status==='تهیه در شرکت'&&!x.sentAt).forEach(x=>{
  S.drafts.unshift({id:x.id,name:x.name,source:x.source,created:x.created,rows:x.rows,forms:FORMS.slice(),docs:x.docs||[],msg:''});
  S.subs.splice(S.subs.indexOf(x),1);
});
const live=()=>S.subs.filter(x=>x.status!=='حذف‌شده');
const cur=()=>live()[0]||null;
window.subBlocked=()=>{const c=cur();return !!c&&IDX[c.status]>=1&&c.status!=='تصویب‌شده'};
const sync=()=>{const c=cur();S.status=c?c.status:'پیش‌نویس';save()};
window.danaBudget=()=>{const s=live().find(x=>x.sentAt);return s?s.rows:S.rows};
sync();

window.createSubmission=(rows,meta)=>{
  const t=now(),sub={id:Date.now(),name:meta.name,source:meta.source,created:t,sentAt:t,rows:clone(rows),entries:meta.entries?clone(meta.entries):undefined,docs:clone(meta.docs||[]),message:meta.message||'',status:'در بررسی کارشناس',events:[{type:'ارسال به معاونت مالی هلدینگ',time:t,actor:'شرکت دانا',note:[meta.message,(meta.docs&&meta.docs.length)?`${num(meta.docs.length)} سند پیوست`:'',meta.note].filter(Boolean).join(' · ')}]};
  S.subs.unshift(sub);sync();return sub;
};
window.createDraft=(name,source,rows,extra)=>{S.drafts.unshift({id:Date.now()+Math.floor(Math.random()*1000),name,source,created:now(),rows:clone(rows),forms:(extra&&extra.forms)||FORMS.slice(),entries:extra&&extra.entries?clone(extra.entries):undefined});save()};

/* ---------- دانلود اکسل ---------- */
function entriesFor(rows,entries,f,n){
  if(isInc(f)){
    const g=itemRow(rows,f,n,'g'),o=itemRow(rows,f,n,'o'),gv=g?g.values:NL(),ov=o?o.values:NL(),E=entries&&entries[f]&&entries[f][n];
    if(E&&same(aggE(E,'values'),gv)&&same(aggE(E,'values2'),ov))return E;
    if(gv.some(v=>v!=null)||ov.some(v=>v!=null))return [{values:gv.slice(),values2:ov.slice(),note:''}];
    return [];
  }
  const row=(rows[f]||[]).find(r=>r.name===n),E=entries&&entries[f]&&entries[f][n];
  if(E&&row&&same(aggE(E),row.values))return E;
  if(row&&row.values.some(v=>v!=null))return [{values:row.values.slice(),note:row.note||''}];
  return [];
}
function exportSheets(rows,entries){
  const nn=v=>(v||NL()).map(x=>x==null?'':x);
  return FORMS.map(f=>{
    if(isInc(f)){const aoa=[['سرفصل','شرح','نوع درآمد',...months]];
      itemsOfRows(rows,f).forEach(it=>entriesFor(rows,entries,f,it).forEach(e=>{aoa.push([it,e.note||'','به شرکت‌های گروه',...nn(e.values)]);aoa.push([it,e.note||'','خارج از گروه',...nn(e.values2)])}));
      return [f,aoa]}
    const aoa=[['سرفصل','شرح',...months]];
    (rows[f]||[]).forEach(r=>entriesFor(rows,entries,f,r.name).forEach(e=>aoa.push([r.name,e.note||'',...e.values.map(v=>v==null?'':v)])));
    return [f,aoa]});
}
async function dlStore(rows,entries,name){
  const sheets=exportSheets(rows,entries);
  try{
    await XL.loadXLSX();
    const wb=XLSX.utils.book_new();
    sheets.forEach(([f,aoa])=>{const ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=aoa[0].map((_,i)=>({wch:i===0?34:i===1?24:(i===2&&f==='درآمد')?18:10}));XLSX.utils.book_append_sheet(wb,ws,f)});
    wb.Workbook={Views:[{RTL:true}]};XLSX.writeFile(wb,safe(name)+'.xlsx');
  }catch(e){
    const aoa=[['فرم','سرفصل','شرح','نوع درآمد',...months],...sheets.flatMap(([f,a])=>a.slice(1).map(r=>f==='درآمد'?[f,...r]:[f,r[0],r[1],'',...r.slice(2)]))];
    const csv='\uFEFF'+aoa.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    XL.saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),safe(name)+'.csv');
  }
}
window.subDl=id=>{const s=S.subs.find(x=>x.id===id);if(s)dlStore(s.rows,s.entries,'درخواست-'+s.name)};
window.draftDl=i=>{const d=S.drafts[i];if(d)dlStore(d.rows,d.entries,'پیش‌نویس-'+d.name)};

/* ---------- درخواست‌های بودجه ---------- */
const statusLabel=(st,sub)=>({'در بررسی کارشناس':'ارسال برای بررسی','در بررسی مدیر مالی':'تأیید کارشناس مالی هلدینگ','در انتظار هیئت‌مدیره':'تأیید مدیر مالی هلدینگ','تصویب‌شده':'تصویب نهایی','بازگشت برای اصلاح':'ارجاع‌شده به شرکت '+((sub&&sub.company)||'دانا')})[st]||st;
const chainHtml=st=>{
  const idx=Math.min(IDX[st],3),done=st==='تصویب‌شده',ret=st==='بازگشت برای اصلاح';
  return `<div class="chain">${STAGES.map((x,i)=>{const cls=done||i<idx?'done':i===idx?(ret?'ret':'cur'):'todo';return (i?'<span class="carrow">←</span>':'')+`<div class="cstep ${cls}"><span class="cic">${cls==='done'?'✓':cls==='cur'?'●':cls==='ret'?'↩':i+1}</span><b>${x}</b></div>`}).join('')}</div>`;
};
const statusCls=s=>s==='تصویب‌شده'?'good':s==='بازگشت برای اصلاح'||s==='حذف‌شده'?'bad':'warn';
const evLine=e=>`<div class="small" style="margin:3px 0;white-space:normal"><span class="muted">${esc(e.time)}</span> · <b>${esc(e.actor)}</b> · ${esc(e.type)}${e.note?`: ${esc(e.note)}`:''}</div>`;
const draftTot=(d,f)=>sum((d.rows[f]||[]).map(r=>sum(r.values)));
function draftsSection(){
  const blocked=subBlocked();
  return `<div class="card"><div class="spread"><div><h2>پیش‌نویس‌های بودجه</h2><p class="muted small">یکی از پیش‌نویس‌ها را انتخاب کنید؛ مستندات و متن ارسال را آماده و برای معاونت مالی هلدینگ فاخر ارسال کنید. ساخت پیش‌نویس در «پیش‌بینی بودجه» و مدیریت آن‌ها در «پیش‌نویس‌ها» است.</p></div></div>
  ${blocked?'<div class="notice" style="background:#fff4da;margin:10px 0">یک درخواست در حال بررسی هلدینگ دارید؛ تا پایان بررسی یا بازگشت آن، ارسال درخواست جدید ممکن نیست.</div>':''}
  <div class="tablewrap"><table><thead><tr><th>نام</th><th>تاریخ</th><th>منبع</th><th>فرم‌ها</th><th>جمع درآمد</th><th>جمع هزینه</th><th>مستندات</th><th></th></tr></thead><tbody>${S.drafts.length?S.drafts.map((d,i)=>`<tr><td>${esc(d.name)}</td><td>${esc(d.created)}</td><td>${esc(d.source)}</td><td>${(d.forms||FORMS).length===3?'همه':esc((d.forms||FORMS).join('، '))}</td><td>${R(draftTot(d,'درآمد'))}</td><td>${R(draftTot(d,'هزینه'))}</td><td>${num((d.docs||[]).length)}</td><td><button class="btn" onclick="spOpen(${d.id})">انتخاب و بررسی</button></td></tr>`).join(''):`<tr><td colspan="8" class="empty">پیش‌نویسی وجود ندارد. در «پیش‌بینی بودجه» پیش‌نویس بسازید.</td></tr>`}</tbody></table></div>
  <div class="actions" style="margin-top:12px"><button class="btn" onclick="reqNew(false)">بستن فهرست</button><button class="btn link" onclick="go('drafts')">رفتن به پیش‌نویس‌ها</button></div></div>`;
}
function requestSection(c,holding){
  if(!c)return `<div class="card" style="margin-top:18px"><h2>درخواست جاری</h2><p class="muted">${holding?'شرکت دانا هنوز درخواستی ارسال نکرده است.':'هنوز درخواستی برای هلدینگ ارسال نشده است.'}</p></div>`;
  const idx=Math.min(IDX[c.status],3),st=c.status,done=st==='تصویب‌شده',ret=st==='بازگشت برای اصلاح';
  const last=[...c.events].reverse().find(e=>/بازگشت/.test(e.type));
  let actions='';
  if(holding&&IDX[st]>=1&&!done)actions=`<button class="btn primary" onclick="subAdvModal()">${st==='در انتظار هیئت‌مدیره'?'تصویب نهایی':'تأیید و ارجاع مرحله بعد'}</button><button class="btn" onclick="subRejModal()">بازگشت برای اصلاح</button>`;
  actions+=`<button class="btn" onclick="subDl(${c.id})">دانلود اکسل</button>`;
  const note=holding?(done?'این بودجه تصویب نهایی شده است.':ret?'این بودجه برای اصلاح به شرکت برگردانده شده است.':'نظر خود را هنگام ارجاع یا بازگشت بنویسید؛ در تاریخچه برای شرکت نمایش داده می‌شود.')
    :done?'بودجه تصویب نهایی شد. برای ارسال بودجه جدید، پیش‌نویس دیگری انتخاب کنید.'
    :ret?'درخواست برای اصلاح برگردانده شد. پیش‌نویس را در پیش‌بینی بودجه اصلاح کنید و دوباره ارسال کنید.'
    :'درخواست در دست بررسی هلدینگ است و امکان ویرایش ندارید؛ فقط وضعیت آن را می‌بینید.';
  return `<div class="card" style="margin-top:18px"><div class="spread"><div><h2>درخواست جاری · ${esc(c.name)}</h2><p class="muted small">منبع: ${esc(c.source)} · ارسال: ${esc(c.sentAt||'—')}</p></div><span class="badge ${statusCls(st)}">${esc(statusLabel(st,c))}</span></div>
  ${chainHtml(st)}
  ${ret&&last?`<div class="notice" style="background:#fcebea;color:#b43d37;margin-bottom:12px"><b>بازگشت برای اصلاح</b> · ${esc(last.actor)} · ${esc(last.time)}${last.note?'<br>'+esc(last.note):''}</div>`:''}
  <div class="notice">${note}</div>
  ${c.message?`<h3 style="margin-top:20px">متن ارسال</h3><div class="notice" style="white-space:pre-wrap">${esc(c.message)}</div>`:''}
  <h3 style="margin-top:20px">مستندات پیوست</h3>
  <div class="tablewrap"><table><thead><tr><th>نام سند</th><th>نوع</th><th>تاریخ</th><th>اندازه</th></tr></thead><tbody>${c.docs.length?c.docs.map(d=>`<tr><td>${esc(d.name)}</td><td>${esc(d.type)}</td><td>${esc(d.time)}</td><td>${esc(d.size)}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">سندی پیوست نشده است.</td></tr>'}</tbody></table></div>
  <div class="actions" style="margin-top:18px">${actions}</div></div>`;
}
function histSection(){
  const rows=S.subs.map(x=>`<tr class="hgrp"><td colspan="4"><div class="spread"><div><b>${esc(x.name)}</b> <span class="muted small">· ${esc(x.source)} · ارسال: ${esc(x.sentAt||'—')}</span></div><div class="row" style="gap:10px"><span class="badge ${statusCls(x.status)}">${esc(statusLabel(x.status,x))}</span><span class="small muted">مرحله: ${IDX[x.status]>=4?'پایان':STAGES[IDX[x.status]]}</span><button class="btn" onclick="subDl(${x.id})">دانلود اکسل</button></div></div></td></tr>`+x.events.map(e=>`<tr><td>${esc(e.time)}</td><td>${esc(e.actor)}</td><td>${esc(e.type)}</td><td style="white-space:normal;min-width:260px">${e.note?esc(e.note):'<span class="muted">—</span>'}</td></tr>`).join('')).join('');
  return `<div class="card" style="margin-top:18px"><h2>تاریخچه ارسال‌ها</h2><p class="muted small">هر درخواست با وضعیت فعلی‌اش و هر رویداد (ارسال، ارجاع، بازگشت، تصویب) در یک سطر جدا</p><div class="tablewrap"><table><thead><tr><th>زمان</th><th>اقدام‌کننده</th><th>اقدام</th><th>واکنش / توضیح</th></tr></thead><tbody>${S.subs.length?rows:'<tr><td colspan="4" class="empty">هنوز درخواستی ارسال نشده است.</td></tr>'}</tbody></table></div></div>`;
}
function renderNewReq(){
  const blocked=subBlocked();
  modal('ایجاد درخواست جدید',`<p class="muted small">یکی از پیش‌نویس‌ها را بررسی و انتخاب کنید؛ سپس مستندات و متن ارسال را آماده و برای معاونت مالی هلدینگ ارسال کنید.</p>
  ${blocked?'<div class="notice" style="background:#fff4da;margin:10px 0">یک درخواست در حال بررسی هلدینگ دارید؛ تا پایان بررسی یا بازگشت آن، ارسال درخواست جدید ممکن نیست.</div>':''}
  <div class="tablewrap"><table><thead><tr><th>نام</th><th>تاریخ</th><th>منبع</th><th>فرم‌ها</th><th>جمع درآمد</th><th>جمع هزینه</th><th>مستندات</th><th></th></tr></thead><tbody>${S.drafts.length?S.drafts.map(d=>`<tr><td>${esc(d.name)}</td><td>${esc(d.created)}</td><td>${esc(d.source)}</td><td>${(d.forms||FORMS).length===3?'همه':esc((d.forms||FORMS).join('، '))}</td><td>${R(draftTot(d,'درآمد'))}</td><td>${R(draftTot(d,'هزینه'))}</td><td>${num((d.docs||[]).length)}</td><td><button class="btn" onclick="spPick(${d.id})">بررسی و انتخاب</button></td></tr>`).join(''):'<tr><td colspan="8" class="empty">پیش‌نویسی وجود ندارد. در «پیش‌بینی بودجه» پیش‌نویس بسازید.</td></tr>'}</tbody></table></div>
  <div class="actions" style="justify-content:flex-start;margin-top:10px"><button class="btn link" onclick="closeModal();go('drafts')">رفتن به پیش‌نویس‌ها</button></div>`,`<button class="btn" onclick="closeModal()">بستن</button>`);
  document.querySelector('#modal .modal').style.width='min(900px,100%)';
}
window.reqNew=()=>renderNewReq();
window.reqNewList=()=>renderNewReq();
window.spPick=id=>{SP={id,ok:false,from:'list'};renderSP()};
function wfPage(){
  const holding=S.scope==='holding';if(holding)return hPage('bud');
  const gate=holding?'':(`<div class="card"><div class="spread"><div><h2>درخواست جدید</h2><p class="muted small">برای ارسال بودجه، درخواست جدید ایجاد کنید و یکی از پیش‌نویس‌ها را انتخاب کنید.</p></div><button class="btn primary" onclick="reqNew()">＋ ایجاد درخواست جدید</button></div>${subBlocked()?'<div class="notice" style="background:#fff4da;margin-top:10px">یک درخواست در حال بررسی هلدینگ دارید؛ تا پایان بررسی یا بازگشت آن، ارسال درخواست جدید ممکن نیست.</div>':''}</div>`);
  return `${heading('درخواست‌های بودجه',holding?'بررسی و ارجاع بودجه ارسالی شرکت':'ایجاد درخواست جدید از پیش‌نویس‌ها، پیوست مستندات و ارسال برای معاونت مالی هلدینگ')}${gate}${requestSection(cur(),holding)}${histSection()}`;
}
pages.workflow=wfPage;
pages.perf=()=>hPage('act');


/* ---------- پنل هلدینگ: درخواست‌های همه شرکت‌ها ---------- */
const HROLE={expert:['کارشناس مالی هلدینگ','در بررسی کارشناس'],manager:['مدیر مالی هلدینگ','در بررسی مدیر مالی'],board:['هیئت‌مدیره هلدینگ','در انتظار هیئت‌مدیره']};
const dAgo=(d,h)=>new Date(Date.now()-d*864e5-(h||0)*36e5).toLocaleString('fa-IR');
if(!S.hreqs){
  const O={'تیپاکس':'approved','اکتیران':'approved','مهان‌پوش':'approved','خوگر':'approved','تی‌هاب':'rejected','جابار':'rejected','تی‌نکست':'review','تی‌اکسپرس':'review','تی‌پی‌ایکس':'review','پرسیت':'review','ریشه':'review'};
  const REV=['در بررسی کارشناس','در بررسی مدیر مالی','در انتظار هیئت‌مدیره'],ACT=['کارشناس مالی هلدینگ','مدیر مالی هلدینگ','هیئت‌مدیره هلدینگ'],ACN=['ارسال به معاونت مالی هلدینگ','تأیید و ارجاع به مدیر مالی هلدینگ','تأیید و ارجاع به هیئت‌مدیره هلدینگ','تصویب نهایی'];
  S.hreqs=Object.keys(O).map((c,k)=>{
    const h=Math.floor(HB.rnd('rq'+c)*3),kind=O[c],steps=kind==='approved'?3:h;
    const ev=[{type:ACN[0],time:dAgo(14+k%5,k),actor:'شرکت '+c,note:'ارسال بودجه ۱۴۰۶'}];
    for(let i=0;i<steps;i++)ev.push({type:i===2?ACN[3]:ACN[i+1],time:dAgo(11+k%5-i*3,k),actor:ACT[i],note:i===0?'مغایرتی مشاهده نشد.':''});
    const st=kind==='approved'?'تصویب‌شده':kind==='rejected'?'بازگشت برای اصلاح':REV[h];
    if(kind==='rejected')ev.push({type:'رد و بازگشت به شرکت',time:dAgo(4,k),actor:ACT[h],note:'مستند مفروضات بودجه تکمیل و دوباره ارسال شود.'});
    return {id:9000+k,company:c,name:'بودجه ۱۴۰۶',source:'فرم‌ها',sentAt:ev[0].time,docs:[],message:'',status:st,events:ev};
  });
  save();
}
if(!S.hacts||S.hactsV!==2){
  const O={'دانا':'review','تیپاکس':'approved','اکتیران':'approved','مهان‌پوش':'approved','خوگر':'rejected','تی‌هاب':'review','جابار':'review','تی‌نکست':'review','تی‌اکسپرس':'review','پرسیت':'approved'};
  const REV=['در بررسی کارشناس','در بررسی مدیر مالی','در انتظار هیئت‌مدیره'],ACT=['کارشناس مالی هلدینگ','مدیر مالی هلدینگ','هیئت‌مدیره هلدینگ'],ACN=['ارسال عملکرد به معاونت مالی هلدینگ','تأیید و ارجاع به مدیر مالی هلدینگ','تأیید و ارجاع به هیئت‌مدیره هلدینگ','تصویب نهایی'],QS=['بهار','تابستان'];
  S.hacts=[];
  Object.keys(O).forEach((c,k)=>QS.forEach((qn,q)=>{
    const h=Math.floor(HB.rnd('ac'+c+q)*3),kind=q===0?(O[c]==='rejected'?'rejected':'approved'):O[c],steps=kind==='approved'?3:h,base=q===0?40:12;
    const ev=[{type:ACN[0],time:dAgo(base+k%4,k),actor:'شرکت '+c,note:'عملکرد '+qn+' ۱۴۰۵'}];
    for(let i=0;i<steps;i++)ev.push({type:i===2?ACN[3]:ACN[i+1],time:dAgo(base-2-i*2+k%3,k),actor:ACT[i],note:''});
    if(kind==='rejected')ev.push({type:'رد و بازگشت به شرکت',time:dAgo(base-8,k),actor:ACT[h],note:'ارقام '+qn+' با گزارش راهکاران مطابقت ندارد؛ اصلاح و دوباره ارسال شود.'});
    S.hacts.push({id:9500+k*2+q,kind:'act',q,company:c,name:'عملکرد ۱۴۰۵ ('+qn+')',source:'اکسل',sentAt:ev[0].time,docs:[],message:'',status:kind==='approved'?'تصویب‌شده':kind==='rejected'?'بازگشت برای اصلاح':REV[h],events:ev});
  }));
  S.hactsV=2;save();
}
const allReqs=()=>[...live().filter(x=>x.sentAt).map(x=>(x.company?x:Object.assign(x,{company:'دانا'}))),...S.hreqs,...S.hacts];
const rowsOf=x=>x.rows||(x._r=x._r||(()=>{const r={};FORMS.forEach(f=>r[f]=HB.fieldNames(f).map(n=>({name:n,values:x.kind==='act'?HB.act(x.company,f,n).map((v,m)=>Math.floor(m/3)===x.q?Math.round(v*.85):null):HB.bud(x.company,1406,f,n)})));return r})());
const stageOf=x=>x.status==='بازگشت برای اصلاح'?'نزد شرکت':IDX[x.status]>=4?'پایان':STAGES[IDX[x.status]];
const mine=x=>x.status===HROLE[S.role||'expert'][1];
S.hf=S.hf||'همه';S.hst=S.hst||'همه';
window.hrSet=(k,v)=>{S[k]=v;save();render()};
function reqTable(list,withAct){
  return `<div class="tablewrap"><table><thead><tr><th>شرکت</th><th>درخواست</th><th>تاریخ ارسال</th><th>مرحله فعلی</th><th>وضعیت</th><th></th></tr></thead><tbody>${list.length?list.map(x=>`<tr><td><b>${esc(x.company)}</b></td><td>${esc(x.name)}</td><td>${esc(x.sentAt||'—')}</td><td>${esc(stageOf(x))}</td><td><span class="badge ${statusCls(x.status)}">${esc(statusLabel(x.status,x))}</span></td><td><button class="btn ${withAct?'primary':''}" onclick="hrOpen(${x.id})">${withAct?'بررسی و اقدام':'مشاهده'}</button> <button class="btn" onclick="hrHist(${x.id})">تاریخچه</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">موردی وجود ندارد.</td></tr>'}</tbody></table></div>`;
}
function hPage(kind){
  const act=kind==='act',role=HROLE[S.role||'expert'],all=allReqs().filter(x=>(x.kind||'bud')===kind),todo=all.filter(mine);
  const cos=[...new Set(all.map(x=>x.company))],sts=['در بررسی کارشناس','در بررسی مدیر مالی','در انتظار هیئت‌مدیره','تصویب‌شده','بازگشت برای اصلاح'];
  const f=all.filter(x=>(S.hf==='همه'||x.company===S.hf)&&(S.hst==='همه'||x.status===S.hst));
  return `${heading(act?'درخواست‌های تأیید عملکرد':'درخواست‌های بودجه',act?'بررسی، تأیید یا رد عملکرد فصلی محقق‌شده سال جاری شرکت‌ها':'بررسی، تأیید یا رد بودجه ارسالی شرکت‌ها')}
  <div class="card"><div class="spread"><div><h2>نیازمند اقدام شما</h2><p class="muted small">درخواست‌هایی که اکنون در مرحله «${role[0]}» هستند</p></div><span class="badge ${todo.length?'warn':'good'}">${num(todo.length)} مورد</span></div>${reqTable(todo,true)}</div>
  <div class="card" style="margin-top:18px"><h2>همه درخواست‌های شرکت‌ها</h2><p class="muted small">با هر وضعیتی؛ با فیلتر شرکت می‌توانید وضعیت و تاریخچه درخواست‌های یک شرکت را ببینید.</p>
  <div class="filters" style="align-items:flex-end;margin:10px 0"><div class="field" style="margin:0"><label>شرکت</label><select onchange="hrSet('hf',this.value)"><option>همه</option>${cos.map(c=>`<option ${S.hf===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div><div class="field" style="margin:0"><label>وضعیت</label><select onchange="hrSet('hst',this.value)"><option>همه</option>${sts.map(c=>`<option value="${c}" ${S.hst===c?'selected':''}>${esc(c==='بازگشت برای اصلاح'?'ارجاع‌شده به شرکت':statusLabel(c))}</option>`).join('')}</select></div></div>${reqTable(f,false)}</div>`;
}
window.hrHist=id=>{const x=allReqs().find(y=>y.id===id);if(!x)return;
  modal(`تاریخچه · ${esc(x.company)} · ${esc(x.name)}`,`${chainHtml(x.status)}<div class="tablewrap" style="margin-top:12px"><table><thead><tr><th>تاریخ</th><th>اقدام‌کننده</th><th>اقدام / مرحله</th><th>توضیح</th></tr></thead><tbody>${x.events.map(e=>`<tr><td>${esc(e.time)}</td><td>${esc(e.actor)}</td><td>${esc(e.type)}</td><td style="white-space:normal">${e.note?esc(e.note):'—'}</td></tr>`).join('')}</tbody></table></div>`,`<button class="btn" onclick="closeModal()">بستن</button>`);wide()};
window.hrOpen=id=>{const x=allReqs().find(y=>y.id===id);if(!x)return;
  const rows=rowsOf(x),c=x.kind==='act'?{errors:0,warnings:0,tasks:[]}:budgetCheck(rows),ok=mine(x),role=HROLE[S.role||'expert'],tasks=c.tasks.filter(t=>t.sev);
  modal(`${esc(x.company)} · ${esc(x.name)}`,`<div class="spread"><span class="muted small">ارسال: ${esc(x.sentAt||'—')} · مرحله فعلی: ${esc(stageOf(x))}</span><span class="badge ${statusCls(x.status)}">${esc(statusLabel(x.status,x))}</span></div>${chainHtml(x.status)}
  <div class="grid kpis" style="grid-template-columns:repeat(3,1fr);margin:12px 0"><div class="card kpi" style="min-height:90px"><span class="muted">جمع درآمد</span><div class="value" style="font-size:19px">${R(tot(rows,'درآمد'))}</div></div><div class="card kpi" style="min-height:90px"><span class="muted">جمع هزینه</span><div class="value" style="font-size:19px">${R(tot(rows,'هزینه'))}</div></div><div class="card kpi" style="min-height:90px"><span class="muted">کنترل‌ها</span><div class="value" style="font-size:19px">${c.errors?`<span class="t-bad">${num(c.errors)} خطا</span>`:c.warnings?`${num(c.warnings)} هشدار`:'<span class="t-good">بدون مشکل</span>'}</div></div></div>
  <h3>خطاها و هشدارها</h3>${tasks.length?tasks.map(t=>`<div class="task"><div><b>${esc(t.t)}</b><p>${esc(t.m)}</p></div><span class="badge ${t.sev==='error'?'bad':'warn'}">${t.sev==='error'?'خطا':'هشدار'}</span></div>`).join(''):'<div class="notice" style="background:#e7f5ed;color:#27754c">خطا یا هشداری وجود ندارد.</div>'}
  ${x.message?`<h3 style="margin-top:16px">متن ارسال شرکت</h3><div class="notice" style="white-space:pre-wrap">${esc(x.message)}</div>`:''}
  <h3 style="margin-top:16px">مستندات پیوست</h3><div class="tablewrap"><table><thead><tr><th>نام سند</th><th>نوع</th><th>تاریخ</th></tr></thead><tbody>${(x.docs||[]).length?x.docs.map(d=>`<tr><td>${esc(d.name)}</td><td>${esc(d.type)}</td><td>${esc(d.time)}</td></tr>`).join(''):'<tr><td colspan="3" class="empty">سندی پیوست نشده است.</td></tr>'}</tbody></table></div>
  ${ok?'':`<div class="notice" style="margin-top:12px">این درخواست اکنون در مرحله شما (${role[0]}) نیست؛ فقط مشاهده و دانلود ممکن است.</div>`}`,
  `<button class="btn" onclick="hrDl(${x.id})">خروجی اکسل</button><button class="btn" onclick="hrHist(${x.id})">تاریخچه</button><button class="btn" onclick="closeModal()">بستن</button>${ok?`<button class="btn" onclick="hrRejModal(${x.id})">رد و بازگشت به شرکت</button><button class="btn primary" onclick="hrAdvModal(${x.id})">${x.status==='در انتظار هیئت‌مدیره'?'تأیید و تصویب نهایی':'تأیید و ارجاع مرحله بعد'}</button>`:''}`);wide()};
window.hrDl=id=>{const x=allReqs().find(y=>y.id===id);if(x)dlStore(rowsOf(x),x.entries,'درخواست-'+x.company+'-'+x.name)};
window.hrAdvModal=id=>{const x=allReqs().find(y=>y.id===id),last=x.status==='در انتظار هیئت‌مدیره',c=x.kind==='act'?{warnings:0}:budgetCheck(rowsOf(x));
  modal(last?'تصویب نهایی':'تأیید و ارجاع مرحله بعد',`<p class="muted">${esc(x.company)} · ${esc(x.name)} · مرحله فعلی: ${STAGES[IDX[x.status]]}</p>${c.warnings?`<label class="notice" style="display:flex;gap:8px;background:#fff4da"><input type="checkbox" id="hrOk"><span>${num(c.warnings)} هشدار را بررسی کرده‌ام و تأیید می‌کنم.</span></label>`:''}<div class="field"><label>توضیح (اختیاری)</label><textarea id="evNote" rows="3"></textarea></div><p id="evErr" class="error"></p>`,`<button class="btn" onclick="hrOpen(${id})">انصراف</button><button class="btn primary" onclick="hrAdv(${id},${c.warnings?1:0})">${last?'تصویب نهایی':'تأیید و ارجاع'}</button>`)};
window.hrAdv=(id,w)=>{const x=allReqs().find(y=>y.id===id);if(w&&!$('hrOk').checked){$('evErr').textContent='ابتدا هشدارها را تأیید کنید.';return}
  const i=IDX[x.status],nx=NEXT[x.status],note=($('evNote').value||'').trim();if(!nx)return;
  ev(x,nx==='تصویب‌شده'?'تصویب نهایی':'تأیید و ارجاع به '+STAGES[i+1],STAGES[i],[note,w?'با تأیید هشدارها':''].filter(Boolean).join(' · '));x.status=nx;sync();closeModal();render()};
window.hrRejModal=id=>{const x=allReqs().find(y=>y.id===id);
  modal('رد و بازگشت به شرکت',`<p class="muted">${esc(x.company)} · ${esc(x.name)} — درخواست مستقیماً برای اصلاح به شرکت برمی‌گردد.</p><div class="field"><label>شرح رد *</label><textarea id="evNote" rows="4" placeholder="توضیح دهید چه چیزی باید اصلاح شود"></textarea></div><div class="field"><label>پیوست فایل (اختیاری)</label><input type="file" id="evFiles" multiple></div><p id="evErr" class="error"></p>`,`<button class="btn" onclick="hrOpen(${id})">انصراف</button><button class="btn primary" onclick="hrRej(${id})">ثبت رد</button>`)};
window.hrRej=id=>{const x=allReqs().find(y=>y.id===id),note=($('evNote').value||'').trim();if(!note){$('evErr').textContent='شرح رد الزامی است.';return}
  const fl=[...($('evFiles').files||[])].map(f=>f.name);
  ev(x,'رد و بازگشت به شرکت',STAGES[IDX[x.status]],note+(fl.length?' · پیوست: '+fl.join('، '):''));x.events[x.events.length-1].files=fl;x.status='بازگشت برای اصلاح';sync();closeModal();render()};

/* ---------- پنجره انتخاب پیش‌نویس برای ارسال ---------- */
let SP=null;
const spDraft=()=>S.drafts.find(x=>x.id===SP.id);
window.spOpen=id=>{SP={id,ok:false};renderSP()};
function spState(){const d=spDraft(),c=budgetCheck(d.rows);return {d,c,blocked:subBlocked()}}
function renderSP(){
  const {d,c,blocked}=spState(),docs=d.docs||[];
  modal(`ارسال پیش‌نویس «${esc(d.name)}»`,`<p class="muted small">منبع: ${esc(d.source)} · ${esc(d.created)} · فرم‌ها: ${(d.forms||FORMS).length===3?'همه':esc((d.forms||FORMS).join('، '))}</p>
  <div class="grid kpis" style="grid-template-columns:repeat(3,1fr);margin:12px 0"><div class="card kpi" style="min-height:90px"><span class="muted">جمع درآمد</span><div class="value" style="font-size:19px">${R(draftTot(d,'درآمد'))}</div></div><div class="card kpi" style="min-height:90px"><span class="muted">جمع هزینه</span><div class="value" style="font-size:19px">${R(draftTot(d,'هزینه'))}</div></div><div class="card kpi" style="min-height:90px"><span class="muted">کنترل‌ها</span><div class="value" style="font-size:19px">${c.errors?`<span class="t-bad">${num(c.errors)} خطا</span>`:c.warnings?`${num(c.warnings)} هشدار`:'<span class="t-good">بدون مشکل</span>'}</div></div></div>
  ${c.tasks.filter(x=>x.sev).map(x=>`<div class="task"><div><b>${esc(x.t)}</b><p>${esc(x.m)}</p></div><span class="badge ${x.sev==='error'?'bad':'warn'}">${x.sev==='error'?'مانع ارسال':'هشدار'}</span></div>`).join('')}
  ${blocked?'<div class="notice" style="margin-top:10px;background:#fff4da">یک درخواست در حال بررسی هلدینگ دارید؛ تا پایان بررسی، ارسال جدید ممکن نیست.</div>':''}
  ${!c.errors&&c.warnings?`<label class="notice" style="margin-top:10px;display:flex;gap:8px;align-items:flex-start;background:#fff4da"><input type="checkbox" ${SP.ok?'checked':''} onchange="spOk(this.checked)"><span>هشدارها را بررسی کرده‌ام و ارسال را تأیید می‌کنم.</span></label>`:''}
  <h3 style="margin-top:20px">مستندات پیوست</h3>
  <div class="tablewrap"><table><thead><tr><th>نام سند</th><th>نوع</th><th>تاریخ</th><th>اندازه</th><th></th></tr></thead><tbody>${docs.length?docs.map((x,i)=>`<tr><td>${esc(x.name)}</td><td>${esc(x.type)}</td><td>${esc(x.time)}</td><td>${esc(x.size)}</td><td><button class="btn link" onclick="spDocDel(${i})">حذف</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">سندی پیوست نشده است.</td></tr>'}</tbody></table></div>
  <div class="filters" style="align-items:flex-end;margin-top:10px"><div class="field" style="margin:0"><label>نوع سند</label><select id="spT"><option>صورت‌جلسه تصویب داخلی</option><option>صورت‌جلسه هیئت‌مدیره شرکت</option><option>مستند مفروضات بودجه</option><option>سایر</option></select></div><div class="field" style="margin:0"><label>فایل</label><input type="file" id="spF"></div><button class="btn" onclick="spAttach()">پیوست</button></div>
  <p id="spErr" class="error"></p><p class="muted small">در این نمونه فقط نام و مشخصات سند ذخیره می‌شود.</p>
  <div class="field"><label>متن ارسال برای معاونت مالی هلدینگ</label><textarea id="spMsg" rows="3" placeholder="توضیحی که همراه درخواست دیده می‌شود" onchange="spMsgSave()">${esc(d.msg||'')}</textarea></div>`,
  `<button class="btn" onclick="spDel()">حذف پیش‌نویس</button><button class="btn" onclick="spDl()">دانلود اکسل</button>${SP.from==='list'?'<button class="btn" onclick="spMsgSave();reqNewList()">بازگشت به فهرست</button>':''}<button class="btn" onclick="closeModal()">بستن</button><button id="spGo" class="btn primary" disabled onclick="spSend()">ارسال به معاونت مالی هلدینگ فاخر</button>`);
  wide();spBtn();
}
function spBtn(){const b=document.getElementById('spGo');if(!b||!SP)return;const {c,blocked}=spState();b.disabled=!!c.errors||blocked||(c.warnings>0&&!SP.ok)}
window.spOk=c=>{SP.ok=c;spBtn()};
window.spMsgSave=()=>{const d=spDraft(),t=$('spMsg');if(d&&t){d.msg=t.value;save()}};
window.spAttach=()=>{
  const f=$('spF').files[0],d=spDraft();if(!f){$('spErr').textContent='فایل را انتخاب کنید.';return}
  spMsgSave();
  const kb=f.size/1024;(d.docs=d.docs||[]).push({name:f.name,type:$('spT').value,time:now(),size:kb>=1024?(kb/1024).toFixed(1)+' مگابایت':Math.max(1,Math.round(kb))+' کیلوبایت'});
  save();renderSP();render();
};
window.spDocDel=i=>{const d=spDraft();if(!d||!d.docs)return;spMsgSave();d.docs.splice(i,1);save();renderSP();render()};
window.spDl=()=>{const d=spDraft();if(d)dlStore(d.rows,d.entries,'پیش‌نویس-'+d.name)};
window.spDel=()=>{const d=spDraft();if(!d)return;cfm('حذف پیش‌نویس',`پیش‌نویس «${d.name}» حذف شود؟`,()=>{S.drafts.splice(S.drafts.indexOf(d),1);save();SP=null;closeModal();render()},renderSP)};
window.spSend=()=>{
  const b=document.getElementById('spGo');if(!b||b.disabled)return;
  spMsgSave();const {d,c}=spState();
  createSubmission(d.rows,{name:d.name,source:d.source,entries:d.entries,docs:d.docs||[],message:(d.msg||'').trim(),note:c.warnings?`${num(c.warnings)} هشدار با تأیید کاربر`:''});
  SP=null;S.reqNew=false;save();closeModal();render();
};

const ev=(s,type,actor,note)=>s.events.push({type,time:now(),actor,note:note||''});
window.subAdvModal=()=>{const c=cur(),last=c.status==='در انتظار هیئت‌مدیره';modal(last?'تصویب نهایی':'تأیید و ارجاع مرحله بعد',`<p class="muted">${esc(c.name)} · مرحله فعلی: ${STAGES[IDX[c.status]]}</p><div class="field"><label>واکنش یا توضیح (اختیاری)</label><textarea id="evNote" rows="3" placeholder="در تاریخچه برای شرکت نمایش داده می‌شود"></textarea></div>`,`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn primary" onclick="subAdv()">${last?'تصویب نهایی':'تأیید و ارجاع'}</button>`)};
window.subAdv=()=>{const c=cur(),i=IDX[c.status],nx=NEXT[c.status],note=($('evNote').value||'').trim();if(!nx)return;
  ev(c,nx==='تصویب‌شده'?'تصویب نهایی':'تأیید و ارجاع به '+STAGES[i+1],STAGES[i],note);c.status=nx;sync();closeModal();render()};
window.subRejModal=()=>modal('بازگشت برای اصلاح',`<p class="muted">برچسب علت و توضیح قابل اقدام برای شرکت ثبت کنید.</p><div class="field"><label>علت بازگشت</label><select id="evTag"><option>نیاز به مستندات</option><option>اصلاح مبلغ</option><option>عدم انطباق با سیاست</option><option>ابهام در مفروضات</option><option>سایر</option></select></div><div class="field"><label>توضیح اصلاح *</label><textarea id="evNote" rows="3" placeholder="توضیح دهید چه چیزی باید اصلاح شود"></textarea></div><p id="evErr" class="error"></p>`,`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn primary" onclick="subRej()">ثبت بازگشت</button>`);
window.subRej=()=>{const c=cur(),i=IDX[c.status],note=($('evNote').value||'').trim();if(!note){$('evErr').textContent='توضیح اصلاح الزامی است.';return}
  ev(c,'بازگشت برای اصلاح · '+$('evTag').value,STAGES[i],note);c.status='بازگشت برای اصلاح';sync();closeModal();render()};

/* ---------- پیش‌نویس‌ها در پیش‌بینی بودجه ---------- */
const tot=(rows,f)=>sum((rows[f]||[]).map(r=>sum(r.values)));
function draftsCard(){
  return `<div class="card" style="margin-top:18px"><div class="spread"><div><h2>پیش‌نویس‌ها</h2><p class="muted small">پیش‌نویس‌های ذخیره‌شده از فرم‌ها یا فایل اکسل · با «مشاهده جزئیات»، پیش‌نویس در یک پنجره باز می‌شود. ارسال برای هلدینگ از ماژول «درخواست‌های بودجه» انجام می‌شود.</p></div></div>
  <div class="tablewrap"><table><thead><tr><th>نام</th><th>تاریخ</th><th>منبع</th><th>فرم‌ها</th><th>ردیف‌ها</th><th>جمع درآمد</th><th>جمع هزینه</th><th>عملیات</th></tr></thead><tbody>${S.drafts.length?S.drafts.map((d,i)=>`<tr><td>${esc(d.name)}</td><td>${esc(d.created)}</td><td>${esc(d.source)}</td><td>${(d.forms||FORMS).length===3?'همه':esc((d.forms||FORMS).join('، '))}</td><td>${num(FORMS.reduce((a,f)=>a+(d.rows[f]||[]).length,0))}</td><td>${R(tot(d.rows,'درآمد'))}</td><td>${R(tot(d.rows,'هزینه'))}</td><td><button class="btn" onclick="draftView(${i})">مشاهده جزئیات</button></td></tr>`).join(''):'<tr><td colspan="8" class="empty">پیش‌نویسی ذخیره نشده است. با «ذخیره پیش‌نویس» یا ورود از اکسل بسازید.</td></tr>'}</tbody></table></div></div>`;
}
const QN=['بهار','تابستان','پاییز','زمستان'];
const DEFN={'درآمد':[],'هزینه':['حقوق و مزایای پرسنل','هزینه عمومی و اداری','بهای تمام‌شده خدمات'],'نقدینگی':['دریافت نقدی از مشتریان','پرداخت نقدی حقوق و هزینه‌ها']};
/* درآمد: هر «کالا / خدمت» دو ردیف دارد: درآمد خدمات به شرکت‌های گروه و درآمد خدمات خارج از گروه (نام ردیف = کالا/خدمت + پسوند) */
const SG=' · درآمد خدمات به شرکت‌های گروه',SO=' · درآمد خدمات خارج از گروه',isInc=f=>f==='درآمد',NL=()=>Array(12).fill(null);
function splitInc(name){
  if(name.endsWith(SG))return {item:name.slice(0,-SG.length),b:'g'};
  if(name.endsWith(SO))return {item:name.slice(0,-SO.length),b:'o'};
  return {item:name,b:/خارج از گروه|سایر شرکت/.test(name)?'o':'g'};
}
function itemsOfRows(rows,f){
  if(!isInc(f))return (rows[f]||[]).map(r=>r.name);
  const s=[];(rows[f]||[]).forEach(r=>{const it=splitInc(r.name).item;if(!s.includes(it))s.push(it)});return s;
}
function itemRow(rows,f,item,b){return (rows[f]||[]).find(r=>{const x=splitInc(r.name);return x.item===item&&x.b===b})}
let ST=S;
const itemsOf=(f,st=ST)=>itemsOfRows(st.rows,f);
const typesOf=(f,st=ST)=>isInc(f)?itemsOf(f,st):[...new Set([...DEFN[f],...itemsOf(f,st)])];
const tLabel=f=>isInc(f)?'کالا / خدمت':'نوع / سرفصل';
function itemVals(f,item,st=ST){
  if(!isInc(f)){const r=st.rows[f].find(x=>x.name===item);return r?r.values:NL()}
  const g=itemRow(st.rows,f,item,'g'),o=itemRow(st.rows,f,item,'o');
  return months.map((_,m)=>{const a=g?g.values[m]:null,b=o?o.values[m]:null;return a==null&&b==null?null:(a||0)+(b||0)});
}
function itemSrc(f,item,st){const r=isInc(f)?(itemRow(st.rows,f,item,'g')||itemRow(st.rows,f,item,'o')):st.rows[f].find(x=>x.name===item);return (r&&r.src)||'دستی'}
window.fcls=f=>({'درآمد':'f-inc','هزینه':'f-exp','نقدینگی':'f-cash'})[f]||'';
S.entries=S.entries||{};

/* هر نوع/سرفصل می‌تواند چند ردیف (با مقادیر و شرح جدا) داشته باشد؛
   ردیف اصلی در S.rows جمع ماه‌به‌ماه همین ردیف‌هاست تا بقیه سامانه بدون تغییر کار کند. */
const aggE=(E,k='values')=>months.map((_,m)=>{const xs=E.map(e=>(e[k]||[])[m]).filter(v=>v!=null);return xs.length?sum(xs):null});
const nv=v=>v==null?null:Number(v);
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>nv(v)===nv(b[i]));
function getEntries(f,n,st=ST){return entriesFor(st.rows,st.entries,f,n)}
function setEntries(f,n,E,st=ST){
  (st.entries[f]=st.entries[f]||{})[n]=E;
  if(isInc(f)){
    [['g',SG,'values'],['o',SO,'values2']].forEach(([b,suf,k])=>{
      let row=itemRow(st.rows,f,n,b);const vals=aggE(E,k);
      if(!row){row={name:n+suf,values:vals};st.rows[f].push(row)}else row.values=vals;
      delete row.note;if(st.actual)row.src='دستی';
    });
  }else{
    let row=st.rows[f].find(r=>r.name===n);const vals=aggE(E);
    if(!row){row={name:n,values:vals};st.rows[f].push(row)}else row.values=vals;
    delete row.note;
    if(!E.length&&DEFN[f].includes(n))st.rows[f].splice(st.rows[f].indexOf(row),1);
    if(st.actual)row.src='دستی';
  }
  if(st!==S)st.dirty=true;
  save();
}
const qsum=v=>[0,1,2,3].map(q=>sum(v.slice(q*3,q*3+3)));
const REV='بررسی';
const tabsHtml=f=>`<div class="tabs">${FORMS.map(x=>`<button class="${f===x?'active':''}" onclick="set('form','${x}')">${x}</button>`).join('')}<button class="${f===REV?'active':''}" onclick="set('form','${REV}')">بررسی نهایی و ثبت</button></div>`;
function typeTable(f,st,openFn,withSrc){
  const inc=isInc(f),items=itemsOf(f,st),nc=(inc?10:8)+(withSrc?1:0);
  const V=n=>itemVals(f,n,st).map(x=>x||0),gs=(n,b)=>{const r=itemRow(st.rows,f,n,b);return r?sum(r.values):0};
  const tm=months.map((_,m)=>sum(items.map(n=>V(n)[m])));
  const head=`<tr><th>${tLabel(f)}</th><th>تعداد ردیف</th>${QN.map(q=>`<th>${q}</th>`).join('')}${inc?'<th>به شرکت‌های گروه</th><th>خارج از گروه</th>':''}<th>جمع سال</th>${withSrc?'<th>منبع</th>':''}<th>عملیات</th></tr>`;
  const rows=items.map((n,i)=>`<tr><td>${esc(n)}</td><td>${num(getEntries(f,n,st).length)}</td>${qsum(V(n)).map(v=>`<td>${num(v)}</td>`).join('')}${inc?`<td>${num(gs(n,'g'))}</td><td>${num(gs(n,'o'))}</td>`:''}<td><b>${num(sum(V(n)))}</b></td>${withSrc?`<td><span class="badge">${esc(itemSrc(f,n,st))}</span></td>`:''}<td><button class="btn" onclick="${openFn}('${f}',${i})">مشاهده و ویرایش جزئیات</button></td></tr>`).join('');
  const totRow=f==='نقدینگی'?'':`<tr style="font-weight:bold"><td colspan="2">جمع ${f}</td>${qsum(tm).map(v=>`<td>${num(v)}</td>`).join('')}${inc?`<td>${num(sum(items.map(n=>gs(n,'g'))))}</td><td>${num(sum(items.map(n=>gs(n,'o'))))}</td>`:''}<td>${num(sum(tm))}</td>${withSrc?'<td></td>':''}<td></td></tr>`;
  return `<div class="tablewrap" style="margin-top:20px"><table><thead>${head}</thead><tbody>${items.length?rows+totRow:`<tr><td colspan="${nc}" class="empty">هنوز چیزی ثبت نشده است. ${isInc(f)?'یک کالا / خدمت تعریف کنید.':'یک نوع یا سرفصل را انتخاب کنید.'}</td></tr>`}</tbody></table></div>`;
}
const typePick=(f,st,fn)=>`<div class="field" style="margin:0;min-width:280px"><label>${tLabel(f)}${isInc(f)?' (شرح)':''}</label><select onchange="${fn}(this)"><option value="">انتخاب کنید</option>${typesOf(f,st).map(n=>{const c=getEntries(f,n,st).length;return `<option value="${esc(n)}">${esc(n)}${c?' ✓':''}</option>`}).join('')}</select></div>`;
const newTypeLabel=f=>isInc(f)?'＋ تعریف کالا / خدمت جدید':'＋ تعریف نوع / سرفصل جدید';
const typeHelp=f=>isInc(f)?'ابتدا یک کالا یا خدمت (شرح) تعریف کنید؛ سپس درآمد خدمات به شرکت‌های گروه و درآمد خدمات خارج از گروه را به تفکیک ماه وارد کنید. هر کالا / خدمت می‌تواند چند ردیف با شرح‌های مختلف داشته باشد.':'یکی از انواع و سرفصل‌ها را انتخاب کنید تا ردیف‌های آن و جدول ماهانه‌شان باز شود. هر نوع می‌تواند چند ردیف با شرح‌های مختلف داشته باشد.';
function budgetPage(){
  const f=S.form;
  if(f===REV)return `${heading('پیش‌بینی بودجه دانا','ورود ماهانه · سال مالی ۱۴۰۶ · واحد: میلیون ریال')}<div class="card f-rev">${tabsHtml(f)}${reviewHtml()}</div>`;
  return `${heading('پیش‌بینی بودجه دانا','ورود ماهانه · سال مالی ۱۴۰۶ · واحد: میلیون ریال')}
  <div class="card ${fcls(f)}">${tabsHtml(f)}
  <div class="spread"><div><h2>ثبت ${f} ماهانه</h2><p class="muted small">${typeHelp(f)}</p></div><div class="row" style="gap:10px;align-items:center"><button class="btn" onclick="importModal('budget','${f}')">ورود ${f} از اکسل</button><span class="badge">${S.status}</span></div></div>
  <div class="filters" style="align-items:flex-end;margin-top:16px">${typePick(f,S,'gridPick')}<button class="btn" onclick="newTypeMain()">${newTypeLabel(f)}</button></div>
  ${typeTable(f,S,'openMain',false)}
  <p class="muted small" style="margin-top:14px">ماه‌های ثبت‌نشده خالی می‌مانند. جمع هر ${isInc(f)?'کالا / خدمت':'نوع'}، مجموع ردیف‌های آن است. نقدینگی فقط دریافت و پرداخت نقدی دوره را نشان می‌دهد. ذخیره پیش‌نویس در تب «بررسی نهایی و ثبت» است.</p></div>`;
}

/* ---------- تب بررسی نهایی و ثبت: صورت سود و زیان محاسبه‌شده از تب‌ها ---------- */
const z12=()=>Array(12).fill(0);
const addv=(a,b)=>a.map((v,i)=>v+(Number(b[i])||0));
const subv=(a,b)=>a.map((v,i)=>v-b[i]);
function stmtBuckets(rows){
  const Bk={};const add=(k,v)=>{Bk[k]=addv(Bk[k]||z12(),v)};
  (rows['درآمد']||[]).forEach(r=>{const n=r.name;
    add(/خارج از گروه|سایر شرکت/.test(n)?'inc2':/غیر[\s‌]*عملیاتی/.test(n)?'incNon':/گروه/.test(n)?'inc1':'incOth',r.values)});
  (rows['هزینه']||[]).forEach(r=>{const n=r.name;let k;
    if(/بهای تمام/.test(n))k=(/گروه/.test(n)&&!/خارج از گروه|سایر/.test(n))?'cogs1':'cogs2';
    else if(/حقوق|پرسنل|مزایا|نیروی انسانی/.test(n))k='hr';
    else if(/سنوات|ذخیره/.test(n))k='prov';
    else if(/عمومی|اداری/.test(n))k='ga';
    else if(/بازاریابی|تبلیغات/.test(n))k='mkt';
    else if(/استهلاک/.test(n))k='dep';
    else if(/مالیات/.test(n))k='tax';
    else if(/مالی/.test(n))k='fin';
    else k='opx';
    add(k,r.values)});
  return Bk;
}
function statement(rows){
  const b=stmtBuckets(rows),g=k=>b[k]||z12();
  const rev=addv(g('inc1'),g('inc2')),cogs=addv(g('cogs1'),g('cogs2')),gross=subv(rev,cogs);
  const opx=[g('hr'),g('prov'),g('ga'),g('mkt'),g('dep'),g('opx')].reduce(addv,z12());
  const opInc=addv(subv(gross,opx),g('incOth')),preTax=addv(subv(opInc,g('fin')),g('incNon')),net=subv(preTax,g('tax'));
  const H=label=>({t:'head',label}),L=(label,v,sign,n)=>({label,v,t:'line',sign,n}),S_=(label,v)=>({label,v,t:'sum'}),Rz=(label,v,f)=>({label,v,t:'res',f});
  return {rev,cogs,gross,opInc,preTax,net,opx,hr:g('hr'),lines:[
    H('درآمد'),
    L('فروش خالص کالا / درآمد ارائه خدمات به شرکت‌های گروه',g('inc1'),'+',1),
    L('فروش خالص کالا / درآمد ارائه خدمات به سایر شرکت‌ها',g('inc2'),'+',2),
    S_('جمع درآمد فروش کالا / خدمات',rev),
    H('بهای تمام‌شده'),
    L('بهای تمام‌شده کالای فروش‌رفته / دریافت خدمات از شرکت‌های گروه',g('cogs1'),'−',3),
    L('بهای تمام‌شده کالای فروش‌رفته / دریافت خدمات از سایر شرکت‌ها',g('cogs2'),'−',4),
    S_('جمع بهای تمام‌شده کالا / خدمات',cogs),
    Rz('سود / زیان ناخالص',gross,'جمع درآمد − جمع بهای تمام‌شده'),
    H('هزینه‌های عملیاتی'),
    L('هزینه‌های حقوق و مزایای پرسنل',g('hr'),'−',5),
    L('هزینه سنوات پرداخت‌نشده (ذخیره)',g('prov'),'−'),
    L('هزینه‌های عمومی و اداری',g('ga'),'−',6),
    L('هزینه بازاریابی و تبلیغات',g('mkt'),'−',7),
    L('هزینه‌های استهلاک',g('dep'),'−',8),
    L('سایر هزینه‌های عملیاتی',g('opx'),'−',9),
    S_('جمع هزینه‌های عملیاتی',opx),
    L('سایر درآمدهای عملیاتی',g('incOth'),'+',10),
    Rz('سود / زیان عملیاتی',opInc,'سود ناخالص − جمع هزینه‌های عملیاتی + سایر درآمدهای عملیاتی'),
    H('اقلام غیرعملیاتی و مالیات'),
    L('هزینه‌های مالی',g('fin'),'−',11),
    L('سایر درآمدهای غیرعملیاتی',g('incNon'),'+',12),
    Rz('سود / زیان خالص قبل از مالیات',preTax,'سود عملیاتی − هزینه‌های مالی + سایر درآمدهای غیرعملیاتی'),
    L('مالیات سال جاری',g('tax'),'−'),
    Rz('سود / زیان خالص پس از مالیات',net,'سود خالص قبل از مالیات − مالیات سال جاری')]};
}
const nf=v=>`<span class="${v<0?'t-bad':''}">${num(Math.round(v))}</span>`;
function reviewHtml(rowsIn,de){
  const RW=rowsIn||S.rows;
  const st=statement(RW),cost=sum((RW['هزینه']||[]).map(r=>sum(r.values))),hr=sum(st.hr),T=a=>sum(a);
  const cin=[],cout=[];(RW['نقدینگی']||[]).forEach(r=>(r.name.indexOf('پرداخت')===0?cout:cin).push(r.values));
  const ci=cin.reduce(addv,z12()),co=cout.reduce(addv,z12()),cn=subv(ci,co);
  const chk=budgetCheck(RW),blocked=subBlocked(),empty=!Object.values(RW).flat().length;
  const kp=(t,v,s)=>`<div class="card kpi"><span class="muted">${t}</span><div class="value">${v}</div><span class="small muted">${s}</span></div>`;
  const row=(label,v,cls,n,sign,fml)=>`<tr class="${cls==='res'?'stres':cls==='sum'?'stsum':''}"><td style="white-space:normal">${n?`<span class="muted small" style="margin-left:6px">${num(n)}</span>`:''}${sign?`<span class="sgn">${sign}</span>`:''}${label}${fml?`<div class="small muted" style="font-weight:normal">= ${fml}</div>`:''}</td>${qsum(v).map(x=>`<td>${nf(x)}</td>`).join('')}<td><b>${nf(sum(v))}</b></td></tr>`;
  const srow=l=>l.t==='head'?`<tr class="sthead"><td colspan="6">${l.label}</td></tr>`:row(l.label,l.v,l.t,l.n,l.sign,l.f);
  return `<div class="spread"><div><h2>بررسی نهایی و ثبت</h2><p class="muted small">خلاصه‌ی محاسبه‌شده از تب‌های درآمد، هزینه و نقدینگی. ${de?'در این تب می‌توانید اکسل خروجی را دانلود، تغییرات پیش‌نویس را ذخیره یا پیش‌نویس را حذف کنید. ارسال برای هلدینگ از «درخواست‌های بودجه» انجام می‌شود.':'در این تب فقط می‌توانید پیش‌نویس ذخیره کنید؛ ارسال برای هلدینگ از «درخواست‌های بودجه» انجام می‌شود.'}</p></div>${de?'':`<span class="badge">${S.status}</span>`}</div>
  <div class="grid kpis" style="margin-top:14px">${kp('جمع درآمد فروش',nf(T(st.rev)),'میلیون ریال')}${kp('سود / زیان ناخالص',nf(T(st.gross)),T(st.rev)?'حاشیه '+num(Math.round(T(st.gross)/T(st.rev)*100))+'٪':'—')}${kp('سود / زیان عملیاتی',nf(T(st.opInc)),'پیش از هزینه مالی و مالیات')}${kp('سود / زیان خالص پس از مالیات',nf(T(st.net)),'میلیون ریال')}</div>
  <div class="grid kpis">${kp('کل هزینه‌ها',nf(cost),'جمع تب هزینه')}${kp('نسبت هزینه نیروی انسانی',cost?num(Math.round(hr/cost*1000)/10)+'٪':'—','به کل هزینه‌ها')}${kp('خالص جریان نقدی',nf(T(cn)),'دریافت − پرداخت')}<div class="card kpi" style="cursor:pointer" onclick="controlsModal()"><span class="muted">نتیجه کنترل‌ها</span><div class="value">${empty?'<span class="muted">بدون داده</span>':chk.errors?`<span class="t-bad">${num(chk.errors)} خطا</span>`:chk.warnings?`<span>${num(chk.warnings)} هشدار</span>`:'<span class="t-good">بدون مشکل</span>'}</div><span class="small muted">برای مشاهده کلیک کنید</span></div></div>
  <h3 style="margin-top:8px">صورت سود و زیان</h3>
  <div class="tablewrap"><table class="stmt"><thead><tr><th>شرح</th>${QN.map(q=>`<th>${q}</th>`).join('')}<th>جمع سال</th></tr></thead><tbody>${st.lines.map(srow).join('')}</tbody></table></div>
  <h3 style="margin-top:24px">نقدینگی</h3>
  <div class="tablewrap"><table class="stmt"><thead><tr><th>شرح</th>${QN.map(q=>`<th>${q}</th>`).join('')}<th>جمع سال</th></tr></thead><tbody>${row('دریافت نقدی',ci)}${row('پرداخت نقدی',co)}${row('خالص جریان نقدی',cn,'res')}</tbody></table></div>
  <p class="muted small" style="margin-top:10px">ردیف‌ها بر اساس عنوان سرفصل به سطرهای صورت سود و زیان نگاشت می‌شوند؛ سرفصلی که به سطر مشخصی نخورد، در «سایر هزینه‌های عملیاتی» یا «سایر درآمدهای عملیاتی» می‌آید.</p>
  <h3 style="margin-top:24px">کنترل‌ها</h3>
  <div class="actions"><button class="btn" onclick="controlsModal()">مشاهده کنترل‌ها${empty?'':` (${num(chk.errors)} خطا · ${num(chk.warnings)} هشدار)`}</button></div>
  ${de?(DE&&DE.msg?`<div class="notice" style="margin-top:12px;background:#e7f5ed;color:#27754c">${esc(DE.msg)}</div>`:''):`<div class="actions" style="margin-top:20px"><button class="btn primary" onclick="saveDraftModal()">ذخیره پیش‌نویس</button></div>`}`;
}
pages.budget=()=>budgetPage();
pages.drafts=()=>`${heading('پیش‌نویس‌ها','پیش‌نویس‌های بودجه ۱۴۰۶ · مشاهده، ویرایش، دانلود و حذف؛ ارسال برای هلدینگ از «درخواست‌های بودجه»')}${draftsCard().replace('margin-top:18px','margin-top:0')}`;

/* ---------- پاپ‌آپ جزئیات یک نوع/سرفصل ---------- */
let DT=null;
/* تأیید داخل برنامه (به‌جای پنجره‌ی confirm مرورگر که ممکن است مسدود باشد) */
let CF=null;
function cfm(title,msg,yes,back,label){CF={yes,back};modal(title,`<p>${esc(msg)}</p>`,`<button class="btn" onclick="cfNo()">انصراف</button><button class="btn primary" onclick="cfYes()">${label||'حذف'}</button>`)}
window.cfYes=()=>{const c=CF;CF=null;if(c)c.yes()};
window.cfNo=()=>{const c=CF;CF=null;if(c)c.back()};
window.openMain=(f,i)=>{ST=S;openDetail(f,i)};
window.editBudgetRow=i=>openMain(S.form,i);
window.openDetail=(f,i)=>{const n=itemsOf(f,ST)[i];if(n!=null)startDetail(f,n)};
const curForm=()=>ST===S?S.form:ST.actual?S.af:DE.tab;
const faY=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const yl=()=>ST&&ST.actual?'سال '+faY(S.ay):'سال مالی ۱۴۰۶';
window.gridPick=el=>{const v=el.value;el.value='';if(v){ST=S;startDetail(S.form,v)}};
function startDetail(f,n){DT={form:f,name:n,idx:-1};getEntries(f,n).length?renderDetail():detNew()}
const wide=()=>{document.querySelector('#modal .modal').style.width='min(860px,100%)'};
function renderDetail(){
  const {form,name}=DT,E=getEntries(form,name),inc=isInc(form);
  const comb=e=>months.map((_,m)=>(e.values[m]||0)+((e.values2||[])[m]||0)),qs=a=>[0,1,2,3].map(q=>sum(a.slice(q*3,q*3+3)));
  const allC=months.map((_,m)=>sum(E.map(e=>comb(e)[m])));
  const gT=sum(E.map(e=>sum(e.values))),oT=sum(E.map(e=>sum(e.values2||[])));
  modal(`${esc(form)} · ${esc(name)}`,`<p class="muted small">${yl()} · میلیون ریال · هر ردیف مقادیر و شرح جداگانه دارد</p>
  <div class="tablewrap"><table><thead><tr><th>#</th><th>شرح</th>${QN.map(q=>`<th>${q}</th>`).join('')}${inc?'<th>به شرکت‌های گروه</th><th>خارج از گروه</th>':''}<th>جمع سال</th><th>عملیات</th></tr></thead><tbody>${E.length?E.map((e,i)=>`<tr><td>${num(i+1)}</td><td style="white-space:normal;min-width:120px">${esc(e.note||'—')}</td>${qs(comb(e)).map(v=>`<td>${num(v)}</td>`).join('')}${inc?`<td>${num(sum(e.values))}</td><td>${num(sum(e.values2||[]))}</td>`:''}<td><b>${num(sum(comb(e)))}</b></td><td><button class="btn link" onclick="detEdit(${i})">ویرایش</button><button class="btn link" onclick="detDel(${i})">حذف</button></td></tr>`).join('')+`<tr style="font-weight:bold"><td colspan="2">جمع ${esc(name)}</td>${qs(allC).map(v=>`<td>${num(v)}</td>`).join('')}${inc?`<td>${num(gT)}</td><td>${num(oT)}</td>`:''}<td>${num(sum(allC))}</td><td></td></tr>`:`<tr><td colspan="${inc?10:8}" class="empty">ردیفی ثبت نشده است.</td></tr>`}</tbody></table></div>
  <div class="actions" style="justify-content:flex-start;margin-top:14px"><button class="btn primary" onclick="detNew()">＋ ردیف جدید</button></div>`,`<button class="btn" onclick="detClose()">${ST===S||ST.actual?'بستن':'بازگشت به پیش‌نویس'}</button>`);
  wide();
}
window.detClose=()=>{if(ST===S||ST.actual){ST=S;closeModal();render()}else renderDE()};
window.detNew=()=>{DT.idx=-1;renderGrid(NL(),'',NL())};
window.detEdit=i=>{const e=getEntries(DT.form,DT.name)[i];if(!e)return;DT.idx=i;renderGrid(e.values,e.note||'',e.values2||NL())};
window.detBack=()=>{getEntries(DT.form,DT.name).length||DT.idx>=0?renderDetail():detClose()};
function gridBlock(p,v,title){
  const half=h=>{
    const q0=h*2,m0=h*6;
    return `<tr>${[q0,q0+1].map(q=>`<th colspan="3" class="season">${QN[q]}</th>`).join('')}</tr>
    <tr>${months.slice(m0,m0+6).map(m=>`<th>${m}</th>`).join('')}</tr>
    <tr>${months.slice(m0,m0+6).map((m,k)=>`<td><input type="number" step="any" id="${p}m${m0+k}" value="${v[m0+k]==null?'':v[m0+k]}"><div class="fe" id="${p}e${m0+k}"></div></td>`).join('')}</tr>
    <tr class="tot">${[q0,q0+1].map(q=>`<td colspan="3">جمع ${QN[q]}: <b id="${p}s${q}">0</b></td>`).join('')}</tr>`;
  };
  return `${title?`<h3 style="margin:14px 0 6px">${title}</h3>`:''}<div class="tablewrap"><table class="mgrid" oninput="gridTot()"><tbody>${half(0)}${half(1)}<tr class="tot"><td colspan="6">جمع سال${title?' ('+title+')':''}: <b id="${p}y">0</b></td></tr></tbody></table></div>`;
}
function renderGrid(v,note,v2){
  const inc=isInc(DT.form);
  modal(`${esc(DT.form)} · ${esc(DT.name)} · ${DT.idx>=0?'ویرایش ردیف '+num(DT.idx+1):'ردیف جدید'}`,`<p class="muted small">${yl()} · میلیون ریال · ماه‌های خالی، خالی می‌مانند</p>
  ${inc?gridBlock('g',v,'درآمد خدمات به شرکت‌های گروه')+gridBlock('x',v2||NL(),'درآمد خدمات خارج از گروه')+'<div class="tot-line">جمع کل درآمد این ردیف: <b id="cy">0</b></div>':gridBlock('g',v,'')}
  <div class="field"><label>شرح</label><input id="gNote" value="${esc(note)}" placeholder="شرح این ردیف"></div><p id="gErr" class="error"></p>`,
  `<button class="btn" onclick="detBack()">بازگشت</button><button class="btn primary" onclick="detSave()">ثبت</button>`);
  wide();gridTot();
}
window.gridTot=()=>{
  let all=0;
  ['g','x'].forEach(p=>{
    if(!$(p+'m0'))return;
    const g=i=>Number($(p+'m'+i).value)||0;let y=0;
    for(let q=0;q<4;q++){const s=g(q*3)+g(q*3+1)+g(q*3+2);y+=s;$(p+'s'+q).textContent=num(s)}
    $(p+'y').textContent=num(y);all+=y;
    for(let i=0;i<12;i++){const el=$(p+'m'+i),er=$(p+'e'+i);if(!el||!er)continue;const raw=el.value.trim(),neg=raw!==''&&Number(raw)<0;er.textContent=neg?'نمی‌تواند منفی باشد':'';el.classList.toggle('bad',neg)}
  });
  if($('cy'))$('cy').textContent=num(all);
};
function readGrid(p){
  const vals=[];
  for(let j=0;j<12;j++){const raw=$(p+'m'+j).value.trim(),n=Number(raw);if(raw!==''&&(!Number.isFinite(n)||n<0)){$('gErr').textContent='مبلغ '+months[j]+(p==='x'?' (خارج از گروه)':'')+' باید عددی و غیرمنفی باشد.';return null}vals.push(raw===''?null:n)}
  return vals;
}
window.detSave=()=>{
  gridTot();
  const {form,name,idx}=DT,inc=isInc(form);
  const vals=readGrid('g');if(!vals)return;
  const vals2=inc?readGrid('x'):null;if(inc&&!vals2)return;
  if(vals.every(x=>x==null)&&(!inc||vals2.every(x=>x==null))){$('gErr').textContent='حداقل یک مبلغ وارد کنید.';return}
  const E=clone(getEntries(form,name)),e=inc?{values:vals,values2:vals2,note:$('gNote').value.trim()}:{values:vals,note:$('gNote').value.trim()};
  // قاعده: سقف مجموع هزینه حقوق و مزایای پرسنل (خطای مانع)
  if(!ST.actual&&form==='هزینه'&&name.indexOf('حقوق و مزایا')>=0){
    const rule=((S.companyRules&&S.companyRules['دانا'])||[]).find(r=>r.category==='حقوق و مزایا'&&r.max!==''),lim=rule?Number(rule.max):10000;
    const tot=sum(E.filter((_,i)=>i!==idx).map(x=>sum(x.values)))+sum(vals.map(v=>v||0));
    if(tot>=lim){$('gErr').textContent=`مجموع هزینه · ${name} باید کمتر از ${num(lim)} میلیون ریال باشد. مقدار فعلی ${num(Math.round(tot))} میلیون ریال.`;return}
  }
  if(idx>=0)E[idx]=e;else E.push(e);
  setEntries(form,name,E);if(ST===S){S.form=form;render()}else if(ST.actual){S.af=form;render()}renderDetail();
};
window.detDel=i=>{
  const {form,name}=DT;
  cfm('حذف ردیف',`ردیف ${num(i+1)} از «${name}» حذف شود؟`,()=>{const E=clone(getEntries(form,name));E.splice(i,1);setEntries(form,name,E);if(ST===S||ST.actual)render();renderDetail()},renderDetail);
};
window.newTypeMain=()=>{ST=S;newTypeModal()};
window.newTypeModal=()=>{const f=curForm(),inc=isInc(f);modal(`${inc?'تعریف کالا / خدمت جدید':'تعریف نوع / سرفصل جدید'} · ${f}`,`<div class="field"><label>${inc?'شرح کالا / خدمت *':'عنوان نوع / سرفصل *'}</label><input id="ntName" placeholder="${inc?'مثلاً خدمات زیرساخت و سرور':'عنوان سرفصل'}"></div><p id="ntErr" class="error"></p>`,`<button class="btn" onclick="detClose()">انصراف</button><button class="btn primary" onclick="newTypeSave()">تعریف و ورود مبالغ</button>`)};
window.newTypeSave=()=>{
  const n=$('ntName').value.trim(),f=curForm();
  if(!n){$('ntErr').textContent='عنوان الزامی است.';return}
  if(typesOf(f).includes(n)){$('ntErr').textContent='این عنوان قبلاً وجود دارد؛ آن را از فهرست انتخاب کنید.';return}
  setEntries(f,n,[]);if(ST===S||ST.actual)render();DT={form:f,name:n,idx:-1};detNew();
};
window.saveDraftModal=()=>{
  if(!Object.values(S.rows).flat().length){modal('ذخیره پیش‌نویس','<p>فرم‌ها هنوز ردیفی ندارند؛ ابتدا اطلاعات بودجه را وارد کنید.</p>','<button class="btn" onclick="closeModal()">بستن</button>');return}
  modal('ذخیره پیش‌نویس',`<p class="muted">اطلاعات فرم‌های فعلی به‌عنوان پیش‌نویس ذخیره می‌شود. پس از ذخیره، فرم‌ها خالی می‌شوند و پیش‌نویس در بخش «پیش‌نویس‌ها» می‌ماند؛ با «مشاهده جزئیات» می‌توانید آن را ببینید، ویرایش کنید و ارسال کنید.</p><div class="field"><label>نام پیش‌نویس *</label><input id="dName" value="پیش‌نویس ${num(S.drafts.length+1)}"></div><p id="dErr" class="error"></p>`,`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn primary" onclick="saveDraft()">ذخیره</button>`);
};
window.clearForms=()=>{S.rows={'درآمد':[],'هزینه':[],'نقدینگی':[]};S.entries={};S.form='درآمد';save()};
window.saveDraft=()=>{const n=$('dName').value.trim();if(!n){$('dErr').textContent='نام پیش‌نویس الزامی است.';return}const ent={};FORMS.forEach(f=>{ent[f]={};itemsOf(f,S).forEach(n=>ent[f][n]=clone(getEntries(f,n,S)))});createDraft(n,'فرم‌ها',S.rows,{forms:FORMS.slice(),entries:ent});clearForms();closeModal();render()};
window.controlsModal=()=>{
  const rows=ST.rows,empty=!Object.values(rows).flat().length,c=empty?null:budgetCheck(rows);
  modal('کنترل‌های بودجه',empty?'<p class="muted">هنوز اطلاعاتی ثبت نشده است؛ پس از ثبت اطلاعات، نتیجه‌ی کنترل‌ها اینجا نمایش داده می‌شود.</p>'
    :`<p class="muted">بر اساس قواعد بودجه‌ریزی شرکت</p><div class="row" style="margin-bottom:8px"><span class="badge ${c.errors?'bad':'good'}">${num(c.errors)} خطا</span><span class="badge ${c.warnings?'warn':'good'}">${num(c.warnings)} هشدار</span></div>${c.tasks.filter(x=>x.sev).length?[...c.tasks].filter(x=>x.sev).sort((a,b)=>({error:0,warning:1})[a.sev]-({error:0,warning:1})[b.sev]||0).map(x=>`<div class="task"><div><b>${esc(x.t)}${x.sample?' <span class="badge">نمونه</span>':''}</b><p>${esc(x.m)}</p></div><span class="badge ${x.sev==='error'?'bad':'warn'}">${x.sev==='error'?'خطا · مانع ارسال':'هشدار'}</span></div>`).join(''):'<div class="notice" style="background:#e7f5ed;color:#27754c">خطا یا هشداری وجود ندارد.</div>'}`,
    `<button class="btn primary" onclick="detClose()">${ST===S||ST.actual?'بستن':'بازگشت به پیش‌نویس'}</button>`);
};
let DE=null;
window.draftView=i=>{
  const d=S.drafts[i];if(!d)return;
  const rows=clone(d.rows);FORMS.forEach(f=>rows[f]=rows[f]||[]);
  const ent={};FORMS.forEach(f=>ent[f]=d.entries&&d.entries[f]?clone(d.entries[f]):{});
  DE={id:d.id,name:d.name,tab:(d.forms&&d.forms.length===1)?d.forms[0]:'درآمد',rows,entries:ent,dirty:false,msg:''};
  ST=DE;renderDE();
};
window.deTab=t=>{DE.tab=t;DE.msg='';renderDE()};
function renderDE(){
  const f=DE.tab,rev=f===REV,rows=DE.rows[f]||[];
  const tabs=`<div class="tabs">${FORMS.map(x=>`<button class="${f===x?'active':''}" onclick="deTab('${x}')">${x}</button>`).join('')}<button class="${rev?'active':''}" onclick="deTab('${REV}')">بررسی نهایی و ثبت</button></div>`;
  let body;
  if(rev)body=`<div class="card f-rev" style="margin:0">${tabs}${reviewHtml(DE.rows,true)}</div>`;
  else{
    body=`<div class="card ${fcls(f)}" style="margin:0">${tabs}
    <div class="spread"><div><h2>${f}</h2><p class="muted small">${typeHelp(f)} تغییرات پس از «ذخیره تغییرات پیش‌نویس» در تب بررسی نهایی و ثبت اعمال می‌شود.</p></div></div>
    <div class="filters" style="align-items:flex-end;margin-top:12px">${typePick(f,DE,'deGridPick')}<button class="btn" onclick="newTypeModal()">${newTypeLabel(f)}</button></div>
    ${typeTable(f,DE,'openDetail',false)}</div>`;
  }
  const foot=rev?`<button class="btn" onclick="deDel()">حذف پیش‌نویس</button><button class="btn" onclick="deDl()">دانلود اکسل</button><button class="btn" onclick="deClose()">بستن</button><button class="btn primary" onclick="deSave()">ذخیره تغییرات پیش‌نویس</button>`:`<button class="btn" onclick="deClose()">بستن</button>`;
  modal(`پیش‌نویس «${esc(DE.name)}»${DE.dirty?' · تغییرات ذخیره‌نشده':''}`,body,foot);
  wide();
}
window.deGridPick=el=>{const v=el.value;el.value='';if(v){ST=DE;startDetail(DE.tab,v)}};
function deApply(){
  const d=S.drafts.find(x=>x.id===DE.id);if(!d)return null;
  d.rows=clone(DE.rows);d.entries=clone(DE.entries);
  d.forms=FORMS.filter(f=>(d.forms||FORMS).includes(f)||DE.rows[f].length);
  DE.dirty=false;save();return d;
}
window.deSave=()=>{if(deApply()){DE.msg='تغییرات پیش‌نویس ذخیره شد.';renderDE();render()}};
window.deClose=()=>closeModal();
const _closeModal=window.closeModal;
window.closeModal=()=>{
  if(DE){if(DE.dirty){cfm('بستن بدون ذخیره','تغییرات ذخیره‌نشده پیش‌نویس از بین می‌رود. پنجره بسته شود؟',()=>{ST=S;DE=null;_closeModal();render()},renderDE,'بستن بدون ذخیره');return}ST=S;DE=null;_closeModal();render();return}
  _closeModal();
};
window.deDl=()=>dlStore(DE.rows,DE.entries,'پیش‌نویس-'+DE.name);
window.deDel=()=>{cfm('حذف پیش‌نویس',`پیش‌نویس «${DE.name}» حذف شود؟`,()=>{const k=S.drafts.findIndex(x=>x.id===DE.id);if(k>=0)S.drafts.splice(k,1);ST=S;DE=null;save();_closeModal();render()},renderDE)};
window.deSend=()=>{const d=deApply();if(!d)return;const rows=clone(DE.rows),meta={name:d.name,source:d.source,note:`ایجاد از پیش‌نویس «${d.name}»`};ST=S;DE=null;render();sendCheckModal(rows,meta)};
window.draftOpenModal=i=>{const d=S.drafts[i];if(!d)return;modal('بازکردن پیش‌نویس',`<p>${(d.forms||FORMS).length===3?'همه‌ی فرم‌ها':'فرم '+(d.forms||FORMS).join('، ')} با محتوای «${esc(d.name)}» جایگزین می‌شود. اگر اطلاعات فعلی را می‌خواهید، ابتدا «ذخیره پیش‌نویس» بزنید.</p>`,`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn primary" onclick="draftOpen(${i})">بازکردن</button>`)};
window.draftOpen=i=>{const d=S.drafts[i];if(!d)return;const r=clone(d.rows);(d.forms||FORMS).forEach(f=>{S.rows[f]=r[f]||[];S.entries[f]=d.entries&&d.entries[f]?clone(d.entries[f]):{}});save();closeModal();render()};
window.draftSend=i=>{const d=S.drafts[i];if(d)sendCheckModal(d.rows,{name:d.name,source:d.source,note:`ایجاد از پیش‌نویس «${d.name}»`})};
window.draftDel=i=>{const d=S.drafts[i];if(d)cfm('حذف پیش‌نویس',`پیش‌نویس «${d.name}» حذف شود؟`,()=>{S.drafts.splice(i,1);save();_closeModal();render()},()=>_closeModal())};

/* ---------- ایجاد عملکرد جدید: همان رابط پیش‌بینی بودجه ---------- */
S.actEntries=S.actEntries||{};
function actStore(){
  const y=S.ay,d=(S.actData=S.actData||{})[y]=(S.actData[y]||{});FORMS.forEach(f=>d[f]=d[f]||[]);
  const e=S.actEntries[y]=S.actEntries[y]||{};FORMS.forEach(f=>e[f]=e[f]||{});
  return {actual:true,rows:d,entries:e};
}
window.openAct=(f,i)=>{ST=actStore();openDetail(f,i)};
window.gridPickA=el=>{const v=el.value;el.value='';if(v){ST=actStore();startDetail(S.af,v)}};
window.newTypeAct=()=>{ST=actStore();newTypeModal()};
pages.actual=()=>{
  const st=actStore(),y=S.ay,f=S.af,rows=st.rows[f];
  const filled=months.map((_,i)=>rows.some(r=>r.values[i]!=null)).filter(Boolean).length;
  return `${heading('ایجاد عملکرد جدید','ثبت عملکرد محقق‌شده دانا به تفکیک سال · واحد: میلیون ریال',`<div class="actions"><button class="btn" onclick="importModal('actual')">ورود از اکسل</button><button class="btn" onclick="syncModal()">همگام‌سازی با راهکاران</button></div>`)}
  <div class="card ${fcls(f)}">${`<div class="tabs">${FORMS.map(x=>`<button class="${f===x?'active':''}" onclick="set('af','${x}')">${x}</button>`).join('')}</div>`}
  <div class="spread"><div><h2>ثبت عملکرد محقق‌شده ${f} · سال ${faY(y)}</h2><p class="muted small">${typeHelp(f)}</p></div></div>
  <div class="filters" style="align-items:flex-end;margin-top:16px"><div class="field" style="margin:0"><label>سال</label><select onchange="S.ay=Number(this.value);save();render()">${[1405].map(x=>`<option value="${x}" ${x===y?'selected':''}>${faY(x)}</option>`).join('')}</select></div>
  ${typePick(f,st,'gridPickA')}<button class="btn" onclick="newTypeAct()">${newTypeLabel(f)}</button></div>
  <p class="muted small" style="margin-top:10px">${num(itemsOf(f,st).length)} ${isInc(f)?'کالا / خدمت':'سرفصل'} · داده ${num(filled)} ماه از ۱۲ ماه</p>
  ${typeTable(f,st,'openAct',true)}
  <p class="muted small" style="margin-top:14px">ماه‌های ثبت‌نشده خالی می‌مانند. عملکرد محقق‌شده فقط تا سال ۱۴۰۵ ثبت می‌شود؛ سال ۱۴۰۶ پیش‌بینی بودجه دارد.</p></div>`;
};
render();
})();
