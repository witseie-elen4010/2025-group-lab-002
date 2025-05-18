class Player {
    constructor(username, role) {
      this.username = username;
      this.role = role;
    }
  }
  
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


document.addEventListener('DOMContentLoaded', async function () {
    // Get the room code from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("code");
    try {
      const response = await fetch(`/api/game/get-room?code=${roomCode}`);
      const data = await response.json();
      room = data.room;
    } catch (error) {
      console.error("Error fetching room data:", error);
    }
  
    // Game state
    let votingRound = null;
    let currentPlayerIndex = 0;
    let players = room.players;
    let wordPair = room.wordPair;
    let hasSubmittedClue = false; // Track if current player has submitted a clue
  
    // DOM elements
    const clueInputContainer = document.getElementById("clue-input-container");
    const submitClueBtn = document.getElementById("submit-clue-btn");
    const playerWordElement = document.getElementById("player-word");
    const showClueHistoryBtn = document.getElementById("show-clue-history-btn");
    const openChatBtn = document.getElementById("open-chat-btn");
  
    // Initialize Socket.io connection
    const socket = io();
  
    // Display room code
    document.getElementById("room-code").textContent = roomCode;
  
    // Listen for current turn updates from server
    socket.on("update-turn", (data) => {
      console.log("Received update-turn event:", data);
      currentPlayerIndex = data.currentPlayerIndex;
      hasSubmittedClue = false; // Always reset on server turn broadcast
      updateTurnDisplay();
    });
  
    // Listen for new player joining
    socket.on("player-joined", async ({ username }) => {
      console.log(`username: ${username}`);
  
      socket.on('startDiscussion', () => {
          openChatBtn.click()
          startDiscussionTime();
      })
  
  
      try {
        const response = await fetch(`/api/game/get-room?code=${roomCode}`);
        const data = await response.json();
        room = data.room;
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
  
      displayPlayers(room.players);
      updateTurnDisplay();
    });
  
    // Listen for clue submissions
    socket.on("clueSubmitted", (data) => {
      const { playerIndex, clue, clueObject } = data;
  
      // Add to local clue history
      if (!room.clues) room.clues = [];
      room.clues.push(clueObject);
  
      // Display clue in speech bubble
      const playerDiv = document.querySelector(
        `.player[data-player-index="${playerIndex}"]`
      );
      if (playerDiv) {
        const speechBubble = playerDiv.querySelector(".speech-bubble");
        speechBubble.textContent = clue;
        speechBubble.classList.add("has-clue");
        speechBubble.style.display = "block";
      }
    });


  // Use the room data we already have
  try {
    // We already have room from: let room = rooms[roomCode]
    players = room.players;
    displayPlayers(players);

    // Get current user info from localStorage
    const user = JSON.parse(sessionStorage.getItem("loggedInUser")) || {
      username: "Guest",
    };
    currentUsername = user.username;

    // Store word pair
    if (room.wordPair) {
      wordPair = room.wordPair;
      playerWordElement.textContent = wordPair.civilian_word; // Show civilian word to current player
    }

    // Initialize turn system
    createTurnIndicator();
    updateTurnDisplay();

    // Let the server know we're ready
    socket.emit("join-room", { code: roomCode, username: currentUsername });
  } catch (error) {
    console.error("Error processing room data:", error);
    playerWordElement.textContent = "Error loading game data";
  }

  function displayPlayers(players) {
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
      speechBubble.style.display = "none"; // Hide speech bubble by default

      playerDiv.appendChild(circle);
      playerDiv.appendChild(nameDiv);
      playerDiv.appendChild(speechBubble);
      container.appendChild(playerDiv);
    }
  }

    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    function startDiscussionTime() {
        console.log("Starting discussion time...");
        clueInputContainer.style.display = 'none';
        submitClueBtn.style.display = 'none';
    
        // Create timer display
        const timerDisplay = document.createElement('div');
        timerDisplay.id = 'discussion-timer';
        timerDisplay.style.position = 'fixed';
        timerDisplay.style.top = '10px';
        timerDisplay.style.right = '10px';
        timerDisplay.style.backgroundColor = '#333';
        timerDisplay.style.color = 'white';
        timerDisplay.style.padding = '10px 15px';
        timerDisplay.style.borderRadius = '8px';
        timerDisplay.style.fontSize = '18px';
        timerDisplay.style.zIndex = '1001';
        document.body.appendChild(timerDisplay);
    
        let timeRemaining = 5; // 60 seconds
    
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
                startVoting(); // Move to voting phase
            }
        }, 1000);
    }

    function createTurnIndicator() {
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

  function updateTurnDisplay() {
    const turnIndicator = document.querySelector(".turn-indicator");
    console.log(`CURRENT PLAYER INDEX: ${currentPlayerIndex}`);
    const currentPlayer = players[currentPlayerIndex];

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
    if (currentPlayer.username === currentUsername && !hasSubmittedClue) {
      // Show clue input only if it's the current user's turn and they haven't submitted a clue yet
      clueInputContainer.style.display = "block";
      document.getElementById("clue-input").disabled = false;
      submitClueBtn.disabled = false;
      // Auto-focus the input field when it's the player's turn
      setTimeout(() => {
        document.getElementById("clue-input").focus();
      }, 300);
    } else {
      // Hide clue input if it's not their turn or they've already submitted
      clueInputContainer.style.display = "none";
      document.getElementById("clue-input").disabled = true;
      submitClueBtn.disabled = true;

    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function startVoting() {
    // This function will be implemented later
    socket.emit("startVoting", {
      players: room.players,
      roomCode: roomCode
    });
    console.log("Starting voting phase...");
    //CLEAR THE CLUES
  }

  // Listen for startVoting event from server
  socket.on("startVoting", ({ players: votingPlayers }) => {
    // Hide clue input
    clueInputContainer.style.display = "none";

    // Create a new VotingRound instance with the current players
    votingRound = new VotingRound(players);
    
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

      // Results div
      const resultsDiv = document.createElement("div");
      resultsDiv.id = "vote-results";
      resultsDiv.className = "mt-3";
      voteForm.appendChild(resultsDiv);

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
          code: roomCode,
          voter: currentUsername,
          voteFor: voteFor,
        });
        btn.disabled = true;
      });
    } else {
      voteForm.style.display = "block";
    }

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
    // Reset vote results
    const resultsDiv = document.getElementById("vote-results");
    if (resultsDiv) resultsDiv.textContent = "";
  });

  // Optionally, hide the vote form after voting is done
  socket.on("vote-confirmation", (voter) => {
    if (voter === currentUsername) {
      const voteForm = document.getElementById("vote-form");
      if (voteForm) voteForm.style.display = "none";
    }
  });

  // Handle voting-complete event: tally votes, show eliminated or tie, handle revote
  socket.on("voting-complete", ({ votes }) => {
    // Update VotingRound votes
    if (!votingRound) return;
    // Reset votes
    Object.keys(votingRound.votes).forEach((k) => (votingRound.votes[k] = 0));
    // Tally votes
    Object.entries(votes).forEach(([voter, voteFor]) => {
      try {
        votingRound.castVote(voter, voteFor);
      } catch (e) {
        // Ignore invalid votes
      }
    });
    const eliminated = votingRound.getEliminatedPlayer();
    const resultsDiv = document.getElementById("vote-results");
    const voteForm = document.getElementById("vote-form");
    if (Array.isArray(eliminated)) {
      // Tie
      if (resultsDiv) {
        resultsDiv.innerHTML = `<strong>Tie!</strong> Players tied: ${eliminated.join(", ")}. Revoting...`;
      }
      // Reset vote form for revote
      if (voteForm) {
        voteForm.style.display = "block";
        const btn = voteForm.querySelector("button[type='submit']");
        if (btn) btn.disabled = false;
      }
      // Optionally, emit revote event or let server handle
    } else if (eliminated && eliminated.username) {
      // Show eliminated player
      if (resultsDiv) {
        resultsDiv.innerHTML = `<strong>${eliminated.username}</strong> was eliminated!`;
      }
      // Mark eliminated player in UI
      document.querySelectorAll(".player").forEach((playerDiv) => {
        const nameDiv = playerDiv.querySelector(".player-name");
        if (nameDiv && nameDiv.textContent === eliminated.username) {
          playerDiv.classList.add("eliminated-player");
          playerDiv.style.opacity = "0.5";
        }
      });
      // Hide vote form
      if (voteForm) voteForm.style.display = "none";
    } else {
      // No votes cast
      if (resultsDiv) {
        resultsDiv.innerHTML = "No votes were cast.";
      }
      if (voteForm) voteForm.style.display = "none";
    }
  });
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  // Handle clue submission
  submitClueBtn.addEventListener("click", function () {
    const clueInput = document.getElementById("clue-input");
    const clue = clueInput.value.trim();

    if (clue && !hasSubmittedClue) {
      hasSubmittedClue = true;

      // Display the clue in the current player's speech bubble
      const currentPlayerDiv = document.querySelector(
        `.player[data-player-index="${currentPlayerIndex}"]`
      );
      const speechBubble = currentPlayerDiv.querySelector(".speech-bubble");
      speechBubble.textContent = clue;
      speechBubble.classList.add("has-clue");
      speechBubble.style.display = "block";

      clueInput.value = "";
      clueInputContainer.style.display = "none";
      clueInput.disabled = true;
      submitClueBtn.disabled = true;

      // Create clue object with player information
      const clueObject = {
        playerIndex: currentPlayerIndex,
        username: currentUsername,
        clue: clue,
      };

      // Add the clue to the room's clue array
      room.clues.push(clueObject);

      // Emit the clue to the server with the clue object
      socket.emit("submitClue", {
        roomCode,
        username: currentUsername,
        playerIndex: currentPlayerIndex,
        clue,
        clueObject: clueObject,
      });
    }
  });

  // Also submit clue when Enter key is pressed in the input field
  document
    .getElementById("clue-input")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !hasSubmittedClue) {
        submitClueBtn.click();
      }
    });

  // Handle show clue history button click
  showClueHistoryBtn.addEventListener("click", function () {
    // Create a modal to display clue history
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "1000";

    const modalContent = document.createElement("div");
    modalContent.style.backgroundColor = "white";
    modalContent.style.padding = "20px";
    modalContent.style.borderRadius = "10px";
    modalContent.style.maxWidth = "80%";
    modalContent.style.maxHeight = "80%";
    modalContent.style.overflow = "auto";

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "btn btn-secondary mt-3";
    closeButton.addEventListener("click", function () {
      document.body.removeChild(modal);
    });

    const title = document.createElement("h3");
    title.textContent = "Clue History";

    const clueList = document.createElement("div");
    fetch(`/api/game/get-room?code=${roomCode}`)
      .then((res) => res.json())
      .then((data) => {
        const latestClues = data.room.clues || [];

        if (latestClues.length > 0) {
          latestClues.forEach(({ username, clue }) => {
            const clueItem = document.createElement("div");
            clueItem.classList.add("mb-2", "p-2", "border", "rounded");
            clueItem.innerHTML = `<strong>${username}</strong>: ${clue}`;
            clueList.appendChild(clueItem);
          });
        } else {
          clueList.textContent = "No clues have been given yet.";
        }
      })
      .catch((err) => {
        clueList.textContent = "Failed to load clue history.";
        console.error("Error fetching clue history:", err);
      });

    modalContent.appendChild(title);
    modalContent.appendChild(clueList);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
  });
      
  openChatBtn.addEventListener('click', function () {
        // Create overlay
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';
    
        // Create modal content container
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.maxWidth = '500px';
        modalContent.style.width = '100%';
        modalContent.style.maxHeight = '80%';
        modalContent.style.display = 'flex';
        modalContent.style.flexDirection = 'column';
    
        // Modal title
        const title = document.createElement('h3');
        title.textContent = 'Chat';
    
        // Chat messages list
        const chatList = document.createElement('div');
        chatList.style.flex = '1';
        chatList.style.overflowY = 'auto';
        chatList.style.marginBottom = '15px';
        chatList.style.border = '1px solid #ccc';
        chatList.style.padding = '10px';
        chatList.style.borderRadius = '5px';
    
        // Fetch and display chat history
        fetch(`/api/game/get-chat?code=${roomCode}`)
            .then(res => res.json())
            .then(data => {
                const messages = data.chat || [];
                if (messages.length > 0) {
                    messages.forEach(({ username, message }) => {
                        const chatItem = document.createElement('div');
                        chatItem.classList.add('mb-2');
                        chatItem.innerHTML = `<strong>${username}</strong>: ${message}`;
                        chatList.appendChild(chatItem);
                    });
                } else {
                    chatList.textContent = 'No chat messages yet.';
                }
            })
            .catch(err => {
                chatList.textContent = 'Failed to load chat history.';
                console.error('Error fetching chat messages:', err);
            });
    
        // Input field
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Type your message...';
        input.className = 'form-control mb-2';
        input.id = 'message-input';
    
        // Submit button
        const submitMessageBtn = document.createElement('button');
        submitMessageBtn.textContent = 'Send';
        submitMessageBtn.className = 'btn btn-primary mb-2';
    
        submitMessageBtn.addEventListener('click', () => {
            const message = input.value.trim();
            if (message) {
                if (chatList.textContent === "No chat messages yet."){
                    chatList.textContent = "";
                }

                socket.emit('submitMessage', { message, username: currentUsername, code:roomCode }); // Sending message
            }
            input.value = '';

        });

        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitMessageBtn.click();
            }
        });
    
        // Listen for incoming chat messages
        socket.on('newMessage', ({ username, message }) => {
            const newMsg = document.createElement('div');
            newMsg.innerHTML = `<strong>${username}</strong>: ${message}`;
            chatList.appendChild(newMsg);
            chatList.scrollTop = chatList.scrollHeight;
        });
    
        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.className = 'btn btn-secondary';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    
        // Append elements
        modalContent.appendChild(title);
        modalContent.appendChild(chatList);
        modalContent.appendChild(input);
        modalContent.appendChild(submitMessageBtn);
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

            // Also submit clue when Enter key is pressed in the input field   
    });
});

