document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".policies-tabs .tab");
  const panels = document.querySelectorAll(".policy-panel");

  // When a tab is clicked, hide all panels and show the relevant one
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove 'active' from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Hide all panels
      panels.forEach((panel) => (panel.style.display = "none"));

      // Mark this tab as active
      tab.classList.add("active");
      // Show the corresponding panel
      const policyId = tab.getAttribute("data-policy");
      const panel = document.getElementById(policyId);
      if (panel) {
        panel.style.display = "block";
      }
    });
  });
});
