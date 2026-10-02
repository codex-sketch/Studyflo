/* ==========================================================
   App shell: routing, theme, sidebar, profile.
   Needs storage.js loaded first.
   ========================================================== */

const VIEWS = ["home", "quiz", "study", "cards", "review", "profile"];

/* ---------- Routing (hash based: #home, #quiz ...) ---------- */
function showView() {
  const name = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";

  document.querySelectorAll(".view").forEach((v) => {
    v.hidden = v.id !== "view-" + name;
  });

  document.querySelectorAll(".nav-list a").forEach((a) => {
    if (a.dataset.view === name) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  const view = document.getElementById("view-" + name);
  document.title = view.dataset.title + " | StudyFlo";

  // Move focus to the heading so screen readers announce the new page
  view.querySelector("h1").focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

/* ---------- Theme ---------- */
const themeBtn = document.getElementById("theme-btn");

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  document.getElementById("theme-icon").setAttribute("href", isDark ? "#i-sun" : "#i-moon");
  document.getElementById("theme-label").textContent = isDark ? "Light mode" : "Dark mode";
  themeBtn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#0a1020" : "#f6f8fc";
}

themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  Store.set("theme", next);
  applyTheme(next);
});

/* ---------- Sidebar collapse (laptops only) ---------- */
const collapseBtn = document.getElementById("collapse-btn");

function applyCollapse(collapsed) {
  document.body.classList.toggle("collapsed", collapsed);
  collapseBtn.setAttribute("aria-pressed", String(collapsed));
  collapseBtn.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
}

collapseBtn.addEventListener("click", () => {
  const collapsed = !document.body.classList.contains("collapsed");
  Store.set("collapsed", collapsed);
  applyCollapse(collapsed);
});

/* ---------- Profile ---------- */
const nameInput = document.getElementById("name-input");
const nameStatus = document.getElementById("name-status");

function renderGreeting() {
  const name = Store.get("name", "");
  document.getElementById("greeting").textContent = name ? "Welcome back, " + name : "Welcome to StudyFlo";
  nameInput.value = name;

}

document.getElementById("name-save").addEventListener("click", () => {
  const saved = Store.set("name", nameInput.value.trim());
  nameStatus.textContent = saved ? "Name saved." : "Could not save. Your browser may be blocking storage.";
  renderGreeting();
});

document.getElementById("reset-btn").addEventListener("click", () => {
  if (!confirm("Erase everything StudyFlo saved on this device?")) return;
  Store.clearAll();
  location.reload(); // start fresh so every screen forgets old data
  return;
  applyTheme(matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  applyCollapse(false);
  renderGreeting();
  renderLibrary();
  nameStatus.textContent = "All data erased.";
});

/* ---------- Upload ---------- */
const fileInput = document.getElementById("file-input");
const dropzone = document.getElementById("dropzone");
let pendingFile = null; // the file chosen on the home screen

function fileKind(file) {
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return { label: "PDF", color: "var(--t-pdf)", icon: "#i-file" };
  if (n.endsWith(".doc") || n.endsWith(".docx")) return { label: "Word document", color: "var(--t-docx)", icon: "#i-file" };
  if (file.type.startsWith("image/")) return { label: "Image", color: "var(--t-img)", icon: "#i-image" };
  return { label: "Text file", color: "var(--t-txt)", icon: "#i-file" };
}

function fmtSize(bytes) {
  return bytes > 1048576 ? (bytes / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";
}

function iconTile(kind) {
  const box = document.createElement("div");
  box.className = "lib-icon";
  box.style.background = kind.color;
  box.innerHTML = '<svg class="icon"><use href="' + kind.icon + '"/></svg>';
  return box;
}

function chooseFile(accept) {
  fileInput.accept = accept || ".pdf,.doc,.docx,.txt,.md,image/*";
  fileInput.click();
}

function takeFile(file) {
  if (!file) return;
  pendingFile = file;
  renderFileCard();
  location.hash = "#review";
}

document.querySelectorAll(".tile").forEach((t) => t.addEventListener("click", () => chooseFile(t.dataset.accept)));
document.getElementById("fab-upload").addEventListener("click", () => chooseFile());
fileInput.addEventListener("change", () => { takeFile(fileInput.files[0]); fileInput.value = ""; });

["dragover", "dragenter"].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) => dropzone.addEventListener(ev, () => dropzone.classList.remove("over")));
dropzone.addEventListener("drop", (e) => { e.preventDefault(); takeFile(e.dataTransfer.files[0]); });

/* ---------- Confirm study set ---------- */
function renderFileCard() {
  const card = document.getElementById("file-card");
  card.textContent = "";
  if (!pendingFile) {
    const msg = document.createElement("div");
    msg.innerHTML = "<h2>No file chosen</h2><p>Pick a file to continue.</p>";
    const btn = document.createElement("button");
    btn.className = "btn"; btn.type = "button"; btn.textContent = "Choose a file";
    btn.addEventListener("click", () => chooseFile());
    msg.append(btn);
    card.append(msg);
    return;
  }
  const kind = fileKind(pendingFile);
  const info = document.createElement("div");
  const name = document.createElement("strong");
  const meta = document.createElement("small");
  name.textContent = pendingFile.name;
  meta.textContent = kind.label + ", " + fmtSize(pendingFile.size);
  info.append(name, meta);
  card.append(iconTile(kind), info);
}

const qCount = document.getElementById("q-count");
const qTimer = document.getElementById("q-timer");
const qMinutes = document.getElementById("q-minutes");

function saveQuizSettings() {
  document.getElementById("q-out").textContent = qCount.value;
  document.getElementById("timer-wrap").hidden = !qTimer.checked;
  Store.set("quizSettings", { count: +qCount.value, timer: qTimer.checked, minutes: +qMinutes.value });
}

const savedQuiz = Store.get("quizSettings", { count: 10, timer: false, minutes: 10 });
qCount.value = savedQuiz.count;
qTimer.checked = savedQuiz.timer;
qMinutes.value = savedQuiz.minutes;
[qCount, qTimer, qMinutes].forEach((el) => el.addEventListener("input", saveQuizSettings));
saveQuizSettings();

document.getElementById("create-btn").addEventListener("click", async () => {
  const status = document.getElementById("create-status");
  const button = document.getElementById("create-btn");
  if (!pendingFile) {
    status.textContent = "Choose a file first.";
    return;
  }
  button.disabled = true;
  try {
    status.textContent = "Reading your file...";
    const source = await extractSource(pendingFile);
    status.textContent = AI_ENDPOINT ? "Writing your questions. This can take up to a minute..." : "Starting...";
    await startQuiz(pendingFile.name.replace(/\.[^.]+$/, ""), source);
    status.textContent = "";
  } catch (err) {
    status.textContent = err.message;
  }
  button.disabled = false;
});

/* ---------- Library (Recent / Flash Cards / Quizzes / Tests) ---------- */
const EMPTY_TEXT = {
  recent: "Nothing here yet. Upload a file to make your first study set.",
  cards: "No flashcards yet. Highlight text in Study to create some.",
  quiz: "No quizzes yet.",
  test: "No tests yet.",
};
const TYPE_STYLE = { cards: ["var(--t-docx)", "#i-study"], quiz: ["var(--t-img)", "#i-quiz"], test: ["var(--t-txt)", "#i-file"] };
let activeTab = "recent";

function renderLibrary() {
  const list = document.getElementById("lib-list");
  const saved = Store.get("library", []);
  const n = Store.get("cards", []).length;
  const all = n ? [{ type: "cards", title: "Flashcards", meta: n + (n === 1 ? " card" : " cards") }, ...saved] : saved;
  const items = all.filter((it) => activeTab === "recent" || it.type === activeTab);
  list.textContent = "";
  items.forEach((it) => {
    const [color, icon] = TYPE_STYLE[it.type] || TYPE_STYLE.test;
    const li = document.createElement("li");
    li.className = "lib-item";
    const body = document.createElement("div");
    body.className = "lib-body";
    const title = document.createElement("strong");
    const meta = document.createElement("small");
    title.textContent = it.title;
    meta.textContent = it.meta || "";
    body.append(title, meta);
    if (typeof it.progress === "number") body.insertAdjacentHTML("beforeend", '<div class="bar"><i style="width:' + Math.min(100, it.progress) + '%"></i></div>');
    li.append(iconTile({ color, icon }), body);
    list.append(li);
  });
  document.getElementById("lib-empty").textContent = items.length ? "" : EMPTY_TEXT[activeTab];
}

document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
  activeTab = b.dataset.tab;
  document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
  renderLibrary();
}));

/* ---------- Start ---------- */
applyTheme(document.documentElement.dataset.theme);
applyCollapse(Store.get("collapsed", false));
renderGreeting();
renderLibrary();
renderFileCard();
window.addEventListener("hashchange", showView);
showView();
