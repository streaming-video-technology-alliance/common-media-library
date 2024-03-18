const hlsMain2 = `#EXTM3U
#EXT-X-VERSION:4
## Created with Unified Streaming Platform(version=1.8.5)

# AUDIO groups
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio-aacl-64",LANGUAGE="en",NAME="English",DEFAULT=YES,AUTOSELECT=YES,CHANNELS="2",URI="tears-of-steel-aac-64k.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio-aacl-128",LANGUAGE="en",NAME="English",DEFAULT=YES,AUTOSELECT=YES,CHANNELS="2",URI="audio-aac-128k.m3u8"

# variants
#EXT-X-STREAM-INF:BANDWIDTH=3761000,AVERAGE-BANDWIDTH=1101000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=1680x750,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-64"
tears-of-steel-hev1-1100k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5187000,AVERAGE-BANDWIDTH=1318000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=2576x1150,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-64"
video-hev1-1500k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=7146000,AVERAGE-BANDWIDTH=1669000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=3360x1500,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-64"
tears-of-steel-hev1-2200k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3825000,AVERAGE-BANDWIDTH=1166000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=1680x750,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-128"
tears-of-steel-hev1-1100k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5251000,AVERAGE-BANDWIDTH=1383000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=2576x1150,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-128"
video-hev1-1500k.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=7210000,AVERAGE-BANDWIDTH=1734000,CODECS="hev1.1.6.H150.90,mp4a.40.2",RESOLUTION=3360x1500,FRAME-RATE=24,VIDEO-RANGE=SDR,AUDIO="audio-aacl-128"
tears-of-steel-hev1-2200k.m3u8

# keyframes
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=233000,AVERAGE-BANDWIDTH=59000,CODECS="hev1.1.6.H150.90",RESOLUTION=1680x750,VIDEO-RANGE=SDR,URI="tears-of-steel-iframe-hev1-1100k.m3u8"
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=324000,AVERAGE-BANDWIDTH=73000,CODECS="hev1.1.6.H150.90",RESOLUTION=2576x1150,VIDEO-RANGE=SDR,URI="tears-of-steel-iframe-hev1-1500k.m3u8"
#EXT-X-I-FRAME-STREAM-INF:BANDWIDTH=394000,AVERAGE-BANDWIDTH=88000,CODECS="hev1.1.6.H150.90",RESOLUTION=3360x1500,VIDEO-RANGE=SDR,URI="tears-of-steel-iframe-hev1-2200k.m3u8"
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

const hlsPlaylist2 = [aac_128k, hev1_1500k];

export { hlsMain2, hlsPlaylist2 };
