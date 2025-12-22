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

let targetDate, eventName, allSongs = [], currentPage = 1, simulationMode = false;
let fireworksInterval;

// --- INITIALIZE ---
initSettings();
initTimer();
initNotes();
initBucket();
initSongs();
startSnow();

function initSettings() {
    onValue(ref(db, 'vaultConfig'), (snap) => {
        const data = snap.val() || { eventName: "Christmas", date: "2025-12-25" };
        if(!simulationMode) {
            eventName = data.eventName;
            targetDate = new Date(data.date + "T00:00:00").getTime();
            document.getElementById('vault-title').innerText = `Our ${eventName} Wonderland`;
            document.getElementById('event-name-input').value = eventName;
            document.getElementById('event-date-input').value = data.date;
        }
    });
    document.getElementById('save-settings-btn').onclick = () => {
        const name = document.getElementById('event-name-input').value;
        const date = document.getElementById('event-date-input').value;
        if(name && date) { set(ref(db, 'vaultConfig'), { eventName: name, date: date }); alert("Saved!"); location.reload(); }
    };
    // PREVIEW BUTTON
    document.getElementById('simulate-btn').onclick = () => {
        simulationMode = true;
        targetDate = new Date().getTime() + 10000; // 10 seconds
        eventName = "Magic Moment";
        document.getElementById('settings-modal').style.display = 'none';
        document.getElementById('vault-title').innerText = "Get Ready...";
    };
}

function initTimer() {
    const box = document.getElementById('countdown-timer');
    setInterval(() => {
        const diff = targetDate - new Date().getTime();
        
        // --- THE SURPRISE MOMENT ---
        if (diff <= 0) {
            box.innerHTML = `✨ Merry Christmas!<br><span style="font-size:1rem; font-weight:400;">I love you more than words can say.</span>`;
            box.classList.add('celebrate');
            if(!fireworksInterval) startFireworks(); // START FIREWORKS
            return;
        }

        const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000),
              m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
        
        if (diff < 10000) { box.innerText = s; box.style.color = "#ff4757"; }
        else if (diff < 60000) box.innerText = `${s} Seconds...`;
        else if (d < 1) box.innerText = `${h}h ${m}m Remaining`;
        else box.innerText = `${d} Days until ${eventName}`;
    }, 1000);
}

// --- FIREWORKS ENGINE ---
function startFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Darken background for effect
    document.body.style.background = "#2d3436"; 
    
    let particles = [];
    fireworksInterval = setInterval(() => {
        // Create explosion
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height / 2;
        const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        for(let i=0; i<30; i++) {
            particles.push({x, y, dx: (Math.random()-0.5)*5, dy: (Math.random()-0.5)*5, color, alpha: 1});
        }
    }, 500);

    function animate() {
        requestAnimationFrame(animate);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trail effect
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, index) => {
            p.x += p.dx; p.y += p.dy; p.alpha -= 0.02;
            ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
            if(p.alpha <= 0) particles.splice(index, 1);
        });
    }
    animate();
}

// --- STANDARD FEATURES ---
function initNotes() {
    const r = ref(db, 'notes/currentNote');
    document.getElementById('saveNoteBtn').onclick = () => set(r, document.getElementById('noteInput').value);
    onValue(r, s => document.getElementById('latestNote').innerText = s.val() || "...");
}
function initBucket() {
    const r = ref(db, 'bucketList');
    document.getElementById('addBucketBtn').onclick = () => {
        const el = document.getElementById('bucketInput');
        if(el.value) push(r, { text: el.value, done: false }); el.value = '';
    };
    onValue(r, s => {
        const list = document.getElementById('bucketList'); list.innerHTML = '';
        if(s.val()) Object.entries(s.val()).forEach(([k, v]) => {
            const li = document.createElement('li'); li.innerHTML = `<span>${v.text}</span> <div class="del-btn-sleek" onclick="deleteItem('${k}')"><i class="fas fa-trash"></i></div>`;
            list.appendChild(li);
        });
    });
}
function initSongs() {
    const r = ref(db, 'binderSongs');
    document.getElementById('addSongBtn').onclick = () => {
        const url = document.getElementById('songLinkInput').value;
        const m = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        if(m) { push(r, { embedUrl: `https://open.spotify.com/embed/$...{m[1]}/${m[2]}`, timestamp: Date.now() }); document.getElementById('songLinkInput').value = ''; }
    };
    onValue(r, snap => {
        allSongs = []; if(snap.val()) Object.entries(snap.val()).forEach(([k, v]) => allSongs.push({...v, id: k}));
        renderSongs();
    });
}
function renderSongs() {
    const d = document.getElementById('binder-pages-display'); d.innerHTML = '';
    const start = (currentPage-1)*3;
    allSongs.slice(start, start + 3).forEach(s => {
        const div = document.createElement('div'); div.className = 'song-entry';
        div.innerHTML = `<div class="song-card"><iframe src="${s.embedUrl}" allow="encrypted-media"></iframe></div><div class="del-btn-sleek" onclick="deleteSong('${s.id}')"><i class="fas fa-trash"></i></div>`;
        d.appendChild(div);
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = (start + 3) >= allSongs.length;
}
document.getElementById('prevBtn').onclick = () => { currentPage--; renderSongs(); };
document.getElementById('nextBtn').onclick = () => { currentPage++; renderSongs(); };
function startSnow() {
    const c = document.getElementById('snow-container'); c.innerHTML = '';
    for(let i=0; i<30; i++) {
        const f = document.createElement('div'); f.className = 'snowflake'; f.innerHTML = '❄';
        f.style.left = Math.random()*100+'vw'; f.style.top = -Math.random()*100+'vh'; f.style.fontSize = Math.random()*15+10+'px';
        f.style.animation = `fall ${Math.random()*5+5}s linear infinite`; c.appendChild(f);
    }
}
window.deleteItem = (id) => remove(ref(db, `bucketList/${id}`));
window.deleteSong = (id) => remove(ref(db, `binderSongs/${id}`));
