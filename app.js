/*************** CONFIG *****************/
const CLIENT_ID = "22b5867be4c74e949ac5c0e10f6b1b12";
const REDIRECT_URI = "https://shaunph22.github.io/Prismatify/";
const SCOPES = ["playlist-read-private", "playlist-read-collaborative"];
/******************************************/

let accessToken = null;

/* ---------- PKCE Helpers ---------- */
function generateCodeVerifier(length = 128) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
}

function base64UrlEncode(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function redirectToSpotifyAuth() {
  const codeVerifier = generateCodeVerifier();
  localStorage.setItem("code_verifier", codeVerifier);

  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("scope", SCOPES.join(" "));
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", codeChallenge);

  window.location = authUrl.toString();
}

async function fetchAccessToken(code) {
  const codeVerifier = localStorage.getItem("code_verifier");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) {
    console.error("Failed to fetch access token", await response.text());
    return null;
  }

  const data = await response.json();
  accessToken = data.access_token;
  console.log("✅ Access token acquired:", accessToken);
  return accessToken;
}

/* ---------- Playlist Helpers ---------- */
function extractPlaylistID(url) {
  const regex = /playlist\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function fetchPlaylist(playlistId) {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?limit=100`,
    {
      headers: { Authorization: "Bearer " + accessToken }
    }
  );

  if (!response.ok) {
    console.error("Spotify API error:", response.status, await response.text());
    alert("❌ Failed to load playlist. Make sure it’s public.");
    return null;
  }

  return await response.json();
}

async function displayPlaylist(playlist) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  async function fetchAllPlaylistTracks(playlistId) {
    let tracks = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    while (url) {
      const response = await fetch(url, { headers: { Authorization: "Bearer " + accessToken } });
      if (!response.ok) {
        console.error("Failed to fetch tracks:", await response.text());
        return [];
      }
      const data = await response.json();
      tracks.push(...data.items);
      url = data.next; // next page URL
    }
    return tracks;
  }

  const allTracks = await fetchAllPlaylistTracks(playlist.id);

  if (!allTracks.length) {
    container.innerHTML = "<p>No tracks found in this playlist.</p>";
    return;
  }

  const validTracks = allTracks.filter(item => item.track && item.track.id);

  // --- Stats ---
  let totalDuration = 0;
  let totalPopularity = 0;
  const trackCount = validTracks.length;

  validTracks.forEach((item) => {
    const track = item.track;
    if (!track) return;
    totalDuration += track.duration_ms;
    totalPopularity += track.popularity;
  });

  const avgPopularity = (totalPopularity / trackCount).toFixed(1);
  const avgDurationMS = totalDuration / trackCount;

  const summary = document.createElement("div");
  summary.style.marginTop = "30px";
  summary.style.marginBottom = "20px";
  summary.style.padding = "15px";
  summary.style.backgroundColor = "rgba(0,0,0,0.6)";
  summary.style.borderRadius = "8px";
  summary.style.color = "white";
  summary.style.textAlign = "center";
  summary.style.fontFamily = "'Montserrat', sans-serif";
  summary.innerHTML = `
    <h2>Playlist Stats</h2>
    <p>Average Popularity: ${avgPopularity}</p>
    <p>Average Song Length: ${formatDuration(avgDurationMS)}</p>
  `;
  container.appendChild(summary);

  // --- Table ---
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.fontFamily = "'Cabin', sans-serif";
  table.style.color = "black";

  const headers = ["Artwork", "Title", "Artist(s)", "Album", "Popularity", "Length"];
  const headerRow = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.borderBottom = "2px solid black";
    th.style.padding = "10px";
    th.style.textAlign = "left";
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  validTracks.forEach((item) => {
    const track = item.track;
    if (!track) return;

    const row = document.createElement("tr");

    const artworkCell = document.createElement("td");
    artworkCell.innerHTML = `<img src="${track.album.images[0]?.url || ""}" alt="Cover" style="width:60px; border-radius:4px;">`;
    artworkCell.style.padding = "10px";

    const titleCell = document.createElement("td");
    titleCell.innerHTML = `<a href="${track.external_urls.spotify}" target="_blank" style="color:#1DB954; text-decoration:none;">${track.name}</a>`;
    titleCell.style.padding = "10px";

    const artistCell = document.createElement("td");
    artistCell.textContent = track.artists.map((a) => a.name).join(", ");
    artistCell.style.padding = "10px";

    const albumCell = document.createElement("td");
    albumCell.textContent = track.album.name;
    albumCell.style.padding = "10px";

    const popularityCell = document.createElement("td");
    popularityCell.textContent = track.popularity;
    popularityCell.style.padding = "10px";

    const lengthCell = document.createElement("td");
    lengthCell.textContent = formatDuration(track.duration_ms);
    lengthCell.style.padding = "10px";

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
window.addEventListener("load", async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (code) {
    await fetchAccessToken(code);
    window.history.replaceState({}, document.title, REDIRECT_URI);
  }

  // Wire login button
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", redirectToSpotifyAuth);
  }

  // Wire analyze button
  const analyzeBtn = document.getElementById("analyzeBtn");
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async () => {
      const playlistUrl = document.getElementById("playlistLink").value.trim();
      const playlistID = extractPlaylistID(playlistUrl);

      if (!playlistID) {
        alert("❗ Please enter a valid Spotify playlist URL.");
        return;
      }

      if (!accessToken) {
        alert("⚠️ Not logged in yet. Please log in first.");
        return;
      }

      const playlist = await fetchPlaylist(playlistID);
      if (playlist) displayPlaylist(playlist);
    });
  }
});
