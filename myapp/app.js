const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// register
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  console.log(password);
  const userVerifyQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const userDetails = await database.get(userVerifyQuery);

  if (userDetails === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 16);
      const createUserQuery = `INSERT INTO  user (username,name,password,gender,location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );`;
      await database.run(createUserQuery);
      response.status(200);
      response.send("user Created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exits");
  }
});

//login
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const userVerifyQuery = `SELECT * FROM user WHERE username ='${username}';`;
  const userDetails = await database.get(userVerifyQuery);

  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userDetails.password
    );
    if (isPasswordMatched === true) {
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});

// change password
app.post("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userVerifyQuery = `SELECT * FROM user WHERE username ='${username}';`;
  const userDetails = await database.get(userVerifyQuery);
  if (userDetails === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (isPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 16);
        const updatePasswordQuery = `UPDATE user
            SET password = '${hashedPassword}' WHERE username='${username}'; `;
        await database.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
