// گردش تصویب، پیش‌نویس‌ها و تاریخچه ارسال‌ها (نمونه نمایشی)
(function(){
const FORMS=['درآمد','هزینه','نقدینگی'];
const STAGES=['تهیه در شرکت','کارشناس هلدینگ','مدیر مالی هلدینگ','هیئت‌مدیره'];
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
  const row=(rows[f]||[]).find(r=>r.name===n),E=entries&&entries[f]&&entries[f][n];
  if(E&&row&&same(aggE(E),row.values))return E;
  if(row&&row.values.some(v=>v!=null))return [{values:row.values.slice(),note:row.note||''}];
  return [];
}
function exportSheets(rows,entries){
  return FORMS.map(f=>{const aoa=[['سرفصل','شرح',...months]];
    (rows[f]||[]).forEach(r=>entriesFor(rows,entries,f,r.name).forEach(e=>aoa.push([r.name,e.note||'',...e.values.map(v=>v==null?'':v)])));
    return [f,aoa]});
}
async function dlStore(rows,entries,name){
  const sheets=exportSheets(rows,entries);
  try{
    await XL.loadXLSX();
    const wb=XLSX.utils.book_new();
    sheets.forEach(([f,aoa])=>{const ws=XLSX.utils.aoa_to_sheet(aoa);ws['!cols']=[{wch:34},{wch:24},...months.map(()=>({wch:10}))];XLSX.utils.book_append_sheet(wb,ws,f)});
    wb.Workbook={Views:[{RTL:true}]};XLSX.writeFile(wb,safe(name)+'.xlsx');
  }catch(e){
    const aoa=[['فرم','سرفصل','شرح',...months],...sheets.flatMap(([f,a])=>a.slice(1).map(r=>[f,...r]))];
    const csv='\uFEFF'+aoa.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    XL.saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),safe(name)+'.csv');
  }
}
window.subDl=id=>{const s=S.subs.find(x=>x.id===id);if(s)dlStore(s.rows,s.entries,'درخواست-'+s.name)};
window.draftDl=i=>{const d=S.drafts[i];if(d)dlStore(d.rows,d.entries,'پیش‌نویس-'+d.name)};

/* ---------- درخواست‌های بودجه ---------- */
const statusCls=s=>s==='تصویب‌شده'?'good':s==='بازگشت برای اصلاح'||s==='حذف‌شده'?'bad':'warn';
const evLine=e=>`<div class="small" style="margin:3px 0;white-space:normal"><span class="muted">${esc(e.time)}</span> · <b>${esc(e.actor)}</b> · ${esc(e.type)}${e.note?`: ${esc(e.note)}`:''}</div>`;
const draftTot=(d,f)=>sum((d.rows[f]||[]).map(r=>sum(r.values)));
function draftsSection(){
  const blocked=subBlocked();
  return `<div class="card"><div class="spread"><div><h2>پیش‌نویس‌های بودجه</h2><p class="muted small">یکی از پیش‌نویس‌ها را انتخاب کنید؛ مستندات و متن ارسال را آماده و برای معاونت مالی هلدینگ فاخر ارسال کنید. ساخت و ویرایش پیش‌نویس در «پیش‌بینی بودجه» است.</p></div></div>
  ${blocked?'<div class="notice" style="background:#fff4da;margin:10px 0">یک درخواست در حال بررسی هلدینگ دارید؛ تا پایان بررسی یا بازگشت آن، ارسال درخواست جدید ممکن نیست.</div>':''}
  <div class="tablewrap"><table><thead><tr><th>نام</th><th>تاریخ</th><th>منبع</th><th>فرم‌ها</th><th>جمع درآمد</th><th>جمع هزینه</th><th>مستندات</th><th></th></tr></thead><tbody>${S.drafts.length?S.drafts.map((d,i)=>`<tr><td>${esc(d.name)}</td><td>${esc(d.created)}</td><td>${esc(d.source)}</td><td>${(d.forms||FORMS).length===3?'همه':esc((d.forms||FORMS).join('، '))}</td><td>${R(draftTot(d,'درآمد'))}</td><td>${R(draftTot(d,'هزینه'))}</td><td>${num((d.docs||[]).length)}</td><td><button class="btn" onclick="spOpen(${d.id})">انتخاب و بررسی</button></td></tr>`).join(''):`<tr><td colspan="8" class="empty">پیش‌نویسی وجود ندارد. در «پیش‌بینی بودجه» پیش‌نویس بسازید.</td></tr>`}</tbody></table></div>
  <div class="actions" style="margin-top:12px"><button class="btn link" onclick="go('budget')">رفتن به پیش‌بینی بودجه</button></div></div>`;
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
  return `<div class="card" style="margin-top:18px"><div class="spread"><div><h2>درخواست جاری · ${esc(c.name)}</h2><p class="muted small">منبع: ${esc(c.source)} · ارسال: ${esc(c.sentAt||'—')}</p></div><span class="badge ${statusCls(st)}">${esc(st)}</span></div>
  <div class="timeline">${STAGES.map((x,i)=>`<div class="step ${done||i<=idx?'on':''}"><b>${x}</b><p class="small muted">${i===0?'ثبت و ارسال':'بررسی و ارجاع'}</p></div>`).join('')}</div>
  ${ret&&last?`<div class="notice" style="background:#fcebea;color:#b43d37;margin-bottom:12px"><b>بازگشت برای اصلاح</b> · ${esc(last.actor)} · ${esc(last.time)}${last.note?'<br>'+esc(last.note):''}</div>`:''}
  <div class="notice">${note}</div>
  ${c.message?`<h3 style="margin-top:20px">متن ارسال</h3><div class="notice" style="white-space:pre-wrap">${esc(c.message)}</div>`:''}
  <h3 style="margin-top:20px">مستندات پیوست</h3>
  <div class="tablewrap"><table><thead><tr><th>نام سند</th><th>نوع</th><th>تاریخ</th><th>اندازه</th></tr></thead><tbody>${c.docs.length?c.docs.map(d=>`<tr><td>${esc(d.name)}</td><td>${esc(d.type)}</td><td>${esc(d.time)}</td><td>${esc(d.size)}</td></tr>`).join(''):'<tr><td colspan="4" class="empty">سندی پیوست نشده است.</td></tr>'}</tbody></table></div>
  <div class="actions" style="margin-top:18px">${actions}</div></div>`;
}
function histSection(){
  return `<div class="card" style="margin-top:18px"><h2>تاریخچه ارسال‌ها</h2><p class="muted small">هر درخواست، روند آن و واکنش‌های ثبت‌شده در مراحل بررسی</p><div class="tablewrap"><table><thead><tr><th>درخواست</th><th>تاریخ ارسال</th><th>وضعیت فعلی</th><th>روند و واکنش‌ها</th><th></th></tr></thead><tbody>${S.subs.length?S.subs.map(s=>`<tr><td style="white-space:normal;min-width:140px"><b>${esc(s.name)}</b><div class="small muted">${esc(s.source)}</div></td><td>${esc(s.sentAt||'—')}</td><td style="white-space:normal"><span class="badge ${statusCls(s.status)}">${esc(s.status)}</span><div class="small muted" style="margin-top:5px">مرحله: ${IDX[s.status]>=4?'پایان':STAGES[IDX[s.status]]}</div></td><td style="white-space:normal;min-width:300px">${s.events.map(evLine).join('')}</td><td><button class="btn" onclick="subDl(${s.id})">دانلود اکسل</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">هنوز درخواستی ارسال نشده است.</td></tr>'}</tbody></table></div></div>`;
}
function wfPage(){
  const holding=S.scope==='holding';
  return `${heading('درخواست‌های بودجه',holding?'بررسی و ارجاع بودجه ارسالی شرکت':'انتخاب پیش‌نویس، پیوست مستندات و ارسال برای معاونت مالی هلدینگ')}${holding?'':draftsSection()}${requestSection(cur(),holding)}${histSection()}`;
}
pages.workflow=wfPage;

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
  `<button class="btn" onclick="spDel()">حذف پیش‌نویس</button><button class="btn" onclick="spDl()">دانلود اکسل</button><button class="btn" onclick="closeModal()">بستن</button><button id="spGo" class="btn primary" disabled onclick="spSend()">ارسال به معاونت مالی هلدینگ فاخر</button>`);
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
window.spDel=()=>{const d=spDraft();if(!d||!confirm(`پیش‌نویس «${d.name}» حذف شود؟`))return;S.drafts.splice(S.drafts.indexOf(d),1);save();SP=null;closeModal();render()};
window.spSend=()=>{
  const b=document.getElementById('spGo');if(!b||b.disabled)return;
  spMsgSave();const {d,c}=spState();
  createSubmission(d.rows,{name:d.name,source:d.source,entries:d.entries,docs:d.docs||[],message:(d.msg||'').trim(),note:c.warnings?`${num(c.warnings)} هشدار با تأیید کاربر`:''});
  SP=null;closeModal();render();
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
const DEFN={'درآمد':['درآمد خدمات به شرکت‌های گروه','درآمد خدمات خارج از گروه'],'هزینه':['حقوق و مزایای پرسنل','هزینه عمومی و اداری','بهای تمام‌شده خدمات'],'نقدینگی':['دریافت نقدی از مشتریان','پرداخت نقدی حقوق و هزینه‌ها']};
let ST=S;
const typesOf=(f,st=ST)=>[...new Set([...DEFN[f],...st.rows[f].map(r=>r.name)])];
window.fcls=f=>({'درآمد':'f-inc','هزینه':'f-exp','نقدینگی':'f-cash'})[f]||'';
S.entries=S.entries||{};

/* هر نوع/سرفصل می‌تواند چند ردیف (با مقادیر و شرح جدا) داشته باشد؛
   ردیف اصلی در S.rows جمع ماه‌به‌ماه همین ردیف‌هاست تا بقیه سامانه بدون تغییر کار کند. */
const aggE=E=>months.map((_,m)=>{const xs=E.map(e=>e.values[m]).filter(v=>v!=null);return xs.length?sum(xs):null});
const nv=v=>v==null?null:Number(v);
const same=(a,b)=>a.length===b.length&&a.every((v,i)=>nv(v)===nv(b[i]));
function getEntries(f,n,st=ST){return entriesFor(st.rows,st.entries,f,n)}
function setEntries(f,n,E,st=ST){
  (st.entries[f]=st.entries[f]||{})[n]=E;
  let row=st.rows[f].find(r=>r.name===n);const vals=aggE(E);
  if(!row){row={name:n,values:vals};st.rows[f].push(row)}else row.values=vals;
  delete row.note;
  if(!E.length&&DEFN[f].includes(n))st.rows[f].splice(st.rows[f].indexOf(row),1);
  if(st.actual)row.src='دستی';
  if(st!==S)st.dirty=true;
  save();
}
const qsum=v=>[0,1,2,3].map(q=>sum(v.slice(q*3,q*3+3)));
const REV='بررسی';
const tabsHtml=f=>`<div class="tabs">${FORMS.map(x=>`<button class="${f===x?'active':''}" onclick="set('form','${x}')">${x}</button>`).join('')}<button class="${f===REV?'active':''}" onclick="set('form','${REV}')">بررسی نهایی و ثبت</button></div>`;
function budgetPage(){
  const f=S.form;
  if(f===REV)return `${heading('پیش‌بینی بودجه دانا','ورود ماهانه · سال مالی ۱۴۰۶ · واحد: میلیون ریال')}<div class="card f-rev">${tabsHtml(f)}${reviewHtml()}</div>`;
  const rows=S.rows[f],total=sum(rows.map(r=>sum(r.values)));
  return `${heading('پیش‌بینی بودجه دانا','ورود ماهانه · سال مالی ۱۴۰۶ · واحد: میلیون ریال')}
  <div class="card ${fcls(f)}">${tabsHtml(f)}
  <div class="spread"><div><h2>ثبت ${f} ماهانه</h2><p class="muted small">یکی از انواع و سرفصل‌ها را انتخاب کنید تا ردیف‌های آن و جدول ماهانه‌شان باز شود. هر نوع می‌تواند چند ردیف با شرح‌های مختلف داشته باشد.</p></div><span class="badge">${S.status}</span></div>
  <div class="filters" style="align-items:flex-end;margin-top:16px"><div class="field" style="margin:0;min-width:280px"><label>نوع / سرفصل</label><select onchange="gridPick(this)"><option value="">انتخاب کنید</option>${typesOf(f,S).map(n=>{const c=getEntries(f,n,S).length;return `<option value="${esc(n)}">${esc(n)}${c?' ✓':''}</option>`}).join('')}</select></div><button class="btn" onclick="newTypeMain()">＋ تعریف نوع / سرفصل جدید</button><button class="btn" onclick="importModal('budget','${f}')">ورود ${f} از اکسل</button></div>
  <div class="tablewrap" style="margin-top:24px"><table><thead><tr><th>نوع / سرفصل</th><th>تعداد ردیف</th>${QN.map(q=>`<th>${q}</th>`).join('')}<th>جمع سال</th><th>عملیات</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${num(getEntries(f,r.name,S).length)}</td>${qsum(r.values).map(v=>`<td>${num(v)}</td>`).join('')}<td><b>${num(sum(r.values))}</b></td><td><button class="btn" onclick="openMain('${f}',${S.rows[f].indexOf(r)})">مشاهده و ویرایش جزئیات</button></td></tr>`).join('')+(f==='نقدینگی'?'':`<tr style="font-weight:bold"><td colspan="2">جمع ${f}</td>${qsum(months.map((_,m)=>sum(rows.map(r=>r.values[m])))).map(v=>`<td>${num(v)}</td>`).join('')}<td>${num(total)}</td><td></td></tr>`):'<tr><td colspan="8" class="empty">هنوز چیزی ثبت نشده است. یک نوع یا سرفصل را انتخاب کنید.</td></tr>'}</tbody></table></div>
  <p class="muted small" style="margin-top:14px">ماه‌های ثبت‌نشده خالی می‌مانند. جمع هر نوع، مجموع ردیف‌های آن است. نقدینگی فقط دریافت و پرداخت نقدی دوره را نشان می‌دهد. ذخیره پیش‌نویس در تب «بررسی نهایی و ثبت» است.</p></div>`;
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
pages.budget=()=>budgetPage()+draftsCard();

/* ---------- پاپ‌آپ جزئیات یک نوع/سرفصل ---------- */
let DT=null;
window.openMain=(f,i)=>{ST=S;openDetail(f,i)};
window.editBudgetRow=i=>openMain(S.form,i);
window.openDetail=(f,i)=>{const r=ST.rows[f][i];if(r)startDetail(f,r.name)};
const curForm=()=>ST===S?S.form:ST.actual?S.af:DE.tab;
const faY=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const yl=()=>ST&&ST.actual?'سال '+faY(S.ay):'سال مالی ۱۴۰۶';
window.gridPick=el=>{const v=el.value;el.value='';if(v){ST=S;startDetail(S.form,v)}};
function startDetail(f,n){DT={form:f,name:n,idx:-1};getEntries(f,n).length?renderDetail():detNew()}
const wide=()=>{document.querySelector('#modal .modal').style.width='min(860px,100%)'};
function renderDetail(){
  const {form,name}=DT,E=getEntries(form,name),qs=e=>[0,1,2,3].map(q=>sum(e.values.slice(q*3,q*3+3)));
  const all=aggE(E),tq=[0,1,2,3].map(q=>sum(all.slice(q*3,q*3+3)));
  modal(`${esc(form)} · ${esc(name)}`,`<p class="muted small">${yl()} · میلیون ریال · هر ردیف مقادیر و شرح جداگانه دارد</p>
  <div class="tablewrap"><table><thead><tr><th>#</th><th>شرح</th>${QN.map(q=>`<th>${q}</th>`).join('')}<th>جمع سال</th><th>عملیات</th></tr></thead><tbody>${E.length?E.map((e,i)=>`<tr><td>${num(i+1)}</td><td style="white-space:normal;min-width:120px">${esc(e.note||'—')}</td>${qs(e).map(v=>`<td>${num(v)}</td>`).join('')}<td><b>${num(sum(e.values))}</b></td><td><button class="btn link" onclick="detEdit(${i})">ویرایش</button><button class="btn link" onclick="detDel(${i})">حذف</button></td></tr>`).join('')+`<tr style="font-weight:bold"><td colspan="2">جمع ${esc(name)}</td>${tq.map(v=>`<td>${num(v)}</td>`).join('')}<td>${num(sum(all))}</td><td></td></tr>`:'<tr><td colspan="8" class="empty">ردیفی ثبت نشده است.</td></tr>'}</tbody></table></div>
  <div class="actions" style="justify-content:flex-start;margin-top:14px"><button class="btn primary" onclick="detNew()">＋ ردیف جدید</button></div>`,`<button class="btn" onclick="detClose()">${ST===S||ST.actual?'بستن':'بازگشت به پیش‌نویس'}</button>`);
  wide();
}
window.detClose=()=>{if(ST===S||ST.actual){ST=S;closeModal();render()}else renderDE()};
window.detNew=()=>{DT.idx=-1;renderGrid(Array(12).fill(null),'')};
window.detEdit=i=>{const e=getEntries(DT.form,DT.name)[i];if(!e)return;DT.idx=i;renderGrid(e.values,e.note||'')};
window.detBack=()=>{getEntries(DT.form,DT.name).length||DT.idx>=0?renderDetail():detClose()};
function renderGrid(v,note){
  const half=h=>{
    const q0=h*2,m0=h*6;
    return `<tr>${[q0,q0+1].map(q=>`<th colspan="3" class="season">${QN[q]}</th>`).join('')}</tr>
    <tr>${months.slice(m0,m0+6).map(m=>`<th>${m}</th>`).join('')}</tr>
    <tr>${months.slice(m0,m0+6).map((m,k)=>`<td><input type="number" min="0" step="any" id="gm${m0+k}" value="${v[m0+k]==null?'':v[m0+k]}"></td>`).join('')}</tr>
    <tr class="tot">${[q0,q0+1].map(q=>`<td colspan="3">جمع ${QN[q]}: <b id="gs${q}">0</b></td>`).join('')}</tr>`;
  };
  modal(`${esc(DT.form)} · ${esc(DT.name)} · ${DT.idx>=0?'ویرایش ردیف '+num(DT.idx+1):'ردیف جدید'}`,`<p class="muted small">${yl()} · میلیون ریال · ماه‌های خالی، خالی می‌مانند</p>
  <div class="tablewrap"><table class="mgrid" oninput="gridTot()"><tbody>${half(0)}${half(1)}<tr class="tot"><td colspan="6">جمع سال: <b id="gy">0</b></td></tr></tbody></table></div>
  <div class="field"><label>شرح</label><input id="gNote" value="${esc(note)}" placeholder="شرح این ردیف"></div><p id="gErr" class="error"></p>`,
  `<button class="btn" onclick="detBack()">بازگشت</button><button class="btn primary" onclick="detSave()">ثبت</button>`);
  wide();gridTot();
}
window.gridTot=()=>{
  const g=i=>Number(($('gm'+i)||{}).value)||0;let y=0;
  for(let q=0;q<4;q++){const s=g(q*3)+g(q*3+1)+g(q*3+2);y+=s;$('gs'+q).textContent=num(s)}
  $('gy').textContent=num(y);
};
window.detSave=()=>{
  const vals=[];
  for(let j=0;j<12;j++){const raw=$('gm'+j).value.trim(),n=Number(raw);if(raw!==''&&(!Number.isFinite(n)||n<0)){$('gErr').textContent='مبلغ '+months[j]+' باید عددی و غیرمنفی باشد.';return}vals.push(raw===''?null:n)}
  if(vals.every(x=>x==null)){$('gErr').textContent='حداقل یک مبلغ وارد کنید.';return}
  const {form,name,idx}=DT,E=clone(getEntries(form,name)),e={values:vals,note:$('gNote').value.trim()};
  if(idx>=0)E[idx]=e;else E.push(e);
  setEntries(form,name,E);if(ST===S){S.form=form;render()}else if(ST.actual){S.af=form;render()}renderDetail();
};
window.detDel=i=>{
  const {form,name}=DT,E=clone(getEntries(form,name));
  if(!confirm('این ردیف حذف شود؟'))return;
  E.splice(i,1);setEntries(form,name,E);if(ST===S||ST.actual)render();renderDetail();
};
window.newTypeMain=()=>{ST=S;newTypeModal()};
window.newTypeModal=()=>modal(`تعریف نوع / سرفصل جدید · ${curForm()}`,`<div class="field"><label>عنوان نوع / سرفصل *</label><input id="ntName" placeholder="عنوان سرفصل"></div><p id="ntErr" class="error"></p>`,`<button class="btn" onclick="detClose()">انصراف</button><button class="btn primary" onclick="newTypeSave()">تعریف و ورود مبالغ</button>`);
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
window.saveDraft=()=>{const n=$('dName').value.trim();if(!n){$('dErr').textContent='نام پیش‌نویس الزامی است.';return}const ent={};FORMS.forEach(f=>{ent[f]={};S.rows[f].forEach(r=>ent[f][r.name]=clone(getEntries(f,r.name)))});createDraft(n,'فرم‌ها',S.rows,{forms:FORMS.slice(),entries:ent});clearForms();closeModal();render()};
window.controlsModal=()=>{
  const rows=ST.rows,empty=!Object.values(rows).flat().length,c=empty?null:budgetCheck(rows);
  modal('کنترل‌های بودجه',empty?'<p class="muted">هنوز اطلاعاتی ثبت نشده است؛ پس از ثبت اطلاعات، نتیجه‌ی کنترل‌ها اینجا نمایش داده می‌شود.</p>'
    :`<p class="muted">بر اساس قواعد بودجه‌ریزی شرکت</p><div class="row" style="margin-bottom:8px"><span class="badge ${c.errors?'bad':'good'}">${num(c.errors)} خطا</span><span class="badge ${c.warnings?'warn':'good'}">${num(c.warnings)} هشدار</span></div>${[...c.tasks].sort((a,b)=>({error:0,warning:1})[a.sev]-({error:0,warning:1})[b.sev]||0).map(x=>`<div class="task"><div><b>${esc(x.t)}</b><p>${esc(x.m)}</p></div><span class="badge ${x.sev==='error'?'bad':x.sev==='warning'?'warn':'good'}">${x.sev==='error'?'خطا · مانع ارسال':x.sev==='warning'?'هشدار':'تأیید'}</span></div>`).join('')}`,
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
    const total=sum(rows.map(r=>sum(r.values)));
    body=`<div class="card ${fcls(f)}" style="margin:0">${tabs}
    <div class="spread"><div><h2>${f}</h2><p class="muted small">یکی از انواع و سرفصل‌ها را انتخاب کنید تا ردیف‌های آن باز شود. تغییرات پس از «ذخیره تغییرات پیش‌نویس» در تب بررسی نهایی و ثبت اعمال می‌شود.</p></div></div>
    <div class="filters" style="align-items:flex-end;margin-top:12px"><div class="field" style="margin:0;min-width:260px"><label>نوع / سرفصل</label><select onchange="deGridPick(this)"><option value="">انتخاب کنید</option>${typesOf(f,DE).map(n=>{const c=getEntries(f,n,DE).length;return `<option value="${esc(n)}">${esc(n)}${c?' ✓':''}</option>`}).join('')}</select></div><button class="btn" onclick="newTypeModal()">＋ تعریف نوع / سرفصل جدید</button></div>
    <div class="tablewrap" style="margin-top:16px"><table><thead><tr><th>نوع / سرفصل</th><th>ردیف</th>${QN.map(q=>`<th>${q}</th>`).join('')}<th>جمع سال</th><th></th></tr></thead><tbody>${rows.length?rows.map((r,i)=>`<tr><td>${esc(r.name)}</td><td>${num(getEntries(f,r.name,DE).length)}</td>${qsum(r.values).map(v=>`<td>${num(v)}</td>`).join('')}<td><b>${num(sum(r.values))}</b></td><td><button class="btn" onclick="openDetail('${f}',${i})">مشاهده و ویرایش جزئیات</button></td></tr>`).join('')+(f==='نقدینگی'?'':`<tr style="font-weight:bold"><td colspan="2">جمع ${f}</td>${qsum(months.map((_,m)=>sum(rows.map(r=>r.values[m])))).map(v=>`<td>${num(v)}</td>`).join('')}<td>${num(total)}</td><td></td></tr>`):'<tr><td colspan="8" class="empty">ردیفی ثبت نشده است.</td></tr>'}</tbody></table></div></div>`;
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
  if(DE){if(DE.dirty&&!confirm('تغییرات ذخیره‌نشده پیش‌نویس از بین می‌رود. پنجره بسته شود؟'))return;ST=S;DE=null;_closeModal();render();return}
  _closeModal();
};
window.deDl=()=>dlStore(DE.rows,DE.entries,'پیش‌نویس-'+DE.name);
window.deDel=()=>{if(!confirm(`پیش‌نویس «${DE.name}» حذف شود؟`))return;const k=S.drafts.findIndex(x=>x.id===DE.id);if(k>=0)S.drafts.splice(k,1);ST=S;DE=null;save();closeModal();render()};
window.deSend=()=>{const d=deApply();if(!d)return;const rows=clone(DE.rows),meta={name:d.name,source:d.source,note:`ایجاد از پیش‌نویس «${d.name}»`};ST=S;DE=null;render();sendCheckModal(rows,meta)};
window.draftOpenModal=i=>{const d=S.drafts[i];if(!d)return;modal('بازکردن پیش‌نویس',`<p>${(d.forms||FORMS).length===3?'همه‌ی فرم‌ها':'فرم '+(d.forms||FORMS).join('، ')} با محتوای «${esc(d.name)}» جایگزین می‌شود. اگر اطلاعات فعلی را می‌خواهید، ابتدا «ذخیره پیش‌نویس» بزنید.</p>`,`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn primary" onclick="draftOpen(${i})">بازکردن</button>`)};
window.draftOpen=i=>{const d=S.drafts[i];if(!d)return;const r=clone(d.rows);(d.forms||FORMS).forEach(f=>{S.rows[f]=r[f]||[];S.entries[f]=d.entries&&d.entries[f]?clone(d.entries[f]):{}});save();closeModal();render()};
window.draftSend=i=>{const d=S.drafts[i];if(d)sendCheckModal(d.rows,{name:d.name,source:d.source,note:`ایجاد از پیش‌نویس «${d.name}»`})};
window.draftDel=i=>{const d=S.drafts[i];if(d&&confirm(`پیش‌نویس «${d.name}» حذف شود؟`)){S.drafts.splice(i,1);save();render()}};

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
  const st=actStore(),y=S.ay,f=S.af,rows=st.rows[f],total=sum(rows.map(r=>sum(r.values)));
  const filled=months.map((_,i)=>rows.some(r=>r.values[i]!=null)).filter(Boolean).length;
  return `${heading('ایجاد عملکرد جدید','ثبت عملکرد محقق‌شده دانا به تفکیک سال · واحد: میلیون ریال',`<div class="actions"><button class="btn" onclick="importModal('actual')">ورود از اکسل</button><button class="btn" onclick="syncModal()">همگام‌سازی با راهکاران</button></div>`)}
  <div class="card ${fcls(f)}">${`<div class="tabs">${FORMS.map(x=>`<button class="${f===x?'active':''}" onclick="set('af','${x}')">${x}</button>`).join('')}</div>`}
  <div class="spread"><div><h2>ثبت عملکرد محقق‌شده ${f} · سال ${faY(y)}</h2><p class="muted small">یکی از انواع و سرفصل‌ها را انتخاب کنید تا ردیف‌های آن و جدول ماهانه‌شان باز شود. هر نوع می‌تواند چند ردیف با شرح‌های مختلف داشته باشد.</p></div></div>
  <div class="filters" style="align-items:flex-end;margin-top:16px"><div class="field" style="margin:0"><label>سال</label><select onchange="S.ay=Number(this.value);save();render()">${[1403,1404,1405].map(x=>`<option value="${x}" ${x===y?'selected':''}>${faY(x)}</option>`).join('')}</select></div>
  <div class="field" style="margin:0;min-width:280px"><label>نوع / سرفصل</label><select onchange="gridPickA(this)"><option value="">انتخاب کنید</option>${typesOf(f,st).map(n=>{const c=getEntries(f,n,st).length;return `<option value="${esc(n)}">${esc(n)}${c?' ✓':''}</option>`}).join('')}</select></div><button class="btn" onclick="newTypeAct()">＋ تعریف نوع / سرفصل جدید</button></div>
  <p class="muted small" style="margin-top:10px">${num(rows.length)} سرفصل · داده ${num(filled)} ماه از ۱۲ ماه</p>
  <div class="tablewrap" style="margin-top:14px"><table><thead><tr><th>نوع / سرفصل</th><th>تعداد ردیف</th>${QN.map(q=>`<th>${q}</th>`).join('')}<th>جمع سال</th><th>منبع</th><th>عملیات</th></tr></thead><tbody>${rows.length?rows.map((r,i)=>`<tr><td>${esc(r.name)}</td><td>${num(getEntries(f,r.name,st).length)}</td>${qsum(r.values).map(v=>`<td>${num(v)}</td>`).join('')}<td><b>${num(sum(r.values))}</b></td><td><span class="badge">${esc(r.src||'دستی')}</span></td><td><button class="btn" onclick="openAct('${f}',${i})">مشاهده و ویرایش جزئیات</button></td></tr>`).join('')+(f==='نقدینگی'?'':`<tr style="font-weight:bold"><td colspan="2">جمع ${f}</td>${qsum(months.map((_,m)=>sum(rows.map(r=>r.values[m])))).map(v=>`<td>${num(v)}</td>`).join('')}<td>${num(total)}</td><td></td><td></td></tr>`):'<tr><td colspan="9" class="empty">هنوز عملکردی برای این سال ثبت نشده است. یک نوع یا سرفصل را انتخاب کنید، از اکسل وارد کنید یا با راهکاران همگام‌سازی کنید.</td></tr>'}</tbody></table></div>
  <p class="muted small" style="margin-top:14px">ماه‌های ثبت‌نشده خالی می‌مانند. عملکرد محقق‌شده فقط تا سال ۱۴۰۵ ثبت می‌شود؛ سال ۱۴۰۶ پیش‌بینی بودجه دارد.</p></div>`;
};
render();
})();
