const API = "http://localhost:8000";

// ── Session Helpers ───────────────────────────────────
function saveSession(data) {
  localStorage.setItem("sp_user_id", data.user_id);
  localStorage.setItem("sp_username", data.username);
  localStorage.setItem("sp_token", data.access_token);
}

function getSession() {
  return {
    user_id: localStorage.getItem("sp_user_id"),
    username: localStorage.getItem("sp_username"),
    token: localStorage.getItem("sp_token"),
  };
}

function clearSession() {
  localStorage.removeItem("sp_user_id");
  localStorage.removeItem("sp_username");
  localStorage.removeItem("sp_token");
}

function requireAuth() {
  const { user_id, token } = getSession();
  if (!user_id || !token) {
    window.location.href = "index.html";
  }
}

function logout() {
  clearSession();
  window.location.href = "index.html";
}

// ── Toast Notification ────────────────────────────────
function showToast(message, type = "success") {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `show ${type}`;
  setTimeout(() => { toast.className = ""; }, 3000);
}

// ── Render Header User Badge ──────────────────────────
function renderUserBadge() {
  const { username, user_id } = getSession();
  const el = document.getElementById("user-badge");
  if (el) el.textContent = `👤 ${username} (ID: ${user_id})`;
}

// ── Highlight Active Nav Link ─────────────────────────
function setActiveNav() {
  const page = window.location.pathname.split("/").pop();
  document.querySelectorAll("nav a").forEach(link => {
    if (link.getAttribute("href") === page) {
      link.classList.add("active");
    }
  });
}
