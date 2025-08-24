// Get access token from URL hash (implicit grant flow)
function getAccessTokenFromUrl() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get("access_token");
}

const accessToken = getAccessTokenFromUrl();

// Check for token
if (!accessToken) {
    console.error("No access token found. Please login again.");
}

// Handle Analyze button click
document.getElementById("analyzeButton").addEventListener("click", async () => {
    const playlistUrl = document.getElementById("playlistLink").value.trim();

    if (!playlistUrl) {
        document.getElementById("playlistResults").innerHTML = "<p>Please enter a playlist URL.</p>";
        return;
    }

    document.getElementById("playlistResults").innerHTML = "<p>Loading...</p>";

    try {
        // Extract playlist ID from URL
        const playlistId = playlistUrl.split("playlist/")[1].split("?")[0];

        // Fetch playlist details + first 100 tracks
        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}?market=US&limit=100`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        const data = await response.json();

        if (data.error) {
            document.getElementById("playlistResults").innerHTML = `<p>Error: ${data.error.message}</p>`;
            return;
        }

        // Render playlist info
        let html = `<h2>${data.name}</h2>`;
        html += `<p>Total tracks: ${data.tracks.total}</p>`;
        html += "<ul>";

        // Loop through first 100 tracks
        data.tracks.items.forEach((item, index) => {
            if (!item.track) return; // skip if null (local/unavailable track)
            const track = item.track;
            const artists = track.artists.map(a => a.name).join(", ");
            html += `<li>${index + 1}. ${artists} — ${track.name}</li>`;
        });

        html += "</ul>";

        document.getElementById("playlistResults").innerHTML = html;

    } catch (error) {
        console.error("Error fetching playlist:", error);
        document.getElementById("playlistResults").innerHTML =
            "<p>Failed to load playlist. Please try again.</p>";
    }
});
