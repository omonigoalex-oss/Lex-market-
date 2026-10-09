import { collection, addDoc, getDocs, query, where, setDoc, doc, deleteDoc, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

function fb(){ return window.lexFirebase; }
function requireUser(){ const f=fb(); if(!f?.configured || !f.db || !f.user) throw new Error('Please sign in first.'); return f; }

export async function saveOrder(order){
  const f=requireUser();
  const ref=await addDoc(collection(f.db,'orders'),{
    customerId:f.user.uid,
    orderId:order.id,
    customer:order.customer,
    items:order.items,
    total:order.total,
    subtotal:order.subtotal,
    deliveryFee:order.deliveryFee,
    payment:order.payment,
    paymentStatus:order.paymentStatus || (order.payment === 'Pay on Delivery' ? 'Pending' : 'Paid'),
    paymentReference:order.paymentReference || '',
    status:'Order Placed',
    createdAt:serverTimestamp()
  });

  // Create a private seller-order record for each seller represented in the cart.
  // This lets sellers see only the items/orders that belong to their store.
  const grouped=new Map();
  for(const item of (order.items||[])){
    const sellerId=item.sellerId;
    if(!sellerId) continue;
    if(!grouped.has(sellerId)) grouped.set(sellerId,[]);
    grouped.get(sellerId).push(item);
  }

  for(const [sellerId,items] of grouped){
    const subtotal=items.reduce((sum,item)=>sum+Number(item.price||0)*Number(item.quantity||1),0);
    const sellerName=items.find(x=>x.sellerName)?.sellerName||'LEX Seller';
    await addDoc(collection(f.db,'sellerOrders'),{
      orderId:order.id,
      parentOrderId:ref.id,
      customerId:f.user.uid,
      customer:order.customer,
      sellerId,
      sellerName,
      items,
      subtotal,
      total:subtotal,
      orderTotal:order.total,
      deliveryFee:order.deliveryFee,
      payment:order.payment,
      paymentStatus:order.paymentStatus || (order.payment === 'Pay on Delivery' ? 'Pending' : 'Paid'),
      paymentReference:order.paymentReference || '',
      status:'Order Placed',
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });
  }
  return ref.id;
}

function effectiveSellerStatus(statuses){
  const rank={
    'Order Placed':0,
    'Processing':1,
    'Shipped':2,
    'Out for Delivery':3,
    'Delivered':4
  };
  const list=(statuses||[]).map(s=>String(s||'Order Placed'));
  if(!list.length) return 'Order Placed';
  if(list.every(s=>s==='Cancelled')) return 'Cancelled';
  const active=list.filter(s=>s!=='Cancelled');
  return active.reduce((lowest,status)=>
    (rank[status]??0)<(rank[lowest]??0)?status:lowest, active[0]);
}

export async function getMyOrders(){
  const f=fb(); if(!f?.configured || !f.db || !f.user) return [];
  const q=query(collection(f.db,'orders'),where('customerId','==',f.user.uid));
  const snap=await getDocs(q);
  const orders=snap.docs.map(d=>({firestoreId:d.id,...d.data(),date:d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()}));

  // Seller fulfilment status is the live source for the customer's order timeline.
  // Load it once and merge it into every matching customer order so My Orders,
  // reviews and other customer flows do not stay stuck on "Order Placed".
  try{
    const sq=query(collection(f.db,'sellerOrders'),where('customerId','==',f.user.uid));
    const ss=await getDocs(sq);
    const byOrder=new Map();
    ss.docs.forEach(d=>{
      const row={firestoreId:d.id,...d.data()};
      const key=String(row.orderId);
      if(!byOrder.has(key)) byOrder.set(key,[]);
      byOrder.get(key).push(row.status||'Order Placed');
    });
    orders.forEach(o=>{
      const statuses=byOrder.get(String(o.orderId));
      if(statuses?.length) o.status=effectiveSellerStatus(statuses);
    });
  }catch(err){
    console.warn('Seller order status sync unavailable:',err.message);
  }
  return orders.sort((a,b)=>new Date(b.date)-new Date(a.date));
}

export async function getMyOrder(orderId){
  const f=fb(); if(!f?.configured || !f.db || !f.user) return null;
  // Do NOT query Firestore by orderId here because the orderId can be
  // stored as a number while the URL query parameter is always a string.
  // Load this customer's orders and compare the IDs as strings locally.
  const q=query(collection(f.db,'orders'),where('customerId','==',f.user.uid));
  const snap=await getDocs(q);
  const mine=snap.docs.find(d=>String(d.data().orderId)===String(orderId));
  if(!mine) return null;

  const order={firestoreId:mine.id,...mine.data(),date:mine.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()};
  try{
    // Query by customer only, then filter the order ID locally.
    // This avoids requiring a Firestore composite index for customerId + orderId.
    const sq=query(collection(f.db,'sellerOrders'),where('customerId','==',f.user.uid));
    const ss=await getDocs(sq);
    order.sellerOrders=ss.docs
      .map(d=>({firestoreId:d.id,...d.data()}))
      .filter(x=>String(x.orderId)===String(orderId));

    // Keep the main customer timeline synchronized with seller fulfilment.
    // For one seller, use that seller's status. For multiple sellers, use the
    // least advanced status so the order is not shown as completed too early.
    if(order.sellerOrders.length){
      order.status=effectiveSellerStatus(order.sellerOrders.map(x=>x.status||'Order Placed'));
    }
  }catch(err){ console.warn('Seller order details unavailable:',err.message); order.sellerOrders=[]; }
  return order;
}

export async function updateMyProfile(name, phone){
  const f=requireUser();
  await setDoc(doc(f.db,'users',f.user.uid),{name,phone,updatedAt:serverTimestamp()},{merge:true});
}

export async function getMyAddresses(){
  const f=requireUser();
  const q=query(collection(f.db,'addresses'),where('customerId','==',f.user.uid));
  const snap=await getDocs(q);
  return snap.docs.map(d=>({firestoreId:d.id,...d.data()})).sort((a,b)=>{
    if(Boolean(a.isDefault)!==Boolean(b.isDefault)) return a.isDefault?-1:1;
    return String(a.label||'').localeCompare(String(b.label||''));
  });
}

export async function saveMyAddress(address){
  const f=requireUser();
  const clean={
    customerId:f.user.uid,
    label:String(address.label||'Home').trim()||'Home',
    fullName:String(address.fullName||'').trim(),
    phone:String(address.phone||'').trim(),
    state:String(address.state||'').trim(),
    city:String(address.city||'').trim(),
    address:String(address.address||'').trim(),
    landmark:String(address.landmark||'').trim(),
    isDefault:Boolean(address.isDefault),
    updatedAt:serverTimestamp()
  };
  if(!clean.fullName || !clean.phone || !clean.state || !clean.city || !clean.address) throw new Error('Please complete all required address fields.');
  if(clean.isDefault){
    const current=await getMyAddresses();
    await Promise.all(current.filter(x=>x.isDefault && x.firestoreId!==address.firestoreId).map(x=>setDoc(doc(f.db,'addresses',x.firestoreId),{isDefault:false,updatedAt:serverTimestamp()},{merge:true})));
  }
  if(address.firestoreId){
    await setDoc(doc(f.db,'addresses',address.firestoreId),clean,{merge:true});
    return address.firestoreId;
  }
  const current=await getMyAddresses();
  if(!current.length) clean.isDefault=true;
  const ref=await addDoc(collection(f.db,'addresses'),{...clean,createdAt:serverTimestamp()});
  return ref.id;
}

export async function deleteMyAddress(addressId){
  const f=requireUser();
  const current=await getMyAddresses();
  const item=current.find(x=>x.firestoreId===addressId);
  if(!item) throw new Error('Address not found.');
  await deleteDoc(doc(f.db,'addresses',addressId));
  if(item.isDefault){
    const next=(await getMyAddresses())[0];
    if(next) await setDoc(doc(f.db,'addresses',next.firestoreId),{isDefault:true,updatedAt:serverTimestamp()},{merge:true});
  }
}

export async function getDefaultAddress(){
  const list=await getMyAddresses();
  return list.find(x=>x.isDefault)||list[0]||null;
}

export function watchMyOrder(orderId, callback){
  const f=fb();
  if(!f?.configured || !f.db || !f.user) return ()=>{};
  const q=query(collection(f.db,'sellerOrders'),where('customerId','==',f.user.uid));
  return onSnapshot(q, snap=>{
    const rows=snap.docs
      .map(d=>({firestoreId:d.id,...d.data()}))
      .filter(x=>String(x.orderId)===String(orderId));
    callback(rows);
  }, err=>console.warn('LEX live tracking error:',err.message));
}

export async function createCancellationRequest(orderId,reason,note=''){
  const f=requireUser();
  const order=await getMyOrder(orderId); if(!order) throw new Error('Order not found.');
  if(!['Order Placed','Processing'].includes(order.status)) throw new Error('This order is no longer eligible for cancellation.');
  const existing=await getMyOrderRequests(orderId);
  if(existing.some(x=>x.type==='Cancellation' && ['Pending','Open','In Progress'].includes(String(x.status||'')))) throw new Error('A cancellation request is already open for this order.');
  await addDoc(collection(f.db,'cancellationRequests'),{orderId:String(orderId),customerId:f.user.uid,reason,note,status:'Pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
}
export async function createReturnRequest(orderId,reason,note=''){
  const f=requireUser();
  const order=await getMyOrder(orderId); if(!order) throw new Error('Order not found.');
  if(order.status!=='Delivered') throw new Error('Returns are available after delivery.');
  const existing=await getMyOrderRequests(orderId);
  if(existing.some(x=>x.type==='Return / Refund' && ['Pending','Open','In Progress'].includes(String(x.status||'')))) throw new Error('A return/refund request is already open for this order.');
  await addDoc(collection(f.db,'returnRequests'),{orderId:String(orderId),customerId:f.user.uid,reason,note,status:'Pending',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
}
export async function createOrderIssue(orderId,type,message){
  const f=requireUser();
  const order=await getMyOrder(orderId); if(!order) throw new Error('Order not found.');
  const existing=await getMyOrderRequests(orderId);
  if(existing.some(x=>x.type==='Issue Report' && ['Open','Pending','In Progress'].includes(String(x.status||'')))) throw new Error('An issue report is already open for this order.');
  await addDoc(collection(f.db,'orderIssues'),{orderId:String(orderId),customerId:f.user.uid,type,message,status:'Open',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
}
export async function createSupportTicket(subject,category,message,orderId=''){
  const f=requireUser();
  await addDoc(collection(f.db,'supportTickets'),{customerId:f.user.uid,customerEmail:f.user.email||'',subject,category,message,orderId:String(orderId||''),status:'Open',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
}
export async function getProductReviews(productId){
  const f=fb(); if(!f?.configured || !f.db) return [];
  const q=query(collection(f.db,'reviews'),where('productId','==',String(productId)));
  const snap=await getDocs(q);
  return snap.docs.map(d=>({firestoreId:d.id,...d.data(),createdAt:d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()}))
    .filter(r=>r.status !== 'rejected')
    .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
}

export async function createProductReview(productId, productName, rating, comment, orderId){
  const f=requireUser();
  const clean=String(comment||'').trim();
  const score=Number(rating);
  if(!productId || !clean || !Number.isInteger(score) || score<1 || score>5) throw new Error('Please choose a rating and write a review.');
  if(!orderId) throw new Error('A delivered order for this product is required.');
  const orders=await getMyOrders();
  const order=orders.find(o=>String(o.orderId)===String(orderId));
  if(!order || order.status !== 'Delivered') throw new Error('You can review this product after your order is delivered.');
  if(!order.firestoreId) throw new Error('Order verification is unavailable. Please refresh and try again.');
  const purchased=(order.items||[]).some(item=>String(item.id ?? item.productId)===String(productId));
  if(!purchased) throw new Error('This product was not found in the selected order.');
  const existing=await getProductReviews(productId);
  if(existing.some(r=>r.customerId===f.user.uid && String(r.orderId)===String(orderId))) throw new Error('You already reviewed this purchase.');
  await addDoc(collection(f.db,'reviews'),{
    productId:String(productId), productName:String(productName||''), customerId:f.user.uid,
    customerName:f.user.displayName||f.user.email?.split('@')[0]||'LEX Customer', customerEmail:f.user.email||'',
    rating:score, comment:clean, orderId:String(orderId), firestoreOrderId:String(order.firestoreId), verifiedPurchase:true, status:'approved',
    createdAt:serverTimestamp(), updatedAt:serverTimestamp()
  });
}

export async function getMyOrderRequests(orderId){
  const f=fb(); if(!f?.configured||!f.db||!f.user)return [];
  const out=[];
  for(const name of ['cancellationRequests','returnRequests','orderIssues']){
    try{const q=query(collection(f.db,name),where('customerId','==',f.user.uid));const s=await getDocs(q);s.docs.filter(d=>String(d.data().orderId||'')===String(orderId)).forEach(d=>out.push({id:d.id,type:name==='cancellationRequests'?'Cancellation':name==='returnRequests'?'Return / Refund':'Issue Report',...d.data(),createdAt:d.data().createdAt?.toDate?.()?.toISOString()||new Date().toISOString()}));}catch(e){console.warn(name,e.message)}
  }
  return out.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
}
