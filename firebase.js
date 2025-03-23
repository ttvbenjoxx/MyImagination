// firebase.js
// MyImaginationBackup credentials + userManagement
// disclaimers -> intro -> sign in flow is in main.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getDatabase, ref, onValue, push, update, set, get, runTransaction } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC...CeaXh8n4",
  authDomain: "myimaginationbackup.firebaseapp.com",
  databaseURL: "https://myimaginationbackup-default-rtdb.firebaseio.com",
  projectId: "myimaginationbackup",
  storageBucket: "myimaginationbackup.firebasestorage.app",
  messagingSenderId: "780723525935",
  appId: "1:780723525935:web:151a6d230b3705852a29da"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

// Expose references globally
window.database = database;
window.ref = ref;
window.onValue = onValue;
window.push = push;
window.update = update;
window.set = set;
window.get = get;
window.runTransaction = runTransaction;

// Helper to sanitize email
window.sanitizeEmail = function(email) {
  return email.replace(/[.#$/\[\]]/g, "_");
};

// Monitor auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;
    window.currentUserId = user.uid;

    const userKey = window.sanitizeEmail(user.email);

    // Create userManagement node if missing
    set(ref(database, "userManagement/" + userKey + "/displayName"), user.displayName);

    // Load user’s liked posts
    const userLikesRef = ref(database, "userManagement/" + userKey + "/Likes");
    onValue(userLikesRef, (snapshot) => {
      const data = snapshot.val() || {};
      window.userLikes = new Set(Object.keys(data));
      window.renderIdeas();
    });

    // Unlock site & load data
    window.unlockSite();
    window.fetchIdeas();
    window.listenForCommentsCount();
  } else {
    // Not logged in => main.js shows disclaimers
  }
});

// The function main.js calls
window.firebaseLogin = function() {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      document.getElementById('username').textContent = user.displayName;
      document.getElementById('userProfile').style.display = 'flex';

      window.currentUserEmail = user.email;
      window.currentUserName = user.displayName;
      window.currentUserId = user.uid;

      const userKey = window.sanitizeEmail(user.email);
      // Create userManagement node
      set(ref(database, "userManagement/" + userKey + "/displayName"), user.displayName);

      // Load user’s liked posts
      const userLikesRef = ref(database, "userManagement/" + userKey + "/Likes");
      onValue(userLikesRef, (snapshot) => {
        const data = snapshot.val() || {};
        window.userLikes = new Set(Object.keys(data));
        window.renderIdeas();
      });

      // Unlock site & load data
      window.unlockSite();
      window.fetchIdeas();
      window.listenForCommentsCount();
    })
    .catch((error) => {
      console.error("Firebase login error:", error);
    });
};

// Logout
window.logout = function() {
  signOut(auth)
    .then(() => {
      location.reload();
    })
    .catch((error) => {
      console.error("Firebase logout error:", error);
    });
};
