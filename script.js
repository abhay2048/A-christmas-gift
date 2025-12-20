import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// YOUR FIREBASE CONFIG
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

// VARS
const SONGS_PER_PAGE = 3;
let currentPage = 1;
let allSongs = [];

// WAIT FOR UNLOCK
window.addEventListener('app-unlocked', () => {
    initializeAppLogic();
});

function initializeAppLogic() {
    
    // 1. COUNTDOWN
    const targetDate = new Date("December 25, 2025 00:00:00").getTime();
    setInterval(() => {
        const now = new Date().getTime();
        const gap = targetDate - now;
        const d = Math.floor(gap / (1000 * 60 * 60 * 24));
        document.getElementById('countdown-timer').innerText = d > 0 ? `${d} Days to Christmas! 🎄` : "Merry Christmas! 🎁";
    }, 1000);

    // 2. NOTE STATION
    const noteRef = ref(db, 'notes/currentNote');
    document.getElementById('saveNoteBtn').addEventListener('click', () => {
        const note = document.getElementById('noteInput').value;
        if(note.trim()) set(noteRef, note);
    });
    onValue(noteRef, (snap) => {
        const val = snap.val();
        document.getElementById('latestNote').innerText = val || "Write a note...";
        if(val) document.getElementById('noteInput').value = val; // Sync textarea too
    });

    // 3. BUCKET LIST (Edit & Delete)
    const bucketRef = ref(db, 'bucketList');
    
    document.getElementById('addBucketBtn').addEventListener('click', () => {
        const input = document.getElementById('bucketInput');
        if(!input.value) return;
        push(bucketRef, { text: input.value, done: false });
        input.value = '';
    });

    onValue(bucketRef, (snapshot) => {
        const list = document.getElementById('bucketList');
        list.innerHTML = '';
        const data = snapshot.val();
        if (data) {
            Object.entries(data).forEach(([key, item]) => {
                const li = document.createElement('li');
                li.className = item.done ? 'completed' : '';
                
                li.innerHTML = `
                    <div class="list-content">
                        <span class="status-icon">${item.done ? '✅' : '⬜'}</span>
                        <span class="text">${item.text}</span>
                    </div>
                    <div class="actions">
                        <button class="action-btn edit-btn"><i class="fas fa-pencil-alt"></i></button>
                        <button class="action-btn del-btn"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                // Toggle Done
                li.querySelector('.list-content').addEventListener('click', () => {
                    update(ref(db, `bucketList/${key}`), { done: !item.done });
                });

                // Edit Item
                li.querySelector('.edit-btn').addEventListener('click', () => {
                    const newText = prompt("Edit adventure:", item.text);
                    if(newText) update(ref(db, `bucketList/${key}`), { text: newText });
                });

                // Delete Item
                li.querySelector('.del-btn').addEventListener('click', () => {
                    if(confirm("Remove this adventure?")) remove(ref(db, `bucketList/${key}`));
                });

                list.appendChild(li);
            });
        }
    });

    // 4. MUSIC BINDER (Queue Order + Delete)
    const songsRef = ref(db, 'binderSongs');

    document.getElementById('addSongBtn').addEventListener('click', () => {
        const input = document.getElementById('songLinkInput');
        const rawLink = input.value.trim();
        if (!rawLink) return;

        const match = rawLink.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
        if (!match) return alert("Invalid Spotify Link");
        
        const embedUrl = `https://open.spotify.com/embed/${match[1]}/${match[2]}`;

        push(songsRef, {
            embedUrl: embedUrl,
            favoriteLine: "",
            sideNote: "",
            timestamp: Date.now()
        });
        input.value = '';
    });

    onValue(songsRef, (snapshot) => {
        const data = snapshot.val();
        allSongs = [];
        if (data) {
            Object.entries(data).forEach(([key, song]) => {
                allSongs.push({ ...song, id: key });
            });
            // QUEUE ORDER: Oldest (smallest timestamp) First
            allSongs.sort((a, b) => a.timestamp - b.timestamp);
        }
        renderBinderPage();
    });

    // Snowfall
    setInterval(() => {
        const c = document.getElementById('snow-container');
        if(!c) return;
        const f = document.createElement('div');
        f.classList.add('snowflake');
        f.innerHTML = '❄';
        f.style.left = Math.random() * 100 + 'vw';
        f.style.fontSize = Math.random() * 10 + 10 + 'px';
        f.style.animationDuration = Math.random() * 3 + 2 + 's';
        c.appendChild(f);
        setTimeout(() => f.remove(), 5000);
    }, 300);
}

function renderBinderPage() {
    const display = document.getElementById('binder-pages-display');
    display.innerHTML = ''; 

    const start = (currentPage - 1) * SONGS_PER_PAGE;
    const end = Math.min(start + SONGS_PER_PAGE, allSongs.length);
    const pageSongs = allSongs.slice(start, end);

    if (allSongs.length === 0) {
        display.innerHTML = '<p style="text-align:center;">No songs yet...</p>';
    } else {
        pageSongs.forEach(song => {
            const div = document.createElement('div');
            div.className = 'song-entry';
            div.innerHTML = `
                <button class="delete-song-btn" title="Remove Song">×</button>
                <div class="song-card">
                    <iframe style="border-radius:12px" src="${song.embedUrl}" width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                    <div style="margin-top:10px;">
                        <label>♥ Favorite Line:</label>
                        <input type="text" class="fav-input" value="${song.favoriteLine}" style="width:90%; border:none; border-bottom:1px dotted #000;">
                    </div>
                </div>
                <div class="side-note-area">
                    <label>📝 Memory:</label>
                    <textarea class="note-input">${song.sideNote}</textarea>
                </div>
            `;

            // Delete Song Logic
            div.querySelector('.delete-song-btn').addEventListener('click', () => {
                if(confirm("Remove this song from our memory?")) {
                    remove(ref(db, `binderSongs/${song.id}`));
                }
            });

            // Save Inputs
            div.querySelector('.fav-input').addEventListener('change', (e) => 
                update(ref(db, `binderSongs/${song.id}`), { favoriteLine: e.target.value }));
            
            div.querySelector('.note-input').addEventListener('change', (e) => 
                update(ref(db, `binderSongs/${song.id}`), { sideNote: e.target.value }));

            display.appendChild(div);
        });
    }

    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = end >= allSongs.length;
}

document.getElementById('prevBtn').onclick = () => { currentPage--; renderBinderPage(); };
document.getElementById('nextBtn').onclick = () => { currentPage++; renderBinderPage(); };
