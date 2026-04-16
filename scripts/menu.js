import {
  db,
  auth,
  onAuthStateChanged,
  signOut,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  doc,
  serverTimestamp
} from "./database.js";

// ── State ─────────────────────────────────────────────────────────────
let currentVendorId = null;
let deleteTargetId = null;

// ── Helpers ────────────────────────────────────────────────────────────
function getEl(id) {
  return document.getElementById(id);
}

// ── AUTH GUARD (SAFE FOR TESTS) ────────────────────────────────────────
function initAuth() {
  if (!auth || typeof onAuthStateChanged !== "function") return;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      if (typeof window !== "undefined") {
        window.location.href = "login.html";
      }
      return;
    }
    currentVendorId = user.uid;
    loadMenuItems();
  });
}

// ── LOGOUT ─────────────────────────────────────────────────────────────
function initLogout() {
  const btn = getEl("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}

// ── UI HELPERS ────────────────────────────────────────────────────────
function showError(msg) {
  const el = getEl("form-error");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function hideError() {
  const el = getEl("form-error");
  if (!el) return;
  el.classList.add("hidden");
}

export function setSaveLoading(loading) {
  const btn = getEl("save-btn");
  const spinner = getEl("save-spinner");
  const btnText = getEl("save-btn-text");

  if (btn) btn.disabled = loading;
  if (btnText) btnText.textContent = loading ? "Saving…" : "Save Item";
  if (spinner) spinner.classList.toggle("hidden", !loading);
}

function formatPrice(price) {
  return `R ${Number(price).toFixed(2)}`;
}

function getCheckedValues(selector) {
  return [...document.querySelectorAll(selector + ":checked")].map(c => c.value);
}

// ── LOAD MENU ITEMS ───────────────────────────────────────────────────
export async function loadMenuItems() {
  const loading = getEl("loading-state");
  const empty = getEl("empty-state");
  const table = getEl("menu-table-wrapper");
  const tbody = getEl("menu-table-body");

  loading?.classList.remove("hidden");
  empty?.classList.add("hidden");
  table?.classList.add("hidden");

  try {
    const q = query(
      collection(db, "menu_items"),
      where("vendorId", "==", currentVendorId)
    );

    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    loading?.classList.add("hidden");

    if (!items.length) {
      empty?.classList.remove("hidden");
      return;
    }

    if (!tbody) return;

    tbody.innerHTML = items.map(item => `
      <tr>
        <td class="px-6 py-4">
          <span class="font-medium block">${item.name}</span>
          <span class="text-xs text-gray-500">
            ${item.description?.slice(0, 60) || ""}
            ${item.description?.length > 60 ? "…" : ""}
          </span>
        </td>

        <td class="px-6 py-4 text-sm text-gray-500">${item.category}</td>

        <td class="px-6 py-4 text-sm font-medium">${formatPrice(item.price)}</td>

        <td class="px-6 py-4">
          ${(item.dietary || []).map(tag =>
            `<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">${tag}</span>`
          ).join("")}
        </td>

        <td class="px-6 py-4">
          <span class="px-2 py-1 rounded-full text-xs font-medium ${
            item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }">
            ${item.available ? "Available" : "Sold Out"}
          </span>
        </td>

        <td class="px-6 py-4">
          <button onclick="window.menuActions.toggleAvailability('${item.id}', ${item.available})">
            Toggle
          </button>
        </td>
      </tr>
    `).join("");

    table?.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    loading?.classList.add("hidden");
    alert("Failed to load menu items.");
  }
}

// ── SAVE ITEM ──────────────────────────────────────────────────────────
export async function saveItem(e) {
  e.preventDefault();
  hideError();

  const name = getEl("item-name")?.value?.trim();
  const description = getEl("item-description")?.value?.trim();
  const price = parseFloat(getEl("item-price")?.value);
  const category = getEl("item-category")?.value;
  const available = getEl("item-available")?.checked;
  const editId = getEl("edit-item-id")?.value;

  if (!name || !description || isNaN(price)) {
    showError("Invalid input");
    return;
  }

  setSaveLoading(true);

  const data = {
    name,
    description,
    price,
    category,
    available,
    vendorId: currentVendorId,
    updatedAt: serverTimestamp()
  };

  try {
    if (editId) {
      await updateDoc(doc(db, "menu_items", editId), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "menu_items"), data);
    }

    closeModal();
    await loadMenuItems();

  } catch (err) {
    console.error(err);
    showError("Save failed");
  } finally {
    setSaveLoading(false);
  }
}

// ── ACTIONS ────────────────────────────────────────────────────────────
export async function toggleAvailability(itemId, current) {
  try {
    await updateDoc(doc(db, "menu_items", itemId), {
      available: !current
    });
    await loadMenuItems();
  } catch (err) {
    console.error(err);
  }
}

// ── MODALS ─────────────────────────────────────────────────────────────
export function openEditItem() {}
export function closeModal() {
  getEl("item-edit-modal")?.classList.add("hidden");
}

export function openAddItemModal() {
  const form = getEl("item-form");
  if (form?.reset) form.reset();

  const id = getEl("edit-item-id");
  if (id) id.value = "";

  const title = getEl("modal-title");
  if (title) title.textContent = "Add Menu Item";

  hideError();

  getEl("item-edit-modal")?.classList.remove("hidden");
}

export function confirmDelete(id) {
  deleteTargetId = id;
  getEl("delete-modal")?.classList.remove("hidden");
}

export function closeDeleteModal() {
  deleteTargetId = null;
  getEl("delete-modal")?.classList.add("hidden");
}

// ── DELETE BUTTON ──────────────────────────────────────────────────────
function initDelete() {
  const btn = getEl("confirm-delete-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!deleteTargetId) return;

    try {
      await deleteDoc(doc(db, "menu_items", deleteTargetId));
      closeDeleteModal();
      await loadMenuItems();
    } catch (err) {
      console.error(err);
    }
  });
}

// ── INIT FUNCTION (IMPORTANT FOR TESTS) ────────────────────────────────
export function initMenu() {
  initAuth();
  initLogout();
  initDelete();

  const form = getEl("item-form");
  if (form) form.addEventListener("submit", saveItem);

  window.menuActions = {
    openAddItemModal,
    openEditItem,
    toggleAvailability,
    confirmDelete,
    closeModal,
    closeDeleteModal
  };
}

// auto-run safely
if (typeof document !== "undefined") {
  if (document.readyState !== "loading") {
    initMenu();
  } else {
    document.addEventListener("DOMContentLoaded", initMenu);
  }
}

// ── EXPORTS FOR TESTS ──────────────────────────────────────────────────
export function formatMenuPrice(price) {
  return `R${Number(price).toFixed(2)}`;
}

export function buildItemData(data) {
  const obj = {
    ...data,
    available: true
  };

  if (!data.imageUrl) delete obj.image;
  else obj.image = data.imageUrl;

  return obj;
}
