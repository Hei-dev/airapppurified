// --- Configuration ---
const CHANNEL_ID = 'YOUR_CHANNEL_ID';
const READ_API_KEY = 'YOUR_READ_API_KEY';
const WRITE_API_KEY = 'YOUR_WRITE_API_KEY';

// Assume Field 1: PM2.5, Field 2: Temp, Field 3: Humidity, Field 4: Fan Command
const READ_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=15`;
const WRITE_URL = `https://api.thingspeak.com/update?api_key=${WRITE_API_KEY}`;

// --- Chart Initialization ---
let aqiChart, tempHumChart;

function initCharts() {
    const ctxAqi = document.getElementById('aqiChart').getContext('2d');
    aqiChart = new Chart(ctxAqi, {
        type: 'line',
        data: { labels: [], datasets: [{ label: 'PM2.5 (µg/m³)', borderColor: '#e74c3c', data: [] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxTempHum = document.getElementById('tempHumChart').getContext('2d');
    tempHumChart = new Chart(ctxTempHum, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Temperature (°C)', borderColor: '#f39c12', data: [] },
                { label: 'Humidity (%)', borderColor: '#3498db', data: [] }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// --- Fetch & Update Data ---
async function fetchData() {
    try {
        const response = await fetch(READ_URL);
        const data = await response.json();
        
        const labels = data.feeds.map(feed => new Date(feed.created_at).toLocaleTimeString());
        const pm25 = data.feeds.map(feed => feed.field1);
        const temp = data.feeds.map(feed => feed.field2);
        const hum = data.feeds.map(feed => feed.field3);

        updateChart(aqiChart, labels, [pm25]);
        updateChart(tempHumChart, labels, [temp, hum]);
        
        document.getElementById('statusMessage').innerText = "System status: Live Data Connected";
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('statusMessage').innerText = "System status: Connection Error";
    }
}

function updateChart(chart, labels, dataArrays) {
    chart.data.labels = labels;
    chart.data.datasets.forEach((dataset, i) => {
        dataset.data = dataArrays[i];
    });
    chart.update();
}

// --- Send Control Command ---
async function setFanSpeed(speedLevel) {
    // speedLevel: 0 = Auto, 1 = Low, 2 = Medium, 3 = High
    document.getElementById('statusMessage').innerText = "Sending command...";
    try {
        // We write the command to Field 4. The Arduino must periodically read Field 4.
        const response = await fetch(`${WRITE_URL}&field4=${speedLevel}`, { method: 'POST' });
        if (response.ok) {
            document.getElementById('statusMessage').innerText = `Fan speed overridden to level: ${speedLevel === 0 ? 'Auto' : speedLevel}`;
        } else {
            throw new Error('Network response was not ok.');
        }
    } catch (error) {
        document.getElementById('statusMessage').innerText = "Error sending command. ThingSpeak rate limit (15s) may apply.";
    }
}

// Boot up
window.onload = () => {
    initCharts();
    fetchData();
    // ThingSpeak free tier has a 15-second rate limit. Polling every 20s is safe.
    setInterval(fetchData, 20000); 
};

// This variable will save the event for later use.
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevents the default mini-infobar or install dialog from appearing on mobile
  e.preventDefault();
  // Save the event because you'll need to trigger it later.
  deferredPrompt = e;
  // Show your customized install prompt for your PWA
  // Your own UI doesn't have to be a single element, you
  // can have buttons in different locations, or wait to prompt
  // as part of a critical journey.
  showInAppInstallPromotion();
});

document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.view-section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');

            // 1. Remove 'active' class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // 2. Add 'active' class to the clicked button
            button.classList.add('active');

            // 3. Hide all sections
            sections.forEach(section => section.classList.add('hidden'));

            // 4. Show the section that matches the data-target
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
        });
    });
});