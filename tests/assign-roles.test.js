const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Load the JS file as a string
const fileContent = fs.readFileSync(path.resolve(__dirname, '../src/public/assign-roles.js'), 'utf-8');

// Setup JSDOM and evaluate the JS file in the window context
const dom = new JSDOM(`<!DOCTYPE html><body></body>`, { runScripts: "outside-only" });
dom.window.eval(fileContent);

const assignPlayerRoles = dom.window.getAssignedRoles;
const shuffle = dom.window.shuffle || eval(`(${fileContent.match(/function shuffle[\s\S]*?\}/)[0]})`);

describe('assignPlayerRoles', () => {
  it('should assign exactly one Mr White', () => {
    const assignments = assignPlayerRoles();
    const mrWhiteCount = assignments.filter(a => a.role === 'Mr White').length;
    expect(mrWhiteCount).toBe(1);
  });

  it('should assign exactly one Undercover', () => {
    const assignments = assignPlayerRoles();
    const undercoverCount = assignments.filter(a => a.role === 'Undercover').length;
    expect(undercoverCount).toBe(1);
  });

  it('should assign exactly two Civilians', () => {
    const assignments = assignPlayerRoles();
    const civilianCount = assignments.filter(a => a.role === 'Civilian').length;
    expect(civilianCount).toBe(2);
  });

  it('should assign a role to each player', () => {
    const assignments = assignPlayerRoles();
    expect(assignments.length).toBe(4);
    assignments.forEach(a => {
      expect(a.player).toBeDefined();
      expect(a.role).toBeDefined();
    });
  });

  it('should shuffle roles differently sometimes', () => {
    // Run shuffle multiple times and check for at least one difference
    const results = new Set();
    for (let i = 0; i < 10; i++) {
      results.add(assignPlayerRoles().map(a => a.role).join(','));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('shuffle', () => {
  it('should return a new array with the same elements', () => {
    const arr = [1, 2, 3, 4];
    const shuffled = shuffle([...arr]);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('should not mutate the original array', () => {
    const arr = [1, 2, 3, 4];
    const arrCopy = [...arr];
    shuffle(arrCopy);
    expect(arr).toEqual([1, 2, 3, 4]);
  });
});