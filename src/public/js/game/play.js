import { displayPlayers, createTurnIndicator, updateTurnDisplay, startDiscussionTime} from "../utils/game-utils.js";
import { setUpSockets } from "../utils/socket-handler.js";


class Player {
    constructor(username, role) {
      this.username = username;
      this.role = role;
    }
}
  

document.addEventListener('DOMContentLoaded', async function () {
    // Get the room code from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get("code");
    let room 
    let currentUsername
    try {
      const response = await fetch(`/api/game/get-room?code=${roomCode}`);
      const data = await response.json();
      room = data.room;
      console.log(`players role: ${room.players[0].playerRole}`);
    } catch (error) {
      console.error("Error fetching room data:", error);
    }
  
    // Game state
    let votingRound = null;
    let currentPlayerIndex = 0;
    let players = room.players;
    let wordPair = room.wordPair;
  
    // DOM elements
    const clueInputContainer = document.getElementById("clue-input-container");
    const submitClueBtn = document.getElementById("submit-clue-btn");
    const playerWordElement = document.getElementById("player-word");
    const showClueHistoryBtn = document.getElementById("show-clue-history-btn");
    const openChatBtn = document.getElementById("open-chat-btn");

    const socket = io();
    setUpSockets(socket);
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
    // Store word pair
    if (room.wordPair) {
      wordPair = room.wordPair;
      playerWordElement.textContent = wordPair.civilian_word; // Show civilian word to current player
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


  // Handle clue submission
  submitClueBtn.addEventListener("click", function () {
    const clueInput = document.getElementById("clue-input");
    const clue = clueInput.value.trim();

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
        clue
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

