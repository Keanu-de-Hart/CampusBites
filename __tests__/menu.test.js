// ── Mock Firebase layer ───────────────────────────────────────────────
jest.mock('../scripts/database.js', () => ({
  db: {},
  auth: {},
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  serverTimestamp: jest.fn()
}));

// ── Setup DOM (must include EVERYTHING menu.js touches) ───────────────
document.body.innerHTML = `
  <button id="logoutBtn"></button>

  <div id="loading-state" class="hidden"></div>
  <div id="empty-state" class="hidden"></div>
  <div id="menu-table-wrapper" class="hidden"></div>
  <tbody id="menu-table-body"></tbody>

  <form id="item-form"></form>

  <div id="item-edit-modal" class="hidden"></div>
  <div id="delete-modal" class="hidden"></div>

  <button id="confirm-delete-btn"></button>

  <input id="edit-item-id" />
  <input id="item-name" />
  <textarea id="item-description"></textarea>
  <input id="item-price" />
  <select id="item-category">
    <option value="Mains">Mains</option>
  </select>

  <input type="checkbox" id="item-available" />

  <span id="modal-title"></span>
  <span id="form-error" class="hidden"></span>

  <span id="save-btn-text"></span>
  <button id="save-btn"></button>
  <div id="save-spinner" class="hidden"></div>
`;

// ── Import AFTER DOM setup ────────────────────────────────────────────
import {
  formatMenuPrice,
  buildItemData,
  openAddItemModal,
  closeModal,
  confirmDelete,
  closeDeleteModal,
  setSaveLoading
} from '../scripts/menu.js';

// ── formatMenuPrice ───────────────────────────────────────────────────
describe('formatMenuPrice', () => {
  test('formats integer', () => {
    expect(formatMenuPrice(25)).toBe('R25.00');
  });

  test('formats float', () => {
    expect(formatMenuPrice(9.5)).toBe('R9.50');
  });

  test('formats zero', () => {
    expect(formatMenuPrice(0)).toBe('R0.00');
  });

  test('formats numeric string', () => {
    expect(formatMenuPrice('12.3')).toBe('R12.30');
  });
});


// ── buildItemData ─────────────────────────────────────────────────────
describe('buildItemData', () => {
  const base = {
    vendorId: 'v1',
    vendorName: 'Test Vendor',
    name: 'Burger',
    description: 'Nice burger',
    price: 50,
    category: 'Mains',
    allergens: ['Gluten'],
    dietary: ['Halal'],
    imageUrl: null
  };

  test('defaults available to true', () => {
    const result = buildItemData(base);
    expect(result.available).toBe(true);
  });

  test('removes image when imageUrl missing', () => {
    const result = buildItemData(base);
    expect(result.image).toBeUndefined();
  });

  test('adds image when imageUrl exists', () => {
    const result = buildItemData({
      ...base,
      imageUrl: 'https://img.com/x.jpg'
    });

    expect(result.image).toBe('https://img.com/x.jpg');
  });

  test('keeps all core fields', () => {
    const result = buildItemData(base);

    expect(result.vendorId).toBe('v1');
    expect(result.name).toBe('Burger');
    expect(result.price).toBe(50);
    expect(result.allergens).toEqual(['Gluten']);
    expect(result.dietary).toEqual(['Halal']);
  });
});


// ── Modal tests ───────────────────────────────────────────────────────
describe('modal helpers', () => {
  beforeEach(() => {
    document.getElementById('item-edit-modal').classList.add('hidden');
    document.getElementById('delete-modal').classList.add('hidden');

    document.getElementById('edit-item-id').value = '';
    document.getElementById('modal-title').textContent = '';
  });

  test('openAddItemModal shows modal and resets state', () => {
    openAddItemModal();

    expect(
      document.getElementById('item-edit-modal').classList.contains('hidden')
    ).toBe(false);

    expect(document.getElementById('modal-title').textContent)
      .toBe('Add Menu Item');

    expect(document.getElementById('edit-item-id').value).toBe('');
  });

  test('closeModal hides modal', () => {
    document.getElementById('item-edit-modal').classList.remove('hidden');

    closeModal();

    expect(
      document.getElementById('item-edit-modal').classList.contains('hidden')
    ).toBe(true);
  });

  test('confirmDelete opens delete modal', () => {
    confirmDelete('abc123');

    expect(
      document.getElementById('delete-modal').classList.contains('hidden')
    ).toBe(false);
  });

  test('closeDeleteModal hides delete modal', () => {
    document.getElementById('delete-modal').classList.remove('hidden');

    closeDeleteModal();

    expect(
      document.getElementById('delete-modal').classList.contains('hidden')
    ).toBe(true);
  });
});


// ── UI helper test (important for coverage) ───────────────────────────
describe('setSaveLoading', () => {
  test('toggles loading state ON and OFF', () => {
    setSaveLoading(true);

    expect(document.getElementById('save-spinner').classList.contains('hidden'))
      .toBe(false);

    expect(document.getElementById('save-btn-text').textContent)
      .toBe('Saving…');

    setSaveLoading(false);

    expect(document.getElementById('save-spinner').classList.contains('hidden'))
      .toBe(true);

    expect(document.getElementById('save-btn-text').textContent)
      .toBe('Save Item');
  });
});