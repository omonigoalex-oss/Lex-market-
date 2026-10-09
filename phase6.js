/* LEX MARKET PHASE 6 — FINAL MARKETPLACE + PRODUCTION POLISH */
(()=>{
'use strict';
const page=()=>location.pathname.split('/').pop().toLowerCase()||'index.html';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const toast=(m)=>typeof window.showToast==='function'?window.showToast(m):null;

function injectShell(){
  if(!document.body)return;
  if(!qs('.skip-link')){const a=document.createElement('a');a.className='skip-link';a.href='#main';a.textContent='Skip to main content';document.body.prepend(a)}
  const main=qs('main');if(main&&!main.id)main.id='main';
  if(!qs('.lex6-progress')){const p=document.createElement('div');p.className='lex6-progress';document.body.appendChild(p)}
  if(!qs('.lex6-top')){const b=document.createElement('button');b.className='lex6-top';b.type='button';b.setAttribute('aria-label','Back to top');b.textContent='↑';document.body.appendChild(b);b.onclick=()=>window.scrollTo({top:0,behavior:'smooth'})}
  if(!qs('.lex6-status')){const s=document.createElement('div');s.className='lex6-status';s.setAttribute('role','status');document.body.appendChild(s)}
  if(!qs('.lex6-offline-note')&&main){const n=document.createElement('div');n.className='lex6-offline-note';n.textContent='You are offline. Saved cart, wishlist and browsing features still work, but live catalog/account data may be unavailable.';main.prepend(n)}
}
function pageTransition(){
  document.body.classList.add('lex6-page-enter');requestAnimationFrame(()=>document.body.classList.add('lex6-page-ready'));
  document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||a.target==='_blank'||a.hasAttribute('download')||a.href.startsWith('javascript:'))return;const u=new URL(a.href,location.href);if(u.origin!==location.origin)return;if(u.pathname===location.pathname&&u.hash)return;if(e.defaultPrevented)return;document.body.classList.remove('lex6-page-ready');document.body.classList.add('lex6-page-enter')},{capture:true});
}
function network(){
  const note=qs('.lex6-offline-note'),status=qs('.lex6-status');
  const render=()=>{const off=!navigator.onLine;if(note)note.classList.toggle('show',off);if(status){status.textContent=off?'You’re offline':'Back online';status.classList.toggle('offline',off);status.classList.add('show');clearTimeout(window.lex6StatusTimer);window.lex6StatusTimer=setTimeout(()=>status.classList.remove('show'),2200)}};
  window.addEventListener('offline',render);window.addEventListener('online',render);
  if(!navigator.onLine)render();
}
function scrollTools(){
  const b=qs('.lex6-top'),p=qs('.lex6-progress');
  const update=()=>{const h=document.documentElement.scrollHeight-window.innerHeight;const pct=h>0?(window.scrollY/h)*100:0;if(b)b.classList.toggle('show',window.scrollY>500);if(p)p.style.width=Math.min(100,Math.max(0,pct))+'%'};
  window.addEventListener('scroll',update,{passive:true});update();
}
function imageSafety(){
  qsa('img').forEach(img=>{img.loading=img.loading||'lazy';img.decoding='async';if(img.dataset.lex6Bound)return;img.dataset.lex6Bound='1';img.addEventListener('error',()=>{img.style.display='none';const box=img.closest('.product-photo,.details-pic,.pic,.cart-img,.wish-img,.seller-product-thumb,.admin-product-thumb');if(box){box.classList.add('lex6-image-fallback');if(!box.textContent.trim())box.textContent='▧'}})})
}
function footerYear(){qsa('.footer-bottom span').forEach(s=>{if(/©\s*20\d{2}\s+LEX Market/i.test(s.textContent))s.textContent=s.textContent.replace(/©\s*20\d{2}/,'© '+new Date().getFullYear())})}
function accessibility(){
  qsa('button').forEach(b=>{if(!b.getAttribute('aria-label')&&!b.textContent.trim()&&b.title)b.setAttribute('aria-label',b.title)});
  qsa('input[type="search"]').forEach(i=>{if(!i.getAttribute('aria-label'))i.setAttribute('aria-label','Search products')});
  qsa('a').forEach(a=>{if(a.textContent.trim()===''&&!a.getAttribute('aria-label')){const img=a.querySelector('img');if(img?.alt)a.setAttribute('aria-label',img.alt)}});
}
function deepLinks(){
  const p=new URLSearchParams(location.search);const search=p.get('q')||p.get('search');const cat=p.get('category');
  if(search){const input=qs('#searchInput');if(input){input.value=search;input.dispatchEvent(new Event('input',{bubbles:true}));setTimeout(()=>{const btn=qs('#searchButton');if(btn)btn.click()},80)}}
  if(cat){setTimeout(()=>{const f=qsa('[data-category]').find(x=>String(x.dataset.category).toLowerCase()===cat.toLowerCase());if(f)f.click()},120)}
}
function confirmTools(){
  if(page()!=='confirmation.html')return;
  const order=qs('#orderNumber');if(!order)return;
  const id=order.textContent.trim();if(!id||id.includes('#'))return;
  const box=order.parentElement;if(box&&!qs('.lex6-tools',box)){
    const tools=document.createElement('div');tools.className='lex6-tools';tools.innerHTML='<button type="button" class="lex6-copy">📋 Copy Order ID</button><a href="products.html">🛍 Keep Shopping</a>';
    box.appendChild(tools);
    qs('.lex6-copy',tools).onclick=async()=>{try{await navigator.clipboard.writeText(id);toast('Order ID copied');}catch{const t=document.createElement('textarea');t.value=id;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast('Order ID copied')}};
  }
}
function liveIndicator(){
  if(!navigator.onLine)return;
  const h=qs('.header-inner');if(h&&!qs('.lex6-live',h)){const s=document.createElement('span');s.className='lex6-live';s.innerHTML='<i></i> Live';s.title='LEX Market is online';s.style.cssText='margin-left:auto;align-self:center';h.appendChild(s)}
}
function errorGuard(){window.addEventListener('error',e=>{console.error('LEX Market:',e.error||e.message)},true);window.addEventListener('unhandledrejection',e=>{console.error('LEX Market promise:',e.reason)})}
function run(){injectShell();pageTransition();network();scrollTools();imageSafety();footerYear();accessibility();deepLinks();confirmTools();liveIndicator();errorGuard()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
window.addEventListener('load',()=>{imageSafety();deepLinks();confirmTools()});
})();
