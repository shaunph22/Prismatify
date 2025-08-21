const clientId = "22b5867be4c74e949ac5c0e10f6b1b12";
const redirectUri = "https://shaunph22.github.io/Prismatify/";

const scopes = [
  "playlist-read-private",
  "playlist-read-collaborative"
];

let accessToken = null;

// Generate random string for PKCE
function generateCodeVerifier(length = 128) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// SHA256 helper
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

// Redirect to Spotify for login
async function redirectToSpotifyAuth() {
  const codeVerifier = generateCodeVerifier();
  localStorage.setItem("code_verifier", codeVerifier);

  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", codeChallenge);

  window.location = authUrl.toString();
}

// Exchange code for access token
async function fetchAccessToken(code) {
  const codeVerifier = localStorage.getItem("code_verifier");

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
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

// =========================
// Playlist Analysis Logic
// =========================

// Extract playlist ID
function extractPlaylistID(url) {
  const regex = /playlist\/([a-zA-Z0-9]+)(?:\?.*)?/;
  const match = url.match(regex);
  console.log("Extracted playlist ID:", match ? match[1] : "❌ failed");
  return match ? match[1] : null;
}


async function fetchPlaylist(playlistId) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });

  console.log("Fetch response status:", response.status);

  if (!response.ok) {
    const errText = await response.text();
    console.error("Spotify API error:", errText);
    alert("❌ Failed to load playlist. Check console.");
    return null;
  }

  const data = await response.json();
  console.log("Fetched playlist object:", data);
  return data;
}


function displayPlaylist(playlist) {
  console.log("Displaying playlist:", playlist);

  if (!playlist || !playlist.tracks || !playlist.tracks.items) {
    console.error("Invalid playlist structure:", playlist);
    return;
  }

  const firstTrack = playlist.tracks.items[0]?.track?.name || "No tracks";
  document.getElementById("results").innerHTML = `<p>First track: ${firstTrack}</p>`;
}


// =========================
// Button Handlers
// =========================

document.getElementById("loginBtn").addEventListener("click", redirectToSpotifyAuth);

document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const playlistUrl = document.getElementById("playlistUrl").value;
  const playlistId = extractPlaylistID(playlistUrl);

  if (!playlistId) {
    alert("❌ Please enter a valid Spotify playlist link.");
    return;
  }

  if (!accessToken) {
    alert("⚠️ Not logged in yet. Please log in first.");
    return;
  }

  const playlist = await fetchPlaylist(playlistId);
  if (playlist) displayPlaylist(playlist);
});

// =========================
// Handle Redirect Back
// =========================

window.addEventListener("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code) {
    await fetchAccessToken(code);
    window.history.replaceState({}, document.title, redirectUri); // clean up URL
  }
});

