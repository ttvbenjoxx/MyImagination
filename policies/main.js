document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".policies-tabs .tab");
  const privacyCookiePanel = document.getElementById("privacyCookiePanel");
  const termsPanel = document.getElementById("termsPanel");
  const cookieSection = document.getElementById("cookieSection");

  // Hide Terms by default, show Privacy/Cookie
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

  // OPTIONAL Scroll Spy:
  // If you'd like the left tab to auto-change when you manually scroll
  // the entire page to #cookieSection, you can use an IntersectionObserver
  // with root: null (the entire viewport).
  // For example (uncomment if desired):

  /*
  let observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        // highlight "Cookie Policy" tab
        tabs.forEach((t) => t.classList.remove("active"));
        document
          .querySelector('.tab[data-policy="cookieSection"]')
          .classList.add("active");
      } else {
        // if we are not seeing cookieSection, highlight "Privacy Policy"
        // but only if Terms is not visible
        if (termsPanel.style.display === "none") {
          tabs.forEach((t) => t.classList.remove("active"));
          document
            .querySelector('.tab[data-policy="privacyCookieTop"]')
            .classList.add("active");
        }
      }
    });
  }, {
    root: null, // entire page
    threshold: 0.5,
  });

  observer.observe(cookieSection);
  */
});
