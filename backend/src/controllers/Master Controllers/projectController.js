const Project = require("../../models/Master/Project");

const createProject = (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });

  Project.create(name, (err, id) => {
    if (err) return res.status(400).json({ message: err.message });
    res.status(201).json({ id, name });
  });
};

const getProjects = (req, res) => {
  Project.getAll((err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

const updateProject = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name is required" });

  Project.update(id, name, (err, changes) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "Project not found" });
    res.json({ id, name });
  });
};

const deleteProject = (req, res) => {
  const { id } = req.params;

  Project.delete(id, (err, changes) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!changes) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted" });
  });
};

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
};
