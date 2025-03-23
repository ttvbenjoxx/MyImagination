document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".policies-tabs .tab");
  const panels = document.querySelectorAll(".policy-panel");
  const internalLinks = document.querySelectorAll(".internal-link");

  /**
   * openPanel(panelId, highlightId)
   * - Removes 'active' from all tabs
   * - Hides all panels
   * - Activates the tab that corresponds to panelId
   * - Displays that panel
   * - Optionally scrolls to highlightId
   */
  function openPanel(panelId, highlightId) {
    // Deactivate all tabs
    tabs.forEach((t) => t.classList.remove("active"));
    // Hide all panels
    panels.forEach((p) => (p.style.display = "none"));

    // Activate the tab for this panel
    const targetTab = document.querySelector(`.tab[data-policy="${panelId}"]`);
    if (targetTab) {
      targetTab.classList.add("active");
    }

    // Show the panel
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
      targetPanel.style.display = "block";
    }

    // If a heading ID is given, scroll to it & highlight
    if (highlightId) {
      const heading = document.getElementById(highlightId);
      if (heading) {
        heading.scrollIntoView({ behavior: "smooth", block: "center" });
        heading.classList.add("highlighted-section");
        // Remove highlight after 2 seconds
        setTimeout(() => {
          heading.classList.remove("highlighted-section");
        }, 2000);
      }
    }
  }

  // 1) Tab switching
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const panelId = tab.getAttribute("data-policy");
      openPanel(panelId);
    });
  });

  // 2) Internal links for cross-policy references
  internalLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetPanelId = link.getAttribute("href").substring(1); // e.g. "privacyPanel"
      const targetTitleId = link.getAttribute("data-target");       // e.g. "privacyTitle"
      openPanel(targetPanelId, targetTitleId);
    });
  });

  // 3) If page loads with a hash in the URL, open that panel automatically
  if (window.location.hash) {
    const initialPanelId = window.location.hash.substring(1); // remove "#"
    openPanel(initialPanelId);
  } else {
    // Default to the first tab/panel if no hash
    openPanel("termsPanel");
  }
});
