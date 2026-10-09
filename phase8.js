/* LEX MARKET — PHASE 8: ORDERS & SUPPORT */
(()=>{
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=()=>location.pathname.split('/').pop().toLowerCase()||'index.html';
const notify=(m,t='order')=>window.lexPhase7Notify?.(m,t);
const orderId=()=>new URLSearchParams(location.search).get('id');
const loadOrder=async()=>{
 const id=orderId(); if(!id||!window.lexFirebase?.user)return null;
 try{const m=await import('./firebase-data.js?p8='+Date.now());return await m.getMyOrder(id)}catch(e){console.warn(e);return null}
};
function modal(title,body,onSubmit){
 document.getElementById('p8Modal')?.remove();
 const d=document.createElement('div');d.id='p8Modal';d.className='p8-backdrop';
 d.innerHTML=`<div class="p8-modal"><button class="p8-x">×</button><span class="eyebrow">LEX CUSTOMER CARE</span><h2>${title}</h2>${body}</div>`;
 document.body.appendChild(d);d.querySelector('.p8-x').onclick=()=>d.remove();d.onclick=e=>{if(e.target===d)d.remove()};
 d.querySelector('form')?.addEventListener('submit',async e=>{e.preventDefault();const btn=d.querySelector('[type=submit]');if(btn)btn.disabled=true;try{await onSubmit(Object.fromEntries(new FormData(e.target)));d.remove()}catch(err){alert(err.message||'Could not submit request.');if(btn)btn.disabled=false}});
}
async function requestActions(o){
 const host=document.getElementById('p8OrderActions'); if(!host)return;
 const status=o?.status||'Order Placed';
 const canCancel=['Order Placed','Processing'].includes(status);
 const canReturn=status==='Delivered';
 host.innerHTML=`<div class="p8-actions-card"><div><span class="eyebrow">ORDER SUPPORT</span><h3>Need help with this order?</h3><p>Request a cancellation, return/refund, or report an issue.</p></div><div class="p8-action-grid">${canCancel?'<button class="p8-btn danger" id="p8Cancel">Cancel Order</button>':''}${canReturn?'<button class="p8-btn" id="p8Return">Return / Refund</button>':''}<button class="p8-btn" id="p8Issue">Report an Issue</button><a class="p8-btn outline" href="support.html?order=${encodeURIComponent(o.id||orderId()||'')}">Support Center</a></div><div id="p8RequestStatus"></div></div>`;
 host.querySelector('#p8Cancel')?.addEventListener('click',()=>modal('Cancel Order',`<p>Tell us why you want to cancel <b>${esc(o.id)}</b>.</p><form class="p8-form"><label>Reason<select name="reason" required><option value="Changed my mind">Changed my mind</option><option value="Ordered by mistake">Ordered by mistake</option><option value="Delivery is taking too long">Delivery is taking too long</option><option value="Other">Other</option></select></label><label>Additional note<textarea name="note" rows="4" placeholder="Optional"></textarea></label><button class="p8-btn danger" type="submit">Submit Cancellation</button></form>`,async data=>{const m=await import('./firebase-data.js');await m.createCancellationRequest(o.id,data.reason,data.note);notify(`Cancellation request submitted for ${o.id}`,'order');const fresh=await loadOrder();if(fresh)await requestActions(fresh);showStatus('Cancellation request submitted.')}));
 host.querySelector('#p8Return')?.addEventListener('click',()=>modal('Return / Refund Request',`<p>Request help with a delivered order.</p><form class="p8-form"><label>Reason<select name="reason" required><option>Item damaged</option><option>Wrong item received</option><option>Item not as described</option><option>Changed my mind</option><option>Other</option></select></label><label>Details<textarea name="note" rows="4" required placeholder="Describe the issue"></textarea></label><button class="p8-btn" type="submit">Submit Return Request</button></form>`,async data=>{const m=await import('./firebase-data.js');await m.createReturnRequest(o.id,data.reason,data.note);notify(`Return request submitted for ${o.id}`,'order');const fresh=await loadOrder();if(fresh)await requestActions(fresh);showStatus('Return/refund request submitted.')}));
 host.querySelector('#p8Issue')?.addEventListener('click',()=>modal('Report an Order Issue',`<p>We will attach this issue to order <b>${esc(o.id)}</b>.</p><form class="p8-form"><label>Issue type<select name="type" required><option>Delivery problem</option><option>Payment problem</option><option>Product problem</option><option>Seller problem</option><option>Other</option></select></label><label>Message<textarea name="message" rows="5" required placeholder="Tell us what happened"></textarea></label><button class="p8-btn" type="submit">Send Issue Report</button></form>`,async data=>{const m=await import('./firebase-data.js');await m.createOrderIssue(o.id,data.type,data.message);notify(`Issue report submitted for ${o.id}`,'order');const fresh=await loadOrder();if(fresh)await requestActions(fresh);showStatus('Issue report sent to customer support.')}));
 loadRequests(o.id);
}
function showStatus(msg){const x=document.getElementById('p8RequestStatus');if(x)x.innerHTML=`<div class="p8-success">✓ ${esc(msg)}</div>`}
async function loadRequests(id){try{const m=await import('./firebase-data.js?p8req='+Date.now());const r=await m.getMyOrderRequests(id);const host=document.getElementById('p8RequestStatus');if(!host)return;if(r.length)host.innerHTML=r.map(x=>`<div class="p8-request"><b>${esc(x.type)}</b><span>${esc(x.status||'Pending')}</span><small>${new Date(x.createdAt||Date.now()).toLocaleString()}</small></div>`).join('')}catch(e){}}
function injectTracking(){
 if(page()!=='tracking.html')return;
 const container=document.getElementById('trackingContainer');if(!container)return;
 const paint=async()=>{if(!container.querySelector('.tracking-card'))return;if(!container.querySelector('#p8OrderActions')){const card=container.querySelector('.tracking-card');const div=document.createElement('div');div.id='p8OrderActions';card.appendChild(div)}const o=await loadOrder();if(o)requestActions(o)};
 new MutationObserver(()=>{if(!container.querySelector('#p8OrderActions'))paint()}).observe(container,{childList:true,subtree:true});paint();
}
function injectSupportLinks(){
 document.querySelectorAll('.footer-links').forEach(f=>{if(/CUSTOMER CARE/i.test(f.querySelector('h3')?.textContent||'')&&!f.querySelector('.p8-support-link')){const a=document.createElement('a');a.className='p8-support-link';a.href='support.html';a.textContent='Support Center';f.appendChild(a)}});
}
function supportPage(){
 if(page()!=='support.html')return;
 const form=document.getElementById('p8SupportForm');if(!form||form.dataset.ready)return;form.dataset.ready='1';
 const orderParam=new URLSearchParams(location.search).get('order');
 if(orderParam){const field=form.querySelector('[name=orderId]');if(field)field.value=orderParam;}
 form.addEventListener('submit',async e=>{e.preventDefault();if(!window.lexFirebase?.user){alert('Please sign in to contact LEX Support.');location.href='auth.html?next=support.html';return}const data=Object.fromEntries(new FormData(form));const btn=form.querySelector('button');btn.disabled=true;try{const m=await import('./firebase-data.js');await m.createSupportTicket(data.subject,data.category,data.message,data.orderId||'');form.reset();document.getElementById('p8SupportMsg').textContent='✓ Support ticket submitted. Our support team can review it from the admin dashboard.';notify('Support ticket submitted','info')}catch(err){alert(err.message||'Could not submit ticket')}finally{btn.disabled=false}});
}
function run(){injectTracking();injectSupportLinks();supportPage()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
window.addEventListener('lex-auth-changed',run);
})();
