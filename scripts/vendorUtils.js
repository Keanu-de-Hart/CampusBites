export const vendorCategories = [
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

export function assignCategory(vendorName = "") {
  const safeName = vendorName || "CampusBites Vendor";
  return vendorCategories[safeName.length % vendorCategories.length];
}

export function getVendorRating(vendor) {
  if (vendor.rating) return Number(vendor.rating).toFixed(1);

  const name = vendor.shopName || vendor.fullName || vendor.email || "vendor";

  const total = name
    .split("")
    .reduce((sum, c) => sum + c.charCodeAt(0), 0);

  return (3.8 + (total % 12) / 10).toFixed(1);
}

export function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}