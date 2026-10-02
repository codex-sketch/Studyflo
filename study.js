/* ==========================================================
   Study: paste text, mark passages, turn them into flashcards.
   Needs storage.js and app.js loaded first.
   Saved in Store: "study" (the current text and its marks)
                   "cards" (all flashcards)
   ========================================================== */

const $ = (id) => document.getElementById(id);

let doc = Store.get("study", null); // { title, text, marks: [{ id, start, end, done }] }

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---------- Draw the screen ---------- */
function renderStudy() {
  $("study-setup").hidden = !!doc;
  $("study-work").hidden = !doc;
  if (!doc) return;

  $("reader-title").textContent = doc.title;

  // Rebuild the reader: plain text with <mark> around marked passages
  const reader = $("reader");
  reader.textContent = "";
  let pos = 0;
  [...doc.marks].sort((a, b) => a.start - b.start).forEach((m) => {
    if (m.start > pos) reader.append(doc.text.slice(pos, m.start));
    const el = document.createElement("mark");
    el.textContent = doc.text.slice(m.start, m.end);
    if (m.done) el.className = "done";
    reader.append(el);
    pos = m.end;
  });
  if (pos < doc.text.length) reader.append(doc.text.slice(pos));

  // Marked passages list
  const list = $("marks");
  list.textContent = "";
  doc.marks.forEach((m) => {
    const li = document.createElement("li");
    const box = document.createElement("div");
    const text = document.createElement("p");
    const full = doc.text.slice(m.start, m.end);
    text.textContent = full.length > 140 ? full.slice(0, 140) + "..." : full;
    box.append(text);
    if (m.done) {
      const tag = document.createElement("small");
      tag.textContent = "In flashcards";
      box.append(tag);
    }
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "link-btn";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", "Remove marked passage: " + text.textContent);
    remove.addEventListener("click", () => {
      doc.marks = doc.marks.filter((x) => x.id !== m.id);
      saveDoc();
      renderStudy();
    });
    li.append(box, remove);
    list.append(li);
  });

  $("mark-count").textContent = doc.marks.length;
  $("marks-hint").hidden = doc.marks.length > 0;
  $("make-cards").disabled = !doc.marks.some((m) => !m.done);
}

function saveDoc() {
  Store.set("study", doc);
}

/* ---------- Start and reset ---------- */
function loadText() {
  const text = $("study-text").value.replace(/\r\n/g, "\n").trim();
  if (!text) {
    $("study-status").textContent = "Paste some text first.";
    return;
  }
  doc = { title: $("study-title").value.trim() || "Untitled notes", text, marks: [] };
  saveDoc();
  $("study-status").textContent = "";
  $("make-status").textContent = "";
  renderStudy();
}

$("study-load").addEventListener("click", loadText);

$("study-open").addEventListener("click", () => $("study-file").click());
$("study-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  $("study-status").textContent = "Reading file...";
  try {
    $("study-text").value = await extractText(file);
    if (!$("study-title").value) $("study-title").value = file.name.replace(/\.[^.]+$/, "");
    $("study-status").textContent = "File loaded. Press Start studying.";
  } catch (err) {
    $("study-status").textContent = err.message;
  }
});

$("study-reset").addEventListener("click", () => {
  if (doc.marks.length && !confirm("Switch to different text? Your marks on this text will be removed. Flashcards you already made stay.")) return;
  doc = null;
  Store.set("study", null);
  $("study-text").value = "";
  renderStudy();
});

/* ---------- Marking ---------- */
// Work out where the current selection sits inside the text
function selectionRange() {
  const sel = getSelection();
  if (!doc || !sel.rangeCount || sel.isCollapsed) return null;
  const r = sel.getRangeAt(0);
  const reader = $("reader");
  if (!reader.contains(r.startContainer) || !reader.contains(r.endContainer)) return null;

  const before = document.createRange();
  before.selectNodeContents(reader);
  before.setEnd(r.startContainer, r.startOffset);
  let start = before.toString().length;
  let end = start + r.toString().length;

  // Trim spaces at the edges
  const raw = doc.text.slice(start, end);
  start += raw.length - raw.trimStart().length;
  end -= raw.length - raw.trimEnd().length;
  return end > start ? { start, end } : null;
}

document.addEventListener("selectionchange", () => {
  if (!$("study-work").hidden) $("mark-btn").disabled = !selectionRange();
});

// Keep the selection alive when the button is pressed
$("mark-btn").addEventListener("mousedown", (e) => e.preventDefault());
$("mark-btn").addEventListener("click", () => {
  const range = selectionRange();
  if (!range) return;
  if (doc.marks.some((m) => range.start < m.end && range.end > m.start)) {
    $("make-status").textContent = "That overlaps a passage you already marked. Remove it first, or select a different part.";
    return;
  }
  doc.marks.push({ id: newId(), start: range.start, end: range.end, done: false });
  saveDoc();
  getSelection().removeAllRanges();
  $("make-status").textContent = "";
  renderStudy();
});

/* ---------- Turn marks into flashcards ---------- */
$("make-cards").addEventListener("click", () => {
  const cards = Store.get("cards", []);
  let added = 0;
  doc.marks.filter((m) => !m.done).forEach((m) => {
    cards.push({ id: newId(), front: doc.text.slice(m.start, m.end), back: "", source: doc.title });
    m.done = true;
    added++;
  });
  Store.set("cards", cards);
  saveDoc();
  renderStudy();
  renderLibrary();
  $("make-status").textContent = added + (added === 1 ? " flashcard added." : " flashcards added.") + " Open Flashcards to review and add your explanations.";
});

renderStudy();
