import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDau2bGEVfZZIZtdEInGjTlQA7jSs0ndGU",
    authDomain: "a-christmas-gift.firebaseapp.com",
    databaseURL: "https://a-christmas-gift-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "a-christmas-gift",
    storageBucket: "a-christmas-gift.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let targetDate, eventName, allSongs = [], currentPage = 1, simulationMode = false;
let fireworksInterval;

// Initialize Sections
initSettings();
initTimer();
initNotes();
initBucket();
initSongs();

function initSettings() {
    onValue(ref(db, 'vaultConfig'), (snap) => {
        const data = snap.val() || { eventName: "Christmas", date: "2025-12-25" };
        if(!simulationMode) {
            eventName = data.eventName;
            targetDate = new Date(data.date + "T00:00:00").getTime();
        }
    });

    document.getElementById('save-settings-btn').onclick = () => {
        const name = document.getElementById('event-name-input').value;
        const date = document.getElementById('event-date-input').value;
        if(name && date) { set(ref(db, 'vaultConfig'), { eventName: name, date: date }); location.reload(); }
    };

    document.getElementById('simulate-btn').onclick = () => {
        simulationMode = true;
        targetDate = new Date().getTime() + 5000; // 5s for testing
        eventName = "Testing Mode";
        document.getElementById('settings-modal').style.display = 'none';
    };
}

function initTimer() {
    const timerBox = document.getElementById('countdown-timer');
    const secretBox = document.getElementById('secretMessage');
    let delayTriggered = false;

    setInterval(() => {
        if(!targetDate) return;
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff <= 0) {
            timerBox.innerHTML = "Moment Arrived! ❤️";
            
            // Trigger secret message with 10s delay [cite: 8, 188, 194]
            if (!delayTriggered) {
                delayTriggered = true;
                setTimeout(() => {
                    secretBox.classList.add('visible');
                    if(!fireworksInterval) startFireworks();
                }, 10000); // 10000ms = 10 seconds [cite: 195, 246]
            }
        } else {
            const d = Math.floor(diff / 86400000), s = Math.floor((diff % 60000) / 1000);
            timerBox.innerText = diff < 60000 ? `${s} Seconds...` : `${d} Days until ${eventName}`;
        }
    }, 1000);
}

// --- Music Binder Logic ---
function initSongs() {
    const r = ref(db, 'binderSongs');
    document.getElementById('addSongBtn').onclick = () => {
        const url = document.getElementById('songLinkInput').value;
        const line = document.getElementById('songLineInput').value;
        const note = document.getElementById('songNoteInput').value;
        
        const m = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        if(m) { 
            push(r, { 
                embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, 
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
        allSongs = []; 
        if(snap.val()) Object.entries(snap.val()).forEach(([k, v]) => allSongs.push({...v, id: k}));
        allSongs.sort((a,b) => a.timestamp - b.timestamp); 
        renderSongs();
    });
}

function renderSongs() {
    const d = document.getElementById('binder-pages-display'); 
    d.innerHTML = '';
    const perPage = 3; // 3 entries per page [cite: 6, 159, 201]
    const start = (currentPage-1) * perPage;
    
    allSongs.slice(start, start + perPage).forEach(s => {
        const div = document.createElement('div'); 
        div.className = 'song-entry';
        div.innerHTML = `
            <div class="del-btn-sleek" onclick="deleteSong('${s.id}')"><i class="fas fa-trash"></i></div>
            <iframe src="${s.embedUrl}" allow="encrypted-media"></iframe>
            <div class="song-info">
                <p class="note">${s.note || ''}</p>
                <p class="lyric">"${s.line || ''}"</p>
            </div>
        `;
        d.appendChild(div);
    });
    
    document.getElementById('pageNumber').innerText = currentPage;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = (start + perPage) >= allSongs.length;
}

document.getElementById('prevBtn').onclick = () => { if(currentPage > 1) { currentPage--; renderSongs(); } };
document.getElementById('nextBtn').onclick = () => { if(currentPage * 3 < allSongs.length) { currentPage++; renderSongs(); } };

window.deleteSong = (id) => remove(ref(db, `binderSongs/${id}`));

// --- Generic Helpers ---
function initNotes() {
    const r = ref(db, 'notes/currentNote');
    document.getElementById('saveNoteBtn').onclick = () => set(r, document.getElementById('noteInput').value);
    onValue(r, s => document.getElementById('latestNote').innerText = s.val() || "...");
}

function initBucket() {
    const r = ref(db, 'bucketList');
    document.getElementById('addBucketBtn').onclick = () => {
        const el = document.getElementById('bucketInput');
        if(el.value) push(r, { text: el.value }); el.value = '';
    };
    onValue(r, s => {
        const list = document.getElementById('bucketList'); list.innerHTML = '';
        if(s.val()) Object.entries(s.val()).forEach(([k, v]) => {
            const li = document.createElement('li'); 
            li.innerHTML = `<span>${v.text}</span> <i class="fas fa-trash" onclick="deleteBucket('${k}')"></i>`;
            list.appendChild(li);
        });
    });
}
window.deleteBucket = (id) => remove(ref(db, `bucketList/${id}`));

function startFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    document.body.style.background = "#1a1a2e"; 
    let particles = [];
    fireworksInterval = setInterval(() => {
        const x = Math.random() * canvas.width, y = Math.random() * canvas.height / 2;
        for(let i=0; i<40; i++) particles.push({x, y, dx:(Math.random()-0.5)*6, dy:(Math.random()-0.5)*6, alpha:1});
    }, 400);
    function animate() {
        requestAnimationFrame(animate);
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        particles.forEach((p,i) => {
            p.x+=p.dx; p.y+=p.dy; p.alpha-=0.02;
            ctx.fillStyle=`rgba(255,255,255,${p.alpha})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
            if(p.alpha<=0) particles.splice(i,1);
        });
    }
    animate();
}
