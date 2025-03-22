// firebase.js
// Using "compat" libraries for a global firebase object

// 1) Your Firebase config
var firebaseConfig = {
  apiKey: "AIzaSyCzczvu3wHzJxzmZjN-swMmYglCeaXh8n4",
  authDomain: "myimaginationbackup.firebaseapp.com",
  projectId: "myimaginationbackup",
  storageBucket: "myimaginationbackup.firebasestorage.app",
  messagingSenderId: "780723525935",
  appId: "1:780723525935:web:151a6d230b3705852a29da",
  databaseURL: "https://myimaginationbackup-default-rtdb.firebaseio.com/"
};

// 2) Initialize the global 'firebase' object
firebase.initializeApp(firebaseConfig);

var auth = firebase.auth();
var provider = new firebase.auth.GoogleAuthProvider();
var database = firebase.database();

// Expose these so main.js can use them
window.auth = auth;
window.provider = provider;
window.database = database;

// Provide wrappers for .ref, .onValue, etc.
window.ref = function(db, path) {
  return db.ref(path);
};
window.onValue = function(refObj, callback) {
  return refObj.on('value', (snapshot) => callback(snapshot));
};
window.push = function(refObj, data) {
  return refObj.push(data);
};
window.update = function(refObj, data) {
  return refObj.update(data);
};
window.set = function(refObj, data) {
  return refObj.set(data);
};
window.get = function(refObj) {
  return refObj.once('value');
};
window.runTransaction = function(refObj, transactionUpdate) {
  return refObj.transaction(transactionUpdate);
};

// This function is called when user clicks "Continue with Google" 
// or any sign-in button in your modals
window.firebaseLogin = function() {
  auth.signInWithPopup(provider)
    .then((result) => {
      // If a sign-out modal is open, hide it
      window.hideModal('signedOutModal');
      // Also hide the intro modal if it might be open
      window.hideModal('introModal');

      // Update UI with user info
      document.getElementById('username').textContent = result.user.displayName;
      document.getElementById('userProfile').style.display = 'flex';
      window.currentUserEmail = result.user.email;
      window.currentUserName = result.user.displayName;
      window.currentUserId = result.user.uid;

      // Setup user likes
      var userKey = window.sanitizeEmail(result.user.email);
      var userLikesRef = window.ref(window.database, "userManagement/" + userKey + "/Likes");
      window.onValue(userLikesRef, (snapshot) => {
        var likesData = snapshot.val() || {};
        window.userLikes = new Set(Object.keys(likesData));
        window.renderIdeas();
      });

      // Unlock the site (remove "locked" UI) 
      window.unlockSite();
      // Fetch data & comments
      window.fetchIdeas();
      window.listenForCommentsCount();

      // Optionally run the tutorial after login
      window.startTutorial(); 
    })
    .catch((error) => {
      console.error("Firebase login error:", error);
    });
};

// This function is called when user confirms sign out
window.logout = function() {
  auth.signOut()
    .then(() => {
      location.reload(); 
    })
    .catch((error) => {
      console.error("Firebase logout error:", error);
    });
};

// This fires on page load + whenever auth state changes
auth.onAuthStateChanged(function(user) {
  if (user) {
    // User is signed in
    // Hide sign-in prompts if they're open
    window.hideModal('introModal');
    window.hideModal('signedOutModal');

    // Update UI
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;
    window.currentUserId = user.uid;

    var userKey = window.sanitizeEmail(user.email);
    var userLikesRef = window.ref(window.database, "userManagement/" + userKey + "/Likes");
    window.onValue(userLikesRef, (snapshot) => {
      var likesData = snapshot.val() || {};
      window.userLikes = new Set(Object.keys(likesData));
      window.renderIdeas();
    });

    // Unlock the site, fetch data
    window.unlockSite();
    window.fetchIdeas();
    window.listenForCommentsCount();
  } else {
    // User is not signed in, always show the same sign-in prompt
    window.showModal('introModal');
    // Or if you want the "Whoops!" text, do: window.showModal('signedOutModal');
  }
});
