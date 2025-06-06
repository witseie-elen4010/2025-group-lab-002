/**
   * Represents a voting round in a game.
   */
 export class VotingRound {
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