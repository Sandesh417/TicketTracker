const express = require("express");
const router = express.Router();
const {
  createMachine,
  getMachines,
  updateMachine,
  deleteMachine,
} = require("../../controllers/Master Controllers/machineController");

router.post("/", createMachine);
router.get("/", getMachines);
router.put("/:id", updateMachine);
router.delete("/:id", deleteMachine);

module.exports = router;
