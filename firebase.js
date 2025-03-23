// firebase.js
// MyImaginationBackup credentials + userManagement (no import statements)

const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "myimaginationbackup.firebaseapp.com",
  databaseURL: "https://myimaginationbackup-default-rtdb.firebaseio.com",
  projectId: "myimaginationbackup",
  storageBucket: "myimaginationbackup.firebasestorage.app",
  messagingSenderId: "780723525935",
  appId: "1:780723525935:web:151a6d230b3705852a29da"
};

// Initialize Firebase the older way
firebase.initializeApp(firebaseConfig);

// Access Firebase services
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.database();

// Expose references globally so main.js can use them
window.database = db;
window.ref = db.ref.bind(db);
window.onValue = (reference, callback) => reference.on('value', callback);
window.push = (reference, data) => reference.push(data);
window.update = (reference, data) => reference.update(data);
window.set = (reference, data) => reference.set(data);
window.get = (reference) => reference.get();
window.runTransaction = (reference, transactionUpdate) => reference.transaction(transactionUpdate);

// Helper to sanitize email
window.sanitizeEmail = function(email) {
  return email.replace(/[.#$/\[\]]/g, "_");
};

// Watch for auth changes
auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;
    window.currentUserId = user.uid;

    const userKey = window.sanitizeEmail(user.email);
    // Create or update userManagement node
    window.set(window.ref("userManagement/" + userKey + "/displayName"), user.displayName);

    // Load user’s liked posts
    const userLikesRef = window.ref("userManagement/" + userKey + "/Likes");
    userLikesRef.on('value', (snapshot) => {
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

// This is called by disclaimers -> Google sign in
window.firebaseLogin = function() {
  auth.signInWithPopup(provider)
    .then((result) => {
      const user = result.user;
      document.getElementById('username').textContent = user.displayName;
      document.getElementById('userProfile').style.display = 'flex';

      window.currentUserEmail = user.email;
      window.currentUserName = user.displayName;
      window.currentUserId = user.uid;

      const userKey = window.sanitizeEmail(user.email);
      // Create userManagement node
      window.set(window.ref("userManagement/" + userKey + "/displayName"), user.displayName);

      // Load user’s liked posts
      const userLikesRef = window.ref("userManagement/" + userKey + "/Likes");
      userLikesRef.on('value', (snapshot) => {
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
  auth.signOut()
    .then(() => {
      location.reload();
    })
    .catch((error) => {
      console.error("Firebase logout error:", error);
    });
};
