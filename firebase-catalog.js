import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
window.addEventListener('lex-auth-changed', loadCloudProducts);
window.addEventListener('load', loadCloudProducts);
async function loadCloudProducts(){
  const fb=window.lexFirebase;
  if(!fb?.configured||!fb.db||!window.lexProducts) return;
  try{
    const snap=await getDocs(query(collection(fb.db,'products'),where('approved','==',true)));
    let added=0;
    snap.forEach(d=>{
      const p=d.data();
      if(window.lexProducts.some(x=>String(x.id)===String(p.id||d.id))) return;
      window.lexProducts.push({
        id:Number(p.id)||900000+added+Date.now()%1000,
        name:p.name||'LEX Product',category:p.category||'Other',price:Number(p.price)||0,
        oldPrice:Number(p.oldPrice)||Number(p.price)||0,discount:Number(p.discount)||0,
        rating:Number(p.rating)||0,reviews:Number(p.reviews)||0,stock:Number(p.stock)||0,
        image:p.image||'🛍️',description:p.description||'LEX Market seller product.',sellerId:p.sellerId||'',sellerName:p.sellerName||'LEX Seller',firestoreId:d.id
      }); added++;
    });
    if(added&&typeof renderAll==='function') renderAll();
  }catch(err){ console.warn('Cloud catalog unavailable:',err.message); }
}
