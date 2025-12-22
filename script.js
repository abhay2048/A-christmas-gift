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

let targetDate, eventName, allSongs = [], currentPage = 1;
let simulationMode = false; // Flag for preview mode

// --- INITIALIZE ---
initSettings();
initTimer();
initNotes();
initBucket();
initSongs();
startSnow();

function initSettings() {
    const configRef = ref(db, 'vaultConfig');
    onValue(configRef, (snap) => {
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
        if(name && date) {
            set(configRef, { eventName: name, date: date });
            alert("Settings Saved!");
            location.reload();
        }
    };

    // --- THE "PREVIEW SURPRISE" BUTTON LOGIC ---
    document.getElementById('simulate-btn').onclick = () => {
        simulationMode = true;
        targetDate = new Date().getTime() + 12000; // Set timer to 12 seconds from now
        eventName = "Christmas (Preview)";
        document.getElementById('vault-title').innerText = `Wait for it...`;
        document.getElementById('settings-modal').style.display = 'none'; // Close modal
    };
}

function initTimer() {
    const box = document.getElementById('countdown-timer');
    
    setInterval(() => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        // THE FINAL MESSAGE
        if (diff <= 0) {
            box.innerHTML = "Merry Christmas my love! May your coming days be as pretty as snow! ✨❤️";
            box.classList.add('intense');
            document.getElementById('vault-title').innerText = `It's Finally Here!`;
            return;
        }

        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        if (diff < 10000) { // Final 10 seconds
            box.innerText = s;
            box.classList.add('intense');
            box.style.color = "#ff4757";
        } else if (diff < 60000) { 
            box.innerText = `${s} Seconds Left!`;
            box.classList.remove('intense');
        } else if (diff < 3600000) { 
            box.innerText = `${m}m ${s}s Remaining`;
        } else if (d < 1) { 
            box.innerText = `${h} Hours Left`;
        } else {
            box.innerText = `${d} Days until ${eventName}`;
        }
    }, 1000);
}

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
            const li = document.createElement('li'); li.className = v.done ? 'completed' : '';
            // New Sleek Delete Button
            li.innerHTML = `<span>${v.text}</span> <div class="del-btn-sleek" onclick="deleteItem('${k}')"><i class="fas fa-trash"></i></div>`;
            li.onclick = (e) => { if(!e.target.closest('.del-btn-sleek')) update(ref(db, `bucketList/${k}`), {done: !v.done}); };
            list.appendChild(li);
        });
    });
}

function initSongs() {
    const r = ref(db, 'binderSongs');
    document.getElementById('addSongBtn').onclick = () => {
        const url = document.getElementById('songLinkInput').value;
        const m = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        if(m) { 
            push(r, { embedUrl: `https://open.spotify.com/embed/$...{m[1]}/${m[2]}`, timestamp: Date.now() }); 
            document.getElementById('songLinkInput').value = ''; 
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
    const d = document.getElementById('binder-pages-display'); d.innerHTML = '';
    const start = (currentPage-1)*3;
    allSongs.slice(start, start + 3).forEach(s => {
        const div = document.createElement('div'); div.className = 'song-entry';
        // New Sleek Delete Button
        div.innerHTML = `<div class="song-card"><iframe src="${s.embedUrl}" width="100%" height="80" allow="encrypted-media"></iframe></div>
                         <div class="del-btn-sleek" onclick="deleteSong('${s.id}')"><i class="fas fa-trash"></i></div>`;
        d.appendChild(div);
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = (start + 3) >= allSongs.length;
}

document.getElementById('prevBtn').onclick = () => { currentPage--; renderSongs(); };
document.getElementById('nextBtn').onclick = () => { currentPage++; renderSongs(); };

function startSnow() {
    const c = document.getElementById('snow-container');
    c.innerHTML = '';
    for(let i=0; i<35; i++) {
        const f = document.createElement('div'); f.className = 'snowflake'; f.innerHTML = '❄';
        f.style.left = Math.random()*100+'vw'; f.style.top = -Math.random()*100+'vh';
        f.style.fontSize = Math.random()*15+10+'px';
        f.style.animation = `fall ${Math.random()*5+5}s linear infinite`;
        c.appendChild(f);
    }
}

window.deleteItem = (id) => remove(ref(db, `bucketList/${id}`));
window.deleteSong = (id) => remove(ref(db, `binderSongs/${id}`));
