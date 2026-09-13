LEX MARKET — SELLER SYSTEM UPGRADE

This package keeps the existing LEX Market customer system and adds the seller workflow.

Seller features:
- Customer can apply to become a seller.
- Seller application is stored in Firestore sellerRequests/{id}.
- Seller sees application status.
- Once an admin changes the user's role to seller, the Seller Centre becomes a dashboard.
- Seller can add products.
- Seller can view their own products.
- Seller can edit their own products.
- Seller can delete their own products.
- New products start as approved:false and are intended for admin approval.
- Seller product data is stored in Firestore products/{id}.

IMPORTANT FIREBASE STEP:
The included firebase-rules.txt matches the current customer + seller schema. Publish the complete rules in Firebase Console > Firestore Database > Rules.

Current collections:
users/{uid}
sellerRequests/{id}
products/{id}
orders/{id}

Seller approval:
The Admin System is the next stage. For now, a customer application can be stored and reviewed in Firestore. The upcoming Admin System will provide the proper approval buttons and seller management screen.

ADMIN SYSTEM — NEW
------------------
The Admin Dashboard is now connected to Firebase and protected by the admin role.

Admin page: admin.html

Admin features:
- Dashboard statistics
- Customer/seller account overview
- Seller application review
- Approve seller (changes users/{uid}.role to seller)
- Reject seller application
- Product review
- Approve product for public catalog
- Reject/unapprove product
- Customer order list
- Update order status

ONE-TIME ADMIN SETUP
See ADMIN-SETUP.txt. The first admin role must be assigned manually in Firebase Console.
Do not add a public client-side button that changes a customer's role to admin.


PROFILE AUTO-SYNC FIX
If Firebase Authentication contains a user but Firestore users/{UID} is missing, the app now automatically creates the customer profile after sign-in. Google sign-in also avoids overwriting an existing role such as admin or seller.


PAYMENTS — PAYSTACK TEST SETUP
--------------------------------
1. Create/enable your Paystack account and copy ONLY the PUBLIC key (starts with pk_) from Settings → API Keys & Webhooks.
2. Open payment-config.js and paste the public key between the quotes.
3. Do NOT put the Paystack secret key (sk_) in the website files.
4. The checkout currently supports Paystack Popup payment plus Pay on Delivery.
5. Paystack may show the payment channels enabled for your account, including card, bank, USSD and transfer where supported.
6. IMPORTANT: this frontend callback marks a successful popup as Paid for the current development stage. Before a public production launch, add server-side transaction verification/webhooks so the secret key never reaches the browser and payment amount/status is verified on the server.
