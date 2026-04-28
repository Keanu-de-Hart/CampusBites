/**
 * @jest-environment jsdom
 */

jest.mock("../scripts/database.js", () => ({
  db: {},
  getDocs: jest.fn(),
  collection: jest.fn()
}));

describe("index.js", () => {
  let getDocs;
  let collection;

  async function loadModule() {
    jest.resetModules();

    const dbModule = await import("../scripts/database.js");
    getDocs = dbModule.getDocs;
    collection = dbModule.collection;

    collection.mockReturnValue("usersRef");

    return import("../scripts/index.js");
  }

  beforeEach(() => {
    document.body.innerHTML = `
      <button id="OrderNowButton"></button>
      <button id="LearnButton"></button>
      <div id="BrowseVendors"></div>
      <div id="FeaturesSection"></div>
      <div id="featured-vendors"></div>
    `;

    global.lucide = {
      createIcons: jest.fn()
    };

    jest.spyOn(global, "setInterval").mockImplementation(() => 999);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders approved vendors only", async () => {
    await loadModule();

    getDocs.mockResolvedValue({
      docs: [
        {
          id: "1",
          data: () => ({
            role: "vendor",
            status: "approved",
            shopName: "Jimmy's"
          })
        },
        {
          id: "2",
          data: () => ({
            role: "vendor",
            status: "pending",
            shopName: "Hidden Vendor"
          })
        }
      ]
    });

    await import("../scripts/index.js");

    await Promise.resolve();

    const html = document.getElementById("featured-vendors").innerHTML;

    expect(html).toContain("Jimmy's");
    expect(html).not.toContain("Hidden Vendor");
  });

  test("shows no vendors message", async () => {
    await loadModule();

    getDocs.mockResolvedValue({ docs: [] });

    await import("../scripts/index.js");
    await Promise.resolve();

    expect(
      document.getElementById("featured-vendors").innerHTML
    ).toContain("No approved vendors available yet.");
  });

  test("shows error message if firestore fails", async () => {
    await loadModule();

    getDocs.mockRejectedValue(new Error("fail"));

    await import("../scripts/index.js");
    await Promise.resolve();

    expect(
      document.getElementById("featured-vendors").innerHTML
    ).toContain("Failed to load featured vendors.");
  });

  test("lucide icons called", async () => {
    await loadModule();

    getDocs.mockResolvedValue({ docs: [] });

    await import("../scripts/index.js");
    await Promise.resolve();

    expect(global.lucide.createIcons).toHaveBeenCalled();
  });

  test("redirect function exists", async () => {
    await loadModule();

    getDocs.mockResolvedValue({ docs: [] });

    await import("../scripts/index.js");

    expect(typeof window.goToVendor).toBe("function");
  });
});