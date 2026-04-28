import { loadFeaturedVendors } from "./featuredVendors.js";
import { initHomepageEvents } from "./homepageEvents.js";

lucide.createIcons();

initHomepageEvents();

loadFeaturedVendors(
  document.getElementById("featured-vendors")
);