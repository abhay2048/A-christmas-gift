import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// --- INIT FUNCTIONS ---
initSettings();
initTimer();
initNotes();
initSongs();
startSnow();

function initSettings() {
    onValue(ref(db, 'vaultConfig'), (snap) => {
        const data = snap.val() || { eventName: "Christmas", date: "2025-12-25" };
        eventName = data.eventName;
        targetDate = new Date(data.date + "T00:00:00").getTime();
        document.getElementById('vault-title').innerText = `Our ${eventName} Wonderland`;
    });
}

function initTimer() {
    setInterval(() => {
        const diff = targetDate - new Date().getTime();
        const box = document.getElementById('countdown-timer');
        if (diff <= 0) { box.innerText = "✨ The Surprise is Here!"; return; }
        const days = Math.floor(diff / 86400000);
        box.innerText = `${days} Days until ${eventName}`;
    }, 1000);
}

function initNotes() {
    const r = ref(db, 'notes/currentNote');
    document.getElementById('saveNoteBtn').onclick = () => set(r, document.getElementById('noteInput').value);
    onValue(r, (s) => document.getElementById('latestNote').innerText = s.val() || "No notes yet...");
}

function initSongs() {
    const r = ref(db, 'binderSongs');
    document.getElementById('addSongBtn').onclick = () => {
        const url = document.getElementById('songLinkInput').value;
        const lyric = document.getElementById('songLyricInput').value;
        const note = document.getElementById('songNoteInput').value;
        const m = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        
        if(m) {
            push(r, { 
                embedUrl: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, 
                lyric, note, timestamp: Date.now() 
            });
            document.getElementById('songLinkInput').value = '';
            document.getElementById('songLyricInput').value = '';
            document.getElementById('songNoteInput').value = '';
        }
    };

    onValue(r, snap => {
        allSongs = [];
        if(snap.val()) Object.entries(snap.val()).forEach(([k, v]) => allSongs.push({...v, id: k}));
        allSongs.reverse();
        renderSongs();
    });
}

function renderSongs() {
    const d = document.getElementById('binder-pages-display'); d.innerHTML = '';
    const start = (currentPage-1)*3;
    
    allSongs.slice(start, start + 3).forEach((s, i) => {
        const tilt = i % 2 === 0 ? 'rotate(3deg)' : 'rotate(-3deg)';
        const div = document.createElement('div');
        div.className = 'song-entry';
        div.innerHTML = `
            <div class="song-card" style="transform: ${tilt}">
                <iframe src="${s.embedUrl}" allow="encrypted-media"></iframe>
            </div>
            <div class="song-info-overlay">
                <p class="song-lyric-snippet">"${s.lyric || 'Our Song'}"</p>
                <p>${s.note || ''}</p>
                <button onclick="window.delSong('${s.id}')" style="background:none; border:none; color:#ddd; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>
        `;
        d.appendChild(div);
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = (start+3) >= allSongs.length;
}

window.delSong = (id) => remove(ref(db, `binderSongs/${id}`));
document.getElementById('prevBtn').onclick = () => { currentPage--; renderSongs(); };
document.getElementById('nextBtn').onclick = () => { currentPage++; renderSongs(); };

function startSnow() {
    const c = document.getElementById('snow-container');
    for(let i=0; i<30; i++) {
        const f = document.createElement('div'); f.className = 'snowflake'; f.innerHTML = '❄';
        f.style.cssText = `position:absolute; color:white; left:${Math.random()*100}vw; top:-10px; animation: fall ${Math.random()*5+5}s linear infinite;`;
        c.appendChild(f);
    }
}
