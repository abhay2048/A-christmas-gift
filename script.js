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

// --- INIT ---
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
            updateTimerDisplay(); // Immediate update
        }
    });

    document.getElementById('save-settings-btn').onclick = () => {
        const name = document.getElementById('event-name-input').value;
        const date = document.getElementById('event-date-input').value;
        if(name && date) { set(ref(db, 'vaultConfig'), { eventName: name, date: date }); location.reload(); }
    };

    // PREVIEW BUTTON: Sets timer to 10s from now
    document.getElementById('simulate-btn').onclick = () => {
        simulationMode = true;
        targetDate = new Date().getTime() + 10000; 
        eventName = "Our Magic Moment";
        document.getElementById('settings-modal').style.display = 'none';
        document.getElementById('vault-title').innerText = "Shhh... watch closely...";
    };
}

function updateTimerDisplay() {
    // This function is handled by the Interval below
}

function initTimer() {
    const timerBox = document.getElementById('countdown-timer');
    const secretBox = document.getElementById('secret-message-box');

    setInterval(() => {
        if(!targetDate) return;
        const now = new Date().getTime();
        const diff = targetDate - now;

        // 1. THE SUSPENSE / SECRET MESSAGE PHASE (0 to -30 seconds)
        if (diff <= 0 && diff > -30000) {
            timerBox.style.display = 'none'; // Hide normal timer
            secretBox.style.display = 'block';
            secretBox.className = 'secret-msg-style';
            
            // YOUR CUSTOM MESSAGE HERE
            secretBox.innerHTML = `
                ✨ Merry Christmas My Love! ✨<br>
                <span style="font-size: 1.5rem; font-family: 'Quicksand'; display:block; margin-top:20px;">
                May your coming days be as pretty as snow! <br> I love you more than words can say. ❤️
                </span>
            `;
            
            // Trigger Fireworks if not running
            if(!fireworksInterval) startFireworks(); 
        } 
        
        // 2. THE AFTERMATH PHASE (After 30 seconds)
        else if (diff <= -30000) {
            stopFireworks(); // Stop the noise/animation
            secretBox.style.display = 'none';
            timerBox.style.display = 'inline-block';
            timerBox.innerHTML = "Merry Christmas! 🎄<br><span style='font-size:0.9rem'>Waiting for next date...</span>";
            document.body.style.background = ""; // Reset background
        }

        // 3. THE COUNTDOWN PHASE (Before 0)
        else {
            secretBox.style.display = 'none';
            timerBox.style.display = 'inline-block';
            
            const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000),
                  m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);

            if (diff < 10000) { 
                timerBox.innerText = s; 
                timerBox.style.color = "#ff4757"; 
                timerBox.style.fontSize = "3rem";
            }
            else if (diff < 60000) timerBox.innerText = `${s} Seconds...`;
            else if (d < 1) timerBox.innerText = `${h}h ${m}m ${s}s`;
            else timerBox.innerText = `${d} Days until ${eventName}`;
        }
    }, 1000);
}

// --- FIREWORKS ENGINE ---
function startFireworks() {
    if(fireworksInterval) return;
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    
    // Dark Mode for Fireworks
    document.body.style.transition = "background 1s";
    document.body.style.background = "#1a1a2e"; 

    let particles = [];
    fireworksInterval = setInterval(() => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height / 2;
        const color = `hsl(${Math.random() * 360}, 100%, 70%)`;
        for(let i=0; i<40; i++) particles.push({x, y, dx: (Math.random()-0.5)*6, dy: (Math.random()-0.5)*6, color, alpha: 1});
    }, 400);

    function animate() {
        if(!fireworksInterval && particles.length === 0) { ctx.clearRect(0,0,canvas.width,canvas.height); return; }
        requestAnimationFrame(animate);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.x += p.dx; p.y += p.dy; p.alpha -= 0.02;
            ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
            if(p.alpha <= 0) particles.splice(i, 1);
        });
    }
    animate();
}

function stopFireworks() {
    clearInterval(fireworksInterval);
    fireworksInterval = null;
    document.body.style.background = "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)"; // Restore background
}

// --- SONG LOGIC (UPDATED WITH FIELDS) ---
function initSongs() {
    const r = ref(db, 'binderSongs');
    document.getElementById('addSongBtn').onclick = () => {
        const url = document.getElementById('songLinkInput').value;
        const line = document.getElementById('songLineInput').value;
        const note = document.getElementById('songNoteInput').value;
        
        const m = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        if(m) { 
            push(r, { 
                embedUrl: `https://open.spotify.com/embed/$...{m[1]}/${m[2]}`, 
                line: line, 
                note: note, 
                timestamp: Date.now() 
            }); 
            document.getElementById('songLinkInput').value = '';
            document.getElementById('songLineInput').value = '';
            document.getElementById('songNoteInput').value = '';
        }
    };
    onValue(r, snap => {
        allSongs = []; if(snap.val()) Object.entries(snap.val()).forEach(([k, v]) => allSongs.push({...v, id: k}));
        allSongs.sort((a,b) => a.timestamp - b.timestamp); renderSongs();
    });
}

function renderSongs() {
    const d = document.getElementById('binder-pages-display'); d.innerHTML = '';
    const start = (currentPage-1)*3;
    allSongs.slice(start, start + 3).forEach(s => {
        const div = document.createElement('div'); div.className = 'song-entry';
        div.innerHTML = `
            <div class="del-btn-sleek" onclick="deleteSong('${s.id}')"><i class="fas fa-trash"></i></div>
            <iframe src="${s.embedUrl}" width="100%" height="80" style="border:none; border-radius:8px;" allow="encrypted-media"></iframe>
            <div class="song-details">
                <div class="fav-line">"${s.line || 'No favorite line added'}"</div>
                <div class="song-note">${s.note || ''}</div>
            </div>
        `;
        d.appendChild(div);
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = (start + 3) >= allSongs.length;
}

// --- STANDARD FUNCTIONS ---
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
            const li = document.createElement('li'); 
            li.innerHTML = `<span>${v.text}</span> <div class="del-btn-sleek" onclick="deleteItem('${k}')"><i class="fas fa-trash"></i></div>`;
            list.appendChild(li);
        });
    });
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
