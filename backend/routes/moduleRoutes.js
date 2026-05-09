const express = require("express");
const router = express.Router();
const controller = require("../controllers/moduleController");

/* ===== CREATE ===== */
router.post("/module", controller.addModule);
router.post("/lesson", controller.addLesson);

/* ===== READ ===== */
router.get("/:course_id", controller.getModulesByCourse);
router.get("/lessons/:module_id", controller.getLessonsByModule);
router.get("/lesson/:lesson_id", controller.getLessonById);

module.exports = router;