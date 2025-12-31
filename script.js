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

// --- GIFT TRANSITION ---
const gift = document.getElementById('magic-gift');
gift.onclick = () => {
    gift.style.transform = "scale(150) rotate(45deg)";
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

// --- STAR GAME ENGINE ---
const starReasons = ["Kindness", "Safe Space", "Laughter", "Support", "Strength", "Forever"];
const loveReasons = [
    "The way you make the simplest moments feel like magic.",
    "Your laugh is my favorite song in the whole world.",
    "How you believe in me even when I don't believe in myself.",
    "Because you are my home and my greatest adventure.",
    "The way your hand feels perfectly in mine.",
    "Your kindness towards every soul you meet."
];

class BouncingStar {
    constructor(text) {
        this.el = document.createElement('div');
        this.el.className = 'game-star';
        this.el.innerHTML = `✨<div class="star-label">${text}</div>`;
        this.x = Math.random() * 80 + 10;
        this.y = Math.random() * 80 + 10;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
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
    const area = document.getElementById('game-area');
    area.innerHTML = ''; count = 0;
    document.getElementById('starCount').innerText = 0;
    activeStars = starReasons.map(s => {
        const star = new BouncingStar(s);
        star.el.onclick = () => {
            if(!star.caught) {
                star.caught = true; star.el.classList.add('caught');
                count++; document.getElementById('starCount').innerText = count;
                if(count === starReasons.length) setTimeout(() => switchStage('ny-stage-menu'), 1500);
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

// --- NEW YEAR FLOW ---
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
    const msg = "My Dearest... Looking back at 2025, the best part was simply having you by my side. Every laughter we shared and every challenge we faced only made us stronger. You are my home, my heart, and my future. Happy New Year, my love.";
    function type() {
        if(i < msg.length) { txt.innerHTML += msg.charAt(i); i++; setTimeout(type, 50); }
    } type();
};

document.querySelectorAll('.back-link').forEach(b => b.onclick = () => switchStage('ny-stage-menu'));
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
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        if(Math.random()<0.1) {
            const x=Math.random()*canvas.width, y=Math.random()*canvas.height/2, c=`hsl(${Math.random()*360},70%,60%)`;
            for(let i=0; i<25; i++) parts.push({x,y,vx:(Math.random()-0.5)*12,vy:(Math.random()-0.5)*12,a:1,c});
        }
        parts.forEach((p,i)=>{
            p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.a-=0.01;
            ctx.globalAlpha=p.a; ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fill();
            if(p.a<=0) parts.splice(i,1);
        });
    } anim();
}

// --- FIREBASE SYNC (Existing) ---
onValue(ref(db, 'notes/currentNote'), (s) => { document.getElementById('latestNote').innerText = s.val() || "No notes yet..."; });
document.getElementById('saveNoteBtn').onclick = () => {
    const i = document.getElementById('noteInput');
    if(i.value.trim()) { set(ref(db, 'notes/currentNote'), i.value); i.value = ''; }
};

document.getElementById('loginBtn').onclick = () => {
    if(document.getElementById('passwordInput').value.toUpperCase() === "MOON") document.getElementById('login-screen').classList.add('hidden');
};
