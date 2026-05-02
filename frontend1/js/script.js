/* ============================================
   CODEPATH - API CONNECTED FRONTEND
   ============================================ */
(function () {
  "use strict";

  const CONFIG = {
    STORAGE_KEYS: {
      THEME: "codepath_theme",
      AUTH: "codepath_auth",
      USER: "codepath_user"
    },
    API: {
      BASE_URL: resolveApiBaseUrl()
    }
  };

  const DOM = {};

  function resolveApiBaseUrl() {
    const metaValue = document.querySelector('meta[name="api-base-url"]')?.content?.trim();
    const runtimeValue = window.CODEPATH_API_BASE_URL;

    if (metaValue) {
      return metaValue.replace(/\/$/, "");
    }

    if (runtimeValue) {
      return String(runtimeValue).replace(/\/$/, "");
    }

    const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    return isLocalhost
      ? "http://localhost:5000/api"
      : "/api";
  }

  function cacheDOM() {
    DOM.navbar = document.querySelector(".navbar");
    DOM.navAuth = document.querySelector(".nav-auth");
    DOM.profileSection = document.querySelector(".profile-section");
    DOM.profileDropdown = document.querySelector(".profile-dropdown");
    DOM.profileAvatar = document.querySelector(".profile-avatar");
    DOM.mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
    DOM.mobileNav = document.querySelector(".mobile-nav");
    DOM.themeToggle = document.querySelector(".theme-toggle");
    DOM.aiPanel = document.querySelector(".ai-panel");
    DOM.aiPanelToggle = document.querySelector(".ai-panel-toggle");
    DOM.aiChat = document.querySelector(".ai-chat");
    DOM.aiInput = document.querySelector(".ai-input");
    DOM.aiSendBtn = document.querySelector(".ai-send-btn");
    DOM.sidebar = document.querySelector(".lesson-sidebar");
  }

  function getToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH);
  }

  function getStoredUser() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || "null");
  }

  function setStoredUser(user) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
  }

  function initials(name) {
    return (name || "User")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function formatDate(value) {
    if (!value) return "N/A";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "N/A"
      : date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }

  function showMessage(elementId, message, isError) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = message || "";
    element.classList.toggle("show", Boolean(message));
    element.style.color = isError ? "#ef4444" : "#22c55e";
  }

  async function apiRequest(path, options = {}) {
    const headers = Object.assign(
      { "Content-Type": "application/json" },
      options.headers || {}
    );

    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(`${CONFIG.API.BASE_URL}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        credentials: "include"
      });
    } catch (error) {
      throw new Error(
        "Failed to fetch. Check API URL, CORS, backend availability, and HTTPS/HTTP mismatch."
      );
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.success) {
      const message = payload?.error?.message || "Something went wrong";
      throw new Error(message);
    }

    return payload.data;
  }

  const ThemeManager = {
    init() {
      const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      this.set(savedTheme || (prefersDark ? "dark" : "light"));
    },
    toggle() {
      const current = document.documentElement.getAttribute("data-theme");
      this.set(current === "light" ? "dark" : "light");
    },
    set(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
    }
  };

  const AuthManager = {
    bindEvents() {
      const loginForm = document.getElementById("loginForm");
      const signupForm = document.getElementById("signupForm");
      const logoutButtons = document.querySelectorAll("#logoutBtn, #mobileLogoutBtn");

      if (loginForm) {
        const submitButton = loginForm.querySelector("button[type='submit']");
        if (submitButton) submitButton.dataset.originalText = submitButton.textContent;
        loginForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const email = document.getElementById("loginEmail")?.value.trim();
          const password = document.getElementById("loginPassword")?.value.trim();
          try {
            this.setLoading(loginForm, true);
            showMessage("loginError", "", false);
            await this.login(email, password);
            window.location.href = "dashboard.html";
          } catch (error) {
            showMessage("loginError", error.message, true);
          } finally {
            this.setLoading(loginForm, false);
          }
        });
      }

      if (signupForm) {
        const submitButton = signupForm.querySelector("button[type='submit']");
        if (submitButton) submitButton.dataset.originalText = submitButton.textContent;
        signupForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const name = document.getElementById("signupName")?.value.trim();
          const email = document.getElementById("signupEmail")?.value.trim();
          const password = document.getElementById("signupPassword")?.value.trim();
          try {
            this.setLoading(signupForm, true);
            showMessage("signupError", "", false);
            await this.signup(name, email, password);
            window.location.href = "dashboard.html";
          } catch (error) {
            showMessage("signupError", error.message, true);
          } finally {
            this.setLoading(signupForm, false);
          }
        });
      }

      logoutButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          this.logout();
        });
      });
    },
    setLoading(form, isLoading) {
      const button = form.querySelector("button[type='submit']");
      if (!button) return;
      button.disabled = isLoading;
      button.textContent = isLoading
        ? "Please wait..."
        : (button.dataset.originalText || button.textContent);
    },
    async login(email, password) {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: { email, password }
      });
      localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH, data.token);
      setStoredUser(data.user);
      this.applyAuthState(data.user);
      return data;
    },
    async signup(name, email, password) {
      await apiRequest("/auth/send-otp", {
        method: "POST",
        body: { email }
      });
      const otp = window.prompt("Enter the OTP sent to your email");
      if (!otp) {
        throw new Error("Signup cancelled: OTP is required");
      }
      await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: { email, otp }
      });
      await apiRequest("/auth/signup", {
        method: "POST",
        body: { name, email, password }
      });
      return this.login(email, password);
    },
    async hydrateUser() {
      const token = getToken();
      if (!token) {
        this.applyLoggedOutState();
        return null;
      }

      try {
        const user = await apiRequest("/user/profile");
        setStoredUser(user);
        this.applyAuthState(user);
        return user;
      } catch (error) {
        this.logout(false);
        return null;
      }
    },
    applyAuthState(user) {
      if (DOM.navAuth) DOM.navAuth.style.display = "none";
      if (DOM.profileSection) DOM.profileSection.style.display = "flex";
      if (DOM.profileAvatar) {
        const avatarTextNode = Array.from(DOM.profileAvatar.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
        if (avatarTextNode) {
          avatarTextNode.textContent = initials(user.name);
        } else {
          DOM.profileAvatar.insertBefore(document.createTextNode(initials(user.name)), DOM.profileAvatar.firstChild);
        }
      }
      document.querySelectorAll(".mobile-auth-link").forEach((link) => {
        link.style.display = "none";
      });
      document.querySelectorAll(".mobile-user-link").forEach((link) => {
        link.style.display = "block";
      });
    },
    applyLoggedOutState() {
      if (DOM.navAuth) DOM.navAuth.style.display = "flex";
      if (DOM.profileSection) DOM.profileSection.style.display = "none";
      document.querySelectorAll(".mobile-auth-link").forEach((link) => {
        link.style.display = "block";
      });
      document.querySelectorAll(".mobile-user-link").forEach((link) => {
        link.style.display = "none";
      });
    },
    logout(redirect = true) {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
      this.applyLoggedOutState();
      if (redirect) {
        window.location.href = "index.html";
      }
    }
  };

  const Navigation = {
    init() {
      this.fixLegacyLinks();
      this.bindEvents();
      this.highlightCurrentPage();
      this.handleScroll();
    },
    fixLegacyLinks() {
      document.querySelectorAll("a[href='course-detail.html']").forEach((link) => {
        link.setAttribute("href", "courses-detail.html");
      });
      document.querySelectorAll("a[href='course1.html']").forEach((link) => {
        link.setAttribute("href", "courses.html");
      });
    },
    bindEvents() {
      if (DOM.mobileMenuToggle && DOM.mobileNav) {
        DOM.mobileMenuToggle.addEventListener("click", () => {
          DOM.mobileMenuToggle.classList.toggle("active");
          DOM.mobileNav.classList.toggle("active");
        });
      }

      if (DOM.profileAvatar && DOM.profileDropdown) {
        DOM.profileAvatar.addEventListener("click", (event) => {
          event.stopPropagation();
          DOM.profileDropdown.classList.toggle("show");
        });
        document.addEventListener("click", () => {
          DOM.profileDropdown.classList.remove("show");
        });
      }

      if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener("click", () => ThemeManager.toggle());
      }

      if (DOM.aiPanelToggle && DOM.aiPanel) {
        DOM.aiPanelToggle.addEventListener("click", () => {
          DOM.aiPanel.classList.toggle("open");
        });
      }

      const aiToggleButton = document.querySelector(".ai-toggle-btn");
      if (aiToggleButton && DOM.aiPanel) {
        aiToggleButton.addEventListener("click", () => {
          DOM.aiPanel.classList.toggle("open");
        });
      }

      document.querySelectorAll(".mobile-nav-link").forEach((link) => {
        link.addEventListener("click", () => {
          if (DOM.mobileMenuToggle) DOM.mobileMenuToggle.classList.remove("active");
          if (DOM.mobileNav) DOM.mobileNav.classList.remove("active");
        });
      });
    },
    highlightCurrentPage() {
      const currentPage = window.location.pathname.split("/").pop() || "index.html";
      document.querySelectorAll(".nav-link, .mobile-nav-link").forEach((link) => {
        if (link.getAttribute("href") === currentPage) {
          link.classList.add("active");
        }
      });
    },
    handleScroll() {
      window.addEventListener("scroll", () => {
        if (!DOM.navbar) return;
        DOM.navbar.style.boxShadow = window.pageYOffset > 10 ? "var(--shadow-md)" : "none";
      });
    }
  };

  const DashboardPage = {
    async init() {
      const page = document.querySelector(".dashboard-page");
      if (!page) return;

      const user = await AuthManager.hydrateUser();
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      try {
        const [progress, activity, leaderboard, courses] = await Promise.all([
          apiRequest("/progress/stats"),
          apiRequest("/activity/stats"),
          apiRequest("/leaderboard"),
          apiRequest("/courses")
        ]);

        this.renderHeader(user);
        this.renderStats(progress, activity);
        this.renderProgress(progress, activity);
        this.renderCourses(courses);
        this.renderLeaderboard(leaderboard);
      } catch (error) {
        const container = document.querySelector(".dashboard-container");
        if (container) {
          container.insertAdjacentHTML(
            "afterbegin",
            `<div class="form-error show" style="display:block;">${error.message}</div>`
          );
        }
      }
    },
    renderHeader(user) {
      const heading = document.querySelector(".dashboard-header h1");
      if (heading) {
        heading.innerHTML = `Welcome back, <span class="text-gradient">${user.name}</span>!`;
      }
    },
    renderStats(progress, activity) {
      const cards = document.querySelectorAll(".stats-grid .stat-card");
      const stats = [
        progress.completed_lessons || 0,
        progress.questions_solved || 0,
        activity.total_time || 0,
        progress.total_points || 0
      ];
      cards.forEach((card, index) => {
        const value = card.querySelector(".stat-value");
        if (value) {
          value.dataset.count = String(stats[index] || 0);
          value.textContent = String(stats[index] || 0);
        }
      });
      const labels = ["Lessons Completed", "Questions Solved", "Minutes Spent", "Total Points"];
      cards.forEach((card, index) => {
        const label = card.querySelector(".stat-label");
        const change = card.querySelector(".stat-change");
        if (label) label.textContent = labels[index];
        if (change && index === 2) change.textContent = `${activity.total_correct || 0} correct answers`;
      });
    },
    renderProgress(progress, activity) {
      const cards = document.querySelectorAll(".progress-section .progress-card");
      if (cards[0]) {
        cards[0].innerHTML = `
          <h3>Your Progress</h3>
          <div class="progress-item">
            <div class="progress-header"><span>Completed Lessons</span><span>${progress.completed_lessons || 0}</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min((progress.completed_lessons || 0) * 10, 100)}%"></div></div>
          </div>
          <div class="progress-item">
            <div class="progress-header"><span>Questions Solved</span><span>${progress.questions_solved || 0}</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min((progress.questions_solved || 0) * 5, 100)}%"></div></div>
          </div>
          <div class="progress-item">
            <div class="progress-header"><span>Correct Answers</span><span>${progress.correct_answers || 0}</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min((progress.correct_answers || 0) * 5, 100)}%"></div></div>
          </div>
        `;
      }
      if (cards[1]) {
        cards[1].innerHTML = `
          <h3>Activity Summary</h3>
          <div class="progress-item">
            <div class="progress-header"><span>Total Time</span><span>${activity.total_time || 0} min</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(activity.total_time || 0, 100)}%"></div></div>
          </div>
          <div class="progress-item">
            <div class="progress-header"><span>Total Questions</span><span>${activity.total_questions || 0}</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min((activity.total_questions || 0) * 5, 100)}%"></div></div>
          </div>
          <div class="progress-item">
            <div class="progress-header"><span>Total Wrong</span><span>${activity.total_wrong || 0}</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min((activity.total_wrong || 0) * 5, 100)}%"></div></div>
          </div>
        `;
      }
    },
    renderCourses(courses) {
      const grid = document.querySelector(".enrolled-grid");
      if (!grid) return;
      if (!courses.length) {
        grid.innerHTML = "<p>No courses available yet.</p>";
        return;
      }
      grid.innerHTML = courses.slice(0, 3).map((course) => `
        <a href="courses-detail.html?id=${course.id}" class="enrolled-card">
          <div class="enrolled-icon">${course.title?.charAt(0) || "C"}</div>
          <div class="enrolled-info">
            <h4>${course.title}</h4>
            <p>${course.instructor || "CodePath Instructor"}</p>
            <div class="enrolled-progress"><div class="progress-fill" style="width:40%"></div></div>
          </div>
        </a>
      `).join("");
    },
    renderLeaderboard(leaderboard) {
      const container = document.querySelector(".dashboard-container");
      if (!container) return;
      const section = document.createElement("section");
      section.className = "enrolled-section";
      section.innerHTML = `
        <h2>Leaderboard</h2>
        <div class="progress-card">
          ${leaderboard.length ? leaderboard.map((user, index) => `
            <div class="progress-item">
              <div class="progress-header">
                <span>#${index + 1} ${user.name}</span>
                <span>${user.points} pts</span>
              </div>
              <div class="stat-change positive">${user.questions_solved} questions solved</div>
            </div>
          `).join("") : "<p>No leaderboard data yet.</p>"}
        </div>
      `;
      container.appendChild(section);
    }
  };

  const CoursesPage = {
    async init() {
      const grid = document.querySelector(".courses-grid");
      if (!grid) return;

      try {
        const courses = await apiRequest("/courses");
        if (!courses.length) {
          grid.innerHTML = "<p>No courses available right now.</p>";
          return;
        }

        grid.innerHTML = courses.map((course) => `
          <a href="courses-detail.html?id=${course.id}" class="course-card">
            <div class="course-image">${course.title?.charAt(0) || "C"}</div>
            <div class="course-body">
              <span class="course-tag">${course.instructor || "Instructor"}</span>
              <h3 class="course-title">${course.title}</h3>
              <p class="course-desc">${course.description || "No description available."}</p>
              <div class="course-meta">
                <div class="course-meta-item">${course.instructor || "CodePath Team"}</div>
                <div class="course-meta-item">Course ID: ${course.id}</div>
              </div>
              <button class="btn btn-primary course-btn" type="button">Start Learning</button>
            </div>
          </a>
        `).join("");
      } catch (error) {
        grid.innerHTML = `<p>${error.message}</p>`;
      }
    }
  };

  const ProfilePage = {
    async init() {
      if (!document.querySelector(".profile-page")) return;

      const user = await AuthManager.hydrateUser();
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      this.renderUser(user);
      this.bindEvents(user);
    },
    renderUser(user) {
      const nameInput = document.getElementById("profileName");
      const emailInput = document.getElementById("profileEmail");
      const nameHeader = document.getElementById("profileHeaderName");
      const emailHeader = document.getElementById("profileHeaderEmail");
      const avatar = document.getElementById("profileAvatar");
      const memberSince = document.getElementById("profileMemberSince");
      const accountType = document.getElementById("profileAccountType");

      if (nameInput) nameInput.value = user.name || "";
      if (emailInput) emailInput.value = user.email || "";
      if (nameHeader) nameHeader.textContent = user.name || "User";
      if (emailHeader) emailHeader.textContent = user.email || "";
      if (avatar) avatar.textContent = initials(user.name);
      if (memberSince) memberSince.textContent = formatDate(user.joined_date);
      if (accountType) accountType.textContent = "Member";
    },
    bindEvents(user) {
      const editButton = document.getElementById("editProfileBtn");
      const saveButton = document.getElementById("saveProfileBtn");
      const cancelButton = document.getElementById("cancelProfileBtn");
      const inputs = document.querySelectorAll(".profile-field input");

      const toggleEdit = (enabled) => {
        inputs.forEach((input) => {
          if (input.id === "profileEmail") return;
          input.readOnly = !enabled;
          input.classList.toggle("editable", enabled);
        });
        if (editButton) editButton.classList.toggle("hidden", enabled);
        if (saveButton) saveButton.classList.toggle("hidden", !enabled);
        if (cancelButton) cancelButton.classList.toggle("hidden", !enabled);
      };

      if (editButton) {
        editButton.addEventListener("click", () => toggleEdit(true));
      }

      if (cancelButton) {
        cancelButton.addEventListener("click", () => {
          this.renderUser(user);
          toggleEdit(false);
        });
      }

      if (saveButton) {
        saveButton.addEventListener("click", async () => {
          try {
            saveButton.disabled = true;
            const name = document.getElementById("profileName")?.value.trim();
            const profileData = await apiRequest("/user/update-profile", {
              method: "PUT",
              body: {
                bio: name ? `Learner profile for ${name}` : "",
                college: "",
                profile_picture: ""
              }
            });
            const refreshed = await apiRequest("/user/profile");
            setStoredUser(refreshed);
            this.renderUser(refreshed);
            toggleEdit(false);
            saveButton.textContent = profileData.message || "Saved";
            setTimeout(() => {
              saveButton.textContent = "Save Changes";
            }, 1500);
          } catch (error) {
            window.alert(error.message);
          } finally {
            saveButton.disabled = false;
          }
        });
      }
    }
  };

  const CourseDetailPage = {
    async init() {
      if (!document.querySelector(".lesson-page")) return;

      const courseId = new URLSearchParams(window.location.search).get("id");
      const lessonContent = document.querySelector(".lesson-content");
      const lessonList = document.querySelector(".lesson-list");
      const breadcrumbCurrent = document.querySelector(".lesson-breadcrumb .current");
      const breadcrumbCourse = document.querySelectorAll(".lesson-breadcrumb a")[1];
      const sidebarHeader = document.querySelector(".sidebar-header");

      if (!courseId) {
        if (lessonContent) {
          lessonContent.innerHTML = "<h1>Select a course</h1><p>No course ID was provided.</p>";
        }
        return;
      }

      try {
        const [courseData, questions] = await Promise.all([
          apiRequest(`/courses/${courseId}`),
          apiRequest("/questions")
        ]);

        const { course, modules, lessons } = courseData;
        if (sidebarHeader) {
          sidebarHeader.innerHTML = `
            <h2>${course.title}</h2>
            <p>${modules.length} Modules · ${lessons.length} Lessons</p>
          `;
        }
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = course.title;
        if (breadcrumbCourse) breadcrumbCourse.textContent = course.title;

        if (lessonList) {
          lessonList.innerHTML = lessons.length ? lessons.map((lesson, index) => `
            <div class="lesson-item ${index === 0 ? "active" : ""}" data-lesson-id="${lesson.id}">
              <div class="lesson-number">${index + 1}</div>
              <div class="lesson-info">
                <h4>${lesson.title}</h4>
                <span>${modules.find((module) => module.id === lesson.module_id)?.title || "Lesson"}</span>
              </div>
              <span class="lesson-duration">${lesson.video_url ? "Video" : "Read"}</span>
            </div>
          `).join("") : "<p>No lessons found.</p>";
        }

        this.renderLesson(course, lessons[0], questions);
        this.bindLessonSwitch(course, lessons, questions);
        AIChat.init();
      } catch (error) {
        if (lessonContent) {
          lessonContent.innerHTML = `<h1>Error</h1><p>${error.message}</p>`;
        }
      }
    },
    bindLessonSwitch(course, lessons, questions) {
      document.querySelectorAll(".lesson-item").forEach((item) => {
        item.addEventListener("click", () => {
          document.querySelectorAll(".lesson-item").forEach((node) => node.classList.remove("active"));
          item.classList.add("active");
          const lesson = lessons.find((entry) => String(entry.id) === item.dataset.lessonId);
          this.renderLesson(course, lesson, questions);
        });
      });
    },
    renderLesson(course, lesson, questions) {
      const lessonContent = document.querySelector(".lesson-content");
      if (!lessonContent || !lesson) return;

      const question = questions[0];
      lessonContent.innerHTML = `
        <h1>${lesson.title}</h1>
        <div class="lesson-meta">
          <span>${course.title}</span>
          <span>&middot;</span>
          <span>${lesson.video_url ? "Video lesson" : "Reading lesson"}</span>
          <span>&middot;</span>
          <span>Course ID ${course.id}</span>
        </div>
        <p>${lesson.content || "No lesson content available."}</p>
        <h2>Practice Question</h2>
        ${question ? `
          <div class="progress-card" style="margin-top:16px;">
            <h3>${question.title || "Coding Question"}</h3>
            <p>${question.description || ""}</p>
            <textarea id="submissionCode" class="form-input" rows="8" placeholder="Write your answer here"></textarea>
            <div style="margin-top:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
              <select id="submissionLanguage" class="form-input" style="max-width:220px;">
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="c">C</option>
                <option value="java">Java</option>
              </select>
              <button id="submitQuestionBtn" class="btn btn-primary" type="button">Submit Answer</button>
              <button id="completeLessonBtn" class="btn btn-secondary" type="button">Mark Lesson Complete</button>
            </div>
            <div id="submissionResult" style="margin-top:16px;"></div>
          </div>
        ` : "<p>No practice questions available.</p>"}
      `;

      const submitButton = document.getElementById("submitQuestionBtn");
      if (submitButton && question) {
        submitButton.addEventListener("click", async () => {
          if (!getToken()) {
            window.location.href = "login.html";
            return;
          }

          const resultNode = document.getElementById("submissionResult");
          try {
            submitButton.disabled = true;
            resultNode.innerHTML = "<p>Evaluating your answer...</p>";
            const submission = await apiRequest("/submissions", {
              method: "POST",
              body: {
                question_id: question.id,
                code: document.getElementById("submissionCode")?.value || "",
                language: document.getElementById("submissionLanguage")?.value || "javascript"
              }
            });
            resultNode.innerHTML = `
              <div class="progress-item">
                <div class="progress-header"><span>Result</span><span>${submission.result}</span></div>
                <p>${submission.explanation}</p>
              </div>
            `;
          } catch (error) {
            resultNode.innerHTML = `<p style="color:#ef4444;">${error.message}</p>`;
          } finally {
            submitButton.disabled = false;
          }
        });
      }

      const completeButton = document.getElementById("completeLessonBtn");
      if (completeButton) {
        completeButton.addEventListener("click", async () => {
          if (!getToken()) {
            window.location.href = "login.html";
            return;
          }
          try {
            completeButton.disabled = true;
            await apiRequest("/progress/complete-lesson", {
              method: "POST",
              body: { lesson_id: lesson.id }
            });
            completeButton.textContent = "Completed";
          } catch (error) {
            window.alert(error.message);
          } finally {
            completeButton.disabled = false;
          }
        });
      }
    }
  };

  const AIChat = {
    init() {
      if (!DOM.aiChat) return;
      if (!DOM.aiChat.children.length) {
        this.addMessage("ai", "Ask your coding doubt and I will use the backend AI service.");
      }
      if (DOM.aiSendBtn) {
        DOM.aiSendBtn.addEventListener("click", () => this.sendMessage());
      }
      if (DOM.aiInput) {
        DOM.aiInput.addEventListener("keydown", (event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
          }
        });
      }
    },
    addMessage(role, text) {
      const wrapper = document.createElement("div");
      wrapper.className = `ai-message ${role}`;
      wrapper.innerHTML = `
        <div class="ai-avatar">${role === "user" ? "You" : "AI"}</div>
        <div class="ai-bubble">${String(text).replace(/\n/g, "<br>")}</div>
      `;
      DOM.aiChat.appendChild(wrapper);
      DOM.aiChat.scrollTop = DOM.aiChat.scrollHeight;
    },
    async sendMessage() {
      const doubt = DOM.aiInput?.value.trim();
      if (!doubt) return;

      this.addMessage("user", doubt);
      DOM.aiInput.value = "";
      this.addMessage("ai", "Thinking...");

      try {
        const result = await apiRequest("/ai/doubt", {
          method: "POST",
          body: { doubt }
        });
        const thinkingNode = DOM.aiChat.lastElementChild;
        if (thinkingNode) thinkingNode.remove();
        this.addMessage("ai", result.answer);
      } catch (error) {
        const thinkingNode = DOM.aiChat.lastElementChild;
        if (thinkingNode) thinkingNode.remove();
        this.addMessage("ai", error.message);
      }
    }
  };

  function init() {
    cacheDOM();
    ThemeManager.init();
    Navigation.init();
    AuthManager.bindEvents();
    AuthManager.hydrateUser();
    DashboardPage.init();
    CoursesPage.init();
    ProfilePage.init();
    CourseDetailPage.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();