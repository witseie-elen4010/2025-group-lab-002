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

  test("round number increments and currentPlayerIndex resets after elimination if game not over", (done) => {
    const code = "ROUND1";
    rooms[code] = {
      code,
      players: [
        { username: "A", playerRole: "civilian" },
        { username: "B", playerRole: "undercover" },
        { username: "C", playerRole: "civilian" },
        { username: "D", playerRole: "civilian" },
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
      Client(`http://localhost:${port}`)
    ];
    let newRoundReceived = false;
    let gameOverReceived = false;
    clients[0].on("new-round", ({ roundNumber, room }) => {
      newRoundReceived = true;
      expect(roundNumber).toBe(2);
      expect(room.currentPlayerIndex).toBe(0);
      expect(room.players.length).toBe(3);
      setTimeout(() => {
        expect(gameOverReceived).toBe(false);
        done();
      }, 100);
    });
    clients[0].on("game-over", () => {
      gameOverReceived = true;
    });
    // All join
    clients.forEach((c, i) => c.emit("join-room", { code, username: rooms[code].players[i].username }));

    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "C" });
      clients[1].emit("cast-vote", { code, voter: "B", voteFor: "C" });
      clients[2].emit("cast-vote", { code, voter: "C", voteFor: "B" });
      clients[3].emit("cast-vote", { code, voter: "D", voteFor: "C" });
    }, 100);
  });

  test("clue submission resets and works for all remaining players in new round", (done) => {
    const code = "ROUND2";
    rooms[code] = {
      code,
      players: [
        { username: "A", playerRole: "civilian" },
        { username: "B", playerRole: "undercover" },
        { username: "C", playerRole: "civilian" },
        { username: "D", playerRole: "civilian" },
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
      Client(`http://localhost:${port}`)
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
      if (clueCount === 3) {
        expect(serverRoom.clues.length).toBeGreaterThanOrEqual(3);
        done();
      }
    });
    // All join
    clients.forEach((c, i) => c.emit("join-room", { code, username: rooms[code].players[i].username }));
    // Eliminate C
    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "C" });
      clients[1].emit("cast-vote", { code, voter: "B", voteFor: "C" });
      clients[2].emit("cast-vote", { code, voter: "C", voteFor: "B" });
      clients[3].emit("cast-vote", { code, voter: "D", voteFor: "C" });
    }, 100);
  });

  test("round number starts at 1 and increments each round", (done) => {
    const code = "ROUND3";
    rooms[code] = {
      code,
      players: [
        { username: "A", playerRole: "civilian" },
        { username: "B", playerRole: "undercover" },
        { username: "C", playerRole: "civilian" },
        { username: "D", playerRole: "civilian" },
        { username: "E", playerRole: "civilian" },
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
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`)
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
    // Eliminate E
    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "E" });
      clients[1].emit("cast-vote", { code, voter: "B", voteFor: "E" });
      clients[2].emit("cast-vote", { code, voter: "C", voteFor: "E" });
      clients[3].emit("cast-vote", { code, voter: "D", voteFor: "E" });
      clients[4].emit("cast-vote", { code, voter: "E", voteFor: "C" });
    }, 100);
    //Eliminate C
    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "C" });
      clients[1].emit("cast-vote", { code, voter: "B", voteFor: "C" });
      clients[2].emit("cast-vote", { code, voter: "C", voteFor: "C" });
      clients[3].emit("cast-vote", { code, voter: "D", voteFor: "C" });
    }, 400);
  });

  test("game ends and no new round when only civilians remain (civilians win)", (done) => {
    const code = "CIVWIN";
    rooms[code] = {
      code,
      players: [
        { username: "A", playerRole: "civilian" },
        { username: "B", playerRole: "undercover" },
        { username: "C", playerRole: "civilian" },
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
      Client(`http://localhost:${port}`)
    ];
    let newRoundReceived = false;
    clients[0].on("new-round", () => {
      newRoundReceived = true;
    });
    clients[0].on("game-over", ({ winner }) => {
      expect(winner).toMatch(/civilians/i);
      setTimeout(() => {
        expect(newRoundReceived).toBe(false);
        done();
      }, 100);
    });
    clients.forEach((c, i) => c.emit("join-room", { code, username: rooms[code].players[i].username }));
    // Eliminate B (undercover) - civilians win, no new round
    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "B" });
      clients[1].emit("cast-vote", { code, voter: "B", voteFor: "B" });
      clients[2].emit("cast-vote", { code, voter: "C", voteFor: "B" });
    }, 100);
  });

  test("game ends and no new round when only one civilian remains (impostors win)", (done) => {
    const code = "IMPWIN";
    rooms[code] = {
      code,
      players: [
        { username: "A", playerRole: "undercover" },
        { username: "B", playerRole: "civilian" },
        { username: "C", playerRole: "civilian" },
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
      Client(`http://localhost:${port}`)
    ];
    let newRoundReceived = false;
    clients[0].on("new-round", () => {
      newRoundReceived = true;
    });
    clients[0].on("game-over", ({ winner }) => {
      expect(winner).toMatch(/Impostor|undercover/i);
      setTimeout(() => {
        expect(newRoundReceived).toBe(false);
        done();
      }, 100);
    });
    clients.forEach((c, i) => c.emit("join-room", { code, username: rooms[code].players[i].username }));
    // Eliminate C (civilian) - only one civilian left, impostors win
    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "C" });
      clients[1].emit("cast-vote", { code, voter: "B", voteFor: "C" });
      clients[2].emit("cast-vote", { code, voter: "C", voteFor: "C" });
    }, 100);
  });

  test("Mr. White gets a guess when voted out and wins if correct", (done) => {
    const code = "MRWHITE1";
    rooms[code] = {
      code,
      players: [
        { username: "A", playerRole: "civilian" },
        { username: "B", playerRole: "undercover" },
        { username: "C", playerRole: "mr.white" },
        { username: "D", playerRole: "civilian" },
      ],
      wordPair: { civilian_word: "apple", undercover_word: "banana" },
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
      Client(`http://localhost:${port}`)
    ];
    let mrWhiteGuessPrompted = false;
    let mrWhiteGuessResult = null;
    let gameOverWinner = null;

    // Listen for voting-complete and simulate Mr. White's guess
    clients[2].on("voting-complete", ({ votes }) => {
      // Simulate Mr. White guessing correctly
      clients[2].emit("mr-white-guess", { code, username: "C", guess: "apple" });
    });
    clients[2].on("mr-white-guess-result", ({ correct, civilianWord }) => {
      mrWhiteGuessPrompted = true;
      mrWhiteGuessResult = correct;
    });
    clients[2].on("game-over", ({ winner }) => {
      gameOverWinner = winner;
      setTimeout(() => {
        expect(mrWhiteGuessPrompted).toBe(true);
        expect(mrWhiteGuessResult).toBe(true);
        expect(gameOverWinner).toBe("Mr. White");
        done();
      }, 100);
    });
    // All join
    clients.forEach((c, i) => c.emit("join-room", { code, username: rooms[code].players[i].username }));
    setTimeout(() => {
      // Vote out Mr. White
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "C" });
      clients[1].emit("cast-vote", { code, voter: "B", voteFor: "C" });
      clients[2].emit("cast-vote", { code, voter: "C", voteFor: "B" });
      clients[3].emit("cast-vote", { code, voter: "D", voteFor: "C" });
    }, 100);
  });

  test("Mr. White is eliminated if guess is incorrect", (done) => {
    const code = "MRWHITE_FAIL";
    rooms[code] = {
      code,
      players: [
        { username: "A", playerRole: "civilian" },
        { username: "B", playerRole: "undercover" },
        { username: "C", playerRole: "mr.white" },
        { username: "D", playerRole: "civilian" },
      ],
      wordPair: { civilian_word: "apple", undercover_word: "banana" },
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
      Client(`http://localhost:${port}`),
    ];

    let guessResultReceived = false;
    let eliminatedReceived = false;

    // Simulate Mr. White's guess after being voted out
    clients[2].on("voting-complete", () => {
      clients[2].emit("mr-white-guess", {
        code,
        username: "C",
        guess: "wrongword",
      });
    });

    clients[2].on("mr-white-guess-result", ({ correct }) => {
      expect(correct).toBe(false);
      guessResultReceived = true;
      maybeDone();
    });

    clients[2].on("player-eliminated", ({ username, role }) => {
      if (username === "C" && role === "mr.white") {
        eliminatedReceived = true;
        maybeDone();
      }
    });

    function maybeDone() {
      if (guessResultReceived && eliminatedReceived) {
        done();
      }
    }

    // All join
    clients.forEach((c, i) =>
      c.emit("join-room", { code, username: rooms[code].players[i].username })
    );

    setTimeout(() => {
      // Vote out Mr. White
      clients[0].emit("cast-vote", { code, voter: "A", voteFor: "C" });
      clients[1].emit("cast-vote", { code, voter: "B", voteFor: "C" });
      clients[2].emit("cast-vote", { code, voter: "C", voteFor: "B" });
      clients[3].emit("cast-vote", { code, voter: "D", voteFor: "C" });
    }, 100);
  });

});
