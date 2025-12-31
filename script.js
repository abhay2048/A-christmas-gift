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

if (localStorage.getItem('vaultUnlocked') === 'true') {
    loginScreen.classList.add('hidden');
}

loginBtn.addEventListener('click', () => {
    if (passwordInput.value.toUpperCase() === "MOON") {
        localStorage.setItem('vaultUnlocked', 'true');
        loginScreen.classList.add('hidden');
    } else {
        alert("Incorrect secret word, my love. ❤️");
    }
});

// --- 2. SEASONAL MAGIC CONTROLS ---

// Christmas Overlay Logic
document.getElementById('btnXmas').addEventListener('click', () => {
    document.getElementById('reveal-overlay').classList.remove('hidden');
});

document.querySelectorAll('.close-overlay').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('reveal-overlay').classList.add('hidden');
        document.getElementById('ny-overlay').classList.add('hidden');
    });
});

// New Year Cinematic Logic
const loveReasons = [
    "The way you make every bad day better.",
    "Your smile is literally my favorite thing in the world.",
    "The way you support my wildest dreams.",
    "How you look when you're focused on something you love.",
    "Because you are my safest place and my greatest adventure.",
    "The kindness you show to everyone around you.",
    "The way your hand feels perfectly inside mine."
];
let currentReason = 0;

document.getElementById('btnNY').addEventListener('click', () => {
    const ny = document.getElementById('ny-overlay');
    const s1 = document.getElementById('ny-stage-1');
    const s2 = document.getElementById('ny-stage-2');
    
    ny.classList.remove('hidden');
    s1.classList.remove('hidden');
    s2.classList.add('hidden');

    // Sequence: Drift photos for 5 seconds then reveal message
    setTimeout(() => {
        s1.classList.add('hidden');
        s2.classList.remove('hidden');
        startFireworks();
    }, 6000);
});

document.getElementById('reasonTrigger').addEventListener('click', () => {
    const display = document.getElementById('reasonDisplay');
    display.style.opacity = 0;
    setTimeout(() => {
        display.innerText = loveReasons[currentReason];
        display.style.opacity = 1;
        currentReason = (currentReason + 1) % loveReasons.length;
    }, 300);
});

// --- 3. FIREWORKS ENGINE ---
function startFireworks() {
    const canvas = document.getElementById('fireworks');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y; this.color = color;
            this.velocity = { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 };
            this.alpha = 1;
        }
        draw() {
            ctx.save(); ctx.globalAlpha = this.alpha;
            ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.fill(); ctx.restore();
        }
        update() {
            this.velocity.y += 0.05; this.x += this.velocity.x; this.y += this.velocity.y;
            this.alpha -= 0.01;
        }
    }

    let particles = [];
    function animate() {
        if (document.getElementById('ny-overlay').classList.contains('hidden')) return;
        requestAnimationFrame(animate);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (Math.random() < 0.05) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height / 2);
            const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
            for (let i = 0; i < 30; i++) particles.push(new Particle(x, y, color));
        }
        particles.forEach((p, i) => {
            if (p.alpha <= 0) particles.splice(i, 1);
            else { p.update(); p.draw(); }
        });
    }
    animate();
}

// --- 4. DATA LOGIC (NOTE, BUCKET, BINDER) ---
// Note Station
const noteRef = ref(db, 'notes/currentNote');
onValue(noteRef, (s) => { document.getElementById('latestNote').innerText = s.val() || "No notes yet..."; });
document.getElementById('saveNoteBtn').addEventListener('click', () => {
    const input = document.getElementById('noteInput');
    if (input.value.trim()) { set(noteRef, input.value); input.value = ''; }
});

// Bucket List
const bucketRef = ref(db, 'bucketList');
document.getElementById('addBucketBtn').addEventListener('click', () => {
    const input = document.getElementById('bucketInput');
    if (input.value) { push(bucketRef, { text: input.value, done: false }); input.value = ''; }
});
onValue(bucketRef, (snapshot) => {
    const list = document.getElementById('bucketList');
    list.innerHTML = '';
    const data = snapshot.val();
    if (data) {
        Object.entries(data).forEach(([key, item]) => {
            const li = document.createElement('li');
            li.className = item.done ? 'done' : '';
            li.innerHTML = `<span>${item.done ? '✅' : '🌟'} ${item.text}</span> <button class="del-btn">❄️</button>`;
            li.onclick = (e) => { 
                if(e.target.tagName !== 'BUTTON') update(ref(db, `bucketList/${key}`), { done: !item.done });
            };
            li.querySelector('.del-btn').onclick = () => remove(ref(db, `bucketList/${key}`));
            list.appendChild(li);
        });
    }
});

// Music Binder
const songsRef = ref(db, 'binderSongs');
let allSongs = [];
let currentPage = 1;
onValue(songsRef, (snapshot) => {
    const data = snapshot.val();
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
            <div class="song-memory"><h3>Memory</h3><textarea class="side-note">${song.sideNote || ''}</textarea></div>
            <div class="song-visual-stack">
                <iframe src="${song.embedUrl}" width="100%" height="80" frameBorder="0"></iframe>
                <input type="text" class="fav-line" value="${song.favLine || ''}" placeholder="♥ Favorite line...">
                <button class="del-song">Remove ×</button>
            </div>`;
        div.querySelector('.fav-line').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {favLine: e.target.value});
        div.querySelector('.side-note').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {sideNote: e.target.value});
        div.querySelector('.del-song').onclick = () => remove(ref(db, `binderSongs/${song.id}`));
        display.appendChild(div);
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
}

document.getElementById('addSongBtn').onclick = () => {
    const input = document.getElementById('songLinkInput');
    const m = input.value.match(/track\/([a-zA-Z0-9]+)/);
    if (m) push(songsRef, { embedUrl: `https://open.spotify.com/embed/track/${m[1]}`, timestamp: Date.now() });
    input.value = '';
};
document.getElementById('prevBtn').onclick = () => { if(currentPage > 1) { currentPage--; renderBinder(); }};
document.getElementById('nextBtn').onclick = () => { if(currentPage*3 < allSongs.length) { currentPage++; renderBinder(); }};

// --- 5. SNOW EFFECT ---
setInterval(() => {
    const container = document.getElementById('snow-container');
    const flake = document.createElement('div');
    flake.innerHTML = '❄';
    flake.style.cssText = `position:fixed; top:-10%; left:${Math.random()*100}vw; opacity:${Math.random()}; font-size:${Math.random()*20+10}px; animation: fall ${Math.random()*5+5}s linear forwards; z-index:1;`;
    container.appendChild(flake);
    setTimeout(() => flake.remove(), 6000);
}, 300);
