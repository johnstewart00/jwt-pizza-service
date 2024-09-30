const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database.js");
const { randomName, createAdminUser } = require("./testHelperFunctions");

const testUser = {
  name: `${randomName()}`,
  email: "reg@test.com",
  password: "a",
};
let testUserAuthToken;
let testUserId;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUserId = registerRes.body.user.id;
});

afterEach(async () => {
  // Ensure all connections are closed after each test
  if (DB && DB.connection) {
    await DB.connection.end(); // or DB.connection.close() based on your DB library
  }
});

// If needed, clean up after all tests
afterAll(async () => {
  if (DB && DB.connection) {
    await DB.connection.end();
  }
});

test("GET /api/order/menu should return the pizza menu", async () => {
  // Mock the DB method for getting the menu
  const mockMenu = [
    {
      id: 1,
      title: "Veggie",
      image: "pizza1.png",
      price: 0.0038,
      description: "A garden of delight",
    },
  ];
  DB.getMenu = jest.fn().mockResolvedValue(mockMenu);

  const res = await request(app).get("/api/order/menu");

  expect(res.status).toBe(200);
  expect(res.body).toEqual(mockMenu);
  expect(DB.getMenu).toHaveBeenCalledTimes(1);
});

test("PUT /api/order/menu should add a menu item when user is admin", async () => {
  const adminUser = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  const token = loginRes.body.token;

  const newItem = {
    title: "Student",
    description: "No topping, no sauce, just carbs",
    image: "pizza9.png",
    price: 0.0001,
  };

  const mockMenu = [
    {
      id: 1,
      title: "Veggie",
      image: "pizza1.png",
      price: 0.0038,
      description: "A garden of delight",
    },
    newItem,
  ];

  // Mock the DB methods
  DB.addMenuItem = jest.fn().mockResolvedValue(newItem);
  DB.getMenu = jest.fn().mockResolvedValue(mockMenu);

  const res = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${token}`)
    .send(newItem);

  expect(res.status).toBe(200);
  expect(res.body).toEqual(mockMenu); // After adding, it should return the updated menu
  expect(DB.addMenuItem).toHaveBeenCalledWith(newItem);
  expect(DB.getMenu).toHaveBeenCalledTimes(1);
});

test("GET /api/order should return the orders for the authenticated user", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  const token = loginRes.body.token;

  const mockOrders = {
    dinerId: testUserId,
    orders: [
      {
        id: 1,
        franchiseId: 1,
        storeId: 1,
        date: "2024-06-05T05:14:40.000Z",
        items: [{ id: 1, menuId: 1, description: "Veggie", price: 0.05 }],
      },
    ],
    page: 1,
  };

  // Mock the DB method for getting the user's orders
  DB.getOrders = jest.fn().mockResolvedValue(mockOrders);

  const res = await request(app)
    .get("/api/order")
    .set("Authorization", `Bearer ${token}`);

  expect(res.status).toBe(200);
  expect(res.body).toEqual(mockOrders);
  expect(DB.getOrders).toHaveBeenCalledTimes(1); // undefined because no page query was provided
});

test("POST /api/order should create an order for the authenticated user", async () => {
  const orderReq = {
    franchiseId: 1,
    storeId: 1,
    date: "2024-06-05T05:14:40.000Z",
    items: [{ id: 1, menuId: 1, description: "Veggie", price: 0.05 }],
  };

  const mockOrder = {
    ...orderReq,
    id: 1, // Assume the DB returns the order with an id after creating it
  };

  // Mock the DB and external API calls
  DB.addDinerOrder = jest.fn().mockResolvedValue(mockOrder);
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({
      jwt: "1111111111",
      reportUrl: "https://example.com/report",
    }),
  });

  // Send the request with mocked authentication
  const res = await request(app)
    .post("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(orderReq);

  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    order: mockOrder,
    jwt: "1111111111",
    reportUrl: "https://example.com/report",
  });
  expect(DB.addDinerOrder).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
