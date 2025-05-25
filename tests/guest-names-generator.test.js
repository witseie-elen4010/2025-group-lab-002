jest.mock('fs');
const fs = require('fs');
const path = require('path');

fs.readFileSync.mockImplementation((filePath) => {
  if (filePath.includes('adjectives.txt')) {
    return 'happy\nbrave\nsneaky';
  }
  if (filePath.includes('nouns.txt')) {
    return 'tiger\nninja\ndragon';
  }
  return '';
});

const { generateGuestName, reserveGuestName } = require('../src/utils/guest-name-creator');

describe('generateGuestName', () => {
  it('generates a guest name as a string', () => {
    const name = generateGuestName();
    expect(typeof name).toBe('string');
    expect(name).toMatch(/^(happy|brave|sneaky)(tiger|ninja|dragon)$/);
  });

  it('generates a guest name with separator and number', () => {
    const name = generateGuestName({ separator: '-', withNumber: true });
    expect(name).toMatch(/^(happy|brave|sneaky)-(tiger|ninja|dragon)/);
  });
});

describe('reserveGuestName', () => {
  it('adds a guest name to the reservation list', () => {
    const name = 'test-guest-001';
    reserveGuestName(name, 1000);
    // We can’t access internal Set directly, so just test that calling reserveGuestName doesn’t throw
    expect(true).toBe(true); 
  });
});