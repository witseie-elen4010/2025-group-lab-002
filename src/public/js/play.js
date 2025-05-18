document.addEventListener('DOMContentLoaded', async function() {
    // Get the room code from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('code');
    try {
        const response = await fetch(`/api/game/get-room?code=${roomCode}`);
        const data = await response.json();
        room = data.room;
    } catch (error) {
        console.error('Error fetching room data:', error);
    }
    
    // Game state
    let currentPlayerIndex = 0;
    let players = room.players; 
    let wordPair = room.wordPair;
    let hasSubmittedClue = false; // Track if current player has submitted a clue

    // DOM elements
    const clueInputContainer = document.getElementById('clue-input-container');
    const submitClueBtn = document.getElementById('submit-clue-btn');
    const playerWordElement = document.getElementById('player-word');
    const showClueHistoryBtn = document.getElementById('show-clue-history-btn');
    
    // Initialize Socket.io connection
    const socket = io();
    
    // Display room code
    document.getElementById('room-code').textContent = roomCode;
    
    // Listen for current turn updates from server
    socket.on('update-turn', (data) => {
        console.log('Received update-turn event:', data);
        currentPlayerIndex = data.currentPlayerIndex;
        hasSubmittedClue = false; // Always reset on server turn broadcast
        updateTurnDisplay();
    });
    
    // Listen for new player joining
    socket.on('player-joined', async({username}) => {
        console.log(`username: ${username}`);

        try {
            const response = await fetch(`/api/game/get-room?code=${roomCode}`);
            const data = await response.json();
            room = data.room;
        } catch (error) {
            console.error('Error fetching room data:', error);
        }
        
        displayPlayers(room.players);
        updateTurnDisplay();
    });
 
    // Listen for clue submissions
    socket.on('clueSubmitted', (data) => {
        const { playerIndex, clue, clueObject } = data;
    
        // Add to local clue history
        if (!room.clues) room.clues = [];
        room.clues.push(clueObject);
    
        // Display clue in speech bubble
        const playerDiv = document.querySelector(`.player[data-player-index="${playerIndex}"]`);
        if (playerDiv) {
            const speechBubble = playerDiv.querySelector('.speech-bubble');
            speechBubble.textContent = clue;
            speechBubble.classList.add('has-clue');
            speechBubble.style.display = 'block';
        }
    });

    // Use the room data we already have
    try {
        // We already have room from: let room = rooms[roomCode]
        players = room.players;
        displayPlayers(players);
        
        // Get current user info from localStorage
        const user = JSON.parse(sessionStorage.getItem('loggedInUser')) || { username: 'Guest' };
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
        socket.emit('join-room', { code: roomCode, username: currentUsername });
    } catch (error) {
        console.error('Error processing room data:', error);
        playerWordElement.textContent = 'Error loading game data';
    }
    
    function displayPlayers(players) {
        const container = document.getElementById('players-container');
        container.innerHTML = ''; // Clear container
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33']; // Different colors for each player
        
        for (let index = 0; index < players.length; index++) {
            const player = players[index];
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player';
            playerDiv.dataset.playerIndex = index;
            
            const circle = document.createElement('div');
            circle.className = 'player-circle';
            circle.style.backgroundColor = colors[index % colors.length];
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'player-name';
            nameDiv.textContent = player.username;
            
            const speechBubble = document.createElement('div');
            speechBubble.className = 'speech-bubble';
            speechBubble.style.display = 'none'; // Hide speech bubble by default
            
            playerDiv.appendChild(circle);
            playerDiv.appendChild(nameDiv);
            playerDiv.appendChild(speechBubble);
            container.appendChild(playerDiv);
        }
    }
    
    function createTurnIndicator() {
        // Create turn indicator if it doesn't exist
        if (!document.querySelector('.turn-indicator')) {
            const turnIndicator = document.createElement('div');
            turnIndicator.className = 'turn-indicator';
            document.body.insertBefore(turnIndicator, document.querySelector('.word-display'));
        }
    }
    
    function updateTurnDisplay() {
        const turnIndicator = document.querySelector('.turn-indicator');
        console.log(`CURRENT PLAYER INDEX: ${currentPlayerIndex}`)
        const currentPlayer = players[currentPlayerIndex];
        
        if (!currentPlayer) return; // Guard against undefined players
        
        turnIndicator.textContent = `${currentPlayer.username}'s Turn`;
        
        // Highlight current player
        document.querySelectorAll('.player').forEach((playerDiv, index) => {
            if (index === currentPlayerIndex) {
                playerDiv.classList.add('current-player');
            } else {
                playerDiv.classList.remove('current-player');
            }
        });
        
        console.log(`current player: ${currentPlayer.playerID}`);

        // Show or hide clue input container based on turn and submission status
        if (currentPlayer.username === currentUsername && !hasSubmittedClue) {
            // Show clue input only if it's the current user's turn and they haven't submitted a clue yet
            clueInputContainer.style.display = 'block';
            document.getElementById('clue-input').disabled = false;
            submitClueBtn.disabled = false;
            // Auto-focus the input field when it's the player's turn
            setTimeout(() => {
                document.getElementById('clue-input').focus();
            }, 300);
        } else {
            // Hide clue input if it's not their turn or they've already submitted
            clueInputContainer.style.display = 'none';
            document.getElementById('clue-input').disabled = true;
            submitClueBtn.disabled = true;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    function startDiscussionTime() {
        // This function will be implemented later
        console.log("Starting discussion time...");
        
        // After discussion time is over, start voting
        setTimeout(() => {
            startVoting();
        }, 5000); // Placeholder timeout, will be replaced with actual implementation
    }
    
    function startVoting() {
        // This function will be implemented later
        console.log("Starting voting phase...");
        //CLEAR THE CLUES
    }
    
    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    // Handle clue submission
    submitClueBtn.addEventListener('click', function() {
        const clueInput = document.getElementById('clue-input');
        const clue = clueInput.value.trim();

        if (clue && !hasSubmittedClue) {
            hasSubmittedClue = true;

            // Display the clue in the current player's speech bubble
            const currentPlayerDiv = document.querySelector(`.player[data-player-index="${currentPlayerIndex}"]`);
            const speechBubble = currentPlayerDiv.querySelector('.speech-bubble');
            speechBubble.textContent = clue;
            speechBubble.classList.add('has-clue');
            speechBubble.style.display = 'block';

            clueInput.value = '';
            clueInputContainer.style.display = 'none';
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
            socket.emit('submitClue', {
                roomCode,
                username: currentUsername,
                playerIndex: currentPlayerIndex,
                clue,
                clueObject: clueObject
            });
        }
    });
    
    // Also submit clue when Enter key is pressed in the input field
    document.getElementById('clue-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !hasSubmittedClue) {
            submitClueBtn.click();
        }
    });
    
    // Handle show clue history button click
    showClueHistoryBtn.addEventListener('click', function() {
        // Create a modal to display clue history
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
        
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.maxWidth = '80%';
        modalContent.style.maxHeight = '80%';
        modalContent.style.overflow = 'auto';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.className = 'btn btn-secondary mt-3';
        closeButton.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        const title = document.createElement('h3');
        title.textContent = 'Clue History';
        
        const clueList = document.createElement('div');
        fetch(`/api/game/get-room?code=${roomCode}`)
        .then(res => res.json())
        .then(data => {
          const latestClues = data.room.clues || [];
      
          if (latestClues.length > 0) {
            latestClues.forEach(({ username, clue }) => {
              const clueItem = document.createElement('div');
              clueItem.classList.add('mb-2', 'p-2', 'border', 'rounded');
              clueItem.innerHTML = `<strong>${username}</strong>: ${clue}`;
              clueList.appendChild(clueItem);
            });
          } else {
            clueList.textContent = 'No clues have been given yet.';
          }
        })
        .catch(err => {
          clueList.textContent = 'Failed to load clue history.';
          console.error('Error fetching clue history:', err);
        });
        
        modalContent.appendChild(title);
        modalContent.appendChild(clueList);
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
    });
});
