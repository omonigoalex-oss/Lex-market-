import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
window.addEventListener('lex-auth-changed', loadCloudProducts);
window.addEventListener('load', loadCloudProducts);
async function loadCloudProducts(){
  const fb=window.lexFirebase, catalog=window.lexProducts;
  if(!fb?.configured || !fb.db || !Array.isArray(catalog)) return;
  try{
    const snap=await getDocs(query(collection(fb.db,'products'),where('approved','==',true)));
    let added=0;
    snap.forEach(d=>{
      const p=d.data(), id=Number(p.id)||900000+added+Date.now()%1000;
      const existing=catalog.find(x=>String(x.id)===String(p.id||d.id));
      if(existing){Object.assign(existing,{firestoreId:d.id,sellerId:p.sellerId||existing.sellerId||'',sellerName:p.sellerName||existing.sellerName||'LEX Seller',stock:Number(p.stock??existing.stock??0),updatedAt:p.updatedAt||existing.updatedAt||null});return;}
      catalog.push({id,name:p.name||'LEX Product',category:p.category||'Other',price:Number(p.price)||0,oldPrice:Number(p.oldPrice)||Number(p.price)||0,discount:Number(p.discount)||0,rating:Number(p.rating)||0,reviews:Number(p.reviews)||0,stock:Number(p.stock)||0,image:p.image||'',description:p.description||'Quality product from a verified LEX Market seller.',sellerId:p.sellerId||'',sellerName:p.sellerName||'LEX Seller',firestoreId:d.id,approved:true,approvalStatus:p.approvalStatus||'approved',createdAt:p.createdAt||null,updatedAt:p.updatedAt||null});
      added++;
    });
    window.lexProducts=catalog;
    window.dispatchEvent(new CustomEvent('lex-catalog-updated',{detail:{added}}));
    if(added&&typeof window.renderAll==='function') window.renderAll();
  }catch(err){console.warn('Cloud catalog unavailable:',err.message);window.dispatchEvent(new CustomEvent('lex-catalog-error',{detail:err}));}
}
