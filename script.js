// 1. Snowfall Effect
function createSnow() {
    const container = document.getElementById('snow-container');
    const flake = document.createElement('div');
    const size = Math.random() * 10 + 10 + 'px';
    
    flake.classList.add('snowflake');
    flake.innerHTML = '❄';
    flake.style.left = Math.random() * 100 + 'vw';
    flake.style.fontSize = size;
    flake.style.opacity = Math.random();
    flake.style.animationDuration = Math.random() * 3 + 2 + 's';
    
    container.appendChild(flake);
    
    setTimeout(() => {
        flake.remove();
    }, 5000);
}
setInterval(createSnow, 300);

// 2. Countdown Logic (Change your date here!)
const targetDate = new Date("December 25, 2025 00:00:00").getTime();

function updateTimer() {
    const now = new Date().getTime();
    const gap = targetDate - now;

    const day = 1000 * 60 * 60 * 24;
    const d = Math.floor(gap / day);
    
    document.getElementById('countdown-timer').innerText = 
        d > 0 ? `${d} Days until Christmas! 🎄` : "Merry Christmas! 🎁";
}
setInterval(updateTimer, 1000);

// 3. Music Binder Logic
function addSong() {
    const input = document.getElementById('songInput');
    if (!input.value) return;

    let songs = JSON.parse(localStorage.getItem('mySongs')) || [];
    songs.push(input.value);
    localStorage.setItem('mySongs', JSON.stringify(songs));
    
    renderSongs();
    input.value = '';
}

function renderSongs() {
    const grid = document.getElementById('musicGrid');
    const songs = JSON.parse(localStorage.getItem('mySongs')) || [];
    grid.innerHTML = songs.map(song => `
        <div class="music-card">
            <div class="tape-effect"></div>
            <div style="font-size: 2rem;">💿</div>
            <p><strong>${song}</strong></p>
        </div>
    `).join('');
}

// 4. Bucket List Logic
function addToBucket() {
    const input = document.getElementById('bucketInput');
    if (!input.value) return;

    let items = JSON.parse(localStorage.getItem('myBucket')) || [];
    items.push(input.value);
    localStorage.setItem('myBucket', JSON.stringify(items));
    
    renderBucket();
    input.value = '';
}

function renderBucket() {
    const list = document.getElementById('bucketList');
    const items = JSON.parse(localStorage.getItem('myBucket')) || [];
    list.innerHTML = items.map(item => `<li>${item}</li>`).join('');
}

// 5. Note Station
function saveNote() {
    const note = document.getElementById('noteInput').value;
    localStorage.setItem('savedNote', note);
    displayNote();
}

function displayNote() {
    const note = localStorage.getItem('savedNote');
    document.getElementById('latestNote').innerText = note ? `"${note}"` : "No notes yet...";
}

// Load everything on startup
renderSongs();
renderBucket();
displayNote();
updateTimer();
