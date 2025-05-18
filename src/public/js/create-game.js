let socket;

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(sessionStorage.getItem('loggedInUser')) || { username: 'Guest' };
  document.getElementById('username').textContent = user.username;

  const createRoomButton = document.getElementById('create-room-button');
  const roomCodeContainer = document.getElementById('room-code-container');
  const roomCodeElement = document.getElementById('room-code');
  const wordPairContainer = document.getElementById('word-pair-container');
  const civilianWordElement = document.getElementById('civilian-word');
  const undercoverWordElement = document.getElementById('undercover-word');

  const joinGameButton = document.getElementById('join-game-button');
  const joinGameContainer = document.getElementById('join-game-container');
  const joinCodeInput = document.getElementById('join-code');
  const submitJoinButton = document.getElementById('submit-join');

  document.getElementById('go-to-voting').addEventListener('click', () => {
    window.location.href = 'voting-round';
  });
  
  const logoutButton = document.getElementById('logout-button');

  // Handle room creation (HTTP + socket)
  createRoomButton.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/game/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: user.username })
      });

      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem('roomCode', data.code);
        roomCodeElement.textContent = data.code;
        roomCodeContainer.classList.remove('d-none');

        civilianWordElement.textContent = data.rooms[data.code].wordPair.civilian_word;
        undercoverWordElement.textContent = data.rooms[data.code].wordPair.undercover_word;
        wordPairContainer.classList.remove('d-none');

        socket = io();
        socket.on('connect', async () => {
          console.log('Connected to socket server with ID:', socket.id);
          socket.emit('room-created', { code: data.code, username: user.username });
        });
      } else {
        alert('Failed to create room.');
      }
    } catch (err) {
      console.error('Error creating room:', err);
    }
  });

  // Handle "Join Game" button click
  joinGameButton.addEventListener('click', () => {
    joinGameContainer.classList.toggle('d-none');
  });

  // Handle join room (HTTP + socket)
  submitJoinButton.addEventListener('click', async () => {
    const code = joinCodeInput.value.trim().toUpperCase();
    if (!code) return alert('Please enter a room code.');

    try {
      const res = await fetch('/api/game/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, username: user.username })
      });

      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem('roomCode', code);
        document.getElementById('go-to-voting').classList.remove('d-none');
        alert(`Successfully joined room: ${code}`);

        socket = io();
        socket.on('connect', () => {
          console.log('Connected to socket server with ID:', socket.id);
        });

        socket.on('user-joined', ({ username }) => {
          console.log(`${username} joined the room.`);
        });

        window.location.href = `/api/game/lobby?code=${code}`;
      } else {
        alert(data.message || 'Error joining room.');
      }
    } catch (err) {
      console.error('Error joining room:', err);
    }
  });
  // Logout
  logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = '/api/users/login';
  });
});