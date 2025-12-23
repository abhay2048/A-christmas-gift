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

// --- 1. LOGIN LOGIC ---
const loginBtn = document.getElementById('loginBtn');
const passwordInput = document.getElementById('passwordInput');
const loginScreen = document.getElementById('login-screen');

if(localStorage.getItem('isUnlocked') === 'true') {
    loginScreen.classList.add('hidden');
}

loginBtn.addEventListener('click', () => {
    if(passwordInput.value === "1225") { // SET YOUR PASSWORD HERE
        localStorage.setItem('isUnlocked', 'true');
        loginScreen.classList.add('hidden');
    } else {
        alert("Wrong password, my love! ❤️");
    }
});

// --- 2. ADVANCED COUNTDOWN ---
let targetDate = new Date("December 25, 2025 00:00:00").getTime();
let isPreview = false;

function updateTimer() {
    const now = new Date().getTime();
    const gap = targetDate - now;

    const timerElement = document.getElementById('countdown-timer');
    const msgElement = document.getElementById('special-message');

    if (gap <= 0) {
        timerElement.innerText = "Merry Christmas! 🎁";
        msgElement.classList.remove('hidden');
        msgElement.innerText = "Merry Christmas my love, may your days to come be as pretty as the Christmas snow... ❤️";
        
        // After 15 seconds, hide the big message but keep the header text
        setTimeout(() => {
            msgElement.classList.add('hidden');
        }, 15000);
        return;
    }

    const d = Math.floor(gap / (1000 * 60 * 60 * 24));
    const h = Math.floor((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((gap % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((gap % (1000 * 60)) / 1000);
    
    timerElement.innerText = `${d}d ${h}h ${m}m ${s}s until Christmas! 🎄`;
}

setInterval(updateTimer, 1000);

document.getElementById('previewTimer').addEventListener('click', () => {
    targetDate = new Date().getTime() + 11000; // Set timer to 11 seconds from now
});

// --- 3. BUCKET LIST (With Delete) ---
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
            li.innerHTML = `<span>${item.text}</span> <button class="delete-btn">🗑️</button>`;
            if (item.done) li.classList.add('completed');
            
            li.querySelector('span').addEventListener('click', () => {
                update(ref(db, `bucketList/${key}`), { done: !item.done });
            });
            
            li.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                remove(ref(db, `bucketList/${key}`));
            });
            list.appendChild(li);
        });
    }
});

// --- 4. MUSIC BINDER (With Delete) ---
const songsRef = ref(db, 'binderSongs');
let allSongs = [];
let currentPage = 1;
const SONGS_PER_PAGE = 3;

document.getElementById('addSongBtn').addEventListener('click', () => {
    const input = document.getElementById('songLinkInput');
    const match = input.value.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (!match) return alert("Invalid Link!");
    
    push(songsRef, {
        embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
        favoriteLine: "", sideNote: "", timestamp: Date.now()
    });
    input.value = '';
});

onValue(songsRef, (snapshot) => {
    const data = snapshot.val();
    allSongs = data ? Object.entries(data).map(([id, s]) => ({...s, id})).sort((a,b) => b.timestamp - a.timestamp) : [];
    renderBinderPage();
});

function renderBinderPage() {
    const container = document.getElementById('binder-pages-display');
    container.innerHTML = '';
    const songsToDisplay = allSongs.slice((currentPage-1)*SONGS_PER_PAGE, currentPage*SONGS_PER_PAGE);

    songsToDisplay.forEach(song => {
        const div = document.createElement('div');
        div.className = 'song-entry';
        div.innerHTML = `
            <div class="song-card">
                <button class="delete-btn" style="float:right">×</button>
                <iframe src="${song.embedUrl}" width="100%" height="152" frameBorder="0"></iframe>
                <input type="text" class="handwritten-input fav-input" value="${song.favoriteLine}" placeholder="Favorite line...">
            </div>
            <div class="side-note-area">
                <textarea class="side-note-textarea note-input" placeholder="Our memory...">${song.sideNote}</textarea>
            </div>
        `;
        div.querySelector('.fav-input').addEventListener('change', (e) => update(ref(db, `binderSongs/${song.id}`), {favoriteLine: e.target.value}));
        div.querySelector('.note-input').addEventListener('change', (e) => update(ref(db, `binderSongs/${song.id}`), {sideNote: e.target.value}));
        div.querySelector('.delete-btn').addEventListener('click', () => remove(ref(db, `binderSongs/${song.id}`)));
        container.appendChild(div);
    });

    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage * SONGS_PER_PAGE >= allSongs.length;
}

document.getElementById('prevBtn').addEventListener('click', () => { currentPage--; renderBinderPage(); });
document.getElementById('nextBtn').addEventListener('click', () => { currentPage++; renderBinderPage(); });

// --- 5. NOTE STATION & SNOW ---
const noteRef = ref(db, 'notes/currentNote');
document.getElementById('saveNoteBtn').addEventListener('click', () => {
    set(noteRef, document.getElementById('noteInput').value);
    document.getElementById('noteInput').value = "";
});
onValue(noteRef, (s) => { document.getElementById('latestNote').innerText = s.val() || "No notes yet..."; });

function createSnow() {
    const container = document.getElementById('snow-container');
    const flake = document.createElement('div');
    flake.classList.add('snowflake');
    flake.innerHTML = '❄';
    flake.style.left = Math.random() * 100 + 'vw';
    flake.style.animationDuration = Math.random() * 3 + 2 + 's';
    container.appendChild(flake);
    setTimeout(() => flake.remove(), 5000);
}
setInterval(createSnow, 300);
