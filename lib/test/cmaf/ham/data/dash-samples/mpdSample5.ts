export const mpdSample5 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<MPD>
  <Period duration="PT250H0M0S">
    <AdaptationSet id="video" group="video" contentType="video" mimeType="video/mp4" frameRate="30/1" lang="und" codecs="avc1.640028">
      <Representation id="1" bandwidth="2000000" width="1920" height="1080" codecs="avc1.640028" scanType="">
        <SegmentList duration="900000" timescale="24">
          <Initialization sourceURL="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-videoinit.cmfv" />
          <SegmentURL media="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000001.cmfv" />
          <SegmentURL media="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000002.cmfv" />
          <SegmentURL media="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000003.cmfv" />
          <SegmentURL media="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000004.cmfv" />
          <SegmentURL media="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleh264-video_000000005.cmfv" />
        </SegmentList>
      </Representation>
    </AdaptationSet>
    <AdaptationSet id="audio" group="audio" contentType="audio" mimeType="audio/mp4" lang="und" codecs="mp4a.40.2">
      <Representation id="2" bandwidth="96000">
        <SegmentList duration="900000" timescale="24">
          <Initialization sourceURL="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audioinit.cmfa" />
          <SegmentURL media="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000001.cmfa" />
          <SegmentURL media="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000002.cmfa" />
          <SegmentURL media="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000003.cmfa" />
          <SegmentURL media="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000004.cmfa" />
          <SegmentURL media="https://d11a69xzkl9ifh.cloudfront.net/output-mediaconvert/big buck bunny sampleaac-audio_000000005.cmfa" />
        </SegmentList>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;
