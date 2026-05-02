const db = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

exports.createCourse = (req, res) => {
  const { title, description, instructor } = req.body;
  if (!title || !description || !instructor) {
    return sendError(res, "title, description and instructor are required", 400);
  }

  const sql = `
  INSERT INTO courses (title, description, instructor)
  VALUES (?, ?, ?)
  `;

  db.query(sql, [title, description, instructor], (err, result) => {
    if (err) return sendError(res, "Failed to create course", 500);

    return sendSuccess(res, { id: result.insertId, message: "Course created" }, 201);
  });
};


exports.getCourses = (req, res) => {
  db.query("SELECT * FROM courses", (err, result) => {
    if (err) return sendError(res, "Failed to fetch courses", 500);

    return sendSuccess(res, result);
  });
};


exports.getCourseDetails = (req, res) => {
  const { id } = req.params;

  const courseQuery = "SELECT * FROM courses WHERE id=?";

  db.query(courseQuery, [id], (err, course) => {
    if (err) return sendError(res, "Failed to fetch course", 500);
    if (!course.length) return sendError(res, "Course not found", 404);

    const moduleQuery = "SELECT * FROM modules WHERE course_id=?";

    db.query(moduleQuery, [id], (err, modules) => {
      if (err) return sendError(res, "Failed to fetch modules", 500);

      const lessonQuery = `
      SELECT * FROM lessons 
      WHERE module_id IN (SELECT id FROM modules WHERE course_id=?)
      `;

      db.query(lessonQuery, [id], (err, lessons) => {
        if (err) return sendError(res, "Failed to fetch lessons", 500);

        return sendSuccess(res, {
          course: course[0],
          modules,
          lessons
        });
      });
    });
  });
};