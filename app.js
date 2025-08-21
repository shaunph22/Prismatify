/***************  CONFIG  *****************/
const CLIENT_ID = '22b5867be4c74e949ac5c0e10f6b1b12';
const REDIRECT_URI = 'https://shaunph22.github.io/Prismatify/';
const SCOPES = ['playlist-read-private', 'playlist-read-collaborative'];
/******************************************/

/* ---------- Helpers ---------- */
function parseAuthFromHash() {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.substring(1)
    : window.location.hash;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const token_type = params.get('token_type');
  const expires_in = params.get('expires_in'); // seconds
  const error = params.get('error');
  return { access_token, token_type, expires_in, error };
}

function cleanUrl() {
  const clean = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, clean);
}

function saveToken(token, expiresInSec) {
  const expiresAt = Date.now() + Number(expiresInSec || 3600) * 1000;
  localStorage.setItem('spotify_access_token', token);
  localStorage.setItem('spotify_token_expires_at', String(expiresAt));
}

function getStoredToken() {
  const token = localStorage.getItem('spotify_access_token');
  const expiresAt = Number(localStorage.getItem('spotify_token_expires_at') || '0');
  if (!token) return null;
  if (Date.now() >= expiresAt) {
    // expired
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expires_at');
    return null;
  }
  return token;
}

function redirectToSpotifyLogin() {
  // IMPORTANT: scopes must be space-delimited, then URL-encoded
  const scopeParam = encodeURIComponent(SCOPES.join(' '));
  const state = Math.random().toString(36).slice(2); // simple CSRF/state
  sessionStorage.setItem('spotify_oauth_state', state);
  sessionStorage.setItem('spotify_auth_attempt', '1'); // prevent loops

  const authUrl =
    `https://accounts.spotify.com/authorize` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&response_type=token` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${scopeParam}` +
    `&state=${encodeURIComponent(state)}`;

  window.location.href = authUrl;
}

function ensureLoginButton() {
  if (document.getElementById('loginWithSpotify')) return;
  const cta = document.createElement('button');
  cta.id = 'loginWithSpotify';
  cta.textContent = 'Log in with Spotify';
  cta.style.display = 'block';
  cta.style.margin = '20px auto';
  cta.style.fontFamily = 'Cabin, sans-serif';
  cta.onclick = () => redirectToSpotifyLogin();
  document.body.insertBefore(cta, document.getElementById('playlistResults'));
}

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

function displayPlaylist(playlist) {
  const container = document.getElementById('playlistResults');
  container.innerHTML = '';

  const tracks = playlist.tracks.items || [];
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

  // Summary (first)
  const summary = document.createElement('div');
  summary.style.marginTop = '30px';
  summary.style.marginBottom = '20px';
  summary.style.padding = '15px';
  summary.style.backgroundColor = 'rgba(0,0,0,0.6)';
  summary.style.borderRadius = '8px';
  summary.style.color = 'white';
  summary.style.textAlign = 'center';
  summary.style.fontFamily = "'Montserrat', sans-serif";
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
  table.style.fontFamily = "'Cabin', sans-serif";
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

/* ---------- Main ---------- */
window.onload = () => {
  const { access_token, expires_in, error } = parseAuthFromHash();

  // If Spotify sent us back with a token
  if (access_token) {
    saveToken(access_token, expires_in || '3600');
    cleanUrl(); // remove #... safely
    sessionStorage.removeItem('spotify_auth_attempt');
  } else if (error) {
    // Got an OAuth error, don't loop
    console.error('Spotify OAuth error:', error);
    cleanUrl();
  }

  // Use stored token if valid
  let token = getStoredToken();

  // If no valid token, decide whether to auto-redirect
  if (!token) {
    const alreadyTried = sessionStorage.getItem('spotify_auth_attempt') === '1';
    if (!alreadyTried) {
      // First time: try auto login
      redirectToSpotifyLogin();
      return;
    }
    ensureLoginButton();
    return;
  }

  console.log('✅ Access token ready');

  // Wire up Analyze button
  const analyzeBtn = document.getElementById('analyzeButton');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      // Always re-pull token in case it refreshed during session
      const currentToken = getStoredToken();
      if (!currentToken) {
        alert('Session expired. Please log in again.');
        ensureLoginButton();
        return;
      }

      const playlistUrl = document.getElementById('playlistLink').value.trim();
      const playlistID = extractPlaylistID(playlistUrl);

      if (!playlistID) {
        alert('❗ Please enter a valid Spotify playlist URL.');
        return;
      }

      try {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistID}`,
          { headers: { Authorization: `Bearer ${currentToken}` } }
        );

        if (!response.ok) {
          console.error('Spotify API error:', response.status, response.statusText);
          alert('❌ Failed to load playlist. Make sure it’s public and the token is valid.');
          return;
        }

        const playlist = await response.json();
        displayPlaylist(playlist);
      } catch (e) {
        console.error('Error fetching playlist:', e);
        alert('⚠️ Error fetching playlist. Check console for details.');
      }
    });
  }
};
