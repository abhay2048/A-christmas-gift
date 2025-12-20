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

// --- SETTINGS SYNC ---
const configRef = ref(db, 'vaultConfig');
let targetDate;
let eventName;

onValue(configRef, (snapshot) => {
    const data = snapshot.val() || { eventName: "Christmas", date: "2025-12-25" };
    eventName = data.eventName;
    targetDate = new Date(data.date + "T00:00:00").getTime();
    document.getElementById('vault-title').innerText = `Our ${eventName} Wonderland`;
});

document.getElementById('save-settings-btn').onclick = () => {
    const newName = document.getElementById('event-name-input').value;
    const newDate = document.getElementById('event-date-input').value;
    if(newName && newDate) {
        set(configRef, { eventName: newName, date: newDate });
        alert("Vault Settings Updated! ✨");
        location.reload();
    }
};

window.addEventListener('app-unlocked', () => {
    startTimer();
    initApp();
});

function startTimer() {
    const timerBox = document.getElementById('countdown-timer');
    
    setInterval(() => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        if (diff < 0) {
            timerBox.innerHTML = "Merry Christmas my love, may your coming days be as pretty as snow! ✨❤️";
            timerBox.classList.add('intense');
            return;
        }

        if (diff < 10000) { // Under 10 seconds
            timerBox.innerText = s;
            timerBox.classList.add('intense');
        } else if (diff < 60000) { // Under 1 minute
            timerBox.innerText = `${s} Seconds Left!`;
            timerBox.style.color = "#ff85a2";
        } else if (diff < 3600000) { // Under 1 hour
            timerBox.innerText = `${m}m ${s}s Remaining`;
        } else if (d < 1) { // Under 1 day
            timerBox.innerText = `${h}h ${m}m Left`;
        } else {
            timerBox.innerText = `${d} Days until ${eventName}`;
        }
    }, 1000);
}

function initApp() {
    // NOTE logic
    const noteRef = ref(db, 'notes/currentNote');
    document.getElementById('saveNoteBtn').onclick = () => {
        const note = document.getElementById('noteInput').value;
        if(note.trim()) set(noteRef, note);
    };
    onValue(noteRef, snap => {
        document.getElementById('latestNote').innerText = snap.val() || "No notes yet...";
    });

    // BUCKET LIST logic (with Sleeker Deletes)
    const bucketRef = ref(db, 'bucketList');
    document.getElementById('addBucketBtn').onclick = () => {
        const input = document.getElementById('bucketInput');
        if(input.value) push(bucketRef, { text: input.value, done: false });
        input.value = '';
    };

    onValue(bucketRef, snap => {
        const list = document.getElementById('bucketList');
        list.innerHTML = '';
        if(snap.val()) {
            Object.entries(snap.val()).forEach(([key, item]) => {
                const li = document.createElement('li');
                li.className = item.done ? 'completed' : '';
                li.innerHTML = `
                    <div class="list-content"><span>${item.text}</span></div>
                    <button class="del-btn-sleek" onclick="deleteItem('${key}')"><i class="fas fa-times"></i></button>
                `;
                li.onclick = (e) => {
                    if(e.target.closest('.del-btn-sleek')) return;
                    update(ref(db, `bucketList/${key}`), { done: !item.done });
                };
                list.appendChild(li);
            });
        }
    });

    // MUSIC logic (QUEUE + NO SCROLL)
    const songsRef = ref(db, 'binderSongs');
    document.getElementById('addSongBtn').onclick = () => {
        const input = document.getElementById('songLinkInput');
        const match = input.value.match(/spotify\.com\/(track|album)\/([a-zA-Z0-9]+)/);
        if(match) {
            push(songsRef, { 
                embedUrl: `https://open.spotify.com/embed/$...{match[1]}/${match[2]}`,
                timestamp: Date.now() 
            });
            input.value = '';
        }
    };

    onValue(songsRef, snap => {
        const display = document.getElementById('binder-pages-display');
        display.innerHTML = '';
        const songs = [];
        if(snap.val()) {
            Object.entries(snap.val()).forEach(([key, s]) => songs.push({...s, id: key}));
            songs.sort((a,b) => a.timestamp - b.timestamp); // Queue
            songs.forEach(s => {
                const div = document.createElement('div');
                div.className = 'song-entry';
                div.innerHTML = `
                    <div class="song-card">
                        <div class="spotify-embed-container">
                            <iframe src="${s.embedUrl}" width="100%" height="80" frameBorder="0" allow="encrypted-media"></iframe>
                        </div>
                    </div>
                    <button class="del-btn-sleek" onclick="deleteSong('${s.id}')"><i class="fas fa-trash-alt"></i></button>
                `;
                display.appendChild(div);
            });
        }
    });

    // SNOW EFFECT
    setInterval(() => {
        const container = document.getElementById('snow-container');
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.innerHTML = '❄';
        flake.style.left = Math.random() * 100 + 'vw';
        flake.style.animationDuration = Math.random() * 3 + 3 + 's';
        flake.style.fontSize = Math.random() * 10 + 15 + 'px';
        container.appendChild(flake);
        setTimeout(() => flake.remove(), 5000);
    }, 200);
}

// Global window functions for icons to work
window.deleteItem = (id) => remove(ref(db, `bucketList/${id}`));
window.deleteSong = (id) => remove(ref(db, `binderSongs/${id}`));
