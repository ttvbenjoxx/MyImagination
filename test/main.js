// main.js
// All UI logic: modals, tutorial, idea rendering, toggling likes, etc.

// Keep track of focus for modals
let lastFocusedElement;
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(
    'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), ' +
    'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if(focusableElements.length === 0) return;
  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];
  modal.addEventListener('keydown', function(e) {
    if(e.key === 'Tab' || e.keyCode === 9) {
      if(e.shiftKey) {
        if(document.activeElement === firstFocusableElement) {
          e.preventDefault();
          lastFocusableElement.focus();
        }
      } else {
        if(document.activeElement === lastFocusableElement) {
          e.preventDefault();
          firstFocusableElement.focus();
        }
      }
    }
  });
}

window.showModal = function(id) {
  lastFocusedElement = document.activeElement;
  const modal = document.getElementById(id);
  modal.classList.add('show');
  modal.setAttribute('tabindex', '-1');
  modal.focus();
  document.body.classList.add('modal-open');
  trapFocus(modal);
};

window.hideModal = function(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('show');
  document.body.classList.remove('modal-open');
  if(lastFocusedElement) {
    lastFocusedElement.focus();
  }
};

// Called once user is authorized
window.unlockSite = function() {
  window.siteLocked = false;
  document.getElementById('ideasGrid').classList.remove('locked');
  document.getElementById('filterBtn').style.display = 'flex';
  document.getElementById('newIdeaBtn').style.display = 'block';
  window.hideModal('introModal');
};

// For removing loader
let loaderHidden = false;
window.hideLoader = function() {
  const loader = document.getElementById('loader');
  if(loader && !loaderHidden) {
    loader.style.display = 'none';
    loaderHidden = true;
  }
};

// TUTORIAL
let tutorialSteps = [
  { target: "#newIdeaBtn", text: "Click the '+' button to share your creative idea." },
  { target: "#filterBtn", text: "Click the filter button to toggle sorting between most popular and most recent." },
  { target: "#infoBtn", text: "Click this info icon to learn more about the site." },
  { target: "#userProfile", text: "Click your name to sign out." }
];
let currentTutorialStep = 0;

window.startTutorial = function() {
  currentTutorialStep = 0;
  showTutorialStep();
};

function showTutorialStep() {
  document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
  if(currentTutorialStep >= tutorialSteps.length) {
    hideTutorial();
    return;
  }
  let step = tutorialSteps[currentTutorialStep];
  let targetEl = document.querySelector(step.target);
  if(!targetEl) {
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
  // If first step, offset a bit
  if(currentTutorialStep === 0) {
    leftPosition = leftPosition - 150;
    if(leftPosition < window.scrollX + 40) {
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
  if(topPosition + tooltipHeight > window.innerHeight + window.scrollY) {
    topPosition = rect.top - tooltipHeight - 10 + window.scrollY;
  }
  // If it goes off right edge
  if(leftPosition + tooltipWidth > window.innerWidth + window.scrollX) {
    let altLeft = rect.left - tooltipWidth - 10 + window.scrollX;
    if(altLeft > window.scrollX + 10) {
      leftPosition = altLeft;
    } else {
      leftPosition = (window.innerWidth - tooltipWidth - 10) + window.scrollX;
    }
  }
  if(leftPosition < window.scrollX + 10) {
    leftPosition = window.scrollX + 10;
  }
  tooltip.style.top = topPosition + "px";
  tooltip.style.left = leftPosition + "px";
  showTutorialOverlay();
}

window.nextTutorialStep = function() {
  currentTutorialStep++;
  showTutorialStep();
};

function showTutorialOverlay() {
  document.getElementById('tutorialOverlay').style.display = 'block';
}
function hideTutorial() {
  document.getElementById('tutorialOverlay').style.display = 'none';
  document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));
}

document.getElementById('tutorialOverlay').addEventListener('click', function(e) {
  if(e.target === this) {
    hideTutorial();
  }
});
document.getElementById('tutorialNextBtn').addEventListener('click', window.nextTutorialStep);

// UI EVENT HANDLERS
document.getElementById('userProfile').addEventListener('click', function(e){
  document.getElementById('logoutDropdown').classList.toggle("show");
  e.stopPropagation();
});
document.addEventListener('click', function(){
  document.getElementById('logoutDropdown').classList.remove("show");
});
document.getElementById('confirmLogout').addEventListener('click', function(e){
  e.stopPropagation();
  window.logout();
});

// New Idea & Info modals
document.getElementById('newIdeaBtn').addEventListener('click', function(e){
  e.stopPropagation();
  window.showModal('newIdeaModal');
});
document.getElementById('infoBtn').addEventListener('click', function(e){
  e.stopPropagation();
  window.showModal('infoModal');
});

// Filter: recent or popular
let filterBy = "recent";
document.getElementById('filterBtn').addEventListener('click', function(e){
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

// Hide modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e){
    if(e.target === modal){
      hideModal(modal.id);
    }
  });
});

// DATA / RENDERING
window.siteLocked = true; // locked until sign in
window.userLikes = new Set(); // track liked ideas

// For comments
window.commentsCount = {};

function countComments(obj) {
  let count = 0;
  for(const key in obj) {
    if(key === "_next") continue;
    count++;
    if(obj[key].replies) {
      count += countComments(obj[key].replies);
    }
  }
  return count;
}
window.listenForCommentsCount = function() {
  const commentsRoot = window.ref(window.database, "comments");
  window.onValue(commentsRoot, (snapshot) => {
    const data = snapshot.val() || {};
    window.commentsCount = {};
    for(const postId in data) {
      window.commentsCount[postId] = countComments(data[postId]);
    }
    renderIdeas();
  });
};

let ideas = [];
window.fetchIdeas = function() {
  const ideasRef = window.ref(window.database, "ideas");
  window.onValue(ideasRef, (snapshot) => {
    const data = snapshot.val();
    ideas = [];
    if(data) {
      for(const key in data) {
        let idea = data[key];
        idea.id = key;
        ideas.push(idea);
      }
    }
    renderIdeas();
    hideLoader();
  });
};

window.renderIdeas = function() {
  const grid = document.getElementById('ideasGrid');
  let sorted = ideas.slice();
  if(filterBy === "popular"){
    sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else {
    sorted.sort((a, b) => (b.created || 0) - (a.created || 0));
  }
  grid.innerHTML = sorted.map(idea => {
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
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23
                  l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              ${idea.likes}
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
};

window.toggleLike = function(ideaId, key) {
  if(window.siteLocked) {
    alert('Please unlock the site to like ideas.');
    return;
  }
  const uid = window.currentUserId;
  if(!uid) return;
  const idea = ideas.find(i => i.id === ideaId);
  if(idea) {
    if(window.userLikes.has(key)) {
      // Unlike
      window.userLikes.delete(key);
      idea.likes = Math.max(idea.likes - 1, 0);
      window.update(window.ref(window.database, "ideas/" + ideaId), { likes: idea.likes });
      window.set(window.ref(window.database, "userManagement/" + window.sanitizeEmail(window.currentUserEmail) + "/Likes/" + key), null);
    } else {
      // Like
      window.userLikes.add(key);
      idea.likes++;
      window.update(window.ref(window.database, "ideas/" + ideaId), { likes: idea.likes });
      window.set(window.ref(window.database, "userManagement/" + window.sanitizeEmail(window.currentUserEmail) + "/Likes/" + key), true);
    }
    renderIdeas();
    // If full modal open
    if(document.getElementById('fullIdeaModal').classList.contains('show') && window.currentExpandedIdeaId === ideaId) {
      showFullIdea(ideaId);
      const heartIcon = document.querySelector('#fullIdeaModal .action-button.liked svg');
      if(heartIcon) {
        heartIcon.style.animation = 'none';
        setTimeout(() => {
          heartIcon.style.animation = 'heartPop 0.3s ease';
        }, 10);
      }
    }
  }
};

// Reusable
window.sanitizeEmail = function(email) {
  return email.replace(/[.#$/\[\]]/g, "_");
};
window.sanitizeText = function(text) {
  return text.replace(/[.#$/\[\]\s]/g, "_");
};

// Comments
function renderComments(comments, parentPath) {
  parentPath = parentPath || ("comments/" + window.currentExpandedIdeaId);
  return comments.map(comment => {
    const replyFormId = "reply-form-" + parentPath.replace(/[\/:]/g, "_") + "_" + comment.id;
    let repliesHtml = "";
    if(comment.replies) {
      const repliesArray = Object.entries(comment.replies).map(([k,v]) => ({ id: k, ...v }));
      repliesArray.sort((a,b) => {
        const numA = parseInt(a.id.split("_")[1] || "0");
        const numB = parseInt(b.id.split("_")[1] || "0");
        return numA - numB;
      });
      repliesHtml = `<div class="comment-replies">${renderComments(repliesArray, parentPath + "/" + comment.id + "/replies")}</div>`;
    }
    return `<div class="comment">
      <div class="comment-header">
        <span class="comment-author">${comment.commenter || comment.replier || "Unknown"}</span>
        <span class="comment-date">${comment.timestamp}</span>
      </div>
      <div class="comment-content">${comment.content}</div>
      <button class="reply-button" onclick="showReplyForm('${parentPath}','${comment.id}'); event.stopPropagation();">Reply</button>
      <div class="reply-form" id="reply-form-${parentPath.replace(/[\/:]/g, "_") + "_" + comment.id}" style="display: none; margin-top: 10px;">
        <textarea class="form-input comment-input" placeholder="Write a reply..."></textarea>
        <div class="comment-actions" style="margin-top: 6px; text-align: right;">
          <button class="post-comment-button modal-post-comment-button" onclick="addReply('${parentPath}','${comment.id}'); event.stopPropagation();">Post</button>
        </div>
      </div>
      ${repliesHtml}
    </div>`;
  }).join('');
}

// Show/hide reply
window.showReplyForm = function(parentPath, commentId) {
  const replyFormId = "reply-form-" + parentPath.replace(/[\/:]/g, "_") + "_" + commentId;
  const form = document.getElementById(replyFormId);
  if(form) {
    form.style.display = (form.style.display === "none" || form.style.display === "") ? "block" : "none";
  }
};

window.addCommentModal = function(postId) {
  const container = document.getElementById('modalCommentForm_' + postId);
  const textarea = container.querySelector('.comment-input');
  const content = textarea.value.trim();
  if(!content) return;
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
};

window.addReply = function(parentPath, commentId) {
  const replyFormId = "reply-form-" + parentPath.replace(/[\/:]/g, "_") + "_" + commentId;
  const replyInput = document.querySelector("#" + replyFormId + " .comment-input");
  const content = replyInput.value.trim();
  if(!content) return;
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
};

window.showFullIdea = function(ideaId) {
  const idea = ideas.find(i => i.id === ideaId);
  if(!idea) return;
  window.currentExpandedIdeaId = ideaId;
  const modalHeaderHTML = `
<div class="header-left-content">
  <h2 class="modal-title" id="fullIdeaModalTitle">${idea.subject}</h2>
  <div class="author-details">
    <span class="author-name">${idea.username}</span>
    &nbsp;|&nbsp;
    <span class="author-email">${idea.email}</span>
  </div>
</div>
<div class="header-right-content">
  <button class="action-button like-button ${(window.userLikes && window.userLikes.has(idea.id)) ? 'liked' : ''}"
    onclick="toggleLike('${idea.id}','${idea.id}'); event.stopPropagation();">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0
               L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78
               l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06
               a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
    ${idea.likes}
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

  window.showModal('fullIdeaModal');
  fetchComments(idea.id);
};

window.toggleModalCommentForm = function(ideaId) {
  const container = document.getElementById('modalCommentForm_' + ideaId);
  container.style.display = (container.style.display === "none" || container.style.display === "") ? "block" : "none";
};

// Called by "New Idea" form
const newIdeaForm = document.getElementById('newIdeaForm');
newIdeaForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const subject = document.getElementById('ideaSubject').value.trim();
  const description = document.getElementById('ideaDescription').value.trim();
  if(!subject || !description) return;
  const ideaKey = window.sanitizeText(subject);
  const newIdea = {
    subject: subject,
    description: description,
    username: window.currentUserName || "DummyUser",
    email: window.currentUserEmail || "dummyuser@example.com",
    likes: 0,
    created: Date.now()
  };
  const ideaRef = window.ref(window.database, "ideas/" + ideaKey);
  window.set(ideaRef, newIdea)
    .then(() => {
      hideModal('newIdeaModal');
      newIdeaForm.reset();
    })
    .catch((error) => {
      console.error("Error posting idea:", error);
    });
});

window.scrollToComments = function(e) {
  e.stopPropagation();
  const modalContent = document.querySelector('#fullIdeaModal .modal-content');
  if(modalContent) {
    const commSection = modalContent.querySelector('#commentsSection');
    if(commSection) {
      commSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
};
