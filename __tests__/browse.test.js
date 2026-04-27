/**
 * @jest-environment jsdom
 */

global.lucide = { createIcons: jest.fn() };

jest.mock("../scripts/database.js", () => ({
  auth: {},
  db: {},
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  collection: jest.fn((...args) => args),
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
    dietary: ["Halal"],
    allergens: []
  }
];

const approvedVendors = [
  { id: "vendor-1", role: "vendor", status: "approved", shopName: "Shop1" },
  { id: "vendor-2", role: "vendor", status: "approved", shopName: "Shop2" },
  { id: "vendor-3", role: "vendor", status: "approved", shopName: "Shop3" }
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
  db.getDocs
    .mockResolvedValueOnce(makeSnapshot(items))   // menu_items
    .mockResolvedValueOnce(makeSnapshot(vendors)); // users
};

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

describe("browse.js", () => {
  let db;
  let alertSpy;
  let errorSpy;

  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <a id="AdmindashboardLink"></a>
      <a id="CustomerdashboardLink"></a>
      <a id="VendordashboardLink"></a>
      <a id="loginLink"></a>

      <select id="Vendors">
        <option value="AllVendors">AllVendors</option>
      </select>

      <select id="Categories">
        <option value="AllCategories">AllCategories</option>
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
      <div id="cartWarning" class="hidden"></div>

      <section id="menu"></section>

      <div id="item-edit-modal" class="hidden"></div>
      <h3 id="modal-title"></h3>
      <section id="cartList"></section>

      <button id="checkOut">Check Out</button>
    `;

    db = require("../scripts/database.js");

    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders available items only", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb(null));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    const html = document.getElementById("menu").innerHTML;
    expect(html).toContain("Burger");
    expect(html).toContain("Pizza");
    expect(html).toContain("Wrap");
    expect(html).not.toContain("Salad");
  });

  test("updates count text for multiple items", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb(null));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    expect(document.getElementById("numItems").textContent).toBe("3 items found");
  });

  test("adds item to cart and opens cart modal", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("Shop1Burger").click();
    document.getElementById("cart").click();

    expect(document.getElementById("modal-title").textContent).toBe("Items in Cart");
    expect(document.getElementById("item-edit-modal").classList.contains("hidden")).toBe(false);
    expect(document.getElementById("cartList").innerHTML).toContain("Burger");
    expect(document.getElementById("numItemsCart").textContent).toBe("1 item in cart");
  });

  test("removes item from cart", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("Shop1Burger").click();
    document.getElementById("cart").click();

    const removeButton = document.querySelector("#cartList button");
    removeButton.click();

    expect(document.getElementById("cartList").innerHTML).not.toContain("Burger");
    expect(document.getElementById("numItemsCart").textContent).toBe("0 items in cart");
  });

  test("shows warning when logged in user checks out with empty cart", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("checkOut").click();

    expect(document.getElementById("cartWarning").classList.contains("hidden")).toBe(false);
    expect(db.addDoc).not.toHaveBeenCalled();
  });

  test("alerts when logged out user tries to check out", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb(null));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("checkOut").click();

    expect(alertSpy).toHaveBeenCalledWith("You must be logged in to proceed to checkout");
  });

  test("posts cart menu item ids to /api/payfast/create-payment on Pay Now", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        action: "https://sandbox.payfast.co.za/eng/process",
        fields: { merchant_id: "10000100", amount: "130.00", signature: "abc" },
        m_payment_id: "cb_test"
      })
    });
    global.fetch = fetchMock;

    const submitSpy = jest.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("Shop1Burger").click();
    document.getElementById("Shop2Pizza").click();

    document.getElementById("checkOut").click();
    await flush();
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/payfast/create-payment");
    const payload = JSON.parse(init.body);
    expect(payload.userId).toBe("customer-1");
    expect(payload.cart).toEqual([{ menuItemId: "1" }, { menuItemId: "2" }]);

    expect(submitSpy).toHaveBeenCalled();

    // No client-side order writes anymore — orders are created server-side by ITN.
    expect(db.addDoc).not.toHaveBeenCalled();

    submitSpy.mockRestore();
    delete global.fetch;
  });

  test("alerts and re-enables the button when payment init fails", async () => {
    mockBrowseQueries(db);
    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb({ uid: "customer-1" }));

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "boom" })
    });

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    document.getElementById("Shop1Burger").click();
    document.getElementById("checkOut").click();
    await flush();
    await flush();

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("boom"));
    expect(document.getElementById("checkOut").disabled).toBe(false);

    delete global.fetch;
  });

  test("hides suspended vendor items", async () => {
    mockBrowseQueries(db, sampleItems, [
      { id: "vendor-1", role: "vendor", status: "approved", shopName: "Shop1" },
      { id: "vendor-2", role: "vendor", status: "suspended", shopName: "Shop2" },
      { id: "vendor-3", role: "vendor", status: "approved", shopName: "Shop3" }
    ]);

    db.onAuthStateChanged.mockImplementation((_auth, cb) => cb(null));

    const mod = await import("../scripts/browse.js");
    await mod.loadBrowseItems();

    const html = document.getElementById("menu").innerHTML;
    expect(html).toContain("Burger");
    expect(html).toContain("Wrap");
    expect(html).not.toContain("Pizza");
  });
});