const Machine = require("../../models/Master/Machine");

const createMachine = (req, res) => {
  const { name, lineId } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });
  if (!lineId) return res.status(400).json({ message: "lineId is required" });

  Machine.create(name, lineId, (err, id) => {
    if (err) return res.status(400).json({ message: err.message });
    res.status(201).json({ id, name, lineId });
  });
};

const getMachines = (req, res) => {
  Machine.getAll((err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

const updateMachine = (req, res) => {
  const { id } = req.params;
  const { name, lineId } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });
  if (!lineId) return res.status(400).json({ message: "lineId is required" });

  Machine.update(id, name, lineId, (err, changes) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "Machine not found" });
    res.json({ id, name, lineId });
  });
};

const deleteMachine = (req, res) => {
  const { id } = req.params;

  Machine.delete(id, (err, changes) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "Machine not found" });
    res.json({ message: "Machine deleted" });
  });
};

module.exports = {
  createMachine,
  getMachines,
  updateMachine,
  deleteMachine,
};
