class Player {
  constructor(username, role) {
    this.username = username;
    this.role = role;
  }
}

/**
 * Represents a voting round in a game.
 */
class VotingRound {
  /**
   * Initializes a new VotingRound instance.
   * @param {Array<Object>} players - An array of player objects. Each player object must have a `username` property.
   */
  constructor(players) {
    this.players = players;
    this.votes = {};
    this.players.forEach((player) => {
      this.votes[player.username] = 0;
    });
  }

  /**
   * Casts a vote from one player to another.
   * @param {string} voterUsername - The username of the player casting the vote.
   * @param {string} voteForUsername - The username of the player being voted for.
   * @throws {Error} Throws an error if the voter or vote target is invalid.
   * @throws {Error} Throws an error if a player attempts to vote for themselves.
   */
  castVote(voterUsername, voteForUsername) {
    const voter = this.players.find(
      (player) => player.username === voterUsername
    );
    const voteFor = this.players.find(
      (player) => player.username === voteForUsername
    );

    if (!voter || !voteFor) {
      throw new Error("Invalid voter or vote target.");
    }
    if (voter.username === voteFor.username) {
      throw new Error("A player cannot vote for themselves.");
    }
    this.votes[voteFor.username] += 1;
  }

  /**
   * Determines the player(s) to be eliminated based on the votes.
   * If there is a tie, returns an array of usernames of the tied players.
   * @returns {Object|null|Array<string>} The eliminated player object, null if no votes,
   * or an array of usernames in case of a tie.
   */
  getEliminatedPlayer() {
    let maxVotes = 0;
    let eliminatedPlayer = null;

    for (const [username, voteCount] of Object.entries(this.votes)) {
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        eliminatedPlayer = this.players.find(
          (player) => player.username === username
        );
      }
    }

    const totalVotesCast = Object.values(this.votes).reduce((a, b) => a + b, 0);
    if (totalVotesCast === 0) {
      return null;
    }

    const tiedPlayers = Object.entries(this.votes).filter(
      ([, voteCount]) => voteCount === maxVotes
    );

    if (tiedPlayers.length > 1) {
      return tiedPlayers.map(([username]) => username);
    }

    return eliminatedPlayer;
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if (!user) {
      alert("You must be logged in!");
      window.location.href = "login";
      return;
    }

    const roomCode = sessionStorage.getItem("roomCode");
    if (!roomCode) {
      alert("No room code found!");
      window.location.href = "create-game";
      return;
    }

    const voterLabel = document.getElementById("current-voter");
    const voteForSelect = document.getElementById("vote-for");
    const resultsDiv = document.getElementById("results");
    const voteForm = document.getElementById("vote-form");
    const voteCountsDiv = document.getElementById("vote-counts");

    const socket = io();

    socket.emit("join-room", { code: roomCode, username: user.username });

    let players = [];
    try {
      const res = await fetch(`/api/game/players?code=${roomCode}`);
      players = await res.json();
    } catch (err) {
      alert("Failed to load players.");
      return;
    }

    voterLabel.textContent = user.username;
    voteForSelect.innerHTML = "";
    players.forEach((player) => {
      if (player.username !== user.username) {
        const option = document.createElement("option");
        option.value = player.username;
        option.textContent = player.username;
        voteForSelect.appendChild(option);
      }
    });

    socket.on("vote-update", (votes) => {
      voteCountsDiv.innerHTML = "";
      for (const [username, voteCount] of Object.entries(votes)) {
        const voteItem = document.createElement("p");
        voteItem.textContent = `${username}: ${voteCount} votes`;
        voteCountsDiv.appendChild(voteItem);
      }
    });

    socket.on("vote-confirmation", (voter) => {
      if (voter === user.username) {
        voteForm.classList.add("d-none");
        resultsDiv.innerHTML = `<div class="alert alert-success">Your vote has been cast!</div>`;
      }
    });

    socket.on("revote", ({ tiedPlayers }) => {
      resultsDiv.innerHTML = `<div class="alert alert-warning">Tie! Revote among: ${tiedPlayers.join(
        ", "
      )}</div>`;
      voteForm.classList.remove("d-none");
      voteForSelect.innerHTML = "";
      players.forEach((player) => {
        if (player.username !== user.username) {
          const option = document.createElement("option");
          option.value = player.username;
          option.textContent = player.username;
          voteForSelect.appendChild(option);
        }
      });
    });

    socket.on("player-eliminated", ({ username, role }) => {
      resultsDiv.innerHTML = `<div class="alert alert-danger">${username} has been eliminated! Their role was: <strong>${role}</strong></div>`;
      voteForm.classList.add("d-none");
    });

    voteForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const voteFor = voteForSelect.value;
      socket.emit("cast-vote", {
        code: roomCode,
        voter: user.username,
        voteFor: voteFor,
      });
    });

  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { Player, VotingRound };
}
