async function loadDashboard() {
  requireAuth();
  renderUserBadge();
  setActiveNav();

  const { user_id } = getSession();
  const grid = document.getElementById("dashboard-cards");

  // Show loading state
  grid.innerHTML = `
    <div style="grid-column:1/-1">
      <div class="spinner"></div>
      <p class="loading-text">🤖 AI Agent is analysing your courses...</p>
    </div>`;

  try {
    const res = await fetch(`${API}/dashboard/${user_id}`);
    const data = await res.json();

    if (!data.courses || data.courses.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="icon">📚</div>
          <p>No courses yet. <a href="add_course.html">Add your first course</a> to get started!</p>
        </div>`;
      return;
    }

    grid.innerHTML = "";

    data.courses.forEach(course => {
      const risk = course.ai.risk.toLowerCase();
      const riskIcon = risk === "high" ? "🔴" : risk === "medium" ? "🟡" : "🟢";
      const pct = course.progress_pct;

      const deadlineStr = new Date(course.deadline).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
      });

      const dailyStr = course.daily_hours_needed !== null
        ? `${course.daily_hours_needed}h/day`
        : "⚠️ Deadline passed";

      grid.innerHTML += `
        <div class="course-card ${risk}">
          <h3>📖 ${course.course}</h3>

          <div class="stat-row">
            <span>Deadline</span>
            <span>${deadlineStr}</span>
          </div>
          <div class="stat-row">
            <span>Days Left</span>
            <span>${course.days_left > 0 ? course.days_left + " days" : "⚠️ Overdue"}</span>
          </div>
          <div class="stat-row">
            <span>Hours Studied</span>
            <span>${course.hours_studied}h / ${course.total_hours_required}h</span>
          </div>
          <div class="stat-row">
            <span>Hours Remaining</span>
            <span>${course.hours_remaining}h</span>
          </div>
          <div class="stat-row">
            <span>Daily Target</span>
            <span>${dailyStr}</span>
          </div>

          <div class="progress-bg">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--muted); margin-top:-6px;">
            <span>Progress</span>
            <span>${pct}%</span>
          </div>

          <span class="risk-badge ${risk}">${riskIcon} ${course.ai.risk} Risk</span>
          <p class="ai-summary">💬 ${course.ai.summary}</p>
        </div>`;
    });

  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">⚠️</div>
        <p>Could not load dashboard. Make sure the backend is running.</p>
      </div>`;
  }
}

window.onload = loadDashboard;
