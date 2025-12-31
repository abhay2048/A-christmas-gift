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

// --- THEME & LOGIN ---
const body = document.body;
const giftToggle = document.getElementById('theme-toggle-gift');
giftToggle.addEventListener('click', () => {
    const isXmas = body.classList.contains('christmas-theme');
    body.classList.toggle('christmas-theme', !isXmas);
    body.classList.toggle('ny-theme', isXmas);
    document.getElementById('dynamic-title').innerText = isXmas ? "Our Golden New Year" : "Our Winter Wonderland";
    giftToggle.innerText = isXmas ? "🎆" : "🎁";
});

const loginScreen = document.getElementById('login-screen');
if (localStorage.getItem('wonderlandUnlocked') === 'true') loginScreen.classList.add('hidden');
document.getElementById('loginBtn').onclick = () => {
    if (document.getElementById('passwordInput').value.toUpperCase() === "MOON") {
        localStorage.setItem('wonderlandUnlocked', 'true');
        loginScreen.classList.add('hidden');
    } else alert("Incorrect word, my love. ❤️");
};

// --- NEW YEAR EXPERIENCE LOGIC ---
const starMessages = [
    "Handling me even when I'm difficult ❤️",
    "Being my safest place in 2025 🏠",
    "All the late night laughs 🌙",
    "Choosing me every single day ✨",
    "The way you make everything better 🌸",
    "Simply being you. I love you! 🥂"
];
let starsClicked = 0;

document.getElementById('mem-newyear').onclick = () => {
    document.getElementById('ny-experience-overlay').classList.remove('hidden');
    startStarSequence();
};

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
    const monthEl = document.getElementById('ff-month');
    const clockEl = document.getElementById('digital-clock');
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    
    let mIdx = 0;
    let ff = setInterval(() => {
        monthEl.innerText = months[mIdx];
        mIdx++;
        if (mIdx >= months.length) {
            clearInterval(ff);
            let sec = 55;
            let timer = setInterval(() => {
                sec++;
                if (sec < 60) clockEl.innerText = `11:59:${sec.toString().padStart(2, '0')}`;
                else {
                    clearInterval(timer);
                    clockEl.innerText = "12:00:00";
                    clockEl.classList.add('midnight-glow');
                    document.getElementById('ff-year').innerText = "2026";
                    document.getElementById('midnight-message').classList.remove('hidden');
                    setTimeout(startEnvelopeSequence, 3500);
                }
            }, 1000);
        }
    }, 150);
}

function startEnvelopeSequence() {
    document.getElementById('countdown-stage').classList.add('hidden');
    document.getElementById('envelope-stage').classList.remove('hidden');
    const env = document.getElementById('main-envelope');
    const typeTarget = document.getElementById('typewriter-text');
    const fullText = "2025 was beautiful because you were in it. Thank you for handling me, for loving me through everything, and for being my safest place.\n\nYou are my greatest gift. As we step into 2026, I only wish to make you smile every single day. Thank you for choosing me. I love you forever. ❤️";
    
    env.onclick = () => {
        if (env.classList.contains('open')) return;
        env.classList.add('open');
        document.querySelector('.letter-label').style.opacity = "0";
        setTimeout(() => {
            let i = 0; typeTarget.innerText = "";
            let typing = setInterval(() => {
                typeTarget.innerText += fullText[i]; i++;
                document.getElementById('final-letter').scrollTop = document.getElementById('final-letter').scrollHeight;
                if (i >= fullText.length) {
                    clearInterval(typing);
                    setTimeout(() => { if(confirm("Start 2026?")) document.getElementById('ny-experience-overlay').classList.add('hidden'); }, 5000);
                }
            }, 60);
        }, 1200);
    };
}

// --- FIREBASE & SNOW ---
onValue(ref(db, 'notes/currentNote'), (s) => document.getElementById('latestNote').innerText = s.val() || "No notes...");
document.getElementById('saveNoteBtn').onclick = () => {
    const inp = document.getElementById('noteInput');
    if (inp.value.trim()) set(ref(db, 'notes/currentNote'), inp.value);
    inp.value = '';
};

onValue(ref(db, 'bucketList'), (snap) => {
    const list = document.getElementById('bucketList'); list.innerHTML = '';
    const data = snap.val();
    if (data) Object.entries(data).forEach(([key, item]) => {
        const li = document.createElement('li');
        li.className = item.done ? 'done' : '';
        li.innerHTML = `<div class="item-text"><span>${item.done?'✅':'🌟'}</span><span>${item.text}</span></div><button class="del-btn">❄️</button>`;
        li.querySelector('.item-text').onclick = () => update(ref(db, `bucketList/${key}`), { done: !item.done });
        li.querySelector('.del-btn').onclick = () => remove(ref(db, `bucketList/${key}`));
        list.appendChild(li);
    });
});

let allSongs = [], currentPage = 1;
onValue(ref(db, 'binderSongs'), (snap) => {
    const data = snap.val();
    allSongs = data ? Object.entries(data).map(([id, s]) => ({...s, id})).sort((a,b) => b.timestamp - a.timestamp) : [];
    renderBinder();
});
function renderBinder() {
    const display = document.getElementById('binder-pages-display'); display.innerHTML = '';
    allSongs.slice((currentPage-1)*3, currentPage*3).forEach(song => {
        const div = document.createElement('div'); div.className = 'song-entry';
        div.innerHTML = `<div class="song-memory"><h3>Our Memory</h3><textarea class="side-note">${song.sideNote||""}</textarea></div>
            <div class="song-visual-stack"><button class="del-song">×</button>
                <div class="music-box"><iframe src="${song.embedUrl}" width="100%" height="100%" frameBorder="0"></iframe></div>
                <div class="favorite-line-box"><input type="text" class="fav-line" value="${song.favLine||""}" placeholder="♥ Lyric..."></div>
            </div>`;
        div.querySelector('.fav-line').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {favLine: e.target.value});
        div.querySelector('.side-note').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {sideNote: e.target.value});
        div.querySelector('.del-song').onclick = () => remove(ref(db, `binderSongs/${song.id}`));
        display.appendChild(div);
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
}
document.getElementById('addSongBtn').onclick = () => {
    const val = document.getElementById('songLinkInput').value;
    const match = val.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (match) push(ref(db, 'binderSongs'), { embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`, timestamp: Date.now() });
    document.getElementById('songLinkInput').value = '';
};
document.getElementById('prevBtn').onclick = () => { if(currentPage > 1) { currentPage--; renderBinder(); } };
document.getElementById('nextBtn').onclick = () => { if(currentPage * 3 < allSongs.length) { currentPage++; renderBinder(); } };
document.getElementById('mem-christmas').onclick = () => document.getElementById('reveal-overlay').classList.remove('hidden');
document.querySelector('.close-reveal-btn').onclick = () => document.getElementById('reveal-overlay').classList.add('hidden');

setInterval(() => {
    const container = document.getElementById('snow-container');
    const flake = document.createElement('div');
    flake.innerHTML = body.classList.contains('ny-theme') ? '✨' : '❄️';
    flake.style.cssText = `position: fixed; top: -10%; left: ${Math.random()*100}vw; animation: fall ${Math.random()*4+5}s linear forwards; font-size: 20px; z-index: 1; pointer-events: none;`;
    container.appendChild(flake);
    setTimeout(() => flake.remove(), 7000);
}, 300);
