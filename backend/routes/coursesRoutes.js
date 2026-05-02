const express = require("express");
const router = express.Router();

const controller = require("../controllers/coursesController");

router.post("/", controller.createCourse);
router.get("/", controller.getCourses);
router.get("/:id", controller.getCourseDetails);
router.post("/courses", controller.createCourse);
router.get("/courses", controller.getCourses);
router.get("/courses/:id", controller.getCourseDetails);

module.exports = router;