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
const loginBtn = document.getElementById('loginBtn');
if (localStorage.getItem('vaultUnlocked') === 'true') {
    document.getElementById('login-screen').classList.add('hidden');
}
loginBtn.addEventListener('click', () => {
    if (document.getElementById('passwordInput').value.toUpperCase() === "MOON") {
        localStorage.setItem('vaultUnlocked', 'true');
        document.getElementById('login-screen').classList.add('hidden');
    }
});

// --- 2. THE GIFT UNWRAPPING TRANSITION ---
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
    }, 1200);
});

// --- 3. NEW YEAR EMOTIONAL JOURNEY ---
const starQualities = ["Your Resilience", "Your Kindness", "How you listen", "Your Laugh", "Your Warmth", "Our Inside Jokes", "Your Bravery", "How you love"];
const promises = [
    "I promise to be your calm in every storm.",
    "I promise to always choose you, every single day.",
    "I promise to never stop being your biggest fan.",
    "I promise to make 2026 the happiest year of your life.",
    "I promise to hold your hand through the highs and the lows."
];
const letterText = "Looking back at 2025, the best part was simply having you by my side. No matter what the new year brings, as long as I have you, I have everything. You are my home, my heart, and my future. Happy New Year, my everything.";

document.getElementById('btnNY').addEventListener('click', () => {
    const ny = document.getElementById('ny-overlay');
    const container = document.getElementById('star-container');
    ny.classList.remove('hidden');
    container.innerHTML = '';
    let found = 0;

    starQualities.forEach((q) => {
        const star = document.createElement('div');
        star.className = 'star-point';
        star.innerHTML = `✨<span class="star-label">${q}</span>`;
        star.style.left = Math.random() * 80 + 10 + '%';
        star.style.top = Math.random() * 70 + 10 + '%';
        star.onclick = () => {
            if(!star.classList.contains('active')) {
                star.classList.add('active');
                if(++found === starQualities.length) {
                    setTimeout(() => {
                        document.getElementById('ny-stage-1').classList.add('hidden');
                        document.getElementById('ny-stage-2').classList.remove('hidden');
                        startFireworks();
                    }, 1500);
                }
            }
        };
        container.appendChild(star);
    });
});

let pIndex = 0;
document.getElementById('promiseTrigger').onclick = () => {
    const display = document.getElementById('promiseDisplay');
    display.style.opacity = 0;
    setTimeout(() => {
        display.innerText = promises[pIndex];
        display.style.opacity = 1;
        pIndex++;
        if(pIndex >= promises.length) {
            setTimeout(() => {
                document.getElementById('ny-stage-2').classList.add('hidden');
                document.getElementById('ny-stage-3').classList.remove('hidden');
                typeLetter();
            }, 3000);
        }
    }, 300);
};

function typeLetter() {
    let i = 0;
    const txt = document.getElementById('typewriter-text');
    txt.innerHTML = "";
    function type() {
        if (i < letterText.length) {
            txt.innerHTML += letterText.charAt(i);
            i++;
            setTimeout(type, 60);
        }
    }
    type();
}

// --- 4. FIREBASE SYNC (CORE FEATURES) ---
onValue(ref(db, 'notes/currentNote'), (s) => { document.getElementById('latestNote').innerText = s.val() || "No notes yet..."; });
document.getElementById('saveNoteBtn').onclick = () => {
    const input = document.getElementById('noteInput');
    if (input.value.trim()) { set(ref(db, 'notes/currentNote'), input.value); input.value = ''; }
};

const bucketRef = ref(db, 'bucketList');
document.getElementById('addBucketBtn').onclick = () => {
    const input = document.getElementById('bucketInput');
    if (input.value) { push(bucketRef, { text: input.value, done: false }); input.value = ''; }
};
onValue(bucketRef, (snapshot) => {
    const list = document.getElementById('bucketList'); list.innerHTML = '';
    const data = snapshot.val();
    if (data) Object.entries(data).forEach(([key, item]) => {
        const li = document.createElement('li');
        li.className = item.done ? 'done' : '';
        li.innerHTML = `<span>${item.text}</span> <button class="del">❄️</button>`;
        li.onclick = (e) => { if(e.target.tagName !== 'BUTTON') update(ref(db, `bucketList/${key}`), { done: !item.done }); };
        li.querySelector('.del').onclick = () => remove(ref(db, `bucketList/${key}`));
        list.appendChild(li);
    });
});

// Music Binder
const songsRef = ref(db, 'binderSongs');
let allSongs = []; let currentPage = 1;
onValue(songsRef, (snapshot) => {
    const data = snapshot.val();
    allSongs = data ? Object.entries(data).map(([id, s]) => ({...s, id})).sort((a,b) => b.timestamp - a.timestamp) : [];
    renderBinder();
});
function renderBinder() {
    const display = document.getElementById('binder-pages-display'); display.innerHTML = '';
    const songs = allSongs.slice((currentPage-1)*3, currentPage*3);
    songs.forEach(song => {
        const div = document.createElement('div'); div.className = 'song-entry';
        div.innerHTML = `<textarea class="sn">${song.sideNote || ''}</textarea>
        <div class="song-stack"><iframe src="${song.embedUrl}" width="100%" height="80"></iframe>
        <button class="del-song">×</button></div>`;
        div.querySelector('.sn').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {sideNote: e.target.value});
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

// --- 5. VISUALS (FIREWORKS & SNOW) ---
function startFireworks() {
    const canvas = document.getElementById('fireworks'); const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let parts = [];
    function anim() {
        if(document.getElementById('ny-overlay').classList.contains('hidden')) return;
        requestAnimationFrame(anim);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        if(Math.random()<0.1) {
            const x=Math.random()*canvas.width, y=Math.random()*canvas.height/2, c=`hsl(${Math.random()*360},50%,50%)`;
            for(let i=0; i<20; i++) parts.push({x,y,vx:(Math.random()-0.5)*10,vy:(Math.random()-0.5)*10,a:1,c});
        }
        parts.forEach((p,i)=>{
            p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.a-=0.01;
            ctx.globalAlpha=p.a; ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fill();
            if(p.a<=0) parts.splice(i,1);
        });
    } anim();
}

setInterval(() => {
    const flake = document.createElement('div');
    flake.innerHTML = '❄';
    flake.style.cssText = `position:fixed; top:-5%; left:${Math.random()*100}%; opacity:${Math.random()}; animation: fall ${Math.random()*5+5}s linear forwards; color:white; pointer-events:none; z-index:1;`;
    document.body.appendChild(flake); setTimeout(()=>flake.remove(), 6000);
}, 300);

document.getElementById('finalClose').onclick = () => document.getElementById('ny-overlay').classList.add('hidden');
