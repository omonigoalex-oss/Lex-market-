import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

function fb(){ return window.lexFirebase; }

function requireAdmin(){
  const f = fb();
  if(!f?.configured || !f.db || !f.user) throw new Error('Please sign in first.');
  if(f.profile?.role !== 'admin') throw new Error('Admin access required.');
  return f;
}

window.lexAdminLoad = async function(){
  const f = requireAdmin();
  const [usersSnap, requestsSnap, productsSnap, ordersSnap] = await Promise.all([
    getDocs(collection(f.db,'users')),
    getDocs(collection(f.db,'sellerRequests')),
    getDocs(collection(f.db,'products')),
    getDocs(collection(f.db,'orders'))
  ]);

  const users = usersSnap.docs.map(d=>({id:d.id,...d.data()}));
  const requests = requestsSnap.docs.map(d=>({firestoreId:d.id,...d.data()}));
  const products = productsSnap.docs.map(d=>({firestoreId:d.id,...d.data()}));
  const orders = ordersSnap.docs.map(d=>({firestoreId:d.id,...d.data()}));

  return {users, requests, products, orders};
};

window.lexAdminApproveSeller = async function(requestId, uid){
  const f = requireAdmin();
  await updateDoc(doc(f.db,'users',uid), {
    role:'seller',
    updatedAt:serverTimestamp()
  });
  await updateDoc(doc(f.db,'sellerRequests',requestId), {
    status:'approved',
    reviewedAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  });
};

window.lexAdminRejectSeller = async function(requestId){
  const f = requireAdmin();
  await updateDoc(doc(f.db,'sellerRequests',requestId), {
    status:'rejected',
    reviewedAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  });
};

window.lexAdminApproveProduct = async function(productId){
  const f = requireAdmin();
  await updateDoc(doc(f.db,'products',productId), {
    approved:true,
    approvalStatus:'approved',
    reviewedAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  });
};

window.lexAdminRejectProduct = async function(productId){
  const f = requireAdmin();
  await updateDoc(doc(f.db,'products',productId), {
    approved:false,
    approvalStatus:'rejected',
    reviewedAt:serverTimestamp(),
    updatedAt:serverTimestamp()
  });
};

window.lexAdminUpdateOrderStatus = async function(orderId, status){
  const f = requireAdmin();
  await updateDoc(doc(f.db,'orders',orderId), {
    status,
    updatedAt:serverTimestamp()
  });
};
