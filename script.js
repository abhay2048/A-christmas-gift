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

// --- 1. Login ---
const loginScreen = document.getElementById('login-screen');
if (localStorage.getItem('wonderlandUnlocked') === 'true') loginScreen.classList.add('hidden');
document.getElementById('loginBtn').onclick = () => {
    if (document.getElementById('passwordInput').value.toUpperCase() === "MOON") {
        localStorage.setItem('wonderlandUnlocked', 'true');
        loginScreen.classList.add('hidden');
    } else { alert("Incorrect word, my love. ❤️"); }
};

// --- 2. Countdown ---
let targetDate = new Date("December 25, 2025 00:00:00").getTime();
setInterval(() => {
    const now = new Date().getTime();
    const gap = targetDate - now;
    const timer = document.getElementById('countdown-timer');
    if (gap <= 0) {
        timer.innerText = "Merry Christmas! 🎁";
        document.getElementById('reveal-overlay').classList.remove('hidden');
    } else {
        const d = Math.floor(gap / (1000 * 60 * 60 * 24));
        const h = Math.floor((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((gap % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((gap % (1000 * 60)) / 1000);
        timer.innerText = `${d}d : ${h}h : ${m}m : ${s}s`;
    }
}, 1000);

// --- 3. Notes ---
const noteRef = ref(db, 'notes/currentNote');
onValue(noteRef, (s) => document.getElementById('latestNote').innerText = s.val() || "No notes yet...");
document.getElementById('saveNoteBtn').onclick = () => {
    const val = document.getElementById('noteInput').value;
    if (val) set(noteRef, val);
    document.getElementById('noteInput').value = '';
};

// --- 4. Bucket List ---
const bucketRef = ref(db, 'bucketList');
document.getElementById('addBucketBtn').onclick = () => {
    const val = document.getElementById('bucketInput').value;
    if (val) push(bucketRef, { text: val, done: false });
    document.getElementById('bucketInput').value = '';
};
onValue(bucketRef, (snapshot) => {
    const list = document.getElementById('bucketList');
    list.innerHTML = '';
    const data = snapshot.val();
    if (data) {
        Object.entries(data).forEach(([key, item]) => {
            const li = document.createElement('li');
            li.className = item.done ? 'done' : '';
            li.innerHTML = `<div><span>${item.done ? '✅' : '🌟'}</span> ${item.text}</div>
                            <button class="del-btn" style="background:none; border:none; color:white; cursor:pointer;">❄️</button>`;
            li.onclick = () => update(ref(db, `bucketList/${key}`), { done: !item.done });
            li.querySelector('.del-btn').onclick = (e) => { e.stopPropagation(); remove(ref(db, `bucketList/${key}`)); };
            list.appendChild(li);
        });
    }
});

// --- 5. Music Binder ---
const songsRef = ref(db, 'binderSongs');
let allSongs = [];
let currentPage = 1;

document.getElementById('addSongBtn').onclick = () => {
    const input = document.getElementById('songLinkInput');
    const match = input.value.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (!match) return alert("Paste a Spotify link!");
    push(songsRef, { embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`, favLine: "", sideNote: "", timestamp: Date.now() });
    input.value = '';
};

onValue(songsRef, (s) => {
    const data = s.val();
    allSongs = data ? Object.entries(data).map(([id, s]) => ({...s, id})).sort((a,b) => b.timestamp - a.timestamp) : [];
    renderBinder();
});

function renderBinder() {
    const display = document.getElementById('binder-pages-display');
    display.innerHTML = '';
    const songs = allSongs.slice((currentPage-1)*3, currentPage*3);

    songs.forEach(song => {
        const div = document.createElement('div');
        div.className = 'song-entry';
        div.innerHTML = `
            <div class="song-memory">
                <h3>The Memory</h3>
                <textarea class="side-note" placeholder="Write our story...">${song.sideNote}</textarea>
            </div>
            <div class="song-visual-stack">
                <div style="display:flex; width:100%; justify-content:flex-end;">
                    <button class="del-song" style="background:none; border:none; color:rgba(255,255,255,0.3); cursor:pointer;">×</button>
                </div>
                <div class="music-box">
                    <iframe src="${song.embedUrl}" width="100%" height="100%" frameBorder="0" allow="encrypted-media"></iframe>
                </div>
                <div class="favorite-line-box">
                    <input type="text" class="fav-line" value="${song.favLine}" placeholder="♥ LYRIC LINE...">
                </div>
            </div>
        `;
        div.querySelector('.fav-line').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {favLine: e.target.value});
        div.querySelector('.side-note').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {sideNote: e.target.value});
        div.querySelector('.del-song').onclick = () => remove(ref(db, `binderSongs/${song.id}`));
        display.appendChild(div);
    });
    
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage * 3 >= allSongs.length;
}

document.getElementById('prevBtn').onclick = () => { currentPage--; renderBinder(); };
document.getElementById('nextBtn').onclick = () => { currentPage++; renderBinder(); };

// --- 6. Snow ---
function createSnow() {
    const container = document.getElementById('snow-container');
    const flake = document.createElement('div');
    const icons = ['❄', '✨', '🤍'];
    flake.innerHTML = icons[Math.floor(Math.random()*3)];
    flake.style.cssText = `position:fixed; top:-10%; left:${Math.random()*100}vw; font-size:${Math.random()*15+10}px; opacity:${Math.random()}; pointer-events:none; z-index:1; animation: fall ${Math.random()*4+4}s linear forwards;`;
    container.appendChild(flake);
    setTimeout(() => flake.remove(), 7000);
}
setInterval(createSnow, 300);
const snowStyle = document.createElement('style');
snowStyle.textContent = `@keyframes fall { to { transform: translateY(110vh) rotate(360deg); } }`;
document.head.appendChild(snowStyle);
