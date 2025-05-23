  const { assignPlayerRolesAndOrder } = require('../src/utils/assign-roles-order');

  describe('assignPlayerRolesAndOrder', () => {
    it('should throw error with fewer than 3 players', () => {
      const players = [
        { username: 'Player1' },
        { username: 'Player2' }
      ];
      expect(() => assignPlayerRolesAndOrder(players)).toThrow('Need at least 3 players to start the game');
    });

    it('should assign roles correctly in a 3-player game', () => {
      const players = [
        { username: 'Player1' },
        { username: 'Player2' },
        { username: 'Player3' }
      ];
      const assigned = assignPlayerRolesAndOrder(players);
      
      expect(assigned.length).toBe(3);
      expect(assigned.filter(p => p.playerRole === 'undercover').length).toBe(1);
      expect(assigned.filter(p => p.playerRole === 'civilian').length).toBe(2);
      expect(assigned.filter(p => p.playerRole === 'mr.white').length).toBe(0);
    });

    it('should assign roles correctly in a 4+ player game', () => {
      const players = [
        { username: 'Player1' },
        { username: 'Player2' },
        { username: 'Player3' },
        { username: 'Player4' }
      ];
      const assigned = assignPlayerRolesAndOrder(players);
      
      expect(assigned.length).toBe(4);
      expect(assigned.filter(p => p.playerRole === 'undercover').length).toBe(1);
      expect(assigned.filter(p => p.playerRole === 'mr.white').length).toBe(1);
      expect(assigned.filter(p => p.playerRole === 'civilian').length).toBe(2);
    });

    it('should assign roles to all players', () => {
      const players = [
        { username: 'Player1' },
        { username: 'Player2' },
        { username: 'Player3' },
        { username: 'Player4' }
      ];
      const assigned = assignPlayerRolesAndOrder(players);
      
      assigned.forEach(player => {
        expect(player.username).toBeDefined();
        expect(player.playerRole).toBeDefined();
        expect(['undercover', 'mr.white', 'civilian']).toContain(player.playerRole);
      });
    });

    it('should shuffle roles differently sometimes', () => {
      const players = [
        { username: 'Player1' },
        { username: 'Player2' },
        { username: 'Player3' },
        { username: 'Player4' }
      ];
      
      const results = new Set();
      for (let i = 0; i < 10; i++) {
        results.add(assignPlayerRolesAndOrder(players).map(p => p.playerRole).join(','));
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });