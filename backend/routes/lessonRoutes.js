const express = require("express");
const router = express.Router();

const lessonController = require("../controllers/lessonController");

/* ===== CREATE ===== */
router.post("/", lessonController.addLesson);

/* ===== READ ===== */

router.get("/module/:module_id", lessonController.getLessonsByModule);
router.get("/:lesson_id", lessonController.getLessonById);

/* ===== UPDATE ===== */
router.put("/:lesson_id", lessonController.updateLesson);

/* ===== DELETE ===== */
router.delete("/:lesson_id", lessonController.deleteLesson);

module.exports = router;