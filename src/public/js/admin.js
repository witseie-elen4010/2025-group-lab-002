
document.addEventListener('DOMContentLoaded', async function () {
    // Optional: Access token or role check
    const user = JSON.parse(sessionStorage.getItem("loggedInUser"));

    if (!user || user.role !== 'admin') {
        alert('Access denied. Admins only.');
        console.log("OUT"); 
        setTimeout(() => {
            window.location.href = './landing';
        }, 100); // Delay 100ms so the alert shows first
    }

    // Button handlers
    document.getElementById('logs-button').addEventListener('click', () => {
    window.location.href = './logs.html'; // Create this page if needed
    });

    document.getElementById('users-button').addEventListener('click', () => {
    window.location.href = './manage-users.html'; // Create this page if needed
    });

    document.getElementById('settings-button').addEventListener('click', () => {
    window.location.href = './settings.html'; // Create this page if needed
    });

    document.getElementById('back-button').addEventListener('click', () => {
    window.location.href = './landing';
    });

});