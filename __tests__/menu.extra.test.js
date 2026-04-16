document.body.innerHTML = `
  <form id="item-form">
    <input />
  </form>
  <div id="item-edit-modal" class="hidden"></div>
  <span id="modal-title"></span>
  <input id="edit-item-id" />
`;

const { formatMenuPrice } = require('../scripts/menu.js');

describe('formatMenuPrice edge cases', () => {
  test('handles string input', () => {
    expect(formatMenuPrice('100')).toBe('R100.00');
  });

  test('handles null safely', () => {
    expect(formatMenuPrice(0)).toBe('R0.00');
  });
});

const { buildItemData } = require('../scripts/menu.js');

describe('buildItemData edge cases', () => {

  test('handles missing optional fields', () => {
    const result = buildItemData({
      vendorId: '1',
      vendorName: 'X',
      name: 'Y',
      description: 'Z',
      price: 10,
      category: 'Mains',
      allergens: [],
      dietary: []
    });

    expect(result.available).toBe(true);
    expect(result.image).toBeUndefined();
  });

});

test('openAddItemModal manipulates DOM correctly', () => {
  document.body.innerHTML += `
    <div id="item-edit-modal" class="hidden"></div>
    <span id="modal-title"></span>
    <input id="edit-item-id" />
  `;

  const { openAddItemModal } = require('../scripts/menu.js');

  openAddItemModal();

  expect(document.getElementById('modal-title').textContent)
    .toBe('Add Menu Item');
});