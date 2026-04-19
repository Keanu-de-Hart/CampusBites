/**
 * @jest-environment jsdom
 */

global.lucide = { createIcons: jest.fn() };

jest.mock('../scripts/database.js', () => ({
  db: {},
  getDocs: jest.fn(),
  collection: jest.fn(),
  auth: {},
  onAuthStateChanged: jest.fn((auth, cb) => cb(null))
}));

const sampleItems = [
  {
    id: '1',
    name: 'Burger',
    vendorName: 'Shop1',
    price: 50,
    description: 'Tasty',
    category: 'Mains',
    available: true,
    dietary: ['Vegan'],
    allergens: []
  },
  {
    id: '2',
    name: 'Pizza',
    vendorName: 'Shop2',
    price: 80,
    description: 'Cheesy',
    category: 'Mains',
    available: true,
    dietary: [],
    allergens: ['Gluten']
  }
];

const makeSnapshot = (items) => ({
  docs: items.map(i => ({
    id: i.id,
    data: () => i
  }))
});

let getDocs;
beforeEach(() => {
  jest.resetModules();

  document.body.innerHTML = `
    <a id="AdmindashboardLink"></a>
    <a id="CustomerdashboardLink"></a>
    <a id="VendordashboardLink"></a>
    <a id="loginLink"></a>

    <select id="Vendors">
      <option value="AllVendors">All Vendors</option>
    </select>

    <select id="Categories">
      <option value="AllCategories">All Categories</option>
    </select>

    <input id="Vegan" type="checkbox"/>
    <input id="Vegetarian" type="checkbox"/>
    <input id="Gluten-Free" type="checkbox"/>
    <input id="Halal" type="checkbox"/>

    <button id="cart"></button>
    <p id="numItems"></p>

    <section id="menu"></section>

    <div id="item-edit-modal" class="hidden"></div>
    <h3 id="modal-title"></h3>
    <section id="cartList"></section>
    <section class="flex gap-3 mt-6">
                <button type="button"
                    onclick="document.getElementById('item-edit-modal').classList.add('hidden')"
                    class="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">
                    Close
                </button>
                <button id = "checkOut" class="bg-indigo-600 text-white mx-5 px-4 py-2 rounded-lg hover:bg-indigo-700 transition"> Check Out</button>
            </section>
  `;

  ({ getDocs } = require('../scripts/database.js'));
});

test('renders items', async () => {
  getDocs
    .mockResolvedValueOnce(makeSnapshot(sampleItems)) // menu_items
    .mockResolvedValueOnce(makeSnapshot([]));         // users

  const mod = await import('../scripts/browse.js');
  await mod.loadBrowseItems();

  expect(document.getElementById("menu").innerHTML).toContain("Burger");
});

test('filters available items', async () => {
  getDocs
    .mockResolvedValueOnce(makeSnapshot(sampleItems))
    .mockResolvedValueOnce(makeSnapshot([]));

  const mod = await import('../scripts/browse.js');
  await mod.loadBrowseItems();

  expect(document.getElementById("menu").innerHTML).toContain("Pizza");
});