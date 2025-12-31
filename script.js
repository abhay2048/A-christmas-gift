import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// YOUR FIREBASE CONFIG
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

// --- 1. THE TRANSITION LOGIC ---
const gift = document.getElementById('magic-gift');
const portal = document.getElementById('portal-overlay');
const oldWorld = document.getElementById('old-world');
const newWorld = document.getElementById('new-world');

gift.addEventListener('click', () => {
    // 1. Gift animation
    gift.style.transform = "scale(50) rotate(45deg)";
    gift.style.opacity = "0";
    portal.classList.remove('hidden');
    portal.style.transform = "scale(1)";

    setTimeout(() => {
        // 2. Swap Worlds
        document.body.classList.remove('christmas-theme');
        document.body.classList.add('vault-theme');
        oldWorld.classList.add('hidden');
        newWorld.classList.remove('hidden');
        portal.style.opacity = "0";
        setTimeout(() => portal.classList.add('hidden'), 1000);
    }, 1000);
});

// --- 2. LOGIN ---
const loginBtn = document.getElementById('loginBtn');
loginBtn.addEventListener('click', () => {
    if (document.getElementById('passwordInput').value.toUpperCase() === "MOON") {
        document.getElementById('login-screen').classList.add('hidden');
    }
});

// --- 3. NEW YEAR LOGIC ---
const memories = ["Laughter", "Long Talks", "Kindness", "Our Songs", "Safe Space", "Adventure", "Us"];
const loveReasons = ["Your smile.", "Your heart.", "The way you listen.", "Everything about you."];
let currentReason = 0;

document.getElementById('btnNY').addEventListener('click', () => {
    const ny = document.getElementById('ny-overlay');
    const container = document.getElementById('orb-container');
    ny.classList.remove('hidden');
    container.innerHTML = '';
    let popped = 0;

    memories.forEach((text, i) => {
        const orb = document.createElement('div');
        orb.className = 'memory-orb';
        orb.innerText = text;
        orb.style.left = Math.random() * 70 + 15 + '%';
        orb.style.top = Math.random() * 60 + 20 + '%';
        orb.onclick = () => {
            orb.style.display = 'none';
            if (++popped === memories.length) {
                document.getElementById('ny-stage-1').classList.add('hidden');
                document.getElementById('ny-stage-2').classList.remove('hidden');
                startFireworks();
            }
        };
        container.appendChild(orb);
    });
});

// Fireworks & Reason Generator Logic (same as before)
document.getElementById('reasonTrigger').onclick = () => {
    const d = document.getElementById('reasonDisplay');
    d.innerText = loveReasons[currentReason];
    currentReason = (currentReason + 1) % loveReasons.length;
};

function startFireworks() {
    const canvas = document.getElementById('fireworks');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // ... basic firework logic ...
    function anim() {
        if (document.getElementById('ny-overlay').classList.contains('hidden')) return;
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        requestAnimationFrame(anim);
    } anim();
}

// --- 4. FIREBASE FEATURES (Syncs with the New World) ---
const noteRef = ref(db, 'notes/currentNote');
onValue(noteRef, (s) => { document.getElementById('latestNote').innerText = s.val() || "No notes yet..."; });
document.getElementById('saveNoteBtn').onclick = () => {
    const i = document.getElementById('noteInput');
    if (i.value.trim()) { set(noteRef, i.value); i.value = ''; }
};

const bucketRef = ref(db, 'bucketList');
onValue(bucketRef, (s) => {
    const l = document.getElementById('bucketList'); l.innerHTML = '';
    const d = s.val();
    if (d) Object.entries(d).forEach(([k, v]) => {
        const li = document.createElement('li');
        li.className = v.done ? 'done' : '';
        li.innerHTML = `<span>${v.text}</span><button class="del">❄️</button>`;
        li.onclick = (e) => { if(e.target.tagName !== 'BUTTON') update(ref(db, `bucketList/${k}`), {done: !v.done}); };
        li.querySelector('.del').onclick = () => remove(ref(db, `bucketList/${k}`));
        l.appendChild(li);
    });
});

const songsRef = ref(db, 'binderSongs');
let allSongs = []; let currentPage = 1;
onValue(songsRef, (s) => {
    const data = s.val();
    allSongs = data ? Object.entries(data).map(([id,v])=>({...v, id})).sort((a,b)=>b.timestamp-a.timestamp) : [];
    renderBinder();
});
function renderBinder() {
    const d = document.getElementById('binder-pages-display'); d.innerHTML = '';
    allSongs.slice((currentPage-1)*3, currentPage*3).forEach(s => {
        const div = document.createElement('div');
        div.className = 'song-entry';
        div.innerHTML = `<textarea class="sn">${s.sideNote||''}</textarea>
            <iframe src="${s.embedUrl}" width="100%" height="80"></iframe>`;
        d.appendChild(div);
    });
}
// (Include your existing Music pagination/add logic here)
