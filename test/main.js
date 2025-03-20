// main.js
// All UI logic: modals, tutorial, idea rendering, toggling likes, etc.

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

window.unlockSite = function() {
  window.siteLocked = false;
  document.getElementById('ideasGrid').classList.remove('locked');
  document.getElementById('filterBtn').style.display = 'flex';
  document.getElementById('newIdeaBtn').style.display = 'block';
  window.hideModal('introModal');
};

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

// Hide modal when clicking the modal background
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e){
    if(e.target === modal){
      hideModal(modal.id);
    }
  });
});

// DATA / RENDERING
window.siteLocked = true;
window.userLikes = new Set();
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
    console.log("Fetched ideas from DB:", ideas); // debug
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
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0
                  L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78
                  l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06
                  a5.5 5.5 0 0 0 0-7.78z"></path>
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
