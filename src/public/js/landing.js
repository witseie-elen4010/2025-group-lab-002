document.getElementById('guest-button').addEventListener('click', async () => {
  console.log("HERE");
  try {
    const response = await fetch('/api/users/guest-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to get guest name');
    }

    const { name } = await response.json();

    // Show alert with the guest name
    alert(`Welcome, ${name}!`);

    sessionStorage.setItem('loggedInUser', JSON.stringify({ username: name, role: "guest-player", id:0 }));

    window.location.href = '../game/join';
    
  } catch (error) {
    console.error('Error generating guest name:', error);
    alert('Sorry! Something went wrong. Please try again.');
  }
});