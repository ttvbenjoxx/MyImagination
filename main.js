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
              // REMOVED the backslash before the backtick here
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
function renderComments(comments, parentPath) {
  parentPath = parentPath || ("comments/" + window.currentExpandedIdeaId);
  return comments.map(comment => {
    const replyFormId = "reply-form-" + parentPath.replace(/[\/:]/g, "_") + "_" + comment.id;
    let repliesHtml = "";
    if (comment.replies) {
      const repliesArray = Object.entries(comment.replies).map(([k,v]) => ({ id: k, ...v }));
      repliesArray.sort((a,b) => {
        const numA = parseInt(a.id.split("_")[1] || "0");
        const numB = parseInt(b.id.split("_")[1] || "0");
        return numA - numB;
      });
      repliesHtml = `<div class="comment-replies">
        ${renderComments(repliesArray, parentPath + "/" + comment.id + "/replies")}
      </div>`;
    }
    return `
      <div class="comment">
        <div class="comment-header">
          <span class="comment-author">${comment.commenter || comment.replier || "Unknown"}</span>
          <span class="comment-date">${comment.timestamp}</span>
        </div>
        <div class="comment-content">${comment.content}</div>
        <button class="reply-button" onclick="showReplyForm('${parentPath}','${comment.id}'); event.stopPropagation();">Reply</button>
        <div class="reply-form" id="${replyFormId}" style="display: none; margin-top: 10px;">
          <textarea class="form-input comment-input" placeholder="Write a reply..."></textarea>
          <div class="comment-actions" style="margin-top: 6px; text-align: right;">
            <button class="post-comment-button modal-post-comment-button"
              onclick="addReply('${parentPath}','${comment.id}'); event.stopPropagation();">Post</button>
          </div>
        </div>
        ${repliesHtml}
      </div>
    `;
  }).join('');
}

function showReplyForm(parentPath, commentId) {
  const replyFormId = "reply-form-" + parentPath.replace(/[\/:]/g, "_") + "_" + commentId;
  const form = document.getElementById(replyFormId);
  if (form) {
    form.style.display = (form.style.display === "none" || form.style.display === "") ? "block" : "none";
  }
}

function addCommentModal(postId) {
  const container = document.getElementById('modalCommentForm_' + postId);
  const textarea = container.querySelector('.comment-input');
  const content = textarea.value.trim();
  if (!content) return;

  const nextRef = window.ref(window.database, "comments/" + postId + "/_next");
  window.runTransaction(nextRef, (current) => {
    return (current === null ? 0 : current) + 1;
  }).then((result) => {
    const commentNumber = result.snapshot.val();
    const newCommentId = "Comment_" + commentNumber;
    const commentData = {
      commenter: window.currentUserName || "DummyUser",
      timestamp: new Date().toLocaleString(),
      content: content,
      replies: {}
    };
    return window.set(window.ref(window.database, "comments/" + postId + "/" + newCommentId), commentData);
  }).then(() => {
    textarea.value = "";
    container.style.display = "none";
  }).catch((error) => {
    console.error("Error posting comment:", error);
  });
}

function addReply(parentPath, commentId) {
  const replyFormId = "reply-form-" + parentPath.replace(/[\/:]/g, "_") + "_" + commentId;
  const replyInput = document.querySelector("#" + replyFormId + " .comment-input");
  const content = replyInput.value.trim();
  if (!content) return;

  const nextRef = window.ref(window.database, parentPath + "/" + commentId + "/_next");
  window.runTransaction(nextRef, (current) => {
    return (current === null ? 0 : current) + 1;
  }).then((result) => {
    const replyNumber = result.snapshot.val();
    const newReplyId = "Reply_" + replyNumber;
    const replyData = {
      replier: window.currentUserName || "DummyUser",
      timestamp: new Date().toLocaleString(),
      content: content
    };
    return window.set(window.ref(window.database, parentPath + "/" + commentId + "/replies/" + newReplyId), replyData);
  }).then(() => {
    replyInput.value = "";
  }).catch((error) => {
    console.error("Error posting reply:", error);
  });
}

// Show full idea
function showFullIdea(ideaId) {
  const idea = ideas.find(i => i.id === ideaId);
  if (!idea) return;
  window.currentExpandedIdeaId = ideaId;

  const modalHeaderHTML = `
<div class="header-left-content">
  <h2 class="modal-title" id="fullIdeaTitle">${idea.subject}</h2>
  <div class="author-details">
    <span class="author-name">${idea.username}</span>
    &nbsp;|&nbsp;
    <span class="author-email">${idea.email}</span>
  </div>
</div>
<div class="header-right-content">
  <button class="action-button like-button ${(window.userLikes.has(idea.id)) ? 'liked' : ''}"
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
  <button type="button" class="action-button static comment-button" onclick="scrollToComments(event)">
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
    <span id="fullIdeaCommentsCount">0</span>
  </button>
  <button class="close-modal" onclick="hideModal('fullIdeaModal')">&times;</button>
</div>`;

  const commentToggleMarkup = `
<button class="comment-toggle-button" onclick="toggleModalCommentForm('${idea.id}'); event.stopPropagation();">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
       style="vertical-align: middle;">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
</button>
<div id="modalCommentForm_${idea.id}" style="display: none; margin-top: 10px;">
  <textarea class="form-input comment-input" placeholder="Write a comment..."></textarea>
  <div class="comment-actions" style="margin-top: 6px; text-align: right;">
    <button class="post-comment-button modal-post-comment-button"
      onclick="addCommentModal('${idea.id}'); event.stopPropagation();">Post</button>
  </div>
</div>`;

  const modalBodyHTML = `
<div class="idea-description">${idea.description}</div>
<h3 style="margin: 16px 0 8px 0;">Comments</h3>
${commentToggleMarkup}
<div id="commentsSection" class="comments-section"></div>`;

  document.getElementById('fullIdeaModal').innerHTML = `
<div class="modal-content">
  <div class="modal-header">
    ${modalHeaderHTML}
  </div>
  <div id="fullIdeaContent" class="modal-body">
    ${modalBodyHTML}
  </div>
</div>`.trim();

  showModal('fullIdeaModal');
  fetchComments(idea.id);
}

function toggleModalCommentForm(ideaId) {
  const container = document.getElementById('modalCommentForm_' + ideaId);
  container.style.display = (container.style.display === "none" || container.style.display === "") ? "block" : "none";
}

function fetchComments(postId) {
  const cRef = window.ref(window.database, "comments/" + postId);
  window.onValue(cRef, (snapshot) => {
    const data = snapshot.val();
    let commHtml = "";
    if (data) {
      const obj = {};
      for (const key in data) {
        if (key !== "_next") {
          obj[key] = data[key];
        }
      }
      const commArray = Object.entries(obj).map(([k,v]) => ({ id: k, ...v }));
      // Sort ascending
      commArray.sort((a,b) => {
        const numA = parseInt(a.id.split("_")[1] || "0");
        const numB = parseInt(b.id.split("_")[1] || "0");
        return numA - numB;
      });
      commHtml = renderComments(commArray, "comments/" + postId);
      document.getElementById("fullIdeaCommentsCount").textContent = countComments(data);
    } else {
      document.getElementById("fullIdeaCommentsCount").textContent = 0;
    }
    const section = document.getElementById('commentsSection');
    if (section) {
      section.innerHTML = commHtml;
    }
  });
}

// 9) Add new idea
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

// 10) Old spotlight tutorial
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

  // For the first step, shift left a bit
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

  // If it goes below screen
  if (topPosition + tooltipHeight > window.innerHeight + window.scrollY) {
    topPosition = rect.top - tooltipHeight - 10 + window.scrollY;
  }
  // If it goes off the right edge
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
