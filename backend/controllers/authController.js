const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const sendMail = require("../utils/mailer");
const { sendSuccess, sendError } = require("../utils/apiResponse");

let otpStore = {};
let verifiedUsers = {};

function buildUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio || "",
    college: user.college || "",
    profile_picture: user.profile_picture || null,
    joined_date: user.joined_date || null,
    points: user.points || 0,
    questions_solved: user.questions_solved || 0,
    correct_answers: user.correct_answers || 0
  };
}

exports.sendOtp = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return sendError(res, "Email is required", 400);
  }

  const sql = "SELECT * FROM users WHERE email=?";

  db.query(sql, [email], async (err, result) => {
    if (err) {
      return sendError(res, "Failed to validate email", 500);
    }

    if (result.length > 0) {
      return sendError(res, "Email already registered", 409);
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore[email] = {
      otp,
      expiry: Date.now() + 5 * 60 * 1000
    };

    try {

      await sendMail(
        email,
        "Code Path Academy OTP",
        `Your OTP is ${otp}`
      );

      return sendSuccess(res, { message: "OTP sent successfully" });
    } catch {
      return sendError(res, "Error sending OTP", 500);
    }

  });
};

exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return sendError(res, "Email and OTP are required", 400);
  }

  const stored = otpStore[email];

  if (!stored) return sendError(res, "OTP not found", 404);

  if (Date.now() > stored.expiry) {
    delete otpStore[email];
    return sendError(res, "OTP expired", 400);
  }

  if (stored.otp == otp) {

    delete otpStore[email];
    verifiedUsers[email] = true;

    return sendSuccess(res, { message: "OTP verified successfully" });
  } else {
    return sendError(res, "Invalid OTP", 400);
  }
};

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return sendError(res, "Name, email and password are required", 400);
  }

  if (!verifiedUsers[email]) {
    return sendError(res, "Please verify OTP first", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO users (name,email,password) VALUES (?,?,?)";

  db.query(sql, [name, email, hashedPassword], (err) => {
    if (err) return sendError(res, "Failed to create user", 500);

    delete verifiedUsers[email];

    return sendSuccess(res, { message: "User registered successfully" }, 201);
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return sendError(res, "Email and password are required", 400);
  }

  const sql = "SELECT * FROM users WHERE email=?";

  db.query(sql, [email], async (err, result) => {
    if (err) {
      return sendError(res, "Failed to login", 500);
    }

    if (result.length === 0) {
      return sendError(res, "User not found", 404);
    }

    const user = result[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return sendError(res, "Invalid password", 401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return sendSuccess(res, {
      message: "Login successful",
      token,
      user: buildUser(user)
    });
  });
};