///////////////////////////////////////////////////////////////////////////////
// Append these lines BELOW your current code in main.js:
///////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// Toggle Like for an idea
////////////////////////////////////////////////////////////////////////////////
window.toggleLike = function(ideaId, key) {
  // If the site is locked, do nothing
  if (window.siteLocked) {
    alert('Please unlock the site to like ideas.');
    return;
  }
  const uid = window.currentUserId;
  if (!uid) return;

  // Find the idea object
  const idea = ideas.find(i => i.id === ideaId);
  if (idea) {
    // Check if user already liked
    if (window.userLikes.has(key)) {
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
    // Re-render
    renderIdeas();

    // If the full idea modal is open, update it
    if (
      document.getElementById('fullIdeaModal').classList.contains('show') &&
      window.currentExpandedIdeaId === ideaId
    ) {
      showFullIdea(ideaId);
      // Animate the heart
      const heartIcon = document.querySelector('#fullIdeaModal .action-button.liked svg');
      if (heartIcon) {
        heartIcon.style.animation = 'none';
        setTimeout(() => {
          heartIcon.style.animation = 'heartPop 0.3s ease';
        }, 10);
      }
    }
  }
};

////////////////////////////////////////////////////////////////////////////////
// Sanitize Email/Text
////////////////////////////////////////////////////////////////////////////////
window.sanitizeEmail = function(email) {
  return email.replace(/[.#$/\[\]]/g, "_");
};
window.sanitizeText = function(text) {
  return text.replace(/[.#$/\[\]\s]/g, "_");
};

////////////////////////////////////////////////////////////////////////////////
// Show/hide reply form for comments
////////////////////////////////////////////////////////////////////////////////
window.showReplyForm = function(parentPath, commentId) {
  const replyFormId = "reply-form-" + parentPath.replace(/[\/:]/g, "_") + "_" + commentId;
  const form = document.getElementById(replyFormId);
  if (form) {
    form.style.display = (form.style.display === "none" || form.style.display === "") ? "block" : "none";
  }
};

////////////////////////////////////////////////////////////////////////////////
// Add a new comment (top-level) in the Full Idea Modal
////////////////////////////////////////////////////////////////////////////////
window.addCommentModal = function(postId) {
  const container = document.getElementById('modalCommentForm_' + postId);
  const textarea = container.querySelector('.comment-input');
  const content = textarea.value.trim();
  if (!content) return;

  // increment the _next counter
  const nextRef = window.ref(window.database, "comments/" + postId + "/_next");
  window.runTransaction(nextRef, (current) => {
    return (current === null ? 0 : current) + 1;
  })
    .then((result) => {
      const commentNumber = result.snapshot.val();
      const newCommentId = "Comment_" + commentNumber;
      const commentData = {
        commenter: window.currentUserName || "DummyUser",
        timestamp: new Date().toLocaleString(),
        content: content,
        replies: {}
      };
      // Save comment
      return window.set(
        window.ref(window.database, "comments/" + postId + "/" + newCommentId),
        commentData
      );
    })
    .then(() => {
      textarea.value = "";
      container.style.display = "none";
    })
    .catch((error) => {
      console.error("Error posting comment:", error);
    });
};

////////////////////////////////////////////////////////////////////////////////
// Add a reply to a comment
////////////////////////////////////////////////////////////////////////////////
window.addReply = function(parentPath, commentId) {
  const replyFormId = "reply-form-" + parentPath.replace(/[\/:]/g, "_") + "_" + commentId;
  const replyInput = document.querySelector("#" + replyFormId + " .comment-input");
  const content = replyInput.value.trim();
  if (!content) return;

  const nextRef = window.ref(window.database, parentPath + "/" + commentId + "/_next");
  window.runTransaction(nextRef, (current) => {
    return (current === null ? 0 : current) + 1;
  })
    .then((result) => {
      const replyNumber = result.snapshot.val();
      const newReplyId = "Reply_" + replyNumber;
      const replyData = {
        replier: window.currentUserName || "DummyUser",
        timestamp: new Date().toLocaleString(),
        content: content
      };
      // Save reply
      return window.set(
        window.ref(window.database, parentPath + "/" + commentId + "/replies/" + newReplyId),
        replyData
      );
    })
    .then(() => {
      replyInput.value = "";
    })
    .catch((error) => {
      console.error("Error posting reply:", error);
    });
};

////////////////////////////////////////////////////////////////////////////////
// Show the full idea modal
////////////////////////////////////////////////////////////////////////////////
window.showFullIdea = function(ideaId) {
  const idea = ideas.find(i => i.id === ideaId);
  if (!idea) return;

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
               l1.06 1.06L12 21.23
               l7.78-7.78 1.06-1.06
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

////////////////////////////////////////////////////////////////////////////////
// Show/hide the top-level comment form
////////////////////////////////////////////////////////////////////////////////
window.toggleModalCommentForm = function(ideaId) {
  const container = document.getElementById('modalCommentForm_' + ideaId);
  container.style.display = (container.style.display === "none" || container.style.display === "") ? "block" : "none";
};

////////////////////////////////////////////////////////////////////////////////
// Fetch comments for a given post ID
////////////////////////////////////////////////////////////////////////////////
function fetchComments(postId) {
  const cRef = window.ref(window.database, "comments/" + postId);
  window.onValue(cRef, (snapshot) => {
    const data = snapshot.val();
    console.log("Comments for post:", postId, data); // debug
    let commHtml = "";
    if (data) {
      // Exclude "_next"
      const obj = {};
      for (const key in data) {
        if (key !== "_next") {
          obj[key] = data[key];
        }
      }
      // Sort by comment ID number
      const commArray = Object.entries(obj).map(([k,v]) => ({ id: k, ...v }));
      commArray.sort((a, b) => {
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

////////////////////////////////////////////////////////////////////////////////
// New Idea Form (submit)
////////////////////////////////////////////////////////////////////////////////
const newIdeaForm = document.getElementById('newIdeaForm');
newIdeaForm.addEventListener('submit', function(event) {
  event.preventDefault();
  const subject = document.getElementById('ideaSubject').value.trim();
  const description = document.getElementById('ideaDescription').value.trim();
  if (!subject || !description) return;

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

////////////////////////////////////////////////////////////////////////////////
// Scroll to comments in the Full Idea modal
////////////////////////////////////////////////////////////////////////////////
window.scrollToComments = function(e) {
  e.stopPropagation();
  const modalContent = document.querySelector('#fullIdeaModal .modal-content');
  if (modalContent) {
    const commSection = modalContent.querySelector('#commentsSection');
    if (commSection) {
      commSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
};
