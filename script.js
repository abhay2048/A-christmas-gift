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

// --- WORLD TRANSITION ---
const gift = document.getElementById('magic-gift');
gift.onclick = () => {
    gift.style.transform = "scale(150) rotate(90deg)";
    gift.style.opacity = "0";
    const portal = document.getElementById('portal-overlay');
    portal.classList.remove('hidden');
    portal.style.transform = "scale(1)";
    setTimeout(() => {
        document.body.className = 'vault-theme';
        document.getElementById('old-world').classList.add('hidden');
        document.getElementById('new-world').classList.remove('hidden');
        portal.style.opacity = "0";
    }, 1200);
};

// --- STAR GAME LOGIC ---
const starTraits = ["Kindness", "Safe Space", "Laughter", "Support", "Strength", "Forever", "Us"];
const loveReasons = [
    "The way you make the simplest moments feel like magic.",
    "Your laugh is my favorite song in the whole world.",
    "How you believe in me even when I don't believe in myself.",
    "Because you are my home and my greatest adventure.",
    "The way your hand feels perfectly in mine.",
    "Your kindness towards every soul you meet.",
    "Because you're the first thing I want to talk to every morning."
];

class Star {
    constructor(text) {
        this.el = document.createElement('div');
        this.el.className = 'moving-star';
        this.el.innerHTML = `✨<div class="star-label">${text}</div>`;
        this.x = Math.random() * 80 + 10;
        this.y = Math.random() * 80 + 10;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.caught = false;
    }
    move() {
        if(this.caught) return;
        this.x += this.vx; this.y += this.vy;
        if(this.x < 5 || this.x > 90) this.vx *= -1;
        if(this.y < 5 || this.y > 90) this.vy *= -1;
        this.el.style.left = this.x + '%';
        this.el.style.top = this.y + '%';
    }
}

let activeStars = [];
let count = 0;

function startStarGame() {
    const area = document.getElementById('game-canvas-area');
    area.innerHTML = ''; count = 0;
    activeStars = starTraits.map(s => {
        const star = new Star(s);
        star.el.onclick = () => {
            if(!star.caught) {
                star.caught = true; star.el.classList.add('caught');
                count++; document.getElementById('starCount').innerText = count;
                if(count === starTraits.length) setTimeout(() => switchStage('ny-stage-menu'), 1000);
            }
        };
        area.appendChild(star.el); return star;
    });
    function loop() {
        if(document.getElementById('ny-stage-1').classList.contains('hidden')) return;
        activeStars.forEach(s => s.move());
        requestAnimationFrame(loop);
    } loop();
}

// --- NAVIGATION ---
function switchStage(id) {
    document.querySelectorAll('.ny-stage').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'ny-stage-menu') startFireworks();
}

document.getElementById('btnNY').onclick = () => {
    document.getElementById('ny-overlay').classList.remove('hidden');
    switchStage('ny-stage-1');
    startStarGame();
};

document.getElementById('goReasons').onclick = () => switchStage('ny-stage-reasons');
document.getElementById('goLetter').onclick = () => {
    switchStage('ny-stage-letter');
    const txt = document.getElementById('typewriter-text');
    txt.innerHTML = ""; let i = 0;
    const msg = "My Dearest... Looking back at 2025, the best part was simply having you by my side. Every laughter we shared and every challenge we faced only made us stronger. I want you to know that as we enter 2026, you are still my everything. Happy New Year, my love.";
    function type() {
        if(i < msg.length) { txt.innerHTML += msg.charAt(i); i++; setTimeout(type, 50); }
    } type();
};

document.querySelectorAll('.back-to-menu').forEach(b => b.onclick = () => switchStage('ny-stage-menu'));
document.getElementById('exitNY').onclick = () => document.getElementById('ny-overlay').classList.add('hidden');

let rIdx = 0;
document.getElementById('reasonTrigger').onclick = () => {
    const d = document.getElementById('reasonDisplay');
    d.style.opacity = 0;
    setTimeout(() => { d.innerText = loveReasons[rIdx % loveReasons.length]; d.style.opacity = 1; rIdx++; }, 300);
};

// --- FIREWORKS ---
function startFireworks() {
    const canvas = document.getElementById('fireworks'); const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let parts = [];
    function anim() {
        if(document.getElementById('ny-overlay').classList.contains('hidden')) return;
        requestAnimationFrame(anim);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        if(Math.random()<0.08) {
            const x=Math.random()*canvas.width, y=Math.random()*canvas.height/2, c=`hsl(${Math.random()*360},80%,60%)`;
            for(let i=0; i<30; i++) parts.push({x,y,vx:(Math.random()-0.5)*15,vy:(Math.random()-0.5)*15,a:1,c});
        }
        parts.forEach((p,i)=>{
            p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.a-=0.01;
            ctx.globalAlpha=p.a; ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fill();
            if(p.a<=0) parts.splice(i,1);
        });
    } anim();
}

// --- FIREBASE SYNC ---
onValue(ref(db, 'notes/currentNote'), (s) => { document.getElementById('latestNote').innerText = s.val() || "Waiting for your words..."; });
document.getElementById('saveNoteBtn').onclick = () => {
    const i = document.getElementById('noteInput');
    if(i.value.trim()) { set(ref(db, 'notes/currentNote'), i.value); i.value = ''; }
};

onValue(ref(db, 'bucketList'), (s) => {
    const l = document.getElementById('bucketList'); l.innerHTML = '';
    const d = s.val();
    if(d) Object.entries(d).forEach(([k, v]) => {
        const li = document.createElement('li');
        li.className = v.done ? 'done' : '';
        li.innerHTML = `<span>${v.text}</span> <button class="del">×</button>`;
        li.onclick = (e) => { if(e.target.tagName !== 'BUTTON') update(ref(db, `bucketList/${k}`), {done:!v.done}); };
        li.querySelector('.del').onclick = () => remove(ref(db, `bucketList/${k}`));
        l.appendChild(li);
    });
});

document.getElementById('addBucketBtn').onclick = () => {
    const i = document.getElementById('bucketInput');
    if(i.value) push(ref(db, 'bucketList'), {text: i.value, done: false}); i.value = '';
};

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
document.getElementById('addSongBtn').onclick = () => {
    const m = document.getElementById('songLinkInput').value.match(/track\/([a-zA-Z0-9]+)/);
    if(m) push(ref(db, 'binderSongs'), {embedUrl:`https://open.spotify.com/embed/track/${m[1]}`, timestamp:Date.now()});
};
document.getElementById('prevBtn').onclick = () => { if(currentPage>1) { currentPage--; renderBinder(); }};
document.getElementById('nextBtn').onclick = () => { if(currentPage*3 < allSongs.length) { currentPage++; renderBinder(); }};

document.getElementById('loginBtn').onclick = () => {
    if(document.getElementById('passwordInput').value.toUpperCase() === "MOON") document.getElementById('login-screen').classList.add('hidden');
};

setInterval(() => {
    const f = document.createElement('div'); f.innerHTML = '❄';
    f.style.cssText = `position:fixed; top:-5%; left:${Math.random()*100}%; opacity:${Math.random()}; animation:fall ${Math.random()*5+5}s linear forwards; color:white; pointer-events:none; z-index:1;`;
    document.body.appendChild(f); setTimeout(()=>f.remove(), 6000);
}, 300);
