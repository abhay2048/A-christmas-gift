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

// 1. Theme Logic
const gift = document.getElementById('theme-toggle-gift');
gift.onclick = () => {
    const isXmas = document.body.classList.contains('christmas-theme');
    document.body.className = isXmas ? 'ny-theme' : 'christmas-theme';
    document.getElementById('dynamic-title').innerText = isXmas ? "Our Golden New Year" : "Our Winter Wonderland";
    gift.innerText = isXmas ? "🎆" : "🎁";
};

// 2. Login
document.getElementById('loginBtn').onclick = () => {
    if (document.getElementById('passwordInput').value.toUpperCase() === "MOON") {
        document.getElementById('login-screen').classList.add('hidden');
    }
};

// 3. New Year Cinema Experience
const starMessages = ["Handling me❤️", "Safe place🏠", "Late laughs🌙", "Choosing me✨", "Making me better🌸", "Simply you🥂"];

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
        star.style.cssText = `position:absolute; left:${Math.random()*90}%; top:${Math.random()*80}%; cursor:pointer; font-size:2rem;`;
        star.innerText = '⭐';
        star.onclick = () => {
            if (star.style.opacity === '0.5') return;
            star.style.opacity = '0.5';
            star.innerHTML = `<span style="font-size:1rem; background:gold; color:black; padding:5px; border-radius:5px;">${msg}</span>`;
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
        setTimeout(() => ffMonth.className = '', 400);
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
                    document.getElementById('midnight-message').classList.remove('hidden');
                    setTimeout(showLetter, 3000);
                }
            }, 1000);
        }
    }, 500);
}

function showLetter() {
    document.getElementById('countdown-stage').classList.add('hidden');
    document.getElementById('envelope-stage').classList.remove('hidden');
    const envelope = document.getElementById('main-envelope');
    const textTarget = document.getElementById('typewriter-text');
    const msg = "2025 was a dream because of you. Thank you for handling my moods and for loving me perfectly.\n\nI promise to hold you tighter in 2026. You are my forever gift. Happy New Year, my everything. ❤️";

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
                    setTimeout(() => { if(confirm("Back to Site?")) document.getElementById('ny-experience-overlay').classList.add('hidden'); }, 5000);
                }
            }, 70);
        }, 1500);
    };
}

// 4. Original App Logic
onValue(ref(db, 'notes/currentNote'), (s) => document.getElementById('latestNote').innerText = s.val() || "No notes...");
document.getElementById('saveNoteBtn').onclick = () => {
    const inp = document.getElementById('noteInput');
    if (inp.value.trim()) set(ref(db, 'notes/currentNote'), inp.value);
    inp.value = '';
};

onValue(ref(db, 'bucketList'), (snap) => {
    const list = document.getElementById('bucketList');
    list.innerHTML = '';
    const data = snap.val();
    if (data) Object.entries(data).forEach(([key, item]) => {
        const li = document.createElement('li');
        li.className = item.done ? 'done' : '';
        li.innerHTML = `<span>${item.text}</span><button>❄️</button>`;
        li.onclick = () => update(ref(db, `bucketList/${key}`), { done: !item.done });
        list.appendChild(li);
    });
});

let allSongs = [], currentPage = 1;
onValue(ref(db, 'binderSongs'), snap => {
    const data = snap.val();
    allSongs = data ? Object.entries(data).map(([id, s]) => ({...s, id})) : [];
    renderBinder();
});

function renderBinder() {
    const display = document.getElementById('binder-pages-display');
    display.innerHTML = '';
    allSongs.slice((currentPage-1)*2, currentPage*2).forEach(song => {
        const div = document.createElement('div');
        div.className = 'song-entry';
        div.innerHTML = `<div class="music-box"><iframe src="${song.embedUrl}" width="100%" height="100%" frameBorder="0"></iframe></div>
                         <textarea>${song.sideNote || ''}</textarea>`;
        display.appendChild(div);
    });
}

setInterval(() => {
    const container = document.getElementById('snow-container');
    const flake = document.createElement('div');
    flake.innerHTML = document.body.classList.contains('ny-theme') ? '✨' : '❄️';
    flake.style.cssText = `position:fixed; top:-10%; left:${Math.random()*100}vw; animation: fall ${Math.random()*4+5}s linear forwards; font-size:20px; z-index:1;`;
    container.appendChild(flake);
    setTimeout(() => flake.remove(), 7000);
}, 300);
