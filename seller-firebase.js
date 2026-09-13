import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

function fb(){ return window.lexFirebase; }
function requireUser(){
  const f=fb();
  if(!f?.configured || !f.db || !f.user) throw new Error('Please sign in first.');
  return f;
}

window.lexSellerRequest=async function(data){
  const f=requireUser();
  const q=query(collection(f.db,'sellerRequests'),where('uid','==',f.user.uid));
  const existing=await getDocs(q);
  if(!existing.empty){
    const latest=existing.docs[0].data();
    if(latest.status==='pending') throw new Error('You already have a seller application waiting for review.');
  }
  await addDoc(collection(f.db,'sellerRequests'),{
    ...data,
    uid:f.user.uid,
    email:f.user.email||'',
    status:'pending',
    createdAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  });
};

window.lexSellerGetRequest=async function(){
  const f=fb();
  if(!f?.configured || !f.db || !f.user) return null;
  const q=query(collection(f.db,'sellerRequests'),where('uid','==',f.user.uid));
  const snap=await getDocs(q);
  if(snap.empty) return null;
  const rows=snap.docs.map(d=>({firestoreId:d.id,...d.data()}));
  rows.sort((a,b)=>{
    const ad=a.createdAt?.toMillis?.()||0, bd=b.createdAt?.toMillis?.()||0;
    return bd-ad;
  });
  return rows[0];
};

window.lexSellerAddProduct=async function(data){
  const f=requireUser();
  const profile=await getDoc(doc(f.db,'users',f.user.uid));
  if(!profile.exists() || profile.data().role!=='seller') throw new Error('Seller access is not approved yet.');
  const id=Date.now();
  await addDoc(collection(f.db,'products'),{
    id,
    name:data.name,
    price:Number(data.price),
    oldPrice:Number(data.oldPrice||data.price),
    category:data.category,
    stock:Number(data.stock||0),
    image:data.image||'',
    description:data.description||'',
    sellerId:f.user.uid,
    sellerName:data.sellerName||profile.data().name||'LEX Seller',
    approved:false,
    rating:0,
    reviews:0,
    createdAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  });
};

window.lexSellerGetProducts=async function(){
  const f=requireUser();
  const q=query(collection(f.db,'products'),where('sellerId','==',f.user.uid));
  const snap=await getDocs(q);
  return snap.docs.map(d=>({firestoreId:d.id,...d.data()})).sort((a,b)=>Number(b.id||0)-Number(a.id||0));
};

window.lexSellerUpdateProduct=async function(firestoreId,data){
  const f=requireUser();
  const ref=doc(f.db,'products',firestoreId);
  const snap=await getDoc(ref);
  if(!snap.exists() || snap.data().sellerId!==f.user.uid) throw new Error('You can only edit your own products.');
  await updateDoc(ref,{
    name:data.name,
    price:Number(data.price),
    oldPrice:Number(data.oldPrice||data.price),
    category:data.category,
    stock:Number(data.stock||0),
    image:data.image||'',
    description:data.description||'',
    updatedAt:serverTimestamp()
  });
};

window.lexSellerDeleteProduct=async function(firestoreId){
  const f=requireUser();
  const ref=doc(f.db,'products',firestoreId);
  const snap=await getDoc(ref);
  if(!snap.exists() || snap.data().sellerId!==f.user.uid) throw new Error('You can only delete your own products.');
  await deleteDoc(ref);
};


window.lexSellerGetOrders=async function(){
  const f=requireUser();
  const q=query(collection(f.db,'sellerOrders'),where('sellerId','==',f.user.uid));
  const snap=await getDocs(q);
  return snap.docs.map(d=>({firestoreId:d.id,...d.data()})).sort((a,b)=>{
    const ad=a.createdAt?.toMillis?.()||0, bd=b.createdAt?.toMillis?.()||0;
    return bd-ad;
  });
};

window.lexSellerUpdateOrderStatus=async function(orderId,status){
  const f=requireUser();
  const ref=doc(f.db,'sellerOrders',orderId);
  const snap=await getDoc(ref);
  if(!snap.exists() || snap.data().sellerId!==f.user.uid) throw new Error('You can only update orders for your own products.');
  await updateDoc(ref,{status,updatedAt:serverTimestamp()});
};
