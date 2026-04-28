import {
  db,
  getDocs,
  collection
} from "./database.js";

lucide.createIcons();

const orderNow = document.getElementById("OrderNowButton");
const learn = document.getElementById("LearnButton");
const browseVendors = document.getElementById("BrowseVendors");
const featuredVendors = document.getElementById("featured-vendors");

const vendorCategories = [
  "Fast Food",
  "Café",
  "Bakery",
  "Pizza",
  "Healthy Meals",
  "Desserts",
  "Beverages",
  "Grill House",
  "African Cuisine",
  "Asian Cuisine",
  "Snacks",
  "Ice Cream",
  "Breakfast",
  "Burgers",
  "Wraps & Sandwiches"
];
function assignCategory(vendorName = "") {
  const safeName = vendorName || "CampusBites Vendor";
  const index = safeName.length % vendorCategories.length;
  return vendorCategories[index];
}
orderNow?.addEventListener("click", () => {
  window.location.href = "browse.html";
});

learn?.addEventListener("click", () => {
  document.getElementById("FeaturesSection")?.scrollIntoView();
});

browseVendors?.addEventListener("click", () => {
  window.location.href = "browse.html";
});

let vendors = [];
let currentIndex = 0;

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function renderVendors() {
  if (!featuredVendors || vendors.length === 0) {
    featuredVendors.innerHTML = `
      <p class="text-center text-gray-500 col-span-3">
        No approved vendors available yet.
      </p>
    `;
    return;
  }

  const visibleVendors = vendors.slice(currentIndex, currentIndex + 3);

  if (visibleVendors.length < 3) {
    visibleVendors.push(...vendors.slice(0, 3 - visibleVendors.length));
  }

  featuredVendors.innerHTML = visibleVendors.map(vendor => `
    <article 
        class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:scale-105 transform duration-300 transition cursor-pointer vendor-slide"
        onclick="goToVendor('${vendor.id}')"
    >
      <img 
        src="${vendor.image || vendor.logo || "assets/default_vendor.jpg"}" 
        alt="${vendor.shopName || vendor.fullName || "Vendor"}"
        class="w-full h-48 object-contain bg-white p-4"
      >

      <figure class="p-6">
        <h3 class="text-xl font-semibold mb-2">
          ${vendor.shopName || vendor.fullName || "Unnamed Vendor"}
        </h3>

        <p class="text-gray-600 text-sm mb-2">
          ${vendor.category || assignCategory(vendor.shopName || vendor.fullName || vendor.email)} • ${vendor.location || "Campus"}
        </p>
      </figure>
    </article>
  `).join("");
}

window.goToVendor = function (vendorId) {
  window.location.href = `vendor-profile.html?vendorId=${vendorId}`;
};

async function loadFeaturedVendors() {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));

    vendors = usersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user =>
        user.role === "vendor" &&
        user.status === "approved"
      );

    vendors = shuffleArray(vendors);
    renderVendors();

    setInterval(() => {
      currentIndex = (currentIndex + 3) % vendors.length;
      renderVendors();
    }, 5000);

  } catch (error) {
    console.error("Error loading featured vendors:", error);

    featuredVendors.innerHTML = `
      <p class="text-center text-red-500 col-span-3">
        Failed to load featured vendors.
      </p>
    `;
  }
}

loadFeaturedVendors();