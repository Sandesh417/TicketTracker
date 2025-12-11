const express = require("express");
const router = express.Router();
const {
  createShop,
  getShops,
  updateShop,
  deleteShop,
} = require("../../controllers/Master Controllers/shopController");

router.post("/", createShop);
router.get("/", getShops);
router.put("/:id", updateShop);
router.delete("/:id", deleteShop);

module.exports = router;
