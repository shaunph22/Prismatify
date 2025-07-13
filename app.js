// Takes full playlist link and matches it to Spotify database
function extractPlaylistID(url){
    const regex = /playlist\/(a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Fetch playlist data
async function fetchPlaylist(playlistID){
    const token = "a8189afb6b8f45ec8176d6313446bc5f";
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if(!response.ok){
        alert("Could not fetch playlist data.");
        return;
    }

    const data = await response.json();
}

// Displays data of playlist
function displayPlaylist(playlist){
    
}
