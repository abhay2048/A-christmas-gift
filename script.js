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

let targetDate, eventName, simulationMode = false;

// --- INITIALIZE ALL FEATURES ---
initSettings();
initTimer();
initNotes();
initBucket();
initBinder();
startSnow();

function initSettings() {
    onValue(ref(db, 'vaultConfig'), (snap) => {
        const data = snap.val() || { eventName: "Christmas", date: "2025-12-25" };
        if(!simulationMode) {
            eventName = data.eventName;
            targetDate = new Date(data.date + "T00:00:00").getTime();
            document.getElementById('vault-title').innerText = `Our ${eventName} Wonderland`;
        }
    });
}

function initTimer() {
    const box = document.getElementById('countdown-timer');
    setInterval(() => {
        const diff = targetDate - new Date().getTime();
        if (diff <= 0) {
            box.innerHTML = `✨ Merry Christmas!`;
            startFireworks();
            return;
        }
        const d = Math.floor(diff / 86400000), s = Math.floor((diff % 60000) / 1000);
        box.innerText = d > 0 ? `${d} Days until ${eventName}` : `${s} Seconds...`;
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
        if(el.value) push(r, { text: el.value }); el.value = '';
    };
    onValue(r, s => {
        const list = document.getElementById('bucketList'); list.innerHTML = '';
        if(s.val()) Object.entries(s.val()).forEach(([k, v]) => {
            const li = document.createElement('li'); li.innerHTML = `<span>${v.text}</span> <button onclick="deleteItem('${k}')">X</button>`;
            list.appendChild(li);
        });
    });
}

// --- NEW SCRAPBOOK BINDER LOGIC ---
function initBinder() {
    const r = ref(db, 'binderSongs');
    const addBtn = document.getElementById('binder-add-btn');

    addBtn.onclick = async () => {
        const url = document.getElementById('binder-spotify-url').value;
        const lyric = document.getElementById('binder-lyric').value;
        const side = document.getElementById('binder-page-select').value;
        if(!url) return;

        // Simplified: push metadata directly to Firebase
        push(r, { url, lyric, side, timestamp: Date.now() });
        document.getElementById('binder-spotify-url').value = '';
        document.getElementById('binder-lyric').value = '';
    };

    onValue(r, snap => {
        document.getElementById('left-page-content').innerHTML = '';
        document.getElementById('right-page-content').innerHTML = '';
        if(snap.val()) {
            Object.entries(snap.val()).forEach(([id, song]) => {
                const card = document.createElement('div');
                card.className = 'song-square';
                card.style.background = 'linear-gradient(135deg, #ffdbe8, #f7dff0)';
                card.innerHTML = `
                    <div class="song-thumb" style="background-color:#ccc;"></div>
                    <div class="song-meta">
                        <span class="song-title">Song Card</span>
                        ${song.lyric ? `<span class="song-lyric">"${song.lyric}"</span>` : ''}
                    </div>
                `;
                const target = song.side === 'left' ? 'left-page-content' : 'right-page-content';
                document.getElementById(target).appendChild(card);
            });
        }
    });
}

function startSnow() {
    const c = document.getElementById('snow-container');
    for(let i=0; i<30; i++) {
        const f = document.createElement('div'); f.className = 'snowflake'; f.innerHTML = '❄';
        f.style.left = Math.random()*100+'vw';
        f.style.animation = `fall ${Math.random()*5+5}s linear infinite`; c.appendChild(f);
    }
}

window.deleteItem = (id) => remove(ref(db, `bucketList/${id}`));
