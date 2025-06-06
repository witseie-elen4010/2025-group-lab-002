import { displayPlayers, createTurnIndicator, updateTurnDisplay, startDiscussionTime} from "../utils/game-utils.js";
import { setUpSockets } from "../utils/socket-handler.js";


document.addEventListener('DOMContentLoaded', async () => {
  // Get the room code from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get("code");
  let room;
  let currentUsername;
  try {
    const response = await fetch(`/api/game/get-room?code=${roomCode}`);
    const data = await response.json();
    room = data.room;
  } catch (error) {
    console.error("Error fetching room data:", error);
  }

  // Game state
  let wordPair = room.wordPair;

  // DOM elements
  const clueInputContainer = document.getElementById("clue-input-container");
  const submitClueBtn = document.getElementById("submit-clue-btn");
  const playerWordElement = document.getElementById("player-word");
  const showClueHistoryBtn = document.getElementById("show-clue-history-btn");
  const openChatBtn = document.getElementById("open-chat-btn");
  const leaveGameBtn = document.getElementById("leave-game-btn");

  // Add show/hide player word button
  let toggleWordBtn = document.getElementById("toggle-player-word-btn");
  if (!toggleWordBtn) {
    toggleWordBtn = document.createElement("button");
    toggleWordBtn.id = "toggle-player-word-btn";
    toggleWordBtn.className = "btn btn-outline-secondary mb-2";
    toggleWordBtn.style.position = "relative";
    toggleWordBtn.textContent = "Hide Word";
    playerWordElement.parentNode.appendChild(toggleWordBtn);
  }
  
  let wordVisible = true;
  toggleWordBtn.onclick = function () {
    wordVisible = !wordVisible;
    playerWordElement.style.visibility = wordVisible ? "visible" : "hidden";
    toggleWordBtn.textContent = wordVisible ? "Hide Word" : "Show Word";
  };


  const socket = setUpSockets();
  // Initialize Socket.io connection

  // Display room code
  document.getElementById("room-code").textContent = roomCode;

  // Use the room data we already have
  try {
    // We already have room from: let room = rooms[roomCode]
    displayPlayers(room);

    // Get current user info from localStorage
    const user = JSON.parse(sessionStorage.getItem("loggedInUser")) || {
      username: "Guest",
    };
    currentUsername = user.username;

    const currentPlayer = room.players.find(
      (p) => p.username === currentUsername
    );

    // Store word pair
    if (room.wordPair) {
      wordPair = room.wordPair;

      if (currentPlayer.playerRole === "undercover") {
        playerWordElement.textContent = wordPair.undercover_word;
      }
      else if (currentPlayer.playerRole === "civilian") {
        playerWordElement.textContent = wordPair.civilian_word;
      }
      else if (currentPlayer.playerRole === "mr.white") {
        playerWordElement.textContent = "You are Mr. White!";
      }
    }

    // Initialize turn system
    createTurnIndicator();
    updateTurnDisplay(room);

    // Let the server know we're ready
    socket.emit("join-room", { code: roomCode, username: currentUsername });
  } catch (error) {
    console.error("Error processing room data:", error);
    playerWordElement.textContent = "Error loading game data";
  }

  // Handle leaving the game
  leaveGameBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to leave the game?")) {
      socket.emit("leave-room", { code: roomCode, username: currentUsername });
      window.location.href = "/api/game/join"; // Redirect to home page

      await fetch('/api/admin/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            action: 'leave-game',
            details: `User ${currentUsername} left game with code ${roomCode}.`,
            username: `${currentUsername}`,
            room: roomCode, // or replace with a room if relevant
            ip_address: null // optionally capture on the backend if needed
            })
        });
    }
  });

  submitClueBtn.addEventListener("click", async function () {
    const clueInput = document.getElementById("clue-input");
    const clue = clueInput.value.trim();
  
    if (clue.length > 20) {
      alert("Clue must be 20 characters or less!");
      return;
    }
  
    if (clue && !room.hasSubmittedClue) {
      room.hasSubmittedClue = true;
  
      clueInput.value = "";
      clueInputContainer.style.display = "none";
      clueInput.disabled = true;
      submitClueBtn.disabled = true;
  
      // Emit the clue to the server with the clue object
      socket.emit("submitClue", {
        roomCode,
        username: currentUsername,
        clue,
      });


      await fetch('/api/admin/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'submit-clue',
              details: `User ${currentUsername} submitted clue: ${clue}.`,
              username: `${currentUsername}`,
              room: room.code, // or replace with a room if relevant
              ip_address: null // optionally capture on the backend if needed
            })
      });
    }
  });

  // Also submit clue when Enter key is pressed in the input field
  document
    .getElementById("clue-input")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter" && !room.hasSubmittedClue) {
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

  openChatBtn.addEventListener("click", function () {
    // Create overlay
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

    // Create modal content container
    const modalContent = document.createElement("div");
    modalContent.style.backgroundColor = "white";
    modalContent.style.padding = "20px";
    modalContent.style.borderRadius = "10px";
    modalContent.style.maxWidth = "500px";
    modalContent.style.width = "100%";
    modalContent.style.maxHeight = "80%";
    modalContent.style.display = "flex";
    modalContent.style.flexDirection = "column";

    // Modal title
    const title = document.createElement("h3");
    title.textContent = "Chat";

    // Chat messages list
    const chatList = document.createElement("div");
    chatList.style.flex = "1";
    chatList.style.overflowY = "auto";
    chatList.style.marginBottom = "15px";
    chatList.style.border = "1px solid #ccc";
    chatList.style.padding = "10px";
    chatList.style.borderRadius = "5px";

    // Fetch and display chat history
    fetch(`/api/game/get-chat?code=${roomCode}`)
      .then((res) => res.json())
      .then((data) => {
        const messages = data.chat || [];
        if (messages.length > 0) {
          messages.forEach(({ username, message }) => {
            const chatItem = document.createElement("div");
            chatItem.classList.add("mb-2");
            chatItem.innerHTML = `<strong>${username}</strong>: ${message}`;
            chatList.appendChild(chatItem);
          });
        } else {
          chatList.textContent = "No chat messages yet.";
        }
      })
      .catch((err) => {
        chatList.textContent = "Failed to load chat history.";
        console.error("Error fetching chat messages:", err);
      });

    // Input field
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type your message...";
    input.className = "form-control mb-2";
    input.id = "message-input";

    // Submit button
    const submitMessageBtn = document.createElement("button");
    submitMessageBtn.textContent = "Send";
    submitMessageBtn.className = "btn btn-primary mb-2";

    submitMessageBtn.addEventListener("click", async () => {
      const message = input.value.trim();
      if (message) {
        if (chatList.textContent === "No chat messages yet.") {
          chatList.textContent = "";
        }

        socket.emit("submitMessage", {
          message,
          username: currentUsername,
          code: roomCode,
        }); // Sending message

        await fetch('/api/admin/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          action: 'submit-message',
          details: `User ${currentUsername} submitted message:  ${message}.`,
          username: `${currentUsername}`,
          room: roomCode, // or replace with a room if relevant
          ip_address: null // optionally capture on the backend if needed
          })
      });
      }
      input.value = "";
    });

    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        submitMessageBtn.click();
      }
    });

    // Listen for incoming chat messages
    socket.on("newMessage", async ({ username, message }) => {
      const newMsg = document.createElement("div");
      newMsg.innerHTML = `<strong>${username}</strong>: ${message}`;
      chatList.appendChild(newMsg);
      chatList.scrollTop = chatList.scrollHeight;
    });

    // Close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "btn btn-secondary";
    closeButton.addEventListener("click", () => {
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

  // Listen for new-round event to update round number display
  socket.on("new-round", ({ roundNumber, room: serverRoom }) => {
    room = serverRoom; // Always use latest server state
    // Update round number at the top of the page
    const roundDisplay = document.getElementById("round-number-display");
    if (roundDisplay) {
      roundDisplay.textContent = `Round ${roundNumber}`;
    }

    room.roundClues = [];
    // Re-render player list and turn indicator using server state
    displayPlayers(room);
    updateTurnDisplay(room);

    // Hide vote form if present
    const voteForm = document.getElementById("vote-form");
    if (voteForm) voteForm.style.display = "none";
    // Remove eliminated player highlight
    document.querySelectorAll(".player").forEach((playerDiv) => {
      playerDiv.classList.remove("eliminated-player");
      playerDiv.style.opacity = "1";
    });
  });

  // Listen for startVoting event from server
  socket.on("startVoting", (room) => {
    // Hide clue input container
    clueInputContainer.style.display = "none";
    // Show voting form
    const voteForm = document.getElementById("vote-form");
    if (voteForm) {
      voteForm.style.display = "block";
      // Enable the vote button for the current user
      const btn = voteForm.querySelector("button[type='submit']");
      if (btn) btn.disabled = false;
    }
  });

  // Character counter logic
  const clueInput = document.getElementById("clue-input");
  const charCounter = document.getElementById("char-counter");

  clueInput.addEventListener("input", function () {
    const count = this.value.length;
    charCounter.textContent = `${count}/20`;
    if (count > 20
    ) {
      charCounter.style.color = "red";
    } else {
      charCounter.style.color = "#666";
    }
  });
});


