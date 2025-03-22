// firebase.js
// MyImaginationBackup credentials + forced sign-in + userManagement likes loading
// Load this with: <script type="module" src="firebase.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getDatabase, ref, onValue, push, update, set, get, runTransaction } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

// Your MyImaginationBackup credentials
const firebaseConfig = {
  apiKey: "AIzaSyCzczvu3wHzJxzmZjN-swMmYglCeaXh8n4",
  authDomain: "myimaginationbackup.firebaseapp.com",
  databaseURL: "https://myimaginationbackup-default-rtdb.firebaseio.com",
  projectId: "myimaginationbackup",
  storageBucket: "myimaginationbackup.firebasestorage.app",
  messagingSenderId: "780723525935",
  appId: "1:780723525935:web:151a6d230b3705852a29da"
};

// Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

// Expose references so main.js can use them
window.database = database;
window.ref = ref;
window.onValue = onValue;
window.push = push;
window.update = update;
window.set = set;
window.get = get;
window.runTransaction = runTransaction;

/**
 * Local helper to sanitize an email into a valid RTDB key
 * (If you already define `window.sanitizeEmail` in main.js, you can remove this
 *  and just call `window.sanitizeEmail(user.email)` below.)
 */
function sanitizeEmail(email) {
  return email.replace(/[.#$/\[\]]/g, "_");
}

/**
 * Listen for auth changes: If user is signed in, load their liked posts from
 * userManagement/{email}/Likes, so we can highlight which posts are liked
 * (and prevent infinite re-likes).
 */
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Hide "Whoops!" modal if open
    window.hideModal('signedOutModal');

    // Show user info in top-right
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    // Store user info globally for main.js
    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;
    window.currentUserId = user.uid;

    // Load user’s liked posts from userManagement
    const userKey = sanitizeEmail(user.email);
    const userLikesRef = ref(database, "userManagement/" + userKey + "/Likes");
    onValue(userLikesRef, (snapshot) => {
      const data = snapshot.val() || {};
      // Convert object keys into a set for quick "has liked?" checks
      window.userLikes = new Set(Object.keys(data));
      // Re-render so liked hearts appear
      window.renderIdeas();
    });

    // Unlock site & load data
    window.unlockSite();
    window.fetchIdeas();
    window.listenForCommentsCount();
  } else {
    // Not logged in
    if (!localStorage.getItem('visited')) {
      // Show Intro (Welcome) if never visited
      window.showModal('introModal');
    } else {
      // Otherwise show "Whoops!"
      window.showModal('signedOutModal');
    }
  }
});

/**
 * Called by "Continue with Google" button
 * Once signInWithPopup resolves, we read user likes again
 * (Though onAuthStateChanged will also do it, so this is somewhat optional.)
 */
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
      window.currentUserId = result.user.uid;

      // Load user’s liked posts again
      const userKey = sanitizeEmail(result.user.email);
      const userLikesRef = ref(database, "userManagement/" + userKey + "/Likes");
      onValue(userLikesRef, (snapshot) => {
        const data = snapshot.val() || {};
        window.userLikes = new Set(Object.keys(data));
        window.renderIdeas();
      });

      // Unlock & fetch data
      window.unlockSite();
      window.fetchIdeas();
      window.listenForCommentsCount();
    })
    .catch((error) => {
      console.error("Firebase login error:", error);
    });
};

// Called when user confirms sign-out
window.logout = function() {
  signOut(auth)
    .then(() => {
      location.reload();
    })
    .catch((error) => {
      console.error("Firebase logout error:", error);
    });
};
