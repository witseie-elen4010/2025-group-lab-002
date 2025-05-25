import { displayPlayers, createTurnIndicator, updateTurnDisplay, startDiscussionTime} from "./game-utils.js";


/**
   * Represents a voting round in a game.
   */
 class VotingRound {
    /**
     * Initializes a new VotingRound instance.
     * @param {Array<Object>} players - An array of player objects. Each player object must have a `username` property.
     */
    constructor(players) {
      this.players = players;
      this.votes = {};
      this.players.forEach((player) => {
        this.votes[player.username] = 0;
      });
    }
  
    /**
     * Casts a vote from one player to another.
     * @param {string} voterUsername - The username of the player casting the vote.
     * @param {string} voteForUsername - The username of the player being voted for.
     * @throws {Error} Throws an error if the voter or vote target is invalid.
     * @throws {Error} Throws an error if a player attempts to vote for themselves.
     */
    castVote(voterUsername, voteForUsername) {
      const voter = this.players.find(
        (player) => player.username === voterUsername
      );
      const voteFor = this.players.find(
        (player) => player.username === voteForUsername
      );
  
      if (!voter || !voteFor) {
        throw new Error("Invalid voter or vote target.");
      }
      if (voter.username === voteFor.username) {
        throw new Error("A player cannot vote for themselves.");
      }
      this.votes[voteFor.username] += 1;
    }
  
    /**
     * Determines the player(s) to be eliminated based on the votes.
     * If there is a tie, returns an array of usernames of the tied players.
     * @returns {Object|null|Array<string>} The eliminated player object, null if no votes,
     * or an array of usernames in case of a tie.
     */
    getEliminatedPlayer() {
      let maxVotes = 0;
      let eliminatedPlayer = null;
  
      for (const [username, voteCount] of Object.entries(this.votes)) {
        if (voteCount > maxVotes) {
          maxVotes = voteCount;
          eliminatedPlayer = this.players.find(
            (player) => player.username === username
          );
        }
      }
  
      const totalVotesCast = Object.values(this.votes).reduce((a, b) => a + b, 0);
      if (totalVotesCast === 0) {
        return null;
      }
  
      const tiedPlayers = Object.entries(this.votes).filter(
        ([, voteCount]) => voteCount === maxVotes
      );
  
      if (tiedPlayers.length > 1) {
        return tiedPlayers.map(([username]) => username);
      }
  
      return eliminatedPlayer;
    }
}

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

  function disableGameInputs() {
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
    const openChatBtn = document.getElementById("open-chat-btn");
    openChatBtn.click();
    startDiscussionTime(room);
  });

  // Listen for startVoting event from server
  socket.on("startVoting", (room) => {
    if (gameOver) return;
    // Hide clue input
    const clueInputContainer = document.getElementById("clue-input-container");
    clueInputContainer.style.display = "none";
    const players = room.players;

    // Create a new VotingRound instance with the current players
    votingRound = new VotingRound(players);

    // Get current user info from localStorage
    const user = JSON.parse(sessionStorage.getItem("loggedInUser")) || {
      username: "Guest",
    };
    const currentUsername = user.username;

    // If vote form doesn't exist, create it
    let voteForm = document.getElementById("vote-form");
    if (!voteForm) {
      voteForm = document.createElement("form");
      voteForm.id = "vote-form";
      voteForm.className = "mt-4";
      voteForm.style.maxWidth = "300px";
      voteForm.style.margin = "0 auto";

      // Label
      const label = document.createElement("label");
      label.textContent = "Vote for a player:";
      label.className = "form-label";
      voteForm.appendChild(label);

      // Select
      const select = document.createElement("select");
      select.id = "vote-for";
      select.className = "form-select mb-3";
      select.required = true;
      voteForm.appendChild(select);

      // Button
      const btn = document.createElement("button");
      btn.type = "submit";
      btn.className = "btn w-100 mb-2";
      btn.style.backgroundColor = "#5959ba";
      btn.textContent = "Cast Vote";
      voteForm.appendChild(btn);

      // Insert into DOM
      clueInputContainer.parentNode.insertBefore(
        voteForm,
        clueInputContainer.nextSibling
      );

      // Handle vote submission
      voteForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const voteFor = select.value;
        socket.emit("cast-vote", {
          code: room.code,
          voter: currentUsername,
          voteFor: voteFor,
        });
        btn.disabled = true;
      });
    } else {
      voteForm.style.display = "block";
    }

    const votingPlayers = room.players;
    // Populate vote options (exclude self)
    const select = document.getElementById("vote-for");
    select.innerHTML = "";
    votingPlayers.forEach((player) => {
      if (player.username !== currentUsername) {
        const option = document.createElement("option");
        option.value = player.username;
        option.textContent = player.username;
        select.appendChild(option);
      }
    });
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
    Object.keys(votingRound.votes).forEach((k) => {
      votingRound.votes[k] = votes[k] || 0;
    });
    const eliminated = votingRound.getEliminatedPlayer();
    const voteForm = document.getElementById("vote-form");
    console.log("Vote Results:", votingRound.votes);
    console.log("Eliminated:", eliminated);

    // Check if eliminated is Mr. White
    if (eliminated && eliminated.playerRole === "mr.white") {
      // Only show modal to Mr. White
      const user = JSON.parse(sessionStorage.getItem("loggedInUser")) || {
        username: "Guest",
      };
      if (user.username === eliminated.username) {
        // Show modal to guess civilian word
        let modal = document.createElement("div");
        modal.id = "mr-white-guess-modal";
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.backgroundColor = "rgba(0,0,0,0.7)";
        modal.style.display = "flex";
        modal.style.justifyContent = "center";
        modal.style.alignItems = "center";
        modal.style.zIndex = "3000";

        const modalContent = document.createElement("div");
        modalContent.style.backgroundColor = "white";
        modalContent.style.padding = "30px";
        modalContent.style.borderRadius = "12px";
        modalContent.style.maxWidth = "90%";
        modalContent.style.minWidth = "300px";
        modalContent.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";

        modalContent.innerHTML = `
          <h3>You've been eliminated!</h3>
          <p>As Mr. White, you have one chance to guess the civilian word. If you guess correctly, you win!</p>
          <form id="mr-white-guess-form">
            <input type="text" id="mr-white-guess-input" class="form-control mb-2" placeholder="Enter your guess..." required />
            <button type="submit" class="btn btn-primary w-100">Submit Guess</button>
          </form>
          <button class="btn btn-secondary mt-3" id="close-mr-white-modal">Close</button>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Handle guess submission
        document.getElementById("mr-white-guess-form").onsubmit = function (e) {
          e.preventDefault();
          const guess = document
            .getElementById("mr-white-guess-input")
            .value.trim();
          // Send guess to server for validation
          socket.emit("mr-white-guess", {
            code,
            username: user.username,
            guess,
          });
          // Disable form to prevent multiple submissions
          document.getElementById("mr-white-guess-input").disabled = true;
          this.querySelector("button[type='submit']").disabled = true;
        };

        document.getElementById("close-mr-white-modal").onclick = function () {
          document.body.removeChild(modal);
        };

        // Listen for result from server
        socket.once("mr-white-guess-result", ({ correct, civilianWord }) => {
          const resultMsg = correct
            ? `<span style="color:green;font-weight:bold;">Correct! You win as Mr. White!</span>`
            : `<span style="color:red;font-weight:bold;">Incorrect. The civilian word was: <strong>${civilianWord}</strong>. You are eliminated.</span>`;
          modalContent.innerHTML = `
            <h3>Mr. White's Guess</h3>
            <p>${resultMsg}</p>
            <button class="btn btn-secondary mt-3" id="close-mr-white-modal">Close</button>
          `;
          document.getElementById("close-mr-white-modal").onclick =
            function () {
              document.body.removeChild(modal);
            };
        });
      }
    }

    // Build the results HTML
    let breakdown = "<strong>Vote Results:</strong><br>";
    for (const [username, count] of Object.entries(votingRound.votes)) {
      breakdown += `${username}: ${count} vote(s)<br>`;
    }
    if (Array.isArray(eliminated)) {
      breakdown += `<br><strong>Tie!</strong> Players tied: ${eliminated.join(
        ", "
      )}. Revoting...`;
      if (voteForm) {
        voteForm.style.display = "block";
        const btn = voteForm.querySelector("button[type='submit']");
        if (btn) btn.disabled = false;
      }
    } else if (eliminated && eliminated.username) {
      breakdown += `<br><strong>${eliminated.username}</strong> was eliminated! They were a ${eliminated.playerRole}.`;
      document.querySelectorAll(".player").forEach((playerDiv) => {
        const nameDiv = playerDiv.querySelector(".player-name");
        if (nameDiv && nameDiv.textContent === eliminated.username) {
          playerDiv.classList.add("eliminated-player");
          playerDiv.style.opacity = "0.5";
        }
      });
      if (voteForm) voteForm.style.display = "none";
    } else {
      breakdown += "<br>No votes were cast.";
      if (voteForm) voteForm.style.display = "none";
    }

    // Show results in a modal popup
    let modal = document.getElementById("voting-results-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "voting-results-modal";
      modal.style.position = "fixed";
      modal.style.top = "0";
      modal.style.left = "0";
      modal.style.width = "100%";
      modal.style.height = "100%";
      modal.style.backgroundColor = "rgba(0,0,0,0.7)";
      modal.style.display = "flex";
      modal.style.justifyContent = "center";
      modal.style.alignItems = "center";
      modal.style.zIndex = "2000";

      // Modal content
      const modalContent = document.createElement("div");
      modalContent.style.backgroundColor = "white";
      modalContent.style.padding = "30px";
      modalContent.style.borderRadius = "12px";
      modalContent.style.maxWidth = "90%";
      modalContent.style.minWidth = "300px";
      modalContent.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
      modalContent.id = "voting-results-modal-content";

      // Close button
      const closeButton = document.createElement("button");
      closeButton.textContent = "Close";
      closeButton.className = "btn btn-secondary mt-3";
      closeButton.style.display = "block";
      closeButton.style.margin = "20px auto 0 auto";
      closeButton.onclick = function () {
        document.body.removeChild(modal);
      };

      modalContent.innerHTML = `<h3>Voting Results</h3><div id='voting-results-breakdown'></div>`;
      modalContent.appendChild(closeButton);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
    } else {
      // If modal already exists, just update content
      const modalContent = document.getElementById(
        "voting-results-modal-content"
      );
      if (modalContent) {
        modalContent.querySelector("#voting-results-breakdown").innerHTML =
          breakdown;
      }
      modal.style.display = "flex";
    }
    // Set the breakdown HTML
    const breakdownDiv = document.getElementById("voting-results-breakdown");
    if (breakdownDiv) breakdownDiv.innerHTML = breakdown;
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

  socket.on("game-over", ({ winner }) => {
    gameOver = true;
    disableGameInputs();

    let gameOverModal = document.getElementById("game-over-modal");
    if (!gameOverModal) {
      gameOverModal = document.createElement("div");
      gameOverModal.id = "game-over-modal";
      gameOverModal.style.position = "fixed";
      gameOverModal.style.top = "0";
      gameOverModal.style.left = "0";
      gameOverModal.style.width = "100%";
      gameOverModal.style.height = "100%";
      gameOverModal.style.backgroundColor = "rgba(0,0,0,0.7)";
      gameOverModal.style.display = "flex";
      gameOverModal.style.justifyContent = "center";
      gameOverModal.style.alignItems = "center";
      gameOverModal.style.zIndex = "3000";

      // Modal content
      const modalContent = document.createElement("div");
      modalContent.id = "game-over-modal-content";
      modalContent.style.backgroundColor = "white";
      modalContent.style.padding = "30px";
      modalContent.style.borderRadius = "12px";
      modalContent.style.maxWidth = "90%";
      modalContent.style.minWidth = "300px";
      modalContent.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
      gameOverModal.appendChild(modalContent);
      document.body.appendChild(gameOverModal);
    } else {
      gameOverModal.style.display = "flex";
    }

    // Fill modal content
    const modalContent =
      document.getElementById("game-over-modal-content") ||
      gameOverModal.firstChild;
    modalContent.innerHTML = `
      <h2>Game Over</h2>
      <p class="fs-4"><strong>${winner}</strong> win the game!</p>
      <button class="btn btn-primary mt-3" id="leave-game">Leave Game</button>
    `;

    // Click outside modal returns to lobby
    gameOverModal.onclick = () => {
      window.location.href = `../game/join`;
    };

    document.getElementById("close-game-over-btn").onclick = (e) => {
      e.stopPropagation();
      document.body.removeChild(gameOverModal);
    };

    document.getElementById("leave-game").onclick = (e) => {
      e.stopPropagation();
      window.location.href = `../game/join`;
    };

    setTimeout(() => {
      window.location.href = `../game/join`;
    }, 5000);
  });

  return socket;
}