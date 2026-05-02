const express = require("express");
const router = express.Router();

const { askDoubt, createAIQuestion } = require("../controllers/aiController");

router.post("/doubt", askDoubt);
router.post("/generate", createAIQuestion);

module.exports = router;