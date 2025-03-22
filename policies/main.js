document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".policies-tabs .tab");
  const panels = document.querySelectorAll(".policy-panel");

  // Attach click handlers to each tab
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // 1) Remove 'active' from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // 2) Hide all panels
      panels.forEach((panel) => (panel.style.display = "none"));

      // 3) Mark clicked tab as active
      tab.classList.add("active");

      // 4) Show the corresponding panel
      const policyId = tab.getAttribute("data-policy");
      const panel = document.getElementById(policyId);
      if (panel) {
        panel.style.display = "block";
      }
    });
  });
});
