async function loadCourses() {
  requireAuth();
  renderUserBadge();
  setActiveNav();

  const { user_id } = getSession();
  const tbody = document.getElementById("courses-tbody");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--muted)">Loading...</td></tr>`;

  try {
    const res = await fetch(`${API}/courses/${user_id}`);
    const courses = await res.json();

    if (courses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--muted)">No courses yet. Add one above!</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    courses.forEach(c => {
      const deadline = new Date(c.deadline).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
      });
      tbody.innerHTML += `
        <tr>
          <td><strong>${c.course_name}</strong></td>
          <td>${c.total_hours_required}h</td>
          <td>${deadline}</td>
          <td>${c.course_id}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="removeCourse(${c.course_id}, '${c.course_name}')">
              🗑 Delete
            </button>
          </td>
        </tr>`;
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger)">Failed to load courses.</td></tr>`;
  }
}


async function addCourse() {
  const name = document.getElementById("course-name").value.trim();
  const hours = parseFloat(document.getElementById("total-hours").value);
  const deadline = document.getElementById("deadline").value;

  if (!name || !hours || !deadline) {
    showToast("Please fill all fields", "error");
    return;
  }

  const { user_id } = getSession();

  try {
    const res = await fetch(`${API}/courses/${user_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_name: name,
        total_hours_required: hours,
        deadline: deadline
      })
    });

    if (res.ok) {
      showToast(`✅ "${name}" added successfully!`, "success");
      document.getElementById("course-name").value = "";
      document.getElementById("total-hours").value = "";
      document.getElementById("deadline").value = "";
      loadCourses();
    } else {
      showToast("Failed to add course", "error");
    }
  } catch (err) {
    showToast("Network error", "error");
  }
}


async function removeCourse(courseId, courseName) {
  if (!confirm(`Delete "${courseName}"? This will also remove all its sessions.`)) return;

  const { user_id } = getSession();

  try {
    const res = await fetch(`${API}/courses/${user_id}/${courseId}`, { method: "DELETE" });
    if (res.ok) {
      showToast(`🗑 "${courseName}" deleted`, "success");
      loadCourses();
    } else {
      showToast("Failed to delete course", "error");
    }
  } catch (err) {
    showToast("Network error", "error");
  }
}


window.onload = loadCourses;
