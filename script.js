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

let targetDate, eventName, allSongs = [], currentPage = 1, isSimulation = false;
let fireworksInterval;

initSettings();
initTimer();
initSongs();
startSnow();

function initSettings() {
    onValue(ref(db, 'vaultConfig'), (snap) => {
        const data = snap.val() || { eventName: "Christmas", date: "2025-12-25" };
        if(!isSimulation) {
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
        isSimulation = true;
        targetDate = new Date().getTime() + 10500; // 10s countdown
        document.getElementById('settings-modal').style.display = 'none';
        document.getElementById('vault-title').innerText = "Something is coming...";
    };
}

function initTimer() {
    const timerBox = document.getElementById('countdown-timer');
    const secretBox = document.getElementById('secret-message-box');
    const overlay = document.getElementById('suspense-overlay');

    setInterval(() => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        // 1. SUSPENSE PHASE (Final 10 Seconds)
        if (diff > 0 && diff <= 10000) {
            overlay.style.opacity = "1";
            timerBox.style.fontSize = "4rem";
            timerBox.style.color = "#ff4d6d";
            timerBox.innerText = Math.floor(diff / 1000);
        } 
        // 2. THE SECRET REVEAL (0 to 30 seconds after)
        else if (diff <= 0 && diff > -30000) {
            timerBox.style.display = 'none';
            secretBox.style.display = 'block';
            secretBox.className = 'secret-msg-style';
            secretBox.innerHTML = `Merry Christmas My Love! ❤️<br><span style="font-size:1.5rem">You are the music in my heart.</span>`;
            if(!fireworksInterval) startFireworks();
        }
        // 3. THE MERRY CHRISTMAS STATE (After 30 seconds)
        else if (diff <= -30000) {
            stopFireworks();
            overlay.style.opacity = "0";
            secretBox.style.display = 'none';
            timerBox.style.display = 'inline-block';
            timerBox.style.fontSize = "1.8rem";
            timerBox.innerHTML = "Merry Christmas! 🎄";
        }
        // 4. NORMAL COUNTDOWN
        else {
            const d = Math.floor(diff / 86400000);
            timerBox.innerText = `${d} Days until ${eventName}`;
        }
    }, 1000);
}

function initSongs() {
    const r = ref(db, 'binderSongs');
    document.getElementById('addSongBtn').onclick = () => {
        const url = document.getElementById('songLinkInput').value;
        const m = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        if(m) {
            push(r, {
                embed: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
                line: document.getElementById('songLineInput').value,
                note: document.getElementById('songNoteInput').value,
                timestamp: Date.now()
            });
            document.querySelectorAll('.binder-input-area input, .binder-input-area textarea').forEach(i => i.value = '');
        }
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
        const div = document.createElement('div'); div.className = 'handmade-card';
        div.innerHTML = `
            <div class="song-top-row">
                <div class="spotify-frame">
                    <iframe src="${s.embed}" width="100%" height="80" frameborder="0" allow="encrypted-media"></iframe>
                </div>
                <div class="handmade-note">${s.note}</div>
            </div>
            <div class="fav-line-box">" ${s.line} "</div>
            <button onclick="deleteSong('${s.id}')" style="background:none; border:none; color:#ccc; cursor:pointer; float:right;">Remove</button>
            <div style="clear:both;"></div>
        `;
        d.appendChild(div);
    });
}

function startFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    fireworksInterval = setInterval(() => { /* Standard logic here */ }, 500);
}

function startSnow() {
    const c = document.getElementById('snow-container');
    for(let i=0; i<40; i++) {
        const f = document.createElement('div'); f.className = 'snowflake'; f.innerHTML = '❄';
        f.style.left = Math.random()*100+'vw'; f.style.animation = `fall ${Math.random()*5+5}s linear infinite`;
        c.appendChild(f);
    }
}
window.deleteSong = (id) => remove(ref(db, `binderSongs/${id}`));
