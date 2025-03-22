// firebase.js
// MyImaginationBackup credentials + forced sign-in approach w/ localStorage

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getDatabase, ref, onValue, push, update, set, get, runTransaction } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCzczvu3wHzJxzmZjN-swMmYglCeaXh8n4",
  authDomain: "myimaginationbackup.firebaseapp.com",
  databaseURL: "https://myimaginationbackup-default-rtdb.firebaseio.com",
  projectId: "myimaginationbackup",
  storageBucket: "myimaginationbackup.firebasestorage.app",
  messagingSenderId: "780723525935",
  appId: "1:780723525935:web:151a6d230b3705852a29da"
};

// 1) Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

// 2) Expose references so main.js can use them
window.database = database;
window.ref = ref;
window.onValue = onValue;
window.push = push;
window.update = update;
window.set = set;
window.get = get;
window.runTransaction = runTransaction;

// 3) Listen for auth changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Hide "Whoops!"
    window.hideModal('signedOutModal');

    // Show user info
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    // Expose user info
    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;
    window.currentUserId = user.uid;

    // Unlock site
    window.unlockSite();
    window.fetchIdeas();
    window.listenForCommentsCount();
  } else {
    // Not logged in
    if (!localStorage.getItem('visited')) {
      // Show Intro
      window.showModal('introModal');
    } else {
      // Show "Whoops!"
      window.showModal('signedOutModal');
    }
  }
});

// 4) Sign in
window.firebaseLogin = function() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // Hide "Whoops!"
      window.hideModal('signedOutModal');

      // Update UI
      document.getElementById('username').textContent = result.user.displayName;
      document.getElementById('userProfile').style.display = 'flex';

      window.currentUserEmail = result.user.email;
      window.currentUserName = result.user.displayName;
      window.currentUserId = result.user.uid;

      // Unlock site
      window.unlockSite();
      window.fetchIdeas();
      window.listenForCommentsCount();
    })
    .catch((error) => {
      console.error("Firebase login error:", error);
    });
};

// 5) Sign out
window.logout = function() {
  signOut(auth)
    .then(() => {
      location.reload();
    })
    .catch((error) => {
      console.error("Firebase logout error:", error);
    });
};
