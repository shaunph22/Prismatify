// Helper: Get query parameter by name from URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Helper: Extract playlist ID from full Spotify playlist URL or URI
function extractPlaylistID(url) {
  // Matches playlist/ followed by letters, numbers, underscores, or hyphens
  const regex = /playlist\/([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Helper: Format milliseconds to MM:SS
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Main function to fetch and display playlist data
async function fetchAndDisplayPlaylist(token, playlistID) {
  const container = document.getElementById('playlistResults');
  container.innerHTML = 'Loading playlist data...';

  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      container.innerHTML = `<p style="color:red;">Failed to fetch playlist data: ${response.status} ${response.statusText}</p>`;
      return;
    }

    const playlist = await response.json();

    // Calculate stats
    const tracks = playlist.tracks.items;
    let totalDurationMs = 0;
    let totalPopularity = 0;

    tracks.forEach(item => {
      if (item.track) {
        totalDurationMs += item.track.duration_ms;
        totalPopularity += item.track.popularity;
      }
    });

    const avgDurationMs = totalDurationMs / tracks.length;
    const avgPopularity = (totalPopularity / tracks.length).toFixed(1);

    // Clear container and display summary
    container.innerHTML = `
      <h2>${playlist.name}</h2>
      <p><strong>By:</strong> ${playlist.owner.display_name}</p>
      <p><strong>Total Tracks:</strong> ${tracks.length}</p>
      <p><strong>Average Length:</strong> ${formatDuration(avgDurationMs)}</p>
      <p><strong>Average Popularity:</strong> ${avgPopularity}</p>
      <hr>
      <div id="trackList"></div>
    `;

    // Display individual tracks
    const trackList = document.getElementById('trackList');
    tracks.forEach((item, index) => {
      if (item.track) {
        const track = item.track;
        const artists = track.artists.map(a => a.name).join(', ');
        const trackDiv = document.createElement('div');
        trackDiv.style.marginBottom = '10px';
        trackDiv.style.padding = '8px';
        trackDiv.style.backgroundColor = 'rgba(0,183,255,0.05)';
        trackDiv.style.borderRadius = '6px';
        trackDiv.style.color = 'white';
        trackDiv.innerHTML = `
          <strong>${index + 1}. ${track.name}</strong> by ${artists} <br>
          Album: ${track.album.name} <br>
          Length: ${formatDuration(track.duration_ms)} | Popularity: ${track.popularity} <br>
          <a href="${track.external_urls.spotify}" target="_blank" style="color:#1DB954;">Open in Spotify</a>
        `;
        trackList.appendChild(trackDiv);
      }
    });

  } catch (error) {
    container.innerHTML = `<p style="color:red;">Error fetching playlist data.</p>`;
    console.error('Fetch error:', error);
  }
}

// On page load
window.onload = () => {
  const accessToken = getQueryParam('access_token');
  if (!accessToken) {
    alert('No Spotify access token found. Please log in first.');
    return;
  }

  const analyzeBtn = document.querySelector('button#analyzeButton');
  const playlistInput = document.getElementById('playlistLink');
  const container = document.getElementById('playlistResults');

  analyzeBtn.addEventListener('click', () => {
    const playlistUrl = playlistInput.value.trim();
    if (!playlistUrl) {
      alert('Please enter a Spotify playlist link.');
      return;
    }

    const playlistID = extractPlaylistID(playlistUrl);
    if (!playlistID) {
      alert('Invalid Spotify playlist link.');
      return;
    }

    fetchAndDisplayPlaylist(accessToken, playlistID);
  });

};
