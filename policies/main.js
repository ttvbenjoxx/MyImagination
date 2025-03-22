document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".policies-tabs .tab");
  const panels = document.querySelectorAll(".policy-panel");
  const internalLinks = document.querySelectorAll(".internal-link");

  // 1) Tab switching
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove 'active' from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Hide all panels
      panels.forEach((panel) => (panel.style.display = "none"));

      // Mark clicked tab as active
      tab.classList.add("active");
      // Show the corresponding panel
      const panelId = tab.getAttribute("data-policy");
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.style.display = "block";
      }
    });
  });

  // 2) Internal links for cross-policy references
  internalLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetPanelId = link.getAttribute("href").substring(1); // e.g. "privacyPanel"
      const targetTitleId = link.getAttribute("data-target");       // e.g. "privacyTitle"

      // Switch to the correct tab
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => (p.style.display = "none"));

      // Find the tab referencing this panel
      const targetTab = document.querySelector(`.tab[data-policy="${targetPanelId}"]`);
      if (targetTab) {
        targetTab.classList.add("active");
      }

      // Show the panel
      const targetPanel = document.getElementById(targetPanelId);
      if (targetPanel) {
        targetPanel.style.display = "block";
      }

      // Scroll to the specific heading & highlight
      const heading = document.getElementById(targetTitleId);
      if (heading) {
        heading.scrollIntoView({ behavior: "smooth", block: "center" });
        heading.classList.add("highlighted-section");

        // Remove highlight after 2 seconds
        setTimeout(() => {
          heading.classList.remove("highlighted-section");
        }, 2000);
      }
    });
  });
});
