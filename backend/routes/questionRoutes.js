const express = require("express");

const router = express.Router();

const questionController = require("../controllers/questionController");

router.get("/", questionController.getQuestions);
router.get("/:id", questionController.getQuestionById);
router.get("/questions", questionController.getQuestions);
router.get("/questions/:id", questionController.getQuestionById);

module.exports = router;