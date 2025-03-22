// firebase.js
// (Type="module"): uses ES module imports from the old snippet

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getDatabase, ref, onValue, push, update, set, get, runTransaction } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

// The old config from your snippet
const firebaseConfig = {
  apiKey: "AIzaSyAOavNNa0NXASTHd--afy37aSIFYqvcacQ",
  authDomain: "myteacheropinion.firebaseapp.com",
  databaseURL: "https://myteacheropinion-default-rtdb.firebaseio.com",
  projectId: "myteacheropinion",
  storageBucket: "myteacheropinion.firebasestorage.app",
  messagingSenderId: "945674655787",
  appId: "1:945674655787:web:a59ef04ec9e843769bf26e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

// Expose references so main.js can see them
window.database = database;
window.ref = ref;
window.onValue = onValue;
window.push = push;
window.update = update;
window.set = set;
window.get = get;
window.runTransaction = runTransaction;

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Hide "Whoops!" modal
    window.hideModal('signedOutModal');

    // Show user name in top-right
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    // Expose user info globally
    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;

    // Unlock the site, fetch data, etc.
    window.unlockSite();
    fetchIdeas();
    listenForCommentsCount();
  } else {
    // Not logged in
    // If never visited, show Intro
    if (!localStorage.getItem('visited')) {
      window.showModal('introModal');
    } else {
      // Otherwise show "Whoops!"
      window.showModal('signedOutModal');
    }
  }
});

// Called by "Continue with Google" in Intro or Whoops modals
window.firebaseLogin = function() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // Hide "Whoops!" if open
      window.hideModal('signedOutModal');

      // Show user info
      document.getElementById('username').textContent = result.user.displayName;
      document.getElementById('userProfile').style.display = 'flex';

      window.currentUserEmail = result.user.email;
      window.currentUserName = result.user.displayName;

      // Unlock site
      window.unlockSite();
      fetchIdeas();
      listenForCommentsCount();
    })
    .catch((error) => {
      console.error("Firebase login error:", error);
    });
};

// Called by "Sign Out" button in the logout dropdown
window.logout = function() {
  signOut(auth)
    .then(() => {
      location.reload();
    })
    .catch((error) => {
      console.error("Firebase logout error:", error);
    });
};
