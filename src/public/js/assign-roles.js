// Hardcoded player names and roles
const players = ["Aaliyah", "Rizwaanah", "Glen", "Noah"];
const roles = ["Civilian", "Civilian", "Undercover", "Mr White"];

// Fisher-Yates shuffle
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }
  return array;
}

// Assign roles randomly to players and return assignments
function assignPlayerRoles() {
  const shuffledRoles = shuffle([...roles]);
  return players.map((player, idx) => ({
    player,
    role: shuffledRoles[idx]
  }));
}

// Expose function for frontend
window.getAssignedRoles = assignPlayerRoles;