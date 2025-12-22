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

let allSongs = [], currentPage = 1;

initNotes();
initSongs();
// (Include your initTimer and startSnow functions here as they were)

function initNotes() {
    const r = ref(db, 'notes/currentNote');
    document.getElementById('saveNoteBtn').onclick = () => set(r, document.getElementById('noteInput').value);
    onValue(r, s => document.getElementById('latestNote').innerText = s.val() || "...");
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
                lyric: lyric,
                note: note,
                timestamp: Date.now() 
            }); 
            document.getElementById('songLinkInput').value = '';
            document.getElementById('songLyricInput').value = '';
            document.getElementById('songNoteInput').value = '';
        }
    };

    onValue(r, snap => {
        allSongs = []; 
        if(snap.val()) Object.entries(snap.val()).forEach(([k, v]) => allSongs.push({...v, id: k}));
        allSongs.reverse(); // Newest first
        renderSongs();
    });
}

function renderSongs() {
    const d = document.getElementById('binder-pages-display'); 
    d.innerHTML = '';
    const start = (currentPage-1)*3;
    
    allSongs.slice(start, start + 3).forEach((s, index) => {
        const div = document.createElement('div'); 
        div.className = 'song-entry';
        
        // Handmade feel: Alternate tilts
        const rotation = index % 2 === 0 ? 'rotate(2deg)' : 'rotate(-2deg)';
        
        div.innerHTML = `
            <div class="song-card" style="transform: ${rotation}">
                <iframe src="${s.embedUrl}" allow="encrypted-media"></iframe>
            </div>
            <div class="song-info-overlay">
                <p class="song-lyric-snippet">"${s.lyric || 'A beautiful melody...'}"</p>
                <p class="song-note">${s.note || ''}</p>
                <button onclick="window.deleteSong('${s.id}')" style="background:none; border:none; color:#ccc; cursor:pointer; margin-top:5px;"><i class="fas fa-trash"></i></button>
            </div>
        `;
        d.appendChild(div);
    });

    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = (start + 3) >= allSongs.length;
}

window.deleteSong = (id) => { if(confirm("Remove this memory?")) remove(ref(db, `binderSongs/${id}`)); };
document.getElementById('prevBtn').onclick = () => { currentPage--; renderSongs(); };
document.getElementById('nextBtn').onclick = () => { currentPage++; renderSongs(); };
