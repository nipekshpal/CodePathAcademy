const axios = require("axios");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const headers = {
  "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "http://localhost:5000",
  "X-Title": "Code Path Academy"
};


// AI ANSWER EVALUATION
const evaluateAnswer = async (question, answer) => {

  try {

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a strict coding judge."
          },
          {
            role: "user",
            content: `
Question:
${question}

Student Answer:
${answer}

Return JSON only like this:
{
"correct": true,
"explanation": "short explanation"
}
`
          }
        ]
      },
      { headers }
    );

    return JSON.parse(response.data.choices[0].message.content);

  } catch (error) {

    console.error("AI Error:", error.response?.data || error.message);

    return {
      correct: false,
      explanation: "AI evaluation failed"
    };

  }

};


// AI QUESTION GENERATOR
const generateQuestion = async (topic, difficulty) => {

  try {

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You generate coding problems for programming students."
          },
          {
            role: "user",
            content: `
Create a programming question.

Topic: ${topic}
Difficulty: ${difficulty}

Return JSON only like this:

{
"title": "short question title",
"description": "clear coding problem statement",
"topic": "${topic}",
"difficulty": "${difficulty}",
"points": 10
}
`
          }
        ]
      },
      { headers }
    );

    return JSON.parse(response.data.choices[0].message.content);

  } catch (error) {

    console.error("AI Question Error:", error.response?.data || error.message);

    return null;

  }

};

// AI DOUBT SOLVER
const solveDoubt = async (question) => {

  try {

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful programming tutor."
          },
          {
            role: "user",
            content: `
Student Doubt:
${question}

Explain in this format:

1. Simple Definition
2. Why it is used
3. Real-life example
4. Code example
5. Short summary
`
          }
        ]
      },
      { headers }
    );

    return response.data.choices[0].message.content;

  } catch (error) {

    console.error("AI Doubt Error:", error.response?.data || error.message);

    return "AI failed to answer the doubt.";

  }

};

module.exports = {
  evaluateAnswer,
  generateQuestion,
    solveDoubt
};