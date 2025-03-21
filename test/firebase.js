// firebase.js
// Using "compat" libraries for a global firebase object

// 1) Your Firebase config:
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

// Force the tutorial to run once per browser (per localStorage)
window.firebaseLogin = function() {
  auth.signInWithPopup(provider)
    .then((result) => {
      // Mark visited for sign-out logic
      localStorage.setItem('visited', 'true');

      // Hide the "Whoops!" modal if open
      window.hideModal('signedOutModal');

      // Update UI with user info
      document.getElementById('username').textContent = result.user.displayName;
      document.getElementById('userProfile').style.display = 'flex';
      window.currentUserEmail = result.user.email;
      window.currentUserName = result.user.displayName;
      window.currentUserId = result.user.uid;

      // Setup user likes
      var userKey = window.sanitizeEmail(result.user.email);
      var userLikesRef = window.ref(database, "userManagement/" + userKey + "/Likes");
      window.onValue(userLikesRef, (snapshot) => {
        var likesData = snapshot.val() || {};
        window.userLikes = new Set(Object.keys(likesData));
        window.renderIdeas();
      });

      // Unlock the site (filterBtn, newIdeaBtn, etc.)
      window.unlockSite();
      window.fetchIdeas();
      window.listenForCommentsCount();

      // Force the tutorial to run ONCE in this browser (remove if you want it every login)
      if (!localStorage.getItem('tutorialShown')) {
        window.startTutorial();
        localStorage.setItem('tutorialShown', 'true');
      }
      // If you prefer the old approach (only new accounts),
      // you could do: if (result.additionalUserInfo?.isNewUser) { window.startTutorial(); }
    })
    .catch((error) => {
      console.error("Firebase login error:", error);
    });
};

window.logout = function() {
  auth.signOut()
    .then(() => {
      location.reload();
    })
    .catch((error) => {
      console.error("Firebase logout error:", error);
    });
};

// Track user state changes:
auth.onAuthStateChanged(function(user) {
  if (user) {
    // If user is signed in
    window.hideModal('signedOutModal');
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;
    window.currentUserId = user.uid;

    var userKey = window.sanitizeEmail(user.email);
    var userLikesRef = window.ref(database, "userManagement/" + userKey + "/Likes");
    window.onValue(userLikesRef, (snapshot) => {
      var likesData = snapshot.val() || {};
      window.userLikes = new Set(Object.keys(likesData));
      window.renderIdeas();
    });

    // Unlock site
    window.unlockSite();
    window.fetchIdeas();
    window.listenForCommentsCount();
  } else {
    // If user is signed out
    if (!localStorage.getItem('visited')) {
      // Show Intro (Welcome) for brand-new visitor
      window.showModal('introModal');
    } else {
      // Already visited, show "Whoops!" modal
      window.showModal('signedOutModal');
    }
  }
});
