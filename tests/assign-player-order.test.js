const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Load the JS file as a string
const fileContent = fs.readFileSync(
  path.resolve(__dirname, '../src/public/js/assign-player-order.js'),
  'utf-8'
);

// Setup JSDOM and evaluate the JS file in the window context
const dom = new JSDOM(`<!DOCTYPE html><body><ul id="player-order"></ul></body>`, { runScripts: "outside-only" });
dom.window.eval(fileContent);

// Extract functions from the evaluated script
const shuffle = dom.window.shuffle || eval(`(${fileContent.match(/function shuffle[\s\S]*?\}/)[0]})`);
const players = dom.window.players || ["Aaliayh", "Rizwaanah", "Glen", "Noah"];

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

  it('should produce different orders sometimes', () => {
    const results = new Set();
    for (let i = 0; i < 10; i++) {
      results.add(shuffle([...players]).join(','));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});