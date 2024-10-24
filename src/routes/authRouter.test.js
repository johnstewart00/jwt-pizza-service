const request = require("supertest");
const app = require("../service");
const { createAdminUser } = require("./testHelperFunctions");
const { DB } = require("../database/database.js");

const testUser = { name: "pizza diner", email: "reg@test.com", password: "a" };
let testUserAuthToken;
let testUserId;

const userType = {
  name: expect.any(String),
  email: expect.any(String),
  roles: expect.any(Array),
};
let connection;

beforeAll(async () => {
  connection = await DB._getConnection();
  await connection.beginTransaction();
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
  testUserId = registerRes.body.user.id;
});

// If needed, clean up after all tests
afterAll(async () => {
  await connection.rollback();
  await connection.end();
  if (DB && DB.connection) {
    await DB.connection.end();
  }
});

test("login", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/
  );

  const { password } = { ...testUser, roles: [{ role: "diner" }] };
  expect(loginRes.body.user).toMatchObject(userType);
  expect(password).toBe("a");
});

// Test for updating user information
test("update user", async () => {
  const adminUser = await createAdminUser(); // Expected updated user object
  const loginRes = await request(app).put("/api/auth").send(adminUser);
  const token = loginRes.body.token;
  const userId = loginRes.body.user.id;
  const updatedData = {
    name: "updatedName",
    email: "updatedEmail",
    password: "updatedPassword",
  };

  // // Mock the DB update function
  const mockUpdateUser = jest.fn().mockResolvedValue({
    name: "updatedName",
    email: "updatedEmail",
    password: "updatedPassword",
  });
  DB.updateUser = mockUpdateUser;
  // Perform the request
  const updateRes = await request(app)
    .put(`/api/auth/${userId}`)
    .set("Authorization", `Bearer ${token}`)
    .send(updatedData);

  // // Check that the response status is 200
  expect(updateRes.status).toBe(200);
  expect(mockUpdateUser).toHaveBeenCalledWith(
    userId,
    updatedData.email,
    updatedData.password
  );
  expect(updateRes.body).toMatchObject(updatedData);
});

test("update user not admin", async () => {
  const updatedData = {
    name: "updatedName",
    email: "updatedEmail",
    password: "updatedPassword",
  };
  const updateRes = await request(app)
    .put(`/api/auth/${testUserId + 1}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(updatedData);
  expect(updateRes.status).toBe(403);
  expect(updateRes.body).toMatchObject({ message: "unauthorized" });
});

test("logout", async () => {
  const mockDBLogout = jest.fn();
  DB.logoutUser = mockDBLogout;
  const logoutRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(logoutRes.status).toBe(200);

  expect(logoutRes.body).toMatchObject({ message: "logout successful" });
  expect(mockDBLogout).toHaveBeenCalledWith(testUserAuthToken);
});
