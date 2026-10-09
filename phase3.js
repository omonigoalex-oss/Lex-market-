/* LEX MARKET PHASE 3 - syntax-safe legacy helpers */
(()=>{
'use strict';
const CART='lexMarketCart',WISH='lexMarketWishlist',SEARCH='lexMarketSearchHistory',VIEWED='lexMarketRecentlyViewed',DEAL='lexMarketDealEnd';
const get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const catalog=()=>Array.isArray(window.lexProducts)?window.lexProducts:[];
const money=n=>'₦'+Number(n||0).toLocaleString('en-NG');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').toLowerCase().trim();
const page=()=>location.pathname.split('/').pop().toLowerCase()||'index.html';
let state={search:new URLSearchParams(location.search).get('search')||'',category:new URLSearchParams(location.search).get('category')||'All',sort:new URLSearchParams(location.search).get('sort')||'featured',min:'',max:'',rating:'all',view:'grid'};
function cartCount(){return get(CART,[]).reduce((s,x)=>s+Number(x.quantity||0),0)}
function updateBadges(){
  document.querySelectorAll('.cart-link').forEach(link=>{
    let b=link.querySelector('.cart-badge');
    if(!b){b=document.createElement('span');b.className='cart-badge';link.appendChild(b)}
    const n=cartCount();
    b.textContent=n;
    b.classList.toggle('empty',n===0);
  });
  document.querySelectorAll('a[href="wishlist.html"]').forEach(a=>{
    a.removeAttribute('data-wishlist-count');
    const old=a.querySelector('.wishlist-badge');
    if(old)old.remove();
    const n=get(WISH,[]).length;
    if(n){const b=document.createElement('span');b.className='wishlist-badge';b.textContent=n;a.appendChild(b)}
  });
}
})();
