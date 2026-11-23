// ماژول‌های پنل هلدینگ (نمونه نمایشی)
// همه ارقام شرکت‌ها (به‌جز ارقام فرم‌های دانا) و عملکرد واقعی فرضی و قطعی تولید می‌شوند.
(function(){
const YEARS=[1403,1404,1405,1406],FORMS=['درآمد','هزینه','نقدینگی'],QN=['بهار','تابستان','پاییز','زمستان'];
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const R=n=>num(Math.round(n));
const sg=n=>n>0?'+'+R(n):n<0?'−'+R(-n):R(0);
const pcs=p=>p==null?'—':(p>0?'+':p<0?'−':'')+num(Math.round(Math.abs(p)*100))+'٪';

/* ---------- وضعیت درخواست‌ها ---------- */
const OTHER={'تیپاکس':'approved','اکتیران':'approved','مهان‌پوش':'approved','خوگر':'approved','تی‌هاب':'rejected','جابار':'rejected','تی‌نکست':'review','تی‌اکسپرس':'review','تی‌پی‌ایکس':'review','پرسیت':'review','ریشه':'review','زی‌بوم':'remaining','حلزون':'remaining','ایفا':'remaining'};
function hstatus(c){const q=c!=='دانا'&&(S.hreqs||[]).find(x=>x.company===c);if(q)return q.status==='تصویب‌شده'?'approved':q.status==='بازگشت برای اصلاح'?'rejected':'review';if(c==='دانا'){const st=S.status;if(st==='تصویب‌شده')return 'approved';if(st==='بازگشت برای اصلاح')return 'rejected';if(st==='پیش‌نویس'||st==='تهیه در شرکت')return 'remaining';return 'review'}return OTHER[c]||'remaining'}
const sentCos=()=>companies.filter(c=>hstatus(c)!=='remaining');

/* ---------- داده فرضی قطعی ---------- */
function hsh(s){let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)}x^=x>>>15;x=Math.imul(x,2246822519);x^=x>>>13;x=Math.imul(x,3266489917);x^=x>>>16;return x>>>0}
const rnd=s=>hsh(s)/4294967296;
const G={1403:.52,1404:.68,1405:.84,1406:1};
const DEF={'درآمد':['درآمد خدمات به شرکت‌های گروه','درآمد خدمات خارج از گروه'],'هزینه':['حقوق و مزایای پرسنل','هزینه عمومی و اداری','بهای تمام‌شده خدمات'],'نقدینگی':['دریافت نقدی از مشتریان','پرداخت نقدی حقوق و هزینه‌ها']};
const fieldNames=f=>[...new Set([...DEF[f],...S.rows[f].map(r=>r.name)])];
const isOut=(f,n)=>f==='هزینه'||(f==='نقدینگی'&&n.indexOf('پرداخت')===0);
function bud(c,y,f,n){
  let base;const r=c==='دانا'?((window.danaBudget?danaBudget():S.rows)[f]||[]).find(x=>x.name===n):null;
  if(r){base=months.map((_,m)=>Number(r.values[m])||0)}
  else{const sc=.5+rnd('sc'+c)*1.6,amt=150+rnd('amt'+f+n)*1800;base=months.map((_,m)=>Math.round(amt*sc*(.8+m*.04)*(1+(rnd(c+f+n+'b'+m)-.5)*.16)))}
  if(y===1406)return base;
  return base.map((v,m)=>Math.round(v*(G[y]||Math.max(.2,1-(1406-y)*.16))*(1+(rnd(c+f+n+y+'y'+m)-.5)*.14)));
}
function act(c,f,n){
  const b=bud(c,1406,f,n),k=c+f+n,bias=(rnd('ab'+k)-.5)*.3;let out=0;
  if(rnd('ao'+k)>.86)out=(rnd('as'+k)>.5?1:-1)*(.22+rnd('am'+k)*.18);
  const real=c==='دانا'&&S.actData&&S.actData[1406]&&(S.actData[1406][f]||[]).find(x=>x.name===n);
  return b.map((v,m)=>real&&real.values[m]!=null?Number(real.values[m]):Math.round(v*(1+bias+out+(rnd('an'+k+m)-.5)*.1)));
}

/* ---------- ابزارها ---------- */
function agg(a,p){if(p==='ماهانه')return a.slice(0,12);if(p==='فصلی')return [0,1,2,3].map(q=>sum(a.slice(q*3,q*3+3)));if(p==='نیم‌ساله')return [sum(a.slice(0,6)),sum(a.slice(6,12))];return [sum(a)]}
const plabels=p=>p==='ماهانه'?months:p==='فصلی'?QN:p==='نیم‌ساله'?['نیمه اول','نیمه دوم']:['کل سال'];
const cum=a=>{let s=0;return a.map(v=>s+=v)};
function serBy(cs,y,f,names){const out=Array(12).fill(0);cs.forEach(c=>names.forEach(n=>bud(c,y,f,n).forEach((v,m)=>out[m]+=v)));return out}
function ser(cs,y,f,fl){return serBy(cs,y,f,fl==='همه'?fieldNames(f):[fl])}
const opt=(list,v)=>list.map(x=>{const a=Array.isArray(x),val=a?x[0]:x,lab=a?x[1]:x;return `<option value="${esc(val)}" ${String(val)===String(v)?'selected':''}>${esc(lab)}</option>`}).join('');
const fld=(l,h)=>`<div class="field" style="margin:0"><label>${l}</label>${h}</div>`;
const tabs=(items,cur,fn)=>`<div class="tabs">${items.map(([k,l])=>`<button class="${cur===k?'active':''}" onclick="${fn}('${k}')">${l}</button>`).join('')}</div>`;
const MCOL={y3:'#cfcfcf',y4:'#a8a8a8',y5:'#6e6e6e',y6:'#d2ac67',inc:'#d2ac67',exp:'#6b6b6b'};
function mchart(labels,series){return lineChart(labels,series.map(s=>({name:s.name,data:s.data,color:MCOL[s.cls]||'#999'})))}
const note=t=>`<div class="banner">${t}</div>`;

/* ---------- پیش‌فرض‌های وضعیت ---------- */
S.vtab=S.vtab||'req';
S.vf=Object.assign({company:'همه',form:'درآمد',field:'همه',period:'ماهانه',by:'شرکت'},S.vf);
S.cur=Object.assign({company:'همه',period:'ماهانه',cum:false},S.cur);
S.ctab=S.ctab||'act';
S.act=Object.assign({ready:false,months:6,company:null,form:null,field:null,cf:'درآمد'},S.act);

/* ---------- نمای کلی هلدینگ ---------- */
function hDash(){
  const g={approved:[],rejected:[],review:[],remaining:[]};companies.forEach(c=>g[hstatus(c)].push(c));
  const total=companies.length;
  const cards=[['approved','درخواست تأییدشده','good','بودجه تصویب‌شده'],['rejected','درخواست ردشده','bad','برگشت‌خورده برای اصلاح'],['review','درخواست در حال بررسی','warn','در مسیر بررسی هلدینگ'],['remaining','شرکت‌های باقی‌مانده','','هنوز بودجه ارسال نکرده‌اند']];
  return `${heading('نمای کلی هلدینگ','وضعیت درخواست‌های بودجه ۱۴۰۶ شرکت‌ها',`<button class="btn" onclick="go('workflow')">بررسی بودجه</button>`)}${note('وضعیت درخواست شرکت‌ها نمایشی است؛ فقط وضعیت شرکت دانا از درخواست‌های بودجه همین نمونه می‌آید.')}
  <div class="grid kpis">${cards.map(([k,t,b,s])=>`<div class="card kpi"><span class="muted">${t}</span><div class="value">${num(g[k].length)}</div><span class="small muted">${s} · از ${num(total)} شرکت</span><p class="small" style="margin:10px 0 0;color:#888;line-height:1.9">${g[k].length?g[k].map(esc).join(' · '):'—'}</p></div>`).join('')}</div>
  <div class="card"><div class="cardhead"><div><h2>پیشرفت دریافت بودجه ۱۴۰۶</h2><p>سهم هر وضعیت از کل شرکت‌های گروه</p></div></div>
  <div class="stack">${cards.map(([k],i)=>g[k].length?`<span class="s${i}" style="width:${g[k].length/total*100}%" title="${cards[i][1]}: ${num(g[k].length)}">${num(g[k].length)}</span>`:'').join('')}</div>
  <div class="legend" style="margin-top:14px">${cards.map(([k,t],i)=>`<span><i class="dot s${i}"></i>${t}</span>`).join('')}</div>
  <div class="actions" style="margin-top:18px"><button class="btn link" onclick="go('workflow')">درخواست‌های بودجه</button><button class="btn link" onclick="go('variance')">مقایسه درخواست‌ها با سال‌های گذشته</button></div></div>`;
}

/* ---------- ماژول مغایرت عملکرد ---------- */
function hVariance(){
  const t=S.vtab;
  const body=t==='req'?hReq():t==='cur'?hCur():hGaps();
  return `${heading('تحلیل و مقایسه','مقایسه درخواست‌های بودجه با سال‌های گذشته، نمای بودجه سال جاری و مغایرت‌های ثبت‌شده')}${tabs([['req','درخواست‌ها در برابر سال‌های گذشته'],['cur','بودجه سال ۱۴۰۶'],['gaps','مغایرت‌های ثبت‌شده']],t,"hset.vtab")}${body}`;
}
window.hset={vtab:k=>set('vtab',k),ctab:k=>set('ctab',k)};
window.hv=(k,v)=>{S.vf[k]=v;if(k==='form')S.vf.field='همه';save();render()};
window.hvc=i=>{S.vf.company=companies[i];save();render()};
window.hvn=i=>{S.vf.field=fieldNames(S.vf.form)[i];save();render()};
window.hc=(k,v)=>{S.cur[k]=v;save();render()};

function pc(a,b){return b?a/b-1:null}
function hReq(){
  const f=S.vf,sent=sentCos();
  if(f.company!=='همه'&&!sent.includes(f.company))f.company='همه';
  const names=fieldNames(f.form);if(f.field!=='همه'&&!names.includes(f.field))f.field='همه';
  const cs=f.company==='همه'?sent:[f.company];
  const labels=plabels(f.period),data=YEARS.map(y=>agg(ser(cs,y,f.form,f.field),f.period));
  const chart=mchart(labels,YEARS.map((y,i)=>({name:fa(y),cls:'y'+(y-1400),data:data[i]})));
  const rows=labels.map((l,i)=>`<tr><td>${esc(l)}</td>${YEARS.map((y,k)=>`<td>${R(data[k][i])}</td>`).join('')}<td>${pcs(pc(data[3][i],data[2][i]))}</td></tr>`).join('');
  const tot=data.map(a=>sum(a));
  const totRow=labels.length>1?`<tr style="font-weight:bold"><td>جمع سال</td>${tot.map(v=>`<td>${R(v)}</td>`).join('')}<td>${pcs(pc(tot[3],tot[2]))}</td></tr>`:'';
  // ریزشدن
  let br;
  if(f.by==='شرکت')br=sent.map((c,i)=>({label:c,sel:c===f.company,act:`hvc(${companies.indexOf(c)})`,v:YEARS.map(y=>sum(ser([c],y,f.form,f.field)))}));
  else br=names.map((n,i)=>({label:n,sel:n===f.field,act:`hvn(${i})`,v:YEARS.map(y=>sum(ser(cs,y,f.form,n)))}));
  br.sort((a,b)=>b.v[3]-a.v[3]);const mx=Math.max(1,...br.map(x=>x.v[3]));
  const unsent=companies.length-sent.length;
  return `${note(`بودجه ۱۴۰۶ درخواست‌های ارسال‌شده است. ارقام ۱۴۰۳ تا ۱۴۰۵ و ارقام شرکت‌های دیگر فرضی‌اند؛ ردیف‌هایی که در پیش‌بینی بودجه دانا ثبت شده باشند از همان فرم‌ها می‌آیند. ${unsent?`${num(unsent)} شرکت هنوز بودجه ارسال نکرده‌اند و در مقایسه نیستند. `:''}واحد: میلیون ریال.`)}
  <div class="card"><div class="filters" style="align-items:flex-end">
  ${fld('شرکت',`<select onchange="hv('company',this.value)">${opt(['همه',...sent],f.company)}</select>`)}
  ${fld('فرم',`<select onchange="hv('form',this.value)">${opt(FORMS,f.form)}</select>`)}
  ${fld('ردیف',`<select onchange="hv('field',this.value)">${opt(['همه',...names],f.field)}</select>`)}
  ${fld('دوره',`<select onchange="hv('period',this.value)">${opt(['ماهانه','فصلی','نیم‌ساله','سالانه'],f.period)}</select>`)}
  </div>
  <h2>${esc(f.form)} · ${f.company==='همه'?'مجموع شرکت‌های ارسال‌کننده':esc(f.company)} · ${f.field==='همه'?'همه ردیف‌ها':esc(f.field)}</h2>
  <p class="muted small">مقایسه چهار سال به تفکیک ${f.period==='سالانه'?'سال':f.period}</p>${chart}
  <div class="tablewrap" style="margin-top:18px"><table><thead><tr><th>دوره</th>${YEARS.map(y=>`<th>${fa(y)}</th>`).join('')}<th>تغییر ۱۴۰۶ به ۱۴۰۵</th></tr></thead><tbody>${rows}${totRow}</tbody></table></div></div>
  <div class="card" style="margin-top:18px"><div class="spread"><div><h2>ریز مقایسه</h2><p class="muted small">جمع سالانه ${esc(f.form)} · برای اعمال فیلتر روی یک مورد، دکمه آن را بزنید</p></div>
  ${fld('تفکیک بر اساس',`<select onchange="hv('by',this.value)">${opt(['شرکت','ردیف'],f.by)}</select>`)}</div>
  <div class="tablewrap"><table><thead><tr><th>${f.by}</th>${YEARS.map(y=>`<th>${fa(y)}</th>`).join('')}<th>تغییر</th><th>سهم ۱۴۰۶</th><th></th></tr></thead><tbody>${br.map(x=>`<tr ${x.sel?'style="background:#fbf6ea"':''}><td>${esc(x.label)}</td>${x.v.map(v=>`<td>${R(v)}</td>`).join('')}<td>${pcs(pc(x.v[3],x.v[2]))}</td><td style="min-width:110px"><div class="track" style="margin:0"><span style="width:${x.v[3]/mx*100}%"></span></div></td><td><button class="btn link" onclick="${x.act}">فیلتر</button></td></tr>`).join('')}</tbody></table></div></div>`;
}

function hCur(){
  const c=S.cur,sent=sentCos();if(c.company!=='همه'&&!sent.includes(c.company))c.company='همه';
  const cs=c.company==='همه'?sent:[c.company],p=c.period,labels=plabels(p),T=a=>{let r=agg(a,p);return c.cum?cum(r):r};
  const rev=T(ser(cs,1406,'درآمد','همه')),cost=T(ser(cs,1406,'هزینه','همه'));
  const cn=fieldNames('نقدینگی'),cin=T(serBy(cs,1406,'نقدینگی',cn.filter(n=>!isOut('نقدینگی',n)))),cout=T(serBy(cs,1406,'نقدینگی',cn.filter(n=>isOut('نقدینگی',n))));
  const tr=sum(agg(ser(cs,1406,'درآمد','همه'),'سالانه')),tc=sum(agg(ser(cs,1406,'هزینه','همه'),'سالانه'));
  const tin=sum(serBy(cs,1406,'نقدینگی',cn.filter(n=>!isOut('نقدینگی',n)))),tout=sum(serBy(cs,1406,'نقدینگی',cn.filter(n=>isOut('نقدینگی',n))));
  const share=sent.map(x=>({c:x,v:sum(ser([x],1406,'درآمد','همه'))})).sort((a,b)=>b.v-a.v),smax=Math.max(1,...share.map(x=>x.v)),stot=sum(share.map(x=>x.v))||1;
  const rows=labels.map((l,i)=>`<tr><td>${esc(l)}</td><td>${R(rev[i])}</td><td>${R(cost[i])}</td><td>${sg(rev[i]-cost[i])}</td><td>${R(cin[i])}</td><td>${R(cout[i])}</td><td>${sg(cin[i]-cout[i])}</td></tr>`).join('');
  return `${note('بودجه ۱۴۰۶ شرکت‌های ارسال‌کننده؛ ارقام شرکت‌های دیگر فرضی است؛ ردیف‌های ثبت‌شده در فرم‌های دانا از همان فرم‌ها می‌آید. واحد: میلیون ریال.')}
  <div class="card"><div class="filters" style="align-items:flex-end">
  ${fld('شرکت',`<select onchange="hc('company',this.value)">${opt(['همه',...sent],c.company)}</select>`)}
  ${fld('دوره',`<select onchange="hc('period',this.value)">${opt(['ماهانه','فصلی','نیم‌ساله','سالانه'],p)}</select>`)}
  <label class="small" style="display:flex;gap:6px;align-items:center;margin-bottom:10px"><input type="checkbox" ${c.cum?'checked':''} onchange="hc('cum',this.checked)"> نمایش تجمعی</label></div>
  <div class="grid kpis"><div class="card kpi"><span class="muted">درآمد سال</span><div class="value">${R(tr)}</div><span class="small muted">میلیون ریال</span></div><div class="card kpi"><span class="muted">هزینه سال</span><div class="value">${R(tc)}</div><span class="small muted">میلیون ریال</span></div><div class="card kpi"><span class="muted">خالص عملیاتی</span><div class="value">${sg(tr-tc)}</div><span class="small muted">حاشیه ${tr?num(Math.round((tr-tc)/tr*100)):'—'}٪</span></div><div class="card kpi"><span class="muted">خالص نقدی</span><div class="value">${sg(tin-tout)}</div><span class="small muted">دریافت − پرداخت</span></div></div>
  <h2>درآمد و هزینه ${c.cum?'(تجمعی)':''}</h2>${mchart(labels,[{name:'درآمد',cls:'inc',data:rev},{name:'هزینه',cls:'exp',data:cost}])}
  <h2 style="margin-top:28px">نقدینگی ${c.cum?'(تجمعی)':''}</h2>${mchart(labels,[{name:'دریافت نقدی',cls:'inc',data:cin},{name:'پرداخت نقدی',cls:'exp',data:cout}])}
  <div class="tablewrap" style="margin-top:18px"><table><thead><tr><th>دوره</th><th>درآمد</th><th>هزینه</th><th>خالص عملیاتی</th><th>دریافت نقدی</th><th>پرداخت نقدی</th><th>خالص نقدی</th></tr></thead><tbody>${rows}</tbody></table></div></div>
  ${c.company==='همه'?`<div class="card" style="margin-top:18px"><h2>سهم شرکت‌ها از درآمد ۱۴۰۶</h2><p class="muted small">بر اساس درخواست‌های ارسال‌شده</p>${share.map(x=>`<div class="break-row" style="margin:14px 0"><div class="spread"><span>${esc(x.c)}</span><b>${R(x.v)} · ${num(Math.round(x.v/stot*100))}٪</b></div><div class="track"><span style="width:${x.v/smax*100}%"></span></div></div>`).join('')}</div>`:''}`;
}

function hGaps(){
  const ranked=[...varianceDemo].sort((a,b)=>Math.abs(b.budget-b.actual)-Math.abs(a.budget-a.actual));
  const top=ranked[0],cnt={};ranked.forEach(x=>cnt[x.reason]=(cnt[x.reason]||0)+1);const cause=Object.entries(cnt).sort((a,b)=>b[1]-a[1]);
  return `${note('عملکرد واقعی دریافت نشده است؛ رتبه‌بندی و علت‌های زیر داده فرضی برای نمایش هستند. مغایرت = بودجه − عملکرد.')}
  <div class="grid kpis"><div class="card kpi"><span class="muted">بیشترین اختلاف نمونه</span><div class="value">${num(Math.abs(top.budget-top.actual))}</div><span class="small muted">میلیون ریال · ${top.company}</span></div><div class="card kpi"><span class="muted">شرکت‌های نیازمند بررسی</span><div class="value">${num(ranked.length)}</div><span class="small muted">بر اساس داده فرضی</span></div><div class="card kpi"><span class="muted">علت پرتکرار نمونه</span><div class="value" style="font-size:17px">${cause[0][0]}</div><span class="small muted">${num(cause[0][1])} مورد از ${num(ranked.length)} مورد</span></div><div class="card kpi"><span class="muted">داده واقعی</span><div class="value" style="font-size:18px">دریافت نشده</div><span class="small muted">اتصال حسابداری برقرار نیست</span></div></div>
  <div class="grid twocol"><div class="card"><div class="cardhead"><div><h2>بیشترین مغایرت شرکت‌ها</h2><p>مرتب‌شده بر اساس قدرمطلق اختلاف · میلیون ریال · فرضی</p></div></div>${ranked.map(x=>`<div class="task"><div><b>${x.company} · ${x.name}</b><p>علت: ${esc(S.reasons[x.name]||x.reason+' (فرضی)')} · بودجه ${num(x.budget)} · عملکرد ${num(x.actual)}</p></div><div style="text-align:left"><b>${num(Math.abs(x.budget-x.actual))}</b> <span class="badge bad">${num(Math.round(Math.abs(x.budget-x.actual)/x.budget*100))}٪</span><br><button class="btn link" onclick="drill('${x.name}',${x.budget},${x.actual})">جزئیات و ثبت علت</button></div></div>`).join('')}</div>
  <div class="card"><h2>الگوی علت‌های نمونه</h2><p class="muted small">فراوانی در ${num(ranked.length)} مورد نمایشی</p>${cause.map(([k,v])=>`<div class="break-row"><div class="spread"><span>${k}</span><b>${num(v)} مورد</b></div><div class="track"><span style="width:${v/ranked.length*100}%"></span></div></div>`).join('')}</div></div>`;
}

/* ---------- ماژول تحلیل و مقایسه ---------- */
function hCompare(){
  const t=S.ctab;let body;
  if(t==='act')body=hAct();
  else body=note('نماهای عمومی زیر بر اساس پیش‌بینی بودجه شرکت دانا ساخته می‌شوند.')+origCompare().replace(/<div class="heading">[\s\S]*?<\/p><\/div><\/div>/,'');
  return `${heading('مغایرت عملکرد','بودجه در برابر عملکرد واقعی و نماهای تحلیلی')}${tabs([['act','بودجه در برابر عملکرد واقعی'],['gen','نماهای عمومی']],t,"hset.ctab")}${body}`;
}
window.ha=(k,v)=>{S.act[k]=v;save();render()};
window.hdc=i=>{S.act.company=companies[i];S.act.form=null;S.act.field=null;save();render();scrollTo(0,0)};
window.hdf=(ci,fi)=>{S.act.company=companies[ci];S.act.form=FORMS[fi];S.act.field=null;save();render();scrollTo(0,0)};
window.hdn=(ci,fi,ni)=>{S.act.company=companies[ci];S.act.form=FORMS[fi];S.act.field=fieldNames(FORMS[fi])[ni];save();render();scrollTo(0,0)};
window.hdb=l=>{if(l<=0){S.act.company=S.act.form=S.act.field=null}else if(l===1){S.act.form=S.act.field=null}else S.act.field=null;save();render()};

function coll(cs,f,names,N,signed){
  const b=Array(N).fill(0),a=Array(N).fill(0);
  cs.forEach(c=>names.forEach(n=>{const B=bud(c,1406,f,n),A=act(c,f,n),s=signed&&isOut(f,n)&&f==='نقدینگی'?-1:1;for(let m=0;m<N;m++){b[m]+=s*B[m];a[m]+=s*A[m]}}));
  return {b,a};
}
function dv(b,a,out){
  const dev=a-b,pct=b?dev/b:0,bad=out?dev>0:dev<0;
  const cls=Math.abs(pct)<.05?'ok':bad?'bad':'good';
  return {dev,pct,cls,txt:cls==='ok'?'در محدوده':bad?'نامطلوب':'مطلوب'};
}
const badge=d=>`<span class="badge ${d.cls==='bad'?'bad':d.cls==='good'?'good':''}">${d.txt}</span>`;
const tcls=d=>d.cls==='bad'?'t-bad':d.cls==='good'?'t-good':'';
function drow(label,B,A,out,btn){const d=dv(B,A,out);return `<tr><td>${label}</td><td>${R(B)}</td><td>${R(A)}</td><td class="${tcls(d)}">${sg(d.dev)}</td><td class="${tcls(d)}">${pcs(d.pct)}</td><td>${badge(d)}</td><td>${btn||''}</td></tr>`}
const dthead=l=>`<thead><tr><th>${l}</th><th>بودجه</th><th>عملکرد</th><th>انحراف</th><th>انحراف ٪</th><th>ارزیابی</th><th></th></tr></thead>`;

function hAct(){
  const A=S.act;
  if(!A.ready)return `<div class="card"><h2>عملکرد واقعی هنوز دریافت نشده است</h2><p class="muted">این بخش پس از تکمیل عملکرد واقعی شرکت‌ها، آن را با بودجه ۱۴۰۶ مقایسه می‌کند، انحراف را محاسبه می‌کند و امکان ریزشدن تا سطح شرکت، فرم، ردیف و ماه را می‌دهد. در این نمونه اتصال حسابداری وجود ندارد؛ برای دیدن عملکرد کار این بخش می‌توانید داده فرضی بارگذاری کنید.</p><div class="actions" style="margin-top:16px"><button class="btn primary" onclick="ha('ready',true)">بارگذاری عملکرد نمونه (فرضی)</button></div></div>`;
  const N=A.months,sent=sentCos();
  if(A.company&&!sent.includes(A.company)){A.company=A.form=A.field=null}
  if(A.form&&!FORMS.includes(A.form)){A.form=A.field=null}
  if(A.field&&!fieldNames(A.form).includes(A.field))A.field=null;
  const level=A.field?3:A.form?2:A.company?1:0,lab=months.slice(0,N);
  const ci=A.company?companies.indexOf(A.company):-1,fi=A.form?FORMS.indexOf(A.form):-1;
  const crumbs=`<div class="crumbs"><button onclick="hdb(0)" class="${level===0?'cur':''}">همه شرکت‌ها</button>${A.company?` › <button onclick="hdb(1)" class="${level===1?'cur':''}">${esc(A.company)}</button>`:''}${A.form?` › <button onclick="hdb(2)" class="${level===2?'cur':''}">${esc(A.form)}</button>`:''}${A.field?` › <span class="cur">${esc(A.field)}</span>`:''}</div>`;
  const bar=`<div class="filters" style="align-items:flex-end;margin-bottom:6px">${fld('دوره عملکرد',`<select onchange="ha('months',Number(this.value))">${months.map((m,i)=>`<option value="${i+1}" ${i+1===N?'selected':''}>فروردین تا پایان ${m}</option>`).join('')}</select>`)}<button class="btn link" onclick="ha('ready',false)">حذف عملکرد نمونه</button></div>`;
  const cs=A.company?[A.company]:sent;
  const cform=level>=2?A.form:A.cf;
  const formTabs=level<2?`<div class="tabs">${FORMS.map(f=>`<button class="${A.cf===f?'active':''}" onclick="ha('cf','${f}')">${f}</button>`).join('')}</div>`:'';
  let chartData,chartTitle,table='',extra='';
  if(level===3){const o=coll(cs,A.form,[A.field],N,false);chartData=o;chartTitle=`${A.form} · ${A.field}`;
    table=`<div class="tablewrap"><table>${dthead('ماه')}<tbody>${lab.map((m,i)=>drow(m,o.b[i],o.a[i],isOut(A.form,A.field))).join('')}${drow('<b>جمع</b>',sum(o.b),sum(o.a),isOut(A.form,A.field))}</tbody></table></div>`}
  else if(level===2){const names=fieldNames(A.form);chartData=coll(cs,A.form,names,N,true);chartTitle=`${A.form} · ${A.company}`;
    table=`<div class="tablewrap"><table>${dthead('ردیف')}<tbody>${names.map((n,i)=>{const o=coll(cs,A.form,[n],N,false);return drow(esc(n),sum(o.b),sum(o.a),isOut(A.form,n),`<button class="btn link" onclick="hdn(${ci},${fi},${i})">ریز ماهانه</button>`)}).join('')}</tbody></table></div>`}
  else if(level===1){chartData=coll(cs,cform,fieldNames(cform),N,true);chartTitle=`${cform} · ${A.company}`;
    table=`<div class="tablewrap"><table>${dthead('فرم')}<tbody>${FORMS.map((f,i)=>{const o=coll(cs,f,fieldNames(f),N,true);return drow(f,sum(o.b),sum(o.a),f==='هزینه',`<button class="btn link" onclick="hdf(${ci},${i})">ریز ردیف‌ها</button>`)}).join('')}</tbody></table></div>`;
    const lines=[];FORMS.forEach((f,i)=>fieldNames(f).forEach((n,j)=>{const o=coll(cs,f,[n],N,false),B=sum(o.b),Ac=sum(o.a);lines.push({f,i,n,j,B,A:Ac,d:dv(B,Ac,isOut(f,n))})}));
    lines.sort((x,y)=>Math.abs(y.A-y.B)-Math.abs(x.A-x.B));
    extra=`<div class="card" style="margin-top:18px"><h2>بیشترین انحراف ردیف‌ها</h2><p class="muted small">مرتب‌شده بر اساس قدرمطلق انحراف در همه فرم‌ها</p>${lines.slice(0,5).map(x=>`<div class="task"><div><b>${x.f} · ${esc(x.n)}</b><p>بودجه ${R(x.B)} · عملکرد ${R(x.A)}</p></div><div style="text-align:left" class="${tcls(x.d)}"><b>${sg(x.d.dev)}</b> ${badge(x.d)}<br><button class="btn link" onclick="hdn(${ci},${x.i},${x.j})">ریز ماهانه</button></div></div>`).join('')}</div>`}
  else{
    chartData=coll(cs,cform,fieldNames(cform),N,true);chartTitle=`${cform} · مجموع شرکت‌های دارای بودجه`;
    const rv=coll(cs,'درآمد',fieldNames('درآمد'),N,true),cst=coll(cs,'هزینه',fieldNames('هزینه'),N,true);
    const rB=sum(rv.b),rA=sum(rv.a),cB=sum(cst.b),cA=sum(cst.a),dr=dv(rB,rA,false),dc=dv(cB,cA,true),dn=dv(rB-cB,rA-cA,false);
    let badCos=0;
    const matrix=sent.map(c=>{const cells=FORMS.map((f,i)=>{const o=coll([c],f,fieldNames(f),N,true),B=sum(o.b),Ac=sum(o.a),d=dv(B,Ac,f==='هزینه');return {f,i,B,A:Ac,d}});
      let worst=null;FORMS.forEach((f,i)=>fieldNames(f).forEach((n,j)=>{const o=coll([c],f,[n],N,false),B=sum(o.b),Ac=sum(o.a),d=dv(B,Ac,isOut(f,n)),w=Math.abs(Ac-B);if(!worst||w>worst.w)worst={f,i,n,j,B,A:Ac,d,w}}));
      if(cells.some(x=>x.d.cls==='bad'&&Math.abs(x.d.pct)>=.1))badCos++;
      return {c,cells,worst,score:worst?worst.w:0}}).sort((a,b)=>b.score-a.score);
    table=`<div class="tablewrap"><table><thead><tr><th>شرکت</th>${FORMS.map(f=>`<th>${f}</th>`).join('')}<th>بیشترین انحراف ردیف</th><th></th></tr></thead><tbody>${matrix.map(r=>`<tr><td>${esc(r.c)}</td>${r.cells.map(x=>`<td><button class="cellbtn ${x.d.cls}" title="بودجه ${R(x.B)} · عملکرد ${R(x.A)}" onclick="hdf(${companies.indexOf(r.c)},${x.i})">${pcs(x.d.pct)}</button></td>`).join('')}<td class="${r.worst?tcls(r.worst.d):''}">${r.worst?`${r.worst.f} · ${esc(r.worst.n)} (${sg(r.worst.A-r.worst.B)})`:'—'}</td><td><button class="btn link" onclick="hdc(${companies.indexOf(r.c)})">ریزشدن</button></td></tr>`).join('')}</tbody></table></div><p class="muted small" style="margin-top:10px">هر خانه، انحراف عملکرد از بودجه همان فرم است؛ برای ریزشدن تا ردیف‌ها روی آن بزنید. نقدینگی بر پایه خالص (دریافت − پرداخت) محاسبه می‌شود.</p>`;
    extra='';
    var kp=`<div class="grid kpis"><div class="card kpi"><span class="muted">درآمد</span><div class="value">${R(rA)}</div><span class="small ${tcls(dr)}">بودجه ${R(rB)} · ${pcs(dr.pct)}</span></div><div class="card kpi"><span class="muted">هزینه</span><div class="value">${R(cA)}</div><span class="small ${tcls(dc)}">بودجه ${R(cB)} · ${pcs(dc.pct)}</span></div><div class="card kpi"><span class="muted">خالص عملیاتی</span><div class="value">${sg(rA-cA)}</div><span class="small ${tcls(dn)}">بودجه ${sg(rB-cB)} · ${pcs(dn.pct)}</span></div><div class="card kpi"><span class="muted">شرکت‌های دارای انحراف نامطلوب</span><div class="value">${num(badCos)}</div><span class="small muted">بیش از ۱۰٪ در دست‌کم یک فرم · از ${num(sent.length)} شرکت</span></div></div>`;
  }
  return `${note('عملکرد واقعی نمونه فرضی است و از حسابداری نمی‌آید. انحراف = عملکرد − بودجه؛ مطلوب یا نامطلوب بودن به نوع ردیف بستگی دارد (درآمد بیشتر مطلوب، هزینه بیشتر نامطلوب) و انحراف زیر ۵٪ در محدوده است. واحد: میلیون ریال.')}${bar}${crumbs}${typeof kp==='string'?kp:''}<div class="card" style="margin-top:6px">${formTabs}<h2>${chartTitle}</h2><p class="muted small">بودجه و عملکرد ماهانه · فروردین تا ${months[N-1]}</p>${paired(lab,chartData.b,chartData.a,'بودجه','عملکرد')}<div style="margin-top:20px">${table}</div></div>${extra}`;
}

/* ---------- اتصال صفحات ---------- */
window.HB={bud,fieldNames,act,sentCos,rnd,hstatus};
const origCompare=pages.compare,origVariance=pages.variance;
pages.dashboard=()=>S.scope==='holding'?hDash():companyDashboard();
pages.variance=()=>S.scope==='holding'?hVariance():origVariance();
pages.compare=()=>S.scope==='holding'?hCompare():origCompare();
render();
})();
