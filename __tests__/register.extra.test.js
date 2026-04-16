/**
 * @jest-environment jsdom
 */

const { initRegisterUI } = require("../scripts/register.js");

global.lucide = {
  createIcons: jest.fn()
};

describe("role select UI logic", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="registerRole">
        <option value="customer">Customer</option>
        <option value="vendor">Vendor</option>
      </select>

      <div id="shop-name-container" class="hidden"></div>
      <div id="shop-location-container" class="hidden"></div>
      <div id="shop-logo-container" class="hidden"></div>

      <input id="shop-name" />
      <input id="shop-location" />
      <input id="logoInput" />
    `;

    initRegisterUI();
  });

  test("shows vendor fields when vendor selected", () => {
    const roleSelect = document.getElementById("registerRole");

    roleSelect.value = "vendor";
    roleSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(
      document
        .getElementById("shop-name-container")
        .classList.contains("hidden")
    ).toBe(false);
  });

  test("hides vendor fields for customer", () => {
    const roleSelect = document.getElementById("registerRole");

    roleSelect.value = "customer";
    roleSelect.dispatchEvent(new Event("change", { bubbles: true }));

    expect(
      document
        .getElementById("shop-name-container")
        .classList.contains("hidden")
    ).toBe(true);
  });
});