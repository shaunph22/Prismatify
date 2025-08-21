// Prismatify - app.js

// Replace with your Spotify app values
const clientId = "YOUR_CLIENT_ID_HERE"; 
const redirectUri = "https://YOUR_GITHUB_USERNAME.github.io/Prismatify/"; 
const scopes = "playlist-read-private playlist-read-collaborative";

let accessToken = localStorage.getItem("spotify_access_token");

// 1. Login flow
function login() {
  const state = generateRandomString(16);
  localStorage.setItem("spotify_auth_state", state);

  const authUrl = "https://accounts.spotify.com/authorize" +
    `?response_type=token` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;

  window.location = authUrl;
}

// 2. Handle redirect with token
function handleRedirect() {
  if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    accessToken = params.get("access_token");
    const state = params.get("state");
    const storedState = localStorage.getItem("spotify_auth_state");

    if (accessToken && state === storedState) {
      localStorage.setItem("spotify_access_token", accessToken);
      localStorage.removeItem("spotify_auth_state");
      window.location.hash = ""; // Clear hash to stop refresh loops
    } else {
      console.error("State mismatch or missing token.");
    }
  }
}

handleRedirect();

// 3. Helper functions
function generateRandomString(length) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// 4. Fetch Playlist Data
async function fetchPlaylist(playlistUrl) {
  if (!accessToken) {
    alert("You must log in first!");
    login();
    return;
  }

  try {
    // Extract playlist ID from URL
    const playlistID = playlistUrl.split("playlist/")[1].split("?")[0];

    // Fetch playlist info
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) throw new Error("Failed to fetch playlist");

    const data = await response.json();
    displayPlaylistTable(data);
  } catch (error) {
    console.error("Error fetching playlist:", error);
    alert("Error fetching playlist. Please check the link and try again.");
  }
}

// 5. Display Playlist Table
function displayPlaylistTable(data) {
  const container = document.getElementById("results");
  container.innerHTML = ""; // Clear old results
``
  const title = document.createElement("h2");
  title.textContent = `Playlist: ${data.name} (${data.tracks.items.length} tracks)`;
  container.appendChild(title);

  const table = document.createElement("table");
  table.border = "1";
  table.cellPadding = "5";
  table.innerHTML = `
    <tr>
      <th>#</th>
      <th>Track</th>
      <th>Artist</th>
      <th>Album</th>
      <th>Duration</th>
      <th>Popularity</th>
    </tr>
  `;

  data.tracks.items.forEach((item, index) => {
    const track = item.track;
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${track.name}</td>
      <td>${track.artists.map(a => a.name).join(", ")}</td>
      <td>${track.album.name}</td>
      <td>${msToMinSec(track.duration_ms)}</td>
      <td>${track.popularity || "N/A"}</td>
    `;

    table.appendChild(row);
  });

  container.appendChild(table);
}

// Helper: convert ms → mm:ss
function msToMinSec(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// 6. Hook up Analyze button
document.getElementById("analyzeBtn").addEventListener("click", () => {
  const playlistUrl = document.getElementById("playlistUrl").value.trim();
  if (!playlistUrl) {
    alert("Please enter a Spotify playlist URL.");
    return;
  }
  fetchPlaylist(playlistUrl);
});

