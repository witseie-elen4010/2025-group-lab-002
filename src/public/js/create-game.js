let socket;

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('loggedInUser')) || { username: 'Guest' };
  document.getElementById('username').textContent = user.username;

  const createRoomButton = document.getElementById('create-room-button');
  const roomCodeContainer = document.getElementById('room-code-container');
  const roomCodeElement = document.getElementById('room-code');

  const joinGameButton = document.getElementById('join-game-button');
  const joinGameContainer = document.getElementById('join-game-container');
  const joinCodeInput = document.getElementById('join-code');
  const submitJoinButton = document.getElementById('submit-join');

  const logoutButton = document.getElementById('logout-button');

  // Handle room creation (HTTP + socket)
  createRoomButton.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/game/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (res.ok) {
        roomCodeElement.textContent = data.code;
        roomCodeContainer.classList.remove('d-none');

        socket = io();
        socket.on('connect', () => {
          console.log('Connected to socket server with ID:', socket.id);
          socket.emit('room-created', { username: user.username, roomCode: data.code });
        });

        socket.on('user-joined', ({ username }) => {
          console.log(`${username} joined your room.`);
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
        alert(`Successfully joined room: ${code}`);

        socket = io();
        socket.on('connect', () => {
          console.log('Connected to socket server with ID:', socket.id);
          socket.emit('join-room', { username: user.username, roomCode: code });
        });

        socket.on('user-joined', ({ username }) => {
          console.log(`${username} joined the room.`);
        });
      } else {
        alert(data.message || 'Error joining room.');
      }
    } catch (err) {
      console.error('Error joining room:', err);
    }
  });

  // Logout
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login';
  });
});