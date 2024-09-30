const { Role, DB } = require("../database/database.js");
const request = require("supertest");
const app = require("../service");

function createAdminUser() {
  return new Promise(async (resolve, reject) => {
    try {
      let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
      user.name = randomName();
      user.email = user.name + "@admin.com";

      await DB.addUser(user);

      user.password = "toomanysecrets"; // Password is reset to its original value
      resolve(user);
    } catch (error) {
      reject(error); // Handle any errors that occur during user creation
    }
  });
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

module.exports = { createAdminUser, randomName };
