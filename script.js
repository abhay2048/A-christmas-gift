import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDau2bGEVfZZIZtdEInGjTlQA7jSs0ndGU",
    authDomain: "a-christmas-gift.firebaseapp.com",
    databaseURL: "https://a-christmas-gift-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "a-christmas-gift",
    storageBucket: "a-christmas-gift.firebasestorage.app",
    messagingSenderId: "560215769128",
    appId: "1:560215769128:web:331327bdc0417b4056351d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- 1. LOGIN SYSTEM ---
const loginScreen = document.getElementById('login-screen');
const loginBtn = document.getElementById('loginBtn');
const passwordInput = document.getElementById('passwordInput');

if (localStorage.getItem('wonderlandUnlocked') === 'true') {
    loginScreen.classList.add('hidden');
}

loginBtn.addEventListener('click', () => {
    if (passwordInput.value.toUpperCase() === "MOON") {
        localStorage.setItem('wonderlandUnlocked', 'true');
        loginScreen.classList.add('hidden');
    } else {
        alert("Incorrect secret word, my love. ❤️");
        passwordInput.value = "";
    }
});

// --- 2. COUNTDOWN & REVEAL ---
let targetDate = new Date("December 25, 2025 00:00:00").getTime();
let revealTriggered = false;

function updateCountdown() {
    const now = new Date().getTime();
    const gap = targetDate - now;
    const timerDiv = document.getElementById('countdown-timer');

    if (gap <= 0) {
        timerDiv.innerText = "Merry Christmas! 🎁";
        if (!revealTriggered) {
            document.getElementById('reveal-overlay').classList.remove('hidden');
            revealTriggered = true;
        }
        return;
    }

    const d = Math.floor(gap / (1000 * 60 * 60 * 24));
    const h = Math.floor((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((gap % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((gap % (1000 * 60)) / 1000);
    timerDiv.innerText = `${d}d : ${h}h : ${m}m : ${s}s`;
}
setInterval(updateCountdown, 1000);

document.getElementById('previewTimer').addEventListener('click', () => {
    targetDate = new Date().getTime() + 5000;
    revealTriggered = false;
});

// --- 3. NOTE STATION ---
const noteRef = ref(db, 'notes/currentNote');
onValue(noteRef, (s) => {
    document.getElementById('latestNote').innerText = s.val() || "Write a note for me... ✉️";
});

document.getElementById('saveNoteBtn').addEventListener('click', () => {
    const input = document.getElementById('noteInput');
    if (input.value.trim()) {
        set(noteRef, input.value);
        input.value = '';
    }
});

// --- 4. BUCKET LIST ---
const bucketRef = ref(db, 'bucketList');
document.getElementById('addBucketBtn').addEventListener('click', () => {
    const input = document.getElementById('bucketInput');
    if (input.value) {
        push(bucketRef, { text: input.value, done: false });
        input.value = '';
    }
});

onValue(bucketRef, (snapshot) => {
    const list = document.getElementById('bucketList');
    list.innerHTML = '';
    const data = snapshot.val();
    if (data) {
        Object.entries(data).forEach(([key, item]) => {
            const li = document.createElement('li');
            li.className = item.done ? 'done' : '';
            const icon = item.done ? '✅' : '🌟';
            li.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px; cursor:pointer;" class="text-wrap">
                    <span>${icon}</span>
                    <span>${item.text}</span>
                </div>
                <button class="del-btn" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">❄️</button>
            `;
            li.querySelector('.text-wrap').addEventListener('click', () => {
                update(ref(db, `bucketList/${key}`), { done: !item.done });
            });
            li.querySelector('.del-btn').addEventListener('click', () => remove(ref(db, `bucketList/${key}`)));
            list.appendChild(li);
        });
    }
});

// --- 5. MUSIC BINDER ---
const songsRef = ref(db, 'binderSongs');
let allSongs = [];
let currentPage = 1;
const SONGS_PER_PAGE = 3;

document.getElementById('addSongBtn').addEventListener('click', () => {
    const input = document.getElementById('songLinkInput');
    const match = input.value.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (!match) return alert("Paste a Spotify link!");
    
    push(songsRef, {
        embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
        favLine: "", sideNote: "", timestamp: Date.now()
    });
    input.value = '';
});

onValue(songsRef, (snapshot) => {
    const data = snapshot.val();
    allSongs = data ? Object.entries(data).map(([id, s]) => ({...s, id})).sort((a,b) => b.timestamp - a.timestamp) : [];
    renderBinder();
});

function renderBinder() {
    const display = document.getElementById('binder-pages-display');
    display.innerHTML = '';
    const songs = allSongs.slice((currentPage-1)*SONGS_PER_PAGE, currentPage*SONGS_PER_PAGE);

    songs.forEach(song => {
        const div = document.createElement('div');
        div.className = 'song-entry';
        div.innerHTML = `
            <div class="song-memory">
                <h3>Our Memory</h3>
                <textarea class="side-note" placeholder="Why this song?" style="height:150px;">${song.sideNote}</textarea>
            </div>
            <div class="song-visual-stack">
                <div style="text-align:right;"><button class="del-song" style="background:none; border:none; color:white; opacity:0.3; cursor:pointer;">Remove ×</button></div>
                <div class="music-box">
                    <iframe src="${song.embedUrl}" width="100%" height="100%" frameBorder="0" allow="encrypted-media"></iframe>
                </div>
                <div class="favorite-line-box">
                    <input type="text" class="fav-line" value="${song.favLine}" placeholder="♥ Favorite Line..." style="font-weight:900;">
                </div>
            </div>
        `;
        div.querySelector('.fav-line').addEventListener('change', (e) => update(ref(db, `binderSongs/${song.id}`), {favLine: e.target.value}));
        div.querySelector('.side-note').addEventListener('change', (e) => update(ref(db, `binderSongs/${song.id}`), {sideNote: e.target.value}));
        div.querySelector('.del-song').addEventListener('click', () => remove(ref(db, `binderSongs/${song.id}`)));
        display.appendChild(div);
    });

    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage * SONGS_PER_PAGE >= allSongs.length;
}

document.getElementById('prevBtn').addEventListener('click', () => { currentPage--; renderBinder(); });
document.getElementById('nextBtn').addEventListener('click', () => { currentPage++; renderBinder(); });

// --- 6. SNOW ---
function createSnow() {
    const container = document.getElementById('snow-container');
    const flake = document.createElement('div');
    const icons = ['❄', '✨', '🤍'];
    flake.innerHTML = icons[Math.floor(Math.random() * icons.length)];
    flake.style.cssText = `
        position: fixed; top: -10%; left: ${Math.random() * 100}vw;
        font-size: ${Math.random() * 10 + 10}px; opacity: ${Math.random()};
        z-index: 1; pointer-events: none;
        animation: fall ${Math.random() * 3 + 4}s linear forwards;
    `;
    container.appendChild(flake);
    setTimeout(() => flake.remove(), 6000);
}
setInterval(createSnow, 300);

const styleTag = document.createElement('style');
styleTag.textContent = `@keyframes fall { to { transform: translateY(110vh) rotate(360deg); } }`;
document.head.appendChild(styleTag);
