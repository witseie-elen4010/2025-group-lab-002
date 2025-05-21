// Hardcoded player names
const players = ["Aaliayh", "Rizwaanah", "Glen", "Noah"];

// Fisher-Yates shuffle to randomize player order
function shuffle(array) {
  let currentIndex = array.length, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // Swap
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]
    ];
  }
  return array;
}

// Shuffle players and display the order in the HTML
function displayPlayerOrder() {
  const shuffledPlayers = shuffle([...players]); // Copy to avoid mutating original
  const orderList = document.getElementById("player-order");
  orderList.innerHTML = ""; // Clear previous

  shuffledPlayers.forEach((player, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${player}`;
    orderList.appendChild(li);
  });
}

// Run on page load
window.onload = displayPlayerOrder;