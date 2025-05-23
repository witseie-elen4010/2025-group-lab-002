
document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('code');

    let room = {};
    let players = [];
    let currentUsername = '';
    let isHost = false;

    const playerListContainer = document.getElementById('player-list');
    const roomCodeDisplay = document.getElementById('room-code');
    const startGameButton = document.getElementById('start-game-btn');
    const leaveLobbyButton = document.getElementById('leave-lobby-btn');

    roomCodeDisplay.textContent = roomCode;

    const user = JSON.parse(sessionStorage.getItem('loggedInUser')) || { username: 'Guest' };
    currentUsername = user.username;

    const socket = io();

    socket.emit('join-room', { code: roomCode, username: currentUsername });


    socket.on('player-joined-lobby', ({ roomData }) => {
        room = roomData;
        players = room.players;
        isHost = room.host === currentUsername;
        renderPlayerList();
        updateStartButtonVisibility();
    });

    function renderPlayerList() {
        const playerListContainer = document.getElementById('player-list');
        const playerCount = document.getElementById('player-count');
        playerListContainer.innerHTML = '';
      
        players.forEach((player) => {
          const playerEl = document.createElement('div');
          playerEl.className = 'player-box';
          playerEl.textContent = player.username;
          playerListContainer.appendChild(playerEl);
        });
      
        playerCount.textContent = `${players.length} player${players.length === 1 ? '' : 's'} joined`;
    }

    function updateStartButtonVisibility() {
        if (players.length >= 3) {
            startGameButton.style.display = 'block';
            startGameButton.disabled = false;
        } else {
            startGameButton.style.display = 'none';
            startGameButton.disabled = true;
        }
    }

    startGameButton.addEventListener('click', async () => {
        if (players.length >= 3) {
            console.log('Starting game with players:', players);
            const res = await fetch('/api/game/assign-roles-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ players:players }),
            });
            const data = await res.json();
            console.log('Assigned roles:', data.players);
            room.players = data.players;
            room.hasGameStarted = true;
            room.code = roomCode; // Add room code to the room object
            socket.emit('start-game', { room });
            if (res.ok){             
                await fetch('/api/admin/log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    action: 'start-game',
                    details: `User ${currentUsername} started game with code ${room.code}.`,
                    username: `${currentUsername}`,
                    room: room.code, // or replace with a room if relevant
                    ip_address: null // optionally capture on the backend if needed
                    })
                });
            }
        }
    });

    roomCodeDisplay.addEventListener("click", () => {
        const code = sessionStorage.getItem('roomCode'); 

        navigator.clipboard.writeText(code)
        .then(() => {
            roomCodeDisplay.textContent = "Copied!";
            setTimeout(() => {
            roomCodeDisplay.textContent = code;
            }, 1000);
        })
        .catch(err => {
            console.error("Failed to copy!", err);
        });
    });

    socket.on('start-game', () => {
        window.location.href = `/api/game/play?code=${roomCode}`;
    });

    leaveLobbyButton.addEventListener('click', () => {
        socket.emit('leave-room', { code: roomCode, username: currentUsername });
        sessionStorage.removeItem('roomCode');
        window.location.href = '/api/game/join';
    });

    socket.on('player-left', ({ room }) => {
        players = room.players;
        renderPlayerList();
        updateStartButtonVisibility();
    });
});