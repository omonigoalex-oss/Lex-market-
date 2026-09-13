import { collection, addDoc, getDocs, query, where, setDoc, doc, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

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

export async function getMyOrders(){
  const f=fb(); if(!f?.configured || !f.db || !f.user) return [];
  const q=query(collection(f.db,'orders'),where('customerId','==',f.user.uid));
  const snap=await getDocs(q);
  return snap.docs.map(d=>({firestoreId:d.id,...d.data(),date:d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()})).sort((a,b)=>new Date(b.date)-new Date(a.date));
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
    const rank={
      'Order Placed':0,
      'Processing':1,
      'Shipped':2,
      'Out for Delivery':3,
      'Delivered':4,
      'Cancelled':-1
    };
    if(order.sellerOrders.length){
      const statuses=order.sellerOrders.map(x=>x.status||'Order Placed');
      order.status=statuses.reduce((lowest,status)=>
        (rank[status]??0)<(rank[lowest]??0)?status:lowest, statuses[0]);
    }
  }catch(err){ console.warn('Seller order details unavailable:',err.message); order.sellerOrders=[]; }
  return order;
}

export async function updateMyProfile(name, phone){
  const f=requireUser();
  await setDoc(doc(f.db,'users',f.user.uid),{name,phone,updatedAt:serverTimestamp()},{merge:true});
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
