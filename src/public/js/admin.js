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

    document.getElementById('back-button').addEventListener('click', () => {
        window.location.href = './landing';
    });

    document.getElementById('logs-button').addEventListener('click', () => {
        document.getElementById('log-filters').style.display = 'block';
    });

    document.getElementById('filter-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const date = document.getElementById('date').value;
        const room = document.getElementById('room').value;
        const username = document.getElementById('username').value;

        const query = new URLSearchParams({ date, room, username }).toString();

        try {
            const res = await fetch(`/api/admin/logs?${query}`);
            const logs = await res.json();

            const resultsDiv = document.getElementById('log-results');
            if (logs.length === 0) {
            resultsDiv.innerHTML = '<p>No logs found.</p>';
            return;
            }

            resultsDiv.innerHTML = logs.map(log => `
            <div class="border rounded p-2 mb-2">
                <strong>${log.timestamp}</strong> | 
                User: ${log.username || log.user_id} |
                Room: ${log.room} <br />
                Action: ${log.action} <br />
                Details: ${log.details}
            </div>
            `).join('');
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        }
    });

});