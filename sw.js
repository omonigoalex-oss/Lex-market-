const CACHE='lex-market-phase11-orders-flow-v2';
const SHELL=['./','index.html','products.html','categories.html','deals.html','product.html','cart.html','checkout.html','wishlist.html','account.html','tracking.html','confirmation.html','contact.html','seller.html','lx-console-7x3.html','compare.html','settings.html','support.html','seller-store.html','style.css','script.js','phase3.js','phase4.js','phase5.js','phase6.js','phase7.js','phase8.js','phase9.js','phase10.js','phase10.css','phase7.css','phase8.css','phase9.css','firebase-config.js','firebase-catalog.js','firebase-data.js','firebase-app.js','admin-firebase.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(x=>new Request(x,{cache:'reload'}))).catch(()=>{})).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request;
  event.respondWith(
    fetch(req).then(res=>{
      if(res.ok&&new URL(req.url).origin===location.origin){
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
      }
      return res;
    }).catch(()=>caches.open(CACHE).then(async c=>{
      let r=await c.match(req);
      if(r)return r;
      // Navigation URLs may contain query strings such as tracking.html?id=... .
      // Fall back to the cached pathname before sending the user to the homepage.
      if(req.mode==='navigate'){
        const url=new URL(req.url);
        r=await c.match(url.pathname.replace(/^\//,''));
        if(r)return r;
      }
      return c.match('index.html');
    }))
  );
});
