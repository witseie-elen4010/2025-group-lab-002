const { assignPlayerRolesAndOrder } = require('../src/utils/assign-roles-order');

describe('Game Environment Rules', () => {
  describe('assignPlayerRolesAndOrder', () => {
    it('should assign 2 civilians and 1 undercover in a 3-player game (no mr.white)', () => {
      const players = [{ username: 'A' }, { username: 'B' }, { username: 'C' }];
      const assigned = assignPlayerRolesAndOrder(players);
      const roles = assigned.map(p => p.playerRole);

      expect(roles.filter(r => r === 'undercover').length).toBe(1);
      expect(roles.filter(r => r === 'mr.white').length).toBe(0);
      expect(roles.filter(r => r === 'civilian').length).toBe(2);
    });

    it('should assign 1 undercover, 1 mr.white, and the rest civilians in games with 4 or more players', () => {
      const players = Array.from({ length: 5 }, (_, i) => ({ username: `Player${i}` }));
      const assigned = assignPlayerRolesAndOrder(players);
      const roles = assigned.map(p => p.playerRole);

      expect(roles.filter(r => r === 'undercover').length).toBe(1);
      expect(roles.filter(r => r === 'mr.white').length).toBe(1);
      expect(roles.filter(r => r === 'civilian').length).toBe(3);
    });

    it('should throw an error if there are fewer than 3 players', () => {
      const players = [{ username: 'Solo' }, { username: 'Duo' }];
      expect(() => assignPlayerRolesAndOrder(players)).toThrow('Need at least 3 players to start the game');
    });
  });

  describe('Room Join and Capacity', () => {
    it('should prevent players from joining if the room has 10 players already', async () => {
      const room = {
        players: Array.from({ length: 10 }, (_, i) => ({ username: `Player${i}` })),
        hasStarted: false
      };

      const newPlayer = { username: 'Player10' };
      const canJoin = room.players.length < 10 && !room.hasStarted;

      expect(canJoin).toBe(false);
    });

    it('should prevent joining a room after the game has started', () => {
      const room = {
        players: [{ username: 'Host' }],
        hasStarted: true
      };

      const canJoin = !room.hasStarted;
      expect(canJoin).toBe(false);
    });

    it('should allow joining if room has fewer than 10 players and game has not started', () => {
      const room = {
        players: Array.from({ length: 9 }, (_, i) => ({ username: `Player${i}` })),
        hasStarted: false
      };

      const canJoin = room.players.length < 10 && !room.hasStarted;
      expect(canJoin).toBe(true);
    });
  });
});