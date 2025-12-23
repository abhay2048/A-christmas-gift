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

// --- 1. LOGIN ---
const loginBtn = document.getElementById('loginBtn');
const passwordInput = document.getElementById('passwordInput');
const loginScreen = document.getElementById('login-screen');

if(localStorage.getItem('isUnlocked') === 'true') loginScreen.classList.add('hidden');

loginBtn.addEventListener('click', () => {
    if(passwordInput.value === "1225") {
        localStorage.setItem('isUnlocked', 'true');
        loginScreen.classList.add('hidden');
    } else { alert("Try a special date! ❤️"); }
});

// --- 2. COUNTDOWN & REVEAL ---
let targetDate = new Date("December 25, 2025 00:00:00").getTime();

setInterval(() => {
    const now = new Date().getTime();
    const gap = targetDate - now;
    const timer = document.getElementById('countdown-timer');
    
    if (gap <= 0) {
        timer.innerText = "Merry Christmas! 🎁";
        document.getElementById('reveal-overlay').classList.remove('hidden');
        return;
    }

    const d = Math.floor(gap / (1000 * 60 * 60 * 24));
    const h = Math.floor((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((gap % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((gap % (1000 * 60)) / 1000);
    timer.innerText = `${d}d ${h}h ${m}m ${s}s`;
}, 1000);

document.getElementById('previewTimer').addEventListener('click', () => {
    targetDate = new Date().getTime() + 5000;
});

// --- 3. SCRAPBOOK COMPONENTS ---
// Note
const noteRef = ref(db, 'notes/currentNote');
onValue(noteRef, (s) => document.getElementById('latestNote').innerText = s.val() || "Write a note!");
document.getElementById('saveNoteBtn').addEventListener('click', () => {
    set(noteRef, document.getElementById('noteInput').value);
    document.getElementById('noteInput').value = '';
});

// Bucket List
const bucketRef = ref(db, 'bucketList');
document.getElementById('addBucketBtn').addEventListener('click', () => {
    const input = document.getElementById('bucketInput');
    if(input.value) push(bucketRef, { text: input.value, done: false });
    input.value = '';
});

onValue(bucketRef, (snapshot) => {
    const list = document.getElementById('bucketList');
    list.innerHTML = '';
    const data = snapshot.val();
    if(data) {
        Object.entries(data).forEach(([key, item]) => {
            const li = document.createElement('li');
            li.className = item.done ? 'completed' : '';
            li.innerHTML = `<span style="flex:1">${item.text}</span> <button style="background:none; border:none; cursor:pointer">🗑️</button>`;
            li.onclick = () => update(ref(db, `bucketList/${key}`), { done: !item.done });
            li.querySelector('button').onclick = (e) => { e.stopPropagation(); remove(ref(db, `bucketList/${key}`)); };
            list.appendChild(li);
        });
    }
});

// Binder Songs
const songsRef = ref(db, 'binderSongs');
let allSongs = [];
let currentPage = 1;

document.getElementById('addSongBtn').addEventListener('click', () => {
    const input = document.getElementById('songLinkInput');
    const match = input.value.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if(match) push(songsRef, { embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`, favLine: "", note: "", timestamp: Date.now() });
    input.value = '';
});

onValue(songsRef, (s) => {
    const data = s.val();
    allSongs = data ? Object.entries(data).map(([id, s]) => ({...s, id})).sort((a,b) => b.timestamp - a.timestamp) : [];
    renderBinder();
});

function renderBinder() {
    const container = document.getElementById('binder-pages-display');
    container.innerHTML = '';
    const songs = allSongs.slice((currentPage-1)*2, currentPage*2); // 2 per page for scrapbook look

    songs.forEach(song => {
        const div = document.createElement('div');
        div.className = 'song-card-handmade';
        div.innerHTML = `
            <div style="text-align:right"><button class="del-song" style="background:none; border:none; cursor:pointer">×</button></div>
            <iframe src="${song.embedUrl}" width="100%" height="80" frameBorder="0" class="spotify-embed"></iframe>
            <input type="text" class="doodle-input fav-line" placeholder="♥ Fav lyric..." value="${song.favLine}">
            <textarea class="doodle-input song-note" placeholder="Memory..." style="margin-top:10px">${song.note}</textarea>
        `;
        div.querySelector('.fav-line').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {favLine: e.target.value});
        div.querySelector('.song-note').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {note: e.target.value});
        div.querySelector('.del-song').onclick = () => remove(ref(db, `binderSongs/${song.id}`));
        container.appendChild(div);
    });
}

// --- 4. LIFE (Snow & Hearts) ---
function createParticle(char, containerId, className) {
    const container = document.getElementById(containerId);
    const p = document.createElement('div');
    p.innerHTML = char;
    p.style.cssText = `position:fixed; top:-50px; left:${Math.random()*100}vw; font-size:${Math.random()*20+10}px; opacity:${Math.random()}; animation: fall ${Math.random()*3+4}s linear forwards;`;
    container.appendChild(p);
    setTimeout(() => p.remove(), 6000);
}
setInterval(() => createParticle('❄️', 'snow-container'), 400);
setInterval(() => createParticle('❤️', 'hearts-container'), 1000);

const style = document.createElement('style');
style.textContent = `@keyframes fall { to { transform: translateY(110vh) rotate(360deg); } }`;
document.head.appendChild(style);
