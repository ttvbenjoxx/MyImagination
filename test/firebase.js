// firebase.js
// Uses MyImaginationBackup credentials + forced sign-in logic with localStorage

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getDatabase, ref, onValue, push, update, set, get, runTransaction } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

// Replace these with your actual MyImaginationBackup credentials:
const firebaseConfig = {
  apiKey: "AIzaSyCzczvu3wHzJxzmZjN-swMmYglCeaXh8n4",
  authDomain: "myimaginationbackup.firebaseapp.com",
  databaseURL: "https://myimaginationbackup-default-rtdb.firebaseio.com/",
  projectId: "myimaginationbackup",
  storageBucket: "myimaginationbackup.firebasestorage.app",
  messagingSenderId: "780723525935",
  appId: "1:780723525935:web:151a6d230b3705852a29da"
};

// 1) Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

// 2) Expose these references so your main.js can call them
window.database = database;
window.ref = ref;
window.onValue = onValue;
window.push = push;
window.update = update;
window.set = set;
window.get = get;
window.runTransaction = runTransaction;

// 3) Monitor auth state to force sign-in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Hide "Whoops!" modal if open
    window.hideModal('signedOutModal');

    // Show user info
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    // Store user info globally for your main.js usage
    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;

    // Unlock site, fetch data, etc.
    window.unlockSite();
    window.fetchIdeas();
    window.listenForCommentsCount();

  } else {
    // Not logged in
    // If never visited, show Intro
    if (!localStorage.getItem('visited')) {
      window.showModal('introModal');
    } else {
      // Already visited, show "Whoops!"
      window.showModal('signedOutModal');
    }
  }
});

// 4) Called when user clicks "Continue with Google"
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

      // Unlock site, fetch ideas, etc.
      window.unlockSite();
      window.fetchIdeas();
      window.listenForCommentsCount();
    })
    .catch((error) => {
      console.error("Firebase login error:", error);
    });
};

// 5) Called when user confirms sign-out
window.logout = function() {
  signOut(auth)
    .then(() => {
      location.reload();
    })
    .catch((error) => {
      console.error("Firebase logout error:", error);
    });
};
