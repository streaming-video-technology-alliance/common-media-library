export const dashFromHam5 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<MPD mediaPresentationDuration="PT30S" type="static">
  <Period duration="PT30S" id="evo-dash" start="PT0S">
    <AdaptationSet id="1" group="video" contentType="video" mimeType="video/mp4" frameRate="37" lang="und" codecs="avc1.42c01e">
      <Representation id="testStream01bbbVideo72000" bandwidth="72000" mimeType="video/mp4" frameRate="37" width="854" height="480" codecs="avc1.42c01e">
        <SegmentList duration="900000" timescale="90000">
          <Initialization sourceURL="testStream01bbb/video/72000/seg_init.mp4"/>
          <SegmentURL media="testStream01bbb/video/72000/segment_0.m4s"/>
          <SegmentURL media="testStream01bbb/video/72000/segment_10417.m4s"/>
          <SegmentURL media="testStream01bbb/video/72000/segment_20833.m4s"/>
        </SegmentList>
      </Representation>
    </AdaptationSet>
    <AdaptationSet id="2" group="audio" contentType="audio" mimeType="audio/mp4" lang="en" codecs="mp4a.40.2">
      <Representation id="testStream01bbbAudio72000" bandwidth="72000" mimeType="audio/mp4" audioSamplingRate="48000" codecs="mp4a.40.2">
        <SegmentList duration="480000" timescale="48000">
          <Initialization sourceURL="testStream01bbb/audio/72000/seg_init.mp4"/>
          <SegmentURL media="testStream01bbb/audio/72000/segment_0.m4s"/>
          <SegmentURL media="testStream01bbb/audio/72000/segment_10432.m4s"/>
          <SegmentURL media="testStream01bbb/audio/72000/segment_20864.m4s"/>
        </SegmentList>
        <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2"/>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;
