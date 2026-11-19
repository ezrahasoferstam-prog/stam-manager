(function(){var st=document.createElement("style");st.textContent="@media(max-width:600px){.lesson-practice-row{display:flex;flex-direction:column;align-items:stretch}.lesson-practice-row>div:first-child{width:100%;min-width:0}.lesson-practice-row>div:last-child{display:flex;flex-wrap:wrap;align-items:center;gap:8px;border-top:1px solid var(--line);padding-top:8px}.lesson-practice-row>div:last-child br{display:none}}.practice-inline{padding:10px 0 6px;margin-top:6px;border-top:1px dashed var(--line)}.practice-inline b{font-size:13px}.practice-summary summary{cursor:pointer;font-weight:700;padding:10px 0}.practice-week{display:flex;align-items:center;justify-content:space-between;gap:5px;flex-wrap:wrap;font-size:12px}.practice-week .x{min-height:44px}.practice-summary .row{font-size:14px}";document.head.appendChild(st)})();

// Practice belongs to an existing lesson and its student, alongside their photos.
var practiceWeekOffsets={};
function practiceHas(q){return !!q&&typeof q.practiceMinutes==='number'&&isFinite(q.practiceMinutes)&&q.practiceMinutes>=0&&Math.floor(q.practiceMinutes)===q.practiceMinutes}
function practiceDuration(m){return Math.floor(m/60)+' שעות'+(m%60?' ו־'+m%60+' דקות':'')}
function practiceTarget(l,i,create){if(!l)return null;if(!l.all)return l;var n=stuList(l)[i];if(n===undefined)return null;return create?sget(l,n):((l.stu&&l.stu[n])||null)}
function practiceField(l,i){
 var q=practiceTarget(l,i,false),has=practiceHas(q),key=l.id+'_'+i;
 return '<div class="practice-inline"><b>זמן התרגול של התלמיד לשיעור הזה</b><div class="grid" style="margin-top:7px"><div><label for="ph_'+key+'">שעות</label><input id="ph_'+key+'" type="number" min="0" max="168" step="1" inputmode="numeric" placeholder="לא הוזן" value="'+(has?Math.floor(q.practiceMinutes/60):'')+'"></div><div><label for="pm_'+key+'">דקות</label><input id="pm_'+key+'" type="number" min="0" max="59" step="1" inputmode="numeric" placeholder="לא הוזן" value="'+(has?q.practiceMinutes%60:'')+'"></div></div><button type="button" class="add" onclick="savePractice('+l.id+','+i+')">שמור זמן תרגול</button>'+(has?'<div class="mut" style="margin-top:5px">נשמר: '+practiceDuration(q.practiceMinutes)+' <button type="button" class="x" onclick="clearPractice('+l.id+','+i+')">נקה רישום</button></div>':'')+'<div class="mut" style="margin-top:6px">נפרד משעות השיעור והחיוב. הסיכום השבועי לפי תאריך השיעור.</div></div>';
}
function savePractice(id,i){
 var l=findL(id),key=id+'_'+i,h=document.getElementById('ph_'+key),m=document.getElementById('pm_'+key);
 if(!l||!h||!m)return;
 if((h.value===''&&m.value==='')||!h.checkValidity()||!m.checkValidity()){toast('יש למלא זמן תקין. אפשר לרשום 0 במפורש.');return}
 var total=Number(h.value||0)*60+Number(m.value||0);
 if(!isFinite(total)||total<0||Math.floor(total)!==total||total>10080){toast('זמן התרגול צריך להיות בין 0 ל־168 שעות');return}
 var q=practiceTarget(l,i,true);if(!q)return;var before=q.practiceMinutes,had=Object.prototype.hasOwnProperty.call(q,'practiceMinutes');
 q.practiceMinutes=total;
 try{save();toast('זמן התרגול נשמר ✓')}catch(e){if(had)q.practiceMinutes=before;else delete q.practiceMinutes}
}
function clearPractice(id,i){var l=findL(id),q=practiceTarget(l,i,false);if(!q||!practiceHas(q))return;if(!confirm('לנקות רק את זמן התרגול? התמונה והשיעור יישארו.'))return;var old=q.practiceMinutes;delete q.practiceMinutes;try{save();document.querySelectorAll('[id^="ph_'+id+'_'+i+'"],[id^="pm_'+id+'_'+i+'"]').forEach(function(e){e.value=''})}catch(e){q.practiceMinutes=old}}
function practiceIso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function practiceWeek(cid){var d=new Date(today()+'T12:00:00');d.setDate(d.getDate()-d.getDay()+(practiceWeekOffsets[cid]||0));var a=practiceIso(d);d.setDate(d.getDate()+6);return {a:a,b:practiceIso(d)}}
function practiceRows(cid,w){var rows=[];S.lessons.forEach(function(l){if(l.course!==cid||!l.date||l.date<w.a||l.date>w.b)return;if(l.all){Object.keys(l.stu||{}).forEach(function(n){var q=l.stu[n];if(practiceHas(q))rows.push({student:n,minutes:q.practiceMinutes,lesson:l.id,date:l.date})})}else if(practiceHas(l)){rows.push({student:l.name,minutes:l.practiceMinutes,lesson:l.id,date:l.date})}});return rows}
function shiftPracticeWeek(cid,days){practiceWeekOffsets[cid]=(practiceWeekOffsets[cid]||0)+days;render()}
function practiceSummary(c){
 var w=practiceWeek(c.id),rows=practiceRows(c.id,w),tot=rows.reduce(function(a,r){return a+r.minutes},0),students=c.students.slice();rows.forEach(function(r){if(students.indexOf(r.student)<0)students.push(r.student)});
 return '<details class="practice-summary sub" '+(ocs['practice'+c.id]?'open':'')+' ontoggle="ocs[&quot;practice'+c.id+'&quot;]=this.open"><summary>תרגול שבועי · '+(rows.length?practiceDuration(tot):'טרם הוזן')+'</summary><div class="practice-week"><button type="button" class="x" aria-label="לשבוע הקודם" onclick="shiftPracticeWeek('+c.id+',-7)">שבוע קודם</button><span dir="ltr">'+w.a.split('-').reverse().join('.')+'–'+w.b.split('-').reverse().join('.')+'</span><button type="button" class="x" aria-label="לשבוע הבא" onclick="shiftPracticeWeek('+c.id+',7)">שבוע הבא</button></div>'+students.map(function(n){var r=rows.filter(function(x){return x.student===n});return '<div class="row"><b>'+esc(n)+'</b><span class="mut">'+(r.length?practiceDuration(r.reduce(function(a,x){return a+x.minutes},0)):'לא הוזן')+'</span></div>'}).join('')+'<p class="mut">זמני התרגול נרשמים ליד תמונות התלמיד בתוך השיעור, ולא כאן. השבוע הוא ראשון עד שבת, לפי תאריך השיעור. לא הוזן אינו אומר 0 שעות.</p></details>';
}


(function(){
 var oldLessonRow=lessonRow;lessonRow=function(l){var html=oldLessonRow(l),host=document.createElement('div');host.innerHTML=html;host.firstChild.classList.add('lesson-practice-row');if(!l.all)host.firstChild.firstChild.insertAdjacentHTML('beforeend',practiceField(l,-1));return host.innerHTML};
 var oldStuBlock=stuBlock;stuBlock=function(l){var html=oldStuBlock(l);if(!l.all||!ocs['L'+l.id])return html;var host=document.createElement('div');host.innerHTML=html;Array.from(host.querySelectorAll('.row')).forEach(function(row,i){row.firstChild.insertAdjacentHTML('beforeend',practiceField(l,i))});return host.innerHTML};
 var oldCourseBlock=courseBlock;courseBlock=function(c){var html=oldCourseBlock(c);if(!c.id||!ocs[c.id])return html;return html.replace('<div class="cb">','<div class="cb">'+practiceSummary(c))};
})();
function stuEntries(n){
  var out=[];
  S.lessons.forEach(function(l){
    var c=course(l.course),cn=c?c.name:'';
    if(!l.all&&l.name===n)out.push({d:l.date,cn:cn,t:l.topic,w:l.wrote||'',im:l.imgs||[],practice:practiceHas(l)?l.practiceMinutes:null});
    else if(l.all&&((c&&c.students.indexOf(n)>-1)||(l.stu&&l.stu[n]))){var q=(l.stu&&l.stu[n])||{};out.push({d:l.date,cn:cn,t:l.topic,w:q.wrote||'',im:q.imgs||[],practice:practiceHas(q)?q.practiceMinutes:null,g:true})}
  });
  out.sort(function(a,b){return a.d<b.d?1:a.d>b.d?-1:0});
  return out;
}
function stuRender(){
  var n=stuName,all=stuEntries(n),only=document.getElementById('stu_f').checked;
  var list=only?all.filter(function(e){return e.w||e.im.length||e.practice!==null}):all;
  var sf=sfList(n),photos=all.reduce(function(a,e){return a+e.im.length},0)+sf.length;
  document.getElementById('stu_t').textContent='תיק תלמיד · '+n;
  var h='<div class="mut">'+all.length+' שיעורים · '+photos+' תמונות</div>'+'<div class="row" style="display:block"><b>📞 טלפון לעדכוני שיעורים</b><input type="tel" id="stu_phone" inputmode="tel" dir="ltr" placeholder="05x-xxxxxxx" value="'+esc(getPhone(n))+'" onchange="setPhone(stuName,this.value)" style="margin-top:4px"><div class="mut">נשמר בנתוני המכשיר ובגיבוי הרגיל בלבד</div></div>'+stuTop(n,sf);
  h+=list.length?list.map(function(e){
    return '<div class="row" style="display:block"><b>'+fdate(e.d)+'</b> <span class="mut">'+(e.cn?esc(e.cn)+' · ':'')+(e.g?'שיעור קבוצתי · ':'')+(e.t?esc(e.t):'')+'</span>'+(e.practice!==null?'<div class="mut">תרגול: '+practiceDuration(e.practice)+'</div>':'')+(e.w?'<div style="white-space:pre-wrap;margin-top:2px">'+esc(e.w)+'</div>':'')+(e.im.length?'<div>'+e.im.map(function(id){return '<span class="th"><img data-iid="'+id+'" src="'+(isLocalImg(id)?'':'/_blob/'+id)+'" alt="" onclick="showImg(\''+id+'\')"></span>'}).join('')+'</div>':'')+'</div>';
  }).join(''):'<div class="empty">'+(all.length?'עדיין אין כתיבה או תמונות. הסר את הסימון למעלה כדי לראות את כל השיעורים.':'אין שיעורים לתלמיד הזה')+'</div>';
  document.getElementById('stu_b').innerHTML=h;hydrateImgs();
}

if(typeof render==='function')render();
