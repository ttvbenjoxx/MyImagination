document.addEventListener("DOMContentLoaded", function () {
  const tabs = document.querySelectorAll(".policies-tabs .tab");
  const privacyCookiePanel = document.getElementById("privacyCookiePanel");
  const termsPanel = document.getElementById("termsPanel");
  const cookieSection = document.getElementById("cookieSection");
  // Only highlight the h3 title
  const cookieTitle = document.querySelector(".cookie-title");

  // Hide Terms by default, show Privacy & Cookie
  termsPanel.style.display = "none";
  privacyCookiePanel.style.display = "block";

  // Click handlers for the left tabs
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active state from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Hide both panels
      privacyCookiePanel.style.display = "none";
      termsPanel.style.display = "none";

      // Show the correct panel
      const policyId = tab.getAttribute("data-policy");
      if (policyId === "privacyCookieTop") {
        privacyCookiePanel.style.display = "block";
        // Scroll to the top anchor
        const topAnchor = document.getElementById("privacyCookieTop");
        if (topAnchor) {
          topAnchor.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
        tab.classList.add("active");
      } else if (policyId === "cookieSection") {
        privacyCookiePanel.style.display = "block";
        // Scroll so that #cookieSection is in the middle
        cookieSection.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        tab.classList.add("active");

        // Briefly highlight ONLY the cookie title
        cookieTitle.classList.add("highlight");
        // Wait 1 second, then remove highlight => triggers 1s fade out
        setTimeout(() => {
          cookieTitle.classList.remove("highlight");
        }, 1000);
      } else if (policyId === "terms") {
        termsPanel.style.display = "block";
        tab.classList.add("active");
      }
    });
  });

  // SCROLL SPY: if user scrolls back up from cookie section, auto-select Privacy Policy
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // If #cookieSection is at least 50% in view
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // highlight Cookie Policy tab
          tabs.forEach((t) => t.classList.remove("active"));
          document
            .querySelector('.tab[data-policy="cookieSection"]')
            .classList.add("active");
        } else {
          // If Terms is hidden and cookieSection is not in view, revert to Privacy Policy
          if (termsPanel.style.display === "none") {
            tabs.forEach((t) => t.classList.remove("active"));
            document
              .querySelector('.tab[data-policy="privacyCookieTop"]')
              .classList.add("active");
          }
        }
      });
    },
    {
      root: null, // entire browser viewport
      threshold: 0.5, // must be at least 50% in view
    }
  );

  observer.observe(cookieSection);
});
