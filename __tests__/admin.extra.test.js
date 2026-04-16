jest.mock('../scripts/database.js', () => ({
  db: {},
  getDocs: jest.fn(),
  collection: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
}));

const { calculateVendorStats } = require('../scripts/admin.js');
const db = require('../scripts/database.js');

describe('admin.js extra coverage', () => {

  test('calculateVendorStats handles mixed vendor states', () => {
    const users = [
  { role: 'vendor', status: 'approved' },
  { role: 'vendor', status: 'approved' },
  { role: 'vendor', status: 'pending' },
  { role: 'customer', status: 'approved' },
];

    const result = calculateVendorStats(users);

expect(result.total).toBe(3);
expect(result.active).toBe(2);
expect(result.pending).toBe(1);
  });

  test('calculateVendorStats handles undefined status', () => {
    const users = [{ role: 'vendor' }];
    const result = calculateVendorStats(users);

    expect(result.pending).toBe(1);
  });

});