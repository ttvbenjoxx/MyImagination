// main.js

// 1) Show/hide modals, siteLocked
function showModal(modalId) {
  document.getElementById(modalId).classList.add('show');
  document.body.classList.add('modal-open');
}
function hideModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
  document.body.classList.remove('modal-open');
}
function unlockSite() {
  window.siteLocked = false;
  document.getElementById('ideasGrid').classList.remove('locked');
  document.getElementById('filterBtn').style.display = 'flex';
  document.getElementById('newIdeaBtn').style.display = 'block';
  hideModal('introModal');
  // If first time, run tutorial
  if (!localStorage.getItem('visited')) {
    startTutorial();
    localStorage.setItem('visited', 'true');
  }
}
window.showModal = showModal;
window.hideModal = hideModal;
window.unlockSite = unlockSite;
window.siteLocked = true;

// 2) Logout dropdown
document.getElementById('userProfile').addEventListener('click', function(e) {
  document.getElementById('logoutDropdown').classList.toggle('show');
  e.stopPropagation();
});
document.addEventListener('click', function() {
  document.getElementById('logoutDropdown').classList.remove('show');
});
document.getElementById('confirmLogout').addEventListener('click', function(e) {
  e.stopPropagation();
  logout();
});

// 3) Buttons for new idea, info, filter
document.getElementById('newIdeaBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  showModal('newIdeaModal');
});
document.getElementById('infoBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  showModal('infoModal');
});
let filterBy = "recent";
document.getElementById('filterBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  if(filterBy === "recent"){
    filterBy = "popular";
    this.title = "Filter: Most Popular";
  } else {
    filterBy = "recent";
    this.title = "Filter: Most Recent";
  }
  renderIdeas();
});

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      hideModal(modal.id);
    }
  });
});

// 4) Tab switching for Info modal
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
    document.getElementById(this.dataset.tab).classList.add('active');
  });
});

// 5) Data: ideas, comments
let ideas = [];
window.commentsCount = {};

// For counting comments recursively
function countComments(obj) {
  let count = 0;
  for(const key in obj) {
    if (key === "_next") continue;
    count++;
    if (obj[key].replies) {
      count += countComments(obj[key].replies);
    }
  }
  return count;
}

function listenForCommentsCount() {
  const commentsRoot = window.ref(window.database, "comments");
  window.onValue(commentsRoot, (snapshot) => {
    const data = snapshot.val() || {};
    window.commentsCount = {};
    for(const postId in data) {
      window.commentsCount[postId] = countComments(data[postId]);
    }
    renderIdeas();
  });
}

function fetchIdeas() {
  const ideasRef = window.ref(window.database, "ideas");
  window.onValue(ideasRef, (snapshot) => {
    const data = snapshot.val();
    ideas = [];
    if (data) {
      for(const key in data) {
        const idea = data[key];
        idea.id = key;
        ideas.push(idea);
      }
    }
    renderIdeas();
  });
}

// 6) Render ideas (with user management for likes)
window.userLikes = new Set();

function renderIdeas() {
  const ideasGrid = document.getElementById('ideasGrid');
  let sorted = ideas.slice();
  if (filterBy === "popular") {
    sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else {
    sorted.sort((a, b) => (b.created || 0) - (a.created || 0));
  }
  ideasGrid.innerHTML = sorted.map(idea => {
    const commCount = window.commentsCount[idea.id] || 0;
    return `
      <div class="idea-card" onclick="showFullIdea('${idea.id}')">
        <div class="idea-subject">${idea.subject}</div>
        <div class="idea-description-container">
          <div class="idea-description">
            ${
              idea.description.length > 200
                ? idea.description.slice(0,200) + "..."
                : idea.description
            }
            ${
              idea.description.length > 200
                ? `<button class="more-button" onclick="showFullIdea('${idea.id}'); event.stopPropagation();">More</button>`
                : ""
            }
          </div>
        </div>
        <div class="idea-meta">
          <span>${idea.username}</span>
          <div class="idea-actions">
            <button class="action-button ${window.userLikes.has(idea.id) ? 'liked' : ''}"
              onclick="toggleLike('${idea.id}','${idea.id}'); event.stopPropagation();">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0
                  L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78
                  l1.06 1.06L12 21.23
                  l7.78-7.78 1.06-1.06
                  a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              ${idea.likes || 0}
            </button>
            <span class="action-button static">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8
                  8.5 8.5 0 0 1-7.6 4.7
                  8.38 8.38 0 0 1-3.8-.9
                  L3 21l1.9-5.7
                  a8.38 8.38 0 0 1-.9-3.8
                  8.5 8.5 0 0 1 4.7-7.6
                  8.38 8.38 0 0 1 3.8-.9
                  h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              ${commCount}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 7) Like logic referencing userManagement
window.sanitizeEmail = function(email) {
  return email.replace(/[.#$/\[\]]/g, "_");
};

function toggleLike(ideaId, key) {
  if (window.siteLocked) {
    alert('Please unlock the site to like ideas.');
    return;
  }
  const uid = window.currentUserId;
  if (!uid) return;

  const idea = ideas.find(i => i.id === ideaId);
  if (!idea) return;

  if (window.userLikes.has(key)) {
    // Unlike
    window.userLikes.delete(key);
    idea.likes = Math.max((idea.likes || 0) - 1, 0);
    window.update(window.ref(window.database, "ideas/" + ideaId), { likes: idea.likes });
    // Remove from userManagement
    window.set(
      window.ref(window.database, "userManagement/" + window.sanitizeEmail(window.currentUserEmail) + "/Likes/" + key),
      null
    );
  } else {
    // Like
    window.userLikes.add(key);
    idea.likes = (idea.likes || 0) + 1;
    window.update(window.ref(window.database, "ideas/" + ideaId), { likes: idea.likes });
    // Add to userManagement
    window.set(
      window.ref(window.database, "userManagement/" + window.sanitizeEmail(window.currentUserEmail) + "/Likes/" + key),
      true
    );
  }
  renderIdeas();
  // If the full modal is open, update it too
  if (document.getElementById('fullIdeaModal').classList.contains('show') &&
      window.currentExpandedIdeaId === ideaId) {
    showFullIdea(ideaId);
    const heartIcon = document.querySelector('#fullIdeaModal .action-button.liked svg');
    if (heartIcon) {
      heartIcon.style.animation = 'none';
      setTimeout(() => {
        heartIcon.style.animation = 'heartPop 0.3s ease';
      }, 10);
    }
  }
}

// 8) Comments + replies
// ... (unchanged from your code)
function renderComments(comments, parentPath) { /* ... */ }
function showReplyForm(parentPath, commentId) { /* ... */ }
function addCommentModal(postId) { /* ... */ }
function addReply(parentPath, commentId) { /* ... */ }

// Show full idea
function showFullIdea(ideaId) { /* ... (unchanged from your code) */ }
function toggleModalCommentForm(ideaId) { /* ... */ }
function fetchComments(postId) { /* ... */ }

// 9) Add new idea
function addNewIdea(event) { /* ... (unchanged from your code) */ }

// 10) Old spotlight tutorial
// ... (unchanged from your code)

// --------------------------------------------
// New logic for 2-step Intro -> Consent flow
// --------------------------------------------

// 1) "Continue" button in the Intro Modal
const proceedIntroButton = document.getElementById('proceedIntroButton');
if (proceedIntroButton) {
  proceedIntroButton.addEventListener('click', function() {
    hideModal('introModal');
    showModal('consentModal');
  });
}

// 2) "Continue" button in the Signed Out ("Whoops!") Modal
const whoopsContinueButton = document.getElementById('whoopsContinueButton');
if (whoopsContinueButton) {
  whoopsContinueButton.addEventListener('click', function() {
    hideModal('signedOutModal');
    showModal('consentModal');
  });
}

// 3) Checkboxes in the Consent (Agreement) Modal
const agreeTOS = document.getElementById('agreeTOS');
const agreePrivacy = document.getElementById('agreePrivacy');
const agreeDisclaimer = document.getElementById('agreeDisclaimer');
const finalContinueButton = document.getElementById('finalContinueButton');

function checkAllAgreed() {
  if (agreeTOS.checked && agreePrivacy.checked && agreeDisclaimer.checked) {
    finalContinueButton.disabled = false;
  } else {
    finalContinueButton.disabled = true;
  }
}
if (agreeTOS) {
  [agreeTOS, agreePrivacy, agreeDisclaimer].forEach(checkbox => {
    checkbox.addEventListener('change', checkAllAgreed);
  });
}

// 4) "Continue with Google" in the Consent Modal
if (finalContinueButton) {
  finalContinueButton.addEventListener('click', function() {
    hideModal('consentModal');
    // Actually sign in with Google
    firebaseLogin();
  });
}
