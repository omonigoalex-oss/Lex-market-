import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { firebaseConfig, firebaseConfigured } from './firebase-config.js';

window.lexFirebase = { configured: firebaseConfigured, app: null, auth: null, db: null, user: null, profile: null };

if (firebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    window.lexFirebase.app = app;
    window.lexFirebase.auth = auth;
    window.lexFirebase.db = db;

    onAuthStateChanged(auth, async (user) => {
      window.lexFirebase.user = user || null;
      window.lexFirebase.profile = null;
      if (user) {
        try {
          const profileRef = doc(db, 'users', user.uid);
          let snap = await getDoc(profileRef);

          // Automatically create a customer profile when Auth exists but
          // the matching Firestore user document is missing.
          if (!snap.exists()) {
            await setDoc(profileRef, {
              name: user.displayName || 'LEX Customer',
              email: user.email || '',
              phone: '',
              role: 'customer',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
            snap = await getDoc(profileRef);
          }

          window.lexFirebase.profile = snap.exists() ? snap.data() : null;
        } catch (err) {
          console.warn('LEX profile sync failed:', err.message);
        }
      }
      window.dispatchEvent(new CustomEvent('lex-auth-changed', { detail: { user, profile: window.lexFirebase.profile } }));
      updateAuthUI(user, window.lexFirebase.profile);
    });
  } catch (err) {
    console.error('LEX Firebase initialization failed:', err);
    window.lexFirebase.error = err;
  }
} else {
  window.dispatchEvent(new CustomEvent('lex-firebase-unconfigured'));
}

function updateAuthUI(user, profile) {
  document.querySelectorAll('[data-auth-user]').forEach(el => {
    el.textContent = user ? (profile?.name || user.displayName || user.email || 'Account') : 'Guest';
  });
  document.querySelectorAll('[data-auth-action]').forEach(el => {
    el.textContent = user ? 'Sign Out' : 'Sign In';
    el.onclick = user ? async (e) => { e.preventDefault(); await signOut(window.lexFirebase.auth); location.href = 'index.html'; } : null;
  });
}

window.lexSignOut = async function () {
  if (window.lexFirebase?.auth) await signOut(window.lexFirebase.auth);
};

window.lexCreateUserProfile = async function (user, name, phone = '') {
  if (!window.lexFirebase?.db || !user) return;
  await setDoc(doc(window.lexFirebase.db, 'users', user.uid), {
    name: name || user.displayName || 'LEX Customer',
    email: user.email || '',
    phone,
    role: 'customer',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
};
