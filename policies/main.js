document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".policies-tabs .tab");
  const privacyCookiePanel = document.getElementById("privacyCookiePanel");
  const termsPanel = document.getElementById("termsPanel");

  // For scroll spy: detect when #cookieSection is in view
  const cookieSection = document.getElementById("cookieSection");
  let observer = null;

  // Hide all panels except the Privacy/Cookie one by default
  termsPanel.style.display = "none";
  privacyCookiePanel.style.display = "block";

  // Click handler for each tab
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const policyId = tab.getAttribute("data-policy");

      // Remove 'active' from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Hide both panels
      privacyCookiePanel.style.display = "none";
      termsPanel.style.display = "none";

      // Decide which panel to show
      if (policyId === "privacyCookieTop") {
        // Show the privacyCookiePanel
        privacyCookiePanel.style.display = "block";
        // Make this tab active
        tab.classList.add("active");
        // Scroll to the top anchor (#privacyCookieTop)
        const topAnchor = document.getElementById("privacyCookieTop");
        if (topAnchor) {
          topAnchor.scrollIntoView({ behavior: "smooth" });
        }
      } else if (policyId === "cookieSection") {
        // Show the privacyCookiePanel
        privacyCookiePanel.style.display = "block";
        // Make this tab active
        tab.classList.add("active");
        // Scroll to the cookieSection
        cookieSection.scrollIntoView({ behavior: "smooth" });
      } else if (policyId === "terms") {
        // Show Terms of Service
        termsPanel.style.display = "block";
        tab.classList.add("active");
      }
    });
  });

  // SCROLL SPY:
  // If the user scrolls to #cookieSection, highlight "Cookie Policy" tab
  // otherwise highlight "Privacy Policy" tab, as long as Terms panel is hidden.
  function onIntersection(entries) {
    entries.forEach((entry) => {
      // If cookieSection is at least 50% in view, highlight "Cookie Policy"
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        // Make "Cookie Policy" tab active
        tabs.forEach((t) => t.classList.remove("active"));
        document
          .querySelector('.tab[data-policy="cookieSection"]')
          .classList.add("active");
      } else {
        // If cookieSection is not in view, highlight "Privacy Policy"
        // but only if the Terms panel is not showing
        if (termsPanel.style.display === "none") {
          tabs.forEach((t) => t.classList.remove("active"));
          document
            .querySelector('.tab[data-policy="privacyCookieTop"]')
            .classList.add("active");
        }
      }
    });
  }

  // Set up IntersectionObserver to watch cookieSection
  observer = new IntersectionObserver(onIntersection, {
    root: document.querySelector(".policy-content-card"), // watch scrolling inside the card
    threshold: 0.5, // must be 50% in view
  });

  if (cookieSection) {
    observer.observe(cookieSection);
  }
});
