// ... [KEEP YOUR FIREBASE CONFIG AT THE TOP] ...

let allSongs = [];
let currentPage = 1;

// --- TIMER & 10s DELAY LOGIC ---
function initTimer() {
    const timerBox = document.getElementById('countdown-timer');
    const secretBox = document.getElementById('secret-message-box');
    let messageTriggered = false;

    setInterval(() => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        if (diff <= 0) {
            timerBox.innerText = "The Wait is Over! ❤️";
            
            if (!messageTriggered) {
                messageTriggered = true;
                // Wait 10 seconds before showing secret message
                setTimeout(() => {
                    timerBox.style.display = 'none';
                    secretBox.classList.add('reveal');
                    secretBox.innerHTML = `✨ Merry Christmas My Love! ✨<br><span style="font-size:1.5rem">I love you!</span>`;
                    startFireworks();
                }, 10000);
            }
        } else {
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            timerBox.innerText = `${d} Days Remaining`;
        }
    }, 1000);
}

// --- RENDER 3 SONGS PER PAGE ---
function renderSongs() {
    const display = document.getElementById('binder-pages-display');
    display.innerHTML = '';
    
    const start = (currentPage - 1) * 3;
    const end = start + 3;
    
    allSongs.slice(start, end).forEach(song => {
        const div = document.createElement('div');
        div.className = 'song-entry';
        div.innerHTML = `
            <i class="fas fa-trash del-btn" onclick="deleteSong('${song.id}')"></i>
            <iframe src="${song.embedUrl}"></iframe>
            <div class="song-info">
                <div class="lyric">"${song.line}"</div>
                <div class="note">${song.note}</div>
            </div>
        `;
        display.appendChild(div);
    });

    document.getElementById('pageIndicator').innerText = `Page ${currentPage}`;
}

// Pagination
document.getElementById('nextBtn').onclick = () => {
    if (currentPage * 3 < allSongs.length) { currentPage++; renderSongs(); }
};
document.getElementById('prevBtn').onclick = () => {
    if (currentPage > 1) { currentPage--; renderSongs(); }
};
