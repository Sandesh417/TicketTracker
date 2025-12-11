const Shop = require("../../models/Master/Shop");

const createShop = (req, res) => {
  const { name, plantId } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });
  if (!plantId) return res.status(400).json({ message: "plantId is required" });

  Shop.create(name, plantId, (err, id) => {
    if (err) return res.status(400).json({ message: err.message });
    res.status(201).json({ id, name, plantId });
  });
};

const getShops = (req, res) => {
  Shop.getAll((err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

const updateShop = (req, res) => {
  const { id } = req.params;
  const { name, plantId } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });
  if (!plantId) return res.status(400).json({ message: "plantId is required" });

  Shop.update(id, name, plantId, (err, changes) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "Shop not found" });
    res.json({ id, name, plantId });
  });
};

const deleteShop = (req, res) => {
  const { id } = req.params;

  Shop.delete(id, (err, changes) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "Shop not found" });
    res.json({ message: "Shop deleted" });
  });
};

module.exports = {
  createShop,
  getShops,
  updateShop,
  deleteShop,
};
