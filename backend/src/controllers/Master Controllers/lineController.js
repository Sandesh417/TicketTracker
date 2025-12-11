const Line = require("../../models/Master/Line");

const createLine = (req, res) => {
  const { name, shopId } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });
  if (!shopId) return res.status(400).json({ message: "shopId is required" });

  Line.create(name, shopId, (err, id) => {
    if (err) return res.status(400).json({ message: err.message });
    res.status(201).json({ id, name, shopId });
  });
};

const getLines = (req, res) => {
  Line.getAll((err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

const updateLine = (req, res) => {
  const { id } = req.params;
  const { name, shopId } = req.body;

  if (!name) return res.status(400).json({ message: "Name is required" });
  if (!shopId) return res.status(400).json({ message: "shopId is required" });

  Line.update(id, name, shopId, (err, changes) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "Line not found" });
    res.json({ id, name, shopId });
  });
};

const deleteLine = (req, res) => {
  const { id } = req.params;

  Line.delete(id, (err, changes) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "Line not found" });
    res.json({ message: "Line deleted" });
  });
};

module.exports = {
  createLine,
  getLines,
  updateLine,
  deleteLine,
};
