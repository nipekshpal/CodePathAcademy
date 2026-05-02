const express = require("express");
const router = express.Router();

const controller = require("../controllers/moduleController");

router.post("/", controller.addModule);
router.post("/lessons", controller.addLesson);
router.post("/module", controller.addModule);
router.post("/lesson", controller.addLesson);

module.exports = router;