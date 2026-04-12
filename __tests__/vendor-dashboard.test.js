jest.mock("../scripts/database.js", () => ({
  auth: {},
  db: {},
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

const { calculateRevenue } = require("../scripts/vendor-dashboard.js");

test("calculates revenue", () => {
  const orders = [{ total: 100 }, { total: 50 }];

  expect(calculateRevenue(orders)).toBe(150);
});