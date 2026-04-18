const API = "https://taskflow-backend-1of3.onrender.com";
let token = localStorage.getItem("token") || null;
let currentFilter = null;
let currentPage = 1;
const PAGE_LIMIT = 5;

// --- Init ---
window.onload = () => {
  if (token) showTasks();
};

// --- Auth toggle ---
function toggleAuth() {
  document.getElementById("login-box").classList.toggle("hidden");
  document.getElementById("register-box").classList.toggle("hidden");
}

// --- Register ---
async function register() {
  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const errEl = document.getElementById("reg-error");
  errEl.textContent = "";

  const res = await fetch(`${API}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json();
  if (!res.ok) { errEl.textContent = data.detail || "Registration failed"; return; }

  errEl.style.color = "green";
  errEl.textContent = "Registered! Please login.";
  toggleAuth();
}

// --- Login ---
async function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error");
  errEl.textContent = "";

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) { errEl.textContent = data.detail || "Login failed"; return; }

  token = data.access_token;
  localStorage.setItem("token", token);
  localStorage.setItem("username", username);
  showTasks();
}

// --- Logout ---
function logout() {
  token = null;
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  document.getElementById("auth-section").classList.remove("hidden");
  document.getElementById("task-section").classList.add("hidden");
}

// --- Show task section ---
function showTasks() {
  document.getElementById("auth-section").classList.add("hidden");
  document.getElementById("task-section").classList.remove("hidden");
  const username = localStorage.getItem("username");
  if (username) document.getElementById("welcome-msg").textContent = `Hi, ${username}`;
  loadTasks(null);
}

// --- Load tasks ---
async function loadTasks(completed) {
  currentFilter = completed;
  currentPage = 1;
  updateFilterButtons(completed);
  await fetchAndRender();
}

async function fetchAndRender() {
  let url = `${API}/tasks?page=${currentPage}&limit=${PAGE_LIMIT}`;
  if (currentFilter !== null) url += `&completed=${currentFilter}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) { logout(); return; }

  const data = await res.json();
  renderTasks(data.tasks);
  renderPagination(data.total, data.page, data.limit);
  updateStats(data.total);
}

async function updateStats(filteredTotal) {
  const [allRes, doneRes] = await Promise.all([
    fetch(`${API}/tasks?page=1&limit=1`, { headers: { Authorization: `Bearer ${token}` } }),
    fetch(`${API}/tasks?page=1&limit=1&completed=true`, { headers: { Authorization: `Bearer ${token}` } }),
  ]);
  if (!allRes.ok || !doneRes.ok) return;
  const allData  = await allRes.json();
  const doneData = await doneRes.json();
  const total    = allData.total;
  const done     = doneData.total;
  document.getElementById("stat-total").textContent   = total;
  document.getElementById("stat-pending").textContent = total - done;
  document.getElementById("stat-done").textContent    = done;

  // Show username from token once
  if (!document.getElementById("welcome-msg").textContent) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      // sub is user id; just show a generic greeting — username not in token payload
      document.getElementById("welcome-msg").textContent = "My Tasks";
    } catch {}
  }
}

function renderTasks(tasks) {
  const list = document.getElementById("task-list");
  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No tasks here. Add one above!</p>
      </div>`;
    return;
  }

  list.innerHTML = tasks.map(t => `
    <div class="task-item ${t.completed ? "done" : ""}" id="task-${t.id}">
      <div class="task-header">
        <span class="task-title">${escHtml(t.title)}</span>
        <span class="badge ${t.completed ? "badge-done" : "badge-pending"}">
          ${t.completed ? "✓ Completed" : "● Pending"}
        </span>
      </div>
      ${t.description ? `<p class="task-desc">${escHtml(t.description)}</p>` : ""}
      <p class="task-meta">Created ${new Date(t.created_at).toLocaleString()}</p>
      <div class="task-actions">
        ${!t.completed
          ? `<button class="btn-success" onclick="markDone(${t.id})">Mark Complete</button>`
          : `<button class="btn-secondary" onclick="markUndone(${t.id})">Mark Pending</button>`
        }
        <button class="btn-danger" onclick="deleteTask(${t.id})">Delete</button>
      </div>
    </div>
  `).join("");
}

function renderPagination(total, page, limit) {
  const pages = Math.ceil(total / limit);
  const el = document.getElementById("pagination");
  if (pages <= 1) { el.innerHTML = ""; return; }

  el.innerHTML = Array.from({ length: pages }, (_, i) => i + 1)
    .map(p => `<button class="${p === page ? "active" : ""}" onclick="goPage(${p})">${p}</button>`)
    .join("");
}

async function goPage(p) {
  currentPage = p;
  await fetchAndRender();
}

// --- Create task ---
async function createTask() {
  const title = document.getElementById("task-title").value.trim();
  const description = document.getElementById("task-desc").value.trim();
  const errEl = document.getElementById("task-error");
  errEl.textContent = "";

  if (!title) { errEl.textContent = "Title is required."; return; }

  const res = await fetch(`${API}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, description: description || null }),
  });

  if (!res.ok) { const d = await res.json(); errEl.textContent = d.detail || "Error"; return; }

  document.getElementById("task-title").value = "";
  document.getElementById("task-desc").value = "";
  await fetchAndRender();
}

// --- Mark complete / pending ---
async function markDone(id) {
  await updateTask(id, { completed: true });
}

async function markUndone(id) {
  await updateTask(id, { completed: false });
}

async function updateTask(id, body) {
  await fetch(`${API}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  await fetchAndRender();
}

// --- Delete task ---
async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  await fetch(`${API}/tasks/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await fetchAndRender();
}

// --- Helpers ---
function updateFilterButtons(completed) {
  document.getElementById("filter-all").classList.toggle("active", completed === null);
  document.getElementById("filter-pending").classList.toggle("active", completed === false);
  document.getElementById("filter-done").classList.toggle("active", completed === true);
}

function escHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
