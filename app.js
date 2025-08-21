// Receive token from URL
function getTokenFromUrl() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get('access_token');
}

// Spotify login
function redirectToSpotifyLogin() {
  const clientId = '22b5867be4c74e949ac5c0e10f6b1b12';
  const redirectUri = 'https://shaunph22.github.io/Prismatify/';
  const scopes = ['playlist-read-private', 'playlist-read-collaborative'];

  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  window.location.href = authUrl;
}

// Extract Spotify playlist ID from full playlist URL
function extractPlaylistID(url) {
  const regex = /playlist\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Format milliseconds to mm:ss
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Display playlist summary and table
function displayPlaylist(playlist) {
  const container = document.getElementById('playlistResults');
  container.innerHTML = '';

  const tracks = playlist.tracks.items;
  if (!tracks.length) {
    container.innerHTML = '<p>No tracks found in this playlist.</p>';
    return;
  }

  let totalDuration = 0;
  let totalPopularity = 0;
  const trackCount = tracks.length;

  tracks.forEach(item => {
    const track = item.track;
    totalDuration += track.duration_ms;
    totalPopularity += track.popularity;
  });

  const avgPopularity = (totalPopularity / trackCount).toFixed(1);
  const avgDurationMS = totalDuration / trackCount;

  // Summary
  const summary = document.createElement('div');
  summary.style.marginTop = '30px';
  summary.style.marginBottom = '20px';
  summary.style.padding = '15px';
  summary.style.backgroundColor = 'rgba(0,0,0,0.6)';
  summary.style.borderRadius = '8px';
  summary.style.color = 'white';
  summary.style.textAlign = 'center';
  summary.style.fontFamily = "'Montserrat', sans-serif'";
  summary.innerHTML = `
    <h2>Playlist Stats</h2>
    <p>Average Popularity: ${avgPopularity}</p>
    <p>Average Song Length: ${formatDuration(avgDurationMS)}</p>
  `;
  container.appendChild(summary);

  // Table
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontFamily = "'Cabin', sans-serif'";
  table.style.color = 'black';

  const headers = ['Artwork', 'Title', 'Artist(s)', 'Album', 'Popularity', 'Length'];
  const headerRow = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.borderBottom = '2px solid black';
    th.style.padding = '10px';
    th.style.textAlign = 'left';
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  tracks.forEach(item => {
    const track = item.track;
    const row = document.createElement('tr');

    const artworkCell = document.createElement('td');
    artworkCell.innerHTML = `<img src="${track.album.images[0]?.url || ''}" alt="Cover" style="width:60px; border-radius:4px;">`;
    artworkCell.style.padding = '10px';

    const titleCell = document.createElement('td');
    titleCell.innerHTML = `<a href="${track.external_urls.spotify}" target="_blank" style="color:#1DB954; text-decoration:none;">${track.name}</a>`;
    titleCell.style.padding = '10px';

    const artistCell = document.createElement('td');
    artistCell.textContent = track.artists.map(a => a.name).join(', ');
    artistCell.style.padding = '10px';

    const albumCell = document.createElement('td');
    albumCell.textContent = track.album.name;
    albumCell.style.padding = '10px';

    const popularityCell = document.createElement('td');
    popularityCell.textContent = track.popularity;
    popularityCell.style.padding = '10px';

    const lengthCell = document.createElement('td');
    lengthCell.textContent = formatDuration(track.duration_ms);
    lengthCell.style.padding = '10px';

    row.appendChild(artworkCell);
    row.appendChild(titleCell);
    row.appendChild(artistCell);
    row.appendChild(albumCell);
    row.appendChild(popularityCell);
    row.appendChild(lengthCell);

    table.appendChild(row);
  });

  container.appendChild(table);
}

// Main
window.onload = () => {
  const tokenFromUrl = getTokenFromUrl();

  if (tokenFromUrl) {
    localStorage.setItem("spotify_access_token", tokenFromUrl);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const accessToken = localStorage.getItem("spotify_access_token");

  if (!accessToken) {
    redirectToSpotifyLogin();
    return;
  }

  console.log("✅ Access token loaded:", accessToken);

  const analyzeBtn = document.getElementById("analyzeButton");
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async () => {
      const playlistUrl = document.getElementById("playlistLink").value.trim();
      const playlistID = extractPlaylistID(playlistUrl);

      if (!playlistID) {
        alert("❗ Please enter a valid Spotify playlist URL.");
        return;
      }

      try {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistID}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
          console.error("Spotify API error:", response.status, response.statusText);
          alert("❌ Failed to load playlist. Make sure it’s public and token is valid.");
          return;
        }

        const playlist = await response.json();
        displayPlaylist(playlist);
      } catch (error) {
        console.error("Error fetching playlist:", error);
        alert("⚠️ Error fetching playlist. Check console for details.");
      }
    });
  }
};
