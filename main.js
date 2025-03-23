// main.js

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
  hideModal('disclaimerModal');
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

// Show Intro Modal on page load if user is not logged in
window.addEventListener('load', () => {
  showModal('introModal');
});

// Intro -> disclaimers
const introNextBtn = document.getElementById('introNextBtn');
introNextBtn.addEventListener('click', () => {
  hideModal('introModal');
  showModal('disclaimerModal');
});

// disclaimers -> google sign in
const disclaimers = document.querySelectorAll('.disclaimer-check');
const disclaimerSignInBtn = document.getElementById('disclaimerSignInBtn');

function updateDisclaimerSignInState() {
  let allChecked = true;
  disclaimers.forEach(chk => {
    if (!chk.checked) {
      allChecked = false;
    }
  });
  disclaimerSignInBtn.disabled = !allChecked;
}

disclaimers.forEach(chk => {
  chk.addEventListener('change', updateDisclaimerSignInState);
});

disclaimerSignInBtn.addEventListener('click', () => {
  if (!disclaimerSignInBtn.disabled) {
    // call firebaseLogin from firebase.js
    window.firebaseLogin();
  }
});

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

// Skip outside-click for the Intro & Disclaimer modals
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e) {
    if (modal.id !== 'introModal' && modal.id !== 'disclaimerModal' && e.target === modal) {
      hideModal(modal.id);
    }
  });
});

// 4) Data: ideas, comments
let ideas = [];
window.commentsCount = {};

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

// 5) Render ideas (with user management for likes)
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
    window.userLikes.delete(key);
    idea.likes = Math.max((idea.likes || 0) - 1, 0);
    window.update(window.ref(window.database, "ideas/" + ideaId), { likes: idea.likes });
    window.set(
      window.ref(window.database, "userManagement/" + window.sanitizeEmail(window.currentUserEmail) + "/Likes/" + key),
      null
    );
  } else {
    window.userLikes.add(key);
    idea.likes = (idea.likes || 0) + 1;
    window.update(window.ref(window.database, "ideas/" + ideaId), { likes: idea.likes });
    window.set(
      window.ref(window.database, "userManagement/" + window.sanitizeEmail(window.currentUserEmail) + "/Likes/" + key),
      true
    );
  }
  renderIdeas();
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

// Comments + replies + new idea + full idea
function renderComments(comments, parentPath) { /* ... unchanged ... */ }
function showReplyForm(parentPath, commentId) { /* ... unchanged ... */ }
function addCommentModal(postId) { /* ... unchanged ... */ }
function addReply(parentPath, commentId) { /* ... unchanged ... */ }

function showFullIdea(ideaId) { /* ... unchanged ... */ }
function toggleModalCommentForm(ideaId) { /* ... unchanged ... */ }
function fetchComments(postId) { /* ... unchanged ... */ }

// 6) Add new idea
function addNewIdea(event) {
  event.preventDefault();
  const subject = document.getElementById('ideaSubject').value.trim();
  const description = document.getElementById('ideaDescription').value.trim();
  if(!subject || !description) return;

  const encodedSubject = encodeURIComponent(subject);
  const newIdea = {
    subject,
    description,
    username: window.currentUserName || "DummyUser",
    email: window.currentUserEmail || "dummyuser@example.com",
    likes: 0,
    created: Date.now()
  };
  window.get(window.ref(window.database, "ideas/" + encodedSubject))
    .then((snapshot) => {
      let key = encodedSubject;
      if (snapshot.exists()) {
        key = encodedSubject + "_" + Date.now();
      }
      return window.set(window.ref(window.database, "ideas/" + key), newIdea);
    })
    .then(() => {
      hideModal('newIdeaModal');
      document.getElementById('newIdeaForm').reset();
    })
    .catch((error) => {
      console.error("Error posting idea:", error);
    });
  return false;
}

// 7) Old spotlight tutorial
let tutorialSteps = [
  { target: "#newIdeaBtn", text: "Click the '+' button to share your creative idea." },
  { target: "#filterBtn", text: "Click the filter button to toggle sorting between most popular and most recent." },
  { target: "#infoBtn", text: "Click this info icon to learn more about the site." },
  { target: "#userProfile", text: "Click your name to sign out." }
];
let currentTutorialStep = 0;

function startTutorial() {
  currentTutorialStep = 0;
  showTutorialStep();
}
function showTutorialStep() {
  document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
  if (currentTutorialStep >= tutorialSteps.length) {
    hideTutorial();
    return;
  }
  let step = tutorialSteps[currentTutorialStep];
  let targetEl = document.querySelector(step.target);
  if (!targetEl) {
    currentTutorialStep++;
    showTutorialStep();
    return;
  }
  targetEl.classList.add('highlighted');

  let rect = targetEl.getBoundingClientRect();
  let tooltip = document.getElementById('tutorialTooltip');
  let tooltipText = document.getElementById('tutorialText');
  tooltipText.textContent = step.text;

  let topPosition = rect.bottom + 10 + window.scrollY;
  let leftPosition = rect.left + window.scrollX;

  if (currentTutorialStep === 0) {
    leftPosition -= 150;
    if (leftPosition < window.scrollX + 40) {
      leftPosition = window.scrollX + 40;
    }
  }
  tooltip.style.top = topPosition + "px";
  tooltip.style.left = leftPosition + "px";
  tooltip.style.visibility = "hidden";
  tooltip.style.display = "block";

  let tooltipHeight = tooltip.offsetHeight;
  let tooltipWidth = tooltip.offsetWidth;
  tooltip.style.visibility = "visible";

  if (topPosition + tooltipHeight > window.innerHeight + window.scrollY) {
    topPosition = rect.top - tooltipHeight - 10 + window.scrollY;
  }
  if (leftPosition + tooltipWidth > window.innerWidth + window.scrollX) {
    let altLeft = rect.left - tooltipWidth - 10 + window.scrollX;
    if (altLeft > window.scrollX + 10) {
      leftPosition = altLeft;
    } else {
      leftPosition = window.innerWidth - tooltipWidth - 10 + window.scrollX;
    }
  }
  if (leftPosition < window.scrollX + 10) {
    leftPosition = window.scrollX + 10;
  }
  tooltip.style.top = topPosition + "px";
  tooltip.style.left = leftPosition + "px";
  showTutorialOverlay();
}
function nextTutorialStep() {
  currentTutorialStep++;
  showTutorialStep();
}
function showTutorialOverlay() {
  document.getElementById('tutorialOverlay').style.display = 'block';
}
function hideTutorial() {
  document.getElementById('tutorialOverlay').style.display = 'none';
  document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
}
document.getElementById('tutorialOverlay').addEventListener('click', function(e) {
  if (e.target === this) {
    hideTutorial();
  }
});
document.getElementById('tutorialNextBtn').addEventListener('click', nextTutorialStep);
