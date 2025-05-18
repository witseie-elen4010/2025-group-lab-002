class Player {
  constructor(username, role) {
    this.username = username;
    this.role = role;
  }
}

class VotingRound {
  constructor(players) {
    this.players = players;
    this.resetVotes();
  }

  resetVotes() {
    this.votes = {};
    this.players.forEach((player) => {
      this.votes[player.username] = 0;
    });
  }

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
    if (totalVotesCast === 0) return null;

    const tiedPlayers = Object.entries(this.votes).filter(
      ([, voteCount]) => voteCount === maxVotes
    );

    if (tiedPlayers.length > 1) {
      return tiedPlayers.map(([username]) => username);
    }

    return eliminatedPlayer;
  }

  eliminatePlayer(username) {
    this.players = this.players.filter(
      (player) => player.username !== username
    );
    this.resetVotes();
  }

  checkWinCondition() {
    const civilians = this.players.filter((p) => p.role === "Civilian").length;
    const impostors = this.players.filter(
      (p) => p.role === "Undercover" || p.role === "Mr. White"
    ).length;

    if (impostors === 0) {
      return { winner: "Civilians" };
    }
    if (civilians <= 1) {
      return { winner: "Impostors" };
    }
    return null;
  }
}

function updateVoteCounts(votes) {
  const voteCountsDiv = document.getElementById("vote-counts");
  voteCountsDiv.innerHTML = "";

  for (const [username, voteCount] of Object.entries(votes)) {
    const voteItem = document.createElement("p");
    voteItem.textContent = `${username}: ${voteCount} votes`;
    voteCountsDiv.appendChild(voteItem);
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const players = [
      new Player("Aaliyah", "Civilian"),
      new Player("Glen", "Civilian"),
      new Player("Noah", "Undercover"),
      new Player("Rizwaanah", "Mr. White"),
    ];

    let votingRound = new VotingRound(players);
    let currentVoterIndex = 0;
    let roundNumber = 1;

    const voterLabel = document.getElementById("current-voter");
    const voteForSelect = document.getElementById("vote-for");
    const resultsDiv = document.getElementById("results");
    const voteForm = document.getElementById("vote-form");

    let roundDisplay = document.getElementById("voting-round-display");
    if (!roundDisplay) {
      roundDisplay = document.createElement("h3");
      roundDisplay.id = "voting-round-display";
      roundDisplay.className = "text-center mb-3";
      voteForm.parentNode.insertBefore(roundDisplay, voteForm);
    }

    function updateRoundDisplay() {
      roundDisplay.textContent = `Voting Round: ${roundNumber}`;
    }

    function initializeVoting() {
      updateRoundDisplay();
      voterLabel.textContent = `${votingRound.players[currentVoterIndex].username}`;
      voteForSelect.innerHTML = "";
      votingRound.players.forEach((player) => {
        if (
          player.username !== votingRound.players[currentVoterIndex].username
        ) {
          const option = document.createElement("option");
          option.value = player.username;
          option.textContent = `${player.username}`;
          voteForSelect.appendChild(option);
        }
      });

      updateVoteCounts(votingRound.votes);
    }

    voteForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const voteFor = voteForSelect.value;

      try {
        votingRound.castVote(
          votingRound.players[currentVoterIndex].username,
          voteFor
        );

        currentVoterIndex++;

        if (currentVoterIndex < votingRound.players.length) {
          initializeVoting();
        } else {
          updateVoteCounts(votingRound.votes);

          const eliminatedPlayer = votingRound.getEliminatedPlayer();

          if (Array.isArray(eliminatedPlayer)) {
            resultsDiv.innerHTML = `
                      <div class="alert alert-warning" role="alert">
                          The votes resulted in a tie between: <strong>${eliminatedPlayer.join(
                            ", "
                          )}</strong>. Restarting the voting process.
                      </div>
                  `;
            currentVoterIndex = 0;
            votingRound.resetVotes();
            initializeVoting();
          } else if (eliminatedPlayer) {
            resultsDiv.innerHTML = `
                      <div class="alert alert-success" role="alert">
                          <p> You eliminated a <strong>${eliminatedPlayer.role}</strong> </p>
                          <p> The player eliminated is: <strong>${eliminatedPlayer.username}</strong> </p>
                      </div>
                  `;
            votingRound.eliminatePlayer(eliminatedPlayer.username);

            const win = votingRound.checkWinCondition();
            if (win) {
              resultsDiv.innerHTML += `<div class="alert alert-info mt-3"><strong>${win.winner} win the game!</strong></div>`;
              voteForm.classList.add("d-none");
              roundDisplay.textContent = `Game Over`;
            } else {
              currentVoterIndex = 0;
              roundNumber++;
              initializeVoting();
            }
          }
        }
      } catch (error) {
        resultsDiv.innerHTML = `
              <div class="alert alert-danger" role="alert">
                  Error: ${error.message}
              </div>
          `;
      }
    });

    initializeVoting();
  });
}

module.exports = { Player, VotingRound, updateVoteCounts };
