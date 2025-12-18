// --- GLOBAL VARIABLES ---
const SONGS_PER_PAGE = 3;
let currentPage = 1;

// --- 1. Snowfall Effect ---
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

// --- 2. Countdown Logic ---
// CHANGE THIS DATE TO YOUR OWN SPECIAL DATE!
const targetDate = new Date("December 25, 2025 00:00:00").getTime();

function updateTimer() {
    const now = new Date().getTime();
    const gap = targetDate - now;

    const day = 1000 * 60 * 60 * 24;
    const d = Math.floor(gap / day);
    
    const timerElement = document.getElementById('countdown-timer');
    if (timerElement) {
        timerElement.innerText = d > 0 ? `${d} Days until Christmas! 🎄` : "Merry Christmas! 🎁";
    }
}
setInterval(updateTimer, 1000);

// --- 3. AUTO-PLAY MUSIC BINDER LOGIC ---

// Helper: Extract Spotify Embed URL from a standard Link
function getSpotifyEmbedUrl(url) {
    // Tries to find "track", "album", or "playlist" and the ID
    const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (match) {
        // match[1] is type (track), match[2] is ID
        return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
    }
    return null;
}

function getSongs() {
    return JSON.parse(localStorage.getItem('binderSongs')) || [];
}

function saveSongs(songs) {
    localStorage.setItem('binderSongs', JSON.stringify(songs));
}

function addNewSong() {
    const input = document.getElementById('songLinkInput');
    const rawLink = input.value.trim();
    
    if (!rawLink) {
        alert("Please paste a Spotify link!");
        return;
    }

    const embedUrl = getSpotifyEmbedUrl(rawLink);

    if (!embedUrl) {
        alert("Oops! That doesn't look like a valid Spotify track link.");
        return;
    }

    const songs = getSongs();
    const newSong = {
        id: Date.now(),
        embedUrl: embedUrl,
        favoriteLine: "",
        sideNote: ""
    };

    songs.unshift(newSong); // Add to top
    saveSongs(songs);
    
    input.value = '';
    currentPage = 1;
    renderBinderPage();
}

function updateSongDetails(id, field, value) {
    const songs = getSongs();
    const songIndex = songs.findIndex(song => song.id === id);
    if (songIndex !== -1) {
        songs[songIndex][field] = value;
        saveSongs(songs);
    }
}

function renderBinderPage() {
    const songs = getSongs();
    const displayContainer = document.getElementById('binder-pages-display');
    displayContainer.innerHTML = ''; 

    const startIndex = (currentPage - 1) * SONGS_PER_PAGE;
    const endIndex = Math.min(startIndex + SONGS_PER_PAGE, songs.length);
    const songsToDisplay = songs.slice(startIndex, endIndex);

    if (songs.length === 0) {
        displayContainer.innerHTML = '<p style="text-align:center; font-style:italic;">No songs added yet. Paste a link above!</p>';
    } else {
        songsToDisplay.forEach(song => {
            const songEntryHTML = `
                <div class="song-entry">
                    <div class="song-card">
                        <div class="spotify-embed-container">
                            <iframe src="${song.embedUrl}" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
                        </div>
                        <div class="favorite-line-container">
                            <label class="favorite-line-label">♥ Favorite Line:</label>
                            <input type="text" class="handwritten-input" 
                                   value="${song.favoriteLine}" 
                                   oninput="updateSongDetails(${song.id}, 'favoriteLine', this.value)" 
                                   placeholder="Type lyrics here...">
                        </div>
                    </div>

                    <div class="side-note-area">
                        <label class="side-note-label">📝 Notes & Memories:</label>
                        <textarea class="side-note-textarea" 
                                  oninput="updateSongDetails(${song.id}, 'sideNote', this.value)" 
                                  placeholder="Why this song? Write a memory...">${song.sideNote}</textarea>
                    </div>
                </div>
            `;
            displayContainer.insertAdjacentHTML('beforeend', songEntryHTML);
        });
    }

    // Update Pagination
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = endIndex >= songs.length;
}

function changePage(direction) {
    currentPage += direction;
    renderBinderPage();
    document.querySelector('.binder-container').scrollIntoView({ behavior: 'smooth' });
}


// --- 4. BUCKET LIST LOGIC (Updated for Strikethrough) ---
function addToBucket() {
    const input = document.getElementById('bucketInput');
    if (!input.value) return;

    let items = JSON.parse(localStorage.getItem('myBucket')) || [];
    // Each item is now an object: { text: "...", done: false }
    items.push({ text: input.value, done: false });
    
    localStorage.setItem('myBucket', JSON.stringify(items));
    renderBucket();
    input.value = '';
}

function toggleBucketItem(index) {
    let items = JSON.parse(localStorage.getItem('myBucket')) || [];
    items[index].done = !items[index].done; // Flip true/false
    localStorage.setItem('myBucket', JSON.stringify(items));
    renderBucket();
}

function renderBucket() {
    const list = document.getElementById('bucketList');
    const items = JSON.parse(localStorage.getItem('myBucket')) || [];
    
    // Check if legacy data exists (strings instead of objects) and fix it
    if (items.length > 0 && typeof items[0] === 'string') {
        const fixedItems = items.map(t => ({ text: t, done: false }));
        localStorage.setItem('myBucket', JSON.stringify(fixedItems));
        renderBucket(); // Re-run with fixed data
        return;
    }

    list.innerHTML = items.map((item, index) => `
        <li class="${item.done ? 'completed' : ''}" onclick="toggleBucketItem(${index})">
            ${item.text}
        </li>
    `).join('');
}

// --- 5. NOTE STATION LOGIC ---
function saveNote() {
    const note = document.getElementById('noteInput').value;
    localStorage.setItem('savedNote', note);
    displayNote();
}

function displayNote() {
    const note = localStorage.getItem('savedNote');
    document.getElementById('latestNote').innerText = note ? note : "No notes yet...";
}

// --- INITIAL LOAD ---
window.onload = function() {
    updateTimer();
    renderBinderPage();
    renderBucket();
    displayNote();
};
