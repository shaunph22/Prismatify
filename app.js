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

// Extract Spotify playlist ID from full playlist URL
function extractPlaylistID(url) {
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
  // Clear previous results
  container.innerHTML = ''; 

  // Prepare stats
  let totalDuration = 0;
  let totalPopularity = 0;
  const tracks = playlist.tracks.items;
  const trackCount = tracks.length;

  // Create the table
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.fontFamily = "'Cabin', sans-serif";
  table.style.color = 'black';
  table.style.marginTop = '20px';

  // Table header
  const headerRow = document.createElement('tr');
  const headers = ['Artwork', 'Title', 'Artist(s)', 'Album', 'Popularity', 'Length'];
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    th.style.borderBottom = '2px solid black';
    th.style.padding = '10px';
    th.style.textAlign = 'left';
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Table rows
  tracks.forEach(item => {
    const track = item.track;
    totalDuration += track.duration_ms;
    totalPopularity += track.popularity;

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

  // Append table to the container
  container.appendChild(table);

  // Summary Stats
  const avgPopularity = (totalPopularity / trackCount).toFixed(1);
  const avgDurationMS = totalDuration / trackCount;

  const summary = document.createElement('div');
  summary.style.marginTop = '30px';
  summary.style.padding = '15px';
  summary.style.backgroundColor = 'rgba(0,0,0,0.6)';
  summary.style.borderRadius = '8px';
  summary.style.color = 'black';
  summary.style.textAlign = 'center';
  summary.style.fontFamily = "'Montserrat', sans-serif";

  summary.innerHTML = `
    <h2>Playlist Stats</h2>
    <p>Average Popularity: ${avgPopularity}</p>
    <p>Average Song Length: ${formatDuration(avgDurationMS)}</p>
  `;

  container.appendChild(summary);
}
};
