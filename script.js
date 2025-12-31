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
const loginScreen = document.getElementById('login-screen');
if (localStorage.getItem('vaultUnlocked') === 'true') loginScreen.classList.add('hidden');

document.getElementById('loginBtn').addEventListener('click', () => {
    if (document.getElementById('passwordInput').value.toUpperCase() === "MOON") {
        localStorage.setItem('vaultUnlocked', 'true');
        loginScreen.classList.add('hidden');
    }
});

// --- 2. NEW YEAR LOGIC ---
const memories = ["Laughter", "Long Talks", "Kindness", "Our Songs", "Big Dreams", "Safe Space", "Adventure", "Us"];
const loveReasons = [
    "The way your eyes sparkle when you laugh.",
    "Your unwavering support for my dreams.",
    "The way you make the simplest moments special.",
    "Because you are my home and my best friend.",
    "Your kindness makes me want to be a better person.",
    "The way your hand feels perfectly in mine.",
    "How you listen to me even when I'm rambling."
];

let currentReason = 0;
let poppedOrbs = 0;

document.getElementById('btnNY').addEventListener('click', () => {
    const ny = document.getElementById('ny-overlay');
    const container = document.getElementById('orb-container');
    ny.classList.remove('hidden');
    container.innerHTML = '';
    poppedOrbs = 0;

    // Create Orbs
    memories.forEach((text, i) => {
        const orb = document.createElement('div');
        orb.className = 'memory-orb';
        orb.innerText = text;
        orb.style.left = Math.random() * 70 + 15 + '%';
        orb.style.top = Math.random() * 60 + 20 + '%';
        orb.style.animationDelay = (i * 0.5) + 's';
        
        orb.onclick = () => {
            orb.style.transform = 'scale(2)';
            orb.style.opacity = '0';
            poppedOrbs++;
            if (poppedOrbs === memories.length) {
                setTimeout(() => {
                    document.getElementById('ny-stage-1').classList.add('hidden');
                    document.getElementById('ny-stage-2').classList.remove('hidden');
                    startFireworks();
                }, 1000);
            }
        };
        container.appendChild(orb);
    });
});

document.getElementById('reasonTrigger').onclick = () => {
    const d = document.getElementById('reasonDisplay');
    d.style.opacity = 0;
    setTimeout(() => {
        d.innerText = loveReasons[currentReason];
        d.style.opacity = 1;
        currentReason = (currentReason + 1) % loveReasons.length;
    }, 300);
};

// --- 3. FIREWORKS ---
function startFireworks() {
    const canvas = document.getElementById('fireworks');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particles = [];
    class P {
        constructor(x, y, c) {
            this.x = x; this.y = y; this.c = c;
            this.v = { x: (Math.random()-0.5)*10, y: (Math.random()-0.5)*10 };
            this.a = 1;
        }
        draw() { ctx.save(); ctx.globalAlpha = this.a; ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI*2); ctx.fillStyle = this.c; ctx.fill(); ctx.restore(); }
        update() { this.v.y += 0.05; this.x += this.v.x; this.y += this.v.y; this.a -= 0.01; }
    }
    function animate() {
        if (document.getElementById('ny-overlay').classList.contains('hidden')) return;
        requestAnimationFrame(animate);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        if (Math.random() < 0.1) {
            const x = Math.random()*canvas.width, y = Math.random()*canvas.height/2, c = `hsl(${Math.random()*360},50%,50%)`;
            for(let i=0; i<20; i++) particles.push(new P(x,y,c));
        }
        particles.forEach((p, i) => { if (p.a<=0) particles.splice(i,1); else { p.update(); p.draw(); }});
    }
    animate();
}

// --- 4. DATA LOGIC (UNCHANGED FROM ORIGINAL) ---
const noteRef = ref(db, 'notes/currentNote');
onValue(noteRef, (s) => { document.getElementById('latestNote').innerText = s.val() || "No notes yet..."; });
document.getElementById('saveNoteBtn').onclick = () => {
    const i = document.getElementById('noteInput');
    if (i.value.trim()) { set(noteRef, i.value); i.value = ''; }
};

const bucketRef = ref(db, 'bucketList');
document.getElementById('addBucketBtn').onclick = () => {
    const i = document.getElementById('bucketInput');
    if (i.value) { push(bucketRef, { text: i.value, done: false }); i.value = ''; }
};
onValue(bucketRef, (s) => {
    const l = document.getElementById('bucketList'); l.innerHTML = '';
    const d = s.val();
    if (d) Object.entries(d).forEach(([k, v]) => {
        const li = document.createElement('li');
        li.className = v.done ? 'done' : '';
        li.innerHTML = `<span>${v.done ? '✅' : '🌟'} ${v.text}</span><button class="del">❄️</button>`;
        li.onclick = (e) => { if(e.target.tagName !== 'BUTTON') update(ref(db, `bucketList/${k}`), {done: !v.done}); };
        li.querySelector('.del').onclick = () => remove(ref(db, `bucketList/${k}`));
        l.appendChild(li);
    });
});

const songsRef = ref(db, 'binderSongs');
let allSongs = []; let currentPage = 1;
onValue(songsRef, (s) => {
    const d = s.val();
    allSongs = d ? Object.entries(d).map(([id,v])=>({...v, id})).sort((a,b)=>b.timestamp-a.timestamp) : [];
    renderBinder();
});
function renderBinder() {
    const d = document.getElementById('binder-pages-display'); d.innerHTML = '';
    allSongs.slice((currentPage-1)*3, currentPage*3).forEach(s => {
        const div = document.createElement('div');
        div.className = 'song-entry';
        div.innerHTML = `<div class="song-memory"><textarea class="sn">${s.sideNote||''}</textarea></div>
            <div class="song-stack"><iframe src="${s.embedUrl}" width="100%" height="80"></iframe>
            <input class="fl" value="${s.favLine||''}" placeholder="♥ Line"><button class="ds">×</button></div>`;
        div.querySelector('.sn').onchange = (e) => update(ref(db, `binderSongs/${s.id}`), {sideNote: e.target.value});
        div.querySelector('.fl').onchange = (e) => update(ref(db, `binderSongs/${s.id}`), {favLine: e.target.value});
        div.querySelector('.ds').onclick = () => remove(ref(db, `binderSongs/${s.id}`));
        d.appendChild(div);
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
}
document.getElementById('addSongBtn').onclick = () => {
    const m = document.getElementById('songLinkInput').value.match(/track\/([a-zA-Z0-9]+)/);
    if(m) push(songsRef, {embedUrl: `https://open.spotify.com/embed/track/${m[1]}`, timestamp: Date.now()});
    document.getElementById('songLinkInput').value = '';
};
document.getElementById('prevBtn').onclick = () => { if(currentPage > 1) { currentPage--; renderBinder(); }};
document.getElementById('nextBtn').onclick = () => { if(currentPage*3 < allSongs.length) { currentPage++; renderBinder(); }};

// --- 5. SNOW ---
setInterval(() => {
    const c = document.getElementById('snow-container');
    const f = document.createElement('div'); f.innerHTML = '❄';
    f.style.cssText = `position:fixed; top:-5%; left:${Math.random()*100}%; opacity:${Math.random()}; animation: fall ${Math.random()*5+5}s linear forwards; color:white; pointer-events:none;`;
    c.appendChild(f); setTimeout(()=>f.remove(), 6000);
}, 300);

document.querySelectorAll('.close-overlay').forEach(b => b.onclick = () => {
    document.getElementById('reveal-overlay').classList.add('hidden');
    document.getElementById('ny-overlay').classList.add('hidden');
    document.getElementById('ny-stage-1').classList.remove('hidden');
    document.getElementById('ny-stage-2').classList.add('hidden');
});
