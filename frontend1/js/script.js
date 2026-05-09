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

  // ─── CourseDetailPage ────────────────────────────────────────────────────
  // FIX 1: Uses embed_url from backend instead of raw video_url in iframe
  // FIX 2: Added Next / Previous lesson navigation buttons
  // FIX 3: Sidebar active item updates when Next/Prev is clicked
  // Everything else is identical to the original
    // ─── Formats plain text lesson content into readable HTML ───────────────────
  function formatContent(text) {
    if (!text) return "<p>No content available</p>";

    const lines = text.split("\n");
    let html = "";
    let inList = false;
    let inCode = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty line — close any open list or code block, add paragraph break
      if (!trimmed) {
        if (inList) { html += "</ul>"; inList = false; }
        if (inCode) { html += "</code></pre>"; inCode = false; }
        html += "<br>";
        continue;
      }

      // Bullet point line starting with "- "
      if (trimmed.startsWith("- ")) {
        if (inCode) { html += "</code></pre>"; inCode = false; }
        if (!inList) { html += "<ul>"; inList = true; }
        html += `<li>${trimmed.slice(2)}</li>`;
        continue;
      }

      // Numbered step line like "Step 1:" or "1."
      if (/^(Step\s*\d+[:.]|^\d+\.)/.test(trimmed)) {
        if (inList) { html += "</ul>"; inList = false; }
        if (inCode) { html += "</code></pre>"; inCode = false; }
        html += `<p class="lesson-step"><strong>${trimmed}</strong></p>`;
        continue;
      }

      // Section heading — short line ending with ":" and no spaces inside (like "Key Features of Python:")
      if (trimmed.endsWith(":") && trimmed.length < 60 && !trimmed.includes("  ")) {
        if (inList) { html += "</ul>"; inList = false; }
        if (inCode) { html += "</code></pre>"; inCode = false; }
        html += `<h3 class="lesson-subheading">${trimmed}</h3>`;
        continue;
      }

      // Code line — starts with known code keywords or special chars
      const isCode = /^(print|import|def |class |if |for |while |python |#|>>>|\$)/.test(trimmed)
        || trimmed.startsWith("python --")
        || /\.(py|html|js|css)$/.test(trimmed);

      if (isCode) {
        if (inList) { html += "</ul>"; inList = false; }
        if (!inCode) { html += `<pre class="lesson-code"><code>`; inCode = true; }
        else { html += "\n"; }
        html += trimmed;
        continue;
      }

      // Regular paragraph line
      if (inList) { html += "</ul>"; inList = false; }
      if (inCode) { html += "</code></pre>"; inCode = false; }
      html += `<p>${trimmed}</p>`;
    }

    // Close any unclosed tags
    if (inList) html += "</ul>";
    if (inCode) html += "</code></pre>";

    return html;
  }
  const CourseDetailPage = {

    // Stores all lessons so Next/Prev can navigate the full list
    allLessons: [],
    currentIndex: 0,
    course: null,

    async init() {
      if (!document.querySelector(".lesson-page")) return;

      const courseId = new URLSearchParams(window.location.search).get("id");

      const lessonContent   = document.querySelector(".lesson-content");
      const lessonList      = document.querySelector(".lesson-list");
      const breadcrumbCurrent = document.querySelector(".lesson-breadcrumb .current");
      const breadcrumbCourse  = document.querySelectorAll(".lesson-breadcrumb a")[1];
      const sidebarHeader   = document.querySelector(".sidebar-header");

      if (!courseId) {
        if (lessonContent) lessonContent.innerHTML = "<h1>Select a course</h1>";
        return;
      }

      try {
        const course  = await apiRequest(`/courses/${courseId}`);
        const modules = await apiRequest(`/modules/${courseId}`);

        this.course = course;
        this.allLessons = [];

        for (let module of modules) {
          const lessons = await apiRequest(`/lessons/module/${module.id}`);
          this.allLessons.push(
            ...lessons.map((l) => ({ ...l, module_title: module.title }))
          );
        }

        if (sidebarHeader) {
          sidebarHeader.innerHTML = `
            <h2>${course.title}</h2>
            <p>${modules.length} Modules · ${this.allLessons.length} Lessons</p>
          `;
        }

        if (breadcrumbCurrent) breadcrumbCurrent.textContent = course.title;
        if (breadcrumbCourse)  breadcrumbCourse.textContent  = course.title;

        if (lessonList) {
          lessonList.innerHTML = this.allLessons.length
            ? this.allLessons.map((lesson, index) => `
                <div class="lesson-item ${index === 0 ? "active" : ""}" data-id="${lesson.id}" data-index="${index}">
                  <div class="lesson-number">${index + 1}</div>
                  <div class="lesson-info">
                    <h4>${lesson.title}</h4>
                    <span>${lesson.module_title}</span>
                  </div>
                  <span class="lesson-duration">${lesson.video_url ? "Video" : "Read"}</span>
                </div>
              `).join("")
            : "<p>No lessons found</p>";
        }

        if (this.allLessons.length > 0) {
          this.currentIndex = 0;
          const firstLesson = await apiRequest(`/lessons/${this.allLessons[0].id}`);
          this.renderLesson(course, firstLesson, 0);
        }

        // Sidebar click — switch lesson
        document.querySelectorAll(".lesson-item").forEach((item) => {
          item.addEventListener("click", async () => {
            const index = parseInt(item.dataset.index, 10);
            await this.goToLesson(index);
          });
        });

        AIChat.init();

      } catch (error) {
        if (lessonContent) {
          lessonContent.innerHTML = `<h1>Error</h1><p>${error.message}</p>`;
        }
      }
    },

    // Navigate to lesson by index — used by sidebar clicks and Next/Prev buttons
    async goToLesson(index) {
      if (index < 0 || index >= this.allLessons.length) return;

      this.currentIndex = index;

      // Update sidebar active state
      document.querySelectorAll(".lesson-item").forEach((item) => {
        item.classList.toggle("active", parseInt(item.dataset.index, 10) === index);
      });

      // Scroll sidebar item into view
      const activeItem = document.querySelector(`.lesson-item[data-index="${index}"]`);
      if (activeItem) activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });

      const lesson = await apiRequest(`/lessons/${this.allLessons[index].id}`);
      this.renderLesson(this.course, lesson, index);
    },

        renderLesson(course, lesson, index) {
      const lessonContent = document.querySelector(".lesson-content");
      if (!lessonContent) return;

      const total   = this.allLessons.length;
      const isFirst = index === 0;
      const isLast  = index === total - 1;

      // FIX: use embed_url from backend
      let videoEmbed = "";
      if (lesson.embed_url) {
        videoEmbed = `
          <div class="video-container" style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; margin-top:30px;">
            <iframe
              style="position:absolute; top:0; left:0; width:100%; height:100%;"
              src="${lesson.embed_url}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
          </div>
        `;
      } else if (lesson.video_url) {
        videoEmbed = `
          <p style="margin-top:20px; color:#f59e0b;">
            ⚠️ Video could not be embedded.
            <a href="${lesson.video_url}" target="_blank" style="color:#60a5fa;">Watch on YouTube ↗</a>
          </p>
        `;
      }

      lessonContent.innerHTML = `
        <h1>${lesson.title}</h1>

        <div class="lesson-meta">
          <span>${course.title}</span>
          <span>&middot;</span>
          <span>${lesson.video_url ? "Video Lesson" : "Reading"}</span>
          <span>&middot;</span>
          <span>Lesson ${index + 1} of ${total}</span>
        </div>

        <!-- TEXT CONTENT FIRST -->
        <div class="lesson-text">
          ${formatContent(lesson.content)}
        </div>

        <!-- VIDEO SECOND -->
        ${videoEmbed}

        <!-- NAVIGATION BUTTONS -->
        <div style="display:flex; align-items:center; gap:12px; margin-top:30px; flex-wrap:wrap;">
          <button id="prevLessonBtn" class="btn btn-secondary"
            ${isFirst ? "disabled" : ""}
            style="opacity:${isFirst ? "0.4" : "1"};">
            ← Previous
          </button>

          <button id="completeLessonBtn" class="btn btn-primary">
            Mark as Complete
          </button>

          <button id="nextLessonBtn" class="btn btn-secondary"
            ${isLast ? "disabled" : ""}
            style="opacity:${isLast ? "0.4" : "1"};">
            Next →
          </button>
        </div>
      `;

      const prevBtn = document.getElementById("prevLessonBtn");
      if (prevBtn && !isFirst) {
        prevBtn.addEventListener("click", () => this.goToLesson(index - 1));
      }

      const nextBtn = document.getElementById("nextLessonBtn");
      if (nextBtn && !isLast) {
        nextBtn.addEventListener("click", () => this.goToLesson(index + 1));
      }

      const completeBtn = document.getElementById("completeLessonBtn");
      if (completeBtn) {
        completeBtn.addEventListener("click", async () => {
          try {
            completeBtn.disabled = true;
            await apiRequest("/progress/complete-lesson", {
              method: "POST",
              body: { lesson_id: lesson.id }
            });
            completeBtn.textContent = "Completed ✅";
          } catch (err) {
            alert(err.message);
          } finally {
            completeBtn.disabled = false;
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
