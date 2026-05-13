require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();

const questionRoutes = require("./routes/questionRoutes");

const submissionRoutes = require("./routes/submissionRoutes");

const aiRoutes = require("./routes/aiRoutes");

const leaderboardRoutes = require("./routes/leaderboardRoutes");
const courseRoutes = require("./routes/coursesRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const progressRoutes = require("./routes/progressRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const videoRoutes = require("./routes/videoRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { sendSuccess } = require("./utils/apiResponse");

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://127.0.0.1:5500,http://localhost:5500,https://code-path-frontend-git-main-nipeksh-pal-s-projects.vercel.app/" 
)
.split(",")
.map((origin) => origin.trim())
.filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
  return sendSuccess(res, {
    message: "Code Path Academy Backend Running",
    version: "v1"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", profileRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/lessons", lessonRoutes);


// Legacy endpoints kept to avoid breaking older frontend calls.
app.use("/api", questionRoutes);
app.use("/api", submissionRoutes);
app.use("/api", leaderboardRoutes);
app.use("/api", courseRoutes);
app.use("/api", moduleRoutes);
app.use("/api", progressRoutes);
app.use("/api", videoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});