// 1. Mock lucide BEFORE anything
global.lucide = {
  createIcons: jest.fn()
};

// 2. Setup DOM BEFORE import
document.body.innerHTML = `
  <input type="checkbox" id="Vegan" />
  <input type="checkbox" id="Vegetarian" />
  <input type="checkbox" id="Halal" />
  <input type="checkbox" id="Gluten-Free" />
  <ul id="menu"></ul>
  <ul id="cartList"></ul>
  <select id="Vendors"><option value="AllVendors">All</option></select>
  <select id="Categories"><option value="AllCategories">All</option></select>
  <button id="cart"></button>
  <div id="item-edit-modal" class="hidden"></div>
  <span id="modal-title"></span>
  <span id="numItems"></span>
`;

// 3. Mock database
jest.mock('../scripts/database.js', () => ({
  db: {},
  getDocs: jest.fn(),
  collection: jest.fn(),
}));

// 4. Import AFTER setup
const { applyFilter, addToCart } = require('../scripts/browse.js');

// ── Sample data ─────────────────────────────────────
const veganHalalItem = {
  available: true,
  dietary: ['Vegan', 'Halal'],
  allergens: [],
  category: 'Mains',
  vendorName: 'GreenEats',
};

const glutenItem = {
  available: true,
  dietary: ['Vegetarian'],
  allergens: ['Gluten'],
  category: 'Snacks',
  vendorName: 'BreadShop',
};

const unavailableItem = {
  available: false,
  dietary: ['Vegan'],
  allergens: [],
  category: 'Mains',
  vendorName: 'GreenEats',
};

// ── applyFilter tests ───────────────────────────────
describe('applyFilter', () => {
  const noRestrictions = [false, false, false, false];

  test('returns true when valid item and no restrictions', () => {
    expect(applyFilter(veganHalalItem, noRestrictions, 'AllCategories', 'AllVendors')).toBe(true);
  });

  test('filters out unavailable items', () => {
    expect(applyFilter(unavailableItem, noRestrictions, 'AllCategories', 'AllVendors')).toBe(false);
  });

  test('vegan restriction works', () => {
    expect(applyFilter(glutenItem, [true, false, false, false], 'AllCategories', 'AllVendors')).toBe(false);
  });

  test('vegetarian restriction works', () => {
    expect(applyFilter(veganHalalItem, [false, true, false, false], 'AllCategories', 'AllVendors')).toBe(false);
  });

  test('gluten-free restriction works', () => {
    expect(applyFilter(glutenItem, [false, false, true, false], 'AllCategories', 'AllVendors')).toBe(false);
  });

  test('halal restriction works', () => {
    expect(applyFilter(glutenItem, [false, false, false, true], 'AllCategories', 'AllVendors')).toBe(false);
  });

  test('category filter works', () => {
    expect(applyFilter(veganHalalItem, noRestrictions, 'Snacks', 'AllVendors')).toBe(false);
  });

  test('vendor filter works', () => {
    expect(applyFilter(veganHalalItem, noRestrictions, 'AllCategories', 'OtherVendor')).toBe(false);
  });

  test('passes when all conditions are met', () => {
    expect(applyFilter(veganHalalItem, [true, false, false, true], 'Mains', 'GreenEats')).toBe(true);
  });
});

// ── addToCart tests ────────────────────────────────
describe('addToCart', () => {
  test('adds item to cart', () => {
    const cart = addToCart([], veganHalalItem);
    expect(cart.length).toBe(1);
  });

  test('adds multiple items', () => {
    let cart = [];
    cart = addToCart(cart, veganHalalItem);
    cart = addToCart(cart, glutenItem);
    expect(cart.length).toBe(2);
  });

  test('allows duplicates', () => {
    let cart = [];
    cart = addToCart(cart, veganHalalItem);
    cart = addToCart(cart, veganHalalItem);
    expect(cart.length).toBe(2);
  });
});