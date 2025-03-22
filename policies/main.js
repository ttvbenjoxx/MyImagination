document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".policies-tabs .tab");
  const panels = document.querySelectorAll(".policy-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Hide all panels
      panels.forEach((panel) => (panel.style.display = "none"));

      // Mark clicked tab as active and show its panel
      tab.classList.add("active");
      const policyId = tab.getAttribute("data-policy");
      const panel = document.getElementById(policyId);
      if (panel) {
        panel.style.display = "block";
      }
    });
  });
});
