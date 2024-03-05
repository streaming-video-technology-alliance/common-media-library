export const mpdSample1: string = `<?xml version="1.0" encoding="utf-8"?>
<MPD
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="urn:mpeg:DASH:schema:MPD:2011"
type="static"
xmlns="urn:mpeg:dash:schema:mpd:2011"
profiles="urn:mpeg:dash:profile:isoff-main:2011"
mediaPresentationDuration="PT31.296S"
minBufferTime="PT10S">
    <Period duration="PT31.296S" id="evo-dash" start="PT0S">
        <AdaptationSet maxFrameRate="3000" maxHeight="1080" maxWidth="1920" par="16:9" segmentAlignment="true" startWithSAP="0">
            <ContentComponent contentType="video" id="1"/>
            <Representation bandwidth="72000" codecs="avc1.42c01e" frameRate="37" height="480" id="testStream01bbbVideo72000" mimeType="video/mp4" sar="1:1" width="854">
                <SegmentList duration="10000" timescale="1000">
                    <Initialization sourceURL="testStream01bbb/video/72000/seg_init.mp4"/>
                    <SegmentURL media="testStream01bbb/video/72000/segment_0.m4s"/>
                    <SegmentURL media="testStream01bbb/video/72000/segment_10417.m4s"/>
                    <SegmentURL media="testStream01bbb/video/72000/segment_20833.m4s"/>
                </SegmentList>
            </Representation>
        </AdaptationSet>
        <AdaptationSet lang="en" segmentAlignment="true" startWithSAP="0">
            <ContentComponent contentType="audio" id="2"/>
            <Representation audioSamplingRate="48000" bandwidth="72000" codecs="mp4a.40.2" id="testStream01bbbAudio72000" mimeType="audio/mp4">
                <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2"/>
                <SegmentList duration="10000" timescale="1000">
                    <Initialization sourceURL="testStream01bbb/audio/72000/seg_init.mp4"/>
                    <SegmentURL media="testStream01bbb/audio/72000/segment_0.m4s"/>
                    <SegmentURL media="testStream01bbb/audio/72000/segment_10432.m4s"/>
                    <SegmentURL media="testStream01bbb/audio/72000/segment_20864.m4s"/>
                </SegmentList>
            </Representation>
        </AdaptationSet>
    </Period>
</MPD>`;
