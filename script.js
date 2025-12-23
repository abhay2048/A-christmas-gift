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

// --- 1. LOGIN (MOON) ---
const loginBtn = document.getElementById('loginBtn');
const loginScreen = document.getElementById('login-screen');
if(localStorage.getItem('isUnlocked') === 'true') loginScreen.classList.add('hidden');

loginBtn.addEventListener('click', () => {
    if(document.getElementById('passwordInput').value.toUpperCase() === "MOON") {
        localStorage.setItem('isUnlocked', 'true');
        loginScreen.classList.add('hidden');
    } else { alert("Wrong word, my love! ❤️"); }
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
        setTimeout(() => document.getElementById('reveal-overlay').classList.add('hidden'), 15000);
        return;
    }
    const d = Math.floor(gap / (1000 * 60 * 60 * 24));
    const h = Math.floor((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((gap % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((gap % (1000 * 60)) / 1000);
    timer.innerText = `${d}d ${h}h ${m}m ${s}s`;
}, 1000);

document.getElementById('previewTimer').addEventListener('click', () => {
    targetDate = new Date().getTime() + 6000;
});

// --- 3. NOTE STATION (Pinned First) ---
const noteRef = ref(db, 'notes/currentNote');
onValue(noteRef, (s) => document.getElementById('latestNote').innerText = s.val() || "Pin a note here...");
document.getElementById('saveNoteBtn').addEventListener('click', () => {
    const val = document.getElementById('noteInput').value;
    if(val) { set(noteRef, val); document.getElementById('noteInput').value = ''; }
});

// --- 4. BUCKET LIST ---
const bucketRef = ref(db, 'bucketList');
document.getElementById('addBucketBtn').addEventListener('click', () => {
    const input = document.getElementById('bucketInput');
    if(input.value) push(bucketRef, { text: input.value, done: false });
    input.value = '';
});
onValue(bucketRef, (s) => {
    const list = document.getElementById('bucketList');
    list.innerHTML = '';
    const data = s.val();
    if(data) {
        Object.entries(data).forEach(([key, item]) => {
            const li = document.createElement('li');
            li.style.cssText = "display:flex; justify-content:space-between; padding:10px; background:white; margin-bottom:5px; border-radius:8px;";
            li.innerHTML = `<span style="${item.done ? 'text-decoration:line-through' : ''}">${item.text}</span> 
                            <div><button class="check-btn">✅</button> <button class="del-btn">🗑️</button></div>`;
            li.querySelector('.check-btn').onclick = () => update(ref(db, `bucketList/${key}`), { done: !item.done });
            li.querySelector('.del-btn').onclick = () => remove(ref(db, `bucketList/${key}`));
            list.appendChild(li);
        });
    }
});

// --- 5. BINDER SONGS (Left/Right Layout) ---
const songsRef = ref(db, 'binderSongs');
let allSongs = [];
let currentPage = 1;

document.getElementById('addSongBtn').addEventListener('click', () => {
    const input = document.getElementById('songLinkInput');
    const match = input.value.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if(match) push(songsRef, { 
        embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`, 
        favLine: "", memory: "", timestamp: Date.now() 
    });
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
    const songs = allSongs.slice((currentPage-1)*3, currentPage*3);

    songs.forEach(song => {
        const div = document.createElement('div');
        div.className = 'song-entry';
        div.innerHTML = `
            <div class="song-left-card">
                <button class="delete-btn" onclick="this.dataset.id='${song.id}'">×</button>
                <iframe src="${song.embedUrl}" width="100%" height="152" frameBorder="0" allow="encrypted-media" style="border-radius:12px"></iframe>
                <p style="font-family:'Indie Flower'; margin-top:10px; color:#ff85a2">♥ Favorite Lyric:</p>
                <input type="text" class="fav-input doodle-input" value="${song.favLine}" style="border:none; border-bottom:1px dotted #ccc;">
            </div>
            <div class="song-right-memories">
                <p style="color:#aaa; font-size:0.8rem">Handwritten Memories...</p>
                <textarea class="memory-textarea" placeholder="Write about this song...">${song.memory}</textarea>
            </div>
        `;
        div.querySelector('.fav-input').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {favLine: e.target.value});
        div.querySelector('.memory-textarea').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {memory: e.target.value});
        div.querySelector('.delete-btn').onclick = () => remove(ref(db, `binderSongs/${song.id}`));
        container.appendChild(div);
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage * 3 >= allSongs.length;
}

document.getElementById('prevBtn').onclick = () => { currentPage--; renderBinder(); };
document.getElementById('nextBtn').onclick = () => { currentPage++; renderBinder(); };

// --- 6. PARTICLES ---
function createParticle(char, containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;
    const p = document.createElement('div');
    p.innerHTML = char;
    p.style.cssText = `position:fixed; top:-50px; left:${Math.random()*100}vw; font-size:${Math.random()*20+10}px; opacity:${Math.random()}; animation: fall ${Math.random()*3+4}s linear forwards; pointer-events:none;`;
    container.appendChild(p);
    setTimeout(() => p.remove(), 6000);
}
setInterval(() => createParticle('❄️', 'snow-container'), 400);
setInterval(() => createParticle('❤️', 'hearts-container'), 1000);

const particleStyle = document.createElement('style');
particleStyle.textContent = `@keyframes fall { to { transform: translateY(110vh) rotate(360deg); } }`;
document.head.appendChild(particleStyle);
