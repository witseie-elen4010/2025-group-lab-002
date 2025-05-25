
/**
 * Handle voting complete event.
 * @param {Object} votes - The votes object containing vote counts
 * @param {Object} votingRound - The current voting round instance
 * @param {Object} socket - The socket connection
 * @param {string} code - The game room code
 */
export function handleVotingComplete(votes, votingRound, socket, code) {
    if (!votingRound) return;
  
    updateVotes(votes, votingRound);
    const eliminated = votingRound.getEliminatedPlayer();
    const voteForm = document.getElementById('vote-form');
  
    console.log('Vote Results:', votingRound.votes);
    console.log('Eliminated:', eliminated);
  
    if (eliminated?.playerRole === 'mr.white') {
      handleMrWhiteGuess(eliminated.username, socket, code);
    }
  
    const breakdown = buildVoteBreakdown(eliminated, votingRound.votes);
    updateUIAfterVote(eliminated, voteForm);
    showVotingResultsModal(breakdown);
}

/**
 * Update the votes in the voting round
 * @param {Object} votes - The new votes to update
 * @param {Object} votingRound - The voting round to update
 */
function updateVotes(votes, votingRound) {
    Object.keys(votingRound.votes).forEach((k) => {
        votingRound.votes[k] = votes[k] || 0;
    });
}

/**
 * Handle Mr. White's guess after elimination
 * @param {string} eliminatedUsername - The username of the eliminated player
 * @param {Object} socket - The socket connection
 * @param {string} code - The game room code
 */
function handleMrWhiteGuess(eliminatedUsername, socket, code) {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
  
    if (user.username !== eliminatedUsername) return;
  
    const modal = createModal('mr-white-guess-modal');
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.innerHTML = `
        <h3>You've been eliminated!</h3>
        <p>As Mr. White, you can guess the civilian word to win.</p>
        <form id="mr-white-guess-form">
            <input type="text" id="mr-white-guess-input" class="form-control mb-2" placeholder="Enter your guess..." required />
            <button type="submit" class="btn btn-primary w-100">Submit Guess</button>
        </form>
        <button class="btn btn-secondary mt-3" id="close-mr-white-modal">Close</button>
    `;
  
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  
    document.getElementById('mr-white-guess-form').onsubmit = function (e) {
        e.preventDefault();
        const guess = document.getElementById('mr-white-guess-input').value.trim();
        socket.emit('mr-white-guess', { code, username: user.username, guess });
        this.querySelector('button[type="submit"]').disabled = true;
    };
  
    document.getElementById('close-mr-white-modal').onclick = () => {
        document.body.removeChild(modal);
    };
  
    socket.once('mr-white-guess-result', ({ correct, civilianWord }) => {
        modalContent.innerHTML = `
            <h3>Mr. White's Guess</h3>
            <p>${correct ? `<span style="color:green; font-weight:bold;">Correct! You win!</span>` : `<span style="color:red; font-weight:bold;">Incorrect. The civilian word was <strong>${civilianWord}</strong>.</span>`}</p>
            <button class="btn btn-secondary mt-3" id="close-mr-white-modal">Close</button>
        `;
        document.getElementById('close-mr-white-modal').onclick = () => {
            document.body.removeChild(modal);
        };
    });
}

/**
 * Build the vote breakdown string
 * @param {Object|Array} eliminated - The eliminated player(s)
 * @param {Object} votes - The vote counts
 * @returns {string} The formatted vote breakdown
 */
function buildVoteBreakdown(eliminated, votes) {
    let breakdown = '<strong>Vote Results:</strong><br>';
    for (const [username, count] of Object.entries(votes)) {
        breakdown += `${username}: ${count} vote(s)<br>`;
    }
    if (Array.isArray(eliminated)) {
        breakdown += `<br><strong>Tie!</strong> Players tied: ${eliminated.join(', ')}. Revoting...`;
    } else if (eliminated?.username) {
        breakdown += `<br><strong>${eliminated.username}</strong> was eliminated! They were a ${eliminated.playerRole}.`;
    } else {
        breakdown += '<br>No votes were cast.';
    }
    return breakdown;
}

/**
 * Update the UI after voting
 * @param {Object|Array} eliminated - The eliminated player(s)
 * @param {HTMLElement} voteForm - The voting form element
 */
function updateUIAfterVote(eliminated, voteForm) {
    if (Array.isArray(eliminated)) {
        if (voteForm) {
            voteForm.style.display = 'block';
            const btn = voteForm.querySelector('button[type="submit"]');
            if (btn) btn.disabled = false;
        }
    } else if (eliminated?.username) {
        document.querySelectorAll('.player').forEach((playerDiv) => {
            const nameDiv = playerDiv.querySelector('.player-name');
            if (nameDiv?.textContent === eliminated.username) {
                playerDiv.classList.add('eliminated-player');
                playerDiv.style.opacity = '0.5';
            }
        });
        if (voteForm) voteForm.style.display = 'none';
    } else {
        if (voteForm) voteForm.style.display = 'none';
    }
}

/**
 * Show the voting results modal
 * @param {string} breakdown - The vote breakdown string
 */
function showVotingResultsModal(breakdown) {
    let modal = document.getElementById('voting-results-modal');
    if (!modal) {
        modal = createModal('voting-results-modal');
  
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.id = 'voting-results-modal-content';
        modalContent.innerHTML = `<h3>Voting Results</h3><div id='voting-results-breakdown'></div>`;
  
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.className = 'btn btn-secondary mt-3';
        closeButton.onclick = () => {
            document.body.removeChild(modal);
        };
  
        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }
    const breakdownDiv = document.getElementById('voting-results-breakdown');
    if (breakdownDiv) breakdownDiv.innerHTML = breakdown;
}

/**
 * Create a modal element
 * @param {string} id - The modal ID
 * @returns {HTMLElement} The created modal element
 */
function createModal(id) {
    const modal = document.createElement('div');
    modal.id = id;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '2000';
    return modal;
}