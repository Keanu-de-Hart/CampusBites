export function initHomepageEvents() {
  document.getElementById("OrderNowButton")
    ?.addEventListener("click", () => {
      window.location.href = "browse.html";
    });

  document.getElementById("LearnButton")
    ?.addEventListener("click", () => {
      document.getElementById("FeaturesSection")
        ?.scrollIntoView();
    });

  document.getElementById("BrowseVendors")
    ?.addEventListener("click", () => {
      window.location.href = "browse.html";
    });

  window.goToVendor = (vendorId) => {
    window.location.href =
      `vendor-profile.html?vendorId=${vendorId}`;
  };
}