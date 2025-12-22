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

let targetDate, allSongs = [], currentPage = 1, isSimulation = false;
let fireworksInterval;

// Initialize all features
initSettings();
initTimer();
initNotes();
initSongs();
startSnow();

function initSettings() {
    onValue(ref(db, 'vaultConfig'), (snap) => {
        const data = snap.val() || { eventName: "Christmas", date: "2025-12-25" };
        if(!isSimulation) {
            targetDate = new Date(data.date + "T00:00:00").getTime();
            document.getElementById('vault-title').innerText = `Our ${data.eventName}`;
        }
    });

    document.getElementById('simulate-btn').onclick = () => {
        isSimulation = true;
        targetDate = new Date().getTime() + 10000; // Force 10 second countdown
        document.getElementById('settings-modal').style.display = 'none';
    };
}

function initTimer() {
    const timerBox = document.getElementById('countdown-timer');
    const secretBox = document.getElementById('secret-message-box');
    const overlay = document.getElementById('suspense-overlay');

    setInterval(() => {
        const diff = targetDate - new Date().getTime();

        // SUSPENSE PHASE (10 seconds before 0)
        if (diff > 0 && diff < 10000) {
            overlay.style.opacity = "0.8"; // Start darkening the screen prettily
            timerBox.style.color = "white";
            timerBox.style.fontSize = "3rem";
            timerBox.innerText = Math.floor(diff / 1000);
        } 
        // THE MESSAGE REVEAL (Hits 0)
        else if (diff <= 0 && diff > -15000) { // Shows for 15 seconds
            overlay.style.opacity = "1";
            timerBox.style.display = "none";
            secretBox.style.display = "block";
            secretBox.className = "secret-msg-style fancy-title";
            secretBox.innerHTML = `Happy Christmas My Love! ❤️<br><span style="font-size:1.2rem; font-family:'Quicksand'">You are my greatest gift.</span>`;
            if(!fireworksInterval) startFireworks();
        } 
        // NORMAL STATE
        else if (diff <= -15000) {
            overlay.style.opacity = "0";
            secretBox.style.display = "none";
            timerBox.style.display = "block";
            timerBox.innerText = "Merry Christmas! 🎄";
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
                time: Date.now()
            });
            document.querySelectorAll('.input-stack input, .input-stack textarea').forEach(i => i.value = '');
        }
    };
    onValue(r, snap => {
        allSongs = []; if(snap.val()) Object.entries(snap.val()).forEach(([k, v]) => allSongs.push({...v, id: k}));
        renderSongs();
    });
}

function renderSongs() {
    const container = document.getElementById('binder-pages-display');
    container.innerHTML = '';
    const start = (currentPage-1)*4;
    allSongs.slice(start, start + 4).forEach(s => {
        const div = document.createElement('div');
        div.className = 'handmade-card';
        div.innerHTML = `
            <div class="del-btn-sleek" onclick="deleteSong('${s.id}')"><i class="fas fa-trash"></i></div>
            <iframe src="${s.embed}" width="100%" height="80" frameborder="0" allow="encrypted-media"></iframe>
            <p class="fav-line-display">"${s.line}"</p>
            <p class="song-note-display">${s.note}</p>
        `;
        container.appendChild(div);
    });
}

// Fireworks & Snow Helper Functions
function startFireworks() {
    const canvas = document.getElementById('fireworksCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let particles = [];
    fireworksInterval = setInterval(() => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height / 2;
        for(let i=0; i<30; i++) particles.push({x, y, dx: (Math.random()-0.5)*5, dy: (Math.random()-0.5)*5, a: 1});
    }, 500);
    function animate() {
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        particles.forEach((p, i) => {
            p.x += p.dx; p.y += p.dy; p.a -= 0.02;
            ctx.fillStyle = `rgba(255,255,255,${p.a})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
            if(p.a <= 0) particles.splice(i, 1);
        });
        requestAnimationFrame(animate);
    }
    animate();
}

function startSnow() {
    const container = document.getElementById('snow-container');
    for(let i=0; i<30; i++) {
        const s = document.createElement('div'); s.className = 'snowflake'; s.innerHTML = '❄';
        s.style.cssText = `position:absolute; left:${Math.random()*100}vw; top:-5vh; color:white; font-size:${Math.random()*10+10}px; animation: fall ${Math.random()*5+5}s linear infinite;`;
        container.appendChild(s);
    }
}

window.deleteSong = (id) => remove(ref(db, `binderSongs/${id}`));
