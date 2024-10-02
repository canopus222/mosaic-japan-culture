const submitGuessButton = document.getElementById("submitGuessButton");
const guessInput = document.getElementById("guessInput");
const canvas = document.getElementById("canvas");
const cluesDiv = document.getElementById("clues");
const resultText = document.getElementById("resultText");
const nextButton = document.getElementById("nextButton");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
let img = new Image();
let originalImageData;
let pixelSize = 20;
let clueNumber = 1;
let questions = [];
let currentQuestion = {};
let unusedQuestionIndices = [];

// Load questions from JSON file
async function loadQuestions() {
  const response = await fetch("questions.json");
  questions = await response.json();
  initializeQuestionIndices();
  selectRandomQuestion();
}

// Initialize the array with all question indices
function initializeQuestionIndices() {
  unusedQuestionIndices = questions.map((_, top) => top);
}

// Select a random question from the JSON data
function selectRandomQuestion() {
  if (unusedQuestionIndices.length === 0) {
    initializeQuestionIndices();
  }
  
  const randomTop = Math.floor(Math.random() * unusedQuestionIndices.length);
  const questionTop = unusedQuestionIndices.splice(randomTop, 1)[0];
  
  currentQuestion = questions[questionTop];
  clueNumber = 1;
  loadImage(currentQuestion.imageURL);
}

// Load the selected image and initialize the game state
function loadImage(url) {
  img = new Image();
  img.src = url;
  img.crossOrigin = "Anonymous"; // Enable cross-origin loading
  img.onload = function () {
    // 画像の幅と高さを500に固定
    canvas.width = 500;
    canvas.height = 500;
    // 画像を500x500の領域に収まるように描画
    ctx.drawImage(img, 0, 0, 500, 500);
    originalImageData = ctx.getImageData(0, 0, 500, 500); // 幅と高さを500に設定
    pixelSize = 20; // Reset pixel size
    pixelateImage(pixelSize);
    clearClues(); // Clear old clues
    resultText.textContent = ""; // Clear result text
    guessInput.value = ""; // Clear the guess input field
    addClue(`${clueNumber}. ${currentQuestion.clues[clueNumber - 1]}`); // Show the first clue
  };
  nextButton.style.display = "none"; // Hide next button until next guess
}

// Pixelate the image
function pixelateImage(size) {
  ctx.putImageData(originalImageData, 0, 0); // Reset the image to the original
  for (let y = 0; y < canvas.height; y += size) {
    for (let x = 0; x < canvas.width; x += size) {
      const p = ctx.getImageData(x, y, size, size).data;
      const r = p[0],
        g = p[1],
        b = p[2];
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, size, size);
    }
  }
}

// Unpixelate the image by 50%
function unpixelateBy50Percent() {
  if (pixelSize > 1) {
    pixelSize = Math.floor(pixelSize / 2);
    pixelateImage(pixelSize);
  }
}

// Gradually unpixelate the image
function gradualUnpixelate() {
  let size = pixelSize; // Start with the current pixel size
  const interval = setInterval(() => {
    if (size <= 1) {
      clearInterval(interval);
      ctx.putImageData(originalImageData, 0, 0); // Reset to original image data
      nextButton.style.display = "block";
    } else {
      pixelateImage(size);
      size = Math.max(size - 1, 1); // Ensure size does not go below 1
    }
  }, 200);
}

// Add a clue to the cluesDiv
function addClue(text) {
  const clueElement = document.createElement("div");
  clueElement.className = "clue";
  clueElement.textContent = text;
  cluesDiv.appendChild(clueElement);
}

// Clear all clues from the cluesDiv except the button-container
function clearClues() {
  while (
    cluesDiv.firstChild &&
    cluesDiv.firstChild !== document.querySelector(".button-container")
  ) {
    cluesDiv.removeChild(cluesDiv.firstChild);
  }
}

// Handle the submit guess button click
function handleSubmitGuess() {
  const userGuess = guessInput.value.trim().toLowerCase();

  // Check if the user's guess matches the correct name or any of the alternate answers
  const correctName = currentQuestion.name.toLowerCase();
  const alternateAnswers = (currentQuestion.alternates || []).map((a) =>
    a.toLowerCase()
  );

  if (userGuess === correctName || alternateAnswers.includes(userGuess)) {
    gradualUnpixelate();
    resultText.textContent = "Congratulations! You guessed it right!";
    clearClues(); // Clear clues when the next button is shown
  } else {
    unpixelateBy50Percent();
    clueNumber++;
    if (clueNumber <= currentQuestion.clues.length) {
      addClue(`${clueNumber}. ${currentQuestion.clues[clueNumber - 1]}`);
    } else {
      gradualUnpixelate();
      resultText.textContent = `The correct answer was ${currentQuestion.name}.`;
      clearClues();
    }
  }
}

// Attach the handleSubmitGuess function to the submit button click event
submitGuessButton.addEventListener("click", handleSubmitGuess);

// Attach the handleSubmitGuess function to the Enter key press event on the input field
guessInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    handleSubmitGuess();
  }
});

// Handle the next button click
nextButton.addEventListener("click", function () {
  clues.textContent = ""; // Clear result text
  selectRandomQuestion();
});

// Load questions on page load
loadQuestions();
