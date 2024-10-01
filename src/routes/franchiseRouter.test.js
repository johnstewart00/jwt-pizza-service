const request = require("supertest");
const app = require("../service");
const { DB } = require("../database/database.js");
const { randomName, createAdminUser } = require("./testHelperFunctions");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
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

test("GET /api/franchise should list all franchises", async () => {
  const res = await request(app).get("/api/franchise");

  expect(res.status).toBe(200);

  // Use expect.arrayContaining and expect.objectContaining for the franchise and store objects
  const franchises = res.body;
  expect(franchises).toBeTruthy();
  expect(franchises.length).toBeGreaterThan(0);
});

// Test the GET /api/franchise/:userId (list user's franchises)
test("GET /api/franchise/:userId should list user franchises ", async () => {
  const res = await request(app)
    .get(`/api/franchise/${testUserId}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`);

  expect(res.body).toEqual([]);
});

test("create franchise", async () => {
  const adminUser = await createAdminUser();
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  const token = loginRes.body.token;
  const rand = randomName();

  const createFranchiseRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: `${rand} Franchise`,
      admins: [{ email: "f@jwt.com" }],
    });

  expect(createFranchiseRes.status).toBe(200);

  // Use toMatchObject to check for the partial object match
  expect(createFranchiseRes.body).toMatchObject({
    name: `${rand} Franchise`,
    admins: [{ email: "f@jwt.com" }],
    id: expect.any(Number), // If the id is dynamically generated, use expect.any(Number)
  });
});

test("delete franchise", async () => {
  // Step 1: Create an admin user for authentication
  const adminUser = await createAdminUser();

  // Step 2: Log in the admin user to get a token
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  const token = loginRes.body.token;

  // Step 3: Create a franchise first, so we have something to delete
  const rand = randomName();
  const createFranchiseRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: `${rand} Franchise`,
      admins: [{ email: "f@jwt.com" }],
    });

  // Step 4: Ensure the franchise was created successfully
  expect(createFranchiseRes.status).toBe(200);
  expect(createFranchiseRes.body).toMatchObject({
    name: `${rand} Franchise`,
    admins: [{ email: "f@jwt.com" }],
    id: expect.any(Number),
  });

  // Step 5: Now delete the created franchise
  const franchiseId = createFranchiseRes.body.id; // Get the id of the created franchise
  const deleteFranchiseRes = await request(app)
    .delete(`/api/franchise/${franchiseId}`)
    .set("Authorization", `Bearer ${token}`);

  // Step 6: Check that the franchise was deleted successfully
  expect(deleteFranchiseRes.status).toBe(200);
  expect(deleteFranchiseRes.body).toEqual({ message: "franchise deleted" });
});

test("create store for franchise", async () => {
  // Step 1: Create an admin user for authentication
  const adminUser = await createAdminUser();

  // Step 2: Log in the admin user to get a token
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  const token = loginRes.body.token;

  // Step 3: Create a franchise first, so we have something to add a store to
  const rand = randomName();
  const createFranchiseRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: `${rand} Franchise`,
      admins: [{ email: "f@jwt.com" }],
    });

  // Step 4: Ensure the franchise was created successfully
  expect(createFranchiseRes.status).toBe(200);
  expect(createFranchiseRes.body).toMatchObject({
    name: `${rand} Franchise`,
    admins: [{ email: "f@jwt.com" }],
    id: expect.any(Number),
  });

  // Step 5: Now create a store for the created franchise
  const franchiseId = createFranchiseRes.body.id; // Get the id of the created franchise
  const storeName = `${rand} Store`;
  const createStoreRes = await request(app)
    .post(`/api/franchise/${franchiseId}/store`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: storeName,
    });

  // Step 6: Check that the store was created successfully
  expect(createStoreRes.status).toBe(200);
  expect(createStoreRes.body).toMatchObject({
    name: storeName,
    franchiseId: franchiseId, // Check if the store is associated with the correct franchise
    id: expect.any(Number), // Store ID should be a number
  });
});

test("delete store for franchise", async () => {
  // Step 1: Create an admin user for authentication
  const adminUser = await createAdminUser();

  // Step 2: Log in the admin user to get a token
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  const token = loginRes.body.token;

  // Step 3: Create a franchise first, so we have something to add a store to
  const rand = randomName();
  const createFranchiseRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: `${rand} Franchise`,
      admins: [{ email: "f@jwt.com" }],
    });

  // Step 4: Ensure the franchise was created successfully
  expect(createFranchiseRes.status).toBe(200);
  expect(createFranchiseRes.body).toMatchObject({
    name: `${rand} Franchise`,
    admins: [{ email: "f@jwt.com" }],
    id: expect.any(Number),
  });

  // Step 5: Now create a store for the created franchise
  const franchiseId = createFranchiseRes.body.id; // Get the id of the created franchise
  const storeName = `${rand} Store`;
  const createStoreRes = await request(app)
    .post(`/api/franchise/${franchiseId}/store`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: storeName,
    });

  // Step 6: Check that the store was created successfully
  expect(createStoreRes.status).toBe(200);
  expect(createStoreRes.body).toMatchObject({
    name: storeName,
    franchiseId: franchiseId, // Check if the store is associated with the correct franchise
    id: expect.any(Number), // Store ID should be a number
  });

  // Step 7: Now delete the store
  const storeId = createStoreRes.body.id; // Get the store ID that was created
  const deleteStoreRes = await request(app)
    .delete(`/api/franchise/${franchiseId}/store/${storeId}`)
    .set("Authorization", `Bearer ${token}`);

  // Step 8: Check that the store was deleted successfully
  expect(deleteStoreRes.status).toBe(200);
  expect(deleteStoreRes.body).toEqual({ message: "store deleted" });
});
