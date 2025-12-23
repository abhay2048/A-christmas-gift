// Import the functions you need from the SDKs (Using CDN for GitHub Pages compatibility)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your specific Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDau2bGEVfZZIZtdEInGjTlQA7jSs0ndGU",
    authDomain: "a-christmas-gift.firebaseapp.com",
    databaseURL: "https://a-christmas-gift-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "a-christmas-gift",
    storageBucket: "a-christmas-gift.firebasestorage.app",
    messagingSenderId: "560215769128",
    appId: "1:560215769128:web:331327bdc0417b4056351d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- GLOBAL VARIABLES ---
const SONGS_PER_PAGE = 3;
let currentPage = 1;
let allSongs = [];

// --- 1. COUNTDOWN TIMER ---
const targetDate = new Date("December 25, 2025 00:00:00").getTime();
setInterval(() => {
    const now = new Date().getTime();
    const gap = targetDate - now;
    const d = Math.floor(gap / (1000 * 60 * 60 * 24));
    const h = Math.floor((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    const timerElement = document.getElementById('countdown-timer');
    if (timerElement) {
        timerElement.innerText = d > 0 ? `${d} Days, ${h} Hours until Christmas! 🎄` : "Merry Christmas! 🎁";
    }
}, 1000);

// --- 2. NOTE STATION (Shared) ---
const noteRef = ref(db, 'notes/currentNote');

document.getElementById('saveNoteBtn').addEventListener('click', () => {
    const note = document.getElementById('noteInput').value;
    if (note.trim() !== "") {
        set(noteRef, note);
        document.getElementById('noteInput').value = ""; // Clear input after pinning
    }
});

onValue(noteRef, (snapshot) => {
    const data = snapshot.val();
    document.getElementById('latestNote').innerText = data ? data : "No notes yet... Write something for me!";
});

// --- 3. BUCKET LIST (Shared & Click to Cross Out) ---
const bucketRef = ref(db, 'bucketList');

document.getElementById('addBucketBtn').addEventListener('click', () => {
    const input = document.getElementById('bucketInput');
    if (!input.value) return;
    
    push(bucketRef, {
        text: input.value,
        done: false
    });
    input.value = '';
});

onValue(bucketRef, (snapshot) => {
    const list = document.getElementById('bucketList');
    list.innerHTML = '';
    const data = snapshot.val();

    if (data) {
        Object.entries(data).forEach(([key, item]) => {
            const li = document.createElement('li');
            li.innerHTML = item.text;
            if (item.done) li.classList.add('completed');
            
            li.addEventListener('click', () => {
                update(ref(db, `bucketList/${key}`), { done: !item.done });
            });
            list.appendChild(li);
        });
    }
});

// --- 4. MUSIC BINDER (Shared & Auto-Player) ---
const songsRef = ref(db, 'binderSongs');

document.getElementById('addSongBtn').addEventListener('click', () => {
    const input = document.getElementById('songLinkInput');
    const rawLink = input.value.trim();
    if (!rawLink) return;

    // Convert regular Spotify link to Embed URL
    const match = rawLink.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (!match) return alert("Please use a valid Spotify link!");
    
    const embedUrl = `https://open.spotify.com/embed/${match[1]}/${match[2]}`;

    push(songsRef, {
        embedUrl: embedUrl,
        favoriteLine: "",
        sideNote: "",
        timestamp: Date.now()
    });
    input.value = '';
});

onValue(songsRef, (snapshot) => {
    const data = snapshot.val();
    allSongs = [];
    if (data) {
        Object.entries(data).forEach(([key, song]) => {
            allSongs.push({ ...song, id: key });
        });
        allSongs.sort((a, b) => b.timestamp - a.timestamp);
    }
    renderBinderPage();
});

function renderBinderPage() {
    const displayContainer = document.getElementById('binder-pages-display');
    displayContainer.innerHTML = ''; 

    const startIndex = (currentPage - 1) * SONGS_PER_PAGE;
    const endIndex = Math.min(startIndex + SONGS_PER_PAGE, allSongs.length);
    const songsToDisplay = allSongs.slice(startIndex, endIndex);

    if (allSongs.length === 0) {
        displayContainer.innerHTML = '<p style="text-align:center; font-style:italic;">No songs in our binder yet...</p>';
    } else {
        songsToDisplay.forEach(song => {
            const div = document.createElement('div');
            div.className = 'song-entry';
            div.innerHTML = `
                <div class="song-card">
                    <div class="spotify-embed-container">
                        <iframe src="${song.embedUrl}" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>
                    </div>
                    <div class="favorite-line-container">
                        <label class="favorite-line-label">♥ Favorite Line:</label>
                        <input type="text" class="handwritten-input fav-input" value="${song.favoriteLine}" placeholder="Type lyrics here...">
                    </div>
                </div>
                <div class="side-note-area">
                    <label class="side-note-label">📝 Notes & Memories:</label>
                    <textarea class="side-note-textarea note-input" placeholder="Why this song reminds me of you...">${song.sideNote}</textarea>
                </div>
            `;

            // Auto-save fields as they type
            div.querySelector('.fav-input').addEventListener('change', (e) => {
                update(ref(db, `binderSongs/${song.id}`), { favoriteLine: e.target.value });
            });

            div.querySelector('.note-input').addEventListener('change', (e) => {
                update(ref(db, `binderSongs/${song.id}`), { sideNote: e.target.value });
            });

            displayContainer.appendChild(div);
        });
    }

    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = endIndex >= allSongs.length;
}

document.getElementById('prevBtn').addEventListener('click', () => {
    currentPage--;
    renderBinderPage();
});
document.getElementById('nextBtn').addEventListener('click', () => {
    currentPage++;
    renderBinderPage();
});

// --- 5. VISUAL SNOW ---
function createSnow() {
    const container = document.getElementById('snow-container');
    if (!container) return;
    const flake = document.createElement('div');
    flake.classList.add('snowflake');
    flake.innerHTML = '❄';
    flake.style.left = Math.random() * 100 + 'vw';
    flake.style.fontSize = Math.random() * 10 + 10 + 'px';
    flake.style.opacity = Math.random();
    flake.style.animationDuration = Math.random() * 3 + 2 + 's';
    container.appendChild(flake);
    setTimeout(() => flake.remove(), 5000);
}
setInterval(createSnow, 300);
