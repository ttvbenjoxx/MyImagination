document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".policies-tabs .tab");
  const panels = document.querySelectorAll(".policy-panel");

  // When a tab is clicked, hide all panels and show the relevant one
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // 1) remove 'active' from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // 2) hide all panels
      panels.forEach((panel) => (panel.style.display = "none"));

      // 3) mark this tab active
      tab.classList.add("active");
      // 4) show the corresponding panel
      const policyId = tab.getAttribute("data-policy");
      const panel = document.getElementById(policyId);
      if (panel) {
        panel.style.display = "block";
      }
    });
  });
});
