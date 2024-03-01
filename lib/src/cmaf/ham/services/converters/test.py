import os
import requests

def download_playlist(base_url,playlist_url, output_dir):
    # Extract the filename from the URL
    filename = os.path.basename(playlist_url)
    output_path = os.path.join(output_dir, filename)
    
    # Download the playlist file
    print(base_url+playlist_url)
    response = requests.get(base_url+playlist_url)
    #download segments
    
    with open(output_path, 'wb') as f:
        f.write(response.content)
    
    with open(output_path, 'r') as f:
        lines = f.readlines()
        
    for line in lines:
        if line.startswith('#') or not line.strip():
            continue
        
        if not(line.startswith('#')):
            segment_url = line.strip()
            print(segment_url)
            segment_filename = os.path.basename(segment_url)
            segment_output_path = os.path.join(output_dir, segment_filename)
            segment_response = requests.get(base_url+segment_url)
            with open(segment_output_path, 'wb') as f:
                f.write(segment_response.content)
            break
        


    return output_path

def download_all_playlists(base_url,main_playlist_url, output_dir):
    # Create the output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Download the main playlist
    main_playlist_path = download_playlist(base_url,main_playlist_url, output_dir)
    
    # Read the main playlist file
    with open(main_playlist_path, 'r') as f:
        lines = f.readlines()
    
    # Iterate through the lines to find and download referenced playlists
    response = []
    for line in lines:
        if line.startswith('#') or not line.strip():
            continue
        playlist_url = line.strip()
        response.append(playlist_url)
        # download_playlist(base_url,playlist_url, output_dir)
        
        # if line.startswith('#EXT-X-I-FRAME-STREAM-INF'):
        #     uri = line.split('URI="')[1].split('"')[0]
        #     print(uri)
        #     download_playlist(base_url,uri, output_dir)
    return response
if __name__ == "__main__":
    base_url = "https://dash.akamaized.net/dash264/TestCasesIOP41/CMAF/UnifiedStreaming/"
    main_playlist_url = "ToS_AVC_HEVC_MutliRate_MultiRes_IFrame_AAC.m3u8"
    output_dir = "downloaded_playlists"
    print(download_all_playlists(base_url,main_playlist_url, output_dir))
