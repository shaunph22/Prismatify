// Helper to get token from query string
function getTokenFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('access_token');
}

// Helper to get token from URL hash (after #)
function getTokenFromHash() {
  const hash = window.location.hash.substring(1); // remove '#'
  const params = new URLSearchParams(hash);
  return params.get('access_token');
}

function extractPlaylistID(url) {
  // Extract Spotify playlist ID from full playlist URL
  const regex = /playlist\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

window.onload = () => {
  let accessToken = getTokenFromQuery() || getTokenFromHash();

  if (!accessToken) {
    alert('No Spotify access token found. Please log in first.');
    return;
  }

  console.log("Access token:", accessToken);

  const analyzeBtn = document.getElementById('analyzeButton');
  analyzeBtn.addEventListener('click', async () => {
    const playlistUrl = document.getElementById('playlistLink').value.trim();
    const playlistID = extractPlaylistID(playlistUrl);

    if (!playlistID) {
      alert('Please enter a valid Spotify playlist URL.');
      return;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        alert('Could not fetch playlist data. Please make sure the playlist is public.');
        return;
      }

      const playlist = await response.json();

      displayPlaylist(playlist);
    } catch (error) {
      alert('Error fetching playlist data.');
      console.error(error);
    }
  });

  function displayPlaylist(playlist) {
    const container = document.getElementById('playlistResults');
    container.innerHTML = ''; // Clear previous results

    let totalDuration = 0;
    let totalPopularity = 0;
    const tracks = playlist.tracks.items;
    const trackCount = tracks.length;

    tracks.forEach((item) => {
      const track = item.track;

      totalDuration += track.duration_ms;
      totalPopularity += track.popularity;

      const card = document.createElement('div');
      card.className = 'track-card';
      card.style.margin = '10px';
      card.style.padding = '10px';
      card.style.backgroundColor = 'rgba(0, 183, 255, 0.05)';
      card.style.borderRadius = '8px';
      card.style.color = 'white';
      card.style.maxWidth = '300px';
      card.style.textAlign = 'center';

      card.innerHTML = `
        <img src="${track.album.images[0]?.url || ''}" alt="Cover" style="width:100%; border-radius:4px;">
        <h3 style="font-family:'Montserrat', sans-serif; font-size:16px; margin:10px 0;">${track.name}</h3>
        <p style="font-family:'Cabin', sans-serif;">${track.artists.map(a => a.name).join(', ')}</p>
        <p style="font-family:'Cabin', sans-serif; font-size:12px;">${track.album.name}</p>
        <p style="font-family:'Cabin', sans-serif;">Popularity: ${track.popularity}</p>
        <p style="font-family:'Cabin', sans-serif;">Length: ${formatDuration(track.duration_ms)}</p>
        <a href="${track.external_urls.spotify}" target="_blank" style="color:#1DB954; text-decoration:none;">Open in Spotify</a>
      `;
      container.appendChild(card);
    });

    const avgPopularity = (totalPopularity / trackCount).toFixed(1);
    const avgDurationMS = totalDuration / trackCount;

    const summary = document.createElement('div');
    summary.style.margin = '20px auto';
    summary.style.padding = '15px';
    summary.style.backgroundColor = 'rgba(0,0,0,0.6)';
    summary.style.color = 'white';
    summary.style.fontFamily = "'Montserrat', sans-serif";
    summary.style.textAlign = 'center';
    summary.style.borderRadius = '8px';
    summary.style.maxWidth = '500px';

    summary.innerHTML = `
      <h2>Playlist Stats</h2>
      <p>Average Popularity: ${avgPopularity}</p>
      <p>Average Song Length: ${formatDuration(avgDurationMS)}</p>
    `;

    container.prepend(summary);
  }
};
