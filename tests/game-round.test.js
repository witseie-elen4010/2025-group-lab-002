// filepath: tests/game-round.test.js

const { Server } = require("socket.io");
const Client = require("socket.io-client");
const http = require("http");
const setupGameSocket = require("../src/sockets/game-socket");
const { rooms } = require("../src/routes/game-routes");

let io, server, port;

describe("Game Round Functionality", () => {
  beforeAll((done) => {
    server = http.createServer();
    io = new Server(server);
    setupGameSocket(io);
    server.listen(() => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  let clients = [];
  beforeEach(() => {
    clients = [];
    // Reset rooms before each test
    for (const code in rooms) delete rooms[code];
  });
  afterEach(() => {
    clients.forEach((c) => c.close());
  });

  test("round number increments and currentPlayerIndex resets after elimination", (done) => {
    const code = "ROUND1";
    rooms[code] = {
      code,
      players: [
        { username: "A", role: "Civilian" },
        { username: "B", role: "Undercover" },
        { username: "C", role: "Civilian" },
      ],
      clues: [],
      currentPlayerIndex: 0,
      hasSubmittedClue: false,
      roundNumber: 1,
      votes: {},
      voted: {},
    };
    clients = [
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
    ];
    let newRoundCount = 0;
    clients[0].on("new-round", ({ roundNumber, room }) => {
      newRoundCount++;
      expect(roundNumber).toBe(2);
      expect(room.currentPlayerIndex).toBe(0);
      expect(room.players.length).toBe(2);
      done();
    });
    // All join
    clients.forEach((c, i) => c.emit("join-room", { code, username: rooms[code].players[i].username }));
    // Simulate votes: eliminate B
    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "B" });
      clients[1].emit("cast-vote", { code, voter: "B", voteFor: "B" });
      clients[2].emit("cast-vote", { code, voter: "C", voteFor: "B" });
    }, 100);
  });

  test("clue submission resets and works for all remaining players in new round", (done) => {
    const code = "ROUND2";
    rooms[code] = {
      code,
      players: [
        { username: "A", role: "Civilian" },
        { username: "B", role: "Undercover" },
        { username: "C", role: "Civilian" },
      ],
      clues: [],
      currentPlayerIndex: 0,
      hasSubmittedClue: false,
      roundNumber: 1,
      votes: {},
      voted: {},
    };
    clients = [
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
    ];
    let clueCount = 0;
    let roundStarted = false;
    clients[0].on("new-round", ({ room }) => {
      roundStarted = true;
      room.players.forEach((player) => {
        // Find the client for this player
        const clientIdx = rooms[code].players.findIndex(
          (p) => p.username === player.username
        );
        if (clientIdx !== -1) {
          clients[clientIdx].emit("submitClue", {
            roomCode: code,
            username: player.username,
            clue: `clue-${player.username}`,
          });
        }
      });
    });
    clients[0].on("clueSubmitted", ({ serverRoom }) => {
      clueCount++;
      if (clueCount === 2) {
        expect(serverRoom.clues.length).toBeGreaterThanOrEqual(2);
        done();
      }
    });
    // All join
    clients.forEach((c, i) => c.emit("join-room", { code, username: rooms[code].players[i].username }));
    // Eliminate C
    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "C" });
      clients[1].emit("cast-vote", { code, voter: "B", voteFor: "C" });
      clients[2].emit("cast-vote", { code, voter: "C", voteFor: "C" });
    }, 100);
  });

  test("round number starts at 1 and increments each round", (done) => {
    const code = "ROUND3";
    rooms[code] = {
      code,
      players: [
        { username: "A", role: "Civilian" },
        { username: "B", role: "Undercover" },
        { username: "C", role: "Civilian" },
      ],
      clues: [],
      currentPlayerIndex: 0,
      hasSubmittedClue: false,
      roundNumber: 1,
      votes: {},
      voted: {},
    };
    clients = [
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
    ];
    let roundNumbers = [];
    clients[0].on("new-round", ({ roundNumber }) => {
      roundNumbers.push(roundNumber);
      if (roundNumbers.length === 2) {
        expect(roundNumbers).toEqual([2, 3]);
        done();
      }
    });
    // All join
    clients.forEach((c, i) => c.emit("join-room", { code, username: rooms[code].players[i].username }));
    // Eliminate B, then A
    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "B" });
      clients[1].emit("cast-vote", { code, voter: "B", voteFor: "B" });
      clients[2].emit("cast-vote", { code, voter: "C", voteFor: "B" });
    }, 100);
    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "A" });
      clients[1].emit("cast-vote", { code, voter: "C", voteFor: "A" });
    }, 400);
  });
});
