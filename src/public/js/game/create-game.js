let socket;

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(sessionStorage.getItem('loggedInUser')) || { username: 'Guest' };
  document.getElementById('username').textContent = user.username;
  let roomCode ; 
  const createRoomButton = document.getElementById('create-room-button');
  const roomCodeContainer = document.getElementById('room-code-container');
  const roomCodeElement = document.getElementById('room-code');

  const joinGameButton = document.getElementById('join-game-button');
  const joinGameContainer = document.getElementById('join-game-container');
  const joinCodeInput = document.getElementById('join-code');
  const submitJoinButton = document.getElementById('submit-join');
  const cancelJoinButton = document.getElementById('cancel-join');

  
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

  joinGameButton.addEventListener('click', () => {
    const isVisible = !joinGameContainer.classList.contains('d-none');
    joinGameContainer.classList.toggle('d-none');

    // Disable both buttons when joining interface is open
    createRoomButton.disabled = !isVisible;
    joinGameButton.disabled = !isVisible;
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
        alert(`Successfully joined room: ${code}`);

        socket = io();
        socket.on('connect', () => {
          console.log('Connected to socket server with ID:', socket.id);
        });

        window.location.href = `/api/game/lobby?code=${code}`;
      } else if (res.status === 400) {
        alert(data.message || 'Game has already started')
      } else {
        alert(data.message || 'Error joining room.');
      }
    } catch (err) {
      console.error('Error joining room:', err);
    } finally {
      joinCodeInput.value = ''; // Clear the input field after attempt
    }
  });

  cancelJoinButton.addEventListener('click', () => {
    const isVisible = joinGameContainer.classList.contains('d-none');
    joinGameContainer.classList.toggle('d-none');

    // Disable both buttons when joining interface is open
    createRoomButton.disabled = isVisible;
    joinGameButton.disabled = isVisible; 
  }); 

  roomCodeElement.addEventListener("click", () => {
    const code = sessionStorage.getItem('roomCode'); 

    navigator.clipboard.writeText(code)
      .then(() => {
        roomCodeElement.textContent = "Copied!";
        setTimeout(() => {
          roomCodeElement.textContent = code;
        }, 1000);
      })
      .catch(err => {
        console.error("Failed to copy!", err);
      });
  });


  // Logout
  logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = '/api/users/landing';
  });
});