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
document.getElementById('loginBtn').addEventListener('click', () => {
    if (document.getElementById('passwordInput').value.toUpperCase() === "MOON") {
        document.getElementById('login-screen').classList.add('hidden');
    }
});

// --- 2. THE GIFT TRANSITION ---
const gift = document.getElementById('magic-gift');
const portal = document.getElementById('portal-overlay');
gift.addEventListener('click', () => {
    gift.style.transform = "scale(80) rotate(45deg)";
    gift.style.opacity = "0";
    portal.classList.remove('hidden');
    portal.style.transform = "scale(1)";
    setTimeout(() => {
        document.body.className = 'vault-theme';
        document.getElementById('old-world').classList.add('hidden');
        document.getElementById('new-world').classList.remove('hidden');
        portal.style.opacity = "0";
        setTimeout(() => portal.classList.add('hidden'), 1000);
    }, 1100);
});

// --- 3. NEW YEAR DATA ---
const starWords = ["Resilience", "Laughter", "Kindness", "Safe Space", "Adventure", "Us"];
const loveReasons = [
    "The way your eyes sparkle when you laugh.",
    "Because you make me feel safe in a chaotic world.",
    "Your unwavering support for everything I do.",
    "How you look at me when you think I'm not looking.",
    "The way your hand fits perfectly inside mine.",
    "Because you are my best friend and my home.",
    "The kindness you show to everyone around you."
];
const letterText = "My Dearest... Looking back at 2025, the best part was simply having you by my side. Every laughter we shared and every challenge we faced only made us stronger. I want you to know that as we enter 2026, you are still my everything. Happy New Year, my love.";

// --- NEW YEAR FLOW ---
function showStage(stageId) {
    document.querySelectorAll('.ny-stage').forEach(s => s.classList.add('hidden'));
    document.getElementById(stageId).classList.remove('hidden');
}

document.getElementById('btnNY').addEventListener('click', () => {
    const ny = document.getElementById('ny-overlay');
    const container = document.getElementById('star-container');
    ny.classList.remove('hidden');
    container.innerHTML = '';
    let found = 0;
    showStage('ny-stage-1');

    starWords.forEach((word) => {
        const star = document.createElement('div');
        star.className = 'live-star';
        star.innerHTML = `✨<div class="star-word">${word}</div>`;
        star.style.left = Math.random() * 80 + 10 + '%';
        star.style.top = Math.random() * 70 + 10 + '%';
        star.onclick = () => {
            if(!star.classList.contains('active')) {
                star.classList.add('active');
                if(++found === starWords.length) setTimeout(() => { showStage('ny-stage-menu'); startFireworks(); }, 1500);
            }
        };
        container.appendChild(star);
    });
});

document.getElementById('goReasons').onclick = () => showStage('ny-stage-reasons');
document.getElementById('goLetter').onclick = () => {
    showStage('ny-stage-letter');
    let i = 0; document.getElementById('typewriter-text').innerHTML = "";
    function type() {
        if(i < letterText.length) { document.getElementById('typewriter-text').innerHTML += letterText.charAt(i); i++; setTimeout(type, 50); }
    } type();
};

document.querySelectorAll('.back-to-menu').forEach(b => b.onclick = () => showStage('ny-stage-menu'));
document.getElementById('exitNY').onclick = () => document.getElementById('ny-overlay').classList.add('hidden');

let rIndex = 0;
document.getElementById('reasonTrigger').onclick = () => {
    const d = document.getElementById('reasonDisplay');
    d.style.opacity = 0;
    setTimeout(() => { d.innerText = loveReasons[rIndex % loveReasons.length]; d.style.opacity = 1; rIndex++; }, 300);
};

// --- 4. FIREBASE LOGIC ---
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
        li.innerHTML = `<span>${v.text}</span> <button class="del">❄️</button>`;
        li.onclick = (e) => { if(e.target.tagName !== 'BUTTON') update(ref(db, `bucketList/${k}`), {done:!v.done}); };
        li.querySelector('.del').onclick = () => remove(ref(db, `bucketList/${k}`));
        l.appendChild(li);
    });
});
document.getElementById('addBucketBtn').onclick = () => {
    const i = document.getElementById('bucketInput');
    if(i.value) { push(ref(db, 'bucketList'), {text:i.value, done:false}); i.value=''; }
};

// Music Binder
let allSongs = []; let currentPage = 1;
onValue(ref(db, 'binderSongs'), (s) => {
    const d = s.val();
    allSongs = d ? Object.entries(d).map(([id,v])=>({...v,id})).sort((a,b)=>b.timestamp-a.timestamp) : [];
    renderBinder();
});
function renderBinder() {
    const disp = document.getElementById('binder-pages-display'); disp.innerHTML = '';
    allSongs.slice((currentPage-1)*3, currentPage*3).forEach(song => {
        const div = document.createElement('div'); div.className = 'song-entry';
        div.innerHTML = `<textarea class="sn">${song.sideNote||''}</textarea>
        <div class="song-stack"><iframe src="${song.embedUrl}" width="100%" height="80"></iframe><button class="ds">×</button></div>`;
        div.querySelector('.sn').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {sideNote:e.target.value});
        div.querySelector('.ds').onclick = () => remove(ref(db, `binderSongs/${song.id}`));
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

// --- 5. VISUALS ---
function startFireworks() {
    const canvas = document.getElementById('fireworks'); const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let particles = [];
    function anim() {
        if(document.getElementById('ny-overlay').classList.contains('hidden')) return;
        requestAnimationFrame(anim);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        if(Math.random()<0.1) {
            const x=Math.random()*canvas.width, y=Math.random()*canvas.height/2, c=`hsl(${Math.random()*360},50%,50%)`;
            for(let i=0; i<25; i++) particles.push({x,y,vx:(Math.random()-0.5)*10,vy:(Math.random()-0.5)*10,a:1,c});
        }
        particles.forEach((p,i)=>{
            p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.a-=0.01;
            ctx.globalAlpha=p.a; ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fill();
            if(p.a<=0) particles.splice(i,1);
        });
    } anim();
}

setInterval(() => {
    const f = document.createElement('div'); f.innerHTML = '❄';
    f.style.cssText = `position:fixed; top:-5%; left:${Math.random()*100}%; opacity:${Math.random()}; animation:fall ${Math.random()*5+5}s linear forwards; color:white; pointer-events:none; z-index:1;`;
    document.body.appendChild(f); setTimeout(()=>f.remove(), 6000);
}, 300);
