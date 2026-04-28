import { db, getDocs, collection } from "./database.js";
import {
  assignCategory,
  getVendorRating,
  shuffleArray
} from "./vendorUtils.js";

let vendors = [];
let currentIndex = 0;

export function renderStars(rating) {
  const rounded = Math.round(Number(rating));
  let stars = "";

  for (let i = 1; i <= 5; i++) {
    stars += `
      <i data-lucide="star"
      class="w-4 h-4 ${i <= rounded ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}"></i>
    `;
  }

  return stars;
}

export function renderVendors(container) {
  if (!container || vendors.length === 0) {
    container.innerHTML = `
      <p class="text-center text-gray-500 col-span-3">
        No approved vendors available yet.
      </p>
    `;
    return;
  }

  const visible = vendors.slice(currentIndex, currentIndex + 3);

  container.innerHTML = visible.map(vendor => {
    const rating = getVendorRating(vendor);

    return `
      <article
        onclick="goToVendor('${vendor.id}')"
        class="bg-white rounded-xl shadow-md cursor-pointer"
      >
        <img
          src="${vendor.image || "assets/default_vendor.jpg"}"
          class="w-full h-52 object-cover"
        >

        <figure class="p-6">
          <h3>${vendor.shopName || "Unnamed Vendor"}</h3>

          <p>
            ${vendor.category || assignCategory(vendor.shopName)}
            • ${vendor.location || "Campus"}
          </p>

          <p>
            ${renderStars(rating)}
            ${rating}/5
          </p>
        </figure>
      </article>
    `;
  }).join("");

  lucide.createIcons();
}

export async function loadFeaturedVendors(container) {
  try {
    const snap = await getDocs(collection(db, "users"));

    vendors = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(v => v.role === "vendor" && v.status === "approved");

    vendors = shuffleArray(vendors);

    renderVendors(container);

    setInterval(() => {
      currentIndex = (currentIndex + 3) % vendors.length;
      renderVendors(container);
    }, 5000);

  } catch {
    container.innerHTML = `
      <p class="text-red-500 text-center">
        Failed to load featured vendors.
      </p>
    `;
  }
}