/* LEX Market Phase 10 — Final Marketplace Features & Polish */
(()=>{
'use strict';
const PREF='lexMarketPreferences';
const RECENT='lexMarketRecentlyViewed';
const get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₦'+Number(n||0).toLocaleString('en-NG');
const page=()=>location.pathname.split('/').pop().toLowerCase()||'index.html';
const prefs=()=>get(PREF,{reducedMotion:false,compact:false,notifications:true});
const products=()=>Array.isArray(window.lexProducts)?window.lexProducts:[];
function applyPrefs(){const p=prefs();document.documentElement.classList.toggle('p10-compact',!!p.compact);document.documentElement.classList.toggle('p10-reduced',!!p.reducedMotion);if(p.reducedMotion){document.documentElement.style.setProperty('scroll-behavior','auto')}}
function p10Toast(msg){let t=document.querySelector('.p10-toast');if(!t){t=document.createElement('div');t.className='p10-toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),1800)}
function initBackTop(){const b=document.querySelector('.p10-backtop');if(b)b.remove()}
function lazyImages(){document.querySelectorAll('img').forEach(img=>{if(!img.loading)img.loading='lazy';img.decoding='async'})}
function injectSettingsLink(){
 document.querySelectorAll('.footer-links').forEach(box=>{
   box.querySelectorAll('a[data-p10-settings="1"]').forEach(a=>a.remove());
 });
 const boxes=[...document.querySelectorAll('.footer-links')];
 const box=boxes.find(x=>/about\s+lex/i.test(x.querySelector('h3')?.textContent||''))||boxes[0];
 if(!box)return;
 if(box.querySelector('a[href="settings.html"]'))return;
 const a=document.createElement('a');
 a.href='settings.html';
 a.dataset.p10Settings='1';
 a.textContent='Settings';
 box.appendChild(a);
}

function advancedFilters(){
 if(page()!=='products.html'||document.getElementById('p10Filters'))return;
 const host=document.querySelector('#productsContainer')?.parentElement;if(!host)return;
 const bar=document.createElement('div');bar.id='p10Filters';bar.className='p10-tools';bar.innerHTML=`
  <input id="p10Search" class="p10-search-wide" type="search" placeholder="Search name, description or seller…">
  <input id="p10Min" type="number" min="0" placeholder="Min price">
  <input id="p10Max" type="number" min="0" placeholder="Max price">
  <select id="p10Rating"><option value="0">Any rating</option><option value="4">4★ & up</option><option value="4.5">4.5★ & up</option></select>
  <select id="p10Sort"><option value="relevance">Sort: Relevance</option><option value="price-low">Price: Low → High</option><option value="price-high">Price: High → Low</option><option value="rating">Top Rated</option><option value="newest">Newest</option><option value="discount">Biggest Discount</option></select>
  <label class="p10-check"><input id="p10Stock" type="checkbox"> In stock</label>
  <button id="p10Reset" class="p10-reset" type="button">Reset filters</button>`;
 host.insertBefore(bar,document.getElementById('productsContainer'));
 const params=new URLSearchParams(location.search);
 document.getElementById('p10Search').value=params.get('search')||document.getElementById('searchInput')?.value||'';
 document.getElementById('p10Min').value=params.get('min')||'';document.getElementById('p10Max').value=params.get('max')||'';document.getElementById('p10Rating').value=params.get('rating')||'0';document.getElementById('p10Sort').value=params.get('sort')||'relevance';document.getElementById('p10Stock').checked=params.get('stock')==='1';
 const rerender=()=>renderAdvancedProducts(false);
 ['p10Search','p10Min','p10Max'].forEach(id=>document.getElementById(id).addEventListener('input',rerender));['p10Rating','p10Sort','p10Stock'].forEach(id=>document.getElementById(id).addEventListener('change',rerender));
 document.getElementById('p10Reset').onclick=()=>{history.replaceState({},'',location.pathname);document.getElementById('p10Search').value='';document.getElementById('p10Min').value='';document.getElementById('p10Max').value='';document.getElementById('p10Rating').value='0';document.getElementById('p10Sort').value='relevance';document.getElementById('p10Stock').checked=false;renderAdvancedProducts(true)};
 renderAdvancedProducts(true);
}
function renderAdvancedProducts(updateUrl){
 const host=document.getElementById('productsContainer');if(!host)return;
 const active=document.querySelector('.filter.active')?.dataset.category||new URLSearchParams(location.search).get('category')||'All';
 const q=(document.getElementById('p10Search')?.value||'').trim().toLowerCase();const min=Number(document.getElementById('p10Min')?.value||0);const max=Number(document.getElementById('p10Max')?.value||0);const rating=Number(document.getElementById('p10Rating')?.value||0);const stock=document.getElementById('p10Stock')?.checked;const sort=document.getElementById('p10Sort')?.value||'relevance';
 let list=products().filter(p=>{const text=[p.name,p.description,p.category,p.sellerName].join(' ').toLowerCase();return (active==='All'||p.category===active)&&(!q||text.includes(q))&&(!min||Number(p.price)>=min)&&(!max||Number(p.price)<=max)&&(!rating||Number(p.rating||0)>=rating)&&(!stock||Number(p.stock||0)>0)});
 if(sort==='price-low')list.sort((a,b)=>Number(a.price)-Number(b.price));else if(sort==='price-high')list.sort((a,b)=>Number(b.price)-Number(a.price));else if(sort==='rating')list.sort((a,b)=>Number(b.rating)-Number(a.rating));else if(sort==='newest')list.sort((a,b)=>new Date(b.createdAt?.toDate?.()||b.createdAt||0)-new Date(a.createdAt?.toDate?.()||a.createdAt||0));else if(sort==='discount')list.sort((a,b)=>Number(b.discount)-Number(a.discount));
 const card=window.productCard||((p)=>`<article class="card"><div class="pic"><img class="product-image" loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}"></div><div class="card-body"><small>${esc(p.category)}</small><h3>${esc(p.name)}</h3><div class="price"><strong>${money(p.price)}</strong></div></div></article>`);
 host.innerHTML=list.map(p=>card(p)).join('');document.getElementById('noProducts')?.classList.toggle('hidden',list.length>0);const rc=document.getElementById('resultCount');if(rc)rc.textContent=list.length+' products';
 if(updateUrl){const u=new URL(location.href);if(q)u.searchParams.set('search',q);else u.searchParams.delete('search');if(active&&active!=='All')u.searchParams.set('category',active);if(min)u.searchParams.set('min',min);if(max)u.searchParams.set('max',max);if(rating)u.searchParams.set('rating',rating);if(sort!=='relevance')u.searchParams.set('sort',sort);if(stock)u.searchParams.set('stock','1');history.replaceState({},'',u.pathname+(u.search?'?'+u.searchParams.toString():''));}
 lazyImages();
}

function rememberView(p){if(!p)return;let a=get(RECENT,[]).filter(x=>String(x.id)!==String(p.id));a.unshift({id:p.id,name:p.name,image:p.image,price:p.price,category:p.category});save(RECENT,a.slice(0,8))}
function productEnhancements(){
 if(page()!=='product.html')return;
 const id=Number(new URLSearchParams(location.search).get('id'));const p=products().find(x=>Number(x.id)===id);if(!p)return;rememberView(p);
 const host=document.getElementById('productDetails');if(!host)return;
 const info=host.querySelector('.details-info');
 if(info&&!info.querySelector('.p10-variant-box')){
   const variants=Array.isArray(p.variants)?p.variants:(p.variantOptions||null);
   if(variants&&variants.length){const groups=variants[0]?.options?variants: [{name:'Options',options:variants}];const box=document.createElement('div');box.className='p10-variant-box';box.innerHTML='<h3>Choose your option</h3>'+groups.map((g,i)=>`<div class="p10-variant-group"><label>${esc(g.name||'Option')}</label><div class="p10-variant-options">${(g.options||[]).map((o,j)=>`<button type="button" class="p10-option ${j===0?'active':''}" data-group="${i}" data-value="${esc(typeof o==='string'?o:o.name||o.value||'Option')}">${esc(typeof o==='string'?o:o.name||o.value||'Option')}</button>`).join('')}</div></div>`).join('')+'<div class="p10-variant-note">Your selection will be saved with the cart item.</div>';info.insertBefore(box,info.querySelector('.add.big')?.parentElement||null);box.querySelectorAll('.p10-option').forEach(btn=>btn.onclick=()=>{box.querySelectorAll(`[data-group="${btn.dataset.group}"]`).forEach(x=>x.classList.remove('active'));btn.classList.add('active')});}
 }
 if(info&&!info.querySelector('.p10-seller-link')&&p.sellerId){const a=document.createElement('a');a.className='p10-seller-link';a.href='seller-store.html?sellerId='+encodeURIComponent(p.sellerId);a.textContent='🏪 Visit seller store';info.appendChild(a)}
 injectRecommendations(host,p);
}
function selectedVariant(){const box=document.querySelector('.p10-variant-box');if(!box)return '';return [...box.querySelectorAll('.p10-option.active')].map(x=>x.dataset.value).join(' / ')}
function injectRecommendations(host,p){if(host.querySelector('.p10-recommendations'))return;let list=products().filter(x=>x.id!==p.id&&(x.category===p.category||x.sellerId===p.sellerId||x.featured)).slice(0,4);const recent=get(RECENT,[]).filter(x=>x.id!==p.id).slice(0,4);if(!list.length)list=recent.map(x=>products().find(p2=>String(p2.id)===String(x.id))).filter(Boolean);if(!list.length)return;const section=document.createElement('section');section.className='p10-recommendations';section.innerHTML=`<div class="heading"><div><span class="eyebrow">YOU MAY ALSO LIKE</span><h2>Recommended for You</h2></div><a href="products.html?category=${encodeURIComponent(p.category)}">See More →</a></div><div class="grid product-grid">${list.map(p2=>window.productCard?p2&&window.productCard(p2):`<article class="card"><h3>${esc(p2.name)}</h3></article>`).join('')}</div>`;host.appendChild(section);lazyImages()}

function patchAddToCart(){
 if(window.lexPhase10AddToCart)return;
 window.lexPhase10AddToCart=(id,qty=1,variant='')=>{const p=products().find(x=>Number(x.id)===Number(id));if(!p)return;let c=get('lexMarketCart',[]);const key=String(id)+'::'+String(variant||'');let item=c.find(x=>String(x.id)+'::'+String(x.variant||'')===key);if(item)item.quantity+=Math.max(1,Number(qty)||1);else c.push({id:p.id,name:p.name,price:p.price,image:p.image,quantity:Math.max(1,Number(qty)||1),sellerId:p.sellerId||'',sellerName:p.sellerName||'LEX Seller',firestoreId:p.firestoreId||'',variant:variant||''});save('lexMarketCart',c);if(window.updateCounts)window.updateCounts();if(document.getElementById('cartContainer')&&window.renderCart)window.renderCart();p10Toast(p.name+(variant?' · '+variant:'')+' added to cart');};
 const original=window.addToCart;window.addToCart=(id,qty=1)=>{const variant=selectedVariant();if(variant)return window.lexPhase10AddToCart(id,qty,variant);if(original)return original(id,qty);return window.lexPhase10AddToCart(id,qty,'')};
}

function patchCartRenderer(){
 const host=document.getElementById('cartContainer');
 if(!host||host.dataset.p10CartReady)return;
 host.dataset.p10CartReady='1';
 const draw=()=>{
  const c=get('lexMarketCart',[]);
  if(!c.length){host.innerHTML='<div class="empty"><div>🛒</div><h2>Your Cart is Empty</h2><p>Add some products to your cart to get started.</p><a class="btn primary" href="products.html">Start Shopping</a></div>';return;}
  let sub=0;
  host.innerHTML=`<div class="cart-layout"><div class="cart-list">${c.map((x,i)=>{const p=products().find(y=>Number(y.id)===Number(x.id))||x,total=Number(x.price||p.price||0)*Number(x.quantity||1);sub+=total;return `<div class="cart-item"><div class="cart-img"><div class="product-photo"><img class="small-product-image" src="${esc(p.image||x.image||'')}" alt="${esc(p.name||x.name)}" loading="lazy" decoding="async"></div></div><div class="cart-info"><h3>${esc(p.name||x.name)}</h3>${x.variant?`<small class="p10-chip">${esc(x.variant)}</small>`:''}<strong>${money(p.price||x.price)}</strong></div><div class="cart-side"><div class="qty"><button onclick="lexP10CartQty(${i},-1)">−</button><b>${x.quantity}</b><button onclick="lexP10CartQty(${i},1)">+</button></div><strong>${money(total)}</strong><button class="remove" onclick="lexP10CartRemove(${i})">Remove</button></div></div>`}).join('')}</div><aside class="summary"><h2>Order Summary</h2><div><span>Subtotal</span><strong>${money(sub)}</strong></div><div><span>Delivery</span><strong>₦2,500</strong></div><div class="total"><span>Total</span><strong>${money(sub+2500)}</strong></div><a class="btn primary" href="checkout.html">Proceed to Checkout</a><a class="continue-shopping" href="products.html">Continue Shopping</a></aside></div>`;
  lazyImages();
 };
 window.lexP10CartQty=(i,d)=>{const c=get('lexMarketCart',[]);if(!c[i])return;c[i].quantity=Math.max(0,Number(c[i].quantity||1)+d);if(c[i].quantity===0)c.splice(i,1);save('lexMarketCart',c);draw();window.updateCounts?.()};
 window.lexP10CartRemove=(i)=>{const c=get('lexMarketCart',[]);if(!c[i])return;const n=c[i].name;c.splice(i,1);save('lexMarketCart',c);draw();window.updateCounts?.();p10Toast(n+' removed')};
 window.renderCart=draw;
 draw();
}

function settingsPage(){
 if(page()!=='settings.html')return;
 const host=document.getElementById('settingsContainer');if(!host)return;
 const p=prefs();
 const isAdmin=window.lexFirebase?.profile?.role==='admin';
 host.innerHTML=`<div class="p10-settings"><div class="p10-setting-card"><span class="eyebrow">PERSONALIZE LEX</span><h2>Settings & Preferences</h2><p class="muted">Control how LEX Market behaves on this device.</p><div class="p10-setting-row"><div><b>Reduced motion</b><small>Minimize animations and smooth scrolling.</small></div><button class="p10-switch ${p.reducedMotion?'on':''}" data-pref="reducedMotion" aria-label="Toggle reduced motion"></button></div><div class="p10-setting-row"><div><b>Compact shopping mode</b><small>Use a tighter layout on product pages.</small></div><button class="p10-switch ${p.compact?'on':''}" data-pref="compact" aria-label="Toggle compact mode"></button></div><div class="p10-setting-row"><div><b>Product notifications</b><small>Allow LEX alerts and local shopping notifications.</small></div><button class="p10-switch ${p.notifications?'on':''}" data-pref="notifications" aria-label="Toggle notifications"></button></div></div><div class="p10-setting-card"><h3>Shopping data</h3><p class="muted">Recently viewed products are stored only on this device.</p><button id="p10ClearRecent" class="btn secondary dark-outline">Clear recently viewed</button></div>${isAdmin?`<div class="p10-setting-card"><h3>Administration</h3><p class="muted">Admin controls are available for this account.</p><a class="btn primary" href="lx-console-7x3.html">⚙ Admin Dashboard</a></div>`:''}</div>`;
 host.querySelectorAll('[data-pref]').forEach(b=>b.onclick=()=>{const x=prefs(),k=b.dataset.pref;x[k]=!x[k];save(PREF,x);applyPrefs();settingsPage();p10Toast('Preference updated')});
 document.getElementById('p10ClearRecent').onclick=()=>{localStorage.removeItem(RECENT);p10Toast('Recently viewed cleared')};
}
if(!window.__lexAdminSettingsListener){window.__lexAdminSettingsListener=true;window.addEventListener('lex-auth-changed',()=>{if(page()==='settings.html')settingsPage()});}

function accountSettingsShortcut(){
 // Shopping Tools are rendered directly by renderAccount().
 // Do not inject a second copy into the profile card.
 return;
}
function init(){applyPrefs();injectSettingsLink();initBackTop();lazyImages();patchAddToCart();patchCartRenderer();advancedFilters();settingsPage();productEnhancements();
 document.addEventListener('click',e=>{const a=e.target.closest('a[href="settings.html"]');if(a&&page()==='settings.html')e.preventDefault()});
 window.addEventListener('lex-catalog-updated',()=>{advancedFilters();productEnhancements();lazyImages()});
 setTimeout(()=>{advancedFilters();productEnhancements();lazyImages()},700);setTimeout(()=>{advancedFilters();productEnhancements();},1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.lexPhase10={prefs,savePrefs:save,selectedVariant,rememberView,refresh:()=>{advancedFilters();productEnhancements()}};
})();
