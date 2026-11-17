/* Stage one: offline readiness and honest local-save status.
   No network writes, backups, automatic uploads, credentials or pupil data. */
(function(){
 'use strict';
 if(window.stamOffline)return;
 var state={ready:false,setupError:false,saved:false,saveError:false,storageWarning:false};
 var panel=document.createElement('section');panel.id='offline-status';panel.setAttribute('aria-label','שמירה ועבודה בלי אינטרנט');panel.setAttribute('aria-live','polite');
 panel.style.cssText='margin:8px 0 12px;padding:12px;border:1px solid var(--line);border-radius:8px;font-size:14px;line-height:1.6';
 var main=document.querySelector('main');if(main)main.insertBefore(panel,document.getElementById('app')||null);
 function draw(){
  var lines=[navigator.onLine?'יש חיבור לרשת':'אין חיבור לרשת'];
  lines.push(state.ready?'פתיחה ללא אינטרנט מוכנה במכשיר הזה':state.setupError?'פתיחה ללא אינטרנט לא מוכנה. פתח שוב עם אינטרנט':'מכין פתיחה ללא אינטרנט…');
  lines.push(state.saveError?'השמירה בטלפון נכשלה. אל תסגור לפני יצירת גיבוי':state.saved?'השינוי נשמר בטלפון הזה':'שמור כל שינוי בכפתור השמירה הרגיל');
  lines.push('גיבוי אוטומטי לענן עדיין לא פעיל. חזרת החיבור אינה אישור לגיבוי');
  if(state.storageWarning)lines.push('האחסון במכשיר כמעט מלא. צור גיבוי ופנה מקום');
  panel.replaceChildren();lines.forEach(function(text,i){var p=document.createElement('div');p.textContent=text;if(i===2&&state.saveError)p.style.color='var(--red, #b00020)';panel.appendChild(p)});
 }
 var original=window.save;
 if(typeof original==='function')window.save=function(){try{var value=original.apply(this,arguments);state.saved=true;state.saveError=false;draw();return value}catch(error){state.saveError=true;state.saved=false;draw();throw error}};
 window.addEventListener('online',draw);window.addEventListener('offline',draw);
 function query(){
  var controller=navigator.serviceWorker.controller;if(!controller){state.ready=false;draw();return}
  var channel=new MessageChannel(),timer=setTimeout(function(){state.ready=false;state.setupError=true;draw()},5000);
  channel.port1.onmessage=function(e){clearTimeout(timer);state.ready=e.data?.complete===true;state.setupError=!state.ready;draw();channel.port1.close()};
  controller.postMessage({type:'STAM_OFFLINE_STATUS'},[channel.port2]);
 }
 async function start(){
  draw();
  if(!('serviceWorker' in navigator)||!window.isSecureContext){state.setupError=true;draw();return}
  setTimeout(function(){if(!state.ready){state.setupError=true;draw()}},15000);
  navigator.serviceWorker.addEventListener('controllerchange',query);
  if(navigator.serviceWorker.controller)query();
  try{var registration=await navigator.serviceWorker.register('./offline-shell-sw.js',{scope:'./',updateViaCache:'none'});await navigator.serviceWorker.ready;query();
   registration.addEventListener('updatefound',function(){var worker=registration.installing;if(worker)worker.addEventListener('statechange',function(){if(worker.state==='redundant'&&!navigator.serviceWorker.controller){state.setupError=true;draw()}})});
  }catch(error){if(!state.ready)state.setupError=true;draw()}
  try{var estimate=await navigator.storage.estimate();state.storageWarning=!!estimate.quota&&estimate.usage/estimate.quota>0.85;draw()}catch(error){}
 }
 window.stamOffline={version:'release-20261117-offline-1',status:function(){return Object.assign({},state)},recheck:query};start();
})();
