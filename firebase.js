// firebase.js (Firebase v8, no import/export)

var firebaseConfig = {
  apiKey: "AIzaSyCzczvu3wHzJxzmZjN-swMmYglCeaXh8n4",
  authDomain: "myimaginationbackup.firebaseapp.com",
  databaseURL: "https://myimaginationbackup-default-rtdb.firebaseio.com",
  projectId: "myimaginationbackup",
  storageBucket: "myimaginationbackup.firebasestorage.app",
  messagingSenderId: "780723525935",
  appId: "1:780723525935:web:151a6d230b3705852a29da"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Access services
var auth = firebase.auth();
var provider = new firebase.auth.GoogleAuthProvider();
var db = firebase.database();

// Expose references globally
window.database = db;
window.ref = function(path) { return db.ref(path); };
window.onValue = function(reference, callback) { reference.on('value', callback); };
window.push = function(reference, data) { return reference.push(data); };
window.update = function(reference, data) { return reference.update(data); };
window.set = function(reference, data) { return reference.set(data); };
window.get = function(reference) { return reference.once('value'); };
window.runTransaction = function(reference, transactionUpdate) {
  return reference.transaction(transactionUpdate);
};

// Sanitize email for database keys
window.sanitizeEmail = function(email) {
  return email.replace(/[.#$/\[\]]/g, "_");
};

// Watch for auth changes
auth.onAuthStateChanged(function(user) {
  if (user) {
    document.getElementById('username').textContent = user.displayName;
    document.getElementById('userProfile').style.display = 'flex';

    window.currentUserEmail = user.email;
    window.currentUserName = user.displayName;
    window.currentUserId = user.uid;

    var userKey = window.sanitizeEmail(user.email);

    // Create or update user node
    window.set(window.ref("userManagement/" + userKey + "/displayName"), user.displayName);

    // Load user's liked posts
    var userLikesRef = window.ref("userManagement/" + userKey + "/Likes");
    userLikesRef.on('value', function(snapshot) {
      var data = snapshot.val() || {};
      window.userLikes = new Set(Object.keys(data));
      window.renderIdeas();
    });

    // Unlock site and load ideas/comments
    window.unlockSite();
    window.fetchIdeas();
    window.listenForCommentsCount();
  } else {
    // Not logged in; main.js will decide whether to show disclaimers or the Whoops modal
  }
});

// Called by the disclaimers or Whoops modal to sign in
window.firebaseLogin = function() {
  auth.signInWithPopup(provider)
    .then(function(result) {
      var user = result.user;
      document.getElementById('username').textContent = user.displayName;
      document.getElementById('userProfile').style.display = 'flex';

      window.currentUserEmail = user.email;
      window.currentUserName = user.displayName;
      window.currentUserId = user.uid;

      var userKey = window.sanitizeEmail(user.email);

      // Create or update the userManagement node
      window.set(window.ref("userManagement/" + userKey + "/displayName"), user.displayName);

      // Save consent in localStorage so disclaimers are not shown again
      localStorage.setItem('consented', 'true');

      // Load user's liked posts
      var userLikesRef = window.ref("userManagement/" + userKey + "/Likes");
      userLikesRef.on('value', function(snapshot) {
        var data = snapshot.val() || {};
        window.userLikes = new Set(Object.keys(data));
        window.renderIdeas();
      });

      // Unlock site and load ideas/comments
      window.unlockSite();
      window.fetchIdeas();
      window.listenForCommentsCount();
    })
    .catch(function(error) {
      console.error("Firebase login error:", error);
    });
};

// Logout function
window.logout = function() {
  auth.signOut()
    .then(function() {
      location.reload();
    })
    .catch(function(error) {
      console.error("Firebase logout error:", error);
    });
};
