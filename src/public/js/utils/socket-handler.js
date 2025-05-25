import { displayPlayers, createTurnIndicator, updateTurnDisplay, startDiscussionTime, disableGameInputs} from "./game-utils.js";
import { openChat, handleStartVoting, hideClueInput, getCurrentUsername, setupVoteForm, populateVoteOptions } from "./socket-helper.js";
import {
  updateVoteCounts,
  handleMrWhiteElimination,
  buildVoteBreakdownHtml,
  updateEliminatedPlayerUI,
  showVotingResultsModal
} from "./voting-utils.js";

export function setUpSockets(){
  let votingRound = null;
  let gameOver = false;
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const username = JSON.parse(sessionStorage.getItem("loggedInUser")).username;
  const socket = io({
    query: {
      code,
      username,
    },
  });

  // Listen for current turn updates from server
  socket.on("update-turn", (room) => {
    console.log("Received update-turn event:", room);
    updateTurnDisplay(room);
  });

socket.on("player-joined", async ({ room, username }) => {
    console.log(`username: ${username}`);

    // Clear the outer disconnect timer (if active)
    if (window.roomDisconnectTimeout) {
        clearTimeout(window.roomDisconnectTimeout);
        window.roomDisconnectTimeout = null;
    }

    // Clear the inner countdown loop (if active)
    if (window.roomCountdownTimeout) {
        clearTimeout(window.roomCountdownTimeout);
        window.roomCountdownTimeout = null;
    }

    const overlay = document.getElementById('player-disconnected-overlay');
    overlay.style.display = 'none';

    displayPlayers(room);
    updateTurnDisplay(room);
});

  socket.on("player-left", ({ room }) => {
    displayPlayers(room);
    updateTurnDisplay(room);
  });

  // Listen for clue submissions
  socket.on("clueSubmitted", (data) => {
    const { serverRoom } = data;
    const room = serverRoom;
    const clue = room.clues[room.clues.length - 1].clue;
    console.log(`current player idx: ${room.currentPlayerIndex}`);

    // Display clue in speech bubble
    const playerDiv = document.querySelector(
      `.player[data-player-index="${room.currentPlayerIndex}"]`
    );
    if (playerDiv) {
      const speechBubble = playerDiv.querySelector(".speech-bubble");
      speechBubble.textContent = clue;
      speechBubble.classList.add("has-clue");
      speechBubble.style.display = "block";
    }
  });

  socket.on("startDiscussion", (room) => {
    openChat();
    startDiscussionTime(room);
});

  socket.on("startVoting", (room) => {
      if (gameOver) return;
      votingRound = handleStartVoting(room, socket, votingRound);
  });

  // Hide the vote form after voting is done
  socket.on("vote-confirmation", (voter) => {
    const user = JSON.parse(sessionStorage.getItem("loggedInUser")) || {
      username: "Guest",
    };
    const currentUsername = user.username;

    if (voter === currentUsername) {
      const voteForm = document.getElementById("vote-form");
      if (voteForm) voteForm.style.display = "none";
    }
  });

  socket.on("voting-complete", ({ votes }) => {
    if (!votingRound) return;

    updateVoteCounts(votingRound, votes);
    const eliminated = votingRound.getEliminatedPlayer();
    const voteForm = document.getElementById("vote-form");

    console.log("Vote Results:", votingRound.votes);
    console.log("Eliminated:", eliminated);

    handleMrWhiteElimination(eliminated, socket, code);

    let breakdown = buildVoteBreakdownHtml(votingRound, eliminated, voteForm);

    if (eliminated && eliminated.username) {
        updateEliminatedPlayerUI(eliminated);
    }

    showVotingResultsModal(breakdown);
});

  // Listen for new round event from server
  socket.on("new-round", ({ roundNumber, room }) => {
    if (gameOver) return;
    // Update round number display
    const roundDisplay = document.getElementById("round-number-display");
    if (roundDisplay) {
      roundDisplay.textContent = `Round ${roundNumber}`;
    }

    // Update local state and UI
    displayPlayers(room);
    updateTurnDisplay(room);
    //  reset or hide clue input, voting, etc.
    const clueInput = document.getElementById("clue-input");
    if (clueInput) clueInput.value = "";
    const clueInputContainer = document.getElementById("clue-input-container");
    if (clueInputContainer) clueInputContainer.style.display = "none";
    // Hide vote form if present
    const voteForm = document.getElementById("vote-form");
    if (voteForm) voteForm.style.display = "none";
    // Remove eliminated player highlight
    document.querySelectorAll(".player").forEach((playerDiv) => {
      playerDiv.classList.remove("eliminated-player");
      playerDiv.style.opacity = "1";
    });
  });

  // Listen for player-eliminated event from server
  socket.on("player-eliminated", ({ username, role }) => {

    
    const user = JSON.parse(sessionStorage.getItem("loggedInUser")) || {
      username: "Guest",
    };
    if (user.username === username) {
      // Show eliminated message
      let eliminatedModal = document.createElement("div");
      eliminatedModal.id = "eliminated-modal";
      eliminatedModal.style.position = "fixed";
      eliminatedModal.style.top = "0";
      eliminatedModal.style.left = "0";
      eliminatedModal.style.width = "100%";
      eliminatedModal.style.height = "100%";
      eliminatedModal.style.backgroundColor = "rgba(0,0,0,0.7)";
      eliminatedModal.style.display = "flex";
      eliminatedModal.style.justifyContent = "center";
      eliminatedModal.style.alignItems = "center";
      eliminatedModal.style.zIndex = "4000";

      const modalContent = document.createElement("div");
      modalContent.style.backgroundColor = "white";
      modalContent.style.padding = "30px";
      modalContent.style.borderRadius = "12px";
      modalContent.style.maxWidth = "90%";
      modalContent.style.minWidth = "300px";
      modalContent.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
      modalContent.innerHTML = `
      <h2>You have been eliminated</h2>
      <p class="fs-5">You are out of the game. Returning to join screen...</p>
    `;
      eliminatedModal.appendChild(modalContent);
      document.body.appendChild(eliminatedModal);

      setTimeout(() => {
        window.location.href = `/api/game/join`;
      }, 5000);
    }
  });

  socket.on('rejoin-room', ({ room, username }) => {
    displayPlayers(room);        
    updateTurnDisplay(room);     
    document.getElementById('player-disconnected-overlay').style.display = 'none';
  });

  socket.on("player-disconnected", ({ username, endTime }) => {
    if (!window.roomDisconnectTimeout) {
        // Start only if no active disconnect timer
        window.roomDisconnectTimeout = setTimeout(() => {
            const overlay = document.getElementById('player-disconnected-overlay');
            document.getElementById('disconnected-player-name').textContent = username;
            overlay.style.display = 'flex';

            const timerElement = document.getElementById('disconnect-timer');

            const updateCountdown = () => {
                const now = Date.now();
                const timeLeft = Math.max(0, Math.ceil((endTime - now) / 1000));

                if (timerElement) {
                    timerElement.textContent = `${timeLeft} seconds`;
                }

                if (timeLeft <= 0) {
                    window.location.href = "/api/game/join";
                } else {
                    // Track this timeout so it can be cleared if someone rejoins
                    window.roomCountdownTimeout = setTimeout(updateCountdown, 500);
                }
            };

            updateCountdown();
        }, 10000); // start showing after 10 seconds
    }
});

  socket.on("player-reconnected", ({ username }) => {
    console.log(`${username} reconnected.`);
    document.getElementById('player-disconnected-overlay').style.display = 'none';
  });

  socket.on("game-over", ({ winner, winningPlayers }) => {
    const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    const username = user.username;

    let displayMessage;
    if (winningPlayers.includes(username)) {
        displayMessage = "🎉 You won!";
    } else {
        displayMessage = `🏆 ${winner} win!`;
    }

    gameOver = true;
    disableGameInputs();

    let gameOverModal = document.getElementById("game-over-modal");
    gameOverModal.style.display = "flex";

    const modalContent = document.getElementById("game-over-modal-content");
    modalContent.querySelector("#game-over-message").innerHTML = `<strong>${displayMessage}</strong>`;

    // Optional: clicking outside modal returns to lobby
    gameOverModal.onclick = () => {
        window.location.href = `../game/join`;
    };

    document.getElementById("leave-game").onclick = (e) => {
        e.stopPropagation();
        window.location.href = `../game/join`;
    };
  });

  return socket;
}