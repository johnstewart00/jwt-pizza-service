const { Role, DB } = require("../database/database.js");

async function createAdminUser() {
  let user = { password: "toomanysecrets", roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + "@admin.com";

  await DB.addUser(user);

  user.password = "toomanysecrets"; // Password is reset to its original value
  return user;
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

module.exports = { createAdminUser, randomName };
