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
    gift.style.transform = "scale(100) rotate(45deg)";
    gift.style.opacity = "0";
    const p = document.getElementById('portal-overlay');
    p.classList.remove('hidden');
    p.style.transform = "scale(1)";
    setTimeout(() => {
        document.body.className = 'vault-theme';
        document.getElementById('old-world').classList.add('hidden');
        document.getElementById('new-world').classList.remove('hidden');
        p.style.opacity = "0";
    }, 1200);
};

// --- STAR GAME LOGIC ---
const starReasons = ["Kindness", "Safe Space", "Laughter", "Support", "Your Eyes", "Us", "Forever"];
const loveReasons = [
    "Your eyes sparkle in a way that makes my world bright.",
    "Because you make me feel like I can conquer anything.",
    "The way you listen to me even when I'm just rambling.",
    "Your kindness is a rare gift I cherish every day.",
    "Because home isn't a place anymore, it's just you.",
    "The way you support my dreams without hesitation.",
    "Simply because you are you, and that's more than enough."
];

class MovingStar {
    constructor(text) {
        this.el = document.createElement('div');
        this.el.className = 'live-star';
        this.el.innerHTML = `✨<div class="star-pop">${text}</div>`;
        this.x = Math.random() * 80 + 10;
        this.y = Math.random() * 80 + 10;
        this.dx = (Math.random() - 0.5) * 0.5;
        this.dy = (Math.random() - 0.5) * 0.5;
        this.active = false;
    }
    update() {
        if (this.active) return;
        this.x += this.dx;
        this.y += this.dy;
        if (this.x < 5 || this.x > 90) this.dx *= -1;
        if (this.y < 5 || this.y > 90) this.dy *= -1;
        this.el.style.left = this.x + '%';
        this.el.style.top = this.y + '%';
    }
}

let stars = [];
let foundCount = 0;

function startStarGame() {
    const area = document.getElementById('game-canvas-area');
    area.innerHTML = '';
    stars = starReasons.map(txt => {
        const s = new MovingStar(txt);
        s.el.onclick = () => {
            if(!s.active) {
                s.active = true;
                s.el.classList.add('caught');
                foundCount++;
                document.getElementById('starCount').innerText = foundCount;
                if(foundCount === starReasons.length) {
                    setTimeout(() => showStage('ny-stage-menu'), 1500);
                }
            }
        };
        area.appendChild(s.el);
        return s;
    });
    
    function animate() {
        if (document.getElementById('ny-stage-1').classList.contains('hidden')) return;
        stars.forEach(s => s.update());
        requestAnimationFrame(animate);
    }
    animate();
}

// --- NAVIGATION ---
function showStage(id) {
    document.querySelectorAll('.ny-stage').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id === 'ny-stage-menu') startFireworks();
}

document.getElementById('btnNY').onclick = () => {
    document.getElementById('ny-overlay').classList.remove('hidden');
    foundCount = 0;
    document.getElementById('starCount').innerText = 0;
    showStage('ny-stage-1');
    startStarGame();
};

document.getElementById('goReasons').onclick = () => showStage('ny-stage-reasons');
document.getElementById('goLetter').onclick = () => {
    showStage('ny-stage-letter');
    const txt = document.getElementById('typewriter-text');
    txt.innerHTML = "";
    let i = 0;
    const msg = "My Dearest... Looking back at 2025, the best part was simply having you by my side. Every laughter we shared and every challenge we faced only made us stronger. I want you to know that as we enter 2026, you are still my everything. Happy New Year, my love.";
    function type() {
        if(i < msg.length) { txt.innerHTML += msg.charAt(i); i++; setTimeout(type, 50); }
    } type();
};
document.querySelectorAll('.back-pill').forEach(b => b.onclick = () => showStage('ny-stage-menu'));
document.getElementById('exitNY').onclick = () => document.getElementById('ny-overlay').classList.add('hidden');

let rIdx = 0;
document.getElementById('reasonTrigger').onclick = () => {
    const d = document.getElementById('reasonDisplay');
    d.style.opacity = 0;
    setTimeout(() => { d.innerText = loveReasons[rIdx % loveReasons.length]; d.style.opacity = 1; rIdx++; }, 300);
};

// --- FIREBASE SYNC (Core) ---
onValue(ref(db, 'notes/currentNote'), (s) => { document.getElementById('latestNote').innerText = s.val() || "No notes yet..."; });
document.getElementById('saveNoteBtn').onclick = () => {
    const inp = document.getElementById('noteInput');
    if(inp.value.trim()) { set(ref(db, 'notes/currentNote'), inp.value); inp.value = ''; }
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

// --- FIREWORKS ---
function startFireworks() {
    const canvas = document.getElementById('fireworks'); const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let parts = [];
    function anim() {
        if(document.getElementById('ny-overlay').classList.contains('hidden')) return;
        requestAnimationFrame(anim);
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        if(Math.random()<0.1) {
            const x=Math.random()*canvas.width, y=Math.random()*canvas.height/2, c=`hsl(${Math.random()*360},70%,60%)`;
            for(let i=0; i<30; i++) parts.push({x,y,vx:(Math.random()-0.5)*10,vy:(Math.random()-0.5)*10,a:1,c});
        }
        parts.forEach((p,i)=>{
            p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.a-=0.01;
            ctx.globalAlpha=p.a; ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,2.5,0,Math.PI*2); ctx.fill();
            if(p.a<=0) parts.splice(i,1);
        });
    } anim();
}

// --- INITIALIZE ---
document.getElementById('loginBtn').onclick = () => {
    if(document.getElementById('passwordInput').value.toUpperCase() === "MOON") document.getElementById('login-screen').classList.add('hidden');
};
