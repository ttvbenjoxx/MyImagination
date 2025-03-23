// firebase.js
// MyImaginationBackup credentials + forced sign-in + userManagement "likes" loading
// Load in index.html with: <script type="module" src="firebase.js"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getDatabase, ref, onValue, push, update, set, get, runTransaction } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

// 1) Your MyImaginationBackup credentials
const firebaseConfig = {
  apiKey: "AIzaSyCzczvu3wHzJxzmZjN-swMmYglCeaXh8n4",
  authDomain: "myimaginationbackup.firebaseapp.com",
  databaseURL: "https://myimaginationbackup-default-rtdb.firebaseio.com",
  projectId: "myimaginationbackup",
  storageBucket: "myimaginationbackup.firebasestorage.app",
  messagingSenderId: "780723525935",
  appId: "1:780723525935:web:151a6d230b3705852a29da"
};

// 2) Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

// 3) Expose references so main.js can call them
window.database = database;
window.ref = ref;
window.onValue = onValue;
window.push = push;
window.update = update;
window.set = set;
window.get = get;
window.runTransaction = runTransaction;

/**
 * Helper to sanitize an email into a valid RTDB key
 */
function sanitizeEmail(email) {
  return email.replace(/[.#$/\[\]]/g, "_");
}

/**
 * 4) Monitor auth state:
 *    - If user is signed in, check if they have "Consented" in userManagement
 *      If not, forcibly sign them out & show the intro flow again.
 *    - If user is not signed in, show "Intro" or "Whoops!" based on localStorage.
 */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Hide "Whoops!" if open
    window.hideModal('signedOutModal');

    // Check if user has "Consented"
    const userKey = sanitizeEmail(user.email);
    const userRef = ref(database, "userManagement/" + userKey);
    const snapshot = await get(userRef);
    const userData = snapshot.val() || {};

    if (!userData.Consented) {
      // If not consented, forcibly sign them out and show Intro flow again
      // so they can do the 2-step (Intro -> Consent) approach
      signOut(auth).then(() => {
        // Show the Intro modal again
        window.showModal('introModal');
      });
      return;
    }

    // If user has consented, proceed:
    // Show user info in top-right
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    // Store user info globally for main.js usage
    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;
    window.currentUserId = user.uid;

    // Load user’s liked posts from userManagement
    const userLikesRef = ref(database, "userManagement/" + userKey + "/Likes");
    onValue(userLikesRef, (snapshot) => {
      const data = snapshot.val() || {};
      // Convert object keys into a set so main.js can see which IDs are liked
      window.userLikes = new Set(Object.keys(data));
      // Re-render so liked hearts show up
      window.renderIdeas();
    });

    // Now unlock site & load data
    window.unlockSite();
    window.fetchIdeas();
    window.listenForCommentsCount();

  } else {
    // Not logged in
    if (!localStorage.getItem('visited')) {
      // Show Intro if never visited
      window.showModal('introModal');
    } else {
      // Show "Whoops!"
      window.showModal('signedOutModal');
    }
  }
});

/**
 * 5) Called by "Continue with Google" in the Consent Modal
 */
window.firebaseLogin = function() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // Once user is signed in, set "Consented: true" in userManagement
      const user = result.user;
      const userKey = sanitizeEmail(user.email);

      // Mark that they've consented
      set(ref(database, "userManagement/" + userKey + "/Consented"), true);

      // The onAuthStateChanged will proceed to unlock site if success
    })
    .catch((error) => {
      console.error("Firebase login error:", error);
    });
};

/**
 * 6) Called when user confirms sign-out
 */
window.logout = function() {
  signOut(auth)
    .then(() => {
      location.reload();
    })
    .catch((error) => {
      console.error("Firebase logout error:", error);
    });
};
