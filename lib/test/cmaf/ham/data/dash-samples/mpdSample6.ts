export const mpdSample6: string = `<?xml version="1.0" encoding="utf-8"?>
<!--
Version information:
Axinom.MediaProcessing v3.0.0 targeting General Purpose Media Format specification v7
ffmpeg version N-81423-g61fac0e Copyright (c) 2000-2016 the FFmpeg developers
x265 [info]: HEVC encoder version 2.0+12-49a0d1176aef5bc6
x264 0.148.2705 3f5ed56
MP4Box - GPAC version 0.6.2-DEV-rev683-g7b29fbe-master
MediaInfoLib - v0.7.87

For more info about this video, see https://github.com/Axinom/dash-test-vectors
-->
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"
		minBufferTime="PT1.500S"
		type="static"
		mediaPresentationDuration="PT0H12M14.000S"
		maxSegmentDuration="PT0H0M4.000S"
		profiles="urn:mpeg:dash:profile:isoff-live:2011,http://dashif.org/guidelines/dash264">
    <Period duration="PT0H12M14.000S">
        <AdaptationSet segmentAlignment="true" group="1" maxWidth="3840" maxHeight="2160" maxFrameRate="24" par="16:9" lang="und">
            <Role schemeIdUri="urn:mpeg:dash:role:2011" value="main" />
            <SegmentTemplate timescale="24" media="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/$Number%04d$.m4s" startNumber="1" duration="96" initialization="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/init.mp4" />
            <Representation id="1" mimeType="video/mp4" codecs="avc1.64001f" width="512" height="288" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="386437"></Representation>
            <Representation id="2" mimeType="video/mp4" codecs="avc1.64001f" width="640" height="360" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="761570"></Representation>
            <Representation id="3" mimeType="video/mp4" codecs="avc1.640028" width="852" height="480" frameRate="24" sar="640:639" startWithSAP="1" bandwidth="1117074"></Representation>
            <Representation id="4" mimeType="video/mp4" codecs="avc1.640032" width="1280" height="720" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="1941893"></Representation>
            <Representation id="5" mimeType="video/mp4" codecs="avc1.640033" width="1920" height="1080" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="2723012"></Representation>
            <Representation id="6" mimeType="video/mp4" codecs="avc1.640034" width="2560" height="1440" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="4021190"></Representation>
            <Representation id="7" mimeType="video/mp4" codecs="avc1.640034" width="3840" height="2160" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="5134121"></Representation>
        </AdaptationSet>
        <AdaptationSet segmentAlignment="true" group="1" maxWidth="3840" maxHeight="2160" maxFrameRate="24" par="16:9" lang="und">
            <Role schemeIdUri="urn:mpeg:dash:role:2011" value="main" />
            <SegmentTemplate timescale="1200000" media="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/$Number%04d$.m4s" startNumber="1" duration="4799983" initialization="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/init.mp4" />
            <Representation id="8" mimeType="video/mp4" codecs="hev1.2.4.L63.90" width="512" height="288" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="395735"></Representation>
            <Representation id="9" mimeType="video/mp4" codecs="hev1.2.4.L63.90" width="640" height="360" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="689212"></Representation>
            <Representation id="10" mimeType="video/mp4" codecs="hev1.2.4.L90.90" width="852" height="480" frameRate="24" sar="640:639" startWithSAP="1" bandwidth="885518"></Representation>
            <Representation id="11" mimeType="video/mp4" codecs="hev1.2.4.L93.90" width="1280" height="720" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="1474186"></Representation>
            <Representation id="12" mimeType="video/mp4" codecs="hev1.2.4.L120.90" width="1920" height="1080" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="1967542"></Representation>
            <Representation id="13" mimeType="video/mp4" codecs="hev1.2.4.L150.90" width="2560" height="1440" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="2954309"></Representation>
            <Representation id="14" mimeType="video/mp4" codecs="hev1.2.4.L150.90" width="3840" height="2160" frameRate="24" sar="1:1" startWithSAP="1" bandwidth="4424584"></Representation>
        </AdaptationSet>
        <AdaptationSet segmentAlignment="true" group="2" lang="en">
            <Role schemeIdUri="urn:mpeg:dash:role:2011" value="main" />
            <SegmentTemplate timescale="24000" media="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/$Number%04d$.m4s" startNumber="1" duration="95232" initialization="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/init.mp4" />
            <Representation id="15" mimeType="audio/mp4" codecs="mp4a.40.29" audioSamplingRate="48000" startWithSAP="1" bandwidth="131351">
                <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2" />
            </Representation>
        </AdaptationSet>
        <AdaptationSet segmentAlignment="true" group="3" lang="en">
            <Role schemeIdUri="urn:mpeg:dash:role:2011" value="main" />
            <Role schemeIdUri="urn:mpeg:dash:role:2011" value="subtitle" />
            <SegmentTemplate timescale="1000" media="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/$Number%04d$.m4s" startNumber="1" duration="4000" initialization="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/init.mp4" />
            <Representation id="18" mimeType="application/mp4" codecs="wvtt" startWithSAP="1" bandwidth="428"></Representation>
        </AdaptationSet>
        <AdaptationSet segmentAlignment="true" group="3" lang="en">
            <Role schemeIdUri="urn:mpeg:dash:role:2011" value="main" />
            <Role schemeIdUri="urn:mpeg:dash:role:2011" value="subtitle" />
            <SegmentTemplate timescale="1000" media="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/$Number%04d$.m4s" startNumber="1" duration="4000" initialization="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/init.mp4" />
            <Representation id="19" mimeType="application/mp4" codecs="stpp" startWithSAP="1" bandwidth="1095"></Representation>
        </AdaptationSet>
        <AdaptationSet segmentAlignment="true" group="3" lang="es">
            <Role schemeIdUri="urn:mpeg:dash:role:2011" value="subtitle" />
            <SegmentTemplate timescale="1000" media="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/$Number%04d$.m4s" startNumber="1" duration="4000" initialization="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/init.mp4" />
            <Representation id="26" mimeType="application/mp4" codecs="wvtt" startWithSAP="1" bandwidth="430"></Representation>
        </AdaptationSet>
        <AdaptationSet segmentAlignment="true" group="3" lang="es">
            <Role schemeIdUri="urn:mpeg:dash:role:2011" value="subtitle" />
            <SegmentTemplate timescale="1000" media="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/$Number%04d$.m4s" startNumber="1" duration="4000" initialization="https://media.axprod.net/TestVectors/v7-Clear/$RepresentationID$/init.mp4" />
            <Representation id="27" mimeType="application/mp4" codecs="stpp" startWithSAP="1" bandwidth="1102"></Representation>
        </AdaptationSet>
    </Period>
</MPD>`;
