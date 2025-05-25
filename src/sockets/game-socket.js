const { rooms } = require("../routes/game-routes");

function setupGameSocket(io) {
  io.on("connection", (socket) => {
    const code = socket.handshake.query.code;
    const username = socket.handshake.query.username;

    socket.on("disconnect", () => {
      console.log(`${username} disconnected from room ${code}`);
  
      const endTime = Date.now() + 35000; // 35 seconds from now
  
      io.to(code).emit('player-disconnected', {
          room: rooms[code],  
          username: username,
          endTime
      });
  });
  
    socket.on("reconnect", () => {
      console.log(`Client reconnected`);
      io.to(code).emit("player-reconnected", { username: socket.username });
    });

    console.log(`Client connected: ${username} in room ${code}`);

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

          const eliminatedRole = eliminatedPlayer.playerRole;

          console.log(`Eliminating player ${eliminatedPlayer.username} with role ${eliminatedRole}`);
          

          // Find the index of the eliminated player
          const eliminatedIdx = rooms[code].players.findIndex(
            (p) => p.username === eliminatedPlayer.username
          );

          //remove player from room
          if (eliminatedRole !== "mr.white") {
            rooms[code].players = rooms[code].players.filter(
              (p) => p.username !== eliminatedPlayer.username
            );

            io.to(code).emit("player-eliminated", {
              username: eliminatedPlayer.username,
              role: eliminatedPlayer.role || "Unknown",
            });

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
      }
    });

    function removeAllPlayersFromRoom(code) {
      if (!rooms[code]) return;
      rooms[code].players = [];
      rooms[code].votes = {};
      rooms[code].voted = {};
      rooms[code].clues = [];
      rooms[code].chat = [];
    }

    socket.on("mr-white-guess", ({ code, username, guess }) => {
      const room = rooms[code];
      if (!room) return;

      // Find the civilian word
      const civilianWord = room.wordPair?.civilian_word || "";
      const correct =
        guess.trim().toLowerCase() === civilianWord.trim().toLowerCase();

      // Notify only the guessing client of the result
      socket.emit("mr-white-guess-result", {
        correct,
        civilianWord,
      });

      // If correct, Mr. White wins
      if (correct) {
        // End the game, announce Mr. White as winner
        io.to(code).emit("game-over", { winner: "Mr. White" });
        removeAllPlayersFromRoom(code);
      } else {
        const eliminatedPlayer = room.players.find(
          (p) => p.username === username
        );

        // Remove Mr. White from the room's players
        io.to(code).emit("player-eliminated", {
          username: eliminatedPlayer.username,
          role: eliminatedPlayer.playerRole || "mr.white",
        });
        
        room.players = room.players.filter((p) => p.username !== username);


        // Check win condition after Mr. White is eliminated
        const civilians = room.players.filter(
          (p) => p.playerRole === "civilian"
        ).length;
        const impostors = room.players.filter(
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
          removeAllPlayersFromRoom(code);
        } else {
          if (!room.roundNumber) room.roundNumber = 1;
          room.roundNumber += 1;
          room.currentPlayerIndex = 0;
          room.hasSubmittedClue = false;
          room.votes = {};
          room.voted = {};
          io.to(code).emit("new-round", {
            roundNumber: room.roundNumber,
            room,
          });
        }
      }
    });

    socket.on("leave-room", ({ code, username }) => {
      socket.leave(code);
      // Remove player from room's player list
      rooms[code].players = rooms[code].players.filter(
        (p) => p.username !== username
      );

      // If no players left, delete the room
      if (rooms[code].players.length === 0) {
        delete rooms[code];
      } else {
        io.to(code).emit("player-left", { room: rooms[code] });
      }

      console.log(`${username} left room ${code}`);
    });
  });
}

module.exports = setupGameSocket;
