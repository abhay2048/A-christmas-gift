function addSong() {
  const link = document.getElementById("songLink").value;
  if (!link) return;

  const container = document.getElementById("songs");

  const card = document.createElement("div");
  card.className = "song-card";

  card.innerHTML = `
    <div class="spotify">
      <strong>Spotify Link</strong><br>
      <a href="${link}" target="_blank">${link}</a>
    </div>
    <div class="notes" contenteditable="true">
      write why this song matters...
    </div>
  `;

  container.prepend(card);
  document.getElementById("songLink").value = "";
}
