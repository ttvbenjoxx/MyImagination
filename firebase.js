// firebase.js
// MyImaginationBackup credentials + userManagement
// disclaimers -> intro -> sign in flow handled in main.js

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

window.database = database;
window.ref = ref;
window.onValue = onValue;
window.push = push;
window.update = update;
window.set = set;
window.get = get;
window.runTransaction = runTransaction;

function sanitizeEmail(email) {
  return email.replace(/[.#$/\[\]]/g, "_");
}

// If user is logged in, show their name, load ideas
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;
    window.currentUserId = user.uid;

    const userKey = sanitizeEmail(user.email);

    // Ensure userManagement node is created with displayName
    set(ref(database, "userManagement/" + userKey + "/displayName"), user.displayName);

    // Load user’s liked posts
    const userLikesRef = ref(database, "userManagement/" + userKey + "/Likes");
    onValue(userLikesRef, (snapshot) => {
      const data = snapshot.val() || {};
      window.userLikes = new Set(Object.keys(data));
      window.renderIdeas();
    });

    window.unlockSite();
    window.fetchIdeas();
    window.listenForCommentsCount();
  } else {
    // Not logged in => main.js shows intro + disclaimers
  }
});

// Called when disclaimers are accepted -> user clicks "Continue with Google"
window.firebaseLogin = function() {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      document.getElementById('username').textContent = user.displayName;
      document.getElementById('userProfile').style.display = 'flex';

      window.currentUserEmail = user.email;
      window.currentUserName = user.displayName;
      window.currentUserId = user.uid;

      const userKey = sanitizeEmail(user.email);

      // Ensure userManagement node is created with displayName
      set(ref(database, "userManagement/" + userKey + "/displayName"), user.displayName);

      // Load user’s liked posts
      const userLikesRef = ref(database, "userManagement/" + userKey + "/Likes");
      onValue(userLikesRef, (snapshot) => {
        const data = snapshot.val() || {};
        window.userLikes = new Set(Object.keys(data));
        window.renderIdeas();
      });

      // Now unlock site & load data
      window.unlockSite();
      window.fetchIdeas();
      window.listenForCommentsCount();
    })
    .catch((error) => {
      console.error("Firebase login error:", error);
    });
};

window.logout = function() {
  signOut(auth)
    .then(() => {
      location.reload();
    })
    .catch((error) => {
      console.error("Firebase logout error:", error);
    });
};
