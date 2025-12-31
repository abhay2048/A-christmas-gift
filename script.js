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

// --- 1. WORLD TRANSITION ---
const gift = document.getElementById('magic-gift');
gift.onclick = () => {
    gift.style.transform = "scale(80) rotate(45deg)";
    gift.style.opacity = "0";
    const portal = document.getElementById('portal-overlay');
    portal.classList.remove('hidden');
    portal.style.transform = "scale(1)";
    setTimeout(() => {
        document.body.className = 'vault-theme';
        document.getElementById('old-world').classList.add('hidden');
        document.getElementById('new-world').classList.remove('hidden');
        portal.style.opacity = "0";
    }, 1100);
};

// --- 2. STAR GAME LOGIC ---
const starWords = ["Kindness", "Safe Space", "Laughter", "Support", "Forever", "Us"];
const loveReasons = [
    "The way your eyes sparkle when you laugh.",
    "Because you make me feel like I can conquer anything.",
    "The way you listen to me even when I'm rambling.",
    "Your kindness is a rare gift I cherish every day.",
    "Because home isn't a place anymore, it's just you.",
    "The way you support my dreams without hesitation."
];

class Star {
    constructor(word) {
        this.el = document.createElement('div');
        this.el.className = 'moving-star';
        this.el.innerHTML = `✨<div class="star-label">${word}</div>`;
        this.x = Math.random() * 80 + 10;
        this.y = Math.random() * 80 + 10;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.caught = false;
    }
    update() {
        if (this.caught) return;
        this.x += this.vx; this.y += this.vy;
        if (this.x < 5 || this.x > 90) this.vx *= -1;
        if (this.y < 5 || this.y > 90) this.vy *= -1;
        this.el.style.left = this.x + '%';
        this.el.style.top = this.y + '%';
    }
}

let activeStars = [];
let caughtCount = 0;

function startStarGame() {
    const area = document.getElementById('star-game-area');
    area.innerHTML = ''; caughtCount = 0;
    document.getElementById('starCount').innerText = 0;
    activeStars = starWords.map(w => {
        const s = new Star(w);
        s.el.onclick = () => {
            if(!s.caught) {
                s.caught = true; s.el.classList.add('active');
                caughtCount++; document.getElementById('starCount').innerText = caughtCount;
                if(caughtCount === starWords.length) setTimeout(() => showStage('ny-stage-menu'), 1500);
            }
        };
        area.appendChild(s.el); return s;
    });
    function loop() {
        if(document.getElementById('ny-stage-1').classList.contains('hidden')) return;
        activeStars.forEach(s => s.update());
        requestAnimationFrame(loop);
    } loop();
}

// --- NAVIGATION ---
function showStage(id) {
    document.querySelectorAll('.ny-stage').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'ny-stage-menu') startFireworks();
}

document.getElementById('btnNY').onclick = () => {
    document.getElementById('ny-overlay').classList.remove('hidden');
    showStage('ny-stage-1');
    startStarGame();
};

document.getElementById('btnReasons').onclick = () => showStage('ny-stage-reasons');
document.getElementById('btnLetter').onclick = () => {
    showStage('ny-stage-letter');
    const txt = document.getElementById('typewriter-text');
    txt.innerHTML = ""; let i = 0;
    const msg = "My Dearest... Looking back at 2025, the best part was simply having you by my side. Every challenge we faced only made us stronger. You are my home, my heart, and my future. Happy New Year, my love.";
    function type() {
        if(i < msg.length) { txt.innerHTML += msg.charAt(i); i++; setTimeout(type, 50); }
    } type();
};
document.querySelectorAll('.back-btn').forEach(b => b.onclick = () => showStage('ny-stage-menu'));
document.getElementById('exitNY').onclick = () => document.getElementById('ny-overlay').classList.add('hidden');

let rIdx = 0;
document.getElementById('reasonTrigger').onclick = () => {
    const d = document.getElementById('reasonDisplay');
    d.style.opacity = 0;
    setTimeout(() => { d.innerText = loveReasons[rIdx % loveReasons.length]; d.style.opacity = 1; rIdx++; }, 300);
};

// --- CORE FIREBASE (Keep your existing logic) ---
onValue(ref(db, 'notes/currentNote'), (s) => { document.getElementById('latestNote').innerText = s.val() || "No notes..."; });
document.getElementById('saveNoteBtn').onclick = () => {
    const i = document.getElementById('noteInput');
    if(i.value.trim()) { set(ref(db, 'notes/currentNote'), i.value); i.value = ''; }
};

onValue(ref(db, 'bucketList'), (s) => {
    const list = document.getElementById('bucketList'); list.innerHTML = '';
    const d = s.val();
    if(d) Object.entries(d).forEach(([k, v]) => {
        const li = document.createElement('li');
        li.className = v.done ? 'done' : '';
        li.innerHTML = `<span>${v.text}</span> <button class="del">❄️</button>`;
        li.onclick = (e) => { if(e.target.tagName !== 'BUTTON') update(ref(db, `bucketList/${k}`), {done: !v.done}); };
        li.querySelector('.del').onclick = () => remove(ref(db, `bucketList/${k}`));
        list.appendChild(li);
    });
});

document.getElementById('addBucketBtn').onclick = () => {
    const i = document.getElementById('bucketInput');
    if(i.value) push(ref(db, 'bucketList'), {text: i.value, done: false}); i.value = '';
};

// Music Logic (Simplified)
let allSongs = []; let currentPage = 1;
onValue(ref(db, 'binderSongs'), (s) => {
    const d = s.val();
    allSongs = d ? Object.entries(d).map(([id,v])=>({...v, id})).sort((a,b)=>b.timestamp-a.timestamp) : [];
    renderBinder();
});
function renderBinder() {
    const disp = document.getElementById('binder-pages-display'); disp.innerHTML = '';
    allSongs.slice((currentPage-1)*3, currentPage*3).forEach(song => {
        const div = document.createElement('div'); div.className = 'song-entry';
        div.innerHTML = `<textarea class="sn">${song.sideNote||''}</textarea><iframe src="${song.embedUrl}" width="100%" height="80"></iframe>`;
        disp.appendChild(div);
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
}

// Fireworks
function startFireworks() {
    const canvas = document.getElementById('fireworks'); const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let p = [];
    function anim() {
        if(document.getElementById('ny-overlay').classList.contains('hidden')) return;
        requestAnimationFrame(anim);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        if(Math.random()<0.1) {
            const x=Math.random()*canvas.width, y=Math.random()*canvas.height/2, c=`hsl(${Math.random()*360},50%,50%)`;
            for(let i=0; i<20; i++) p.push({x,y,vx:(Math.random()-0.5)*10,vy:(Math.random()-0.5)*10,a:1,c});
        }
        p.forEach((part,i)=>{
            part.x+=part.vx; part.y+=part.vy; part.vy+=0.05; part.a-=0.01;
            ctx.globalAlpha=part.a; ctx.fillStyle=part.c; ctx.beginPath(); ctx.arc(part.x,part.y,2,0,Math.PI*2); ctx.fill();
            if(part.a<=0) p.splice(i,1);
        });
    } anim();
}

// Login
document.getElementById('loginBtn').onclick = () => {
    if(document.getElementById('passwordInput').value.toUpperCase()==="MOON") document.getElementById('login-screen').classList.add('hidden');
};
