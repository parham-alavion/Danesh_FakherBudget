// ورود از اکسل (بودجه و عملکرد واقعی)، ماژول عملکرد واقعی و منوی گروه‌بندی‌شده
(function(){
const FORMS=['درآمد','هزینه','نقدینگی'];
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const R=n=>num(Math.round(n));
const norm=s=>String(s==null?'':s).trim().replace(/ي/g,'ی').replace(/ك/g,'ک');
const colL=i=>String.fromCharCode(65+i);
const YEARS=[1403,1404,1405];
const RC='نسبت هزینه نیروی انسانی به کل هزینه‌ها';
(()=>{const l=S.companyRules&&S.companyRules['دانا'];if(!l)return;const i=l.findIndex(r=>r.name==='ثبت مقادیر غیرمنفی');const nr={name:'سقف نسبت هزینه نیروی انسانی به کل هزینه‌ها',type:'خطای مانع',category:RC,min:'',max:'60'};if(i>=0)l.splice(i,1,nr);else if(!l.some(r=>r.category===RC))l.push(nr);if(!S.rcErrMig){const x=l.find(r=>r.category===RC);if(x)x.type='خطای مانع';S.rcErrMig=true}save()})();
S.impLog=S.impLog||[];
S.ay=Math.min(S.ay||1405,1405);S.af=S.af||'درآمد';S.actData=S.actData||{};
const adata=y=>{const d=S.actData[y]=S.actData[y]||{};FORMS.forEach(f=>d[f]=d[f]||[]);return d};

/* ---------- منوی گروه‌بندی‌شده ---------- */
const GROUPS=[['general','کلی',['dashboard','companies','variance','intercompany']],['budget','بودجه',['budget','workflow','rules']],['actual','عملکرد محقق شده',['actual']]];
window.navHtml=()=>{
  const by=k=>nav.find(x=>x[0]===k);
  return GROUPS.map(([gk,t,ks])=>`<div class="navlabel" style="display:block">${t}</div>`+ks.filter(k=>by(k)&&(S.scope==='holding'||k!=='companies')).map(k=>{const n=by(k);return `<button class="${S.page===k?'active':''}" onclick="go('${k}')"><span>${n[1]}</span>${n[2]}</button>`}).join('')).join('');
};

/* ---------- نمونه اکسل ---------- */
const SAMPLE=[['درآمد','درآمد خدمات به شرکت‌های گروه',[900,1100,1300,1400,1500,1600,1700,1800,1900,2000,2100,2200]],['درآمد','درآمد خدمات خارج از گروه',[250,300,400,450,500,550,600,650,700,750,800,850]],['هزینه','حقوق و مزایای پرسنل',Array(12).fill(650)],['هزینه','هزینه عمومی و اداری',Array(12).fill(180)],['هزینه','بهای تمام‌شده خدمات',Array(12).fill(200)],['نقدینگی','دریافت نقدی از مشتریان',Array(12).fill(900)],['نقدینگی','پرداخت نقدی حقوق و هزینه‌ها',Array(12).fill(650)]];
const sampleAoa=()=>[['فرم','ردیف',...months],...SAMPLE.map(([f,n,v])=>[f,n,...v])];
const sampleForm=f=>[['سرفصل','شرح',...months],...SAMPLE.filter(x=>x[0]===f).map(([_,n,v])=>[n,'نمونه',...v])];
function guideForm(f){
  const g=[['راهنمای فایل «'+f+'»'],['۱. هر سطر یک ردیف است: ستون «سرفصل»، ستون «شرح» (اختیاری) و سپس دوازده ستون ماه.'],['۲. یک سرفصل می‌تواند در چند سطر با شرح‌های مختلف بیاید؛ جمع آن‌ها جمع سرفصل است.'],['۳. مبالغ به میلیون ریال، عددی و غیرمنفی باشند. ماه خالی مجاز است ولی هشدار می‌دهد.'],['۴. فایل بدون خطا به‌صورت پیش‌نویس ثبت می‌شود و پیش‌بینی بودجه فعلی تغییری نمی‌کند.'],[''],['قواعد بودجه‌ریزی مرتبط با این فرم']];
  (S.companyRules['دانا']||[]).forEach(r=>{if(r.category===RC?f==='هزینه':(FORMS.includes(r.category)?r.category===f:r.category!=='کل بودجه'))g.push([`${r.name} · ${r.category} · حداقل ${r.min||'—'} · حداکثر ${r.max||'—'} · ${r.type}`])});
  return g;
}
function guideAoa(){
  const g=[['راهنمای فایل'],['۱. در شیت اول، هر سطر یک ردیف است: ستون «فرم» (درآمد، هزینه یا نقدینگی)، ستون «ردیف» و سپس دوازده ستون ماه.'],['۲. مبالغ به میلیون ریال، عددی و غیرمنفی باشند. ماه خالی مجاز است ولی هشدار می‌دهد.'],['۳. عنوان ردیف در هر فرم نباید تکراری باشد.'],['۴. ردیف هم‌نام در فرم‌های سامانه با مقادیر فایل جایگزین می‌شود و ردیف جدید افزوده می‌شود.'],[''],['قواعد بودجه‌ریزی فعال (فقط برای بودجه)']];
  (S.companyRules['دانا']||[]).forEach(r=>g.push([`${r.name} · ${r.category} · حداقل ${r.min||'—'} · حداکثر ${r.max||'—'} · ${r.type}`]));
  return g;
}
let xlsxP;
function loadXLSX(){
  if(window.XLSX)return Promise.resolve();
  return xlsxP||(xlsxP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=res;s.onerror=()=>{xlsxP=null;rej(new Error('xlsx-lib'))};document.head.appendChild(s)}));
}
function saveBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
function setMsg(t,bad){const e=document.getElementById('impMsg');if(e){e.textContent=t;e.className='small '+(bad?'error':'muted')}IMP.msg=t}
window.impSample=async()=>{
  const actual=IMP.kind==='actual',name=actual?'نمونه-عملکرد-واقعی':'نمونه-'+IMP.form,aoa=actual?sampleAoa():sampleForm(IMP.form);
  try{
    await loadXLSX();
    const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols']=[{wch:10},{wch:34},...months.map(()=>({wch:10}))];
    XLSX.utils.book_append_sheet(wb,ws,actual?'عملکرد':'بودجه');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(actual?guideAoa():guideForm(IMP.form)),'راهنما');
    wb.Workbook={Views:[{RTL:true}]};
    XLSX.writeFile(wb,name+'.xlsx');setMsg('نمونه اکسل دانلود شد.');
  }catch(e){
    const csv='﻿'+aoa.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    saveBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),name+'.csv');
    setMsg('کتابخانه اکسل بارگذاری نشد (نیاز به اینترنت)؛ نمونه به‌صورت CSV دانلود شد. فایل CSV هم قابل بارگذاری است.',true);
  }
};

/* ---------- خواندن فایل ---------- */
function parseCSV(t){
  t=t.replace(/^﻿/,'');const first=t.split(/\r?\n/)[0]||'',d=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':first.includes('\t')?'\t':',';
  const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){if(c==='"'){if(t[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}
    else if(c==='"')q=true;else if(c===d){row.push(cur);cur=''}else if(c==='\n'){row.push(cur);rows.push(row);row=[];cur=''}else if(c!=='\r')cur+=c}
  row.push(cur);if(row.some(x=>x!==''))rows.push(row);return rows;
}
async function readRows(f){
  if(/\.csv$/i.test(f.name))return parseCSV(await f.text());
  await loadXLSX();
  const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}),ws=wb.Sheets['بودجه']||wb.Sheets['عملکرد']||wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:true});
}
function pnum(v){
  if(v===''||v==null)return {blank:true};
  if(typeof v==='number')return Number.isFinite(v)?{n:v}:{bad:true};
  let s=String(v).trim();if(!s)return {blank:true};
  s=s.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[,٬،\s]/g,'').replace('٫','.');
  return /^-?\d+(\.\d+)?$/.test(s)?{n:Number(s)}:{bad:true};
}

/* ---------- اعتبارسنجی ---------- */
const isHR=n=>/حقوق|پرسنل|نیروی انسانی/.test(n);
function evalRule(final,rule){
  const cat=rule.category;
  if(cat===RC){const tot=sum(final['هزینه'].map(r=>sum(r.values))),hr=sum(final['هزینه'].filter(r=>isHR(r.name)).map(r=>sum(r.values)));return {skip:!tot,value:tot?hr/tot*100:0,pct:true}}
  let rows=[];
  if(cat==='کل بودجه')FORMS.forEach(f=>final[f].forEach(r=>rows.push(r)));
  else if(FORMS.includes(cat))rows=final[cat].slice();
  else FORMS.forEach(f=>final[f].forEach(r=>{if(r.name.includes(cat))rows.push(r)}));
  if(rule.name.includes('خارج از گروه'))rows=rows.filter(r=>r.name.includes('خارج از گروه'));
  return {value:sum(rows.map(r=>sum(r.values)))};
}
// نتیجه همه قواعد فعال برای یک بودجه: [{rule,value,pct,sev:null|'error'|'warning',msg}]
function ruleResults(final){
  return (S.companyRules['دانا']||[]).map(rule=>{
    const ev=evalRule(final,rule);if(ev.skip)return {rule,...ev,sev:null,msg:'هزینه‌ای ثبت نشده است؛ نسبت قابل محاسبه نیست.'};
    const v=ev.value,f=x=>ev.pct?num(Math.round(x*10)/10)+'٪':R(x);let msg='',viol=false;
    if(rule.min!==''&&v<Number(rule.min)){viol=true;msg=`«${rule.name}»: ${ev.pct?'نسبت':'مجموع '+rule.category} برابر ${f(v)} است و از حداقل ${f(Number(rule.min))} کمتر است.`}
    if(rule.max!==''&&v>Number(rule.max)){viol=true;msg=`«${rule.name}»: ${ev.pct?'نسبت':'مجموع '+rule.category} برابر ${f(v)} است و از حداکثر ${f(Number(rule.max))} بیشتر است.`}
    return {rule,...ev,sev:viol?(rule.type==='خطای مانع'?'error':'warning'):null,msg:viol?msg:`${f(v)} · در محدوده`};
  });
}
function relevantRule(rule,form,final){
  const cat=rule.category;
  if(cat===RC)return form==='هزینه';
  if(cat==='کل بودجه')return false;
  if(FORMS.includes(cat))return cat===form;
  return final[form].some(r=>r.name.includes(cat));
}
const aggVals=E=>months.map((_,i)=>{const xs=E.map(x=>x.values[i]).filter(v=>v!=null);return xs.length?sum(xs):null});
function groupRows(rows){const m=new Map();rows.forEach(x=>{if(!m.has(x.name))m.set(x.name,[]);m.get(x.name).push({values:x.values.slice(),note:x.note||''})});return m}
function validateBudget(aoa,form){
  const issues=[],add=(sev,where,msg)=>issues.push({sev,where,msg});
  const h=aoa.findIndex(r=>r.some(c=>norm(c)==='سرفصل'));
  if(h<0)return {fatal:`ساختار فایل با نمونه «${form}» مطابقت ندارد؛ ستون «سرفصل» یافت نشد. نمونه اکسل همین تب را دانلود و همان قالب را پر کنید.`,issues:[],rows:[]};
  const head=aoa[h].map(norm),cN=head.indexOf('سرفصل'),cD=head.indexOf('شرح'),cM=months.map(m=>head.indexOf(norm(m)));
  months.forEach((m,i)=>{if(cM[i]<0)add('error',`سطر ${h+1}`,`ستون ماه «${m}» در فایل یافت نشد.`)});
  const rows=[];
  for(let i=h+1;i<aoa.length;i++){
    const r=aoa[i];if(!r||r.every(c=>c===''||c==null))continue;
    const xr=i+1,name=norm(r[cN]),note=cD>=0?String(r[cD]==null?'':r[cD]).trim():'';let ok=true;
    if(!name){add('error',`${colL(cN)}${xr}`,'عنوان سرفصل خالی است.');ok=false}
    const values=[];let blanks=0;
    months.forEach((m,j)=>{
      if(cM[j]<0){values.push(null);return}
      const p=pnum(r[cM[j]]),cell=`${colL(cM[j])}${xr}`;
      if(p.blank){blanks++;values.push(null)}
      else if(p.bad){add('error',cell,`مقدار «${r[cM[j]]}» برای ${m} عددی نیست.`);ok=false;values.push(null)}
      else if(p.n<0){add('error',cell,`مقدار ${m} منفی است؛ مقادیر باید غیرمنفی باشند.`);ok=false;values.push(null)}
      else values.push(p.n);
    });
    if(blanks===12)add('warning',`سطر ${xr}`,`همه ماه‌های ردیف «${name||'بدون عنوان'}» خالی است.`);
    else if(blanks)add('warning',`سطر ${xr}`,`${num(blanks)} ماه از ردیف «${name}» خالی است و خالی می‌ماند.`);
    if(ok)rows.push({form,name,note,values});
  }
  if(!rows.length&&!issues.some(x=>x.sev==='error'))add('error','فایل','هیچ ردیف معتبری در فایل یافت نشد.');
  if(!issues.some(x=>x.sev==='error')){
    const final={'درآمد':[],'هزینه':[],'نقدینگی':[]};
    final[form]=[...groupRows(rows)].map(([name,E])=>({name,values:aggVals(E).map(v=>v==null?0:v)}));
    ruleResults(final).forEach(x=>{if(x.sev&&relevantRule(x.rule,form,final))add(x.sev,'قاعده بودجه',x.msg)});
  }
  issues.sort((a,b)=>(a.sev==='error'?0:1)-(b.sev==='error'?0:1));
  return {issues,rows};
}
function validate(aoa,kind,year){
  if(kind==='budget')return validateBudget(aoa,IMP.form);
  const issues=[],add=(sev,where,msg)=>issues.push({sev,where,msg});
  let h=aoa.findIndex(r=>r.some(c=>norm(c)==='فرم')&&r.some(c=>norm(c)==='ردیف'));
  if(h<0)return {fatal:'ساختار فایل با نمونه مطابقت ندارد؛ سطر عنوان با ستون‌های «فرم» و «ردیف» یافت نشد. نمونه اکسل را دانلود و همان قالب را پر کنید.',issues:[],rows:[]};
  const head=aoa[h].map(norm),cF=head.indexOf('فرم'),cN=head.indexOf('ردیف'),cM=months.map(m=>head.indexOf(norm(m)));
  months.forEach((m,i)=>{if(cM[i]<0)add('error',`سطر ${h+1}`,`ستون ماه «${m}» در فایل یافت نشد.`)});
  const rows=[],seen={};
  for(let i=h+1;i<aoa.length;i++){
    const r=aoa[i];if(!r||r.every(c=>c===''||c==null))continue;
    const xr=i+1,form=norm(r[cF]),name=norm(r[cN]);let ok=true;
    if(!FORMS.includes(form)){add('error',`${colL(cF)}${xr}`,`فرم «${form||'خالی'}» معتبر نیست؛ مقادیر مجاز: ${FORMS.join('، ')}.`);ok=false}
    if(!name){add('error',`${colL(cN)}${xr}`,'عنوان ردیف خالی است.');ok=false}
    if(ok){const key=form+'|'+name;if(seen[key]){add('error',`${colL(cN)}${xr}`,`ردیف «${name}» در فرم ${form} تکراری است (قبلاً در سطر ${seen[key]} آمده).`);ok=false}else seen[key]=xr}
    const values=[];let blanks=0;
    months.forEach((m,j)=>{
      if(cM[j]<0){values.push(null);return}
      const p=pnum(r[cM[j]]),cell=`${colL(cM[j])}${xr}`;
      if(p.blank){blanks++;values.push(null)}
      else if(p.bad){add('error',cell,`مقدار «${r[cM[j]]}» برای ${m} عددی نیست.`);ok=false;values.push(null)}
      else if(p.n<0){add('error',cell,`مقدار ${m} منفی است؛ مقادیر باید غیرمنفی باشند.`);ok=false;values.push(null)}
      else values.push(p.n);
    });
    if(blanks===12)add('warning',`سطر ${xr}`,`همه ماه‌های ردیف «${name}» خالی است.`);
    else if(blanks)add('warning',`سطر ${xr}`,`${num(blanks)} ماه از ردیف «${name}» خالی است و خالی می‌ماند.`);
    if(ok){
      if(kind==='actual'){const ex=adata(year)[form].find(y=>y.name===name);
        if(ex&&sum(ex.values)>0)add('warning',`سطر ${xr}`,`مقادیر فعلی ردیف «${name}» (${R(sum(ex.values))}) با مقادیر فایل جایگزین می‌شود.`)}
      rows.push({form,name,values});
    }
  }
  if(!rows.length&&!issues.some(x=>x.sev==='error'))add('error','فایل','هیچ ردیف معتبری در فایل یافت نشد.');
  if(kind==='budget'&&!issues.some(x=>x.sev==='error')){
    const final={'درآمد':[],'هزینه':[],'نقدینگی':[]};rows.forEach(x=>final[x.form].push({name:x.name,values:x.values}));
    FORMS.forEach(f=>{if(!final[f].length)add('warning','فایل',`فرم «${f}» در فایل ردیفی ندارد.`)});
    ruleResults(final).forEach(x=>{if(x.sev)add(x.sev,'قاعده بودجه',x.msg)});
  }
  issues.sort((a,b)=>(a.sev==='error'?0:1)-(b.sev==='error'?0:1));
  return {issues,rows};
}

/* ---------- پنجره ورود از اکسل ---------- */
let IMP={kind:'budget',year:1406,result:null,ok:false,msg:''};
window.importModal=(kind,arg)=>{IMP={kind,year:kind==='actual'?(arg||S.ay):S.ay,form:kind==='budget'?arg:null,result:null,ok:false,msg:'',fname:''};renderImport()};
window.impFile=async f=>{
  if(!f)return;IMP.fname=f.name;IMP.ok=false;IMP.msg='';
  try{IMP.result=validate(await readRows(f),IMP.kind,IMP.year)}
  catch(e){IMP.result={fatal:/xlsx-lib/.test(e.message)?'کتابخانه اکسل بارگذاری نشد (نیاز به اینترنت). فایل را به‌صورت CSV ذخیره و دوباره بارگذاری کنید.':'فایل خوانده نشد؛ مطمئن شوید فایل اکسل یا CSV سالم است.',issues:[],rows:[]}}
  const c0=counts(),r0=IMP.result,errs=r0.issues.filter(i=>i.sev==='error');
  if(IMP.kind==='budget'){
    if(r0.fatal||c0.e){
      S.impLog.unshift({id:Date.now(),time:new Date().toLocaleString('fa-IR'),kind:'budget',form:IMP.form,file:f.name,outcome:'رد شد (خطا)',
        detail:r0.fatal?r0.fatal:`${num(c0.e)} خطا${c0.w?' · '+num(c0.w)+' هشدار':''}: `+errs.slice(0,2).map(x=>`${x.where}: ${x.msg}`).join(' | ')+(errs.length>2?' ...':'')});
      S.impLog.length=Math.min(S.impLog.length,50);save();
    }
    renderImport();return;
  }
  IMP.logId=Date.now();
  S.impLog.unshift({id:IMP.logId,time:new Date().toLocaleString('fa-IR'),kind:IMP.kind,year:IMP.year,file:f.name,rows:r0.rows.length,errors:c0.e,warnings:c0.w,
    outcome:(r0.fatal||c0.e)?'رد شد (خطا)':'اعمال نشد',
    detail:r0.fatal?r0.fatal:c0.e?`${num(c0.e)} خطا${c0.w?' · '+num(c0.w)+' هشدار':''}: `+errs.slice(0,2).map(x=>`${x.where}: ${x.msg}`).join(' | ')+(errs.length>2?' ...':''):`اعتبارسنجی موفق · ${num(r0.rows.length)} ردیف${c0.w?' · '+num(c0.w)+' هشدار':''} · ${IMP.kind==='actual'?'هنوز ثبت نشده':'هنوز پیش‌نویس یا درخواستی از آن ساخته نشده'}`});
  S.impLog.length=Math.min(S.impLog.length,50);save();
  renderImport();
};
window.impOk=c=>{IMP.ok=c;syncBtns()};
function counts(){const r=IMP.result||{issues:[]};return {e:r.issues.filter(i=>i.sev==='error').length,w:r.issues.filter(i=>i.sev==='warning').length}}
function canGo(){const r=IMP.result;if(!r||r.fatal)return false;const c=counts();return c.e===0&&r.rows.length>0&&(c.w===0||IMP.ok)}
function syncBtns(){document.querySelectorAll('.impgo').forEach(b=>b.disabled=!canGo()||(b.dataset.send&&window.subBlocked&&subBlocked()))}
function hist(){
  const l=S.impLog.filter(x=>x.kind===IMP.kind&&(IMP.kind==='actual'||!x.form||x.form===IMP.form)).slice(0,10);
  return `<h3 style="margin-top:22px">تاریخچه بارگذاری‌ها</h3>${l.length?`<div class="tablewrap" style="max-height:230px"><table><thead><tr><th>زمان</th><th>فایل</th>${IMP.kind==='actual'?'<th>سال</th>':'<th>فرم</th>'}<th>نتیجه</th><th>چه اتفاقی افتاد</th></tr></thead><tbody>${l.map(x=>`<tr><td>${esc(x.time)}</td><td>${esc(x.file)}</td>${IMP.kind==='actual'?`<td>${fa(x.year)}</td>`:`<td>${esc(x.form||'همه')}</td>`}<td><span class="badge ${/خطا/.test(x.outcome)?'bad':/اعمال نشد|لغو/.test(x.outcome)?'warn':'good'}">${esc(x.outcome)}</span></td><td style="white-space:normal;min-width:240px">${esc(x.detail)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted small">هنوز فایلی بارگذاری نشده است.</p>'}`;
}
function renderImportBudget(){
  const r=IMP.result,c=counts(),form=IMP.form;let res='';
  if(r){
    if(r.fatal)res=`<div class="notice" style="margin-top:14px;background:#fcebea;color:#b43d37">${esc(r.fatal)}</div>`;
    else if(c.e)res=`<div style="margin-top:16px" class="row"><span class="small muted">فایل: ${esc(IMP.fname)}</span><span class="badge bad">${num(c.e)} خطا</span><span class="badge ${c.w?'warn':'good'}">${num(c.w)} هشدار</span></div>
      <div class="tablewrap" style="max-height:260px;margin-top:12px"><table><thead><tr><th>نوع</th><th>محل</th><th>توضیح</th></tr></thead><tbody>${r.issues.map(i=>`<tr><td><span class="badge ${i.sev==='error'?'bad':'warn'}">${i.sev==='error'?'خطا':'هشدار'}</span></td><td>${esc(i.where)}</td><td style="white-space:normal">${esc(i.msg)}</td></tr>`).join('')}</tbody></table></div>
      <div class="notice" style="margin-top:12px;background:#fcebea;color:#b43d37">فایل ثبت نشد. خطاها را در فایل اصلاح و دوباره بارگذاری کنید.</div>`;
    else{
      const g=groupRows(r.rows),qs=v=>[0,1,2,3].map(q=>sum(v.slice(q*3,q*3+3))),all=aggVals(r.rows.map(x=>({values:x.values})));
      res=`<div class="card" style="margin-top:16px;border:2px solid #d2ac67"><div class="spread"><div><h3>فایل آماده ثبت</h3><p class="muted small">${esc(IMP.fname)} · فرم ${esc(form)} · ${num(r.rows.length)} ردیف در ${num(g.size)} سرفصل · بدون خطا</p></div><span class="badge good">آماده</span></div>
      <div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>سرفصل</th><th>ردیف</th>${['بهار','تابستان','پاییز','زمستان'].map(q=>`<th>${q}</th>`).join('')}<th>جمع سال</th></tr></thead><tbody>${[...g].map(([n,E])=>{const v=aggVals(E);return `<tr><td>${esc(n)}</td><td>${num(E.length)}</td>${qs(v.map(x=>x||0)).map(x=>`<td>${num(x)}</td>`).join('')}<td><b>${num(sum(v))}</b></td></tr>`}).join('')}<tr style="font-weight:bold"><td colspan="2">جمع ${esc(form)}</td>${qs(all.map(x=>x||0)).map(x=>`<td>${num(x)}</td>`).join('')}<td>${num(sum(all))}</td></tr></tbody></table></div>
      ${c.w?`<div class="tablewrap" style="max-height:170px;margin-top:12px"><table><thead><tr><th>نوع</th><th>محل</th><th>توضیح</th></tr></thead><tbody>${r.issues.map(i=>`<tr><td><span class="badge warn">هشدار</span></td><td>${esc(i.where)}</td><td style="white-space:normal">${esc(i.msg)}</td></tr>`).join('')}</tbody></table></div>
      <label class="notice" style="margin-top:12px;display:flex;gap:8px;align-items:flex-start;background:#fff4da"><input type="checkbox" ${IMP.ok?'checked':''} onchange="impOk(this.checked)"><span>هشدارها را بررسی کرده‌ام و ثبت پیش‌نویس را تأیید می‌کنم.</span></label>`:''}
      <p class="muted small" style="margin-top:12px">ثبت، یک پیش‌نویس جدید می‌سازد و پیش‌بینی بودجه فعلی تغییری نمی‌کند. پس از ثبت، پیش‌نویس را در بخش «پیش‌نویس‌ها» با «مشاهده جزئیات» بررسی کنید کنید؛ ارسال برای هلدینگ از «درخواست‌های بودجه» انجام می‌شود.</p>
      <div class="actions" style="margin-top:12px"><button class="btn" onclick="impCancel()">لغو</button><button class="btn primary impgo" disabled onclick="impDraft()">ثبت به‌عنوان پیش‌نویس</button></div></div>`;
    }
  }
  modal(`ورود ${form} از اکسل`,`<div class="notice" style="margin:10px 0"><b>۱.</b> نمونه اکسل «${form}» را دانلود کنید. <b>۲.</b> مبالغ را به میلیون ریال در همان قالب وارد کنید؛ هر سرفصل می‌تواند چند سطر با شرح‌های مختلف داشته باشد. <b>۳.</b> فایل را بارگذاری کنید تا اعتبارسنجی و قواعد بودجه‌ریزی بررسی شوند. فایل بدون خطا در بخش «فایل آماده ثبت» نمایش داده می‌شود.</div><div class="actions" style="justify-content:flex-start;margin:12px 0"><button class="btn" onclick="impSample()">دانلود نمونه اکسل</button></div><div class="field"><label>بارگذاری فایل (xlsx، xls یا csv)</label><input type="file" accept=".xlsx,.xls,.csv" onchange="impFile(this.files[0])"></div><p id="impMsg" class="small ${IMP.msg&&/CSV/.test(IMP.msg)?'error':'muted'}">${esc(IMP.msg||'')}</p>${res}${hist()}`,`<button class="btn" onclick="closeModal()">بستن</button>`);
  document.querySelector('#modal .modal').style.width='min(860px,100%)';syncBtns();
}
const logB=(outcome,detail)=>{S.impLog.unshift({id:Date.now(),time:new Date().toLocaleString('fa-IR'),kind:'budget',form:IMP.form,file:IMP.fname,outcome,detail});S.impLog.length=Math.min(S.impLog.length,50)};
window.impCancel=()=>{
  const r=IMP.result;logB('لغو شد',`فایل (${num(r?r.rows.length:0)} ردیف) بدون ثبت لغو شد`);save();
  IMP.result=null;IMP.ok=false;IMP.fname='';IMP.msg='فایل لغو شد. برای ادامه، فایل دیگری انتخاب کنید.';renderImport();
};
window.impDraft=()=>{
  if(!canGo())return;
  const r=IMP.result,form=IMP.form,g=groupRows(r.rows),w=counts().w;
  const rows={'درآمد':[],'هزینه':[],'نقدینگی':[]},ent={};
  [...g].forEach(([n,E])=>{rows[form].push({name:n,values:aggVals(E)});ent[n]=E});
  const nm=`اکسل ${form} · ${new Date().toLocaleString('fa-IR')}`;
  createDraft(nm,'اکسل',rows,{forms:[form],entries:{[form]:ent}});
  logB('ثبت پیش‌نویس',`${num(r.rows.length)} ردیف در ${num(g.size)} سرفصل · به‌عنوان پیش‌نویس «${nm}» ثبت شد${w?` · ${num(w)} هشدار با تأیید کاربر`:''} · پیش‌بینی بودجه تغییری نکرد`);
  save();
  IMP.result=null;IMP.ok=false;IMP.fname='';
  IMP.msg='پیش‌نویس ثبت شد؛ آن را در بخش «پیش‌نویس‌ها» بررسی کنید.';
  render();renderImport();
};
function renderImport(){
  if(IMP.kind==='budget')return renderImportBudget();
  const k=IMP.kind,r=IMP.result,actual=k==='actual',c=counts();
  const title=actual?`ورود عملکرد محقق‌شده ${fa(IMP.year)} از اکسل`:'ورود بودجه ۱۴۰۶ از اکسل';
  let res='';
  if(r){
    if(r.fatal)res=`<div class="notice" style="margin-top:14px;background:#fcebea;color:#b43d37">${esc(r.fatal)}</div>`;
    else res=`<div style="margin-top:16px" class="row"><span class="small muted">فایل: ${esc(IMP.fname)}</span><span class="badge">${num(r.rows.length)} ردیف خوانده شد</span><span class="badge ${c.e?'bad':'good'}">${num(c.e)} خطا</span><span class="badge ${c.w?'warn':'good'}">${num(c.w)} هشدار</span></div>
    ${r.issues.length?`<div class="tablewrap" style="max-height:260px;margin-top:12px"><table><thead><tr><th>نوع</th><th>محل</th><th>توضیح</th></tr></thead><tbody>${r.issues.map(i=>`<tr><td><span class="badge ${i.sev==='error'?'bad':'warn'}">${i.sev==='error'?'خطا':'هشدار'}</span></td><td>${esc(i.where)}</td><td style="white-space:normal">${esc(i.msg)}</td></tr>`).join('')}</tbody></table></div>`:''}
    ${c.e?`<div class="notice" style="margin-top:12px;background:#fcebea;color:#b43d37">تا اصلاح خطاها و بارگذاری دوباره فایل، ${actual?'ثبت':'ثبت یا ارسال'} ممکن نیست.</div>`
      :c.w?`<label class="notice" style="margin-top:12px;display:flex;gap:8px;align-items:flex-start;background:#fff4da"><input type="checkbox" ${IMP.ok?'checked':''} onchange="impOk(this.checked)"><span>هشدارها را بررسی کرده‌ام و ${actual?'ثبت':'ثبت یا ارسال'} را با وجود آن‌ها تأیید می‌کنم.</span></label>`
      :`<div class="notice" style="margin-top:12px;background:#e7f5ed;color:#27754c">خطا یا هشداری یافت نشد.</div>`}`;
  }
  const foot=`<button class="btn" onclick="closeModal()">بستن</button>`+(actual?`<button class="btn primary impgo" disabled onclick="impApply(false)">ثبت عملکرد</button>`:`<button class="btn impgo" disabled onclick="impApply('draft')">ذخیره به‌عنوان پیش‌نویس</button><button class="btn primary impgo" data-send="1" disabled onclick="impApply('send')">ارسال به گردش تصویب</button>`);
  modal(title,`<div class="notice" style="margin:10px 0"><b>۱.</b> نمونه اکسل را دانلود کنید. <b>۲.</b> مبالغ را به میلیون ریال در همان قالب وارد کنید. <b>۳.</b> فایل را بارگذاری کنید تا قواعد اعتبارسنجی ${actual?'':'و قواعد بودجه‌ریزی '}بررسی شوند.${actual?'':' فرم‌های فعلی شما تغییری نمی‌کند؛ فایل فقط به‌صورت پیش‌نویس یا درخواست در گردش تصویب ثبت می‌شود.'}</div><div class="actions" style="justify-content:flex-start;margin:12px 0"><button class="btn" onclick="impSample()">دانلود نمونه اکسل</button></div><div class="field"><label>بارگذاری فایل (xlsx، xls یا csv)</label><input type="file" accept=".xlsx,.xls,.csv" onchange="impFile(this.files[0])"></div><p id="impMsg" class="small ${IMP.msg&&/CSV/.test(IMP.msg)?'error':'muted'}">${esc(IMP.msg||'')}</p>${res}${!actual&&window.subBlocked&&subBlocked()?'<div class="notice" style="margin-top:12px;background:#fff4da">یک بودجه در گردش تصویب دارید؛ تا حذف یا تصویب آن، فقط ذخیره پیش‌نویس ممکن است.</div>':''}${hist()}`,foot);
  document.querySelector('#modal .modal').style.width='min(860px,100%)';syncBtns();
}
window.impApply=mode=>{
  if(!canGo())return;
  const actual=IMP.kind==='actual',lg=S.impLog.find(x=>x.id===IMP.logId),w=counts().w,n=IMP.result.rows.length,wn=w?` · ${num(w)} هشدار با تأیید کاربر`:'';
  let msg;
  if(actual){
    const target=adata(IMP.year);let added=0,replaced=0;
    IMP.result.rows.forEach(x=>{
      const arr=target[x.form],ex=arr.find(y=>y.name===x.name);
      if(ex){replaced++;ex.values=x.values.slice();ex.src='اکسل'}else{added++;arr.push({name:x.name,values:x.values.slice(),src:'اکسل'})}
    });
    S.ay=IMP.year;
    if(lg){lg.outcome='ثبت عملکرد';lg.detail=`${num(added)} ردیف جدید افزوده شد · ${num(replaced)} ردیف موجود جایگزین شد${wn}`}
    msg='عملکرد ثبت شد.';
  }else{
    if(mode==='send'&&subBlocked())return;
    const rows={'درآمد':[],'هزینه':[],'نقدینگی':[]};IMP.result.rows.forEach(x=>rows[x.form].push({name:x.name,values:x.values.slice()}));
    const nm=IMP.fname.replace(/\.[^.]+$/,'');
    if(mode==='send'){
      createSubmission(rows,{name:nm,source:'اکسل',note:`ایجاد از فایل اکسل «${IMP.fname}»${w?` با ${num(w)} هشدار تأییدشده`:''}`});
      if(lg){lg.outcome='ارسال به گردش تصویب';lg.detail=`${num(n)} ردیف · در مرحله «تهیه در شرکت» وارد گردش تصویب شد${wn} · پیش‌بینی بودجه تغییری نکرد`}
      msg='بودجه وارد گردش تصویب شد (مرحله تهیه در شرکت).';
    }else{
      createDraft(nm,'اکسل',rows);
      if(lg){lg.outcome='ثبت پیش‌نویس';lg.detail=`${num(n)} ردیف · به‌عنوان پیش‌نویس «${nm}» ذخیره شد${wn} · پیش‌بینی بودجه تغییری نکرد`}
      msg='پیش‌نویس ساخته شد و در پیش‌بینی بودجه، بخش پیش‌نویس‌ها دیده می‌شود.';
    }
  }
  save();
  IMP.result=null;IMP.ok=false;IMP.fname='';IMP.logId=null;
  IMP.msg=msg+' برای بارگذاری فایل بعدی، فایل جدید را انتخاب کنید.';
  render();renderImport();
};

/* ---------- کنترل پیش از ارسال (پیش‌بینی بودجه) ---------- */
window.budgetCheck=rows=>{
  const all=Object.values(rows).flat(),tasks=[];
  const bad=all.some(r=>r.values.some(v=>v!=null&&(!Number.isFinite(Number(v))||Number(v)<0)));
  tasks.push({t:'مقادیر عددی و غیرمنفی',m:bad?'مقدار نامعتبر وجود دارد.':'موردی یافت نشد.',sev:bad?'error':null});
  if(!all.length)tasks.push({t:'وجود ردیف بودجه',m:'هیچ ردیفی ثبت نشده است.',sev:'error'});
  else FORMS.forEach(f=>{if(!(rows[f]||[]).length)tasks.push({t:'فرم '+f,m:`هیچ ردیفی در فرم ${f} ثبت نشده است.`,sev:'warning'})});
  ruleResults(rows).filter(x=>x.rule.name!=='ثبت مقادیر غیرمنفی').forEach(x=>tasks.push({t:x.rule.name,m:x.msg,sev:x.sev}));
  return {tasks,errors:tasks.filter(x=>x.sev==='error').length,warnings:tasks.filter(x=>x.sev==='warning').length};
};
let SEND=null;
const sendBtn=()=>{const b=document.getElementById('sendGo');if(b&&SEND)b.disabled=!!SEND.c.errors||subBlocked()||(SEND.c.warnings>0&&!SEND.ok)};
window.sendOk=c=>{SEND.ok=c;sendBtn()};
window.sendCheckModal=(rows,meta)=>{
  const c=budgetCheck(rows);SEND={rows,meta,ok:false,c};
  modal('تأیید نهایی بودجه',`<p class="muted">کنترل بر اساس قواعد بودجه‌ریزی شرکت · «${esc(meta.name)}»</p>${c.tasks.map(x=>`<div class="task"><div><b>${esc(x.t)}</b><p>${esc(x.m)}</p></div><span class="badge ${x.sev==='error'?'bad':x.sev==='warning'?'warn':'good'}">${x.sev==='error'?'مانع ارسال':x.sev==='warning'?'هشدار قابل بررسی':'تأیید'}</span></div>`).join('')}
  ${subBlocked()?'<div class="notice" style="margin-top:12px;background:#fff4da">یک بودجه در گردش تصویب دارید. تا حذف یا تصویب آن، بودجه جدیدی نمی‌توانید وارد گردش تصویب کنید.</div>':''}
  ${!c.errors&&c.warnings?`<label class="notice" style="margin-top:12px;display:flex;gap:8px;align-items:flex-start;background:#fff4da"><input type="checkbox" onchange="sendOk(this.checked)"><span>هشدارها را بررسی کرده‌ام و ادامه را تأیید می‌کنم.</span></label>`:''}
  <div class="notice" style="margin-top:12px">با تأیید نهایی، بودجه وارد مرحله «تهیه در شرکت» در گردش تصویب می‌شود؛ مستندات را همان‌جا پیوست و برای معاونت مالی هلدینگ ارسال کنید.${meta.clearForms?' پس از تأیید، اطلاعات فرم‌های پیش‌بینی بودجه پاک می‌شود، چون در گردش تصویب نگهداری می‌شود.':''}</div>`,
  `<button class="btn" onclick="closeModal()">بازگشت</button><button id="sendGo" class="btn primary" disabled onclick="sendConfirm()">تأیید نهایی و ورود به گردش تصویب</button>`);
  sendBtn();
};
window.sendConfirm=()=>{
  const b=document.getElementById('sendGo');if(!SEND||!b||b.disabled)return;
  const {rows,meta,c}=SEND;createSubmission(rows,{...meta,note:meta.note+(c.warnings?` · ${num(c.warnings)} هشدار با تأیید کاربر`:'')});
  if(meta.clearForms&&window.clearForms)clearForms();
  SEND=null;closeModal();go('workflow');
};
window.checkBudget=()=>sendCheckModal(S.rows,{name:'بودجه ۱۴۰۶ (از فرم‌ها)',source:'فرم‌ها',note:'ایجاد از پیش‌بینی بودجه',clearForms:true});

/* ---------- ماژول عملکرد واقعی ---------- */
pages.actual=()=>{
  const y=S.ay,f=S.af,rows=adata(y)[f],filled=months.map((_,i)=>rows.some(r=>r.values[i]!=null)).filter(Boolean).length;
  return `${heading('ایجاد عملکرد جدید','ثبت عملکرد محقق‌شده دانا به تفکیک سال · واحد: میلیون ریال',`<div class="actions"><button class="btn" onclick="importModal('actual')">ورود از اکسل</button><button class="btn" onclick="syncModal()">همگام‌سازی با راهکاران</button></div>`)}
  <div class="card ${fcls(f)}"><div class="filters" style="align-items:flex-end"><div class="field" style="margin:0"><label>سال</label><select onchange="S.ay=Number(this.value);save();render()">${YEARS.map(x=>`<option value="${x}" ${x===y?'selected':''}>${fa(x)}</option>`).join('')}</select></div></div>
  <div class="tabs">${FORMS.map(x=>`<button class="${f===x?'active':''}" onclick="set('af','${x}')">${x}</button>`).join('')}</div>
  <div class="spread"><div><h2>عملکرد محقق‌شده ${f} · سال ${fa(y)}</h2><p class="muted small">${num(rows.length)} ردیف · داده ${num(filled)} ماه از ۱۲ ماه</p></div><button class="btn primary" onclick="aRowModal()">＋ تعریف ردیف</button></div>
  <div class="tablewrap" style="margin-top:18px"><table><thead><tr><th>شرح ردیف</th>${months.map(m=>`<th>${m}</th>`).join('')}<th>جمع سال</th><th>منبع</th><th>عملیات</th></tr></thead><tbody>${rows.length?rows.map((r,i)=>`<tr><td>${esc(r.name)}</td>${r.values.map(v=>`<td class="number">${v==null?'—':num(v)}</td>`).join('')}<td><b>${num(sum(r.values))}</b></td><td><span class="badge">${esc(r.src||'دستی')}</span></td><td><button class="btn" onclick="aEdit(${i})">ویرایش</button></td></tr>`).join(''):'<tr><td colspan="16" class="empty">هنوز عملکردی برای این سال ثبت نشده است. ردیف تعریف کنید، از اکسل وارد کنید یا با راهکاران همگام‌سازی کنید.</td></tr>'}</tbody></table></div>
  <p class="muted small" style="margin-top:14px">ماه‌های ثبت‌نشده خالی می‌مانند. عملکرد محقق‌شده سال ۱۴۰۶ در مغایرت عملکرد هلدینگ برای مقایسه با بودجه به‌کار می‌رود.</p></div>`;
};
window.aRowModal=()=>modal('تعریف ردیف عملکرد',`<p class="muted">سال ${fa(S.ay)}</p><div class="field"><label>فرم</label><select id="aNewForm">${FORMS.map(x=>`<option ${x===S.af?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>عنوان ردیف *</label><input id="aNewName" placeholder="عنوان ردیف"></div><p id="aErr" class="error"></p>`,`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn primary" onclick="aAddRow()">افزودن</button>`);
window.aAddRow=()=>{
  const f=$('aNewForm').value,n=$('aNewName').value.trim(),d=adata(S.ay);
  if(!n){$('aErr').textContent='عنوان ردیف الزامی است.';return}
  if(d[f].some(x=>x.name===n)){$('aErr').textContent='عنوان تکراری است؛ نام دیگری وارد کنید.';return}
  d[f].push({name:n,values:Array(12).fill(null)});S.af=f;save();closeModal();render();
};
window.aEdit=i=>{
  const r=adata(S.ay)[S.af][i];if(!r)return;
  modal('ویرایش ردیف عملکرد',`<p class="muted">${esc(S.af)} · ${esc(r.name)} · سال ${fa(S.ay)} · میلیون ریال</p><div class="entry-grid">${months.map((m,j)=>`<div class="field"><label>${m}</label><input type="number" min="0" step="any" id="aEd${j}" value="${r.values[j]==null?'':r.values[j]}"></div>`).join('')}</div><p id="aErr" class="error"></p>`,`<button class="btn" onclick="aDel(${i})">حذف ردیف</button><button class="btn" onclick="closeModal()">انصراف</button><button class="btn primary" onclick="aSave(${i})">ثبت</button>`);
};
window.aSave=i=>{
  const vals=[];
  for(let j=0;j<12;j++){const raw=$('aEd'+j).value.trim(),v=Number(raw);if(raw!==''&&(!Number.isFinite(v)||v<0)){$('aErr').textContent='مبلغ '+months[j]+' باید عددی و غیرمنفی باشد.';return}vals.push(raw===''?null:v)}
  const r=adata(S.ay)[S.af][i];r.values=vals;r.src='دستی';save();closeModal();render();
};
window.aDel=i=>{if(!confirm('این ردیف حذف شود؟'))return;adata(S.ay)[S.af].splice(i,1);save();closeModal();render()};

/* ---------- همگام‌سازی با راهکاران (نمایشی) ---------- */
window.syncModal=()=>modal('همگام‌سازی با راهکاران',`<p class="muted">راهکاران سیستم · سپیدار</p><div class="notice" style="margin:14px 0">اتصال وب‌سرویس، مجوز و نگاشت حساب‌ها هنوز فراهم نشده است. در این نمونه، همگام‌سازی فقط ردیف‌های فرضی با برچسب «راهکاران (نمونه)» برای سال انتخاب‌شده می‌سازد؛ هیچ داده واقعی دریافت نمی‌شود.</div><div class="field"><label>سال</label><select id="syncYear">${YEARS.map(x=>`<option value="${x}" ${x===S.ay?'selected':''}>${fa(x)}</option>`).join('')}</select></div><p class="small">وضعیت: ${S.syncAt?'آخرین همگام‌سازی نمایشی: '+esc(S.syncAt):'متصل نیست'}</p>`,`<button class="btn" onclick="closeModal()">انصراف</button><button class="btn primary" onclick="syncDemo()">شبیه‌سازی همگام‌سازی</button>`);
window.syncDemo=()=>{
  const y=Number($('syncYear').value),d=adata(y),last=12;
  SAMPLE.forEach(([f,n,v],k)=>{
    const vals=months.map((_,m)=>m<last?Math.round(v[m]*(.88+((Math.sin((k+1)*(m+3)*(y%97))+1)/2)*.24)):null);
    const ex=d[f].find(x=>x.name===n);
    if(ex){ex.values=vals;ex.src='راهکاران (نمونه)'}else d[f].push({name:n,values:vals,src:'راهکاران (نمونه)'});
  });
  S.syncAt=new Date().toLocaleString('fa-IR');S.ay=y;save();closeModal();render();
};
window.XL={loadXLSX,saveBlob};
render();
})();
