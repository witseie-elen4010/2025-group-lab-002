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
        this.players.forEach(player => {
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
        const voter = this.players.find(player => player.username === voterUsername);
        const voteFor = this.players.find(player => player.username === voteForUsername);

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
                eliminatedPlayer = this.players.find(player => player.username === username);
            }
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

function updateVoteCounts(votes) {
    const voteCountsDiv = document.getElementById("vote-counts");
    voteCountsDiv.innerHTML = ""; 

    for (const [username, voteCount] of Object.entries(votes)) {
        const voteItem = document.createElement("p");
        voteItem.textContent = `${username}: ${voteCount} votes`;
        voteCountsDiv.appendChild(voteItem);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const players = [
        new Player("Aaliyah", "Civilian"),
        new Player("Glen", "Civilian"),
        new Player("Noah", "Undercover"),
        new Player("Rizwaanah", "Mr. White")
    ];

    const votingRound = new VotingRound(players);
    let currentVoterIndex = 0;


    const voterLabel = document.getElementById("current-voter");
    const voteForSelect = document.getElementById("vote-for");
    const resultsDiv = document.getElementById("results");
    const voteForm = document.getElementById("vote-form");

    function initializeVoting() {
        voterLabel.textContent = `${players[currentVoterIndex].username}`;
        voteForSelect.innerHTML = ""; // Clear previous options
        players.forEach(player => {
            if (player.username !== players[currentVoterIndex].username) { // Exclude self-voting
                const option = document.createElement("option");
                option.value = player.username;
                option.textContent = `${player.username}`;
                voteForSelect.appendChild(option);
            }
        });

        updateVoteCounts(votingRound.votes);
    }

    voteForm.addEventListener("submit", event => {
        event.preventDefault();
        const voteFor = voteForSelect.value;

        try {
            votingRound.castVote(players[currentVoterIndex].username, voteFor);
            currentVoterIndex++;

            if (currentVoterIndex < players.length) {
                initializeVoting(); 
            } else {
                updateVoteCounts(votingRound.votes);

                const eliminatedPlayer = votingRound.getEliminatedPlayer();

                if (Array.isArray(eliminatedPlayer)) {
                    resultsDiv.innerHTML = `
                        <div class="alert alert-warning" role="alert">
                            The votes resulted in a tie between: <strong>${eliminatedPlayer.join(", ")}</strong>. Restarting the voting process.
                        </div>
                    `;
                    currentVoterIndex = 0; 
                    votingRound.players.forEach(player => {
                        votingRound.votes[player.username] = 0; 
                    });
                    initializeVoting(); 
                } else {
                    resultsDiv.innerHTML = `
                    <div class="alert alert-success" role="alert">
                        <p> You eliminated a <strong>${eliminatedPlayer.role}</strong> </p>
                        <p> The player eliminated is: <strong>${eliminatedPlayer.username}</strong> </p>
                    </div>
                `;
                    voteForm.classList.add("d-none"); 
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