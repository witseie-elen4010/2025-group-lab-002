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
    let currentUsername = ''; 
    let wordPair = room.wordPair;
    let hasSubmittedClue = false; // Track if current player has submitted a clue
    
    // DOM elements
    const clueInputContainer = document.getElementById('clue-input-container');
    const submitClueBtn = document.getElementById('submit-clue-btn');
    const playerWordElement = document.getElementById('player-word');
    
    // Initialize Socket.io connection
    const socket = io();
    
    // Display room code
    document.getElementById('room-code').textContent = roomCode;
    
    // Listen for current turn updates from server
    socket.on('update-turn', (data) => {
        currentPlayerIndex = data.currentPlayerIndex;
        // Reset the clue submission flag when it's a new player's turn
        if (players[currentPlayerIndex].username === currentUsername) {
            hasSubmittedClue = false;
        }
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
        const { playerIndex, clue } = data;
        // Display the clue in the player's speech bubble
        const playerDiv = document.querySelector(`.player[data-player-index="${playerIndex}"]`);
        if (playerDiv) {
            const speechBubble = playerDiv.querySelector('.speech-bubble');
            speechBubble.textContent = clue;
            speechBubble.classList.add('has-clue');
            speechBubble.style.display = 'block'; // Show the speech bubble
        }
    });
    

    // Use the room data we already have
    try {
        // We already have room from: let room = rooms[roomCode]
        players = room.players;
        displayPlayers(players);
        
        // Get current user info from localStorage
        const user = JSON.parse(localStorage.getItem('loggedInUser')) || { username: 'Guest' };
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
        console.log(players);
        
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
            // Mark that this player has submitted their clue
            hasSubmittedClue = true;
            
            // Display the clue in the current player's speech bubble
            const currentPlayerDiv = document.querySelector(`.player[data-player-index="${currentPlayerIndex}"]`);
            const speechBubble = currentPlayerDiv.querySelector('.speech-bubble');
            speechBubble.textContent = clue;
            speechBubble.classList.add('has-clue');
            speechBubble.style.display = 'block'; // Show the speech bubble
            
            // Clear input
            clueInput.value = '';
            
            // Hide the clue input container after submission
            clueInputContainer.style.display = 'none';
            
            // Disable input and button after submission
            document.getElementById('clue-input').disabled = true;
            submitClueBtn.disabled = true;
            
            // Emit the clue to the server via socket.io
            socket.emit('submitClue', {
                roomCode,
                username: currentUsername,
                playerIndex: currentPlayerIndex,
                clue
            });
            
            // Move to the next player's turn after submitting a clue
            const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
            currentPlayerIndex = nextPlayerIndex;
            
            // Emit an event to update all clients about the turn change
            socket.emit('nextTurn', {
                roomCode,
                currentPlayerIndex: nextPlayerIndex
            });
            
            // Update the turn display locally
            updateTurnDisplay();
            
            // Check if this was the last player to give a clue
            if (currentPlayerIndex === 0) {
                // If we've gone through all players, start discussion time
                startDiscussionTime();
            }
        }
    });
    
    // Also submit clue when Enter key is pressed in the input field
    document.getElementById('clue-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !hasSubmittedClue) {
            submitClueBtn.click();
        }
    });
});
