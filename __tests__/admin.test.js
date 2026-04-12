jest.mock("../scripts/database.js", () => ({
  auth: {},
  db: {},
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

const { calculateVendorStats } = require("../scripts/admin.js");

test("calculates vendor stats correctly", () => {
  const users = [
    { role: "vendor", status: "approved" },
    { role: "vendor", status: "pending" },
    { role: "vendor", status: "approved" }
  ];

  const result = calculateVendorStats(users);

  expect(result.total).toBe(3);
  expect(result.active).toBe(2);
  expect(result.pending).toBe(1);
});