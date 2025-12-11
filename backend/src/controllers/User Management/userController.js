const User = require("../../models/User");

const createUser = (req, res) => {
  const { username, password, role } = req.body;
  if (!username) return res.status(400).json({ message: "Username is required" });
  if (!password) return res.status(400).json({ message: "Password is required" });
  if (!role || !["Admin", "Developer", "User"].includes(role))
    return res.status(400).json({ message: "Valid role is required" });

  User.create(username, password, role, (err, id) => {
    if (err) {
      if (err.message.includes("UNIQUE constraint")) {
        return res.status(400).json({ message: "Username already exists" });
      }
      return res.status(500).json({ message: err.message });
    }
    res.status(201).json({ id, username, role });
  });
};

const getUsers = (req, res) => {
  User.getAll((err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

const updateUser = (req, res) => {
  const { id } = req.params;
  const { username, role, password } = req.body;

  if (!username) return res.status(400).json({ message: "Username is required" });
  if (!role || !["Admin", "Developer", "User"].includes(role))
    return res.status(400).json({ message: "Valid role is required" });

  User.update(id, username, role, password, (err, changes) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "User not found" });
    res.json({ id, username, role });
  });
};

const deleteUser = (req, res) => {
  const { id } = req.params;

  User.delete(id, (err, changes) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  });
};

module.exports = {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
};
