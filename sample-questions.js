/* ==========================================================
   Sample questions, used until the AI step is connected.
   Each question: q (text), options (4 choices),
   answer (index of the right choice, starting at 0), why (explanation).
   ========================================================== */

const SAMPLE_QUESTIONS = [
  { q: "Which organelle makes most of a cell's ATP?", options: ["Nucleus", "Mitochondrion", "Ribosome", "Golgi apparatus"], answer: 1, why: "Mitochondria run cellular respiration, which produces most of the cell's ATP." },
  { q: "What gas do plants take in for photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], answer: 2, why: "Plants use carbon dioxide and water to build sugars, releasing oxygen." },
  { q: "What is the value of 7 x 8?", options: ["54", "56", "58", "64"], answer: 1, why: "7 x 8 = 56." },
  { q: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], answer: 2, why: "Mercury orbits closest to the Sun." },
  { q: "What is the chemical symbol for sodium?", options: ["So", "Na", "Sd", "S"], answer: 1, why: "Na comes from the Latin name natrium." },
  { q: "In computing, what does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Core Program Utility", "Central Program Update"], answer: 0, why: "The CPU is the main chip that runs instructions." },
  { q: "Which of these is a prime number?", options: ["21", "27", "29", "33"], answer: 2, why: "29 can only be divided evenly by 1 and itself." },
  { q: "What force pulls objects toward the Earth?", options: ["Magnetism", "Friction", "Gravity", "Tension"], answer: 2, why: "Gravity is the attraction between masses, and Earth's is strong." },
  { q: "Which part of speech describes a noun?", options: ["Verb", "Adjective", "Adverb", "Preposition"], answer: 1, why: "Adjectives describe nouns, like the 'red' in 'red car'." },
  { q: "What is the boiling point of water at sea level?", options: ["90 C", "100 C", "110 C", "120 C"], answer: 1, why: "Water boils at 100 degrees Celsius at standard sea-level pressure." },
  { q: "Who wrote the play Romeo and Juliet?", options: ["Charles Dickens", "Jane Austen", "William Shakespeare", "Mark Twain"], answer: 2, why: "Shakespeare wrote it in the 1590s." },
  { q: "Which study method means testing yourself instead of rereading?", options: ["Highlighting", "Active recall", "Skimming", "Copying notes"], answer: 1, why: "Active recall, like flashcards, strengthens memory better than rereading." },
  { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3, why: "The Pacific covers about a third of the planet's surface." },
  { q: "In HTML, which tag creates a hyperlink?", options: ["<link>", "<a>", "<href>", "<url>"], answer: 1, why: "The <a> (anchor) tag with an href attribute makes a link." },
  { q: "What is the square root of 144?", options: ["10", "11", "12", "14"], answer: 2, why: "12 x 12 = 144." },
  { q: "Which blood cells carry oxygen?", options: ["White blood cells", "Platelets", "Red blood cells", "Plasma"], answer: 2, why: "Red blood cells contain haemoglobin, which binds oxygen." },
  { q: "What is the main language used to style web pages?", options: ["CSS", "SQL", "Python", "XML"], answer: 0, why: "CSS controls colours, layout and fonts on web pages." },
  { q: "Which of these is a renewable energy source?", options: ["Coal", "Natural gas", "Solar", "Diesel"], answer: 2, why: "Solar power comes from sunlight, which is not used up." },
  { q: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], answer: 1, why: "Hex means six." },
  { q: "What does a thesis statement do in an essay?", options: ["Lists the sources", "States the main argument", "Thanks the reader", "Defines every term"], answer: 1, why: "It tells the reader the central point the essay will argue." },
];
