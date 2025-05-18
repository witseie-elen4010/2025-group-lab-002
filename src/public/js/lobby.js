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

    roomCodeDisplay.textContent = roomCode;

    const user = JSON.parse(localStorage.getItem('loggedInUser')) || { username: 'Guest' };
    currentUsername = user.username;

    const socket = io();

    socket.emit('join-room', { code: roomCode, username: currentUsername });

    async function fetchRoomData() {
        try {
            const response = await fetch(`/api/game/get-room?code=${roomCode}`);
            const data = await response.json();
            room = data.room;
            players = room.players || [];
            isHost = room.host === currentUsername;
            renderPlayerList();
            updateStartButtonVisibility();
        } catch (error) {
            console.error('Error fetching room data:', error);
        }
    }

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
        if (players.length === 4) {
            startGameButton.style.display = 'block';
            startGameButton.disabled = false;
        } else {
            startGameButton.style.display = 'none'; // or keep it `block` but set `.disabled = true` if you prefer
            startGameButton.disabled = true;
        }
    }

    startGameButton.addEventListener('click', () => {
        if (players.length === 4) {
            socket.emit('start-game', { code: roomCode });
        }
    });

    socket.on('start-game', () => {
        window.location.href = `/api/game/play?code=${roomCode}`;
    });

    await fetchRoomData();
});