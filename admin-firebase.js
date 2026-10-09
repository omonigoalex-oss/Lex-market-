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
  if(f.user.email?.toLowerCase() !== 'omonigoalex@gmail.com') throw new Error('Admin access required.');
  return f;
}

window.lexAdminLoad = async function(){
  const f = requireAdmin();
  const [usersSnap, requestsSnap, productsSnap, ordersSnap, reportsSnap, ticketsSnap] = await Promise.all([
    getDocs(collection(f.db,'users')),
    getDocs(collection(f.db,'sellerRequests')),
    getDocs(collection(f.db,'products')),
    getDocs(collection(f.db,'orders')),
    getDocs(collection(f.db,'productReports')),
    getDocs(collection(f.db,'supportTickets'))
  ]);

  const users = usersSnap.docs.map(d=>({id:d.id,...d.data()}));
  const requests = requestsSnap.docs.map(d=>({firestoreId:d.id,...d.data()}));
  const products = productsSnap.docs.map(d=>({firestoreId:d.id,...d.data()}));
  const orders = ordersSnap.docs.map(d=>({firestoreId:d.id,...d.data()}));
  const reports = reportsSnap.docs.map(d=>({firestoreId:d.id,...d.data()}));
  const tickets = ticketsSnap.docs.map(d=>({firestoreId:d.id,...d.data()}));

  return {users, requests, products, orders, reports, tickets};
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


window.lexAdminSetFeatured = async function(productId, featured){
  const f = requireAdmin();
  await updateDoc(doc(f.db,'products',productId), {featured:!!featured, updatedAt:serverTimestamp()});
};

window.lexAdminUpdateStock = async function(productId, stock){
  const f = requireAdmin();
  await updateDoc(doc(f.db,'products',productId), {stock:Number(stock||0), updatedAt:serverTimestamp()});
};

window.lexAdminResolveProductReport = async function(reportId, status='resolved'){
  const f = requireAdmin();
  await updateDoc(doc(f.db,'productReports',reportId), {status, resolvedAt:serverTimestamp(), updatedAt:serverTimestamp()});
};

window.lexAdminUpdateSupportTicket = async function(ticketId, status){
  const f = requireAdmin();
  await updateDoc(doc(f.db,'supportTickets',ticketId), {status, updatedAt:serverTimestamp(), ...(status==='Resolved'?{resolvedAt:serverTimestamp()}:{})});
};
