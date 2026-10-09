/* LEX Market Phase 9 — Seller & Admin Power Tools */
(function(){
  const money=n=>'₦'+Number(n||0).toLocaleString('en-NG');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  window.lexPhase9={
    sellerAnalytics(products,orders){
      const revenue=orders.reduce((s,o)=>s+Number(o.total||0),0);
      const delivered=orders.filter(o=>o.status==='Delivered').length;
      const pending=orders.filter(o=>!['Delivered','Cancelled'].includes(o.status||'')).length;
      const low=products.filter(p=>Number(p.stock||0)<=5).length;
      return {revenue,delivered,pending,low};
    },
    adminAnalytics(users,products,orders){
      const revenue=orders.reduce((s,o)=>s+Number(o.total||0),0);
      const delivered=orders.filter(o=>o.status==='Delivered').length;
      const cancelled=orders.filter(o=>o.status==='Cancelled').length;
      const stock=products.reduce((s,p)=>s+Number(p.stock||0),0);
      const low=products.filter(p=>Number(p.stock||0)<=5).length;
      return {revenue,delivered,cancelled,stock,low,customers:users.filter(u=>u.role==='customer').length,sellers:users.filter(u=>u.role==='seller').length};
    }
  };
})();
