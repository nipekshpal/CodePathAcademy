const express = require("express");

const router = express.Router();

const submissionController = require("../controllers/submissionController");

const authenticateToken = require("../middleware/authMiddleware");

router.post("/", authenticateToken, submissionController.submitCode);
router.post("/submit", authenticateToken, submissionController.submitCode);

module.exports = router;