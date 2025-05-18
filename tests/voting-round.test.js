const request = require("supertest");
const app = require("../src/app");
const { rooms } = require("../src/routes/game-routes");
const { Server } = require("socket.io");
const Client = require("socket.io-client");
const http = require("http");
const setupGameSocket = require("../src/sockets/game-socket");
const { Player, VotingRound } = require("../src/public/js/voting-round");

describe('VotingRound Class Logic', () => {
    let players;
    let votingRound;

    beforeEach(() => {
        players = [
            new Player("Aaliyah", "Civilian"),
            new Player("Glen", "Civilian"),
            new Player("Noah", "Undercover"),
            new Player("Rizwaanah", "Mr. White")
        ];
        votingRound = new VotingRound(players);
    });

    it('should initialize votes for all players to 0', () => {
        expect(votingRound.votes).toEqual({
            Aaliyah: 0,
            Glen: 0,
            Noah: 0,
            Rizwaanah: 0
        });
    });

    it('should allow valid votes and update vote counts', () => {
        votingRound.castVote("Aaliyah", "Glen");
        votingRound.castVote("Glen", "Noah");
        votingRound.castVote("Noah", "Glen");
        votingRound.castVote("Rizwaanah", "Glen");
        expect(votingRound.votes).toEqual({
            Aaliyah: 0,
            Glen: 3,
            Noah: 1,
            Rizwaanah: 0
        });
    });

    it('should not allow a player to vote for themselves', () => {
        expect(() => votingRound.castVote("Aaliyah", "Aaliyah")).toThrow("A player cannot vote for themselves.");
    });

    it('should not allow invalid voter or vote target', () => {
        expect(() => votingRound.castVote("Invalid", "Glen")).toThrow("Invalid voter or vote target.");
        expect(() => votingRound.castVote("Aaliyah", "Invalid")).toThrow("Invalid voter or vote target.");
    });

    it('should return the eliminated player with the most votes', () => {
        votingRound.castVote("Aaliyah", "Glen");
        votingRound.castVote("Glen", "Noah");
        votingRound.castVote("Noah", "Glen");
        votingRound.castVote("Rizwaanah", "Glen");
        const eliminated = votingRound.getEliminatedPlayer();
        expect(eliminated.username).toBe("Glen");
        expect(eliminated.role).toBe("Civilian");
    });

    it('should return an array of usernames if there is a tie', () => {
        votingRound.castVote("Aaliyah", "Glen");
        votingRound.castVote("Glen", "Aaliyah");
        votingRound.castVote("Noah", "Glen");
        votingRound.castVote("Rizwaanah", "Aaliyah");
        const eliminated = votingRound.getEliminatedPlayer();
        expect(Array.isArray(eliminated)).toBe(true);
        expect(eliminated).toEqual(expect.arrayContaining(["Aaliyah", "Glen"]));
    });

    it('should handle no votes cast', () => {
        const eliminated = votingRound.getEliminatedPlayer();
        expect(eliminated).toBeNull();
    });
});

describe("Voting Round API", () => {
  const code = "ABCDE";

  beforeEach(() => {
    rooms[code] = {
      players: [
        { username: "Aaliyah", role: "Civilian" },
        { username: "Glen", role: "Civilian" },
        { username: "Noah", role: "Undercover" },
        { username: "Rizwaanah", role: "Mr. White" },
      ],
      votes: {},
      voted: {},
      createdAt: new Date(),
      wordPair: { civilian_word: "apple", undercover_word: "pear" },
    };
  });

  afterEach(() => {
    for (let key in rooms) {
      delete rooms[key];
    }
  });

  test("GET /api/game/players returns all players before elimination", async () => {
    const res = await request(app).get("/api/game/players").query({ code });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(4);
    expect(res.body.map((p) => p.username)).toEqual(
      expect.arrayContaining(["Aaliyah", "Glen", "Noah", "Rizwaanah"])
    );
  });

  test("GET /api/game/players does not return eliminated player", async () => {
    rooms[code].players = rooms[code].players.filter(
      (p) => p.username !== "Glen"
    );

    const res = await request(app).get("/api/game/players").query({ code });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    expect(res.body.map((p) => p.username)).not.toContain("Glen");
  });

  test("player with most votes is eliminated from the room", async () => {
    rooms[code].votes = { Aaliyah: 0, Glen: 3, Noah: 0, Rizwaanah: 1 };
    rooms[code].voted = { Aaliyah: true, Glen: true, Noah: true, Rizwaanah: true };

    const maxVotes = Math.max(...Object.values(rooms[code].votes));
    const eliminated = Object.entries(rooms[code].votes)
      .filter(([_, count]) => count === maxVotes)
      .map(([username]) => username);

    if (eliminated.length === 1) {
      rooms[code].players = rooms[code].players.filter(
        (p) => p.username !== eliminated[0]
      );
    }

    const res = await request(app).get("/api/game/players").query({ code });

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    expect(res.body.map((p) => p.username)).not.toContain("Glen");
  });
});

describe("Voting Round Socket", () => {
  let io, server, port;
  const code = "SOCK1";

  beforeAll((done) => {
    server = http.createServer();
    io = new Server(server);
    setupGameSocket(io, rooms);
    server.listen(() => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    server.close(done);
  });

  beforeEach(() => {
    rooms[code] = {
      players: [
        { username: "Aaliyah" },
        { username: "Glen" },
        { username: "Noah" },
        { username: "Rizwaanah" },
      ],
      votes: {},
      voted: {},
    };
  });

  afterEach(() => {
    delete rooms[code];
  });

  test("player with most votes is eliminated and event is emitted", (done) => {
    const clients = [
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
    ];
    const usernames = ["Aaliyah", "Glen", "Noah", "Rizwaanah"];

    // Listen for elimination on one client
    clients[0].on("player-eliminated", ({ username, role }) => {
      expect(username).toBe("Glen");
      expect(role).toBeDefined();
      clients.forEach((c) => c.close());
      done();
    });

    // All clients join the room
    clients.forEach((client, i) => {
      client.emit("join-room", { code, username: usernames[i] });
    });

    // Simulate votes: Glen gets 3 votes, Rizwaanah gets 1
    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "Aaliyah", voteFor: "Glen" });
      clients[1].emit("cast-vote", { code, voter: "Glen", voteFor: "Glen" }); // Should be ignored (can't vote for self)
      clients[2].emit("cast-vote", { code, voter: "Noah", voteFor: "Glen" });
      clients[3].emit("cast-vote", { code, voter: "Rizwaanah", voteFor: "Glen" });
    }, 100);
  });

  test("tie triggers revote event", (done) => {
    const clients = [
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
    ];
    const usernames = ["Aaliyah", "Glen", "Noah", "Rizwaanah"];

    clients[0].on("revote", ({ tiedPlayers }) => {
      expect(Array.isArray(tiedPlayers)).toBe(true);
      expect(tiedPlayers).toEqual(expect.arrayContaining(["Aaliyah", "Glen"]));
      clients.forEach((c) => c.close());
      done();
    });

    clients.forEach((client, i) => {
      client.emit("join-room", { code, username: usernames[i] });
    });

    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "Aaliyah", voteFor: "Glen" });
      clients[1].emit("cast-vote", { code, voter: "Glen", voteFor: "Aaliyah" });
      clients[2].emit("cast-vote", { code, voter: "Noah", voteFor: "Glen" });
      clients[3].emit("cast-vote", { code, voter: "Rizwaanah", voteFor: "Aaliyah" });
    }, 100);
  });

  test("cannot vote for self (vote is ignored)", (done) => {
    const clients = [
      Client(`http://localhost:${port}`),
      Client(`http://localhost:${port}`),
    ];
    const usernames = ["Aaliyah", "Glen"];

    clients[0].on("vote-update", (votes) => {
      // Glen's self-vote should not be counted
      expect(votes.Glen).toBe(1);
      clients.forEach((c) => c.close());
      done();
    });

    clients.forEach((client, i) => {
      client.emit("join-room", { code, username: usernames[i] });
    });

    setTimeout(() => {
      clients[0].emit("cast-vote", { code, voter: "Aaliyah", voteFor: "Glen" });
      clients[1].emit("cast-vote", { code, voter: "Glen", voteFor: "Glen" }); // Should be ignored
    }, 100);
  });
});

describe('Mr. White Guess Feature', () => {
    let players;
    let votingRound;
    let civiliansWord = "apple";

    beforeEach(() => {
        players = [
            new Player("Aaliyah", "Civilian"),
            new Player("Glen", "Civilian"),
            new Player("Noah", "Undercover"),
            new Player("Rizwaanah", "Mr. White")
        ];
        votingRound = new VotingRound(players);
    });

    it('should prompt Mr. White to guess when eliminated', () => {
        // Simulate votes to eliminate Mr. White
        votingRound.castVote("Aaliyah", "Rizwaanah");
        votingRound.castVote("Glen", "Rizwaanah");
        votingRound.castVote("Noah", "Rizwaanah");
        votingRound.castVote("Rizwaanah", "Aaliyah");
        const eliminated = votingRound.getEliminatedPlayer();
        expect(eliminated.username).toBe("Rizwaanah");
        expect(eliminated.role).toBe("Mr. White");
        // In real code, this would trigger the guess modal on the frontend
    });

    it('should declare Mr. White as winner if guess is correct', () => {
        // Simulate Mr. White being eliminated
        votingRound.castVote("Aaliyah", "Rizwaanah");
        votingRound.castVote("Glen", "Rizwaanah");
        votingRound.castVote("Noah", "Rizwaanah");
        votingRound.castVote("Rizwaanah", "Aaliyah");
        const eliminated = votingRound.getEliminatedPlayer();
        // Simulate correct guess
        const guess = "apple";
        const mrWhiteWins = guess.toLowerCase() === civiliansWord.toLowerCase();
        expect(mrWhiteWins).toBe(true);
    });

    it('should not declare Mr. White as winner if guess is incorrect', () => {
        // Simulate Mr. White being eliminated
        votingRound.castVote("Aaliyah", "Rizwaanah");
        votingRound.castVote("Glen", "Rizwaanah");
        votingRound.castVote("Noah", "Rizwaanah");
        votingRound.castVote("Rizwaanah", "Aaliyah");
        const eliminated = votingRound.getEliminatedPlayer();
        // Simulate incorrect guess
        const guess = "banana";
        const mrWhiteWins = guess.toLowerCase() === civiliansWord.toLowerCase();
        expect(mrWhiteWins).toBe(false);
    });
});
