const express = require("express");
const router = express.Router();

const controller = require("../controllers/progressController");
const auth = require("../middleware/authMiddleware");

router.get("/stats", auth, controller.getProgressStats);
router.post("/complete-lesson", auth, controller.completeLesson);
router.get("/progress", auth, controller.getProgressStats);
router.post("/progress", auth, controller.completeLesson);

module.exports = router;