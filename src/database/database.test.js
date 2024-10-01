const { DB } = require("../database/database.js");
const jwt = require("jsonwebtoken");
const config = require("../config.js");
const { createAdminUser } = require("../routes/testHelperFunctions.js");

let connection;

const user = {
  name: "test",
  email: `test${Date.now()}@test.com`, // Unique email each time
  password: "test",
  roles: [{ role: "diner" }],
};

beforeAll(async () => {
  connection = await DB.getConnection(); // No need for done()
});

beforeEach(async () => {
  await connection.beginTransaction();
  const newUser = { ...user };
  const addRes = await DB.addUser(newUser);
  user.id = addRes.id;
});

afterEach(async () => {
  await connection.rollback();
});

afterAll(async () => {
  await connection.end();
});

const menuItem = {
  title: "Sausage Pizza",
  description: "sausage and sausage only",
  image: "fake.png",
  price: 5.4,
};
const addMenuItem = async () => {
  const addedMenuItem = await DB.addMenuItem(menuItem);
  return addedMenuItem;
};

test("getMenu test", async () => {
  const menu = await DB.getMenu();
  expect(menu).toBeTruthy();
  expect(menu.length).toBeGreaterThan(0);
});

test("addMenuItem test", async () => {
  const addedMenuItem = await addMenuItem();
  expect(addedMenuItem.title).toBe(menuItem.title);
  expect(addedMenuItem.description).toBe(menuItem.description);
  expect(addedMenuItem.image).toBe(menuItem.image);
  expect(addedMenuItem.price).toBe(menuItem.price);
});

test("add user - diner", async () => {
  const newUser = {
    name: "test1",
    email: "test1@test",
    password: "test1",
    roles: [{ role: "diner" }],
  };
  const addedUser = await DB.addUser(newUser);
  expect(addedUser.name).toBe(newUser.name);
  expect(addedUser.email).toBe(newUser.email);
  await DB.deleteUser(addedUser.id);
});

test("get user", async () => {
  const resultUser = await DB.getUser(user.email, user.password);
  expect(resultUser.name).toBe(user.name);
});

test("update user", async () => {
  const userRes = await DB.getUser(user.email, user.password);
  const userId = userRes.id;
  const updatedUser = await DB.updateUser(
    userId,
    "newEmail@email",
    "newPassword"
  );
  expect(updatedUser.email).toBe("newEmail@email");
  expect(await DB.getUser("newEmail@email", "newPassword")).toBeTruthy();
});

test("isLoggedIn test", async () => {
  const token = jwt.sign({ id: user.id }, config.jwtSecret);
  await DB.loginUser(user.id, token);

  // Check that the user is logged in
  const loggedIn = await DB.isLoggedIn(token);
  expect(loggedIn).toBe(true);

  // Log out the user
  await DB.logoutUser(token);

  // Check that the user is no longer logged in
  const loggedOut = await DB.isLoggedIn(token);
  expect(loggedOut).toBeFalsy();
});

test("getOrders", async () => {
  const adminUser = await createAdminUser();
  const addFranchiseRes = await DB.createFranchise({
    admins: [{ email: adminUser.email }],
    name: adminUser.name,
  });
  const addStoreRes = await DB.createStore(addFranchiseRes.id, {
    name: "test store name",
  });
  await DB.addDinerOrder(user, {
    franchiseId: addFranchiseRes.id,
    storeId: addStoreRes.id,
    items: [{ menuId: 2, description: "Extra Cheese", price: 1.23 }],
  });
  const orders = await DB.getOrders(user);
  expect(orders).toBeTruthy();
  expect(orders.orders.length).toBeGreaterThan(0);

  await DB.deleteFranchise(addFranchiseRes.id);
});
