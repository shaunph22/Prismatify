// Receive token from URL
function getTokenFromUrl() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return params.get('access_token');
}

// Spotify login
function redirectToSpotifyLogin() {
  const clientId = '22b5867be4c74e949ac5c0e10f6b1b12'; 
  const redirectUri = 'https://shaunph22.github.io/Prismatify/'; // must match Spotify dashboard
  const scopes = ['playlist-read-private', 'playlist-read-collaborative'];

  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

  window.location.href = authUrl;
}

// Loading page
window.onload = () => {
  const tokenFromUrl = getTokenFromUrl();

  if (tokenFromUrl) {
    localStorage.setItem('spotify_access_token', tokenFromUrl);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const accessToken = localStorage.getItem('spotify_access_token');

  if (!accessToken) {
    if (!window.location.hash.includes('access_token')) {
      redirectToSpotifyLogin();
    }
    return;
  }

  console.log('✅ Access token loaded:', accessToken);

  const analyzeBtn = document.getElementById('analyzeButton');
  analyzeBtn.addEventListener('click', async () => {
    const playlistUrl = document.getElementById('playlistLink').value.trim();
    const playlistID = extractPlaylistID(playlistUrl);

    if (!playlistID) {
      alert('❗ Please enter a valid Spotify playlist URL.');
      return;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        alert('❌ Failed to load playlist. Make sure it’s public and the token is valid.');
        return;
      }

      const playlist = await response.json();
      displayPlaylist(playlist);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      alert('⚠️ Error fetching playlist. Check console for details.');
    }
  });
};
