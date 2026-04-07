// ===== Stash or Splash – Game Engine =====

const SEASONS = 4;
const POCKET_MONEY = 10;
const STASH_INTEREST = 0.5;
const CHORE_BASE = 3;
const STARTING_SPLASH = 10;

// ===== Chance Events =====
const CHANCE_EVENTS = [
  { text: "Birthday money from Grandma!", amount: 10, icon: "🎂" },
  { text: "Found a £5 note on the ground!", amount: 5, icon: "🍀" },
  { text: "Won a scratch card!", amount: 8, icon: "🎰" },
  { text: "Got paid for helping a neighbour.", amount: 6, icon: "🏡" },
  { text: "Sold old toys at a car boot sale!", amount: 7, icon: "🧸" },
  { text: "Prize money from a school competition!", amount: 12, icon: "🏆" },
  { text: "Granny slipped you a fiver at dinner!", amount: 5, icon: "👵" },
  { text: "Refund from a returned item!", amount: 4, icon: "📦" },
  { text: "Oh no — you broke a window! Pay for repairs.", amount: -8, icon: "💔" },
  { text: "Your phone screen cracked!", amount: -10, icon: "📱" },
  { text: "Lost your wallet on the bus!", amount: -6, icon: "😰" },
  { text: "Had to pay a library fine.", amount: -3, icon: "📚" },
  { text: "Your bike got a puncture — repair costs.", amount: -5, icon: "🚲" },
  { text: "Accidentally broke a friend's headphones.", amount: -7, icon: "🎧" },
  { text: "Treat yourself — you bought snacks!", amount: -4, icon: "🍕" },
  { text: "Unexpected vet bill for your pet!", amount: -9, icon: "🐾" },
];

// ===== Club/Activity Events =====
const CLUB_EVENTS = [
  { text: "Football club membership fee", cost: 5, icon: "⚽" },
  { text: "Art class supplies", cost: 4, icon: "🎨" },
  { text: "Swimming lesson", cost: 3, icon: "🏊" },
  { text: "Cinema trip with friends", cost: 6, icon: "🎬" },
  { text: "Music lesson", cost: 5, icon: "🎵" },
  { text: "Coding club subscription", cost: 4, icon: "💻" },
  { text: "Dance class", cost: 5, icon: "💃" },
  { text: "Skateboard park entry", cost: 3, icon: "🛹" },
];

// ===== Path Definitions =====
function generatePath(type) {
  if (type === "trailblazer") {
    return [
      { type: "start", label: "Start", icon: "🚀" },
      { type: "chore", label: "Chore", icon: "🧹" },
      { type: "chore", label: "Chore", icon: "🧽" },
      { type: "club", label: "Club", icon: "⭐" },
      { type: "chore", label: "Chore", icon: "🌿" },
      { type: "chance", label: "Chance", icon: "❓" },
      { type: "chore", label: "Chore", icon: "🧺" },
      { type: "finish", label: "Finish", icon: "🏁" },
    ];
  } else {
    return [
      { type: "start", label: "Start", icon: "🚀" },
      { type: "chance", label: "Chance", icon: "❓" },
      { type: "chore", label: "Chore", icon: "🧹" },
      { type: "chance", label: "Chance", icon: "🎲" },
      { type: "club", label: "Club", icon: "⭐" },
      { type: "chance", label: "Chance", icon: "🃏" },
      { type: "chore", label: "Chore", icon: "🧽" },
      { type: "finish", label: "Finish", icon: "🏁" },
    ];
  }
}

// ===== Game State =====
let state = null;

function newGame(p1Name, p2Name) {
  state = {
    season: 1,
    currentPlayer: 0,
    phase: "path-choice", // path-choice | rolling | stash-splash | game-over
    turnStep: 0, // which player is choosing stash/splash in that phase
    players: [
      { name: p1Name, stash: 0, splash: STARTING_SPLASH, path: null, position: 0, pathSquares: [] },
      { name: p2Name, stash: 0, splash: STARTING_SPLASH, path: null, position: 0, pathSquares: [] },
    ],
    log: [],
  };
}

function currentPlayer() {
  return state.players[state.currentPlayer];
}

// ===== DOM References =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Screens
const startScreen = $("#start-screen");
const gameScreen = $("#game-screen");
const endScreen = $("#end-screen");

// Overlays
const pathOverlay = $("#path-overlay");
const stashOverlay = $("#stash-overlay");

// Elements
const seasonBadge = $("#season-badge");
const turnIndicator = $("#turn-indicator");
const pathTrack = $("#path-track");
const actionMessage = $("#action-message");
const diceDisplay = $("#dice-display");
const rollBtn = $("#roll-btn");
const eventLog = $("#event-log");

// ===== Screen Management =====
function showScreen(screen) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  screen.classList.add("active");
}

// ===== Render =====
function render() {
  if (!state) return;

  // Season
  seasonBadge.textContent = `Season ${state.season} / ${SEASONS}`;

  // Turn indicator
  const cp = currentPlayer();
  turnIndicator.textContent = `${cp.name}'s Turn`;
  turnIndicator.style.color = `var(--clr-p${state.currentPlayer})`;

  // Player cards
  state.players.forEach((p, i) => {
    const card = $(`.player-card[data-player="${i}"]`);
    card.querySelector(".name").textContent = p.name;
    card.querySelector(".stash-val").textContent = `£${p.stash}`;
    card.querySelector(".splash-val").textContent = `£${p.splash}`;
    card.querySelector(".total-val").textContent = `£${p.stash + p.splash}`;
    card.querySelector(".path-label").textContent = p.path
      ? `Path: ${p.path === "trailblazer" ? "🥾 Trailblazer" : "🗺️ Treasure Hunter"}`
      : "Choosing path...";
    card.classList.toggle("active-turn", i === state.currentPlayer);
  });

  // Board
  renderBoard();
}

function renderBoard() {
  pathTrack.innerHTML = "";
  const cp = currentPlayer();
  if (!cp.pathSquares.length) {
    pathTrack.innerHTML = '<p style="color: var(--clr-muted); text-align:center; width:100%;">Choose a path to begin the season.</p>';
    return;
  }

  cp.pathSquares.forEach((sq, i) => {
    const div = document.createElement("div");
    div.className = `square type-${sq.type}`;
    if (i === cp.position) div.classList.add("current");
    div.innerHTML = `<span class="icon">${sq.icon}</span>${sq.label}`;

    // Player markers
    const markers = document.createElement("div");
    markers.className = "player-markers";
    state.players.forEach((p, pi) => {
      if (p.pathSquares.length && p.position === i && p.path === cp.path) {
        const m = document.createElement("div");
        m.className = `marker p${pi}`;
        m.textContent = pi + 1;
        markers.appendChild(m);
      }
    });
    // Show current player marker even if paths differ
    if (i === cp.position) {
      if (!markers.children.length) {
        const m = document.createElement("div");
        m.className = `marker p${state.currentPlayer}`;
        m.textContent = state.currentPlayer + 1;
        markers.appendChild(m);
      }
    }
    div.appendChild(markers);
    pathTrack.appendChild(div);
  });
}

function renderLog() {
  eventLog.innerHTML = "";
  // Show newest first
  [...state.log].reverse().forEach((entry) => {
    const div = document.createElement("div");
    div.className = `log-entry ${entry.type}`;
    div.textContent = entry.text;
    eventLog.appendChild(div);
  });
}

function addLog(text, type = "neutral") {
  state.log.push({ text, type });
  renderLog();
}

// ===== Path Choice =====
function showPathChoice() {
  state.phase = "path-choice";
  const cp = currentPlayer();
  $("#path-player-name").textContent = cp.name;
  $("#path-player-name").style.color = `var(--clr-p${state.currentPlayer})`;
  pathOverlay.classList.add("active");
  $$(".path-card").forEach((c) => c.classList.remove("selected"));
  $("#confirm-path-btn").disabled = true;
  render();
}

let selectedPath = null;

$$(".path-card").forEach((card) => {
  card.addEventListener("click", () => {
    selectedPath = card.dataset.path;
    $$(".path-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    $("#confirm-path-btn").disabled = false;
  });
});

$("#confirm-path-btn").addEventListener("click", () => {
  if (!selectedPath) return;
  const cp = currentPlayer();
  cp.path = selectedPath;
  cp.pathSquares = generatePath(selectedPath);
  cp.position = 0;
  pathOverlay.classList.remove("active");
  state.phase = "rolling";
  addLog(
    `${cp.name} chose the ${selectedPath === "trailblazer" ? "🥾 Trailblazer" : "🗺️ Treasure Hunter"} path!`,
    "neutral"
  );
  actionMessage.textContent = `${cp.name}, roll the dice to move!`;
  rollBtn.disabled = false;
  rollBtn.style.display = "";
  diceDisplay.textContent = "🎲";
  render();
});

// ===== Dice Rolling =====
function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

rollBtn.addEventListener("click", () => {
  if (state.phase !== "rolling") return;
  rollBtn.disabled = true;

  // Animation
  diceDisplay.classList.add("rolling");
  let ticks = 0;
  const anim = setInterval(() => {
    diceDisplay.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
    ticks++;
    if (ticks > 10) {
      clearInterval(anim);
      diceDisplay.classList.remove("rolling");
      const roll = rollDice();
      diceDisplay.textContent = DICE_FACES[roll - 1];
      processRoll(roll);
    }
  }, 80);
});

function processRoll(roll) {
  const cp = currentPlayer();
  const maxPos = cp.pathSquares.length - 1;
  const newPos = Math.min(cp.position + roll, maxPos);
  cp.position = newPos;
  render();

  const square = cp.pathSquares[newPos];

  setTimeout(() => {
    resolveSquare(square, roll);
  }, 400);
}

function resolveSquare(square, roll) {
  const cp = currentPlayer();

  switch (square.type) {
    case "chore": {
      const earned = CHORE_BASE * roll;
      cp.splash += earned;
      actionMessage.textContent = `${cp.name} did chores and earned £${earned}! (£${CHORE_BASE} × ${roll})`;
      addLog(`${cp.name} earned £${earned} from chores (£${CHORE_BASE} × ${roll})`, "positive");
      break;
    }
    case "chance": {
      const event = CHANCE_EVENTS[Math.floor(Math.random() * CHANCE_EVENTS.length)];
      const actualAmount = event.amount < 0 ? Math.max(event.amount, -cp.splash) : event.amount;
      cp.splash += actualAmount;
      const sign = actualAmount >= 0 ? "+" : "-";
      const display = `${sign}£${Math.abs(actualAmount)}`;
      actionMessage.textContent = `${event.icon} ${event.text} (${display})`;
      addLog(`${event.icon} ${cp.name}: ${event.text} (${display})`, actualAmount >= 0 ? "positive" : "negative");
      break;
    }
    case "club": {
      const club = CLUB_EVENTS[Math.floor(Math.random() * CLUB_EVENTS.length)];
      const canAfford = cp.splash >= club.cost;
      if (canAfford) {
        cp.splash -= club.cost;
        actionMessage.textContent = `${club.icon} ${club.text} — paid £${club.cost}. Fun times!`;
        addLog(`${club.icon} ${cp.name} paid £${club.cost} for ${club.text.toLowerCase()}`, "negative");
      } else {
        actionMessage.textContent = `${club.icon} ${club.text} costs £${club.cost}, but ${cp.name} can't afford it. Skipped!`;
        addLog(`${cp.name} couldn't afford ${club.text.toLowerCase()} (£${club.cost})`, "neutral");
      }
      break;
    }
    case "start":
      actionMessage.textContent = `${cp.name} sets off on the ${cp.path === "trailblazer" ? "Trailblazer" : "Treasure Hunter"} path!`;
      break;
    case "finish":
      actionMessage.textContent = `${cp.name} reached the end of the path!`;
      addLog(`${cp.name} finished the ${cp.path} path!`, "special");
      break;
  }

  render();

  // Check if player reached the end
  if (cp.position >= cp.pathSquares.length - 1) {
    // Switch to next player or go to stash/splash
    setTimeout(() => advanceAfterFinish(), 1200);
  } else {
    // Continue rolling
    setTimeout(() => {
      rollBtn.disabled = false;
      actionMessage.textContent = `${cp.name}, roll again!`;
    }, 800);
  }
}

function advanceAfterFinish() {
  if (state.currentPlayer === 0) {
    // Player 2's turn
    state.currentPlayer = 1;
    const p2 = currentPlayer();
    if (!p2.path) {
      showPathChoice();
    } else {
      state.phase = "rolling";
      actionMessage.textContent = `${p2.name}, roll the dice!`;
      rollBtn.disabled = false;
      diceDisplay.textContent = "🎲";
      render();
    }
  } else {
    // Both players finished — pocket money then stash/splash
    state.players.forEach((p) => {
      p.splash += POCKET_MONEY;
    });
    addLog(`Both players receive £${POCKET_MONEY} pocket money!`, "special");
    render();

    setTimeout(() => {
      state.turnStep = 0;
      showStashSplash();
    }, 1000);
  }
}

// ===== Stash / Splash Phase =====
function showStashSplash() {
  state.phase = "stash-splash";
  rollBtn.style.display = "none";
  const p = state.players[state.turnStep];
  const total = p.splash;

  // Auto-confirm if nothing to split
  if (total <= 0) {
    addLog(`${p.name} has nothing to split.`, "neutral");
    if (state.turnStep === 0) {
      state.turnStep = 1;
      showStashSplash();
    } else {
      endSeason();
    }
    return;
  }

  $("#stash-player-name").textContent = p.name;
  $("#stash-player-name").style.color = `var(--clr-p${state.turnStep})`;
  $("#stash-total-amount").textContent = `£${total}`;
  $("#stash-interest-note").textContent = `Stashed money earns 50% interest (×1.5) next season!`;

  const slider = $("#stash-slider");
  slider.max = total;
  slider.value = Math.floor(total / 2);
  updateSliderDisplay();

  stashOverlay.classList.add("active");
  actionMessage.textContent = "Stash or Splash time!";
  render();
}

function updateSliderDisplay() {
  const slider = $("#stash-slider");
  const p = state.players[state.turnStep];
  const stashAmt = parseInt(slider.value) || 0;
  const splashAmt = p.splash - stashAmt;
  $("#stash-amount-display").textContent = `£${stashAmt}`;
  $("#splash-amount-display").textContent = `£${splashAmt}`;
}

$("#stash-slider").addEventListener("input", updateSliderDisplay);

$("#confirm-stash-btn").addEventListener("click", () => {
  const slider = $("#stash-slider");
  const p = state.players[state.turnStep];
  const stashAmt = parseInt(slider.value) || 0;
  const splashAmt = p.splash - stashAmt;

  p.stash += stashAmt;
  p.splash = splashAmt;

  addLog(`${p.name} stashed £${stashAmt} and kept £${splashAmt} to splash.`, "special");

  stashOverlay.classList.remove("active");

  if (state.turnStep === 0) {
    state.turnStep = 1;
    showStashSplash();
  } else {
    // End of season
    endSeason();
  }
});

// ===== Season Transitions =====
function endSeason() {
  if (state.season >= SEASONS) {
    endGame();
    return;
  }

  // Apply interest
  state.players.forEach((p) => {
    const interest = Math.floor(p.stash * STASH_INTEREST);
    if (interest > 0) {
      addLog(`${p.name}'s stash earned £${interest} interest! (£${p.stash} × 50%)`, "positive");
      p.stash += interest;
    }
  });

  state.season++;
  state.currentPlayer = 0;

  // Reset paths
  state.players.forEach((p) => {
    p.path = null;
    p.position = 0;
    p.pathSquares = [];
  });

  addLog(`--- Season ${state.season} begins! ---`, "neutral");
  render();
  rollBtn.style.display = "";
  diceDisplay.textContent = "🎲";

  setTimeout(() => showPathChoice(), 600);
}

// ===== End Game =====
function endGame() {
  // Apply final interest
  state.players.forEach((p) => {
    const interest = Math.floor(p.stash * STASH_INTEREST);
    if (interest > 0) {
      p.stash += interest;
    }
  });

  const totals = state.players.map((p) => p.stash + p.splash);
  const winnerIdx = totals[0] >= totals[1] ? 0 : 1;
  const isTie = totals[0] === totals[1];

  // Populate end screen
  if (isTie) {
    $("#winner-text").innerHTML = "It's a tie!";
  } else {
    const winnerSpan = document.createElement("span");
    winnerSpan.className = "winner-name";
    winnerSpan.textContent = state.players[winnerIdx].name;
    $("#winner-text").textContent = "";
    $("#winner-text").appendChild(winnerSpan);
    $("#winner-text").appendChild(document.createTextNode(" wins!"));
  }

  state.players.forEach((p, i) => {
    const card = $$(`.final-card`)[i];
    card.dataset.player = i;
    card.querySelector(".final-name").textContent = p.name;
    card.querySelector(".final-stash").textContent = `£${p.stash}`;
    card.querySelector(".final-splash").textContent = `£${p.splash}`;
    card.querySelector(".final-total").textContent = `£${p.stash + p.splash}`;
  });

  state.phase = "game-over";
  showScreen(endScreen);
}

// ===== Start Game =====
$("#start-btn").addEventListener("click", () => {
  const p1 = $("#p1-name").value.trim() || "Player 1";
  const p2 = $("#p2-name").value.trim() || "Player 2";
  newGame(p1, p2);
  showScreen(gameScreen);
  addLog(`Game started! ${p1} vs ${p2}. Season 1 begins.`, "neutral");
  render();
  showPathChoice();
});

$("#play-again-btn").addEventListener("click", () => {
  showScreen(startScreen);
});

// Initialize
showScreen(startScreen);
