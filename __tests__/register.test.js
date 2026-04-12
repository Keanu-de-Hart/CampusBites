jest.mock("../scripts/database.js", () => ({
  auth: {},
  db: {},
  createUserWithEmailAndPassword: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn()
}));

jest.mock(
  "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js",
  () => ({
    GoogleAuthProvider: jest.fn(),
    FacebookAuthProvider: jest.fn(),
    TwitterAuthProvider: jest.fn(),
    OAuthProvider: jest.fn(),
    signInWithPopup: jest.fn()
  }),
  { virtual: true }
);

document.body.innerHTML = `
  <form id="registerForm"></form>
  <input id="registerName" />
  <input id="registerEmail" />
  <input id="registerPassword" />
  <select id="registerRole"></select>
  <input id="shopName" />
  <input id="shopLocation" />
  <input id="shopLogo" />
  <section id="shop-logo-container"></section>

  <button id="googleRegister"></button>
  <button id="facebookRegister"></button>
  <button id="twitterRegister"></button>
  <button id="appleRegister"></button>
  <button id="microsoftRegister"></button>
`;

const { buildUserObject } = require("../scripts/register.js");

test("builds vendor object correctly", () => {
  const result = buildUserObject({
    fullName: "John",
    email: "john@test.com",
    role: "vendor",
    shopName: "Food Spot",
    location: "Campus",
    image: "logo.png"
  });

  expect(result.status).toBe("pending");
  expect(result.shopName).toBe("Food Spot");
});