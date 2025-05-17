function setupGameSocket(io, rooms) {
  io.on("connection", (socket) => {
    socket.on("join-room", ({ code, username }) => {
      socket.join(code);
      io.to(code).emit("player-joined", { username });

      console.log(`${username} joined room ${code}`);
    });

    socket.on("cast-vote", ({ code, voter, voteFor }) => {
      if (!rooms[code] || !rooms[code].players) return;

      // TEMPORARY: Assign roles if not already assigned
      if (!rooms[code].players[0].role) {
        const roles = ["Civilian", "Civilian", "Undercover", "Mr. White"];
        rooms[code].players.forEach((player, i) => {
          player.role = roles[i % roles.length];
        });
      }

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
          // Remove player from room
          rooms[code].players = rooms[code].players.filter(
            (p) => p.username !== eliminatedPlayer.username
          );
          rooms[code].votes = {};
          rooms[code].voted = {};
        }
      }
    });

    socket.on("start-game", (code) => {
      io.to(code).emit("game-started");
    });
  });
}

module.exports = setupGameSocket;
