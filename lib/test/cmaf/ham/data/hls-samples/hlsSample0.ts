const hlsMain0 = `#EXTM3U
#EXT-X-VERSION:4
## Created with Unified Streaming Platform(version=1.9.4)

# AUDIO groups
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio-aacl-64",LANGUAGE="en",NAME="English",DEFAULT=YES,AUTOSELECT=YES,CHANNELS="2",URI="tears-of-steel-aac-64k.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio-aacl-128",LANGUAGE="en",NAME="English",DEFAULT=YES,AUTOSELECT=YES,CHANNELS="2",URI="tears-of-steel-aac-128k.m3u8"

# variants
#EXT-X-STREAM-INF:BANDWIDTH=1354000,AVERAGE-BANDWIDTH=474000,CODECS="avc1.64001F,mp4a.40.2",RESOLUTION=224x100,VIDEO-RANGE=SDR,AUDIO="audio-aacl-64",CLOSED-CAPTIONS=NONE
tears-of-steel-avc1-400k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2867000,AVERAGE-BANDWIDTH=827000,CODECS="avc1.64001F,mp4a.40.2",RESOLUTION=448x200,VIDEO-RANGE=SDR,AUDIO="audio-aacl-64",CLOSED-CAPTIONS=NONE
tears-of-steel-avc1-750k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=4486000,AVERAGE-BANDWIDTH=1094000,CODECS="avc1.64001F,mp4a.40.2",RESOLUTION=784x350,VIDEO-RANGE=SDR,AUDIO="audio-aacl-64",CLOSED-CAPTIONS=NONE
tears-of-steel-avc1-1000k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=9413000,AVERAGE-BANDWIDTH=1570000,CODECS="avc1.640028,mp4a.40.2",RESOLUTION=1680x750,VIDEO-RANGE=SDR,AUDIO="audio-aacl-64",CLOSED-CAPTIONS=NONE
tears-of-steel-avc1-1500k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=12173000,AVERAGE-BANDWIDTH=2273000,CODECS="avc1.640028,mp4a.40.2",RESOLUTION=1680x750,VIDEO-RANGE=SDR,AUDIO="audio-aacl-64",CLOSED-CAPTIONS=NONE
tears-of-steel-avc1-2200k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3760000,AVERAGE-BANDWIDTH=1100000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=1680x750,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-64",CLOSED-CAPTIONS=NONE
tears-of-steel-hev1-1100k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5186000,AVERAGE-BANDWIDTH=1317000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=2576x1150,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-64",CLOSED-CAPTIONS=NONE
tears-of-steel-hev1-1500k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=7145000,AVERAGE-BANDWIDTH=1668000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=3360x1500,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-64",CLOSED-CAPTIONS=NONE
tears-of-steel-hev1-2200k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1418000,AVERAGE-BANDWIDTH=539000,CODECS="avc1.64001F,mp4a.40.2",RESOLUTION=224x100,VIDEO-RANGE=SDR,AUDIO="audio-aacl-128",CLOSED-CAPTIONS=NONE
tears-of-steel-avc1-400k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2931000,AVERAGE-BANDWIDTH=892000,CODECS="avc1.64001F,mp4a.40.2",RESOLUTION=448x200,VIDEO-RANGE=SDR,AUDIO="audio-aacl-128",CLOSED-CAPTIONS=NONE
tears-of-steel-avc1-750k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=4550000,AVERAGE-BANDWIDTH=1159000,CODECS="avc1.64001F,mp4a.40.2",RESOLUTION=784x350,VIDEO-RANGE=SDR,AUDIO="audio-aacl-128",CLOSED-CAPTIONS=NONE
tears-of-steel-avc1-1000k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=9477000,AVERAGE-BANDWIDTH=1635000,CODECS="avc1.640028,mp4a.40.2",RESOLUTION=1680x750,VIDEO-RANGE=SDR,AUDIO="audio-aacl-128",CLOSED-CAPTIONS=NONE
tears-of-steel-avc1-1500k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=12237000,AVERAGE-BANDWIDTH=2338000,CODECS="avc1.640028,mp4a.40.2",RESOLUTION=1680x750,VIDEO-RANGE=SDR,AUDIO="audio-aacl-128",CLOSED-CAPTIONS=NONE
tears-of-steel-avc1-2200k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3824000,AVERAGE-BANDWIDTH=1165000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=1680x750,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-128",CLOSED-CAPTIONS=NONE
tears-of-steel-hev1-1100k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5250000,AVERAGE-BANDWIDTH=1382000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=2576x1150,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-128",CLOSED-CAPTIONS=NONE
tears-of-steel-hev1-1500k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=7209000,AVERAGE-BANDWIDTH=1733000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=3360x1500,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-128",CLOSED-CAPTIONS=NONE
tears-of-steel-hev1-2200k.m3u8

# keyframes
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=24000,AVERAGE-BANDWIDTH=15000,CODECS="avc1.64001F",RESOLUTION=224x100,VIDEO-RANGE=SDR,URI="tears-of-steel-avc1-400k-iframe.m3u8"
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=62000,AVERAGE-BANDWIDTH=32000,CODECS="avc1.64001F",RESOLUTION=448x200,VIDEO-RANGE=SDR,URI="tears-of-steel-avc1-750k-iframe.m3u8"
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=122000,AVERAGE-BANDWIDTH=52000,CODECS="avc1.64001F",RESOLUTION=784x350,VIDEO-RANGE=SDR,URI="tears-of-steel-avc1-1000k-iframe.m3u8"
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=268000,AVERAGE-BANDWIDTH=82000,CODECS="avc1.640028",RESOLUTION=1680x750,VIDEO-RANGE=SDR,URI="tears-of-steel-avc1-1500k-iframe.m3u8"
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=338000,AVERAGE-BANDWIDTH=109000,CODECS="avc1.640028",RESOLUTION=1680x750,VIDEO-RANGE=SDR,URI="tears-of-steel-avc1-2200k-iframe.m3u8"
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=233000,AVERAGE-BANDWIDTH=59000,CODECS="hev1.1.6.H150.90",RESOLUTION=1680x750,VIDEO-RANGE=SDR,URI="tears-of-steel-hev1-1100k-iframe.m3u8"
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=324000,AVERAGE-BANDWIDTH=73000,CODECS="hev1.1.6.H150.90",RESOLUTION=2576x1150,VIDEO-RANGE=SDR,URI="tears-of-steel-hev1-1500k-iframe.m3u8"
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=394000,AVERAGE-BANDWIDTH=88000,CODECS="hev1.1.6.H150.90",RESOLUTION=3360x1500,VIDEO-RANGE=SDR,URI="tears-of-steel-hev1-2200k-iframe.m3u8"
`;

const aac_64k = `#EXTM3U
#EXT-X-VERSION:6
## Created with Unified Streaming Platform(version=1.9.4)
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-TARGETDURATION:6
#EXT-X-MAP:URI="tears-of-steel-aac-64k.cmfa",BYTERANGE="704@0"
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:50379@2212
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49413@52591
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49545@102004
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49389@151549
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49856@200938
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49634@250794
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49501@300428
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49600@349929
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49777@399529
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49475@449306
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49563@498781
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49330@548344
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49590@597674
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49607@647264
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49417@696871
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49492@746288
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49718@795780
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49597@845498
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49405@895095
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49429@944500
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49627@993929
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49522@1043556
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49523@1093078
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49564@1142601
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49744@1192165
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49439@1241909
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49528@1291348
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49560@1340876
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49654@1390436
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49476@1440090
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49624@1489566
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49476@1539190
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49772@1588666
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49508@1638438
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49542@1687946
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49418@1737488
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49698@1786906
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49541@1836604
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49442@1886145
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49626@1935587
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49625@1985213
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49616@2034838
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49501@2084454
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49523@2133955
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49576@2183478
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49633@2233054
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49362@2282687
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49510@2332049
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49715@2381559
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49605@2431274
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49728@2480879
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49450@2530607
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49705@2580057
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49521@2629762
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49484@2679283
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49547@2728767
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49684@2778314
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49574@2827998
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49585@2877572
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49618@2927157
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49667@2976775
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49612@3026442
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49468@3076054
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49507@3125522
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49756@3175029
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49543@3224785
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49511@3274328
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49438@3323839
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49755@3373277
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49482@3423032
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49511@3472514
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49417@3522025
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49683@3571442
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49485@3621125
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49648@3670610
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49294@3720258
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49663@3769552
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49573@3819215
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49540@3868788
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49488@3918328
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49733@3967816
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49429@4017549
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49521@4066978
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49445@4116499
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49784@4165944
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49465@4215728
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49485@4265193
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49579@4314678
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49589@4364257
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49485@4413846
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49551@4463331
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49404@4512882
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49616@4562286
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49525@4611902
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49476@4661427
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49632@4710903
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49484@4760535
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49446@4810019
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49555@4859465
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49519@4909020
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49803@4958539
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49531@5008342
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49489@5057873
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49491@5107362
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49702@5156853
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49657@5206555
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49428@5256212
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49466@5305640
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49622@5355106
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49427@5404728
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49400@5454155
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49466@5503555
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49644@5553021
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49512@5602665
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49568@5652177
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49522@5701745
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49666@5751267
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49550@5800933
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49406@5850483
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49456@5899889
tears-of-steel-aac-64k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:49594@5949345
tears-of-steel-aac-64k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:49725@5998939
tears-of-steel-aac-64k.cmfa
#EXTINF:1.947, no desc
#EXT-X-BYTERANGE:8547@6048664
tears-of-steel-aac-64k.cmfa
#EXT-X-ENDLIST
#USP-X-MEDIA:BANDWIDTH=67000,AVERAGE-BANDWIDTH=66000,TYPE=AUDIO,GROUP-ID="audio-aacl-64",LANGUAGE="en",NAME="English",AUTOSELECT=YES,CHANNELS="2",CODECS="mp4a.40.2"
`;

const aac_128k = `#EXTM3U
#EXT-X-VERSION:6
## Created with Unified Streaming Platform(version=1.9.4)
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-TARGETDURATION:6
#EXT-X-MAP:URI="tears-of-steel-aac-128k.cmfa",BYTERANGE="704@0"
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98504@2212
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97639@100716
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97638@198355
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97437@295993
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98362@393430
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97881@491792
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97241@589673
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97760@686914
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98123@784674
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97403@882797
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97831@980200
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97226@1078031
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97804@1175257
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97546@1273061
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97384@1370607
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97562@1467991
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98016@1565553
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97699@1663569
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97654@1761268
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97396@1858922
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97785@1956318
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97686@2054103
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97600@2151789
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97578@2249389
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98015@2346967
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97664@2444982
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97738@2542646
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97744@2640384
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97976@2738128
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97453@2836104
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97889@2933557
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97800@3031446
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98028@3129246
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97602@3227274
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97539@3324876
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97404@3422415
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98071@3519819
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97488@3617890
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97552@3715378
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97882@3812930
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97782@3910812
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:98046@4008594
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97366@4106640
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97490@4204006
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97536@4301496
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:98137@4399032
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97218@4497169
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97449@4594387
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98069@4691836
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97583@4789905
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97871@4887488
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97401@4985359
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97863@5082760
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97759@5180623
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97668@5278382
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97758@5376050
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98330@5473808
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97283@5572138
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97652@5669421
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97767@5767073
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97982@5864840
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97479@5962822
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97437@6060301
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97490@6157738
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98087@6255228
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97813@6353315
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97566@6451128
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97405@6548694
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98016@6646099
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97500@6744115
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97475@6841615
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97322@6939090
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97916@7036412
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97481@7134328
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97836@7231809
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97141@7329645
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97857@7426786
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97570@7524643
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97607@7622213
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97452@7719820
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97877@7817272
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97435@7915149
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97526@8012584
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97596@8110110
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98228@8207706
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97407@8305934
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97244@8403341
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97312@8500585
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98060@8597897
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97430@8695957
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97529@8793387
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97519@8890916
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97731@8988435
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97508@9086166
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97502@9183674
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:98057@9281176
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97548@9379233
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97317@9476781
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97731@9574098
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97703@9671829
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98091@9769532
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97517@9867623
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97843@9965140
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97424@10062983
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97851@10160407
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97898@10258258
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97384@10356156
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97371@10453540
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97762@10550911
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97361@10648673
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97327@10746034
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97445@10843361
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:98226@10940806
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97239@11039032
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:98084@11136271
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97678@11234355
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97814@11332033
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97460@11429847
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97190@11527307
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:97405@11624497
tears-of-steel-aac-128k.cmfa
#EXTINF:6.016, no desc
#EXT-X-BYTERANGE:97758@11721902
tears-of-steel-aac-128k.cmfa
#EXTINF:5.994666, no desc
#EXT-X-BYTERANGE:96111@11819660
tears-of-steel-aac-128k.cmfa
#EXTINF:1.947, no desc
#EXT-X-BYTERANGE:18421@11915771
tears-of-steel-aac-128k.cmfa
#EXT-X-ENDLIST
#USP-X-MEDIA:BANDWIDTH=131000,AVERAGE-BANDWIDTH=131000,TYPE=AUDIO,GROUP-ID="audio-aacl-128",LANGUAGE="en",NAME="English",AUTOSELECT=YES,CHANNELS="2",CODECS="mp4a.40.2"
`;

const avc1_400k = `#EXTM3U
#EXT-X-VERSION:6
## Created with Unified Streaming Platform(version=1.9.4)
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-TARGETDURATION:8
#EXT-X-MAP:URI="tears-of-steel-avc1-400k.cmfv",BYTERANGE="761@0"
#EXTINF:8, no desc
#EXT-X-BYTERANGE:14305@1897
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1286438@16202
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:244781@1302640
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:338139@1547421
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:347100@1885560
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:510892@2232660
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:464507@2743552
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:253075@3208059
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:158066@3461134
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:431837@3619200
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:410500@4051037
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:372384@4461537
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:333301@4833921
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:414709@5167222
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:415690@5581931
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:479560@5997621
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:364418@6477181
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:302825@6841599
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:372049@7144424
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:472678@7516473
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:586144@7989151
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:375937@8575295
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:342295@8951232
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:487581@9293527
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:416942@9781108
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:492857@10198050
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:625553@10690907
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:572055@11316460
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:349158@11888515
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:355834@12237673
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:325854@12593507
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:371624@12919361
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:474347@13290985
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:512359@13765332
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:452982@14277691
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:432863@14730673
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:419992@15163536
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:387495@15583528
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:312740@15971023
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:208010@16283763
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:218630@16491773
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:363173@16710403
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:341861@17073576
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:381436@17415437
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:320421@17796873
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:261206@18117294
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:397100@18378500
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:516472@18775600
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:359290@19292072
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:322412@19651362
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:384462@19973774
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:399765@20358236
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:594504@20758001
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:380260@21352505
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:527846@21732765
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:426959@22260611
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:383735@22687570
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:483259@23071305
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:770807@23554564
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:591084@24325371
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:372065@24916455
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:506464@25288520
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:497358@25794984
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:322302@26292342
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:335323@26614644
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:460310@26949967
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:205082@27410277
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:325285@27615359
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:321554@27940644
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:243353@28262198
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:316265@28505551
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:585825@28821816
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:380155@29407641
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:311424@29787796
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:474319@30099220
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:451205@30573539
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:405180@31024744
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:430531@31429924
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:289736@31860455
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:330147@32150191
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:424184@32480338
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:415344@32904522
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:564741@33319866
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:493702@33884607
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:460392@34378309
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:495822@34838701
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:464360@35334523
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:218422@35798883
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:196387@36017305
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:495789@36213692
tears-of-steel-avc1-400k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:531690@36709481
tears-of-steel-avc1-400k.cmfv
#EXTINF:6, no desc
#EXT-X-BYTERANGE:131876@37241171
tears-of-steel-avc1-400k.cmfv
#EXT-X-ENDLIST
#USP-X-MEDIA:BANDWIDTH=1287000,AVERAGE-BANDWIDTH=408000,TYPE=VIDEO,GROUP-ID="video-avc1-405",LANGUAGE="en",NAME="English",AUTOSELECT=YES,CODECS="avc1.64001F",RESOLUTION=224x100,VIDEO-RANGE=SDR
`;

const avc1_750k = `#EXTM3U
#EXT-X-VERSION:6
## Created with Unified Streaming Platform(version=1.9.4)
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-TARGETDURATION:8
#EXT-X-MAP:URI="tears-of-steel-avc1-750k.cmfv",BYTERANGE="760@0"
#EXTINF:8, no desc
#EXT-X-BYTERANGE:25614@1896
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2799156@27510
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:397356@2826666
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:478294@3224022
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:503727@3702316
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:974356@4206043
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:793885@5180399
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:442548@5974284
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:224544@6416832
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:890830@6641376
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:746493@7532206
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:744372@8278699
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:639446@9023071
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:863968@9662517
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:707660@10526485
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:854457@11234145
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:600055@12088602
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:530076@12688657
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:733421@13218733
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:994380@13952154
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1046363@14946534
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:761235@15992897
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:656178@16754132
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:908670@17410310
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:732998@18318980
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:887429@19051978
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1247631@19939407
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1201653@21187038
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:579929@22388691
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:654058@22968620
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:552727@23622678
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:653006@24175405
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:977490@24828411
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:991244@25805901
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:749627@26797145
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:688022@27546772
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:769671@28234794
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:684908@29004465
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:580458@29689373
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:373785@30269831
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:399168@30643616
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:711283@31042784
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:662136@31754067
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:734922@32416203
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:611443@33151125
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:484631@33762568
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:748580@34247199
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:916965@34995779
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:639981@35912744
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:557017@36552725
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:718160@37109742
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:748409@37827902
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1228922@38576311
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:717461@39805233
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1042748@40522694
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:775841@41565442
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:654846@42341283
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:849712@42996129
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1548638@43845841
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1327608@45394479
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:691922@46722087
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:909622@47414009
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:950709@48323631
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:577873@49274340
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:600589@49852213
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:877394@50452802
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:364698@51330196
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:575335@51694894
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:529952@52270229
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:415572@52800181
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:590778@53215753
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1205977@53806531
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:873605@55012508
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:692750@55886113
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:994109@56578863
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:892050@57572972
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:826522@58465022
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:769351@59291544
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:500504@60060895
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:558914@60561399
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:720076@61120313
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:801893@61840389
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:961331@62642282
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:882286@63603613
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:929566@64485899
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:855672@65415465
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:792676@66271137
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:401474@67063813
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:321032@67465287
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:896445@67786319
tears-of-steel-avc1-750k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:838295@68682764
tears-of-steel-avc1-750k.cmfv
#EXTINF:6, no desc
#EXT-X-BYTERANGE:250648@69521059
tears-of-steel-avc1-750k.cmfv
#EXT-X-ENDLIST
#USP-X-MEDIA:BANDWIDTH=2800000,AVERAGE-BANDWIDTH=761000,TYPE=VIDEO,GROUP-ID="video-avc1-759",LANGUAGE="en",NAME="English",AUTOSELECT=YES,CODECS="avc1.64001F",RESOLUTION=448x200,VIDEO-RANGE=SDR
`;

const avc1_1000k = `#EXTM3U
#EXT-X-VERSION:6
## Created with Unified Streaming Platform(version=1.9.4)
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-TARGETDURATION:8
#EXT-X-MAP:URI="tears-of-steel-avc1-1000k.cmfv",BYTERANGE="761@0"
#EXTINF:8, no desc
#EXT-X-BYTERANGE:44325@1897
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:4418340@46222
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:504112@4464562
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:514797@4968674
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:506195@5483471
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1192131@5989666
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:919743@7181797
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:532717@8101540
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:274712@8634257
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1159223@8908969
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:959703@10068192
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1014218@11027895
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:824637@12042113
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1228103@12866750
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:902944@14094853
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1112096@14997797
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:754311@16109893
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:713049@16864204
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:949709@17577253
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1316235@18526962
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1278326@19843197
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1000318@21121523
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:969579@22121841
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1392761@23091420
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:936795@24484181
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1141588@25420976
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1724277@26562564
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1750407@28286841
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:704371@30037248
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:890051@30741619
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:680173@31631670
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:875679@32311843
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1275328@33187522
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1258817@34462850
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:921689@35721667
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:862492@36643356
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1019007@37505848
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:920533@38524855
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:808573@39445388
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:497363@40253961
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:523848@40751324
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:968047@41275172
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:891659@42243219
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:962395@43134878
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:795735@44097273
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:651325@44893008
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:996537@45544333
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1224503@46540870
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:855975@47765373
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:697074@48621348
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:916472@49318422
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:996326@50234894
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1735404@51231220
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:943466@52966624
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1462424@53910090
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1061709@55372514
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:829613@56434223
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1183458@57263836
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2175909@58447294
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1883904@60623203
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:924933@62507107
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1216706@63432040
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1290509@64648746
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:739758@65939255
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:733272@66679013
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1165406@67412285
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:454485@68577691
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:745442@69032176
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:689000@69777618
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:548118@70466618
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:725761@71014736
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1617816@71740497
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1175835@73358313
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1020491@74534148
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1519291@75554639
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1345526@77073930
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1212722@78419456
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1042240@79632178
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:665902@80674418
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:718153@81340320
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:978887@82058473
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1145573@83037360
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1984259@84182933
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1658658@86167192
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1550054@87825850
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1412753@89375904
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1290503@90788657
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:427332@92079160
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:288229@92506492
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:766555@92794721
tears-of-steel-avc1-1000k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:571234@93561276
tears-of-steel-avc1-1000k.cmfv
#EXTINF:6, no desc
#EXT-X-BYTERANGE:146792@94132510
tears-of-steel-avc1-1000k.cmfv
#EXT-X-ENDLIST
#USP-X-MEDIA:BANDWIDTH=4419000,AVERAGE-BANDWIDTH=1028000,TYPE=VIDEO,GROUP-ID="video-avc1-1026",LANGUAGE="en",NAME="English",AUTOSELECT=YES,CODECS="avc1.64001F",RESOLUTION=784x350,VIDEO-RANGE=SDR
`;

const avc1_1500k = `#EXTM3U
#EXT-X-VERSION:6
## Created with Unified Streaming Platform(version=1.9.4)
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-TARGETDURATION:8
#EXT-X-MAP:URI="tears-of-steel-avc1-1500k.cmfv",BYTERANGE="762@0"
#EXTINF:8, no desc
#EXT-X-BYTERANGE:105807@1898
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:9345221@107705
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:735562@9452926
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:706721@10188488
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:652647@10895209
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1465650@11547856
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1188943@13013506
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:621854@14202449
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:248660@14824303
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1146296@15072963
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1135658@16219259
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1232895@17354917
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1067235@18587812
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1677446@19655047
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1306905@21332493
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1647080@22639398
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1114322@24286478
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1032710@25400800
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1385044@26433510
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1822220@27818554
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1872797@29640774
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1488652@31513571
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1495768@33002223
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2125568@34497991
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1421608@36623559
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1728098@38045167
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2703337@39773265
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2744410@42476602
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1038822@45221012
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1345882@46259834
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:983200@47605716
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1326567@48588916
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1845210@49915483
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1791637@51760693
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1336976@53552330
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1254014@54889306
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1552939@56143320
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1429666@57696259
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1335038@59125925
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:768271@60460963
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:793628@61229234
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1429261@62022862
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1314928@63452123
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1417251@64767051
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1120881@66184302
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:972686@67305183
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1496704@68277869
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1889292@69774573
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1298018@71663865
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1035437@72961883
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1325861@73997320
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1445340@75323181
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2649335@76768521
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1411774@79417856
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2210533@80829630
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1620330@83040163
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1271177@84660493
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1699755@85931670
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3372085@87631425
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2813505@91003510
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1426947@93817015
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1896377@95243962
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1958693@97140339
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1093133@99099032
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1020655@100192165
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1766038@101212820
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:698427@102978858
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1139572@103677285
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:966031@104816857
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:858016@105782888
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:984249@106640904
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2379328@107625153
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1747660@110004481
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1620284@111752141
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2725177@113372425
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2332849@116097602
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1911463@118430451
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1664081@120341914
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1013371@122005995
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:856078@123019366
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1124738@123875444
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1270742@125000182
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1554049@126270924
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1505852@127824973
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1511746@129330825
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1454708@130842571
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1388534@132297279
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:720787@133685813
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:592758@134406600
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1552329@134999358
tears-of-steel-avc1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1074409@136551687
tears-of-steel-avc1-1500k.cmfv
#EXTINF:6, no desc
#EXT-X-BYTERANGE:284943@137626096
tears-of-steel-avc1-1500k.cmfv
#EXT-X-ENDLIST
#USP-X-MEDIA:BANDWIDTH=9346000,AVERAGE-BANDWIDTH=1504000,TYPE=VIDEO,GROUP-ID="video-avc1-1501",LANGUAGE="en",NAME="English",AUTOSELECT=YES,CODECS="avc1.640028",RESOLUTION=1680x750,VIDEO-RANGE=SDR
`;

const avc1_2200k = `#EXTM3U
#EXT-X-VERSION:6
## Created with Unified Streaming Platform(version=1.9.4)
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-TARGETDURATION:8
#EXT-X-MAP:URI="tears-of-steel-avc1-2200k.cmfv",BYTERANGE="762@0"
#EXTINF:8, no desc
#EXT-X-BYTERANGE:105315@1898
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:12105186@107213
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1048914@12212399
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:997293@13261313
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:928518@14258606
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2111138@15187124
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1701649@17298262
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:962380@18999911
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:463335@19962291
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2109502@20425626
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2032831@22535128
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2086250@24567959
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1811131@26654209
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2661924@28465340
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2046817@31127264
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2409728@33174081
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1701294@35583809
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1617627@37285103
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2097961@38902730
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2698788@41000691
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2595494@43699479
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2201020@46294973
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2269544@48495993
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3130224@50765537
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1998435@53895761
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2471186@55894196
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3777285@58365382
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:4075483@62142667
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1464170@66218150
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2015151@67682320
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1468487@69697471
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1951973@71165958
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2680204@73117931
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2571656@75798135
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1860511@78369791
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1799976@80230302
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2195506@82030278
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2061633@84225784
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1970565@86287417
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1177719@88257982
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1240103@89435701
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2168595@90675804
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1958311@92844399
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2107379@94802710
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1650470@96910089
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1481115@98560559
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2194235@100041674
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2728982@102235909
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1961300@104964891
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1570592@106926191
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1957814@108496783
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2219645@110454597
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3765662@112674242
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2099911@116439904
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3359454@118539815
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2271052@121899269
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1772104@124170321
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2437476@125942425
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:4756551@128379901
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:4117885@133136452
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2088023@137254337
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2607027@139342360
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2808826@141949387
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1596526@144758213
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1517197@146354739
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2558393@147871936
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1016956@150430329
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1663260@151447285
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1526225@153110545
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1262149@154636770
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1487914@155898919
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3504787@157386833
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2627443@160891620
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2575826@163519063
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:4329431@166094889
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3622472@170424320
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2954173@174046792
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2436182@177000965
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1543368@179437147
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1176239@180980515
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1563407@182156754
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1799681@183720161
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2255098@185519842
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2195125@187774940
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2222305@189970065
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2100707@192192370
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2009166@194293077
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1005297@196302243
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:832229@197307540
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2255109@198139769
tears-of-steel-avc1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1647846@200394878
tears-of-steel-avc1-2200k.cmfv
#EXTINF:6, no desc
#EXT-X-BYTERANGE:424839@202042724
tears-of-steel-avc1-2200k.cmfv
#EXT-X-ENDLIST
#USP-X-MEDIA:BANDWIDTH=12106000,AVERAGE-BANDWIDTH=2207000,TYPE=VIDEO,GROUP-ID="video-avc1-2205",LANGUAGE="en",NAME="English",AUTOSELECT=YES,CODECS="avc1.640028",RESOLUTION=1680x750,VIDEO-RANGE=SDR
`;

const hev1_1100k = `#EXTM3U
#EXT-X-VERSION:6
## Created with Unified Streaming Platform(version=1.9.4)
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-TARGETDURATION:8
#EXT-X-MAP:URI="tears-of-steel-hev1-1100k.cmfv",BYTERANGE="2901@0"
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:40135@4037
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1232488@44172
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:504668@1276660
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:577782@1781328
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:506323@2359110
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1348550@2865433
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:1228050@4213983
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:500500@5442033
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:156092@5942533
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:733534@6098625
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:494978@6832159
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:611369@7327137
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:403131@7938506
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:697524@8341637
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:411131@9039161
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:674855@9450292
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:369705@10125147
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:244393@10494852
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:414889@10739245
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:513868@11154134
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:710349@11668002
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:526491@12378351
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:497378@12904842
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:885302@13402220
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:573314@14287522
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:794296@14860836
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:1441737@15655132
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2078163@17096869
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:673990@19175032
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:920237@19849022
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:559957@20769259
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:743103@21329216
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1338539@22072319
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1402645@23410858
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1028501@24813503
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:914359@25842004
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1027043@26756363
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:1008100@27783406
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:871739@28791506
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:356539@29663245
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:340018@30019784
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:658398@30359802
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:627561@31018200
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:663508@31645761
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:449405@32309269
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:352171@32758674
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:590288@33110845
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:789734@33701133
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:521553@34490867
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:356043@35012420
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:472008@35368463
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:504094@35840471
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1175935@36344565
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:587205@37520500
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1115453@38107705
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:844753@39223158
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:557262@40067911
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:858513@40625173
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2057296@41483686
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2502556@43540982
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:1075556@46043538
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:1369967@47119094
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1742135@48489061
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:925148@50231196
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:858313@51156344
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:1403670@52014657
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:416965@53418327
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:750322@53835292
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:560275@54585614
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:411179@55145889
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:493940@55557068
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:1460252@56051008
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1073974@57511260
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1445438@58585234
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:3539237@60030672
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:3711325@63569909
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:3276172@67281234
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:2713068@70557406
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1674775@73270474
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:908406@74945249
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1274710@75853655
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1546408@77128365
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2629102@78674773
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2554416@81303875
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2624573@83858291
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2606573@86482864
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2491974@89089437
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1105783@91581411
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:428344@92687194
tears-of-steel-hev1-1100k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:999022@93115538
tears-of-steel-hev1-1100k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:549454@94114560
tears-of-steel-hev1-1100k.cmfv
#EXTINF:6.125, no desc
#EXT-X-BYTERANGE:146351@94664014
tears-of-steel-hev1-1100k.cmfv
#EXT-X-ENDLIST
#USP-X-MEDIA:BANDWIDTH=3693000,AVERAGE-BANDWIDTH=1034000,TYPE=VIDEO,GROUP-ID="video-hev1-1032",LANGUAGE="en",NAME="English",AUTOSELECT=YES,CODECS="hev1.1.6.H150.90",RESOLUTION=1680x750,FRAME-RATE=24,VIDEO-RANGE=SDR
`;

const hev1_1500k = `#EXTM3U
#EXT-X-VERSION:6
## Created with Unified Streaming Platform(version=1.9.4)
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-TARGETDURATION:8
#EXT-X-MAP:URI="tears-of-steel-hev1-1500k.cmfv",BYTERANGE="2901@0"
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:54043@4037
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1470128@58080
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:597594@1528208
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:656570@2125802
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:574479@2782372
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:1555340@3356851
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1494325@4912191
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:610136@6406516
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:183858@7016652
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:813067@7200510
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:608050@8013577
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:735353@8621627
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:487055@9356980
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:836222@9844035
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:511151@10680257
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:809575@11191408
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:457452@12000983
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:307186@12458435
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:517090@12765621
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:584503@13282711
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:915173@13867214
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:611939@14782387
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:592339@15394326
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:955821@15986665
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:693066@16942486
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:949270@17635552
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:1806336@18584822
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2500143@20391158
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:800875@22891301
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:1117547@23692176
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:661553@24809723
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:891500@25471276
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1567455@26362776
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1598496@27930231
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1281190@29528727
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1051038@30809917
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1203909@31860955
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:1171598@33064864
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1124972@34236462
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:449171@35361434
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:432363@35810605
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:818470@36242968
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:771149@37061438
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:793860@37832587
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:540589@38626447
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:431356@39167036
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:714238@39598392
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:994506@40312630
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:650641@41307136
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:437573@41957777
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:560892@42395350
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:602248@42956242
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1432276@43558490
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:734494@44990766
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:1381238@45725260
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:1066845@47106498
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:710845@48173343
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1007917@48884188
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2579547@49892105
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:2941677@52471652
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1319467@55413329
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:1770548@56732796
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2168059@58503344
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1064103@60671403
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:918839@61735506
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:1711610@62654345
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:513903@64365955
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:931114@64879858
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:630017@65810972
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:508481@66440989
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:572648@66949470
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:1758534@67522118
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1211070@69280652
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1833731@70491722
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:4900522@72325453
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:5145294@77225975
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:4383038@82371269
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:3639212@86754307
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:2423910@90393519
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1111147@92817429
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1491735@93928576
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1760558@95420311
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2845968@97180869
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2785919@100026837
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2833458@102812756
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2823378@105646214
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2722917@108469592
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1237297@111192509
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:501731@112429806
tears-of-steel-hev1-1500k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:1099221@112931537
tears-of-steel-hev1-1500k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:586394@114030758
tears-of-steel-hev1-1500k.cmfv
#EXTINF:6.125, no desc
#EXT-X-BYTERANGE:163363@114617152
tears-of-steel-hev1-1500k.cmfv
#EXT-X-ENDLIST
#USP-X-MEDIA:BANDWIDTH=5119000,AVERAGE-BANDWIDTH=1251000,TYPE=VIDEO,GROUP-ID="video-hev1-1250",LANGUAGE="en",NAME="English",AUTOSELECT=YES,CODECS="hev1.1.6.H150.90",RESOLUTION=2576x1150,FRAME-RATE=24,VIDEO-RANGE=SDR
`;

const hev1_2200k = `#EXTM3U
#EXT-X-VERSION:6
## Created with Unified Streaming Platform(version=1.9.4)
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-TARGETDURATION:8
#EXT-X-MAP:URI="tears-of-steel-hev1-2200k.cmfv",BYTERANGE="2901@0"
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:71216@4037
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1876527@75253
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:763529@1951780
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:818762@2715309
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:712564@3534071
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1943926@4246635
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:1868823@6190561
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:776167@8059384
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:230352@8835551
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:994835@9065903
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:785874@10060738
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:949691@10846612
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:629014@11796303
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1060355@12425317
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:679113@13485672
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1038762@14164785
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:600905@15203547
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:406502@15804452
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:674009@16210954
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:756106@16884963
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1226561@17641069
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:794570@18867630
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:768281@19662200
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1199069@20430481
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:890241@21629550
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:1212626@22519791
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:2356165@23732417
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3182372@26088582
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1020908@29270954
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:1458268@30291862
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:859756@31750130
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:1149534@32609886
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1987767@33759420
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1987061@35747187
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1979919@37734248
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1346200@39714167
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1520006@41060367
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:1467743@42580373
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:1477179@44048116
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:602015@45525295
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:570446@46127310
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1064336@46697756
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1001221@47762092
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1019922@48763313
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:698417@49783235
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:564555@50481652
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:906564@51046207
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:1297566@51952771
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:852955@53250337
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:578198@54103292
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:720652@54681490
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:774582@55402142
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1823083@56176724
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:945909@57999807
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1734823@58945716
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:1369127@60680539
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:944733@62049666
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1293259@62994399
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:3407192@64287658
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.958333, no desc
#EXT-X-BYTERANGE:3544590@67694850
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:1746512@71239440
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:2308760@72985952
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2760981@75294712
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:1324436@78055693
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:1112394@79380129
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:2188036@80492523
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:675893@82680559
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:1189262@83356452
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:798722@84545714
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:665705@85344436
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:725833@86010141
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.916666, no desc
#EXT-X-BYTERANGE:2246870@86735974
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1518251@88982844
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2482553@90501095
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.083333, no desc
#EXT-X-BYTERANGE:6903809@92983648
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.041666, no desc
#EXT-X-BYTERANGE:7114013@99887457
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:6059050@107001470
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:4872596@113060520
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3414339@117933116
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1356657@121347455
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1782558@122704112
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:2125466@124486670
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3241497@126612136
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3139785@129853633
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3227748@132993418
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3215030@136221166
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:3081497@139436196
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:1436026@142517693
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8.125, no desc
#EXT-X-BYTERANGE:651166@143953719
tears-of-steel-hev1-2200k.cmfv
#EXTINF:7.875, no desc
#EXT-X-BYTERANGE:1384744@144604885
tears-of-steel-hev1-2200k.cmfv
#EXTINF:8, no desc
#EXT-X-BYTERANGE:743407@145989629
tears-of-steel-hev1-2200k.cmfv
#EXTINF:6.125, no desc
#EXT-X-BYTERANGE:206613@146733036
tears-of-steel-hev1-2200k.cmfv
#EXT-X-ENDLIST
#USP-X-MEDIA:BANDWIDTH=7078000,AVERAGE-BANDWIDTH=1602000,TYPE=VIDEO,GROUP-ID="video-hev1-1600",LANGUAGE="en",NAME="English",AUTOSELECT=YES,CODECS="hev1.1.6.H150.90",RESOLUTION=3360x1500,FRAME-RATE=24,VIDEO-RANGE=SDR
`;

const hlsPlaylist0 = [
	aac_64k,
	aac_128k,
	avc1_400k,
	avc1_750k,
	avc1_1000k,
	avc1_1500k,
	avc1_2200k,
	hev1_1100k,
	hev1_1500k,
	hev1_2200k,
];

export { hlsMain0, hlsPlaylist0 };
