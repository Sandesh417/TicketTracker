const express = require("express");
const router = express.Router();

const {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
} = require("../controllers/User Management/userController");

const { login } = require("../controllers/loginController");
const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

const ADMIN = "Admin";
const DEVELOPER = "Developer";
const USER = "User";

router.post("/login", login);

router.get("/", getUsers);

router.post(
  "/",
  authenticateToken,
  authorizeRoles(ADMIN, DEVELOPER, USER),
  createUser
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles(ADMIN, DEVELOPER, USER),
  updateUser
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles(ADMIN, DEVELOPER, USER),
  deleteUser
);

module.exports = router;
