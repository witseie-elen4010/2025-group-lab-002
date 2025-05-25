export function updateVoteCounts(votingRound, votes) {
    Object.keys(votingRound.votes).forEach((k) => {
        votingRound.votes[k] = votes[k] || 0;
    });
}

export function handleMrWhiteElimination(eliminated, socket, code) {
    if (eliminated && eliminated.playerRole === "mr.white") {
        const user = JSON.parse(sessionStorage.getItem("loggedInUser"));

        if (user.username === eliminated.username) {
            const modal = document.getElementById("mr-white-guess-modal");
            modal.style.display = "flex";

            const guessForm = document.getElementById("mr-white-guess-form");
            guessForm.onsubmit = function (e) {
                e.preventDefault();
                const guess = document.getElementById("mr-white-guess-input").value.trim();
                socket.emit("mr-white-guess", { code, username: user.username, guess });

                document.getElementById("mr-white-guess-input").disabled = true;
                this.querySelector("button[type='submit']").disabled = true;
            };

            document.getElementById("close-mr-white-modal").onclick = function () {
                modal.style.display = "none";
            };

            socket.once("mr-white-guess-result", ({ correct, civilianWord }) => {
                const resultMsg = correct
                    ? `<span style="color:green;font-weight:bold;">Correct! You win as Mr. White!</span>`
                    : `<span style="color:red;font-weight:bold;">Incorrect. The civilian word was: <strong>${civilianWord}</strong>. You are eliminated.</span>`;

                document.getElementById("mr-white-guess-modal").innerHTML = `
                    <div style="background-color: white; padding: 30px; border-radius: 12px; max-width: 90%; min-width: 300px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
                        <h3>Mr. White's Guess</h3>
                        <p>${resultMsg}</p>
                        <button class="btn btn-secondary mt-3" id="close-mr-white-modal">Close</button>
                    </div>
                `;
                document.getElementById("close-mr-white-modal").onclick = function () {
                    modal.style.display = "none";
                };
            });
        }
    }
}

export function buildVoteBreakdownHtml(votingRound, eliminated, voteForm) {
    let breakdown = "<strong>Vote Results:</strong><br>";

    for (const [username, count] of Object.entries(votingRound.votes)) {
        breakdown += `${username}: ${count} vote(s)<br>`;
    }

    if (Array.isArray(eliminated)) {
        breakdown += `<br><strong>Tie!</strong> Players tied: ${eliminated.join(", ")}. Revoting...`;
        if (voteForm) {
            voteForm.style.display = "block";
            const btn = voteForm.querySelector("button[type='submit']");
            if (btn) btn.disabled = false;
        }
    } else if (eliminated && eliminated.username) {
        const roleText = getEliminatedRoleText(eliminated);
        breakdown += roleText;
        if (voteForm) voteForm.style.display = "none";
    } else {
        breakdown += "<br>No votes were cast.";
        if (voteForm) voteForm.style.display = "none";
    }

    return breakdown;
}

function getEliminatedRoleText(eliminated) {
    if (eliminated.playerRole === "mr.white") {
        return `<br><strong>${eliminated.username}</strong> was eliminated! They were Mr. White, they now get a chance to guess the civilian word.`;
    }
    if (eliminated.playerRole === "civilian") {
        return `<br><strong>${eliminated.username}</strong> was eliminated! They were a civilian.`;
    }
    if (eliminated.playerRole === "undercover") {
        return `<br><strong>${eliminated.username}</strong> was eliminated! They were undercover.`;
    }
    return "";
}

export function updateEliminatedPlayerUI(eliminated) {
    document.querySelectorAll(".player").forEach((playerDiv) => {
        const nameDiv = playerDiv.querySelector(".player-name");
        if (nameDiv && nameDiv.textContent === eliminated.username) {
            playerDiv.classList.add("eliminated-player");
            playerDiv.style.opacity = "0.5";
        }
    });
}

export function showVotingResultsModal(breakdown) {
    const modal = document.getElementById("voting-results-modal");
    const breakdownDiv = document.getElementById("voting-results-breakdown");

    if (breakdownDiv) breakdownDiv.innerHTML = breakdown;

    modal.style.display = "flex";

    const closeButton = document.getElementById("close-voting-results-modal");
    if (closeButton) {
        closeButton.onclick = function () {
            modal.style.display = "none";
        };
    }
}