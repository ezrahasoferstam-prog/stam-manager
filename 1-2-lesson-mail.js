/* Draft module appended to existing app. No automatic sends, no app-state migration. */
(function(){
'use strict';
var SENDER='Ezrahasofer.stam@gmail.com',MAX=6*1024*1024;
var chosenCourse=0,chosenPlan=0,busy=false;
var css=document.createElement('style');css.textContent='#lesson-mail-modal{position:fixed;inset:0;z-index:2000;background:#0007;display:none;align-items:flex-start;justify-content:center;overflow:auto;padding:16px}#lesson-mail-modal .lmbox{width:100%;max-width:540px;margin:12px 0;background:var(--card);color:var(--ink);border-radius:16px;padding:18px;border:1px solid var(--line)}#lesson-mail-modal label{display:block;margin-top:12px}#lesson-mail-modal input,#lesson-mail-modal select,#lesson-mail-modal textarea{width:100%;font:inherit;min-height:44px}#lesson-mail-modal textarea{min-height:160px;height:160px;line-height:1.6}#lesson-mail-modal #lm-subject{min-height:64px;height:64px;resize:vertical}#lm-message{white-space:pre-wrap;padding:10px 0;font-size:14px}#lm-controls{display:flex;gap:8px;flex-wrap:wrap}#lm-controls button{min-height:48px}#lm-file-choice{display:flex;gap:8px;align-items:center}#lm-file-choice input{width:20px;min-height:20px}';document.head.appendChild(css);
var root=document.createElement('div');root.id='lesson-mail-modal';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','lm-title');
root.innerHTML='<div class="lmbox"><h2 id="lm-title">שליחת שיעור לאחראי</h2><label for="lm-course">לאיזה קורס לשלוח?</label><select id="lm-course"></select><div class="mut">האחראי והמייל מתמלאים מפרטי הקורס השמורים.</div><label for="lm-plan">איזה שיעור לשלוח?</label><select id="lm-plan"></select><label>מהחשבון שלך</label><div dir="ltr" style="text-align:right;overflow-wrap:anywhere">'+SENDER+'</div><label for="lm-to">אל: אחראי הקורס</label><input id="lm-to" dir="ltr" type="email" readonly><div id="lm-contact" class="mut"></div><label for="lm-subject">נושא</label><textarea id="lm-subject" maxlength="200" rows="2"></textarea><label for="lm-body">תוכן המייל</label><textarea id="lm-body" maxlength="50000"></textarea><label id="lm-file-choice"><input id="lm-file" type="checkbox"><span id="lm-file-name"></span></label><div id="lm-message" role="status" aria-live="polite"></div><div id="lm-controls"><button class="add" id="lm-send">שלח עכשיו</button><button class="x" id="lm-check" hidden>בדוק מצב שליחה</button><button class="x" id="lm-close">ביטול</button></div><div class="mut">השליחה מתבצעת כאן, בלי לפתוח Gmail. אישור שליחה אינו אישור מסירה או קריאה.</div></div>';
document.body.appendChild(root);
function el(id){return document.getElementById('lm-'+id)}
function message(t){el('message').textContent=t}
function journal(){try{return JSON.parse(localStorage.getItem('sofer_lesson_mail')||'[]')}catch(e){throw Error('יומן השליחה במכשיר אינו תקין. לא נשלח מייל.')}}
function writeJournal(rows){localStorage.setItem('sofer_lesson_mail',JSON.stringify(rows.slice(-500)))}
function updateRecord(rec){var rows=journal(),i=rows.findIndex(function(r){return r.id===rec.id});if(i<0)rows.push(rec);else rows[i]=rec;writeJournal(rows)}
function blocking(){return journal().find(function(r){return Number(r.courseId)===chosenCourse&&Number(r.planId)===chosenPlan&&['pending','unknown'].indexOf(r.state)>=0})}
function disable(on){busy=on;['course','plan','subject','body','file','send','close','check'].forEach(function(id){el(id).disabled=on})}
function selectData(){
 chosenCourse=Number(el('course').value)||0;chosenPlan=Number(el('plan').value)||0;
 var c=course(chosenCourse),p=findP(chosenPlan),ct=c&&c.contact||{};
 el('to').value=ct.email||'';el('contact').textContent=ct.name||'שם האחראי טרם נשמר';
 el('subject').value=p?'שיעור: '+p.title+(c?' - '+c.name:''):'';
 el('body').value=p?((ct.name?'שלום '+ct.name+',\n\n':'')+(p.body||p.title)):'';
 el('file').checked=!!(p&&p.file);el('file-choice').style.display=p&&p.file?'flex':'none';
 el('file-name').textContent=p&&p.file?'צירוף קובץ השיעור: '+p.file.name+' (עד 6MB)':'';
 var past=journal().filter(function(r){return Number(r.courseId)===chosenCourse&&Number(r.planId)===chosenPlan&&r.state==='sent'}).slice(-1)[0];
 var pending=blocking();el('send').hidden=!!pending;el('check').hidden=!pending;
 if(pending)message('יש בקשת שליחה ללא אישור סופי. לא נשלח עותק נוסף. לחץ בדוק מצב שליחה.');
 else message(past?'השיעור כבר נשלח אל '+past.to+' ב-'+new Date(past.at).toLocaleString('he-IL')+'. לחיצה נוספת תשלח עותק חדש.':!ct.email?'חסר מייל לאחראי. שמור אותו פעם אחת בפרטי הקורס.':'בדוק את הנמען, התוכן והקובץ. שלח עכשיו ישלח את המייל הזה בלבד.');
}
function coursesChanged(){
 chosenCourse=Number(el('course').value)||0;var nx=nextPlanFor(chosenCourse);
 if(nx)el('plan').value=String(nx);selectData();
}
window.mailPlan=function(pid,cid){
 if(busy)return;
 el('course').innerHTML=S.courses.map(function(c){return '<option value="'+Number(c.id)+'">'+esc(c.name)+'</option>'}).join('');
 el('plan').innerHTML=S.plans.map(function(p,i){return '<option value="'+Number(p.id)+'">'+(i+1)+'. '+esc(p.title)+'</option>'}).join('');
 el('course').value=String(cid||S.courses[0]&&S.courses[0].id||0);
 el('plan').value=String(pid||nextPlanFor(Number(el('course').value))||S.plans[0]&&S.plans[0].id||0);
 root.style.display='flex';selectData();el('course').focus();
};
el('course').onchange=coursesChanged;el('plan').onchange=selectData;
el('close').onclick=function(){if(!busy)root.style.display='none'};
root.addEventListener('keydown',function(e){if(e.key==='Escape'&&!busy)root.style.display='none';if(e.key==='Tab'){var f=Array.from(root.querySelectorAll('button,input,select,textarea')).filter(function(x){return !x.disabled&&!x.hidden&&x.offsetParent!==null});if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&document.activeElement===f[f.length-1]){e.preventDefault();f[0].focus()}}});
async function req(type,params){
 if(!adminKey()||!siteEndpoint())throw Error('יש לחבר תחילה את החיבור הפרטי של האפליקציה.');
 var abort=new AbortController(),timer=setTimeout(function(){abort.abort()},60000);
 try{var r=await fetch(siteEndpoint(),{method:'POST',credentials:'omit',signal:abort.signal,body:new URLSearchParams(Object.assign({},params||{},{type:type,admin_key:adminKey()}))});if(!r.ok)throw Error('לא התקבל מענה תקין מהשרת');var d=await r.json();if(!d||typeof d.ok!=='boolean')throw Error('מענה לא מזוהה');return d}finally{clearTimeout(timer)}
}
var errors={not_enabled:'השליחה עדיין כבויה. יש להשלים הפעלה לפני השליחה.',sender_mismatch:'חשבון השולח אינו תואם למייל שלך. השליחה נחסמה.',mail_authorization_required:'נדרש להשלים הרשאת שליחה ב-Google.',unauthorized:'החיבור הפרטי אינו מאושר.',quota:'מכסת המיילים היומית הסתיימה.',rate_limit:'הגעת למגבלת השליחה. לא נשלח מייל.',recipient:'כתובת המייל של האחראי אינה תקינה.',busy_no_send:'השרת עסוק. לא נשלח מייל.',request_conflict:'מזהה הבקשה אינו תואם לתוכן. לא נשלח עותק נוסף.'};
function errorText(d){return errors[d.error]||'השליחה נחסמה: '+(d.error||'שגיאה לא ידועה')}
async function fileData(p){
 if(!p.file)throw Error('קובץ השיעור לא נמצא');
 var blob;
 if(isLocalImg(p.file.id))blob=await idbGet(p.file.id);
 else{var r=await fetch('/_blob/'+encodeURIComponent(p.file.id));if(!r.ok)throw Error('קובץ השיעור אינו זמין במכשיר');blob=await r.blob()}
 if(!blob||!blob.size)throw Error('קובץ השיעור אינו זמין במכשיר');
 if(blob.size>MAX)throw Error('הקובץ גדול מ-6MB. לא נשלח מייל. אפשר להסיר את סימון הקובץ ולבדוק שוב.');
 var type=blob.type||p.file.type||'',allowed=['application/pdf','image/jpeg','image/png','image/webp','text/plain','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
 if(allowed.indexOf(type)<0)throw Error('סוג הקובץ אינו נתמך לשליחה ישירה. לא נשלח מייל.');
 var base64=await new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(String(r.result).split(',')[1])};r.onerror=function(){reject(Error('קריאת הקובץ נכשלה'))};r.readAsDataURL(blob)});
 return {name:p.file.name,type:type,base64:base64};
}
function confirmed(rec,d){
 if(d.id!==rec.id||d.to.toLowerCase()!==rec.to.toLowerCase()||d.sender.toLowerCase()!==SENDER.toLowerCase())throw Error('אישור השליחה אינו תואם לבקשה');
 rec.state=d.state==='sent'?'sent':'unknown';rec.at=d.at||'';updateRecord(rec);
 if(rec.state==='sent')message('המייל נשלח אל '+rec.to+' ב-'+new Date(rec.at).toLocaleString('he-IL')+'. לא התקבל אישור מסירה או קריאה.');
 else message('לא התקבל אישור סופי. ייתכן שהמייל נשלח. לא יישלח עותק נוסף. אפשר לבדוק מצב שליחה.');
 el('send').hidden=true;el('check').hidden=rec.state==='sent';
}
el('check').onclick=async function(){
 if(busy)return;var rec=blocking();if(!rec)return;disable(true);message('בודק אישור שליחה בלבד, בלי לשלוח שוב…');
 try{var d=await req('lesson_mail_lookup',{request_id:rec.id});if(!d.ok)throw Error(errorText(d));if(d.state==='not_found'){message('אין עדיין אישור בשרת. לא נשלח עותק נוסף. יש לבדוק לפני ניסיון חדש.')}else confirmed(rec,d)}catch(e){message('לא ניתן לבדוק כרגע. לא נשלח עותק נוסף. '+e.message)}finally{disable(false)}
};
el('send').onclick=async function(){
 if(busy)return;
 var rec=null,posted=false;
 try{
  if(blocking())throw Error('יש בקשת שליחה ללא אישור סופי. לא נשלח עותק נוסף.');
  var c=course(chosenCourse),p=findP(chosenPlan),to=el('to').value.trim(),subject=el('subject').value.trim(),body=el('body').value;
  if(!c||!p)throw Error('יש לבחור קורס ושיעור');
  if(to!==String(c.contact&&c.contact.email||'').trim())throw Error('פרטי האחראי השתנו. פתח שוב את מסך השליחה');
  if(!to||!el('to').checkValidity())throw Error('שמור מייל תקין לאחראי בפרטי הקורס');
  if(!subject||!body.trim())throw Error('נדרשים נושא ותוכן לפני שליחה');
  var previous=journal().filter(function(r){return Number(r.courseId)===chosenCourse&&Number(r.planId)===chosenPlan&&r.state==='sent'}).slice(-1)[0];
  if(previous&&!confirm('השיעור כבר נשלח בעבר. לשלוח עותק חדש אל '+to+'?'))return;
  disable(true);message('בודק חיבור וקובץ לפני שליחה…');
  var check=await req('lesson_mail_status');if(!check.ok)throw Error(errorText(check));
  if(String(check.sender).toLowerCase()!==SENDER.toLowerCase())throw Error(errors.sender_mismatch);
  if(check.remaining<1)throw Error(errors.quota);
  var file=el('file').checked?await fileData(p):null;
  var payload={id:crypto.randomUUID(),created:Date.now(),courseId:c.id,planId:p.id,to:to,subject:subject,body:body,file:file};
  rec={id:payload.id,created:payload.created,courseId:c.id,planId:p.id,to:to,state:'pending'};
  updateRecord(rec); // If local journal cannot persist, do not POST a send.
  message('שולח מייל. לא ללחוץ שוב…');posted=true;
  var d=await req('lesson_mail_send',{payload:JSON.stringify(payload)});
  if(!d.ok){rec.state='failed';updateRecord(rec);throw Error(errorText(d))}
  confirmed(rec,d);
 }catch(e){if(posted&&rec&&rec.state==='pending'){rec.state='unknown';try{updateRecord(rec)}catch(x){}el('send').hidden=true;el('check').hidden=false;message('לא התקבל אישור סופי. ייתכן שהמייל נשלח. לא נשלח עותק נוסף. לחץ בדוק מצב שליחה.')}else message(e.name==='AbortError'?'בדיקת החיבור לא הושלמה. לא נשלח מייל.':e.message)}finally{disable(false)}
};
})();
