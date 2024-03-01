# Define the directory containing the playlists
$directory = "."

# Get a list of all the playlists in the directory
$playlists = Get-ChildItem -Path $directory -Filter *.m3u8

# Iterate over each playlist and download it
foreach ($playlist in $playlists) {
    $url = "https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/" + $playlist.Name
    Invoke-WebRequest -Uri $url -OutFile $playlist.FullName
    Write-Host "Downloaded $($playlist.Name)"
}
