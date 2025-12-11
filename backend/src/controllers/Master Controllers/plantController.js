const Plant = require("../../models/Master/Plant");

const createPlant = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });

  Plant.create(name, (err, id) => {
    if (err) return res.status(400).json({ message: err.message });
    res.status(201).json({ id, name });
  });
};

const getPlants = (req, res) => {
  Plant.getAll((err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

const updatePlant = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });

  Plant.update(id, name, (err, changes) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "Plant not found" });
    res.json({ id, name });
  });
};

const deletePlant = (req, res) => {
  const { id } = req.params;

  Plant.delete(id, (err, changes) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "Plant not found" });
    res.json({ message: "Plant deleted" });
  });
};

module.exports = {
  createPlant,
  getPlants,
  updatePlant,
  deletePlant,
};
