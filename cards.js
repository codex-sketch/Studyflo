/* ==========================================================
   Flashcards: flip through cards, edit them, shuffle, delete.
   Needs storage.js, app.js and study.js loaded first.
   ========================================================== */

let cards = Store.get("cards", []);
let current = 0;
let flipped = false;

function saveCards() {
  Store.set("cards", cards);
  renderLibrary();
}

function renderCards() {
  $("cards-empty").hidden = cards.length > 0;
  $("cards-work").hidden = cards.length === 0;
  if (!cards.length) return;

  current = Math.min(current, cards.length - 1);
  const c = cards[current];

  $("face-front").textContent = c.front;
  $("face-back").textContent = c.back || "No explanation yet. Write one in the box next to the card.";
  $("deck-pos").textContent = "Card " + (current + 1) + " of " + cards.length;
  $("card-inner").classList.toggle("flipped", flipped);
  // Screen readers should only see the side that is showing
  $("face-front-box").setAttribute("aria-hidden", String(flipped));
  $("face-back-box").setAttribute("aria-hidden", String(!flipped));
  $("flipcard").setAttribute("aria-label", flipped ? "Showing the back. Press to see the front." : "Showing the front. Press to see the back.");

  $("edit-front").value = c.front;
  $("edit-back").value = c.back;
  $("edit-status").textContent = "";
}

function move(step) {
  if (!cards.length) return;
  current = (current + step + cards.length) % cards.length;
  flipped = false;
  renderCards();
}

function flip() {
  flipped = !flipped;
  renderCards();
}

$("flipcard").addEventListener("click", flip);
$("flip-btn").addEventListener("click", flip);
$("prev-btn").addEventListener("click", () => move(-1));
$("next-btn").addEventListener("click", () => move(1));

document.addEventListener("keydown", (e) => {
  if ($("view-cards").hidden || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === "ArrowLeft") move(-1);
  if (e.key === "ArrowRight") move(1);
});

$("shuffle-btn").addEventListener("click", () => {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  current = 0;
  flipped = false;
  saveCards();
  renderCards();
});

$("save-card").addEventListener("click", () => {
  const front = $("edit-front").value.trim();
  if (!front) {
    $("edit-status").textContent = "The front can't be empty.";
    return;
  }
  cards[current].front = front;
  cards[current].back = $("edit-back").value.trim();
  saveCards();
  renderCards();
  $("edit-status").textContent = "Card saved.";
});

$("delete-card").addEventListener("click", () => {
  if (!confirm("Delete this flashcard?")) return;
  cards.splice(current, 1);
  flipped = false;
  saveCards();
  renderCards();
});

// Reload from storage each time the screen opens, since Study may have added cards
window.addEventListener("hashchange", () => {
  if (location.hash === "#cards") {
    cards = Store.get("cards", []);
    renderCards();
  }
});

renderCards();
