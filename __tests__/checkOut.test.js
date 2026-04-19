/**
 * @jest-environment jsdom
 */

global.lucide = { createIcons: jest.fn() };

jest.mock('../scripts/database.js', () => ({
  db: {},
  getDocs: jest.fn(),
  collection: jest.fn(),
}));