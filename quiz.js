/* ==========================================================
   Quiz player: one question at a time, optional timer, score,
   and a review of what you missed.
   Needs storage.js, app.js, study.js and sample-questions.js.
   ========================================================== */

let quiz = null; // the quiz being played, or null
let timerId = null;

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function clock(seconds) {
  return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
}

// Checks that a question from the AI has the right shape
function validQuestion(x) {
  return x && typeof x.q === "string" && Array.isArray(x.options) && x.options.length === 4 &&
    x.options.every((o) => typeof o === "string") && Number.isInteger(x.answer) && x.answer >= 0 && x.answer < 4;
}

// Gets the questions: from the AI when there is a file and a server, otherwise samples
async function fetchQuestions(count, source) {
  const samples = () => shuffle([...SAMPLE_QUESTIONS]).slice(0, count);
  if (!source) return { questions: samples(), note: "" };
  if (!AI_ENDPOINT) return { questions: samples(), note: "The AI server isn't connected yet, so these are sample questions, not from your file." };

  let res;
  try {
    res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count, ...source }),
    });
  } catch (e) {
    throw new Error("Couldn't reach the quiz server. Check your internet connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "The quiz server had a problem. Try again.");

  const questions = (data.questions || []).filter(validQuestion).map((x) => ({ ...x, why: x.why || "" })).slice(0, count);
  if (!questions.length) throw new Error("The AI didn't return usable questions. Try again.");
  return { questions, note: "" };
}

/* ---------- Start ---------- */
async function startQuiz(title, source) {
  const s = Store.get("quizSettings", { count: 10, timer: false, minutes: 10 });
  const { questions, note } = await fetchQuestions(s.count, source);
  clearInterval(timerId);

  quiz = {
    title: title || "Sample quiz",
    questions,
    note,
    ended: false,
    answers: [],
    index: 0,
    checked: false,
    finished: false,
    timeUp: false,
    secondsLeft: s.timer ? s.minutes * 60 : null,
    startedAt: Date.now(),
    source,
  };
  if (s.timer) timerId = setInterval(tick, 1000);

  location.hash = "#quiz";
  renderQuiz();
}

function tick() {
  quiz.secondsLeft--;
  showTimer();
  if (quiz.secondsLeft <= 0) finishQuiz(true);
}

function showTimer() {
  const el = $("quiz-timer");
  el.hidden = quiz.secondsLeft === null;
  if (quiz.secondsLeft === null) return;
  el.textContent = clock(Math.max(0, quiz.secondsLeft));
  el.classList.toggle("low", quiz.secondsLeft <= 60);
  el.setAttribute("aria-label", "Time left " + clock(Math.max(0, quiz.secondsLeft)));
}

/* ---------- Draw the screen ---------- */
function renderQuiz() {
  $("quiz-idle").hidden = !!quiz;
  $("quiz-play").hidden = !quiz || quiz.finished;
  $("quiz-done").hidden = !quiz || !quiz.finished;

  if (!quiz) {
    const s = Store.get("quizSettings", { count: 10, timer: false, minutes: 10 });
    $("quiz-summary").textContent = s.count + " questions, " + (s.timer ? s.minutes + " minute timer." : "no timer.") + " You can change this when you upload a file.";
  } else if (quiz.finished) {
    renderResults();
  } else {
    renderQuestion();
  }
}

function renderQuestion() {
  const q = quiz.questions[quiz.index];
  const total = quiz.questions.length;

  $("quiz-pos").textContent = "Question " + (quiz.index + 1) + " of " + total;
  $("quiz-bar").style.width = (quiz.index / total) * 100 + "%";
  $("quiz-q").textContent = q.q;
  $("quiz-note").textContent = quiz.note;
  $("quiz-note").hidden = !quiz.note;
  showTimer();

  const box = $("quiz-options");
  box.textContent = "";
  q.options.forEach((text, i) => {
    const label = document.createElement("label");
    label.className = "opt";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "quiz-option";
    input.value = i;
    input.addEventListener("change", () => ($("quiz-check").disabled = false));
    const span = document.createElement("span");
    span.textContent = text;
    label.append(input, span);
    box.append(label);
  });

  quiz.checked = false;
  $("quiz-feedback").textContent = "";
  $("quiz-check").hidden = false;
  $("quiz-check").disabled = true;
  $("quiz-next").hidden = true;
}

/* ---------- Check an answer ---------- */
$("quiz-check").addEventListener("click", () => {
  const picked = document.querySelector('input[name="quiz-option"]:checked');
  if (!picked) return;
  const q = quiz.questions[quiz.index];
  const choice = +picked.value;
  quiz.answers[quiz.index] = choice;
  quiz.checked = true;

  document.querySelectorAll(".opt").forEach((label, i) => {
    label.querySelector("input").disabled = true;
    const tag = document.createElement("em");
    if (i === q.answer) {
      label.classList.add("correct");
      tag.textContent = "Correct answer";
      label.append(tag);
    } else if (i === choice) {
      label.classList.add("wrong");
      tag.textContent = "Your answer";
      label.append(tag);
    }
  });

  const fb = $("quiz-feedback");
  fb.textContent = "";
  const head = document.createElement("strong");
  head.textContent = choice === q.answer ? "Correct." : "Not quite.";
  const why = document.createElement("p");
  why.textContent = q.why;
  fb.append(head, why);

  const last = quiz.index === quiz.questions.length - 1;
  $("quiz-check").hidden = true;
  $("quiz-next").textContent = last ? "See results" : "Next question";
  $("quiz-next").hidden = false;
  $("quiz-next").focus();
});

$("quiz-next").addEventListener("click", () => {
  if (quiz.index === quiz.questions.length - 1) return finishQuiz(false);
  quiz.index++;
  renderQuestion();
  $("quiz-q").scrollIntoView({ block: "center" });
});

/* ---------- Finish and show results ---------- */
function finishQuiz(timeUp, ended) {
  clearInterval(timerId);
  quiz.finished = true;
  quiz.timeUp = timeUp;
  quiz.ended = !!ended;
  quiz.seconds = Math.round((Date.now() - quiz.startedAt) / 1000);

  const total = quiz.questions.length;
  quiz.score = quiz.questions.filter((q, i) => quiz.answers[i] === q.answer).length;
  quiz.pct = Math.round((quiz.score / total) * 100);

  // Show it in the Quizzes tab on Home
  const library = Store.get("library", []);
  library.unshift({ type: "quiz", title: quiz.title, meta: quiz.score + " of " + total + " correct", progress: quiz.pct });
  Store.set("library", library.slice(0, 30));
  renderLibrary();

  renderQuiz();
  $("view-quiz").querySelector("h1").focus();
}

function renderResults() {
  const total = quiz.questions.length;
  $("score-ring").style.setProperty("--pct", quiz.pct);
  $("score-pct").textContent = quiz.pct + "%";
  $("score-title").textContent = "You got " + quiz.score + " of " + total;
  $("score-detail").textContent = (quiz.timeUp ? "Time ran out. " : "") + (quiz.ended ? "You ended the quiz early. " : "") + "Time taken: " + clock(quiz.seconds) + ".";

  const list = $("quiz-review");
  list.textContent = "";
  let missed = 0;
  quiz.questions.forEach((q, i) => {
    if (quiz.answers[i] === q.answer) return;
    missed++;
    const li = document.createElement("li");
    const lines = [
      ["strong", q.q],
      ["p", quiz.answers[i] === undefined ? "Your answer: not answered" : "Your answer: " + q.options[quiz.answers[i]]],
      ["p", "Correct answer: " + q.options[q.answer]],
      ["p", q.why, "why"],
    ];
    lines.forEach(([tag, text, cls]) => {
      const el = document.createElement(tag);
      el.textContent = text;
      if (cls) el.className = cls;
      li.append(el);
    });
    list.append(li);
  });
  $("review-empty").hidden = missed > 0;
}

/* ---------- Buttons ---------- */
$("quiz-end").addEventListener("click", () => {
  if (confirm("End the quiz now? Questions you haven't answered will count as wrong.")) finishQuiz(false, true);
});
$("quiz-start").addEventListener("click", () => startQuiz("Sample quiz", null));
$("quiz-again").addEventListener("click", () => startQuiz(quiz.title, quiz.source));
$("quiz-home").addEventListener("click", () => {
  quiz = null;
  location.hash = "#home";
});
$("quiz-upload").addEventListener("click", () => chooseFile());

// Opening the Quiz tab after a finished quiz starts fresh
window.addEventListener("hashchange", () => {
  if (location.hash === "#quiz") renderQuiz();
});

renderQuiz();
