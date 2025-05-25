import { VotingRound } from "../../classes/VotingRound.js";

export function openChat() {
    const openChatBtn = document.getElementById("open-chat-btn");
    if (openChatBtn) openChatBtn.click();
}

export function handleStartVoting(room, socket, votingRound) {
    hideClueInput();
    votingRound = new VotingRound(room.players);

    const currentUsername = getCurrentUsername();
    setupVoteForm(room, currentUsername, socket);
    populateVoteOptions(room.players, currentUsername);
    return votingRound;
}

export function hideClueInput() {
    const clueInputContainer = document.getElementById("clue-input-container");
    if (clueInputContainer) clueInputContainer.style.display = "none";
}

export function getCurrentUsername() {
    const user = JSON.parse(sessionStorage.getItem("loggedInUser")) || { username: "Guest" };
    return user.username;
}

export function setupVoteForm(room, currentUsername, socket) {
    const clueInputContainer = document.getElementById("clue-input-container");
    let voteForm = document.getElementById("vote-form");

    if (!voteForm) {
        voteForm = document.createElement("form");
        voteForm.id = "vote-form";
        voteForm.className = "mt-4";
        voteForm.style.maxWidth = "300px";
        voteForm.style.margin = "0 auto";

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
        btn.className = "btn w-100 mb-2";
        btn.style.backgroundColor = "#5959ba";
        btn.textContent = "Cast Vote";
        voteForm.appendChild(btn);

        // Insert form into DOM
        clueInputContainer.parentNode.insertBefore(voteForm, clueInputContainer.nextSibling);

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
}

export function populateVoteOptions(players, currentUsername) {
    const select = document.getElementById("vote-for");
    if (!select) return;

    select.innerHTML = "";
    players.forEach((player) => {
        if (player.username !== currentUsername) {
            const option = document.createElement("option");
            option.value = player.username;
            option.textContent = player.username;
            select.appendChild(option);
        }
    });
}