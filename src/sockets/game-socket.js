const { rooms } = require("../routes/game-routes");

function setupGameSocket(io) {
  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("join-room", ({ code, username }) => {
      socket.join(code);
      io.to(code).emit("player-joined", { room: rooms[code], username });
      io.to(code).emit("player-joined-lobby", { roomData: rooms[code] });
      console.log(`${username} joined room ${code}`);
    });

    socket.on("start-game", ({ room }) => {
      rooms[room.code] = room;
      rooms[room.code].roundNumber = 1;
      io.to(room.code).emit("start-game");
      io.to(room.code).emit("new-round", {
        roundNumber: 1,
        room: rooms[room.code],
      }); // Emit initial round
      console.log(`Game started in room ${room.code}`);
    });

    socket.on("room-created", ({ code, username }) => {
      socket.join(code);
      console.log(`Room ${code} created by ${username}`);
    });

    socket.on("user-joined", ({ username, code }) => {
      console.log(`${username} joined your room ${code}.`);
    });

    socket.on("submitClue", ({ roomCode, username, clue }) => {
      const room = rooms[roomCode]; // however you're storing room state
      room.clues.push({ username, clue });
      io.to(roomCode).emit("clueSubmitted", { serverRoom: room });
      // Advance turn
      room.currentPlayerIndex =
        (room.currentPlayerIndex + 1) % room.players.length;
      room.hasSubmittedClue = false;

      if (room.currentPlayerIndex === 0) {
        // You can emit a new event like 'start-discussion'
        io.to(roomCode).emit("startDiscussion", room);
      } else {
        // Otherwise, update turn as usual
        io.to(roomCode).emit("update-turn", room);
      }
    });

    socket.on("submitMessage", ({ message, username, code }) => {
      const room = rooms[code];
      if (!room) return; // Optional: guard against invalid code

      room.chat.push({ username, message });

      io.to(code).emit("newMessage", {
        username,
        message,
      });
    });

    socket.on("startVoting", (room) => {
      io.to(room.code).emit("startVoting", room);
    });

    socket.on("cast-vote", ({ code, voter, voteFor }) => {
      if (!rooms[code] || !rooms[code].players) return;

      // Initialize votes and voted if not present
      if (!rooms[code].votes) {
        rooms[code].votes = {};
        rooms[code].players.forEach((p) => (rooms[code].votes[p.username] = 0));
      }
      if (!rooms[code].voted) rooms[code].voted = {};

      // Prevent double voting
      if (rooms[code].voted[voter]) return;

      rooms[code].votes[voteFor] = (rooms[code].votes[voteFor] || 0) + 1;
      rooms[code].voted[voter] = true;

      io.to(code).emit("vote-update", rooms[code].votes);
      socket.emit("vote-confirmation", voter);

      // Check if all players have voted
      const totalPlayers = rooms[code].players.length;
      const totalVotes = Object.keys(rooms[code].voted).length;
      if (totalVotes === totalPlayers) {
        io.to(code).emit("voting-complete", { votes: rooms[code].votes });
        // Find max votes
        const votes = rooms[code].votes;
        let maxVotes = 0;
        let eliminated = [];
        for (const [username, count] of Object.entries(votes)) {
          if (count > maxVotes) {
            maxVotes = count;
            eliminated = [username];
          } else if (count === maxVotes) {
            eliminated.push(username);
          }
        }

        if (eliminated.length > 1) {
          // Tie: trigger revote
          io.to(code).emit("revote", { tiedPlayers: eliminated });
          rooms[code].votes = {};
          rooms[code].voted = {};
          rooms[code].players.forEach((p) => {
            if (eliminated.includes(p.username)) {
              rooms[code].votes[p.username] = 0;
            }
          });
        } else {
          // Eliminate player and reveal role
          const eliminatedPlayer = rooms[code].players.find(
            (p) => p.username === eliminated[0]
          );
          io.to(code).emit("player-eliminated", {
            username: eliminatedPlayer.username,
            role: eliminatedPlayer.role || "Unknown",
          });
          // Find the index of the eliminated player
          const eliminatedIdx = rooms[code].players.findIndex(
            (p) => p.username === eliminatedPlayer.username
          );
          // Remove player from room
          rooms[code].players = rooms[code].players.filter(
            (p) => p.username !== eliminatedPlayer.username
          );

          //check win condition
          const civilians = rooms[code].players.filter(
            (p) => p.playerRole === "civilian"
          ).length;
          const impostors = rooms[code].players.filter(
            (p) => p.playerRole === "undercover" || p.playerRole === "mr.white"
          ).length;

          let winner = null;
          if (impostors === 0) {
            winner = "Civilians";
          } else if (civilians <= 1) {
            winner = "Impostors";
          }

          if (winner) {
            io.to(code).emit("game-over", { winner });
          } else {
            // Update currentPlayerIndex: if eliminated player was before or at the current index, decrement index
            if (rooms[code].currentPlayerIndex > eliminatedIdx) {
              rooms[code].currentPlayerIndex -= 1;
            }
            // If currentPlayerIndex is now out of bounds (e.g. last player was eliminated), reset to 0
            if (rooms[code].currentPlayerIndex >= rooms[code].players.length) {
              rooms[code].currentPlayerIndex = 0;
            }
            rooms[code].votes = {};
            rooms[code].voted = {};
            // Reset clue submission state for new round
            rooms[code].hasSubmittedClue = false;

            // Increment round number and reset currentPlayerIndex for new round
            if (!rooms[code].roundNumber) rooms[code].roundNumber = 1;
            rooms[code].roundNumber += 1;
            rooms[code].currentPlayerIndex = 0;

            // Emit new round event to all clients
            io.to(code).emit("new-round", {
              roundNumber: rooms[code].roundNumber,
              room: rooms[code],
            });
          }
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
}

module.exports = setupGameSocket;
