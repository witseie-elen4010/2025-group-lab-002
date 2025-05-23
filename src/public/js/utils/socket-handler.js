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

export function setUpSockets(socket){
  let votingRound = null;
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  // Listen for current turn updates from server
  socket.on("update-turn", (room) => {
    console.log("Received update-turn event:", room);
    updateTurnDisplay(room);
  });

    // Listen for new player joining
    socket.on("player-joined", async ({ room, username }) => {
      console.log(`username: ${username}`);
  
      displayPlayers(room);
      updateTurnDisplay(room);
    });

    socket.on('player-left', ({ room }) => {
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
      btn.className = "btn btn-primary w-100";
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


  socket.on("game-over", ({ winner }) => {
    let modal = document.getElementById("voting-results-modal");
    let modalContent = document.getElementById("voting-results-modal-content");

    modal.style.display = "flex";

    // Option 2: (Alternative) Automatically show game result after a delay
    setTimeout(() => {
      modalContent.innerHTML = `
        <h2>Game Over</h2>
        <p class="fs-4"><strong>${winner}</strong> win the game!</p>
        <button class="btn btn-primary mt-3" id="return-to-lobby">Return To Lobby</button>
        <button class="btn btn-primary mt-3" id="close-game-over-btn">Close</button>
      `;
      document.getElementById("close-game-over-btn").onclick = () => {
        document.body.removeChild(modal);
      };

      document.getElementById("return-to-lobby").onclick = () => {
        window.location.href = `/api/game/lobby?code=${code}`;
      };

    }, 4000);

  });


  socket.on("game-over", ({ winner }) => {
    let modal = document.getElementById("voting-results-modal");
    let modalContent = document.getElementById("voting-results-modal-content");

    modal.style.display = "flex";

    // Option 2: (Alternative) Automatically show game result after a delay
    setTimeout(() => {
      modalContent.innerHTML = `
        <h2>Game Over</h2>
        <p class="fs-4"><strong>${winner}</strong> win the game!</p>
        <button class="btn btn-primary mt-3" id="return-to-lobby">Return To Lobby</button>
        <button class="btn btn-primary mt-3" id="close-game-over-btn">Close</button>
      `;
      document.getElementById("close-game-over-btn").onclick = () => {
        document.body.removeChild(modal);
      };

      document.getElementById("return-to-lobby").onclick = () => {
        window.location.href = `/api/game/lobby?code=${code}`;
      };

    }, 4000);

  });
}