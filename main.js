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

// Show Intro Modal on page load
window.addEventListener('load', function() {
  showModal('introModal');
});

// Intro -> disclaimers
var introNextBtn = document.getElementById('introNextBtn');
introNextBtn.addEventListener('click', function() {
  hideModal('introModal');
  showModal('disclaimerModal');
});

// disclaimers -> google sign in
var disclaimers = document.querySelectorAll('.disclaimer-check');
var disclaimerSignInBtn = document.getElementById('disclaimerSignInBtn');

function updateDisclaimerSignInState() {
  var allChecked = true;
  disclaimers.forEach(function(chk) {
    if (!chk.checked) {
      allChecked = false;
    }
  });
  disclaimerSignInBtn.disabled = !allChecked;
}

disclaimers.forEach(function(chk) {
  chk.addEventListener('change', updateDisclaimerSignInState);
});

disclaimerSignInBtn.addEventListener('click', function() {
  if (!disclaimerSignInBtn.disabled) {
    // calls the global function from firebase.js
    window.firebaseLogin();
  }
});

// Logout dropdown
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

// Buttons for new idea, info, filter
document.getElementById('newIdeaBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  showModal('newIdeaModal');
});
document.getElementById('infoBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  showModal('infoModal');
});

var filterBy = "recent";
document.getElementById('filterBtn').addEventListener('click', function(e) {
  e.stopPropagation();
  if (filterBy === "recent") {
    filterBy = "popular";
    this.title = "Filter: Most Popular";
  } else {
    filterBy = "recent";
    this.title = "Filter: Most Recent";
  }
  renderIdeas();
});

// Skip outside-click for #introModal & #disclaimerModal only
document.querySelectorAll('.modal').forEach(function(modal) {
  modal.addEventListener('click', function(e) {
    if ((modal.id !== 'introModal' && modal.id !== 'disclaimerModal') && e.target === modal) {
      hideModal(modal.id);
    }
  });
});

// Data: ideas, comments
var ideas = [];
window.commentsCount = {};

function countComments(obj) {
  var count = 0;
  for (var key in obj) {
    if (key === "_next") continue;
    count++;
    if (obj[key].replies) {
      count += countComments(obj[key].replies);
    }
  }
  return count;
}

function listenForCommentsCount() {
  var commentsRoot = window.ref("comments");
  window.onValue(commentsRoot, function(snapshot) {
    var data = snapshot.val() || {};
    window.commentsCount = {};
    for (var postId in data) {
      window.commentsCount[postId] = countComments(data[postId]);
    }
    renderIdeas();
  });
}

function fetchIdeas() {
  var ideasRef = window.ref("ideas");
  window.onValue(ideasRef, function(snapshot) {
    var data = snapshot.val();
    ideas = [];
    if (data) {
      for (var key in data) {
        var idea = data[key];
        idea.id = key;
        ideas.push(idea);
      }
    }
    renderIdeas();
  });
}

window.userLikes = new Set();

function renderIdeas() {
  var ideasGrid = document.getElementById('ideasGrid');
  var sorted = ideas.slice();

  if (filterBy === "popular") {
    sorted.sort(function(a, b) { return (b.likes || 0) - (a.likes || 0); });
  } else {
    sorted.sort(function(a, b) { return (b.created || 0) - (a.created || 0); });
  }

  ideasGrid.innerHTML = sorted.map(function(idea) {
    var commCount = window.commentsCount[idea.id] || 0;
    return `
      <div class="idea-card" onclick="showFullIdea('${idea.id}')">
        <div class="idea-subject">${idea.subject}</div>
        <div class="idea-description-container">
          <div class="idea-description">
            ${
              idea.description.length > 200
                ? idea.description.slice(0, 200) + "..."
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
              onclick="toggleLike('${idea.id}', '${idea.id}'); event.stopPropagation();">
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
  var uid = window.currentUserId;
  if (!uid) return;

  var idea = ideas.find(function(i) { return i.id === ideaId; });
  if (!idea) return;

  if (window.userLikes.has(key)) {
    // Unlike
    window.userLikes.delete(key);
    idea.likes = Math.max((idea.likes || 0) - 1, 0);
    window.update(window.ref("ideas/" + ideaId), { likes: idea.likes });
    window.set(
      window.ref("userManagement/" + window.sanitizeEmail(window.currentUserEmail) + "/Likes/" + key),
      null
    );
  } else {
    // Like
    window.userLikes.add(key);
    idea.likes = (idea.likes || 0) + 1;
    window.update(window.ref("ideas/" + ideaId), { likes: idea.likes });
    window.set(
      window.ref("userManagement/" + window.sanitizeEmail(window.currentUserEmail) + "/Likes/" + key),
      true
    );
  }
  renderIdeas();

  // If the full idea modal is open, re-render it so the like count updates
  if (document.getElementById('fullIdeaModal').classList.contains('show') &&
      window.currentExpandedIdeaId === ideaId) {
    showFullIdea(ideaId);
    var heartIcon = document.querySelector('#fullIdeaModal .action-button.liked svg');
    if (heartIcon) {
      heartIcon.style.animation = 'none';
      setTimeout(function() {
        heartIcon.style.animation = 'heartPop 0.3s ease';
      }, 10);
    }
  }
}

// Comments + replies
function renderComments(comments, parentPath) {
  parentPath = parentPath || ("comments/" + window.currentExpandedIdeaId);

  return comments.map(function(comment) {
    var replyFormId = "reply-form-" + parentPath.replace(/[\/:]/g, "_") + "_" + comment.id;
    var repliesHtml = "";

    if (comment.replies) {
      var repliesArray = Object.entries(comment.replies).map(function(entry) {
        var k = entry[0], v = entry[1];
        return { id: k, ...v };
      });
      repliesArray.sort(function(a, b) {
        var numA = parseInt(a.id.split("_")[1] || "0");
        var numB = parseInt(b.id.split("_")[1] || "0");
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
        <button class="reply-button" onclick="showReplyForm('${parentPath}','${comment.id}'); event.stopPropagation();">
          Reply
        </button>
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
  var replyFormId = "reply-form-" + parentPath.replace(/[\/:]/g, "_") + "_" + commentId;
  var form = document.getElementById(replyFormId);
  if (form) {
    form.style.display = (form.style.display === "none" || form.style.display === "") ? "block" : "none";
  }
}

function addCommentModal(postId) {
  var container = document.getElementById('modalCommentForm_' + postId);
  var textarea = container.querySelector('.comment-input');
  var content = textarea.value.trim();
  if (!content) return;

  var nextRef = window.ref("comments/" + postId + "/_next");
  window.runTransaction(nextRef, function(current) {
    return (current === null ? 0 : current) + 1;
  }).then(function(result) {
    var commentNumber = result.snapshot.val();
    var newCommentId = "Comment_" + commentNumber;
    var commentData = {
      commenter: window.currentUserName || "DummyUser",
      timestamp: new Date().toLocaleString(),
      content: content,
      replies: {}
    };
    return window.set(window.ref("comments/" + postId + "/" + newCommentId), commentData);
  }).then(function() {
    textarea.value = "";
    container.style.display = "none";
  }).catch(function(error) {
    console.error("Error posting comment:", error);
  });
}

function addReply(parentPath, commentId) {
  var replyFormId = "reply-form-" + parentPath.replace(/[\/:]/g, "_") + "_" + commentId;
  var replyInput = document.querySelector("#" + replyFormId + " .comment-input");
  var content = replyInput.value.trim();
  if (!content) return;

  var nextRef = window.ref(parentPath + "/" + commentId + "/_next");
  window.runTransaction(nextRef, function(current) {
    return (current === null ? 0 : current) + 1;
  }).then(function(result) {
    var replyNumber = result.snapshot.val();
    var newReplyId = "Reply_" + replyNumber;
    var replyData = {
      replier: window.currentUserName || "DummyUser",
      timestamp: new Date().toLocaleString(),
      content: content
    };
    return window.set(window.ref(parentPath + "/" + commentId + "/replies/" + newReplyId), replyData);
  }).then(function() {
    replyInput.value = "";
  }).catch(function(error) {
    console.error("Error posting reply:", error);
  });
}

// Full Idea Modal
function showFullIdea(ideaId) {
  var idea = ideas.find(function(i) { return i.id === ideaId; });
  if (!idea) return;
  window.currentExpandedIdeaId = ideaId;

  var modalHeaderHTML = `
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

  var commentToggleMarkup = `
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

  var modalBodyHTML = `
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
  var container = document.getElementById('modalCommentForm_' + ideaId);
  container.style.display = (container.style.display === "none" || container.style.display === "") ? "block" : "none";
}

function fetchComments(postId) {
  var cRef = window.ref("comments/" + postId);
  window.onValue(cRef, function(snapshot) {
    var data = snapshot.val();
    var commHtml = "";

    if (data) {
      var obj = {};
      for (var key in data) {
        if (key !== "_next") {
          obj[key] = data[key];
        }
      }
      var commArray = Object.entries(obj).map(function(entry) {
        var k = entry[0], v = entry[1];
        return { id: k, ...v };
      });
      commArray.sort(function(a, b) {
        var numA = parseInt(a.id.split("_")[1] || "0");
        var numB = parseInt(b.id.split("_")[1] || "0");
        return numA - numB;
      });
      commHtml = renderComments(commArray, "comments/" + postId);
      document.getElementById("fullIdeaCommentsCount").textContent = countComments(data);
    } else {
      document.getElementById("fullIdeaCommentsCount").textContent = 0;
    }

    var section = document.getElementById('commentsSection');
    if (section) {
      section.innerHTML = commHtml;
    }
  });
}

function scrollToComments(event) {
  event.stopPropagation();
  var commentsSec = document.getElementById('commentsSection');
  if (commentsSec) {
    commentsSec.scrollIntoView({ behavior: 'smooth' });
  }
}

// Add new idea
function addNewIdea(event) {
  event.preventDefault();
  var subject = document.getElementById('ideaSubject').value.trim();
  var description = document.getElementById('ideaDescription').value.trim();
  if (!subject || !description) return;

  var encodedSubject = encodeURIComponent(subject);
  var newIdea = {
    subject: subject,
    description: description,
    username: window.currentUserName || "DummyUser",
    email: window.currentUserEmail || "dummyuser@example.com",
    likes: 0,
    created: Date.now()
  };

  window.get(window.ref("ideas/" + encodedSubject))
    .then(function(snapshot) {
      var key = encodedSubject;
      if (snapshot.exists()) {
        key = encodedSubject + "_" + Date.now();
      }
      return window.set(window.ref("ideas/" + key), newIdea);
    })
    .then(function() {
      hideModal('newIdeaModal');
      document.getElementById('newIdeaForm').reset();
    })
    .catch(function(error) {
      console.error("Error posting idea:", error);
    });
  return false;
}

// Old tutorial
var tutorialSteps = [
  { target: "#newIdeaBtn", text: "Click the '+' button to share your creative idea." },
  { target: "#filterBtn", text: "Click the filter button to toggle sorting between most popular and most recent." },
  { target: "#infoBtn", text: "Click this info icon to learn more about the site." },
  { target: "#userProfile", text: "Click your name to sign out." }
];
var currentTutorialStep = 0;

function startTutorial() {
  currentTutorialStep = 0;
  showTutorialStep();
}

function showTutorialStep() {
  document.querySelectorAll('.highlighted').forEach(function(el) {
    el.classList.remove('highlighted');
  });
  if (currentTutorialStep >= tutorialSteps.length) {
    hideTutorial();
    return;
  }
  var step = tutorialSteps[currentTutorialStep];
  var targetEl = document.querySelector(step.target);
  if (!targetEl) {
    currentTutorialStep++;
    showTutorialStep();
    return;
  }
  targetEl.classList.add('highlighted');

  var rect = targetEl.getBoundingClientRect();
  var tooltip = document.getElementById('tutorialTooltip');
  var tooltipText = document.getElementById('tutorialText');
  tooltipText.textContent = step.text;

  var topPosition = rect.bottom + 10 + window.scrollY;
  var leftPosition = rect.left + window.scrollX;

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

  var tooltipHeight = tooltip.offsetHeight;
  var tooltipWidth = tooltip.offsetWidth;
  tooltip.style.visibility = "visible";

  if (topPosition + tooltipHeight > window.innerHeight + window.scrollY) {
    topPosition = rect.top - tooltipHeight - 10 + window.scrollY;
  }
  if (leftPosition + tooltipWidth > window.innerWidth + window.scrollX) {
    var altLeft = rect.left - tooltipWidth - 10 + window.scrollX;
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
  document.querySelectorAll('.highlighted').forEach(function(el) {
    el.classList.remove('highlighted');
  });
}

document.getElementById('tutorialOverlay').addEventListener('click', function(e) {
  if (e.target === this) {
    hideTutorial();
  }
});
document.getElementById('tutorialNextBtn').addEventListener('click', nextTutorialStep);
