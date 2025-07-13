// Takes full playlist link and matches it to Spotify database
function extractPlaylistID(url){
    const regex = /playlist\/(a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Fetch playlist data
async function fetchPlaylist(playlistID){
    const token = "a8189afb6b8f45ec8176d6313446bc5f";
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if(!response.ok){
        alert("Could not fetch playlist data.");
        return;
    }

    const data = await response.json();
}

// Displays data of playlist
function displayPlaylist(playlist){
    const container = document.getElementById("playlistResults");

    // Clear previous results
    container.innerHTML = "";

    let totalDuration = 0; // Duration will be in milliseconds initially, so we have to convert later
    let totalPopularity = 0;
    let trackCount = playlist.tracks.items.length;

    playlist.tracks.items.array.forEach((item) => {
        const track = item.track;

        totalDuration += track.duration_ms;
        totalPopularity += track.popularity;

        const card = document.createElement("div");
        card.className = "track-card";
        card.style.margin = "10px";
        card.style.padding = "10px";
        card.style.backgroundColor = "rgba(0, 183, 255, 0.05)";
        card.style.borderRadius = "8px";
        card.style.color = "white";
        card.style.maxWidth = "300px";
        card.style.textAlign = "center";

        card.innerHTML = `
            <img src="${track.album.images[0]?.url || ""}" alt="Cover" style="width:100%; border-radius:4px;">
            <h3 style="font-family:'Montserrat', sans-serif; font-size:16px; margin:10px 0;">${track.name}</h3>
            <p style="font-family:'Cabin', sans-serif;">${track.artists.map(a => a.name).join(", ")}</p>
            <p style="font-family:'Cabin', sans-serif; font-size:12px;">${track.album.name}</p>
            <p style="font-family:'Cabin', sans-serif;">Popularity: ${track.popularity}</p>
            <p style="font-family:'Cabin', sans-serif;">Length: ${formatDuration(track.duration_ms)}</p>
            <a href="${track.external_urls.spotify}" target="_blank" style="color:#1DB954; text-decoration:none;">Open in Spotify</a>
        `;
        container.appendChild(card);
    });

    // Calculate average
    const avgPopularity = (totalPopularity / trackCount).toFixed(1);
    const avgDurationMS = totalDuration / trackCount;

    // Make summary div
    const summary = document.createElement("div");
    summary.style.margin = "20px auto";
    summary.style.padding = "15px";
    summary.style.backgroundColor = "rgba(0,0,0,0.6)";
    summary.style.color = "white";
    summary.style.fontFamily = "'Montserrat', sans-serif";
    summary.style.textAlign = "center";
    summary.style.borderRadius = "8px";
    summary.style.maxWidth = "500px";

    summary.innerHTML = `
        <h2>Playlist Stats</h2>
        <p>Average Popularity: ${avgPopularity}</p>
        <p>Average Song Length: ${formatDuration(avgDurationMS)}</p>
    `;

    container.prepend(summary);

}

function formatDuration(ms){
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
