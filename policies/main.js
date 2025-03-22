document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".policies-tabs .tab");
  const privacyCookiePanel = document.getElementById("privacyCookiePanel");
  const termsPanel = document.getElementById("termsPanel");
  const cookieSection = document.getElementById("cookieSection");

  // Hide Terms by default, show Privacy & Cookie
  termsPanel.style.display = "none";
  privacyCookiePanel.style.display = "block";

  // Clicking the left tabs
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Clear all active states
      tabs.forEach((t) => t.classList.remove("active"));
      // Hide both panels
      privacyCookiePanel.style.display = "none";
      termsPanel.style.display = "none";

      // Show the correct panel
      const policyId = tab.getAttribute("data-policy");
      if (policyId === "privacyCookieTop") {
        // Show the Privacy & Cookie panel
        privacyCookiePanel.style.display = "block";
        // Scroll to the top anchor
        const topAnchor = document.getElementById("privacyCookieTop");
        if (topAnchor) {
          topAnchor.scrollIntoView({ behavior: "smooth" });
        }
        tab.classList.add("active");
      } else if (policyId === "cookieSection") {
        // Show the Privacy & Cookie panel
        privacyCookiePanel.style.display = "block";
        // Scroll to #cookieSection
        cookieSection.scrollIntoView({ behavior: "smooth" });
        tab.classList.add("active");
      } else if (policyId === "terms") {
        // Show Terms panel
        termsPanel.style.display = "block";
        tab.classList.add("active");
      }
    });
  });
});
