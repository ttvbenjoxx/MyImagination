// firebase.js
// Put your Firebase config, signIn/out logic, and onAuthStateChanged here.

// Import from CDN (if you prefer ES modules, you'd do that differently)
// This file is included via <script src="firebase.js"></script> in index.html

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCzczvu3wHzJxzmZjN-swMmYglCeaXh8n4",
  authDomain: "myimaginationbackup.firebaseapp.com",
  projectId: "myimaginationbackup",
  storageBucket: "myimaginationbackup.firebasestorage.app",
  messagingSenderId: "780723525935",
  appId: "1:780723525935:web:151a6d230b3705852a29da",
  databaseURL: "https://myimaginationbackup-default-rtdb.firebaseio.com/"
};

// Using the 11.4.0 scripts in index.html
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.getAuth(app);
const provider = new firebase.GoogleAuthProvider();
const database = firebase.getDatabase(app);

// Expose references on window so main.js can use them
window.database = database;
window.ref = firebase.ref;
window.onValue = firebase.onValue;
window.push = firebase.push;
window.update = firebase.update;
window.set = firebase.set;
window.get = firebase.get;
window.runTransaction = firebase.runTransaction;

// Keep references to signIn/out globally
window.firebaseLogin = function() {
  firebase.signInWithPopup(auth, provider)
    .then((result) => {
      window.hideModal('signedOutModal');
      document.getElementById('username').textContent = result.user.displayName;
      document.getElementById('userProfile').style.display = 'flex';
      window.currentUserEmail = result.user.email;
      window.currentUserName = result.user.displayName;
      window.currentUserId = result.user.uid;
      const userKey = window.sanitizeEmail(result.user.email);
      const userLikesRef = window.ref(database, "userManagement/" + userKey + "/Likes");
      window.onValue(userLikesRef, (snapshot) => {
        const likesData = snapshot.val() || {};
        window.userLikes = new Set(Object.keys(likesData));
        window.renderIdeas(); // Re-render to reflect liked states
      });
      window.unlockSite();    // Unlock UI
      window.fetchIdeas();    // Fetch ideas from DB
      window.listenForCommentsCount(); // Start comment listener

      // If user is brand new, show tutorial
      if (result.additionalUserInfo && result.additionalUserInfo.isNewUser) {
        window.startTutorial();
      }
    })
    .catch((error) => {
      console.error("Firebase login error:", error);
    });
};

window.logout = function() {
  firebase.signOut(auth)
    .then(() => {
      location.reload();
    })
    .catch((error) => {
      console.error("Firebase logout error:", error);
    });
};

// Track user state
firebase.onAuthStateChanged(auth, (user) => {
  if (user) {
    // Already handled signIn logic above, but in case of page refresh:
    window.hideModal('signedOutModal');
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';
    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;
    window.currentUserId = user.uid;
    const userKey = window.sanitizeEmail(user.email);
    const userLikesRef = window.ref(database, "userManagement/" + userKey + "/Likes");
    window.onValue(userLikesRef, (snapshot) => {
      const likesData = snapshot.val() || {};
      window.userLikes = new Set(Object.keys(likesData));
      window.renderIdeas();
    });
    window.unlockSite();
    window.fetchIdeas();
    window.listenForCommentsCount();
  } else {
    // Show intro or signedOut modal
    if (!localStorage.getItem('visited')) {
      window.showModal('introModal');
    } else {
      window.showModal('signedOutModal');
    }
  }
});
