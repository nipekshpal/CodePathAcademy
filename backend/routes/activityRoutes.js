const express = require("express");
const router = express.Router();
const { saveActivity, userStats } = require("../controllers/activityController");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/save", authenticateToken, saveActivity);
router.get("/stats", authenticateToken, userStats);

module.exports = router;