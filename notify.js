// زنگوله اعلان‌ها (نمونه فرضی) برای پنل شرکت و هلدینگ
(function(){
S.notifRead=S.notifRead||[];
let open=false;

function notifs(){
  const list=[];
  if(S.scope==='holding'){
    const rev=companies.filter(c=>HB.hstatus(c)==='review');
    const names=rev.length?rev:['تی‌نکست','تی‌اکسپرس'];
    list.push({id:'h-req:'+names.join(','),tone:'warn',title:'درخواست بررسی بودجه',text:`شرکت‌های ${names.join('، ')} درخواست بررسی بودجه ۱۴۰۶ ارسال کرده‌اند.`,time:'امروز',action:['بررسی بودجه','workflow']});
    const low=[...HB.sentCos()].sort((a,b)=>HB.rnd('lo'+a)-HB.rnd('lo'+b)).slice(0,3).map(c=>[c,Math.round(15+HB.rnd('sh'+c)*20)]);
    const lows=low.length?low:[['خوگر',24],['پرسیت',19]];
    list.push({id:'h-low:'+lows.map(x=>x.join('-')).join(','),tone:'bad',title:'درآمد محقق‌شده کمتر از پیش‌بینی',text:`درآمد محقق‌شده ۱۴۰۵ شرکت‌های ${lows.map(([c,p])=>`${c} (${num(p)}٪ کمتر)`).join('، ')} از پیش‌بینی بودجه کمتر است و نیاز به بررسی دارد.`,time:'دیروز',action:['تحلیل و مقایسه','variance']});
  }else{
    const sub=S.subs.find(x=>x.status==='بازگشت برای اصلاح');
    if(sub){
      const e=[...sub.events].reverse().find(x=>/بازگشت/.test(x.type));
      list.push({id:'c-rej:'+sub.id+':'+(e?e.time:''),tone:'bad',title:'درخواست بودجه رد شد',text:`درخواست بودجه «${sub.name}» که ارسال کرده‌اید توسط ${e?e.actor:'معاونت مالی هلدینگ'} رد شده است و باید آن را اصلاح کنید.${e&&e.note?' توضیح: '+e.note:''}`,time:e?e.time:'امروز',action:['مشاهده درخواست‌ها','workflow']});
    }else{
      list.push({id:'c-rej-fake',tone:'bad',title:'درخواست بودجه رد شد',text:'درخواست بودجه ۱۴۰۶ که ارسال کرده‌اید توسط مدیر مالی هلدینگ رد شده است و باید آن را اصلاح کنید.',time:'امروز',action:['مشاهده درخواست‌ها','workflow']});
    }
  }
  return list;
}
const unread=()=>notifs().filter(n=>!S.notifRead.includes(n.id));

window.bellHtml=()=>{
  const all=notifs(),u=unread().length;
  return `<div class="bellwrap"><button class="bell" onclick="bellToggle()" title="اعلان‌ها" aria-label="اعلان‌ها"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></svg>${u?`<span class="bdg">${num(u)}</span>`:''}</button>
  ${open?`<div class="bellpanel"><div class="spread" style="padding:12px 14px;border-bottom:1px solid #eee"><b>اعلان‌ها</b>${u?`<button class="btn link" onclick="bellReadAll()">علامت‌گذاری همه به‌عنوان خوانده‌شده</button>`:''}</div>
  ${all.map(n=>`<div class="nitem ${n.tone} ${S.notifRead.includes(n.id)?'read':''}"><div class="spread"><b>${esc(n.title)}</b><span class="muted small">${esc(n.time)}</span></div><p>${esc(n.text)}</p><button class="btn link" onclick="bellGo('${esc(n.id)}','${n.action[1]}')">${esc(n.action[0])}</button></div>`).join('')||'<div class="empty" style="padding:20px">اعلانی نیست.</div>'}
  <div class="muted small" style="padding:8px 14px">اعلان‌ها نمونه‌ی فرضی هستند.</div></div>`:''}</div>`;
};
window.bellToggle=()=>{open=!open;render()};
window.bellReadAll=()=>{notifs().forEach(n=>{if(!S.notifRead.includes(n.id))S.notifRead.push(n.id)});save();render()};
window.bellGo=(id,page)=>{if(!S.notifRead.includes(id))S.notifRead.push(id);save();open=false;go(page)};
document.addEventListener('click',e=>{if(open&&!e.target.closest('.bellwrap')){open=false;render()}});
render();
})();
