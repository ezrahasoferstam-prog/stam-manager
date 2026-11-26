/* שירות offline של האפליקציה. שחרור: release-20261126-icon-1
   עקרונות:
   1. גרסה היא חבילה שלמה. כל הקבצים מורדים ומאומתים מול רשימת הגיבובים של השחרור הזה לפני שנכתב אחד מהם למטמון.
      כשל (קובץ חסר או גיבוב שגוי) מבטל את ההתקנה, והגרסה התקינה הקודמת ממשיכה לעבוד, גם בלי אינטרנט.
   2. קבצי אפליקציה מוגשים רק מהמטמון המאומת של השחרור הפעיל. תגובות רשת של קבצי אפליקציה לעולם לא נכנסות למטמון ולא משמשות.
   3. שמות המטמונים נושאים את נתיב ההתקנה ואת השחרור. חיפוש, שמירה וניקוי נוגעים רק במטמונים של אותה התקנה.
   4. אינו שולח נתונים, אינו מסנכרן, ואינו נוגע בנתוני המשתמש או בשום אחסון אחר. */
var REL='release-20261126-icon-1';
var CORE=["./", "./index.html", "./7-stk-manifest.webmanifest", "./1-practice-feature.js", "./1-2-lesson-mail.js?v=20261117", "./offline-support.js", "./1-stk-32.png", "./3-stk-180.png", "./4-stk-192.png", "./5-stk-512.png", "./6-stk-maskable-512.png", "./1-7-hero-megillah.jpg", "./2-stk-48.png"];
var DIGESTS={
 "index.html": "118ce01980ffed2cd636bb3e6fc0a7aeb57d548c3b0254c63a646ea15a1c2f8d",
 "7-stk-manifest.webmanifest": "90881559eb1c1c1adc92216a1b9ec93ae5bfb0854c9427ad9ebbd613c1d20759",
 "1-practice-feature.js": "3dafe5a3dcfb7602e507f5901c61a1b6fc6858bd93f3271ec28176fdafcb7985",
 "1-2-lesson-mail.js": "ad1d3c8a2ab09db811177853238a0379b044ffce4d594abd42a9a9a48feb3ed5",
 "offline-support.js": "ac713d821dab3bad11a2a0c0b099d40adfc7f88a8b9a5e0deb85155f6e2d8e43",
 "1-stk-32.png": "0a1aa5d565f0f9975d74b2abbe43fbab0d72dfd6bc9618a2ef1384b7bb38ad1f",
 "3-stk-180.png": "dfa056f20c25bfbc172a38d629662f910c4d5a02d119fafe0d599c8c02632ae9",
 "4-stk-192.png": "5c3126add79c106e94e7b1c9709b1f07d6c5033d93c752b99793ee8324e47211",
 "5-stk-512.png": "56075ab4ca4d674c5db68893819e798218dd9b33817da395c537728428305ca3",
 "6-stk-maskable-512.png": "ac13856f7f7f578fb39e0b71ce2ad8fb00132dab7b8eb371ad9e356f40e110ef",
 "1-7-hero-megillah.jpg": "4927a609cfd4c053f1d8f4d6d4a2133abff5f51f7c38a60921eb74bb967530eb",
 "2-stk-48.png": "00c8cffdcf91a8328fc3556bf7050ee9ff71a41c678b503e13f830e034bccb74"
};
var SCOPE_URL=new URL('./',self.location.href),SCOPE=SCOPE_URL.pathname;
function slug(p){return p.replace(/[^A-Za-z0-9]/g,function(c){return '_'+c.charCodeAt(0).toString(16)})}
var SL=slug(SCOPE),APP_PREFIX='stam-shell-'+SL+'-app-',V=APP_PREFIX+REL,FONTS='stam-shell-'+SL+'-fonts',MARK='./__release__';
function hex(buf){return Array.prototype.map.call(new Uint8Array(buf),function(b){return ('0'+b.toString(16)).slice(-2)}).join('')}
function keyOf(u){var k=new URL(u,self.location.href).pathname.slice(SCOPE.length);return k||'index.html'}
function absOf(u){return new URL(u,self.location.href).href}
function digestOf(res){return res.clone().arrayBuffer().then(function(b){return crypto.subtle.digest('SHA-256',b)}).then(hex)}
/* מוריד קובץ מהרשת ומאמת מול רשימת השחרור. לא כותב כלום */
function fetchVerified(u){
  return fetch(u,{cache:'reload'}).then(function(r){
    if(!r.ok)throw new Error('missing '+u);
    return digestOf(r).then(function(d){var k=keyOf(u);if(!DIGESTS[k]||d!==DIGESTS[k])throw new Error('digest mismatch '+k);return r})});
}
self.addEventListener('install',function(e){
  e.waitUntil((function(){
    return caches.has(V).then(function(existed){
      if(existed)return caches.open(V).then(function(c){return validate(c,{rel:REL,urls:CORE,files:DIGESTS})}).then(function(ok){if(ok)return;return caches.delete(V).then(build)});
      return build();
    });
    function build(){
      /* שלב 1: מורידים ומאמתים הכול. עדיין לא נכתב דבר */
      return Promise.all(CORE.map(fetchVerified)).then(function(resps){
        /* שלב 2: כותבים את הכול, ובסוף חותמת שחרור. אם משהו נכשל, מוחקים את המטמון החלקי */
        return caches.open(V).then(function(c){
          return Promise.all(CORE.map(function(u,i){return c.put(u,resps[i])})).then(function(){
            return c.put(MARK,new Response(JSON.stringify({rel:REL,ts:Date.now(),urls:CORE,files:DIGESTS}),{headers:{'Content-Type':'application/json'}}));
          });
        }).catch(function(err){return caches.delete(V).then(function(){throw err})});
      });
    }
  })());
});
/* בודק שמטמון הוא שחרור שלם: חותמת קיימת, כל הקבצים ברשימה קיימים והגיבוב של כל אחד תואם */
function validate(c,meta){
  return Promise.all(meta.urls.map(function(u){
    return c.match(u).then(function(r){if(!r)return false;return digestOf(r).then(function(d){return d===meta.files[keyOf(u)]})}).catch(function(){return false});
  })).then(function(a){return a.every(Boolean)});
}
function metaOf(c){return c.match(MARK).then(function(m){return m?m.json():null}).catch(function(){return null})}
/* בוחר את השחרור שמשרת את כל הבקשות: הנוכחי אם הוא שלם ומאומת, אחרת שחרור קודם שלם ומאומת של אותה התקנה */
var chosen=null;
function choose(){
  if(chosen)return chosen;
  chosen=caches.keys().then(function(ks){
    var mine=ks.filter(function(n){return n.indexOf(APP_PREFIX)===0});
    return Promise.all(mine.map(function(n){return caches.open(n).then(function(c){return metaOf(c).then(function(m){return {n:n,c:c,m:m}})})})).then(function(list){
      list=list.filter(function(x){return x.m&&x.m.urls&&x.m.files});
      list.sort(function(a,b){return (a.n===V?-1:b.n===V?1:0)||(b.m.ts-a.m.ts)});
      var i=0;
      function next(){
        if(i>=list.length)return null;
        var x=list[i++];
        return validate(x.c,x.m).then(function(ok){return ok?x:next()});
      }
      return next();
    });
  }).then(function(x){return x?{name:x.n,cache:x.c,meta:x.m}:null});
  return chosen;
}
self.addEventListener('message',function(e){
  if(e.data==='SKIP_WAITING'){self.skipWaiting();return}
  /* דוח מוכנות offline: שלם רק אם יש שחרור מאומת במטמון (כל הקבצים קיימים והגיבוב תואם) */
  if(e.data&&e.data.type==='STAM_OFFLINE_STATUS'&&e.ports&&e.ports[0]){
    var port=e.ports[0];
    e.waitUntil(choose().then(function(sel){port.postMessage({complete:!!sel,release:sel?sel.meta.rel:null})}).catch(function(){port.postMessage({complete:false})}));
  }
});
self.addEventListener('activate',function(e){
  e.waitUntil(choose().then(function(sel){
    return caches.keys().then(function(ks){
      var rels=[];
      return Promise.all(ks.map(function(n){
        if(n.indexOf(APP_PREFIX)===0){return caches.open(n).then(metaOf).then(function(m){rels.push({n:n,ts:m?m.ts:0})})}
        /* מטמוני גרסאות קודמות (בלי נתיב בשם): נמחקים רק אם כל הרשומות בהם שייכות לנתיב הזה. אחרת לא נוגעים */
        if(n.indexOf('stam-shell-'+SCOPE+'-')===0){
          return caches.open(n).then(function(c){return c.keys().then(function(rq){
            if(sel&&rq.every(function(r){return r.url.indexOf(SCOPE_URL.href)===0}))return caches.delete(n);
          })});
        }
      })).then(function(){
        /* שומרים את השחרור הפעיל ועוד שחרור אחד קודם של אותה התקנה. שחרורים ישנים יותר נמחקים */
        rels.sort(function(a,b){return b.ts-a.ts});
        var keep={};keep[V]=1;if(sel)keep[sel.name]=1;
        rels.forEach(function(r){if(Object.keys(keep).length<2)keep[r.n]=1});
        return Promise.all(rels.filter(function(r){return !keep[r.n]}).map(function(r){return caches.delete(r.n)}));
      });
    });
  }).then(function(){return self.clients.claim()}));
});
function swrFont(req){
  return caches.open(FONTS).then(function(c){return c.match(req).then(function(hit){
    var net=fetch(req).then(function(r){if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(function(){return hit});
    return hit||net})});
}
self.addEventListener('fetch',function(e){
  var req=e.request;if(req.method!=='GET')return;
  var u=new URL(req.url);
  if(u.origin===location.origin){
    if(u.pathname.indexOf(SCOPE)!==0)return;
    var nav=req.mode==='navigate',k=nav?'index.html':keyOf(req.url);
    var inRel=nav||Object.prototype.hasOwnProperty.call(DIGESTS,k);
    if(!inRel)return; /* קובץ שאינו ברשימת השחרור: עובר לרשת כמו שהוא, לא נכנס למטמון */
    e.respondWith(choose().then(function(sel){
      if(!sel)return new Response('גרסת האפליקציה במטמון אינה שלמה. יש להתחבר לרשת ולרענן.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      var key=CORE.filter(function(x){return keyOf(x)===k})[0]||'./index.html';
      var target=(sel.meta.urls||CORE).filter(function(x){return keyOf(x)===k})[0]||key;
      return sel.cache.match(target).then(function(r){return r||new Response('חסר קובץ בגרסה המאומתת',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})});
    }));
    return}
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){e.respondWith(swrFont(req));return}
});
