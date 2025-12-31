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

// --- 1. THEME TOGGLE (GIFT CLICK) ---
const body = document.body;
const giftToggle = document.getElementById('theme-toggle-gift');
const title = document.getElementById('dynamic-title');

giftToggle.addEventListener('click', () => {
    if (body.classList.contains('christmas-theme')) {
        body.classList.replace('christmas-theme', 'ny-theme');
        title.innerText = "Our Golden New Year";
        giftToggle.innerText = "🎆";
    } else {
        body.classList.replace('ny-theme', 'christmas-theme');
        title.innerText = "Our Winter Wonderland";
        giftToggle.innerText = "🎁";
    }
});

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

// --- 3. REVEAL CONTROLS (CHRISTMAS) ---
const christmasOverlay = document.getElementById('reveal-overlay');
document.getElementById('mem-christmas').addEventListener('click', () => {
    christmasOverlay.classList.remove('hidden');
});
document.querySelector('.close-reveal').addEventListener('click', () => {
    christmasOverlay.classList.add('hidden');
});

// --- 4. NEW YEAR EXPERIENCE (STAR & ENVELOPE) ---
const nyOverlay = document.getElementById('ny-experience-overlay');
const starContainer = document.getElementById('star-container');
const starMessages = [
    "Handling me even when I'm difficult ❤️",
    "Being my safest place in 2025 🏠",
    "All the late night laughs 🌙",
    "Choosing me every single day ✨",
    "The way you make everything better 🌸",
    "Simply being you. I love you! 🥂"
];
let starsClicked = 0;

document.getElementById('mem-newyear').addEventListener('click', () => {
    nyOverlay.classList.remove('hidden');
    startStarSequence();
});

function startStarSequence() {
    starsClicked = 0;
    starContainer.innerHTML = '';
    document.getElementById('star-stage').classList.remove('hidden');
    document.getElementById('countdown-stage').classList.add('hidden');
    document.getElementById('envelope-stage').classList.add('hidden');
    document.querySelector('.star-count-hint').innerText = `Click the stars to remember (0/${starMessages.length})`;

    for (let i = 0; i < starMessages.length; i++) {
        const star = document.createElement('div');
        star.className = 'floating-star';
        star.innerHTML = '⭐';
        star.style.left = Math.random() * 80 + 10 + '%';
        star.style.top = Math.random() * 60 + 20 + '%';
        star.style.animationDelay = (Math.random() * 2) + 's';
        
        star.onclick = () => {
            if (star.classList.contains('clicked')) return;
            star.classList.add('clicked');
            star.innerHTML = `<span class="star-msg">${starMessages[i]}</span>`;
            starsClicked++;
            document.querySelector('.star-count-hint').innerText = `Click the stars to remember (${starsClicked}/${starMessages.length})`;
            
            if (starsClicked === starMessages.length) {
                setTimeout(startCountdownSequence, 2000);
            }
        };
        starContainer.appendChild(star);
    }
}

function startCountdownSequence() {
    document.getElementById('star-stage').classList.add('hidden');
    document.getElementById('countdown-stage').classList.remove('hidden');
    
    let year = 2025;
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let mIdx = 0;
    const yearEl = document.getElementById('fast-year-counter');
    const dateEl = document.getElementById('fast-date-counter');

    let fastCounter = setInterval(() => {
        dateEl.innerText = `${months[mIdx % 12]} ${Math.floor(Math.random()*28)+1}`;
        mIdx++;
        if (mIdx > 24) {
            year = 2026;
            yearEl.innerText = year;
            yearEl.classList.add('glow-up');
            clearInterval(fastCounter);
            setTimeout(startEnvelopeSequence, 1500);
        }
    }, 100);
}

function startEnvelopeSequence() {
    document.getElementById('countdown-stage').classList.add('hidden');
    document.getElementById('envelope-stage').classList.remove('hidden');
    
    const envelope = document.getElementById('main-envelope');
    const textTarget = document.getElementById('typewriter-text');
    const fullText = "Thank you for handling me this year. You are my greatest gift. Can you please do that for this year too? I love you forever. ❤️";
    
    envelope.onclick = () => {
        envelope.classList.add('open');
        setTimeout(() => {
            let i = 0;
            textTarget.innerText = "";
            let typing = setInterval(() => {
                textTarget.innerText += fullText[i];
                i++;
                if (i >= fullText.length) {
                    clearInterval(typing);
                    document.getElementById('final-ny-text').classList.remove('hidden');
                    setTimeout(() => nyOverlay.classList.add('hidden'), 8000);
                }
            }, 50);
        }, 1000);
    };
}

// --- 5. FIREBASE LOGIC (Note, Bucket, Binder - Same as original) ---
// (Note Station)
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

// (Bucket List)
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
                <button class="del-btn">❄️</button>
            `;
            li.querySelector('.item-text').addEventListener('click', () => update(ref(db, `bucketList/${key}`), { done: !item.done }));
            li.querySelector('.del-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm("Remove this?")) remove(ref(db, `bucketList/${key}`));
            });
            list.appendChild(li);
        });
    }
});

// (Music Binder)
const songsRef = ref(db, 'binderSongs');
let allSongs = [];
let currentPage = 1;
const SONGS_PER_PAGE = 3;

document.getElementById('addSongBtn').addEventListener('click', () => {
    const input = document.getElementById('songLinkInput');
    const match = input.value.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (!match) return alert("Paste a valid Spotify link!");
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
            <div class="song-memory">
                <h3>Our Memory</h3>
                <textarea class="song-meta-input side-note">${song.sideNote}</textarea>
            </div>
            <div class="song-visual-stack">
                <button class="del-song">Remove ×</button>
                <div class="music-box">
                    <iframe src="${song.embedUrl}" width="100%" height="100%" frameBorder="0" allow="encrypted-media"></iframe>
                </div>
                <div class="favorite-line-box">
                    <input type="text" class="fav-line" value="${song.favLine}" placeholder="♥ Favorite line...">
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

// --- 6. SNOW & TIMER ---
function updateCountdown() {
    const target = new Date("December 25, 2025 00:00:00").getTime();
    const now = new Date().getTime();
    const gap = target - now;
    const timerDiv = document.getElementById('countdown-timer');
    if (gap <= 0) { timerDiv.innerText = "Enjoy the Season! ❤️"; return; }
    const d = Math.floor(gap / (1000 * 60 * 60 * 24));
    const h = Math.floor((gap % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((gap % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((gap % (1000 * 60)) / 1000);
    timerDiv.innerText = `${d}d : ${h}h : ${m}m : ${s}s`;
}
setInterval(updateCountdown, 1000);

function createSnow() {
    const container = document.getElementById('snow-container');
    const flake = document.createElement('div');
    const isNY = body.classList.contains('ny-theme');
    flake.innerHTML = isNY ? ['✨', '🎈', '🎊', '⭐'][Math.floor(Math.random()*4)] : '❄️';
    flake.style.cssText = `position: fixed; top: -10%; left: ${Math.random() * 100}vw; font-size: ${Math.random() * 20 + 10}px; animation: fall ${Math.random() * 4 + 5}s linear forwards; z-index: 10; pointer-events: none;`;
    container.appendChild(flake);
    setTimeout(() => flake.remove(), 7000);
}
setInterval(createSnow, 300);
