//generate-code.test.js
const generateCode = require('../src/utils/create-game-code')

describe('generateCode', () => {
  it('generates a code of default length 5', () => {
    const code = generateCode();
    expect(code).toHaveLength(5);
  });

  it('generates a code of specified length', () => {
    const length = 10;
    const code = generateCode(length);
    expect(code).toHaveLength(length);
  });

  it('only contains valid characters (A-Z, 0-9)', () => {
    const validChars = /^[A-Z0-9]+$/;
    const code = generateCode(20);
    expect(code).toMatch(validChars);
  });

  it('returns different results on multiple calls (usually)', () => {
    const code1 = generateCode();
    const code2 = generateCode();
    expect(code1).not.toBe(code2); // Could theoretically fail if RNG produces the same result
  });
});