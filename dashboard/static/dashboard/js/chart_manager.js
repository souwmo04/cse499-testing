let chart1, chart2, chart3, barChart, pieChart; // Global variables

// Function to initialize or update charts
function initializeCharts(data) {
    const ctx1 = document.getElementById('chart-1').getContext('2d');
    const ctx2 = document.getElementById('chart-2').getContext('2d');
    const ctx3 = document.getElementById('chart-3').getContext('2d');

    // Destroy previous line charts if they exist
    if (chart1) chart1.destroy();
    if (chart2) chart2.destroy();
    if (chart3) chart3.destroy();

    // =========================
    // LINE CHARTS
    // =========================
    chart1 = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: 'Gold Price',
                data: data.gold,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                tension: 0.3
            }]
        },
        options: { responsive: true }
    });

    chart2 = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: 'Silver Price',
                data: data.silver,
                borderColor: '#6b7280',
                backgroundColor: 'rgba(107,114,128,0.2)',
                tension: 0.3
            }]
        },
        options: { responsive: true }
    });

    chart3 = new Chart(ctx3, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: 'Oil Price',
                data: data.oil,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,0.2)',
                tension: 0.3
            }]
        },
        options: { responsive: true }
    });

    // =========================
    // STATS CARDS
    // =========================
    const totalRecords = document.getElementById('total-records');
    const lastUpdated = document.getElementById('last-updated');
    if (totalRecords) totalRecords.textContent = data.dates.length;
    if (lastUpdated) lastUpdated.textContent = new Date().toLocaleTimeString();

    if (data.dates.length > 0) {
        const lastIndex = data.dates.length - 1;

        // =========================
        // KPI UPDATE
        // =========================
        document.getElementById('kpi-gold').textContent = data.gold[lastIndex];
        document.getElementById('kpi-silver').textContent = data.silver[lastIndex];
        document.getElementById('kpi-oil').textContent = data.oil[lastIndex];

        document.getElementById('kpi-date').textContent = data.dates[lastIndex];
        document.getElementById('kpi-date-2').textContent = data.dates[lastIndex];
        document.getElementById('kpi-date-3').textContent = data.dates[lastIndex];

        // =========================
        // CHANGE DETECTION PANEL
        // =========================
        const prevIndex = lastIndex - 1 >= 0 ? lastIndex - 1 : 0;

        const goldChange = data.gold[lastIndex] - data.gold[prevIndex];
        const silverChange = data.silver[lastIndex] - data.silver[prevIndex];
        const oilChange = data.oil[lastIndex] - data.oil[prevIndex];

        function formatChange(value) {
            if (value > 0) return `↑ ${value.toFixed(2)}`;
            else if (value < 0) return `↓ ${Math.abs(value).toFixed(2)}`;
            else return `→ 0`;
        }

        document.getElementById('change-gold').textContent = formatChange(goldChange);
        document.getElementById('change-silver').textContent = formatChange(silverChange);
        document.getElementById('change-oil').textContent = formatChange(oilChange);

        // =========================
        // BAR CHART (LATEST COMPARISON)
        // =========================
        const barData = {
            labels: ['Gold', 'Silver', 'Oil'],
            datasets: [{
                label: 'Latest Price',
                data: [
                    data.gold[lastIndex],
                    data.silver[lastIndex],
                    data.oil[lastIndex]
                ],
                backgroundColor: ['#f59e0b', '#9ca3af', '#2563eb']
            }]
        };

        const barCtx = document.getElementById('bar-chart').getContext('2d');
        if (barChart) barChart.destroy();

        barChart = new Chart(barCtx, {
            type: 'bar',
            data: barData,
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false } }
            }
        });

        // =========================
        // PIE CHART (LATEST DISTRIBUTION)
        // =========================
        const latestValues = [
            data.gold[lastIndex],
            data.silver[lastIndex],
            data.oil[lastIndex]
        ];

        const pieCtx = document.getElementById('pie-chart').getContext('2d');
        if (pieChart) pieChart.destroy();

        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['Gold', 'Silver', 'Oil'],
                datasets: [{ data: latestValues, backgroundColor: ['#f59e0b', '#9ca3af', '#2563eb'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
}

// =========================
// FETCH DATA
// =========================
function fetchChartData() {
    fetch('/dashboard/api/chart-data/')
        .then(res => res.json())
        .then(data => initializeCharts(data))
        .catch(err => console.error('Error fetching chart data:', err));
}

// =========================
// CSRF TOKEN
// =========================
function getCSRFToken() {
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    return token ? token.value : '';
}

// =========================
// INIT
// =========================
document.addEventListener('DOMContentLoaded', function() {
    fetchChartData();
    setInterval(fetchChartData, 10000);

    // =========================
    // SNAPSHOT BUTTON WITH TIMESTAMP & SIZE LIMIT
    // =========================
    const snapshotBtn = document.getElementById('saveSnapshotBtn');
    if (snapshotBtn) {
        snapshotBtn.addEventListener('click', () => {
            const dashboardElement = document.getElementById('dashboard-container');

            html2canvas(dashboardElement).then(canvas => {
                // Limit max width/height
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                const scale = Math.min(MAX_WIDTH / canvas.width, MAX_HEIGHT / canvas.height, 1);

                const resizedCanvas = document.createElement('canvas');
                resizedCanvas.width = canvas.width * scale;
                resizedCanvas.height = canvas.height * scale;

                const ctx = resizedCanvas.getContext('2d');
                ctx.scale(scale, scale);
                ctx.drawImage(canvas, 0, 0);

                // Add timestamp overlay
                ctx.font = "16px Arial";
                ctx.fillStyle = "red";
                ctx.fillText(new Date().toLocaleString(), 10 / scale, 20 / scale);

                const imageData = resizedCanvas.toDataURL('image/png');

                fetch('/dashboard/save-snapshot/', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken()
                    },
                    body: JSON.stringify({ image: imageData })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') alert("Snapshot saved successfully!");
                    else alert("Failed to save snapshot: " + (data.error || ""));
                })
                .catch(err => {
                    console.error(err);
                    alert("Failed to save snapshot");
                });
            });
        });
    }
});
