console.log("script loaded");

let cards = [];
let currentCard = null;
let flipped = false;

const cardDiv = document.getElementById("card");
const buttonsDiv = document.getElementById("answerButtons");
const directionSelect = document.getElementById("direction");

const STORAGE_KEY = "flashcardProgress";

// Load CSV
fetch("cards.csv")
  .then(res => res.text())
  .then(text => {
    console.log("CSV fetched");
    init(parseCSV(text));
    updateProgress();
  });

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines
    .shift()
    .split(",")
    .map(h => h.trim().toLowerCase());


  return lines.map(line => {
    const values = [];
    let current = "";
    let insideQuotes = false;

    for (let char of line) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || "").trim();
    });
    return obj;
  });
}


function init(csvCards) {
  console.log("init called");
  console.log("First card object:", csvCards[0]);
  const progress = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  cards = csvCards.map(c => {
    const id = `${c.french}|${c.english}`;
    return {
      ...c,
      id,
      attempts: progress[id] || []
    };
  });

  nextCard();
}

const progressText = document.getElementById("progressText");

function updateProgress() {
  let learned = 0;
  let learning = 0;

  cards.forEach(card => {
    if (isLearned(card)) {
      learned++;
    } else {
      learning++;
    }
  });

  progressText.textContent = `Learning: ${learning} | Learned: ${learned}`;
}

function nextCard() {
  console.log("nextCard called");
  flipped = false;
  buttonsDiv.style.display = "none";

  // Optional: filter out learned cards
  const learningCards = cards.filter(c => !isLearned(c));
  const pool = learningCards.length ? learningCards : cards;

  currentCard = pool[Math.floor(Math.random() * pool.length)];
  showFront();
}


function showFront() {
  const dir = directionSelect.value;
  const text =
    dir === "en-fr" ? currentCard.english : currentCard.french;

  renderCard(text);
}


function showBack() {
  const dir = directionSelect.value;
  const text =
    dir === "en-fr" ? currentCard.french : currentCard.english;

  renderCard(text);
}




cardDiv.addEventListener("click", () => {
  if (!flipped) {
    flipped = true;
    showBack();
    buttonsDiv.style.display = "block";
  }
});

function markAnswer(correct) {
  currentCard.attempts.push(correct);
  currentCard.attempts = currentCard.attempts.slice(-5);

  saveProgress();
  updateProgress();
  nextCard();
}

function saveProgress() {
  const progress = {};
  cards.forEach(c => progress[c.id] = c.attempts);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function isLearned(card) {
  if (card.attempts.length < 5) return false;
  return card.attempts.slice(-5).every(a => a === true);
}


const resetBtn = document.getElementById("resetBtn");

resetBtn.addEventListener("click", () => {
  if (!confirm("Are you sure you want to reset all progress?")) return;

  // Clear localStorage
  localStorage.removeItem("flashcardProgress");

  // Reset attempts in memory
  cards.forEach(card => card.attempts = []);

  // Update progress display
  updateProgress();

  // Show a new card
  nextCard();
});

// Whenever the user changes direction, update the current card immediately
directionSelect.addEventListener("change", () => {
  flipped = false;                // reset flip state
  showFront();                    // show front in the new direction
  buttonsDiv.style.display = "none"; // hide correct/incorrect buttons
});



function renderCard(text) {
  const category = currentCard.category || "";

  cardDiv.innerHTML = `
    <div>${text}</div>
    ${category ? `<div class="category-label">${category}</div>` : ""}
  `;

  // Reset to default styles
  cardDiv.style.backgroundImage = "";
  cardDiv.style.border = "";
}







const markLearnedBtn = document.getElementById("markLearnedBtn");

markLearnedBtn.addEventListener("click", () => {
  // Set attempts to 5 correct entries
  currentCard.attempts = [true, true, true, true, true];

  // Save to localStorage
  saveProgress();

  // Update the learned/learning counters
  updateProgress();

  // Move to next card
  nextCard();
});


