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

// --- THEME TOGGLE ---
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

// --- LOGIN ---
const loginScreen = document.getElementById('login-screen');
const loginBtn = document.getElementById('loginBtn');
const passwordInput = document.getElementById('passwordInput');
if (localStorage.getItem('wonderlandUnlocked') === 'true') loginScreen.classList.add('hidden');
loginBtn.addEventListener('click', () => {
    if (passwordInput.value.toUpperCase() === "MOON") {
        localStorage.setItem('wonderlandUnlocked', 'true');
        loginScreen.classList.add('hidden');
    } else { alert("Incorrect word, my love. ❤️"); }
});

// --- NEW YEAR EXPERIENCE ---
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
    document.getElementById('ny-experience-overlay').classList.remove('hidden');
    startStarSequence();
});

function startStarSequence() {
    starsClicked = 0;
    const field = document.getElementById('star-field');
    field.innerHTML = '';
    document.querySelectorAll('.stage').forEach(s => s.classList.add('hidden'));
    document.getElementById('star-stage').classList.remove('hidden');
    
    starMessages.forEach((msg) => {
        const star = document.createElement('div');
        star.className = 'drifting-star';
        star.innerHTML = '⭐';
        let x = Math.random() * 80 + 10, y = Math.random() * 80 + 10;
        let xDir = (Math.random() - 0.5) * 0.3, yDir = (Math.random() - 0.5) * 0.3;

        function move() {
            if (star.classList.contains('clicked')) return;
            x += xDir; y += yDir;
            if (x < 5 || x > 95) xDir *= -1; if (y < 5 || y > 95) yDir *= -1;
            star.style.left = x + '%'; star.style.top = y + '%';
            requestAnimationFrame(move);
        }
        requestAnimationFrame(move);

        star.onclick = () => {
            if (star.classList.contains('clicked')) return;
            star.classList.add('clicked');
            star.innerHTML = `<span class="star-msg">${msg}</span>`;
            starsClicked++;
            document.querySelector('.star-count-hint').innerText = `Stars found: (${starsClicked}/6)`;
            if (starsClicked === 6) setTimeout(startClockSequence, 3000);
        };
        field.appendChild(star);
    });
}

function startClockSequence() {
    document.getElementById('star-stage').classList.add('hidden');
    document.getElementById('countdown-stage').classList.remove('hidden');
    let sec = 55;
    const clock = document.getElementById('digital-clock');
    const timer = setInterval(() => {
        sec++;
        if (sec < 60) { clock.innerText = `23:59:${sec.toString().padStart(2,'0')}`; }
        else {
            clearInterval(timer);
            clock.innerText = "00:00:00"; clock.style.color = "#d4af37";
            document.getElementById('clock-year').innerText = "2026";
            setTimeout(startEnvelopeSequence, 2000);
        }
    }, 1000);
}

function startEnvelopeSequence() {
    document.getElementById('countdown-stage').classList.add('hidden');
    document.getElementById('envelope-stage').classList.remove('hidden');
    const env = document.getElementById('main-envelope');
    const typeTarget = document.getElementById('typewriter-text');
    const fullText = "Thank you for handling me this year. You are my greatest gift. Can you please do that for this year too?\n\nI love you forever. ❤️";
    
    env.onclick = () => {
        if (env.classList.contains('open')) return;
        env.classList.add('open');
        setTimeout(() => {
            let i = 0; typeTarget.innerText = "";
            let typing = setInterval(() => {
                typeTarget.innerText += fullText[i]; i++;
                if (i >= fullText.length) {
                    clearInterval(typing);
                    document.getElementById('final-ny-text').classList.remove('hidden');
                    setTimeout(() => { if(confirm("Back to Wonderland?")) document.getElementById('ny-experience-overlay').classList.add('hidden'); }, 6000);
                }
            }, 70);
        }, 1200);
    };
}

// --- FIREBASE LOGIC ---
const noteRef = ref(db, 'notes/currentNote');
onValue(noteRef, (s) => document.getElementById('latestNote').innerText = s.val() || "No notes yet...");
document.getElementById('saveNoteBtn').onclick = () => {
    const inp = document.getElementById('noteInput');
    if (inp.value.trim()) set(noteRef, inp.value); inp.value = '';
};

const bucketRef = ref(db, 'bucketList');
document.getElementById('addBucketBtn').onclick = () => {
    const inp = document.getElementById('bucketInput');
    if (inp.value) push(bucketRef, { text: inp.value, done: false }); inp.value = '';
};
onValue(bucketRef, (snap) => {
    const list = document.getElementById('bucketList'); list.innerHTML = '';
    const data = snap.val();
    if (data) {
        Object.entries(data).forEach(([key, item]) => {
            const li = document.createElement('li');
            li.className = item.done ? 'done' : '';
            li.innerHTML = `<div class="item-text"><span>${item.done?'✅':'🌟'}</span><span>${item.text}</span></div><button class="del-btn">❄️</button>`;
            li.querySelector('.item-text').onclick = () => update(ref(db, `bucketList/${key}`), { done: !item.done });
            li.querySelector('.del-btn').onclick = () => remove(ref(db, `bucketList/${key}`));
            list.appendChild(li);
        });
    }
});

const songsRef = ref(db, 'binderSongs');
let allSongs = [], currentPage = 1;
onValue(songsRef, (snap) => {
    const data = snap.val();
    allSongs = data ? Object.entries(data).map(([id, s]) => ({...s, id})).sort((a,b) => b.timestamp - a.timestamp) : [];
    renderBinder();
});
function renderBinder() {
    const display = document.getElementById('binder-pages-display'); display.innerHTML = '';
    const songs = allSongs.slice((currentPage-1)*3, currentPage*3);
    songs.forEach(song => {
        const div = document.createElement('div'); div.className = 'song-entry';
        div.innerHTML = `<div class="song-memory"><h3>Our Memory</h3><textarea class="side-note">${song.sideNote||""}</textarea></div>
            <div class="song-visual-stack">
                <button class="del-song">Remove ×</button>
                <div class="music-box"><iframe src="${song.embedUrl}" width="100%" height="100%" frameBorder="0"></iframe></div>
                <div class="favorite-line-box"><input type="text" class="fav-line" value="${song.favLine||""}" placeholder="♥ Add favorite line..."></div>
            </div>`;
        div.querySelector('.fav-line').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {favLine: e.target.value});
        div.querySelector('.side-note').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {sideNote: e.target.value});
        div.querySelector('.del-song').onclick = () => remove(ref(db, `binderSongs/${song.id}`));
        display.appendChild(div);
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage * 3 >= allSongs.length;
}
document.getElementById('addSongBtn').onclick = () => {
    const val = document.getElementById('songLinkInput').value;
    const match = val.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (match) push(songsRef, { embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`, timestamp: Date.now() });
    document.getElementById('songLinkInput').value = '';
};
document.getElementById('prevBtn').onclick = () => { if(currentPage > 1) { currentPage--; renderBinder(); } };
document.getElementById('nextBtn').onclick = () => { if(currentPage * 3 < allSongs.length) { currentPage++; renderBinder(); } };
document.getElementById('mem-christmas').onclick = () => document.getElementById('reveal-overlay').classList.remove('hidden');
document.querySelector('.close-reveal-btn').onclick = () => document.getElementById('reveal-overlay').classList.add('hidden');

// --- SNOW & TIMER ---
function createSnow() {
    const container = document.getElementById('snow-container');
    const flake = document.createElement('div');
    flake.innerHTML = body.classList.contains('ny-theme') ? '✨' : '❄️';
    flake.style.cssText = `position: fixed; top: -10%; left: ${Math.random()*100}vw; animation: fall ${Math.random()*4+5}s linear forwards; font-size: 20px; z-index: 1; pointer-events: none;`;
    container.appendChild(flake);
    setTimeout(() => flake.remove(), 7000);
}
setInterval(createSnow, 300);
setInterval(() => {
    const gap = new Date("Dec 25, 2025").getTime() - new Date().getTime();
    const d = Math.max(0, Math.floor(gap / 86400000)), h = Math.max(0, Math.floor((gap % 86400000) / 3600000)), m = Math.max(0, Math.floor((gap % 3600000) / 60000)), s = Math.max(0, Math.floor((gap % 60000) / 1000));
    document.getElementById('countdown-timer').innerText = gap > 0 ? `${d}d : ${h}h : ${m}m : ${s}s` : "Merry Christmas! ❤️";
}, 1000);
