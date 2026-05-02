const express = require("express");
const router = express.Router();

const profile = require("../controllers/profileController");
const authenticateToken = require("../middleware/authMiddleware");

router.get("/profile", authenticateToken, profile.getProfile);
router.put("/update-profile", authenticateToken, profile.updateProfile);

module.exports = router;