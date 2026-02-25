// ── Timer State ───────────────────────────────────────────────
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;
let timerCourseId = null;
let timerCourseName = "";


// ── Page Init ─────────────────────────────────────────────────
async function loadSessionPage() {
  requireAuth();
  renderUserBadge();
  setActiveNav();

  // Both run independently — one failure won't block the other
  await populateCourseDropdown();
  loadRecentSessions();
}


// ── Shared Course Dropdown Loader ─────────────────────────────
// Populates both the manual log dropdown AND the timer dropdown
async function populateCourseDropdown() {
  const { user_id } = getSession();
  const selects = [
    document.getElementById("course-select"),
    document.getElementById("timer-course-select")
  ];

  selects.forEach(s => {
    s.innerHTML = `<option value="">Loading...</option>`;
    s.disabled = true;
  });

  try {
    const res = await fetch(`${API}/courses/${user_id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const courses = await res.json();

    if (!Array.isArray(courses) || courses.length === 0) {
      selects.forEach(s => {
        s.innerHTML = `<option value="">No courses found — add one first</option>`;
        s.disabled = true;
      });
      return;
    }

    selects.forEach(s => {
      s.innerHTML = `<option value="">-- Select a course --</option>`;
      courses.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.course_id;
        opt.textContent = c.course_name;
        s.appendChild(opt);
      });
      s.disabled = false;
    });

  } catch (err) {
    console.error("Dropdown error:", err);
    selects.forEach(s => {
      s.innerHTML = `<option value="">Failed to load courses</option>`;
      s.disabled = true;
    });
    showToast("Could not load courses. Is the backend running?", "error");
  }
}


// ── Tab Switching ─────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById("tab-manual").classList.toggle("active", tab === "manual");
  document.getElementById("tab-timer").classList.toggle("active", tab === "timer");
  document.getElementById("panel-manual").style.display = tab === "manual" ? "block" : "none";
  document.getElementById("panel-timer").style.display = tab === "timer" ? "block" : "none";
}


// ── Timer Functions ───────────────────────────────────────────
function formatTime(secs) {
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function startTimer() {
  const select = document.getElementById("timer-course-select");
  const courseId = select.value;
  const courseName = select.options[select.selectedIndex]?.text;

  if (!courseId) {
    showToast("Please select a course before starting the timer", "error");
    return;
  }

  timerCourseId = courseId;
  timerCourseName = courseName;
  timerRunning = true;

  // Lock the dropdown while timer is running
  select.disabled = true;

  // Update UI to running state
  document.getElementById("start-btn").style.display = "none";
  document.getElementById("stop-btn").style.display = "inline-flex";
  document.getElementById("timer-course-select").classList.add("timer-locked");
  document.getElementById("timer-display").classList.add("running");
  document.getElementById("timer-status").textContent = `⏱ Studying: ${courseName}`;
  document.getElementById("timer-status").style.color = "var(--success)";

  // Tick every second
  timerInterval = setInterval(() => {
    timerSeconds++;
    document.getElementById("timer-display").textContent = formatTime(timerSeconds);

    // Pulse effect every minute
    if (timerSeconds % 60 === 0) {
      document.getElementById("timer-display").classList.add("pulse");
      setTimeout(() => document.getElementById("timer-display").classList.remove("pulse"), 600);
    }
  }, 1000);
}

function stopTimer() {
  if (!timerRunning) return;

  clearInterval(timerInterval);
  timerRunning = false;

  const totalSeconds = timerSeconds;
  const hours = parseFloat((totalSeconds / 3600).toFixed(4));

  // Update UI to stopped state
  document.getElementById("start-btn").style.display = "inline-flex";
  document.getElementById("stop-btn").style.display = "none";
  document.getElementById("timer-status").textContent = `✅ Session ended — ${formatTime(totalSeconds)} recorded`;
  document.getElementById("timer-status").style.color = "var(--primary)";
  document.getElementById("timer-display").classList.remove("running");

  // Pre-fill the confirm panel
  document.getElementById("timer-course-select").disabled = false;
  document.getElementById("confirm-panel").style.display = "block";
  document.getElementById("confirm-course").textContent = timerCourseName;
  document.getElementById("confirm-time").textContent = `${formatTime(totalSeconds)} (${hours}h)`;
  document.getElementById("timer-notes").value = "";

  // Store hours for submission
  document.getElementById("confirm-panel").dataset.hours = hours;
  document.getElementById("confirm-panel").dataset.courseId = timerCourseId;
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = 0;
  timerCourseId = null;
  timerCourseName = "";

  document.getElementById("timer-display").textContent = "00:00:00";
  document.getElementById("timer-display").classList.remove("running");
  document.getElementById("timer-status").textContent = "Select a course and press Start";
  document.getElementById("timer-status").style.color = "var(--muted)";
  document.getElementById("start-btn").style.display = "inline-flex";
  document.getElementById("stop-btn").style.display = "none";
  document.getElementById("confirm-panel").style.display = "none";
  document.getElementById("timer-course-select").disabled = false;
}

async function saveTimerSession() {
  const panel = document.getElementById("confirm-panel");
  const hours = parseFloat(panel.dataset.hours);
  const courseId = parseInt(panel.dataset.courseId);
  const notes = document.getElementById("timer-notes").value.trim();
  const { user_id } = getSession();

  if (!hours || hours <= 0) {
    showToast("Timer was too short to log (less than 1 second)", "error");
    return;
  }

  const saveBtn = document.getElementById("save-timer-btn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const res = await fetch(`${API}/sessions/${user_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: courseId,
        hours_studied: hours,
        notes: notes || null
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const hoursDisplay = hours < 0.017
      ? `${timerSeconds}s`
      : `${(hours * 60).toFixed(1)} min`;

    showToast(`✅ Session saved — ${hoursDisplay} for ${timerCourseName}`, "success");
    resetTimer();
    loadRecentSessions();

  } catch (err) {
    console.error("Save timer session error:", err);
    showToast("Failed to save session. Try again.", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "💾 Save Session";
  }
}


// ── Manual Log ────────────────────────────────────────────────
async function logSession() {
  const select = document.getElementById("course-select");
  const courseId = select.value;
  const hoursInput = document.getElementById("hours-input");
  const notesInput = document.getElementById("notes-input");
  const hours = parseFloat(hoursInput.value);
  const notes = notesInput.value.trim();

  if (!courseId) { showToast("Please select a course", "error"); return; }
  if (!hours || isNaN(hours) || hours <= 0) { showToast("Enter valid hours (greater than 0)", "error"); return; }

  const { user_id } = getSession();
  const btn = document.getElementById("log-btn");
  btn.disabled = true;
  btn.textContent = "Logging...";

  try {
    const res = await fetch(`${API}/sessions/${user_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: parseInt(courseId),
        hours_studied: hours,
        notes: notes || null
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    showToast(`✅ ${hours}h logged successfully!`, "success");
    select.value = "";
    hoursInput.value = "";
    notesInput.value = "";
    loadRecentSessions();

  } catch (err) {
    console.error("Log session error:", err);
    showToast("Failed to log session. Try again.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Log Session →";
  }
}


// ── Session History Table ─────────────────────────────────────
async function loadRecentSessions() {
  const { user_id } = getSession();
  const tbody = document.getElementById("sessions-tbody");

  tbody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align:center; color:var(--muted); padding:20px;">
        Loading sessions...
      </td>
    </tr>`;

  try {
    const [sessRes, courseRes] = await Promise.all([
      fetch(`${API}/sessions/${user_id}`),
      fetch(`${API}/courses/${user_id}`)
    ]);

    if (!sessRes.ok) throw new Error(`Sessions fetch failed: HTTP ${sessRes.status}`);
    if (!courseRes.ok) throw new Error(`Courses fetch failed: HTTP ${courseRes.status}`);

    const sessions = await sessRes.json();
    const courses = await courseRes.json();

    const courseMap = {};
    courses.forEach(c => { courseMap[c.course_id] = c.course_name; });

    if (!Array.isArray(sessions) || sessions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; color:var(--muted); padding:30px;">
            No sessions logged yet. Log your first session above!
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = "";
    sessions.slice(0, 20).forEach(s => {
      const dateStr = s.session_date
        ? new Date(s.session_date).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
          })
        : "—";

      const courseName = courseMap[s.course_id] || `Course #${s.course_id}`;
      const notesCell = s.notes
        ? `<span title="${s.notes}">${s.notes.length > 40 ? s.notes.slice(0, 40) + "…" : s.notes}</span>`
        : `<span style="color:var(--muted)">—</span>`;

      const hoursDisplay = s.hours_studied < 0.017
        ? `${Math.round(s.hours_studied * 3600)}s`
        : s.hours_studied < 1
        ? `${(s.hours_studied * 60).toFixed(0)}m`
        : `${s.hours_studied}h`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dateStr}</td>
        <td><strong>${courseName}</strong></td>
        <td><strong>${hoursDisplay}</strong></td>
        <td>${notesCell}</td>
        <td><span style="font-size:0.75rem; color:var(--muted)">#${s.session_id}</span></td>`;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Load sessions error:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="color:var(--danger); text-align:center; padding:20px;">
          ⚠️ Failed to load sessions — check the browser console for details.
        </td>
      </tr>`;
  }
}


window.onload = loadSessionPage;
