const express = require("express");
const router = express.Router();
const {
  createPlant,
  getPlants,
  updatePlant,
  deletePlant,
} = require("../../controllers/Master Controllers/plantController");

router.post("/", createPlant);
router.get("/", getPlants);
router.put("/:id", updatePlant);
router.delete("/:id", deletePlant);

module.exports = router;
