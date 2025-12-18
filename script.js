// --- GLOBAL VARIABLES ---
const SONGS_PER_PAGE = 3;
let currentPage = 1;
// A default placeholder image for new songs
const DEFAULT_SONG_IMG = 'https://via.placeholder.com/220?text=Click+to+Add+Image';

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

// --- 3. MUSIC BINDER LOGIC (NEW!) ---

// Helper to get songs from LocalStorage
function getSongs() {
    return JSON.parse(localStorage.getItem('binderSongs')) || [];
}

// Helper to save songs to LocalStorage
function saveSongs(songs) {
    localStorage.setItem('binderSongs', JSON.stringify(songs));
}

// Function to add a new song entry
function addNewSong() {
    const input = document.getElementById('songLinkInput');
    const link = input.value.trim();
    
    if (!link) {
        alert("Please paste a link first!");
        return;
    }

    const songs = getSongs();
    // Create a new song object with placeholder data
    const newSong = {
        id: Date.now(), // Unique ID for the song
        link: link,
        title: "Click to Edit Title",
        artist: "Click to Edit Artist",
        image: DEFAULT_SONG_IMG,
        favoriteLine: "",
        sideNote: ""
    };

    songs.unshift(newSong); // Add to the beginning of the list
    saveSongs(songs);
    
    input.value = ''; // Clear input
    currentPage = 1; // Go back to the first page to see the new song
    renderBinderPage();
}

// Function to update a song's details when edited
function updateSongDetails(id, field, value) {
    const songs = getSongs();
    const songIndex = songs.findIndex(song => song.id === id);
    if (songIndex !== -1) {
        songs[songIndex][field] = value;
        saveSongs(songs);
    }
}

// Function to change song image
function changeSongImage(id) {
    const newUrl = prompt("Paste the URL of the song's album art here:");
    if (newUrl) {
        updateSongDetails(id, 'image', newUrl);
        renderBinderPage();
    }
}

// Function to render the current page of songs
function renderBinderPage() {
    const songs = getSongs();
    const displayContainer = document.getElementById('binder-pages-display');
    displayContainer.innerHTML = ''; // Clear current display

    // Calculate pagination bounds
    const startIndex = (currentPage - 1) * SONGS_PER_PAGE;
    const endIndex = Math.min(startIndex + SONGS_PER_PAGE, songs.length);
    const songsToDisplay = songs.slice(startIndex, endIndex);

    if (songs.length === 0) {
        displayContainer.innerHTML = '<p style="text-align:center; font-style:italic;">No songs added yet. Paste a link above to begin!</p>';
    } else {
        songsToDisplay.forEach(song => {
            // Create the HTML structure for one song entry
            const songEntryHTML = `
                <div class="song-entry">
                    <div class="song-card">
                        <div class="song-image" onclick="changeSongImage(${song.id})" style="background-image: url('${song.image}')"></div>
                        <div class="song-details">
                            <div class="song-title" contenteditable="true" onblur="updateSongDetails(${song.id}, 'title', this.innerText)">${song.title}</div>
                            <div class="song-artist" contenteditable="true" onblur="updateSongDetails(${song.id}, 'artist', this.innerText)">${song.artist}</div>
                        </div>
                        <div class="favorite-line-container">
                            <label class="favorite-line-label">♥ Favorite Line:</label>
                            <input type="text" class="handwritten-input" 
                                   value="${song.favoriteLine}" 
                                   oninput="updateSongDetails(${song.id}, 'favoriteLine', this.value)" 
                                   placeholder="Write it here...">
                        </div>
                    </div>

                    <div class="side-note-area">
                        <label class="side-note-label">📝 Notes & Memories:</label>
                        <textarea class="side-note-textarea" 
                                  oninput="updateSongDetails(${song.id}, 'sideNote', this.value)" 
                                  placeholder="Why does this song remind you of us?">${song.sideNote}</textarea>
                    </div>
                </div>
            `;
            displayContainer.insertAdjacentHTML('beforeend', songEntryHTML);
        });
    }

    // Update Pagination Controls
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = endIndex >= songs.length;
}

// Function to handle page changes
function changePage(direction) {
    currentPage += direction;
    renderBinderPage();
    // Scroll back to the top of the binder container for a better experience
    document.querySelector('.binder-container').scrollIntoView({ behavior: 'smooth' });
}


// --- 4. Bucket List Logic ---
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

// --- 5. Note Station Logic ---
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
// Runs when the page first opens
window.onload = function() {
    updateTimer();
    renderBinderPage();
    renderBucket();
    displayNote();
};
