import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDau2bGEVfZZIZtdEInGjTlQA7jSs0ndGU",
    authDomain: "a-christmas-gift.firebaseapp.com",
    databaseURL: "https://a-christmas-gift-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "a-christmas-gift",
    storageBucket: "a-christmas-gift.firebasestorage.app",
    appId: "1:560215769128:web:331327bdc0417b4056351d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// FIX: Global definition of body so it works everywhere
const body = document.body;

// --- 1. THEME TOGGLE ---
const gift = document.getElementById('theme-toggle-gift');
gift.onclick = () => {
    const isXmas = body.classList.contains('christmas-theme');
    body.className = isXmas ? 'ny-theme' : 'christmas-theme';
    document.getElementById('dynamic-title').innerText = isXmas ? "Our Golden New Year" : "Our Winter Wonderland";
    gift.innerText = isXmas ? "🎆" : "🎁";
};

// --- 2. LOGIN ---
document.getElementById('loginBtn').onclick = () => {
    if (document.getElementById('passwordInput').value.toUpperCase() === "MOON") {
        document.getElementById('login-screen').classList.add('hidden');
    } else alert("Incorrect word, my love. ❤️");
};

// --- 3. PREMIUM NEW YEAR JOURNEY ---
const starMessages = ["Handling me❤️", "My safe place🏠", "Late night laughs🌙", "Choosing me✨", "Making me better🌸", "Simply being you🥂"];

document.getElementById('mem-newyear').onclick = () => {
    document.getElementById('ny-experience-overlay').classList.remove('hidden');
    startStarStage();
};

function startStarStage() {
    const field = document.getElementById('star-field');
    field.innerHTML = '';
    let found = 0;
    starMessages.forEach(msg => {
        const star = document.createElement('div');
        star.className = 'drifting-star';
        star.style.cssText = `position:absolute; left:${Math.random()*90}%; top:${Math.random()*80}%; cursor:pointer; font-size:2.5rem;`;
        star.innerText = '⭐';
        
        star.onclick = () => {
            if (star.classList.contains('found')) return;
            star.classList.add('found');
            star.style.opacity = '0.5';
            star.innerHTML = `<span style="font-size:1.2rem; background:gold; color:black; padding:8px; border-radius:12px; font-family:'Indie Flower';">${msg}</span>`;
            found++;
            document.querySelector('.star-count-hint').innerText = `Drifting memories: (${found}/6)`;
            if (found === 6) setTimeout(startTimeMachine, 2000);
        };
        field.appendChild(star);
    });
}

function startTimeMachine() {
    document.getElementById('star-stage').classList.add('hidden');
    document.getElementById('countdown-stage').classList.remove('hidden');
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    let m = 0;
    const ffMonth = document.getElementById('ff-month');
    const clock = document.getElementById('digital-clock');

    let interval = setInterval(() => {
        ffMonth.innerText = months[m];
        ffMonth.className = 'month-zoom';
        setTimeout(() => ffMonth.className = '', 350);
        m++;
        if (m >= months.length) {
            clearInterval(interval);
            let sec = 55;
            let timer = setInterval(() => {
                sec++;
                if (sec < 60) clock.innerText = `11:59:${sec.toString().padStart(2, '0')}`;
                else {
                    clearInterval(timer);
                    clock.innerText = "12:00:00";
                    clock.className = 'midnight-strike';
                    document.getElementById('ff-year').innerText = "2026";
                    document.getElementById('midnight-message').classList.remove('hidden');
                    setTimeout(showLetter, 3000);
                }
            }, 1000);
        }
    }, 450);
}

function showLetter() {
    document.getElementById('countdown-stage').classList.add('hidden');
    document.getElementById('envelope-stage').classList.remove('hidden');
    const envelope = document.getElementById('main-envelope');
    const textTarget = document.getElementById('typewriter-text');
    const msg = "2025 was a dream because of you. Thank you for handling my moods, for being my peace, and for loving me so perfectly.\n\nAs the clock strikes 12, I promise to hold you tighter in 2026. You are my forever gift. Happy New Year, my everything. ❤️";

    envelope.onclick = () => {
        if (envelope.classList.contains('open')) return;
        envelope.classList.add('open');
        
        setTimeout(() => {
            let i = 0;
            let typing = setInterval(() => {
                textTarget.innerText += msg[i];
                i++;
                if (i >= msg.length) {
                    clearInterval(typing);
                    setTimeout(() => {
                        if(confirm("Exit Journey?")) document.getElementById('ny-experience-overlay').classList.add('hidden');
                    }, 5000);
                }
            }, 70);
        }, 1500);
    };
}

// --- 4. FIREBASE CRUD & UI SYNC ---
onValue(ref(db, 'notes/currentNote'), (s) => document.getElementById('latestNote').innerText = s.val() || "No notes...");
document.getElementById('saveNoteBtn').onclick = () => {
    const inp = document.getElementById('noteInput');
    if (inp.value.trim()) set(ref(db, 'notes/currentNote'), inp.value);
    inp.value = '';
};

onValue(ref(db, 'bucketList'), (snap) => {
    const list = document.getElementById('bucketList'); list.innerHTML = '';
    const data = snap.val();
    if (data) Object.entries(data).forEach(([key, item]) => {
        const li = document.createElement('li');
        li.className = item.done ? 'done' : '';
        li.innerHTML = `<div class="item-text"><span>${item.done?'✅':'🌟'}</span><span>${item.text}</span></div><button class="del-btn">❄️</button>`;
        li.querySelector('.item-text').onclick = () => update(ref(db, `bucketList/${key}`), { done: !item.done });
        li.querySelector('.del-btn').onclick = () => remove(ref(db, `bucketList/${key}`));
        list.appendChild(li);
    });
});

let allSongs = [], currentPage = 1;
onValue(ref(db, 'binderSongs'), snap => {
    const data = snap.val();
    allSongs = data ? Object.entries(data).map(([id, s]) => ({...id, ...s, id})).sort((a,b)=>b.timestamp-a.timestamp) : [];
    renderBinder();
});

function renderBinder() {
    const display = document.getElementById('binder-pages-display'); display.innerHTML = '';
    allSongs.slice((currentPage-1)*3, currentPage*3).forEach(song => {
        const div = document.createElement('div'); div.className = 'song-entry';
        div.innerHTML = `
            <div class="song-memory"><h3>Memory</h3><textarea class="side-note">${song.sideNote||""}</textarea></div>
            <div class="song-visual-stack">
                <button class="del-song">×</button>
                <div class="music-box"><iframe src="${song.embedUrl}" width="100%" height="100%" frameBorder="0" allow="encrypted-media"></iframe></div>
                <div class="favorite-line-box"><input type="text" class="fav-line" value="${song.favLine||""}" placeholder="♥ Lyric..."></div>
            </div>`;
        div.querySelector('.fav-line').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {favLine: e.target.value});
        div.querySelector('.side-note').onchange = (e) => update(ref(db, `binderSongs/${song.id}`), {sideNote: e.target.value});
        div.querySelector('.del-song').onclick = () => remove(ref(db, `binderSongs/${song.id}`));
        display.appendChild(div);
    });
    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
}

document.getElementById('addSongBtn').onclick = () => {
    const val = document.getElementById('songLinkInput').value;
    const match = val.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (match) push(ref(db, 'binderSongs'), { embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}`, timestamp: Date.now() });
    document.getElementById('songLinkInput').value = '';
};
document.getElementById('prevBtn').onclick = () => { if(currentPage > 1) { currentPage--; renderBinder(); } };
document.getElementById('nextBtn').onclick = () => { if(currentPage * 3 < allSongs.length) { currentPage++; renderBinder(); } };
document.getElementById('mem-christmas').onclick = () => document.getElementById('reveal-overlay').classList.remove('hidden');
document.querySelector('.close-reveal-btn').onclick = () => document.getElementById('reveal-overlay').classList.add('hidden');

// SNOW FIX
setInterval(() => {
    const container = document.getElementById('snow-container');
    const flake = document.createElement('div');
    flake.innerHTML = body.classList.contains('ny-theme') ? '✨' : '❄️';
    flake.style.cssText = `position:fixed; top:-10%; left:${Math.random()*100}vw; animation: fall ${Math.random()*4+5}s linear forwards; font-size:20px; z-index:1; pointer-events:none;`;
    container.appendChild(flake);
    setTimeout(() => flake.remove(), 7000);
}, 300);

// TIMER
setInterval(() => {
    const gap = new Date("Dec 25, 2025").getTime() - new Date().getTime();
    const d = Math.max(0, Math.floor(gap / 86400000)), h = Math.max(0, Math.floor((gap % 86400000) / 3600000)), m = Math.max(0, Math.floor((gap % 3600000) / 60000)), s = Math.max(0, Math.floor((gap % 60000) / 1000));
    document.getElementById('countdown-timer').innerText = gap > 0 ? `${d}d : ${h}h : ${m}m : ${s}s` : "Merry Christmas! ❤️";
}, 1000);
