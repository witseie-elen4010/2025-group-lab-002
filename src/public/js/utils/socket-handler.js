import { displayPlayers, createTurnIndicator, updateTurnDisplay, startDiscussionTime} from "./game-utils.js";


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

export function setUpSockets(socket){

    let votingRound = null;
    // Listen for current turn updates from server
    socket.on("update-turn", (room) => {
      console.log("Received update-turn event:", room);
      updateTurnDisplay(room);
    });

    // Listen for new player joining
    socket.on("player-joined", async ({ room, username }) => {
      console.log(`username: ${username}`);
  
      displayPlayers(room);
      updateTurnDisplay(room);
    });

    // Listen for clue submissions
    socket.on("clueSubmitted", (data) => {
      const { serverRoom } = data;
      const room = serverRoom;
      const clue = room.clues[room.clues.length - 1].clue;
      console.log(`current player idx: ${room.currentPlayerIndex}`);
  
      // Display clue in speech bubble
      const playerDiv = document.querySelector(
        `.player[data-player-index="${room.currentPlayerIndex}"]`
      );
      if (playerDiv) {
        const speechBubble = playerDiv.querySelector(".speech-bubble");
        speechBubble.textContent = clue;
        speechBubble.classList.add("has-clue");
        speechBubble.style.display = "block";
      }
    });

    socket.on('startDiscussion', (room) => {
      const openChatBtn = document.getElementById("open-chat-btn");
      openChatBtn.click()
      startDiscussionTime(room);
    })

      // Listen for startVoting event from server
  socket.on("startVoting", (room) => {
    // Hide clue input
    const clueInputContainer = document.getElementById("clue-input-container")
    clueInputContainer.style.display = "none";
    const players = room.players; 

    // Create a new VotingRound instance with the current players
    votingRound = new VotingRound(players);
    // Get current user info from localStorage
      const user = JSON.parse(sessionStorage.getItem("loggedInUser")) || {
        username: "Guest",
      };
      const currentUsername = user.username;
    
    // If vote form doesn't exist, create it
    let voteForm = document.getElementById("vote-form");
    if (!voteForm) {
      voteForm = document.createElement("form");
      voteForm.id = "vote-form";
      voteForm.className = "mt-4";

      // Label
      const label = document.createElement("label");
      label.textContent = "Vote for a player:";
      label.className = "form-label";
      voteForm.appendChild(label);

      // Select
      const select = document.createElement("select");
      select.id = "vote-for";
      select.className = "form-select mb-3";
      select.required = true;
      voteForm.appendChild(select);

      // Button
      const btn = document.createElement("button");
      btn.type = "submit";
      btn.className = "btn btn-primary w-100";
      btn.textContent = "Cast Vote";
      voteForm.appendChild(btn);

      // Results div
      const resultsDiv = document.createElement("div");
      resultsDiv.id = "vote-results";
      resultsDiv.className = "mt-3";
      voteForm.appendChild(resultsDiv);

      // Insert into DOM
      clueInputContainer.parentNode.insertBefore(
        voteForm,
        clueInputContainer.nextSibling
      );

    

      // Handle vote submission
      voteForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const voteFor = select.value;
        socket.emit("cast-vote", {
          code: room.code,
          voter: currentUsername,
          voteFor: voteFor,
        });
        btn.disabled = true;
      });
    } else {
      voteForm.style.display = "block";
    }

    const votingPlayers = room.players;
    // Populate vote options (exclude self)
    const select = document.getElementById("vote-for");
    select.innerHTML = "";
    votingPlayers.forEach((player) => {
      if (player.username !== currentUsername) {
        const option = document.createElement("option");
        option.value = player.username;
        option.textContent = player.username;
        select.appendChild(option);
      }
    });
    // Reset vote results
    const resultsDiv = document.getElementById("vote-results");
    if (resultsDiv) resultsDiv.textContent = "";
  });

   // Optionally, hide the vote form after voting is done
  socket.on("vote-confirmation", (voter) => {
      const user = JSON.parse(sessionStorage.getItem("loggedInUser")) || {
        username: "Guest",
      };
      const currentUsername = user.username;

    if (voter === currentUsername) {
      const voteForm = document.getElementById("vote-form");
      if (voteForm) voteForm.style.display = "none";
    }
  });


  socket.on("voting-complete", ({ votes, votingRound }) => {
    // Update VotingRound votes
    if (!votingRound) return;
    // Reset votes
    Object.keys(votingRound.votes).forEach((k) => (votingRound.votes[k] = 0));
    // Tally votes
    Object.entries(votes).forEach(([voter, voteFor]) => {
      try {
        votingRound.castVote(voter, voteFor);
      } catch (e) {
        // Ignore invalid votes
      }
    });
    const eliminated = votingRound.getEliminatedPlayer();
    const resultsDiv = document.getElementById("vote-results");
    const voteForm = document.getElementById("vote-form");
    if (Array.isArray(eliminated)) {
      // Tie
      if (resultsDiv) {
        resultsDiv.innerHTML = `<strong>Tie!</strong> Players tied: ${eliminated.join(", ")}. Revoting...`;
      }
      // Reset vote form for revote
      if (voteForm) {
        voteForm.style.display = "block";
        const btn = voteForm.querySelector("button[type='submit']");
        if (btn) btn.disabled = false;
      }
      // Optionally, emit revote event or let server handle
    } else if (eliminated && eliminated.username) {
      // Show eliminated player
      if (resultsDiv) {
        resultsDiv.innerHTML = `<strong>${eliminated.username}</strong> was eliminated!`;
      }
      // Mark eliminated player in UI
      document.querySelectorAll(".player").forEach((playerDiv) => {
        const nameDiv = playerDiv.querySelector(".player-name");
        if (nameDiv && nameDiv.textContent === eliminated.username) {
          playerDiv.classList.add("eliminated-player");
          playerDiv.style.opacity = "0.5";
        }
      });
      // Hide vote form
      if (voteForm) voteForm.style.display = "none";
    } else {
      // No votes cast
      if (resultsDiv) {
        resultsDiv.innerHTML = "No votes were cast.";
      }
      if (voteForm) voteForm.style.display = "none";
    }
  });

}