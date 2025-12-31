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

// --- 1. THEME & MEMORY SYSTEM ---
const themeConfig = {
    christmas: {
        targetDate: new Date("December 25, 2025 00:00:00").getTime(),
        mainTitle: "Our Winter Wonderland",
        revealTitle: "Merry Christmas, my love...",
        revealDesc: "May your days be as pretty as the Christmas snow.",
        icons: ['❄', '✨', '🤍', '🎁'],
        loginEmoji: '❄️'
    },
    newYear: {
        targetDate: new Date("January 1, 2026 00:00:00").getTime(),
        mainTitle: "Our Midnight Sparkle",
        revealTitle: "Happy New Year, my love!",
        revealDesc: "365 new days, 365 new reasons to love you.",
        icons: ['✨', '🥂', '🎆', '⭐', '🎊'],
        loginEmoji: '🥂'
    }
};

let currentTheme = 'christmas';
let revealTriggered = false;

function switchTheme(themeKey) {
    currentTheme = themeKey;
    const config = themeConfig[themeKey];
    
    // UI Updates
    document.body.className = themeKey === 'newYear' ? 'ny-mode' : 'christmas-theme';
    document.getElementById('hero-title').innerText = config.mainTitle;
    document.getElementById('login-emoji').innerText = config.loginEmoji;
    
    // Reset reveal for previewing
    revealTriggered = false;
    
    // Update active button
    document.getElementById('btn-christmas').classList.toggle('active', themeKey === 'christmas');
    document.getElementById('btn-newyear').classList.toggle('active', themeKey === 'newYear');
}

document.getElementById('btn-christmas').addEventListener('click', () => switchTheme('christmas'));
document.getElementById('btn-newyear').addEventListener('click', () => switchTheme('newYear'));

// --- 2. LOGIN SYSTEM ---
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

// --- 3. COUNTDOWN & REVEAL ---
function handleReveal() {
    if (revealTriggered) return;
    revealTriggered = true;
    
    const config = themeConfig[currentTheme];
    const overlay = document.getElementById('reveal-overlay');
    
    document.getElementById('reveal-title').innerText = config.revealTitle;
    document.getElementById('reveal-desc').innerText = config.revealDesc;
    document.getElementById('reveal-icons').innerText = config.icons.join(' ');

    overlay.classList.remove('hidden');
    setTimeout(() => { overlay.classList.add('hidden'); }, 15000);
}

function updateCountdown() {
    const now = new Date().getTime();
    const config = themeConfig[currentTheme];
    const gap = config.targetDate - now;
    const timerDiv = document.getElementById('countdown-timer');

    if (gap <= 0) {
        timerDiv.innerText = currentTheme === 'christmas' ? "Merry Christmas! 🎁" : "Happy New Year! 🎆";
        handleReveal();
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
    revealTriggered = false;
    handleReveal(); // Immediate trigger for preview
});

// --- 4. DATA (NOTES, BUCKET, MUSIC) ---
// Note Station
const noteRef = ref(db, 'notes/currentNote');
onValue(noteRef, (s) => {
    document.getElementById('latestNote').innerText = s.val() || "No notes yet... Write something for me! 👇";
});
document.getElementById('saveNoteBtn').addEventListener('click', () => {
    const input = document.getElementById('noteInput');
    if (!input.value.trim()) return;
    set(noteRef, input.value);
    input.value = '';
});

// Bucket List
const bucketRef = ref(db, 'bucketList');
document.getElementById('addBucketBtn').addEventListener('click', () => {
    const input = document.getElementById('bucketInput');
    if (!input.value) return;
    push(bucketRef, { text: input.value, done: false });
    input.value = '';
});

onValue(bucketRef, (snapshot) => {
    const list = document.getElementById('bucketList');
    list.innerHTML = '';
    const data = snapshot.val();
    if (data) {
        Object.entries(data).forEach(([key, item]) => {
            const li = document.createElement('li');
            li.className = item.done ? 'done' : '';
            li.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px; cursor:pointer;" class="item-text">
                    <span>${item.done ? '✅' : '🌟'}</span>
                    <span>${item.text}</span>
                </div>
                <button class="del-btn" style="background:none; border:none; cursor:pointer; font-size: 1.2rem; opacity: 0.5;">❄️</button>
            `;
            li.querySelector('.item-text').addEventListener('click', () => update(ref(db, `bucketList/${key}`), { done: !item.done }));
            li.querySelector('.del-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm("Remove this adventure?")) remove(ref(db, `bucketList/${key}`));
            });
            list.appendChild(li);
        });
    }
});

// Music Binder
const songsRef = ref(db, 'binderSongs');
let allSongs = [];
let currentPage = 1;
const SONGS_PER_PAGE = 3;

document.getElementById('addSongBtn').addEventListener('click', () => {
    const input = document.getElementById('songLinkInput');
    const match = input.value.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (!match) return alert("Paste a valid Spotify link! ❤️");
    push(songsRef, { embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`, favLine: "", sideNote: "", timestamp: Date.now() });
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
            <div class="song-memory"><h3>Our Memory</h3><textarea class="side-note" style="height:150px;width:100%;">${song.sideNote}</textarea></div>
            <div class="song-visual-stack">
                <div class="music-box"><iframe src="${song.embedUrl}" width="100%" height="100%" frameBorder="0" allow="encrypted-media"></iframe></div>
                <div class="favorite-line-box"><input type="text" class="fav-line" value="${song.favLine}" placeholder="♥ Add favorite line..."></div>
            </div>
        `;
        div.querySelector('.fav-line').addEventListener('change', (e) => update(ref(db, `binderSongs/${song.id}`), {favLine: e.target.value}));
        div.querySelector('.side-note').addEventListener('change', (e) => update(ref(db, `binderSongs/${song.id}`), {sideNote: e.target.value}));
        display.appendChild(div);
    });
}

// --- 5. VISUAL PARTICLES (Dynamic Snow/Confetti) ---
function createParticle() {
    const container = document.getElementById('snow-container');
    const flake = document.createElement('div');
    const icons = themeConfig[currentTheme].icons;
    flake.innerHTML = icons[Math.floor(Math.random() * icons.length)];
    
    flake.style.cssText = `
        position: fixed; top: -10%; left: ${Math.random() * 100}vw;
        font-size: ${Math.random() * 15 + 10}px;
        opacity: ${Math.random() * 0.7 + 0.3};
        pointer-events: none; z-index: 1;
        animation: fall ${Math.random() * 4 + 5}s linear forwards;
    `;
    container.appendChild(flake);
    setTimeout(() => flake.remove(), 7000);
}
setInterval(createParticle, 300);

// CSS Animation Injection
const style = document.createElement('style');
style.textContent = `@keyframes fall { to { transform: translateY(110vh) rotate(360deg); } }`;
document.head.appendChild(style);
