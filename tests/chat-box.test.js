const { JSDOM } = require('jsdom');

// Mock Socket.io emit
const socketEmitMock = jest.fn();
global.io = () => ({ emit: socketEmitMock });

describe('Chatroom Modal', () => {
  let document;
  let roomCode = 'ABCDE';
  let currentUsername = 'Glen';

  beforeEach(() => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <body>
        <button id="open-chat-btn">Open Chat</button>
      </body>
    `, { url: `http://localhost?code=${roomCode}`, runScripts: 'dangerously' });

    document = dom.window.document;

    // Mock fetch for chat history
    global.fetch = jest.fn((url) => {
      if (url.includes('/get-chat')) {
        return Promise.resolve({
          json: () => Promise.resolve({ chat: [
            { username: 'Alice', message: 'Hi' },
            { username: 'Bob', message: 'Hello' }
          ] })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    // Simulate modal logic
    const openChatBtn = document.getElementById('open-chat-btn');
    openChatBtn.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.style.display = 'flex';

      const modalContent = document.createElement('div');

      const chatList = document.createElement('div');
      chatList.id = 'chat-list';

      const input = document.createElement('input');
      input.id = 'message-input';

      const sendBtn = document.createElement('button');
      sendBtn.textContent = 'Send';
      sendBtn.className = 'btn btn-primary';

      sendBtn.addEventListener('click', () => {
        const message = input.value.trim();
        if (message) {
          socketEmitMock({ message, username: currentUsername, code: roomCode });
        }
        input.value = '';
      });

      fetch(`/api/game/get-chat?code=${roomCode}`)
        .then(res => res.json())
        .then(data => {
          const messages = data.chat || [];
          if (messages.length > 0) {
            messages.forEach(({ username, message }) => {
              const chatItem = document.createElement('div');
              chatItem.className = 'chat-item';
              chatItem.textContent = `${username}: ${message}`;
              chatList.appendChild(chatItem);
            });
          } else {
            chatList.textContent = 'No chat messages yet.';
          }
        })
        .catch(() => {
          chatList.textContent = 'Failed to load chat history.';
        });

      modalContent.appendChild(chatList);
      modalContent.appendChild(input);
      modalContent.appendChild(sendBtn);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('opens chat modal and displays messages', async () => {
    document.getElementById('open-chat-btn').click();
    await new Promise(setImmediate);

    const chatItems = document.querySelectorAll('.chat-item');
    expect(chatItems.length).toBe(2);
    expect(chatItems[0].textContent).toMatch(/alice: hi/i);
    expect(chatItems[1].textContent).toMatch(/bob: hello/i);
  });

  test('displays fallback when no messages', async () => {
    global.fetch.mockImplementationOnce(() => Promise.resolve({ json: () => Promise.resolve({ chat: [] }) }));
    document.getElementById('open-chat-btn').click();
    await new Promise(setImmediate);
    expect(document.body.textContent).toMatch(/no chat messages yet/i);
  });

  test('sends message when send button clicked', async () => {
    document.getElementById('open-chat-btn').click();
    await new Promise(setImmediate);

    const input = document.getElementById('message-input');
    const sendBtn = document.querySelector('button.btn-primary');
    input.value = 'Test message';
    sendBtn.click();

    expect(socketEmitMock).toHaveBeenCalled();
  });

  test('starts discussion timer and ends after 60s', () => {
    jest.useFakeTimers();
  
    // Simulate the DOM environment
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'discussion-timer';
    document.body.appendChild(timerDisplay);
  
    // Simulate startDiscussionTime function
    let timeRemaining = 60;
    const updateTimer = () => {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      timerDisplay.textContent = `Discussion: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };
    updateTimer();
    const countdown = setInterval(() => {
      timeRemaining--;
      updateTimer();
      if (timeRemaining <= 0) {
        clearInterval(countdown);
        document.body.removeChild(timerDisplay);
      }
    }, 1000);
  
    // Fast-forward all 60 seconds
    jest.advanceTimersByTime(60000);
  
    // Assert that the timer was removed
    expect(document.getElementById('discussion-timer')).toBeNull();
  
    jest.useRealTimers();
  });
});