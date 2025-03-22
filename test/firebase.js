// firebase.js
// Taken from the old working code snippet, ensuring forced sign-in logic.

///////////////////////////////////////////////////////
// 1) Setup: Use the old firebase config and imports //
///////////////////////////////////////////////////////

// If you are not using ES modules in your HTML, remove "type='module'" and these imports, 
// then load the firebase compat scripts globally. For example:
//
// <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js"></script>
//
// Then you can do firebase.initializeApp(...) etc. 
// But if you DO want to keep them as ES modules, keep the structure below:

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getDatabase, ref, onValue, push, update, set, get, runTransaction } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

// The same config from your old code
const firebaseConfig = {
  apiKey: "AIzaSyAOavNNa0NXASTHd--afy37aSIFYqvcacQ",
  authDomain: "myteacheropinion.firebaseapp.com",
  databaseURL: "https://myteacheropinion-default-rtdb.firebaseio.com",
  projectId: "myteacheropinion",
  storageBucket: "myteacheropinion.firebasestorage.app",
  messagingSenderId: "945674655787",
  appId: "1:945674655787:web:a59ef04ec9e843769bf26e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);

// Expose them on window so main.js can see them
window.database = database;
window.ref = ref;
window.onValue = onValue;
window.push = push;
window.update = update;
window.set = set;
window.get = get;
window.runTransaction = runTransaction;

/////////////////////////////////////////
// 2) The forced sign-in logic itself. //
/////////////////////////////////////////

// Check user state whenever it changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    // Hide the "Whoops!" modal
    window.hideModal('signedOutModal');

    // Update top-right user info
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    // Store user info so main.js can use it
    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;

    // "Unlock" the site: show newIdeaBtn, fetch data, etc.
    window.unlockSite();
    fetchIdeas();
    listenForCommentsCount();

  } else {
    // User is not signed in
    // If they've never visited, show the Intro modal
    if (!localStorage.getItem('visited')) {
      window.showModal('introModal');
    } else {
      // Otherwise show "Whoops!" modal
      window.showModal('signedOutModal');
    }
  }
});

// Called by your "Continue with Google" button
window.firebaseLogin = function() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // Hide "Whoops!" if it was open
      window.hideModal('signedOutModal');

      // Show user info in UI
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

// Called by your "Sign Out" button
window.logout = function() {
  signOut(auth)
    .then(() => { location.reload(); })
    .catch((error) => { console.error("Firebase logout error:", error); });
};
