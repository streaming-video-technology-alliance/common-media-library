const hlsMain3 = `#EXTM3U
## Generated with https://github.com/google/shaka-packager version v2.3.0-5bf8ad5-release

#EXT-X-MEDIA:TYPE=AUDIO,URI="audio-eng-0128k-aac-2c.mp4.m3u8",GROUP-ID="default-audio-group",LANGUAGE="en",NAME="stream_5",DEFAULT=YES,AUTOSELECT=YES,CHANNELS="2"
#EXT-X-MEDIA:TYPE=AUDIO,URI="audio-eng-0384k-aac-6c.mp4.m3u8",GROUP-ID="default-audio-group",LANGUAGE="en",NAME="stream_6",CHANNELS="6"

#EXT-X-MEDIA:TYPE=SUBTITLES,URI="playlist_s-en.webvtt.m3u8",GROUP-ID="default-text-group",LANGUAGE="en",NAME="stream_0",DEFAULT=YES,AUTOSELECT=YES
#EXT-X-MEDIA:TYPE=SUBTITLES,URI="playlist_s-el.webvtt.m3u8",GROUP-ID="default-text-group",LANGUAGE="el",NAME="stream_1",AUTOSELECT=YES

#EXT-X-STREAM-INF:BANDWIDTH=8062646,AVERAGE-BANDWIDTH=1824731,CODECS="avc1.4d401f,mp4a.40.2",RESOLUTION=768x576,AUDIO="default-audio-group",SUBTITLES="default-text-group"
video-0576p-1400k-libx264.mp4.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=6096050,AVERAGE-BANDWIDTH=1410993,CODECS="avc1.4d401f,mp4a.40.2",RESOLUTION=640x480,AUDIO="default-audio-group",SUBTITLES="default-text-group"
video-0480p-1000k-libx264.mp4.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=4005148,AVERAGE-BANDWIDTH=1146764,CODECS="avc1.4d401f,mp4a.40.2",RESOLUTION=480x360,AUDIO="default-audio-group",SUBTITLES="default-text-group"
video-0360p-0750k-libx264.mp4.m3u8`;

const aac_38k = `#EXTM3U
#EXT-X-VERSION:6
## Generated with https://github.com/google/shaka-packager version v2.3.0-5bf8ad5-release
#EXT-X-TARGETDURATION:5
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MAP:URI="https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-init.mp4"
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s1.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s2.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s3.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s4.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s5.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s6.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s7.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s8.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s9.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s10.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s11.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s12.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s13.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s14.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s15.mp4
#EXT-X-ENDLIST
`;

const aac_128k = `#EXTM3U
#EXT-X-VERSION:6
## Generated with https://github.com/google/shaka-packager version v2.3.0-5bf8ad5-release
#EXT-X-TARGETDURATION:5
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MAP:URI="https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-init.mp4"
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s1.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s2.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s3.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s4.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s5.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s6.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s7.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s8.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s9.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s10.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s11.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s12.mp4
#EXTINF:4.011,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s13.mp4
#EXTINF:3.989,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s14.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0128k-aac-2c-s15.mp4
#EXT-X-ENDLIST
`;

const webvtt_el = `#EXTM3U
#EXT-X-VERSION:6
## Generated with https://github.com/google/shaka-packager version v2.3.0-5bf8ad5-release
#EXT-X-TARGETDURATION:5
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s1.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s2.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s3.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s4.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s5.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s6.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s7.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s8.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s9.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s10.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s11.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s12.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s13.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s14.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s15.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-el-s16.vtt
#EXT-X-ENDLIST
`;

const webvtt_en = `#EXTM3U
#EXT-X-VERSION:6
## Generated with https://github.com/google/shaka-packager version v2.3.0-5bf8ad5-release
#EXT-X-TARGETDURATION:5
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s1.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s2.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s3.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s4.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s5.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s6.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s7.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s8.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s9.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s10.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s11.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s12.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s13.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s14.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s15.vtt
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/s-en-s16.vtt
#EXT-X-ENDLIST
`;

const mp4_750k = `#EXTM3U
#EXT-X-VERSION:6
## Generated with https://github.com/google/shaka-packager version v2.3.0-5bf8ad5-release
#EXT-X-TARGETDURATION:5
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MAP:URI="https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-init.mp4"
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s1.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s2.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s3.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s4.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s5.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s6.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s7.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s8.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s9.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s10.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s11.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s12.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s13.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s14.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0360p-0750k-libx264-s15.mp4
#EXT-X-ENDLIST
`;

const mp4_1000k = `#EXTM3U
#EXT-X-VERSION:6
## Generated with https://github.com/google/shaka-packager version v2.3.0-5bf8ad5-release
#EXT-X-TARGETDURATION:5
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MAP:URI="https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-init.mp4"
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s1.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s2.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s3.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s4.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s5.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s6.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s7.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s8.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s9.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s10.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s11.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s12.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s13.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s14.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0480p-1000k-libx264-s15.mp4
#EXT-X-ENDLIST
`;

const mp4_1400k = `#EXTM3U
#EXT-X-VERSION:6
## Generated with https://github.com/google/shaka-packager version v2.3.0-5bf8ad5-release
#EXT-X-TARGETDURATION:5
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MAP:URI="https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-init.mp4"
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s1.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s2.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s3.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s4.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s5.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s6.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s7.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s8.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s9.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s10.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s11.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s12.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s13.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s14.mp4
#EXTINF:4.000,
https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/v-0576p-1400k-libx264-s15.mp4
#EXT-X-ENDLIST
`;

const hlsPlaylist3 = [
	aac_38k,
	aac_128k,
	webvtt_el,
	webvtt_en,
	mp4_750k,
	mp4_1000k,
	mp4_1400k,
];

export { hlsMain3, hlsPlaylist3 };
