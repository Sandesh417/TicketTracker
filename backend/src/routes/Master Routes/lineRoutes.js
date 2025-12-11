const express = require("express");
const router = express.Router();
const {
  createLine,
  getLines,
  updateLine,
  deleteLine,
} = require("../../controllers/Master Controllers/lineController");

router.post("/", createLine);
router.get("/", getLines);
router.put("/:id", updateLine);
router.delete("/:id", deleteLine);

module.exports = router;
