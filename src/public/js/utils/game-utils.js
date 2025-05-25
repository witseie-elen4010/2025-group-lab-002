/**
 * 
 * @param Array<Object> players 
 */

export function displayPlayers(room) {
    console.log(`ROOM: ${room.players[0].username}`);
    const players = room.players
    const container = document.getElementById("players-container");
    container.innerHTML = ""; // Clear container
    const colors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33"]; // Different colors for each player

    for (let index = 0; index < players.length; index++) {
      const player = players[index];
      const playerDiv = document.createElement("div");
      playerDiv.className = "player";
      playerDiv.dataset.playerIndex = index;

      const circle = document.createElement("div");
      circle.className = "player-circle";
      circle.style.backgroundColor = colors[index % colors.length];

      const nameDiv = document.createElement("div");
      nameDiv.className = "player-name";
      nameDiv.textContent = player.username;

      const speechBubble = document.createElement("div");
      speechBubble.className = "speech-bubble";
      
      // Find player's clue in roundClues if it exists
      const playerClue = room.roundClues.find(clue => clue.username === player.username);
      if (playerClue) {
        speechBubble.textContent = playerClue.clue;
        speechBubble.style.display = "block";
      } else {
        speechBubble.style.display = "none";
      }

      playerDiv.appendChild(circle);
      playerDiv.appendChild(nameDiv);
      playerDiv.appendChild(speechBubble);
      container.appendChild(playerDiv);
    }
}

export function createTurnIndicator() {
        // Create turn indicator if it doesn't exist
        if (!document.querySelector(".turn-indicator")) {
        const turnIndicator = document.createElement("div");
        turnIndicator.className = "turn-indicator";
        document.body.insertBefore(
            turnIndicator,
            document.querySelector(".word-display")
        );
        }
}

export function updateTurnDisplay(room) {
    const turnIndicator = document.querySelector(".turn-indicator");
    const clueInputContainer = document.getElementById("clue-input-container");
    const submitClueBtn = document.getElementById("submit-clue-btn");
    const currentPlayerIndex = room.currentPlayerIndex; 
    const players = room.players;
    const currentPlayer = players[currentPlayerIndex];

    const user = JSON.parse(sessionStorage.getItem("loggedInUser")) || {
      username: "Guest",
    };
    const currentUsername = user.username;

    if (!currentPlayer) return; // Guard against undefined players

    turnIndicator.textContent = `${currentPlayer.username}'s Turn`;

    // Highlight current player
    document.querySelectorAll(".player").forEach((playerDiv, index) => {
      if (index === currentPlayerIndex) {
        playerDiv.classList.add("current-player");
      } else {
        playerDiv.classList.remove("current-player");
      }
    });

    console.log(`current player: ${currentPlayer.playerID}`);

    // Show or hide clue input container based on turn and submission status
    if (currentPlayer.username === currentUsername && !room.hasSubmittedClue) {
      // Show clue input only if it's the current user's turn and they haven't submitted a clue yet
      clueInputContainer.style.display = "block";
      document.getElementById("clue-input").disabled = false;
      document.getElementById("submit-clue-btn").style.display = "block";
      document.getElementById("submit-clue-btn").disabled = false;
      // Auto-focus the input field when it's the player's turn
      setTimeout(() => {
        document.getElementById("clue-input").focus();
      }, 300);
    } else {
      // Hide clue input if it's not their turn or they've already submitted
      clueInputContainer.style.display = "none";
      document.getElementById("clue-input").disabled = true;
      document.getElementById("submit-clue-btn").disabled = true;
    }
  }

export function startDiscussionTime(room) {
        console.log("Starting discussion time...");
        const clueInputContainer = document.getElementById("clue-input-container");
        const submitClueBtn = document.getElementById("submit-clue-btn");
        clueInputContainer.style.display = 'none';
        submitClueBtn.style.display = 'none';

    
        // Create timer display
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'discussion-timer';
        timerDisplay.style.position = 'absolute';
        timerDisplay.style.top = '20px';
        timerDisplay.style.left = '50%';
        timerDisplay.style.transform = 'translateX(-50%)';
        timerDisplay.style.backgroundColor = '#808080';
        timerDisplay.style.color = 'white';
        timerDisplay.style.padding = '10px 15px';
        timerDisplay.style.borderRadius = '8px';
        timerDisplay.style.fontSize = '18px';
        timerDisplay.style.zIndex = '1001';
        document.body.appendChild(timerDisplay);
    
        let timeRemaining = 30; // 30 seconds
    
        const updateTimer = () => {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            timerDisplay.textContent = `Discussion: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        };
    
        updateTimer(); // Initial display
        const countdown = setInterval(() => {
            timeRemaining--;
            updateTimer();
    
            if (timeRemaining <= 0) {
                clearInterval(countdown);
              document.body.removeChild(timerDisplay); // Remove the timer from screen
                startVoting(room); // Move to voting phase
            }
        }, 1000);
    }

function startVoting(room) {
    // This function will be implemented later
    const socket = io();
    socket.emit("startVoting", (room));
    console.log("Starting voting phase...");
}

export function disableGameInputs() {
    // Disable clue input
    const clueInput = document.getElementById("clue-input");
    const clueInputContainer = document.getElementById("clue-input-container");
    const submitClueBtn = document.getElementById("submit-clue-btn");
    if (clueInput) clueInput.disabled = true;
    if (submitClueBtn) submitClueBtn.disabled = true;
    if (clueInputContainer) clueInputContainer.style.display = "none";

    // Disable voting
    const voteForm = document.getElementById("vote-form");
    if (voteForm) voteForm.style.display = "none";
}