const { Player, VotingRound } = require("../src/public/js/voting-round");

describe("VotingRound", () => {
  let players;
  let votingRound;

  beforeEach(() => {
    players = [
      new Player("Aaliyah", "Civilian"),
      new Player("Glen", "Civilian"),
      new Player("Noah", "Undercover"),
      new Player("Rizwaanah", "Mr. White"),
    ];
    votingRound = new VotingRound(players);
  });

  it("should initialize votes for all players to 0", () => {
    expect(votingRound.votes).toEqual({
      Aaliyah: 0,
      Glen: 0,
      Noah: 0,
      Rizwaanah: 0,
    });
  });

  it("should allow valid votes and update vote counts", () => {
    votingRound.castVote("Aaliyah", "Glen");
    votingRound.castVote("Glen", "Noah");
    votingRound.castVote("Noah", "Glen");
    votingRound.castVote("Rizwaanah", "Glen");
    expect(votingRound.votes).toEqual({
      Aaliyah: 0,
      Glen: 3,
      Noah: 1,
      Rizwaanah: 0,
    });
  });

  it("should not allow a player to vote for themselves", () => {
    expect(() => votingRound.castVote("Aaliyah", "Aaliyah")).toThrow(
      "A player cannot vote for themselves."
    );
  });

  it("should not allow invalid voter or vote target", () => {
    expect(() => votingRound.castVote("Invalid", "Glen")).toThrow(
      "Invalid voter or vote target."
    );
    expect(() => votingRound.castVote("Aaliyah", "Invalid")).toThrow(
      "Invalid voter or vote target."
    );
  });

  it("should return the eliminated player with the most votes", () => {
    votingRound.castVote("Aaliyah", "Glen");
    votingRound.castVote("Glen", "Noah");
    votingRound.castVote("Noah", "Glen");
    votingRound.castVote("Rizwaanah", "Glen");
    const eliminated = votingRound.getEliminatedPlayer();
    expect(eliminated.username).toBe("Glen");
    expect(eliminated.role).toBe("Civilian");
  });

  it("should return an array of usernames if there is a tie", () => {
    votingRound.castVote("Aaliyah", "Glen");
    votingRound.castVote("Glen", "Aaliyah");
    votingRound.castVote("Noah", "Glen");
    votingRound.castVote("Rizwaanah", "Aaliyah");
    const eliminated = votingRound.getEliminatedPlayer();
    expect(Array.isArray(eliminated)).toBe(true);
    expect(eliminated).toEqual(expect.arrayContaining(["Aaliyah", "Glen"]));
  });

  it("should declare Civilians as winners if all impostors are eliminated", () => {
    votingRound.eliminatePlayer("Noah");
    votingRound.eliminatePlayer("Rizwaanah");
    const win = votingRound.checkWinCondition();
    expect(win).toEqual({ winner: "Civilians" });
  });

  it("should declare Impostors as winners if only 1 Civilian is left", () => {
    votingRound.eliminatePlayer("Aaliyah");
    const win = votingRound.checkWinCondition();
    expect(win).toEqual({ winner: "Impostors" });
  });

  it("should not declare a winner if both teams are still present", () => {
    const win = votingRound.checkWinCondition();
    expect(win).toBeNull();
  });
});
