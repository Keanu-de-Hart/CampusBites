/**
 * @jest-environment jsdom
 */

global.lucide = { createIcons: jest.fn() };

jest.mock("../scripts/database.js", () => ({
  auth: {},
  db: {},
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn((db, collectionName) => collectionName),
  onAuthStateChanged: jest.fn()
}));

const sampleItems = [
  {
    id: "1",
    name: "Burger",
    vendorName: "Shop1",
    vendorId: "vendor-1",
    price: 50,
    description: "Tasty",
    category: "Mains",
    available: true,
    status: "approved",
    dietary: ["Vegan"],
    allergens: []
  },
  {
    id: "2",
    name: "Pizza",
    vendorName: "Shop2",
    vendorId: "vendor-2",
    price: 80,
    description: "Cheesy",
    category: "Mains",
    available: true,
    status: "approved",
    dietary: [],
    allergens: ["Gluten"]
  },
  {
    id: "3",
    name: "Salad",
    vendorName: "Shop1",
    vendorId: "vendor-1",
    price: 35,
    description: "Fresh",
    category: "Sides",
    available: false,
    status: "approved",
    dietary: ["Vegetarian"],
    allergens: []
  },
  {
    id: "4",
    name: "Wrap",
    vendorName: "Shop3",
    vendorId: "vendor-3",
    price: 45,
    description: "Halal wrap",
    category: "Wraps",
    available: true,
    status: "approved",
    dietary: ["Halal"],
    allergens: []
  },
  {
    id: "6",
    name: "Rejected Item",
    vendorName: "Shop1",
    vendorId: "vendor-1",
    price: 25,
    description: "Should not show",
    category: "Mains",
    available: true,
    status: "suspended",
    dietary: [],
    allergens: []
  }
];

const approvedVendors = [
  {
    id: "vendor-1",
    role: "vendor",
    status: "approved",
    shopName: "Shop1",
    location: "Matrix"
  },
  {
    id: "vendor-2",
    role: "vendor",
    status: "approved",
    shopName: "Shop2",
    location: "Library Lawns"
  },
  {
    id: "vendor-3",
    role: "vendor",
    status: "approved",
    shopName: "Shop3",
    location: "Great Hall"
  }
];

const makeSnapshot = (items) => ({
  docs: items.map((item) => ({
    id: item.id,
    data: () => {
      const { id, ...rest } = item;
      return rest;
    }
  }))
});

const mockBrowseQueries = (db, items = sampleItems, vendors = approvedVendors) => {
  db.getDocs.mockImplementation(async (collectionName) => {
    if (collectionName === "menu_items") {
      return makeSnapshot(items);
    }

    if (collectionName === "users") {
      return makeSnapshot(vendors);
    }

    return makeSnapshot([]);
  });
};

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("browse.js", () => {
  let db;
  let alertSpy;
  let errorSpy;

  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <select id="Vendors">
        <option value="AllVendors">All Vendors</option>
      </select>

      <select id="Categories">
        <option value="AllCategories">All Categories</option>
        <option value="Mains">Mains</option>
        <option value="Sides">Sides</option>
        <option value="Wraps">Wraps</option>
      </select>

      <input id="Vegan" type="checkbox" />
      <input id="Vegetarian" type="checkbox" />
      <input id="Gluten-Free" type="checkbox" />
      <input id="Halal" type="checkbox" />

      <button id="cart"></button>
      <p id="numItems"></p>
      <p id="numItemsCart"></p>
      <span id="cartCount"></span>
      <section id="cartWarning" class="hidden"></section>
      <section id="PriceFilter"></section>

      <section id="menu"></section>

      <section id="item-edit-modal" class="hidden"></section>
      <section id="cartList"></section>
      <section id="details-modal" class="hidden"></section>

      <button id="closeCartModal"></button>
      <button id="checkOut">Pay Now</button>
    `;

    localStorage.clear();

    db = require("../scripts/database.js");

    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb(null));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test("renders available and approved items only", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    const html = document.getElementById("menu").innerHTML;

    expect(html).toContain("Burger");
    expect(html).toContain("Pizza");
    expect(html).toContain("Wrap");
    expect(html).not.toContain("Salad");
    expect(html).not.toContain("Rejected Item");
  });

  test("updates count text", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    expect(document.getElementById("numItems").textContent).toBe("3 items found");
  });

  test("adds item to cart and opens cart modal", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.querySelector(".add-cart-btn").click();
    document.getElementById("cart").click();

    expect(document.getElementById("item-edit-modal").classList.contains("hidden")).toBe(false);
    expect(document.getElementById("cartList").innerHTML).toContain("Burger");
    expect(document.getElementById("numItemsCart").textContent).toBe("1 item in cart");
  });

  test("removes item from cart", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.querySelector(".add-cart-btn").click();
    document.getElementById("cart").click();
    document.querySelector(".remove-cart-btn").click();

    expect(document.getElementById("cartList").innerHTML).not.toContain("Burger");
  });

  test("shows warning when cart empty", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("checkOut").click();

    expect(document.getElementById("cartWarning").classList.contains("hidden")).toBe(false);
  });

  test("alerts when user not logged in", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("checkOut").click();

    expect(alertSpy).toHaveBeenCalledWith("You must be logged in to proceed to checkout");
  });

  test("posts cart items to PayFast and submits returned form", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        action: "https://sandbox.payfast.co.za/eng/process",
        fields: {
          merchant_id: "10000100",
          amount: "130.00",
          signature: "abc"
        }
      })
    });

    const submitSpy = jest
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.querySelector('.add-cart-btn[data-item-id="1"]').click();
    document.querySelector('.add-cart-btn[data-item-id="2"]').click();
    document.getElementById("checkOut").click();

    await flush();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/payfast/create-payment",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "customer-1",
          cart: [{ menuItemId: "1" }, { menuItemId: "2" }]
        })
      })
    );

    expect(document.querySelector('form[action="https://sandbox.payfast.co.za/eng/process"]')).toBeTruthy();
    expect(submitSpy).toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("cart") || "[]")).toEqual([]);
  });

  test("sends all cart entries to PayFast even when items share a vendor", async () => {
    mockBrowseQueries(
      db,
      [
        sampleItems[0],
        {
          id: "5",
          name: "Fries",
          vendorName: "Shop1",
          vendorId: "vendor-1",
          price: 20,
          description: "Crispy",
          category: "Sides",
          available: true,
          status: "approved",
          dietary: [],
          allergens: []
        }
      ],
      [approvedVendors[0]]
    );

    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        action: "https://sandbox.payfast.co.za/eng/process",
        fields: { merchant_id: "10000100" }
      })
    });

    jest.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.querySelector('.add-cart-btn[data-item-id="1"]').click();
    document.querySelector('.add-cart-btn[data-item-id="5"]').click();
    document.getElementById("checkOut").click();

    await flush();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/payfast/create-payment",
      expect.objectContaining({
        body: JSON.stringify({
          userId: "customer-1",
          cart: [{ menuItemId: "1" }, { menuItemId: "5" }]
        })
      })
    );
  });

  test("handles PayFast failure", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "boom" })
    });

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.querySelector(".add-cart-btn").click();
    document.getElementById("checkOut").click();

    await flush();

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("boom"));
    expect(document.getElementById("checkOut").disabled).toBe(false);
  });

  test("filters by vendor", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("Vendors").value = "Shop1";
    document.getElementById("Vendors").dispatchEvent(new Event("change"));

    await flush();

    const html = document.getElementById("menu").innerHTML;

    expect(html).toContain("Burger");
    expect(html).not.toContain("Pizza");
    expect(html).not.toContain("Wrap");
  });

  test("renders empty cart message when cart is opened with no items", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("cart").click();

    expect(document.getElementById("cartList").innerHTML).toContain("Your cart is empty.");
    expect(document.getElementById("numItemsCart").textContent).toBe("0 items in cart");
  });

  test("closes cart modal when close button is clicked", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("cart").click();
    document.getElementById("closeCartModal").click();

    expect(document.getElementById("item-edit-modal").classList.contains("hidden")).toBe(true);
  });

  test("filters vegan items", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("Vegan").checked = true;
    document.getElementById("Vegan").dispatchEvent(new Event("click"));

    await flush();

    const html = document.getElementById("menu").innerHTML;

    expect(html).toContain("Burger");
    expect(html).not.toContain("Pizza");
    expect(html).not.toContain("Wrap");
  });

  test("filters halal items", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("Halal").checked = true;
    document.getElementById("Halal").dispatchEvent(new Event("click"));

    await flush();

    const html = document.getElementById("menu").innerHTML;

    expect(html).toContain("Wrap");
    expect(html).not.toContain("Burger");
    expect(html).not.toContain("Pizza");
  });

  test("filters gluten-free items", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("Gluten-Free").checked = true;
    document.getElementById("Gluten-Free").dispatchEvent(new Event("click"));

    await flush();

    const html = document.getElementById("menu").innerHTML;

    expect(html).toContain("Burger");
    expect(html).toContain("Wrap");
    expect(html).not.toContain("Pizza");
  });

  test("filters by category", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("Categories").value = "Wraps";
    document.getElementById("Categories").dispatchEvent(new Event("change"));

    await flush();

    const html = document.getElementById("menu").innerHTML;

    expect(html).toContain("Wrap");
    expect(html).not.toContain("Burger");
    expect(html).not.toContain("Pizza");
  });

  test("price slider filters items by max price", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    const slider = document.getElementById("PriceSlider");

    expect(slider).not.toBeNull();

    slider.value = "40";
    slider.dispatchEvent(new Event("click", { bubbles: true }));

    await flush();

    const html = document.getElementById("menu").innerHTML;

    expect(html).not.toContain("Burger");
    expect(html).not.toContain("Pizza");
    expect(html).not.toContain("Wrap");
  });

  test("remove cart ignores invalid index", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "user-1" }));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.querySelector(".add-cart-btn").click();
    document.getElementById("cart").click();

    const btn = document.createElement("button");
    btn.className = "remove-cart-btn";
    btn.dataset.cartIndex = "invalid";

    document.getElementById("cartList").appendChild(btn);
    btn.click();

    expect(document.getElementById("cartList").innerHTML).toContain("Burger");
  });

  test("opens item details modal when Details button is clicked", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.querySelector(".item-details-btn").click();

    const modal = document.getElementById("details-modal");

    expect(modal.classList.contains("hidden")).toBe(false);
    expect(modal.innerHTML).toContain("Burger");
  });

  test("renders vendor location in item details modal", async () => {
    mockBrowseQueries(db, [sampleItems[0]], [approvedVendors[0]]);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.querySelector(".item-details-btn").click();

    expect(document.getElementById("details-modal").innerHTML).toContain("Matrix");
  });

  test("renders nutritional info in modal", async () => {
    mockBrowseQueries(
      db,
      [
        {
          ...sampleItems[0],
          calories: 500,
          protein: 20,
          carbs: 60
        }
      ],
      approvedVendors
    );

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.querySelector(".item-details-btn").click();

    const html = document.getElementById("details-modal").innerHTML;

    expect(html).toContain("500");
    expect(html).toContain("20");
    expect(html).toContain("60");
  });

  test("closes item details modal when close button is clicked", async () => {
    mockBrowseQueries(db);

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.querySelector(".item-details-btn").click();

    expect(document.getElementById("details-modal").classList.contains("hidden")).toBe(false);

    document.getElementById("closeDetailsModal").click();

    expect(document.getElementById("details-modal").classList.contains("hidden")).toBe(true);
  });

  test("adds item to cart from details modal", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.querySelector(".item-details-btn").click();
    document.getElementById("detailsAddToCart").click();

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    expect(cart).toHaveLength(1);
    expect(cart[0].name).toBe("Burger");
    expect(document.getElementById("details-modal").classList.contains("hidden")).toBe(true);
  });
  test("handles items with no dietary or allergens", async () => {
  mockBrowseQueries(db, [
    {
      id: "10",
      name: "Simple Food",
      vendorId: "vendor-1",
      price: 20,
      available: true,
      status: "approved"
    }
  ]);

  const mod = await import("../scripts/browse.js");
  await mod.loadBrowseItems();

  expect(document.getElementById("menu").innerHTML)
    .toContain("Simple Food");
});
test("modal close button does nothing if missing", async () => {
  mockBrowseQueries(db);

  const mod = await import("../scripts/browse.js");
  await mod.loadBrowseItems();

  document.getElementById("details-modal").innerHTML = "";

  // should not crash
  expect(() => {
    document.getElementById("closeDetailsModal")?.click();
  }).not.toThrow();
});
});