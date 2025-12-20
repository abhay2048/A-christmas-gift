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

let targetDate;
let eventName;

// --- SETTINGS SYNC ---
const configRef = ref(db, 'vaultConfig');
onValue(configRef, (snapshot) => {
    const data = snapshot.val() || { eventName: "Christmas", date: "2025-12-25" };
    eventName = data.eventName;
    targetDate = new Date(data.date + "T00:00:00").getTime();
    document.getElementById('vault-title').innerText = `Our ${eventName} Wonderland`;
    document.getElementById('event-name-input').value = eventName;
    document.getElementById('event-date-input').value = data.date;
});

document.getElementById('save-settings-btn').onclick = () => {
    const name = document.getElementById('event-name-input').value;
    const date = document.getElementById('event-date-input').value;
    if(name && date) {
        set(configRef, { eventName: name, date: date });
        toggleSettings();
    }
};

// --- APP LOGIC ---
window.addEventListener('app-unlocked', () => {
    initApp();
});

function initApp() {
    // 1. TIMER
    const timerBox = document.getElementById('countdown-timer');
    setInterval(() => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff <= 0) {
            timerBox.innerHTML = "Merry Christmas my love, may your coming days be as pretty as snow! ✨❤️";
            timerBox.classList.add('intense');
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        if (diff < 10000) { 
            timerBox.innerText = s;
            timerBox.classList.add('intense');
        } else if (diff < 60000) { 
            timerBox.innerText = `${s} Seconds Left!`;
        } else if (diff < 3600000) { 
            timerBox.innerText = `${m}m ${s}s Remaining`;
        } else if (d < 1) { 
            timerBox.innerText = `${h} Hours Left`;
        } else {
            timerBox.innerText = `${d} Days until ${eventName}`;
        }
    }, 1000);

    // 2. NOTES
    const noteRef = ref(db, 'notes/currentNote');
    document.getElementById('saveNoteBtn').onclick = () => {
        const val = document.getElementById('noteInput').value;
        if(val.trim()) set(noteRef, val);
    };
    onValue(noteRef, s => { document.getElementById('latestNote').innerText = s.val() || "No notes yet..."; });

    // 3. BUCKET LIST
    const bucketRef = ref(db, 'bucketList');
    document.getElementById('addBucketBtn').onclick = () => {
        const el = document.getElementById('bucketInput');
        if(el.value) push(bucketRef, { text: el.value, done: false });
        el.value = '';
    };
    onValue(bucketRef, s => {
        const list = document.getElementById('bucketList');
        list.innerHTML = '';
        if(s.val()) {
            Object.entries(s.val()).forEach(([key, val]) => {
                const li = document.createElement('li');
                li.className = val.done ? 'completed' : '';
                li.innerHTML = `<span>${val.text}</span> <i class="fas fa-times del-btn-sleek" onclick="deleteItem('${key}')"></i>`;
                li.onclick = (e) => { if(e.target.tagName !== 'I') update(ref(db, `bucketList/${key}`), {done: !val.done}); };
                list.appendChild(li);
            });
        }
    });

    // 4. SONGS (FIXED LINK LOGIC)
    const songsRef = ref(db, 'binderSongs');
    document.getElementById('addSongBtn').onclick = () => {
        const input = document.getElementById('songLinkInput');
        const url = input.value;
        // This regex extracts the ID correctly
        const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        
        if(match) {
            const embedUrl = `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
            push(songsRef, { embedUrl, timestamp: Date.now() });
            input.value = '';
        } else {
            alert("Please paste a valid Spotify link!");
        }
    };

    onValue(songsRef, snap => {
        const display = document.getElementById('binder-pages-display');
        display.innerHTML = '';
        const songs = [];
        if(snap.val()) {
            Object.entries(snap.val()).forEach(([k, v]) => songs.push({...v, id: k}));
            songs.sort((a,b) => a.timestamp - b.timestamp);
            songs.forEach(s => {
                const div = document.createElement('div');
                div.className = 'song-entry';
                div.innerHTML = `
                    <div class="song-card">
                        <iframe src="${s.embedUrl}" width="100%" height="80" frameBorder="0" allow="encrypted-media"></iframe>
                    </div>
                    <i class="fas fa-trash del-btn-sleek" onclick="deleteSong('${s.id}')"></i>
                `;
                display.appendChild(div);
            });
        }
    });

    // 5. SNOW
    setInterval(() => {
        const container = document.getElementById('snow-container');
        if(!container) return;
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.innerHTML = '❄';
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.animationDuration = Math.random() * 3 + 3 + 's';
        flake.style.opacity = Math.random() * 0.5 + 0.5;
        container.appendChild(flake);
        setTimeout(() => flake.remove(), 5000);
    }, 250);
}

window.deleteItem = (id) => remove(ref(db, `bucketList/${id}`));
window.deleteSong = (id) => remove(ref(db, `binderSongs/${id}`));
