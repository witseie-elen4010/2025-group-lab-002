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

export function assignPlayerRolesAndOrder(players) {
  if (players.length < 3) {
    throw new Error('Need at least 3 players to start the game');
  }

  // Create roles
  const roles = ['undercover'];
  if (players.length > 3) {
    roles.push('mr.white');
  }

  // Fill the rest with civilians
  while (roles.length < players.length) {
    roles.push('civilian');
  }

  // Shuffle roles and players
  const shuffledRoles = shuffle(roles);
  const shuffledPlayers = shuffle([...players]);

  // Assign roles to shuffled players
  const assigned = shuffledPlayers.map((player, idx) => ({
    username: player.username,
    playerRole: shuffledRoles[idx]
  }));

  return assigned;
}

