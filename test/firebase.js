// firebase.js
// Using "compat" libraries for a global firebase object

var firebaseConfig = {
  apiKey: "AIzaSyCzczvu3wHzJxzmZjN-swMmYglCeaXh8n4",
  authDomain: "myimaginationbackup.firebaseapp.com",
  projectId: "myimaginationbackup",
  storageBucket: "myimaginationbackup.firebasestorage.app",
  messagingSenderId: "780723525935",
  appId: "1:780723525935:web:151a6d230b3705852a29da",
  databaseURL: "https://myimaginationbackup-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);

var auth = firebase.auth();
var provider = new firebase.auth.GoogleAuthProvider();
var database = firebase.database();

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

// Always run the tutorial after login
window.firebaseLogin = function() {
  auth.signInWithPopup(provider)
    .then((result) => {
      // If "Whoops!" modal is open, hide it
      window.hideModal('signedOutModal');

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

      // Unlock site (also sets localStorage.setItem('visited','true'))
      window.unlockSite();
      window.fetchIdeas();
      window.listenForCommentsCount();

      // Immediately start the tutorial
      window.startTutorial();
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

// Watch auth state changes
auth.onAuthStateChanged(function(user) {
  if (user) {
    // If logged in, hide the modals if they are open
    window.hideModal('introModal');
    window.hideModal('signedOutModal');

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

    // Unlock site (shows newIdeaBtn, etc.)
    window.unlockSite();
    window.fetchIdeas();
    window.listenForCommentsCount();

  } else {
    // Not logged in
    // If they've never visited (this browser), show Intro
    if (!localStorage.getItem('visited')) {
      window.showModal('introModal');
    } else {
      // Otherwise show "Whoops!"
      window.showModal('signedOutModal');
    }
  }
});
