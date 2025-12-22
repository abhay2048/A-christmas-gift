import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let songs=[], page=1;
const PER_PAGE=3;

// ADD SONG
addSongBtn.onclick=()=>{
    const url=songLinkInput.value;
    const m=url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if(!m) return;

    push(ref(db,"binderSongs"),{
        embed:`https://open.spotify.com/embed/${m[1]}/${m[2]}`,
        title:songTitleInput.value,
        note:songNoteInput.value,
        line:songLineInput.value,
        time:Date.now()
    });

    songLinkInput.value=songTitleInput.value=songNoteInput.value=songLineInput.value="";
};

// LOAD SONGS
onValue(ref(db,"binderSongs"),snap=>{
    songs=[];
    if(snap.val()){
        Object.entries(snap.val()).forEach(([id,v])=>{
            songs.push({...v,id});
        });
    }
    songs.sort((a,b)=>a.time-b.time);
    render();
});

function render(){
    binder-pages-display.innerHTML="";
    songs.slice((page-1)*PER_PAGE,page*PER_PAGE).forEach(s=>{
        const d=document.createElement("div");
        d.className="song-card";
        d.innerHTML=`
        <iframe src="${s.embed}" width="120" height="80"></iframe>
        <div class="song-text">
            <div class="song-title">${s.title||"In Love"}</div>
            <div class="song-note">${s.note||""}</div>
            <div class="song-line">"${s.line||""}"</div>
        </div>
        <i class="fas fa-trash" onclick="del('${s.id}')"></i>`;
        binder-pages-display.appendChild(d);
    });
    pageIndicator.innerText=`Page ${page}`;
}

window.del=id=>remove(ref(db,"binderSongs/"+id));
prevBtn.onclick=()=>{if(page>1){page--;render();}};
nextBtn.onclick=()=>{if(page*PER_PAGE<songs.length){page++;render();}};

// COUNTDOWN + SUSPENSE
const target=new Date("2025-12-25T00:00:00").getTime();
setInterval(()=>{
    const d=target-Date.now();
    if(d<=0){
        countdown-timer.innerText="00";
        setTimeout(()=>{
            secret-message.style.display="block";
        },10000);
    }else{
        countdown-timer.innerText=Math.floor(d/1000)+"s";
    }
},1000);
