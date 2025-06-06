document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const signupError = document.getElementById('signup-error');

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email    = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Password validation
    const passwordValid =
      password.length >= 8 &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password) &&
      /[0-9]/.test(password);

    if (!passwordValid) {
      signupError.style.display = 'block';
      signupError.textContent =
        'Password must be at least 8 characters and contain at least one special character and one number.';
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      signupError.style.display = 'block';
      signupError.textContent = 'Passwords do not match. Please re-enter your password.';
      document.getElementById('password').value = '';
      document.getElementById('confirm-password').value = '';
      document.getElementById('password').focus();
      return;
    }

    try {
      // First, attempt to sign up
      const signupResponse = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        signupError.style.display = 'block';
        signupError.textContent = signupData.message || 'Signup failed.';
        return;
      }

      await fetch('/api/admin/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'Signup',
              details: `User ${username} signed up.`,
              username: username,
              room: null, // or replace with a room if relevant
              ip_address: null // optionally capture on the backend if needed
            })
      });
      // Then, auto-login after successful signup
      const loginResponse = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        sessionStorage.setItem('loggedInUser', JSON.stringify(loginData.user));
        alert('Signup and login successful! Redirecting to landing page...');
        window.location.href = '../game/join';
      } else {
        signupError.style.display = 'block';
        signupError.textContent = loginData.message || 'Login after signup failed.';
      }

    } catch (err) {
      signupError.style.display = 'block';
      signupError.textContent = 'An error occurred. Please try again.';
    }
  });
});