/* LEX MARKET — PHASE 7: TRUST & CUSTOMER EXPERIENCE */
(()=>{
'use strict';
const ADDR='lexMarketSavedAddresses';
const COUPON='lexMarketCoupon';
const NOTIFS='lexMarketNotifications';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'₦'+Number(n||0).toLocaleString('en-NG');
const get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const page=()=>location.pathname.split('/').pop().toLowerCase()||'index.html';
const cart=()=>get('lexMarketCart',[]);
const products=()=>Array.isArray(window.lexProducts)&&window.lexProducts.length?window.lexProducts:(Array.isArray(window.products)?window.products:[]);
function notify(message,type='info'){const list=get(NOTIFS,[]);list.unshift({id:'n-'+Date.now()+'-'+Math.random().toString(36).slice(2),message,type,date:new Date().toISOString(),read:false});save(NOTIFS,list.slice(0,40));renderNotificationBell();}
window.lexPhase7Notify=notify;
function unread(){return get(NOTIFS,[]).filter(x=>!x.read).length}
function renderNotificationBell(){
  document.querySelectorAll('[data-p7-notifications]').forEach(host=>{
    host.innerHTML=`🔔<small>Alerts</small>${unread()?`<b class="p7-badge">${unread()>9?'9+':unread()}</b>`:''}`;
  });
}
function injectNotifications(){
  if(document.getElementById('p7Bell'))return;
  const actions=document.querySelector('header .actions');
  if(!actions)return;
  const a=document.createElement('a');a.href='#';a.id='p7Bell';a.dataset.p7Notifications='1';a.setAttribute('aria-label','Notifications');a.innerHTML='🔔<small>Alerts</small>';
  actions.insertBefore(a,actions.firstElementChild||null);
  a.addEventListener('click',e=>{e.preventDefault();openNotifications();});
  renderNotificationBell();
}
function notificationAction(n){
  const msg=String(n.message||'');
  if(n.url)return n.url;
  if(n.type==='order'){
    const m=msg.match(/Order\s+([A-Za-z0-9_-]+)/i);
    if(m)return `tracking.html?id=${encodeURIComponent(m[1])}`;
  }
  if(n.type==='promo')return 'deals.html';
  return '';
}
function openNotificationDetail(n){
  document.getElementById('p7NotificationDetail')?.remove();
  const url=notificationAction(n);
  const d=document.createElement('div');d.id='p7NotificationDetail';d.className='p7-modal-backdrop';
  d.innerHTML=`<div class="p7-modal"><button class="p7-close" type="button" data-close>×</button><span class="eyebrow">LEX MARKET</span><h2 style="margin:6px 0 8px">Notification Details</h2><div class="p7-notification" style="margin-top:16px"><span class="p7-notification-icon">${n.type==='order'?'📦':n.type==='promo'?'🎟️':'🔔'}</span><div><b>${esc(n.message)}</b><small>${new Date(n.date).toLocaleString()}</small></div></div><p style="margin-top:14px;color:#666;line-height:1.6">${n.type==='order'?'This notification is related to your order. You can open the order tracking page for the latest status.':n.type==='promo'?'This notification is related to a LEX Market promotion.':'This is a LEX Market account notification.'}</p>${url?`<a class="btn primary" style="display:inline-block;margin-top:12px" href="${esc(url)}">${n.type==='order'?'Track Order':'View Deals'}</a>`:''}</div>`;
  document.body.appendChild(d);d.querySelector('[data-close]').onclick=()=>d.remove();d.addEventListener('click',e=>{if(e.target===d)d.remove()});
}
function openNotifications(){
  document.getElementById('p7NotificationsModal')?.remove();
  const list=get(NOTIFS,[]);
  const d=document.createElement('div');d.id='p7NotificationsModal';d.className='p7-modal-backdrop';
  d.innerHTML=`<div class="p7-modal"><button class="p7-close" type="button">×</button><div class="p7-modal-head"><div><span class="eyebrow">LEX ALERTS</span><h2>Notifications</h2></div><button class="p7-link" id="p7ReadAll">Mark all read</button></div><div class="p7-notification-list">${list.length?list.map(n=>`<button type="button" class="p7-notification ${n.read?'read':''}" data-nid="${esc(n.id)}" style="text-align:left;width:100%;cursor:pointer"><span class="p7-notification-icon">${n.type==='order'?'📦':n.type==='promo'?'🎟️':'🔔'}</span><div><b>${esc(n.message)}</b><small>${new Date(n.date).toLocaleString()}</small><small style="color:#5b2be0;font-weight:700">Tap for details →</small></div></button>`).join(''):'<div class="p7-empty">No notifications yet.</div>'}</div></div>`;
  document.body.appendChild(d);
  d.querySelector('.p7-close').onclick=()=>d.remove();
  d.addEventListener('click',e=>{if(e.target===d)d.remove()});
  d.querySelector('#p7ReadAll').onclick=()=>{const x=get(NOTIFS,[]).map(n=>({...n,read:true}));save(NOTIFS,x);renderNotificationBell();openNotifications()};
  d.querySelectorAll('[data-nid]').forEach(el=>el.onclick=()=>{const id=el.dataset.nid;const n=list.find(x=>x.id===id);const x=get(NOTIFS,[]).map(v=>v.id===id?{...v,read:true}:v);save(NOTIFS,x);renderNotificationBell();el.classList.add('read');if(n)openNotificationDetail(n)});
}
window.lexP7GetNotifications=()=>get(NOTIFS,[]);

function injectCheckout(){
  if(page()!=='checkout.html')return;
  const form=document.getElementById('checkoutForm');
  if(!form||form.dataset.p7Ready)return;
  form.dataset.p7Ready='1';
  const info=form.querySelector('.checkout-card');
  if(info){
    const box=document.createElement('div');box.className='p7-address-tools';
    box.innerHTML=`<div class="p7-subhead"><div><b>Saved Addresses</b><small>Save your details for faster checkout.</small></div><button type="button" id="p7SaveAddress" class="p7-mini-btn">＋ Save current address</button></div><select id="p7AddressSelect"><option value="">Use a saved address…</option></select>`;
    info.appendChild(box);
    const select=box.querySelector('#p7AddressSelect');
    function refresh(){const a=get(ADDR,[]);select.innerHTML='<option value="">Use a saved address…</option>'+a.map((x,i)=>`<option value="${i}">${esc(x.name)} — ${esc(x.city)}, ${esc(x.state)}</option>`).join('');}
    refresh();
    select.onchange=()=>{const x=get(ADDR,[])[Number(select.value)];if(!x)return;for(const [k,v] of Object.entries(x)){const el=form.elements[k];if(el)el.value=v||'';}notify('Saved address applied');};
    box.querySelector('#p7SaveAddress').onclick=()=>{const data=Object.fromEntries(new FormData(form).entries());if(!data.name||!data.phone||!data.email||!data.state||!data.city||!data.address){alert('Please complete the delivery information first.');return;}const a=get(ADDR,[]);a.unshift({name:data.name,phone:data.phone,email:data.email,state:data.state,city:data.city,address:data.address,landmark:data.landmark||'',deliveryNote:data.deliveryNote||''});save(ADDR,a.slice(0,5));refresh();notify('Address saved for faster checkout');};
  }
  const summary=document.getElementById('checkoutSummary');
  if(summary){
    const wrap=document.createElement('div');wrap.className='p7-coupon-box';wrap.innerHTML=`<div class="p7-subhead"><div><b>Promo Code</b><small>Apply a valid LEX coupon to your order.</small></div></div><div class="p7-coupon-row"><input id="p7Coupon" placeholder="e.g. LEX10" autocomplete="off"><button type="button" id="p7ApplyCoupon">Apply</button></div><div id="p7CouponMessage"></div>`;
    summary.parentElement.insertBefore(wrap,summary);
    const saved=get(COUPON,null);if(saved)document.getElementById('p7Coupon').value=saved.code;
    document.getElementById('p7ApplyCoupon').onclick=()=>applyCoupon();
    updateCheckoutSummary();
  }
}
const coupons={
  LEX10:{type:'percent',value:10,min:20000,max:5000,label:'10% off (up to ₦5,000)'},
  WELCOME5:{type:'percent',value:5,min:10000,max:3000,label:'5% off (up to ₦3,000)'},
  LEX2000:{type:'fixed',value:2000,min:30000,max:2000,label:'₦2,000 off'}
};
function couponDiscount(sub){const c=get(COUPON,null);if(!c)return 0;const rule=coupons[String(c.code).toUpperCase()];if(!rule||sub<rule.min)return 0;return rule.type==='percent'?Math.min(sub*rule.value/100,rule.max):Math.min(rule.value,sub)}
window.lexOpenNotifications=openNotifications;
function applyCoupon(){const input=document.getElementById('p7Coupon'),msg=document.getElementById('p7CouponMessage');if(!input||!msg)return;const code=input.value.trim().toUpperCase(),rule=coupons[code];const sub=cart().reduce((s,x)=>s+Number(x.price||0)*Number(x.quantity||1),0);if(!rule){save(COUPON,null);msg.textContent='Invalid promo code. Try LEX10, WELCOME5 or LEX2000.';msg.className='error';updateCheckoutSummary();return;}if(sub<rule.min){save(COUPON,null);msg.textContent=`This code requires a minimum order of ${money(rule.min)}.`;msg.className='error';updateCheckoutSummary();return;}save(COUPON,{code,discount:couponDiscount(sub),label:rule.label});msg.textContent=`✓ ${rule.label} applied.`;msg.className='success';notify(`${code} promo code applied`,'promo');updateCheckoutSummary();}
function updateCheckoutSummary(){
  const s=document.getElementById('checkoutSummary');if(!s)return;const c=cart();const sub=c.reduce((sum,x)=>sum+Number(x.price||0)*Number(x.quantity||1),0),fee=2500,discount=couponDiscount(sub),total=Math.max(0,sub+fee-discount);const existing=s.querySelector('.p7-dynamic');if(existing)existing.remove();const d=document.createElement('div');d.className='p7-dynamic';d.innerHTML=`${discount?`<div class="p7-discount-line"><span>Promo discount</span><strong>−${money(discount)}</strong></div>`:''}<div class="total"><span>Total</span><strong>${money(total)}</strong></div>`;s.appendChild(d);const old=s.querySelector(':scope > .total:not(.p7-dynamic .total)');if(old)old.style.display='none';}
window.lexP7GetCheckoutDiscount=()=>{const c=cart(),sub=c.reduce((s,x)=>s+Number(x.price||0)*Number(x.quantity||1),0);return couponDiscount(sub)};
window.lexP7ClearCoupon=()=>save(COUPON,null);

async function productReviews(){
  if(page()!=='product.html')return;
  const host=document.getElementById('productDetails');if(!host||host.querySelector('.p7-reviews'))return;
  const id=Number(new URLSearchParams(location.search).get('id')),p=products().find(x=>Number(x.id)===id);if(!p)return;
  let reviews=[];try{const m=await import('./firebase-data.js?reviews='+Date.now());reviews=await m.getProductReviews(id)}catch(e){console.warn('Reviews unavailable',e)}
  const avg=reviews.length?reviews.reduce((s,x)=>s+Number(x.rating||0),0)/reviews.length:Number(p.rating||0);
  const box=document.createElement('section');box.className='p7-reviews';box.innerHTML=`<div class="p7-review-head"><div><span class="eyebrow">REAL SHOPPER FEEDBACK</span><h2>Customer Reviews</h2></div><div class="p7-average"><b>★ ${avg.toFixed(1)}</b><span>${reviews.length} review${reviews.length===1?'':'s'}</span></div></div><div class="p7-review-list">${reviews.length?reviews.map(r=>`<article class="p7-review"><div><b>${esc(r.customerName||'LEX Customer')}</b><span>${'★'.repeat(Number(r.rating||0))}${'☆'.repeat(5-Number(r.rating||0))}</span><small>✓ Verified purchase · ${new Date(r.createdAt||Date.now()).toLocaleDateString()}</small></div><p>${esc(r.comment)}</p></article>`).join(''):'<div class="p7-empty">No customer reviews yet. Be the first verified buyer to review this product.</div>'}</div><div id="p7ReviewAction"></div>`;
  host.appendChild(box);
  const action=box.querySelector('#p7ReviewAction');
  if(!window.lexFirebase?.user){action.innerHTML='<p class="p7-note">Sign in and purchase this product to leave a verified review.</p>';return;}
  let eligible=[];try{const m=await import('./firebase-data.js?eligibility='+Date.now());eligible=await m.getReviewEligibleProducts();}catch(e){}
  const match=eligible.find(x=>String(x.productId)===String(id));
  if(!match){action.innerHTML='<p class="p7-note">Only customers who purchased this product can leave a verified review.</p>';return;}
  action.innerHTML=`<form id="p7ReviewForm" class="p7-review-form"><h3>Review your purchase</h3><input type="hidden" name="orderId" value="${esc(match.orderId)}"><div class="p7-stars" role="radiogroup" aria-label="Rating">${[1,2,3,4,5].map(n=>`<button type="button" data-star="${n}" aria-label="${n} stars">★</button>`).join('')}</div><input type="hidden" name="rating" value="5"><textarea name="comment" maxlength="500" placeholder="Tell other shoppers what you think..." required></textarea><button class="btn primary" type="submit">Submit Verified Review</button></form>`;
  box.querySelectorAll('[data-star]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.star);box.querySelector('[name=rating]').value=n;box.querySelectorAll('[data-star]').forEach(x=>x.classList.toggle('active',Number(x.dataset.star)<=n))});box.querySelectorAll('[data-star]').forEach(x=>x.classList.add('active'));
  box.querySelector('#p7ReviewForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);try{const m=await import('./firebase-data.js?submitreview='+Date.now());await m.submitProductReview(id,Number(fd.get('rating')),String(fd.get('comment')).trim(),String(fd.get('orderId')));notify('Your verified review was submitted','order');action.innerHTML='<p class="p7-success">✓ Thanks! Your verified review is now submitted for moderation.</p>';setTimeout(()=>location.reload(),500);}catch(err){alert(err.message||'Could not submit review.')}};
}

function receipt(){
 if(page()!=='confirmation.html')return;const id=new URLSearchParams(location.search).get('id');const host=document.querySelector('.success-card');if(!host||host.querySelector('.p7-receipt'))return;const o=get('lexMarketOrders',[]).find(x=>String(x.id)===String(id));if(!o)return;
 const box=document.createElement('div');box.className='p7-receipt';box.innerHTML=`<div class="p7-receipt-head"><div><span class="eyebrow">ORDER RECEIPT</span><h2>Order ${esc(o.id)}</h2></div><button class="p7-mini-btn" id="p7Print">🖨 Print</button></div><div class="p7-receipt-grid"><div><small>Customer</small><b>${esc(o.customer?.name||'')}</b><span>${esc(o.customer?.phone||'')}</span><span>${esc(o.customer?.email||'')}</span></div><div><small>Delivery</small><b>${esc(o.customer?.address||'')}</b><span>${esc(o.customer?.city||'')}, ${esc(o.customer?.state||'')}</span>${o.customer?.landmark?`<span>${esc(o.customer.landmark)}</span>`:''}</div></div><div class="p7-items">${(o.items||[]).map(x=>`<div><span>${esc(x.name)} × ${x.quantity}</span><b>${money(Number(x.price)*Number(x.quantity))}</b></div>`).join('')}</div><div class="p7-receipt-total"><span>Subtotal</span><b>${money(o.subtotal)}</b><span>Delivery</span><b>${money(o.deliveryFee)}</b>${o.discount?`<span>Discount</span><b>−${money(o.discount)}</b>`:''}<strong>Total</strong><strong>${money(o.total)}</strong></div>`;host.appendChild(box);box.querySelector('#p7Print').onclick=()=>window.print();notify(`Order ${o.id} has been placed successfully`,'order');
}

async function detectOrderStatus(){
 if(page()!=='tracking.html')return;const id=new URLSearchParams(location.search).get('id');if(!id||!window.lexFirebase?.user)return;try{const m=await import('./firebase-data.js?notify='+Date.now());const o=await m.getMyOrder(id);if(!o)return;const key='lexMarketStatus-'+id,old=localStorage.getItem(key);const now=o.status||'Order Placed';if(old&&old!==now)notify(`Order ${id} is now ${now}.`,'order');localStorage.setItem(key,now);}catch(e){}
}
function run(){injectNotifications();injectCheckout();productReviews();receipt();detectOrderStatus();}
window.addEventListener('lex-auth-changed',run);window.addEventListener('lex-catalog-updated',run);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
