const db = require("../config/db");
const { generateQuestion, solveDoubt } = require("../services/aiService");
const { sendSuccess, sendError } = require("../utils/apiResponse");


exports.createAIQuestion = async (req, res) => {
  const { topic, difficulty } = req.body;
  if (!topic || !difficulty) {
    return sendError(res, "topic and difficulty are required", 400);
  }

  try {
    const aiQuestion = await generateQuestion(topic, difficulty);

    if (!aiQuestion) {
      return sendError(res, "AI failed to generate question", 500);
    }

    const sql = `
    INSERT INTO questions (title, description, topic, difficulty, points)
    VALUES (?,?,?,?,?)
    `;

    db.query(
      sql,
      [
        aiQuestion.title,
        aiQuestion.description,
        aiQuestion.topic,
        aiQuestion.difficulty,
        aiQuestion.points
      ],
      (err, result) => {
        if (err) return sendError(res, "Failed to store AI question", 500);

        return sendSuccess(res, {
          id: result.insertId,
          message: "AI question generated successfully",
          question: aiQuestion
        });
      }
    );
  } catch (error) {
    console.error("AI Question Error:", error);
    return sendError(res, "AI generation failed", 500);
  }
};


exports.askDoubt = async (req, res) => {
  const { doubt } = req.body;

  try {
    if (!doubt) {
      return sendError(res, "Please provide a doubt", 400);
    }

    const answer = await solveDoubt(doubt);

    return sendSuccess(res, {
      doubt,
      answer
    });
  } catch (error) {
    console.error("AI Doubt Error:", error);
    return sendError(res, "AI failed to answer the doubt", 500);
  }
};