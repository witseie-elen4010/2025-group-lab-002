import { displayPlayers, createTurnIndicator, updateTurnDisplay, startDiscussionTime} from "./game-utils.js";


export function setUpSockets(socket){
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

}