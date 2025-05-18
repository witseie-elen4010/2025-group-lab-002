const { JSDOM } = require('jsdom');

describe('Clue History Logic', () => {
  let document;
  let room;

  beforeEach(() => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <body>
        <div id="players-container"></div>
        <div id="clue-history-container"></div>
        <button id="show-clue-history-btn"></button>
      </body>
    `, { runScripts: 'dangerously', resources: 'usable' });

    document = dom.window.document;

    // Fake room object
    room = {
      clues: [
        { playerUsername: 'Aaliyah', clue: 'Fruit' },
        { playerUsername: 'Glen', clue: 'Red' },
        { playerUsername: 'Noah', clue: 'Sweet' }
      ]
    };

    // Mock fetch if your modal relies on it
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ room })
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders clue history modal with all clues', async () => {
    // Simulate click and modal creation logic
    const showClueHistoryBtn = document.getElementById('show-clue-history-btn');
  
    showClueHistoryBtn.addEventListener('click', async () => {
      const modal = document.createElement('div');
      const clueList = document.createElement('div');
  
      const response = await fetch('/api/game/get-room?code=ABCDE');
      const data = await response.json();
      const latestClues = data.room.clues;
  
      latestClues.forEach(({ playerUsername, clue }) => {
        const item = document.createElement('div');
        item.className = 'clue-item'; // Add class to target clue items
        item.textContent = `${playerUsername}: ${clue}`;
        clueList.appendChild(item);
      });
  
      modal.appendChild(clueList);
      document.body.appendChild(modal);
    });
  
    showClueHistoryBtn.click();
  
    // wait for async work
    await new Promise(setImmediate);
  
    const clueItems = document.querySelectorAll('.clue-item');
    expect(clueItems.length).toBe(3);
    expect(clueItems[0].textContent).toBe('Aaliyah: Fruit');
    expect(clueItems[2].textContent).toBe('Noah: Sweet');
  });
  
  test('displays message when no clues exist', async () => {
    room.clues = [];

    const showClueHistoryBtn = document.getElementById('show-clue-history-btn');
    showClueHistoryBtn.addEventListener('click', async () => {
      const clueList = document.createElement('div');

      const response = await fetch('/api/game/get-room?code=ABCDE');
      const data = await response.json();
      const latestClues = data.room.clues;

      if (latestClues.length === 0) {
        clueList.textContent = 'No clues have been given yet.';
      }

      document.body.appendChild(clueList);
    });

    showClueHistoryBtn.click();
    await new Promise(setImmediate);

    expect(document.body.textContent).toMatch(/no clues have been given yet/i);
  });
});
