import {
  auth,
  db,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "./database.js";


//identify vendor
let currentVendorId = null;

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentVendorId = user.uid;

  loadMenuItems();
  loadOrders();
});
