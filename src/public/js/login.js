document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
  
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
  
      try {
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
  
        const data = await response.json();
  
        if (response.ok) {
            await fetch('/api/admin/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'Login',
              details: `User ${username} logged in.`,
              username: username,
              room: null, // or replace with a room if relevant
              ip_address: null // optionally capture on the backend if needed
            })
          });

          sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));
          alert('Login successful! Redirecting to landing page...');
          window.location.href = '../game/join';
        } else {
          loginError.style.display = 'block';
          loginError.textContent = data.message;
        }
      } catch (err) {
        loginError.style.display = 'block';
        loginError.textContent = 'An error occurred. Please try again.';
      }
    });
  });