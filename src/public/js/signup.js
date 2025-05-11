// public/js/signup.js
const signupForm = document.getElementById('signup-form');
const signupError = document.getElementById('signup-error');

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/users/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Signup successful! Redirecting to login...');
      window.location.href = 'login';
    } else {
      signupError.style.display = 'block';
      signupError.textContent = data.message;
    }
  } catch (err) {
    signupError.style.display = 'block';
    signupError.textContent = 'An error occurred. Please try again.';
  }
});